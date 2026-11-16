import { Children, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useTransform, animate } from "framer-motion"

type Axis = "horizontal" | "both"

interface SwipeDeckProps {
    children?: React.ReactNode
    visible: number
    offset: number
    falloff: number
    rotateSpread: number
    threshold: number
    axis: Axis
    loop: boolean
    bounce: number
    settleSpeed: number
}

/**
 * Swipe Deck - a stack of cards you drag and throw away to reveal the next.
 *
 * The top card carries the drag; cards behind it sit back by an offset and a
 * scale so the stack reads as depth. A throw past the threshold flings the card
 * out and promotes the next one, and anything short of that springs back.
 *
 * Works with touch as well as a mouse, which is the point of a deck.
 *
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 440
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SwipeDeck(props: SwipeDeckProps) {
    const {
        children,
        visible,
        offset,
        falloff,
        rotateSpread,
        threshold,
        axis,
        loop,
        bounce,
        settleSpeed,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const flinging = useRef(false)

    const cards = Children.toArray(children)
    const [order, setOrder] = useState<number[]>(() =>
        cards.map((_, i) => i)
    )

    // Keep the order in step if the card count changes on canvas.
    if (order.length !== cards.length) {
        setOrder(cards.map((_, i) => i))
    }

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(
        x,
        [-260, 0, 260],
        [-rotateSpread, 0, rotateSpread],
        { clamp: false }
    )

    const stiffness = 40 * settleSpeed
    const ratio = 1 - Math.min(Math.max(bounce, 0), 0.95)
    const spring = {
        type: "spring" as const,
        stiffness,
        damping: 2 * ratio * Math.sqrt(stiffness),
        mass: 1,
    }

    const settle = () => {
        animate(x, 0, spring)
        animate(y, 0, spring)
    }

    const dismiss = (dirX: number, dirY: number) => {
        if (flinging.current) return
        flinging.current = true
        const rect = rootRef.current?.getBoundingClientRect()
        const reach = (rect ? Math.max(rect.width, rect.height) : 400) * 1.6

        animate(x, dirX * reach, { duration: 0.35, ease: "easeIn" })
        animate(y, dirY * reach, { duration: 0.35, ease: "easeIn" }).then(
            () => {
                setOrder((prev) => {
                    if (prev.length < 2) return prev
                    const [first, ...rest] = prev
                    return loop ? [...rest, first] : rest
                })
                x.jump(0)
                y.jump(0)
                flinging.current = false
            }
        )
    }

    const onDragEnd = (
        _event: unknown,
        info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
    ) => {
        const dx = info.offset.x
        const dy = axis === "both" ? info.offset.y : 0
        const travelled = Math.sqrt(dx * dx + dy * dy)
        const flung = Math.abs(info.velocity.x) > 500

        if (travelled > threshold || flung) {
            const len = travelled || 1
            dismiss(dx / len || (dx >= 0 ? 1 : -1), dy / len)
        } else {
            settle()
        }
    }

    const depthOf = (cardIndex: number) => order.indexOf(cardIndex)
    const shown = Math.max(1, Math.round(visible))

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
            }}
        >
            {cards.length === 0 && isStatic && (
                <div
                    style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: "1px dashed rgba(0,0,0,0.25)",
                        font: "500 13px/1.4 sans-serif",
                        opacity: 0.6,
                    }}
                >
                    Add layers to Cards
                </div>
            )}

            {cards.map((card, cardIndex) => {
                const depth = depthOf(cardIndex)
                if (depth < 0 || depth >= shown) return null
                const top = depth === 0

                return (
                    <motion.div
                        key={cardIndex}
                        drag={isStatic || !top ? false : axis === "both" ? true : "x"}
                        dragMomentum={false}
                        dragElastic={0.6}
                        onDragEnd={top ? (onDragEnd as any) : undefined}
                        style={{
                            gridArea: "1 / 1",
                            zIndex: cards.length - depth,
                            cursor: top && !isStatic ? "grab" : undefined,
                            touchAction: "none",
                            x: top ? x : 0,
                            y: top ? y : depth * offset,
                            rotate: top ? rotate : 0,
                            scale: 1 - depth * falloff,
                            willChange: "transform",
                        }}
                        animate={
                            top
                                ? undefined
                                : { y: depth * offset, scale: 1 - depth * falloff }
                        }
                        transition={spring}
                    >
                        {card}
                    </motion.div>
                )
            })}
        </div>
    )
}

SwipeDeck.displayName = "Swipe Deck"

addPropertyControls(SwipeDeck, {
    children: {
        type: ControlType.Slot,
        title: "Cards",
    },
    visible: {
        type: ControlType.Number,
        title: "Visible",
        description: "How many cards are drawn, including the top one.",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
    },
    offset: {
        type: ControlType.Number,
        title: "Offset",
        description: "How far each card behind sits back.",
        defaultValue: 18,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    falloff: {
        type: ControlType.Number,
        title: "Scale Falloff",
        description: "How much smaller each card behind is drawn.",
        defaultValue: 0.05,
        min: 0,
        max: 0.3,
        step: 0.01,
    },
    rotateSpread: {
        type: ControlType.Number,
        title: "Tilt",
        description: "How far the top card leans as you drag it.",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
    },
    threshold: {
        type: ControlType.Number,
        title: "Throw At",
        description: "Drag distance that dismisses the card.",
        defaultValue: 130,
        min: 20,
        max: 600,
        step: 10,
        unit: "px",
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        defaultValue: "horizontal",
        options: ["horizontal", "both"],
        optionTitles: ["Sideways", "Any"],
        displaySegmentedControl: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        description: "Send a thrown card to the back instead of removing it.",
        defaultValue: true,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Overshoot as a card springs back. 0 settles flat.",
        defaultValue: 0.25,
        min: 0,
        max: 0.9,
        step: 0.05,
    },
    settleSpeed: {
        type: ControlType.Number,
        title: "Settle Speed",
        defaultValue: 6,
        min: 1,
        max: 10,
        step: 0.5,
    },
})
