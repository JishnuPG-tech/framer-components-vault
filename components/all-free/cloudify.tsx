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


// ─── Sky color presets ────────────────────────────────────────────────────────
const SKY_LIGHT = { top: "#0B5EB6", mid: "#2078D0", bottom: "#609FD8" }
const SKY_DARK = { top: "#1F2C3C", mid: "#2A3847", bottom: "#434D58" }

type ContentMode = "Image" | "Text"
type Background = "Light" | "Dark" | "Transparent"

interface Props {
    contentMode: ContentMode
    // Image mode
    image?: string
    // Text mode
    text: string
    fontFamily: string
    fontWeight: number
    letterSpacing: number
    // Shared
    size: number
    darkClouds: boolean
    background: Background
    // Cloud appearance
    thickness: number
    cloudiness: number
    cloudTint: string
    speed: number
}

/**
 * @displayName Cloudify
 * @description Turns any logo or text into an animated cloud-vapor shape using SVG filters.
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Cloudify(props: Props) {
    const {
        contentMode,
        image,
        text,
        fontFamily,
        fontWeight,
        letterSpacing,
        size,
        darkClouds,
        background,
        thickness,
        cloudiness,
        cloudTint,
        speed,
    } = props

    // Unique filter ID per instance — prevents conflicts when multiple instances
    // are placed on the same canvas or page.
    const filterId = React.useId().replace(/:/g, "")

    const turb1Ref = React.useRef<SVGFETurbulenceElement>(null)
    const turb2Ref = React.useRef<SVGFETurbulenceElement>(null)

    // ─── Wispy breathing animation ────────────────────────────────────────────
    const speedRef = React.useRef(speed)
    speedRef.current = speed

    React.useEffect(() => {
        const BASE_FREQ = 0.018
        let rafId: number

        function tick() {
            const s = speedRef.current / 100
            const phase = performance.now() / 1000
            turb1Ref.current?.setAttribute(
                "baseFrequency",
                (BASE_FREQ + Math.sin(phase * 0.08 * s) * 0.0035).toFixed(5)
            )
            turb2Ref.current?.setAttribute(
                "baseFrequency",
                (BASE_FREQ + Math.cos(phase * 0.06 * s) * 0.0035).toFixed(5)
            )
            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [])

    // ─── Filter parameter calculations ────────────────────────────────────────
    const mult = 0.2 + (cloudiness / 100) * 1.8
    const dilateRadius = ((thickness / 100) * 22).toFixed(1)

    const [d1, d2, d3, d4, d5] = [100, 100, 80, 100, 100].map((s) =>
        (s * mult).toFixed(1)
    )
    const [b1, b2, b3, b4, b5] = [20, 20, 20, 30, 30].map((s) =>
        (s * mult).toFixed(2)
    )

    // ─── Background ────────────────────────────────────────────────────────
    const skyColors = background === "Dark" ? SKY_DARK : SKY_LIGHT
    const bgStyle: React.CSSProperties =
        background !== "Transparent"
            ? {
                  background: `linear-gradient(180deg, ${skyColors.top} 29%, ${skyColors.mid} 87%, ${skyColors.bottom} 100%)`,
                  transition: "background 0.6s ease",
              }
            : { background: "transparent" }

    // ─── Cloud brightness ─────────────────────────────────────────────────
    const contentFilter = darkClouds
        ? "brightness(0) invert(1) brightness(0.55)"
        : "brightness(0) invert(1)"

    // ─── Determine if we have real content ──────────────────────────────────
    const hasContent =
        (contentMode === "Image" && !!image) || (contentMode === "Text" && true) // Text always has content (fallback: "Write something")

    const placeholderText =
        contentMode === "Image" ? "Drop a logo" : "Write something"

    return (
        <div style={{ ...containerStyle, ...bgStyle }}>
            {/* ── Hidden SVG filter definitions ─────────────────────────────── */}
            <svg
                aria-hidden="true"
                style={{ width: 0, height: 0, position: "absolute" }}
            >
                <defs>
                    <filter
                        id={filterId}
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feTurbulence
                            ref={turb1Ref}
                            type="fractalNoise"
                            seed="462"
                            baseFrequency="0.011"
                            numOctaves={5}
                            result="noise1"
                        />
                        <feTurbulence
                            ref={turb2Ref}
                            type="fractalNoise"
                            seed="462"
                            baseFrequency="0.011"
                            numOctaves={2}
                            result="noise2"
                        />

                        <feMorphology
                            in="SourceGraphic"
                            operator="dilate"
                            radius={dilateRadius}
                            result="thickened"
                        />

                        <feGaussianBlur in="thickened" stdDeviation={b1} />
                        <feDisplacementMap
                            scale={d1}
                            in2="noise1"
                            result="cloud1"
                        />

                        <feFlood
                            floodColor="rgb(215,215,215)"
                            floodOpacity="0"
                        />
                        <feComposite operator="in" in2="thickened" />
                        <feOffset dx="-10" dy="-3" />
                        <feMorphology radius="20" />
                        <feGaussianBlur stdDeviation={b2} />
                        <feDisplacementMap
                            scale={d2}
                            in2="noise1"
                            result="cloud2"
                        />

                        <feFlood floodColor={cloudTint} floodOpacity="0.1" />
                        <feComposite operator="in" in2="thickened" />
                        <feOffset dx="-10" dy="40" />
                        <feMorphology radius="0 40" />
                        <feGaussianBlur stdDeviation={b3} />
                        <feDisplacementMap
                            scale={d3}
                            in2="noise2"
                            result="cloud3"
                        />

                        <feFlood floodColor="rgb(0,0,0)" floodOpacity="0.2" />
                        <feComposite operator="in" in2="thickened" />
                        <feOffset dx="20" dy="60" />
                        <feMorphology radius="0 65" />
                        <feGaussianBlur stdDeviation={b4} />
                        <feDisplacementMap
                            scale={d4}
                            in2="noise2"
                            result="cloud4"
                        />

                        <feFlood floodColor="rgb(0,0,0)" floodOpacity="0.2" />
                        <feComposite operator="in" in2="thickened" />
                        <feOffset dx="20" dy="70" />
                        <feMorphology radius="0 200" />
                        <feGaussianBlur stdDeviation={b5} />
                        <feDisplacementMap
                            scale={d5}
                            in2="noise2"
                            result="cloud5"
                        />

                        <feMerge>
                            <feMergeNode in="cloud1" />
                            <feMergeNode in="cloud2" />
                            <feMergeNode in="cloud3" />
                            <feMergeNode in="cloud4" />
                            <feMergeNode in="cloud5" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            {/* ── Filtered stage (only when there's content) ────────────────── */}
            {hasContent && (
                <div style={{ ...stageStyle, filter: `url(#${filterId})` }}>
                    {contentMode === "Text" ? (
                        <div
                            style={{
                                ...textStyle,
                                fontSize: `${size * 1.2}px`,
                                fontFamily:
                                    fontFamily || "system-ui, sans-serif",
                                fontWeight,
                                letterSpacing: `${letterSpacing}em`,
                                filter: contentFilter,
                                transition: "filter 0.6s ease",
                            }}
                        >
                            {text || "Write something"}
                        </div>
                    ) : (
                        <img
                            src={image}
                            alt=""
                            style={{
                                ...imageStyle,
                                width: `${size}%`,
                                filter: contentFilter,
                                transition: "filter 0.6s ease",
                            }}
                        />
                    )}
                </div>
            )}

            {/* ── Placeholder (only when no content) ────────────────────────── */}
            {!hasContent && (
                <div style={placeholderStyle}>{placeholderText}</div>
            )}
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
Cloudify.defaultProps = {
    contentMode: "Image",
    text: "Cloud",
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 900,
    letterSpacing: -0.02,
    size: 55,
    darkClouds: false,
    background: "Light",
    thickness: 10,
    cloudiness: 5,
    cloudTint: "#426992",
    speed: 100,
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(Cloudify, {
    // ── Content mode ─────────────────────────────────────────────────────────
    contentMode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["Image", "Text"],
        defaultValue: "Image",
    },

    // ── Image controls (only in Image mode) ──────────────────────────────────
    image: {
        type: ControlType.Image,
        title: "Logo",
        hidden: (props) => props.contentMode !== "Image",
    },

    // ── Text controls (only in Text mode) ────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Cloud",
        hidden: (props) => props.contentMode !== "Text",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, system-ui, sans-serif",
        hidden: (props) => props.contentMode !== "Text",
        description:
            "CSS font-family. Use any font loaded in your Framer project.",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        optionTitles: [
            "Thin",
            "ExtraLight",
            "Light",
            "Regular",
            "Medium",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
        defaultValue: 900,
        hidden: (props) => props.contentMode !== "Text",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        min: -0.1,
        max: 0.5,
        step: 0.01,
        defaultValue: -0.02,
        hidden: (props) => props.contentMode !== "Text",
    },

    // ── Shared sizing ────────────────────────────────────────────────────────
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 100,
        unit: "%",
        defaultValue: 55,
        displayStepper: true,
    },

    // ── Cloud ─────────────────────────────────────────────────────────────────
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        min: 0,
        max: 100,
        defaultValue: 10,
    },
    cloudiness: {
        type: ControlType.Number,
        title: "Cloudiness",
        min: 0,
        max: 100,
        defaultValue: 5,
    },
    cloudTint: {
        type: ControlType.Color,
        title: "Cloud Tint",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 500,
        defaultValue: 100,
        step: 10,
        description: "0 = frozen. 100 = gentle breeze.",
    },

    // ── Appearance ─────────────────────────────────────────────────────────
    darkClouds: {
        type: ControlType.Boolean,
        title: "Dark Clouds",
        defaultValue: false,
    },
    background: {
        type: ControlType.Enum,
        title: "Background",
        options: ["Light", "Dark", "Transparent"],
        defaultValue: "Light",
        description:
            "[Send a coffee ☕](https://chideraokonkwo.gumroad.com/coffee)",
    },
})

// ─── Styles ───────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const stageStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
}

const imageStyle: React.CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    pointerEvents: "none",
    display: "block",
}

const textStyle: React.CSSProperties = {
    color: "#fff",
    lineHeight: 1,
    whiteSpace: "nowrap",
    userSelect: "none",
    pointerEvents: "none",
}

const placeholderStyle: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inset: 0,
    color: "rgba(255,255,255,0.5)",
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "system-ui, sans-serif",
    pointerEvents: "none",
    letterSpacing: "0.02em",
}
