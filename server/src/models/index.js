// Importing this module registers all Mongoose schemas and applies the
// global Mongoose configuration (via each model importing config/mongoose.js).
import '../config/mongoose.js';

import User from './User.model.js';
import Client from './Client.model.js';
import Lead from './Lead.model.js';
import Project from './Project.model.js';
import Task from './Task.model.js';
import Invoice from './Invoice.model.js';
import Employee from './Employee.model.js';
import Notification from './Notification.model.js';
import AuditLog from './AuditLog.model.js';
import RefreshToken from './RefreshToken.model.js';
import ClientNote from './ClientNote.model.js';
import ClientStatusLog from './ClientStatusLog.model.js';
import UploadLog from './UploadLog.model.js';
import Document from './Document.model.js';
import Attendance from './Attendance.model.js';
import Channel from './Channel.model.js';
import Message from './Message.model.js';
import Meeting from './Meeting.model.js';
import Proposal from './Proposal.model.js';
import Reminder from './Reminder.model.js';

export {
  User,
  Client,
  Lead,
  Project,
  Task,
  Invoice,
  Employee,
  Notification,
  AuditLog,
  RefreshToken,
  ClientNote,
  ClientStatusLog,
  UploadLog,
  Document,
  Attendance,
  Channel,
  Message,
  Meeting,
  Proposal,
  Reminder,
};

export default {
  User,
  Client,
  Lead,
  Project,
  Task,
  Invoice,
  Employee,
  Notification,
  AuditLog,
  RefreshToken,
  ClientNote,
  ClientStatusLog,
  UploadLog,
  Document,
  Attendance,
  Channel,
  Message,
  Meeting,
  Proposal,
  Reminder,
};
