import { useState, useMemo, useRef, useEffect } from "react"
import { motion, type Transition, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { createPortal } from "react-dom"

interface HoverWordData {
    word: string
    image: {
        src: string
        srcSet?: string
        alt?: string
    }
}

interface HoverRevealTextProps {
    text: string
    hoverWords: HoverWordData[]
    textFont: any
    textColor: string
    hoverableTextColor: string
    hoverTextColor: string
    hoverBackground: string
    hoverImageShadow: string
    maxImageWidth: number
    maxImageHeight: number
    imageOffsetX: number
    imageOffsetY: number
    animationType: "spring" | "ease"
    animationDuration: number
}

/**
 * Hover Image Reveal Component
 *
 * Inline text with hoverable words that reveal images.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HoverImageReveal(props: HoverRevealTextProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const wordRefs = useRef<{[key: number]: HTMLElement | null}>({})

    const hoverWords = useMemo(() => {
        return props.hoverWords || []
    }, [props.hoverWords])

    // Compute current position based on the hovered word ref
    const currentPosition = useMemo(() => {
        if (hoveredIndex === null || !wordRefs.current[hoveredIndex]) {
            return null
        }
        const rect = wordRefs.current[hoveredIndex]!.getBoundingClientRect()
        return {
            top: rect.top + props.imageOffsetY,
            left: rect.left + rect.width / 2 + props.imageOffsetX
        }
    }, [hoveredIndex, props.imageOffsetX, props.imageOffsetY])

    const getTransition = (): Transition => {
        if (props.animationType === "spring") {
            return {
                type: "spring",
                stiffness: 300,
                damping: 25,
            }
        }
        return {
            type: "tween",
            ease: "easeOut",
            duration: props.animationDuration,
        }
    }

    const renderText = () => {
        const { text } = props
        if (!text) return null

        // Sort hover words by length (longest first) to avoid partial matches
        const sortedWords = [...hoverWords].sort((a, b) => b.word.length - a.word.length)
        
        // Build regex pattern for all hover words
        const patterns = sortedWords.map(w => w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const regex = new RegExp(`(${patterns.join('|')})`, 'g')
        
        // Split text by hover words
        const parts = text.split(regex)
        
        return parts.map((part, index) => {
            const wordIndex = hoverWords.findIndex(w => w.word === part)
            
            if (wordIndex !== -1) {
                const isHovered = hoveredIndex === wordIndex
                return (
                    <span
                        key={`hover-${index}`}
                        ref={el => { wordRefs.current[wordIndex] = el }}
                        onMouseEnter={() => setHoveredIndex(wordIndex)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                            cursor: "pointer",
                            color: isHovered ? props.hoverTextColor : props.hoverableTextColor,
                            backgroundColor: isHovered ? props.hoverBackground : "transparent",
                            transition: "color 0.2s, background-color 0.2s",
                            display: "inline",
                        }}
                    >
                        {part}
                    </span>
                )
            }
            
            // Handle newlines as line breaks
            return part.split('\n').map((line, lineIdx, arr) => (
                <span key={`line-${index}-${lineIdx}`}>
                    {line}
                    {lineIdx < arr.length - 1 && <br />}
                </span>
            ))
        })
    }

    return (
        <>
            <div
                style={{
                    width: "100%",
                    ...props.textFont,
                    color: props.textColor,
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                }}
            >
                {renderText()}
            </div>
            
            {/* Render image in portal to escape clipping */}
            {typeof window !== "undefined" && createPortal(
                <AnimatePresence>
                    {hoveredIndex !== null && currentPosition && (
                        <motion.div
                            key={`image-${hoveredIndex}`}
                            style={{
                                position: "fixed",
                                top: currentPosition.top,
                                left: currentPosition.left,
                                transform: "translate(-50%, -100%)",
                                zIndex: 9999,
                                pointerEvents: "none",
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={getTransition()}
                        >
                            <div
                                style={{
                                    maxWidth: props.maxImageWidth,
                                    maxHeight: props.maxImageHeight,
                                    backgroundColor: "transparent",
                                }}
                            >
                                <img
                                    src={hoverWords[hoveredIndex].image?.src || [
                                        "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                                        "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                                        "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg"
                                    ][hoveredIndex]}
                                    alt={hoverWords[hoveredIndex].image?.alt || `Image ${hoveredIndex + 1}`}
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: props.maxImageHeight,
                                        width: "auto",
                                        height: "auto",
                                        objectFit: "contain",
                                        display: "block",
                                        boxShadow: props.hoverImageShadow || "0 8px 32px rgba(0, 0, 0, 0.2)",
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}

addPropertyControls(HoverImageReveal, {
    text: {
        type: ControlType.String,
        title: "Text Content",
        defaultValue: "This is a paragraph where you can hover over specific words to reveal images. You can also hover over other highlighted terms to see different visuals. Try hovering over this final word to see the last image appear above the text.\n\nYou can create new paragraphs by pressing Enter twice.",
        displayTextArea: true,
    },
    hoverWords: {
        type: ControlType.Array,
        title: "Hover Words",
        maxCount: 10,
        defaultValue: [
            {
                word: "specific words",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
            },
            {
                word: "other highlighted terms",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
            },
            {
                word: "this final word",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                word: {
                    type: ControlType.String,
                    title: "Word/Phrase",
                    defaultValue: "hover word",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    hoverableTextColor: {
        type: ControlType.Color,
        title: "Hoverable Word Color",
        defaultValue: "#0066FF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#0066FF",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "rgba(0, 102, 255, 0.1)",
    },
    maxImageWidth: {
        type: ControlType.Number,
        title: "Max Image Width",
        defaultValue: 400,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    maxImageHeight: {
        type: ControlType.Number,
        title: "Max Image Height",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    imageOffsetX: {
        type: ControlType.Number,
        title: "Image Offset X",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 10,
        unit: "px",
    },
    imageOffsetY: {
        type: ControlType.Number,
        title: "Image Offset Y",
        defaultValue: -12,
        min: -200,
        max: 50,
        step: 10,
        unit: "px",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["spring", "ease"],
        optionTitles: ["Spring", "Ease"],
        defaultValue: "spring",
        displaySegmentedControl: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        unit: "s",
        hidden: ({ animationType }) => animationType === "spring",
    },
    hoverImageShadow: {
        type: ControlType.BoxShadow,
        title: "Hover Image Shadow",
        defaultValue: "0 8px 32px rgba(0, 0, 0, 0.2)",
    },
})

HoverImageReveal.displayName = "Hover Image Reveal"
