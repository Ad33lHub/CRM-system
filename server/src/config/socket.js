import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './env.js';
import logger from '../utils/logger.js';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notification.service.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id;
    const userRole = socket.user.role;

    logger.info(`User ${userId} connected via Socket.IO`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    // Handle notification:read from client
    socket.on('notification:read', async (notificationId) => {
      try {
        await markNotificationRead(notificationId, userId);
      } catch (err) {
        logger.error(`Failed to mark notification read: ${err.message}`);
      }
    });

    // Handle notification:read-all from client
    socket.on('notification:read-all', async () => {
      try {
        await markAllNotificationsRead(userId);
      } catch (err) {
        logger.error(`Failed to mark all notifications read: ${err.message}`);
      }
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
      if (userRole) {
        socket.leave(`role:${userRole}`);
      }
      logger.info(`User ${userId} disconnected from socket`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

export default io;
