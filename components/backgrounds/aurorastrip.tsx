import React from "react"
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
    useScroll,
    useVelocity,
    useSpring,
    useTransform,
} from "framer-motion"

/**
 * AuroraStrip — scroll-velocity reactive glowing background strip.
 *
 * Fixes in this version:
 * 1. Blobs now genuinely travel across the strip. Motion is driven by
 *    framer-motion keyframes (x / y / scale) instead of injected CSS
 *    keyframes, and the travel distance is large enough to read through
 *    a heavy blur. Previous version moved each blob only ~15% of its own
 *    width, which the 40px blur flattened into a static-looking smear.
 * 2. Single render layer. Opacity is one motion value = rest opacity plus
 *    a scroll-velocity boost, so scroll reactivity is preserved without
 *    duplicating (and desyncing) the blob layer.
 * 3. useIsStaticRenderer() is used only to freeze motion on canvas/export.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 120
 */
export default function AuroraStrip(props) {
    const {
        colors = ["#C2A0E8", "#7B8FE6", "#4C9FD6", "#39A8BE", "#41B295"],
        height = 120,
        baseOpacity = 0.35,
        maxOpacity = 0.7,
        blur = 40,
        speed = 9,
        travel = 160,
        velocitySensitivity = 1500,
        blendMode = "normal",
        style,
        ...rest
    } = props

    const isStatic = useIsStaticRenderer()

    // Scroll velocity adds brightness on top of the resting opacity.
    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const smoothVelocity = useSpring(scrollVelocity, {
        stiffness: 350,
        damping: 90,
        restDelta: 0.5,
    })

    const liveOpacity = useTransform(smoothVelocity, (latest) => {
        const intensity = Math.min(
            Math.abs(latest) / Math.max(1, velocitySensitivity),
            1
        )
        return baseOpacity + intensity * Math.max(0, maxOpacity - baseOpacity)
    })

    const maskStyles = {
        maskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 50%, rgba(0,0,0,0) 100%)",
    }

    return (
        <div
            title="AI+ Aurora Strip"
            style={{
                position: "relative",
                width: "100%",
                height,
                overflow: "hidden",
                pointerEvents: "none",
                ...maskStyles,
                ...style,
            }}
            {...rest}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: `-${blur * 1.5}px`,
                    overflow: "hidden",
                    filter: `blur(${blur}px)`,
                    opacity: isStatic ? baseOpacity : liveOpacity,
                }}
            >
                {colors.map((color, idx) => {
                    const size = 200 + idx * 55
                    const duration = Math.max(2, speed * (1 + idx * 0.28))
                    const reversed = idx % 2 === 1

                    // Home position: spread evenly across the full width so
                    // blobs cover the whole strip instead of clustering left.
                    const homeLeft = ((idx + 0.5) / colors.length) * 100

                    // Drift AROUND the home spot, in pixels, so travel reads
                    // the same regardless of blob size or strip width.
                    const xKeys = [
                        -travel * 0.6,
                        travel * 0.5,
                        travel * 0.9,
                        -travel * 0.3,
                        -travel * 0.6,
                    ]
                    const yKeys = [-30, 22, -12, 28, -30]
                    const scaleKeys = [1, 1.22, 0.88, 1.12, 1]

                    if (reversed) {
                        xKeys.reverse()
                        yKeys.reverse()
                    }

                    return (
                        <motion.div
                            key={idx}
                            initial={false}
                            animate={
                                isStatic
                                    ? {
                                          x: xKeys[1],
                                          y: yKeys[1],
                                          scale: scaleKeys[1],
                                      }
                                    : { x: xKeys, y: yKeys, scale: scaleKeys }
                            }
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          duration,
                                          repeat: Infinity,
                                          repeatType: "loop",
                                          ease: "easeInOut",
                                          delay: idx * 0.45,
                                      }
                            }
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: `${homeLeft}%`,
                                marginTop: -size / 2,
                                marginLeft: -size / 2,
                                width: size,
                                height: size,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
                                mixBlendMode: blendMode,
                                willChange: "transform",
                                opacity: 0.65,
                            }}
                        />
                    )
                })}
            </motion.div>
        </div>
    )
}

addPropertyControls(AuroraStrip, {
    colors: {
        type: ControlType.Array,
        title: "Palette Colors",
        description:
            "One drifting blob per color. Add or remove colors to change how busy the strip looks. Later colors are larger and slower.",
        control: { type: ControlType.Color },
        defaultValue: ["#C2A0E8", "#7B8FE6", "#4C9FD6", "#39A8BE", "#41B295"],
        maxCount: 8,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        description:
            "How blobs mix with each other and the page behind. Normal for light backgrounds, Screen for dark ones.",
        options: ["normal", "screen", "multiply", "overlay", "color-dodge"],
        optionTitles: [
            "Normal (Light Themes)",
            "Screen (Dark Themes)",
            "Multiply",
            "Overlay",
            "Color Dodge",
        ],
        defaultValue: "normal",
    },
    height: {
        type: ControlType.Number,
        title: "Height (px)",
        description:
            "Fallback height of the strip. Resizing the layer on canvas overrides this.",
        min: 40,
        max: 300,
        step: 1,
        defaultValue: 120,
    },
    baseOpacity: {
        type: ControlType.Number,
        title: "Rest Opacity",
        description:
            "How visible the glow is when the page is not scrolling. This is the floor, the strip never fades below it.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    maxOpacity: {
        type: ControlType.Number,
        title: "Max Opacity",
        description:
            "Peak brightness reached at full scroll speed. Set it equal to Rest Opacity to switch the scroll reaction off.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur (px)",
        description:
            "Softness of the blobs. High values look like ambient light but hide motion, low values show distinct colored orbs.",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 40,
    },
    speed: {
        type: ControlType.Number,
        title: "Drift Cycle (s)",
        description:
            "Seconds for one blob to complete its loop. Lower is faster. Each blob is progressively slower than the one before it.",
        min: 3,
        max: 30,
        step: 0.5,
        defaultValue: 9,
    },
    travel: {
        type: ControlType.Number,
        title: "Drift Distance (px)",
        description:
            "How far each blob wanders from its spot. Low values feel like a slow breathe, high values sweep across the strip.",
        min: 20,
        max: 400,
        step: 10,
        defaultValue: 160,
    },
    velocitySensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        description:
            "Scroll speed needed to hit Max Opacity. Lower means the strip lights up from a gentle scroll, higher needs a fast flick.",
        min: 300,
        max: 4000,
        step: 100,
        defaultValue: 1500,
    },
})
