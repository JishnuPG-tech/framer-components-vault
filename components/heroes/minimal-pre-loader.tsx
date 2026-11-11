// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useAnimate } from "framer-motion"
import { useEffect, useState, type CSSProperties } from "react"

interface PreloaderProps {
    text: string
    font: any
    backgroundColor: string
    textColor: string
    showInCanvas: boolean
    animationSpeed: number
    images: any[]
    cardSize: number
    cardOffset: number
    imageInterval: number
}

/**
 * MINIMAL STUDIO PRELOADER
 *
 * A preloader component that reveals content with a cinematic sequence.
 * Wraps your main content and handles the initial load animation.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Preloader(props: PreloaderProps) {
    const {
        text,
        font,
        backgroundColor,
        textColor,
        showInCanvas,
        animationSpeed,
        images,
        cardSize,
        cardOffset,
        imageInterval = 0.15,
    } = props

    const [scope, animate] = useAnimate()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (!images || images.length === 0) return

        const intervalTime = imageInterval * 1000

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }, intervalTime)

        return () => clearInterval(interval)
    }, [images, imageInterval])

    useEffect(() => {
        // Skip animation in canvas unless enabled
        if (isCanvas && !showInCanvas) {
            animate(".preloader-overlay", { opacity: 0, display: "none" }, { duration: 0 })
            return
        }

        const playSequence = async () => {
            // Speed multiplier (1 = normal, 0.5 = half speed, 2 = double speed)
            // We invert it so higher number = faster
            const speed = 1 / animationSpeed

            // Initial States
            // We set these immediately to ensure no flash of content
            animate(".preloader-overlay", { opacity: 1, filter: "blur(0px)", display: "block" }, { duration: 0 })
            animate(".loader-text", { opacity: 0, filter: "blur(10px)" }, { duration: 0 })
            animate(".loader-card", { opacity: 0, filter: "blur(10px)" }, { duration: 0 })

            // Step 1: Fade Text In (Soft)
            await animate(
                ".loader-text, .loader-card",
                { opacity: 1, filter: "blur(0px)" },
                { duration: 1.5 * speed, ease: "easeOut", delay: 0.2 * speed }
            )

            // Step 2: Hold (Static moment)
            await new Promise((resolve) => setTimeout(resolve, 800 * speed))

            // Step 3: Fade Text Out
            await animate(
                ".loader-text, .loader-card",
                { opacity: 0, filter: "blur(10px)" },
                { duration: 0.5 * speed, ease: "easeIn" }
            )

            // Step 4: Blur Fade Out
            // Reveal content behind overlay
            await animate(
                ".preloader-overlay",
                { opacity: 0, filter: "blur(20px)" },
                { duration: 1.0 * speed, ease: "easeInOut" }
            )

            animate(".preloader-overlay", { display: "none" }, { duration: 0 })
        }

        playSequence()
    }, [isCanvas, showInCanvas, animationSpeed]) // Re-run if these change

    return (
        <div
            ref={scope}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden", // Prevent scrolling during animation
                pointerEvents: "none",
            }}
        >
            {/* Preloader Overlay */}
            <div
                className="preloader-overlay"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 60,
                    display: isCanvas && !showInCanvas ? "none" : "block",
                    pointerEvents: "auto",
                }}
            >
                {/* Background Layer */}
                <div
                    className="preloader-bg"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: backgroundColor,
                        width: "100%",
                        height: "100%",
                    }}
                />

                {/* Text Wrapper */}
                <div
                    className="preloader-text-wrap"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span
                        className="loader-text"
                        style={{
                            ...font,
                            color: textColor,
                            opacity: 0, // Initial state
                            filter: "blur(10px)",
                        }}
                    >
                        {text}
                    </span>
                </div>

                {/* Floating Preview Card */}
                {images && images.length > 0 && (
                    <div
                        className="loader-card"
                        style={{
                            position: "absolute",
                            bottom: cardOffset,
                            right: cardOffset,
                            width: cardSize,
                            height: cardSize,
                            zIndex: 75,
                            opacity: 0,
                            filter: "blur(10px)",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={images[currentImageIndex]?.src}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(Preloader, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "EMILIA KHOVANSKI — Creative Studio",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg" },
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg" },
        ],
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        defaultValue: 160,
        min: 50,
        max: 500,
    },
    cardOffset: {
        type: ControlType.Number,
        title: "Card Offset",
        defaultValue: 20,
        min: 0,
        max: 100,
    },
    imageInterval: {
        type: ControlType.Number,
        title: "Image Speed",
        defaultValue: 0.15,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
        displayStepper: true,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
    showInCanvas: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        enabledTitle: "Play",
        disabledTitle: "Hide",
        description: "Enable to see the animation in the canvas.",
    },
})