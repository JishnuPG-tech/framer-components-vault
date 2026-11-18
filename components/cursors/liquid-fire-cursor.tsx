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

interface FireEmber {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    age: number
    maxAge: number
    phase: number
    stretch: number
}

interface LiquidFireTrailProps {
    colorMode: "static" | "dynamic"
    fireColor: string
    fireTipColor: string
    fireWidth: number
    fireLength: number
    fireTurbulence: number
    fireEmbers: boolean
    fireInvertText: boolean
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

let sharedColorCtx: CanvasRenderingContext2D | null = null

function parseColor(color: string): RGBAColor {
    if (typeof document === "undefined" || !color) {
        return { r: 0, g: 0, b: 0, a: 1 }
    }
    const rgbMatch = color.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i
    )
    if (rgbMatch) {
        return {
            r: Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[1])))),
            g: Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[2])))),
            b: Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[3])))),
            a:
                rgbMatch[4] !== undefined
                    ? Math.min(1, Math.max(0, parseFloat(rgbMatch[4])))
                    : 1,
        }
    }
    if (!sharedColorCtx) {
        const c = document.createElement("canvas")
        c.width = 1
        c.height = 1
        sharedColorCtx = c.getContext("2d", { willReadFrequently: true })
    }
    if (!sharedColorCtx) return { r: 0, g: 0, b: 0, a: 1 }
    sharedColorCtx.clearRect(0, 0, 1, 1)
    sharedColorCtx.fillStyle = "#000000"
    sharedColorCtx.fillStyle = color
    sharedColorCtx.fillRect(0, 0, 1, 1)
    const data = sharedColorCtx.getImageData(0, 0, 1, 1).data
    return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: +(data[3] / 255).toFixed(3),
    }
}

function subdivideCurve(
    pts: { x: number; y: number }[],
    iterations: number
): { x: number; y: number }[] {
    let current = pts
    for (let iter = 0; iter < iterations; iter++) {
        if (current.length < 2) break
        const next: { x: number; y: number }[] = [current[0]]
        for (let i = 0; i < current.length - 1; i++) {
            const p0 = current[i]
            const p1 = current[i + 1]
            next.push({
                x: p0.x * 0.75 + p1.x * 0.25,
                y: p0.y * 0.75 + p1.y * 0.25,
            })
            next.push({
                x: p0.x * 0.25 + p1.x * 0.75,
                y: p0.y * 0.25 + p1.y * 0.75,
            })
        }
        next.push(current[current.length - 1])
        current = next
    }
    return current
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function LiquidFireTrail(props: LiquidFireTrailProps) {
    const anchorRef = useRef<HTMLDivElement | null>(null)
    const invertCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (isCanvas) return

        const hostFrame = anchorRef.current
        const invertCanvas = invertCanvasRef.current
        const overlayCanvas = canvasRef.current
        if (!hostFrame || !invertCanvas || !overlayCanvas) return

        const invertCtx = invertCanvas.getContext("2d")
        const ctx = overlayCanvas.getContext("2d")
        if (!invertCtx || !ctx) return

        const NODE_COUNT = 28
        const nodes: TrailNode[] = []
        const embers: FireEmber[] = []

        let frameW = Math.max(1, hostFrame.offsetWidth || 300)
        let frameH = Math.max(1, hostFrame.offsetHeight || 300)
        let scaleX = 1
        let scaleY = 1
        let initialPageLeft = 0
        let initialPageTop = 0
        let resizeTimer = 0

        const mouse = {
            x: -9999,
            y: -9999,
            prevX: -9999,
            prevY: -9999,
            speed: 0,
            inside: false,
        }

        let initialized = false
        let emberAccumulator = 0
        let flameTime = 0
        let animationFrameId = 0
        let lastTime = performance.now()
        let isIntersecting = true
        let isPageVisible =
            typeof document === "undefined" ||
            document.visibilityState === "visible"
        let isRunning = false

        const isDynamic = props.colorMode === "dynamic"
        const fireColor = parseColor(isDynamic ? "#FC3D03" : props.fireColor)
        const fireTipColor = parseColor(
            isDynamic ? "#CFB80A" : props.fireTipColor
        )

        const updateFrameCanvasSize = () => {
            const rect = hostFrame.getBoundingClientRect()
            const unscaledW = hostFrame.offsetWidth || rect.width || 1
            const unscaledH = hostFrame.offsetHeight || rect.height || 1

            scaleX = rect.width > 0 ? rect.width / unscaledW : 1
            scaleY = rect.height > 0 ? rect.height / unscaledH : 1

            frameW = Math.max(1, Math.round(unscaledW))
            frameH = Math.max(1, Math.round(unscaledH))

            const dpr = window.devicePixelRatio || 1

            for (const c of [invertCanvas, overlayCanvas]) {
                c.style.position = "absolute"
                c.style.left = "0px"
                c.style.top = "0px"
                c.style.width = `${frameW}px`
                c.style.height = `${frameH}px`
                c.width = frameW * dpr
                c.height = frameH * dpr
            }

            initialPageLeft = rect.left + window.scrollX
            initialPageTop = rect.top + window.scrollY

            invertCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const render = (now: number) => {
            if (!isRunning) return

            const dt = Math.min((now - lastTime) / 16.667, 2.5)
            lastTime = now
            flameTime += dt * 0.16

            invertCtx.clearRect(0, 0, frameW, frameH)
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

                const prevHeadX = nodes[0].x
                const prevHeadY = nodes[0].y

                nodes[0].vx =
                    (nodes[0].vx + (mouse.x - nodes[0].x) * headStiffness) *
                    headFriction
                nodes[0].vy =
                    (nodes[0].vy + (mouse.y - nodes[0].y) * headStiffness) *
                    headFriction
                nodes[0].x += nodes[0].vx * dt
                nodes[0].y += nodes[0].vy * dt

                const lenNorm = Math.max(
                    0.1,
                    Math.min(1, (props.fireLength - 15) / 185)
                )
                const effectiveSpeedParam = 155 - lenNorm * 130

                const speedControl = Math.max(
                    0.05,
                    Math.min(1, effectiveSpeedParam / 150)
                )
                const baseFollow = 0.28 + speedControl * 0.42
                const frameFollow = 1 - Math.pow(1 - baseFollow, dt)

                const minFlameSpine = Math.max(14, props.fireWidth * 1.35)
                const idleFactor = Math.max(0, 1 - mouse.speed / 18)
                const targetLift =
                    (minFlameSpine * 2.15 * frameFollow) / NODE_COUNT
                const moveLift =
                    (0.25 + props.fireTurbulence * 0.25) *
                    Math.max(1, props.fireWidth / 18) *
                    dt
                const thermalLift =
                    moveLift * (1 - idleFactor) + targetLift * idleFactor

                let totalArcLength = 0

                for (let i = 1; i < NODE_COUNT; i++) {
                    const prev = nodes[i - 1]
                    const curr = nodes[i]

                    const frac = i / (NODE_COUNT - 1)
                    const segmentFollow = frameFollow * (1 - frac * 0.18)

                    const idleSway =
                        Math.cos(flameTime * 2.4 - frac * 3.8) *
                        props.fireTurbulence *
                        props.fireWidth *
                        0.016 *
                        frac *
                        idleFactor *
                        dt

                    curr.x += (prev.x - curr.x) * segmentFollow + idleSway
                    curr.y +=
                        (prev.y - curr.y) * segmentFollow - thermalLift * frac

                    totalArcLength += Math.hypot(
                        prev.x - curr.x,
                        prev.y - curr.y
                    )
                }

                if (
                    !mouse.inside &&
                    totalArcLength < 1.5 &&
                    embers.length === 0
                ) {
                    animationFrameId = requestAnimationFrame(render)
                    return
                }

                const activePts: { x: number; y: number }[] = [
                    { x: nodes[0].x, y: nodes[0].y },
                ]
                for (let i = 1; i < NODE_COUNT; i++) {
                    const last = activePts[activePts.length - 1]
                    if (
                        Math.hypot(nodes[i].x - last.x, nodes[i].y - last.y) >
                        0.15
                    ) {
                        activePts.push({ x: nodes[i].x, y: nodes[i].y })
                    }
                }

                if (activePts.length < 4) {
                    activePts.length = 0
                    for (let k = 0; k < 6; k++) {
                        const frac = k / 5
                        activePts.push({
                            x: nodes[0].x,
                            y: nodes[0].y - frac * minFlameSpine,
                        })
                    }
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

                const velocityStretch = 1 + Math.min(mouse.speed / 95, 1) * 0.22
                const baseFireWidth = props.fireWidth * velocityStretch
                const turb = props.fireTurbulence

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

                    const bellyCurve =
                        t < 0.12
                            ? 0.78 + 0.22 * (t / 0.12)
                            : Math.pow(1 - (t - 0.12) / 0.88, 1.35)

                    const wave1 = Math.sin(t * 11 - flameTime * 2.8)
                    const wave2 = Math.cos(t * 19 - flameTime * 4.1)
                    const tailDamp = 1 - Math.pow(t, 2.2) * 0.55
                    const spineFlutter =
                        (wave1 * 0.68 + wave2 * 0.32) *
                        turb *
                        baseFireWidth *
                        0.22 *
                        Math.pow(t, 0.8) *
                        tailDamp

                    const widthRipple =
                        1 +
                        Math.sin(t * 15 - flameTime * 3.5) *
                            turb *
                            0.18 *
                            t *
                            (1 - t * 0.5)

                    const radius = Math.max(
                        0.1,
                        (baseFireWidth * bellyCurve * widthRipple) / 2
                    )

                    const centerX = smoothPts[i].x + nx * spineFlutter
                    const centerY = smoothPts[i].y + ny * spineFlutter

                    const lx = centerX + nx * radius
                    const ly = centerY + ny * radius
                    const rx = centerX - nx * radius
                    const ry = centerY - ny * radius

                    leftEdge.push({ x: lx, y: ly })
                    rightEdge.push({ x: rx, y: ry })
                }

                if (props.fireEmbers && mouse.inside) {
                    const moveDist = Math.hypot(
                        nodes[0].x - prevHeadX,
                        nodes[0].y - prevHeadY
                    )
                    emberAccumulator +=
                        moveDist * (0.65 + turb * 0.45) +
                        (0.3 + turb * 0.35) * dt

                    const spawnThreshold = Math.max(8, 22 - turb * 9)
                    if (
                        emberAccumulator >= spawnThreshold &&
                        embers.length < 18
                    ) {
                        emberAccumulator = 0
                        const spawnT = 0.62 + Math.random() * 0.32
                        const tailIdx = Math.min(
                            total - 1,
                            Math.max(1, Math.floor(total * spawnT))
                        )
                        const spawnPt = smoothPts[tailIdx]
                        const prevPt = smoothPts[Math.max(0, tailIdx - 3)]
                        const tx = spawnPt.x - prevPt.x
                        const ty = spawnPt.y - prevPt.y
                        const tLen = Math.hypot(tx, ty) || 1
                        const normX = -ty / tLen
                        const normY = tx / tLen
                        const sideOffset =
                            (Math.random() - 0.5) *
                            props.fireWidth *
                            0.28 *
                            (1 - spawnT * 0.6)
                        const speedMag =
                            (0.45 + Math.random() * 1.15) * (1 + turb * 0.3)

                        embers.push({
                            x: spawnPt.x + normX * sideOffset,
                            y: spawnPt.y + normY * sideOffset,
                            vx:
                                (tx / tLen) * speedMag +
                                normX *
                                    (Math.random() - 0.5) *
                                    (0.6 + turb * 0.5),
                            vy:
                                (ty / tLen) * speedMag -
                                (0.45 + Math.random() * 0.85),
                            radius: Math.max(
                                1.1,
                                props.fireWidth *
                                    (0.045 +
                                        Math.pow(Math.random(), 1.6) * 0.11)
                            ),
                            age: 0,
                            maxAge: 14 + Math.random() * 16,
                            phase: Math.random() * Math.PI * 2,
                            stretch: 1.7 + Math.random() * 1.3,
                        })
                    }
                }

                for (let i = embers.length - 1; i >= 0; i--) {
                    const e = embers[i]
                    e.age += dt
                    if (e.age >= e.maxAge) {
                        embers.splice(i, 1)
                        continue
                    }
                    const lifeT = e.age / e.maxAge
                    const curlX =
                        Math.sin(flameTime * 2.8 + e.phase + lifeT * 5.2) *
                        (0.06 + turb * 0.09) *
                        dt
                    const curlY =
                        Math.cos(flameTime * 2.2 + e.phase * 1.3) *
                        (0.03 + turb * 0.05) *
                        dt

                    e.vx = e.vx * Math.pow(0.93, dt) + curlX
                    e.vy =
                        e.vy * Math.pow(0.93, dt) -
                        (0.055 + turb * 0.035) * dt +
                        curlY
                    e.x += e.vx * dt
                    e.y += e.vy * dt
                }

                const headCapRadius = Math.max(0.5, (baseFireWidth * 0.78) / 2)

                for (let i = total - 2; i >= 0; i--) {
                    const t = i / Math.max(1, total - 1)

                    if (isDynamic) {
                        const shade = Math.round(255 - t * 75)
                        const invStr = `rgba(${shade}, ${shade}, ${shade}, 1)`
                        invertCtx.beginPath()
                        invertCtx.moveTo(leftEdge[i].x, leftEdge[i].y)
                        invertCtx.lineTo(leftEdge[i + 1].x, leftEdge[i + 1].y)
                        invertCtx.lineTo(rightEdge[i + 1].x, rightEdge[i + 1].y)
                        invertCtx.lineTo(rightEdge[i].x, rightEdge[i].y)
                        invertCtx.closePath()
                        invertCtx.fillStyle = invStr
                        invertCtx.strokeStyle = invStr
                        invertCtx.lineWidth = 0.75
                        invertCtx.fill()
                        invertCtx.stroke()
                    } else {
                        if (props.fireInvertText) {
                            invertCtx.beginPath()
                            invertCtx.moveTo(leftEdge[i].x, leftEdge[i].y)
                            invertCtx.lineTo(
                                leftEdge[i + 1].x,
                                leftEdge[i + 1].y
                            )
                            invertCtx.lineTo(
                                rightEdge[i + 1].x,
                                rightEdge[i + 1].y
                            )
                            invertCtx.lineTo(rightEdge[i].x, rightEdge[i].y)
                            invertCtx.closePath()
                            invertCtx.fillStyle = "#ffffff"
                            invertCtx.strokeStyle = "#ffffff"
                            invertCtx.lineWidth = 0.75
                            invertCtx.fill()
                            invertCtx.stroke()
                        }

                        const r = Math.round(
                            fireColor.r + (fireTipColor.r - fireColor.r) * t
                        )
                        const g = Math.round(
                            fireColor.g + (fireTipColor.g - fireColor.g) * t
                        )
                        const b = Math.round(
                            fireColor.b + (fireTipColor.b - fireColor.b) * t
                        )
                        const a =
                            fireColor.a + (fireTipColor.a - fireColor.a) * t
                        const colorStr = `rgba(${r}, ${g}, ${b}, ${a})`

                        ctx.beginPath()
                        ctx.moveTo(leftEdge[i].x, leftEdge[i].y)
                        ctx.lineTo(leftEdge[i + 1].x, leftEdge[i + 1].y)
                        ctx.lineTo(rightEdge[i + 1].x, rightEdge[i + 1].y)
                        ctx.lineTo(rightEdge[i].x, rightEdge[i].y)
                        ctx.closePath()

                        ctx.fillStyle = colorStr
                        ctx.strokeStyle = colorStr
                        ctx.lineWidth = 0.75
                        ctx.fill()
                        ctx.stroke()
                    }
                }

                if (isDynamic || props.fireInvertText) {
                    invertCtx.beginPath()
                    invertCtx.arc(
                        smoothPts[0].x,
                        smoothPts[0].y,
                        headCapRadius,
                        0,
                        Math.PI * 2
                    )
                    invertCtx.fillStyle = "#ffffff"
                    invertCtx.fill()
                }

                if (!isDynamic) {
                    ctx.beginPath()
                    ctx.arc(
                        smoothPts[0].x,
                        smoothPts[0].y,
                        headCapRadius,
                        0,
                        Math.PI * 2
                    )
                    ctx.fillStyle = `rgba(${fireColor.r}, ${fireColor.g}, ${fireColor.b}, ${fireColor.a})`
                    ctx.fill()
                }

                for (let i = 0; i < embers.length; i++) {
                    const e = embers[i]
                    const lifeT = e.age / e.maxAge
                    const env =
                        Math.sin(Math.min(1, lifeT * 4.5) * (Math.PI / 2)) *
                        Math.pow(1 - lifeT, 1.35)
                    const r = e.radius * env
                    if (r < 0.2) continue

                    const angle = Math.atan2(e.vy, e.vx)
                    const len = r * e.stretch * (1 + (1 - lifeT) * 0.35)
                    const wid = r * 0.58

                    const colorMix = Math.min(1, 0.45 + lifeT * 0.45)
                    const er = Math.round(
                        fireColor.r + (fireTipColor.r - fireColor.r) * colorMix
                    )
                    const eg = Math.round(
                        fireColor.g + (fireTipColor.g - fireColor.g) * colorMix
                    )
                    const eb = Math.round(
                        fireColor.b + (fireTipColor.b - fireColor.b) * colorMix
                    )
                    const ea =
                        (fireColor.a +
                            (fireTipColor.a - fireColor.a) * colorMix) *
                        Math.min(1, (1 - lifeT) * 1.6)

                    if (isDynamic || props.fireInvertText) {
                        const eShade = isDynamic
                            ? Math.round(255 - colorMix * 70)
                            : 255
                        invertCtx.save()
                        invertCtx.translate(e.x, e.y)
                        invertCtx.rotate(angle)
                        invertCtx.beginPath()
                        invertCtx.moveTo(len, 0)
                        invertCtx.quadraticCurveTo(
                            len * 0.15,
                            wid,
                            -len * 0.85,
                            0
                        )
                        invertCtx.quadraticCurveTo(len * 0.15, -wid, len, 0)
                        invertCtx.closePath()
                        invertCtx.fillStyle = `rgba(${eShade}, ${eShade}, ${eShade}, ${ea.toFixed(3)})`
                        invertCtx.fill()
                        invertCtx.restore()
                    }

                    if (!isDynamic) {
                        ctx.save()
                        ctx.translate(e.x, e.y)
                        ctx.rotate(angle)
                        ctx.beginPath()
                        ctx.moveTo(len, 0)
                        ctx.quadraticCurveTo(len * 0.15, wid, -len * 0.85, 0)
                        ctx.quadraticCurveTo(len * 0.15, -wid, len, 0)
                        ctx.closePath()
                        ctx.fillStyle = `rgba(${er}, ${eg}, ${eb}, ${ea.toFixed(3)})`
                        ctx.fill()
                        ctx.restore()
                    }
                }
            }

            if (isRunning) {
                animationFrameId = requestAnimationFrame(render)
            }
        }

        const updateRunState = () => {
            const shouldRun = isIntersecting && isPageVisible
            if (shouldRun && !isRunning) {
                isRunning = true
                lastTime = performance.now()
                animationFrameId = requestAnimationFrame(render)
            } else if (!shouldRun && isRunning) {
                isRunning = false
                cancelAnimationFrame(animationFrameId)
            }
        }

        const scheduleResize = () => {
            window.clearTimeout(resizeTimer)
            resizeTimer = window.setTimeout(() => {
                updateFrameCanvasSize()
            }, 150)
        }

        updateFrameCanvasSize()

        let resizeObserver: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                scheduleResize()
            })
            resizeObserver.observe(hostFrame)
        }

        window.addEventListener("resize", scheduleResize)

        const handlePointerMove = (e: PointerEvent) => {
            const currentLeft = initialPageLeft - window.scrollX
            const currentTop = initialPageTop - window.scrollY
            const localX = (e.clientX - currentLeft) / scaleX
            const localY = (e.clientY - currentTop) / scaleY
            const isInside =
                localX >= 0 &&
                localX <= frameW &&
                localY >= 0 &&
                localY <= frameH

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

            if (!isRunning) {
                isIntersecting = true
                updateRunState()
            }
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })

        let intersectionObserver: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    if (entries.length > 0) {
                        const entry = entries[0]
                        if (
                            entry.boundingClientRect.width > 0 &&
                            entry.boundingClientRect.height > 0
                        ) {
                            isIntersecting = entry.isIntersecting
                        } else {
                            isIntersecting = true
                        }
                        updateRunState()
                    }
                },
                { threshold: 0 }
            )
            intersectionObserver.observe(overlayCanvas)
        }

        const handleVisibilityChange = () => {
            isPageVisible = document.visibilityState === "visible"
            updateRunState()
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        updateRunState()

        return () => {
            isRunning = false
            window.clearTimeout(resizeTimer)
            if (resizeObserver) {
                resizeObserver.disconnect()
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
            }
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
            window.removeEventListener("resize", scheduleResize)
            window.removeEventListener("pointermove", handlePointerMove)
            cancelAnimationFrame(animationFrameId)
        }
    }, [
        isCanvas,
        props.colorMode,
        props.zIndex,
        props.fireColor,
        props.fireTipColor,
        props.fireWidth,
        props.fireLength,
        props.fireTurbulence,
        props.fireEmbers,
        props.fireInvertText,
    ])

    const isDynamic = props.colorMode === "dynamic"

    if (isCanvas) {
        return (
            <div
                style={{
                    ...props.style,
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
                }}
            >
                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isDynamic ? "#FC3D03" : props.fireColor,
                        border: "1px solid rgba(255,255,255,0.4)",
                        display: "inline-block",
                    }}
                />
                Liquid Fire Trail ({isDynamic ? "Dynamic" : "Static"})
            </div>
        )
    }

    return (
        <div
            ref={anchorRef}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                minWidth: "1px",
                minHeight: "1px",
                position: "relative",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            {/* LAYER 1: Pure RGB Inversion Layer (#ffffff + difference) */}
            <canvas
                ref={invertCanvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    display:
                        isDynamic || props.fireInvertText ? "block" : "none",
                    mixBlendMode: "difference",
                    filter: isDynamic ? "none" : "contrast(4) saturate(1.5)",
                    zIndex: props.zIndex,
                }}
            />
            {/* LAYER 2: Static Mode Personalized Flame Overlay */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    display: isDynamic ? "none" : "block",
                    opacity: props.fireInvertText ? 0.942 : 1,
                    filter: props.fireInvertText
                        ? "saturate(1.35) contrast(1.35)"
                        : "none",
                    mixBlendMode: props.fireInvertText
                        ? "hard-light"
                        : "normal",
                    zIndex: props.zIndex + 1,
                }}
            />
        </div>
    )
}

LiquidFireTrail.defaultProps = {
    colorMode: "static",
    fireColor: "#FC3D03",
    fireTipColor: "#CFB80A",
    fireWidth: 25,
    fireLength: 105,
    fireTurbulence: 0.75,
    fireEmbers: true,
    fireInvertText: true,
    zIndex: 10,
}

addPropertyControls(LiquidFireTrail, {
    colorMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["static", "dynamic"],
        optionTitles: ["Static", "Dynamic"],
        displaySegmentedControl: true,
        defaultValue: "static",
    },
    fireColor: {
        type: ControlType.Color,
        title: "Flame Core Color",
        defaultValue: "#FC3D03",
        hidden: (props) => props.colorMode === "dynamic",
    },
    fireTipColor: {
        type: ControlType.Color,
        title: "Flame Tip Color",
        defaultValue: "#CFB80A",
        hidden: (props) => props.colorMode === "dynamic",
    },
    fireWidth: {
        type: ControlType.Number,
        title: "Flame Width",
        min: 6,
        max: 80,
        step: 1,
        defaultValue: 25,
    },
    fireLength: {
        type: ControlType.Number,
        title: "Flame Length",
        min: 15,
        max: 200,
        step: 5,
        defaultValue: 105,
    },
    fireTurbulence: {
        type: ControlType.Number,
        title: "Flame Flicker",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.75,
    },
    fireEmbers: {
        type: ControlType.Boolean,
        title: "Ember Sparks",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    fireInvertText: {
        type: ControlType.Boolean,
        title: "Invert Text",
        enabledTitle: "Invert",
        disabledTitle: "Normal",
        defaultValue: true,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 10,
    },
})
