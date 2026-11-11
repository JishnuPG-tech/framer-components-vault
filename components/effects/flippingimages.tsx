// Component with horizontally stacked, overlapping images that flip sequentially to reveal next image in each slot
import { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageSlot {
    images: Array<{ src: string; alt: string }>
}

interface FlippingImagesProps {
    slots: ImageSlot[]
    gap: number
    borderRadius: number
    outlineColor: string
    outlineWidth: number
    imageSize: number
    flipDuration: number
    flipInterval: number
    flipDelay: number
    flipDirection: "horizontal" | "vertical"
    style?: CSSProperties
}

/**
 * Flipping Images Stack
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FlippingImages(props: FlippingImagesProps) {
    const {
        slots = [
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Image 1",
                    },
                    {
                        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                        alt: "Image 2",
                    },
                ],
            },
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                        alt: "Image 3",
                    },
                    {
                        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                        alt: "Image 4",
                    },
                ],
            },
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                        alt: "Image 5",
                    },
                    {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Image 6",
                    },
                ],
            },
        ],
        gap = -10,
        borderRadius = 9999,
        outlineColor = "#FFFFFF",
        outlineWidth = 3,
        imageSize = 80,
        flipDuration = 0.6,
        flipInterval = 3000,
        flipDelay = 200,
        flipDirection = "vertical",
    } = props

    const [currentIndices, setCurrentIndices] = useState<number[]>(slots.map(() => 0))
    const [flippingStates, setFlippingStates] = useState<boolean[]>(slots.map(() => false))
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: false })
    const timeoutIdsRef = useRef<number[]>([])

    // Sync state arrays when slots.length changes
    useEffect(() => {
        setCurrentIndices((prev) => {
            const newIndices = slots.map((_, index) => (prev[index] !== undefined ? prev[index] : 0))
            return newIndices
        })
        setFlippingStates((prev) => {
            const newStates = slots.map((_, index) => (prev[index] !== undefined ? prev[index] : false))
            return newStates
        })
    }, [slots.length])

    useEffect(() => {
        if (isStatic || !isInView) return

        // Clear any existing timeouts
        timeoutIdsRef.current.forEach((id) => clearTimeout(id))
        timeoutIdsRef.current = []

        const interval = setInterval(() => {
            slots.forEach((slot, slotIndex) => {
                const timeoutId1 = setTimeout(() => {
                    startTransition(() => {
                        setFlippingStates((prev) => {
                            const newStates = [...prev]
                            newStates[slotIndex] = true
                            return newStates
                        })
                    })

                    const timeoutId2 = setTimeout(() => {
                        startTransition(() => {
                            setCurrentIndices((prev) => {
                                const newIndices = [...prev]
                                newIndices[slotIndex] = (newIndices[slotIndex] + 1) % slot.images.length
                                return newIndices
                            })
                            setFlippingStates((prev) => {
                                const newStates = [...prev]
                                newStates[slotIndex] = false
                                return newStates
                            })
                        })
                    }, flipDuration * 500)
                    
                    timeoutIdsRef.current.push(timeoutId2)
                }, slotIndex * flipDelay)
                
                timeoutIdsRef.current.push(timeoutId1)
            })
        }, flipInterval)

        return () => {
            clearInterval(interval)
            timeoutIdsRef.current.forEach((id) => clearTimeout(id))
            timeoutIdsRef.current = []
        }
    }, [slots, flipInterval, flipDelay, flipDuration, isStatic, isInView])

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {slots.map((slot, slotIndex) => {
                    const currentImage = slot.images[currentIndices[slotIndex]]
                    const isFlipping = flippingStates[slotIndex]

                    return (
                        <motion.div
                            key={slotIndex}
                            style={{
                                width: imageSize,
                                height: imageSize,
                                borderRadius: borderRadius,
                                overflow: "hidden",
                                outline: `${outlineWidth}px solid ${outlineColor}`,
                                position: "relative",
                                transformStyle: "preserve-3d",
                                marginLeft: slotIndex > 0 ? `${gap}px` : 0,
                            }}
                            animate={{
                                [flipDirection === "vertical" ? "rotateX" : "rotateY"]: isFlipping ? 180 : 0,
                            }}
                            transition={{
                                duration: flipDuration,
                                ease: "easeInOut",
                            }}
                        >
                            <img
                                src={currentImage?.src || ""}
                                alt={currentImage?.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    backfaceVisibility: "hidden",
                                }}
                            />
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(FlippingImages, {
    slots: {
        type: ControlType.Array,
        title: "Image Slots",
        control: {
            type: ControlType.Object,
            controls: {
                images: {
                    type: ControlType.Array,
                    title: "Images",
                    control: {
                        type: ControlType.ResponsiveImage,
                    },
                },
            },
        },
        defaultValue: [
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Image 1",
                    },
                    {
                        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                        alt: "Image 2",
                    },
                ],
            },
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                        alt: "Image 3",
                    },
                    {
                        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                        alt: "Image 4",
                    },
                ],
            },
            {
                images: [
                    {
                        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                        alt: "Image 5",
                    },
                    {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Image 6",
                    },
                ],
            },
        ],
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: -10,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 9999,
        min: 0,
        max: 9999,
        step: 1,
        unit: "px",
    },
    outlineColor: {
        type: ControlType.Color,
        title: "Outline Color",
        defaultValue: "#FFFFFF",
    },
    outlineWidth: {
        type: ControlType.Number,
        title: "Outline Width",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 1,
        unit: "px",
    },
    flipDuration: {
        type: ControlType.Number,
        title: "Flip Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    flipInterval: {
        type: ControlType.Number,
        title: "Flip Interval",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    flipDelay: {
        type: ControlType.Number,
        title: "Sequential Delay",
        defaultValue: 200,
        min: 0,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    flipDirection: {
        type: ControlType.Enum,
        title: "Flip Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
})