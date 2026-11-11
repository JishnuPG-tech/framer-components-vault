// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useId } from "react"

/**
 * LIQUID WAVE TEXT
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 160
 */
export default function LiquidFlowText(props) {
    const {
        text,
        font,
        baseColor,
        waveColor1,
        waveColor2,
        waveColor3,
        speed,
        intensity,
        loop,
        align,
    } = props

    // Unique id so multiple instances on a canvas don't collide
    const uid = useId().replace(/[:]/g, "")
    const animName = `lw-move-${uid}`

    // True on the Framer canvas and during export/SSR. In those static
    // contexts we must not run continuous animation: it slows the editor
    // and causes visual artifacts in exports.
    const isStatic = useIsStaticRenderer()

    // Animate only when loop is on AND we're in a live (non-static) render.
    const animate = loop && !isStatic

    // Intensity (%) drives how wide the wave band is and how vivid it looks.
    // Low intensity -> narrow, subtle band. High -> wide, saturated band.
    const i = Math.max(0, Math.min(100, intensity)) / 100

    // Band width as a fraction of the gradient run (0.15 -> 0.65)
    const band = 0.15 + i * 0.5
    const half = band / 2

    // Duration: higher speed => shorter duration. speed is 0.1x .. 5x.
    const duration = 6 / Math.max(0.1, speed)

    // The gradient is 3x wider than the text and slides left across it,
    // giving a continuous flowing loop with no visible seam.
    const stops = buildStops(
        baseColor,
        [waveColor1, waveColor2, waveColor3],
        half,
        i
    )

    const containerStyle: any = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
            align === "left"
                ? "flex-start"
                : align === "right"
                  ? "flex-end"
                  : "center",
        overflow: "hidden",
    }

    const textStyle: any = {
        ...font,
        margin: 0,
        color: baseColor, // fallback for reduced-motion / no-clip support
        backgroundImage: `linear-gradient(90deg, ${stops})`,
        backgroundSize: "300% 100%",
        // In a static context, freeze the wave at a pleasant mid position
        // so the preview still shows the gradient without animating.
        backgroundPosition: isStatic ? "50% 0%" : "0% 0%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent" as any,
        animation: animate
            ? `${animName} ${duration}s linear infinite`
            : "none",
        whiteSpace: "pre-wrap",
        textAlign: align,
    }

    return (
        <div style={containerStyle}>
            {animate && (
                <style>{`
                    @keyframes ${animName} {
                        0%   { background-position: 200% 0%; }
                        100% { background-position: -100% 0%; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .lw-text-${uid} { animation: none !important; }
                    }
                `}</style>
            )}
            <p className={`lw-text-${uid}`} style={textStyle}>
                {text}
            </p>
        </div>
    )
}

// Build a repeating gradient string: base -> wave1 -> wave2 -> wave3 -> base,
// packed into a band whose width is controlled by intensity.
function buildStops(base, waves, half, intensity) {
    const [w1, w2, w3] = waves
    const center = 0.5
    const start = Math.max(0, center - half)
    const end = Math.min(1, center + half)
    const q = (t) => `${(t * 100).toFixed(1)}%`

    const mid1 = start + (end - start) * 0.33
    const mid2 = start + (end - start) * 0.66

    return [
        `${base} 0%`,
        `${base} ${q(start)}`,
        `${w1} ${q(mid1)}`,
        `${w2} ${q(center)}`,
        `${w3} ${q(mid2)}`,
        `${base} ${q(end)}`,
        `${base} 100%`,
    ].join(", ")
}

LiquidFlowText.defaultProps = {
    text: "Liquid Wave",
    baseColor: "#E5E5E5",
    waveColor1: "#4EA1FF",
    waveColor2: "#9B5CFF",
    waveColor3: "#FF5C8A",
    speed: 1,
    intensity: 45,
    loop: true,
    align: "center",
    font: {
        fontSize: 96,
        fontWeight: 800,
        letterSpacing: "-2px",
        lineHeight: "1.05em",
    },
}

addPropertyControls(LiquidFlowText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Liquid Wave",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: "1.05em",
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#E5E5E5",
    },
    waveColor1: {
        type: ControlType.Color,
        title: "Wave 1",
        defaultValue: "#4EA1FF",
    },
    waveColor2: {
        type: ControlType.Color,
        title: "Wave 2",
        defaultValue: "#9B5CFF",
    },
    waveColor3: {
        type: ControlType.Color,
        title: "Wave 3",
        defaultValue: "#FF5C8A",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        displayStepper: true,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 45,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
})
