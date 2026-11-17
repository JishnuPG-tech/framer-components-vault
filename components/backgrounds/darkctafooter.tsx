// Dark CTA footer with gradient glow, email input, and fully customizable footer columns
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, type CSSProperties } from "react"

interface FooterLink {
    label: string
    url: string
}

interface FooterColumn {
    title: string
    titleUrl: string
    titleFont: CSSProperties
    titleColor: string
    linkFont: CSSProperties
    linkColor: string
}

interface SocialLink {
    platform: string
    url: string
}

interface DarkCTAFooterProps {
    showLogo: boolean
    logoType: "image" | "text"
    logoImage: { src: string; alt: string }
    logoText: string
    logoFont: CSSProperties
    logoColor: string
    logoUrl: string
    logoWidth: number
    headlineText: string
    headlineFont: CSSProperties
    subtitleText: string
    subtitleFont: CSSProperties
    subtitleColor: string
    inputPlaceholder: string
    buttonText: string
    buttonFont: CSSProperties
    submissionAction: "email" | "googleSheets" | "webhook" | "custom"
    emailAddress: string
    googleSheetsUrl: string
    webhookUrl: string
    customUrl: string
    backgroundType: "color" | "image" | "video"
    backgroundColor: string
    backgroundImage: { src: string; alt: string }
    backgroundVideo: string
    backgroundOverlay: boolean
    backgroundOverlayColor: string
    backgroundOverlayOpacity: number
    glowColor: string
    inputBackground: string
    inputBorderColor: string
    buttonGradientStart: string
    buttonGradientEnd: string
    footerColumns: FooterColumn[]
    column1Links: FooterLink[]
    column2Links: FooterLink[]
    column3Links: FooterLink[]
    column4Links: FooterLink[]
    copyrightText: string
    copyrightFont: CSSProperties
    copyrightColor: string
    dividerColor: string
    showSocialIcons: boolean
    socialLinks: SocialLink[]
    socialIconColor: string
    style?: CSSProperties
}

/**
 * Dark CTA Footer
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DarkCTAFooter(props: DarkCTAFooterProps) {
    const {
        showLogo,
        logoType,
        logoImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        logoText,
        logoFont,
        logoColor,
        logoUrl,
        logoWidth,
        headlineText,
        headlineFont,
        subtitleText,
        subtitleFont,
        subtitleColor,
        inputPlaceholder,
        buttonText,
        buttonFont,
        submissionAction,
        emailAddress,
        googleSheetsUrl,
        webhookUrl,
        customUrl,
        backgroundType,
        backgroundColor,
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Background",
        },
        backgroundVideo = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        backgroundOverlay,
        backgroundOverlayColor,
        backgroundOverlayOpacity,
        glowColor,
        inputBackground,
        inputBorderColor,
        buttonGradientStart,
        buttonGradientEnd,
        footerColumns,
        column1Links,
        column2Links,
        column3Links,
        column4Links,
        copyrightText,
        copyrightFont,
        copyrightColor,
        dividerColor,
        showSocialIcons,
        socialLinks,
        socialIconColor,
    } = props

    const [email, setEmail] = useState("")
    const [isHovered, setIsHovered] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile viewport
    useState(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => setIsMobile(window.innerWidth < 768))
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        // Handle different submission actions
        switch (submissionAction) {
            case "email":
                if (typeof window !== "undefined" && emailAddress) {
                    window.location.href = `mailto:${emailAddress}?subject=Newsletter Signup&body=Email: ${email}`
                }
                break
            case "googleSheets":
                if (typeof window !== "undefined" && googleSheetsUrl) {
                    // Open Google Sheets form or webhook
                    window.open(googleSheetsUrl, "_blank")
                }
                break
            case "webhook":
                if (webhookUrl) {
                    // Send data to webhook
                    fetch(webhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    }).catch((err) => console.error("Webhook error:", err))
                }
                break
            case "custom":
                if (typeof window !== "undefined" && customUrl) {
                    window.open(customUrl, "_blank")
                }
                break
        }
        
        console.log("Email submitted:", email)
    }

    // Responsive font sizes
    const responsiveHeadlineSize = isMobile
        ? `${Math.max(32, parseInt(headlineFont.fontSize as string) * 0.6)}px`
        : headlineFont.fontSize
    const responsiveSubtitleSize = isMobile
        ? `${Math.max(14, parseInt(subtitleFont.fontSize as string) * 0.875)}px`
        : subtitleFont.fontSize
    const responsiveLogoWidth = isMobile ? Math.max(80, logoWidth * 0.7) : logoWidth

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                backgroundColor: backgroundType === "color" ? backgroundColor : "transparent",
                overflow: "hidden",
                padding: isMobile ? "60px 20px 32px" : "80px 24px 40px",
            }}
        >
            {/* Background Image */}
            {backgroundType === "image" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${backgroundImage.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Background Video */}
            {backgroundType === "video" && (
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                    }}
                >
                    <source src={backgroundVideo} type="video/mp4" />
                </video>
            )}

            {/* Background Overlay */}
            {backgroundOverlay && backgroundType !== "color" && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: backgroundOverlayColor,
                        opacity: backgroundOverlayOpacity,
                        zIndex: 0,
                    }}
                />
            )}

            {/* Radial gradient glow */}
            <div
                style={{
                    position: "absolute",
                    top: "0",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: isMobile ? "400px" : "600px",
                    height: isMobile ? "400px" : "600px",
                    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Content container */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >
                {/* Logo Section */}
                {showLogo && (
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: isMobile ? "40px" : "60px",
                        }}
                    >
                        <a
                            href={logoUrl}
                            style={{
                                display: "inline-block",
                                transition: "opacity 0.2s ease",
                                textDecoration: "none",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                        >
                            {logoType === "image" ? (
                                <img
                                    src={logoImage.src}
                                    alt={logoImage.alt}
                                    style={{
                                        width: `${responsiveLogoWidth}px`,
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <span
                                    style={{
                                        color: logoColor,
                                        ...logoFont,
                                        display: "block",
                                    }}
                                >
                                    {logoText}
                                </span>
                            )}
                        </a>
                    </div>
                )}

                {/* CTA Section */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: isMobile ? "60px" : "80px",
                    }}
                >
                    {/* Headline */}
                    <h2
                        style={{
                            margin: isMobile ? "0 0 12px 0" : "0 0 16px 0",
                            color: "#FFFFFF",
                            ...headlineFont,
                            fontSize: responsiveHeadlineSize,
                        }}
                    >
                        {headlineText}
                    </h2>

                    {/* Subtitle */}
                    <p
                        style={{
                            margin: isMobile ? "0 0 32px 0" : "0 0 40px 0",
                            color: subtitleColor,
                            ...subtitleFont,
                            fontSize: responsiveSubtitleSize,
                        }}
                    >
                        {subtitleText}
                    </p>

                    {/* Email input form */}
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            maxWidth: "480px",
                            margin: "0 auto",
                            display: "flex",
                            gap: "0",
                            flexDirection: isMobile ? "column" : "row",
                        }}
                    >
                        <input
                            type="email"
                            placeholder={inputPlaceholder}
                            value={email}
                            onChange={(e) => startTransition(() => setEmail(e.target.value))}
                            style={{
                                flex: "1",
                                minWidth: isMobile ? "100%" : "200px",
                                padding: isMobile ? "14px 20px" : "16px 24px",
                                backgroundColor: inputBackground,
                                border: `1px solid ${inputBorderColor}`,
                                borderRadius: isMobile ? "9999px" : "9999px 0 0 9999px",
                                color: "#FFFFFF",
                                fontSize: isMobile ? "14px" : "15px",
                                outline: "none",
                                fontFamily: "inherit",
                            }}
                        />
                        <button
                            type="submit"
                            onMouseEnter={() => startTransition(() => setIsHovered(true))}
                            onMouseLeave={() => startTransition(() => setIsHovered(false))}
                            style={{
                                padding: isMobile ? "14px 28px" : "16px 32px",
                                background: `linear-gradient(135deg, ${buttonGradientStart} 0%, ${buttonGradientEnd} 100%)`,
                                border: "none",
                                borderRadius: isMobile ? "9999px" : "0 9999px 9999px 0",
                                color: "#FFFFFF",
                                cursor: "pointer",
                                transition: "filter 0.2s ease",
                                filter: isHovered ? "brightness(1.2)" : "brightness(1)",
                                whiteSpace: "nowrap",
                                marginTop: isMobile ? "12px" : "0",
                                width: isMobile ? "100%" : "auto",
                                ...buttonFont,
                                fontSize: isMobile ? "14px" : buttonFont.fontSize,
                            }}
                        >
                            {buttonText}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                            ? "repeat(2, 1fr)"
                            : `repeat(${footerColumns.length}, 1fr)`,
                        gap: isMobile ? "32px 24px" : "40px",
                        marginBottom: isMobile ? "48px" : "60px",
                    }}
                >
                    {footerColumns.map((column, idx) => {
                        // Get the appropriate links array based on column index
                        let columnLinks: FooterLink[] = []
                        if (idx === 0) columnLinks = column1Links || []
                        else if (idx === 1) columnLinks = column2Links || []
                        else if (idx === 2) columnLinks = column3Links || []
                        else if (idx === 3) columnLinks = column4Links || []
                        
                        return (
                            <div key={idx}>
                                <a
                                    href={column.titleUrl}
                                    style={{
                                        display: "block",
                                        margin: isMobile ? "0 0 12px 0" : "0 0 16px 0",
                                        color: column.titleColor,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        textDecoration: "none",
                                        transition: "opacity 0.2s ease",
                                        ...column.titleFont,
                                        fontSize: isMobile
                                            ? `${Math.max(12, parseInt(column.titleFont.fontSize as string) * 0.9)}px`
                                            : column.titleFont.fontSize,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                >
                                    {column.title}
                                </a>
                                <ul
                                    style={{
                                        listStyle: "none",
                                        padding: 0,
                                        margin: 0,
                                    }}
                                >
                                    {columnLinks.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            style={{ marginBottom: isMobile ? "10px" : "12px" }}
                                        >
                                            <a
                                                href={link.url}
                                                style={{
                                                    color: column.linkColor,
                                                    textDecoration: "none",
                                                    transition: "opacity 0.2s ease",
                                                    ...column.linkFont,
                                                    fontSize: isMobile
                                                        ? `${Math.max(12, parseInt(column.linkFont.fontSize as string) * 0.9)}px`
                                                        : column.linkFont.fontSize,
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.opacity = "1")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.opacity = "0.6")
                                                }
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: "1px",
                        backgroundColor: dividerColor,
                        marginBottom: isMobile ? "20px" : "24px",
                    }}
                />

                {/* Bottom section */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: isMobile ? "center" : "space-between",
                        alignItems: "center",
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? "20px" : "16px",
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            color: copyrightColor,
                            ...copyrightFont,
                            fontSize: isMobile ? "13px" : copyrightFont.fontSize,
                            textAlign: isMobile ? "center" : "left",
                        }}
                    >
                        {copyrightText}
                    </p>

                    {showSocialIcons && (
                        <div style={{ display: "flex", gap: isMobile ? "20px" : "16px" }}>
                            {socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.url}
                                    style={{
                                        color: socialIconColor,
                                        transition: "opacity 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        opacity: 0.6,
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.opacity = "0.6")
                                    }
                                    aria-label={social.platform}
                                >
                                    {social.platform === "Twitter" && (
                                        <svg
                                            width={isMobile ? "18" : "20"}
                                            height={isMobile ? "18" : "20"}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    )}
                                    {social.platform === "GitHub" && (
                                        <svg
                                            width={isMobile ? "18" : "20"}
                                            height={isMobile ? "18" : "20"}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                                        </svg>
                                    )}
                                    {social.platform === "LinkedIn" && (
                                        <svg
                                            width={isMobile ? "18" : "20"}
                                            height={isMobile ? "18" : "20"}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    )}
                                    {social.platform === "Instagram" && (
                                        <svg
                                            width={isMobile ? "18" : "20"}
                                            height={isMobile ? "18" : "20"}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                    )}
                                    {social.platform === "Facebook" && (
                                        <svg
                                            width={isMobile ? "18" : "20"}
                                            height={isMobile ? "18" : "20"}
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(DarkCTAFooter, {
    showLogo: {
        type: ControlType.Boolean,
        title: "Show Logo",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    logoType: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["image", "text"],
        optionTitles: ["Image", "Text"],
        defaultValue: "image",
        displaySegmentedControl: true,
        hidden: ({ showLogo }) => !showLogo,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ showLogo, logoType }) => !showLogo || logoType !== "image",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Company",
        hidden: ({ showLogo, logoType }) => !showLogo || logoType !== "text",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        hidden: ({ showLogo, logoType }) => !showLogo || logoType !== "text",
    },
    logoColor: {
        type: ControlType.Color,
        title: "Logo Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showLogo, logoType }) => !showLogo || logoType !== "text",
    },
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue: "#",
        hidden: ({ showLogo }) => !showLogo,
    },
    logoWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
        hidden: ({ showLogo, logoType }) => !showLogo || logoType !== "image",
    },
    headlineText: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Ready to get started?",
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Extra Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    subtitleText: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Join 10,000+ teams already using our platform",
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "rgba(255, 255, 255, 0.7)",
    },
    inputPlaceholder: {
        type: ControlType.String,
        title: "Input Placeholder",
        defaultValue: "Enter your email",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Get Started →",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    submissionAction: {
        type: ControlType.Enum,
        title: "Submission Action",
        options: ["email", "googleSheets", "webhook", "custom"],
        optionTitles: ["Email", "Google Sheets", "Webhook", "Custom URL"],
        defaultValue: "email",
    },
    emailAddress: {
        type: ControlType.String,
        title: "Email Address",
        defaultValue: "hello@example.com",
        hidden: ({ submissionAction }) => submissionAction !== "email",
    },
    googleSheetsUrl: {
        type: ControlType.String,
        title: "Google Sheets URL",
        defaultValue: "",
        hidden: ({ submissionAction }) => submissionAction !== "googleSheets",
    },
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        defaultValue: "",
        hidden: ({ submissionAction }) => submissionAction !== "webhook",
    },
    customUrl: {
        type: ControlType.String,
        title: "Custom URL",
        defaultValue: "",
        hidden: ({ submissionAction }) => submissionAction !== "custom",
    },
    backgroundType: {
        type: ControlType.Enum,
        title: "Background Type",
        options: ["color", "image", "video"],
        optionTitles: ["Color", "Image", "Video"],
        defaultValue: "color",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#080808",
        hidden: ({ backgroundType }) => backgroundType !== "color",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image",
        hidden: ({ backgroundType }) => backgroundType !== "image",
    },
    backgroundVideo: {
        type: ControlType.File,
        title: "Background Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ backgroundType }) => backgroundType !== "video",
    },
    backgroundOverlay: {
        type: ControlType.Boolean,
        title: "Background Overlay",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ backgroundType }) => backgroundType === "color",
    },
    backgroundOverlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ backgroundType, backgroundOverlay }) => backgroundType === "color" || !backgroundOverlay,
    },
    backgroundOverlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ backgroundType, backgroundOverlay }) => backgroundType === "color" || !backgroundOverlay,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(99, 102, 241, 0.3)",
    },
    inputBackground: {
        type: ControlType.Color,
        title: "Input Background",
        defaultValue: "#1a1a1a",
    },
    inputBorderColor: {
        type: ControlType.Color,
        title: "Input Border",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    buttonGradientStart: {
        type: ControlType.Color,
        title: "Button Gradient Start",
        defaultValue: "#6366f1",
    },
    buttonGradientEnd: {
        type: ControlType.Color,
        title: "Button Gradient End",
        defaultValue: "#8b5cf6",
    },
    footerColumns: {
        type: ControlType.Array,
        title: "Footer Columns",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Column Title",
                    defaultValue: "Product",
                },
                titleUrl: {
                    type: ControlType.String,
                    title: "Title URL",
                    defaultValue: "#",
                },
                titleFont: {
                    type: ControlType.Font,
                    title: "Title Font",
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    defaultValue: {
                        fontSize: "14px",
                        variant: "Semibold",
                        letterSpacing: "0em",
                        lineHeight: "1em",
                    },
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#FFFFFF",
                },
                linkFont: {
                    type: ControlType.Font,
                    title: "Link Font",
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    defaultValue: {
                        fontSize: "14px",
                        variant: "Regular",
                        letterSpacing: "0em",
                        lineHeight: "1.5em",
                    },
                },
                linkColor: {
                    type: ControlType.Color,
                    title: "Link Color",
                    defaultValue: "rgba(255, 255, 255, 0.6)",
                },
            },
        },
        defaultValue: [
            {
                title: "Product",
                titleUrl: "#",
                titleFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
                titleColor: "#FFFFFF",
                linkFont: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
                linkColor: "rgba(255, 255, 255, 0.6)",
            },
            {
                title: "Company",
                titleUrl: "#",
                titleFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
                titleColor: "#FFFFFF",
                linkFont: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
                linkColor: "rgba(255, 255, 255, 0.6)",
            },
            {
                title: "Resources",
                titleUrl: "#",
                titleFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
                titleColor: "#FFFFFF",
                linkFont: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
                linkColor: "rgba(255, 255, 255, 0.6)",
            },
            {
                title: "Legal",
                titleUrl: "#",
                titleFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "0em",
                    lineHeight: "1em",
                },
                titleColor: "#FFFFFF",
                linkFont: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
                linkColor: "rgba(255, 255, 255, 0.6)",
            },
        ],
    },
    column1Links: {
        type: ControlType.Array,
        title: "Column 1 Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "Features", url: "#" },
            { label: "Pricing", url: "#" },
            { label: "Security", url: "#" },
            { label: "Roadmap", url: "#" },
        ],
    },
    column2Links: {
        type: ControlType.Array,
        title: "Column 2 Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "About", url: "#" },
            { label: "Blog", url: "#" },
            { label: "Careers", url: "#" },
            { label: "Press", url: "#" },
        ],
    },
    column3Links: {
        type: ControlType.Array,
        title: "Column 3 Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "Documentation", url: "#" },
            { label: "Help Center", url: "#" },
            { label: "Community", url: "#" },
            { label: "Contact", url: "#" },
        ],
    },
    column4Links: {
        type: ControlType.Array,
        title: "Column 4 Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "Privacy", url: "#" },
            { label: "Terms", url: "#" },
            { label: "Cookie Policy", url: "#" },
            { label: "Licenses", url: "#" },
        ],
    },
    copyrightText: {
        type: ControlType.String,
        title: "Copyright",
        defaultValue: "© 2024 Company Name. All rights reserved.",
    },
    copyrightFont: {
        type: ControlType.Font,
        title: "Copyright Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    copyrightColor: {
        type: ControlType.Color,
        title: "Copyright Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    showSocialIcons: {
        type: ControlType.Boolean,
        title: "Social Icons",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    socialLinks: {
        type: ControlType.Array,
        title: "Social Links",
        control: {
            type: ControlType.Object,
            controls: {
                platform: {
                    type: ControlType.Enum,
                    title: "Platform",
                    options: ["Twitter", "GitHub", "LinkedIn", "Instagram", "Facebook"],
                    defaultValue: "Twitter",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { platform: "Twitter", url: "#" },
            { platform: "GitHub", url: "#" },
            { platform: "LinkedIn", url: "#" },
        ],
        hidden: ({ showSocialIcons }) => !showSocialIcons,
    },
    socialIconColor: {
        type: ControlType.Color,
        title: "Social Icon Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
        hidden: ({ showSocialIcons }) => !showSocialIcons,
    },
})