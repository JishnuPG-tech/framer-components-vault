// Light/Dark mode toggle component for Framer with theme persistence
// Note: When this component runs inside any iframe (window !== window.parent),
// isInEditor() will return true, which also happens for external embeds, so
// theme changes are disabled in embedded previews.
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

import { useEffect, useState, startTransition } from "react"

interface TextThemeToggleProps {
    lightText: string
    darkText: string
    font: any
    colors: {
        activeColor: string
        inactiveColor: string
        activeBackground: string
        inactiveBackground: string
    }
    padding: string
    gap: number
    borderRadius: number
    hoverScale: number
    transitionDuration: number
    direction: "horizontal" | "vertical"
    alignment: "left" | "center" | "right"
    showSeparator: boolean
    separatorText: string
    separatorColor: string
    style?: CSSProperties
}

const isInEditor = () => {
    // Treat Framer design surfaces (Canvas/Thumbnail) as editor, but allow
    // preview/published sites and external embeds to run theme logic.
    try {
        return (
            RenderTarget.current() === RenderTarget.canvas ||
            RenderTarget.current() === RenderTarget.thumbnail ||
            RenderTarget.hasRestrictions()
        )
    } catch (e) {
        return false
    }
}

const changeTheme = (theme: string) => {
    if (typeof window === "undefined" || isInEditor()) return

    const htmlElement = document.documentElement
    const bodyElement = document.body

    htmlElement.setAttribute("data-theme", theme)
    bodyElement.setAttribute("data-theme", theme)

    if (theme === "system") {
        localStorage.removeItem("theme")
    } else {
        localStorage.setItem("theme", theme)
    }

    window.dispatchEvent(new Event("themeChange"))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerDisableUnlink
 *
 */
export default function TextThemeToggle(props: TextThemeToggleProps) {
    const {
        lightText,
        darkText,
        font,
        colors,
        padding,
        gap,
        borderRadius,
        hoverScale,
        transitionDuration,
        direction,
        alignment,
        showSeparator,
        separatorText,
        separatorColor,
        style,
    } = props

    const [currentTheme, setCurrentTheme] = useState<string>("dark")
    const [hoveredButton, setHoveredButton] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === "undefined" || isInEditor()) return

        const updateTheme = () => {
            const storedTheme = localStorage.getItem("theme")
            const detectedTheme = storedTheme || "dark"

            startTransition(() => {
                setCurrentTheme(detectedTheme)
            })
            changeTheme(detectedTheme)
        }

        updateTheme()

        // Collect CSS variables / dark rules
        let lightThemeTokens: string = ""
        let darkThemeTokens: string = ""

        try {
            for (let i = 0; i < document.styleSheets.length; i++) {
                const sheet = document.styleSheets[i] as CSSStyleSheet
                try {
                    const rules = sheet.cssRules || sheet.rules || []
                    for (let r = 0; r < rules.length; r++) {
                        const rule = rules[r] as CSSRule

                        // Check for body rules with CSS variables
                        if ((rule as CSSStyleRule).selectorText === "body") {
                            const ruleStyle = (rule as CSSStyleRule).style
                            const tokens: string[] = []
                            for (let j = 0; j < ruleStyle.length; j++) {
                                const propName = ruleStyle[j]
                                if (propName && propName.startsWith("--")) {
                                    const value =
                                        ruleStyle.getPropertyValue(propName)
                                    tokens.push(`${propName}: ${value};`)
                                }
                            }
                            if (tokens.length)
                                lightThemeTokens += tokens.join(" ")
                        }

                        // Check for dark mode media queries
                        if ((rule as CSSMediaRule).media) {
                            const mediaRule = rule as CSSMediaRule
                            const mediaText = mediaRule.media?.mediaText || ""

                            if (
                                mediaText.includes("prefers-color-scheme: dark")
                            ) {
                                try {
                                    const inner = mediaRule.cssRules || []
                                    for (let k = 0; k < inner.length; k++) {
                                        const innerRule = inner[
                                            k
                                        ] as CSSStyleRule
                                        if (innerRule.selectorText === "body") {
                                            const cssText =
                                                innerRule.cssText || ""
                                            const mediaRulesString = cssText
                                                .replace(/^body\s*{/, "")
                                                .replace(/}\s*$/, "")
                                                .trim()
                                            if (mediaRulesString) {
                                                darkThemeTokens +=
                                                    mediaRulesString + " "
                                            }
                                        }
                                    }
                                } catch (innerErr) {
                                    // Skip inaccessible inner rules
                                }
                            }
                        }
                    }
                } catch (e) {
                    // Skip stylesheets that can't be accessed (CORS)
                }
            }
        } catch (e) {
            console.warn("Error accessing stylesheets:", e)
        }

        let styleElement = document.getElementById(
            "data-theme-toggle"
        ) as HTMLStyleElement | null
        if (!styleElement) {
            styleElement = document.createElement("style")
            styleElement.id = "data-theme-toggle"
            document.head.appendChild(styleElement)
        }

        styleElement.textContent = `
          body[data-theme="light"] { ${lightThemeTokens} }
          body[data-theme="dark"]  { ${darkThemeTokens} }
          html[data-theme="light"] { color-scheme: light; }
          html[data-theme="dark"]  { color-scheme: dark; }
        `

        const handleThemeChange = () => {
            const storedTheme = localStorage.getItem("theme")
            if (storedTheme) {
                startTransition(() => {
                    setCurrentTheme(storedTheme)
                })
            }
        }

        window.addEventListener("themeChange", handleThemeChange)

        return () => {
            window.removeEventListener("themeChange", handleThemeChange)
        }
    }, [])

    const clickLightTheme = () => {
        startTransition(() => {
            setCurrentTheme("light")
            changeTheme("light")
        })
    }

    const clickDarkTheme = () => {
        startTransition(() => {
            setCurrentTheme("dark")
            changeTheme("dark")
        })
    }

    const baseButtonStyle: CSSProperties = {
        ...font,
        padding,
        cursor: "pointer",
        transition: `transform ${transitionDuration}s ease, color ${transitionDuration}s ease, background ${transitionDuration}s ease`,
        userSelect: "none",
        background: "none",
        border: "none",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: `${borderRadius}px`,
    }

    const getButtonStyle = (
        isActive: boolean,
        isHovered: boolean
    ): CSSProperties => ({
        ...baseButtonStyle,
        color: isActive ? colors.activeColor : colors.inactiveColor,
        backgroundColor: isActive
            ? colors.activeBackground
            : colors.inactiveBackground,
        transform: isHovered ? `scale(${hoverScale})` : "scale(1)",
    })

    const containerStyle: CSSProperties = {
        display: "flex",
        flexDirection: direction === "horizontal" ? "row" : "column",
        gap: `${gap}px`,
        alignItems:
            direction === "horizontal"
                ? "center"
                : alignment === "left"
                  ? "flex-start"
                  : alignment === "right"
                    ? "flex-end"
                    : "center",
        justifyContent:
            direction === "horizontal"
                ? alignment === "left"
                    ? "flex-start"
                    : alignment === "right"
                      ? "flex-end"
                      : "center"
                : "center",
        position: "relative",
        ...style,
    }

    const separatorStyle: CSSProperties = {
        ...font,
        color: separatorColor,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
    }

    return (
        <div style={containerStyle}>
            <button
                style={getButtonStyle(
                    currentTheme === "light",
                    hoveredButton === "light"
                )}
                onClick={clickLightTheme}
                onMouseEnter={() => setHoveredButton("light")}
                onMouseLeave={() => setHoveredButton(null)}
                type="button"
                aria-label="Switch to light theme"
            >
                {lightText}
            </button>
            {showSeparator && (
                <span style={separatorStyle} aria-hidden="true">
                    {separatorText}
                </span>
            )}
            <button
                style={getButtonStyle(
                    currentTheme === "dark",
                    hoveredButton === "dark"
                )}
                onClick={clickDarkTheme}
                onMouseEnter={() => setHoveredButton("dark")}
                onMouseLeave={() => setHoveredButton(null)}
                type="button"
                aria-label="Switch to dark theme"
            >
                {darkText}
            </button>
        </div>
    )
}

addPropertyControls(TextThemeToggle, {
    lightText: {
        type: ControlType.String,
        title: "Light Text",
        defaultValue: "LIGHT",
        description: "Text displayed for the light theme button",
    },
    darkText: {
        type: ControlType.String,
        title: "Dark Text",
        defaultValue: "DARK",
        description: "Text displayed for the dark theme button",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0.5px",
            lineHeight: "1em",
        },
        description: "Typography settings for button text",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        description: "Color settings for active and inactive states",
        controls: {
            activeColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#000000",
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inactive Color",
                defaultValue: "#999999",
            },
            activeBackground: {
                type: ControlType.Color,
                title: "Active Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            inactiveBackground: {
                type: ControlType.Color,
                title: "Inactive Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
        },
        defaultValue: {
            activeColor: "#000000",
            inactiveColor: "#999999",
            activeBackground: "rgba(0, 0, 0, 0)",
            inactiveBackground: "rgba(0, 0, 0, 0)",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "4px 8px",
        description: "Internal spacing for each button",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 2,
        unit: "px",
        description: "Space between light and dark buttons",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 6,
        unit: "px",
        description: "Corner rounding for buttons",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.5,
        step: 0.01,
        defaultValue: 1.05,
        description: "Scale multiplier when hovering over buttons",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
        unit: "s",
        description: "Animation speed for hover and theme changes",
    },
    showSeparator: {
        type: ControlType.Boolean,
        title: "Show Separator",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Display a separator between the buttons",
    },
    separatorText: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: "/",
        description: "Character(s) to display as separator (e.g., /, -, |)",
        hidden: ({ showSeparator }) => !showSeparator,
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator Color",
        defaultValue: "#999999",
        description: "Color of the separator text",
        hidden: ({ showSeparator }) => !showSeparator,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        description: "Layout direction for the buttons",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description:
            "Alignment of buttons within the container \n \n Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works)",
    },
})
