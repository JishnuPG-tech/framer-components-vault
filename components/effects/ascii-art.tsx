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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function ASCIIArt(props) {
    const {
        image,
        fitMode,
        sourceMode,
        columns,
        charsetMode,
        charset,
        invert,
        colorMode,
        textColor,
        backgroundColor,
        useImageColor,
        gamma,
        contrast,
        font,
        letterSpacing,
        lineHeight,
        dithering,
        ditherStrength,
        showOriginalWhenEmpty,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const [ascii, setAscii] = React.useState<string>("")
    const [coloredHtml, setColoredHtml] = React.useState<string>("")
    const [status, setStatus] = React.useState<
        "idle" | "loading" | "ready" | "error"
    >("idle")

    const charRefs = React.useRef<(HTMLSpanElement | null)[]>([])

    React.useEffect(() => {
        charRefs.current = []
    }, [ascii])

    const asciiChars = React.useMemo(() => ascii.split(""), [ascii])

    const src = image?.src

    const CHARSETS: Record<string, string> = React.useMemo(
        () => ({
            Dense: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
            Classic: "@%#*+=-:. ",
            Blocks: "█▓▒░ ",
            Binary: "01 ",
            Hex: "0123456789abcdef ",
            Custom: charset?.length ? charset : "@%#*+=-:. ",
        }),
        [charset]
    )

    const effectiveCharset = React.useMemo(() => {
        if (charsetMode === "Custom") {
            return charset?.length ? charset : "@%#*+=-:. "
        }

        return CHARSETS[charsetMode] ?? CHARSETS.Classic
    }, [CHARSETS, charsetMode, charset])

    // Re-render on resize (so it adapts when placed in responsive layouts)
    React.useEffect(() => {
        if (isStatic) return

        if (!containerRef.current) return
        const el = containerRef.current
        const ro = new ResizeObserver(() => {
            // Trigger recompute without needing to store size
            recompute()
        })
        ro.observe(el)
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        src,
        columns,
        effectiveCharset,
        invert,
        colorMode,
        textColor,
        backgroundColor,
        useImageColor,
        gamma,
        contrast,
        font,
        letterSpacing,
        lineHeight,
        dithering,
        ditherStrength,
    ])

    const recompute = React.useCallback(async () => {
        if (isStatic) return

        if (!src) {
            setAscii("")
            setColoredHtml("")
            setStatus("idle")
            return
        }

        try {
            setStatus("loading")

            const img = await loadImage(src)

            const charAspect = 0.55
            const cols = clamp(Math.floor(columns), 20, 400)

            // preserve image aspect ratio
            const imgAspect = img.height / img.width

            const rows = clamp(
                Math.floor((imgAspect * cols) / charAspect),
                10,
                400
            )

            // Draw image to canvas at low-res grid size
            const canvas = document.createElement("canvas")
            canvas.width = cols
            canvas.height = rows
            const ctx = canvas.getContext("2d", { willReadFrequently: true })
            if (!ctx) throw new Error("Canvas not supported")

            // Fit image into grid using cover
            const { sx, sy, sWidth, sHeight } =
                fitMode === "cover"
                    ? coverFit(img.width, img.height, cols, rows)
                    : containFit(img.width, img.height, cols, rows)

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"

            // Adjust based on fit mode
            if (fitMode === "cover") {
                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cols, rows)
            } else {
                const { dx, dy, dWidth, dHeight } = containFit(
                    img.width,
                    img.height,
                    cols,
                    rows
                )

                ctx.clearRect(0, 0, cols, rows)
                ctx.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    dx,
                    dy,
                    dWidth,
                    dHeight
                )
            }

            const imageData = ctx.getImageData(0, 0, cols, rows)
            const data = imageData.data

            // Prepare luminance array
            const lum = new Float32Array(cols * rows)
            for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
                const r = data[p]
                const g = data[p + 1]
                const b = data[p + 2]
                // Rec. 709 luminance
                let y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

                // Contrast (simple)
                if (contrast !== 1) {
                    y = (y - 0.5) * contrast + 0.5
                }

                // Gamma
                if (gamma !== 1) {
                    y = Math.pow(clamp01(y), 1 / gamma)
                }

                lum[i] = clamp01(y)
            }

            // Optional dithering (Floyd–Steinberg)
            let dithered: Float32Array | null = null
            if (dithering) {
                dithered = lum.slice() as Float32Array
                const levels = Math.max(
                    2,
                    Math.min(64, effectiveCharset.length)
                )
                const strength = clamp01(ditherStrength)

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const idx = y * cols + x
                        const oldVal = dithered[idx]
                        const newVal = quantize(oldVal, levels)
                        dithered[idx] = newVal
                        const err = (oldVal - newVal) * strength

                        // Distribute error
                        if (x + 1 < cols) dithered[idx + 1] += (err * 7) / 16
                        if (x - 1 >= 0 && y + 1 < rows)
                            dithered[idx + cols - 1] += (err * 3) / 16
                        if (y + 1 < rows) dithered[idx + cols] += (err * 5) / 16
                        if (x + 1 < cols && y + 1 < rows)
                            dithered[idx + cols + 1] += (err * 1) / 16
                    }
                }

                // clamp after diffusion
                for (let i = 0; i < dithered.length; i++)
                    dithered[i] = clamp01(dithered[i])
            }

            const luminance = dithered ?? lum

            const chars = effectiveCharset
            const last = chars.length - 1

            const lines: string[] = []
            const htmlLines: string[] = []

            for (let y = 0; y < rows; y++) {
                let line = ""
                let html = ""

                for (let x = 0; x < cols; x++) {
                    const idx = y * cols + x
                    const yVal = luminance[idx]
                    const mapped = invert ? yVal : 1 - yVal
                    const ci = Math.round(mapped * last)
                    const ch = chars[clamp(ci, 0, last)] ?? " "

                    line += ch

                    if (colorMode === "Colored") {
                        const p = idx * 4
                        const r = data[p]
                        const g = data[p + 1]
                        const b = data[p + 2]
                        const a = data[p + 3] / 255

                        const color = useImageColor
                            ? `rgba(${r},${g},${b},${a.toFixed(3)})`
                            : textColor

                        // escape spaces so they still take up width in HTML
                        const safeChar = ch === " " ? "&nbsp;" : escapeHtml(ch)

                        html += `<span style="color:${color}">${safeChar}</span>`
                    }
                }

                lines.push(line)
                if (colorMode === "Colored") htmlLines.push(html)
            }

            setAscii(lines.join("\n"))
            setColoredHtml(htmlLines.join("<br/>"))
            setStatus("ready")
        } catch (e) {
            console.error(e)
            setStatus("error")
        }
    }, [
        src,
        columns,
        effectiveCharset,
        invert,
        colorMode,
        textColor,
        useImageColor,
        gamma,
        contrast,
        dithering,
        ditherStrength,
        style,
    ])

    React.useEffect(() => {
        if (isStatic) return

        recompute()
    }, [recompute])

    const fontStyle: React.CSSProperties = {
        fontFamily:
            font?.fontFamily ??
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: font?.fontSize ?? 10,
        fontWeight: font?.fontWeight ?? 400,
        letterSpacing,
        lineHeight: "1em",
        whiteSpace: "pre",
        margin: 0,
    }

    const rootStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: backgroundColor,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
    }

    const showEmpty = !image?.src && showOriginalWhenEmpty

    // Placeholder text
    if (isStatic) {
        const message = !image?.src
            ? "Upload an image to generate ASCII"
            : "View in preview or publish to see ASCII rendering (Can't show the ASCII here due to performance issues)"

        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "monospace",
                    color: textColor,
                    fontSize: 14,
                    textAlign: "center",
                    padding: 16,
                }}
            >
                {message}
            </div>
        )
    }

    return (
        <div ref={containerRef} style={rootStyle}>
            {status === "loading" && <div>Rendering…</div>}
            {showEmpty ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "monospace",
                        color: textColor,
                        fontSize: 14,
                        textAlign: "center",
                        padding: 16,
                    }}
                >
                    Upload an image to generate ASCII
                </div>
            ) : colorMode === "Colored" ? (
                <pre
                    style={{
                        ...fontStyle,
                        color: textColor,
                        width: "100%",
                        textAlign: "center",
                        transform: "scaleX(1.15)",
                        transformOrigin: "center top",
                    }}
                    dangerouslySetInnerHTML={{
                        __html: coloredHtml || "",
                    }}
                />
            ) : (
                <pre
                    style={{
                        ...fontStyle,
                        color: textColor,
                        width: "100%",
                        textAlign: "center",
                        transform: "scaleX(1.15)",
                        transformOrigin: "center top",
                        lineHeight: `${lineHeight || 1.05}em`,
                    }}
                >
                    {ascii}
                </pre>
            )}
        </div>
    )
}

ASCIIArt.displayName = "ASCII Art"

addPropertyControls(ASCIIArt, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        defaultValue: "contain",
    },
    columns: {
        type: ControlType.Number,
        title: "Detail",
        min: 20,
        max: 260,
        step: 1,
        defaultValue: 140,
        displayStepper: true,
        description: "Number of characters horizontally (higher = more detail)",
    },
    charsetMode: {
        type: ControlType.Enum,
        title: "Charset",
        defaultValue: "Classic",
        options: ["Classic", "Dense", "Blocks", "Binary", "Hex", "Custom"],
        description: "Character set used to render brightness",
    },
    charset: {
        type: ControlType.String,
        title: "Custom",
        defaultValue: "@%#*+=-:. ",
        hidden: (props) => props.charsetMode !== "Custom",
        description: "Custom characters ordered from dark → light",
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert",
        defaultValue: false,
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color",
        defaultValue: "Monochrome",
        options: ["Monochrome", "Colored"],
        displaySegmentedControl: true,
    },
    useImageColor: {
        type: ControlType.Boolean,
        title: "Image Color",
        defaultValue: true,
        hidden: (props) => props.colorMode !== "Colored",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#6D63FF",
        hidden: (props) =>
            props.colorMode === "Colored" && props.useImageColor === true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F6F1E8",
    },
    gamma: {
        type: ControlType.Number,
        title: "Gamma",
        min: 0.2,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        description: "Adjust brightness response curve",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0.2,
        max: 2.5,
        step: 0.05,
        defaultValue: 1,
    },
    dithering: {
        type: ControlType.Boolean,
        title: "Dither",
        defaultValue: true,
        description: "Adds noise for smoother gradients",
    },
    ditherStrength: {
        type: ControlType.Number,
        title: "Dither Str.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
        hidden: (props) => !props.dithering,
    },
    font: {
        type: "font",
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 10,
            lineHeight: 1.05,
        },
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Sp.",
        min: -1,
        max: 4,
        step: 0.05,
        defaultValue: 0,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.7,
        max: 2.0,
        step: 0.05,
        defaultValue: 1.05,
    },
    showOriginalWhenEmpty: {
        type: ControlType.Boolean,
        title: "Placeholder",
        defaultValue: true,
        description:
            "Show placeholder when no image is set \n \n Component crafted by [Vaibhav](https://contra.com/vaibhav_khulbe)",
    },
})

// Helpers

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}
function clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
}

function escapeHtml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function quantize(v: number, levels: number) {
    const step = 1 / (levels - 1)
    return Math.round(v / step) * step
}

function loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = url
    })
}

function coverFit(iw: number, ih: number, tw: number, th: number) {
    const ir = iw / ih
    const tr = tw / th
    let sx = 0,
        sy = 0,
        sWidth = iw,
        sHeight = ih

    if (ir > tr) {
        // wider image, crop sides
        sHeight = ih
        sWidth = ih * tr
        sx = (iw - sWidth) / 2
        sy = 0
    } else {
        // taller image, crop top/bottom
        sWidth = iw
        sHeight = iw / tr
        sx = 0
        sy = (ih - sHeight) / 2
    }
    return { sx, sy, sWidth, sHeight }
}

function containFit(iw: number, ih: number, tw: number, th: number) {
    const ir = iw / ih
    const tr = tw / th

    let dx = 0,
        dy = 0,
        dWidth = tw,
        dHeight = th

    if (ir > tr) {
        // image is wider, then fit width
        dWidth = tw
        dHeight = tw / ir
        dx = 0
        dy = (th - dHeight) / 2
    } else {
        // image is taller, then fit height
        dHeight = th
        dWidth = th * ir
        dx = (tw - dWidth) / 2
        dy = 0
    }

    return {
        sx: 0,
        sy: 0,
        sWidth: iw,
        sHeight: ih,
        dx,
        dy,
        dWidth,
        dHeight,
    }
}
