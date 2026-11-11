import fs from 'node:fs';
import path from 'node:path';
import { inspectCodeSyntax } from '../analyzer/ast-analyzer.js';
import { inspectBrowserAndA11y } from '../analyzer/browser-audit.js';
import { inspectDesignQuality } from '../analyzer/design-audit.js';
import { calculateQualityScore, formatTerminalReport } from '../scoring/score.js';

export function runFullAudit(config) {
  const rootDir = config?.rootDir || process.cwd();
  let targetFiles = [];

  if (config?.targetFiles && config.targetFiles.length > 0) {
    targetFiles = config.targetFiles;
  } else {
    const collectFiles = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.next') continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          collectFiles(full);
        } else if (ent.isFile() && /\.(tsx|jsx|ts|js)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) {
          targetFiles.push(full);
        }
      }
    };
    collectFiles(rootDir);
  }

  // 1. Run the 3 independent detectors
  const codeFindings = inspectCodeSyntax({ files: targetFiles, rootDir });
  const browserFindings = inspectBrowserAndA11y({ files: targetFiles, rootDir });
  const designFindings = inspectDesignQuality({ files: targetFiles, rootDir });

  // 2. Aggregate all findings
  const allFindings = [
    ...codeFindings,
    ...browserFindings,
    ...designFindings
  ];

  // 3. Compute score and enforce quality gates
  return calculateQualityScore(allFindings, targetFiles.length);
}

export function generateRepairPayload(audit) {
  const systemPrompt = `You are the Framer Craft Automated Repair Subroutine.
Your sole mission is to eliminate identified design-slop, resolve accessibility blockers, and replace uncalibrated motion with Framer Motion spring physics or Astryx design tokens.
Preserve existing application logic, real content, and working functionality. DO NOT introduce new placeholder text.`;

  const findingBlocks = audit.findings.map((f, i) => {
    return `Finding #${i + 1}: [${f.severity.toUpperCase()}] ${f.ruleId} (${f.penalty} pts)
- Location: ${f.location || 'Component file'}
- Evidence: ${f.evidence}
- Required Repair: ${f.repairInstruction}
`;
  }).join('\n');

  const userPrompt = `The Anti-Slop Quality Engine detected ${audit.findings.length} violation(s) resulting in an unacceptable score (${audit.score} / ${audit.maxScore}).
Mandatory Blockers: ${audit.metrics.blockersCount} | Major Slop: ${audit.metrics.majorsCount} | Minor: ${audit.metrics.minorsCount}

DETAILED VIOLATIONS:
${findingBlocks}

ACTION REQUIRED:
1. Surgically edit the affected files to resolve every single finding above.
2. Ensure all text contrast meets WCAG AA 4.5:1.
3. Replace linear ease transitions with calibrated Framer Motion spring physics from craft_dna.json.
4. Replace raw hex colors with semantic tokens (Tailwind or Astryx/StyleX).
5. Provide clean, verified code that passes the next quality audit.`;

  return { systemPrompt, userPrompt };
}

export async function qualityLoop(config, maxAttempts = 4) {
  const rootDir = config?.rootDir || process.cwd();
  const auditHistoryDir = path.join(rootDir, '.audit_history');
  osEnsureDir(auditHistoryDir);

  let currentAttempt = 1;
  let latestAudit = runFullAudit(config);

  while (currentAttempt <= maxAttempts) {
    const reportPath = path.join(auditHistoryDir, `audit-attempt-${currentAttempt}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(latestAudit, null, 2), 'utf-8');

    if (latestAudit.passed && !latestAudit.blocked) {
      return {
        attempt: currentAttempt,
        maxAttempts,
        status: "passed",
        audit: latestAudit
      };
    }

    if (currentAttempt === maxAttempts) {
      break;
    }

    const repairPayload = generateRepairPayload(latestAudit);

    console.log(`\x1b[33m[Repair Loop] Attempt ${currentAttempt}/${maxAttempts} failed with score ${latestAudit.score}. Repair payload generated.\x1b[0m`);
    
    return {
      attempt: currentAttempt,
      maxAttempts,
      status: latestAudit.blocked ? "blocked" : "needs_repair",
      audit: latestAudit,
      repairPayload
    };
  }

  return {
    attempt: currentAttempt,
    maxAttempts,
    status: "failed",
    audit: latestAudit
  };
}

function osEnsureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
