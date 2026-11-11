import {
    Children,
    cloneElement,
    isValidElement,
    startTransition,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type PointerEvent,
    type ReactNode,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion, type Transition } from "framer-motion"

// Flip 3D com duas faces.
// A raiz NAO gira: so escuta hover/clique e fornece a perspectiva.
// Cada face gira no proprio centro com backface escondida,
// entao a area de hover fica estavel e o flip nao oscila no meio do giro.

type Trigger = "hover" | "click" | "both"
type Axis = "y" | "x"
type Direction = "forward" | "reverse"
type Curve = "smooth" | "snappy" | "linear" | "spring"

interface FlipCardProps {
    front?: ReactNode
    back?: ReactNode
    trigger: Trigger
    axis: Axis
    direction: Direction
    duration: number
    curve: Curve
    perspective: number
    radius: number
    showBack: boolean
    style?: CSSProperties
}

const CURVES: Record<Exclude<Curve, "spring">, [number, number, number, number]> = {
    smooth: [0.45, 0, 0.2, 1],
    snappy: [0.7, 0, 0.1, 1],
    linear: [0, 0, 1, 1],
}

/**
 * Flip Card
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 440
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Flip3DCard(props: FlipCardProps) {
    const {
        front,
        back,
        trigger = "hover",
        axis = "y",
        direction = "forward",
        duration = 0.7,
        curve = "smooth",
        perspective = 1400,
        radius = 24,
        showBack = false,
        style,
    } = props

    // Canvas e export: sem interacao, o controle "Show Back" decide a face.
    const isCanvas = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()

    const [hovered, setHovered] = useState(false)
    const [toggled, setToggled] = useState(false)

    const hoverEnabled = trigger === "hover" || trigger === "both"
    const clickEnabled = trigger === "click" || trigger === "both"

    const flipped = isCanvas ? showBack : (hoverEnabled && hovered) || toggled

    const sign = direction === "forward" ? 1 : -1
    const rotateKey = axis === "y" ? "rotateY" : "rotateX"
    // No eixo X o giro "para frente" tomba o card para tras (topo se afasta).
    const turn = (axis === "y" ? 180 : -180) * sign

    const transition: Transition = reduceMotion
        ? { duration: 0 }
        : curve === "spring"
          ? { type: "spring" as const, duration, bounce: 0.2 }
          : { type: "tween" as const, duration, ease: CURVES[curve] }

    function toggle() {
        startTransition(() => setToggled((t) => !t))
    }

    function handlePointerEnter(e: PointerEvent) {
        if (e.pointerType === "touch") return
        startTransition(() => setHovered(true))
    }

    function handlePointerLeave(e: PointerEvent) {
        if (e.pointerType === "touch") return
        startTransition(() => {
            setHovered(false)
            // No modo hover, sair do card desfaz um clique anterior.
            if (!clickEnabled) setToggled(false)
        })
    }

    function handleClick(e: MouseEvent) {
        // Toque sempre alterna (no mobile nao existe hover).
        const isTouch =
            (e.nativeEvent as globalThis.PointerEvent).pointerType === "touch"
        if (clickEnabled || isTouch) toggle()
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggle()
        }
    }

    const faceBase: CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        willChange: "transform",
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={flipped ? "Show front" : "Show back"}
            onPointerEnter={isCanvas ? undefined : handlePointerEnter}
            onPointerLeave={isCanvas ? undefined : handlePointerLeave}
            onClick={isCanvas ? undefined : handleClick}
            onKeyDown={isCanvas ? undefined : handleKeyDown}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                perspective: `${perspective}px`,
                perspectiveOrigin: "50% 50%",
                cursor: clickEnabled ? "pointer" : "default",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <motion.div
                aria-hidden={flipped}
                style={{ ...faceBase, pointerEvents: flipped ? "none" : "auto" }}
                initial={false}
                animate={{ [rotateKey]: flipped ? turn : 0 }}
                transition={transition}
            >
                {fill(front) ?? <Placeholder label="Front" radius={radius} />}
            </motion.div>
            <motion.div
                aria-hidden={!flipped}
                style={{ ...faceBase, pointerEvents: flipped ? "auto" : "none" }}
                initial={false}
                animate={{ [rotateKey]: flipped ? 0 : -turn }}
                transition={transition}
            >
                {fill(back) ?? <Placeholder label="Back" radius={radius} />}
            </motion.div>
        </div>
    )
}

// Faz a instancia do slot ocupar a face inteira.
function fill(node: ReactNode): ReactNode | null {
    const child = Children.toArray(node)[0]
    if (!isValidElement(child)) return null
    const childStyle = (child.props as { style?: CSSProperties }).style
    return cloneElement(child as ReactElement<any>, {
        style: { ...childStyle, width: "100%", height: "100%" },
    })
}

function Placeholder({ label, radius }: { label: string; radius: number }) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 24,
                borderRadius: radius,
                background: "rgba(136, 85, 255, 0.08)",
                border: "1px dashed rgba(136, 85, 255, 0.5)",
                color: "#8855FF",
                fontFamily: "Inter, system-ui, sans-serif",
                textAlign: "center",
            }}
        >
            <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.8 }}>
                Connect a layer in the properties panel
            </span>
        </div>
    )
}

addPropertyControls(Flip3DCard, {
    front: {
        type: ControlType.Slot,
        title: "Front",
        maxCount: 1,
    },
    back: {
        type: ControlType.Slot,
        title: "Back",
        maxCount: 1,
    },
    showBack: {
        type: ControlType.Boolean,
        title: "Show Back",
        description: "Canvas only. Flip to edit the back.",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click", "both"],
        optionTitles: ["Hover", "Click", "Both"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["y", "x"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "y",
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Normal", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.7,
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    curve: {
        type: ControlType.Enum,
        title: "Curve",
        options: ["smooth", "snappy", "linear", "spring"],
        optionTitles: ["Smooth", "Snappy", "Linear", "Spring"],
        defaultValue: "smooth",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1400,
        min: 300,
        max: 4000,
        step: 50,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
        unit: "px",
    },
})

Flip3DCard.displayName = "Flip Card"
