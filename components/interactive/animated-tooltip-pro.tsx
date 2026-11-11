import * as React from "react"
import { createPortal } from "react-dom"
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
 * Animated Tooltip
 * Hover on desktop, tap/click on touch devices.
 * Animation is pure CSS; state only decides when it is open.
 * Renders in a portal so parent frames never clip it.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 24
 */

type Placement = "top" | "bottom" | "left" | "right"

const EASE = "cubic-bezier(0.625, 0.05, 0, 1)"
const BASE_DURATION = 0.35
const OFFSET = 18 // gap between popup and trigger
const SLIDE = 10 // px travelled while fading in
const START_SCALE = 0.9
const ARROW_W = 28
const ARROW_H = ARROW_W * (26 / 70)

const CSS = `
.osmo-tt{position:relative;display:inline-flex;align-items:center;outline:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.osmo-tt__anchor{pointer-events:none}
.osmo-tt__tip{
  position:relative;box-sizing:border-box;
  opacity:0;visibility:hidden;
  transform:var(--tt-hidden);
  transform-origin:var(--tt-origin);
  transition:
    opacity var(--tt-dur) var(--tt-ease),
    transform var(--tt-dur) var(--tt-ease),
    visibility 0s linear var(--tt-dur);
  will-change:opacity,transform;
}
.osmo-tt__tip[data-open="true"]{
  opacity:1;visibility:visible;transform:none;
  transition:
    opacity var(--tt-dur) var(--tt-ease),
    transform var(--tt-dur) var(--tt-ease),
    visibility 0s;
}
@media (prefers-reduced-motion:reduce){
  .osmo-tt__tip{transform:none !important;transition-duration:.01s !important}
}
`

interface Props {
    triggerText: string
    title: string
    body: string
    speed: number
    fonts: {
        triggerFont: React.CSSProperties
        titleFont: React.CSSProperties
        bodyFont: React.CSSProperties
    }
    colors: {
        triggerColor: string
        iconColor: string
        background: string
        titleColor: string
        bodyColor: string
    }
    layout: {
        placement: Placement
        maxWidth: number
        radius: number
        padding: string
        contentGap: number
        iconSize: number
        iconGap: number
    }
    style?: React.CSSProperties
}

export default function AnimatedTooltippro(props: Props) {
    const { triggerText, title, body, speed, style } = props
    const { triggerFont, titleFont, bodyFont } = props.fonts
    const { triggerColor, iconColor, background, titleColor, bodyColor } =
        props.colors
    const {
        placement,
        maxWidth,
        radius,
        padding,
        contentGap,
        iconSize,
        iconGap,
    } = props.layout

    const isStatic = useIsStaticRenderer()
    const tipId = "osmo-tt-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = React.useRef<HTMLDivElement>(null)
    const pointerType = React.useRef("mouse")

    const [hover, setHover] = React.useState(false)
    const [tapped, setTapped] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)
    const [shown, setShown] = React.useState(false)
    const [pos, setPos] = React.useState<[number, number]>([0, 0])

    // Static renderer (thumbnails, exports): no interaction, no popup, no transitions.
    const open = !isStatic && (hover || tapped || focused)
    const canPortal = !isStatic && typeof document !== "undefined"

    const measure = React.useCallback(() => {
        const r = rootRef.current?.getBoundingClientRect()
        if (!r) return
        setPos(
            {
                top: [r.left + r.width / 2, r.top],
                bottom: [r.left + r.width / 2, r.bottom],
                left: [r.left, r.top + r.height / 2],
                right: [r.right, r.top + r.height / 2],
            }[placement] as [number, number]
        )
    }, [placement])

    // Mount hidden first, then flip to shown on the next frames so the transition plays.
    React.useEffect(() => {
        let raf1 = 0
        let raf2 = 0
        if (open) {
            measure()
            if (!mounted) {
                setMounted(true)
                raf1 = requestAnimationFrame(() => {
                    raf2 = requestAnimationFrame(() => setShown(true))
                })
            } else {
                setShown(true)
            }
        } else {
            setShown(false)
        }
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
        }
    }, [open, mounted, measure])

    // Keep the tooltip glued to the trigger while open.
    React.useEffect(() => {
        if (!open) return
        window.addEventListener("scroll", measure, true)
        window.addEventListener("resize", measure)
        return () => {
            window.removeEventListener("scroll", measure, true)
            window.removeEventListener("resize", measure)
        }
    }, [open, measure])

    // Touch: tapping elsewhere closes.
    React.useEffect(() => {
        if (!tapped) return
        const onDown = (e: PointerEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setTapped(false)
        }
        document.addEventListener("pointerdown", onDown)
        return () => document.removeEventListener("pointerdown", onDown)
    }, [tapped])

    // ---------- geometry ----------
    const isVertical = placement === "top" || placement === "bottom"
    const dir = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[
        placement
    ]
    const origin = {
        top: "50% 100%",
        bottom: "50% 0%",
        left: "100% 50%",
        right: "0% 50%",
    }[placement]

    const pad: React.CSSProperties = {
        top: { paddingBottom: OFFSET },
        bottom: { paddingTop: OFFSET },
        left: { paddingRight: OFFSET },
        right: { paddingLeft: OFFSET },
    }[placement]

    const anchorStyle: React.CSSProperties = {
        position: "fixed",
        left: pos[0],
        top: pos[1],
        width: "max-content",
        maxWidth: `min(${maxWidth}px, 90vw)`,
        zIndex: 9999,
        ...pad,
        transform: {
            top: "translate(-50%, -100%)",
            bottom: "translate(-50%, 0)",
            left: "translate(-100%, -50%)",
            right: "translate(0, -50%)",
        }[placement],
    }

    // Arrow sits on the side facing the trigger, centered on the popup.
    const arrowStyle: React.CSSProperties = {
        position: "absolute",
        pointerEvents: "none",
        display: "block",
        ...(placement === "top" && {
            top: "100%",
            left: "50%",
            width: ARROW_W,
            height: ARROW_H,
            marginLeft: -ARROW_W / 2,
            marginTop: -0.5,
        }),
        ...(placement === "bottom" && {
            bottom: "100%",
            left: "50%",
            width: ARROW_W,
            height: ARROW_H,
            marginLeft: -ARROW_W / 2,
            marginBottom: -0.5,
            transform: "rotate(180deg)",
        }),
        ...(placement === "left" && {
            left: "100%",
            top: "50%",
            width: ARROW_H,
            height: ARROW_W,
            marginTop: -ARROW_W / 2,
            marginLeft: -0.5,
        }),
        ...(placement === "right" && {
            right: "100%",
            top: "50%",
            width: ARROW_H,
            height: ARROW_W,
            marginTop: -ARROW_W / 2,
            marginRight: -0.5,
        }),
    }
    const arrowViewBox = isVertical ? "0 0 70 26" : "0 0 26 70"
    const arrowPath = {
        top: "M0 0 L27 22 Q35 30 43 22 L70 0 Z",
        bottom: "M0 0 L27 22 Q35 30 43 22 L70 0 Z",
        left: "M0 0 L22 27 Q30 35 22 43 L0 70 Z",
        right: "M26 0 L4 27 Q-4 35 4 43 L26 70 Z",
    }[placement]

    const duration = isStatic ? 0 : BASE_DURATION / Math.max(0.1, speed)

    const cssVars = {
        "--tt-dur": `${duration}s`,
        "--tt-ease": EASE,
        "--tt-hidden": `translate(${dir[0] * SLIDE}px, ${dir[1] * SLIDE}px) scale(${START_SCALE})`,
        "--tt-origin": origin,
    } as React.CSSProperties

    const tooltip = (
        <div className="osmo-tt__anchor" style={{ ...cssVars, ...anchorStyle }}>
            <div
                id={tipId}
                role="tooltip"
                className="osmo-tt__tip"
                data-open={shown}
                style={{
                    background,
                    borderRadius: radius,
                    padding,
                    display: "flex",
                    flexDirection: "column",
                    gap: contentGap,
                    textAlign: "left",
                    whiteSpace: "normal",
                }}
            >
                {title && (
                    <div style={{ margin: 0, color: titleColor, ...titleFont }}>
                        {title}
                    </div>
                )}
                {body && (
                    <div style={{ margin: 0, color: bodyColor, ...bodyFont }}>
                        {body}
                    </div>
                )}
                <svg
                    style={arrowStyle}
                    viewBox={arrowViewBox}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path d={arrowPath} fill={background} />
                </svg>
            </div>
        </div>
    )

    return (
        <div
            ref={rootRef}
            className="osmo-tt"
            tabIndex={0}
            aria-describedby={tipId}
            onPointerDown={(e) => {
                pointerType.current = e.pointerType
            }}
            onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHover(true)
            }}
            onPointerLeave={() => setHover(false)}
            onClick={() => {
                if (pointerType.current === "touch") setTapped((t) => !t)
            }}
            onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) setFocused(true)
            }}
            onBlur={() => setFocused(false)}
            style={{
                ...style,
                color: triggerColor,
                cursor: "pointer",
                gap: iconGap,
                width: "max-content",
                ...triggerFont,
            }}
        >
            <style>{CSS}</style>

            <span style={{ whiteSpace: "nowrap" }}>{triggerText}</span>

            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                style={{ flexShrink: 0, display: "block", color: iconColor }}
            >
                <circle
                    cx="8"
                    cy="8"
                    r="7.1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                />
                <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
                <path
                    d="M6.6 7.2H8.6V11.3H9.6V12.2H6.5V11.3H7.5V8.1H6.6V7.2Z"
                    fill="currentColor"
                />
            </svg>

            {canPortal && mounted && createPortal(tooltip, document.body)}
        </div>
    )
}

AnimatedTooltippro.defaultProps = {
    triggerText: "What's included?",
    title: "Everything in Pro, on us",
    body: "Try every feature free for 14 days, including unlimited projects and team sharing. Cancel anytime from your settings, no questions asked.",
    speed: 1,
    fonts: {},
    colors: {
        triggerColor: "#0A2F2A",
        iconColor: "#FFB020",
        background: "#0E7C66",
        titleColor: "#FFFFFF",
        bodyColor: "#D4F5EA",
    },
    layout: {
        placement: "top",
        maxWidth: 430,
        radius: 16,
        padding: "32px",
        contentGap: 12,
        iconSize: 24,
        iconGap: 10,
    },
}

addPropertyControls(AnimatedTooltippro, {
    triggerText: {
        type: ControlType.String,
        title: "Trigger",
        defaultValue: "What's included?",
    },
    title: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Everything in Pro, on us",
    },
    body: {
        type: ControlType.String,
        title: "Body",
        displayTextArea: true,
        defaultValue:
            "Try every feature free for 14 days, including unlimited projects and team sharing. Cancel anytime from your settings, no questions asked.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.05,
        displayStepper: true,
    },

    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            triggerFont: {
                type: ControlType.Font,
                title: "Trigger",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "24px",
                    lineHeight: "1.4em",
                    fontWeight: 600,
                },
            },
            titleFont: {
                type: ControlType.Font,
                title: "Heading",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "26px",
                    lineHeight: "1.25em",
                    letterSpacing: "-0.02em",
                    fontWeight: 700,
                },
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "18px", lineHeight: "1.5em" },
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            triggerColor: {
                type: ControlType.Color,
                title: "Trigger",
                defaultValue: "#0A2F2A",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: "#FFB020",
            },
            background: {
                type: ControlType.Color,
                title: "Popup BG",
                defaultValue: "#0E7C66",
            },
            titleColor: {
                type: ControlType.Color,
                title: "Heading",
                defaultValue: "#FFFFFF",
            },
            bodyColor: {
                type: ControlType.Color,
                title: "Body",
                defaultValue: "#D4F5EA",
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            placement: {
                type: ControlType.Enum,
                title: "Position",
                options: ["top", "bottom", "left", "right"],
                optionTitles: ["Top", "Bottom", "Left", "Right"],
                defaultValue: "top",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max width",
                defaultValue: 430,
                min: 120,
                max: 800,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 16,
                min: 0,
                max: 48,
                unit: "px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "32px",
            },
            contentGap: {
                type: ControlType.Number,
                title: "Heading gap",
                defaultValue: 12,
                min: 0,
                max: 40,
                unit: "px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon size",
                defaultValue: 24,
                min: 8,
                max: 48,
                unit: "px",
            },
            iconGap: {
                type: ControlType.Number,
                title: "Icon gap",
                defaultValue: 10,
                min: 0,
                max: 32,
                unit: "px",
            },
        },
    },
})
