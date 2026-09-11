/**
 * A tiny TSX tokenizer for the playground's generated snippet.
 *
 * Shiki highlights every other code block on this site, but it runs at build
 * time and the playground's code changes as you move a slider. Shipping Shiki to
 * the browser would cost more than the library being documented — roughly a
 * megabyte of WASM and grammars on a page whose entire claim is that it is small
 * and fast. So this handles the narrow, fully-controlled subset of TSX that
 * `buildSnippet` emits, in about sixty lines.
 *
 * It deliberately produces the same shape Shiki does: a `.shiki` container and
 * spans carrying `--shiki-dark` / `--shiki-light` custom properties. The rules
 * already in globals.css that map those to `color` per theme then apply here
 * unchanged, so the playground matches the docs blocks exactly and light/dark
 * switching is free.
 *
 * Colours are github-dark-default / github-light-default, the same pair Shiki is
 * configured with in next.config.ts.
 */
export type TokenKind =
  | "attr"
  | "comment"
  | "fn"
  | "keyword"
  | "literal"
  | "plain"
  | "string"
  | "tag";

export type Token = { kind: TokenKind; text: string };

/** [dark, light] — matches the two Shiki themes configured for the MDX pipeline. */
const PALETTE: Record<Exclude<TokenKind, "plain">, [string, string]> = {
  attr: ["#79C0FF", "#0550AE"],
  comment: ["#8B949E", "#59636E"],
  fn: ["#D2A8FF", "#8250DF"],
  keyword: ["#FF7B72", "#CF222E"],
  literal: ["#79C0FF", "#0550AE"],
  string: ["#A5D6FF", "#0A3069"],
  tag: ["#7EE787", "#116329"],
};

export const BASE_COLOR: [string, string] = ["#E6EDF3", "#1F2328"];

// Order matters: comments and strings must win before anything can match inside
// them, and `=>` must be claimed before `>` could be read as a JSX bracket.
const MASTER = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*)`,
    String.raw`(?<string>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\`(?:[^\`\\]|\\.)*\`)`,
    String.raw`(?<arrow>=>)`,
    // Capitalised components, the handful of lowercase host elements this
    // snippet uses, and fragments. Anything else starting with `<` is left
    // alone so generics like `useState<string[]>` are not mistaken for tags.
    String.raw`(?<tag><\/?(?:[A-Z][A-Za-z0-9.]*|span|input|div|button|label)\b|<>|<\/>|\/>)`,
    String.raw`(?<keyword>\b(?:as|const|default|export|from|function|import|let|new|return|type|typeof|void)\b)`,
    String.raw`(?<fn>\b(?:console|useCallback|useMemo|useState)\b)`,
    String.raw`(?<literal>\b(?:false|null|true|undefined)\b|\b\d+(?:_\d+)*\b)`,
    String.raw`(?<attr>\b[A-Za-z][\w-]*(?=\s*=(?!=)))`,
  ].join("|"),
  "g"
);

export function tokenizeTsx(code: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;

  for (const match of code.matchAll(MASTER)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "plain", text: code.slice(last, index) });

    const groups = match.groups ?? {};
    // `arrow` is matched only to stop `>` being read as a JSX bracket; it is not
    // coloured, so it falls through as plain.
    const kind = (Object.keys(groups).find((k) => groups[k] !== undefined) ??
      "plain") as TokenKind | "arrow";

    tokens.push({ kind: kind === "arrow" ? "plain" : kind, text: match[0] });
    last = index + match[0].length;
  }

  if (last < code.length) tokens.push({ kind: "plain", text: code.slice(last) });
  return tokens;
}

/** Inline style for a token, in the same custom-property form Shiki emits. */
export function tokenStyle(kind: TokenKind): undefined | { [key: string]: string } {
  if (kind === "plain") return undefined;
  const [dark, light] = PALETTE[kind];
  return { "--shiki-dark": dark, "--shiki-light": light };
}
