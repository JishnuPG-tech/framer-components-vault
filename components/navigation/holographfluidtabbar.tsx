// Holographic Card component with rainbow iridescent shimmer effect that follows cursor
import { useState, useRef, useCallback, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HolographicCardProps {
    image: { src: string; alt?: string }
    title: string
    subtitle: string
    badge?: string
    showBadge: boolean
    intensity: "subtle" | "medium" | "intense"
    shineMode: "rainbow" | "gold" | "silver" | "custom"
    customShineColor: string
    borderRadius: number
    titleFont: CSSProperties
    subtitleFont: CSSProperties
    badgeFont: CSSProperties
    backgroundColor: string
    textColor: string
    badgeColor: string
    badgeTextColor: string
    enableLink: boolean
    linkUrl: string
    openInNewTab: boolean
    style?: CSSProperties
}

/**
 * Holographic Card
 * 
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 420
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HolographicCard(props: HolographicCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Card image"
        },
        title = "Holographic Card",
        subtitle = "Rare Edition",
        badge = "RARE",
        showBadge = true,
        intensity = "medium",
        shineMode = "rainbow",
        customShineColor = "#FFD700",
        borderRadius = 16,
        titleFont,
        subtitleFont,
        badgeFont,
        backgroundColor = "#1a1a2e",
        textColor = "#FFFFFF",
        badgeColor = "#FFD700",
        badgeTextColor = "#000000",
        enableLink = false,
        linkUrl = "https://framer.com",
        openInNewTab = true,
    } = props

    const cardRef = useRef<HTMLDivElement>(null)
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
    const [isHovered, setIsHovered] = useState(false)

    const intensityValues = useMemo(() => {
        const values = {
            subtle: { opacity: 0.3, tilt: 8, shine: 0.4 },
            medium: { opacity: 0.5, tilt: 15, shine: 0.6 },
            intense: { opacity: 0.7, tilt: 20, shine: 0.8 }
        }
        return values[intensity]
    }, [intensity])

    const shineColors = useMemo(() => {
        const modes = {
            rainbow: "conic-gradient(from 0deg at 50% 50%, #ff0080, #ff8c00, #ffed00, #00ff88, #00b8ff, #a020f0, #ff0080)",
            gold: "linear-gradient(135deg, #ffd700, #ffed4e, #ffd700, #ffb700)",
            silver: "linear-gradient(135deg, #c0c0c0, #e8e8e8, #c0c0c0, #a8a8a8)",
            custom: `radial-gradient(circle at center, ${customShineColor}, transparent)`
        }
        return modes[shineMode]
    }, [shineMode, customShineColor])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        
        const rect = cardRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        
        setMousePos({ x, y })
    }, [])

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        setMousePos({ x: 0.5, y: 0.5 })
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!cardRef.current || e.touches.length === 0) return
        
        const rect = cardRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        const x = (touch.clientX - rect.left) / rect.width
        const y = (touch.clientY - rect.top) / rect.height
        
        setMousePos({ x, y })
    }, [])

    const tiltX = isHovered ? (mousePos.y - 0.5) * intensityValues.tilt * 2 : 0
    const tiltY = isHovered ? (mousePos.x - 0.5) * -intensityValues.tilt * 2 : 0

    const holographicStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: shineColors,
        opacity: isHovered ? intensityValues.opacity : 0,
        mixBlendMode: "color-dodge",
        transition: isHovered ? "opacity 0.1s ease" : "opacity 0.5s ease",
        pointerEvents: "none",
        transform: `translate(${(mousePos.x - 0.5) * 40}%, ${(mousePos.y - 0.5) * 40}%)`,
        filter: "blur(20px)",
    }

    const shineSpotStyle: CSSProperties = {
        position: "absolute",
        top: `${mousePos.y * 100}%`,
        left: `${mousePos.x * 100}%`,
        width: "150px",
        height: "150px",
        background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
        transform: "translate(-50%, -50%)",
        opacity: isHovered ? intensityValues.shine : 0,
        transition: isHovered ? "opacity 0.1s ease" : "opacity 0.5s ease",
        pointerEvents: "none",
        filter: "blur(30px)",
    }

    const sparkleStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `
            radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.8) 0%, transparent 2%),
            radial-gradient(circle at ${(mousePos.x * 100 + 20) % 100}% ${(mousePos.y * 100 + 30) % 100}%, rgba(255,255,255,0.6) 0%, transparent 1.5%),
            radial-gradient(circle at ${(mousePos.x * 100 + 40) % 100}% ${(mousePos.y * 100 + 10) % 100}%, rgba(255,255,255,0.7) 0%, transparent 1.8%),
            radial-gradient(circle at ${(mousePos.x * 100 + 60) % 100}% ${(mousePos.y * 100 + 50) % 100}%, rgba(255,255,255,0.5) 0%, transparent 1.2%)
        `,
        opacity: isHovered ? 1 : 0,
        transition: isHovered ? "opacity 0.1s ease" : "opacity 0.5s ease",
        pointerEvents: "none",
    }

    const cardContent = (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                transition: isHovered 
                    ? "transform 0.1s ease-out" 
                    : "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
                transformStyle: "preserve-3d",
                borderRadius: `${borderRadius}px`,
                overflow: "hidden",
                backgroundColor: backgroundColor,
                boxShadow: isHovered
                    ? "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.1)"
                    : "0 10px 30px rgba(0,0,0,0.3)",
            }}
        >
            {/* Image Area */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "60%",
                    overflow: "hidden",
                }}
            >
                <img
                    src={image.src}
                    alt={image.alt || ""}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
                
                {/* Badge */}
                {showBadge && badge && (
                    <div
                        style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            backgroundColor: badgeColor,
                            color: badgeTextColor,
                            padding: "4px 12px",
                            borderRadius: "4px",
                            ...badgeFont,
                            zIndex: 2,
                        }}
                    >
                        {badge}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div
                style={{
                    position: "relative",
                    padding: "20px",
                    height: "40%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "8px",
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        color: textColor,
                        ...titleFont,
                    }}
                >
                    {title}
                </h3>
                <p
                    style={{
                        margin: 0,
                        color: textColor,
                        opacity: 0.8,
                        ...subtitleFont,
                    }}
                >
                    {subtitle}
                </p>
            </div>

            {/* Holographic Overlay */}
            <div style={holographicStyle} />
            
            {/* Shine Spot */}
            <div style={shineSpotStyle} />
            
            {/* Sparkles */}
            <div style={sparkleStyle} />

            {/* Border Highlight */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: `${borderRadius}px`,
                    pointerEvents: "none",
                    opacity: isHovered ? 1 : 0.5,
                    transition: "opacity 0.3s ease",
                }}
            />
        </div>
    )

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnter}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseLeave}
            style={{
                width: "100%",
                height: "100%",
                perspective: "1000px",
                cursor: "pointer",
            }}
        >
            {enableLink && linkUrl ? (
                <a
                    href={linkUrl}
                    target={openInNewTab ? "_blank" : "_self"}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        textDecoration: "none",
                    }}
                >
                    {cardContent}
                </a>
            ) : (
                cardContent
            )}
        </div>
    )
}

addPropertyControls(HolographicCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Holographic Card",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Rare Edition",
    },
    showBadge: {
        type: ControlType.Boolean,
        title: "Show Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    badge: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "RARE",
        hidden: ({ showBadge }) => !showBadge,
    },
    intensity: {
        type: ControlType.Enum,
        title: "Intensity",
        options: ["subtle", "medium", "intense"],
        optionTitles: ["Subtle", "Medium", "Intense"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    shineMode: {
        type: ControlType.Enum,
        title: "Shine Mode",
        options: ["rainbow", "gold", "silver", "custom"],
        optionTitles: ["Rainbow", "Gold", "Silver", "Custom"],
        defaultValue: "rainbow",
    },
    customShineColor: {
        type: ControlType.Color,
        title: "Custom Color",
        defaultValue: "#FFD700",
        hidden: ({ shineMode }) => shineMode !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1a1a2e",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    badgeColor: {
        type: ControlType.Color,
        title: "Badge Color",
        defaultValue: "#FFD700",
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
    badgeFont: {
        type: ControlType.Font,
        title: "Badge Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Bold",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    enableLink: {
        type: ControlType.Boolean,
        title: "Enable Link",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    linkUrl: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "https://framer.com",
        hidden: ({ enableLink }) => !enableLink,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ enableLink }) => !enableLink,
    },
})
