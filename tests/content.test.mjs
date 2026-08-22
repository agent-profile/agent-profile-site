import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(repositoryRoot, relativePath), "utf8"),
  );
}

function collectStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function assertSyntheticManifest(manifest) {
  const canonicalSchema =
    "https://agentprofile.org/schemas/0.0.1/profile.schema.json";

  for (const value of collectStrings(manifest)) {
    assert.doesNotMatch(value, /agents\.e2a\.dev|@tokencanopy\.com/i);

    if (/^[^\s@]+@[^\s@]+$/.test(value)) {
      assert.match(value, /@(?:[a-z0-9-]+\.)*example\.com$/i);
      continue;
    }
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) continue;
    if (value === canonicalSchema || value.startsWith("urn:uuid:")) continue;

    const uri = new URL(value);
    if (["http:", "https:", "spiffe:"].includes(uri.protocol)) {
      assert.match(uri.hostname, /^(?:[a-z0-9-]+\.)*example\.com$/i);
    } else if (uri.protocol === "mailto:") {
      assert.match(uri.pathname, /@(?:[a-z0-9-]+\.)*example\.com$/i);
    } else if (["sms:", "tel:"].includes(uri.protocol)) {
      assert.match(uri.pathname, /^\+120255501\d{2}$/);
    } else {
      assert.fail(`Unsupported public fixture URI scheme: ${uri.protocol}`);
    }
  }
}

test("the example manifest validates against the mirrored 0.0.1 schema", async () => {
  const [content, schema] = await Promise.all([
    readJson("src/content/site.json"),
    readJson("public/schemas/0.0.1/profile.schema.json"),
  ]);
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );

  assert.equal(
    validate(content.manifest),
    true,
    JSON.stringify(validate.errors),
  );
  assert.equal(
    content.manifest.$schema,
    "https://agentprofile.org/schemas/0.0.1/profile.schema.json",
  );
});

test("the page copy preserves the reviewed claims and editorial limits", async () => {
  const content = await readJson("src/content/site.json");
  const serialized = JSON.stringify(content);

  assert.equal(
    content.project.headline,
    "An open standard for portable agent profiles.",
  );
  assert.match(content.project.summary, /vendor-neutral/);
  assert.equal(content.project.status, "Working Draft");
  assert.equal(content.trust.heading, "Metadata, not credentials.");
  assert.deepEqual(
    content.anatomy.map(({ key }) => key),
    ["identity", "owner", "contacts", "identifiers", "plugins"],
  );

  for (const phrase of [
    "unlock",
    "seamless",
    "revolutionary",
    "the future of AI",
    "powerful",
    "built for what's next",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(phrase, "i"));
  }
});

test("the public example contains synthetic identities and contacts only", async () => {
  const { manifest } = await readJson("src/content/site.json");
  assertSyntheticManifest(manifest);
  assert.throws(() =>
    assertSyntheticManifest({
      ...manifest,
      extensions: { "example.com": { nested: "https://real.example.net/id" } },
    }),
  );
});

test("user-facing prose stays in the CC-licensed content model", async () => {
  const content = await readJson("src/content/site.json");
  assert.ok(content.labels, "content must define shared interface labels");
  assert.ok(content.meta?.title, "content must define the document title");

  const source = await Promise.all(
    [
      "src/pages/index.astro",
      "src/layouts/BaseLayout.astro",
      "src/components/Header.astro",
      "src/components/ManifestExample.astro",
      "src/components/ProfileAnatomy.astro",
      "src/components/TrustBoundary.astro",
      "src/components/Influences.astro",
      "src/components/SiteFooter.astro",
    ].map((file) => readFile(path.join(repositoryRoot, file), "utf8")),
  ).then((files) => files.join("\n"));

  for (const literal of [
    "Open standard for portable agent profiles",
    "Skip to main content",
    "Agent Profile home",
    'aria-label="Primary"',
    ">JSON Schema<",
    ">GitHub<",
    "(external)",
    "<code>profile.json</code>",
    'aria-label="Example profile.json"',
    ">Profile anatomy<",
    ">What a profile describes<",
    ">Trust boundary<",
    ">Participate<",
    ">Influences<",
    'aria-label="Footer"',
    ">Licensing<",
  ]) {
    assert.equal(
      source.includes(literal),
      false,
      `Astro source contains ${literal}`,
    );
  }
});

test("all project and influence destinations are explicit HTTPS links", async () => {
  const content = await readJson("src/content/site.json");

  for (const [name, destination] of Object.entries(content.links)) {
    const url = new URL(destination);
    assert.equal(url.protocol, "https:", `${name} must use HTTPS`);
  }
  assert.deepEqual(
    content.influences.map(({ name }) => name),
    ["Agent Plugins", "Model Context Protocol", "Token Canopy"],
  );
});
