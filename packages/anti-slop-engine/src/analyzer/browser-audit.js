import fs from 'node:fs';
import path from 'node:path';
import { createFindingFromRule } from '../scoring/policy.js';

export function inspectBrowserAndA11y(options) {
  const findings = [];
  const { files, rootDir } = options;

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const relPath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Accessibility: Outline None without Focus-Visible
    const outlineNoneRegex = /(?:outline\s*:\s*none|\boutline-none\b)(?![^;{}]*focus-visible)/i;
    if (outlineNoneRegex.test(content) && !content.includes('focus-visible:ring') && !content.includes('focus:outline')) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Found 'outline: none' or 'outline-none' without a designated :focus-visible focus ring indicator. Traps keyboard navigators.",
        relPath,
        "Preserve browser focus rings or provide an explicit focus-visible ring: 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'."
      ));
    }

    // 2. Responsive: Rigid pixel container causing horizontal overflow on mobile
    const fixedLargeWidthRegex = /(?:width\s*:\s*(?:1[0-9]{3}|[6-9][0-9]{2})px|\bw-\[(?:1[0-9]{3}|[6-9][0-9]{2})px\]|\bmin-w-\[(?:1[0-9]{3}|[6-9][0-9]{2})px\])/i;
    if (fixedLargeWidthRegex.test(content) && !content.includes('max-w-full') && !content.includes('overflow-x-auto')) {
      const match = content.match(fixedLargeWidthRegex);
      findings.push(createFindingFromRule(
        "LAYOUT-HORIZONTAL-OVERFLOW",
        `Fixed large container width detected (${match ? match[0] : 'fixed width'}) without max-w-full constraint. Will cause horizontal overflow on mobile viewports (< 768px).`,
        relPath,
        "Use fluid responsive widths: 'w-full max-w-7xl' and wrap in responsive padding rather than fixed pixel dimensions."
      ));
    }

    // 3. Touch target size violation (< 44x44px for touch interactions)
    const smallTapTargetRegex = /<button[^>]*class(?:Name)?=["'][^"']*\b(?:h-6|h-7|h-8|w-6|w-7|w-8|p-0\.5|p-1)\b[^"']*["'][^>]*>/i;
    if (smallTapTargetRegex.test(content) && !content.includes('min-h-[44px]') && !content.includes('min-w-[44px]')) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Interactive button target size appears below 44x44px WCAG touch target guideline.",
        relPath,
        "Ensure all interactive click/tap targets maintain at least 44x44px hit bounds (e.g. min-h-[44px] min-w-[44px] or ample padding)."
      ));
    }

    // 4. Low contrast gray-on-gray hallucination
    const lowContrastGreyRegex = /(?:text-(?:neutral|gray|zinc|slate)-[45]00\s+bg-(?:neutral|gray|zinc|slate)-[89]00|text-#777\b|text-#888\b)/i;
    if (lowContrastGreyRegex.test(content)) {
      findings.push(createFindingFromRule(
        "A11Y-GATE-FAILURE",
        "Suspected low-contrast text pairing (e.g. gray-400 on dark ground, or #777 on white). Fails WCAG AA 4.5:1 ratio.",
        relPath,
        "Use high-contrast semantic tokens: text-foreground or text-muted-foreground verified to satisfy 4.5:1 ratio."
      ));
    }
  }

  return findings;
}
