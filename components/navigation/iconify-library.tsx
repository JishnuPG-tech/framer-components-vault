// ./Iconify/IconifyIcon.tsx

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { CSSProperties, useMemo, useState, useEffect } from "react"

// ─── Sanitização ────────────────────────────────────────────────────────────

// ADICIONADO: Tags de animação (animate, animateTransform, style, etc)
const ALLOWED_SVG_TAGS = new Set(
    [
        "svg",
        "g",
        "path",
        "rect",
        "circle",
        "ellipse",
        "line",
        "polyline",
        "polygon",
        "text",
        "tspan",
        "defs",
        "symbol",
        "use",
        "clipPath",
        "mask",
        "pattern",
        "linearGradient",
        "radialGradient",
        "stop",
        "title",
        "desc",
        "style",
        "animate",
        "animateTransform",
        "animateMotion",
        "set",
    ].map((tag) => tag.toLowerCase())
)

// ADICIONADO: Atributos de animação e estilo
const ALLOWED_SVG_ATTRS = new Set(
    [
        "xmlns",
        "viewBox",
        "width",
        "height",
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-miterlimit",
        "stroke-dasharray",
        "stroke-dashoffset",
        "stroke-opacity",
        "fill-opacity",
        "opacity",
        "d",
        "cx",
        "cy",
        "r",
        "rx",
        "ry",
        "x",
        "y",
        "x1",
        "y1",
        "x2",
        "y2",
        "points",
        "transform",
        "clip-path",
        "mask",
        "id",
        "class",
        "gradientUnits",
        "gradientTransform",
        "patternUnits",
        "patternTransform",
        "fx",
        "fy",
        "offset",
        "stop-color",
        "stop-opacity",
        "xlink:href",
        "href",
        "clipPathUnits",
        "maskUnits",
        "text-anchor",
        "dominant-baseline",
        "font-size",
        "font-family",
        "letter-spacing",
        "word-spacing",
        "preserveAspectRatio",
        // Atributos de animação / SMIL e inline styles
        "style",
        "attributename",
        "type",
        "values",
        "keytimes",
        "dur",
        "repeatcount",
        "begin",
        "calcmode",
        "keysplines",
        "additive",
        "accumulate",
        "from",
        "to",
        "restart",
    ].map((attr) => attr.toLowerCase())
)

function cleanNode(node: Element) {
    if (!ALLOWED_SVG_TAGS.has(node.tagName.toLowerCase())) {
        node.parentNode?.removeChild(node)
        return
    }

    const attrsToRemove: string[] = []
    for (const attr of Array.from(node.attributes)) {
        const name = attr.name.toLowerCase()
        const value = attr.value.trim().toLowerCase()
        if (name.startsWith("on")) {
            attrsToRemove.push(attr.name)
            continue
        }
        if (
            (name === "href" || name === "xlink:href") &&
            value.startsWith("http")
        ) {
            attrsToRemove.push(attr.name)
            continue
        }
        if (value.startsWith("javascript:")) {
            attrsToRemove.push(attr.name)
            continue
        }
        if (!ALLOWED_SVG_ATTRS.has(name)) attrsToRemove.push(attr.name)
    }
    attrsToRemove.forEach((a) => node.removeAttribute(a))
    Array.from(node.children).forEach(cleanNode)
}

function sanitizeSvg(svgString: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, "image/svg+xml")
    if (doc.querySelector("parsererror")) return ""
    cleanNode(doc.documentElement)
    return doc.documentElement.outerHTML
}

function processSvg(svgString: string, color: string): string {
    // Força o SVG a preencher 100% do container e remove dimensões fixas no root
    return svgString
        .replace(/<svg([^>]*)>/i, (match, attrs) => {
            // Remove width e height fixos, mantém viewBox
            let cleaned = attrs
                .replace(/\s*width="[^"]*"/gi, "")
                .replace(/\s*height="[^"]*"/gi, "")
                .replace(/\s*style="[^"]*"/gi, "")

            // Aplica cor via currentColor se necessário
            const colorStyle = `style="color: ${color}; width: 100%; height: 100%; display: block;"`

            return `<svg${cleaned} ${colorStyle}>`
        })
        .replace(/fill="currentColor"/gi, `fill="${color}"`)
        .replace(/stroke="currentColor"/gi, `stroke="${color}"`)
}

// ─── Cache & Hook ────────────────────────────────────────────────────────────

const cache = new Map<string, string>()

function useIconify(iconName: string, color: string) {
    const [svg, setSvg] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const safeName = typeof iconName === "string" ? iconName.trim() : ""
        const [prefix, name] = safeName.split(":")

        if (!prefix || !name) {
            setLoading(false)
            setError(true)
            return
        }

        const cacheKey = `${safeName}::${color}`
        if (cache.has(cacheKey)) {
            setSvg(cache.get(cacheKey)!)
            setLoading(false)
            setError(false)
            return
        }

        setLoading(true)
        setError(false)

        fetch(`https://api.iconify.design/${prefix}/${name}.svg`)
            .then((res) => {
                if (!res.ok) throw new Error("Not found")
                return res.text()
            })
            .then((raw) => {
                const sanitized = sanitizeSvg(raw)
                if (!sanitized) throw new Error("Invalid SVG")
                const processed = processSvg(sanitized, color)
                cache.set(cacheKey, processed)
                setSvg(processed)
                setLoading(false)
            })
            .catch(() => {
                setError(true)
                setLoading(false)
            })
    }, [iconName, color])

    return { svg, loading, error }
}

// ─── Componente ──────────────────────────────────────────────────────────────

interface IconifyProps {
    iconName: string
    color?: string
    rotate?: number
    flipHorizontal?: boolean
    flipVertical?: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth
 * @framerSupportedLayoutHeight
 * @framerDisableUnlink
 */
export default function IconifyIcon({
    iconName = "mdi:home",
    color = "#000000",
    rotate = 0,
    flipHorizontal = false,
    flipVertical = false,
    style,
}: IconifyProps) {
    const { svg, loading, error } = useIconify(iconName, color)

    const transform = useMemo(() => {
        const transforms: string[] = []
        if (rotate) transforms.push(`rotate(${rotate}deg)`)
        if (flipHorizontal) transforms.push("scaleX(-1)")
        if (flipVertical) transforms.push("scaleY(-1)")
        return transforms.length ? transforms.join(" ") : undefined
    }, [rotate, flipHorizontal, flipVertical])

    const fallbackStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontSize: 10,
        fontFamily: "sans-serif",
        padding: 8,
        borderRadius: 4,
        overflow: "hidden",
        ...style,
    }

    if (loading)
        return (
            <div
                style={{
                    ...fallbackStyle,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    color: "#888",
                }}
            >
                Loading...
            </div>
        )

    if (error || !svg)
        return (
            <div
                style={{
                    ...fallbackStyle,
                    backgroundColor: "rgba(255,0,0,0.1)",
                    color: "red",
                }}
            >
                Ícone não encontrado:
                <br />
                <b>{iconName || "Vazio"}</b>
            </div>
        )

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                transform,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                ...style,
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}

addPropertyControls(IconifyIcon, {
    iconName: {
        type: ControlType.String,
        title: "Icon Name",
        defaultValue: "mdi:home",
    },
    color: {
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    rotate: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
    },
    flipHorizontal: {
        type: ControlType.Boolean,
        defaultValue: false,
    },
    flipVertical: {
        type: ControlType.Boolean,
        defaultValue: false,
    },
})

IconifyIcon.displayName = "Iconify Icon"
