# Agent Profile website

The public website for Agent Profile, an open standard for portable metadata
about one durable logical AI agent.

The canonical origin is <https://agentprofile.org/>. Before the custom domain is
activated, GitHub Pages provides the rollout build. The normative specification,
schemas, examples, and conformance fixtures live in
[`agent-profile/agent-profile-spec`](https://github.com/agent-profile/agent-profile-spec);
this repository owns only the explanatory website and canonical schema mirror.

## Development

Use Node.js 24.

```bash
npm ci
npm run dev
npm run format:check
npm run check
npm test
npm run build
npm run test:e2e
```

Astro produces a static site with no client-side JavaScript. The page makes no
third-party runtime requests and uses no analytics, cookies, forms, or tracking.

## Schema mirror

The versioned schema under `public/schemas/` is a byte-for-byte mirror used to
serve the canonical schema URI. `schemas.lock.json` binds each mirror to an exact
specification commit and SHA-256 digest. The specification repository remains
authoritative.

To update a published schema mirror:

1. Select the reviewed default-branch commit in `agent-profile-spec`.
2. Copy the versioned schema bytes without reformatting them.
3. Update the full 40-character commit and SHA-256 digest in
   `schemas.lock.json`.
4. Run `npm run verify:schema` locally.
5. Open one reviewed change containing the pin, digest, and mirrored bytes. CI
   checks out the exact commit and compares the source and mirror byte for byte.

Never point the lock at a branch or moving tag. A digest or byte mismatch fails
the build and Pages deployment.

## Agent-readable discovery

The site publishes a root `sitemap.xml` for search discovery, a concise
`llms.txt` resource map, and an `index.md` Markdown alternate for agents that
prefer plain text. The HTML advertises the agent resources with `describedby`
and `alternate` link relations. `robots.txt` permits all crawlers, including
search, user-requested retrieval, and model-training crawlers, and names the
canonical sitemap.

Keep these files aligned with the current Working Draft, pinned specification
commit, and versioned schema whenever a new version is published. Search-engine
submission remains an external release step after the canonical HTTPS origin is
healthy.

## Deployment

GitHub Actions builds and tests pull requests without deployment permissions.
The default branch repeats the full gate, builds with the Pages-provided base
path, and deploys through the protected `github-pages` environment. The local
`npm run preview` command serves only the built `dist/` tree for browser tests.

Custom-domain and DNS configuration are release operations outside the code
change. Verify the GitHub Pages URL and canonical schema response before adding
or changing DNS for `agentprofile.org`.

## Licensing

Website content and documentation are available under CC BY 4.0. Schemas,
source code, tests, and configuration are available under Apache 2.0. See
[`LICENSE.md`](LICENSE.md) for the path-specific rules.
