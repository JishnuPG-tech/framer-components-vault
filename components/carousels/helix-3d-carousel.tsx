import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ProjectImage {
    src: string
    srcSet?: string
    alt?: string
}

interface Project {
    number: string
    title: string
    client: string
    category: string
    description: string
    image?: ProjectImage
}

interface Props {
    projects?: Project[]
    radius?: number
    verticalSpacing?: number
    angle?: number
    centerYOffset?: number
    style?: React.CSSProperties
}

const DEFAULT_PROJECTS: Project[] = [
    {
        number: "01",
        title: "COASTAL ESCAPE",
        client: "PACIFIC HORIZON",
        category: "Travel",
        description:
            "A quiet coastal retreat shaped by warm light, open horizons, and the rhythm of the sea.",
    },
    {
        number: "02",
        title: "SALT & SUN",
        client: "COASTAL STORIES",
        category: "Photography",
        description:
            "A visual journey through sun-soaked shores, clear water, and endless summer landscapes.",
    },
    {
        number: "03",
        title: "BLUE HORIZON",
        client: "OCEAN HOUSE",
        category: "Hospitality",
        description:
            "A contemporary seaside experience built around calm waters, natural textures, and open skies.",
    },
    {
        number: "04",
        title: "TIDELINE",
        client: "ATLAS ESCAPES",
        category: "Destination",
        description:
            "An exploration of remote beaches where untouched landscapes meet the edge of the ocean.",
    },
    {
        number: "05",
        title: "GOLDEN SHORE",
        client: "SUNSET COLLECTIVE",
        category: "Editorial",
        description:
            "A cinematic collection capturing the final light across a quiet and timeless coastline.",
    },
]

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function Helix3DCarousel(props: Props) {
    const isStaticRenderer = useIsStaticRenderer()

    const projects =
        props.projects && props.projects.length > 0
            ? props.projects
            : DEFAULT_PROJECTS

    const rawRadius = props.radius ?? 420
    const rawVerticalSpacing = props.verticalSpacing ?? 155
    const angle = props.angle ?? 44
    const rawCenterYOffset = props.centerYOffset ?? -50

    const containerRef = useRef<HTMLDivElement>(null)

    // ------------------------------------------------------------
    // RESPONSIVE SCALE
    // ------------------------------------------------------------

    const [responsiveScale, setResponsiveScale] = useState(1)

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            const width = window.innerWidth

            if (width < 480) {
                setResponsiveScale(0.72)
            } else if (width < 768) {
                setResponsiveScale(0.85)
            } else {
                setResponsiveScale(1)
            }
        }

        handleResize()

        // Static renderer does not need resize listeners.
        if (isStaticRenderer) return

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [isStaticRenderer])

    // Mobile breakpoint used only for mobile-specific sizing/positioning.
    const isMobile = responsiveScale === 0.72

    const radius = rawRadius * responsiveScale
    const verticalSpacing = rawVerticalSpacing * responsiveScale
    const centerYOffset = rawCenterYOffset * responsiveScale

    // ------------------------------------------------------------
    // ANIMATION VALUES & REFS
    // ------------------------------------------------------------

    const progressRef = useRef(0)
    const targetProgress = useRef(0)

    const hoveredCard = useRef<number | null>(null)

    const targetTilt = useRef({
        x: 0,
        y: 0,
    })

    const currentTilt = useRef({
        x: 0,
        y: 0,
    })

    const cardHoverWeights = useRef<number[]>(
        new Array(projects.length).fill(0)
    )

    const lastTime = useRef<number>(0)

    // Used to trigger React renders during animation.
    const [, setTick] = useState(0)

    // ------------------------------------------------------------
    // POINTER / DRAG STATE
    // ------------------------------------------------------------

    const isDragging = useRef(false)
    const startY = useRef(0)
    const startProgress = useRef(0)

    useEffect(() => {
        cardHoverWeights.current = new Array(projects.length).fill(0)
    }, [projects.length])

    // ------------------------------------------------------------
    // PHYSICS RAF LOOP
    //
    // Completely disabled in static rendering.
    // ------------------------------------------------------------

    useEffect(() => {
        if (isStaticRenderer) return

        let frame = 0
        let isMounted = true

        lastTime.current = performance.now()

        const animate = (currentTime: number) => {
            if (!isMounted) return

            const dt = Math.min(
                Math.max((currentTime - lastTime.current) / 1000, 0.001),
                0.1
            )

            lastTime.current = currentTime

            let needsUpdate = false

            // ----------------------------------------------------
            // 1. Smooth progress interpolation
            // ----------------------------------------------------

            const progressDiff = targetProgress.current - progressRef.current

            if (Math.abs(progressDiff) > 0.0002) {
                const lambda = 8.5

                progressRef.current +=
                    progressDiff * (1 - Math.exp(-lambda * dt))

                needsUpdate = true
            } else if (progressRef.current !== targetProgress.current) {
                progressRef.current = targetProgress.current

                needsUpdate = true
            }

            // ----------------------------------------------------
            // 2. Smooth 3D tilt interpolation
            // ----------------------------------------------------

            const tiltLambda = hoveredCard.current !== null ? 14 : 7

            const tiltDiffX = targetTilt.current.x - currentTilt.current.x

            const tiltDiffY = targetTilt.current.y - currentTilt.current.y

            if (Math.abs(tiltDiffX) > 0.002 || Math.abs(tiltDiffY) > 0.002) {
                currentTilt.current.x +=
                    tiltDiffX * (1 - Math.exp(-tiltLambda * dt))

                currentTilt.current.y +=
                    tiltDiffY * (1 - Math.exp(-tiltLambda * dt))

                needsUpdate = true
            }

            // ----------------------------------------------------
            // 3. Smooth hover interpolation
            // ----------------------------------------------------

            cardHoverWeights.current.forEach((value, index) => {
                const targetValue = hoveredCard.current === index ? 1 : 0

                const difference = targetValue - value

                if (Math.abs(difference) > 0.002) {
                    const hoverLambda = hoveredCard.current === index ? 16 : 6

                    cardHoverWeights.current[index] =
                        value + difference * (1 - Math.exp(-hoverLambda * dt))

                    needsUpdate = true
                } else if (value !== targetValue) {
                    cardHoverWeights.current[index] = targetValue

                    needsUpdate = true
                }
            })

            // ----------------------------------------------------
            // Trigger React render only when needed.
            // ----------------------------------------------------

            if (needsUpdate) {
                setTick((value) => (value + 1) % 1000000)
            }

            frame = requestAnimationFrame(animate)
        }

        frame = requestAnimationFrame(animate)

        return () => {
            isMounted = false
            cancelAnimationFrame(frame)
        }
    }, [isStaticRenderer, projects.length])

    // ------------------------------------------------------------
    // WHEEL CONTROL
    //
    // Disabled in static renderer.
    // ------------------------------------------------------------

    useEffect(() => {
        if (isStaticRenderer) return

        const element = containerRef.current

        if (!element) return

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault()

            targetProgress.current += event.deltaY * 0.0018

            targetProgress.current = Math.max(
                0,
                Math.min(projects.length - 1, targetProgress.current)
            )
        }

        element.addEventListener("wheel", handleWheel, {
            passive: false,
        })

        return () => {
            element.removeEventListener("wheel", handleWheel)
        }
    }, [isStaticRenderer, projects.length])

    // ------------------------------------------------------------
    // POINTER EVENTS
    // ------------------------------------------------------------

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return

        isDragging.current = true

        startY.current = event.clientY

        startProgress.current = targetProgress.current

        hoveredCard.current = null

        targetTilt.current = {
            x: 0,
            y: 0,
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        if (!isDragging.current) return

        const delta = startY.current - event.clientY

        targetProgress.current = Math.max(
            0,
            Math.min(
                projects.length - 1,
                startProgress.current + delta * 0.0035
            )
        )
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return
        if (!isDragging.current) return

        isDragging.current = false

        targetProgress.current = Math.round(targetProgress.current)

        try {
            event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {}
    }

    // ------------------------------------------------------------
    // CARD HOVER & TILT
    // ------------------------------------------------------------

    const handleMouseEnter = (index: number) => {
        if (isStaticRenderer) return
        if (isDragging.current) return

        hoveredCard.current = index
    }

    const handleMouseMove = (
        event: React.MouseEvent<HTMLDivElement>,
        index: number
    ) => {
        if (isStaticRenderer) return
        if (isDragging.current) return

        hoveredCard.current = index

        const rect = event.currentTarget.getBoundingClientRect()

        if (rect.width <= 0 || rect.height <= 0) {
            return
        }

        const rawX = (event.clientX - rect.left) / rect.width - 0.5

        const rawY = (event.clientY - rect.top) / rect.height - 0.5

        const clampedX = Math.max(-0.5, Math.min(0.5, rawX))

        const clampedY = Math.max(-0.5, Math.min(0.5, rawY))

        targetTilt.current = {
            x: clampedX * 18,
            y: clampedY * 18,
        }
    }

    const handleMouseLeave = () => {
        if (isStaticRenderer) return

        hoveredCard.current = null

        targetTilt.current = {
            x: 0,
            y: 0,
        }
    }

    // ------------------------------------------------------------
    // CARD SIZE
    // ------------------------------------------------------------

    // Desktop/tablet remain exactly the same.
    // Mobile gets a larger card without changing the scene scale.
    const cardWidth = isMobile ? 260 : 300 * responsiveScale

    const cardHeight = isMobile ? 347 : 400 * responsiveScale

    // Static renderer gets a deterministic initial state.
    const currentProgress = isStaticRenderer ? 0 : progressRef.current

    // ------------------------------------------------------------
    // RENDER
    // ------------------------------------------------------------

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                width: "100%",
                height: "100%",

                minWidth: 0,
                minHeight: 0,

                background:
                    "radial-gradient(ellipse at 50% 48%, rgba(255,241,0,0.045) 0%, transparent 65%), #020204",

                position: "relative",

                overflow: "hidden",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                perspective: 1400,

                transformStyle: "preserve-3d",

                touchAction: isStaticRenderer ? "auto" : "none",

                userSelect: "none",

                ...props.style,
            }}
        >
            {projects.map((project, index) => {
                const t = index - currentProgress

                const absT = Math.abs(t)

                if (absT > 3.2) {
                    return null
                }

                // ------------------------------------------------
                // HELIX 3D COORDINATES
                // ------------------------------------------------

                const angleRad = (t * angle * Math.PI) / 180

                // Mobile horizontal position is slightly tighter.
                // Everything else remains unchanged.
                const x = Math.sin(angleRad) * radius * (isMobile ? 0.9 : 1)

                const y = t * verticalSpacing + centerYOffset

                const z = (Math.cos(angleRad) - 1) * radius

                const rotation = t * angle

                const scale = Math.max(0.58, 1 - absT * 0.14)

                const opacity = Math.max(0.12, 1 - Math.pow(absT / 2.6, 1.5))

                const isCenter = absT < 0.5

                // Disable hover state in static renderer.
                const hover = isStaticRenderer
                    ? 0
                    : cardHoverWeights.current[index] || 0

                const lift = hover * 32

                const hoverScale = 1 + hover * 0.04

                const tiltX = -currentTilt.current.y * hover

                const tiltY = currentTilt.current.x * hover

                return (
                    <div
                        key={`${project.number}-${index}`}
                        onClick={() => {
                            if (isStaticRenderer) {
                                return
                            }

                            targetProgress.current = index
                        }}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseMove={(event) => handleMouseMove(event, index)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            position: "absolute",

                            left: "50%",

                            top: "50%",

                            width: cardWidth,

                            height: cardHeight,

                            transformStyle: "preserve-3d",

                            backfaceVisibility: "hidden",

                            willChange: isStaticRenderer
                                ? "auto"
                                : "transform, opacity",

                            transform: `
                                    translate(-50%, -50%)
                                    translate3d(
                                        ${x.toFixed(2)}px,
                                        ${y.toFixed(2)}px,
                                        ${(z + lift).toFixed(2)}px
                                    )
                                    rotateY(${(rotation + tiltY).toFixed(2)}deg)
                                    rotateX(${tiltX.toFixed(2)}deg)
                                    scale(${(scale * hoverScale).toFixed(4)})
                                `,

                            opacity,

                            zIndex: isCenter ? 100 : Math.round(50 - absT * 10),

                            background: "#11141d",

                            border: "none",

                            borderRadius: 20 * responsiveScale,

                            boxShadow: isCenter
                                ? `
                                            0 45px 110px rgba(0,0,0,.95),
                                            0 12px 45px rgba(0,0,0,.55),
                                            0 0 0 ${1 * hover}px rgba(255,255,255,${0.12 * hover}),
                                            0 0 ${55 * hover}px rgba(255,241,0,${0.1 * hover})
                                        `
                                : "0 25px 70px rgba(0,0,0,.65)",

                            color: "#fff",

                            boxSizing: "border-box",

                            cursor: isCenter ? "default" : "pointer",
                        }}
                    >
                        {/* IMAGE */}
                        <div
                            style={{
                                position: "absolute",

                                top: 0,
                                left: 0,
                                right: 0,

                                height: "63%",

                                overflow: "hidden",

                                background: "#080a12",

                                borderRadius: `${20 * responsiveScale}px ${
                                    20 * responsiveScale
                                }px 0 0`,

                                transformStyle: "preserve-3d",

                                backfaceVisibility: "hidden",
                            }}
                        >
                            {project.image?.src ? (
                                <img
                                    src={project.image.src}
                                    srcSet={project.image.srcSet}
                                    alt={project.image.alt || project.title}
                                    draggable={false}
                                    style={{
                                        width: "100%",

                                        height: "100%",

                                        objectFit: "cover",

                                        display: "block",

                                        willChange: isStaticRenderer
                                            ? "auto"
                                            : "transform",

                                        transform: `
                                                translateZ(-${hover * 16}px)
                                                scale(${1 + hover * 0.08})
                                            `,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",

                                        height: "100%",

                                        display: "flex",

                                        alignItems: "center",

                                        justifyContent: "center",

                                        color: "#555",

                                        fontSize: 13 * responsiveScale,

                                        letterSpacing: ".1em",
                                    }}
                                >
                                    ADD IMAGE
                                </div>
                            )}

                            {/* GRADIENT OVERLAY */}
                            <div
                                style={{
                                    position: "absolute",

                                    inset: 0,

                                    background:
                                        "linear-gradient(180deg, rgba(0,0,0,.3) 0%, rgba(0,0,0,0) 40%, #11141d 100%)",

                                    pointerEvents: "none",
                                }}
                            />
                        </div>

                        {/* TOP BADGES */}
                        <div
                            style={{
                                position: "absolute",

                                top: 18 * responsiveScale,

                                left: 18 * responsiveScale,

                                right: 18 * responsiveScale,

                                display: "flex",

                                justifyContent: "space-between",

                                zIndex: 5,

                                transform: `translateZ(${hover * 20}px)`,

                                transformStyle: "preserve-3d",
                            }}
                        >
                            <span
                                style={{
                                    background: "rgba(0,0,0,.6)",

                                    border: "1px solid rgba(255,255,255,.15)",

                                    borderRadius: 999,

                                    padding: `${6 * responsiveScale}px ${
                                        10 * responsiveScale
                                    }px`,

                                    fontSize: 11 * responsiveScale,

                                    color: isCenter ? "#FFF100" : "#fff",

                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                {project.number}
                            </span>

                            <span
                                style={{
                                    background: "rgba(0,0,0,.6)",

                                    border: "1px solid rgba(255,255,255,.15)",

                                    borderRadius: 999,

                                    padding: `${6 * responsiveScale}px ${
                                        10 * responsiveScale
                                    }px`,

                                    fontSize: 10 * responsiveScale,

                                    backdropFilter: "blur(10px)",
                                }}
                            >
                                {project.category}
                            </span>
                        </div>

                        {/* CARD CONTENT */}
                        <div
                            style={{
                                position: "absolute",

                                left: 24 * responsiveScale,

                                right: 24 * responsiveScale,

                                bottom: 24 * responsiveScale,

                                zIndex: 5,

                                transform: `translateZ(${hover * 32}px)`,

                                transformStyle: "preserve-3d",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 10 * responsiveScale,

                                    fontWeight: 600,

                                    letterSpacing: ".15em",

                                    color: "#FFF100",

                                    marginBottom: 8 * responsiveScale,

                                    textTransform: "uppercase",
                                }}
                            >
                                {project.client}
                            </div>

                            <div
                                style={{
                                    fontSize: 25 * responsiveScale,

                                    fontWeight: 600,

                                    letterSpacing: "-.02em",

                                    lineHeight: 1.1,

                                    marginBottom: 8 * responsiveScale,
                                }}
                            >
                                {project.title}
                            </div>

                            <div
                                style={{
                                    fontSize: 12 * responsiveScale,

                                    lineHeight: 1.45,

                                    color: "#94a3b8",

                                    display: "-webkit-box",

                                    WebkitLineClamp: 2,

                                    WebkitBoxOrient: "vertical",

                                    overflow: "hidden",
                                }}
                            >
                                {project.description}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ------------------------------------------------------------
// DEFAULT PROPS
// ------------------------------------------------------------

Helix3DCarousel.defaultProps = {
    projects: DEFAULT_PROJECTS,
    radius: 420,
    verticalSpacing: 155,
    angle: 44,
    centerYOffset: -50,
}

// ------------------------------------------------------------
// PROPERTY CONTROLS
// ------------------------------------------------------------

addPropertyControls(Helix3DCarousel, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 10,

        defaultValue: DEFAULT_PROJECTS,

        control: {
            type: ControlType.Object,

            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01",
                },

                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "COASTAL ESCAPE",
                },

                client: {
                    type: ControlType.String,
                    title: "Client",
                    defaultValue: "PACIFIC HORIZON",
                },

                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Travel",
                },

                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "A beautiful coastal experience.",
                    displayTextArea: true,
                },

                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
    },

    centerYOffset: {
        type: ControlType.Number,
        title: "Center Y",
        min: -200,
        max: 200,
        step: 5,
        defaultValue: -50,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 200,
        max: 1000,
        step: 10,
        defaultValue: 420,
    },

    verticalSpacing: {
        type: ControlType.Number,
        title: "Vertical",
        min: 80,
        max: 400,
        step: 5,
        defaultValue: 155,
    },

    angle: {
        type: ControlType.Number,
        title: "Angle",
        min: 20,
        max: 80,
        step: 1,
        defaultValue: 44,
    },
})
