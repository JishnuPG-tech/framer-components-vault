// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useReducedMotion,
    useScroll,
} from "framer-motion"
import type { MotionValue } from "framer-motion"
import { useEffect, useId, useMemo, useRef, useState } from "react"

/**
 * PATH STEPS
 * A responsive process / journey section. Step cards are laid out in a
 * serpentine (boustrophedon) grid, the cards are measured after layout, and a
 * connector is generated from their real edges, then drawn as the visitor
 * scrolls.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */

/* ============================================================================
 * MATH:START  (pure helpers — extracted verbatim by the unit-test harness)
 * ========================================================================= */

type Pt = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number }
type Seg = { a: Pt; b: Pt }

function clampNum(n: unknown, min: number, max: number, fallback: number) {
    const v = typeof n === "number" && Number.isFinite(n) ? n : fallback
    if (min > max) return min
    return Math.min(max, Math.max(min, v))
}

/**
 * Parse a CSS colour and return it with the given alpha applied.
 * Never string-concatenates alpha (see marketplace review note RF-002):
 * ControlType.Color returns rgb(...) or var(--token-…, rgb(...)), not the hex
 * default that was authored. Anything not parsed falls through to color-mix,
 * which preserves Framer colour-token linkage.
 */
function alphaColor(input: unknown, alpha: number): string {
    const a = clampNum(alpha, 0, 1, 1)
    const raw = typeof input === "string" ? input.trim() : ""
    if (!raw) return "transparent"
    if (a >= 1) return raw
    if (a <= 0) return "transparent"

    // #rgb / #rgba / #rrggbb / #rrggbbaa
    const hex = /^#([0-9a-f]{3,8})$/i.exec(raw)
    if (hex) {
        const h = hex[1]
        let r = 0
        let g = 0
        let b = 0
        let baseA = 1
        if (h.length === 3 || h.length === 4) {
            r = parseInt(h[0] + h[0], 16)
            g = parseInt(h[1] + h[1], 16)
            b = parseInt(h[2] + h[2], 16)
            if (h.length === 4) baseA = parseInt(h[3] + h[3], 16) / 255
        } else if (h.length === 6 || h.length === 8) {
            r = parseInt(h.slice(0, 2), 16)
            g = parseInt(h.slice(2, 4), 16)
            b = parseInt(h.slice(4, 6), 16)
            if (h.length === 8) baseA = parseInt(h.slice(6, 8), 16) / 255
        } else {
            return `color-mix(in srgb, ${raw} ${Math.round(a * 100)}%, transparent)`
        }
        const out = Math.round(baseA * a * 1000) / 1000
        return `rgba(${r}, ${g}, ${b}, ${out})`
    }

    // rgb()/rgba()/hsl()/hsla(), comma or space syntax, optional existing alpha
    const fn = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(raw)
    if (fn) {
        const kind = fn[1].toLowerCase().replace(/a$/, "")
        const body = fn[2].replace(/\//g, " ").replace(/,/g, " ").trim()
        const parts = body.split(/\s+/).filter(Boolean)
        if (parts.length >= 3) {
            const [p1, p2, p3] = parts
            let baseA = 1
            if (parts.length >= 4) {
                const p4 = parts[3]
                const n = parseFloat(p4)
                if (Number.isFinite(n)) baseA = p4.endsWith("%") ? n / 100 : n
            }
            const out = Math.round(clampNum(baseA, 0, 1, 1) * a * 1000) / 1000
            return `${kind}a(${p1}, ${p2}, ${p3}, ${out})`
        }
    }

    // var(--token-…), oklch(), lab(), named colours, etc.
    return `color-mix(in srgb, ${raw} ${Math.round(a * 100)}%, transparent)`
}

/** Grid slot for a step in a serpentine layout (row 0 L→R, row 1 R→L, …). */
function slotFor(index: number, cols: number): { row: number; col: number } {
    const c = Math.max(1, Math.floor(cols))
    const i = Math.max(0, Math.floor(index))
    const row = Math.floor(i / c)
    const within = i % c
    const col = row % 2 === 0 ? within : c - 1 - within
    return { row, col }
}

/** First and last occupied visual column of a serpentine row. */
function rowSpan(
    row: number,
    cols: number,
    count: number
): { startCol: number; endCol: number; items: number } {
    const c = Math.max(1, Math.floor(cols))
    const n = Math.max(0, Math.floor(count))
    const items = Math.max(0, Math.min(c, n - row * c))
    if (items <= 0) return { startCol: 0, endCol: 0, items: 0 }
    if (row % 2 === 0) return { startCol: 0, endCol: items - 1, items }
    return { startCol: c - 1, endCol: c - items, items }
}

/** Drop consecutive duplicate points (sub-pixel tolerance). */
function dedupe(points: Pt[]): Pt[] {
    const out: Pt[] = []
    for (const p of points) {
        const last = out[out.length - 1]
        if (
            !last ||
            Math.abs(last.x - p.x) > 0.01 ||
            Math.abs(last.y - p.y) > 0.01
        ) {
            out.push(p)
        }
    }
    return out
}

/**
 * ROUTE "between" — the default.
 *
 * One connector per consecutive pair of steps, living entirely in the gutter
 * between them so that 100% of the stroke is visible. Two cases only:
 *
 *   • same row      → horizontal, card edge to card edge, at the shared centre y
 *   • row change    → vertical, bottom edge to top edge, at the shared centre x
 *
 * There is no third case, because serpentine ordering guarantees that the last
 * card of a row and the first card of the next sit in the same column.
 */
function buildConnectors(rects: Rect[], cols: number): Seg[] {
    const c = Math.max(1, Math.floor(cols))
    const out: Seg[] = []
    const ok = (r: Rect | undefined): r is Rect =>
        !!r &&
        Number.isFinite(r.x) &&
        Number.isFinite(r.y) &&
        Number.isFinite(r.w) &&
        Number.isFinite(r.h)

    for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i]
        const b = rects[i + 1]
        if (!ok(a) || !ok(b)) continue
        const sa = slotFor(i, c)
        const sb = slotFor(i + 1, c)

        if (sa.row === sb.row) {
            // rows are stretched to equal height, so both centres share a y
            const y = (a.y + a.h / 2 + (b.y + b.h / 2)) / 2
            const leftToRight = sb.col > sa.col
            const ax = leftToRight ? a.x + a.w : a.x
            const bx = leftToRight ? b.x : b.x + b.w
            if (Math.abs(bx - ax) < 0.5) continue
            out.push({ a: { x: ax, y }, b: { x: bx, y } })
        } else {
            // same column, so the drop is exactly vertical
            const x = (a.x + a.w / 2 + (b.x + b.w / 2)) / 2
            const ay = a.y + a.h
            const by = b.y
            if (by - ay < 0.5) continue
            out.push({ a: { x, y: ay }, b: { x, y: by } })
        }
    }
    return out
}

/**
 * ROUTE "behind" — optional.
 *
 * A single continuous polyline running along each row's centre line and
 * dropping between rows. Visually subtler: it passes behind the cards, so only
 * the gutter portions are seen.
 */
function buildRailPoints(
    count: number,
    cols: number,
    colCenters: number[],
    rowCenters: number[]
): Pt[] {
    const c = Math.max(1, Math.floor(cols))
    const n = Math.max(0, Math.floor(count))
    if (n < 1 || colCenters.length < 1 || rowCenters.length < 1) return []
    const rows = Math.ceil(n / c)
    const pts: Pt[] = []
    for (let r = 0; r < rows; r++) {
        const y = rowCenters[r]
        if (typeof y !== "number" || !Number.isFinite(y)) continue
        const { startCol, endCol, items } = rowSpan(r, c, n)
        if (items <= 0) continue
        const xs = colCenters[startCol]
        const xe = colCenters[endCol]
        if (!Number.isFinite(xs) || !Number.isFinite(xe)) continue
        pts.push({ x: xs, y })
        pts.push({ x: xe, y })
    }
    return dedupe(pts)
}

/** SVG path through a polyline with rounded corners, radius clamped per joint. */
function roundedPath(points: Pt[], radius: number): string {
    const pts = dedupe(points)
    if (pts.length < 2) return ""
    const r = clampNum(radius, 0, 400, 0)
    const fmt = (n: number) => Math.round(n * 100) / 100
    if (pts.length === 2 || r <= 0) {
        let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`
        for (let i = 1; i < pts.length; i++)
            d += ` L ${fmt(pts[i].x)} ${fmt(pts[i].y)}`
        return d
    }
    const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)
    const towards = (from: Pt, to: Pt, len: number): Pt => {
        const d = dist(from, to)
        if (d === 0) return { x: from.x, y: from.y }
        const t = Math.min(1, len / d)
        return {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
        }
    }
    let d = `M ${fmt(pts[0].x)} ${fmt(pts[0].y)}`
    for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1]
        const cur = pts[i]
        const next = pts[i + 1]
        const p1 = towards(cur, prev, Math.min(r, dist(prev, cur) / 2))
        const p2 = towards(cur, next, Math.min(r, dist(cur, next) / 2))
        d += ` L ${fmt(p1.x)} ${fmt(p1.y)} Q ${fmt(cur.x)} ${fmt(cur.y)} ${fmt(p2.x)} ${fmt(p2.y)}`
    }
    const last = pts[pts.length - 1]
    d += ` L ${fmt(last.x)} ${fmt(last.y)}`
    return d
}

/**
 * Turn connectors into one path string.
 *
 * Arrowheads are emitted as path geometry rather than SVG <marker> elements, on
 * purpose: a marker renders as soon as the element exists, so arrows would pop
 * in before the line reached them. Built into the path, each head is drawn at
 * exactly the moment the stroke arrives, and no <defs> id is needed.
 */
function connectorsPath(segments: Seg[], arrowSize: number): string {
    const size = clampNum(arrowSize, 0, 40, 0)
    const fmt = (n: number) => Math.round(n * 100) / 100
    let d = ""
    for (const s of segments) {
        const dx = s.b.x - s.a.x
        const dy = s.b.y - s.a.y
        const len = Math.hypot(dx, dy)
        if (!Number.isFinite(len) || len < 0.5) continue
        d += `${d ? " " : ""}M ${fmt(s.a.x)} ${fmt(s.a.y)} L ${fmt(s.b.x)} ${fmt(s.b.y)}`
        if (size <= 0) continue
        // never let the head be longer than the connector it sits on
        const h = Math.min(size, len * 0.9)
        const ux = dx / len
        const uy = dy / len
        const px = -uy
        const py = ux
        const bx = s.b.x - ux * h
        const by = s.b.y - uy * h
        const w = h * 0.55
        d += ` M ${fmt(bx + px * w)} ${fmt(by + py * w)} L ${fmt(s.b.x)} ${fmt(s.b.y)} L ${fmt(bx - px * w)} ${fmt(by - py * w)}`
    }
    return d
}

/** Container-width driven column count. Never viewport-driven. */
function columnsFor(
    width: number,
    desired: number,
    mobileMax: number,
    tabletMax: number
): number {
    const d = clampNum(desired, 1, 4, 3)
    const w = clampNum(width, 0, 100000, 0)
    const mob = clampNum(mobileMax, 200, 2000, 520)
    const tab = clampNum(tabletMax, mob + 1, 4000, 780)
    if (w <= 0) return d
    if (w < mob) return 1
    if (w < tab) return Math.min(2, d)
    return d
}

/* ============================================================================
 * MATH:END
 * ========================================================================= */

type Step = {
    label?: string
    title?: string
    description?: string
    icon?: string
    linkUrl?: string
    linkLabel?: string
}

type Props = {
    steps?: Step[]
    columns?: number
    gap?: number
    maxWidth?: number
    mobileBreakpoint?: number
    tabletBreakpoint?: number
    textAlign?: "left" | "center"
    cardMinHeight?: number
    cardPadding?: number
    cardRadius?: number
    cardFill?: string
    cardBorder?: boolean
    cardBorderColor?: string
    cardShadow?: boolean
    accent?: string
    titleColor?: string
    bodyColor?: string
    titleFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    badgeStyle?: "float" | "inside" | "none"
    badgeFill?: string
    badgeText?: string
    descriptionLines?: number
    showIcon?: boolean
    iconSize?: number
    railRoute?: "between" | "behind"
    railArrows?: boolean
    arrowSize?: number
    railWidth?: number
    railTrackColor?: string
    railTrackOpacity?: number
    railColor?: string
    railCorner?: number
    railDashed?: boolean
    railCap?: "round" | "butt" | "square"
    animate?: boolean
    scrollStart?: number
    scrollEnd?: number
    revealCards?: boolean
    revealDuration?: number
    revealStagger?: number
    revealDistance?: number
    hoverLift?: boolean
    style?: React.CSSProperties
}

const DEFAULT_STEPS: Step[] = [
    {
        label: "",
        title: "Discovery",
        description:
            "We map the problem, the audience and the constraints before a single screen is drawn.",
        linkUrl: "",
        linkLabel: "",
    },
    {
        label: "",
        title: "Design",
        description:
            "Wireframes turn into a system: type, colour, spacing and every interactive state.",
        linkUrl: "",
        linkLabel: "",
    },
    {
        label: "",
        title: "Build",
        description:
            "The design ships as a responsive site, component by component, reviewed as we go.",
        linkUrl: "",
        linkLabel: "",
    },
    {
        label: "",
        title: "Launch",
        description:
            "Performance, SEO and analytics are checked, then we go live and keep iterating.",
        linkUrl: "",
        linkLabel: "",
    },
]

/* ---------------------------------------------------------------- step card */

function StepCard(props: {
    step: Step
    index: number
    setRef: (el: HTMLLIElement | null) => void
    p: Props
    noMotion: boolean
    gridColumn: number
    gridRow: number
    uid: string
}) {
    const { step, index, setRef, p, noMotion, gridColumn, gridRow, uid } = props

    const align = p.textAlign === "center" ? "center" : "left"
    const badge = (step.label && step.label.trim()) || String(index + 1)
    const lines = clampNum(p.descriptionLines, 0, 12, 0)
    const pad = clampNum(p.cardPadding, 0, 96, 28)
    const radius = clampNum(p.cardRadius, 0, 80, 20)
    const iconSize = clampNum(p.iconSize, 12, 160, 40)
    const accent = p.accent || "rgb(88, 101, 242)"

    // Cards reveal on their own viewport entry, NOT on rail progress. Tying
    // them to progress meant the last card (threshold 1.0) never appeared when
    // the section sat near the bottom of a page and progress topped out early.
    const reveal = !noMotion && p.revealCards !== false
    const distance = clampNum(p.revealDistance, 0, 160, 24)
    const stagger = clampNum(p.revealStagger, 0, 0.4, 0.08)
    const duration = clampNum(p.revealDuration, 0.1, 2, 0.55)

    const motionProps = reveal
        ? {
              initial: { opacity: 0, y: distance },
              whileInView: { opacity: 1, y: 0 },
              viewport: {
                  once: true,
                  amount: 0.25 as const,
                  margin: "0px 0px -8% 0px",
              },
              transition: {
                  duration,
                  delay: Math.min(index * stagger, 1.2),
                  ease: [0.22, 1, 0.36, 1] as const,
              },
          }
        : {}

    const badgeNode =
        p.badgeStyle === "none" ? null : (
            <span
                aria-hidden="true"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 36,
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 999,
                    background: p.badgeFill || accent,
                    color: p.badgeText || "rgb(255, 255, 255)",
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1,
                    letterSpacing: "0.01em",
                    flex: "none",
                    boxShadow:
                        p.badgeStyle === "float"
                            ? `0 0 0 6px ${p.cardFill || "rgb(255, 255, 255)"}`
                            : "none",
                }}
            >
                {badge}
            </span>
        )

    return (
        <motion.li
            ref={setRef}
            {...motionProps}
            style={{
                gridColumn,
                gridRow,
                zIndex: 1,
                position: "relative",
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: align === "center" ? "center" : "flex-start",
                textAlign: align,
                gap: 12,
                padding: pad,
                paddingTop: p.badgeStyle === "float" ? pad + 12 : pad,
                minHeight: clampNum(p.cardMinHeight, 0, 800, 0) || undefined,
                borderRadius: radius,
                background: p.cardFill || "rgb(255, 255, 255)",
                border: p.cardBorder
                    ? `1px solid ${p.cardBorderColor || "rgba(15, 23, 42, 0.08)"}`
                    : "none",
                boxShadow: p.cardShadow
                    ? `0 1px 2px ${alphaColor("rgb(15, 23, 42)", 0.06)}, 0 12px 32px ${alphaColor("rgb(15, 23, 42)", 0.07)}`
                    : "none",
                boxSizing: "border-box",
                transition:
                    noMotion || !p.hoverLift ? "none" : "translate 220ms ease",
            }}
            onMouseEnter={(e) => {
                if (noMotion || !p.hoverLift) return
                ;(e.currentTarget as HTMLElement).style.translate = "0 -4px"
            }}
            onMouseLeave={(e) => {
                if (noMotion || !p.hoverLift) return
                ;(e.currentTarget as HTMLElement).style.translate = "0 0"
            }}
        >
            {p.badgeStyle === "float" ? (
                <span
                    style={{
                        position: "absolute",
                        top: -18,
                        left: align === "center" ? "50%" : pad,
                        translate: align === "center" ? "-50% 0" : "0 0",
                        display: "inline-flex",
                        zIndex: 2,
                    }}
                >
                    {badgeNode}
                </span>
            ) : null}

            {p.showIcon && step.icon ? (
                <img
                    src={step.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: "contain",
                        display: "block",
                        flex: "none",
                    }}
                />
            ) : null}

            {p.badgeStyle === "inside" ? badgeNode : null}

            {step.title ? (
                <h3
                    style={{
                        margin: 0,
                        color: p.titleColor || "rgb(15, 23, 42)",
                        ...(p.titleFont || {}),
                    }}
                >
                    {step.title}
                </h3>
            ) : null}

            {step.description ? (
                <p
                    style={{
                        margin: 0,
                        color: p.bodyColor || "rgb(71, 85, 105)",
                        ...(p.bodyFont || {}),
                        ...(lines > 0
                            ? {
                                  display: "-webkit-box",
                                  WebkitLineClamp: lines,
                                  WebkitBoxOrient: "vertical" as const,
                                  overflow: "hidden",
                              }
                            : {}),
                        overflowWrap: "anywhere",
                    }}
                >
                    {step.description}
                </p>
            ) : null}

            {step.linkUrl && step.linkLabel ? (
                <a
                    href={step.linkUrl}
                    rel="noopener noreferrer"
                    className={`ps-link-${uid}`}
                    style={{
                        marginTop: 4,
                        color: accent,
                        textDecoration: "none",
                        fontSize: 15,
                        fontWeight: 600,
                        borderRadius: 6,
                        outlineOffset: 3,
                        minHeight: 24,
                        display: "inline-flex",
                        alignItems: "center",
                    }}
                >
                    {step.linkLabel}
                </a>
            ) : null}
        </motion.li>
    )
}

/* -------------------------------------------------------------------- shell */

function StepsShell(
    props: Props & { progress: MotionValue<number>; noMotion: boolean }
) {
    const { progress, noMotion, ...p } = props
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const gridRef = useRef<HTMLOListElement | null>(null)
    const cardEls = useRef<(HTMLLIElement | null)[]>([])
    const [containerW, setContainerW] = useState(0)
    const [geo, setGeo] = useState<{
        w: number
        h: number
        rects: Rect[]
        colCenters: number[]
        rowCenters: number[]
    } | null>(null)

    const steps = Array.isArray(p.steps) && p.steps.length > 0 ? p.steps : []
    const count = steps.length
    const gap = clampNum(p.gap, 0, 160, 48)
    const cols = columnsFor(
        containerW,
        clampNum(p.columns, 1, 4, 3),
        clampNum(p.mobileBreakpoint, 200, 2000, 520),
        clampNum(p.tabletBreakpoint, 300, 4000, 780)
    )

    /* ---- measure container width (container queries, not viewport queries) */
    useEffect(() => {
        const el = gridRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") {
            setContainerW(el.getBoundingClientRect().width)
            return
        }
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width ?? 0
            setContainerW((prev) => (Math.abs(prev - w) > 0.5 ? w : prev))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    /* ---- measure card geometry after layout, then derive the connectors */
    useEffect(() => {
        const grid = gridRef.current
        if (!grid) return
        cardEls.current.length = count
        let frame = 0
        const measure = () => {
            // Layout geometry (offsetLeft/Top/Width/Height), not
            // getBoundingClientRect(). The entrance animation moves cards with
            // Framer Motion's `y`, which is a CSS transform — it changes what
            // getBoundingClientRect() reports without changing layout. Cards
            // stagger in at different delays, so a rect-based measurement taken
            // while some cards are still mid-transform records a mismatched,
            // disconnected-looking connector between them. offsetTop/offsetLeft
            // reflect the settled layout position regardless of transform, so
            // this reads correctly even before the entrance animation finishes.
            // It requires each card's offsetParent to be the grid itself, which
            // holds because the grid is `position: relative` and no positioned
            // element sits between it and its <li> children.
            const rects: Rect[] = []
            const colCenters: number[] = []
            const rowCenters: number[] = []
            for (let i = 0; i < count; i++) {
                const el = cardEls.current[i]
                if (!el) continue
                const rect = {
                    x: el.offsetLeft,
                    y: el.offsetTop,
                    w: el.offsetWidth,
                    h: el.offsetHeight,
                }
                rects[i] = rect
                const { row, col } = slotFor(i, cols)
                if (colCenters[col] === undefined)
                    colCenters[col] = rect.x + rect.w / 2
                if (rowCenters[row] === undefined)
                    rowCenters[row] = rect.y + rect.h / 2
            }
            const next = {
                w: grid.offsetWidth,
                h: grid.offsetHeight,
                rects,
                colCenters,
                rowCenters,
            }
            setGeo((prev) => {
                if (
                    prev &&
                    Math.abs(prev.w - next.w) < 0.5 &&
                    Math.abs(prev.h - next.h) < 0.5 &&
                    prev.rects.length === next.rects.length &&
                    prev.rects.every(
                        (v, i) =>
                            !!next.rects[i] &&
                            Math.abs(v.x - next.rects[i].x) < 0.5 &&
                            Math.abs(v.y - next.rects[i].y) < 0.5 &&
                            Math.abs(v.w - next.rects[i].w) < 0.5 &&
                            Math.abs(v.h - next.rects[i].h) < 0.5
                    )
                ) {
                    return prev
                }
                return next
            })
        }
        frame = requestAnimationFrame(measure)

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                cancelAnimationFrame(frame)
                frame = requestAnimationFrame(measure)
            })
            ro.observe(grid)
            for (let i = 0; i < count; i++) {
                const el = cardEls.current[i]
                if (el) ro.observe(el)
            }
        }
        return () => {
            cancelAnimationFrame(frame)
            if (ro) ro.disconnect()
        }
    }, [
        count,
        cols,
        gap,
        containerW,
        p.cardPadding,
        p.cardMinHeight,
        p.textAlign,
    ])

    const railWidth = clampNum(p.railWidth, 1, 16, 3)
    const between = p.railRoute !== "behind"

    const railD = useMemo(() => {
        if (!geo) return ""
        if (between) {
            const segs = buildConnectors(geo.rects, cols)
            const arrows = p.railArrows !== false
            return connectorsPath(
                segs,
                arrows
                    ? clampNum(p.arrowSize, 0, 40, Math.max(9, railWidth * 3))
                    : 0
            )
        }
        const pts = buildRailPoints(count, cols, geo.colCenters, geo.rowCenters)
        return roundedPath(pts, clampNum(p.railCorner, 0, 200, 40))
    }, [
        geo,
        count,
        cols,
        between,
        p.railArrows,
        p.arrowSize,
        p.railCorner,
        railWidth,
    ])

    const railColor = p.railColor || p.accent || "rgb(88, 101, 242)"
    const trackColor = alphaColor(
        p.railTrackColor || railColor,
        clampNum(p.railTrackOpacity, 0, 1, 0.18)
    )
    const dash = p.railDashed ? `${railWidth * 3} ${railWidth * 3}` : undefined
    const maxW = clampNum(p.maxWidth, 320, 2400, 1200)

    return (
        <div
            style={{
                ...(p.style || {}),
                width: "100%",
                display: "flex",
                justifyContent: "center",
                boxSizing: "border-box",
                // the floating badge overhangs the first row by 18px; reserve it
                // so the component's own box never clips it inside a stack
                paddingTop: p.badgeStyle === "float" ? 22 : 0,
            }}
        >
            <style>{`.ps-link-${uid}:focus-visible{outline:2px solid ${railColor};outline-offset:3px;border-radius:6px}`}</style>
            <div
                style={{ width: "100%", maxWidth: maxW, position: "relative" }}
            >
                {railD ? (
                    <svg
                        aria-hidden="true"
                        focusable="false"
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${Math.max(1, geo?.w ?? 1)} ${Math.max(1, geo?.h ?? 1)}`}
                        preserveAspectRatio="none"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <path
                            d={railD}
                            fill="none"
                            stroke={trackColor}
                            strokeWidth={railWidth}
                            strokeLinecap={p.railCap || "round"}
                            strokeLinejoin="round"
                            strokeDasharray={dash}
                            vectorEffect="non-scaling-stroke"
                        />
                        {noMotion ? (
                            // static renderer / reduced motion / animation off:
                            // a plain, fully stroked path in its settled state
                            <path
                                d={railD}
                                fill="none"
                                stroke={railColor}
                                strokeWidth={railWidth}
                                strokeLinecap={p.railCap || "round"}
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        ) : (
                            <motion.path
                                key={`rail-${uid}`}
                                d={railD}
                                fill="none"
                                stroke={railColor}
                                strokeWidth={railWidth}
                                strokeLinecap={p.railCap || "round"}
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                                style={{ pathLength: progress }}
                            />
                        )}
                    </svg>
                ) : null}

                <ol
                    ref={gridRef}
                    style={{
                        position: "relative",
                        margin: 0,
                        padding: 0,
                        listStyle: "none",
                        display: "grid",
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        alignItems: "stretch",
                        gap,
                        boxSizing: "border-box",
                    }}
                >
                    {steps.map((step, i) => {
                        const { row, col } = slotFor(i, cols)
                        return (
                            <StepCard
                                key={`step-${uid}-${i}`}
                                uid={uid}
                                gridColumn={col + 1}
                                gridRow={row + 1}
                                step={step || {}}
                                index={i}
                                setRef={(el) => {
                                    cardEls.current[i] = el
                                }}
                                p={p}
                                noMotion={noMotion}
                            />
                        )
                    })}
                </ol>
            </div>
        </div>
    )
}

/* --------------------------------------------------------------- animated  */

function StepsAnimated(props: Props & { noMotion: false }) {
    const ref = useRef<HTMLDivElement | null>(null)
    const start = clampNum(props.scrollStart, 0, 1, 0.9)
    const end = clampNum(props.scrollEnd, 0, 1, 0.55)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`start ${start}`, `end ${end}`] as any,
    })
    return (
        <div ref={ref} style={{ width: "100%" }}>
            <StepsShell
                {...props}
                progress={scrollYProgress}
                noMotion={false}
            />
        </div>
    )
}

function StepsStatic(props: Props) {
    const full = useMotionValue(1)
    return <StepsShell {...props} progress={full} noMotion={true} />
}

/* ------------------------------------------------------------------- entry */

export default function PathSteps({
    steps = DEFAULT_STEPS,
    columns = 3,
    gap = 48,
    maxWidth = 1200,
    mobileBreakpoint = 520,
    tabletBreakpoint = 780,
    textAlign = "left",
    cardMinHeight = 0,
    cardPadding = 28,
    cardRadius = 20,
    cardFill = "rgb(255, 255, 255)",
    cardBorder = true,
    cardBorderColor = "rgba(15, 23, 42, 0.08)",
    cardShadow = true,
    accent = "rgb(88, 101, 242)",
    titleColor = "rgb(15, 23, 42)",
    bodyColor = "rgb(71, 85, 105)",
    titleFont = {
        fontSize: 20,
        lineHeight: "1.3em",
        fontWeight: 600,
        letterSpacing: "-0.01em",
    },
    bodyFont = { fontSize: 15, lineHeight: "1.55em", fontWeight: 400 },
    badgeStyle = "float",
    badgeFill = "rgb(88, 101, 242)",
    badgeText = "rgb(255, 255, 255)",
    descriptionLines = 0,
    showIcon = false,
    iconSize = 40,
    railRoute = "between",
    railArrows = true,
    arrowSize = 10,
    railWidth = 3,
    railTrackColor = "rgb(88, 101, 242)",
    railTrackOpacity = 0.18,
    railColor = "rgb(88, 101, 242)",
    railCorner = 40,
    railDashed = false,
    railCap = "round",
    animate = true,
    scrollStart = 0.9,
    scrollEnd = 0.55,
    revealCards = true,
    revealDuration = 0.55,
    revealStagger = 0.08,
    revealDistance = 24,
    hoverLift = true,
    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const noMotion = isStatic || prefersReduced === true || animate === false

    const resolved: Props = {
        steps,
        columns,
        gap,
        maxWidth,
        mobileBreakpoint,
        tabletBreakpoint,
        textAlign,
        cardMinHeight,
        cardPadding,
        cardRadius,
        cardFill,
        cardBorder,
        cardBorderColor,
        cardShadow,
        accent,
        titleColor,
        bodyColor,
        titleFont,
        bodyFont,
        badgeStyle,
        badgeFill,
        badgeText,
        descriptionLines,
        showIcon,
        iconSize,
        railRoute,
        railArrows,
        arrowSize,
        railWidth,
        railTrackColor,
        railTrackOpacity,
        railColor,
        railCorner,
        railDashed,
        railCap,
        animate,
        scrollStart,
        scrollEnd,
        revealCards,
        revealDuration,
        revealStagger,
        revealDistance,
        hoverLift,
        style,
    }

    if (noMotion) return <StepsStatic {...resolved} />
    return <StepsAnimated {...resolved} noMotion={false} />
}

addPropertyControls(PathSteps, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        defaultValue: DEFAULT_STEPS,
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Badge",
                    defaultValue: "",
                    placeholder: "Auto number",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Step title",
                },
                description: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue: "Describe what happens in this step.",
                },
                icon: { type: ControlType.Image, title: "Icon" },
                linkUrl: { type: ControlType.Link, title: "Link" },
                linkLabel: {
                    type: ControlType.String,
                    title: "Link text",
                    defaultValue: "",
                },
            },
        },
    },

    /* layout */
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
        description: "Desktop columns. Tablet caps at 2, mobile stacks to 1.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 48,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        description: "The connectors live in this gap, so give them room.",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max width",
        defaultValue: 1200,
        min: 320,
        max: 2400,
        step: 10,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Stack below",
        defaultValue: 520,
        min: 200,
        max: 2000,
        step: 10,
        unit: "px",
        description: "Measured on the component, not the viewport.",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "2 cols below",
        defaultValue: 780,
        min: 300,
        max: 4000,
        step: 10,
        unit: "px",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        displaySegmentedControl: true,
    },

    /* rail */
    railRoute: {
        type: ControlType.Enum,
        title: "Connector",
        defaultValue: "between",
        options: ["between", "behind"],
        optionTitles: ["Between", "Behind"],
        displaySegmentedControl: true,
        description:
            "Between: fully visible links in the gaps. Behind: one continuous line passing under the cards.",
    },
    railArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.railRoute === "behind",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow size",
        defaultValue: 10,
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p) => p.railRoute === "behind" || p.railArrows === false,
    },
    railColor: {
        type: ControlType.Color,
        title: "Rail",
        defaultValue: "rgb(88, 101, 242)",
    },
    railTrackColor: {
        type: ControlType.Color,
        title: "Rail track",
        defaultValue: "rgb(88, 101, 242)",
    },
    railTrackOpacity: {
        type: ControlType.Number,
        title: "Track fade",
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
    },
    railWidth: {
        type: ControlType.Number,
        title: "Rail width",
        defaultValue: 3,
        min: 1,
        max: 16,
        step: 1,
        unit: "px",
    },
    railCorner: {
        type: ControlType.Number,
        title: "Rail corner",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p) => p.railRoute !== "behind",
    },
    railDashed: {
        type: ControlType.Boolean,
        title: "Dashed track",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Dashes the unfilled track. The drawn line stays solid.",
    },
    railCap: {
        type: ControlType.Enum,
        title: "Cap",
        defaultValue: "round",
        options: ["round", "butt", "square"],
        optionTitles: ["Round", "Flat", "Square"],
    },

    /* card */
    cardMinHeight: {
        type: ControlType.Number,
        title: "Min height",
        defaultValue: 0,
        min: 0,
        max: 800,
        step: 4,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 28,
        min: 0,
        max: 96,
        step: 1,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    cardFill: {
        type: ControlType.Color,
        title: "Card fill",
        defaultValue: "rgb(255, 255, 255)",
    },
    cardBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(15, 23, 42, 0.08)",
        hidden: (p) => p.cardBorder === false,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    /* type + colour */
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "rgb(88, 101, 242)",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            lineHeight: "1.3em",
            fontWeight: 600,
            letterSpacing: "-0.01em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title fill",
        defaultValue: "rgb(15, 23, 42)",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Text",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: "1.55em", fontWeight: 400 },
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Text fill",
        defaultValue: "rgb(71, 85, 105)",
    },
    descriptionLines: {
        type: ControlType.Number,
        title: "Clamp lines",
        defaultValue: 0,
        min: 0,
        max: 12,
        step: 1,
        displayStepper: true,
        description: "0 shows the full text.",
    },

    /* badge + icon */
    badgeStyle: {
        type: ControlType.Enum,
        title: "Badge",
        defaultValue: "float",
        options: ["float", "inside", "none"],
        optionTitles: ["Float", "Inside", "None"],
        displaySegmentedControl: true,
    },
    badgeFill: {
        type: ControlType.Color,
        title: "Badge fill",
        defaultValue: "rgb(88, 101, 242)",
        hidden: (p) => p.badgeStyle === "none",
    },
    badgeText: {
        type: ControlType.Color,
        title: "Badge text",
        defaultValue: "rgb(255, 255, 255)",
        hidden: (p) => p.badgeStyle === "none",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Icons",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon size",
        defaultValue: 40,
        min: 12,
        max: 160,
        step: 1,
        unit: "px",
        hidden: (p) => p.showIcon === false,
    },

    /* motion */
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Off, on the canvas, and under reduced motion everything renders in its finished state.",
    },
    scrollStart: {
        type: ControlType.Number,
        title: "Draw from",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => p.animate === false,
        description:
            "Viewport position where the rail starts drawing (1 = bottom).",
    },
    scrollEnd: {
        type: ControlType.Number,
        title: "Draw to",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => p.animate === false,
    },
    revealCards: {
        type: ControlType.Boolean,
        title: "Reveal cards",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.animate === false,
        description:
            "Cards fade in on their own viewport entry and stay visible.",
    },
    revealDuration: {
        type: ControlType.Number,
        title: "Reveal time",
        defaultValue: 0.55,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        hidden: (p) => p.animate === false || p.revealCards === false,
    },
    revealStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.01,
        unit: "s",
        hidden: (p) => p.animate === false || p.revealCards === false,
    },
    revealDistance: {
        type: ControlType.Number,
        title: "Reveal shift",
        defaultValue: 24,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        hidden: (p) => p.animate === false || p.revealCards === false,
    },
    hoverLift: {
        type: ControlType.Boolean,
        title: "Hover lift",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
