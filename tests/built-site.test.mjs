import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const distDir = path.join(repositoryRoot, "dist");

async function readBuilt(relativePath) {
  return readFile(path.join(distDir, relativePath));
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );
  return files.flat();
}

function tagCount(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b`, "gi"))].length;
}

function anchorHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)].map(
    ([, href]) => href,
  );
}

function builtPathForHref(href) {
  const url = new URL(href, "https://agentprofile.org/");
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) {
    return path.join(distDir, pathname.slice(1), "index.html");
  }
  return path.join(distDir, pathname.slice(1));
}

test("the built page has one coherent semantic document", async () => {
  const html = (await readBuilt("index.html")).toString("utf8");

  assert.equal(tagCount(html, "header"), 1);
  assert.equal(tagCount(html, "main"), 1);
  assert.equal(tagCount(html, "footer"), 1);
  assert.equal(tagCount(html, "h1"), 1);
  assert.match(
    html,
    /<h1[^>]*>An open standard for portable agent profiles\.<\/h1>/,
  );
  assert.ok(
    html.indexOf('href="#main-content"') < html.indexOf("<header"),
    "skip link must be the first page link",
  );
  assert.match(html, /<main[^>]*id="main-content"/);

  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map(([, level]) =>
    Number(level),
  );
  for (const [index, level] of headingLevels.entries()) {
    if (index > 0) {
      assert.ok(
        level <= headingLevels[index - 1] + 1,
        `heading level jumps from h${headingLevels[index - 1]} to h${level}`,
      );
    }
  }
});

test("the built page renders the reviewed manifest and trust boundary", async () => {
  const html = (await readBuilt("index.html")).toString("utf8");

  for (const expected of [
    "https://agentprofile.org/schemas/0.0.1/profile.schema.json",
    "urn:uuid:7a18f6ba-22c8-4d4f-a60e-1e2e8fe4dc44",
    "Example Cooperative",
    "mailto:research@example.com",
    "issuer-subject",
    "Metadata, not credentials.",
  ]) {
    assert.match(
      html,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("internal links resolve inside the build output", async () => {
  const html = (await readBuilt("index.html")).toString("utf8");
  const hrefs = anchorHrefs(html);

  assert.ok(hrefs.includes("/schemas/0.0.1/profile.schema.json"));
  for (const href of hrefs) {
    if (href.startsWith("#") || /^https?:/i.test(href)) {
      continue;
    }
    await stat(builtPathForHref(href));
  }

  for (const [, attributes] of html.matchAll(/<a\b([^>]*)>/gi)) {
    if (/target="_blank"/i.test(attributes)) {
      assert.match(attributes, /rel="[^"]*noopener[^"]*"/i);
      assert.match(attributes, /rel="[^"]*noreferrer[^"]*"/i);
    }
  }
});

test("the build has a restrictive CSP and no executable or remote assets", async () => {
  const html = (await readBuilt("index.html")).toString("utf8");
  const csp = html.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i,
  )?.[1];

  assert.ok(csp, "CSP meta tag must exist");
  for (const directive of [
    "default-src 'none'",
    "style-src 'self'",
    "img-src 'self'",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
  ]) {
    assert.match(csp, new RegExp(directive.replace(/'/g, "(?:'|&#39;)")));
  }

  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /<iframe\b|<form\b|<video\b/i);
  assert.doesNotMatch(html, /client:|<astro-island\b/i);
  assert.doesNotMatch(html, /<img\b[^>]*src="https?:/i);
  for (const [, attributes] of html.matchAll(/<link\b([^>]*)>/gi)) {
    if (/rel="(?:icon|stylesheet)"/i.test(attributes)) {
      assert.doesNotMatch(attributes, /href="https?:/i);
    }
  }
});

test("the build preserves exact schema bytes and stays within its size budget", async () => {
  const [builtSchema, sourceSchema] = await Promise.all([
    readBuilt("schemas/0.0.1/profile.schema.json"),
    readFile(
      path.join(repositoryRoot, "public/schemas/0.0.1/profile.schema.json"),
    ),
  ]);
  assert.equal(builtSchema.equals(sourceSchema), true);

  const schemaPath = path.join(distDir, "schemas/0.0.1/profile.schema.json");
  const files = await listFiles(distDir);
  let totalBytes = 0;
  for (const file of files) {
    if (file !== schemaPath) {
      totalBytes += (await stat(file)).size;
    }
  }
  assert.ok(totalBytes <= 150 * 1024, `${totalBytes} bytes exceeds 150 KiB`);
});
