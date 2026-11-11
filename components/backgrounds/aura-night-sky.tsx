import * as React from "react"
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

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 */

type Props = {
    backgroundColor?: string
    stripesColor?: string
    rainbowColors?: string[]
    speed?: number
    stripeWidth?: number
    fadeEdges?: boolean
    /** 0–100, 50 ≈ original */
    fadeStrength?: number
}

const baseDuration = 60 // seconds at speed = 1

const jumboVariants = (speed: number) => ({
    animate: {
        backgroundPosition: ["50% 50%", "350% 50%"],
        transition: {
            duration: Math.max(1, baseDuration / Math.max(0.1, speed)),
            repeat: Infinity as const,
            ease: "linear",
        },
    },
})

const clamp = (n: number, min: number, max: number) =>
    Math.min(max, Math.max(min, n))

const jumboStyles = (
    stripesColor: string,
    rainbowColors: string[],
    stripeWidth: number,
    fadeEdges: boolean,
    fadeStrength: number
) => {
    // Map 0–100 strength to inner/outer stops, centered at 50 → 40/70 (original)
    const inner = clamp(40 - (fadeStrength - 50) * 0.2, 25, 55) // opaque radius
    const outer = clamp(70 + (fadeStrength - 50) * 0.3, 55, 90) // fade end

    return {
        position: "absolute" as const,
        inset: "-10px",
        opacity: 0.5,
        filter: "blur(10px) opacity(50%) saturate(200%)",
        // Turn mask on/off via control
        maskImage: fadeEdges
            ? `radial-gradient(ellipse at 100% 0%, black ${inner}%, transparent ${outer}%)`
            : "none",
        pointerEvents: "none" as const,
        backgroundImage: `repeating-linear-gradient(
      100deg,
      ${stripesColor} 0%,
      ${stripesColor} ${stripeWidth}%,
      transparent ${stripeWidth + 3}%,
      transparent ${stripeWidth + 5}%,
      ${stripesColor} ${stripeWidth + 9}%
    ), repeating-linear-gradient(
      100deg,
      ${rainbowColors[0]} 10%,
      ${rainbowColors[1]} 15%,
      ${rainbowColors[2]} 20%,
      ${rainbowColors[3]} 25%,
      ${rainbowColors[4]} 30%
    )`,
        backgroundSize: "300%, 200%",
        backgroundPosition: "50% 50%, 50% 50%",
    }
}

const containerStyles = (bgColor: string) => ({
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    backgroundColor: bgColor,
    transition: "background-color 0.3s",
})

export default function AuraNightSky(props: Props) {
    const {
        backgroundColor,
        stripesColor,
        rainbowColors = [],
        speed = 1,
        stripeWidth = 7,
        fadeEdges = true,
        fadeStrength = 50,
    } = props

    const colors =
        rainbowColors.length >= 5
            ? rainbowColors
            : ["#60a5fa", "#e879f9", "#60a5fa", "#5eead4", "#60a5fa"]

    return (
        <main style={containerStyles(backgroundColor!)}>
            <motion.div
                style={jumboStyles(
                    stripesColor!,
                    colors,
                    stripeWidth,
                    fadeEdges,
                    fadeStrength
                )}
                variants={jumboVariants(speed)}
                animate="animate"
            />
        </main>
    )
}

AuraNightSky.defaultProps = {
    backgroundColor: "#ffffff",
    stripesColor: "#ffffff",
    rainbowColors: ["#60a5fa", "#e879f9", "#60a5fa", "#5eead4", "#60a5fa"],
    speed: 1,
    stripeWidth: 7,
    fadeEdges: true,
    fadeStrength: 50, // ≈ original 40%→70% fade
}

addPropertyControls(AuraNightSky, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    stripesColor: {
        type: ControlType.Color,
        title: "Stripes",
        defaultValue: "#ffffff",
    },
    rainbowColors: {
        type: ControlType.Array,
        title: "Rainbow",
        propertyControl: { type: ControlType.Color },
        defaultValue: ["#60a5fa", "#e879f9", "#60a5fa", "#5eead4", "#60a5fa"],
        description: "Five colors for the diagonal rainbow layer.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.1,
        displayStepper: true,
        description: "Animation speed multiplier. Higher = faster.",
    },
    stripeWidth: {
        type: ControlType.Number,
        title: "Stripe Width",
        defaultValue: 7,
        min: 1,
        max: 50,
        step: 1,
        displayStepper: true,
        description: "Width of diagonal stripes (% of gradient span).",
    },
    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: true,
        description:
            "Apply a soft radial mask so the effect fades near the edges.",
    },
    fadeStrength: {
        type: ControlType.Number,
        title: "Fade Strength",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden: (props: any) => !props.fadeEdges,
        description:
            "0 = minimal fade, 100 = strongest fade. 50 ≈ original look.",
    },
})
