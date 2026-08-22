# Agent Profile Website v0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a small, accessible Astro website that introduces Agent Profile as an open standard and serves the exact reviewed 0.0.1 schema at its canonical path.

**Architecture:** Astro compiles one semantic page and one stylesheet to static files with no browser JavaScript. The website repository owns explanatory presentation only; the specification repository remains normative, and a fail-closed provenance check binds the committed schema mirror to one immutable specification commit.

**Tech Stack:** Node.js 24, npm, Astro 7.2.4, TypeScript 6.0.3, native Node test runner, Ajv 8.20.0, Playwright 1.62.1, axe-core 4.13.0, Prettier 3.9.6, GitHub Actions, GitHub Pages

**Spec:** [docs/superpowers/specs/2026-08-21-agent-profile-site-v0-design.md](../specs/2026-08-21-agent-profile-site-v0-design.md)

## Global Constraints

- Work in the public repository `agent-profile/agent-profile-site`; use only synthetic `example.com`, `.test`, `.invalid`, and fictional identifiers.
- Keep `agent-profile/agent-profile-spec` authoritative. Do not edit normative prose or schema semantics in the site repository.
- Pin the reviewed specification commit `6e56a3c3e1e8684d1b280374a92d4801dababb03` and schema SHA-256 `6e25db7f595ed331b89f87605c3a325ce5a2aad070a8f736a3d0fd64976baaf6`.
- Keep all user-facing prose in `src/content/site.json`, licensed CC BY 4.0. Keep components, styles, scripts, tests, workflows, configuration, and the schema mirror under Apache 2.0.
- Do not add React, Tailwind, a CMS, analytics, cookies, forms, a server runtime, remote fonts, animation, generated imagery, or any `client:*` directive.
- The production HTML must contain no `<script>` element. Do not add JSON-LD in v0.
- Treat the profile manifest as claims-bearing metadata. Never imply that Agent Profile verifies identity or ownership, grants authority, stores credentials, enforces policy, or creates audit/provenance systems.
- Do not merge either PR or change DNS in the implementation run. Deployment and DNS activation happen only after Josh approves the rendered Pages build.
- Commit as Josh using `Josh <josh@tokencanopy.com>`. Use Conventional Commit subjects.

## Versioned Inputs

Use these exact dependency releases in `package.json`:

| Package                 | Version  |
| ----------------------- | -------- |
| `astro`                 | `7.2.4`  |
| `@astrojs/check`        | `0.9.10` |
| `typescript`            | `6.0.3`  |
| `prettier`              | `3.9.6`  |
| `prettier-plugin-astro` | `0.14.1` |
| `ajv`                   | `8.20.0` |
| `@playwright/test`      | `1.62.1` |
| `@axe-core/playwright`  | `4.13.0` |
| `yaml`                  | `2.9.0`  |

Pin reusable actions to these immutable revisions, retaining the readable release comment:

| Action                          | Revision                                            |
| ------------------------------- | --------------------------------------------------- |
| `actions/checkout`              | `3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` |
| `actions/setup-node`            | `820762786026740c76f36085b0efc47a31fe5020 # v7.0.0` |
| `actions/configure-pages`       | `45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0` |
| `actions/upload-pages-artifact` | `fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0` |
| `actions/deploy-pages`          | `cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5.0.0` |

## Final File Map

Create or modify:

```text
.github/dependabot.yml
.github/workflows/ci.yml
.github/workflows/deploy-pages.yml
.gitignore
.nvmrc
.prettierignore
LICENSE.md
LICENSES/Apache-2.0.txt
LICENSES/CC-BY-4.0.txt
README.md
astro.config.mjs
package-lock.json
package.json
playwright.config.ts
prettier.config.mjs
public/favicon.svg
public/robots.txt
public/schemas/0.0.1/profile.schema.json
schemas.lock.json
scripts/schema-provenance.mjs
scripts/verify-schema-provenance.mjs
src/components/Header.astro
src/components/Hero.astro
src/components/Influences.astro
src/components/ManifestExample.astro
src/components/ProfileAnatomy.astro
src/components/SiteFooter.astro
src/components/TrustBoundary.astro
src/content/site.json
src/layouts/BaseLayout.astro
src/pages/index.astro
src/styles/global.css
tests/built-site.test.mjs
tests/content.test.mjs
tests/schema-provenance.test.mjs
tests/site.spec.ts
tests/workflows.test.mjs
tsconfig.json
```

Keep the approved design and this plan under `docs/superpowers/`.

---

### Task 1: Bootstrap the static Astro project and license boundaries

**Files:** Create `.gitignore`, `.nvmrc`, `.prettierignore`, `package.json`, `package-lock.json`, `astro.config.mjs`, `prettier.config.mjs`, `tsconfig.json`, `LICENSE.md`, `LICENSES/*`, and `README.md`.

- [ ] **Step 1: Confirm the implementation base and authorship**

```bash
git status --short
git branch --show-current
git log -1 --format='%H %an <%ae> %cn <%ce>'
```

Expected: only approved design/plan work is present; author and committer are Josh at `josh@tokencanopy.com`. Preserve unrelated work.

- [ ] **Step 2: Add the exact package manifest**

Create `package.json`:

```json
{
  "name": "@agent-profile/site",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24.15.0 <25"
  },
  "scripts": {
    "dev": "ASTRO_TELEMETRY_DISABLED=1 astro dev",
    "build": "ASTRO_TELEMETRY_DISABLED=1 astro build",
    "preview": "ASTRO_TELEMETRY_DISABLED=1 astro preview",
    "check": "ASTRO_TELEMETRY_DISABLED=1 astro check",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify:schema": "node scripts/verify-schema-provenance.mjs",
    "test": "npm run build && node --test tests/*.test.mjs",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.62.1",
    "ajv": "8.20.0",
    "astro": "7.2.4",
    "prettier": "3.9.6",
    "prettier-plugin-astro": "0.14.1",
    "typescript": "6.0.3",
    "yaml": "2.9.0"
  }
}
```

Set `.nvmrc` to `24`. Ignore `node_modules/`, `dist/`, `.astro/`, `playwright-report/`, `test-results/`, and `.upstream/`. Prettier must ignore those generated paths, `.superpowers/`, and the two verbatim license texts. Add `prettier.config.mjs` to load `prettier-plugin-astro` and select the `astro` parser for `*.astro` files.

- [ ] **Step 3: Configure Astro as a zero-JavaScript static compiler**

Create `astro.config.mjs`:

```js
import { defineConfig } from "astro/config";

const base = process.env.PAGES_BASE_PATH || "/";

export default defineConfig({
  site: "https://agentprofile.org",
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "never",
  },
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strictest",
  "compilerOptions": {
    "noUncheckedIndexedAccess": true
  }
}
```

The deploy build later supplies `actions/configure-pages`'s `base_path` so both the temporary project URL and custom domain resolve assets.

- [ ] **Step 4: Install once and commit the lockfile**

```bash
npm install
npm ci
```

Expected: both succeed on Node 24 and `package-lock.json` records the transitive graph.

- [ ] **Step 5: Establish deterministic licensing**

Copy both full license texts byte-for-byte from specification commit `6e56a3c3e1e8684d1b280374a92d4801dababb03`. `LICENSE.md` uses the specification's routing rules, adjusted only for site paths:

- `src/content/`, Markdown documentation, examples, and authored documentation assets: CC BY 4.0.
- `public/schemas/`, Astro source, styles, scripts, tests, configuration, and workflows: Apache 2.0.
- Third-party material retains its original license.
- Ambiguous new material requires an explicit notice.

Do not add a copyright ownership assertion.

- [ ] **Step 6: Add a factual maintainer README**

Start with:

```text
# Agent Profile website

The public website for Agent Profile, an open standard for portable metadata
about one durable logical AI agent.
```

Document the canonical origin, temporary Pages rollout, normative spec repo, Node 24 commands, schema mirror procedure, zero-JavaScript/no-tracking constraints, and dual license. Do not call 0.0.1 final.

- [ ] **Step 7: Verify and commit**

```bash
npm run format:check
npm run check
git diff --check
git add .gitignore .nvmrc .prettierignore package.json package-lock.json astro.config.mjs prettier.config.mjs tsconfig.json LICENSE.md LICENSES README.md docs/superpowers
git commit -m "chore(site): bootstrap Astro project"
```

---

### Task 2: Bind the schema mirror to the reviewed specification commit

**Files:** Create `schemas.lock.json`, `public/schemas/0.0.1/profile.schema.json`, `scripts/schema-provenance.mjs`, `scripts/verify-schema-provenance.mjs`, and `tests/schema-provenance.test.mjs`.

- [ ] **Step 1: Write the failing provenance tests**

Using `node:test` and temporary directories, cover:

1. exact lock keys;
2. only 40-character lowercase commit SHAs;
3. only 64-character lowercase SHA-256 values;
4. valid committed mirror digest;
5. changed and missing mirrors;
6. symlinked mirror or upstream source;
7. absolute, `..`, and root-escaping paths;
8. byte inequality with an upstream checkout;
9. upstream `HEAD` unequal to the lock commit.

Import the intended API:

```js
import {
  loadSchemaLock,
  sha256File,
  verifySchemaProvenance,
} from "../scripts/schema-provenance.mjs";
```

Run `node --test tests/schema-provenance.test.mjs`. Expected: FAIL because the module and lock do not exist.

- [ ] **Step 2: Add the immutable lock and exact mirror**

Create `schemas.lock.json`:

```json
{
  "version": 1,
  "repository": "agent-profile/agent-profile-spec",
  "commit": "6e56a3c3e1e8684d1b280374a92d4801dababb03",
  "files": [
    {
      "source": "schemas/0.0.1/profile.schema.json",
      "target": "public/schemas/0.0.1/profile.schema.json",
      "sha256": "6e25db7f595ed331b89f87605c3a325ce5a2aad070a8f736a3d0fd64976baaf6"
    }
  ]
}
```

Copy the source at that exact commit without reformatting. `shasum -a 256 public/schemas/0.0.1/profile.schema.json` must return the locked digest.

- [ ] **Step 3: Implement the fail-closed verifier**

Export:

```js
export async function loadSchemaLock(rootDir) {}
export async function sha256File(filePath) {}
export async function verifySchemaProvenance({ rootDir, upstreamDir }) {}
```

Concrete rules:

- Reject unknown top-level and file-entry keys.
- Require `version === 1` and repository `agent-profile/agent-profile-spec`.
- Validate commit/digest with `/^[0-9a-f]{40}$/` and `/^[0-9a-f]{64}$/`.
- Accept normalized relative POSIX targets only below `public/schemas/` and sources only below `schemas/`.
- Use `lstat` before `realpath`; reject symlinks and non-regular files.
- Require resolved paths to stay inside the permitted root.
- Hash raw bytes with `createHash("sha256")` and compare digests with `timingSafeEqual`.
- With `upstreamDir`, run `git -C <dir> rev-parse HEAD`, require the exact pin, and compare source/target `Buffer` values.
- Name the failed lock entry in errors without printing file contents.

The CLI resolves the repository root, accepts only optional `--upstream <dir>`, calls the verifier, and prints `Schema provenance verified.`.

- [ ] **Step 4: Make the tests pass**

```bash
node --test tests/schema-provenance.test.mjs
npm run verify:schema
npm run format:check
```

- [ ] **Step 5: Commit**

```bash
git add schemas.lock.json public/schemas scripts tests/schema-provenance.test.mjs
git commit -m "feat(site): pin canonical profile schema"
```

---

### Task 3: Author the factual page content and validate its claims

**Files:** Create `src/content/site.json` and `tests/content.test.mjs`.

- [ ] **Step 1: Write the failing content-contract test**

The test must parse `src/content/site.json`, validate `manifest` against the mirrored Draft 2020-12 schema with Ajv, assert the canonical `$schema` URI, and recursively reject `agents.e2a.dev`, `@tokencanopy.com`, and non-synthetic fixtures.

It must also require:

- headline `An open standard for portable agent profiles.`;
- summary text that explicitly calls the standard `vendor-neutral`;
- trust heading `Metadata, not credentials.`;
- anatomy keys `identity`, `owner`, `contacts`, `identifiers`, and `plugins`;
- status `Working Draft`;
- absolute HTTPS links for specification, repositories, influences, and licensing.

Reject `unlock`, `seamless`, `revolutionary`, `the future of AI`, `powerful`, and `built for what's next`, case-insensitively.

Run `node --test tests/content.test.mjs`. Expected: FAIL because the content file does not exist.

- [ ] **Step 2: Add the reviewed content model**

Create `src/content/site.json`:

```json
{
  "project": {
    "name": "Agent Profile",
    "status": "Working Draft",
    "version": "0.0.1",
    "headline": "An open standard for portable agent profiles.",
    "summary": "Agent Profile is an open, vendor-neutral standard for a portable directory package describing one durable logical AI agent. A profile can name an owner, list contact methods, associate external identifiers, and bundle Agent Plugins. Those values are metadata claims, not credentials or proof."
  },
  "links": {
    "specification": "https://github.com/agent-profile/agent-profile-spec/blob/6e56a3c3e1e8684d1b280374a92d4801dababb03/spec/0.0.1.md",
    "specRepository": "https://github.com/agent-profile/agent-profile-spec",
    "siteRepository": "https://github.com/agent-profile/agent-profile-site",
    "license": "https://github.com/agent-profile/agent-profile-site/blob/main/LICENSE.md",
    "agentPlugins": "https://agent-plugins.org/",
    "mcp": "https://modelcontextprotocol.io/",
    "tokenCanopy": "https://tokencanopy.com/"
  },
  "actions": {
    "primary": "Read the specification",
    "secondary": "View on GitHub"
  },
  "manifest": {
    "$schema": "https://agentprofile.org/schemas/0.0.1/profile.schema.json",
    "id": "urn:uuid:7a18f6ba-22c8-4d4f-a60e-1e2e8fe4dc44",
    "name": "Research Librarian",
    "version": "0.1.0",
    "description": "Organizes public research for Example Cooperative.",
    "owner": {
      "name": "Example Cooperative",
      "email": "agents@example.com",
      "url": "https://example.com/"
    },
    "contacts": [
      "mailto:research@example.com",
      "sms:+12025550123",
      "tel:+12025550123"
    ],
    "identifiers": [
      {
        "type": "issuer-subject",
        "issuer": "https://identity.example.com",
        "subject": "agent_01EXAMPLE"
      },
      {
        "type": "uri",
        "value": "spiffe://example.com/agents/research"
      }
    ]
  },
  "anatomy": [
    {
      "key": "identity",
      "label": "Identity",
      "body": "A permanent absolute URI identifies one durable logical agent, not a process, installation, runtime, or session."
    },
    {
      "key": "owner",
      "label": "Owner",
      "body": "Optional public metadata names the human or organization responsible for the agent. It does not grant authority."
    },
    {
      "key": "contacts",
      "label": "Contacts",
      "body": "Optional URI values can describe email, SMS, telephone, or other ways to contact the agent."
    },
    {
      "key": "identifiers",
      "label": "External identifiers",
      "body": "Optional issuer-and-subject or URI identifiers associate the profile with identities used by other systems."
    },
    {
      "key": "plugins",
      "label": "Agent Plugins",
      "body": "A profile package may include portable capabilities under its plugins directory. Agent Plugins remains authoritative for each plugin's contents."
    }
  ],
  "trust": {
    "heading": "Metadata, not credentials.",
    "body": "Agent Profile does not verify its claims, authenticate an agent, authorize an action, or enforce policy. Systems can reference profile metadata when building human oversight, auditing, governance, provenance, and accountability, but the profile does not provide those controls by itself."
  },
  "development": {
    "heading": "Open development",
    "body": "Agent Profile 0.0.1 is a working draft developed in public. Read the specification, inspect the schema and conformance fixtures, or open an issue on GitHub."
  },
  "influences": [
    {
      "name": "Agent Plugins",
      "body": "Portable packages for agent capabilities."
    },
    {
      "name": "Model Context Protocol",
      "body": "Interoperable context and tool connections."
    },
    {
      "name": "Token Canopy",
      "body": "Infrastructure for accountable agent operation."
    }
  ],
  "licenseSummary": "Specification prose, website content, and documentation are available under CC BY 4.0. Schemas, source code, and conformance material are available under Apache 2.0."
}
```

The page may line-wrap this copy but may not broaden it during implementation.

- [ ] **Step 3: Make the content contract pass**

Use the local Draft 2020 implementation:

```js
import Ajv2020 from "ajv/dist/2020.js";
```

Register no remote schema loader. Run `node --test tests/content.test.mjs` and `npm run format:check`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/content/site.json tests/content.test.mjs
git commit -m "docs(site): add reviewed landing page copy"
```

---

### Task 4: Build the semantic one-page site without client JavaScript

**Files:** Create `public/favicon.svg`, `public/robots.txt`, `src/layouts/BaseLayout.astro`, the seven components in the file map, `src/pages/index.astro`, and `tests/built-site.test.mjs`.

- [ ] **Step 1: Write the failing built-artifact contract**

Read `dist/index.html` and assert one `header`, `main`, and `footer`; a first-focusable skip link to `#main-content`; exactly one `h1` with the approved headline; and headings in document order without skipped levels.

Also assert:

- manifest schema, UUID, owner, contacts, and identifiers are rendered;
- the local schema link uses the configured base;
- every internal link resolves inside `dist/`;
- blank-target links include `noopener noreferrer`;
- no `script`, `iframe`, `form`, `video`, remote image/font, `client:*` marker, or Astro island;
- CSP contains the five required directives;
- built schema bytes equal the committed mirror;
- all `dist/` bytes except the schema total at most 150 KiB uncompressed.

Run `npm test`. Expected: FAIL because no page exists.

- [ ] **Step 2: Implement the base document**

`BaseLayout.astro` imports global CSS; accepts `title` and `description`; emits language, charset, viewport, canonical, description, title, favicon, Open Graph, and Twitter metadata; renders a first-focusable skip link; and includes no scripts.

Use this exact CSP:

```text
default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'
```

Use `Astro.site` for canonical metadata, not the temporary project-path base.

- [ ] **Step 3: Implement the original mark and header**

Create a local SVG mark with two offset rounded rectangles joined by one line and a filled endpoint circle. Use only `#173A3A` and `#A5462C`; no text, script, animation, external reference, embedded CSS, or generator metadata.

The adjacent project name supplies the visible label: use an empty image `alt` and label the enclosing link `Agent Profile home` so screen readers do not hear the name twice.

The header renders the mark/name home link, `Specification 0.0.1`, `JSON Schema` at:

```js
`${import.meta.env.BASE_URL}schemas/0.0.1/profile.schema.json`;
```

and `GitHub`. External links stay in the same tab unless there is a reason not to; any blank target must have safe rel values and accessible external-link context.

- [ ] **Step 4: Implement hero, manifest, and explanation**

- `Hero.astro`: status/version eyebrow, headline, summary, two actions.
- `ManifestExample.astro`: escaped `JSON.stringify(content.manifest, null, 2)` inside `<pre aria-label="Example profile.json"><code>`.
- `ProfileAnatomy.astro`: `What a profile describes` and an ordered list, not icon cards.
- `TrustBoundary.astro`: a visually distinct aside with the approved heading/body.
- `Influences.astro`: `Open development` followed by a compact definition list; link names only.
- `SiteFooter.astro`: specification, schema, repository, license links and exact license summary.

- [ ] **Step 5: Compose the page and public text files**

`index.astro` composes:

```astro
<BaseLayout
  title="Agent Profile — Open standard for portable agent profiles"
  description={content.project.summary}
>
  <Header content={content} />
  <main id="main-content">
    <Hero content={content} />
    <ProfileAnatomy items={content.anatomy} />
    <TrustBoundary trust={content.trust} />
    <Influences content={content} />
  </main>
  <SiteFooter content={content} />
</BaseLayout>
```

`public/robots.txt` contains only:

```text
User-agent: *
Allow: /
```

Do not advertise a sitemap that does not exist.

- [ ] **Step 6: Make the artifact contract pass**

```bash
npm run build
node --test tests/built-site.test.mjs
npm run check
npm run format:check
```

Expected: PASS; no scripts and an unchanged schema in `dist/`.

- [ ] **Step 7: Commit**

```bash
git add public src tests/built-site.test.mjs
git commit -m "feat(site): build semantic landing page"
```

---

### Task 5: Add the warm visual system and browser accessibility checks

**Files:** Create `src/styles/global.css`, `playwright.config.ts`, and `tests/site.spec.ts`. Modify semantic components only for defects exposed by browser tests.

- [ ] **Step 1: Write the failing browser tests**

Create this Playwright configuration:

```ts
import { defineConfig, devices } from "@playwright/test";

const basePath = process.env.TEST_BASE_PATH || "/";

export default defineConfig({
  testDir: "./tests",
  testMatch: "site.spec.ts",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:4321${basePath}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4321",
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
```

Browser tests cover page/schema responses and content type, schema digest, exact destinations, tab order, visible focus, zero WCAG 2.2 A/AA axe violations, no console/page errors, same-origin requests only, zero scripts, no overflow at 320/375/768/1280 widths, 200% zoom, reduced motion, and coherent CSS-disabled content.

Run `npm run build`, `npx playwright install chromium`, and `npm run test:e2e`. Expected: FAIL until visual/focus behavior exists.

- [ ] **Step 2: Implement the visual tokens**

Start `global.css` with:

```css
:root {
  color-scheme: light;
  --paper: #f6f1e8;
  --paper-deep: #ece4d6;
  --surface: #fffdf9;
  --ink: #173a3a;
  --ink-soft: #4e6461;
  --rust: #a5462c;
  --rust-dark: #7e321f;
  --rule: #c9bda9;
  --code: #102c2e;
  --code-ink: #f5efe5;
  --sans:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  --serif: Iowan Old Style, Baskerville, "Times New Roman", serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --measure: 68ch;
  --page: 72rem;
}
```

Implement border-box sizing, zero body margin, fluid gutters, a `72rem` shell, `1.65` line height, serif `h1` at `clamp(2.7rem, 7vw, 5.8rem)`, two-column hero above 50rem, contained scrollable code, visible 1px rules, rust actions, and a 3px focus outline with 3px offset. Keep radii at or below 8px and avoid decorative shadows.

Add reduced-motion, more-contrast, and print rules. Use no gradients, blobs, stock/generated art, video, or animation.

- [ ] **Step 3: Measure and correct contrast**

Measure ink/paper, soft ink/paper, rust/paper, code ink/code, and all interaction states. Require 4.5:1 for normal text and 3:1 for large text, focus, and non-text UI. Darken only a failing token and record ratios in the PR.

- [ ] **Step 4: Make browser tests pass**

```bash
npm run build
npm run test:e2e
npm run check
npm run format:check
```

- [ ] **Step 5: Capture review images without committing them**

Capture full-page desktop and 375px mobile screenshots. Inspect editorial rhythm, manifest readability, trust-boundary prominence, independence from Agent Plugins' docs shell and Token Canopy's palette, and absence of generic icon-card/AI-marketing patterns. Before attaching them publicly, crop browser chrome and verify no private tabs, local paths, or non-public data appear.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css playwright.config.ts tests/site.spec.ts src/components src/layouts src/pages
git commit -m "feat(site): add accessible visual system"
```

---

### Task 6: Add CI, immutable actions, and Pages deployment

**Files:** Create `.github/dependabot.yml`, `.github/workflows/ci.yml`, `.github/workflows/deploy-pages.yml`, and `tests/workflows.test.mjs`.

- [ ] **Step 1: Write the failing workflow-policy test**

Parse both workflows with `yaml` and assert:

- every `uses:` revision is a 40-character lowercase SHA;
- every expected action SHA from Versioned Inputs is present;
- CI has only `contents: read`, contains no deploy job, and runs on pull requests;
- Pages runs only for `main` pushes and `workflow_dispatch`;
- the build job has only `contents: read` and `pages: read`;
- only deploy has `pages: write` and `id-token: write`;
- deploy needs build and targets `github-pages`;
- both workflows check out the specification at the lock-file commit;
- format, check, provenance, unit/artifact, build, and browser gates precede upload/deploy;
- neither uses `pull_request_target`, repository write permission, persisted credentials, or untrusted PR text in shell.

Run `node --test tests/workflows.test.mjs`. Expected: FAIL because workflows do not exist.

- [ ] **Step 2: Add weekly dependency proposals**

`.github/dependabot.yml` configures npm and GitHub Actions updates at `/`, weekly, with at most five open PRs per ecosystem and label `dependencies`. Do not auto-merge.

- [ ] **Step 3: Implement read-only PR CI**

`ci.yml` triggers on pull requests and non-`main` pushes, uses workflow-level `permissions: contents: read`, Node 24, npm caching, and `npm ci`.

Read the schema pin without evaluating untrusted text:

```yaml
- name: Read schema lock
  id: schema
  shell: bash
  run: |
    node --input-type=module -e 'import lock from "./schemas.lock.json" with { type: "json" }; const commit = lock.commit; if (!/^[0-9a-f]{40}$/.test(commit)) process.exit(1); process.stdout.write(`commit=${commit}\n`);' >> "$GITHUB_OUTPUT"
```

Check out `agent-profile/agent-profile-spec` at `${{ steps.schema.outputs.commit }}` into `.upstream/agent-profile-spec`. Both site and spec checkout steps set `persist-credentials: false`.

Run:

```text
npm run format:check
npm run check
npm run verify:schema -- --upstream .upstream/agent-profile-spec
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Use only the immutable action revisions in Versioned Inputs.

- [ ] **Step 4: Implement default-branch Pages deployment**

`deploy-pages.yml`:

- triggers only on `main` pushes and `workflow_dispatch`;
- uses `concurrency.group: pages` and `cancel-in-progress: false`;
- gives build only `contents: read` and `pages: read`;
- repeats the full quality gate and exact upstream checkout;
- runs `actions/configure-pages` after the default-base test build;
- rebuilds the artifact with:

```yaml
- name: Build Pages artifact
  env:
    PAGES_BASE_PATH: ${{ steps.pages.outputs.base_path }}
  run: npm run build
```

- reruns Playwright with `TEST_BASE_PATH: ${{ steps.pages.outputs.base_path }}`;
- uploads only `dist/`;
- has a separate deploy job that needs build, grants only `contents: read`, `pages: write`, and `id-token: write`, targets `github-pages`, and sets the environment URL from the deploy action output.

Do not use a secret, PAT, `CNAME` file, or third-party deploy action.

- [ ] **Step 5: Make policy tests pass**

```bash
node --test tests/workflows.test.mjs
npm run format:check
git diff --check
```

- [ ] **Step 6: Commit**

```bash
git add .github tests/workflows.test.mjs
git commit -m "ci(site): add Pages quality gates"
```

---

### Task 7: Run the release-candidate review and prepare the PR

**Files:** Refine `README.md` and modify only defects found by full verification.

- [ ] **Step 1: Verify a clean install and every gate**

```bash
npm ci
npm run format:check
npm run check
npm run verify:schema
npm test
npm run build
npx playwright install chromium
npm run test:e2e
git diff --check
```

Expected: all pass. `git status --short` contains only intended changes.

- [ ] **Step 2: Inspect the production artifact directly**

```bash
find dist -type f -print
shasum -a 256 dist/schemas/0.0.1/profile.schema.json
rg -n '<script|client:|astro-island|https?://' dist
du -sk dist
```

Expected: schema digest `6e25db7f595ed331b89f87605c3a325ce5a2aad070a8f736a3d0fd64976baaf6`, no scripts/islands, no third-party runtime assets, and non-schema output within 150 KiB uncompressed. Canonical metadata and ordinary outbound links are allowed `https://` results.

- [ ] **Step 3: Perform the editorial and trust review**

Read the rendered page aloud and compare every claim with the pinned specification:

- distinguish one durable logical agent from runtime/session;
- describe owner and contacts as optional metadata;
- keep Agent Plugins authoritative for plugin contents;
- call 0.0.1 a working draft;
- do not claim credentials, verification, authentication, authorization, policy enforcement, provenance, or auditing as features;
- present influences as influences, not endorsements;
- remove generic AI marketing, fake maturity signals, testimonials, metrics, and partner claims.

- [ ] **Step 4: Add final maintenance guidance**

README's schema update sequence is:

1. select a reviewed default-branch spec commit;
2. copy versioned schema bytes without formatting;
3. update full commit and SHA-256 in `schemas.lock.json`;
4. run the local verifier;
5. let CI compare against an exact checkout;
6. publish pin, digest, and bytes in one reviewed change.

State that DNS is deliberately outside the code change.

- [ ] **Step 5: Commit review corrections**

If there is no defect, commit the README refinement:

```bash
git add README.md
git commit -m "docs(site): add maintenance and release guide"
```

If a defect appears, add a failing regression test first, make the smallest fix, rerun the full gate, and use a scope-appropriate Conventional Commit instead.

- [ ] **Step 6: Open the implementation PR without merging**

Include:

- outcome and architecture;
- links to the approved design and plan;
- schema commit and digest;
- exact verification commands/results;
- desktop and mobile screenshots;
- measured contrast ratios;
- Lighthouse mobile performance result, targeting at least 95;
- confirmation of no client JavaScript, analytics, cookies, forms, or third-party runtime requests;
- dual-license boundary;
- post-merge checklist below.

Mark ready only after GitHub CI passes. Do not merge.

## Post-merge rollout handoff

These are external release operations, not implementation tasks:

1. Josh reviews and merges the implementation PR.
2. Enable GitHub Pages with GitHub Actions as the source.
3. Verify the generated Pages URL, page links, and exact schema response.
4. Show Josh the verified URL and request domain approval.
5. Configure `agentprofile.org` in repository Pages settings.
6. Resolve the current DNS provider and show exact apex/`www` records before applying them.
7. Verify DNS, certificate issuance, HTTPS enforcement, canonical metadata, rendering, and exact public schema bytes.
8. Keep `agent-profile.org` redirect work outside v0.

If the custom domain is not ready, retain the last successful Pages deployment and do not advertise `https://agentprofile.org` as live.
