import { ImageResponse } from "next/og";

import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Only system fonts: a remote font fetch is one more thing that can fail at
// build time, and this image has to render on every deploy without asking the
// network for permission.
const CHIPS = ["100,000 nodes", "1–3 µs cascade", "22 rows in the DOM", "0 lines of CSS"];

// A miniature of the component itself, rather than empty space. Three states are
// on screen at once — checked, indeterminate, unchecked — because the tri-state
// parent is the thing this library is actually about.
const ROWS = [
  { state: "mixed", label: "src", depth: 0, folder: true },
  { state: "on", label: "engine.ts", depth: 1, folder: false },
  { state: "mixed", label: "ui", depth: 1, folder: true },
  { state: "on", label: "tree.tsx", depth: 2, folder: false },
  { state: "off", label: "row.tsx", depth: 2, folder: false },
  { state: "off", label: "docs", depth: 0, folder: true },
] as const;

function Box({ state }: { state: "mixed" | "off" | "on" }) {
  const filled = state === "on";
  const mixed = state === "mixed";
  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: filled ? "#3b82f6" : "transparent",
        border: `2px solid ${filled || mixed ? "#3b82f6" : "#3f3f3f"}`,
        borderRadius: 4,
        display: "flex",
        height: 20,
        justifyContent: "center",
        width: 20,
      }}
    >
      {/* A tick for checked and a dash for indeterminate — if both rendered as a
          bar, the one distinction this image exists to show would be invisible. */}
      {filled && (
        <svg fill="none" height="12" stroke="#0a0a0a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" width="12">
          <path d="m4 12 6 6L20 6" />
        </svg>
      )}
      {mixed && <div style={{ backgroundColor: "#3b82f6", display: "flex", height: 3, width: 11 }} />}
    </div>
  );
}

/**
 * The 1200x630 card. The Satori renderer behind ImageResponse supports a subset
 * of flexbox and nothing else, so every element with more than one child sets
 * `display: "flex"` explicitly — the default there is `flex`, but being
 * explicit is what keeps this from silently collapsing on a renderer upgrade.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%",
        }}
      >
        <div style={{ alignItems: "flex-start", display: "flex", gap: 44 }}>
          <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <div
              style={{
                color: "#7c9cf5",
                fontFamily: MONO,
                fontSize: 20,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              React · headless · virtualized
            </div>
            <div
              style={{
                color: "#fafafa",
                fontFamily: MONO,
                fontSize: 46,
                letterSpacing: -1,
                marginTop: 24,
              }}
            >
              {site.name}
            </div>
            <div
              style={{
                color: "#a8a8a8",
                fontFamily: SANS,
                fontSize: 30,
                lineHeight: 1.3,
                marginTop: 20,
                maxWidth: 600,
              }}
            >
              {site.tagline}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#141414",
              border: "1px solid #2b2b2b",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "22px 26px",
              width: 360,
            }}
          >
            {ROWS.map((row) => (
              <div
                key={row.label}
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: 12,
                  paddingLeft: row.depth * 26,
                }}
              >
                <Box state={row.state} />
                <div
                  style={{
                    color: row.folder ? "#fafafa" : "#8f8f8f",
                    display: "flex",
                    fontFamily: MONO,
                    fontSize: 22,
                  }}
                >
                  {row.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ backgroundColor: "#2b2b2b", display: "flex", height: 1, width: "100%" }} />
          <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
            {CHIPS.map((chip) => (
              <div
                key={chip}
                style={{
                  border: "1px solid #2b2b2b",
                  borderRadius: 8,
                  color: "#d4d4d4",
                  display: "flex",
                  fontFamily: MONO,
                  fontSize: 26,
                  padding: "12px 20px",
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
