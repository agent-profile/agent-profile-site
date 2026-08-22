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

## Licensing

Website content and documentation are available under CC BY 4.0. Schemas,
source code, tests, and configuration are available under Apache 2.0. See
[`LICENSE.md`](LICENSE.md) for the path-specific rules.
