import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { vi } from 'vitest';

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);


// ─── requestAnimationFrame / cancelAnimationFrame ─────────────────────────
globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  cb(performance.now());
  return 1;
});
globalThis.cancelAnimationFrame = vi.fn();

// ─── ResizeObserver ───────────────────────────────────────────────────────
// Must be a class (not vi.fn()) for Angular CDK `new ResizeObserver(...)` calls
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = MockResizeObserver as any;

// ─── window.matchMedia ────────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── IntersectionObserver ─────────────────────────────────────────────────
class MockIntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}
globalThis.IntersectionObserver = MockIntersectionObserver as any;

// ─── Canvas 2D Context ────────────────────────────────────────────────────
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  strokeRect: vi.fn(),
  strokeText: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

// ─── URL.createObjectURL / revokeObjectURL ─────────────────────────────────
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
globalThis.URL.revokeObjectURL = vi.fn();

// ─── localStorage / sessionStorage ────────────────────────────────────────
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: storageMock });
Object.defineProperty(globalThis, 'sessionStorage', { value: storageMock });
