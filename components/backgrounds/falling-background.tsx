import React, { useEffect, useRef, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function TdfFallingBackground(props: any) {
    const {
        mode,
        leafType,
        broadLeafColor,
        mapleColor,
        ginkgoColor,
        cherryBlossomColor,
        snowColor,
        count,
        minSize,
        maxSize,
        minSpeed,
        maxSpeed,
        swayIntensity,
        wind,
        opacity,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>()
    const particles = useRef<any[]>([])
    const sizeRef = useRef({ width: 0, height: 0 })

    const createParticle = (
        width: number,
        height: number,
        isInitial = false
    ) => {
        const {
            minSize,
            maxSize,
            minSpeed,
            maxSpeed,
            mode,
            leafType,
            snowColor,
            cherryBlossomColor,
            mapleColor,
            ginkgoColor,
            broadLeafColor,
        } = props
        const size = Math.random() * (maxSize - minSize) + minSize

        let color = snowColor
        if (mode === "CherryBlossom") color = cherryBlossomColor
        else if (mode === "Leaf") {
            if (leafType === "Maple") color = mapleColor
            else if (leafType === "Ginkgo") color = ginkgoColor
            else color = broadLeafColor
        }

        return {
            x: Math.random() * width,
            y: isInitial ? Math.random() * height : -size - 20,
            size,
            speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.1,
            swayOffset: Math.random() * Math.PI * 2,
            color: color,
            opacity: Math.random() * 0.5 + 0.5,
            variety: Math.floor(Math.random() * 4),
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = window.devicePixelRatio || 1

        const resize = () => {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (w === 0 || h === 0) {
                requestAnimationFrame(resize)
                return
            }

            const prevWidth = sizeRef.current.width
            const prevHeight = sizeRef.current.height

            const THRESHOLD = 2
            if (
                Math.abs(prevWidth - w) < THRESHOLD &&
                Math.abs(prevHeight - h) < THRESHOLD
            )
                return

            sizeRef.current = { width: w, height: h }

            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            if (prevWidth > 0 && prevHeight > 0) {
                particles.current.forEach((p: any) => {
                    p.x = (p.x / prevWidth) * w
                    p.y = (p.y / prevHeight) * h
                })
            }
        }

        let debounceTimer: number
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(debounceTimer)
            debounceTimer = window.setTimeout(resize, 150)
        })
        resizeObserver.observe(canvas)
        resize()

        return () => {
            resizeObserver.disconnect()
            clearTimeout(debounceTimer)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { width, height } = sizeRef.current

        particles.current = Array.from({ length: count }, () =>
            createParticle(
                width || canvas.offsetWidth,
                height || canvas.offsetHeight,
                true
            )
        )

        const drawLeaf = (ctx: CanvasRenderingContext2D, p: any) => {
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.rotate(p.angle)
            if (mode === "CherryBlossom") {
                ctx.fillStyle = p.color
                ctx.beginPath()

                const variant = p.variety % 3

                if (variant === 0) {
                    const h = p.size * 1.7
                    const w = p.size * 0.85
                    ctx.moveTo(0, 0)
                    ctx.bezierCurveTo(
                        w * 0.8,
                        -h * 0.1,
                        w * 0.9,
                        -h * 0.8,
                        w * 0.3,
                        -h * 0.95
                    )
                    ctx.lineTo(0, -h * 0.85)
                    ctx.lineTo(-w * 0.4, -h)
                    ctx.bezierCurveTo(
                        -w * 0.9,
                        -h * 0.8,
                        -w * 0.8,
                        -h * 0.1,
                        0,
                        0
                    )
                } else if (variant === 1) {
                    const h = p.size * 1.5
                    const w = p.size * 1.0
                    ctx.moveTo(0, 0)
                    ctx.bezierCurveTo(
                        w * 1.1,
                        -h * 0.4,
                        w * 0.8,
                        -h * 1.0,
                        w * 0.3,
                        -h * 0.95
                    )
                    ctx.lineTo(w * 0.05, -h * 0.85)
                    ctx.lineTo(-w * 0.3, -h * 0.95)
                    ctx.bezierCurveTo(
                        -w * 0.8,
                        -h * 1.0,
                        -w * 1.1,
                        -h * 0.4,
                        0,
                        0
                    )
                } else {
                    const h = p.size * 1.6
                    const w = p.size * 0.95
                    ctx.moveTo(0, 0)
                    ctx.bezierCurveTo(
                        w * 0.7,
                        -h * 0.3,
                        w * 1.0,
                        -h * 0.9,
                        w * 0.4,
                        -h
                    )
                    ctx.lineTo(-w * 0.1, -h * 0.85)
                    ctx.lineTo(-w * 0.5, -h * 0.95)
                    ctx.bezierCurveTo(
                        -w * 1.0,
                        -h * 0.8,
                        -w * 0.7,
                        -h * 0.3,
                        0,
                        0
                    )
                }

                ctx.closePath()
                ctx.fill()
            } else {
                ctx.fillStyle = p.color
                if (leafType === "Maple") {
                    ctx.beginPath()

                    const variant = p.variety % 2
                    const lobes = variant === 0 ? 7 : 9

                    const angleSpan = Math.PI * 2
                    const startAngleOffset = -Math.PI / 2 - angleSpan / 2

                    const lengths =
                        lobes === 7
                            ? [0.35, 0.85, 1.2, 1.5, 1.2, 0.85, 0.35]
                            : [0.25, 0.55, 1.0, 1.3, 1.5, 1.3, 1.0, 0.55, 0.25]

                    for (let i = 0; i < lobes; i++) {
                        const angle =
                            startAngleOffset + (i * angleSpan) / (lobes - 1)
                        const len = p.size * lengths[i]
                        const tipX = Math.cos(angle) * len
                        const tipY = Math.sin(angle) * len

                        const isOuter = i === 0 || i === lobes - 1
                        const ctrlDist = len * 0.6
                        const ctrlOffset = isOuter ? 0.42 : 0.35

                        const leftCtrlAngle = angle - ctrlOffset
                        const leftCtrlX = Math.cos(leftCtrlAngle) * ctrlDist
                        const leftCtrlY = Math.sin(leftCtrlAngle) * ctrlDist

                        if (i === 0) {
                            ctx.moveTo(0, 0)
                            ctx.quadraticCurveTo(
                                leftCtrlX,
                                leftCtrlY,
                                tipX,
                                tipY
                            )
                        } else {
                            ctx.quadraticCurveTo(
                                leftCtrlX,
                                leftCtrlY,
                                tipX,
                                tipY
                            )
                        }

                        const rightCtrlAngle = angle + ctrlOffset
                        const rightCtrlX = Math.cos(rightCtrlAngle) * ctrlDist
                        const rightCtrlY = Math.sin(rightCtrlAngle) * ctrlDist

                        if (i === lobes - 1) {
                            ctx.quadraticCurveTo(rightCtrlX, rightCtrlY, 0, 0)
                        } else {
                            const nextAngle =
                                startAngleOffset +
                                ((i + 1) * angleSpan) / (lobes - 1)
                            const midAngle = (angle + nextAngle) / 2
                            const nextLen = p.size * lengths[i + 1]
                            const valleyLen = Math.min(len, nextLen) * 0.25
                            const valleyX = Math.cos(midAngle) * valleyLen
                            const valleyY = Math.sin(midAngle) * valleyLen

                            ctx.quadraticCurveTo(
                                rightCtrlX,
                                rightCtrlY,
                                valleyX,
                                valleyY
                            )
                        }
                    }
                    ctx.closePath()
                } else if (leafType === "Ginkgo") {
                    ctx.beginPath()
                    ctx.moveTo(0, 0)
                    const widthFactor = 1.6 + (p.variety % 2) * 0.2
                    const heightOffset = -p.size * 0.65

                    const splitDepth = p.size * 0.55

                    ctx.bezierCurveTo(
                        -p.size * 0.4,
                        -p.size * 0.1,
                        -p.size * 0.7,
                        heightOffset * 0.5,
                        -p.size * widthFactor,
                        heightOffset
                    )

                    const startAngle = Math.PI * 1.05
                    const endAngle = Math.PI * 1.95
                    const range = endAngle - startAngle
                    const r = p.size * widthFactor

                    const getNotchPoint = (angle: number) => {
                        const px = Math.cos(angle) * r
                        const py = heightOffset + Math.sin(angle) * r
                        const dist = Math.sqrt(px * px + py * py)
                        return {
                            x: px - (px / dist) * splitDepth,
                            y: py - (py / dist) * splitDepth,
                        }
                    }

                    if (p.variety === 0) {
                        const pt = getNotchPoint(startAngle + range * 0.5)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle,
                            startAngle + range * 0.48
                        )
                        ctx.lineTo(pt.x, pt.y)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle + range * 0.52,
                            endAngle
                        )
                    } else if (p.variety === 1) {
                        const pt1 = getNotchPoint(startAngle + range * 0.33)
                        const pt2 = getNotchPoint(startAngle + range * 0.67)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle,
                            startAngle + range * 0.31
                        )
                        ctx.lineTo(pt1.x, pt1.y)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle + range * 0.35,
                            startAngle + range * 0.65
                        )
                        ctx.lineTo(pt2.x, pt2.y)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle + range * 0.69,
                            endAngle
                        )
                    } else if (p.variety === 2) {
                        const pt = getNotchPoint(startAngle + range * 0.38)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle,
                            startAngle + range * 0.36
                        )
                        ctx.lineTo(pt.x, pt.y)
                        ctx.arc(
                            0,
                            heightOffset,
                            r,
                            startAngle + range * 0.4,
                            endAngle
                        )
                    } else {
                        ctx.arc(0, heightOffset, r, startAngle, endAngle)
                    }

                    ctx.bezierCurveTo(
                        p.size * 0.7,
                        heightOffset * 0.5,
                        p.size * 0.4,
                        -p.size * 0.1,
                        0,
                        0
                    )
                    ctx.closePath()
                } else {
                    ctx.beginPath()
                    const fatness = p.variety % 2 === 0 ? 0.6 : 0.8
                    ctx.moveTo(0, -p.size)
                    ctx.quadraticCurveTo(p.size * fatness, 0, 0, p.size)
                    ctx.quadraticCurveTo(-p.size * fatness, 0, 0, -p.size)
                    ctx.closePath()
                }
                ctx.fill()
            }

            ctx.restore()
        }

        const drawSnow = (ctx: CanvasRenderingContext2D, p: any) => {
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }

        let lastTime = 0
        const TARGET_FPS = 60

        const animate = (timestamp: number) => {
            const { width, height } = sizeRef.current

            const delta =
                lastTime === 0
                    ? 1
                    : (timestamp - lastTime) / (1000 / TARGET_FPS)
            lastTime = timestamp
            const dt = Math.max(0.1, Math.min(delta, 3))

            ctx.clearRect(0, 0, width, height)
            ctx.globalAlpha = opacity

            particles.current.forEach((p: any) => {
                p.y += p.speed * dt

                if (mode !== "Snow") {
                    p.swayOffset += p.speed * 0.01 * dt
                    const currentSway = Math.sin(p.swayOffset) * swayIntensity
                    p.x += (currentSway + wind) * dt
                    p.angle += (p.spin + currentSway * 0.02) * dt
                } else {
                    p.x += (wind * 0.5 + Math.sin(p.y * 0.01) * 0.5) * dt
                }

                if (p.y > height + 20) {
                    Object.assign(p, createParticle(width, height))
                }
                if (p.x > width + 20) p.x = -20
                if (p.x < -20) p.x = width + 20

                if (mode === "Snow") {
                    drawSnow(ctx, p)
                } else {
                    drawLeaf(ctx, p)
                }
            })

            requestRef.current = requestAnimationFrame(animate)
        }

        requestRef.current = requestAnimationFrame(animate)

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [
        mode,
        leafType,
        broadLeafColor,
        mapleColor,
        ginkgoColor,
        cherryBlossomColor,
        snowColor,
        count,
        minSize,
        maxSize,
        minSpeed,
        maxSpeed,
        swayIntensity,
        wind,
        opacity,
    ])

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

TdfFallingBackground.defaultProps = {
    mode: "CherryBlossom",
    leafType: "BroadLeaf",
    broadLeafColor: "#7CBA41",
    mapleColor: "#E84A4A",
    ginkgoColor: "#FFDA24",
    cherryBlossomColor: "#FFB7C5",
    snowColor: "#E8F0FF",
    count: 35,
    minSize: 10,
    maxSize: 25,
    minSpeed: 1,
    maxSpeed: 3,
    swayIntensity: 2,
    wind: 0,
    opacity: 1,
}

addPropertyControls(TdfFallingBackground, {
    mode: {
        type: ControlType.Enum,
        options: ["CherryBlossom", "Leaf", "Snow"],
        optionTitles: ["CherryBlossom", "Leaf", "Snow"],
        title: "Mode",
        description:
            "To prevent interference with site interactions (like button clicks), ensure Style > Cursor is set to 'pointer:none'.",
    },
    leafType: {
        type: ControlType.Enum,
        options: ["BroadLeaf", "Maple", "Ginkgo"],
        optionTitles: ["BroadLeaf", "Maple", "Ginkgo"],
        title: "Leaf Type",
        hidden(props: any) {
            return props.mode !== "Leaf"
        },
    },
    broadLeafColor: {
        type: ControlType.Color,
        title: "BroadLeaf Color",
        hidden(props: any) {
            return props.mode !== "Leaf" || props.leafType !== "BroadLeaf"
        },
    },
    mapleColor: {
        type: ControlType.Color,
        title: "Maple Color",
        hidden(props: any) {
            return props.mode !== "Leaf" || props.leafType !== "Maple"
        },
    },
    ginkgoColor: {
        type: ControlType.Color,
        title: "Ginkgo Color",
        hidden(props: any) {
            return props.mode !== "Leaf" || props.leafType !== "Ginkgo"
        },
    },
    cherryBlossomColor: {
        type: ControlType.Color,
        title: "CherryBlossom Color",
        hidden(props: any) {
            return props.mode !== "CherryBlossom"
        },
    },
    snowColor: {
        type: ControlType.Color,
        title: "Snow Color",
        hidden(props: any) {
            return props.mode !== "Snow"
        },
    },
    count: {
        type: ControlType.Number,
        min: 1,
        max: 500,
        step: 1,
        title: "Count",
    },
    minSize: {
        type: ControlType.Number,
        min: 1,
        max: 50,
        title: "Min Size",
    },
    maxSize: {
        type: ControlType.Number,
        min: 1,
        max: 100,
        title: "Max Size",
    },
    minSpeed: {
        type: ControlType.Number,
        min: 0.1,
        max: 10,
        step: 0.1,
        title: "Min Speed",
    },
    maxSpeed: {
        type: ControlType.Number,
        min: 0.1,
        max: 20,
        step: 0.1,
        title: "Max Speed",
    },
    swayIntensity: {
        type: ControlType.Number,
        min: 0,
        max: 20,
        step: 0.1,
        title: "Sway Intensity",
        hidden(props: any) {
            return props.mode === "Snow"
        },
    },
    wind: {
        type: ControlType.Number,
        min: -5,
        max: 5,
        step: 0.1,
        title: "Wind",
    },
    opacity: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.1,
        title: "Opacity",
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
    },
})
