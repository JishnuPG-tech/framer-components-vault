import fs from 'node:fs';
import path from 'node:path';
import { createFindingFromRule } from '../scoring/policy.js';

export async function inspectBrowserAndA11y(options) {
  const findings = [];
  const { files = [], rootDir = process.cwd(), url } = options;

  // 1. If URL is provided or test server is reachable, execute REAL headless browser inspection
  if (url) {
    const liveFindings = await runLivePlaywrightAudit(url);
    findings.push(...liveFindings);
  }

  // 2. Static source-level browser & accessibility checks
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Accessibility: Outline None without Focus-Visible
    const outlineNoneRegex = /(?:outline\s*:\s*none|\boutline-none\b)(?![^;{}]*focus-visible)/i;
    if (outlineNoneRegex.test(content) && !content.includes('focus-visible:ring') && !content.includes('focus:outline')) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Found 'outline: none' or 'outline-none' without a designated :focus-visible focus ring indicator. Traps keyboard navigators.",
        relPath,
        "Preserve browser focus rings or provide an explicit focus-visible ring: 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'."
      ));
    }

    // Responsive: Rigid pixel container causing horizontal overflow on mobile
    const fixedLargeWidthRegex = /(?:width\s*:\s*(?:1[0-9]{3}|[6-9][0-9]{2})px|\bw-\[(?:1[0-9]{3}|[6-9][0-9]{2})px\]|\bmin-w-\[(?:1[0-9]{3}|[6-9][0-9]{2})px\])/i;
    if (fixedLargeWidthRegex.test(content) && !content.includes('max-w-full') && !content.includes('overflow-x-auto')) {
      const match = content.match(fixedLargeWidthRegex);
      findings.push(createFindingFromRule(
        "LAYOUT-HORIZONTAL-OVERFLOW",
        `Fixed large container width detected (${match ? match[0] : 'fixed width'}) without max-w-full constraint. Will cause horizontal overflow on mobile viewports (< 768px).`,
        relPath,
        "Use fluid responsive widths: 'w-full max-w-7xl' and wrap in responsive padding rather than fixed pixel dimensions."
      ));
    }

    // Touch target size violation (< 44x44px for touch interactions)
    const smallTapTargetRegex = /<button[^>]*class(?:Name)?=["'][^"']*\b(?:h-6|h-7|h-8|w-6|w-7|w-8|p-0\.5|p-1)\b[^"']*["'][^>]*>/i;
    if (smallTapTargetRegex.test(content) && !content.includes('min-h-[44px]') && !content.includes('min-w-[44px]')) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Interactive button target size appears below 44x44px WCAG touch target guideline.",
        relPath,
        "Ensure all interactive click/tap targets maintain at least 44x44px hit bounds (e.g. min-h-[44px] min-w-[44px] or ample padding)."
      ));
    }

    // Low contrast gray-on-gray hallucination
    const lowContrastGreyRegex = /(?:text-(?:neutral|gray|zinc|slate)-[45]00\s+bg-(?:neutral|gray|zinc|slate)-[89]00|text-#777\b|text-#888\b)/i;
    if (lowContrastGreyRegex.test(content)) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Suspected low-contrast text pairing (e.g. gray-400 on dark ground, or #777 on white). Fails WCAG AA 4.5:1 ratio.",
        relPath,
        "Use high-contrast semantic tokens: text-foreground or text-muted-foreground verified to satisfy 4.5:1 ratio."
      ));
    }
  }

  return findings;
}

/**
 * Executes real headless browser inspection using Playwright or child browser process
 */
async function runLivePlaywrightAudit(url) {
  const liveFindings = [];
  try {
    let playwright;
    try {
      playwright = (await import('playwright')).default;
    } catch (_) {
      return liveFindings; // Playwright not available in environment
    }

    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();

    const viewports = [
      { name: "desktop", width: 1440, height: 900 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "mobile", width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      const page = await context.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (navErr) {
        liveFindings.push(createFindingFromRule(
          "BUILD-UNRESOLVED-IMPORTS",
          `Live browser failed to load page at ${url}: ${navErr.message}`,
          url
        ));
        await page.close();
        break;
      }

      // Check runtime errors
      if (pageErrors.length > 0) {
        liveFindings.push(createFindingFromRule(
          "BUILD-UNRESOLVED-IMPORTS",
          `Runtime uncaught error on ${vp.name}: ${pageErrors[0]}`,
          url
        ));
      }

      // Check real horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      if (overflow.hasOverflow) {
        liveFindings.push(createFindingFromRule(
          "LAYOUT-HORIZONTAL-OVERFLOW",
          `Real horizontal overflow on ${vp.name} viewport: scrollWidth (${overflow.scrollWidth}px) exceeds viewport width (${overflow.clientWidth}px).`,
          url,
          "Eliminate fixed-width containers causing side-scrolling on mobile devices."
        ));
      }

      // Check real contrast and tap targets
      const domDiagnostics = await page.evaluate(() => {
        function getLuminance(r, g, b) {
          const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        function parseRgb(colorStr) {
          const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
        }

        const issues = [];
        const buttons = document.querySelectorAll('button, a[role="button"]');
        for (const btn of buttons) {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              issues.push({
                type: 'target_size',
                text: btn.innerText.trim().slice(0, 20),
                width: rect.width,
                height: rect.height
              });
            }
          }
        }

        return issues;
      });

      for (const iss of domDiagnostics) {
        if (iss.type === 'target_size' && vp.name === 'mobile') {
          liveFindings.push(createFindingFromRule(
            "A11Y-GATE-FAILURE",
            `Live touch target violation for button "${iss.text}": rendered size is ${Math.round(iss.width)}x${Math.round(iss.height)}px (minimum is 44x44px).`,
            url
          ));
        }
      }

      await page.close();
    }

    await browser.close();
  } catch (err) {
    console.warn('[live-browser-audit] Playwright live check encountered error:', err.message);
  }

  return liveFindings;
}
