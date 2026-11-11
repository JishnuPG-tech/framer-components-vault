import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useReducedMotion } from "framer-motion"

/**
 * Letter Beads
 * Text spelled in round alphabet beads, like a friendship bracelet.
 * The beads flow continuously along a wave, around a bracelet, or in a
 * straight ticker line.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 140
 */

type Tag = "h1" | "h2" | "h3" | "h4" | "p"
type Layout = "wave" | "bracelet" | "ticker"
type Palette = "rainbow" | "classic" | "pastel" | "custom"
type SpacerPattern = "words" | "letters" | "none"
type SpacerStyle = "symbols" | "mixed" | "round" | "pearl"
type SymbolKind = "star" | "heart" | "heartOutline" | "flower" | "moon"
type Hover = "rotate" | "none"
type Direction = "forward" | "backward"
type Typeface = "classic" | "custom"
type Trigger = "enter" | "load"

interface PaletteDef {
    letterBg: string[]
    letterText: string[]
    spacers: string[]
}

const PALETTES: Record<Exclude<Palette, "custom">, PaletteDef> = {
    rainbow: {
        letterBg: ["#FFFFFF"],
        letterText: [
            "#F2603A",
            "#F5A11C",
            "#E9BE12",
            "#33B566",
            "#1FA6C4",
            "#3B7BDB",
            "#8A5BD6",
            "#EC4C9A",
        ],
        spacers: ["#FF9EC6", "#8FD3FF", "#FFD866", "#9EE6B5", "#C9AEFF"],
    },
    classic: {
        letterBg: ["#FBFAF6"],
        letterText: ["#1D1D1F"],
        spacers: ["#FF5FA2", "#FFC93C", "#4CC9F0", "#9B6BFF", "#5ED68A"],
    },
    pastel: {
        letterBg: ["#FFD3E6", "#D3EEFF", "#E6DBFF", "#D9F5E0", "#FFF0C2"],
        letterText: ["#3B3540"],
        spacers: ["#FFB3D1", "#B8E2FF", "#D2C2FF", "#BDEBC9", "#FFE29A"],
    },
}

const DEFAULT_TEXT = "Bestie"
/*
 * Built-in "Classic" typeface: Nunito ExtraBold (800), Latin subset, embedded so
 * the component makes no external font requests.
 * Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito).
 * Licensed under the SIL Open Font License, Version 1.1 (https://openfontlicense.org).
 */
const NUNITO_800_WOFF2 =
    "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"
const FONT_FACE = `@font-face { font-family: "LetterBeads Nunito"; font-style: normal; font-weight: 800; font-display: swap; src: url(data:font/woff2;base64,${NUNITO_800_WOFF2}) format("woff2"); }`

const CLASSIC_FAMILY =
    '"LetterBeads Nunito", ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif'

const KEYFRAMES = `
@keyframes lbWiggleA { 0% { transform: rotate(0deg); } 22% { transform: rotate(18deg); } 45% { transform: rotate(-10deg); } 65% { transform: rotate(5deg); } 82% { transform: rotate(-2deg); } 100% { transform: rotate(0deg); } }
@keyframes lbWiggleB { 0% { transform: rotate(0deg); } 22% { transform: rotate(-18deg); } 45% { transform: rotate(10deg); } 65% { transform: rotate(-5deg); } 82% { transform: rotate(2deg); } 100% { transform: rotate(0deg); } }
.lb-pause-btn { transition: opacity 0.2s ease; }
.lb-pause-btn[data-mode="focus"] { opacity: 0; pointer-events: none; }
.lb-pause-btn[data-mode="focus"]:focus-visible { opacity: 1; pointer-events: auto; }
.lb-pause-btn:focus-visible { outline: 2px solid #2A55C9; outline-offset: 2px; }
`

interface Props {
    text: string
    tag: Tag
    layout: Layout
    palette: Palette
    letterBg: string
    letterText: string
    spacerColor: string
    spacerStyle: SpacerStyle
    spacerPattern: SpacerPattern
    spacerCount: number
    repeatGap: number
    showCord: boolean
    cordColor: string
    waves: number
    waveHeight: number
    wavePhase: number
    beadSize: number
    typeface: Typeface
    font: React.CSSProperties
    uppercase: boolean
    speed: number
    direction: Direction
    pauseOnHover: boolean
    pauseButton: "focus" | "always"
    hover: Hover
    delay: number
    trigger: Trigger
    once: boolean
    style?: React.CSSProperties
}

/* ---------- Items ---------- */

interface Item {
    kind: "letter" | "spacer"
    char?: string
    bg: string
    fg: string
    spacer?: "round" | "pearl" | "symbol" | "blank"
    symbol?: SymbolKind
    tint?: boolean // translucent coloured bead with a white symbol
    w: number // width in bead units (1 = one letter bead)
}

// Symbol beads, modelled on classic acrylic alphabet-bead sets.
const SYMBOL_CYCLE: { symbol: SymbolKind; tint: boolean }[] = [
    { symbol: "star", tint: false },
    { symbol: "heart", tint: true },
    { symbol: "heartOutline", tint: false },
    { symbol: "flower", tint: true },
    { symbol: "star", tint: false },
    { symbol: "moon", tint: true },
    { symbol: "heartOutline", tint: false },
]
const SYMBOL_INK = [
    "#F28C1B",
    "#EC3F8C",
    "#9B5BD9",
    "#D7263D",
    "#1E8E4A",
    "#2A55C9",
    "#F06A3E",
]
const SYMBOL_TINT = [
    "#A9DE7E",
    "#F5B5C6",
    "#8FC8EF",
    "#E0412F",
    "#F28A1E",
    "#F2D66A",
    "#7ED0EC",
]
const MIX_CYCLE: ("round" | "symbol" | "pearl")[] = [
    "symbol",
    "round",
    "pearl",
    "symbol",
    "round",
]

function makeSpacerFactory(style: SpacerStyle, colors: string[]) {
    let n = 0
    let sym = 0
    let col = 0
    const symbolBead = (): Item => {
        const def = SYMBOL_CYCLE[sym % SYMBOL_CYCLE.length]
        const pool = def.tint ? SYMBOL_TINT : SYMBOL_INK
        const color = pool[(sym * 3 + 1) % pool.length]
        sym++
        return {
            kind: "spacer",
            spacer: "symbol",
            symbol: def.symbol,
            tint: def.tint,
            bg: color,
            fg: "",
            w: 1,
        }
    }
    return (): Item => {
        const kind =
            style === "symbols"
                ? "symbol"
                : style === "mixed"
                  ? MIX_CYCLE[n % MIX_CYCLE.length]
                  : style === "pearl"
                    ? "pearl"
                    : "round"
        n++
        if (kind === "symbol") return symbolBead()
        const bg = kind === "pearl" ? "#F4EFE6" : colors[col++ % colors.length]
        return { kind: "spacer", spacer: kind, bg, fg: "", w: 0.6 }
    }
}

function buildItems(
    text: string,
    pal: PaletteDef,
    pattern: SpacerPattern,
    perGap: number,
    spacer: () => Item
) {
    const items: Item[] = []
    const words = text.split(/\s+/).filter(Boolean)
    let li = 0
    words.forEach((word, wi) => {
        if (wi > 0) {
            if (pattern === "none")
                items.push({
                    kind: "spacer",
                    spacer: "blank",
                    bg: "transparent",
                    fg: "",
                    w: 0.5,
                })
            else for (let i = 0; i < perGap; i++) items.push(spacer())
        }
        Array.from(word).forEach((ch, ci) => {
            if (ci > 0 && pattern === "letters") items.push(spacer())
            items.push({
                kind: "letter",
                char: ch,
                bg: pal.letterBg[li % pal.letterBg.length],
                fg:
                    pal.letterText.length > 1
                        ? pal.letterText[
                              (ch.toUpperCase().codePointAt(0) || 0) %
                                  pal.letterText.length
                          ]
                        : pal.letterText[0],
                w: 1,
            })
            li++
        })
    })
    return items
}

/* ---------- Bead visuals ---------- */

function shadeHex(hex: string, amt: number) {
    if (!hex.startsWith("#")) return hex
    const h = hex.slice(1)
    const f =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h.slice(0, 6)
    const n = parseInt(f, 16) || 0
    const t = amt < 0 ? 0 : 255
    const p = Math.abs(amt)
    const ch = (v: number) => Math.round(v + (t - v) * p)
    return `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

function CoinBead({ item }: { item: Item }) {
    const bg = item.bg
    return (
        <span
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1em",
                height: "1em",
                borderRadius: "50%",
                // Flat acrylic disc: bright face, soft grey bevel at the edge
                background: `radial-gradient(circle at 50% 46%, ${bg} 0%, ${bg} 52%, ${shadeHex(bg, -0.05)} 70%, ${shadeHex(bg, -0.16)} 88%, ${shadeHex(bg, -0.1)} 100%)`,
                boxShadow:
                    "inset 0 0.05em 0.04em rgba(255,255,255,0.95), inset 0 -0.06em 0.08em rgba(0,0,0,0.10), 0 0.05em 0.1em rgba(0,0,0,0.18), 0 0 0 0.012em rgba(0,0,0,0.06)",
            }}
        >
            <span
                style={{
                    fontSize: "0.52em",
                    lineHeight: 1,
                    color: item.fg,
                    marginTop: "0.03em",
                    // printed ink: a hair of depth, not embossed
                    textShadow: `0 0.02em 0 ${shadeHex(item.fg, -0.25)}`,
                }}
            >
                {item.char}
            </span>
            {/* soft pearly sheen */}
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(ellipse 60% 35% at 40% 22%, rgba(255,255,255,0.7), rgba(255,255,255,0) 70%)",
                    pointerEvents: "none",
                }}
            />
        </span>
    )
}
const SYMBOL_PATHS: Record<SymbolKind, string> = {
    star: "M12 3.4l2.5 5.4 5.9.6-4.4 4 1.2 5.8L12 16.3l-5.2 2.9 1.2-5.8-4.4-4 5.9-.6z",
    heart: "M12 19.6s-6.6-4-8.3-8C2.4 8.6 4.2 5.2 7.4 5.2c1.9 0 3.2 1.1 4.6 2.8 1.4-1.7 2.7-2.8 4.6-2.8 3.2 0 5 3.4 3.7 6.4-1.7 4-8.3 8-8.3 8z",
    heartOutline:
        "M12 18.4s-5.6-3.4-7-6.8c-1.1-2.6.4-5.4 3.1-5.4 1.6 0 2.7.9 3.9 2.4 1.2-1.5 2.3-2.4 3.9-2.4 2.7 0 4.2 2.8 3.1 5.4-1.4 3.4-7 6.8-7 6.8z",
    flower: "",
    moon: "M14.6 4.6a7.6 7.6 0 1 0 4.8 13.3 6.2 6.2 0 0 1-4.8-13.3z",
}

function SymbolBead({ item }: { item: Item }) {
    const sym = item.symbol || "star"
    const tint = !!item.tint
    const face = tint
        ? // translucent acrylic: lighter swirl in the middle, deeper at the rim
          `radial-gradient(circle at 50% 46%, ${shadeHex(item.bg, 0.22)} 0%, ${shadeHex(item.bg, 0.1)} 45%, ${item.bg} 78%, ${shadeHex(item.bg, -0.1)} 100%)`
        : "radial-gradient(circle at 50% 46%, #FFFFFF 0%, #FFFFFF 52%, #F2F2F2 70%, #DADADA 88%, #E6E6E6 100%)"
    const ink = tint ? "#FFFFFF" : item.bg
    const outline = sym === "heartOutline" || (sym === "moon" && tint)
    return (
        <span
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "1em",
                height: "1em",
                borderRadius: "50%",
                background: face,
                boxShadow:
                    "inset 0 0.05em 0.04em rgba(255,255,255,0.85), inset 0 -0.06em 0.08em rgba(0,0,0,0.12), 0 0.05em 0.1em rgba(0,0,0,0.18)",
            }}
        >
            <svg
                viewBox="0 0 24 24"
                style={{
                    width: "0.56em",
                    height: "0.56em",
                    overflow: "visible",
                }}
            >
                {sym === "flower" ? (
                    <g
                        fill={ink}
                        stroke={tint ? shadeHex(item.bg, -0.1) : "none"}
                        strokeWidth={0.6}
                    >
                        {[0, 1, 2, 3, 4].map((k) => {
                            const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
                            return (
                                <circle
                                    key={k}
                                    cx={12 + Math.cos(a) * 5.2}
                                    cy={12 + Math.sin(a) * 5.2}
                                    r={4.1}
                                />
                            )
                        })}
                        <circle cx={12} cy={12} r={3.4} />
                    </g>
                ) : (
                    <path
                        d={SYMBOL_PATHS[sym]}
                        fill={outline ? "none" : ink}
                        stroke={outline ? ink : "none"}
                        strokeWidth={outline ? 2.6 : 0}
                        strokeLinejoin="round"
                    />
                )}
            </svg>
            {/* sheen */}
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse 60% 35% at 40% 22%, rgba(255,255,255,${tint ? 0.55 : 0.7}), rgba(255,255,255,0) 70%)`,
                    pointerEvents: "none",
                }}
            />
        </span>
    )
}

function SpacerBead({ item }: { item: Item }) {
    if (item.spacer === "symbol") return <SymbolBead item={item} />
    const size = `${item.w}em`
    if (item.spacer === "blank" || !item.spacer)
        return <span style={{ display: "block", width: size, height: "1em" }} />
    const bg =
        item.spacer === "pearl"
            ? "radial-gradient(circle at 34% 30%, #FFFFFF 0%, #F1EBE1 45%, #C9BFB0 100%)"
            : `radial-gradient(circle at 34% 30%, ${shadeHex(item.bg, 0.6)} 0%, ${item.bg} 45%, ${shadeHex(item.bg, -0.28)} 100%)`
    return (
        <span
            style={{
                display: "block",
                width: size,
                height: size,
                borderRadius: "50%",
                background: bg,
                boxShadow: "0 0.05em 0.08em rgba(0,0,0,0.25)",
            }}
        />
    )
}

/* ---------- One bead (owns its own hover wiggle) ---------- */

const Bead = React.memo(function Bead({
    item,
    hover,
    setRef,
    initial,
}: {
    item: Item
    hover: boolean
    setRef: (el: HTMLSpanElement | null) => void
    initial: React.CSSProperties
}) {
    const [spins, setSpins] = useState(0)
    return (
        <span
            ref={setRef}
            onMouseEnter={hover ? () => setSpins((s) => s + 1) : undefined}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                willChange: "transform",
                ...initial,
            }}
        >
            <span
                style={{
                    display: "block",
                    animation: spins
                        ? `${spins % 2 ? "lbWiggleA" : "lbWiggleB"} 0.9s ease-out`
                        : undefined,
                }}
            >
                {item.kind === "letter" ? (
                    <CoinBead item={item} />
                ) : (
                    <SpacerBead item={item} />
                )}
            </span>
        </span>
    )
})

/* ---------- Paths the beads flow along ---------- */

interface Point {
    x: number
    y: number
    rot: number
}

interface Geometry {
    width: number
    height: number
    size: number
    items: Item[]
    base: number[] // arc position of each bead at offset 0
    closed: boolean
    total: number // path length
    span: number // open paths: length of all repeated copies
    lead: number // open paths: how far before the path start beads may wait
    o0: number // starting offset: puts the word in view
    at: (s: number) => Point
    cord: {
        kind: "line" | "poly" | "circle"
        points?: string
        y?: number
        cx?: number
        cy?: number
        r?: number
    }
    clip: boolean
}

function positionOf(
    g: Geometry,
    i: number,
    o: number
): Point & { visible: boolean } {
    const mod = (a: number, m: number) => ((a % m) + m) % m
    if (g.closed) {
        const s = mod(g.base[i] + o, g.total)
        return { ...g.at(s), visible: true }
    }
    const s = mod(g.base[i] - o, g.span) - g.lead
    if (s < 0 || s > g.total)
        return { ...g.at(Math.min(g.total, Math.max(0, s))), visible: false }
    return { ...g.at(s), visible: true }
}

function transformOf(p: Point) {
    return `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) translate(-50%, -50%) rotate(${p.rot.toFixed(2)}deg)`
}

/* ---------- Component ---------- */

export default function LetterBeads(props: Props) {
    const {
        text = DEFAULT_TEXT,
        tag = "h2",
        layout = "wave",
        palette = "rainbow",
        letterBg = "#FBFAF6",
        letterText = "#1D1D1F",
        spacerColor = "#FF5FA2",
        spacerStyle = "symbols",
        showCord = true,
        cordColor = "#E8DCCB",
        waves = 1.25,
        waveHeight = 0.5,
        wavePhase = 0,
        beadSize = 56,
        typeface = "classic",
        font,
        uppercase = true,
        speed = 40,
        direction = "forward",
        pauseOnHover = true,
        pauseButton = "focus",
        hover = "rotate",
        delay = 0,
        trigger = "enter",
        once = true,
        style,
    } = props
    const spacerPattern: SpacerPattern = props.spacerPattern ?? "words"
    const spacerCount = props.spacerCount ?? 2
    const repeatGap = props.repeatGap ?? 3

    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once, amount: 0.2 })
    const visibleNow = useInView(ref, { amount: 0 })
    const reducedMotion = useReducedMotion()
    // Static on the Framer canvas and in exports; reduced motion also keeps it still.
    const isStaticRenderer = useIsStaticRenderer()
    const staticMode = isStaticRenderer || !!reducedMotion
    const active = staticMode || trigger === "load" || inView

    // Measure first, then decide once whether to fill the frame or use a natural size.
    const [width, setWidth] = useState(0)
    const [sizing, setSizing] = useState<"unknown" | "fill" | "natural">(
        "unknown"
    )
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([e]) => {
            const w = Math.round(e.contentRect.width)
            setSizing((m) =>
                m === "unknown" ? (w > 0 ? "fill" : "natural") : m
            )
            setWidth(w)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const pal: PaletteDef =
        palette === "custom"
            ? {
                  letterBg: [letterBg],
                  letterText: [letterText],
                  spacers: [spacerColor],
              }
            : PALETTES[palette as Exclude<Palette, "custom">] ||
              PALETTES.rainbow
    const display = uppercase ? text.toUpperCase() : text
    const gap = 0.04 // a sliver of cord between beads, in bead units

    const geo = useMemo<Geometry | null>(() => {
        if (sizing === "unknown" || (sizing === "fill" && width <= 0))
            return null
        const natural = sizing === "natural"
        const spacer = makeSpacerFactory(
            spacerStyle as SpacerStyle,
            pal.spacers
        )
        const core = buildItems(
            display,
            pal,
            spacerPattern,
            spacerCount,
            spacer
        )
        const units = (list: Item[]) =>
            list.reduce((s, it) => s + it.w + gap, 0)

        /* ----- Bracelet: a closed ring, the word plus spacers all the way round ----- */
        if (layout === "bracelet") {
            const coreUnits = units(core)
            const W = natural
                ? Math.max(
                      beadSize * 6,
                      (coreUnits * beadSize) / (Math.PI * 0.5) + beadSize * 1.4
                  )
                : width
            let size = beadSize
            let R = W / 2 - size * 0.7
            if (coreUnits * size > Math.PI * 2 * R * 0.8) {
                size =
                    (Math.PI * 2 * (W / 2) * 0.8) /
                    (coreUnits + 0.8 * Math.PI * 1.4)
                R = W / 2 - size * 0.7
            }
            const C = Math.PI * 2 * R
            const items = [...core]
            let used = coreUnits * size
            for (;;) {
                const s = spacer()
                if (used + (s.w + gap) * size > C) break
                items.push(s)
                used += (s.w + gap) * size
            }
            if (!items.length) items.push(spacer())
            const extra = (C - used) / items.length
            const base: number[] = []
            let arc = 0
            for (const it of items) {
                base.push(arc + (it.w * size) / 2)
                arc += (it.w + gap) * size + extra
            }
            const coreCenter = core.length
                ? (base[0] + base[core.length - 1]) / 2
                : 0
            const cx = W / 2,
                cy = W / 2
            return {
                width: W,
                height: W,
                size,
                items,
                base,
                closed: true,
                total: C,
                span: C,
                lead: 0,
                o0: -coreCenter, // word starts at the top of the ring
                at: (s) => {
                    const a = -Math.PI / 2 + s / R
                    return {
                        x: cx + Math.cos(a) * R,
                        y: cy + Math.sin(a) * R,
                        rot: (a * 180) / Math.PI + 90,
                    }
                },
                cord: { kind: "circle", cx, cy, r: R },
                clip: false,
            }
        }

        /* ----- Wave and Ticker: open paths, the word repeats along them ----- */
        const W = natural ? 640 : width
        let size = beadSize
        const coreUnits = units(core)
        if (layout === "wave" && coreUnits * size > W * 0.85)
            size = (W * 0.85) / coreUnits

        const seq = [...core]
        for (let i = 0; i < Math.max(1, repeatGap); i++) seq.push(spacer())
        const seqLen = units(seq) * size

        let at: (s: number) => Point
        let total: number
        let height: number
        let sMid: number
        let cord: Geometry["cord"]

        if (layout === "wave") {
            const A = waveHeight * size
            const k = (Math.PI * 2 * Math.max(0.1, waves)) / W
            const ph = (wavePhase * Math.PI) / 180
            const top = A + size * 0.75
            const yAt = (x: number) => top + A * Math.cos(k * (x - W / 2) + ph)
            const N = 600
            const xa = -size * 2,
                xb = W + size * 2
            const xs: number[] = [],
                ys: number[] = [],
                cum: number[] = []
            for (let i = 0; i <= N; i++) {
                const x = xa + ((xb - xa) * i) / N
                xs.push(x)
                ys.push(yAt(x))
                cum.push(
                    i
                        ? cum[i - 1] +
                              Math.hypot(x - xs[i - 1], ys[i] - ys[i - 1])
                        : 0
                )
            }
            total = cum[N]
            at = (s) => {
                let lo = 0,
                    hi = N
                while (hi - lo > 1) {
                    const m = (lo + hi) >> 1
                    if (cum[m] < s) lo = m
                    else hi = m
                }
                const f = Math.min(
                    1,
                    Math.max(0, (s - cum[lo]) / (cum[hi] - cum[lo] || 1))
                )
                return {
                    x: xs[lo] + (xs[hi] - xs[lo]) * f,
                    y: ys[lo] + (ys[hi] - ys[lo]) * f,
                    rot:
                        (Math.atan2(ys[hi] - ys[lo], xs[hi] - xs[lo]) * 180) /
                        Math.PI,
                }
            }
            let mid = 0
            while (mid < N && xs[mid] < W / 2) mid++
            sMid = cum[mid]
            height = top + A + size * 0.75
            const pts: string[] = []
            for (let i = 0; i <= N; i += 6)
                pts.push(`${xs[i].toFixed(1)},${ys[i].toFixed(1)}`)
            cord = { kind: "poly", points: pts.join(" ") }
        } else {
            const y = size * 0.75
            const x0 = -size * 2
            total = W + size * 4
            at = (s) => ({ x: x0 + s, y, rot: 0 })
            sMid = W / 2 - x0
            height = size * 1.5
            cord = { kind: "line", y }
        }

        // Lay out repeats by their real length (fresh spacers can differ in size).
        const items: Item[] = []
        const base: number[] = []
        let cursor = 0
        let lead = seqLen
        for (let c = 0; c === 0 || cursor < total + lead * 2; c++) {
            const copy =
                c === 0
                    ? seq
                    : [...core, ...seq.slice(core.length).map(() => spacer())]
            const start = cursor
            for (const it of copy) {
                items.push(it)
                base.push(cursor + (it.w * size) / 2)
                cursor += (it.w + gap) * size
            }
            lead = Math.max(lead, cursor - start)
        }
        const coreLen = core.length ? units(core) * size - gap * size : 0
        const span = cursor
        // Start with the first copy of the word centred in view.
        const o0 = coreLen / 2 - sMid - lead
        return {
            width: W,
            height,
            size,
            items,
            base,
            closed: false,
            total,
            span,
            lead,
            o0,
            at,
            cord,
            clip: true,
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        sizing,
        width,
        display,
        layout,
        palette,
        letterBg,
        letterText,
        spacerColor,
        spacerStyle,
        spacerPattern,
        spacerCount,
        repeatGap,
        beadSize,
        waves,
        waveHeight,
        wavePhase,
    ])

    /* ----- Flow: move beads along the path every frame, without re-rendering ----- */
    const beadEls = useRef<(HTMLSpanElement | null)[]>([])
    const setters = useMemo(
        () =>
            geo
                ? geo.items.map(
                      (_, i) => (el: HTMLSpanElement | null) =>
                          (beadEls.current[i] = el)
                  )
                : [],
        [geo]
    )
    const offset = useRef(0)
    const [hoverPaused, setHoverPaused] = useState(false)
    const [userPaused, setUserPaused] = useState(false)
    const sign = direction === "backward" ? -1 : 1
    const canAnimate = !staticMode && speed !== 0
    const running =
        canAnimate && active && visibleNow && !hoverPaused && !userPaused

    useLayoutEffect(() => {
        if (geo) offset.current = geo.o0
    }, [geo])

    useEffect(() => {
        if (isStaticRenderer || !geo || !running) return
        let raf = 0
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            offset.current += dt * speed * sign
            for (let i = 0; i < geo.items.length; i++) {
                const el = beadEls.current[i]
                if (!el) continue
                const p = positionOf(geo, i, offset.current)
                el.style.transform = transformOf(p)
                el.style.visibility = p.visible ? "visible" : "hidden"
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isStaticRenderer, geo, running, speed, sign])

    // Fade in once triggered.
    const [shown, setShown] = useState(false)
    useEffect(() => {
        if (isStaticRenderer || !active) return
        const id = requestAnimationFrame(() => setShown(true))
        return () => cancelAnimationFrame(id)
    }, [isStaticRenderer, active])
    const reveal = staticMode || shown

    const Element = tag as any
    const family =
        typeface === "classic" ? CLASSIC_FAMILY : (font?.fontFamily as string)
    const weight = typeface === "classic" ? 800 : font?.fontWeight

    let content: React.ReactNode = null
    if (geo) {
        const cordW = Math.max(1, geo.size * 0.03)
        content = (
            <span
                onMouseEnter={
                    pauseOnHover && canAnimate
                        ? () => setHoverPaused(true)
                        : undefined
                }
                onMouseLeave={() => setHoverPaused(false)}
                style={{
                    position: "relative",
                    display: "block",
                    width: sizing === "natural" ? geo.width : "100%",
                    maxWidth: "100%",
                    height: geo.height,
                    fontSize: geo.size,
                    overflow: geo.clip ? "hidden" : undefined,
                    opacity: reveal ? 1 : 0,
                    transform: reveal ? "none" : "translateY(8px)",
                    transition: staticMode
                        ? undefined
                        : `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
                }}
            >
                {showCord && (
                    <svg
                        width="100%"
                        height={geo.height}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            overflow: "visible",
                            pointerEvents: "none",
                        }}
                    >
                        {geo.cord.kind === "poly" && (
                            <polyline
                                points={geo.cord.points}
                                fill="none"
                                stroke={cordColor}
                                strokeWidth={cordW}
                            />
                        )}
                        {geo.cord.kind === "line" && (
                            <line
                                x1={0}
                                x2="100%"
                                y1={geo.cord.y}
                                y2={geo.cord.y}
                                stroke={cordColor}
                                strokeWidth={cordW}
                            />
                        )}
                        {geo.cord.kind === "circle" && (
                            <circle
                                cx={geo.cord.cx}
                                cy={geo.cord.cy}
                                r={geo.cord.r}
                                fill="none"
                                stroke={cordColor}
                                strokeWidth={cordW}
                            />
                        )}
                    </svg>
                )}
                {geo.items.map((item, i) => {
                    const p = positionOf(geo, i, geo.o0)
                    return (
                        <Bead
                            key={i}
                            item={item}
                            hover={hover === "rotate" && !staticMode}
                            setRef={setters[i]}
                            initial={{
                                transform: transformOf(p),
                                visibility: p.visible ? "visible" : "hidden",
                            }}
                        />
                    )
                })}
            </span>
        )
    }

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                lineHeight: 1,
                fontFamily: family,
                fontWeight: weight as any,
                fontStyle: typeface === "classic" ? "normal" : font?.fontStyle,
                ...style,
            }}
        >
            <style>
                {(typeface === "classic" ? FONT_FACE : "") + KEYFRAMES}
            </style>
            {/* The real text, for search engines and screen readers. */}
            <Element
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    margin: -1,
                    padding: 0,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {text}
            </Element>
            {/* The beads are decorative. */}
            <span aria-hidden style={{ display: "block" }}>
                {content}
            </span>
            {canAnimate && (
                <button
                    type="button"
                    className="lb-pause-btn"
                    data-mode={pauseButton}
                    aria-label={
                        userPaused
                            ? "Play bead animation"
                            : "Pause bead animation"
                    }
                    onClick={() => setUserPaused((v) => !v)}
                    style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        padding: 0,
                        border: "none",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.92)",
                        color: "#1D1D1F",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        aria-hidden="true"
                        focusable="false"
                    >
                        {userPaused ? (
                            <path d="M3 1.5v11l9.5-5.5z" fill="currentColor" />
                        ) : (
                            <g fill="currentColor">
                                <rect
                                    x="2.5"
                                    y="1.5"
                                    width="3.2"
                                    height="11"
                                    rx="1"
                                />
                                <rect
                                    x="8.3"
                                    y="1.5"
                                    width="3.2"
                                    height="11"
                                    rx="1"
                                />
                            </g>
                        )}
                    </svg>
                </button>
            )}
        </div>
    )
}

LetterBeads.displayName = "Letter Beads"

/* ---------- Property controls ---------- */

const multiWord = (p: Partial<Props>) => /\S\s+\S/.test(p.text ?? DEFAULT_TEXT)

addPropertyControls(LetterBeads, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULT_TEXT,
        description: "Leave empty for a strand of spacer beads only.",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "h4", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "Paragraph"],
        defaultValue: "h2",
        description:
            "For SEO. The text stays readable to search engines and screen readers.",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["wave", "bracelet", "ticker"],
        optionTitles: ["Wave", "Bracelet", "Ticker"],
        displaySegmentedControl: true,
        defaultValue: "wave",
        description:
            "The beads flow along a wave, around a bracelet, or in a straight line.",
    },
    waves: {
        type: ControlType.Number,
        title: "Waves",
        min: 0.5,
        max: 5,
        step: 0.25,
        defaultValue: 1.25,
        description: "How many waves fit across the width.",
        hidden: (p: Partial<Props>) => (p.layout ?? "wave") !== "wave",
    },
    waveHeight: {
        type: ControlType.Number,
        title: "Wave Height",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 0.5,
        description: "In bead sizes. 0 is flat.",
        hidden: (p: Partial<Props>) => (p.layout ?? "wave") !== "wave",
    },
    wavePhase: {
        type: ControlType.Number,
        title: "Wave Shift",
        min: -180,
        max: 180,
        step: 5,
        unit: "°",
        defaultValue: 0,
        hidden: (p: Partial<Props>) => (p.layout ?? "wave") !== "wave",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 300,
        step: 1,
        unit: "px/s",
        defaultValue: 40,
        description: "0 stops the flow.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "backward"],
        optionTitles: ["Forward", "Backward"],
        displaySegmentedControl: true,
        defaultValue: "forward",
        hidden: (p: Partial<Props>) => p.speed === 0,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (p: Partial<Props>) => p.speed === 0,
    },
    pauseButton: {
        type: ControlType.Enum,
        title: "Pause Button",
        options: ["focus", "always"],
        optionTitles: ["On Focus", "Always"],
        displaySegmentedControl: true,
        defaultValue: "focus",
        description:
            "A pause/play button for keyboard and screen reader users. On Focus shows it when reached with the Tab key.",
        hidden: (p: Partial<Props>) => p.speed === 0,
    },
    palette: {
        type: ControlType.Enum,
        title: "Palette",
        options: ["rainbow", "classic", "pastel", "custom"],
        optionTitles: ["Rainbow Letters", "Classic", "Pastel", "Custom"],
        defaultValue: "rainbow",
    },
    letterBg: {
        type: ControlType.Color,
        title: "Bead",
        defaultValue: "#FBFAF6",
        hidden: (p: Partial<Props>) => p.palette !== "custom",
    },
    letterText: {
        type: ControlType.Color,
        title: "Letter",
        defaultValue: "#1D1D1F",
        hidden: (p: Partial<Props>) => p.palette !== "custom",
    },
    spacerColor: {
        type: ControlType.Color,
        title: "Spacer",
        defaultValue: "#FF5FA2",
        hidden: (p: Partial<Props>) => p.palette !== "custom",
    },
    spacerStyle: {
        type: ControlType.Enum,
        title: "Spacers",
        options: ["symbols", "mixed", "round", "pearl"],
        optionTitles: ["Symbol Beads", "Mix", "Round", "Pearl"],
        defaultValue: "symbols",
        description:
            "Symbol Beads have stars, hearts, moons and flowers. Mix combines them with round and pearl beads.",
    },
    spacerPattern: {
        type: ControlType.Enum,
        title: "Spacers Go",
        options: ["words", "letters", "none"],
        optionTitles: ["Between Words", "Between Letters", "Nowhere"],
        defaultValue: "words",
        hidden: (p: Partial<Props>) => !(p.text ?? DEFAULT_TEXT).trim(),
    },
    spacerCount: {
        type: ControlType.Number,
        title: "Per Gap",
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        defaultValue: 2,
        description: "Spacer beads between words.",
        hidden: (p: Partial<Props>) =>
            (p.spacerPattern ?? "words") !== "words" || !multiWord(p),
    },
    repeatGap: {
        type: ControlType.Number,
        title: "Between Repeats",
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
        description: "Spacer beads before the text repeats.",
        hidden: (p: Partial<Props>) =>
            p.layout === "bracelet" || !(p.text ?? DEFAULT_TEXT).trim(),
    },
    showCord: {
        type: ControlType.Boolean,
        title: "Cord",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cordColor: {
        type: ControlType.Color,
        title: "Cord Color",
        defaultValue: "#E8DCCB",
        hidden: (p: Partial<Props>) => p.showCord === false,
    },
    beadSize: {
        type: ControlType.Number,
        title: "Bead Size",
        min: 16,
        max: 160,
        unit: "px",
        defaultValue: 56,
    },
    typeface: {
        type: ControlType.Enum,
        title: "Typeface",
        options: ["classic", "custom"],
        optionTitles: ["Classic", "Custom"],
        displaySegmentedControl: true,
        defaultValue: "classic",
        description:
            "Classic uses a built-in rounded face (Nunito), like real alphabet beads.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        hidden: (p: Partial<Props>) => p.typeface !== "custom",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    hover: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["rotate", "none"],
        optionTitles: ["Rotate", "None"],
        displaySegmentedControl: true,
        defaultValue: "rotate",
        description:
            "Rotate gives each bead the cursor touches a little twist. Decorative only.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 0,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["enter", "load"],
        optionTitles: ["In View", "On Load"],
        displaySegmentedControl: true,
        defaultValue: "enter",
    },
    once: {
        type: ControlType.Boolean,
        title: "Play Once",
        defaultValue: true,
        hidden: (p: Partial<Props>) => p.trigger !== "enter",
    },
})
