import { useRef, useEffect, useState, startTransition } from "react"
import type { CSSProperties, MouseEventHandler } from "react"
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
type CaseMode = "none" | "uppercase"

interface MagneticButtonProps {
    label: string
    link: string
    newTab: boolean
    font: CSSProperties
    textCase: CaseMode
    textColor: string
    background: string
    hoverTextColor: string
    hoverBackground: string
    blur: number
    cornerRadius: number
    padding: string
    borderWidth: number
    borderColor: string
    strength: number
    radius: number
    textParallax: number
    spring: number
    hoverScale: number
    align: AlignMode
    onClick?: MouseEventHandler<HTMLAnchorElement>
    style?: CSSProperties
}

/**
 * MAGNETIC BUTTON
 *
 * Pulled toward the cursor when it comes near, with the label drifting a
 * little further for parallax depth. Springs back to rest on leave.
 * Fit sizes to label + padding; Fixed fills the layer.
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 53
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MagneticButton(props: MagneticButtonProps) {
    const {
        label,
        link,
        newTab,
        font,
        textCase,
        textColor,
        background,
        hoverTextColor,
        hoverBackground,
        blur,
        cornerRadius,
        padding,
        borderWidth,
        borderColor,
        strength,
        radius,
        textParallax,
        spring,
        hoverScale,
        align,
        onClick,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const href = link ? link.trim() : ""

    // Framer's Link routes internal pages in-app (no full reload), so the
    // page transition can cover the page before the next one renders
    const wrapLink = (anchor: JSX.Element) =>
        href && !isStatic ? (
            <Link href={href} openInNewTab={newTab}>
                {anchor}
            </Link>
        ) : (
            anchor
        )

    // The wrapper never moves, so its rect is a stable reference for the
    // magnetic field. Measuring the moving button would feed back into itself.
    const wrapRef = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLAnchorElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)

    const target = useRef({ x: 0, y: 0, s: 1 })
    const current = useRef({ x: 0, y: 0, s: 1 })
    const raf = useRef(0)
    const [hovered, setHovered] = useState(false)
    const hoveredRef = useRef(false)
    // Keyboard focus gets a visible ring; a mouse click does not
    const [focusRing, setFocusRing] = useState(false)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        // Skip the effect on touch devices and for reduced-motion users
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
        if (reduced.matches || !fine.matches) return

        const k = Math.min(Math.max(spring, 0.02), 0.5)

        const render = () => {
            const c = current.current
            if (btnRef.current) {
                btnRef.current.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.s})`
            }
            if (labelRef.current) {
                labelRef.current.style.transform = `translate3d(${c.x * textParallax}px, ${c.y * textParallax}px, 0)`
            }
        }

        // Runs only while moving; stops once settled to save battery
        const tick = () => {
            const c = current.current
            const t = target.current
            c.x += (t.x - c.x) * k
            c.y += (t.y - c.y) * k
            c.s += (t.s - c.s) * k
            const settled =
                Math.abs(t.x - c.x) < 0.05 &&
                Math.abs(t.y - c.y) < 0.05 &&
                Math.abs(t.s - c.s) < 0.0005
            if (settled) {
                c.x = t.x
                c.y = t.y
                c.s = t.s
                render()
                raf.current = 0
                return
            }
            render()
            raf.current = requestAnimationFrame(tick)
        }

        const wake = () => {
            if (!raf.current) raf.current = requestAnimationFrame(tick)
        }

        const setHover = (next: boolean) => {
            if (hoveredRef.current === next) return
            hoveredRef.current = next
            startTransition(() => setHovered(next))
        }

        const onMove = (e: PointerEvent) => {
            const wrap = wrapRef.current
            if (!wrap) return
            const r = wrap.getBoundingClientRect()
            // Distance from the pointer to the button's edge (0 when inside)
            const ox = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
            const oy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
            const inField = Math.hypot(ox, oy) <= Math.max(0, radius)
            const t = target.current
            if (inField) {
                t.x = (e.clientX - (r.left + r.width / 2)) * strength
                t.y = (e.clientY - (r.top + r.height / 2)) * strength
                t.s = hoverScale
            } else {
                t.x = 0
                t.y = 0
                t.s = 1
            }
            setHover(inField)
            wake()
        }

        const onLeave = () => {
            target.current = { x: 0, y: 0, s: 1 }
            setHover(false)
            wake()
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        document.documentElement.addEventListener("pointerleave", onLeave)
        window.addEventListener("blur", onLeave)
        return () => {
            window.removeEventListener("pointermove", onMove)
            document.documentElement.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("blur", onLeave)
            cancelAnimationFrame(raf.current)
            raf.current = 0
        }
    }, [isStatic, strength, radius, textParallax, spring, hoverScale])

    const justifyContent =
        align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"
    const colorTransition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease"

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                minWidth: "max-content",
            }}
        >
            {wrapLink(
            <a
                ref={btnRef}
                href={href || undefined}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                role={href ? undefined : "button"}
                tabIndex={0}
                aria-label={label}
                onClick={onClick}
                onFocus={(e) => {
                    const ring = e.currentTarget.matches(":focus-visible")
                    startTransition(() => {
                        setHovered(true)
                        setFocusRing(ring)
                    })
                }}
                onBlur={() =>
                    startTransition(() => {
                        setHovered(false)
                        setFocusRing(false)
                    })
                }
                // Without a link this is a button, so Enter and Space have to
                // press it the way they would a native <button>
                onKeyDown={(e) => {
                    if (href) return
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        e.currentTarget.click()
                    }
                }}
                style={{
                    ...font,
                    position: "relative",
                    flex: 1,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent,
                    padding,
                    color: hovered ? hoverTextColor : textColor,
                    background: hovered ? hoverBackground : background,
                    backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                    WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                    borderRadius: cornerRadius,
                    border:
                        borderWidth > 0
                            ? `${borderWidth}px solid ${borderColor}`
                            : "none",
                    textTransform: textCase,
                    textDecoration: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    outline: focusRing
                        ? `2px solid ${hoverBackground}`
                        : "none",
                    outlineOffset: 3,
                    willChange: "transform",
                    transition: colorTransition,
                }}
            >
                <span
                    ref={labelRef}
                    style={{ display: "inline-block", willChange: "transform" }}
                >
                    {label}
                </span>
            </a>
            )}
        </div>
    )
}

MagneticButton.displayName = "Magnetic Button"

addPropertyControls(MagneticButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Shop With AI",
    },
    link: { type: ControlType.Link, title: "Link" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    onClick: { type: ControlType.EventHandler },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "14px",
            letterSpacing: "0.01em",
            lineHeight: "1.5em",
        },
    },
    textCase: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase"],
        optionTitles: ["Aa", "AA"],
        displaySegmentedControl: true,
        defaultValue: "uppercase",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgb(241, 230, 216)",
    },
    background: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgba(241, 230, 216, 0.24)",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "rgb(0, 0, 0)",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "rgb(241, 230, 216)",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 1000,
        min: 0,
        max: 1000,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 20px 16px 20px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0,
        min: 0,
        max: 8,
        step: 0.5,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(241, 230, 216, 0.4)",
        hidden: (props) => !props.borderWidth,
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description: "How strongly the button is pulled toward the cursor.",
    },
    radius: {
        type: ControlType.Number,
        title: "Field",
        defaultValue: 60,
        min: 0,
        max: 200,
        step: 5,
        unit: "px",
        description: "Distance around the button where the pull begins.",
    },
    textParallax: {
        type: ControlType.Number,
        title: "Text Parallax",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Extra drift of the label relative to the button.",
    },
    spring: {
        type: ControlType.Number,
        title: "Spring",
        defaultValue: 0.12,
        min: 0.02,
        max: 0.5,
        step: 0.01,
        description: "Lower is looser, higher is snappier.",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
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
        defaultValue: "center",
        description: "Label position when the layer is wider than the text.",
    },
})
