// User request: "슬라이더를 조절하면 텍스트가 커지고 작아지는 컴포넌트를 만들어줘. 텍스트는 수정 가능해야해."
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


type Props = {
    text: string
    font: any
    textColor: string

    value: {
        textColor: string
        textSize: number
        padding: string
    }

    sizeSettings: {
        minSize: number
        maxSize: number
        defaultSize: number
        step: number
    }
    showValue: boolean

    layout: {
        backgroundColor: string
        padding: string
        gap: number
        radius: number
    }

    sliderStyle: {
        trackColor: string
        fillColor: string
        thumbColor: string
        trackHeight: number
        handleSize: number
    }

    textAreaHeight: number

    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextSizeSlider(props: Props) {
    const {
        text,
        font,
        textColor,
        value,
        sizeSettings,
        showValue,
        layout,
        sliderStyle: sliderStyleProps,
        textAreaHeight,
        style,
    } = props

    const clampedInitial = React.useMemo(() => {
        const minSize = sizeSettings?.minSize
        const maxSize = sizeSettings?.maxSize
        const defaultSize = sizeSettings?.defaultSize

        const safeMin = Number.isFinite(minSize) ? minSize : 12
        const safeMax = Number.isFinite(maxSize) ? maxSize : 64
        const v = Number.isFinite(defaultSize) ? defaultSize : 24
        return Math.min(safeMax, Math.max(safeMin, v))
    }, [sizeSettings])

    const [size, setSize] = React.useState<number>(clampedInitial)

    React.useEffect(() => {
        React.startTransition(() => setSize(clampedInitial))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clampedInitial])

    const safeMin = React.useMemo(() => {
        const minSize = sizeSettings?.minSize
        const maxSize = sizeSettings?.maxSize
        const a = Number.isFinite(minSize) ? minSize : 12
        const b = Number.isFinite(maxSize) ? maxSize : 64
        return Math.min(a, b)
    }, [sizeSettings])
    const safeMax = React.useMemo(() => {
        const minSize = sizeSettings?.minSize
        const maxSize = sizeSettings?.maxSize
        const a = Number.isFinite(minSize) ? minSize : 12
        const b = Number.isFinite(maxSize) ? maxSize : 64
        return Math.max(a, b)
    }, [sizeSettings])

    const safeStep = React.useMemo(() => {
        const step = sizeSettings?.step
        if (!Number.isFinite(step) || step <= 0) return 1
        const range = Math.abs(safeMax - safeMin)
        if (range === 0) return 1
        return Math.min(step, range)
    }, [sizeSettings, safeMin, safeMax])

    const percent = React.useMemo(() => {
        const range = safeMax - safeMin
        if (range <= 0) return 0
        return ((size - safeMin) / range) * 100
    }, [size, safeMin, safeMax])

    const thumbValue = React.useMemo(() => `${Math.round(size)}px`, [size])

    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const next = Number(e.currentTarget.value)
            const clamped = Math.min(safeMax, Math.max(safeMin, next))
            React.startTransition(() => setSize(clamped))
        },
        [safeMin, safeMax]
    )

    const isFixedWidth = style && style.width === "100%"
    const isFixedHeight = style && style.height === "100%"

    const rootStyle: React.CSSProperties = {
        position: "relative",
        width: isFixedWidth ? "100%" : "auto",
        height: isFixedHeight ? "100%" : "auto",
        boxSizing: "border-box",
        overflow: "visible",
        background: layout?.backgroundColor,
        borderRadius: layout?.radius,
        padding: layout?.padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: layout?.gap,
        ...style,
    }

    const textAreaStyle: React.CSSProperties = {
        width: "100%",
        height: textAreaHeight,
        overflow: "hidden",
        boxSizing: "border-box",
    }

    const textFrameStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
    }

    const sliderWrapStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: 24,
        display: "flex",
        alignItems: "center",
    }

    const trackColor = sliderStyleProps?.trackColor
    const fillColor = sliderStyleProps?.fillColor
    const thumbColor = sliderStyleProps?.thumbColor
    const trackHeight = sliderStyleProps?.trackHeight
    const handleSize = sliderStyleProps?.handleSize

    const sliderStyle: React.CSSProperties = {
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        width: "100%",
        accentColor: fillColor,
        // Custom background fill for browsers that ignore accent-color
        background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`,
        height: Math.max(1, Number.isFinite(trackHeight) ? trackHeight : 6),
        borderRadius: 999,
        outline: "none",
        WebkitAppearance: "none",
        appearance: "none",
    }

    const thumbValueStyle: React.CSSProperties = {
        ...font,
        position: "absolute",
        left: `${percent}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        minHeight: 22,
        minWidth: 34,
        padding: value?.padding,
        borderRadius: 999,
        background: thumbColor,
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.max(1, Number.isFinite(value?.textSize) ? value?.textSize : 11)}px`,
        lineHeight: "1em",
        color: value?.textColor,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
    }

    const textStyle: React.CSSProperties = React.useMemo(() => {
        return {
            ...font,
            color: textColor,
            fontSize: `${Math.round(size)}px`,
            margin: 0,
            maxWidth: "100%",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            boxSizing: "border-box",
            textAlign: "center",
        }
    }, [font, textColor, size])

    return (
        <section style={rootStyle} aria-label="Text size slider">
            <div style={textAreaStyle}>
                <div style={textFrameStyle}>
                    <p style={textStyle}>{text}</p>
                </div>
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: Math.max(8, (layout?.gap ?? 0) * 0.75),
                }}
            >
                <div style={sliderWrapStyle}>
                    <input
                        type="range"
                        min={safeMin}
                        max={safeMax}
                        step={safeStep}
                        value={Number.isFinite(size) ? size : safeMin}
                        onChange={onChange}
                        style={sliderStyle}
                        aria-label="Text size"
                        aria-valuemin={safeMin}
                        aria-valuemax={safeMax}
                        aria-valuenow={size}
                    />
                    {showValue ? (
                        <div aria-hidden style={thumbValueStyle}>
                            {thumbValue}
                        </div>
                    ) : null}
                </div>
            </div>

            <style>{`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: ${showValue ? "1px" : `${Math.max(6, Number.isFinite(handleSize) ? handleSize : 18)}px`};
                    height: ${showValue ? "1px" : `${Math.max(6, Number.isFinite(handleSize) ? handleSize : 18)}px`};
                    margin-top: ${showValue ? "0px" : `${(Math.max(1, Number.isFinite(trackHeight) ? trackHeight : 6) - Math.max(6, Number.isFinite(handleSize) ? handleSize : 18)) / 2}px`};
                    border-radius: 999px;
                    background: ${showValue ? "transparent" : thumbColor};
                    border: ${showValue ? "0" : "2px solid rgba(0,0,0,0.08)"};
                    box-shadow: ${showValue ? "none" : "0 2px 8px rgba(0,0,0,0.18)"};
                    opacity: ${showValue ? 0 : 1};
                    cursor: pointer;
                }
                input[type="range"]::-moz-range-thumb {
                    width: ${showValue ? "1px" : `${Math.max(6, Number.isFinite(handleSize) ? handleSize : 18)}px`};
                    height: ${showValue ? "1px" : `${Math.max(6, Number.isFinite(handleSize) ? handleSize : 18)}px`};
                    border-radius: 999px;
                    background: ${showValue ? "transparent" : thumbColor};
                    border: ${showValue ? "0" : "2px solid rgba(0,0,0,0.08)"};
                    box-shadow: ${showValue ? "none" : "0 2px 8px rgba(0,0,0,0.18)"};
                    opacity: ${showValue ? 0 : 1};
                    cursor: pointer;
                }
                input[type="range"]::-webkit-slider-runnable-track {
                    height: ${Math.max(1, Number.isFinite(trackHeight) ? trackHeight : 6)}px;
                    border-radius: 999px;
                    background: transparent;
                }
                input[type="range"]::-moz-range-track {
                    height: ${Math.max(1, Number.isFinite(trackHeight) ? trackHeight : 6)}px;
                    border-radius: 999px;
                    background: transparent;
                }
            `}</style>
        </section>
    )
}

addPropertyControls(TextSizeSlider, {
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },

    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Text size with the slider.",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },

    sizeSettings: {
        type: ControlType.Object,
        title: "Size Settings",
        controls: {
            minSize: {
                type: ControlType.Number,
                title: "Min Size",
                defaultValue: 12,
                min: 6,
                max: 200,
                step: 1,
                unit: "px",
            },
            maxSize: {
                type: ControlType.Number,
                title: "Max Size",
                defaultValue: 64,
                min: 6,
                max: 240,
                step: 1,
                unit: "px",
            },
            defaultSize: {
                type: ControlType.Number,
                title: "Default Size",
                defaultValue: 24,
                min: 6,
                max: 240,
                step: 1,
                unit: "px",
            },
            step: {
                type: ControlType.Number,
                title: "Step",
                defaultValue: 1,
                min: 0.5,
                max: 20,
                step: 0.5,
            },
        },
        defaultValue: {
            minSize: 12,
            maxSize: 64,
            defaultSize: 24,
            step: 1,
        },
    },

    showValue: {
        type: ControlType.Boolean,
        title: "Show Value",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    value: {
        type: ControlType.Object,
        title: "Value",
        hidden: ({ showValue }) => !showValue,
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#000000",
            },
            textSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 11,
                min: 6,
                max: 48,
                step: 1,
                unit: "px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "0px 8px 0px 8px",
            },
        },
        defaultValue: {
            textColor: "#000000",
            textSize: 11,
            padding: "10px 12px 10px 12px",
        },
    },

    sliderStyle: {
        type: ControlType.Object,
        title: "Slider Style",
        controls: {
            trackColor: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: "#EEEEEE",
            },
            fillColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#000000",
            },
            thumbColor: {
                type: ControlType.Color,
                title: "Handle",
                defaultValue: "#FFFFFF",
            },
            trackHeight: {
                type: ControlType.Number,
                title: "Track H",
                defaultValue: 6,
                min: 1,
                max: 24,
                step: 1,
                unit: "px",
            },
            handleSize: {
                type: ControlType.Number,
                title: "Handle Size",
                defaultValue: 18,
                min: 6,
                max: 60,
                step: 1,
                unit: "px",
                hidden: ({ showValue }) => showValue,
            },
        },
        defaultValue: {
            trackColor: "#EEEEEE",
            fillColor: "#000000",
            thumbColor: "#FFFFFF",
            trackHeight: 6,
            handleSize: 18,
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "16px 16px 16px 16px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 12,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            backgroundColor: "#FFFFFF",
            padding: "16px 16px 16px 16px",
            gap: 12,
            radius: 12,
        },
    },

    textAreaHeight: {
        type: ControlType.Number,
        title: "Text Area H",
        defaultValue: 200,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
    },
})
