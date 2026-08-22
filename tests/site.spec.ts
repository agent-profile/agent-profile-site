import { createHash } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const schemaDigest =
  "6e25db7f595ed331b89f87605c3a325ce5a2aad070a8f736a3d0fd64976baaf6";
const specificationUrl =
  "https://github.com/agent-profile/agent-profile-spec/blob/6e56a3c3e1e8684d1b280374a92d4801dababb03/spec/0.0.1.md";

test("serves the page and exact versioned schema over HTTP", async ({
  page,
  request,
}) => {
  const response = await page.goto("./");
  expect(response?.status()).toBe(200);

  const schemaResponse = await request.get("schemas/0.0.1/profile.schema.json");
  expect(schemaResponse.status()).toBe(200);
  expect(schemaResponse.headers()["content-type"]).toContain(
    "application/json",
  );
  const digest = createHash("sha256")
    .update(await schemaResponse.body())
    .digest("hex");
  expect(digest).toBe(schemaDigest);

  expect((await request.get("missing.txt")).status()).toBe(404);
  expect(
    (await request.post("schemas/0.0.1/profile.schema.json")).status(),
  ).toBe(405);
  expect((await request.get("%2e%2e%2fpackage.json")).status()).toBe(400);
});

test("exposes exact navigation destinations and visible keyboard focus", async ({
  page,
}) => {
  await page.goto("./");

  await expect(
    page.getByRole("link", {
      name: "Specification 0.0.1 (external)",
      exact: true,
    }),
  ).toHaveAttribute("href", specificationUrl);
  await expect(
    page.getByRole("link", { name: "Read the specification (external)" }),
  ).toHaveAttribute("href", specificationUrl);
  await expect(
    page.getByRole("link", { name: "JSON Schema" }).first(),
  ).toHaveAttribute("href", /schemas\/0\.0\.1\/profile\.schema\.json$/);
  await expect(
    page.getByRole("link", { name: "View on GitHub (external)" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/agent-profile/agent-profile-site",
  );

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();

  const focusableCount = await page.locator('a, pre[tabindex="0"]').count();
  for (let index = 0; index < focusableCount; index += 1) {
    expect(
      await page.evaluate(
        (expectedIndex) =>
          document.activeElement ===
          document.querySelectorAll('a, pre[tabindex="0"]')[expectedIndex],
        index,
      ),
    ).toBe(true);
    const focused = page.locator(":focus");
    const focusStyle = await focused.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.outlineColor,
        visible: element.matches(":focus-visible"),
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusStyle.visible).toBe(true);
    expect(focusStyle.style).not.toBe("none");
    expect(focusStyle.width).toBeGreaterThanOrEqual(3);
    if (index < focusableCount - 1) await page.keyboard.press("Tab");
  }
});

test("has no accessibility violations, client scripts, console errors, or remote requests", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestOrigins = new Set<string>();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    requestOrigins.add(new URL(request.url()).origin);
  });

  await page.goto("./");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(accessibility.violations).toEqual([]);
  expect(await page.locator("script").count()).toBe(0);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect([...requestOrigins]).toEqual([new URL(page.url()).origin]);
});

test("contains horizontal scrolling to code at narrow and enlarged viewports", async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    const overflow = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
    if (width === 320) {
      const codeOverflow = await page.locator("pre").evaluate((element) => ({
        client: element.clientWidth,
        scroll: element.scrollWidth,
      }));
      expect(codeOverflow.scroll).toBeGreaterThan(codeOverflow.client);
    }
  }

  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto("./");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  const enlargedOverflow = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(enlargedOverflow.scroll).toBeLessThanOrEqual(enlargedOverflow.client);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("removes motion when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const longestDuration = await page.evaluate(() => {
    const milliseconds = (value: string) =>
      value.split(",").map((duration) => {
        const trimmed = duration.trim();
        return trimmed.endsWith("ms")
          ? Number.parseFloat(trimmed)
          : Number.parseFloat(trimmed) * 1000;
      });
    return Math.max(
      ...[...document.querySelectorAll("*")].flatMap((element) => {
        const style = getComputedStyle(element);
        return [
          ...milliseconds(style.animationDuration),
          ...milliseconds(style.transitionDuration),
        ];
      }),
    );
  });

  expect(longestDuration).toBeLessThanOrEqual(0.01);
});

test("remains a coherent document when CSS is unavailable", async ({
  page,
}) => {
  await page.route("**/*.css", (route) => route.abort());
  await page.goto("./");

  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "An open standard for portable agent profiles.",
  );
  await expect(page.locator("pre")).toContainText("Research Librarian");
  expect(await page.locator("a").count()).toBeGreaterThan(8);
});
