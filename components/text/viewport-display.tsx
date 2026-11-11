// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { Monitor, Tablet, Smartphone } from "lucide-react"
import { motion } from "framer-motion"

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
function ViewportDisplay(props) {
    // Normalize Framer Font control (token string or object) into inline styles
    const fontStyle = React.useMemo(() => {
        const f = props.text?.font
        if (!f) return {}
        if (typeof f === "string") return { font: f }
        const size = f.fontSize ?? f.size
        return {
            fontFamily: f.fontFamily ?? f.family,
            fontWeight: f.fontWeight ?? f.weight,
            fontStyle: f.fontStyle ?? f.style,
            ...(size != null ? { fontSize: size } : {}),
            ...(f.lineHeight != null ? { lineHeight: f.lineHeight } : {}),
            ...(f.letterSpacing != null
                ? { letterSpacing: f.letterSpacing }
                : {}),
            ...(f.textAlign != null ? { textAlign: f.textAlign } : {}),
        }
    }, [props.text?.font])

    // Normalize BoxShadow control to a CSS string
    const normalizeShadow = React.useCallback((v: any): string => {
        if (v == null) return "none"
        if (typeof v === "string") return v // Framer spec: string with valid CSS box-shadow. :contentReference[oaicite:1]{index=1}
        if (Array.isArray(v)) return v.filter(Boolean).join(", ")
        if (typeof v === "object") {
            // Best-effort object shape support (x/y/blur/spread/color/inset)
            const {
                x = 0,
                y = 0,
                blur = 0,
                spread = 0,
                color = "rgba(0,0,0,0.3)",
                inset = false,
            } = v
            return `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${color}`
        }
        return String(v)
    }, [])

    // Track window dimensions
    const [dimensions, setDimensions] = React.useState({
        width: 1200,
        height: 800,
    })

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const updateDimensions = () => {
                setDimensions({
                    width: window.innerWidth,
                    height: window.innerHeight,
                })
            }
            updateDimensions()
            window.addEventListener("resize", updateDimensions)
            return () => window.removeEventListener("resize", updateDimensions)
        }
    }, [])

    // Process custom SVG if provided
    const processSVG = (svgString: string | undefined) => {
        if (!svgString) return null
        return (
            <div
                style={{ color: props.icon?.color }}
                dangerouslySetInnerHTML={{
                    __html: svgString
                        .replace(/fill="[^"]*"/g, "")
                        .replace(/<svg/g, '<svg fill="currentColor"')
                        .replace(
                            /<svg/,
                            `<svg width="${props.icon?.svgWidth}" height="${props.icon?.svgHeight}"`
                        ),
                }}
            />
        )
    }

    // Determine which icon to render
    const getDeviceIcon = () => {
        const { width } = dimensions
        const iconProps = {
            size: props.icon?.svgWidth,
            color: props.icon?.color,
        }

        if (width >= 1200 && props.custom?.desktopSVG) {
            return processSVG(props.custom.desktopSVG)
        } else if (width >= 810 && props.custom?.tabletSVG) {
            return processSVG(props.custom.tabletSVG)
        } else if (width < 810 && props.custom?.mobileSVG) {
            return processSVG(props.custom.mobileSVG)
        } else if (width >= 1200) {
            return <Monitor {...iconProps} />
        } else if (width >= 810) {
            return <Tablet {...iconProps} />
        } else {
            return <Smartphone {...iconProps} />
        }
    }

    // Animate individual characters when dimension changes
    const AnimatedCharacter = ({
        character,
        isChanging,
        delay,
    }: {
        character: string
        isChanging: boolean
        delay: number
    }) => (
        <motion.span
            initial={isChanging ? { y: 5, opacity: 0 } : {}}
            animate={isChanging ? { y: 0, opacity: 1 } : {}}
            transition={
                isChanging
                    ? { type: "spring", stiffness: 250, damping: 45, delay }
                    : {}
            }
            style={{ display: "inline-block" }}
        >
            {character}
        </motion.span>
    )

    // Current width/height as text
    const { width, height } = dimensions
    const widthText = `${width}`
    const heightText = `${height}`

    // Compare with previous dimensions to see which digits changed
    const prevDimensions = React.useRef({ width, height })
    const getChangingIndices = (currentText: string, prevText: string) => {
        const indices: number[] = []
        for (let i = 0; i < currentText.length; i++) {
            if (currentText[i] !== prevText[i]) indices.push(i)
        }
        return indices
    }

    const changingWidthIndices = getChangingIndices(
        widthText,
        `${prevDimensions.current.width}`
    )
    const changingHeightIndices = getChangingIndices(
        heightText,
        `${prevDimensions.current.height}`
    )

    React.useEffect(() => {
        prevDimensions.current = { width, height }
    }, [width, height])

    return (
        <div
            style={{
                backgroundColor: props.card?.bg,
                boxShadow: normalizeShadow(
                    props.card?.shadow ?? "0px 4px 6px rgba(0,0,0,0.3)"
                ),
                borderWidth: props.card?.borderWidth,
                borderStyle: props.card?.borderStyle as any,
                borderColor: props.card?.borderColor,
                borderRadius: props.card?.radius as any,
                padding: props.card?.padding as any,
                display: "inline-flex",
                alignItems: "center",
                gap: `${props.card?.gap ?? 4}px`,
            }}
        >
            {getDeviceIcon()}
            <div
                style={{
                    color: props.text?.color,
                    ...fontStyle,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {/* Width */}
                <div style={{ display: "flex" }}>
                    {[...widthText].map((char, index) => {
                        const isChanging = changingWidthIndices.includes(index)
                        const delay = isChanging
                            ? changingWidthIndices.indexOf(index) * 0.05
                            : 0
                        return (
                            <AnimatedCharacter
                                key={`w-${index}-${widthText}`}
                                character={char}
                                isChanging={isChanging}
                                delay={delay}
                            />
                        )
                    })}
                </div>

                {/* Separator */}
                <span style={{ margin: "0 4px" }}>×</span>

                {/* Height */}
                <div style={{ display: "flex" }}>
                    {[...heightText].map((char, index) => {
                        const isChanging = changingHeightIndices.includes(index)
                        const delay = isChanging
                            ? changingHeightIndices.indexOf(index) * 0.05
                            : 0
                        return (
                            <AnimatedCharacter
                                key={`h-${index}-${heightText}`}
                                character={char}
                                isChanging={isChanging}
                                delay={delay}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// -- PROPERTY CONTROLS --
// Grouped: Card → Icon → Text → Custom SVGs
addPropertyControls(ViewportDisplay, {
    // ── Card (Container)
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            bg: {
                type: ControlType.Color,
                title: "Background",
                description: "Panel background color.",
                defaultValue: "#ffffff",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Box Shadow",
                description: "Shadow under the card.",
                defaultValue: "0px 4px 6px rgba(0,0,0,0.3)",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                description: "Border thickness in px.",
                defaultValue: 1,
                min: 0,
                max: 10,
                step: 1,
            },
            borderStyle: {
                type: ControlType.Enum,
                title: "Border Style",
                description: "Border line style.",
                defaultValue: "solid",
                options: ["solid", "dashed", "dotted"],
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                description: "Border stroke color.",
                defaultValue: "#000000",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                description: "Inner spacing around content.",
                defaultValue: "36",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                description: "Corner radius for the card.",
                defaultValue: "14",
            },
            gap: {
                type: ControlType.Number,
                title: "Icon Gap",
                description: "Space between icon and text (px).",
                defaultValue: 4,
                min: 0,
                max: 64,
                step: 1,
            },
        },
    },

    // ── Icon
    icon: {
        type: ControlType.Object,
        title: "Icon",
        controls: {
            svgWidth: {
                type: ControlType.Number,
                title: "Width",
                description: "Width for device icon and custom SVG.",
                defaultValue: 24,
                min: 16,
                max: 64,
                step: 1,
            },
            svgHeight: {
                type: ControlType.Number,
                title: "Height",
                description: "Height for device icon and custom SVG.",
                defaultValue: 24,
                min: 16,
                max: 64,
                step: 1,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                description:
                    "Color for built-in icons and custom SVG (via currentColor).",
                defaultValue: "#000000",
            },
        },
    },

    // ── Text
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Color of the “width × height” text.",
                defaultValue: "#000000",
            },
            // @ts-ignore
            font: {
                type: ControlType.Font,
                controls: "extended",
                displayFontSize: true,
                displayTextAlignment: false,
                defaultFontType: "monospace",
                defaultValue: {
                    fontSize: 14,
                    lineHeight: "1.5em",
                },
                description:
                    "Font for the size readout. Extended controls supported.",
            },
        },
    },

    // ── Custom SVGs (optional)
    custom: {
        type: ControlType.Object,
        title: "Custom SVGs",
        controls: {
            desktopSVG: {
                type: ControlType.String,
                title: "Desktop SVG",
                description:
                    "Inline <svg>…</svg>. Fills replaced with currentColor; uses Icon Width/Height.",
                defaultValue: "",
            },
            tabletSVG: {
                type: ControlType.String,
                title: "Tablet SVG",
                description:
                    "Inline <svg>…</svg>. Fills replaced with currentColor; uses Icon Width/Height.",
                defaultValue: "",
            },
            mobileSVG: {
                type: ControlType.String,
                title: "Mobile SVG",
                description:
                    "Inline <svg>…</svg>. Fills replaced with currentColor; uses Icon Width/Height.",
                defaultValue: "",
            },
        },
    },
})

export default ViewportDisplay
