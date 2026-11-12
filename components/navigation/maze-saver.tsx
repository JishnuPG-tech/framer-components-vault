import React, { useEffect, useRef } from "react"
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
    stepDuration: number
    showEasterEggs: boolean
    pixelation: number
    wallTextureUrl?: string
    floorTextureUrl?: string
    ceilingTextureUrl?: string
    style?: React.CSSProperties
}

// 1 = Wall, 0 = Open Path
const MAZE_GRID = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

interface SpriteEntity {
    x: number
    y: number
    type: "START" | "OPENGL" | "ROCK" | "RAT"
}

const BASE_SPRITES: SpriteEntity[] = [{ x: 1.5, y: 1.5, type: "START" }]

const EASTER_EGG_SPRITES: SpriteEntity[] = [
    { x: 8.5, y: 1.5, type: "OPENGL" },
    { x: 4.5, y: 5.5, type: "ROCK" },
    { x: 9.5, y: 7.5, type: "RAT" },
]

const DIRS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
]

export default function Win953DMaze(props: Props) {
    const {
        stepDuration = 0.35,
        showEasterEggs = true,
        pixelation = 2,
        wallTextureUrl,
        floorTextureUrl,
        ceilingTextureUrl,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let animationFrameId: number
        let isVisible = false

        const loadCustomTexture = (
            url: string | undefined,
            defaultGenerator: () => ImageData,
            onReady: (imgData: ImageData) => void
        ) => {
            if (!url) {
                onReady(defaultGenerator())
                return
            }
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                const tCanvas = document.createElement("canvas")
                tCanvas.width = 64
                tCanvas.height = 64
                const tCtx = tCanvas.getContext("2d")!
                tCtx.drawImage(img, 0, 0, 64, 64)
                onReady(tCtx.getImageData(0, 0, 64, 64))
            }
            img.onerror = () => onReady(defaultGenerator())
            img.src = url
        }

        const createWallTexture = () => {
            const texCanvas = document.createElement("canvas")
            texCanvas.width = 64
            texCanvas.height = 64
            const tCtx = texCanvas.getContext("2d")!
            tCtx.fillStyle = "#8a2b18"
            tCtx.fillRect(0, 0, 64, 64)

            const brickH = 8
            const brickW = 16
            for (let y = 0; y < 64; y += brickH) {
                const shift = (y / brickH) % 2 === 0 ? 0 : 8
                for (let x = -8; x < 64; x += brickW) {
                    const varColor = (x + y) % 3 === 0 ? "#772313" : "#993320"
                    tCtx.fillStyle = varColor
                    tCtx.fillRect(x + shift + 1, y + 1, brickW - 1, brickH - 1)
                }
            }
            tCtx.fillStyle = "#c2b8a3"
            for (let y = 0; y < 64; y += brickH) {
                tCtx.fillRect(0, y, 64, 1)
                const shift = (y / brickH) % 2 === 0 ? 0 : 8
                for (let x = -8; x < 64; x += brickW) {
                    tCtx.fillRect(x + shift, y, 1, brickH)
                }
            }
            return tCtx.getImageData(0, 0, 64, 64)
        }

        const createFloorTexture = () => {
            const texCanvas = document.createElement("canvas")
            texCanvas.width = 64
            texCanvas.height = 64
            const tCtx = texCanvas.getContext("2d")!
            tCtx.fillStyle = "#7c4a21"
            tCtx.fillRect(0, 0, 64, 64)
            for (let y = 0; y < 64; y += 16) {
                for (let x = 0; x < 64; x += 16) {
                    const isVertical = (x / 16 + y / 16) % 2 === 0
                    tCtx.fillStyle = isVertical ? "#8b5327" : "#6a3e1a"
                    tCtx.fillRect(x, y, 16, 16)
                }
            }
            return tCtx.getImageData(0, 0, 64, 64)
        }

        const createCeilingTexture = () => {
            const texCanvas = document.createElement("canvas")
            texCanvas.width = 64
            texCanvas.height = 64
            const tCtx = texCanvas.getContext("2d")!
            tCtx.fillStyle = "#383838"
            tCtx.fillRect(0, 0, 64, 64)
            tCtx.fillStyle = "#202020"
            for (let i = 0; i < 64; i += 8) {
                tCtx.fillRect(0, i, 64, 1)
                tCtx.fillRect(i, 0, 1, 64)
            }
            return tCtx.getImageData(0, 0, 64, 64)
        }

        const createSpriteTextures = () => {
            const makeCanvas = (
                draw: (c: CanvasRenderingContext2D) => void
            ) => {
                const c = document.createElement("canvas")
                c.width = 64
                c.height = 64
                const cx = c.getContext("2d")!
                draw(cx)
                return cx.getImageData(0, 0, 64, 64)
            }

            const startTex = makeCanvas((c) => {
                c.fillStyle = "#c0c0c0"
                c.fillRect(4, 16, 56, 32)
                c.fillStyle = "#000000"
                c.font = "bold 12px sans-serif"
                c.fillText("Start", 18, 36)
            })

            const openglTex = makeCanvas((c) => {
                c.fillStyle = "#0055FF"
                c.beginPath()
                c.moveTo(32, 6)
                c.lineTo(58, 20)
                c.lineTo(58, 48)
                c.lineTo(32, 60)
                c.lineTo(6, 48)
                c.lineTo(6, 20)
                c.closePath()
                c.fill()

                c.fillStyle = "#FF0055"
                c.beginPath()
                c.arc(22, 28, 8, 0, Math.PI * 2)
                c.fill()

                c.fillStyle = "#00FFCC"
                c.beginPath()
                c.arc(42, 38, 8, 0, Math.PI * 2)
                c.fill()

                c.fillStyle = "#FFFFFF"
                c.font = "bold 10px sans-serif"
                c.fillText("OpenGL", 12, 36)
            })

            const rockTex = makeCanvas((c) => {
                c.fillStyle = "#00CED1"
                c.beginPath()
                c.moveTo(32, 8)
                c.lineTo(52, 20)
                c.lineTo(32, 32)
                c.lineTo(12, 20)
                c.closePath()
                c.fill()

                c.fillStyle = "#8A2BE2"
                c.beginPath()
                c.moveTo(12, 20)
                c.lineTo(32, 32)
                c.lineTo(28, 56)
                c.lineTo(8, 40)
                c.closePath()
                c.fill()

                c.fillStyle = "#4B0082"
                c.beginPath()
                c.moveTo(32, 32)
                c.lineTo(52, 20)
                c.lineTo(56, 40)
                c.lineTo(28, 56)
                c.closePath()
                c.fill()
            })

            const ratTex = makeCanvas((c) => {
                c.fillStyle = "#704214"
                c.beginPath()
                c.ellipse(32, 48, 16, 9, 0, 0, Math.PI * 2)
                c.fill()

                c.fillStyle = "#FFB6C1"
                c.beginPath()
                c.arc(20, 42, 4, 0, Math.PI * 2)
                c.arc(28, 42, 4, 0, Math.PI * 2)
                c.fill()

                c.strokeStyle = "#FFB6C1"
                c.lineWidth = 2
                c.beginPath()
                c.moveTo(48, 48)
                c.quadraticCurveTo(56, 42, 60, 48)
                c.stroke()
            })

            return {
                START: startTex,
                OPENGL: openglTex,
                ROCK: rockTex,
                RAT: ratTex,
            }
        }

        let wallTexData = createWallTexture()
        let floorTexData = createFloorTexture()
        let ceilingTexData = createCeilingTexture()
        const spriteTextures = createSpriteTextures()

        loadCustomTexture(wallTextureUrl, createWallTexture, (data) => {
            wallTexData = data
        })
        loadCustomTexture(floorTextureUrl, createFloorTexture, (data) => {
            floorTexData = data
        })
        loadCustomTexture(ceilingTextureUrl, createCeilingTexture, (data) => {
            ceilingTexData = data
        })

        let posX = 1.5
        let posY = 1.5
        let dirIdx = 0
        let angle = 0
        let isUpsideDown = false

        let state: "MOVING" | "PAUSE_BUMP" | "TURNING" = "MOVING"
        let stateTime = 0
        let targetAngle = 0
        let targetX = 2.5
        let targetY = 1.5

        const isWall = (gx: number, gy: number) => {
            if (
                gy < 0 ||
                gy >= MAZE_GRID.length ||
                gx < 0 ||
                gx >= MAZE_GRID[0].length
            )
                return true
            return MAZE_GRID[gy][gx] === 1
        }

        const planNextAction = () => {
            const curGX = Math.floor(posX)
            const curGY = Math.floor(posY)

            if (showEasterEggs && curGX === 4 && curGY === 5) {
                isUpsideDown = !isUpsideDown
            }

            const rightDir = (dirIdx + 1) % 4
            const rightGX = curGX + DIRS[rightDir].x
            const rightGY = curGY + DIRS[rightDir].y
            const fwdGX = curGX + DIRS[dirIdx].x
            const fwdGY = curGY + DIRS[dirIdx].y

            if (!isWall(rightGX, rightGY)) {
                dirIdx = rightDir
                targetAngle = dirIdx * (Math.PI / 2)
                state = "TURNING"
            } else if (!isWall(fwdGX, fwdGY)) {
                targetX = curGX + 0.5 + DIRS[dirIdx].x
                targetY = curGY + 0.5 + DIRS[dirIdx].y
                state = "MOVING"
            } else {
                state = "PAUSE_BUMP"
                stateTime = stepDuration * 0.4
            }
        }

        const updateAI = (delta: number) => {
            const moveSpeed = 1.0 / Math.max(0.01, stepDuration)
            const turnSpeed = Math.PI / 2 / Math.max(0.01, stepDuration)

            if (state === "MOVING") {
                const dx = targetX - posX
                const dy = targetY - posY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 0.05) {
                    posX = targetX
                    posY = targetY
                    planNextAction()
                } else {
                    posX += (dx / dist) * Math.min(dist, moveSpeed * delta)
                    posY += (dy / dist) * Math.min(dist, moveSpeed * delta)
                }
            } else if (state === "PAUSE_BUMP") {
                stateTime -= delta
                if (stateTime <= 0) {
                    dirIdx = (dirIdx + 3) % 4
                    targetAngle = dirIdx * (Math.PI / 2)
                    state = "TURNING"
                }
            } else if (state === "TURNING") {
                let diff = targetAngle - angle
                while (diff < -Math.PI) diff += Math.PI * 2
                while (diff > Math.PI) diff -= Math.PI * 2

                if (Math.abs(diff) < 0.05) {
                    angle = targetAngle
                    const curGX = Math.floor(posX)
                    const curGY = Math.floor(posY)
                    const fwdGX = curGX + DIRS[dirIdx].x
                    const fwdGY = curGY + DIRS[dirIdx].y

                    if (!isWall(fwdGX, fwdGY)) {
                        targetX = curGX + 0.5 + DIRS[dirIdx].x
                        targetY = curGY + 0.5 + DIRS[dirIdx].y
                        state = "MOVING"
                    } else {
                        state = "PAUSE_BUMP"
                        stateTime = stepDuration * 0.3
                    }
                } else {
                    angle +=
                        Math.sign(diff) *
                        Math.min(Math.abs(diff), turnSpeed * delta)
                }
            }
        }

        const renderFrame = () => {
            const clientWidth = container.clientWidth || 300
            const clientHeight = container.clientHeight || 200

            const width = Math.max(
                1,
                Math.floor(clientWidth / Math.max(1, pixelation))
            )
            const height = Math.max(
                1,
                Math.floor(clientHeight / Math.max(1, pixelation))
            )

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
            }

            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, width, height)

            ctx.save()
            if (isUpsideDown && showEasterEggs) {
                ctx.translate(width, height)
                ctx.rotate(Math.PI)
            }

            const dirX = Math.cos(angle)
            const dirY = Math.sin(angle)
            const planeX = -Math.sin(angle) * 0.66
            const planeY = Math.cos(angle) * 0.66

            const halfH = Math.floor(height / 2)
            const sceneImg = ctx.createImageData(width, height)
            const buf = sceneImg.data

            for (let y = 0; y < height; y++) {
                const isFloor = y >= halfH
                const p = isFloor ? y - halfH : halfH - y
                const posZ = 0.5 * height
                const rowDistance = posZ / (p || 1)

                const stepX = (rowDistance * (planeX * 2)) / width
                const stepY = (rowDistance * (planeY * 2)) / width

                let floorX = posX + rowDistance * (dirX - planeX)
                let floorY = posY + rowDistance * (dirY - planeY)

                const currentTex = isFloor ? floorTexData : ceilingTexData

                for (let x = 0; x < width; x++) {
                    const cellX = Math.floor(floorX)
                    const cellY = Math.floor(floorY)

                    const tx = Math.floor(64 * (floorX - cellX)) & 63
                    const ty = Math.floor(64 * (floorY - cellY)) & 63

                    const tIdx = (ty * 64 + tx) * 4
                    const bufIdx = (y * width + x) * 4

                    buf[bufIdx] = currentTex.data[tIdx]
                    buf[bufIdx + 1] = currentTex.data[tIdx + 1]
                    buf[bufIdx + 2] = currentTex.data[tIdx + 2]
                    buf[bufIdx + 3] = 255

                    floorX += stepX
                    floorY += stepY
                }
            }
            ctx.putImageData(sceneImg, 0, 0)

            const zBuffer: number[] = new Array(width).fill(0)

            for (let x = 0; x < width; x++) {
                const cameraX = (2 * x) / width - 1
                const rayDirX = dirX + planeX * cameraX
                const rayDirY = dirY + planeY * cameraX

                let mapX = Math.floor(posX)
                let mapY = Math.floor(posY)

                const deltaDistX = Math.abs(1 / (rayDirX || 0.00001))
                const deltaDistY = Math.abs(1 / (rayDirY || 0.00001))

                let sideDistX = 0
                let sideDistY = 0
                let stepX = 0
                let stepY = 0
                let hit = 0
                let side = 0

                if (rayDirX < 0) {
                    stepX = -1
                    sideDistX = (posX - mapX) * deltaDistX
                } else {
                    stepX = 1
                    sideDistX = (mapX + 1.0 - posX) * deltaDistX
                }

                if (rayDirY < 0) {
                    stepY = -1
                    sideDistY = (posY - mapY) * deltaDistY
                } else {
                    stepY = 1
                    sideDistY = (mapY + 1.0 - posY) * deltaDistY
                }

                while (hit === 0) {
                    if (sideDistX < sideDistY) {
                        sideDistX += deltaDistX
                        mapX += stepX
                        side = 0
                    } else {
                        sideDistY += deltaDistY
                        mapY += stepY
                        side = 1
                    }

                    if (
                        mapY >= 0 &&
                        mapY < MAZE_GRID.length &&
                        mapX >= 0 &&
                        mapX < MAZE_GRID[0].length
                    ) {
                        if (MAZE_GRID[mapY][mapX] === 1) hit = 1
                    } else {
                        hit = 1
                    }
                }

                let perpWallDist =
                    side === 0
                        ? (mapX - posX + (1 - stepX) / 2) / (rayDirX || 0.00001)
                        : (mapY - posY + (1 - stepY) / 2) / (rayDirY || 0.00001)
                perpWallDist = Math.max(0.01, perpWallDist)
                zBuffer[x] = perpWallDist

                const lineHeight = Math.floor(height / perpWallDist)
                const drawStart = Math.max(
                    0,
                    Math.floor(-lineHeight / 2 + height / 2)
                )
                const drawEnd = Math.min(
                    height,
                    Math.floor(lineHeight / 2 + height / 2)
                )

                let wallX =
                    side === 0
                        ? posY + perpWallDist * rayDirY
                        : posX + perpWallDist * rayDirX
                wallX -= Math.floor(wallX)

                let texX = Math.floor(wallX * 64)
                if (side === 0 && rayDirX > 0) texX = 64 - texX - 1
                if (side === 1 && rayDirY < 0) texX = 64 - texX - 1

                for (let y = drawStart; y < drawEnd; y++) {
                    const d = y * 256 - height * 128 + lineHeight * 128
                    const texY = Math.floor((d * 64) / lineHeight / 256) & 63

                    const tIdx = (texY * 64 + texX) * 4
                    let r = wallTexData.data[tIdx]
                    let g = wallTexData.data[tIdx + 1]
                    let b = wallTexData.data[tIdx + 2]

                    if (side === 1) {
                        r = Math.floor(r * 0.75)
                        g = Math.floor(g * 0.75)
                        b = Math.floor(b * 0.75)
                    }

                    ctx.fillStyle = `rgb(${r},${g},${b})`
                    ctx.fillRect(x, y, 1, 1)
                }
            }

            let activeSprites: SpriteEntity[] = [...BASE_SPRITES]
            if (showEasterEggs) {
                activeSprites = [...activeSprites, ...EASTER_EGG_SPRITES]
            }

            const sortedSprites = activeSprites
                .map((sprite) => {
                    const spriteX = sprite.x - posX
                    const spriteY = sprite.y - posY
                    return {
                        ...sprite,
                        dist: spriteX * spriteX + spriteY * spriteY,
                    }
                })
                .sort((a, b) => b.dist - a.dist)

            for (const sprite of sortedSprites) {
                const spriteX = sprite.x - posX
                const spriteY = sprite.y - posY

                const invDet = 1.0 / (planeX * dirY - dirX * planeY)
                const transformX = invDet * (dirY * spriteX - dirX * spriteY)
                const transformY =
                    invDet * (-planeY * spriteX + planeX * spriteY)

                if (transformY <= 0.1) continue

                const spriteScreenX = Math.floor(
                    (width / 2) * (1 + transformX / transformY)
                )
                const spriteSize = Math.abs(Math.floor(height / transformY))

                const drawStartX = Math.max(
                    0,
                    Math.floor(spriteScreenX - spriteSize / 2)
                )
                const drawEndX = Math.min(
                    width,
                    Math.floor(spriteScreenX + spriteSize / 2)
                )

                const spriteTex = spriteTextures[sprite.type]

                for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                    if (transformY < zBuffer[stripe]) {
                        const texX =
                            (Math.floor(
                                (256 *
                                    (stripe -
                                        (-spriteSize / 2 + spriteScreenX)) *
                                    64) /
                                    spriteSize
                            ) /
                                256) &
                            63

                        const drawStartY = Math.max(
                            0,
                            Math.floor(height / 2 - spriteSize / 2)
                        )
                        const drawEndY = Math.min(
                            height,
                            Math.floor(height / 2 + spriteSize / 2)
                        )

                        for (let y = drawStartY; y < drawEndY; y++) {
                            const d = y * 256 - height * 128 + spriteSize * 128
                            const texY =
                                Math.floor((d * 64) / spriteSize / 256) & 63

                            const tIdx = (texY * 64 + texX) * 4
                            const alpha = spriteTex.data[tIdx + 3]

                            if (alpha > 128) {
                                const r = spriteTex.data[tIdx]
                                const g = spriteTex.data[tIdx + 1]
                                const b = spriteTex.data[tIdx + 2]

                                ctx.fillStyle = `rgb(${r},${g},${b})`
                                ctx.fillRect(stripe, y, 1, 1)
                            }
                        }
                    }
                }
            }

            ctx.restore()
        }

        renderFrame()

        let lastTime = performance.now()

        const loop = (time: number) => {
            if (!isVisible) return

            const delta = Math.min((time - lastTime) / 1000, 0.1)
            lastTime = time

            updateAI(delta)
            renderFrame()

            animationFrameId = requestAnimationFrame(loop)
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting
                if (isVisible) {
                    lastTime = performance.now()
                    cancelAnimationFrame(animationFrameId)
                    animationFrameId = requestAnimationFrame(loop)
                } else {
                    cancelAnimationFrame(animationFrameId)
                }
            },
            { threshold: 0 }
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [
        isStatic,
        stepDuration,
        showEasterEggs,
        pixelation,
        wallTextureUrl,
        floorTextureUrl,
        ceilingTextureUrl,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 200,
                position: "relative",
                overflow: "hidden",
                backgroundColor: "#000000",
                ...style,
            }}
        >
            {isStatic ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#8a2b18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#c2b8a3",
                        fontFamily: "sans-serif",
                        fontWeight: "bold",
                        fontSize: "14px",
                    }}
                >
                    Win95 3D Maze (Preview)
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        imageRendering: "pixelated",
                        display: "block",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(Win953DMaze, {
    stepDuration: {
        type: ControlType.Number,
        title: "Step Speed",
        default: 0.35,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        unit: "s",
    },
    showEasterEggs: {
        type: ControlType.Boolean,
        title: "Easter Eggs",
        default: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    pixelation: {
        type: ControlType.Number,
        title: "Retro Pixel",
        default: 2,
        min: 1,
        max: 5,
        step: 1,
    },
    wallTextureUrl: {
        type: ControlType.Image,
        title: "Wall Texture",
    },
    floorTextureUrl: {
        type: ControlType.Image,
        title: "Floor Texture",
    },
    ceilingTextureUrl: {
        type: ControlType.Image,
        title: "Ceiling Texture",
    },
})
