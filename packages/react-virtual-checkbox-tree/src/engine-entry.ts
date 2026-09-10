// The `react-virtual-checkbox-tree/engine` entry point.
//
// Deliberately free of React and of "use client": the Engine is a plain class,
// so it can run in a Server Component, in a Node script, or in a test without
// dragging the renderer or @tanstack/react-virtual into the bundle.
export { CheckedState, DEFAULT_ROW_HEIGHT, ROOT_ID } from "./constants";
export { Engine, type EngineOptions } from "./engine";
export type { SearchScope, TreeDefinition, TreeItem, VisibleItem } from "./types";
