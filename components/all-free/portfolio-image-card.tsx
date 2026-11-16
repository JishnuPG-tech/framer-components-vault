import { useRef, useState, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useMotionValue } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

interface ImagePortfolioCardProps {
    image?: ResponsiveImage
    // Hover effect
    hoverEffect?: "blur" | "tint" | "bw"
    blurAmount?: number
    blurAngle?: number
    tintColor?: string
    tintOpacity?: number
    // Title
    title?: string
    titleColor?: string
    titleShowBorder?: boolean
    titleBorderRadius?: number
    titleBorderColor?: string
    titleBorderWidth?: number
    titleBorderBackground?: string
    titlePadding?: string
    titlePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    titleFont?: {
        fontSize?: number | string
        fontFamily?: string
        fontWeight?: number | string
        letterSpacing?: number | string
        lineHeight?: number | string
        textAlign?: "left" | "right" | "center"
        [key: string]: unknown
    }
    // Loading bar
    trackColor?: string
    trackDuration?: number
    // Layout
    cropAnchor?:
        | "center"
        | "top"
        | "bottom"
        | "left"
        | "right"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
    hoverInDuration?: number
    hoverOutDuration?: number
    cornerRadius?: number
    aspectRatio?: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImagePortfolioCard(props: ImagePortfolioCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Portfolio image",
        },
        hoverEffect = "blur",
        blurAmount = 12,
        blurAngle = 0,
        tintColor = "#000000",
        tintOpacity = 0.4,
        title = "Project Name",
        titleColor = "#ffffff",
        titleShowBorder = false,
        titleBorderRadius = 4,
        titleBorderColor = "#ffffff",
        titleBorderWidth = 1,
        titleBorderBackground = "rgba(0,0,0,0.3)",
        titlePadding = "4px 8px",
        titlePosition = "bottom-left",
        titleFont = {
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        trackColor = "#ffffff",
        trackDuration = 2,
        cropAnchor = "center",
        hoverInDuration = 0.4,
        hoverOutDuration = 0.3,
        cornerRadius = 8,
        aspectRatio = 4 / 3,
        style,
    } = props

    const cropAnchorMap: Record<string, string> = {
        center: "center center",
        top: "center top",
        bottom: "center bottom",
        left: "left center",
        right: "right center",
        "top-left": "left top",
        "top-right": "right top",
        "bottom-left": "left bottom",
        "bottom-right": "right bottom",
    }

    // Computed once — threaded into every conditional below
    const isStatic = useIsStaticRenderer()
    const [isHovered, setIsHovered] = useState(false)
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const filterId = useRef(
        `ipf-${Math.random().toString(36).slice(2, 8)}`
    ).current
    const feBlurRef = useRef<SVGFEGaussianBlurElement>(null)
    const feSatRef = useRef<SVGFEColorMatrixElement>(null)

    const blurX = useMotionValue(0)
    const blurY = useMotionValue(0)
    const saturation = useMotionValue(1)

    useEffect(() => {
        setIsTouchDevice(
            typeof window !== "undefined" &&
                window.matchMedia("(hover: none)").matches
        )
    }, [])

    // Drive SVG filter attributes imperatively via motion value subscriptions
    useEffect(() => {
        const unsubX = blurX.on("change", (v) => {
            if (feBlurRef.current) {
                const yVal = blurY.get()
                feBlurRef.current.setAttribute("stdDeviation", `${v} ${yVal}`)
            }
        })
        const unsubY = blurY.on("change", (v) => {
            if (feBlurRef.current) {
                const xVal = blurX.get()
                feBlurRef.current.setAttribute("stdDeviation", `${xVal} ${v}`)
            }
        })
        const unsubSat = saturation.on("change", (v) => {
            if (feSatRef.current) {
                feSatRef.current.setAttribute("values", String(v))
            }
        })
        return () => {
            unsubX()
            unsubY()
            unsubSat()
        }
    }, [blurX, blurY, saturation])

    // Animate filter values on hover — skipped entirely when static
    useEffect(() => {
        if (isStatic) return
        if (isHovered) {
            if (hoverEffect === "blur") {
                const rad = (blurAngle * Math.PI) / 180
                const bx = Math.abs(blurAmount * Math.cos(rad))
                const by = Math.abs(blurAmount * Math.sin(rad))
                blurX.set(0)
                blurY.set(0)
                const animate = async () => {
                    const { animate: a } = await import("framer-motion")
                    a(0, bx, {
                        duration: hoverInDuration,
                        ease: "easeOut",
                        onUpdate: (v) => blurX.set(v),
                    })
                    a(0, by, {
                        duration: hoverInDuration,
                        ease: "easeOut",
                        onUpdate: (v) => blurY.set(v),
                    })
                }
                animate()
            } else if (hoverEffect === "bw") {
                const animate = async () => {
                    const { animate: a } = await import("framer-motion")
                    a(1, 0, {
                        duration: hoverInDuration,
                        ease: "easeOut",
                        onUpdate: (v) => saturation.set(v),
                    })
                }
                animate()
            }
        } else {
            if (hoverEffect === "blur") {
                const animate = async () => {
                    const { animate: a } = await import("framer-motion")
                    a(blurX.get(), 0, {
                        duration: hoverOutDuration,
                        ease: "easeOut",
                        onUpdate: (v) => blurX.set(v),
                    })
                    a(blurY.get(), 0, {
                        duration: hoverOutDuration,
                        ease: "easeOut",
                        onUpdate: (v) => blurY.set(v),
                    })
                }
                animate()
            } else if (hoverEffect === "bw") {
                const animate = async () => {
                    const { animate: a } = await import("framer-motion")
                    a(saturation.get(), 1, {
                        duration: hoverOutDuration,
                        ease: "easeOut",
                        onUpdate: (v) => saturation.set(v),
                    })
                }
                animate()
            }
        }
    }, [
        isHovered,
        hoverEffect,
        blurAmount,
        blurAngle,
        hoverInDuration,
        hoverOutDuration,
    ])

    const isRightAligned =
        titlePosition === "top-right" || titlePosition === "bottom-right"

    const titleStyle: CSSProperties = {
        color: titleColor,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        ...(titleFont as CSSProperties),
    }

    const titleBadgeStyle: CSSProperties = titleShowBorder
        ? {
              width: "fit-content",
              maxWidth: "100%",
              borderRadius: titleBorderRadius,
              border: `${titleBorderWidth}px solid ${titleBorderColor}`,
              backgroundColor: titleBorderBackground,
              padding: titlePadding,
              boxSizing: "border-box",
          }
        : {}

    const angleRad = (blurAngle * Math.PI) / 180
    const cosA = Math.abs(Math.cos(angleRad))
    const sinA = Math.abs(Math.sin(angleRad))
    const oversizeFactor =
        hoverEffect === "blur"
            ? Math.max(cosA + sinA * aspectRatio, sinA + cosA * aspectRatio, 1)
            : 1
    const oversizePct = `${oversizeFactor * 100}%`

    const usesFilter = hoverEffect === "blur" || hoverEffect === "bw"

    // Shared style for the title+bar overlay container
    const overlayContainerStyle: CSSProperties = {
        position: "absolute",
        ...(titlePosition === "top-left"
            ? { top: 20, left: 20, right: 5 }
            : {}),
        ...(titlePosition === "top-right"
            ? { top: 20, left: 5, right: 20 }
            : {}),
        ...(titlePosition === "bottom-left"
            ? { bottom: 20, left: 20, right: 5 }
            : {}),
        ...(titlePosition === "bottom-right"
            ? { bottom: 20, left: 5, right: 20 }
            : {}),
        zIndex: 2,
        display: "flex",
        flexDirection: isRightAligned ? "row-reverse" : "row",
        alignItems: "center",
        gap: 5,
    }

    // Shared content for the title+bar overlay (used in both static and animated branches)
    const overlayContent = (
        <>
            {title && (
                <span
                    style={{
                        ...titleStyle,
                        ...titleBadgeStyle,
                        minWidth: 0,
                        flexShrink: 1,
                    }}
                >
                    {title}
                </span>
            )}
            <div
                style={{
                    flex: "1 0 20px",
                    height: 2,
                    borderRadius: 1,
                    position: "relative",
                    overflow: "hidden",
                    transform: isRightAligned ? "scaleX(-1)" : undefined,
                }}
            >
                {/* Track background */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: trackColor,
                        opacity: 0.3,
                    }}
                />
                {/* Animated fill — static: already at 100%; live: animates from 0% */}
                {isStatic ? (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: "100%",
                            borderRadius: 1,
                            background: trackColor,
                        }}
                    />
                ) : (
                    <motion.div
                        key={String(isHovered)}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: trackDuration,
                            ease: "linear",
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            borderRadius: 1,
                            background: trackColor,
                        }}
                    />
                )}
            </div>
        </>
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                paddingBottom: `${(1 / aspectRatio) * 100}%`,
                borderRadius: cornerRadius,
                overflow: "hidden",
                transform: "translateZ(0)",
                cursor: "pointer",
                ...style,
            }}
            // Gate all hover handlers on !isStatic — no animated state updates on canvas
            onMouseEnter={() => !isStatic && !isTouchDevice && setIsHovered(true)}
            onMouseLeave={() => !isStatic && !isTouchDevice && setIsHovered(false)}
            onFocus={() => !isStatic && setIsHovered(true)}
            onBlur={() => !isStatic && setIsHovered(false)}
            tabIndex={0}
            role="button"
            aria-label={title || "Portfolio item"}
        >
            {/* Hidden SVG filter defs */}
            {usesFilter && (
                <svg
                    style={{
                        position: "absolute",
                        width: 0,
                        height: 0,
                        pointerEvents: "none",
                    }}
                    aria-hidden="true"
                >
                    <defs>
                        <filter
                            id={filterId}
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feGaussianBlur
                                ref={feBlurRef}
                                in="SourceGraphic"
                                stdDeviation="0 0"
                                result="blurred"
                            />
                            <feColorMatrix
                                ref={feSatRef}
                                in="blurred"
                                type="saturate"
                                values="1"
                                result="out"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            {/* Absolute fill container */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius: cornerRadius,
                }}
            >
                {/* Image wrapper — rotated for directional blur angle alignment */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: oversizePct,
                        paddingBottom: `calc(${(1 / aspectRatio) * 100}% * ${oversizeFactor})`,
                        transform: `translate(-50%, -50%) rotate(${hoverEffect === "blur" ? blurAngle : 0}deg)`,
                        filter: usesFilter ? `url(#${filterId})` : undefined,
                    }}
                >
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: cropAnchorMap[cropAnchor],
                            display: "block",
                        }}
                        draggable={false}
                    />
                </div>

                {/* Tint overlay — static: plain div at full tintOpacity; live: motion.div */}
                {hoverEffect === "tint" && (
                    isStatic ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: tintColor,
                                opacity: tintOpacity,
                                mixBlendMode: "multiply",
                                pointerEvents: "none",
                            }}
                        />
                    ) : (
                        <motion.div
                            animate={{ opacity: isHovered ? tintOpacity : 0 }}
                            transition={{
                                duration: isHovered
                                    ? hoverInDuration
                                    : hoverOutDuration,
                                ease: "easeOut",
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: tintColor,
                                mixBlendMode: "multiply",
                                pointerEvents: "none",
                            }}
                        />
                    )
                )}

                {/* Title + loading bar
                    Static:  plain div, always visible at opacity 1 (revealed resting state)
                    Live:    AnimatePresence, fades in/out on hover */}
                {isStatic ? (
                    <div style={overlayContainerStyle}>
                        {overlayContent}
                    </div>
                ) : (
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: hoverInDuration,
                                    ease: "easeOut",
                                }}
                                style={overlayContainerStyle}
                            >
                                {overlayContent}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}

addPropertyControls(ImagePortfolioCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["blur", "tint", "bw"],
        optionTitles: ["Directional Blur", "Color Tint", "Black & White"],
        defaultValue: "blur",
        displaySegmentedControl: true,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        hidden: (props) => props.hoverEffect !== "blur",
    },
    blurAngle: {
        type: ControlType.Number,
        title: "Blur Angle",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        hidden: (props) => props.hoverEffect !== "blur",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tint Color",
        defaultValue: "#000000",
        hidden: (props) => props.hoverEffect !== "tint",
    },
    tintOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (props) => props.hoverEffect !== "tint",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Project Name",
        placeholder: "Enter title…",
    },
    titlePosition: {
        type: ControlType.Enum,
        title: "Title Position",
        options: ["top-left", "top-right", "bottom-left", "bottom-right"],
        optionTitles: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
        defaultValue: "bottom-left",
        displaySegmentedControl: false,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
    },
    titleShowBorder: {
        type: ControlType.Boolean,
        title: "Title Badge",
        defaultValue: false,
    },
    titleBorderRadius: {
        type: ControlType.Number,
        title: "Badge Radius",
        defaultValue: 4,
        min: 0,
        max: 32,
        step: 1,
        hidden: (props) => !props.titleShowBorder,
    },
    titleBorderColor: {
        type: ControlType.Color,
        title: "Badge Border",
        defaultValue: "#ffffff",
        hidden: (props) => !props.titleShowBorder,
    },
    titleBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 1,
        hidden: (props) => !props.titleShowBorder,
    },
    titleBorderBackground: {
        type: ControlType.Color,
        title: "Badge Fill",
        defaultValue: "rgba(0,0,0,0.3)",
        hidden: (props) => !props.titleShowBorder,
    },
    titlePadding: {
        type: ControlType.Padding,
        title: "Badge Padding",
        defaultValue: "4px 8px",
        hidden: (props) => !props.titleShowBorder,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#ffffff",
    },
    trackDuration: {
        type: ControlType.Number,
        title: "Bar Duration",
        defaultValue: 2,
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    hoverInDuration: {
        type: ControlType.Number,
        title: "Hover In",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    hoverOutDuration: {
        type: ControlType.Number,
        title: "Hover Out",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect Ratio",
        defaultValue: 1.333,
        min: 0.5,
        max: 3,
        step: 0.01,
    },
    cropAnchor: {
        type: ControlType.Enum,
        title: "Crop Anchor",
        options: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
        ],
        optionTitles: [
            "Center",
            "Top",
            "Bottom",
            "Left",
            "Right",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
        ],
        defaultValue: "center",
    },
})
