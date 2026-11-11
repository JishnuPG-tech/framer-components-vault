#!/usr/bin/env node

import path from 'node:path';
import { runFullAudit, qualityLoop, formatTerminalReport } from '../src/index.js';

const [,, cmd = 'audit', targetDir = process.cwd()] = process.argv;
const resolvedDir = path.resolve(process.cwd(), targetDir);

async function main() {
  if (cmd === 'audit') {
    const audit = runFullAudit({ rootDir: resolvedDir });
    console.log(formatTerminalReport(audit));
    process.exit(audit.passed && !audit.blocked ? 0 : 1);
  } else if (cmd === 'verify') {
    const audit = runFullAudit({ rootDir: resolvedDir });
    if (audit.blocked || !audit.passed) {
      console.error(`\x1b[31m[VERIFY FAILED] Score: ${audit.score}/${audit.maxScore}. Blockers: ${audit.metrics.blockersCount}\x1b[0m`);
      for (const f of audit.findings) {
        if (f.severity === 'blocker') {
          console.error(`  - \x1b[31m${f.ruleId}\x1b[0m: ${f.evidence}`);
        }
      }
      process.exit(1);
    }
    console.log(`\x1b[32m[VERIFY PASSED] Human-Art Masterpiece Certified. Score: ${audit.score}/${audit.maxScore}\x1b[0m`);
    process.exit(0);
  } else if (cmd === 'repair') {
    const report = await qualityLoop({ rootDir: resolvedDir });
    console.log(formatTerminalReport(report.audit));
    if (report.repairPayload) {
      console.log('\n\x1b[36m=== PROPOSED REPAIR DIRECTIVE FOR AGENT ===\x1b[0m');
      console.log(report.repairPayload.userPrompt);
    }
    process.exit(report.status === 'passed' ? 0 : 1);
  } else {
    console.log('Usage: anti-slop [audit|verify|repair] [path]');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal engine error:', err);
  process.exit(1);
});
