import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { inspectCodeSyntax } from '../src/analyzer/ast-analyzer.js';
import { inspectBrowserAndA11y } from '../src/analyzer/browser-audit.js';
import { inspectDesignQuality } from '../src/analyzer/design-audit.js';
import { calculateQualityScore } from '../src/scoring/score.js';

const TEMP_DIR = path.resolve(process.cwd(), '.test_astryx_temp');

test.before(() => {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
});

test.after(() => {
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
});

test('Astryx component with StyleX atomic styles passes cleanly without false raw-hex penalties', async () => {
  const astryxComponent = `
    import * as React from 'react';
    import { Button } from '@astryxdesign/core/Button';
    import { VStack } from '@astryxdesign/core/VStack';
    import * as stylex from '@stylexjs/stylex';

    const styles = stylex.create({
      container: {
        padding: 16,
        gap: 8,
      },
      action: {
        minHeight: 44,
        minWidth: 44,
      }
    });

    export function AstryxHero({ onAction }: { onAction: () => void }) {
      return (
        <VStack gap={4} xstyle={styles.container}>
          <Button label="Get Started" onClick={onAction} xstyle={styles.action} />
        </VStack>
      );
    }
  `;
  const filePath = path.join(TEMP_DIR, 'astryx-hero.tsx');
  fs.writeFileSync(filePath, astryxComponent, 'utf-8');

  const codeFindings = inspectCodeSyntax({ files: [filePath], rootDir: TEMP_DIR });
  const browserFindings = await inspectBrowserAndA11y({ files: [filePath], rootDir: TEMP_DIR });
  const designFindings = inspectDesignQuality({ files: [filePath], rootDir: TEMP_DIR });

  const allFindings = [...codeFindings, ...browserFindings, ...designFindings];
  const result = calculateQualityScore(allFindings);

  assert.equal(result.blocked, false, 'Astryx component should not be blocked');
  assert.equal(result.passed, true, 'Astryx component should pass with high score');
  assert.equal(result.score, 1000, 'Score should be 1000 without false positives');
});
