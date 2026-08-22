#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { verifySchemaProvenance } from "./schema-provenance.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const args = process.argv.slice(2);

let upstreamDir;
if (args.length > 0) {
  if (args.length !== 2 || args[0] !== "--upstream" || args[1].length === 0) {
    throw new TypeError(
      "Usage: verify-schema-provenance.mjs [--upstream <dir>]",
    );
  }
  upstreamDir = path.resolve(args[1]);
}

await verifySchemaProvenance({ rootDir, upstreamDir });
console.log("Schema provenance verified.");
