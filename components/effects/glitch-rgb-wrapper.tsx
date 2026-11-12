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
 */

type Trigger = "hover" | "click" | "always"
type ContentMode = "slot" | "text"
type TextAlign = "left" | "center" | "right"
type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize"

type Props = {
    mode?: ContentMode
    content?: React.ReactNode
    text?: string
    fontFamily?: string
    textColor?: string
    textSize?: number
    textWeight?: number
    textLineHeight?: number
    textLetterSpacing?: number
    textAlign?: TextAlign
    textTransform?: TextTransform
    textPadding?: number
    intensity?: number
    sliceCount?: number
    rgbOffset?: number
    flickerSpeed?: number
    trigger?: Trigger
    borderRadius?: number
    overflowHidden?: boolean
    overlayOpacity?: number
    enableOnMobile?: boolean
    style?: React.CSSProperties
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

const justifyByAlign: Record<TextAlign, React.CSSProperties["justifyContent"]> =
    {
        left: "flex-start",
        center: "center",
        right: "flex-end",
    }

function EmptySlot() {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minHeight: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 24,
                borderRadius: "inherit",
                border: "1px dashed rgba(255,255,255,.28)",
                background:
                    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
                color: "rgba(255,255,255,.72)",
                font: "500 13px/1.3 Inter, system-ui, sans-serif",
                letterSpacing: 0.2,
            }}
        >
            Drop a Frame/Stack into Slot or switch Mode to Text
        </div>
    )
}

export default function GlitchRGBHoverWrapper(props: Props) {
    const {
        mode = "slot",
        content,
        text = "GLITCH\nRGB HOVER\nWRAPPER",
        fontFamily = "Inter, system-ui, sans-serif",
        textColor = "#FFFFFF",
        textSize = 64,
        textWeight = 850,
        textLineHeight = 0.88,
        textLetterSpacing = -3,
        textAlign = "left",
        textTransform = "uppercase",
        textPadding = 0,
        intensity = 46,
        sliceCount = 7,
        rgbOffset = 14,
        flickerSpeed = 4,
        trigger = "hover",
        borderRadius = 24,
        overflowHidden = true,
        overlayOpacity = 0.08,
        enableOnMobile = true,
        style,
    } = props

    const [isActive, setIsActive] = React.useState(false)
    const [isCoarsePointer, setIsCoarsePointer] = React.useState(false)
    const [isElementVisible, setIsElementVisible] = React.useState(true)

    const containerRef = React.useRef<HTMLDivElement>(null)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const isStatic = useIsStaticRenderer()

    React.useInsertionEffect(() => {
        if (typeof document === "undefined") return

        const id = "glitch-rgb-global-styles-v2"
        if (document.getElementById(id)) return

        const styleEl = document.createElement("style")
        styleEl.id = id
        styleEl.textContent = css
        document.head.appendChild(styleEl)
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const media = window.matchMedia("(hover: none), (pointer: coarse)")
        const update = () => setIsCoarsePointer(media.matches)

        update()
        media.addEventListener?.("change", update)

        let observer: IntersectionObserver | null = null
        if (containerRef.current && !isStatic) {
            observer = new IntersectionObserver(
                ([entry]) => {
                    setIsElementVisible(entry.isIntersecting)
                },
                { threshold: 0.05 }
            )
            observer.observe(containerRef.current)
        }

        return () => {
            media.removeEventListener?.("change", update)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            if (observer) observer.disconnect()
        }
    }, [isStatic])

    const disabledOnMobile = isCoarsePointer && !enableOnMobile
    const mobileFactor = isCoarsePointer ? 0.38 : 1
    const strength = disabledOnMobile
        ? 0
        : (clamp(intensity, 0, 100) / 100) * mobileFactor

    const offset = clamp(rgbOffset, 0, 40) * strength
    const speed = clamp(flickerSpeed, 0, 10)
    const count = Math.round(clamp(sliceCount, 0, 12))
    const hasMotion = speed > 0 && !disabledOnMobile && !isStatic
    const duration = `${clamp(1.15 - speed * 0.095, 0.18, 1.15)}s`
    const activeOpacity = clamp(
        0.14 + strength * 0.82,
        0,
        isCoarsePointer ? 0.42 : 0.96
    )

    const rawId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const redFilterId = `glitchRed_${rawId}`
    const cyanFilterId = `glitchCyan_${rawId}`

    const slices = React.useMemo(() => {
        if (!count || !offset) return []

        return Array.from({ length: count }, (_, index) => {
            const top = (index / count) * 100
            const height = 100 / count
            const bottom = Math.max(0, 100 - top - height)
            const direction = index % 2 === 0 ? 1 : -1
            const wobble = 0.55 + (((index * 37) % 100) / 100) * 0.95
            const x = direction * offset * wobble
            const y = (index % 3 === 0 ? -1 : 1) * Math.min(3, offset * 0.13)

            return {
                top: `${top}%`,
                bottom: `${bottom}%`,
                x: `${x.toFixed(2)}px`,
                y: `${y.toFixed(2)}px`,
                delay: `${-(index * 0.07).toFixed(2)}s`,
            }
        })
    }, [count, offset])

    const startClickBurst = React.useCallback(() => {
        if (disabledOnMobile || isStatic) return

        const shouldTapTrigger =
            trigger === "click" || (trigger === "hover" && isCoarsePointer)

        if (!shouldTapTrigger) return

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsActive(true)
        timeoutRef.current = setTimeout(() => setIsActive(false), 760)
    }, [disabledOnMobile, isCoarsePointer, trigger, isStatic])

    const textStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: justifyByAlign[textAlign],
        padding: clamp(textPadding, 0, 240),
        color: textColor,
        fontFamily,
        fontSize: clamp(textSize, 8, 280),
        fontWeight: clamp(textWeight, 100, 1000),
        lineHeight: clamp(textLineHeight, 0.65, 2),
        letterSpacing: textLetterSpacing,
        textAlign,
        textTransform,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        borderRadius: "inherit",
    }

    const renderSlot = (key: string) => {
        if (mode === "text") {
            return (
                <div key={key} className="glitchRGBTextSlot">
                    <div className="glitchRGBText" style={textStyle}>
                        {text}
                    </div>
                </div>
            )
        }

        // Важно: для Framer Frame/Stack оставляем passthrough-обертку.
        // Реальная wrapper-коробка ломает sizing ComponentInstance у фреймов.
        return (
            <div key={key} className="glitchRGBSlotPassthrough">
                {content ?? <EmptySlot />}
            </div>
        )
    }

    const shouldAnimate = hasMotion && isElementVisible && !isStatic

    const rootStyle: React.CSSProperties & Record<string, string | number> = {
        ...style,
        "--radius": `${clamp(borderRadius, 0, 240)}px`,
        "--fx-opacity": activeOpacity,
        "--veil-opacity":
            clamp(overlayOpacity, 0, 1) * (isCoarsePointer ? 0.55 : 1),
        "--duration": duration,
        "--red-x": `${offset.toFixed(2)}px`,
        "--red-y": `${Math.min(5, offset * 0.12).toFixed(2)}px`,
        "--red-alt-x": `${(-offset * 0.45).toFixed(2)}px`,
        "--red-burst-x": `${(offset * 1.45).toFixed(2)}px`,
        "--cyan-x": `${(-offset).toFixed(2)}px`,
        "--cyan-y": `${(-Math.min(5, offset * 0.12)).toFixed(2)}px`,
        "--cyan-alt-x": `${(offset * 0.45).toFixed(2)}px`,
        "--cyan-burst-x": `${(-offset * 1.45).toFixed(2)}px`,
        position: "relative",
        borderRadius: "var(--radius)",
        overflow: overflowHidden ? "hidden" : "visible",
        isolation: "isolate",
        transform: "translateZ(0)",
        WebkitTapHighlightColor: "transparent",
    }

    return (
        <div
            ref={containerRef}
            className="glitchRGBRoot"
            data-trigger={trigger}
            data-active={trigger === "always" || isActive ? "true" : "false"}
            data-disabled={disabledOnMobile ? "true" : "false"}
            data-motion={shouldAnimate ? "on" : "off"}
            data-mobile={isCoarsePointer ? "true" : "false"}
            data-mode={mode}
            style={rootStyle}
            onPointerDown={startClickBurst}
        >
            <svg
                aria-hidden="true"
                focusable="false"
                width="0"
                height="0"
                style={{ position: "absolute" }}
            >
                <filter id={redFilterId} colorInterpolationFilters="sRGB">
                    <feColorMatrix
                        type="matrix"
                        values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .92 0"
                    />
                </filter>
                <filter id={cyanFilterId} colorInterpolationFilters="sRGB">
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .86 0"
                    />
                </filter>
            </svg>

            <div className="glitchRGBBase">{renderSlot("base")}</div>

            <div className="glitchRGBVeil" aria-hidden="true" />

            <div
                className="glitchRGBFX glitchRGBFull glitchRGBRed"
                aria-hidden="true"
                style={{ filter: `url(#${redFilterId})` }}
            >
                {renderSlot("red")}
            </div>

            <div
                className="glitchRGBFX glitchRGBFull glitchRGBCyan"
                aria-hidden="true"
                style={{ filter: `url(#${cyanFilterId})` }}
            >
                {renderSlot("cyan")}
            </div>

            {slices.map((slice, index) => (
                <React.Fragment key={index}>
                    <div
                        className="glitchRGBFX glitchRGBSlice glitchRGBRed"
                        aria-hidden="true"
                        style={
                            {
                                "--slice-top": slice.top,
                                "--slice-bottom": slice.bottom,
                                "--slice-x": slice.x,
                                "--slice-y": slice.y,
                                "--slice-delay": slice.delay,
                                filter: `url(#${redFilterId})`,
                            } as React.CSSProperties
                        }
                    >
                        {renderSlot(`slice-red-${index}`)}
                    </div>
                    <div
                        className="glitchRGBFX glitchRGBSlice glitchRGBCyan"
                        aria-hidden="true"
                        style={
                            {
                                "--slice-top": slice.top,
                                "--slice-bottom": slice.bottom,
                                "--slice-x": `calc(-1 * ${slice.x})`,
                                "--slice-y": slice.y,
                                "--slice-delay": slice.delay,
                                filter: `url(#${cyanFilterId})`,
                            } as React.CSSProperties
                        }
                    >
                        {renderSlot(`slice-cyan-${index}`)}
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
}

const fxActiveSelector = `
.glitchRGBRoot[data-trigger="always"] .glitchRGBFX,
.glitchRGBRoot[data-trigger="click"][data-active="true"] .glitchRGBFX,
.glitchRGBRoot[data-trigger="hover"]:hover .glitchRGBFX,
.glitchRGBRoot[data-trigger="hover"][data-active="true"] .glitchRGBFX
`

const veilActiveSelector = `
.glitchRGBRoot[data-trigger="always"] .glitchRGBVeil,
.glitchRGBRoot[data-trigger="click"][data-active="true"] .glitchRGBVeil,
.glitchRGBRoot[data-trigger="hover"]:hover .glitchRGBVeil,
.glitchRGBRoot[data-trigger="hover"][data-active="true"] .glitchRGBVeil
`

const css = `
.glitchRGBRoot,
.glitchRGBRoot * {
    box-sizing: border-box;
}

.glitchRGBBase,
.glitchRGBFX {
    width: 100%;
    height: 100%;
    border-radius: inherit;
}

.glitchRGBBase {
    position: relative;
    z-index: 1;
}

/* Slot mode: keep Framer's own ComponentInstance layout intact. */
.glitchRGBSlotPassthrough {
    display: contents;
}

/* Text mode: internal text gets a real box, because naked Framer Text is not reliable as a slot source. */
.glitchRGBTextSlot {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    border-radius: inherit;
}

.glitchRGBText {
    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
    font-synthesis: none;
}

.glitchRGBFX,
.glitchRGBVeil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    transition: opacity 110ms linear;
    will-change: opacity, transform, clip-path;
}

.glitchRGBFX {
    z-index: 3;
    mix-blend-mode: screen;
    overflow: hidden;
}

.glitchRGBVeil {
    z-index: 2;
    border-radius: inherit;
    background:
        linear-gradient(90deg, rgba(255,0,80,.75), rgba(0,255,255,.55), rgba(40,80,255,.65)),
        repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 4px);
    mix-blend-mode: overlay;
}

${fxActiveSelector} {
    opacity: var(--fx-opacity);
}

${veilActiveSelector} {
    opacity: var(--veil-opacity);
}

.glitchRGBRoot[data-disabled="true"] .glitchRGBFX,
.glitchRGBRoot[data-disabled="true"] .glitchRGBVeil {
    display: none;
}

.glitchRGBFull.glitchRGBRed {
    transform: translate3d(var(--red-x), var(--red-y), 0);
    animation: glitchRGBRed var(--duration) steps(2, end) infinite paused;
}

.glitchRGBFull.glitchRGBCyan {
    transform: translate3d(var(--cyan-x), var(--cyan-y), 0);
    animation: glitchRGBCyan var(--duration) steps(2, end) infinite paused;
}

.glitchRGBSlice {
    clip-path: inset(var(--slice-top) 0 var(--slice-bottom) 0);
    transform: translate3d(var(--slice-x), var(--slice-y), 0);
    opacity: 0;
    animation: glitchRGBSlice var(--duration) steps(2, end) infinite paused;
    animation-delay: var(--slice-delay);
}

.glitchRGBRoot[data-motion="on"][data-trigger="always"] .glitchRGBFull,
.glitchRGBRoot[data-motion="on"][data-trigger="always"] .glitchRGBSlice,
.glitchRGBRoot[data-motion="on"][data-trigger="click"][data-active="true"] .glitchRGBFull,
.glitchRGBRoot[data-motion="on"][data-trigger="click"][data-active="true"] .glitchRGBSlice,
.glitchRGBRoot[data-motion="on"][data-trigger="hover"]:hover .glitchRGBFull,
.glitchRGBRoot[data-motion="on"][data-trigger="hover"]:hover .glitchRGBSlice,
.glitchRGBRoot[data-motion="on"][data-trigger="hover"][data-active="true"] .glitchRGBFull,
.glitchRGBRoot[data-motion="on"][data-trigger="hover"][data-active="true"] .glitchRGBSlice {
    animation-play-state: running;
}

.glitchRGBRoot[data-motion="off"] .glitchRGBFull,
.glitchRGBRoot[data-motion="off"] .glitchRGBSlice {
    animation: none !important;
}

.glitchRGBRoot[data-motion="off"] .glitchRGBSlice {
    opacity: 0 !important;
}

@keyframes glitchRGBRed {
    0%, 100% { transform: translate3d(var(--red-x), var(--red-y), 0); }
    13% { transform: translate3d(var(--red-alt-x), 0, 0); }
    14% { transform: translate3d(var(--red-x), var(--red-y), 0); }
    46% { transform: translate3d(var(--red-burst-x), var(--red-y), 0); }
    47% { transform: translate3d(var(--red-x), var(--red-y), 0); }
}

@keyframes glitchRGBCyan {
    0%, 100% { transform: translate3d(var(--cyan-x), var(--cyan-y), 0); }
    17% { transform: translate3d(var(--cyan-alt-x), 0, 0); }
    18% { transform: translate3d(var(--cyan-x), var(--cyan-y), 0); }
    52% { transform: translate3d(var(--cyan-burst-x), var(--cyan-y), 0); }
    53% { transform: translate3d(var(--cyan-x), var(--cyan-y), 0); }
}

@keyframes glitchRGBSlice {
    0%, 8%, 100% { opacity: 0; transform: translate3d(0, 0, 0); }
    9%, 16% { opacity: .95; transform: translate3d(var(--slice-x), var(--slice-y), 0); }
    17%, 25% { opacity: 0; transform: translate3d(0, 0, 0); }
    64%, 72% { opacity: .72; transform: translate3d(var(--slice-x), 0, 0); }
    73%, 100% { opacity: 0; transform: translate3d(0, 0, 0); }
}

@media (hover: none), (pointer: coarse) {
    .glitchRGBRoot[data-mobile="true"] .glitchRGBFX,
    .glitchRGBRoot[data-mobile="true"] .glitchRGBVeil {
        transition-duration: 80ms;
    }

    .glitchRGBRoot[data-mobile="true"] .glitchRGBSlice {
        animation-duration: 0.72s;
    }
}

@media (prefers-reduced-motion: reduce) {
    .glitchRGBFull,
    .glitchRGBSlice {
        animation: none !important;
    }

    .glitchRGBSlice {
        opacity: 0 !important;
    }
}
`

addPropertyControls(GlitchRGBHoverWrapper, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["slot", "text"],
        optionTitles: ["Slot", "Text"],
        defaultValue: "slot",
    },
    content: {
        type: ControlType.ComponentInstance,
        title: "Slot",
        hidden: (props) => props.mode === "text",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "GLITCH\nRGB HOVER\nWRAPPER",
        displayTextArea: true,
        hidden: (props) => props.mode !== "text",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter, system-ui, sans-serif",
        hidden: (props) => props.mode !== "text",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.mode !== "text",
    },
    textSize: {
        type: ControlType.Number,
        title: "Text Size",
        min: 8,
        max: 280,
        step: 1,
        unit: "px",
        defaultValue: 64,
        hidden: (props) => props.mode !== "text",
    },
    textWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 1000,
        step: 50,
        defaultValue: 850,
        hidden: (props) => props.mode !== "text",
    },
    textLineHeight: {
        type: ControlType.Number,
        title: "Line",
        min: 0.65,
        max: 2,
        step: 0.01,
        defaultValue: 0.88,
        hidden: (props) => props.mode !== "text",
    },
    textLetterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: -20,
        max: 40,
        step: 0.1,
        unit: "px",
        defaultValue: -3,
        hidden: (props) => props.mode !== "text",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        hidden: (props) => props.mode !== "text",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Upper", "Lower", "Capitalize"],
        defaultValue: "uppercase",
        hidden: (props) => props.mode !== "text",
    },
    textPadding: {
        type: ControlType.Number,
        title: "Text Pad",
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        defaultValue: 0,
        hidden: (props) => props.mode !== "text",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 46,
    },
    sliceCount: {
        type: ControlType.Number,
        title: "Slices",
        min: 0,
        max: 12,
        step: 1,
        defaultValue: 7,
    },
    rgbOffset: {
        type: ControlType.Number,
        title: "RGB Offset",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },
    flickerSpeed: {
        type: ControlType.Number,
        title: "Flicker",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 4,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click", "always"],
        optionTitles: ["Hover", "Click/Tap", "Always"],
        defaultValue: "hover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    overflowHidden: {
        type: ControlType.Boolean,
        title: "Clip",
        enabledTitle: "Hidden",
        disabledTitle: "Visible",
        defaultValue: true,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.08,
    },
    enableOnMobile: {
        type: ControlType.Boolean,
        title: "Mobile",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
})
