import React, { useRef, useEffect, useCallback } from "react"
import { motion, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SPRING_CONFIG = { stiffness: 120, damping: 20, mass: 1 }

type Registry = Record<
    number,
    {
        getRect: () => DOMRect | null
        set: (x: number, y: number) => void
    }
>

/**
 * MAGNETIC STACK
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 260
 */
export default function MagneticStack(props) {
    // Every prop gets a real JS default. Framer's `defaultValue` in
    // addPropertyControls is a CANVAS default only - it is not applied when the
    // component is consumed as a shared module (framer.com/m/...) or nested
    // inside another component. Without these, `orientation` arrives undefined
    // and the stack silently renders horizontally with no gap.
    const {
        buttons,
        gap = 16,
        alignment = "center",
        interactionMode = "repel",
        orientation = "vertical",
        strength = 0.35,
        emptyState = "demo",
        style,
    } = props ?? {}

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const registry = useRef<Registry>({})

    // Framer can hand us undefined, null, or a sparse array. Normalise once.
    const items: React.ReactNode[] = Array.isArray(buttons)
        ? buttons.filter(Boolean)
        : []

    const isEmpty = items.length === 0
    const showDemo = isEmpty && emptyState === "demo"

    const children: React.ReactNode[] = showDemo ? DEMO_CHILDREN : items
    const count = children.length

    const isVertical = orientation === "vertical"

    const flexAlignment =
        alignment === "left" || alignment === "top"
            ? "flex-start"
            : alignment === "right" || alignment === "bottom"
              ? "flex-end"
              : "center"

    const containerStyle: React.CSSProperties = {
        ...style, // Framer's sizing + canvas position first
        display: "flex", // then override Framer's default display: block
        flexDirection: isVertical ? "column" : "row",
        gap,
        alignItems: isVertical ? flexAlignment : "center",
        justifyContent: isVertical ? "center" : flexAlignment,
    }

    const itemStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: isVertical ? flexAlignment : "center",
        alignItems: isVertical ? "center" : flexAlignment,
        width: isVertical ? "100%" : "auto",
        position: "relative",
        zIndex: 1,
    }

    // --- Pointer field, driven imperatively ---------------------------------
    // The old version kept offsets in React state and re-rendered the whole
    // stack on every mousemove. Because `buttons` is a fresh array on each
    // render, that also re-ran the sync effect ~60x/sec. Motion values write
    // straight to the DOM instead: zero re-renders while the pointer moves.

    const reset = useCallback(() => {
        const reg = registry.current
        for (const key in reg) reg[key]?.set(0, 0)
    }, [])

    const handleMove = useCallback(
        (event: React.PointerEvent) => {
            // Touch/pen have no hover state - a tap would leave items stuck.
            if (event.pointerType && event.pointerType !== "mouse") return

            const reg = registry.current

            // Nearest item to the pointer becomes the active one. A single
            // container-level handler means no flicker when the pointer
            // crosses the gap between two items.
            let activeIndex = -1
            let bestDistance = Infinity
            let activeDX = 0
            let activeDY = 0

            for (let i = 0; i < count; i++) {
                const entry = reg[i]
                if (!entry) continue
                const rect = entry.getRect()
                if (!rect) continue

                const dx = event.clientX - (rect.left + rect.width / 2)
                const dy = event.clientY - (rect.top + rect.height / 2)
                const distance = Math.hypot(dx, dy)

                if (distance < bestDistance) {
                    bestDistance = distance
                    activeIndex = i
                    activeDX = dx
                    activeDY = dy
                }
            }

            if (activeIndex === -1) return

            const multiplier = (interactionMode === "repel" ? -1 : 1) * strength

            for (let i = 0; i < count; i++) {
                const entry = reg[i]
                if (!entry) continue

                if (i === activeIndex) {
                    entry.set(activeDX * multiplier, activeDY * multiplier)
                    continue
                }

                // Collision propagation: falls off with index distance.
                const falloff = 1 / Math.abs(i - activeIndex)
                const x = activeDX * multiplier * falloff
                const y = activeDY * multiplier * falloff

                if (isVertical) entry.set(x * 0.3, y * 0.6)
                else entry.set(x * 0.6, y * 0.3)
            }
        },
        [count, interactionMode, strength, isVertical]
    )

    // Drop registrations for items that no longer exist.
    useEffect(() => {
        const reg = registry.current
        for (const key in reg) {
            if (Number(key) >= count) delete reg[key]
        }
    }, [count])

    // --- Empty + hint state -------------------------------------------------
    if (isEmpty && emptyState === "hint") {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed rgba(0,0,0,0.15)",
                    borderRadius: 16,
                    color: "#333",
                    fontFamily: "sans-serif",
                    minHeight: 150,
                }}
            >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                    Connect your buttons in the right panel →
                </p>
            </div>
        )
    }

    // --- Static canvas render (no physics, no motion values) ----------------
    if (isStatic) {
        return (
            <div style={containerStyle}>
                {children.map((child, index) => (
                    <div key={index} style={itemStyle}>
                        {child}
                    </div>
                ))}
            </div>
        )
    }

    // --- Live render --------------------------------------------------------
    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onPointerMove={handleMove}
            onPointerLeave={reset}
        >
            {children.map((child, index) => (
                <MagneticItem
                    key={index}
                    index={index}
                    registry={registry}
                    style={itemStyle}
                >
                    {child}
                </MagneticItem>
            ))}
        </div>
    )
}

function MagneticItem({ children, index, registry, style }) {
    const ref = useRef<HTMLDivElement>(null)
    const x = useSpring(0, SPRING_CONFIG)
    const y = useSpring(0, SPRING_CONFIG)

    useEffect(() => {
        const reg = registry.current
        reg[index] = {
            getRect: () => ref.current?.getBoundingClientRect() ?? null,
            set: (nx: number, ny: number) => {
                x.set(nx)
                y.set(ny)
            },
        }
        return () => {
            delete reg[index]
        }
    }, [index, registry, x, y])

    return (
        <motion.div ref={ref} style={{ ...style, x, y }}>
            {children}
        </motion.div>
    )
}

// --- Built-in demo content -------------------------------------------------
// So a freshly pasted copy shows a working magnetic stack instead of an empty
// box. Users replace these by connecting their own layers.

const DEMO_PILL: React.CSSProperties = {
    padding: "12px 26px",
    borderRadius: 999,
    background: "#111",
    color: "#fff",
    font: "500 14px/1 Inter, sans-serif",
    whiteSpace: "nowrap",
    userSelect: "none",
}

const DEMO_CHILDREN: React.ReactNode[] = ["Attract", "Repel", "Magnetic"].map(
    (label) => (
        <div key={label} style={DEMO_PILL}>
            {label}
        </div>
    )
)

// --- FRAMER UI CONTROLS ----------------------------------------------------
addPropertyControls(MagneticStack, {
    buttons: {
        type: ControlType.Array,
        title: "Buttons",
        control: { type: ControlType.ComponentInstance },
        defaultValue: [],
    },
    orientation: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "vertical",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical ↕", "Horizontal ↔"],
        displaySegmentedControl: true,
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Mode",
        defaultValue: "repel",
        options: ["attract", "repel"],
        optionTitles: ["Attract", "Repel"],
        displaySegmentedControl: true,
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Start", "Center", "End"],
        displaySegmentedControl: true,
    },
    emptyState: {
        type: ControlType.Enum,
        title: "If Empty",
        defaultValue: "demo",
        options: ["demo", "hint"],
        optionTitles: ["Demo", "Hint"],
        displaySegmentedControl: true,
    },
})
