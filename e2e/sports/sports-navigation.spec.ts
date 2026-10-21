import { test, expect } from "@playwright/test";
import {
  injectAuth,
  mockAuthRoutes,
  mockSportsDashboardRoutes,
  mockSportsScheduleRoutes,
  mockSportsAdminRoutes,
} from "../fixtures/auth";

test.describe("Sports Module — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
    await mockAuthRoutes(page);
    await mockSportsDashboardRoutes(page);
    await mockSportsScheduleRoutes(page);
    await mockSportsAdminRoutes(page);
  });

  test("renders the Sports breadcrumb and page header", async ({ page }) => {
    await page.goto("/sports");
    await expect(page.getByRole("link", { name: "Sports", exact: true })).toBeVisible();
    await expect(page.getByText("Leagues, teams, schedules")).toBeVisible();
  });

  test("renders all nav bar items for a user with full permissions", async ({ page }) => {
    await page.goto("/sports");
    // Use .first() to avoid strict-mode violations when links appear in both nav and floating button
    await expect(page.getByRole("link", { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /My Sports/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Schedule/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Auction/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Admin/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Analytics/i }).first()).toBeVisible();
  });

  test("navigates to Schedule page from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Schedule/i }).click();
    await expect(page).toHaveURL(/\/sports\/schedule/);
  });

  test("navigates to Admin page from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Admin/i }).click();
    await expect(page).toHaveURL(/\/sports\/admin/);
  });

  test("navigates to My Sports from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /My Sports/i }).click();
    await expect(page).toHaveURL(/\/sports\/my-sports/);
  });

  test("navigates to Analytics from nav bar", async ({ page }) => {
    await page.goto("/sports");
    await page.getByRole("link", { name: /Analytics/i }).click();
    await expect(page).toHaveURL(/\/sports\/analytics/);
  });

  test("highlights the active nav item", async ({ page }) => {
    await page.goto("/sports/schedule");
    // Schedule appears in breadcrumb (nth(0)) and the sports sub-nav pill (nth(1))
    const scheduleLink = page.getByRole("link", { name: "Schedule" }).nth(1);
    await expect(scheduleLink).toBeVisible();
    const color = await scheduleLink.evaluate((el) =>
      getComputedStyle(el.querySelector("div") ?? el).color
    );
    // Active item renders white text — rgb(255, 255, 255)
    expect(color).toBe("rgb(255, 255, 255)");
  });

  test("shows breadcrumb trail with current sub-section", async ({ page }) => {
    await page.goto("/sports/schedule");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sports", exact: true })).toBeVisible();
    // Schedule appears in both breadcrumb and the nav pill — use first()
    await expect(page.getByRole("link", { name: "Schedule" }).first()).toBeVisible();
  });
});
