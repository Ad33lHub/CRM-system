import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isOpen: false,
};

const getId = (n) => n.id || n._id;

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action) {
      const existing = state.notifications.find(
        (n) => getId(n) === getId(action.payload)
      );
      if (!existing) {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    markAsRead(state, action) {
      const id = action.payload;
      const notification = state.notifications.find(
        (n) => getId(n) === id
      );
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      state.notifications.forEach((n) => {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      });
      state.unreadCount = 0;
    },
    removeNotification(state, action) {
      const id = action.payload;
      const notification = state.notifications.find(
        (n) => getId(n) === id
      );
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        (n) => getId(n) !== id
      );
    },
    setNotifications(state, action) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.isRead).length;
    },
    toggleNotificationPanel(state) {
      state.isOpen = !state.isOpen;
    },
    closeNotificationPanel(state) {
      state.isOpen = false;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setNotifications,
  toggleNotificationPanel,
  closeNotificationPanel,
} = notificationsSlice.actions;

export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectIsNotificationOpen = (state) => state.notifications.isOpen;

export default notificationsSlice.reducer;
