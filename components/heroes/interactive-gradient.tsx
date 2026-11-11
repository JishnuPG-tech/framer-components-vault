// Interactive gradient component with mouse-following animated blobs
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
    useTransform,
    useSpring,
    useMotionTemplate,
    animate,
    useReducedMotion,
} from "framer-motion"

type HoverReturnMode = "Instant" | "Smooth" | "Distance"

interface InteractiveGradientProps {
    palette: string
    colors: {
        color1: string
        color2: string
        color3: string
    }
    loopDuration: number
    orbitRadius: number
    followStrength: number
    blur: number
    brightness: number
    radius: number

    // NEW (minimal hover fixes)
    hoverReturn?: HoverReturnMode // how to return on leave
    hoverOverscan?: number // px margin around the element
    hoverEnterSmoothing?: boolean // smooth priming on enter
    hoverEnterDuration?: number // seconds
}

/**
 * InteractiveGradient (classic, with minimal hover fixes)
 * - 3 overlapped radial gradients blended together
 * - Orbits loop forever (CPU-light math via a single animated phase)
 * - Pointer movement tugs the primary lobe toward the cursor
 * - All values are nicely spring-smoothed for silky motion
 * - Minimal fixes: smooth return + overscan + optional enter smoothing
 *
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function InteractiveGradient(props: InteractiveGradientProps) {
    const {
        palette = "Custom",
        colors = { color1: "#FF5EDB", color2: "#7B61FF", color3: "#2EE6A6" },
        loopDuration,
        orbitRadius,
        followStrength,
        blur,
        brightness,
        radius,

        // NEW defaults (chosen to keep behavior familiar but without “snap”)
        hoverReturn = "Smooth",
        hoverOverscan = 12,
        hoverEnterSmoothing = false,
        hoverEnterDuration = 0.2,
    } = props

    const reduce = useReducedMotion()
    const isStatic = useIsStaticRenderer()

    // Palette definitions
    const palettes: Record<string, [string, string, string]> = {
        Sunset: ["#FF5EDB", "#FFB86C", "#FF61A6"],
        Aqua: ["#2EE6A6", "#61E6FF", "#7B61FF"],
        Aurora: ["#7B61FF", "#2EE6A6", "#FFB86C"],
        Candy: ["#FF61A6", "#FFB86C", "#FF5EDB"],
        Forest: ["#2EE6A6", "#61E6FF", "#1B5E20"],
        Ocean: ["#005C97", "#363795", "#00C9FF"],
        Peach: ["#FFB347", "#FF5E62", "#FFD194"],
        Lemon: ["#F9D423", "#FF4E50", "#EDE574"],
        Rose: ["#F857A6", "#FF5858", "#FFB88C"],
        Sky: ["#43C6AC", "#191654", "#3A6073"],
        Lava: ["#FF512F", "#DD2476", "#FF6E7F"],
        Mint: ["#76B852", "#8DC26F", "#B7F8DB"],
        Grape: ["#41295A", "#2F0743", "#8E54E9"],
        Sand: ["#EDE574", "#E1F5C4", "#F9D423"],
    }

    // Determine colors based on palette selection
    let color1: string, color2: string, color3: string
    if (palette && palette !== "Custom" && palettes[palette]) {
        ;[color1, color2, color3] = palettes[palette]
    } else {
        color1 = colors.color1 || "#FF5EDB"
        color2 = colors.color2 || "#7B61FF"
        color3 = colors.color3 || "#2EE6A6"
    }

    // --- Cursor-driven target (normalized 0–100 in both axes) ---
    const pointerX = useMotionValue(50)
    const pointerY = useMotionValue(50)

    // Smooth follow for the primary lobe
    const pX = useSpring(pointerX, { stiffness: 200, damping: 28, mass: 0.8 })
    const pY = useSpring(pointerY, { stiffness: 200, damping: 28, mass: 0.8 })

    // How much the pointer biases center
    const x1 = useTransform(pX, (v: number) => 50 + (v - 50) * followStrength)
    const y1 = useTransform(pY, (v: number) => 50 + (v - 50) * followStrength)

    // --- Time / phase for orbital lobes ---
    const phase = useMotionValue(0)

    React.useEffect(() => {
        // Linear loop; stop if prefers-reduced-motion is on or if static
        if (reduce || isStatic) return
        const controls = animate(phase, Math.PI * 2, {
            duration: Math.max(0.1, loopDuration),
            ease: "linear",
            repeat: Infinity,
        })
        return () => controls.stop()
    }, [loopDuration, reduce, phase, isStatic])

    // Orbits (two lobes 120° apart)
    const x2 = useTransform(
        phase,
        (t: number) => 50 + Math.cos(t) * orbitRadius
    )
    const y2 = useTransform(
        phase,
        (t: number) => 50 + Math.sin(t) * orbitRadius
    )
    const x3 = useTransform(
        phase,
        (t: number) => 50 + Math.cos(t + (2 * Math.PI) / 3) * orbitRadius
    )
    const y3 = useTransform(
        phase,
        (t: number) => 50 + Math.sin(t + (2 * Math.PI) / 3) * orbitRadius
    )

    // Build the gradient as a live MotionValue<string>
    const background = useMotionTemplate`
    radial-gradient(circle at ${x1}% ${y1}%,
      ${color1} 0%,
      ${color1} 22%,
      rgba(0,0,0,0) 60%),
    radial-gradient(circle at ${x2}% ${y2}%,
      ${color2} 0%,
      ${color2} 22%,
      rgba(0,0,0,0) 60%),
    radial-gradient(circle at ${x3}% ${y3}%,
      ${color3} 0%,
      ${color3} 22%,
      rgba(0,0,0,0) 60%)
  `

    // Static fallback for non-interactive environments
    const staticBackground = `
    radial-gradient(circle at 50% 50%,
      ${color1} 0%,
      ${color1} 22%,
      rgba(0,0,0,0) 60%),
    radial-gradient(circle at ${50 + Math.cos(0) * orbitRadius}% ${50 + Math.sin(0) * orbitRadius}%,
      ${color2} 0%,
      ${color2} 22%,
      rgba(0,0,0,0) 60%),
    radial-gradient(circle at ${50 + Math.cos((2 * Math.PI) / 3) * orbitRadius}% ${50 + Math.sin((2 * Math.PI) / 3) * orbitRadius}%,
      ${color3} 0%,
      ${color3} 22%,
      rgba(0,0,0,0) 60%)
  `

    // ---------- Minimal hover fixes: overscan + smooth return ----------
    const rectRef = React.useRef<DOMRect | null>(null)
    const overscanRef = React.useRef<number>(hoverOverscan)
    React.useEffect(() => {
        overscanRef.current = hoverOverscan
    }, [hoverOverscan])

    const triggerPointerReturn = React.useCallback(() => {
        const cx = 50,
            cy = 50
        if (hoverReturn === "Instant") {
            pointerX.set(cx)
            pointerY.set(cy)
            return
        }
        let dur = 0.35
        if (hoverReturn === "Distance") {
            const dx = pointerX.get() - cx
            const dy = pointerY.get() - cy
            const dist = Math.sqrt(dx * dx + dy * dy) / 100 // normalize (0..~0.71)
            dur = Math.min(0.5, Math.max(0.18, 0.18 + dist * 0.45))
        }
        animate(pointerX, cx, { duration: dur, ease: "easeOut" })
        animate(pointerY, cy, { duration: dur, ease: "easeOut" })
    }, [hoverReturn, pointerX, pointerY])

    const handleGlobalMove = React.useCallback(
        (e: PointerEvent) => {
            const rect = rectRef.current
            if (!rect) return
            const os = Math.max(0, overscanRef.current || 0)
            const inside =
                e.clientX >= rect.left - os &&
                e.clientX <= rect.right + os &&
                e.clientY >= rect.top - os &&
                e.clientY <= rect.bottom + os

            if (!inside) {
                // left the overscanned area → apply return & stop tracking
                triggerPointerReturn()
                rectRef.current = null
                window.removeEventListener("pointermove", handleGlobalMove)
                return
            }
            // still inside overscan → update normalized 0..100
            const nx = ((e.clientX - rect.left) / rect.width) * 100
            const ny = ((e.clientY - rect.top) / rect.height) * 100
            pointerX.set(Math.max(0, Math.min(100, nx)))
            pointerY.set(Math.max(0, Math.min(100, ny)))
        },
        [pointerX, pointerY, triggerPointerReturn]
    )

    const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || reduce) return
        const el = e.currentTarget
        rectRef.current = el.getBoundingClientRect()

        // prime to current pointer position (optionally smoothed)
        const r = rectRef.current
        if (r) {
            const nx = ((e.clientX - r.left) / r.width) * 100
            const ny = ((e.clientY - r.top) / r.height) * 100
            if (hoverEnterSmoothing) {
                animate(pointerX, Math.max(0, Math.min(100, nx)), {
                    duration: Math.max(0.05, hoverEnterDuration),
                    ease: "easeOut",
                })
                animate(pointerY, Math.max(0, Math.min(100, ny)), {
                    duration: Math.max(0.05, hoverEnterDuration),
                    ease: "easeOut",
                })
            } else {
                pointerX.set(Math.max(0, Math.min(100, nx)))
                pointerY.set(Math.max(0, Math.min(100, ny)))
            }
        }

        // if overscan > 0, track globally until we truly leave the margin
        if ((hoverOverscan || 0) > 0) {
            window.addEventListener("pointermove", handleGlobalMove)
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || reduce) return
        if ((hoverOverscan || 0) > 0) return // global listener will handle
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        pointerX.set(Math.max(0, Math.min(100, x)))
        pointerY.set(Math.max(0, Math.min(100, y)))
    }

    const onPointerLeave = () => {
        if (isStatic || reduce) return
        if ((hoverOverscan || 0) > 0) return // global listener will decide actual leave
        // smooth return on local leave
        triggerPointerReturn()
    }

    React.useEffect(() => {
        return () => window.removeEventListener("pointermove", handleGlobalMove)
    }, [handleGlobalMove])

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                borderRadius: radius,
                filter: `blur(${blur}px) brightness(${brightness})`,
                background: isStatic ? staticBackground : background,
                willChange: isStatic ? "auto" : "background",
                overflow: "hidden",
                backgroundColor: "#0e0f12",
            }}
            onPointerMove={isStatic ? undefined : onPointerMove}
            onPointerLeave={isStatic ? undefined : onPointerLeave}
            onPointerEnter={isStatic ? undefined : onPointerEnter}
            animate={
                reduce
                    ? { filter: `blur(${blur}px) brightness(${brightness})` }
                    : undefined
            }
        />
    )
}

addPropertyControls(InteractiveGradient, {
    palette: {
        type: ControlType.Enum,
        title: "Palette",
        options: [
            "Custom",
            "Sunset",
            "Aqua",
            "Aurora",
            "Candy",
            "Forest",
            "Ocean",
            "Peach",
            "Lemon",
            "Rose",
            "Sky",
            "Lava",
            "Mint",
            "Grape",
            "Sand",
        ],
        optionTitles: [
            "Custom",
            "Sunset",
            "Aqua",
            "Aurora",
            "Candy",
            "Forest",
            "Ocean",
            "Peach",
            "Lemon",
            "Rose",
            "Sky",
            "Lava",
            "Mint",
            "Grape",
            "Sand",
        ],
        defaultValue: "Custom",
        displaySegmentedControl: false,
    },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        controls: {
            color1: {
                type: ControlType.Color,
                title: "Color 1",
                defaultValue: "#FF5EDB",
            },
            color2: {
                type: ControlType.Color,
                title: "Color 2",
                defaultValue: "#7B61FF",
            },
            color3: {
                type: ControlType.Color,
                title: "Color 3",
                defaultValue: "#2EE6A6",
            },
        },
        hidden: ({ palette }) => palette !== "Custom",
    },
    loopDuration: {
        type: ControlType.Number,
        title: "Loop Duration",
        defaultValue: 16,
        min: 1,
        max: 60,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    orbitRadius: {
        type: ControlType.Number,
        title: "Orbit Radius",
        defaultValue: 28,
        min: 0,
        max: 48,
        step: 1,
        unit: "%",
        displayStepper: true,
    },
    followStrength: {
        type: ControlType.Number,
        title: "Follow Strength",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 60,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 1,
        min: 0.2,
        max: 1.4,
        step: 0.01,
    },
    radius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },

    // NEW: minimal hover controls (optional)
    hoverReturn: {
        type: ControlType.Enum,
        title: "Hover Return",
        options: ["Instant", "Smooth", "Distance"],
        defaultValue: "Smooth",
    },
    hoverOverscan: {
        type: ControlType.Number,
        title: "Hover Overscan",
        defaultValue: 12,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    hoverEnterSmoothing: {
        type: ControlType.Boolean,
        title: "Enter Smoothing",
        defaultValue: false,
    },
    hoverEnterDuration: {
        type: ControlType.Number,
        title: "Enter Duration",
        defaultValue: 0.2,
        min: 0.05,
        max: 1,
        step: 0.01,
        unit: "s",
        hidden: ({ hoverEnterSmoothing }) => !hoverEnterSmoothing,
    },
})
