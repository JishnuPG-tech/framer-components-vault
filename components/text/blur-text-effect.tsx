import type { CSSProperties } from "react"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type BlurDirection = "left" | "right" | "both"

interface BlurTextEffectProps {
    text: string
    blurDirection: BlurDirection
    blurIntensity: number
    blurWidth: number
    textColor: string
    font: CSSProperties
    responsive: boolean
    style?: CSSProperties
}

/**
 * Blur Text Effect
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 60
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function BlurTextEffect(props: BlurTextEffectProps) {
    const {
        text,
        blurDirection,
        blurIntensity,
        blurWidth,
        textColor,
        font,
        responsive,
        style,
    } = props

    const resolvedTextAlign = (font as any)?.textAlign ?? "left"
    const isFillWidth = style?.width === "100%"

    // This state is what the component actually renders character-by-character.
    // It will be updated either from the prop `text` or from browser translation output.
    const [displayText, setDisplayText] = useState<string>(text)

    const rootRef = useRef<HTMLSpanElement | null>(null)

    const [containerWidth, setContainerWidth] = useState<number | null>(null)
    const [naturalWidth, setNaturalWidth] = useState<number | null>(null)
    const [baseWidth, setBaseWidth] = useState<number | null>(null)

    // Hidden DOM node that is allowed to be translated by the browser.
    // We observe it and mirror its translated content to our rendered output.
    const translateSourceRef = useRef<HTMLSpanElement | null>(null)

    // Separate hidden measurement node (not translated) used to compute responsive scaling.
    const measureRef = useRef<HTMLSpanElement | null>(null)

    // Keep hidden node in sync when the author changes `text`.
    useEffect(() => {
        startTransition(() => setDisplayText(text))
    }, [text])

    useEffect(() => {
        if (typeof window === "undefined") return
        const node = translateSourceRef.current
        if (!node) return

        // Ensure the hidden source always starts with the latest displayed text.
        // This helps when translations are toggled on/off.
        if ((node.textContent ?? "") !== displayText) {
            node.textContent = displayText
        }

        if (typeof MutationObserver === "undefined") return

        const observer = new MutationObserver(() => {
            const next = node.textContent ?? ""
            if (next && next !== displayText) {
                startTransition(() => setDisplayText(next))
            }
        })

        observer.observe(node, {
            characterData: true,
            childList: true,
            subtree: true,
        })

        return () => observer.disconnect()
    }, [displayText])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!responsive) return
        // Responsive scaling requires a fixed container width.
        // If the layer is set to Fit content, observing its own width will create a feedback loop
        // where scaling increases the width, which increases the scale, etc.
        if (!isFillWidth) return
        const el = rootRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") return

        let raf = 0
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            const width = entry?.contentRect?.width
            if (!width || width <= 0) return
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                startTransition(() => setContainerWidth(width))
            })
        })

        ro.observe(el)

        return () => {
            if (raf) cancelAnimationFrame(raf)
            ro.disconnect()
        }
    }, [responsive, isFillWidth])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!responsive) return
        const el = measureRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") return

        let raf = 0
        const ro = new ResizeObserver(() => {
            if (raf) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const w = el.scrollWidth
                if (!w || w <= 0) return
                startTransition(() => setNaturalWidth(w))
            })
        })

        ro.observe(el)

        // Prime measurement once.
        const w = el.scrollWidth
        if (w && w > 0) startTransition(() => setNaturalWidth(w))

        return () => {
            if (raf) cancelAnimationFrame(raf)
            ro.disconnect()
        }
    }, [responsive, displayText, font])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!responsive) return
        if (!isFillWidth) return
        // When the user changes Font or Text, treat the current size as the new "base".
        // This keeps the user in control of the base font size, then scales afterwards.
        if (containerWidth && containerWidth > 0) {
            startTransition(() => setBaseWidth(containerWidth))
        }
    }, [responsive, displayText, font, isFillWidth])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!responsive) return
        if (!isFillWidth) return
        if (baseWidth !== null) return
        if (containerWidth && containerWidth > 0) {
            startTransition(() => setBaseWidth(containerWidth))
        }
    }, [responsive, containerWidth, baseWidth, isFillWidth])

    useEffect(() => {
        if (!responsive) {
            startTransition(() => setBaseWidth(null))
        }
    }, [responsive])

    const visuallyHiddenTextStyle = useMemo<CSSProperties>(
        () => ({
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
        }),
        []
    )

    const characters = useMemo(() => displayText.split(""), [displayText])

    const blurThreshold = useMemo(() => {
        // blurWidth is in 0..100
        return Math.max(0, Math.min(1, blurWidth / 100))
    }, [blurWidth])

    const getCharacterBlur = useMemo(() => {
        const dir = blurDirection
        const intensity = Math.max(0, blurIntensity)

        return (index: number, total: number) => {
            if (intensity <= 0) return 0
            if (total <= 1) return intensity
            if (blurThreshold <= 0) return 0

            const t = total === 1 ? 0 : index / (total - 1) // 0..1 left->right
            let dist: number

            if (dir === "both") {
                // strongest at edges, weakest at center
                dist = Math.min(t, 1 - t)
            } else if (dir === "right") {
                // strongest on the right edge
                dist = 1 - t
            } else {
                // strongest on the left edge
                dist = t
            }

            // dist is 0 at the "strong" edge(s) and increases away from them.
            if (dist > blurThreshold) return 0

            return intensity * (1 - dist / blurThreshold)
        }
    }, [blurDirection, blurIntensity, blurThreshold])

    const justifyFromAlign = useMemo(() => {
        if (resolvedTextAlign === "center") return "center"
        if (resolvedTextAlign === "right") return "flex-end"
        return "flex-start"
    }, [resolvedTextAlign])

    const rootStyle: CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: justifyFromAlign,
        overflow: "visible",
        whiteSpace: "nowrap",
        color: textColor,
        textAlign: resolvedTextAlign,
        // Only force 100% sizing on axes that are fixed-sized in Framer.
        ...(style?.width === "100%" ? { width: "100%" } : null),
        ...(style?.height === "100%" ? { height: "100%" } : null),
        ...style,
    }

    const responsiveScale = useMemo(() => {
        // Compute a responsive multiplier based on the component width relative to a stored base width.
        // We apply this multiplier to font-related values (not a transform) so layout (Stacks/gaps) stays consistent.
        const canScale =
            responsive &&
            isFillWidth &&
            containerWidth &&
            naturalWidth &&
            naturalWidth > 0 &&
            baseWidth &&
            baseWidth > 0
        if (!canScale) return 1

        const designScale = containerWidth! / baseWidth!
        const fitScale = containerWidth! / naturalWidth!

        // Always ensure the content fits, but otherwise scale with the parent size.
        const next = Math.min(designScale, fitScale)
        return Math.max(0.01, next)
    }, [baseWidth, containerWidth, naturalWidth, responsive, isFillWidth])

    const scaleFontValue = useCallback((value: any, scale: number) => {
        if (value == null) return value
        if (typeof value === "number") return value * scale
        if (typeof value !== "string") return value
        const trimmed = value.trim()
        const match = trimmed.match(/^(-?\d*\.?\d+)(px)?$/i)
        if (!match) return value
        const n = parseFloat(match[1])
        if (!isFinite(n)) return value
        const unit = match[2] ?? ""
        return `${n * scale}${unit}`
    }, [])

    const scaledFont = useMemo<CSSProperties>(() => {
        if (!responsive) return font
        return {
            ...font,
            fontSize: scaleFontValue((font as any)?.fontSize, responsiveScale),
            letterSpacing: scaleFontValue(
                (font as any)?.letterSpacing,
                responsiveScale
            ),
            lineHeight: scaleFontValue(
                (font as any)?.lineHeight,
                responsiveScale
            ),
        }
    }, [font, responsive, responsiveScale, scaleFontValue])

    const scaledWrapStyle: CSSProperties = useMemo(() => {
        return {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: justifyFromAlign,
            ...scaledFont,
        }
    }, [justifyFromAlign, scaledFont])

    return (
        <span ref={rootRef} style={rootStyle} aria-label={displayText}>
            {/*
              Translate source: NOT aria-hidden and NOT translate="no".
              Browser translation can modify this node; we mirror that into the rendered text.
            */}
            <span ref={translateSourceRef} style={visuallyHiddenTextStyle}>
                {displayText}
            </span>

            {/*
              Rendered output: translate="no" prevents browsers from trying to translate
              split-up characters individually.
            */}
            <span aria-hidden="true" translate="no" style={scaledWrapStyle}>
                {characters.map((char, index) => {
                    const blur = getCharacterBlur(index, characters.length)
                    const effectiveBlur = responsive
                        ? blur * responsiveScale
                        : blur
                    return (
                        <span
                            key={`${index}-${char}`}
                            style={{
                                display: "inline-block",
                                filter:
                                    effectiveBlur > 0
                                        ? `blur(${effectiveBlur}px)`
                                        : "none",
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    )
                })}
            </span>

            {/* Measurement node: hidden, not translated, uses the same font and text */}
            {responsive && (
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    translate="no"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        visibility: "hidden",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        ...font,
                    }}
                >
                    {displayText === "" ? "\u00A0" : displayText}
                </span>
            )}
        </span>
    )
}

addPropertyControls(BlurTextEffect, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Blur Text Effect",
        displayTextArea: true,
    },
    blurDirection: {
        type: ControlType.Enum,
        title: "Blur Direction",
        options: ["left", "right", "both"],
        optionTitles: ["Left", "Right", "Both"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    blurWidth: {
        type: ControlType.Number,
        title: "Blur Width",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Width must be set to fill",
    },
})

BlurTextEffect.displayName = "Blur Text Effect"
