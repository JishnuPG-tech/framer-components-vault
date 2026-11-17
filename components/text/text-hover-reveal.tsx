// Interactive link with image that follows cursor on hover
//
// A dynamic link component that reveals an image following the cursor on hover.
// Perfect for portfolios, galleries, and interactive navigation menus.
//
// Features:
// - Smooth cursor-following image reveal
// - Customizable colors, fonts, and image size
// - Adjustable transition speed
// - Fully responsive and accessible
//
// Usage:
// Simply add the component to your canvas and customize the link text,
// URL, and image through the property controls.

import { useState, useRef, useEffect, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CursorFollowLinkProps {
    linkText: string
    linkUrl: string
    image: {
        src: string
        alt: string
    }
    textColor: string
    hoverTextColor: string
    overlayTextColor: string
    imageSize: number
    imageShape: "circle" | "square" | "rounded"
    transitionSpeed: number
    followSpeed: number
    font: CSSProperties
    style?: CSSProperties
}

/**
 * Interactive Hover Image Link
 * 
 * A link component with a circular image that follows the cursor on hover,
 * creating an engaging interactive effect with a clipped text overlay.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TextHoverReveal(props: CursorFollowLinkProps) {
    const {
        linkText = "Text Hover Reveal",
        linkUrl = "#",
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Tokyo Tower",
        },
        textColor = "#808080",
        hoverTextColor = "#333333",
        overlayTextColor = "#FFFFFF",
        imageSize = 150,
        imageShape = "circle",
        transitionSpeed = 275,
        followSpeed = 0.15,
        font,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [imagePos, setImagePos] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const targetPosRef = useRef({ x: 0, y: 0 })
    const currentPosRef = useRef({ x: 0, y: 0 })
    const velocityRef = useRef({ x: 0, y: 0 })
    const animationFrameRef = useRef<number>()

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isHovered && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const newX = e.clientX - rect.left
                const newY = e.clientY - rect.top
                
                targetPosRef.current = { x: newX, y: newY }
                
                startTransition(() => {
                    setMousePos({ x: newX, y: newY })
                })
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("mousemove", handleMouseMove)
            return () => window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [isHovered])

    // Smooth animation loop for image position
    useEffect(() => {
        if (!isHovered) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            return
        }

        const animate = () => {
            const spring = followSpeed // Spring stiffness (lower = more delay)
            const damping = 0.7 // Damping factor (lower = more bounce)

            // Calculate spring force
            const dx = targetPosRef.current.x - currentPosRef.current.x
            const dy = targetPosRef.current.y - currentPosRef.current.y

            // Apply spring physics
            velocityRef.current.x += dx * spring
            velocityRef.current.y += dy * spring

            // Apply damping
            velocityRef.current.x *= damping
            velocityRef.current.y *= damping

            // Update position
            currentPosRef.current.x += velocityRef.current.x
            currentPosRef.current.y += velocityRef.current.y

            // Update state
            startTransition(() => {
                setImagePos({
                    x: currentPosRef.current.x,
                    y: currentPosRef.current.y,
                })
            })

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isHovered])

    const handleMouseEnter = () => {
        startTransition(() => setIsHovered(true))
    }

    const handleMouseLeave = () => {
        startTransition(() => setIsHovered(false))
        // Reset velocity when leaving
        velocityRef.current = { x: 0, y: 0 }
    }

    const clipRadius = imageSize / 2

    // Determine shape styles based on preset
    const getShapeStyles = () => {
        switch (imageShape) {
            case "circle":
                return {
                    borderRadius: "50%",
                    clipPath: `circle(${clipRadius}px at ${imagePos.x}px ${imagePos.y}px)`,
                }
            case "square":
                return {
                    borderRadius: "0%",
                    clipPath: `inset(${Math.max(0, imagePos.y - clipRadius)}px calc(100% - ${imagePos.x + clipRadius}px) calc(100% - ${imagePos.y + clipRadius}px) ${Math.max(0, imagePos.x - clipRadius)}px round 0px)`,
                }
            case "rounded":
                return {
                    borderRadius: "20%",
                    clipPath: `inset(${Math.max(0, imagePos.y - clipRadius)}px calc(100% - ${imagePos.x + clipRadius}px) calc(100% - ${imagePos.y + clipRadius}px) ${Math.max(0, imagePos.x - clipRadius)}px round 20px)`,
                }
            default:
                return {
                    borderRadius: "50%",
                    clipPath: `circle(${clipRadius}px at ${imagePos.x}px ${imagePos.y}px)`,
                }
        }
    }

    const shapeStyles = getShapeStyles()

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "inline-block",
            }}
        >
            <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@900&display=swap" rel="stylesheet" />
            <a
                href={linkUrl}
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "inline-block",
                    color: isHovered ? hoverTextColor : textColor,
                    textDecoration: "none",
                    transition: `color ${transitionSpeed}ms ease`,
                    fontFamily: "Work Sans, sans-serif",
                    fontWeight: 900,
                    ...font,
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {linkText}
            </a>

            <span
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 2,
                        color: overlayTextColor,
                        clipPath: shapeStyles.clipPath,
                        opacity: isHovered ? 1 : 0,
                        transition: `opacity ${transitionSpeed}ms ease`,
                        fontFamily: "Work Sans, sans-serif",
                        fontWeight: 900,
                        ...font,
                    }}
                    aria-hidden="true"
                >
                    {linkText}
                </span>

                <span
                    style={{
                        position: "absolute",
                        top: `${imagePos.y}px`,
                        left: `${imagePos.x}px`,
                        width: `${imageSize}px`,
                        height: `${imageSize}px`,
                        opacity: isHovered ? 1 : 0,
                        transition: `opacity ${transitionSpeed}ms ease`,
                        zIndex: 1,
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            top: `-${imageSize / 2}px`,
                            left: `-${imageSize / 2}px`,
                            width: `${imageSize}px`,
                            height: `${imageSize}px`,
                        }}
                    >
                        <img
                            src={image.src}
                            alt={image.alt}
                            style={{
                                display: "block",
                                width: `${imageSize}px`,
                                height: `${imageSize}px`,
                                objectFit: "cover",
                                objectPosition: "center",
                                borderRadius: shapeStyles.borderRadius,
                                filter: "brightness(0.9)",
                            }}
                        />
                    </span>
                </span>
            </span>
        </div>
    )
}

addPropertyControls(TextHoverReveal, {
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "60px",
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    linkText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Text Hover Reveal",
    },
    linkUrl: {
        type: ControlType.Link,
        title: "URL",
        defaultValue: "#",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
        description: "Size of the hover image",
    },
    imageShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square", "rounded"],
        optionTitles: ["Circle", "Square", "Rounded"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#808080",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#333333",
    },
    overlayTextColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#FFFFFF",
        description: "Text color inside the image reveal",
    },
    transitionSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 275,
        min: 0,
        max: 1000,
        step: 25,
        unit: "ms",
        description: "Transition animation speed",
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        defaultValue: 0.15,
        min: 0.005,
        max: 0.5,
        step: 0.05,
        description: "How quickly the image follows the cursor (lower = more delay)",
    },
})

TextHoverReveal.displayName = "Text Hover Reveal"