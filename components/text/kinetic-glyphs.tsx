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


type Position = {
    x: number
    y: number
    z: number
}

type Vector = {
    x: number
    y: number
}

type Props = {
    textColor: string
    fontSize: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 */
export default function JapaneseCommand(props: Props) {
    const isStatic = useIsStaticRenderer()

    const { textColor, fontSize } = props
    const scale = fontSize / 72

    const rootRef = React.useRef<HTMLDivElement>(null)

    const [cursorPosition, setCursorPosition] = React.useState({
        x: 0,
        y: 0,
    })

    const [cursorVisible, setCursorVisible] = React.useState(false)
    const [isGrabbing, setIsGrabbing] = React.useState(false)

    const [mode, setMode] = React.useState("idle")
    const [chaseActive, setChaseActive] = React.useState(false)

    // timers
    const timersRef = React.useRef<number[]>([])

    const later = (callback: () => void, delay: number) => {
        if (isStatic) return

        const timer = window.setTimeout(() => {
            timersRef.current = timersRef.current.filter((id) => id !== timer)

            callback()
        }, delay)

        timersRef.current.push(timer)

        return timer
    }

    React.useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => {
                window.clearTimeout(timer)
            })

            timersRef.current = []
        }
    }, [])

    // cursor velocity
    const previousPointerRef = React.useRef({
        x: 0,
        y: 0,
        initialized: false,
    })

    const cursorVelocityRef = React.useRef<Vector>({
        x: 0,
        y: 0,
    })

    // 逃
    const [nigePosition, setNigePosition] = React.useState<Position>({
        x: 0,
        y: 0,
        z: 0,
    })

    const nigeRef = React.useRef<HTMLSpanElement>(null)

    const nigeSlidingRef = React.useRef(false)

    const [nigeEscaped, setNigeEscaped] = React.useState(false)
    const [nigeReturning, setNigeReturning] = React.useState(false)

    const [nigeLaunching, setNigeLaunching] = React.useState(false)
    const [nigeBraking, setNigeBraking] = React.useState(false)

    // げ
    const [gePosition, setGePosition] = React.useState<Position>({
        x: 0,
        y: 0,
        z: 0,
    })

    const geRef = React.useRef<HTMLSpanElement>(null)

    const geRunningRef = React.useRef(false)

    const geVelocityRef = React.useRef<Vector>({
        x: -1,
        y: 0,
    })

    const [geEscaped, setGeEscaped] = React.useState(false)
    const [geReturning, setGeReturning] = React.useState(false)

    //ろ
    const [roPosition, setRoPosition] = React.useState<Position>({
        x: 0,
        y: 0,
        z: 0,
    })

    const roRef = React.useRef<HTMLSpanElement>(null)

    const roJumpingRef = React.useRef(false)

    const [roEscaped, setRoEscaped] = React.useState(false)
    const [roReturning, setRoReturning] = React.useState(false)

    // vector helpers
    const normalize = (x: number, y: number): Vector => {
        const length = Math.max(0.001, Math.hypot(x, y))

        return {
            x: x / length,
            y: y / length,
        }
    }

    // keep movement inside the component bounds
    const keepInsideRoot = (
        current: Position,
        proposed: Position,
        element: HTMLElement | null,
        padding = 28
    ): Position => {
        if (!rootRef.current || !element) return proposed

        const rootRect = rootRef.current.getBoundingClientRect()
        const rect = element.getBoundingClientRect()

        let dx = proposed.x - current.x
        let dy = proposed.y - current.y

        const minDx = rootRect.left + padding - rect.left
        const maxDx = rootRect.right - padding - rect.right

        const minDy = rootRect.top + padding - rect.top
        const maxDy = rootRect.bottom - padding - rect.bottom

        dx = Math.max(minDx, Math.min(maxDx, dx))
        dy = Math.max(minDy, Math.min(maxDy, dy))

        return {
            x: current.x + dx,
            y: current.y + dy,
            z: proposed.z,
        }
    }

    // edge steering
    const getEdgeSteering = (
        element: HTMLElement | null,
        awareness = 120
    ): Vector => {
        if (!rootRef.current || !element) {
            return { x: 0, y: 0 }
        }

        const root = rootRef.current.getBoundingClientRect()
        const rect = element.getBoundingClientRect()

        let x = 0
        let y = 0

        const leftGap = rect.left - root.left
        const rightGap = root.right - rect.right

        const topGap = rect.top - root.top
        const bottomGap = root.bottom - rect.bottom

        if (leftGap < awareness) {
            x += (awareness - leftGap) / awareness
        }

        if (rightGap < awareness) {
            x -= (awareness - rightGap) / awareness
        }

        if (topGap < awareness) {
            y += (awareness - topGap) / awareness
        }

        if (bottomGap < awareness) {
            y -= (awareness - bottomGap) / awareness
        }

        return { x, y }
    }

    // character avoidance
    const getCharacterRepulsion = (
        self: HTMLElement | null,
        others: Array<HTMLElement | null>,
        radius = 150
    ): Vector => {
        if (!self) return { x: 0, y: 0 }

        const selfRect = self.getBoundingClientRect()

        const selfX = selfRect.left + selfRect.width / 2
        const selfY = selfRect.top + selfRect.height / 2

        let forceX = 0
        let forceY = 0

        others.forEach((other) => {
            if (!other) return

            const rect = other.getBoundingClientRect()

            const otherX = rect.left + rect.width / 2
            const otherY = rect.top + rect.height / 2

            const dx = selfX - otherX
            const dy = selfY - otherY

            const distance = Math.max(1, Math.hypot(dx, dy))

            if (distance >= radius) return

            const strength = (radius - distance) / radius

            forceX += (dx / distance) * strength
            forceY += (dy / distance) * strength
        })

        return {
            x: forceX,
            y: forceY,
        }
    }

    // 逃: predictive evade
    const slideNigeAway = (pointerX: number, pointerY: number) => {
        if (isStatic) return
        if (nigeSlidingRef.current) return
        if (!nigeRef.current) return

        nigeSlidingRef.current = true
        setNigeLaunching(true)

        const rect = nigeRef.current.getBoundingClientRect()

        const nigeX = rect.left + rect.width / 2
        const nigeY = rect.top + rect.height / 2

        const predictedPointerX = pointerX + cursorVelocityRef.current.x * 5

        const predictedPointerY = pointerY + cursorVelocityRef.current.y * 5

        const flee = normalize(
            nigeX - predictedPointerX,
            nigeY - predictedPointerY
        )

        const edge = getEdgeSteering(nigeRef.current, 150 * scale)

        const repulsion = getCharacterRepulsion(
            nigeRef.current,
            [geRef.current, roRef.current],
            170 * scale
        )

        // slight lateral variation
        const lateralAmount = (Math.random() - 0.5) * 0.65

        const lateral = {
            x: -flee.y * lateralAmount,
            y: flee.x * lateralAmount,
        }

        const steering = normalize(
            flee.x * 1.5 + edge.x * 1.3 + repulsion.x * 0.8 + lateral.x,

            flee.y * 1.5 + edge.y * 1.3 + repulsion.y * 0.8 + lateral.y
        )

        const slideDistance = (190 + Math.random() * 90) * scale
        const overshootDistance = 42 * scale

        setNigePosition((current) => {
            const finalTarget = keepInsideRoot(
                current,
                {
                    x: current.x + steering.x * slideDistance,
                    y: current.y + steering.y * slideDistance,
                    z: current.z,
                },
                nigeRef.current,
                34
            )

            const overshootTarget = keepInsideRoot(
                current,
                {
                    x: finalTarget.x + steering.x * overshootDistance,

                    y: finalTarget.y + steering.y * overshootDistance,

                    z: current.z,
                },
                nigeRef.current,
                28
            )

            later(() => {
                setNigeBraking(true)
                setNigePosition(finalTarget)

                later(() => {
                    setNigeBraking(false)
                }, 220)
            }, 430)

            return overshootTarget
        })

        later(() => {
            setNigeLaunching(false)
        }, 350)

        later(() => {
            nigeSlidingRef.current = false
        }, 760)
    }

    // げ: running with inertia
    const runGeAway = (pointerX: number, pointerY: number) => {
        if (isStatic) return
        if (geRunningRef.current) return
        if (!geRef.current) return

        geRunningRef.current = true

        const rect = geRef.current.getBoundingClientRect()

        const geX = rect.left + rect.width / 2
        const geY = rect.top + rect.height / 2

        const flee = normalize(geX - pointerX, geY - pointerY)

        const edge = getEdgeSteering(geRef.current, 105 * scale)

        const repulsion = getCharacterRepulsion(
            geRef.current,
            [nigeRef.current, roRef.current],
            135 * scale
        )

        const wander = {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3,
        }

        const desired = normalize(
            flee.x * 1.1 + edge.x * 0.85 + repulsion.x * 0.45 + wander.x,

            flee.y * 1.1 + edge.y * 0.85 + repulsion.y * 0.45 + wander.y
        )

        const velocity = normalize(
            geVelocityRef.current.x * 0.65 + desired.x * 0.35,

            geVelocityRef.current.y * 0.65 + desired.y * 0.35
        )

        geVelocityRef.current = velocity

        const runDistance = (110 + Math.random() * 70) * scale

        setGePosition((current) => {
            const proposed = {
                x: current.x + velocity.x * runDistance,
                y: current.y + velocity.y * runDistance,
                z: current.z,
            }

            const result = keepInsideRoot(current, proposed, geRef.current, 32)

            // turn if the edge blocks the run
            const actualDx = result.x - current.x
            const actualDy = result.y - current.y

            const actualDistance = Math.hypot(actualDx, actualDy)

            if (actualDistance < runDistance * 0.55) {
                const turnDirection = Math.random() > 0.5 ? 1 : -1

                geVelocityRef.current = normalize(
                    -velocity.y * turnDirection + edge.x * 1.2,

                    velocity.x * turnDirection + edge.y * 1.2
                )
            }

            return result
        })

        later(() => {
            geRunningRef.current = false
        }, 470)
    }

    // ろ: choose a safe landing point and hop
    const jumpRoAway = (pointerX: number, pointerY: number) => {
        if (isStatic) return
        if (roJumpingRef.current) return
        if (!roRef.current || !rootRef.current) return

        roJumpingRef.current = true

        const rect = roRef.current.getBoundingClientRect()
        const root = rootRef.current.getBoundingClientRect()

        const roX = rect.left + rect.width / 2
        const roY = rect.top + rect.height / 2

        const awayAngle = Math.atan2(roY - pointerY, roX - pointerX)

        // candidate landing directions
        const angleOffsets = [
            0,
            -Math.PI / 4,
            Math.PI / 4,
            -Math.PI / 2,
            Math.PI / 2,
        ]

        let bestPosition: Position | null = null
        let bestScore = -Infinity

        const otherRects = [
            nigeRef.current?.getBoundingClientRect(),
            geRef.current?.getBoundingClientRect(),
        ].filter(Boolean) as DOMRect[]

        setRoPosition((current) => {
            angleOffsets.forEach((offset) => {
                const angle = awayAngle + offset

                const distance = (145 + Math.random() * 100) * scale

                const rawPosition = {
                    x: current.x + Math.cos(angle) * distance,

                    y: current.y + Math.sin(angle) * distance,

                    z: current.z,
                }

                const candidate = keepInsideRoot(
                    current,
                    rawPosition,
                    roRef.current,
                    38
                )

                const deltaX = candidate.x - current.x

                const deltaY = candidate.y - current.y

                const candidateX = roX + deltaX
                const candidateY = roY + deltaY

                // distance from cursor
                const cursorDistance = Math.hypot(
                    candidateX - pointerX,
                    candidateY - pointerY
                )

                // distance from the other characters
                let characterSafety = 999

                otherRects.forEach((other) => {
                    const otherX = other.left + other.width / 2

                    const otherY = other.top + other.height / 2

                    characterSafety = Math.min(
                        characterSafety,
                        Math.hypot(candidateX - otherX, candidateY - otherY)
                    )
                })

                // avoid camping directly on an edge
                const edgeSafety = Math.min(
                    candidateX - root.left,
                    root.right - candidateX,
                    candidateY - root.top,
                    root.bottom - candidateY
                )

                // slight noise keeps landing choices less repetitive
                const personalityNoise = Math.random() * 45

                const score =
                    cursorDistance * 1.2 +
                    characterSafety * 0.45 +
                    edgeSafety * 0.25 +
                    personalityNoise

                if (score > bestScore) {
                    bestScore = score
                    bestPosition = candidate
                }
            })

            return bestPosition ?? current
        })

        later(() => {
            roJumpingRef.current = false
        }, 620)
    }

    // pointer tracking + threat detection
    const handlePointerMove = (e: React.PointerEvent) => {
        if (isStatic) return
        if (!rootRef.current) return

        const rootRect = rootRef.current.getBoundingClientRect()

        setCursorPosition({
            x: e.clientX - rootRect.left,
            y: e.clientY - rootRect.top,
        })

        // estimate cursor velocity
        if (previousPointerRef.current.initialized) {
            const rawVX = e.clientX - previousPointerRef.current.x

            const rawVY = e.clientY - previousPointerRef.current.y

            cursorVelocityRef.current = {
                x: cursorVelocityRef.current.x * 0.55 + rawVX * 0.45,

                y: cursorVelocityRef.current.y * 0.55 + rawVY * 0.45,
            }
        }

        previousPointerRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialized: true,
        }

        if (mode !== "escape") return
        if (!chaseActive) return

        if (nigeEscaped && nigeRef.current) {
            const rect = nigeRef.current.getBoundingClientRect()

            const x = rect.left + rect.width / 2

            const y = rect.top + rect.height / 2

            const distance = Math.hypot(e.clientX - x, e.clientY - y)

            if (distance < 155 * scale) {
                slideNigeAway(e.clientX, e.clientY)
            }
        }

        if (geEscaped && geRef.current) {
            const rect = geRef.current.getBoundingClientRect()

            const x = rect.left + rect.width / 2

            const y = rect.top + rect.height / 2

            const distance = Math.hypot(e.clientX - x, e.clientY - y)

            if (distance < 118 * scale) {
                runGeAway(e.clientX, e.clientY)
            }
        }

        if (roEscaped && roRef.current) {
            const rect = roRef.current.getBoundingClientRect()

            const x = rect.left + rect.width / 2

            const y = rect.top + rect.height / 2

            const distance = Math.hypot(e.clientX - x, e.clientY - y)

            if (distance < 96 * scale) {
                jumpRoAway(e.clientX, e.clientY)
            }
        }
    }

    // reset after all three characters are caught
    React.useEffect(() => {
        if (isStatic) return
        if (mode !== "escape") return

        const allCaught = !nigeEscaped && !geEscaped && !roEscaped

        const nobodyReturning = !nigeReturning && !geReturning && !roReturning

        if (allCaught && nobodyReturning) {
            setMode("idle")
            setChaseActive(false)

            setNigePosition({
                x: 0,
                y: 0,
                z: 0,
            })

            setGePosition({
                x: 0,
                y: 0,
                z: 0,
            })

            setRoPosition({
                x: 0,
                y: 0,
                z: 0,
            })

            geVelocityRef.current = {
                x: -1,
                y: 0,
            }
        }
    }, [
        isStatic,
        mode,
        nigeEscaped,
        geEscaped,
        roEscaped,
        nigeReturning,
        geReturning,
        roReturning,
    ])

    // start escape
    const startEscape = () => {
        if (isStatic) return
        if (mode === "escape") return

        setMode("escape")
        setChaseActive(false)

        //逃 notices danger first.
        setNigeEscaped(true)
        setNigeLaunching(true)

        setNigePosition({
            x: 80,
            y: 150,
            z: 180,
        })

        // げ reacts shortly after 逃.
        later(() => {
            setGeEscaped(true)

            setGePosition({
                x: -155,
                y: 65,
                z: 100,
            })

            geVelocityRef.current = normalize(-1, 0.25)
        }, 120)

        //ろ is the last one to notice.
        later(() => {
            setRoEscaped(true)

            setRoPosition({
                x: 145,
                y: -95,
                z: -100,
            })
        }, 260)

        later(() => {
            setNigeLaunching(false)
        }, 350)

        later(() => {
            setChaseActive(true)
        }, 1250)
    }

    return (
        <div
            ref={rootRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={() => {
                if (!isStatic) setCursorVisible(true)
            }}
            onPointerLeave={() => {
                if (!isGrabbing) {
                    setCursorVisible(false)
                }
            }}
            onPointerDown={() => {
                if (isStatic) return
                setIsGrabbing(true)
            }}
            onPointerUp={() => {
                setIsGrabbing(false)
            }}
            onPointerCancel={() => {
                setIsGrabbing(false)
            }}
            style={{
                position: "relative",

                width: "100%",
                height: "100%",

                color: textColor,

                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',

                perspective: "800px",
                overflow: "hidden",

                cursor: isStatic ? "default" : "none",
            }}
        >
            <style>{`
                @keyframes nigeLaunch {
                    0% {
                        transform:
                            rotate(0deg)
                            translateX(0px);
                    }

                    40% {
                        transform:
                            rotate(-12deg)
                            translateX(-6px);
                    }

                    70% {
                        transform:
                            rotate(-12deg)
                            translateX(-6px);
                    }

                    100% {
                        transform:
                            rotate(0deg)
                            translateX(0px);
                    }
                }

                @keyframes geLegA {
                    0% {
                        transform: rotate(18deg);
                    }

                    50% {
                        transform: rotate(-18deg);
                    }

                    100% {
                        transform: rotate(18deg);
                    }
                }

                @keyframes geLegB {
                    0% {
                        transform: rotate(-18deg);
                    }

                    50% {
                        transform: rotate(18deg);
                    }

                    100% {
                        transform: rotate(-18deg);
                    }
                }

                @keyframes geBodyBob {
                    0% {
                        transform: translateY(0px);
                    }

                    50% {
                       transform: translateY(3px);
                    }

                    100% {
                       transform: translateY(0px);
                    }
                }

                @keyframes roHop {
                    0% {
                        transform:
                            translateY(0px)
                            rotate(0deg);
                    }

                    28% {
                        transform:
                            translateY(-25px)
                            rotate(-5deg);
                    }

                    55% {
                        transform:
                            translateY(-18px)
                            rotate(3deg);
                    }

                    100% {
                        transform:
                            translateY(0px)
                            rotate(0deg);
                    }
                }
            `}</style>

            <div
                onClick={startEscape}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",

                    display: "flex",
                    alignItems: "center",

                    fontSize: `${fontSize}px`,
                    lineHeight: 1,
                    fontWeight: 400,
                    whiteSpace: "nowrap",

                    color: textColor,
                    userSelect: "none",
                }}
            >
                {/* 逃 */}

                <span
                    ref={nigeRef}
                    onPointerDown={(e) => {
                        e.stopPropagation()

                        if (isStatic) return

                        setIsGrabbing(true)

                        later(() => {
                            setIsGrabbing(false)
                        }, 120)

                        if (!nigeEscaped) return

                        nigeSlidingRef.current = false

                        setNigeEscaped(false)
                        setNigeReturning(true)
                        setNigeBraking(false)
                        setNigeLaunching(false)

                        setNigePosition({
                            x: 0,
                            y: 0,
                            z: 0,
                        })

                        later(() => {
                            setNigeReturning(false)
                        }, 900)
                    }}
                    style={{
                        display: "inline-block",

                        transform: `translate3d(
                            ${nigePosition.x}px,
                            ${nigePosition.y}px,
                            ${nigePosition.z}px
                        )`,

                        transition: nigeReturning
                            ? "transform 0.9s cubic-bezier(.22,.61,.36,1)"
                            : nigeBraking
                              ? "transform 0.22s ease-out"
                              : "transform 0.43s cubic-bezier(.16,.84,.32,1)",
                    }}
                >
                    <span
                        style={{
                            display: "inline-block",
                            transformOrigin: "bottom center",

                            animation:
                                !isStatic && nigeLaunching
                                    ? "nigeLaunch 0.35s ease-out"
                                    : "none",
                        }}
                    >
                        逃
                    </span>
                </span>

                {/* げ */}

                <span
                    ref={geRef}
                    onPointerDown={(e) => {
                        e.stopPropagation()

                        if (isStatic) return

                        setIsGrabbing(true)

                        later(() => {
                            setIsGrabbing(false)
                        }, 120)

                        if (!geEscaped) return

                        setGeEscaped(false)
                        setGeReturning(true)

                        setGePosition({
                            x: 0,
                            y: 0,
                            z: 0,
                        })

                        later(() => {
                            setGeReturning(false)
                        }, 850)
                    }}
                    style={{
                        display: "inline-block",

                        transform: `translate3d(
                            ${gePosition.x}px,
                            ${gePosition.y + 8}px,
                            ${gePosition.z}px
                        )`,

                        transition: geReturning
                            ? "transform 0.85s ease-in-out"
                            : "transform 0.46s cubic-bezier(.18,.72,.25,1)",
                    }}
                >
                    <span
                        style={{
                            position: "relative",
                            display: "inline-block",
                            width: "1em",
                            height: "1em",
                            fontSize: "1.12em",
                            animation:
                                !isStatic && geEscaped
                                    ? "geBodyBob 0.3s ease-in-out infinite"
                                    : "none",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: "14%",
                                top: "-5%",
                                transformOrigin: "top center",

                                animation:
                                    !isStatic && (geEscaped || geReturning)
                                        ? "geLegA 0.3s ease-in-out infinite"
                                        : "none",
                            }}
                        >
                            I
                        </span>

                        <span
                            style={{
                                position: "absolute",
                                left: "32%",
                                top: "-3%",
                                transformOrigin: "top center",

                                animation:
                                    !isStatic && (geEscaped || geReturning)
                                        ? "geLegB 0.3s ease-in-out infinite"
                                        : "none",
                            }}
                        >
                            ﾅ
                        </span>

                        <span
                            style={{
                                position: "absolute",
                                left: "66%",
                                top: "-10%",
                            }}
                        >
                            ゛
                        </span>
                    </span>
                </span>

                {/* ろ */}

                <span
                    ref={roRef}
                    onPointerDown={(e) => {
                        e.stopPropagation()

                        if (isStatic) return

                        setIsGrabbing(true)

                        later(() => {
                            setIsGrabbing(false)
                        }, 120)

                        if (!roEscaped) return

                        setRoEscaped(false)
                        setRoReturning(true)

                        setRoPosition({
                            x: 0,
                            y: 0,
                            z: 0,
                        })

                        later(() => {
                            setRoReturning(false)
                        }, 1000)
                    }}
                    style={{
                        display: "inline-block",

                        transform: `translate3d(
                            ${roPosition.x}px,
                            ${roPosition.y}px,
                            ${roPosition.z}px
                        )`,

                        transition: roReturning
                            ? "transform 0.8s ease-in-out"
                            : "transform 0.38s cubic-bezier(.2,.9,.3,1)",
                    }}
                >
                    <span
                        style={{
                            display: "inline-block",

                            animation:
                                !isStatic && (roEscaped || roReturning)
                                    ? "roHop 0.32s ease-out infinite"
                                    : "none",
                        }}
                    >
                        ろ
                    </span>
                </span>
            </div>

            {/* CUSTOM CURSOR */}

            {!isStatic && cursorVisible && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPosition.x,
                        top: cursorPosition.y,

                        transform: isGrabbing
                            ? "translate(-20%, -10%) scale(0.9)"
                            : "translate(-20%, -10%) scale(1)",

                        transition: "transform 0.1s ease-out",

                        transformOrigin: "center center",

                        pointerEvents: "none",
                        zIndex: 999,
                    }}
                >
                    {!isGrabbing ? (
                        <svg
                            width="44"
                            height="44"
                            viewBox="0 0 52 52"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="
                                    M17 27
                                    V13
                                    C17 10 21 10 21 13
                                    V24
                                    V9
                                    C21 6 25 6 25 9
                                    V24
                                    V11
                                    C25 8 29 8 29 11
                                    V25
                                    V15
                                    C29 12 33 12 33 15
                                    V28
                                    L37 24
                                    C39 22 42 24 40 27
                                    L34 37
                                    C31 42 27 44 22 43
                                    C16 42 13 39 11 34
                                    L8 29
                                    C6 26 9 23 12 25
                                    Z
                                "
                                fill="white"
                                stroke="black"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg
                            width="44"
                            height="44"
                            viewBox="0 0 52 52"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="
                                    M13 25
                                    C13 21 16 19 19 21
                                    L21 23
                                    C21 19 24 18 27 20
                                    L29 22
                                    C30 19 34 20 35 23
                                    C38 21 41 24 40 28
                                    L37 36
                                    C35 41 31 44 25 44
                                    C19 44 15 42 12 37
                                    L9 31
                                    C7 28 9 25 12 26
                                    Z
                                "
                                fill="white"
                                stroke="black"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />

                            <path
                                d="M17 25 C20 28 23 29 27 28"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />

                            <path
                                d="M22 22 C25 25 29 26 33 25"
                                stroke="black"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </div>
            )}
        </div>
    )
}

JapaneseCommand.defaultProps = {
    textColor: "#FFFFFF",
    fontSize: 72,
}

addPropertyControls(JapaneseCommand, {
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 72,
        min: 24,
        max: 200,
        step: 1,
        unit: "px",
    },
})
