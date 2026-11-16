// Video seen through moving text — an opaque overlay with the letters
// punched out, so the mask never leaves SVG territory.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useEffect, useId, useRef, useState, type CSSProperties } from "react"

interface TextVideoMaskProps {
    useVideoFile: boolean
    videoFile: string
    videoUrl: string
    text: string
    font: any
    backgroundColor: string
    autoplay: boolean
    loop: boolean
    muted: boolean
    speed: number
    direction: "left" | "right"
    gap: number
    style?: CSSProperties
}

/**
 * Text Video Mask
 *
 * The video sits untouched at the bottom. On top of it lies a rectangle
 * filled with `backgroundColor`, masked by a marquee of black text — black
 * in an SVG mask means "cut a hole", so the video shows through the letters.
 *
 * The mask is applied with the SVG `mask` attribute on an SVG shape, never
 * with the CSS `mask` property on an HTML element: CSS masks that reference
 * an SVG <mask> element are only reliable in Firefox.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextVideoMask(props: TextVideoMaskProps) {
    const isStatic = useIsStaticRenderer()

    const {
        useVideoFile = true,
        videoFile,
        videoUrl,
        text = "VIDEO",
        font,
        backgroundColor = "#000000",
        autoplay = true,
        loop = true,
        muted = true,
        speed = 60,
        direction = "left",
        gap = 80,
        style,
    } = props

    const videoSource = useVideoFile ? videoFile : videoUrl

    // Stable across renders and identical on server and client — Math.random()
    // would hand the mask a new id on every render and break hydration.
    const maskId = `tvm-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    const containerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<SVGTextElement>(null)

    const [textWidth, setTextWidth] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)

    const textStyle: CSSProperties = {
        fontSize: font?.fontSize || "120px",
        fontFamily: font?.fontFamily || "Inter, sans-serif",
        fontWeight: font?.fontWeight || 700,
        fontStyle: font?.fontStyle || "normal",
        letterSpacing: font?.letterSpacing || "-0.02em",
    }

    const fontKey = [
        text,
        textStyle.fontSize,
        textStyle.fontFamily,
        textStyle.fontWeight,
        textStyle.fontStyle,
        textStyle.letterSpacing,
    ].join("|")

    // Measured on a real, rendered <text> node. getBBox() on an element inside
    // <defs> is unreliable — those nodes are never laid out.
    useEffect(() => {
        const measure = () => {
            const node = measureRef.current
            if (!node) return
            try {
                const width =
                    node.getComputedTextLength() || node.getBBox().width
                if (width > 0) setTextWidth(width)
            } catch {
                /* not laid out yet */
            }
        }

        measure()

        const fonts = (document as any)?.fonts
        if (fonts?.ready) fonts.ready.then(measure).catch(() => {})
    }, [fontKey])

    useEffect(() => {
        const element = containerRef.current
        if (!element) return

        setContainerWidth(element.clientWidth)

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(([entry]) =>
            setContainerWidth(entry.contentRect.width)
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const measured = textWidth > 0
    const tile = Math.max(1, textWidth + gap)
    // Enough copies to cover the viewport plus one tile of lead-in and lead-out.
    const copies = Math.max(3, Math.ceil(containerWidth / tile) + 3)
    // speed is px per second, so the pace stays constant at any text length.
    const duration = Math.max(0.2, tile / Math.max(1, speed))

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                ...style,
            }}
        >
            {videoSource && (
                <video
                    src={videoSource}
                    autoPlay={autoplay}
                    loop={loop}
                    muted={muted}
                    playsInline
                    preload="auto"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}

            <svg
                width="100%"
                height="100%"
                role="img"
                aria-label={text}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                <defs>
                    <mask
                        id={maskId}
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                    >
                        {/* White keeps the overlay opaque… */}
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="white"
                        />
                        {/* …black punches the letters out of it. */}
                        <motion.g
                            animate={
                                isStatic
                                    ? undefined
                                    : {
                                          x:
                                              direction === "left"
                                                  ? [0, -tile]
                                                  : [-tile, 0],
                                      }
                            }
                            transition={{
                                duration,
                                ease: "linear",
                                repeat: Infinity,
                                repeatType: "loop",
                            }}
                        >
                            {Array.from({ length: copies }).map((_, i) => (
                                <text
                                    key={i}
                                    x={(i - 1) * tile}
                                    y="50%"
                                    dominantBaseline="middle"
                                    fill="black"
                                    style={textStyle}
                                >
                                    {text}
                                </text>
                            ))}
                        </motion.g>
                    </mask>
                </defs>

                {/* Off-canvas and unpainted, but laid out — so it can be measured. */}
                <text
                    ref={measureRef}
                    x="0"
                    y="-9999"
                    fill="none"
                    aria-hidden="true"
                    style={textStyle}
                >
                    {text}
                </text>

                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill={backgroundColor}
                    mask={measured ? `url(#${maskId})` : undefined}
                />
            </svg>
        </div>
    )
}

addPropertyControls(TextVideoMask, {
    useVideoFile: {
        type: ControlType.Boolean,
        title: "Video",
        defaultValue: true,
        enabledTitle: "Upload",
        disabledTitle: "URL",
    },
    videoFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
        title: "Upload",
        hidden: ({ useVideoFile }) => !useVideoFile,
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        hidden: ({ useVideoFile }) => useVideoFile,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "VIDEO",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "120px",
            variant: "Bold",
            letterSpacing: "-0.02em",
        },
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Pixels per second.",
        defaultValue: 60,
        min: 1,
        max: 400,
        step: 1,
        unit: "px/s",
        displayStepper: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Space between repetitions.",
        defaultValue: 80,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        description: "Browsers only autoplay muted video.",
        defaultValue: true,
    },
})
