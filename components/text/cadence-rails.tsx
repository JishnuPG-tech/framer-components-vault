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


type Rail = {
    text: string
    note: string
    background: string
    color: string
    direction: "left" | "right"
    speed: number
    outline: boolean
}

type Palette = {
    background: string
    foreground: string
    muted: string
    line: string
    control: string
}

type Layout = {
    padding: number
    radius: number
    gap: number
    railRadius: number
    railHeight: number
    angle: number
    compactAt: number
}

type Typography = {
    size: number
    mobileSize: number
    tracking: number
    outlineWidth: number
    uppercase: boolean
    separator: string
}

type Motion = {
    enabled: boolean
    duration: number
    hover: "pause" | "none"
    canvasPhase: number
}

type Texture = {
    grid: boolean
    gridSize: number
    grain: number
    vignette: number
}

export interface CadenceRailsProps {
    rails?: Rail[]
    eyebrow?: string
    index?: string
    status?: string
    playLabel?: string
    pauseLabel?: string
    palette?: Palette
    layout?: Layout
    typography?: Typography
    motion?: Motion
    texture?: Texture
    displayFont?: React.CSSProperties
    metaFont?: React.CSSProperties
    showChrome?: boolean
    ariaLabel?: string
    style?: React.CSSProperties
}

const defaultRails: Rail[] = [
    {
        text: "FORM FOLLOWS FEELING",
        note: "DIRECTION / 01",
        background: "#F2EBDD",
        color: "#151515",
        direction: "left",
        speed: 92,
        outline: false,
    },
    {
        text: "MAKE THE SIGNAL VISIBLE",
        note: "MOTION / 02",
        background: "#B8FF38",
        color: "#11120E",
        direction: "right",
        speed: 74,
        outline: false,
    },
    {
        text: "BUILD WORLDS WORTH ENTERING",
        note: "SYSTEM / 03",
        background: "#FF6047",
        color: "#17100E",
        direction: "left",
        speed: 112,
        outline: true,
    },
    {
        text: "IDEAS IN PERPETUAL MOTION",
        note: "STUDIO / 04",
        background: "#6C63FF",
        color: "#F5F0E7",
        direction: "right",
        speed: 84,
        outline: false,
    },
]

const defaults = {
    eyebrow: "KINETIC TYPE SYSTEM / 04",
    index: "CR—01",
    status: "LIVE COMPOSITION",
    playLabel: "PLAY",
    pauseLabel: "PAUSE",
    palette: {
        background: "#111214",
        foreground: "#F4EFE6",
        muted: "#9A9A94",
        line: "rgba(244,239,230,.18)",
        control: "#B8FF38",
    },
    layout: {
        padding: 24,
        radius: 28,
        gap: 10,
        railRadius: 14,
        railHeight: 126,
        angle: -1.2,
        compactAt: 620,
    },
    typography: {
        size: 92,
        mobileSize: 52,
        tracking: -5,
        outlineWidth: 2,
        uppercase: true,
        separator: "✦",
    },
    motion: {
        enabled: true,
        duration: 18,
        hover: "pause" as const,
        canvasPhase: 28,
    },
    texture: { grid: true, gridSize: 52, grain: 0.12, vignette: 0.48 },
    displayFont: { fontFamily: "Inter, Arial, sans-serif", fontWeight: 750 },
    metaFont: { fontFamily: "Inter, Arial, sans-serif", fontWeight: 650 },
    showChrome: true,
    ariaLabel: "Kinetic typography rails",
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function withoutTypeSizing(styles: React.CSSProperties) {
    const {
        fontSize: _fontSize,
        lineHeight: _lineHeight,
        letterSpacing: _letterSpacing,
        textAlign: _textAlign,
        ...fontStyles
    } = styles
    return fontStyles
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])
    return reduced
}

function useVisible(ref: React.RefObject<HTMLElement>) {
    const [visible, setVisible] = React.useState(true)
    React.useEffect(() => {
        const node = ref.current
        if (!node || typeof IntersectionObserver === "undefined") return
        const updatePageState = () =>
            setVisible(
                document.visibilityState !== "hidden" &&
                    node.getBoundingClientRect().bottom > 0 &&
                    node.getBoundingClientRect().top < window.innerHeight
            )
        const observer = new IntersectionObserver(
            ([entry]) =>
                setVisible(
                    entry.isIntersecting &&
                        document.visibilityState !== "hidden"
                ),
            { threshold: 0.01 }
        )
        observer.observe(node)
        document.addEventListener("visibilitychange", updatePageState)
        return () => {
            observer.disconnect()
            document.removeEventListener("visibilitychange", updatePageState)
        }
    }, [ref])
    return visible
}

/**
 * Cadence Rails — a visibility-aware kinetic typography hero.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1180
 * @framerIntrinsicHeight 760
 */
export default function CadenceRails(rawProps: CadenceRailsProps = {}) {
    const rails = (
        rawProps.rails?.length ? rawProps.rails : defaultRails
    ).slice(0, 6)
    const palette = { ...defaults.palette, ...rawProps.palette }
    const layout = { ...defaults.layout, ...rawProps.layout }
    const typography = { ...defaults.typography, ...rawProps.typography }
    const motion = { ...defaults.motion, ...rawProps.motion }
    const texture = { ...defaults.texture, ...rawProps.texture }
    const displayFont = withoutTypeSizing({
        ...defaults.displayFont,
        ...rawProps.displayFont,
    })
    const metaFont = withoutTypeSizing({
        ...defaults.metaFont,
        ...rawProps.metaFont,
    })
    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const isVisible = useVisible(rootRef)
    const [paused, setPaused] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const canAnimate = motion.enabled && !isStatic && !reducedMotion
    const isRunning =
        canAnimate &&
        isVisible &&
        !paused &&
        !(hovered && motion.hover === "pause")
    const phase = clamp(
        typography.uppercase ? motion.canvasPhase : motion.canvasPhase,
        0,
        49
    )
    const showChrome = rawProps.showChrome ?? defaults.showChrome
    const summary = rails.map((rail) => rail.text).join(". ")

    const css = `
        @keyframes cadence-travel { to { transform: translate3d(-50%,0,0); } }
        .cadence-root, .cadence-root * { box-sizing: border-box; }
        .cadence-root { container-type: size; position: relative; width: 100%; height: 100%; min-width: 260px; min-height: 380px; overflow: hidden; isolation: isolate; padding: ${layout.padding}px; border-radius: ${layout.radius}px; color: ${palette.foreground}; background: ${palette.background}; }
        .cadence-root::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: ${texture.grid ? 0.55 : 0}; background-image: linear-gradient(${palette.line} 1px,transparent 1px), linear-gradient(90deg,${palette.line} 1px,transparent 1px); background-size: ${texture.gridSize}px ${texture.gridSize}px; mask-image: linear-gradient(to bottom,black,transparent 78%); }
        .cadence-root::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: ${texture.grain}; mix-blend-mode: soft-light; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E"), radial-gradient(circle at 50% 50%,transparent 30%,rgba(0,0,0,${texture.vignette}) 120%); }
        .cadence-shell { position: relative; z-index: 1; height: 100%; display: grid; grid-template-rows: auto minmax(0,1fr) auto; gap: 18px; }
        .cadence-chrome { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 10px; line-height: 1; letter-spacing: .15em; text-transform: uppercase; }
        .cadence-chrome-group { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .cadence-dot { width: 7px; height: 7px; flex: 0 0 auto; border-radius: 50%; background: ${palette.control}; box-shadow: 0 0 18px ${palette.control}; }
        .cadence-muted { color: ${palette.muted}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cadence-button { appearance: none; border: 1px solid ${palette.line}; border-radius: 99px; padding: 9px 13px; color: ${palette.foreground}; background: rgba(255,255,255,.04); font: inherit; letter-spacing: inherit; cursor: pointer; }
        .cadence-button:hover { color: ${palette.background}; background: ${palette.control}; border-color: ${palette.control}; }
        .cadence-button:focus-visible { outline: 3px solid ${palette.control}; outline-offset: 3px; }
        .cadence-rails { min-height: 0; display: flex; flex-direction: column; justify-content: center; gap: ${layout.gap}px; margin: 0 ${-layout.padding - 32}px; padding: 14px 0; }
        .cadence-rail { position: relative; height: clamp(70px, ${(layout.railHeight / 760) * 100}cqh, ${layout.railHeight}px); flex: 0 1 ${layout.railHeight}px; overflow: hidden; border-radius: ${layout.railRadius}px; transform: rotate(var(--angle)); box-shadow: 0 12px 34px rgba(0,0,0,.22); }
        .cadence-track { position: absolute; inset-block: 0; left: 0; display: flex; width: max-content; transform: translate3d(-${phase}%,0,0); animation: cadence-travel var(--duration) linear infinite; animation-direction: var(--direction); animation-play-state: ${isRunning ? "running" : "paused"}; will-change: ${isRunning ? "transform" : "auto"}; }
        .cadence-root[data-static="true"] .cadence-track { animation: none; }
        .cadence-group { height: 100%; display: flex; align-items: center; flex: none; }
        .cadence-word { display: flex; align-items: center; height: 100%; white-space: nowrap; font-size: clamp(${typography.mobileSize}px, ${(typography.size / 1180) * 100}cqw, ${typography.size}px); line-height: .82; letter-spacing: ${typography.tracking}px; text-transform: ${typography.uppercase ? "uppercase" : "none"}; }
        .cadence-outline { color: transparent !important; -webkit-text-stroke: ${typography.outlineWidth}px var(--rail-color); }
        .cadence-separator { display: inline-grid; place-items: center; width: .9em; margin: 0 .26em; font-size: .38em; letter-spacing: 0; color: currentColor; -webkit-text-stroke: 0; }
        .cadence-note { position: absolute; z-index: 2; right: 14px; bottom: 9px; padding: 6px 8px; border-radius: 99px; color: var(--rail-color); background: color-mix(in srgb,var(--rail-bg) 84%,transparent); border: 1px solid color-mix(in srgb,var(--rail-color) 28%,transparent); font-size: 8px; line-height: 1; letter-spacing: .15em; text-transform: uppercase; backdrop-filter: blur(8px); }
        .cadence-footer { padding-top: 12px; border-top: 1px solid ${palette.line}; }
        .cadence-rule { width: min(28vw,260px); height: 3px; overflow: hidden; background: ${palette.line}; }
        .cadence-rule::after { content: ""; display: block; width: ${isRunning ? "62%" : "28%"}; height: 100%; background: ${palette.control}; transition: width .35s ease; }
        .cadence-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        @container (max-width: ${layout.compactAt}px) {
            .cadence-root { padding: ${Math.max(14, layout.padding * 0.68)}px; }
            .cadence-shell { gap: 12px; }
            .cadence-rails { gap: ${Math.max(7, layout.gap * 0.72)}px; margin-inline: ${-layout.padding - 12}px; }
            .cadence-rail { height: auto; flex: 1 1 0; min-height: 72px; border-radius: ${Math.max(8, layout.railRadius * 0.75)}px; }
            .cadence-word { font-size: clamp(38px, ${(typography.mobileSize / 390) * 100}cqw, ${typography.mobileSize}px); }
            .cadence-chrome { font-size: 8px; letter-spacing: .11em; }
            .cadence-hide-mobile { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .cadence-track { animation: none !important; will-change: auto !important; } }
    `

    return (
        <div
            ref={rootRef}
            className="cadence-root"
            data-static={(!canAnimate).toString()}
            data-visible={isVisible.toString()}
            role="region"
            aria-label={rawProps.ariaLabel || defaults.ariaLabel}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ ...rawProps.style }}
        >
            <style>{css}</style>
            <span className="cadence-sr">{summary}</span>
            <div className="cadence-shell">
                {showChrome ? (
                    <header className="cadence-chrome" style={metaFont}>
                        <div className="cadence-chrome-group">
                            <span className="cadence-dot" />
                            <span>{rawProps.eyebrow || defaults.eyebrow}</span>
                        </div>
                        <div className="cadence-chrome-group">
                            <span className="cadence-muted cadence-hide-mobile">
                                {rawProps.status || defaults.status}
                            </span>
                            <span>{rawProps.index || defaults.index}</span>
                        </div>
                    </header>
                ) : (
                    <span />
                )}
                <div className="cadence-rails" aria-hidden="true">
                    {rails.map((rail, index) => {
                        const text = typography.uppercase
                            ? rail.text.toUpperCase()
                            : rail.text
                        const copies = Array.from({ length: 3 }, (_, copy) => (
                            <React.Fragment key={copy}>
                                <span className="cadence-word">{text}</span>
                                <span className="cadence-separator">
                                    {typography.separator}
                                </span>
                            </React.Fragment>
                        ))
                        return (
                            <div
                                className="cadence-rail"
                                key={`${rail.text}-${index}`}
                                style={{
                                    ["--angle" as string]: `${(index % 2 ? -1 : 1) * layout.angle}deg`,
                                    ["--rail-bg" as string]: rail.background,
                                    ["--rail-color" as string]: rail.color,
                                    background: rail.background,
                                    color: rail.color,
                                }}
                            >
                                <div
                                    className="cadence-track"
                                    data-rail={index + 1}
                                    style={{
                                        ["--duration" as string]: `${Math.max(4, (motion.duration * 100) / clamp(rail.speed, 20, 200))}s`,
                                        ["--direction" as string]:
                                            rail.direction === "right"
                                                ? "reverse"
                                                : "normal",
                                        ...displayFont,
                                    }}
                                >
                                    <div
                                        className={`cadence-group${rail.outline ? " cadence-outline" : ""}`}
                                    >
                                        {copies}
                                    </div>
                                    <div
                                        className={`cadence-group${rail.outline ? " cadence-outline" : ""}`}
                                        aria-hidden="true"
                                    >
                                        {copies}
                                    </div>
                                </div>
                                <span className="cadence-note" style={metaFont}>
                                    {rail.note}
                                </span>
                            </div>
                        )
                    })}
                </div>
                {showChrome ? (
                    <footer
                        className="cadence-chrome cadence-footer"
                        style={metaFont}
                    >
                        <div className="cadence-chrome-group">
                            <span>
                                {String(rails.length).padStart(2, "0")} RAILS
                            </span>
                            <span className="cadence-muted cadence-hide-mobile">
                                VISIBILITY AWARE
                            </span>
                        </div>
                        <div className="cadence-chrome-group">
                            <div className="cadence-rule" />
                            <button
                                className="cadence-button"
                                type="button"
                                aria-hidden="false"
                                tabIndex={0}
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setPaused((value) => !value)
                                }}
                            >
                                {paused
                                    ? rawProps.playLabel || defaults.playLabel
                                    : rawProps.pauseLabel ||
                                      defaults.pauseLabel}
                            </button>
                        </div>
                    </footer>
                ) : (
                    <span />
                )}
            </div>
        </div>
    )
}

CadenceRails.defaultProps = {
    ...defaults,
    rails: defaultRails,
    width: 1180,
    height: 760,
}

addPropertyControls(CadenceRails, {
    rails: {
        type: ControlType.Array,
        title: "Rails",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "DESIGN IN MOTION",
                },
                note: {
                    type: ControlType.String,
                    title: "Note",
                    defaultValue: "RAIL / 01",
                },
                background: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#B8FF38",
                },
                color: {
                    type: ControlType.Color,
                    title: "Text",
                    defaultValue: "#11120E",
                },
                direction: {
                    type: ControlType.Enum,
                    title: "Direction",
                    options: ["left", "right"],
                    optionTitles: ["Left", "Right"],
                    defaultValue: "left",
                },
                speed: {
                    type: ControlType.Number,
                    title: "Speed",
                    min: 20,
                    max: 200,
                    step: 1,
                    defaultValue: 100,
                    unit: "%",
                },
                outline: {
                    type: ControlType.Boolean,
                    title: "Style",
                    enabledTitle: "Outline",
                    disabledTitle: "Solid",
                    defaultValue: false,
                },
            },
        },
    },
    eyebrow: { type: ControlType.String, title: "Eyebrow" },
    index: { type: ControlType.String, title: "Index" },
    status: { type: ControlType.String, title: "Status" },
    playLabel: { type: ControlType.String, title: "Play Label" },
    pauseLabel: { type: ControlType.String, title: "Pause Label" },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, title: "Background" },
            foreground: { type: ControlType.Color, title: "Foreground" },
            muted: { type: ControlType.Color, title: "Muted" },
            line: { type: ControlType.Color, title: "Lines" },
            control: { type: ControlType.Color, title: "Control" },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Frame Radius",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            railRadius: {
                type: ControlType.Number,
                title: "Rail Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            railHeight: {
                type: ControlType.Number,
                title: "Rail Height",
                min: 60,
                max: 220,
                step: 2,
                unit: "px",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: -6,
                max: 6,
                step: 0.1,
                unit: "°",
            },
            compactAt: {
                type: ControlType.Number,
                title: "Mobile At",
                min: 360,
                max: 900,
                step: 10,
                unit: "px",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Desktop Size",
                min: 36,
                max: 180,
                step: 1,
                unit: "px",
            },
            mobileSize: {
                type: ControlType.Number,
                title: "Mobile Size",
                min: 28,
                max: 96,
                step: 1,
                unit: "px",
            },
            tracking: {
                type: ControlType.Number,
                title: "Tracking",
                min: -12,
                max: 12,
                step: 0.5,
                unit: "px",
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline",
                min: 1,
                max: 5,
                step: 0.5,
                unit: "px",
            },
            uppercase: {
                type: ControlType.Boolean,
                title: "Case",
                enabledTitle: "Upper",
                disabledTitle: "Original",
            },
            separator: { type: ControlType.String, title: "Separator" },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Animate",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 5,
                max: 60,
                step: 1,
                unit: "s",
            },
            hover: {
                type: ControlType.Enum,
                title: "On Hover",
                options: ["pause", "none"],
                optionTitles: ["Pause", "Continue"],
            },
            canvasPhase: {
                type: ControlType.Number,
                title: "Static Phase",
                min: 0,
                max: 49,
                step: 1,
                unit: "%",
            },
        },
    },
    texture: {
        type: ControlType.Object,
        title: "Texture",
        controls: {
            grid: { type: ControlType.Boolean, title: "Grid" },
            gridSize: {
                type: ControlType.Number,
                title: "Grid Size",
                min: 20,
                max: 120,
                step: 2,
                unit: "px",
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 0.5,
                step: 0.01,
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display Font",
        controls: "extended",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    showChrome: {
        type: ControlType.Boolean,
        title: "Chrome",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ariaLabel: { type: ControlType.String, title: "ARIA Label" },
})
