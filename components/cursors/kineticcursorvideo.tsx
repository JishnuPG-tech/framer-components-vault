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

import {
    motion,
    useMotionValue,
    useSpring,
    useAnimationFrame,
} from "framer-motion"

/**
 * Cursor Video Hero
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function CursorVideoHero(props) {
    const isStatic = useIsStaticRenderer()

    if (isStatic) {
        return <StaticCursorVideoHero {...props} />
    }

    return <AnimatedCursorVideoHero {...props} />
}

function StaticCursorVideoHero(props) {
    const {
        video,
        sizePercent,
        borderRadius,
        objectFit,
        muted,
        loop,
        playsInline,
    } = props

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: `${sizePercent}vw`,
                    aspectRatio: 16 / 9,
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    backgroundColor: "#111",
                }}
            >
                {video ? (
                    <video
                        src={video}
                        autoPlay={false}
                        loop={loop}
                        muted={muted}
                        playsInline={playsInline}
                        preload="metadata"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: objectFit,
                            display: "block",
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
                            color: "#666",
                            fontFamily: "sans-serif",
                            fontSize: 14,
                        }}
                    >
                        Add a video file
                    </div>
                )}
            </div>
        </div>
    )
}

function AnimatedCursorVideoHero(props) {
    const {
        video,
        sizePercent,
        followAmount,
        maxRotation,
        tiltSpeed,
        springDamping,
        springMass,
        adaptToCursorSpeed,
        borderRadius,
        objectFit,
        muted,
        loop,
        autoplay,
        playsInline,
    } = props

    // Boost factor applied at max cursor speed when adaptation is on
    const SPEED_BOOST = 3
    const FOLLOW_SPRING_STIFFNESS = 300
    const IDLE_TIMEOUT = 70
    const ROTATION_SPRING_STIFFNESS = 120
    const ROTATION_SPRING_DAMPING = 24
    const ROTATION_SPRING_MASS = 1

    const containerRef = React.useRef<HTMLDivElement>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const isVisibleRef = React.useRef(false)

    // Detected aspect ratio from the actual video file
    const [videoAspect, setVideoAspect] = React.useState<number | null>(null)

    React.useEffect(() => {
        setVideoAspect(null)
    }, [video])

    // Target position from cursor (already clamped to viewport bounds)
    const targetX = useMotionValue(0)

    // The motion value we render to the DOM
    const motionX = useMotionValue(0)

    // Internal physics state (not reactive, just integrators)
    const positionRef = React.useRef(0)
    const velocityRef = React.useRef(0)

    // Cursor speed drives follow adaptation; rotation uses its own spring target.
    const cursorVelocityX = useMotionValue(0)
    const rotationTarget = useMotionValue(0)
    const rotation = useSpring(rotationTarget, {
        stiffness: ROTATION_SPRING_STIFFNESS,
        damping: ROTATION_SPRING_DAMPING,
        mass: ROTATION_SPRING_MASS,
    })

    // Keep latest prop values accessible inside the animation loop
    const configRef = React.useRef({
        springDamping,
        springMass,
        adaptToCursorSpeed,
        tiltSpeed,
    })
    configRef.current = {
        springDamping,
        springMass,
        adaptToCursorSpeed,
        tiltSpeed,
    }

    // Manual spring with optional velocity-dependent stiffness
    useAnimationFrame((_time, delta) => {
        if (!isVisibleRef.current) return

        // Cap dt for stability (e.g. when the tab was backgrounded)
        const dt = Math.min(delta / 1000, 1 / 30)
        if (dt <= 0) return

        const cfg = configRef.current
        const target = targetX.get()

        // Scale stiffness with cursor speed when adaptation is enabled
        let stiffness = FOLLOW_SPRING_STIFFNESS
        let damping = cfg.springDamping
        if (cfg.adaptToCursorSpeed) {
            const cursorSpeed = Math.abs(cursorVelocityX.get())
            const speedNorm = Math.min(1, cursorSpeed / cfg.tiltSpeed)
            stiffness = FOLLOW_SPRING_STIFFNESS * (1 + SPEED_BOOST * speedNorm)

            // Preserve the damping ratio so the feel stays consistent
            const baseRatio =
                cfg.springDamping /
                (2 * Math.sqrt(FOLLOW_SPRING_STIFFNESS * cfg.springMass))
            damping = baseRatio * 2 * Math.sqrt(stiffness * cfg.springMass)
        }

        // Semi-implicit Euler integration (stable for stiff springs)
        const displacement = positionRef.current - target
        const springForce = -stiffness * displacement
        const dampingForce = -damping * velocityRef.current
        const acceleration = (springForce + dampingForce) / cfg.springMass

        velocityRef.current += acceleration * dt
        positionRef.current += velocityRef.current * dt

        motionX.set(positionRef.current)
    })

    // Cursor tracking
    React.useEffect(() => {
        const container = containerRef.current
        if (!container || typeof window === "undefined") return

        let lastX = 0
        let lastTime = 0
        let firstMove = true
        let isTracking = false
        let idleTimer: number | null = null
        let frameId: number | null = null
        let latestEvent: MouseEvent | null = null

        const resetInteraction = () => {
            firstMove = true
            lastX = 0
            lastTime = 0
            latestEvent = null

            if (idleTimer !== null) {
                window.clearTimeout(idleTimer)
                idleTimer = null
            }

            if (frameId !== null) {
                window.cancelAnimationFrame(frameId)
                frameId = null
            }

            targetX.set(0)
            cursorVelocityX.set(0)
            rotationTarget.set(0)
            positionRef.current = 0
            velocityRef.current = 0
            motionX.set(0)
        }

        const processPointerMove = (event: MouseEvent) => {
            const now = performance.now()

            // Position logic — clamp travel to viewport bounds
            const viewportWidth = window.innerWidth
            const videoWidth = (sizePercent / 100) * viewportWidth
            const maxTravel = Math.max(0, (viewportWidth - videoWidth) / 2)

            const normalizedX =
                (event.clientX - viewportWidth / 2) / (viewportWidth / 2)
            const clamped = Math.max(-1, Math.min(1, normalizedX))
            targetX.set(clamped * maxTravel * followAmount)

            // Cursor velocity in px/s
            if (!firstMove) {
                const dt = (now - lastTime) / 1000
                if (dt > 0 && dt < 0.1) {
                    const dx = event.clientX - lastX
                    const cursorVelocity = dx / dt
                    const targetRotation = Math.max(
                        -maxRotation,
                        Math.min(
                            maxRotation,
                            (cursorVelocity / tiltSpeed) * maxRotation
                        )
                    )

                    cursorVelocityX.set(cursorVelocity)
                    rotationTarget.set(targetRotation)
                }
            }
            firstMove = false
            lastX = event.clientX
            lastTime = now

            // Mousemove does not emit a final 0 velocity, so idle starts the smooth return.
            if (idleTimer !== null) window.clearTimeout(idleTimer)
            idleTimer = window.setTimeout(() => {
                cursorVelocityX.set(0)
                rotationTarget.set(0)
            }, IDLE_TIMEOUT)
        }

        const handleMouseMove = (event: MouseEvent) => {
            latestEvent = event

            if (frameId !== null) return

            frameId = window.requestAnimationFrame(() => {
                frameId = null

                if (latestEvent) {
                    processPointerMove(latestEvent)
                }
            })
        }

        const startTracking = () => {
            if (isTracking) return

            isVisibleRef.current = true
            isTracking = true
            window.addEventListener("mousemove", handleMouseMove, {
                passive: true,
            })
        }

        const stopTracking = () => {
            if (!isTracking) return

            isVisibleRef.current = false
            isTracking = false
            window.removeEventListener("mousemove", handleMouseMove)
            resetInteraction()
        }

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver((entries) => {
                const entry = entries[0]
                if (!entry) return

                if (entry.isIntersecting) {
                    startTracking()
                } else {
                    stopTracking()
                }
            })

            observer.observe(container)

            return () => {
                observer.disconnect()
                stopTracking()
            }
        }

        startTracking()

        return () => {
            stopTracking()
        }
    }, [
        followAmount,
        sizePercent,
        targetX,
        motionX,
        cursorVelocityX,
        rotationTarget,
        maxRotation,
        tiltSpeed,
    ])

    const handleVideoMetadata = () => {
        const v = videoRef.current
        if (v && v.videoWidth && v.videoHeight) {
            setVideoAspect(v.videoWidth / v.videoHeight)
        }
    }

    const effectiveAspect = videoAspect ?? 16 / 9

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <motion.div
                style={{
                    width: `${sizePercent}vw`,
                    aspectRatio: effectiveAspect,
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    x: motionX,
                    rotate: rotation,
                    willChange: "transform",
                    backgroundColor: "#111",
                }}
            >
                {video ? (
                    <video
                        ref={videoRef}
                        src={video}
                        autoPlay={autoplay}
                        loop={loop}
                        muted={muted}
                        playsInline={playsInline}
                        onLoadedMetadata={handleVideoMetadata}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: objectFit,
                            display: "block",
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
                            color: "#666",
                            fontFamily: "sans-serif",
                            fontSize: 14,
                        }}
                    >
                        Add a video file
                    </div>
                )}
            </motion.div>
        </div>
    )
}

CursorVideoHero.defaultProps = {
    sizePercent: 40,
    followAmount: 0.6,
    maxRotation: 30,
    tiltSpeed: 1500,
    springDamping: 18,
    springMass: 1.2,
    adaptToCursorSpeed: true,
    borderRadius: 12,
    objectFit: "cover",
    muted: true,
    loop: true,
    autoplay: true,
    playsInline: true,
}

addPropertyControls(CursorVideoHero, {
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    sizePercent: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 1,
        unit: "vw",
    },
    followAmount: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    maxRotation: {
        type: ControlType.Number,
        title: "Max Tilt",
        defaultValue: 30,
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
    },
    tiltSpeed: {
        type: ControlType.Number,
        title: "Tilt Speed",
        defaultValue: 1500,
        min: 200,
        max: 5000,
        step: 50,
        unit: "px/s",
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 18,
        min: 1,
        max: 100,
        step: 1,
    },
    springMass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 1.2,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    adaptToCursorSpeed: {
        type: ControlType.Boolean,
        title: "Adapt to Speed",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },
    playsInline: {
        type: ControlType.Boolean,
        title: "Plays Inline",
        defaultValue: true,
    },
})
