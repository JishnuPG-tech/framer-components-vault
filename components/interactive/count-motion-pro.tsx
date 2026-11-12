// Count Motion Pro - Premium animated counter/stat card component for Framer
// Marketplace-ready React + TypeScript component with full customization
// Supports SaaS, agency, portfolio, startup, marketing, business, landing pages, dashboards, and stat sections
//
// @version 1.0.0
// @author Framer Component Developer
// @license MIT
//
// Browser Compatibility: Modern browsers with ES6+ support, IntersectionObserver, and requestAnimationFrame
// Performance: Optimized for multiple instances, uses RAF for smooth animations, respects prefers-reduced-motion
// Known Limitations: Maximum safe integer range (Number.MAX_SAFE_INTEGER), auto duration capped at 60 seconds
//
// Usage Examples:
// <CountMotionPro from={0} to={100} suffix="%" />
// <CountMotionPro from={0} to={1000} prefix="$" separator="comma" />
// <CountMotionPro from={0} to={432} super={true} superText="+" title={true} titleText="Projects" />
// <CountMotionPro from={0} to={999} icon={true} image={{src: "icon.png"}} iconPosition="left" />
// <CountMotionPro from={0} to={50000} prefix="$" separator="comma" decimals={2} card={true} shadow={true} />
//
// Changelog:
// v1.0.0 - Initial release with full feature set, accessibility support, and performance optimizations
//
// @framerDisableUnlink - Prevents unlinking from master component to preserve property controls

import { useEffect, useRef, useMemo, useState, startTransition, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, animate } from "framer-motion"

// Constants
const MILLISECONDS_PER_SECOND = 1000
const DEFAULT_MARGIN = 4
const INTERSECTION_THRESHOLD = 0.1 // Trigger animation when 10% of component is visible
const DOUBLE_DIGIT_THRESHOLD = 10 // Threshold for leading zero logic
const MAX_AUTO_DURATION = 60000 // Maximum auto animation duration in milliseconds (60 seconds)

// Alignment mappings
const ALIGNMENT_MAP = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
} as const

// TypeScript interface for Framer font control values
interface FontControlValue {
    fontSize?: string
    variant?: string
    fontWeight?: number
    fontStyle?: string
    letterSpacing?: string
    lineHeight?: string
    fontFamily?: string
    textAlign?: "left" | "center" | "right"
}

interface CountMotionProProps {
    content: {
        from: number
        to: number
        prefix: string
        suffix: string
        super: boolean
        superText: string
        superX: number
        superY: number
        superSize: number
        title: boolean
        titleText: string
    }
    layout: {
        direction: "vertical" | "horizontal"
        verticalPosition: "top" | "bottom"
        horizontalPosition: "left" | "right"
        align: "start" | "center" | "end"
        gap: number
        icon: boolean
        image: { src: string; alt?: string }
        iconPositionVertical: "top" | "bottom"
        iconPositionHorizontal: "left" | "right"
        iconSize: number
        iconGap: number
    }
    font: {
        numberFont: FontControlValue
        titleFont: FontControlValue
        prefixSize: FontControlValue
        suffixSize: FontControlValue
    }
    format: {
        separator: "none" | "comma" | "dot" | "space" | "underscore" | "apostrophe"
        decimals: number
        leadingZero: boolean
    }
    duration: "auto" | "custom"
    time: number
    easing: "linear" | "easeIn" | "easeOut" | "easeInOut"
    delay: number
    replay: "once" | "replay"
    theme: {
        prefixColor: string
        suffixColor: string
        superColor: string
        numberColor: string
        titleColor: string
    }
    style?: CSSProperties
}

/**
 * Count Motion Pro
 * 
 * Premium animated counter component with full customization.
 * Perfect for stats, achievements, metrics, and KPI displays.
 *
 * Features:
 * - Smooth counting animations with customizable easing
 * - Number formatting with separators and decimals
 * - Prefix/suffix support for currency and units
 * - Superscript text for indicators
 * - Optional title/label
 * - Icon/image support
 * - Card styling with borders and shadows
 * - Fully responsive and accessible
 * - Respects prefers-reduced-motion
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CountMotionPro(props: CountMotionProProps) {
    const {
        content = {
            from: 0,
            to: 1234.8,
            prefix: "$",
            suffix: "K",
            super: true,
            superText: "+",
            superX: 1,
            superY: -38,
            superSize: 48,
            title: true,
            titleText: "Revenue Generated",
        },
        layout = {
            direction: "vertical",
            verticalPosition: "top",
            horizontalPosition: "left",
            align: "center",
            gap: 20,
            icon: false,
            image: { 
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
                alt: "Icon" 
            },
            iconPositionVertical: "top",
            iconPositionHorizontal: "left",
            iconSize: 64,
            iconGap: 16,
        },
        font = {
            numberFont: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
            titleFont: {
                fontSize: "32px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            prefixSize: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
            suffixSize: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
        },
        format = {
            separator: "comma",
            decimals: 1,
            leadingZero: false,
        },
        duration = "auto",
        time = 2,
        easing = "easeOut",
        delay = 0.2,
        replay = "once",
        theme = {
            prefixColor: "#7700FF",
            suffixColor: "#0073FF",
            superColor: "#8BFF3D",
            numberColor: "#FFFFFF",
            titleColor: "#C4C4C4",
        },
        style,
    } = props

    const {
        from,
        to,
        prefix,
        suffix,
        superText,
        superX,
        superY,
        superSize,
        titleText,
    } = content

    // Derive show/hide from text content instead of toggles
    const showSuper = superText && superText !== ""
    const showTitle = titleText && titleText !== ""

    const {
        direction,
        verticalPosition,
        horizontalPosition,
        align,
        gap,
        icon,
        image,
        iconPositionVertical,
        iconPositionHorizontal,
        iconSize,
        iconGap,
    } = layout

    const { separator, decimals, leadingZero } = format

    const { prefixSize, suffixSize } = font

    const containerRef = useRef<HTMLDivElement>(null)
    const isMountedRef = useRef(true)
    const [displayValue, setDisplayValue] = useState(from)

    const isStatic = useIsStaticRenderer()

    // Cleanup on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Use Framer Motion's useInView hook
    const isInView = useInView(containerRef, {
        once: replay === "once",
        amount: INTERSECTION_THRESHOLD,
    })

    // Check for reduced motion preference with fallback for older browsers
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === "undefined") return false
        if (!window.matchMedia) return false
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }, [])

    /**
     * Format number with separator and decimal handling
     * Handles edge cases: NaN, Infinity, scientific notation, large numbers
     */
    const formatNumber = useCallback(
        (value: number): string => {
            try {
                // Validate input - handle NaN, Infinity, and invalid numbers
                if (!isFinite(value) || isNaN(value)) {
                    return "0"
                }

                // Clamp decimals to valid range
                const safeDecimals = Math.max(0, Math.min(6, Math.floor(decimals)))

                const fixedValue = value.toFixed(safeDecimals)
                const [integerPart, decimalPart] = fixedValue.split(".")

                let formattedInteger = integerPart

                // Apply separator for numbers >= 1000
                if (separator !== "none" && Math.abs(parseFloat(integerPart)) >= 1000) {
                    const separatorChar =
                        separator === "comma"
                            ? ","
                            : separator === "dot"
                            ? "."
                            : separator === "space"
                            ? " "
                            : separator === "underscore"
                            ? "_"
                            : separator === "apostrophe"
                            ? "'"
                            : ""

                    const isNegative = integerPart.startsWith("-")
                    const absoluteInteger = isNegative ? integerPart.slice(1) : integerPart

                    formattedInteger = absoluteInteger.replace(/\B(?=(\d{3})+(?!\d))/g, separatorChar)

                    if (isNegative) {
                        formattedInteger = "-" + formattedInteger
                    }
                }

                // Apply leading zero for single digits
                if (
                    leadingZero &&
                    Math.abs(parseFloat(integerPart)) < DOUBLE_DIGIT_THRESHOLD &&
                    Math.abs(parseFloat(integerPart)) >= 0
                ) {
                    const isNegative = formattedInteger.startsWith("-")
                    if (isNegative) {
                        formattedInteger = "-0" + formattedInteger.slice(1)
                    } else {
                        formattedInteger = "0" + formattedInteger
                    }
                }

                // Add decimal part if needed
                if (safeDecimals > 0 && decimalPart) {
                    return `${formattedInteger}.${decimalPart}`
                }

                return formattedInteger
            } catch (error) {
                console.error("Format error:", error)
                return "0"
            }
        },
        [separator, decimals, leadingZero]
    )

    const formattedNumber = useMemo(() => formatNumber(displayValue), [displayValue, formatNumber])

    // Animation logic using Framer Motion
    useEffect(() => {
        // Show final value immediately for static renderer or reduced motion
        if (isStatic || prefersReducedMotion) {
            setDisplayValue(to)
            return
        }

        // Skip animation if from === to
        if (from === to) {
            setDisplayValue(to)
            return
        }

        // Only animate when in view
        if (!isInView) {
            // Reset to start value when out of view in replay mode
            if (replay === "replay") {
                setDisplayValue(from)
            }
            return
        }

        // Calculate animation duration
        const rawDuration = duration === "auto" ? Math.abs(to - from) * 20 : time * MILLISECONDS_PER_SECOND
        const animationDuration = duration === "auto" ? Math.min(rawDuration, MAX_AUTO_DURATION) : rawDuration

        // Map easing names to Framer Motion easing functions
        const easingMap = {
            linear: [0, 0, 1, 1],
            easeIn: [0.42, 0, 1, 1],
            easeOut: [0, 0, 0.58, 1],
            easeInOut: [0.42, 0, 0.58, 1],
        } as const

        // Use Framer Motion's animate function
        const controls = animate(from, to, {
            duration: animationDuration / 1000, // Convert to seconds
            ease: easingMap[easing],
            delay: delay,
            onUpdate: (value) => {
                if (isMountedRef.current) {
                    startTransition(() => {
                        setDisplayValue(value)
                    })
                }
            },
            onComplete: () => {
                if (isMountedRef.current) {
                    startTransition(() => {
                        setDisplayValue(to)
                    })
                }
            },
        })

        // Cleanup function
        return () => {
            controls.stop()
        }
    }, [from, to, duration, time, easing, delay, isInView, replay, isStatic, prefersReducedMotion])

    // Layout calculations
    const isVertical = direction === "vertical"
    const position = isVertical ? verticalPosition : horizontalPosition
    const numberFirst = (isVertical && position === "top") || (!isVertical && position === "left")
    
    // Determine icon position based on direction
    const iconPosition = isVertical ? iconPositionVertical : iconPositionHorizontal

    const justifyContent = ALIGNMENT_MAP[align]
    const alignItems = ALIGNMENT_MAP[align]

    // Memoized styles
    const containerStyle = useMemo<CSSProperties>(
        () => ({
            ...style,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: alignItems,
            justifyContent: justifyContent,
            boxSizing: "border-box",
            overflow: "visible",
        }),
        [style, alignItems, justifyContent]
    )

    const numberRowStyle = useMemo<CSSProperties>(
        () => ({
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: justifyContent,
            gap: 0,
            position: "relative",
            flexWrap: "wrap",
            minWidth: "max-content",
        }),
        [justifyContent]
    )

    const numberStyle = useMemo<CSSProperties>(
        () => ({
            ...font.numberFont,
            color: theme.numberColor,
            position: "relative",
            display: "inline-block",
        }),
        [font.numberFont, theme.numberColor]
    )

    const superStyle = useMemo<CSSProperties>(
        () => ({
            position: "absolute",
            top: superY,
            left: `calc(100% + ${superX}px)`,
            fontSize: superSize,
            color: theme.superColor,
            fontFamily: font.numberFont?.fontFamily || "inherit",
            fontWeight: font.numberFont?.fontWeight || "inherit",
            lineHeight: 1,
        }),
        [superY, superX, superSize, theme.superColor, font.numberFont]
    )

    const prefixStyle = useMemo<CSSProperties>(
        () => ({
            ...prefixSize,
            color: theme.prefixColor,
            marginRight: DEFAULT_MARGIN,
        }),
        [prefixSize, theme.prefixColor]
    )

    const suffixStyle = useMemo<CSSProperties>(
        () => ({
            ...suffixSize,
            color: theme.suffixColor,
            marginLeft: DEFAULT_MARGIN,
        }),
        [suffixSize, theme.suffixColor]
    )

    const titleStyle = useMemo<CSSProperties>(
        () => ({
            ...font.titleFont,
            color: theme.titleColor,
            textAlign: align === "start" ? "left" : align === "end" ? "right" : "center",
            width: "100%",
        }),
        [font.titleFont, theme.titleColor, align]
    )

    const counterContentStyle = useMemo<CSSProperties>(
        () => ({
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: isVertical ? alignItems : "center",
            justifyContent: justifyContent,
            gap: gap,
            width: isVertical ? "100%" : "auto",
            minWidth: 0,
        }),
        [isVertical, alignItems, justifyContent, gap]
    )

    const iconStyle = useMemo<CSSProperties>(
        () => ({
            width: iconSize,
            height: iconSize,
            objectFit: "cover",
            flexShrink: 0,
        }),
        [iconSize]
    )

    const mainContentWrapperStyle = useMemo<CSSProperties>(
        () => ({
            display: "flex",
            flexDirection:
                iconPosition === "top"
                    ? "column"
                    : iconPosition === "bottom"
                    ? "column-reverse"
                    : iconPosition === "left"
                    ? "row"
                    : "row-reverse",
            alignItems: alignItems,
            justifyContent: justifyContent,
            gap: iconGap,
            width: "100%",
            minWidth: 0,
        }),
        [iconPosition, alignItems, justifyContent, iconGap]
    )

    // Number row component
    const numberRow = (
        <div style={numberRowStyle}>
            {prefix && <span style={prefixStyle}>{prefix}</span>}
            <span style={numberStyle}>
                {formattedNumber}
                {showSuper && superText && <span style={superStyle}>{superText}</span>}
            </span>
            {suffix && <span style={suffixStyle}>{suffix}</span>}
        </div>
    )

    // Title component
    const titleElement = showTitle && <div style={titleStyle}>{titleText}</div>

    // Counter content
    const counterContent = (
        <div style={counterContentStyle}>
            {numberFirst ? (
                <>
                    {numberRow}
                    {titleElement}
                </>
            ) : (
                <>
                    {titleElement}
                    {numberRow}
                </>
            )}
        </div>
    )

    // Icon component with validation
    const iconElement = icon && image?.src ? (
        <img 
            src={image.src} 
            alt={image?.alt || "Icon"} 
            style={iconStyle} 
        />
    ) : null

    // Main content with icon
    const mainContent = iconElement ? (
        <div style={mainContentWrapperStyle}>
            {iconElement}
            {counterContent}
        </div>
    ) : (
        counterContent
    )

    // ARIA label - only announce final value to avoid noise during animation
    const ariaLabel = useMemo(() => {
        // Only announce when animation is complete
        const shouldAnnounce = isStatic || prefersReducedMotion || displayValue === to
        if (!shouldAnnounce) return "Counter animating"
        
        return `Counter: ${formatNumber(to)}${prefix ? ` ${prefix}` : ""}${suffix ? ` ${suffix}` : ""}${showTitle ? `, ${titleText}` : ""}`
    }, [isStatic, prefersReducedMotion, displayValue, to, prefix, suffix, showTitle, titleText, formatNumber])

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            role="status"
            aria-label={ariaLabel}
            aria-live="polite"
            aria-busy={displayValue !== to}
        >
            {mainContent}
        </div>
    )
}

// Set display name for debugging
CountMotionPro.displayName = "Count Motion Pro"

addPropertyControls(CountMotionPro, {
    // ========== Content Controls ==========
    content: {
        type: ControlType.Object,
        title: "Content",
        description: "Set the counter value, prefix/suffix text, superscript, and title content",
        controls: {
            from: {
                type: ControlType.Number,
                title: "From",
                description: "The number animation starts from this value",
                defaultValue: 0,
                step: 1,
                displayStepper: true,
            },
            to: {
                type: ControlType.Number,
                title: "To",
                description: "The final number shown after animation completes. Enter decimal values (e.g., 432.8) and use the Decimals control in Format to set how many decimal places to display.",
                defaultValue: 1234.8,
                step: 0.1,
                displayStepper: true,
            },
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: "$",
                placeholder: "$, €, +",
                preventLocalization: true,
            },
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: "K",
                placeholder: "K, M, %, ms",
                preventLocalization: true,
            },
            superText: {
                type: ControlType.String,
                title: "Super Text",
                description: "Small raised text beside the number",
                defaultValue: "+",
                preventLocalization: true,
            },
            superX: {
                type: ControlType.Number,
                title: "Super X",
                defaultValue: 1,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                hidden: (props) => !props.superText || props.superText === "",
            },
            superY: {
                type: ControlType.Number,
                title: "Super Y",
                defaultValue: -38,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
                hidden: (props) => !props.superText || props.superText === "",
            },
            superSize: {
                type: ControlType.Number,
                title: "Super Size",
                defaultValue: 48,
                min: 8,
                max: 100,
                step: 1,
                unit: "px",
                hidden: (props) => !props.superText || props.superText === "",
            },
            title: {
                type: ControlType.Boolean,
                title: "Title",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: () => true,
            },
            titleText: {
                type: ControlType.String,
                title: "Title Text",
                defaultValue: "Revenue Generated",
                displayTextArea: true,
            },
        },
        defaultValue: {
            from: 0,
            to: 1234.8,
            prefix: "$",
            suffix: "K",
            superText: "+",
            superX: 1,
            superY: -38,
            superSize: 48,
            title: true,
            titleText: "Revenue Generated",
        },
    },

    // ========== Layout Controls ==========
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Control the counter direction, number position, alignment, and spacing",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                description: "Choose vertical or horizontal layout",
                options: ["vertical", "horizontal"],
                optionTitles: ["↕", "↔"],
                defaultValue: "vertical",
                displaySegmentedControl: true,
            },
            verticalPosition: {
                type: ControlType.Enum,
                title: "Position",
                description: "Choose where the number appears relative to the title",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
                hidden: (props) => props.direction !== "vertical",
            },
            horizontalPosition: {
                type: ControlType.Enum,
                title: "Position",
                description: "Choose where the number appears relative to the title",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                hidden: (props) => props.direction !== "horizontal",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                description: "Align the counter content to the start, center, or end",
                options: ["start", "center", "end"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between the number row and title",
                defaultValue: 20,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            icon: {
                type: ControlType.Boolean,
                title: "Icon",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: (props) => !props.icon,
            },
            iconPositionVertical: {
                type: ControlType.Enum,
                title: "Icon Position",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
                hidden: (props) => !props.icon || props.direction !== "vertical",
            },
            iconPositionHorizontal: {
                type: ControlType.Enum,
                title: "Icon Position",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                hidden: (props) => !props.icon || props.direction !== "horizontal",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 64,
                min: 16,
                max: 200,
                step: 1,
                unit: "px",
                hidden: (props) => !props.icon,
            },
            iconGap: {
                type: ControlType.Number,
                title: "Icon Gap",
                defaultValue: 16,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                hidden: (props) => !props.icon,
            },
        },
        defaultValue: {
            direction: "vertical",
            verticalPosition: "top",
            horizontalPosition: "left",
            align: "center",
            gap: 20,
            icon: false,
            image: { src: "", alt: "" },
            iconPositionVertical: "top",
            iconPositionHorizontal: "left",
            iconSize: 64,
            iconGap: 16,
        },
    },

    // ========== Theme Controls ==========
    theme: {
        type: ControlType.Object,
        title: "Theme",
        description: "Customize colors for the number, title, prefix, suffix, and superscript",
        controls: {
            numberColor: {
                type: ControlType.Color,
                title: "Number",
                defaultValue: "#FFFFFF",
            },
            prefixColor: {
                type: ControlType.Color,
                title: "Prefix",
                defaultValue: "#7700FF",
            },
            suffixColor: {
                type: ControlType.Color,
                title: "Suffix",
                defaultValue: "#0073FF",
            },
            superColor: {
                type: ControlType.Color,
                title: "Super",
                defaultValue: "#8BFF3D",
                hidden: (props, rootProps) => {
                    const content = rootProps?.content
                    if (content) {
                        return !content.superText || content.superText === ""
                    }
                    return false
                },
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#C4C4C4",
                hidden: (props, rootProps) => {
                    const content = rootProps?.content
                    if (content) {
                        return !content.titleText || content.titleText === ""
                    }
                    return false
                },
            },
        },
        defaultValue: {
            numberColor: "#FFFFFF",
            prefixColor: "#7700FF",
            suffixColor: "#0073FF",
            superColor: "#8BFF3D",
            titleColor: "#C4C4C4",
        },
    },

    // ========== Font Controls ==========
    font: {
        type: ControlType.Object,
        title: "Font",
        description: "Adjust typography for the number, title, prefix, suffix, and superscript",
        controls: {
            numberFont: {
                type: ControlType.Font,
                title: "Number",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "92px",
                    variant: "Regular",
                    letterSpacing: "-0.04em",
                    lineHeight: "1em",
                },
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "32px",
                    variant: "Regular",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
                hidden: (props, rootProps) => {
                    const content = rootProps?.content
                    if (content) {
                        return !content.titleText || content.titleText === ""
                    }
                    return false
                },
            },
            prefixSize: {
                type: ControlType.Font,
                title: "Prefix Size",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "92px",
                    variant: "Regular",
                    letterSpacing: "-0.04em",
                    lineHeight: "1em",
                },
                hidden: (props, rootProps) => {
                    // Try to access content from rootProps (nested object pattern)
                    const content = rootProps?.content
                    if (content) {
                        return !content.prefix || content.prefix === ""
                    }
                    // Fallback: if rootProps doesn't have content, assume visible
                    return false
                },
            },
            suffixSize: {
                type: ControlType.Font,
                title: "Suffix Size",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "92px",
                    variant: "Regular",
                    letterSpacing: "-0.04em",
                    lineHeight: "1em",
                },
                hidden: (props, rootProps) => {
                    // Try to access content from rootProps (nested object pattern)
                    const content = rootProps?.content
                    if (content) {
                        return !content.suffix || content.suffix === ""
                    }
                    // Fallback: if rootProps doesn't have content, assume visible
                    return false
                },
            },
        },
        defaultValue: {
            numberFont: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
            titleFont: {
                fontSize: "32px",
                variant: "Regular",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
            },
            prefixSize: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
            suffixSize: {
                fontSize: "92px",
                variant: "Regular",
                letterSpacing: "-0.04em",
                lineHeight: "1em",
            },
        },
    },

    // ========== Number Format Controls ==========
    format: {
        type: ControlType.Object,
        title: "Format",
        description: "Choose separator style, decimals, and leading zero formatting",
        controls: {
            separator: {
                type: ControlType.Enum,
                title: "Separator",
                description: "Choose how large numbers are separated",
                options: ["none", "comma", "dot", "space", "underscore", "apostrophe"],
                optionTitles: ["None", "Comma", "Dot", "Space", "Underscore", "Apostrophe"],
                defaultValue: "none",
            },
            decimals: {
                type: ControlType.Number,
                title: "Decimals",
                description: "Number of decimal places to display (0-6). Works with decimal values in the 'To' field. Example: To=432.8 with Decimals=1 shows '432.8'",
                defaultValue: 0,
                min: 0,
                max: 6,
                step: 1,
                displayStepper: true,
            },
            leadingZero: {
                type: ControlType.Boolean,
                title: "Leading Zero",
                description: "Adds a zero before decimal values below 1",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
        defaultValue: {
            separator: "comma",
            decimals: 1,
            leadingZero: false,
        },
    },

    // ========== Animation Controls ==========
    duration: {
        type: ControlType.Enum,
        title: "Duration",
        description: "Choose automatic or custom animation speed",
        options: ["auto", "custom"],
        optionTitles: ["Auto", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    time: {
        type: ControlType.Number,
        title: "Time",
        description: "Custom animation duration in seconds",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.duration !== "custom",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        description: "Select how the counter animation moves from start to finish",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "easeOut",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        description: "Add a short wait before the animation starts after entering the viewport",
        defaultValue: 0.2,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    replay: {
        type: ControlType.Enum,
        title: "Replay",
        description: "Choose whether the animation plays once or replays when visible again",
        options: ["once", "replay"],
        optionTitles: ["Once", "Replay"],
        defaultValue: "once",
        displaySegmentedControl: true,
    },
})