// Image card with hover scrolling - scrolls down on first hover, then enables top/bottom area scrolling
import {
    useState,
    useRef,
    useEffect,
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


interface ImageScrollCardProps {
    image: { src: string; alt: string }
    scrollSpeed: number
    borderRadius: number
    shadow: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageScrollCard(props: ImageScrollCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Long image",
        },
        scrollSpeed = 50,
        borderRadius = 8,
        shadow = true,
    } = props

    const [scrollY, setScrollY] = useState(0)
    const [isHovering, setIsHovering] = useState(false)
    const [hasInitialHover, setHasInitialHover] = useState(false)
    const [imageHeight, setImageHeight] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const animationRef = useRef<number>()
    const isStatic = useIsStaticRenderer()

    // Calculate max scroll distance
    const maxScroll = Math.max(0, imageHeight - containerHeight)

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current && imageRef.current) {
                const containerRect =
                    containerRef.current.getBoundingClientRect()
                const imageRect = imageRef.current.getBoundingClientRect()
                startTransition(() => {
                    setContainerHeight(containerRect.height)
                    setImageHeight(imageRect.height)
                })
            }
        }

        const img = new Image()
        img.onload = () => {
            setTimeout(updateDimensions, 100)
        }
        img.src = image.src

        const resizeObserver = new ResizeObserver(updateDimensions)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [image.src])

    const startScrollAnimation = (direction: "up" | "down" | "initial") => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }

        const animate = () => {
            setScrollY((current) => {
                let newScrollY = current

                if (direction === "initial") {
                    // Initial hover - scroll down a bit
                    const targetScroll = Math.min(maxScroll * 0.3, maxScroll)
                    const diff = targetScroll - current
                    newScrollY = current + diff * 0.05

                    if (Math.abs(diff) > 1) {
                        animationRef.current = requestAnimationFrame(animate)
                    }
                } else if (direction === "down") {
                    newScrollY = Math.min(
                        current + scrollSpeed * 0.016,
                        maxScroll
                    )
                    if (newScrollY < maxScroll) {
                        animationRef.current = requestAnimationFrame(animate)
                    }
                } else if (direction === "up") {
                    newScrollY = Math.max(current - scrollSpeed * 0.016, 0)
                    if (newScrollY > 0) {
                        animationRef.current = requestAnimationFrame(animate)
                    }
                }

                return newScrollY
            })
        }

        animate()
    }

    const stopScrollAnimation = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
        }
    }

    const handleMouseEnter = () => {
        if (isStatic) return

        startTransition(() => {
            setIsHovering(true)
            if (!hasInitialHover) {
                setHasInitialHover(true)
                startScrollAnimation("initial")
            }
        })
    }

    const handleMouseLeave = () => {
        if (isStatic) return

        startTransition(() => {
            setIsHovering(false)
        })
        stopScrollAnimation()

        // Reset to top
        startTransition(() => {
            setScrollY(0)
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (
            isStatic ||
            !isHovering ||
            !hasInitialHover ||
            !containerRef.current
        )
            return

        const rect = containerRef.current.getBoundingClientRect()
        const mouseY = e.clientY - rect.top
        const centerY = rect.height / 2

        stopScrollAnimation()

        if (mouseY < centerY) {
            // Top half - scroll up
            startScrollAnimation("up")
        } else {
            // Bottom half - scroll down
            startScrollAnimation("down")
        }
    }

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: borderRadius,
                boxShadow: shadow ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
                cursor: "pointer",
                ...props.style,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <img
                ref={imageRef}
                src={image.src}
                alt={image.alt}
                style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    transform: `translateY(-${scrollY}px)`,
                    transition: isHovering ? "none" : "transform 0.3s ease-out",
                    objectFit: "cover",
                    objectPosition: "top",
                }}
                draggable={false}
            />

            {/* Visual indicator for hover areas (only visible during hover) */}
            {isHovering && hasInitialHover && !isStatic && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background:
                                "linear-gradient(to bottom, rgba(0,0,0,0.05), transparent)",
                            pointerEvents: "none",
                            opacity: 0.3,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.05), transparent)",
                            pointerEvents: "none",
                            opacity: 0.3,
                        }}
                    />
                </>
            )}
        </div>
    )
}

addPropertyControls(ImageScrollCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 50,
        min: 10,
        max: 300,
        step: 10,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "More components by [Sarib Khan](https://xtarc.agency/)",
    },
})
