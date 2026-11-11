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


/*
 * Chrome Dino / T-Rex Runner for Framer.
 *
 * This component vendors the official Chromium 1x Dino runner visual assets
 * and adapts the open-source runner mechanics to React/Framer.
 *
 * Official source:
 * https://chromium.googlesource.com/chromium/src/+/refs/tags/74.0.3719.3/components/neterror/resources/offline.js
 *
 * Official asset import:
 * https://chromium.googlesource.com/chromium/src/+/f8cb5584fe0d38a3d3f19d4bb8cb92c753f8d1f3/chrome/renderer/resources/default_100_percent/offline/
 *
 * Copyright (c) 2014 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by Chromium's BSD-style license:
 * https://chromium.googlesource.com/chromium/src/+/main/LICENSE
 */

const ASSETS = {
    trex: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQgAAAAvCAMAAAAo9qT3AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF////9/f3U1NT////csP8BgAAAAR0Uk5T////AEAqqfQAAAF6SURBVHja7JrhDoMgDIR1vP87L0wN0B7FOkysuWbJ9uN2KV9aBGRJMFYQKb1Di2MhCANEtvmI6BlH0+aQWoIYg/iAwNbRtBrDhsIAsSz3JOzx9WlbtQVCat8F4vc5CUJoX9UaBHF3a3CyJAiCIIgxiNHq/WlagvgfhLS3Vu7RtGd3GgRRQGST6m9ra9uWZDRtHnQfgziPIAgAYlVV1k5Q0bQKBGgJgkAgSknZj6Fo2m3k9mOTIDCIzRqZ6iTiaI/BYwxt4xCEBIFDT1SRtLgdzMmSIIYgxpub52oJ4goI21oaR9NaKBwgtG00bR8EfAncs0bG0bQ9FARhgcDWnoOxJ2vxYoogbBDa2r6fEksrUZg3ZghCHYGWja51Y+mKdv/VlR+K+ntGDvX2iyDOgihHHuqAtFuYfu3owluLYl4ONQCC8ICAR+adJPzaM3GQmptDPXyCSJdaw7a+pvXE3Bza1jAXVAQhirKe1EYF7NX6QMzMYRwEscdXgAEALXFv87DcjegAAAAASUVORK5CYII=",
    cactusLarge:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAMAAACJUtIoAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF9/f3U1NT////CSwXiwAAAAN0Uk5T//8A18oNQQAAAetJREFUeNrsmcGWwiAMRa/8/0fPcbQEQl4LLUoXsvA48wzcFBIgJeXGs6WgTRRkcxb2lcezBZ1NFDSVs6AWgs7mCfoJNhZfxEI/wYVYezM7B+s1G3fDes/GFCzh4Qmsrf/TWKRDDxdg0dHV97HKgBzDqhNuJYi+pMVELJoFbgJEfUmLBKNY/x7SBoMtgkiIsKTFvyNjWC+ZNhic/QCWshjAev8HrcTCDpa0+GENYcEdsfAD3gKr+HT56V5YeWP8ABansV65rdgwmIdV+j6AhWXcIsM9JmD5zsawwgPNFCzX2wUs7eGp5MglLNvbkR6ey9lcwCLnVPxKbbAsGKgH8QJ2CxYWB1hsf7wTK+hIbFobcO39Z39dmCP7WNUJbXMdOToHVM2ykI70Y1lXYWcET6M5BuMV2HGwH6uIinB054MvIXBkEeWTYyy2szxqdOSTcgtCWGwCvVhmkYtL4TwpQV5wCB2hF+tjpZHYEVZjCYG+BLGwkLQTKkvrW4hT6uqyW94OblYNhDgiVhcpf1g/rDthoQa5JHRiFVt1Ko6DlCXXE4Ir1DGIhR1snt/ro6H9fFSoeROF6worsCie1tbq+RgVHG/K9/oUXciEhV8Vyc/HuFDw5oHrV4ZYlVVZpDaM5Cu/aYJ+0ZiVPwEGAGibJOgwwsufAAAAAElFTkSuQmCC",
    cactusSmall:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAAAjCAMAAABRlI+PAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAxQTFRF9/f3////U1NT////hgncgwAAAAR0Uk5T////AEAqqfQAAAEzSURBVHja7JfBjoMwDERn8P//89IkBI8d3K5UDruCE3Ln8apYOAHWLwAmVyqQfJMokPEDtm2TTCpwL7BMVAhmQjKpwFZgkSiRL2kQCyw1iA9BX+OT4SqB/UY03BRRDTZYLux5HgznartE64rXtK54RDRnE32hxQdzdtUnSk27v0GDtQZRg7caFJrXKi40rn2Q1b7WxITXTEQ1KbJkRPMZ8mjG9Q80xu9qAngU7PQkTUKuFiAwMqDm9CB5rdGZ1jWsNeP1loLbCDpYIcckcfncG1hgYElDq5Hx30hBtAtzJq63tTHRVgjS+BXEEJ+Ka804Q1RI1HQELqNbZ7VJF0jSzE0aCFt/KqSzQEZ8x3HXkWO1kjdrYPdr0jvAP3gcfDSP5iPNa3jop1YqkOFz7VfIjwADAFNEG9+sJfueAAAAAElFTkSuQmCC",
    cloud: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAOAQMAAABq27xCAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURQAAANra2jioH3YAAAABdFJOUwBA5thmAAAASUlEQVQI12NgYGCoYAAB/nNgSoIZTBUwgikHxgcQyh5IMh9gAomyMTAARZn/AJkKIA4DgwUDC4jiYMhxAFIsDAfs/////4cBAgDMnwxBYQzpYwAAAABJRU5ErkJggg==",
    horizon:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAAMCAMAAABFuLTgAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFU1NT////icjw0wAAAAJ0Uk5T/wDltzBKAAAA80lEQVR42uyawRLCIAxE1///aWe8VKcWBTZQwttDD06LsHkJKVM9EEorvYQPdgOnGUswUeZ0O66o3cC/f6dgIdTRHbynF3IZONNYQolSdweULLeBH14ON1YIJdUPzsmBRgPnFhA2ErR3/0AOLBU2LEDbntCwZ29TsKLjbARpMpK5U8K9OriCq+LqFLJ6lc7v3OeBLYVYA6dS+M9m1zvCVfuoTmusGAGu4MrL1S79sG4yRgSxvfPnrQiuluFKnjuvPoaN3VGM7f2XCayZxyMnrfBB4AquztGv+l7F1+Sn3Nblf0k5RtTNodQlJ3AFV56IPgUYALZLMrWPTV11AAAAAElFTkSuQmCC",
    restart:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAgCAMAAABNTyq8AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF9/f3U1NT////CSwXiwAAAAN0Uk5T//8A18oNQQAAAGRJREFUeNrU1DEOwCAMA0A7/390SQfUlMh4QWojBoRvIhBEBGQlGIuyUuxMKmzNUOcQLAQLQaJ5fU2wmPsINWkNgRLVnYieiAaigfhHtJRsSzV9g1/m5PP9BLK+uTcwjNFzCTAAIwQDhEcwxhsAAAAASUVORK5CYII=",
    text: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL8AAAAYCAMAAACcLdxiAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFU1NT////icjw0wAAAAJ0Uk5T/wDltzBKAAABLUlEQVR42tyYWw6EIAxFb/e/6ZlkBPpWGNAgH8bUUo7lthhBhO+gYxx3+I1218zSVO7QjNK9mOi4ingTBkjRsIXVeqFJ8MO3reQvCeL89UriKXMm68JZPRv4Hk/iD2ND2SoI4LwJ8QQ/z++rhkKteNVh/e7mN6pR0tH8bSpPwgP8qsQsg9VFjaCm36Af6Ngi+4bf13XAj9X8VOtN8uu+Iir0hD+esYCfUr1a0TinmybmT1UW5vf/7fm3Hm/gj/Y0MsoSJyGbXBuBR29Mrm+K1o3XKhXSzZ/wjPEXlPBk6+K/cthEnJk9i4MLPj05fIh/4p6O8eeadOPgRfx9OvGq5h/9nPSlrI2Jz/vd+Gv/7K+pufz5WePGqfzB2w/wD59f0Vdp3uv8fySb8X8EGAA/5gx4wAEd5wAAAABJRU5ErkJggg==",
}

const CONFIG = {
    ACCELERATION: 0.001,
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10,
    CLEAR_TIME: 3000,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 13,
    SPEED: 6,
}

const DIMENSIONS = { WIDTH: 600, HEIGHT: 150 }
const TREX = { WIDTH: 44, HEIGHT: 47, START_X_POS: 50 }
const TREX_BOXES = [
    { x: 1, y: -1, width: 30, height: 26 },
    { x: 32, y: 0, width: 8, height: 16 },
    { x: 10, y: 35, width: 14, height: 8 },
    { x: 1, y: 24, width: 29, height: 5 },
    { x: 5, y: 30, width: 21, height: 4 },
    { x: 9, y: 34, width: 15, height: 4 },
]
const CACTUS_TYPES = [
    {
        name: "small",
        width: 17,
        height: 35,
        sourceWidth: 102,
        boxes: [
            { x: 0, y: 7, width: 5, height: 27 },
            { x: 4, y: 0, width: 6, height: 34 },
            { x: 10, y: 4, width: 7, height: 14 },
        ],
    },
    {
        name: "large",
        width: 25,
        height: 50,
        sourceWidth: 150,
        boxes: [
            { x: 0, y: 12, width: 7, height: 38 },
            { x: 8, y: 0, width: 7, height: 49 },
            { x: 13, y: 10, width: 10, height: 38 },
        ],
    },
]

type Props = {
    style?: React.CSSProperties
    background: string
    autoStart: boolean
    showScore: boolean
    rounded: number
    aspectRatio: number
}

type Box = { x: number; y: number; width: number; height: number }
type Obstacle = {
    x: number
    y: number
    size: number
    type: (typeof CACTUS_TYPES)[number]
    scored: boolean
}
type Cloud = { x: number; y: number; gap: number }
type Game = {
    running: boolean
    crashed: boolean
    distance: number
    speed: number
    runningTime: number
    nextObstacleGap: number
    trexY: number
    jumpVelocity: number
    jumping: boolean
    obstacles: Obstacle[]
    clouds: Cloud[]
}

const defaultProps: Props & { width: number; height: number } = {
    width: DIMENSIONS.WIDTH,
    height: DIMENSIONS.HEIGHT,
    background: "#F7F7F7",
    autoStart: false,
    showScore: true,
    rounded: 0,
    aspectRatio: DIMENSIONS.WIDTH / DIMENSIONS.HEIGHT,
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DinoGame(props: Partial<Props>) {
    const isStaticRenderer = useIsStaticRenderer()
    const { style, background, autoStart, showScore, rounded, aspectRatio } = {
        ...defaultProps,
        ...props,
    }
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const frameRef = React.useRef<number | null>(null)
    const imagesRef = React.useRef<Record<string, HTMLImageElement>>({})
    const sizeRef = React.useRef({
        width: DIMENSIONS.WIDTH,
        height: DIMENSIONS.HEIGHT,
        dpr: 1,
    })
    const gameRef = React.useRef(createGame(autoStart))
    const keyRef = React.useRef(false)
    const [assetsReady, setAssetsReady] = React.useState(false)

    const reset = React.useCallback(() => {
        gameRef.current = createGame(true)
    }, [])

    const jump = React.useCallback(() => {
        const game = gameRef.current

        if (game.crashed || !game.running) {
            reset()
            return
        }

        if (!game.jumping) {
            game.jumping = true
            game.jumpVelocity = -CONFIG.INITIAL_JUMP_VELOCITY
        }
    }, [reset])

    React.useEffect(() => {
        gameRef.current.running = autoStart
    }, [autoStart])

    React.useEffect(() => {
        const entries = Object.entries(ASSETS)
        let active = true
        let loaded = 0

        for (const [key, source] of entries) {
            const image = new Image()
            image.src = source
            image.onload = () => {
                if (active) imagesRef.current[key] = image
                loaded += 1
                if (active && loaded === entries.length) {
                    setAssetsReady(true)
                }
            }
            imagesRef.current[key] = image
        }

        return () => {
            active = false
        }
    }, [])

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            const bounds = canvas.getBoundingClientRect()
            const width = Math.max(1, bounds.width)
            const height = Math.max(1, bounds.height || width / aspectRatio)
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            sizeRef.current = { width, height, dpr }
            canvas.width = Math.round(width * dpr)
            canvas.height = Math.round(height * dpr)
        }

        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(canvas)
        return () => observer.disconnect()
    }, [aspectRatio])

    React.useEffect(() => {
        if (isStaticRenderer) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space" && event.code !== "ArrowUp") return
            event.preventDefault()
            if (!keyRef.current) jump()
            keyRef.current = true
        }
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space" || event.code === "ArrowUp")
                keyRef.current = false
        }
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
        }
    }, [isStaticRenderer, jump])

    React.useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas?.getContext("2d")
        if (!canvas || !context) return

        if (isStaticRenderer) {
            const staticGame = createStaticPreviewGame(sizeRef.current)
            drawGame(
                context,
                sizeRef.current,
                staticGame,
                imagesRef.current,
                background,
                showScore
            )
            return
        }

        let lastTime = performance.now()
        const tick = (time: number) => {
            const deltaTime = Math.min(time - lastTime, 34)
            lastTime = time
            updateGame(gameRef.current, sizeRef.current, deltaTime)
            drawGame(
                context,
                sizeRef.current,
                gameRef.current,
                imagesRef.current,
                background,
                showScore
            )
            frameRef.current = requestAnimationFrame(tick)
        }

        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
    }, [assetsReady, background, isStaticRenderer, showScore])

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label="Chrome Dino runner. Press space, arrow up, or tap to jump."
            onPointerDown={isStaticRenderer ? undefined : jump}
            style={{
                ...style,
                width: style?.width ?? "100%",
                height: style?.height ?? "auto",
                aspectRatio,
                overflow: "hidden",
                borderRadius: rounded,
                background,
                cursor: isStaticRenderer ? "default" : "pointer",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

function createGame(running: boolean): Game {
    return {
        running,
        crashed: false,
        distance: 0,
        speed: CONFIG.SPEED,
        runningTime: 0,
        nextObstacleGap: 120,
        trexY: 0,
        jumpVelocity: 0,
        jumping: false,
        obstacles: [],
        clouds: [
            { x: 180, y: 28, gap: 160 },
            { x: 420, y: 48, gap: 220 },
        ],
    }
}

function createStaticPreviewGame(size: {
    width: number
    height: number
}): Game {
    const scale = size.height / DIMENSIONS.HEIGHT
    const groundY = size.height - CONFIG.BOTTOM_PAD * scale
    const smallCactus = CACTUS_TYPES[0]
    const largeCactus = CACTUS_TYPES[1]

    return {
        running: false,
        crashed: false,
        distance: 240,
        speed: CONFIG.SPEED,
        runningTime: 0,
        nextObstacleGap: 120,
        trexY: groundY - TREX.HEIGHT * scale,
        jumpVelocity: 0,
        jumping: false,
        obstacles: [
            {
                x: Math.max(
                    size.width * 0.58,
                    TREX.START_X_POS * scale + 120 * scale
                ),
                y: groundY - largeCactus.height * scale,
                size: 1,
                type: largeCactus,
                scored: false,
            },
            {
                x: Math.max(
                    size.width * 0.78,
                    TREX.START_X_POS * scale + 220 * scale
                ),
                y: groundY - smallCactus.height * scale,
                size: 2,
                type: smallCactus,
                scored: false,
            },
        ],
        clouds: [
            { x: size.width * 0.3, y: 28 * scale, gap: 160 },
            { x: size.width * 0.68, y: 48 * scale, gap: 220 },
        ],
    }
}

function updateGame(
    game: Game,
    size: { width: number; height: number },
    deltaTime: number
) {
    const scale = size.height / DIMENSIONS.HEIGHT
    const groundY = size.height - CONFIG.BOTTOM_PAD * scale
    const frameDelta = deltaTime / (1000 / 60)

    if (!game.trexY) game.trexY = groundY - TREX.HEIGHT * scale
    if (!game.running || game.crashed) return

    game.runningTime += deltaTime
    game.distance += game.speed * frameDelta
    if (game.speed < CONFIG.MAX_SPEED)
        game.speed += CONFIG.ACCELERATION * deltaTime

    if (game.jumping) {
        game.trexY += game.jumpVelocity * frameDelta * scale
        game.jumpVelocity += CONFIG.GRAVITY * frameDelta
        const floor = groundY - TREX.HEIGHT * scale
        if (game.trexY >= floor) {
            game.trexY = floor
            game.jumpVelocity = 0
            game.jumping = false
        }
    }

    if (game.runningTime > CONFIG.CLEAR_TIME) {
        game.nextObstacleGap -= game.speed * frameDelta
        if (game.nextObstacleGap <= 0) {
            const obstacle = createObstacle(size.width, scale)
            game.obstacles.push(obstacle)
            game.nextObstacleGap =
                getObstacleGap(
                    obstacle.type.width * obstacle.size,
                    game.speed
                ) * scale
        }
    }

    for (const obstacle of game.obstacles) {
        obstacle.x -= game.speed * frameDelta * scale
        if (
            !obstacle.scored &&
            obstacle.x + obstacle.type.width * obstacle.size * scale <
                TREX.START_X_POS * scale
        ) {
            obstacle.scored = true
        }
    }
    game.obstacles = game.obstacles.filter(
        (obstacle) =>
            obstacle.x + obstacle.type.width * obstacle.size * scale > 0
    )

    for (const cloud of game.clouds) {
        cloud.x -= game.speed * CONFIG.BG_CLOUD_SPEED * frameDelta * scale
        if (cloud.x < -46 * scale) {
            cloud.x = size.width + cloud.gap * scale
            cloud.y = random(30, 71) * scale
            cloud.gap = random(100, 400)
        }
    }

    const trexBoxes = TREX_BOXES.map((box) =>
        scaleBox(box, TREX.START_X_POS * scale, game.trexY, scale)
    )
    for (const obstacle of game.obstacles) {
        const obstacleBoxes = obstacle.type.boxes.map((box) =>
            scaleBox(box, obstacle.x, obstacle.y, scale)
        )
        if (hasCollision(trexBoxes, obstacleBoxes)) {
            game.crashed = true
            game.running = false
        }
    }
}

function createObstacle(width: number, scale: number): Obstacle {
    const type = CACTUS_TYPES[Math.random() > 0.5 ? 1 : 0]
    const maxSize = Math.min(
        CONFIG.MAX_OBSTACLE_LENGTH,
        Math.floor(type.sourceWidth / type.width)
    )
    const size = 1 + Math.floor(Math.random() * maxSize)
    return {
        x: width,
        y:
            DIMENSIONS.HEIGHT * scale -
            CONFIG.BOTTOM_PAD * scale -
            type.height * scale,
        size,
        type,
        scored: false,
    }
}

function getObstacleGap(width: number, speed: number) {
    const minGap =
        Math.round(width * speed + DIMENSIONS.WIDTH) * CONFIG.GAP_COEFFICIENT
    return minGap + Math.random() * minGap
}

function drawGame(
    context: CanvasRenderingContext2D,
    size: { width: number; height: number; dpr: number },
    game: Game,
    images: Record<string, HTMLImageElement>,
    background: string,
    showScore: boolean
) {
    const scale = size.height / DIMENSIONS.HEIGHT
    context.setTransform(size.dpr, 0, 0, size.dpr, 0, 0)
    context.clearRect(0, 0, size.width, size.height)
    context.fillStyle = background
    context.fillRect(0, 0, size.width, size.height)
    context.imageSmoothingEnabled = false

    drawClouds(context, images.cloud, game.clouds, scale)
    drawHorizon(context, images.horizon, game.distance, size, scale)
    drawObstacles(context, images, game.obstacles, scale)
    drawTrex(context, images.trex, game, scale)
    if (showScore) drawScore(context, images.text, game.distance, size, scale)
    if (!game.running || game.crashed)
        drawOverlay(context, images.restart, game, size, scale)
}

function drawClouds(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    clouds: Cloud[],
    scale: number
) {
    if (!image?.complete) return
    for (const cloud of clouds) {
        context.drawImage(image, cloud.x, cloud.y, 46 * scale, 14 * scale)
    }
}

function drawHorizon(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    distance: number,
    size: { width: number; height: number },
    scale: number
) {
    if (!image?.complete) return
    const y = size.height - 24 * scale
    const tileWidth = 1200 * scale
    const offset = -(distance * scale) % tileWidth
    context.drawImage(image, offset, y, tileWidth, 12 * scale)
    context.drawImage(image, offset + tileWidth, y, tileWidth, 12 * scale)
}

function drawObstacles(
    context: CanvasRenderingContext2D,
    images: Record<string, HTMLImageElement>,
    obstacles: Obstacle[],
    scale: number
) {
    for (const obstacle of obstacles) {
        const image =
            obstacle.type.name === "large"
                ? images.cactusLarge
                : images.cactusSmall
        if (!image?.complete) continue
        const sourceWidth = obstacle.type.width * obstacle.size
        context.drawImage(
            image,
            0,
            0,
            sourceWidth,
            obstacle.type.height,
            obstacle.x,
            obstacle.y,
            sourceWidth * scale,
            obstacle.type.height * scale
        )
    }
}

function drawTrex(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    game: Game,
    scale: number
) {
    if (!image?.complete) return
    const frame = game.crashed
        ? 220
        : game.jumping
          ? 0
          : Math.floor(game.distance / 12) % 2
            ? 88
            : 132
    context.drawImage(
        image,
        frame,
        0,
        TREX.WIDTH,
        TREX.HEIGHT,
        TREX.START_X_POS * scale,
        game.trexY,
        TREX.WIDTH * scale,
        TREX.HEIGHT * scale
    )
}

function drawScore(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    distance: number,
    size: { width: number },
    scale: number
) {
    if (!image?.complete) return
    const actualDistance = Math.round(distance * 0.025)
    const digits = String(actualDistance).padStart(5, "0").slice(-5)
    const digitWidth = 10
    const digitHeight = 13
    const gap = 11
    const x = size.width - gap * 6 * scale
    for (let index = 0; index < digits.length; index++) {
        const value = Number(digits[index])
        context.drawImage(
            image,
            value * digitWidth,
            0,
            digitWidth,
            digitHeight,
            x + index * gap * scale,
            5 * scale,
            digitWidth * scale,
            digitHeight * scale
        )
    }
}

function drawOverlay(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    game: Game,
    size: { width: number; height: number },
    scale: number
) {
    if (game.crashed && image?.complete) {
        context.drawImage(
            image,
            size.width / 2 - 18 * scale,
            size.height / 2 - 16 * scale,
            36 * scale,
            32 * scale
        )
        return
    }
    context.fillStyle = "#535353"
    context.font = `${12 * scale}px Arial, sans-serif`
    context.textAlign = "center"
    context.fillText("Press space to start", size.width / 2, size.height / 2)
}

function scaleBox(box: Box, x: number, y: number, scale: number): Box {
    return {
        x: x + box.x * scale,
        y: y + box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
    }
}

function hasCollision(first: Box[], second: Box[]) {
    for (const a of first) {
        for (const b of second) {
            if (
                a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y
            ) {
                return true
            }
        }
    }
    return false
}

function random(min: number, max: number) {
    return min + Math.random() * (max - min)
}

Object.assign(DinoGame, { defaultProps })

addPropertyControls(DinoGame, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaultProps.background,
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: defaultProps.autoStart,
    },
    showScore: {
        type: ControlType.Boolean,
        title: "Score",
        defaultValue: defaultProps.showScore,
    },
    rounded: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 32,
        step: 1,
        defaultValue: defaultProps.rounded,
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Ratio",
        min: 1,
        max: 6,
        step: 0.01,
        displayStepper: true,
        defaultValue: defaultProps.aspectRatio,
    },
})
