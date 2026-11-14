// Infinite Text Passage — Karim Saif (https://x.com/karimsaif0)
"use client"

import React, { useEffect, useRef, useMemo } from "react"
import { useAnimate, type Transition } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const TAGS = ["h1", "h2", "h3", "p", "div"] as const

interface ZoomTextTunnelProps {
    // Content & Loop
    texts?: string[]
    startIndex?: number
    loop?: boolean
    loopCount?: "infinite" | "1" | "2" | "3" | "custom"
    customLoopCount?: number

    // Typography
    font?: React.CSSProperties
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
    textDecoration?: "none" | "underline" | "line-through"
    fontStyle?: "normal" | "italic"
    wordSpacing?: number
    whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap"

    // Color & Styles
    color?: string
    opacity?: number
    enableGradient?: boolean
    gradientStartColor?: string
    gradientEndColor?: string
    gradientAngle?: number
    enableShadow?: boolean
    shadowColor?: string
    shadowX?: number
    shadowY?: number
    shadowBlur?: number
    enableStroke?: boolean
    strokeColor?: string
    strokeWidth?: number

    // Animation & Timing
    startScale?: number
    maxScale?: number
    hold?: number
    duration?: number
    delayBeforeStart?: number
    ease?: string
    initialOpacity?: number
    finalOpacity?: number

    // Layout & Alignment
    fitMode?: "hug" | "fill" | "fixed"
    horizontalAlign?: "flex-start" | "center" | "flex-end"
    verticalAlign?: "flex-start" | "center" | "flex-end"
    overflow?: "hidden" | "visible"
    minWidth?: number | string
    minHeight?: number | string

    // Spacing & Background
    enableBackground?: boolean
    backgroundColor?: string
    borderRadius?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number

    // SEO & Accessibility
    tag?: (typeof TAGS)[number]
    ariaLabel?: string
    screenReaderText?: string
    direction?: "ltr" | "rtl" | "auto"

    // Visual Effects
    mixBlendMode?: React.CSSProperties["mixBlendMode"]

    style?: React.CSSProperties
}

export default function ZoomTextTunnel(props: ZoomTextTunnelProps) {
    const {
        texts = ["Framer", "Karim", "Website", "Design", "Action"],
        startIndex = 0,
        loop = true,
        loopCount = "infinite",
        customLoopCount = 1,

        font = {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 120,
            lineHeight: "1em",
            letterSpacing: "-0.02em",
            textAlign: "center",
        },
        textTransform = "none",
        textDecoration = "none",
        fontStyle = "normal",
        wordSpacing = 0,
        whiteSpace = "pre",

        color = "#FFFFFF",
        opacity = 1,
        enableGradient = false,
        gradientStartColor = "#FF5500",
        gradientEndColor = "#FF00AA",
        gradientAngle = 45,
        enableShadow = false,
        shadowColor = "rgba(0,0,0,0.5)",
        shadowX = 0,
        shadowY = 10,
        shadowBlur = 20,
        enableStroke = false,
        strokeColor = "#000000",
        strokeWidth = 1,

        startScale = 0.05,
        maxScale = 35,
        hold = 600,
        duration = 1.2,
        delayBeforeStart = 0,
        ease = "0.7, 0, 0.25, 1",
        initialOpacity = 1,
        finalOpacity = 0,

        fitMode = "fill",
        horizontalAlign = "center",
        verticalAlign = "center",
        overflow = "hidden",
        minWidth = "100%",
        minHeight = "100%",

        enableBackground = false,
        backgroundColor = "transparent",
        borderRadius = 0,
        paddingTop = 0,
        paddingRight = 0,
        paddingBottom = 0,
        paddingLeft = 0,
        marginTop = 0,
        marginRight = 0,
        marginBottom = 0,
        marginLeft = 0,

        tag = "h2",
        ariaLabel = "Typer text visualization",
        screenReaderText = "",
        direction = "ltr",

        mixBlendMode = "normal",

        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [scope, animate] = useAnimate()
    const slot0Ref = useRef<HTMLSpanElement>(null)
    const slot1Ref = useRef<HTMLSpanElement>(null)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const controlsRef = useRef<
        Array<{ stop?: () => void; finished?: Promise<void> }>
    >([])

    const parsedEase = useMemo(() => {
        try {
            const parts = ease.split(",").map((v) => parseFloat(v.trim()))
            return parts.length === 4 && parts.every((n) => !isNaN(n))
                ? (parts as [number, number, number, number])
                : [0.7, 0, 0.25, 1]
        } catch {
            return [0.7, 0, 0.25, 1]
        }
    }, [ease])

    const transition: Transition = useMemo(
        () => ({
            type: "tween",
            duration,
            ease: parsedEase,
        }),
        [duration, parsedEase]
    )

    const safeTexts = useMemo(() => {
        const cleaned = Array.isArray(texts)
            ? texts.filter((t) => typeof t === "string" && t.length > 0)
            : []
        return cleaned.length > 0
            ? cleaned
            : ["Framer", "Karim", "Website", "Design", "Action"]
    }, [texts])

    const clampedMaxScale = useMemo(() => {
        const n = Number(maxScale)
        return Number.isFinite(n) ? Math.max(1, n) : 35
    }, [maxScale])

    const clampedStartScale = useMemo(() => {
        const n = Number(startScale)
        return Number.isFinite(n) ? Math.max(0.001, n) : 0.05
    }, [startScale])

    const holdMs = useMemo(() => {
        const n = Number(hold)
        return Number.isFinite(n) ? Math.max(0, n) : 600
    }, [hold])

    const maxIterations = useMemo(() => {
        if (!loop) return 1
        if (loopCount === "infinite") return Infinity
        if (loopCount === "custom") return Math.max(1, customLoopCount)
        return parseInt(loopCount, 10) || 1
    }, [loop, loopCount, customLoopCount])

    const longest = useMemo(
        () =>
            safeTexts.reduce(
                (a, b) => (b.length > a.length ? b : a),
                safeTexts[0]
            ),
        [safeTexts]
    )

    useEffect(() => {
        const slots = [slot0Ref.current, slot1Ref.current]
        const sel = [".slot-0", ".slot-1"]

        const startingIndex = Math.min(
            Math.max(0, startIndex),
            safeTexts.length - 1
        )

        // Directly assign DOM styles without calling animate() during static rendering
        if (isStatic || safeTexts.length <= 1) {
            if (slots[0]) {
                slots[0].textContent = safeTexts[startingIndex]
                slots[0].style.transform = "scale(1)"
                slots[0].style.opacity = `${initialOpacity}`
            }
            if (slots[1]) {
                slots[1].style.transform = `scale(${clampedStartScale})`
                slots[1].style.opacity = "0"
            }
            return
        }

        let cancelled = false
        let active = 0
        let idx = startingIndex
        let totalPasses = 0

        if (slots[0]) slots[0].textContent = safeTexts[startingIndex]
        animate(sel[0], { scale: 1, opacity: initialOpacity }, { duration: 0 })
        animate(
            sel[1],
            { scale: clampedStartScale, opacity: 0 },
            { duration: 0 }
        )

        const wait = (ms: number) =>
            new Promise<void>((res) => {
                timeoutRef.current = setTimeout(res, ms)
            })

        const settle = (c: ReturnType<typeof animate> | undefined) =>
            c && c.finished ? c.finished : Promise.resolve()

        const run = async () => {
            if (delayBeforeStart > 0) {
                await wait(delayBeforeStart * 1000)
                if (cancelled) return
            }

            while (
                !cancelled &&
                totalPasses < maxIterations * safeTexts.length
            ) {
                await wait(holdMs)
                if (cancelled) return

                const inc = 1 - active
                const nextIdx = (idx + 1) % safeTexts.length
                if (slots[inc]) slots[inc].textContent = safeTexts[nextIdx]

                await settle(
                    animate(
                        sel[inc],
                        { scale: clampedStartScale, opacity: 0 },
                        { duration: 0 }
                    )
                )
                if (cancelled) return

                const enter = animate(
                    sel[inc],
                    { scale: 1, opacity: initialOpacity },
                    transition
                )
                const exit = animate(
                    sel[active],
                    { scale: clampedMaxScale, opacity: finalOpacity },
                    transition
                )
                controlsRef.current = [enter, exit]

                await settle(exit)
                if (cancelled) return

                await settle(
                    animate(
                        sel[active],
                        { scale: clampedStartScale, opacity: 0 },
                        { duration: 0 }
                    )
                )
                active = inc
                idx = nextIdx
                totalPasses++
            }
        }
        run()

        return () => {
            cancelled = true
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            controlsRef.current.forEach((c) => c && c.stop && c.stop())
        }
    }, [
        safeTexts,
        startIndex,
        transition,
        clampedMaxScale,
        clampedStartScale,
        holdMs,
        delayBeforeStart,
        maxIterations,
        initialOpacity,
        finalOpacity,
        animate,
        isStatic,
    ])

    const safeTag = (TAGS as readonly string[]).includes(tag) ? tag : "h2"
    const Tag = safeTag as keyof JSX.IntrinsicElements

    const textStyles: React.CSSProperties = {
        ...font,
        textTransform,
        textDecoration,
        fontStyle,
        wordSpacing,
        whiteSpace,
        color: enableGradient ? "transparent" : color,
        backgroundImage: enableGradient
            ? `linear-gradient(${gradientAngle}deg, ${gradientStartColor}, ${gradientEndColor})`
            : undefined,
        WebkitBackgroundClip: enableGradient ? "text" : undefined,
        textShadow: enableShadow
            ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`
            : undefined,
        WebkitTextStroke: enableStroke
            ? `${strokeWidth}px ${strokeColor}`
            : undefined,
    }

    const slotStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: horizontalAlign,
        alignItems: verticalAlign,
        transformOrigin: "center center",
        willChange: "transform, opacity",
        mixBlendMode,
        ...textStyles,
    }

    const srOnly: React.CSSProperties = {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
        border: 0,
    }

    return (
        <div
            ref={scope}
            aria-label={ariaLabel || safeTexts.join(", ")}
            dir={direction}
            style={{
                position: "relative",
                display: "flex",
                justifyContent: horizontalAlign,
                alignItems: verticalAlign,
                overflow,
                minWidth: fitMode === "fixed" ? minWidth : 1,
                minHeight: fitMode === "fixed" ? minHeight : 1,
                width: fitMode === "fill" ? "100%" : "auto",
                height: fitMode === "fill" ? "100%" : "auto",
                opacity,
                backgroundColor: enableBackground
                    ? backgroundColor
                    : "transparent",
                borderRadius,
                paddingTop,
                paddingRight,
                paddingBottom,
                paddingLeft,
                marginTop,
                marginRight,
                marginBottom,
                marginLeft,
                ...style,
            }}
        >
            <Tag style={srOnly}>{screenReaderText || safeTexts.join(", ")}</Tag>

            <span
                aria-hidden="true"
                style={{
                    visibility: "hidden",
                    whiteSpace,
                    ...textStyles,
                }}
            >
                {longest}
            </span>

            <span
                ref={slot0Ref}
                className="slot-0"
                aria-hidden="true"
                style={slotStyle}
            />
            <span
                ref={slot1Ref}
                className="slot-1"
                aria-hidden="true"
                style={slotStyle}
            />
        </div>
    )
}

// Framer Canvas Property Controls
addPropertyControls(ZoomTextTunnel, {
    // --- Content ---
    texts: {
        type: ControlType.Array,
        title: "Passage Words",
        description:
            "List of words or phrases to cycle through in the zoom tunnel.",
        control: { type: ControlType.String },
        defaultValue: ["Framer", "Karim", "Website", "Design", "Action"],
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Index",
        description: "Choose which word index starts first.",
        min: 0,
        step: 1,
        defaultValue: 0,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    loopCount: {
        type: ControlType.Enum,
        title: "Loop Count",
        options: ["infinite", "1", "2", "3", "custom"],
        optionTitles: ["Infinite", "1", "2", "3", "Custom"],
        defaultValue: "infinite",
        hidden(props) {
            return !props.loop
        },
    },
    customLoopCount: {
        type: ControlType.Number,
        title: "Custom Loops",
        min: 1,
        step: 1,
        defaultValue: 1,
        hidden(props) {
            return !props.loop || props.loopCount !== "custom"
        },
    },

    // --- Typography ---
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontSize: 120,
            fontFamily: "Inter",
            fontWeight: 700,
            lineHeight: "1em",
            letterSpacing: "-0.02em",
            textAlign: "center",
        },
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "none",
    },
    textDecoration: {
        type: ControlType.Enum,
        title: "Decoration",
        options: ["none", "underline", "line-through"],
        optionTitles: ["None", "Underline", "Line Through"],
        defaultValue: "none",
    },
    fontStyle: {
        type: ControlType.Enum,
        title: "Font Style",
        options: ["normal", "italic"],
        optionTitles: ["Normal", "Italic"],
        defaultValue: "normal",
    },
    wordSpacing: {
        type: ControlType.Number,
        title: "Word Spacing",
        min: -20,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    whiteSpace: {
        type: ControlType.Enum,
        title: "White Space",
        options: ["normal", "nowrap", "pre", "pre-wrap"],
        optionTitles: ["Normal", "No Wrap", "Pre", "Pre Wrap"],
        defaultValue: "pre",
    },

    // --- Color & Styles ---
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    enableGradient: {
        type: ControlType.Boolean,
        title: "Gradient Text",
        defaultValue: false,
    },
    gradientStartColor: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#FF5500",
        hidden(props) {
            return !props.enableGradient
        },
    },
    gradientEndColor: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#FF00AA",
        hidden(props) {
            return !props.enableGradient
        },
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        unit: "°",
        defaultValue: 45,
        hidden(props) {
            return !props.enableGradient
        },
    },
    enableShadow: {
        type: ControlType.Boolean,
        title: "Text Shadow",
        defaultValue: false,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden(props) {
            return !props.enableShadow
        },
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        hidden(props) {
            return !props.enableShadow
        },
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 10,
        hidden(props) {
            return !props.enableShadow
        },
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 20,
        hidden(props) {
            return !props.enableShadow
        },
    },
    enableStroke: {
        type: ControlType.Boolean,
        title: "Text Stroke",
        defaultValue: false,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden(props) {
            return !props.enableStroke
        },
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 1,
        max: 10,
        unit: "px",
        defaultValue: 1,
        hidden(props) {
            return !props.enableStroke
        },
    },

    // --- Animation & Timing ---
    startScale: {
        type: ControlType.Number,
        title: "Start Scale",
        description: "Initial scale before zooming.",
        min: 0.001,
        max: 5,
        step: 0.01,
        defaultValue: 0.05,
    },
    maxScale: {
        type: ControlType.Number,
        title: "End Scale",
        description: "Target scale before fading out.",
        min: 2,
        max: 100,
        step: 1,
        defaultValue: 35,
    },
    hold: {
        type: ControlType.Number,
        title: "Hold (ms)",
        min: 0,
        max: 5000,
        step: 50,
        unit: "ms",
        defaultValue: 600,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 1.2,
    },
    delayBeforeStart: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        defaultValue: 0,
    },
    ease: {
        type: ControlType.String,
        title: "Easing",
        defaultValue: "0.7, 0, 0.25, 1",
    },
    initialOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 1,
    },
    finalOpacity: {
        type: ControlType.Number,
        title: "Final Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0,
    },

    // --- Layout & Alignment ---
    fitMode: {
        type: ControlType.Enum,
        title: "Fit Mode",
        options: ["hug", "fill", "fixed"],
        optionTitles: ["Hug Content", "Fill Container", "Fixed Width"],
        defaultValue: "fill",
    },
    horizontalAlign: {
        type: ControlType.Enum,
        title: "H-Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "V-Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
        defaultValue: "hidden",
    },

    // --- Spacing & Background ---
    enableBackground: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "rgba(0,0,0,0.2)",
        hidden(props) {
            return !props.enableBackground
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        unit: "px",
        defaultValue: 0,
        hidden(props) {
            return !props.enableBackground
        },
    },
    paddingTop: { type: ControlType.Number, title: "Pad Top", defaultValue: 0 },
    paddingRight: {
        type: ControlType.Number,
        title: "Pad Right",
        defaultValue: 0,
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Pad Bottom",
        defaultValue: 0,
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Pad Left",
        defaultValue: 0,
    },

    marginTop: {
        type: ControlType.Number,
        title: "Margin Top",
        defaultValue: 0,
    },
    marginRight: {
        type: ControlType.Number,
        title: "Margin Right",
        defaultValue: 0,
    },
    marginBottom: {
        type: ControlType.Number,
        title: "Margin Bottom",
        defaultValue: 0,
    },
    marginLeft: {
        type: ControlType.Number,
        title: "Margin Left",
        defaultValue: 0,
    },

    // --- SEO & Accessibility ---
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "Paragraph", "Div"],
        defaultValue: "h2",
    },
    screenReaderText: {
        type: ControlType.String,
        title: "SR Text",
        description: "Custom hidden text strictly for screen readers.",
        defaultValue: "",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["ltr", "rtl", "auto"],
        optionTitles: ["LTR", "RTL", "Auto"],
        defaultValue: "ltr",
    },

    // --- Visual Effects ---
    mixBlendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "multiply", "overlay", "screen", "difference"],
        optionTitles: ["Normal", "Multiply", "Overlay", "Screen", "Difference"],
        defaultValue: "normal",
    },

    // --- Footer ---
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Zoom Text Tunnel",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
