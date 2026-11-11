// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

interface StackImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface PageturnProps {
    images: StackImage[]
    speed: number
    radius: number
    cardWidth: number
    cardHeight: number
    tilt: number
    spread: number
    perspectiveRatio: number
    flipHorizontal: boolean
    shadow: boolean
    shadowStyle: string
    cardColor: string
    style?: CSSProperties
}

// Fitted against the reference clip: the leaving card covers ~70% of its arc in
// the first third of the transition, then creeps to the finish.
const EASE: [number, number, number, number] = [0.34, 0.6, 0.05, 0.95]
// Where the vanishing point sits relative to the middle of the stack, as a
// fraction of card width. Measured off the reference.
const VP_RATIO = -0.473
// Cards showing in the stack, front one included.
const VISIBLE_CARDS = 3
// Extra px of daylight between the front card and the one behind it.
const FRONT_GAP = 10

const DEFAULT_IMAGES: StackImage[] = [
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "",
    },
]

/**
 * Pageturn
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Pageturn(props: PageturnProps) {
    const {
        speed = 1.8,
        radius = 24,
        cardWidth = 300,
        cardHeight = 412,
        tilt = 46,
        spread = 44,
        perspectiveRatio = 4.2,
        flipHorizontal = false,
        shadow = false,
        shadowStyle = "0px 30px 60px 0px rgba(0,0,0,0.18)",
        cardColor = "#EDEDED",
    } = props

    // Framer does not persist defaults for image arrays, so a freshly inserted
    // instance arrives empty and falls back to the sample stack.
    const images = props.images?.length ? props.images : DEFAULT_IMAGES
    const total = images.length
    const isStatic = useIsStaticRenderer()
    const sceneRef = useRef<HTMLDivElement>(null)
    const inView = useInView(sceneRef, { amount: 0.2 })
    const [index, setIndex] = useState(0)

    useEffect(() => {
        if (isStatic || !inView || total < 3) return
        const id = window.setInterval(() => {
            startTransition(() => setIndex((value) => value + 1))
        }, Math.max(400, speed * 1000))
        return () => window.clearInterval(id)
    }, [isStatic, inView, total, speed])

    // One slot is reserved for the card flipping out and at least one for the
    // card waiting edge-on behind the stack, so the visible run is capped.
    const visible = Math.max(1, Math.min(VISIBLE_CARDS, total - 2))
    const deepest = visible - 1
    const flipDuration = Math.min(1.4, speed * 0.8)

    const perspective = cardWidth * perspectiveRatio

    // Every card hinges on its own right edge, and those hinges sit on one
    // plane a small step apart -- like sheets bound at a spine. Nothing moves
    // in Z, so cards never jump in size as they advance. The front card gets a
    // little extra room so it reads as separated from the one behind it.
    const hingeX = (slot: number) =>
        (deepest / 2 - slot) * spread + (slot === 0 ? FRONT_GAP : 0)
    // Cards lie flat at the back and open further with every step forward.
    const angleAt = (slot: number) =>
        deepest === 0 ? tilt : tilt * (1 - slot / deepest)

    // Distance from the vanishing point to the front card's hinge decides the
    // angle at which a flipping card projects to nothing. Solving
    // hinge*sin(t) = perspective*cos(t) gives the exact collapse angle, so the
    // card thins to a hairline and vanishes instead of splaying into a wedge.
    const vpX = VP_RATIO * cardWidth
    const frontHingeFromVP = hingeX(0) + cardWidth / 2 - vpX
    const collapseAngle =
        (Math.atan(perspective / Math.max(1, frontHingeFromVP)) * 180) / Math.PI

    // Mirroring the layout is a straight sign flip on every horizontal term:
    // the hinge moves to the other edge of the card, offsets and rotations
    // negate, and the vanishing point crosses the centre. Doing it in the maths
    // rather than with scaleX keeps the images the right way round.
    const dir = flipHorizontal ? -1 : 1

    return (
        <div
            ref={sceneRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                perspective,
                perspectiveOrigin: `calc(50% + ${dir * vpX}px) 50%`,
            }}
        >
            {images.map((image, i) => {
                const position = (((i - index) % total) + total) % total
                const isLeaving = total > 2 && position === total - 1
                const isWaiting = !isLeaving && position >= visible
                const slot = isWaiting ? deepest : isLeaving ? 0 : position

                // Rotation runs one way through a card's whole life: it opens
                // from edge-on behind the stack, lies flat at the back, swings
                // further open with each step forward, then keeps turning past
                // the front until it closes off at the hinge and is gone.
                let rotateY: number
                if (isLeaving) rotateY = collapseAngle
                else if (isWaiting) rotateY = -90
                else rotateY = angleAt(slot)
                rotateY *= dir

                const x = dir * hingeX(slot)

                const base: CSSProperties = {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: cardWidth,
                    height: cardHeight,
                    marginTop: -cardHeight / 2,
                    marginLeft: -cardWidth / 2,
                    borderRadius: radius,
                    overflow: "hidden",
                    transformOrigin: dir === 1 ? "100% 50%" : "0% 50%",
                    backgroundColor: cardColor,
                    boxShadow: shadow ? shadowStyle : "none",
                    zIndex: isLeaving ? 100 : isWaiting ? 0 : 50 - position,
                }

                const media = image?.src ? (
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt ?? ""}
                        draggable={false}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                    />
                ) : null

                // The canvas renderer does not run framer-motion animations, so
                // the resting stack is drawn with a plain transform there.
                if (isStatic) {
                    return (
                        <div
                            key={i}
                            style={{
                                ...base,
                                transform: `translateX(${x}px) rotateY(${rotateY}deg)`,
                            }}
                        >
                            {media}
                        </div>
                    )
                }

                return (
                    <motion.div
                        key={i}
                        initial={{ x, rotateY }}
                        animate={{ x, rotateY }}
                        transition={
                            // A waiting card is teleported behind the stack
                            // rather than animated back across it.
                            isWaiting
                                ? { duration: 0 }
                                : { duration: flipDuration, ease: EASE }
                        }
                        style={base}
                    >
                        {media}
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(Pageturn, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: DEFAULT_IMAGES,
        // Below five images the stack runs out of cards to hold in reserve and
        // the fan thins out. Framer honours minCount even though the bundled
        // control types have not caught up with it yet.
        // @ts-ignore
        minCount: 5,
        maxCount: 12,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Seconds each card stays in front.",
        defaultValue: 1.8,
        min: 0.6,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 80,
        max: 900,
        step: 2,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 412,
        min: 80,
        max: 1200,
        step: 2,
        unit: "px",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        description:
            "Angle of the front card. The back card always lies flat, the rest fan evenly between.",
        defaultValue: 46,
        min: 0,
        max: 75,
        step: 1,
        unit: "deg",
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        description: "How far apart the hinges sit. Keep it small.",
        defaultValue: 44,
        min: 0,
        max: 160,
        step: 2,
        unit: "px",
    },
    perspectiveRatio: {
        type: ControlType.Number,
        title: "Perspective",
        description: "Higher is flatter. Multiples of card width.",
        defaultValue: 4.2,
        min: 2,
        max: 12,
        step: 0.1,
        unit: "x",
    },
    flipHorizontal: {
        type: ControlType.Boolean,
        title: "Flip",
        description: "Mirror the stack so it fans the other way.",
        defaultValue: false,
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "#EDEDED",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
    },
    shadowStyle: {
        type: ControlType.BoxShadow,
        title: "Shadow Style",
        defaultValue: "0px 30px 60px 0px rgba(0,0,0,0.18)",
        hidden: (props) => !props.shadow,
    },
})

Pageturn.displayName = "Pageturn"
