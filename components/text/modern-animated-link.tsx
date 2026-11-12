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

import type { CSSProperties } from "react"

/**
 * User wants: "only variant 4" and center it both horizontally/vertically with responsive sizing.
 */

type Variant = "4"

type Align = "start" | "center" | "end"

type Item = {
    label: string
    url: string
    variant: Variant
    enabled: boolean
    colors?: Partial<{
        textColor: string
        hoverTextColor: string
        lineColor: string
        hoverLineColor: string
    }>

    padding?: Partial<{
        padTop: number
        padRight: number
        padBottom: number
        padLeft: number
    }>

    variant4Colors?: Item["colors"]
    variant4Padding?: Item["padding"]
    variant4Font?: any
    variant4TextTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
}

type Props = {
    // Single link only
    label: string
    url: string

    // Type
    font: any
    uppercase: boolean

    // Colors
    textColor: string
    hoverTextColor: string
    lineColor: string
    hoverLineColor: string

    openInNewTab: boolean

    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ArrowedLinksHover12(props: Props) {
    const {
        label = "Link here",
        url = "#",

        font,
        uppercase = false,

        textColor = "#000000",
        hoverTextColor = "#000000",
        lineColor = "rgba(0,0,0,0.5)",
        hoverLineColor = "#000000",

        openInNewTab = false,

        style,
    } = props

    const scopeId = React.useId().replace(/:/g, "")
    const scopeClass = `alh12_${scopeId}`

    const targetProps = React.useMemo(() => {
        if (!openInNewTab) return {}
        return { target: "_blank", rel: "noreferrer noopener" }
    }, [openInNewTab])

    const textTransform = uppercase ? "uppercase" : undefined
    const displayLabel = applyTextTransform(label, textTransform)

    const css = React.useMemo(() => {
        const s = `

/* Scope */
.${scopeClass}{
  --alh-text: ${textColor};
  --alh-hoverText: ${hoverTextColor};
  --alh-line: ${lineColor};
  --alh-hoverLine: ${hoverLineColor};

  --s4-line: var(--alh-line);
  --s4-color: var(--alh-text);
}

.${scopeClass} .linkWrap{
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Reset */
.${scopeClass} a{
  font: inherit;
}

.${scopeClass} .alh-link{
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.${scopeClass} .alh-link:focus-visible{
  outline: none;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.16);
  border-radius: 10px;
}

/* ============ STYLE 4 ============ */
.${scopeClass} .style-4{
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--s4-color);
  position: relative;
  padding: 0;
  --background-size: 100%;
  --background-delay: 0.15s;
  --stroke-dashoffset: 46;
  --stroke-duration: 0.15s;
  --stroke-easing: linear;
  --stroke-delay: 0s;
}

.${scopeClass} .style-4 span{
  background-image: linear-gradient(0deg, var(--s4-line) 0%, var(--s4-line) 100%);
  background-position: 100% 100%;
  background-repeat: no-repeat;
  background-size: var(--background-size, 100%) 1px;
  transition: background-size 0.2s linear var(--background-delay, 0.15s);
  transform: translateZ(0);
}

.${scopeClass} .style-4 svg{
  vertical-align: top;
  display: inline;
  line-height: 1;
  width: 1.3em;
  height: 2em;
  position: relative;
  top: -0.6px;
  left: -0.1em;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1px;
  stroke: var(--s4-line);
  stroke-dasharray: 7.95 30;
  stroke-dashoffset: var(--stroke-dashoffset, 46);
  transition: stroke-dashoffset var(--stroke-duration, 0.15s) var(--stroke-easing, linear) var(--stroke-delay, 0s);
}

.${scopeClass} .style-4:hover{
  --background-size: 0%;
  --background-delay: 0s;
  --stroke-dashoffset: 26;
  --stroke-duration: 0.3s;
  --stroke-easing: cubic-bezier(0.3, 1.5, 0.5, 1);
  --stroke-delay: 0.195s;
  --s4-line: var(--alh-hoverLine);
  color: var(--alh-hoverText);
}

`
        return s
    }, [scopeClass, textColor, hoverTextColor, lineColor, hoverLineColor])

    return (
        <div
            className={scopeClass}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                ...font,
                textTransform,
                ...style,
            }}
        >
            <style>{css}</style>

            <div className="linkWrap">
                <a
                    className="alh-link style-4"
                    href={url}
                    aria-label={label}
                    {...targetProps}
                >
                    <span>{displayLabel}</span>
                    <svg
                        viewBox="0 0 13 20"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <polyline points="0.5 19.5 3 19.5 12.5 10 3 0.5" />
                    </svg>
                </a>
            </div>
        </div>
    )
}

function applyTextTransform(text: string, transform?: string) {
    const t = (transform || "").toLowerCase()
    if (!t || t === "none") return text
    if (t === "uppercase") return text.toUpperCase()
    if (t === "lowercase") return text.toLowerCase()
    if (t === "capitalize") {
        return text
            .toLowerCase()
            .replace(
                /(^|\\s|[-_])([a-z])/g,
                (m, p1, p2) => `${p1}${String(p2).toUpperCase()}`
            )
    }
    return text
}

const defaultItems: Item[] = [
    { enabled: true, label: "Link here", url: "#", variant: "4" },
]

addPropertyControls(ArrowedLinksHover12, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Link here",
    },
    url: {
        type: ControlType.Link,
        title: "URL",
        defaultValue: "#",
    },

    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        displayFontSize: true,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#000000",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "#CCCCCC",
    },
    hoverLineColor: {
        type: ControlType.Color,
        title: "Hover Line",
        defaultValue: "#000000",
    },
})
