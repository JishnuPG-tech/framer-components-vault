// Animated logo marquee trust bar with infinite scrolling, hover effects, and configurable logos
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"
import { useRef, useState, useMemo, type CSSProperties, useEffect, startTransition } from "react"

interface Logo {
    name: string
    grayscaleImage: { src: string; srcSet?: string; alt?: string }
    colorImage: { src: string; srcSet?: string; alt?: string }
    link?: string
    description?: string
    popupTitle?: string
    popupDescription?: string
    backgroundColor?: string
    padding?: number
    cornerRadius?: number
}

interface LogoMarqueeProps {
    heading: string
    headingFont: CSSProperties
    headingColor: string
    logos: Logo[]
    useCMS: boolean
    cmsLogos?: any[]
    speed: "slow" | "medium" | "fast"
    variant: "dark" | "light"
    backgroundColor: string
    showGradientMask: boolean
    enableLinks: boolean
    logoBackgroundColor: string
    logoPadding: number
    logoCornerRadius: number
    logoSpacing: number
    numberOfRows: 1 | 2
    rowSpacing: number
    logoItemWidth: number
    logoItemHeight: number
    showHoverPopup: boolean
    popupPlacement: "top" | "bottom"
    popupFitToText: boolean
    popupWidth: number
    popupBackgroundColor: string
    popupTextColor: string
    popupBorderColor: string
    popupBorderWidth: number
    popupCornerRadius: number
    popupPadding: number
    popupGap: number
    popupOffset: number
    popupShadow: string
    popupTitleFont: CSSProperties
    popupDescriptionFont: CSSProperties
    popupShowDescription: boolean
    popupCtaLabel: string
    style?: CSSProperties
}

/**
 * Animated Logo Marquee Trust Bar
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LogoMarquee(props: LogoMarqueeProps) {
    const {
        heading = "Trusted by teams at",
        headingFont,
        headingColor = "#000000",
        logos = [],
        useCMS = false,
        cmsLogos = [],
        speed = "medium",
        variant = "light",
        backgroundColor = "#FFFFFF",
        showGradientMask = true,
        enableLinks = true,
        logoBackgroundColor = "transparent",
        logoPadding = 12,
        logoCornerRadius = 8,
        logoSpacing = 60,
        numberOfRows = 2,
        rowSpacing = 40,
        logoItemWidth = 140,
        logoItemHeight = 60,
        showHoverPopup = true,
        popupPlacement = "bottom",
        popupFitToText = true,
        popupWidth = 220,
        popupBackgroundColor = variant === "dark" ? "#FFFFFF" : "#000000",
        popupTextColor = variant === "dark" ? "#000000" : "#FFFFFF",
        popupBorderColor = "rgba(0,0,0,0.08)",
        popupBorderWidth = 1,
        popupCornerRadius = 10,
        popupPadding = 12,
        popupGap = 6,
        popupOffset = 12,
        popupShadow = "0 10px 30px rgba(0,0,0,0.18)",
        popupTitleFont,
        popupDescriptionFont,
        popupShowDescription = true,
        popupCtaLabel = "Visit",
    } = props

    const sectionRef = useRef(null)
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 })
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)

    // Detect screen size
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkScreenSize = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
                setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
            })
        }

        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)
        return () => window.removeEventListener("resize", checkScreenSize)
    }, [])

    // Speed mapping in seconds for full animation cycle
    const speedMap = {
        slow: 60,
        medium: 40,
        fast: 25,
    }

    // Adjust speed for mobile
    const animationDuration = isMobile ? speedMap[speed] * 1.5 : speedMap[speed]

    // Use CMS logos if enabled, otherwise use manual logos array
    const activeLogos = useMemo(() => {
        if (useCMS && cmsLogos && cmsLogos.length > 0) {
            return cmsLogos.map((item: any) => ({
                name: item.name || item.companyName || "Company",
                grayscaleImage: item.grayscaleImage || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "" },
                colorImage: item.colorImage || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "" },
                link: item.link || item.url || "",
                description: item.description || item.subtitle || "",
                popupTitle: item.popupTitle || item.tooltipTitle || "",
                popupDescription: item.popupDescription || item.tooltipDescription || "",
                backgroundColor: item.backgroundColor || "transparent",
                padding: item.padding !== undefined ? item.padding : 12,
                cornerRadius: item.cornerRadius !== undefined ? item.cornerRadius : 8,
            }))
        }
        return logos.length > 0 ? logos : getDefaultLogos()
    }, [useCMS, cmsLogos, logos])

    // Split logos into two rows (single row on mobile)
    const row1Logos = useMemo(() => {
        if (activeLogos.length === 0) return getDefaultLogos().slice(0, 6)
        if (isMobile || numberOfRows === 1) return activeLogos
        return activeLogos.slice(0, Math.ceil(activeLogos.length / 2))
    }, [activeLogos, isMobile, numberOfRows])

    const row2Logos = useMemo(() => {
        if (activeLogos.length === 0) return getDefaultLogos().slice(6, 12)
        if (isMobile || numberOfRows === 1) return []
        return activeLogos.slice(Math.ceil(activeLogos.length / 2))
    }, [activeLogos, isMobile, numberOfRows])

    const gradientColor = variant === "dark" ? "0, 0, 0" : "255, 255, 255"
    const maskGradient = showGradientMask
        ? `linear-gradient(to right, rgba(${gradientColor}, 1) 0%, rgba(${gradientColor}, 0) 5%, rgba(${gradientColor}, 0) 95%, rgba(${gradientColor}, 1) 100%)`
        : "none"

    // Responsive padding
    const sectionPadding = isMobile ? "40px 16px" : isTablet ? "50px 24px" : "60px 0"
    const headingMargin = isMobile ? 24 : isTablet ? 32 : 40

    return (
        <motion.div
            ref={sectionRef}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
                width: "100%",
                backgroundColor,
                padding: sectionPadding,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Heading */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: headingMargin,
                    color: headingColor,
                    ...headingFont,
                }}
            >
                {heading}
            </div>

            {/* Marquee Container */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                {/* Gradient Masks */}
                {showGradientMask && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: maskGradient,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />
                )}

                {/* Row 1 - Scrolls Left */}
                <MarqueeRow
                    logos={row1Logos}
                    direction="left"
                    duration={animationDuration}
                    variant={variant}
                    enableLinks={enableLinks}
                    logoBackgroundColor={logoBackgroundColor}
                    logoPadding={logoPadding}
                    logoCornerRadius={logoCornerRadius}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    logoSpacing={logoSpacing}
                    rowSpacing={rowSpacing}
                    logoItemWidth={logoItemWidth}
                    logoItemHeight={logoItemHeight}
                    showHoverPopup={showHoverPopup}
                    popupPlacement={popupPlacement}
                    popupFitToText={popupFitToText}
                    popupWidth={popupWidth}
                    popupBackgroundColor={popupBackgroundColor}
                    popupTextColor={popupTextColor}
                    popupBorderColor={popupBorderColor}
                    popupBorderWidth={popupBorderWidth}
                    popupCornerRadius={popupCornerRadius}
                    popupPadding={popupPadding}
                    popupGap={popupGap}
                    popupOffset={popupOffset}
                    popupShadow={popupShadow}
                    popupTitleFont={popupTitleFont}
                    popupDescriptionFont={popupDescriptionFont}
                    popupShowDescription={popupShowDescription}
                    popupCtaLabel={popupCtaLabel}
                />

                {/* Row 2 - Scrolls Right (hidden on mobile) */}
                {!isMobile && numberOfRows === 2 && row2Logos.length > 0 && (
                    <MarqueeRow
                        logos={row2Logos}
                        direction="right"
                        duration={animationDuration}
                        variant={variant}
                        enableLinks={enableLinks}
                        logoBackgroundColor={logoBackgroundColor}
                        logoPadding={logoPadding}
                        logoCornerRadius={logoCornerRadius}
                        isMobile={isMobile}
                        isTablet={isTablet}
                        logoSpacing={logoSpacing}
                        rowSpacing={rowSpacing}
                        logoItemWidth={logoItemWidth}
                        logoItemHeight={logoItemHeight}
                        showHoverPopup={showHoverPopup}
                        popupPlacement={popupPlacement}
                        popupFitToText={popupFitToText}
                        popupWidth={popupWidth}
                        popupBackgroundColor={popupBackgroundColor}
                        popupTextColor={popupTextColor}
                        popupBorderColor={popupBorderColor}
                        popupBorderWidth={popupBorderWidth}
                        popupCornerRadius={popupCornerRadius}
                        popupPadding={popupPadding}
                        popupGap={popupGap}
                        popupOffset={popupOffset}
                        popupShadow={popupShadow}
                        popupTitleFont={popupTitleFont}
                        popupDescriptionFont={popupDescriptionFont}
                        popupShowDescription={popupShowDescription}
                        popupCtaLabel={popupCtaLabel}
                    />
                )}
            </div>
        </motion.div>
    )
}

interface MarqueeRowProps {
    logos: Logo[]
    direction: "left" | "right"
    duration: number
    variant: "dark" | "light"
    enableLinks: boolean
    logoBackgroundColor: string
    logoPadding: number
    logoCornerRadius: number
    isMobile: boolean
    isTablet: boolean
    logoSpacing: number
    rowSpacing: number
    logoItemWidth: number
    logoItemHeight: number
    showHoverPopup: boolean
    popupPlacement: "top" | "bottom"
    popupFitToText: boolean
    popupWidth: number
    popupBackgroundColor: string
    popupTextColor: string
    popupBorderColor: string
    popupBorderWidth: number
    popupCornerRadius: number
    popupPadding: number
    popupGap: number
    popupOffset: number
    popupShadow: string
    popupTitleFont: CSSProperties
    popupDescriptionFont: CSSProperties
    popupShowDescription: boolean
    popupCtaLabel: string
}

function MarqueeRow({ logos, direction, duration, variant, enableLinks, logoBackgroundColor, logoPadding, logoCornerRadius, isMobile, isTablet, logoSpacing, rowSpacing, logoItemWidth, logoItemHeight, showHoverPopup, popupPlacement, popupFitToText, popupWidth, popupBackgroundColor, popupTextColor, popupBorderColor, popupBorderWidth, popupCornerRadius, popupPadding, popupGap, popupOffset, popupShadow, popupTitleFont, popupDescriptionFont, popupShowDescription, popupCtaLabel }: MarqueeRowProps) {
    // Duplicate logos for seamless loop
    const duplicatedLogos = [...logos, ...logos, ...logos]
    
    // Use custom spacing or responsive defaults
    const gap = isMobile ? Math.max(logoSpacing * 0.5, 30) : logoSpacing
    const marginBottom = isMobile ? 0 : rowSpacing

    return (
        <div
            style={{
                display: "flex",
                gap,
                marginBottom,
                width: "max-content",
                animation: `scroll-${direction} ${duration}s linear infinite`,
            }}
        >
            <style>
                {`
                    @keyframes scroll-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-${100 / 3}%); }
                    }
                    @keyframes scroll-right {
                        0% { transform: translateX(-${100 / 3}%); }
                        100% { transform: translateX(0); }
                    }
                `}
            </style>
            {duplicatedLogos.map((logo, index) => (
                <LogoItem
                    key={`${logo.name}-${index}`}
                    logo={logo}
                    variant={variant}
                    enableLinks={enableLinks}
                    logoBackgroundColor={logoBackgroundColor}
                    logoPadding={logoPadding}
                    logoCornerRadius={logoCornerRadius}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    logoItemWidth={logoItemWidth}
                    logoItemHeight={logoItemHeight}
                    showHoverPopup={showHoverPopup}
                    popupPlacement={popupPlacement}
                    popupFitToText={popupFitToText}
                    popupWidth={popupWidth}
                    popupBackgroundColor={popupBackgroundColor}
                    popupTextColor={popupTextColor}
                    popupBorderColor={popupBorderColor}
                    popupBorderWidth={popupBorderWidth}
                    popupCornerRadius={popupCornerRadius}
                    popupPadding={popupPadding}
                    popupGap={popupGap}
                    popupOffset={popupOffset}
                    popupShadow={popupShadow}
                    popupTitleFont={popupTitleFont}
                    popupDescriptionFont={popupDescriptionFont}
                    popupShowDescription={popupShowDescription}
                    popupCtaLabel={popupCtaLabel}
                />
            ))}
        </div>
    )
}

interface LogoItemProps {
    logo: Logo
    variant: "dark" | "light"
    enableLinks: boolean
    logoBackgroundColor: string
    logoPadding: number
    logoCornerRadius: number
    isMobile: boolean
    isTablet: boolean
    logoItemWidth: number
    logoItemHeight: number
    showHoverPopup: boolean
    popupPlacement: "top" | "bottom"
    popupFitToText: boolean
    popupWidth: number
    popupBackgroundColor: string
    popupTextColor: string
    popupBorderColor: string
    popupBorderWidth: number
    popupCornerRadius: number
    popupPadding: number
    popupGap: number
    popupOffset: number
    popupShadow: string
    popupTitleFont: CSSProperties
    popupDescriptionFont: CSSProperties
    popupShowDescription: boolean
    popupCtaLabel: string
}

function LogoItem({ logo, variant, enableLinks, logoBackgroundColor, logoPadding, logoCornerRadius, isMobile, isTablet, logoItemWidth, logoItemHeight, showHoverPopup, popupPlacement, popupFitToText, popupWidth, popupBackgroundColor, popupTextColor, popupBorderColor, popupBorderWidth, popupCornerRadius, popupPadding, popupGap, popupOffset, popupShadow, popupTitleFont, popupDescriptionFont, popupShowDescription, popupCtaLabel }: LogoItemProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [tooltipVisible, setTooltipVisible] = useState(false)

    const popupTitleText = (logo.popupTitle || "").trim() || logo.name
    const popupDescriptionText = (logo.popupDescription || "").trim() || logo.description || ""

    const handleClick = () => {
        if (enableLinks && logo.link && typeof window !== "undefined") {
            window.open(logo.link, "_blank", "noopener,noreferrer")
        }
    }

    const finalBackgroundColor = logo.backgroundColor || logoBackgroundColor
    const finalPadding = logo.padding !== undefined ? logo.padding : logoPadding
    const finalCornerRadius = logo.cornerRadius !== undefined ? logo.cornerRadius : logoCornerRadius

    // Responsive logo size
    const sizeScale = isMobile ? 0.75 : isTablet ? 0.85 : 1
    const logoWidth = Math.max(40, Math.round(logoItemWidth * sizeScale))
    const logoHeight = Math.max(20, Math.round(logoItemHeight * sizeScale))

    // Ensure images have valid src
    const grayscaleImageSrc = logo.grayscaleImage?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
    const colorImageSrc = logo.colorImage?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

    const content = (
        <motion.div
            onMouseEnter={() => {
                startTransition(() => {
                    setIsHovered(true)
                    setTooltipVisible(true)
                })
            }}
            onMouseLeave={() => {
                startTransition(() => {
                    setIsHovered(false)
                    setTooltipVisible(false)
                })
            }}
            onClick={handleClick}
            whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
            transition={{ duration: 0.3 }}
            style={{
                position: "relative",
                width: logoWidth,
                height: logoHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: enableLinks && logo.link ? "pointer" : "default",
                flexShrink: 0,
                backgroundColor: finalBackgroundColor,
                padding: finalPadding,
                borderRadius: finalCornerRadius,
            }}
        >
            {/* Grayscale Image */}
            <img
                src={grayscaleImageSrc}
                srcSet={logo.grayscaleImage?.srcSet}
                alt={logo.grayscaleImage?.alt || logo.name}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isHovered ? 0 : 1,
                    transition: "opacity 0.3s ease",
                    filter: variant === "dark" ? "brightness(0) invert(1)" : "grayscale(100%)",
                }}
            />

            {/* Color Image */}
            <img
                src={colorImageSrc}
                srcSet={logo.colorImage?.srcSet}
                alt={logo.colorImage?.alt || logo.name}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.3s ease",
                }}
            />

            {/* Tooltip */}
            {showHoverPopup && tooltipVisible && !isMobile && (
                <motion.div
                    initial={{ opacity: 0, y: popupPlacement === "top" ? 10 : -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        width: popupFitToText ? "max-content" : popupWidth,
                        maxWidth: popupFitToText ? popupWidth : 320,
                        transform: "translateX(-50%)",
                        ...(popupPlacement === "top"
                            ? { bottom: `calc(100% + ${popupOffset}px)` }
                            : { top: `calc(100% + ${popupOffset}px)` }),
                        backgroundColor: popupBackgroundColor,
                        color: popupTextColor,
                        border: `${popupBorderWidth}px solid ${popupBorderColor}`,
                        borderRadius: popupCornerRadius,
                        padding: popupPadding,
                        display: "flex",
                        flexDirection: "column",
                        gap: popupGap,
                        pointerEvents: "none",
                        zIndex: 10,
                        boxShadow: popupShadow,
                    }}
                    role="tooltip"
                    aria-label={popupTitleText}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div
                            style={{
                                minWidth: 0,
                                ...(popupFitToText
                                    ? { whiteSpace: "nowrap" }
                                    : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
                                ...popupTitleFont,
                            }}
                        >
                            {popupTitleText}
                        </div>
                        {enableLinks && !!logo.link && (
                            <div style={{ flexShrink: 0, opacity: 0.85, fontSize: 12, ...popupTitleFont }}>
                                {popupCtaLabel}
                            </div>
                        )}
                    </div>
                    {popupShowDescription && !!popupDescriptionText && (
                        <div style={{ opacity: 0.9, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", ...popupDescriptionFont }}>
                            {popupDescriptionText}
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    )

    return content
}

function getDefaultLogos(): Logo[] {
    const defaultImage = {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Default Logo"
    }
    
    return [
        {
            name: "Stripe",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://stripe.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Shopify",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://shopify.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Notion",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://notion.so",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Figma",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://figma.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Slack",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://slack.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Dropbox",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://dropbox.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Airbnb",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://airbnb.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Netflix",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://netflix.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Spotify",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://spotify.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Adobe",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://adobe.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "GitHub",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://github.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
        {
            name: "Uber",
            grayscaleImage: defaultImage,
            colorImage: defaultImage,
            link: "https://uber.com",
            backgroundColor: "transparent",
            padding: 12,
            cornerRadius: 8,
        },
    ]
}

addPropertyControls(LogoMarquee, {
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Trusted by teams at",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#000000",
    },
    useCMS: {
        type: ControlType.Boolean,
        title: "Data Source",
        defaultValue: false,
        enabledTitle: "CMS",
        disabledTitle: "Manual",
    },
    cmsLogos: {
        type: ControlType.Array,
        title: "CMS Collection",
        hidden: ({ useCMS }) => !useCMS,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Company Name",
                },
                popupTitle: {
                    type: ControlType.String,
                    title: "Popup Title",
                    defaultValue: "",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                popupDescription: {
                    type: ControlType.String,
                    title: "Popup Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                grayscaleImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Grayscale Logo",
                },
                colorImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Color Logo",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    optional: true,
                },
                padding: {
                    type: ControlType.Number,
                    title: "Padding",
                    min: 0,
                    max: 40,
                    step: 1,
                    unit: "px",
                },
                cornerRadius: {
                    type: ControlType.Number,
                    title: "Corner Radius",
                    min: 0,
                    max: 30,
                    step: 1,
                    unit: "px",
                },
            },
        },
    },
    logos: {
        type: ControlType.Array,
        title: "Logos",
        hidden: ({ useCMS }) => useCMS,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Company Name",
                    defaultValue: "Company",
                },
                popupTitle: {
                    type: ControlType.String,
                    title: "Popup Title",
                    defaultValue: "",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                popupDescription: {
                    type: ControlType.String,
                    title: "Popup Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                grayscaleImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Grayscale Logo",
                },
                colorImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Color Logo",
                },
                link: {
                    type: ControlType.String,
                    title: "Link (optional)",
                    defaultValue: "",
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background Color",
                    defaultValue: "transparent",
                    optional: true,
                },
                padding: {
                    type: ControlType.Number,
                    title: "Padding",
                    defaultValue: 12,
                    min: 0,
                    max: 40,
                    step: 1,
                    unit: "px",
                },
                cornerRadius: {
                    type: ControlType.Number,
                    title: "Corner Radius",
                    defaultValue: 8,
                    min: 0,
                    max: 30,
                    step: 1,
                    unit: "px",
                },
            },
        },
        defaultValue: [],
    },
    showHoverPopup: {
        type: ControlType.Boolean,
        title: "Hover Popup",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    popupPlacement: {
        type: ControlType.Enum,
        title: "Popup Placement",
        options: ["bottom", "top"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupFitToText: {
        type: ControlType.Boolean,
        title: "Fit To Text",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Fixed",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupWidth: {
        type: ControlType.Number,
        title: "Popup Max/Width",
        defaultValue: 220,
        min: 140,
        max: 420,
        step: 10,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupOffset: {
        type: ControlType.Number,
        title: "Popup Offset",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupPadding: {
        type: ControlType.Number,
        title: "Popup Padding",
        defaultValue: 12,
        min: 6,
        max: 30,
        step: 1,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupGap: {
        type: ControlType.Number,
        title: "Popup Gap",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupBackgroundColor: {
        type: ControlType.Color,
        title: "Popup Background",
        defaultValue: "#000000",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupTextColor: {
        type: ControlType.Color,
        title: "Popup Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupBorderColor: {
        type: ControlType.Color,
        title: "Popup Border",
        defaultValue: "rgba(0,0,0,0.08)",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupCornerRadius: {
        type: ControlType.Number,
        title: "Popup Radius",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupShadow: {
        type: ControlType.BoxShadow,
        title: "Popup Shadow",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupTitleFont: {
        type: ControlType.Font,
        title: "Popup Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupDescriptionFont: {
        type: ControlType.Font,
        title: "Popup Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupShowDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    popupCtaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Visit",
        hidden: ({ showHoverPopup }) => !showHoverPopup,
    },
    numberOfRows: {
        type: ControlType.Enum,
        title: "Number of Rows",
        options: [1, 2],
        optionTitles: ["1 Row", "2 Rows"],
        defaultValue: 2,
        displaySegmentedControl: true,
    },
    logoSpacing: {
        type: ControlType.Number,
        title: "Logo Spacing",
        defaultValue: 60,
        min: 20,
        max: 150,
        step: 5,
        unit: "px",
    },
    rowSpacing: {
        type: ControlType.Number,
        title: "Row Spacing",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        hidden: ({ numberOfRows }) => numberOfRows === 1,
    },
    logoBackgroundColor: {
        type: ControlType.Color,
        title: "Logo Background",
        defaultValue: "transparent",
    },
    logoPadding: {
        type: ControlType.Number,
        title: "Logo Padding",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    logoCornerRadius: {
        type: ControlType.Number,
        title: "Logo Corner Radius",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    logoItemWidth: {
        type: ControlType.Number,
        title: "Logo Width",
        defaultValue: 140,
        min: 40,
        max: 320,
        step: 5,
        unit: "px",
    },
    logoItemHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        defaultValue: 60,
        min: 20,
        max: 200,
        step: 5,
        unit: "px",
    },
    speed: {
        type: ControlType.Enum,
        title: "Speed",
        options: ["slow", "medium", "fast"],
        optionTitles: ["Slow", "Medium", "Fast"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    showGradientMask: {
        type: ControlType.Boolean,
        title: "Gradient Mask",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableLinks: {
        type: ControlType.Boolean,
        title: "Enable Links",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
