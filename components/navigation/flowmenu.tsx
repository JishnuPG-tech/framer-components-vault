/**
 * FlowMenu Navbar
 * ═══════════════════════════════════════════════════════════════════════════
 * An expanding, glass-morphic navigation bar. A single Menu toggle reveals
 * three animated panels — a site map, social links, and an infinitely
 * scrolling image gallery — with a smooth spring-based open / close
 * transition. Fully responsive across desktop, tablet, and phone.
 *
 * Everything is themeable from the properties panel — no code required:
 *   • Logo        — text (with optional custom font) or an image / SVG
 *   • Contact     — label, background, text colour, and optional custom font
 *   • Menu        — the frosted glass bar colour (blur is preserved)
 *   • Sections    — per-panel title text, title colour, and background
 *   • Nav links   — editable list of labels + links
 *   • Socials     — editable list of labels + links
 *   • Gallery     — four images with links, plus scroll-speed control
 *   • Actions     — Contact and Close event handlers for wiring overlays
 *
 * Interactions (menu toggle, gallery scroll, hover underlines) are disabled
 * during static rendering so canvas thumbnails and exports stay clean.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * Author   Scott Bachurzewski
 * Version  1.0.0
 * © 2026 Scott Bachurzewski. Licensed for use via the Framer Marketplace.
 *
 * Fonts    The default logo uses "Basement Grotesque" and body text uses
 *          "Inter Display". Both are bundled via addFonts below. Confirm the
 *          Basement Grotesque licence covers your use, or replace the logo
 *          through the Logo controls.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, type Transition } from "framer-motion"
import * as React from "react"

// ─── Design constants (values copied 1:1 from the original design) ─────────

const COLOR_NAV_BG = "rgba(146, 153, 169, 0.2)"
const COLOR_DARK = "rgb(35, 35, 37)"
const COLOR_WHITE = "rgb(255, 255, 255)"
const COLOR_LIGHT_TEXT = "rgb(238, 238, 238)"
const COLOR_TITLE_SITEMAP = "rgb(246, 157, 200)"
const COLOR_TITLE_SOCIALS = "rgb(107, 228, 223)"
const COLOR_TITLE_GALLERY = "rgb(118, 126, 225)"

const FONT_BODY = '"Inter Display", "Inter Display Placeholder", sans-serif'
const FONT_LOGO = '"Basement Grotesque", sans-serif'

const layoutSpring: Transition = { type: "spring", bounce: 0.2, duration: 0.4 }
const panelSprings: Transition[] = [
    { type: "spring", bounce: 0.4, delay: 0.1, duration: 1 },
    { type: "spring", bounce: 0.4, delay: 0.2, duration: 1.1 },
    { type: "spring", bounce: 0.4, delay: 0.3, duration: 1.2 },
]

// ─── Types ──────────────────────────────────────────────────────────────────

interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
}

type VariantName =
    | "desktop-open"
    | "desktop-closed"
    | "tablet-open"
    | "tablet-closed"
    | "phone-open"
    | "phone-closed"

type Breakpoint = "desktop" | "tablet" | "phone"

interface NavLinkItem {
    label?: string
    link?: string
    newTab?: boolean
}

interface FlowMenuNavbarProps {
    variant?: VariantName
    logoType?: "text" | "svg"
    logoText?: string
    customLogoFont?: boolean
    logoFont?: React.CSSProperties
    logoImage?: ResponsiveImage
    logoImageHeight?: number
    logoLink?: string
    contactLabel?: string
    contactBackground?: string
    contactTextColor?: string
    customContactFont?: boolean
    contactFont?: React.CSSProperties
    menuBackground?: string
    siteMapBackground?: string
    siteMapTitleColor?: string
    socialsBackground?: string
    socialsTitleColor?: string
    galleryBackground?: string
    galleryTitleColor?: string
    gallerySpeed?: number
    menuLabel?: string
    closeLabel?: string
    siteMapTitle?: string
    navLinks?: NavLinkItem[]
    socialsTitle?: string
    socialLinks?: NavLinkItem[]
    galleryTitle?: string
    contact?: () => void
    close?: () => void
    image1?: ResponsiveImage
    link1?: string
    newTab1?: boolean
    image2?: ResponsiveImage
    link2?: string
    newTab2?: boolean
    image3?: ResponsiveImage
    link3?: string
    newTab3?: boolean
    image4?: ResponsiveImage
    link4?: string
    newTab4?: boolean
    style?: React.CSSProperties
}

function breakpointOf(variant: VariantName): Breakpoint {
    if (variant.startsWith("tablet")) return "tablet"
    if (variant.startsWith("phone")) return "phone"
    return "desktop"
}

function isOpenVariant(variant: VariantName): boolean {
    return variant.endsWith("-open")
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
    { label: "Home", link: "/" },
    { label: "Projects" },
    { label: "About us" },
    { label: "Services" },
]

const DEFAULT_SOCIAL_LINKS: NavLinkItem[] = [
    { label: "X (Twitter)", link: "https://x.com", newTab: true },
    { label: "Facebook", link: "https://facebook.com", newTab: true },
    { label: "LinkedIn", link: "https://linkedin.com", newTab: true },
    { label: "Instagram", link: "https://instagram.com", newTab: true },
]

const DEFAULT_IMAGE_1: ResponsiveImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue",
}
const DEFAULT_IMAGE_2: ResponsiveImage = {
    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    alt: "Gradient 2 - Purple",
}
const DEFAULT_IMAGE_3: ResponsiveImage = {
    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    alt: "Gradient 3 - Orange",
}
const DEFAULT_IMAGE_4: ResponsiveImage = {
    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    alt: "Gradient 4 - Yellow",
}

// ─── Underline button (small, used for "Contact") ──────────────────────────

interface UnderlineButtonProps {
    label: string
    textColor: string
    backgroundColor: string
    font?: React.CSSProperties
    onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void
}

function UnderlineButton(props: UnderlineButtonProps) {
    const { label, textColor, backgroundColor, font, onClick } = props
    return (
        <motion.div
            role="button"
            tabIndex={0}
            aria-label={label}
            initial="initial"
            whileHover="hover"
            onClick={onClick}
            onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onClick?.(event)
                }
            }}
            style={{
                backgroundColor,
                borderRadius: 4,
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontFamily: FONT_BODY,
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: "1.6em",
                    userSelect: "none",
                    whiteSpace: "pre",
                    ...font,
                    color: textColor,
                }}
            >
                {label}
            </p>
            <div
                style={{
                    alignSelf: "stretch",
                    height: 1,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <motion.div
                    variants={{
                        initial: { width: "1%", left: -10 },
                        hover: { width: "100%", left: 0 },
                    }}
                    transition={layoutSpring}
                    style={{
                        backgroundColor: textColor,
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                    }}
                />
            </div>
        </motion.div>
    )
}

// ─── Underline link (large, used in menu panels) ────────────────────────────

interface UnderlineLinkProps {
    label: string
    textColor: string
    href?: string
    newTab?: boolean
    onClick?: () => void
}

function UnderlineLink(props: UnderlineLinkProps) {
    const { label, textColor, href, newTab, onClick } = props
    return (
        <motion.a
            href={href}
            target={newTab ? "_blank" : "_self"}
            rel={newTab ? "noopener noreferrer" : undefined}
            onClick={onClick}
            initial="initial"
            whileHover="hover"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: 2,
                borderRadius: 4,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                width: "max-content",
                textDecoration: "none",
            }}
        >
            <span
                style={{
                    color: textColor,
                    fontFamily: FONT_BODY,
                    fontSize: 44,
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    lineHeight: "1.1em",
                    whiteSpace: "pre",
                    userSelect: "none",
                }}
            >
                {label}
            </span>
            <div
                style={{
                    alignSelf: "stretch",
                    height: 2,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <motion.div
                    variants={{
                        initial: { width: "1%", left: -10 },
                        hover: { width: "100%", left: 0 },
                    }}
                    transition={layoutSpring}
                    style={{
                        backgroundColor: textColor,
                        position: "absolute",
                        top: 0,
                        height: 3,
                    }}
                />
            </div>
        </motion.a>
    )
}

// ─── Menu toggle button (hamburger + label) ─────────────────────────────────

interface MenuToggleProps {
    open: boolean
    menuLabel: string
    closeLabel: string
    textColor: string
    onClick: (event: React.MouseEvent | React.KeyboardEvent) => void
}

function MenuToggle(props: MenuToggleProps) {
    const { open, menuLabel, closeLabel, textColor, onClick } = props
    return (
        <motion.div
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            initial="initial"
            whileHover="hover"
            onClick={onClick}
            onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onClick(event)
                }
            }}
            style={{
                backgroundColor: COLOR_DARK,
                borderRadius: 4,
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                zIndex: 1,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    width: "100%",
                }}
            >
                <span
                    style={{
                        color: textColor,
                        fontFamily: FONT_BODY,
                        fontSize: 16,
                        fontWeight: 400,
                        lineHeight: "1.6em",
                        userSelect: "none",
                        whiteSpace: "pre",
                    }}
                >
                    {open ? closeLabel : menuLabel}
                </span>
                <svg
                    aria-hidden="true"
                    width={18}
                    height={18}
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke={textColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    style={{ display: "block", flexShrink: 0 }}
                >
                    {open ? (
                        <>
                            <line x1="3.5" y1="3.5" x2="10.5" y2="10.5" />
                            <line x1="10.5" y1="3.5" x2="3.5" y2="10.5" />
                        </>
                    ) : (
                        <>
                            <line x1="2" y1="4" x2="12" y2="4" />
                            <line x1="2" y1="7" x2="12" y2="7" />
                            <line x1="2" y1="10" x2="12" y2="10" />
                        </>
                    )}
                </svg>
            </div>
            <div
                style={{
                    alignSelf: "stretch",
                    height: 1,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <motion.div
                    variants={{
                        initial: { width: "1%", left: -10 },
                        hover: { width: "100%", left: 0 },
                    }}
                    transition={layoutSpring}
                    style={{
                        backgroundColor: textColor,
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                    }}
                />
            </div>
        </motion.div>
    )
}

// ─── Menu panel (dark card with title + content) ────────────────────────────

interface MenuPanelProps {
    title: string
    titleColor: string
    background: string
    transition: Transition
    animateIn: boolean
    stacked?: boolean
    children: React.ReactNode
}

function MenuPanel(props: MenuPanelProps) {
    const {
        title,
        titleColor,
        background,
        transition,
        animateIn,
        stacked,
        children,
    } = props
    return (
        <motion.div
            initial={animateIn ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 24,
                padding: 24,
                backgroundColor: background,
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
                flex: stacked ? "none" : "1 0 0px",
                width: stacked ? "100%" : "1px",
                minWidth: 0,
            }}
        >
            <p
                style={{
                    margin: 0,
                    width: "100%",
                    color: titleColor,
                    fontFamily: FONT_BODY,
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    lineHeight: "1.6em",
                }}
            >
                {title}
            </p>
            {children}
        </motion.div>
    )
}

// ─── Image ticker (gallery) ─────────────────────────────────────────────────

interface TickerImage {
    src?: string
    srcSet?: string
    alt?: string
    link?: string
    newTab?: boolean
}

interface GalleryAreaProps {
    images: TickerImage[]
    isStatic: boolean
    speed: number
}

function GalleryArea(props: GalleryAreaProps) {
    const { images, isStatic, speed } = props
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [tickerDuration, setTickerDuration] = React.useState(0)

    // The strip is three identical copies, each carrying its own trailing
    // gap, so translating by exactly one third loops seamlessly at any
    // size — no runtime measurement needed for the distance. Only the
    // duration is measured (from the configured velocity in px/s), after
    // the open animation has settled so the panel is at its final width.
    React.useEffect(() => {
        if (isStatic || speed <= 0 || typeof window === "undefined") return
        const id = window.setTimeout(() => {
            if (contentRef.current) {
                const height = contentRef.current.getBoundingClientRect().height
                if (height > 0) setTickerDuration(height / speed)
            }
        }, 700)
        return () => window.clearTimeout(id)
    }, [isStatic, images.length, speed])

    const tileBase: React.CSSProperties = {
        width: "100%",
        borderRadius: 4,
        overflow: "hidden",
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                flex: "1 0 0px",
                minHeight: 0,
                borderRadius: 4,
                overflow: "hidden",
            }}
        >
            {/* Placeholder tiles — visible when no images are set. Absolute
                so the gallery never adds intrinsic height; the panel matches
                its siblings and the tiles fill whatever space remains. */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gridTemplateRows: "1fr 1fr",
                    gap: 4,
                }}
            >
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        style={{
                            ...tileBase,
                            height: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                        }}
                    />
                ))}
            </div>
            {images.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                    }}
                >
                    <style>{`@keyframes flowmenu-gallery-scroll { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -33.3333%, 0); } } nav[data-flowmenu-inview="false"] [data-flowmenu-ticker] { animation-play-state: paused !important; }`}</style>
                    <div
                        data-flowmenu-ticker=""
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            willChange: "transform",
                            animation:
                                tickerDuration > 0
                                    ? `flowmenu-gallery-scroll ${tickerDuration}s linear infinite`
                                    : undefined,
                        }}
                    >
                        {[0, 1, 2].map((copy) => (
                            <div
                                key={copy}
                                ref={copy === 0 ? contentRef : undefined}
                                aria-hidden={copy > 0}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 4,
                                    width: "100%",
                                    paddingBottom: 4,
                                }}
                            >
                                {images.map((image, index) => (
                                    <a
                                        key={index}
                                        href={image.link}
                                        target={
                                            image.newTab ? "_blank" : "_self"
                                        }
                                        rel={
                                            image.newTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        tabIndex={copy > 0 ? -1 : 0}
                                        draggable={false}
                                        style={{
                                            ...tileBase,
                                            aspectRatio: "1.44",
                                            display: "block",
                                        }}
                                    >
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            alt={image.alt ?? ""}
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * FlowMenu Navbar
 *
 * An expanding navigation bar with a blurred glass backdrop. The menu toggle
 * reveals three animated panels: a site map, social links, and a scrolling
 * image gallery. Includes desktop, tablet, and phone variants.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 451
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function FlowMenuNavbar(props: FlowMenuNavbarProps) {
    const {
        variant = "desktop-open",
        logoType = "text",
        logoText = "ABC",
        customLogoFont = false,
        logoFont,
        logoImage,
        logoImageHeight = 24,
        logoLink = "/",
        contactLabel = "Contact",
        contactBackground = COLOR_DARK,
        contactTextColor = COLOR_WHITE,
        customContactFont = false,
        contactFont,
        menuBackground = COLOR_NAV_BG,
        siteMapBackground = COLOR_DARK,
        siteMapTitleColor = COLOR_TITLE_SITEMAP,
        socialsBackground = COLOR_DARK,
        socialsTitleColor = COLOR_TITLE_SOCIALS,
        galleryBackground = COLOR_DARK,
        galleryTitleColor = COLOR_TITLE_GALLERY,
        gallerySpeed = 50,
        menuLabel = "Menu",
        closeLabel = "Close",
        siteMapTitle = "Site map",
        navLinks = DEFAULT_NAV_LINKS,
        socialsTitle = "Socials",
        socialLinks = DEFAULT_SOCIAL_LINKS,
        galleryTitle = "Latest work",
        contact,
        close,
        image1 = DEFAULT_IMAGE_1,
        link1,
        newTab1,
        image2 = DEFAULT_IMAGE_2,
        link2,
        newTab2,
        image3 = DEFAULT_IMAGE_3,
        link3,
        newTab3,
        image4 = DEFAULT_IMAGE_4,
        link4,
        newTab4,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const navRef = React.useRef<HTMLElement>(null)

    const [currentVariant, setCurrentVariant] =
        React.useState<VariantName>(variant)
    React.useEffect(() => {
        setCurrentVariant(variant)
    }, [variant])

    // Pause the gallery ticker whenever the component is scrolled out of the
    // viewport so it consumes no CPU/GPU on published sites. The observer
    // lives on the stable <nav> root (not the animated menu subtree) and
    // toggles a data attribute; CSS then pauses whatever ticker is mounted,
    // so this keeps working across the menu's open/close remounts. Defaults
    // to running when IntersectionObserver is unavailable.
    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const element = navRef.current
        if (!element || typeof IntersectionObserver === "undefined") return
        element.dataset.flowmenuInview = "true"
        const observer = new IntersectionObserver(
            (entries) => {
                element.dataset.flowmenuInview = entries[0]?.isIntersecting
                    ? "true"
                    : "false"
            },
            { threshold: 0 }
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [isStatic])

    const breakpoint = breakpointOf(currentVariant)
    const open = isOpenVariant(currentVariant)
    const stackedPanels = currentVariant === "phone-open"

    const closeMenu = React.useCallback(() => {
        setCurrentVariant(`${breakpointOf(currentVariant)}-closed`)
    }, [currentVariant])

    const toggleMenu = React.useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            event.stopPropagation()
            const target: VariantName = isOpenVariant(currentVariant)
                ? `${breakpointOf(currentVariant)}-closed`
                : `${breakpointOf(currentVariant)}-open`
            // The original design closes the desktop menu after a 100ms beat.
            if (
                target === "desktop-closed" &&
                typeof window !== "undefined"
            ) {
                window.setTimeout(() => setCurrentVariant(target), 100)
            } else {
                setCurrentVariant(target)
            }
        },
        [currentVariant]
    )

    const handleRootClick = React.useCallback(() => {
        if (open) close?.()
    }, [open, close])

    const handleContact = React.useCallback(
        (event: React.MouseEvent | React.KeyboardEvent) => {
            event.stopPropagation()
            contact?.()
        },
        [contact]
    )

    const tickerImages: TickerImage[] = [
        { ...image1, link: link1, newTab: newTab1 },
        { ...image2, link: link2, newTab: newTab2 },
        { ...image3, link: link3, newTab: newTab3 },
        { ...image4, link: link4, newTab: newTab4 },
    ].filter((image) => Boolean(image.src))

    return (
        <nav
            ref={navRef}
            data-flowmenu-inview="true"
            onClick={handleRootClick}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: breakpoint === "phone" ? 12 : 20,
                overflow: "clip",
                position: "relative",
                cursor: open ? "pointer" : undefined,
                width: 1200,
                height: "min-content",
                ...style,
            }}
        >
            <motion.div
                layout
                transition={layoutSpring}
                animate={{ borderRadius: open ? 6 : 8 }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4,
                    width:
                        currentVariant === "desktop-closed" ? 500 : "100%",
                    maxWidth: "100%",
                    overflow: "clip",
                    position: "relative",
                    backgroundColor: menuBackground,
                    backdropFilter: "blur(5px)",
                    WebkitBackdropFilter: "blur(5px)",
                    borderRadius: open ? 6 : 8,
                }}
            >
                {/* Nav bar row */}
                <motion.div
                    layout="position"
                    transition={layoutSpring}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            overflow: "clip",
                        }}
                    >
                        <UnderlineButton
                            label={contactLabel}
                            textColor={contactTextColor}
                            backgroundColor={contactBackground}
                            font={
                                customContactFont ? contactFont : undefined
                            }
                            onClick={handleContact}
                        />
                    </div>
                    <a
                        href={logoLink}
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "49%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 2,
                            minHeight: 40,
                            minWidth: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textDecoration: "none",
                        }}
                    >
                        {logoType === "svg" && logoImage?.src ? (
                            <img
                                src={logoImage.src}
                                srcSet={logoImage.srcSet}
                                alt={logoImage.alt ?? logoText}
                                style={{
                                    height: logoImageHeight,
                                    width: "auto",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <h2
                                style={{
                                    margin: 0,
                                    fontFamily: FONT_LOGO,
                                    fontSize: 24,
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    lineHeight: "0.9em",
                                    textAlign: "center",
                                    color: COLOR_DARK,
                                    whiteSpace: "pre",
                                    ...(customLogoFont ? logoFont : null),
                                }}
                            >
                                {logoText}
                            </h2>
                        )}
                    </a>
                    <MenuToggle
                        open={open}
                        menuLabel={menuLabel}
                        closeLabel={closeLabel}
                        textColor={COLOR_WHITE}
                        onClick={toggleMenu}
                    />
                </motion.div>

                {/* Open menu panels */}
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            key="menu-panels"
                            initial={
                                isStatic
                                    ? false
                                    : { height: 0, opacity: 0, paddingTop: 0 }
                            }
                            animate={{
                                height: "auto",
                                opacity: 1,
                                paddingTop: 4,
                            }}
                            exit={{ height: 0, opacity: 0, paddingTop: 0 }}
                            transition={layoutSpring}
                            style={{
                                width: "100%",
                                overflow: "clip",
                                position: "relative",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: stackedPanels
                                        ? "column"
                                        : "row",
                                    alignItems: "stretch",
                                    justifyContent: "center",
                                    gap: 4,
                                    width: "100%",
                                }}
                            >
                        <MenuPanel
                            title={siteMapTitle}
                            titleColor={siteMapTitleColor}
                            background={siteMapBackground}
                            transition={panelSprings[0]}
                            animateIn={!isStatic}
                            stacked={stackedPanels}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 4,
                                    width: "100%",
                                }}
                            >
                                {navLinks.map((item, index) => (
                                    <UnderlineLink
                                        key={index}
                                        label={item.label ?? ""}
                                        textColor={COLOR_LIGHT_TEXT}
                                        href={item.link}
                                        newTab={item.newTab}
                                        onClick={closeMenu}
                                    />
                                ))}
                            </div>
                        </MenuPanel>
                        <MenuPanel
                            title={socialsTitle}
                            titleColor={socialsTitleColor}
                            background={socialsBackground}
                            transition={panelSprings[1]}
                            animateIn={!isStatic}
                            stacked={stackedPanels}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 4,
                                    width: "100%",
                                }}
                            >
                                {socialLinks.map((item, index) => (
                                    <UnderlineLink
                                        key={index}
                                        label={item.label ?? ""}
                                        textColor={COLOR_LIGHT_TEXT}
                                        href={item.link}
                                        newTab={item.newTab}
                                        onClick={closeMenu}
                                    />
                                ))}
                            </div>
                        </MenuPanel>
                        {!stackedPanels && (
                            <MenuPanel
                                title={galleryTitle}
                                titleColor={galleryTitleColor}
                                background={galleryBackground}
                                transition={panelSprings[2]}
                                animateIn={!isStatic}
                            >
                                <GalleryArea
                                    images={tickerImages}
                                    isStatic={isStatic}
                                    speed={gallerySpeed}
                                />
                            </MenuPanel>
                        )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </nav>
    )
}

FlowMenuNavbar.displayName = "FlowMenu Navbar"

addPropertyControls(FlowMenuNavbar, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: [
            "desktop-open",
            "desktop-closed",
            "tablet-open",
            "tablet-closed",
            "phone-open",
            "phone-closed",
        ],
        optionTitles: [
            "Desktop Open",
            "Desktop Closed",
            "Tablet Open",
            "Tablet Closed",
            "Phone Open",
            "Phone Closed",
        ],
        defaultValue: "desktop-open",
    },
    logoType: {
        type: ControlType.Enum,
        title: "Logo",
        options: ["text", "svg"],
        optionTitles: ["Text", "Image"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "ABC",
        placeholder: "Your brand",
        hidden: (props) => props.logoType === "svg",
    },
    customLogoFont: {
        type: ControlType.Boolean,
        title: "Custom Logo Font",
        defaultValue: false,
        hidden: (props) => props.logoType === "svg",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Black",
            letterSpacing: "-0.03em",
            lineHeight: "0.9em",
            textAlign: "center",
        },
        hidden: (props) => props.logoType === "svg" || !props.customLogoFont,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: (props) => props.logoType !== "svg",
    },
    logoImageHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        defaultValue: 24,
        min: 12,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (props) => props.logoType !== "svg",
    },
    logoLink: {
        type: ControlType.Link,
        title: "Logo Link",
        defaultValue: "/",
    },
    contactLabel: {
        type: ControlType.String,
        title: "Contact Label",
        defaultValue: "Contact",
    },
    contactBackground: {
        type: ControlType.Color,
        title: "Contact BG",
        defaultValue: "rgb(35, 35, 37)",
    },
    contactTextColor: {
        type: ControlType.Color,
        title: "Contact Text",
        defaultValue: "rgb(255, 255, 255)",
    },
    customContactFont: {
        type: ControlType.Boolean,
        title: "Custom Contact Font",
        defaultValue: false,
    },
    contactFont: {
        type: ControlType.Font,
        title: "Contact Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
        hidden: (props) => !props.customContactFont,
    },
    menuBackground: {
        type: ControlType.Color,
        title: "Menu BG",
        defaultValue: "rgba(146, 153, 169, 0.2)",
    },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        defaultValue: "Menu",
    },
    closeLabel: {
        type: ControlType.String,
        title: "Close Label",
        defaultValue: "Close",
    },
    siteMapTitle: {
        type: ControlType.String,
        title: "Nav Title",
        defaultValue: "Site map",
    },
    siteMapTitleColor: {
        type: ControlType.Color,
        title: "Nav Title Color",
        defaultValue: "rgb(246, 157, 200)",
    },
    siteMapBackground: {
        type: ControlType.Color,
        title: "Nav BG",
        defaultValue: "rgb(35, 35, 37)",
    },
    navLinks: {
        type: ControlType.Array,
        title: "Nav Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
        defaultValue: DEFAULT_NAV_LINKS,
    },
    socialsTitle: {
        type: ControlType.String,
        title: "Socials Title",
        defaultValue: "Socials",
    },
    socialsTitleColor: {
        type: ControlType.Color,
        title: "Socials Title Color",
        defaultValue: "rgb(107, 228, 223)",
    },
    socialsBackground: {
        type: ControlType.Color,
        title: "Socials BG",
        defaultValue: "rgb(35, 35, 37)",
    },
    socialLinks: {
        type: ControlType.Array,
        title: "Social Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Social",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                },
            },
        },
        defaultValue: DEFAULT_SOCIAL_LINKS,
    },
    galleryTitle: {
        type: ControlType.String,
        title: "Gallery Title",
        defaultValue: "Latest work",
    },
    galleryTitleColor: {
        type: ControlType.Color,
        title: "Gallery Title Color",
        defaultValue: "rgb(118, 126, 225)",
    },
    galleryBackground: {
        type: ControlType.Color,
        title: "Gallery BG",
        defaultValue: "rgb(35, 35, 37)",
    },
    gallerySpeed: {
        type: ControlType.Number,
        title: "Gallery Speed",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 5,
        unit: "px/s",
    },
    contact: { type: ControlType.EventHandler, title: "Contact" },
    close: { type: ControlType.EventHandler, title: "Close" },
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    link1: { type: ControlType.Link, title: "Link 1" },
    newTab1: {
        type: ControlType.Boolean,
        title: "New Tab 1",
        defaultValue: false,
    },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    link2: { type: ControlType.Link, title: "Link 2" },
    newTab2: {
        type: ControlType.Boolean,
        title: "New Tab 2",
        defaultValue: false,
    },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    link3: { type: ControlType.Link, title: "Link 3" },
    newTab3: {
        type: ControlType.Boolean,
        title: "New Tab 3",
        defaultValue: false,
    },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    link4: { type: ControlType.Link, title: "Link 4" },
    newTab4: {
        type: ControlType.Boolean,
        title: "New Tab 4",
        defaultValue: false,
    },
})

addFonts(
    FlowMenuNavbar as React.ComponentType<unknown>,
    [
        {
            explicitInter: true,
            fonts: [
                {
                    family: "Basement Grotesque",
                    source: "builtIn",
                    style: "normal",
                    url: "https://framerusercontent.com/assets/tptF1MIxUNxd9hxldXrA4Jhd7g.woff2",
                    weight: "900",
                },
                {
                    family: "Inter Display",
                    source: "framer",
                    style: "normal",
                    unicodeRange:
                        "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
                    url: "https://framerusercontent.com/assets/bHYNJqzTyl2lqvmMiRRS6Y16Es.woff2",
                    weight: "400",
                },
                {
                    family: "Inter Display",
                    source: "framer",
                    style: "normal",
                    unicodeRange:
                        "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF",
                    url: "https://framerusercontent.com/assets/DF7bjCRmStYPqSb945lAlMfCCVQ.woff2",
                    weight: "400",
                },
                {
                    family: "Inter Display",
                    source: "framer",
                    style: "normal",
                    unicodeRange:
                        "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F",
                    url: "https://framerusercontent.com/assets/2uIBiALfCHVpWbHqRMZutfT7giU.woff2",
                    weight: "400",
                },
            ],
        },
    ],
    { supportsExplicitInterCodegen: true }
)
