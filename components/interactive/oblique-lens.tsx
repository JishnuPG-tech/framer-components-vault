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


type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type Palette = {
    background: string
    primaryA: string
    primaryB: string
    revealA: string
    revealB: string
    foreground: string
    muted: string
    accent: string
    line: string
}

type LensSettings = {
    size: number
    zoom: number
    rimWidth: number
    glow: number
    chromatic: number
    crosshair: boolean
}

type MotionSettings = {
    enabled: boolean
    follow: number
    parallax: number
    tilt: number
    idle: boolean
    idleSpeed: number
}

type LayoutSettings = {
    padding: number
    radius: number
    compactAt: number
    mediaFit: "cover" | "contain"
}

type TextureSettings = {
    overlay: number
    grain: number
    grid: boolean
    gridSize: number
}

type BehaviorSettings = {
    staticX: number
    staticY: number
    hideCursor: boolean
    link: string
    openInNewTab: boolean
}

export interface ObliqueLensProps {
    primaryImage?: ResponsiveImage
    revealImage?: ResponsiveImage
    eyebrow: string
    title: string
    primaryLabel: string
    revealLabel: string
    index: string
    ariaLabel: string
    displayFont: React.CSSProperties
    metaFont: React.CSSProperties
    palette: Palette
    lens: LensSettings
    motion: MotionSettings
    layout: LayoutSettings
    texture: TextureSettings
    behavior: BehaviorSettings
    style?: React.CSSProperties
}

const defaults: ObliqueLensProps = {
    eyebrow: "DUAL IMAGE SYSTEM / 04",
    title: "SHIFT THE\nPERSPECTIVE",
    primaryLabel: "SURFACE",
    revealLabel: "BEYOND",
    index: "OL—01",
    ariaLabel:
        "Interactive image reveal. Move the pointer or use arrow keys to reposition the lens.",
    displayFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
    },
    metaFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
    },
    palette: {
        background: "#ECE8DF",
        primaryA: "#F34B32",
        primaryB: "#7039FF",
        revealA: "#CFFF4A",
        revealB: "#1CB7D8",
        foreground: "#11110F",
        muted: "rgba(17, 17, 15, 0.62)",
        accent: "#E9FF67",
        line: "rgba(17, 17, 15, 0.28)",
    },
    lens: {
        size: 330,
        zoom: 112,
        rimWidth: 2,
        glow: 42,
        chromatic: 8,
        crosshair: true,
    },
    motion: {
        enabled: true,
        follow: 18,
        parallax: 16,
        tilt: 3,
        idle: true,
        idleSpeed: 28,
    },
    layout: {
        padding: 28,
        radius: 28,
        compactAt: 620,
        mediaFit: "cover",
    },
    texture: {
        overlay: 18,
        grain: 18,
        grid: true,
        gridSize: 52,
    },
    behavior: {
        staticX: 66,
        staticY: 48,
        hideCursor: true,
        link: "",
        openInNewTab: false,
    },
}

type Point = { x: number; y: number }

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

/**
 * An accessible, cursor-responsive alternate-image lens for editorial reveals.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 720
 */
export default function ObliqueLens(rawProps: ObliqueLensProps) {
    const props = {
        ...defaults,
        ...rawProps,
        palette: { ...defaults.palette, ...rawProps.palette },
        lens: { ...defaults.lens, ...rawProps.lens },
        motion: { ...defaults.motion, ...rawProps.motion },
        layout: { ...defaults.layout, ...rawProps.layout },
        texture: { ...defaults.texture, ...rawProps.texture },
        behavior: { ...defaults.behavior, ...rawProps.behavior },
    }
    const {
        primaryImage,
        revealImage,
        eyebrow,
        title,
        primaryLabel,
        revealLabel,
        index,
        ariaLabel,
        displayFont,
        metaFont,
        palette,
        lens,
        motion,
        layout,
        texture,
        behavior,
        style,
    } = props
    const rootRef = React.useRef<HTMLDivElement>(null)
    const frameRef = React.useRef<number | null>(null)
    const currentRef = React.useRef<Point>({
        x: behavior.staticX / 100,
        y: behavior.staticY / 100,
    })
    const targetRef = React.useRef<Point>({
        x: behavior.staticX / 100,
        y: behavior.staticY / 100,
    })
    const lastInteractionRef = React.useRef(0)
    const [active, setActive] = React.useState(false)
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const writePosition = React.useCallback((point: Point) => {
        const root = rootRef.current
        if (!root) return
        const x = clamp(point.x)
        const y = clamp(point.y)
        root.style.setProperty("--lens-x", `${x * 100}%`)
        root.style.setProperty("--lens-y", `${y * 100}%`)
        root.style.setProperty("--parallax-x", String(x - 0.5))
        root.style.setProperty("--parallax-y", String(y - 0.5))
    }, [])

    React.useEffect(() => {
        const fixed = { x: behavior.staticX / 100, y: behavior.staticY / 100 }
        currentRef.current = fixed
        targetRef.current = fixed
        writePosition(fixed)

        const shouldAnimate =
            motion.enabled && !staticRenderer && !reducedMotion
        if (!shouldAnimate) return

        const start = performance.now()
        const tick = (now: number) => {
            const idle =
                motion.idle &&
                now - lastInteractionRef.current > 1400 &&
                !active
            if (idle) {
                const time = ((now - start) / 1000) * (motion.idleSpeed / 100)
                targetRef.current = {
                    x: 0.5 + Math.cos(time * 0.82) * 0.23,
                    y: 0.5 + Math.sin(time * 1.13) * 0.16,
                }
            }
            const ease = clamp(motion.follow / 100, 0.02, 0.5)
            currentRef.current.x +=
                (targetRef.current.x - currentRef.current.x) * ease
            currentRef.current.y +=
                (targetRef.current.y - currentRef.current.y) * ease
            writePosition(currentRef.current)
            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
        }
    }, [
        active,
        behavior.staticX,
        behavior.staticY,
        motion.enabled,
        motion.follow,
        motion.idle,
        motion.idleSpeed,
        reducedMotion,
        staticRenderer,
        writePosition,
    ])

    const updateTarget = React.useCallback((x: number, y: number) => {
        targetRef.current = { x: clamp(x), y: clamp(y) }
        lastInteractionRef.current = performance.now()
    }, [])

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (staticRenderer || reducedMotion) return
            const rect = event.currentTarget.getBoundingClientRect()
            updateTarget(
                (event.clientX - rect.left) / Math.max(1, rect.width),
                (event.clientY - rect.top) / Math.max(1, rect.height)
            )
        },
        [reducedMotion, staticRenderer, updateTarget]
    )

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            const step = event.shiftKey ? 0.1 : 0.035
            const current = targetRef.current
            let next: Point | null = null
            if (event.key === "ArrowLeft")
                next = { x: current.x - step, y: current.y }
            if (event.key === "ArrowRight")
                next = { x: current.x + step, y: current.y }
            if (event.key === "ArrowUp")
                next = { x: current.x, y: current.y - step }
            if (event.key === "ArrowDown")
                next = { x: current.x, y: current.y + step }
            if (event.key === "Home") next = { x: 0.5, y: 0.5 }
            if (next) {
                event.preventDefault()
                updateTarget(next.x, next.y)
                writePosition(next)
            }
            if ((event.key === "Enter" || event.key === " ") && behavior.link) {
                event.preventDefault()
                if (behavior.openInNewTab)
                    window.open(behavior.link, "_blank", "noopener,noreferrer")
                else window.location.href = behavior.link
            }
        },
        [behavior.link, behavior.openInNewTab, updateTarget, writePosition]
    )

    const onClick = React.useCallback(() => {
        if (!behavior.link) return
        if (behavior.openInNewTab)
            window.open(behavior.link, "_blank", "noopener,noreferrer")
        else window.location.href = behavior.link
    }, [behavior.link, behavior.openInNewTab])

    const primaryFallback = `
        radial-gradient(circle at 24% 24%, color-mix(in srgb, ${palette.primaryA} 94%, transparent), transparent 35%),
        radial-gradient(circle at 78% 76%, color-mix(in srgb, ${palette.primaryB} 88%, transparent), transparent 48%),
        linear-gradient(128deg, color-mix(in srgb, ${palette.primaryB} 52%, ${palette.background}), ${palette.background})
    `
    const revealFallback = `
        radial-gradient(circle at 72% 28%, color-mix(in srgb, ${palette.revealA} 94%, transparent), transparent 34%),
        radial-gradient(circle at 28% 76%, color-mix(in srgb, ${palette.revealB} 90%, transparent), transparent 44%),
        linear-gradient(128deg, color-mix(in srgb, ${palette.revealB} 58%, ${palette.background}), ${palette.background})
    `
    const css = `
        .oblique-root, .oblique-root * { box-sizing: border-box; }
        .oblique-root {
            --lens-x: ${behavior.staticX}%;
            --lens-y: ${behavior.staticY}%;
            --parallax-x: 0.16;
            --parallax-y: -0.02;
            container-type: size;
            position: relative;
            width: 100%;
            height: 100%;
            min-width: 240px;
            min-height: 300px;
            overflow: hidden;
            isolation: isolate;
            border-radius: ${layout.radius}px;
            color: ${palette.foreground};
            background: ${palette.background};
            cursor: ${behavior.hideCursor ? "none" : behavior.link ? "pointer" : "crosshair"};
            transform-style: preserve-3d;
        }
        .oblique-primary, .oblique-reveal-image { position: absolute; inset: 0; width: 100%; height: 100%; }
        .oblique-primary { z-index: 0; background: ${primaryFallback}; }
        .oblique-primary img, .oblique-reveal-image img { width: 100%; height: 100%; object-fit: ${layout.mediaFit}; display: block; }
        .oblique-primary img { transform: scale(1.02) translate(calc(var(--parallax-x) * ${-motion.parallax}px), calc(var(--parallax-y) * ${-motion.parallax}px)); }
        .oblique-reveal-mask {
            position: absolute;
            inset: 0;
            z-index: 2;
            clip-path: circle(${lens.size / 2}px at var(--lens-x) var(--lens-y));
            will-change: clip-path;
        }
        .oblique-reveal-image {
            background: ${revealFallback};
            transform: scale(${lens.zoom / 100}) translate(calc(var(--parallax-x) * ${motion.parallax}px), calc(var(--parallax-y) * ${motion.parallax}px));
            transform-origin: var(--lens-x) var(--lens-y);
            will-change: transform;
        }
        .oblique-reveal-image::after { content: ""; position: absolute; inset: 0; background: ${palette.revealA}; opacity: ${texture.overlay / 100}; mix-blend-mode: soft-light; }
        .oblique-lens {
            position: absolute;
            z-index: 5;
            left: var(--lens-x);
            top: var(--lens-y);
            width: ${lens.size}px;
            height: ${lens.size}px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            border: ${lens.rimWidth}px solid color-mix(in srgb, ${palette.foreground} 72%, transparent);
            box-shadow:
                inset 0 0 0 ${Math.max(1, lens.chromatic / 2)}px color-mix(in srgb, ${palette.revealB} 44%, transparent),
                0 0 0 ${lens.chromatic}px color-mix(in srgb, ${palette.primaryA} 18%, transparent),
                0 ${lens.glow / 2}px ${lens.glow}px rgba(0,0,0,.26);
            pointer-events: none;
            will-change: left, top;
        }
        .oblique-lens::before, .oblique-lens::after { content: ""; position: absolute; opacity: ${lens.crosshair ? 0.52 : 0}; background: ${palette.foreground}; }
        .oblique-lens::before { width: 24px; height: 1px; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        .oblique-lens::after { width: 1px; height: 24px; left: 50%; top: 50%; transform: translate(-50%, -50%); }
        .oblique-grid, .oblique-grain, .oblique-shade { position: absolute; inset: 0; pointer-events: none; }
        .oblique-grid { z-index: 3; opacity: ${texture.grid ? 0.2 : 0}; background-image: linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px); background-size: ${texture.gridSize}px ${texture.gridSize}px; }
        .oblique-shade { z-index: 3; background: linear-gradient(to bottom, transparent 52%, rgba(0,0,0,.26)); }
        .oblique-grain {
            z-index: 7;
            opacity: ${texture.grain / 100};
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.38'/%3E%3C/svg%3E");
            mix-blend-mode: soft-light;
            pointer-events: none;
        }
        .oblique-frame { position: absolute; inset: ${layout.padding}px; z-index: 6; border: 1px solid ${palette.line}; border-radius: max(0px, ${layout.radius - layout.padding / 2}px); pointer-events: none; }
        .oblique-head, .oblique-foot { position: absolute; z-index: 8; left: ${layout.padding}px; right: ${layout.padding}px; display: flex; align-items: center; justify-content: space-between; gap: 20px; pointer-events: none; }
        .oblique-head { top: ${layout.padding}px; padding: 15px 16px 0; }
        .oblique-foot { bottom: ${layout.padding}px; align-items: flex-end; padding: 0 16px 15px; }
        .oblique-meta { font-size: clamp(9px, 1cqw, 13px); line-height: 1; letter-spacing: .14em; text-transform: uppercase; text-shadow: 0 1px 18px rgba(255,255,255,.22); }
        .oblique-title { max-width: 72%; white-space: pre-line; font-size: clamp(46px, 9.2cqw, 116px); line-height: .82; letter-spacing: -.065em; text-transform: uppercase; }
        .oblique-labels { display: flex; align-items: center; gap: 10px; }
        .oblique-pill { padding: 9px 11px; border-radius: 999px; border: 1px solid ${palette.line}; background: color-mix(in srgb, ${palette.background} 24%, transparent); backdrop-filter: blur(12px); }
        .oblique-reveal-pill { background: ${palette.accent}; color: ${palette.foreground}; border-color: transparent; }
        .oblique-root:focus-visible { outline: 3px solid ${palette.accent}; outline-offset: 4px; }
        .oblique-root[data-active="true"] { transform: perspective(1000px) rotateX(calc(var(--parallax-y) * ${-motion.tilt}deg)) rotateY(calc(var(--parallax-x) * ${motion.tilt}deg)); }
        @container (max-width: ${layout.compactAt}px) {
            .oblique-frame { inset: ${Math.max(16, layout.padding * 0.7)}px; }
            .oblique-head, .oblique-foot { left: ${Math.max(16, layout.padding * 0.7)}px; right: ${Math.max(16, layout.padding * 0.7)}px; }
            .oblique-head { top: ${Math.max(16, layout.padding * 0.7)}px; }
            .oblique-foot { bottom: ${Math.max(16, layout.padding * 0.7)}px; }
            .oblique-title { max-width: 94%; font-size: clamp(52px, 17cqw, 88px); }
            .oblique-detail { display: none; }
            .oblique-lens { width: min(${lens.size}px, 62cqw); height: min(${lens.size}px, 62cqw); }
            .oblique-reveal-mask { clip-path: circle(min(${lens.size / 2}px, 31cqw) at var(--lens-x) var(--lens-y)); }
        }
        @media (prefers-reduced-motion: reduce) { .oblique-root, .oblique-root * { transition: none !important; animation: none !important; } }
    `

    return (
        <div
            ref={rootRef}
            className="oblique-root"
            data-active={
                active && motion.enabled && !reducedMotion && !staticRenderer
            }
            style={{ ...style, ...displayFont }}
            role={behavior.link ? "link" : "group"}
            tabIndex={0}
            aria-label={ariaLabel}
            onPointerEnter={() => setActive(true)}
            onPointerLeave={() => setActive(false)}
            onPointerMove={onPointerMove}
            onKeyDown={onKeyDown}
            onClick={onClick}
        >
            <style>{css}</style>
            <div className="oblique-primary" aria-hidden="true">
                {primaryImage?.src ? (
                    <img
                        src={primaryImage.src}
                        srcSet={primaryImage.srcSet}
                        alt=""
                    />
                ) : null}
            </div>
            <div className="oblique-reveal-mask" aria-hidden="true">
                <div className="oblique-reveal-image">
                    {revealImage?.src ? (
                        <img
                            src={revealImage.src}
                            srcSet={revealImage.srcSet}
                            alt=""
                        />
                    ) : null}
                </div>
            </div>
            <div className="oblique-grid" />
            <div className="oblique-shade" />
            <div className="oblique-lens" aria-hidden="true" />
            <div className="oblique-frame" />
            <header className="oblique-head oblique-meta" style={metaFont}>
                <span>{eyebrow}</span>
                <span>{index}</span>
            </header>
            <footer className="oblique-foot">
                <div className="oblique-title">{title}</div>
                <div className="oblique-labels oblique-meta" style={metaFont}>
                    <span className="oblique-pill oblique-detail">
                        {primaryLabel}
                    </span>
                    <span className="oblique-pill oblique-reveal-pill">
                        {revealLabel}
                    </span>
                </div>
            </footer>
            <div className="oblique-grain" />
        </div>
    )
}

ObliqueLens.defaultProps = defaults

addPropertyControls(ObliqueLens, {
    primaryImage: { type: ControlType.ResponsiveImage, title: "Primary Image" },
    revealImage: { type: ControlType.ResponsiveImage, title: "Reveal Image" },
    eyebrow: { type: ControlType.String, defaultValue: defaults.eyebrow },
    title: {
        type: ControlType.String,
        displayTextArea: true,
        defaultValue: defaults.title,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary Label",
        defaultValue: defaults.primaryLabel,
    },
    revealLabel: {
        type: ControlType.String,
        title: "Reveal Label",
        defaultValue: defaults.revealLabel,
    },
    index: { type: ControlType.String, defaultValue: defaults.index },
    displayFont: {
        type: ControlType.Font,
        title: "Display Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, defaultValue: "#ECE8DF" },
            primaryA: {
                type: ControlType.Color,
                title: "Primary A",
                defaultValue: "#F34B32",
            },
            primaryB: {
                type: ControlType.Color,
                title: "Primary B",
                defaultValue: "#7039FF",
            },
            revealA: {
                type: ControlType.Color,
                title: "Reveal A",
                defaultValue: "#CFFF4A",
            },
            revealB: {
                type: ControlType.Color,
                title: "Reveal B",
                defaultValue: "#1CB7D8",
            },
            foreground: { type: ControlType.Color, defaultValue: "#11110F" },
            muted: {
                type: ControlType.Color,
                defaultValue: "rgba(17, 17, 15, 0.62)",
            },
            accent: { type: ControlType.Color, defaultValue: "#E9FF67" },
            line: {
                type: ControlType.Color,
                defaultValue: "rgba(17, 17, 15, 0.28)",
            },
        },
    },
    lens: {
        type: ControlType.Object,
        title: "Lens",
        controls: {
            size: {
                type: ControlType.Number,
                min: 100,
                max: 720,
                step: 2,
                unit: "px",
                defaultValue: 330,
            },
            zoom: {
                type: ControlType.Number,
                min: 100,
                max: 180,
                step: 1,
                unit: "%",
                defaultValue: 112,
            },
            rimWidth: {
                type: ControlType.Number,
                min: 0,
                max: 12,
                step: 1,
                unit: "px",
                defaultValue: 2,
            },
            glow: {
                type: ControlType.Number,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 42,
            },
            chromatic: {
                type: ControlType.Number,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: 8,
            },
            crosshair: { type: ControlType.Boolean, defaultValue: true },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: { type: ControlType.Boolean, defaultValue: true },
            follow: {
                type: ControlType.Number,
                min: 2,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 18,
            },
            parallax: {
                type: ControlType.Number,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 16,
            },
            tilt: {
                type: ControlType.Number,
                min: 0,
                max: 12,
                step: 0.5,
                unit: "°",
                defaultValue: 3,
            },
            idle: { type: ControlType.Boolean, defaultValue: true },
            idleSpeed: {
                type: ControlType.Number,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 28,
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
                max: 90,
                step: 1,
                unit: "px",
                defaultValue: 28,
            },
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 28,
            },
            compactAt: {
                type: ControlType.Number,
                min: 320,
                max: 900,
                step: 10,
                unit: "px",
                defaultValue: 620,
            },
            mediaFit: {
                type: ControlType.Enum,
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
                displaySegmentedControl: true,
            },
        },
    },
    texture: {
        type: ControlType.Object,
        title: "Texture",
        controls: {
            overlay: {
                type: ControlType.Number,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 18,
            },
            grain: {
                type: ControlType.Number,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
                defaultValue: 18,
            },
            grid: { type: ControlType.Boolean, defaultValue: true },
            gridSize: {
                type: ControlType.Number,
                min: 18,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 52,
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            staticX: {
                type: ControlType.Number,
                title: "Canvas X",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 66,
            },
            staticY: {
                type: ControlType.Number,
                title: "Canvas Y",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 48,
            },
            hideCursor: { type: ControlType.Boolean, defaultValue: true },
            link: { type: ControlType.Link, defaultValue: "" },
            openInNewTab: { type: ControlType.Boolean, defaultValue: false },
        },
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        displayTextArea: true,
        defaultValue: defaults.ariaLabel,
    },
})
