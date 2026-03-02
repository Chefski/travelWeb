import { test, expect } from '@playwright/test';

const THRESHOLDS = {
  pageLoadMs: 3000,
  domContentLoadedMs: 2000,
  timeToInteractiveMs: 4000,
  lcpMs: 2500,
  clsScore: 0.1,
};

const APP_URL = '/travelWeb/';

interface PerformanceMetrics {
  pageLoad: number;
  domContentLoaded: number;
  domInteractive: number;
}

test.describe('page performance', () => {
  test('page load and DOM timings are within budget', async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'load' });

    const timings: PerformanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        pageLoad: nav.loadEventEnd - nav.startTime,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        domInteractive: nav.domInteractive - nav.startTime,
      };
    });

    console.log('--- Page Load Timings ---');
    console.log(`  Page Load:          ${timings.pageLoad.toFixed(0)} ms (limit: ${THRESHOLDS.pageLoadMs} ms)`);
    console.log(`  DOM Content Loaded: ${timings.domContentLoaded.toFixed(0)} ms (limit: ${THRESHOLDS.domContentLoadedMs} ms)`);
    console.log(`  DOM Interactive:    ${timings.domInteractive.toFixed(0)} ms`);

    expect(timings.pageLoad, `Page load ${timings.pageLoad.toFixed(0)}ms exceeds ${THRESHOLDS.pageLoadMs}ms`).toBeLessThan(THRESHOLDS.pageLoadMs);
    expect(timings.domContentLoaded, `DCL ${timings.domContentLoaded.toFixed(0)}ms exceeds ${THRESHOLDS.domContentLoadedMs}ms`).toBeLessThan(THRESHOLDS.domContentLoadedMs);
  });

  test('Largest Contentful Paint is within budget', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__LCP_ENTRIES__ = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as any).__LCP_ENTRIES__.push(entry.startTime);
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const lcpMs: number = await page.evaluate(() => {
      const entries = (window as any).__LCP_ENTRIES__ as number[];
      return entries.length > 0 ? entries[entries.length - 1] : -1;
    });

    console.log('--- Largest Contentful Paint ---');
    if (lcpMs === -1) {
      console.log('  LCP: no entry recorded (page may have no contentful paint)');
      return;
    }
    console.log(`  LCP: ${lcpMs.toFixed(0)} ms (limit: ${THRESHOLDS.lcpMs} ms)`);

    expect(lcpMs, `LCP ${lcpMs.toFixed(0)}ms exceeds ${THRESHOLDS.lcpMs}ms`).toBeLessThan(THRESHOLDS.lcpMs);
  });

  test('Cumulative Layout Shift is within budget', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__CLS_SCORE__ = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            (window as any).__CLS_SCORE__ += layoutShift.value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForTimeout(3000);

    const cls: number = await page.evaluate(() => (window as any).__CLS_SCORE__);

    console.log('--- Cumulative Layout Shift ---');
    console.log(`  CLS: ${cls.toFixed(4)} (limit: ${THRESHOLDS.clsScore})`);

    expect(cls, `CLS ${cls.toFixed(4)} exceeds ${THRESHOLDS.clsScore}`).toBeLessThan(THRESHOLDS.clsScore);
  });

  test('time to interactive is within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto(APP_URL, { waitUntil: 'load' });

    // Wait for Vue to mount (#__nuxt gets children once the app renders)
    await page.waitForSelector('#__nuxt > *', { state: 'attached', timeout: 10_000 });

    // Verify a button is visible and interactive
    const button = page.locator('button').first();
    await button.waitFor({ state: 'visible', timeout: 5_000 });

    const tti = Date.now() - start;

    console.log('--- Time to Interactive ---');
    console.log(`  TTI: ${tti} ms (limit: ${THRESHOLDS.timeToInteractiveMs} ms)`);

    expect(tti, `TTI ${tti}ms exceeds ${THRESHOLDS.timeToInteractiveMs}ms`).toBeLessThan(THRESHOLDS.timeToInteractiveMs);
  });
});
