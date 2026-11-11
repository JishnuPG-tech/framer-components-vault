import { useState, useRef, startTransition } from "react"
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

// Note: Border color is controlled separately from the native Border control
// (border width/style/radius) so you can style both independently in Framer.

// The existing preview demo has one fixed affiliate destination.
const DEMO_AFFILIATE_URL = "https://framer.link/fsd2pgh"
const X_PROFILE_HOSTS = new Set([
    "x.com",
    "www.x.com",
    "mobile.x.com",
    "twitter.com",
    "www.twitter.com",
])
const X_RESERVED_PATHS = new Set([
    "about", "compose", "download", "explore", "home", "i", "intent",
    "login", "logout", "messages", "notifications", "privacy", "search",
    "settings", "share", "signup", "tos",
])

function getAllowedProfileUrl(value: unknown): string | null {
    if (typeof value !== "string") return null
    const input = value.trim()
    if (!input || /[\u0000-\u0020\u007f\\]/.test(input)) return null

    // Keep only this exact legacy preview URL; other short links are not allowed.
    if (input === DEMO_AFFILIATE_URL) return DEMO_AFFILIATE_URL

    try {
        const destination = new URL(input)
        if (
            destination.protocol !== "https:" ||
            !X_PROFILE_HOSTS.has(destination.hostname) ||
            destination.username || destination.password || destination.port
        ) return null

        const profile = destination.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/)
        if (!profile || X_RESERVED_PATHS.has(profile[1].toLowerCase())) return null
        if (destination.hostname === "mobile.x.com") destination.hostname = "x.com"
        destination.search = ""
        destination.hash = ""
        return destination.href
    } catch {
        return null
    }
}


const getFontStyles = (font) => {
    if (!font) return {}
    const { variant, ...style } = font
    const newStyle = { ...style }

    if (variant && !newStyle.fontWeight) {
        const v = String(variant).toLowerCase()
        if (v.includes("black") || v.includes("heavy"))
            newStyle.fontWeight = 900
        else if (v.includes("extra") && v.includes("bold"))
            newStyle.fontWeight = 800
        else if (v.includes("bold")) newStyle.fontWeight = 700
        else if (v.includes("semi") || v.includes("demi"))
            newStyle.fontWeight = 600
        else if (v.includes("medium")) newStyle.fontWeight = 500
        else if (v.includes("extra") && v.includes("light"))
            newStyle.fontWeight = 200
        else if (v.includes("light")) newStyle.fontWeight = 300
        else if (v.includes("thin")) newStyle.fontWeight = 100
        else newStyle.fontWeight = 400
    }

    if (variant && !newStyle.fontStyle) {
        if (String(variant).toLowerCase().includes("italic"))
            newStyle.fontStyle = "italic"
    }

    return newStyle
}

/**
 * X Chat Widget
 *
 * A recreation of the X (Twitter) messages drawer.
 * Expands to show a direct message interface.
 * Pressing Enter in the input field redirects to the configured X profile.
 *
 * @framerIntrinsicWidth 350
 * @framerIntrinsicHeight 53
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function XChatWindow(props) {
    const {
        typography,
        colors: colorsGroup,
        appearance,
        profileName: legacyProfileName,
        profileHandle: legacyProfileHandle,
        profileImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Profile",
        },
        profileUrl: rawProfileUrl,
        welcomeText: legacyWelcomeText,
        helperText:
            legacyHelperText = "Sending will open my X profile so you can send the message there.",
        placeholderText: legacyPlaceholderText = "Start typing…",
        buttonText: legacyButtonText,
        joinedDate: legacyJoinedDate,
        followerCount: legacyFollowerCount,
        backgroundColor: legacyBackgroundColor = "#000000",
        textColor: legacyTextColor = "#E7E9EA",
        secondaryTextColor: legacySecondaryTextColor = "#71767B",
        accentColor: legacyAccentColor = "#1D9BF0",
        separatorColor: legacySeparatorColor = "#2F3336",
        headerFont: legacyHeaderFont,
        nameFont: legacyNameFont,
        handleFont: legacyHandleFont,
        messageFont: legacyMessageFont,
        metaFont: legacyMetaFont,
        helperFont: legacyHelperFont,
        inputFont: legacyInputFont,
        shadowType: legacyShadowType = "Default",
        customShadow: legacyCustomShadow = "",
        transition: legacyTransition = {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
        containerBorderRadius:
            legacyContainerBorderRadius = "16px 16px 0px 0px",
        containerBorder: legacyContainerBorder = {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#2F3336",
        },
    } = props

    const profileUrl = getAllowedProfileUrl(rawProfileUrl)

    const buttonText = legacyButtonText ?? "Messages"
    const profileName = legacyProfileName ?? "Matthias Ölschlegel"
    const profileHandle = legacyProfileHandle ?? "@matthias_oel"
    const welcomeText =
        legacyWelcomeText ?? "Send me a message to get in touch!"
    const helperText =
        legacyHelperText ??
        "Sending will open my X profile so you can send the message there."
    const placeholderText = legacyPlaceholderText ?? "Start typing…"
    const joinedDate = legacyJoinedDate ?? "Joined May 2009"
    const followerCount = legacyFollowerCount ?? "184.5M Followers"

    const headerFont = (typography && typography.headerFont) ?? legacyHeaderFont
    const nameFont = (typography && typography.nameFont) ?? legacyNameFont
    const handleFont = (typography && typography.handleFont) ?? legacyHandleFont
    const messageFont =
        (typography && typography.messageFont) ?? legacyMessageFont
    const metaFont = (typography && typography.metaFont) ?? legacyMetaFont
    const helperFont = (typography && typography.helperFont) ?? legacyHelperFont
    const inputFont = (typography && typography.inputFont) ?? legacyInputFont

    const backgroundColor =
        (colorsGroup && colorsGroup.background) ??
        legacyBackgroundColor ??
        "#000000"
    const textColor =
        (colorsGroup && colorsGroup.text) ?? legacyTextColor ?? "#E7E9EA"
    const secondaryTextColor =
        (colorsGroup && colorsGroup.secondary) ??
        legacySecondaryTextColor ??
        "#71767B"
    const accentColor =
        (colorsGroup && colorsGroup.accent) ?? legacyAccentColor ?? "#1D9BF0"
    const separatorColor =
        (colorsGroup && colorsGroup.separator) ??
        legacySeparatorColor ??
        "#2F3336"
    const borderFromColors = colorsGroup && colorsGroup.border

    const shadowType =
        (appearance && appearance.shadowType) ?? legacyShadowType ?? "Default"
    const customShadow =
        (appearance && appearance.customShadow) ?? legacyCustomShadow ?? ""
    const transition = (appearance && appearance.transition) ??
        legacyTransition ?? { type: "spring", stiffness: 300, damping: 30 }
    const containerBorderRadius =
        (appearance && appearance.containerBorderRadius) ??
        legacyContainerBorderRadius ??
        "16px 16px 0px 0px"

    const containerBorder = borderFromColors || legacyContainerBorder

    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef(null)
    const isStaticRenderer = useIsStaticRenderer()

    const toggleOpen = () => startTransition(() => setIsOpen(!isOpen))

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            if (profileUrl && typeof window !== "undefined") {
                window.open(profileUrl, "_blank")
                startTransition(() => setInputValue(""))
            }
        }
    }

    // X Colors
    const colors = {
        bg: backgroundColor,
        border: separatorColor,
        text: textColor,
        textSecondary: secondaryTextColor,
        blue: accentColor,
        hover: "rgba(239, 243, 244, 0.1)",
    }

    const defaultShadow =
        "rgba(255, 255, 255, 0.2) 0px 0px 15px, rgba(255, 255, 255, 0.15) 0px 0px 3px 1px"

    const activeShadow =
        shadowType === "None"
            ? "none"
            : shadowType === "Custom"
              ? customShadow || "none"
              : defaultShadow

    const { borderRadius, ...containerBorderWithoutRadius } =
        containerBorder || {}

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                position: "relative",
                fontFamily:
                    '"TwitterChirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                borderRadius: 0,
            }}
        >
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? 450 : 53,
                }}
                transition={isStaticRenderer ? { duration: 0 } : transition}
                style={{
                    width: "100%",
                    backgroundColor: colors.bg,
                    boxShadow: activeShadow,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: containerBorderRadius,
                    ...containerBorderWithoutRadius,
                }}
            >
                {/* Header */}
                <div
                    onClick={toggleOpen}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            toggleOpen()
                        }
                    }}
                    style={{
                        height: 53,
                        minHeight: 53,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        cursor: "pointer",
                        borderBottom: isOpen
                            ? `1px solid ${colors.border}`
                            : "none",
                    }}
                >
                    <span
                        style={{
                            color: colors.text,
                            ...getFontStyles(headerFont),
                        }}
                    >
                        {buttonText}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            alignItems: "center",
                        }}
                    >
                        <IconEnvelopePlus color={colors.text} />
                        <div
                            style={{
                                transform: isOpen
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <IconDoubleChevron color={colors.text} />
                        </div>
                    </div>
                </div>

                {/* Chat Content */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        opacity: isOpen ? 1 : 0,
                        transition: "opacity 0.2s ease",
                        pointerEvents: isOpen ? "auto" : "none",
                    }}
                >
                    {/* Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            onClick={() => {
                                if (profileUrl && typeof window !== "undefined")
                                    window.open(profileUrl, "_blank")
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    if (
                                        profileUrl &&
                                        typeof window !== "undefined"
                                    ) {
                                        window.open(profileUrl, "_blank")
                                    }
                                }
                            }}
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: "50%",
                                overflow: "hidden",
                                marginBottom: 4,
                                backgroundColor: colors.border,
                                cursor: profileUrl ? "pointer" : "default",
                            }}
                        >
                            {profileImage && (
                                <img
                                    src={profileImage.src}
                                    alt="Profile"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                        </div>
                        <div
                            onClick={() => {
                                if (profileUrl && typeof window !== "undefined")
                                    window.open(profileUrl, "_blank")
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    if (
                                        profileUrl &&
                                        typeof window !== "undefined"
                                    ) {
                                        window.open(profileUrl, "_blank")
                                    }
                                }
                            }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                cursor: profileUrl ? "pointer" : "default",
                            }}
                        >
                            <span
                                style={{
                                    color: colors.text,
                                    ...getFontStyles(nameFont),
                                }}
                            >
                                {profileName}
                            </span>
                            <span
                                style={{
                                    color: colors.textSecondary,
                                    ...getFontStyles(handleFont),
                                }}
                            >
                                {profileHandle}
                            </span>
                        </div>
                        <div
                            style={{
                                marginTop: 12,
                                color: colors.text,
                                ...getFontStyles(messageFont),
                            }}
                        >
                            {welcomeText}
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                color: colors.textSecondary,
                                ...getFontStyles(metaFont),
                            }}
                        >
                            {joinedDate} · {followerCount}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderTop: `1px solid ${colors.border}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            backgroundColor: colors.bg,
                        }}
                    >
                        <div
                            style={{
                                color: colors.textSecondary,
                                ...getFontStyles(helperFont),
                            }}
                        >
                            {helperText}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div style={{ display: "flex", gap: 12 }}>
                                <IconImage color={colors.blue} />
                                <IconGif color={colors.blue} />
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: colors.bg,
                                    borderRadius: 16,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={placeholderText}
                                    value={inputValue}
                                    onChange={(e) =>
                                        startTransition(() =>
                                            setInputValue(e.target.value)
                                        )
                                    }
                                    onKeyDown={handleKeyDown}
                                    style={{
                                        width: "100%",
                                        background: "transparent",
                                        border: "none",
                                        color: colors.text,
                                        outline: "none",
                                        padding: "8px 0",
                                        fontFamily: "inherit",
                                        ...getFontStyles(inputFont),
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    opacity: inputValue.length > 0 ? 1 : 0.5,
                                    cursor:
                                        inputValue.length > 0
                                            ? "pointer"
                                            : "default",
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (
                                        inputValue.length > 0 &&
                                        profileUrl &&
                                        typeof window !== "undefined"
                                    ) {
                                        window.open(profileUrl, "_blank")
                                        startTransition(() => setInputValue(""))
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        if (
                                            inputValue.length > 0 &&
                                            profileUrl &&
                                            typeof window !== "undefined"
                                        ) {
                                            window.open(profileUrl, "_blank")
                                            startTransition(() =>
                                                setInputValue("")
                                            )
                                        }
                                    }
                                }}
                            >
                                <IconSend color={colors.blue} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// Icons
function IconEnvelopePlus({ color }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )
}

function IconDoubleChevron({ color }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m7 11 5-5 5 5" />
            <path d="m7 18 5-5 5 5" />
        </svg>
    )
}

function IconImage({ color }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}

function IconGif({ color }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
            <path d="M9 10H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1" />
            <path d="M12 10v4" />
            <path d="M15 10h2" />
            <path d="M15 10v4" />
            <path d="M15 12h1.5" />
        </svg>
    )
}

function IconSend({ color }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    )
}

addPropertyControls(XChatWindow, {
    // Content (ungrouped)
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Messages",
    },
    profileName: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Matthias Ölschlegel",
    },
    profileHandle: {
        type: ControlType.String,
        title: "Handle",
        defaultValue: "@matthias_oel",
    },
    profileImage: {
        type: ControlType.ResponsiveImage,
        title: "Avatar",
    },
    welcomeText: {
        type: ControlType.String,
        title: "Welcome",
        defaultValue: "Send me a message to get in touch!",
        displayTextArea: true,
    },
    helperText: {
        type: ControlType.String,
        title: "Helper Text",
        defaultValue:
            "Sending will open my X profile so you can send the message there.",
        displayTextArea: true,
    },
    placeholderText: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Start typing…",
    },
    joinedDate: {
        type: ControlType.String,
        title: "Joined Date",
        defaultValue: "Joined May 2009",
    },
    followerCount: {
        type: ControlType.String,
        title: "Followers",
        defaultValue: "184.5M Followers",
    },
    profileUrl: {
        type: ControlType.String,
        title: "X Profile URL",
        defaultValue: "https://x.com/Matthias_Oel",
        placeholder: "https://twitter.com/username",
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            headerFont: {
                type: ControlType.Font,
                title: "Header Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 20,
                    variant: "Bold",
                    lineHeight: 1.2,
                },
            },
            nameFont: {
                type: ControlType.Font,
                title: "Name Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 17,
                    variant: "Bold",
                    lineHeight: 1.2,
                },
            },
            handleFont: {
                type: ControlType.Font,
                title: "Handle Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 15,
                    variant: "Regular",
                    lineHeight: 1.2,
                },
            },
            messageFont: {
                type: ControlType.Font,
                title: "Message Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 15,
                    lineHeight: 1.4,
                    variant: "Regular",
                },
            },
            metaFont: {
                type: ControlType.Font,
                title: "Meta Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 13,
                    variant: "Regular",
                    lineHeight: 1.2,
                },
            },
            helperFont: {
                type: ControlType.Font,
                title: "Helper Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 11,
                    variant: "Regular",
                    lineHeight: 1.2,
                },
            },
            inputFont: {
                type: ControlType.Font,
                title: "Input Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 15,
                    variant: "Regular",
                    lineHeight: 1.2,
                },
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#E7E9EA",
            },
            secondary: {
                type: ControlType.Color,
                title: "Secondary",
                defaultValue: "#71767B",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#1D9BF0",
            },
            separator: {
                type: ControlType.Color,
                title: "Separator",
                defaultValue: "#2F3336",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderStyle: "solid",
                    borderColor: "#2F3336",
                    borderTopWidth: 1,
                    borderRightWidth: 1,
                    borderBottomWidth: 0,
                    borderLeftWidth: 1,
                },
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
        controls: {
            shadowType: {
                type: ControlType.Enum,
                title: "Shadow",
                options: ["Default", "Custom", "None"],
                defaultValue: "Default",
                displaySegmentedControl: true,
            },
            customShadow: {
                type: ControlType.BoxShadow,
                title: "Custom Shadow",
                hidden: (props) => {
                    const source = props.appearance || props
                    return source.shadowType !== "Custom"
                },
            },
            transition: {
                type: ControlType.Transition,
                title: "Animation",
                defaultValue: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                },
            },
            containerBorderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "16px 16px 0px 0px",
            },
        },
    },
    // Legacy hidden content controls removed (now exposed above)
    // profileUrl is now exposed above in the Content section
    headerFont: {
        type: ControlType.Font,
        title: "Header Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            variant: "Bold",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 17,
            variant: "Bold",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    handleFont: {
        type: ControlType.Font,
        title: "Handle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Regular",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    messageFont: {
        type: ControlType.Font,
        title: "Message Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            lineHeight: 1.4,
            variant: "Regular",
        },
        hidden: () => true,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    helperFont: {
        type: ControlType.Font,
        title: "Helper Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 11,
            variant: "Regular",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Regular",
            lineHeight: 1.2,
        },
        hidden: () => true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        hidden: () => true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#E7E9EA",
        hidden: () => true,
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#71767B",
        hidden: () => true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#1D9BF0",
        hidden: () => true,
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator",
        defaultValue: "#2F3336",
        hidden: () => true,
    },
    shadowType: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["Default", "Custom", "None"],
        defaultValue: "Default",
        displaySegmentedControl: true,
        hidden: () => true,
    },
    customShadow: {
        type: ControlType.BoxShadow,
        title: "Custom Shadow",
        hidden: () => true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Animation",
        defaultValue: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
        hidden: () => true,
    },
    containerBorderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px 16px 0px 0px",
        hidden: () => true,
    },
    containerBorder: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderStyle: "solid",
            borderColor: "#2F3336",
            borderTopWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: 0,
            borderLeftWidth: 1,
        },
        hidden: () => true,
    },
})
