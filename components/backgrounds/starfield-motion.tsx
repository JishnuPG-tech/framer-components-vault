import { useRef, useEffect, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    darkBackground: string
    lightBackground: string
    dotColor: string // hex color e.g. "#ffffff"
    dotColorLight: string // hex color e.g. "#18181b"
    theme: "dark" | "light"
    gap: number
    baseRadius: number
    padding: number
    influenceRadius: number
    pushStrength: number
    glowBoost: number
    shootingStarsEnabled: boolean
    shootingStarMinInterval: number
    shootingStarMaxInterval: number
    shootingStarTrailLength: number
    breatheEnabled: boolean
    twinkleEnabled: boolean
    borderRadius: number
    maxDots: number
    style: React.CSSProperties
}
// ── Perf: cap on total dots. Gap auto-scales up when canvas is large. ──
const MAX_DOTS_DEFAULT = 8000

function colorToRgb(color: string): string {
    // Handle rgba(r,g,b,a) or rgb(r,g,b) from Framer's color picker
    const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbaMatch) return rgbaMatch[1] + "," + rgbaMatch[2] + "," + rgbaMatch[3]
    // Handle hex (#fff or #ffffff or #ffffffaa)
    const h = color.replace("#", "")
    const expanded =
        h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h.slice(0, 6)
    const num = parseInt(expanded, 16)
    return ((num >> 16) & 255) + "," + ((num >> 8) & 255) + "," + (num & 255)
}

interface DeviceProfile {
    dprCap: number
    dotBudget: number
    minGap: number
    enableGlow: boolean
}

function getDeviceProfile(userMaxDots: number): DeviceProfile {
    if (typeof window === "undefined") {
        return {
            dprCap: 2,
            dotBudget: userMaxDots,
            minGap: 10,
            enableGlow: true,
        }
    }
    const w = window.innerWidth
    const hasTouch = navigator.maxTouchPoints > 1
    const isMobile = w < 768
    const isTablet = w >= 768 && w < 1024 && hasTouch

    if (isMobile) {
        return {
            dprCap: 1,
            dotBudget: Math.min(userMaxDots, 1500),
            minGap: 16,
            enableGlow: false,
        }
    }
    if (isTablet) {
        return {
            dprCap: 1.5,
            dotBudget: Math.min(userMaxDots, 3500),
            minGap: 12,
            enableGlow: true,
        }
    }
    return { dprCap: 2, dotBudget: userMaxDots, minGap: 10, enableGlow: true }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 */
export default function HeroStarfield(props: Props) {
    const {
        darkBackground = "#111111",
        lightBackground = "#ffffff",
        dotColor = "#ffffff",
        dotColorLight = "#18181b",
        theme = "dark",
        gap: userGap = 10,
        baseRadius = 1.2,
        padding = 8,
        influenceRadius = 90,
        pushStrength = 14,
        glowBoost = 0.55,
        shootingStarsEnabled = true,
        shootingStarMinInterval = 3,
        shootingStarMaxInterval = 6,
        shootingStarTrailLength = 35,
        breatheEnabled = true,
        twinkleEnabled = true,
        borderRadius = 16,
        maxDots = MAX_DOTS_DEFAULT,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animRef = useRef<number>(0)
    const stateRef = useRef<any>(null)
    const isStaticRenderer = useIsStaticRenderer()

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isLight = theme === "light"
    const bg = isLight ? lightBackground : darkBackground
    const rgb = colorToRgb(isLight ? dotColorLight : dotColor)
    const device = useMemo(() => getDeviceProfile(maxDots), [maxDots])

    const buildGrid = useCallback(
        (canvas: HTMLCanvasElement, W: number, H: number) => {
            const dpr = Math.min(window.devicePixelRatio, device.dprCap)
            canvas.width = W * dpr
            canvas.height = H * dpr
            canvas.style.width = W + "px"
            canvas.style.height = H + "px"
            const ctx = canvas.getContext("2d")!
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            // ── Perf: auto-scale gap so dot count never exceeds budget ──
            const budget = device.dotBudget
            let gap = Math.max(userGap, device.minGap)
            const naiveCols = Math.floor((W - padding * 2) / gap) + 1
            const naiveRows = Math.floor((H - padding * 2) / gap) + 1
            if (naiveCols * naiveRows > budget) {
                gap = Math.ceil(Math.sqrt((W * H) / budget))
                if (gap < userGap) gap = userGap
            }

            const cols = Math.floor((W - padding * 2) / gap) + 1
            const rows = Math.floor((H - padding * 2) / gap) + 1
            const count = cols * rows
            const offsetX = (W - (cols - 1) * gap) / 2
            const offsetY = (H - (rows - 1) * gap) / 2

            const baseX = new Float32Array(count)
            const baseY = new Float32Array(count)
            const posX = new Float32Array(count)
            const posY = new Float32Array(count)
            const velX = new Float32Array(count)
            const velY = new Float32Array(count)
            const dotRadius = new Float32Array(count)
            const dotBaseAlpha = new Float32Array(count)
            const dotType = new Uint8Array(count) // 0=dot, 1=small star, 2=med star, 3=bright star
            const twinklePhase = new Float32Array(count)
            const twinkleSpeed = new Float32Array(count)
            const starRotation = new Float32Array(count)

            // ── Perf: pre-build index lists per type for batched rendering ──
            const typeIndices: number[][] = [[], [], [], []]

            const brightThresh = 0.98 + Math.random() * 0.012
            const medThresh = 0.945 + Math.random() * 0.025
            const smallThresh = 0.86 + Math.random() * 0.05

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const idx = r * cols + c
                    const x = offsetX + c * gap
                    const y = offsetY + r * gap
                    baseX[idx] = x
                    baseY[idx] = y
                    posX[idx] = x
                    posY[idx] = y

                    const roll = Math.random()

                    if (roll > brightThresh) {
                        dotType[idx] = 3
                        dotRadius[idx] = 3.0 + Math.random() * 1.5
                        dotBaseAlpha[idx] = 0.7 + Math.random() * 0.3
                        twinkleSpeed[idx] = 0.4 + Math.random() * 1.0
                    } else if (roll > medThresh) {
                        dotType[idx] = 2
                        dotRadius[idx] = 2.0 + Math.random() * 0.8
                        dotBaseAlpha[idx] = 0.4 + Math.random() * 0.25
                        twinkleSpeed[idx] = 0.6 + Math.random() * 1.8
                    } else if (roll > smallThresh) {
                        dotType[idx] = 1
                        dotRadius[idx] = 1.4 + Math.random() * 0.4
                        dotBaseAlpha[idx] = 0.22 + Math.random() * 0.15
                        twinkleSpeed[idx] = 0.8 + Math.random() * 2.5
                    } else {
                        dotType[idx] = 0
                        dotRadius[idx] = baseRadius
                        dotBaseAlpha[idx] = 0.16 + Math.random() * 0.1
                        twinkleSpeed[idx] = 0
                    }

                    if (dotType[idx] > 0) {
                        baseX[idx] += (Math.random() - 0.5) * gap * 0.8
                        baseY[idx] += (Math.random() - 0.5) * gap * 0.8
                        posX[idx] = baseX[idx]
                        posY[idx] = baseY[idx]
                    }

                    twinklePhase[idx] = Math.random() * Math.PI * 2
                    starRotation[idx] = Math.random() * Math.PI * 0.5
                    typeIndices[dotType[idx]].push(idx)
                }
            }

            // ── Perf: spatial hash grid for mouse interaction ──
            const cellSize = influenceRadius
            const gridCols = Math.ceil(W / cellSize) + 1
            const gridRows = Math.ceil(H / cellSize) + 1
            const spatialGrid: number[][] = new Array(gridCols * gridRows)
            for (let i = 0; i < spatialGrid.length; i++) spatialGrid[i] = []
            for (let i = 0; i < count; i++) {
                const gc = Math.floor(baseX[i] / cellSize)
                const gr = Math.floor(baseY[i] / cellSize)
                if (gc >= 0 && gc < gridCols && gr >= 0 && gr < gridRows) {
                    spatialGrid[gr * gridCols + gc].push(i)
                }
            }

            return {
                W,
                H,
                dpr,
                cols,
                rows,
                count,
                gap,
                baseX,
                baseY,
                posX,
                posY,
                velX,
                velY,
                dotRadius,
                dotBaseAlpha,
                dotType,
                twinklePhase,
                twinkleSpeed,
                starRotation,
                typeIndices,
                spatialGrid,
                gridCols,
                gridRows,
                cellSize,
                shootingStars: [] as any[],
                nextShoot: 2 + Math.random() * 4,
                mouseX: -9999,
                mouseY: -9999,
                mouseInside: false,
                smoothX: -9999,
                smoothY: -9999,
                // ── Perf: per-dot computed alpha/radius for current frame ──
                frameAlpha: new Float32Array(count),
                frameRadius: new Float32Array(count),
                // ── Perf: track which dots are mouse-affected this frame ──
                mouseAffected: new Uint8Array(count),
                enableGlow: device.enableGlow,
            }
        },
        [userGap, baseRadius, padding, influenceRadius, device]
    )

    useEffect(() => {
        if (isCanvas) return
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const ctx = canvas.getContext("2d")!
        const rect = container.getBoundingClientRect()
        stateRef.current = buildGrid(canvas, rect.width, rect.height)

        // ── Perf: pre-computed sin/cos table for star shape (8 points) ──
        const starCos = new Float64Array(8)
        const starSin = new Float64Array(8)
        for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI) / 4
            starCos[j] = Math.cos(angle)
            starSin[j] = Math.sin(angle)
        }

        function breatheAlpha(x: number, y: number, t: number) {
            const wave1 = Math.sin(x * 0.012 + y * 0.008 + t * 0.6) * 0.5 + 0.5
            const wave2 = Math.sin(x * 0.007 - y * 0.011 + t * 0.4) * 0.5 + 0.5
            return wave1 * 0.3 + wave2 * 0.2
        }

        // - Perf: quantize alpha to reduce fillStyle changes -
        const ALPHA_STEPS = 64
        function quantAlpha(a: number): number {
            return Math.round(a * ALPHA_STEPS) / ALPHA_STEPS
        }

        function drawStaticFrame() {
            const s = stateRef.current
            if (!s) return
            const t = 0
            ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
            ctx.fillStyle = bg
            ctx.fillRect(0, 0, s.W, s.H)

            const type0 = s.typeIndices[0]
            const alphaGroups = new Map<number, number[]>()
            for (let j = 0; j < type0.length; j++) {
                const i = type0[j]
                let a = s.dotBaseAlpha[i]
                if (breatheEnabled) {
                    a += breatheAlpha(s.baseX[i], s.baseY[i], t) * 0.12
                }
                a = quantAlpha(a)
                if (a < 0.01) continue
                let group = alphaGroups.get(a)
                if (!group) {
                    group = []
                    alphaGroups.set(a, group)
                }
                group.push(i)
            }
            alphaGroups.forEach((indices, a) => {
                ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
                ctx.beginPath()
                for (let j = 0; j < indices.length; j++) {
                    const i = indices[j]
                    const px = s.baseX[i]
                    const py = s.baseY[i]
                    ctx.moveTo(px + baseRadius, py)
                    ctx.arc(px, py, baseRadius, 0, Math.PI * 2)
                }
                ctx.fill()
            })

            for (let type = 1; type <= 3; type++) {
                const indices = s.typeIndices[type]
                for (let j = 0; j < indices.length; j++) {
                    const i = indices[j]
                    let alpha = s.dotBaseAlpha[i]
                    let radius = s.dotRadius[i]

                    if (twinkleEnabled) {
                        const tw = Math.sin(
                            t * s.twinkleSpeed[i] + s.twinklePhase[i]
                        )
                        const tw2 = Math.sin(
                            t * s.twinkleSpeed[i] * 0.37 +
                                s.twinklePhase[i] * 2.1
                        )
                        const flicker = tw * 0.35 + tw2 * 0.15 + 0.5

                        if (type === 3) {
                            alpha = s.dotBaseAlpha[i] * (0.55 + flicker * 0.45)
                        } else if (type === 2) {
                            alpha = s.dotBaseAlpha[i] * (0.35 + flicker * 0.65)
                        } else {
                            alpha = s.dotBaseAlpha[i] * (0.15 + flicker * 0.85)
                        }

                        const flareWave = Math.sin(
                            t * 0.3 + s.twinklePhase[i] * 5.0
                        )
                        if (flareWave > 0.97) {
                            const flareIntensity = (flareWave - 0.97) / 0.03
                            alpha = Math.min(1.0, alpha + flareIntensity * 0.5)
                            radius = s.dotRadius[i] * (1 + flareIntensity * 0.4)
                        }
                    }

                    alpha = quantAlpha(alpha)
                    if (alpha < 0.01) continue

                    const px = s.baseX[i]
                    const py = s.baseY[i]
                    const outerR = radius
                    const innerR = outerR * 0.3
                    const rot = s.starRotation[i]
                    const cosR = Math.cos(rot)
                    const sinR = Math.sin(rot)

                    ctx.fillStyle = "rgba(" + rgb + "," + alpha + ")"
                    ctx.beginPath()
                    for (let k = 0; k < 8; k++) {
                        const r = k % 2 === 0 ? outerR : innerR
                        const lx = px + (starCos[k] * cosR - starSin[k] * sinR) * r
                        const ly = py + (starCos[k] * sinR + starSin[k] * cosR) * r
                        if (k === 0) ctx.moveTo(lx, ly)
                        else ctx.lineTo(lx, ly)
                    }
                    ctx.closePath()
                    ctx.fill()

                    if (type >= 2 && s.enableGlow) {
                        const glowR = type === 2 ? outerR * 3 : outerR * 4.5
                        const glowA = type === 2 ? alpha * 0.1 : alpha * 0.18
                        const grad = ctx.createRadialGradient(
                            px,
                            py,
                            outerR * 0.2,
                            px,
                            py,
                            glowR
                        )
                        grad.addColorStop(0, "rgba(" + rgb + "," + glowA + ")")
                        grad.addColorStop(1, "rgba(" + rgb + ",0)")
                        ctx.beginPath()
                        ctx.arc(px, py, glowR, 0, Math.PI * 2)
                        ctx.fillStyle = grad
                        ctx.fill()

                        if (type === 3 && alpha > 0.4) {
                            const rayLen = outerR * 3.5
                            const rayAlpha = alpha * 0.2
                            ctx.strokeStyle = "rgba(" + rgb + "," + rayAlpha + ")"
                            ctx.lineWidth = 0.5
                            ctx.beginPath()
                            const rx1 = px + cosR * rayLen
                            const ry1 = py + sinR * rayLen
                            const rx2 = px - cosR * rayLen
                            const ry2 = py - sinR * rayLen
                            const rx3 = px - sinR * rayLen
                            const ry3 = py + cosR * rayLen
                            const rx4 = px + sinR * rayLen
                            const ry4 = py - cosR * rayLen
                            ctx.moveTo(rx2, ry2)
                            ctx.lineTo(rx1, ry1)
                            ctx.moveTo(rx3, ry3)
                            ctx.lineTo(rx4, ry4)
                            ctx.stroke()
                        }
                    }
                }
            }
        }

        function animate() {
            animRef.current = requestAnimationFrame(animate)
            const s = stateRef.current
            if (!s) return
            const t = performance.now() * 0.001

            if (s.mouseInside) {
                s.smoothX += (s.mouseX - s.smoothX) * 0.12
                s.smoothY += (s.mouseY - s.smoothY) * 0.12
            } else {
                s.smoothX += (-9999 - s.smoothX) * 0.05
                s.smoothY += (-9999 - s.smoothY) * 0.05
            }

            ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
            ctx.fillStyle = bg
            ctx.fillRect(0, 0, s.W, s.H)

            // ── Shooting stars (unchanged — very few objects) ──
            if (shootingStarsEnabled) {
                s.nextShoot -= 0.016
                if (s.nextShoot <= 0) {
                    const startEdge = Math.random()
                    let sx: number, sy: number, angle: number
                    if (startEdge < 0.5) {
                        sx = Math.random() * s.W * 0.6
                        sy = -5
                        angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.2
                    } else {
                        sx = s.W + 5
                        sy = Math.random() * s.H * 0.5
                        angle = Math.PI * 0.6 + Math.random() * Math.PI * 0.3
                    }
                    s.shootingStars.push({
                        x: sx,
                        y: sy,
                        vx: Math.cos(angle) * (3 + Math.random() * 3),
                        vy: Math.sin(angle) * (3 + Math.random() * 3),
                        life: 1.0,
                        decay: 0.008 + Math.random() * 0.012,
                        len: shootingStarTrailLength + Math.random() * 40,
                    })
                    s.nextShoot =
                        shootingStarMinInterval +
                        Math.random() *
                            (shootingStarMaxInterval - shootingStarMinInterval)
                }
                for (let i = s.shootingStars.length - 1; i >= 0; i--) {
                    const ss = s.shootingStars[i]
                    ss.x += ss.vx
                    ss.y += ss.vy
                    ss.life -= ss.decay
                    if (
                        ss.life <= 0 ||
                        ss.x < -50 ||
                        ss.x > s.W + 50 ||
                        ss.y > s.H + 50
                    ) {
                        s.shootingStars.splice(i, 1)
                        continue
                    }
                    const speed = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy)
                    const tailX = ss.x - (ss.vx / speed) * ss.len
                    const tailY = ss.y - (ss.vy / speed) * ss.len
                    const grad = ctx.createLinearGradient(
                        tailX,
                        tailY,
                        ss.x,
                        ss.y
                    )
                    grad.addColorStop(0, "rgba(" + rgb + ",0)")
                    grad.addColorStop(
                        0.7,
                        "rgba(" + rgb + "," + ss.life * 0.3 + ")"
                    )
                    grad.addColorStop(
                        1,
                        "rgba(" + rgb + "," + ss.life * 0.8 + ")"
                    )
                    ctx.beginPath()
                    ctx.moveTo(tailX, tailY)
                    ctx.lineTo(ss.x, ss.y)
                    ctx.strokeStyle = grad
                    ctx.lineWidth = 1.2
                    ctx.lineCap = "round"
                    ctx.stroke()
                    ctx.beginPath()
                    ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2)
                    ctx.fillStyle = "rgba(" + rgb + "," + ss.life * 0.9 + ")"
                    ctx.fill()
                }
            }

            // ══════════════════════════════════════════════════════
            // PHASE 1: Compute alpha/radius for ALL dots (pure math, no draw calls)
            // ══════════════════════════════════════════════════════

            const fAlpha = s.frameAlpha
            const fRadius = s.frameRadius
            const mAffected = s.mouseAffected

            // Reset mouse-affected flags
            mAffected.fill(0)

            // ── Perf: find mouse-affected dots via spatial hash (only nearby cells) ──
            const smx = s.smoothX
            const smy = s.smoothY
            const infR = influenceRadius
            const infR2 = infR * infR

            if (smx > -5000) {
                // mouse is somewhere reasonable
                const minGC = Math.max(0, Math.floor((smx - infR) / s.cellSize))
                const maxGC = Math.min(
                    s.gridCols - 1,
                    Math.floor((smx + infR) / s.cellSize)
                )
                const minGR = Math.max(0, Math.floor((smy - infR) / s.cellSize))
                const maxGR = Math.min(
                    s.gridRows - 1,
                    Math.floor((smy + infR) / s.cellSize)
                )

                for (let gr = minGR; gr <= maxGR; gr++) {
                    for (let gc = minGC; gc <= maxGC; gc++) {
                        const cell = s.spatialGrid[gr * s.gridCols + gc]
                        for (let ci = 0; ci < cell.length; ci++) {
                            const i = cell[ci]
                            const dx = s.baseX[i] - smx
                            const dy = s.baseY[i] - smy
                            if (dx * dx + dy * dy < infR2) {
                                mAffected[i] = 1
                            }
                        }
                    }
                }
            }

            // Compute alpha & radius per dot
            for (let i = 0; i < s.count; i++) {
                const type = s.dotType[i]
                let alpha = s.dotBaseAlpha[i]
                let radius = s.dotRadius[i]

                if (type === 0 && breatheEnabled) {
                    alpha += breatheAlpha(s.baseX[i], s.baseY[i], t) * 0.12
                }

                if (type > 0 && twinkleEnabled) {
                    const tw = Math.sin(
                        t * s.twinkleSpeed[i] + s.twinklePhase[i]
                    )
                    const tw2 = Math.sin(
                        t * s.twinkleSpeed[i] * 0.37 + s.twinklePhase[i] * 2.1
                    )
                    const flicker = tw * 0.35 + tw2 * 0.15 + 0.5

                    if (type === 3) {
                        alpha = s.dotBaseAlpha[i] * (0.55 + flicker * 0.45)
                        s.starRotation[i] += 0.003
                    } else if (type === 2) {
                        alpha = s.dotBaseAlpha[i] * (0.35 + flicker * 0.65)
                        s.starRotation[i] += 0.005
                    } else {
                        alpha = s.dotBaseAlpha[i] * (0.15 + flicker * 0.85)
                        s.starRotation[i] += 0.008
                    }

                    const flareWave = Math.sin(
                        t * 0.3 + s.twinklePhase[i] * 5.0
                    )
                    if (flareWave > 0.97) {
                        const flareIntensity = (flareWave - 0.97) / 0.03
                        alpha = Math.min(1.0, alpha + flareIntensity * 0.5)
                        radius = s.dotRadius[i] * (1 + flareIntensity * 0.4)
                    }
                }

                // Physics: mouse-affected dots get push, others spring back
                let targetX = s.baseX[i]
                let targetY = s.baseY[i]

                if (mAffected[i]) {
                    const bx = s.baseX[i]
                    const by = s.baseY[i]
                    const dx = bx - smx
                    const dy = by - smy
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const f = 1 - dist / infR
                    const ease = f * f * f

                    if (dist > 0.5) {
                        targetX = bx + (dx / dist) * pushStrength * ease
                        targetY = by + (dy / dist) * pushStrength * ease
                    }
                    alpha = Math.min(1.0, alpha + glowBoost * ease)
                    if (type > 0) {
                        radius = radius * (1 + ease * 0.6)
                    }

                    const edgeMargin = pushStrength + 6
                    const edgeFadeX = Math.min(bx, s.W - bx) / edgeMargin
                    const edgeFadeY = Math.min(by, s.H - by) / edgeMargin
                    const edgeDamp = Math.min(1, Math.min(edgeFadeX, edgeFadeY))
                    if (edgeDamp < 1) {
                        targetX = bx + (targetX - bx) * edgeDamp
                        targetY = by + (targetY - by) * edgeDamp
                    }
                }

                s.velX[i] += (targetX - s.posX[i]) * 0.15
                s.velY[i] += (targetY - s.posY[i]) * 0.15
                s.velX[i] *= 0.75
                s.velY[i] *= 0.75
                s.posX[i] += s.velX[i]
                s.posY[i] += s.velY[i]

                fAlpha[i] = quantAlpha(alpha)
                fRadius[i] = radius
            }

            // ══════════════════════════════════════════════════════
            // PHASE 2: Batched rendering — group by alpha to minimize state changes
            // ══════════════════════════════════════════════════════

            // ── Type 0 dots: batch into paths grouped by quantized alpha ──
            const type0 = s.typeIndices[0]
            const alphaGroups = new Map<number, number[]>()
            for (let j = 0; j < type0.length; j++) {
                const i = type0[j]
                const a = fAlpha[i]
                if (a < 0.01) continue // skip invisible
                let group = alphaGroups.get(a)
                if (!group) {
                    group = []
                    alphaGroups.set(a, group)
                }
                group.push(i)
            }
            alphaGroups.forEach((indices, a) => {
                ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
                ctx.beginPath()
                for (let j = 0; j < indices.length; j++) {
                    const i = indices[j]
                    const px = s.posX[i]
                    const py = s.posY[i]
                    ctx.moveTo(px + baseRadius, py)
                    ctx.arc(px, py, baseRadius, 0, Math.PI * 2)
                }
                ctx.fill()
            })

            // ── Type 1 stars: individually drawn (few of them) but skip save/restore ──
            const type1 = s.typeIndices[1]
            for (let j = 0; j < type1.length; j++) {
                const i = type1[j]
                const a = fAlpha[i]
                if (a < 0.01) continue
                const px = s.posX[i]
                const py = s.posY[i]
                const outerR = fRadius[i]
                const innerR = outerR * 0.3
                const rot = s.starRotation[i]
                const cosR = Math.cos(rot)
                const sinR = Math.sin(rot)

                ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
                ctx.beginPath()
                for (let k = 0; k < 8; k++) {
                    const r = k % 2 === 0 ? outerR : innerR
                    const lx = px + (starCos[k] * cosR - starSin[k] * sinR) * r
                    const ly = py + (starCos[k] * sinR + starSin[k] * cosR) * r
                    if (k === 0) ctx.moveTo(lx, ly)
                    else ctx.lineTo(lx, ly)
                }
                ctx.closePath()
                ctx.fill()
            }

            // ── Type 2 stars: star shape + glow ──
            const type2 = s.typeIndices[2]
            for (let j = 0; j < type2.length; j++) {
                const i = type2[j]
                const a = fAlpha[i]
                if (a < 0.01) continue
                const px = s.posX[i]
                const py = s.posY[i]
                const outerR = fRadius[i]
                const innerR = outerR * 0.3
                const rot = s.starRotation[i]
                const cosR = Math.cos(rot)
                const sinR = Math.sin(rot)

                // Star shape
                ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
                ctx.beginPath()
                for (let k = 0; k < 8; k++) {
                    const r = k % 2 === 0 ? outerR : innerR
                    const lx = px + (starCos[k] * cosR - starSin[k] * sinR) * r
                    const ly = py + (starCos[k] * sinR + starSin[k] * cosR) * r
                    if (k === 0) ctx.moveTo(lx, ly)
                    else ctx.lineTo(lx, ly)
                }
                ctx.closePath()
                ctx.fill()

                // Glow (skip on mobile for performance)
                if (s.enableGlow) {
                    const glowR = outerR * 3
                    const glowA = a * 0.1
                    const grad = ctx.createRadialGradient(
                        px,
                        py,
                        outerR * 0.2,
                        px,
                        py,
                        glowR
                    )
                    grad.addColorStop(0, "rgba(" + rgb + "," + glowA + ")")
                    grad.addColorStop(1, "rgba(" + rgb + ",0)")
                    ctx.beginPath()
                    ctx.arc(px, py, glowR, 0, Math.PI * 2)
                    ctx.fillStyle = grad
                    ctx.fill()
                }
            }

            // ── Type 3 stars: star shape + bigger glow + cross rays ──
            const type3 = s.typeIndices[3]
            for (let j = 0; j < type3.length; j++) {
                const i = type3[j]
                const a = fAlpha[i]
                if (a < 0.01) continue
                const px = s.posX[i]
                const py = s.posY[i]
                const outerR = fRadius[i]
                const innerR = outerR * 0.3
                const rot = s.starRotation[i]
                const cosR = Math.cos(rot)
                const sinR = Math.sin(rot)

                // Star shape
                ctx.fillStyle = "rgba(" + rgb + "," + a + ")"
                ctx.beginPath()
                for (let k = 0; k < 8; k++) {
                    const r = k % 2 === 0 ? outerR : innerR
                    const lx = px + (starCos[k] * cosR - starSin[k] * sinR) * r
                    const ly = py + (starCos[k] * sinR + starSin[k] * cosR) * r
                    if (k === 0) ctx.moveTo(lx, ly)
                    else ctx.lineTo(lx, ly)
                }
                ctx.closePath()
                ctx.fill()

                // Glow + cross rays (skip on mobile for performance)
                if (s.enableGlow) {
                    const glowR = outerR * 4.5
                    const glowA = a * 0.18
                    const grad = ctx.createRadialGradient(
                        px,
                        py,
                        outerR * 0.2,
                        px,
                        py,
                        glowR
                    )
                    grad.addColorStop(0, "rgba(" + rgb + "," + glowA + ")")
                    grad.addColorStop(1, "rgba(" + rgb + ",0)")
                    ctx.beginPath()
                    ctx.arc(px, py, glowR, 0, Math.PI * 2)
                    ctx.fillStyle = grad
                    ctx.fill()

                    if (a > 0.4) {
                        const rayLen = outerR * 3.5
                        const rayAlpha = a * 0.2
                        ctx.strokeStyle = "rgba(" + rgb + "," + rayAlpha + ")"
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        const rx1 = px + cosR * rayLen
                        const ry1 = py + sinR * rayLen
                        const rx2 = px - cosR * rayLen
                        const ry2 = py - sinR * rayLen
                        const rx3 = px - sinR * rayLen
                        const ry3 = py + cosR * rayLen
                        const rx4 = px + sinR * rayLen
                        const ry4 = py - cosR * rayLen
                        ctx.moveTo(rx2, ry2)
                        ctx.lineTo(rx1, ry1)
                        ctx.moveTo(rx3, ry3)
                        ctx.lineTo(rx4, ry4)
                        ctx.stroke()
                    }
                }
            }
        }

        const onMouseMove = (e: MouseEvent) => {
            const s = stateRef.current
            if (!s) return
            const r = container.getBoundingClientRect()
            s.mouseX = e.clientX - r.left
            s.mouseY = e.clientY - r.top
            s.mouseInside = true
        }
        const onMouseLeave = () => {
            const s = stateRef.current
            if (s) s.mouseInside = false
        }
        const onTouchMove = (e: TouchEvent) => {
            const s = stateRef.current
            if (!s || !e.touches.length) return
            const r = container.getBoundingClientRect()
            s.mouseX = e.touches[0].clientX - r.left
            s.mouseY = e.touches[0].clientY - r.top
            s.mouseInside = true
        }
        const onTouchEnd = () => {
            const s = stateRef.current
            if (s) s.mouseInside = false
        }

        let resizeTimer: ReturnType<typeof setTimeout>
        const ro = new ResizeObserver(() => {
            // ── Perf: debounce resize to avoid rebuilding grid every frame ──
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                const s = stateRef.current
                const rect = container.getBoundingClientRect()
                const newState = buildGrid(canvas, rect.width, rect.height)
                if (s) {
                    newState.mouseX = s.mouseX
                    newState.mouseY = s.mouseY
                    newState.mouseInside = s.mouseInside
                    newState.smoothX = s.smoothX
                    newState.smoothY = s.smoothY
                }
                stateRef.current = newState
                if (isStaticRenderer) {
                    drawStaticFrame()
                }
            }, 100)
        })

        container.addEventListener("mousemove", onMouseMove)
        container.addEventListener("mouseleave", onMouseLeave)
        container.addEventListener("touchmove", onTouchMove, { passive: true })
        container.addEventListener("touchend", onTouchEnd)
        container.addEventListener("touchcancel", onTouchEnd)
        ro.observe(container)

        if (isStaticRenderer) {
            drawStaticFrame()
        } else {
            animRef.current = requestAnimationFrame(animate)
        }

        return () => {
            cancelAnimationFrame(animRef.current)
            clearTimeout(resizeTimer)
            container.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("mouseleave", onMouseLeave)
            container.removeEventListener("touchmove", onTouchMove)
            container.removeEventListener("touchend", onTouchEnd)
            container.removeEventListener("touchcancel", onTouchEnd)
            ro.disconnect()
        }
    }, [
        isCanvas,
        bg,
        rgb,
        buildGrid,
        baseRadius,
        influenceRadius,
        pushStrength,
        glowBoost,
        shootingStarsEnabled,
        shootingStarMinInterval,
        shootingStarMaxInterval,
        shootingStarTrailLength,
        breatheEnabled,
        twinkleEnabled,
        isStaticRenderer,
    ])

    if (isCanvas) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    overflow: "hidden",
                    position: "relative",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...style,
                }}
            >
                <div
                    style={{
                        color: `rgba(${rgb},0.4)`,
                        fontSize: 14,
                        fontFamily: "Inter, system-ui, sans-serif",
                        letterSpacing: "0.02em",
                    }}
                >
                    Starfield — preview to animate
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                borderRadius,
                overflow: "hidden",
                position: "relative",
                background: bg,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

HeroStarfield.displayName = "Hero Starfield"

addPropertyControls(HeroStarfield, {
    // ── Appearance ──
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        section: "Appearance",
    },
    darkBackground: {
        type: ControlType.Color,
        title: "Dark BG",
        defaultValue: "#111111",
        hidden: (props) => props.theme === "light",
        section: "Appearance",
    },
    lightBackground: {
        type: ControlType.Color,
        title: "Light BG",
        defaultValue: "#ffffff",
        hidden: (props) => props.theme === "dark",
        section: "Appearance",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color (dark)",
        defaultValue: "#ffffff",
        hidden: (props) => props.theme === "light",
        section: "Appearance",
    },
    dotColorLight: {
        type: ControlType.Color,
        title: "Dot Color (light)",
        defaultValue: "#18181b",
        hidden: (props) => props.theme === "dark",
        section: "Appearance",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 16,
        section: "Appearance",
    },

    // ── Grid ──
    gap: {
        type: ControlType.Number,
        title: "Grid Gap",
        description: "Spacing in pixels between dots in the grid.",
        min: 4,
        max: 30,
        step: 1,
        defaultValue: 10,
        section: "Grid",
    },
    baseRadius: {
        type: ControlType.Number,
        title: "Dot Size",
        description: "Radius of the small background dots.",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1.2,
        section: "Grid",
    },
    padding: {
        type: ControlType.Number,
        title: "Edge Padding",
        description: "Inset from the component edges before dots begin.",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 8,
        section: "Grid",
    },
    maxDots: {
        type: ControlType.Number,
        title: "Max Dots",
        description:
            "Cap on total dots rendered. Gap auto-scales up on large canvases to stay within this limit.",
        min: 1000,
        max: 20000,
        step: 500,
        defaultValue: MAX_DOTS_DEFAULT,
        section: "Grid",
    },

    // ── Mouse Interaction ──
    influenceRadius: {
        type: ControlType.Number,
        title: "Mouse Radius",
        description: "How far from the cursor dots are affected.",
        min: 20,
        max: 300,
        step: 5,
        defaultValue: 90,
        section: "Mouse Interaction",
    },
    pushStrength: {
        type: ControlType.Number,
        title: "Push Strength",
        description: "How far dots are pushed away from the cursor.",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 14,
        section: "Mouse Interaction",
    },
    glowBoost: {
        type: ControlType.Number,
        title: "Glow Boost",
        description: "Extra brightness added to dots near the cursor.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        section: "Mouse Interaction",
    },

    // ── Effects ──
    breatheEnabled: {
        type: ControlType.Boolean,
        title: "Breathe Effect",
        defaultValue: true,
        section: "Effects",
    },
    twinkleEnabled: {
        type: ControlType.Boolean,
        title: "Twinkle Effect",
        defaultValue: true,
        section: "Effects",
    },

    // ── Shooting Stars ──
    shootingStarsEnabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        section: "Shooting Stars",
    },
    shootingStarMinInterval: {
        type: ControlType.Number,
        title: "Min Interval (s)",
        description: "Minimum seconds between shooting stars.",
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 3,
        hidden: (props) => !props.shootingStarsEnabled,
        section: "Shooting Stars",
    },
    shootingStarMaxInterval: {
        type: ControlType.Number,
        title: "Max Interval (s)",
        description: "Maximum seconds between shooting stars.",
        min: 1,
        max: 30,
        step: 0.5,
        defaultValue: 6,
        hidden: (props) => !props.shootingStarsEnabled,
        section: "Shooting Stars",
    },
    shootingStarTrailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        description: "Length of the shooting star trail in pixels.",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 35,
        hidden: (props) => !props.shootingStarsEnabled,
        section: "Shooting Stars",
    },
})
