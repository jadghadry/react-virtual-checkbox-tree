import "@testing-library/jest-dom/vitest";

// jsdom gives every element a zero bounding box, so @tanstack/react-virtual
// would compute a zero-height viewport and render no rows. Report a real size
// so the virtualizer has a window to work with.
const RECT = { bottom: 0, height: 600, left: 0, right: 0, top: 0, width: 400, x: 0, y: 0 };

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value() {
    return { ...RECT, toJSON: () => RECT };
  },
});
Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 600 });
Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 400 });
Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 600 });
Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 400 });

globalThis.ResizeObserver ??= class {
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

globalThis.scrollTo ??= (() => {}) as typeof globalThis.scrollTo;
Element.prototype.scrollTo ??= function scrollTo() {};
