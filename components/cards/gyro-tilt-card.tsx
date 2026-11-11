import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"
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
 * GYRO TILT CARD
 *
 * Most "3D tilt card" components on the marketplace only respond to mouse
 * position — meaning the whole effect is dead on mobile, where most
 * traffic actually is. This one wraps any content and tilts it for real:
 * mouse on desktop, live device orientation (gyroscope) on phones and
 * tablets, with proper iOS 13+ permission handling and a graceful ambient
 * idle-sway fallback for the rare device that supports neither — so the
 * card is never just flat and dead. A rotating border-beam plays while the
 * card is idle and fades out the instant a mouse actually engages it,
 * handing off to the regular tilt/glare interaction.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

interface DeviceOrientationEventiOS {
    requestPermission?: () => Promise<"granted" | "denied">
}

interface GyroTiltCardProps {
    children: React.ReactNode
    maxTilt: number
    perspective: number
    glare: boolean
    glareOpacity: number
    shadow: boolean
    idleSway: boolean
    permissionLabel: string
    borderRadius: number
    beam: boolean
    beamColorFrom: string
    beamColorTo: string
    beamWidth: number
    beamSpeed: number
    breathing: boolean
}

export default function GyroTiltCard(props: GyroTiltCardProps) {
    const {
        children,
        maxTilt,
        perspective,
        glare,
        glareOpacity,
        shadow,
        idleSway,
        permissionLabel,
        borderRadius,
        beam,
        beamColorFrom,
        beamColorTo,
        beamWidth,
        beamSpeed,
        breathing,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const reduceMotion = Boolean(isStatic || prefersReducedMotion)
    const [isHovered, setIsHovered] = useState(false)

    // Tracks whether the card is visible or close to entering the viewport.
    // This prevents the idle RAF animation from running for offscreen cards.
    const [isInViewport, setIsInViewport] = useState(false)

    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)

    const springX = useSpring(rotateX, {
        stiffness: 200,
        damping: 22,
        mass: 0.6,
    })

    const springY = useSpring(rotateY, {
        stiffness: 200,
        damping: 22,
        mass: 0.6,
    })

    const glareX = useTransform(springY, [-maxTilt, maxTilt], [0, 100])

    const glareY = useTransform(springX, [-maxTilt, maxTilt], [100, 0])

    const shadowX = useTransform(springY, [-maxTilt, maxTilt], [16, -16])

    const shadowY = useTransform(springX, [-maxTilt, maxTilt], [-16, 16])

    const shadowBlur = useTransform(
        [springX, springY] as any,
        ([x, y]: number[]) => 24 + (Math.abs(x) + Math.abs(y)) * 0.8
    )

    const shadowBoxShadow = useTransform(
        shadowBlur,
        (b) => `0 ${b}px ${b * 1.4}px rgba(0,0,0,0.28)`
    )

    const glareBackground = useTransform(
        [glareX, glareY] as any,
        ([gx, gy]: number[]) =>
            `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,${glareOpacity}), transparent 60%)`
    )

    const [mode, setMode] = useState<"none" | "mouse" | "gyro" | "idle">("none")

    const [needsPermission, setNeedsPermission] = useState(false)

    // ------------------------------------------------------------
    // Viewport visibility detection
    // ------------------------------------------------------------
    // The idle animation only needs to run when the card is visible
    // or close to entering the viewport.
    useEffect(() => {
        const element = containerRef.current

        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting)
            },
            {
                // Start the idle animation slightly before the card
                // actually enters the viewport.
                rootMargin: "100px",
                threshold: 0,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [])

    // ------------------------------------------------------------
    // Decide the input source once
    // ------------------------------------------------------------
    // A fine pointer (mouse/trackpad) gets hover tilt.
    // Anything else tries device orientation.
    useEffect(() => {
        if (reduceMotion) return

        const hasFinePointer = window.matchMedia?.("(pointer: fine)").matches

        if (hasFinePointer) {
            setMode("mouse")
            return
        }

        const DOE = (window as any).DeviceOrientationEvent as
            | (typeof DeviceOrientationEvent & DeviceOrientationEventiOS)
            | undefined

        if (!DOE) {
            setMode(idleSway ? "idle" : "none")
            return
        }

        if (typeof DOE.requestPermission === "function") {
            // iOS 13+: needs an explicit user gesture before
            // permission can be granted.
            setNeedsPermission(true)
            setMode(idleSway ? "idle" : "none")
        } else {
            // Android / other browsers: no permission gate needed.
            setMode("gyro")
        }
    }, [reduceMotion, idleSway])

    // ------------------------------------------------------------
    // Gyroscope
    // ------------------------------------------------------------
    // Attach the gyroscope listener once we're in gyro mode.
    useEffect(() => {
        if (mode !== "gyro") return

        function handleOrientation(e: DeviceOrientationEvent) {
            const beta = e.beta ?? 0
            const gamma = e.gamma ?? 0

            const angle =
                (screen as any).orientation?.angle ??
                (window as any).orientation ??
                0

            let x = gamma
            let y = beta

            if (angle === 90) {
                x = -beta
                y = gamma
            } else if (angle === -90 || angle === 270) {
                x = beta
                y = -gamma
            } else if (angle === 180) {
                x = -gamma
                y = -beta
            }

            const nx = clamp(x, -45, 45) / 45
            const ny = clamp(y, -45, 45) / 45

            rotateY.set(nx * maxTilt)
            rotateX.set(-ny * maxTilt)
        }

        window.addEventListener("deviceorientation", handleOrientation)

        return () =>
            window.removeEventListener("deviceorientation", handleOrientation)
    }, [mode, maxTilt, rotateX, rotateY])

    // ------------------------------------------------------------
    // Ambient idle sway
    // ------------------------------------------------------------
    // The animation only runs while:
    // 1. The component is in idle mode
    // 2. The component is visible or within the viewport margin
    //
    // When the card leaves the viewport, the effect cleanup cancels
    // the requestAnimationFrame loop immediately.
    useEffect(() => {
        if (mode !== "idle" || !isInViewport) return

        let raf: number
        const start = performance.now()

        function tick(now: number) {
            const t = (now - start) / 1000

            rotateY.set(Math.sin(t * 0.6) * (maxTilt * 0.35))

            rotateX.set(Math.cos(t * 0.5) * (maxTilt * 0.22))

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
        }
    }, [mode, isInViewport, maxTilt, rotateX, rotateY])

    // ------------------------------------------------------------
    // iOS Gyroscope permission
    // ------------------------------------------------------------
    async function requestGyroPermission() {
        const DOE = (window as any).DeviceOrientationEvent as
            | (typeof DeviceOrientationEvent & DeviceOrientationEventiOS)
            | undefined

        if (!DOE?.requestPermission) return

        try {
            const result = await DOE.requestPermission()

            if (result === "granted") {
                setNeedsPermission(false)
                setMode("gyro")
            }
        } catch {
            // Permission dialog dismissed or blocked —
            // stay on idle sway.
        }
    }

    // ------------------------------------------------------------
    // Mouse interaction
    // ------------------------------------------------------------
    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (mode !== "mouse" || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()

        const px = (e.clientX - rect.left) / rect.width - 0.5

        const py = (e.clientY - rect.top) / rect.height - 0.5

        rotateY.set(px * 2 * maxTilt)
        rotateX.set(-py * 2 * maxTilt)
    }

    function handleMouseLeave() {
        setIsHovered(false)

        if (mode !== "mouse") return

        rotateX.set(0)
        rotateY.set(0)
    }

    const activeRotateX = reduceMotion ? 0 : springX
    const activeRotateY = reduceMotion ? 0 : springY

    // The beam plays while the card is idle and hands off to the
    // tilt/glare interaction the moment a mouse actually engages it.
    // On touch/gyro there's no discrete hover, so it stays on as
    // ambient motion.
    const showBeam = beam && !reduceMotion && (mode !== "mouse" || !isHovered)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                perspective,
            }}
        >
            <motion.div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                animate={{
                    scale: showBeam && breathing ? [1, 1.015, 1] : 1,
                }}
                transition={{
                    scale: {
                        duration: 2.4,
                        repeat: showBeam && breathing ? Infinity : 0,
                        ease: "easeInOut",
                    },
                }}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    transformStyle: "preserve-3d",
                    rotateX: activeRotateX,
                    rotateY: activeRotateY,
                    boxShadow:
                        shadow && !reduceMotion
                            ? undefined
                            : "0 20px 40px rgba(0,0,0,0.18)",
                }}
            >
                {beam && !reduceMotion && (
                    <motion.div
                        aria-hidden
                        animate={{
                            opacity: showBeam ? 1 : 0,
                        }}
                        transition={{
                            duration: 0.4,
                            ease: "easeOut",
                        }}
                        style={{
                            position: "absolute",
                            inset: -beamWidth,
                            borderRadius: borderRadius + beamWidth,
                            padding: beamWidth,
                            overflow: "hidden",
                            pointerEvents: "none",
                            WebkitMask:
                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    >
                        <motion.div
                            animate={{
                                rotate: 360,
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: beamSpeed,
                                ease: "linear",
                            }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "220%",
                                height: "220%",
                                x: "-50%",
                                y: "-50%",
                                background: `conic-gradient(from 0deg, transparent 0%, ${beamColorFrom} 6%, ${beamColorTo} 14%, transparent 26%, transparent 100%)`,
                            }}
                        />
                    </motion.div>
                )}

                {shadow && !reduceMotion && (
                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            x: shadowX,
                            y: shadowY,
                            boxShadow: shadowBoxShadow,
                            zIndex: -1,
                        }}
                    />
                )}

                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        borderRadius,
                        overflow: "hidden",
                    }}
                >
                    {children}

                    {glare && !reduceMotion && (
                        <motion.div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                mixBlendMode: "overlay",
                                background: glareBackground,
                            }}
                        />
                    )}
                </div>
            </motion.div>

            {needsPermission && !reduceMotion && (
                <motion.button
                    onClick={requestGyroPermission}
                    initial={{
                        opacity: 0,
                        y: 8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    whileTap={{
                        scale: 0.96,
                    }}
                    style={{
                        position: "absolute",
                        bottom: 12,
                        left: "50%",
                        translateX: "-50%",
                        border: "none",
                        borderRadius: 999,
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(0,0,0,0.65)",
                        color: "#fff",
                        backdropFilter: "blur(6px)",
                        cursor: "pointer",
                    }}
                >
                    {permissionLabel}
                </motion.button>
            )}
        </div>
    )
}

GyroTiltCard.displayName = "Gyro Tilt Card"

addPropertyControls(GyroTiltCard, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },

    maxTilt: {
        type: ControlType.Number,
        title: "Max Tilt (deg)",
        min: 2,
        max: 40,
        step: 1,
        defaultValue: 16,
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 400,
        max: 2000,
        step: 50,
        defaultValue: 900,
    },

    glare: {
        type: ControlType.Boolean,
        title: "Glare",
        defaultValue: true,
    },

    glareOpacity: {
        type: ControlType.Number,
        title: "Glare Opacity",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.35,
        hidden: (p: GyroTiltCardProps) => !p.glare,
    },

    shadow: {
        type: ControlType.Boolean,
        title: "Dynamic Shadow",
        defaultValue: true,
    },

    idleSway: {
        type: ControlType.Boolean,
        title: "Idle Sway Fallback",
        defaultValue: true,
        description:
            "Gentle ambient tilt animation for devices with no mouse and no usable gyroscope, so the card is never fully static.",
    },

    permissionLabel: {
        type: ControlType.String,
        title: "Permission Label",
        defaultValue: "Tap to enable tilt",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        defaultValue: 20,
    },

    beam: {
        type: ControlType.Boolean,
        title: "Idle Beam",
        defaultValue: true,
        description:
            "A rotating light plays around the border while idle, and fades out on hover so the tilt/glare interaction takes over.",
    },

    beamColorFrom: {
        type: ControlType.Color,
        title: "Beam Start",
        defaultValue: "#7C5CFF",
        hidden: (p: GyroTiltCardProps) => !p.beam,
    },

    beamColorTo: {
        type: ControlType.Color,
        title: "Beam End",
        defaultValue: "#00E0FF",
        hidden: (p: GyroTiltCardProps) => !p.beam,
    },

    beamWidth: {
        type: ControlType.Number,
        title: "Beam Width",
        min: 1,
        max: 6,
        step: 0.5,
        defaultValue: 2,
        hidden: (p: GyroTiltCardProps) => !p.beam,
    },

    beamSpeed: {
        type: ControlType.Number,
        title: "Beam Speed (s)",
        min: 1,
        max: 10,
        step: 0.5,
        defaultValue: 3.5,
        hidden: (p: GyroTiltCardProps) => !p.beam,
    },

    breathing: {
        type: ControlType.Boolean,
        title: "Breathing Scale",
        defaultValue: true,
        hidden: (p: GyroTiltCardProps) => !p.beam,
    },
})
