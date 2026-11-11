// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 800
// @framerIntrinsicHeight: 120

/**
 * Kern_KineticLine
 *
 * A single interactive line that responds to pointer position along its axis
 * with guitar-string-style pluck physics.
 *
 * @version 1.0.0
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useAnimationFrame,
    useInView,
    useReducedMotion,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"

type LineOrientation = "horizontal" | "vertical"

interface LineSimulationState {
    segmentCount: number
    displacement: Float32Array
    velocity: Float32Array
}

const MIN_SEGMENT_COUNT = 12
const MAX_SEGMENT_COUNT = 320

function clampSegmentCount(count: number): number {
    return Math.min(
        MAX_SEGMENT_COUNT,
        Math.max(MIN_SEGMENT_COUNT, Math.round(count))
    )
}

function createLineState(segmentCount: number): LineSimulationState {
    const count = clampSegmentCount(segmentCount)
    return {
        segmentCount: count,
        displacement: new Float32Array(count),
        velocity: new Float32Array(count),
    }
}

function resetLineState(state: LineSimulationState): void {
    state.displacement.fill(0)
    state.velocity.fill(0)
}

function gaussianWeight(
    segmentIndex: number,
    segmentCount: number,
    t: number,
    spread: number
): number {
    const normalized = segmentIndex / Math.max(segmentCount - 1, 1)
    const delta = normalized - t
    const sigma = Math.max(spread, 0.01)
    return Math.exp(-(delta * delta) / (2 * sigma * sigma))
}

function applyPluck(
    state: LineSimulationState,
    t: number,
    depth: number,
    spread: number,
    maxDisplacement: number
): void {
    const clampedT = Math.min(1, Math.max(0, t))
    const clampedDepth = Math.min(
        maxDisplacement,
        Math.max(-maxDisplacement, depth)
    )

    for (let i = 0; i < state.segmentCount; i += 1) {
        const weight = gaussianWeight(i, state.segmentCount, clampedT, spread)
        state.displacement[i] += clampedDepth * weight
    }
}

function stepSimulation(
    state: LineSimulationState,
    tension: number,
    damping: number,
    deltaSeconds: number
): void {
    const dt = Math.min(deltaSeconds, 0.016)
    const k = Math.max(0, tension)
    const c = Math.max(0, damping)

    for (let i = 0; i < state.segmentCount; i += 1) {
        const x = state.displacement[i]
        const v = state.velocity[i]
        const force = -k * x - c * v
        const nextV = v + force * dt
        const nextX = x + nextV * dt
        state.velocity[i] = nextV
        state.displacement[i] = nextX
    }
}

function buildPathD(
    state: LineSimulationState,
    options: { orientation: LineOrientation; padding: number }
): string {
    const { orientation, padding } = options
    const pad = Math.min(40, Math.max(0, padding))
    const span = 100 - pad * 2
    const count = state.segmentCount
    const base = 50

    if (count < 2) {
        return orientation === "horizontal"
            ? `M ${pad} ${base} L ${100 - pad} ${base}`
            : `M ${base} ${pad} L ${base} ${100 - pad}`
    }

    const parts: string[] = []

    for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1)
        const offset = state.displacement[i] * 100

        if (orientation === "horizontal") {
            const x = pad + t * span
            const y = base + offset
            parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
        } else {
            const x = base + offset
            const y = pad + t * span
            parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
        }
    }

    return parts.join(" ")
}

function mapPointerToPluck(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    orientation: LineOrientation,
    sensitivity: number,
    maxDisplacement: number,
    reducedMotionScale: number
): { t: number; depth: number } | null {
    if (rect.width <= 0 || rect.height <= 0) return null

    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const nx = localX / rect.width
    const ny = localY / rect.height

    if (orientation === "horizontal") {
        const t = Math.min(1, Math.max(0, nx))
        const perp = (ny - 0.5) * 2.5
        const edgeFalloff = 1 - Math.pow(Math.abs(2 * t - 1), 1.2) * 0.25
        const depth = perp * sensitivity * maxDisplacement * reducedMotionScale * edgeFalloff
        return { t, depth }
    }

    const t = Math.min(1, Math.max(0, ny))
    const perp = (nx - 0.5) * 2.5
    const edgeFalloff = 1 - Math.pow(Math.abs(2 * t - 1), 1.2) * 0.25
    const depth = perp * sensitivity * maxDisplacement * reducedMotionScale * edgeFalloff
    return { t, depth }
}

function isSimulationSettled(
    state: LineSimulationState,
    threshold = 0.0002
): boolean {
    for (let i = 0; i < state.segmentCount; i += 1) {
        if (
            Math.abs(state.displacement[i]) > threshold ||
            Math.abs(state.velocity[i]) > threshold
        ) {
            return false
        }
    }
    return true
}

type BackgroundMode = "transparent" | "solid"
type EntranceMode = "none" | "fade-in"

interface LayoutConfig {
    orientation: LineOrientation
    minHeight: number
    minHeightTablet: number
    minHeightMobile: number
    padding: number
    clipBends: boolean
}

interface StrokeConfig {
    color: string
    width: number
    widthTablet: number
    widthMobile: number
    opacity: number
    blendMode: string
}

interface PhysicsControlConfig {
    tension: number
    damping: number
    spread: number
    segmentCount: number
    segmentCountTablet: number
    segmentCountMobile: number
    maxDisplacement: number
    sensitivity: number
}

interface InteractionConfig {
    enabled: boolean
    touchCapture: boolean
    idleDampingBoost: number
    cursorType: "pointer" | "crosshair" | "grab" | "move" | "custom"
    customCursor?: string
}

interface BackgroundConfig {
    mode: BackgroundMode
    color: string
}

interface EntranceConfig {
    mode: EntranceMode
}

interface AccessibilityConfig {
    ariaLabel: string
    decorative: boolean
}

interface Props {
    layout?: LayoutConfig
    stroke?: StrokeConfig
    physics?: PhysicsControlConfig
    interaction?: InteractionConfig
    background?: BackgroundConfig
    entrance?: EntranceConfig
    accessibility?: AccessibilityConfig
    style?: CSSProperties
}

const DEFAULT_LAYOUT: LayoutConfig = {
    orientation: "horizontal",
    minHeight: 120,
    minHeightTablet: 100,
    minHeightMobile: 80,
    padding: 8,
    clipBends: false,
}

const DEFAULT_STROKE: StrokeConfig = {
    color: "#CCCCCC",
    width: 2,
    widthTablet: 1.5,
    widthMobile: 1.5,
    opacity: 0.9,
    blendMode: "normal",
}

const DEFAULT_PHYSICS: PhysicsControlConfig = {
    tension: 50,
    damping: 65,
    spread: 0.08,
    segmentCount: 240,
    segmentCountTablet: 180,
    segmentCountMobile: 140,
    maxDisplacement: 0.12,
    sensitivity: 1,
}

const DEFAULT_INTERACTION: InteractionConfig = {
    enabled: true,
    touchCapture: true,
    idleDampingBoost: 4.5,
    cursorType: "pointer",
    customCursor: undefined,
}

const DEFAULT_BACKGROUND: BackgroundConfig = {
    mode: "transparent",
    color: "#0E0E0E",
}

const DEFAULT_ENTRANCE: EntranceConfig = {
    mode: "fade-in",
}

const DEFAULT_ACCESSIBILITY: AccessibilityConfig = {
    ariaLabel: "Interactive kinetic line",
    decorative: true,
}

const SPRING_ENTRANCE = {
    type: "spring" as const,
    stiffness: 60,
    damping: 20,
    mass: 1,
}

export default function Kern_KineticLine(props: Partial<Props>) {
    const layout = props.layout ?? DEFAULT_LAYOUT
    const stroke = props.stroke ?? DEFAULT_STROKE
    const physics = props.physics ?? DEFAULT_PHYSICS
    const interaction = props.interaction ?? DEFAULT_INTERACTION
    const background = props.background ?? DEFAULT_BACKGROUND
    const entrance = props.entrance ?? DEFAULT_ENTRANCE
    const accessibility = props.accessibility ?? DEFAULT_ACCESSIBILITY
    const { style } = props

    const isCanvas = useIsOnFramerCanvas()
    const prefersReducedMotion = useReducedMotion() ?? false
    const containerRef = useRef<HTMLButtonElement>(null)
    const inViewRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(inViewRef, { once: true, amount: 0.2 })

    // Responsive breakpoint detection
    const [viewportWidth, setViewportWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1440
    )

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            startTransition(() => {
                setViewportWidth(window.innerWidth)
            })
        }

        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    // Apply responsive values based on viewport width
    const responsiveMinHeight = useMemo(() => {
        if (viewportWidth < 810) return layout.minHeightMobile
        if (viewportWidth < 1200) return layout.minHeightTablet
        return layout.minHeight
    }, [viewportWidth, layout.minHeight, layout.minHeightTablet, layout.minHeightMobile])

    const responsiveStrokeWidth = useMemo(() => {
        if (viewportWidth < 810) return stroke.widthMobile
        if (viewportWidth < 1200) return stroke.widthTablet
        return stroke.width
    }, [viewportWidth, stroke.width, stroke.widthTablet, stroke.widthMobile])

    const responsiveSegmentCount = useMemo(() => {
        if (viewportWidth < 810) return physics.segmentCountMobile
        if (viewportWidth < 1200) return physics.segmentCountTablet
        return physics.segmentCount
    }, [viewportWidth, physics.segmentCount, physics.segmentCountTablet, physics.segmentCountMobile])

    const clampedSegmentCount = useMemo(
        () => clampSegmentCount(responsiveSegmentCount),
        [responsiveSegmentCount]
    )

    const simulationRef = useRef<LineSimulationState>(
        createLineState(clampedSegmentCount)
    )
    const pathRef = useRef<SVGPathElement>(null)
    const pointerActiveRef = useRef(false)
    const capturedPointerIdRef = useRef<number | null>(null)
    
    const shouldEntrance =
        entrance.mode === "fade-in" &&
        !isCanvas &&
        !prefersReducedMotion &&
        isInView
    
    const [pathD, setPathD] = useState(() =>
        buildPathD(simulationRef.current, {
            orientation: layout.orientation,
            padding: layout.padding,
        })
    )
    
    const [isSimulating, setIsSimulating] = useState(false)
    const [isEntranceAnimating, setIsEntranceAnimating] = useState(shouldEntrance)

    const inactive = isCanvas || !interaction.enabled || prefersReducedMotion

    const reducedMotionScale = prefersReducedMotion ? 0.15 : 1
    const reducedMotionDampingMultiplier = prefersReducedMotion ? 8 : 1

    useLayoutEffect(() => {
        const next = createLineState(clampedSegmentCount)
        simulationRef.current = next
        const nextPath = buildPathD(next, {
            orientation: layout.orientation,
            padding: layout.padding,
        })
        setPathD(nextPath)
        pathRef.current?.setAttribute("d", nextPath)
    }, [layout.orientation, layout.padding, clampedSegmentCount])

    const syncPathFromSimulation = useCallback(() => {
        const nextPath = buildPathD(simulationRef.current, {
            orientation: layout.orientation,
            padding: layout.padding,
        })
        pathRef.current?.setAttribute("d", nextPath)
    }, [layout.orientation, layout.padding])

    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el || typeof ResizeObserver === "undefined") return undefined

        const observer = new ResizeObserver(() => {
            syncPathFromSimulation()
        })
        observer.observe(el)
        return () => {
            observer.disconnect()
        }
    }, [syncPathFromSimulation])

    const applyPointerPluck = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef.current
            if (!el || inactive) return

            const rect = el.getBoundingClientRect()
            
            // Clamp physics values from panel
            const clampedMaxDisplacement = Math.max(0.02, Math.min(0.35, physics.maxDisplacement ?? DEFAULT_PHYSICS.maxDisplacement))
            const clampedSensitivity = Math.max(0.2, Math.min(2, physics.sensitivity ?? DEFAULT_PHYSICS.sensitivity))
            
            const mapped = mapPointerToPluck(
                clientX,
                clientY,
                rect,
                layout.orientation,
                clampedSensitivity,
                clampedMaxDisplacement,
                reducedMotionScale
            )
            if (!mapped) return

            applyPluck(
                simulationRef.current,
                mapped.t,
                mapped.depth,
                physics.spread ?? DEFAULT_PHYSICS.spread,
                clampedMaxDisplacement * reducedMotionScale
            )
            syncPathFromSimulation()
        },
        [
            inactive,
            layout.orientation,
            physics.sensitivity,
            physics.maxDisplacement,
            physics.spread,
            reducedMotionScale,
            syncPathFromSimulation,
        ]
    )

    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            if (inactive) return
            // Only respond to primary pointer
            if (!event.isPrimary) return
            
            // If a pointer is captured, only respond to that specific pointer
            if (
                capturedPointerIdRef.current !== null &&
                capturedPointerIdRef.current !== event.pointerId
            ) {
                return
            }
            
            pointerActiveRef.current = true
            applyPointerPluck(event.clientX, event.clientY)
        },
        [inactive, applyPointerPluck]
    )

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            if (inactive) return
            // Only respond to primary pointer
            if (!event.isPrimary) return
            
            // Ignore if another pointer is already captured
            if (capturedPointerIdRef.current !== null) return
            
            pointerActiveRef.current = true
            capturedPointerIdRef.current = event.pointerId
            
            if (interaction.touchCapture) {
                try {
                    event.currentTarget.setPointerCapture(event.pointerId)
                } catch (e) {
                    // Silently fail if pointer capture is not supported
                }
            }
            applyPointerPluck(event.clientX, event.clientY)
        },
        [inactive, interaction.touchCapture, applyPointerPluck]
    )

    const handlePointerUp = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            // Only respond to primary pointer
            if (!event.isPrimary) return
            
            // Only process if this is the captured pointer
            if (capturedPointerIdRef.current !== event.pointerId) return
            
            pointerActiveRef.current = false
            capturedPointerIdRef.current = null
            
            if (interaction.touchCapture) {
                try {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId)
                    }
                } catch (e) {
                    // Release may fail if capture was already lost
                }
            }
        },
        [interaction.touchCapture]
    )

    const handlePointerLeave = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            // Only respond to primary pointer
            if (!event.isPrimary) return
            
            // Only process if this is the captured pointer
            if (capturedPointerIdRef.current !== event.pointerId) return
            
            // Don't reset if pointer is captured (dragging outside)
            if (interaction.touchCapture && event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
            }
            
            pointerActiveRef.current = false
            capturedPointerIdRef.current = null
        },
        [interaction.touchCapture]
    )

    const handlePointerCancel = useCallback(
        (event: ReactPointerEvent<HTMLButtonElement>) => {
            // Only respond to primary pointer
            if (!event.isPrimary) return
            
            // Only process if this is the captured pointer
            if (capturedPointerIdRef.current !== event.pointerId) return
            
            pointerActiveRef.current = false
            capturedPointerIdRef.current = null
            
            if (interaction.touchCapture) {
                try {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                        event.currentTarget.releasePointerCapture(event.pointerId)
                    }
                } catch (e) {
                    // Release may fail if capture was already lost
                }
            }
        },
        [interaction.touchCapture]
    )

    useAnimationFrame((_time, delta) => {
        if (inactive) return

        const state = simulationRef.current
        const needsSimulation =
            pointerActiveRef.current || !isSimulationSettled(state, 0.00005)
        
        if (!needsSimulation) {
            if (isSimulating) {
                startTransition(() => setIsSimulating(false))
            }
            return
        }
        
        if (!isSimulating) {
            startTransition(() => setIsSimulating(true))
        }

        const deltaSeconds = delta / 1000
        const clampedTension = Math.max(20, Math.min(400, physics.tension ?? DEFAULT_PHYSICS.tension))
        const clampedDamping = Math.max(4, Math.min(200, physics.damping ?? DEFAULT_PHYSICS.damping))
        const baseDamping = pointerActiveRef.current
            ? clampedDamping
            : clampedDamping * interaction.idleDampingBoost
        
        const damping = baseDamping * reducedMotionDampingMultiplier

        stepSimulation(state, clampedTension, damping, deltaSeconds)
        syncPathFromSimulation()
    })

    useEffect(() => {
        if (!inactive) return
        resetLineState(simulationRef.current)
        const nextPath = buildPathD(simulationRef.current, {
            orientation: layout.orientation,
            padding: layout.padding,
        })
        pathRef.current?.setAttribute("d", nextPath)
        startTransition(() => {
            setPathD(nextPath)
        })
    }, [inactive, layout.orientation, layout.padding])

    const rootBackground =
        background.mode === "solid" ? background.color : "transparent"

    const overflowStyle = layout.clipBends ? "hidden" : "visible"

    const cursorStyle = useMemo(() => {
        if (!interaction.enabled || inactive) return "default"
        
        if (interaction.cursorType === "custom" && interaction.customCursor) {
            return `url(${interaction.customCursor}), auto`
        }
        
        return interaction.cursorType
    }, [interaction.enabled, interaction.cursorType, interaction.customCursor, inactive])

    const willChangeValue = useMemo(() => {
        if (isEntranceAnimating) return "transform, opacity"
        return "auto"
    }, [isEntranceAnimating])

    // Canvas-only: render static straight line at rest
    if (isCanvas) {
        const pad = Math.min(40, Math.max(0, layout.padding))
        const staticPathD =
            layout.orientation === "horizontal"
                ? `M ${pad} 50 L ${100 - pad} 50`
                : `M 50 ${pad} L 50 ${100 - pad}`

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: responsiveMinHeight,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: rootBackground,
                    overflow: overflowStyle,
                    ...style,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        minHeight: responsiveMinHeight,
                        overflow: overflowStyle,
                    }}
                >
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            display: "block",
                            overflow: "visible",
                        }}
                        aria-hidden
                    >
                        <path
                            d={staticPathD}
                            fill="none"
                            stroke={stroke.color}
                            strokeWidth={responsiveStrokeWidth}
                            strokeOpacity={stroke.opacity}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            style={{
                                mixBlendMode: stroke.blendMode as any,
                            }}
                        />
                    </svg>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={inViewRef}
            style={{
                width: "100%",
                height: "100%",
                minHeight: responsiveMinHeight,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: rootBackground,
                overflow: overflowStyle,
                touchAction: interaction.enabled ? "none" : "auto",
                ...style,
            }}
        >
            <motion.button
                ref={containerRef}
                type="button"
                role={accessibility.decorative ? "img" : "button"}
                aria-label={
                    accessibility.decorative
                        ? accessibility.ariaLabel
                        : interaction.enabled
                        ? `${accessibility.ariaLabel} - Click or drag to interact`
                        : accessibility.ariaLabel
                }
                aria-hidden={accessibility.decorative ? true : undefined}
                disabled={!interaction.enabled}
                initial={shouldEntrance ? { opacity: 0, y: 1 } : false}
                animate={shouldEntrance ? { opacity: 1, y: 0 } : false}
                transition={shouldEntrance ? SPRING_ENTRANCE : undefined}
                onAnimationComplete={() => {
                    if (shouldEntrance) {
                        startTransition(() => setIsEntranceAnimating(false))
                    }
                }}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerLeave}
                onPointerCancel={handlePointerCancel}
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: responsiveMinHeight,
                    cursor: cursorStyle,
                    overflow: overflowStyle,
                    willChange: willChangeValue,
                    border: "none",
                    padding: 0,
                    background: "transparent",
                    display: "block",
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                        display: "block",
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                    aria-hidden
                >
                    <path
                        ref={pathRef}
                        d={pathD}
                        fill="none"
                        stroke={stroke.color}
                        strokeWidth={responsiveStrokeWidth}
                        strokeOpacity={stroke.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        style={{
                            mixBlendMode: stroke.blendMode as any,
                        }}
                    />
                </svg>
            </motion.button>
        </div>
    )
}

Kern_KineticLine.displayName = "Kern_KineticLine"

addPropertyControls(Kern_KineticLine, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Control line orientation and container spacing",
        optional: true,
        buttonTitle: "Layout",
        icon: "object",
        controls: {
            orientation: {
                type: ControlType.Enum,
                title: "Orientation",
                description: "Draw line horizontally or vertically",
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                defaultValue: "horizontal",
                displaySegmentedControl: true,
            },
            minHeight: {
                type: ControlType.Number,
                title: "Min Height",
                description: "Minimum container height in pixels (desktop 1200px+). Affects pluck amplitude: larger heights allow more visible displacement. Suggested: 80–120px for horizontal dividers on mobile, 400px+ for vertical accent lines.",
                defaultValue: 120,
                min: 40,
                max: 800,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            minHeightTablet: {
                type: ControlType.Number,
                title: "Min Height (Tablet)",
                description: "Minimum container height for tablet (810–1200px)",
                defaultValue: 100,
                min: 44,
                max: 800,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            minHeightMobile: {
                type: ControlType.Number,
                title: "Min Height (Mobile)",
                description: "Minimum container height for mobile (<810px). Minimum 44px for touch target accessibility (WCAG).",
                defaultValue: 80,
                min: 44,
                max: 800,
                step: 4,
                displayStepper: true,
                unit: "px",
            },
            padding: {
                type: ControlType.Number,
                title: "Line Padding",
                description: "Space between line endpoints and container edges",
                defaultValue: 8,
                min: 0,
                max: 40,
                step: 1,
                displayStepper: true,
            },
            clipBends: {
                type: ControlType.Boolean,
                title: "Clip Bends",
                description: "When off, line bends can extend beyond container edges (overflow: visible). When on, bends are clipped at container boundaries (overflow: hidden).",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: DEFAULT_LAYOUT,
    },
    stroke: {
        type: ControlType.Object,
        title: "Stroke",
        description: "Adjust line appearance and weight",
        optional: true,
        buttonTitle: "Stroke",
        icon: "object",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Line color",
                defaultValue: "#CCCCCC",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                description: "Line thickness in pixels (desktop 1200px+)",
                defaultValue: 2,
                min: 0.5,
                max: 8,
                step: 0.5,
                displayStepper: true,
                unit: "px",
            },
            widthTablet: {
                type: ControlType.Number,
                title: "Width (Tablet)",
                description: "Line thickness for tablet (810–1200px)",
                defaultValue: 1.5,
                min: 0.5,
                max: 8,
                step: 0.5,
                displayStepper: true,
                unit: "px",
            },
            widthMobile: {
                type: ControlType.Number,
                title: "Width (Mobile)",
                description: "Line thickness for mobile (<810px)",
                defaultValue: 1.5,
                min: 0.5,
                max: 8,
                step: 0.5,
                displayStepper: true,
                unit: "px",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                description: "Line transparency (0 = invisible, 1 = solid)",
                defaultValue: 0.9,
                min: 0.1,
                max: 1,
                step: 0.05,
            },
            blendMode: {
                type: ControlType.Enum,
                title: "Blend Mode",
                description: "How the line blends with content behind it",
                options: [
                    "normal",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "color-burn",
                    "hard-light",
                    "soft-light",
                    "difference",
                    "exclusion",
                ],
                optionTitles: [
                    "Normal",
                    "Multiply",
                    "Screen",
                    "Overlay",
                    "Darken",
                    "Lighten",
                    "Color Dodge",
                    "Color Burn",
                    "Hard Light",
                    "Soft Light",
                    "Difference",
                    "Exclusion",
                ],
                defaultValue: "normal",
            },
        },
        defaultValue: DEFAULT_STROKE,
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        description: "Configure pluck response and spring simulation",
        optional: true,
        buttonTitle: "Physics",
        icon: "object",
        controls: {
            maxDisplacement: {
                type: ControlType.Number,
                title: "Bend Amount",
                description: "Maximum bend distance from rest position. Higher values allow more dramatic plucks.",
                defaultValue: 0.12,
                min: 0.02,
                max: 0.35,
                step: 0.01,
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Pluck Intensity",
                description: "Pointer depth multiplier. Higher values create stronger bends from the same pointer movement.",
                defaultValue: 1,
                min: 0.2,
                max: 2,
                step: 0.05,
            },
            tension: {
                type: ControlType.Number,
                title: "Tension",
                description: "Spring stiffness. Higher values make the line snap back to rest faster.",
                defaultValue: 50,
                min: 20,
                max: 400,
                step: 5,
                displayStepper: true,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                description: "Oscillation decay rate. Higher values reduce bounce and settle the line faster.",
                defaultValue: 65,
                min: 4,
                max: 200,
                step: 1,
                displayStepper: true,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                description: "How far pluck influence travels along the line. Lower values create tighter, more localized bends.",
                defaultValue: 0.08,
                min: 0.02,
                max: 0.3,
                step: 0.01,
            },
            segmentCount: {
                type: ControlType.Number,
                title: "Segments",
                description: "Simulation resolution (desktop 1200px+). Higher values create smoother curves but increase performance cost.",
                defaultValue: 240,
                min: 12,
                max: 320,
                step: 2,
                displayStepper: true,
            },
            segmentCountTablet: {
                type: ControlType.Number,
                title: "Segments (Tablet)",
                description: "Simulation resolution for tablet (810–1200px)",
                defaultValue: 180,
                min: 12,
                max: 320,
                step: 2,
                displayStepper: true,
            },
            segmentCountMobile: {
                type: ControlType.Number,
                title: "Segments (Mobile)",
                description: "Simulation resolution for mobile (<810px). Lower values improve performance on mobile devices.",
                defaultValue: 140,
                min: 12,
                max: 320,
                step: 2,
                displayStepper: true,
            },
        },
        defaultValue: DEFAULT_PHYSICS,
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description: "Control pointer and touch behavior",
        optional: true,
        buttonTitle: "Interaction",
        icon: "interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                description: "Allow users to pluck the line with pointer or touch",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            touchCapture: {
                type: ControlType.Boolean,
                title: "Touch Capture",
                description: "Keep pluck active while dragging on touch devices",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            idleDampingBoost: {
                type: ControlType.Number,
                title: "Idle Damping",
                description: "Extra damping after pointer leaves—higher settles faster",
                defaultValue: 4.5,
                min: 1,
                max: 10,
                step: 0.1,
            },
            cursorType: {
                type: ControlType.Enum,
                title: "Cursor Type",
                description: "Choose cursor style when hovering over the line",
                options: ["pointer", "crosshair", "grab", "move", "custom"],
                optionTitles: ["Pointer", "Crosshair", "Grab", "Move", "Custom"],
                defaultValue: "pointer",
            },
            customCursor: {
                type: ControlType.String,
                title: "Custom Cursor URL",
                description: "URL to custom cursor image (e.g., .cur, .png). Only used when Cursor Type is Custom.",
                placeholder: "https://example.com/cursor.png",
                hidden: (props) => props.interaction?.cursorType !== "custom",
            },
        },
        defaultValue: DEFAULT_INTERACTION,
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        description: "Set container background style",
        optional: true,
        buttonTitle: "Background",
        icon: "color",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                description: "Use transparent or solid background fill",
                options: ["transparent", "solid"],
                optionTitles: ["Transparent", "Solid"],
                defaultValue: "transparent",
                displaySegmentedControl: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Background fill color when mode is solid",
                defaultValue: "#0E0E0E",
                hidden: (props) => props.background?.mode !== "solid",
            },
        },
        defaultValue: DEFAULT_BACKGROUND,
    },
    entrance: {
        type: ControlType.Object,
        title: "Entrance",
        description: "Configure viewport entrance animation",
        optional: true,
        buttonTitle: "Entrance",
        icon: "effect",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                description: "Fade in when component enters viewport",
                options: ["none", "fade-in"],
                optionTitles: ["None", "Fade In"],
                defaultValue: "fade-in",
                displaySegmentedControl: true,
            },
        },
        defaultValue: DEFAULT_ENTRANCE,
    },
    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        description: "Configure screen reader and assistive technology behavior",
        optional: true,
        buttonTitle: "Accessibility",
        icon: "object",
        controls: {
            decorative: {
                type: ControlType.Boolean,
                title: "Decorative",
                description: "Hide from screen readers when purely visual",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            ariaLabel: {
                type: ControlType.String,
                title: "ARIA Label",
                description: "Accessible name announced by screen readers",
                defaultValue: "Interactive kinetic line",
            },
        },
        defaultValue: DEFAULT_ACCESSIBILITY,
    },
})
