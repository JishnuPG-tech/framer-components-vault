import * as React from "react"
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

// IMPORT PHOSPHOR ICONS
// @ts-ignore
import * as PhosphorIcons from "https://esm.sh/phosphor-react@1.4.1?external=react"
const { CaretLeft, CaretRight } = PhosphorIcons || {}

// --- INTERFACES ---

interface SocialLink {
    iconType: string
    link: string
}

interface UltraGlassSocialsProps {
    side: "left" | "right"
    profile?: {
        image?: { src: string; srcSet?: string; alt?: string }
        name?: string
        job?: string
        borderWidth?: number
    }
    showProfile: boolean
    glassTheme: "dark" | "light" | "custom"
    customColors?: {
        background?: string
        border?: string
        text?: string
    }
    socialLinks: SocialLink[]
    iconSettings?: {
        color?: string
        hoverColor?: string
        hoverTextColor?: string
        weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
    }
}

/**
 * ULTRA GLASS SOCIALS
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function UltraGlassSocials(props: UltraGlassSocialsProps) {
    const {
        side = "right",
        profile,
        showProfile = true,
        glassTheme = "dark",
        customColors,
        socialLinks = [],
        iconSettings,
    } = props

    const profileImage = profile?.image
    const profileName = profile?.name ?? "Alfan F."
    const profileJob = profile?.job ?? "Web Developer"
    const avatarBorderWidth = profile?.borderWidth ?? 2

    const iconColor = iconSettings?.color
    const iconHoverColor = iconSettings?.hoverColor
    const iconHoverTextColor = iconSettings?.hoverTextColor
    const iconWeight = iconSettings?.weight ?? "bold"

    const [isHovered, setIsHovered] = React.useState(false)

    const isRight = side === "right"
    const borderRadius = isRight ? "20px 0 0 20px" : "0 20px 20px 0"
    const collapsedWidth = 60
    const expandedWidth = 280

    const isDark = glassTheme === "dark"
    const isCustom = glassTheme === "custom"

    // Determine colors based on theme
    let textColor: string
    let glassBg: string
    let glassBorder: string

    if (isCustom) {
        textColor = customColors?.text || "#FFFFFF"
        glassBg = customColors?.background || "rgba(10, 10, 10, 0.6)"
        glassBorder = customColors?.border || "rgba(255, 255, 255, 0.15)"
    } else if (isDark) {
        textColor = "#FFFFFF"
        glassBg = "rgba(10, 10, 10, 0.6)"
        glassBorder = "rgba(255, 255, 255, 0.15)"
    } else {
        textColor = "#333333"
        glassBg = "rgba(255, 255, 255, 0.65)"
        glassBorder = "rgba(255, 255, 255, 0.6)"
    }

    const effectiveIconColor = iconColor || textColor

    // Logic Container: Fixed position to be sticky and independent of stack
    const containerStyle: React.CSSProperties = {
        position: "fixed",
        top: "50%",
        transform: "translateY(-50%)",
        left: isRight ? "auto" : 0,
        right: isRight ? 0 : "auto",
        zIndex: 99,
        display: "flex",
        flexDirection: "row",
        justifyContent: isRight ? "flex-end" : "flex-start",
        alignItems: "center",
        pointerEvents: "none",
    }

    return (
        <div
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                top: 0,
                left: 0,
                overflow: "visible",
                zIndex: 10,
            }}
        >
            <div style={containerStyle}>
                <motion.div
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    onClick={() => setIsHovered(!isHovered)}
                    initial={false}
                    animate={{
                        width: isHovered ? expandedWidth : collapsedWidth,
                        backgroundColor: glassBg,
                    }}
                    transition={{
                        duration: 0.35,
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                    }}
                    style={{
                        height: "auto",
                        minHeight: 140,
                        borderRadius: borderRadius,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        boxShadow: "0 12px 32px 0 rgba(0, 0, 0, 0.15)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        border: `1px solid ${glassBorder}`,
                        borderRight: isRight ? "none" : undefined,
                        borderLeft: !isRight ? "none" : undefined,
                        cursor: "pointer",
                        color: textColor,
                        pointerEvents: "auto",
                    }}
                >
                    {/* TOGGLE INDICATOR (Arrow) */}
                    <div
                        style={{
                            position: "absolute",
                            [isRight ? "left" : "right"]: 0,
                            top: 0,
                            width: collapsedWidth,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            pointerEvents: "none",
                        }}
                    >
                        <motion.div
                            animate={{
                                opacity: isHovered ? 0 : 1,
                                scale: isHovered ? 0.8 : 1,
                                x: isHovered ? (isRight ? 20 : -20) : 0,
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            {isRight
                                ? CaretLeft && (
                                      <CaretLeft
                                          size={24}
                                          weight={iconWeight}
                                          color={effectiveIconColor}
                                      />
                                  )
                                : CaretRight && (
                                      <CaretRight
                                          size={24}
                                          weight={iconWeight}
                                          color={effectiveIconColor}
                                      />
                                  )}
                        </motion.div>
                    </div>

                    {/* CONTENT AREA */}
                    <motion.div
                        animate={{
                            opacity: isHovered ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        style={{
                            width: expandedWidth,
                            padding: "30px 20px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 15,
                            pointerEvents: isHovered ? "auto" : "none",
                        }}
                    >
                        {showProfile && (
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{
                                    y: isHovered ? 0 : 10,
                                    opacity: isHovered ? 1 : 0,
                                }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                style={{
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        marginBottom: 12,
                                        border: `${avatarBorderWidth}px solid ${
                                            isCustom
                                                ? customColors?.border ||
                                                  "rgba(255,255,255,0.2)"
                                                : isDark
                                                  ? "rgba(255,255,255,0.2)"
                                                  : "rgba(0,0,0,0.1)"
                                        }`,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        backgroundColor: isDark
                                            ? "#333"
                                            : "#ddd",
                                    }}
                                >
                                    {profileImage?.src && (
                                        <img
                                            src={profileImage.src}
                                            srcSet={profileImage.srcSet}
                                            alt={profileImage.alt || "Profile"}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                </div>
                                <h4
                                    style={{
                                        margin: 0,
                                        fontSize: 18,
                                        fontWeight: 700,
                                    }}
                                >
                                    {profileName}
                                </h4>
                                <p
                                    style={{
                                        margin: "2px 0 0",
                                        fontSize: 13,
                                        opacity: 0.6,
                                    }}
                                >
                                    {profileJob}
                                </p>
                            </motion.div>
                        )}

                        {showProfile && (
                            <div
                                style={{
                                    width: 50,
                                    height: 1,
                                    background: textColor,
                                    opacity: 0.1,
                                    margin: "5px 0",
                                }}
                            />
                        )}

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                justifyContent: "center",
                                gap: 10,
                                width: "100%",
                            }}
                        >
                            {socialLinks.map((item, index) => (
                                <SocialButton
                                    key={index}
                                    iconName={item.iconType}
                                    url={item.link}
                                    baseColor={effectiveIconColor}
                                    hoverColor={iconHoverColor}
                                    hoverTextColor={iconHoverTextColor}
                                    isDark={isDark}
                                    delay={0.05 + index * 0.03}
                                    isVisible={isHovered}
                                    weight={iconWeight}
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

// --- SUB COMPONENTS ---

function PhosphorIconHelper({
    name,
    size = 22,
    color,
    weight = "bold",
}: {
    name: string
    size?: number
    color: string
    weight?: string
}) {
    if (!PhosphorIcons) return null

    const nameMap: Record<string, string> = {
        Website: "Globe",
        Email: "Envelope",
        Twitter: "TwitterLogo",
    }

    const targetName = nameMap[name] || name
    const Icon =
        PhosphorIcons[targetName] ||
        PhosphorIcons[`${targetName}Logo`] ||
        PhosphorIcons.Globe

    if (!Icon) return null

    return <Icon size={size} weight={weight} color={color} />
}

interface SocialButtonProps {
    iconName: string
    url: string
    baseColor: string
    hoverColor?: string
    hoverTextColor?: string
    isDark: boolean
    delay: number
    isVisible: boolean
    weight: string
}

function SocialButton({
    iconName,
    url,
    baseColor,
    hoverColor,
    hoverTextColor,
    isDark,
    delay,
    isVisible,
    weight,
}: SocialButtonProps) {
    if (!url) return null

    const variants = {
        hidden: { scale: 0.5, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.03)",
            color: baseColor,
            transition: { duration: 0.2, delay: delay, ease: "easeOut" },
        },
        hover: {
            y: -3,
            scale: 1.1,
            backgroundColor: hoverColor || baseColor,
            color: hoverTextColor || (isDark ? "#000000" : "#FFFFFF"),
            transition: { duration: 0.2 },
        },
    }

    return (
        <motion.a
            href={url}
            target="_blank"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            whileHover="hover"
            variants={variants}
            style={{
                textDecoration: "none",
                width: 44,
                height: 44,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.03)",
                color: baseColor,
            }}
        >
            <PhosphorIconHelper
                name={iconName}
                size={22}
                color="currentColor"
                weight={weight}
            />
        </motion.a>
    )
}

// --- PROPERTY CONTROLS ---

const iconOptions = [
    "Activity",
    "AddressBook",
    "Airplane",
    "Anchor",
    "Bag",
    "Bank",
    "Barbell",
    "Baseball",
    "Basketball",
    "BeerBottle",
    "BehanceLogo",
    "Bicycle",
    "Bird",
    "BitcoinLogo",
    "Boat",
    "BracketsCurly",
    "Briefcase",
    "Bug",
    "Calendar",
    "Camera",
    "Car",
    "Cat",
    "ChartBar",
    "ChartLine",
    "ChartPie",
    "Chat",
    "Clock",
    "Cloud",
    "Code",
    "Coffee",
    "Coin",
    "Compass",
    "CreditCard",
    "Crown",
    "CurrencyBtc",
    "CurrencyDollar",
    "CurrencyEur",
    "CurrencyGbp",
    "CurrencyJpy",
    "Desktop",
    "DeviceMobile",
    "DiscordLogo",
    "Dog",
    "DribbbleLogo",
    "Drop",
    "Envelope",
    "FacebookLogo",
    "FigmaLogo",
    "Fire",
    "FirstAid",
    "Fish",
    "Flag",
    "Flower",
    "Football",
    "ForkKnife",
    "GameController",
    "Gear",
    "GithubLogo",
    "Globe",
    "Hamburger",
    "HandFist",
    "HandPeace",
    "HandPointingDown",
    "HandPointingLeft",
    "HandPointingRight",
    "HandPointingUp",
    "HandSoap",
    "HandWaving",
    "Headphones",
    "Heart",
    "Heartbeat",
    "House",
    "IdentificationCard",
    "InstagramLogo",
    "Laptop",
    "Leaf",
    "Lightning",
    "Link",
    "LinkedinLogo",
    "MapPin",
    "MapTrifold",
    "Martini",
    "MaskHappy",
    "MaskSad",
    "Medal",
    "MediumLogo",
    "MessengerLogo",
    "Microphone",
    "Monitor",
    "Moon",
    "MusicNotes",
    "PawPrint",
    "Phone",
    "Pill",
    "PinterestLogo",
    "Pizza",
    "PresentationChart",
    "Pulse",
    "RedditLogo",
    "Rocket",
    "ShoppingCart",
    "SlackLogo",
    "Smiley",
    "SmileyBlank",
    "SmileyMeh",
    "SmileyNervous",
    "SmileySad",
    "SmileyWink",
    "SnapchatLogo",
    "Sneaker",
    "Snowflake",
    "SoccerBall",
    "SpotifyLogo",
    "Star",
    "Stethoscope",
    "Sun",
    "Syringe",
    "Tablet",
    "TelegramLogo",
    "TennisBall",
    "Terminal",
    "ThumbsDown",
    "ThumbsUp",
    "TiktokLogo",
    "Train",
    "Tree",
    "TrendDown",
    "TrendUp",
    "Trophy",
    "TwitchLogo",
    "TwitterLogo",
    "User",
    "VideoCamera",
    "Virus",
    "Volleyball",
    "WhatsappLogo",
    "Wind",
    "WineGlass",
    "YoutubeLogo",
]

addPropertyControls(UltraGlassSocials, {
    side: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right"],
        optionTitles: ["Left Side", "Right Side"],
        defaultValue: "right",
    },
    glassTheme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "custom"],
        optionTitles: ["Dark Glass", "Light Glass", "Custom"],
        defaultValue: "dark",
    },
    customColors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (props) => props.glassTheme !== "custom",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(10, 10, 10, 0.6)",
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255, 255, 255, 0.15)",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
        },
        defaultValue: {
            background: "rgba(10, 10, 10, 0.6)",
            border: "rgba(255, 255, 255, 0.15)",
            text: "#FFFFFF",
        },
    },
    showProfile: {
        type: ControlType.Boolean,
        title: "Profile",
        defaultValue: true,
    },
    profile: {
        type: ControlType.Object,
        title: "Profile Info",
        hidden: (props) => !props.showProfile,
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Avatar" },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Max",
            },
            job: {
                type: ControlType.String,
                title: "Job",
                defaultValue: "Web Developer",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 2,
                min: 0,
                max: 10,
                step: 1,
            },
        },
        defaultValue: {
            name: "Max",
            job: "Web Developer",
            borderWidth: 2,
        },
    },
    iconSettings: {
        type: ControlType.Object,
        title: "Icon Style",
        controls: {
            color: { type: ControlType.Color, title: "Color", optional: true },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover Bg",
                optional: true,
            },
            hoverTextColor: {
                type: ControlType.Color,
                title: "Hover Icon",
                optional: true,
            },
            weight: {
                type: ControlType.Enum,
                title: "Weight",
                options: [
                    "thin",
                    "light",
                    "regular",
                    "bold",
                    "fill",
                    "duotone",
                ],
                optionTitles: [
                    "Thin",
                    "Light",
                    "Regular",
                    "Bold",
                    "Fill",
                    "Duotone",
                ],
                defaultValue: "bold",
            },
        },
        defaultValue: {
            weight: "bold",
        },
    },
    socialLinks: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Object,
            controls: {
                iconType: {
                    type: ControlType.Enum,
                    title: "Icon",
                    defaultValue: "InstagramLogo",
                    options: iconOptions,
                },
                link: {
                    type: ControlType.String,
                    title: "URL",
                    placeholder: "https://...",
                },
            },
        },
        defaultValue: [
            { iconType: "InstagramLogo", link: "https://instagram.com" },
            { iconType: "LinkedinLogo", link: "https://linkedin.com" },
            { iconType: "WhatsappLogo", link: "https://wa.me/" },
        ],
    },
})
