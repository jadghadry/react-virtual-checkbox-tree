import { createHighlighter, type Highlighter } from "shiki";

let instance: Promise<Highlighter> | null = null;

/**
 * One highlighter for the whole build. Shiki runs on the server only — shipping
 * its WASM to the client would cost more than the library being documented.
 */
function get() {
  instance ??= createHighlighter({
    langs: ["tsx", "ts", "bash", "json", "css", "diff"],
    themes: ["github-dark-default", "github-light-default"],
  });
  return instance;
}

export async function highlight(code: string, lang = "tsx") {
  const highlighter = await get();
  return highlighter.codeToHtml(code.trim(), {
    lang,
    themes: { dark: "github-dark-default", light: "github-light-default" },
    defaultColor: false,
    colorReplacements: { "#0d1117": "transparent", "#ffffff": "transparent" },
  });
}
