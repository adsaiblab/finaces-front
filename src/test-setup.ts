// ═══════════════════════════════════════════════════════════
// Global Test Mocks — Required for JSDOM/Vitest environment
// ═══════════════════════════════════════════════════════════

// F-S7-01: requestAnimationFrame / cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
        return setTimeout(() => cb(Date.now()), 0) as unknown as number;
    };
    globalThis.cancelAnimationFrame = (id: number): void => {
        clearTimeout(id);
    };
}

// F-S7-01: ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as any;
}

// F-S7-06: Canvas 2D Context mock (for Chart.js)
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = ((origFn) => {
        return function (this: HTMLCanvasElement, contextId: string, ...args: any[]) {
            if (contextId === '2d') {
                return {
                    canvas: this,
                    fillRect: () => {},
                    clearRect: () => {},
                    getImageData: () => ({ data: new Array(0) }),
                    putImageData: () => {},
                    createImageData: () => [],
                    setTransform: () => {},
                    drawImage: () => {},
                    save: () => {},
                    fillText: () => {},
                    restore: () => {},
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    closePath: () => {},
                    stroke: () => {},
                    translate: () => {},
                    scale: () => {},
                    rotate: () => {},
                    arc: () => {},
                    fill: () => {},
                    measureText: () => ({ width: 0 }),
                    transform: () => {},
                    rect: () => {},
                    clip: () => {},
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    createRadialGradient: () => ({ addColorStop: () => {} }),
                    createPattern: () => ({}),
                    font: '',
                    textAlign: '',
                    textBaseline: '',
                    fillStyle: '',
                    strokeStyle: '',
                    lineWidth: 1,
                    lineCap: '',
                    lineJoin: '',
                    globalAlpha: 1,
                    globalCompositeOperation: '',
                    shadowBlur: 0,
                    shadowColor: '',
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                } as unknown as CanvasRenderingContext2D;
            }
            return origFn?.call(this, contextId, ...args) ?? null;
        };
    })(HTMLCanvasElement.prototype.getContext) as any;
}

// F-S7-01: localStorage mock (JSDOM may not persist)
if (typeof globalThis.localStorage === 'undefined') {
    const store: Record<string, string> = {};
    globalThis.localStorage = {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
    } as Storage;
}

// F-S7-01: matchMedia mock
if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    } as MediaQueryList);
}

// Angular 18+ standalone: use platform-browser testing (no zone.js, no platform-browser-dynamic)
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);
