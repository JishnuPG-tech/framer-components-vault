import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
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


/**
 * Team Card Drawer
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TeamCardDrawer(props) {
    const {
        content = {},
        cardSettings = {},
        drawerSettings = {},
        socialLinks = {},
        typography = {},
    } = props

    const {
        image = {
            src: "https://framerusercontent.com/images/g43EoxeHdRTao6sN7V8vlMO1A.png",
            alt: "Team Member",
        },
        name = "Sarah Chen",
        role = "Product Designer",
        bio = "Sarah is a passionate product designer with over 8 years of experience in creating user-centric digital experiences. She specializes in UI/UX design, design systems, and prototyping. \n\nWhen she's not designing, you can find her exploring local coffee shops or hiking in the mountains.",
    } = content

    const {
        cardBackgroundColor = "#f5f5f5",
        cardTextAlign = "left",
        borderRadius = 12,
        padding = 24,
    } = cardSettings

    const {
        drawerWidth = 480,
        drawerBackgroundColor = "#ffffff",
        textColor = "#111111",
        roleColor = "#666666",
        overlayColor = "rgba(0, 0, 0, 0.6)",
        dividerColor = "rgba(0,0,0,0.1)",
        drawerTextAlign = "left",
        closeIcon,
        drawerPosition = "right",
    } = drawerSettings

    const {
        showSocialLinks = true,
        linkedinUrl = "https://linkedin.com/in/sarahchen",
        twitterUrl = "https://twitter.com/sarahchen",
        websiteUrl,
        linkedinIcon,
        twitterIcon,
        websiteIcon,
        socialIconColor = "#0099FF",
        socialIconBackgroundColor = "rgba(0,0,0,0.05)",
    } = socialLinks

    const {
        font = {
            fontSize: 24,
            variant: "Semibold",
            lineHeight: 1.2,
        },
        roleFont = {
            fontSize: 16,
            variant: "Regular",
            lineHeight: 1.4,
        },
        overlayNameFont = {
            fontSize: 32,
            variant: "Semibold",
            lineHeight: 1.2,
        },
        overlayRoleFont = {
            fontSize: 18,
            variant: "Regular",
            lineHeight: 1.4,
        },
        bioFont = {
            fontSize: 16,
            variant: "Regular",
            lineHeight: 1.6,
        },
    } = typography

    const [isOpen, setIsOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [isOpen])

    // Portal implementation for the drawer
    const Portal = ({ children }) => {
        if (typeof document === "undefined") return null
        return createPortal(children, document.body)
    }

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    return (
        <>
            {/* Card Trigger */}
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    cursor: "pointer",
                    backgroundColor: cardBackgroundColor,
                }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.98 }}
            >
                {/* Image */}
                <motion.div
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <img
                        src={image.src}
                        alt={name}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                </motion.div>

                {/* Gradient Overlay */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "60%",
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)",
                        pointerEvents: "none",
                    }}
                />

                {/* Text Content */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: padding,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        pointerEvents: "none",
                        textAlign: cardTextAlign,
                    }}
                >
                    <span
                        style={{
                            ...font,
                            textAlign: cardTextAlign,
                            color: "#FFFFFF", // Always white on card for contrast
                            marginBottom: 4,
                        }}
                    >
                        {name}
                    </span>
                    <span
                        style={{
                            ...roleFont,
                            textAlign: cardTextAlign,
                            color: "rgba(255,255,255,0.8)", // Slightly transparent white
                        }}
                    >
                        {role}
                    </span>
                </div>
            </motion.div>

            {/* Drawer Overlay */}
            {!isCanvas && (
                <Portal>
                    <AnimatePresence>
                        {isOpen && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: overlayColor,
                                        zIndex: 9998,
                                        backdropFilter: "blur(4px)",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setIsOpen(false)}
                                />

                                {/* Drawer Panel */}
                                <motion.div
                                    initial={{ x: drawerPosition === "right" ? "100%" : "-100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: drawerPosition === "right" ? "100%" : "-100%" }}
                                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={
                                        drawerPosition === "right"
                                            ? { left: 0, right: 0.5 }
                                            : { left: 0.5, right: 0 }
                                    }
                                    onDragEnd={(e, { offset, velocity }) => {
                                        if (drawerPosition === "right") {
                                            if (offset.x > 100 || velocity.x > 100) {
                                                setIsOpen(false)
                                            }
                                        } else {
                                            if (offset.x < -100 || velocity.x < -100) {
                                                setIsOpen(false)
                                            }
                                        }
                                    }}
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        right: drawerPosition === "right" ? 0 : "auto",
                                        left: drawerPosition === "left" ? 0 : "auto",
                                        bottom: 0,
                                        width: "100%",
                                        maxWidth: drawerWidth,
                                        backgroundColor: drawerBackgroundColor,
                                        zIndex: 9999,
                                        overflowY: "auto",
                                        boxShadow:
                                            drawerPosition === "right"
                                                ? "-10px 0 40px rgba(0,0,0,0.1)"
                                                : "10px 0 40px rgba(0,0,0,0.1)",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close Button */}
                                    <motion.button
                                        onClick={() => setIsOpen(false)}
                                        whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.2)" }}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            position: "absolute",
                                            top: 20,
                                            right: drawerPosition === "right" ? 20 : "auto",
                                            left: drawerPosition === "left" ? 20 : "auto",
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            backgroundColor: "rgba(0,0,0,0.1)",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 10,
                                            color: "#fff",
                                            backdropFilter: "blur(10px)",
                                            padding: 0,
                                        }}
                                    >
                                        {closeIcon ? (
                                            <img
                                                src={closeIcon.src}
                                                alt="Close"
                                                style={{ width: 24, height: 24, objectFit: "contain" }}
                                            />
                                        ) : (
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        )}
                                    </motion.button>

                                    {/* Drawer Image */}
                                    <div style={{ width: "100%", height: 300, flexShrink: 0 }}>
                                        <img
                                            src={image.src}
                                            alt={name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>

                                    {/* Drawer Content */}
                                    <div
                                        style={{
                                            padding: 40,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 16,
                                            textAlign: drawerTextAlign,
                                        }}
                                    >
                                        <div>
                                            <h2
                                                style={{
                                                    ...overlayNameFont,
                                                    textAlign: drawerTextAlign,
                                                    color: textColor,
                                                    margin: 0,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                {name}
                                            </h2>
                                            <span
                                                style={{
                                                    ...overlayRoleFont,
                                                    textAlign: drawerTextAlign,
                                                    color: roleColor,
                                                    display: "block",
                                                }}
                                            >
                                                {role}
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                width: "100%",
                                                height: 1,
                                                backgroundColor: dividerColor,
                                                margin: "8px 0",
                                            }}
                                        />

                                        <p
                                            style={{
                                                ...bioFont,
                                                textAlign: drawerTextAlign,
                                                color: textColor,
                                                opacity: 0.8,
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {bio}
                                        </p>

                                        {/* Social Links */}
                                        {showSocialLinks && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 12,
                                                    marginTop: 8,
                                                    justifyContent:
                                                        drawerTextAlign === "center"
                                                            ? "center"
                                                            : drawerTextAlign === "right"
                                                              ? "flex-end"
                                                              : "flex-start",
                                                }}
                                            >
                                                {linkedinUrl && (
                                                    <motion.a
                                                        href={linkedinUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover={{ scale: 1.1, opacity: 0.8 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: "50%",
                                                            backgroundColor: socialIconBackgroundColor,
                                                            color: socialIconColor || textColor,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {linkedinIcon ? (
                                                            <img
                                                                src={linkedinIcon.src}
                                                                alt="LinkedIn"
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                                                <rect x="2" y="9" width="4" height="12" />
                                                                <circle cx="4" cy="4" r="2" />
                                                            </svg>
                                                        )}
                                                    </motion.a>
                                                )}
                                                {twitterUrl && (
                                                    <motion.a
                                                        href={twitterUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover={{ scale: 1.1, opacity: 0.8 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: "50%",
                                                            backgroundColor: socialIconBackgroundColor,
                                                            color: socialIconColor || textColor,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {twitterIcon ? (
                                                            <img
                                                                src={twitterIcon.src}
                                                                alt="Twitter"
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="currentColor"
                                                            >
                                                                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                                                            </svg>
                                                        )}
                                                    </motion.a>
                                                )}
                                                {websiteUrl && (
                                                    <motion.a
                                                        href={websiteUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover={{ scale: 1.1, opacity: 0.8 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: "50%",
                                                            backgroundColor: socialIconBackgroundColor,
                                                            color: socialIconColor || textColor,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {websiteIcon ? (
                                                            <img
                                                                src={websiteIcon.src}
                                                                alt="Website"
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    objectFit: "contain",
                                                                }}
                                                            />
                                                        ) : (
                                                            <svg
                                                                width="20"
                                                                height="20"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="2" y1="12" x2="22" y2="12" />
                                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                            </svg>
                                                        )}
                                                    </motion.a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </Portal>
            )}
        </>
    )
}

addPropertyControls(TeamCardDrawer, {
    // Content Section
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
            },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Sarah Chen",
            },
            role: {
                type: ControlType.String,
                title: "Role",
                defaultValue: "Product Designer",
            },
            bio: {
                type: ControlType.String,
                title: "Bio",
                defaultValue:
                    "Sarah is a passionate product designer with over 8 years of experience in creating user-centric digital experiences. She specializes in UI/UX design, design systems, and prototyping. \n\nWhen she's not designing, you can find her exploring local coffee shops or hiking in the mountains.",
                displayTextArea: true,
            },
        },
    },
    // Card Settings
    cardSettings: {
        type: ControlType.Object,
        title: "Card Settings",
        controls: {
            cardBackgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#f5f5f5",
            },
            cardTextAlign: {
                type: ControlType.Enum,
                title: "Text Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 40,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 24,
                min: 0,
                max: 60,
            },
        },
    },
    // Drawer Settings
    drawerSettings: {
        type: ControlType.Object,
        title: "Drawer Settings",
        controls: {
            drawerPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "right",
                displaySegmentedControl: true,
            },
            drawerWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 480,
                min: 280,
                max: 800,
                step: 10,
                unit: "px",
            },
            drawerBackgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ffffff",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#111111",
            },
            roleColor: {
                type: ControlType.Color,
                title: "Role Color",
                defaultValue: "#666666",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "rgba(0, 0, 0, 0.6)",
            },
            dividerColor: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "rgba(0,0,0,0.1)",
            },
            drawerTextAlign: {
                type: ControlType.Enum,
                title: "Text Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
            },
            closeIcon: {
                type: ControlType.ResponsiveImage,
                title: "Close Icon",
            },
        },
    },
    // Social Links
    socialLinks: {
        type: ControlType.Object,
        title: "Social Links",
        controls: {
            showSocialLinks: {
                type: ControlType.Boolean,
                title: "Show Links",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            linkedinUrl: {
                type: ControlType.String,
                title: "LinkedIn URL",
                defaultValue: "https://linkedin.com/in/sarahchen",
                placeholder: "https://linkedin.com/in/username",
            },
            twitterUrl: {
                type: ControlType.String,
                title: "Twitter URL",
                defaultValue: "https://twitter.com/sarahchen",
                placeholder: "https://twitter.com/username",
            },
            websiteUrl: {
                type: ControlType.String,
                title: "Website",
                placeholder: "https://...",
            },
            linkedinIcon: {
                type: ControlType.ResponsiveImage,
                title: "LinkedIn Icon",
            },
            twitterIcon: {
                type: ControlType.ResponsiveImage,
                title: "Twitter Icon",
            },
            websiteIcon: {
                type: ControlType.ResponsiveImage,
                title: "Website Icon",
            },
            socialIconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#0099FF",
            },
            socialIconBackgroundColor: {
                type: ControlType.Color,
                title: "Icon Background",
                defaultValue: "rgba(0,0,0,0.05)",
            },
        },
    },
    // Typography
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Card Name",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 24,
                    variant: "Semibold",
                    lineHeight: 1.2,
                },
            },
            roleFont: {
                type: ControlType.Font,
                title: "Card Role",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 16,
                    variant: "Regular",
                    lineHeight: 1.4,
                },
            },
            overlayNameFont: {
                type: ControlType.Font,
                title: "Drawer Name",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 32,
                    variant: "Semibold",
                    lineHeight: 1.2,
                },
            },
            overlayRoleFont: {
                type: ControlType.Font,
                title: "Drawer Role",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 18,
                    variant: "Regular",
                    lineHeight: 1.4,
                },
            },
            bioFont: {
                type: ControlType.Font,
                title: "Bio",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 16,
                    variant: "Regular",
                    lineHeight: 1.6,
                },
            },
        },
    },
})

// Default props for the image to match the user's request
TeamCardDrawer.defaultProps = {
    image: {
        src: "https://framerusercontent.com/images/g43EoxeHdRTao6sN7V8vlMO1A.png",
        alt: "Team Member",
    },
}