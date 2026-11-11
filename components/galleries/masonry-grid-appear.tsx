// Image grid that fills max width, 3 columns, height adjusts to images
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface MasonryGridProps {
    images: { src: { src: string }; alt?: string }[]
    gap: number
    outerPadding: number
    background: string
    imageRadius: number
    columns: number
    enableHover: boolean
    hoverScale: number
    hoverTransitionType: string
    customHoverTransition: string
    enableAppearEffect: boolean
    appearDelay: number
    appearOffsetY: number
    style?: CSSProperties
    lightboxSettings: {
        enable: boolean
        maxHeight: number
        maxWidth: number
        imageSizing: string
        imageRadius: number
        transition: string
        closeMode: string
        background: string
        enableBlur: boolean
        blurStrength: number
    }
}

/**
 * Masonry Grid (flexible columns, responsive height)
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MasonryGrid(props: MasonryGridProps) {
    const {
        images = [
            {
                src: {
                    src: "https://framerusercontent.com/images/kFm9504N2eX9Kz5G2u0w29k.png",
                },
                alt: "Placeholder 1",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/7xGzYyN6Z6V6X4S8Z5X3R8L.png",
                },
                alt: "Placeholder 2",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/wXn8404N2gX0Kz5G2u0w29k.png",
                },
                alt: "Placeholder 3",
            },
        ],
        gap = 16,
        outerPadding = 16,
        background = "rgba(255, 255, 255, 0)",
        imageRadius = 8,
        columns = 3,
        enableHover = true,
        hoverScale = 1.05,
        hoverTransitionType = "ease",
        customHoverTransition = "transform 0.4s linear",
        enableAppearEffect = true,
        appearDelay = 1,
        appearOffsetY = 20,
        lightboxSettings = {
            enable: false,
            maxHeight: 90,
            maxWidth: 80,
            imageSizing: "original",
            imageRadius: 0,
            transition: "ease",
            closeMode: "anywhere",
            background: "rgba(0, 0, 0, 0.9)",
            enableBlur: false,
            blurStrength: 5,
        },
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // --- STATE FÜR APPEAR EFFEKT ---
    const [randomDelays, setRandomDelays] = useState<number[]>([])

    // --- STATE FÜR LIGHTBOX ---
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentImage, setCurrentImage] = useState<string | null>(null)
    const [aspectRatio, setAspectRatio] = useState<number>(1)

    useEffect(() => {
        // Skip in static rendering or if effect is disabled
        if (isStatic || !enableAppearEffect || !images || images.length === 0) {
            setRandomDelays([])
            return
        }

        const count = images.length
        const indices = Array.from({ length: count }, (_, i) => i)

        // Fisher-Yates Algorithmus
        for (let i = count - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }

        const delayStep = appearDelay / count
        const delays = indices.map((randomIndex) => randomIndex * delayStep)

        setRandomDelays(delays)
    }, [images.length, appearDelay, enableAppearEffect, isStatic])

    const transitionPresets = {
        linear: "transform 0.4s linear",
        ease: "transform 0.4s ease",
        "ease-in": "transform 0.4s ease-in",
        "ease-out": "transform 0.4s ease-out",
        "ease-in-out": "transform 0.4s ease-in-out",
        spring: "transform 0.4s cubic-bezier(.25, .8, .25, 1)",
    }
    const hoverTransition =
        hoverTransitionType === "custom"
            ? customHoverTransition
            : transitionPresets[
                  hoverTransitionType as keyof typeof transitionPresets
              ] || transitionPresets["ease"]

    // Disable hover class in static rendering completely
    const hoverClass =
        enableHover && !isStatic ? { transition: hoverTransition } : {}

    const keyframeCSS = `
        @keyframes appear-in {
            0% { opacity: 0; transform: translateY(${appearOffsetY}px); }
            100% { opacity: 1; transform: translateY(0); }
        }
    `

    // --- LIGHTBOX HANDLER & UTILS ---
    const handleImageClick = (
        src: string,
        e: React.MouseEvent<HTMLImageElement>
    ) => {
        if (!lightboxSettings.enable) return
        const target = e.currentTarget

        // Exaktes Seitenverhältnis auslesen
        setAspectRatio(target.naturalWidth / (target.naturalHeight || 1))
        setCurrentImage(src)
        setLightboxOpen(true)
    }

    const getLightboxTransition = (type: string) => {
        switch (type) {
            case "linear":
                return { type: "tween", ease: "linear", duration: 0.3 }
            case "easeIn":
                return { type: "tween", ease: "easeIn", duration: 0.3 }
            case "easeOut":
                return { type: "tween", ease: "easeOut", duration: 0.3 }
            case "easeInOut":
                return { type: "tween", ease: "easeInOut", duration: 0.3 }
            case "spring":
                return { type: "spring", stiffness: 300, damping: 25 }
            case "ease":
            default:
                return { type: "tween", ease: "ease", duration: 0.3 }
        }
    }

    const customCursorSvg = encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.6)"/><line x1="30" y1="18" x2="18" y2="30" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="18" y1="18" x2="30" y2="30" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    )

    const sizingStyles: CSSProperties =
        lightboxSettings.imageSizing === "original"
            ? {
                  maxWidth: `${lightboxSettings.maxWidth}vw`,
                  maxHeight: `${lightboxSettings.maxHeight}vh`,
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
              }
            : {
                  maxWidth: `${lightboxSettings.maxWidth}vw`,
                  maxHeight: `${lightboxSettings.maxHeight}vh`,
                  width: "100vw",
                  height: "auto",
                  aspectRatio: `${aspectRatio}`,
                  objectFit: "contain",
              }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                background: background || undefined,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {enableAppearEffect && !isStatic && <style>{keyframeCSS}</style>}

            {/* Masonry Container */}
            <div
                style={{
                    columnCount: columns,
                    columnGap: gap,
                    padding: outerPadding,
                    marginBottom: -gap,
                }}
            >
                {images.map((img, i) => {
                    const src =
                        img?.src?.src ||
                        "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
                    const alt = (img?.src as any)?.alt || img?.alt || "Image"

                    let appearStyle: CSSProperties = {}

                    // Disable appear style if static rendering
                    if (
                        !isStatic &&
                        enableAppearEffect &&
                        randomDelays[i] !== undefined
                    ) {
                        const animationCSS = `appear-in 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${randomDelays[i]}s forwards`

                        appearStyle = {
                            opacity: 0,
                            transform: `translateY(${appearOffsetY}px)`,
                            animation: animationCSS,
                            WebkitAnimation: animationCSS,
                            willChange: "opacity, transform",
                        }
                    } else {
                        appearStyle = { opacity: 1, transform: "translateY(0)" }
                    }

                    return (
                        <div
                            key={i}
                            style={{
                                breakInside: "avoid",
                                width: "100%",
                                display: "block",
                                overflow: "hidden",
                                ...appearStyle,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    borderRadius: imageRadius,
                                    overflow: "hidden",
                                    display: "block",
                                    marginBottom: gap,
                                }}
                            >
                                <img
                                    src={src}
                                    alt={alt}
                                    style={{
                                        width: `calc(100% + 1px)`,
                                        height: "auto",
                                        objectFit: "cover",
                                        display: "block",
                                        verticalAlign: "top",
                                        cursor: lightboxSettings.enable
                                            ? "pointer"
                                            : "default",
                                        ...hoverClass,
                                        willChange:
                                            enableHover && !isStatic
                                                ? "transform"
                                                : undefined,
                                        transform: "scale(1)",
                                    }}
                                    onMouseEnter={
                                        enableHover && !isStatic
                                            ? (e) => {
                                                  e.currentTarget.style.transform = `scale(${hoverScale})`
                                              }
                                            : undefined
                                    }
                                    onMouseLeave={
                                        enableHover && !isStatic
                                            ? (e) => {
                                                  e.currentTarget.style.transform =
                                                      "scale(1)"
                                              }
                                            : undefined
                                    }
                                    onClick={(e) => handleImageClick(src, e)}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* LIGHTBOX OVERLAY */}
            <AnimatePresence>
                {lightboxSettings.enable && lightboxOpen && currentImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 99999,
                            background: lightboxSettings.background,
                            backdropFilter: lightboxSettings.enableBlur
                                ? `blur(${lightboxSettings.blurStrength}px)`
                                : "none",
                            WebkitBackdropFilter: lightboxSettings.enableBlur
                                ? `blur(${lightboxSettings.blurStrength}px)`
                                : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor:
                                lightboxSettings.closeMode === "cursor"
                                    ? `url('data:image/svg+xml;utf8,${customCursorSvg}') 24 24, auto`
                                    : lightboxSettings.closeMode === "anywhere"
                                      ? "pointer"
                                      : "default",
                        }}
                        onClick={() => {
                            if (
                                lightboxSettings.closeMode === "anywhere" ||
                                lightboxSettings.closeMode === "cursor"
                            ) {
                                setLightboxOpen(false)
                            }
                        }}
                    >
                        {lightboxSettings.closeMode === "topRight" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 32,
                                    right: 32,
                                    width: 48,
                                    height: 48,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(0,0,0,0.6)",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    color: "white",
                                    zIndex: 10,
                                }}
                                onClick={() => setLightboxOpen(false)}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                        )}

                        <motion.img
                            src={currentImage}
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={getLightboxTransition(
                                lightboxSettings.transition
                            )}
                            style={{
                                ...sizingStyles,
                                borderRadius: lightboxSettings.imageRadius,
                                overflow: "hidden",
                                cursor:
                                    lightboxSettings.closeMode === "topRight"
                                        ? "default"
                                        : undefined,
                            }}
                            onClick={(e) => {
                                if (lightboxSettings.closeMode === "topRight") {
                                    e.stopPropagation()
                                }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

MasonryGrid.displayName = "Masonry Grid"

addPropertyControls(MasonryGrid, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage },
            },
        },
        defaultValue: [
            {
                src: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                },
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                },
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                },
            },
        ],
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 5,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    outerPadding: {
        type: ControlType.Number,
        title: "Outer Padding",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255, 255, 255, 0)",
        optional: true,
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.5,
        step: 0.01,
        displayStepper: true,
        hidden: ({ enableHover }) => !enableHover,
    },
    hoverTransitionType: {
        type: ControlType.Enum,
        title: "Hover Transition",
        options: [
            "linear",
            "ease",
            "ease-in",
            "ease-out",
            "ease-in-out",
            "spring",
            "custom",
        ],
        optionTitles: [
            "Linear",
            "Ease",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Spring",
            "Custom",
        ],
        defaultValue: "ease",
        hidden: ({ enableHover }) => !enableHover,
    },
    customHoverTransition: {
        type: ControlType.String,
        title: "Custom Transition",
        defaultValue: "transform 0.4s linear",
        placeholder: "e.g. transform 0.4s cubic-bezier(...)",
        hidden: ({ hoverTransitionType }) => hoverTransitionType !== "custom",
    },
    enableAppearEffect: {
        type: ControlType.Boolean,
        title: "Appear Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    appearDelay: {
        type: ControlType.Number,
        title: "Total Duration",
        defaultValue: 1,
        min: 0.2,
        max: 5,
        step: 0.1,
        unit: "s",
        displayStepper: true,
        hidden: ({ enableAppearEffect }) => !enableAppearEffect,
    },
    appearOffsetY: {
        type: ControlType.Number,
        title: "Y Offset",
        defaultValue: 20,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: ({ enableAppearEffect }) => !enableAppearEffect,
    },
    // --- LIGHTBOX SETTINGS ---
    lightboxSettings: {
        type: ControlType.Object,
        title: "Lightbox",
        controls: {
            enable: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
            },
            maxHeight: {
                type: ControlType.Number,
                title: "Max Height",
                defaultValue: 90,
                min: 10,
                max: 100,
                unit: "%",
                displayStepper: true,
                hidden: (val) => !val?.enable,
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 80,
                min: 10,
                max: 100,
                unit: "%",
                displayStepper: true,
                hidden: (val) => !val?.enable,
            },
            imageSizing: {
                type: ControlType.Enum,
                title: "Sizing Mode",
                options: ["force", "original"],
                optionTitles: ["Force Size (Upscale)", "Original Size (Max)"],
                defaultValue: "original",
                hidden: (val) => !val?.enable,
            },
            imageRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 0,
                min: 0,
                max: 100,
                unit: "px",
                displayStepper: true,
                hidden: (val) => !val?.enable,
            },
            transition: {
                type: ControlType.Enum,
                title: "Transition",
                options: [
                    "linear",
                    "ease",
                    "easeIn",
                    "easeOut",
                    "easeInOut",
                    "spring",
                ],
                optionTitles: [
                    "Linear",
                    "Ease",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Spring",
                ],
                defaultValue: "ease",
                hidden: (val) => !val?.enable,
            },
            closeMode: {
                type: ControlType.Enum,
                title: "Close Mode",
                options: ["anywhere", "topRight", "cursor"],
                optionTitles: [
                    "Click Anywhere",
                    "Button Top Right",
                    "Button Cursor",
                ],
                defaultValue: "anywhere",
                hidden: (val) => !val?.enable,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0.9)",
                hidden: (val) => !val?.enable,
            },
            enableBlur: {
                type: ControlType.Boolean,
                title: "Blur Backgr.",
                defaultValue: false,
                hidden: (val) => !val?.enable,
            },
            blurStrength: {
                type: ControlType.Number,
                title: "Blur Strength",
                defaultValue: 5,
                min: 0,
                max: 50,
                displayStepper: true,
                hidden: (val) => !val?.enable || !val?.enableBlur,
            },
        },
    },
})

MasonryGrid.displayName = "Masonry Grid Appear"
