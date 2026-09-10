import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
  // The site imports the library through its real `exports` map, from the real
  // dist/ build — so shipping a broken entry point breaks this site's build
  // before it ever reaches npm. `prebuild` and `predev` keep dist fresh.
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    return [{ source: "/docs/api", destination: "/docs/api/tree", permanent: false }];
  },
};

// Turbopack requires plugin options to be serializable, so plugins are named
// rather than imported. Shiki runs here at build time — no highlighter ships to
// the browser.
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [
      ["rehype-slug", {}],
      ["rehype-autolink-headings", { behavior: "wrap", properties: { className: "heading-anchor" } }],
      [
        "@shikijs/rehype",
        {
          themes: { dark: "github-dark-default", light: "github-light-default" },
          defaultColor: false,
        },
      ],
    ],
  },
});

export default withMDX(config);
