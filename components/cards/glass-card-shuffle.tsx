import { useState, useRef, startTransition, useEffect, useMemo } from "react"
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


interface Testimonial {
    id: number
    author: string
    testimonial: string
    avatar?: {
        src: string
        alt: string
    }
}

interface Props {
    items: Testimonial[]
    cardColor: string
    borderColor: string
    authorColor: string
    textColor: string
    style?: React.CSSProperties
}

interface TestimonialCardProps {
    item: Testimonial
    position: "front" | "middle" | "back"
    handleShuffle: () => void
    cardColor: string
    borderColor: string
    authorColor: string
    textColor: string
    isMobile: boolean
}

function TestimonialCard({
    item,
    position,
    handleShuffle,
    cardColor,
    borderColor,
    authorColor,
    textColor,
    isMobile,
}: TestimonialCardProps) {
    const dragRef = useRef(0)

    const cardStyle = useMemo(() => ({
        position: "absolute" as const,
        left: 0,
        top: 0,
        display: "grid",
        placeContent: "center",
        gap: isMobile ? "1rem" : "1.5rem",
        borderRadius: "16px",
        border: `2px solid ${borderColor}`,
        backgroundColor: cardColor,
        padding: isMobile ? "16px" : "24px",
        boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        userSelect: "none" as const,
        cursor: "grab" as const,
        width: isMobile ? "280px" : "350px",
        height: isMobile ? "380px" : "450px",
        maxWidth: "100%",
        maxHeight: "100%",
        zIndex: position === "front" ? 2 : position === "middle" ? 1 : 0,
    }), [isMobile, borderColor, cardColor, position])

    const avatarSrc = useMemo(() => {
        if (item.avatar?.src) {
            return item.avatar.src
        }
        return `https://i.pravatar.cc/128?img=${item.id}`
    }, [item.avatar?.src, item.id])

    const animateProps = useMemo(() => ({
        rotate: position === "front" ? "-6deg" : position === "middle" ? "0deg" : "6deg",
        x: position === "front" ? "0%" : position === "middle" ? "33%" : "66%",
    }), [position])

    return (
        <motion.div
            style={cardStyle}
            animate={animateProps}
            drag
            dragElastic={0.35}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            onDragStart={(e) => {
                dragRef.current = e.clientX
            }}
            onDragEnd={(e) => {
                if (dragRef.current - e.clientX > 150) {
                    handleShuffle()
                }
                dragRef.current = 0
            }}
            transition={{ duration: 0.35 }}
            whileTap={{ cursor: "grabbing" }}
        >
            <img
                src={avatarSrc}
                alt={`Avatar of ${item.author}`}
                style={{
                    margin: "0 auto",
                    height: isMobile ? "6rem" : "8rem",
                    width: isMobile ? "6rem" : "8rem",
                    borderRadius: "9999px",
                    borderWidth: "2px",
                    borderColor: borderColor,
                    backgroundColor: "rgb(226, 232, 240)",
                    objectFit: "cover",
                    pointerEvents: "none",
                }}
            />
            <span
                style={{
                    textAlign: "center",
                    fontSize: isMobile ? "1rem" : "1.125rem",
                    lineHeight: isMobile ? "1.5rem" : "1.75rem",
                    fontStyle: "italic",
                    color: textColor,
                }}
            >
                "{item.testimonial}"
            </span>
            <span
                style={{
                    textAlign: "center",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    fontWeight: 500,
                    color: authorColor,
                }}
            >
                {item.author}
            </span>
        </motion.div>
    )
}

/**
 * Draggable Testimonials
 * 
 * A stack of testimonial cards that can be swiped to cycle through them.
 * 
 * @framerIntrinsicWidth 350
 * @framerIntrinsicHeight 450
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DraggableTestimonials(props: Props) {
    const {
        items,
        cardColor,
        borderColor,
        authorColor,
        textColor,
        style,
    } = props
    
    const [testimonials, setTestimonials] = useState(items)
    const [isMobile, setIsMobile] = useState(false)
    
    // Simplified mobile detection
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => {
                    setIsMobile(window.innerWidth < 768)
                })
            }
            
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Update testimonials when items prop changes
    useEffect(() => {
        setTestimonials(items)
    }, [items])

    const handleShuffle = () => {
        const [first, ...rest] = testimonials
        startTransition(() => {
            setTestimonials([...rest, first])
        })
    }

    const visibleTestimonials = useMemo(() => 
        testimonials.slice(0, 3).reverse()
    , [testimonials])

    return (
        <div style={{ 
            display: "grid", 
            placeItems: "center", 
            position: "relative",
            width: "100%",
            height: "100%",
            ...style 
        }}>
            {visibleTestimonials.map((item, index) => {
                const position =
                    index === 2 ? "front" : index === 1 ? "middle" : "back"
                return (
                    <TestimonialCard
                        key={item.id}
                        item={item}
                        position={position}
                        handleShuffle={handleShuffle}
                        cardColor={cardColor}
                        borderColor={borderColor}
                        authorColor={authorColor}
                        textColor={textColor}
                        isMobile={isMobile}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(DraggableTestimonials, {
    items: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.Number,
                    title: "ID",
                    defaultValue: 1,
                },
                author: {
                    type: ControlType.String,
                    title: "Author",
                    defaultValue: "Author Name",
                },
                testimonial: {
                    type: ControlType.String,
                    title: "Testimonial",
                    displayTextArea: true,
                    defaultValue: "A glowing review.",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                },
            },
        },
        defaultValue: [
            {
                id: 1,
                author: "Jane Doe",
                testimonial:
                    "This product transformed our workflow. Highly recommended for any team looking to boost productivity.",
            },
            {
                id: 2,
                author: "John Smith",
                testimonial:
                    "Exceptional customer service and a powerful set of features. It's been a game-changer for our projects.",
            },
            {
                id: 3,
                author: "Emily White",
                testimonial:
                    "The intuitive design made onboarding a breeze. We were up and running in minutes!",
            },
        ],
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Color",
        defaultValue: "rgba(30, 41, 59, 0.2)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgb(156, 163, 175)",
    },
    authorColor: {
        type: ControlType.Color,
        title: "Author",
        defaultValue: "rgb(209, 213, 219)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
})