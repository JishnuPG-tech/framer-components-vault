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


type Props = {
    hideNativeCursor: boolean
    size: number
    smoothing: number
    fillType: "solid" | "gradient"
    color: string
    gradientStart: string
    gradientEnd: string
}

let activeCursorInstances = 0
let originalCursorStyle = ""

/**
 *
 * @framerIntrinsicWidth 8
 * @framerIntrinsicHeight 8
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 *
 * @framerDisableUnlink
 */

export default function ButterflyCursor(props: Props) {
    const {
        hideNativeCursor = false,
        size = 4,
        smoothing = 0.6,
        fillType = "solid",
        color = "#38BDF8",
        gradientStart = "#38BDF8",
        gradientEnd = "#3A9FF8",
    } = props

    const isStatic = useIsStaticRenderer()

    // Sanitized to prevent Safari/Firefox issues with colons in React.useId()
    const instanceId = React.useId().replace(/:/g, "")
    const gradientId = `butterfly-grad-${instanceId}`

    const baseWidth = 12
    const baseHeight = 16

    const width = baseWidth * size
    const height = baseHeight * size

    const mouseX = useMotionValue(
        typeof window !== "undefined" ? window.innerWidth / 2 : 0
    )
    const mouseY = useMotionValue(
        typeof window !== "undefined" ? window.innerHeight / 2 : 0
    )
    const cursorOpacity = useMotionValue(0)

    const springX = useSpring(mouseX, { stiffness: 500, damping: 50 })
    const springY = useSpring(mouseY, { stiffness: 500, damping: 50 })
    const smoothOpacity = useSpring(cursorOpacity, {
        stiffness: 400,
        damping: 30,
    })

    const rotate = useMotionValue(0)
    const targetRotation = React.useRef(0)

    const clickBoost = useSpring(0, { stiffness: 300, damping: 25 })
    const [animKey, setAnimKey] = React.useState(0)
    const timeoutRef = React.useRef<number | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = React.useState(true)
    const hasMoved = React.useRef(false)

    React.useEffect(() => {
        if (isStatic || typeof document === "undefined" || !hideNativeCursor)
            return

        if (activeCursorInstances === 0) {
            originalCursorStyle = document.body.style.cursor
            document.body.style.cursor = "none"
        }

        activeCursorInstances++

        return () => {
            activeCursorInstances--

            if (activeCursorInstances === 0) {
                document.body.style.cursor = originalCursorStyle
            }
        }
    }, [hideNativeCursor, isStatic])

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const handlePointerMove = (e: PointerEvent) => {
            if (!isVisible) return

            if (!hasMoved.current) {
                mouseX.set(e.clientX)
                mouseY.set(e.clientY)
                if (springX.jump) springX.jump(e.clientX)
                if (springY.jump) springY.jump(e.clientY)
                hasMoved.current = true
            } else {
                mouseX.set(e.clientX)
                mouseY.set(e.clientY)
            }

            cursorOpacity.set(1)
        }

        const handleMouseLeave = () => {
            hasMoved.current = false
            cursorOpacity.set(0)
        }

        const handleClick = () => {
            if (!isVisible) return
            clickBoost.set(1)
            setAnimKey((k) => k + 1)
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = window.setTimeout(() => {
                clickBoost.set(0)
                timeoutRef.current = null
            }, 200)
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        document.addEventListener("mouseleave", handleMouseLeave)
        window.addEventListener("pointerdown", handleClick)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            document.removeEventListener("mouseleave", handleMouseLeave)
            window.removeEventListener("pointerdown", handleClick)
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [
        mouseX,
        mouseY,
        cursorOpacity,
        springX,
        springY,
        clickBoost,
        isStatic,
        isVisible,
    ])

    React.useEffect(() => {
        if (!isVisible || isStatic) return

        let animationFrameId: number

        const updateRotation = () => {
            const vx = springX.getVelocity()
            const vy = springY.getVelocity()
            const speed = Math.sqrt(vx * vx + vy * vy)

            const isMoving = speed > 15

            if (isMoving) {
                targetRotation.current =
                    Math.atan2(vy, vx) * (180 / Math.PI) + 90
            } else {
                targetRotation.current = 0
            }

            const currentAngle = rotate.get()
            let delta = targetRotation.current - (currentAngle % 360)

            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            const ease = isMoving ? 0.08 : 0.015

            rotate.set(currentAngle + delta * ease)

            animationFrameId = requestAnimationFrame(updateRotation)
        }

        animationFrameId = requestAnimationFrame(updateRotation)

        return () => cancelAnimationFrame(animationFrameId)
    }, [springX, springY, rotate, isVisible, isStatic])

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined" || !containerRef.current)
            return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible(entry.isIntersecting)
                })
            },
            { threshold: 0 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    if (isStatic) {
        return (
            <div
                style={{
                    width: 8,
                    height: 8,
                    opacity: 0.1,
                    borderRadius: "50%",
                }}
            />
        )
    }

    const baseDuration = 0.4 + Math.pow(smoothing, 2) * 1.8
    const baseAmplitude = 40 * (1 - smoothing * 0.4)

    const amplitude = useTransform(
        clickBoost,
        [0, 1],
        [baseAmplitude, baseAmplitude * 1.8]
    )
    const duration = useTransform(
        clickBoost,
        [0, 1],
        [baseDuration, baseDuration * 0.5]
    )

    const fillValue = fillType === "gradient" ? `url(#${gradientId})` : color

    return (
        <div
            ref={containerRef}
            style={{
                position: "fixed",
                inset: 0,
                pointerEvents: "none",
                perspective: 5000,
                zIndex: 9999,
            }}
        >
            {fillType === "gradient" && (
                <svg width="0" height="0" style={{ position: "absolute" }}>
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={gradientStart} />
                            <stop offset="100%" stopColor={gradientEnd} />
                        </linearGradient>
                    </defs>
                </svg>
            )}

            <motion.div
                style={{
                    position: "absolute",
                    left: springX,
                    top: springY,
                    x: "-50%",
                    y: "-50%",
                    width: width * 2,
                    height: height,
                    rotate,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    opacity: isVisible ? smoothOpacity : 0,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        width,
                        height,
                        left: "50%",
                        top: "50%",
                        x: "-100%",
                        y: "-50%",
                        transformStyle: "flat",
                    }}
                    key={`right-${animKey}`}
                >
                    <motion.svg
                        viewBox="0 0 12 16"
                        style={{
                            width: "100%",
                            height: "100%",
                            transformOrigin: "right center",
                            rotateY: amplitude,
                        }}
                        animate={
                            isVisible
                                ? {
                                      rotateY: [
                                          0,
                                          amplitude.get(),
                                          0,
                                          amplitude.get(),
                                          0,
                                      ],
                                  }
                                : { rotateY: 0 }
                        }
                        transition={{
                            repeat: Infinity,
                            duration: duration.get(),
                            ease: "easeInOut",
                        }}
                    >
                        <path
                            d="M0.221799 0.392428C2.006 -1.40921 12 3.24805 12 9.14307C12 12.4736 10.7625 16 7.41203 16C3.91959 16 5.56313 10.7104 6.17939 9.79611C2.68705 10.2533 -0.942285 1.56789 0.221799 0.392428Z"
                            fill={fillValue}
                        />
                    </motion.svg>
                </motion.div>

                <motion.div
                    style={{
                        position: "absolute",
                        width,
                        height,
                        left: "50%",
                        top: "50%",
                        x: "0%",
                        y: "-50%",
                        transformStyle: "flat",
                    }}
                    key={`left-${animKey}`}
                >
                    <motion.svg
                        viewBox="0 0 12 16"
                        style={{
                            width: "100%",
                            height: "100%",
                            transformOrigin: "left center",
                            rotateY: amplitude,
                        }}
                        animate={
                            isVisible
                                ? {
                                      rotateY: [
                                          0,
                                          -amplitude.get(),
                                          0,
                                          -amplitude.get(),
                                          0,
                                      ],
                                  }
                                : { rotateY: 0 }
                        }
                        transition={{
                            repeat: Infinity,
                            duration: duration.get(),
                            ease: "easeInOut",
                        }}
                    >
                        <path
                            d="M11.7782 0.392428C9.994 -1.40921 0 3.24805 0 9.14307C0 12.4736 1.23752 16 4.58797 16C8.08041 16 6.43687 10.7104 5.82061 9.79611C9.31295 10.2533 12.9423 1.56789 11.7782 0.392428Z"
                            fill={fillValue}
                        />
                    </motion.svg>
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(ButterflyCursor, {
    hideNativeCursor: {
        type: ControlType.Boolean,
        title: "Hide Cursor",
        defaultValue: false,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 0.1,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.6,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill",
        options: ["solid", "gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "solid",
        displaySegmentedControl: true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#38BDF8",
        hidden: ({ fillType }) => fillType !== "solid",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#38BDF8",
        hidden: ({ fillType }) => fillType !== "gradient",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "End Color",
        description:
            "Crafted by [Shouvik Biswas](https://dub.sh/framer-components)",
        defaultValue: "#3A9FF8",
        hidden: ({ fillType }) => fillType !== "gradient",
    },
})
