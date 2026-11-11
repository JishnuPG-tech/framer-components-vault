import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { inspectCodeSyntax } from '../src/analyzer/ast-analyzer.js';
import { inspectBrowserAndA11y } from '../src/analyzer/browser-audit.js';
import { inspectDesignQuality } from '../src/analyzer/design-audit.js';
import { calculateQualityScore } from '../src/scoring/score.js';

const TEMP_DIR = path.resolve(process.cwd(), '.test_temp');

test.before(() => {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
});

test.after(() => {
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
});

test('AST Analyzer detects transition: all 0.3s ease and placeholder copy', () => {
  const badCode = `
    export function SloppyHero() {
      return (
        <div style={{ transition: "all 0.3s ease" }}>
          <h1>Lorem ipsum dolor sit amet</h1>
          <button>Click</button>
        </div>
      );
    }
  `;
  const filePath = path.join(TEMP_DIR, 'bad-hero.tsx');
  fs.writeFileSync(filePath, badCode, 'utf-8');

  const findings = inspectCodeSyntax({ files: [filePath], rootDir: TEMP_DIR });
  assert.ok(findings.some(f => f.ruleId === 'MOTION-UNCALIBRATED-TRANSITION'), 'Should detect uncalibrated motion');
  assert.ok(findings.some(f => f.ruleId === 'COPY-PLACEHOLDER-LEAK'), 'Should detect placeholder copy');
});

test('Browser/A11y Analyzer catches outline:none without focus ring', () => {
  const inaccessibleCode = `
    export function BadButton() {
      return <button className="outline-none h-6 w-6">Icon</button>;
    }
  `;
  const filePath = path.join(TEMP_DIR, 'bad-btn.tsx');
  fs.writeFileSync(filePath, inaccessibleCode, 'utf-8');

  const findings = inspectBrowserAndA11y({ files: [filePath], rootDir: TEMP_DIR });
  assert.ok(findings.some(f => f.ruleId === 'A11Y-GATE-FAILURE'), 'Should catch missing focus-visible and small tap target');
});

test('Design Audit catches generic blue-to-purple AI glow', () => {
  const genericGlowCode = `
    export function GenericSection() {
      return (
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <h2>Our Features</h2>
        </section>
      );
    }
  `;
  const filePath = path.join(TEMP_DIR, 'generic-glow.tsx');
  fs.writeFileSync(filePath, genericGlowCode, 'utf-8');

  const findings = inspectDesignQuality({ files: [filePath], rootDir: TEMP_DIR });
  assert.ok(findings.some(f => f.ruleId === 'DESIGN-UNMOTIVATED-GLOW'), 'Should catch unmotivated AI glow');
});

test('Scoring engine enforces blockers strictly', () => {
  const findings = [
    {
      ruleId: 'BUILD-UNRESOLVED-IMPORTS',
      name: 'Unresolved imports',
      severity: 'blocker',
      penalty: -1000,
      category: 'build',
      evidence: 'Missing file ./types.ts',
      repairInstruction: 'Fix import'
    }
  ];

  const result = calculateQualityScore(findings);
  assert.equal(result.blocked, true, 'Blocker must block the output');
  assert.equal(result.passed, false, 'Blocked audit cannot pass');
  assert.equal(result.score, 0, 'Score is 0 when blocked');
});

test('Artisanal human-crafted component passes with 1000/1000 score', () => {
  const pristineCode = `
    import { motion } from "framer-motion";
    const springPreset = { type: "spring", stiffness: 320, damping: 28, mass: 0.8 };

    export function ArtisanalCard({ title, onSelect }: { title: string; onSelect: () => void }) {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={springPreset}
          className="p-6 bg-card text-card-foreground border border-border rounded-xl"
        >
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <button 
            onClick={onSelect}
            className="min-h-[44px] min-w-[44px] px-4 py-2 bg-primary text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explore
          </button>
        </motion.div>
      );
    }
  `;
  const filePath = path.join(TEMP_DIR, 'pristine.tsx');
  fs.writeFileSync(filePath, pristineCode, 'utf-8');

  const codeFindings = inspectCodeSyntax({ files: [filePath], rootDir: TEMP_DIR });
  const browserFindings = inspectBrowserAndA11y({ files: [filePath], rootDir: TEMP_DIR });
  const designFindings = inspectDesignQuality({ files: [filePath], rootDir: TEMP_DIR });

  const allFindings = [...codeFindings, ...browserFindings, ...designFindings];
  const result = calculateQualityScore(allFindings);

  assert.equal(result.blocked, false);
  assert.equal(result.passed, true);
  assert.equal(result.score, 1000);
});
