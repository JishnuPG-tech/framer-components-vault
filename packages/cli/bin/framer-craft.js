#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runFullAudit, qualityLoop, formatTerminalReport } from '../../anti-slop-engine/src/index.js';

const API_BASE = 'https://jishnupg-opencode-cli.hf.space/preview/3000/api';
const GITHUB_RAW = 'https://raw.githubusercontent.com/JishnuPG-tech/framer-components-vault/main';

const SHIM_CONTENT = `// Universal Framer Runtime Shim for Next.js / Vite React
import * as React from "react";
export { motion, animate, useMotionValue, useSpring, useTransform, useReducedMotion, useAnimation, AnimatePresence, LayoutGroup } from "framer-motion";

export const addFonts = () => {};
export const addPropertyControls = () => {};
export const ComponentViewportProvider = ({ children }: { children: React.ReactNode }) => children;
export const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link',
    Padding: 'padding', BorderRadius: 'borderRadius', Gap: 'gap', Border: 'border',
    SegmentedControl: 'segmentedControl'
};
export const cx = (...args: any[]) => args.filter(Boolean).join(" ");
export const getFonts = () => [];
export const getFontsFromSharedStyle = () => [];
export const getPropertyControls = () => ({});
export const Link = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(({ href, children, ...props }, ref) => 
    React.createElement("a", { ref, href: href || "#", ...props }, children)
);
export const Image = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement> & { src?: any }>(({ src, alt, style, className, ...props }, ref) => {
    let imageSrc = src;
    let srcSet: string | undefined = undefined;
    if (src && typeof src === "object") {
        imageSrc = src.src || src.url || src.srcSet || "";
        srcSet = src.srcSet;
    }
    return React.createElement("img", {
        ref,
        src: imageSrc,
        srcSet,
        alt: alt || "",
        className,
        style: { maxWidth: "100%", height: "auto", display: "block", ...style },
        ...props
    });
});
export const RichText = ({ text, children, style, ...props }: any) => React.createElement("div", { style: { ...style }, ...props }, children || text);
export const SmartComponentScopedContainer = ({ children, ...props }: any) => React.createElement("div", props, children);
export const useComponentViewport = () => ({ width: 1200, height: 800 });
export const useLocaleInfo = () => ({ locale: "en-US" });
export const useLocaleCode = () => "en-US";
export const useActiveVariantCallback = (baseVariant: any, callback: any) => ({ activeVariantCallback: callback || (() => {}) });
export const useVariantState = ({ defaultVariant = "default", variant }: any = {}) => {
    const active = variant || defaultVariant;
    const [currentVariant, setVariant] = React.useState(active);
    return { baseVariant: active, currentVariant, setVariant, clearFinishedVariantCallback: () => {}, classNames: "", variants: [currentVariant] };
};
export const withCSS = (Component: any) => Component;
export const withFX = (Component: any) => Component;
`;

const RULES_CONTENT = `# Artisanal Human-Art UI/UX & Framer Craft Directives

## Source of Truth
- Component Vault: https://github.com/JishnuPG-tech/framer-components-vault
- Intelligence API: https://jishnupg-opencode-cli.hf.space/preview/3000/api

## Rules for Frontend Code
1. Never generate generic AI-slop (flat 0.3s ease transitions, plain 3-column cards, purple gradients).
2. All animations must use Framer Motion springs:
   - Snappy (buttons): { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }
   - Fluid (accordions, cards): { type: "spring", stiffness: 260, damping: 34, mass: 1.0 }
   - Editorial (hero, image reveals): { type: "spring", stiffness: 140, damping: 22, mass: 1.2 }
3. Large headlines (>32px) must use negative tracking (-0.04em to -0.055em) and tight line-height (1.05em to 1.12em).
4. Micro-labels must be uppercase monospace (11px, letter-spacing: 0.12em).
5. Surfaces: Liquid frosted glass (backdrop-blur, 1px rgba(255,255,255,0.08) border, inset 0 1px 1px highlight).
6. Before writing components from scratch, query the Vault API (\`GET /api/search?q=...\`) to adapt human-crafted primitives.
`;

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
}

async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.text();
}

async function cmdInit() {
    console.log('\x1b[38;2;217;101;59m=== Initializing Framer Craft Environment ===\x1b[0m\n');

    // 1. Create framer runtime shim
    const isSrc = fs.existsSync(path.join(process.cwd(), 'src'));
    const targetDir = isSrc 
        ? path.join(process.cwd(), 'src', 'components', 'framer')
        : path.join(process.cwd(), 'components', 'framer');

    fs.mkdirSync(targetDir, { recursive: true });
    const shimPath = path.join(targetDir, 'framer-shim.tsx');

    if (!fs.existsSync(shimPath)) {
        fs.writeFileSync(shimPath, SHIM_CONTENT, 'utf-8');
        console.log(`\x1b[32m✔\x1b[0m Created Framer Runtime Shim at: \x1b[1m${path.relative(process.cwd(), shimPath)}\x1b[0m`);
    } else {
        console.log(`\x1b[33mℹ\x1b[0m Framer Runtime Shim already exists, skipping.`);
    }

    // 2. Write .cursorrules for AI Pair Programming
    const rulesPath = path.join(process.cwd(), '.cursorrules');
    if (!fs.existsSync(rulesPath)) {
        fs.writeFileSync(rulesPath, RULES_CONTENT, 'utf-8');
        console.log(`\x1b[32m✔\x1b[0m Created Artisanal AI Directives at: \x1b[1m.cursorrules\x1b[0m`);
    } else {
        console.log(`\x1b[33mℹ\x1b[0m .cursorrules already exists, skipping.`);
    }

    // 3. Check dependencies
    const pkgPath = path.join(process.cwd(), 'package.json');
    let hasMotion = false;
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            hasMotion = Boolean((pkg.dependencies && pkg.dependencies['framer-motion']) || (pkg.devDependencies && pkg.devDependencies['framer-motion']));
        } catch (_) {}
    }

    if (!hasMotion) {
        console.log('\n\x1b[33m⚠ Warning:\x1b[0m framer-motion is not installed yet.');
        console.log('  Run: \x1b[32mnpm install framer-motion\x1b[0m (or pnpm add framer-motion)\n');
    }

    console.log('\x1b[38;2;217;101;59m✔ Project ready for artisanal Framer components & Anti-Slop evaluation!\x1b[0m');
    console.log('Try: \x1b[36mnpx framer-craft add fold-rows\x1b[0m or \x1b[36mnpx framer-craft audit\x1b[0m\n');
}

async function cmdAdd(slug) {
    if (!slug) {
        console.error('\x1b[31mError:\x1b[0m Please specify a component slug. Example: \x1b[36mnpx framer-craft add fold-rows\x1b[0m');
        process.exit(1);
    }

    console.log(`\x1b[38;2;217;101;59mFetching component:\x1b[0m \x1b[1m${slug}\x1b[0m...`);

    let code = '';
    try {
        code = await fetchText(`${API_BASE}/components/${slug}/code?raw=true`);
    } catch (e) {
        console.log('\x1b[33mFalling back to GitHub repository...\x1b[0m');
        try {
            const searchData = await fetchJSON(`${API_BASE}/search?q=${slug}&limit=1`);
            const cat = searchData.results[0]?.category || 'accordions';
            code = await fetchText(`${GITHUB_RAW}/components/${cat}/${slug}.tsx`);
        } catch (e2) {
            console.error(`\x1b[31mError:\x1b[0m Component '${slug}' could not be found.`);
            process.exit(1);
        }
    }

    if (!code || code.includes('"detail":"Component not found"')) {
        console.error(`\x1b[31mError:\x1b[0m Component '${slug}' not found in vault.`);
        process.exit(1);
    }

    const isSrc = fs.existsSync(path.join(process.cwd(), 'src'));
    const compDir = isSrc 
        ? path.join(process.cwd(), 'src', 'components', 'framer')
        : path.join(process.cwd(), 'components', 'framer');

    fs.mkdirSync(compDir, { recursive: true });

    const shimPath = path.join(compDir, 'framer-shim.tsx');
    if (!fs.existsSync(shimPath)) {
        fs.writeFileSync(shimPath, SHIM_CONTENT, 'utf-8');
    }

    let cleanedCode = code.replace(/from\s+["']framer["']/g, 'from "./framer-shim"');
    if (!cleanedCode.startsWith('"use client"') && !cleanedCode.startsWith("'use client'")) {
        cleanedCode = `"use client";\n\n${cleanedCode}`;
    }

    const compFile = path.join(compDir, `${slug}.tsx`);
    fs.writeFileSync(compFile, cleanedCode, 'utf-8');

    console.log(`\x1b[32m✔\x1b[0m Component installed successfully!`);
    console.log(`  File: \x1b[1m${path.relative(process.cwd(), compFile)}\x1b[0m`);
    console.log(`  Usage: \x1b[36mimport ${toPascalCase(slug)} from "@/components/framer/${slug}";\x1b[0m\n`);
}

async function cmdSearch(query) {
    if (!query) {
        console.error('\x1b[31mError:\x1b[0m Please specify a search query. Example: \x1b[36mnpx framer-craft search accordion\x1b[0m');
        process.exit(1);
    }

    console.log(`\x1b[38;2;217;101;59mSearching vault for:\x1b[0m "${query}"...\n`);
    try {
        const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=15`);
        if (!data.results || data.results.length === 0) {
            console.log(`No components matched "${query}". Try searching "hero", "card", "slider", or "button".`);
            return;
        }

        console.log(`Found \x1b[1m${data.matches_count}\x1b[0m components:\n`);
        for (const item of data.results) {
            const features = (item.features || []).slice(0, 3).join(', ');
            console.log(`  \x1b[36m${item.slug.padEnd(28)}\x1b[0m \x1b[33m[${item.category}]\x1b[0m \x1b[90m${features}\x1b[0m`);
        }
        console.log(`\nTo install any component: \x1b[32mnpx framer-craft add <slug>\x1b[0m\n`);
    } catch (e) {
        console.error(`\x1b[31mSearch failed:\x1b[0m ${e.message}`);
    }
}

async function cmdList() {
    console.log('\x1b[38;2;217;101;59m=== Framer Craft Vault Categories ===\x1b[0m\n');
    try {
        const data = await fetchJSON(`${API_BASE}/categories`);
        for (const cat of data.categories) {
            console.log(`  \x1b[1m${cat.category.padEnd(16)}\x1b[0m \x1b[32m${cat.count} components\x1b[0m (samples: ${cat.sample_slugs.slice(0, 3).join(', ')})`);
        }
        console.log(`\n\x1b[33mTotal: ${data.total_categories} categories across 1,680+ components.\x1b[0m\n`);
    } catch (e) {
        console.error(`\x1b[31mFailed to fetch categories:\x1b[0m ${e.message}`);
    }
}

async function cmdDNA() {
    console.log('\x1b[38;2;217;101;59m=== Codified Human-Art Craft DNA ===\x1b[0m\n');
    try {
        const data = await fetchJSON(`${API_BASE}/dna`);
        console.log(`\x1b[1mSpring Physics Presets:\x1b[0m`);
        for (const [key, val] of Object.entries(data.spring_presets)) {
            console.log(`  \x1b[36m${key.padEnd(12)}\x1b[0m stiffness: ${val.stiffness}, damping: ${val.damping}, mass: ${val.mass} \x1b[90m(${val.desc})\x1b[0m`);
        }
        console.log(`\n\x1b[1mTypography Rules:\x1b[0m`);
        console.log(`  Display Tracking: ${data.typography_rules.display_tracking}`);
        console.log(`  Line Height:      ${data.typography_rules.display_line_height}`);
        console.log(`  Micro-Labels:     ${data.typography_rules.label_metadata}\n`);
    } catch (e) {
        console.error(`\x1b[31mFailed to fetch DNA:\x1b[0m ${e.message}`);
    }
}

async function cmdAudit(targetDir = process.cwd()) {
    const resolvedDir = path.resolve(process.cwd(), targetDir);
    const audit = await runFullAudit({ rootDir: resolvedDir });
    console.log(formatTerminalReport(audit));
    process.exit(audit.passed && !audit.blocked ? 0 : 1);
}

async function cmdVerify(targetDir = process.cwd()) {
    const resolvedDir = path.resolve(process.cwd(), targetDir);
    const audit = await runFullAudit({ rootDir: resolvedDir });
    if (audit.blocked || !audit.passed) {
        console.error(`\x1b[31m[VERIFY FAILED] Score: ${audit.score}/${audit.maxScore}. Blockers: ${audit.metrics.blockersCount}, Major Slop: ${audit.metrics.majorsCount}\x1b[0m`);
        for (const f of audit.findings) {
            console.error(`  - \x1b[31m${f.ruleId}\x1b[0m: ${f.evidence} (${f.location || 'root'})`);
        }
        process.exit(1);
    }
    console.log(`\x1b[32m[VERIFY PASSED] Human-Art Masterpiece Certified. Score: ${audit.score}/${audit.maxScore}\x1b[0m`);
    process.exit(0);
}

async function cmdRepair(targetDir = process.cwd()) {
    const resolvedDir = path.resolve(process.cwd(), targetDir);
    console.log(`\x1b[38;2;217;101;59mStarting Autonomous Anti-Slop Repair Loop on:\x1b[0m ${resolvedDir}\n`);
    const report = await qualityLoop({ rootDir: resolvedDir });
    console.log(formatTerminalReport(report.audit));
    if (report.repairedFiles && report.repairedFiles.length > 0) {
        console.log(`\x1b[32m✔ Successfully repaired ${report.repairedFiles.length} file(s) across ${report.attempt} attempt(s):\x1b[0m`);
        report.repairedFiles.forEach(f => console.log(`  - \x1b[36m${path.relative(process.cwd(), f)}\x1b[0m`));
    }
    if (report.repairPayload && report.status !== 'passed') {
        console.log('\n\x1b[36m=== PROPOSED REMAINING REPAIR DIRECTIVE FOR AGENT ===\x1b[0m');
        console.log(report.repairPayload.userPrompt);
    }
    process.exit(report.status === 'passed' ? 0 : 1);
}

async function cmdTheme(subcmd = 'list', themeName) {
    console.log('\x1b[38;2;217;101;59m=== Astryx & Framer Theming System ===\x1b[0m\n');
    const child = spawnSync('npx', ['@astryxdesign/cli', 'theme', subcmd, ...(themeName ? [themeName] : [])], {
        stdio: 'inherit',
        shell: true
    });
    process.exit(child.status ?? 0);
}

function toPascalCase(str) {
    return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Main Router
const [,, cmd, ...args] = process.argv;

switch (cmd) {
    case 'init':
        await cmdInit();
        break;
    case 'add':
        await cmdAdd(args[0]);
        break;
    case 'search':
        await cmdSearch(args.join(' '));
        break;
    case 'list':
        await cmdList();
        break;
    case 'dna':
        await cmdDNA();
        break;
    case 'audit':
        await cmdAudit(args[0]);
        break;
    case 'verify':
        await cmdVerify(args[0]);
        break;
    case 'repair':
        await cmdRepair(args[0]);
        break;
    case 'theme':
        await cmdTheme(args[0], args[1]);
        break;
    default:
        console.log(`
\x1b[38;2;217;101;59m╭───────────────────────────────────────────────────╮
│  ⚡ framer-craft: Artisanal Human-Art Engine & CLI │
╰───────────────────────────────────────────────────╯\x1b[0m

Usage:
  \x1b[36mnpx framer-craft init\x1b[0m           Initialize project with shims, rules & themes
  \x1b[36mnpx framer-craft add <slug>\x1b[0m     Install a component by slug (e.g. fold-rows)
  \x1b[36mnpx framer-craft search <term>\x1b[0m  Search 1,680+ components by name or trait
  \x1b[36mnpx framer-craft list\x1b[0m           List all categories and counts
  \x1b[36mnpx framer-craft dna\x1b[0m            Print spring presets and typography rules
  \x1b[36mnpx framer-craft audit [dir]\x1b[0m    Evaluate project for AI-slop, a11y & penalties
  \x1b[36mnpx framer-craft verify [dir]\x1b[0m   Run mandatory CI quality gates (exit 0/1)
  \x1b[36mnpx framer-craft repair [dir]\x1b[0m   Generate actionable repair payload for agent
  \x1b[36mnpx framer-craft theme [sub]\x1b[0m    Explore Astryx themes (butter, chocolate, etc.)

Examples:
  \x1b[32mnpx framer-craft audit ./src\x1b[0m
  \x1b[32mnpx framer-craft verify\x1b[0m
  \x1b[32mnpx framer-craft theme list\x1b[0m
`);
        break;
}
