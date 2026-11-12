// WordCarousel.framer.tsx
import * as React from "react"
import { useEffect, useRef, useState } from "react"
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


type Props = {
    words: string[]
    sweepMs: number
    holdMs: number
    className?: string
    font?: any
    fontSize?: number
}

// framer-motion accepts a 4-number bezier tuple for `ease`
const SWEEP_EASE: [number, number, number, number] = [0.2, 0, 0.3, 0.3]
const FADE_MS = 250 // dissolve length
const GAP_MS = 70 // slight pause after fade

export default function WordCarousel(props: Props) {
    const { words, sweepMs, holdMs, className = "", font, fontSize } = props

    const [idx, setIdx] = useState(0)
    const [fadeOut, setFadeOut] = useState(false)
    const timer = useRef<number | null>(null)
    const fadeTimer = useRef<number | null>(null)

    useEffect(() => {
        if (!words?.length) return
        if (timer.current) window.clearTimeout(timer.current)
        if (fadeTimer.current) window.clearTimeout(fadeTimer.current)

        // start fading just before the end of the cycle, then leave a tiny gap
        fadeTimer.current = window.setTimeout(
            () => {
                setFadeOut(true)
            },
            Math.max(0, sweepMs + holdMs - FADE_MS - GAP_MS)
        )

        // switch after fade + gap
        timer.current = window.setTimeout(
            () => {
                setFadeOut(false)
                setIdx((i) => (i + 1) % words.length)
            },
            sweepMs + holdMs + GAP_MS
        )

        return () => {
            if (timer.current) window.clearTimeout(timer.current)
            if (fadeTimer.current) window.clearTimeout(fadeTimer.current)
        }
    }, [idx, words, sweepMs, holdMs])

    const word = words?.[idx] ?? ""

    const gradient = `
    linear-gradient(in oklch 90deg,
      #000000 0%,  #000000 30%,
      #FF0099 35%,
      #FF0000 45%,
      #FF4F04 50%,
      #FFA600 55%,
      #F8F8F8 60%,
      #0056FF 65%,
      #FFFFFF 70%, #FFFFFF 100%
    )
  `

    // Build typography from Framer Font control (robust to both key shapes)
    const fontStyle: React.CSSProperties = toFontStyle(font)

    // Allow explicit fontSize prop to override font control size
    if (typeof fontSize === "number" && fontSize > 0) {
        fontStyle.fontSize = fontSize
        // preserve relative line-height behavior if not provided
        if (!fontStyle.lineHeight) fontStyle.lineHeight = "1.2em"
    }

    // Reuse the exact same typography on both layers (no reliance on inheritance)
    const typography: React.CSSProperties = {
        fontFamily: fontStyle.fontFamily,
        fontWeight: fontStyle.fontWeight as any,
        fontStyle: fontStyle.fontStyle,
        fontSize: fontStyle.fontSize,
        lineHeight: fontStyle.lineHeight as any,
        letterSpacing: fontStyle.letterSpacing as any,
    }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <span
                aria-live="polite"
                className={className}
                style={{
                    position: "relative",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    ...typography,
                }}
            >
                {/* underlay: reveals late, then dissolves before switch */}
                <motion.span
                    key={`black-${idx}`}
                    style={{ color: "#000000", ...typography }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: fadeOut ? 0 : 1 }}
                    transition={
                        fadeOut
                            ? { duration: FADE_MS / 1000, ease: "easeOut" }
                            : {
                                  delay: (sweepMs * 0.8) / 1000,
                                  duration: 0.12,
                                  ease: "easeOut",
                              }
                    }
                >
                    {word}
                </motion.span>

                {/* overlay: gradient sweep */}
                <motion.span
                    key={`overlay-${idx}`}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "-0.30em",
                        bottom: "-0.30em",
                        paddingTop: "0.30em",
                        paddingBottom: "0.30em",
                        lineHeight: "inherit",
                        pointerEvents: "none",
                        backgroundOrigin: "padding-box",
                        backgroundImage: gradient,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "400% 100%",
                        willChange: "background-position, opacity, filter",
                        // ← motion-blur via CSS var so it animates smoothly
                        filter: "blur(var(--blur))",
                        ...typography,
                    }}
                    initial={{
                        backgroundPositionX: "100%",
                        opacity: 1,
                        ["--blur" as any]: "4px",
                    }}
                    animate={{
                        backgroundPositionX: "0%",
                        opacity: [1, 1, 0],
                        ["--blur" as any]: ["4px", "0.5px", "0px"], // strong → subtle → crisp
                    }}
                    transition={{
                        backgroundPositionX: {
                            duration: sweepMs / 1000,
                            ease: SWEEP_EASE,
                        },
                        opacity: {
                            duration: sweepMs / 1000,
                            times: [0, 0.985, 1],
                            ease: "linear",
                        },
                        ["--blur" as any]: {
                            duration: sweepMs / 1000,
                            times: [0, 0.8, 1],
                            ease: "easeOut",
                        },
                    }}
                >
                    {word}
                </motion.span>
            </span>
        </div>
    )
}

function toFontStyle(font?: any): React.CSSProperties {
    if (!font) return {}
    // Handle both Framer's common shape (fontFamily, fontWeight, ...) and the alternate (family, weight, ...)
    const fontFamily = font.fontFamily ?? font.family
    const fontWeight = font.fontWeight ?? font.weight
    const fontStyle = font.fontStyle ?? font.style
    const fontSize = font.fontSize ?? font.size
    const lineHeightRaw = font.lineHeight
    const letterSpacing = font.letterSpacing

    const computedLineHeight =
        typeof lineHeightRaw === "number" && typeof fontSize === "number"
            ? `${(lineHeightRaw / 100) * fontSize}px`
            : lineHeightRaw

    return {
        fontFamily,
        fontStyle,
        fontWeight,
        fontSize,
        lineHeight: computedLineHeight,
        letterSpacing,
    }
}

/** ---------- Framer Controls ---------- */

addPropertyControls(WordCarousel, {
    words: {
        type: ControlType.Array,
        title: "Words",
        propertyControl: { type: ControlType.String, placeholder: "Word" },
        defaultValue: ["fast", "smooth", "colorful", "crisp"],
    },
    sweepMs: {
        type: ControlType.Number,
        title: "Sweep (ms)",
        min: 100,
        max: 5000,
        step: 10,
        defaultValue: 750,
    },
    holdMs: {
        type: ControlType.Number,
        title: "Hold (ms)",
        min: 0,
        max: 10000,
        step: 10,
        defaultValue: 2000,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 256,
        step: 1,
        displayStepper: true,
        defaultValue: 64,
    },
})

WordCarousel.defaultProps = {
    width: 600,
    height: 100,
    words: ["fast", "smooth", "colorful", "crisp"],
    sweepMs: 750,
    holdMs: 2000,
    fontSize: 64,
}
