import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/index.js';
import {
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  setNotifications,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
  selectIsNotificationOpen,
  toggleNotificationPanel,
} from '../features/notifications/notificationsSlice.js';
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useClearReadNotificationsMutation,
  useDeleteNotificationMutation,
} from '../services/notificationsApi.js';

export const useNotifications = () => {
  const dispatch = useDispatch();
  const notifications = useAppSelector(selectNotifications) || [];
  const unreadCount = useAppSelector(selectUnreadCount) || 0;
  const isOpen = useAppSelector(selectIsNotificationOpen);

  const { data, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 20 },
    { pollingInterval: 120000 }
  );

  const [markReadMutation] = useMarkReadMutation();
  const [markAllReadMutation] = useMarkAllReadMutation();
  const [clearReadMutation] = useClearReadNotificationsMutation();
  const [deleteMutation] = useDeleteNotificationMutation();

  useEffect(() => {
    if (data?.data?.notifications) {
      dispatch(setNotifications(data.data.notifications));
    }
  }, [data, dispatch]);

  const markAsRead = async (id) => {
    dispatch(markAsReadAction(id));
    try {
      await markReadMutation(id).unwrap();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    dispatch(markAllAsReadAction());
    try {
      await markAllReadMutation().unwrap();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const clearAll = async () => {
    try {
      await clearReadMutation().unwrap();
      const remaining = notifications.filter((n) => !n.isRead);
      dispatch(setNotifications(remaining));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  const deleteOne = async (id) => {
    dispatch(removeNotification(id));
    try {
      await deleteMutation(id).unwrap();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteOne,
    toggle: () => dispatch(toggleNotificationPanel()),
  };
};

export default useNotifications;
