import Channel from '../models/Channel.model.js';
import Message from '../models/Message.model.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, forbidden } from '../utils/apiResponse.js';

/* ── helpers ─────────────────────────────────────────────────────── */

const ADMIN_ROLES = ['super_admin', 'admin'];
const MANAGER_ROLES = [...ADMIN_ROLES, 'manager'];

function isAdmin(role) {
  return ADMIN_ROLES.includes(role);
}

/* ── channels ────────────────────────────────────────────────────── */

export const getChannels = asyncHandler(async (req, res) => {
  let channels = await Channel.find({
    isArchived: { $ne: true },
    $or: [{ type: { $in: ['general', 'random'] } }, { members: req.user._id }],
  }).populate('members', 'firstName lastName email avatar role');

  // If no channels exist, scaffold defaults
  if (channels.length === 0) {
    const general = await Channel.create({ name: 'general', type: 'general', createdBy: req.user._id });
    const random = await Channel.create({ name: 'random', type: 'general', createdBy: req.user._id });
    channels = [general, random];
  }

  return successResponse(res, channels, 'Channels fetched successfully');
});

export const createChannel = asyncHandler(async (req, res) => {
  // Only admin / super_admin can create channels
  if (!isAdmin(req.user.role)) {
    return forbidden(res, 'Only admins can create channels');
  }

  const { name, type, members } = req.body;
  const channel = await Channel.create({
    name,
    type,
    members: members || [],
    createdBy: req.user._id,
  });

  const populated = await Channel.findById(channel._id).populate(
    'members',
    'firstName lastName email avatar role'
  );

  return successResponse(res, populated, 'Channel created successfully', 201);
});

export const archiveChannel = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) {
    return forbidden(res, 'Only admins can archive channels');
  }

  const { channelId } = req.params;
  const channel = await Channel.findById(channelId);
  if (!channel) {
    return successResponse(res, null, 'Channel not found', 404);
  }

  channel.isArchived = true;
  channel.archivedAt = new Date();
  channel.archivedBy = req.user._id;
  await channel.save();

  return successResponse(res, channel, 'Channel archived successfully');
});

/* ── messages ────────────────────────────────────────────────────── */

export const getMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id.toString();
  const userRole = req.user.role;

  // Build filter: show messages the user is allowed to see
  // - 'everyone' messages
  // - DMs sent to this user
  // - DMs sent by this user
  // - Role-group messages targeting this user's role
  const messages = await Message.find({
    channel: channelId,
    isDeleted: { $ne: true },
    $or: [
      { recipient: 'everyone' },
      { recipient: userId },
      { sender: req.user._id, recipient: { $ne: 'everyone' } },
      { recipient: `role:${userRole}` },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName email avatar role')
    .populate('pinnedBy', 'firstName lastName');

  return successResponse(res, messages, 'Messages fetched successfully');
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { channelId, content, attachments, recipient } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // ── Role-based recipient restrictions ──
  // ADMIN/SUPER_ADMIN: can send to everyone, any individual, any role group
  // MANAGER: can send to everyone or any individual (no role group to outside scope)
  // USER roles (developer/designer/qa_engineer): can send to everyone or individual only (no role groups)
  if (recipient && recipient.startsWith('role:')) {
    if (!isAdmin(userRole)) {
      return forbidden(res, 'Only admins can send messages to role groups');
    }
  }

  // Get the member count for "sent to all X members" receipt
  const channel = await Channel.findById(channelId);
  const memberCount = channel?.members?.length || 0;

  const msg = await Message.create({
    channel: channelId,
    sender: userId,
    content: content || '',
    recipient: recipient || 'everyone',
    attachments: attachments || [],
  });

  const populatedMsg = await Message.findById(msg._id).populate(
    'sender',
    'firstName lastName email avatar role'
  );

  // Attach member count for broadcast messages
  const responseData = populatedMsg.toJSON();
  if (!recipient || recipient === 'everyone') {
    responseData.broadcastCount = memberCount;
  }

  return successResponse(res, responseData, 'Message sent successfully', 201);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const msg = await Message.findById(messageId);

  if (!msg) {
    return successResponse(res, null, 'Message not found', 404);
  }

  // Admin can delete any message; others can only delete their own
  if (!isAdmin(req.user.role) && msg.sender.toString() !== req.user._id.toString()) {
    return forbidden(res, 'You can only delete your own messages');
  }

  msg.isDeleted = true;
  msg.deletedBy = req.user._id;
  msg.deletedAt = new Date();
  await msg.save();

  return successResponse(res, { id: messageId }, 'Message deleted successfully');
});

export const pinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  if (!isAdmin(req.user.role)) {
    return forbidden(res, 'Only admins can pin messages');
  }

  const msg = await Message.findById(messageId);
  if (!msg) {
    return successResponse(res, null, 'Message not found', 404);
  }

  msg.isPinned = !msg.isPinned;
  msg.pinnedBy = msg.isPinned ? req.user._id : null;
  msg.pinnedAt = msg.isPinned ? new Date() : null;
  await msg.save();

  const populatedMsg = await Message.findById(msg._id)
    .populate('sender', 'firstName lastName email avatar role')
    .populate('pinnedBy', 'firstName lastName');

  return successResponse(
    res,
    populatedMsg,
    msg.isPinned ? 'Message pinned' : 'Message unpinned'
  );
});

/* ── channel members (for the right panel) ───────────────────────── */

export const getChannelMembers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const channel = await Channel.findById(channelId).populate(
    'members',
    'firstName lastName email avatar role'
  );

  if (!channel) {
    return successResponse(res, [], 'Channel not found');
  }

  // If general/random channel has no explicit members, return all active users
  if (['general', 'random'].includes(channel.type) || channel.name === 'general' || channel.name === 'random') {
    const allUsers = await User.find({ isActive: true })
      .select('firstName lastName email avatar role')
      .sort({ firstName: 1 });
    return successResponse(res, allUsers, 'Channel members fetched');
  }

  return successResponse(res, channel.members || [], 'Channel members fetched');
});
