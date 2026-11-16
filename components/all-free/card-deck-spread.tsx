// Card Deck Spread Component
//
// SUMMARY: An interactive deck component that displays a customizable spread of cards with images, titles, and links, supporting various animation triggers and engaging hover effects. Great for portfolios, product showcases, or highlighting content.
import {
    useState,
    useEffect,
    startTransition,
    useMemo,
    type CSSProperties,
    useRef,
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


// Default images for fallback
const defaultImages = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
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
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 6 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 7 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 8 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 9 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 10 - Green",
    },
]

interface CardData {
    image?: {
        src: string
        srcSet?: string
        alt?: string
    }
    backgroundPosition?: string
    title?: string
    link?: string
}

interface CardDeckSpreadProps {
    cards?: CardData[]
    numberOfCards: number
    cardRadius: number
    cardShadow: boolean
    shadowIntensity: number
    blurIntensity: number
    hoverBorderColor: string
    cardWidth: number
    cardHeight: number
    overlap: number
    animationTrigger: "instant" | "click" | "scroll" | "delay"
    animationDelay: number
    animationIntensity: number
    titleFont?: CSSProperties
    titleBackgroundColor: string
    titleTextColor: string
    style?: CSSProperties
}

/**
 * Card Deck Spread
 *
 * An interactive card deck component with smooth animations and hover effects.
 * Perfect for showcasing portfolios, products, or featured content.
 *
 * @framerIntrinsicWidth 570
 * @framerIntrinsicHeight 290
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CardDeckSpread(props: CardDeckSpreadProps) {
    const {
        cardRadius,
        cardShadow,
        cardWidth,
        cardHeight,
        overlap,
        style,
        shadowIntensity,
        hoverBorderColor,
        numberOfCards,
        cards = [],
        blurIntensity,
        titleFont,
        titleBackgroundColor,
        titleTextColor,
        animationTrigger,
        animationDelay = 0,
        animationIntensity = 1,
    } = props

    const isStatic = useIsStaticRenderer()
    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const [hovered, setHovered] = useState<number | null>(null)
    const [entered, setEntered] = useState(false)
    const [shouldAnimate, setShouldAnimate] = useState(
        animationTrigger === "instant"
    )
    const containerRef = useRef<HTMLDivElement>(null)

    // Memoize cards data to prevent unnecessary recalculations
    const cardsData = useMemo(() => {
        const result = [...cards.slice(0, numberOfCards)]
        for (let i = result.length; i < numberOfCards; i++) {
            result.push({
                image: defaultImages[i % defaultImages.length],
                title: "",
                link: "",
            })
        }
        return result
    }, [cards, numberOfCards])

    // Handle scroll and delay-based animation trigger
    useEffect(() => {
        if (
            (animationTrigger !== "scroll" && animationTrigger !== "delay") ||
            isStatic ||
            isThumbnail
        ) {
            return
        }

        if (typeof window === "undefined" || !containerRef.current) {
            return
        }

        if (animationTrigger === "scroll") {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        startTransition(() => setShouldAnimate(true))
                    }
                },
                { threshold: 0.1 }
            )

            observer.observe(containerRef.current)

            return () => observer.disconnect()
        } else {
            const timer = window.setTimeout(() => {
                startTransition(() => setShouldAnimate(true))
            }, animationDelay)
            return () => clearTimeout(timer)
        }
    }, [animationTrigger, animationDelay, isStatic, isThumbnail])

    // Reset animation state when trigger mode changes
    useEffect(() => {
        setShouldAnimate(animationTrigger === "instant")
        setEntered(false)
    }, [animationTrigger])

    // Entrance animation: cards slide in one by one
    useEffect(() => {
        if (isStatic || isThumbnail) {
            setEntered(true)
            return
        }

        if (!shouldAnimate) {
            setEntered(false)
            return
        }

        setEntered(false)
        const timeouts: number[] = []

        // Animation Intensity. Lower intensity = slower. Higher = faster.
        const intensity = Math.max(animationIntensity, 0.3)
        const baseDuration = 120
        const step = baseDuration / intensity
        for (let i = 0; i < numberOfCards; i++) {
            timeouts.push(
                window.setTimeout(() => {
                    if (i === numberOfCards - 1) {
                        setEntered(true)
                    }
                }, i * step)
            )
        }

        return () => timeouts.forEach((timeout) => clearTimeout(timeout))
    }, [
        isStatic,
        isThumbnail,
        numberOfCards,
        shouldAnimate,
        animationIntensity,
    ])

    // Memoize layout calculations
    const layout = useMemo(() => {
        const numCards = cardsData.length
        const totalWidth = cardWidth + (numCards - 1) * overlap
        const initialStackLeft = (totalWidth - cardWidth) / 2

        return { numCards, totalWidth, initialStackLeft }
    }, [cardsData.length, cardWidth, overlap])

    // Memoize animation timing
    const animationTiming = useMemo(() => {
        const intensity = Math.max(animationIntensity, 0.3)
        return {
            duration: 0.7 / intensity,
            delayStep: 0.09 / intensity,
        }
    }, [animationIntensity])

    // Detect if height is set to auto (fit content)
    const isFixedHeight = props?.style && props.style.height === "100%"
    const containerHeight = isFixedHeight ? "100%" : cardHeight

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: containerHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
                background: "transparent",
                cursor:
                    animationTrigger === "click" && !shouldAnimate
                        ? "pointer"
                        : "default",
            }}
            onClick={
                animationTrigger === "click" && !shouldAnimate
                    ? (e) => {
                          e.stopPropagation()
                          startTransition(() => setShouldAnimate(true))
                      }
                    : undefined
            }
        >
            <div
                style={{
                    position: "relative",
                    width: layout.totalWidth,
                    height: cardHeight,
                    overflow: "visible",
                    paddingBottom: 32,
                }}
            >
                {cardsData.map((card, i) => {
                    const isHovered = hovered === i
                    const z = layout.numCards - i + (isHovered ? 100 : 0)
                    const left = entered ? i * overlap : layout.initialStackLeft
                    const blur =
                        hovered !== null && !isHovered ? blurIntensity : 0
                    const top = entered ? 0 : i * 2
                    const horizontalOffset = entered ? 0 : i * 2

                    const img =
                        card.image || defaultImages[i % defaultImages.length]
                    const src =
                        img.src || defaultImages[i % defaultImages.length].src
                    const alt = img.alt || `Card ${i + 1}`
                    const srcSet = "srcSet" in img ? img.srcSet : undefined
                    const backgroundPosition =
                        card.backgroundPosition || "center"
                    const title = card.title || ""
                    const link = card.link || ""
                    const hasLink = link && link.trim() !== ""
                    const canInteract =
                        hasLink &&
                        (animationTrigger !== "click" || shouldAnimate)

                    const transitionDelay = i * animationTiming.delayStep

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: left + horizontalOffset,
                                top,
                                width: cardWidth,
                                height: cardHeight,
                                borderRadius: cardRadius,
                                boxShadow: cardShadow
                                    ? `0 4px 24px rgba(0,0,0,${shadowIntensity})`
                                    : "none",
                                background: "#fff",
                                cursor: canInteract ? "pointer" : "default",
                                zIndex: z,
                                willChange: "transform, opacity",
                                transition: isStatic
                                    ? "none"
                                    : `left ${animationTiming.duration}s cubic-bezier(0.25, 0.8, 0.25, 1) ${transitionDelay}s, top ${animationTiming.duration}s cubic-bezier(0.25, 0.8, 0.25, 1) ${transitionDelay}s, opacity ${animationTiming.duration}s cubic-bezier(0.25, 0.8, 0.25, 1) ${transitionDelay}s, transform ${isHovered ? "0.3s" : "0.4s"} cubic-bezier(0.25, 0.8, 0.25, 1), filter ${isHovered ? "0.3s" : "0.4s"} cubic-bezier(0.25, 0.8, 0.25, 1)`,
                                opacity: 1,
                                filter: blur ? `blur(${blur}px)` : "none",
                                transform: isHovered
                                    ? "scale(1.08) translateY(-12px)"
                                    : "scale(1) translateY(0)",
                                outline: isHovered
                                    ? `2px solid ${hoverBorderColor}`
                                    : "none",
                                overflow: "hidden",
                                userSelect: "none",
                            }}
                            tabIndex={hasLink ? 0 : undefined}
                            aria-label={title || alt}
                            role={hasLink ? "button" : "img"}
                            onMouseEnter={
                                animationTrigger === "click" && !shouldAnimate
                                    ? undefined
                                    : () => setHovered(i)
                            }
                            onMouseLeave={() => setHovered(null)}
                            onClick={
                                canInteract
                                    ? (e) => {
                                          if (typeof window !== "undefined") {
                                              window.location.href = link
                                          }
                                      }
                                    : animationTrigger === "click" &&
                                        !shouldAnimate
                                      ? (e) => e.preventDefault()
                                      : undefined
                            }
                            onKeyDown={
                                hasLink
                                    ? (e) => {
                                          if (
                                              e.key === "Enter" ||
                                              e.key === " "
                                          ) {
                                              e.preventDefault()
                                              if (
                                                  animationTrigger ===
                                                      "click" &&
                                                  !shouldAnimate
                                              ) {
                                                  return
                                              }
                                              if (
                                                  typeof window !== "undefined"
                                              ) {
                                                  window.location.href = link
                                              }
                                          }
                                      }
                                    : undefined
                            }
                        >
                            <img
                                src={src}
                                alt={alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: backgroundPosition,
                                    borderRadius: cardRadius,
                                    userSelect: "none",
                                }}
                            />
                            {title && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: titleBackgroundColor,
                                        color: titleTextColor,
                                        padding: "8px 12px 6px 12px",
                                        borderBottomLeftRadius: cardRadius,
                                        borderBottomRightRadius: cardRadius,
                                        textAlign: "center",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        opacity: isHovered ? 1 : 0,
                                        transition: isStatic
                                            ? "none"
                                            : "opacity 0.4s ease-in-out",
                                        ...titleFont,
                                    }}
                                >
                                    {title}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(CardDeckSpread, {
    // Content
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
                backgroundPosition: {
                    type: ControlType.Enum,
                    title: "Image Position",
                    options: [
                        "center",
                        "top",
                        "bottom",
                        "left",
                        "right",
                        "top left",
                        "top right",
                        "bottom left",
                        "bottom right",
                    ],
                    optionTitles: [
                        "Center",
                        "Top",
                        "Bottom",
                        "Left",
                        "Right",
                        "Top Left",
                        "Top Right",
                        "Bottom Left",
                        "Bottom Right",
                    ],
                    defaultValue: "center",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    placeholder: "Card title…",
                    defaultValue: "",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    placeholder: "https://example.com",
                    defaultValue: "",
                },
            },
        },
        maxCount: 20,
        defaultValue: [
            {
                image: defaultImages[0],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[1],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[2],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[3],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[4],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[5],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
            {
                image: defaultImages[6],
                backgroundPosition: "center",
                title: "",
                link: "",
            },
        ],
    },
    numberOfCards: {
        type: ControlType.Number,
        title: "Visible Cards",
        description: "Min 2 and Max 20 visible cards",
        defaultValue: 7,
        min: 2,
        max: 20,
        step: 1,
        displayStepper: true,
    },

    // Animation
    animationTrigger: {
        type: ControlType.Enum,
        title: "Start Animation",
        options: ["instant", "click", "scroll", "delay"],
        optionTitles: ["Instantly", "On Click", "On Appear", "Time Delay"],
        defaultValue: "instant",
        displaySegmentedControl: false,
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Animation Delay (ms)",
        defaultValue: 800,
        min: 0,
        max: 10000,
        step: 100,
        hidden: ({ animationTrigger }) => animationTrigger !== "delay",
    },
    animationIntensity: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0.5,
        max: 2.5,
        step: 0.05,
    },

    // Layout
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 210,
        min: 60,
        max: 300,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 290,
        min: 60,
        max: 400,
        step: 1,
        unit: "px",
    },
    overlap: {
        type: ControlType.Number,
        title: "Card Spacing",
        defaultValue: 60,
        min: 10,
        max: 200,
        step: 1,
        unit: "px",
    },

    // Style
    cardRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Card Border Color",
        defaultValue: "#000000",
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ cardShadow }) => !cardShadow,
    },
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
    },

    // Title
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    titleTextColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    titleBackgroundColor: {
        type: ControlType.Color,
        title: "Title Background Color",
        defaultValue: "rgba(0,0,0,0.48)",
    },
})
