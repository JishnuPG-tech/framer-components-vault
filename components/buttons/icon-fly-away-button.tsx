// Button with flying icons on hover - customizable colors, icon size, and animation speeds
import { motion, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, startTransition, useRef } from "react"

interface FlyingIconsButtonProps {
    label: string
    buttonColor: string
    textColor: string
    hoverButtonColor: string
    hoverTextColor: string
    iconColor: string
    iconSize: number
    iconCount: number
    flySpeed: number
    fadeSpeed: number
    spreadDistance: number
    buttonFont: any
    useCustomIcon: boolean
    customIconSvg: string
    borderWidth: number
    borderColor: string
    borderStyle: "solid" | "dashed" | "dotted"
    borderRadius: number
    buttonPaddingTop: number
    buttonPaddingRight: number
    buttonPaddingBottom: number
    buttonPaddingLeft: number
    link: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function FlyingIconsButton(props: FlyingIconsButtonProps) {
    const {
        label = "Hover Me",
        buttonColor = "#000000",
        textColor = "#FFFFFF",
        hoverButtonColor = "#333333",
        hoverTextColor = "#FFFFFF",
        iconColor = "#000000",
        iconSize = 20,
        iconCount = 10,
        flySpeed = 1,
        fadeSpeed = 1,
        spreadDistance = 100,
        buttonFont,
        useCustomIcon = false,
        customIconSvg = "",
        borderWidth = 0,
        borderColor = "#000000",
        borderStyle = "solid",
        borderRadius = 8,
        buttonPaddingTop = 12,
        buttonPaddingRight = 24,
        buttonPaddingBottom = 12,
        buttonPaddingLeft = 24,
        link = "",
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [icons, setIcons] = useState<Array<{ id: number; startX: number; startY: number; angle: number; speed: number; rotation: number }>>([])
    const buttonRef = useRef<HTMLButtonElement>(null)
    const iconIdCounter = useRef(0)
    const lastSpawnPos = useRef<{ x: number; y: number } | null>(null)

    const handleMouseEnter = (e: React.MouseEvent) => {
        startTransition(() => setIsHovered(true))
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (buttonRef.current && isHovered) {
            const rect = buttonRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            
            // Check if we've moved at least 5px from last spawn position
            if (lastSpawnPos.current) {
                const dx = x - lastSpawnPos.current.x
                const dy = y - lastSpawnPos.current.y
                const distance = Math.sqrt(dx * dx + dy * dy)
                
                if (distance < 5) {
                    return // Don't spawn new icons yet
                }
            }
            
            // Update last spawn position
            lastSpawnPos.current = { x, y }
            
            // Create new icons at cursor position
            const newIcons = Array.from({ length: 1 }, () => ({
                id: iconIdCounter.current++,
                startX: x,
                startY: y,
                angle: (Math.random() - 0.5) * 60, // Random angle between -30 and 30 degrees
                speed: 0.8 + Math.random() * 0.4, // Random speed multiplier
                rotation: (Math.random() - 0.5) * 720, // Random rotation between -360 and 360 degrees
            }))
            
            startTransition(() => setIcons(prev => [...prev, ...newIcons]))
        }
    }

    const handleMouseLeave = () => {
        startTransition(() => {
            setIsHovered(false)
            setIcons([])
            lastSpawnPos.current = null
        })
    }

    const handleAnimationComplete = (id: number) => {
        startTransition(() => setIcons(prev => prev.filter(icon => icon.id !== id)))
    }

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                width: "max-content",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <button
                ref={buttonRef}
                style={{
                    position: "relative",
                    backgroundColor: isHovered ? hoverButtonColor : buttonColor,
                    color: isHovered ? hoverTextColor : textColor,
                    border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                    padding: `${buttonPaddingTop}px ${buttonPaddingRight}px ${buttonPaddingBottom}px ${buttonPaddingLeft}px`,
                    borderRadius: borderRadius,
                    cursor: "pointer",
                    overflow: "visible",
                    transition: "background-color 0.2s ease, color 0.2s ease",
                    ...buttonFont,
                }}
                onClick={() => {
                    if (link) {
                        window.open(link, "_blank")
                    }
                }}
            >
                {label}
            </button>

            {icons.map((icon) => {
                const radians = (icon.angle * Math.PI) / 180
                const distance = spreadDistance * 3
                const x = Math.cos(radians) * distance
                const y = Math.sin(radians) * distance

                return (
                    <motion.div
                        key={icon.id}
                        initial={{
                            x: icon.startX,
                            y: icon.startY,
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                        }}
                        animate={{
                            x: icon.startX + x,
                            y: icon.startY + y,
                            opacity: 0,
                            scale: 0.5,
                            rotate: icon.rotation,
                        }}
                        transition={{
                            duration: flySpeed * icon.speed,
                            ease: "linear",
                            opacity: {
                                duration: fadeSpeed * icon.speed,
                            },
                        }}
                        onAnimationComplete={() => handleAnimationComplete(icon.id)}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    >
                        {useCustomIcon && customIconSvg ? (
                            <img
                                src={customIconSvg}
                                width={iconSize}
                                height={iconSize}
                                alt="icon"
                            />
                        ) : (
                            <svg
                                width={iconSize}
                                height={iconSize}
                                viewBox="0 0 24 24"
                                fill={iconColor}
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
                            </svg>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(FlyingIconsButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Hover Me",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    useCustomIcon: {
        type: ControlType.Boolean,
        title: "Custom Icon",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Default",
    },
    customIconSvg: {
        type: ControlType.File,
        title: "Icon PNG",
        allowedFileTypes: ["png"],
        hidden: ({ useCustomIcon }) => !useCustomIcon,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#000000",
    },
    hoverButtonColor: {
        type: ControlType.Color,
        title: "Hover Button Color",
        defaultValue: "#333333",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#FFFFFF",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
    },
    buttonPaddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    buttonPaddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    buttonPaddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    buttonPaddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden: ({ borderWidth }) => borderWidth === 0,
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        defaultValue: "solid",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        displaySegmentedControl: true,
        hidden: ({ borderWidth }) => borderWidth === 0,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 20,
        min: 10,
        max: 100,
        step: 1,
        unit: "px",
    },
    iconCount: {
        type: ControlType.Number,
        title: "Icon Count",
        defaultValue: 10,
        min: 5,
        max: 20,
        step: 1,
    },
    flySpeed: {
        type: ControlType.Number,
        title: "Fly Speed",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    fadeSpeed: {
        type: ControlType.Number,
        title: "Fade Speed",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    spreadDistance: {
        type: ControlType.Number,
        title: "Spread Distance",
        defaultValue: 100,
        min: 50,
        max: 200,
        step: 10,
        unit: "px",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})