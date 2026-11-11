/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import {
    useRef,
    useState,
    useEffect,
    useMemo,
    CSSProperties,
    MutableRefObject,
} from "react"
import { useMotionValue, useMotionValueEvent, animate } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ---- PERF LIMITS FOR PARTICLE DISSOLVE ---- */
const MAX_PARTICLE_TILES = 400 // cap total tiles to avoid DOM thrash
const MIN_CELL_PX = 14 // avoid rendering tiles smaller than ~14px
/* ------------------------------------------ */

type Effect =
    | "fade"
    | "slide"
    | "zoom"
    | "revealSquare"
    | "particleDissolve"
    | "paperTear"

interface ImageSlideshowProps {
    images: string[]
    mode: "auto" | "scroll" // "scroll" = manual with arrows/keyboard
    switchInterval: number // ms between transition starts (Auto)
    transitionDuration: number // s (effect duration)
    transitionEffect: Effect
    particleDensity: number // rows = cols (capped to 15 via controls)
    dissolveGap: number // ms lag for IN-phase in particle mode
    showArrows: boolean // only in "scroll"
    keyboard: boolean // only in "scroll"
}

/* -------------------- Utilities -------------------- */

function useElementSize(ref: MutableRefObject<HTMLElement | null>) {
    const [size, setSize] = useState({ w: 0, h: 0 })
    useEffect(() => {
        if (!ref.current) return
        const el = ref.current
        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect
            const w = Math.round(cr.width)
            const h = Math.round(cr.height)
            setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])
    return size
}

function useNaturalSize(src?: string) {
    const [dim, setDim] = useState<{ w: number; h: number } | null>(null)
    useEffect(() => {
        if (!src) return
        let active = true
        const img = new Image()
        img.decoding = "async"
        img.src = src
        const done = () => {
            if (!active) return
            if (img.naturalWidth && img.naturalHeight) {
                setDim({ w: img.naturalWidth, h: img.naturalHeight })
            }
        }
        if (img.complete && img.naturalWidth) done()
        else img.onload = done
        return () => {
            active = false
        }
    }, [src])
    return dim
}

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n))
const wrapIndex = (i: number, len: number) =>
    len > 0 ? ((i % len) + len) % len : 0

/* -------- Particle Grid (progress-driven, snapped, COVER-matched) -------- */

const ParticleGrid: React.FC<{
    src: string
    rows: number
    cols: number
    width: number
    height: number
    naturalW?: number
    naturalH?: number
    mode: "out" | "in"
    t: number // 0..1
    jitterSeed: number
    extraLag?: number // 0..1 delay for "in"
}> = ({
    src,
    rows,
    cols,
    width,
    height,
    naturalW,
    naturalH,
    mode,
    t,
    jitterSeed,
    extraLag = 0,
}) => {
    // Compute COVER mapping like object-fit:cover
    let targetW = width
    let targetH = height
    let offsetX = 0
    let offsetY = 0
    if (naturalW && naturalH && width > 0 && height > 0) {
        const scale = Math.max(width / naturalW, height / naturalH)
        targetW = Math.round(naturalW * scale)
        targetH = Math.round(naturalH * scale)
        offsetX = Math.round((width - targetW) / 2)
        offsetY = Math.round((height - targetH) / 2)
    }

    // Integer edges (pixel-snapped tiles)
    const xEdges = useMemo(() => {
        const arr: number[] = []
        for (let i = 0; i <= cols; i++) arr.push(Math.round((i * width) / cols))
        return arr
    }, [width, cols])

    const yEdges = useMemo(() => {
        const arr: number[] = []
        for (let i = 0; i <= rows; i++)
            arr.push(Math.round((i * height) / rows))
        return arr
    }, [height, rows])

    // Stable PRNG
    const rand = useMemo(() => {
        let s = jitterSeed || 1
        return () => {
            s ^= s << 13
            s ^= s >> 17
            s ^= s << 5
            return ((s >>> 0) % 10000) / 10000
        }
    }, [jitterSeed])

    // Precompute cells
    const cells = useMemo(() => {
        const out: {
            x0: number
            y0: number
            w: number
            h: number
            rx: number
            ry: number
        }[] = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x0 = xEdges[c]
                const x1 = xEdges[c + 1]
                const y0 = yEdges[r]
                const y1 = yEdges[r + 1]
                const w = x1 - x0
                const h = y1 - y0
                const rx = (rand() - 0.5) * width
                const ry = (rand() - 0.5) * height
                out.push({ x0, y0, w, h, rx, ry })
            }
        }
        return out
    }, [rows, cols, xEdges, yEdges, width, height, rand])

    const BLEED = 0.5 // overlap to hide hairlines

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {cells.map(({ x0, y0, w, h, rx, ry }, idx) => {
                let tt = t
                if (mode === "in" && extraLag > 0)
                    tt = clamp((t - extraLag) / (1 - extraLag || 1), 0, 1)
                const ox = mode === "out" ? rx * tt : rx * (1 - tt)
                const oy = mode === "out" ? ry * tt : ry * (1 - tt)
                const opacity = mode === "out" ? 1 - tt : tt

                // backgroundPosition must include COVER offsets
                const bgPosX = -(x0 - offsetX)
                const bgPosY = -(y0 - offsetY)

                return (
                    <div
                        key={idx}
                        style={{
                            position: "absolute",
                            top: y0 - BLEED / 2,
                            left: x0 - BLEED / 2,
                            width: w + BLEED,
                            height: h + BLEED,
                            backgroundImage: `url(${src})`,
                            backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                            backgroundSize: `${targetW}px ${targetH}px`,
                            backgroundRepeat: "no-repeat",
                            transform: `translate3d(${ox}px, ${oy}px, 0)`,
                            opacity,
                            willChange: "transform, opacity",
                            backfaceVisibility: "hidden",
                        }}
                    />
                )
            })}
        </div>
    )
}

/* -------------------- Main Component -------------------- */

export default function ImageSlideshow({
    images,
    mode,
    switchInterval,
    transitionDuration,
    transitionEffect,
    particleDensity,
    dissolveGap,
    showArrows,
    keyboard,
}: ImageSlideshowProps) {
    const hostRef = useRef<HTMLDivElement>(null)
    const { w, h } = useElementSize(hostRef as any)
    const len = images.length

    // Base index shown when p=0
    const [index, setIndex] = useState(0)
    // Direction of the current transition: 1 = next, -1 = prev
    const [dir, setDir] = useState<1 | -1>(1)

    // Motion value for 0..1 effect progress
    const mv = useMotionValue(0)

    // Mirror MotionValue -> React state so publish re-renders each frame
    const [p, setP] = useState(mv.get())
    const rafRef = useRef<number | null>(null)
    useMotionValueEvent(mv, "change", (v) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => setP(v))
    })
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    // Preload all images so natural sizes are ready on first click
    useEffect(() => {
        images.forEach((src) => {
            if (!src) return
            const im = new Image()
            im.decoding = "async"
            im.src = src
        })
    }, [images])

    const [seed, setSeed] = useState(1337)
    const [animating, setAnimating] = useState(false)

    const runTransition = (nextDir: 1 | -1) => {
        if (len < 2 || animating) return
        setAnimating(true)
        setDir(nextDir)
        mv.set(0)
        const controls = animate(mv, 1, {
            duration: transitionDuration,
            ease: "easeInOut",
            onComplete: () => {
                setIndex((i) => wrapIndex(i + nextDir, len))
                setSeed((s) => s + 1)
                mv.set(0)
                setAnimating(false)
            },
        })
        return () => controls.stop()
    }

    /* ---------- AUTO loop ---------- */
    useEffect(() => {
        if (mode !== "auto" || len < 2) return
        let stopped = false
        let holdTimer: ReturnType<typeof setTimeout> | null = null

        const loop = () => {
            if (stopped) return
            runTransition(1)
            const hold = Math.max(0, switchInterval - transitionDuration * 1000)
            holdTimer = setTimeout(
                () => loop(),
                transitionDuration * 1000 + hold
            )
        }

        holdTimer = setTimeout(loop, 50)
        return () => {
            stopped = true
            if (holdTimer) clearTimeout(holdTimer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, len, switchInterval, transitionDuration, transitionEffect])

    /* ---------- Derived indices for render ---------- */
    const baseIndex = index
    const nextIndex = wrapIndex(index + (dir === 1 ? 1 : -1), len)

    /* Natural sizes for COVER-correct particles (current & next) */
    const dimA = useNaturalSize(images[dir === 1 ? baseIndex : nextIndex])
    const dimB = useNaturalSize(images[dir === 1 ? nextIndex : baseIndex])

    /* ---------- Readiness & queued first click (Scroll) ---------- */
    const isManual = mode === "scroll"
    const readyForManual = useMemo(() => {
        if (!isManual) return true
        if (transitionEffect === "slide") return w > 0 // need measured width
        if (transitionEffect === "particleDissolve")
            return w > 0 && h > 0 && !!dimA && !!dimB // need cover math for both layers
        return true // fade/zoom/reveal/paperTear fine
    }, [isManual, transitionEffect, w, h, dimA, dimB])

    // NEW: queue the first click if not ready yet
    const [queuedDir, setQueuedDir] = useState<0 | 1 | -1>(0)
    useEffect(() => {
        if (!isManual) return
        if (readyForManual && queuedDir !== 0 && !animating) {
            const d = queuedDir as 1 | -1
            setQueuedDir(0)
            runTransition(d)
        }
    }, [readyForManual, queuedDir, isManual, animating]) // eslint-disable-line react-hooks/exhaustive-deps

    /* ---------- Shared image style ---------- */
    const imgBaseStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        willChange: "transform, opacity, clip-path",
        backfaceVisibility: "hidden",
        transform: "translateZ(0)",
        imageRendering: "auto",
        contain: "paint",
    }

    /* ---------- Effect views ---------- */
    const Fade = () => (
        <>
            <img
                src={images[baseIndex]}
                style={{ ...imgBaseStyle, opacity: 1 - p }}
            />
            <img
                src={images[nextIndex]}
                style={{ ...imgBaseStyle, opacity: p }}
            />
        </>
    )

    const Slide = () => {
        const widthPx = w || 0
        if (widthPx <= 0) {
            const sign = dir === 1 ? 1 : -1
            const cur = -100 * p * sign
            const nxt = 100 * (1 - p) * sign
            return (
                <>
                    <img
                        src={images[baseIndex]}
                        style={{
                            ...imgBaseStyle,
                            transform: `translate3d(${cur}%, 0, 0)`,
                        }}
                    />
                    <img
                        src={images[nextIndex]}
                        style={{
                            ...imgBaseStyle,
                            transform: `translate3d(${nxt}%, 0, 0)`,
                        }}
                    />
                </>
            )
        }
        const delta = widthPx * p
        const curX = dir === 1 ? -delta : delta
        const nxtX = dir === 1 ? widthPx - delta : -widthPx + delta
        return (
            <>
                <img
                    src={images[baseIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translate3d(${curX}px, 0, 0)`,
                    }}
                />
                <img
                    src={images[nextIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translate3d(${nxtX}px, 0, 0)`,
                    }}
                />
            </>
        )
    }

    const Zoom = () => {
        const curScale = 1 + 0.2 * p
        const nxtScale = 1.2 - 0.2 * p
        return (
            <>
                <img
                    src={images[baseIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translateZ(0) scale(${curScale})`,
                        opacity: 1 - p,
                    }}
                />
                <img
                    src={images[nextIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translateZ(0) scale(${nxtScale})`,
                        opacity: p,
                    }}
                />
            </>
        )
    }

    const RevealSquare = () => {
        const insetPct = (1 - p) * 50
        const clip = `inset(${insetPct}% ${insetPct}% ${insetPct}% ${insetPct}%)`
        return (
            <>
                <img src={images[baseIndex]} style={{ ...imgBaseStyle }} />
                <img
                    src={images[nextIndex]}
                    style={{ ...imgBaseStyle, clipPath: clip }}
                />
            </>
        )
    }

    const PaperTear = () => {
        const sign = dir === 1 ? 1 : -1
        const curTy = -100 * p * sign
        const nxtTy = 100 * (1 - p) * sign
        return (
            <>
                <img
                    src={images[baseIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translate3d(0, ${curTy}%, 0)`,
                    }}
                />
                <img
                    src={images[nextIndex]}
                    style={{
                        ...imgBaseStyle,
                        transform: `translate3d(0, ${nxtTy}%, 0)`,
                    }}
                />
            </>
        )
    }

    /* ---------- Particle Dissolve (perf + snapped tiles + COVER match) ---------- */
    const ParticleDissolve = () => {
        const extra = clamp(
            dissolveGap / 1000 / Math.max(transitionDuration, 0.0001),
            0,
            0.9
        )

        // Adaptive tile cap
        const areaCap =
            w > 0 && h > 0
                ? Math.floor((w * h) / (MIN_CELL_PX * MIN_CELL_PX))
                : MAX_PARTICLE_TILES
        const tileCap = Math.max(100, Math.min(MAX_PARTICLE_TILES, areaCap))

        const desired = particleDensity * particleDensity
        const scale = desired > tileCap ? Math.sqrt(tileCap / desired) : 1
        const eff = Math.max(5, Math.round(particleDensity * scale))
        const effRows = eff
        const effCols = eff

        const a = dir === 1 ? baseIndex : nextIndex
        const b = dir === 1 ? nextIndex : baseIndex

        // natural sizes for cover mapping (already precomputed)
        const dimA = useNaturalSize(images[a])
        const dimB = useNaturalSize(images[b])

        return (
            <>
                <img
                    src={images[a]}
                    style={{ ...imgBaseStyle, opacity: 1 - p }}
                />
                <img src={images[b]} style={{ ...imgBaseStyle, opacity: p }} />
                {w > 0 && h > 0 && (
                    <>
                        <ParticleGrid
                            src={images[a]}
                            rows={effRows}
                            cols={effCols}
                            width={w}
                            height={h}
                            naturalW={dimA?.w}
                            naturalH={dimA?.h}
                            mode="out"
                            t={p}
                            jitterSeed={seed}
                        />
                        <ParticleGrid
                            src={images[b]}
                            rows={effRows}
                            cols={effCols}
                            width={w}
                            height={h}
                            naturalW={dimB?.w}
                            naturalH={dimB?.h}
                            mode="in"
                            t={p}
                            jitterSeed={seed + 1}
                            extraLag={extra}
                        />
                    </>
                )}
            </>
        )
    }

    const EffectView = () => {
        if (len === 0) return null
        switch (transitionEffect) {
            case "fade":
                return <Fade />
            case "slide":
                return <Slide />
            case "zoom":
                return <Zoom />
            case "revealSquare":
                return <RevealSquare />
            case "paperTear":
                return <PaperTear />
            case "particleDissolve":
                return <ParticleDissolve />
            default:
                return <Fade />
        }
    }

    /* ---------- Scroll (manual) controls ---------- */
    const canShowArrows = showArrows && isManual && len > 1
    const prev = () => {
        if (!readyForManual) {
            setQueuedDir(-1)
            return
        }
        runTransition(-1)
    }
    const next = () => {
        if (!readyForManual) {
            setQueuedDir(1)
            return
        }
        runTransition(1)
    }

    useEffect(() => {
        if (!keyboard || !isManual) return
        const onKey = (e: KeyboardEvent) => {
            if (!readyForManual) {
                setQueuedDir(
                    e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
                )
                return
            }
            if (e.key === "ArrowRight") next()
            if (e.key === "ArrowLeft") prev()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [keyboard, isManual, animating, len, transitionDuration, readyForManual]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            {len >= 1 ? (
                <EffectView />
            ) : (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    Add images in Property Controls
                </div>
            )}

            {canShowArrows && (
                <>
                    <button
                        onClick={prev}
                        style={arrowStyle("left")}
                        aria-label="Previous"
                        disabled={
                            animating || (!readyForManual && queuedDir !== -1)
                        }
                        title={!readyForManual ? "Loading…" : "Previous"}
                    >
                        ❮
                    </button>
                    <button
                        onClick={next}
                        style={arrowStyle("right")}
                        aria-label="Next"
                        disabled={
                            animating || (!readyForManual && queuedDir !== 1)
                        }
                        title={!readyForManual ? "Loading…" : "Next"}
                    >
                        ❯
                    </button>
                </>
            )}
        </div>
    )
}

const arrowStyle = (side: "left" | "right"): CSSProperties =>
    ({
        position: "absolute",
        [side]: 12,
        top: "50%",
        transform: "translateY(-50%)",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.6)",
        background: "rgba(0,0,0,.25)",
        color: "#fff",
        cursor: "pointer",
        userSelect: "none",
    }) as CSSProperties

/* -------------------- Defaults & Controls -------------------- */

ImageSlideshow.defaultProps = {
    images: [],
    mode: "auto",
    switchInterval: 3000,
    transitionDuration: 0.8,
    transitionEffect: "fade",
    particleDensity: 12,
    dissolveGap: 200,
    showArrows: true,
    keyboard: true,
}

addPropertyControls(ImageSlideshow, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
    },
    mode: {
        type: ControlType.Enum,
        title: "Change On",
        options: ["auto", "scroll"],
        optionTitles: ["Automatically", "Scroll"],
        defaultValue: "auto",
    },
    switchInterval: {
        type: ControlType.Number,
        title: "Interval (ms)",
        min: 500,
        max: 10000,
        step: 100,
        defaultValue: 3000,
        hidden: (p) => p.mode !== "auto",
    },
    transitionEffect: {
        type: ControlType.Enum,
        title: "Effect",
        options: [
            "fade",
            "slide",
            "zoom",
            "revealSquare",
            "particleDissolve",
            "paperTear",
        ],
        optionTitles: [
            "Fade",
            "Slide",
            "Zoom",
            "Reveal Square",
            "Particle Dissolve",
            "Paper Tear",
        ],
        defaultValue: "fade",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration (s)",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Particles (row/col)",
        min: 5,
        max: 15, // hard-capped in UI
        step: 1,
        defaultValue: 12,
        displayStepper: true,
        hidden: (p) => p.transitionEffect !== "particleDissolve",
    },
    dissolveGap: {
        type: ControlType.Number,
        title: "Dissolve Gap (ms)",
        min: 0,
        max: 1000,
        step: 50,
        defaultValue: 200,
        hidden: (p) => p.transitionEffect !== "particleDissolve",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows (Scroll)",
        defaultValue: true,
        hidden: (p) => p.mode !== "scroll",
    },
    keyboard: {
        type: ControlType.Boolean,
        title: "Keyboard Arrows (Scroll)",
        defaultValue: true,
        hidden: (p) => p.mode !== "scroll",
    },
})
