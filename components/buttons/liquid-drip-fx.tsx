import React, { useRef, useId, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DrippingProps {
    numberOfDrips?: number
    dripRadius?: number
    topBarHeight?: number
    sideMargin?: number
    speed?: number
    viscosity?: number
    gravity?: number
    maxDripLength?: number
    blurAmount?: number
    thresholdIntensity?: number
    dripColor?: string
    simpleDrips?: boolean
    preview?: boolean
}

interface DripState {
    index: number
    jitterOffset: number
    dripVariation: number
    anchorX: number
    x: number
    y: number
    radius: number
    dropletRadius: number
    neckRadius: number
    speedY: number
    vy: number
    stretchLength: number
    dripState: "stretching" | "falling"
    timeInFall: number
    cooldownTimer: number
}

/**
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function LiquidDripFX({
    numberOfDrips = 7,
    dripRadius = 2,
    topBarHeight = 6,
    sideMargin = 0,
    speed = 0.8,
    viscosity = 60,
    gravity = 0.015,
    maxDripLength = 10,
    blurAmount = 4,
    thresholdIntensity = 78,
    dripColor = "#0066ff",
    simpleDrips = false,
    preview = false,
}: DrippingProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const filterId = useId()

    // Kuka za detekciju statičnog konteksta (canvas/export)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic || preview

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const effectiveDripRadius =
            dripRadius < blurAmount
                ? dripRadius + (blurAmount - dripRadius) * 0.6
                : dripRadius

        let animationFrameId: number | null = null
        let width = containerRef.current?.clientWidth || window.innerWidth
        let height = containerRef.current?.clientHeight || window.innerHeight
        let drawWidth = width * 1.2
        let lastTime = performance.now()
        let viewportBottom = height

        const offsetX = (drawWidth - width) / 2
        const spawnWidth = Math.max(10, width - sideMargin * 2)
        const slotWidth = spawnWidth / numberOfDrips

        const drips: DripState[] = Array.from(
            { length: numberOfDrips },
            (_, i) => {
                const jitterOffset = Math.random() - 0.5
                const dripVariation = 0.35 + 0.65 * (((i * 13) % 10) / 10)
                const maxJitter = Math.max(
                    0,
                    slotWidth - effectiveDripRadius * 2
                )
                const anchorX =
                    offsetX +
                    sideMargin +
                    i * slotWidth +
                    slotWidth / 2 +
                    jitterOffset * maxJitter

                const baseSpawnLength = Math.max(
                    effectiveDripRadius * 1.5,
                    height * (maxDripLength / 100) * dripVariation
                )
                const stretchDistance =
                    effectiveDripRadius * 2.5 + (viscosity / 100) * 45
                const detachThreshold = baseSpawnLength + stretchDistance

                return {
                    index: i,
                    jitterOffset,
                    dripVariation,
                    anchorX,
                    x: anchorX,
                    y: topBarHeight,
                    radius: effectiveDripRadius,
                    dropletRadius: effectiveDripRadius,
                    neckRadius: effectiveDripRadius,
                    speedY: 0,
                    vy: 0,
                    stretchLength:
                        baseSpawnLength +
                        Math.random() *
                            (detachThreshold - baseSpawnLength) *
                            0.7,
                    dripState: "stretching",
                    timeInFall: 0,
                    cooldownTimer: 0,
                }
            }
        )

        const resetDrip = (drip: DripState, isInitial = false) => {
            const maxJitter = Math.max(0, slotWidth - effectiveDripRadius * 2)
            drip.anchorX =
                offsetX +
                sideMargin +
                drip.index * slotWidth +
                slotWidth / 2 +
                drip.jitterOffset * maxJitter

            drip.x = drip.anchorX
            drip.y = topBarHeight
            drip.radius = effectiveDripRadius
            drip.dropletRadius = effectiveDripRadius
            drip.speedY = 0
            drip.vy = 0
            drip.timeInFall = 0
            drip.dripState = "stretching"

            const baseSpawnLength = Math.max(
                effectiveDripRadius * 1.5,
                height * (maxDripLength / 100) * drip.dripVariation
            )

            if (isInitial) {
                drip.neckRadius = effectiveDripRadius
                const stretchDistance =
                    effectiveDripRadius * 2.5 + (viscosity / 100) * 45
                const detachThreshold = baseSpawnLength + stretchDistance
                drip.stretchLength =
                    baseSpawnLength +
                    Math.random() * (detachThreshold - baseSpawnLength) * 0.7
                drip.cooldownTimer = 0
            } else {
                drip.cooldownTimer = 20 + Math.random() * 40
            }
        }

        const drawTeardrop = (
            context: CanvasRenderingContext2D,
            r: number,
            x: number,
            y: number,
            scaleX: number,
            scaleY: number
        ) => {
            context.save()
            context.translate(x, y)
            context.scale(scaleX, scaleY)

            const topPointY = -r * 1.45
            const bulbCenterY = r * 0.35
            const bulbRadius = r * 0.95

            context.beginPath()
            context.moveTo(0, topPointY)
            context.bezierCurveTo(
                r * 0.75,
                -r * 0.6,
                bulbRadius * 1.1,
                bulbCenterY - r * 0.2,
                bulbRadius,
                bulbCenterY
            )
            context.arc(0, bulbCenterY, bulbRadius, 0, Math.PI, false)
            context.bezierCurveTo(
                -bulbRadius * 1.1,
                bulbCenterY - r * 0.2,
                -r * 0.75,
                -r * 0.6,
                0,
                topPointY
            )
            context.closePath()
            context.fill()

            context.restore()
        }

        const animate = (time: number, isStaticFrame = false) => {
            const now = time || performance.now()

            if (isStaticFrame) lastTime = now - 16

            const deltaTime = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const dtFactor = deltaTime * 60
            const speedFactor = speed * 0.4 * dtFactor

            ctx.clearRect(0, 0, drawWidth, canvas.height)
            ctx.fillStyle = dripColor

            if (topBarHeight > 0) {
                ctx.fillRect(0, 0, drawWidth, topBarHeight)
            }

            const retractionSpeed = 0.04 + (1 - viscosity / 100) * 0.15

            for (let i = 0; i < drips.length; i++) {
                const drip = drips[i]
                const baseSpawnLength = Math.max(
                    drip.radius * 1.5,
                    height * (maxDripLength / 100) * drip.dripVariation
                )
                const stretchDistance =
                    drip.radius * 2.5 + (viscosity / 100) * 45
                const detachThreshold = baseSpawnLength + stretchDistance

                if (drip.dripState === "stretching") {
                    if (drip.cooldownTimer > 0) {
                        drip.cooldownTimer -= speedFactor
                        drip.stretchLength +=
                            (baseSpawnLength - drip.stretchLength) *
                            retractionSpeed *
                            speedFactor
                        drip.neckRadius +=
                            (drip.radius - drip.neckRadius) *
                            retractionSpeed *
                            speedFactor
                    } else {
                        drip.x = drip.anchorX

                        const stretchProgress = Math.min(
                            1,
                            Math.max(
                                0,
                                (drip.stretchLength - baseSpawnLength) /
                                    stretchDistance
                            )
                        )

                        const baseGrowth = gravity * 100 * (1 - viscosity / 200)
                        const acceleration = 0.15 + stretchProgress * 1.2
                        const rawStretchSpeed = Math.max(
                            0.15,
                            baseGrowth * acceleration
                        )

                        drip.stretchLength += rawStretchSpeed * speedFactor

                        drip.neckRadius = Math.max(
                            1.5,
                            drip.radius * (1 - stretchProgress * 0.55)
                        )

                        if (drip.stretchLength >= detachThreshold) {
                            drip.dripState = "falling"
                            drip.x = drip.anchorX

                            const waterFactor = Math.max(
                                0,
                                Math.min(1, (60 - drip.radius) / 40)
                            )
                            const slimeRadius = drip.neckRadius * 1.15
                            const waterRadius = drip.radius * 0.95

                            drip.dropletRadius =
                                slimeRadius * (1 - waterFactor) +
                                waterRadius * waterFactor

                            drip.vy = rawStretchSpeed * 1.2
                            drip.timeInFall = 0

                            const initialScaleY = 1.35 + drip.vy * 0.02

                            if (simpleDrips) {
                                drip.y = topBarHeight + drip.stretchLength
                            } else {
                                const absoluteStretchingBottom =
                                    topBarHeight +
                                    drip.stretchLength +
                                    drip.neckRadius

                                const spawnOffset =
                                    drip.dropletRadius +
                                    drip.dropletRadius * 0.5

                                drip.y =
                                    absoluteStretchingBottom -
                                    drip.dropletRadius * 1.3 * initialScaleY -
                                    spawnOffset
                            }
                        }
                    }
                } else if (drip.dripState === "falling") {
                    drip.timeInFall += 0.08 * speedFactor

                    drip.stretchLength +=
                        (baseSpawnLength - drip.stretchLength) *
                        retractionSpeed *
                        speedFactor
                    drip.neckRadius +=
                        (drip.radius - drip.neckRadius) *
                        retractionSpeed *
                        speedFactor

                    const gravityAccel =
                        (gravity * 160 + 0.1) * (1 - viscosity / 300)
                    drip.vy += gravityAccel * speedFactor
                    drip.y += drip.vy * speedFactor

                    if (drip.y > viewportBottom + drip.radius * 3) {
                        resetDrip(drip, false)
                    }
                }

                const baseR = Math.max(1, drip.radius)
                const topY = -100

                if (simpleDrips) {
                    const totalLen =
                        topBarHeight + Math.max(baseR, drip.stretchLength)

                    ctx.beginPath()
                    ctx.moveTo(drip.anchorX - baseR, topY)
                    ctx.lineTo(drip.anchorX - baseR, totalLen)
                    ctx.arc(drip.anchorX, totalLen, baseR, Math.PI, 0, true)
                    ctx.lineTo(drip.anchorX + baseR, topY)
                    ctx.closePath()
                    ctx.fill()

                    if (drip.dripState === "falling") {
                        ctx.beginPath()
                        ctx.arc(
                            drip.x,
                            drip.y,
                            drip.dropletRadius,
                            0,
                            Math.PI * 2
                        )
                        ctx.fill()
                    }
                } else {
                    const nR = Math.max(1.5, drip.neckRadius)
                    const dripExt = Math.max(nR, drip.stretchLength)
                    const totalLen = topBarHeight + dripExt

                    const pinchY = topBarHeight + dripExt * 0.82
                    const stretchFactor = Math.min(
                        1,
                        Math.max(0, dripExt / (height || 1))
                    )
                    const pinchR = Math.max(
                        1.2,
                        nR * (1 - stretchFactor * 0.45)
                    )

                    ctx.beginPath()
                    ctx.moveTo(drip.anchorX - baseR, topY)
                    ctx.bezierCurveTo(
                        drip.anchorX - baseR,
                        topY + (pinchY - topY) * 0.6,
                        drip.anchorX - pinchR,
                        pinchY - (pinchY - topY) * 0.2,
                        drip.anchorX - pinchR,
                        pinchY
                    )
                    ctx.bezierCurveTo(
                        drip.anchorX - pinchR,
                        pinchY + (totalLen - pinchY) * 0.3,
                        drip.anchorX - nR,
                        totalLen - nR * 0.5,
                        drip.anchorX - nR,
                        totalLen
                    )
                    ctx.arc(drip.anchorX, totalLen, nR, Math.PI, 0, true)
                    ctx.bezierCurveTo(
                        drip.anchorX + nR,
                        totalLen - nR * 0.5,
                        drip.anchorX + pinchR,
                        pinchY + (totalLen - pinchY) * 0.3,
                        drip.anchorX + pinchR,
                        pinchY
                    )
                    ctx.bezierCurveTo(
                        drip.anchorX + pinchR,
                        pinchY - (pinchY - topY) * 0.2,
                        drip.anchorX + baseR,
                        topY + (pinchY - topY) * 0.6,
                        drip.anchorX + baseR,
                        topY
                    )
                    ctx.closePath()
                    ctx.fill()

                    if (drip.dripState === "falling") {
                        const velocityStretch = 1.35 + drip.vy * 0.02
                        const scaleY = velocityStretch
                        const scaleX = 1 / Math.sqrt(velocityStretch)

                        drawTeardrop(
                            ctx,
                            drip.dropletRadius,
                            drip.x,
                            drip.y,
                            scaleX,
                            scaleY
                        )
                    }
                }
            }

            if (!isStaticFrame) {
                animationFrameId = requestAnimationFrame((t) =>
                    animate(t, false)
                )
            }
        }

        const startAnimation = () => {
            if (shouldAnimate) {
                if (animationFrameId === null) {
                    lastTime = performance.now()
                    animationFrameId = requestAnimationFrame((t) =>
                        animate(t, false)
                    )
                }
            } else {
                animate(performance.now(), true)
            }
        }

        const stopAnimation = () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
                animationFrameId = null
            }
        }

        const handleResize = () => {
            if (!canvas || !containerRef.current) return
            width = containerRef.current.clientWidth || window.innerWidth
            height = containerRef.current.clientHeight || window.innerHeight
            drawWidth = width * 1.2

            const extendedHeight = Math.max(height, window.innerHeight + 300)
            const dpr = window.devicePixelRatio || 1

            canvas.width = drawWidth * dpr
            canvas.height = extendedHeight * dpr
            canvas.style.width = `${drawWidth}px`
            canvas.style.height = `${extendedHeight}px`
            ctx.scale(dpr, dpr)

            viewportBottom = extendedHeight

            drips.forEach((drip) => resetDrip(drip, true))

            if (!shouldAnimate) {
                animate(performance.now(), true)
            }
        }

        let resizeTimeout: number | undefined
        const debouncedResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout)
            resizeTimeout = window.setTimeout(handleResize, 100)
        }

        // Sada se prvo ispravno definiraju 'animate' i ostale funkcije prije poziva 'handleResize'
        handleResize()
        window.addEventListener("resize", debouncedResize)

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    startAnimation()
                } else {
                    stopAnimation()
                }
            },
            {
                threshold: 0,
                rootMargin: "50% 0px 50% 0px",
            }
        )

        if (canvas) {
            observer.observe(canvas)
        }

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", debouncedResize)
            if (resizeTimeout) clearTimeout(resizeTimeout)
            stopAnimation()
        }
    }, [
        numberOfDrips,
        dripRadius,
        topBarHeight,
        sideMargin,
        speed,
        viscosity,
        gravity,
        maxDripLength,
        blurAmount,
        thresholdIntensity,
        dripColor,
        simpleDrips,
        preview,
        isStatic,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
                backgroundColor: "transparent",
            }}
        >
            <svg
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                }}
            >
                <defs>
                    <filter
                        id={filterId}
                        x="-50%"
                        y="-20%"
                        width="200%"
                        height="1000%"
                    >
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={blurAmount}
                            result="blur"
                        />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${thresholdIntensity} -12`}
                            result="gooey"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="gooey"
                            operator="atop"
                        />
                    </filter>
                </defs>
            </svg>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "120%",
                    height: topBarHeight,
                    overflow: "visible",
                    pointerEvents: "none",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        filter: `url(#${filterId})`,
                        transform: "translateZ(0)",
                        willChange: "transform, filter",
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(LiquidDripFX, {
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    simpleDrips: {
        type: ControlType.Boolean,
        title: "Simple Drips",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    numberOfDrips: {
        type: ControlType.Number,
        title: "Number of Drips",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 4,
    },
    dripRadius: {
        type: ControlType.Number,
        title: "Drip Radius",
        min: 1,
        max: 200,
        step: 1,
        defaultValue: 2,
    },
    topBarHeight: {
        type: ControlType.Number,
        title: "Top Height",
        min: 0,
        max: 800,
        step: 1,
        defaultValue: 6,
    },
    sideMargin: {
        type: ControlType.Number,
        title: "Side Margin",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 0.8,
    },
    viscosity: {
        type: ControlType.Number,
        title: "Viscosity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        min: 0.001,
        max: 0.05,
        step: 0.001,
        defaultValue: 0.015,
    },
    maxDripLength: {
        type: ControlType.Number,
        title: "Max Length",
        min: 5,
        max: 100,
        step: 5,
        unit: "%",
        defaultValue: 10,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 4,
    },
    thresholdIntensity: {
        type: ControlType.Number,
        title: "Gooey",
        min: 10,
        max: 80,
        step: 1,
        defaultValue: 78,
    },
    dripColor: {
        type: ControlType.Color,
        title: "Drip Color",
        defaultValue: "#0099ff",
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
