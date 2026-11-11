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
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"
import {
    useRef,
    useEffect,
    useState,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"

// ---------------------------------------------------------------------------
// Depth Carousel — a 3D cover-flow driven by wheel + drag, with spring
// momentum, snap-to-card, progressive depth blur, floor reflection and a
// cinematic vignette. Every visible card reads one shared spring value.
// ---------------------------------------------------------------------------

interface Slide {
    image?: { src?: string; srcSet?: string; alt?: string }
    caption?: string
}

interface DepthCarouselProps {
    slides?: Slide[]
    height: number
    cardWidth: number
    cardHeight: number
    sideScale: number
    spacing: number
    depth: number
    curve: number
    perspective: number
    stiffness: number
    damping: number
    radius: number
    maxBlur: number
    reflection: boolean
    reflectionStrength: number
    vignette: number
    edgeSpread: number
    edgeStrength: number
    background: string
    labelColor: string
    showCounter: boolean
    hint: string
    font?: CSSProperties
    style?: CSSProperties
}

const FALLBACK: Slide[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
            alt: "Fog over a pine ridge",
        },
        caption: "Northern Ridge",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1200&auto=format&fit=crop",
            alt: "Snowy path through winter trees",
        },
        caption: "Quiet Passage",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
            alt: "Lake reflecting a mountain range",
        },
        caption: "Still Water",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
            alt: "Sunlight through a forest",
        },
        caption: "First Light",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop",
            alt: "Waves along a rocky coast",
        },
        caption: "Open Coast",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=1200&auto=format&fit=crop",
            alt: "Dunes under a wide sky",
        },
        caption: "Long Horizon",
    },
]

interface CardConfig {
    cardWidth: number
    cardHeight: number
    sideScale: number
    spacing: number
    depth: number
    curve: number
    radius: number
    maxBlur: number
    reflection: boolean
    reflectionStrength: number
}

// Pure transform math — shared by the live (motion) and static render paths.
function xFor(o: number, c: CardConfig) {
    const s = Math.sign(o)
    const a = Math.abs(o)
    const first = c.cardWidth * 0.46 + c.spacing
    const step = c.cardWidth * c.sideScale * 0.62
    return a <= 1 ? o * first : s * (first + (a - 1) * step)
}
function zFor(o: number, c: CardConfig) {
    return -Math.min(Math.abs(o), 4) * c.depth
}
function rotFor(o: number, c: CardConfig) {
    return -Math.max(-1, Math.min(1, o)) * c.curve
}
function scaleFor(o: number, c: CardConfig) {
    return 1 - (1 - c.sideScale) * Math.min(Math.abs(o), 1)
}
function opacityFor(o: number) {
    const a = Math.abs(o)
    return 1 - Math.min(Math.max(a - 3, 0) / 1.3, 1)
}
function blurFor(o: number, c: CardConfig) {
    return Math.min(Math.max(Math.abs(o) - 0.35, 0) * 2.6, c.maxBlur)
}

function Card({
    slide,
    index,
    progress,
    cfg,
    isStatic,
}: {
    slide: Slide
    index: number
    progress: any
    cfg: CardConfig
    isStatic: boolean
}) {
    const offset = useTransform(progress, (p: number) => index - p)
    const x = useTransform(offset, (o: number) => xFor(o, cfg))
    const z = useTransform(offset, (o: number) => zFor(o, cfg))
    const rotateY = useTransform(offset, (o: number) => rotFor(o, cfg))
    const scale = useTransform(offset, (o: number) => scaleFor(o, cfg))
    const opacity = useTransform(offset, opacityFor)
    const filter = useTransform(offset, (o: number) => `blur(${blurFor(o, cfg)}px)`)
    const zIndex = useTransform(offset, (o: number) =>
        Math.round(1000 - Math.abs(o) * 10)
    )

    const src = slide.image?.src
    const alt = slide.image?.alt || slide.caption || `Slide ${index + 1}`

    const imgStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }
    const img = (
        <img
            src={src}
            srcSet={slide.image?.srcSet}
            alt={alt}
            draggable={false}
            style={imgStyle}
        />
    )

    const frameInner: CSSProperties = {
        width: cfg.cardWidth,
        height: cfg.cardHeight,
        borderRadius: cfg.radius,
        overflow: "hidden",
        boxShadow: "0 40px 80px -40px rgba(0,0,0,0.7)",
        background: "rgba(120,120,120,0.12)",
    }

    const reflectionEl = cfg.reflection ? (
        <div
            style={{
                position: "absolute",
                left: 0,
                top: "100%",
                marginTop: 10,
                width: cfg.cardWidth,
                height: cfg.cardHeight * 0.5,
                borderRadius: cfg.radius,
                overflow: "hidden",
                transform: "scaleY(-1)",
                transformOrigin: "top center",
                opacity: cfg.reflectionStrength,
                pointerEvents: "none",
                WebkitMaskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 62%)",
                maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 62%)",
            }}
        >
            <div style={{ width: cfg.cardWidth, height: cfg.cardHeight }}>
                {img}
            </div>
        </div>
    ) : null

    const wrapper: CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        width: cfg.cardWidth,
        height: cfg.cardHeight,
        transformStyle: "preserve-3d",
    }

    if (isStatic) {
        const o = index // progress rests at 0
        return (
            <div
                style={{
                    ...wrapper,
                    zIndex: Math.round(1000 - Math.abs(o) * 10),
                    opacity: opacityFor(o),
                    filter: `blur(${blurFor(o, cfg)}px)`,
                    transform: `translateX(${xFor(o, cfg)}px) translateZ(${zFor(
                        o,
                        cfg
                    )}px) rotateY(${rotFor(o, cfg)}deg) scale(${scaleFor(o, cfg)})`,
                }}
            >
                <div style={frameInner}>{img}</div>
                {reflectionEl}
            </div>
        )
    }

    return (
        <motion.div style={{ ...wrapper, x, z, rotateY, scale, opacity, filter, zIndex }}>
            <div style={frameInner}>{img}</div>
            {reflectionEl}
        </motion.div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DepthCarousel(props: DepthCarouselProps) {
    const {
        slides: rawSlides,
        height,
        cardWidth,
        cardHeight,
        sideScale,
        spacing,
        depth,
        curve,
        perspective,
        stiffness,
        damping,
        radius,
        maxBlur,
        reflection,
        reflectionStrength,
        vignette,
        edgeSpread,
        edgeStrength,
        background,
        labelColor,
        showCounter,
        hint,
        font,
        style,
    } = props

    const slides =
        rawSlides && rawSlides.filter((s) => s && s.image && s.image.src).length > 0
            ? rawSlides.filter((s) => s && s.image && s.image.src)
            : FALLBACK
    const n = slides.length

    const isStatic = useIsStaticRenderer()
    const reduce = useReducedMotion()

    const target = useMotionValue(0)
    const progress = useSpring(target, {
        stiffness,
        damping,
        mass: 1,
        restDelta: 0.001,
    })

    const [active, setActive] = useState(0)
    const [dragging, setDragging] = useState(false)

    const cfg: CardConfig = useMemo(
        () => ({
            cardWidth,
            cardHeight,
            sideScale,
            spacing,
            depth,
            curve,
            radius,
            maxBlur,
            reflection,
            reflectionStrength,
        }),
        [
            cardWidth,
            cardHeight,
            sideScale,
            spacing,
            depth,
            curve,
            radius,
            maxBlur,
            reflection,
            reflectionStrength,
        ]
    )

    const outerRef = useRef<HTMLDivElement>(null)

    // Wheel + pointer drag → target value; spring + snap do the rest.
    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return
        const el = outerRef.current
        if (!el) return

        const clampT = (v: number) => Math.max(0, Math.min(n - 1, v))
        let snapTimer: number | undefined

        const commit = (v: number) => {
            const t = clampT(Math.round(v))
            target.set(t)
            startTransition(() => setActive(t))
        }
        const scheduleSnap = () => {
            if (snapTimer) window.clearTimeout(snapTimer)
            snapTimer = window.setTimeout(() => commit(target.get()), 160)
        }

        const onWheel = (e: WheelEvent) => {
            const d =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            if (Math.abs(d) < 0.5) return
            e.preventDefault()
            target.set(clampT(target.get() + d * 0.0055))
            scheduleSnap()
        }

        let down = false
        let startX = 0
        let startVal = 0
        let lastX = 0
        let lastT = 0
        let vel = 0
        const perCard = Math.max(120, cardWidth * 0.55)

        const onDown = (e: PointerEvent) => {
            down = true
            startX = lastX = e.clientX
            startVal = target.get()
            lastT = performance.now()
            vel = 0
            setDragging(true)
            el.setPointerCapture?.(e.pointerId)
        }
        const onMove = (e: PointerEvent) => {
            if (!down) return
            const now = performance.now()
            const dx = e.clientX - startX
            target.set(clampT(startVal - dx / perCard))
            const dt = now - lastT
            if (dt > 0) vel = (e.clientX - lastX) / dt // px per ms
            lastX = e.clientX
            lastT = now
        }
        const onUp = (e: PointerEvent) => {
            if (!down) return
            down = false
            setDragging(false)
            el.releasePointerCapture?.(e.pointerId)
            const projected = target.get() - (vel * 150) / perCard
            commit(projected)
        }

        el.addEventListener("wheel", onWheel, { passive: false })
        el.addEventListener("pointerdown", onDown)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        return () => {
            if (snapTimer) window.clearTimeout(snapTimer)
            el.removeEventListener("wheel", onWheel)
            el.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
        }
    }, [n, cardWidth, isStatic, target])

    const labelStyle: CSSProperties = {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: labelColor,
        ...font,
    }

    const edge = (side: "left" | "right"): CSSProperties => ({
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: `${edgeSpread}%`,
        pointerEvents: "none",
        zIndex: 1200,
        backdropFilter: `blur(${edgeStrength}px)`,
        WebkitBackdropFilter: `blur(${edgeStrength}px)`,
        WebkitMaskImage: `linear-gradient(to ${
            side === "left" ? "right" : "left"
        }, #000, transparent)`,
        maskImage: `linear-gradient(to ${
            side === "left" ? "right" : "left"
        }, #000, transparent)`,
    })

    const activeCaption = slides[Math.max(0, Math.min(n - 1, active))]?.caption

    return (
        <div
            ref={outerRef}
            style={{
                position: "relative",
                width: "100%",
                height,
                background,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isStatic ? "default" : dragging ? "grabbing" : "grab",
                touchAction: "pan-y",
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: cardWidth,
                    height: cardHeight,
                    transformStyle: "preserve-3d",
                    perspective,
                    perspectiveOrigin: "center",
                }}
            >
                {slides.map((slide, i) => (
                    <Card
                        key={i}
                        slide={slide}
                        index={i}
                        progress={reduce ? target : progress}
                        cfg={cfg}
                        isStatic={isStatic}
                    />
                ))}
            </div>

            {vignette > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 1150,
                        background: `radial-gradient(125% 85% at 50% 44%, transparent 38%, rgba(0,0,0,${
                            vignette / 100
                        }) 100%)`,
                    }}
                />
            )}

            {edgeStrength > 0 && edgeSpread > 0 && (
                <>
                    <div style={edge("left")} />
                    <div style={edge("right")} />
                </>
            )}

            {(activeCaption || showCounter) && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 28,
                        left: 0,
                        right: 0,
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "center",
                        gap: 16,
                        zIndex: 1300,
                        pointerEvents: "none",
                        ...labelStyle,
                    }}
                >
                    {activeCaption ? <span>{activeCaption}</span> : null}
                    {showCounter ? (
                        <span style={{ opacity: 0.55 }}>
                            {String(active + 1).padStart(2, "0")} —{" "}
                            {String(n).padStart(2, "0")}
                        </span>
                    ) : null}
                </div>
            )}

            {hint && !isStatic ? (
                <div
                    style={{
                        position: "absolute",
                        top: 24,
                        right: 28,
                        opacity: 0.5,
                        zIndex: 1300,
                        pointerEvents: "none",
                        ...labelStyle,
                    }}
                >
                    {hint}
                </div>
            ) : null}
        </div>
    )
}

addPropertyControls(DepthCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide",
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                    placeholder: "Optional",
                },
            },
        },
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 560,
        min: 300,
        max: 1000,
        step: 10,
        unit: "px",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 460,
        min: 200,
        max: 900,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        defaultValue: 300,
        min: 150,
        max: 900,
        step: 10,
        unit: "px",
    },
    sideScale: {
        type: ControlType.Number,
        title: "Side scale",
        defaultValue: 0.66,
        min: 0.3,
        max: 0.95,
        step: 0.01,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 40,
        min: -60,
        max: 220,
        step: 4,
        unit: "px",
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 150,
        min: 0,
        max: 500,
        step: 10,
        description: "translateZ per step back",
    },
    curve: {
        type: ControlType.Number,
        title: "Curve",
        defaultValue: 42,
        min: 0,
        max: 80,
        step: 1,
        description: "Max rotateY angle",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1300,
        min: 400,
        max: 3000,
        step: 50,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 170,
        min: 40,
        max: 400,
        step: 10,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 34,
        min: 8,
        max: 100,
        step: 1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 6,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    maxBlur: {
        type: ControlType.Number,
        title: "Card blur",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    reflection: {
        type: ControlType.Boolean,
        title: "Reflection",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    reflectionStrength: {
        type: ControlType.Number,
        title: "Reflect.",
        defaultValue: 0.3,
        min: 0,
        max: 0.8,
        step: 0.05,
        hidden: (p: any) => !p.reflection,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        defaultValue: 0,
        min: 0,
        max: 90,
        step: 5,
        unit: "%",
        description: "Darken the edges (great on dark bg)",
    },
    edgeSpread: {
        type: ControlType.Number,
        title: "Edge width",
        defaultValue: 22,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    edgeStrength: {
        type: ControlType.Number,
        title: "Edge blur",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ECE5D8",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label",
        defaultValue: "#161413",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hint: {
        type: ControlType.String,
        title: "Hint",
        defaultValue: "Scroll / Drag",
        placeholder: "Leave empty to hide",
    },
    font: {
        type: ControlType.Font,
        title: "Label font",
        controls: "extended",
        defaultValue: {
            fontSize: 12,
            variant: "Regular",
            letterSpacing: "0.08em",
        },
    },
})
