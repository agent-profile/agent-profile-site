import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "yaml";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const actionPins = new Set([
  "3d3c42e5aac5ba805825da76410c181273ba90b1",
  "820762786026740c76f36085b0efc47a31fe5020",
  "45bfe0192ca1faeb007ade9deae92b16b8254a0d",
  "fc324d3547104276b827a68afc52ff2a11cc49c9",
  "cd2ce8fcbc39b97be8ca5fce6e763baed58fa128",
]);
const requiredCommands = [
  "npm run format:check",
  "npm run check",
  "npm run verify:schema -- --upstream .upstream/agent-profile-spec",
  "npm test",
  "npm run build",
  "npx playwright install --with-deps chromium",
  "npm run test:e2e",
];

async function readWorkflow(name) {
  const source = await readFile(
    path.join(repositoryRoot, ".github/workflows", name),
    "utf8",
  );
  return { source, workflow: parse(source) };
}

function allSteps(workflow) {
  return Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
}

function actionUses(workflow) {
  return allSteps(workflow)
    .map((step) => step.uses)
    .filter((uses) => typeof uses === "string");
}

function assertFullQualityGate(steps) {
  const commands = steps
    .map((step) => step.run)
    .filter((run) => typeof run === "string")
    .join("\n");
  for (const command of requiredCommands) {
    assert.match(
      commands,
      new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
}

function assertPinnedActions(workflow) {
  for (const uses of actionUses(workflow)) {
    assert.match(uses, /@[0-9a-f]{40}$/, `${uses} must use a full SHA`);
  }
}

function assertSafeCheckouts(workflow) {
  const checkouts = allSteps(workflow).filter((step) =>
    step.uses?.startsWith("actions/checkout@"),
  );
  assert.ok(checkouts.length >= 2);
  for (const checkout of checkouts) {
    assert.equal(checkout.with?.["persist-credentials"], false);
  }
  assert.ok(
    checkouts.some(
      (checkout) =>
        checkout.with?.repository === "agent-profile/agent-profile-spec" &&
        checkout.with?.ref === "${{ steps.schema.outputs.commit }}" &&
        checkout.with?.path === ".upstream/agent-profile-spec",
    ),
  );
}

test("pull-request CI is read-only, complete, and cannot deploy", async () => {
  const { source, workflow } = await readWorkflow("ci.yml");

  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.ok(workflow.on.pull_request !== undefined);
  assert.deepEqual(workflow.on.push["branches-ignore"], ["main"]);
  assert.deepEqual(Object.keys(workflow.jobs), ["verify"]);
  assert.equal(source.includes("pull_request_target"), false);
  assert.equal(source.includes("pages: write"), false);
  assert.equal(source.includes("id-token: write"), false);
  assertPinnedActions(workflow);
  assertSafeCheckouts(workflow);
  assertFullQualityGate(workflow.jobs.verify.steps);
});

test("Pages deployment isolates write permissions behind a successful build", async () => {
  const { source, workflow } = await readWorkflow("deploy-pages.yml");

  assert.deepEqual(workflow.on.push.branches, ["main"]);
  assert.ok(workflow.on.workflow_dispatch !== undefined);
  assert.equal(workflow.on.pull_request, undefined);
  assert.deepEqual(workflow.concurrency, {
    group: "pages",
    "cancel-in-progress": false,
  });
  assert.deepEqual(workflow.jobs.build.permissions, {
    contents: "read",
    pages: "read",
  });
  assert.deepEqual(workflow.jobs.deploy.permissions, {
    contents: "read",
    pages: "write",
    "id-token": "write",
  });
  assert.equal(workflow.jobs.deploy.needs, "build");
  assert.equal(workflow.jobs.deploy.environment.name, "github-pages");
  assert.equal(source.includes("pull_request_target"), false);
  assertPinnedActions(workflow);
  assertSafeCheckouts(workflow);
  assertFullQualityGate(workflow.jobs.build.steps);

  const steps = workflow.jobs.build.steps;
  const uploadIndex = steps.findIndex((step) =>
    step.uses?.startsWith("actions/upload-pages-artifact@"),
  );
  const pagesE2eIndex = steps.findIndex(
    (step) => step.name === "Test Pages artifact",
  );
  assert.ok(pagesE2eIndex >= 0 && pagesE2eIndex < uploadIndex);
  assert.equal(steps[uploadIndex].with.path, "dist/");
});

test("all expected immutable action releases are represented", async () => {
  const [ci, pages] = await Promise.all([
    readWorkflow("ci.yml"),
    readWorkflow("deploy-pages.yml"),
  ]);
  const usedPins = new Set(
    [...actionUses(ci.workflow), ...actionUses(pages.workflow)].map((uses) =>
      uses.slice(uses.lastIndexOf("@") + 1),
    ),
  );

  assert.deepEqual(usedPins, actionPins);
});
