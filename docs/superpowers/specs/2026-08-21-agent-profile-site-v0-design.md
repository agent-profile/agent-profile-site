# Agent Profile Website v0 Design

**Date:** 2026-08-21
**Status:** Proposed for written review
**Repository:** `agent-profile/agent-profile-site`
**Canonical origin:** `https://agentprofile.org/`

## Problem statement

Agent Profile has a public specification repository and a canonical domain, but
the domain does not yet resolve or explain the project. The 0.0.1 schema also
declares a canonical URI under that domain:

```text
https://agentprofile.org/schemas/0.0.1/profile.schema.json
```

The project needs a small, credible public website that introduces Agent
Profile as an open standard, routes readers to the specification and its open
development process, and serves the exact versioned schema bytes without
turning the website repository into the specification source of truth.

## Goals

- Publish a fast, accessible one-page introduction at `agentprofile.org`.
- State plainly that Agent Profile is an open, vendor-neutral standard.
- Explain the portable-metadata model without implying verified identity,
  ownership, authentication, authorization, provenance, or policy enforcement.
- Show a real synthetic `profile.json` near the top of the page.
- Link directly to the 0.0.1 specification, JSON Schema, and public GitHub
  development repositories.
- Serve the 0.0.1 schema at its declared canonical URI.
- Keep `agent-profile-spec` authoritative and make the website's schema mirror
  reproducible and auditable.
- Leave a clean path to versioned documentation without building a documentation
  portal prematurely.

## Non-goals

Version 0 does not include:

- rendered or copied specification documentation;
- documentation sidebars, full-text search, or an in-browser schema explorer;
- a registry, directory, package installer, or agent lookup;
- forms, accounts, comments, newsletters, or community profiles;
- analytics, cookies, personalization, or other tracking;
- a CMS, database, API, server runtime, or server-side rendering;
- React or another browser UI framework;
- Tailwind or another CSS framework;
- client-side JavaScript, animation, or a dark theme;
- redirects or a second site for `agent-profile.org`; or
- claims that the standard proves identity, verifies ownership, or creates
  accountability by itself.

## Decisions

### Dedicated public repository

The site lives in a new public repository named
`agent-profile/agent-profile-site`. The specification and website remain
separate ownership boundaries:

- `agent-profile-spec` owns normative prose, schemas, examples, and conformance
  fixtures.
- `agent-profile-site` owns presentation, explanatory website copy, deployment,
  and byte-for-byte mirrors of versioned schemas.

The website must link to normative material rather than copying or
reinterpreting it.

### Astro as a static compiler

The site uses Astro in static-output mode with strict TypeScript. Astro is a
build-time tool only. Version 0 uses Astro components but no `client:*`
directives and no browser framework integration. The production page therefore
ships semantic HTML and CSS without executable client JavaScript.

Astro was selected over plain HTML because it provides maintainable components
and a future path to typed, versioned content. It was selected over a larger
application framework because the site has no runtime behavior. Astro is MIT
licensed and produces ordinary static assets deployable by GitHub Pages.

### GitHub Pages hosting

GitHub Pages hosts the static output from a custom GitHub Actions workflow. The
site repository, deployment history, and open contribution path remain together
in the Agent Profile organization. Pull requests build and test but cannot
deploy. Only the default branch can deploy to the protected `github-pages`
environment.

The primary public origin is `https://agentprofile.org`. The GitHub Pages URL is
used as a pre-domain rollout target and recovery path during DNS setup.

## Repository structure

The intended structure is:

```text
agent-profile-site/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       └── deploy-pages.yml
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── schemas/
│       └── 0.0.1/
│           └── profile.schema.json
├── scripts/
│   └── verify-schema-provenance.mjs
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   ├── Influences.astro
│   │   ├── ManifestExample.astro
│   │   ├── ProfileAnatomy.astro
│   │   ├── SiteFooter.astro
│   │   └── TrustBoundary.astro
│   ├── content/
│   │   └── site.json
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── tests/
│   ├── built-site.test.mjs
│   └── site.spec.ts
├── LICENSE.md
├── LICENSES/
│   ├── Apache-2.0.txt
│   └── CC-BY-4.0.txt
├── README.md
├── astro.config.mjs
├── package-lock.json
├── package.json
├── schemas.lock.json
└── tsconfig.json
```

Components may be consolidated if implementation shows that a named component
has no independent responsibility. The component list is an ownership guide,
not a requirement to create wrappers around trivial markup.

## Content design

### Header

The header contains:

- the original Agent Profile mark and project name;
- `Specification 0.0.1`, linking to the canonical file in
  `agent-profile-spec`;
- `JSON Schema`, linking to the local canonical schema URI; and
- `GitHub`, linking to the specification organization or repository.

There is no search box or documentation navigation in version 0.

### Hero

The primary headline is:

> An open standard for portable agent profiles.

The supporting text states that Agent Profile describes portable metadata for
one durable logical agent, including optional owner metadata, contact methods,
external identifiers, and bundled Agent Plugins. It must describe these values
as metadata claims, not verified facts.

The two primary actions are `Read the specification` and `View on GitHub`.

### Manifest example

A synthetic `profile.json` appears beside or immediately below the hero. It
uses only `example.com`, a fictional UUID, and fictional organization data. The
example must validate against the mirrored 0.0.1 schema.

### Profile anatomy

The page briefly describes five concepts:

1. **Identity** — a stable absolute URI for one durable logical agent.
2. **Owner** — optional metadata naming a human or organization.
3. **Contacts** — optional email, SMS, telephone, and other contact URIs.
4. **External identifiers** — optional issuer-scoped or URI identifiers.
5. **Agent Plugins** — optional bundled portable capabilities governed by the
   Agent Plugins specification.

### Trust boundary

A visually distinct section is headed:

> Metadata, not credentials.

It states that Agent Profile does not verify claims, authenticate agents,
authorize actions, or enforce policy. It may say that external systems can
reference the metadata for human oversight, auditing, governance, provenance,
and accountability, but it must not say the profile implements those systems.

### Open development and influences

The page identifies 0.0.1 as a working draft and invites participation through
GitHub. It states that the project is informed by:

- Agent Plugins' work on portable agent capabilities;
- the Model Context Protocol ecosystem's work on interoperable context and tool
  connections; and
- Token Canopy's work on accountable agent infrastructure.

These are statements of influence, not endorsement or governance claims.

### Footer

The footer links to the specification, schema, GitHub repository, and licensing
notice. It states the dual-license categories without adding a copyright
ownership assertion.

## Editorial standard

The site must read like it was written and maintained by standards authors, not
generated as generic AI marketing copy.

Required editorial rules:

- Prefer concrete nouns, active verbs, and specification vocabulary.
- Lead with what the format contains and excludes.
- Keep claims no broader than the 0.0.1 specification.
- Use one primary headline; do not repeat slogan variants in later sections.
- Use natural paragraph structure instead of repetitive icon-card formulas.
- Avoid rhetorical questions, inflated transitions, and stacked abstract nouns.
- Do not use phrases such as `unlock`, `seamless`, `revolutionary`, `the future
  of AI`, `powerful`, or `built for what's next`.
- Do not add fake adoption claims, metrics, testimonials, partners, or maturity
  signals.
- Read the final copy aloud and remove sentences that sound interchangeable with
  another AI product's landing page.

The implementation review must compare every behavioral or trust claim against
the specification before publication.

## Visual design

The selected direction is **Human Accountability**, refined into a warm,
standards-oriented landing page.

The site borrows only high-level lessons from the Agent Plugins documentation:

- prominent access to the specification;
- restrained navigation;
- a strong reading hierarchy;
- a real technical example near the top; and
- technical clarity over marketing decoration.

It must not copy Agent Plugins' three-column documentation shell, dark palette,
search chrome, typography, icons, spacing system, or page composition.

The Agent Profile design uses:

- a warm ivory surface;
- deep blue-green text rather than Token Canopy's exact forest token;
- a restrained rust accent rather than Token Canopy's exact amber token;
- system serif, sans-serif, and monospace stacks with no external font request;
- an original, simple Agent Profile mark built as local SVG; and
- generous reading space with visible rules and code-oriented detail.

The exact color values are chosen during implementation and must meet WCAG 2.2
AA contrast. The design must remain recognizably independent from Token Canopy
despite acknowledging Token Canopy as an influence.

There are no gradients, glowing effects, decorative blobs, stock imagery,
generated illustrations, or gratuitous animations. The manifest is the primary
visual artifact.

## Schema provenance

`agent-profile-spec` is the only authoritative schema source. The site contains
a committed mirror solely because the canonical schema URI is on the website
origin and local builds must be self-contained.

`schemas.lock.json` records the repository name, the exact full 40-character
lowercase commit SHA, each mirrored source path, and the corresponding
64-character lowercase SHA-256 digest. The implementation selects the exact
default-branch commit containing the reviewed 0.0.1 schema and records the
computed digest; the committed lock file contains no branch names,
abbreviations, or placeholder values.

The provenance verifier must:

1. validate the lock-file shape;
2. require a full 40-character lowercase commit SHA;
3. require a 64-character lowercase SHA-256 value;
4. compute and compare the committed mirror's SHA-256;
5. in CI, compare the mirror byte-for-byte with the path checked out from the
   pinned specification commit; and
6. fail closed before site deployment on any mismatch, missing file, unexpected
   symlink, or path escape.

Updating a schema requires one reviewed change containing the upstream pin,
digest, and mirrored bytes. The site must not follow a branch name or moving tag
at build time.

## Licensing

The site follows the Agent Profile dual-license model with deterministic path
boundaries:

- website prose under `src/content/`, documentation, examples, and authored
  documentation assets are CC BY 4.0;
- Astro components, layouts, styles, scripts, tests, configuration, workflows,
  and mirrored schemas are Apache 2.0; and
- third-party material retains its original license and attribution.

All user-facing prose is stored in `src/content/site.json` so it does not become
ambiguously mixed with Apache-licensed Astro source. The root licensing notice
defines precedence and requires explicit notices for material outside the
listed categories. License text and routing should match the reviewed model in
`agent-profile-spec`.

## Security and privacy

- The page makes no runtime requests except same-origin static assets.
- There are no cookies, local storage, analytics, forms, or telemetry.
- There are no secrets or deployment credentials in the repository. GitHub
  Pages uses its OIDC-backed deployment permissions.
- Workflows receive the minimum required permissions and pin reusable actions
  to full commit SHAs with readable version comments.
- External links use safe opener behavior.
- A restrictive CSP meta policy permits only required same-origin resources.
  Astro is configured to emit the stylesheet as a static asset rather than an
  inline block so the policy does not require `unsafe-inline`.
- All examples and tests use synthetic `.test`, `.invalid`, `example.com`, and
  fictional identifiers. No production-derived data may enter the repository,
  build artifacts, screenshots, commits, or PR discussion.
- Dependency updates are proposed through Dependabot and must pass the complete
  build and browser checks.

## Accessibility and performance

The implementation must:

- use semantic landmarks and a logical heading hierarchy;
- support keyboard navigation with visible focus indicators;
- include a skip link;
- meet WCAG 2.2 AA text and control contrast;
- remain usable at 200% zoom and narrow mobile widths;
- avoid horizontal overflow at tested breakpoints;
- preserve readable code blocks without forcing page-level horizontal scroll;
- provide accessible names for the project mark and external-link cues;
- work with CSS disabled as a coherent document; and
- ship no executable client JavaScript in version 0.

Performance budgets for the initial page, measured from the production build:

- total first-load transferred assets at or below 150 KiB uncompressed,
  excluding the separately requested schema;
- no third-party runtime requests;
- no layout shift caused by late-loading fonts or media; and
- a Lighthouse performance score of at least 95 under the standard mobile
  profile, recorded as supporting evidence rather than the sole gate.

## Build and verification

The local and CI quality gates are:

```text
npm ci
npm run format:check
npm run check
npm test
npm run build
npm run test:e2e
```

The exact scripts are defined during implementation, but their responsibilities
are fixed:

- `format:check` checks Astro, JSON, Markdown, CSS, TypeScript, and workflow
  formatting.
- `check` runs Astro and strict TypeScript validation.
- `test` verifies schema provenance, required content, internal links, valid
  synthetic examples, and the absence of executable scripts in the built HTML.
- `build` produces the complete `dist/` artifact, including the mirrored schema.
- `test:e2e` boots the production preview and exercises the built artifact with
  a real browser at desktop and mobile sizes.

Browser checks cover:

- successful page and schema responses;
- exact schema bytes and expected JSON content type;
- header and CTA destinations;
- keyboard order and visible focus;
- automated accessibility scanning;
- no console errors;
- no unexpected network requests;
- no horizontal overflow; and
- correct layout at reduced and enlarged viewports.

The final local verification captures screenshots for the implementation PR and
checks the copy against the editorial standard. A source-level test does not
substitute for the built-site browser pass.

## Continuous integration and deployment

### Pull requests

Every pull request runs the complete quality gate and checks out
`agent-profile-spec` at the exact lock-file commit for provenance comparison.
Pull requests have read-only repository permissions and cannot deploy.

### Default branch

A successful default-branch run builds the same artifact, uploads it using the
official GitHub Pages artifact action, and deploys through the protected
`github-pages` environment. Deployment permissions are scoped to the deploy job:

- `contents: read`;
- `pages: write`; and
- `id-token: write`.

Build and deploy are separate jobs, and deploy depends on a successful build.
Any failure leaves the previous successful Pages deployment intact.

## Domain rollout

Publishing is staged:

1. Create the public repository and draft implementation PR.
2. Review the built site, screenshots, copy, and verification evidence.
3. Merge the approved implementation.
4. Enable GitHub Pages with GitHub Actions as its source.
5. Verify the generated GitHub Pages URL, including the schema route.
6. Configure `agentprofile.org` as the Pages custom domain through repository
   settings or the GitHub API.
7. Add the required apex and `www` DNS records at the domain's DNS provider.
8. Verify DNS, certificate issuance, HTTPS enforcement, canonical metadata, and
   the exact schema response from the public origin.
9. Only then treat `https://agentprofile.org` as live.

A custom Actions workflow does not rely on a repository `CNAME` file; the
custom domain is configured in Pages settings. DNS changes happen only after
Josh reviews the Pages deployment.

The separately owned `agent-profile.org` domain and any redirect service are
outside version 0.

## Failure handling

- **Schema mirror differs from its pin:** fail CI and deployment.
- **Schema source cannot be checked out:** fail closed; do not reuse or silently
  update the pin.
- **Build, link, accessibility, or browser check fails:** do not deploy.
- **Custom domain or certificate is not ready:** retain the verified Pages URL
  and do not advertise the canonical origin as live.
- **DNS change is incorrect:** revert the narrow DNS record change; the Pages
  deployment remains available.
- **Public data is discovered in source or artifacts:** stop publication,
  sanitize the branch and reachable history, and follow the public GitHub data
  incident process before continuing.
- **Astro later requires client JavaScript for a proposed feature:** treat that
  as a new design decision rather than silently adding a client runtime.

## Future evolution

Astro permits later additions without changing the version 0 contract:

- versioned specification and guide pages from reviewed Markdown content;
- typed content collections;
- an explicit multi-version schema catalog;
- small isolated client components for copy controls or search; and
- a documentation layout once the number of pages justifies navigation and
  search.

The website must not become a second normative source. Any future rendered
specification must retain a mechanically verifiable link to an exact
`agent-profile-spec` version and state which source governs conflicts.

## Alternatives considered

### Vanilla HTML and CSS

This would minimize dependencies and work well for the initial page. It was not
selected because the site is likely to add versioned explanatory content, and
Astro provides components and content tooling without requiring a browser
runtime.

### Jekyll

Jekyll integrates naturally with GitHub Pages and Markdown. It was not selected
because the custom visual design and future component needs would inherit Ruby
and theme conventions without a compensating benefit.

### Next.js

Next.js can produce a static export, but its application-oriented surface and
dependency weight are unnecessary for a one-page standards site with no server
runtime.

### Copy the Agent Plugins documentation format

This would create ecosystem familiarity but blur the projects' identities and
add documentation chrome that a one-page site does not need. The design instead
borrows only information-hierarchy lessons.

## References

- [Astro: Why Astro?](https://docs.astro.build/en/concepts/why-astro/)
- [Astro islands architecture](https://docs.astro.build/en/concepts/islands/)
- [Astro deployment to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## Open questions

No product or architecture questions remain. Implementation must resolve only
versioned inputs that do not change this design: the current supported Astro
and Node releases, the exact reviewed 0.0.1 specification commit, full action
SHAs, and the domain's current DNS provider configuration.
