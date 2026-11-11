import * as React from "react"
import Matter from "matter-js"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// User request: Create a "Physics Sticker Wall" Framer component using matter.js with image-based falling stickers, drag/throw interaction, responsive bounds, resize handling, cleanup, and full property controls for images/background/physics/size/randomness/throw/border radius.

interface MyComponentProps {
    images: { src?: string; srcSet?: string; alt?: string }[]
    background: string
    stickerCount: number
    stickerSize: number
    sizeRandomness: number
    gravityStrength: number
    restitution: number
    friction: number
    throwPower: number
    borderRadius: number
    style?: React.CSSProperties
}

type StickerMeta = {
    body: Matter.Body
    imageIndex: number
    width: number
    height: number
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PhysicsStickerWall(props: MyComponentProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
        ],
        background,
        stickerCount,
        stickerSize,
        sizeRandomness,
        gravityStrength,
        restitution,
        friction,
        throwPower,
        borderRadius,
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const engineRef = React.useRef<Matter.Engine | null>(null)
    const runnerRef = React.useRef<Matter.Runner | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const boundariesRef = React.useRef<Matter.Body[]>([])
    const stickersRef = React.useRef<StickerMeta[]>([])
    const loadedImagesRef = React.useRef<HTMLImageElement[]>([])
    const dragRef = React.useRef<{
        body: Matter.Body | null
        points: { x: number; y: number; t: number }[]
    }>({ body: null, points: [] })
    const sizeRef = React.useRef({ width: 300, height: 300, dpr: 1 })

    const isStaticRenderer = useIsStaticRenderer()
    const isInView = useInView(rootRef, { amount: 0.01 })

    const activeImageSources = React.useMemo(() => {
        const valid = (images || []).filter((img) => img?.src)
        return valid.length > 0
            ? valid
            : [
                  {
                      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                      alt: "Gradient 1 - Blue",
                  },
              ]
    }, [images])

    const randomInRange = React.useCallback((min: number, max: number) => {
        return min + Math.random() * (max - min)
    }, [])

    const drawRoundedImage = React.useCallback(
        (
            ctx: CanvasRenderingContext2D,
            image: HTMLImageElement,
            x: number,
            y: number,
            w: number,
            h: number,
            angle: number,
            radius: number
        ) => {
            const r = Math.max(0, Math.min(radius, Math.min(w, h) / 2))
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.beginPath()
            ctx.moveTo(-w / 2 + r, -h / 2)
            ctx.lineTo(w / 2 - r, -h / 2)
            ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
            ctx.lineTo(w / 2, h / 2 - r)
            ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
            ctx.lineTo(-w / 2 + r, h / 2)
            ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
            ctx.lineTo(-w / 2, -h / 2 + r)
            ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(image, -w / 2, -h / 2, w, h)
            ctx.restore()
        },
        []
    )

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!isInView) return
        if (typeof window === "undefined") return
        if (!rootRef.current || !canvasRef.current) return

        const {
            Engine,
            Runner,
            Bodies,
            Composite,
            Body,
            Query,
            Sleeping,
            Events,
        } = Matter

        const root = rootRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let isDisposed = false

        const engine = Engine.create({
            enableSleeping: true,
            positionIterations: 11,
            velocityIterations: 9,
            constraintIterations: 2,
        })
        engine.gravity.x = 0
        engine.gravity.y = gravityStrength
        engineRef.current = engine

        const runner = Runner.create()
        runnerRef.current = runner

        const setCanvasSize = () => {
            const rect = root.getBoundingClientRect()
            const width = Math.max(1, rect.width)
            const height = Math.max(1, rect.height)
            const dpr = Math.max(1, window.devicePixelRatio || 1)
            canvas.width = Math.floor(width * dpr)
            canvas.height = Math.floor(height * dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            sizeRef.current = { width, height, dpr }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        const rebuildBoundaries = () => {
            const { width, height } = sizeRef.current
            if (boundariesRef.current.length > 0) {
                Composite.remove(engine.world, boundariesRef.current)
                boundariesRef.current = []
            }
            const wallThickness = 160
            const floor = Bodies.rectangle(
                width / 2,
                height + wallThickness / 2,
                width + wallThickness * 2,
                wallThickness,
                { isStatic: true, restitution: 0.05, friction: 0.9 }
            )
            const leftWall = Bodies.rectangle(
                -wallThickness / 2,
                height / 2,
                wallThickness,
                height * 3,
                { isStatic: true, restitution: 0.05, friction: 0.9 }
            )
            const rightWall = Bodies.rectangle(
                width + wallThickness / 2,
                height / 2,
                wallThickness,
                height * 3,
                { isStatic: true, restitution: 0.05, friction: 0.9 }
            )
            boundariesRef.current = [floor, leftWall, rightWall]
            Composite.add(engine.world, boundariesRef.current)
        }

        const loadImages = async () => {
            const requests = activeImageSources.map((img) => {
                return new Promise<HTMLImageElement | null>((resolve) => {
                    if (!img?.src) {
                        resolve(null)
                        return
                    }
                    const el = new Image()
                    el.crossOrigin = "anonymous"
                    el.decoding = "async"
                    el.onload = () => resolve(el)
                    el.onerror = () => resolve(null)
                    el.src = img.src
                })
            })
            const results = await Promise.all(requests)
            loadedImagesRef.current = results.filter(
                (x): x is HTMLImageElement => x !== null
            )
        }

        const spawnStickers = () => {
            const { width } = sizeRef.current
            const safeCount = Math.max(1, Math.floor(stickerCount))
            const bodies: StickerMeta[] = []
            const imageCount = Math.max(1, loadedImagesRef.current.length)

            for (let i = 0; i < safeCount; i++) {
                const randomScale =
                    1 + randomInRange(-sizeRandomness, sizeRandomness)
                const s = Math.max(20, stickerSize * randomScale)
                const aspect = randomInRange(0.8, 1.25)
                const w = s
                const h = s / aspect
                const baseX = ((i + 0.5) / safeCount) * width
                const x = baseX + randomInRange(-width * 0.1, width * 0.1)
                const y = -i * (h * 0.7) - randomInRange(20, 180)
                const angle = randomInRange(-0.45, 0.45)

                const body = Bodies.rectangle(x, y, w, h, {
                    restitution,
                    friction,
                    frictionStatic: Math.min(1, friction + 0.3),
                    frictionAir: 0.01 + friction * 0.03,
                    slop: 0.05,
                    sleepThreshold: 28,
                })
                Body.setAngle(body, angle)
                Sleeping.set(body, false)

                bodies.push({
                    body,
                    imageIndex: i % imageCount,
                    width: w,
                    height: h,
                })
            }
            stickersRef.current = bodies
            Composite.add(
                engine.world,
                bodies.map((s) => s.body)
            )
        }

        const getPointerWorld = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }
        }

        const onPointerDown = (event: PointerEvent) => {
            const pos = getPointerWorld(event)
            const hit = Query.point(
                stickersRef.current.map((s) => s.body),
                pos
            )
            if (hit.length > 0) {
                const body = hit[hit.length - 1]
                dragRef.current.body = body
                dragRef.current.points = [{ ...pos, t: performance.now() }]
                Sleeping.set(body, false)
                canvas.setPointerCapture(event.pointerId)
            }
        }

        const onPointerMove = (event: PointerEvent) => {
            const dragBody = dragRef.current.body
            if (!dragBody) return
            const pos = getPointerWorld(event)
            const now = performance.now()
            dragRef.current.points.push({ ...pos, t: now })
            if (dragRef.current.points.length > 8) {
                dragRef.current.points.shift()
            }
            const stiffness = 0.22
            const dx = pos.x - dragBody.position.x
            const dy = pos.y - dragBody.position.y
            Body.setVelocity(dragBody, {
                x: dx * stiffness,
                y: dy * stiffness,
            })
            Body.setAngularVelocity(dragBody, 0)
        }

        const onPointerUp = (event: PointerEvent) => {
            const dragBody = dragRef.current.body
            if (!dragBody) return
            const points = dragRef.current.points
            const first = points[0]
            const last = points[points.length - 1]
            if (first && last && last.t > first.t) {
                const dt = last.t - first.t
                const vx = ((last.x - first.x) / dt) * 16.67 * throwPower
                const vy = ((last.y - first.y) / dt) * 16.67 * throwPower
                Body.setVelocity(dragBody, { x: vx, y: vy })
            }
            dragRef.current.body = null
            dragRef.current.points = []
            if (canvas.hasPointerCapture(event.pointerId)) {
                canvas.releasePointerCapture(event.pointerId)
            }
        }

        const render = () => {
            if (isDisposed) return
            const { width, height } = sizeRef.current
            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = background
            ctx.fillRect(0, 0, width, height)

            const imgs = loadedImagesRef.current
            stickersRef.current.forEach((sticker, index) => {
                const { body } = sticker
                const image =
                    imgs[sticker.imageIndex % Math.max(1, imgs.length)] || null
                if (image) {
                    drawRoundedImage(
                        ctx,
                        image,
                        body.position.x,
                        body.position.y,
                        sticker.width,
                        sticker.height,
                        body.angle,
                        borderRadius
                    )
                } else {
                    ctx.save()
                    ctx.translate(body.position.x, body.position.y)
                    ctx.rotate(body.angle)
                    ctx.fillStyle = index % 2 === 0 ? "#EEEEEE" : "#CCCCCC"
                    ctx.fillRect(
                        -sticker.width / 2,
                        -sticker.height / 2,
                        sticker.width,
                        sticker.height
                    )
                    ctx.restore()
                }
            })
            rafRef.current = window.requestAnimationFrame(render)
        }

        const onBeforeUpdate = () => {
            if (dragRef.current.body) {
                Sleeping.set(dragRef.current.body, false)
            }
        }

        const setup = async () => {
            setCanvasSize()
            rebuildBoundaries()
            await loadImages()
            if (isDisposed) return
            spawnStickers()
            Events.on(engine, "beforeUpdate", onBeforeUpdate)
            Runner.run(runner, engine)
            rafRef.current = window.requestAnimationFrame(render)
        }

        setup()

        resizeObserverRef.current = new ResizeObserver(() => {
            setCanvasSize()
            rebuildBoundaries()
        })
        resizeObserverRef.current.observe(root)

        canvas.addEventListener("pointerdown", onPointerDown)
        canvas.addEventListener("pointermove", onPointerMove)
        canvas.addEventListener("pointerup", onPointerUp)
        canvas.addEventListener("pointercancel", onPointerUp)
        canvas.addEventListener("pointerleave", onPointerUp)

        return () => {
            isDisposed = true
            canvas.removeEventListener("pointerdown", onPointerDown)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerup", onPointerUp)
            canvas.removeEventListener("pointercancel", onPointerUp)
            canvas.removeEventListener("pointerleave", onPointerUp)

            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
                resizeObserverRef.current = null
            }

            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }

            Events.off(engine, "beforeUpdate", onBeforeUpdate)
            Runner.stop(runner)
            Composite.clear(engine.world, false)
            Engine.clear(engine)

            boundariesRef.current = []
            stickersRef.current = []
            loadedImagesRef.current = []
            dragRef.current = { body: null, points: [] }
            engineRef.current = null
            runnerRef.current = null
        }
    }, [
        activeImageSources,
        background,
        borderRadius,
        friction,
        gravityStrength,
        isStaticRenderer,
        isInView,
        randomInRange,
        restitution,
        sizeRandomness,
        stickerCount,
        stickerSize,
        throwPower,
        drawRoundedImage,
    ])

    const staticPreviewItems = React.useMemo(() => {
        const max = Math.min(6, Math.max(1, stickerCount))
        return Array.from({ length: max }, (_, i) => {
            const srcObj = activeImageSources[i % activeImageSources.length]
            return {
                src: srcObj?.src ?? "",
                alt: srcObj?.alt ?? "",
                left: 10 + (i % 3) * 28,
                top: 8 + Math.floor(i / 3) * 30,
                rotate: -14 + i * 7,
                scale: 0.9 + (i % 2) * 0.06,
            }
        })
    }, [activeImageSources, stickerCount])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            {isStaticRenderer ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        background,
                    }}
                >
                    {staticPreviewItems.map((item, index) => (
                        <img
                            key={`${item.src}-${index}`}
                            src={item.src}
                            alt={item.alt || ""}
                            style={{
                                position: "absolute",
                                left: `${item.left}%`,
                                top: `${item.top}%`,
                                width: `${Math.max(40, stickerSize * item.scale)}px`,
                                height: "auto",
                                borderRadius,
                                transform: `rotate(${item.rotate}deg)`,
                                objectFit: "cover",
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    ))}
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        touchAction: "none",
                        cursor: "grab",
                    }}
                    role="application"
                    aria-label="Physics Sticker Wall"
                />
            )}
        </div>
    )
}

addPropertyControls(PhysicsStickerWall, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 10,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
        ],
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    stickerCount: {
        type: ControlType.Number,
        title: "Stickers",
        defaultValue: 12,
        min: 1,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    stickerSize: {
        type: ControlType.Number,
        title: "Sticker Size",
        defaultValue: 120,
        min: 40,
        max: 400,
        step: 1,
        unit: "px",
    },
    sizeRandomness: {
        type: ControlType.Number,
        title: "Size Random",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.01,
    },
    gravityStrength: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.01,
    },
    restitution: {
        type: ControlType.Number,
        title: "Bounciness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
    },
    throwPower: {
        type: ControlType.Number,
        title: "Throw Power",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.05,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 14,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
})