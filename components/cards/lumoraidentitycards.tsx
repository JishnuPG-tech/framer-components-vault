// Create a modern profile card UI with a clean minimal design.
// Card size should be 260px width and 320px height with rounded corners (20px radius) and soft shadow.

import { useState, useCallback, startTransition, type CSSProperties } from "react"
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

interface TeamMember {
    name: string
    role: string
    email: string
    avatar: {
        src: string
        alt: string
    }
}

interface ProfileCardProps {
    teamMembers: TeamMember[]
    backgroundColor: string
    cardBackground: string
    textColor: string
    secondaryTextColor: string
    buttonColor: string
    buttonTextColor: string
    arrowButtonColor: string
    orbitRadius: number
    avatarSize: number
    titleFont: CSSProperties
    bodyFont: CSSProperties
    style?: CSSProperties
}

/**
 * Team Avatar Card Carousel with Orbital Animation
 * 
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 700
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LumoraIdentityCards(props: ProfileCardProps) {
    const {
        teamMembers = [],
        backgroundColor,
        cardBackground,
        textColor,
        secondaryTextColor,
        buttonColor,
        buttonTextColor,
        arrowButtonColor,
        orbitRadius,
        avatarSize,
        titleFont,
        bodyFont,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)

    // Default team members
    const defaultMembers: TeamMember[] = [
        {
            name: "Casey Park",
            role: "Growth Manager",
            email: "Casey@example.com",
            avatar: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Casey Park",
            },
        },
        {
            name: "Sarah Chen",
            role: "Product Designer",
            email: "sarah@example.com",
            avatar: {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Sarah Chen",
            },
        },
        {
            name: "Marcus Lee",
            role: "Engineering Lead",
            email: "marcus@example.com",
            avatar: {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Marcus Lee",
            },
        },
        {
            name: "Emily Watson",
            role: "Marketing Director",
            email: "emily@example.com",
            avatar: {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Emily Watson",
            },
        },
        {
            name: "David Kim",
            role: "Sales Manager",
            email: "david@example.com",
            avatar: {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "David Kim",
            },
        },
    ]

    // Validate and normalize team members to ensure avatar always has src and alt
    const normalizedTeamMembers = (teamMembers.length > 0 ? teamMembers : defaultMembers).map((member, index) => ({
        ...member,
        avatar: {
            src: member.avatar?.src || defaultMembers[index % defaultMembers.length].avatar.src,
            alt: member.avatar?.alt || member.name || "Profile picture",
        },
    }))

    const activeMember = normalizedTeamMembers[activeIndex] || normalizedTeamMembers[0]

    const handlePrevious = useCallback(() => {
        startTransition(() => {
            setActiveIndex((prev) => (prev - 1 + normalizedTeamMembers.length) % normalizedTeamMembers.length)
        })
    }, [normalizedTeamMembers.length])

    const handleNext = useCallback(() => {
        startTransition(() => {
            setActiveIndex((prev) => (prev + 1) % normalizedTeamMembers.length)
        })
    }, [normalizedTeamMembers.length])

    // Calculate orbit positions for avatars
    const getOrbitPosition = (index: number) => {
        const totalMembers = normalizedTeamMembers.length
        // Adjust angle so activeIndex is always at top (270 degrees = top)
        const baseAngle = 270
        const angleStep = 360 / totalMembers
        const relativeIndex = (index - activeIndex + totalMembers) % totalMembers
        const angle = (baseAngle + relativeIndex * angleStep) * (Math.PI / 180)
        
        return {
            x: Math.cos(angle) * orbitRadius,
            y: Math.sin(angle) * orbitRadius,
        }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(135deg, #000000 0%, #14B8A6 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
            }}
        >
            {/* Orbit Container */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                {/* Orbit Ring Visual */}
                <div
                    style={{
                        position: "absolute",
                        width: orbitRadius * 2,
                        height: orbitRadius * 2,
                        borderRadius: "50%",
                        border: "1px dashed rgba(255, 255, 255, 0.2)",
                        pointerEvents: "none",
                    }}
                />

                {/* Orbiting Avatars */}
                {normalizedTeamMembers.map((member, index) => {
                    const position = getOrbitPosition(index)
                    const isActive = index === activeIndex
                    
                    return (
                        <motion.div
                            key={`orbit-${index}`}
                            animate={{
                                x: position.x,
                                y: position.y,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 150,
                                damping: 20,
                            }}
                            style={{
                                position: "absolute",
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: "50%",
                                overflow: "hidden",
                                border: isActive 
                                    ? `3px solid ${buttonColor}` 
                                    : `2px solid ${cardBackground}`,
                                boxShadow: isActive
                                    ? `0 0 20px ${buttonColor}40, 0 4px 12px rgba(0, 0, 0, 0.2)`
                                    : "0 4px 12px rgba(0, 0, 0, 0.15)",
                                cursor: "pointer",
                                zIndex: isActive ? 10 : 5,
                                pointerEvents: "auto",
                            }}
                        >
                            <img
                                src={member.avatar.src}
                                alt={member.avatar.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            {isActive && (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.5, 0.8, 0.5],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        position: "absolute",
                                        top: -3,
                                        left: -3,
                                        right: -3,
                                        bottom: -3,
                                        borderRadius: "50%",
                                        border: `2px solid ${buttonColor}`,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Profile Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                    }}
                    style={{
                        position: "relative",
                        width: 200,
                        height: 220,
                        backgroundColor: cardBackground,
                        borderRadius: 20,
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 45,
                        paddingBottom: 16,
                        paddingLeft: 16,
                        paddingRight: 16,
                        zIndex: 20,
                    }}
                >
                    {/* Overlapping Profile Image */}
                    <motion.div
                        key={`avatar-${activeIndex}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 25,
                        }}
                        style={{
                            position: "absolute",
                            top: -40,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: `4px solid ${cardBackground}`,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        <img
                            src={activeMember.avatar.src}
                            alt={activeMember.avatar.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </motion.div>

                    {/* Name */}
                    <h2
                        style={{
                            margin: "0 0 4px 0",
                            color: textColor,
                            textAlign: "center",
                            ...titleFont,
                        }}
                    >
                        {activeMember.name}
                    </h2>

                    {/* Role */}
                    <p
                        style={{
                            margin: "0 0 10px 0",
                            color: secondaryTextColor,
                            textAlign: "center",
                            ...bodyFont,
                        }}
                    >
                        {activeMember.role}
                    </p>

                    {/* Email with Icon */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 0,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                stroke={secondaryTextColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span
                            style={{
                                color: secondaryTextColor,
                                fontSize: "13px",
                                ...bodyFont,
                            }}
                        >
                            {activeMember.email}
                        </span>
                    </div>

                    {/* Bottom Section with Buttons */}
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        {/* Left Arrow Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handlePrevious}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                backgroundColor: arrowButtonColor,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            }}
                            aria-label="Previous profile"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M15 18l-6-6 6-6"
                                    stroke={textColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.button>

                        {/* Connect Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                flex: 1,
                                height: 44,
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                border: "none",
                                borderRadius: 22,
                                cursor: "pointer",
                                ...bodyFont,
                                fontWeight: 600,
                                fontSize: "12px",
                                paddingLeft: 16,
                                paddingRight: 16,
                            }}
                        >
                            Connect
                        </motion.button>

                        {/* Right Arrow Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNext}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: "50%",
                                backgroundColor: arrowButtonColor,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                            }}
                            aria-label="Next profile"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M9 18l6-6-6-6"
                                    stroke={textColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(LumoraIdentityCards, {
    teamMembers: {
        type: ControlType.Array,
        title: "Team Members",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Casey Park",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Growth Manager",
                },
                email: {
                    type: ControlType.String,
                    title: "Email",
                    defaultValue: "casey@example.com",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                },
            },
        },
        defaultValue: [
            {
                name: "Casey Park",
                role: "Growth Manager",
                email: "Casey@example.com",
                avatar: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Casey Park",
                },
            },
            {
                name: "Sarah Chen",
                role: "Product Designer",
                email: "sarah@example.com",
                avatar: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Sarah Chen",
                },
            },
            {
                name: "Marcus Lee",
                role: "Engineering Lead",
                email: "marcus@example.com",
                avatar: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Marcus Lee",
                },
            },
            {
                name: "Emily Watson",
                role: "Marketing Director",
                email: "emily@example.com",
                avatar: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Emily Watson",
                },
            },
            {
                name: "David Kim",
                role: "Sales Manager",
                email: "david@example.com",
                avatar: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "David Kim",
                },
            },
        ],
    },
    orbitRadius: {
        type: ControlType.Number,
        title: "Orbit Radius",
        defaultValue: 180,
        min: 140,
        max: 400,
        step: 10,
        unit: "px",
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 60,
        min: 40,
        max: 100,
        step: 5,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0F2A4A",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#999999",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#000000",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
    },
    arrowButtonColor: {
        type: ControlType.Color,
        title: "Arrow Button",
        defaultValue: "#F5F5F5",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})