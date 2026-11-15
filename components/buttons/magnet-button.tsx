import { useRef, useEffect, useCallback } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type AlignMode = "left" | "center" | "right"

interface MagneticButtonProps {
    label: string
    link: string
    newTab: boolean
    font: CSSProperties
    textColor: string
    background: string
    cornerRadius: number
    paddingX: number
    paddingY: number
    borderWidth: number
    borderColor: string
    strength: number
    radius: number
    textParallax: number
    spring: number
    hoverScale: number
    align: AlignMode
    style?: CSSProperties
}

/**
 * MAGNETIC BUTTON
 *
 * A button that is attracted to the cursor: when the pointer enters an
 * invisible field around it, the button slides toward the cursor like a magnet,
 * and its label drifts a little less for a subtle parallax depth. When the
 * pointer leaves, it springs smoothly back to rest. Optional hover scale.
 *
 * Sizing works with Framer's native Width/Height: set the layer to Fit to size
 * by the label + padding, or Fixed to give it an exact size — the button fills
 * whatever size the layer is.
 *
 * Pure React + requestAnimationFrame — no dependencies, no WebGL. Every
 * property is editable.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 56
 */
export default function MagneticButton(props: MagneticButtonProps) {
    const {
        label,
        link,
        newTab,
        font,
        textColor,
        background,
        cornerRadius,
        paddingX,
        paddingY,
        borderWidth,
        borderColor,
        strength,
        radius,
        textParallax,
        spring,
        hoverScale,
        align,
        style,
    } = props

    const btnRef = useRef<HTMLAnchorElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)

    const target = useRef({ x: 0, y: 0 })
    const current = useRef({ x: 0, y: 0 })
    const hovering = useRef(false)
    const raf = useRef<number>(0)

    const pointerInside = useCallback(
        (e: PointerEvent) => {
            const btn = btnRef.current
            if (!btn) return
            const r = btn.getBoundingClientRect()
            const cx = r.left + r.width / 2
            const cy = r.top + r.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            const dist = Math.hypot(dx, dy)
            const field = Math.max(r.width, r.height) / 2 + Math.max(0, radius)
            if (dist < field) {
                hovering.current = true
                target.current.x = dx * strength
                target.current.y = dy * strength
            } else {
                hovering.current = false
                target.current.x = 0
                target.current.y = 0
            }
        },
        [strength, radius]
    )

    useEffect(() => {
        if (typeof window === "undefined") return
        const onMove = (e: PointerEvent) => pointerInside(e)
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => window.removeEventListener("pointermove", onMove)
    }, [pointerInside])

    useEffect(() => {
        const k = Math.min(Math.max(spring, 0.02), 0.5)
        const tick = () => {
            current.current.x += (target.current.x - current.current.x) * k
            current.current.y += (target.current.y - current.current.y) * k

            const sc = hovering.current ? hoverScale : 1
            if (btnRef.current) {
                btnRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) scale(${sc})`
            }
            if (labelRef.current) {
                const lx = current.current.x * textParallax
                const ly = current.current.y * textParallax
                labelRef.current.style.transform = `translate3d(${lx}px, ${ly}px, 0)`
            }
            raf.current = requestAnimationFrame(tick)
        }
        raf.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf.current)
    }, [spring, hoverScale, textParallax])

    const justifyContent =
        align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start"

    return (
        <a
            ref={btnRef}
            href={link || undefined}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            style={{
                ...style,
                ...font,
                // fill the Framer layer's size; padding sets the Fit size
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent,
                color: textColor,
                background,
                borderRadius: cornerRadius,
                paddingLeft: paddingX,
                paddingRight: paddingX,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                border:
                    borderWidth > 0
                        ? `${borderWidth}px solid ${borderColor}`
                        : "none",
                textDecoration: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                willChange: "transform",
                userSelect: "none",
            }}
        >
            <span ref={labelRef} style={{ willChange: "transform" }}>
                {label}
            </span>
        </a>
    )
}

const defaultProps: MagneticButtonProps = {
    label: "Get Started",
    link: "",
    newTab: false,
    font: { fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 600 },
    textColor: "#ffffff",
    background: "#6C5CE7",
    cornerRadius: 14,
    paddingX: 30,
    paddingY: 16,
    borderWidth: 0,
    borderColor: "rgba(0,0,0,0)",
    strength: 0.4,
    radius: 40,
    textParallax: 0.4,
    spring: 0.15,
    hoverScale: 1.05,
    align: "center",
}

MagneticButton.defaultProps = defaultProps

addPropertyControls(MagneticButton, {
    label: { type: ControlType.String, title: "Label" },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    textColor: { type: ControlType.Color, title: "Text Color" },
    background: { type: ControlType.Color, title: "Background" },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        description: "Used when the layer width is set to Fit.",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        description: "Used when the layer height is set to Fit.",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 8,
        step: 0.5,
        unit: "px",
    },
    borderColor: { type: ControlType.Color, title: "Border Color" },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 1,
        step: 0.05,
        description: "How strongly the button is pulled toward the cursor.",
    },
    radius: {
        type: ControlType.Number,
        title: "Field",
        min: 0,
        max: 200,
        step: 5,
        unit: "px",
        description: "Extra distance around the button where the pull begins.",
    },
    textParallax: {
        type: ControlType.Number,
        title: "Text Parallax",
        min: 0,
        max: 1,
        step: 0.05,
        description: "How much the label drifts relative to the button.",
    },
    spring: {
        type: ControlType.Number,
        title: "Spring",
        min: 0.02,
        max: 0.5,
        step: 0.01,
        description: "Lower = looser/slower spring, higher = snappier.",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.4,
        step: 0.01,
    },
    align: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        description: "Label position when the layer is wider than the text.",
    },
})
