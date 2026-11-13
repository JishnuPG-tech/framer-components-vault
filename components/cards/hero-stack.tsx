import { useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

const defaultImages = [
    {
        src: "https://framerusercontent.com/images/tszTohcbn8FGS72fBZ6ITsuIEY.png",
        alt: "women",
    },
    {
        src: "https://framerusercontent.com/images/o57c4mGYYJT7wXiJdLmXAUHu58.png",
        alt: "Modern Device Close-Up",
    },
    {
        src: "https://framerusercontent.com/images/ycW5a9DwhY6B5cxfdKaIrm8.png",
        alt: "Smartwatch",
    },
    {
        src: "https://framerusercontent.com/images/REBw7f8ko8Te9mY1Rlo7030ewY.jpeg",
        alt: "device",
    },
    {
        src: "https://framerusercontent.com/images/NujXva9qDoqDWaZi3jSCKJwrMY.png",
        alt: "Hand with Dropper Bottle",
    },
    {
        src: "https://framerusercontent.com/images/XohMbkZSCt5W8v66QuW9Sjg5300.png",
        alt: "FAYZE Product Box",
    },
    {
        src: "https://framerusercontent.com/images/dbJHdbN8ySVNjk7ky5aNP4J2ZKA.png",
        alt: "Tom Ford Perfume Bottle",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
]

/**
 * CardLoader
 *
 * @framerIntrinsicWidth 304
 * @framerIntrinsicHeight 380
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CardLoader(props) {
    const isStatic = useIsStaticRenderer()
    const cardCount = Math.max(1, Math.min(10, props.cardCount ?? 3))

    const [activeZone, setActiveZone] = useState(0)
    const [variant, setVariant] = useState("Hidden")
    const [showMainContent, setShowMainContent] = useState(false)
    const [hideLoader, setHideLoader] = useState(false)
    const [mouseActive, setMouseActive] = useState(false)

    const cardTitles = [
        props.card1Label || "PRODUCT DESIGNING",
        props.card2Label || "BRANDING",
        props.card3Label || "ILLUSTRATION",
        props.card4Label || "ART DIRECTION",
        props.card5Label || "WEB DESIGN",
        props.card6Label || "CARD 6",
        props.card7Label || "CARD 7",
        props.card8Label || "CARD 8",
        props.card9Label || "CARD 9",
        props.card10Label || "CARD 10",
    ]

    const showTextBox = props.showTextBox

    useEffect(() => {
        if (isStatic) {
            setVariant("Visible")
            setShowMainContent(true)
            setHideLoader(true)
            return
        }
        setVariant("Hidden")
        setShowMainContent(false)
        setHideLoader(false)

        const t1 = setTimeout(
            () => startTransition(() => setVariant("Visible")),
            10
        )
        const t2 = setTimeout(
            () => startTransition(() => setShowMainContent(true)),
            2500
        )
        const t3 = setTimeout(
            () => startTransition(() => setHideLoader(true)),
            2300
        )
        const t4 = setTimeout(
            () => startTransition(() => setMouseActive(true)),
            1700
        )

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [
        isStatic,
        props.cardCount,
        props.cardRadius,
        props.card1Image,
        props.card2Image,
        props.card3Image,
        props.card4Image,
        props.card5Image,
    ])

    useEffect(() => {
        if (isStatic) return
        if (!mouseActive) return

        function handler(e) {
            if (typeof window === "undefined") return
            const w = window.innerWidth
            const h = window.innerHeight
            const x = e.clientX
            const y = e.clientY
            const cx = w / 2,
                cy = h / 2
            const dx = x - cx
            const dy = cy - y
            let angle = Math.atan2(dy, dx)
            if (angle < 0) angle += 2 * Math.PI
            const nOffset = (angle - Math.PI / 8 + 2 * Math.PI) % (2 * Math.PI)
            const zone = Math.floor(nOffset / (Math.PI / 4))
            setActiveZone(zone)
        }
        window.addEventListener("mousemove", handler)
        return () => window.removeEventListener("mousemove", handler)
    }, [isStatic, mouseActive])

    const delays = [0, 0.15, 0.3, 0.45, 0.6]
    const yHidden = [700, 750, 800, 850, 900]

    const cardParams = Array(cardCount)
        .fill(0)
        .map((_, i) => ({
            image:
                props[`card${i + 1}Image`] && props[`card${i + 1}Image`].src
                    ? props[`card${i + 1}Image`]
                    : defaultImages[i] || defaultImages[0],
            delay: delays[i] ?? 0,
            yHidden: yHidden[i] ?? 150 + 50 * i,
            // 🔧 zIndex: make lower index cards sit on top initially
            zIndex: cardCount - i,
            xHidden: i % 2 === 0 ? -200 : 200,
            radius: props[`card${i + 1}Radius`] ?? props.cardRadius,
            shadow: props.cardShadow,
        }))

    const zoneCardMap = Array(8).fill(0).map((_, i) => i % cardCount)
    const frontCardIdx = zoneCardMap[activeZone] % cardCount

    const cardVariants = cardParams.map((card, idx) => ({
        Hidden: {
            x: card.xHidden,
            y: card.yHidden,
            opacity: 1,
            scale: 1,
            transition: {
                type: "tween",
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
                delay: card.delay,
            },
        },
        Visible: {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "tween",
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
                delay: card.delay,
            },
        },
    }))

    const fixedSize = {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        minWidth: 180,
        minHeight: 180,
    }

    const showFinalStack = hideLoader

    return (
        <div
            style={{
                ...fixedSize,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                aria-busy={variant !== "Visible"}
                style={{
                    ...fixedSize,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    background: "transparent",
                    display: showFinalStack ? "none" : "grid",
                    placeItems: "center",
                    overflow: "visible",
                    pointerEvents: showFinalStack ? "none" : "auto",
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: showFinalStack ? 0 : 1 }}
                transition={{
                    duration: 0.5,
                    ease: "easeIn",
                    delay: showFinalStack ? 0 : 0,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        justifySelf: "center",
                        alignSelf: "center",
                    }}
                >
                    {cardParams.map((card, idx) => (
                        <motion.div
                            key={"Card-" + (idx + 1)}
                            variants={cardVariants[idx]}
                            initial="Hidden"
                            animate={variant}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex:
                                    card.zIndex +
                                    (idx === frontCardIdx ? cardCount : 0),
                                borderRadius: props.cardRadius,
                                boxShadow: "none",
                                overflow: "hidden",
                                display: "block",
                                transformStyle: "preserve-3d",
                                transition:
                                    idx === frontCardIdx
                                        ? "transform 0.5s cubic-bezier(0.25,0.1,0.25,1)"
                                        : undefined,
                                transform:
                                    idx === frontCardIdx
                                        ? "rotateY(0deg)"
                                        : undefined,
                            }}
                        >
                            <img
                                src={card.image.src}
                                alt={card.image.alt || ""}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    border: 0,
                                    borderRadius: "inherit",
                                    margin: 0,
                                    padding: 0,
                                    boxSizing: "border-box",
                                    background: "transparent",
                                    outline: 0,
                                    verticalAlign: "top",
                                    appearance: "none",
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            <div
                style={{
                    ...fixedSize,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 998,
                    display: showFinalStack ? "grid" : "none",
                    placeItems: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                        justifySelf: "center",
                        alignSelf: "center",
                    }}
                >
                    {cardParams.map((card, idx) => (
                        <div
                            key={"FinalCard-" + (idx + 1)}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                zIndex:
                                    card.zIndex +
                                    (idx === frontCardIdx ? cardCount : 0),
                                borderRadius: props.cardRadius,
                                boxShadow: "none",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transformStyle: "preserve-3d",
                                transition:
                                    idx === frontCardIdx
                                        ? "transform 0.5s cubic-bezier(0.25,0.1,0.25,1)"
                                        : undefined,
                                transform:
                                    idx === frontCardIdx
                                        ? "rotateY(0deg)"
                                        : undefined,
                            }}
                        >
                            <img
                                src={card.image.src}
                                alt={card.image.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    border: 0,
                                    borderRadius: "inherit",
                                    margin: 0,
                                    padding: 0,
                                    boxSizing: "border-box",
                                    background: "none",
                                    outline: 0,
                                    verticalAlign: "top",
                                    appearance: "none",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <motion.div
                style={{
                    opacity: 0,
                    position: "relative",
                    zIndex: 1,
                    pointerEvents: showMainContent ? "auto" : "none",
                    width: "100%",
                    height: "100%",
                    minHeight: 180,
                    minWidth: 240,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: showMainContent ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 2.5, ease: "easeOut" }}
            >
                <div style={{ minHeight: 180, minWidth: 240 }}>
                    {/* Your website content goes here */}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(CardLoader, {
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 18,
        min: 0,
        max: 48,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        defaultValue: true,
        hidden: true,
    },
    cardCount: {
        type: ControlType.Number,
        title: "Cards Count",
        defaultValue: 5,
        min: 1,
        max: 7,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size (px)",
        defaultValue: 16,
        min: 10,
        max: 48,
        hidden: true,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Kerning (em)",
        defaultValue: 0,
        min: -0.2,
        max: 2,
        step: 0.01,
        hidden: true,
    },
    card1Label: {
        type: ControlType.String,
        title: "Card 1 Text",
        defaultValue: "PRODUCT DESIGNING",
        hidden: true,
    },
    card1Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 1 Image",
    },
    card2Label: {
        type: ControlType.String,
        title: "Card 2 Text",
        defaultValue: "BRANDING",
        hidden: true,
    },
    card2Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 2 Image",
    },
    card3Label: {
        type: ControlType.String,
        title: "Card 3 Text",
        defaultValue: "ILLUSTRATION",
        hidden: true,
    },
    card3Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 3 Image",
    },
    card4Label: {
        type: ControlType.String,
        title: "Card 4 Text",
        defaultValue: "ART DIRECTION",
        hidden: true,
    },
    card4Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 4 Image",
    },
    card5Label: {
        type: ControlType.String,
        title: "Card 5 Text",
        defaultValue: "WEB DESIGN",
        hidden: true,
    },
    card5Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 5 Image",
    },
    card6Label: {
        type: ControlType.String,
        title: "Card 6 Text",
        defaultValue: "CARD 6",
        hidden: true,
    },
    card6Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 6 Image",
    },
    card7Label: {
        type: ControlType.String,
        title: "Card 7 Text",
        defaultValue: "CARD 7",
        hidden: true,
    },
    card7Image: {
        type: ControlType.ResponsiveImage,
        title: "Card 7 Image",
    },
    card8Label: {},
    showTextBox: {
        type: ControlType.Boolean,
        title: "Show Card Label",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: true,
    },
})
