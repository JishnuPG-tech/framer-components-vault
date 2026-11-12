import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Pixel Dissolve Button
 * Bordered mono button with an arrow. On hover, the "hover" colour set
 * dissolves in through a grid of square cells. At the same time (same
 * duration) the label rolls up inside a mask and the arrow slides out to the
 * right while a copy slides in from the left.
 *
 * Works with mouse, pen, touch and keyboard. Respects reduced-motion.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Direction = "left" | "right" | "top" | "bottom" | "diagonal" | "random"
type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut"

const EASE: Record<Easing, (t: number) => number> = {
    linear: (t) => t,
    easeIn: (t) => t * t,
    easeOut: (t) => 1 - (1 - t) * (1 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
}

/* ------------------------------------------------------------------ */
/* Fixed defaults (no longer exposed in the properties panel)          */
/* ------------------------------------------------------------------ */
const PIXEL = {
    cellSize: 8,
    cellFade: 0.45,
    randomness: 0.35,
    steps: 4,
    easing: "linear" as Easing,
    previewHover: false,
}

// Max pixels of the mask bitmap. Keeps big buttons light on phones.
const MAX_MASK_PIXELS = 260000

// Easing for the text roll + arrow slide (runs on the same clock as the dissolve).
const ROLL_EASE = (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2

// Same stack on every browser/OS, so the default look never depends on the
// browser's built-in <button> font.
const MONO_STACK =
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Courier New", monospace'

function mulberry32(seed: number) {
    let a = seed
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
interface LabelProps {
    text: string
    font: React.CSSProperties
    padding: string
    link: string
    newTab: boolean
}

interface ColorProps {
    background: string
    text: string
    border: string
    hoverBackground: string
    hoverText: string
    hoverBorder: string
}

interface LayoutProps {
    showArrow: boolean
    arrowSize: number
    arrowStroke: number
    gap: number
    borderWidth: number
    radius: number
    duration: number
    direction: Direction
}

interface Props {
    label: LabelProps
    colors: ColorProps
    layout: LayoutProps
    onClick?: (e: React.MouseEvent) => void
    style?: React.CSSProperties
}

const DEFAULT_LABEL: LabelProps = {
    text: "Explore the Library",
    font: { fontFamily: MONO_STACK, fontSize: 18 },
    padding: "22px 18px",
    link: "",
    newTab: false,
}

const DEFAULT_COLORS: ColorProps = {
    background: "#FB460D",
    text: "#FFFFFF",
    border: "#FB460D",
    hoverBackground: "#F0F0F0",
    hoverText: "#151515",
    hoverBorder: "#BFBFBA",
}

const DEFAULT_LAYOUT: LayoutProps = {
    showArrow: true,
    arrowSize: 17,
    arrowStroke: 1.25,
    gap: 20,
    borderWidth: 1,
    radius: 4,
    duration: 0.6,
    direction: "left",
}

interface Colors {
    bg: string
    text: string
    border: string
}

/** Flat config used by the renderer + animation engine. */
interface Config extends LabelProps, LayoutProps {
    cellSize: number
    cellFade: number
    randomness: number
    steps: number
    easing: Easing
}

function Arrow({
    size,
    stroke,
    style,
}: {
    size: number
    stroke: number
    style?: React.CSSProperties
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="square"
            style={{ display: "block", flexShrink: 0, ...style }}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M1.5 8h13M9.5 3l5 5-5 5" />
        </svg>
    )
}

/**
 * Both effects read one CSS variable, --p (0 = rest, 1 = hovered), which the
 * animation loop updates on the root every frame. Same clock as the dissolve.
 */

// Label: rolls up out of an overflow-hidden mask, a copy rolls in from below.
function RollText({ text }: { text: string }) {
    const pad = "0.15em"
    return (
        <span
            style={{
                position: "relative",
                display: "inline-block",
                overflow: "hidden",
                minWidth: 0,
                verticalAlign: "top",
                padding: `${pad} 0`,
                margin: `-${pad} 0`,
            }}
        >
            <span
                style={{
                    display: "block",
                    transform: "translate3d(0, calc(var(--p, 0) * -120%), 0)",
                    willChange: "transform",
                }}
            >
                {text}
            </span>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    top: pad,
                    display: "block",
                    whiteSpace: "nowrap",
                    transform:
                        "translate3d(0, calc((1 - var(--p, 0)) * 120%), 0)",
                    willChange: "transform",
                }}
            >
                {text}
            </span>
        </span>
    )
}

// Arrow: slides out to the right, a copy slides in from the left (masked).
function RollArrow({ size, stroke }: { size: number; stroke: number }) {
    return (
        <span
            style={{
                position: "relative",
                display: "block",
                width: size,
                height: size,
                flexShrink: 0,
                overflow: "hidden",
            }}
        >
            <Arrow
                size={size}
                stroke={stroke}
                style={{
                    transform: "translate3d(calc(var(--p, 0) * 100%), 0, 0)",
                    willChange: "transform",
                }}
            />
            <Arrow
                size={size}
                stroke={stroke}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transform:
                        "translate3d(calc((1 - var(--p, 0)) * -100%), 0, 0)",
                    willChange: "transform",
                }}
            />
        </span>
    )
}

function Layer({
    p,
    c,
    layerRef,
    hidden,
}: {
    p: Config
    c: Colors
    layerRef?: React.Ref<HTMLSpanElement>
    hidden?: boolean
}) {
    return (
        <span
            ref={layerRef}
            aria-hidden={hidden ? true : undefined}
            style={{
                // Rest layer sits in normal flow so it defines the button's
                // "Fit" size; the hover layer is overlaid on top of it.
                ...(hidden
                    ? { position: "absolute", inset: 0 }
                    : { position: "relative", flex: 1, minWidth: 0 }),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: p.gap,
                padding: p.padding,
                boxSizing: "border-box",
                background: c.bg,
                color: c.text,
                border: `${p.borderWidth}px solid ${c.border}`,
                borderRadius: p.radius,
                pointerEvents: "none",
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
                lineHeight: 1.2,
                fontFamily: MONO_STACK,
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                WebkitTextSizeAdjust: "100%",
                textAlign: "center",
                ...p.font,
                ...(hidden
                    ? {
                          visibility: "hidden",
                          WebkitMaskRepeat: "no-repeat",
                          maskRepeat: "no-repeat",
                          WebkitMaskSize: "100% 100%",
                          maskSize: "100% 100%",
                          WebkitMaskPosition: "0 0",
                          maskPosition: "0 0",
                      }
                    : null),
            }}
        >
            <RollText text={p.text} />
            {p.showArrow && (
                <RollArrow size={p.arrowSize} stroke={p.arrowStroke} />
            )}
        </span>
    )
}

export default function PixelDissolveButton(props: Props) {
    const { onClick, style } = props

    const label = { ...DEFAULT_LABEL, ...props.label }
    const colors = { ...DEFAULT_COLORS, ...props.colors }
    const layout = { ...DEFAULT_LAYOUT, ...props.layout }

    const config: Config = { ...label, ...layout, ...PIXEL }

    const rootRef = useRef<HTMLDivElement>(null)
    const hoverLayerRef = useRef<HTMLSpanElement>(null)
    const isStatic = useIsStaticRenderer()

    /* -------------------------------------------------------------- */
    /* Interaction: mouse/pen hover, touch press, keyboard focus.      */
    /* Active when ANY of them is on. Touch never gets "stuck".        */
    /* -------------------------------------------------------------- */
    const [hovered, setHovered] = useState(false)
    const inside = useRef(false) // mouse / pen over the button
    const keyFocus = useRef(false) // keyboard focus (focus-visible only)
    const touching = useRef(false) // finger held, or short hold after tap
    const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )
    const downAt = useRef(0)

    const sync = useCallback(() => {
        setHovered(inside.current || keyFocus.current || touching.current)
    }, [])

    useEffect(() => () => clearTimeout(holdTimer.current), [])

    // On static renders (thumbnails/export) show the plain rest state, no animation.
    const active = !isStatic && (hovered || PIXEL.previewHover)

    // Always-fresh copy of config for the animation loop.
    const cfg = useRef(config)
    cfg.current = config

    const eng = useRef({
        w: 0,
        h: 0,
        cols: 0,
        rows: 0,
        cs: 0,
        alpha: new Float32Array(0),
        from: new Float32Array(0),
        delay: new Float32Array(0),
        target: 0,
        prog: 0,
        pFrom: 0,
        t0: 0,
        raf: 0,
        sig: NaN as number,
        canvas: null as HTMLCanvasElement | null,
    })

    const paint = useCallback(() => {
        const e = eng.current
        const el = hoverLayerRef.current
        if (!el) return
        const n = e.alpha.length
        let sum = 0
        // quantised signature: skip the (costly) mask re-encode when nothing
        // visible changed since the last frame
        let sig = 0
        for (let i = 0; i < n; i++) {
            const a = e.alpha[i]
            sum += a
            sig = (Math.imul(sig, 31) + Math.round(a * 32)) | 0
        }
        if (sig === e.sig && n > 0) return
        e.sig = sig

        const set = (k: "-webkit-mask-image" | "mask-image", v: string) => {
            el.style.setProperty(k, v)
        }
        if (sum <= 0.0001) {
            el.style.visibility = "hidden"
            el.style.opacity = "1"
            return
        }
        el.style.visibility = "visible"
        if (sum >= n - 0.0001) {
            set("-webkit-mask-image", "none")
            set("mask-image", "none")
            el.style.opacity = "1"
            return
        }

        const cv = e.canvas || (e.canvas = document.createElement("canvas"))
        const ctx = cv.getContext("2d")
        if (!ctx) {
            // Very old / locked-down browser: plain cross-fade, never broken.
            set("-webkit-mask-image", "none")
            set("mask-image", "none")
            el.style.opacity = String(sum / Math.max(1, n))
            return
        }
        el.style.opacity = "1"

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const cap = Math.sqrt(MAX_MASK_PIXELS / Math.max(1, e.w * e.h))
        const scale = Math.max(0.5, Math.min(dpr, cap))
        const W = Math.max(1, Math.round(e.w * scale))
        const H = Math.max(1, Math.round(e.h * scale))
        if (cv.width !== W || cv.height !== H) {
            cv.width = W
            cv.height = H
        }
        ctx.clearRect(0, 0, W, H)
        const cw = e.cs * scale
        for (let y = 0; y < e.rows; y++) {
            for (let x = 0; x < e.cols; x++) {
                const a = e.alpha[y * e.cols + x]
                if (a <= 0) continue
                ctx.fillStyle = `rgba(0,0,0,${a})`
                const x0 = Math.floor(x * cw)
                const y0 = Math.floor(y * cw)
                const x1 = Math.min(W, Math.ceil((x + 1) * cw))
                const y1 = Math.min(H, Math.ceil((y + 1) * cw))
                ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
            }
        }
        let url = ""
        try {
            url = `url(${cv.toDataURL("image/png")})`
        } catch (err) {
            url = ""
        }
        if (!url) {
            el.style.opacity = String(sum / Math.max(1, n))
            set("-webkit-mask-image", "none")
            set("mask-image", "none")
            return
        }
        set("-webkit-mask-image", url)
        set("mask-image", url)
    }, [])

    // Text + arrow progress (0..1), shared by both layers via a CSS variable.
    const setProg = useCallback((v: number) => {
        const r = Math.round(v * 10000) / 10000 // no "1e-7" style numbers
        eng.current.prog = v
        rootRef.current?.style.setProperty("--p", String(r))
    }, [])

    // Offscreen: stop the animation loop and jump to the end state, so a
    // button that is not visible never keeps requestAnimationFrame running.
    const visible = useRef(true)
    const settle = useCallback(() => {
        const e = eng.current
        if (e.raf === 0) return
        cancelAnimationFrame(e.raf)
        e.raf = 0
        e.alpha.fill(e.target)
        setProg(e.target)
        paint()
    }, [paint, setProg])

    const tick = useCallback(
        (now: number) => {
            const e = eng.current
            const c = cfg.current
            if (!visible.current) {
                settle()
                return
            }
            const D = Math.max(1, c.duration * 1000)
            const cellDur = Math.max(1, D * c.cellFade)
            const ease = EASE[c.easing] || EASE.linear
            const elapsed = now - e.t0
            const steps = Math.round(c.steps)
            // text + arrow: same start, same duration as the dissolve
            const lt = Math.min(1, Math.max(0, elapsed / D))
            setProg(e.pFrom + (e.target - e.pFrom) * ROLL_EASE(lt))
            for (let i = 0; i < e.alpha.length; i++) {
                const start = e.delay[i] * (D - cellDur)
                let local = (elapsed - start) / cellDur
                local = local < 0 ? 0 : local > 1 ? 1 : local
                let q = ease(local)
                if (steps > 0) q = Math.round(q * steps) / steps
                e.alpha[i] = e.from[i] + (e.target - e.from[i]) * q
            }
            paint()
            if (elapsed < D) {
                e.raf = requestAnimationFrame(tick)
            } else {
                e.alpha.fill(e.target)
                setProg(e.target)
                paint()
                e.raf = 0
            }
        },
        [paint, setProg, settle]
    )

    const build = useCallback(() => {
        const e = eng.current
        const c = cfg.current
        if (!e.w || !e.h) return
        const cs = Math.max(2, c.cellSize)
        const cols = Math.ceil(e.w / cs)
        const rows = Math.ceil(e.h / cs)
        const n = cols * rows
        const rnd = mulberry32(7)
        const delay = new Float32Array(n)
        const r = Math.min(1, Math.max(0, c.randomness))
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const xn = cols > 1 ? x / (cols - 1) : 0
                const yn = rows > 1 ? y / (rows - 1) : 0
                const rv = rnd()
                let base = 0
                switch (c.direction) {
                    case "left":
                        base = xn
                        break
                    case "right":
                        base = 1 - xn
                        break
                    case "top":
                        base = yn
                        break
                    case "bottom":
                        base = 1 - yn
                        break
                    case "diagonal":
                        base = (xn + yn) / 2
                        break
                    default:
                        base = rv
                }
                delay[y * cols + x] = base * (1 - r) + rv * r
            }
        }
        const reallocate = n !== e.alpha.length
        e.cols = cols
        e.rows = rows
        e.cs = cs
        e.delay = delay
        if (reallocate) {
            // keep the current look when the size changes mid-animation
            const v = e.raf ? e.prog : e.target
            e.alpha = new Float32Array(n).fill(v)
            e.from = new Float32Array(n).fill(v)
        }
        e.sig = NaN
        paint()
    }, [paint])

    // Pause work while the button is outside the viewport.
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[entries.length - 1]
                if (!entry) return
                visible.current = entry.isIntersecting
                if (!entry.isIntersecting) settle()
            },
            { rootMargin: "64px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [settle])

    // Track size.
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            const e = eng.current
            const w = el.offsetWidth || r.width
            const h = el.offsetHeight || r.height
            if (w !== e.w || h !== e.h) {
                e.w = w
                e.h = h
                build()
            }
        }
        measure()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(el)
        } else {
            window.addEventListener("resize", measure)
        }
        return () => {
            ro?.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [build])

    // Rebuild the cell field when the direction changes.
    useEffect(() => {
        build()
    }, [layout.direction, build])

    // Drive the transition.
    useEffect(() => {
        const e = eng.current
        const t = active ? 1 : 0
        if (e.target === t && e.raf === 0) return
        const reduce =
            typeof window !== "undefined" &&
            !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        cancelAnimationFrame(e.raf)
        e.from.set(e.alpha)
        e.pFrom = e.prog
        e.target = t
        if (
            isStatic ||
            reduce ||
            !visible.current ||
            cfg.current.duration <= 0
        ) {
            e.alpha.fill(t)
            e.raf = 0
            setProg(t)
            paint()
            return
        }
        e.t0 = performance.now()
        e.raf = requestAnimationFrame(tick)
    }, [active, isStatic, tick, paint, setProg])

    useEffect(() => () => cancelAnimationFrame(eng.current.raf), [])

    const rest: Colors = {
        bg: colors.background,
        text: colors.text,
        border: colors.border,
    }
    const hover: Colors = {
        bg: colors.hoverBackground,
        text: colors.hoverText,
        border: colors.hoverBorder,
    }

    // Only allow safe URL schemes in the href.
    const safeLink = /^\s*(javascript|data|vbscript):/i.test(label.link || "")
        ? ""
        : label.link
    /* pointer handlers */
    const onPointerEnter = (ev: React.PointerEvent) => {
        if (ev.pointerType === "touch") return
        inside.current = true
        sync()
    }
    const onPointerLeave = (ev: React.PointerEvent) => {
        if (ev.pointerType === "touch") return
        inside.current = false
        sync()
    }
    const onPointerDown = (ev: React.PointerEvent) => {
        if (ev.pointerType !== "touch") return
        clearTimeout(holdTimer.current)
        downAt.current = performance.now()
        touching.current = true
        sync()
    }
    // Touch has no hover: play the effect on press, and always let go again,
    // after the animation has had time to finish.
    const releaseTouch = (ev: React.PointerEvent) => {
        if (ev.pointerType !== "touch") return
        clearTimeout(holdTimer.current)
        const D = Math.max(0, cfg.current.duration * 1000)
        const wait = Math.max(0, D - (performance.now() - downAt.current)) + 120
        holdTimer.current = setTimeout(() => {
            touching.current = false
            sync()
        }, wait)
    }
    const onFocus = (ev: React.FocusEvent) => {
        // keyboard focus only: a mouse click must not leave it "hovered"
        let kb = false
        try {
            kb = (ev.currentTarget as HTMLElement).matches(":focus-visible")
        } catch (err) {
            kb = false
        }
        keyFocus.current = kb
        sync()
    }
    const onBlur = () => {
        keyFocus.current = false
        sync()
    }

    const tagStyle: React.CSSProperties = {
        position: "relative",
        flex: 1,
        minWidth: 0,
        display: "flex",
        margin: 0,
        padding: 0,
        border: 0,
        background: "none",
        borderRadius: layout.radius,
        cursor: "pointer",
        textDecoration: "none",
        overflow: "hidden",
        // Safari: keep rounded-corner clipping correct while
        // children are transformed / masked
        isolation: "isolate",
        transform: "translateZ(0)",
        // no 300ms double-tap delay, no grey tap flash, no text
        // selection / callout on long-press
        touchAction: "manipulation",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        WebkitAppearance: "none",
        appearance: "none",
        font: "inherit",
        color: "inherit",
    }

    // Props shared by the <a> and <button> variants. No aria-label: the
    // visible label text is the accessible name (the rolling copies and the
    // hover layer are aria-hidden, so it is never announced twice).
    const shared = {
        onClick,
        onPointerEnter,
        onPointerLeave,
        onPointerDown,
        onPointerUp: releaseTouch,
        onPointerCancel: releaseTouch,
        onFocus,
        onBlur,
        style: tagStyle,
    }

    const inner = (
        <>
            <Layer p={config} c={rest} />
            <Layer p={config} c={hover} layerRef={hoverLayerRef} hidden />
        </>
    )

    return (
        <div
            ref={rootRef}
            style={{
                // Width/height come from Framer: Fit = hug content,
                // Fixed/Fill = explicit size.
                ...style,
                position: "relative",
                display: "flex",
            }}
        >
            {safeLink ? (
                <a
                    {...shared}
                    href={safeLink}
                    target={label.newTab ? "_blank" : undefined}
                    rel={label.newTab ? "noopener noreferrer" : undefined}
                >
                    {inner}
                </a>
            ) : (
                <button {...shared} type="button">
                    {inner}
                </button>
            )}
        </div>
    )
}

PixelDissolveButton.defaultProps = {
    label: DEFAULT_LABEL,
    colors: DEFAULT_COLORS,
    layout: DEFAULT_LAYOUT,
}

addPropertyControls(PixelDissolveButton, {
    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: DEFAULT_LABEL.text,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "monospace",
                defaultFontSize: "18px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: DEFAULT_LABEL.padding,
            },
            link: { type: ControlType.Link, title: "Link" },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                hidden: (p: LabelProps) => !p.link,
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_COLORS.background,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULT_COLORS.text,
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: DEFAULT_COLORS.border,
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover BG",
                defaultValue: DEFAULT_COLORS.hoverBackground,
            },
            hoverText: {
                type: ControlType.Color,
                title: "Hover Text",
                defaultValue: DEFAULT_COLORS.hoverText,
            },
            hoverBorder: {
                type: ControlType.Color,
                title: "Hover Border",
                defaultValue: DEFAULT_COLORS.hoverBorder,
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            showArrow: {
                type: ControlType.Boolean,
                title: "Arrow",
                defaultValue: true,
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 17,
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
                hidden: (p: LayoutProps) => !p.showArrow,
            },
            arrowStroke: {
                type: ControlType.Number,
                title: "Arrow Stroke",
                defaultValue: 1.25,
                min: 0.5,
                max: 4,
                step: 0.25,
                hidden: (p: LayoutProps) => !p.showArrow,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 20,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: LayoutProps) => !p.showArrow,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 1,
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 4,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.6,
                min: 0,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: [
                    "left",
                    "right",
                    "top",
                    "bottom",
                    "diagonal",
                    "random",
                ],
                optionTitles: [
                    "Left → Right",
                    "Right → Left",
                    "Top → Bottom",
                    "Bottom → Top",
                    "Diagonal",
                    "Random",
                ],
                defaultValue: "left",
            },
        },
    },

    onClick: { type: ControlType.EventHandler },
})
