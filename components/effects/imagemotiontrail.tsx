import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

/**
 *
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 1000
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageMotionTrail({
    images,
    effectType,
    speed,
    trailDistance,
    lingerTime,
    maxImages,
    style,
}) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
    const [trailImages, setTrailImages] = useState([])
    const imageIndex = useRef(0)
    const lastImageTime = useRef(Date.now())

    const lerp = (a, b, n) => (1 - n) * a + n * b

    useEffect(() => {
        if (images.length < 3) return

        const handleMouseMove = (e) => {
            const newMousePos = { x: e.clientX, y: e.clientY }

            if (effectType === "Magnetic") {
                setMousePos((prev) => ({
                    x: lerp(prev.x, newMousePos.x, 0.15),
                    y: lerp(prev.y, newMousePos.y, 0.15),
                }))
            } else {
                setMousePos((prev) => ({
                    x: lerp(prev.x, newMousePos.x, 0.1),
                    y: lerp(prev.y, newMousePos.y, 0.1),
                }))
            }

            const spacingThreshold =
                effectType === "Classic" ||
                effectType === "Fade Scale" ||
                effectType === "Scale Pop" ||
                effectType === "Spin Trail" ||
                effectType === "Blur Trail" ||
                effectType === "Ghost Trail"
                    ? trailDistance * 0.3
                    : trailDistance * 0.5

            if (Date.now() - lastImageTime.current > speed * 100) {
                createTrailImage(newMousePos.x, newMousePos.y, spacingThreshold)
                setLastMousePos(newMousePos)
                lastImageTime.current = Date.now()
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [images, effectType])

    const createTrailImage = (x, y, spacing) => {
        if (images.length === 0) return

        imageIndex.current = (imageIndex.current + 1) % images.length
        let newX = x
        let newY = y

        if (effectType === "Randomized") {
            newX += (Math.random() - 0.5) * 200
            newY += (Math.random() - 0.5) * 200
        }

        const deltaX = x - lastMousePos.x
        const rotation =
            effectType === "Spin Trail" ? (deltaX > 0 ? 90 : -90) : 0

        const newImage = {
            id: Date.now(),
            src: images[imageIndex.current],
            x: newX,
            y: newY,
            rotation,
        }

        setTrailImages((prev) => {
            let updatedImages = [...prev, newImage]
            if (updatedImages.length > maxImages) {
                updatedImages = updatedImages.slice(
                    updatedImages.length - maxImages
                )
            }
            return updatedImages
        })

        setTimeout(
            () => {
                setTrailImages((prev) =>
                    prev.length > 0 ? prev.slice(1) : prev
                )
            },
            Math.max(speed * 900 + lingerTime * 800, 700)
        )
    }

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
            }}
        >
            <AnimatePresence>
                {trailImages.map((image, index) => (
                    <motion.img
                        key={image.id}
                        src={image.src}
                        style={{
                            position: "absolute",
                            width: `${style.width}px`,
                            height: `${style.height}px`,
                            borderRadius: `${style.radius}px`,
                            objectFit: style.type,
                            pointerEvents: "none",
                        }}
                        initial={{
                            opacity: effectType === "Ghost Trail" ? 0.2 : 0, // 👻 **Ghost Effect: Starts Low Opacity**
                            scale: effectType === "Scale Pop" ? 0 : 1.3,
                            rotate:
                                effectType === "Spin Trail"
                                    ? image.rotation
                                    : 0,
                            filter:
                                effectType === "Blur Trail"
                                    ? "blur(10px)"
                                    : effectType === "Ghost Trail"
                                      ? "brightness(200%) blur(5px)" // 👻 **Ghost Effect: Bright Glow**
                                      : "none",
                            x: image.x - style.width / 2,
                            y: image.y - style.height / 2,
                        }}
                        animate={{
                            opacity: 1,
                            scale:
                                effectType === "Fade Scale"
                                    ? 1.1
                                    : effectType === "Scale Pop" ||
                                        effectType === "Spin Trail" ||
                                        effectType === "Blur Trail" ||
                                        effectType === "Ghost Trail"
                                      ? 1
                                      : 1,
                            rotate:
                                effectType === "Spin Trail"
                                    ? 0
                                    : image.rotation,
                            filter:
                                effectType === "Blur Trail"
                                    ? "blur(3px)"
                                    : effectType === "Ghost Trail"
                                      ? "brightness(100%) blur(0px)" // 👻 **Ghost Effect: Removes Glow**
                                      : "none",
                            x:
                                effectType === "Magnetic"
                                    ? mousePos.x - style.width / 2
                                    : lerp(
                                          image.x - style.width / 2,
                                          mousePos.x - style.width / 2,
                                          0.15
                                      ),
                            y:
                                effectType === "Magnetic"
                                    ? mousePos.y - style.height / 2
                                    : lerp(
                                          image.y - style.height / 2,
                                          mousePos.y - style.height / 2,
                                          0.15
                                      ),
                            transition: {
                                duration: 0.5,
                                ease: "easeOut",
                            },
                        }}
                        exit={{
                            opacity: 0,
                            scale:
                                effectType === "Fade Scale" ||
                                effectType === "Spin Trail" ||
                                effectType === "Blur Trail" ||
                                effectType === "Ghost Trail"
                                    ? 1.4
                                    : effectType === "Scale Pop"
                                      ? 0
                                      : 0.7,
                            rotate:
                                effectType === "Spin Trail"
                                    ? image.rotation * 1.5
                                    : 0,
                            filter:
                                effectType === "Blur Trail"
                                    ? "blur(15px)"
                                    : effectType === "Ghost Trail"
                                      ? "brightness(200%) blur(10px)" // 👻 **Ghost Effect: Glow Again Before Fading**
                                      : "none",
                            transition: {
                                duration: 0.4,
                                delay: index * 0.08,
                            },
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}

// **🔥 PERFECTLY GROUPED PROPERTY CONTROLS**
addPropertyControls(ImageMotionTrail, {
    effectType: {
        type: ControlType.Enum,
        title: "Effect",
        options: [
            "Classic",
            "Magnetic",
            "Randomized",
            "Fade Scale",
            "Scale Pop",
            "Spin Trail",
            "Blur Trail",
            "Ghost Trail",
        ],
        optionTitles: [
            "Classic Trail",
            "Magnetic Effect",
            "Randomized Trail",
            "Fade Scale",
            "Scale Pop",
            "Spin Trail",
            "Blur Trail",
            "Ghost Trail",
        ],
        defaultValue: "Classic",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        propertyControl: {
            type: ControlType.Image,
        },
        defaultValue: [],
        description: "Select at least 3 images for the animation to trigger.",
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 50,
                max: 300,
                step: 5,
                defaultValue: 160,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 50,
                max: 300,
                step: 5,
                defaultValue: 160,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                step: 5,
                defaultValue: 0,
            },
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["cover", "contain", "fill"],
                defaultValue: "cover",
            },
        },
    },
    trailDistance: {
        type: ControlType.Number,
        title: "Frequency",
        min: 20,
        max: 200,
        step: 5,
        defaultValue: 35, // 🔹 Updated value
        description:
            "Controls how often new images appear as the cursor moves.",
    },
    speed: {
        type: ControlType.Number,
        title: "Visible For",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1, // 🔹 Updated value
        description:
            "Determines how long the images stay visible before they fade out.",
    },
    lingerTime: {
        type: ControlType.Number,
        title: "Linger Time",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.2, // 🔹 Matches the settings from the first screenshot
        description:
            "Sets how long an image remains on screen before disappearing.",
    },
    maxImages: {
        type: ControlType.Number,
        title: "Max Images",
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 20, // 🔹 Matches the settings from the first screenshot
        description:
            "Limits the number of images displayed in the trail at a time \n \n  Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harshworks.framer.website)",
    },
})
