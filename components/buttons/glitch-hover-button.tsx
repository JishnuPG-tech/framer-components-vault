import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const chars = "SCORA0123456789"

export default function GlitchButton(props) {
    const {
        text,
        badge,
        showBadge,
        fontSize,
        fontWeight,
        fontFamily,
        letterSpacing,
        lineHeight,
        textColor,
        glitchColor,
        bgColor,
        badgeBg,
        badgeColor,
        link,
        newTab,
        paddingX,
        paddingY,
        borderRadius,
    } = props

    const [letters, setLetters] = useState([])
    const [hovered, setHovered] = useState(false)
    const intervalRef = useRef(null)

    useEffect(() => {
        setLetters(
            text.split("").map((char) => ({
                char,
                glitch: false,
            }))
        )
    }, [text])

    const stop = () => {
        clearInterval(intervalRef.current)
        setLetters(
            text.split("").map((char) => ({
                char,
                glitch: false,
            }))
        )
    }

    const start = () => {
        const original = text.split("")
        let iteration = 0
        const maxIterations = original.length * 2

        clearInterval(intervalRef.current)

        intervalRef.current = setInterval(() => {
            const progress = iteration / maxIterations

            setLetters((prev) =>
                prev.map((l, index) => {
                    const isGlitchIndex = index % 2 === 0
                    const glitchChance = 0.5 * (1 - progress)

                    const shouldGlitch =
                        isGlitchIndex && Math.random() < glitchChance

                    if (shouldGlitch) {
                        return {
                            char: chars[
                                Math.floor(Math.random() * chars.length)
                            ],
                            glitch: true,
                        }
                    }

                    return {
                        char: original[index],
                        glitch: false,
                    }
                })
            )

            iteration++

            if (iteration > maxIterations) {
                stop()
            }
        }, 40)
    }

    const handleClick = () => {
        if (!link) return

        const isExternal =
            typeof link === "string" &&
            (link.startsWith("http://") || link.startsWith("https://"))

        if (isExternal || newTab) {
            window.open(link, newTab ? "_blank" : "_self")
        } else {
            window.location.href = link
        }
    }

    return (
        <a
            href={link}
            target={newTab ? "_blank" : "_self"}
            rel="noopener noreferrer"
            onMouseEnter={() => {
                setHovered(true)
                start()
            }}
            onMouseLeave={() => {
                setHovered(false)
                stop()
            }}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                gap: 8,
                padding: `${paddingY}px ${paddingX}px`,
                borderRadius: borderRadius,
                background: bgColor,
                cursor: "pointer",
                transform: hovered
                    ? "translateY(-1px) scale(1.02)"
                    : "translateY(0) scale(1)",
                transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                border: "none",
                outline: "none",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    whiteSpace: "nowrap",
                    fontSize,
                    fontWeight,
                    fontFamily: fontFamily || "Inter, sans-serif",
                    letterSpacing,
                    lineHeight,
                }}
            >
                {letters.map((l, i) => (
                    <span
                        key={i}
                        style={{ color: l.glitch ? glitchColor : textColor }}
                    >
                        {l.char === " " ? "\u00A0" : l.char}
                    </span>
                ))}
            </div>
            {showBadge && badge && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: `${fontSize * 0.35}px ${fontSize * 0.6}px`,
                        minWidth: fontSize * 1.2,
                        height: fontSize * 1.2,
                        borderRadius: fontSize * 1,
                        background: badgeBg,
                        fontSize: fontSize * 0.65,
                        fontWeight: fontWeight,
                        color: badgeColor,
                    }}
                >
                    {badge}
                </div>
            )}
        </a>
    )
}
addPropertyControls(GlitchButton, {
    text: {
        type: ControlType.String,
        defaultValue: "Get Started",
    },
    badge: {
        type: ControlType.String,
        defaultValue: "NEW",
    },
    showBadge: {
        type: ControlType.Boolean,
        defaultValue: true,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "/",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    fontSize: {
        type: ControlType.Number,
        defaultValue: 16,
    },
    fontWeight: {
        type: ControlType.Enum,
        options: ["400", "500", "600", "700", "800"],
        defaultValue: "500",
    },
    fontFamily: {
        type: ControlType.String,
        defaultValue: "Inter",
    },
    letterSpacing: {
        type: ControlType.Number,
        defaultValue: 0,
    },
    lineHeight: {
        type: ControlType.Number,
        defaultValue: 1.2,
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    glitchColor: {
        type: ControlType.Color,
        defaultValue: "#FFD84D",
    },
    bgColor: {
        type: ControlType.Color,
        defaultValue: "#0F0F0F",
    },
    badgeBg: {
        type: ControlType.Color,
        defaultValue: "#FFD84D",
    },
    badgeColor: {
        type: ControlType.Color,
        defaultValue: "#0F0F0F",
    },
    paddingX: {
        type: ControlType.Number,
        defaultValue: 16,
    },
    paddingY: {
        type: ControlType.Number,
        defaultValue: 12,
    },
    borderRadius: {
        type: ControlType.Number,
        defaultValue: 999,
    },
})
