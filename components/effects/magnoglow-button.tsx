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


interface MagneticGradientButtonProps {
    text: string
    gradientStart: string
    gradientEnd: string
    glowSize: number
    magneticStrength: number
    borderRadius: number
    backgroundColor: string
    font: any
    textColor: string
    padding: string
    link?: string
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticGradientButton(props: MagneticGradientButtonProps) {
    const {
        text,
        gradientStart,
        gradientEnd,
        glowSize,
        magneticStrength,
        borderRadius,
        backgroundColor,
        font,
        textColor,
        padding,
        link,
    } = props

    const buttonRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState({ x: 50, y: 50 })
    const [transform, setTransform] = React.useState("translate(0px, 0px)")

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (!rect) return

        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        React.startTransition(() => {
            setPosition({ x, y })
        })

        const moveX =
            (e.clientX - (rect.left + rect.width / 2)) * magneticStrength
        const moveY =
            (e.clientY - (rect.top + rect.height / 2)) * magneticStrength

        React.startTransition(() => {
            setTransform(`translate(${moveX}px, ${moveY}px)`)
        })
    }

    const resetPosition = () => {
        React.startTransition(() => {
            setTransform("translate(0px, 0px)")
        })
    }

    const handleClick = () => {
        if (link && typeof window !== "undefined") {
            window.open(link, "_blank")
        }
    }

    return (
        <>
            <div
                ref={buttonRef}
                className="magnetic-button"
                onMouseMove={handleMouseMove}
                onMouseLeave={resetPosition}
                onClick={handleClick}
                style={{
                    transform,
                    borderRadius: borderRadius,
                    background: backgroundColor,
                    padding: padding,
                    cursor: link ? "pointer" : "default",
                }}
            >
                <div
                    className="glow"
                    style={{
                        background: `radial-gradient(circle ${glowSize}px at ${position.x}% ${position.y}%, ${gradientStart}, ${gradientEnd}, transparent 70%)`,
                        borderRadius: borderRadius,
                        mixBlendMode: "normal",
                    }}
                />
                <span
                    className="label"
                    style={{
                        ...font,
                        color: textColor,
                    }}
                >
                    {text}
                </span>
            </div>

            <style>{`
                .magnetic-button {
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: max-content;
                }

                .glow {
                    position: absolute;
                    inset: 0;
                    opacity: 0.6;
                    pointer-events: none;
                    transition: background 0.1s ease;
                }

                .label {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </>
    )
}

addPropertyControls(MagneticGradientButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Glow Start",
        defaultValue: "#6366F1",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "Glow End",
        defaultValue: "#8B5CF6",
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 10,
    },
    magneticStrength: {
        type: ControlType.Number,
        title: "Magnetic",
        defaultValue: 0.15,
        min: 0,
        max: 0.4,
        step: 0.01,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 100,
    },
})
