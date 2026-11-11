/**
 * BackToTop Code Component (Framer)
 *
 * A customizable back-to-top button for Framer sites.
 * - Single default export (BackToTop)
 * - Drag & drop friendly: visible in canvas when Always Show = true
 * - Toggle Fixed = true to pin bottom-right/left/center for preview/publish
 * - Shapes: circle, rounded, square
 * - Icons: arrow, chevron, caret, double, rocket (points upward)
 * - Hover, border, shadow, pulse, scroll speed, and transition type options
 * - Polished UI: hover scale, smooth transitions, accessibility features
 * - Usage: Place in canvas, adjust props in properties panel, enable Fixed for live sites
 */

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

import { createPortal } from "react-dom"

// ----- Types -----
type Placement = "bottom-right" | "bottom-left" | "bottom-center"
type Shape = "circle" | "rounded" | "square"
type IconName = "arrow" | "chevron" | "caret" | "double" | "rocket"
type ScrollType = "instant" | "smooth"

interface Props {
    size: number
    shape: Shape
    icon: IconName
    fill: string
    iconColor: string
    hoverFill: string
    hoverIconColor: string
    borderColor: string
    borderWidth: number
    shadow: boolean
    pulse: boolean
    showAfter: number
    alwaysShow: boolean
    fixed: boolean
    placement: Placement
    sideOffset: number
    bottom: number
    speedMs: number
    showOnMobile: boolean
    scrollType: ScrollType
}

// ----- Helpers -----
const isClient = () =>
    typeof window !== "undefined" && typeof document !== "undefined"
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function useRAFScrollProgress() {
    const [progress, setProgress] = React.useState(0)
    const tickingRef = React.useRef(false)

    React.useEffect(() => {
        if (!isClient()) return

        function update() {
            const docHeight = Math.max(
                document.documentElement.scrollHeight - window.innerHeight,
                0
            )
            const top = window.scrollY || window.pageYOffset
            setProgress(docHeight > 0 ? clamp01(top / docHeight) : 0)
            tickingRef.current = false
        }
        function onScroll() {
            if (tickingRef.current) return
            tickingRef.current = true
            requestAnimationFrame(update)
        }
        update()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [])

    return progress
}

function scrollToTopDuration(duration = 600) {
    if (!isClient()) return
    const start = window.scrollY || window.pageYOffset
    const startTime = performance.now()
    function step(now: number) {
        const t = Math.min(1, (now - startTime) / duration)
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        window.scrollTo(0, Math.round(start * (1 - eased)))
        if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
}

// ----- Icons -----
function Icon({
    name,
    color,
    size,
}: {
    name: IconName
    color: string
    size: number
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    } as any
    switch (name) {
        case "arrow":
            return (
                <svg {...common}>
                    <path d="M12 19V5" />
                    <path d="M6.5 10.5L12 5l5.5 5.5" />
                </svg>
            )
        case "chevron":
            return (
                <svg {...common}>
                    <path d="M6 14l6-6 6 6" />
                </svg>
            )
        case "caret":
            return (
                <svg {...common} stroke="none" fill={color}>
                    <path d="M12 6l6 12H6l6-12z" />
                </svg>
            )
        case "double":
            return (
                <svg {...common} strokeWidth="1.6">
                    <path d="M6 14l6-6 6 6" />
                    <path d="M6 20l6-6 6 6" />
                </svg>
            )
        case "rocket":
            return (
                <svg {...common} viewBox="-5 -5 34 34">
                    <g transform="rotate(-45 12 12)">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                        <circle cx="13.5" cy="10.5" r="1" />
                    </g>
                </svg>
            )
        default:
            return null
    }
}

// ----- Component -----
export default function BackToTop(inProps: Partial<Props>) {
    // Props with defaults
    const props: Props = {
        size: inProps.size ?? 56,
        shape: inProps.shape ?? "circle",
        icon: inProps.icon ?? "arrow",
        fill: inProps.fill ?? "#2979FF",
        iconColor: inProps.iconColor ?? "#ffffff",
        hoverFill: inProps.hoverFill ?? "#3E8BFF",
        hoverIconColor:
            inProps.hoverIconColor ?? inProps.iconColor ?? "#ffffff",
        borderColor: inProps.borderColor ?? "rgba(0,0,0,0.06)",
        borderWidth: inProps.borderWidth ?? 1,
        shadow: inProps.shadow ?? true,
        pulse: inProps.pulse ?? false,
        showAfter: inProps.showAfter ?? 0.25,
        alwaysShow: inProps.alwaysShow ?? true,
        fixed: inProps.fixed ?? false,
        placement: inProps.placement ?? "bottom-right",
        sideOffset: inProps.sideOffset ?? 24,
        bottom: inProps.bottom ?? 24,
        speedMs: inProps.speedMs ?? 600,
        showOnMobile: inProps.showOnMobile ?? false,
        scrollType: inProps.scrollType ?? "smooth",
    }

    const progress = useRAFScrollProgress()
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(
        isClient() ? window.innerWidth <= 768 : false
    )

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const client = isClient()
    const scrolledEnough = progress >= clamp01(props.showAfter)
    const visible =
        isCanvas || client
            ? props.alwaysShow
                ? true
                : scrolledEnough && (props.showOnMobile || !isMobile)
            : true

    // Handle window resize for mobile detection
    React.useEffect(() => {
        if (!client) return
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [client])

    // Inject pulse keyframes only when needed
    React.useEffect(() => {
        if (
            !client ||
            !props.pulse ||
            document.getElementById("axen-btt-pulse-ks")
        )
            return
        const style = document.createElement("style")
        style.id = "axen-btt-pulse-ks"
        style.innerHTML = `@keyframes axen-btt-pulse { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }`
        document.head.appendChild(style)
        return () => style.remove()
    }, [client, props.pulse])

    // Styles
    const borderRadius =
        props.shape === "circle"
            ? "50%"
            : props.shape === "rounded"
              ? "12px"
              : "0px"
    const bgColor = hovered ? props.hoverFill : props.fill
    const iColor = hovered ? props.hoverIconColor : props.iconColor
    const size = Math.max(32, Math.min(320, props.size))
    const svgSize = size * 0.45

    const baseStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius,
        background: bgColor,
        border:
            props.borderWidth > 0
                ? `${props.borderWidth}px solid ${props.borderColor}`
                : "none",
        boxShadow: props.shadow
            ? focused
                ? "0 0 0 3px rgba(66, 153, 225, 0.5), 0 10px 30px rgba(2,6,23,0.12)"
                : "0 10px 30px rgba(2,6,23,0.12)"
            : focused
              ? "0 0 0 3px rgba(66, 153, 225, 0.5)"
              : "none",
        cursor: "pointer",
        transition:
            "background 0.18s ease, transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        userSelect: "none",
        zIndex: 99999,
        WebkitTapHighlightColor: "transparent",
        position: props.fixed && !isCanvas ? "fixed" : "relative",
        right:
            props.fixed && !isCanvas && props.placement === "bottom-right"
                ? `${props.sideOffset}px`
                : undefined,
        left:
            props.fixed && !isCanvas && props.placement === "bottom-left"
                ? `${props.sideOffset}px`
                : props.fixed &&
                    !isCanvas &&
                    props.placement === "bottom-center"
                  ? "50%"
                  : undefined,
        bottom: props.fixed && !isCanvas ? `${props.bottom}px` : undefined,
        transform: `${props.fixed && !isCanvas && props.placement === "bottom-center" ? "translateX(-50%) " : ""}${
            hovered ? "scale(1.05)" : "scale(1)"
        }`,
        boxSizing: "border-box",
        animation:
            props.pulse && visible && !hovered
                ? "axen-btt-pulse 1.6s ease-in-out infinite"
                : undefined,
        outline: "none",
    }

    // Event handlers
    const handleClick = () => {
        if (props.scrollType === "instant") {
            if (isClient()) window.scrollTo({ top: 0, behavior: "instant" })
        } else {
            scrollToTopDuration(props.speedMs)
        }
    }

    // Render
    const button = (
        <button
            type="button"
            aria-label="Scroll to top"
            title="Scroll to top"
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={baseStyle}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Icon name={props.icon} color={iColor} size={svgSize} />
            </div>
        </button>
    )

    if (!client && props.fixed) return null
    if (props.fixed && !isCanvas && document.body)
        return createPortal(button, document.body)
    return button
}

// ----- Property Controls -----
addPropertyControls(BackToTop as any, {
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 56,
        min: 32,
        max: 320,
        description:
            "Adjust button size (32-320px); use 48-64 for optimal visibility.",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "rounded", "square"],
        optionTitles: ["Circle", "Rounded", "Square"],
        defaultValue: "circle",
        description:
            "Select button shape; circle for a modern, soft appearance.",
    },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["arrow", "chevron", "caret", "double", "rocket"],
        optionTitles: ["Arrow", "Chevron", "Caret", "Double", "Rocket"],
        defaultValue: "arrow",
        description: "Choose icon; arrow for classic, rocket for playful vibe.",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#2979FF",
        description: "Set button background color; ensure icon contrast.",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
        description: "Set icon color; choose high contrast with fill.",
    },
    hoverFill: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#3E8BFF",
        description: "Set hover background; use a shade shift for feedback.",
    },
    hoverIconColor: {
        type: ControlType.Color,
        title: "Hover Icon Color",
        defaultValue: "#FFFFFF",
        description: "Set icon color on hover; maintain visibility.",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(0,0,0,0.06)",
        description: "Set border color; use subtle tones for outline.",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        description: "Set border thickness (0-8px); 0 removes border.",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        description: "Toggle shadow; enable for depth, disable for flat look.",
    },
    pulse: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: false,
        description: "Enable pulsing animation to attract attention.",
    },
    showAfter: {
        type: ControlType.Number,
        title: "Show After",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description:
            "Show button after scrolling (0-1); e.g., 0.25 = 25% down.",
    },
    alwaysShow: {
        type: ControlType.Boolean,
        title: "Always Show",
        defaultValue: true,
        description: "Keep visible in canvas; disable to show only on scroll.",
    },
    fixed: {
        type: ControlType.Boolean,
        title: "Fixed",
        defaultValue: false,
        description: "Pin button to viewport; enable for live sites.",
    },
    placement: {
        type: ControlType.Enum,
        title: "Placement",
        options: ["bottom-right", "bottom-left", "bottom-center"],
        optionTitles: ["Bottom Right", "Bottom Left", "Bottom Center"],
        defaultValue: "bottom-right",
        description: "Set fixed position; bottom-right is standard.",
    },
    sideOffset: {
        type: ControlType.Number,
        title: "Side Offset",
        defaultValue: 24,
        description: "Set horizontal edge spacing (px); adjust for layout.",
    },
    bottom: {
        type: ControlType.Number,
        title: "Bottom Offset",
        defaultValue: 24,
        description: "Set vertical bottom spacing (px); avoid footer overlap.",
    },
    speedMs: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 600,
        min: 100,
        max: 3000,
        description:
            "Set scroll duration (100-3000ms); lower for faster scroll.",
    },
    showOnMobile: {
        type: ControlType.Boolean,
        title: "Show on Mobile",
        defaultValue: false,
        description: "Show on mobile (≤768px); test for touch UX.",
    },
    scrollType: {
        type: ControlType.Enum,
        title: "Scroll Type",
        options: ["instant", "smooth"],
        optionTitles: ["Instant", "Smooth"],
        defaultValue: "smooth",
        description: "Choose instant (jump to top) or smooth (gradual scroll).",
    },
})
