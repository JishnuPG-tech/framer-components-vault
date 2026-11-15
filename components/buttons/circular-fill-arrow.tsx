import * as React from "react"
import { useRef, useState } from "react"
import { motion, animate, useMotionValue } from "framer-motion"
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
 * Circle Fill Button
 * Text on the left, arrow on the right. On hover a circle grows from the
 * cursor entry point (or the centre) until it fills the button. On leave the
 * circle shrinks back into the centre of the button. The arrow rests at a
 * slight angle and straightens on hover.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 64
 */

type IconStyle =
    | "arrow"
    | "longArrow"
    | "chevron"
    | "doubleChevron"
    | "triangle"
    | "arrowCircle"

// The circle is drawn at a fixed base size and scaled with a transform,
// which keeps the animation on the GPU and avoids layout work.
const BASE = 100

function ArrowIcon({
    style,
    size,
    stroke,
}: {
    style: IconStyle
    size: number
    stroke: number
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: stroke,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        style: { display: "block" },
    }

    switch (style) {
        case "longArrow":
            return (
                <svg {...common}>
                    <path d="M2 12h20M16 6l6 6-6 6" />
                </svg>
            )
        case "chevron":
            return (
                <svg {...common}>
                    <path d="M9 5l7 7-7 7" />
                </svg>
            )
        case "doubleChevron":
            return (
                <svg {...common}>
                    <path d="M5 5l7 7-7 7M12 5l7 7-7 7" />
                </svg>
            )
        case "triangle":
            return (
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ display: "block" }}
                >
                    <path d="M7 4.5l13 7.5-13 7.5z" />
                </svg>
            )
        case "arrowCircle":
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M7 12h10M13 8l4 4-4 4" />
                </svg>
            )
        case "arrow":
        default:
            return (
                <svg {...common}>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            )
    }
}

export default function CircleFillButton(props) {
    const {
        text,
        font,
        textColor,
        textHoverColor,
        background,
        fillColor,
        iconStyle,
        iconSize,
        iconStroke,
        iconColor,
        iconHoverColor,
        restAngle,
        fillOrigin,
        padding,
        gap,
        radius,
        border,
        link,
        newTab,
        transition,
        style,
    } = props

    const ref = useRef<HTMLElement>(null)
    const [hovered, setHovered] = useState(false)

    // Circle position (top-left of the base-size circle) and scale
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const scale = useMotionValue(0)

    // True on the Framer canvas and during export
    const isStatic = useIsStaticRenderer()

    const enter = (e?: React.PointerEvent | React.FocusEvent) => {
        const el = ref.current
        if (!el) return
        setHovered(true)

        const rect = el.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        const isHidden = scale.get() < 0.02
        let cx = w / 2
        let cy = h / 2

        if (isHidden) {
            // Fresh entry: start the circle at the cursor (or the centre)
            if (fillOrigin === "cursor" && e && "clientX" in e) {
                cx = Math.min(Math.max(e.clientX - rect.left, 0), w)
                cy = Math.min(Math.max(e.clientY - rect.top, 0), h)
            }
            x.set(cx - BASE / 2)
            y.set(cy - BASE / 2)
            scale.set(0)
        } else {
            // Re-entered while still shrinking: grow from where it is now
            cx = x.get() + BASE / 2
            cy = y.get() + BASE / 2
        }

        // Radius needed to reach the farthest corner from the circle centre
        const radiusNeeded = Math.max(
            Math.hypot(cx, cy),
            Math.hypot(w - cx, cy),
            Math.hypot(cx, h - cy),
            Math.hypot(w - cx, h - cy)
        )
        const target = (radiusNeeded * 2 + 2) / BASE

        animate(scale, target, transition)
    }

    const leave = () => {
        const el = ref.current
        if (!el) return
        setHovered(false)

        const rect = el.getBoundingClientRect()

        // Shrink into the centre of the button
        animate(x, rect.width / 2 - BASE / 2, transition)
        animate(y, rect.height / 2 - BASE / 2, transition)
        animate(scale, 0, transition)
    }

    const linkProps = link
        ? {
              href: link,
              target: newTab ? "_blank" : undefined,
              rel: newTab ? "noopener noreferrer" : undefined,
          }
        : {}

    const containerStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap,
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding,
        background,
        borderRadius: radius,
        ...border,
        overflow: "hidden",
        isolation: "isolate",
        cursor: "pointer",
        textDecoration: "none",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
    }

    // Static renderer (Framer canvas / export): plain styled element in the
    // resting state. No motion components, no pointer handlers, no circle.
    if (isStatic) {
        const StaticTag: any = link ? "a" : "div"

        return (
            <StaticTag {...linkProps} style={containerStyle}>
                <span
                    style={{
                        ...font,
                        color: textColor,
                        whiteSpace: "nowrap",
                        margin: 0,
                    }}
                >
                    {text}
                </span>
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        width: iconSize,
                        height: iconSize,
                        color: iconColor,
                        transform: `rotate(${restAngle}deg)`,
                    }}
                >
                    <ArrowIcon
                        style={iconStyle}
                        size={iconSize}
                        stroke={iconStroke}
                    />
                </span>
            </StaticTag>
        )
    }

    const Tag: any = link ? motion.a : motion.div

    return (
        <Tag
            ref={ref}
            {...linkProps}
            onPointerEnter={enter}
            onPointerLeave={leave}
            onFocus={enter}
            onBlur={leave}
            style={containerStyle}
        >
            {/* Growing / shrinking circle */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: BASE,
                    height: BASE,
                    borderRadius: "50%",
                    background: fillColor,
                    x,
                    y,
                    scale,
                    pointerEvents: "none",
                    willChange: "transform",
                    zIndex: 0,
                }}
            />

            {/* Text (left) */}
            <motion.span
                initial={false}
                animate={{ color: hovered ? textHoverColor : textColor }}
                transition={transition}
                style={{
                    ...font,
                    position: "relative",
                    zIndex: 1,
                    whiteSpace: "nowrap",
                    margin: 0,
                }}
            >
                {text}
            </motion.span>

            {/* Arrow (right) */}
            <motion.span
                initial={false}
                animate={{
                    rotate: hovered ? 0 : restAngle,
                    color: hovered ? iconHoverColor : iconColor,
                }}
                transition={transition}
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    width: iconSize,
                    height: iconSize,
                }}
            >
                <ArrowIcon
                    style={iconStyle}
                    size={iconSize}
                    stroke={iconStroke}
                />
            </motion.span>
        </Tag>
    )
}

CircleFillButton.defaultProps = {
    width: 260,
    height: 64,
}

addPropertyControls(CircleFillButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get in touch",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controlType: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            lineHeight: "1.2em",
            letterSpacing: "-0.01em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#151515",
    },
    textHoverColor: {
        type: ControlType.Color,
        title: "Text Hover",
        defaultValue: "#FFFFFF",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E9E6DF",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#151515",
    },
    fillOrigin: {
        type: ControlType.Enum,
        title: "Grow From",
        options: ["cursor", "center"],
        optionTitles: ["Cursor", "Center"],
        displaySegmentedControl: true,
        defaultValue: "cursor",
    },
    iconStyle: {
        type: ControlType.Enum,
        title: "Icon Style",
        options: [
            "arrow",
            "longArrow",
            "chevron",
            "doubleChevron",
            "triangle",
            "arrowCircle",
        ],
        optionTitles: [
            "Arrow",
            "Long Arrow",
            "Chevron",
            "Double Chevron",
            "Triangle",
            "Arrow in Circle",
        ],
        defaultValue: "arrow",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 8,
        max: 96,
        step: 1,
        unit: "px",
        defaultValue: 22,
    },
    iconStroke: {
        type: ControlType.Number,
        title: "Icon Stroke",
        min: 0.5,
        max: 4,
        step: 0.25,
        defaultValue: 1.75,
        hidden: (props) => props.iconStyle === "triangle",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#151515",
    },
    iconHoverColor: {
        type: ControlType.Color,
        title: "Icon Hover",
        defaultValue: "#FFFFFF",
    },
    restAngle: {
        type: ControlType.Number,
        title: "Rest Angle",
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        defaultValue: -40,
        description:
            "Arrow angle at rest. It rotates to 0° (straight right) on hover. Use a positive value to tilt it downward instead.",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px 24px 0px 28px",
    },
    gap: {
        type: ControlType.Number,
        title: "Min Gap",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "#151515",
        },
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            duration: 0.6,
            ease: [0.65, 0, 0.35, 1],
        },
    },
})
