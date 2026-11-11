import { loadPolicy } from './policy.js';

export function calculateQualityScore(findings, totalFilesScanned = 1) {
  const policy = loadPolicy();
  const maxScore = policy.maxScore || 1000;
  const passingScore = policy.passingScore || 800;

  let totalPenalty = 0;
  let blockersCount = 0;
  let majorsCount = 0;
  let minorsCount = 0;
  const failedGateSet = new Set();

  for (const f of findings) {
    totalPenalty += Math.abs(f.penalty);
    if (f.severity === "blocker") {
      blockersCount++;
      failedGateSet.add(f.category);
    } else if (f.severity === "major") {
      majorsCount++;
    } else {
      minorsCount++;
    }
  }

  // A blocker immediately blocks and sets score to 0
  const rawScore = Math.max(0, maxScore - totalPenalty);
  const blocked = blockersCount > 0;
  
  // Strict quality gate: No blocker AND no major design slop allowed to pass without repair
  const maxMajorsAllowed = policy.maxMajorsAllowed ?? 0;
  const passed = !blocked && (majorsCount <= maxMajorsAllowed) && rawScore >= passingScore;

  const allGates = ["build", "interaction", "accessibility", "responsive", "content", "design", "code", "motion"];
  const failedGates = Array.from(failedGateSet);
  const passedGates = allGates.filter(g => !failedGateSet.has(g));

  const metrics = {
    totalFiles: totalFilesScanned,
    blockersCount,
    majorsCount,
    minorsCount,
    passedGates,
    failedGates
  };

  return {
    score: blocked ? 0 : rawScore,
    maxScore,
    passingScore,
    passed,
    blocked,
    findings,
    metrics,
    timestamp: new Date().toISOString()
  };
}

export function formatTerminalReport(result) {
  const lines = [];
  const statusColor = result.passed ? '\x1b[32m' : (result.blocked ? '\x1b[31m' : '\x1b[33m');
  const statusBadge = result.passed ? '✓ PASSED (MASTERPIECE)' : (result.blocked ? '✗ BLOCKED (CRITICAL FAILURE)' : '⚠ NEEDS REPAIR');

  lines.push('\x1b[38;2;217;101;59m╔═══════════════════════════════════════════════════════════════════════╗\x1b[0m');
  lines.push(`\x1b[38;2;217;101;59m║\x1b[0m  \x1b[1mANTI-SLOP QUALITY EVALUATION REPORT\x1b[0m                                 \x1b[38;2;217;101;59m║\x1b[0m`);
  lines.push('\x1b[38;2;217;101;59m╚═══════════════════════════════════════════════════════════════════════╝\x1b[0m');
  lines.push('');
  lines.push(`Status:       ${statusColor}\x1b[1m${statusBadge}\x1b[0m`);
  lines.push(`Final Score:  \x1b[1m${result.score}\x1b[0m / ${result.maxScore} (Passing threshold: ${result.passingScore})`);
  lines.push(`Breakdown:    \x1b[31m${result.metrics.blockersCount} Blockers\x1b[0m | \x1b[33m${result.metrics.majorsCount} Major Slop\x1b[0m | \x1b[36m${result.metrics.minorsCount} Minor Slop\x1b[0m`);
  lines.push(`Scanned:      ${result.metrics.totalFiles} target file(s)`);
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('\x1b[32m✨ Zero design-slop detected! Pure human-crafted artisanal quality.\x1b[0m\n');
    return lines.join('\n');
  }

  lines.push('\x1b[1mFindings & Concrete Evidence:\x1b[0m');
  lines.push('────────────────────────────────────────────────────────────────────────');

  for (let i = 0; i < result.findings.length; i++) {
    const f = result.findings[i];
    const sevColor = f.severity === 'blocker' ? '\x1b[31m[BLOCKER]\x1b[0m' : (f.severity === 'major' ? '\x1b[33m[MAJOR]\x1b[0m' : '\x1b[36m[MINOR]\x1b[0m');
    const penaltyStr = `\x1b[31m${f.penalty} pts\x1b[0m`;

    lines.push(`${i + 1}. ${sevColor} \x1b[1m${f.ruleId}\x1b[0m (${penaltyStr})`);
    if (f.location) {
      lines.push(`   \x1b[90mLocation:\x1b[0m ${f.location}`);
    }
    lines.push(`   \x1b[90mEvidence:\x1b[0m ${f.evidence}`);
    lines.push(`   \x1b[32mRepair:\x1b[0m   ${f.repairInstruction}`);
    lines.push('');
  }

  lines.push('────────────────────────────────────────────────────────────────────────');
  if (result.blocked) {
    lines.push('\x1b[31m⛔ Mandatory quality gates failed. Automated repair loop MUST resolve blockers before deployment.\x1b[0m\n');
  } else if (!result.passed) {
    lines.push('\x1b[33m⚡ Quality score below acceptance threshold. Run repair loop to upgrade code to human-art tier.\x1b[0m\n');
  }

  return lines.join('\n');
}
