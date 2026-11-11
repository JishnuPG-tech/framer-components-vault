// Card component with image background, overlay, text elements, and animated icon background on hover
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import {
    useState,
    useRef,
    useEffect,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"

interface CardProps {
    layout:
        | "titleBottomLeft"
        | "titleBottomRight"
        | "centered"
        | "titleTopLeft"
        | "titleTopRight"
    image: { src: string; alt: string }
    overlay: string
    title: string
    subtitle: string
    titleSubtitleSpacing: number
    category: string
    iconGroup: {
        icon: { src: string; alt: string }
        size: number
        backgroundColor: string
        backgroundHoverColor: string
        radius: string
        padding: string
    }
    link: string
    newTab: boolean
    cardRadius: string
    titleFont: CSSProperties
    subtitleFont: CSSProperties
    categoryFont: CSSProperties
    showTextMask: boolean
    textMaskColor: string
    titleColor: string
    titleHoverColor: string
    subtitleColor: string
    subtitleHoverColor: string
    categoryColor: string
    categoryHoverColor: string
    transition: any
    padding: string
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CircleExpandCard(props: CardProps) {
    const {
        layout = "titleBottomLeft",
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Card background",
        },
        overlay = "rgba(0, 0, 0, 0.3)",
        title = "Card Title",
        subtitle = "Card subtitle",
        titleSubtitleSpacing = 4,
        category = "Category",
        iconGroup = {
            icon: {
                src: "",
                alt: "Arrow icon",
            },
            size: 24,
            backgroundColor: "#c7f19d",
            backgroundHoverColor: "#c7f19d",
            radius: "999px",
            padding: "15px",
        },
        link = "https://framer.com",
        newTab = true,
        cardRadius = "16px",
        titleFont,
        subtitleFont,
        categoryFont,
        showTextMask = true,
        textMaskColor = "#000000",
        titleColor = "#FFFFFF",
        titleHoverColor = "#FFFFFF",
        subtitleColor = "#FFFFFF",
        subtitleHoverColor = "#FFFFFF",
        categoryColor = "#FFFFFF",
        categoryHoverColor = "#FFFFFF",
        transition,
        padding = "20px",
        style,
    } = props

    const {
        icon = { src: "", alt: "Arrow icon" },
        size: iconSize = 24,
        backgroundColor: iconBackgroundColor = "#c7f19d",
        backgroundHoverColor: iconBackgroundHoverColor = "#c7f19d",
        radius: iconRadius = "999px",
        padding: iconPadding = "15px",
    } = iconGroup

    const [isHovered, setIsHovered] = useState(false)
    const cardRef = useRef<HTMLAnchorElement>(null)
    const [expandedSize, setExpandedSize] = useState(1500)

    const iconCorner = useMemo<"tr" | "tl" | "br" | "bl">(() => {
        if (layout === "titleBottomRight") return "tr"
        if (layout === "titleTopLeft") return "br"
        if (layout === "titleTopRight") return "br"
        return "tr"
    }, [layout])

    // Use the first padding value as our inset for absolute-positioned content
    const paddingInset = (padding || "20px").trim().split(/\s+/)[0] || "20px"
    const paddingInsetNum = parseFloat(paddingInset) || 20

    const topTextPos = useMemo(() => {
        if (layout === "titleTopLeft" || layout === "titleTopRight") {
            return { bottom: paddingInset, top: "auto", left: paddingInset }
        }
        return { top: paddingInset, bottom: "auto", left: paddingInset }
    }, [layout, paddingInset])

    const textBlockPos = useMemo(() => {
        if (layout === "titleTopLeft") {
            return {
                top: paddingInset,
                bottom: "auto",
                left: paddingInset,
                right: "auto",
            }
        }
        if (layout === "titleTopRight") {
            return {
                top: paddingInset,
                bottom: "auto",
                right: paddingInset,
                left: "auto",
                textAlign: "right" as const,
            }
        }
        if (layout === "titleBottomRight") {
            return {
                bottom: paddingInset,
                top: "auto",
                right: paddingInset,
                left: "auto",
                textAlign: "right" as const,
            }
        }
        if (layout === "centered") {
            return {
                top: "50%",
                left: "50%",
                right: "auto",
                bottom: "auto",
                transform: "translate(-50%, -50%)",
                width: `calc(100% - ${paddingInsetNum * 2}px)`,
                textAlign: "center" as const,
            }
        }
        return {
            bottom: paddingInset,
            top: "auto",
            left: paddingInset,
            right: "auto",
        }
    }, [layout, paddingInset, paddingInsetNum])

    // Parse iconPadding to a number for calculations
    const iconPaddingNum = parseFloat(iconPadding) || 15

    // Calculate the size needed to cover the entire card
    const initialSize = iconSize + iconPaddingNum * 2

    // Extract transition duration for text color changes
    const transitionDuration = transition?.duration || 0.3

    useEffect(() => {
        if (cardRef.current) {
            const { width, height } = cardRef.current.getBoundingClientRect()
            // Calculate diagonal distance from top-right corner to opposite corner, then multiply by 2 for safety
            const diagonal = Math.sqrt(width * width + height * height)
            startTransition(() => setExpandedSize(diagonal * 2))
        }
    }, [style?.width, style?.height])

    // Default SVG arrow icon
    const defaultIcon = (
        <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="#0F1F10"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M7 17L17 7M17 7H7M17 7V17"
                stroke="#0F1F10"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    )

    return (
        <motion.a
            ref={cardRef}
            href={link}
            target={newTab ? "_blank" : "_self"}
            rel="noopener noreferrer"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "block",
                overflow: "hidden",
                textDecoration: "none",
                cursor: "pointer",
                borderRadius: cardRadius,
                padding: padding,
            }}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: cardRadius,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: overlay,
                    zIndex: 1,
                }}
            />

            <motion.div
                style={{
                    position: "absolute",
                    borderRadius: iconRadius,
                    zIndex: 3,
                    willChange: "width, height",
                }}
                initial={{
                    width: initialSize,
                    height: initialSize,
                    ...(iconCorner === "tr"
                        ? { top: paddingInsetNum, right: paddingInsetNum }
                        : {}),
                    ...(iconCorner === "tl"
                        ? { top: paddingInsetNum, left: paddingInsetNum }
                        : {}),
                    ...(iconCorner === "br"
                        ? { bottom: paddingInsetNum, right: paddingInsetNum }
                        : {}),
                    ...(iconCorner === "bl"
                        ? { bottom: paddingInsetNum, left: paddingInsetNum }
                        : {}),
                    backgroundColor: iconBackgroundColor,
                }}
                animate={{
                    width: isHovered ? expandedSize : initialSize,
                    height: isHovered ? expandedSize : initialSize,
                    ...(iconCorner === "tr"
                        ? {
                              top: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                              right: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                          }
                        : {}),
                    ...(iconCorner === "tl"
                        ? {
                              top: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                              left: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                          }
                        : {}),
                    ...(iconCorner === "br"
                        ? {
                              bottom: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                              right: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                          }
                        : {}),
                    ...(iconCorner === "bl"
                        ? {
                              bottom: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                              left: isHovered
                                  ? paddingInsetNum -
                                    (expandedSize - initialSize) / 2
                                  : paddingInsetNum,
                          }
                        : {}),
                    backgroundColor: isHovered
                        ? iconBackgroundHoverColor
                        : iconBackgroundColor,
                }}
                transition={transition}
            />

            <div
                style={{
                    position: "absolute",
                    ...(iconCorner === "tr"
                        ? { top: paddingInset, right: paddingInset }
                        : {}),
                    ...(iconCorner === "tl"
                        ? { top: paddingInset, left: paddingInset }
                        : {}),
                    ...(iconCorner === "br"
                        ? { bottom: paddingInset, right: paddingInset }
                        : {}),
                    ...(iconCorner === "bl"
                        ? { bottom: paddingInset, left: paddingInset }
                        : {}),
                    width: iconSize + iconPaddingNum * 2,
                    height: iconSize + iconPaddingNum * 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                    padding: iconPadding,
                }}
            >
                {icon.src ? (
                    <img
                        src={icon.src}
                        alt={icon.alt || "Icon"}
                        style={{
                            width: iconSize,
                            height: iconSize,
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    defaultIcon
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    ...topTextPos,
                    zIndex: 4,
                    ...categoryFont,
                    color: isHovered ? categoryHoverColor : categoryColor,
                    transition: `color ${transitionDuration}s linear`,
                }}
            >
                {category}
            </div>

            {showTextMask && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50%",
                        background: `linear-gradient(to top, ${textMaskColor}, transparent)`,
                        zIndex: 2,
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    ...textBlockPos,
                    color: "#FFFFFF",
                    zIndex: 4,
                }}
            >
                <div
                    style={{
                        marginBottom: titleSubtitleSpacing,
                        ...titleFont,
                        color: isHovered ? titleHoverColor : titleColor,
                        transition: `color ${transitionDuration}s linear`,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        ...subtitleFont,
                        color: isHovered ? subtitleHoverColor : subtitleColor,
                        transition: `color ${transitionDuration}s linear`,
                    }}
                >
                    {subtitle}
                </div>
            </div>
        </motion.a>
    )
}

addPropertyControls(CircleExpandCard, {
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: [
            "titleBottomLeft",
            "titleBottomRight",
            "centered",
            "titleTopLeft",
            "titleTopRight",
        ],
        optionTitles: [
            "Title Bottom Left",
            "Title Bottom Right",
            "Title Centered",
            "Title Top Left",
            "Title Top Right",
        ],
        defaultValue: "titleBottomLeft",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    overlay: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(0, 0, 0, 0.3)",
    },
    cardRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px",
    },
    showTextMask: {
        type: ControlType.Boolean,
        title: "Text Mask",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    textMaskColor: {
        type: ControlType.Color,
        title: "Mask Color",
        defaultValue: "rgba(0, 0, 0, 0.45)",
        hidden: ({ showTextMask }) => !showTextMask,
    },
    category: {
        type: ControlType.String,
        title: "Top Text",
        defaultValue: "Top Text",
    },
    categoryFont: {
        type: ControlType.Font,
        title: "Top Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    categoryColor: {
        type: ControlType.Color,
        title: "Top Text Color",
        defaultValue: "#FFFFFF",
    },
    categoryHoverColor: {
        type: ControlType.Color,
        title: "Top Text Hover",
        defaultValue: "#0F1F10",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Card Title",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    titleHoverColor: {
        type: ControlType.Color,
        title: "Title Hover",
        defaultValue: "#0F1F10",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Card subtitle",
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#FFFFFF",
    },
    subtitleHoverColor: {
        type: ControlType.Color,
        title: "Subtitle Hover",
        defaultValue: "#0F1F10",
    },
    titleSubtitleSpacing: {
        type: ControlType.Number,
        title: "Title Gap",
        defaultValue: 4,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    iconGroup: {
        type: ControlType.Object,
        title: "Icon",
        controls: {
            icon: {
                type: ControlType.ResponsiveImage,
                title: "Icon",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 24,
                min: 12,
                max: 80,
                step: 1,
                unit: "px",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#c7f19d",
            },
            backgroundHoverColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#c7f19d",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "999px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "15px",
            },
        },
        defaultValue: {
            size: 24,
            backgroundColor: "#c7f19d",
            backgroundHoverColor: "#c7f19d",
            radius: "999px",
            padding: "15px",
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
    },
})

CircleExpandCard.displayName = "Circle Expand Card"
