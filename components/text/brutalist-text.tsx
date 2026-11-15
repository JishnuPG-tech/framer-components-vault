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


type TagName = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type SelectMode = "none" | "auto" | "onlyFirst"

interface BrutalistTextProps {
    text: string
    font: any
    color: string

    fitToWidth: boolean

    layers: number
    rowHeightEm: number
    decay: number
    opacityStep: number
    gapEm: number

    select: SelectMode
    tag: TagName

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n))
}

/**
 * Brutalist Text
 *
 * @framerIntrinsicWidth 530
 * @framerIntrinsicHeight 225
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function BrutalistText(props: BrutalistTextProps) {
    const {
        text = "BRUTALISM",
        font,
        color,
        fitToWidth,
        layers,
        rowHeightEm,
        decay,
        opacityStep,
        gapEm,
        select,
        tag,
        style,
    } = props

    const Tag = (tag || "span") as any

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const measureRef = React.useRef<HTMLSpanElement | null>(null)

    const [fitScale, setFitScale] = React.useState(1)

    const safeLayers = React.useMemo(() => {
        const n = Number.isFinite(layers) ? Math.round(layers) : 5
        return clamp(n, 1, 12)
    }, [layers])

    const safeDecay = React.useMemo(() => {
        const d = Number.isFinite(decay) ? decay : 0.667
        return clamp(d, 0.05, 1)
    }, [decay])

    const safeOpacityStep = React.useMemo(() => {
        const s = Number.isFinite(opacityStep) ? opacityStep : 0.2
        return clamp(s, 0, 1)
    }, [opacityStep])

    const safeRowHeightEm = React.useMemo(() => {
        const h = Number.isFinite(rowHeightEm) ? rowHeightEm : 0.9
        return clamp(h, 0.01, 5)
    }, [rowHeightEm])

    const safeGapEm = React.useMemo(() => {
        const g = Number.isFinite(gapEm) ? gapEm : 0
        return clamp(g, 0, 10)
    }, [gapEm])

    const rows = React.useMemo(() => {
        const t = (text ?? "BRUTALISM").toString()
        const data: Array<{ key: string; heightEm: number; opacity: number }> =
            []

        for (let i = 0; i < safeLayers; i++) {
            const ratio = Math.pow(safeDecay, i)
            const heightEm = safeRowHeightEm * ratio
            const opacity = clamp(1 - i * safeOpacityStep, 0.05, 1)
            data.push({ key: `layer-${i}`, heightEm, opacity })
        }

        return { text: t, data }
    }, [text, safeLayers, safeDecay, safeRowHeightEm, safeOpacityStep])

    const computeFitScale = React.useCallback(() => {
        const containerEl = containerRef.current
        const measureEl = measureRef.current
        if (!containerEl || !measureEl) return

        const containerWidth = containerEl.getBoundingClientRect().width
        const textWidth = measureEl.getBoundingClientRect().width

        if (!Number.isFinite(containerWidth) || !Number.isFinite(textWidth))
            return
        if (containerWidth <= 0 || textWidth <= 0) return

        const next = clamp(containerWidth / textWidth, 0.01, 100)
        React.startTransition(() => setFitScale(next))
    }, [])

    React.useEffect(() => {
        if (!fitToWidth) {
            React.startTransition(() => setFitScale(1))
            return
        }

        if (typeof window === "undefined") return

        let raf: number | null = null
        const schedule = () => {
            if (raf != null) cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                raf = null
                computeFitScale()
            })
        }

        schedule()

        const containerEl = containerRef.current
        let ro: ResizeObserver | null = null

        if (containerEl && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => schedule())
            ro.observe(containerEl)
        } else {
            window.addEventListener("resize", schedule)
        }

        return () => {
            if (raf != null) cancelAnimationFrame(raf)
            if (ro) ro.disconnect()
            else if (typeof window !== "undefined")
                window.removeEventListener("resize", schedule)
        }
    }, [fitToWidth, computeFitScale, rows.text, font, style?.width])

    const isWidthFill = style?.width === "100%"
    const isHeightFill = style?.height === "100%"

    const wrapperStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        color,
        ...(fitToWidth || isWidthFill
            ? { width: "100%" }
            : { width: "max-content" }),
        ...(isHeightFill ? { height: "100%" } : { height: "max-content" }),
        ...font,
    }

    const layerContainerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: `${safeGapEm}em`,
        transform: fitToWidth ? `scale(${fitScale})` : undefined,
        transformOrigin: "center top",
    }

    const baseTextStyle: React.CSSProperties = {
        whiteSpace: "nowrap",
        display: "block",
        fontStyle: "inherit",
    }

    const shouldOverrideUserSelect = style?.userSelect == null

    const userSelectForLayer = (
        index: number
    ): React.CSSProperties | undefined => {
        if (!shouldOverrideUserSelect) return undefined
        if (select === "auto") return undefined
        if (select === "none")
            return { userSelect: "none", WebkitUserSelect: "none" }
        // onlyFirst
        if (index === 0) return { userSelect: "text", WebkitUserSelect: "text" }
        return { userSelect: "none", WebkitUserSelect: "none" }
    }

    return (
        <Tag style={wrapperStyle}>
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {rows.text}
            </span>
            <div
                ref={containerRef}
                style={layerContainerStyle}
                aria-hidden="true"
            >
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        ...baseTextStyle,
                        position: "absolute",
                        visibility: "hidden",
                        pointerEvents: "none",
                        left: 0,
                        top: 0,
                        height: 0,
                        overflow: "visible",
                    }}
                >
                    {rows.text}
                </span>

                {rows.data.map((row, index) => (
                    <span
                        key={row.key}
                        style={{
                            overflowX: "visible",
                            overflowY: "hidden",
                            display: "flex",
                            alignItems: "flex-end",
                            lineHeight: 0.8,
                            height: `${row.heightEm}em`,
                            opacity: index === 0 ? 1 : row.opacity,
                        }}
                    >
                        <span
                            style={{
                                ...baseTextStyle,
                                ...userSelectForLayer(index),
                            }}
                        >
                            {rows.text}
                        </span>
                    </span>
                ))}
            </div>
        </Tag>
    )
}

addPropertyControls(BrutalistText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "BRUTALISM",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "96px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    fitToWidth: {
        type: ControlType.Boolean,
        title: "Fit",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    layers: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 5,
        min: 1,
        max: 12,
        step: 1,
    },
    rowHeightEm: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 0.9,
        min: 0.1,
        max: 2,
        step: 0.01,
        unit: "em",
    },
    decay: {
        type: ControlType.Number,
        title: "Decay",
        defaultValue: 0.667,
        min: 0.05,
        max: 1,
        step: 0.001,
    },
    opacityStep: {
        type: ControlType.Number,
        title: "Opacity Step",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.01,
    },
    gapEm: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.01,
        unit: "em",
    },
    select: {
        type: ControlType.Enum,
        title: "Select",
        options: ["none", "auto", "onlyFirst"],
        optionTitles: ["None", "Auto", "Only First"],
        defaultValue: "auto",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["span", "p", "h1", "h2", "h3", "h4", "h5", "h6"],
        defaultValue: "span",
    },
})

BrutalistText.displayName = "Brutalist Text"
