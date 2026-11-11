/**
 * Particle Effects Button — free Framer Code Component
 *
 * Based on “Particle Effects for Buttons” by Luis Manuel,
 * originally published by Codrops.
 * Adapted and rewritten as a self-contained React/Framer component.
 *
 * Article: https://tympanus.net/codrops/2018/04/25/particle-effects-for-buttons/
 * Source: https://github.com/codrops/ParticleEffectsButtons
 *
 * Keep this credit and add the same attribution to the public Marketplace listing.
 */
/* Technical hardening/optimization pass only: preserve all presets, visuals, defaults, triggers, behavior, and existing property controls exactly while improving runtime safety and compatibility. */

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


type Direction = "left" | "right" | "top" | "bottom"
type ParticleShape = "circle" | "rectangle" | "triangle"
type ParticleDrawStyle = "fill" | "stroke"
type Trigger = "click" | "hover"
type EasingName =
    | "easeInOutCubic"
    | "easeOutQuart"
    | "easeOutQuad"
    | "easeInExpo"
    | "easeInCubic"
    | "easeOutSine"
    | "codropsBezier"

type ParticleSettings = {
    shape: ParticleShape
    drawStyle: ParticleDrawStyle
    direction: Direction
    duration: number
    easing: EasingName
    size: number
    speed: number
    randomSpeed: boolean
    amount: number
    oscillation: number
    colors: string[]
}

type Preset = Omit<ParticleSettings, "direction" | "colors">

type Particle = {
    startX: number
    startY: number
    angle: number
    born: number
    life: number
    speed: number
    size: number
    color: string
}

type CanvasGeometry = {
    width: number
    height: number
    padding: number
    buttonWidth: number
    buttonHeight: number
}

type VisualPhase = "idle" | "disintegrating" | "hidden" | "restoring"

type MyComponentProps = {
    style?: React.CSSProperties
    label: string
    link: string
    newTab: boolean
    preset: keyof typeof PRESETS
    trigger: Trigger
    autoRestore: boolean
    restoreDelay: number
    effectPadding: number
    background: string
    textColor: string
    padding: string
    radius: string
    border: {
        borderWidth?: number
        borderTopWidth?: number
        borderRightWidth?: number
        borderBottomWidth?: number
        borderLeftWidth?: number
        borderStyle?: "solid" | "dashed" | "dotted" | "double"
        borderColor?: string
    }
    font: React.CSSProperties
    useCustomParticles: boolean
    particleColor1: string
    particleColor2: string
    shape: ParticleShape
    drawStyle: ParticleDrawStyle
    direction: Direction
    duration: number
    easing: EasingName
    particleSize: number
    speed: number
    amount: number
    oscillation: number
}

const DEFAULT_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    lineHeight: "1em",
    letterSpacing: "0em",
    textAlign: "center",
}

const baseParticles: Preset = {
    shape: "circle",
    drawStyle: "fill",
    duration: 1000,
    easing: "easeInOutCubic",
    size: 3,
    speed: 4,
    randomSpeed: true,
    amount: 3,
    oscillation: 20,
}

const PRESETS = {
    "01": {
        ...baseParticles,
    },
    "02": {
        ...baseParticles,
        shape: "triangle",
        easing: "easeOutQuart",
        size: 6,
        amount: 4,
        oscillation: 2,
    },
    "03": {
        ...baseParticles,
        shape: "rectangle",
        duration: 500,
        easing: "easeOutQuad",
        size: 8,
    },
    "04": {
        ...baseParticles,
        size: 4,
        speed: 1,
        randomSpeed: false,
        amount: 1.5,
        oscillation: 1,
    },
    "05": {
        ...baseParticles,
        duration: 1300,
        easing: "easeInExpo",
        size: 3,
        speed: 1,
        randomSpeed: false,
        amount: 10,
        oscillation: 1,
    },
    "06": {
        ...baseParticles,
        duration: 1000,
        easing: "easeInExpo",
    },
    "07": {
        ...baseParticles,
        shape: "rectangle",
        drawStyle: "stroke",
        duration: 600,
        easing: "codropsBezier",
        size: 15,
        amount: 2,
        oscillation: 5,
    },
    "08": {
        ...baseParticles,
        shape: "triangle",
        drawStyle: "stroke",
        duration: 1400,
        size: 5,
        speed: 1.5,
        randomSpeed: false,
        oscillation: 15,
    },
    "09": {
        ...baseParticles,
        duration: 500,
        easing: "easeOutQuad",
        speed: 0.1,
        randomSpeed: false,
        amount: 10,
        oscillation: 80,
    },
    "10": {
        ...baseParticles,
        duration: 1200,
        easing: "easeInCubic",
        size: 4,
        speed: 0.4,
        randomSpeed: false,
        amount: 8,
        oscillation: 1,
    },
    "11": {
        ...baseParticles,
        drawStyle: "stroke",
        duration: 1200,
        easing: "easeOutSine",
        speed: 0.7,
        randomSpeed: false,
        oscillation: 5,
    },
    "12": {
        ...baseParticles,
        shape: "triangle",
        duration: 800,
        easing: "easeOutSine",
        size: 3,
        speed: 3,
        randomSpeed: false,
        amount: 7,
        oscillation: 1,
    },
} satisfies Record<string, Preset>

const PRESET_OPTION_VALUES = [
    "01",
    "04",
    "05",
    "06",
    "09",
    "10",
    "11",
    "02",
    "08",
    "12",
    "03",
    "07",
] as const

const PRESET_LABELS: Record<(typeof PRESET_OPTION_VALUES)[number], string> = {
    "01": "Circles · Classic",
    "04": "Circles · Calm",
    "05": "Circles · Burst",
    "06": "Circles · Expo",
    "09": "Circles · Wave",
    "10": "Circles · Stream",
    "11": "Circles · Rings",
    "02": "Triangles · Bold",
    "08": "Triangles · Drift",
    "12": "Triangles · Fast",
    "03": "Squares · Blocks",
    "07": "Squares · Frames",
}

const PRESET_OPTION_TITLES = PRESET_OPTION_VALUES.map(
    (value) => PRESET_LABELS[value]
)

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const randomBetween = (min: number, max: number) =>
    min + Math.random() * (max - min)

function bezierCoordinate(t: number, p1: number, p2: number) {
    const inverse = 1 - t
    return 3 * inverse * inverse * t * p1 + 3 * inverse * t * t * p2 + t * t * t
}

function cubicBezierAt(
    progress: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    let low = 0
    let high = 1
    let parameter = progress

    for (let index = 0; index < 12; index++) {
        const x = bezierCoordinate(parameter, x1, x2)
        if (x < progress) low = parameter
        else high = parameter
        parameter = (low + high) / 2
    }

    return bezierCoordinate(parameter, y1, y2)
}

function ease(name: EasingName, progress: number) {
    const t = clamp01(progress)

    switch (name) {
        case "easeOutQuart":
            return 1 - Math.pow(1 - t, 4)
        case "easeOutQuad":
            return 1 - (1 - t) * (1 - t)
        case "easeInExpo":
            return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
        case "easeInCubic":
            return t * t * t
        case "easeOutSine":
            return Math.sin((t * Math.PI) / 2)
        case "codropsBezier":
            return cubicBezierAt(t, 0.2, 1, 0.7, 1)
        case "easeInOutCubic":
        default:
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }
}

function drawParticle(
    context: CanvasRenderingContext2D,
    particle: Particle,
    settings: ParticleSettings,
    now: number
) {
    const age = now - particle.born
    const lifeProgress = clamp01(age / particle.life)
    const frameDistance = age / (1000 / 60)
    const travel = particle.speed * frameDistance
    const wave =
        settings.oscillation * Math.sin(frameDistance * ((Math.PI * 2) / 100))
    const cosine = Math.cos(particle.angle)
    const sine = Math.sin(particle.angle)
    const x = particle.startX + cosine * travel - sine * wave
    const y = particle.startY + sine * travel + cosine * wave
    const size = particle.size

    context.save()
    context.globalAlpha = 1 - lifeProgress
    context.translate(x, y)
    context.rotate(particle.angle)
    context.fillStyle = particle.color
    context.strokeStyle = particle.color
    context.lineWidth = Math.max(1, size * 0.18)
    context.beginPath()

    if (settings.shape === "circle") {
        context.arc(0, 0, size, 0, Math.PI * 2)
    } else if (settings.shape === "triangle") {
        context.moveTo(-size, size)
        context.lineTo(size, size)
        context.lineTo(size, -size)
        context.closePath()
    } else {
        context.rect(-size / 2, -size / 2, size, size)
    }

    if (settings.drawStyle === "stroke") context.stroke()
    else context.fill()

    context.restore()
}

/**
 * Made possible as a component by Matthias Ölschlegel 💪
 *
 * [Explore more components](https://framer.link/fsd2pgh)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 64
 */
export default function ParticleEffectsButton(props: MyComponentProps) {
    const {
        style,
        label = "Explore",
        link = "",
        newTab = false,
        preset = "01",
        trigger = "click",
        autoRestore = true,
        restoreDelay = 350,
        effectPadding = 150,
        background = "#121019",
        textColor = "#ffffff",
        padding = "22px 90px 22px 90px",
        radius = "40px",
        border = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#000000",
        },
        font = DEFAULT_FONT,
        useCustomParticles = false,
        particleColor1 = "#121019",
        particleColor2 = "#ffffff",
        shape = "circle",
        drawStyle = "fill",
        direction = "left",
        duration = 1000,
        easing = "easeInOutCubic",
        particleSize = 3,
        speed = 4,
        amount = 3,
        oscillation = 20,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const clipRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLDivElement>(null)
    const geometryRef = React.useRef<CanvasGeometry | null>(null)
    const particlesRef = React.useRef<Particle[]>([])
    const animationFrameRef = React.useRef<number | null>(null)
    const restoreTimerRef = React.useRef<number | null>(null)
    const animationTokenRef = React.useRef(0)
    const runningRef = React.useRef(false)
    const reducedMotionRef = React.useRef(false)
    const visualPhaseRef = React.useRef<VisualPhase>("idle")
    const visualStylesRef = React.useRef({
        clipVisibility: "visible" as "visible",
        clipOpacity: "1",
        clipTransform: "translate3d(0, 0, 0)",
        buttonTransform: "translate3d(0, 0, 0)",
        canvasDisplay: "none" as "none" | "block",
    })
    const [focused, setFocused] = React.useState(false)

    const applyVisualState = React.useCallback(() => {
        const clip = clipRef.current
        const button = buttonRef.current
        const canvas = canvasRef.current
        const visualState = visualStylesRef.current

        if (clip) {
            clip.style.visibility = visualState.clipVisibility
            clip.style.opacity = visualState.clipOpacity
            clip.style.transform = visualState.clipTransform
        }

        if (button) button.style.transform = visualState.buttonTransform
        if (canvas) canvas.style.display = visualState.canvasDisplay
    }, [])

    const useIsomorphicLayoutEffect =
        typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

    useIsomorphicLayoutEffect(() => {
        applyVisualState()
    })

    const selectedPreset = React.useMemo(
        () => PRESETS[preset] ?? PRESETS["01"],
        [preset]
    )

    const particleSettings: ParticleSettings = React.useMemo(
        () =>
            useCustomParticles
                ? {
                      shape,
                      drawStyle,
                      direction,
                      duration,
                      easing,
                      size: particleSize,
                      speed,
                      randomSpeed: false,
                      amount,
                      oscillation,
                      colors: [particleColor1, particleColor2].filter(Boolean),
                  }
                : { ...selectedPreset, direction, colors: [background] },
        [
            amount,
            background,
            direction,
            drawStyle,
            duration,
            easing,
            oscillation,
            particleColor1,
            particleColor2,
            particleSize,
            selectedPreset,
            shape,
            speed,
            useCustomParticles,
        ]
    )

    const resetVisuals = React.useCallback(() => {
        visualPhaseRef.current = "idle"
        visualStylesRef.current = {
            clipVisibility: "visible",
            clipOpacity: "1",
            clipTransform: "translate3d(0, 0, 0)",
            buttonTransform: "translate3d(0, 0, 0)",
            canvasDisplay: "none",
        }
        applyVisualState()
    }, [applyVisualState])

    const updateCanvasGeometry = React.useCallback(() => {
        const root = rootRef.current
        const button = buttonRef.current
        const canvas = canvasRef.current
        if (!root || !button || !canvas) return null

        const rootRect = root.getBoundingClientRect()
        const buttonRect = button.getBoundingClientRect()
        const safePadding = Math.max(40, effectPadding)
        const width = Math.max(1, buttonRect.width + safePadding * 2)
        const height = Math.max(1, buttonRect.height + safePadding * 2)
        const dpr =
            typeof window !== "undefined"
                ? Math.min(window.devicePixelRatio || 1, 2)
                : 1
        const pixelWidth = Math.round(width * dpr)
        const pixelHeight = Math.round(height * dpr)

        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.left = `${buttonRect.left - rootRect.left + buttonRect.width / 2}px`
        canvas.style.top = `${buttonRect.top - rootRect.top + buttonRect.height / 2}px`

        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth
            canvas.height = pixelHeight
        }

        const context = canvas.getContext("2d")
        context?.setTransform(dpr, 0, 0, dpr, 0, 0)

        const geometry = {
            width,
            height,
            padding: safePadding,
            buttonWidth: buttonRect.width,
            buttonHeight: buttonRect.height,
        }
        geometryRef.current = geometry
        return geometry
    }, [effectPadding])

    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            reducedMotionRef.current = false
            return
        }
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const syncPreference = () => {
            reducedMotionRef.current = query.matches
        }
        syncPreference()
        if (typeof query.addEventListener === "function") {
            query.addEventListener("change", syncPreference)
            return () => query.removeEventListener("change", syncPreference)
        }
        query.addListener(syncPreference)
        return () => query.removeListener(syncPreference)
    }, [])

    React.useEffect(() => {
        updateCanvasGeometry()
        const root = rootRef.current
        const button = buttonRef.current
        if (
            !root ||
            !button ||
            typeof window === "undefined" ||
            typeof ResizeObserver === "undefined"
        ) {
            return
        }

        const observer = new ResizeObserver(() => {
            updateCanvasGeometry()
        })
        observer.observe(root)
        observer.observe(button)
        const handleWindowResize = () => updateCanvasGeometry()
        window.addEventListener("resize", handleWindowResize)
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", handleWindowResize)
        }
    }, [updateCanvasGeometry])

    React.useEffect(() => {
        return () => {
            animationTokenRef.current += 1
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (restoreTimerRef.current !== null) {
                window.clearTimeout(restoreTimerRef.current)
            }
        }
    }, [])

    const applySweep = React.useCallback(
        (progress: number, settings: ParticleSettings) => {
            const clip = clipRef.current
            const button = buttonRef.current
            if (!clip || !button) return

            const signedProgress = progress * 101
            const positive =
                settings.direction === "left" || settings.direction === "top"
            const value = positive ? signedProgress : -signedProgress
            const axis =
                settings.direction === "left" || settings.direction === "right"
                    ? "X"
                    : "Y"

            visualStylesRef.current.clipTransform = `translate${axis}(${value}%)`
            visualStylesRef.current.buttonTransform = `translate${axis}(${-value}%)`
            clip.style.transform = visualStylesRef.current.clipTransform
            button.style.transform = visualStylesRef.current.buttonTransform
        },
        []
    )

    const addParticles = React.useCallback(
        (
            progress: number,
            progressDifference: number,
            now: number,
            settings: ParticleSettings
        ) => {
            const geometry = geometryRef.current
            if (!geometry || progressDifference <= 0) return

            const {
                padding: canvasPadding,
                buttonWidth,
                buttonHeight,
            } = geometry
            const horizontal =
                settings.direction === "left" || settings.direction === "right"
            let x = canvasPadding
            let y = canvasPadding

            if (horizontal) {
                x +=
                    settings.direction === "left"
                        ? buttonWidth * progress
                        : buttonWidth * (1 - progress)
            } else {
                y +=
                    settings.direction === "top"
                        ? buttonHeight * progress
                        : buttonHeight * (1 - progress)
            }

            const requestedCount = Math.max(
                1,
                Math.floor(settings.amount * (progressDifference * 100 + 1))
            )
            const availableSlots = Math.max(
                0,
                1400 - particlesRef.current.length
            )
            const count = Math.min(requestedCount, availableSlots)

            for (let index = 0; index < count; index++) {
                const particleSpeed = settings.randomSpeed
                    ? randomBetween(-settings.speed / 2, settings.speed / 2)
                    : settings.speed
                particlesRef.current.push({
                    startX: horizontal
                        ? x
                        : canvasPadding + Math.random() * buttonWidth,
                    startY: horizontal
                        ? canvasPadding + Math.random() * buttonHeight
                        : y,
                    angle: Math.random() * Math.PI * 2,
                    born: now,
                    life: settings.duration * randomBetween(0.65, 1.05),
                    speed: particleSpeed,
                    size: settings.randomSpeed
                        ? randomBetween(1, Math.max(2, settings.size))
                        : settings.size,
                    color:
                        settings.colors[
                            Math.floor(Math.random() * settings.colors.length)
                        ] ?? "#000000",
                })
            }
        },
        []
    )

    const startAnimation = React.useCallback(
        (afterDisintegrate?: () => void) => {
            if (isStaticRenderer || runningRef.current) return false

            if (reducedMotionRef.current) {
                afterDisintegrate?.()
                return true
            }

            const canvas = canvasRef.current
            const context = canvas?.getContext("2d")
            const clip = clipRef.current
            if (!canvas || !context || !clip) return false

            runningRef.current = true
            particlesRef.current = []
            const token = ++animationTokenRef.current

            const runPhase = (
                disintegrating: boolean,
                settings: ParticleSettings,
                complete: () => void
            ) => {
                const geometry = updateCanvasGeometry()
                if (!geometry || token !== animationTokenRef.current) return

                visualPhaseRef.current = disintegrating
                    ? "disintegrating"
                    : "restoring"
                visualStylesRef.current.clipVisibility = "visible"
                visualStylesRef.current.clipOpacity = "1"
                visualStylesRef.current.canvasDisplay = "block"
                clip.style.visibility = visualStylesRef.current.clipVisibility
                clip.style.opacity = visualStylesRef.current.clipOpacity
                canvas.style.display = visualStylesRef.current.canvasDisplay
                particlesRef.current = []
                const startTime = performance.now()
                let lastProgress = disintegrating ? 0 : 1
                let sweepComplete = false

                applySweep(lastProgress, settings)

                const frame = (now: number) => {
                    if (token !== animationTokenRef.current) return

                    const currentGeometry = geometryRef.current ?? geometry
                    const elapsed = now - startTime
                    const timelineProgress = clamp01(
                        elapsed / settings.duration
                    )
                    const easedProgress = ease(
                        settings.easing,
                        timelineProgress
                    )
                    const progress = disintegrating
                        ? easedProgress
                        : 1 - easedProgress
                    const difference = Math.abs(progress - lastProgress)

                    if (!sweepComplete) {
                        applySweep(progress, settings)
                        addParticles(progress, difference, now, settings)
                        lastProgress = progress

                        if (timelineProgress >= 1) {
                            sweepComplete = true
                            applySweep(disintegrating ? 1 : 0, settings)
                            if (disintegrating) {
                                visualPhaseRef.current = "hidden"
                                visualStylesRef.current.clipOpacity = "0"
                                clip.style.opacity = visualStylesRef.current.clipOpacity
                            }
                        }
                    }

                    context.clearRect(
                        0,
                        0,
                        currentGeometry.width,
                        currentGeometry.height
                    )
                    particlesRef.current = particlesRef.current.filter(
                        (particle) => now - particle.born < particle.life
                    )
                    particlesRef.current.forEach((particle) =>
                        drawParticle(context, particle, settings, now)
                    )

                    if (!sweepComplete || particlesRef.current.length > 0) {
                        animationFrameRef.current = requestAnimationFrame(frame)
                    } else {
                        animationFrameRef.current = null
                        visualStylesRef.current.canvasDisplay = "none"
                        canvas.style.display = visualStylesRef.current.canvasDisplay
                        complete()
                    }
                }

                animationFrameRef.current = requestAnimationFrame(frame)
            }

            runPhase(true, particleSettings, () => {
                afterDisintegrate?.()

                if (!autoRestore || token !== animationTokenRef.current) {
                    runningRef.current = false
                    return
                }

                restoreTimerRef.current = window.setTimeout(
                    () => {
                        restoreTimerRef.current = null
                        const restoreSettings: ParticleSettings = {
                            ...particleSettings,
                            duration: Math.min(800, particleSettings.duration),
                            easing: "easeOutSine",
                        }
                        runPhase(false, restoreSettings, () => {
                            runningRef.current = false
                            resetVisuals()
                        })
                    },
                    Math.max(0, restoreDelay)
                )
            })

            return true
        },
        [
            addParticles,
            applySweep,
            autoRestore,
            isStaticRenderer,
            particleSettings,
            resetVisuals,
            restoreDelay,
            updateCanvasGeometry,
        ]
    )

    const handleClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (isStaticRenderer) {
                event.preventDefault()
                return
            }

            if (trigger !== "click") return
            if (link) event.preventDefault()

            if (link && newTab && typeof window !== "undefined") {
                window.open(link, "_blank", "noopener,noreferrer")
            }

            const started = startAnimation(() => {
                if (link && !newTab && typeof window !== "undefined") {
                    window.location.assign(link)
                }
            })

            if (!started && link && !newTab && typeof window !== "undefined") {
                window.location.assign(link)
            }
        },
        [isStaticRenderer, link, newTab, startAnimation, trigger]
    )

    const handlePointerEnter = React.useCallback(() => {
        if (trigger === "hover") startAnimation()
    }, [startAnimation, trigger])

    const buttonStyle: React.CSSProperties = {
        ...font,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        minWidth: 0,
        margin: 0,
        padding,
        ...border,
        borderRadius: radius,
        background,
        color: textColor,
        textDecoration: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        appearance: "none",
        outline: "none",
        boxShadow: focused
            ? `0 0 0 3px color-mix(in srgb, ${textColor} 45%, transparent)`
            : "none",
        willChange: "transform",
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: style?.width ?? "fit-content",
                height: style?.height ?? "fit-content",
                position: style?.position ?? "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                isolation: "isolate",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    display: "none",
                    pointerEvents: "none",
                    transform: "translate3d(-50%, -50%, 0)",
                    zIndex: 1,
                }}
            />
            {link ? (
                <a
                    href={link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onFocus={() => {
                        React.startTransition(() => setFocused(true))
                    }}
                    onBlur={() => {
                        React.startTransition(() => setFocused(false))
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        cursor: "pointer",
                        background: "transparent",
                        display: "block",
                        textDecoration: "none",
                        outline: "none",
                    }}
                />
            ) : (
                <button
                    type="button"
                    aria-label={label}
                    onClick={handleClick}
                    onPointerEnter={handlePointerEnter}
                    onFocus={() => {
                        React.startTransition(() => setFocused(true))
                    }}
                    onBlur={() => {
                        React.startTransition(() => setFocused(false))
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        cursor: "pointer",
                        background: "transparent",
                        border: "none",
                        margin: 0,
                        padding: 0,
                        appearance: "none",
                        outline: "none",
                    }}
                />
            )}
            <div
                ref={clipRef}
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    maxWidth: "100%",
                    overflow: "hidden",
                    willChange: "transform",
                    zIndex: 0,
                }}
            >
                <div
                    ref={buttonRef}
                    aria-hidden="true"
                    style={{
                        ...buttonStyle,
                        pointerEvents: "none",
                    }}
                >
                    {label}
                </div>
            </div>
        </div>
    )
}

ParticleEffectsButton.displayName = "Particle Button"

addPropertyControls(ParticleEffectsButton, {
    preset: {
        type: ControlType.Enum,
        title: "Effect",
        options: [...PRESET_OPTION_VALUES],
        optionTitles: PRESET_OPTION_TITLES,
        defaultValue: "01",
        description:
            "Free adaptation based on [Particle Effects for Buttons by Luis Manuel / Codrops](https://tympanus.net/codrops/2018/04/25/particle-effects-for-buttons/).",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Explore",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        defaultValue: "click",
        displaySegmentedControl: true,
    },
    autoRestore: {
        type: ControlType.Boolean,
        title: "Return",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "One-shot",
    },
    restoreDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 350,
        min: 0,
        max: 3000,
        step: 50,
        unit: "ms",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.autoRestore),
    },
    effectPadding: {
        type: ControlType.Number,
        title: "Effect Area",
        defaultValue: 150,
        min: 40,
        max: 300,
        step: 10,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            lineHeight: "1em",
            letterSpacing: "0em",
            textAlign: "center",
        },
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#121019",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "22px 90px 22px 90px",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "40px",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#000000",
        },
    },
    particleColor1: {
        type: ControlType.Color,
        title: "Particle 1",
        defaultValue: "#121019",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    particleColor2: {
        type: ControlType.Color,
        title: "Particle 2",
        defaultValue: "#ffffff",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "rectangle", "triangle"],
        optionTitles: ["Circle", "Rectangle", "Triangle"],
        defaultValue: "circle",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    drawStyle: {
        type: ControlType.Enum,
        title: "Particle Style",
        options: ["fill", "stroke"],
        optionTitles: ["Filled", "Outlined"],
        defaultValue: "fill",
        displaySegmentedControl: true,
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1000,
        min: 150,
        max: 3000,
        step: 50,
        unit: "ms",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "easeInOutCubic",
            "easeOutQuart",
            "easeOutQuad",
            "easeInExpo",
            "easeInCubic",
            "easeOutSine",
            "codropsBezier",
        ],
        optionTitles: [
            "In Out Cubic",
            "Out Quart",
            "Out Quad",
            "In Expo",
            "In Cubic",
            "Out Sine",
            "Codrops Bezier",
        ],
        defaultValue: "easeInOutCubic",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    particleSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 3,
        min: 1,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 4,
        min: 0.05,
        max: 10,
        step: 0.05,
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    amount: {
        type: ControlType.Number,
        title: "Amount",
        defaultValue: 3,
        min: 0.5,
        max: 12,
        step: 0.5,
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    oscillation: {
        type: ControlType.Number,
        title: "Oscillation",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        hidden: (props: Partial<MyComponentProps>) =>
            Boolean(!props.useCustomParticles),
    },
    useCustomParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Preset",
        description:
            "Made possible as a component by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
