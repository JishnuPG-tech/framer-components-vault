// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useCallback, useEffect } from "react"

/**
 * MAGNETIC BUTTON
 *
 * A premium CTA button with:
 *  - Magnetic cursor pull (smoothed via a single rAF loop, no re-renders)
 *  - Shine sweep across the surface on hover
 *  - Animated arrow that slides forward
 *  - Respects prefers-reduced-motion and keyboard focus
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 56
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const LERP = 0.2 // follow smoothing — 0 = frozen, 1 = instant
const PULL = 0.4 // fraction of the cursor distance the button travels
const PARALLAX = 0.12 // extra lead on the inner content, for depth

export default function MagneticButton(props) {
    const {
        label,
        font,
        bgColor,
        textColor,
        hoverBgColor,
        hoverTextColor,
        borderRadius,
        paddingX,
        paddingY,
        magnetStrength,
        showShine,
        shineColor,
        showArrow,
        link,
        openInNewTab,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false

    const buttonRef = useRef(null)
    const contentRef = useRef(null)

    const [isHovered, setIsHovered] = useState(false)
    const [shineKey, setShineKey] = useState(0)
    const [reducedMotion, setReducedMotion] = useState(false)

    // Motion lives in refs so cursor tracking never triggers a React re-render.
    const frame = useRef(null)
    const current = useRef({ x: 0, y: 0 })
    const target = useRef({ x: 0, y: 0 })
    const center = useRef({ x: 0, y: 0 })
    const half = useRef({ w: 0, h: 0 })

    const magnetActive = !isStatic && magnetStrength > 0 && !reducedMotion

    // Respect the OS "reduce motion" setting.
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // Single rAF loop: eases `current` toward `target`, writes straight to the DOM.
    const animate = useCallback(() => {
        const cur = current.current
        const tar = target.current
        const dx = tar.x - cur.x
        const dy = tar.y - cur.y
        const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1

        if (settled) {
            cur.x = tar.x
            cur.y = tar.y
        } else {
            cur.x += dx * LERP
            cur.y += dy * LERP
        }

        if (buttonRef.current) {
            buttonRef.current.style.transform = `translate3d(${cur.x.toFixed(
                2
            )}px, ${cur.y.toFixed(2)}px, 0)`
        }
        if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(${(
                cur.x * PARALLAX
            ).toFixed(2)}px, ${(cur.y * PARALLAX).toFixed(2)}px, 0)`
        }

        if (settled) {
            frame.current = null // rest reached — stop until the next move
            return
        }
        frame.current = requestAnimationFrame(animate)
    }, [])

    const ensureFrame = useCallback(() => {
        if (frame.current == null && !isStatic) {
            frame.current = requestAnimationFrame(animate)
        }
    }, [animate, isStatic])

    const handleMouseEnter = () => {
        if (isStatic) return
        setIsHovered(true)
        if (!reducedMotion) setShineKey((k) => k + 1)
        if (magnetActive && buttonRef.current) {
            const r = buttonRef.current.getBoundingClientRect()
            // Subtract the live offset so the reference point is the button's
            // RESTING centre. This is what kills the feedback wobble.
            center.current = {
                x: r.left + r.width / 2 - current.current.x,
                y: r.top + r.height / 2 - current.current.y,
            }
            half.current = { w: r.width / 2, h: r.height / 2 }
        }
    }

    const handleMouseMove = (e) => {
        if (!magnetActive) return
        const s = magnetStrength / 100
        const dx = e.clientX - center.current.x
        const dy = e.clientY - center.current.y
        const maxX = half.current.w * 0.6
        const maxY = half.current.h * 0.6
        target.current.x = clamp(dx * s * PULL, -maxX, maxX)
        target.current.y = clamp(dy * s * PULL, -maxY, maxY)
        ensureFrame()
    }

    const handleMouseLeave = () => {
        setIsHovered(false)
        target.current.x = 0
        target.current.y = 0
        ensureFrame() // glide back to rest
    }

    // Clean up the rAF on unmount.
    useEffect(
        () => () => {
            if (frame.current) cancelAnimationFrame(frame.current)
        },
        []
    )

    // If the magnet is switched off mid-interaction, ease back to centre.
    useEffect(() => {
        if (!magnetActive) {
            target.current.x = 0
            target.current.y = 0
            ensureFrame()
        }
    }, [magnetActive, ensureFrame])

    const easing = "cubic-bezier(0.23, 1, 0.32, 1)"
    const id = useRef(`mb-${Math.random().toString(36).slice(2, 9)}`).current
    const shineAnim = `${id}-shine`

    const isLink = !!link
    const Tag = isLink ? "a" : "button"

    return (
        <div
            style={{
                display: "inline-block",
                position: "relative",
                isolation: "isolate",
            }}
        >
            <style>{`
                @keyframes ${shineAnim} {
                    0%   { transform: translateX(-120%) skewX(-20deg); }
                    100% { transform: translateX(320%)  skewX(-20deg); }
                }
                .${id} { outline: none; }
                .${id}:focus-visible {
                    outline: 2px solid ${bgColor};
                    outline-offset: 3px;
                }
            `}</style>

            <Tag
                ref={buttonRef}
                className={id}
                href={isLink ? link : undefined}
                target={isLink && openInNewTab ? "_blank" : undefined}
                rel={isLink && openInNewTab ? "noopener noreferrer" : undefined}
                type={isLink ? undefined : "button"}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    position: "relative",
                    boxSizing: "border-box",
                    margin: 0,
                    border: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: isLink ? "pointer" : "default",
                    background: isHovered ? hoverBgColor : bgColor,
                    color: isHovered ? hoverTextColor : textColor,
                    borderRadius,
                    padding: `${paddingY}px ${paddingX}px`,
                    ...font,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                    transition: "background-color 0.3s ease, color 0.3s ease",
                    willChange:
                        magnetActive && isHovered ? "transform" : "auto",
                }}
            >
                {/* Shine sweep — only renders during hover, remounts via key */}
                {showShine && !isStatic && !reducedMotion && isHovered && (
                    <span
                        key={shineKey}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "40%",
                            height: "100%",
                            background: `linear-gradient(90deg, transparent 0%, ${shineColor} 50%, transparent 100%)`,
                            animation: `${shineAnim} 0.9s ${easing} forwards`,
                            pointerEvents: "none",
                            mixBlendMode: "screen",
                            zIndex: 0,
                        }}
                    />
                )}

                {/* Inner content gets a touch of parallax lead for depth */}
                <span
                    ref={contentRef}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        willChange:
                            magnetActive && isHovered ? "transform" : "auto",
                    }}
                >
                    <span>{label}</span>

                    {showArrow && (
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            aria-hidden="true"
                            style={{
                                flexShrink: 0,
                                transform:
                                    !isStatic && !reducedMotion && isHovered
                                        ? "translateX(3px)"
                                        : "translateX(0)",
                                transition:
                                    isStatic || reducedMotion
                                        ? "none"
                                        : `transform 0.4s ${easing}`,
                            }}
                        >
                            <path
                                d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                                stroke="currentColor"
                                strokeWidth="1.75"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </span>
            </Tag>
        </div>
    )
}

MagneticButton.defaultProps = {
    label: "Get Started",
    bgColor: "#0A0A0A",
    textColor: "#FFFFFF",
    hoverBgColor: "#1F1F1F",
    hoverTextColor: "#FFFFFF",
    borderRadius: 100,
    paddingX: 28,
    paddingY: 16,
    magnetStrength: 35,
    showShine: true,
    shineColor: "rgba(255,255,255,0.35)",
    showArrow: true,
    openInNewTab: false,
}

addPropertyControls(MagneticButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started",
        placeholder: "Button text",
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
        },
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#1F1F1F",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 28,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    magnetStrength: {
        type: ControlType.Number,
        title: "Magnet",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 35,
        unit: "%",
        description: "Strength of cursor pull. 0 disables the effect.",
    },
    showShine: {
        type: ControlType.Boolean,
        title: "Shine",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "rgba(255,255,255,0.35)",
        hidden: (p) => !p.showShine,
    },
    showArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => !p.link,
    },
})
