// @framerDisableUnlink
/**
 * Type Peek — BuiltByKern Marketplace
 * Canon (Saviour): a photo emerges from behind one source letter, then
 * crosses above following letters. Per-letter stacking creates the weave.
 * Field layout only.
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion, type Transition } from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    memo,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
} from "react"

type FramerImage = {
    src: string
    srcSet?: string
    alt?: string
}

type SeparatorKind =
    | "comma"
    | "middot"
    | "slash"
    | "dash"
    | "pipe"
    | "space"
    | "none"
    | "custom"

interface PeekWord {
    label: string
    peek: FramerImage | undefined
    peek2?: FramerImage
    link: string | undefined
}

interface ContentCtrl {
    words: PeekWord[]
    separator: SeparatorKind
    customSeparator: string
    openInNewTab: boolean
    /** @deprecated Prefer preview.activeIndex */
    activeIndex?: number
}

interface LookCtrl {
    background: string
    mutedColor: string
    solidColor: string
    accent: string
    font: CSSProperties
    gap: number
    dimOpacity: number
    /** Extra letter-spacing when open (em). */
    openTracking: number
    /** 1 or 2 photo windows behind opaque type. */
    peekCount: number
}

interface TickerCtrl {
    rows: number
    duration: number
    alternate: boolean
    pauseOnHover: boolean
}

interface MotionCtrl {
    transition: Transition
}

interface PreviewCtrl {
    /** Canvas / Export only — which word is peek-open. Live rest = none. */
    activeIndex: number
}

interface TypePeekProps {
    content: ContentCtrl
    look: LookCtrl
    ticker: TickerCtrl
    motion: MotionCtrl
    preview: PreviewCtrl
    onPeek?: () => void
    style?: CSSProperties
    /** @deprecated Prefer content.separator */
    separator?: SeparatorKind
    /** @deprecated Prefer content.customSeparator */
    customSeparator?: string
    /** @deprecated Prefer motion.transition */
    transition?: Transition
    /** @deprecated Prefer content.openInNewTab */
    openInNewTab?: boolean
}

/**
 * Saviour-inspired anchor-relative crops. Each window belongs to one source
 * letter: it sits behind that glyph's stacking context but above later glyphs.
 */
const PEEK_LAYOUTS = [
    [
        {
            left: "44%",
            top: "-6%",
            widthEm: 1.78,
            heightEm: 1.38,
            bgPos: "38% 42%",
            scale: 1.12,
        },
        {
            left: "52%",
            top: "18%",
            widthEm: 1.28,
            heightEm: 0.92,
            bgPos: "68% 48%",
            scale: 1.18,
        },
    ],
    [
        {
            left: "52%",
            top: "-2%",
            widthEm: 1.86,
            heightEm: 1.32,
            bgPos: "52% 40%",
            scale: 1.14,
        },
        {
            left: "40%",
            top: "-8%",
            widthEm: 1.22,
            heightEm: 1.12,
            bgPos: "65% 50%",
            scale: 1.1,
        },
    ],
    [
        {
            left: "38%",
            top: "-8%",
            widthEm: 1.7,
            heightEm: 1.42,
            bgPos: "34% 48%",
            scale: 1.13,
        },
        {
            left: "58%",
            top: "20%",
            widthEm: 1.36,
            heightEm: 0.88,
            bgPos: "72% 54%",
            scale: 1.2,
        },
    ],
    [
        {
            left: "48%",
            top: "-4%",
            widthEm: 1.82,
            heightEm: 1.28,
            bgPos: "44% 38%",
            scale: 1.12,
        },
        {
            left: "42%",
            top: "0%",
            widthEm: 1.2,
            heightEm: 1.02,
            bgPos: "62% 58%",
            scale: 1.16,
        },
    ],
] as const

/** Peek enter floor / leave cap — AUDIT UI under 300ms. */
const PEEK_ENTER_MS = 0.28
const PEEK_LEAVE_MS = 0.16

function hashLabel(label: string): number {
    let hash = 0
    for (let i = 0; i < label.length; i++) {
        hash = (hash * 31 + label.charCodeAt(i)) >>> 0
    }
    return hash
}

function nearestEligibleIndex(
    chars: string[],
    target: number,
    excluded: number | null,
    preferredOnly: boolean
): number {
    const preferred = new Set(["l", "i", "t", "f", "r", "n", "h", "k", "d"])
    let best = -1
    let distance = Number.POSITIVE_INFINITY

    for (let i = 0; i < chars.length - 1; i++) {
        const char = chars[i]
        if (!char || char.trim().length === 0 || i === excluded) continue
        if (preferredOnly && !preferred.has(char.toLowerCase())) continue

        const nextDistance = Math.abs(i - target)
        if (nextDistance < distance) {
            best = i
            distance = nextDistance
        }
    }

    return best
}

function resolveAnchorIndices(label: string): [number, number] {
    const chars = Array.from(label)
    const primaryTarget = Math.min(
        Math.max(0, Math.floor(chars.length * 0.66)),
        Math.max(0, chars.length - 2)
    )
    const secondaryTarget = Math.min(
        Math.max(0, Math.floor(chars.length * 0.28)),
        Math.max(0, chars.length - 2)
    )
    const nearbyL = chars
        .map((char, index) => ({ char: char.toLowerCase(), index }))
        .filter(
            ({ char, index }) =>
                char === "l" &&
                index < chars.length - 1 &&
                Math.abs(index - primaryTarget) <= 2
        )
        .sort(
            (a, b) =>
                Math.abs(a.index - primaryTarget) -
                Math.abs(b.index - primaryTarget)
        )[0]?.index

    const primaryPreferred = nearestEligibleIndex(
        chars,
        primaryTarget,
        null,
        true
    )
    const primaryFallback = nearestEligibleIndex(
        chars,
        primaryTarget,
        null,
        false
    )
    const primary =
        nearbyL ??
        (primaryPreferred >= 0 ? primaryPreferred : primaryFallback)
    const secondaryPreferred = nearestEligibleIndex(
        chars,
        secondaryTarget,
        primary,
        true
    )
    const secondary =
        secondaryPreferred >= 0
            ? secondaryPreferred
            : nearestEligibleIndex(chars, secondaryTarget, primary, false)

    return [Math.max(0, primary), Math.max(0, secondary)]
}

interface IndexedWord {
    word: PeekWord
    index: number
}

function splitIntoRows(words: PeekWord[], rowCount: number): IndexedWord[][] {
    const rows: IndexedWord[][] = []
    const size = Math.max(1, Math.ceil(words.length / rowCount))

    for (let start = 0; start < words.length; start += size) {
        rows.push(
            words.slice(start, start + size).map((word, offset) => ({
                word,
                index: start + offset,
            }))
        )
    }

    return rows
}

/** Repeat row items so one ticker group is wide enough to never leave gaps. */
function expandRowForFill(
    row: IndexedWord[],
    repeats: number
): IndexedWord[] {
    if (row.length === 0 || repeats <= 1) return row
    const out: IndexedWord[] = []
    for (let r = 0; r < repeats; r++) {
        for (const item of row) out.push(item)
    }
    return out
}

/**
 * Peek windows are ~1.2–1.8em (~130–190px CSS ≈ 260–380px retina). Cap CDN
 * at 384 — enough sharpness, ~10–20KB each, warmable before first hover.
 */
const PEEK_CDN_MAX = 384

function peekDeliverySrc(src: string): string {
    if (!src) return src
    try {
        const url = new URL(src)
        if (!url.hostname.includes("framerusercontent.com")) return src
        url.searchParams.set("scale-down-to", String(PEEK_CDN_MAX))
        return url.toString()
    } catch {
        return src
    }
}

function peekImg(id: string, alt: string): FramerImage {
    return {
        src: peekDeliverySrc(
            `https://framerusercontent.com/images/${id}.jpg`
        ),
        alt,
    }
}

/** One high-key ceramic / still-life family — warm neutrals, soft daylight. */
const PEEKS: FramerImage[] = [
    peekImg(
        "0mEEniKXpoJCR9oFnuMD5DNKWQI",
        "Cream ceramic vase with soft yellow tulips on a white plinth"
    ),
    peekImg(
        "sD4iTRDDRknhVCRG1bNGxi0p1Co",
        "Japandi table still life with ceramic vase and muted cups"
    ),
    peekImg(
        "TMp9LQosfgaJpkjHzYTIJdeffA",
        "White anthurium in matte ceramic with circular mirrors"
    ),
    peekImg(
        "D56eSKetCBZbm8NIoAqttUiLkvc",
        "Two matte off-white ceramic vases with draped taupe linen"
    ),
    peekImg(
        "D2CxUhqwLTdy3mMjvlWodzs0EU",
        "Speckled cream vase with bunny-tail grass on linen"
    ),
    peekImg(
        "wlRwltuO16szkn9JIuuOsrLnftA",
        "Dried eucalyptus seed pods on a warm grey field"
    ),
    peekImg(
        "D9fvSPnFyxcimyuUqSQKL8K8BI",
        "White ceramic vase with white blooms in soft daylight"
    ),
    peekImg(
        "pQ7TibdgF7k0o0uUqwInuXy9TeE",
        "White plate with delicate flowers in a high-key studio"
    ),
]

const DEFAULT_FIELD_WORDS: PeekWord[] = [
    { label: "Still Bloom", peek: PEEKS[0], peek2: PEEKS[1], link: undefined },
    { label: "Quiet Ritual", peek: PEEKS[1], peek2: PEEKS[2], link: undefined },
    {
        label: "Soft Geometry",
        peek: PEEKS[2],
        peek2: PEEKS[3],
        link: undefined,
    },
    { label: "Draped Forms", peek: PEEKS[3], peek2: PEEKS[4], link: undefined },
    { label: "Earth Study", peek: PEEKS[4], peek2: PEEKS[5], link: undefined },
    { label: "Seed & Stone", peek: PEEKS[5], peek2: PEEKS[6], link: undefined },
    { label: "Pale Flora", peek: PEEKS[6], peek2: PEEKS[7], link: undefined },
    { label: "Table Poem", peek: PEEKS[7], peek2: PEEKS[0], link: undefined },
]

const DEFAULT_FONT: CSSProperties = {
    fontFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 104,
    fontWeight: 900,
    letterSpacing: "-0.06em",
    lineHeight: 1.05,
}

const DEFAULT_LOOK: LookCtrl = {
    background: "rgba(0,0,0,0)",
    mutedColor: "rgba(242,242,242,0.42)",
    solidColor: "#F2F2F2",
    /** SKU accent — coral ember (not house cyan). Matches Home liquid. */
    accent: "#FF6B4A",
    font: DEFAULT_FONT,
    gap: 8,
    dimOpacity: 0.22,
    openTracking: 0.035,
    peekCount: 2,
}

const DEFAULT_TICKER: TickerCtrl = {
    rows: 3,
    duration: 24,
    alternate: true,
    pauseOnHover: true,
}

const DEFAULT_PREVIEW: PreviewCtrl = {
    activeIndex: 0,
}

/** AUDIT --ease-out — single Motion + CSS curve for this file. */
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const EASE_OUT_CSS = "cubic-bezier(0.23, 1, 0.32, 1)"

const DEFAULT_TRANSITION: Transition = {
    type: "tween",
    ease: [...EASE_OUT],
    duration: 0.22,
}

const DEFAULT_MOTION: MotionCtrl = {
    transition: DEFAULT_TRANSITION,
}

const DEFAULT_CONTENT: ContentCtrl = {
    words: DEFAULT_FIELD_WORDS,
    separator: "comma",
    customSeparator: "/",
    openInNewTab: false,
}

const BUILTBYKERN_BRAND =
    "BuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)"

const INTRO_T_MS = 280
/** Soft cap — fill strip without exploding interactive DOM. */
const MAX_ROW_REPEATS = 4

function useFinePointer(): boolean {
    const [fine, setFine] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
        const apply = () => setFine(mq.matches)
        apply()
        mq.addEventListener?.("change", apply)
        return () => mq.removeEventListener?.("change", apply)
    }, [])
    return fine
}

function resolveSeparator(
    kind: SeparatorKind,
    custom: string
): string | null {
    switch (kind) {
        case "comma":
            return ","
        case "middot":
            return "·"
        case "slash":
            return "/"
        case "dash":
            return "—"
        case "pipe":
            return "|"
        case "space":
            return null
        case "none":
            return null
        case "custom": {
            const t = (custom ?? "").trim()
            return t.length > 0 ? t : null
        }
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}

function resolveImage(
    img: FramerImage | undefined,
    fallback: FramerImage
): FramerImage {
    const base = img?.src ? img : fallback
    return {
        ...base,
        src: peekDeliverySrc(base.src),
    }
}

/** Warm HTTP + decode cache before first hover mounts the weave. */
function preloadPeekSrcs(srcs: string[]) {
    if (typeof window === "undefined") return () => {}
    const unique = Array.from(new Set(srcs.filter(Boolean)))
    const holders: HTMLImageElement[] = []
    for (const src of unique) {
        const img = new Image()
        img.decoding = "async"
        img.src = src
        void img.decode?.().catch(() => {})
        holders.push(img)
    }
    return () => {
        holders.length = 0
    }
}

function hasLink(link: string | undefined): link is string {
    return typeof link === "string" && link.trim().length > 0
}

function parseTrackingEm(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string") {
        const n = parseFloat(value)
        if (Number.isFinite(n)) {
            if (value.trim().endsWith("em")) return n
            if (value.trim().endsWith("px")) return n / 56
            return n
        }
    }
    return fallback
}

function resolveFontStyle(font: CSSProperties | undefined): CSSProperties {
    const merged = { ...DEFAULT_FONT, ...font }
    const size = Number.parseFloat(String(font?.fontSize ?? ""))
    const weight = Number.parseFloat(String(font?.fontWeight ?? ""))
    const lineHeight = Number.parseFloat(String(font?.lineHeight ?? ""))
    const tracking = parseTrackingEm(font?.letterSpacing, Number.NaN)
    const isLegacySmall =
        size === 56 &&
        weight === 800 &&
        lineHeight === 1.05 &&
        tracking === -0.045
    // Prior sell default 72 Black — bump locked instances to impact size.
    const isLegacySell72 =
        size === 72 &&
        (weight === 900 || weight === 800) &&
        (tracking === -0.055 || tracking === -0.05)

    // Prior desktop preset used 0.96 leading — clips Black glyphs under overflow:hidden.
    const isTightLeading = lineHeight === 0.96

    if (!isLegacySmall && !isLegacySell72 && !isTightLeading) return merged

    return {
        ...merged,
        fontSize:
            isLegacySmall || isLegacySell72
                ? DEFAULT_FONT.fontSize
                : merged.fontSize,
        fontWeight:
            isLegacySmall || isLegacySell72
                ? DEFAULT_FONT.fontWeight
                : merged.fontWeight,
        letterSpacing:
            isLegacySmall || isLegacySell72
                ? DEFAULT_FONT.letterSpacing
                : merged.letterSpacing,
        lineHeight: DEFAULT_FONT.lineHeight,
    }
}

function trackingCss(base: unknown, openExtra: number, open: boolean): string {
    const baseEm = parseTrackingEm(base, -0.06)
    return `${open ? baseEm + openExtra : baseEm}em`
}

function PeekWordEl(props: {
    instanceKey: string
    rowIndex: number
    label: string
    peek: FramerImage
    peek2: FramerImage
    link: string | undefined
    open: boolean
    look: LookCtrl
    transition: Transition
    freeze: boolean
    reducedMotion: boolean
    interactive: boolean
    keyboardInteractive: boolean
    finePointer: boolean
    openInNewTab: boolean
    onEnter: (instanceKey: string, rowIndex: number) => void
    onLeave: (rowIndex: number) => void
}) {
    const {
        instanceKey,
        rowIndex,
        label,
        peek,
        peek2,
        link,
        open,
        look,
        transition,
        freeze,
        reducedMotion,
        interactive,
        keyboardInteractive,
        finePointer,
        openInNewTab,
        onEnter,
        onLeave,
    } = props

    const linked = hasLink(link)
    const weight = look.font.fontWeight ?? 900
    const peekN = Math.max(1, Math.min(2, Math.round(look.peekCount)))
    const layout =
        PEEK_LAYOUTS[hashLabel(label) % PEEK_LAYOUTS.length] ?? PEEK_LAYOUTS[0]
    const windows = layout.slice(0, peekN)
    const images = [peek, peek2]
    const chars = Array.from(label)
    const anchorIndices = resolveAnchorIndices(label)
    const customDuration =
        typeof transition?.duration === "number"
            ? transition.duration
            : PEEK_ENTER_MS
    const enterS = Math.max(customDuration, PEEK_ENTER_MS)
    const leaveS = Math.min(customDuration, PEEK_LEAVE_MS)
    const leaveMs = Math.round(
        (reducedMotion ? 0.14 : leaveS) * 1000
    )
    const enterMs = Math.round(
        (reducedMotion ? 0.14 : enterS) * 1000 + (peekN - 1) * 45 + 40
    )

    // Heavy weave DOM only while open (and briefly on close for exit tween).
    // Enter uses CSS @starting-style — no double-rAF peekOpen.
    const [weave, setWeave] = useState(open)
    const [willPromote, setWillPromote] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        if (open) {
            setWeave(true)
            if (freeze || reducedMotion) {
                setWillPromote(false)
                return
            }
            setWillPromote(true)
            const t = window.setTimeout(() => setWillPromote(false), enterMs)
            return () => window.clearTimeout(t)
        }
        if (freeze) {
            setWeave(false)
            setWillPromote(false)
            return
        }
        if (!reducedMotion) setWillPromote(true)
        const t = window.setTimeout(() => {
            setWeave(false)
            setWillPromote(false)
        }, leaveMs)
        return () => window.clearTimeout(t)
    }, [open, freeze, reducedMotion, leaveMs, enterMs])

    const showWeave = open || weave

    const baseType: CSSProperties = {
        ...look.font,
        fontWeight: weight,
        whiteSpace: "nowrap",
        display: "inline-block",
        lineHeight: look.font.lineHeight ?? 1.05,
    }

    const openTrack = trackingCss(
        look.font.letterSpacing,
        look.openTracking,
        true
    )

    const onKeyDown = (e: KeyboardEvent) => {
        if (!keyboardInteractive) return
        if (e.key === "Escape") {
            e.preventDefault()
            onLeave(rowIndex)
            ;(e.currentTarget as HTMLElement).blur()
            return
        }
        if (!linked && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onEnter(instanceKey, rowIndex)
        }
    }

    const onClick = (e: MouseEvent) => {
        if (!interactive) return
        if (finePointer) {
            if (!linked) return
            onEnter(instanceKey, rowIndex)
            e.stopPropagation()
            return
        }
        e.preventDefault()
        e.stopPropagation()
        if (open) onLeave(rowIndex)
        else onEnter(instanceKey, rowIndex)
    }

    const ariaLabel = open
        ? `${label}, previewing ${peek.alt || "related work"}`
        : label

    const shellStyle: CSSProperties = {
        position: "relative",
        display: "inline-block",
        cursor: interactive ? "pointer" : "default",
        outline: "none",
        textDecoration: "none",
        color: "inherit",
        verticalAlign: "baseline",
        overflow: "visible",
        isolation: "isolate",
        transformOrigin: "center center",
    }

    const peekTransition = freeze
        ? undefined
        : reducedMotion
          ? `opacity 140ms ${EASE_OUT_CSS}`
          : `clip-path ${open ? enterS : leaveS}s ${EASE_OUT_CSS}, opacity ${open ? enterS : leaveS}s ${EASE_OUT_CSS}, transform ${open ? enterS : leaveS}s ${EASE_OUT_CSS}`

    const layers = !showWeave ? (
        <span
            style={{
                ...baseType,
                letterSpacing: openTrack,
                color: look.solidColor,
                WebkitTextFillColor: look.solidColor,
            }}
        >
            {label}
        </span>
    ) : (
        <>
            <span
                aria-hidden
                style={{
                    ...baseType,
                    letterSpacing: openTrack,
                    visibility: "hidden",
                    pointerEvents: "none",
                    display: "inline-flex",
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={`ghost-${i}`}
                        style={{ display: "inline-block" }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                ))}
            </span>

            <span
                aria-hidden
                data-tp-base=""
                style={{
                    ...baseType,
                    letterSpacing: openTrack,
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: open ? look.accent : look.solidColor,
                    WebkitTextFillColor: open ? look.accent : look.solidColor,
                    pointerEvents: "none",
                    transition: freeze
                        ? undefined
                        : reducedMotion
                          ? `color 160ms ${EASE_OUT_CSS}`
                          : `color ${open ? enterS : leaveS}s ${EASE_OUT_CSS}`,
                }}
            >
                {chars.map((char, letterIndex) => {
                    const anchoredWindows = windows
                        .map((window, windowIndex) => ({
                            window,
                            windowIndex,
                            anchorIndex:
                                anchorIndices[windowIndex] ?? anchorIndices[0],
                        }))
                        .filter(
                            ({ anchorIndex }) => anchorIndex === letterIndex
                        )
                    const anchorZ =
                        anchoredWindows.length > 0
                            ? 3 +
                              Math.max(
                                  ...anchoredWindows.map(
                                      ({ windowIndex }) => windowIndex
                                  )
                              )
                            : 1

                    return (
                        <span
                            key={`letter-${letterIndex}`}
                            data-tp-letter=""
                            data-tp-anchor={
                                anchoredWindows.length > 0
                                    ? "true"
                                    : undefined
                            }
                            style={{
                                position: "relative",
                                display: "inline-block",
                                zIndex: anchorZ,
                                isolation:
                                    anchoredWindows.length > 0
                                        ? "isolate"
                                        : undefined,
                                overflow: "visible",
                            }}
                        >
                            {char === " " ? "\u00A0" : char}

                            {anchoredWindows.map(
                                ({ window: w, windowIndex }) => {
                                    const snap = freeze || reducedMotion
                                    return (
                                        <span
                                            key={`peek-win-${windowIndex}`}
                                            aria-hidden
                                            className="tp-peek"
                                            data-tp-window=""
                                            data-tp-window-i={windowIndex}
                                            data-open={
                                                open ? "true" : "false"
                                            }
                                            style={
                                                {
                                                    position: "absolute",
                                                    left: w.left,
                                                    top: w.top,
                                                    width: `${w.widthEm}em`,
                                                    height: `${w.heightEm}em`,
                                                    zIndex: -1,
                                                    pointerEvents: "none",
                                                    overflow: "hidden",
                                                    borderRadius: 0,
                                                    transformOrigin:
                                                        "left center",
                                                    ...(snap
                                                        ? {
                                                              clipPath:
                                                                  reducedMotion
                                                                      ? undefined
                                                                      : open
                                                                        ? "inset(0% 0% 0% 0%)"
                                                                        : "inset(0% 100% 0% 0%)",
                                                              opacity: open
                                                                  ? 1
                                                                  : 0,
                                                              transform:
                                                                  reducedMotion
                                                                      ? undefined
                                                                      : open
                                                                        ? "translate3d(0px, 0px, 0)"
                                                                        : "translate3d(-8px, 0px, 0)",
                                                          }
                                                        : {
                                                              ["--tp-scale" as string]:
                                                                  String(
                                                                      w.scale
                                                                  ),
                                                              willChange:
                                                                  willPromote
                                                                      ? "clip-path, transform, opacity"
                                                                      : "auto",
                                                              transition:
                                                                  peekTransition,
                                                              transitionDelay:
                                                                  open
                                                                      ? `${windowIndex * 45}ms`
                                                                      : `${windowIndex * 18}ms`,
                                                          }),
                                                } as CSSProperties
                                            }
                                        >
                                            <img
                                                alt=""
                                                aria-hidden
                                                data-tp-peek-img=""
                                                decoding="async"
                                                draggable={false}
                                                src={
                                                    images[windowIndex]
                                                        ?.src ?? peek.src
                                                }
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "block",
                                                    objectFit: "cover",
                                                    objectPosition: w.bgPos,
                                                    transformOrigin:
                                                        "left center",
                                                    transform: `scale(${
                                                        snap || open
                                                            ? w.scale
                                                            : w.scale + 0.1
                                                    })`,
                                                    transition: snap
                                                        ? undefined
                                                        : `transform ${open ? enterS : leaveS}s ${EASE_OUT_CSS}`,
                                                    transitionDelay: snap
                                                        ? undefined
                                                        : open
                                                          ? `${windowIndex * 45 + 20}ms`
                                                          : undefined,
                                                    pointerEvents: "none",
                                                    userSelect: "none",
                                                }}
                                            />
                                        </span>
                                    )
                                }
                            )}
                        </span>
                    )
                })}
            </span>
        </>
    )

    const hoverHandlers = interactive && finePointer
    const shellProps = {
        "data-tp-word": "",
        "data-tp-instance": instanceKey,
        "data-active": open ? "true" : "false",
        "data-tp-mask-peek": open ? "open" : "closed",
        onPointerEnter: hoverHandlers
            ? () => onEnter(instanceKey, rowIndex)
            : undefined,
        onPointerLeave: hoverHandlers ? () => onLeave(rowIndex) : undefined,
        onFocus: keyboardInteractive
            ? () => onEnter(instanceKey, rowIndex)
            : undefined,
        onBlur: keyboardInteractive ? () => onLeave(rowIndex) : undefined,
        onKeyDown,
        onClick: interactive ? onClick : undefined,
        style: shellStyle,
    }

    if (linked && interactive) {
        return (
            <a
                {...shellProps}
                href={link}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                aria-label={ariaLabel}
                tabIndex={keyboardInteractive ? undefined : -1}
            >
                {layers}
            </a>
        )
    }

    return (
        <span
            {...shellProps}
            role={keyboardInteractive ? "button" : undefined}
            tabIndex={keyboardInteractive ? 0 : undefined}
            aria-pressed={keyboardInteractive ? open : undefined}
            aria-label={ariaLabel}
        >
            {layers}
        </span>
    )
}

const PeekWord = memo(PeekWordEl)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 420
 */
export default function TypePeek(props: TypePeekProps) {
    const isStatic = useIsStaticRenderer()
    const reducedMotion = !!useReducedMotion()
    const freeze = isStatic
    const finePointer = useFinePointer()
    const rootRef = useRef<HTMLDivElement>(null)
    // Live starts off-view so first IO hit can drive intro; canvas is settled.
    const [inView, setInView] = useState(freeze)
    const [introPlayed, setIntroPlayed] = useState(freeze)
    const [tabHidden, setTabHidden] = useState(false)

    const separatorKind =
        props.content?.separator ?? props.separator ?? DEFAULT_CONTENT.separator
    const sepGlyph = resolveSeparator(
        separatorKind,
        props.content?.customSeparator ??
            props.customSeparator ??
            DEFAULT_CONTENT.customSeparator
    )
    const look: LookCtrl = useMemo(() => {
        const rawDim = props.look?.dimOpacity ?? DEFAULT_LOOK.dimOpacity
        const migratedDim = rawDim === 0.4 ? DEFAULT_LOOK.dimOpacity : rawDim
        const rawAccent = props.look?.accent ?? DEFAULT_LOOK.accent
        // Migrate locked house-cyan instances to Type Peek coral ember.
        const accent =
            rawAccent === "#6FD3FF" ||
            rawAccent === "rgb(111, 211, 255)" ||
            rawAccent === "rgb(111,211,255)"
                ? DEFAULT_LOOK.accent
                : rawAccent
        const rawMuted = props.look?.mutedColor ?? DEFAULT_LOOK.mutedColor
        // Legacy muted was resting type at 0.78 — now Solid owns resting words.
        const mutedColor =
            rawMuted === "rgba(242,242,242,0.78)" ||
            rawMuted === "rgba(242, 242, 242, 0.78)"
                ? DEFAULT_LOOK.mutedColor
                : rawMuted
        return {
            ...DEFAULT_LOOK,
            ...props.look,
            accent,
            mutedColor,
            solidColor: props.look?.solidColor ?? DEFAULT_LOOK.solidColor,
            font: resolveFontStyle(props.look?.font),
            peekCount: Math.max(
                1,
                Math.min(2, Math.round(props.look?.peekCount ?? 2))
            ),
            openTracking: Math.max(
                0,
                Math.min(
                    0.1,
                    props.look?.openTracking ?? DEFAULT_LOOK.openTracking
                )
            ),
            dimOpacity: Math.max(0.1, Math.min(0.85, migratedDim)),
        }
    }, [props.look])

    const transition =
        props.motion?.transition ??
        props.transition ??
        DEFAULT_MOTION.transition
    const openInNewTab =
        props.content?.openInNewTab ??
        props.openInNewTab ??
        DEFAULT_CONTENT.openInNewTab
    const pauseOnHover = props.ticker?.pauseOnHover ?? DEFAULT_TICKER.pauseOnHover
    const ticker: TickerCtrl = {
        ...DEFAULT_TICKER,
        ...props.ticker,
        rows: Math.max(
            1,
            Math.min(4, Math.round(props.ticker?.rows ?? DEFAULT_TICKER.rows))
        ),
        duration: Math.max(
            8,
            Math.min(
                60,
                props.ticker?.duration ?? DEFAULT_TICKER.duration
            )
        ),
        pauseOnHover,
    }
    const onPeekRef = useRef(props.onPeek)
    onPeekRef.current = props.onPeek

    const rawWords =
        props.content?.words?.length > 0
            ? props.content.words
            : DEFAULT_CONTENT.words
    const words = rawWords.filter((w) => (w.label ?? "").trim().length > 0)
    const safeWords = words.length > 0 ? words : DEFAULT_CONTENT.words
    const previewIndex =
        props.preview?.activeIndex ??
        props.content?.activeIndex ??
        DEFAULT_PREVIEW.activeIndex
    const activeIndex = Math.max(
        0,
        Math.min(safeWords.length - 1, previewIndex)
    )
    const style = props.style
    const fallbacks = PEEKS
    const wordsKey = safeWords.map((w) => w.label.trim()).join("\0")
    const peekSrcKey = safeWords
        .map((w) => `${w.peek?.src ?? ""}\t${w.peek2?.src ?? ""}`)
        .join("\0")
    const peekSrcs = useMemo(() => {
        const srcs: string[] = []
        safeWords.forEach((w, i) => {
            const a = resolveImage(
                w.peek,
                fallbacks[i % fallbacks.length] ?? PEEKS[0]!
            )
            const b = resolveImage(
                w.peek2,
                fallbacks[(i + 1) % fallbacks.length] ?? PEEKS[1]!
            )
            srcs.push(a.src, b.src)
        })
        return Array.from(new Set(srcs.filter(Boolean)))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [peekSrcKey, wordsKey])
    const rows = useMemo(
        () => splitIntoRows(safeWords, ticker.rows),
        // wordsKey captures label identity without depending on a fresh array each render
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [wordsKey, ticker.rows]
    )
    const [rowRepeats, setRowRepeats] = useState<number[]>(() =>
        rows.map((row) =>
            Math.min(
                MAX_ROW_REPEATS,
                Math.max(2, Math.ceil(6 / Math.max(1, row.length)))
            )
        )
    )
    const rowRepeatsRef = useRef(rowRepeats)
    rowRepeatsRef.current = rowRepeats

    const [hoverKey, setHoverKey] = useState<string | null>(null)
    const [pausedRow, setPausedRow] = useState<number | null>(null)
    const interactive = !isStatic
    const anyHover = hoverKey !== null && !isStatic

    const onWordEnter = useCallback(
        (instanceKey: string, rowIndex: number) => {
            startTransition(() => {
                setHoverKey(instanceKey)
                if (pauseOnHover) setPausedRow(rowIndex)
            })
            onPeekRef.current?.()
        },
        [pauseOnHover]
    )

    const onWordLeave = useCallback((rowIndex: number) => {
        startTransition(() => {
            setHoverKey(null)
            setPausedRow((current) => (current === rowIndex ? null : current))
        })
    }, [])

    function wordInstanceKey(
        rowIndex: number,
        copyIndex: number,
        slot: number
    ) {
        return `${rowIndex}:${copyIndex}:${slot}`
    }

    // Keep each ticker group at least as wide as the viewport so the strip never goes empty.
    useLayoutEffect(() => {
        if (typeof window === "undefined") return
        const root = rootRef.current
        if (!root) return

        let raf = 0
        const measure = () => {
            const rowEls = root.querySelectorAll<HTMLElement>(
                "[data-tp-ticker-row]"
            )
            // Batch all layout reads, then a single state write.
            const reads = rows.map((row, i) => {
                const el = rowEls[i]
                const prev = rowRepeatsRef.current[i] ?? 3
                if (!el || row.length === 0) {
                    return { i, next: prev }
                }
                const containerW = el.clientWidth
                const group = el.querySelector<HTMLElement>(
                    "[data-tp-ticker-group]"
                )
                if (!group || containerW <= 0) {
                    return { i, next: prev }
                }
                const unitW = group.offsetWidth / Math.max(1, prev)
                if (unitW <= 1) return { i, next: prev }
                return {
                    i,
                    next: Math.min(
                        MAX_ROW_REPEATS,
                        Math.max(2, Math.ceil((containerW * 1.08) / unitW))
                    ),
                }
            })
            const next = reads.map((r) => r.next)
            const changed =
                next.length !== rowRepeatsRef.current.length ||
                next.some((n, i) => n !== rowRepeatsRef.current[i])
            if (changed) setRowRepeats(next)
        }

        const scheduleMeasure = () => {
            if (raf) return
            raf = window.requestAnimationFrame(() => {
                raf = 0
                measure()
            })
        }

        measure()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => scheduleMeasure())
                : null
        ro?.observe(root)
        window.addEventListener("resize", scheduleMeasure)
        return () => {
            if (raf) window.cancelAnimationFrame(raf)
            ro?.disconnect()
            window.removeEventListener("resize", scheduleMeasure)
        }
    }, [rows, look.gap, sepGlyph, safeWords.length, ticker.rows])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        const onVisibility = () => {
            setTabHidden(document.visibilityState === "hidden")
        }
        onVisibility()
        document.addEventListener("visibilitychange", onVisibility)

        const root = rootRef.current
        let observer: IntersectionObserver | null = null
        if (root && typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    setInView(entry ? entry.isIntersecting : true)
                },
                { threshold: 0, rootMargin: "50px" }
            )
            observer.observe(root)
        } else {
            setInView(true)
        }

        return () => {
            document.removeEventListener("visibilitychange", onVisibility)
            observer?.disconnect()
        }
    }, [isStatic])

    // Cold hover was fetching peeks only when weave mounted — warm cache in view.
    useEffect(() => {
        if (isStatic || !inView || tabHidden) return
        return preloadPeekSrcs(peekSrcs)
    }, [isStatic, inView, tabHidden, peekSrcs])

    // One-shot field entrance when the block first enters view.
    useEffect(() => {
        if (freeze) {
            if (!introPlayed) setIntroPlayed(true)
            return
        }
        if (inView && !introPlayed) {
            startTransition(() => setIntroPlayed(true))
        }
    }, [freeze, inView, introPlayed])

    const rootStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 320,
        boxSizing: "border-box",
        background: look.background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 12px",
        ...style,
        // Lock after Framer style so max-content ticker never paints a page scrollbar.
        overflow: "hidden",
        maxWidth: "100%",
    }

    const fieldStyle: CSSProperties = {
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
        gap: look.gap,
        textAlign: "center",
        overflow: "hidden",
        ...look.font,
        fontWeight: look.font.fontWeight ?? 900,
        letterSpacing: look.font.letterSpacing ?? "-0.055em",
    }

    const sepStyle: CSSProperties = {
        flex: "0 0 auto",
        display: "inline-block",
        color: look.mutedColor,
        WebkitTextFillColor: look.mutedColor,
        letterSpacing: "normal",
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "pre",
    }

    function renderTickerGroup(
        row: IndexedWord[],
        rowIndex: number,
        copyIndex: number
    ) {
        return (
            <div
                key={`row-${rowIndex}-copy-${copyIndex}`}
                aria-hidden={copyIndex > 0 ? true : undefined}
                data-tp-ticker-group=""
                style={{
                    flex: "0 0 auto",
                    display: "flex",
                    alignItems: "baseline",
                    gap: look.gap,
                    paddingRight: Math.max(24, look.gap * 3),
                }}
            >
                {row.map(({ word: w, index: i }, slot) => {
                    const key = wordInstanceKey(rowIndex, copyIndex, slot)
                    const firstSlotForWord = row.findIndex(
                        (item) => item.index === i
                    )
                    const open = freeze
                        ? copyIndex === 0 &&
                          i === activeIndex &&
                          slot === firstSlotForWord
                        : hoverKey === key
                    const peek = resolveImage(
                        w.peek,
                        fallbacks[i % fallbacks.length] ?? PEEKS[0]!
                    )
                    const peek2 = resolveImage(
                        w.peek2,
                        fallbacks[(i + 1) % fallbacks.length] ?? PEEKS[1]!
                    )
                    const label = w.label.trim()

                    return (
                        <span
                            key={`${label}-${i}-s${slot}-c${copyIndex}`}
                            data-tp-chip=""
                            data-open={open ? "true" : "false"}
                            style={{
                                flex: "0 0 auto",
                                display: "inline-flex",
                                alignItems: "baseline",
                                gap: look.gap,
                            }}
                        >
                            <span
                                data-tp-unit=""
                                style={{
                                    flex: "0 0 auto",
                                    overflow: "visible",
                                }}
                            >
                                <PeekWord
                                    instanceKey={key}
                                    rowIndex={rowIndex}
                                    label={label}
                                    peek={peek}
                                    peek2={peek2}
                                    link={w.link}
                                    open={open}
                                    look={look}
                                    transition={transition}
                                    freeze={freeze}
                                    reducedMotion={reducedMotion}
                                    interactive={interactive}
                                    keyboardInteractive={
                                        interactive &&
                                        copyIndex === 0 &&
                                        slot === firstSlotForWord
                                    }
                                    finePointer={finePointer}
                                    openInNewTab={openInNewTab}
                                    onEnter={onWordEnter}
                                    onLeave={onWordLeave}
                                />
                            </span>
                            {sepGlyph !== null ? (
                                <span
                                    data-tp-sep=""
                                    data-sep={separatorKind}
                                    aria-hidden
                                    style={sepStyle}
                                >
                                    {sepGlyph}
                                </span>
                            ) : null}
                        </span>
                    )
                })}
            </div>
        )
    }

    return (
        <div ref={rootRef} style={rootStyle} data-tp-root="">
            {!isStatic ? (
                <style>{`
                    [data-tp-word]:focus-visible {
                        outline: 2px solid ${look.accent};
                        outline-offset: 6px;
                        border-radius: 2px;
                    }
                    [data-tp-word] {
                        transition: transform 120ms ${EASE_OUT_CSS};
                    }
                    [data-tp-word]:active {
                        transform: scale(0.97);
                    }
                    [data-tp-field][data-tp-dimming] [data-tp-chip] {
                        opacity: ${look.dimOpacity};
                        transition: opacity 220ms ${EASE_OUT_CSS};
                    }
                    [data-tp-field][data-tp-dimming] [data-tp-chip][data-open="true"] {
                        opacity: 1;
                    }
                    ${
                        reducedMotion
                            ? ""
                            : `
                    /* L→R peek enter: first paint closed via @starting-style, then open. */
                    .tp-peek[data-open="true"] {
                        clip-path: inset(0% 0% 0% 0%);
                        opacity: 1;
                        transform: translate3d(0px, 0px, 0);
                    }
                    .tp-peek[data-open="false"] {
                        clip-path: inset(0% 100% 0% 0%);
                        opacity: 0;
                        transform: translate3d(-8px, 0px, 0);
                    }
                    @starting-style {
                        .tp-peek[data-open="true"] {
                            clip-path: inset(0% 100% 0% 0%);
                            opacity: 0;
                            transform: translate3d(-8px, 0px, 0);
                        }
                        .tp-peek[data-open="true"] [data-tp-peek-img] {
                            transform: scale(calc(var(--tp-scale, 1) + 0.1));
                        }
                    }
                    @media (hover: hover) and (pointer: fine) {
                        [data-tp-word][data-active="true"] {
                            transform: scale(1.012);
                            transition-duration: 160ms;
                        }
                    }
                    @keyframes typePeekTickerLeft {
                        from { transform: translate3d(0, 0, 0); }
                        to { transform: translate3d(-50%, 0, 0); }
                    }
                    @keyframes typePeekTickerRight {
                        from { transform: translate3d(-50%, 0, 0); }
                        to { transform: translate3d(0, 0, 0); }
                    }
                    `
                    }
                `}</style>
            ) : null}
            <div
                style={fieldStyle}
                data-tp-field=""
                data-tp-dimming={anyHover ? "" : undefined}
                role="group"
                aria-label="Type peek tickers"
            >
                {rows.map((row, rowIndex) => {
                    const direction =
                        ticker.alternate && rowIndex % 2 === 1
                            ? "right"
                            : "left"
                    const canRun = !freeze && !reducedMotion
                    const duration = ticker.duration * (1 + rowIndex * 0.08)
                    const paused =
                        (ticker.pauseOnHover && pausedRow === rowIndex) ||
                        tabHidden ||
                        !inView
                    const filled = expandRowForFill(
                        row,
                        rowRepeats[rowIndex] ?? 2
                    )
                    const introSettled = freeze || introPlayed
                    const introDelay = freeze || reducedMotion ? 0 : rowIndex * 50

                    return (
                        <div
                            key={`ticker-row-${rowIndex}`}
                            data-tp-ticker-row=""
                            data-direction={direction}
                            data-tp-repeats={rowRepeats[rowIndex] ?? 2}
                            style={{
                                position: "relative",
                                width: "100%",
                                maxWidth: "100%",
                                overflow: "hidden",
                                paddingBlock: "0.34em",
                                marginBlock: "-0.08em",
                                opacity: introSettled ? 1 : 0,
                                transform:
                                    introSettled || reducedMotion
                                        ? "none"
                                        : "translate3d(0px, 10px, 0)",
                                transition: freeze
                                    ? undefined
                                    : reducedMotion
                                      ? `opacity 160ms ${EASE_OUT_CSS}`
                                      : `opacity ${INTRO_T_MS}ms ${EASE_OUT_CSS}, transform ${INTRO_T_MS}ms ${EASE_OUT_CSS}`,
                                transitionDelay: freeze
                                    ? undefined
                                    : `${introDelay}ms`,
                            }}
                        >
                            <div
                                data-tp-ticker-track=""
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    width: "max-content",
                                    animation: canRun
                                        ? `${direction === "left" ? "typePeekTickerLeft" : "typePeekTickerRight"} ${duration}s linear infinite`
                                        : "none",
                                    animationDelay: canRun
                                        ? `${-rowIndex * 2.4}s`
                                        : undefined,
                                    animationPlayState: paused
                                        ? "paused"
                                        : "running",
                                }}
                            >
                                {renderTickerGroup(filled, rowIndex, 0)}
                                {renderTickerGroup(filled, rowIndex, 1)}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

TypePeek.displayName = "Type Peek"

addPropertyControls(TypePeek, {
    content: {
        type: ControlType.Object,
        title: "Content",
        optional: false,
        icon: "object",
        description: "Words, separators, and link behavior",
        controls: {
            words: {
                type: ControlType.Array,
                title: "Words",
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: {
                            type: ControlType.String,
                            title: "Label",
                            defaultValue: "Word",
                        },
                        peek: {
                            type: ControlType.ResponsiveImage,
                            title: "Image 1",
                        },
                        peek2: {
                            type: ControlType.ResponsiveImage,
                            title: "Image 2",
                        },
                        link: {
                            type: ControlType.Link,
                            title: "Link",
                        },
                    },
                },
                defaultValue: DEFAULT_FIELD_WORDS,
                maxCount: 24,
                description: "Label · peek images · optional link",
            },
            separator: {
                type: ControlType.Enum,
                title: "Separator",
                options: [
                    "comma",
                    "middot",
                    "slash",
                    "dash",
                    "pipe",
                    "space",
                    "none",
                    "custom",
                ],
                optionTitles: [
                    "Comma ,",
                    "Dot ·",
                    "Slash /",
                    "Dash —",
                    "Pipe |",
                    "Space",
                    "None",
                    "Custom",
                ],
                defaultValue: DEFAULT_CONTENT.separator,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            customSeparator: {
                type: ControlType.String,
                title: "Custom",
                defaultValue: DEFAULT_CONTENT.customSeparator,
                hidden: (p) => p.separator !== "custom",
                placeholder: "e.g. ··· or +",
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "Links",
                defaultValue: DEFAULT_CONTENT.openInNewTab,
                enabledTitle: "New Tab",
                disabledTitle: "Same Tab",
                description: "How word links open",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        optional: false,
        icon: "color",
        description: "Colors and type · transparent bg for Kern page atmosphere",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_LOOK.background,
                description: "Prefer transparent · page atmosphere shows through",
            },
            solidColor: {
                type: ControlType.Color,
                title: "Solid",
                defaultValue: DEFAULT_LOOK.solidColor,
                description: "Resting word color · opaque glyphs above peeks",
            },
            mutedColor: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: DEFAULT_LOOK.mutedColor,
                description: "Separators between words",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULT_LOOK.accent,
                description: "Open word + focus ring · coral ember",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "104px",
                    variant: "Black",
                    letterSpacing: "-0.06em",
                    lineHeight: "1.05em",
                },
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 4,
                max: 48,
                step: 1,
                defaultValue: DEFAULT_LOOK.gap,
                unit: "px",
            },
            dimOpacity: {
                type: ControlType.Number,
                title: "Dim",
                min: 0.15,
                max: 0.85,
                step: 0.05,
                defaultValue: DEFAULT_LOOK.dimOpacity,
                description: "Neighbor opacity while one word is open",
            },
            openTracking: {
                type: ControlType.Number,
                title: "Open Track",
                min: 0,
                max: 0.1,
                step: 0.005,
                defaultValue: DEFAULT_LOOK.openTracking,
                unit: "em",
                description: "Subtle type opening over the media crops",
            },
            peekCount: {
                type: ControlType.Number,
                title: "Windows",
                min: 1,
                max: 2,
                step: 1,
                defaultValue: DEFAULT_LOOK.peekCount,
                displayStepper: true,
                description: "Saviour-style photo windows behind type",
            },
        },
    },
    ticker: {
        type: ControlType.Object,
        title: "Ticker",
        optional: false,
        icon: "effect",
        description: "Seamless duplicated lanes",
        controls: {
            rows: {
                type: ControlType.Number,
                title: "Rows",
                min: 1,
                max: 4,
                step: 1,
                defaultValue: DEFAULT_TICKER.rows,
                displayStepper: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 8,
                max: 60,
                step: 1,
                unit: "s",
                defaultValue: DEFAULT_TICKER.duration,
            },
            alternate: {
                type: ControlType.Boolean,
                title: "Alternate",
                defaultValue: DEFAULT_TICKER.alternate,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: DEFAULT_TICKER.pauseOnHover,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        optional: false,
        icon: "interaction",
        description: "Peek enter / leave timing",
        controls: {
            transition: {
                type: ControlType.Transition,
                title: "Peek",
                defaultValue: DEFAULT_TRANSITION,
                description: "Crop reveal timing (floor 280ms enter)",
            },
        },
    },
    onPeek: {
        type: ControlType.EventHandler,
        title: "On Peek",
        description: "Fires when a word opens the peek",
    },
    preview: {
        type: ControlType.Object,
        title: "Preview",
        optional: false,
        icon: "interaction",
        description: BUILTBYKERN_BRAND,
        controls: {
            activeIndex: {
                type: ControlType.Number,
                title: "Active",
                min: 0,
                max: 23,
                step: 1,
                defaultValue: DEFAULT_PREVIEW.activeIndex,
                displayStepper: true,
                description:
                    "Canvas and Export only · Preview uses hover or tap",
            },
        },
    },
})
