// Social media floating action button with expandable menu
import { motion, AnimatePresence } from "framer-motion"
import { useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SocialLink {
    name: string
    url: string
    icon: string
    color: string
    label: string
    showLabel: boolean
    useCustomIcon: boolean
    customIcon: string
}

interface SocialMenuProps {
    socialLinks: SocialLink[]
    // Main Button
    mainButtonColor: string
    mainButtonSize: number
    iconColor: string
    expandedIconColor: string
    useCustomMainIcon: boolean
    customMainIcon: string
    useCustomCloseIcon: boolean
    customCloseIcon: string
    // Social Buttons
    socialButtonSize: number
    // Animation
    animationDuration: number
    animationStagger: number
    // Layout
    arcStartAngle: number
    arcEndAngle: number
    arcRadius: number
    minAngleSpacing: number
    // Labels
    labelFont: any
    labelColor: string
    labelBackgroundColor: string
    labelPadding: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SocialMenu(props: SocialMenuProps) {
    const {
        socialLinks = [
            {
                name: "Behance",
                url: "https://behance.net",
                icon: "behance",
                color: "#1769FF",
                label: "Behance",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            },
            {
                name: "Dribbble",
                url: "https://dribbble.com",
                icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z",
                color: "#EA4C89",
                label: "Dribbble",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            },
            {
                name: "LinkedIn",
                url: "https://linkedin.com",
                icon: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
                color: "#0077B5",
                label: "LinkedIn",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            },
            {
                name: "GitHub",
                url: "https://github.com",
                icon: "M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z",
                color: "#333333",
                label: "GitHub",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            },
        ],
        mainButtonColor,
        mainButtonSize,
        socialButtonSize,
        iconColor,
        expandedIconColor,
        useCustomMainIcon,
        customMainIcon = "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        useCustomCloseIcon,
        customCloseIcon = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        animationDuration,
        animationStagger,
        arcStartAngle,
        arcEndAngle,
        arcRadius,
        minAngleSpacing = 20,
        labelFont,
        labelColor,
        labelBackgroundColor,
        labelPadding,
    } = props

    const [isExpanded, setIsExpanded] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const toggleExpanded = () => {
        startTransition(() => setIsExpanded(!isExpanded))
    }

    const handleSocialClick = (url: string) => {
        if (typeof window !== "undefined") {
            window.open(url, "_blank")
        }
    }

    // Define angles first before using them
    const startAngle = arcStartAngle
    const endAngle = arcEndAngle

    // Calculate dynamic radius based on number of links and minimum spacing
    const calculateDynamicRadius = () => {
        const numLinks = socialLinks.length
        if (numLinks <= 1) return arcRadius
        
        // Calculate the arc length needed for minimum spacing
        const totalArcAngle = endAngle - startAngle
        const requiredArcAngle = minAngleSpacing * (numLinks - 1)
        
        // If the required angle exceeds the available arc, increase radius
        if (requiredArcAngle > totalArcAngle) {
            // Calculate radius needed to maintain spacing with the given arc
            const scaleFactor = requiredArcAngle / totalArcAngle
            return arcRadius * scaleFactor
        }
        
        return arcRadius
    }

    const radius = calculateDynamicRadius()
    
    // Calculate angle step with minimum spacing constraint
    const totalArcAngle = endAngle - startAngle
    const idealAngleStep = socialLinks.length > 1 ? totalArcAngle / (socialLinks.length - 1) : 0
    const angleStep = Math.max(idealAngleStep, minAngleSpacing)
    
    // Adjust the actual arc span if minimum spacing is enforced
    const actualArcSpan = angleStep * (socialLinks.length - 1)
    const arcCenter = (startAngle + endAngle) / 2
    const adjustedStartAngle = arcCenter - actualArcSpan / 2
    
    const positions = socialLinks.map((_, index) => {
        const angle = (adjustedStartAngle + angleStep * index) * (Math.PI / 180)
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        }
    })

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.button
                onClick={toggleExpanded}
                style={{
                    width: mainButtonSize,
                    height: mainButtonSize,
                    borderRadius: "50%",
                    backgroundColor: mainButtonColor,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    overflow: "hidden",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={{ rotate: isExpanded ? 45 : 0 }}
                    transition={{ duration: animationDuration }}
                    style={{
                        width: "60%",
                        height: "60%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {isExpanded && useCustomCloseIcon ? (
                        <img
                            src={customCloseIcon}
                            alt="Close"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : !isExpanded && useCustomMainIcon ? (
                        <img
                            src={customMainIcon}
                            alt="Menu"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isExpanded ? expandedIconColor : iconColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    )}
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isExpanded &&
                    socialLinks.map((social, index) => (
                        <motion.div
                            key={social.name}
                            style={{
                                position: "absolute",
                                zIndex: hoveredIndex === index ? 20 : 5,
                            }}
                            initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                            animate={{
                                scale: 1,
                                x: positions[index].x,
                                y: positions[index].y,
                                opacity: 1,
                            }}
                            exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: index * animationStagger,
                                duration: animationDuration,
                            }}
                        >
                            <motion.button
                                onClick={() => handleSocialClick(social.url)}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{
                                    width: socialButtonSize,
                                    height: socialButtonSize,
                                    borderRadius: "50%",
                                    backgroundColor: social.color,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                    zIndex: hoveredIndex === index ? 20 : 5,
                                    overflow: "hidden",
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {social.useCustomIcon && social.customIcon ? (
                                    <img
                                        src={social.customIcon}
                                        alt={social.name}
                                        style={{
                                            width: "70%",
                                            height: "70%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : social.icon === "behance" ? (
                                    <div
                                        style={{
                                            color: "#FFFFFF",
                                            fontSize: socialButtonSize * 0.4,
                                            fontWeight: "bold",
                                            fontFamily: "Arial, sans-serif",
                                        }}
                                    >
                                        Bē
                                    </div>
                                ) : social.icon.startsWith("M") || social.icon.startsWith("m") ? (
                                    <svg
                                        width="60%"
                                        height="60%"
                                        viewBox="0 0 24 24"
                                        fill="#FFFFFF"
                                    >
                                        <path d={social.icon} />
                                    </svg>
                                ) : (
                                    <div
                                        style={{
                                            color: "#FFFFFF",
                                            fontSize: socialButtonSize * 0.35,
                                            fontWeight: "bold",
                                            fontFamily: "Arial, sans-serif",
                                        }}
                                    >
                                        {social.icon}
                                    </div>
                                )}
                            </motion.button>

                            {social.showLabel && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{
                                        opacity: hoveredIndex === index ? 1 : 0,
                                        scale: hoveredIndex === index ? 1 : 0.8,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        position: "absolute",
                                        left: socialButtonSize + 10,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        backgroundColor: labelBackgroundColor,
                                        color: labelColor,
                                        padding: `${labelPadding}px ${labelPadding * 1.5}px`,
                                        borderRadius: "6px",
                                        whiteSpace: "nowrap",
                                        pointerEvents: "none",
                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                                        zIndex: 21,
                                        ...labelFont,
                                    }}
                                >
                                    {social.label}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SocialMenu, {
    socialLinks: {
        type: ControlType.Array,
        title: "Social Links",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Instagram",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Instagram",
                },
                showLabel: {
                    type: ControlType.Boolean,
                    title: "Show Label",
                    defaultValue: true,
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "https://instagram.com",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#E4405F",
                },
                icon: {
                    type: ControlType.String,
                    title: "Icon (Text/SVG)",
                    defaultValue: "IG",
                    displayTextArea: true,
                },
                useCustomIcon: {
                    type: ControlType.Boolean,
                    title: "Custom Icon",
                    defaultValue: false,
                },
                customIcon: {
                    type: ControlType.File,
                    title: "Icon File",
                    allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
                },
            },
        },
        defaultValue: [
            {
                name: "Behance",
                url: "https://behance.net",
                icon: "behance",
                color: "#1769FF",
                label: "Behance",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            },
            {
                name: "Dribbble",
                url: "https://dribbble.com",
                icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z",
                color: "#EA4C89",
                label: "Dribbble",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            },
            {
                name: "LinkedIn",
                url: "https://linkedin.com",
                icon: "M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
                color: "#0077B5",
                label: "LinkedIn",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            },
            {
                name: "GitHub",
                url: "https://github.com",
                icon: "M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z",
                color: "#333333",
                label: "GitHub",
                showLabel: true,
                useCustomIcon: false,
                customIcon: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            },
        ],
        maxCount: 8,
    },
    // Main Button
    mainButtonColor: {
        type: ControlType.Color,
        title: "Main Button",
        defaultValue: "#000000",
    },
    useCustomMainIcon: {
        type: ControlType.Boolean,
        title: "Custom Plus Icon",
        defaultValue: false,
    },
    customMainIcon: {
        type: ControlType.File,
        title: "Plus Icon",
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        hidden: ({ useCustomMainIcon }) => !useCustomMainIcon,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Plus Icon",
        defaultValue: "#FFFFFF",
        hidden: ({ useCustomMainIcon }) => useCustomMainIcon,
    },
    useCustomCloseIcon: {
        type: ControlType.Boolean,
        title: "Custom Close Icon",
        defaultValue: false,
    },
    customCloseIcon: {
        type: ControlType.File,
        title: "Close Icon",
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        hidden: ({ useCustomCloseIcon }) => !useCustomCloseIcon,
    },
    expandedIconColor: {
        type: ControlType.Color,
        title: "Close Icon",
        defaultValue: "#FFFFFF",
        hidden: ({ useCustomCloseIcon }) => useCustomCloseIcon,
    },
    mainButtonSize: {
        type: ControlType.Number,
        title: "Main Size",
        defaultValue: 60,
        min: 40,
        max: 100,
        step: 5,
        unit: "px",
    },
    // Social Buttons
    socialButtonSize: {
        type: ControlType.Number,
        title: "Social Size",
        defaultValue: 50,
        min: 30,
        max: 80,
        step: 5,
        unit: "px",
    },
    // Animation
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        unit: "s",
    },
    animationStagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.05,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: "s",
    },
    // Layout
    arcStartAngle: {
        type: ControlType.Number,
        title: "Start Angle",
        defaultValue: -150,
        min: -180,
        max: 180,
        step: 5,
        unit: "°",
    },
    arcEndAngle: {
        type: ControlType.Number,
        title: "End Angle",
        defaultValue: -30,
        min: -180,
        max: 180,
        step: 5,
        unit: "°",
    },
    arcRadius: {
        type: ControlType.Number,
        title: "Arc Radius",
        defaultValue: 130,
        min: 80,
        max: 300,
        step: 10,
        unit: "px",
    },
    minAngleSpacing: {
        type: ControlType.Number,
        title: "Min Spacing",
        defaultValue: 20,
        min: 10,
        max: 45,
        step: 5,
        unit: "°",
    },
    // Labels
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#000000",
    },
    labelBackgroundColor: {
        type: ControlType.Color,
        title: "Label Background",
        defaultValue: "#FFFFFF",
    },
    labelPadding: {
        type: ControlType.Number,
        title: "Label Padding",
        defaultValue: 6,
        min: 2,
        max: 16,
        step: 1,
        unit: "px",
    },
})