import '@testing-library/jest-dom';

// ── Mock window.matchMedia (required for responsive components) ─────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// ── Mock IntersectionObserver (required for infinite scroll / lazy load) ──────
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// ── Mock ResizeObserver ──────────────────────────────────────────────────────
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver;

// ── Mock Socket.IO client ────────────────────────────────────────────────────
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: 'mock-socket-id',
  };
  return {
    default: vi.fn(() => mockSocket),
    io: vi.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

// ── Mock scrollTo ────────────────────────────────────────────────────────────
window.scrollTo = vi.fn();

// ── Suppress console.error for expected React warnings in tests ──────────────
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('act('))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
