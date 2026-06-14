import ClientNote from '../models/ClientNote.model.js';
import Client from '../models/Client.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  successResponse,
  paginatedResponse,
  notFound,
  forbidden,
  errorResponse,
} from '../utils/apiResponse.js';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination.js';
import { createNotification } from '../services/notification.service.js';

export const getNotes = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const { skip, limit: lim, page: pg } = getPaginationParams({ page, limit });

  const filter = { client: req.params.clientId, isDeleted: false };
  if (search) {
    filter.$text = { $search: search };
  }

  const [notes, total] = await Promise.all([
    ClientNote.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .populate('author', 'firstName lastName avatar role')
      .populate('pinnedBy', 'firstName lastName'),
    ClientNote.countDocuments(filter),
  ]);

  const pagination = buildPaginationMeta(total, pg, lim);
  return paginatedResponse(res, notes, pagination, 'Notes fetched successfully');
});

export const createNote = asyncHandler(async (req, res) => {
  const { clientId } = req.params;
  const client = await Client.findOne({ _id: clientId, isDeleted: false });
  if (!client) {
    return notFound(res, 'Client');
  }

  let { content, contentText } = req.body;
  if (!contentText) {
    contentText = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
  }

  const note = await ClientNote.create({
    client: clientId,
    content,
    contentText,
    author: req.user._id,
  });

  await note.populate('author', 'firstName lastName avatar role');

  // Notify mentioned users
  if (note.mentions && note.mentions.length > 0) {
    for (const userId of note.mentions) {
      // Avoid sending notifications if it's the author themselves
      if (userId.toString() !== req.user._id.toString()) {
        createNotification({
          recipient: userId,
          type: 'mention',
          title: 'You were mentioned in a note',
          message: `${req.user.firstName} mentioned you in a note for ${client.companyName}`,
          link: `/clients/${clientId}?tab=notes`,
        }).catch(() => {});
      }
    }
  }

  return successResponse(res, note, 'Note created successfully', 201);
});

export const updateNote = asyncHandler(async (req, res) => {
  const { clientId, noteId } = req.params;
  const note = await ClientNote.findOne({
    _id: noteId,
    client: clientId,
    isDeleted: false,
  });

  if (!note) {
    return notFound(res, 'Note');
  }

  if (
    note.author.toString() !== req.user._id.toString() &&
    !['super_admin', 'admin'].includes(req.user.role)
  ) {
    return forbidden(res, 'You can only edit your own notes');
  }

  note.content = req.body.content;
  if (req.body.contentText) {
    note.contentText = req.body.contentText;
  }
  await note.save();

  await note.populate('author', 'firstName lastName avatar role');
  await note.populate('pinnedBy', 'firstName lastName');

  return successResponse(res, note, 'Note updated successfully');
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { clientId, noteId } = req.params;
  const note = await ClientNote.findOne({
    _id: noteId,
    client: clientId,
    isDeleted: false,
  });

  if (!note) {
    return notFound(res, 'Note');
  }

  if (
    note.author.toString() !== req.user._id.toString() &&
    !['super_admin', 'admin'].includes(req.user.role)
  ) {
    return forbidden(res, 'You can only delete your own notes');
  }

  note.isDeleted = true;
  note.deletedAt = new Date();
  await note.save();

  return successResponse(res, null, 'Note deleted');
});

export const togglePin = asyncHandler(async (req, res) => {
  const { clientId, noteId } = req.params;
  const note = await ClientNote.findOne({
    _id: noteId,
    client: clientId,
    isDeleted: false,
  });

  if (!note) {
    return notFound(res, 'Note');
  }

  if (!note.isPinned) {
    const pinnedCount = await ClientNote.countDocuments({
      client: clientId,
      isPinned: true,
      isDeleted: false,
    });
    if (pinnedCount >= 5) {
      return errorResponse(res, 'Maximum 5 notes can be pinned per client', 400);
    }
  }

  note.isPinned = !note.isPinned;
  note.pinnedAt = note.isPinned ? new Date() : null;
  note.pinnedBy = note.isPinned ? req.user._id : null;
  await note.save();

  await note.populate('author', 'firstName lastName avatar role');
  await note.populate('pinnedBy', 'firstName lastName');

  return successResponse(
    res,
    note,
    note.isPinned ? 'Note pinned successfully' : 'Note unpinned successfully'
  );
});

export default {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
};
