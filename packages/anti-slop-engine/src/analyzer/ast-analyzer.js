import fs from 'node:fs';
import path from 'node:path';
import { createFindingFromRule } from '../scoring/policy.js';

export function inspectCodeSyntax(options) {
  const findings = [];
  const { files, rootDir } = options;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if this component uses Astryx / StyleX design system
    const isAstryxProject = content.includes('@astryxdesign/core') || content.includes('@stylexjs/stylex');

    // 1. Detect uncalibrated motion: transition: all 0.3s ease / linear
    const linearTransitionRegex = /transition\s*:\s*([^;{}]*(?:all\s+0\.[1-5]s|ease-in-out|0\.3s\s+ease)[^;{}]*)/i;
    const tailwindLinearRegex = /duration-300\s+ease-in-out/i;

    if (linearTransitionRegex.test(content) || tailwindLinearRegex.test(content)) {
      const match = content.match(linearTransitionRegex) || content.match(tailwindLinearRegex);
      findings.push(createFindingFromRule(
        "MOTION-UNCALIBRATED-TRANSITION",
        `Uncalibrated linear transition detected: "${match ? match[0].trim() : 'linear transition'}". Lacks calibrated spring physics.`,
        relPath,
        "Replace linear ease with Framer Motion spring preset: { type: 'spring', stiffness: 320, damping: 28, mass: 0.8 } from craft_dna.json."
      ));
    }

    // 2. Detect placeholder copy leaks
    const placeholderPatterns = [
      /\bLorem ipsum\b/i,
      /\bYour Company Name\b/i,
      /\bFeature Title Goes Here\b/i,
      /\bInsert description here\b/i,
      /\bPlaceholder text\b/i,
      /\bJohn Doe\b/i
    ];

    for (const pat of placeholderPatterns) {
      const match = content.match(pat);
      if (match) {
        findings.push(createFindingFromRule(
          "COPY-PLACEHOLDER-LEAK",
          `Unreplaced placeholder copy leak: "${match[0]}"`,
          relPath,
          "Replace generic placeholder text with authentic, domain-specific terminology matching the product brief."
        ));
        break;
      }
    }

    // 3. Detect raw hex styling bypassing design tokens
    // Skip if using stylex.create or Astryx theme tokens
    if (!isAstryxProject) {
      const rawHexInlineRegex = /(?:color|background|borderColor|fill|stroke)\s*:\s*["']#(?:[0-9a-fA-F]{3,8})["']/g;
      const rawTailwindHexRegex = /(?:bg|text|border)-\[#(?:[0-9a-fA-F]{3,8})\]/g;
      const hexMatches = [
        ...(content.match(rawHexInlineRegex) || []),
        ...(content.match(rawTailwindHexRegex) || [])
      ];

      if (hexMatches.length >= 3) {
        findings.push(createFindingFromRule(
          "TOKEN-RAW-STYLING-BYPASS",
          `Component has ${hexMatches.length} raw hex styling overrides (e.g. ${hexMatches.slice(0, 3).join(', ')}), bypassing semantic theme tokens.`,
          relPath,
          "Refactor raw hex colors to semantic theme variables (e.g. bg-background, text-foreground, border-border, bg-primary) or Astryx/StyleX theme tokens."
        ));
      }
    }

    // 4. Detect unresolved relative local imports
    const importRegex = /(?:import\s+(?:.*?\s+from\s+)?|require\()\s*['"](\.[^'"]+)['"]/g;
    let impMatch;
    while ((impMatch = importRegex.exec(content)) !== null) {
      const relativeImport = impMatch[1];
      const dir = path.dirname(filePath);
      const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
      const resolved = possibleExtensions.some(ext => fs.existsSync(path.resolve(dir, relativeImport + ext)));

      if (!resolved) {
        findings.push(createFindingFromRule(
          "BUILD-UNRESOLVED-IMPORTS",
          `Unresolved local import: "${relativeImport}" cannot be found on disk.`,
          relPath,
          `Create the missing file at "${path.join(dir, relativeImport)}" or adjust the import path to an existing module.`
        ));
      }
    }

    // 5. Detect dead interactive buttons (missing onClick, href, or action)
    // Note: Astryx <Button label="..." onClick={...} /> or standard <button>
    const deadButtonRegex = /<button(?![^>]*\b(onClick|type="submit"|type="reset"|disabled|aria-disabled)\b)[^>]*>(.*?)<\/button>/gi;
    let btnMatch;
    let deadButtonCount = 0;
    while ((btnMatch = deadButtonRegex.exec(content)) !== null) {
      deadButtonCount++;
    }
    if (deadButtonCount >= 2) {
      findings.push(createFindingFromRule(
        "INTERACTION-BROKEN-ACTIONS",
        `Found ${deadButtonCount} button element(s) with no onClick handler, form submit type, or disabled state.`,
        relPath,
        "Attach functional interactive callbacks or replace with a non-interactive semantic tag if purely decorative."
      ));
    }

    // 6. Detect missing accessible images
    const imgMissingAltRegex = /<(?:img|Image)(?![^>]*\balt=)[^>]*>/gi;
    if (imgMissingAltRegex.test(content)) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Image element missing required alt attribute for accessibility.",
        relPath,
        "Add a descriptive alt attribute, or alt='' with aria-hidden='true' if decorative."
      ));
    }
  }

  return findings;
}
