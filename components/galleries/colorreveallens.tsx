import * as React from "react"
import { motion, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface ColorRevealLensProps extends React.HTMLAttributes<HTMLDivElement> {
    image: { src: string; alt?: string }
    imageFit: "cover" | "contain" | "fill"
    size: number
    shape: "circle" | "square" | "triangle"
    edgeStyle: "sharp" | "soft"
    softness: number
    baseBrightness: number
    smoothing: number
    style?: CSSProperties
}

/**
 * Color Reveal Lens Component
 * Reveals a colored version of a black and white image on hover.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ColorRevealLens(props: ColorRevealLensProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Color reveal lens image",
        },
        imageFit = "cover",
        size = 150,
        shape = "circle",
        edgeStyle = "sharp",
        softness = 50,
        baseBrightness = 100,
        smoothing = 25,
        style,
        ...rest
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const isSharp = edgeStyle === "sharp"

    // Using Framer Motion springs for smooth cursor tracking
    const mouseX = useSpring(0, { stiffness: 300, damping: smoothing })
    const mouseY = useSpring(0, { stiffness: 300, damping: smoothing })

    // Spring for the size of the reveal area (to animate in and out on hover)
    const activeSize = useSpring(isStatic || isCanvas ? size : 0, {
        stiffness: 300,
        damping: 25,
    })

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isStatic || isCanvas) return
        const rect = e.currentTarget.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
    }

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (isStatic || isCanvas) return
        // Initialize position instantly on enter so it doesn't fly from top left
        const rect = e.currentTarget.getBoundingClientRect()
        mouseX.jump(e.clientX - rect.left)
        mouseY.jump(e.clientY - rect.top)
        activeSize.set(size)
    }

    const handleMouseLeave = () => {
        if (isStatic || isCanvas) return
        activeSize.set(0)
    }

    // Centered initially for canvas preview
    const containerRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        if (isStatic || isCanvas) {
            // Jump to center
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                mouseX.jump(rect.width / 2)
                mouseY.jump(rect.height / 2)
            }
        }
    }, [isStatic, isCanvas, mouseX, mouseY])

    // Update activeSize if the size prop changes (useful when tweaking in canvas)
    React.useEffect(() => {
        if (isStatic || isCanvas) {
            activeSize.jump(size)
        } else {
            // If prop changes while hovering, we want the max size to update
            // However, activeSize is managed by mouse enter/leave when not in canvas.
            // If the user forces a re-render, we don't necessarily want to jump the size.
            // This is primarily for the Framer UI.
        }
    }, [isStatic, isCanvas, size, activeSize])

    // Generate the clip-path dynamically based on the shape and motion values
    const clipPath = useTransform([mouseX, mouseY, activeSize], ([x, y, s]) => {
        const cx = x as number
        const cy = y as number
        const currentSize = s as number
        const halfSize = currentSize / 2

        if (shape === "circle") {
            return `circle(${halfSize}px at ${cx}px ${cy}px)`
        } else if (shape === "square") {
            return `inset(calc(${cy}px - ${halfSize}px) calc(100% - ${cx}px - ${halfSize}px) calc(100% - ${cy}px - ${halfSize}px) calc(${cx}px - ${halfSize}px))`
        } else if (shape === "triangle") {
            return `polygon(${cx}px calc(${cy}px - ${halfSize}px), calc(${cx}px + ${halfSize}px) calc(${cy}px + ${halfSize}px), calc(${cx}px - ${halfSize}px) calc(${cy}px + ${halfSize}px))`
        }
        return `circle(${halfSize}px at ${cx}px ${cy}px)`
    })

    // Generate the mask-image dynamically for soft edges
    const maskImage = useTransform(
        [mouseX, mouseY, activeSize],
        ([x, y, s]) => {
            const cx = x as number
            const cy = y as number
            const currentSize = s as number
            const halfSize = currentSize / 2

            const innerStop = 100 - softness

            return `radial-gradient(circle ${halfSize}px at ${cx}px ${cy}px, black ${innerStop}%, transparent 100%)`
        }
    )

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
            {...rest}
        >
            {/* Visually hidden image for SEO and screen readers */}
            <img
                src={image.src}
                alt={image.alt || "Interactive color reveal lens effect"}
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            />

            {/* Background Layer: Black and White */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: imageFit,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    filter: `grayscale(100%) brightness(${baseBrightness}%)`,
                    pointerEvents: "none",
                }}
            />

            {/* Foreground Layer: Full Color with Clip Path or Mask Image */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: imageFit,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    ...(isSharp
                        ? {
                              clipPath,
                              WebkitClipPath: clipPath,
                          }
                        : {
                              maskImage,
                              WebkitMaskImage: maskImage,
                          }),
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            />
        </div>
    )
}

addPropertyControls(ColorRevealLens, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 800,
        defaultValue: 150,
        displayStepper: true,
    },
    baseBrightness: {
        type: ControlType.Number,
        title: "B&W Brightness",
        min: 0,
        max: 200,
        defaultValue: 100,
        unit: "%",
        displayStepper: true,
    },
    edgeStyle: {
        type: ControlType.Enum,
        title: "Edge Style",
        options: ["sharp", "soft"],
        optionTitles: ["Sharp (Clip Path)", "Soft (Mask Image)"],
        defaultValue: "sharp",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square", "triangle"],
        optionTitles: ["Circle", "Square", "Triangle"],
        defaultValue: "circle",
        hidden(props) {
            return props.edgeStyle === "soft"
        },
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        min: 0,
        max: 100,
        defaultValue: 50,
        unit: "%",
        hidden(props) {
            return props.edgeStyle === "sharp"
        },
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0,
        max: 100,
        defaultValue: 25,
        displayStepper: true,
        description: "Higher values add more delay to the mouse follow effect.",
    },
})
