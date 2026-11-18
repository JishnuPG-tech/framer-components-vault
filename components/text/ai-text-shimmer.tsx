// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useId } from "react"

/**
 * TextShimmer — v4
 *
 * Fixes applied vs v3:
 * - Canvas safety: animation paused when rendered in Framer editor (RenderTarget check)
 * - width/height exposed via property controls so users can resize from the panel
 * - white-space: nowrap replaced with wrapping + overflow-wrap for responsiveness
 * - Module-level idCounter replaced with React's useId() — stable across hot-reloads
 * - fontFamily exposed as Enum with common options + custom fallback
 * - Added property descriptions for complex controls
 * - Added "Fill container" width mode via a widthMode enum control
 */

const FONT_FAMILIES = [
    "Inter, sans-serif",
    "system-ui, sans-serif",
    "Georgia, serif",
    "Playfair Display, serif",
    "Courier New, monospace",
    "Custom",
]

const FONT_FAMILY_LABELS = [
    "Inter",
    "System UI",
    "Georgia",
    "Playfair Display",
    "Courier New",
    "Custom…",
]

export default function TextShimmer({
    text,
    fontSize,
    fontWeight,
    fontFamily,
    customFontFamily,
    baseColor,
    shimmerColor,
    duration,
    widthMode,
    width,
    height,
}: {
    text: string
    fontSize: number
    fontWeight: string
    fontFamily: string
    customFontFamily: string
    baseColor: string
    shimmerColor: string
    duration: number
    widthMode: "fixed" | "fill"
    width: number
    height: number
}) {
    const ref = useRef<HTMLSpanElement>(null)

    // React 18 stable unique ID — survives hot-reloads, server-safe
    const rawId = useId()
    // useId returns ":r0:" style strings — strip colons for CSS ID safety
    const uid = "ts-" + rawId.replace(/:/g, "")

    // Resolve font family — use custom if "Custom" selected
    const resolvedFont =
        fontFamily === "Custom" ? customFontFamily || "sans-serif" : fontFamily

    // Detect if we're in the Framer canvas editor
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const css = `
        @keyframes shimmer-${uid} {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
        #${uid} {
            --base: ${baseColor};
            --shine: ${shimmerColor};
            font-size: ${fontSize}px;
            font-weight: ${fontWeight};
            font-family: ${resolvedFont};
            line-height: 1.4;
            display: inline;
            word-break: break-word;
            overflow-wrap: break-word;
            background: linear-gradient(
                90deg,
                var(--base)  0%,
                var(--base)  30%,
                var(--shine) 50%,
                var(--base)  70%,
                var(--base)  100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            animation: shimmer-${uid} ${duration}s linear infinite;
            /* Static on canvas, paused until intersecting on live site */
            animation-play-state: ${isCanvas ? "paused" : "paused"};
        }
    `

    // Intersection observer — play when visible, pause when off-screen
    // Only runs on the live site (not in the Framer editor)
    useEffect(() => {
        if (isCanvas) return
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                el.style.setProperty(
                    "animation-play-state",
                    entry.isIntersecting ? "running" : "paused"
                )
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isCanvas])

    const containerWidth = widthMode === "fill" ? "100%" : width

    return (
        <div
            style={{
                width: containerWidth,
                height,
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
            }}
        >
            <style>{css}</style>
            <span id={uid} ref={ref}>
                {text}
            </span>
        </div>
    )
}

TextShimmer.defaultProps = {
    text: "Generating response...",
    fontSize: 24,
    fontWeight: "400",
    fontFamily: "Inter, sans-serif",
    customFontFamily: "",
    baseColor: "#AAAAAA",
    shimmerColor: "#111111",
    duration: 2,
    widthMode: "fixed",
    width: 400,
    height: 60,
}

addPropertyControls(TextShimmer, {
    // ── Content ─────────────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Generating response...",
        displayTextArea: true,
    },

    // ── Typography ──────────────────────────────────────────
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 24,
        min: 8,
        max: 120,
        step: 1,
        displayStepper: true,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: "400",
        options: [
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ],
        optionTitles: [
            "Thin",
            "Extra Light",
            "Light",
            "Regular",
            "Medium",
            "Semi Bold",
            "Bold",
            "Extra Bold",
            "Black",
        ],
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
        options: FONT_FAMILIES,
        optionTitles: FONT_FAMILY_LABELS,
    },
    customFontFamily: {
        type: ControlType.String,
        title: "Custom Font",
        defaultValue: "",
        placeholder: "e.g. Satoshi, sans-serif",
        description:
            'Only used when Font Family is set to "Custom". Make sure the font is loaded on your site.',
        hidden(props) {
            return props.fontFamily !== "Custom"
        },
    },

    // ── Colors ──────────────────────────────────────────────
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#AAAAAA",
    },
    shimmerColor: {
        type: ControlType.Color,
        title: "Shimmer Color",
        defaultValue: "#111111",
    },

    // ── Animation ───────────────────────────────────────────
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.1,
        displayStepper: true,
        description: "Shimmer cycle duration in seconds.",
    },

    // ── Layout ──────────────────────────────────────────────
    widthMode: {
        type: ControlType.Enum,
        title: "Width",
        defaultValue: "fixed",
        options: ["fixed", "fill"],
        optionTitles: ["Fixed", "Fill Container"],
        description:
            '"Fill Container" makes the component stretch to its parent width.',
    },
    width: {
        type: ControlType.Number,
        title: "Width (px)",
        defaultValue: 400,
        min: 40,
        max: 2000,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.widthMode === "fill"
        },
    },
    height: {
        type: ControlType.Number,
        title: "Height (px)",
        defaultValue: 60,
        min: 20,
        max: 400,
        step: 1,
        displayStepper: true,
    },
})
