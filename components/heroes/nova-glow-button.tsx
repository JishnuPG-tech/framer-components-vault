// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, type CSSProperties } from "react"

interface NovaGlowButtonProps {
    text: string
    link?: string
    openInNewTab: boolean
    backgroundColor: string
    textColor: string
    borderColor: string
    accentOne: string
    accentTwo: string
    accentThree: string
    glowOpacity: number
    glowBlur: number
    borderSize: number
    borderRadius: string
    font: any
    padding: string
    speed: number
    hoverScale: number
    hoverTransition: any
    shine: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 56
 */
export default function NovaGlowButton(props: NovaGlowButtonProps) {
    const {
        text = "Explore now",
        link,
        openInNewTab = false,
        backgroundColor = "#070711",
        textColor = "#FFFFFF",
        borderColor = "rgba(255,255,255,0.14)",
        accentOne = "#9C43FE",
        accentTwo = "#4CC2E9",
        accentThree = "#111499",
        glowOpacity = 0.9,
        glowBlur = 18,
        borderSize = 2,
        borderRadius = "999px",
        font,
        padding = "0px 28px",
        speed = 5,
        hoverScale = 1.02,
        hoverTransition,
        shine = true,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const rootRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null)
    const isStaticRenderer = useIsStaticRenderer()

    useEffect(() => {
        const element = rootRef.current
        if (!element) return

        if (isStaticRenderer) {
            element.style.setProperty("--nova-glow-rotation", "42deg")
            return
        }

        let frame = 0
        let rotation = 0
        let lastTime = performance.now()

        const animate = (time: number) => {
            const delta = (time - lastTime) / 1000
            lastTime = time
            rotation = (rotation + delta * speed * 24) % 360
            element.style.setProperty("--nova-glow-rotation", `${rotation}deg`)
            frame = requestAnimationFrame(animate)
        }

        frame = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(frame)
    }, [speed, isStaticRenderer])

    const content = (
        <>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius,
                    padding: borderSize,
                    background: `conic-gradient(from var(--nova-glow-rotation, 0deg), ${accentThree} 0deg, ${accentOne} 70deg, ${accentTwo} 135deg, transparent 190deg, ${accentThree} 260deg, ${accentOne} 360deg)`,
                    opacity: isHovered ? 1 : glowOpacity,
                    WebkitMask:
                        "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    pointerEvents: "none",
                    transition: "opacity 220ms ease",
                    zIndex: 1,
                }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -glowBlur,
                    borderRadius: `calc(${borderRadius} + ${glowBlur}px)`,
                    background: `conic-gradient(from var(--nova-glow-rotation, 0deg), transparent 0deg, ${accentOne} 72deg, ${accentTwo} 135deg, transparent 210deg, ${accentThree} 290deg, transparent 360deg)`,
                    opacity: isHovered ? glowOpacity : glowOpacity * 0.55,
                    filter: `blur(${glowBlur}px)`,
                    pointerEvents: "none",
                    transition: "opacity 220ms ease, filter 220ms ease",
                    zIndex: 0,
                }}
            />

            {shine && (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: borderSize,
                        borderRadius: `calc(${borderRadius} - ${borderSize}px)`,
                        background:
                            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.03) 65%, transparent 100%)",
                        transform: isHovered
                            ? "translateX(38%)"
                            : "translateX(-38%)",
                        opacity: isHovered ? 1 : 0.45,
                        pointerEvents: "none",
                        transition:
                            "transform 650ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease",
                        zIndex: 2,
                    }}
                />
            )}

            <span
                style={{
                    position: "relative",
                    zIndex: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </span>
        </>
    )

    const sharedStyle: CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        minWidth: 120,
        minHeight: 36,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        isolation: "isolate",
        cursor: "pointer",
        border: `1px solid ${borderColor}`,
        borderRadius,
        background: backgroundColor,
        color: textColor,
        ...font,
        lineHeight: 1,
        padding,
        textDecoration: "none",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        WebkitAppearance: "none",
        appearance: "none",
        outline: "none",
        // Safari fix: clip filtered glow layers to rounded shape (prevents a visible square around the button)
        WebkitClipPath: `inset(0 round ${borderRadius})`,
        clipPath: `inset(0 round ${borderRadius})`,
        boxShadow: isHovered
            ? `0 0 ${Math.round(glowBlur * 1.25)}px rgba(124, 92, 255, 0.32), inset 0 1px 0 rgba(255,255,255,0.12)`
            : `0 0 ${Math.round(glowBlur * 0.55)}px rgba(124, 92, 255, 0.16), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transform: isHovered ? `translateY(-1px) scale(${hoverScale})` : "none",
        transition: `transform ${hoverTransition?.duration || 0.22}s ${hoverTransition?.ease || "ease"}, box-shadow 220ms ease, border-color 220ms ease`,
    }

    if (link) {
        return (
            <a
                ref={rootRef as React.RefObject<HTMLAnchorElement>}
                href={link}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={sharedStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {content}
            </a>
        )
    }

    return (
        <button
            ref={rootRef as React.RefObject<HTMLButtonElement>}
            type="button"
            style={sharedStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {content}
        </button>
    )
}

addPropertyControls(NovaGlowButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Explore now",
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
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#070711",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Base Border",
        defaultValue: "rgba(255,255,255,0.14)",
    },
    accentOne: {
        type: ControlType.Color,
        title: "Accent 1",
        defaultValue: "#9C43FE",
    },
    accentTwo: {
        type: ControlType.Color,
        title: "Accent 2",
        defaultValue: "#4CC2E9",
    },
    accentThree: {
        type: ControlType.Color,
        title: "Accent 3",
        defaultValue: "#111499",
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    borderSize: {
        type: ControlType.Number,
        title: "Glow Edge",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px 28px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 5,
        min: 0,
        max: 16,
        step: 0.5,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.02,
        min: 1,
        max: 1.08,
        step: 0.01,
    },
    shine: {
        type: ControlType.Boolean,
        title: "Shine",
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
