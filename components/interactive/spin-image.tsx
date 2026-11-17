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


/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 60
 * @framerIntrinsicHeight 60
 */
export default function Spin_Image(props) {
    const {
        image,
        imageFit,
        baseSpeed,
        clickBoost,
        maxSpeed,
        acceleration,
        deceleration,
        decayDelay,
        direction,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const spinnerRef = React.useRef<HTMLDivElement | null>(null)

    const rotation = React.useRef(0)
    const currentSpeed = React.useRef(baseSpeed)
    const targetSpeed = React.useRef(baseSpeed)

    const frameRef = React.useRef<number | null>(null)
    const lastTime = React.useRef<number | null>(null)
    const decayTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const [isVisible, setIsVisible] = React.useState(false)

    // Visible component detection for viewport-based animation.
    React.useEffect(() => {
        if (isStaticRenderer) {
            setIsVisible(false)
            return
        }

        const element = containerRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            {
                threshold: 0.01,
            }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [isStaticRenderer])

    // Update the base speed when changed from Framer.
    React.useEffect(() => {
        currentSpeed.current = Math.max(currentSpeed.current, baseSpeed)
        targetSpeed.current = Math.max(targetSpeed.current, baseSpeed)
    }, [baseSpeed])

    // Continuous rotation animation only when visible and not in static render.
    React.useEffect(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }

        lastTime.current = null

        if (isStaticRenderer) {
            rotation.current = 0
            currentSpeed.current = baseSpeed
            targetSpeed.current = baseSpeed

            if (spinnerRef.current) {
                spinnerRef.current.style.transform = `rotate(0deg)`
            }

            return
        }

        if (!isVisible) {
            return
        }

        const animate = (time: number) => {
            if (lastTime.current === null) {
                lastTime.current = time
            }

            const delta = Math.min((time - lastTime.current) / 1000, 0.05)
            lastTime.current = time

            const isAccelerating = targetSpeed.current > currentSpeed.current
            const duration = isAccelerating ? acceleration : deceleration
            const safeDuration = Math.max(duration, 0.01)
            const smoothing = 1 - Math.exp((-5 * delta) / safeDuration)

            currentSpeed.current +=
                (targetSpeed.current - currentSpeed.current) * smoothing

            const directionMultiplier = direction === "Left" ? -1 : 1

            rotation.current +=
                currentSpeed.current * delta * directionMultiplier

            if (spinnerRef.current) {
                spinnerRef.current.style.transform = `rotate(${rotation.current}deg)`
            }

            frameRef.current = requestAnimationFrame(animate)
        }

        frameRef.current = requestAnimationFrame(animate)

        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }

            lastTime.current = null
        }
    }, [
        isStaticRenderer,
        isVisible,
        baseSpeed,
        acceleration,
        deceleration,
        direction,
    ])

    // Each click adds more speed.
    const handleClick = () => {
        if (isStaticRenderer) return

        const speedNow = Math.max(currentSpeed.current, targetSpeed.current)
        targetSpeed.current = Math.min(speedNow + clickBoost, maxSpeed)

        // Every new click resets the delay before slowing down.
        if (decayTimer.current !== null) {
            clearTimeout(decayTimer.current)
        }

        decayTimer.current = setTimeout(() => {
            targetSpeed.current = baseSpeed
        }, decayDelay * 1000)
    }

    React.useEffect(() => {
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
            }

            if (decayTimer.current !== null) {
                clearTimeout(decayTimer.current)
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                height: 60,
                aspectRatio: "1 / 1",

                position: "relative",
                display: "block",

                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",

                // Framer overrides the height when using Fixed sizing.
                // Width stays automatic and follows the 1:1 aspect ratio.
                ...style,
            }}
        >
            <div
                ref={spinnerRef}
                onPointerDown={handleClick}
                style={{
                    position: "absolute",
                    inset: 0,

                    width: "100%",
                    height: "100%",

                    borderRadius: "50%",
                    overflow: "hidden",

                    cursor: "pointer",

                    transform: "rotate(0deg)",
                    transformOrigin: "50% 50%",
                    willChange: "transform",

                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                {image && (
                    <img
                        src={image}
                        draggable={false}
                        alt=""
                        style={{
                            position: "absolute",
                            inset: 0,

                            width: "100%",
                            height: "100%",

                            objectFit: imageFit,
                            display: "block",

                            pointerEvents: "none",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                        }}
                    />
                )}
            </div>
        </div>
    )
}

Spin_Image.displayName = "Spin Image"

Spin_Image.defaultProps = {
    imageFit: "cover",

    baseSpeed: 18,
    clickBoost: 90,
    maxSpeed: 600,

    acceleration: 0.35,
    deceleration: 1.8,
    decayDelay: 0.5,

    direction: "Right",
}

addPropertyControls(Spin_Image, {
    image: {
        type: ControlType.Image,
        title: "Image",
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },

    baseSpeed: {
        type: ControlType.Number,
        title: "Base Speed",
        defaultValue: 18,
        min: 0,
        max: 360,
        step: 1,
        unit: "°/s",
    },

    clickBoost: {
        type: ControlType.Number,
        title: "Click Boost",
        defaultValue: 90,
        min: 10,
        max: 500,
        step: 10,
        unit: "°/s",
    },

    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        defaultValue: 600,
        min: 50,
        max: 2000,
        step: 50,
        unit: "°/s",
    },

    acceleration: {
        type: ControlType.Number,
        title: "Acceleration",
        defaultValue: 0.35,
        min: 0.05,
        max: 3,
        step: 0.05,
        unit: "s",
    },

    deceleration: {
        type: ControlType.Number,
        title: "Deceleration",
        defaultValue: 1.8,
        min: 0.1,
        max: 8,
        step: 0.1,
        unit: "s",
    },

    decayDelay: {
        type: ControlType.Number,
        title: "Slow Delay",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Right", "Left"],
        optionTitles: ["Right", "Left"],
        defaultValue: "Right",

        description: "Created by [Neo](https://x.com/bybrxneo)",
    },
})
