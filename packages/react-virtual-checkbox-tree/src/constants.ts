/**
 * The tri-state a checkbox can be in.
 *
 * Leaves are only ever `Checked` or `Unchecked`. Folders derive their state from
 * their descendants and become `Indeterminate` when some — but not all — of them
 * are checked.
 */
export enum CheckedState {
  Checked = "checked",
  Indeterminate = "indeterminate",
  Unchecked = "unchecked",
}

/** Default ID of the (never-rendered) root node. */
export const ROOT_ID = "__root__";

/** Default row height in pixels, used by the virtualizer when you don't override it. */
export const DEFAULT_ROW_HEIGHT = 32;
