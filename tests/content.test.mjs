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
  const serialized = JSON.stringify(manifest);

  assert.doesNotMatch(serialized, /agents\.e2a\.dev/i);
  assert.doesNotMatch(serialized, /@tokencanopy\.com/i);
  assert.match(manifest.owner.email, /@example\.com$/);
  assert.equal(new URL(manifest.owner.url).hostname, "example.com");

  for (const contact of manifest.contacts) {
    const contactUri = new URL(contact);
    if (contactUri.protocol === "mailto:") {
      assert.match(contactUri.pathname, /@example\.com$/);
    } else {
      assert.match(contactUri.pathname, /^\+12025550123$/);
    }
  }

  const issuer = manifest.identifiers.find(
    ({ type }) => type === "issuer-subject",
  );
  assert.equal(new URL(issuer.issuer).hostname, "identity.example.com");
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
