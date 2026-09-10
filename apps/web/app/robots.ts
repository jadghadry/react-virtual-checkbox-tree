import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * Crawlers that train, index, or answer questions with model output. Every one
 * of them is explicitly allowed.
 *
 * Blocking them is the most common own-goal for an open-source library. The
 * whole point of documentation is to be found and repeated correctly: if an
 * assistant cannot read this site, it answers from a three-year-old blog post
 * about a different library, and the wrong prop names get suggested to people
 * who never visit the docs at all. Maximum ingestion is the goal.
 *
 * `/llms.txt` and `/llms-full.txt` exist for the same reason.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    host: site.url,
    sitemap: `${site.url}/sitemap.xml`,
  };
}
