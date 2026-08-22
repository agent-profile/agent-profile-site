import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  loadSchemaLock,
  sha256File,
  verifySchemaProvenance,
} from "../scripts/schema-provenance.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const reviewedCommit = "6e56a3c3e1e8684d1b280374a92d4801dababb03";

function lockFor({
  commit = reviewedCommit,
  source = "schemas/0.0.1/profile.schema.json",
  target = "public/schemas/0.0.1/profile.schema.json",
  sha256,
}) {
  return {
    version: 1,
    repository: "agent-profile/agent-profile-spec",
    commit,
    files: [{ source, target, sha256 }],
  };
}

async function createFixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "agent-profile-site-"));
  const target = path.join(rootDir, "public/schemas/0.0.1/profile.schema.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, '{"title":"fixture"}\n');
  const sha256 = await sha256File(target);
  await writeFile(
    path.join(rootDir, "schemas.lock.json"),
    `${JSON.stringify(lockFor({ sha256 }), null, 2)}\n`,
  );
  return { rootDir, target, sha256 };
}

async function writeLock(rootDir, lock) {
  await writeFile(
    path.join(rootDir, "schemas.lock.json"),
    `${JSON.stringify(lock, null, 2)}\n`,
  );
}

async function initializeUpstream(upstreamDir, schemaBytes) {
  const source = path.join(upstreamDir, "schemas/0.0.1/profile.schema.json");
  await mkdir(path.dirname(source), { recursive: true });
  execFileSync("git", ["init", "--quiet"], { cwd: upstreamDir });
  execFileSync("git", ["config", "user.name", "Example Maintainer"], {
    cwd: upstreamDir,
  });
  execFileSync("git", ["config", "user.email", "maintainer@example.com"], {
    cwd: upstreamDir,
  });
  await writeFile(source, schemaBytes);
  execFileSync("git", ["add", "schemas/0.0.1/profile.schema.json"], {
    cwd: upstreamDir,
  });
  execFileSync("git", ["commit", "--quiet", "-m", "add schema"], {
    cwd: upstreamDir,
  });
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: upstreamDir,
    encoding: "utf8",
  }).trim();
}

test("the committed lock has the reviewed repository, commit, and digest", async () => {
  const lock = await loadSchemaLock(repositoryRoot);

  assert.equal(lock.repository, "agent-profile/agent-profile-spec");
  assert.equal(lock.commit, reviewedCommit);
  assert.deepEqual(Object.keys(lock).sort(), [
    "commit",
    "files",
    "repository",
    "version",
  ]);
  assert.match(lock.files[0].sha256, /^[0-9a-f]{64}$/);
  await verifySchemaProvenance({ rootDir: repositoryRoot });
});

test("rejects unknown lock keys and malformed commit or digest values", async () => {
  const { rootDir, sha256 } = await createFixture();

  await writeLock(rootDir, { ...lockFor({ sha256 }), branch: "main" });
  await assert.rejects(
    verifySchemaProvenance({ rootDir }),
    /unknown key.*branch/i,
  );

  await writeLock(rootDir, lockFor({ sha256, commit: "main" }));
  await assert.rejects(
    verifySchemaProvenance({ rootDir }),
    /40-character lowercase hexadecimal/i,
  );

  await writeLock(rootDir, lockFor({ sha256: "ABC123" }));
  await assert.rejects(
    verifySchemaProvenance({ rootDir }),
    /64-character lowercase hexadecimal/i,
  );
});

test("rejects a changed or missing mirror", async () => {
  const { rootDir, target } = await createFixture();

  await writeFile(target, '{"title":"changed"}\n');
  await assert.rejects(verifySchemaProvenance({ rootDir }), /digest mismatch/i);

  await unlink(target);
  await assert.rejects(
    verifySchemaProvenance({ rootDir }),
    /missing target file/i,
  );
});

test("rejects symlinked schema files", async () => {
  const { rootDir, target, sha256 } = await createFixture();
  const realTarget = path.join(rootDir, "real-schema.json");
  const linkRoot = await mkdtemp(path.join(os.tmpdir(), "agent-profile-link-"));
  const linkTarget = path.join(
    linkRoot,
    "public/schemas/0.0.1/profile.schema.json",
  );

  await writeFile(realTarget, await readFile(target));
  await mkdir(path.dirname(linkTarget), { recursive: true });
  await symlink(realTarget, linkTarget);
  await writeLock(linkRoot, lockFor({ sha256 }));

  await assert.rejects(
    verifySchemaProvenance({ rootDir: linkRoot }),
    /symbolic link/i,
  );
});

test("rejects absolute paths, traversal, and files outside schema roots", async () => {
  const { rootDir, sha256 } = await createFixture();
  const invalidTargets = [
    "/tmp/profile.schema.json",
    "public/schemas/../profile.schema.json",
    "public/profile.schema.json",
  ];

  for (const target of invalidTargets) {
    await writeLock(rootDir, lockFor({ sha256, target }));
    await assert.rejects(
      verifySchemaProvenance({ rootDir }),
      /invalid target path/i,
    );
  }
});

test("compares exact upstream bytes and commit identity", async () => {
  const { rootDir, target, sha256 } = await createFixture();
  const upstreamDir = await mkdtemp(
    path.join(os.tmpdir(), "agent-profile-upstream-"),
  );
  const schemaBytes = await readFile(target, "utf8");
  const commit = await initializeUpstream(upstreamDir, schemaBytes);

  await writeLock(rootDir, lockFor({ sha256, commit }));
  await verifySchemaProvenance({ rootDir, upstreamDir });

  await writeFile(
    path.join(upstreamDir, "schemas/0.0.1/profile.schema.json"),
    '{"title":"different"}\n',
  );
  await assert.rejects(
    verifySchemaProvenance({ rootDir, upstreamDir }),
    /byte mismatch/i,
  );

  const upstreamSource = path.join(
    upstreamDir,
    "schemas/0.0.1/profile.schema.json",
  );
  const alternateSource = path.join(upstreamDir, "alternate-schema.json");
  await writeFile(alternateSource, schemaBytes);
  await unlink(upstreamSource);
  await symlink(alternateSource, upstreamSource);
  await assert.rejects(
    verifySchemaProvenance({ rootDir, upstreamDir }),
    /symbolic link/i,
  );

  await unlink(upstreamSource);
  await writeFile(upstreamSource, schemaBytes);
  await writeLock(rootDir, lockFor({ sha256, commit: reviewedCommit }));
  await assert.rejects(
    verifySchemaProvenance({ rootDir, upstreamDir }),
    /upstream commit mismatch/i,
  );
});
