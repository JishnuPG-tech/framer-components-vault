"use client"

import type React from "react"

// 3D Image Carousel with cylindrical layout using CSS transforms
import { useState, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CarouselItem {
    image: { src: string; alt: string }
}

interface Carousel3DProps {
    items: CarouselItem[]
    autoRotate: boolean
    carouselSettings: {
        speed: number
        radius: number
        perspective: number
        angle: number
    }
    image: {
        width: number
        height: number
        borderRadius: number
    }
    backgroundColor: string
    style?: CSSProperties
}

/**
 * 3D Image Carousel
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Carousel3D_V1(props: Carousel3DProps) {
    const {
        items = [],
        autoRotate = true,
        carouselSettings = {
            speed: 2,
            radius: 200,
            perspective: 1000,
            angle: 0,
        },
        image = {
            width: 160,
            height: 200,
            borderRadius: 20,
        },
        backgroundColor = "#000000",
    } = props

    const [currentRotation, setCurrentRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [lastPointerX, setLastPointerX] = useState(0)
    const [velocity, setVelocity] = useState(0)

    const angleStep = 360 / items.length

    const handlePointerDown = (clientX: number) => {
        setIsDragging(true)
        setLastPointerX(clientX)
        setVelocity(0)
    }

    const handlePointerUp = () => {
        setIsDragging(false)
    }

    const handlePointerMove = (clientX: number) => {
        if (!isDragging) return

        const deltaX = clientX - lastPointerX
        const rotationDelta = deltaX * 0.5 // Reduced sensitivity

        setCurrentRotation((prev) => prev + rotationDelta)
        setVelocity(rotationDelta)
        setLastPointerX(clientX)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        handlePointerDown(e.clientX)
    }

    const handleMouseUp = () => {
        handlePointerUp()
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        handlePointerMove(e.clientX)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault()
        if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX)
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        e.preventDefault()
        handlePointerUp()
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault()
        if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX)
        }
    }

    // Momentum/inertia effect
    useEffect(() => {
        if (isDragging || Math.abs(velocity) < 0.1) return

        let animationId: number

        const animate = () => {
            setVelocity((prev) => {
                const newVelocity = prev * 0.95 // Decay factor
                if (Math.abs(newVelocity) < 0.1) return 0

                setCurrentRotation((current) => current + newVelocity)
                return newVelocity
            })

            if (Math.abs(velocity) > 0.1) {
                animationId = requestAnimationFrame(animate)
            }
        }

        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [isDragging, velocity])

    // Auto rotation effect
    useEffect(() => {
        if (!autoRotate || isDragging) return

        let animationId: number

        const animate = () => {
            setCurrentRotation((prev) => prev + carouselSettings.speed * 0.016)
            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [autoRotate, carouselSettings.speed, isDragging])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                perspective: `${carouselSettings.perspective}px`,
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
        >
            {items.length === 0 ? (
                <div
                    style={{
                        color: "#000000",
                        fontSize: "18px",
                        fontWeight: "500",
                        textAlign: "center",
                        opacity: 0.7,
                    }}
                >
                    Load images for infinite spin
                </div>
            ) : (
                <div
                    style={{
                        position: "relative",
                        width: `${carouselSettings.radius * 2}px`,
                        height: `${carouselSettings.radius * 2}px`,
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${carouselSettings.angle}deg) rotateY(${currentRotation}deg)`,
                    }}
                >
                    {items.map((item, index) => {
                        const angle = index * angleStep
                        const rotateY = angle
                        const translateZ = carouselSettings.radius

                        return (
                            <div
                                key={index}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: `${image.width}px`,
                                    height: `${image.height}px`,
                                    marginLeft: `-${image.width / 2}px`,
                                    marginTop: `-${image.height / 2}px`,
                                    transform: `rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
                                    transformStyle: "preserve-3d",
                                    borderRadius: image.borderRadius,
                                    overflow: "hidden",
                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                                    backgroundColor: "#FFFFFF",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundImage: `url(${item.image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        borderRadius: "12px",
                                    }}
                                    role="img"
                                    aria-label={
                                        item.image?.alt || "Carousel image"
                                    }
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

addPropertyControls(Carousel3D_V1, {
    items: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        maxCount: 12,
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
            },
        ],
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    carouselSettings: {
        type: ControlType.Object,
        title: "Carousel",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 2,
                min: 0.1,
                max: 10,
                step: 0.1,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 200,
                min: 100,
                max: 400,
                step: 10,
                unit: "px",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1000,
                min: 500,
                max: 2000,
                step: 50,
                unit: "px",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 0,
                min: -45,
                max: 45,
                step: 1,
                unit: "deg",
            },
        },
        defaultValue: {
            speed: 6,
            radius: 200,
            perspective: 1000,
            angle: 0,
        },
    },
    image: {
        type: ControlType.Object,
        title: "Image",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 160,
                min: 100,
                max: 800,
                step: 10,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 200,
                min: 100,
                max: 800,
                step: 10,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            width: 160,
            height: 200,
            borderRadius: 12,
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
})
