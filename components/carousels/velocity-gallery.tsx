// Scroll-based velocity image carousel with configurable rows and directions
import { useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useScroll,
    useSpring,
    useTransform,
    useMotionValue,
    useVelocity,
    useAnimationFrame,
} from "framer-motion"

interface ImageItem {
    src: string | { src: string; srcSet?: string; alt?: string }
    alt: string
    srcSet?: string
}

interface ScrollVelocityImagesProps {
    rowAImages: ImageItem[]
    rowBImages: ImageItem[]
    baseVelocity: number
    rowAVelocity: number
    rowBVelocity: number
    scrollSensitivity: number
    imageWidth: number
    imageHeight: number
    borderRadius: number
    gap: number
    rowGap: number
    showGradients: boolean
    gradientColor: string
    style?: CSSProperties
}

function wrap(min: number, max: number, v: number) {
    const rangeSize = max - min
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

interface ScrollVelocityRowProps {
    children: React.ReactNode
    baseVelocity: number
    direction: number
    scrollSensitivity: number
}

function ScrollVelocityRow({
    children,
    baseVelocity = 5,
    direction = 1,
    scrollSensitivity = 5,
}: ScrollVelocityRowProps) {
    const baseX = useMotionValue(0)

    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)

    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 400,
    })

    // Allow positive + negative scroll influence
    const velocityFactor = useTransform(
        smoothVelocity,
        [-1000, 1000],
        [-scrollSensitivity, scrollSensitivity],
        { clamp: false }
    )

    const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)

    const directionFactor = useRef(direction)

    useAnimationFrame((t, delta) => {
        const velocity = velocityFactor.get()

        // Base movement
        let moveBy = directionFactor.current * baseVelocity * (delta / 1000)

        // Scroll acceleration
        moveBy += directionFactor.current * velocity * (delta / 100)

        baseX.set(baseX.get() + moveBy)
    })

    return (
        <div
            style={{
                overflow: "hidden",
                whiteSpace: "nowrap",
                display: "flex",
            }}
        >
            <motion.div
                style={{ x, display: "flex", whiteSpace: "nowrap" }}
                drag="x"
                dragElastic={0.2}
                dragMomentum={false}
                onDrag={(event, info) => {
                    baseX.set(baseX.get() + info.delta.x / 10)
                }}
            >
                {children}
                {children}
            </motion.div>
        </div>
    )
}

/**
 * Scroll-based velocity image carousel
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollVelocityImages(props: ScrollVelocityImagesProps) {
    const {
        rowAImages = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
        ],
        rowBImages = [
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Image 5",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 6",
            },
        ],
        rowAVelocity = 6,
        rowBVelocity = 6,
        scrollSensitivity = 5,
        imageWidth = 240,
        imageHeight = 160,
        borderRadius = 8,
        gap = 16,
        rowGap = 16,
        showGradients = true,
        gradientColor = "#FFFFFF",
    } = props

    const [selectedImage, setSelectedImage] = useState<{
        src: string
        alt: string
    } | null>(null)

    const renderImages = (images: ImageItem[]) =>
        images.map((image, idx) => {
            const imgSrc =
                typeof image.src === "string" ? image.src : image.src?.src || ""

            const imgAlt = image.alt || `Image ${idx + 1}`

            return (
                <img
                    key={idx}
                    src={imgSrc}
                    alt={imgAlt}
                    width={imageWidth}
                    height={imageHeight}
                    loading="lazy"
                    decoding="async"
                    onClick={() => setSelectedImage({ src: imgSrc, alt: imgAlt })}
                    style={{
                        marginLeft: `${gap}px`,
                        marginRight: `${gap}px`,
                        display: "inline-block",
                        height: `${imageHeight}px`,
                        width: `${imageWidth}px`,
                        borderRadius: `${borderRadius}px`,
                        objectFit: "cover",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                        flexShrink: 0,
                        pointerEvents: "auto",
                        userSelect: "none",
                        cursor: "pointer",
                    }}
                />
            )
        })

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
                padding: "32px 0",
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: `${rowGap}px`,
                }}
            >
                {/* Row A (Right) */}
                <ScrollVelocityRow
                    baseVelocity={rowAVelocity}
                    direction={1}
                    scrollSensitivity={scrollSensitivity}
                >
                    {renderImages(rowAImages)}
                </ScrollVelocityRow>

                {/* Row B (Left) */}
                <ScrollVelocityRow
                    baseVelocity={rowBVelocity}
                    direction={-1}
                    scrollSensitivity={scrollSensitivity}
                >
                    {renderImages(rowBImages)}
                </ScrollVelocityRow>
            </div>

            {showGradients && (
                <>
                    <div
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            inset: "0 auto 0 0",
                            width: "25%",
                            background: `linear-gradient(to right, ${gradientColor}, transparent)`,
                        }}
                    />
                    <div
                        style={{
                            pointerEvents: "none",
                            position: "absolute",
                            inset: "0 0 0 auto",
                            width: "25%",
                            background: `linear-gradient(to left, ${gradientColor}, transparent)`,
                        }}
                    />
                </>
            )}

            {/* Image Popup Modal */}
            {selectedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        cursor: "pointer",
                        padding: "40px",
                    }}
                >
                    <motion.img
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                        }}
                        src={selectedImage.src}
                        alt={selectedImage.alt}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "90%",
                            maxHeight: "90%",
                            objectFit: "contain",
                            borderRadius: `${borderRadius * 2}px`,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                            cursor: "default",
                        }}
                    />
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(ScrollVelocityImages, {
    rowAImages: {
        type: ControlType.Array,
        title: "Row A Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "Image",
                },
            },
        },
    },

    rowBImages: {
        type: ControlType.Array,
        title: "Row B Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "Image",
                },
            },
        },
    },

    rowAVelocity: {
        type: ControlType.Number,
        title: "Row A Speed",
        defaultValue: 6,
        min: 1,
        max: 20,
    },

    rowBVelocity: {
        type: ControlType.Number,
        title: "Row B Speed",
        defaultValue: 6,
        min: 1,
        max: 20,
    },

    scrollSensitivity: {
        type: ControlType.Number,
        title: "Scroll Sensitivity",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 0.5,
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 240,
    },

    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 160,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
    },

    gap: {
        type: ControlType.Number,
        title: "Image Gap",
        defaultValue: 16,
    },

    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 16,
    },

    showGradients: {
        type: ControlType.Boolean,
        title: "Show Gradients",
        defaultValue: true,
    },

    gradientColor: {
        type: ControlType.Color,
        title: "Gradient Color",
        defaultValue: "#FFFFFF",
    },
})
