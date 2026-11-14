// 5-column magazine-style footer with responsive layout
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition } from "react"

interface FooterProps {
    backgroundType: "color" | "image" | "video"
    backgroundColor: string
    backgroundImage: { src: string; alt?: string }
    backgroundVideo: string
    backgroundOverlay: boolean
    backgroundOverlayColor: string
    backgroundOverlayOpacity: number
    logo: string
    logoUrl: string
    tagline: string
    socialIconColor: string
    socialIconHoverColor: string
    socialLinks: Array<{ platform: string; url: string }>
    sections: Array<{
        title: string
        links: Array<{ label: string; url: string }>
    }>
    sectionTitleColor: string
    linkColor: string
    linkHoverColor: string
    newsletterHeading: string
    newsletterHeadingFont: any
    buttonColor: string
    buttonTextColor: string
    copyrightText: string
    privacyText: string
    privacyUrl: string
    termsText: string
    termsUrl: string
    sectionTitleFont: any
    linkFont: any
    taglineFont: any
    bottomTextFont: any
    buttonFont: any
    paddingTop: number
    paddingBottom: number
    paddingHorizontal: number
    columnGap: number
    sectionMarginBottom: number
    mobilePaddingTop: number
    mobilePaddingBottom: number
    mobilePaddingHorizontal: number
    tabletBreakpoint: number
    mobileBreakpoint: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagazineFooter(props: FooterProps) {
    const {
        backgroundType = "color",
        backgroundColor = "#F8F8F6",
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Background"
        },
        backgroundVideo = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        backgroundOverlay,
        backgroundOverlayColor,
        backgroundOverlayOpacity,
        logo,
        logoUrl,
        tagline,
        socialIconColor,
        socialIconHoverColor,
        socialLinks,
        sections,
        sectionTitleColor,
        linkColor,
        linkHoverColor,
        newsletterHeading,
        newsletterHeadingFont,
        buttonColor,
        buttonTextColor,
        copyrightText,
        privacyText,
        privacyUrl,
        termsText,
        termsUrl,
        sectionTitleFont,
        linkFont,
        taglineFont,
        bottomTextFont,
        buttonFont,
        paddingTop,
        paddingBottom,
        paddingHorizontal,
        columnGap,
        sectionMarginBottom,
        mobilePaddingTop,
        mobilePaddingBottom,
        mobilePaddingHorizontal,
        tabletBreakpoint,
        mobileBreakpoint,
    } = props

    const [email, setEmail] = useState("")
    const [hoveredLink, setHoveredLink] = useState<string | null>(null)
    const [hoveredSocial, setHoveredSocial] = useState<string | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Newsletter signup:", email)
        startTransition(() => setEmail(""))
    }

    const socialIcons = [
        { name: "twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
        { name: "linkedin", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
        { name: "instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M7.5 2h9A5.5 5.5 0 0122 7.5v9a5.5 5.5 0 01-5.5 5.5h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2z" },
        { name: "youtube", path: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33zM9.75 15.02l0-6.53 5.75 3.27z" }
    ]

    return (
        <footer
            style={{
                width: "100%",
                backgroundColor: backgroundType === "color" ? backgroundColor : "transparent",
                padding: `${paddingTop}px ${paddingHorizontal}px ${paddingBottom}px`,
                fontFamily: "Inter, -apple-system, sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background Media */}
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
                    role="img"
                    aria-label={backgroundImage.alt || "Background image"}
                />
            )}
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
                    aria-label="Background video"
                >
                    <source src={backgroundVideo} type="video/mp4" />
                </video>
            )}
            {backgroundType !== "color" && backgroundOverlay && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: backgroundOverlayColor,
                        opacity: backgroundOverlayOpacity,
                        zIndex: 1,
                    }}
                />
            )}

            <div
                style={{
                    maxWidth: "1280px",
                    margin: "0 auto",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {/* Main Footer Content */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1.2fr",
                        gap: `${columnGap}px`,
                        marginBottom: `${sectionMarginBottom}px`,
                    }}
                    className="footer-grid"
                >
                    {/* Column 1: Logo & Social */}
                    <div>
                        <a
                            href={logoUrl}
                            style={{
                                fontSize: "24px",
                                fontWeight: 700,
                                color: "#111",
                                marginBottom: "12px",
                                display: "block",
                                textDecoration: "none",
                            }}
                        >
                            {logo}
                        </a>
                        <p
                            style={{
                                ...taglineFont,
                                color: "#666",
                                margin: 0,
                                marginBottom: "24px",
                            }}
                        >
                            {tagline}
                        </p>
                        <div style={{ display: "flex", gap: "16px" }}>
                            {socialLinks.map((social, idx) => {
                                const icon = socialIcons.find(i => i.name === social.platform)
                                if (!icon) return null
                                return (
                                    <a
                                        key={idx}
                                        href={social.url}
                                        onMouseEnter={() => startTransition(() => setHoveredSocial(social.platform))}
                                        onMouseLeave={() => startTransition(() => setHoveredSocial(null))}
                                        style={{
                                            color: hoveredSocial === social.platform ? socialIconHoverColor : socialIconColor,
                                            transition: "color 0.2s ease",
                                            textDecoration: "none",
                                        }}
                                        aria-label={social.platform}
                                    >
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
                                            <path d={icon.path} />
                                        </svg>
                                    </a>
                                )
                            })}
                        </div>
                    </div>

                    {/* Columns 2-4: Link Sections */}
                    {sections.map((section, idx) => (
                        <div key={idx}>
                            <h3
                                style={{
                                    ...sectionTitleFont,
                                    color: sectionTitleColor,
                                    margin: 0,
                                    marginBottom: "16px",
                                }}
                            >
                                {section.title}
                            </h3>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {section.links.map((link, linkIdx) => (
                                    <li key={linkIdx}>
                                        <a
                                            href={link.url}
                                            onMouseEnter={() => startTransition(() => setHoveredLink(`${idx}-${linkIdx}`))}
                                            onMouseLeave={() => startTransition(() => setHoveredLink(null))}
                                            style={{
                                                ...linkFont,
                                                color: hoveredLink === `${idx}-${linkIdx}` ? linkHoverColor : linkColor,
                                                textDecoration: "none",
                                                transition: "color 0.2s ease",
                                            }}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Column 5: Newsletter */}
                    <div>
                        <h3
                            style={{
                                ...newsletterHeadingFont,
                                color: "#111",
                                margin: 0,
                                marginBottom: "16px",
                            }}
                        >
                            {newsletterHeading}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => startTransition(() => setEmail(e.target.value))}
                                style={{
                                    padding: "10px 12px",
                                    fontSize: "13px",
                                    border: "1px solid #DDD",
                                    borderRadius: "4px",
                                    outline: "none",
                                    width: "100%",
                                    boxSizing: "border-box",
                                }}
                                aria-label="Email address"
                            />
                            <button
                                type="submit"
                                style={{
                                    ...buttonFont,
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor,
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    width: "100%",
                                }}
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Row */}
                <div
                    style={{
                        borderTop: "1px solid #DDD",
                        paddingTop: "24px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                    }}
                >
                    <p
                        style={{
                            ...bottomTextFont,
                            color: "#666",
                            margin: 0,
                        }}
                    >
                        {copyrightText}
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <a
                            href={privacyUrl}
                            style={{
                                ...bottomTextFont,
                                color: "#666",
                                textDecoration: "none",
                            }}
                        >
                            {privacyText}
                        </a>
                        <span style={{ color: "#666" }}>·</span>
                        <a
                            href={termsUrl}
                            style={{
                                ...bottomTextFont,
                                color: "#666",
                                textDecoration: "none",
                            }}
                        >
                            {termsText}
                        </a>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: ${tabletBreakpoint}px) {
                    .footer-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
                @media (max-width: ${mobileBreakpoint}px) {
                    .footer-grid {
                        grid-template-columns: 1fr !important;
                    }
                    footer {
                        padding: ${mobilePaddingTop}px ${mobilePaddingHorizontal}px ${mobilePaddingBottom}px !important;
                    }
                }
            `}</style>
        </footer>
    )
}

addPropertyControls(MagazineFooter, {
    backgroundType: {
        type: ControlType.Enum,
        title: "BG Type",
        options: ["color", "image", "video"],
        optionTitles: ["Color", "Image", "Video"],
        defaultValue: "color",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F8F8F6",
        hidden: ({ backgroundType }) => backgroundType !== "color",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "BG Image",
        hidden: ({ backgroundType }) => backgroundType !== "image",
    },
    backgroundVideo: {
        type: ControlType.File,
        title: "BG Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ backgroundType }) => backgroundType !== "video",
    },
    backgroundOverlay: {
        type: ControlType.Boolean,
        title: "BG Overlay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ backgroundType }) => backgroundType === "color",
    },
    backgroundOverlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
        hidden: ({ backgroundType, backgroundOverlay }) => backgroundType === "color" || !backgroundOverlay,
    },
    backgroundOverlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ backgroundType, backgroundOverlay }) => backgroundType === "color" || !backgroundOverlay,
    },
    logo: {
        type: ControlType.String,
        title: "Logo",
        defaultValue: "BRAND",
    },
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue: "/",
    },
    tagline: {
        type: ControlType.String,
        title: "Tagline",
        displayTextArea: true,
        defaultValue: "Crafting digital experiences\nthat inspire and engage.",
    },
    taglineFont: {
        type: ControlType.Font,
        title: "Tagline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.6em",
        },
    },
    socialIconColor: {
        type: ControlType.Color,
        title: "Social Icon",
        defaultValue: "#777777",
    },
    socialIconHoverColor: {
        type: ControlType.Color,
        title: "Social Hover",
        defaultValue: "#000000",
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
                    options: ["twitter", "linkedin", "instagram", "youtube"],
                    optionTitles: ["Twitter", "LinkedIn", "Instagram", "YouTube"],
                    defaultValue: "twitter",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { platform: "twitter", url: "https://twitter.com" },
            { platform: "linkedin", url: "https://linkedin.com" },
            { platform: "instagram", url: "https://instagram.com" },
            { platform: "youtube", url: "https://youtube.com" },
        ],
    },
    sections: {
        type: ControlType.Array,
        title: "Link Sections",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Section Title",
                    defaultValue: "SECTION",
                },
                links: {
                    type: ControlType.Array,
                    title: "Links",
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
                        { label: "Link 1", url: "#" },
                        { label: "Link 2", url: "#" },
                    ],
                },
            },
        },
        maxCount: 10,
        defaultValue: [
            {
                title: "PRODUCT",
                links: [
                    { label: "Features", url: "#" },
                    { label: "Pricing", url: "#" },
                    { label: "Integrations", url: "#" },
                    { label: "Updates", url: "#" },
                    { label: "Roadmap", url: "#" },
                ],
            },
            {
                title: "COMPANY",
                links: [
                    { label: "About", url: "#" },
                    { label: "Careers", url: "#" },
                    { label: "Blog", url: "#" },
                    { label: "Press", url: "#" },
                    { label: "Contact", url: "#" },
                ],
            },
            {
                title: "RESOURCES",
                links: [
                    { label: "Documentation", url: "#" },
                    { label: "Help Center", url: "#" },
                    { label: "Community", url: "#" },
                    { label: "Templates", url: "#" },
                    { label: "API", url: "#" },
                ],
            },
        ],
    },
    sectionTitleFont: {
        type: ControlType.Font,
        title: "Section Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Bold",
            letterSpacing: "0.15em",
        },
    },
    sectionTitleColor: {
        type: ControlType.Color,
        title: "Section Title",
        defaultValue: "#999999",
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "2.2em",
        },
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link Color",
        defaultValue: "#444444",
    },
    linkHoverColor: {
        type: ControlType.Color,
        title: "Link Hover",
        defaultValue: "#111111",
    },
    newsletterHeading: {
        type: ControlType.String,
        title: "Newsletter Title",
        defaultValue: "Stay in the loop",
    },
    newsletterHeadingFont: {
        type: ControlType.Font,
        title: "Newsletter Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
        },
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
    copyrightText: {
        type: ControlType.String,
        title: "Copyright",
        defaultValue: "© 2024 Brand. All rights reserved.",
    },
    privacyText: {
        type: ControlType.String,
        title: "Privacy Text",
        defaultValue: "Privacy Policy",
    },
    privacyUrl: {
        type: ControlType.String,
        title: "Privacy URL",
        defaultValue: "/privacy",
    },
    termsText: {
        type: ControlType.String,
        title: "Terms Text",
        defaultValue: "Terms",
    },
    termsUrl: {
        type: ControlType.String,
        title: "Terms URL",
        defaultValue: "/terms",
    },
    bottomTextFont: {
        type: ControlType.Font,
        title: "Bottom Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
        },
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 72,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding Horizontal",
        defaultValue: 64,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 48,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    sectionMarginBottom: {
        type: ControlType.Number,
        title: "Section Margin",
        defaultValue: 48,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
    },
    mobilePaddingTop: {
        type: ControlType.Number,
        title: "Mobile Padding Top",
        defaultValue: 48,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    mobilePaddingBottom: {
        type: ControlType.Number,
        title: "Mobile Padding Bottom",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    mobilePaddingHorizontal: {
        type: ControlType.Number,
        title: "Mobile Padding Horizontal",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 1024,
        min: 600,
        max: 1400,
        step: 1,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 800,
        step: 1,
        unit: "px",
    },
})
