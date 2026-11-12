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


/**
 * BlurHoverText
 *
 * A text component for Framer where the part of the text near your
 * cursor gets blurred on hover. Drop it on the canvas, type your text
 * in the "Text" field, and customize the font, size, weight, color,
 * and how the blur behaves in the property panel.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function BlurHoverText(props) {
    const { text, font, color, align, blurRadius, influence, maxBlur, style } =
        props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const letterRefs = React.useRef<Array<HTMLSpanElement | null>>([])
    // Letter centers, relative to the container's left edge. Measured once
    // after layout (and on resize), never during pointer movement.
    const centersRef = React.useRef<number[]>([])
    const blursRef = React.useRef<number[]>([])
    const rafRef = React.useRef<number | null>(null)
    const pointerXRef = React.useRef<number | null>(null)

    const words = React.useMemo(() => {
        let start = 0
        return text.split(" ").map((word: string) => {
            const entry = { word, start }
            start += word.length
            return entry
        })
    }, [text])
    const totalChars = React.useMemo(
        () => words.reduce((n, w) => n + w.word.length, 0),
        [words]
    )

    const measure = React.useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const left = container.getBoundingClientRect().left
        const centers: number[] = new Array(totalChars)
        for (let i = 0; i < totalChars; i++) {
            const el = letterRefs.current[i]
            if (!el) {
                centers[i] = NaN
                continue
            }
            const r = el.getBoundingClientRect()
            centers[i] = r.left - left + r.width / 2
        }
        centersRef.current = centers
    }, [totalChars])

    const applyBlur = React.useCallback(() => {
        rafRef.current = null
        const x = pointerXRef.current
        const centers = centersRef.current
        const blurs = blursRef.current
        for (let i = 0; i < centers.length; i++) {
            const el = letterRefs.current[i]
            if (!el) continue
            let next = 0
            if (x !== null && !Number.isNaN(centers[i])) {
                const dist = Math.abs(x - centers[i])
                if (dist <= blurRadius) {
                    next = (1 - dist / blurRadius) * maxBlur * influence
                }
            }
            next = Math.round(next * 20) / 20
            if (blurs[i] !== next) {
                blurs[i] = next
                el.style.filter = next === 0 ? "" : `blur(${next}px)`
            }
        }
    }, [blurRadius, maxBlur, influence])

    const schedule = React.useCallback(() => {
        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(applyBlur)
        }
    }, [applyBlur])

    // Measure after layout whenever the text/typography changes, when the
    // container resizes, and when web fonts finish loading.
    const fontKey = JSON.stringify(font)
    React.useLayoutEffect(() => {
        if (isStatic) return
        measure()
        const container = containerRef.current
        let ro: ResizeObserver | undefined
        if (container && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => measure())
            ro.observe(container)
        }
        let cancelled = false
        const fonts = (document as any).fonts
        if (fonts?.ready) {
            fonts.ready.then(() => {
                if (!cancelled) measure()
            })
        }
        return () => {
            cancelled = true
            ro?.disconnect()
        }
    }, [isStatic, measure, text, align, fontKey])

    React.useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // One layout read per event (cheap); letters are never measured here.
        const left = containerRef.current?.getBoundingClientRect().left
        if (left === undefined) return
        pointerXRef.current = e.clientX - left
        schedule()
    }

    const handleMouseLeave = () => {
        pointerXRef.current = null
        schedule()
    }

    const containerStyle: React.CSSProperties = {
        ...style,
        display: "flex",
        flexWrap: "wrap",
        cursor: "default",
        ...font,
        color,
        textAlign: align,
        justifyContent:
            align === "center"
                ? "center"
                : align === "right"
                  ? "flex-end"
                  : "flex-start",
    }

    // Static canvas / export: no pointer interaction, no per-letter DOM.
    if (isStatic) {
        return <div style={containerStyle}>{text}</div>
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={containerStyle}
        >
            {words.map(({ word, start }, wIndex) => (
                <span
                    key={wIndex}
                    style={{
                        display: "inline-flex",
                        whiteSpace: "pre",
                    }}
                >
                    {word.split("").map((char, i) => (
                        <span
                            key={start + i}
                            ref={(el) => {
                                letterRefs.current[start + i] = el
                            }}
                            style={{
                                display: "inline-block",
                                transition: "filter 0.15s ease-out",
                            }}
                        >
                            {char}
                        </span>
                    ))}
                    {wIndex < words.length - 1 && (
                        <span style={{ whiteSpace: "pre" }}> </span>
                    )}
                </span>
            ))}
        </div>
    )
}

BlurHoverText.defaultProps = {
    text: "Hover me and watch the letters blur",
    font: {
        fontFamily: "Inter, sans-serif",
        fontSize: 40,
        fontWeight: 600,
        lineHeight: "1.3em",
        letterSpacing: "0em",
    },
    color: "#111111",
    align: "left",
    blurRadius: 80,
    influence: 1,
    maxBlur: 8,
}

addPropertyControls(BlurHoverText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover me and watch the letters blur",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontSize: 40,
            fontWeight: 600,
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
    blurRadius: {
        type: ControlType.Number,
        title: "Blur Radius",
        min: 10,
        max: 400,
        step: 5,
        defaultValue: 80,
        description: "How far (in px) from the cursor the blur reaches.",
    },
    maxBlur: {
        type: ControlType.Number,
        title: "Max Blur",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 8,
        description: "Strongest blur applied right under the cursor.",
    },
    influence: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
        description: "Overall multiplier for the effect strength.",
    },
})
