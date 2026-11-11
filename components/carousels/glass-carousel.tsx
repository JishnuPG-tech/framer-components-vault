// GlassBall
// A translucent 3D sphere of image cards (Fibonacci distribution) that you can
// see *through* to the back of the ball. It auto-rotates and can be spun by
// dragging. An overlaid title/description changes as the ball turns.
//
// The ball sizes itself to its own frame (radius + card size are derived from
// the container), so it looks right at any size you drop it on the canvas.
//
// Paste into a Framer Code Component (New Code File → paste).

import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Types ────────────────────────────────────────────────────
interface TextItem {
    title: string
    description: string
}

interface GlassBallProps {
    images: ImageLike[]
    items: TextItem[]
    cardCount: number
    coverage: number // ball diameter as a fraction of the frame's short side
    cardScale: number // card height as a fraction of the radius
    cardRatio: number // card width / height
    cardRadius: number
    cardOpacity: number
    depthFade: boolean
    drive: "scroll" | "auto"
    turns: number
    rotateSpeed: number
    tilt: number
    enableDrag: boolean
    backgroundColor: string
    showGrid: boolean
    gridColor: string
    showText: boolean
    textAlign: "left" | "center" | "right"
    titleColor: string
    descColor: string
    titleSize: number
    style?: CSSProperties
}

// Framer's Image control can hand back a string URL or an object — normalise it.
type ImageLike = string | { src?: string }
function srcOf(img: ImageLike | null | undefined): string {
    if (!img) return ""
    return typeof img === "string" ? img : img.src || ""
}

/**
 * GlassBall
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GlassBall(props: GlassBallProps) {
    const {
        images,
        items,
        cardCount = 24,
        coverage = 0.62,
        cardScale = 0.4,
        cardRatio = 0.8,
        cardRadius = 12,
        cardOpacity = 0.78,
        depthFade = true,
        drive = "scroll",
        turns = 2,
        rotateSpeed = 0.06,
        tilt = 12,
        enableDrag = true,
        backgroundColor = "#0b0b0f",
        showGrid = true,
        gridColor = "rgba(255,255,255,0.05)",
        showText = true,
        textAlign = "left",
        titleColor = "#ffffff",
        descColor = "#9a9aa6",
        titleSize = 40,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const sphereRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<HTMLDivElement[]>([])
    const [active, setActive] = useState(0)

    // Only animate while the carousel is in (or near) the viewport, so long
    // pages don't pay for an off-screen ball. Defaults to true so it still
    // renders correctly if IntersectionObserver isn't available.
    const [inView, setInView] = useState(true)
    useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { rootMargin: "200px 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Measured frame size → drives a responsive radius so the ball always fits.
    const [box, setBox] = useState({ w: 600, h: 600 })
    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            if (r.width && r.height) setBox({ w: r.width, h: r.height })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const short = Math.min(box.w, box.h)
    const radius = Math.max(40, (short * coverage) / 2)
    const cardH = Math.max(18, radius * cardScale)
    const cardW = Math.max(14, cardH * cardRatio)
    const perspective = Math.max(700, short * 1.5)

    const list = images && images.length ? images : [""]
    const count = Math.max(1, Math.min(cardCount, 60))
    const safeItems =
        items && items.length ? items : [{ title: "", description: "" }]

    // Recompute Fibonacci-sphere placements whenever sizing inputs change.
    const cards = useRef<{ src: string; transform: string; z: number }[]>([])
    cards.current = Array.from({ length: count }, (_, i) => {
        const phi = Math.acos(1 - (2 * (i + 0.5)) / count)
        const theta = Math.PI * (1 + Math.sqrt(5)) * i
        const x = radius * Math.cos(theta) * Math.sin(phi)
        const y = radius * Math.sin(theta) * Math.sin(phi)
        const z = radius * Math.cos(phi)
        const rotY = Math.atan2(x, z) * (180 / Math.PI)
        const rotX = Math.asin(-y / radius) * (180 / Math.PI)
        return {
            src: srcOf(list[i % list.length]),
            transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
            z,
        }
    })

    // Rotation + drag state kept in a ref so the rAF loop never re-renders React.
    const rot = useRef({
        rx: tilt,
        ry: 0,
        vx: 0,
        vy: 0,
        dragging: false,
        lastX: 0,
        lastY: 0,
    })

    // Dim cards on the far side of the ball for a glassy depth falloff.
    const applyDepth = () => {
        if (!depthFade) return
        const s = rot.current
        const ryRad = (s.ry * Math.PI) / 180
        for (let i = 0; i < count; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const z0 = cards.current[i]?.z ?? 0
            const worldZ = z0 * Math.cos(ryRad)
            const t = (worldZ + radius) / (2 * radius) // 0 (back) → 1 (front)
            el.style.opacity = String(cardOpacity * (0.35 + 0.65 * t))
        }
    }

    // Apply rotation + active text from a 0..1 scroll progress value.
    const applyScroll = (p: number) => {
        const sphere = sphereRef.current
        if (!sphere) return
        const s = rot.current
        s.ry = p * 360 * turns
        s.rx = tilt
        sphere.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`
        applyDepth()
        const idx = Math.min(
            safeItems.length - 1,
            Math.floor(p * safeItems.length)
        )
        setActive((cur) => (cur === idx ? cur : idx))
    }

    // Scroll-driven mode: progress comes from the nearest tall ancestor (the
    // scroll "section"), so it keeps advancing even when the ball is pinned /
    // sticky. Gated by useIsStaticRenderer (a stable frame, no loop, on the
    // canvas / during export) and by IntersectionObserver (the rAF loop and
    // listeners only run while the carousel is in / near the viewport).
    useEffect(() => {
        if (drive !== "scroll") return
        if (typeof window === "undefined") return
        const root = rootRef.current
        const sphere = sphereRef.current
        if (!root || !sphere) return

        // Static rendering (canvas thumbnail / export): render a stable fallback
        // frame and never start the animation loop or any listeners.
        if (isStatic) {
            const s = rot.current
            s.rx = tilt
            s.ry = 20
            sphere.style.transform = `rotateX(${tilt}deg) rotateY(20deg)`
            applyDepth()
            return
        }

        // Find the element to measure scroll progress against — the nearest
        // ancestor taller than the viewport. Falls back to the component itself.
        const findTrack = (): HTMLElement => {
            const vh = window.innerHeight || 1
            let node: HTMLElement | null = root
            let best: HTMLElement = root
            let hops = 0
            while (node && hops < 12) {
                if (node.getBoundingClientRect().height > vh * 1.2) return node
                best = node
                node = node.parentElement
                hops++
            }
            return best
        }

        let last = -1
        const read = () => {
            const rect = findTrack().getBoundingClientRect()
            const vh =
                window.innerHeight || document.documentElement.clientHeight || 1
            const total = rect.height + vh
            let p = total > 0 ? (vh - rect.top) / total : 0
            p = Math.max(0, Math.min(1, p))
            if (Math.abs(p - last) > 0.0004) {
                last = p
                applyScroll(p)
            }
        }

        // Always paint one correct frame for the current scroll position.
        read()

        // Off-screen: leave that frame in place and don't spin up the loop.
        if (!inView) return

        let raf = 0
        const loop = () => {
            read()
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        window.addEventListener("scroll", read, {
            passive: true,
            capture: true,
        })
        window.addEventListener("resize", read)
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("scroll", read, { capture: true })
            window.removeEventListener("resize", read)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isStatic,
        inView,
        drive,
        tilt,
        turns,
        radius,
        count,
        cardOpacity,
        depthFade,
        safeItems.length,
    ])

    // Auto-spin + drag-momentum loop (only when NOT scroll-driven, not static,
    // and only while in / near the viewport).
    useEffect(() => {
        if (isStatic || drive !== "auto" || !inView) return
        const sphere = sphereRef.current
        if (!sphere) return

        let raf = 0
        let prev = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(64, now - prev)
            prev = now
            const s = rot.current
            if (!s.dragging) {
                s.ry += rotateSpeed * dt
                s.ry += s.vy
                s.rx += s.vx
                s.vy *= 0.94
                s.vx *= 0.94
            }
            s.rx = Math.max(-70, Math.min(70, s.rx))
            sphere.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg)`
            applyDepth()

            const span = 360 / safeItems.length
            const idx =
                Math.floor((((s.ry % 360) + 360) % 360) / span) %
                safeItems.length
            setActive((cur) => (cur === idx ? cur : idx))

            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isStatic,
        inView,
        drive,
        rotateSpeed,
        tilt,
        safeItems.length,
        depthFade,
        radius,
        count,
        cardOpacity,
    ])

    // ── Drag handlers ────────────────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        if (!enableDrag || isStatic || drive !== "auto") return
        const s = rot.current
        s.dragging = true
        s.vx = 0
        s.vy = 0
        s.lastX = e.clientX
        s.lastY = e.clientY
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const s = rot.current
        if (!s.dragging) return
        const dx = e.clientX - s.lastX
        const dy = e.clientY - s.lastY
        s.ry += dx * 0.3
        s.rx -= dy * 0.3
        s.vy = dx * 0.3
        s.vx = -dy * 0.3
        s.lastX = e.clientX
        s.lastY = e.clientY
    }
    const onPointerUp = (e: React.PointerEvent) => {
        rot.current.dragging = false
        ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    }

    const gridBg: CSSProperties = showGrid
        ? {
              backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: "56px 56px",
              backgroundPosition: "center",
          }
        : {}

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                perspective,
                cursor: drive === "auto" && enableDrag ? "grab" : "default",
                // only capture touch when drag-spinning; scroll mode must let
                // the page scroll through the component on touch devices
                touchAction: drive === "auto" && enableDrag ? "none" : "auto",
                ...gridBg,
                ...style,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <div
                ref={sphereRef}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 0,
                    height: 0,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {cards.current.map((c, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            if (el) cardRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: cardW,
                            height: cardH,
                            margin: `${-cardH / 2}px 0 0 ${-cardW / 2}px`,
                            borderRadius: cardRadius,
                            overflow: "hidden",
                            background: "rgba(28,28,36,0.5)",
                            boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
                            transform: c.transform,
                            backfaceVisibility: "visible",
                            opacity: cardOpacity,
                        }}
                    >
                        {c.src ? (
                            <img
                                src={c.src}
                                alt=""
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    opacity: 0.9,
                                    pointerEvents: "none",
                                }}
                            />
                        ) : null}
                    </div>
                ))}
            </div>

            {showText && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background:
                                textAlign === "left"
                                    ? "linear-gradient(90deg, rgba(7,7,11,0.9) 0%, rgba(7,7,11,0.55) 22%, rgba(7,7,11,0) 46%)"
                                    : textAlign === "right"
                                      ? "linear-gradient(270deg, rgba(7,7,11,0.9) 0%, rgba(7,7,11,0.55) 22%, rgba(7,7,11,0) 46%)"
                                      : "linear-gradient(0deg, rgba(7,7,11,0.85) 0%, rgba(7,7,11,0) 55%)",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: textAlign === "center" ? "auto" : "50%",
                            bottom: textAlign === "center" ? 40 : "auto",
                            left:
                                textAlign === "left"
                                    ? "min(48px, 6%)"
                                    : textAlign === "center"
                                      ? "50%"
                                      : "auto",
                            right:
                                textAlign === "right"
                                    ? "min(48px, 6%)"
                                    : "auto",
                            transform:
                                textAlign === "center"
                                    ? "translateX(-50%)"
                                    : "translateY(-50%)",
                            width: "min(420px, 78%)",
                            textAlign,
                            pointerEvents: "none",
                            zIndex: 10,
                            fontFamily:
                                "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            {safeItems.map((it, i) => (
                                <motion.div
                                    key={i}
                                    initial={false}
                                    animate={{
                                        opacity: i === active ? 1 : 0,
                                        y: i === active ? 0 : 14,
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    style={{
                                        position:
                                            i === active
                                                ? "relative"
                                                : "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: 0,
                                            color: titleColor,
                                            fontSize: titleSize,
                                            lineHeight: 1.05,
                                            fontWeight: 600,
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {it.title}
                                    </h2>
                                    <p
                                        style={{
                                            margin: "12px 0 0",
                                            color: descColor,
                                            fontSize: Math.max(
                                                13,
                                                titleSize * 0.36
                                            ),
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {it.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

// ── Default props ────────────────────────────────────────────
GlassBall.defaultProps = {
    images: [
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/xtra-group6.jpg?v=1764351424",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/dp-pack2.jpg?v=1764343183",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/cc-dp.jpg?v=1764280792",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/cc-serum.jpg?v=1764279474",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/cc-col-square.webp?v=1762416360",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/dp-bag-square-01-01.webp?v=1757416671",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/dermd-products.png?v=1753033534",
        "https://cdn.shopify.com/s/files/1/0185/5999/1872/files/candle-square-05-01.webp?v=1750833640",
    ],
    items: [
        {
            title: "Running Through Reflection",
            description:
                "One photo was taken on a rainy day at a running track — water covering the surface, doubling every stride.",
        },
        {
            title: "Elegance in Boldness",
            description:
                "Captured in a controlled studio environment, emphasizing strong features and deep contrast.",
        },
        {
            title: "Dynamic Moments",
            description:
                "Capturing the pure essence of speed and raw emotion in a single split-second frame.",
        },
        {
            title: "Abstract Movement",
            description:
                "The flow of time expressed visually through long exposures and deliberate camera movement.",
        },
    ],
}

// ── Framer property controls ─────────────────────────────────
addPropertyControls(GlassBall, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
    },
    items: {
        type: ControlType.Array,
        title: "Text Slides",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Description…",
                },
            },
        },
    },
    cardCount: {
        type: ControlType.Number,
        title: "Card Count",
        defaultValue: 24,
        min: 6,
        max: 60,
        step: 1,
        displayStepper: true,
    },
    coverage: {
        type: ControlType.Number,
        title: "Ball Size",
        defaultValue: 0.62,
        min: 0.25,
        max: 0.95,
        step: 0.01,
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 0.4,
        min: 0.15,
        max: 0.7,
        step: 0.01,
    },
    cardRatio: {
        type: ControlType.Number,
        title: "Card W/H",
        defaultValue: 0.8,
        min: 0.5,
        max: 1.6,
        step: 0.05,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
    },
    cardOpacity: {
        type: ControlType.Number,
        title: "Card Opacity",
        defaultValue: 0.78,
        min: 0.2,
        max: 1,
        step: 0.02,
    },
    depthFade: {
        type: ControlType.Boolean,
        title: "Depth Fade",
        defaultValue: true,
    },
    drive: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["scroll", "auto"],
        optionTitles: ["Scroll", "Auto Spin"],
        defaultValue: "scroll",
        displaySegmentedControl: true,
    },
    turns: {
        type: ControlType.Number,
        title: "Turns",
        defaultValue: 2,
        min: 0.25,
        max: 6,
        step: 0.25,
        hidden: (p) => p.drive !== "scroll",
    },
    rotateSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.06,
        min: 0,
        max: 0.4,
        step: 0.01,
        hidden: (p) => p.drive !== "auto",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 12,
        min: -45,
        max: 45,
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Drag To Spin",
        defaultValue: true,
        hidden: (p) => p.drive !== "auto",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0b0b0f",
    },
    showGrid: { type: ControlType.Boolean, title: "Grid", defaultValue: true },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "rgba(255,255,255,0.05)",
        hidden: (p) => !p.showGrid,
    },
    showText: {
        type: ControlType.Boolean,
        title: "Show Text",
        defaultValue: true,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Side",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p) => !p.showText,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
        hidden: (p) => !p.showText,
    },
    descColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "#9a9aa6",
        hidden: (p) => !p.showText,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 40,
        min: 16,
        max: 96,
        hidden: (p) => !p.showText,
    },
})
