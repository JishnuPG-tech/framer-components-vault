// Draggable card stack component with flip-to-back interaction
import React, {
    useState,
    useCallback,
    useMemo,
    startTransition,
    useEffect,
    useRef,
    type CSSProperties,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CardData {
    image: {
        src: string
        srcSet?: string
        alt?: string
        positionX?: string
        positionY?: string
    }
    title?: string
    description?: string
}

interface FlipCardStackProps {
    cards: CardData[]
    cardWidth: number
    cardHeight: number
    stackOffset: number
    stackRotation: number
    dragThreshold: number
    borderRadius: number
    shadowIntensity: number
    autoplay: boolean
    autoplayInterval: number
    enableFanRotation: boolean
    fanRotationSpread: number
    transition: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 */
export default function FlipCardStack(props: FlipCardStackProps) {
    const {
        cards = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Card 1",
                },
                title: "",
                description: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Card 2",
                },
                title: "",
                description: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Card 3",
                },
                title: "",
                description: "",
            },
        ],
        cardWidth,
        cardHeight,
        stackOffset,
        stackRotation,
        dragThreshold,
        borderRadius,
        shadowIntensity,
        autoplay = false,
        autoplayInterval = 3000,
        enableFanRotation = false,
        fanRotationSpread = 60,
        transition,
        style,
    } = props

    const [cardOrder, setCardOrder] = useState(() =>
        cards.map((_, index) => index)
    )
    const autoplayTimerRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    // Autoplay functionality
    useEffect(() => {
        if (isStatic || !autoplay || cards.length <= 1) {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current)
                autoplayTimerRef.current = null
            }
            return
        }

        autoplayTimerRef.current = window.setInterval(() => {
            startTransition(() => {
                setCardOrder((prevOrder) => {
                    const newOrder = [...prevOrder]
                    const topCardIndex = newOrder.length - 1
                    const topCard = newOrder.splice(topCardIndex, 1)[0]
                    newOrder.unshift(topCard)
                    return newOrder
                })
            })
        }, autoplayInterval)

        return () => {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current)
                autoplayTimerRef.current = null
            }
        }
    }, [autoplay, autoplayInterval, cards.length])

    const getCardTransform = useCallback(
        (index: number, cardIndex: number) => {
            const stackPosition = cardOrder.indexOf(cardIndex)
            const positionFromBottom = cardOrder.length - 1 - stackPosition

            let rotation = positionFromBottom * stackRotation
            let xOffset = 0
            let yOffset = -positionFromBottom * stackOffset

            // Fan rotation: distribute cards in an arc from bottom center
            if (enableFanRotation && cardOrder.length > 1) {
                const totalCards = cardOrder.length
                const centerIndex = (totalCards - 1) / 2
                const offsetFromCenter = stackPosition - centerIndex
                
                // Calculate rotation angle for fan spread
                rotation = offsetFromCenter * (fanRotationSpread / Math.max(1, totalCards - 1))
                
                // Calculate horizontal offset based on rotation to create arc effect
                // Cards spread out horizontally as they rotate
                xOffset = offsetFromCenter * 30
                
                // Adjust vertical offset for fan effect - cards at edges are slightly lower
                yOffset = -positionFromBottom * stackOffset + Math.abs(offsetFromCenter) * 15
            }

            return {
                zIndex: stackPosition,
                x: xOffset,
                y: yOffset,
                rotate: rotation,
                scale: 1 - positionFromBottom * 0.02,
                opacity: 1,
            }
        },
        [cardOrder, stackOffset, stackRotation, enableFanRotation, fanRotationSpread]
    )

    const handleDragEnd = useCallback(
        (event: any, info: any, cardIndex: number) => {
            const dragDistance =
                Math.abs(info.offset.x) + Math.abs(info.offset.y)
            const velocity =
                Math.abs(info.velocity.x) + Math.abs(info.velocity.y)

            if (dragDistance > dragThreshold || velocity > 800) {
                startTransition(() => {
                    setCardOrder((prevOrder) => {
                        const newOrder = [...prevOrder]
                        const draggedCardPosition = newOrder.indexOf(cardIndex)
                        const draggedCard = newOrder.splice(
                            draggedCardPosition,
                            1
                        )[0]
                        newOrder.unshift(draggedCard)
                        return newOrder
                    })
                })
            }
        },
        [dragThreshold]
    )

    const cardVariants = {
        initial: (custom: any) => ({
            ...custom,
            x: custom.x,
            y: custom.y,
        }),
        animate: (custom: any) => ({
            ...custom,
            x: custom.x,
            y: custom.y,
            transition: transition || {
                type: "spring",
                damping: 30,
                stiffness: 500,
                mass: 0.5,
                restDelta: 0.01,
                restSpeed: 0.01,
            },
        }),
        drag: {
            scale: 1.05,
            rotate: 0,
            transition: {
                duration: 0.05,
            },
        },
    }

    const renderedCards = useMemo(() => {
        return cards.map((card, index) => {
            const transform = getCardTransform(index, index)
            const isTopCard = cardOrder.indexOf(index) === cardOrder.length - 1

            return (
                <motion.div
                    key={`card-${index}`}
                    custom={transform}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileDrag={isStatic ? undefined : "drag"}
                    drag={isStatic ? false : isTopCard}
                    dragConstraints={{
                        top: -150,
                        bottom: 150,
                        left: -150,
                        right: 150,
                    }}
                    dragElastic={0.2}
                    dragSnapToOrigin={true}
                    dragTransition={{
                        power: 0.3,
                        timeConstant: 125,
                        bounceStiffness: 500,
                        bounceDamping: 30,
                    }}
                    onDragEnd={isStatic ? undefined : (event, info) =>
                        handleDragEnd(event, info, index)
                    }
                    style={{
                        position: "absolute",
                        width: cardWidth,
                        height: cardHeight,
                        borderRadius,
                        overflow: "hidden",
                        cursor: isStatic ? "default" : (isTopCard ? "grab" : "default"),
                        boxShadow: `0px ${4 + transform.zIndex * 2}px ${8 + transform.zIndex * 4}px rgba(0, 0, 0, ${shadowIntensity})`,
                        transformOrigin: enableFanRotation ? "center bottom" : "center center",
                    }}
                    whileHover={isStatic ? {} : (isTopCard ? { scale: 1.02 } : {})}
                >
                    {card.image && (
                        <img
                            src={card.image.src}
                            srcSet={card.image.srcSet}
                            alt={card.image.alt || `Card ${index + 1}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: `${card.image.positionX || "50%"} ${card.image.positionY || "50%"}`,
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {(card.title || card.description) && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                color: "white",
                                padding: "24px",
                                textAlign: "left",
                            }}
                        >
                            {card.title && (
                                <h3
                                    style={{
                                        margin: "0 0 4px 0",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                    }}
                                >
                                    {card.title}
                                </h3>
                            )}
                            {card.description && (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "14px",
                                        opacity: 0.8,
                                    }}
                                >
                                    {card.description}
                                </p>
                            )}
                        </div>
                    )}
                </motion.div>
            )
        })
    }, [
        cards,
        cardOrder,
        cardWidth,
        cardHeight,
        borderRadius,
        shadowIntensity,
        getCardTransform,
        cardVariants,
        handleDragEnd,
    ])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: cardWidth,
                height: cardHeight,
                perspective: "1000px",
            }}
        >
            <AnimatePresence>{renderedCards}</AnimatePresence>

            {cards.length === 0 && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f0f0f0",
                        borderRadius,
                        border: "2px dashed #ccc",
                        color: "#666",
                        textAlign: "center",
                        fontSize: "14px",
                    }}
                >
                    Add cards to create
                    <br />
                    your flip stack
                </div>
            )}
        </div>
    )
}

addPropertyControls(FlipCardStack, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    placeholder: "Card title...",
                    defaultValue: "",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    placeholder: "Card description...",
                    displayTextArea: true,
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
            },
        ],
        maxCount: 10,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 200,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 300,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 200,
        max: 800,
        step: 10,
        unit: "px",
        defaultValue: 400,
    },
    stackOffset: {
        type: ControlType.Number,
        title: "Offset",
        description: "Vertical spacing between cards in the stack",
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    enableFanRotation: {
        type: ControlType.Boolean,
        title: "Fan Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fanRotationSpread: {
        type: ControlType.Number,
        title: "Fan Spread",
        description: "Total rotation spread across all cards",
        min: 20,
        max: 180,
        step: 5,
        unit: "°",
        defaultValue: 60,
        hidden: (props) => !props.enableFanRotation,
    },
    stackRotation: {
        type: ControlType.Number,
        title: "Rotation",
        description: "Rotation angle applied to each card in the stack",
        min: -10,
        max: 15,
        step: 0.5,
        unit: "°",
        defaultValue: -10,
        hidden: (props) => props.enableFanRotation,
    },
    dragThreshold: {
        type: ControlType.Number,
        title: "Drag Threshold",
        min: 30,
        max: 200,
        step: 10,
        unit: "px",
        defaultValue: 80,
    },
    transition: {
        type: ControlType.Transition,
        title: "Animation",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.2,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        defaultValue: 3000,
        hidden: (props) => !props.autoplay,
    },
})
