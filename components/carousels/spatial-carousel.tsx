import * as React from "react"
import { useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useTransform, useSpring, useScroll } from "framer-motion"

/**
 * SPATIAL CAROUSEL (Sticky Scroll)
 * Uses native page scroll to drive a 3D, multi-directional carousel.
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fit
 * @framerDisableUnlink
 */
export default function SpatialCarousel(props) {
    const {
        items,
        gap,
        xSpread,
        rotation,
        damping,
        stiffness,
        perspective,
        scaleFalloff,
        opacityFalloff,
        scrollPerItem,
        style, // Extracted style for Framer canvas positioning
    } = props

    // Fallback UI when no items are connected yet
    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(136, 85, 255, 0.1)",
                    color: "#8855FF",
                    borderRadius: 8,
                    padding: 20,
                    textAlign: "center",
                    minHeight: 200,
                }}
            >
                Connect Cards in the Properties Panel
            </div>
        )
    }

    const containerRef = useRef(null)
    const maxScroll = Math.max(0, items.length - 1)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    // Map the scroll progress (0 to 1) to the item index (0 to maxScroll)
    const rawIndex = useTransform(scrollYProgress, [0, 1], [0, maxScroll])

    // Apply the spring physics to the mapped index
    const smoothIndex = useSpring(rawIndex, {
        damping: damping,
        stiffness: stiffness,
        mass: 1,
    })

    // Outer container needs to be tall enough to scroll through all items
    const outerContainerStyle = {
        // Creates fake height: e.g., 100vh per item
        height: `${items.length * scrollPerItem}vh`,
        position: "relative",
        width: "100%",
    }

    // Inner container stays pinned to the screen while we scroll the outer one
    const stickyContainerStyle = {
        position: "sticky",
        top: 0,
        width: "100%",
        height: "100vh", // Fills the screen while pinned
        perspective: `${perspective}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    }

    return (
        <div ref={containerRef} style={{ ...outerContainerStyle, ...style }}>
            <div style={stickyContainerStyle}>
                {items.map((item, index) => {
                    return (
                        <Card
                            key={index}
                            index={index}
                            content={item}
                            scrollMotion={smoothIndex}
                            gap={gap}
                            xSpread={xSpread}
                            rotation={rotation}
                            scaleFalloff={scaleFalloff}
                            opacityFalloff={opacityFalloff}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function Card(props) {
    const {
        index,
        content,
        scrollMotion,
        gap,
        xSpread,
        rotation,
        scaleFalloff,
        opacityFalloff,
    } = props

    // Calculate distance from center.
    // Dependency arrays added so Framer UI sliders update the preview immediately!
    const dist = useTransform(scrollMotion, (latest) => index - latest, [index])

    // Transform logic
    const y = useTransform(dist, (d) => d * gap, [gap])
    const x = useTransform(dist, (d) => d * xSpread, [xSpread])
    const rotateZ = useTransform(dist, (d) => d * rotation, [rotation])

    // Scale: 1 at center, smaller as it moves away
    const scale = useTransform(
        dist,
        (d) => {
            return Math.max(0, 1 - Math.abs(d) * (scaleFalloff / 100))
        },
        [scaleFalloff]
    )

    // Opacity: Fades out based on distance
    const opacity = useTransform(
        dist,
        (d) => {
            return Math.max(0, 1 - Math.abs(d) * (opacityFalloff / 100))
        },
        [opacityFalloff]
    )

    // Z-Index: Ensure closest item is always on top
    const zIndex = useTransform(
        dist,
        (d) => {
            return Math.round(1000 - Math.abs(d) * 10)
        },
        []
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                x,
                y,
                rotateZ,
                scale,
                opacity,
                zIndex,
                transformOrigin: "center bottom",
                width: "fit-content",
                height: "fit-content",
            }}
        >
            {content}
        </motion.div>
    )
}

// Default Properties
SpatialCarousel.defaultProps = {
    items: [],
    gap: 200,
    xSpread: 600,
    rotation: 60,
    damping: 30,
    stiffness: 200,
    perspective: 1000,
    scaleFalloff: 10,
    opacityFalloff: 30,
    scrollPerItem: 100,
}

// Property Controls
addPropertyControls(SpatialCarousel, {
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
        title: "Cards",
    },
    scrollPerItem: {
        type: ControlType.Number,
        title: "Scroll Dist",
        min: 50,
        max: 300,
        defaultValue: 100,
        unit: "vh",
        description: "How much scrolling is required to pass one item",
    },
    gap: {
        type: ControlType.Number,
        title: "V Gap",
        min: -500,
        max: 1000,
        step: 10,
        defaultValue: 200,
    },
    xSpread: {
        type: ControlType.Number,
        title: "H Spread",
        min: -2000,
        max: 2000,
        step: 10,
        defaultValue: 600,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: -360,
        max: 360,
        defaultValue: 60,
        unit: "deg",
    },
    scaleFalloff: {
        type: ControlType.Number,
        title: "Scale Drop",
        min: 0,
        max: 100,
        defaultValue: 10,
        unit: "%",
    },
    opacityFalloff: {
        type: ControlType.Number,
        title: "Fade",
        min: 0,
        max: 100,
        defaultValue: 30,
        unit: "%",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 0,
        max: 3000,
        defaultValue: 1000,
    },
    damping: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 30,
        min: 5,
        max: 100,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 200,
        min: 10,
        max: 500,
    },
})
