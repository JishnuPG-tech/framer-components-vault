// A portrait card that animates like it's hanging from a lanyard with a back card that appears on hover
// A portrait card that looks like plastic tape stuck on the canvas

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"

// ─── FIX 3: TypeScript Props Interface ───────────────────────────────────────

interface ResponsiveImage {
    src: string
    alt?: string
}

interface FontStyle {
    fontSize?: string
    fontWeight?: string | number
    variant?: string
    letterSpacing?: string
    lineHeight?: string
    fontFamily?: string
    [key: string]: unknown
}

interface LanyardDropCardProps {
    backgroundImage?: ResponsiveImage
    backgroundColor?: string
    useBackgroundImage?: boolean
    name?: string
    profileImage?: ResponsiveImage
    companyName?: string
    year?: string
    Experience?: string
    role?: string
    experienceRoleGap?: number
    backCardColor?: string
    backCardText?: string
    backCardTextColor?: string
    tapeColor?: string
    tapeOpacity?: number
    tapeWidth?: number
    tapeHeight?: number
    showTapeTexture?: boolean
    tapeRotation?: number
    nameFont?: FontStyle
    companyFont?: FontStyle
    yearFont?: FontStyle
    ExperienceFont?: FontStyle
    roleFont?: FontStyle
    backCardTextFont?: FontStyle
    style?: React.CSSProperties
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * A portrait card that animates like it's hanging from a lanyard with a back card that appears on hover
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */

export default function LanyardDropCard(props: LanyardDropCardProps) {
    const {
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Default background",
        },
        backgroundColor = "#1a1a1a",
        useBackgroundImage = true,
        name = "John Doe",
        profileImage = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Profile",
        },
        companyName = "CloudBees",
        year = "2025",
        Experience = "Hackathon",
        role = "Developer",
        experienceRoleGap = 4,
        backCardColor = "#8855FF",
        backCardText = "framer",
        backCardTextColor = "#FFFFFF",
        style,
        tapeColor = "#E8E8E8",
        tapeOpacity = 0.85,
        tapeWidth = 60,
        tapeHeight = 25,
        showTapeTexture = true,
        tapeRotation = -5,
        nameFont,
        companyFont,
        yearFont,
        ExperienceFont,
        roleFont,
        backCardTextFont,
    } = props

    // ─── FIX 2: Static Renderer Check ────────────────────────────────────────
    const isStatic = useIsStaticRenderer()
    // ─────────────────────────────────────────────────────────────────────────

    const [hasAnimated, setHasAnimated] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isShaking, setIsShaking] = useState(false)

    // ─── FIX 1: Ref to track shake timeout for cleanup ───────────────────────
    const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // Skip entrance animation logic in static renderer
        if (isStatic) return

        const timer = setTimeout(() => {
            setHasAnimated(true)
        }, 3000)

        return () => clearTimeout(timer)
    }, [isStatic])

    // ─── FIX 1: Cleanup shake timeout on unmount ─────────────────────────────
    useEffect(() => {
        return () => {
            if (shakeTimeoutRef.current !== null) {
                clearTimeout(shakeTimeoutRef.current)
            }
        }
    }, [])
    // ─────────────────────────────────────────────────────────────────────────

    const getTapeTextureStyle = (): React.CSSProperties => {
        if (!showTapeTexture) return {}

        return {
            backgroundImage: `
                linear-gradient(45deg, rgba(255,255,255,0.3) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(255,255,255,0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 50%, transparent 50%)
            `,
            backgroundSize: "8px 8px, 8px 8px, 2px 2px",
        }
    }

    const handleCardClick = () => {
        if (!isShaking) {
            setIsShaking(true)

            // ─── FIX 1: Store timeout ID in ref so cleanup effect can clear it ───
            shakeTimeoutRef.current = setTimeout(() => {
                setIsShaking(false)
                shakeTimeoutRef.current = null
            }, 1500)
            // ─────────────────────────────────────────────────────────────────────
        }
    }

    // ─── FIX 2: Static fallback — no animation, no hover/click interaction ───
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    ...style,
                }}
            >
                {/* Tape */}
                <div
                    style={{
                        width: tapeWidth,
                        height: tapeHeight,
                        backgroundColor: tapeColor,
                        opacity: tapeOpacity,
                        position: "relative",
                        zIndex: 20,
                        marginBottom: -12,
                        borderRadius: "2px",
                        transform: `rotate(${tapeRotation}deg)`,
                        boxShadow: `
                            0 2px 4px rgba(0,0,0,0.15),
                            inset 0 1px 0 rgba(255,255,255,0.4),
                            inset 0 -1px 0 rgba(0,0,0,0.1)
                        `,
                        border: "1px solid rgba(0,0,0,0.1)",
                        ...getTapeTextureStyle(),
                    }}
                />

                {/* Static Card */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                        background: useBackgroundImage
                            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${backgroundImage.src})`
                            : backgroundColor,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.4)",
                        display: "flex",
                        flexDirection: "column",
                        padding: 20,
                        color: "#fff",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 20,
                            left: 20,
                            color: "#fff",
                            opacity: 0.9,
                            ...companyFont,
                        }}
                    >
                        {companyName}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            top: 20,
                            right: 20,
                            color: "#fff",
                            opacity: 0.8,
                            ...yearFont,
                        }}
                    >
                        {year}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flex: 1,
                            marginTop: 40,
                            marginBottom: 20,
                        }}
                    >
                        <div
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: "50%",
                                overflow: "hidden",
                            }}
                        >
                            <img
                                src={profileImage.src}
                                alt={profileImage.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            backgroundColor: "rgba(255,255,255,0.95)",
                            borderRadius: 12,
                            padding: 16,
                            color: "#333",
                            marginTop: "auto",
                        }}
                    >
                        <div
                            style={{
                                color: "#111",
                                marginBottom: 8,
                                ...nameFont,
                            }}
                        >
                            {name}
                        </div>
                        <div
                            style={{
                                color: "#666",
                                marginBottom: experienceRoleGap,
                                ...roleFont,
                            }}
                        >
                            {role}
                        </div>
                        <div style={{ color: "#666", ...ExperienceFont }}>
                            {Experience}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <motion.div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transformOrigin: "top center",
                ...style,
            }}
            initial={{ y: -400, rotateZ: -20 }}
            animate={{
                y: 0,
                rotateZ: hasAnimated
                    ? isShaking
                        ? [-5, 3, -2, 1, -1, 0]
                        : 0
                    : [-20, 15, -10, 8, -5, 3, -2, 0],
            }}
            transition={{
                y: { duration: 0.5, ease: "easeOut" },
                rotateZ: isShaking
                    ? {
                          duration: 1.5,
                          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                          ease: "easeOut",
                      }
                    : {
                          duration: 3,
                          times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
                          ease: "easeOut",
                      },
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleCardClick}
        >
            {/* Plastic Tape - Top */}
            <div
                style={{
                    width: tapeWidth,
                    height: tapeHeight,
                    backgroundColor: tapeColor,
                    opacity: tapeOpacity,
                    position: "relative",
                    zIndex: 20,
                    marginBottom: -12,
                    borderRadius: "2px",
                    transform: `rotate(${tapeRotation}deg)`,
                    boxShadow: `
                        0 2px 4px rgba(0,0,0,0.15),
                        inset 0 1px 0 rgba(255,255,255,0.4),
                        inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                    border: "1px solid rgba(0,0,0,0.1)",
                    ...getTapeTextureStyle(),
                }}
            >
                {/* Tape adhesive edges effect */}
                <div
                    style={{
                        position: "absolute",
                        top: -1,
                        left: -1,
                        right: -1,
                        bottom: -1,
                        borderRadius: "2px",
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))",
                        zIndex: -1,
                    }}
                />

                {/* Subtle highlight on tape */}
                <div
                    style={{
                        position: "absolute",
                        top: "20%",
                        left: "10%",
                        right: "10%",
                        height: "30%",
                        background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        borderRadius: "1px",
                    }}
                />
            </div>

            {/* Back Card - Only visible on hover */}
            {isHovered && (
                <motion.div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 16,
                        background: backCardColor,
                        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.4)",
                        position: "absolute",
                        top: 30,
                        left: 0,
                        zIndex: 0,
                        overflow: "hidden",
                    }}
                    initial={{ rotateZ: 0, opacity: 0, x: 0 }}
                    animate={{ rotateZ: 10, opacity: 1, x: -30, y: -25 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Vertical Text */}
                    <div
                        style={{
                            position: "absolute",
                            left: 28,
                            top: "100%",
                            transform: "translateY(-50%) rotate(-90deg)",
                            transformOrigin: "left center",
                            padding: 0,
                            color: backCardTextColor,
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            ...backCardTextFont,
                        }}
                    >
                        {backCardText}
                    </div>
                </motion.div>
            )}

            {/* Main Card */}
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 16,
                    background: useBackgroundImage
                        ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${backgroundImage.src})`
                        : backgroundColor,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    flexDirection: "column",
                    padding: 20,
                    color: "#fff",
                    position: "relative",
                    overflow: "hidden",
                    zIndex: 1,
                }}
            >
                {/* Company Name - Top Left */}
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        left: 20,
                        color: "#fff",
                        opacity: 0.9,
                        ...companyFont,
                    }}
                >
                    {companyName}
                </div>

                {/* Year - Top Right */}
                <div
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        color: "#fff",
                        opacity: 0.8,
                        ...yearFont,
                    }}
                >
                    {year}
                </div>

                {/* Profile Image - Centered */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flex: 1,
                        marginTop: 40,
                        marginBottom: 20,
                    }}
                >
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "none",
                        }}
                    >
                        <img
                            src={profileImage.src}
                            alt={profileImage.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </div>
                </div>

                {/* Information Container - Bottom Half */}
                <div
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: 12,
                        padding: 16,
                        color: "#333",
                        marginTop: "auto",
                    }}
                >
                    {/* Name */}
                    <div
                        style={{
                            color: "#111",
                            marginBottom: 8,
                            ...nameFont,
                        }}
                    >
                        {name}
                    </div>

                    {/* Role */}
                    <div
                        style={{
                            color: "#666",
                            marginBottom: experienceRoleGap,
                            ...roleFont,
                        }}
                    >
                        {role}
                    </div>

                    {/* Experience */}
                    <div
                        style={{
                            color: "#666",
                            ...ExperienceFont,
                        }}
                    >
                        {Experience}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(LanyardDropCard, {
    useBackgroundImage: {
        type: ControlType.Boolean,
        title: "Use Background Image",
        defaultValue: true,
        enabledTitle: "Image",
        disabledTitle: "Color",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image",
        hidden: ({ useBackgroundImage }) => !useBackgroundImage,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#1a1a1a",
        hidden: ({ useBackgroundImage }) => useBackgroundImage,
    },
    profileImage: {
        type: ControlType.ResponsiveImage,
        title: "Profile Image",
    },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Asapindie",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    companyName: {
        type: ControlType.String,
        title: "Company",
        defaultValue: "Framer",
    },
    companyFont: {
        type: ControlType.Font,
        title: "Company Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    year: {
        type: ControlType.String,
        title: "Year",
        defaultValue: "2025",
    },
    yearFont: {
        type: ControlType.Font,
        title: "Year Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    Experience: {
        type: ControlType.String,
        title: "Experience",
        defaultValue: "Hackathon",
    },
    ExperienceFont: {
        type: ControlType.Font,
        title: "Experience Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: "Developer",
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    experienceRoleGap: {
        type: ControlType.Number,
        title: "Experience-Role Gap",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    tapeColor: {
        type: ControlType.Color,
        title: "Tape Color",
        defaultValue: "#E8E8E8",
    },
    tapeOpacity: {
        type: ControlType.Number,
        title: "Tape Opacity",
        defaultValue: 0.85,
        min: 0.3,
        max: 1,
        step: 0.05,
    },
    tapeWidth: {
        type: ControlType.Number,
        title: "Tape Width",
        defaultValue: 60,
        min: 40,
        max: 120,
        step: 5,
        unit: "px",
    },
    tapeHeight: {
        type: ControlType.Number,
        title: "Tape Height",
        defaultValue: 25,
        min: 15,
        max: 40,
        step: 2,
        unit: "px",
    },
    showTapeTexture: {
        type: ControlType.Boolean,
        title: "Show Tape Texture",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    tapeRotation: {
        type: ControlType.Number,
        title: "Tape Rotation",
        defaultValue: -5,
        min: -15,
        max: 15,
        step: 1,
        unit: "deg",
    },
    backCardColor: {
        type: ControlType.Color,
        title: "Back Card Color",
        defaultValue: "#8855FF",
    },
    backCardText: {
        type: ControlType.String,
        title: "Back Card Text",
        defaultValue: "hehehehe",
    },
    backCardTextFont: {
        type: ControlType.Font,
        title: "Back Card Text Font",
        defaultValue: {
            fontSize: "80px",
            variant: "Extra Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    backCardTextColor: {
        type: ControlType.Color,
        title: "Back Card Text Color",
        defaultValue: "#FFFFFF",
        description: "Made by [Chehak](https://chehak.framer.website/)",
    },
})
