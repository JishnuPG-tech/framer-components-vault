import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectBrowserAndA11y } from '../src/analyzer/browser-audit.js';

const LIVE_VAULT_URL = 'https://jishnupg-opencode-cli.hf.space/vault/';

async function hasPlaywrightChromium() {
  try {
    const pwMod = await import('playwright');
    const chromium = pwMod.chromium || pwMod.default?.chromium;
    if (!chromium) return false;
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

test('Live-URL browser audit runs cleanly on opencode-cli Vault WebApp without horizontal overflow', async (t) => {
  const browserReady = await hasPlaywrightChromium();
  if (!browserReady) {
    // Still verify graceful degradation when Playwright Chromium is unavailable
    const fallbackFindings = await inspectBrowserAndA11y({ url: LIVE_VAULT_URL });
    assert.ok(Array.isArray(fallbackFindings), 'Should return array gracefully without Playwright binary');
    t.skip('Playwright Chromium binary not installed in this environment; live DOM assertions skipped');
    return;
  }

  const findings = await inspectBrowserAndA11y({ url: LIVE_VAULT_URL });
  assert.ok(Array.isArray(findings), 'Findings should be an array');

  const overflowFindings = findings.filter(f => f.ruleId === 'LAYOUT-HORIZONTAL-OVERFLOW');
  assert.equal(
    overflowFindings.length,
    0,
    `Expected 0 horizontal overflow violations on ${LIVE_VAULT_URL}, found: ${JSON.stringify(overflowFindings)}`
  );

  const loadErrors = findings.filter(f => f.ruleId === 'BUILD-UNRESOLVED-IMPORTS');
  assert.equal(
    loadErrors.length,
    0,
    `Expected 0 page load / runtime errors on ${LIVE_VAULT_URL}, found: ${JSON.stringify(loadErrors)}`
  );
});
