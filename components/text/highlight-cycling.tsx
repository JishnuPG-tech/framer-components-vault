/**
 * Highlight Marker Text Reveal
 * Cycling text with a colored bar wipe transition
 * Pre/post text stays static while words cycle with a highlight marker effect
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 80
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
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

type Direction = "left" | "right" | "up" | "down"

interface Props {
    textBefore?: string
    textAfter?: string
    words?: string[]
    font?: Record<string, any>
    textColor?: string
    markerColor?: string
    direction?: Direction
    cycleDuration?: number
    transitionDuration?: number
    barOverflow?: number
}

// For each direction, the bar wipes continuously in that direction:
// cover phase enters from the opposite side, reveal phase exits to the named side
const DIRECTION_CONFIG: Record<
    Direction,
    { prop: "scaleX" | "scaleY"; coverOrigin: string; revealOrigin: string }
> = {
    right: {
        prop: "scaleX",
        coverOrigin: "left center",
        revealOrigin: "right center",
    },
    left: {
        prop: "scaleX",
        coverOrigin: "right center",
        revealOrigin: "left center",
    },
    down: {
        prop: "scaleY",
        coverOrigin: "center top",
        revealOrigin: "center bottom",
    },
    up: {
        prop: "scaleY",
        coverOrigin: "center bottom",
        revealOrigin: "center top",
    },
}

type Phase = "idle" | "cover" | "reveal"

export default function HighlightMarkerTextReveal(props: Props) {
    const {
        textBefore = "We help you rethink",
        textAfter = "",
        words = ["workflows", "handovers", "marketing"],
        font = {},
        textColor = "#000000",
        markerColor = "#C700EF",
        direction = "right",
        cycleDuration = 2.5,
        transitionDuration = 0.5,
        barOverflow = 0.06,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [phase, setPhase] = useState<Phase>("reveal")
    const [reducedMotion, setReducedMotion] = useState(false)

    // Width animation
    const textRef = useRef<HTMLSpanElement>(null)
    const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)
    const hasInitialized = useRef(false)

    const dirConfig = DIRECTION_CONFIG[direction] || DIRECTION_CONFIG.right
    const safeWords =
        Array.isArray(words) && words.length > 0 ? words : ["text"]

    // Clamp index if words array shrinks (e.g. user removes items in Framer)
    const safeIndex = currentIndex % safeWords.length

    // Reduced motion check
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])

    // Measure cycling word width for smooth container transitions
    useLayoutEffect(() => {
        if (isStaticRenderer || !textRef.current) return
        setMeasuredWidth(textRef.current.getBoundingClientRect().width)
        if (!hasInitialized.current) hasInitialized.current = true
    }, [safeIndex, safeWords, isStaticRenderer])

    // Idle timer — after holding, start the cover phase
    useEffect(() => {
        if (isStaticRenderer || reducedMotion) return
        if (phase !== "idle") return
        if (safeWords.length <= 1) return

        const timer = setTimeout(() => setPhase("cover"), cycleDuration * 1000)
        return () => clearTimeout(timer)
    }, [
        phase,
        cycleDuration,
        safeWords.length,
        isStaticRenderer,
        reducedMotion,
    ])

    // When direction changes mid-animation, the bar remounts via key={direction}
    // with initial and animate at the same value — no animation fires, so we
    // force-restart from "reveal" to unstick the state machine.
    const prevDirection = useRef(direction)
    useEffect(() => {
        if (prevDirection.current !== direction) {
            prevDirection.current = direction
            setPhase("reveal")
        }
    }, [direction])

    const onBarAnimationComplete = () => {
        if (phase === "cover") {
            // Bar fully covers the word — swap text and start reveal
            setCurrentIndex((prev) => (prev + 1) % safeWords.length)
            setPhase("reveal")
        } else if (phase === "reveal") {
            setPhase("idle")
        }
    }

    const fontStyle: React.CSSProperties = {
        ...font,
        color: textColor,
        margin: 0,
        padding: 0,
    }

    const barScale = phase === "cover" ? 1 : 0
    const barOrigin =
        phase === "cover" ? dirConfig.coverOrigin : dirConfig.revealOrigin

    // power3.inOut equivalent
    const ease: [number, number, number, number] = [0.65, 0, 0.35, 1]

    if (isStaticRenderer) {
        return (
            <div style={{ width: "100%", ...fontStyle }}>
                {textBefore && <span>{textBefore} </span>}
                <span
                    style={{
                        position: "relative",
                        display: "inline-block",
                    }}
                >
                    <span>{safeWords[0]}</span>
                    <span
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: "55%",
                            backgroundColor: markerColor,
                            pointerEvents: "none",
                        }}
                    />
                </span>
                {textAfter && <span> {textAfter}</span>}
            </div>
        )
    }

    if (reducedMotion) {
        return (
            <div style={{ width: "100%", ...fontStyle }}>
                {textBefore && <span>{textBefore} </span>}
                <span>{safeWords[currentIndex]}</span>
                {textAfter && <span> {textAfter}</span>}
            </div>
        )
    }

    return (
        <div style={{ width: "100%", ...fontStyle }}>
            {textBefore && <span>{textBefore} </span>}
            <motion.span
                initial={false}
                animate={measuredWidth !== null ? { width: measuredWidth } : {}}
                transition={{ duration: transitionDuration * 0.7, ease }}
                style={{
                    display: "inline-block",
                    position: "relative",
                    overflow: "hidden",
                    verticalAlign: "bottom",
                    whiteSpace: "nowrap",
                    paddingTop: `${barOverflow}em`,
                    paddingBottom: `${barOverflow}em`,
                    marginTop: `-${barOverflow}em`,
                    marginBottom: `-${barOverflow}em`,
                }}
            >
                <span ref={textRef} style={{ display: "inline-block" }}>
                    {safeWords[currentIndex]}
                </span>
                <motion.span
                    key={direction}
                    initial={{ [dirConfig.prop]: 1 }}
                    animate={{ [dirConfig.prop]: barScale }}
                    transition={{ duration: transitionDuration, ease }}
                    onAnimationComplete={onBarAnimationComplete}
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: markerColor,
                        transformOrigin: barOrigin,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            </motion.span>
            {textAfter && <span> {textAfter}</span>}
        </div>
    )
}

HighlightMarkerTextReveal.displayName = "Highlight Marker Text Reveal"

addPropertyControls(HighlightMarkerTextReveal, {
    textBefore: {
        type: ControlType.String,
        title: "Text Before",
        defaultValue: "We help you rethink",
    },
    words: {
        type: ControlType.Array,
        title: "Words",
        defaultValue: ["workflows", "handovers", "marketing"],
        control: {
            type: ControlType.String,
        },
    },
    textAfter: {
        type: ControlType.String,
        title: "Text After",
        defaultValue: "",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 48,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: -1.5,
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    markerColor: {
        type: ControlType.Color,
        title: "Marker Color",
        defaultValue: "#C700EF",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["right", "left", "up", "down"],
        optionTitles: ["Right", "Left", "Up", "Down"],
        defaultValue: "right",
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Hold Duration",
        defaultValue: 2.5,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    barOverflow: {
        type: ControlType.Number,
        title: "Bar Overflow",
        defaultValue: 0.06,
        min: 0,
        max: 0.2,
        step: 0.005,
        unit: "em",
    },
})
