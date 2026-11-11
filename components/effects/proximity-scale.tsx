import { Children, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate } from "framer-motion"

type EaseName = "easeOut" | "circOut" | "backOut" | "easeInOut" | "linear"
type Direction = "horizontal" | "vertical"
type Origin = "center" | "bottom" | "top"

interface ProximityScaleProps {
    children?: React.ReactNode
    direction: Direction
    gap: number
    maxScale: number
    influence: number
    lift: number
    origin: Origin
    followDuration: number
    followEase: EaseName
    returnBounce: number
    returnSpeed: number
    crossAlign: string
}

/**
 * Proximity Scale - a row or column of layers that scale by how close the
 * cursor is to each one, so neighbours swell in sequence like a dock.
 *
 * The pointer handler is attached only while the group is on screen, and each
 * item's rect is cached until the page scrolls or resizes.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 96
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ProximityScale(props: ProximityScaleProps) {
    const {
        children,
        direction,
        gap,
        maxScale,
        influence,
        lift,
        origin,
        followDuration,
        followEase,
        returnBounce,
        returnSpeed,
        crossAlign,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])

    const items = Children.toArray(children)
    const horizontal = direction === "horizontal"

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const root = rootRef.current
        if (!root) return

        const follow = { duration: followDuration, ease: followEase }

        // One "bounce" value drives the spring: ratio 1 settles flat.
        const stiffness = 40 * returnSpeed
        const ratio = 1 - Math.min(Math.max(returnBounce, 0), 0.95)
        const spring = {
            type: "spring" as const,
            stiffness,
            damping: 2 * ratio * Math.sqrt(stiffness),
            mass: 1,
        }

        // Cached geometry, recomputed only when the page moves.
        let centres: number[] | null = null
        let bounds: DOMRect | null = null
        const invalidate = () => {
            centres = null
            bounds = null
        }
        const measure = () => {
            bounds = root.getBoundingClientRect()
            centres = itemRefs.current.map((el) => {
                if (!el) return 0
                const r = el.getBoundingClientRect()
                return horizontal ? r.left + r.width / 2 : r.top + r.height / 2
            })
        }

        let engaged = false

        const rest = () => {
            engaged = false
            itemRefs.current.forEach((el) => {
                if (el) animate(el, { scale: 1, x: 0, y: 0 }, spring)
            })
        }

        const onMove = (event: PointerEvent) => {
            // Touch drags fire pointermove while scrolling; there is no cursor
            // to be near, so ignore anything that is not a mouse.
            if (event.pointerType !== "mouse") return
            if (!centres || !bounds) measure()
            if (!centres || !bounds) return

            const pointer = horizontal ? event.clientX : event.clientY

            // Cheap rejection: if the cursor is nowhere near the group, only
            // spend work on settling it back once.
            const nearEdge = horizontal
                ? Math.max(
                      0,
                      Math.max(
                          bounds.left - event.clientX,
                          event.clientX - bounds.right
                      )
                  )
                : Math.max(
                      0,
                      Math.max(
                          bounds.top - event.clientY,
                          event.clientY - bounds.bottom
                      )
                  )
            const crossMiss = horizontal
                ? Math.max(
                      0,
                      Math.max(
                          bounds.top - event.clientY,
                          event.clientY - bounds.bottom
                      )
                  )
                : Math.max(
                      0,
                      Math.max(
                          bounds.left - event.clientX,
                          event.clientX - bounds.right
                      )
                  )

            if (nearEdge > influence || crossMiss > influence) {
                if (engaged) rest()
                return
            }

            engaged = true

            for (let i = 0; i < itemRefs.current.length; i++) {
                const el = itemRefs.current[i]
                if (!el) continue

                const distance = Math.abs(pointer - centres[i])
                const t = Math.max(0, 1 - distance / Math.max(influence, 1))
                // Smoothstep gives a bell curve rather than a linear ramp.
                const falloff = t * t * (3 - 2 * t)

                const scale = 1 + (maxScale - 1) * falloff
                const shift = -lift * falloff

                animate(
                    el,
                    horizontal
                        ? { scale, y: shift, x: 0 }
                        : { scale, x: shift, y: 0 },
                    follow
                )
            }
        }

        let listening = false
        const listen = () => {
            if (listening) return
            listening = true
            invalidate()
            window.addEventListener("pointermove", onMove, { passive: true })
            window.addEventListener("scroll", invalidate, { passive: true })
            window.addEventListener("resize", invalidate)
            document.addEventListener("pointerleave", rest)
        }
        const stopListening = () => {
            if (!listening) return
            listening = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("scroll", invalidate)
            window.removeEventListener("resize", invalidate)
            document.removeEventListener("pointerleave", rest)
            rest()
        }

        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting) listen()
                        else stopListening()
                    }
                },
                { rootMargin: "150px" }
            )
            observer.observe(root)
        } else {
            listen()
        }

        return () => {
            if (observer) observer.disconnect()
            stopListening()
        }
    }, [
        isStatic,
        horizontal,
        gap,
        maxScale,
        influence,
        lift,
        followDuration,
        followEase,
        returnBounce,
        returnSpeed,
        items.length,
    ])

    const originValue =
        origin === "bottom"
            ? "center bottom"
            : origin === "top"
              ? "center top"
              : "center center"

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: horizontal ? "row" : "column",
                alignItems: crossAlign,
                justifyContent: "center",
                gap,
                width: "100%",
                height: "100%",
            }}
        >
            {items.length === 0 && isStatic && (
                <div
                    style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: "1px dashed rgba(0,0,0,0.25)",
                        font: "500 13px/1.4 sans-serif",
                        opacity: 0.6,
                    }}
                >
                    Add layers to Items
                </div>
            )}
            {items.map((child, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        itemRefs.current[i] = el
                    }}
                    style={{
                        position: "relative",
                        flex: "0 0 auto",
                        transformOrigin: originValue,
                        willChange: "transform",
                    }}
                >
                    {child}
                </div>
            ))}
        </div>
    )
}

ProximityScale.displayName = "Proximity Scale"

const EASE_OPTIONS: EaseName[] = [
    "easeOut",
    "circOut",
    "backOut",
    "easeInOut",
    "linear",
]

addPropertyControls(ProximityScale, {
    children: {
        type: ControlType.Slot,
        title: "Items",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "horizontal",
        options: ["horizontal", "vertical"],
        optionTitles: ["Row", "Column"],
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 14,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    crossAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "center",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Start", "Center", "End"],
    },
    maxScale: {
        type: ControlType.Number,
        title: "Max Scale",
        description: "Size of the item directly under the cursor.",
        defaultValue: 1.6,
        min: 1,
        max: 3,
        step: 0.05,
    },
    influence: {
        type: ControlType.Number,
        title: "Influence",
        description:
            "How far the effect reaches. Larger values pull more neighbours in.",
        defaultValue: 140,
        min: 20,
        max: 600,
        step: 10,
        unit: "px",
    },
    lift: {
        type: ControlType.Number,
        title: "Lift",
        description: "How far the peak item moves away from the baseline.",
        defaultValue: 12,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    origin: {
        type: ControlType.Enum,
        title: "Grow From",
        description: "Set to Bottom for a dock that grows upward.",
        defaultValue: "center",
        options: ["center", "bottom", "top"],
        optionTitles: ["Center", "Bottom", "Top"],
    },
    followDuration: {
        type: ControlType.Number,
        title: "Follow",
        defaultValue: 0.28,
        min: 0.05,
        max: 2,
        step: 0.02,
        unit: "s",
    },
    followEase: {
        type: ControlType.Enum,
        title: "Follow Ease",
        defaultValue: "easeOut",
        options: EASE_OPTIONS,
        optionTitles: [
            "Ease Out",
            "Circ Out",
            "Back Out",
            "Ease In Out",
            "Linear",
        ],
    },
    returnBounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.2,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 6,
        min: 1,
        max: 10,
        step: 0.5,
    },
})
