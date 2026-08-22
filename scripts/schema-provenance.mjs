import { execFile } from "node:child_process";
import { createHash, timingSafeEqual } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const commitPattern = /^[0-9a-f]{40}$/;
const digestPattern = /^[0-9a-f]{64}$/;
const lockKeys = ["version", "repository", "commit", "files"];
const fileKeys = ["source", "target", "sha256"];

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertExactKeys(value, expectedKeys, label) {
  assertPlainObject(value, label);
  const actualKeys = Object.keys(value);
  const unknownKeys = actualKeys.filter((key) => !expectedKeys.includes(key));
  const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));

  if (unknownKeys.length > 0) {
    throw new TypeError(`${label} has unknown key: ${unknownKeys.join(", ")}.`);
  }
  if (missingKeys.length > 0) {
    throw new TypeError(`${label} is missing key: ${missingKeys.join(", ")}.`);
  }
}

function validateSchemaPath(value, { label, prefix }) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Invalid ${label} path: expected a nonempty string.`);
  }

  const segments = value.split("/");
  const isInvalid =
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    path.posix.normalize(value) !== value ||
    segments.includes(".") ||
    segments.includes("..") ||
    !value.startsWith(`${prefix}/`) ||
    value === prefix;

  if (isInvalid) {
    throw new TypeError(`Invalid ${label} path: ${value}.`);
  }

  return value;
}

function isInside(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}

async function assertContainedRegularFile({
  rootDir,
  relativePath,
  prefix,
  label,
}) {
  const absoluteRoot = path.resolve(rootDir);
  const rootStat = await lstat(absoluteRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new TypeError(`${label} root must be a real directory.`);
  }

  let currentPath = absoluteRoot;
  const segments = relativePath.split("/");
  for (const [index, segment] of segments.entries()) {
    currentPath = path.join(currentPath, segment);
    let fileStat;
    try {
      fileStat = await lstat(currentPath);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        throw new Error(`Missing ${label} file: ${relativePath}.`);
      }
      throw error;
    }

    if (fileStat.isSymbolicLink()) {
      throw new TypeError(
        `${label} path contains a symbolic link: ${relativePath}.`,
      );
    }

    const isLast = index === segments.length - 1;
    if (isLast && !fileStat.isFile()) {
      throw new TypeError(
        `${label} path is not a regular file: ${relativePath}.`,
      );
    }
    if (!isLast && !fileStat.isDirectory()) {
      throw new TypeError(
        `${label} parent is not a directory: ${relativePath}.`,
      );
    }
  }

  const permittedRoot = path.resolve(absoluteRoot, ...prefix.split("/"));
  const [realPermittedRoot, realFile] = await Promise.all([
    realpath(permittedRoot),
    realpath(currentPath),
  ]);
  if (!isInside(realPermittedRoot, realFile)) {
    throw new TypeError(`${label} path escapes ${prefix}: ${relativePath}.`);
  }

  return realFile;
}

export async function loadSchemaLock(rootDir) {
  const lockPath = path.join(path.resolve(rootDir), "schemas.lock.json");
  let lockBytes;
  try {
    const lockStat = await lstat(lockPath);
    if (lockStat.isSymbolicLink() || !lockStat.isFile()) {
      throw new TypeError(
        "Schema lock must be a regular file, not a symbolic link.",
      );
    }
    lockBytes = await readFile(lockPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error("Missing schemas.lock.json.");
    }
    throw error;
  }

  let lock;
  try {
    lock = JSON.parse(lockBytes);
  } catch (error) {
    throw new SyntaxError(`Invalid schemas.lock.json: ${error.message}`);
  }

  assertExactKeys(lock, lockKeys, "Schema lock");
  if (lock.version !== 1) {
    throw new TypeError("Schema lock version must equal 1.");
  }
  if (lock.repository !== "agent-profile/agent-profile-spec") {
    throw new TypeError(
      "Schema lock repository must equal agent-profile/agent-profile-spec.",
    );
  }
  if (typeof lock.commit !== "string" || !commitPattern.test(lock.commit)) {
    throw new TypeError(
      "Schema lock commit must be a 40-character lowercase hexadecimal SHA.",
    );
  }
  if (!Array.isArray(lock.files) || lock.files.length === 0) {
    throw new TypeError("Schema lock files must be a nonempty array.");
  }

  const seenSources = new Set();
  const seenTargets = new Set();
  for (const [index, file] of lock.files.entries()) {
    const label = `Schema lock files[${index}]`;
    assertExactKeys(file, fileKeys, label);
    validateSchemaPath(file.source, { label: "source", prefix: "schemas" });
    validateSchemaPath(file.target, {
      label: "target",
      prefix: "public/schemas",
    });
    if (typeof file.sha256 !== "string" || !digestPattern.test(file.sha256)) {
      throw new TypeError(
        `${label} sha256 must be a 64-character lowercase hexadecimal value.`,
      );
    }
    if (seenSources.has(file.source) || seenTargets.has(file.target)) {
      throw new TypeError(`${label} duplicates a source or target path.`);
    }
    seenSources.add(file.source);
    seenTargets.add(file.target);
  }

  return lock;
}

export async function sha256File(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export async function verifySchemaProvenance({ rootDir, upstreamDir }) {
  if (typeof rootDir !== "string" || rootDir.length === 0) {
    throw new TypeError("rootDir must be a nonempty path.");
  }

  const lock = await loadSchemaLock(rootDir);
  if (upstreamDir !== undefined) {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", path.resolve(upstreamDir), "rev-parse", "HEAD"],
      { encoding: "utf8" },
    );
    const upstreamCommit = stdout.trim();
    if (upstreamCommit !== lock.commit) {
      throw new Error(
        `Upstream commit mismatch: expected ${lock.commit}, received ${upstreamCommit}.`,
      );
    }
  }

  for (const file of lock.files) {
    const mirrorPath = await assertContainedRegularFile({
      rootDir,
      relativePath: file.target,
      prefix: "public/schemas",
      label: "target",
    });
    const actualDigest = await sha256File(mirrorPath);
    const actualBytes = Buffer.from(actualDigest, "hex");
    const expectedBytes = Buffer.from(file.sha256, "hex");
    if (!timingSafeEqual(actualBytes, expectedBytes)) {
      throw new Error(`Schema digest mismatch for ${file.target}.`);
    }

    if (upstreamDir !== undefined) {
      const sourcePath = await assertContainedRegularFile({
        rootDir: upstreamDir,
        relativePath: file.source,
        prefix: "schemas",
        label: "source",
      });
      const [mirrorBytes, sourceBytes] = await Promise.all([
        readFile(mirrorPath),
        readFile(sourcePath),
      ]);
      if (!mirrorBytes.equals(sourceBytes)) {
        throw new Error(
          `Schema byte mismatch between ${file.target} and ${file.source}.`,
        );
      }
    }
  }

  return lock;
}
