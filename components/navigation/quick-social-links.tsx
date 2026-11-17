// Social Links component with hover scale animation anchored to bottom
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    startTransition,
    useCallback,
    useState,
    type CSSProperties,
} from "react"

interface SocialLink {
    url: string
    label: string
    svg?: string
}

interface SocialLinksProps {
    socials: SocialLink[]
    backgroundColor: string
    hoverScale: number
    iconSize: number
    iconContainerPadding: number
    iconContainerBgColor: string
    gap: number
    padding: number
    borderRadius: number
    showLabel: boolean
    overflow: "visible" | "hidden" | "auto" | "scroll" | "clip"
    labelBackgroundColor?: string
    labelTextColor: string
    labelFont: any
    labelPadding: string
    labelOffset: number
    labelScaleFrom: number
    labelTransition: any
    style?: CSSProperties
}

/**
 * Social Links Component
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
// @framerDisableUnlink
export default function SocialLinks(props: SocialLinksProps) {
    const {
        socials,
        backgroundColor,
        hoverScale,
        iconSize,
        iconContainerPadding,
        iconContainerBgColor,
        gap,
        padding,
        borderRadius,
        showLabel,
        overflow,
        labelBackgroundColor,
        labelTextColor,
        labelFont,
        labelPadding,
        labelOffset,
        labelScaleFrom,
        labelTransition,
    } = props

    const hasLabelBg = !!(
        labelBackgroundColor && labelBackgroundColor.trim().length > 0
    )

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const renderIcon = useCallback(
        (social: SocialLink) => {
            const svg = (social.svg ?? "").trim()
            const graphicSize = Math.max(8, iconSize)
            if (!svg) {
                return (
                    <span
                        aria-hidden="true"
                        style={{
                            display: "inline-block",
                            fontSize: Math.max(
                                10,
                                Math.round(graphicSize * 0.28)
                            ),
                            lineHeight: 1,
                            color: "#CCCCCC",
                            userSelect: "none",
                            textAlign: "center",
                        }}
                    >
                        Add SVG
                    </span>
                )
            }

            return (
                <img
                    aria-hidden="true"
                    alt=""
                    src={"data:image/svg+xml;utf8," + encodeURIComponent(svg)}
                    style={{
                        width: graphicSize,
                        height: graphicSize,
                        display: "block",
                        objectFit: "contain",
                    }}
                />
            )
        },
        [iconSize]
    )

    const handleHoverStart = useCallback((index: number) => {
        startTransition(() => setHoveredIndex(index))
    }, [])

    const handleHoverEnd = useCallback(() => {
        startTransition(() => setHoveredIndex(null))
    }, [])

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: `${gap}px`,
                padding: `${padding}px`,
                backgroundColor,
                borderRadius: `${borderRadius}px`,
                width: "max-content",
                overflow,
            }}
        >
            {socials.map((social, index) => {
                const iconNode = renderIcon(social)
                const url = (social.url ?? "").trim()
                const label = (social.label ?? "").trim()
                const hasUrl = url.length > 0
                const hasLabel = label.length > 0

                const Wrapper: any = hasUrl ? motion.a : motion.div
                const containerSize = Math.max(
                    24,
                    iconSize + iconContainerPadding * 2
                )

                return (
                    <Wrapper
                        key={`${index}`}
                        {...(hasUrl
                            ? {
                                  href: url,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                              }
                            : {})}
                        aria-label={
                            hasLabel ? label : hasUrl ? url : "Social icon"
                        }
                        onHoverStart={() => handleHoverStart(index)}
                        onHoverEnd={handleHoverEnd}
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            width: `${containerSize}px`,
                            height: `${containerSize}px`,
                            textDecoration: "none",
                            cursor: hasUrl ? "pointer" : "default",
                            transformOrigin: "bottom center",
                            overflow: "visible",
                            zIndex: hoveredIndex === index ? 2 : 0,
                        }}
                    >
                        <AnimatePresence initial={false}>
                            {hoveredIndex === index &&
                                showLabel &&
                                hasLabel && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom: "100%",
                                            transform: "translateX(-50%)",
                                            transformOrigin: "bottom center",
                                            pointerEvents: "none",
                                            zIndex: 3,
                                        }}
                                    >
                                        <motion.div
                                            initial={{
                                                y: labelOffset,
                                                opacity: 0,
                                                scale: labelScaleFrom,
                                            }}
                                            animate={{
                                                y: -labelOffset,
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            exit={{
                                                y: labelOffset,
                                                opacity: 0,
                                                scale: labelScaleFrom,
                                            }}
                                            transition={labelTransition}
                                            style={{
                                                backgroundColor: hasLabelBg
                                                    ? labelBackgroundColor
                                                    : "transparent",
                                                color: labelTextColor,
                                                padding: labelPadding,
                                                borderRadius: hasLabelBg
                                                    ? 999
                                                    : 0,
                                                whiteSpace: "nowrap",
                                                willChange:
                                                    "transform, opacity",
                                                ...labelFont,
                                            }}
                                        >
                                            {label}
                                        </motion.div>
                                    </div>
                                )}
                        </AnimatePresence>

                        <motion.div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                                backgroundColor: iconContainerBgColor,
                                borderRadius: "50%",
                                overflow: "hidden",
                                transformOrigin: "50% 100%",
                                willChange: "transform",
                            }}
                            animate={{
                                scale: hoveredIndex === index ? hoverScale : 1,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                            }}
                        >
                            <div
                                style={{
                                    width: Math.max(8, iconSize),
                                    height: Math.max(8, iconSize),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    lineHeight: 0,
                                }}
                            >
                                {iconNode}
                            </div>
                        </motion.div>
                    </Wrapper>
                )
            })}
        </div>
    )
}

addPropertyControls(SocialLinks, {
    socials: {
        type: ControlType.Array,
        title: "Social Links",
        control: {
            type: ControlType.Object,
            controls: {
                svg: {
                    type: ControlType.String,
                    title: "SVG (optional)",
                    defaultValue: "",
                    placeholder: "Paste full <svg …>…</svg> code.",
                    displayTextArea: true,
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "",
                    placeholder: "Add link URL…",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                    placeholder: "Add label…",
                },
            },
        },
        defaultValue: [
            {
                label: "Instagram",
                url: "https://instagram.com/",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path></svg>`,
            },
            {
                label: "X",
                url: "https://x.com/",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z"></path></svg>`,
            },
            {
                label: "Phone",
                url: "tel:+10000000000",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M222.37,158.46l-47.11-21.11-.13-.06a16,16,0,0,0-15.17,1.4,8.12,8.12,0,0,0-.75.56L134.87,160c-15.42-7.49-31.34-23.29-38.83-38.51l20.78-24.71c.2-.25.39-.5.57-.77a16,16,0,0,0,1.32-15.06l0-.12L97.54,33.64a16,16,0,0,0-16.62-9.52A56.26,56.26,0,0,0,32,80c0,79.4,64.6,144,144,144a56.26,56.26,0,0,0,55.88-48.92A16,16,0,0,0,222.37,158.46ZM176,208A128.14,128.14,0,0,1,48,80,40.2,40.2,0,0,1,82.87,40a.61.61,0,0,0,0,.12l21,47L83.2,111.86a6.13,6.13,0,0,0-.57.77,16,16,0,0,0-1,15.7c9.06,18.53,27.73,37.06,46.46,46.11a16,16,0,0,0,15.75-1.14,8.44,8.44,0,0,0,.74-.56L168.89,152l47,21.05h0s.08,0,.11,0A40.21,40.21,0,0,1,176,208Z"></path></svg>`,
            },
            {
                label: "Email",
                url: "mailto:hello@example.com",
                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"></path></svg>`,
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.3,
        min: 1,
        max: 2,
        step: 0.1,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 24,
        min: 8,
        max: 96,
        step: 2,
        unit: "px",
    },
    iconContainerPadding: {
        type: ControlType.Number,
        title: "Icon Container Padding",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    iconContainerBgColor: {
        type: ControlType.Color,
        title: "Icon Container Bg",
        defaultValue: "#F2F2F2",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 4,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 100,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        defaultValue: "visible",
        options: ["visible", "hidden", "auto", "scroll", "clip"],
        optionTitles: ["Visible", "Hidden", "Auto", "Scroll", "Clip"],
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelBackgroundColor: {
        type: ControlType.Color,
        title: "Label Bg",
        defaultValue: "",
        optional: true,
    },
    labelTextColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#000000",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    labelPadding: {
        type: ControlType.Padding,
        title: "Label Padding",
        defaultValue: "4px 8px 4px 8px",
    },
    labelOffset: {
        type: ControlType.Number,
        title: "Label Lift",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    labelScaleFrom: {
        type: ControlType.Number,
        title: "Label Scale",
        defaultValue: 0.5,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    labelTransition: {
        type: ControlType.Transition,
        title: "Label Transition",
        defaultValue: {
            type: "tween",
            ease: "easeOut",
            duration: 0.3,
        },
    },
})
