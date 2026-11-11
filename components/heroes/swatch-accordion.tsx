import * as React from "react"
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

/* ------------------------------------------------------------------ types */

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface Item {
    title?: string
    description?: string
    tags?: string
    image?: ImageValue
    color?: string
    focus?: number
    button?: string
    link?: string
    newTab?: boolean
}

// same shape as Framer's native Border control value
interface BorderValue {
    borderWidth?: number
    borderTopWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
    borderLeftWidth?: number
    borderStyle?: "solid" | "dashed" | "dotted" | "double"
    borderColor?: string
}

interface SwatchAccordionProps {
    items: Item[]
    openItem: number
    trigger: "hover" | "click"
    stripLink: boolean
    autoplay: boolean
    interval: number
    direction: "auto" | "horizontal" | "vertical"
    stripWidth: number
    barHeight: number
    narrowLayout: "image" | "full"
    numbers: boolean
    scrim: boolean
    stripBorder: BorderValue | null
    titleTag: "h2" | "h3" | "h4" | "p"
    titleFont: React.CSSProperties
    stripFont: React.CSSProperties
    bodyFont: React.CSSProperties
    labelFont: React.CSSProperties
    textColor: string
    buttonColor: string
    buttonTextColor: string
    buttonRadius: string | number
    buttonBorder: BorderValue | null
    plusRadius: string | number
    plusBorder: BorderValue | null
    tagRadius: string | number
    tagBorder: BorderValue | null
    padding: string | number
    gap: string | number
    radius: string | number
    transition: any
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ defaults */

// the original glass edges; the button had no border
const STRIP_BORDER: BorderValue = { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.28)" }
const PLUS_BORDER: BorderValue = { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.72)" }
const TAG_BORDER: BorderValue = { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.66)" }
const BUTTON_BORDER: BorderValue = { borderWidth: 0, borderStyle: "solid", borderColor: "rgb(20, 20, 20)" }

const CREDIT =
    "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"

// Default imagery: paper sculpture series by Pawel Czerwinski (Unsplash License), colour graded and mirrored.
const DEFAULT_IMAGES: ImageValue[] = [
    {
        src: "https://framerusercontent.com/images/W1vHh9m78CQqEck7nFU4aEdqsWw.jpg",
        alt: "Pistachio green paper sculpture of layered curved sheets with deep green shadows",
    },
    {
        src: "https://framerusercontent.com/images/KZzoIZZFWmevQrxW20QNfraoSxQ.jpg",
        alt: "Rose pink paper sculpture of layered petals with raspberry shadows",
    },
    {
        src: "https://framerusercontent.com/images/UOfiwX1MqEHC0FC9UNmOF30LY.jpg",
        alt: "Periwinkle paper sheets flowing in waves with deep cobalt shadows",
    },
    {
        src: "https://framerusercontent.com/images/55pg3RZwwb6bZpDnzTRmAEHvhPA.jpg",
        alt: "Stacked aqua paper layers rippling with deep teal shadows",
    },
    {
        src: "https://framerusercontent.com/images/d5EaywqblJ9eH7URTE5IBMBX73g.jpg",
        alt: "Apricot paper fan sculpture of layered sheets with burnt orange shadows",
    },
]

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Strategy",
        description:
            "We start with listening. Research, positioning and a clear plan, so every next decision has a reason.",
        tags: "Research, Positioning, Roadmap",
        color: "#A9C670",
        focus: 50,
        button: "Explore strategy",
        link: "",
        newTab: false,
    },
    {
        title: "Identity",
        description:
            "A brand that feels like you. Logo, type, colour and tone, built as one calm and recognisable system.",
        tags: "Logo, Typography, Guidelines",
        color: "#F7A6AD",
        focus: 78,
        button: "Explore identity",
        link: "",
        newTab: false,
    },
    {
        title: "Digital",
        description:
            "Websites and products that feel effortless. Designed in the browser, tested on every screen.",
        tags: "UX/UI, Framer, Development",
        color: "#B8B8FE",
        focus: 70,
        button: "Explore digital",
        link: "",
        newTab: false,
    },
    {
        title: "Motion",
        description:
            "Small details, lasting impressions. Motion that guides attention and gives your brand its rhythm.",
        tags: "Animation, Interaction, Prototyping",
        color: "#5ACAB9",
        focus: 80,
        button: "Explore motion",
        link: "",
        newTab: false,
    },
    {
        title: "Growth",
        description:
            "Launch is the beginning. We measure, learn and refine, so your product keeps getting better.",
        tags: "Analytics, SEO, Iteration",
        color: "#EDB47B",
        focus: 72,
        button: "Explore growth",
        link: "",
        newTab: false,
    },
]

/* ------------------------------------------------------------------ helpers */

function hasLink(link: string | undefined) {
    return typeof link === "string" && link.trim().length > 0
}

function borderPx(v: unknown): string | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return `${Math.max(0, v)}px`
    if (typeof v === "string" && v.trim()) return /^\d*\.?\d+$/.test(v.trim()) ? `${v.trim()}px` : v.trim()
    return undefined
}

// compares colours however Framer writes them (#141414, rgb(20, 20, 20), rgba(20,20,20,1))
function colorKey(c: unknown) {
    const s = String(c || "").trim().toLowerCase()
    let m = s.match(/^#([0-9a-f]{3,8})$/)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
        return [n(0), n(2), n(4), h.length === 8 ? Math.round((n(6) / 255) * 100) / 100 : 1].join(",")
    }
    m = s.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
        return [p[0], p[1], p[2], p.length > 3 ? Math.round(p[3] * 100) / 100 : 1].join(",")
    }
    return s.replace(/\s+/g, "")
}

/**
 * Reads a native Border value (one width or one per side, style, colour).
 * `isDefault` stays true while it still matches the original edge, so the original look is kept exactly;
 * once changed, exactly the chosen border is drawn.
 */
function readBorder(value: BorderValue | null | undefined, fallback: BorderValue) {
    const v: BorderValue = value === null ? { borderWidth:0, borderColor:"transparent" } : value && typeof value === "object" ? value : fallback
    const all = borderPx(v.borderWidth)
    const sides = [v.borderTopWidth, v.borderRightWidth, v.borderBottomWidth, v.borderLeftWidth].map(
        (side) => borderPx(side) ?? all ?? "0px"
    )
    const style = v.borderStyle || "solid"
    const color = v.borderColor || fallback.borderColor || "transparent"
    const base = borderPx(fallback.borderWidth) || "0px"
    const isDefault =
        sides.every((side) => side === base) &&
        style === (fallback.borderStyle || "solid") &&
        colorKey(color) === colorKey(fallback.borderColor)
    return { isDefault, sides, width: sides.join(" "), style, color }
}

function pad2(n: number) {
    return n < 9 ? `0${n + 1}` : `${n + 1}`
}

function cssLength(value: unknown, fallback: string) {
    if (typeof value === "number") return Number.isFinite(value) ? `${Math.max(0, value)}px` : fallback
    const text = typeof value === "string" ? value.trim() : ""
    return !text ? fallback : /^\d*\.?\d+$/.test(text) ? `${text}px` : text
}

function nativeRadius(value: unknown, fallback = "999px") {
    return cssLength(value, fallback)
}

function parseBox(value: string | number | undefined, fallback: string) {
    const parts = String(value === undefined || value === null || value === "" ? fallback : value)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(part => cssLength(part, fallback))
    const [t, r = t, b = t, l = r] = parts.length ? parts : [fallback]
    return { t, r, b, l }
}

function splitFont(font: React.CSSProperties | undefined, fallbackSize: string) {
    const { fontSize, ...rest } = (font || {}) as any
    const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize || fallbackSize
    return { size: size as string, rest: rest as React.CSSProperties }
}

const NAMED_EASE: Record<string, string> = {
    linear: "linear",
    easeIn: "cubic-bezier(0.42, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.58, 1)",
    easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
    circIn: "cubic-bezier(0.55, 0, 1, 0.45)",
    circOut: "cubic-bezier(0, 0.55, 0.45, 1)",
    circInOut: "cubic-bezier(0.85, 0, 0.15, 1)",
    backIn: "cubic-bezier(0.31, 0.01, 0.66, -0.59)",
    backOut: "cubic-bezier(0.33, 1.53, 0.69, 0.99)",
    backInOut: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
}

const FALLBACK_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

/** Converts a Framer transition (spring or tween) into CSS timing values. */
function seconds(value: unknown, fallback: number) {
    if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : fallback
    const match = typeof value === "string" ? value.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*(ms|s)?$/i) : null
    return match ? Math.max(0, Number(match[1]) / (match[2]?.toLowerCase() === "ms" ? 1000 : 1)) : fallback
}

function toCssTransition(t: any) {
    const delay = seconds(t?.delay, 0)
    if (t === false || t?.type === false || t?.type === "instant") return { ease:"linear", fallback:"linear", duration:0, delay:t === false ? 0 : delay }
    if (t && t.type && t.type !== "spring") {
        const ease = Array.isArray(t.ease) && t.ease.length === 4
            ? `cubic-bezier(${t.ease.map((v: number) => Number(v) || 0).join(", ")})`
            : NAMED_EASE[t.ease as string] || FALLBACK_EASE
        return { ease, fallback: ease, duration: seconds(t.duration, 0.6), delay }
    }
    // spring: physical (stiffness/damping/mass) or perceptual (duration/bounce)
    let omega: number
    let zeta: number
    if (t && Number.isFinite(t.stiffness) && Number.isFinite(t.damping)) {
        const mass = Number(t.mass) || 1
        omega = Math.sqrt(Math.max(1, t.stiffness) / mass)
        zeta = Math.max(0.05, t.damping / (2 * Math.sqrt(Math.max(1, t.stiffness) * mass)))
    } else {
        const d = Math.max(0.1, seconds(t?.duration, 0.7))
        zeta = Math.min(1, Math.max(0.05, 1 - (Number.isFinite(t?.bounce) ? t.bounce : 0.12)))
        omega = zeta >= 1 ? 6.64 / d : Math.log(100 / Math.sqrt(1 - zeta * zeta)) / (zeta * d)
    }
    const x = (time: number) => {
        if (Math.abs(zeta - 1) < .0001) return 1 - (1 + omega * time) * Math.exp(-omega * time)
        if (zeta > 1) {
            const q = Math.sqrt(zeta * zeta - 1)
            const r1 = -omega * (zeta - q), r2 = -omega * (zeta + q)
            return 1 + (r2 * Math.exp(r1 * time) - r1 * Math.exp(r2 * time)) / (r1 - r2)
        }
        const wd = omega * Math.sqrt(1 - zeta * zeta)
        return 1 - Math.exp(-zeta * omega * time) * (Math.cos(wd * time) + ((zeta * omega) / wd) * Math.sin(wd * time))
    }
    // settle time: 0.1% band
    let total = 0.05
    const decay = zeta > 1 ? omega / (zeta + Math.sqrt(zeta * zeta - 1)) : zeta * omega
    const settleLimit = Math.min(60, Math.max(4, 10 / Math.max(.001, decay)))
    while (total < settleLimit) {
        let settled = true
        for (let k = 0; k <= 10; k++) {
            if (Math.abs(1 - x(total + k * 0.02)) > 0.001) {
                settled = false
                break
            }
        }
        if (settled) break
        total += 0.02
    }
    const steps = 40
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
        const v = i === steps ? 1 : x((total * i) / steps)
        pts.push(String(Math.round(v * 10000) / 10000))
    }
    return { ease: `linear(${pts.join(", ")})`, fallback: FALLBACK_EASE, duration: total, delay }
}

/* ------------------------------------------------------------------ icons */

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 2.5V11.5M2.5 7H11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}

function ArrowIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function graphemes(text: string): string[] {
    const Seg = typeof Intl !== "undefined" ? (Intl as any).Segmenter : undefined
    if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(text), (s: any) => s.segment)
    return Array.from(text)
}

/**
 * Splits a title into words (they rise) and letters (they sharpen one after another).
 * Letters stay inline, so the font keeps its kerning.
 */
function SplitTitle({ text }: { text: string | undefined }) {
    const words = String(text || "").split(/\s+/).filter(Boolean)
    let c = 0
    return (
        <span aria-hidden="true">
            {words.map((word, wi) => (
                <React.Fragment key={wi}>
                    <span className="swa-w" style={{ "--wi": String(wi) } as React.CSSProperties}>
                        {graphemes(word).map((ch, k) => (
                            <span key={k} className="swa-c" style={{ "--c": String(c++) } as React.CSSProperties}>
                                {ch}
                            </span>
                        ))}
                    </span>
                    {wi < words.length - 1 ? " " : null}
                </React.Fragment>
            ))}
        </span>
    )
}

function countChars(text: string | undefined) {
    return Math.max(1, String(text || "").replace(/\s+/g, "").length)
}

/* ------------------------------------------------------------------ component */

/**
 * Swatch Accordion — colour strips that open into image panels as you hover.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1180
 * @framerIntrinsicHeight 640
 * @framerDisableUnlink
 */
export default function SwatchAccordion(props: SwatchAccordionProps) {
    // Canvas, thumbnails and exports: resting state only (no hover timers, autoplay or listeners)
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <SwatchAccordionView {...props} isStatic />
    return <SwatchAccordionView {...props} isStatic={false} />
}

function SwatchAccordionView(props: SwatchAccordionProps & { isStatic: boolean }) {
    const {
        items: itemsProp = DEFAULT_ITEMS,
        openItem = 2,
        trigger = "hover",
        stripLink = true,
        autoplay = false,
        interval = 5,
        direction = "auto",
        stripWidth = 92,
        barHeight = 64,
        narrowLayout = "image",
        numbers = true,
        scrim = true,
        stripBorder = STRIP_BORDER,
        titleTag = "h3",
        titleFont,
        stripFont,
        bodyFont,
        labelFont,
        textColor = "#141414",
        buttonColor = "#141414",
        buttonTextColor = "#FFFFFF",
        buttonRadius = "999px",
        buttonBorder = BUTTON_BORDER,
        plusRadius = "999px",
        plusBorder = PLUS_BORDER,
        tagRadius = "999px",
        tagBorder = TAG_BORDER,
        padding = "28px",
        gap = "8px",
        radius = "24px",
        transition = { type: "spring", duration: 0.75, bounce: 0.1, delay: 0 },
        style,
    } = props

    const items = Array.isArray(itemsProp) ? itemsProp.slice(0, 10) : DEFAULT_ITEMS
    const count = items.length
    const isStatic = props.isStatic
    const reduced = !!useReducedMotion()
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { margin: "0px 0px -10% 0px" })
    const triggerRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const hoverTimer = React.useRef<number | null>(null)

    const initial = count ? Math.min(Math.max(Math.round(Number.isFinite(openItem) ? openItem : 2) - 1, 0), count - 1) : -1
    // `prev` remembers which strip was open before, so each moving strip can pin its
    // content to the edge that stays still (nothing slides sideways while it fades).
    const [openState, setOpenState] = React.useState({ active: initial, prev: initial })
    const active = count ? Math.min(Math.max(openState.active, 0), count - 1) : -1
    const prev = count ? Math.min(Math.max(openState.prev, 0), count - 1) : -1
    const setActive = React.useCallback((next: number | ((a: number) => number)) => {
        setOpenState((s) => {
            const requested = typeof next === "function" ? next(s.active) : next
            const value = count ? Math.min(Math.max(requested, 0), count - 1) : -1
            return value === s.active ? s : { active: value, prev: s.active }
        })
    }, [count])
    // autoplay pauses while the mouse is over the accordion or keyboard focus is inside it, then carries on
    const [hoverPause, setHoverPause] = React.useState(false)
    const [focusPause, setFocusPause] = React.useState(false)
    const paused = hoverPause || focusPause
    const [cycle, setCycle] = React.useState(0)

    React.useEffect(() => {
        if (hoverTimer.current !== null) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null }
        setOpenState({ active: initial, prev: initial })
    }, [initial, openItem, count])

    React.useEffect(() => {
        return () => {
            if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
        }
    }, [count, trigger, isStatic])

    const autoplayOn = autoplay && !isStatic && !reduced && count > 1

    // every open restarts the autoplay timer, so the chosen strip always gets a full interval
    const open = React.useCallback((index: number) => {
        setCycle((c) => c + 1)
        setActive(index)
    }, [setActive])

    const advance = React.useCallback(() => {
        setCycle((c) => c + 1)
        setActive((a) => (a + 1) % count)
    }, [count, setActive])

    const onStripEnter = (e: React.PointerEvent, index: number) => {
        if (trigger !== "hover" || e.pointerType !== "mouse" || isStatic) return
        if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
        hoverTimer.current = window.setTimeout(() => {
            hoverTimer.current = null
            open(index)
        }, 110)
    }
    const onStripLeave = () => {
        if (hoverTimer.current !== null) {
            window.clearTimeout(hoverTimer.current)
            hoverTimer.current = null
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next = -1
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % count
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + count) % count
        else if (e.key === "Home") next = 0
        else if (e.key === "End") next = count - 1
        if (next >= 0) {
            e.preventDefault()
            triggerRefs.current[next]?.focus()
        }
    }


    const t = toCssTransition(reduced ? { type: "tween", duration: 0.01, ease: "linear" } : transition)
    const title = splitFont(titleFont, "52px")
    const strip = splitFont(stripFont, "22px")
    const body = splitFont(bodyFont, "16px")
    const label = splitFont(labelFont, "12px")
    const Heading = (titleTag || "h3") as any
    const declaredHeight = style?.height
    const autoHeight = declaredHeight == null || ["", "auto", "fit-content", "max-content", "min-content"].includes(String(declaredHeight).trim())
    const pad = parseBox(padding, "28px")
    const gapParts = String(gap === undefined || gap === null || gap === "" ? "8px" : gap).trim().split(/\s+/).filter(Boolean).map(value => cssLength(value, "8px"))
    const requestedRowGap = gapParts[0] || "8px"
    const requestedColGap = gapParts[1] || requestedRowGap
    // Keep even unusually large gaps inside fixed-size accordions; the open panel retains at least 40% of the axis.
    const rowGap = count > 1 && !autoHeight ? `min(${requestedRowGap}, calc(60cqh / ${count - 1}))` : requestedRowGap
    const colGap = count > 1 ? `min(${requestedColGap}, calc(60cqw / ${count - 1}))` : requestedColGap
    // Preserve requested strip/bar sizes while there is room; constrain every item count before an open panel can collapse.
    const many = count > 8
    const stripPx = Math.max(40, stripWidth)
    const barPx = Math.max(40, barHeight)
    const closedSize = count > 1
        ? `min(${stripPx}px, max(0px, calc((100cqw * 0.6 - ${count - 1} * ${colGap}) / ${count - 1})))`
        : `${stripPx}px`
    const barSize =
        count > 1 && !autoHeight
            ? `min(${barPx}px, max(0px, calc((100cqh * 0.6 - ${count - 1} * ${rowGap}) / ${count - 1})))`
            : `${barPx}px`
    // Preserve finite numeric radii, zero, and native per-corner values.
    const sb = readBorder(stripBorder, STRIP_BORDER)
    const pb = readBorder(plusBorder, PLUS_BORDER)
    const tb = readBorder(tagBorder, TAG_BORDER)
    const bb = readBorder(buttonBorder, BUTTON_BORDER)
    const borderVars: Record<string, string> = {}
    if (!sb.isDefault) Object.assign(borderVars, { "--swa-sb-w": sb.width, "--swa-sb-s": sb.style, "--swa-sb-c": sb.color })
    if (!pb.isDefault)
        Object.assign(borderVars, {
            "--swa-pb-w": pb.width,
            "--swa-pb-s": pb.style,
            "--swa-pb-c": pb.color,
            "--swa-pb-t": pb.sides[0],
            "--swa-pb-r": pb.sides[1],
            "--swa-pb-b": pb.sides[2],
            "--swa-pb-l": pb.sides[3],
        })
    if (!tb.isDefault) Object.assign(borderVars, { "--swa-tb-w": tb.width, "--swa-tb-s": tb.style, "--swa-tb-c": tb.color })
    if (!bb.isDefault) Object.assign(borderVars, { "--swa-bb-w": bb.width, "--swa-bb-s": bb.style, "--swa-bb-c": bb.color })

    const rootStyle = {
        ...style,
        position: "relative",
        color: textColor,
        "--swa-n": String(count),
        "--swa-closed": closedSize,
        "--swa-bar": barSize,
        "--swa-gap": colGap,
        "--swa-gap-row": rowGap,
        "--swa-radius": nativeRadius(radius, "24px"),
        "--swa-pt": pad.t,
        "--swa-pr": pad.r,
        "--swa-pb": pad.b,
        "--swa-pl": pad.l,
        "--swa-text": textColor,
        "--swa-btn": buttonColor,
        "--swa-btn-text": buttonTextColor,
        "--swa-btn-r": nativeRadius(buttonRadius),
        "--swa-plus-r": nativeRadius(plusRadius),
        "--swa-tag-r": nativeRadius(tagRadius),
        ...borderVars,
        "--swa-title-size": title.size,
        "--swa-strip-size": strip.size,
        "--swa-body-size": body.size,
        "--swa-label-size": label.size,
        "--swa-dur": `${t.duration}s`,
        "--swa-delay": `${t.delay}s`,
        "--swa-ease": t.ease,
        "--swa-ease-fallback": t.fallback,
    } as React.CSSProperties

    return (
        <div
            ref={rootRef}
            className="swa"
            data-dir={direction}
            data-auto-height={autoHeight ? "" : undefined}
            data-static={isStatic ? "" : undefined}
            data-scrim={scrim ? "" : undefined}
            data-narrow={narrowLayout === "full" ? "full" : undefined}
            data-strip-border={sb.isDefault ? undefined : "custom"}
            data-plus-border={pb.isDefault ? undefined : "custom"}
            data-tag-border={tb.isDefault ? undefined : "custom"}
            data-btn-border={bb.isDefault ? undefined : "custom"}
            data-many={many ? "" : undefined}
            data-fixed-height={!autoHeight && count > 1 ? "" : undefined}
            data-instant={t.duration === 0 ? "" : undefined}
            style={rootStyle}
            onPointerEnter={(e) => e.pointerType === "mouse" && setHoverPause(true)}
            onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setHoverPause(false)
                onStripLeave()
            }}
            onFocus={(e) => {
                // keyboard focus pauses autoplay; focus left behind by a mouse click or tap does not
                let keyboard = true
                try {
                    keyboard = (e.target as HTMLElement).matches(":focus-visible")
                } catch (err) {}
                setFocusPause(keyboard)
            }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusPause(false)
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="swa-track">
                {items.map((item, index) => {
                    const isOpen = index === active
                    // the opening strip grows from its far edge, the closing one shrinks towards its near edge
                    const pinEnd = (isOpen && index > prev) || (index === prev && !isOpen && index > active)
                    const image: ImageValue = item.image?.src ? item.image : DEFAULT_IMAGES[index % DEFAULT_IMAGES.length]
                    const focus = Math.min(100, Math.max(0, Number.isFinite(item.focus as number) ? (item.focus as number) : 50)) / 100
                    const tags = String(item.tags || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    const linked = hasLink(item.link)
                    const triggerId = `swa-${uid}-t${index}`
                    const panelId = `swa-${uid}-p${index}`
                    const headingId = `swa-${uid}-h${index}`
                    const stripStyle = {
                        "--swa-color": item.color || "#E9E7E1",
                        "--swa-focus": String(focus),
                    } as React.CSSProperties

                    return (
                        <div
                            key={index}
                            className="swa-strip"
                            data-open={isOpen ? "" : undefined}
                            data-pin={pinEnd ? "end" : undefined}
                            style={stripStyle}
                            onPointerEnter={(e) => onStripEnter(e, index)}
                            onPointerLeave={onStripLeave}
                        >
                            <div className="swa-media" aria-hidden="true">
                                <img
                                    className="swa-img"
                                    src={image.src}
                                    srcSet={image.srcSet}
                                    sizes="(max-width: 640px) 100vw, 1100px"
                                    alt=""
                                    draggable={false}
                                    loading="eager"
                                    {...({ fetchpriority: isOpen ? "auto" : "low" } as any)}
                                    // canvas, exports and screenshots paint in one pass: decode with it so no strip renders empty
                                    decoding={isStatic ? "sync" : "async"}
                                />
                                <div className="swa-scrim" />
                            </div>

                            <button
                                ref={(el: HTMLButtonElement | null) => {
                                    triggerRefs.current[index] = el
                                }}
                                id={triggerId}
                                type="button"
                                className="swa-trigger"
                                aria-label={item.title || `Item ${index + 1}`}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => open(index)}
                                onKeyDown={(e) => onKeyDown(e, index)}
                            />

                            {isOpen && stripLink && linked && !isStatic ? (
                                <a
                                    className="swa-strip-link"
                                    href={item.link}
                                    target={item.newTab ? "_blank" : undefined}
                                    rel={item.newTab ? "noopener noreferrer" : undefined}
                                    tabIndex={-1}
                                    aria-hidden="true"
                                />
                            ) : null}

                            <div className="swa-closed" aria-hidden="true">
                                {numbers ? (
                                    <span className="swa-num" style={label.rest}>
                                        {pad2(index)}
                                    </span>
                                ) : (
                                    <span />
                                )}
                                <span className="swa-vt">
                                    <span className="swa-vtitle" style={strip.rest}>
                                        {item.title}
                                    </span>
                                </span>
                                <span className="swa-plw">
                                    <span className="swa-plus">
                                        <PlusIcon className="swa-pi" />
                                        <span className="swa-pf">
                                            <PlusIcon className="swa-pi" />
                                        </span>
                                    </span>
                                </span>
                            </div>

                            <div
                                id={panelId}
                                role="region"
                                aria-labelledby={headingId}
                                className="swa-open"
                                style={{ "--cn": String(countChars(item.title)) } as React.CSSProperties}
                                {...(isOpen ? {} : { inert: "" as any, "aria-hidden": true })}
                            >
                                <div className="swa-top">
                                    {numbers ? (
                                        <span className="swa-rv swa-rv-num" aria-hidden="true">
                                            <span className="swa-num" style={label.rest}>
                                                {pad2(index)}
                                            </span>
                                        </span>
                                    ) : (
                                        <span />
                                    )}
                                    {tags.length ? (
                                        <ul className="swa-tags" aria-label="Tags">
                                            {tags.map((tag, i) => (
                                                <li
                                                    key={i}
                                                    className="swa-tag"
                                                    style={{ ...label.rest, "--i": String(i) } as React.CSSProperties}
                                                >
                                                    {tag}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                                <div className="swa-content">
                                    <Heading
                                        id={headingId}
                                        className="swa-title"
                                        style={title.rest}
                                        aria-label={item.title || undefined}
                                    >
                                        <SplitTitle text={item.title} />
                                    </Heading>
                                    {item.description ? (
                                        <div className="swa-rv swa-rv-desc">
                                            <p className="swa-desc" style={body.rest}>
                                                {item.description}
                                            </p>
                                        </div>
                                    ) : null}
                                    {item.button && item.button.trim() ? (
                                        <div className="swa-rc">
                                            {linked ? (
                                                <a
                                                    className="swa-cta"
                                                    href={item.link}
                                                    target={item.newTab ? "_blank" : undefined}
                                                    rel={item.newTab ? "noopener noreferrer" : undefined}
                                                    style={body.rest}
                                                >
                                                    <span>{item.button}</span>
                                                    <ArrowIcon />
                                                </a>
                                            ) : (
                                                <span className="swa-cta swa-cta-static" style={body.rest}>
                                                    <span>{item.button}</span>
                                                    <ArrowIcon />
                                                </span>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                {autoplayOn && isOpen ? (
                                    <div className="swa-progress" aria-hidden="true">
                                        <i
                                            key={`${index}-${cycle}`}
                                            style={{
                                                animationDuration: `${Math.max(1, interval)}s`,
                                                animationPlayState: paused || !inView ? "paused" : "running",
                                            }}
                                            onAnimationEnd={advance}
                                        />
                                    </div>
                                ) : null}
                            </div>

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ styles */

const CSS = `
.swa{container-type:inline-size;container-name:swa;box-sizing:border-box;width:100%;height:100%;-webkit-font-smoothing:antialiased;--swa-out:cubic-bezier(.22,1,.36,1);--swa-pop:cubic-bezier(.34,1.45,.64,1);--swa-reveal:calc(var(--swa-delay) + var(--swa-dur) * .26);--swa-return:calc(var(--swa-delay) + var(--swa-dur) * .34);}
.swa *,.swa *::before,.swa *::after{box-sizing:border-box;}
.swa[data-auto-height]{height:auto;}
.swa-track{display:flex;flex-direction:row;row-gap:var(--swa-gap-row);column-gap:var(--swa-gap);width:100%;height:100%;}
.swa[data-auto-height] .swa-track{height:auto;aspect-ratio:16 / 9;}
.swa-strip{--swa-open-w:calc(100cqw - (var(--swa-n) - 1) * (var(--swa-closed) + var(--swa-gap)));position:relative;flex:0 0 var(--swa-closed);min-width:0;min-height:0;border-radius:var(--swa-radius);overflow:hidden;isolation:isolate;background:linear-gradient(105deg,color-mix(in srgb,var(--swa-color) 90%,#000) 0%,var(--swa-color) 55%,color-mix(in srgb,var(--swa-color) 78%,#fff) 100%);background-color:var(--swa-color);transition-property:flex-grow,flex-basis,height;transition-duration:var(--swa-dur);transition-delay:var(--swa-delay);transition-timing-function:var(--swa-ease-fallback);-webkit-tap-highlight-color:transparent;}
@supports (transition-timing-function: linear(0, 1)){.swa-strip{transition-timing-function:var(--swa-ease);}}
.swa-strip[data-open]{flex-grow:1;}
.swa-media{position:absolute;inset:0;z-index:0;overflow:hidden;border-radius:inherit;clip-path:inset(0 round var(--swa-radius));-webkit-clip-path:inset(0 round var(--swa-radius));}
.swa-strip::after{content:"";position:absolute;inset:0;z-index:6;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),inset 0 1px 0 rgba(255,255,255,.35);}
.swa-img{position:absolute;top:0;height:100%;width:var(--swa-open-w);max-width:none;left:calc((100% - var(--swa-open-w)) * var(--swa-focus));object-fit:cover;object-position:calc(var(--swa-focus) * 100%) 50%;display:block;user-select:none;-webkit-user-select:none;pointer-events:none;transform:scale(1.08);transform-origin:calc(var(--swa-focus) * 100%) 55%;transition:transform 1.2s cubic-bezier(.22,1,.36,1),filter .6s ease;}
.swa-strip[data-open] .swa-img{transform:scale(1);}
.swa-scrim{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s ease;background:radial-gradient(130% 80% at 0% 100%, color-mix(in srgb,var(--swa-color) 88%,transparent) 0%, color-mix(in srgb,var(--swa-color) 55%,transparent) 32%, transparent 62%);}
.swa[data-scrim] .swa-strip[data-open] .swa-scrim{opacity:1;}
.swa-media::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,color-mix(in srgb,var(--swa-color) 72%,transparent) 0%,color-mix(in srgb,var(--swa-color) 30%,transparent) 11%,transparent 20%),linear-gradient(to top,color-mix(in srgb,var(--swa-color) 88%,transparent) 0%,color-mix(in srgb,var(--swa-color) 66%,transparent) 22%,color-mix(in srgb,var(--swa-color) 24%,transparent) 40%,transparent 54%);opacity:1;transition:opacity .6s ease var(--swa-return);}
.swa-strip[data-open] .swa-media::after{opacity:0;transition:opacity .3s ease;}
.swa-trigger{appearance:none;-webkit-appearance:none;position:absolute;inset:0;z-index:2;margin:0;padding:0;border:0;background:transparent;border-radius:inherit;cursor:pointer;outline:none;}
.swa-strip[data-open] .swa-trigger{cursor:default;}
.swa-trigger:focus-visible{box-shadow:inset 0 0 0 2px rgba(255,255,255,.95),inset 0 0 0 4px var(--swa-text);}
.swa-strip-link{position:absolute;inset:0;z-index:3;cursor:pointer;border-radius:inherit;}
/* closed strip: number, title and plus leave at once and return one after another */
.swa-closed{position:absolute;top:0;bottom:0;left:0;width:min(100%, calc(var(--swa-closed) + 14px));z-index:4;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:var(--swa-pt) 0 calc(var(--swa-pb) + 3px);}
.swa-num{display:inline-flex;align-items:center;height:30px;font-size:var(--swa-label-size);color:var(--swa-text);opacity:.72;font-variant-numeric:tabular-nums;letter-spacing:.02em;line-height:1;user-select:none;-webkit-user-select:none;}
.swa-closed .swa-num{transition:opacity .5s ease var(--swa-return),transform .7s var(--swa-out) var(--swa-return);}
.swa-strip[data-open] .swa-closed .swa-num{opacity:0;transform:translateY(-6px);transition:opacity .14s ease,transform .3s ease;}
.swa-vt{display:flex;margin-top:auto;margin-bottom:18px;transition:opacity .55s ease calc(var(--swa-return) + 60ms),transform .9s var(--swa-out) calc(var(--swa-return) + 60ms),filter .55s ease calc(var(--swa-return) + 60ms);}
.swa-strip[data-open] .swa-vt{opacity:0;transform:translateY(18px);filter:blur(6px);transition:opacity .18s ease,transform .32s cubic-bezier(.4,0,1,1),filter .18s ease;}
.swa-vtitle{font-size:var(--swa-strip-size);color:var(--swa-text);writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;line-height:1;user-select:none;-webkit-user-select:none;transition:transform .5s var(--swa-out);}
.swa-plw{display:grid;transition:transform .8s var(--swa-pop) calc(var(--swa-return) + 120ms);}
.swa-strip[data-open] .swa-plw{transform:scale(.55) rotate(45deg);transition:transform .34s cubic-bezier(.4,0,.2,1);}
.swa-plus{position:relative;display:grid;place-items:center;width:40px;height:40px;border-radius:var(--swa-plus-r,999px);color:var(--swa-text);background:rgba(255,255,255,.56);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border:1px solid rgba(255,255,255,.72);box-shadow:0 1px 1px rgba(255,255,255,.6) inset,0 6px 18px -10px rgba(20,20,20,.35);transition:opacity .4s ease calc(var(--swa-return) + 120ms),transform .45s var(--swa-out);}
.swa-strip[data-open] .swa-plus{opacity:0;transition:opacity .2s ease .08s,transform .45s var(--swa-out);}
/* hover fill: a dark layer rises from the bottom and carries its own white icon, so nothing ever crossfades */
.swa-pf{position:absolute;inset:-1px;display:grid;place-items:center;border-radius:inherit;background:var(--swa-text);color:#fff;clip-path:inset(100% 0 0 0);-webkit-clip-path:inset(100% 0 0 0);transition:clip-path .45s var(--swa-out),-webkit-clip-path .45s var(--swa-out);}
.swa-strip[data-open] .swa-pf{clip-path:inset(0 0 0 0);-webkit-clip-path:inset(0 0 0 0);transition:clip-path .3s var(--swa-out),-webkit-clip-path .3s var(--swa-out);}
.swa-pi{display:block;transition:transform .6s var(--swa-out);}
/* open panel: laid out at its final width so nothing re-wraps while the strip moves */
.swa-open{position:absolute;top:0;bottom:0;left:0;width:var(--swa-open-w);z-index:5;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:var(--swa-pt) var(--swa-pr) var(--swa-pb) var(--swa-pl);visibility:hidden;transform:translateY(-8px);transition:transform .36s ease,visibility 0s linear .36s;}
.swa-strip[data-open] .swa-open{visibility:visible;transform:none;transition:none;}
/* pin text and labels to the edge of the strip that does not move */
.swa:not([data-dir="vertical"]) .swa-strip[data-pin="end"] .swa-open,.swa:not([data-dir="vertical"]) .swa-strip[data-pin="end"] .swa-closed{left:auto;right:0;}
/* reveal: number, tags, title words, text, button and arrow arrive one after another */
.swa-rv{display:block;opacity:0;transform:translateY(14px);filter:blur(6px);transition:opacity .2s ease,filter .2s ease,transform 0s linear .36s;}
.swa-strip[data-open] .swa-rv{opacity:1;transform:none;filter:none;transition:opacity .6s ease,transform .9s var(--swa-out),filter .6s ease;transition-delay:calc(var(--swa-reveal) + var(--d, 0ms));}
.swa-rv-num{--d:0ms;display:inline-flex;}
.swa-rv-desc{--d:calc(120ms + min(var(--cn, 8) * 20ms, 260ms));}
.swa-rc{opacity:0;transform:translateY(10px) scale(.97);transform-origin:0 50%;transition:opacity .2s ease,transform 0s linear .36s;}
.swa-strip[data-open] .swa-rc{opacity:1;transform:none;transition:opacity .55s ease,transform .9s var(--swa-out);transition-delay:calc(var(--swa-reveal) + 200ms + min(var(--cn, 8) * 20ms, 260ms));}
.swa-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-height:30px;}
.swa-tags{list-style:none;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;margin:0;padding:0;max-width:70%;}
.swa-tag{display:inline-flex;align-items:center;height:30px;font-size:var(--swa-label-size);line-height:1;color:var(--swa-text);padding:0 12px;border-radius:var(--swa-tag-r,999px);white-space:nowrap;background:rgba(255,255,255,.5);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border:1px solid rgba(255,255,255,.66);opacity:0;transform:translateY(10px);transition:opacity .2s ease,transform 0s linear .36s;}
.swa-strip[data-open] .swa-tag{opacity:1;transform:none;transition:opacity .55s ease,transform .85s var(--swa-out);transition-delay:calc(var(--swa-reveal) + 70ms + var(--i, 0) * 60ms);}
.swa-content{width:min(440px,100%);display:flex;flex-direction:column;align-items:flex-start;}
.swa-title{margin:0 0 14px;font-size:var(--swa-title-size);color:var(--swa-text);text-wrap:balance;}
.swa-w{display:inline-block;white-space:nowrap;transform:translateY(.3em);transition:transform 0s linear .36s;}
.swa-strip[data-open] .swa-w{transform:none;transition:transform 1.1s var(--swa-out) calc(var(--swa-reveal) + var(--wi, 0) * 60ms);}
.swa-c{opacity:0;filter:blur(10px);transition:opacity .2s ease,filter .2s ease;}
.swa-strip[data-open] .swa-c{opacity:1;filter:none;transition:opacity .5s ease,filter .65s ease;transition-delay:calc(var(--swa-reveal) + var(--c, 0) * 22ms);}
.swa-desc{margin:0 0 22px;font-size:var(--swa-body-size);color:var(--swa-text);opacity:.8;max-width:36ch;text-wrap:pretty;}
.swa-cta{pointer-events:auto;display:inline-flex;align-items:center;gap:12px;min-height:46px;padding:0 18px 0 22px;border-radius:var(--swa-btn-r,999px);background:var(--swa-btn);color:var(--swa-btn-text);text-decoration:none;font-size:calc(var(--swa-body-size) * .9);font-weight:500;line-height:1;white-space:nowrap;transition:transform .2s ease;box-shadow:0 10px 24px -14px rgba(20,20,20,.55);}
.swa-cta svg{flex:none;opacity:0;transform:translateX(-8px);transition:opacity .2s ease,transform 0s linear .36s;}
.swa-strip[data-open] .swa-cta svg{opacity:1;transform:none;transition:opacity .45s ease,transform .8s var(--swa-out);transition-delay:calc(var(--swa-reveal) + 380ms + min(var(--cn, 8) * 20ms, 260ms));}
.swa-cta-static{pointer-events:none;}
.swa-cta:focus-visible{outline:2px solid var(--swa-btn);outline-offset:3px;}
a.swa-cta:active{transform:scale(.97);}
.swa-progress{position:absolute;left:var(--swa-pl);right:var(--swa-pr);bottom:12px;z-index:6;height:2px;border-radius:2px;background:rgba(20,20,20,.12);overflow:hidden;pointer-events:none;animation:swa-fade .6s ease both;animation-delay:calc(var(--swa-reveal) + 300ms);}
@keyframes swa-fade{from{opacity:0}to{opacity:1}}
.swa-progress i{display:block;height:100%;width:100%;background:var(--swa-text);transform-origin:left center;transform:scaleX(0);animation-name:swa-progress;animation-timing-function:linear;animation-fill-mode:both;animation-delay:calc(var(--swa-reveal) + 300ms);}
@keyframes swa-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.swa-trigger:active ~ .swa-closed .swa-plus{transform:scale(.9);}
@media (hover:hover) and (pointer:fine){
  .swa-strip:not([data-open]):hover{flex-basis:calc(var(--swa-closed) + 14px);}
  .swa-strip:not([data-open]):hover .swa-pf{clip-path:inset(0 0 0 0);-webkit-clip-path:inset(0 0 0 0);}
  .swa-strip:not([data-open]):hover .swa-pi{transform:rotate(90deg);}
  .swa-strip:not([data-open]):hover .swa-vtitle{transform:rotate(180deg) translateX(4px);}
  .swa-strip:not([data-open]):hover .swa-img{transform:scale(1.04);}
  .swa-strip[data-open]:hover .swa-img{transform:scale(1.015);}
}
/* vertical: stacked bars (forced, or automatically on narrow containers) */
.swa[data-dir="vertical"] .swa-track{flex-direction:column;}
.swa[data-dir="vertical"] .swa-strip{flex:0 0 var(--swa-bar);}
.swa[data-dir="vertical"] .swa-strip[data-open]{flex-grow:1;}
.swa[data-dir="vertical"] .swa-img{width:100%;height:auto;aspect-ratio:4 / 3;left:0;top:0;transform-origin:50% 0;-webkit-mask-image:linear-gradient(to bottom,#000 68%,transparent 100%);mask-image:linear-gradient(to bottom,#000 68%,transparent 100%);}

.swa[data-dir="vertical"] .swa-img{opacity:0;transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .5s ease;}
.swa[data-dir="vertical"] .swa-strip[data-open] .swa-img{opacity:1;transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .6s ease calc(var(--swa-dur) * .15);}
.swa[data-dir="vertical"] .swa-closed{width:auto;right:0;flex-direction:row;justify-content:flex-start;gap:14px;padding:0 var(--swa-pr) 0 var(--swa-pl);}
.swa[data-dir="vertical"] .swa-vt{margin:0 auto 0 0;}
.swa[data-dir="vertical"] .swa-vtitle{writing-mode:horizontal-tb;transform:none;}
.swa[data-dir="vertical"] .swa-strip[data-open] .swa-vt{transform:translateY(8px);}
.swa[data-dir="vertical"] .swa-strip{--swa-reveal:calc(var(--swa-delay) + var(--swa-dur) * .42);}
.swa[data-dir="vertical"] .swa-open{width:auto;right:0;}
.swa[data-dir="vertical"] .swa-num{min-width:22px;}
.swa[data-dir="vertical"][data-auto-height] .swa-track{aspect-ratio:auto;}
.swa[data-dir="vertical"][data-auto-height] .swa-strip{flex:none;height:var(--swa-bar);transition-property:height;}
.swa[data-dir="vertical"][data-auto-height] .swa-strip[data-open]{height:calc(75cqw + 232px);}
@container swa (max-width: 920px){
  .swa:not([data-dir="vertical"]):where(:not([data-narrow="full"])) .swa-img{height:62%;-webkit-mask-image:linear-gradient(to bottom,#000 72%,transparent 100%);mask-image:linear-gradient(to bottom,#000 72%,transparent 100%);transform-origin:calc(var(--swa-focus) * 100%) 0%;}

  .swa:not([data-dir="vertical"]) .swa-title{font-size:calc(var(--swa-title-size) * .78);margin-bottom:10px;}
  .swa:not([data-dir="vertical"]) .swa-desc{margin-bottom:18px;}
  .swa:not([data-dir="vertical"]) .swa-content{width:100%;}
}
@container swa (max-width: 800px){
  .swa-tags{display:none;}
}
@container swa (max-width: 640px){
  .swa[data-dir="auto"] .swa-track{flex-direction:column;}
  .swa[data-dir="auto"] .swa-strip{flex:0 0 var(--swa-bar);}
  .swa[data-dir="auto"] .swa-strip[data-open]{flex-grow:1;}
  .swa[data-dir="auto"] .swa-img{width:100%;height:auto;aspect-ratio:4 / 3;left:0;top:0;transform-origin:50% 0;-webkit-mask-image:linear-gradient(to bottom,#000 68%,transparent 100%);mask-image:linear-gradient(to bottom,#000 68%,transparent 100%);}

  .swa[data-dir="auto"] .swa-img{opacity:0;transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .5s ease;}
  .swa[data-dir="auto"] .swa-strip[data-open] .swa-img{opacity:1;transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .6s ease calc(var(--swa-dur) * .15);}
  .swa[data-dir="auto"] .swa-closed{width:auto;right:0;flex-direction:row;justify-content:flex-start;gap:14px;padding:0 var(--swa-pr) 0 var(--swa-pl);}
  .swa[data-dir="auto"] .swa-vt{margin:0 auto 0 0;}
  .swa[data-dir="auto"] .swa-vtitle{writing-mode:horizontal-tb;transform:none;}
  .swa[data-dir="auto"] .swa-strip[data-open] .swa-vt{transform:translateY(8px);}
  .swa[data-dir="auto"] .swa-strip{--swa-reveal:calc(var(--swa-delay) + var(--swa-dur) * .42);}
  .swa[data-dir="auto"] .swa-open{width:auto;right:0;}
  .swa[data-dir="auto"] .swa-strip[data-pin="end"] .swa-open,.swa[data-dir="auto"] .swa-strip[data-pin="end"] .swa-closed{left:0;right:0;}
  .swa[data-dir="auto"] .swa-num{min-width:22px;}
  .swa[data-dir="auto"][data-auto-height] .swa-track{aspect-ratio:auto;}
  .swa[data-dir="auto"][data-auto-height] .swa-strip{flex:none;height:var(--swa-bar);transition-property:height;}
  .swa[data-dir="auto"][data-auto-height] .swa-strip[data-open]{height:calc(75cqw + 232px);}
  .swa-title{font-size:calc(var(--swa-title-size) * .66);margin-bottom:10px;}
  .swa-desc{margin-bottom:18px;}

  .swa-tags{display:none;}

}
@media (hover:hover) and (pointer:fine){
  .swa[data-dir="vertical"] .swa-strip:not([data-open]):hover{flex-basis:calc(var(--swa-bar) + 8px);}
  .swa[data-dir="vertical"] .swa-strip:not([data-open]):hover .swa-vtitle{transform:translateX(4px);}
}
@container swa (max-width: 640px){
  @media (hover:hover) and (pointer:fine){
    .swa[data-dir="auto"] .swa-strip:not([data-open]):hover{flex-basis:calc(var(--swa-bar) + 8px);}
    .swa[data-dir="auto"] .swa-strip:not([data-open]):hover .swa-vtitle{transform:translateX(4px);}
  }
}
@media (prefers-reduced-motion: reduce){
  .swa *,.swa *::before,.swa *::after{transition-duration:.01ms !important;transition-delay:0s !important;}
  .swa-img,.swa-strip[data-open] .swa-img{transform:none !important;}
}
@media (prefers-contrast: more){
  .swa-desc{opacity:1;}
  .swa-num{opacity:1;}
  .swa-scrim{background:color-mix(in srgb,var(--swa-color) 70%,transparent) !important;}
}
/* Strip, Plus, Tag and Button Border: unchanged = the original edges; once set, exactly that border is drawn */
.swa[data-strip-border] .swa-strip::after{box-shadow:none;border-style:var(--swa-sb-s);border-color:var(--swa-sb-c);border-width:var(--swa-sb-w);}
.swa[data-plus-border] .swa-plus{border-style:var(--swa-pb-s);border-color:var(--swa-pb-c);border-width:var(--swa-pb-w);box-shadow:0 6px 18px -10px rgba(20,20,20,.35);}
.swa[data-plus-border] .swa-pf{inset:auto;top:calc(var(--swa-pb-t) * -1);right:calc(var(--swa-pb-r) * -1);bottom:calc(var(--swa-pb-b) * -1);left:calc(var(--swa-pb-l) * -1);}
.swa[data-tag-border] .swa-tag{border-style:var(--swa-tb-s);border-color:var(--swa-tb-c);border-width:var(--swa-tb-w);}
.swa[data-btn-border] .swa-cta{border-style:var(--swa-bb-s);border-color:var(--swa-bb-c);border-width:var(--swa-bb-w);}
/* Fixed-height stacks need their own block-axis query units, at every item count. */
.swa[data-fixed-height]{container-type:size;}
.swa[data-instant] *,.swa[data-instant] *::before,.swa[data-instant] *::after{transition-duration:0s !important;transition-delay:var(--swa-delay) !important;}
/* Full Image and Scrim remain independent in both stacked modes. */
.swa[data-dir="vertical"][data-narrow="full"] .swa-img{height:100%;aspect-ratio:auto;-webkit-mask-image:none;mask-image:none;}
@container swa (max-width:640px){
  .swa[data-dir="auto"][data-narrow="full"] .swa-img{height:100%;aspect-ratio:auto;-webkit-mask-image:none;mask-image:none;}
}
/* Keep alpha intact: a transparent item colour must not introduce black/white paint. */
@supports (color:rgb(from red r g b / alpha)){
  .swa-strip{background-image:linear-gradient(105deg,rgb(from var(--swa-color) calc(r * .9) calc(g * .9) calc(b * .9) / alpha) 0%,var(--swa-color) 55%,rgb(from var(--swa-color) calc(r * .78 + 56.1) calc(g * .78 + 56.1) calc(b * .78 + 56.1) / alpha) 100%);}
}
.swa-content,.swa-w{max-width:100%;}
.swa-w{white-space:normal;overflow-wrap:anywhere;}
.swa-cta{max-width:100%;white-space:normal;padding-top:12px;padding-bottom:12px;}
.swa-cta span{min-width:0;overflow-wrap:anywhere;}
.swa[data-static] *,.swa[data-static] *::before,.swa[data-static] *::after{transition:none !important;animation:none !important;}
`

/* ------------------------------------------------------------------ controls */

SwatchAccordion.displayName = "Swatch Accordion"

addPropertyControls(SwatchAccordion, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Describe this item in one or two short sentences.",
                },
                tags: { type: ControlType.String, title: "Tags", placeholder: "Tag, Tag, Tag", defaultValue: "" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#C7C5ED" },
                focus: {
                    type: ControlType.Number,
                    title: "Focus",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    description: "Which part of the image shows in a closed strip.",
                },
                button: { type: ControlType.String, title: "Button", defaultValue: "Learn more" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    openItem: {
        type: ControlType.Number,
        title: "Open Item",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Open On",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        defaultValue: "hover",
        description: "Touch screens always open on tap.",
    },
    stripLink: {
        type: ControlType.Boolean,
        title: "Strip Link",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Clicking the open strip follows its link.",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 5,
        min: 2,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p: Partial<SwatchAccordionProps>) => !p.autoplay,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["auto", "horizontal", "vertical"],
        optionTitles: ["Auto", "Horizontal", "Vertical"],
        defaultValue: "auto",
        description: "Auto stacks the strips below 640 px width.",
    },
    narrowLayout: {
        type: ControlType.Enum,
        title: "Narrow",
        options: ["image", "full"],
        optionTitles: ["Image Top", "Full Image"],
        displaySegmentedControl: true,
        defaultValue: "image",
        description: "Open strip below 920 px width.",
    },
    stripWidth: {
        type: ControlType.Number,
        title: "Strip Width",
        defaultValue: 92,
        min: 48,
        max: 200,
        step: 1,
        unit: "px",
        description: "Narrows automatically when needed to keep the open panel visible.",
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 64,
        min: 44,
        max: 140,
        step: 1,
        unit: "px",
        description: "Closed height when stacked. Shrinks if needed in a fixed-height component.",
    },
    numbers: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    scrim: {
        type: ControlType.Boolean,
        title: "Scrim",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Soft colour wash behind the text.",
    },
    stripBorder: {
        type: ControlType.Border,
        title: "Strip Border",
        defaultValue: STRIP_BORDER,
        description: "Width 0 removes the edge.",
    },
    titleTag: {
        type: ControlType.Enum,
        title: "Title Tag",
        options: ["h2", "h3", "h4", "p"],
        optionTitles: ["H2", "H3", "H4", "P"],
        displaySegmentedControl: true,
        defaultValue: "h3",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "52px", variant: "Medium", letterSpacing: "-0.035em", lineHeight: "1em" },
    },
    stripFont: {
        type: ControlType.Font,
        title: "Strip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", variant: "Medium", letterSpacing: "-0.02em", lineHeight: "1em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Regular", letterSpacing: "-0.005em", lineHeight: "1.5em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", letterSpacing: "0.01em", lineHeight: "1em" },
    },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#141414" },
    buttonColor: { type: ControlType.Color, title: "Button", defaultValue: "#141414" },
    buttonTextColor: { type: ControlType.Color, title: "Button Text", defaultValue: "#FFFFFF" },
    buttonRadius: { type: ControlType.BorderRadius, title: "Button Radius", defaultValue: "999px" },
    buttonBorder: { type: ControlType.Border, title: "Button Border", defaultValue: BUTTON_BORDER },
    plusRadius: { type: ControlType.BorderRadius, title: "Plus Radius", defaultValue: "999px" },
    plusBorder: {
        type: ControlType.Border,
        title: "Plus Border",
        defaultValue: PLUS_BORDER,
        description: "The + on closed strips.",
    },
    tagRadius: { type: ControlType.BorderRadius, title: "Tag Radius", defaultValue: "999px" },
    tagBorder: { type: ControlType.Border, title: "Tag Border", defaultValue: TAG_BORDER },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "28px", description:"Expanded content padding on every layout; left and right also inset closed stacked bars. Bar Height controls their vertical spacing." },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: "8px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "24px" },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", duration: 0.75, bounce: 0.1, delay: 0 },
        description: CREDIT,
    },
})
