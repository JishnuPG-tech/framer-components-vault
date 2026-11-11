import { useEffect, useState, startTransition } from "react"
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

interface SiteLoaderProps {
    logo: { src: string; alt: string }
    backgroundColor: string
    logoSize: number
    loadingTime: number
    appearAnimation: "fade" | "scale" | "slideDown" | "bounce"
    style?: React.CSSProperties
}

/**
 * Site Loader with Logo
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SiteLoader(props: SiteLoaderProps) {
    const {
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        backgroundColor = "#000000",
        logoSize = 120,
        loadingTime = 2.5,
        appearAnimation = "fade",
        style,
    } = props

    const [loading, setLoading] = useState(() => {
        if (typeof window !== "undefined") {
            if (window.location.pathname === "/") {
                const shown = window.sessionStorage.getItem("site-loader-shown")
                return !shown
            }
            return false
        }
        return true
    })
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic || RenderTarget.current() === RenderTarget.thumbnail)
            return
        if (!loading) return

        const timer = setTimeout(() => {
            if (typeof window !== "undefined") {
                window.sessionStorage.setItem("site-loader-shown", "1")
            }
            startTransition(() => setLoading(false))
        }, loadingTime * 1000)

        return () => clearTimeout(timer)
    }, [loadingTime, isStatic, loading])

    const getAnimationVariants = () => {
        switch (appearAnimation) {
            case "fade":
                return {
                    initial: { opacity: 0, scale: 1 },
                    animate: { opacity: 1, scale: 1 },
                }
            case "scale":
                return {
                    initial: { opacity: 0, scale: 0.3 },
                    animate: { opacity: 1, scale: 1 },
                }
            case "slideDown":
                return {
                    initial: { opacity: 0, y: -50, scale: 1 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                }
            case "bounce":
                return {
                    initial: { opacity: 0, scale: 0.3, y: -20 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                }
            default:
                return {
                    initial: { opacity: 0, scale: 1 },
                    animate: { opacity: 1, scale: 1 },
                }
        }
    }

    const animationVariants = getAnimationVariants()

    if (RenderTarget.current() === RenderTarget.thumbnail) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...style,
                }}
            >
                <img
                    src={logo.src}
                    alt={logo.alt}
                    style={{
                        width: logoSize,
                        height: "auto",
                        objectFit: "contain",
                    }}
                />
            </div>
        )
    }

    return (
        <AnimatePresence
            mode="wait"
            onExitComplete={() => {
                // Ensure component is completely removed from DOM after animation
                const loaderElement = document.getElementById("site-loader")
                if (loaderElement) {
                    loaderElement.remove()
                }
            }}
        >
            {loading && (
                <motion.div
                    id="site-loader"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                        pointerEvents: loading ? "auto" : "none",
                        ...style,
                    }}
                >
                    <motion.img
                        src={logo.src}
                        alt={logo.alt}
                        initial={animationVariants.initial}
                        animate={animationVariants.animate}
                        transition={{
                            duration: appearAnimation === "bounce" ? 0.8 : 0.6,
                            ease:
                                appearAnimation === "bounce"
                                    ? "easeOut"
                                    : "easeOut",
                            type:
                                appearAnimation === "bounce"
                                    ? "spring"
                                    : "tween",
                            ...(appearAnimation === "bounce" && {
                                damping: 15,
                                stiffness: 300,
                            }),
                        }}
                        style={{
                            width: logoSize,
                            height: "auto",
                            objectFit: "contain",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}

addPropertyControls(SiteLoader, {
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 1,
        unit: "px",
    },
    loadingTime: {
        type: ControlType.Number,
        title: "Loading Time",
        defaultValue: 2.5,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    appearAnimation: {
        type: ControlType.Enum,
        title: "Appear Animation",
        options: ["fade", "scale", "slideDown", "bounce"],
        optionTitles: ["Fade In", "Scale Up", "Slide Down", "Bounce"],
        defaultValue: "fade",
    },
})
