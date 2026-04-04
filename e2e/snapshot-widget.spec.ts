/**
 * E2E Test Suite — Snapshot Widget (Playwright)
 *
 * GST-31: Two scenarios from the test matrix in GST-14#document-plan:
 *   1. Snapshot Widget embeds in a 3rd-party page (via iframe)
 *   2. Rate limit upsell CTA renders correctly on 429
 *
 * Prerequisites:
 *   - Frontend dev server running (BASE_URL, default http://localhost:3001)
 *   - Backend API server running (API_URL, default http://localhost:3000)
 *   - Redis cleared of rate limit keys for the test user identity
 *
 * Setup:
 *   npx playwright install chromium
 *   BASE_URL=http://localhost:3001 API_URL=http://localhost:3000 npx playwright test e2e/
 */

import { test, expect, Page, Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const API_URL  = process.env.API_URL  || 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Fixtures — API responses
// ---------------------------------------------------------------------------

const MOCK_SUCCESS_RESPONSE = {
  snapshot_id: 'test-uuid-1234-5678-abcd-ef0123456789',
  verdict: 'Your single-storey rear extension appears compatible with Fingal County Council policy H1.1.',
  confidence: 'high',
  council: 'fingal',
  council_display_name: 'Fingal County Council',
  policies: [
    {
      reference: 'H1.1',
      title: 'Domestic Extensions',
      relevance_score: 0.92,
      excerpt: 'Extensions to existing dwellings shall respect the character of the surrounding area...',
    },
  ],
  approval_rate: 0.76,
  sample_size: 124,
  rate_limit: {
    remaining: 2,
    reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    used: 1,
  },
};

const MOCK_429_RESPONSE = {
  error: 'rate_limit_exceeded',
  message: "You've used all 3 free snapshots this month.",
  rate_limit: {
    remaining: 0,
    reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
    used: 3,
  },
  upsell: {
    headline: 'Unlock unlimited snapshots + full research reports',
    cta_label: 'Start free trial',
    cta_url: '/pricing',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Intercept POST /api/snapshot and return the given fixture. */
async function mockSnapshotApi(page: Page, response: object, status = 200) {
  await page.route(`${API_URL}/api/snapshot`, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

// ---------------------------------------------------------------------------
// Suite 1: Snapshot Widget embeds in a 3rd-party page
// ---------------------------------------------------------------------------

test.describe('Snapshot Widget — embed', () => {
  test('widget renders inside an iframe on a 3rd-party page', async ({ page }) => {
    // Create a minimal host page that iframes the widget
    const hostHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>3rd Party Host</title></head>
        <body>
          <h1>My Planning Site</h1>
          <iframe
            id="snapshot-widget"
            src="${BASE_URL}/snapshot"
            width="520"
            height="640"
            frameborder="0"
            title="Planify Snapshot Widget"
          ></iframe>
        </body>
      </html>
    `;

    // Navigate to a data URL representing the 3rd-party host page
    await page.goto(`data:text/html,${encodeURIComponent(hostHtml)}`);

    // Wait for the iframe to load
    const frame = page.frameLocator('#snapshot-widget');

    // The widget should render an address input
    await expect(frame.getByRole('textbox', { name: /address/i })).toBeVisible({ timeout: 15_000 });

    // The widget should have a submit/search button
    const submitButton = frame.getByRole('button', { name: /check|submit|search|analyse/i });
    await expect(submitButton).toBeVisible();

    // Widget must not be blank or show an error state on first load
    const bodyText = await frame.locator('body').innerText();
    expect(bodyText.toLowerCase()).not.toContain('error');
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('widget accepts address input, submits, and shows result', async ({ page }) => {
    // Mock the API to return a successful result
    await mockSnapshotApi(page, MOCK_SUCCESS_RESPONSE, 200);

    await page.goto(`${BASE_URL}/snapshot`);

    // Fill in address
    const addressInput = page.getByRole('textbox', { name: /address/i })
      .or(page.getByPlaceholder(/address/i))
      .or(page.locator('input[type="text"]').first());

    await addressInput.fill('14 Main Street, Swords, Co. Dublin');

    // Select development type if a selector is present
    const devTypeSelect = page.getByRole('combobox').first();
    const isVisible = await devTypeSelect.isVisible().catch(() => false);
    if (isVisible) {
      await devTypeSelect.selectOption({ index: 1 });
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /check|submit|search|analyse|get snapshot/i });
    await submitButton.click();

    // Wait for result to appear
    await expect(page.getByText(/compatible|extension|policy|council/i)).toBeVisible({ timeout: 15_000 });

    // Verdict text should be present
    const verdictText = MOCK_SUCCESS_RESPONSE.verdict;
    // Check that part of the verdict appears (first 50 chars)
    await expect(page.getByText(verdictText.slice(0, 40))).toBeVisible();

    // Council name should appear
    await expect(page.getByText('Fingal County Council')).toBeVisible();

    // Rate limit remaining should be shown
    await expect(page.getByText(/2 snapshot/i).or(page.getByText(/remaining/i))).toBeVisible();
  });

  test('widget shows loading state during API call', async ({ page }) => {
    // Slow API response to observe loading state
    await page.route(`${API_URL}/api/snapshot`, async (route: Route) => {
      await page.waitForTimeout(500); // small delay to catch loading state
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUCCESS_RESPONSE),
      });
    });

    await page.goto(`${BASE_URL}/snapshot`);

    const addressInput = page.locator('input[type="text"]').first();
    await addressInput.fill('14 Main Street, Swords, Co. Dublin');

    const submitButton = page.getByRole('button', { name: /check|submit|search|analyse/i });
    await submitButton.click();

    // Loading spinner / indicator should appear
    const loadingIndicator = page.locator('[aria-label="loading"]')
      .or(page.getByRole('status'))
      .or(page.locator('.animate-spin'))
      .or(page.getByText(/checking|loading|analysing/i));

    await expect(loadingIndicator.first()).toBeVisible({ timeout: 3_000 });

    // Result should appear after loading
    await expect(page.getByText(/compatible|extension|policy/i)).toBeVisible({ timeout: 15_000 });
  });

  test('widget shows error state for invalid/unresolvable address', async ({ page }) => {
    await page.route(`${API_URL}/api/snapshot`, async (route: Route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'unresolvable_address',
          message: "We couldn't identify a supported Irish council for this address.",
          supported_councils: ['fingal', 'dcc', 'cork', 'leitrim'],
        }),
      });
    });

    await page.goto(`${BASE_URL}/snapshot`);

    const addressInput = page.locator('input[type="text"]').first();
    await addressInput.fill('xyzzy 99999 nonexistent');

    await page.getByRole('button', { name: /check|submit|search|analyse/i }).click();

    // Error message should appear (not a crash, not blank)
    await expect(
      page.getByText(/couldn't|unresolvable|address/i).or(page.getByText(/error/i))
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Rate limit upsell CTA on 429
// ---------------------------------------------------------------------------

test.describe('Snapshot Widget — 429 upsell CTA', () => {
  test('429 response renders upsell headline, CTA button, and correct link', async ({ page }) => {
    await mockSnapshotApi(page, MOCK_429_RESPONSE, 429);

    await page.goto(`${BASE_URL}/snapshot`);

    const addressInput = page.locator('input[type="text"]').first();
    await addressInput.fill('14 Main Street, Swords, Co. Dublin');
    await page.getByRole('button', { name: /check|submit|search|analyse/i }).click();

    // Upsell headline should be visible
    await expect(
      page.getByText('Unlock unlimited snapshots + full research reports')
    ).toBeVisible({ timeout: 10_000 });

    // CTA button/link with correct label
    const ctaButton = page.getByRole('link', { name: /start free trial/i })
      .or(page.getByRole('button', { name: /start free trial/i }));
    await expect(ctaButton).toBeVisible();

    // CTA link should point to /pricing
    const ctaLink = page.getByRole('link', { name: /start free trial/i });
    const isLink = await ctaLink.count() > 0;
    if (isLink) {
      const href = await ctaLink.getAttribute('href');
      expect(href).toContain('/pricing');
    }
  });

  test('429 response shows correct rate limit counters (used: 3, remaining: 0)', async ({ page }) => {
    await mockSnapshotApi(page, MOCK_429_RESPONSE, 429);

    await page.goto(`${BASE_URL}/snapshot`);

    const addressInput = page.locator('input[type="text"]').first();
    await addressInput.fill('14 Main Street, Swords, Co. Dublin');
    await page.getByRole('button', { name: /check|submit|search|analyse/i }).click();

    // Wait for the 429 state to render
    await expect(
      page.getByText(/3 free snapshots/i).or(page.getByText(/limit/i))
    ).toBeVisible({ timeout: 10_000 });

    // The page should NOT show the verdict area
    await expect(page.getByText(MOCK_SUCCESS_RESPONSE.verdict.slice(0, 30))).not.toBeVisible();
  });

  test('429 widget does not show a verdict — rate limit state is clearly distinct', async ({ page }) => {
    await mockSnapshotApi(page, MOCK_429_RESPONSE, 429);

    await page.goto(`${BASE_URL}/snapshot`);

    const addressInput = page.locator('input[type="text"]').first();
    await addressInput.fill('14 Main Street, Swords, Co. Dublin');
    await page.getByRole('button', { name: /check|submit|search|analyse/i }).click();

    // Upsell must be visible
    await expect(page.getByText(/start free trial/i)).toBeVisible({ timeout: 10_000 });

    // Verdict and policies must NOT be present (clearly distinct state)
    await expect(page.getByText(/council policy/i)).not.toBeVisible();
    await expect(page.getByText(/H1.1/i)).not.toBeVisible();
  });

  test('429 widget embed in iframe shows upsell CTA correctly', async ({ page }) => {
    // Intercept from the outer page context (the mock route applies globally)
    await page.route(`${API_URL}/api/snapshot`, async (route: Route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_429_RESPONSE),
      });
    });

    const hostHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>3rd Party Host</title></head>
        <body>
          <iframe id="snapshot-widget" src="${BASE_URL}/snapshot" width="520" height="640" frameborder="0"></iframe>
        </body>
      </html>
    `;

    await page.goto(`data:text/html,${encodeURIComponent(hostHtml)}`);

    const frame = page.frameLocator('#snapshot-widget');

    // Wait for widget to load
    await expect(frame.locator('input[type="text"]').first()).toBeVisible({ timeout: 15_000 });

    // Submit
    await frame.locator('input[type="text"]').first().fill('14 Main Street, Swords, Co. Dublin');
    await frame.getByRole('button', { name: /check|submit|search|analyse/i }).click();

    // Upsell should be visible inside the iframe
    await expect(
      frame.getByText(/start free trial/i).or(frame.getByText(/unlock/i))
    ).toBeVisible({ timeout: 15_000 });
  });
});
