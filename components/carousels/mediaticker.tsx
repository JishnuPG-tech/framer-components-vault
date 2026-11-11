// Media ticker with configurable direction and external media details display
import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
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

import { motion, useAnimationFrame } from "framer-motion"
import type React from "react"

interface MediaDetail {
    image: { src: string; alt: string }
    video?: string
    title: string
    description: string
    meta: string
}

interface MediaTickerProps {
    direction: "up-forward" | "up-downward" | "side-left" | "side-right"
    speed: number
    gap: number
    backgroundColor: string
    media: {
        items: MediaDetail[]
        width: number
        height: number
    }
    text: {
        show: boolean
        position: "left" | "right" | "top" | "bottom"
        offset: number
        order: ("title" | "description" | "meta")[]
        gap: number
    }
    title: {
        color: string
        font: CSSProperties
    }
    description: {
        color: string
        font: CSSProperties
    }
    meta: {
        color: string
        font: CSSProperties
    }
    textCard: {
        backgroundColor: string
        width: number
        padding: number
        radius: number
        border: any
        shadow: string
    }
    textAnim: {
        type: "fade" | "slide" | "scale" | "none"
        duration: number
        stagger: number
        delay: number
    }
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 400
 */
export default function MediaTicker(props: MediaTickerProps) {
    const {
        media = {
            items: [
                {
                    image: {
                        src: "https://framerusercontent.com/images/0pvzF68gMOShuXFo10MdgrKTH9Y.jpeg",
                        alt: "Gradient 1 - Blue",
                    },
                    video: "https://framerusercontent.com/assets/aPcEt1QzH3ojMcXVsdSQNkvVCCE.mp4",
                    title: "Media Title 1",
                    description: "A beautiful blue gradient with video",
                    meta: "2024",
                },
                {
                    image: {
                        src: "https://framerusercontent.com/images/l4Yzj6M5nSPVToBugHBepOOu0I.jpeg",
                        alt: "Gradient 2 - Purple",
                    },
                    video: "https://framerusercontent.com/assets/ZqkFGZpjWWTK8muDuCAnWVhkxI.mp4",
                    title: "Media Title 2",
                    description: "A beautiful purple gradient with video",
                    meta: "2024",
                },
                {
                    image: {
                        src: "https://framerusercontent.com/images/uF1NGMfdOOe6VooibtE3nwP8fy0.jpeg",
                        alt: "Gradient 3 - Orange",
                    },
                    video: "https://framerusercontent.com/assets/DUYMNRGu0DzjREqNSbqpDRQ6TI.mp4",
                    title: "Media Title 3",
                    description: "A beautiful orange gradient image",
                    meta: "2024",
                },
            ],
            width: 300,
            height: 400,
        },
        direction = "side-right",
        speed = 50,
        gap = 20,
        text = {
            show: true,
            position: "top",
            offset: 40,
            order: ["title", "description", "meta"],
            gap: 8,
        },
        title = {
            color: "#FF7A05",
            font: {
                fontSize: "32px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
                textAlign: "center",
            },
        },
        description = {
            color: "#666666",
            font: {
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
                textAlign: "center",
            },
        },
        meta = {
            color: "#949494",
            font: {
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: "1em",
                textAlign: "center",
            },
        },
        textCard = {
            backgroundColor: "rgba(255, 255, 255, 0)",
            width: 343,
            padding: 0,
            radius: 0,
            border: undefined,
            shadow: "none",
        },
        textAnim = {
            type: "slide",
            duration: 0.3,
            stagger: 0.1,
            delay: 0.1,
        },
        backgroundColor = "transparent",
    } = props

    const items = media.items
    const itemWidth = media.width
    const itemHeight = media.height

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [hoveredImageRect, setHoveredImageRect] = useState<DOMRect | null>(
        null
    )
    const [offset, setOffset] = useState(0)
    const [isTouchDevice, setIsTouchDevice] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const firstImageRef = useRef<HTMLDivElement>(null)
    const isHorizontal = direction === "side-left" || direction === "side-right"
    const isReverse = direction === "side-left" || direction === "up-downward"
    const isStatic =
        RenderTarget.current() === RenderTarget.thumbnail ||
        RenderTarget.current() === RenderTarget.canvas

    // Calculate total size of all items
    const totalSize =
        items.length * (isHorizontal ? itemWidth : itemHeight) +
        items.length * gap

    // Animation loop - only run if not static
    useAnimationFrame(
        isStatic
            ? null
            : (time, delta) => {
                  // Pause animation when hovering over a card
                  if (hoveredIndex !== null) return

                  const movement = (delta / 1000) * speed * (isReverse ? -1 : 1)
                  startTransition(() => {
                      setOffset((prev) => {
                          const newOffset = prev + movement
                          if (isReverse) {
                              return newOffset <= 0
                                  ? newOffset + totalSize
                                  : newOffset
                          } else {
                              return newOffset >= totalSize
                                  ? newOffset - totalSize
                                  : newOffset
                          }
                      })
                  })
              }
    )

    // Reset hover state when details are hidden
    useEffect(() => {
        if (!text.show) {
            startTransition(() => {
                setHoveredIndex(null)
                setHoveredImageRect(null)
            })
        }
    }, [text.show])

    // Show first card details in canvas mode
    useEffect(() => {
        if (
            isStatic &&
            text.show &&
            firstImageRef.current &&
            containerRef.current
        ) {
            const rect = firstImageRef.current.getBoundingClientRect()
            startTransition(() => {
                setHoveredIndex(0)
                setHoveredImageRect(rect)
            })
        }
    }, [isStatic, text.show])

    // Detect touch device
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkTouchDevice = () => {
                const hasTouchScreen =
                    "ontouchstart" in window || navigator.maxTouchPoints > 0
                startTransition(() => setIsTouchDevice(hasTouchScreen))
            }
            checkTouchDevice()
        }
    }, [])

    // Duplicate items for seamless loop
    const duplicatedItems = [...items, ...items, ...items]

    const getDetailsStyle = (): CSSProperties => {
        if (!hoveredImageRect || !containerRef.current) return {}

        const containerRect = containerRef.current.getBoundingClientRect()

        const baseStyle: CSSProperties = {
            position: "absolute",
            backgroundColor: textCard.backgroundColor,
            padding: textCard.padding,
            borderRadius: textCard.radius,
            ...textCard.border,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: textCard.shadow,
            width: textCard.width,
        }

        // Use the user's selected position
        const position = text.position

        switch (position) {
            case "left":
                return {
                    ...baseStyle,
                    right: `calc(100% + ${text.offset}px)`,
                    top: 0,
                    bottom: 0,
                    margin: "auto 0",
                    height: "fit-content",
                }
            case "right":
                return {
                    ...baseStyle,
                    left: `calc(100% + ${text.offset}px)`,
                    top: 0,
                    bottom: 0,
                    margin: "auto 0",
                    height: "fit-content",
                }
            case "top":
                return {
                    ...baseStyle,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                    bottom: `calc(100% + ${text.offset}px)`,
                }
            case "bottom":
                return {
                    ...baseStyle,
                    left: 0,
                    right: 0,
                    margin: "0 auto",
                    top: `calc(100% + ${text.offset}px)`,
                }
        }
    }

    const getTextTransitionVariants = (index: number) => {
        const baseDelay =
            textAnim.delay +
            index * textAnim.stagger

        if (textAnim.type === "none") {
            return {
                initial: {},
                animate: {},
                transition: { duration: 0 },
            }
        }

        const variants = {
            fade: {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
            },
            slide: {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
            },
            scale: {
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
            },
        }

        return {
            ...variants[textAnim.type],
            transition: {
                duration: textAnim.duration,
                delay: baseDelay,
            },
        }
    }

    const renderTextElement = (type: "title" | "description" | "meta", index: number) => {
        const currentItem = items[hoveredIndex!]
        const isLastElement = index === text.order.length - 1
        
        const textElements = {
            title: (
                <motion.div
                    key="title"
                    {...(isStatic ? {} : getTextTransitionVariants(index))}
                    style={{
                        ...title.font,
                        color: title.color,
                        marginBottom: isLastElement ? 0 : text.gap,
                    }}
                >
                    {currentItem?.title || "Media Title"}
                </motion.div>
            ),
            description: (
                <motion.div
                    key="description"
                    {...(isStatic ? {} : getTextTransitionVariants(index))}
                    style={{
                        ...description.font,
                        color: description.color,
                        marginBottom: isLastElement ? 0 : text.gap,
                    }}
                >
                    {currentItem?.description || "A beautiful gradient image"}
                </motion.div>
            ),
            meta: (
                <motion.div
                    key="meta"
                    {...(isStatic ? {} : getTextTransitionVariants(index))}
                    style={{
                        ...meta.font,
                        color: meta.color,
                        marginBottom: isLastElement ? 0 : text.gap,
                    }}
                >
                    {currentItem?.meta || "2024"}
                </motion.div>
            ),
        }
        
        return textElements[type]
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    overflow: "auto",
                    position: "relative",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: isHorizontal ? "row" : "column",
                        gap,
                        position: "absolute",
                        transform: isHorizontal
                            ? `translateX(-${offset}px)`
                            : `translateY(-${offset}px)`,
                        willChange: "transform",
                    }}
                >
                    {duplicatedItems.map((item, index) => {
                        const originalIndex = index % items.length
                        const isHovered = hoveredIndex === originalIndex
                        const imageData = item.image
                        const videoData = item.video

                        const handleInteraction = (
                            e: React.MouseEvent<HTMLDivElement>
                        ) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            if (isTouchDevice) {
                                // Toggle on click for touch devices
                                if (hoveredIndex === originalIndex) {
                                    startTransition(() => {
                                        setHoveredIndex(null)
                                        setHoveredImageRect(null)
                                    })
                                } else {
                                    startTransition(() => {
                                        setHoveredIndex(originalIndex)
                                        setHoveredImageRect(rect)
                                    })
                                }
                            } else {
                                // Hover behavior for desktop
                                startTransition(() => {
                                    setHoveredIndex(originalIndex)
                                    setHoveredImageRect(rect)
                                })
                            }
                        }

                        const handleMouseLeave = () => {
                            if (!isTouchDevice && text.show) {
                                startTransition(() => {
                                    setHoveredIndex(null)
                                    setHoveredImageRect(null)
                                })
                            }
                        }

                        return (
                            <div
                                key={index}
                                ref={index === 0 ? firstImageRef : null}
                                data-image-index={originalIndex}
                                style={{
                                    position: "relative",
                                    flexShrink: 0,
                                    width: itemWidth,
                                    height: itemHeight,
                                    cursor: isTouchDevice
                                        ? "pointer"
                                        : "default",
                                }}
                                onClick={
                                    isTouchDevice
                                        ? handleInteraction
                                        : undefined
                                }
                                onMouseEnter={
                                    !isTouchDevice
                                        ? handleInteraction
                                        : undefined
                                }
                                onMouseLeave={
                                    !isTouchDevice
                                        ? handleMouseLeave
                                        : undefined
                                }
                            >
                                {isHovered && !isStatic ? (
                                    <video
                                        src={
                                            videoData ||
                                            (originalIndex === 0
                                                ? "https://framerusercontent.com/assets/aPcEt1QzH3ojMcXVsdSQNkvVCCE.mp4"
                                                : originalIndex === 1
                                                ? "https://framerusercontent.com/assets/ZqkFGZpjWWTK8muDuCAnWVhkxI.mp4"
                                                : "https://framerusercontent.com/assets/DUYMNRGu0DzjREqNSbqpDRQ6TI.mp4")
                                        }
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={
                                            imageData?.src ||
                                            (originalIndex === 0
                                                ? "https://framerusercontent.com/images/0pvzF68gMOShuXFo10MdgrKTH9Y.jpeg"
                                                : originalIndex === 1
                                                ? "https://framerusercontent.com/images/l4Yzj6M5nSPVToBugHBepOOu0I.jpeg"
                                                : "https://framerusercontent.com/images/uF1NGMfdOOe6VooibtE3nwP8fy0.jpeg")
                                        }
                                        alt={imageData?.alt || "Default Media"}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {text.show &&
                hoveredIndex !== null &&
                hoveredImageRect && (
                    <motion.div
                        initial={isStatic ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: isStatic ? 0 : 0.2 }}
                        style={getDetailsStyle()}
                    >
                        {text.order.map((type, index) => renderTextElement(type, index))}
                    </motion.div>
                )}
        </div>
    )
}

MediaTicker.displayName = "Media Ticker"

addPropertyControls(MediaTicker, {
    media: {
        type: ControlType.Object,
        title: "Media",
        description: "Configure media items and their dimensions",
        controls: {
            items: {
                type: ControlType.Array,
                title: "Items",
                control: {
                    type: ControlType.Object,
                    controls: {
                        image: {
                            type: ControlType.ResponsiveImage,
                            title: "Image",
                        },
                        video: {
                            type: ControlType.File,
                            title: "Video (Optional)",
                            allowedFileTypes: ["mp4", "webm", "mov"],
                        },
                        title: {
                            type: ControlType.String,
                            title: "Title",
                            defaultValue: "Media Title",
                        },
                        description: {
                            type: ControlType.String,
                            title: "Description",
                            defaultValue: "A beautiful gradient image",
                            displayTextArea: true,
                        },
                        meta: {
                            type: ControlType.String,
                            title: "Meta",
                            defaultValue: "2024",
                        },
                    },
                },
                defaultValue: [
                    {
                        title: "Media Title 1",
                        description: "A beautiful blue gradient image",
                        meta: "2024",
                    },
                    {
                        title: "Media Title 2",
                        description: "A beautiful purple gradient with video",
                        meta: "2024",
                    },
                    {
                        title: "Media Title 3",
                        description: "A beautiful orange gradient image",
                        meta: "2024",
                    },
                ],
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 300,
                min: 100,
                max: 800,
                step: 10,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 400,
                min: 100,
                max: 600,
                step: 10,
                unit: "px",
            },
        },
        defaultValue: {
            items: [
                {
                    title: "Media Title 1",
                    description: "A beautiful blue gradient image",
                    meta: "2024",
                },
                {
                    title: "Media Title 2",
                    description: "A beautiful purple gradient with video",
                    meta: "2024",
                },
                {
                    title: "Media Title 3",
                    description: "A beautiful orange gradient image",
                    meta: "2024",
                },
            ],
            width: 300,
            height: 400,
        },
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        description: "Set the scroll direction of the ticker",
        options: ["up-forward", "up-downward", "side-left", "side-right"],
        optionTitles: ["↑", "↓", "←", "→"],
        defaultValue: "side-right",
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Control how fast the ticker scrolls",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Space between media items",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        description: "Control text visibility and positioning",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Text",
                description: "Toggle text display on hover",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                description: "Where text appears relative to ticker",
                options: ["left", "right", "top", "bottom"],
                optionTitles: ["Left", "Right", "Top", "Bottom"],
                defaultValue: "top",
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                description: "Distance from ticker to text card",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Space between text elements",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            order: {
                type: ControlType.Array,
                title: "Text Order",
                description: "Reorder title, description, and meta",
                control: {
                    type: ControlType.Enum,
                    options: ["title", "description", "meta"],
                    optionTitles: ["Title", "Description", "Meta"],
                },
                defaultValue: ["title", "description", "meta"],
                maxCount: 3,
            },
        },
        defaultValue: {
            show: true,
            position: "top",
            offset: 40,
            order: ["title", "description", "meta"],
            gap: 8,
        },
    },
    textCard: {
        type: ControlType.Object,
        title: "Text Card",
        description: "Style the text container",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                description: "Card background color",
                defaultValue: "rgba(255, 255, 255, 0)",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                description: "Card width in pixels",
                defaultValue: 343,
                min: 100,
                max: 500,
                step: 10,
                unit: "px",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                description: "Inner spacing of the card",
                defaultValue: 0,
                min: 0,
                max: 50,
                step: 5,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                description: "Corner roundness of the card",
                defaultValue: 0,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                description: "Card border styling",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "#000000",
                },
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                description: "Card drop shadow effect",
                defaultValue: "none",
            },
        },
        defaultValue: {
            backgroundColor: "rgba(255, 255, 255, 0)",
            width: 343,
            padding: 0,
            radius: 0,
            border: {
                borderWidth: 0,
                borderStyle: "solid",
                borderColor: "#000000",
            },
            shadow: "none",
        },
        hidden: ({ text }) => !text.show,
    },
    title: {
        type: ControlType.Object,
        title: "Title",
        description: "Style the title text",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Title text color",
                defaultValue: "#FF7A05",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Title typography settings",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "32px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    textAlign: "center",
                },
            },
        },
        defaultValue: {
            color: "#FF7A05",
            font: {
                fontSize: "32px",
                variant: "Semibold",
                letterSpacing: "-0.01em",
                lineHeight: "1.2em",
                textAlign: "center",
            },
        },
        hidden: ({ text }) => !text.show,
    },
    description: {
        type: ControlType.Object,
        title: "Description",
        description: "Style the description text",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Description text color",
                defaultValue: "#666666",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Description typography settings",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                    textAlign: "center",
                },
            },
        },
        defaultValue: {
            color: "#666666",
            font: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.3em",
                textAlign: "center",
            },
        },
        hidden: ({ text }) => !text.show,
    },
    meta: {
        type: ControlType.Object,
        title: "Meta",
        description: "Style the meta text",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                description: "Meta text color",
                defaultValue: "#949494",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                description: "Meta typography settings",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
        },
        defaultValue: {
            color: "#949494",
            font: {
                fontSize: "12px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
                textAlign: "center",
            },
        },
        hidden: ({ text }) => !text.show,
    },
    textAnim: {
        type: ControlType.Object,
        title: "Text Anim",
        description: "Configure text animation effects",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                description: "Animation style for text appearance",
                options: ["fade", "slide", "scale", "none"],
                optionTitles: ["Fade", "Slide", "Scale", "None"],
                defaultValue: "slide",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                description: "How long each animation takes",
                defaultValue: 0.3,
                min: 0,
                max: 2,
                step: 0.1,
                unit: "s",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                description: "Delay between each text element",
                defaultValue: 0.1,
                min: 0,
                max: 1,
                step: 0.05,
                unit: "s",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                description: "Initial delay before animation starts",
                defaultValue: 0.1,
                min: 0,
                max: 2,
                step: 0.1,
                unit: "s",
            },
        },
        defaultValue: {
            type: "slide",
            duration: 0.3,
            stagger: 0.1,
            delay: 0.1,
        },
        hidden: ({ text }) => !text.show,
    },
})
