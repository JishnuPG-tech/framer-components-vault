#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://jishnupg-hermes.hf.space/preview/3000/api';
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
export const withOptimizedAppearEffect = (Component: any) => Component;
export const useIsStaticRenderer = () => false;
export const RenderTarget = { current: () => "canvas", hasRestrictions: () => false };
export const Frame = React.forwardRef(({ children, ...props }: any, ref) => React.createElement("div", { ref, ...props }, children));
export const Stack = React.forwardRef(({ children, ...props }: any, ref) => React.createElement("div", { ref, ...props }, children));
`;

const CURSORRULES_CONTENT = `# Artisanal Human-Art UI/UX & Framer Craft Directives
## Source of Truth
- Component Vault: https://github.com/JishnuPG-tech/framer-components-vault
- Intelligence API: https://jishnupg-hermes.hf.space/preview/3000/api

## Rules for Frontend Code
1. Never generate generic AI-slop (flat 0.3s ease transitions, plain 3-column cards, purple gradients).
2. All animations must use Framer Motion springs:
   - Snappy (buttons): { type: "spring", stiffness: 320, damping: 28, mass: 0.8 }
   - Fluid (accordions, cards): { type: "spring", stiffness: 260, damping: 34, mass: 1.0 }
   - Editorial (hero, image reveals): { type: "spring", stiffness: 140, damping: 22, mass: 1.2 }
3. Large headlines (>32px) must use negative tracking (-0.04em to -0.055em) and tight line-height (1.05em to 1.12em).
4. Micro-labels must be uppercase monospace (11px, letter-spacing: 0.12em).
5. Surfaces: Liquid frosted glass (backdrop-blur, 1px rgba(255,255,255,0.08) border, inset 0 1px 1px highlight).
6. Before writing components from scratch, run \`npx framer-craft search <query>\` to find human-crafted primitives.
`;

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'framer-craft-cli/1.0' } });
    if (!res.ok) throw new Error(`HTTP error ${res.status} from ${url}`);
    return await res.json();
}

async function fetchText(url) {
    const res = await fetch(url, { headers: { 'User-Agent': 'framer-craft-cli/1.0' } });
    if (!res.ok) throw new Error(`HTTP error ${res.status} from ${url}`);
    return await res.text();
}

// CLI Commands
async function cmdInit() {
    console.log('\x1b[38;2;217;101;59m⚡ Initializing Framer Craft in project...\x1b[0m\n');

    // 1. Determine target directory
    const isSrc = fs.existsSync(path.join(process.cwd(), 'src'));
    const compDir = isSrc 
        ? path.join(process.cwd(), 'src', 'components', 'framer')
        : path.join(process.cwd(), 'components', 'framer');

    fs.mkdirSync(compDir, { recursive: true });

    // 2. Write universal shim
    const shimPath = path.join(compDir, 'shim.tsx');
    fs.writeFileSync(shimPath, SHIM_CONTENT, 'utf-8');
    console.log(`\x1b[32m✔\x1b[0m Created Framer Runtime Shim: \x1b[36m${path.relative(process.cwd(), shimPath)}\x1b[0m`);

    // 3. Write .cursorrules
    const rulesPath = path.join(process.cwd(), '.cursorrules');
    if (!fs.existsSync(rulesPath)) {
        fs.writeFileSync(rulesPath, CURSORRULES_CONTENT, 'utf-8');
        console.log(`\x1b[32m✔\x1b[0m Injected AI Craft Rules: \x1b[36m.cursorrules\x1b[0m`);
    } else {
        console.log(`\x1b[33mℹ\x1b[0m .cursorrules already exists, skipping.`);
    }

    // 4. Check dependencies
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
        console.log('  Run: \x1b[32mnpm install framer-motion\x1b[0m (or pnpm add framer-motion / bun add framer-motion)\n');
    }

    console.log('\x1b[38;2;217;101;59m✔ Project ready for artisanal Framer components!\x1b[0m');
    console.log('Try: \x1b[36mnpx framer-craft add fold-rows\x1b[0m or \x1b[36mnpx framer-craft search hero\x1b[0m\n');
}

async function cmdAdd(slug) {
    if (!slug) {
        console.error('\x1b[31mError:\x1b[0m Please specify a component slug. Example: \x1b[36mnpx framer-craft add fold-rows\x1b[0m');
        process.exit(1);
    }

    console.log(`\x1b[38;2;217;101;59mFetching component:\x1b[0m \x1b[1m${slug}\x1b[0m...`);

    let code = '';
    try {
        // Try live API first
        code = await fetchText(`${API_BASE}/components/${slug}/code?raw=true`);
    } catch (e) {
        // Fallback to GitHub raw
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

    // Determine target location
    const isSrc = fs.existsSync(path.join(process.cwd(), 'src'));
    const compDir = isSrc 
        ? path.join(process.cwd(), 'src', 'components', 'framer')
        : path.join(process.cwd(), 'components', 'framer');

    fs.mkdirSync(compDir, { recursive: true });

    // If shim doesn't exist, generate it
    const shimPath = path.join(compDir, 'shim.tsx');
    if (!fs.existsSync(shimPath)) {
        fs.writeFileSync(shimPath, SHIM_CONTENT, 'utf-8');
    }

    const targetFile = path.join(compDir, `${slug}.tsx`);
    fs.writeFileSync(targetFile, code, 'utf-8');

    console.log(`\n\x1b[32m✔ Successfully installed!\x1b[0m`);
    console.log(`  File: \x1b[36m${path.relative(process.cwd(), targetFile)}\x1b[0m (${(code.length / 1024).toFixed(1)} KB)`);
    console.log(`\n\x1b[1mUsage in your page:\x1b[0m`);
    console.log(`  \x1b[38;2;217;101;59mimport ${toPascalCase(slug)} from "@/components/framer/${slug}";\x1b[0m`);
    console.log(`  \x1b[38;2;217;101;59m<${toPascalCase(slug)} />\x1b[0m\n`);
}

async function cmdSearch(query) {
    if (!query) {
        console.error('\x1b[31mError:\x1b[0m Please provide a search term. Example: \x1b[36mnpx framer-craft search accordion\x1b[0m');
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
        console.log(`\n\x1b[33mTotal: ${data.total_categories} categories across 900+ components.\x1b[0m\n`);
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
    default:
        console.log(`
\x1b[38;2;217;101;59m╭───────────────────────────────────────────────────╮
│  ⚡ framer-craft: Instant Human-Art Component CLI  │
╰───────────────────────────────────────────────────╯\x1b[0m

Usage:
  \x1b[36mnpx framer-craft init\x1b[0m           Initialize project with shims & AI rules
  \x1b[36mnpx framer-craft add <slug>\x1b[0m     Install a component by slug (e.g. fold-rows)
  \x1b[36mnpx framer-craft search <term>\x1b[0m  Search 900+ components by name or trait
  \x1b[36mnpx framer-craft list\x1b[0m           List all categories and counts
  \x1b[36mnpx framer-craft dna\x1b[0m            Print spring presets and typography rules

Examples:
  \x1b[32mnpx framer-craft add cascade-card-slider\x1b[0m
  \x1b[32mnpx framer-craft search "liquid button"\x1b[0m
  \x1b[32mnpx framer-craft dna\x1b[0m
`);
        break;
}
