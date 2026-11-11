import React, { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TrailNode {
    x: number
    y: number
    vx: number
    vy: number
}

interface RibbonClickBurstJet {
    angles: number[]
    radii: number[]
    omega: number
    radialSpeed: number
    reach: number
    widthScale: number
}

interface RibbonClickBurst {
    x: number
    y: number
    age: number
    maxAge: number
    jets: RibbonClickBurstJet[]
}

interface CreamyRibbonTrailProps {
    headWidth: number
    tailWidth: number
    headColor: string
    tailColor: string
    maxSpeed: number
    clickBurst: boolean
    zIndex: number
    style?: React.CSSProperties
}

interface RGBAColor {
    r: number
    g: number
    b: number
    a: number
}

const LOCKED_DAMPING = 0.5

function parseColor(color: string): RGBAColor {
    if (typeof document === "undefined") return { r: 219, g: 24, b: 79, a: 1 }
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return { r: 219, g: 24, b: 79, a: 1 }

    let resolvedColor = color.trim()
    if (resolvedColor.startsWith("var(") && typeof window !== "undefined") {
        const match = resolvedColor.match(
            /var\(\s*(--[^,\s)]+)\s*(?:,\s*([^)]+))?\)/
        )
        if (match) {
            const propValue = window
                .getComputedStyle(document.documentElement)
                .getPropertyValue(match[1])
                .trim()
            resolvedColor =
                propValue || (match[2] ? match[2].trim() : "#DB184F")
        }
    }

    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = resolvedColor
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: +(data[3] / 255).toFixed(3),
    }
}

function subdivideCurve(
    pts: { x: number; y: number }[],
    passes: number
): { x: number; y: number }[] {
    if (pts.length < 3) return pts
    let current = pts

    for (let p = 0; p < passes; p++) {
        const next: { x: number; y: number }[] = [current[0]]
        for (let i = 0; i < current.length - 1; i++) {
            const p0 = current[i]
            const p1 = current[i + 1]
            next.push({
                x: 0.75 * p0.x + 0.25 * p1.x,
                y: 0.75 * p0.y + 0.25 * p1.y,
            })
            next.push({
                x: 0.25 * p0.x + 0.75 * p1.x,
                y: 0.25 * p0.y + 0.75 * p1.y,
            })
        }
        next.push(current[current.length - 1])
        current = next
    }
    return current
}

// Strictly read-only: finds the host frame element to measure bounds
// without mutating any parent DOM or styles.
function findReadOnlyHostElement(
    anchorEl: HTMLElement | null
): HTMLElement | null {
    if (!anchorEl || typeof window === "undefined") return null

    const ownRect = anchorEl.getBoundingClientRect()
    if (ownRect.width > 300 && ownRect.height > 200) {
        return anchorEl
    }

    const compWrapper = anchorEl.parentElement
    if (!compWrapper) return anchorEl

    let candidate = compWrapper.parentElement
    while (
        candidate &&
        candidate !== document.body &&
        window.getComputedStyle(candidate).display === "contents"
    ) {
        candidate = candidate.parentElement
    }

    return candidate || compWrapper
}

function createRibbonClickBurst(x: number, y: number): RibbonClickBurst {
    const jetsCount = 6
    const nodesPerJet = 14
    const baseAngle = Math.random() * Math.PI * 2
    const jets: RibbonClickBurstJet[] = []

    for (let k = 0; k < jetsCount; k++) {
        const startAngle =
            baseAngle +
            (k / jetsCount) * Math.PI * 2 +
            (Math.random() - 0.5) * 0.42
        const reach = 26 + Math.random() * 14
        const angles: number[] = []
        const radii: number[] = []

        for (let i = 0; i < nodesPerJet; i++) {
            const frac = i / (nodesPerJet - 1)
            angles.push(startAngle + frac * 0.35)
            radii.push(1.5 + frac * 8)
        }

        jets.push({
            angles,
            radii,
            omega: 0.22 + Math.random() * 0.04,
            radialSpeed: 3.4 + Math.random() * 1.1,
            reach,
            widthScale: 0.82 + Math.random() * 0.32,
        })
    }

    return {
        x,
        y,
        age: 0,
        maxAge: 38,
        jets,
    }
}

function updateAndDrawRibbonBursts(
    ctx: CanvasRenderingContext2D,
    bursts: RibbonClickBurst[],
    dt: number,
    headWidth: number,
    tailWidth: number,
    headColor: RGBAColor,
    tailColor: RGBAColor
) {
    for (let bIdx = bursts.length - 1; bIdx >= 0; bIdx--) {
        const burst = bursts[bIdx]
        burst.age += dt

        if (burst.age >= burst.maxAge) {
            bursts.splice(bIdx, 1)
            continue
        }

        const lifeT = burst.age / burst.maxAge
        const velocityEnvelope = Math.exp(-lifeT * 3.1)
        const alphaEnvelope = Math.pow(1 - lifeT, 1.35)

        for (let j = 0; j < burst.jets.length; j++) {
            const jet = burst.jets[j]
            const count = jet.angles.length
            const rawPts: { x: number; y: number }[] = []

            for (let i = 0; i < count; i++) {
                const s = 1 - i / (count - 1)
                const radialAdvance =
                    jet.radialSpeed *
                    (0.15 + 0.85 * Math.pow(s, 0.85)) *
                    velocityEnvelope *
                    dt
                const angularAdvance =
                    jet.omega *
                    (1.35 - 0.55 * s) *
                    (0.35 + 0.65 * velocityEnvelope) *
                    dt

                jet.radii[i] += radialAdvance
                jet.angles[i] += angularAdvance

                rawPts.push({
                    x: burst.x + Math.cos(jet.angles[i]) * jet.radii[i],
                    y: burst.y + Math.sin(jet.angles[i]) * jet.radii[i],
                })
            }

            rawPts.reverse()

            const smoothPts = subdivideCurve(rawPts, 2)
            const total = smoothPts.length
            if (total < 2) continue

            const rawNormals: { nx: number; ny: number }[] = []
            let lastNx = 0
            let lastNy = -1

            for (let i = 0; i < total; i++) {
                const prev = smoothPts[Math.max(0, i - 1)]
                const next = smoothPts[Math.min(total - 1, i + 1)]
                const dx = next.x - prev.x
                const dy = next.y - prev.y
                const dist = Math.hypot(dx, dy)
                if (dist > 0.001) {
                    lastNx = -dy / dist
                    lastNy = dx / dist
                }
                rawNormals.push({ nx: lastNx, ny: lastNy })
            }

            const burstScale =
                Math.sin(Math.min(1, lifeT * 4.5) * (Math.PI / 2)) *
                (1 - lifeT * 0.65) *
                jet.widthScale
            const effectiveHeadW = Math.max(0.5, headWidth * 0.85 * burstScale)
            const effectiveTailW = Math.max(0.1, tailWidth * 0.5 * burstScale)

            const leftEdge: { x: number; y: number }[] = []
            const rightEdge: { x: number; y: number }[] = []

            for (let i = 0; i < total; i++) {
                const n0 = rawNormals[Math.max(0, i - 1)]
                const n1 = rawNormals[i]
                const n2 = rawNormals[Math.min(total - 1, i + 1)]
                let nx = n0.nx + n1.nx * 2 + n2.nx
                let ny = n0.ny + n1.ny * 2 + n2.ny
                const nLen = Math.hypot(nx, ny) || 1
                nx /= nLen
                ny /= nLen

                const t = i / Math.max(1, total - 1)
                const tipTaper = Math.sin(t * Math.PI)
                const widthProfile =
                    Math.pow(1 - t, 0.75) * 0.65 + tipTaper * 0.35
                const currentWidth =
                    effectiveTailW +
                    (effectiveHeadW - effectiveTailW) * widthProfile
                const radius = Math.max(0.12, currentWidth / 2)

                leftEdge.push({
                    x: smoothPts[i].x + nx * radius,
                    y: smoothPts[i].y + ny * radius,
                })
                rightEdge.push({
                    x: smoothPts[i].x - nx * radius,
                    y: smoothPts[i].y - ny * radius,
                })
            }

            for (let i = total - 2; i >= 0; i--) {
                const t = i / Math.max(1, total - 1)
                const colorMix = Math.min(1, t * 0.75 + lifeT * 0.45)
                const r = Math.round(
                    headColor.r + (tailColor.r - headColor.r) * colorMix
                )
                const g = Math.round(
                    headColor.g + (tailColor.g - headColor.g) * colorMix
                )
                const b = Math.round(
                    headColor.b + (tailColor.b - headColor.b) * colorMix
                )
                const a =
                    (headColor.a + (tailColor.a - headColor.a) * colorMix) *
                    alphaEnvelope *
                    Math.sin(t * Math.PI)

                if (a <= 0.01) continue
                const colorStr = `rgba(${r}, ${g}, ${b}, ${a})`

                ctx.beginPath()
                ctx.moveTo(leftEdge[i].x, leftEdge[i].y)
                ctx.lineTo(leftEdge[i + 1].x, leftEdge[i + 1].y)
                ctx.lineTo(rightEdge[i + 1].x, rightEdge[i + 1].y)
                ctx.lineTo(rightEdge[i].x, rightEdge[i].y)
                ctx.closePath()

                ctx.fillStyle = colorStr
                ctx.strokeStyle = colorStr
                ctx.lineWidth = 0.45
                ctx.fill()
                ctx.stroke()
            }
        }
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CreamyRibbonTrail(props: CreamyRibbonTrailProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        const overlayCanvas = canvasRef.current
        if (!container || !overlayCanvas) return

        const hostEl = findReadOnlyHostElement(container) || container

        const ctx = overlayCanvas.getContext("2d")
        if (!ctx) return

        const NODE_COUNT = 28
        const nodes: TrailNode[] = []
        const ribbonBursts: RibbonClickBurst[] = []

        let frameW = 300
        let frameH = 300

        const mouse = {
            x: -9999,
            y: -9999,
            prevX: -9999,
            prevY: -9999,
            speed: 0,
            inside: false,
        }

        let initialized = false
        let isRunning = false
        let isInView = true
        let listenersAttached = false
        let animationFrameId = 0
        let lastTime = performance.now()
        let idleFrames = 0

        const headColor = parseColor(props.headColor)
        const tailColor = parseColor(props.tailColor)

        // Positions the canvas inside our own React tree so its visual box
        // matches the host frame 1:1, eliminating any coordinate offset or gap.
        const syncCanvasToHostFrame = () => {
            const hostRect = hostEl.getBoundingClientRect()
            const parentRect = container.getBoundingClientRect()

            frameW = Math.max(1, Math.round(hostRect.width || 300))
            frameH = Math.max(1, Math.round(hostRect.height || 300))

            const offsetLeft = hostRect.left - parentRect.left
            const offsetTop = hostRect.top - parentRect.top

            overlayCanvas.style.transform = `translate3d(${offsetLeft}px, ${offsetTop}px, 0)`
            overlayCanvas.style.width = `${frameW}px`
            overlayCanvas.style.height = `${frameH}px`

            const dpr = window.devicePixelRatio || 1
            const targetW = Math.round(frameW * dpr)
            const targetH = Math.round(frameH * dpr)

            if (
                overlayCanvas.width !== targetW ||
                overlayCanvas.height !== targetH
            ) {
                overlayCanvas.width = targetW
                overlayCanvas.height = targetH
            }

            return hostRect
        }

        syncCanvasToHostFrame()

        const startLoop = () => {
            idleFrames = 0
            if (isRunning || !isInView) return
            isRunning = true
            lastTime = performance.now()
            animationFrameId = requestAnimationFrame(render)
        }

        const stopLoop = () => {
            if (!isRunning) return
            isRunning = false
            cancelAnimationFrame(animationFrameId)
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (!isInView) return

            const rect = syncCanvasToHostFrame()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top
            const isInside =
                localX >= 0 &&
                localX <= rect.width &&
                localY >= 0 &&
                localY <= rect.height

            if (!isInside) {
                mouse.inside = false
                return
            }

            const reEntering = !mouse.inside
            mouse.inside = true
            mouse.x = localX
            mouse.y = localY

            if (!initialized) {
                mouse.prevX = localX
                mouse.prevY = localY
                for (let i = 0; i < NODE_COUNT; i++) {
                    nodes.push({ x: localX, y: localY, vx: 0, vy: 0 })
                }
                initialized = true
            } else if (reEntering) {
                mouse.prevX = localX
                mouse.prevY = localY
                const spread = Math.hypot(
                    nodes[0].x - nodes[NODE_COUNT - 1].x,
                    nodes[0].y - nodes[NODE_COUNT - 1].y
                )
                if (spread < 2) {
                    for (let i = 0; i < NODE_COUNT; i++) {
                        nodes[i].x = localX
                        nodes[i].y = localY
                        nodes[i].vx = 0
                        nodes[i].vy = 0
                    }
                }
            }

            startLoop()
        }

        const handlePointerDown = (e: PointerEvent) => {
            if (!isInView || !props.clickBurst || e.button !== 0) return

            const rect = syncCanvasToHostFrame()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top
            if (
                localX < 0 ||
                localX > rect.width ||
                localY < 0 ||
                localY > rect.height
            ) {
                return
            }

            if (!initialized) {
                mouse.x = localX
                mouse.y = localY
                mouse.prevX = localX
                mouse.prevY = localY
                mouse.inside = true
                for (let i = 0; i < NODE_COUNT; i++) {
                    nodes.push({ x: localX, y: localY, vx: 0, vy: 0 })
                }
                initialized = true
            }

            ribbonBursts.push(createRibbonClickBurst(localX, localY))
            startLoop()
        }

        const attachPointerListeners = () => {
            if (listenersAttached) return
            listenersAttached = true
            window.addEventListener("pointermove", handlePointerMove, {
                passive: true,
            })
            window.addEventListener("pointerdown", handlePointerDown, {
                passive: true,
            })
        }

        const detachPointerListeners = () => {
            if (!listenersAttached) return
            listenersAttached = false
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerdown", handlePointerDown)
        }

        const render = (now: number) => {
            if (!isRunning || !isInView) return

            const dt = Math.min(Math.max((now - lastTime) / 16.667, 0.001), 2.5)
            lastTime = now

            syncCanvasToHostFrame()
            const dpr = window.devicePixelRatio || 1

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, frameW, frameH)

            if (initialized && nodes.length > 0) {
                const instantDx = mouse.x - mouse.prevX
                const instantDy = mouse.y - mouse.prevY
                const instantSpeed = Math.hypot(instantDx, instantDy)
                mouse.speed += (instantSpeed - mouse.speed) * 0.25
                mouse.prevX = mouse.x
                mouse.prevY = mouse.y

                const headStiffness = 0.35 + LOCKED_DAMPING * 0.45
                const headFriction = 0.65 - LOCKED_DAMPING * 0.35

                nodes[0].vx =
                    (nodes[0].vx + (mouse.x - nodes[0].x) * headStiffness) *
                    headFriction
                nodes[0].vy =
                    (nodes[0].vy + (mouse.y - nodes[0].y) * headStiffness) *
                    headFriction
                nodes[0].x += nodes[0].vx * dt
                nodes[0].y += nodes[0].vy * dt

                const speedControl = Math.max(
                    0.05,
                    Math.min(1, props.maxSpeed / 150)
                )
                const baseFollow = 0.28 + speedControl * 0.42
                const frameFollow = 1 - Math.pow(1 - baseFollow, dt)

                let totalArcLength = 0

                for (let i = 1; i < NODE_COUNT; i++) {
                    const prev = nodes[i - 1]
                    const curr = nodes[i]

                    const segmentFollow =
                        frameFollow * (1 - (i / NODE_COUNT) * 0.18)

                    curr.x += (prev.x - curr.x) * segmentFollow
                    curr.y += (prev.y - curr.y) * segmentFollow

                    totalArcLength += Math.hypot(
                        prev.x - curr.x,
                        prev.y - curr.y
                    )
                }

                if (ribbonBursts.length > 0) {
                    updateAndDrawRibbonBursts(
                        ctx,
                        ribbonBursts,
                        dt,
                        props.headWidth,
                        props.tailWidth,
                        headColor,
                        tailColor
                    )
                }

                if (totalArcLength < 0.8) {
                    if (ribbonBursts.length === 0) {
                        idleFrames++
                        if (idleFrames > 12) {
                            isRunning = false
                            return
                        }
                    } else {
                        idleFrames = 0
                    }
                    animationFrameId = requestAnimationFrame(render)
                    return
                }

                idleFrames = 0

                const activePts: { x: number; y: number }[] = [
                    { x: nodes[0].x, y: nodes[0].y },
                ]
                for (let i = 1; i < NODE_COUNT; i++) {
                    const last = activePts[activePts.length - 1]
                    if (
                        Math.hypot(nodes[i].x - last.x, nodes[i].y - last.y) >
                        0.35
                    ) {
                        activePts.push({ x: nodes[i].x, y: nodes[i].y })
                    }
                }

                if (activePts.length < 2) {
                    animationFrameId = requestAnimationFrame(render)
                    return
                }

                const smoothPts = subdivideCurve(activePts, 3)
                const total = smoothPts.length

                const rawNormals: { nx: number; ny: number }[] = []
                let lastNx = 0
                let lastNy = -1

                for (let i = 0; i < total; i++) {
                    const prev = smoothPts[Math.max(0, i - 1)]
                    const next = smoothPts[Math.min(total - 1, i + 1)]
                    const dx = next.x - prev.x
                    const dy = next.y - prev.y
                    const dist = Math.hypot(dx, dy)

                    if (dist > 0.001) {
                        lastNx = -dy / dist
                        lastNy = dx / dist
                    }
                    rawNormals.push({ nx: lastNx, ny: lastNy })
                }

                const retractScale = Math.min(1, totalArcLength / 18)
                const velocityBoost = 1 + Math.min(mouse.speed / 100, 1) * 0.25
                const effectiveHeadWidth =
                    props.headWidth * velocityBoost * retractScale
                const effectiveTailWidth = props.tailWidth * retractScale

                const leftEdge: { x: number; y: number }[] = []
                const rightEdge: { x: number; y: number }[] = []

                for (let i = 0; i < total; i++) {
                    const n0 = rawNormals[Math.max(0, i - 1)]
                    const n1 = rawNormals[i]
                    const n2 = rawNormals[Math.min(total - 1, i + 1)]
                    let nx = n0.nx + n1.nx * 2 + n2.nx
                    let ny = n0.ny + n1.ny * 2 + n2.ny
                    const nLen = Math.hypot(nx, ny) || 1
                    nx /= nLen
                    ny /= nLen

                    const t = i / Math.max(1, total - 1)
                    const widthProfile = Math.pow(1 - t, 0.85)
                    const currentWidth =
                        effectiveTailWidth +
                        (effectiveHeadWidth - effectiveTailWidth) * widthProfile
                    const frontTipRound = i < 3 ? 0.7 + 0.3 * (i / 3) : 1
                    const radius = Math.max(
                        0.15,
                        (currentWidth * frontTipRound) / 2
                    )

                    leftEdge.push({
                        x: smoothPts[i].x + nx * radius,
                        y: smoothPts[i].y + ny * radius,
                    })
                    rightEdge.push({
                        x: smoothPts[i].x - nx * radius,
                        y: smoothPts[i].y - ny * radius,
                    })
                }

                for (let i = total - 2; i >= 0; i--) {
                    const t = i / Math.max(1, total - 1)
                    const r = Math.round(
                        headColor.r + (tailColor.r - headColor.r) * t
                    )
                    const g = Math.round(
                        headColor.g + (tailColor.g - headColor.g) * t
                    )
                    const b = Math.round(
                        headColor.b + (tailColor.b - headColor.b) * t
                    )
                    const a =
                        (headColor.a + (tailColor.a - headColor.a) * t) *
                        retractScale
                    const colorStr = `rgba(${r}, ${g}, ${b}, ${a})`

                    ctx.beginPath()
                    ctx.moveTo(leftEdge[i].x, leftEdge[i].y)
                    ctx.lineTo(leftEdge[i + 1].x, leftEdge[i + 1].y)
                    ctx.lineTo(rightEdge[i + 1].x, rightEdge[i + 1].y)
                    ctx.lineTo(rightEdge[i].x, rightEdge[i].y)
                    ctx.closePath()

                    ctx.fillStyle = colorStr
                    ctx.strokeStyle = colorStr
                    ctx.lineWidth = 0.55
                    ctx.fill()
                    ctx.stroke()
                }

                const headCapRadius = Math.max(
                    0.2,
                    (effectiveHeadWidth * 0.7) / 2
                )
                ctx.beginPath()
                ctx.arc(
                    smoothPts[0].x,
                    smoothPts[0].y,
                    headCapRadius,
                    0,
                    Math.PI * 2
                )
                ctx.fillStyle = `rgba(${headColor.r}, ${headColor.g}, ${headColor.b}, ${headColor.a * retractScale})`
                ctx.fill()
            } else if (ribbonBursts.length === 0) {
                isRunning = false
                return
            }

            animationFrameId = requestAnimationFrame(render)
        }

        let resizeObserver: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                syncCanvasToHostFrame()
            })
            resizeObserver.observe(hostEl)
        }

        let intersectionObserver: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    if (!entry) return
                    isInView = entry.isIntersecting
                    if (isInView) {
                        syncCanvasToHostFrame()
                        attachPointerListeners()
                    } else {
                        mouse.inside = false
                        stopLoop()
                        detachPointerListeners()
                    }
                },
                { threshold: 0 }
            )
            intersectionObserver.observe(hostEl)
        } else {
            attachPointerListeners()
        }

        attachPointerListeners()

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopLoop()
            }
        }

        window.addEventListener("resize", syncCanvasToHostFrame, {
            passive: true,
        })
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            stopLoop()
            detachPointerListeners()
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
            }
            window.removeEventListener("resize", syncCanvasToHostFrame)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
        }
    }, [
        isStatic,
        props.zIndex,
        props.maxSpeed,
        props.headWidth,
        props.tailWidth,
        props.headColor,
        props.tailColor,
        props.clickBurst,
    ])

    if (isStatic) {
        return (
            <div
                style={{
                    padding: "8px 14px",
                    background: "rgba(17, 24, 39, 0.85)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    pointerEvents: "none",
                    ...props.style,
                }}
            >
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: props.headColor,
                        border: "1px solid rgba(255,255,255,0.4)",
                        display: "inline-block",
                    }}
                />
                Creamy Ribbon Trail
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: 0,
                height: 0,
                pointerEvents: "none",
                position: "relative",
                overflow: "visible",
                zIndex: props.zIndex,
                ...props.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: props.zIndex,
                    display: "block",
                }}
            />
        </div>
    )
}

CreamyRibbonTrail.defaultProps = {
    headWidth: 5,
    tailWidth: 1,
    headColor: "#DB184F",
    tailColor: "#820A2C",
    maxSpeed: 150,
    clickBurst: true,
    zIndex: 10,
}

addPropertyControls(CreamyRibbonTrail, {
    headWidth: {
        type: ControlType.Number,
        title: "Head Width",
        min: 1,
        max: 30,
        step: 0.5,
        defaultValue: 5,
    },
    tailWidth: {
        type: ControlType.Number,
        title: "Tail Width",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 1,
    },
    headColor: {
        type: ControlType.Color,
        title: "Head Color",
        defaultValue: "#DB184F",
    },
    tailColor: {
        type: ControlType.Color,
        title: "Tail Color",
        defaultValue: "#820A2C",
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 150,
    },
    clickBurst: {
        type: ControlType.Boolean,
        title: "Click Burst",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        min: -1,
        max: 10,
        step: 1,
        defaultValue: 10,
    },
})
