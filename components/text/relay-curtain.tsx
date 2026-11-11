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


type ResponsiveImage = { src: string; srcSet?: string; alt?: string }
type Content = {
    eyebrow: string
    title: string
    summary: string
    action: string
    index: string
    sideNote: string
}
type Palette = {
    background: string
    foreground: string
    muted: string
    accent: string
    curtainA: string
    curtainB: string
    line: string
}
type Layout = {
    padding: number
    radius: number
    mediaWidth: number
    gap: number
    compactAt: number
}
type Curtain = {
    count: number
    angle: number
    overlap: number
    alternate: boolean
    showNumbers: boolean
    texture: number
}
type Motion = {
    enabled: boolean
    mode: "once" | "loop"
    duration: number
    stagger: number
    delay: number
    hold: number
    easing: "smooth" | "expressive" | "linear"
    canvasProgress: number
    replayOnClick: boolean
}
type Media = {
    fit: "cover" | "contain"
    overlay: number
    zoom: number
    grain: number
}

export interface RelayCurtainProps {
    image?: ResponsiveImage
    content?: Content
    palette?: Palette
    layout?: Layout
    curtain?: Curtain
    motion?: Motion
    media?: Media
    displayFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    metaFont?: React.CSSProperties
    ariaLabel?: string
    style?: React.CSSProperties
}

const defaults = {
    content: {
        eyebrow: "EDITORIAL TRANSITION / 07",
        title: "MOTION\nBECOMES\nMEMORY",
        summary:
            "A directional reveal for launches, portfolios, and image-led stories.",
        action: "REPLAY SEQUENCE",
        index: "RC—01",
        sideNote: "ENTER / UNFOLD / ARRIVE",
    },
    palette: {
        background: "#E8E4DA",
        foreground: "#11110F",
        muted: "#6C6A62",
        accent: "#FF4B2B",
        curtainA: "#191A34",
        curtainB: "#B8FF45",
        line: "rgba(17,17,15,.24)",
    },
    layout: {
        padding: 28,
        radius: 26,
        mediaWidth: 58,
        gap: 26,
        compactAt: 640,
    },
    curtain: {
        count: 7,
        angle: -5,
        overlap: 2,
        alternate: true,
        showNumbers: true,
        texture: 16,
    },
    motion: {
        enabled: true,
        mode: "once" as const,
        duration: 920,
        stagger: 76,
        delay: 240,
        hold: 1800,
        easing: "expressive" as const,
        canvasProgress: 58,
        replayOnClick: true,
    },
    media: { fit: "cover" as const, overlay: 12, zoom: 5, grain: 10 },
    displayFont: { fontFamily: "Inter, Arial, sans-serif", fontWeight: 650 },
    bodyFont: { fontFamily: "Inter, Arial, sans-serif", fontWeight: 450 },
    metaFont: { fontFamily: "Inter, Arial, sans-serif", fontWeight: 650 },
    ariaLabel: "Editorial curtain reveal",
}

function clamp(value: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value))
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

function useViewportActivity(ref: React.RefObject<HTMLElement>) {
    const [intersecting, setIntersecting] = React.useState(false)
    const [pageVisible, setPageVisible] = React.useState(false)
    React.useEffect(() => {
        const node = ref.current
        if (!node) return
        if (typeof IntersectionObserver === "undefined") {
            setIntersecting(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => setIntersecting(entry.isIntersecting),
            { threshold: 0.05 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [ref])
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setPageVisible(!document.hidden)
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])
    return intersecting && pageVisible
}

/**
 * Relay Curtain — an editorial image-and-type entrance transition.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1180
 * @framerIntrinsicHeight 760
 */
export default function RelayCurtain(rawProps: RelayCurtainProps = {}) {
    const content = { ...defaults.content, ...rawProps.content }
    const palette = { ...defaults.palette, ...rawProps.palette }
    const layout = { ...defaults.layout, ...rawProps.layout }
    const curtain = { ...defaults.curtain, ...rawProps.curtain }
    const motion = { ...defaults.motion, ...rawProps.motion }
    const media = { ...defaults.media, ...rawProps.media }
    const displayFont = { ...defaults.displayFont, ...rawProps.displayFont }
    const bodyFont = { ...defaults.bodyFont, ...rawProps.bodyFont }
    const metaFont = { ...defaults.metaFont, ...rawProps.metaFont }
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [revealed, setRevealed] = React.useState(false)
    const [cycle, setCycle] = React.useState(0)
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const active = useViewportActivity(rootRef)
    const bandCount = Math.round(clamp(curtain.count, 3, 10))

    React.useEffect(() => {
        if (isStatic || reducedMotion || !motion.enabled) {
            setRevealed(true)
            return
        }
        if (!active) return
        setRevealed(false)
        let revealTimer = window.setTimeout(
            () => setRevealed(true),
            Math.max(0, motion.delay)
        )
        let loopTimer: number | undefined
        if (motion.mode === "loop") {
            const cycleDuration =
                motion.delay +
                motion.duration +
                motion.stagger * (bandCount - 1) +
                motion.hold
            loopTimer = window.setTimeout(
                () => setCycle((value) => value + 1),
                Math.max(700, cycleDuration)
            )
        }
        return () => {
            clearTimeout(revealTimer)
            if (loopTimer !== undefined) clearTimeout(loopTimer)
        }
    }, [
        active,
        bandCount,
        cycle,
        isStatic,
        motion.delay,
        motion.duration,
        motion.enabled,
        motion.hold,
        motion.mode,
        motion.stagger,
        reducedMotion,
    ])

    const replay = React.useCallback(() => {
        if (
            isStatic ||
            reducedMotion ||
            !motion.enabled ||
            !motion.replayOnClick
        )
            return
        setCycle((value) => value + 1)
    }, [isStatic, motion.enabled, motion.replayOnClick, reducedMotion])

    const easing =
        motion.easing === "linear"
            ? "linear"
            : motion.easing === "smooth"
              ? "cubic-bezier(.4,0,.2,1)"
              : "cubic-bezier(.76,0,.16,1)"
    const staticProgress = clamp(motion.canvasProgress / 100)
    const contentProgress = isStatic
        ? clamp((staticProgress - 0.18) / 0.62)
        : revealed
          ? 1
          : 0
    const label = rawProps.ariaLabel || defaults.ariaLabel
    const fallbackArt = `radial-gradient(circle at 70% 26%, ${palette.curtainB}, transparent 25%), radial-gradient(circle at 25% 72%, ${palette.accent}, transparent 32%), linear-gradient(135deg, ${palette.curtainA}, #54528f 55%, #1a1b2d)`
    const css = `
        .relay-root, .relay-root * { box-sizing: border-box; }
        .relay-root { container-type: size; position: relative; width: 100%; height: 100%; min-width: 260px; min-height: 320px; overflow: hidden; isolation: isolate; color: ${palette.foreground}; background: ${palette.background}; border-radius: ${layout.radius}px; }
        .relay-grid { position: absolute; inset: ${layout.padding}px; z-index: 2; display: grid; grid-template-columns: minmax(220px, ${100 - layout.mediaWidth}fr) minmax(0, ${layout.mediaWidth}fr); gap: ${layout.gap}px; }
        .relay-copy { min-width: 0; display: flex; flex-direction: column; border-top: 1px solid ${palette.line}; border-bottom: 1px solid ${palette.line}; padding: 18px 0; opacity: ${contentProgress}; transform: translateY(${(1 - contentProgress) * 22}px); transition: opacity 520ms ease, transform 700ms ${easing}; }
        .relay-meta { display: flex; justify-content: space-between; gap: 12px; font-size: clamp(9px, 1cqw, 13px); line-height: 1.15; letter-spacing: .13em; text-transform: uppercase; }
        .relay-title { margin: auto 0; max-width: 98%; white-space: pre-line; font-size: clamp(56px, 8.7cqw, 126px); line-height: .78; letter-spacing: -.07em; text-transform: uppercase; }
        .relay-summary { max-width: 340px; margin: 0; color: ${palette.muted}; font-size: clamp(12px, 1.25cqw, 17px); line-height: 1.35; }
        .relay-bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
        .relay-action { appearance: none; border: 1px solid ${palette.foreground}; border-radius: 999px; padding: 11px 14px; color: ${palette.foreground}; background: transparent; cursor: ${motion.replayOnClick ? "pointer" : "default"}; font: inherit; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }
        .relay-action:focus-visible { outline: 3px solid ${palette.accent}; outline-offset: 3px; }
        .relay-media { position: relative; min-width: 0; overflow: hidden; border-radius: max(0px, ${layout.radius - 9}px); background: ${fallbackArt}; }
        .relay-media img { width: 100%; height: 100%; display: block; object-fit: ${media.fit}; transform: scale(${1 + media.zoom / 100}); }
        .relay-media::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent 48%, rgba(0,0,0,${(media.overlay / 100) * 0.72})); }
        .relay-art { position: absolute; inset: 0; overflow: hidden; }
        .relay-art::before { content: ""; position: absolute; width: 58%; aspect-ratio: 1; right: -10%; top: 5%; border: clamp(18px, 4cqw, 64px) solid rgba(255,255,255,.32); border-radius: 50%; mix-blend-mode: overlay; }
        .relay-art::after { content: ""; position: absolute; width: 82%; height: 30%; left: -16%; bottom: 13%; background: ${palette.accent}; transform: rotate(-12deg); mix-blend-mode: screen; opacity: .78; }
        .relay-media-label { position: absolute; z-index: 3; left: 18px; right: 18px; bottom: 16px; display: flex; justify-content: space-between; color: white; text-shadow: 0 1px 14px rgba(0,0,0,.34); }
        .relay-curtains { position: absolute; inset: 0; z-index: 8; pointer-events: none; overflow: hidden; }
        .relay-band { position: absolute; left: -8%; width: 116%; background: var(--band-color); transform-origin: center; will-change: transform; transition-property: transform; transition-duration: ${motion.duration}ms; transition-timing-function: ${easing}; }
        .relay-band::after { content: ""; position: absolute; inset: 0; opacity: ${curtain.texture / 100}; background-image: repeating-linear-gradient(90deg, transparent 0 12px, rgba(255,255,255,.22) 12px 13px); mix-blend-mode: overlay; }
        .relay-band-number { position: absolute; right: 3.5%; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,.8); font-size: 10px; letter-spacing: .14em; }
        .relay-rule { position: absolute; z-index: 3; left: ${layout.padding}px; right: ${layout.padding}px; top: 50%; border-top: 1px solid ${palette.line}; pointer-events: none; opacity: .55; }
        .relay-grain { position: absolute; inset: 0; z-index: 12; pointer-events: none; opacity: ${(media.grain / 100) * 0.45}; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.92' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.42'/%3E%3C/svg%3E"); mix-blend-mode: soft-light; }
        .relay-root[data-active="false"] .relay-band, .relay-root[data-active="false"] .relay-copy { transition: none; will-change: auto; }
        @container (max-width: ${layout.compactAt}px) {
            .relay-grid { inset: ${Math.max(16, layout.padding * 0.7)}px; grid-template-columns: 1fr; grid-template-rows: minmax(0, 44%) minmax(0, 56%); gap: 14px; }
            .relay-copy { grid-row: 2; padding: 14px 0; }
            .relay-media { grid-row: 1; }
            .relay-title { font-size: clamp(54px, 18cqw, 92px); }
            .relay-summary { max-width: 68%; font-size: 11px; }
            .relay-side { display: none; }
            .relay-rule { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .relay-band, .relay-copy { transition: none !important; will-change: auto; } }
    `

    return (
        <div
            ref={rootRef}
            className="relay-root"
            style={rawProps.style}
            role="region"
            aria-label={label}
            data-active={active || isStatic ? "true" : "false"}
        >
            <style>{css}</style>
            <div className="relay-rule" />
            <div className="relay-grid">
                <section className="relay-copy">
                    <div className="relay-meta" style={metaFont}>
                        <span>{content.eyebrow}</span>
                        <span>{content.index}</span>
                    </div>
                    <h2 className="relay-title" style={displayFont}>
                        {content.title}
                    </h2>
                    <div className="relay-bottom">
                        <p className="relay-summary" style={bodyFont}>
                            {content.summary}
                        </p>
                        <button
                            className="relay-action"
                            type="button"
                            style={metaFont}
                            onClick={replay}
                            disabled={!motion.replayOnClick}
                            aria-label={content.action}
                        >
                            {content.action}
                        </button>
                    </div>
                </section>
                <figure
                    className="relay-media"
                    aria-label={
                        rawProps.image?.alt || "Abstract editorial artwork"
                    }
                >
                    {rawProps.image?.src ? (
                        <img
                            src={rawProps.image.src}
                            srcSet={rawProps.image.srcSet}
                            alt={rawProps.image.alt || ""}
                        />
                    ) : (
                        <div className="relay-art" />
                    )}
                    <figcaption
                        className="relay-media-label relay-meta"
                        style={metaFont}
                    >
                        <span>FRAME / 07</span>
                        <span className="relay-side">{content.sideNote}</span>
                    </figcaption>
                </figure>
            </div>
            <div className="relay-curtains" aria-hidden="true">
                {Array.from({ length: bandCount }).map((_, index) => {
                    const direction = curtain.alternate && index % 2 ? -1 : 1
                    const progress = isStatic
                        ? staticProgress
                        : revealed
                          ? 1
                          : 0
                    const translate = direction * progress * 112
                    const height = 100 / bandCount + curtain.overlap
                    return (
                        <div
                            className="relay-band"
                            key={index}
                            style={
                                {
                                    top: `${(index * 100) / bandCount - curtain.overlap / 2}%`,
                                    height: `${height}%`,
                                    "--band-color":
                                        index % 3 === 1
                                            ? palette.curtainB
                                            : index % 3 === 2
                                              ? palette.accent
                                              : palette.curtainA,
                                    transform: `translateX(${translate}%) skewX(${curtain.angle}deg)`,
                                    transitionDelay: isStatic
                                        ? "0ms"
                                        : `${index * motion.stagger}ms`,
                                } as React.CSSProperties
                            }
                        >
                            {curtain.showNumbers ? (
                                <span
                                    className="relay-band-number"
                                    style={metaFont}
                                >
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            ) : null}
                        </div>
                    )
                })}
            </div>
            <div className="relay-grain" />
        </div>
    )
}

addPropertyControls(RelayCurtain, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            eyebrow: {
                type: ControlType.String,
                defaultValue: defaults.content.eyebrow,
            },
            title: {
                type: ControlType.String,
                displayTextArea: true,
                defaultValue: defaults.content.title,
            },
            summary: {
                type: ControlType.String,
                displayTextArea: true,
                defaultValue: defaults.content.summary,
            },
            action: {
                type: ControlType.String,
                defaultValue: defaults.content.action,
            },
            index: {
                type: ControlType.String,
                defaultValue: defaults.content.index,
            },
            sideNote: {
                type: ControlType.String,
                defaultValue: defaults.content.sideNote,
            },
        },
    },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                defaultValue: defaults.palette.background,
            },
            foreground: {
                type: ControlType.Color,
                defaultValue: defaults.palette.foreground,
            },
            muted: {
                type: ControlType.Color,
                defaultValue: defaults.palette.muted,
            },
            accent: {
                type: ControlType.Color,
                defaultValue: defaults.palette.accent,
            },
            curtainA: {
                type: ControlType.Color,
                title: "Curtain 1",
                defaultValue: defaults.palette.curtainA,
            },
            curtainB: {
                type: ControlType.Color,
                title: "Curtain 2",
                defaultValue: defaults.palette.curtainB,
            },
            line: {
                type: ControlType.Color,
                defaultValue: defaults.palette.line,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                min: 10,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.padding,
            },
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.radius,
            },
            mediaWidth: {
                type: ControlType.Number,
                min: 35,
                max: 72,
                unit: "%",
                defaultValue: defaults.layout.mediaWidth,
            },
            gap: {
                type: ControlType.Number,
                min: 8,
                max: 60,
                unit: "px",
                defaultValue: defaults.layout.gap,
            },
            compactAt: {
                type: ControlType.Number,
                min: 360,
                max: 900,
                step: 10,
                unit: "px",
                defaultValue: defaults.layout.compactAt,
            },
        },
    },
    curtain: {
        type: ControlType.Object,
        title: "Curtain",
        controls: {
            count: {
                type: ControlType.Number,
                min: 3,
                max: 10,
                step: 1,
                displayStepper: true,
                defaultValue: defaults.curtain.count,
            },
            angle: {
                type: ControlType.Number,
                min: -18,
                max: 18,
                unit: "°",
                defaultValue: defaults.curtain.angle,
            },
            overlap: {
                type: ControlType.Number,
                min: 0,
                max: 8,
                unit: "%",
                defaultValue: defaults.curtain.overlap,
            },
            alternate: {
                type: ControlType.Boolean,
                defaultValue: defaults.curtain.alternate,
            },
            showNumbers: {
                type: ControlType.Boolean,
                title: "Numbers",
                defaultValue: defaults.curtain.showNumbers,
            },
            texture: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: defaults.curtain.texture,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                defaultValue: defaults.motion.enabled,
            },
            mode: {
                type: ControlType.Enum,
                options: ["once", "loop"],
                optionTitles: ["Once", "Loop"],
                defaultValue: defaults.motion.mode,
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                min: 200,
                max: 2400,
                step: 20,
                unit: "ms",
                defaultValue: defaults.motion.duration,
            },
            stagger: {
                type: ControlType.Number,
                min: 0,
                max: 240,
                step: 4,
                unit: "ms",
                defaultValue: defaults.motion.stagger,
            },
            delay: {
                type: ControlType.Number,
                min: 0,
                max: 2000,
                step: 20,
                unit: "ms",
                defaultValue: defaults.motion.delay,
            },
            hold: {
                type: ControlType.Number,
                min: 400,
                max: 8000,
                step: 100,
                unit: "ms",
                defaultValue: defaults.motion.hold,
                hidden: (p: any) => p.mode !== "loop",
            },
            easing: {
                type: ControlType.Enum,
                options: ["smooth", "expressive", "linear"],
                optionTitles: ["Smooth", "Expressive", "Linear"],
                defaultValue: defaults.motion.easing,
            },
            canvasProgress: {
                type: ControlType.Number,
                title: "Canvas Frame",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: defaults.motion.canvasProgress,
            },
            replayOnClick: {
                type: ControlType.Boolean,
                title: "Replay",
                defaultValue: defaults.motion.replayOnClick,
            },
        },
    },
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            fit: {
                type: ControlType.Enum,
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: defaults.media.fit,
                displaySegmentedControl: true,
            },
            overlay: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: defaults.media.overlay,
            },
            zoom: {
                type: ControlType.Number,
                min: 0,
                max: 24,
                unit: "%",
                defaultValue: defaults.media.zoom,
            },
            grain: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: defaults.media.grain,
            },
        },
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: defaults.ariaLabel,
    },
})
