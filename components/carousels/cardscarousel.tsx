// Card Cycle Loop Animation
// Smooth infinite card cycling, each card animates to top; fixed type error (no NodeJS.Timeout refs)
import { useEffect, useRef, useState, useCallback, startTransition } from "react"
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

// Card specifications
const CARD_COUNT = 4
const DEFAULT_IMAGES = [
    { src: "https://framerusercontent.com/images/aHToCGt50zjgliiHinD4clrhY.png", alt: "Earth" },
    { src: "https://framerusercontent.com/images/i3RCSPv038CFfmowYusPjDk0AU.png", alt: "Boxer" },
    { src: "https://framerusercontent.com/images/pleq0qIGPK8Kv3g43MSVVfa4QKg.png", alt: "Palms" },
    { src: "https://framerusercontent.com/images/VXUimKFHmdtKxS0GIrnivksPfA.png", alt: "Redlight" },
]
const DEFAULT_TITLES = ["Earth", "Boxer", "Palms", "Redlight"]
const DEFAULT_COLORS = ["#CA9366", "#222426", "#C7C7C7", "#A61A1A"]
function getDefaultCard(i) {
    return {
        title: DEFAULT_TITLES[i],
        background: DEFAULT_COLORS[i],
        image: DEFAULT_IMAGES[i],
    }
}

// Each variant: top card is active (z=4, opacity=1, scale=1.05, rotate=0), others fade/rotate behind
const CARD_VARIANTS = [
    [ // 0-active
        { z: 4, scale: 1.05, rotate: 0, opacity: 1 },
        { z: 3, scale: 1, rotate: -5, opacity: 0.7 },
        { z: 2, scale: 0.97, rotate: -8, opacity: 0.4 },
        { z: 1, scale: 0.94, rotate: -12, opacity: 0.12 },
    ],
    [ // 1-active
        { z: 1, scale: 0.94, rotate: -12, opacity: 0.12 },
        { z: 4, scale: 1.05, rotate: 0, opacity: 1 },
        { z: 3, scale: 1, rotate: -5, opacity: 0.7 },
        { z: 2, scale: 0.97, rotate: -8, opacity: 0.4 },
    ],
    [ // 2-active
        { z: 2, scale: 0.97, rotate: -8, opacity: 0.4 },
        { z: 1, scale: 0.94, rotate: -12, opacity: 0.12 },
        { z: 4, scale: 1.05, rotate: 0, opacity: 1 },
        { z: 3, scale: 1, rotate: -5, opacity: 0.7 },
    ],
    [ // 3-active
        { z: 3, scale: 1, rotate: -5, opacity: 0.7 },
        { z: 2, scale: 0.97, rotate: -8, opacity: 0.4 },
        { z: 1, scale: 0.94, rotate: -12, opacity: 0.12 },
        { z: 4, scale: 1.05, rotate: 0, opacity: 1 },
    ],
    [ // helper-repeat 0-active for seamless loop
        { z: 4, scale: 1.05, rotate: 0, opacity: 1 },
        { z: 3, scale: 1, rotate: -5, opacity: 0.7 },
        { z: 2, scale: 0.97, rotate: -8, opacity: 0.4 },
        { z: 1, scale: 0.94, rotate: -12, opacity: 0.12 },
    ],
]

/**
 * CardCarousel
 *
 * Smooth infinite card cycling animation for Framer. Four cards loop, one animates up, rest fade/shift behind. Configurable content, colors, images.
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 440
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CardCarousel(props) {
    const {
        cards = [getDefaultCard(0), getDefaultCard(1), getDefaultCard(2), getDefaultCard(3)],
        duration = 0.6,
        delay = 0.4,
        font,
        style,
    } = props
    const [frameIdx, setFrameIdx] = useState(0)
    const timerRef = useRef(null)
    const isStatic = useIsStaticRenderer()

    // Start animation cycle when in preview/canvas, loop infinitely
    useEffect(() => {
        if (isStatic || RenderTarget.current() !== RenderTarget.preview) return
        let active = true
        function loop() {
            if (!active) return
            startTransition(() => {
                setFrameIdx(idx => (idx + 1) % CARD_VARIANTS.length)
            })
            timerRef.current = setTimeout(loop, duration * 1000 + delay * 1000)
        }
        timerRef.current = setTimeout(loop, duration * 1000 + delay * 1000)
        return () => {
            active = false
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [isStatic, duration, delay])

    // Card vertical offset and deck drop-shadow
    const CARD_OFFSET_Y = 34
    // Add support for card and image border radius controls
    const CARD_RADIUS = props.cardRadius ?? 22
    const IMAGE_RADIUS = props.imageRadius ?? 12
    const SHADOW_ACTIVE = "0 8px 32px rgba(0,0,0,0.15)"
    const SHADOW_INACTIVE = "0 1px 8px rgba(0,0,0,0.10)"

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "visible",
                userSelect: "none"
            }}
        >
            {cards.slice(0, CARD_COUNT).map((card, i) => {
                // Current card variant frame
                const v = CARD_VARIANTS[frameIdx][i]
                return (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{
                            opacity: v.opacity,
                            scale: v.scale,
                            rotate: v.rotate,
                            zIndex: v.z,
                            boxShadow: v.z === 4 ? SHADOW_ACTIVE : SHADOW_INACTIVE,
                        }}
                        transition={{
                            duration,
                            ease: [0.645,0.045,0.355,1],
                        }}
                        style={{
                            position: "absolute",
                            top: i * CARD_OFFSET_Y,
                            left: 0,
                            width: "calc(100% - 40px)",
                            height: 140,
                            borderRadius: CARD_RADIUS,
                            background: card.background,
                            zIndex: v.z,
                            boxSizing: "border-box",
                            pointerEvents: v.z === 4 ? "auto" : "none",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            padding: "28px 24px",
                            color: card.textColor || props.textColor || "#fff",
                            gap: 22,
                        }}
                        aria-label={card.title}
                        role="article"
                    >
                        <img
                            src={card.image?.src}
                            alt={card.image?.alt}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: IMAGE_RADIUS,
                                objectFit: "cover",
                                boxShadow: SHADOW_INACTIVE,
                                background: "#fff",
                            }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span
                                style={{
                                    ...font,
                                    fontWeight: 700,
                                    fontSize: font?.fontSize ?? 28,
                                    lineHeight: font?.lineHeight ?? "1.15em",
                                    letterSpacing: font?.letterSpacing ?? "-0.01em",
                                    display: "block",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >{card.title}</span>
                            {/* Content displays only if active */}
                            {v.z === 4 && (
                                <div style={{ marginTop: 10, opacity: 0.84 }}>
                                    <span style={{ fontSize: 15, ...font }}>{card.content || props.content || `Card #${i+1} Active`}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(CardCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, defaultValue: "Card" },
                background: { type: ControlType.Color, defaultValue: "#CA9366" },
                image: { type: ControlType.ResponsiveImage },
                // Add content and textColor control per card
                content: { type: ControlType.String, defaultValue: "" },
                textColor: { type: ControlType.Color, defaultValue: "#fff", optional: true },
            }
        },
        defaultValue: [
            getDefaultCard(0),
            getDefaultCard(1),
            getDefaultCard(2),
            getDefaultCard(3),
        ],
        maxCount: 4,
    },
    duration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.6,
        min: 0.2,
        max: 1.2,
        step: 0.05,
        unit: "s"
    },
    delay: {
        type: ControlType.Number,
        title: "Delay Between Cycles",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.2,
        step: 0.05,
        unit: "s"
    },
    font: {
        type: ControlType.Font,
        title: "Card Font",
        defaultFontType: "sans-serif",
        controls: "extended",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.15em",
        },
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Corner Radius",
        min: 0,
        max: 48,
        defaultValue: 22,
        unit: "px",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Corner Radius",
        min: 0,
        max: 36,
        defaultValue: 12,
        unit: "px",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff"
    },
    content: {
        type: ControlType.String,
        title: "Additional Content",
        defaultValue: ""
    },
})
