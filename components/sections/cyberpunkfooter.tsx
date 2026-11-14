// Cyberpunk/neon footer with terminal aesthetic, ASCII dividers, blinking elements, and scanline overlay
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
import { useState, type CSSProperties } from "react"

interface CyberpunkFooterProps {
    logo: { src: string; alt: string }
    logoUrl: string
    companyName: string
    companyUrl: string
    tagline: string
    leftLabel: string
    centerLabel: string
    rightLabel: string
    links: Array<{ label: string; url: string }>
    socialLinks: Array<{ label: string; url: string }>
    copyrightText: string
    version: string
    neonGreen: string
    darkGreen: string
    backgroundColor: string
    style?: CSSProperties
    useImageLogo: boolean
    textLogo: string
    logoSize: number
    textLogoSize: number
    textLogoColor: string
    labelFontSize: number
    contentFontSize: number
    linkFontSize: number
    copyrightFontSize: number
    footerPadding: number
    columnGap: number
    sectionSpacing: number
    lineSpacing: number
    dividerChar: string
}

/**
 * Cyberpunk Footer
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CyberpunkFooter(props: CyberpunkFooterProps) {
    const {
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        logoUrl,
        companyName,
        companyUrl,
        tagline,
        leftLabel,
        centerLabel,
        rightLabel,
        links,
        socialLinks,
        copyrightText,
        version,
        neonGreen,
        darkGreen,
        backgroundColor,
        useImageLogo,
        textLogo,
        logoSize,
        textLogoSize,
        textLogoColor,
        labelFontSize,
        contentFontSize,
        linkFontSize,
        copyrightFontSize,
        footerPadding,
        columnGap,
        sectionSpacing,
        lineSpacing,
        dividerChar,
    } = props

    const [hoveredLink, setHoveredLink] = useState<number | null>(null)

    return (
        <footer
            style={{
                width: "100%",
                backgroundColor,
                color: "#FFFFFF",
                fontFamily: "'Courier New', Courier, monospace",
                position: "relative",
                overflow: "hidden",
                padding: `${footerPadding}px 20px`,
            }}
        >
            {/* Scanline overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `repeating-linear-gradient(
                        0deg,
                        rgba(0, 0, 0, 0.15),
                        rgba(0, 0, 0, 0.15) 1px,
                        transparent 1px,
                        transparent 2px
                    )`,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto" }}>
                {/* ASCII Divider */}
                <div
                    style={{
                        color: neonGreen,
                        fontSize: "14px",
                        marginBottom: `${sectionSpacing}px`,
                        overflow: "hidden",
                        textAlign: "center",
                        letterSpacing: "0.05em",
                    }}
                >
                    {dividerChar.repeat(80)}
                </div>

                {/* Three Columns */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: `${columnGap}px`,
                        marginBottom: `${sectionSpacing}px`,
                    }}
                >
                    {/* LEFT Column - System Info */}
                    <div>
                        <div
                            style={{
                                color: neonGreen,
                                fontSize: `${labelFontSize}px`,
                                fontWeight: "bold",
                                marginBottom: `${lineSpacing}px`,
                                letterSpacing: "0.1em",
                            }}
                        >
                            {leftLabel}
                        </div>
                        <div style={{ fontSize: `${contentFontSize}px`, lineHeight: "1.6" }}>
                            {/* Logo */}
                            {useImageLogo ? (
                                logo.src && (
                                    <a
                                        href={logoUrl}
                                        style={{
                                            display: "block",
                                            marginBottom: `${lineSpacing}px`,
                                            transition: "opacity 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = "0.8"
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = "1"
                                        }}
                                    >
                                        <img
                                            src={logo.src}
                                            alt={logo.alt}
                                            style={{
                                                width: `${logoSize}px`,
                                                height: "auto",
                                                display: "block",
                                            }}
                                        />
                                    </a>
                                )
                            ) : (
                                <a
                                    href={logoUrl}
                                    style={{
                                        display: "block",
                                        marginBottom: `${lineSpacing}px`,
                                        fontSize: `${textLogoSize}px`,
                                        fontWeight: "bold",
                                        color: textLogoColor,
                                        textDecoration: "none",
                                        transition: "text-shadow 0.2s",
                                        letterSpacing: "0.1em",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.textShadow = `0 0 15px ${textLogoColor}`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.textShadow = "0 0 0px transparent"
                                    }}
                                >
                                    {textLogo}
                                </a>
                            )}
                            <a
                                href={companyUrl}
                                style={{
                                    display: "block",
                                    marginBottom: `${lineSpacing / 2}px`,
                                    fontWeight: "bold",
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    transition: "text-shadow 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.textShadow = `0 0 10px ${neonGreen}`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.textShadow = "0 0 0px transparent"
                                }}
                            >
                                {companyName}
                            </a>
                            <div style={{ marginBottom: `${lineSpacing}px`, opacity: 0.8 }}>{tagline}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>STATUS: ONLINE</span>
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    style={{ color: neonGreen, fontSize: "16px" }}
                                >
                                    ●
                                </motion.span>
                            </div>
                        </div>
                    </div>

                    {/* CENTER Column - Links */}
                    <div>
                        <div
                            style={{
                                color: neonGreen,
                                fontSize: `${labelFontSize}px`,
                                fontWeight: "bold",
                                marginBottom: `${lineSpacing}px`,
                                letterSpacing: "0.1em",
                            }}
                        >
                            {centerLabel}
                        </div>
                        <div style={{ fontSize: `${linkFontSize}px`, lineHeight: "1.8" }}>
                            {links.map((link, index) => (
                                <motion.a
                                    key={index}
                                    href={link.url}
                                    onMouseEnter={() => setHoveredLink(index)}
                                    onMouseLeave={() => setHoveredLink(null)}
                                    animate={{
                                        opacity: hoveredLink === index ? [0.5, 1, 0.7, 1] : 1,
                                        textShadow:
                                            hoveredLink === index
                                                ? `0 0 10px ${neonGreen}`
                                                : "0 0 0px transparent",
                                    }}
                                    transition={{
                                        opacity: { duration: 0.3 },
                                        textShadow: { duration: 0.2 },
                                    }}
                                    style={{
                                        display: "block",
                                        color: neonGreen,
                                        textDecoration: "none",
                                        marginBottom: `${lineSpacing / 2}px`,
                                    }}
                                >
                                    {`> ${link.label}`}
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT Column - Social */}
                    <div>
                        <div
                            style={{
                                color: neonGreen,
                                fontSize: `${labelFontSize}px`,
                                fontWeight: "bold",
                                marginBottom: `${lineSpacing}px`,
                                letterSpacing: "0.1em",
                            }}
                        >
                            {rightLabel}
                        </div>
                        <div style={{ fontSize: `${linkFontSize}px`, lineHeight: "1.8" }}>
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    style={{
                                        display: "block",
                                        color: neonGreen,
                                        textDecoration: "none",
                                        marginBottom: `${lineSpacing / 2}px`,
                                        transition: "text-shadow 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.textShadow = `0 0 10px ${neonGreen}`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.textShadow = "0 0 0px transparent"
                                    }}
                                >
                                    {`$ open ${social.label}`}
                                </a>
                            ))}
                            <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                style={{ color: neonGreen, fontSize: `${linkFontSize}px` }}
                            >
                                █
                            </motion.span>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div
                    style={{
                        textAlign: "center",
                        fontSize: `${copyrightFontSize}px`,
                        color: darkGreen,
                        paddingTop: `${sectionSpacing / 2}px`,
                        borderTop: `1px solid ${darkGreen}`,
                        letterSpacing: "0.05em",
                    }}
                >
                    {`© ${copyrightText} // ALL RIGHTS RESERVED // v${version}`}
                </div>
            </div>
        </footer>
    )
}

addPropertyControls(CyberpunkFooter, {
    useImageLogo: {
        type: ControlType.Boolean,
        title: "Logo Type",
        defaultValue: true,
        enabledTitle: "Image",
        disabledTitle: "Text",
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ useImageLogo }) => !useImageLogo,
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 120,
        min: 40,
        max: 300,
        step: 10,
        unit: "px",
        hidden: ({ useImageLogo }) => !useImageLogo,
    },
    textLogo: {
        type: ControlType.String,
        title: "Text Logo",
        defaultValue: "CYBERTECH",
        hidden: ({ useImageLogo }) => useImageLogo,
    },
    textLogoSize: {
        type: ControlType.Number,
        title: "Text Logo Size",
        defaultValue: 20,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        hidden: ({ useImageLogo }) => useImageLogo,
    },
    textLogoColor: {
        type: ControlType.Color,
        title: "Text Logo Color",
        defaultValue: "#00FF87",
        hidden: ({ useImageLogo }) => useImageLogo,
    },
    logoUrl: {
        type: ControlType.String,
        title: "Logo URL",
        defaultValue: "#",
    },
    companyName: {
        type: ControlType.String,
        title: "Company Name",
        defaultValue: "CYBERTECH INDUSTRIES",
    },
    companyUrl: {
        type: ControlType.String,
        title: "Company URL",
        defaultValue: "#",
    },
    tagline: {
        type: ControlType.String,
        title: "Tagline",
        defaultValue: "Neural networks & digital futures",
    },
    dividerChar: {
        type: ControlType.String,
        title: "Divider Character",
        defaultValue: "─",
        placeholder: "Enter character",
    },
    leftLabel: {
        type: ControlType.String,
        title: "Left Label",
        defaultValue: "SYS.INFO",
    },
    centerLabel: {
        type: ControlType.String,
        title: "Center Label",
        defaultValue: "SYS.LINKS",
    },
    rightLabel: {
        type: ControlType.String,
        title: "Right Label",
        defaultValue: "SYS.CONNECT",
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
            { label: "about.exe", url: "#about" },
            { label: "services.sys", url: "#services" },
            { label: "contact.bat", url: "#contact" },
            { label: "privacy.log", url: "#privacy" },
        ],
    },
    socialLinks: {
        type: ControlType.Array,
        title: "Social Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "social",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "twitter", url: "https://twitter.com" },
            { label: "github", url: "https://github.com" },
            { label: "discord", url: "https://discord.com" },
        ],
    },
    copyrightText: {
        type: ControlType.String,
        title: "Copyright",
        defaultValue: "2025 BRAND",
    },
    version: {
        type: ControlType.String,
        title: "Version",
        defaultValue: "2.1.0",
    },
    labelFontSize: {
        type: ControlType.Number,
        title: "Label Font Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
        unit: "px",
    },
    contentFontSize: {
        type: ControlType.Number,
        title: "Content Font Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    linkFontSize: {
        type: ControlType.Number,
        title: "Link Font Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    copyrightFontSize: {
        type: ControlType.Number,
        title: "Copyright Font Size",
        defaultValue: 12,
        min: 8,
        max: 20,
        step: 1,
        unit: "px",
    },
    footerPadding: {
        type: ControlType.Number,
        title: "Footer Padding",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    sectionSpacing: {
        type: ControlType.Number,
        title: "Section Spacing",
        defaultValue: 40,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    lineSpacing: {
        type: ControlType.Number,
        title: "Line Spacing",
        defaultValue: 16,
        min: 4,
        max: 40,
        step: 2,
        unit: "px",
    },
    neonGreen: {
        type: ControlType.Color,
        title: "Neon Green",
        defaultValue: "#00FF87",
    },
    darkGreen: {
        type: ControlType.Color,
        title: "Dark Green",
        defaultValue: "#00AA55",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
