import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function openHome(page: Page) {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(String(error)));
  await page.goto("/");
  await expect(page.getByText("Detecting IP")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Copy IPv4" }).first(),
  ).toBeVisible();
  return problems;
}

test.describe("home page", () => {
  test("names the product in the h1 and reports the address", async ({
    page,
  }) => {
    const problems = await openHome(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      /What's My IP/i,
    );
    await expect(page.getByText("Not observed on this request")).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("does not run the WebRTC test until asked", async ({ page }) => {
    await openHome(page);
    await expect(page.getByText("Not tested", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Run WebRTC test" }),
    ).toBeEnabled();
  });

  test("reveals advanced signals on demand", async ({ page }) => {
    await openHome(page);
    await page.getByRole("button", { name: /show advanced signals/i }).click();
    await expect(
      page.getByRole("button", { name: /show basic signals/i }),
    ).toBeVisible();
  });

  for (const viewport of VIEWPORTS) {
    test(`has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openHome(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`has no serious accessibility violations in ${scheme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await openHome(page);
      // Let entrance animations settle so contrast is measured on final colors.
      await page.waitForTimeout(1_000);

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );

      expect(
        blocking.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          targets: violation.nodes.slice(0, 3).flatMap((node) => node.target),
        })),
      ).toEqual([]);
    });
  }
});
