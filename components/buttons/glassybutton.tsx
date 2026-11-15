// GlassyButton: A glassmorphic button with animated highlight/reflection, hover effect, and configurable light direction
import { useState, useMemo, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface GlassyButtonProps {
    label: string
    background: string
    textColor: string
    borderRadius: number
    blur: number
    lightDirection: "top-left" | "top" | "top-right" | "right" | "bottom-right" | "bottom" | "bottom-left" | "left"
    font: any
    hoverBackground: string // ADDED
    link?: string // ADDED
    shadowHoverColor?: string // ADDED
    shadowHoverIntensity?: number // ADDED
    style?: CSSProperties
}

/**
 * GlassyButton
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 48
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GlassyButton(props: GlassyButtonProps) {
    const {
        label,
        background,
        textColor,
        borderRadius,
        blur,
        lightDirection,
        font,
        style,
        link,
        shadowHoverColor = "#0000002D",
        shadowHoverIntensity = 1,
    } = props
    const isStatic = useIsStaticRenderer()
    const [hovered, setHovered] = useState(false)
    const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

    // Light direction mapping to gradient angles and highlight positions
    const lightMap = {
        "top-left": { angle: 135, x: "10%", y: "10%" },
        "top": { angle: 180, x: "50%", y: "8%" },
        "top-right": { angle: 225, x: "90%", y: "10%" },
        "right": { angle: 270, x: "92%", y: "50%" },
        "bottom-right": { angle: 315, x: "90%", y: "90%" },
        "bottom": { angle: 0, x: "50%", y: "92%" },
        "bottom-left": { angle: 45, x: "10%", y: "90%" },
        "left": { angle: 90, x: "8%", y: "50%" },
    }
    const { angle, x, y } = lightMap[lightDirection]

    // Mouse move handler for light following
    const handleMouseMove = useCallback(
        (e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            // Use pageX/pageY for better accuracy in Framer canvas
            let clientX, clientY
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX
                clientY = e.touches[0].clientY
            } else {
                clientX = e.clientX
                clientY = e.clientY
            }
            // Calculate mouse position relative to center for light direction
            const x = (clientX - rect.left) / rect.width
            const y = (clientY - rect.top) / rect.height
            startTransition(() => setMouse({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }))
        },
        [],
    )

    // Highlight and reflection styles
    const highlightStyle = useMemo(() => {
        // Parallax offset for highlight
        // Light follows mouse: direction is from center to mouse
        const dx = mouse.x - 0.5
        const dy = mouse.y - 0.5
        const offsetX = dx * (hovered ? 28 : 16)
        const offsetY = dy * (hovered ? 28 : 16)
        return {
            position: "absolute" as const,
            left: `calc(${x} + ${offsetX}px)`,
            top: `calc(${y} + ${offsetY + (hovered ? -4 : 0)}px)`,
            width: hovered ? "74%" : "60%",
            height: hovered ? "42%" : "30%",
            background: hovered
                ? "linear-gradient(120deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 100%)"
                : "linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 100%)",
            borderRadius: "50%",
            filter: `blur(${hovered ? 22 : 14}px)`,
            opacity: hovered ? 0.82 : 0.5,
            pointerEvents: "none" as const,
            transform: `translate(-50%, -50%) scale(${hovered ? 1.13 : 1})` + (hovered ? " translateY(-2.5px)" : ""),
            transition: "all 0.32s cubic-bezier(.4,0,.2,1)",
            zIndex: 2,
        }
    }, [x, y, hovered, mouse])

    const reflectionStyle = useMemo(() => {
        // Parallax offset for reflection
        // Reflection follows mouse, but with smaller offset
        const dx = mouse.x - 0.5
        const dy = mouse.y - 0.5
        const offsetX = dx * (hovered ? 16 : 8)
        const offsetY = dy * (hovered ? 16 : 8)
        return {
            position: "absolute" as const,
            left: `calc(${x} + ${offsetX}px)`,
            top: `calc(${y} + ${offsetY}px)`,
            width: hovered ? "38%" : "30%",
            height: hovered ? "18%" : "14%",
            background: "linear-gradient(120deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)",
            borderRadius: "50%",
            filter: `blur(${hovered ? 10 : 7}px)`,
            opacity: hovered ? 0.45 : 0.28,
            pointerEvents: "none" as const,
            transform: `translate(-50%, -50%) scale(${hovered ? 1.12 : 1})` + (hovered ? " translateY(-1px)" : ""),
            transition: "all 0.32s cubic-bezier(.4,0,.2,1)",
            zIndex: 1,
        }
    }, [x, y, hovered, mouse])

    // Glassy background style
    const glassStyle: CSSProperties = useMemo(() => ({
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius,
        background: `linear-gradient(${angle}deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%), ${hovered ? props.hoverBackground : background}`,
        boxShadow: hovered
            ? `0 18px ${48 * shadowHoverIntensity}px 0 ${shadowHoverColor}, 0 6px 24px 0 rgba(0,0,0,0.12)`
            : "0 6px 18px 0 rgba(0,0,0,0.10)",
        backdropFilter: `blur(${blur}px) saturate(1.2)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(1.2)`,
        border: "1.5px solid rgba(255,255,255,0.22)",
        boxSizing: "border-box",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.32s cubic-bezier(.4,0,.2,1), background 0.32s cubic-bezier(.4,0,.2,1), transform 0.32s cubic-bezier(.4,0,.2,1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: hovered ? "translateY(-11px) scale(1.08)" : "none",
        ...style,
    }), [angle, background, borderRadius, blur, hovered, style, props.hoverBackground, shadowHoverColor, shadowHoverIntensity])

    // Text style
    const textStyle: CSSProperties = useMemo(() => ({
        color: textColor,
        zIndex: 3,
        userSelect: "none",
        ...font,
        fontWeight: font?.variant === "Bold" ? 700 : undefined,
        fontSize: font?.fontSize,
        letterSpacing: font?.letterSpacing,
        lineHeight: font?.lineHeight,
        textAlign: font?.textAlign,
        fontStyle: font?.fontStyle,
        fontFamily: font?.fontFamily,
        minWidth: "max-content",
        width: "max-content",
        pointerEvents: "none",
        transition: "color 0.22s cubic-bezier(.4,0,.2,1)",
    }), [textColor, font])

    // Accessibility: role=button, tabIndex=0
    const content = (
        <div
            style={glassStyle}
            role="button"
            tabIndex={0}
            aria-label={label}
            onMouseEnter={isStatic ? undefined : () => startTransition(() => setHovered(true))}
            onMouseLeave={isStatic ? undefined : (e => {
                startTransition(() => setMouse({ x: 0.5, y: 0.5 }))
                startTransition(() => setHovered(false))
            })}
            onFocus={isStatic ? undefined : () => startTransition(() => setHovered(true))}
            onBlur={isStatic ? undefined : () => startTransition(() => setHovered(false))}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onTouchMove={isStatic ? undefined : handleMouseMove}
        >
            <div style={highlightStyle} />
            <div style={reflectionStyle} />
            <span style={textStyle}>{label}</span>
            {/* Borders for glassy look */}
            <div style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                borderRadius,
                border: "1.5px solid rgba(255,255,255,0.22)",
                boxShadow: "inset 0 1.5px 8px 0 rgba(255,255,255,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.06)",
                zIndex: 4,
            }} />
        </div>
    )
    return link ? (
        <a href={link} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }} tabIndex={-1} aria-label={label}>
            {content}
        </a>
    ) : content
}

addPropertyControls(GlassyButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Glassy Button",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF33",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 48,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 18,
        min: 4,
        max: 32,
        step: 1,
    },
    lightDirection: {
        type: ControlType.Enum,
        title: "Light Dir",
        options: [
            "top-left",
            "top",
            "top-right",
            "right",
            "bottom-right",
            "bottom",
            "bottom-left",
            "left",
        ],
        optionTitles: [
            "Top Left",
            "Top",
            "Top Right",
            "Right",
            "Bottom Right",
            "Bottom",
            "Bottom Left",
            "Left",
        ],
        defaultValue: "top-left",
        displaySegmentedControl: false,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    link: {
        type: ControlType.Link,
        title: "Button Link",
        defaultValue: "",
    },
    // --- Hover group ---
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#FFFFFF66",
    },
    shadowHoverColor: {
        type: ControlType.Color,
        title: "Hover Shadow",
        defaultValue: "#0000002D",
    },
    shadowHoverIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 1,
        min: 0.5,
        max: 2.5,
        step: 0.05,
    },
})