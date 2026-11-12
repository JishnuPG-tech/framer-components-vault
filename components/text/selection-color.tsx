// Text Highlight - Customizable browser text selection colors with theme support
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, type CSSProperties } from "react"

interface ScopeConfig {
    scope: "global" | "headings" | "links" | "code" | "inputs" | "custom"
    customSelector: string
    themeMode: boolean
    bg: string
    text: string
    lightBg: string
    lightText: string
    darkBg: string
    darkText: string
}

interface TextHighlightProps {
    scopes: ScopeConfig[]
    includeInputs: boolean
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 5
 * @framerIntrinsicHeight 5
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TextHighlight(props: TextHighlightProps) {
    const {
        scopes = [],
        includeInputs = true,
    } = props

    useEffect(() => {
        if (typeof document === "undefined") return

        const styleId = "framer-text-highlight-global"
        let styleEl = document.getElementById(styleId) as HTMLStyleElement

        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = styleId
            document.head.appendChild(styleEl)
        }

        const getSelectorForScope = (scope: string, customSelector: string): string => {
            switch (scope) {
                case "global":
                    return ""
                case "headings":
                    return "h1::selection, h2::selection, h3::selection, h4::selection, h5::selection, h6::selection"
                case "links":
                    return "a"
                case "code":
                    return "code, pre"
                case "inputs":
                    return "input, textarea"
                case "custom":
                    // Split custom selectors by comma and add ::selection to each
                    if (!customSelector || customSelector.trim() === "") return "*"
                    return customSelector
                        .split(",")
                        .map(s => s.trim())
                        .filter(s => s.length > 0)
                        .map(s => `${s}::selection`)
                        .join(", ")
                default:
                    return ""
            }
        }

        let css = ""

        // Sort scopes to ensure global is first
        const sortedScopes = [...scopes].sort((a, b) => {
            if (a.scope === "global") return -1
            if (b.scope === "global") return 1
            return 0
        })

        sortedScopes.forEach((scopeConfig) => {
            const selector = getSelectorForScope(scopeConfig.scope, scopeConfig.customSelector)
            
            // For headings and custom, the selector already includes ::selection
            const prefix = (scopeConfig.scope === "headings" || scopeConfig.scope === "custom")
                ? selector 
                : (selector ? `${selector}::selection` : "::selection")
            
            const mozPrefix = (scopeConfig.scope === "headings" || scopeConfig.scope === "custom")
                ? selector.replace(/::selection/g, "::-moz-selection")
                : (selector ? `${selector}::-moz-selection` : "::-moz-selection")

            if (scopeConfig.themeMode) {
                // Base styles (fallback)
                css += `
            ${prefix} {
                background-color: ${scopeConfig.lightBg};
                color: ${scopeConfig.lightText};
            }
            ${mozPrefix} {
                background-color: ${scopeConfig.lightBg};
                color: ${scopeConfig.lightText};
            }
            
            @media (prefers-color-scheme: light) {
                ${prefix} {
                    background-color: ${scopeConfig.lightBg};
                    color: ${scopeConfig.lightText};
                }
                ${mozPrefix} {
                    background-color: ${scopeConfig.lightBg};
                    color: ${scopeConfig.lightText};
                }
            }
            
            @media (prefers-color-scheme: dark) {
                ${prefix} {
                    background-color: ${scopeConfig.darkBg};
                    color: ${scopeConfig.darkText};
                }
                ${mozPrefix} {
                    background-color: ${scopeConfig.darkBg};
                    color: ${scopeConfig.darkText};
                }
            }
            `
            } else {
                css += `
            ${prefix} {
                background-color: ${scopeConfig.bg};
                color: ${scopeConfig.text};
            }
            ${mozPrefix} {
                background-color: ${scopeConfig.bg};
                color: ${scopeConfig.text};
            }
            `
            }
        })

        // Handle input exclusion if needed
        if (!includeInputs && !scopes.some(s => s.scope === "inputs")) {
            css += `
            input::selection,
            textarea::selection {
                background-color: Highlight;
                color: HighlightText;
            }
            input::-moz-selection,
            textarea::-moz-selection {
                background-color: Highlight;
                color: HighlightText;
            }
            `
        }

        // Forced colors mode for accessibility
        css += `
            @media (forced-colors: active) {
                ::selection {
                    background-color: Highlight;
                    color: HighlightText;
                }
                ::-moz-selection {
                    background-color: Highlight;
                    color: HighlightText;
                }
            }
        `

        styleEl.textContent = css

        return () => {
            // Cleanup: remove style when component unmounts
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl)
            }
        }
    }, [scopes, includeInputs])

    return <div style={{ width: 5, height: 5, pointerEvents: "none" }} />
}

addPropertyControls(TextHighlight, {
    scopes: {
        type: ControlType.Array,
        title: "Color Scopes",
        control: {
            type: ControlType.Object,
            controls: {
                scope: {
                    type: ControlType.Enum,
                    title: "Scope",
                    options: ["global", "headings", "links", "code", "inputs", "custom"],
                    optionTitles: ["Global", "Headings", "Links", "Code", "Inputs", "Custom"],
                    defaultValue: "global",
                },
                customSelector: {
                    type: ControlType.String,
                    title: "Custom Selector",
                    defaultValue: "",
                    placeholder: ".my-class, #my-id",
                    hidden: (props) => props.scope !== "custom",
                },
                themeMode: {
                    type: ControlType.Boolean,
                    title: "Theme Mode",
                    defaultValue: false,
                    enabledTitle: "Light/Dark",
                    disabledTitle: "Single",
                },
                bg: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#0099FF",
                    hidden: (props) => props.themeMode,
                },
                text: {
                    type: ControlType.Color,
                    title: "Text",
                    defaultValue: "#FFFFFF",
                    hidden: (props) => props.themeMode,
                },
                lightBg: {
                    type: ControlType.Color,
                    title: "Light BG",
                    defaultValue: "#0099FF",
                    hidden: (props) => !props.themeMode,
                },
                lightText: {
                    type: ControlType.Color,
                    title: "Light Text",
                    defaultValue: "#FFFFFF",
                    hidden: (props) => !props.themeMode,
                },
                darkBg: {
                    type: ControlType.Color,
                    title: "Dark BG",
                    defaultValue: "#8855FF",
                    hidden: (props) => !props.themeMode,
                },
                darkText: {
                    type: ControlType.Color,
                    title: "Dark Text",
                    defaultValue: "#FFFFFF",
                    hidden: (props) => !props.themeMode,
                },
            },
        },
        defaultValue: [
            {
                scope: "global",
                customSelector: "",
                themeMode: false,
                bg: "#0099FF",
                text: "#FFFFFF",
                lightBg: "#0099FF",
                lightText: "#FFFFFF",
                darkBg: "#8855FF",
                darkText: "#FFFFFF",
            },
        ],
        maxCount: 10,
    },
    includeInputs: {
        type: ControlType.Boolean,
        title: "Include Inputs",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})