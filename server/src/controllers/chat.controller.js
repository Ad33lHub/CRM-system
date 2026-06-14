import Channel from '../models/Channel.model.js';
import Message from '../models/Message.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/apiResponse.js';

export const getChannels = asyncHandler(async (req, res) => {
  let channels = await Channel.find({
    $or: [{ type: { $in: ['general', 'random'] } }, { members: req.user._id }],
  }).populate('members', 'firstName lastName email avatar role');

  // If no channels exist, scaffold defaults
  if (channels.length === 0) {
    const general = await Channel.create({ name: 'general', type: 'general' });
    const random = await Channel.create({ name: 'random', type: 'general' });
    channels = [general, random];
  }

  return successResponse(res, channels, 'Channels fetched successfully');
});

export const getMessages = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const messages = await Message.find({ channel: channelId })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName email avatar role');

  return successResponse(res, messages, 'Messages fetched successfully');
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { channelId, content, attachments } = req.body;
  const userId = req.user._id;

  const msg = await Message.create({
    channel: channelId,
    sender: userId,
    content: content || '',
    attachments: attachments || [],
  });

  const populatedMsg = await Message.findById(msg._id).populate(
    'sender',
    'firstName lastName email avatar role'
  );

  return successResponse(res, populatedMsg, 'Message sent successfully', 201);
});
