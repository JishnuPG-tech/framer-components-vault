// Polaroid-style image gallery with scattered photo layout simulating physical polaroid prints
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import { useMemo, useState, startTransition, type CSSProperties } from "react"

interface Photo {
    image: {
        src: string
        alt: string
    }
    caption: string
    ctaText: string
    ctaLink: string
}

interface PolaroidGalleryProps {
    photos: Photo[]
    gap: number
    borderRadius: number
    backgroundColor: string
    showTexture: boolean
    textureType: "linen" | "paper" | "none"
    captionFont: CSSProperties
    captionColor: string
    style?: CSSProperties
}

/**
 * Polaroid Gallery
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PolaroidGallery(props: PolaroidGalleryProps) {
    const {
        photos = [],
        gap,
        borderRadius,
        backgroundColor,
        showTexture,
        textureType,
        captionFont,
        captionColor,
        style,
    } = props

    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)

    // Generate consistent random rotations and offsets for each photo
    const photoTransforms = useMemo(() => {
        return photos.map((_, index) => {
            // Use index-based seed for consistent randomness
            const seed = index * 2654435761
            const random = (seed % 1000) / 1000
            
            return {
                rotation: -10 + random * 20, // -10° to +10°
                yOffset: -20 + (seed % 40), // -20px to +20px
                zIndex: index,
            }
        })
    }, [photos.length])

    const handlePhotoClick = (index: number) => {
        startTransition(() => setSelectedPhoto(index))
    }

    const handleCloseViewer = () => {
        startTransition(() => setSelectedPhoto(null))
    }

    const texturePattern = useMemo(() => {
        if (!showTexture || textureType === "none") return "none"
        
        if (textureType === "linen") {
            return `repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.03) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 3px
            ),
            repeating-linear-gradient(
                90deg,
                rgba(0, 0, 0, 0.03) 0px,
                transparent 1px,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 3px
            )`
        }
        
        // paper grain
        return `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`
    }, [showTexture, textureType])

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    return (
        <>
            <div
                style={{
                    ...style,
                    position: "relative",
                    backgroundColor,
                    backgroundImage: texturePattern,
                    backgroundSize: textureType === "paper" ? "200px 200px" : "auto",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: `${gap}px`,
                    padding: "60px 40px",
                    overflow: "visible",
                    ...(isFixedWidth ? {} : { width: "max-content" }),
                    ...(isFixedHeight ? {} : { height: "max-content" }),
                }}
            >
                {photos.map((photo, index) => {
                    const transform = photoTransforms[index]
                    const photoImage = photo.image || {
                        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                        alt: "Photo",
                    }
                    
                    return (
                        <motion.div
                            key={index}
                            initial={{
                                y: -200,
                                rotate: transform.rotation * 2,
                                opacity: 0,
                            }}
                            animate={{
                                y: transform.yOffset,
                                rotate: transform.rotation,
                                opacity: 1,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 100,
                                damping: 15,
                                delay: index * 0.1,
                            }}
                            whileHover={{
                                rotate: transform.rotation * 0.3,
                                y: transform.yOffset - 10,
                                scale: 1.05,
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                },
                            }}
                            onClick={() => handlePhotoClick(index)}
                            style={{
                                position: "relative",
                                width: 240,
                                backgroundColor: "#FFFFFF",
                                borderRadius: `${borderRadius}px`,
                                padding: "16px 16px 20px 16px",
                                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                                cursor: "pointer",
                                zIndex: transform.zIndex,
                            }}
                        >
                            {/* Image container */}
                            <div
                                style={{
                                    width: "100%",
                                    height: 240,
                                    backgroundColor: "#F5F5F5",
                                    marginBottom: 12,
                                    overflow: "hidden",
                                    borderRadius: `${Math.max(0, borderRadius - 4)}px`,
                                }}
                            >
                                <img
                                    src={photoImage.src}
                                    alt={photoImage.alt}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>

                            {/* Caption */}
                            {photo.caption && (
                                <div
                                    style={{
                                        ...captionFont,
                                        color: captionColor,
                                        textAlign: "center",
                                        padding: "0 8px",
                                        minHeight: 24,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {photo.caption}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Full-screen viewer */}
            <AnimatePresence>
                {selectedPhoto !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleCloseViewer}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                            padding: 40,
                            cursor: "pointer",
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: "relative",
                                maxWidth: "90vw",
                                maxHeight: "90vh",
                                backgroundColor: "#FFFFFF",
                                borderRadius: `${borderRadius}px`,
                                padding: "24px 24px 32px 24px",
                                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                                cursor: "default",
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={handleCloseViewer}
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    width: 32,
                                    height: 32,
                                    border: "none",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    color: "#FFFFFF",
                                    fontSize: 20,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 1,
                                }}
                                aria-label="Close viewer"
                            >
                                ×
                            </button>

                            {/* Large image */}
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: 800,
                                    height: "auto",
                                    maxHeight: "calc(90vh - 120px)",
                                    backgroundColor: "#F5F5F5",
                                    marginBottom: 16,
                                    overflow: "hidden",
                                    borderRadius: `${Math.max(0, borderRadius - 4)}px`,
                                }}
                            >
                                <img
                                    src={
                                        photos[selectedPhoto]?.image?.src ||
                                        "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg"
                                    }
                                    alt={photos[selectedPhoto]?.image?.alt || "Photo"}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>

                            {/* Caption in viewer */}
                            {photos[selectedPhoto]?.caption && (
                                <div
                                    style={{
                                        ...captionFont,
                                        color: captionColor,
                                        textAlign: "center",
                                        padding: "0 16px",
                                        fontSize: "18px",
                                    }}
                                >
                                    {photos[selectedPhoto].caption}
                                </div>
                            )}

                            {/* CTA Link */}
                            {photos[selectedPhoto]?.ctaText && photos[selectedPhoto]?.ctaLink && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        marginTop: 12,
                                    }}
                                >
                                    <a
                                        href={photos[selectedPhoto].ctaLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            ...captionFont,
                                            color: captionColor,
                                            textDecoration: "underline",
                                            fontSize: "16px",
                                            cursor: "pointer",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {photos[selectedPhoto].ctaText}
                                    </a>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

addPropertyControls(PolaroidGallery, {
    photos: {
        type: ControlType.Array,
        title: "Photos",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Summer memories",
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    defaultValue: "View More",
                },
                ctaLink: {
                    type: ControlType.String,
                    title: "CTA Link",
                    defaultValue: "https://example.com",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Photo 1",
                },
                caption: "Summer vibes",
                ctaText: "View More",
                ctaLink: "https://example.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Photo 2",
                },
                caption: "Golden hour",
                ctaText: "View More",
                ctaLink: "https://example.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Photo 3",
                },
                caption: "Good times",
                ctaText: "View More",
                ctaLink: "https://example.com",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Photo 4",
                },
                caption: "Sweet memories",
                ctaText: "View More",
                ctaLink: "https://example.com",
            },
        ],
        maxCount: 8,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: -50,
        max: 100,
        step: 5,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    showTexture: {
        type: ControlType.Boolean,
        title: "Show Texture",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textureType: {
        type: ControlType.Enum,
        title: "Texture Type",
        options: ["linen", "paper", "none"],
        optionTitles: ["Linen", "Paper Grain", "None"],
        defaultValue: "paper",
        hidden: ({ showTexture }) => !showTexture,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0.02em",
            lineHeight: "1.4em",
        },
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#000000",
    },
})
