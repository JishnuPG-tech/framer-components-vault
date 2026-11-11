---
name: framer-craft-vault
description: "Primary skill for building artisanal, human-crafted UI/UX, webapps, landing pages, and interactive frontend components. Connects the agent directly to the 1,680+ Framer Component Vault (https://github.com/JishnuPG-tech/framer-components-vault) and live Intelligence API (https://jishnupg-opencode-cli.hf.space/preview/3000/api/). Synthesizes Anti-Slop, UI-UX Pro Max, Refero Design, Radix UI, shadcn, and Iconsax with an AI Reward Engine (strong negative penalties) and headless DOM/CSS/AXTree visual inspection without screenshots."
---

# Framer Craft Vault: Human-Art UI/UX Intelligence & Reward Engine

The Framer Craft Vault gives agents taste, kinetic evidence, and production-ready artisanal component code.
It combines:
1. **The 1,683+ Component Vault** (Framer Motion, Awwwards/FWA-tier primitives).
2. **Anti-Slop Core Filter** (`/antislop`, `/antislop-ui`, `/antislop-human`) enforcing the Purpose Test (R-01..R-37).
3. **Refero Design Intelligence** (`/refero-design`) enforcing reference locking and anti-averaging.
4. **Headless Accessibility & Tokens** (`/radix-ui-design-system`, `/shadcn`, `@astryxdesign/core`) for WAI-ARIA, StyleX atomic styling, Astryx themes (butter, chocolate, gothic, matcha, neutral, stone, y2k), and semantic CSS variables.
5. **Iconographic Consistency** (`/iconsax-library`) for 24×24 pixel-crisp SVGs.
6. **The Automated Anti-Slop & Repair Engine** (`policies/anti-slop.json`, `packages/anti-slop-engine`) with hard blocker gates and negative penalties to systematically reject and repair generic AI output.
7. **Headless Visual Inspection Protocol** for reviewing and refining live interfaces directly via DOM/CSS/AXTree without screenshotting.

---

## 1. Live Intelligence Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/dna` | `GET` | Codified motion presets, typography ratios, surface tokens, and reward matrix. |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/categories` | `GET` | List all 20 categories with item counts and samples. |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/catalog?limit=100` | `GET` | Paginated index of 1,683 components with titles & sizes. |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/search?q={query}` | `GET` | Search by keyword or trait (e.g. `accordion`, `spring`, `shader`, `hero`). |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/components/{slug}/inspect` | `GET` | Deep inspection of component props, dependencies, features, and springs. |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/components/{slug}/code?raw=true` | `GET` | Clean standalone TypeScript/React code ready for pasting. |
| `https://jishnupg-opencode-cli.hf.space/preview/3000/api/recommend?use_case={goal}` | `GET` | Curated recommendations for `hero`, `landing`, `pricing`, `cards`, `buttons`. |

*Offline fallback: Consult `catalog.json` and `craft_dna.json` in this skill directory if the cloud API is unreachable.*

---

## 2. The AI Reward Engine (Strong Negative Rewarding)

To break high-probability generic AI slop, evaluate every output against this mathematical scoring engine:

### A. Instant Disqualifications (-1000 pts / Automatic Rejection)
- **WCAG AA Contrast Failure:** Text contrast ratio < 4.5:1 (or < 3.0:1 for large display / UI controls).
- **Touch Target < 44×44px:** Any interactive mobile target violating WCAG 2.5.5.
- **Focus Outline Erased:** `outline: none` without a visible `:focus-visible` replacement.
- **Linear / 0ms State Snap:** Abrupt 0ms state change or raw `transition: all 0.3s ease`.

### B. Heavy Negative Penalties
- **-100 pts:** **Generic Blue/Purple/Cyan Glow:** Unmotivated AI gradient glow (R-01).
- **-90 pts:** **Sterile Default / Lifeless Void:** Flat white, hairline gray borders, zero personality or texture.
- **-80 pts:** **Template Monotony & Copy-Paste Cards:** 3 identical cards with centered generic icons (R-14).
- **-70 pts:** **Raw Hex Colors:** Inline `#3b82f6` or `bg-blue-500` bypassing design tokens.
- **-60 pts:** **Excessive Glassmorphism:** `backdrop-blur` on every card, navbar, modal simultaneously.
- **-50 pts:** **Uniform Pill Radius:** Making every button, card, and input pill-shaped (R-11).
- **-50 pts:** **Generic Emojis / Mismatched Icons:** Using emojis or mixed icon families.
- **-40 pts:** **Soft Floaty Shadows Everywhere:** Diffuse shadows on everything erasing the ground plane.

### C. Positive Reinforcements
- **+90 pts:** Headless Radix UI accessibility with full keyboard & screen reader support.
- **+80 pts:** Calibrated Framer Motion springs (`stiffness`, `damping`, `mass`, `restDelta`).
- **+80 pts:** Typographic tension (negative tracking clamp on display + uppercase mono micro-meta).
- **+70 pts:** Tactile surface craft (double-inset subtle borders, dark obsidian glass, ambient directional glow).
- **+60 pts:** Reference-locked evidence (grounded in real design patterns, not vibe memory).
- **+50 pts:** Strict Iconsax SVG 24×24 consistency.

**Masterpiece Acceptance Bar:** Net Score must be **≥ +200** with **0 Disqualifications**.

---

## 3. Kinetic Laws & Typographic Tension

1. **Mandatory Spring Presets (From Vault DNA)**:
   - **Snappy Controls** (Buttons, Badges, Toggles):
     `{ type: "spring", stiffness: 320, damping: 28, mass: 0.8, restDelta: 0.001 }`
   - **Fluid Layouts** (Accordions, Expandable Cards, Modals):
     `{ type: "spring", stiffness: 260, damping: 34, mass: 1.0, restDelta: 0.01 }`
   - **Editorial & Hero** (Image Reveals, Large Text Slides, Parallax):
     `{ type: "spring", stiffness: 140, damping: 22, mass: 1.2, restDelta: 0.01 }`
   - **Magnetic Elements** (Cursor followers, floating badges):
     `{ type: "spring", stiffness: 400, damping: 30, mass: 0.5, restDelta: 0.001 }`

2. **Typographic Tension**:
   - Headings (>32px): Negative tracking (`letter-spacing: -0.04em` to `-0.055em`), line-height (`1.05em` to `1.15em`), and fluid clamp (`clamp(2.5rem, 6vw, 5rem)`).
   - Micro-Metadata: Uppercase monospace (`font-family: 'JetBrains Mono', monospace`, `11px`, `letter-spacing: 0.12em`).

3. **Surface & Light Craft**:
   - Double-inset highlight: `box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`.
   - Layered Obsidian Glass: `background: rgba(19, 18, 16, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08);`.
   - Subtle background noise / ambient spotlight tracking mouse coordinates.

---

## 4. Headless Visual Inspection Protocol (Seeing Without Screenshots)

Never waste tokens, introduce latency, or hallucinate using PNG screenshots. Inspect the live rendered UI via **Direct Headless Introspection**:

1. **Computed Style Introspection**:
   Query `window.getComputedStyle(element)` to verify computed `letterSpacing`, `lineHeight`, `transition`, and `boxShadow`.
2. **Mathematical WCAG AA Verification**:
   Extract RGB values and calculate `(L1 + 0.05) / (L2 + 0.05)` directly in the browser runtime. Ensure text passes 4.5:1.
3. **Sub-pixel Layout & Touch Target Rects**:
   Query `element.getBoundingClientRect()` to verify `width >= 44 && height >= 44` and detect horizontal scroll overflow (`scrollWidth > clientWidth`).
4. **CDP Accessibility Tree**:
   Inspect the full accessibility tree (`Accessibility.getFullAXTree`) to verify accessible names and focus rings.
5. **FigCraft Native Canvas Nodes**:
   Query FigCraft MCP (`inspect_document`, `get_node`) to inspect layers, auto-layout padding, fills, strokes, and corner radii directly in memory.
6. **Continuous Refinement Loop**:
   Inspect runtime -> Run Reward Heuristics -> Penalize slop -> Apply surgical code edits -> Verify HMR update in 50ms.
