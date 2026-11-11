// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 800
// @framerIntrinsicHeight: 600

/**
 * Kern_KineticLinesGrid
 *
 * Vertical kinetic divider columns with guitar-string pluck physics.
 * One simulation loop, responsive column count, gap, padding, and margins.
 *
 * @version 1.4.1
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

// ─── Physics (inlined — single-file Marketplace delivery) ─────────────────

const SEGMENT_MIN = 12
const SEGMENT_MAX = 64
const MAX_COLUMNS = 24

interface PhysicsConfig {
    bendAmount: number
    pluckIntensity: number
    pointerReach: number
    tension: number
    damping: number
    spread: number
    sensitivity: number
    segmentCount: number
}

interface LineSimulationState {
    segmentCount: number
    displacement: Float32Array
    velocity: Float32Array
}

function clampSegmentCount(value: number): number {
    return Math.max(SEGMENT_MIN, Math.min(SEGMENT_MAX, Math.round(value)))
}

function createLineState(segmentCount: number): LineSimulationState {
    const count = clampSegmentCount(segmentCount)
    return {
        segmentCount: count,
        displacement: new Float32Array(count),
        velocity: new Float32Array(count),
    }
}

function applyPluck(
    state: LineSimulationState,
    t: number,
    impulse: number,
    spread: number
): void {
    const n = state.segmentCount
    const center = Math.max(0, Math.min(1, t)) * (n - 1)
    const sigma = Math.max(0.65, spread * n * 0.42)
    for (let i = 0; i < n; i++) {
        const dist = i - center
        const kernel = Math.exp(-(dist * dist) / (2 * sigma * sigma))
        state.velocity[i] += impulse * kernel
    }
}

/**
 * Semi-implicit Euler with fixed substeps + soft bend limit (no hard wall).
 * Softer segment coupling → longer, fluid string travel.
 */
function stepSimulation(
    state: LineSimulationState,
    config: PhysicsConfig,
    deltaMs: number
): void {
    const totalDt = Math.min(0.032, Math.max(0, deltaMs / 1000))
    if (totalDt <= 0) return

    const steps = totalDt > 0.018 ? 3 : 2
    const dt = totalDt / steps
    const n = state.segmentCount
    const stiffness = config.tension
    const damping = config.damping
    const coupling = stiffness * 0.26
    const cap = Math.max(0.002, config.bendAmount * 0.01)
    const softK = stiffness * 2.4

    for (let step = 0; step < steps; step++) {
        for (let i = 0; i < n; i++) {
            const left = i > 0 ? state.displacement[i - 1] : 0
            const right = i < n - 1 ? state.displacement[i + 1] : 0
            const neighborPull =
                (left + right - 2 * state.displacement[i]) * coupling
            const spring = -stiffness * state.displacement[i]
            const damp = -damping * state.velocity[i]
            let soft = 0
            const d = state.displacement[i]
            const over = Math.abs(d) - cap
            if (over > 0) {
                soft = -Math.sign(d) * over * softK
            }
            state.velocity[i] += (neighborPull + spring + damp + soft) * dt
        }

        for (let i = 0; i < n; i++) {
            state.displacement[i] += state.velocity[i] * dt
        }
    }
}

/** Smooth vertical path — midpoint quadratics (no jagged L segments). */
function buildVerticalPathD(
    state: LineSimulationState,
    padding: number
): string {
    const n = state.segmentCount
    const pad = Math.min(40, Math.max(0, padding))
    const y0 = pad
    const y1 = 100 - pad
    const baseline = 50

    if (n < 2) {
        return `M ${baseline} ${y0} L ${baseline} ${y1}`
    }

    const xs = new Float32Array(n)
    const ys = new Float32Array(n)
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1)
        ys[i] = y0 + t * (y1 - y0)
        xs[i] = baseline + state.displacement[i] * 100
    }

    if (n === 2) {
        return `M ${xs[0]} ${ys[0]} L ${xs[1]} ${ys[1]}`
    }

    let d = `M ${xs[0]} ${ys[0]}`
    for (let i = 1; i < n - 1; i++) {
        const midX = (xs[i] + xs[i + 1]) / 2
        const midY = (ys[i] + ys[i + 1]) / 2
        d += ` Q ${xs[i]} ${ys[i]} ${midX} ${midY}`
    }
    d += ` L ${xs[n - 1]} ${ys[n - 1]}`
    return d
}

function buildStaticVerticalPath(padding: number): string {
    const pad = Math.min(40, Math.max(0, padding))
    return `M 50 ${pad} L 50 ${100 - pad}`
}

// ─── Layout / config types ─────────────────────────────────────────────────

interface LayoutConfig {
    columns: number
    columnsTablet: number
    columnsMobile: number
    paddingLeft: number
    paddingRight: number
    minHeight: number
    linePadding: number
    clipBends: boolean
}

interface ResponsiveConfig {
    breakpointTablet: number
    breakpointMobile: number
}

interface StrokeConfig {
    color: string
    width: number
    opacity: number
}

interface InteractionConfig {
    enabled: boolean
    touchCapture: boolean
    neighborBleed: number
    performanceMode: boolean
}

interface BackgroundConfig {
    mode: "solid" | "transparent" | "gradient"
    solidColor: string
    gradientStart?: string
    gradientEnd?: string
    gradientAngle?: number
}

interface EntranceConfig {
    enabled: boolean
    staggerDelay: number
}

interface Props {
    layout?: LayoutConfig
    /** @deprecated Hardcoded 810/390 — still read for legacy instances */
    responsive?: ResponsiveConfig
    stroke?: StrokeConfig
    physics?: Partial<PhysicsConfig>
    interaction?: Partial<InteractionConfig>
    background?: BackgroundConfig
    entrance?: EntranceConfig
    ariaLabel: string
    style?: CSSProperties
}

const DEFAULT_PHYSICS: PhysicsConfig = {
    bendAmount: 10,
    pluckIntensity: 0.42,
    pointerReach: 1.05,
    tension: 48,
    damping: 15,
    spread: 0.14,
    sensitivity: 1,
    segmentCount: 36,
}

const DEFAULT_RESPONSIVE: ResponsiveConfig = {
    breakpointTablet: 810,
    breakpointMobile: 390,
}

const DEFAULT_STROKE: StrokeConfig = {
    color: "#999999",
    width: 1.5,
    opacity: 1,
}

const DEFAULT_INTERACTION: InteractionConfig = {
    enabled: true,
    touchCapture: true,
    neighborBleed: 0.35,
    performanceMode: false,
}

const DEFAULT_BACKGROUND: BackgroundConfig = {
    mode: "transparent",
    solidColor: "#0E0E0E",
}

const DEFAULT_ENTRANCE: EntranceConfig = {
    enabled: true,
    staggerDelay: 0.04,
}

const DEFAULT_ARIA_LABEL =
    "Interactive kinetic line grid. Press Enter or Space to pluck the center line."

const ENTRANCE_SPRING = {
    type: "spring" as const,
    duration: 0.55,
    bounce: 0.12,
}

/** Opacity bridge when responsive column count changes — ease-out, under 300ms. */
const COLUMN_BRIDGE = {
    from: 0.88,
    duration: 0.15,
    ease: [0.23, 1, 0.32, 1] as [number, number, number, number],
}

function resolvePhysics(
    custom: Partial<PhysicsConfig> | undefined
): PhysicsConfig {
    return {
        bendAmount: custom?.bendAmount ?? DEFAULT_PHYSICS.bendAmount,
        pluckIntensity:
            custom?.pluckIntensity ?? DEFAULT_PHYSICS.pluckIntensity,
        pointerReach: custom?.pointerReach ?? DEFAULT_PHYSICS.pointerReach,
        tension: custom?.tension ?? DEFAULT_PHYSICS.tension,
        damping: custom?.damping ?? DEFAULT_PHYSICS.damping,
        spread: custom?.spread ?? DEFAULT_PHYSICS.spread,
        sensitivity: custom?.sensitivity ?? DEFAULT_PHYSICS.sensitivity,
        segmentCount: clampSegmentCount(
            custom?.segmentCount ?? DEFAULT_PHYSICS.segmentCount
        ),
    }
}

function resolveLayout(
    partial: Partial<LayoutConfig> | undefined
): LayoutConfig {
    const base = partial ?? {}
    return {
        columns: base.columns ?? 6,
        columnsTablet: base.columnsTablet ?? 4,
        columnsMobile: base.columnsMobile ?? 3,
        paddingLeft: base.paddingLeft ?? 0,
        paddingRight: base.paddingRight ?? 0,
        minHeight: base.minHeight ?? 480,
        linePadding: base.linePadding ?? 0,
        clipBends: base.clipBends ?? false,
    }
}

function resolveStroke(
    partial: Partial<StrokeConfig> | undefined
): StrokeConfig {
    return {
        color: partial?.color ?? DEFAULT_STROKE.color,
        width: partial?.width ?? DEFAULT_STROKE.width,
        opacity: partial?.opacity ?? DEFAULT_STROKE.opacity,
    }
}

function resolveInteraction(
    partial: Partial<InteractionConfig> | undefined
): InteractionConfig {
    return {
        enabled: partial?.enabled ?? DEFAULT_INTERACTION.enabled,
        touchCapture: true,
        neighborBleed:
            partial?.neighborBleed ?? DEFAULT_INTERACTION.neighborBleed,
        performanceMode:
            partial?.performanceMode ?? DEFAULT_INTERACTION.performanceMode,
    }
}

function backgroundStyle(bg: BackgroundConfig): string | undefined {
    if (bg.mode === "transparent") return undefined
    if (bg.mode === "solid") return bg.solidColor
    // Legacy gradient instances
    const start = bg.gradientStart ?? "#121212"
    const end = bg.gradientEnd ?? "#1A1A1A"
    const angle = bg.gradientAngle ?? 135
    return `linear-gradient(${angle}deg, ${start}, ${end})`
}

interface ColumnMetrics {
    columnCount: number
    slotWidth: number
    contentLeft: number
    contentTop: number
    contentWidth: number
    contentHeight: number
}

function computeColumnMetrics(
    containerNode: HTMLDivElement | null,
    columnCount: number,
    layout: LayoutConfig
): ColumnMetrics {
    if (!containerNode) {
        return {
            columnCount,
            slotWidth: 0,
            contentLeft: 0,
            contentTop: 0,
            contentWidth: 100,
            contentHeight: 100,
        }
    }

    const rect = containerNode.getBoundingClientRect()
    const fullWidth = Math.max(1, rect.width)
    const contentWidth = Math.max(
        1,
        fullWidth - layout.paddingLeft - layout.paddingRight
    )
    const contentHeight = Math.max(1, rect.height)

    return {
        columnCount,
        slotWidth: contentWidth / Math.max(1, columnCount - 1),
        contentLeft: layout.paddingLeft,
        contentTop: 0,
        contentWidth,
        contentHeight,
    }
}

function columnIndexFromX(x: number, metrics: ColumnMetrics): number {
    const { columnCount, contentLeft, contentWidth } = metrics
    if (columnCount <= 1) return 0

    const relativeX = x - contentLeft
    if (relativeX <= 0) return 0
    if (relativeX >= contentWidth) return columnCount - 1

    // Find closest column based on even distribution
    const spacing = contentWidth / (columnCount - 1)
    const index = Math.round(relativeX / spacing)
    
    return Math.max(0, Math.min(columnCount - 1, index))
}

function columnCenterX(index: number, metrics: ColumnMetrics): number {
    const { columnCount, contentWidth, contentLeft } = metrics
    
    if (columnCount === 1) {
        return contentLeft + contentWidth / 2
    }
    
    // Distribute evenly from left to right edge
    const spacing = contentWidth / (columnCount - 1)
    return contentLeft + index * spacing
}



// ─── Component ─────────────────────────────────────────────────────────────

export default function Kern_KineticLinesGrid(props: Partial<Props>) {
    const {
        layout: layoutInput,
        responsive = DEFAULT_RESPONSIVE,
        stroke: strokeInput,
        physics: physicsInput,
        interaction: interactionInput,
        background = DEFAULT_BACKGROUND,
        entrance = DEFAULT_ENTRANCE,
        ariaLabel = DEFAULT_ARIA_LABEL,
        style,
    } = props

    const layout = useMemo(() => resolveLayout(layoutInput), [layoutInput])
    const stroke = useMemo(() => resolveStroke(strokeInput), [strokeInput])
    const interaction = useMemo(
        () => resolveInteraction(interactionInput),
        [interactionInput]
    )

    const resolvedPhysics = useMemo(() => {
        const base = resolvePhysics(physicsInput)
        if (interaction.performanceMode) {
            return {
                ...base,
                segmentCount: Math.min(base.segmentCount, 16),
            }
        }
        return base
    }, [physicsInput, interaction.performanceMode])

    const containerRef = useRef<HTMLDivElement>(null)
    const pathRefs = useRef<(SVGPathElement | null)[]>([])
    const simulationsRef = useRef<LineSimulationState[]>([])
    const metricsRef = useRef<ColumnMetrics | null>(null)
    const pointerActiveRef = useRef(false)
    const lastFrameRef = useRef(0)
    const pointerSmoothRef = useRef({
        x: 0,
        y: 0,
        lastX: 0,
        lastY: 0,
        lastT: 0,
        primed: false,
    })

    const [windowWidth, setWindowWidth] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth : 1440
    )

    const isStatic = useIsStaticRenderer()
    const isCanvas = useIsOnFramerCanvas() || isStatic
    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const prefersReduced = useReducedMotion()
    const isInView = useInView(containerRef, { once: false, amount: 0.15 })
    const entranceSeenRef = useRef(false)
    const [entranceReady, setEntranceReady] = useState(false)
    const columnsBridgeSeenRef = useRef(false)
    const [columnsOpacity, setColumnsOpacity] = useState(1)

    const { activeColumns } = useMemo(() => {
        const isMobile = windowWidth <= responsive.breakpointMobile
        const isTablet = !isMobile && windowWidth <= responsive.breakpointTablet

        return {
            activeColumns: Math.min(
                MAX_COLUMNS,
                Math.max(
                    1,
                    isMobile
                        ? layout.columnsMobile
                        : isTablet
                          ? layout.columnsTablet
                          : layout.columns
                )
            ),
        }
    }, [windowWidth, layout, responsive])

    const columnIndices = useMemo(
        () => Array.from({ length: activeColumns }, (_, i) => i),
        [activeColumns]
    )

    const rootBackground = backgroundStyle(background)
    const shouldSimulate =
        interaction.enabled && !isCanvas && !isThumbnail && !prefersReduced && isInView

    const canEntrance =
        entrance.enabled && !isCanvas && !isThumbnail && !prefersReduced

    const canColumnBridge = !isCanvas && !isThumbnail && !prefersReduced

    useEffect(() => {
        if (!canEntrance || entranceSeenRef.current || !isInView) return
        entranceSeenRef.current = true
        startTransition(() => setEntranceReady(true))
    }, [canEntrance, isInView])

    // Soft opacity bridge when column count changes (breakpoint) — no entrance replay.
    useEffect(() => {
        if (!columnsBridgeSeenRef.current) {
            columnsBridgeSeenRef.current = true
            return
        }
        if (!canColumnBridge) return
        startTransition(() => setColumnsOpacity(COLUMN_BRIDGE.from))
        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                startTransition(() => setColumnsOpacity(1))
            })
        })
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
        }
    }, [activeColumns, canColumnBridge])

    useEffect(() => {
        if (isInView) return
        lastFrameRef.current = 0
        pointerActiveRef.current = false
        pointerSmoothRef.current.primed = false
    }, [isInView])

    const syncSimulations = useCallback(() => {
        const count = activeColumns
        const seg = resolvedPhysics.segmentCount
        const current = simulationsRef.current

        if (current.length === count) {
            for (const sim of current) {
                if (sim.segmentCount !== seg) {
                    simulationsRef.current = columnIndices.map(() =>
                        createLineState(seg)
                    )
                    return
                }
            }
            return
        }

        simulationsRef.current = columnIndices.map(() => createLineState(seg))
    }, [activeColumns, columnIndices, resolvedPhysics.segmentCount])

    const updatePaths = useCallback(() => {
        const sims = simulationsRef.current
        const paths = pathRefs.current
        const pad = layout.linePadding
        const useStatic = isCanvas || isThumbnail || !shouldSimulate

        for (let i = 0; i < sims.length; i++) {
            const path = paths[i]
            if (!path) continue
            path.setAttribute(
                "d",
                useStatic
                    ? buildStaticVerticalPath(pad)
                    : buildVerticalPathD(sims[i], pad)
            )
        }
    }, [isCanvas, isThumbnail, layout.linePadding, shouldSimulate])

    useLayoutEffect(() => {
        syncSimulations()
    }, [syncSimulations])

    useEffect(() => {
        if (typeof window === "undefined") return

        const onResize = () => {
            startTransition(() => {
                setWindowWidth(globalThis.innerWidth)
            })
        }

        onResize()
        globalThis.addEventListener("resize", onResize)
        return () => globalThis.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(() => {
            startTransition(() => {
                metricsRef.current = computeColumnMetrics(
                    containerRef.current,
                    activeColumns,
                    layout
                )
            })
        })

        observer.observe(node)
        metricsRef.current = computeColumnMetrics(
            node,
            activeColumns,
            layout
        )
        return () => observer.disconnect()
    }, [activeColumns, layout])

    useLayoutEffect(() => {
        updatePaths()
    }, [updatePaths, activeColumns])

    useAnimationFrame((time) => {
        if (!shouldSimulate) return

        // Check if any simulation has significant motion
        const sims = simulationsRef.current
        let hasMotion = pointerActiveRef.current
        
        if (!hasMotion) {
            const threshold = 0.001
            for (const sim of sims) {
                for (let i = 0; i < sim.segmentCount; i++) {
                    if (Math.abs(sim.displacement[i]) > threshold || Math.abs(sim.velocity[i]) > threshold) {
                        hasMotion = true
                        break
                    }
                }
                if (hasMotion) break
            }
        }

        // Skip simulation if nothing is moving
        if (!hasMotion && lastFrameRef.current !== 0) return

        const delta =
            lastFrameRef.current === 0 ? 16 : time - lastFrameRef.current
        lastFrameRef.current = time

        for (const sim of sims) {
            stepSimulation(sim, resolvedPhysics, delta)
        }

        updatePaths()
    })



    const applyPointerPluck = useCallback(
        (clientX: number, clientY: number) => {
            const node = containerRef.current
            const metrics = metricsRef.current
            if (!node || !metrics || !interaction.enabled) return

            const now =
                typeof performance !== "undefined" ? performance.now() : 0
            const smooth = pointerSmoothRef.current
            const SMOOTH = 0.32

            if (!smooth.primed) {
                smooth.x = clientX
                smooth.y = clientY
                smooth.lastX = clientX
                smooth.lastY = clientY
                smooth.lastT = now
                smooth.primed = true
            } else {
                smooth.x += (clientX - smooth.x) * SMOOTH
                smooth.y += (clientY - smooth.y) * SMOOTH
            }

            const dtMs = Math.max(
                8,
                Math.min(32, smooth.lastT ? now - smooth.lastT : 16)
            )
            const dx = smooth.x - smooth.lastX
            smooth.lastX = smooth.x
            smooth.lastY = smooth.y
            smooth.lastT = now

            const rect = node.getBoundingClientRect()
            const localX = smooth.x - rect.left
            const localY = smooth.y - rect.top

            const col = columnIndexFromX(localX, metrics)
            const t =
                (localY - metrics.contentTop) /
                Math.max(1, metrics.contentHeight)
            const clampedT = Math.max(0, Math.min(1, t))

            const centerX = columnCenterX(col, metrics)
            const localRelativeX = localX - metrics.contentLeft
            const columnWidth =
                metrics.columnCount > 1
                    ? metrics.contentWidth / (metrics.columnCount - 1)
                    : metrics.contentWidth
            const halfSlot = Math.max(1, columnWidth / 2)
            const offsetNorm =
                (localRelativeX - (centerX - metrics.contentLeft)) / halfSlot
            const depth =
                offsetNorm *
                resolvedPhysics.sensitivity *
                resolvedPhysics.pluckIntensity *
                resolvedPhysics.pointerReach

            // Velocity-led impulse + soft hold (avoids per-frame energy stacking)
            const frameScale = dtMs / 16.67
            const lateralVel = dx / halfSlot
            const velImpulse =
                lateralVel *
                resolvedPhysics.pluckIntensity *
                resolvedPhysics.bendAmount *
                0.38 *
                frameScale
            const holdImpulse = depth * resolvedPhysics.bendAmount * 0.01
            const impulse = velImpulse + holdImpulse
            const spread = resolvedPhysics.spread

            const sims = simulationsRef.current
            if (col >= 0 && col < sims.length) {
                applyPluck(sims[col], clampedT, impulse, spread)
                pointerActiveRef.current = true
            }

            const bleed = interaction.performanceMode
                ? 0
                : interaction.neighborBleed
            if (bleed > 0) {
                const neighborImpulse = impulse * bleed * 0.85
                if (col > 0) {
                    applyPluck(
                        sims[col - 1],
                        clampedT,
                        neighborImpulse,
                        spread
                    )
                }
                if (col < sims.length - 1) {
                    applyPluck(
                        sims[col + 1],
                        clampedT,
                        neighborImpulse,
                        spread
                    )
                }
            }
        },
        [interaction, resolvedPhysics]
    )

    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!shouldSimulate) return
            applyPointerPluck(event.clientX, event.clientY)
        },
        [applyPointerPluck, shouldSimulate]
    )

    const handlePointerLeave = useCallback(() => {
        pointerActiveRef.current = false
        pointerSmoothRef.current.primed = false
    }, [])

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (!shouldSimulate) return
            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
                // capture may fail on some browsers — safe to ignore
            }
            applyPointerPluck(event.clientX, event.clientY)
        },
        [applyPointerPluck, shouldSimulate]
    )

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!shouldSimulate || !interaction.enabled) return
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                const centerCol = Math.floor(activeColumns / 2)
                const midT = 0.5
                const impulse =
                    resolvedPhysics.pluckIntensity *
                    resolvedPhysics.bendAmount *
                    0.045
                const sims = simulationsRef.current
                if (centerCol >= 0 && centerCol < sims.length) {
                    applyPluck(
                        sims[centerCol],
                        midT,
                        impulse,
                        resolvedPhysics.spread
                    )
                    pointerActiveRef.current = true
                }
            }
        },
        [
            shouldSimulate,
            interaction.enabled,
            activeColumns,
            resolvedPhysics,
        ]
    )

    const showFocusRing = interaction.enabled && !isCanvas
    const focusRingColor = stroke.color || "#999999"

    const rootStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 0,
        maxWidth: "none",
        alignSelf: "stretch",
        boxSizing: "border-box",
        padding: 0,
        minHeight: `clamp(320px, 40vh, ${layout.minHeight}px)`,
        background: rootBackground,
        overflowX: "hidden",
        overflowY: layout.clipBends ? "hidden" : "visible",
        position: "relative",
        outline: "none",
        ...style,
    }

    const columnsStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        paddingRight: layout.paddingRight,
        paddingLeft: layout.paddingLeft,
        margin: 0,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        boxSizing: "border-box",
        touchAction: interaction.enabled ? "none" : "auto",
        position: "relative",
    }

    const columnStyle: CSSProperties = {
        position: "relative",
        width: 0,
        height: "100%",
        flex: "0 0 auto",
        overflow: "visible",
        padding: 0,
        margin: 0,
        pointerEvents: "none",
    }

    const staticPathD = buildStaticVerticalPath(layout.linePadding)

    // Marketplace static renderer: plain DOM only (no motion / animation frame).
    if (isStatic) {
        return (
            <div
                data-static="true"
                data-kern-kinetic-grid
                data-framer-name="Kinetic Grid"
                role="group"
                aria-label={ariaLabel}
                style={rootStyle}
            >
                <div style={columnsStyle}>
                    {columnIndices.map((index) => (
                        <div key={`kinetic-col-${index}`} style={columnStyle}>
                            <svg
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: 100,
                                    height: "100%",
                                    transform: "translateX(-50%)",
                                    overflow: "visible",
                                    display: "block",
                                }}
                            >
                                <path
                                    d={staticPathD}
                                    fill="none"
                                    stroke={stroke.color}
                                    strokeWidth={stroke.width}
                                    strokeOpacity={stroke.opacity}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <motion.div
            data-kern-kinetic-grid
            role="group"
            aria-label={ariaLabel}
            tabIndex={showFocusRing ? 0 : undefined}
            onKeyDown={handleKeyDown}
            style={rootStyle}
        >
            {showFocusRing ? (
                <style>{`
                    [data-kern-kinetic-grid]:focus-visible {
                        outline: 2px solid ${focusRingColor};
                        outline-offset: 4px;
                    }
                `}</style>
            ) : null}
            <motion.div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                animate={{ opacity: columnsOpacity }}
                transition={{
                    duration: COLUMN_BRIDGE.duration,
                    ease: COLUMN_BRIDGE.ease,
                }}
                style={columnsStyle}
            >
                {columnIndices.map((index) => (
                    <motion.div
                        key={`kinetic-col-${index}`}
                        initial={
                            canEntrance && !entranceReady
                                ? { opacity: 0, y: 6, scale: 0.98 }
                                : false
                        }
                        animate={
                            !canEntrance
                                ? false
                                : entranceReady
                                  ? { opacity: 1, y: 0, scale: 1 }
                                  : { opacity: 0, y: 6, scale: 0.98 }
                        }
                        transition={{
                            delay:
                                canEntrance && entranceReady
                                    ? index * entrance.staggerDelay
                                    : 0,
                            ...ENTRANCE_SPRING,
                        }}
                        style={columnStyle}
                    >
                        <svg
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            aria-hidden
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: 100,
                                height: "100%",
                                transform: "translateX(-50%)",
                                overflow: "visible",
                                display: "block",
                            }}
                        >
                            <path
                                ref={(el) => {
                                    pathRefs.current[index] = el
                                }}
                                d={
                                    isCanvas || isThumbnail
                                        ? buildStaticVerticalPath(layout.linePadding)
                                        : buildVerticalPathD(
                                              simulationsRef.current[index] || createLineState(resolvedPhysics.segmentCount),
                                              layout.linePadding
                                          )
                                }
                                fill="none"
                                stroke={stroke.color}
                                strokeWidth={stroke.width}
                                strokeOpacity={stroke.opacity}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    )
}

// ─── Property controls ─────────────────────────────────────────────────────

addPropertyControls(Kern_KineticLinesGrid, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 6,
                min: 1,
                max: MAX_COLUMNS,
                step: 1,
                displayStepper: true,
            },
            columnsTablet: {
                type: ControlType.Number,
                title: "Tablet",
                defaultValue: 4,
                min: 1,
                max: 16,
                step: 1,
                displayStepper: true,
            },
            columnsMobile: {
                type: ControlType.Number,
                title: "Mobile",
                defaultValue: 3,
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
            },
            paddingLeft: {
                type: ControlType.Number,
                title: "Inset L",
                defaultValue: 0,
                min: 0,
                max: 200,
                step: 4,
                unit: "px",
            },
            paddingRight: {
                type: ControlType.Number,
                title: "Inset R",
                defaultValue: 0,
                min: 0,
                max: 200,
                step: 4,
                unit: "px",
            },
            minHeight: {
                type: ControlType.Number,
                title: "Min Height",
                defaultValue: 480,
                min: 120,
                max: 1200,
                step: 20,
                unit: "px",
            },
            linePadding: {
                type: ControlType.Number,
                title: "Line Pad",
                defaultValue: 0,
                min: 0,
                max: 40,
                step: 1,
                unit: "%",
            },
            clipBends: {
                type: ControlType.Boolean,
                title: "Clip Bends",
                defaultValue: false,
            },
        },
        defaultValue: {
            columns: 6,
            columnsTablet: 4,
            columnsMobile: 3,
            paddingLeft: 0,
            paddingRight: 0,
            minHeight: 480,
            linePadding: 0,
            clipBends: false,
        },
    },
    stroke: {
        type: ControlType.Object,
        title: "Stroke",
        icon: "effect",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#999999",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: DEFAULT_STROKE.width,
                min: 0.5,
                max: 8,
                step: 0.5,
                unit: "px",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: DEFAULT_STROKE.opacity,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
        defaultValue: {
            color: DEFAULT_STROKE.color,
            width: DEFAULT_STROKE.width,
            opacity: DEFAULT_STROKE.opacity,
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Feel",
        icon: "interaction",
        controls: {
            bendAmount: {
                type: ControlType.Number,
                title: "Bend",
                defaultValue: DEFAULT_PHYSICS.bendAmount,
                min: 1,
                max: 20,
                step: 0.5,
            },
            pluckIntensity: {
                type: ControlType.Number,
                title: "Pluck",
                defaultValue: DEFAULT_PHYSICS.pluckIntensity,
                min: 0.1,
                max: 2,
                step: 0.05,
            },
            tension: {
                type: ControlType.Number,
                title: "Tension",
                defaultValue: DEFAULT_PHYSICS.tension,
                min: 40,
                max: 320,
                step: 5,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: DEFAULT_PHYSICS.damping,
                min: 4,
                max: 40,
                step: 1,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: DEFAULT_PHYSICS.spread,
                min: 0.02,
                max: 0.25,
                step: 0.01,
            },
        },
        defaultValue: {
            bendAmount: DEFAULT_PHYSICS.bendAmount,
            pluckIntensity: DEFAULT_PHYSICS.pluckIntensity,
            tension: DEFAULT_PHYSICS.tension,
            damping: DEFAULT_PHYSICS.damping,
            spread: DEFAULT_PHYSICS.spread,
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            neighborBleed: {
                type: ControlType.Number,
                title: "Bleed",
                defaultValue: DEFAULT_INTERACTION.neighborBleed,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: { performanceMode: boolean }) => p.performanceMode,
            },
            performanceMode: {
                type: ControlType.Boolean,
                title: "Perf Mode",
                defaultValue: false,
            },
        },
        defaultValue: {
            enabled: true,
            neighborBleed: 0.35,
            performanceMode: false,
        },
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        icon: "color",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["transparent", "solid"],
                optionTitles: ["None", "Solid"],
                defaultValue: "transparent",
                displaySegmentedControl: true,
            },
            solidColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: DEFAULT_BACKGROUND.solidColor,
                hidden: (p: { mode: string }) => p.mode !== "solid",
            },
        },
        defaultValue: DEFAULT_BACKGROUND,
    },
    entrance: {
        type: ControlType.Object,
        title: "Entrance",
        optional: true,
        icon: "effect",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Stagger",
                defaultValue: true,
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: DEFAULT_ENTRANCE.staggerDelay,
                min: 0,
                max: 0.2,
                step: 0.01,
                unit: "s",
                hidden: (p: { enabled: boolean }) => !p.enabled,
            },
        },
        defaultValue: DEFAULT_ENTRANCE,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: DEFAULT_ARIA_LABEL,
        description:
            "BuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
    },
})

Kern_KineticLinesGrid.displayName = "Kinetic Grid"
