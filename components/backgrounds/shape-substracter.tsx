// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState, useRef, useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
type IconSource = "custom" | "phosphor"
type PhosphorWeight = "regular" | "bold" | "light" | "thin" | "fill" | "duotone"

// ─── Phosphor CDN URL builder ─────────────────────────────────────────────────
// Uses the official unpkg CDN for @phosphor-icons/core
// Regular icons: `{name}.svg`, all others: `{name}-{weight}.svg`
function phosphorUrl(name: string, weight: PhosphorWeight): string {
    const base = "https://unpkg.com/@phosphor-icons/core@2.1.1/assets"
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-")
    const file = weight === "regular" ? `${slug}.svg` : `${slug}-${weight}.svg`
    return `${base}/${weight}/${file}`
}

// ─── SVG Parser (DOMParser-based, no regex) ───────────────────────────────────
function parseSvgWithDOMParser(svgCode: string): {
    paths: string[]
    viewBoxWidth: number
    viewBoxHeight: number
    error: string | null
} {
    const fallback = {
        paths: [],
        viewBoxWidth: 24,
        viewBoxHeight: 24,
        error: null,
    }

    if (!svgCode || typeof svgCode !== "string" || !svgCode.trim()) {
        return fallback
    }

    const trimmed = svgCode.trim()
    const looksLikeSvg = trimmed.startsWith("<svg") || trimmed.includes("<svg ")
    const looksLikePathOnly =
        /^[MmLlHhVvCcSsQqTtAaZz]/.test(trimmed) && !trimmed.includes("<")

    if (!looksLikeSvg && !looksLikePathOnly) {
        return { ...fallback, error: "Input does not appear to be valid SVG." }
    }

    if (looksLikePathOnly) {
        return {
            paths: [trimmed],
            viewBoxWidth: 24,
            viewBoxHeight: 24,
            error: null,
        }
    }

    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(svgCode, "image/svg+xml")

        if (doc.querySelector("parsererror")) {
            return {
                ...fallback,
                error: "SVG could not be parsed. Check that it is well-formed XML.",
            }
        }

        const svgEl = doc.querySelector("svg")
        if (!svgEl) {
            return { ...fallback, error: "No <svg> element found in input." }
        }

        let viewBoxWidth = 24
        let viewBoxHeight = 24
        const viewBox = svgEl.getAttribute("viewBox")
        if (viewBox) {
            const parts = viewBox.trim().split(/[\s,]+/)
            if (parts.length === 4) {
                const w = parseFloat(parts[2])
                const h = parseFloat(parts[3])
                if (!isNaN(w) && w > 0) viewBoxWidth = w
                if (!isNaN(h) && h > 0) viewBoxHeight = h
            }
        } else {
            const w = parseFloat(svgEl.getAttribute("width") || "")
            const h = parseFloat(svgEl.getAttribute("height") || "")
            if (!isNaN(w) && w > 0) viewBoxWidth = w
            if (!isNaN(h) && h > 0) viewBoxHeight = h
        }

        const paths = Array.from(doc.querySelectorAll("path"))
            .map((el) => el.getAttribute("d") || "")
            .filter((d) => d.trim().length > 0)

        if (paths.length === 0) {
            return {
                ...fallback,
                viewBoxWidth,
                viewBoxHeight,
                error: "No <path> elements found. Only path-based SVGs are supported.",
            }
        }

        return { paths, viewBoxWidth, viewBoxHeight, error: null }
    } catch {
        return { ...fallback, error: "Unexpected error while parsing SVG." }
    }
}

// ─── Rounded-rect path (stable, outside component) ───────────────────────────
function createRoundedRectPath(
    w: number,
    h: number,
    tl: number,
    tr: number,
    br: number,
    bl: number
): string {
    const scaleH = Math.min(
        1,
        w / Math.max(tl + tr, 0.001),
        w / Math.max(bl + br, 0.001)
    )
    const scaleV = Math.min(
        1,
        h / Math.max(tl + bl, 0.001),
        h / Math.max(tr + br, 0.001)
    )
    const s = Math.min(scaleH, scaleV)
    tl *= s
    tr *= s
    br *= s
    bl *= s

    return [
        `M ${tl} 0`,
        `L ${w - tr} 0`,
        `Q ${w} 0 ${w} ${tr}`,
        `L ${w} ${h - br}`,
        `Q ${w} ${h} ${w - br} ${h}`,
        `L ${bl} ${h}`,
        `Q 0 ${h} 0 ${h - bl}`,
        `L 0 ${tl}`,
        `Q 0 0 ${tl} 0`,
        `Z`,
    ].join(" ")
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SubtractComponent({
    backgroundColor,
    iconSource,
    // Phosphor props
    phosphorIconName,
    phosphorWeight,
    // Custom SVG props
    iconSvgCode,
    iconSvgFile,
    // Shared props
    iconSize,
    blur,
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
}) {
    const [size, setSize] = useState({ width: 100, height: 100 })

    // Custom SVG file state
    const [uploadedSvg, setUploadedSvg] = useState("")
    const [customLoading, setCustomLoading] = useState(false)
    const [customFetchError, setCustomFetchError] = useState<string | null>(
        null
    )

    // Phosphor icon state
    const [phosphorSvg, setPhosphorSvg] = useState("")
    const [phosphorLoading, setPhosphorLoading] = useState(false)
    const [phosphorFetchError, setPhosphorFetchError] = useState<string | null>(
        null
    )

    const [maskDataUrl, setMaskDataUrl] = useState("")
    const containerRef = useRef<HTMLDivElement>(null)
    const maskId = useRef(
        `mask-${Math.random().toString(36).substring(2, 11)}`
    ).current

    // Track container dimensions
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () =>
            setSize({ width: el.offsetWidth, height: el.offsetHeight })
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // ── Fetch custom SVG file ────────────────────────────────────────────────
    useEffect(() => {
        if (!iconSvgFile || iconSource !== "custom") {
            setUploadedSvg("")
            setCustomFetchError(null)
            setCustomLoading(false)
            return
        }

        const controller = new AbortController()
        setCustomLoading(true)
        setCustomFetchError(null)
        setUploadedSvg("")

        fetch(iconSvgFile, { signal: controller.signal })
            .then((res) => {
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                return res.text()
            })
            .then((text) => {
                setUploadedSvg(text)
                setCustomFetchError(null)
                setCustomLoading(false)
            })
            .catch((err) => {
                if (err.name === "AbortError") return
                console.error("SubtractComponent: Error loading SVG file:", err)
                setUploadedSvg("")
                setCustomFetchError(`Could not load SVG file: ${err.message}`)
                setCustomLoading(false)
            })

        return () => controller.abort()
    }, [iconSvgFile, iconSource])

    // ── Fetch Phosphor icon ──────────────────────────────────────────────────
    useEffect(() => {
        if (iconSource !== "phosphor" || !phosphorIconName?.trim()) {
            setPhosphorSvg("")
            setPhosphorFetchError(null)
            setPhosphorLoading(false)
            return
        }

        const controller = new AbortController()
        setPhosphorLoading(true)
        setPhosphorFetchError(null)
        setPhosphorSvg("")

        const url = phosphorUrl(phosphorIconName, phosphorWeight)

        fetch(url, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) {
                    // 404 most likely means the icon name is wrong
                    if (res.status === 404) {
                        throw new Error(
                            `Icon "${phosphorIconName}" not found in Phosphor (${phosphorWeight}). ` +
                                `Check the name at phosphoricons.com`
                        )
                    }
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
                }
                return res.text()
            })
            .then((text) => {
                setPhosphorSvg(text)
                setPhosphorFetchError(null)
                setPhosphorLoading(false)
            })
            .catch((err) => {
                if (err.name === "AbortError") return
                console.error(
                    "SubtractComponent: Error loading Phosphor icon:",
                    err
                )
                setPhosphorSvg("")
                setPhosphorFetchError(err.message)
                setPhosphorLoading(false)
            })

        return () => controller.abort()
    }, [iconSource, phosphorIconName, phosphorWeight])

    // ── Resolve which SVG code is active ─────────────────────────────────────
    const activeSvgCode = useMemo(() => {
        if (iconSource === "phosphor") return phosphorSvg
        return uploadedSvg || iconSvgCode
    }, [iconSource, phosphorSvg, uploadedSvg, iconSvgCode])

    const isLoading =
        iconSource === "phosphor" ? phosphorLoading : customLoading

    const fetchError =
        iconSource === "phosphor" ? phosphorFetchError : customFetchError

    // ── Parse SVG (memoized to keep paths reference stable) ──────────────────
    const {
        paths,
        viewBoxWidth,
        viewBoxHeight,
        error: parseError,
    } = useMemo(() => parseSvgWithDOMParser(activeSvgCode), [activeSvgCode])

    // Only show parse error once loading is done
    const activeError = fetchError ?? (isLoading ? null : parseError)

    // Icon sizing and centering
    const scale = iconSize / Math.max(viewBoxWidth, viewBoxHeight)
    const iconX = (size.width - viewBoxWidth * scale) / 2
    const iconY = (size.height - viewBoxHeight * scale) / 2

    const rectPath = useMemo(
        () =>
            createRoundedRectPath(
                size.width,
                size.height,
                topLeft,
                topRight,
                bottomRight,
                bottomLeft
            ),
        [size.width, size.height, topLeft, topRight, bottomRight, bottomLeft]
    )

    // ── Build backdrop-blur mask data URL ─────────────────────────────────────
    useEffect(() => {
        if (size.width <= 0 || size.height <= 0 || paths.length === 0) {
            setMaskDataUrl("")
            return
        }

        const escapePath = (d: string) => d.replace(/"/g, "&quot;")

        const pathsMarkup = paths
            .map(
                (d) =>
                    `<path d="${escapePath(d)}" fill="black" transform="translate(${iconX},${iconY}) scale(${scale})" />`
            )
            .join("")

        const svg =
            `<svg width="${size.width}" height="${size.height}" ` +
            `viewBox="0 0 ${size.width} ${size.height}" xmlns="http://www.w3.org/2000/svg">` +
            `<defs><mask id="m">` +
            `<path d="${escapePath(rectPath)}" fill="white" />` +
            pathsMarkup +
            `</mask></defs>` +
            `<rect width="${size.width}" height="${size.height}" fill="white" mask="url(#m)" />` +
            `</svg>`

        setMaskDataUrl(`data:image/svg+xml,${encodeURIComponent(svg)}`)
    }, [size, rectPath, paths, iconX, iconY, scale])

    // ── Error state ───────────────────────────────────────────────────────────
    if (activeError) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 100,
                    minHeight: 100,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 60, 60, 0.08)",
                    border: "1.5px dashed rgba(255, 60, 60, 0.5)",
                    borderRadius: 8,
                    padding: 12,
                    boxSizing: "border-box",
                    gap: 6,
                }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle
                        cx="10"
                        cy="10"
                        r="9"
                        stroke="rgba(255,60,60,0.8)"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M10 5.5V11"
                        stroke="rgba(255,60,60,0.8)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="10"
                        cy="13.5"
                        r="1"
                        fill="rgba(255,60,60,0.8)"
                    />
                </svg>
                <span
                    style={{
                        fontSize: 11,
                        lineHeight: 1.4,
                        color: "rgba(255,60,60,0.9)",
                        textAlign: "center",
                        fontFamily: "monospace",
                        maxWidth: 220,
                    }}
                >
                    {activeError}
                </span>
            </div>
        )
    }

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 100,
                    minHeight: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.4,
                }}
            >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="25 15"
                        strokeLinecap="round"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 10 10"
                            to="360 10 10"
                            dur="0.8s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            </div>
        )
    }

    // ── Normal render ─────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
            }}
        >
            {blur > 0 && maskDataUrl && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backdropFilter: `blur(${blur}px)`,
                        WebkitBackdropFilter: `blur(${blur}px)`,
                        maskImage: `url("${maskDataUrl}")`,
                        WebkitMaskImage: `url("${maskDataUrl}")`,
                        maskSize: "100% 100%",
                        WebkitMaskSize: "100% 100%",
                    }}
                />
            )}

            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size.width} ${size.height}`}
                preserveAspectRatio="none"
                style={{ display: "block", position: "absolute", inset: 0 }}
            >
                <defs>
                    <mask id={maskId}>
                        <path d={rectPath} fill="white" />
                        {paths.length > 0 && (
                            <g
                                transform={`translate(${iconX},${iconY}) scale(${scale})`}
                            >
                                {paths.map((d, i) => (
                                    <path key={i} d={d} fill="black" />
                                ))}
                            </g>
                        )}
                    </mask>
                </defs>
                <path
                    d={rectPath}
                    fill={backgroundColor}
                    mask={`url(#${maskId})`}
                />
            </svg>
        </div>
    )
}

// ─── Default props ────────────────────────────────────────────────────────────
SubtractComponent.defaultProps = {
    width: 100,
    height: 100,
    backgroundColor: "#000000",
    iconSource: "custom" as IconSource,
    phosphorIconName: "house",
    phosphorWeight: "regular" as PhosphorWeight,
    iconSvgCode: `<svg width="59" height="74" viewBox="0 0 59 74" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M36.8936 41.624C48.9099 41.624 58.6514 51.3655 58.6514 63.3818V73.7881H0V63.3818C0 51.3655 9.74127 41.624 21.7578 41.624H36.8936ZM29.3213 0C39.248 0 47.2947 8.04717 47.2949 17.9736C47.2949 27.9003 39.2482 35.9482 29.3213 35.9482C19.3946 35.9482 11.3477 27.9003 11.3477 17.9736C11.3479 8.0472 19.3948 5.53112e-05 29.3213 0Z" fill="white"/>
</svg>`,
    iconSvgFile: "",
    iconSize: 60,
    blur: 0,
    topLeft: 16,
    topRight: 16,
    bottomRight: 16,
    bottomLeft: 16,
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(SubtractComponent, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    // ── Icon source switcher ─────────────────────────────────────────────────
    iconSource: {
        type: ControlType.Enum,
        title: "Icon Source",
        options: ["custom", "phosphor"],
        optionTitles: ["Custom SVG", "Phosphor Icons"],
        defaultValue: "custom",
    },

    // ── Phosphor controls (visible only when iconSource === "phosphor") ──────
    phosphorIconName: {
        type: ControlType.String,
        title: "Icon Name",
        defaultValue: "house",
        placeholder: "e.g. arrow-right, heart, star",
        hidden: (props) => props.iconSource !== "phosphor",
    },
    phosphorWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["regular", "bold", "light", "thin", "fill", "duotone"],
        optionTitles: ["Regular", "Bold", "Light", "Thin", "Fill", "Duotone"],
        defaultValue: "regular",
        hidden: (props) => props.iconSource !== "phosphor",
    },

    // ── Custom SVG controls (visible only when iconSource === "custom") ──────
    iconSvgFile: {
        type: ControlType.File,
        title: "Upload SVG",
        allowedFileTypes: ["svg"],
        hidden: (props) => props.iconSource !== "custom",
    },
    iconSvgCode: {
        type: ControlType.String,
        title: "Or Paste SVG",
        defaultValue: `<svg width="59" height="74" viewBox="0 0 59 74" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M36.8936 41.624C48.9099 41.624 58.6514 51.3655 58.6514 63.3818V73.7881H0V63.3818C0 51.3655 9.74127 41.624 21.7578 41.624H36.8936ZM29.3213 0C39.248 0 47.2947 8.04717 47.2949 17.9736C47.2949 27.9003 39.2482 35.9482 29.3213 35.9482C19.3946 35.9482 11.3477 27.9003 11.3477 17.9736C11.3479 8.0472 19.3948 5.53112e-05 29.3213 0Z" fill="white"/>
</svg>`,
        displayTextArea: true,
        hidden: (props) => props.iconSource !== "custom" || !!props.iconSvgFile,
    },

    // ── Shared controls ───────────────────────────────────────────────────────
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 60,
        min: 10,
        max: 500,
        step: 1,
        unit: "px",
    },
    blur: {
        type: ControlType.Number,
        title: "Background Blur",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    topLeft: {
        type: ControlType.Number,
        title: "Top Left Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    topRight: {
        type: ControlType.Number,
        title: "Top Right Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    bottomRight: {
        type: ControlType.Number,
        title: "Bottom Right Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    bottomLeft: {
        type: ControlType.Number,
        title: "Bottom Left Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})
