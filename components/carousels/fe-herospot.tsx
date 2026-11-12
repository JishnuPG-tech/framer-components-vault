// Fe Mega Nav — tabbed mega-nav header with a shoppable image carousel.
// Published as "Fe Mega Nav" in the Framer Community.
import {
    useState,
    useEffect,
    useMemo,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SlideData {
    image: {
        src: string
        alt: string
    }
    heading: string
    description: string
    buttonText: string
    buttonLink: string
}

// Slide imagery lives here, in code. Editing the Slides control on an instance
// is optional; any slide left without an image falls back to these values.
const DEFAULT_SLIDES: SlideData[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/p0Q211wa1voNGpcE0BCeGp2ko.png",
            alt: "Couple in autumn streetwear on a grey backdrop",
        },
        heading: "Crafting Comfort, Inspired by the Season",
        description:
            "Crafted for style and lasting durability, perfect for any season.",
        buttonText: "View Product",
        buttonLink: "#",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
            alt: "Couple in beige coats and knit beanies",
        },
        heading: "Timeless Design for Modern Living",
        description:
            "Experience the perfect blend of comfort and contemporary style.",
        buttonText: "Explore Now",
        buttonLink: "#",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
            alt: "Two models in tailored suits and sunglasses",
        },
        heading: "Premium Quality, Exceptional Fit",
        description: "Discover pieces that transform how you dress every day.",
        buttonText: "Shop Collection",
        buttonLink: "#",
    },
]

// Default shoppable hotspots, filled in slide order: 1-4 -> slide 1,
// 5-8 -> slide 2, 9-12 -> slide 3.
const DEFAULT_HOTSPOTS: HeroSectionProps["plusIconItems"] = [
    { text: "Relaxed bomber silhouette.", link: "#", price: "$129.00" },
    { text: "Ribbed knit polo.", link: "#", price: "$149.00" },
    { text: "Layered modern styling.", link: "#", price: "$99.00" },
    { text: "Layered chain necklace.", link: "#", price: "$119.00" },
    { text: "Soft merino turtleneck.", link: "#", price: "$139.00" },
    { text: "Premium quality materials.", link: "#", price: "$159.00" },
    { text: "Structured cotton twill.", link: "#", price: "$109.00" },
    { text: "Refined detailing.", link: "#", price: "$89.00" },
    { text: "Durable craftsmanship.", link: "#", price: "$169.00" },
    { text: "Tailored fit.", link: "#", price: "$129.00" },
    { text: "Breathable fabric.", link: "#", price: "$79.00" },
    { text: "Timeless silhouette.", link: "#", price: "$189.00" },
]

interface HeroSectionProps {
    slides: SlideData[]
    headingFont: CSSProperties
    descriptionFont: CSSProperties
    buttonFont: CSSProperties
    cardBackground: string
    textColor: string
    descriptionColor: string
    buttonTextColor: string
    buttonBorderColor: string
    arrowColor: string
    dotColor: string
    activeDotColor: string
    autoplay: boolean
    autoplayInterval: number
    // Header props
    showHeader: boolean
    promoText: string
    promoBackground: string
    promoTextColor: string
    promoFont: CSSProperties
    logoText: string
    navItems: string[]
    headerBackground: string
    navTextColor: string
    navFont: CSSProperties
    iconColor: string
    cartCount: number
    // Plus icon props
    showPlusIcons: boolean
    plusIconColor: string
    plusIconBackground: string
    // Per-hotspot popup links (one entry per plus icon)
    plusIconItems: { text: string; link: string; price?: string }[]
    // Dark mode props
    darkHeaderBackground: string
    darkNavTextColor: string
    darkIconColor: string
    darkCardBackground: string
    darkTextColor: string
    darkDescriptionColor: string
    // Collections dropdown props
    collectionsDropdownBackground: string
    collectionsDropdownTextColor: string
    style?: CSSProperties
}

interface HotspotSpec {
    /** Zero-based index of the slide this hotspot belongs to. */
    slide: number
    top: string
    left: string
    thumbnail: string
    thumbnailAlt: string
}

// Where each shoppable hotspot sits on its slide. Positions are percentages of
// the hero image, so they hold up at every width.
//
// Array order is the contract: it is grouped four-per-slide, and a hotspot's
// position in this array is also its entry number in the Hotspot Links control
// and its hover id. That keeps the control's "entries 1-4 belong to slide 1"
// promise true by construction rather than by hand-maintained indexes.
const HOTSPOTS: HotspotSpec[] = [
    // Slide 1 — Hotspot Links entries 1-4
    {
        slide: 0,
        top: "49%",
        left: "25%",
        thumbnail:
            "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
        thumbnailAlt: "Bomber jacket detail",
    },
    {
        slide: 0,
        top: "60%",
        left: "62%",
        thumbnail:
            "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
        thumbnailAlt: "Ribbed knit polo detail",
    },
    {
        slide: 0,
        top: "48%",
        left: "50%",
        thumbnail:
            "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
        thumbnailAlt: "Layered outerwear detail",
    },
    {
        slide: 0,
        top: "27%",
        left: "32%",
        thumbnail:
            "https://framerusercontent.com/images/p0Q211wa1voNGpcE0BCeGp2ko.png",
        thumbnailAlt: "Chain necklace detail",
    },
    // Slide 2 — Hotspot Links entries 5-8
    {
        slide: 1,
        top: "13%",
        left: "39%",
        thumbnail:
            "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
        thumbnailAlt: "Merino turtleneck detail",
    },
    {
        slide: 1,
        top: "50%",
        left: "29%",
        thumbnail:
            "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
        thumbnailAlt: "Premium materials detail",
    },
    {
        slide: 1,
        top: "45%",
        left: "55%",
        thumbnail:
            "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
        thumbnailAlt: "Cotton twill detail",
    },
    {
        slide: 1,
        top: "6%",
        left: "62%",
        thumbnail:
            "https://framerusercontent.com/images/p0Q211wa1voNGpcE0BCeGp2ko.png",
        thumbnailAlt: "Refined detailing",
    },
    // Slide 3 — Hotspot Links entries 9-12
    {
        slide: 2,
        top: "23%",
        left: "55%",
        thumbnail:
            "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
        thumbnailAlt: "Durable craftsmanship detail",
    },
    {
        slide: 2,
        top: "56%",
        left: "21%",
        thumbnail:
            "https://framerusercontent.com/images/p0Q211wa1voNGpcE0BCeGp2ko.png",
        thumbnailAlt: "Tailored fit detail",
    },
    {
        slide: 2,
        top: "22%",
        left: "32%",
        thumbnail:
            "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
        thumbnailAlt: "Breathable fabric detail",
    },
    {
        slide: 2,
        top: "46%",
        left: "77%",
        thumbnail:
            "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
        thumbnailAlt: "Timeless silhouette detail",
    },
]

/**
 * Fe Mega Nav
 *
 * A tabbed mega-nav header over a shoppable image carousel. The nav sits in two
 * rounded tabs that hang off a scrolling announcement bar; nav labels ending in
 * "+" get a hover/focus dropdown. Slides carry a heading, description and link,
 * and can be pinned with shoppable hotspots. Includes a light/dark toggle and
 * collapses to a "Menu" button at phone widths.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HeroSection(props: HeroSectionProps) {
    const {
        slides: slidesProp,
        headingFont,
        descriptionFont,
        buttonFont,
        cardBackground = "#FFFFFF",
        textColor = "#000000",
        descriptionColor = "#666666",
        buttonTextColor = "#000000",
        buttonBorderColor = "#000000",
        arrowColor = "#FFFFFF",
        dotColor = "#FFFFFF",
        activeDotColor = "#FFFFFF",
        autoplay = false,
        autoplayInterval = 5000,
        showHeader = true,
        promoText = "Save 20% on your first order",
        promoBackground = "#000000",
        promoTextColor = "#FFFFFF",
        promoFont,
        logoText = "Fe Herospot",
        navItems = ["Shop", "Collections +", "About +", "Blog"],
        headerBackground = "#FFFFFF",
        navTextColor = "#000000",
        navFont,
        iconColor = "#000000",
        cartCount = 0,
        showPlusIcons = true,
        plusIconColor = "#000000",
        // Slightly translucent by default so the hotspot reads as glass over
        // the photo, matching the original hardcoded look.
        plusIconBackground = "hsla(0, 0%, 100%, 0.85)",
        plusIconItems = DEFAULT_HOTSPOTS,
        darkHeaderBackground = "#000000",
        darkNavTextColor = "#FFFFFF",
        darkIconColor = "#FFFFFF",
        darkCardBackground = "#000000",
        darkTextColor = "#FFFFFF",
        darkDescriptionColor = "#CCCCCC",
        collectionsDropdownBackground = "#FFFFFF",
        collectionsDropdownTextColor = "#000000",
    } = props

    // Resolve slides from code: an empty/cleared Slides control, or a slide with
    // no image set, falls back to DEFAULT_SLIDES so images never go missing.
    const slides: SlideData[] = useMemo(() => {
        const hasImage = (image: unknown) =>
            typeof image === "string"
                ? image.length > 0
                : Boolean(image && (image as { src?: string }).src)
        // A slide without an image is not renderable, so skip it. If the Slides
        // control is empty (or every entry is blank) fall back to the images
        // defined in DEFAULT_SLIDES above.
        const usable = (Array.isArray(slidesProp) ? slidesProp : []).filter(
            (slide) => slide && hasImage(slide.image)
        )
        return usable.length > 0 ? usable : DEFAULT_SLIDES
    }, [slidesProp])

    const [currentSlide, setCurrentSlide] = useState(0)
    const [hoveredIcon, setHoveredIcon] = useState<number | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    // Index of the nav item whose dropdown is currently open (null = none).
    // Tracking by index lets every dropdown nav item work independently.
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
        null
    )
    const [containerWidth, setContainerWidth] = useState(1200)
    const [headerHeight, setHeaderHeight] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const headerRef = useRef<HTMLElement>(null)
    const isStatic = useIsStaticRenderer()

    // Measure the component's own width so the header adapts to
    // desktop / tablet / phone breakpoints (works on Framer canvas + published site).
    // Also measure the header's height so the phone hero can start right below
    // it (the header is absolutely positioned over the top of the hero).
    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === "undefined") return

        const update = () => {
            setContainerWidth(node.offsetWidth)
            setHeaderHeight(headerRef.current?.offsetHeight ?? 0)
        }
        update()

        const observer = new ResizeObserver(update)
        observer.observe(node)
        if (headerRef.current) observer.observe(headerRef.current)
        return () => observer.disconnect()
    }, [])

    // Breakpoints — tablet gets the full desktop nav; only phone collapses
    // into a "Menu" button
    const isMobile = containerWidth < 768
    const isTablet = containerWidth >= 768 && containerWidth < 1024
    // Phone + tablet share the "stacked" hero layout (full image shown via a
    // real <img>, card pulled up below it). Only desktop uses the cropped,
    // full-frame background-image overlay layout.
    // Plus-icon hotspots are a touch smaller on tablet than desktop.
    const plusBtnSize = isTablet ? "26px" : "32px"
    const plusIconDim = isTablet ? "12" : "14"
    const plusPopupTop = isTablet ? "26px" : "32px"

    // Dropdown panels and the cards inside them are driven by the Dropdown BG /
    // Dropdown Text controls, so a dark panel stays readable without the user
    // having to touch anything else. Card surfaces are a low-alpha wash of the
    // text colour laid over the panel colour (via background-image, which paints
    // above background-color), so they read correctly on light and dark panels.
    const dropdownPanel = collectionsDropdownBackground
    const dropdownText = collectionsDropdownTextColor
    const [dropdownCardWash, dropdownCardHoverWash] = useMemo(() => {
        const wash = (alpha: number) => {
            try {
                const { h, s, l } = Color.toHsl(Color(dropdownText))
                return `hsla(${h}, ${s * 100}%, ${l * 100}%, ${alpha})`
            } catch {
                // Unparseable colour — a neutral wash still separates the card
                // from the panel.
                return `rgba(128, 128, 128, ${alpha})`
            }
        }
        const toLayer = (alpha: number) => {
            const c = wash(alpha)
            return `linear-gradient(${c}, ${c})`
        }
        return [toLayer(0.05), toLayer(0.11)]
    }, [dropdownText])

    useEffect(() => {
        // Never run the autoplay timer while rendering statically (Framer canvas
        // or export) — it would burn CPU in the editor and shift exported frames.
        if (isStatic || !autoplay || slides.length <= 1) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length)
            })
        }, autoplayInterval)

        return () => clearInterval(interval)
    }, [isStatic, autoplay, autoplayInterval, slides.length])

    const goToSlide = (index: number) => {
        startTransition(() => setCurrentSlide(index))
    }

    const goToPrevious = () => {
        startTransition(() => {
            setCurrentSlide(
                (prev) => (prev - 1 + slides.length) % slides.length
            )
        })
    }

    const goToNext = () => {
        startTransition(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        })
    }

    const currentSlideData = slides[currentSlide] || slides[0]

    // One toggle, rendered in the phone header and the desktop/tablet nav. A real
    // <button> so it is focusable and announced without hand-rolled key handling,
    // and aria-pressed so its on/off state is exposed.
    const renderThemeToggle = () => (
        <button
            type="button"
            onClick={() =>
                startTransition(() => setIsDarkMode((prev) => !prev))
            }
            style={{
                width: "36px",
                height: "20px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: isDarkMode ? "#333333" : "#EAEAEA",
                display: "flex",
                alignItems: "center",
                justifyContent: isDarkMode ? "flex-end" : "flex-start",
                padding: "3px",
                boxSizing: "border-box",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background-color 0.3s ease",
            }}
            aria-label="Toggle dark mode"
            aria-pressed={isDarkMode}
        >
            <span
                style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: isDarkMode
                        ? darkNavTextColor
                        : navTextColor,
                    transition: "background-color 0.3s ease",
                }}
            />
        </button>
    )

    // Resolve each hotspot's copy once, against the Hotspot Links control with
    // the built-in defaults as fallback. `spotIndex` is the hotspot's position
    // in HOTSPOTS, which is both its Hotspot Links entry number and its hover id.
    const hotspotsBySlide = (slideIndex: number) =>
        HOTSPOTS.map((spot, spotIndex) => ({ spot, spotIndex }))
            .filter(({ spot }) => spot.slide === slideIndex)
            .map(({ spot, spotIndex }) => {
                const item = plusIconItems?.[spotIndex]
                const fallback = DEFAULT_HOTSPOTS[spotIndex]
                return {
                    spot,
                    spotIndex,
                    label: item?.text || fallback?.text || "Product detail",
                    price: item?.price || fallback?.price || "",
                }
            })

    // Handle ResponsiveImage format - it may be a direct object with src or nested
    const getImageSrc = (image: any) => {
        if (!image) return DEFAULT_SLIDES[0].image.src
        if (typeof image === "string") return image
        return image.src || DEFAULT_SLIDES[0].image.src
    }

    const getImageAlt = (image: any) => {
        if (!image) return "Slide image"
        if (typeof image === "object" && image.alt) return image.alt
        return "Slide image"
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                // Phone: hug the content (image + card) so there's no empty
                // space above/below the full image. Tablet/desktop: fill frame.
                height: isMobile ? "auto" : "100%",
                overflow: "hidden",
                // In dark mode use square corners so the corners are filled with
                // the (black) component background instead of revealing the white
                // page behind the rounded corners. Light mode keeps the rounded
                // card look (its corners blend into the white page).
                borderRadius: isDarkMode ? "0px" : isMobile ? "16px" : "24px",
                clipPath: isDarkMode
                    ? "none"
                    : isMobile
                      ? "inset(0px round 16px)"
                      : "inset(0px round 24px)",
                backgroundColor: isDarkMode ? darkHeaderBackground : "#FFFFFF",
            }}
        >
            {/* Header — full-bleed black announcement bar with two white nav tabs
                hanging off it (logo+nav on the left, search+cart on the right),
                (logo+nav on the left, search+cart on the right) */}
            {showHeader && (
                <header
                    ref={headerRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: isMobile ? "12px" : "16px",
                        right: isMobile ? "12px" : "16px",
                        zIndex: 200,
                        boxSizing: "border-box",
                        // The header box spans the full width of the hero and its
                        // transparent Navigation Row wrapper used to swallow hover
                        // on any plus-icon hotspot placed near the top of a slide
                        // (e.g. the beanie hotspot on slide 2). Let clicks/hovers
                        // fall through here and re-enable them only on the actual
                        // interactive tabs below.
                        pointerEvents: "none",
                    }}
                >
                    {/* White backing behind the black bar so its rounded
                        bottom corners reveal white instead of the hero image */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: isMobile ? "42px" : "50px",
                            backgroundColor: isDarkMode
                                ? darkHeaderBackground
                                : headerBackground,
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    />

                    {/* Announcement / Promo Marquee — full-bleed black strip,
                        with rounded bottom corners (white showing in the notch) */}
                    <div
                        style={{
                            backgroundColor: isDarkMode
                                ? "#FFFFFF"
                                : promoBackground,
                            height: isMobile ? "36px" : "42px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            position: "relative",
                            zIndex: 1,
                            marginTop: isMobile ? "6px" : "8px",
                            marginBottom: 0,
                            borderRadius: isMobile ? "10px" : "14px",
                            clipPath: isMobile
                                ? "inset(0px round 10px)"
                                : "inset(0px round 14px)",
                        }}
                    >
                        <style>
                            {`@keyframes marqueeScroll{from{transform:translateX(0%)}to{transform:translateX(-50%)}}`}
                        </style>
                        {/* Scrolling promo marquee — confined to a narrow window
                            centered in the black bar, so text only scrolls through
                            the middle while the left/right stay solid black.
                            Faded at both edges of the window. */}
                        <div
                            style={{
                                width: isMobile ? "260px" : "560px",
                                maxWidth: "100%",
                                display: "flex",
                                overflow: "hidden",
                                maskImage:
                                    "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
                                WebkitMaskImage:
                                    "linear-gradient(to right, transparent 0%, #000 18%, #000 82%, transparent 100%)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    width: "max-content",
                                    animation: isStatic
                                        ? "none"
                                        : "marqueeScroll 40s linear infinite",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: isMobile ? "12px" : "13px",
                                    fontWeight: 600,
                                    letterSpacing: "0em",
                                    color: isDarkMode
                                        ? "#000000"
                                        : promoTextColor,
                                    whiteSpace: "nowrap",
                                    alignItems: "center",
                                    ...promoFont,
                                }}
                            >
                                {/* Eight copies: the -50% keyframe consumes
                                    exactly half the strip, so an even count
                                    loops seamlessly. Four copies per half is
                                    already wider than the widest (560px)
                                    marquee window. */}
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>{promoText}</span>
                                        <span
                                            style={{
                                                opacity: 0.5,
                                                margin: isMobile
                                                    ? "0 4px"
                                                    : "0 6px",
                                                fontSize: "14px",
                                                fontWeight: 400,
                                            }}
                                        >
                                            —
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* White spacer strip — full-width white band between the
                        black bar and the nav tabs */}
                    <div
                        style={{
                            height: isMobile ? "8px" : "10px",
                            backgroundColor: isDarkMode
                                ? darkHeaderBackground
                                : headerBackground,
                        }}
                    />

                    {/* Navigation Row — two white tabs that hang directly off the
                        black bar (flush at top, rounded bottom corners), with the
                        hero visible in the gap between them */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            backgroundColor: "transparent",
                        }}
                    >
                        {/* Left pill: Logo + (desktop nav + theme toggle) —
                            white tab hanging off the black bar, flush at the
                            left edge with a rounded bottom-right corner that
                            curves into the hero image */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isTablet ? "24px" : "34px",
                                paddingTop: isMobile ? "12px" : "14px",
                                paddingBottom: isMobile ? "12px" : "14px",
                                paddingLeft: isMobile
                                    ? "16px"
                                    : isTablet
                                      ? "20px"
                                      : "24px",
                                paddingRight: isMobile
                                    ? "20px"
                                    : isTablet
                                      ? "26px"
                                      : "32px",
                                backgroundColor: isDarkMode
                                    ? darkHeaderBackground
                                    : headerBackground,
                                borderBottomRightRadius: isMobile
                                    ? "16px"
                                    : "24px",
                                position: "relative",
                                pointerEvents: "auto",
                            }}
                        >
                            {/* Concave fillet — the tab's top-right flares
                                outward into the black bar with a smooth inverted
                                curve */}
                            <div
                                aria-hidden="true"
                                style={{
                                    // Desktop-only flourish; on phone the header
                                    // sits on white (not over the image).
                                    display: isMobile ? "none" : "block",
                                    position: "absolute",
                                    top: 0,
                                    left: "100%",
                                    width: isMobile ? "18px" : "26px",
                                    height: isMobile ? "18px" : "26px",
                                    background:
                                        "radial-gradient(circle farthest-side at bottom right, transparent 98%, " +
                                        (isDarkMode
                                            ? darkHeaderBackground
                                            : headerBackground) +
                                        " 100%)",
                                    pointerEvents: "none",
                                }}
                            />
                            {/* Inverted (concave) corner at the tab's
                                bottom-left — the white flares down into the hero
                                with a reverse curve */}
                            <div
                                aria-hidden="true"
                                style={{
                                    display: isMobile ? "none" : "block",
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    width: isMobile ? "16px" : "22px",
                                    height: isMobile ? "16px" : "22px",
                                    background:
                                        "radial-gradient(circle farthest-side at bottom right, transparent 98%, " +
                                        (isDarkMode
                                            ? darkHeaderBackground
                                            : headerBackground) +
                                        " 100%)",
                                    pointerEvents: "none",
                                }}
                            />
                            {/* Logo */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "9px",
                                    color: isDarkMode
                                        ? darkNavTextColor
                                        : navTextColor,
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke={
                                            isDarkMode
                                                ? darkNavTextColor
                                                : navTextColor
                                        }
                                        strokeWidth="2"
                                    />
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="3.5"
                                        fill={
                                            isDarkMode
                                                ? darkNavTextColor
                                                : navTextColor
                                        }
                                    />
                                </svg>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: isMobile ? "16px" : "17px",
                                        letterSpacing: "-0.01em",
                                        ...navFont,
                                    }}
                                >
                                    {logoText}
                                </span>
                            </div>

                            {/* Theme toggle next to the logo — phone only */}
                            {isMobile && renderThemeToggle()}

                            {/* Desktop / Tablet inline nav + theme toggle */}
                            {!isMobile && (
                                <nav
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: isTablet ? "20px" : "28px",
                                    }}
                                >
                                    {/* Vertical text-roll on hover — the menu
                                        name scrolls top-to-bottom and the same
                                        name rolls back into place */}
                                    <style>
                                        {`.fe-nav-roll{display:inline-block;overflow:hidden;vertical-align:top;height:24px}.fe-nav-roll-inner{display:block;transform:translateY(-50%);transition:transform .6s cubic-bezier(.65,0,.35,1)}.fe-nav-roll:hover .fe-nav-roll-inner{transform:translateY(0)}`}
                                    </style>
                                    {navItems.map((item, index) => {
                                        const lower = item.toLowerCase()
                                        const isAbout = lower.includes("about")
                                        // Any item flagged with a trailing "+"
                                        // (e.g. "Collections +", "Category +"),
                                        // or named like a category/collection,
                                        // gets a hover dropdown.
                                        const hasDropdown =
                                            item.includes("+") ||
                                            /collection|categor|about/i.test(
                                                item
                                            )
                                        const isOpen =
                                            hasDropdown &&
                                            openDropdownIndex === index

                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    position: "relative",
                                                    overflow: "visible",
                                                }}
                                                onMouseEnter={() => {
                                                    if (hasDropdown) {
                                                        startTransition(() =>
                                                            setOpenDropdownIndex(
                                                                index
                                                            )
                                                        )
                                                    }
                                                }}
                                                onMouseLeave={() => {
                                                    if (hasDropdown) {
                                                        startTransition(() =>
                                                            setOpenDropdownIndex(
                                                                null
                                                            )
                                                        )
                                                    }
                                                }}
                                                // Keyboard parity with hover:
                                                // focus anywhere inside opens the
                                                // panel, focus leaving it (or
                                                // Escape) closes it. Without this
                                                // the dropdowns are unreachable
                                                // without a mouse.
                                                onFocus={() => {
                                                    if (hasDropdown) {
                                                        startTransition(() =>
                                                            setOpenDropdownIndex(
                                                                index
                                                            )
                                                        )
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    if (
                                                        hasDropdown &&
                                                        !e.currentTarget.contains(
                                                            e.relatedTarget as Node | null
                                                        )
                                                    ) {
                                                        startTransition(() =>
                                                            setOpenDropdownIndex(
                                                                null
                                                            )
                                                        )
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Escape" &&
                                                        isOpen
                                                    ) {
                                                        startTransition(() =>
                                                            setOpenDropdownIndex(
                                                                null
                                                            )
                                                        )
                                                    }
                                                }}
                                            >
                                                <a
                                                    href="#"
                                                    className="fe-nav-roll"
                                                    aria-haspopup={
                                                        hasDropdown || undefined
                                                    }
                                                    aria-expanded={
                                                        hasDropdown
                                                            ? isOpen
                                                            : undefined
                                                    }
                                                    style={{
                                                        color: isDarkMode
                                                            ? darkNavTextColor
                                                            : navTextColor,
                                                        textDecoration: "none",
                                                        fontSize: "15px",
                                                        fontWeight: 500,
                                                        ...navFont,
                                                    }}
                                                >
                                                    <span className="fe-nav-roll-inner">
                                                        <span
                                                            style={{
                                                                display:
                                                                    "block",
                                                                height: "24px",
                                                                lineHeight:
                                                                    "24px",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {item}
                                                        </span>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "block",
                                                                height: "24px",
                                                                lineHeight:
                                                                    "24px",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {item}
                                                        </span>
                                                    </span>
                                                </a>

                                                {/* Invisible hover bridge —
                                                    fills the gap between the nav
                                                    link and the dropdown so the
                                                    cursor can travel down into
                                                    the dropdown without it
                                                    closing */}
                                                {isOpen && (
                                                    <div
                                                        aria-hidden="true"
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "100%",
                                                            left: "-20px",
                                                            right: "-20px",
                                                            height: "20px",
                                                            zIndex: 99,
                                                        }}
                                                    />
                                                )}

                                                {/* Collections Dropdown — dark
                                                    panel with white cards
                                                    (thumbnail + name + arrow) */}
                                                {isOpen && !isAbout && (
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "100%",
                                                            left: "0",
                                                            marginTop: "14px",
                                                            backgroundColor:
                                                                dropdownPanel,
                                                            borderRadius:
                                                                "22px",
                                                            padding: "14px",
                                                            boxShadow:
                                                                "0 14px 34px rgba(0, 0, 0, 0.28)",
                                                            minWidth: "320px",
                                                            zIndex: 100,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: "12px",
                                                        }}
                                                    >
                                                        {[
                                                            {
                                                                name: "Outerwear",
                                                                img: "https://framerusercontent.com/images/p0Q211wa1voNGpcE0BCeGp2ko.png",
                                                            },
                                                            {
                                                                name: "Knitwear",
                                                                img: "https://framerusercontent.com/images/qAsRQGphEeKdfmfI6HHI24y2zTo.png",
                                                            },
                                                            {
                                                                name: "Tailoring",
                                                                img: "https://framerusercontent.com/images/Lka4lWNMTZhGU7pJjwmc3npceFk.png",
                                                            },
                                                        ].map((col, ci) => (
                                                            <a
                                                                key={ci}
                                                                href="#"
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "16px",
                                                                    padding:
                                                                        "12px",
                                                                    borderRadius:
                                                                        "16px",
                                                                    backgroundColor:
                                                                        dropdownPanel,
                                                                    backgroundImage:
                                                                        dropdownCardWash,
                                                                    textDecoration:
                                                                        "none",
                                                                    transition:
                                                                        "background-image 0.2s ease",
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.backgroundImage =
                                                                        dropdownCardHoverWash
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.backgroundImage =
                                                                        dropdownCardWash
                                                                }}
                                                            >
                                                                <img
                                                                    src={
                                                                        col.img
                                                                    }
                                                                    alt={
                                                                        col.name
                                                                    }
                                                                    loading="lazy"
                                                                    decoding="async"
                                                                    style={{
                                                                        width: "52px",
                                                                        height: "52px",
                                                                        borderRadius:
                                                                            "12px",
                                                                        objectFit:
                                                                            "cover",
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                                <span
                                                                    style={{
                                                                        flex: 1,
                                                                        color: dropdownText,
                                                                        fontSize:
                                                                            "16px",
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {col.name}
                                                                </span>
                                                                <svg
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke={
                                                                        dropdownText
                                                                    }
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <line
                                                                        x1="5"
                                                                        y1="12"
                                                                        x2="19"
                                                                        y2="12"
                                                                    />
                                                                    <polyline points="12 5 19 12 12 19" />
                                                                </svg>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* About Dropdown — dark panel
                                                    with white cards (name + arrow) */}
                                                {isOpen && isAbout && (
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "100%",
                                                            left: "0",
                                                            marginTop: "14px",
                                                            backgroundColor:
                                                                dropdownPanel,
                                                            borderRadius:
                                                                "22px",
                                                            padding: "14px",
                                                            boxShadow:
                                                                "0 14px 34px rgba(0, 0, 0, 0.28)",
                                                            minWidth: "240px",
                                                            zIndex: 100,
                                                            display: "flex",
                                                            flexDirection:
                                                                "column",
                                                            gap: "12px",
                                                        }}
                                                    >
                                                        {[
                                                            "About",
                                                            "Contact",
                                                            "FAQ",
                                                        ].map((link, li) => (
                                                            <a
                                                                key={li}
                                                                href="#"
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    padding:
                                                                        "14px 16px",
                                                                    borderRadius:
                                                                        "16px",
                                                                    backgroundColor:
                                                                        dropdownPanel,
                                                                    backgroundImage:
                                                                        dropdownCardWash,
                                                                    textDecoration:
                                                                        "none",
                                                                    transition:
                                                                        "background-image 0.2s ease",
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.backgroundImage =
                                                                        dropdownCardHoverWash
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.backgroundImage =
                                                                        dropdownCardWash
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        color: dropdownText,
                                                                        fontSize:
                                                                            "16px",
                                                                        fontWeight: 500,
                                                                    }}
                                                                >
                                                                    {link}
                                                                </span>
                                                                <svg
                                                                    width="20"
                                                                    height="20"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke={
                                                                        dropdownText
                                                                    }
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                >
                                                                    <line
                                                                        x1="5"
                                                                        y1="12"
                                                                        x2="19"
                                                                        y2="12"
                                                                    />
                                                                    <polyline points="12 5 19 12 12 19" />
                                                                </svg>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {/* Theme toggle pill (dot on the left) */}
                                    {renderThemeToggle()}
                                </nav>
                            )}
                        </div>

                        {/* Right pill: Search + Cart (+ hamburger on compact) —
                            white tab hanging off the black bar, flush at the
                            right edge with a rounded bottom-left corner */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? "14px" : "16px",
                                flexShrink: 0,
                                paddingTop: isMobile ? "12px" : "14px",
                                paddingBottom: isMobile ? "12px" : "14px",
                                paddingRight: isMobile
                                    ? "16px"
                                    : isTablet
                                      ? "20px"
                                      : "24px",
                                paddingLeft: isMobile
                                    ? "20px"
                                    : isTablet
                                      ? "26px"
                                      : "32px",
                                backgroundColor: isDarkMode
                                    ? darkHeaderBackground
                                    : headerBackground,
                                borderBottomLeftRadius: isMobile
                                    ? "16px"
                                    : "24px",
                                position: "relative",
                                pointerEvents: "auto",
                            }}
                        >
                            {/* Concave fillet — the tab's top-left flares
                                outward into the black bar with a smooth inverted
                                curve */}
                            <div
                                aria-hidden="true"
                                style={{
                                    display: isMobile ? "none" : "block",
                                    position: "absolute",
                                    top: 0,
                                    right: "100%",
                                    width: isMobile ? "18px" : "26px",
                                    height: isMobile ? "18px" : "26px",
                                    background:
                                        "radial-gradient(circle farthest-side at bottom left, transparent 98%, " +
                                        (isDarkMode
                                            ? darkHeaderBackground
                                            : headerBackground) +
                                        " 100%)",
                                    pointerEvents: "none",
                                }}
                            />
                            {/* Inverted (concave) corner at the tab's
                                bottom-right — the white flares down into the hero
                                with a reverse curve */}
                            <div
                                aria-hidden="true"
                                style={{
                                    display: isMobile ? "none" : "block",
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    width: isMobile ? "16px" : "22px",
                                    height: isMobile ? "16px" : "22px",
                                    background:
                                        "radial-gradient(circle farthest-side at bottom left, transparent 98%, " +
                                        (isDarkMode
                                            ? darkHeaderBackground
                                            : headerBackground) +
                                        " 100%)",
                                    pointerEvents: "none",
                                }}
                            />
                            {/* Search Icon */}
                            <button
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "opacity 0.2s ease",
                                }}
                                aria-label="Search"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.6"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1"
                                }}
                            >
                                <svg
                                    width="19"
                                    height="19"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={
                                        isDarkMode ? darkIconColor : iconColor
                                    }
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>

                            {/* Cart Icon */}
                            <button
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    transition: "opacity 0.2s ease",
                                }}
                                aria-label="Shopping cart"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.6"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1"
                                }}
                            >
                                <svg
                                    width="19"
                                    height="19"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={
                                        isDarkMode ? darkIconColor : iconColor
                                    }
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                <span
                                    style={{
                                        color: isDarkMode
                                            ? darkNavTextColor
                                            : navTextColor,
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        ...navFont,
                                    }}
                                >
                                    ({cartCount})
                                </span>
                            </button>

                            {/* Hamburger — only on tablet / phone */}
                            {isMobile && (
                                <button
                                    onClick={() =>
                                        startTransition(() =>
                                            setMenuOpen((prev) => !prev)
                                        )
                                    }
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                        marginLeft: "2px",
                                        display: "flex",
                                        alignItems: "center",
                                        color: isDarkMode
                                            ? darkNavTextColor
                                            : navTextColor,
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        ...navFont,
                                    }}
                                    aria-label="Menu"
                                    aria-expanded={menuOpen}
                                >
                                    Menu
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile dropdown menu (phone only) */}
                    {isMobile && menuOpen && (
                        <nav
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                                marginTop: "8px",
                                marginLeft: isMobile ? "12px" : "16px",
                                marginRight: isMobile ? "12px" : "16px",
                                backgroundColor: isDarkMode
                                    ? darkHeaderBackground
                                    : headerBackground,
                                borderRadius: "18px",
                                paddingTop: "6px",
                                paddingBottom: "6px",
                                paddingLeft: "14px",
                                paddingRight: "14px",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
                                pointerEvents: "auto",
                            }}
                        >
                            {navItems.map((item, index) => (
                                <a
                                    key={index}
                                    href="#"
                                    style={{
                                        color: isDarkMode
                                            ? darkNavTextColor
                                            : navTextColor,
                                        textDecoration: "none",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        padding: "11px 6px",
                                        borderTop:
                                            index === 0
                                                ? "none"
                                                : isDarkMode
                                                  ? "1px solid rgba(255,255,255,0.10)"
                                                  : "1px solid rgba(0,0,0,0.06)",
                                        ...navFont,
                                    }}
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                    )}
                </header>
            )}

            {/* Hero Image Container — inset from the bottom so a white gap
                shows below the hero image */}
            <div
                style={{
                    // Phone: relative + auto height so the container hugs the
                    // full image (no top/bottom gap). Tablet/desktop: absolute,
                    // filling the frame minus insets.
                    ...(isMobile
                        ? {
                              position: "relative",
                              marginTop: showHeader
                                  ? `${headerHeight}px`
                                  : "0px",
                              // Full-bleed (edge to edge) so the image is bigger.
                              marginLeft: "0px",
                              marginRight: "0px",
                              marginBottom: "0px",
                          }
                        : {
                              position: "absolute",
                              top: 0,
                              left: "16px",
                              right: "16px",
                              bottom: "16px",
                          }),
                    overflow: "hidden",
                    borderBottomLeftRadius: isMobile ? "16px" : "24px",
                    borderBottomRightRadius: isMobile ? "16px" : "24px",
                    clipPath: isMobile
                        ? "inset(0px round 0px 0px 16px 16px)"
                        : "inset(0px round 0px 0px 24px 24px)",
                }}
            >
                {/* Slider Container */}
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        style={{
                            // Phone: the active slide is `relative` so the hero
                            // hugs the image's natural height (full image, no
                            // crop on any side, no top/bottom gap). Other slides
                            // stay absolute & faded out.
                            // Tablet/desktop: absolute background image (cover).
                            ...(isMobile
                                ? {
                                      position:
                                          index === currentSlide
                                              ? "relative"
                                              : "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                  }
                                : {
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      height: "100%",
                                      backgroundImage: `url(${getImageSrc(slide.image)})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      backgroundRepeat: "no-repeat",
                                  }),
                            opacity: index === currentSlide ? 1 : 0,
                            transition: isStatic
                                ? "none"
                                : "opacity 0.6s ease-in-out",
                            pointerEvents:
                                index === currentSlide ? "auto" : "none",
                        }}
                        role="img"
                        aria-label={getImageAlt(slide.image)}
                    >
                        {/* Phone: real <img> so the full image shows.
                            `cover` fills the box (centered).
                            Adjust `aspectRatio` to taste (e.g. "4 / 5" = taller,
                            "4 / 3" = shorter). */}
                        {isMobile && (
                            <img
                                src={getImageSrc(slide.image)}
                                alt={getImageAlt(slide.image)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    height: "auto",
                                    objectFit: "cover",
                                    objectPosition: "center",
                                }}
                            />
                        )}
                        {/* Dark Overlay */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: isDarkMode
                                    ? "rgba(0, 0, 0, 0.5)"
                                    : "rgba(0, 0, 0, 0.2)",
                                transition: "background-color 0.3s ease",
                            }}
                        />

                        {/* Phone slide arrows — overlaid on the image,
                            left & right, vertically centered */}
                        {isMobile &&
                            slides.length > 1 &&
                            index === currentSlide && (
                                <>
                                    <button
                                        onClick={goToPrevious}
                                        style={{
                                            position: "absolute",
                                            left: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "transparent",
                                            border: "none",
                                            padding: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 10,
                                        }}
                                        aria-label="Previous slide"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={arrowColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToNext}
                                        style={{
                                            position: "absolute",
                                            right: "12px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "transparent",
                                            border: "none",
                                            padding: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 10,
                                        }}
                                        aria-label="Next slide"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={arrowColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </>
                            )}

                        {/* Shoppable hotspots for this slide (desktop + tablet) */}
                        {showPlusIcons && !isMobile && (
                            <>
                                {hotspotsBySlide(index).map(
                                    ({ spot, spotIndex, label, price }) => (
                                        <div
                                            key={spotIndex}
                                            style={{
                                                position: "absolute",
                                                top: spot.top,
                                                left: spot.left,
                                                zIndex: 8,
                                            }}
                                            onMouseEnter={() =>
                                                startTransition(() =>
                                                    setHoveredIcon(spotIndex)
                                                )
                                            }
                                            onMouseLeave={() =>
                                                startTransition(() =>
                                                    setHoveredIcon(null)
                                                )
                                            }
                                        >
                                            <button
                                                style={{
                                                    width: plusBtnSize,
                                                    height: plusBtnSize,
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        plusIconBackground,
                                                    border: "1px solid rgba(255, 255, 255, 0.6)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow:
                                                        "0 2px 10px rgba(0, 0, 0, 0.18)",
                                                }}
                                                // Keyboard users get the same popup
                                                // as mouse users.
                                                onFocus={() =>
                                                    startTransition(() =>
                                                        setHoveredIcon(
                                                            spotIndex
                                                        )
                                                    )
                                                }
                                                onBlur={() =>
                                                    startTransition(() =>
                                                        setHoveredIcon(null)
                                                    )
                                                }
                                                aria-label={
                                                    price
                                                        ? `${label} — ${price}`
                                                        : label
                                                }
                                                aria-expanded={
                                                    hoveredIcon === spotIndex
                                                }
                                            >
                                                <svg
                                                    width={plusIconDim}
                                                    height={plusIconDim}
                                                    viewBox="0 0 16 16"
                                                    fill="none"
                                                    stroke={plusIconColor}
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                    style={{
                                                        transform:
                                                            hoveredIcon ===
                                                            spotIndex
                                                                ? "rotate(45deg)"
                                                                : "rotate(0deg)",
                                                        transition:
                                                            "transform 0.3s ease",
                                                    }}
                                                >
                                                    <line
                                                        x1="8"
                                                        y1="3"
                                                        x2="8"
                                                        y2="13"
                                                    />
                                                    <line
                                                        x1="3"
                                                        y1="8"
                                                        x2="13"
                                                        y2="8"
                                                    />
                                                </svg>
                                            </button>

                                            {/* Hover / focus popup */}
                                            {hoveredIcon === spotIndex && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: plusPopupTop,
                                                        left: "0",
                                                        backgroundColor:
                                                            "#FFFFFF",
                                                        borderRadius: "12px",
                                                        padding: "12px",
                                                        boxShadow:
                                                            "0 4px 20px rgba(0, 0, 0, 0.15)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        minWidth: "220px",
                                                        zIndex: 20,
                                                    }}
                                                >
                                                    <img
                                                        src={spot.thumbnail}
                                                        alt={spot.thumbnailAlt}
                                                        // Hover-only imagery, so it
                                                        // must not compete with the
                                                        // hero for bandwidth.
                                                        loading="lazy"
                                                        decoding="async"
                                                        style={{
                                                            width: "48px",
                                                            height: "48px",
                                                            borderRadius: "8px",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            fontSize: "14px",
                                                            color: "#000000",
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <a
                                                            href={
                                                                plusIconItems[
                                                                    spotIndex
                                                                ]?.link || "#"
                                                            }
                                                            style={{
                                                                color: "#000000",
                                                                textDecoration:
                                                                    "none",
                                                            }}
                                                            onMouseEnter={(
                                                                e
                                                            ) => {
                                                                e.currentTarget.style.textDecoration =
                                                                    "underline"
                                                            }}
                                                            onMouseLeave={(
                                                                e
                                                            ) => {
                                                                e.currentTarget.style.textDecoration =
                                                                    "none"
                                                            }}
                                                        >
                                                            {label}
                                                        </a>
                                                        <span
                                                            style={{
                                                                display:
                                                                    "block",
                                                                marginTop:
                                                                    "4px",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight: 600,
                                                                color: "#000000",
                                                            }}
                                                        >
                                                            {price}
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                ))}

                {/* Navigation Arrows — tablet/desktop (phone stacked layout
                    uses the arrows overlaid on the image) */}
                {slides.length > 1 && !isMobile && (
                    <>
                        {/* Left Arrow */}
                        <button
                            onClick={goToPrevious}
                            style={{
                                position: "absolute",
                                left: isMobile
                                    ? "12px"
                                    : isTablet
                                      ? "16px"
                                      : "24px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: isMobile ? "8px" : "12px",
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Previous slide"
                        >
                            <svg
                                width={isMobile ? "24" : "32"}
                                height={isMobile ? "24" : "32"}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        {/* Right Arrow */}
                        <button
                            onClick={goToNext}
                            style={{
                                position: "absolute",
                                right: isMobile
                                    ? "12px"
                                    : isTablet
                                      ? "16px"
                                      : "24px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: isMobile ? "8px" : "12px",
                                zIndex: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Next slide"
                        >
                            <svg
                                width={isMobile ? "24" : "32"}
                                height={isMobile ? "24" : "32"}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Content Card */}
                <div
                    style={{
                        // Phone: in-flow card pulled UP into the image so it
                        // overlaps the lower part of the photo (reference look),
                        // while the rest of the full image stays visible.
                        // Tablet: full-width overlay anchored bottom.
                        // Desktop: overlay anchored bottom-left.
                        ...(isMobile
                            ? {
                                  position: "relative",
                                  marginTop: "-96px",
                                  marginLeft: "16px",
                                  marginRight: "16px",
                                  marginBottom: "12px",
                                  maxWidth: "100%",
                              }
                            : {
                                  position: "absolute",
                                  bottom: isTablet ? "30px" : "40px",
                                  left: isTablet ? "24px" : "40px",
                                  right: isTablet ? "24px" : "auto",
                                  maxWidth: isTablet ? "none" : "480px",
                              }),
                        backgroundColor: isDarkMode
                            ? darkCardBackground
                            : cardBackground,
                        borderRadius: isMobile
                            ? "16px"
                            : isTablet
                              ? "20px"
                              : "24px",
                        padding: isMobile
                            ? "40px 32px"
                            : isTablet
                              ? "52px 40px"
                              : "60px 48px",
                        zIndex: 5,
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                        transition: "background-color 0.3s ease",
                    }}
                >
                    <h1
                        style={{
                            margin: "0 0 16px 0",
                            color: isDarkMode ? darkTextColor : textColor,
                            ...headingFont,
                            ...(isMobile
                                ? { fontSize: "24px" }
                                : isTablet
                                  ? { fontSize: "28px" }
                                  : {}),
                        }}
                    >
                        {currentSlideData.heading}
                    </h1>
                    <p
                        style={{
                            margin: "0 0 24px 0",
                            color: isDarkMode
                                ? darkDescriptionColor
                                : descriptionColor,
                            ...descriptionFont,
                            ...(isMobile ? { fontSize: "14px" } : {}),
                        }}
                    >
                        {currentSlideData.description}
                    </p>
                    <a
                        href={currentSlideData.buttonLink || "#"}
                        style={{
                            display: "inline-block",
                            color: buttonTextColor,
                            textDecoration: "underline",
                            textUnderlineOffset: "4px",
                            cursor: "pointer",
                            ...buttonFont,
                            ...(isMobile ? { fontSize: "13px" } : {}),
                        }}
                    >
                        {currentSlideData.buttonText}
                    </a>
                </div>

                {/* Pagination dots — desktop only. Desktop's card is capped at
                    480px so the dots sit on the photo beside it. At tablet width
                    the card goes full-bleed and would sit underneath the dots
                    (white on white), so tablet and phone use the arrows instead. */}
                {slides.length > 1 && !isMobile && !isTablet && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: isTablet ? "30px" : "40px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            zIndex: 10,
                        }}
                    >
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                style={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    border: "none",
                                    backgroundColor:
                                        index === currentSlide
                                            ? activeDotColor
                                            : dotColor,
                                    opacity: index === currentSlide ? 1 : 0.5,
                                    cursor: "pointer",
                                    padding: 0,
                                    transition: "opacity 0.3s ease",
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                                aria-current={
                                    index === currentSlide ? "true" : "false"
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Layer name on the canvas matches the published component name.
HeroSection.displayName = "Fe Mega Nav"

// Control order: content first (slides, then header), then the hotspots layered
// over the slides, then typography, then colours, then dark-mode overrides, and
// finally carousel behaviour.
addPropertyControls(HeroSection, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description:
            "One entry per slide. A slide with no image is skipped; if no entry has an image, the three built-in slides are shown instead.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                heading: {
                    type: ControlType.String,
                    title: "Heading",
                    defaultValue: "Natural Elegance in Every Detail",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "Crafted from soft, breathable fabrics with a clean finish, timeless and durable.",
                    displayTextArea: true,
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "View Product",
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
    },
    showHeader: {
        type: ControlType.Boolean,
        title: "Show Header",
        description:
            "Turn off when the page already has its own nav above this section.",
        defaultValue: true,
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Fe Herospot",
        hidden: ({ showHeader }) => !showHeader,
    },
    navItems: {
        type: ControlType.Array,
        title: "Nav Items",
        description:
            "End a label with a plus sign to give it a dropdown menu, for example Collections +.",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Shop", "Collections +", "About +", "Blog"],
        hidden: ({ showHeader }) => !showHeader,
    },
    promoText: {
        type: ControlType.String,
        title: "Promo Text",
        defaultValue: "Save 20% on your first order",
        hidden: ({ showHeader }) => !showHeader,
    },
    headerBackground: {
        type: ControlType.Color,
        title: "Header Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showHeader }) => !showHeader,
    },
    navTextColor: {
        type: ControlType.Color,
        title: "Nav Text Color",
        defaultValue: "#000000",
        hidden: ({ showHeader }) => !showHeader,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
        hidden: ({ showHeader }) => !showHeader,
    },
    cartCount: {
        type: ControlType.Number,
        title: "Cart Count",
        description: "Number shown in brackets next to the cart icon.",
        defaultValue: 0,
        min: 0,
        max: 99,
        step: 1,
        hidden: ({ showHeader }) => !showHeader,
    },
    promoBackground: {
        type: ControlType.Color,
        title: "Promo Background",
        defaultValue: "#000000",
        hidden: ({ showHeader }) => !showHeader,
    },
    promoTextColor: {
        type: ControlType.Color,
        title: "Promo Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showHeader }) => !showHeader,
    },
    collectionsDropdownBackground: {
        type: ControlType.Color,
        title: "Dropdown BG",
        defaultValue: "#FFFFFF",
        hidden: ({ showHeader }) => !showHeader,
    },
    collectionsDropdownTextColor: {
        type: ControlType.Color,
        title: "Dropdown Text",
        defaultValue: "#000000",
        hidden: ({ showHeader }) => !showHeader,
    },
    showPlusIcons: {
        type: ControlType.Boolean,
        title: "Show Plus Icons",
        description:
            "Shoppable hotspots pinned over the slide image. Always hidden at phone widths.",
        defaultValue: true,
    },
    plusIconItems: {
        type: ControlType.Array,
        title: "Hotspot Links",
        description:
            "Up to 12 hotspots, filled in slide order: entries 1-4 belong to slide 1, 5-8 to slide 2, 9-12 to slide 3.",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Product detail",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$0.00",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: DEFAULT_HOTSPOTS,
        hidden: ({ showPlusIcons }) => !showPlusIcons,
    },
    plusIconColor: {
        type: ControlType.Color,
        title: "Plus Icon Color",
        defaultValue: "#000000",
        hidden: ({ showPlusIcons }) => !showPlusIcons,
    },
    plusIconBackground: {
        type: ControlType.Color,
        title: "Plus Icon Background",
        defaultValue: "hsla(0, 0%, 100%, 0.85)",
        hidden: ({ showPlusIcons }) => !showPlusIcons,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.5em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    navFont: {
        type: ControlType.Font,
        title: "Nav Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        hidden: ({ showHeader }) => !showHeader,
    },
    promoFont: {
        type: ControlType.Font,
        title: "Promo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        hidden: ({ showHeader }) => !showHeader,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#000000",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#666666",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#000000",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
    },
    activeDotColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "#FFFFFF",
    },
    darkHeaderBackground: {
        type: ControlType.Color,
        title: "Dark Header BG",
        description:
            "Used when the header sits over a dark part of the slide image.",
        defaultValue: "#000000",
        hidden: ({ showHeader }) => !showHeader,
    },
    darkNavTextColor: {
        type: ControlType.Color,
        title: "Dark Nav Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showHeader }) => !showHeader,
    },
    darkIconColor: {
        type: ControlType.Color,
        title: "Dark Icon Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showHeader }) => !showHeader,
    },
    darkCardBackground: {
        type: ControlType.Color,
        title: "Dark Card BG",
        defaultValue: "#000000",
    },
    darkTextColor: {
        type: ControlType.Color,
        title: "Dark Heading",
        defaultValue: "#FFFFFF",
    },
    darkDescriptionColor: {
        type: ControlType.Color,
        title: "Dark Description",
        defaultValue: "#CCCCCC",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description:
            "Advances slides on a timer. Always paused on the Framer canvas and in exports.",
        defaultValue: false,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        description: "How long each slide stays on screen before advancing.",
        defaultValue: 5000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoplay }) => !autoplay,
    },
})
