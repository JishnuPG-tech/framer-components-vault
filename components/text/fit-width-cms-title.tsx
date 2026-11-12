// User request: Create a new self-contained Framer code component named “CMS Auto-Fit Title” for an artist-detail hero. It must accept a CMS-bindable string property named title and render it as one line of text that automatically scales its font size to exactly fit the available container width while reacting to title changes and container resizing. Preserve the existing visual contract: Inter, normal 400 weight, black text, left alignment, line-height 1.2, no wrap. Expose controls for title, fontFamily, fontWeight, color, lineHeight, minFontSize, and maxFontSize so the canvas remains editable. The component should occupy the full available width and have content-driven height. Use browser measurement only as needed, include a sensible safe fallback during editor rendering, and avoid external dependencies.
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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


interface MyComponentProps {
    title: string
    font:
        | {
              fontFamily?: string
              fontStyle?: "normal" | "italic"
              letterSpacing?: string | number | any[]
              lineHeight?: string | number | any[]
              textTransform?: CSSProperties["textTransform"]
              fontSelector?: string
          }
        | string
    fontWeight: number
    color: string
    lineHeight: number
    style?: CSSProperties
}

type ParsedFontControl = {
    fontFamily: string
    fontStyle: "normal" | "italic"
    letterSpacing: string
    lineHeight?: string
    textTransform: CSSProperties["textTransform"]
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CMSAutoFitTitle(props: MyComponentProps) {
    const {
        title = "Artist Name",
        font,
        fontWeight = 400,
        color = "#000000",
        lineHeight = 1.2,
        style,
    } = props
    const parsedFont = useMemo<ParsedFontControl>(() => {
        const fallback: ParsedFontControl = {
            fontFamily: "Inter, sans-serif",
            fontStyle: "normal",
            letterSpacing: "0em",
            lineHeight: undefined,
            textTransform: "none",
        }

        const toCssValue = (
            value: unknown,
            defaultUnit: string
        ): string | undefined => {
            if (typeof value === "string") return value
            if (typeof value === "number" && Number.isFinite(value)) {
                return `${value}${defaultUnit}`
            }
            if (Array.isArray(value)) {
                const [rawValue, rawUnit] = value
                if (
                    typeof rawValue === "number" &&
                    Number.isFinite(rawValue) &&
                    typeof rawUnit === "string" &&
                    rawUnit.length > 0
                ) {
                    return `${rawValue}${rawUnit}`
                }
                if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
                    return `${rawValue}${defaultUnit}`
                }
            }
            if (value && typeof value === "object") {
                const maybeValue = (value as { value?: unknown }).value
                const maybeUnit = (value as { unit?: unknown }).unit
                if (
                    typeof maybeValue === "number" &&
                    Number.isFinite(maybeValue) &&
                    typeof maybeUnit === "string" &&
                    maybeUnit.length > 0
                ) {
                    return `${maybeValue}${maybeUnit}`
                }
            }
            return undefined
        }

        let source: any = font
        if (typeof source === "string") {
            try {
                source = JSON.parse(source)
            } catch {
                source = null
            }
        }

        if (!source || typeof source !== "object") return fallback

        const selector =
            typeof source.fontSelector === "string" ? source.fontSelector : ""
        const selectorParts = selector.split(";")
        const familyFromSelector =
            selectorParts[selectorParts.length - 1]?.trim() || selector.trim()
        const resolvedFamily =
            familyFromSelector ||
            (typeof source.fontFamily === "string" ? source.fontFamily : "") ||
            fallback.fontFamily

        const resolvedStyle: "normal" | "italic" =
            source.fontStyle === "italic" ? "italic" : "normal"
        const resolvedLetterSpacing =
            toCssValue(source.letterSpacing, "px") ?? fallback.letterSpacing
        const resolvedLineHeight = toCssValue(source.lineHeight, "")
        const resolvedTransform =
            typeof source.textTransform === "string"
                ? (source.textTransform as CSSProperties["textTransform"])
                : fallback.textTransform

        return {
            fontFamily: resolvedFamily || fallback.fontFamily,
            fontStyle: resolvedStyle,
            letterSpacing: resolvedLetterSpacing,
            lineHeight: resolvedLineHeight,
            textTransform: resolvedTransform,
        }
    }, [font])

    const resolvedFontFamily = parsedFont.fontFamily || "Inter, sans-serif"
    const resolvedFontStyle = parsedFont.fontStyle || "normal"
    const resolvedLetterSpacing = parsedFont.letterSpacing || "0em"
    const resolvedTextTransform = parsedFont.textTransform || "none"
    const resolvedLineHeight = useMemo(() => {
        if (typeof lineHeight === "number" && Number.isFinite(lineHeight)) {
            return String(lineHeight)
        }
        return parsedFont.lineHeight || "1.2"
    }, [lineHeight, parsedFont.lineHeight])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const textRef = useRef<HTMLSpanElement | null>(null)
    const measureRef = useRef<HTMLSpanElement | null>(null)
    const [computedFontSize, setComputedFontSize] = useState<number | null>(null)

    const staticResponsiveFontSize = useMemo(() => {
        const titleLength = Math.max((title || "").trim().length, 1)
        const averageGlyphWidth = 1.3
        const divisor = Math.max(titleLength * averageGlyphWidth, 1)
        return `calc((100vw - 64px) / ${divisor})`
    }, [title])

    const baseTextStyle = useMemo(
        () => ({
            fontFamily: resolvedFontFamily,
            fontStyle: resolvedFontStyle,
            fontWeight,
            letterSpacing: resolvedLetterSpacing,
            textTransform: resolvedTextTransform,
            color,
            lineHeight: resolvedLineHeight,
            textAlign: "left" as const,
            whiteSpace: "nowrap" as const,
        }),
        [
            resolvedFontFamily,
            resolvedFontStyle,
            fontWeight,
            resolvedLetterSpacing,
            resolvedTextTransform,
            color,
            resolvedLineHeight,
        ]
    )

    const fitText = useCallback(() => {
        if (typeof window === "undefined") return
        const container = containerRef.current
        const visibleText = textRef.current
        const measurer = measureRef.current
        if (!container || !visibleText || !measurer) return

        const containerWidth = visibleText.clientWidth || container.clientWidth
        if (containerWidth <= 0) {
            startTransition(() => setComputedFontSize(null))
            return
        }

        const trimmedTitle = (title || "").trim()
        if (trimmedTitle.length === 0) {
            startTransition(() => setComputedFontSize(1))
            return
        }

        const baseSize = 100
        measurer.textContent = trimmedTitle
        measurer.style.fontFamily = resolvedFontFamily
        measurer.style.fontStyle = resolvedFontStyle
        measurer.style.fontWeight = String(fontWeight)
        measurer.style.fontSize = `${baseSize}px`
        measurer.style.letterSpacing =
            typeof resolvedLetterSpacing === "number"
                ? `${resolvedLetterSpacing}px`
                : resolvedLetterSpacing
        measurer.style.textTransform = resolvedTextTransform
        measurer.style.lineHeight = resolvedLineHeight
        const measuredTextWidth = measurer.getBoundingClientRect().width
        if (measuredTextWidth <= 0) {
            startTransition(() => setComputedFontSize(null))
            return
        }

        const nextSize = (baseSize * containerWidth) / measuredTextWidth
        startTransition(() => setComputedFontSize(nextSize))
    }, [
        fontWeight,
        resolvedFontFamily,
        resolvedFontStyle,
        resolvedLetterSpacing,
        resolvedLineHeight,
        resolvedTextTransform,
        title,
    ])

    useLayoutEffect(() => {
        if (typeof window === "undefined") return
        fitText()
    }, [fitText])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (typeof ResizeObserver === "undefined") return
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(() => {
            fitText()
        })
        observer.observe(container)

        return () => observer.disconnect()
    }, [fitText])

    useEffect(() => {
        if (typeof document === "undefined") return
        const fontsApi = document.fonts
        if (!fontsApi || typeof fontsApi.ready === "undefined") return

        let isActive = true
        fontsApi.ready
            .then(() => {
                if (!isActive) return
                fitText()
            })
            .catch(() => {})

        return () => {
            isActive = false
        }
    }, [fitText])

    useEffect(() => {
        if (typeof document === "undefined") return
        const fontsApi = document.fonts
        if (!fontsApi || typeof fontsApi.addEventListener !== "function") return
        const handleFontEvent = () => {
            fitText()
        }
        fontsApi.addEventListener("loadingdone", handleFontEvent)
        return () => {
            fontsApi.removeEventListener("loadingdone", handleFontEvent)
        }
    }, [fitText])

    const displayFontSize = computedFontSize

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "auto",
                display: "block",
                margin: 0,
                padding: 0,
                boxSizing: "border-box",
                overflow: "visible",
            }}
        >
            <span
                ref={textRef}
                style={{
                    ...baseTextStyle,
                    display: "block",
                    width: "100%",
                    margin: 0,
                    padding: 0,
                    boxSizing: "border-box",
                    overflow: "visible",
                    fontSize:
                        computedFontSize === null
                            ? staticResponsiveFontSize
                            : `${displayFontSize}px`,
                }}
            >
                {title}
            </span>
            <span
                ref={measureRef}
                aria-hidden="true"
                style={{
                    ...baseTextStyle,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    visibility: "hidden",
                    pointerEvents: "none",
                    margin: 0,
                    padding: 0,
                    boxSizing: "border-box",
                    display: "inline-block",
                    width: "fit-content",
                    maxWidth: "none",
                    overflow: "visible",
                }}
            />
        </div>
    )
}

addPropertyControls(CMSAutoFitTitle, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Artist Name",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Regular",
            fontSize: "16px",
            lineHeight: "1.2em",
            letterSpacing: "0em",
        },
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 400,
        min: 100,
        max: 900,
        step: 100,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.2,
        min: 0.8,
        max: 2,
        step: 0.01,
    },
})