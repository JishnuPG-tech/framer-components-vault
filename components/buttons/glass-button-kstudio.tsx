// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useId, useRef, useState, useEffect } from "react"

/**
 * KAMOTION STUDIO | GLASS BUTTON
 *
 * Dark-only appearance with a realistic Inflated glass-tube treatment.
 *
 * Two motion modes:
 * - Jiggle Mode OFF: hover/click transforms use spring-based inertia
 *   (mass-spring-damper), giving natural overshoot and settle.
 * - Jiggle Mode ON: restores the original hand-tuned keyframe jiggle
 *   animations (hover / active / release / unhover) exactly as before.
 *
 * Static-renderer safe: when useIsStaticRenderer() is true (Framer canvas / export),
 * all animation and hover/press state is disabled and a static preview is shown.
 */

function getDepthStyles(level) {
    const colors = {
        shadow: "rgba(0, 0, 0, 0.3)",
        softShadow: "rgba(0, 0, 0, 0.1)",
        highlight: "rgba(255, 255, 255, 0.9)",
        rim: "rgba(255, 255, 255, 0.15)",
    }

    const table = {
        Flat: {
            shadow: `0 4px 14px ${colors.shadow}, 0 2px 4px rgba(0,0,0,0.05)`,
            inset: `inset 0 1px 0 0 ${colors.highlight}, inset 0 -1px 2px 0 ${colors.rim}`,
            glossOpacity: 0.1,
            glossBlur: "1.5px",
            gradient:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
        },
        Standard: {
            shadow: `0 20px 40px -12px ${colors.shadow}, 0 8px 16px -8px ${colors.softShadow}, inset 0 1px 0 0 ${colors.highlight}`,
            inset: `inset 0 -4px 8px 0 ${colors.rim}`,
            glossOpacity: 0.4,
            glossBlur: "1px",
            gradient:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 100%)",
        },
        Inflated: {
            shadow: `0 30px 60px -15px ${colors.shadow}, 0 10px 20px -10px rgba(0,0,0,0.15), inset 0 2px 3px 0 rgba(255,255,255,0.4), inset 0 -4px 12px 0 rgba(0,0,0,0.2)`,
            inset: `inset 0 0 0 1px rgba(255,255,255,0.3)`,
            glossOpacity: 0.8,
            glossBlur: "2px",
            gradient:
                "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)",
        },
    }

    return table[level] || table.Standard
}

function readTransformScale(element) {
    if (!element || typeof window === "undefined") return "1, 1"

    const st = window.getComputedStyle(element)
    const tr =
        st.getPropertyValue("transform") ||
        st.getPropertyValue("-webkit-transform")

    if (!tr || tr === "none") return "1, 1"

    const values = tr.split("(")[1].split(")")[0].split(",")
    const sx = parseFloat(values[0]) || 1
    const sy = parseFloat(values[3]) || sx

    return `${sx}, ${sy}`
}

function useSpringTransform(elementRef, target, enabled, options) {
    const {
        mass = 1,
        stiffness = 210,
        damping = 20,
        cssVar = "--scale",
    } = options || {}

    const stateRef = useRef({ x: target, v: 0 })
    const rafRef = useRef(null)
    const targetRef = useRef(target)

    useEffect(() => {
        targetRef.current = target
    }, [target])

    useEffect(() => {
        if (!enabled) {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }

        let lastTime = performance.now()

        const step = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.032)
            lastTime = now

            const s = stateRef.current
            const displacement = s.x - targetRef.current
            const springForce = -stiffness * displacement
            const dampingForce = -damping * s.v
            const acceleration = (springForce + dampingForce) / mass

            s.v += acceleration * dt
            s.x += s.v * dt

            if (elementRef.current) {
                elementRef.current.style.setProperty(cssVar, String(s.x))
            }

            const atRest =
                Math.abs(s.v) < 0.0005 && Math.abs(displacement) < 0.0005

            if (atRest) {
                s.x = targetRef.current
                s.v = 0
                if (elementRef.current) {
                    elementRef.current.style.setProperty(cssVar, String(s.x))
                }
                rafRef.current = null
                return
            }

            rafRef.current = requestAnimationFrame(step)
        }

        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(step)
        }

        return () => {
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [target, enabled, mass, stiffness, damping, cssVar])
}

export default function GlassButton(props) {
    const {
        link,
        openInNewTab,
        label,
        icon,
        useCustomColors,
        background,
        hoverBackground,
        color,
        hoverColor,
        borderColorTop,
        borderColorBottom,
        font,
        borderRadius,
        paddingVertical,
        paddingHorizontal,
        borderWidth,
        hoverScale,
        clickScale,
        style,
        baseRotation,
        hoverRotation,
        blurIntensity,
        depthLevel,
        jiggleMode,
        jiggleIntensity,
        springStiffness,
        springDamping,
        springMass,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isHovered, setIsHovered] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [animState, setAnimState] = useState("idle")

    const buttonRef = useRef(null)
    const id = useId().replace(/:/g, "")
    const className = `glass-button-${id}`

    const isInflated = depthLevel === "Inflated"
    const customColorsEnabled = Boolean(useCustomColors)

    const hs = Number(hoverScale ?? 1.15)
    const cs = Number(clickScale ?? 0.92)
    const bw = Number(borderWidth ?? 1.5)
    const depth = getDepthStyles(depthLevel)
    const rimWidth = isInflated ? bw + 1.5 : bw

    const mult =
        jiggleIntensity === "Light"
            ? 0.04
            : jiggleIntensity === "Heavy"
              ? 0.14
              : 0.08

    const palette = {
        background: isInflated
            ? "rgba(20,24,32,0.4)"
            : "rgba(255,255,255,0.06)",
        hoverBackground: isInflated
            ? "rgba(30,36,46,0.48)"
            : "rgba(255,255,255,0.12)",
        text: "rgba(255,255,255,0.82)",
        hoverText: "#FFFFFF",
        topBorder: "rgba(255,255,255,0.7)",
        bottomBorder: "rgba(148,163,184,0.24)",
        textShadow: "0 2px 4px rgba(0,0,0,0.24)",
        idleTextOpacity: 0.86,
        glossStartOpacity: 0.6,
    }

    const backgroundColor = customColorsEnabled
        ? isActive || isHovered
            ? hoverBackground || palette.hoverBackground
            : background || palette.background
        : isActive || isHovered
          ? palette.hoverBackground
          : palette.background

    const textColor = customColorsEnabled
        ? isHovered
            ? hoverColor || palette.hoverText
            : color || palette.text
        : isHovered
          ? palette.hoverText
          : palette.text

    const topBorderColor = customColorsEnabled
        ? borderColorTop || palette.topBorder
        : palette.topBorder

    const bottomBorderColor = customColorsEnabled
        ? borderColorBottom || palette.bottomBorder
        : palette.bottomBorder

    const Tag = link ? "a" : "button"
    const linkProps = link
        ? {
              href: link,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
          }
        : { type: "button" }

    const updateStartScale = () => {
        if (!buttonRef.current) return
        buttonRef.current.style.setProperty(
            "--start-scale",
            readTransformScale(buttonRef.current)
        )
    }

    const targetScale = isActive ? cs : isHovered ? hs : 1
    const springEnabled = !isStatic && !jiggleMode

    useSpringTransform(buttonRef, targetScale, springEnabled, {
        mass: Number(springMass ?? 1),
        stiffness: Number(springStiffness ?? 210),
        damping: Number(springDamping ?? 20),
        cssVar: "--scale",
    })

    const handlePointerEnter = () => {
        if (isStatic) return
        updateStartScale()
        setIsHovered(true)
        setAnimState("hover")
    }

    const handlePointerLeave = () => {
        if (isStatic) return
        const wasHovered = isHovered
        updateStartScale()
        setIsHovered(false)
        setIsActive(false)
        if (wasHovered) setAnimState("unhover")
    }

    const handlePointerDown = (event) => {
        if (isStatic) return
        if (event.button !== 0) return
        updateStartScale()
        setIsActive(true)
        setAnimState("active")
    }

    const handlePointerUp = () => {
        if (isStatic) return
        if (!isActive) return
        updateStartScale()
        setIsActive(false)
        setAnimState("release")
    }

    const handlePointerCancel = () => {
        if (isStatic) return
        updateStartScale()
        setIsActive(false)
        setAnimState(isHovered ? "release" : "unhover")
    }

    const handleKeyDown = (event) => {
        if (isStatic) return
        if (event.repeat) return
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        updateStartScale()
        setIsActive(true)
        setAnimState("active")
    }

    const handleKeyUp = (event) => {
        if (isStatic) return
        if (event.key !== "Enter" && event.key !== " ") return
        updateStartScale()
        setIsActive(false)
        setAnimState("release")
    }

    let currentAnim = "none"
    if (!isStatic && jiggleMode) {
        if (animState === "hover")
            currentAnim = `${className}-hover 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
        else if (animState === "active")
            currentAnim = `${className}-active 0.22s cubic-bezier(0.34, 0.7, 0.29, 0.98) forwards`
        else if (animState === "release")
            currentAnim = `${className}-release 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
        else if (animState === "unhover")
            currentAnim = `${className}-unhover 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
    }

    const rotationValue = isStatic
        ? (baseRotation ?? 135)
        : (baseRotation ?? 135) + (isHovered ? (hoverRotation ?? 180) : 0)

    const baseTransformRule = isStatic
        ? "scale(1)"
        : jiggleMode
          ? undefined
          : "scale(var(--scale, 1))"

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
            }}
        >
            <style>{`
                ${
                    !isStatic && jiggleMode
                        ? `
                @keyframes ${className}-hover {
                    0% { transform: scale(var(--start-scale, 1, 1)); }
                    25% { transform: scale(${hs * (1 + mult * 1.2)}, ${hs * (1 - mult * 1.2)}); }
                    55% { transform: scale(${hs * (1 - mult * 0.6)}, ${hs * (1 + mult * 0.6)}); }
                    80% { transform: scale(${hs * (1 + mult * 0.25)}, ${hs * (1 - mult * 0.25)}); }
                    100% { transform: scale(${hs}, ${hs}); }
                }
                @keyframes ${className}-active {
                    0% { transform: scale(var(--start-scale, 1, 1)); }
                    40% { transform: scale(${cs * 0.97}, ${cs * 1.03}); }
                    100% { transform: scale(${cs}, ${cs}); }
                }
                @keyframes ${className}-release {
                    0% { transform: scale(${cs}, ${cs}); }
                    20% { transform: scale(${cs * (1 + mult * 1.6)}, ${cs * (1 - mult * 1.6)}); }
                    50% { transform: scale(${hs * (1 - mult * 0.8)}, ${hs * (1 + mult * 0.8)}); }
                    75% { transform: scale(${hs * (1 + mult * 0.3)}, ${hs * (1 - mult * 0.3)}); }
                    100% { transform: scale(${hs}, ${hs}); }
                }
                @keyframes ${className}-unhover {
                    0% { transform: scale(var(--start-scale, 1, 1)); }
                    25% { transform: scale(1.08, 0.92); }
                    55% { transform: scale(0.97, 1.03); }
                    80% { transform: scale(1.015, 0.985); }
                    100% { transform: scale(1, 1); }
                }
                `
                        : ""
                }

                .${className} {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    appearance: none;
                    border: none;
                    outline: none;
                    cursor: ${isStatic ? "default" : "pointer"};
                    text-decoration: none;
                    -webkit-tap-highlight-color: transparent;
                    border-radius: ${borderRadius ?? 50}px;
                    padding: ${paddingVertical ?? 18}px ${paddingHorizontal ?? 36}px;
                    background: ${backgroundColor};
                    background-image: ${depth.gradient};
                    box-shadow: ${depth.shadow}, ${depth.inset};
                    backdrop-filter: blur(${blurIntensity ?? 30}px);
                    -webkit-backdrop-filter: blur(${blurIntensity ?? 30}px);
                    ${baseTransformRule ? `transform: ${baseTransformRule};` : ""}
                    animation: ${currentAnim};
                    transition: ${
                        isStatic
                            ? "none"
                            : "background 0.4s ease, box-shadow 0.4s ease"
                    };
                    will-change: ${isStatic ? "auto" : "transform"};
                }

                .${className}:focus-visible {
                    outline: 2px solid ${textColor};
                    outline-offset: 4px;
                }

                .${className}::after {
                    content: "";
                    position: absolute;
                    top: 1px;
                    left: 2%;
                    right: 2%;
                    height: 40%;
                    z-index: 4;
                    pointer-events: none;
                    border-radius: ${borderRadius ?? 50}px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%);
                    filter: blur(${depth.glossBlur});
                    opacity: ${isStatic ? depth.glossOpacity * 0.9 : isHovered ? depth.glossOpacity : depth.glossOpacity * 0.75};
                    transition: ${isStatic ? "none" : "opacity 0.4s ease"};
                }

                .${className} .rim {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    padding: ${rimWidth}px;
                    border-radius: inherit;
                    pointer-events: none;
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                }

                .${className} .light {
                    position: absolute;
                    width: 300%;
                    height: 300%;
                    top: -100%;
                    left: -100%;
                    z-index: 2;
                    background: conic-gradient(
                        from 0deg at 50% 50%,
                        transparent 0deg,
                        ${topBorderColor} 35deg,
                        transparent 70deg,
                        transparent 180deg,
                        ${bottomBorderColor} 215deg,
                        transparent 250deg
                    );
                    filter: blur(15px);
                    mix-blend-mode: plus-lighter;
                    transform: rotate(${rotationValue}deg);
                    transition: ${isStatic ? "none" : "transform 1.2s cubic-bezier(0.2, 0, 0, 1)"};
                }

                ${
                    isInflated
                        ? `
                .${className} .tube-highlight {
                    position: absolute;
                    top: 4%;
                    left: 4%;
                    right: 4%;
                    z-index: 4;
                    height: 58%;
                    pointer-events: none;
                    border-radius: ${Math.max((borderRadius ?? 50) - 2, 0)}px;
                    opacity: 0.85;
                    background: linear-gradient(
                        180deg,
                        rgba(255,255,255,0.55) 0%,
                        rgba(255,255,255,0.2) 48%,
                        rgba(255,255,255,0) 100%
                    );
                    filter: blur(1px);
                }
                .${className} .tube-refraction {
                    position: absolute;
                    left: 8%;
                    right: 8%;
                    bottom: 7%;
                    z-index: 3;
                    height: 22%;
                    pointer-events: none;
                    border-radius: 0 0 999px 999px;
                    opacity: 0.32;
                    background: linear-gradient(
                        180deg,
                        rgba(255,255,255,0) 0%,
                        rgba(148,163,184,0.18) 100%
                    );
                    filter: blur(5px);
                }
            `
                        : ""
                }

                .${className} .content-wrap {
                    position: relative;
                    z-index: 5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .${className} .icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    line-height: 0;
                    color: ${textColor};
                    opacity: ${isStatic ? palette.idleTextOpacity : isHovered ? 1 : palette.idleTextOpacity};
                    transition: ${isStatic ? "none" : "color 0.3s ease, opacity 0.3s ease"};
                }

                .${className} .label {
                    color: ${textColor};
                    font-family: "Inter", sans-serif;
                    font-size: 18px;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    text-shadow: ${palette.textShadow};
                    user-select: none;
                    opacity: ${isStatic ? palette.idleTextOpacity : isHovered ? 1 : palette.idleTextOpacity};
                    transition: ${isStatic ? "none" : "color 0.3s ease, opacity 0.3s ease"};
                }
            `}</style>

            <Tag
                ref={buttonRef}
                className={className}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                {...linkProps}
                tabIndex={isStatic ? -1 : 0}
            >
                <span className="rim">
                    <span className="light" />
                </span>

                {isInflated && (
                    <>
                        <span className="tube-highlight" />
                        <span className="tube-refraction" />
                    </>
                )}

                <span className="content-wrap">
                    {icon && <span className="icon">{icon}</span>}
                    {label && (
                        <span className="label" style={{ ...font }}>
                            {label}
                        </span>
                    )}
                </span>
            </Tag>
        </div>
    )
}

addPropertyControls(GlassButton, {
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started",
    },
    icon: {
        type: ControlType.ComponentInstance,
        title: "Icon",
    },
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
    },
    jiggleMode: {
        type: ControlType.Boolean,
        title: "Jiggle Mode",
        defaultValue: false,
    },
    jiggleIntensity: {
        type: ControlType.Enum,
        title: "Jiggle Intensity",
        options: ["Light", "Medium", "Heavy"],
        defaultValue: "Medium",
        hidden: (props) => !props.jiggleMode,
    },
    depthLevel: {
        type: ControlType.Enum,
        title: "Depth Style",
        options: ["Flat", "Standard", "Inflated"],
        defaultValue: "Standard",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 50,
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Vertical Padding",
        defaultValue: 18,
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Horizontal Padding",
        defaultValue: 36,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.15,
        min: 0.9,
        max: 1.3,
        step: 0.01,
        displayStepper: true,
    },
    clickScale: {
        type: ControlType.Number,
        title: "Click Scale",
        defaultValue: 0.92,
        min: 0.85,
        max: 1,
        step: 0.01,
        displayStepper: true,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 210,
        min: 40,
        max: 500,
        step: 5,
        displayStepper: true,
        hidden: (props) => Boolean(props.jiggleMode),
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 20,
        min: 1,
        max: 60,
        step: 1,
        displayStepper: true,
        hidden: (props) => Boolean(props.jiggleMode),
    },
    springMass: {
        type: ControlType.Number,
        title: "Spring Mass",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
        hidden: (props) => Boolean(props.jiggleMode),
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: '"Inter", sans-serif',
            fontSize: 18,
            fontWeight: 800,
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background Tint",
        defaultValue: "rgba(255,255,255,0.06)",
        hidden: (props) => !props.useCustomColors,
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Background Tint",
        defaultValue: "rgba(255,255,255,0.12)",
        hidden: (props) => !props.useCustomColors,
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#BBBBBB",
        hidden: (props) => !props.useCustomColors,
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.useCustomColors,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.5,
        displayStepper: true,
    },
    borderColorTop: {
        type: ControlType.Color,
        title: "Top Border Color",
        defaultValue: "rgba(255,255,255,0.7)",
        hidden: (props) => !props.useCustomColors,
    },
    borderColorBottom: {
        type: ControlType.Color,
        title: "Bottom Border Color",
        defaultValue: "rgba(255,255,255,0.2)",
        hidden: (props) => !props.useCustomColors,
    },
    baseRotation: {
        type: ControlType.Number,
        title: "Base Rotation",
        defaultValue: 135,
        step: 5,
        displayStepper: true,
    },
    hoverRotation: {
        type: ControlType.Number,
        title: "Hover Rotation Delta",
        defaultValue: 180,
        step: 5,
        displayStepper: true,
    },
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 30,
        min: 0,
        max: 60,
        step: 2,
        displayStepper: true,
    },
})
