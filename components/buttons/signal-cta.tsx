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

import { motion, useInView, useReducedMotion } from "framer-motion"

interface SignalButtonProps {
    label?: string
    link?: string
    newTab?: boolean
    disabled?: boolean
    onTap?: () => void
    font?: React.CSSProperties
    fill?: string
    hoverFill?: string
    textColor?: string
    hoverText?: string
    radius?: string
    padding?: string
    shadow?: string
    tags?: {
        enabled?: boolean
        top?: string
        bottom?: string
        fill?: string
        alternate?: string
        text?: string
        cycle?: boolean
        cycleTime?: number
        tilt?: number
        reveal?: number
        radius?: number
        font?: React.CSSProperties
    }
    waves?: {
        enabled?: boolean
        color?: string
        count?: number
        spacing?: number
        size?: number
        thickness?: number
        gap?: number
        opacity?: number
        speed?: number
    }
    motion?: {
        enabled?: boolean
        duration?: number
        hoverScale?: number
        pressScale?: number
        lift?: number
    }
    preview?: "idle" | "hover"
    focusColor?: string
    accessibleLabel?: string
    style?: React.CSSProperties
}

const tagDefaults = {
    enabled: true,
    top: "expires in...",
    bottom: "...8 hours",
    fill: "#FFE34D",
    alternate: "#FFADC7",
    text: "#453A0B",
    cycle: true,
    cycleTime: 2.4,
    tilt: 4,
    reveal: 23,
    radius: 9,
}
const waveDefaults = {
    enabled: true,
    color: "#C8F578",
    count: 4,
    spacing: 10,
    size: 26,
    thickness: 1.4,
    gap: 15,
    opacity: 0.55,
    speed: 1.2,
}
const motionDefaults = {
    enabled: true,
    duration: 0.28,
    hoverScale: 1.045,
    pressScale: 0.97,
    lift: 0,
}

/**
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 56
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SignalButton(props: SignalButtonProps) {
    const {
        label = "Get Offer",
        link = "",
        newTab = false,
        disabled = false,
        font,
        fill = "#D1FA83",
        hoverFill = "#D1FA83",
        textColor = "#172109",
        hoverText = "#172109",
        radius = "16px",
        padding = "16px 32px",
        shadow = "0px 6px 22px rgba(172, 222, 75, 0.12)",
        preview = "idle",
        focusColor = "#FFFFFF",
        accessibleLabel = "",
        style,
        onTap,
    } = props
    const tags = { ...tagDefaults, ...props.tags }
    const waves = { ...waveDefaults, ...props.waves }
    const settings = { ...motionDefaults, ...props.motion }
    const root = React.useRef<HTMLDivElement>(null)
    const inView = useInView(root)
    const staticRenderer = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [pressed, setPressed] = React.useState(false)
    const active =
        !disabled &&
        (staticRenderer ? preview === "hover" : hovered || focused || pressed)
    const animate = settings.enabled && !reduceMotion && !staticRenderer
    const repeating = animate && inView && active
    const duration = animate ? settings.duration : 0
    const count = Math.max(1, Math.min(6, Math.round(waves.count)))
    const extent = waves.size + (count - 1) * waves.spacing + 8
    const Tag = link && !disabled ? motion.a : motion.button
    const tagFont: React.CSSProperties = {
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "1em",
        letterSpacing: "0.04em",
        ...tags.font,
    }
    return (
        <div
            ref={root}
            style={{
                width: "max-content",
                height: "auto",
                ...style,
                position: "relative",
                overflow: "visible",
                isolation: "isolate",
                opacity: disabled ? 0.45 : 1,
            }}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
                animate={{
                    scale: active && animate ? settings.hoverScale : 1,
                    y: active && animate ? -settings.lift : 0,
                }}
                transition={{ duration }}
            >
                {tags.enabled &&
                    [true, false].map((top) => (
                        <motion.span
                            key={top ? "top" : "bottom"}
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                y: active
                                    ? top
                                        ? -tags.reveal
                                        : tags.reveal
                                    : 0,
                                rotate: active ? tags.tilt : 0,
                                opacity: active ? 1 : 0,
                                backgroundColor:
                                    repeating && tags.cycle
                                        ? [tags.fill, tags.alternate, tags.fill]
                                        : tags.fill,
                            }}
                            transition={{
                                duration,
                                ease: [0.22, 1, 0.36, 1],
                                backgroundColor: {
                                    duration: Math.max(0.4, tags.cycleTime),
                                    repeat:
                                        repeating && tags.cycle ? Infinity : 0,
                                    ease: "easeInOut",
                                },
                            }}
                            style={{
                                ...tagFont,
                                position: "absolute",
                                zIndex: 0,
                                pointerEvents: "none",
                                [top ? "top" : "bottom"]: 0,
                                [top ? "left" : "right"]: "5%",
                                maxWidth: "90%",
                                boxSizing: "border-box",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                padding: "9px 13px",
                                borderRadius: tags.radius,
                                color: tags.text,
                                background: tags.fill,
                            }}
                        >
                            {top ? tags.top : tags.bottom}
                        </motion.span>
                    ))}
                {waves.enabled &&
                    [0, 1, 2, 3].map((corner) => (
                        <svg
                            key={corner}
                            aria-hidden="true"
                            width={extent}
                            height={extent}
                            viewBox={`0 0 ${extent} ${extent}`}
                            style={{
                                position: "absolute",
                                pointerEvents: "none",
                                overflow: "visible",
                                zIndex: 0,
                                ...(corner % 2
                                    ? { right: -waves.gap }
                                    : { left: -waves.gap }),
                                ...(corner < 2
                                    ? { top: -waves.gap }
                                    : { bottom: -waves.gap }),
                                transform: `scale(${corner % 2 ? -1 : 1}, ${corner < 2 ? 1 : -1})`,
                                transformOrigin: "center",
                            }}
                        >
                            {Array.from({ length: count }, (_, i) => {
                                const offset = i * waves.spacing
                                return (
                                    <motion.path
                                        key={i}
                                        d={`M ${waves.size} 0 Q 0 0 0 ${waves.size}`}
                                        fill="none"
                                        stroke={waves.color}
                                        strokeWidth={waves.thickness}
                                        strokeLinecap="round"
                                        initial={false}
                                        style={{
                                            filter: `blur(${i * 0.55}px)`,
                                            transformBox: "fill-box",
                                            transformOrigin: "100% 100%",
                                        }}
                                        animate={{
                                            x: active ? -offset : 0,
                                            y: active ? -offset : 0,
                                            opacity:
                                                i === 0
                                                    ? waves.opacity
                                                    : active
                                                      ? repeating
                                                          ? [
                                                                0.06,
                                                                waves.opacity *
                                                                    (1 -
                                                                        i /
                                                                            (count +
                                                                                1)),
                                                                0.06,
                                                            ]
                                                          : waves.opacity *
                                                            (1 -
                                                                i / (count + 1))
                                                      : 0,
                                        }}
                                        transition={{
                                            x: { duration },
                                            y: { duration },
                                            opacity:
                                                repeating && i > 0
                                                    ? {
                                                          duration: Math.max(
                                                              0.3,
                                                              waves.speed
                                                          ),
                                                          delay: i * 0.1,
                                                          repeat: Infinity,
                                                          ease: "easeInOut",
                                                      }
                                                    : { duration },
                                        }}
                                    />
                                )
                            })}
                        </svg>
                    ))}
                <Tag
                    {...(link && !disabled
                        ? {
                              href: staticRenderer ? undefined : link,
                              target: newTab ? "_blank" : undefined,
                              rel: newTab ? "noopener noreferrer" : undefined,
                          }
                        : { type: "button" as const, disabled })}
                    aria-label={accessibleLabel || label}
                    aria-disabled={disabled || undefined}
                    onHoverStart={() => setHovered(true)}
                    onHoverEnd={() => setHovered(false)}
                    onFocus={(event) =>
                        setFocused(
                            event.currentTarget.matches(":focus-visible")
                        )
                    }
                    onBlur={() => {
                        setFocused(false)
                        setPressed(false)
                    }}
                    onTapStart={() => setPressed(true)}
                    onTapCancel={() => setPressed(false)}
                    onTap={() => setPressed(false)}
                    onClick={(event) => {
                        if (disabled || staticRenderer) {
                            event.preventDefault()
                            return
                        }
                        onTap?.()
                    }}
                    initial={false}
                    animate={{
                        backgroundColor: active ? hoverFill : fill,
                        color: active ? hoverText : textColor,
                        scale: pressed && animate ? settings.pressScale : 1,
                    }}
                    transition={{ duration }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxSizing: "border-box",
                        width: "100%",
                        height: "100%",
                        minHeight: 44,
                        margin: 0,
                        border: 0,
                        padding,
                        borderRadius: radius,
                        background: fill,
                        color: textColor,
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.12), rgba(0,0,0,0.04))",
                        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.45)${shadow && shadow !== "none" ? `, ${shadow}` : ""}`,
                        cursor: disabled ? "not-allowed" : "pointer",
                        textDecoration: "none",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        outline: focused ? `2px solid ${focusColor}` : "none",
                        outlineOffset: 5,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 18,
                        fontWeight: 600,
                        lineHeight: "1em",
                        ...font,
                    }}
                >
                    <span style={{ whiteSpace: "nowrap" }}>{label}</span>
                </Tag>
            </motion.div>
        </div>
    )
}

addPropertyControls(SignalButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Offer",
    },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => !p.link,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            lineHeight: "1em",
            letterSpacing: "-0.02em",
        },
    },
    fill: { type: ControlType.Color, title: "Fill", defaultValue: "#D1FA83" },
    hoverFill: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#D1FA83",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#172109",
    },
    hoverText: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#172109",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 32px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 6px 22px rgba(172, 222, 75, 0.12)",
    },
    tags: {
        type: ControlType.Object,
        title: "Labels",
        icon: "object",
        defaultValue: tagDefaults,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            top: {
                type: ControlType.String,
                title: "Top",
                defaultValue: "expires in...",
            },
            bottom: {
                type: ControlType.String,
                title: "Bottom",
                defaultValue: "...8 hours",
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: tagDefaults.fill,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: tagDefaults.text,
            },
            cycle: {
                type: ControlType.Boolean,
                title: "Color Cycle",
                defaultValue: true,
            },
            alternate: {
                type: ControlType.Color,
                title: "Second Color",
                defaultValue: tagDefaults.alternate,
                hidden: (p) => !p.cycle,
            },
            cycleTime: {
                type: ControlType.Number,
                title: "Cycle Time",
                defaultValue: 2.4,
                min: 0.4,
                max: 10,
                step: 0.1,
                unit: "s",
                hidden: (p) => !p.cycle,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: 4,
                min: -20,
                max: 20,
                step: 1,
                unit: "°",
            },
            reveal: {
                type: ControlType.Number,
                title: "Reveal",
                defaultValue: 23,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 9,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "monospace",
                defaultValue: {
                    fontSize: "12px",
                    lineHeight: "1em",
                    letterSpacing: "0.04em",
                },
            },
        },
    },
    waves: {
        type: ControlType.Object,
        title: "Waves",
        icon: "effect",
        defaultValue: waveDefaults,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: waveDefaults.color,
            },
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: 4,
                min: 1,
                max: 6,
                step: 1,
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 10,
                min: 2,
                max: 20,
                step: 1,
                unit: "px",
            },
            size: {
                type: ControlType.Number,
                title: "Curve Size",
                defaultValue: 26,
                min: 8,
                max: 50,
                step: 1,
                unit: "px",
            },
            thickness: {
                type: ControlType.Number,
                title: "Stroke",
                defaultValue: 1.4,
                min: 0.5,
                max: 5,
                step: 0.1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 15,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.55,
                min: 0,
                max: 1,
                step: 0.05,
            },
            speed: {
                type: ControlType.Number,
                title: "Pulse Time",
                defaultValue: 1.2,
                min: 0.3,
                max: 5,
                step: 0.1,
                unit: "s",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        defaultValue: motionDefaults,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Animate",
                defaultValue: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.28,
                min: 0.05,
                max: 1,
                step: 0.01,
                unit: "s",
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                defaultValue: 1.045,
                min: 0.9,
                max: 1.2,
                step: 0.005,
            },
            pressScale: {
                type: ControlType.Number,
                title: "Press Scale",
                defaultValue: 0.97,
                min: 0.8,
                max: 1,
                step: 0.01,
            },
            lift: {
                type: ControlType.Number,
                title: "Lift",
                defaultValue: 0,
                min: 0,
                max: 15,
                step: 1,
                unit: "px",
            },
        },
    },
    preview: {
        type: ControlType.Enum,
        title: "Canvas",
        options: ["idle", "hover"],
        optionTitles: ["Idle", "Hover"],
        defaultValue: "idle",
        displaySegmentedControl: true,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#FFFFFF",
    },
    accessibleLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "",
        description:
            "Optional screen-reader label; defaults to the button text. Include essential offer details here.",
    },
    onTap: { type: ControlType.EventHandler, title: "On Tap" },
})
