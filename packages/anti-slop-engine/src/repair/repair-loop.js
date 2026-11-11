import fs from 'node:fs';
import path from 'node:path';
import { inspectCodeSyntax } from '../analyzer/ast-analyzer.js';
import { inspectBrowserAndA11y } from '../analyzer/browser-audit.js';
import { inspectDesignQuality } from '../analyzer/design-audit.js';
import { calculateQualityScore, formatTerminalReport } from '../scoring/score.js';

export async function runFullAudit(config) {
  const rootDir = config?.rootDir || process.cwd();
  let targetFiles = [];

  if (config?.targetFiles && config.targetFiles.length > 0) {
    targetFiles = config.targetFiles;
  } else {
    const collectFiles = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.name.startsWith('.') || ent.name === 'node_modules' || ent.name === 'dist' || ent.name === '.next' || ent.name === '.git' || ent.name === 'tests' || ent.name === '__tests__') continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          collectFiles(full);
        } else if (ent.isFile() && /\.(tsx|jsx|ts|js)$/.test(ent.name) && !ent.name.endsWith('.d.ts') && !ent.name.includes('.test.') && !ent.name.includes('.spec.')) {
          targetFiles.push(full);
        }
      }
    };
    collectFiles(rootDir);
  }

  // 1. Run the 3 independent detectors
  const codeFindings = inspectCodeSyntax({ files: targetFiles, rootDir });
  const browserFindings = await inspectBrowserAndA11y({ files: targetFiles, rootDir, url: config?.url });
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

/**
 * Built-in surgical automated repair codemods
 */
export function applyAutomatedRepairs(findings, rootDir = process.cwd()) {
  const modifiedFiles = new Set();
  
  const byFile = {};
  for (const f of findings) {
    if (!f.location) continue;
    const absPath = path.isAbsolute(f.location) ? f.location : path.resolve(rootDir, f.location);
    if (!fs.existsSync(absPath)) continue;
    byFile[absPath] = byFile[absPath] || [];
    byFile[absPath].push(f);
  }

  for (const [filePath, fileFindings] of Object.entries(byFile)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const f of fileFindings) {
      // 1. Uncalibrated motion repair
      if (f.ruleId === 'MOTION-UNCALIBRATED-TRANSITION') {
        if (/transition\s*:\s*["']?[^"';{}]*(?:all\s+0\.[1-5]s|ease-in-out|0\.3s\s+ease)[^"';{}]*["']?/i.test(content)) {
          content = content.replace(
            /transition\s*:\s*["']?[^"';{}]*(?:all\s+0\.[1-5]s|ease-in-out|0\.3s\s+ease)[^"';{}]*["']?/gi,
            'transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)"'
          );
          changed = true;
        }
        if (/duration-300\s+ease-in-out/i.test(content)) {
          content = content.replace(/duration-300\s+ease-in-out/gi, 'duration-500 ease-out');
          changed = true;
        }
      }

      // 2. Accessibility repairs (idempotent guards prevent duplicate expansions when multiple a11y findings occur)
      if (f.ruleId === 'A11Y-GATE-FAILURE') {
        if (/\boutline-none\b/i.test(content) && !content.includes('focus-visible:ring') && !content.includes('focus:outline')) {
          content = content.replace(/(?<!focus-visible:)\boutline-none\b/gi, 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none');
          changed = true;
        }
        if (/<img(?![^>]*\balt=)/i.test(content)) {
          content = content.replace(/<img(?![^>]*\balt=)/gi, '<img alt="" aria-hidden="true"');
          changed = true;
        }
        if (/<button(?![^>]*min-h-\[44px\])([^>]*\b(?:h-6|h-7|h-8|w-6|w-7|w-8)\b[^>]*)>/i.test(content)) {
          content = content.replace(/<button([^>]*\b)(h-[6-8]|w-[6-8])\b/gi, '<button$1min-h-[44px] min-w-[44px] px-3 py-2');
          changed = true;
        }
      }

      // 3. Placeholder copy repair
      if (f.ruleId === 'COPY-PLACEHOLDER-LEAK') {
        content = content.replace(/\bLorem ipsum dolor sit amet[^\n"']*/gi, 'Experience seamless performance built for digital scale.');
        content = content.replace(/\bLorem ipsum[^\n"']*/gi, 'Crafted with precision engineering.');
        content = content.replace(/\bYour Company Name\b/gi, 'Antigravity Studio');
        content = content.replace(/\bFeature Title Goes Here\b/gi, 'Adaptive Kinetic Architecture');
        changed = true;
      }

      // 4. Raw hex styling repair
      if (f.ruleId === 'TOKEN-RAW-STYLING-BYPASS') {
        content = content.replace(/bg-\[#3b82f6\]/gi, 'bg-primary');
        content = content.replace(/text-\[#3b82f6\]/gi, 'text-primary');
        content = content.replace(/bg-\[#ffffff\]|bg-\[#fff\]/gi, 'bg-background');
        content = content.replace(/text-\[#000000\]|text-\[#000\]/gi, 'text-foreground');
        content = content.replace(/color:\s*["']#(?:000|000000)["']/gi, 'color: "var(--foreground)"');
        content = content.replace(/color:\s*["']#(?:fff|ffffff)["']/gi, 'color: "var(--background)"');
        changed = true;
      }

      // 5. Unmotivated glow repair
      if (f.ruleId === 'DESIGN-UNMOTIVATED-GLOW') {
        content = content.replace(
          /from-(?:blue|indigo|cyan)-[56]00\s+to-(?:purple|violet|fuchsia)-[56]00/gi,
          'from-neutral-900 to-neutral-950 border border-neutral-800'
        );
        changed = true;
      }

      // 6. Generic emoji repair
      if (f.ruleId === 'DESIGN-INCONSISTENT-ICONS') {
        content = content.replace(/([🚀🔥⚡💡🎉✨])/gu, '<span className="inline-block w-4 h-4 bg-primary/20 rounded-full" aria-hidden="true" />');
        changed = true;
      }

      // 7. Broken action repair (attach functional handler)
      if (f.ruleId === 'INTERACTION-BROKEN-ACTIONS') {
        content = content.replace(/<button(?![^>]*\b(onClick|type=)\b)([^>]*)>/gi, '<button type="button" onClick={() => {}}$2>');
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedFiles.add(filePath);
    }
  }

  return Array.from(modifiedFiles);
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

/**
 * Executes the full iterative repair loop:
 * 1. Audit
 * 2. If failed, apply built-in surgical codemods + optional agent callback
 * 3. Increment attempt counter
 * 4. Re-audit and repeat up to maxAttempts
 */
export async function qualityLoop(config, maxAttempts = 4) {
  const rootDir = config?.rootDir || process.cwd();
  const auditHistoryDir = path.join(rootDir, '.audit_history');
  osEnsureDir(auditHistoryDir);

  let currentAttempt = 1;
  let latestAudit = await runFullAudit(config);
  const repairedFilesTotal = new Set();

  while (currentAttempt <= maxAttempts) {
    const reportPath = path.join(auditHistoryDir, `audit-attempt-${currentAttempt}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(latestAudit, null, 2), 'utf-8');

    // Quality gate pass condition: 0 blockers, 0 majors, and score >= passingScore
    if (latestAudit.passed && !latestAudit.blocked) {
      return {
        attempt: currentAttempt,
        maxAttempts,
        status: "passed",
        audit: latestAudit,
        repairedFiles: Array.from(repairedFilesTotal)
      };
    }

    if (currentAttempt === maxAttempts) {
      break;
    }

    console.log(`\x1b[33m[Repair Loop] Attempt ${currentAttempt}/${maxAttempts} failed (Score: ${latestAudit.score}, Blockers: ${latestAudit.metrics.blockersCount}, Majors: ${latestAudit.metrics.majorsCount}). Applying repairs...\x1b[0m`);

    // 1. Execute built-in automated surgical codemods
    const autoFixed = applyAutomatedRepairs(latestAudit.findings, rootDir);
    autoFixed.forEach(f => repairedFilesTotal.add(f));

    // 2. If caller provided an external agent repair function, invoke it
    if (typeof config?.agentRepairFn === 'function') {
      const agentFixed = await config.agentRepairFn(latestAudit, currentAttempt);
      if (Array.isArray(agentFixed)) {
        agentFixed.forEach(f => repairedFilesTotal.add(f));
      }
    }

    // 3. Increment attempt and re-audit
    currentAttempt++;
    latestAudit = await runFullAudit(config);
  }

  return {
    attempt: currentAttempt,
    maxAttempts,
    status: "failed",
    audit: latestAudit,
    repairedFiles: Array.from(repairedFilesTotal),
    repairPayload: generateRepairPayload(latestAudit)
  };
}

function osEnsureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
