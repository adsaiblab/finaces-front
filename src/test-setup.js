// ═══════════════════════════════════════════════════════════
// Global Test Mocks — Required for JSDOM/Vitest environment
// ═══════════════════════════════════════════════════════════

if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb) => {
        return setTimeout(() => cb(Date.now()), 0);
    };
    globalThis.cancelAnimationFrame = (id) => {
        clearTimeout(id);
    };
}

if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = ((origFn) => {
        return function (contextId, ...args) {
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
                    resetTransform: () => {},
                    isPointInPath: () => false,
                    isPointInStroke: () => false,
                };
            }
            return origFn?.call(this, contextId, ...args) ?? null;
        };
    })(HTMLCanvasElement.prototype.getContext);
}

if (typeof globalThis.localStorage === 'undefined') {
    const store = {};
    globalThis.localStorage = {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] ?? null,
    };
}

if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

// ═══════════════════════════════════════════════════════════
// TestBed initialization — Zoneless mode via @analogjs/vitest-angular
// ═══════════════════════════════════════════════════════════
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({ zoneless: true });
