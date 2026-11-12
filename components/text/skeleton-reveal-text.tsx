import { startTransition, useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * User request:
 * 1) Remove separate font size/weight controls and rely on ControlType.Font values.
 * 2) Disable animations/effects in static renderer contexts and show a static final preview.
 *
 * SkeletonRevealText
 * ------------------------------------------------------------------
 * Recreates the "Osmo" skeleton-loader text-reveal effect as a Framer
 * code component. Every option below is wired to addPropertyControls
 * at the bottom of this file, so once you paste this into a Framer
 * Code File, dragging the component onto the canvas gives you the
 * full control panel on the right — no separate UI needed.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
interface MyComponentProps {
    lines?: string[]
    trigger?: "mount" | "inView"
    once?: boolean
    skeletonColor?: string
    textColor?: string
    duration?: number
    stagger?: number
    delay?: number
    radius?: number
    gap?: number
    paddingY?: number
    paddingX?: number
    font?: {
        fontFamily?: string
        fontSize?: string | number
        fontWeight?: number | string
        fontStyle?: string
        lineHeight?: string | number
        letterSpacing?: string | number
        textAlign?: "left" | "center" | "right"
    }
    style?: CSSProperties
}

export default function SkeletonRevealText(props: MyComponentProps) {
    const {
        lines = [
            "THIS HEADING WILL REVEAL",
            "WITH AN EFFECT CALLED A",
            "'SKELETON LOADER'.",
        ],
        trigger = "mount",
        once = true,
        skeletonColor = "#2A2D38",
        textColor = "#D7F3F6",
        duration = 650,
        stagger = 150,
        delay = 400,
        radius = 8,
        gap = 10,
        paddingY = 0.3,
        paddingX = 0.6,
        font,
        style,
    } = props

    const safeLines = Array.isArray(lines)
        ? lines.filter((l) => typeof l === "string" && l.length > 0)
        : []

    const [revealed, setRevealed] = useState(() => safeLines.map(() => false))
    const containerRef = useRef<HTMLDivElement | null>(null)
    const isStaticRenderer = useIsStaticRenderer()

    useEffect(() => {
        if (isStaticRenderer) {
            startTransition(() => {
                setRevealed(safeLines.map(() => true))
            })
            return
        }

        startTransition(() => {
            setRevealed(safeLines.map(() => false))
        })
        const timers = []

        function runReveal() {
            safeLines.forEach((_, i) => {
                const t = setTimeout(() => {
                    startTransition(() => {
                        setRevealed((prev) => {
                            if (prev[i]) return prev
                            const next = [...prev]
                            next[i] = true
                            return next
                        })
                    })
                }, i * stagger)
                timers.push(t)
            })
        }

        if (trigger === "mount") {
            const t = setTimeout(runReveal, delay)
            timers.push(t)
            return () => timers.forEach(clearTimeout)
        }

        const node = containerRef.current
        if (!node || typeof IntersectionObserver === "undefined") {
            runReveal()
            return () => timers.forEach(clearTimeout)
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    const t = setTimeout(runReveal, delay)
                    timers.push(t)
                    if (once) observer.disconnect()
                } else if (!once) {
                    startTransition(() => {
                        setRevealed(safeLines.map(() => false))
                    })
                }
            },
            { threshold: 0.35 }
        )
        observer.observe(node)
        return () => {
            observer.disconnect()
            timers.forEach(clearTimeout)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeLines.join("|"), trigger, once, delay, stagger, isStaticRenderer])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap,
                width: "100%",
                boxSizing: "border-box",
                fontFamily: font?.fontFamily ?? "inherit",
                ...style,
            }}
        >
            {!isStaticRenderer && (
                <style>{`
                    @keyframes skeleton-reveal-pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.55; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .skeleton-reveal-line { animation: none !important; }
                    }
                `}</style>
            )}

            {safeLines.map((line, i) => {
                const isRevealed = isStaticRenderer ? true : revealed[i]
                return (
                    <span
                        key={i}
                        className="skeleton-reveal-line"
                        style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            borderRadius: radius,
                            padding: `${paddingY}em ${paddingX}em`,
                            fontFamily: "inherit",
                            fontSize: font?.fontSize ?? 28,
                            fontWeight: font?.fontWeight ?? 600,
                            fontStyle: font?.fontStyle,
                            lineHeight: font?.lineHeight ?? 1.25,
                            letterSpacing: font?.letterSpacing,
                            textAlign: font?.textAlign,
                            backgroundColor: isRevealed
                                ? "transparent"
                                : skeletonColor,
                            color: isRevealed ? textColor : skeletonColor,
                            transitionProperty: "background-color, color",
                            transitionDuration: isStaticRenderer
                                ? "0ms"
                                : `${duration}ms`,
                            transitionTimingFunction:
                                "cubic-bezier(0.65, 0, 0.35, 1)",
                            animation:
                                !isStaticRenderer && !isRevealed
                                    ? "skeleton-reveal-pulse 1.6s ease-in-out infinite"
                                    : "none",
                        }}
                    >
                        {line}
                    </span>
                )
            })}
        </div>
    )
}

addPropertyControls(SkeletonRevealText, {
    lines: {
        type: ControlType.Array,
        title: "Lines",
        control: {
            type: ControlType.String,
            defaultValue: "New line",
        },
        defaultValue: [
            "THIS HEADING WILL REVEAL",
            "WITH AN EFFECT CALLED A",
            "'SKELETON LOADER'.",
        ],
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["mount", "inView"],
        optionTitles: ["On page load", "On scroll into view"],
        defaultValue: "mount",
    },
    once: {
        type: ControlType.Boolean,
        title: "Reveal",
        enabledTitle: "Once",
        disabledTitle: "Every time",
        defaultValue: true,
    },
    skeletonColor: {
        type: ControlType.Color,
        title: "Skeleton Color",
        defaultValue: "#2A2D38",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#D7F3F6",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 100,
        max: 2000,
        step: 10,
        unit: "ms",
        displayStepper: true,
        defaultValue: 650,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 500,
        step: 10,
        unit: "ms",
        displayStepper: true,
        defaultValue: 150,
    },
    delay: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 2000,
        step: 10,
        unit: "ms",
        displayStepper: true,
        defaultValue: 400,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 10,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Pad Y",
        min: 0,
        max: 1.5,
        step: 0.05,
        unit: "em",
        defaultValue: 0.3,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Pad X",
        min: 0,
        max: 2,
        step: 0.05,
        unit: "em",
        defaultValue: 0.6,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontSize: "28px",
            variant: "Semibold",
            lineHeight: "1.25em",
        },
        defaultFontType: "sans-serif",
    },
})
