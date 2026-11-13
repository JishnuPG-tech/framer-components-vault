import * as React from "react"
import { useState, useEffect } from "react"
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


export default function SmartFOMO(props) {
    const {
        notifications,
        position,
        showInterval,
        displayDuration,
        backgroundColor,
        textColor,
        accentColor,
        iconColor,
        borderRadius,
        padding,
        hasShadow,
        shadowColor,
        shadowY,
        shadowBlur,
        font,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // En el editor de Framer, siempre mostramos la primera notificación
        if (isCanvas) {
            setIsVisible(true)
            return
        }

        if (!notifications || notifications.length === 0) return

        let isMounted = true
        let timer

        // Secuencia estricta para evitar solapamiento de textos en la animación
        const runCycle = () => {
            if (!isMounted) return

            // 1. Mostrar la notificación actual
            setIsVisible(true)

            // 2. Esperar el tiempo de visualización y luego ocultar
            timer = setTimeout(() => {
                if (!isMounted) return
                setIsVisible(false)

                // 3. Esperar el intervalo (para que termine la animación de salida)
                // y justo antes de volver a mostrar, cambiamos al siguiente texto.
                timer = setTimeout(() => {
                    if (!isMounted) return
                    setCurrentIndex((prev) => (prev + 1) % notifications.length)
                    runCycle() // Volver a empezar el ciclo
                }, showInterval * 1000)
            }, displayDuration * 1000)
        }

        // Iniciar el primer ciclo después del tiempo de espera inicial
        timer = setTimeout(() => {
            runCycle()
        }, showInterval * 1000)

        return () => {
            isMounted = false
            clearTimeout(timer)
        }
    }, [isCanvas, notifications, showInterval, displayDuration])

    // Determinar la posición en pantalla
    const posStyles = {
        position: isCanvas ? "relative" : "fixed",
        bottom: isCanvas ? "auto" : "32px",
        left: position === "Bottom Left" && !isCanvas ? "32px" : "auto",
        right: position === "Bottom Right" && !isCanvas ? "32px" : "auto",
        zIndex: 9999,
        pointerEvents: "none",
    }

    const currentNotif = notifications[currentIndex] || {
        name: "John Doe",
        location: "Madrid, ES",
        action: "just bought",
        product: "Pro Plan",
        time: "just now",
    }

    const dynamicShadow = hasShadow
        ? `0 ${shadowY}px ${shadowBlur}px ${shadowColor}`
        : "none"

    return (
        <div
            style={{
                width: isCanvas ? "100%" : "auto",
                height: isCanvas ? "100%" : "auto",
                ...posStyles,
            }}
        >
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 40,
                            scale: 0.9,
                            filter: "blur(4px)",
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            filter: "blur(0px)",
                        }}
                        exit={{
                            opacity: 0,
                            y: 20,
                            scale: 0.95,
                            filter: "blur(4px)",
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            mass: 1,
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: `${padding}px`,
                            backgroundColor: backgroundColor,
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            borderRadius: borderRadius,
                            border: "1px solid rgba(255,255,255,0.08)",
                            boxShadow: dynamicShadow,
                            fontFamily:
                                font?.fontFamily ??
                                "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                            minWidth: "300px",
                            maxWidth: "400px",
                        }}
                    >
                        {/* Icono animado */}
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: accentColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                boxShadow: `0 4px 12px ${accentColor}66`,
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={iconColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>

                        {/* Textos */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: textColor,
                                    lineHeight: "1.3",
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>
                                    {currentNotif.name}
                                </span>{" "}
                                in {currentNotif.location}
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: textColor,
                                    opacity: 0.8,
                                    lineHeight: "1.3",
                                }}
                            >
                                {currentNotif.action}{" "}
                                <span style={{ fontWeight: 600 }}>
                                    {currentNotif.product}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: textColor,
                                    opacity: 0.5,
                                    marginTop: "4px",
                                    fontWeight: 500,
                                }}
                            >
                                {currentNotif.time}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SmartFOMO, {
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["Bottom Left", "Bottom Right"],
        defaultValue: "Bottom Left",
    },
    showInterval: {
        type: ControlType.Number,
        title: "Wait Time (s)",
        defaultValue: 5,
        min: 1,
        max: 60,
    },
    displayDuration: {
        type: ControlType.Number,
        title: "Display Time (s)",
        defaultValue: 4,
        min: 1,
        max: 20,
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
        },
    },
    hasShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "↳ Color",
        defaultValue: "rgba(0, 0, 0, 0.25)",
        hidden: (props) => !props.hasShadow,
    },
    shadowY: {
        type: ControlType.Number,
        title: "↳ Y Offset",
        defaultValue: 20,
        min: -50,
        max: 50,
        hidden: (props) => !props.hasShadow,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "↳ Blur",
        defaultValue: 40,
        min: 0,
        max: 100,
        hidden: (props) => !props.hasShadow,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(15, 15, 17, 0.85)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#34C759",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
    },
    notifications: {
        type: ControlType.Array,
        title: "Data List",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Alex D.",
                },
                location: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "Madrid, ES",
                },
                action: {
                    type: ControlType.String,
                    title: "Action",
                    defaultValue: "just purchased",
                },
                product: {
                    type: ControlType.String,
                    title: "Product",
                    defaultValue: "Pro Plan",
                },
                time: {
                    type: ControlType.String,
                    title: "Time Ago",
                    defaultValue: "2 mins ago",
                },
            },
        },
        defaultValue: [
            {
                name: "Alex M.",
                location: "Madrid, ES",
                action: "just subscribed to",
                product: "Pro Plan",
                time: "2 mins ago",
            },
            {
                name: "Sarah K.",
                location: "Berlin, DE",
                action: "downloaded the",
                product: "UI Kit",
                time: "15 mins ago",
            },
            {
                name: "David R.",
                location: "New York, US",
                action: "started a trial for",
                product: "Team Plan",
                time: "1 hour ago",
            },
        ],
    },
})
