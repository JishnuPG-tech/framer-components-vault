// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*
Instructions:
Create a Framer component that follows the Framer component rules and achieves the user's goal.
aie ta akta preloder hobay line ta full load howar por pura ta load hoya top a colay jabay and ar center a akta logo image thakbay
*/

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type Phase = "loading" | "exiting" | "done"

type Props = {
    logo: ResponsiveImage
    backgroundImage: ResponsiveImage
    useBackgroundImage: boolean

    backgroundColor: string
    overlayOpacity: number

    barColor: string
    barHeight: number

    duration: number
    exitDuration: number
    exitEase: "easeInOut" | "easeIn" | "easeOut" | "linear"

    logoWidth: number
    logoOpacity: number

    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SmoothRevealPreloader(props: Props) {
    const isStatic = useIsStaticRenderer()
    const {
        logo = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Logo",
        },
        backgroundImage = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Background",
        },
        useBackgroundImage = true,

        backgroundColor = "#000000",
        overlayOpacity = 0.55,

        barColor = "#FFFFFF",
        barHeight = 20,

        duration = 2.2,
        exitDuration = 0.7,
        exitEase = "easeInOut",

        logoWidth = 190,
        logoOpacity = 1,
    } = props

    const [phase, setPhase] = useState<Phase>(isStatic ? "loading" : "loading")
    const exitTimerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (exitTimerRef.current && typeof window !== "undefined") {
                window.clearTimeout(exitTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        if (phase !== "exiting") return
        if (typeof window === "undefined") return

        if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current)
        exitTimerRef.current = window.setTimeout(() => {
            startTransition(() => setPhase("done"))
        }, Math.max(0, exitDuration * 1000 + 50))
    }, [phase, exitDuration, isStatic])

    const easing = useMemo(() => {
        switch (exitEase) {
            case "easeIn":
                return [0.42, 0, 1, 1]
            case "easeOut":
                return [0, 0, 0.58, 1]
            case "linear":
                return [0, 0, 1, 1]
            case "easeInOut":
            default:
                return [0.42, 0, 0.58, 1]
        }
    }, [exitEase])

    if (phase === "done") return null

    const fixedLayerStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
    }

    const bgImageStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        opacity: 1,
    }

    const overlayStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: backgroundColor,
        opacity: Math.max(0, Math.min(1, overlayOpacity)),
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...props.style,
            }}
            aria-label="Preloader"
        >
            <motion.div
                style={fixedLayerStyle}
                initial={false}
                animate={
                    phase === "exiting"
                        ? { y: "-100%", opacity: 1 }
                        : { y: "0%", opacity: 1 }
                }
                transition={
                    phase === "exiting"
                        ? { duration: exitDuration, ease: easing as any }
                        : { duration: 0 }
                }
            >
                {useBackgroundImage ? (
                    <img
                        src={backgroundImage?.src}
                        srcSet={backgroundImage?.srcSet}
                        alt={backgroundImage?.alt ?? ""}
                        style={bgImageStyle}
                        crossOrigin="anonymous"
                    />
                ) : null}

                <div style={overlayStyle} />

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src={logo?.src}
                        srcSet={logo?.srcSet}
                        alt={logo?.alt ?? "Logo"}
                        style={{
                            width: logoWidth,
                            height: "auto",
                            maxWidth: "70%",
                            opacity: logoOpacity,
                            display: "block",
                        }}
                        crossOrigin="anonymous"
                    />
                </div>

                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: barHeight,
                        background: "transparent",
                    }}
                    aria-hidden="true"
                >
                    {isStatic ? (
                        <div
                            style={{
                                width: "72%",
                                height: "100%",
                                background: barColor,
                            }}
                        />
                    ) : (
                        <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                                duration: Math.max(0.05, duration),
                                ease: "easeInOut",
                            }}
                            onAnimationComplete={() => {
                                startTransition(() => setPhase("exiting"))
                            }}
                            style={{
                                height: "100%",
                                background: barColor,
                                willChange: "width",
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(SmoothRevealPreloader, {
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 190,
        min: 40,
        max: 600,
        step: 1,
        unit: "px",
    },
    logoOpacity: {
        type: ControlType.Number,
        title: "Logo Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },

    useBackgroundImage: {
        type: ControlType.Boolean,
        title: "BG Image",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background",
        hidden: (p) => !p.useBackgroundImage,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
    },

    barColor: {
        type: ControlType.Color,
        title: "Bar",
        defaultValue: "#FFFFFF",
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 20,
        min: 2,
        max: 60,
        step: 1,
        unit: "px",
    },

    duration: {
        type: ControlType.Number,
        title: "Load Time",
        defaultValue: 2.2,
        min: 0.1,
        max: 15,
        step: 0.1,
        unit: "s",
    },
    exitDuration: {
        type: ControlType.Number,
        title: "Exit Time",
        defaultValue: 0.7,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    exitEase: {
        type: ControlType.Enum,
        title: "Exit Ease",
        options: ["easeInOut", "easeIn", "easeOut", "linear"],
        optionTitles: ["Ease In Out", "Ease In", "Ease Out", "Linear"],
        defaultValue: "easeInOut",
        displaySegmentedControl: true,
    },
})