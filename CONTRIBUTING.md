# Contributing

Thanks for looking. Bug reports with a reproduction are the single most useful thing you can send.

## Getting set up

```sh
git clone https://github.com/jadghadry/react-virtual-checkbox-tree.git
cd react-virtual-checkbox-tree
npm install
```

This is an npm workspaces monorepo:

```
packages/react-virtual-checkbox-tree/   the published package
apps/web/                               the documentation site
scripts/                                readme sync, bundle size reporting
```

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | The library test suite (vitest + jsdom) |
| `npm run test:watch --workspace react-virtual-checkbox-tree` | Tests in watch mode |
| `npm run build` | Builds the library with tsup |
| `npm run dev` | Runs the docs site with the library in watch mode |
| `npm run typecheck` | Typechecks every workspace |
| `npm run bench` | Reproduces the performance table (needs a build first) |
| `npm run lint:package` | `publint` + `@arethetypeswrong/cli` against a real `npm pack` |

## Before opening a PR

1. `npm test` passes.
2. You added a test that fails without your change. The engine's whole job is subtle state
   propagation under filtering — a change without a test is a change nobody can safely refactor later.
3. `npm run lint:package` passes. This is the gate that catches a broken `exports` map before it
   reaches the registry, which is exactly how `0.1.0` shipped un-`require()`-able.
4. `CHANGELOG.md` has an entry under `Unreleased`.
5. If behavior or the prop surface changed, the docs under `apps/web/app/docs/` changed too.

## Scope

Some things are deliberately out of scope, because they're where the alternatives spend their bundle
and chasing them would cost the size that is this library's reason to exist:

- Drag-and-drop and inline rename — use [react-arborist](https://github.com/brimdata/react-arborist)
- Multi-tree environments
- A component library or any bundled CSS

Everything else is fair game. The most wanted items right now are checkable folders (`checkStrictly`),
lazy children, disabled nodes, and shift-click range selection.

## Performance changes

If you're touching the engine, include before/after `npm run bench` output in the PR. Numbers in the
README and on the docs site come straight from that script and are re-run per release.

## Code style

Match the surrounding code. Props and object keys are alphabetized; public methods carry TSDoc;
comments explain *why*, not *what*.

## Site environment variables

All optional — the site builds and runs without any of them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, `sitemap.xml` and OG images. Defaults to the Vercel URL; set this when a custom domain lands. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | The token from Google Search Console's HTML-tag verification. Set it, redeploy, then click Verify. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | The equivalent from Bing Webmaster Tools. Worth having: ChatGPT and Copilot search lean on Bing's index. |

Set them in Vercel under Settings → Environment Variables so verifying a search
engine is a dashboard change rather than a commit.
