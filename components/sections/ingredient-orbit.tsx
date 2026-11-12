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


type Preset = "formula" | "mineral" | "fresh" | "night"
type Shape = "circle" | "softSquare"
type LabelMode = "fallback" | "always" | "never"
type HeadingPosition = "bottom" | "center" | "top" | "hidden"

interface FramerImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface IngredientItem {
    symbol: string
    label?: string
    image?: FramerImage
    imageBg: string
    ringColor?: string
    size: number
}

interface IngredientOrbitProps {
    ingredients: IngredientItem[]
    preset: Preset
    customColors: boolean
    backgroundColor: string
    particleColor: string
    ringColor: string
    symbolColor: string
    textColor: string
    shape: Shape
    labelMode: LabelMode
    showParticleBorder: boolean
    borderWidth: number
    particleShadow: boolean
    animation: boolean
    speed: number
    attractorX: number
    attractorY: number
    attractorStrength: number
    orbitDrift: number
    cursorStrength: number
    cursorFieldRadius: number
    friction: number
    restitution: number
    maxSpeed: number
    respectReducedMotion: boolean
    showHeading: boolean
    headingPosition: HeadingPosition
    headingText: string
    highlightText: string
    headingMaxWidth: number
    headingFont: React.CSSProperties
    highlightFont: React.CSSProperties
    symbolFont: React.CSSProperties
    style?: React.CSSProperties
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    symbol: string
    label: string
    imageBg: string
    ringColor?: string
    image?: HTMLImageElement
    imageSrc: string
    imageLoaded: boolean
    imageFailed: boolean
    opacity: number
    seed: number
}

interface RuntimeState {
    particles: Particle[]
    pointer: { x: number; y: number; active: boolean }
    width: number
    height: number
    frame: number
    lastTime: number
    needsDraw: boolean
}

const INTRINSIC_WIDTH = 980
const INTRINSIC_HEIGHT = 640
const DEFAULT_DPR_LIMIT = 2

const DEFAULT_INGREDIENTS: IngredientItem[] = [
    { symbol: "Mg", label: "Magnesium", imageBg: "#E9D8BE", size: 88 },
    { symbol: "D3", label: "Vitamin D3", imageBg: "#F4E8C8", size: 68 },
    { symbol: "Zn", label: "Zinc", imageBg: "#D7E3CA", size: 58 },
    { symbol: "K2", label: "Vitamin K2", imageBg: "#D9D0F2", size: 72 },
    { symbol: "B6", label: "Vitamin B6", imageBg: "#F1D7DD", size: 54 },
    { symbol: "Se", label: "Selenium", imageBg: "#DCE8F5", size: 76 },
    { symbol: "Cr", label: "Chromium", imageBg: "#E3DAC9", size: 96 },
    { symbol: "Co", label: "Collagen", imageBg: "#F3E1D3", size: 80 },
    { symbol: "Om", label: "Omega", imageBg: "#CADDD8", size: 62 },
    { symbol: "Rh", label: "Rhodiola", imageBg: "#E8DCC3", size: 90 },
    { symbol: "Ap", label: "Apigenin", imageBg: "#F7F0E4", size: 48 },
    { symbol: "NR", label: "NR", imageBg: "#DAD8BE", size: 70 },
]

const PRESETS: Record<
    Preset,
    {
        background: string
        particle: string
        ring: string
        symbol: string
        text: string
    }
> = {
    formula: {
        background: "#FAF8F2",
        particle: "#ECE0CC",
        ring: "rgba(11, 17, 29, 0.1)",
        symbol: "rgba(11, 17, 29, 0.54)",
        text: "#0B111D",
    },
    mineral: {
        background: "#F4F7F8",
        particle: "#D7E2E7",
        ring: "rgba(24, 43, 56, 0.12)",
        symbol: "rgba(24, 43, 56, 0.58)",
        text: "#182B38",
    },
    fresh: {
        background: "#F3F7EF",
        particle: "#D9E8C8",
        ring: "rgba(44, 71, 39, 0.12)",
        symbol: "rgba(44, 71, 39, 0.58)",
        text: "#1E321B",
    },
    night: {
        background: "#0B111D",
        particle: "#263142",
        ring: "rgba(255, 255, 255, 0.14)",
        symbol: "rgba(255, 255, 255, 0.72)",
        text: "#F6F0E7",
    },
}

/**
 * Ingredient Orbit
 *
 * Interactive canvas particles for ingredient, product, or feature callouts.
 *
 * @framerIntrinsicWidth 980
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function IngredientOrbit(props: IngredientOrbitProps) {
    const {
        ingredients = DEFAULT_INGREDIENTS,
        preset = "formula",
        customColors = false,
        backgroundColor = PRESETS.formula.background,
        particleColor = PRESETS.formula.particle,
        ringColor = PRESETS.formula.ring,
        symbolColor = PRESETS.formula.symbol,
        textColor = PRESETS.formula.text,
        shape = "circle",
        labelMode = "fallback",
        showParticleBorder = true,
        borderWidth = 1,
        particleShadow = true,
        animation = true,
        speed = 1,
        attractorX = 50,
        attractorY = 48,
        attractorStrength = 0.00012,
        orbitDrift = 0.18,
        cursorStrength = 0.012,
        cursorFieldRadius = 240,
        friction = 0.55,
        restitution = 0.2,
        maxSpeed = 4,
        respectReducedMotion = true,
        showHeading = true,
        headingPosition = "bottom",
        headingText = "Inside the",
        highlightText = "formula",
        headingMaxWidth = 720,
        headingFont,
        highlightFont,
        symbolFont,
        style,
    } = props

    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef<number | null>(null)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const stateRef = React.useRef<RuntimeState>({
        particles: [],
        pointer: { x: -9999, y: -9999, active: false },
        width: 0,
        height: 0,
        frame: 0,
        lastTime: 0,
        needsDraw: true,
    })

    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const prefersReducedMotion = usePrefersReducedMotion()
    const theme = customColors
        ? {
              background: backgroundColor,
              particle: particleColor,
              ring: ringColor,
              symbol: symbolColor,
              text: textColor,
          }
        : PRESETS[preset]

    const itemSignature = React.useMemo(() => {
        return normalizeIngredients(ingredients)
            .map((item) =>
                [
                    item.symbol,
                    item.label,
                    imageSrc(item.image),
                    item.imageBg,
                    item.ringColor,
                    item.size,
                ].join(":")
            )
            .join("|")
    }, [ingredients])

    const shouldAnimate =
        animation &&
        !isStaticRenderer &&
        !(respectReducedMotion && prefersReducedMotion)

    React.useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const context = canvas.getContext("2d")
        if (!context) return

        let disposed = false
        let isNearViewport = !shouldAnimate || isCanvas
        let intersectionObserver: IntersectionObserver | null = null

        const applySize = () => {
            const rect = container.getBoundingClientRect()
            const width = Math.max(1, Math.round(rect.width || INTRINSIC_WIDTH))
            const height = Math.max(
                1,
                Math.round(rect.height || INTRINSIC_HEIGHT)
            )
            const state = stateRef.current
            const oldWidth = state.width || width
            const oldHeight = state.height || height

            state.width = width
            state.height = height

            const dpr = Math.min(
                DEFAULT_DPR_LIMIT,
                Math.max(1, window.devicePixelRatio || 1)
            )
            canvas.width = Math.round(width * dpr)
            canvas.height = Math.round(height * dpr)
            canvas.style.width = "100%"
            canvas.style.height = "100%"
            context.setTransform(dpr, 0, 0, dpr, 0, 0)

            if (state.particles.length === 0) {
                state.particles = createParticles(
                    normalizeIngredients(ingredients),
                    width,
                    height,
                    theme.particle,
                    theme.ring,
                    markNeedsDraw
                )
            } else if (oldWidth !== width || oldHeight !== height) {
                const sx = width / oldWidth
                const sy = height / oldHeight
                state.particles.forEach((particle) => {
                    particle.x = clampToCanvas(
                        particle.x * sx,
                        particle.radius,
                        width
                    )
                    particle.y = clampToCanvas(
                        particle.y * sy,
                        particle.radius,
                        height
                    )
                })
            }

            state.needsDraw = true
            draw(context, state, propsForDraw())
        }

        const propsForDraw = (): DrawProps => ({
            theme,
            shape,
            labelMode,
            showParticleBorder,
            borderWidth,
            particleShadow,
            symbolColor: theme.symbol,
            symbolFont,
            attractorX,
            attractorY,
            attractorStrength,
            orbitDrift,
            cursorStrength,
            cursorFieldRadius,
            friction,
            restitution,
            maxSpeed,
            speed,
            animate: shouldAnimate,
        })

        const markNeedsDraw = () => {
            const state = stateRef.current
            state.needsDraw = true
            if (!shouldAnimate) {
                requestAnimationFrame(() => {
                    if (!disposed) draw(context, state, propsForDraw())
                })
            }
        }

        const canRunAnimation = () => {
            if (!shouldAnimate) return false
            if (!isCanvas && document.hidden) return false
            return isNearViewport
        }

        stateRef.current.particles = createParticles(
            normalizeIngredients(ingredients),
            stateRef.current.width || INTRINSIC_WIDTH,
            stateRef.current.height || INTRINSIC_HEIGHT,
            theme.particle,
            theme.ring,
            markNeedsDraw
        )
        stateRef.current.frame = 0
        stateRef.current.lastTime = 0
        stateRef.current.needsDraw = true

        const startLoop = () => {
            if (rafRef.current !== null || !canRunAnimation()) return
            stateRef.current.lastTime = 0

            const tick = (now: number) => {
                if (disposed) return
                const state = stateRef.current

                if (!canRunAnimation()) {
                    rafRef.current = null
                    state.lastTime = 0
                    state.needsDraw = true
                    draw(context, state, propsForDraw())
                    return
                }

                const delta = state.lastTime
                    ? clamp((now - state.lastTime) / 16.67, 0.25, 2.4)
                    : 1
                state.lastTime = now

                stepPhysics(state, propsForDraw(), delta)
                draw(context, state, propsForDraw())
                rafRef.current = requestAnimationFrame(tick)
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        const stopLoop = () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            stateRef.current.lastTime = 0
        }

        const onPointerMove = (event: PointerEvent) => {
            if (isStaticRenderer) return
            const rect = container.getBoundingClientRect()
            stateRef.current.pointer = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                active: true,
            }
        }

        const onPointerLeave = () => {
            stateRef.current.pointer = { x: -9999, y: -9999, active: false }
        }

        const onVisibilityChange = () => {
            if (canRunAnimation()) {
                startLoop()
            } else {
                stopLoop()
                stateRef.current.needsDraw = true
                draw(context, stateRef.current, propsForDraw())
            }
        }

        const removeResizeFallback = () =>
            window.removeEventListener("resize", applySize)

        resizeObserverRef.current?.disconnect()
        if (typeof ResizeObserver !== "undefined") {
            resizeObserverRef.current = new ResizeObserver(applySize)
            resizeObserverRef.current.observe(container)
        } else {
            resizeObserverRef.current = null
            window.addEventListener("resize", applySize)
        }

        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerleave", onPointerLeave)
        container.addEventListener("pointercancel", onPointerLeave)
        document.addEventListener("visibilitychange", onVisibilityChange)

        if (
            shouldAnimate &&
            !isCanvas &&
            typeof IntersectionObserver !== "undefined"
        ) {
            isNearViewport = false
            intersectionObserver = new IntersectionObserver(
                ([entry]) => {
                    isNearViewport = entry.isIntersecting
                    if (isNearViewport) {
                        startLoop()
                    } else {
                        stopLoop()
                    }
                },
                {
                    root: null,
                    rootMargin: "360px 0px",
                    threshold: 0,
                }
            )
            intersectionObserver.observe(container)
        } else {
            isNearViewport = true
        }

        applySize()
        startLoop()

        return () => {
            disposed = true
            stopLoop()
            intersectionObserver?.disconnect()
            intersectionObserver = null
            resizeObserverRef.current?.disconnect()
            resizeObserverRef.current = null
            removeResizeFallback()
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("pointercancel", onPointerLeave)
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
    }, [
        itemSignature,
        preset,
        customColors,
        backgroundColor,
        particleColor,
        ringColor,
        symbolColor,
        shape,
        labelMode,
        showParticleBorder,
        borderWidth,
        particleShadow,
        animation,
        speed,
        attractorX,
        attractorY,
        attractorStrength,
        orbitDrift,
        cursorStrength,
        cursorFieldRadius,
        friction,
        restitution,
        maxSpeed,
        respectReducedMotion,
        prefersReducedMotion,
        shouldAnimate,
        isStaticRenderer,
        isCanvas,
        symbolFont,
    ])

    const headingVisible =
        showHeading && headingPosition !== "hidden" && (headingText || highlightText)
    const headingPlacement = getHeadingPlacement(headingPosition)
    const ariaLabel = buildAriaLabel(headingText, highlightText, ingredients)

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                position: "relative",
                overflow: "hidden",
                background: theme.background,
                borderRadius: "inherit",
                touchAction: "none",
                isolation: "isolate",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />

            {headingVisible && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 2,
                        width: "min(calc(100% - 48px), 100%)",
                        maxWidth: headingMaxWidth,
                        textAlign: "center",
                        pointerEvents: "none",
                        color: theme.text,
                        ...headingPlacement,
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: "inherit",
                            overflowWrap: "break-word",
                            ...headingFont,
                        }}
                    >
                        {headingText}
                        {headingText && highlightText ? " " : ""}
                        <span
                            style={{
                                fontStyle: "italic",
                                color: "inherit",
                                ...highlightFont,
                            }}
                        >
                            {highlightText}
                        </span>
                    </p>
                </div>
            )}
        </div>
    )
}

interface DrawProps {
    theme: (typeof PRESETS)[Preset]
    shape: Shape
    labelMode: LabelMode
    showParticleBorder: boolean
    borderWidth: number
    particleShadow: boolean
    symbolColor: string
    symbolFont: React.CSSProperties
    attractorX: number
    attractorY: number
    attractorStrength: number
    orbitDrift: number
    cursorStrength: number
    cursorFieldRadius: number
    friction: number
    restitution: number
    maxSpeed: number
    speed: number
    animate: boolean
}

function createParticles(
    ingredients: IngredientItem[],
    width: number,
    height: number,
    fallbackColor: string,
    fallbackRing: string,
    onAssetReady?: () => void
) {
    const list = ingredients.length ? ingredients : DEFAULT_INGREDIENTS
    const count = Math.min(list.length, 40)
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)))
    const rows = Math.max(1, Math.ceil(count / cols))

    return list.slice(0, count).map((ingredient, index) => {
        const seed = hash(`${ingredient.symbol}-${ingredient.label ?? ""}-${index}`)
        const jitter = seeded(seed)
        const radius = clamp((ingredient.size || 64) / 2, 18, 84)
        const col = index % cols
        const row = Math.floor(index / cols)
        const cellW = width / cols
        const cellH = height / rows
        const x = clampToCanvas(
            (col + 0.5) * cellW + (jitter() - 0.5) * Math.min(54, cellW * 0.42),
            radius,
            width
        )
        const y = clampToCanvas(
            (row + 0.5) * cellH + (jitter() - 0.5) * Math.min(54, cellH * 0.42),
            radius,
            height
        )
        const src = imageSrc(ingredient.image)
        const particle: Particle = {
            x,
            y,
            vx: (jitter() - 0.5) * 1.4,
            vy: (jitter() - 0.5) * 1.4,
            radius,
            symbol: ingredient.symbol || "",
            label: ingredient.label || ingredient.symbol || "Ingredient",
            imageBg: ingredient.imageBg || fallbackColor,
            ringColor: ingredient.ringColor || fallbackRing,
            imageSrc: src,
            imageLoaded: false,
            imageFailed: false,
            opacity: 0,
            seed,
        }

        if (src && typeof Image !== "undefined") {
            const image = new Image()
            image.crossOrigin = "anonymous"
            image.onload = () => {
                particle.image = image
                particle.imageLoaded = true
                particle.imageFailed = false
                onAssetReady?.()
            }
            image.onerror = () => {
                particle.imageLoaded = false
                particle.imageFailed = true
                onAssetReady?.()
            }
            image.src = src
        }

        return particle
    })
}

function stepPhysics(state: RuntimeState, props: DrawProps, delta: number) {
    const { width, height, pointer, particles } = state
    const atX = (props.attractorX / 100) * width
    const atY = (props.attractorY / 100) * height
    const speedScale = clamp(props.speed, 0.1, 3)
    state.frame += delta

    particles.forEach((particle) => {
        particle.opacity = Math.min(1, particle.opacity + 0.025 * delta)

        const dx = atX - particle.x
        const dy = atY - particle.y
        const dist = Math.hypot(dx, dy) || 1
        const pull = props.attractorStrength * 920 * speedScale * delta
        const drift = props.orbitDrift * 0.018 * speedScale * delta

        particle.vx += (dx / dist) * pull + (-dy / dist) * drift
        particle.vy += (dy / dist) * pull + (dx / dist) * drift

        if (pointer.active) {
            const px = pointer.x - particle.x
            const py = pointer.y - particle.y
            const pointerDistance = Math.hypot(px, py) || 1
            if (pointerDistance < props.cursorFieldRadius) {
                const falloff =
                    (props.cursorFieldRadius - pointerDistance) /
                    props.cursorFieldRadius
                const push = props.cursorStrength * 940 * falloff * delta
                particle.vx -= (px / pointerDistance) * push
                particle.vy -= (py / pointerDistance) * push
            }
        }

        const idleNoise =
            Math.sin((state.frame + particle.seed) * 0.018) *
            0.012 *
            speedScale *
            delta
        particle.vx += idleNoise
        particle.vy -= idleNoise

        const damping = Math.pow(1 - props.friction * 0.08, delta)
        particle.vx *= damping
        particle.vy *= damping

        const maxSpeed = Math.max(0.5, props.maxSpeed) * speedScale
        const currentSpeed = Math.hypot(particle.vx, particle.vy)
        if (currentSpeed > maxSpeed) {
            particle.vx = (particle.vx / currentSpeed) * maxSpeed
            particle.vy = (particle.vy / currentSpeed) * maxSpeed
        }

        particle.x += particle.vx * delta
        particle.y += particle.vy * delta

        bounceWithinBounds(particle, width, height, props.restitution)
    })

    separateParticles(particles, props.restitution)
}

function bounceWithinBounds(
    particle: Particle,
    width: number,
    height: number,
    restitution: number
) {
    if (width <= particle.radius * 2) {
        particle.x = width / 2
        particle.vx = 0
    } else {
        if (particle.x - particle.radius < 0) {
            particle.x = particle.radius
            particle.vx *= -restitution
        }
        if (particle.x + particle.radius > width) {
            particle.x = width - particle.radius
            particle.vx *= -restitution
        }
    }

    if (height <= particle.radius * 2) {
        particle.y = height / 2
        particle.vy = 0
    } else {
        if (particle.y - particle.radius < 0) {
            particle.y = particle.radius
            particle.vy *= -restitution
        }
        if (particle.y + particle.radius > height) {
            particle.y = height - particle.radius
            particle.vy *= -restitution
        }
    }
}

function separateParticles(particles: Particle[], restitution: number) {
    for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
            const a = particles[i]
            const b = particles[j]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const minDistance = a.radius + b.radius + 4
            const distanceSq = dx * dx + dy * dy

            if (distanceSq >= minDistance * minDistance) continue

            const distance = Math.sqrt(distanceSq) || 0.001
            const nx = dx / distance
            const ny = dy / distance
            const overlap = (minDistance - distance) / 2

            a.x -= nx * overlap
            a.y -= ny * overlap
            b.x += nx * overlap
            b.y += ny * overlap

            const dvx = b.vx - a.vx
            const dvy = b.vy - a.vy
            const dot = dvx * nx + dvy * ny

            if (dot < 0) {
                const impulse = dot * (1 + restitution) * 0.5
                a.vx += impulse * nx
                a.vy += impulse * ny
                b.vx -= impulse * nx
                b.vy -= impulse * ny
            }
        }
    }
}

function draw(
    context: CanvasRenderingContext2D,
    state: RuntimeState,
    props: DrawProps
) {
    context.clearRect(0, 0, state.width, state.height)

    state.particles.forEach((particle) => {
        context.save()
        context.globalAlpha = particle.opacity

        if (props.particleShadow) {
            context.shadowColor = "rgba(11, 17, 29, 0.12)"
            context.shadowBlur = 18
            context.shadowOffsetY = 8
        }

        makeParticlePath(context, particle, props.shape)
        context.closePath()
        context.clip()

        if (particle.imageLoaded && particle.image) {
            context.drawImage(
                particle.image,
                particle.x - particle.radius,
                particle.y - particle.radius,
                particle.radius * 2,
                particle.radius * 2
            )
        } else {
            context.fillStyle = particle.imageBg || props.theme.particle
            context.fill()
        }

        context.shadowColor = "transparent"
        context.shadowBlur = 0
        context.shadowOffsetY = 0

        if (props.showParticleBorder && props.borderWidth > 0) {
            makeParticlePath(context, particle, props.shape)
            context.strokeStyle = particle.ringColor || props.theme.ring
            context.lineWidth = props.borderWidth
            context.stroke()
        }

        const shouldShowLabel =
            props.labelMode === "always" ||
            (props.labelMode === "fallback" && !particle.imageLoaded)

        if (shouldShowLabel && particle.symbol) {
            const fontSize = Math.max(11, particle.radius * 0.42)
            context.fillStyle = props.symbolColor
            context.textAlign = "center"
            context.textBaseline = "middle"
            context.font = `${fontWeight(props.symbolFont)} ${fontSize}px ${fontFamily(
                props.symbolFont
            )}`
            context.fillText(particle.symbol, particle.x, particle.y)
        }

        context.restore()
    })
}

function makeParticlePath(
    context: CanvasRenderingContext2D,
    particle: Particle,
    shape: Shape
) {
    context.beginPath()
    if (shape === "softSquare") {
        const side = particle.radius * 2
        const radius = particle.radius * 0.58
        roundedRect(
            context,
            particle.x - particle.radius,
            particle.y - particle.radius,
            side,
            side,
            radius
        )
    } else {
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
    }
}

function roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    const r = Math.min(radius, width / 2, height / 2)
    context.moveTo(x + r, y)
    context.arcTo(x + width, y, x + width, y + height, r)
    context.arcTo(x + width, y + height, x, y + height, r)
    context.arcTo(x, y + height, x, y, r)
    context.arcTo(x, y, x + width, y, r)
}

function normalizeIngredients(items: IngredientItem[] | undefined) {
    const source = items && items.length > 0 ? items : DEFAULT_INGREDIENTS
    return source.map((item) => ({
        symbol: item.symbol || "",
        label: item.label || item.symbol || "Ingredient",
        image: item.image,
        imageBg: item.imageBg || PRESETS.formula.particle,
        ringColor: item.ringColor,
        size: clamp(Number(item.size) || 64, 36, 168),
    }))
}

function imageSrc(image: FramerImage | undefined) {
    if (!image) return ""
    return image.src || ""
}

function fontFamily(font: React.CSSProperties | undefined) {
    const family = font?.fontFamily
    return typeof family === "string"
        ? family
        : "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
}

function fontWeight(font: React.CSSProperties | undefined) {
    const weight = font?.fontWeight
    if (typeof weight === "number") return String(weight)
    if (typeof weight === "string") return weight
    return "600"
}

function getHeadingPlacement(position: HeadingPosition): React.CSSProperties {
    if (position === "top") return { top: 32 }
    if (position === "center") return { top: "50%", transform: "translate(-50%, -50%)" }
    return { bottom: 32 }
}

function buildAriaLabel(
    headingText: string,
    highlightText: string,
    ingredients: IngredientItem[]
) {
    const title = [headingText, highlightText].filter(Boolean).join(" ")
    const labels = normalizeIngredients(ingredients)
        .slice(0, 12)
        .map((item) => item.label || item.symbol)
        .filter(Boolean)
        .join(", ")

    return [title || "Ingredient orbit", labels ? `Ingredients: ${labels}` : ""]
        .filter(Boolean)
        .join(". ")
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)
        update()
        media.addEventListener?.("change", update)
        return () => media.removeEventListener?.("change", update)
    }, [])

    return reduced
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function clampToCanvas(value: number, radius: number, size: number) {
    if (size <= radius * 2) return size / 2
    return clamp(value, radius, size - radius)
}

function hash(value: string) {
    let result = 2166136261
    for (let i = 0; i < value.length; i += 1) {
        result ^= value.charCodeAt(i)
        result = Math.imul(result, 16777619)
    }
    return result >>> 0
}

function seeded(seed: number) {
    let value = seed >>> 0
    return () => {
        value += 0x6d2b79f5
        let t = value
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

IngredientOrbit.displayName = "Ingredient Orbit"

addPropertyControls<IngredientOrbitProps>(IngredientOrbit, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["formula", "mineral", "fresh", "night"],
        optionTitles: ["Formula", "Mineral", "Fresh", "Night"],
        defaultValue: "formula",
        displaySegmentedControl: true,
    },
    ingredients: {
        type: ControlType.Array,
        title: "Ingredients",
        maxCount: 40,
        defaultValue: DEFAULT_INGREDIENTS,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                symbol: {
                    type: ControlType.String,
                    title: "Symbol",
                    defaultValue: "Mg",
                    placeholder: "Mg",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Magnesium",
                    placeholder: "Ingredient name",
                },
                imageBg: {
                    type: ControlType.Color,
                    title: "Fill",
                    defaultValue: "#E9D8BE",
                },
                ringColor: {
                    type: ControlType.Color,
                    title: "Ring",
                    defaultValue: "rgba(11, 17, 29, 0.1)",
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    defaultValue: 72,
                    min: 36,
                    max: 168,
                    step: 2,
                    unit: "px",
                },
            },
        },
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "softSquare"],
        optionTitles: ["Circle", "Soft Square"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    labelMode: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["fallback", "always", "never"],
        optionTitles: ["Fallback", "Always", "Never"],
        defaultValue: "fallback",
        displaySegmentedControl: true,
    },
    showParticleBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        defaultValue: 1,
        min: 0.5,
        max: 6,
        step: 0.5,
        unit: "px",
        hidden: ({ showParticleBorder }) => !showParticleBorder,
    },
    particleShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animation: {
        type: ControlType.Boolean,
        title: "Motion",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        hidden: ({ animation }) => !animation,
    },
    attractorX: {
        type: ControlType.Number,
        title: "Pull X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    attractorY: {
        type: ControlType.Number,
        title: "Pull Y",
        defaultValue: 48,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    attractorStrength: {
        type: ControlType.Number,
        title: "Pull",
        defaultValue: 0.00012,
        min: 0,
        max: 0.0015,
        step: 0.00002,
    },
    orbitDrift: {
        type: ControlType.Number,
        title: "Orbit",
        defaultValue: 0.18,
        min: -1,
        max: 1,
        step: 0.02,
        hidden: ({ animation }) => !animation,
    },
    cursorStrength: {
        type: ControlType.Number,
        title: "Pointer",
        defaultValue: 0.012,
        min: 0,
        max: 0.035,
        step: 0.001,
    },
    cursorFieldRadius: {
        type: ControlType.Number,
        title: "Pointer R",
        defaultValue: 240,
        min: 40,
        max: 520,
        step: 10,
        unit: "px",
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
    },
    restitution: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        defaultValue: 4,
        min: 0.5,
        max: 10,
        step: 0.5,
        hidden: ({ animation }) => !animation,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },
    showHeading: {
        type: ControlType.Boolean,
        title: "Heading",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    headingPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom", "center", "top", "hidden"],
        optionTitles: ["Bottom", "Center", "Top", "Hidden"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: ({ showHeading }) => !showHeading,
    },
    headingText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Inside the",
        hidden: ({ showHeading, headingPosition }) =>
            !showHeading || headingPosition === "hidden",
    },
    highlightText: {
        type: ControlType.String,
        title: "Accent",
        defaultValue: "formula",
        hidden: ({ showHeading, headingPosition }) =>
            !showHeading || headingPosition === "hidden",
    },
    headingMaxWidth: {
        type: ControlType.Number,
        title: "Text Width",
        defaultValue: 720,
        min: 240,
        max: 1200,
        step: 10,
        unit: "px",
        hidden: ({ showHeading, headingPosition }) =>
            !showHeading || headingPosition === "hidden",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.08em",
            textAlign: "center",
        },
        hidden: ({ showHeading, headingPosition }) =>
            !showHeading || headingPosition === "hidden",
    },
    highlightFont: {
        type: ControlType.Font,
        title: "Accent Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.08em",
            textAlign: "center",
        },
        hidden: ({ showHeading, headingPosition }) =>
            !showHeading || headingPosition === "hidden",
    },
    symbolFont: {
        type: ControlType.Font,
        title: "Symbol Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 24,
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
            textAlign: "center",
        },
        hidden: ({ labelMode }) => labelMode === "never",
    },
    customColors: {
        type: ControlType.Boolean,
        title: "Colors",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Preset",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: PRESETS.formula.background,
        hidden: ({ customColors }) => !customColors,
    },
    particleColor: {
        type: ControlType.Color,
        title: "Fallback Fill",
        defaultValue: PRESETS.formula.particle,
        hidden: ({ customColors }) => !customColors,
    },
    ringColor: {
        type: ControlType.Color,
        title: "Default Ring",
        defaultValue: PRESETS.formula.ring,
        hidden: ({ customColors }) => !customColors,
    },
    symbolColor: {
        type: ControlType.Color,
        title: "Symbol",
        defaultValue: PRESETS.formula.symbol,
        hidden: ({ customColors }) => !customColors,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: PRESETS.formula.text,
        hidden: ({ customColors }) => !customColors,
    },
})
