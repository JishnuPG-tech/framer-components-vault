// macOS-style dock with magnification effect, frosted glass background, and smooth animations
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion"
import { useEffect, useRef, useState, startTransition } from "react"

interface DockItem {
    icon: { src: string; srcSet?: string; alt?: string } | string
    label: string
    link: string
    target: string
    linkType: "scroll" | "navigate" | "newTab"
}

interface MacDockProps {
    items: DockItem[]
    theme: "light" | "dark" | "auto"
    dockBlur: number
    iconSize: number
    iconGap: number
    magnification: number
    magnificationRange: number
    padding: number
    borderRadius: number
    enableBounce: boolean
    bounceDelay: number
    labelFont: any
    lightBgColor: string
    darkBgColor: string
    lightBorderColor: string
    darkBorderColor: string
    lightLabelBg: string
    darkLabelBg: string
    labelTextColor: string
    responsiveScale: boolean
}

/**
 * macOS Dock Component
 * 
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MacDock(props: MacDockProps) {
    const {
        items = [
            { icon: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Finder" }, label: "Finder", target: "#finder", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Launchpad" }, label: "Launchpad", target: "#launchpad", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Mail" }, label: "Mail", target: "#mail", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Calendar" }, label: "Calendar", target: "#calendar", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Music" }, label: "Music", target: "#music", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Settings" }, label: "Settings", target: "#settings", linkType: "scroll" }
        ],
        theme = "light",
        dockBlur = 20,
        iconSize = 48,
        iconGap = 8,
        magnification = 1.5,
        magnificationRange = 150,
        padding = 8,
        borderRadius = 16,
        enableBounce = true,
        bounceDelay = 100,
        labelFont,
        lightBgColor = "rgba(255, 255, 255, 0.3)",
        darkBgColor = "rgba(30, 30, 30, 0.7)",
        lightBorderColor = "rgba(255, 255, 255, 0.2)",
        darkBorderColor = "rgba(255, 255, 255, 0.1)",
        lightLabelBg = "rgba(0, 0, 0, 0.75)",
        darkLabelBg = "rgba(60, 60, 60, 0.9)",
        labelTextColor = "#ffffff",
        responsiveScale = true
    } = props

    const mouseX = useMotionValue(Infinity)
    const [hasAnimated, setHasAnimated] = useState(false)
    const [isDark, setIsDark] = useState(theme === "dark")
    const [isMobile, setIsMobile] = useState(false)
    const [scale, setScale] = useState(1)

    // Detect system theme preference
    useEffect(() => {
        if (theme === "auto" && typeof window !== "undefined") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
            startTransition(() => setIsDark(mediaQuery.matches))
            
            const handler = (e: MediaQueryListEvent) => {
                startTransition(() => setIsDark(e.matches))
            }
            
            mediaQuery.addEventListener("change", handler)
            return () => mediaQuery.removeEventListener("change", handler)
        } else {
            startTransition(() => setIsDark(theme === "dark"))
        }
    }, [theme])

    // Detect mobile and viewport size
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            const tablet = window.innerWidth < 1024
            startTransition(() => {
                setIsMobile(mobile)
                if (responsiveScale) {
                    if (mobile) {
                        setScale(0.7)
                    } else if (tablet) {
                        setScale(0.85)
                    } else {
                        setScale(1)
                    }
                } else {
                    setScale(1)
                }
            })
        }
        
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [responsiveScale])

    useEffect(() => {
        if (enableBounce && !hasAnimated) {
            startTransition(() => setHasAnimated(true))
        }
    }, [enableBounce, hasAnimated])

    const handleClick = (target: string, linkType: "scroll" | "navigate" | "newTab") => {
        if (typeof window === "undefined") return
        
        switch (linkType) {
            case "scroll":
                // Smooth scroll to anchor
                if (target.startsWith("#")) {
                    const element = document.querySelector(target)
                    if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                }
                break
            case "navigate":
                // Navigate in same tab
                window.location.href = target
                break
            case "newTab":
                // Open in new tab
                window.open(target, "_blank", "noopener,noreferrer")
                break
        }
    }

    const dockBackground = isDark 
        ? darkBgColor 
        : lightBgColor
    
    const borderColor = isDark
        ? darkBorderColor
        : lightBorderColor

    const scaledIconSize = iconSize * scale
    const scaledIconGap = iconGap * scale
    const scaledPadding = padding * scale
    const scaledBorderRadius = borderRadius * scale
    const scaledMagnificationRange = magnificationRange * scale

    return (
        <motion.div
            onMouseMove={(e) => !isMobile && mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            onTouchStart={() => mouseX.set(Infinity)}
            style={{
                display: "inline-flex",
                gap: scaledIconGap,
                padding: scaledPadding,
                background: dockBackground,
                backdropFilter: `blur(${dockBlur}px)`,
                WebkitBackdropFilter: `blur(${dockBlur}px)`,
                borderRadius: scaledBorderRadius,
                boxShadow: isDark 
                    ? "0 4px 30px rgba(0, 0, 0, 0.5)" 
                    : "0 4px 30px rgba(0, 0, 0, 0.1)",
                border: `1px solid ${borderColor}`,
                position: "relative",
                flexWrap: isMobile ? "wrap" : "nowrap",
                justifyContent: "center",
                maxWidth: isMobile ? "100%" : "none",
            }}
        >
            {items.map((item, i) => (
                <DockIcon
                    key={i}
                    mouseX={mouseX}
                    icon={item.icon}
                    label={item.label}
                    target={item.link || item.target}
                    linkType={item.linkType || "scroll"}
                    iconSize={scaledIconSize}
                    magnification={isMobile ? 1 : magnification}
                    magnificationRange={scaledMagnificationRange}
                    enableBounce={enableBounce && !hasAnimated}
                    bounceDelay={bounceDelay * i}
                    onClick={handleClick}
                    isDark={isDark}
                    labelFont={labelFont}
                    lightLabelBg={lightLabelBg}
                    darkLabelBg={darkLabelBg}
                    labelTextColor={labelTextColor}
                    isMobile={isMobile}
                />
            ))}
        </motion.div>
    )
}

interface DockIconProps {
    mouseX: any
    icon: { src: string; srcSet?: string; alt?: string } | string
    label: string
    target: string
    linkType: "scroll" | "navigate" | "newTab"
    iconSize: number
    magnification: number
    magnificationRange: number
    enableBounce: boolean
    bounceDelay: number
    onClick: (target: string, linkType: "scroll" | "navigate" | "newTab") => void
    isDark: boolean
    labelFont: any
    lightLabelBg: string
    darkLabelBg: string
    labelTextColor: string
    isMobile: boolean
}

function DockIcon({
    mouseX,
    icon,
    label,
    target,
    linkType,
    iconSize,
    magnification,
    magnificationRange,
    enableBounce,
    bounceDelay,
    onClick,
    isDark,
    labelFont,
    lightLabelBg,
    darkLabelBg,
    labelTextColor,
    isMobile
}: DockIconProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [showLabel, setShowLabel] = useState(false)

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
        return val - bounds.x - bounds.width / 2
    })

    const widthSync = useTransform(distance, [-magnificationRange, 0, magnificationRange], [iconSize, iconSize * magnification, iconSize])
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

    // Bounce animation on mount
    useEffect(() => {
        if (enableBounce && ref.current) {
            const timer = setTimeout(() => {
                animate(ref.current!, 
                    { y: [0, -20, 0] },
                    { 
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1]
                    }
                )
            }, bounceDelay)
            return () => clearTimeout(timer)
        }
    }, [enableBounce, bounceDelay])

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                touchAction: "manipulation",
            }}
        >
            {/* Label tooltip */}
            {showLabel && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        marginBottom: 8,
                        padding: "4px 8px",
                        background: isDark 
                            ? darkLabelBg 
                            : lightLabelBg,
                        backdropFilter: "blur(10px)",
                        borderRadius: 6,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        color: labelTextColor,
                        fontSize: isMobile ? 10 : 12,
                        fontWeight: 500,
                        ...labelFont,
                        zIndex: 1000,
                    }}
                >
                    {label}
                </motion.div>
            )}

            <motion.div
                ref={ref}
                style={{
                    width: isMobile ? iconSize : width,
                    height: isMobile ? iconSize : width,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    userSelect: "none",
                }}
                onMouseEnter={() => !isMobile && startTransition(() => setShowLabel(true))}
                onMouseLeave={() => startTransition(() => setShowLabel(false))}
                onTouchStart={() => startTransition(() => setShowLabel(true))}
                onTouchEnd={() => {
                    onClick(target, linkType)
                    setTimeout(() => startTransition(() => setShowLabel(false)), 2000)
                }}
                onClick={() => onClick(target, linkType)}
                whileTap={{ scale: 0.9 }}
            >
                {/* Check if icon is SVG or emoji/text */}
                {typeof icon === "object" && icon.src ? (
                    <img 
                        src={icon.src}
                        srcSet={icon.srcSet}
                        alt={icon.alt || label}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            borderRadius: "20%",
                        }}
                    />
                ) : typeof icon === "string" && (icon.startsWith("<svg") || icon.startsWith("http")) ? (
                    icon.startsWith("http") ? (
                        <img 
                            src={icon} 
                            alt={label}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                borderRadius: "20%",
                            }}
                        />
                    ) : (
                        <div 
                            dangerouslySetInnerHTML={{ __html: icon }}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        />
                    )
                ) : (
                    <span
                        style={{
                            fontSize: iconSize * 0.7,
                            lineHeight: 1,
                        }}
                    >
                        {typeof icon === "string" ? icon : "📱"}
                    </span>
                )}
            </motion.div>
        </div>
    )
}

addPropertyControls(MacDock, {
    items: {
        type: ControlType.Array,
        title: "Dock Items",
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "App"
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#section",
                    description: "URL or anchor (#id)"
                },
                target: {
                    type: ControlType.String,
                    title: "Target",
                    defaultValue: "#section",
                    description: "Anchor (#id) or URL"
                },
                linkType: {
                    type: ControlType.Enum,
                    title: "Link Type",
                    options: ["scroll", "navigate", "newTab"],
                    optionTitles: ["Smooth Scroll", "Navigate", "New Tab"],
                    defaultValue: "scroll",
                    displaySegmentedControl: false
                }
            }
        },
        defaultValue: [
            { icon: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Finder" }, label: "Finder", link: "#finder", target: "#finder", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Launchpad" }, label: "Launchpad", link: "#launchpad", target: "#launchpad", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Mail" }, label: "Mail", link: "#mail", target: "#mail", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Calendar" }, label: "Calendar", link: "#calendar", target: "#calendar", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Music" }, label: "Music", link: "#music", target: "#music", linkType: "scroll" },
            { icon: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Settings" }, label: "Settings", link: "#settings", target: "#settings", linkType: "scroll" }
        ]
    },
    responsiveScale: {
        type: ControlType.Boolean,
        title: "Responsive Scale",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        defaultValue: "light",
        displaySegmentedControl: true
    },
    lightBgColor: {
        type: ControlType.Color,
        title: "Light Bg",
        defaultValue: "rgba(255, 255, 255, 0.3)"
    },
    darkBgColor: {
        type: ControlType.Color,
        title: "Dark Bg",
        defaultValue: "rgba(30, 30, 30, 0.7)"
    },
    lightBorderColor: {
        type: ControlType.Color,
        title: "Light Border",
        defaultValue: "rgba(255, 255, 255, 0.2)"
    },
    darkBorderColor: {
        type: ControlType.Color,
        title: "Dark Border",
        defaultValue: "rgba(255, 255, 255, 0.1)"
    },
    lightLabelBg: {
        type: ControlType.Color,
        title: "Light Label Bg",
        defaultValue: "rgba(0, 0, 0, 0.75)"
    },
    darkLabelBg: {
        type: ControlType.Color,
        title: "Dark Label Bg",
        defaultValue: "rgba(60, 60, 60, 0.9)"
    },
    labelTextColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#ffffff"
    },
    dockBlur: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px"
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 48,
        min: 24,
        max: 96,
        step: 4,
        unit: "px"
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        unit: "px"
    },
    magnification: {
        type: ControlType.Number,
        title: "Magnification",
        defaultValue: 1.5,
        min: 1,
        max: 3,
        step: 0.1
    },
    magnificationRange: {
        type: ControlType.Number,
        title: "Mag Range",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        unit: "px"
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        unit: "px"
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 2,
        unit: "px"
    },
    enableBounce: {
        type: ControlType.Boolean,
        title: "Bounce Entry",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    bounceDelay: {
        type: ControlType.Number,
        title: "Bounce Delay",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 10,
        unit: "ms",
        hidden: ({ enableBounce }) => !enableBounce
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif"
    }
})
