// CardStack component for Framer with image upload and reordering
import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * CardStack
 *
 * A stack of cards with images that can be uploaded and rearranged in Framer Studio.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 352
 * @framerIntrinsicHeight 198
 */

let idCounter = 0
const genId = () => `card_${Date.now().toString(36)}_${idCounter++}`

function toObjList(arr) {
    return (arr.length ? arr : [placeholderImage]).map((img) => {
        if (typeof img === "string") return { id: genId(), src: img, alt: "" }
        if (img && typeof img === "object" && img.src)
            return { id: genId(), ...img }
        return {
            id: genId(),
            src: placeholderImage.src,
            alt: placeholderImage.alt,
        }
    })
}

const placeholderImage = {
    src:
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'><rect fill='#ddd' width='160' height='90'/><path d='M0 0L160 90M160 0L0 90' stroke='#aaa' stroke-width='4'/></svg>`
        ),
    alt: "Placeholder",
}

export default function CardStack(props) {
    const {
        images = [],
        offset = 10,
        scaleStep = 0.06,
        dimStep = 0.15,
        stiff = 170,
        damp = 26,
        style = {},
        ...rest
    } = props

    const [cards, setCards] = React.useState(toObjList(images))

    React.useEffect(() => {
        const prev = cards.slice()
        const next = []
        const srcList = images.length ? images : [placeholderImage]
        srcList.forEach((img) => {
            const src = typeof img === "string" ? img : img.src
            const idx = prev.findIndex((c) => c.src === src)
            if (idx > -1) {
                next.push(prev.splice(idx, 1)[0])
            } else {
                if (typeof img === "object" && img.src)
                    next.push({ id: genId(), ...img })
                else next.push({ id: genId(), src, alt: "" })
            }
        })
        setCards(next)
        // eslint-disable-next-line
    }, [JSON.stringify(images)])

    const moveToEnd = (i) => setCards((prev) => [...prev.slice(i + 1), prev[i]])

    const spring =
        stiff || damp
            ? { type: "spring", stiffness: stiff, damping: damp }
            : undefined

    const wrapperStyle = {
        ...style,
        position: "relative",
        width: style.width ?? 250,
        aspectRatio: props.ratio ?? "16 / 9",
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 0,
    }
    delete wrapperStyle.height

    return (
        <div {...rest} style={wrapperStyle}>
            <ul
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    margin: 0,
                    padding: 0,
                }}
            >
                {cards.map(({ id, src, alt }, i) => {
                    const front = i === 0
                    const brightness = Math.max(0.1, 1 - i * dimStep)
                    const baseZ = cards.length - i
                    return (
                        <motion.li
                            key={id}
                            style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                borderRadius: props.borderRadius ?? 8,
                                listStyle: "none",
                                cursor: front ? "grab" : "auto",
                                overflow: "hidden",
                                touchAction: "none",
                                zIndex: baseZ,
                                transition:
                                    "box-shadow 0.3s cubic-bezier(.4,0,.2,1)",
                            }}
                            animate={{
                                top: `calc(${i * -offset}%)`,
                                scale: 1 - i * scaleStep,
                                filter: `brightness(${brightness})`,
                                zIndex: baseZ,
                                transition: spring,
                            }}
                            drag={front ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragMomentum={false}
                            onDragEnd={() => moveToEnd(i)}
                            whileDrag={
                                front
                                    ? {
                                          zIndex: cards.length,
                                          cursor: "grabbing",
                                          scale: 1 - i * scaleStep + 0.05,
                                          rotate: 2,
                                      }
                                    : {}
                            }
                        >
                            <img
                                src={src}
                                alt={alt || "Card image"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                    display: "block",
                                    transition:
                                        "filter 0.3s cubic-bezier(.4,0,.2,1)",
                                }}
                            />
                        </motion.li>
                    )
                })}
            </ul>
        </div>
    )
}

addPropertyControls(CardStack, {
    images: {
        title: "Cards",
        type: ControlType.Array,
        control: { type: ControlType.ResponsiveImage },
        maxCount: 10,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
        ],
    },
    ratio: {
        title: "Aspect Ratio",
        type: ControlType.Enum,
        options: ["16 / 9", "4 / 3", "1 / 1", "3 / 4", "9 / 16"],
        optionTitles: ["16:9", "4:3", "1:1", "3:4", "9:16"],
        defaultValue: "16 / 9",
    },
    borderRadius: {
        title: "Corner Radius",
        type: ControlType.Number,
        defaultValue: 8,
        min: 0,
        max: 64,
        step: 1,
        displayStepper: true,
    },
    offset: {
        title: "Offset",
        type: ControlType.Number,
        defaultValue: 8,
        min: 0,
        max: 60,
        step: 1,
        displayStepper: true,
        unit: "%",
        description: "Vertical shift between cards",
    },
    scaleStep: {
        title: "Scale",
        type: ControlType.Number,
        defaultValue: 0.06,
        min: 0,
        max: 0.2,
        step: 0.005,
        displayStepper: true,
    },
    dimStep: {
        title: "Dim",
        type: ControlType.Number,
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.02,
        displayStepper: true,
    },
    stiff: {
        title: "Stiffness",
        type: ControlType.Number,
        defaultValue: 170,
        min: 0,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    damp: {
        title: "Damping",
        type: ControlType.Number,
        defaultValue: 26,
        min: 0,
        max: 60,
        step: 2,
        displayStepper: true,
    },
})
