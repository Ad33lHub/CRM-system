import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { connectSocket, getSocket, disconnectSocket } from '../lib/socket.js';
import useAuth from './useAuth.js';
import {
  addNotification,
  markAsRead,
  markAllAsRead,
} from '../features/notifications/notificationsSlice.js';
import { toast } from 'sonner';

let broadcastChannel = null;

export const useSocket = () => {
  const { accessToken } = useAuth();
  const dispatch = useDispatch();
  const isConnected = useRef(false);

  useEffect(() => {
    if (accessToken && !isConnected.current) {
      const socket = connectSocket(accessToken);
      isConnected.current = true;

      socket.on('notification:new', (notification) => {
        dispatch(addNotification(notification));
        if (['invoice', 'project'].includes(notification.type)) {
          toast(notification.title, {
            description: notification.message,
            duration: 5000,
          });
        }
        // Broadcast to other tabs
        broadcastChannel?.postMessage({ type: 'new', notification });
      });

      socket.on('notification:read', (notificationId) => {
        dispatch(markAsRead(notificationId));
        broadcastChannel?.postMessage({ type: 'read', id: notificationId });
      });

      socket.on('notification:read-all', () => {
        dispatch(markAllAsRead());
        broadcastChannel?.postMessage({ type: 'read-all' });
      });

      socket.on('disconnect', (reason) => {
        isConnected.current = false;
        if (reason === 'io server disconnect') {
          setTimeout(() => connectSocket(accessToken), 3000);
        }
      });

      // BroadcastChannel for cross-tab sync
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel('crm_notifications');
        broadcastChannel.onmessage = (event) => {
          const { type, id, notification } = event.data;
          if (type === 'new') dispatch(addNotification(notification));
          if (type === 'read') dispatch(markAsRead(id));
          if (type === 'read-all') dispatch(markAllAsRead());
        };
      }
    }

    return () => {
      if (!accessToken) {
        disconnectSocket();
        isConnected.current = false;
        broadcastChannel?.close();
        broadcastChannel = null;
      }
    };
  }, [accessToken, dispatch]);

  return { socket: getSocket(), isConnected: isConnected.current };
};

export default useSocket;
