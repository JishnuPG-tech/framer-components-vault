import fs from 'node:fs';
import path from 'node:path';
import { createFindingFromRule } from '../scoring/policy.js';

export function inspectDesignQuality(options) {
  const findings = [];
  const { files, rootDir } = options;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Detect unmotivated blue-purple AI gradient glow (R-01)
    const aiGlowPatterns = [
      /from-(?:blue|indigo|cyan)-[56]00\s+to-(?:purple|violet|fuchsia)-[56]00/i,
      /radial-gradient\([^)]*(?:rgba\(\s*1(?:20|40|60)[^)]*purple|#7c3aed|#8b5cf6|#6366f1)[^)]*\)/i,
      /bg-gradient-to-(?:r|br|b)\s+from-purple/i
    ];

    for (const pat of aiGlowPatterns) {
      if (pat.test(content)) {
        findings.push(createFindingFromRule(
          "DESIGN-UNMOTIVATED-GLOW",
          "Generic blue-to-purple/cyan AI default gradient glow detected. High-probability AI-slop signature.",
          relPath,
          "Remove generic purple/cyan radial gradient orbs. Replace with grounded brand palette tokens or dark obsidian glass from craft_dna.json or Astryx themes (e.g. chocolate, gothic, matcha, neutral)."
        ));
        break;
      }
    }

    // 2. Detect identical card repetition (R-14)
    const repeatedCardRegex = /(?:<div[^>]*className=["'][^"']*(?:rounded-xl|rounded-2xl)[^"']*(?:border|bg-card)[^"']*["'][^>]*>[\s\S]*?<\/div>)/gi;
    const matches = content.match(repeatedCardRegex) || [];
    if (matches.length >= 3 && !content.includes('asymmetrical') && !content.includes('col-span-2')) {
      findings.push(createFindingFromRule(
        "DESIGN-IDENTICAL-CARD-REPETITION",
        `Detected ${matches.length} uniform card structures in a repetitive cookie-cutter pattern without visual hierarchy.`,
        relPath,
        "Introduce visual rhythm: make the flagship feature full-width or asymmetrical, and vary card densities based on content weight."
      ));
    }

    // 3. Detect excessive glassmorphism (R-10)
    const glassRegex = /(?:backdrop-blur-(?:md|lg|xl|2xl|sm)|backdrop-filter:\s*blur)/gi;
    const glassMatches = content.match(glassRegex) || [];
    if (glassMatches.length >= 4) {
      findings.push(createFindingFromRule(
        "DESIGN-EXCESSIVE-GLASSMORPHISM",
        `Component applies ${glassMatches.length} backdrop-blur surfaces simultaneously. Overuse flattens surface depth.`,
        relPath,
        "Dose-cap glassmorphism to at most 1-2 focal elements (e.g. floating navigation or active modal). Surrounding surfaces should remain matte."
      ));
    }

    // 4. Detect uniform pill radiuses (R-11)
    const pillRegex = /\brounded-full\b/g;
    const pillMatches = content.match(pillRegex) || [];
    if (pillMatches.length >= 5) {
      findings.push(createFindingFromRule(
        "DESIGN-GENERIC-TEMPLATE",
        `Excessive pill radius (rounded-full used ${pillMatches.length} times). Uniform pill shapes erase component hierarchy.`,
        relPath,
        "Differentiate radius by component role: pill shapes for micro-badges or primary CTAs only; use structured radii (e.g. rounded-xl) for cards and inputs."
      ));
    }

    // 5. Detect generic emojis as UI icons
    const emojiRegex = /<(?:span|div|p)[^>]*>[\s]*([🚀🔥⚡💡🎉✨])[\s]*<\/(?:span|div|p)>/u;
    const emojiMatch = content.match(emojiRegex);
    if (emojiMatch) {
      findings.push(createFindingFromRule(
        "DESIGN-INCONSISTENT-ICONS",
        `Generic emoji icon "${emojiMatch[1]}" used directly in UI markup.`,
        relPath,
        "Replace emojis with cohesive SVG icons from Iconsax (24x24 single-style) to preserve visual polish and high-DPI crispness."
      ));
    }
  }

  return findings;
}
