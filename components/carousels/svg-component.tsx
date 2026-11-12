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


/**
 * @framerIntrinsicWidth 24
 * @framerIntrinsicHeight 24
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const allowedTags = [
    "svg",
    "path",
    "circle",
    "rect",
    "line",
    "polyline",
    "polygon",
    "ellipse",
    "g",
    "defs",
    "linearGradient",
    "radialGradient",
    "stop",
    "clipPath",
    "pattern",
    "mask",
]

const reactAttributes: Record<string, string> = {
    "stroke-width": "strokeWidth",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-opacity": "strokeOpacity",
    "fill-rule": "fillRule",
    "fill-opacity": "fillOpacity",
    "clip-rule": "clipRule",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "vector-effect": "vectorEffect",
    viewbox: "viewBox",
    preserveaspectratio: "preserveAspectRatio",
    class: "className",
    "xmlns:xlink": "xmlnsXlink",
    "xml:space": "xmlSpace",
}

function parseStyle(styleStr: string, colorMap?: Record<string, string>) {
    const styleObj: any = {}
    styleStr.split(";").forEach((rule) => {
        const parts = rule.split(":")
        if (parts.length >= 2) {
            const key = parts[0].trim()
            let value = parts.slice(1).join(":").trim()
            if (key && value) {
                // Convert kebab-case to camelCase
                const camelKey = key.replace(/-([a-z])/g, (g) =>
                    g[1].toUpperCase()
                )

                if (
                    colorMap &&
                    (camelKey === "fill" ||
                        camelKey === "stroke" ||
                        camelKey === "stopColor" ||
                        camelKey === "color")
                ) {
                    const lowerVal = value.toLowerCase()
                    if (colorMap[lowerVal]) {
                        value = colorMap[lowerVal]
                    }
                }

                styleObj[camelKey] = value
            }
        }
    })
    return styleObj
}

function extractUniqueColors(svg: string): string[] {
    if (!svg) return []
    const colorMatches = svg.match(
        /(?:fill|stroke|stop-color|color)\s*[:=]\s*(?:['"]?)([^'"\s;>]+)/gi
    )
    if (!colorMatches) return []

    const colors = new Set<string>()
    colorMatches.forEach((match) => {
        const parts = match.split(/[:=]/)
        if (parts.length > 1) {
            let val = parts
                .slice(1)
                .join(":")
                .replace(/['"]/g, "")
                .trim()
                .toLowerCase()
            if (
                val !== "none" &&
                val !== "transparent" &&
                val !== "inherit" &&
                !val.startsWith("url(")
            ) {
                colors.add(val)
            }
        }
    })
    return Array.from(colors)
}

function convertToReact(
    node: Node,
    index: number | string,
    colorMap?: Record<string, string>
): React.ReactNode {
    if (node.nodeType === 3) return node.textContent
    if (node.nodeType !== 1) return null

    const element = node as Element
    const originalTagName = element.tagName

    // Find the correctly cased tag name from allowedTags (e.g. linearGradient)
    const matchedTag = allowedTags.find(
        (tag) => tag.toLowerCase() === originalTagName.toLowerCase()
    )

    if (!matchedTag) return null
    const tagName = matchedTag

    const props: any = { key: index }

    let svgWidth: string | null = null
    let svgHeight: string | null = null

    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        const name = attr.name
        const lowerName = name.toLowerCase()

        // Skip event listeners and dangerous attributes
        if (
            lowerName.startsWith("on") ||
            lowerName === "href" ||
            lowerName === "xlink:href" ||
            lowerName === "script"
        ) {
            continue
        }

        if (lowerName === "style") {
            props.style = {
                ...(props.style || {}),
                ...parseStyle(attr.value, colorMap),
            }
            continue
        }

        if (tagName === "svg") {
            if (lowerName === "width") svgWidth = attr.value
            if (lowerName === "height") svgHeight = attr.value
        }

        const reactName = reactAttributes[lowerName] || name
        let finalValue = attr.value

        if (
            colorMap &&
            (reactName === "fill" ||
                reactName === "stroke" ||
                reactName === "stopColor" ||
                reactName === "color")
        ) {
            const lowerVal = finalValue.toLowerCase()
            if (colorMap[lowerVal]) {
                finalValue = colorMap[lowerVal]
            }
        }

        props[reactName] = finalValue
    }

    if (tagName === "svg") {
        // Automatically inject a viewBox if missing, based on fixed width/height
        if (!props.viewBox && svgWidth && svgHeight) {
            const w = parseFloat(svgWidth)
            const h = parseFloat(svgHeight)
            if (
                !isNaN(w) &&
                !isNaN(h) &&
                !svgWidth.includes("%") &&
                !svgHeight.includes("%")
            ) {
                props.viewBox = `0 0 ${w} ${h}`
            }
        }

        // Derive intrinsic dimensions to prevent the browser defaulting to 300x150 in "Fit Content" mode
        let intrinsicWidth = svgWidth
        let intrinsicHeight = svgHeight

        if (
            (!intrinsicWidth || intrinsicWidth.includes("%")) &&
            props.viewBox
        ) {
            const parts = props.viewBox
                .trim()
                .split(/[\s,]+/)
                .filter(Boolean)
            if (parts.length >= 4) {
                intrinsicWidth = parts[2]
                intrinsicHeight = parts[3]
            }
        }

        props.width = intrinsicWidth || "100%"
        props.height = intrinsicHeight || "100%"

        props.style = {
            maxWidth: "100%",
            maxHeight: "100%",
            minWidth: "100%",
            minHeight: "100%",
        }

        props.preserveAspectRatio = "xMidYMid meet"
    }

    const children: React.ReactNode[] = []
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = convertToReact(element.childNodes[i], i, colorMap)
        if (child) children.push(child)
    }

    return React.createElement(tagName, props, ...children)
}

export default function IconSystem(props) {
    const {
        svgCode,
        useFill,
        strokeWidth,
        internalScale,
        themeColors,
        customizeColors,
    } = props

    const parsedSvgData = React.useMemo(() => {
        if (typeof window === "undefined" || !svgCode || svgCode.trim() === "")
            return null

        const colorMap: Record<string, string> = {}
        if (!customizeColors && themeColors && Array.isArray(themeColors)) {
            const uniqueColors = extractUniqueColors(svgCode)
            themeColors.forEach((color, index) => {
                if (uniqueColors[index] && color) {
                    colorMap[uniqueColors[index]] = color
                }
            })
        }

        try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(svgCode, "image/svg+xml")

            const parserError = doc.querySelector("parsererror")
            if (parserError) {
                console.error("SVG Parse Error", parserError.textContent)
                return null
            }

            const svgNode = doc.querySelector("svg")
            if (svgNode) {
                const element = convertToReact(svgNode, "root", colorMap)
                let ratio: string | undefined = undefined
                if (element && React.isValidElement(element)) {
                    const wNum = parseFloat(element.props.width)
                    const hNum = parseFloat(element.props.height)
                    if (!isNaN(wNum) && !isNaN(hNum)) {
                        ratio = `${wNum} / ${hNum}`
                    }
                }
                return { element, ratio }
            }
        } catch (e) {
            console.error("SVG Parse Error", e)
        }
        return null
    }, [svgCode, themeColors, customizeColors])

    if (!parsedSvgData || !svgCode || svgCode.trim() === "") {
        return (
            <div style={placeholderStyle}>
                <p style={{ fontSize: 10, opacity: 0.5 }}>Paste SVG</p>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${internalScale})`,
                fill: useFill ? "currentColor" : "none",
                stroke: !useFill ? "currentColor" : "none",
                strokeWidth: !useFill ? strokeWidth : 0,
                aspectRatio: parsedSvgData.ratio,
            }}
        >
            <div
                style={{
                    display: "contents",
                    width: "100%",
                    height: "100%",
                }}
            >
                {parsedSvgData.element}
            </div>
        </div>
    )
}

const placeholderStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed rgba(0,0,0,0.1)",
    borderRadius: 4,
}

IconSystem.defaultProps = {
    svgCode: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    themeColors: ["#0099FF"],
    useFill: true,
    strokeWidth: 2,
    internalScale: 1,
}

addPropertyControls(IconSystem, {
    svgCode: {
        type: ControlType.String,
        title: "SVG Code",
        displayTextArea: true,
        placeholder: "Paste <svg>...</svg> here",
        description:
            "Paste your raw SVG code. Fixed sizes will automatically adapt to Framer's layout.",
    },
    customizeColors: {
        type: ControlType.Boolean,
        title: "Colors",
        enabledTitle: "Original",
        disabledTitle: "Custom",
        defaultValue: true,
    },
    themeColors: {
        type: ControlType.Array,
        title: "Overrides",
        control: {
            type: ControlType.Color,
        },
        defaultValue: ["#0099FF"],
        maxCount: 5,
        hidden(props) {
            return props.customizeColors
        },
    },
    useFill: {
        type: ControlType.Boolean,
        title: "Mode",
        enabledTitle: "Fill",
        disabledTitle: "Stroke",
        defaultValue: true,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Thickness",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 2,
        hidden(props) {
            return props.useFill === true
        },
    },
    internalScale: {
        type: ControlType.Number,
        title: "Visual Scale",
        min: 0.1,
        max: 2,
        step: 0.01,
        defaultValue: 1,
    },
})
