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

import { motion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string; positionX?: string; positionY?: string }

interface Milestone {
    label?: string
    title?: string
    description?: string
    image?: ImageValue
}

interface Colors {
    background?: string
    panel?: string
    button?: string
    text?: string
    marker?: string
}

interface Typography {
    title?: React.CSSProperties
    body?: React.CSSProperties
    label?: React.CSSProperties
}

interface Props {
    milestones?: Milestone[]
    startAt?: number
    mediaHeight?: number
    stepHeight?: number
    imageSide?: "left" | "right"
    colors?: Colors
    typography?: Typography
    transition?: any
    imageEffect?: "dots" | "blur"
    dotSize?: number
    style?: React.CSSProperties
}

const ASSET = "https://framerusercontent.com/images/"
const DEFAULT_ITEMS: Milestone[] = [
    { label: "2022 : Ch. 1", title: "Under the old tree", description: "Afterglow was first sketched beneath these branches, around one question: could a car feel as alive as this?", image: { src: ASSET + "OsMlwufjlEJo68NDJ282WAqXWnI.png", alt: "A lone tree photographed in black and white" } },
    { label: "2023 : Ch. 2", title: "Prototype on the road", description: "The first Afterglow prototype finally leaves the studio and takes on the open road for its first real-world test.", image: { src: ASSET + "amTG3yrw81GEpN6dANP8LC9oI9M.png", alt: "The Afterglow prototype driving on an open road" } },
    { label: "2025 : Ch. 3", title: "The studio forms", description: "Six people and one shared horizon. Afterglow grows from a weekend side project into a studio of its own.", image: { src: ASSET + "Y5gubRtRploOt4bIJyiIPeuqmMw.png", alt: "The six members of the studio seated in a row" } },
]

const DEFAULT_COLORS: Required<Colors> = {
    background: "rgb(230, 230, 230)",
    panel: "rgba(0, 0, 0, 0)",
    button: "rgb(23, 23, 23)",
    text: "rgb(23, 23, 23)",
    marker: "rgb(23, 23, 23)",
}

const DEFAULT_TRANSITION: any = { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.65 }
const STACK_BREAKPOINT = 700
const MOBILE_TOP = 12
const FONT = "Inter, \"Inter Placeholder\", sans-serif"

function resolveImage(item: Milestone, index: number): ImageValue | undefined {
    if (item.image && item.image.src) return item.image
    const fallback = DEFAULT_ITEMS[index]
    if (!item.image && fallback && fallback.title === item.title) return fallback.image
    return undefined
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const parsePercent = (v: string | undefined) => {
    const n = parseFloat(v || "50")
    return isNaN(n) ? 0.5 : clamp01(n / 100)
}

type Sample = string[]
const sampleCache = new Map<string, Sample>()

function sampleImage(image: ImageValue, cols: number, rows: number): Promise<Sample> {
    const src = image.src as string
    const key = src + "|" + cols + "x" + rows + "|" + (image.positionX || "") + (image.positionY || "")
    const cached = sampleCache.get(key)
    if (cached) return Promise.resolve(cached)
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            try {
                const off = document.createElement("canvas")
                off.width = cols
                off.height = rows
                const c = off.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null
                if (!c) throw new Error("No 2D context")
                c.imageSmoothingEnabled = true
                ;(c as any).imageSmoothingQuality = "high"
                const iw = img.naturalWidth || img.width
                const ih = img.naturalHeight || img.height
                const scale = Math.max(cols / iw, rows / ih)
                const sw = cols / scale
                const sh = rows / scale
                const ox = (iw - sw) * parsePercent(image.positionX)
                const oy = (ih - sh) * parsePercent(image.positionY)
                c.drawImage(img, ox, oy, sw, sh, 0, 0, cols, rows)
                const data = c.getImageData(0, 0, cols, rows).data
                const fills: Sample = new Array(cols * rows)
                for (let k = 0; k < cols * rows; k++) fills[k] = "rgb(" + data[k * 4] + "," + data[k * 4 + 1] + "," + data[k * 4 + 2] + ")"
                sampleCache.set(key, fills)
                resolve(fills)
            } catch (error) {
                reject(error)
            }
        }
        img.onerror = reject
        img.src = src
    })
}

const SERIF_FAMILY = '"Instrument Serif", "Instrument Serif Placeholder", serif'

// Fonts are resolved and loaded by Framer through the Typography font controls,
// so the component never requests external stylesheets or font files at runtime.
function titleFamily(font?: React.CSSProperties): string {
    const family = font && (font as any).fontFamily
    return family ? String(family) : SERIF_FAMILY
}

/**
 * Milestone Scroll
 *
 * @framerIntrinsicWidth 1080
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MilestoneScroll(props: Props) {
    const { milestones, startAt = 1, mediaHeight = 371, stepHeight = 450, imageSide = "left", typography = {}, imageEffect = "dots", dotSize = 5, style } = props
    const useDots = imageEffect !== "blur"
    const titleFamilyValue = titleFamily(typography.title)
    const serifTitle = /Instrument Serif/.test(titleFamilyValue)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const colors = { ...DEFAULT_COLORS, ...(props.colors || {}) }
    const transition = props.transition || DEFAULT_TRANSITION
    const items = milestones && milestones.length > 0 ? milestones : DEFAULT_ITEMS
    const count = items.length

    const clamp = useCallback((i: number) => Math.max(0, Math.min(count - 1, i)), [count])
    const [active, setActive] = useState(() => clamp(Math.round(startAt) - 1))
    useEffect(() => {
        if (isCanvas) setActive(clamp(Math.round(startAt) - 1))
    }, [startAt, clamp, isCanvas])

    const rootRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(1080)
    const [viewport, setViewport] = useState(800)

    useEffect(() => {
        const node = rootRef.current
        if (!node || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const next = Math.round(entries[0].contentRect.width)
            if (next > 0) setWidth((prev) => (prev === next ? prev : next))
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const stacked = width < STACK_BREAKPOINT
    const mediaH = stacked
        ? Math.max(160, Math.min(mediaHeight, Math.round(width * 0.72), Math.round(viewport * 0.45)))
        : Math.max(200, Math.min(mediaHeight, viewport - 64))
    const panelH = mediaH + 16
    const stickyTop = stacked ? MOBILE_TOP : Math.max(24, Math.round((viewport - panelH) / 2))
    const stepH = stacked ? Math.round(stepHeight * 0.75) : stepHeight
    const columnPad = stacked ? 8 : Math.max(0, Math.round((panelH - stepH) / 2))
    // Same space on both sides of the rail so it sits centred between image and text
    const railGap = stacked ? 16 : width >= 960 ? 56 : 32

    // Scroll: the step crossing the reading line (image centre on desktop, below the image on mobile) becomes active
    const stepRefs = useRef<(HTMLLIElement | null)[]>([])
    const panelRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (isCanvas || typeof window === "undefined") return
        let raf = 0
        const update = () => {
            raf = 0
            const vh = window.innerHeight || 800
            setViewport((prev) => (prev === vh ? prev : vh))
            const panel = panelRef.current
            if (!panel) return
            // Measure the reading line from the image itself so scaled previews and offsets stay in sync
            const pr = panel.getBoundingClientRect()
            let line = pr.top + pr.height / 2
            if (stacked) {
                const coverBottom = Math.min(vh, pr.bottom + 16)
                line = coverBottom + (vh - coverBottom) * 0.4
            }
            // The step whose centre is closest to the line is active
            let next = 0
            let best = Infinity
            for (let i = 0; i < count; i++) {
                const el = stepRefs.current[i]
                if (!el) continue
                const r = el.getBoundingClientRect()
                const distance = Math.abs(r.top + r.height / 2 - line)
                if (distance < best) {
                    best = distance
                    next = i
                }
            }
            setActive((prev) => (prev === next ? prev : next))
        }
        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }
        update()
        window.addEventListener("scroll", schedule, { passive: true, capture: true })
        window.addEventListener("resize", schedule)
        return () => {
            window.removeEventListener("scroll", schedule, true)
            window.removeEventListener("resize", schedule)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [count, stacked, stickyTop, panelH, isCanvas])

    // Rail: measure each dot centre so the progress line lands exactly on the active dot
    const columnRef = useRef<HTMLDivElement>(null)
    const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [centers, setCenters] = useState<number[]>([])
    useEffect(() => {
        const column = columnRef.current
        if (!column) return
        const measure = () => {
            const next: number[] = []
            for (let i = 0; i < count; i++) {
                const dot = dotRefs.current[i]
                next.push(dot ? Math.round(dot.offsetTop + dot.offsetHeight / 2) : 0)
            }
            setCenters((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(column)
        return () => observer.disconnect()
    }, [count, width, stepH, columnPad, stacked])
    const centerOf = (i: number) => (centers[i] ? centers[i] : columnPad + i * stepH + stepH / 2)

    // Dot-matrix image transition
    const mediaRef = useRef<HTMLDivElement>(null)
    const dotCanvasRef = useRef<HTMLCanvasElement>(null)
    const previousActive = useRef(active)
    const [revealed, setRevealed] = useState(active)
    const [base, setBase] = useState(active)
    const revealedRef = useRef(active)
    revealedRef.current = revealed

    useEffect(() => {
        const from = previousActive.current
        previousActive.current = active
        const canvas = dotCanvasRef.current
        const media = mediaRef.current
        const image = items[active] ? resolveImage(items[active], active) : undefined
        const reduceMotion = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (from === active || !useDots || isCanvas || reduceMotion || !canvas || !media || !image || !image.src) {
            setRevealed(active)
            setBase(active)
            return
        }

        // Keep whatever is on screen fully opaque underneath while the dots form on top of it
        setBase(revealedRef.current)
        let cancelled = false
        let raf = 0
        let timer = 0
        const settle = () => {
            setRevealed(active)
            timer = window.setTimeout(() => {
                if (!cancelled) setBase(active)
            }, 340)
        }
        const W = Math.max(1, media.offsetWidth)
        const H = Math.max(1, media.offsetHeight)
        const spacing = Math.max(4, dotSize)
        const cols = Math.max(1, Math.round(W / spacing))
        const rows = Math.max(1, Math.round(H / spacing))
        const cellW = W / cols
        const cellH = H / rows
        const forward = active > from

        const play = (fills: Sample) => {
            if (cancelled) return
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            const ctx = canvas.getContext("2d")
            if (!ctx) {
                settle()
                return
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            const total = cols * rows
            const delays = new Float32Array(total)
            for (let k = 0; k < total; k++) {
                const y = Math.floor(k / cols) / rows
                // Scrolling down sweeps the wave upward, scrolling up sweeps it downward
                delays[k] = ((forward ? 1 - y : y) * 0.78 + Math.random() * 0.22) * 0.46
            }
            const startRadius = Math.min(cellW, cellH) * 0.34
            const endRadius = Math.max(cellW, cellH) * 0.78
            const duration = 1150
            let start = 0
            let shown = false
            canvas.style.opacity = "1"
            const frame = (now: number) => {
                if (cancelled) return
                if (!start) start = now
                const p = Math.min(1, (now - start) / duration)
                ctx.clearRect(0, 0, W, H)
                for (let k = 0; k < total; k++) {
                    const local = p - delays[k]
                    const appear = easeOutCubic(clamp01(local / 0.14))
                    if (appear <= 0) continue
                    const merge = easeInOutCubic(clamp01((local - 0.06) / 0.2))
                    const radius = startRadius + (endRadius - startRadius) * merge
                    ctx.globalAlpha = appear * (0.7 + 0.3 * merge)
                    ctx.fillStyle = fills[k]
                    ctx.beginPath()
                    ctx.arc(((k % cols) + 0.5) * cellW, (Math.floor(k / cols) + 0.5) * cellH, radius * appear, 0, Math.PI * 2)
                    ctx.fill()
                }
                ctx.globalAlpha = 1
                if (!shown && p >= 0.6) {
                    shown = true
                    setRevealed(active)
                }
                canvas.style.opacity = String(1 - clamp01((p - 0.7) / 0.22))
                if (p < 0.92) raf = requestAnimationFrame(frame)
                else {
                    ctx.clearRect(0, 0, W, H)
                    setBase(active)
                }
            }
            raf = requestAnimationFrame(frame)
        }

        sampleImage(image, cols, rows)
            .then(play)
            .catch(() => {
                if (!cancelled) settle()
            })

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            window.clearTimeout(timer)
            const ctx = canvas.getContext("2d")
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
    }, [active])

    const markerGlow = "color-mix(in srgb, " + colors.marker + " 35%, transparent)"
    const markerGlowOff = "color-mix(in srgb, " + colors.marker + " 0%, transparent)"
    const railFaint = "color-mix(in srgb, " + colors.text + " 14%, transparent)"
    const railStrong = "color-mix(in srgb, " + colors.text + " 85%, transparent)"

    const titleStyle: React.CSSProperties = { fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: "1.2em", ...typography.title, fontFamily: titleFamilyValue, ...(serifTitle ? { fontWeight: 400 } : null) }
    const bodyStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 15, fontWeight: 500, lineHeight: "1.5em", ...typography.body }
    const labelStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 12, fontWeight: 500, lineHeight: "1.3em", ...typography.label }

    const media = (
        <div ref={panelRef} style={{ background: colors.panel, borderRadius: 20, padding: 8, touchAction: "pan-y" }}>
            <div ref={mediaRef} style={{ position: "relative", height: mediaH, borderRadius: 12, clipPath: "inset(0px round 12px)", WebkitClipPath: "inset(0px round 12px)", isolation: "isolate", background: colors.button } as React.CSSProperties}>
                {items.map((item, i) => {
                    const image = resolveImage(item, i)
                    const on = useDots ? i === revealed || i === base : i === active
                    const layer = useDots ? (i === revealed ? 2 : i === base ? 1 : 0) : 0
                    const current = i === active
                    if (!image || !image.src) return null
                    return (
                        <motion.img
                            key={"image-" + i}
                            src={image.src}
                            srcSet={image.srcSet}
                            crossOrigin="anonymous"
                            alt={current ? image.alt || item.title || "" : ""}
                            aria-hidden={!current}
                            draggable={false}
                            initial={false}
                            animate={{ opacity: on ? 1 : 0, scale: on || useDots ? 1 : 1.03, filter: on || useDots ? "blur(0px)" : "blur(18px)" }}
                            transition={useDots ? (on ? { duration: 0.3, ease: [0.22, 1, 0.36, 1] } : { duration: 0.3, delay: 0.45 }) : transition}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: (image.positionX || "50%") + " " + (image.positionY || "50%"), pointerEvents: "none", zIndex: layer }}
                        />
                    )
                })}
                <canvas ref={dotCanvasRef} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0, zIndex: 3 }} />
            </div>
        </div>
    )

    const steps = (
        <div ref={columnRef} style={{ position: "relative", flex: stacked ? "0 0 auto" : "1 1 0", minWidth: 0 }}>
            <div aria-hidden="true" style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, pointerEvents: "none", background: "linear-gradient(180deg, transparent 0%, " + railFaint + " 12%, " + railFaint + " 88%, transparent 100%)" }} />
            <motion.div
                aria-hidden="true"
                initial={false}
                animate={{ height: centerOf(active) }}
                transition={transition}
                style={{ position: "absolute", left: 7, top: 0, width: 2, pointerEvents: "none", background: "linear-gradient(180deg, transparent 0%, " + railStrong + " 100%)" }}
            />
            <ol aria-label="Milestones" style={{ listStyle: "none", margin: 0, padding: columnPad + "px 0", display: "flex", flexDirection: "column" }}>
            {items.map((item, i) => {
                const on = i === active
                return (
                    <li
                        key={"step-" + i}
                        ref={(el) => {
                            stepRefs.current[i] = el
                        }}
                        aria-current={on ? "step" : undefined}
                        style={{ minHeight: stepH, display: "flex", alignItems: "center", margin: 0, padding: stacked ? "24px 0" : 0 }}
                    >
                        <div style={{ display: "grid", gridTemplateColumns: "16px minmax(0, 1fr)", columnGap: railGap, rowGap: 12, alignItems: "center", width: "100%" }}>
                            <span
                                ref={(el) => {
                                    dotRefs.current[i] = el
                                }}
                                aria-hidden="true"
                                style={{ gridArea: "1 / 1", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <motion.span
                                    initial={false}
                                    animate={{
                                        width: on ? 16 : 8,
                                        height: on ? 16 : 8,
                                        opacity: i <= active ? 1 : 0.3,
                                        backgroundColor: on ? colors.marker : colors.text,
                                        boxShadow: on ? "0px 0px 16px 0px " + markerGlow : "0px 0px 0px 0px " + markerGlowOff,
                                    }}
                                    transition={transition}
                                    style={{ position: "relative", zIndex: 1, flexShrink: 0, borderRadius: "50%", display: "block" }}
                                />
                            </span>
                            <motion.span
                                initial={false}
                                animate={{ opacity: on ? 1 : 0.4 }}
                                transition={transition}
                                style={{ gridArea: "1 / 2", ...labelStyle, color: colors.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
                            >
                                {item.label}
                            </motion.span>
                            <motion.div
                                initial={false}
                                animate={{ opacity: on ? 1 : 0.32 }}
                                transition={transition}
                                style={{ gridArea: "2 / 2", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}
                            >
                                <h3 style={{ margin: 0, color: colors.text, textWrap: "balance", ...titleStyle } as React.CSSProperties}>{item.title}</h3>
                                {item.description ? <p style={{ margin: 0, color: colors.text, opacity: 0.7, textWrap: "pretty", ...bodyStyle } as React.CSSProperties}>{item.description}</p> : null}
                            </motion.div>
                        </div>
                    </li>
                )
            })}
            </ol>
        </div>
    )

    if (stacked) {
        return (
            <div ref={rootRef} style={{ ...style, display: "flex", flexDirection: "column", gap: 8, background: colors.background, color: colors.text }}>
                <div style={{ position: "sticky", top: stickyTop, zIndex: 2, background: colors.background, paddingBottom: 16, boxShadow: "0px -" + stickyTop + "px 0px 0px " + colors.background }}>
                    {media}
                    <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "100%", height: 32, pointerEvents: "none", background: "linear-gradient(180deg, " + colors.background + " 0%, transparent 100%)" }} />
                </div>
                {steps}
            </div>
        )
    }

    return (
        <div ref={rootRef} style={{ ...style, display: "flex", flexDirection: imageSide === "right" ? "row" : "row-reverse", alignItems: "flex-start", gap: railGap, background: colors.background, color: colors.text }}>
            {steps}
            <div style={{ flex: "1.2 1 0", minWidth: 0, position: "sticky", top: stickyTop, alignSelf: "flex-start" }}>{media}</div>
        </div>
    )
}

MilestoneScroll.displayName = "Milestone Scroll"

addPropertyControls(MilestoneScroll, {
    milestones: {
        type: ControlType.Array,
        title: "Milestones",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "2027" },
                title: { type: ControlType.String, title: "Title", defaultValue: "New milestone" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Describe what happened at this step." },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    startAt: { type: ControlType.Number, title: "Preview Step", min: 1, max: 12, step: 1, displayStepper: true, defaultValue: 1 },
    mediaHeight: { type: ControlType.Number, title: "Image Height", min: 200, max: 900, step: 1, unit: "px", defaultValue: 371 },
    stepHeight: { type: ControlType.Number, title: "Step Height", min: 200, max: 900, step: 10, unit: "px", defaultValue: 450 },
    imageSide: { type: ControlType.Enum, title: "Image Side", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: "left" },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: DEFAULT_COLORS.background },
            panel: { type: ControlType.Color, title: "Panel", defaultValue: DEFAULT_COLORS.panel },
            button: { type: ControlType.Color, title: "Surface", defaultValue: DEFAULT_COLORS.button },
            text: { type: ControlType.Color, title: "Text", defaultValue: DEFAULT_COLORS.text },
            marker: { type: ControlType.Color, title: "Marker", defaultValue: DEFAULT_COLORS.marker },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            title: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "serif" as any, defaultValue: { fontSelector: "GF;Instrument Serif-regular", fontSize: 30, letterSpacing: "-0.02em", lineHeight: "1.2em" } as any },
            body: { type: ControlType.Font, title: "Description", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 15, variant: "Medium", lineHeight: "1.5em" } },
            label: { type: ControlType.Font, title: "Labels", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 12, variant: "Medium", lineHeight: "1.3em" } },
        },
    },
    imageEffect: {
        type: ControlType.Enum,
        title: "Image Effect",
        options: ["dots", "blur"],
        optionTitles: ["Dot Matrix", "Blur"],
        displaySegmentedControl: true,
        defaultValue: "dots",
    },
    dotSize: { type: ControlType.Number, title: "Dot Size", min: 4, max: 24, step: 1, unit: "px", defaultValue: 5, hidden: (props: Props) => props.imageEffect === "blur" },
    transition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULT_TRANSITION },
})
