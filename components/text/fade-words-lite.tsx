import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ColorValue = string | { value?: string }

interface Props {
    text: string
    font: React.CSSProperties
    color: ColorValue
    startOpacity: number
    speed: number
    stagger: number
    distance: number
    playOnce: boolean
    style?: React.CSSProperties
}

interface TextPart {
    value: string
    key: string
    wordIndex: number | null
}

const defaultFont = {
    fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    fontWeight: 760,
    fontSize: 56,
    lineHeight: "1.08em",
}

const WORD_SPLIT = /(\s+)/
const WHITESPACE = /^\s+$/

function resolveColor(value: ColorValue | undefined, fallback: string) {
    if (value && typeof value === "object" && typeof value.value === "string") {
        return value.value
    }
    return typeof value === "string" && value.trim() ? value : fallback
}

function splitWords(text: string): TextPart[] {
    let offset = 0
    let wordIndex = 0

    return String(text || "")
        .split(WORD_SPLIT)
        .filter(Boolean)
        .map((value) => {
            const isSpace = WHITESPACE.test(value)
            const part = {
                value,
                key: `${offset}-${value}`,
                wordIndex: isSpace ? null : wordIndex++,
            }
            offset += value.length
            return part
        })
}

function usePrefersReducedMotion(disabled = false) {
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (disabled) return

        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return
        }

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)
        update()

        media.addEventListener?.("change", update)
        return () => media.removeEventListener?.("change", update)
    }, [disabled])

    return disabled || reduced
}

/**
 * Fade Words Lite
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 620
 * @framerIntrinsicHeight 180
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FadeWordsLite({
    text = "Make every word arrive with intention.",
    font = defaultFont,
    color = "#111318",
    startOpacity = 0,
    speed = 620,
    stagger = 42,
    distance = 18,
    playOnce = true,
    style,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const [revealed, setRevealed] = useState(isStaticRenderer)
    const reducedMotion = usePrefersReducedMotion(isStaticRenderer)
    const parts = useMemo(() => splitWords(text), [text])
    const staticPreview = isStaticRenderer || reducedMotion
    const visible = staticPreview || revealed

    useEffect(() => {
        if (staticPreview) {
            setRevealed(true)
            return
        }

        const element = ref.current
        if (!element || typeof IntersectionObserver === "undefined") {
            setRevealed(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setRevealed(true)
                    if (playOnce) observer.unobserve(entry.target)
                    return
                }

                if (!playOnce) setRevealed(false)
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.22 }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [playOnce, staticPreview])

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                overflow: "visible",
                ...style,
            }}
        >
            <p
                aria-label={text}
                style={{
                    margin: 0,
                    color: resolveColor(color, "#111318"),
                    wordBreak: "break-word",
                    ...font,
                }}
            >
                <span aria-hidden="true">
                    {parts.map((part) =>
                        part.wordIndex === null ? (
                            <React.Fragment key={part.key}>
                                {part.value}
                            </React.Fragment>
                        ) : (
                            <span
                                key={part.key}
                                style={{
                                    display: "inline-block",
                                    willChange: staticPreview
                                        ? "auto"
                                        : "opacity, transform",
                                    opacity: visible ? 1 : startOpacity,
                                    transform: visible
                                        ? "translate3d(0, 0, 0)"
                                        : `translate3d(0, ${distance}px, 0)`,
                                    transition: staticPreview
                                        ? "none"
                                        : `opacity ${speed}ms cubic-bezier(.22,1,.36,1), transform ${speed}ms cubic-bezier(.22,1,.36,1)`,
                                    transitionDelay:
                                        visible && !staticPreview
                                            ? `${part.wordIndex * stagger}ms`
                                            : "0ms",
                                }}
                            >
                                {part.value}
                            </span>
                        )
                    )}
                </span>
            </p>
        </div>
    )
}

FadeWordsLite.displayName = "Fade Words Lite"

addPropertyControls(FadeWordsLite, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Make every word arrive with intention.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: defaultFont,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111318",
    },
    startOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 120,
        max: 1600,
        step: 10,
        unit: "ms",
        defaultValue: 620,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 160,
        step: 1,
        unit: "ms",
        defaultValue: 42,
    },
    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 18,
    },
    playOnce: {
        type: ControlType.Boolean,
        title: "Play Once",
        enabledTitle: "Once",
        disabledTitle: "Repeat",
        defaultValue: true,
    },
})
