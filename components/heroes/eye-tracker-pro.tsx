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


type Shape = "Ball" | "Circle" | "Cube" | "Pill" | "Hexagon" | "Hex flat"
type EyeStyle = "Slant" | "Dots" | "Squares"
type BehaviorMode = "Follow Cursor" | "Look Center" | "Random Look" | "Idle"
type Expression =
    | "Default"
    | "Happy"
    | "Curious"
    | "Sleepy"
    | "Surprised"
    | "Angry"
type FillType = "Solid" | "Gradient"

type Props = {
    follow: number
    bounce: number
    size: number
    shape: Shape
    eyes: EyeStyle
    eyeScale: number
    eyeWidth: number
    eyeRound: number
    eyeHeight: number
    bodyColor: string
    eyeColor: string
    fillType: FillType
    gradientStart: string
    gradientEnd: string
    gradientAngle: number
    idle: boolean
    behaviorMode: BehaviorMode
    expression: Expression
    naturalBlinking: boolean
    followSpeed: number
    rotationRange: number
    enableFocusMode: boolean
    focusScale: number
    focusDuration: number
    returnDuration: number
}

type EyeMetrics = { w: number; h: number; r: number }

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

const SHAPES: Record<Shape, string> = {
    Ball: "M50 0 A50 50 0 1 1 49.99 0 Z",
    Circle: "M50 7 A43 43 0 1 1 49.99 7 Z",
    Cube: "M30 6 H70 A24 24 0 0 1 94 30 V70 A24 24 0 0 1 70 94 H30 A24 24 0 0 1 6 70 V30 A24 24 0 0 1 30 6 Z",
    Pill: "M34 17 H66 A33 33 0 0 1 66 83 H34 A33 33 0 0 1 34 17 Z",
    Hexagon:
        "M59.53 8.50 L81.18 21 Q90.7 26.5 90.7 37.5 V62.5 Q90.7 73.5 81.18 79 L59.53 91.5 Q50 97 40.47 91.5 L18.82 79 Q9.3 73.5 9.3 62.5 V37.5 Q9.3 26.5 18.82 21 L40.47 8.5 Q50 3 59.53 8.5 Z",
    "Hex flat":
        "M91.5 59.53 L79 81.18 Q73.5 90.7 62.5 90.7 H37.5 Q26.5 90.7 21 81.18 L8.5 59.53 Q3 50 8.5 40.47 L21 18.82 Q26.5 9.3 37.5 9.3 H62.5 Q73.5 9.3 79 18.82 L91.5 40.47 Q97 50 91.5 59.53 Z",
}

const EYE_STYLES: Record<EyeStyle, EyeMetrics> = {
    Slant: { w: 9, h: 15, r: 4.5 },
    Dots: { w: 11, h: 11, r: 5.5 },
    Squares: { w: 12, h: 12, r: 3.5 },
}

const RADIUS = 50
const EYE_GAP = 0.19
const MAX_TILT = 64
const MESSAGES = [
    "Hey, I see you.",
    "Boop.",
    "That tickles.",
    "Hi there!",
    "Stop poking me.",
    "I'm watching you.",
    "Again? Okay.",
    "You found me.",
]
const BUBBLE_COLORS = ["#3B5BFF", "#179C52", "#E0307F"]

function prefersReducedMotion() {
    return (
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
}

/**
 * Designed & built by Daniel Ahmadi
 * Website: https://11danieldesign.framer.website/
 *
 * Eye Tracker — a cursor-reactive character for Framer.
 * The website URL is a comment only and has no effect on the component.
 */

function EyeTrackerUnique2026(props: Partial<Props>) {
    const {
        follow = 60,
        bounce = 30,
        size = 120,
        shape = "Pill",
        eyes: eyeStyle = "Slant",
        eyeScale = 1,
        eyeWidth = 1,
        eyeRound = 1,
        eyeHeight = 1,
        bodyColor = "#FFFFFF",
        eyeColor = "#0B0B0D",
        fillType = "Solid",
        gradientStart = "#FF4242",
        gradientEnd = "#FF8A00",
        gradientAngle = 45,
        idle = false,
        behaviorMode = "Follow Cursor",
        expression = "Default",
        naturalBlinking = true,
        followSpeed = 60,
        rotationRange = 64,
        enableFocusMode = true,
        focusScale = 1.25,
        focusDuration = 600,
        returnDuration = 350,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const eyeRefs = React.useRef<(SVGGElement | null)[]>([])
    const bodyRef = React.useRef<SVGPathElement>(null)
    const clipRef = React.useRef<SVGPathElement>(null)
    const messageIndex = React.useRef(-1)
    const runId = React.useRef(0)
    const [message, setMessage] = React.useState("")
    const [showMessage, setShowMessage] = React.useState(false)
    const [bubbleColor, setBubbleColor] = React.useState(BUBBLE_COLORS[0])
    const [shapePath, setShapePath] = React.useState(
        SHAPES[shape] ?? SHAPES.Pill
    )
    const [focusActive, setFocusActive] = React.useState(false)
    const reducedMotion = prefersReducedMotion()
    const animationEnabled = !isStaticRenderer && !reducedMotion

    const metrics = EYE_STYLES[eyeStyle] ?? EYE_STYLES.Slant
    const eye = {
        w: metrics.w * eyeScale * eyeWidth,
        h: metrics.h * eyeScale * eyeHeight,
        r: metrics.r * eyeScale * eyeWidth * eyeRound,
    }

    const currentProps = React.useRef({
        follow,
        bounce,
        eyeScale,
        eye,
        behaviorMode,
        expression,
        naturalBlinking,
        followSpeed,
        rotationRange,
        enableFocusMode,
    })
    currentProps.current = {
        follow,
        bounce,
        eyeScale,
        eye,
        behaviorMode,
        expression,
        naturalBlinking,
        followSpeed,
        rotationRange,
        enableFocusMode,
    }

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStaticRenderer) return

        const turn = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }
        let raf = 0
        let previousTime = 0
        let blinkStart = 0
        let nextBlink = performance.now() + 2200
        let idleTimer = 0

        const resetTarget = () => {
            turn.tx = 0
            turn.ty = 0
        }

        const aim = (event: PointerEvent) => {
            // Track the pointer across the entire visible page, not only over the component.
            const rect = root.getBoundingClientRect()
            const dx = event.clientX - (rect.left + rect.width / 2)
            const dy = event.clientY - (rect.top + rect.height / 2)
            const distance = Math.hypot(dx, dy) || 1
            const reach = Math.max(
                80,
                Math.min(window.innerWidth, window.innerHeight) * 0.28
            )
            if (currentProps.current.behaviorMode !== "Follow Cursor") return
            const strength = clamp(currentProps.current.follow, 0, 100) / 100
            const amount = Math.min(
                0.85,
                Math.tanh(distance / reach) * strength * 1.5
            )
            turn.tx = (dx / distance) * amount
            turn.ty = (dy / distance) * amount
        }

        const draw = (now: number) => {
            let lid = 1
            if (currentProps.current.naturalBlinking && now > nextBlink) {
                blinkStart = now
                nextBlink =
                    now +
                    (currentProps.current.behaviorMode === "Idle" || idle
                        ? 2000
                        : 2600 + Math.random() * 3200)
            }
            const blinkElapsed = now - blinkStart
            if (currentProps.current.naturalBlinking && blinkElapsed < 160) {
                lid = 1 - 0.9 * Math.sin((blinkElapsed / 160) * Math.PI)
            }
            // Focus temporarily overrides the selected expression without changing the user's saved Expression setting.
            const activeExpression = focusActive
                ? "Focused"
                : currentProps.current.expression
            const expressionHeight =
                activeExpression === "Surprised"
                    ? 1.35
                    : activeExpression === "Sleepy"
                      ? 0.55
                      : activeExpression === "Happy"
                        ? 0.78
                        : activeExpression === "Angry"
                          ? 0.82
                          : activeExpression === "Focused"
                            ? 1.12
                            : 1
            const expressionWidth =
                activeExpression === "Curious"
                    ? 0.82
                    : activeExpression === "Surprised"
                      ? 0.9
                      : activeExpression === "Focused"
                        ? 0.88
                        : 1

            const yaw = Math.asin(clamp(turn.x, -0.92, 0.92))
            const pitch = -Math.asin(clamp(turn.y, -0.92, 0.92))
            const cy = Math.cos(yaw),
                sy = Math.sin(yaw)
            const cp = Math.cos(pitch),
                sp = Math.sin(pitch)
            const tilt =
                clamp(currentProps.current.rotationRange, 0, 90) *
                turn.x *
                turn.y
            const gap =
                EYE_GAP * Math.max(1, currentProps.current.eyeScale * 0.8)

            ;[-gap, gap].forEach((x0, index) => {
                const group = eyeRefs.current[index]
                if (!group) return

                const z0 = Math.sqrt(1 - x0 * x0)
                const x1 = x0 * cy + z0 * sy
                const z1 = -x0 * sy + z0 * cy
                const y2 = -z1 * sp
                const z2 = z1 * cp
                const depth = clamp(z2, 0, 1)
                const scale = 0.45 + 0.55 * depth
                const horizontalScale = scale * (0.7 + 0.3 * depth)
                const eyeNow = currentProps.current.eye
                const width = eyeNow.w * horizontalScale * expressionWidth
                const height = Math.max(
                    0.6,
                    eyeNow.h * scale * lid * expressionHeight
                )
                const rect = group.firstElementChild as SVGRectElement | null

                if (rect) {
                    rect.setAttribute("x", (-width / 2).toFixed(2))
                    rect.setAttribute("y", (-height / 2).toFixed(2))
                    rect.setAttribute("width", width.toFixed(2))
                    rect.setAttribute("height", height.toFixed(2))
                    rect.setAttribute(
                        "rx",
                        Math.min(eyeNow.r, width / 2, height / 2).toFixed(2)
                    )
                }

                group.setAttribute(
                    "transform",
                    `translate(${(50 + x1 * RADIUS).toFixed(2)} ${(50 + y2 * RADIUS).toFixed(2)}) rotate(${tilt.toFixed(2)})`
                )
                group.style.opacity = z2 < 0.05 ? "0" : "1"
            })
        }

        let isVisible = false
        let disposed = false

        const stopAnimation = () => {
            if (raf) {
                window.cancelAnimationFrame(raf)
                raf = 0
            }
        }

        const startAnimation = () => {
            if (disposed || !isVisible || raf) return
            previousTime = 0
            raf = window.requestAnimationFrame(animate)
        }

        const animate = (now: number) => {
            raf = 0
            if (disposed || !isVisible) return
            const dt = previousTime
                ? Math.min(2.5, (now - previousTime) / 16.67)
                : 1
            previousTime = now

            if (reducedMotion) {
                turn.x = turn.tx
                turn.y = turn.ty
            } else {
                const speed =
                    clamp(currentProps.current.followSpeed, 1, 100) / 100
                const spring = 0.025 + speed * 0.095
                const damping =
                    0.46 -
                    speed * 0.12 -
                    (clamp(currentProps.current.bounce, 0, 100) / 100) * 0.12
                turn.vx +=
                    ((turn.tx - turn.x) * spring - turn.vx * damping) * dt
                turn.vy +=
                    ((turn.ty - turn.y) * spring - turn.vy * damping) * dt
                turn.x += turn.vx * dt
                turn.y += turn.vy * dt
            }

            draw(now)
            raf = window.requestAnimationFrame(animate)
        }

        const mode = behaviorMode
        if (idle || mode === "Idle" || mode === "Random Look") {
            const glance = () => {
                const angle = Math.random() * Math.PI * 2
                const amount = 0.35 + Math.random() * 0.3
                if (currentProps.current.behaviorMode === "Look Center") {
                    resetTarget()
                } else {
                    turn.tx = Math.cos(angle) * amount
                    turn.ty = Math.sin(angle) * amount
                }
                idleTimer = window.setTimeout(() => {
                    resetTarget()
                    idleTimer = window.setTimeout(glance, 4100)
                }, 900)
            }
            if (mode === "Random Look" || mode === "Idle" || idle)
                idleTimer = window.setTimeout(glance, 1800)
        } else if (mode === "Look Center") {
            resetTarget()
        } else {
            window.addEventListener("pointermove", aim, { passive: true })
            document.documentElement.addEventListener(
                "pointerleave",
                resetTarget
            )
        }

        // Static canvas/export renderers must stay still. In the editor and published
        // page, run the animation loop only while this component intersects the viewport.
        const observer =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          const entry = entries[0]
                          isVisible = !!entry?.isIntersecting
                          if (isVisible) {
                              startAnimation()
                          } else {
                              stopAnimation()
                          }
                      },
                      { root: null, threshold: 0.01 }
                  )
                : null

        if (observer) {
            observer.observe(root)
        } else {
            isVisible = true
            startAnimation()
        }

        return () => {
            disposed = true
            stopAnimation()
            observer?.disconnect()
            window.clearTimeout(idleTimer)
            window.removeEventListener("pointermove", aim)
            document.documentElement.removeEventListener(
                "pointerleave",
                resetTarget
            )
        }
    }, [idle, reducedMotion, behaviorMode, focusActive, isStaticRenderer])

    React.useEffect(() => {
        setShapePath(SHAPES[shape] ?? SHAPES.Pill)
    }, [shape])

    const handlePoke = async () => {
        if (idle || behaviorMode !== "Follow Cursor") return
        const thisRun = ++runId.current
        const candidates = MESSAGES.map((_, index) => index).filter(
            (index) => index !== messageIndex.current
        )
        const index = candidates[Math.floor(Math.random() * candidates.length)]
        messageIndex.current = index
        const line = MESSAGES[index]
        setBubbleColor(
            BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
        )
        setMessage("")
        setShowMessage(true)

        for (let i = 1; i <= line.length; i++) {
            await new Promise((resolve) =>
                window.setTimeout(resolve, 38 + Math.random() * 25)
            )
            if (thisRun !== runId.current) return
            setMessage(line.slice(0, i))
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
        if (thisRun === runId.current) setShowMessage(false)
    }

    // Release focus even if the pointer is released outside the SVG or the browser cancels a touch.
    React.useEffect(() => {
        if (!focusActive) return
        const releaseFocus = () => setFocusActive(false)
        window.addEventListener("pointerup", releaseFocus)
        window.addEventListener("pointercancel", releaseFocus)
        window.addEventListener("blur", releaseFocus)
        return () => {
            window.removeEventListener("pointerup", releaseFocus)
            window.removeEventListener("pointercancel", releaseFocus)
            window.removeEventListener("blur", releaseFocus)
        }
    }, [focusActive])

    const startFocus = (event: React.PointerEvent<SVGSVGElement>) => {
        if (!enableFocusMode || idle || event.button !== 0) return
        setFocusActive(true)
    }

    const clipId = React.useId().replace(/:/g, "")
    const gradientId = `eyt-gradient-${clipId}`
    const gradientRadians = (clamp(gradientAngle, 0, 360) * Math.PI) / 180
    const gradientX1 = 50 - 50 * Math.cos(gradientRadians)
    const gradientY1 = 50 - 50 * Math.sin(gradientRadians)
    const gradientX2 = 50 + 50 * Math.cos(gradientRadians)
    const gradientY2 = 50 + 50 * Math.sin(gradientRadians)
    const bodyFill = fillType === "Gradient" ? `url(#${gradientId})` : bodyColor
    // Size is the maximum rendered character size; the character also adapts to the Framer frame dimensions.
    const actualSize = clamp(size, 16, 600)
    const focusScaleValue =
        !isStaticRenderer && focusActive && enableFocusMode
            ? clamp(focusScale, 1, 2)
            : 1

    return (
        <div
            ref={rootRef}
            role="img"
            aria-label="A character with eyes that follow the cursor"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 40,
                minHeight: 40,
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "visible",
                userSelect: "none",
            }}
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    // The Size property controls the character's actual rendered dimensions.
                    // Keep the SVG at this pixel size instead of stretching it to the Framer frame.
                    width: `${actualSize}px`,
                    height: `${actualSize}px`,
                    maxWidth: "none",
                    maxHeight: "none",
                    flex: "0 0 auto",
                    overflow: "visible",
                    display: "block",
                    cursor:
                        idle || behaviorMode !== "Follow Cursor"
                            ? "default"
                            : "pointer",
                    transformOrigin: "center",
                    // Use transform rather than the individual CSS scale property for consistent SVG scaling in Framer.
                    transform: `scale(${!isStaticRenderer && focusActive && enableFocusMode ? clamp(focusScale, 1, 1.6) : 1})`,
                    transition: `transform ${focusActive ? clamp(focusDuration, 100, 3000) : clamp(returnDuration, 100, 3000)}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
                    touchAction: "manipulation",
                }}
                onClick={handlePoke}
                onPointerDown={startFocus}
                onPointerUp={() => setFocusActive(false)}
                onPointerCancel={() => setFocusActive(false)}
                onLostPointerCapture={() => setFocusActive(false)}
            >
                <defs>
                    {fillType === "Gradient" && (
                        <linearGradient
                            id={gradientId}
                            x1={`${gradientX1}%`}
                            y1={`${gradientY1}%`}
                            x2={`${gradientX2}%`}
                            y2={`${gradientY2}%`}
                        >
                            <stop offset="0%" stopColor={gradientStart} />
                            <stop offset="100%" stopColor={gradientEnd} />
                        </linearGradient>
                    )}
                    <clipPath id={clipId}>
                        <path ref={clipRef} d={shapePath} />
                    </clipPath>
                </defs>
                <path ref={bodyRef} d={shapePath} fill={bodyFill} />
                <g clipPath={`url(#${clipId})`}>
                    {[0, 1].map((index) => (
                        <g
                            key={index}
                            ref={(node) => {
                                eyeRefs.current[index] = node
                            }}
                        >
                            <rect
                                x={-eye.w / 2}
                                y={-eye.h / 2}
                                width={eye.w}
                                height={eye.h}
                                rx={eye.r}
                                fill={eyeColor}
                            />
                        </g>
                    ))}
                </g>
            </svg>

            {!idle && (
                <span
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        left: `calc(50% + ${actualSize * 0.36}px)`,
                        top: `calc(50% + ${actualSize * 0.3}px)`,
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 34,
                        padding: "0 16px",
                        borderRadius: "6px 14px 14px 14px",
                        background: bubbleColor,
                        color: "#FFFFFF",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        fontWeight: 400,
                        whiteSpace: "nowrap",
                        transformOrigin: "top left",
                        opacity: showMessage ? 1 : 0,
                        scale: showMessage ? 1 : 0.85,
                        pointerEvents: "none",
                        transition:
                            "opacity 160ms ease, scale 220ms cubic-bezier(0.24, 1.34, 0.38, 1)",
                    }}
                >
                    <span>{message}</span>
                    <span
                        aria-hidden="true"
                        style={{
                            display: "inline-block",
                            width: 1.5,
                            height: 13,
                            marginLeft: 3,
                            borderRadius: 1,
                            background: bodyFill,
                            animation: "daniel-eye-caret 1s steps(1) infinite",
                        }}
                    />
                    <style>{`@keyframes daniel-eye-caret { 50% { opacity: 0; } }`}</style>
                </span>
            )}
        </div>
    )
}

EyeTrackerUnique2026.defaultProps = {
    width: 240,
    height: 200,
}

addPropertyControls(EyeTrackerUnique2026, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        description: "Choose the character’s outer shape.",
        options: ["Ball", "Circle", "Cube", "Pill", "Hexagon", "Hex flat"],
        optionTitles: ["Ball", "Circle", "Cube", "Pill", "Hexagon", "Hex Flat"],
        defaultValue: "Pill",
    },
    eyes: {
        type: ControlType.Enum,
        title: "Eye Style",
        description: "Choose the shape of the eyes.",
        options: ["Slant", "Dots", "Squares"],
        optionTitles: ["Slant", "Dots", "Squares"],
        defaultValue: "Slant",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body",
        description: "Set the character’s body color.",
        defaultValue: "#FFFFFF",
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill Type",
        description: "Choose a solid body color or a two-color gradient.",
        options: ["Solid", "Gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "Solid",
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Gradient Start",
        description: "Choose the first color of the body gradient.",
        defaultValue: "#FF4242",
        hidden: (props) => props.fillType !== "Gradient",
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        description: "Choose the second color of the body gradient.",
        defaultValue: "#FF8A00",
        hidden: (props) => props.fillType !== "Gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        description: "Rotate the gradient direction from 0° to 360°.",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 45,
        unit: "°",
        hidden: (props) => props.fillType !== "Gradient",
    },
    eyeColor: {
        type: ControlType.Color,
        title: "Eyes",
        description: "Set the color of the eyes.",
        defaultValue: "#0B0B0D",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        description: "Set the character’s base size in pixels.",
        min: 16,
        max: 600,
        step: 1,
        defaultValue: 120,
        unit: "px",
    },
    follow: {
        type: ControlType.Number,
        title: "Follow",
        description: "Adjust how far the eyes turn toward the cursor.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
        unit: "%",
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Adjust how springy and bouncy the eye movement feels.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 30,
        unit: "%",
    },
    eyeScale: {
        type: ControlType.Number,
        title: "Eye Scale",
        description: "Scale both eyes up or down together.",
        min: 0.5,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    eyeWidth: {
        type: ControlType.Number,
        title: "Eye Width",
        description: "Make the eyes wider or narrower.",
        min: 0.5,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    eyeRound: {
        type: ControlType.Number,
        title: "Eye Round",
        description: "Adjust how rounded the eye corners are.",
        min: 0.2,
        max: 1,
        step: 0.1,
        defaultValue: 1,
    },
    eyeHeight: {
        type: ControlType.Number,
        title: "Eye Height",
        description: "Make the eyes taller or shorter.",
        min: 0.5,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    behaviorMode: {
        type: ControlType.Enum,
        title: "Behavior",
        description: "Choose how the character looks around.",
        options: ["Follow Cursor", "Look Center", "Random Look", "Idle"],
        optionTitles: ["Follow Cursor", "Look Center", "Random Look", "Idle"],
        defaultValue: "Follow Cursor",
    },
    expression: {
        type: ControlType.Enum,
        title: "Expression",
        description:
            "Choose the default eye expression. Focus temporarily overrides it while pressed.",
        options: [
            "Default",
            "Happy",
            "Curious",
            "Sleepy",
            "Surprised",
            "Angry",
        ],
        optionTitles: [
            "Default",
            "Happy",
            "Curious",
            "Sleepy",
            "Surprised",
            "Angry",
        ],
        defaultValue: "Default",
    },
    naturalBlinking: {
        type: ControlType.Boolean,
        title: "Natural Blinking",
        description: "Turn automatic, occasional blinking on or off.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        description: "Set how quickly the eyes catch up with their target.",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 60,
        unit: "%",
    },
    rotationRange: {
        type: ControlType.Number,
        title: "Rotation Range",
        description: "Limit the maximum tilt of the eyes as they look around.",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 64,
        unit: "°",
    },
    enableFocusMode: {
        type: ControlType.Boolean,
        title: "Focus Mode",
        description:
            "When enabled, press and hold to enlarge the character and change its eyes to a focused expression.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    focusScale: {
        type: ControlType.Number,
        title: "Focus Scale",
        description:
            "Set the maximum size multiplier while the pointer or touch is held down.",
        min: 1,
        max: 1.6,
        step: 0.05,
        defaultValue: 1.25,
        displayStepper: true,
    },
    focusDuration: {
        type: ControlType.Number,
        title: "Focus Duration",
        description:
            "Set how long the character takes to grow into focus mode.",
        min: 100,
        max: 3000,
        step: 50,
        defaultValue: 600,
        unit: "ms",
    },
    returnDuration: {
        type: ControlType.Number,
        title: "Return Duration",
        description:
            "Set how long the character takes to return to its base size after release.",
        min: 100,
        max: 3000,
        step: 50,
        defaultValue: 350,
        unit: "ms",
    },
    idle: {
        type: ControlType.Boolean,
        title: "Idle",
        description:
            "Legacy idle toggle. Enable to disable cursor interaction and use occasional random glances.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})

export default EyeTrackerUnique2026
