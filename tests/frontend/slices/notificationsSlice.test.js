import { describe, it, expect } from 'vitest';
import notificationsReducer, {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setNotifications,
  toggleNotificationPanel,
  closeNotificationPanel,
  selectNotifications,
  selectUnreadCount,
  selectIsNotificationOpen,
} from '@/features/notifications/notificationsSlice';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isOpen: false,
};

const mockNotification = (overrides = {}) => ({
  _id: `notif-${Date.now()}-${Math.random()}`,
  title: 'Test Notification',
  message: 'This is a test',
  type: 'task',
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('notificationsSlice', () => {
  it('should return initial state', () => {
    expect(notificationsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('addNotification', () => {
    it('adds unread notification and increments count', () => {
      const notif = mockNotification({ _id: 'n1' });
      const state = notificationsReducer(initialState, addNotification(notif));
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });

    it('does not add duplicate notification', () => {
      const notif = mockNotification({ _id: 'dup-1' });
      let state = notificationsReducer(initialState, addNotification(notif));
      state = notificationsReducer(state, addNotification(notif));
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
    });

    it('does not increment count for already-read notification', () => {
      const notif = mockNotification({ _id: 'read-1', isRead: true });
      const state = notificationsReducer(initialState, addNotification(notif));
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read and decrements count', () => {
      const notif = mockNotification({ _id: 'mr-1' });
      let state = notificationsReducer(initialState, addNotification(notif));
      expect(state.unreadCount).toBe(1);

      state = notificationsReducer(state, markAsRead('mr-1'));
      expect(state.unreadCount).toBe(0);
      expect(state.notifications[0].isRead).toBe(true);
      expect(state.notifications[0].readAt).toBeTruthy();
    });

    it('does not decrement below 0', () => {
      const notif = mockNotification({ _id: 'mr-2', isRead: true });
      let state = notificationsReducer(initialState, addNotification(notif));
      state = notificationsReducer(state, markAsRead('mr-2'));
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read and sets count to 0', () => {
      let state = initialState;
      state = notificationsReducer(state, addNotification(mockNotification({ _id: 'a1' })));
      state = notificationsReducer(state, addNotification(mockNotification({ _id: 'a2' })));
      state = notificationsReducer(state, addNotification(mockNotification({ _id: 'a3' })));
      expect(state.unreadCount).toBe(3);

      state = notificationsReducer(state, markAllAsRead());
      expect(state.unreadCount).toBe(0);
      state.notifications.forEach((n) => {
        expect(n.isRead).toBe(true);
        expect(n.readAt).toBeTruthy();
      });
    });
  });

  describe('removeNotification', () => {
    it('removes notification and decrements count if unread', () => {
      const notif = mockNotification({ _id: 'rm-1' });
      let state = notificationsReducer(initialState, addNotification(notif));
      state = notificationsReducer(state, removeNotification('rm-1'));
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('setNotifications', () => {
    it('replaces all notifications and computes unread count', () => {
      const list = [
        mockNotification({ _id: 's1', isRead: false }),
        mockNotification({ _id: 's2', isRead: true }),
        mockNotification({ _id: 's3', isRead: false }),
      ];
      const state = notificationsReducer(initialState, setNotifications(list));
      expect(state.notifications).toHaveLength(3);
      expect(state.unreadCount).toBe(2);
    });
  });

  describe('toggleNotificationPanel', () => {
    it('toggles isOpen state', () => {
      let state = notificationsReducer(initialState, toggleNotificationPanel());
      expect(state.isOpen).toBe(true);
      state = notificationsReducer(state, toggleNotificationPanel());
      expect(state.isOpen).toBe(false);
    });
  });

  describe('closeNotificationPanel', () => {
    it('sets isOpen to false', () => {
      const openState = { ...initialState, isOpen: true };
      const state = notificationsReducer(openState, closeNotificationPanel());
      expect(state.isOpen).toBe(false);
    });
  });

  describe('selectors', () => {
    const rootState = {
      notifications: {
        notifications: [mockNotification({ _id: 'sel-1', isRead: false })],
        unreadCount: 1,
        isOpen: true,
      },
    };

    it('selectNotifications returns notifications array', () => {
      expect(selectNotifications(rootState)).toHaveLength(1);
    });

    it('selectUnreadCount returns count', () => {
      expect(selectUnreadCount(rootState)).toBe(1);
    });

    it('selectIsNotificationOpen returns isOpen', () => {
      expect(selectIsNotificationOpen(rootState)).toBe(true);
    });
  });
});
