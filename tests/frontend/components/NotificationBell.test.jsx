import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import notificationsReducer from '@/features/notifications/notificationsSlice';
import authReducer from '@/features/auth/authSlice';

// Mock useNotifications hook to control state
const mockToggle = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockMarkAsRead = vi.fn();
const mockClearAll = vi.fn();
const mockDeleteOne = vi.fn();

let mockHookReturn = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  markAsRead: mockMarkAsRead,
  markAllAsRead: mockMarkAllAsRead,
  clearAll: mockClearAll,
  deleteOne: mockDeleteOne,
  toggle: mockToggle,
  isOpen: false,
};

vi.mock('@/hooks/useNotifications', () => ({
  default: () => mockHookReturn,
}));

// Import after mock
import NotificationBell from '@/features/notifications/components/NotificationBell';

function renderBell(overrides = {}) {
  mockHookReturn = { ...mockHookReturn, ...overrides };
  const store = configureStore({
    reducer: {
      notifications: notificationsReducer,
      auth: authReducer,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </Provider>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      clearAll: mockClearAll,
      deleteOne: mockDeleteOne,
      toggle: mockToggle,
      isOpen: false,
    };
  });

  it('renders the bell button', () => {
    renderBell();
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('shows unread count when > 0', () => {
    renderBell({ unreadCount: 5 });
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show count badge when unreadCount is 0', () => {
    renderBell({ unreadCount: 0 });
    const badge = screen.queryByText('0');
    // The badge span should not render when count is 0
    expect(badge).not.toBeInTheDocument();
  });

  it('shows 99+ when count > 99', () => {
    renderBell({ unreadCount: 150 });
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls toggle on bell click', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows dropdown panel when isOpen is true', () => {
    renderBell({
      isOpen: true,
      notifications: [
        {
          _id: 'n1',
          title: 'Test Notification',
          message: 'Hello world',
          type: 'task',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    });
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
  });

  it('mark all read button calls markAllAsRead', () => {
    renderBell({ isOpen: true, unreadCount: 3 });
    const markAllBtn = screen.getByText(/mark all read/i);
    fireEvent.click(markAllBtn);
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('shows empty state when no notifications and panel is open', () => {
    renderBell({ isOpen: true, notifications: [], unreadCount: 0 });
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });
});
