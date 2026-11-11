"use client"

const COMPONENT_AUTHOR = "Karim Saif" as const

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

import { useEffect, useRef } from "react"

/**
 *
 *
 * Made with 💛 by Karim Saif
 *
 */

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface DNACarouselProps {
    images: ImageValue[]

    cardWidth: number
    cardHeight: number
    gap: number
    imageRadius: number

    curveDepth: number
    curveHeight: number
    helixSpread: number
    perspective: number

    activeScale: number
    inactiveScale: number

    rotation: number
    tilt: number

    blur: number
    chromaticAberration: number
    inactiveOpacity: number

    dragSensitivity: number
    inertia: number
    snapStrength: number

    autoPlay: boolean
    autoSpeed: number

    shadow: boolean
    shadowStrength: number

    background: string
    grabCursor: boolean
}

const defaultProps: DNACarouselProps = {
    images: [
        {
            src: "",
        },
    ],

    cardWidth: 220,
    cardHeight: 300,
    gap: 26,
    imageRadius: 0,

    curveDepth: 170,
    curveHeight: 55,
    helixSpread: 90,
    perspective: 1100,

    activeScale: 1,
    inactiveScale: 0.78,

    rotation: 32,
    tilt: 10,

    blur: 5,
    chromaticAberration: 5,
    inactiveOpacity: 0.42,

    dragSensitivity: 1.35,
    inertia: 0.93,
    snapStrength: 0.18,

    autoPlay: false,
    autoSpeed: 0.18,

    shadow: true,
    shadowStrength: 0.35,

    background: "#0A0A0A",
    grabCursor: true,
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function wrap(value: number, length: number) {
    if (length <= 0) return 0

    const result = value % length

    return result < 0 ? result + length : result
}

function shortestDistance(index: number, position: number, count: number) {
    let distance = index - position

    if (distance > count / 2) {
        distance -= count
    }

    if (distance < -count / 2) {
        distance += count
    }

    return distance
}

function easeOutCubic(value: number) {
    const t = clamp(value, 0, 1)

    return 1 - Math.pow(1 - t, 3)
}

export default function DNACarousel(props: DNACarouselProps) {
    const {
        images = defaultProps.images,

        cardWidth,
        cardHeight,
        gap,
        imageRadius,

        curveDepth,
        curveHeight,
        helixSpread,
        perspective,

        activeScale,
        inactiveScale,

        rotation,
        tilt,

        blur,
        chromaticAberration,
        inactiveOpacity,

        dragSensitivity,
        inertia,
        snapStrength,

        autoPlay,
        autoSpeed,

        shadow,
        shadowStrength,

        background,
        grabCursor,
    } = {
        ...defaultProps,
        ...props,
    }

    const isStatic = useIsStaticRenderer()

    const prefersReducedMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement | null>(null)
    const cardsRef = useRef<HTMLDivElement[]>([])

    const positionRef = useRef(0)

    const velocityRef = useRef(0)

    const rafRef = useRef<number | null>(null)

    const visibleRef = useRef(true)

    const draggingRef = useRef(false)

    const pointerIdRef = useRef<number | null>(null)

    const startPointerXRef = useRef(0)

    const startPositionRef = useRef(0)

    const lastPointerXRef = useRef(0)

    const lastPointerTimeRef = useRef(0)

    const lastFrameTimeRef = useRef<number | null>(null)

    const settingsRef = useRef({
        cardWidth,
        cardHeight,
        gap,
        imageRadius,

        curveDepth,
        curveHeight,
        helixSpread,
        perspective,

        activeScale,
        inactiveScale,

        rotation,
        tilt,

        blur,
        chromaticAberration,
        inactiveOpacity,

        dragSensitivity,
        inertia,
        snapStrength,

        autoPlay,
        autoSpeed,

        shadow,
        shadowStrength,
    })

    const validImages = Array.isArray(images)
        ? images.filter(
              (image) =>
                  image && typeof image.src === "string" && image.src.length > 0
          )
        : []

    settingsRef.current = {
        cardWidth,
        cardHeight,
        gap,
        imageRadius,

        curveDepth,
        curveHeight,
        helixSpread,
        perspective,

        activeScale,
        inactiveScale,

        rotation,
        tilt,

        blur,
        chromaticAberration,
        inactiveOpacity,

        dragSensitivity,
        inertia,
        snapStrength,

        autoPlay,
        autoSpeed,

        shadow,
        shadowStrength,
    }

    useEffect(() => {
        cardsRef.current.length = validImages.length
    }, [validImages.length])

    const renderCards = React.useCallback(() => {
        const root = rootRef.current

        if (!root) return

        const settings = settingsRef.current

        const count = cardsRef.current.length

        if (!count) return

        const position = wrap(positionRef.current, count)

        const centerWidth = settings.cardWidth + settings.gap

        const maxVisibleDistance = Math.max(3, Math.ceil(count / 2))

        cardsRef.current.forEach((card, index) => {
            if (!card) return

            const distance = shortestDistance(index, position, count)

            const absoluteDistance = Math.abs(distance)

            const normalizedDistance = clamp(
                absoluteDistance / maxVisibleDistance,
                0,
                1
            )

            const phase = distance * Math.PI * 0.48

            const wave = Math.sin(phase)

            const depthWave = Math.cos(phase)

            const strand = index % 2 === 0 ? 1 : -1

            const x = distance * centerWidth * 0.72

            const y = wave * settings.curveHeight * strand

            const z = depthWave * settings.curveDepth

            const strandY =
                strand * settings.helixSpread * Math.cos(phase * 0.5) * 0.5

            const rotateY = depthWave * settings.rotation * strand

            const rotateZ = wave * settings.tilt * strand

            const rotateX = wave * settings.tilt * 0.35

            const activeAmount = clamp(1 - absoluteDistance, 0, 1)

            const smoothActive = easeOutCubic(activeAmount)

            const scale =
                settings.inactiveScale +
                (settings.activeScale - settings.inactiveScale) * smoothActive

            const opacity =
                settings.inactiveOpacity +
                (1 - settings.inactiveOpacity) * smoothActive

            const depthNormalized = clamp(
                (z + settings.curveDepth) / (settings.curveDepth * 2),
                0,
                1
            )

            const zScale = 0.88 + depthNormalized * 0.12

            const finalScale = scale * zScale

            const blurAmount =
                settings.blur * normalizedDistance * (1 - smoothActive)

            const chroma =
                settings.chromaticAberration *
                normalizedDistance *
                (1 - smoothActive)

            const zIndex = Math.round(
                100 - absoluteDistance * 10 + depthWave * 4
            )

            card.style.transform = `
                        translate3d(
                            ${x}px,
                            ${y + strandY}px,
                            ${z}px
                        )
                        rotateX(${rotateX}deg)
                        rotateY(${rotateY}deg)
                        rotateZ(${rotateZ}deg)
                        scale(${finalScale})
                    `

            card.style.opacity = String(opacity)

            card.style.zIndex = String(zIndex)

            const shadowFilter = settings.shadow
                ? `
                                drop-shadow(
                                    0
                                    ${8 + smoothActive * 10}px
                                    ${18 + smoothActive * 15}px
                                    rgba(
                                        0,
                                        0,
                                        0,
                                        ${settings.shadowStrength}
                                    )
                                )
                            `
                : ""

            const chromaticFilter =
                chroma > 0.01
                    ? `
                                drop-shadow(
                                    ${-chroma}px
                                    0
                                    0
                                    rgba(
                                        255,
                                        0,
                                        70,
                                        0.42
                                    )
                                )

                                drop-shadow(
                                    ${chroma}px
                                    0
                                    0
                                    rgba(
                                        0,
                                        170,
                                        255,
                                        0.42
                                    )
                                )
                            `
                    : ""

            card.style.filter = `
                        blur(${blurAmount}px)
                        ${chromaticFilter}
                        ${shadowFilter}
                    `
        })
    }, [])

    useEffect(() => {
        if (isStatic) return

        if (prefersReducedMotion) {
            renderCards()
            return
        }

        let mounted = true

        const animate = (time: number) => {
            if (!mounted) return

            if (!visibleRef.current) {
                rafRef.current = requestAnimationFrame(animate)

                lastFrameTimeRef.current = time

                return
            }

            const previous = lastFrameTimeRef.current ?? time

            let delta = (time - previous) / 1000

            lastFrameTimeRef.current = time

            delta = clamp(delta, 0, 0.05)

            const settings = settingsRef.current

            if (!draggingRef.current) {
                if (settings.autoPlay) {
                    positionRef.current += settings.autoSpeed * delta
                }

                if (Math.abs(velocityRef.current) > 0.0001) {
                    positionRef.current += velocityRef.current * delta

                    velocityRef.current *= Math.pow(
                        settings.inertia,
                        delta * 60
                    )
                }

                if (
                    !settings.autoPlay &&
                    Math.abs(velocityRef.current) < 0.025
                ) {
                    const target = Math.round(positionRef.current)

                    const difference = target - positionRef.current

                    const snapAmount =
                        1 - Math.exp(-settings.snapStrength * 60 * delta)

                    positionRef.current += difference * snapAmount

                    if (Math.abs(difference) < 0.0005) {
                        positionRef.current = target

                        velocityRef.current = 0
                    }
                }
            }

            renderCards()

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            mounted = false

            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)

                rafRef.current = null
            }
        }
    }, [isStatic, prefersReducedMotion, renderCards])

    useEffect(() => {
        renderCards()
    }, [
        renderCards,
        validImages.length,
        cardWidth,
        cardHeight,
        gap,
        imageRadius,
    ])

    useEffect(() => {
        const root = rootRef.current

        if (!root) return

        const observer = new IntersectionObserver(
            (entries) => {
                visibleRef.current = entries[0]?.isIntersecting ?? true

                if (visibleRef.current) {
                    lastFrameTimeRef.current = performance.now()
                }
            },
            {
                threshold: 0,
            }
        )

        observer.observe(root)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        const root = rootRef.current

        if (!root) return

        const observer = new ResizeObserver(() => {
            renderCards()
        })

        observer.observe(root)

        return () => {
            observer.disconnect()
        }
    }, [renderCards])

    const handlePointerDown = (event: React.PointerEvent) => {
        if (isStatic) return

        if (prefersReducedMotion) return

        const root = rootRef.current

        if (!root) return

        draggingRef.current = true

        pointerIdRef.current = event.pointerId

        startPointerXRef.current = event.clientX

        startPositionRef.current = positionRef.current

        lastPointerXRef.current = event.clientX

        lastPointerTimeRef.current = performance.now()

        velocityRef.current = 0

        root.style.cursor = "grabbing"

        try {
            root.setPointerCapture(event.pointerId)
        } catch {}

        event.preventDefault()
    }

    const handlePointerMove = (event: React.PointerEvent) => {
        if (!draggingRef.current) return

        if (
            pointerIdRef.current !== null &&
            event.pointerId !== pointerIdRef.current
        ) {
            return
        }

        const settings = settingsRef.current

        const now = performance.now()

        const dx = event.clientX - startPointerXRef.current

        const travel = Math.max(1, settings.cardWidth + settings.gap)

        positionRef.current =
            startPositionRef.current - (dx / travel) * settings.dragSensitivity

        const lastX = lastPointerXRef.current

        const lastTime = lastPointerTimeRef.current

        const deltaX = event.clientX - lastX

        const deltaTime = Math.max(1, now - lastTime)

        const deltaSeconds = deltaTime / 1000

        const instantVelocity =
            (-(deltaX / travel) / deltaSeconds) * settings.dragSensitivity

        velocityRef.current =
            velocityRef.current * 0.72 + instantVelocity * 0.28

        lastPointerXRef.current = event.clientX

        lastPointerTimeRef.current = now

        renderCards()

        event.preventDefault()
    }

    const handlePointerUp = (event?: React.PointerEvent) => {
        if (!draggingRef.current) return

        draggingRef.current = false

        const root = rootRef.current

        if (root) {
            root.style.cursor = grabCursor ? "grab" : "default"
        }

        if (event && pointerIdRef.current !== null) {
            try {
                root?.releasePointerCapture(pointerIdRef.current)
            } catch {}
        }

        pointerIdRef.current = null

        velocityRef.current = clamp(velocityRef.current, -2.5, 2.5)
    }

    const handleWheel = (event: React.WheelEvent) => {
        if (isStatic) return

        const settings = settingsRef.current

        const delta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
                ? event.deltaX
                : event.deltaY

        if (Math.abs(delta) < 0.01) {
            return
        }

        positionRef.current += delta * 0.0025 * settings.dragSensitivity

        velocityRef.current += delta * 0.0005 * settings.dragSensitivity

        velocityRef.current = clamp(velocityRef.current, -1.8, 1.8)

        renderCards()

        event.preventDefault()
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (isStatic) return

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            positionRef.current += 1

            velocityRef.current = 0

            renderCards()

            event.preventDefault()
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            positionRef.current -= 1

            velocityRef.current = 0

            renderCards()

            event.preventDefault()
        }
    }

    if (isStatic) {
        const firstImage = validImages[0]

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    perspective: `${perspective}px`,
                }}
            >
                {firstImage?.src && (
                    <img
                        src={firstImage.src}
                        srcSet={firstImage.srcSet}
                        alt={firstImage.alt ?? ""}
                        style={{
                            width: cardWidth,
                            height: cardHeight,
                            objectFit: "cover",
                            display: "block",
                            borderRadius: imageRadius,
                        }}
                    />
                )}
            </div>
        )
    }

    if (!validImages.length) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background,
                }}
            />
        )
    }

    return (
        <div
            ref={rootRef}
            tabIndex={0}
            role="region"
            aria-label="DNA image carousel"
            data-component-author={COMPONENT_AUTHOR}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => handlePointerUp()}
            onPointerLeave={(event) => {
                if (draggingRef.current) {
                    handlePointerMove(event)
                }
            }}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background,
                perspective: `${perspective}px`,
                perspectiveOrigin: "50% 50%",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: grabCursor ? "grab" : "default",
                outline: "none",
                contain: "layout paint",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transformStyle: "preserve-3d",
                    pointerEvents: "none",
                }}
            >
                {validImages.map((image, index) => (
                    <div
                        key={`${image.src}-${index}`}
                        ref={(element) => {
                            if (element) {
                                cardsRef.current[index] = element
                            }
                        }}
                        style={{
                            position: "absolute",

                            left: "50%",
                            top: "50%",

                            width: cardWidth,
                            height: cardHeight,

                            marginLeft: -cardWidth / 2,

                            marginTop: -cardHeight / 2,

                            borderRadius: imageRadius,

                            overflow: "hidden",

                            transformStyle: "preserve-3d",

                            backfaceVisibility: "hidden",

                            WebkitBackfaceVisibility: "hidden",

                            willChange: "transform, opacity, filter",

                            transform: "translate3d(0,0,0)",

                            opacity: 0,

                            pointerEvents: "none",

                            background: "#111",
                        }}
                    >
                        <img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt ?? ""}
                            draggable={false}
                            loading={index < 3 ? "eager" : "lazy"}
                            decoding="async"
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                                objectPosition: "center",
                                userSelect: "none",
                                WebkitUserDrag: "none",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 *
 *
 * Made with 💛 by Karim Saif
 *
 */

addPropertyControls(DNACarousel, {
    images: {
        type: ControlType.Array,

        title: "Images",

        control: {
            type: ControlType.ResponsiveImage,
        },

        maxCount: 50,

        defaultValue: [
            {
                src: "",
            },
        ],

        description: "Add, remove, and reorder images in the DNA carousel.",
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 80,
        max: 600,
        step: 1,
        unit: "px",
        description: "Width of each image card.",
    },

    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 100,
        max: 800,
        step: 1,
        unit: "px",
        description: "Height of each image card.",
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        description: "Spacing between image cards.",
    },

    imageRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        description: "Controls the corner radius of every image.",
    },

    curveDepth: {
        type: ControlType.Number,
        title: "Depth",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        description:
            "Controls how far images travel into and out of the screen.",
    },

    curveHeight: {
        type: ControlType.Number,
        title: "Curve",
        min: 0,
        max: 250,
        step: 1,
        unit: "px",
        description: "Controls the vertical DNA curve.",
    },

    helixSpread: {
        type: ControlType.Number,
        title: "Spread",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        description: "Controls the separation between the two DNA strands.",
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 400,
        max: 3000,
        step: 10,
        unit: "px",
        description: "Controls the strength of the 3D perspective.",
    },

    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        min: 0.7,
        max: 1.5,
        step: 0.01,
        description: "Scale of the centered image.",
    },

    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Scale",
        min: 0.3,
        max: 1,
        step: 0.01,
        description: "Scale of images away from the center.",
    },

    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
        description: "Rotation around the DNA depth axis.",
    },

    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 45,
        step: 1,
        unit: "°",
        description: "Additional image tilt along the helix.",
    },

    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
        description: "Blur applied to images farther from the center.",
    },

    chromaticAberration: {
        type: ControlType.Number,
        title: "RGB Split",
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
        description: "RGB color separation on inactive images.",
    },

    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        min: 0.05,
        max: 1,
        step: 0.01,
        description: "Opacity of images away from the center.",
    },

    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag",
        min: 0.2,
        max: 3,
        step: 0.05,
        description: "Controls how strongly dragging moves the carousel.",
    },

    inertia: {
        type: ControlType.Number,
        title: "Inertia",
        min: 0.75,
        max: 0.98,
        step: 0.005,
        description: "Controls momentum after releasing a drag.",
    },

    snapStrength: {
        type: ControlType.Number,
        title: "Snap",
        min: 0.04,
        max: 0.5,
        step: 0.01,
        description: "Controls how quickly the carousel settles onto an image.",
    },

    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Automatically moves through the images.",
    },

    autoSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.01,
        max: 1.5,
        step: 0.01,
        description: "Controls the automatic movement speed.",
        hidden: (props) => !props.autoPlay,
    },

    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Adds depth-enhancing shadows.",
    },

    shadowStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 1,
        step: 0.01,
        description: "Controls shadow opacity.",
        hidden: (props) => !props.shadow,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color behind the carousel.",
    },

    grabCursor: {
        type: ControlType.Boolean,
        title: "Grab Cursor",
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

DNACarousel.defaultProps = defaultProps
