import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ResizeObserver mock for recharts
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
