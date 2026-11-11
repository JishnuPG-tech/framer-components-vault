import fs from 'node:fs';
import path from 'node:path';

let cachedPolicy = null;

export function loadPolicy(customPolicyPath) {
  if (cachedPolicy && !customPolicyPath) return cachedPolicy;

  const searchPaths = [
    customPolicyPath,
    path.resolve(process.cwd(), 'policies/anti-slop.json'),
    path.resolve(process.cwd(), '../policies/anti-slop.json'),
    path.resolve(process.cwd(), '../../policies/anti-slop.json')
  ].filter(Boolean);

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedPolicy = JSON.parse(raw);
        return cachedPolicy;
      } catch (e) {
        console.warn(`[anti-slop-policy] Failed to parse ${p}:`, e);
      }
    }
  }

  // Fallback defaults if file missing
  cachedPolicy = {
    version: "1.0.0",
    name: "Default Anti-Slop Policy",
    passingScore: 800,
    maxScore: 1000,
    rules: [
      {
        id: "BUILD-UNRESOLVED-IMPORTS",
        name: "Application build and unresolved imports",
        severity: "blocker",
        penalty: -1000,
        category: "build",
        enforcement: "block",
        description: "Component fails to compile, missing dependencies",
        repairInstruction: "Verify all import statements and package dependencies."
      },
      {
        id: "INTERACTION-BROKEN-ACTIONS",
        name: "Broken required interactions",
        severity: "blocker",
        penalty: -1000,
        category: "interaction",
        enforcement: "block",
        description: "Interactive controls lack handlers or hrefs",
        repairInstruction: "Provide functional event handlers or accessible roles."
      },
      {
        id: "A11Y-GATE-FAILURE",
        name: "Required accessibility gate fails",
        severity: "blocker",
        penalty: -1000,
        category: "accessibility",
        enforcement: "block",
        description: "Contrast failure or missing keyboard focus outline",
        repairInstruction: "Ensure contrast >= 4.5:1 and outline:none has focus-visible ring."
      },
      {
        id: "LAYOUT-HORIZONTAL-OVERFLOW",
        name: "Horizontal overflow at supported viewports",
        severity: "blocker",
        penalty: -500,
        category: "responsive",
        enforcement: "block",
        description: "Causes horizontal scroll on mobile/tablet viewports",
        repairInstruction: "Constrain widths with max-w-full and overflow-x-hidden."
      },
      {
        id: "COPY-PLACEHOLDER-LEAK",
        name: "Placeholder copy in finished product",
        severity: "major",
        penalty: -200,
        category: "content",
        enforcement: "repair",
        description: "Detects dummy strings such as Lorem ipsum or Feature title",
        repairInstruction: "Replace generic placeholder copy with realistic product context."
      },
      {
        id: "DESIGN-UNMOTIVATED-GLOW",
        name: "Unmotivated default gradient or glow",
        severity: "major",
        penalty: -100,
        category: "design",
        enforcement: "repair",
        description: "Generic purple/cyan radial gradient orbs",
        repairInstruction: "Remove unmotivated gradient glow; use brand colors from craft_dna.json."
      },
      {
        id: "DESIGN-IDENTICAL-CARD-REPETITION",
        name: "Identical cards repeated with no variation",
        severity: "major",
        penalty: -100,
        category: "design",
        enforcement: "repair",
        description: "Three identical feature cards with identical visual weight",
        repairInstruction: "Vary composition: expand flagship card and compress secondary items."
      },
      {
        id: "TOKEN-RAW-STYLING-BYPASS",
        name: "Raw styling bypasses design tokens",
        severity: "minor",
        penalty: -70,
        category: "code",
        enforcement: "repair",
        description: "Direct inline hex colors bypassing design tokens",
        repairInstruction: "Refactor raw colors to semantic tokens (bg-background, text-foreground)."
      },
      {
        id: "MOTION-UNCALIBRATED-TRANSITION",
        name: "Uncalibrated linear transition timing",
        severity: "minor",
        penalty: -70,
        category: "motion",
        enforcement: "repair",
        description: "transition: all 0.3s ease instead of calibrated springs",
        repairInstruction: "Replace linear easing with calibrated Framer Motion spring presets."
      }
    ]
  };

  return cachedPolicy;
}

export function createFindingFromRule(ruleId, evidence, location, customInstruction) {
  const policy = loadPolicy();
  const rule = policy.rules.find(r => r.id === ruleId);
  if (!rule) {
    return {
      ruleId,
      name: ruleId,
      severity: "minor",
      penalty: -50,
      category: "design",
      evidence,
      location,
      repairInstruction: customInstruction || "Review and repair according to craft standards."
    };
  }

  return {
    ruleId: rule.id,
    name: rule.name,
    severity: rule.severity,
    penalty: rule.penalty,
    category: rule.category,
    evidence,
    location,
    repairInstruction: customInstruction || rule.repairInstruction
  };
}
