/**
 * ---------------------------------------------------------
 * Aura3DCarousel
 * Premium 3D Image Carousel for Framer
 * ---------------------------------------------------------
 *
 * Features:
 * - Smooth infinite rotation
 * - Drag interaction
 * - Glass reflection effect
 * - Responsive 3D layout
 * - Adjustable image size
 * - Adjustable corner radius
 * - Adjustable carousel radius
 * - Hover scale interaction
 *
 * Marketplace Ready:
 * - Clean structure
 * - Organized comments
 * - Editable controls
 * - Optimized animation
 *
 * Created for Framer Marketplace
 * ---------------------------------------------------------
 */

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function Aura3DCarousel(props) {
    const {
        images,
        speed,
        enableHover,
        imageWidth,
        imageHeight,
        cornerRadius,
        radius,
    } = props

    /**
     * ---------------------------------------------------------
     * Refs
     * ---------------------------------------------------------
     */

    const carouselRef = React.useRef(null)

    const rotation = React.useRef(-45)
    const velocity = React.useRef(0)

    const isDragging = React.useRef(false)
    const startX = React.useRef(0)

    /**
     * ---------------------------------------------------------
     * Pointer Events
     * ---------------------------------------------------------
     */

    // Start Drag
    const handlePointerDown = (e) => {
        isDragging.current = true
        startX.current = e.clientX
    }

    // Drag Move
    const handlePointerMove = (e) => {
        if (!isDragging.current) return

        const delta = e.clientX - startX.current

        velocity.current = delta * 0.12

        rotation.current += velocity.current

        startX.current = e.clientX
    }

    // End Drag
    const handlePointerUp = () => {
        isDragging.current = false
    }

    /**
     * ---------------------------------------------------------
     * Smooth Rotation Animation
     * ---------------------------------------------------------
     */

    React.useEffect(() => {
        let animationFrame

        const animate = () => {
            // Smooth slowing effect
            velocity.current *= 0.94

            // Auto rotation
            rotation.current += speed + velocity.current

            // Apply transform
            if (carouselRef.current) {
                carouselRef.current.style.transform = `rotateY(${rotation.current}deg)`
            }

            animationFrame = requestAnimationFrame(animate)
        }

        animate()

        return () => cancelAnimationFrame(animationFrame)
    }, [speed])

    /**
     * ---------------------------------------------------------
     * Total Images
     * ---------------------------------------------------------
     */

    const count = images.length

    /**
     * ---------------------------------------------------------
     * Render
     * ---------------------------------------------------------
     */

    return (
        <div
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
                width: "100%",
                height: "100%",

                position: "relative",

                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                overflow: "hidden",

                perspective: "1800px",

                cursor: isDragging.current ? "grabbing" : "grab",

                background:
                    "radial-gradient(circle at center, rgba(255,255,255,0.04), transparent 75%)",
            }}
        >
            {/* ---------------------------------------------------------
                3D Carousel Center
            --------------------------------------------------------- */}
            <div
                ref={carouselRef}
                onPointerDown={handlePointerDown}
                style={{
                    width: 0,
                    height: 0,

                    position: "relative",

                    transformStyle: "preserve-3d",

                    transform: "rotateY(-45deg)",
                }}
            >
                {images.map((img, i) => {
                    const angle = (360 / count) * i

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",

                                width: imageWidth,
                                height: imageHeight,

                                left: -imageWidth / 2,
                                top: -imageHeight / 2,

                                transform: `
                                    rotateY(${angle}deg)
                                    translateZ(${radius}px)
                                `,

                                transformStyle: "preserve-3d",
                            }}
                        >
                            {/* ---------------------------------------------------------
                                Main Image
                            --------------------------------------------------------- */}
                            <img
                                src={img}
                                style={{
                                    width: "100%",
                                    height: "100%",

                                    objectFit: "cover",

                                    borderRadius: cornerRadius,

                                    transition:
                                        "transform 0.35s ease, filter 0.35s ease",

                                    boxShadow: "0 20px 40px rgba(0,0,0,0.22)",

                                    filter: "grayscale(10%)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!enableHover) return

                                    e.currentTarget.style.transform =
                                        "scale(1.06)"

                                    e.currentTarget.style.filter =
                                        "grayscale(0%)"
                                }}
                                onMouseLeave={(e) => {
                                    if (!enableHover) return

                                    e.currentTarget.style.transform = "scale(1)"

                                    e.currentTarget.style.filter =
                                        "grayscale(10%)"
                                }}
                            />

                            {/* ---------------------------------------------------------
                                Glass Reflection
                            --------------------------------------------------------- */}
                            <div
                                style={{
                                    position: "absolute",

                                    top: imageHeight + 10,
                                    left: 0,

                                    width: imageWidth,
                                    height: imageHeight,

                                    overflow: "hidden",

                                    borderRadius: cornerRadius,

                                    opacity: 0.14,

                                    transform: "scaleY(-1)",

                                    filter: "blur(4px)",
                                }}
                            >
                                {/* Reflection Image */}
                                <img
                                    src={img}
                                    style={{
                                        width: "100%",
                                        height: "100%",

                                        objectFit: "cover",
                                    }}
                                />

                                {/* Glass Overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,

                                        background:
                                            "linear-gradient(to bottom, rgba(255,255,255,0.12), transparent)",

                                        backdropFilter: "blur(8px)",
                                    }}
                                />

                                {/* Reflection Fade */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,

                                        background:
                                            "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.96))",
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * ---------------------------------------------------------
 * Default Props
 * ---------------------------------------------------------
 */

Aura3DCarousel.defaultProps = {
    speed: 0.08,

    radius: 260,

    imageWidth: 240,
    imageHeight: 340,

    cornerRadius: 22,

    enableHover: true,

    images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        "https://images.unsplash.com/photo-1494526585095-c41746248156",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
}

/**
 * ---------------------------------------------------------
 * Framer Controls
 * ---------------------------------------------------------
 */

addPropertyControls(Aura3DCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",

        propertyControl: {
            type: ControlType.Image,
        },
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",

        min: 100,
        max: 800,

        defaultValue: 260,
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",

        min: 0.01,
        max: 1,

        step: 0.01,

        defaultValue: 0.08,
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",

        min: 100,
        max: 500,

        defaultValue: 240,
    },

    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",

        min: 100,
        max: 700,

        defaultValue: 340,
    },

    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",

        min: 0,
        max: 100,

        defaultValue: 22,
    },

    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Effect",

        enabledTitle: "Yes",
        disabledTitle: "No",

        defaultValue: true,
    },
})
