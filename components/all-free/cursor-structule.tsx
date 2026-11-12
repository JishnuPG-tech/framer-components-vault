import { useState, useEffect } from "react"
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


interface CustomCursorProps {
    showLines: boolean
    defaultColor: string
    hoverColor: string
    defaultDotSize: number
    hoverDotSize: number
}

export default function CursorStructule(props: CustomCursorProps) {
    const {
        showLines = true,
        defaultColor = "#B3B3B6",
        hoverColor = "#7C1FFF",
        defaultDotSize = 9,
        hoverDotSize = 13,
    } = props

    const isStatic = useIsStaticRenderer()

    // Domyślnie ustawiamy pozycję na środku ekranu i widoczność na true,
    // aby bot i podgląd iFrame od razu widziały kursor bez ruchu myszką.
    const [mousePosition, setMousePosition] = useState({
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 200,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 200,
    })
    const [isHovered, setIsHovered] = useState(false)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
            if (!isVisible) setIsVisible(true)
        }

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            if (!target) return

            const computedStyle = window.getComputedStyle(target)
            const isInteractive =
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.onclick !== null ||
                computedStyle.cursor === "pointer" ||
                target.closest(
                    "a, button, [role='button'], [data-framer-name]"
                ) !== null ||
                target.getAttribute("data-framer-interactive") === "true"

            setIsHovered(isInteractive)
        }

        const handleMouseLeave = () => {
            setIsVisible(false)
        }

        const handleMouseEnter = () => {
            setIsVisible(true)
        }

        window.addEventListener("mousemove", updateMousePosition, {
            passive: true,
        })
        window.addEventListener("mouseover", handleMouseOver, { passive: true })
        document.addEventListener("mouseleave", handleMouseLeave)
        document.addEventListener("mouseenter", handleMouseEnter)

        return () => {
            window.removeEventListener("mousemove", updateMousePosition)
            window.removeEventListener("mouseover", handleMouseOver)
            document.removeEventListener("mouseleave", handleMouseLeave)
            document.removeEventListener("mouseenter", handleMouseEnter)
        }
    }, [isVisible, isStatic])

    // Statyczny podgląd dla Canvas / SSG
    if (isStatic || typeof window === "undefined") {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: "150px",
                    minHeight: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {showLines && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: "50%",
                                width: "0.5px",
                                backgroundColor: defaultColor,
                                opacity: 0.5,
                                transform: "translateX(-0.25px)",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                height: "0.5px",
                                backgroundColor: defaultColor,
                                opacity: 0.5,
                                transform: "translateY(-0.25px)",
                            }}
                        />
                    </>
                )}
                <div
                    style={{
                        width: `${defaultDotSize}px`,
                        height: `${defaultDotSize}px`,
                        backgroundColor: defaultColor,
                        borderRadius: "50%",
                        zIndex: 2,
                    }}
                />
            </div>
        )
    }

    if (!isVisible) return null

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 999999,
                overflow: "hidden",
            }}
        >
            {/* Linia pionowa */}
            {showLines && (
                <motion.div
                    animate={{ opacity: isHovered ? 1 : 0.3 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${mousePosition.x}px`,
                        width: "0.5px",
                        backgroundColor: defaultColor,
                        transform: "translateX(-0.25px)",
                    }}
                />
            )}

            {/* Linia pozioma */}
            {showLines && (
                <motion.div
                    animate={{ opacity: isHovered ? 1 : 0.3 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: `${mousePosition.y}px`,
                        height: "0.5px",
                        backgroundColor: defaultColor,
                        transform: "translateY(-0.25px)",
                    }}
                />
            )}

            {/* Gradienty Hover */}
            {showLines && (
                <>
                    <motion.div
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                            width: "0.5px",
                            height: "100px",
                            background: `linear-gradient(to bottom, transparent 0%, ${hoverColor} 50%, transparent 100%)`,
                            transform: "translate(-0.25px, -50%)",
                        }}
                    />
                    <motion.div
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            left: `${mousePosition.x}px`,
                            top: `${mousePosition.y}px`,
                            width: "100px",
                            height: "0.5px",
                            background: `linear-gradient(to right, transparent 0%, ${hoverColor} 50%, transparent 100%)`,
                            transform: "translate(-50%, -0.25px)",
                        }}
                    />
                </>
            )}

            {/* Środkowa kropka */}
            <motion.div
                animate={{
                    width: isHovered ? hoverDotSize : defaultDotSize,
                    height: isHovered ? hoverDotSize : defaultDotSize,
                    backgroundColor: isHovered ? hoverColor : defaultColor,
                }}
                transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 28,
                }}
                style={{
                    position: "absolute",
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    opacity: 1,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                }}
            />

            {/* Zewnętrzny pierścień */}
            <motion.div
                animate={{
                    width: isHovered ? hoverDotSize + 12 : 0,
                    height: isHovered ? hoverDotSize + 12 : 0,
                    opacity: isHovered ? 1 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                }}
                style={{
                    position: "absolute",
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    border: `0.5px solid ${hoverColor}`,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    boxSizing: "border-box",
                }}
            />
        </div>
    )
}

addPropertyControls(CursorStructule, {
    showLines: {
        type: ControlType.Boolean,
        title: "Show Lines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    defaultColor: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#B3B3B6",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#7C1FFF",
    },
    defaultDotSize: {
        type: ControlType.Number,
        title: "Dot Default Size",
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    hoverDotSize: {
        type: ControlType.Number,
        title: "Dot Hover Size",
        defaultValue: 13,
        min: 2,
        max: 80,
        step: 1,
        displayStepper: true,
    },
})
