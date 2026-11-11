// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useInView } from "framer-motion"

// User request: Create/replace "Infinite Image Fall" as a full-frame dark CSS-3D portrait-card field with wheel + pointer-drag inertial travel, far-plane-only recycling, depth-based scale/fog/opacity, responsive 100% sizing, and exact tunable property controls.

type GalleryImage = {
    src?: string
    srcSet?: string
    alt?: string
}

interface CardData {
    x: number
    y: number
    z: number
    imageIndex: number
}

interface MyComponentProps {
    image1?: GalleryImage
    image2?: GalleryImage
    image3?: GalleryImage
    image4?: GalleryImage
    image5?: GalleryImage
    image6?: GalleryImage
    image7?: GalleryImage
    image8?: GalleryImage
    image9?: GalleryImage
    image10?: GalleryImage
    image11?: GalleryImage
    image12?: GalleryImage
    backgroundColor: string
    cardSize: number
    imageRadius: number
    cardCount: number
    spread: number
    depthRange: number
    scrollSensitivity: number
    autoDriftSpeed: number
    inertiaSmoothing: number
    fadeDistance: number
    imageOpacity: number
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min)
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InfiniteImageFall(props: MyComponentProps) {
    const {
        image1 = { src: "", alt: "" },
        image2 = { src: "", alt: "" },
        image3 = { src: "", alt: "" },
        image4 = { src: "", alt: "" },
        image5 = { src: "", alt: "" },
        image6 = { src: "", alt: "" },
        image7 = { src: "", alt: "" },
        image8 = { src: "", alt: "" },
        image9 = { src: "", alt: "" },
        image10 = { src: "", alt: "" },
        image11 = { src: "", alt: "" },
        image12 = { src: "", alt: "" },
        backgroundColor,
        cardSize,
        imageRadius,
        cardCount,
        spread,
        depthRange,
        scrollSensitivity,
        autoDriftSpeed,
        inertiaSmoothing,
        fadeDistance,
        imageOpacity,
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])
    const imageRefs = useRef<Array<HTMLImageElement | null>>([])
    const placeholderRefs = useRef<Array<HTMLDivElement | null>>([])
    const fogRefs = useRef<Array<HTMLDivElement | null>>([])
    const cardsRef = useRef<CardData[]>([])
    const drawRef = useRef<() => void>(() => {})
    const rafRef = useRef<number>(0)
    const motionRef = useRef({ velocity: 0, targetVelocity: 0, lastTime: 0 })
    const pointerRef = useRef({
        dragging: false,
        pointerId: -1,
        lastY: 0,
        lastT: 0,
    })
    const isStaticRenderer = useIsStaticRenderer()
    const isInView = useInView(rootRef, { amount: 0.01 })

    const imagePool = useMemo(() => {
        return [
            image1,
            image2,
            image3,
            image4,
            image5,
            image6,
            image7,
            image8,
            image9,
            image10,
            image11,
            image12,
        ].filter((item) => !!item?.src)
    }, [
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        image11,
        image12,
    ])

    const safeCardCount = Math.max(8, Math.min(60, Math.floor(cardCount)))
    const safeDepth = Math.max(600, depthRange)
    const farZ = -safeDepth
    const nearZ = Math.max(80, safeDepth * 0.12)
    const nearRecycleZ = nearZ + Math.max(60, safeDepth * 0.04)
    const safeSpread = Math.max(80, spread)
    const safeFadeDistance = Math.max(80, fadeDistance)
    const safeImageOpacity = clamp(imageOpacity, 0, 1)
    const perspective = Math.max(700, cardSize * 4 + safeDepth * 0.35)
    const cardHeight = Math.max(40, cardSize) * (4 / 3)

    const randomXY = useCallback(() => {
        return {
            x: randomInRange(-safeSpread, safeSpread),
            y: randomInRange(-safeSpread, safeSpread),
        }
    }, [safeSpread])

    const randomImageIndex = useCallback(() => {
        if (imagePool.length === 0) return -1
        return Math.floor(Math.random() * imagePool.length)
    }, [imagePool.length])

    const respawnAtFar = useCallback(
        (card: CardData) => {
            const point = randomXY()
            card.x = point.x
            card.y = point.y
            card.z = farZ
            card.imageIndex = randomImageIndex()
        },
        [farZ, randomImageIndex, randomXY]
    )

    const draw = useCallback(() => {
        const depthSpan = Math.max(1, nearZ - farZ)
        for (let i = 0; i < cardsRef.current.length; i++) {
            const card = cardsRef.current[i]
            const cardNode = cardRefs.current[i]
            if (!cardNode) continue

            const normalized = clamp((card.z - farZ) / depthSpan, 0, 1)
            const fogIn = clamp((card.z - farZ) / safeFadeDistance, 0, 1)
            const opacity = clamp(fogIn * safeImageOpacity, 0, safeImageOpacity)
            const scale = clamp(0.12 + normalized * 1.45, 0.1, 2)
            const brightness = 0.35 + normalized * 0.75
            const fogOverlay = clamp((1 - normalized) * 0.9, 0, 0.9)

            cardNode.style.transform = `translate3d(${card.x}px, ${card.y}px, ${card.z}px) scale(${scale})`
            cardNode.style.opacity = `${opacity}`
            cardNode.style.filter = `brightness(${brightness})`
            cardNode.style.zIndex = `${Math.floor(normalized * 1000)}`

            const imageNode = imageRefs.current[i]
            const image =
                card.imageIndex >= 0 ? imagePool[card.imageIndex] : undefined
            if (imageNode) {
                if (image?.src) {
                    if (imageNode.dataset.src !== image.src) {
                        imageNode.dataset.src = image.src
                        imageNode.src = image.src
                        if (image.srcSet) imageNode.srcset = image.srcSet
                        else imageNode.removeAttribute("srcset")
                        imageNode.alt = image.alt || ""
                    }
                    imageNode.style.display = "block"
                } else {
                    imageNode.style.display = "none"
                    imageNode.alt = ""
                }
                imageNode.style.opacity = `${opacity}`
            }

            const placeholderNode = placeholderRefs.current[i]
            if (placeholderNode) {
                placeholderNode.style.display = image?.src ? "none" : "block"
                placeholderNode.style.opacity = `${clamp(0.2 + opacity * 0.8, 0.12, 1)}`
                placeholderNode.style.background = backgroundColor
            }

            const fogNode = fogRefs.current[i]
            if (fogNode) {
                fogNode.style.background = backgroundColor
                fogNode.style.opacity = `${fogOverlay}`
            }
        }
    }, [
        backgroundColor,
        farZ,
        imagePool,
        nearZ,
        safeFadeDistance,
        safeImageOpacity,
    ])

    useEffect(() => {
        drawRef.current = draw
    }, [draw])

    const applyInputImpulse = useCallback(
        (deltaY: number, dtMs = 16) => {
            const dt = clamp(dtMs / 16.666, 0.2, 3)
            motionRef.current.targetVelocity +=
                deltaY * scrollSensitivity * 0.004 * dt
        },
        [scrollSensitivity]
    )

    useEffect(() => {
        const next: CardData[] = []
        for (let i = 0; i < safeCardCount; i++) {
            next.push({
                x: randomInRange(-safeSpread, safeSpread),
                y: randomInRange(-safeSpread, safeSpread),
                z: randomInRange(farZ, nearZ),
                imageIndex: randomImageIndex(),
            })
        }
        cardsRef.current = next
        drawRef.current()
    }, [farZ, nearZ, randomImageIndex, safeCardCount, safeSpread])

    useEffect(() => {
        draw()
    }, [draw])

    useEffect(() => {
        const root = rootRef.current
        if (!root || isStaticRenderer) return
        if (typeof window === "undefined") return

        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            applyInputImpulse(event.deltaY, 16)
        }

        const onPointerDown = (event: PointerEvent) => {
            pointerRef.current.dragging = true
            pointerRef.current.pointerId = event.pointerId
            pointerRef.current.lastY = event.clientY
            pointerRef.current.lastT = event.timeStamp || performance.now()
            root.setPointerCapture(event.pointerId)
        }

        const onPointerMove = (event: PointerEvent) => {
            if (
                !pointerRef.current.dragging ||
                pointerRef.current.pointerId !== event.pointerId
            )
                return
            const dy = pointerRef.current.lastY - event.clientY
            const dtMs = Math.max(
                1,
                (event.timeStamp || performance.now()) -
                    pointerRef.current.lastT
            )
            pointerRef.current.lastY = event.clientY
            pointerRef.current.lastT = event.timeStamp || performance.now()
            applyInputImpulse(dy, dtMs)
        }

        const onPointerEnd = (event: PointerEvent) => {
            if (pointerRef.current.pointerId !== event.pointerId) return
            pointerRef.current.dragging = false
            pointerRef.current.pointerId = -1
            if (root.hasPointerCapture(event.pointerId))
                root.releasePointerCapture(event.pointerId)
        }

        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("pointerdown", onPointerDown)
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerup", onPointerEnd)
        root.addEventListener("pointercancel", onPointerEnd)

        return () => {
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("pointerdown", onPointerDown)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerup", onPointerEnd)
            root.removeEventListener("pointercancel", onPointerEnd)
        }
    }, [applyInputImpulse, isStaticRenderer])

    useEffect(() => {
        if (isStaticRenderer) {
            draw()
            return
        }
        if (typeof window === "undefined") return

        const tick = (time: number) => {
            const motion = motionRef.current
            if (motion.lastTime === 0) motion.lastTime = time
            const dt = clamp((time - motion.lastTime) / 1000, 0.001, 0.05)
            motion.lastTime = time

            if (isInView) {
                // Shared velocity model: input pushes targetVelocity, then both velocities are damped/lerped to drift.
                const smoothing = clamp(inertiaSmoothing, 0, 1)
                const pullToDrift = clamp(
                    (1 - smoothing) * dt * 4.5 + 0.01,
                    0,
                    1
                )
                const velocityLerp = clamp(
                    (1 - smoothing) * dt * 14 + 0.04,
                    0,
                    1
                )

                motion.targetVelocity +=
                    (autoDriftSpeed - motion.targetVelocity) * pullToDrift
                motion.velocity +=
                    (motion.targetVelocity - motion.velocity) * velocityLerp
                motion.targetVelocity *= Math.pow(
                    0.985 + smoothing * 0.01,
                    dt * 60
                )
                motion.velocity *= Math.pow(0.992 + smoothing * 0.007, dt * 60)

                const dz = motion.velocity * dt * 140
                for (let i = 0; i < cardsRef.current.length; i++) {
                    const card = cardsRef.current[i]
                    card.z += dz
                    if (card.z > nearRecycleZ) {
                        respawnAtFar(card)
                    } else if (card.z < farZ) {
                        card.z = farZ
                    }
                }
                draw()
            }

            rafRef.current = window.requestAnimationFrame(tick)
        }

        rafRef.current = window.requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
            }
            motionRef.current.lastTime = 0
        }
    }, [
        autoDriftSpeed,
        draw,
        farZ,
        inertiaSmoothing,
        isInView,
        isStaticRenderer,
        nearRecycleZ,
        respawnAtFar,
    ])

    return (
        <div
            ref={rootRef}
            role="application"
            aria-label="Infinite Fall 3D portrait card field"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                perspective: `${perspective}px`,
                perspectiveOrigin: "50% 50%",
                transformStyle: "preserve-3d",
                cursor: "default",
                touchAction: "none",
                userSelect: "none",
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    left: "50%",
                    top: "50%",
                    transformStyle: "preserve-3d",
                    pointerEvents: "none",
                }}
            >
                {Array.from({ length: safeCardCount }).map((_, index) => (
                    <div
                        key={index}
                        ref={(node) => {
                            cardRefs.current[index] = node
                        }}
                        style={{
                            position: "absolute",
                            width: `${Math.max(40, cardSize)}px`,
                            height: `${cardHeight}px`,
                            marginLeft: `${-Math.max(40, cardSize) / 2}px`,
                            marginTop: `${-cardHeight / 2}px`,
                            borderRadius: `${imageRadius}px`,
                            overflow: "hidden",
                            transform: "translate3d(0,0,0)",
                            backfaceVisibility: "hidden",
                            willChange: "transform, opacity, filter",
                            boxShadow: "0 14px 44px rgba(0,0,0,0.45)",
                            background: backgroundColor,
                        }}
                    >
                        <img
                            ref={(node) => {
                                imageRefs.current[index] = node
                            }}
                            alt=""
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "none",
                            }}
                        />
                        <div
                            ref={(node) => {
                                placeholderRefs.current[index] = node
                            }}
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: backgroundColor,
                            }}
                        />
                        <div
                            ref={(node) => {
                                fogRefs.current[index] = node
                            }}
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: backgroundColor,
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

InfiniteImageFall.displayName = "InfiniteImageFall"

addPropertyControls(InfiniteImageFall, {
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5" },
    image6: { type: ControlType.ResponsiveImage, title: "Image 6" },
    image7: { type: ControlType.ResponsiveImage, title: "Image 7" },
    image8: { type: ControlType.ResponsiveImage, title: "Image 8" },
    image9: { type: ControlType.ResponsiveImage, title: "Image 9" },
    image10: { type: ControlType.ResponsiveImage, title: "Image 10" },
    image11: { type: ControlType.ResponsiveImage, title: "Image 11" },
    image12: { type: ControlType.ResponsiveImage, title: "Image 12" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#0A0A0C",
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 180,
        min: 80,
        max: 360,
        step: 1,
        unit: "px",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    cardCount: {
        type: ControlType.Number,
        title: "Card Count",
        defaultValue: 24,
        min: 8,
        max: 60,
        step: 1,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 560,
        min: 120,
        max: 1600,
        step: 1,
        unit: "px",
    },
    depthRange: {
        type: ControlType.Number,
        title: "Depth Range",
        defaultValue: 2400,
        min: 600,
        max: 6000,
        step: 10,
        unit: "px",
    },
    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        defaultValue: 1,
        min: 0.1,
        max: 4,
        step: 0.01,
    },
    autoDriftSpeed: {
        type: ControlType.Number,
        title: "Auto Drift Speed",
        defaultValue: 2.2,
        min: 0.1,
        max: 12,
        step: 0.1,
    },
    inertiaSmoothing: {
        type: ControlType.Number,
        title: "Inertia / Smoothing",
        defaultValue: 0.72,
        min: 0,
        max: 1,
        step: 0.01,
    },
    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Distance",
        defaultValue: 900,
        min: 120,
        max: 3600,
        step: 1,
        unit: "px",
    },
    imageOpacity: {
        type: ControlType.Number,
        title: "Image Opacity",
        defaultValue: 0.95,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
