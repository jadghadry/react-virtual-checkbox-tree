import type { MetadataRoute } from "next";

import { allDocs, comparisons, examples } from "@/lib/docs-nav";
import { site } from "@/lib/site";

/**
 * Every route on the site, enumerated from the same nav data the sidebar uses.
 *
 * Nothing is hardcoded here: adding a page to `docsNav`, `comparisons` or
 * `examples` in `@/lib/docs-nav` puts it in the sitemap on the next build. A
 * sitemap that drifts from the nav is worse than no sitemap at all.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${site.url}${path}`;

  const landing: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: url("/playground"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/examples"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/compare"), lastModified, changeFrequency: "monthly", priority: 0.8 },
  ];

  // /docs is the section index and outranks the pages beneath it.
  const docs: MetadataRoute.Sitemap = allDocs.map((doc) => ({
    url: url(doc.href),
    lastModified,
    changeFrequency: "monthly",
    priority: doc.href === "/docs" ? 0.9 : 0.7,
  }));

  const examplePages: MetadataRoute.Sitemap = examples.map((example) => ({
    url: url(`/examples/${example.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const comparePages: MetadataRoute.Sitemap = comparisons.map((comparison) => ({
    url: url(`/compare/${comparison.slug}`),
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...landing, ...docs, ...examplePages, ...comparePages];
}
