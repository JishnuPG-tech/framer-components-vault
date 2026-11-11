import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { qualityLoop, applyAutomatedRepairs } from '../src/repair/repair-loop.js';
import { runFullAudit } from '../src/repair/repair-loop.js';

const TEST_DIR = path.resolve(process.cwd(), '.test_repair_run');

test.beforeEach(() => {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

test.afterEach(() => {
  if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

test('Autonomous repair loop detects defects, applies surgical codemods, and passes on re-audit', async () => {
  const sloppyComponent = `
    import * as React from 'react';

    export function SloppyComponent() {
      return (
        <div style={{ transition: "all 0.3s ease" }}>
          <h1>Lorem ipsum dolor sit amet</h1>
          <button className="outline-none h-6 w-6">Click me</button>
          <img src="/sample.png" />
        </div>
      );
    }
  `;

  const componentPath = path.join(TEST_DIR, 'sloppy-card.tsx');
  fs.writeFileSync(componentPath, sloppyComponent, 'utf-8');

  // Initial audit should fail with blockers and major findings
  const initialAudit = await runFullAudit({ rootDir: TEST_DIR });
  assert.equal(initialAudit.passed, false, 'Initial sloppy component must fail');
  assert.ok(initialAudit.findings.length >= 3, 'Must detect multiple violations');

  // Run the autonomous quality loop
  const repairReport = await qualityLoop({ rootDir: TEST_DIR }, 4);

  // Assert that qualityLoop successfully repaired the files
  assert.equal(repairReport.status, 'passed', 'Repair loop must pass after applying codemods');
  assert.ok(repairReport.repairedFiles.length > 0, 'Must record repaired files');

  // Verify the file content on disk was actually repaired
  const repairedContent = fs.readFileSync(componentPath, 'utf-8');
  assert.ok(!repairedContent.includes('Lorem ipsum'), 'Lorem ipsum must be eradicated');
  assert.ok(!repairedContent.includes('transition: "all 0.3s ease"'), 'Uncalibrated transition must be replaced');
  assert.ok(repairedContent.includes('alt='), 'Image must have alt tag added');
  assert.ok(repairedContent.includes('focus-visible'), 'Focus ring must be added to outline-none');

  // Post-repair audit must be clean
  const finalAudit = await runFullAudit({ rootDir: TEST_DIR });
  assert.equal(finalAudit.passed, true, 'Final audit must be certified as passing');
  assert.equal(finalAudit.blocked, false, 'Zero blockers must remain');
});
