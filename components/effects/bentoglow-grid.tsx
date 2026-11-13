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
 * @framerIntrinsicWidth 860
 * @framerIntrinsicHeight 520
 */

type CardSize = "Normal" | "Wide" | "Tall" | "Big"

type BentoItem = {
    label: string
    title: string
    description: string
    background: string
    size: CardSize
    content?: React.ReactNode
}

type ItemsAlign = "Left" | "Center" | "Right"

type LayoutGroup = {
    padding: number
    gap: number
    columnsMobile: number
    columnsTablet: number
    columnsDesktop: number
    maxWidth: number
    center: boolean // legacy (kept for compatibility)
    clipEffects: boolean
    align?: ItemsAlign // NEW
}

type StyleGroup = {
    radius: number
    borderWidth: number
    borderColor: string
    textColor: string
    labelColor: string
    titleSize: number
    descSize: number
    cardMinHeight: number
}

type EffectsGroup = {
    enableSpotlight: boolean
    spotlightRadius: number
    enableBorderGlow: boolean
    glowColor: string
    enableStars: boolean
    particleCount: number
    enableTilt: boolean
    tiltStrength: number
    enableMagnetism: boolean
    magnetStrength: number
    clickRipple: boolean
}

type BehaviorGroup = {
    truncateText: boolean
    disableAnimations: boolean
    disableOnTouch: boolean
    respectReducedMotion: boolean
}

export type MagicBentoProps = {
    items: BentoItem[]
    layout: LayoutGroup
    styleGroup: StyleGroup
    effects: EffectsGroup
    behavior: BehaviorGroup
    style?: React.CSSProperties
}

function clamp01(v: number) {
    return Math.max(0, Math.min(1, v))
}

function parseColorToRgb(input: string | undefined): {
    r: number
    g: number
    b: number
} {
    const fallback = { r: 132, g: 0, b: 255 }
    if (!input) return fallback

    const s = input.trim()

    // #RGB, #RRGGBB, #RRGGBBAA
    if (s[0] === "#") {
        const hex = s.slice(1)
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16)
            const g = parseInt(hex[1] + hex[1], 16)
            const b = parseInt(hex[2] + hex[2], 16)
            return { r, g, b }
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return { r, g, b }
        }
        return fallback
    }

    // rgb()/rgba()
    const rgbMatch = s.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    )
    if (rgbMatch) {
        return {
            r: Math.round(Number(rgbMatch[1])),
            g: Math.round(Number(rgbMatch[2])),
            b: Math.round(Number(rgbMatch[3])),
        }
    }

    return fallback
}

function usePrefersReducedMotion(enabled: boolean) {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (!enabled) return
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        if (!mq) return

        const apply = () => setReduced(!!mq.matches)
        apply()

        const onChange = () => apply()
        // Safari fallback
        if (mq.addEventListener) mq.addEventListener("change", onChange)
        else mq.addListener(onChange)

        return () => {
            if (mq.removeEventListener)
                mq.removeEventListener("change", onChange)
            else mq.removeListener(onChange)
        }
    }, [enabled])

    return reduced
}

function useIsTouchDevice(enabled: boolean) {
    const [isTouch, setIsTouch] = React.useState(false)

    React.useEffect(() => {
        if (!enabled) return
        const check = () => {
            const coarse =
                window.matchMedia?.("(pointer: coarse)")?.matches ?? false
            const canHover =
                window.matchMedia?.("(any-hover: hover)")?.matches ?? false
            const touchPoints = (navigator as any)?.maxTouchPoints ?? 0
            // Treat as touch-only when the environment cannot hover.
            // This avoids disabling hover effects on hybrid devices (touch + mouse/trackpad).
            setIsTouch(!canHover && (coarse || touchPoints > 0))
        }
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [enabled])

    return isTouch
}

function makeParticles(count: number) {
    // Stable random seeds per render (generated once per card)
    return Array.from({ length: Math.max(0, Math.min(64, count)) }, () => {
        const x = Math.random() * 100
        const y = Math.random() * 100
        const dx = (Math.random() - 0.5) * 120
        const dy = (Math.random() - 0.5) * 120
        const size = 2 + Math.random() * 3
        const dur = 2.0 + Math.random() * 2.2
        const delay = Math.random() * 0.8
        return { x, y, dx, dy, size, dur, delay }
    })
}

function BentoCard(props: {
    scope: string
    item: BentoItem
    index: number
    effects: EffectsGroup
    behaviorEnabled: boolean
    truncateText: boolean
    rgb: { r: number; g: number; b: number }
    styleGroup: StyleGroup
    setRef: (el: HTMLDivElement | null) => void
}) {
    const {
        item,
        effects,
        behaviorEnabled,
        truncateText,
        rgb,
        styleGroup,
        setRef,
    } = props
    const localRef = React.useRef<HTMLDivElement | null>(null)
    const particles = React.useMemo(
        () => makeParticles(effects.particleCount),
        [effects.particleCount]
    )

    const setTransformVars = React.useCallback(
        (rx: number, ry: number, mx: number, my: number) => {
            const el = localRef.current
            if (!el) return
            el.style.setProperty("--mb-rx", `${rx}deg`)
            el.style.setProperty("--mb-ry", `${ry}deg`)
            el.style.setProperty("--mb-mx", `${mx}px`)
            el.style.setProperty("--mb-my", `${my}px`)
        },
        []
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!behaviorEnabled) return
            if (!effects.enableTilt && !effects.enableMagnetism) return

            const el = localRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const cx = rect.width / 2
            const cy = rect.height / 2
            const nx = (x - cx) / cx
            const ny = (y - cy) / cy

            const rx = effects.enableTilt ? ny * -effects.tiltStrength : 0
            const ry = effects.enableTilt ? nx * effects.tiltStrength : 0
            const mx = effects.enableMagnetism ? nx * effects.magnetStrength : 0
            const my = effects.enableMagnetism ? ny * effects.magnetStrength : 0
            setTransformVars(rx, ry, mx, my)
        },
        [
            behaviorEnabled,
            effects.enableTilt,
            effects.enableMagnetism,
            effects.tiltStrength,
            effects.magnetStrength,
            setTransformVars,
        ]
    )

    const onPointerLeave = React.useCallback(() => {
        setTransformVars(0, 0, 0, 0)
    }, [setTransformVars])

    const onClick = React.useCallback(
        (e: React.MouseEvent) => {
            if (!behaviorEnabled) return
            if (!effects.clickRipple) return

            const el = localRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const maxD = Math.max(
                Math.hypot(x, y),
                Math.hypot(rect.width - x, y),
                Math.hypot(x, rect.height - y),
                Math.hypot(rect.width - x, rect.height - y)
            )

            const ripple = document.createElement("span")
            ripple.className = "mb-ripple"
            ripple.style.left = `${x - maxD}px`
            ripple.style.top = `${y - maxD}px`
            ripple.style.width = `${maxD * 2}px`
            ripple.style.height = `${maxD * 2}px`
            ripple.style.setProperty("--mb-r", `${rgb.r}`)
            ripple.style.setProperty("--mb-g", `${rgb.g}`)
            ripple.style.setProperty("--mb-b", `${rgb.b}`)

            el.appendChild(ripple)
            ripple.addEventListener("animationend", () => ripple.remove(), {
                once: true,
            })
        },
        [behaviorEnabled, effects.clickRipple, rgb.r, rgb.g, rgb.b]
    )

    return (
        <div
            ref={(el) => {
                localRef.current = el
                setRef(el)
            }}
            className="mb-card"
            data-size={item.size}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onClick={onClick}
            style={{
                background: item.background,
                minHeight: styleGroup.cardMinHeight,
            }}
        >
            {effects.enableStars && behaviorEnabled && (
                <div className="mb-particles" aria-hidden="true">
                    {particles.map((p, i) => (
                        <span
                            key={i}
                            className="mb-particle"
                            style={
                                {
                                    left: `${p.x}%`,
                                    top: `${p.y}%`,
                                    width: `${p.size}px`,
                                    height: `${p.size}px`,
                                    ["--dx" as any]: `${p.dx}px`,
                                    ["--dy" as any]: `${p.dy}px`,
                                    ["--dur" as any]: `${p.dur}s`,
                                    ["--del" as any]: `${p.delay}s`,
                                } as React.CSSProperties
                            }
                        />
                    ))}
                </div>
            )}

            {/* Default header/content OR slot */}
            {item.content ? (
                <div className="mb-slot">{item.content}</div>
            ) : (
                <>
                    <div className="mb-header">
                        <span
                            className="mb-label"
                            style={{ color: styleGroup.labelColor }}
                        >
                            {item.label}
                        </span>
                    </div>

                    <div className="mb-content">
                        <div
                            className={
                                "mb-title" + (truncateText ? " mb-clamp-1" : "")
                            }
                        >
                            {item.title}
                        </div>
                        <div
                            className={
                                "mb-desc" + (truncateText ? " mb-clamp-2" : "")
                            }
                        >
                            {item.description}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default function MagicBento(props: MagicBentoProps) {
    const { items, layout, styleGroup, effects, behavior, style } = props

    const scope = React.useMemo(
        () => "mb-" + Math.random().toString(36).slice(2, 9),
        []
    )
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const spotlightRef = React.useRef<HTMLDivElement | null>(null)
    const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])

    const rgb = React.useMemo(
        () => parseColorToRgb(effects.glowColor),
        [effects.glowColor]
    )

    const reducedMotion = usePrefersReducedMotion(behavior.respectReducedMotion)
    const isTouch = useIsTouchDevice(behavior.disableOnTouch)

    const animationsEnabled =
        !behavior.disableAnimations &&
        (!behavior.disableOnTouch || !isTouch) &&
        (!behavior.respectReducedMotion || !reducedMotion)

    const raf = React.useRef<number | null>(null)
    const lastPointer = React.useRef<{ x: number; y: number; inside: boolean }>(
        { x: 0, y: 0, inside: false }
    )

    const resetGlow = React.useCallback(() => {
        for (const el of cardRefs.current) {
            if (!el) continue
            el.style.setProperty("--mb-gx", "50%")
            el.style.setProperty("--mb-gy", "50%")
            el.style.setProperty("--mb-gi", "0")
            el.style.setProperty("--mb-gr", `${effects.spotlightRadius}px`)
        }
        if (spotlightRef.current) {
            spotlightRef.current.style.opacity = "0"
        }
    }, [effects.spotlightRadius])

    const applyGlow = React.useCallback(() => {
        raf.current = null
        if (!animationsEnabled) return
        if (!effects.enableBorderGlow && !effects.enableSpotlight) return

        const root = rootRef.current
        if (!root) return

        const { x: clientX, y: clientY, inside } = lastPointer.current
        if (!inside) {
            resetGlow()
            return
        }

        const rootRect = root.getBoundingClientRect()
        const localX = clientX - rootRect.left
        const localY = clientY - rootRect.top

        let nearest = Infinity

        // Per-card glow based on distance
        const proximity = effects.spotlightRadius * 0.5
        const fade = effects.spotlightRadius * 0.9

        for (const el of cardRefs.current) {
            if (!el) continue

            const rect = el.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2

            // Distance from cursor to card edge-ish
            const edgeBias = Math.max(rect.width, rect.height) * 0.3
            const dist = Math.max(
                0,
                Math.hypot(clientX - cx, clientY - cy) - edgeBias
            )
            nearest = Math.min(nearest, dist)

            let intensity = 0
            if (dist <= proximity) intensity = 1
            else if (dist <= fade)
                intensity = (fade - dist) / (fade - proximity)
            intensity = clamp01(intensity)

            const rx = ((clientX - rect.left) / rect.width) * 100
            const ry = ((clientY - rect.top) / rect.height) * 100

            el.style.setProperty("--mb-gx", `${rx}%`)
            el.style.setProperty("--mb-gy", `${ry}%`)
            el.style.setProperty("--mb-gi", `${intensity}`)
            el.style.setProperty("--mb-gr", `${effects.spotlightRadius}px`)
        }

        // Spotlight overlay
        if (effects.enableSpotlight && spotlightRef.current) {
            spotlightRef.current.style.left = `${localX}px`
            spotlightRef.current.style.top = `${localY}px`

            const spotOpacity =
                clamp01(1 - nearest / effects.spotlightRadius) * 0.85
            spotlightRef.current.style.opacity = `${spotOpacity}`
        }
    }, [
        animationsEnabled,
        effects.enableBorderGlow,
        effects.enableSpotlight,
        effects.spotlightRadius,
        resetGlow,
    ])

    const scheduleGlow = React.useCallback(() => {
        if (raf.current != null) return
        raf.current = window.requestAnimationFrame(applyGlow)
    }, [applyGlow])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (!animationsEnabled) return
            lastPointer.current = { x: e.clientX, y: e.clientY, inside: true }
            scheduleGlow()
        },
        [animationsEnabled, scheduleGlow]
    )

    const onPointerLeave = React.useCallback(() => {
        lastPointer.current.inside = false
        resetGlow()
    }, [resetGlow])

    React.useEffect(() => {
        // Reset glow if animations are disabled mid-session
        if (!animationsEnabled) resetGlow()
    }, [animationsEnabled, resetGlow])

    // NEW: alignment logic (align overrides legacy center)
    const itemsAlign: ItemsAlign =
        layout.align ?? (layout.center ? "Center" : "Left")
    const justify =
        itemsAlign === "Right"
            ? "flex-end"
            : itemsAlign === "Center"
              ? "center"
              : "flex-start"

    const rootVars = {
        ["--mb-r" as any]: rgb.r,
        ["--mb-g" as any]: rgb.g,
        ["--mb-b" as any]: rgb.b,
        ["--mb-border" as any]: layout.clipEffects ? "hidden" : "visible",
        ["--mb-text" as any]: styleGroup.textColor,
        ["--mb-border-color" as any]: styleGroup.borderColor,
        ["--mb-border-width" as any]: `${styleGroup.borderWidth}px`,
        ["--mb-radius" as any]: `${styleGroup.radius}px`,
        ["--mb-gap" as any]: `${layout.gap}px`,
        ["--mb-pad" as any]: `${layout.padding}px`,
        ["--mb-title" as any]: `${styleGroup.titleSize}px`,
        ["--mb-desc" as any]: `${styleGroup.descSize}px`,
        ["--mb-maxw" as any]: `${layout.maxWidth}px`,
        ["--mb-cols-m" as any]: `${Math.max(1, Math.round(layout.columnsMobile))}`,
        ["--mb-cols-t" as any]: `${Math.max(1, Math.round(layout.columnsTablet))}`,
        ["--mb-cols-d" as any]: `${Math.max(1, Math.round(layout.columnsDesktop))}`,
        ["--mb-justify" as any]: justify, // NEW
    } as React.CSSProperties

    return (
        <div
            ref={rootRef}
            data-mb-scope={scope}
            className="mb-root"
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{
                ...rootVars,
                ...style,
            }}
        >
            <style>{`
                [data-mb-scope] {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    color: var(--mb-text);
                    overflow: var(--mb-border);
                    font-size: 14px;
                }

                [data-mb-scope] .mb-wrap {
                    width: 100%;
                    padding: var(--mb-pad);
                    box-sizing: border-box;
                    position: relative;
                }

                /* NEW: full-width align wrapper */
                [data-mb-scope] .mb-gridwrap {
                    width: 100%;
                    display: flex;
                    justify-content: var(--mb-justify);
                }

                /* NEW: grid respects max width, alignment happens via mb-gridwrap */
                [data-mb-scope] .mb-grid {
                    width: min(100%, var(--mb-maxw));
                    max-width: var(--mb-maxw);
                    display: grid;
                    gap: var(--mb-gap);
                    grid-template-columns: repeat(var(--mb-cols-m), minmax(0, 1fr));
                    align-items: stretch;
                    user-select: none;
                }

                @media (min-width: 600px) {
                    [data-mb-scope] .mb-grid {
                        grid-template-columns: repeat(var(--mb-cols-t), minmax(0, 1fr));
                    }
                }

                @media (min-width: 1024px) {
                    [data-mb-scope] .mb-grid {
                        grid-template-columns: repeat(var(--mb-cols-d), minmax(0, 1fr));
                    }

                    /* Bento spans based on per-item size */
                    [data-mb-scope] .mb-card[data-size="Wide"] { grid-column: span 2; }
                    [data-mb-scope] .mb-card[data-size="Tall"] { grid-row: span 2; }
                    [data-mb-scope] .mb-card[data-size="Big"] { grid-column: span 2; grid-row: span 2; }
                }

                [data-mb-scope] .mb-spotlight {
                    position: absolute;
                    width: 760px;
                    height: 760px;
                    border-radius: 999px;
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    opacity: 0;
                    mix-blend-mode: screen;
                    background: radial-gradient(circle,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.18) 0%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.10) 18%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.05) 30%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.02) 50%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.01) 66%,
                        transparent 72%
                    );
                    z-index: 1;
                    transition: opacity 200ms ease;
                }

                [data-mb-scope] .mb-card {
                    position: relative;
                    border-radius: var(--mb-radius);
                    border: var(--mb-border-width) solid var(--mb-border-color);
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;

                    /* transform vars (tilt/magnetism) */
                    --mb-rx: 0deg;
                    --mb-ry: 0deg;
                    --mb-mx: 0px;
                    --mb-my: 0px;

                    /* glow vars */
                    --mb-gx: 50%;
                    --mb-gy: 50%;
                    --mb-gi: 0;
                    --mb-gr: 260px;

                    transform: translate3d(var(--mb-mx), var(--mb-my), 0)
                        rotateX(var(--mb-rx))
                        rotateY(var(--mb-ry));
                    transform-style: preserve-3d;

                    transition: transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease;
                    overflow: hidden;
                    z-index: 2;
                }

                [data-mb-scope] .mb-card:hover {
                    box-shadow: 0 14px 40px rgba(0,0,0,0.28);
                }

                /* Border glow ring */
                [data-mb-scope] .mb-card::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    padding: 6px;

                    background: radial-gradient(
                        var(--mb-gr) circle at var(--mb-gx) var(--mb-gy),
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), calc(var(--mb-gi) * 0.85)) 0%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), calc(var(--mb-gi) * 0.35)) 28%,
                        transparent 60%
                    );

                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask-composite: exclude;

                    pointer-events: none;
                    opacity: ${effects.enableBorderGlow ? "1" : "0"};
                    transition: opacity 200ms ease;
                    z-index: 1;
                }

                [data-mb-scope] .mb-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    z-index: 2;
                }

                [data-mb-scope] .mb-label {
                    font-size: 14px;
                    opacity: 0.92;
                }

                [data-mb-scope] .mb-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    z-index: 2;
                }

                [data-mb-scope] .mb-title {
                    font-size: var(--mb-title);
                    font-weight: 500;
                    line-height: 1.15;
                }

                [data-mb-scope] .mb-desc {
                    font-size: var(--mb-desc);
                    line-height: 1.45;
                    opacity: 0.9;
                }

                [data-mb-scope] .mb-clamp-1 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 1;
                    overflow: hidden;
                }

                [data-mb-scope] .mb-clamp-2 {
                    display: -webkit-box;
                    -webkit-box-orient: vertical;
                    -webkit-line-clamp: 2;
                    overflow: hidden;
                }

                /* Slot content */
                [data-mb-scope] .mb-slot {
                    position: relative;
                    z-index: 2;
                    width: 100%;
                    height: 100%;
                    min-height: 120px;
                    display: flex;
                    align-items: stretch;
                }
                [data-mb-scope] .mb-slot > * {
                    width: 100%;
                }

                /* Particles */
                [data-mb-scope] .mb-particles {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 220ms ease;
                    z-index: 2;
                }

                [data-mb-scope] .mb-card:hover .mb-particles {
                    opacity: 1;
                }

                [data-mb-scope] .mb-particle {
                    position: absolute;
                    border-radius: 999px;
                    background: rgba(var(--mb-r), var(--mb-g), var(--mb-b), 1);
                    box-shadow: 0 0 10px rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.55);
                    transform: translate3d(0,0,0);
                    animation:
                        mbFloat var(--dur) ease-in-out var(--del) infinite alternate,
                        mbTwinkle 1.25s ease-in-out calc(var(--del) * 0.5) infinite alternate;
                }

                @keyframes mbFloat {
                    from { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
                    to { transform: translate3d(var(--dx), var(--dy), 0) rotate(240deg); opacity: 0.35; }
                }

                @keyframes mbTwinkle {
                    from { filter: blur(0px); }
                    to { filter: blur(0.6px); }
                }

                /* Ripple */
                [data-mb-scope] .mb-ripple {
                    position: absolute;
                    border-radius: 999px;
                    pointer-events: none;
                    background: radial-gradient(circle,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.36) 0%,
                        rgba(var(--mb-r), var(--mb-g), var(--mb-b), 0.18) 28%,
                        transparent 70%
                    );
                    transform: scale(0);
                    animation: mbRipple 700ms ease-out forwards;
                    z-index: 3;
                }

                @keyframes mbRipple {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(1); opacity: 0; }
                }
            `}</style>

            <div className="mb-wrap">
                {effects.enableSpotlight && animationsEnabled && (
                    <div
                        ref={spotlightRef}
                        className="mb-spotlight"
                        aria-hidden="true"
                    />
                )}

                <div className="mb-gridwrap">
                    <div className="mb-grid">
                        {(items?.length ? items : []).map((item, index) => (
                            <BentoCard
                                key={index}
                                scope={scope}
                                item={item}
                                index={index}
                                effects={effects}
                                behaviorEnabled={animationsEnabled}
                                truncateText={behavior.truncateText}
                                rgb={rgb}
                                styleGroup={styleGroup}
                                setRef={(el) => (cardRefs.current[index] = el)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

MagicBento.defaultProps = {
    items: [
        {
            label: "Signals",
            title: "Realtime Metrics",
            description: "See key events as they happen.",
            background: "#070012",
            size: "Normal",
        },
        {
            label: "Flow",
            title: "Automations",
            description: "Trigger actions across your stack.",
            background: "#070012",
            size: "Wide",
        },
        {
            label: "Atlas",
            title: "Unified Dashboard",
            description: "Everything in one view, always current.",
            background: "#070012",
            size: "Big",
        },
        {
            label: "Shield",
            title: "Security",
            description: "Controls, roles, and audits built-in.",
            background: "#070012",
            size: "Tall",
        },
        {
            label: "Connect",
            title: "Integrations",
            description: "Plug in the tools you already use.",
            background: "#070012",
            size: "Wide",
        },
        {
            label: "Team",
            title: "Collaboration",
            description: "Comments, mentions, and shared work.",
            background: "#070012",
            size: "Normal",
        },
    ],
    layout: {
        padding: 12,
        gap: 10,
        columnsMobile: 1,
        columnsTablet: 2,
        columnsDesktop: 4,
        maxWidth: 980,
        center: true,
        clipEffects: true,
        align: "Center",
    },
    styleGroup: {
        radius: 22,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        textColor: "#ffffff",
        labelColor: "rgba(255,255,255,0.90)",
        titleSize: 16,
        descSize: 12,
        cardMinHeight: 180,
    },
    effects: {
        enableSpotlight: true,
        spotlightRadius: 320,
        enableBorderGlow: true,
        glowColor: "#8400ff",
        enableStars: true,
        particleCount: 14,
        enableTilt: false,
        tiltStrength: 10,
        enableMagnetism: true,
        magnetStrength: 10,
        clickRipple: true,
    },
    behavior: {
        truncateText: true,
        disableAnimations: false,
        disableOnTouch: true,
        respectReducedMotion: true,
    },
} as MagicBentoProps

addPropertyControls(MagicBento, {
    items: {
        title: "Cards",
        type: ControlType.Array,
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Label" },
                title: { type: ControlType.String, defaultValue: "Title" },
                description: {
                    type: ControlType.String,
                    defaultValue: "Description",
                },
                background: {
                    type: ControlType.Color,
                    defaultValue: "#070012",
                },
                size: {
                    type: ControlType.Enum,
                    options: ["Normal", "Wide", "Tall", "Big"],
                    optionTitles: [
                        "Normal",
                        "Wide (2 cols)",
                        "Tall (2 rows)",
                        "Big (2x2)",
                    ],
                    defaultValue: "Normal",
                },
                content: { type: ControlType.ComponentInstance, title: "Slot" },
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            padding: {
                type: ControlType.Number,
                min: 0,
                max: 64,
                step: 1,
                defaultValue: 12,
            },
            gap: {
                type: ControlType.Number,
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 10,
            },
            columnsMobile: {
                type: ControlType.Number,
                min: 1,
                max: 6,
                step: 1,
                defaultValue: 1,
            },
            columnsTablet: {
                type: ControlType.Number,
                min: 1,
                max: 8,
                step: 1,
                defaultValue: 2,
            },
            columnsDesktop: {
                type: ControlType.Number,
                min: 1,
                max: 12,
                step: 1,
                defaultValue: 4,
            },
            maxWidth: {
                type: ControlType.Number,
                min: 320,
                max: 2000,
                step: 10,
                defaultValue: 980,
            },

            // NEW
            align: {
                type: ControlType.Enum,
                options: ["Left", "Center", "Right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "Center",
            },

            // legacy (you can remove this control if you want)
            center: { type: ControlType.Boolean, defaultValue: true },
            clipEffects: { type: ControlType.Boolean, defaultValue: true },
        },
    },

    styleGroup: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 22,
            },
            borderWidth: {
                type: ControlType.Number,
                min: 0,
                max: 8,
                step: 1,
                defaultValue: 1,
            },
            borderColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.12)",
            },
            textColor: { type: ControlType.Color, defaultValue: "#ffffff" },
            labelColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255,255,255,0.90)",
            },
            titleSize: {
                type: ControlType.Number,
                min: 10,
                max: 40,
                step: 1,
                defaultValue: 16,
            },
            descSize: {
                type: ControlType.Number,
                min: 10,
                max: 28,
                step: 1,
                defaultValue: 12,
            },
            cardMinHeight: {
                type: ControlType.Number,
                min: 100,
                max: 500,
                step: 5,
                defaultValue: 180,
            },
        },
    },

    effects: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        controls: {
            glowColor: { type: ControlType.Color, defaultValue: "#8400ff" },
            enableBorderGlow: { type: ControlType.Boolean, defaultValue: true },
            enableSpotlight: { type: ControlType.Boolean, defaultValue: true },
            spotlightRadius: {
                type: ControlType.Number,
                min: 120,
                max: 800,
                step: 10,
                defaultValue: 320,
            },
            enableStars: { type: ControlType.Boolean, defaultValue: true },
            particleCount: {
                type: ControlType.Number,
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 14,
            },
            enableTilt: { type: ControlType.Boolean, defaultValue: false },
            tiltStrength: {
                type: ControlType.Number,
                min: 0,
                max: 20,
                step: 1,
                defaultValue: 10,
            },
            enableMagnetism: { type: ControlType.Boolean, defaultValue: true },
            magnetStrength: {
                type: ControlType.Number,
                min: 0,
                max: 30,
                step: 1,
                defaultValue: 10,
            },
            clickRipple: { type: ControlType.Boolean, defaultValue: true },
        },
    },

    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        icon: "interact",
        controls: {
            truncateText: { type: ControlType.Boolean, defaultValue: true },
            disableAnimations: {
                type: ControlType.Boolean,
                defaultValue: false,
            },
            disableOnTouch: { type: ControlType.Boolean, defaultValue: true },
            respectReducedMotion: {
                type: ControlType.Boolean,
                defaultValue: true,
            },
        },
    },
})
