import { useRef, useEffect, useMemo, useState } from "react"
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    type MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface CardData {
    color: string
    textColor: string
    image?: string // optional — when set, image fills card and text is hidden
}

// ─────────────────────────────────────────────────────────────
// Default card palette
// ─────────────────────────────────────────────────────────────
const DEFAULT_CARDS: CardData[] = [
    { color: "#c4ff00", textColor: "#1a1a1a" },
    { color: "#0a4d22", textColor: "#ffffff" },
    { color: "#ff2a00", textColor: "#ffffff" },
    { color: "#ff7b00", textColor: "#1a1a1a" },
    { color: "#ffc400", textColor: "#1a1a1a" },
    { color: "#a6c8ff", textColor: "#1a1a1a" },
    { color: "#0044ff", textColor: "#ffffff" },
    { color: "#ffffff", textColor: "#1a1a1a" },
    { color: "#333333", textColor: "#ffffff" },
]

// ─────────────────────────────────────────────────────────────
// Rotation angles
// ─────────────────────────────────────────────────────────────
const getFinalRot = (i: number, total: number) => -60 + i * (360 / total) // evenly spread circle

// ─────────────────────────────────────────────────────────────
// Mathematically correct centering
// ─────────────────────────────────────────────────────────────
function computeStackedOffset(
    initialAngleDeg: number,
    cardW: number,
    cardH: number
) {
    const θ = (initialAngleDeg * Math.PI) / 180
    const cx = cardW / 2
    const cy = -cardH / 2
    return {
        stackedX: -(cx * Math.cos(θ) - cy * Math.sin(θ)),
        stackedY: -(cx * Math.sin(θ) + cy * Math.cos(θ)),
    }
}

// When fully fanned, cards form a uniform circle → average center ≈ (0,0)
const FANNED_X = 0
const FANNED_Y = 0

// ─────────────────────────────────────────────────────────────
// Card component – receives a live MotionValue<number> (0 → 1)
// ─────────────────────────────────────────────────────────────
function CardItem({
    card,
    index,
    total,
    progress,
    initialAngle,
    cardW,
    cardH,
    cardRadius,
}: {
    card: CardData
    index: number
    total: number
    progress: MotionValue<number>
    initialAngle: number
    cardW: number
    cardH: number
    cardRadius: number
}) {
    const rotate = useTransform(
        progress,
        [0, 1],
        [initialAngle, getFinalRot(index, total)]
    )

    const hasImage = Boolean(card.image)

    return (
        <motion.div
            style={{
                position: "absolute",
                width: cardW,
                height: cardH,
                left: 0,
                bottom: 0,
                transformOrigin: "left bottom", // pivot = bottom-left corner of card
                zIndex: total - index,
                borderRadius: cardRadius,
                backgroundColor: card.color,
                overflow: "hidden",
                rotate,
            }}
        >
            {/* ── Custom image — fills the card entirely ── */}
            {hasImage && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${card.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: cardRadius,
                    }}
                />
            )}

            {/* Clearcoat sheen — simulates meshPhysicalMaterial clearcoat */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(135deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 42%, transparent 100%)",
                    borderRadius: cardRadius,
                    pointerEvents: "none",
                }}
            />

            {/* Emissive colour glow — only when no image */}
            {!hasImage && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(ellipse at 25% 25%, ${card.color}55 0%, transparent 65%)`,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Card text — hidden entirely when a custom image is set */}
            {!hasImage && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        padding: `${cardH * 0.093}px ${cardW * 0.075}px`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        fontFamily:
                            "'Inter', system-ui, -apple-system, sans-serif",
                    }}
                >
                    {/* Brand — top right */}
                    <div
                        style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                        <span
                            style={{
                                color: card.textColor,
                                fontSize: Math.max(
                                    12,
                                    Math.round(cardH * 0.159)
                                ),
                                fontWeight: 700,
                                letterSpacing: -0.8,
                                lineHeight: 1,
                            }}
                        >
                            rico
                        </span>
                    </div>

                    {/* Bottom row */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                        }}
                    >
                        {/* PAN — bottom left */}
                        <span
                            style={{
                                color: card.textColor,
                                fontSize: Math.max(
                                    8,
                                    Math.round(cardH * 0.066)
                                ),
                                letterSpacing: 3,
                                fontFamily: "monospace",
                                opacity: 0.72,
                            }}
                        >
                            **** 4562
                        </span>

                        {/* Network badge — bottom right */}
                        <span
                            style={{
                                color: card.textColor,
                                fontSize: Math.max(
                                    10,
                                    Math.round(cardH * 0.099)
                                ),
                                fontWeight: 700,
                                fontStyle: "italic",
                            }}
                        >
                            VISA
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────
// Root Framer Component
// ─────────────────────────────────────────────────────────────
export default function CardFan({
    backgroundColor = "#e5e5e5",
    previewProgress = 0,
    cards = DEFAULT_CARDS,
    initialAngle = 0,
    cardWidth = 240,
    cardHeight = 151,
    cardScale = 1,
    cardRadius = 14,
}: {
    /** Canvas/page background colour */
    backgroundColor?: string
    /**
     * 0 = stacked  |  1 = fully fanned
     * Used to preview states in the Framer canvas.
     * At runtime this is overridden by the internal scroll position.
     */
    previewProgress?: number
    /**
     * Array of card definitions. Each card has a background color,
     * text color, and an optional image. When an image is provided
     * the card text is hidden and the image fills the card entirely.
     * Add or remove items to control how many cards appear in the fan.
     */
    cards?: CardData[]
    /**
     * Initial rotation angle of the stacked cards in degrees.
     * 0° = perfectly centered (default). Positive = clockwise tilt.
     */
    initialAngle?: number
    /** Base card width in px (auto-scales to fit container) */
    cardWidth?: number
    /** Base card height in px (auto-scales to fit container) */
    cardHeight?: number
    /** Multiplier to adjust the overall scale of the cards */
    cardScale?: number
    /** Border radius of the cards */
    cardRadius?: number
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const total = cards.length

    // ── Responsive scale ─────────────────────────────────────
    // Measure the container via ResizeObserver and compute a
    // uniform scale so the full fanned circle always fits with
    // 10% padding, regardless of viewport or breakpoint.
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setContainerSize({
                w: width || el.offsetWidth,
                h: height || el.offsetHeight,
            })
        })
        ro.observe(el)
        // Initial measurement
        setContainerSize({ w: el.offsetWidth, h: el.offsetHeight })
        return () => ro.disconnect()
    }, [])

    // Outer radius of the fanned circle ≈ card diagonal from pivot corner
    const fanRadius = Math.sqrt(cardWidth * cardWidth + cardHeight * cardHeight)

    // Calculate scale to fit within container with 10% padding, then apply user's cardScale
    const scale =
        (containerSize.w === 0 && containerSize.h === 0
            ? 1 // Default to 1 before measurement
            : Math.min(
                  (containerSize.w * 0.9) / (fanRadius * 2),
                  (containerSize.h * 0.9) / (fanRadius * 2),
                  1.5 // never blow up beyond 150% on very large screens naturally
              )) * cardScale

    // Apply scale directly to dimensions instead of CSS transform for perfect anti-aliasing
    const responsiveCardW = cardWidth * scale
    const responsiveCardH = cardHeight * scale

    // Recompute stacked offset whenever initialAngle or responsive card size changes
    const { stackedX, stackedY } = useMemo(
        () =>
            computeStackedOffset(
                initialAngle,
                responsiveCardW,
                responsiveCardH
            ),
        [initialAngle, responsiveCardW, responsiveCardH]
    )

    // Drive progress from the internal scroll container
    const { scrollYProgress } = useScroll({ container: scrollRef })

    // Smooth spring — matches the original drei ScrollControls damping feel
    const progress = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 20,
        mass: 1,
    })

    // Derive the group translation from the same progress value
    const groupX = useTransform(progress, [0, 1], [stackedX, FANNED_X])
    const groupY = useTransform(progress, [0, 1], [stackedY, FANNED_Y])

    // Seed scroll position from previewProgress so the canvas renders accurately
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        requestAnimationFrame(() => {
            const max = el.scrollHeight - el.clientHeight
            if (max > 0) el.scrollTop = previewProgress * max
        })
    }, [previewProgress])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* ── Invisible scroll-capture layer ─────────────────────
          Sits on top (zIndex 10) and intercepts all scroll events.
          Cards below have pointerEvents:none so scroll always lands here.
      ──────────────────────────────────────────────────────── */}
            <style>{`
        .cf-scroll::-webkit-scrollbar { display: none; }
      `}</style>
            <div
                ref={scrollRef}
                className="cf-scroll"
                style={{
                    position: "absolute",
                    inset: 0,
                    overflowY: "scroll",
                    zIndex: 10,
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE/Edge
                }}
            >
                {/* 3× height gives a natural, non-rushed scroll arc */}
                <div style={{ height: "300%", width: "100%" }} />
            </div>

            {/* ── Card render layer ─────────────────────────────────
          pointerEvents:none lets scroll pass through to the layer above.
      ──────────────────────────────────────────────────────── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                {/* Group pivot — exactly at container centre.
            Translates to offset the stacked visual centre. */}
                <motion.div
                    style={{
                        position: "relative",
                        width: 0,
                        height: 0,
                        x: groupX,
                        y: groupY,
                    }}
                >
                    {cards.map((card, index) => (
                        <CardItem
                            key={index}
                            card={card}
                            index={index}
                            total={total}
                            progress={progress}
                            initialAngle={initialAngle}
                            cardW={responsiveCardW}
                            cardH={responsiveCardH}
                            cardRadius={cardRadius}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// Framer Property Controls
// ─────────────────────────────────────────────────────────────
addPropertyControls(CardFan, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#e5e5e5",
    },
    previewProgress: {
        type: ControlType.Number,
        title: "Preview State",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description: "0 = stacked · 1 = fanned (canvas preview only)",
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            title: "Card",
            controls: {
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#c4ff00",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#1a1a1a",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
    initialAngle: {
        type: ControlType.Number,
        title: "Initial Angle",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        displayStepper: true,
        description: "Stacked rotation in degrees. 0° = perfectly centered.",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Base Width",
        defaultValue: 240,
        min: 80,
        max: 600,
        step: 1,
        displayStepper: true,
        description: "Base card width (auto-scales to fit container).",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Base Height",
        defaultValue: 151,
        min: 50,
        max: 400,
        step: 1,
        displayStepper: true,
        description: "Base card height (auto-scales to fit container).",
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card Scale",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.05,
        displayStepper: true,
        description: "Adjust the overall scale of the cards.",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 14,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        description: "Border radius of the cards.",
    },
})
