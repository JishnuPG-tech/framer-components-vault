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


const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const lerp = (a, b, t) => a + (b - a) * t

function shapeMetrics(shape, size) {
    // CHANGE 1 — only oval, round, narrow shapes remain
    switch (shape) {
        case "round":
            return { rx: size * 0.31, ry: size * 0.31 }
        case "narrow":
            return { rx: size * 0.42, ry: size * 0.18 }
        case "oval":
        default:
            return { rx: size * 0.38, ry: size * 0.28 }
    }
}

// ─── Stable unique ID ─────────────────────────────────────────────────────────

function useStableId(prefix) {
    const ref = React.useRef(null)
    if (ref.current === null) {
        // Use crypto.randomUUID when available (all modern browsers + Framer),
        // fall back to timestamp+random so IDs are always globally unique —
        // even if the module is re-evaluated while old instances are still mounted.
        const unique =
            typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
        ref.current = `${prefix}-${unique}`
    }
    return ref.current
}

// ─── Shared blink hook — CHANGE 4 ─────────────────────────────────────────────
// All eyes now share a single blink signal lifted to the parent.
// Pass blinkSignal (0–1) down instead of each eye running its own timer.

export function useSharedBlink(enabled, baseMs) {
    const [blink, setBlink] = React.useState(0)
    const current = React.useRef(0)
    const target = React.useRef(0)

    React.useEffect(() => {
        if (!enabled) {
            current.current = 0
            target.current = 0
            setBlink(0)
            return
        }

        let raf = 0
        let t1, t2, t3, t4

        const schedule = () => {
            const jitter = (Math.random() - 0.5) * baseMs * 0.45
            t1 = window.setTimeout(
                () => {
                    target.current = 1
                    t2 = window.setTimeout(() => {
                        target.current = 0
                        if (Math.random() < 0.18) {
                            t3 = window.setTimeout(() => {
                                target.current = 1
                                t4 = window.setTimeout(() => {
                                    target.current = 0
                                    schedule()
                                }, 90)
                            }, 110)
                        } else {
                            schedule()
                        }
                    }, 110)
                },
                Math.max(600, baseMs + jitter)
            )
        }

        const loop = () => {
            current.current += (target.current - current.current) * 0.24
            setBlink(current.current)
            raf = requestAnimationFrame(loop)
        }

        schedule()
        raf = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [enabled, baseMs])

    return blink
}

// ─── Global pointer hook ──────────────────────────────────────────────────────

function useGlobalPointer() {
    const [mouse, setMouse] = React.useState({ x: 0, y: 0, active: false })
    React.useEffect(() => {
        const move = (e) =>
            setMouse({ x: e.clientX, y: e.clientY, active: true })
        window.addEventListener("mousemove", move)
        document.addEventListener("mousemove", move)
        return () => {
            window.removeEventListener("mousemove", move)
            document.removeEventListener("mousemove", move)
        }
    }, [])
    return mouse
}

// ─── Eye shape renderers ──────────────────────────────────────────────────────
// CHANGE 1 — removed cat and alien branches, only oval/round/narrow remain

function EyeShape({ shape, cx, cy, rx, ry, fill, stroke, strokeWidth }) {
    return (
        <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
        />
    )
}

function EyeClipShape({ shape, cx, cy, rx, ry }) {
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
}

// ─── Single Eye ───────────────────────────────────────────────────────────────

function SingleEye({
    pointer,
    size,
    shape,
    followMode,
    targetSelector,
    scleraColor,
    irisColor,
    pupilColor,
    shineColor,
    glowColor,
    glowStrength,
    shadowEnabled,
    blinkSignal, // CHANGE 4 — receives shared blink value from parent
    idleEnabled,
    idleRange,
    idleSpeed,
    dilationEnabled,
    pupilMin,
    pupilMax,
    followStrength,
    independence,
    index,
    hoverGrow,
}) {
    const ref = React.useRef(null)
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const [dilation, setDilation] = React.useState(0.55)
    const [isHovered, setIsHovered] = React.useState(false)
    const hoverDil = React.useRef(1.0)

    const pos = React.useRef({ x: 0, y: 0 })
    const vel = React.useRef({ x: 0, y: 0 })
    const idleTarget = React.useRef({ x: 0, y: 0 })
    const idlePos = React.useRef({ x: 0, y: 0 })
    const lastMove = React.useRef(Date.now())

    const uid = useStableId(`eye-${index}`)
    const clipId = `clip-${uid}`
    // Embed a short irisColor hash in the gradient ID so changing iris color
    // never accidentally reuses a cached gradient from another eye instance.
    const irisGradId = `iris-${uid}-${irisColor.replace(/[^a-zA-Z0-9]/g, "")}`

    React.useEffect(() => {
        if (!dilationEnabled) setDilation(0.55)
    }, [dilationEnabled])

    React.useEffect(() => {
        let raf = 0
        let nextIdleShift = Date.now() + 900

        const targetFromElement = () => {
            if (!targetSelector) return null
            try {
                const el = document.querySelector(targetSelector)
                if (!el) return null
                const r = el.getBoundingClientRect()
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
            } catch {
                return null
            }
        }

        const loop = () => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect()
                const cxScreen = rect.left + rect.width / 2
                const cyScreen = rect.top + rect.height / 2

                const metrics = shapeMetrics(shape, size)
                const eyeRx = metrics.rx
                const eyeRy = metrics.ry
                const irisR = size * 0.16
                const padding = size * 0.03

                const maxX = Math.max(4, eyeRx - irisR - padding)
                const maxY = Math.max(4, eyeRy - irisR - padding)

                let tx = 0
                let ty = 0
                let hasTarget = false

                if (followMode === "cursor" && pointer.active) {
                    const dx = pointer.x - cxScreen
                    const dy = pointer.y - cyScreen
                    const angle = Math.atan2(dy, dx)
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    tx = Math.cos(angle) * Math.min(dist * followStrength, maxX)
                    ty = Math.sin(angle) * Math.min(dist * followStrength, maxY)
                    hasTarget = true
                    lastMove.current = Date.now()
                    if (dilationEnabled) {
                        const near = 1 - clamp(dist / 700, 0, 1)
                        setDilation(lerp(pupilMin, pupilMax, near))
                    }
                }

                if (followMode === "element") {
                    const p = targetFromElement()
                    if (p) {
                        const dx = p.x - cxScreen
                        const dy = p.y - cyScreen
                        const angle = Math.atan2(dy, dx)
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        tx =
                            Math.cos(angle) *
                            Math.min(dist * followStrength, maxX)
                        ty =
                            Math.sin(angle) *
                            Math.min(dist * followStrength, maxY)
                        hasTarget = true
                    }
                }

                const idleDelay = 1100
                const canIdle =
                    idleEnabled &&
                    followMode !== "element" &&
                    Date.now() - lastMove.current > idleDelay

                if (!hasTarget || canIdle) {
                    if (Date.now() > nextIdleShift) {
                        idleTarget.current = {
                            x: (Math.random() * 2 - 1) * maxX * idleRange,
                            y: (Math.random() * 2 - 1) * maxY * idleRange,
                        }
                        nextIdleShift = Date.now() + 900 + Math.random() * 1400
                    }
                    idlePos.current.x +=
                        (idleTarget.current.x - idlePos.current.x) * idleSpeed
                    idlePos.current.y +=
                        (idleTarget.current.y - idlePos.current.y) * idleSpeed
                    if (!hasTarget) {
                        tx = idlePos.current.x
                        ty = idlePos.current.y
                    } else {
                        tx = lerp(tx, idlePos.current.x, 0.28)
                        ty = lerp(ty, idlePos.current.y, 0.28)
                    }
                }

                const indX =
                    (index % 2 === 0 ? 1 : -1) * independence * maxX * 0.18
                const indY =
                    (index % 3 === 0 ? 1 : -1) * independence * maxY * 0.12
                tx = clamp(tx + indX, -maxX, maxX)
                ty = clamp(ty + indY, -maxY, maxY)

                vel.current.x =
                    vel.current.x * 0.8 + (tx - pos.current.x) * 0.12
                vel.current.y =
                    vel.current.y * 0.8 + (ty - pos.current.y) * 0.12
                pos.current.x += vel.current.x
                pos.current.y += vel.current.y

                setOffset({ x: pos.current.x, y: pos.current.y })

                // Smoothly animate hover dilation multiplier
                const hoverTarget = isHovered && hoverGrow ? 1.55 : 1.0
                hoverDil.current += (hoverTarget - hoverDil.current) * 0.08
            }
            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [
        pointer,
        size,
        shape,
        followMode,
        targetSelector,
        idleEnabled,
        idleRange,
        idleSpeed,
        dilationEnabled,
        pupilMin,
        pupilMax,
        followStrength,
        independence,
        index,
        isHovered,
        hoverGrow,
    ])

    const cx = size / 2
    const cy = size / 2
    const { rx: eyeRx, ry: eyeRy } = shapeMetrics(shape, size)
    const irisR = size * 0.16 * hoverDil.current
    const pupilR = size * lerp(0.04, 0.11, dilation)

    // CHANGE 4 — use the shared blinkSignal passed from parent directly
    const effectiveBlink = blinkSignal

    const upperY = cy - eyeRy + effectiveBlink * (eyeRy * 2.05)
    const lowerY = cy + eyeRy - effectiveBlink * (eyeRy * 0.15)

    return (
        <div
            ref={ref}
            style={{
                width: size,
                height: size,
                position: "relative",
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter:
                    glowStrength > 0
                        ? `drop-shadow(0 0 ${glowStrength * 8}px ${glowColor})`
                        : "none",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ display: "block", overflow: "visible" }}
            >
                <defs>
                    <clipPath id={clipId}>
                        <EyeClipShape
                            shape={shape}
                            cx={cx}
                            cy={cy}
                            rx={eyeRx}
                            ry={eyeRy}
                        />
                    </clipPath>
                    <radialGradient id={irisGradId} cx="36%" cy="32%" r="65%">
                        <stop offset="0%" stopColor={irisColor} />
                        <stop offset="72%" stopColor={irisColor} />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
                    </radialGradient>
                </defs>

                {shadowEnabled && (
                    <ellipse
                        cx={cx}
                        cy={cy + size * 0.05}
                        rx={eyeRx * 0.9}
                        ry={Math.max(eyeRy * 0.28, size * 0.05)}
                        fill="rgba(0,0,0,0.12)"
                    />
                )}

                <EyeShape
                    shape={shape}
                    cx={cx}
                    cy={cy}
                    rx={eyeRx}
                    ry={eyeRy}
                    fill={scleraColor}
                    stroke="none"
                    strokeWidth={0}
                />

                <g clipPath={`url(#${clipId})`}>
                    <circle
                        cx={cx + offset.x}
                        cy={cy + offset.y}
                        r={irisR}
                        fill={`url(#${irisGradId})`}
                    />
                    <circle
                        cx={cx + offset.x}
                        cy={cy + offset.y}
                        r={pupilR}
                        fill={pupilColor}
                    />
                    <circle
                        cx={cx + offset.x - size * 0.045}
                        cy={cy + offset.y - size * 0.045}
                        r={size * 0.028}
                        fill={shineColor}
                        opacity={0.92}
                    />

                    {effectiveBlink > 0 && (
                        <>
                            <path
                                d={`M ${cx - eyeRx * 1.08} ${cy - eyeRy}
                                    Q ${cx} ${upperY - eyeRy * 0.35}
                                    ${cx + eyeRx * 1.08} ${cy - eyeRy}
                                    L ${cx + eyeRx * 1.08} ${upperY}
                                    Q ${cx} ${upperY + eyeRy * 0.18}
                                    ${cx - eyeRx * 1.08} ${upperY} Z`}
                                fill={scleraColor}
                            />
                            <path
                                d={`M ${cx - eyeRx * 1.08} ${cy + eyeRy}
                                    Q ${cx} ${lowerY + eyeRy * 0.08}
                                    ${cx + eyeRx * 1.08} ${cy + eyeRy}
                                    L ${cx + eyeRx * 1.08} ${size * 1.1}
                                    L ${cx - eyeRx * 1.08} ${size * 1.1} Z`}
                                fill={scleraColor}
                            />
                        </>
                    )}
                </g>
            </svg>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UltimateFramerEye(props) {
    const pointer = useGlobalPointer()

    const {
        eyeCount,
        eyeSize,
        gap,
        layout,
        wrap,
        shape,
        followMode,
        targetSelector,
        scleraColor,
        pupilColor,
        shineColor,
        glowColor,
        glowStrength,
        shadowEnabled,
        blinkEnabled,
        blinkMs,
        idleEnabled,
        idleRange,
        idleSpeed,
        dilationEnabled,
        pupilMin,
        pupilMax,
        followStrength,
        eyeIndependence,
        perEyeColors,
        iris1,
        iris2,
        iris3,
        iris4,
        iris5,
        iris6,
        iris7,
        iris8,
        hoverGrow,
    } = props

    // CHANGE 4 — single shared blink signal computed once in the parent
    const blinkSignal = useSharedBlink(blinkEnabled, blinkMs)

    const irises = [iris1, iris2, iris3, iris4, iris5, iris6, iris7, iris8]

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: layout === "vertical" ? "column" : "row",
                flexWrap: wrap ? "wrap" : "nowrap",
                alignItems: "center",
                justifyContent: "center",
                alignContent: "center",
                gap,
                overflow: "visible",
                background: "transparent",
            }}
        >
            {Array.from({ length: eyeCount }).map((_, i) => (
                <SingleEye
                    key={i}
                    index={i}
                    pointer={pointer}
                    size={eyeSize}
                    shape={shape}
                    followMode={followMode}
                    targetSelector={targetSelector}
                    scleraColor={scleraColor}
                    irisColor={perEyeColors ? irises[i % irises.length] : iris1}
                    pupilColor={pupilColor}
                    shineColor={shineColor}
                    glowColor={glowColor}
                    glowStrength={glowStrength}
                    shadowEnabled={shadowEnabled}
                    blinkSignal={blinkSignal}
                    idleEnabled={idleEnabled}
                    idleRange={idleRange}
                    idleSpeed={idleSpeed}
                    dilationEnabled={dilationEnabled}
                    pupilMin={pupilMin}
                    pupilMax={pupilMax}
                    followStrength={followStrength}
                    independence={eyeIndependence}
                    hoverGrow={hoverGrow}
                />
            ))}
        </div>
    )
}

UltimateFramerEye.defaultProps = {
    eyeCount: 2,
    eyeSize: 150,
    gap: 18,
    layout: "horizontal",
    wrap: false,
    shape: "oval", // CHANGE 1 — default stays oval
    followMode: "cursor",
    targetSelector: "",
    scleraColor: "#F7F7F3",
    pupilColor: "#111111",
    shineColor: "#FFFFFF",
    glowColor: "#66A7FF",
    glowStrength: 0,
    shadowEnabled: true,
    blinkEnabled: true,
    blinkMs: 3200,
    idleEnabled: true,
    idleRange: 0.4,
    idleSpeed: 0.035,
    dilationEnabled: true,
    pupilMin: 0.28,
    pupilMax: 0.9,
    followStrength: 0.12,
    eyeIndependence: 0.2,
    hoverGrow: true,
    perEyeColors: false,
    iris1: "#4F8FCF",
    iris2: "#7D5FFF",
    iris3: "#5AC878",
    iris4: "#FF8A4C",
    iris5: "#E84393",
    iris6: "#F5C518",
    iris7: "#3ECFB2",
    iris8: "#FF6B6B",
}

// ─── Framer Property Controls ─────────────────────────────────────────────────

addPropertyControls(UltimateFramerEye, {
    // CHANGE 3 — max eyes raised to 50
    eyeCount: {
        type: ControlType.Number,
        title: "Eyes",
        min: 1,
        max: 500,
        step: 1,
        defaultValue: 2,
    },
    eyeSize: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 320,
        step: 1,
        defaultValue: 150,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 140,
        step: 1,
        defaultValue: 18,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    wrap: {
        type: ControlType.Boolean,
        title: "Wrap",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    // CHANGE 1 — only oval, round, narrow
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["oval", "round", "narrow"],
        optionTitles: ["Oval", "Round", "Narrow"],
        defaultValue: "oval",
    },
    followMode: {
        type: ControlType.Enum,
        title: "Follow",
        options: ["cursor", "element"],
        optionTitles: ["Cursor", "Element"],
        defaultValue: "cursor",
    },
    targetSelector: {
        type: ControlType.String,
        title: "Selector",
        placeholder: "#element",
        hidden(props) {
            return props.followMode !== "element"
        },
    },
    followStrength: {
        type: ControlType.Number,
        title: "Follow Amt",
        min: 0.04,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.12,
    },
    eyeIndependence: {
        type: ControlType.Number,
        title: "Independent",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },
    hoverGrow: {
        type: ControlType.Boolean,
        title: "Hover Grow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blinkEnabled: {
        type: ControlType.Boolean,
        title: "Blink",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blinkMs: {
        type: ControlType.Number,
        title: "Blink ms",
        min: 1200,
        max: 8000,
        step: 100,
        defaultValue: 3200,
        hidden(props) {
            return !props.blinkEnabled
        },
    },
    // CHANGE 2 — winkEye control removed entirely
    idleEnabled: {
        type: ControlType.Boolean,
        title: "Idle",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    idleRange: {
        type: ControlType.Number,
        title: "Idle Range",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.4,
        hidden(props) {
            return !props.idleEnabled
        },
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        min: 0.005,
        max: 0.12,
        step: 0.005,
        defaultValue: 0.035,
        hidden(props) {
            return !props.idleEnabled
        },
    },
    dilationEnabled: {
        type: ControlType.Boolean,
        title: "Dilate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pupilMin: {
        type: ControlType.Number,
        title: "Pupil Min",
        min: 0.15,
        max: 0.9,
        step: 0.01,
        defaultValue: 0.28,
        hidden(props) {
            return !props.dilationEnabled
        },
    },
    pupilMax: {
        type: ControlType.Number,
        title: "Pupil Max",
        min: 0.15,
        max: 1,
        step: 0.01,
        defaultValue: 0.9,
        hidden(props) {
            return !props.dilationEnabled
        },
    },
    perEyeColors: {
        type: ControlType.Boolean,
        title: "Per Eye",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    iris1: {
        type: ControlType.Color,
        title: "Iris 1",
        defaultValue: "#4F8FCF",
    },
    iris2: {
        type: ControlType.Color,
        title: "Iris 2",
        defaultValue: "#7D5FFF",
        hidden(props) {
            return !props.perEyeColors
        },
    },
    iris3: {
        type: ControlType.Color,
        title: "Iris 3",
        defaultValue: "#5AC878",
        hidden(props) {
            return !props.perEyeColors
        },
    },
    iris4: {
        type: ControlType.Color,
        title: "Iris 4",
        defaultValue: "#FF8A4C",
        hidden(props) {
            return !props.perEyeColors
        },
    },
    iris5: {
        type: ControlType.Color,
        title: "Iris 5",
        defaultValue: "#E84393",
        hidden(props) {
            return !props.perEyeColors || props.eyeCount < 5
        },
    },
    iris6: {
        type: ControlType.Color,
        title: "Iris 6",
        defaultValue: "#F5C518",
        hidden(props) {
            return !props.perEyeColors || props.eyeCount < 6
        },
    },
    iris7: {
        type: ControlType.Color,
        title: "Iris 7",
        defaultValue: "#3ECFB2",
        hidden(props) {
            return !props.perEyeColors || props.eyeCount < 7
        },
    },
    iris8: {
        type: ControlType.Color,
        title: "Iris 8",
        defaultValue: "#FF6B6B",
        hidden(props) {
            return !props.perEyeColors || props.eyeCount < 8
        },
    },
    scleraColor: {
        type: ControlType.Color,
        title: "White",
        defaultValue: "#F7F7F3",
    },
    pupilColor: {
        type: ControlType.Color,
        title: "Pupil",
        defaultValue: "#111111",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine",
        defaultValue: "#FFFFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#66A7FF",
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Glow Amt",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 0,
    },
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
