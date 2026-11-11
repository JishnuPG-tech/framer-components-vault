// Browser Window
// -----------------------------------------------------------
// Made by Detailed (detailed.ch) with Framer Workshop
// V11.2
// Last updated: 15 April 2026
// -----------------------------------------------------------

import {
    useState,
    startTransition,
    type CSSProperties,
    useRef,
    useEffect,
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


interface Website {
    name: string
    url: string
    favicon: {
        src: string
        alt: string
    }
    image: {
        src: string
        alt: string
    }
    mobileImage?: {
        src: string
        alt: string
    }
    overlayHeadline: string
    overlaySubline: string
    logoImage: {
        src: string
        alt: string
    }
    overlayButtonText: string
    buttonLink: string
    buttonTarget: "_blank" | "_self"
    enableOverlay: boolean
    featuredLink: string
    featuredTarget?: "_blank" | "_self"
    overlayAlignment?: "left" | "center" | "right"
    logoImageSize?: number
    showTooltip?: boolean
    tooltipLine1?: string
    tooltipLine2?: string
    embedUrl?: string
    tooltipColorOverride?: boolean
    tooltipCustomBackgroundColor?: string
    tooltipCustomTextColor?: string
    overlayOverride?: boolean
    customHeadlineFont?: any
    customHeadlineColor?: string
    customSublineFont?: any
    customSublineColor?: string
    customButtonFont?: any
    customButtonTextColor?: string
    overlayHeadlineWidth?: number
    overlaySublineWidth?: number
    overlayGap?: number
}

interface BrowserWindowProps {
    browserVariant: "desktop" | "mobile"
    darkMode: boolean
    websites: Website[]
    backgroundColor: string
    barColor: string
    textColor: string
    accentColor: string
    headlineFont: any
    sublineFont: any
    buttonFont: any
    headlineColor: string
    sublineColor: string
    buttonTextColor: string
    maxVisibleWebsites: number
    customText?: string
    showTrafficLights: boolean
    trafficLightSize: number
    trafficLightRedColor: string
    trafficLightYellowColor: string
    trafficLightGreenColor: string
    showNavArrows: boolean
    navArrowSize: number
    showUrlBar: boolean
    urlBarFont: any
    urlBarHeight: number
    showShareButton: boolean
    shareButtonSize: number
    showFavoritesBar: boolean
    favoritesBarHeight: number
    favoritesFont: any
    faviconSize: number
    showCustomText: boolean
    customTextFont: any
    showDropdown: boolean
    showOneTimeNote: boolean
    hoverDelay: number
    showTooltips: boolean
    tooltipFont: any
    tooltipBackgroundColor: string
    tooltipTextColor: string
    tooltipBorderColor: string
    showOverlays: boolean
    overlayHeadlineWidth?: number
    overlaySublineWidth?: number
    overlayGap?: number
    enableScrollAnimation: boolean
    enableTilt: boolean
    scrollStartTiltAngle: number
    scrollEndTiltAngle: number
    scrollDistance: number
    scrollAnimationTriggerOffset: number
    scrollAnimationDuration: number
    scrollAnimationMode: "scroll" | "viewport" | "both"
    enableScale: boolean
    scrollStartScale: number
    scrollEndScale: number
    enableOpacity: boolean
    scrollStartOpacity: number
    scrollEndOpacity: number
    enableBlur: boolean
    scrollStartBlur: number
    scrollEndBlur: number
    enableTranslateX: boolean
    scrollStartTranslateX: number
    scrollEndTranslateX: number
    enableTranslateY: boolean
    scrollStartTranslateY: number
    scrollEndTranslateY: number
    enableRotateY: boolean
    scrollStartRotateY: number
    scrollEndRotateY: number
    enableRotateZ: boolean
    scrollStartRotateZ: number
    scrollEndRotateZ: number
    enableExitAnimation: boolean
    exitScrollDistance: number
    enableExitTilt: boolean
    exitTiltAngle: number
    enableExitScale: boolean
    exitScale: number
    enableExitOpacity: boolean
    exitOpacity: number
    enableExitBlur: boolean
    exitBlur: number
    enableExitTranslateX: boolean
    exitTranslateX: number
    enableExitTranslateY: boolean
    exitTranslateY: number
    enableExitRotateY: boolean
    exitRotateY: number
    enableExitRotateZ: boolean
    exitRotateZ: number
    enableAnimatedCursor: boolean
    cursorSize: number
    cursorColor: string
    slideshowInterval: number
    cursorMoveSpeed: number
    cursorClickDuration: number
    replaceUserCursor?: boolean
    transitionType:
        | "none"
        | "fade"
        | "blur"
        | "slide"
        | "zoom"
        | "crossfade"
        | "flip"
        | "rotate"
        | "scale-rotate"
        | "blur-zoom"
        | "slide-fade"
    transitionDuration: number
    enablePreloader: boolean
    preloaderDuration: number
    preloaderFadeOutDuration: number
    preloaderBackgroundColor: string
    preloaderLogoImage: {
        src: string
        alt: string
    }
    preloaderLogoSize: number
    loadingBarColor: string
    loadingBarBackgroundColor: string
    preloaderProgressBarColor: string
    preloaderProgressBarBackgroundColor: string
    preloaderProgressBarWidth: number
    frozenUntilScrollEnd: boolean
    interactiveNoteText: string
    interactiveNoteFont: any
    showAdvancedSettings: boolean
    waitForScrollEnd: boolean
    staticUntilScrollEnd: boolean
    mobileTopBarHeight: number
    mobileUrlBarHeight: number
    mobileBottomBarHeight: number
    mobileIconColor: string
    showMobileRefreshIcon: boolean
    showMobileTabsIcon: boolean
    showMobileShareIcon: boolean
    showMobileNavArrows: boolean
    showDesktopRefreshIcon: boolean
    mobileCursorDotColor?: string
    mobileUrlBarFont?: any
    mobileFavoritesFont?: any
    desktopCursorEscapeX?: number
    desktopCursorEscapeY?: number
    mobileCursorEscapeX?: number
    mobileCursorEscapeY?: number
    enableEmbedUrl?: boolean
    desktopBorderRadius?: number
    mobileBorderRadius?: number
    hideMobileCursor?: boolean
    shadowSettings?: {
        enabled: boolean
        color: string
        blur: number
        spread: number
        offsetX: number
        offsetY: number
    }
    style?: CSSProperties
}

/**
 * Safari Browser Window
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function BrowserWindow(props: BrowserWindowProps) {
    const {
        browserVariant = "desktop",
        darkMode = false,
        websites = [
            {
                name: "Framer",
                url: "framer.com",
                favicon: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer",
                },
                overlayHeadline: "Welcome to Framer",
                overlaySubline: "Design and ship your dream site",
                logoImage: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer Logo",
                },
                overlayButtonText: "Get Started",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "framer.com",
            },
            {
                name: "Design",
                url: "design.com",
                favicon: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design",
                },
                overlayHeadline: "Welcome to Design",
                overlaySubline: "Create beautiful experiences",
                logoImage: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design Logo",
                },
                overlayButtonText: "Learn More",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Create beautiful experiences",
                tooltipLine2: "design.com",
            },
            {
                name: "Creative",
                url: "creative.com",
                favicon: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative",
                },
                overlayHeadline: "Welcome to Creative",
                overlaySubline: "Unleash your creativity",
                logoImage: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative Logo",
                },
                overlayButtonText: "Explore",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Unleash your creativity",
                tooltipLine2: "creative.com",
            },
            {
                name: "Portfolio",
                url: "portfolio.com",
                favicon: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio",
                },
                overlayHeadline: "Welcome to Portfolio",
                overlaySubline: "Showcase your best work",
                logoImage: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio Logo",
                },
                overlayButtonText: "View Work",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Showcase your best work",
                tooltipLine2: "portfolio.com",
            },
        ],
        backgroundColor = "#FFFFFF",
        barColor = "#F5F5F5",
        textColor = "#000000",
        accentColor = "#007AFF",
        headlineFont,
        sublineFont,
        buttonFont,
        headlineColor = "#FFFFFF",
        sublineColor = "#FFFFFF",
        buttonTextColor = "#FFFFFF",
        maxVisibleWebsites = 4,
        customText = "",
        showTrafficLights = true,
        trafficLightSize = 12,
        trafficLightRedColor = "#FF5F57",
        trafficLightYellowColor = "#FFBD2E",
        trafficLightGreenColor = "#28CA42",
        showNavArrows = true,
        navArrowSize = 12,
        showUrlBar = true,
        urlBarFont,
        urlBarHeight = 28,
        showShareButton = true,
        shareButtonSize = 16,
        showFavoritesBar = true,
        favoritesBarHeight = 36,
        favoritesFont,
        faviconSize = 16,
        showCustomText = true,
        customTextFont,
        showDropdown = true,
        showOneTimeNote = false,
        hoverDelay = 1,
        showTooltips = true,
        tooltipFont,
        tooltipBackgroundColor = "rgba(255, 255, 255, 0.12)",
        tooltipTextColor = "#FFFFFF",
        tooltipBorderColor = "rgba(255, 255, 255, 0.2)",
        showOverlays = true,
        enableScrollAnimation = true,
        enableTilt = true,
        scrollStartTiltAngle = 15,
        scrollEndTiltAngle = 0,
        scrollDistance = 800,
        scrollAnimationTriggerOffset = 200,
        scrollAnimationDuration = 0.3,
        scrollAnimationMode = "scroll",
        enableScale = true,
        scrollStartScale = 0.85,
        scrollEndScale = 1,
        enableOpacity = false,
        scrollStartOpacity = 0.6,
        scrollEndOpacity = 1,
        enableBlur = false,
        scrollStartBlur = 10,
        scrollEndBlur = 0,
        enableTranslateX = false,
        scrollStartTranslateX = -200,
        scrollEndTranslateX = 0,
        enableTranslateY = false,
        scrollStartTranslateY = 100,
        scrollEndTranslateY = 0,
        enableRotateY = false,
        scrollStartRotateY = -25,
        scrollEndRotateY = 0,
        enableRotateZ = false,
        scrollStartRotateZ = -5,
        scrollEndRotateZ = 0,
        enableExitAnimation = false,
        exitScrollDistance = 800,
        enableExitTilt = true,
        exitTiltAngle = -15,
        enableExitScale = true,
        exitScale = 0.85,
        enableExitOpacity = false,
        exitOpacity = 0.6,
        enableExitBlur = false,
        exitBlur = 10,
        enableExitTranslateX = false,
        exitTranslateX = 200,
        enableExitTranslateY = false,
        exitTranslateY = -100,
        enableExitRotateY = false,
        exitRotateY = 25,
        enableExitRotateZ = false,
        exitRotateZ = 5,
        enableAnimatedCursor = false,
        cursorSize = 20,
        cursorColor = "#000000",
        slideshowInterval = 3,
        cursorMoveSpeed = 0.8,
        cursorClickDuration = 0.3,
        replaceUserCursor = true,
        waitForScrollEnd = false,
        staticUntilScrollEnd = false,
        transitionType = "none",
        transitionDuration = 0.8,
        enablePreloader = true,
        preloaderDuration = 3,
        preloaderFadeOutDuration = 0.8,
        preloaderBackgroundColor = "#FFFFFF",
        preloaderLogoImage = {
            src: "",
            alt: "Logo",
        },
        preloaderLogoSize = 60,
        loadingBarColor = "#007AFF",
        loadingBarBackgroundColor = "rgba(0, 0, 0, 0.1)",
        preloaderProgressBarColor = "#000000",
        preloaderProgressBarBackgroundColor = "rgba(0, 0, 0, 0.1)",
        preloaderProgressBarWidth = 200,
        frozenUntilScrollEnd = false,
        interactiveNoteText = "Hover to learn more",
        interactiveNoteFont,
        mobileTopBarHeight = 60,
        mobileUrlBarHeight = 36,
        mobileBottomBarHeight = 60,
        mobileIconColor,
        showMobileRefreshIcon = true,
        showMobileTabsIcon = true,
        showMobileShareIcon = true,
        showMobileNavArrows = true,
        showDesktopRefreshIcon = true,
        mobileCursorDotColor,
        mobileUrlBarFont,
        mobileFavoritesFont,
        desktopCursorEscapeX = -200,
        desktopCursorEscapeY = -200,
        mobileCursorEscapeX = 200,
        mobileCursorEscapeY = 200,
        desktopBorderRadius = 12,
        mobileBorderRadius = 12,
        hideMobileCursor = false,
        shadowSettings = {
            enabled: true,
            color: "rgba(0, 0, 0, 0.16)",
            blur: 60,
            spread: 0,
            offsetX: 0,
            offsetY: 20,
        },
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [hasSeenOverlay, setHasSeenOverlay] = useState(false)
    const [isShareHovered, setIsShareHovered] = useState(false)
    const [isUrlHovered, setIsUrlHovered] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [pendingIndex, setPendingIndex] = useState<number | null>(null)
    const [showOverlay, setShowOverlay] = useState(false)
    const [hoveredFavIndex, setHoveredFavIndex] = useState<number | null>(null)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [exitProgress, setExitProgress] = useState(0)
    const [isInView, setIsInView] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [isCursorClicking, setIsCursorClicking] = useState(false)
    const [showAnimatedCursor, setShowAnimatedCursor] = useState(false)
    const [isUserHovering, setIsUserHovering] = useState(false)
    const [animatedCursorHoverIndex, setAnimatedCursorHoverIndex] = useState<
        number | null
    >(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [showPreloader, setShowPreloader] = useState(true)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [isContentClicked, setIsContentClicked] = useState(false)
    const [isRefreshSpinning, setIsRefreshSpinning] = useState(false)
    const [isMobileTabsOpen, setIsMobileTabsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const favoritesBarRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const mobileTabsRef = useRef<HTMLDivElement>(null)
    const itemsRef = useRef<HTMLDivElement>(null)
    const hoverTimeoutRef = useRef<number | null>(null)
    const slideshowIntervalRef = useRef<number | null>(null)
    const favoriteButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
    const hasOpenedTabsOnceRef = useRef(false)

    const isMobile = browserVariant === "mobile"

    // Add static renderer check
    const isStatic = useIsStaticRenderer()

    // Override replaceUserCursor to false for mobile
    const effectiveReplaceUserCursor = isMobile ? false : replaceUserCursor

    // Preloader effect
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        if (!enablePreloader) {
            startTransition(() => setShowPreloader(false))
            return
        }

        // If frozenUntilScrollEnd is enabled and we haven't reached normal position yet, keep preloader visible
        if (
            frozenUntilScrollEnd &&
            enableScrollAnimation &&
            scrollProgress < 1
        ) {
            startTransition(() => setShowPreloader(true))
            return
        }

        const timer = setTimeout(() => {
            startTransition(() => setShowPreloader(false))
        }, preloaderDuration * 1000)

        return () => clearTimeout(timer)
    }, [
        enablePreloader,
        preloaderDuration,
        enableScrollAnimation,
        scrollProgress,
        frozenUntilScrollEnd,
        isStatic,
    ])

    const handleFavoriteClick = (index: number) => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => {
            setIsLoading(true)
            setPendingIndex(index)
            setIsTransitioning(true)
        })

        // Switch to new image and reset loading when animation completes
        setTimeout(() => {
            startTransition(() => {
                setActiveIndex(index)
                setIsLoading(false)
                setPendingIndex(null)
            })

            // Reset transition state after transition completes
            setTimeout(() => {
                startTransition(() => setIsTransitioning(false))
            }, transitionDuration * 1000)
        }, 800)
    }

    const handlePrevious = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        if (activeIndex > 0) {
            startTransition(() => {
                setIsLoading(true)
                setPendingIndex(activeIndex - 1)
                setIsTransitioning(true)
            })

            // Switch to new image and reset loading when animation completes
            setTimeout(() => {
                startTransition(() => {
                    setActiveIndex(activeIndex - 1)
                    setIsLoading(false)
                    setPendingIndex(null)
                })

                // Reset transition state after transition completes
                setTimeout(() => {
                    startTransition(() => setIsTransitioning(false))
                }, transitionDuration * 1000)
            }, 800)
        }
    }

    const handleNext = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        if (activeIndex < websites.length - 1) {
            startTransition(() => {
                setIsLoading(true)
                setPendingIndex(activeIndex + 1)
                setIsTransitioning(true)
            })

            // Switch to new image and reset loading when animation completes
            setTimeout(() => {
                startTransition(() => {
                    setActiveIndex(activeIndex + 1)
                    setIsLoading(false)
                    setPendingIndex(null)
                })

                // Reset transition state after transition completes
                setTimeout(() => {
                    startTransition(() => setIsTransitioning(false))
                }, transitionDuration * 1000)
            }, 800)
        }
    }

    const handleRefresh = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => {
            setIsLoading(true)
            setPendingIndex(activeIndex)
            setIsTransitioning(true)
            setIsRefreshSpinning(true)
        })

        // Reset loading state after animation completes
        setTimeout(() => {
            startTransition(() => {
                setIsLoading(false)
                setPendingIndex(null)
            })

            // Reset transition state after transition completes
            setTimeout(() => {
                startTransition(() => {
                    setIsTransitioning(false)
                    setIsRefreshSpinning(false)
                })
            }, transitionDuration * 1000)
        }, 800)
    }

    const handleCloseOverlay = () => {
        startTransition(() => setHasSeenOverlay(true))
    }

    const handleFeaturedLinkClick = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        if (currentWebsite?.featuredLink) {
            const url =
                currentWebsite.featuredLink.startsWith("/") ||
                currentWebsite.featuredLink.startsWith("http")
                    ? currentWebsite.featuredLink
                    : `https://${currentWebsite.featuredLink}`

            window.open(
                url,
                currentWebsite.featuredTarget || "_blank",
                "noopener,noreferrer"
            )
        }
    }

    const handleMouseEnter = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        // Skip hover behavior for mobile variant
        if (isMobile) return

        startTransition(() => {
            setIsHovered(true)
            setIsUserHovering(true)
            setHasInteracted(true)
        })

        // Set a delay before showing the overlay
        hoverTimeoutRef.current = window.setTimeout(() => {
            startTransition(() => {
                setShowOverlay(true)
            })
        }, hoverDelay * 1000)
    }

    const handleMouseLeave = () => {
        // Skip hover behavior for mobile variant
        if (isMobile) return

        // Clear the timeout if user leaves before 1 second
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }

        startTransition(() => {
            setIsHovered(false)
            setShowOverlay(false)
            setHasSeenOverlay(false)
            setIsUserHovering(false)
        })
    }

    const handleContentClick = () => {
        if (!isMobile) return
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => {
            setIsUserHovering(true)
            setHasInteracted(true)
            setIsContentClicked(!isContentClicked)
            setShowOverlay(!showOverlay)
            if (!showOverlay) {
                setHasSeenOverlay(false)
            }
        })
    }

    const toggleDropdown = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => setIsDropdownOpen(!isDropdownOpen))
    }

    const toggleMobileTabs = () => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => setIsMobileTabsOpen(!isMobileTabsOpen))
    }

    const handleDropdownItemClick = (index: number) => {
        if (staticUntilScrollEnd && enableScrollAnimation && scrollProgress < 1)
            return

        startTransition(() => {
            setIsLoading(true)
            setPendingIndex(index)
            setIsDropdownOpen(false)
            setIsTransitioning(true)
        })

        // Switch to new image and reset loading when animation completes
        setTimeout(() => {
            startTransition(() => {
                setActiveIndex(index)
                setIsLoading(false)
                setPendingIndex(null)
            })

            // Reset transition state after transition completes
            setTimeout(() => {
                startTransition(() => setIsTransitioning(false))
            }, transitionDuration * 1000)
        }, 800)
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                startTransition(() => setIsDropdownOpen(false))
            }
            // Remove auto-close for mobile tabs - only close manually
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isDropdownOpen, isStatic])

    // Auto-open dropdown when navigating to a website in the dropdown
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        if (activeIndex >= maxVisibleWebsites) {
            startTransition(() => setIsDropdownOpen(true))
        } else {
            startTransition(() => setIsDropdownOpen(false))
        }
    }, [activeIndex, maxVisibleWebsites, isStatic])

    // Cleanup timeout on unmount
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current)
            }
        }
    }, [isStatic])

    // Animated cursor and slideshow effect
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        if (!enableAnimatedCursor || !showFavoritesBar) {
            startTransition(() => setShowAnimatedCursor(false))
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current)
                slideshowIntervalRef.current = null
            }
            return
        }

        if (
            (waitForScrollEnd || staticUntilScrollEnd) &&
            enableScrollAnimation &&
            scrollProgress < 1
        ) {
            startTransition(() => setShowAnimatedCursor(false))
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current)
                slideshowIntervalRef.current = null
            }
            return
        }

        // For mobile with hideMobileCursor, hide cursor but keep slideshow running
        if (isMobile && hideMobileCursor) {
            startTransition(() => setShowAnimatedCursor(false))

            // Simple slideshow without cursor animation or tabs interaction
            const runSimpleSlideshow = () => {
                const nextIndex = (activeIndex + 1) % websites.length
                handleFavoriteClick(nextIndex)
            }

            slideshowIntervalRef.current = window.setInterval(
                runSimpleSlideshow,
                slideshowInterval * 1000
            )

            return () => {
                if (slideshowIntervalRef.current) {
                    clearInterval(slideshowIntervalRef.current)
                }
            }
        }

        startTransition(() => setShowAnimatedCursor(true))

        // When user is hovering, move cursor outside the visible area
        if (isUserHovering && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect()
            // Desktop: Move cursor to top left, Mobile: Move cursor to bottom right
            if (isMobile) {
                startTransition(() => {
                    setCursorPosition({
                        x: containerRect.width + mobileCursorEscapeX,
                        y: containerRect.height + mobileCursorEscapeY,
                    })
                    setAnimatedCursorHoverIndex(null)
                })
            } else {
                startTransition(() => {
                    setCursorPosition({
                        x: desktopCursorEscapeX,
                        y: desktopCursorEscapeY,
                    })
                    setAnimatedCursorHoverIndex(null)
                })
            }

            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current)
                slideshowIntervalRef.current = null
            }
            return
        }

        const runSlideshow = () => {
            if (isMobile) {
                // Mobile: First cycle opens tabs, subsequent cycles just navigate
                const nextIndex = (activeIndex + 1) % websites.length

                // Check if we need to open tabs menu first
                if (!hasOpenedTabsOnceRef.current || !isMobileTabsOpen) {
                    // First time or tabs closed - open tabs menu
                    const tabsButton =
                        mobileTabsRef.current?.querySelector("button")

                    if (!tabsButton || !containerRef.current) return

                    const containerRect =
                        containerRef.current.getBoundingClientRect()
                    const buttonRect = tabsButton.getBoundingClientRect()

                    const targetX =
                        buttonRect.left -
                        containerRect.left +
                        buttonRect.width / 2
                    const targetY =
                        buttonRect.top -
                        containerRect.top +
                        buttonRect.height / 2

                    startTransition(() => {
                        setAnimatedCursorHoverIndex(null)
                        setCursorPosition({ x: targetX, y: targetY })
                    })

                    const moveTimer = setTimeout(() => {
                        startTransition(() => setIsCursorClicking(true))

                        const clickTimer = setTimeout(() => {
                            // Open tabs menu
                            startTransition(() => {
                                setIsMobileTabsOpen(true)
                                hasOpenedTabsOnceRef.current = true
                            })
                            startTransition(() => setIsCursorClicking(false))

                            // Wait for menu to open, then move to next item (skip clicking for now)
                            const menuOpenTimer = setTimeout(() => {
                                // Find the next item button in the dropdown (index 1, which is the 2nd item)
                                const dropdownButtons =
                                    mobileTabsRef.current?.querySelectorAll(
                                        "button"
                                    )
                                // Skip index 0 (tabs button itself), start from index 1 (first website)
                                // We want to click on index 2 (second website, which is nextIndex + 1)
                                if (
                                    dropdownButtons &&
                                    dropdownButtons.length > nextIndex + 1
                                ) {
                                    const nextItemButton = dropdownButtons[
                                        nextIndex + 1
                                    ] as HTMLButtonElement
                                    const nextButtonRect =
                                        nextItemButton.getBoundingClientRect()

                                    const nextTargetX =
                                        nextButtonRect.left -
                                        containerRect.left +
                                        nextButtonRect.width / 2
                                    const nextTargetY =
                                        nextButtonRect.top -
                                        containerRect.top +
                                        nextButtonRect.height / 2

                                    startTransition(() => {
                                        setCursorPosition({
                                            x: nextTargetX,
                                            y: nextTargetY,
                                        })
                                    })
                                }
                            }, cursorMoveSpeed * 1000)

                            return () => clearTimeout(menuOpenTimer)
                        }, cursorClickDuration * 1000)

                        return () => clearTimeout(clickTimer)
                    }, cursorMoveSpeed * 1000)

                    return () => clearTimeout(moveTimer)
                } else {
                    // Tabs already open - just navigate to next item
                    const dropdownButtons =
                        mobileTabsRef.current?.querySelectorAll("button")
                    if (!dropdownButtons || !containerRef.current) return

                    if (dropdownButtons.length > nextIndex + 1) {
                        const containerRect =
                            containerRef.current.getBoundingClientRect()
                        const nextItemButton = dropdownButtons[
                            nextIndex + 1
                        ] as HTMLButtonElement
                        const nextButtonRect =
                            nextItemButton.getBoundingClientRect()

                        const nextTargetX =
                            nextButtonRect.left -
                            containerRect.left +
                            nextButtonRect.width / 2
                        const nextTargetY =
                            nextButtonRect.top -
                            containerRect.top +
                            nextButtonRect.height / 2

                        startTransition(() => {
                            setCursorPosition({
                                x: nextTargetX,
                                y: nextTargetY,
                            })
                        })

                        const clickNextTimer = setTimeout(() => {
                            startTransition(() => setIsCursorClicking(true))

                            const finalClickTimer = setTimeout(() => {
                                handleFavoriteClick(nextIndex)
                                startTransition(() =>
                                    setIsCursorClicking(false)
                                )
                            }, cursorClickDuration * 1000)

                            return () => clearTimeout(finalClickTimer)
                        }, cursorMoveSpeed * 1000)

                        return () => clearTimeout(clickNextTimer)
                    }
                }
            } else {
                const visibleWebsites = Math.min(
                    maxVisibleWebsites,
                    websites.length
                )
                const nextIndex = (activeIndex + 1) % visibleWebsites

                const targetButton = favoriteButtonRefs.current[nextIndex]
                if (!targetButton || !containerRef.current) return

                const containerRect =
                    containerRef.current.getBoundingClientRect()
                const buttonRect = targetButton.getBoundingClientRect()

                const targetX =
                    buttonRect.left - containerRect.left + buttonRect.width / 2
                const targetY =
                    buttonRect.top - containerRect.top + buttonRect.height / 2

                startTransition(() => {
                    setAnimatedCursorHoverIndex(null)
                    setCursorPosition({ x: targetX, y: targetY })
                })

                const hoverTimer = setTimeout(() => {
                    startTransition(() =>
                        setAnimatedCursorHoverIndex(nextIndex)
                    )

                    const clickTimer = setTimeout(() => {
                        startTransition(() => setIsCursorClicking(true))

                        const actionTimer = setTimeout(() => {
                            handleFavoriteClick(nextIndex)
                            startTransition(() => setIsCursorClicking(false))
                        }, cursorClickDuration * 1000)

                        return () => clearTimeout(actionTimer)
                    }, 100)

                    return () => clearTimeout(clickTimer)
                }, cursorMoveSpeed * 1000)

                return () => clearTimeout(hoverTimer)
            }
        }

        if (isMobile) {
            // Mobile: Start at tabs icon position if tabs not open yet
            if (!hasOpenedTabsOnceRef.current || !isMobileTabsOpen) {
                const tabsButton =
                    mobileTabsRef.current?.querySelector("button")

                if (tabsButton && containerRef.current) {
                    const containerRect =
                        containerRef.current.getBoundingClientRect()
                    const buttonRect = tabsButton.getBoundingClientRect()

                    const initialX =
                        buttonRect.left -
                        containerRect.left +
                        buttonRect.width / 2
                    const initialY =
                        buttonRect.top -
                        containerRect.top +
                        buttonRect.height / 2

                    startTransition(() => {
                        setCursorPosition({ x: initialX, y: initialY })
                    })
                }
            } else {
                // Tabs already open - position at current active item
                const dropdownButtons =
                    mobileTabsRef.current?.querySelectorAll("button")
                if (
                    dropdownButtons &&
                    dropdownButtons.length > activeIndex + 1 &&
                    containerRef.current
                ) {
                    const containerRect =
                        containerRef.current.getBoundingClientRect()
                    const activeButton = dropdownButtons[
                        activeIndex + 1
                    ] as HTMLButtonElement
                    const buttonRect = activeButton.getBoundingClientRect()

                    const initialX =
                        buttonRect.left -
                        containerRect.left +
                        buttonRect.width / 2
                    const initialY =
                        buttonRect.top -
                        containerRect.top +
                        buttonRect.height / 2

                    startTransition(() => {
                        setCursorPosition({ x: initialX, y: initialY })
                    })
                }
            }
        } else {
            if (
                favoriteButtonRefs.current[activeIndex] &&
                containerRef.current
            ) {
                const containerRect =
                    containerRef.current.getBoundingClientRect()
                const buttonRect =
                    favoriteButtonRefs.current[
                        activeIndex
                    ].getBoundingClientRect()

                const initialX =
                    buttonRect.left - containerRect.left + buttonRect.width / 2
                const initialY =
                    buttonRect.top - containerRect.top + buttonRect.height / 2

                startTransition(() => {
                    setCursorPosition({ x: initialX, y: initialY })
                    setAnimatedCursorHoverIndex(activeIndex)
                })
            }
        }

        slideshowIntervalRef.current = window.setInterval(
            runSlideshow,
            slideshowInterval * 1000
        )

        return () => {
            if (slideshowIntervalRef.current) {
                clearInterval(slideshowIntervalRef.current)
            }
        }
    }, [
        enableAnimatedCursor,
        showFavoritesBar,
        isUserHovering,
        activeIndex,
        maxVisibleWebsites,
        websites.length,
        slideshowInterval,
        cursorMoveSpeed,
        cursorClickDuration,
        waitForScrollEnd,
        enableScrollAnimation,
        scrollProgress,
        staticUntilScrollEnd,
        isMobile,
        isMobileTabsOpen,
        hideMobileCursor,
        isStatic,
    ])

    // Scroll animation effect
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        if (!enableScrollAnimation) {
            startTransition(() => {
                setScrollProgress(1)
                setExitProgress(0)
            })
            return
        }

        let ticking = false

        const handleScroll = () => {
            if (ticking) return

            ticking = true
            requestAnimationFrame(() => {
                if (!containerRef.current) {
                    ticking = false
                    return
                }

                const rect = containerRef.current.getBoundingClientRect()
                const windowHeight = window.innerHeight

                // Entry animation: starts when component enters viewport (bottom edge visible)
                // Progress goes from 0 to 1 as user scrolls down by scrollDistance pixels
                let progress = 0
                const componentBottom = rect.bottom

                // Animation starts when bottom of component is visible in viewport
                if (componentBottom <= windowHeight) {
                    // Calculate how far we've scrolled since the component became visible
                    const scrolledDistance = windowHeight - componentBottom
                    progress = Math.min(scrolledDistance / scrollDistance, 1)
                }

                // Exit animation progress
                let exitProg = 0
                if (enableExitAnimation) {
                    // Exit animation starts when component top reaches top of viewport
                    const componentTop = rect.top

                    if (componentTop < 0) {
                        const exitScrolledDistance = Math.abs(componentTop)
                        exitProg = Math.min(
                            exitScrolledDistance / exitScrollDistance,
                            1
                        )
                    }
                }

                startTransition(() => {
                    setScrollProgress(progress)
                    setExitProgress(exitProg)
                })

                ticking = false
            })
        }

        if (typeof window !== "undefined") {
            window.addEventListener("scroll", handleScroll, { passive: true })
            handleScroll()
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("scroll", handleScroll)
            }
        }
    }, [
        enableScrollAnimation,
        scrollDistance,
        enableExitAnimation,
        exitScrollDistance,
        isStatic,
    ])

    // Viewport intersection observer
    useEffect(() => {
        // Skip in static mode
        if (isStatic) return

        if (!enableScrollAnimation || scrollAnimationMode === "scroll") {
            startTransition(() => setIsInView(true))
            return
        }

        if (!containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [enableScrollAnimation, scrollAnimationMode, isStatic])

    const currentWebsite = websites[activeIndex] || websites[0]
    const currentImage = currentWebsite?.image || {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Default",
    }

    // Determine which image to use based on variant
    const displayImage =
        isMobile &&
        currentWebsite?.mobileImage?.src &&
        currentWebsite.mobileImage.src.trim() !== ""
            ? currentWebsite.mobileImage
            : currentImage

    // Dark mode color adjustments
    const getColor = (lightColor: string, darkColor: string) =>
        darkMode ? darkColor : lightColor

    const finalBackgroundColor = getColor(backgroundColor, "#1C1C1E")
    const finalBarColor = getColor(barColor, "#2C2C2E")
    const finalTextColor = getColor(textColor, "#FFFFFF")
    const finalAccentColor = getColor(accentColor, "#0A84FF")
    const finalHeadlineColor = getColor(headlineColor, "#FFFFFF")
    const finalSublineColor = getColor(sublineColor, "#E5E5E7")
    const finalButtonTextColor = getColor(buttonTextColor, "#FFFFFF")
    const finalTooltipBackgroundColor = darkMode
        ? "rgba(44, 44, 46, 0.85)"
        : tooltipBackgroundColor
    const finalTooltipTextColor = getColor(tooltipTextColor, "#FFFFFF")
    const finalTooltipBorderColor = darkMode
        ? "rgba(255, 255, 255, 0.15)"
        : tooltipBorderColor
    const finalPreloaderBackgroundColor = darkMode
        ? "#1C1C1E"
        : preloaderBackgroundColor

    // Mobile Safari specific colors
    const mobileSafariBarColor = darkMode ? "#1C1C1E" : "#F7F7F7"
    const mobileSafariIconColor =
        mobileIconColor || (darkMode ? "#0A84FF" : "#007AFF")
    const mobileSafariUrlBarColor = darkMode ? "#2C2C2E" : "#FFFFFF"
    const finalMobileTabsCount = websites.length

    // Calculate scroll-based values
    const animationProgress =
        scrollAnimationMode === "viewport"
            ? isInView
                ? 1
                : 0
            : scrollAnimationMode === "both"
              ? isInView
                  ? scrollProgress
                  : 0
              : scrollProgress

    const currentScale =
        enableScrollAnimation && enableScale
            ? scrollStartScale +
              (scrollEndScale - scrollStartScale) * scrollProgress
            : 1

    const currentOpacity =
        enableScrollAnimation && enableOpacity
            ? scrollStartOpacity +
              (scrollEndOpacity - scrollStartOpacity) * scrollProgress
            : 1

    const currentBlur =
        enableScrollAnimation && enableBlur
            ? scrollStartBlur +
              (scrollEndBlur - scrollStartBlur) * scrollProgress
            : 0

    const currentTranslateX =
        enableScrollAnimation && enableTranslateX
            ? scrollStartTranslateX +
              (scrollEndTranslateX - scrollStartTranslateX) * animationProgress
            : 0

    const currentTranslateY =
        enableScrollAnimation && enableTranslateY
            ? scrollStartTranslateY +
              (scrollEndTranslateY - scrollStartTranslateY) * animationProgress
            : 0

    const currentRotateY =
        enableScrollAnimation && enableRotateY
            ? scrollStartRotateY +
              (scrollEndRotateY - scrollStartRotateY) * animationProgress
            : 0

    const currentRotateZ =
        enableScrollAnimation && enableRotateZ
            ? scrollStartRotateZ +
              (scrollEndRotateZ - scrollStartRotateZ) * animationProgress
            : 0

    const currentTiltX =
        enableScrollAnimation && enableTilt
            ? scrollStartTiltAngle +
              (scrollEndTiltAngle - scrollStartTiltAngle) * animationProgress
            : 0

    // Calculate exit animation values
    const exitTiltValue =
        enableScrollAnimation && enableExitAnimation && enableExitTilt
            ? scrollEndTiltAngle +
              (exitTiltAngle - scrollEndTiltAngle) * exitProgress
            : currentTiltX

    const exitScaleValue =
        enableScrollAnimation && enableExitAnimation && enableExitScale
            ? scrollEndScale + (exitScale - scrollEndScale) * exitProgress
            : currentScale

    const exitOpacityValue =
        enableScrollAnimation && enableExitAnimation && enableExitOpacity
            ? scrollEndOpacity + (exitOpacity - scrollEndOpacity) * exitProgress
            : currentOpacity

    const exitBlurValue =
        enableScrollAnimation && enableExitAnimation && enableExitBlur
            ? scrollEndBlur + (exitBlur - scrollEndBlur) * exitProgress
            : currentBlur

    const exitTranslateXValue =
        enableScrollAnimation && enableExitAnimation && enableExitTranslateX
            ? scrollEndTranslateX +
              (exitTranslateX - scrollEndTranslateX) * exitProgress
            : currentTranslateX

    const exitTranslateYValue =
        enableScrollAnimation && enableExitAnimation && enableExitTranslateY
            ? scrollEndTranslateY +
              (exitTranslateY - scrollEndTranslateY) * exitProgress
            : currentTranslateY

    const exitRotateYValue =
        enableScrollAnimation && enableExitAnimation && enableExitRotateY
            ? scrollEndRotateY + (exitRotateY - scrollEndRotateY) * exitProgress
            : currentRotateY

    const exitRotateZValue =
        enableScrollAnimation && enableExitAnimation && enableExitRotateZ
            ? scrollEndRotateZ + (exitRotateZ - scrollEndRotateZ) * exitProgress
            : currentRotateZ

    // Build transform string
    const transformString = enableScrollAnimation
        ? `perspective(1200px) rotateX(${exitTiltValue}deg) rotateY(${exitRotateYValue}deg) rotateZ(${exitRotateZValue}deg) scale(${exitScaleValue}) translateX(${exitTranslateXValue}px) translateY(${exitTranslateYValue}px)`
        : "none"

    // Calculate transition styles based on transition type
    let imageTransitionOpacity = 1
    let imageTransitionBlur = 0
    let imageTransitionScale = 1
    let imageTransitionTranslateX = 0
    let imageTransitionRotateY = 0
    let imageTransitionRotateX = 0

    if (isTransitioning) {
        switch (transitionType) {
            case "fade":
                imageTransitionOpacity = 0
                break
            case "blur":
                imageTransitionBlur = 20
                break
            case "slide":
                imageTransitionTranslateX = 100
                imageTransitionOpacity = 0
                break
            case "zoom":
                imageTransitionScale = 0.8
                imageTransitionOpacity = 0
                break
            case "crossfade":
                imageTransitionOpacity = 0.3
                break
            case "flip":
                imageTransitionRotateY = 90
                imageTransitionOpacity = 0
                break
            case "rotate":
                imageTransitionRotateX = 90
                imageTransitionOpacity = 0
                break
            case "scale-rotate":
                imageTransitionScale = 0.5
                imageTransitionRotateY = 180
                imageTransitionOpacity = 0
                break
            case "blur-zoom":
                imageTransitionBlur = 20
                imageTransitionScale = 1.2
                imageTransitionOpacity = 0
                break
            case "slide-fade":
                imageTransitionTranslateX = -100
                imageTransitionOpacity = 0
                break
            case "none":
            default:
                // No transition effects
                break
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: finalBackgroundColor,
                borderRadius: isMobile
                    ? mobileBorderRadius
                    : desktopBorderRadius,
                overflow: "hidden",
                boxShadow: shadowSettings.enabled
                    ? `${shadowSettings.offsetX}px ${shadowSettings.offsetY}px ${shadowSettings.blur}px ${shadowSettings.spread}px ${shadowSettings.color}, 0 8px 24px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08)`
                    : "none",
                display: "flex",
                flexDirection: "column",
                transform: transformString,
                transformOrigin: "center center",
                transition: `transform ${scrollAnimationDuration}s ease-in-out, opacity ${scrollAnimationDuration}s ease-in-out, filter ${scrollAnimationDuration}s ease-in-out`,
                opacity: exitOpacityValue,
                filter: exitBlurValue > 0 ? `blur(${exitBlurValue}px)` : "none",
                cursor:
                    enableAnimatedCursor && effectiveReplaceUserCursor
                        ? isMobile
                            ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize * 0.8}" height="${cursorSize * 0.8}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke-width="1" opacity="0.9"/></svg>') ${cursorSize * 0.4} ${cursorSize * 0.4}, auto`
                            : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${encodeURIComponent(cursorColor)}" stroke="%23FFFFFF" stroke-width="1.5" stroke-linejoin="round"/></svg>') 0 0, auto`
                        : "default",
            }}
        >
            {/* Desktop Title Bar */}
            {!isMobile && (
                <div
                    style={{
                        height: 52,
                        backgroundColor: finalBarColor,
                        borderBottom: `1.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        gap: 12,
                        cursor:
                            enableAnimatedCursor && effectiveReplaceUserCursor
                                ? isMobile
                                    ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize * 0.8}" height="${cursorSize * 0.8}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke-width="1" opacity="0.9"/></svg>') ${cursorSize * 0.4} ${cursorSize * 0.4}, auto`
                                    : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${encodeURIComponent(cursorColor)}" stroke="%23FFFFFF" stroke-width="1.5" stroke-linejoin="round"/></svg>') 0 0, auto`
                                : "default",
                    }}
                    onMouseEnter={() =>
                        startTransition(() => setIsUserHovering(true))
                    }
                    onMouseLeave={() =>
                        startTransition(() => setIsUserHovering(false))
                    }
                >
                    {/* Traffic Lights */}
                    {showTrafficLights && (
                        <div style={{ display: "flex", gap: 8 }}>
                            <div
                                style={{
                                    width: trafficLightSize,
                                    height: trafficLightSize,
                                    borderRadius: "50%",
                                    backgroundColor: trafficLightRedColor,
                                    border: "0.5px solid rgba(0, 0, 0, 0.06)",
                                    boxShadow:
                                        "inset 0 0.5px 1px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.1)",
                                }}
                            />
                            <div
                                style={{
                                    width: trafficLightSize,
                                    height: trafficLightSize,
                                    borderRadius: "50%",
                                    backgroundColor: trafficLightYellowColor,
                                    border: "0.5px solid rgba(0, 0, 0, 0.06)",
                                    boxShadow:
                                        "inset 0 0.5px 1px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.1)",
                                }}
                            />
                            <div
                                style={{
                                    width: trafficLightSize,
                                    height: trafficLightSize,
                                    borderRadius: "50%",
                                    backgroundColor: trafficLightGreenColor,
                                    border: "0.5px solid rgba(0, 0, 0, 0.06)",
                                    boxShadow:
                                        "inset 0 0.5px 1px rgba(255, 255, 255, 0.3), 0 1px 2px rgba(0, 0, 0, 0.1)",
                                }}
                            />
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {showNavArrows && (
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                marginLeft: showTrafficLights ? 12 : 0,
                            }}
                        >
                            <button
                                onClick={handlePrevious}
                                disabled={activeIndex === 0}
                                aria-label="Navigate to previous project"
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "6px",
                                    cursor:
                                        activeIndex === 0
                                            ? "default"
                                            : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    borderRadius: 6,
                                    transition:
                                        "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity:
                                        staticUntilScrollEnd &&
                                        enableScrollAnimation &&
                                        scrollProgress < 1
                                            ? 0.3
                                            : 1,
                                    pointerEvents:
                                        staticUntilScrollEnd &&
                                        enableScrollAnimation &&
                                        scrollProgress < 1
                                            ? "none"
                                            : "auto",
                                }}
                                onMouseEnter={(e) => {
                                    if (activeIndex !== 0) {
                                        e.currentTarget.style.backgroundColor =
                                            darkMode
                                                ? "rgba(255, 255, 255, 0.08)"
                                                : "rgba(0, 0, 0, 0.04)"
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "transparent"
                                }}
                            >
                                <svg
                                    width={navArrowSize}
                                    height={navArrowSize}
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <path
                                        d="M10 12L6 8L10 4"
                                        stroke={finalTextColor}
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity={
                                            activeIndex === 0 ? "0.15" : "0.5"
                                        }
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={activeIndex === websites.length - 1}
                                aria-label="Navigate to next project"
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "6px",
                                    cursor:
                                        activeIndex === websites.length - 1
                                            ? "default"
                                            : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    borderRadius: 6,
                                    transition:
                                        "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity:
                                        staticUntilScrollEnd &&
                                        enableScrollAnimation &&
                                        scrollProgress < 1
                                            ? 0.3
                                            : 1,
                                    pointerEvents:
                                        staticUntilScrollEnd &&
                                        enableScrollAnimation &&
                                        scrollProgress < 1
                                            ? "none"
                                            : "auto",
                                }}
                                onMouseEnter={(e) => {
                                    if (activeIndex !== websites.length - 1) {
                                        e.currentTarget.style.backgroundColor =
                                            darkMode
                                                ? "rgba(255, 255, 255, 0.08)"
                                                : "rgba(0, 0, 0, 0.04)"
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "transparent"
                                }}
                            >
                                <svg
                                    width={navArrowSize}
                                    height={navArrowSize}
                                    viewBox="0 0 16 16"
                                    fill="none"
                                >
                                    <path
                                        d="M6 4L10 8L6 12"
                                        stroke={finalTextColor}
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity={
                                            activeIndex === websites.length - 1
                                                ? "0.15"
                                                : "0.5"
                                        }
                                    />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* URL Bar */}
                    {showUrlBar && (
                        <div
                            onClick={handleFeaturedLinkClick}
                            style={{
                                flex: 1,
                                height: urlBarHeight,
                                backgroundColor: finalBackgroundColor,
                                borderRadius: 6,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 12px",
                                marginLeft:
                                    showNavArrows || showTrafficLights ? 12 : 0,
                                marginRight: 12,
                                border: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
                                cursor: currentWebsite?.featuredLink
                                    ? "pointer"
                                    : "default",
                                transition:
                                    "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                boxShadow: darkMode
                                    ? "inset 0 0.5px 1px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)"
                                    : "inset 0 0.5px 1px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.03)",
                                opacity:
                                    staticUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? 0.5
                                        : 1,
                                pointerEvents:
                                    staticUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? "none"
                                        : "auto",
                            }}
                            onMouseEnter={() =>
                                startTransition(() => setIsUrlHovered(true))
                            }
                            onMouseLeave={() =>
                                startTransition(() => setIsUrlHovered(false))
                            }
                        >
                            <svg
                                width="10"
                                height="12"
                                viewBox="0 0 10 12"
                                fill="none"
                                style={{ marginRight: 8, flexShrink: 0 }}
                            >
                                <rect
                                    x="1.5"
                                    y="5"
                                    width="7"
                                    height="6"
                                    rx="1.5"
                                    stroke={finalTextColor}
                                    strokeWidth="1"
                                    opacity={
                                        isUrlHovered &&
                                        currentWebsite?.featuredLink
                                            ? "0.6"
                                            : "0.4"
                                    }
                                    fill="none"
                                />
                                <path
                                    d="M3 5V3.5C3 2.39543 3.89543 1.5 5 1.5C6.10457 1.5 7 2.39543 7 3.5V5"
                                    stroke={finalTextColor}
                                    strokeWidth="1"
                                    opacity={
                                        isUrlHovered &&
                                        currentWebsite?.featuredLink
                                            ? "0.6"
                                            : "0.4"
                                    }
                                    fill="none"
                                />
                            </svg>
                            <span
                                style={{
                                    color: finalTextColor,
                                    opacity:
                                        isUrlHovered &&
                                        currentWebsite?.featuredLink
                                            ? 0.7
                                            : 0.5,
                                    transition:
                                        "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    paddingTop: "2px",
                                    paddingBottom: "2px",
                                    ...(urlBarFont || {}),
                                }}
                            >
                                {currentWebsite?.url || "website.com"}
                            </span>

                            {/* Refresh Icon */}
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{
                                    marginLeft: "auto",
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    animation: isRefreshSpinning
                                        ? "refreshSpin 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                                        : "none",
                                    display: showDesktopRefreshIcon
                                        ? "block"
                                        : "none",
                                }}
                                onClick={handleRefresh}
                                aria-label="Reload active project"
                            >
                                <path
                                    d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0.01 3.58 0.01 8C0.01 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z"
                                    fill={finalTextColor}
                                    opacity={
                                        isUrlHovered &&
                                        currentWebsite?.featuredLink
                                            ? "0.6"
                                            : "0.4"
                                    }
                                />
                            </svg>
                        </div>
                    )}

                    {/* Share Button */}
                    {showShareButton && (
                        <button
                            onClick={handleFeaturedLinkClick}
                            onMouseEnter={() =>
                                startTransition(() => setIsShareHovered(true))
                            }
                            onMouseLeave={() =>
                                startTransition(() => setIsShareHovered(false))
                            }
                            aria-label="Click to learn more about this project"
                            style={{
                                background: "none",
                                border: "none",
                                padding: "6px",
                                cursor: currentWebsite?.featuredLink
                                    ? "pointer"
                                    : "default",
                                display: "flex",
                                alignItems: "center",
                                borderRadius: 6,
                                transition:
                                    "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                backgroundColor:
                                    isShareHovered &&
                                    currentWebsite?.featuredLink
                                        ? darkMode
                                            ? "rgba(255, 255, 255, 0.08)"
                                            : "rgba(0, 0, 0, 0.04)"
                                        : "transparent",
                                opacity:
                                    staticUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? 0.3
                                        : 1,
                                pointerEvents:
                                    staticUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? "none"
                                        : "auto",
                            }}
                        >
                            <svg
                                width={shareButtonSize}
                                height={shareButtonSize}
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M8 2V10M8 2L5 5M8 2L11 5"
                                    stroke={finalTextColor}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={
                                        isShareHovered &&
                                        currentWebsite?.featuredLink
                                            ? "0.6"
                                            : "0.4"
                                    }
                                />
                                <path
                                    d="M3 10V13C3 13.5523 3.44772 14 4 14H12C12.5523 14 13 13.5523 13 13V10"
                                    stroke={finalTextColor}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    opacity={
                                        isShareHovered &&
                                        currentWebsite?.featuredLink
                                            ? "0.6"
                                            : "0.4"
                                    }
                                />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Mobile Safari Top Bar */}
            {isMobile && (
                <div
                    style={{
                        height: mobileTopBarHeight,
                        backgroundColor: darkMode ? "#1C1C1E" : "#FFFFFF",
                        borderBottom: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 16px",
                        gap: 12,
                        cursor:
                            enableAnimatedCursor && effectiveReplaceUserCursor
                                ? isMobile
                                    ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize * 0.8}" height="${cursorSize * 0.8}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke-width="1" opacity="0.9"/></svg>') ${cursorSize * 0.4} ${cursorSize * 0.4}, auto`
                                    : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${encodeURIComponent(cursorColor)}" stroke="%23FFFFFF" stroke-width="1.5" stroke-linejoin="round"/></svg>') 0 0, auto`
                                : "default",
                    }}
                    onMouseEnter={() =>
                        startTransition(() => setIsUserHovering(true))
                    }
                    onMouseLeave={() =>
                        startTransition(() => setIsUserHovering(false))
                    }
                >
                    {/* URL Bar */}
                    <div
                        onClick={handleFeaturedLinkClick}
                        style={{
                            flex: 1,
                            height: mobileUrlBarHeight,
                            backgroundColor: darkMode ? "#2C2C2E" : "#F5F5F5",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            padding: "0 16px",
                            gap: 8,
                            border: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                            cursor: currentWebsite?.featuredLink
                                ? "pointer"
                                : "default",
                            transition:
                                "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: darkMode
                                ? "inset 0 0.5px 1px rgba(0, 0, 0, 0.3)"
                                : "inset 0 0.5px 1px rgba(0, 0, 0, 0.02)",
                            opacity:
                                staticUntilScrollEnd &&
                                enableScrollAnimation &&
                                scrollProgress < 1
                                    ? 0.5
                                    : 1,
                            pointerEvents:
                                staticUntilScrollEnd &&
                                enableScrollAnimation &&
                                scrollProgress < 1
                                    ? "none"
                                    : "auto",
                        }}
                        onMouseEnter={() =>
                            startTransition(() => setIsUrlHovered(true))
                        }
                        onMouseLeave={() =>
                            startTransition(() => setIsUrlHovered(false))
                        }
                    >
                        {/* Lock Icon */}
                        <svg
                            width="10"
                            height="12"
                            viewBox="0 0 10 12"
                            fill="none"
                            style={{ flexShrink: 0 }}
                        >
                            <rect
                                x="1.5"
                                y="5"
                                width="7"
                                height="6"
                                rx="1.5"
                                stroke={finalTextColor}
                                strokeWidth="1"
                                opacity={
                                    isUrlHovered && currentWebsite?.featuredLink
                                        ? 0.6
                                        : 0.4
                                }
                                fill="none"
                            />
                            <path
                                d="M3 5V3.5C3 2.39543 3.89543 1.5 5 1.5C6.10457 1.5 7 2.39543 7 3.5V5"
                                stroke={finalTextColor}
                                strokeWidth="1"
                                opacity={
                                    isUrlHovered && currentWebsite?.featuredLink
                                        ? 0.6
                                        : 0.4
                                }
                                fill="none"
                            />
                        </svg>

                        {/* URL Text */}
                        <span
                            style={{
                                color: finalTextColor,
                                opacity:
                                    isUrlHovered && currentWebsite?.featuredLink
                                        ? 0.7
                                        : 0.5,
                                transition:
                                    "opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontSize: "15px",
                                fontWeight: 400,
                                flex: 1,
                                paddingTop: "2px",
                                paddingBottom: "2px",
                                ...(mobileUrlBarFont || {}),
                            }}
                        >
                            {currentWebsite?.url || "website.com"}
                        </span>

                        {/* Refresh Icon */}
                        {showMobileRefreshIcon && (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{
                                    flexShrink: 0,
                                    cursor: "pointer",
                                    animation: isRefreshSpinning
                                        ? "refreshSpin 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                                        : "none",
                                }}
                                onClick={handleRefresh}
                                aria-label="Reload active project"
                            >
                                <path
                                    d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0.01 3.58 0.01 8C0.01 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z"
                                    fill={finalTextColor}
                                    opacity={
                                        isUrlHovered &&
                                        currentWebsite?.featuredLink
                                            ? 0.6
                                            : 0.4
                                    }
                                />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Favorites Bar */}
            {showFavoritesBar && (
                <div
                    ref={favoritesBarRef}
                    style={{
                        height: isMobile
                            ? mobileBottomBarHeight
                            : favoritesBarHeight,
                        backgroundColor: isMobile
                            ? darkMode
                                ? "#2C2C2E"
                                : "#F7F7F7"
                            : finalBarColor,
                        borderBottom: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
                        display: "flex",
                        alignItems: "center",
                        padding: isMobile ? "0 20px" : "0 16px",
                        gap: 8,
                        overflowX: "visible",
                        position: "relative",
                        opacity:
                            staticUntilScrollEnd &&
                            enableScrollAnimation &&
                            scrollProgress < 1
                                ? 0.5
                                : 1,
                        pointerEvents:
                            staticUntilScrollEnd &&
                            enableScrollAnimation &&
                            scrollProgress < 1
                                ? "none"
                                : "auto",
                        justifyContent: isMobile ? "flex-start" : "flex-start",
                        order: isMobile ? 3 : 0,
                        borderTop: isMobile
                            ? `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`
                            : "none",
                        cursor:
                            enableAnimatedCursor && effectiveReplaceUserCursor
                                ? isMobile
                                    ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize * 0.8}" height="${cursorSize * 0.8}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke-width="1" opacity="0.9"/></svg>') ${cursorSize * 0.4} ${cursorSize * 0.4}, auto`
                                    : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${encodeURIComponent(cursorColor)}" stroke="%23FFFFFF" stroke-width="1.5" stroke-linejoin="round"/></svg>') 0 0, auto`
                                : "default",
                    }}
                    onMouseEnter={() =>
                        startTransition(() => setIsUserHovering(true))
                    }
                    onMouseLeave={() =>
                        startTransition(() => setIsUserHovering(false))
                    }
                >
                    {isMobile && (
                        <>
                            {/* Left Arrow for Mobile */}
                            {showMobileNavArrows && (
                                <button
                                    onClick={handlePrevious}
                                    disabled={activeIndex === 0}
                                    aria-label="Navigate to previous project"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor:
                                            activeIndex === 0
                                                ? "default"
                                                : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        borderRadius: 6,
                                        transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        position: "absolute",
                                        left: "20px",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeIndex !== 0) {
                                            e.currentTarget.style.backgroundColor =
                                                darkMode
                                                    ? "rgba(255, 255, 255, 0.08)"
                                                    : "rgba(0, 0, 0, 0.04)"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "transparent"
                                    }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M15 18L9 12L15 6"
                                            stroke={mobileSafariIconColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            opacity={
                                                activeIndex === 0 ? 0.3 : 1
                                            }
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Right Arrow for Mobile */}
                            {showMobileNavArrows && (
                                <button
                                    onClick={handleNext}
                                    disabled={
                                        activeIndex === websites.length - 1
                                    }
                                    aria-label="Navigate to next project"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor:
                                            activeIndex === websites.length - 1
                                                ? "default"
                                                : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        borderRadius: 6,
                                        transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        position: "absolute",
                                        left: "64px",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (
                                            activeIndex !==
                                            websites.length - 1
                                        ) {
                                            e.currentTarget.style.backgroundColor =
                                                darkMode
                                                    ? "rgba(255, 255, 255, 0.08)"
                                                    : "rgba(0, 0, 0, 0.04)"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "transparent"
                                    }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M9 6L15 12L9 18"
                                            stroke={mobileSafariIconColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            opacity={
                                                activeIndex ===
                                                websites.length - 1
                                                    ? 0.3
                                                    : 1
                                            }
                                        />
                                    </svg>
                                </button>
                            )}

                            {/* Tabs Icon with Number on Right Side */}
                            {showMobileTabsIcon && (
                                <div
                                    ref={mobileTabsRef}
                                    style={{
                                        position: "relative",
                                        marginLeft: "auto",
                                        marginRight: "-4px",
                                    }}
                                >
                                    <button
                                        onClick={toggleMobileTabs}
                                        aria-label="Open Navigation List of all projects"
                                        style={{
                                            background: "none",
                                            border: "none",
                                            padding: "8px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                        }}
                                    >
                                        <svg
                                            width="35"
                                            height="35"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <rect
                                                x="6"
                                                y="6"
                                                width="12"
                                                height="12"
                                                rx="2"
                                                stroke={mobileSafariIconColor}
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                        </svg>
                                        <span
                                            style={{
                                                position: "absolute",
                                                fontSize: "10px",
                                                fontWeight: 600,
                                                color: mobileSafariIconColor,
                                                top: "50%",
                                                left: "50%",
                                                transform:
                                                    "translate(-50%, -50%)",
                                            }}
                                        >
                                            {finalMobileTabsCount}
                                        </span>
                                    </button>

                                    {/* Mobile Tabs Dropdown Menu */}
                                    {isMobileTabsOpen && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: "calc(100% + 8px)",
                                                right: 0,
                                                backgroundColor:
                                                    finalBackgroundColor,
                                                borderRadius: 10,
                                                boxShadow: darkMode
                                                    ? "0 12px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)"
                                                    : "0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)",
                                                border: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
                                                minWidth: 200,
                                                maxHeight: 320,
                                                overflowY: "auto",
                                                zIndex: 1000,
                                                padding: "6px",
                                                animation:
                                                    "dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                            }}
                                        >
                                            {websites.map((website, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        handleFavoriteClick(
                                                            index
                                                        )
                                                        // Don't close tabs menu anymore
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                        background: "none",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        padding: "8px 12px",
                                                        borderRadius: 6,
                                                        transition:
                                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        backgroundColor:
                                                            activeIndex ===
                                                            index
                                                                ? darkMode
                                                                    ? "rgba(255, 255, 255, 0.12)"
                                                                    : "rgba(0, 0, 0, 0.06)"
                                                                : "transparent",
                                                        textAlign: "left",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (
                                                            activeIndex !==
                                                            index
                                                        ) {
                                                            e.currentTarget.style.backgroundColor =
                                                                darkMode
                                                                    ? "rgba(255, 255, 255, 0.06)"
                                                                    : "rgba(0, 0, 0, 0.03)"
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (
                                                            activeIndex !==
                                                            index
                                                        ) {
                                                            e.currentTarget.style.backgroundColor =
                                                                "transparent"
                                                        }
                                                    }}
                                                >
                                                    {website.favicon?.src && (
                                                        <img
                                                            src={
                                                                website.favicon
                                                                    .src
                                                            }
                                                            alt={
                                                                website.favicon
                                                                    ?.alt || ""
                                                            }
                                                            style={{
                                                                width: faviconSize,
                                                                height: faviconSize,
                                                                borderRadius: 3,
                                                                objectFit:
                                                                    "cover",
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                                    <span
                                                        style={{
                                                            color: finalTextColor,
                                                            opacity: 0.8,
                                                            fontWeight: 400,
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                            fontSize: "15px",
                                                        }}
                                                    >
                                                        {website.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Share Button on Right Side */}
                            {showMobileShareIcon && (
                                <button
                                    onClick={handleFeaturedLinkClick}
                                    aria-label="Click to learn more about this project"
                                    style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px",
                                        cursor: currentWebsite?.featuredLink
                                            ? "pointer"
                                            : "default",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "absolute",
                                        right: "60px",
                                    }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M12 15V3M12 3L8 7M12 3L16 7"
                                            stroke={mobileSafariIconColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M4 14V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V14"
                                            stroke={mobileSafariIconColor}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            )}
                        </>
                    )}

                    {!isMobile && showCustomText && customText && (
                        <span
                            style={{
                                color: finalTextColor,
                                opacity: 0.6,
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                                paddingRight: 12,
                                borderRight: `1.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                                marginRight: 4,
                                ...customTextFont,
                            }}
                        >
                            {customText}
                        </span>
                    )}
                    <div
                        ref={itemsRef}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            ...(isMobile
                                ? {
                                      position: "absolute",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                  }
                                : {}),
                        }}
                    >
                        {isMobile ? (
                            // Mobile: Show only active item centered
                            <div
                                style={{ position: "relative" }}
                                onMouseEnter={() =>
                                    startTransition(() =>
                                        setHoveredFavIndex(activeIndex)
                                    )
                                }
                                onMouseLeave={() =>
                                    startTransition(() =>
                                        setHoveredFavIndex(null)
                                    )
                                }
                            >
                                <button
                                    ref={(el) => {
                                        favoriteButtonRefs.current[
                                            activeIndex
                                        ] = el
                                    }}
                                    onClick={() =>
                                        handleFavoriteClick(activeIndex)
                                    }
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "10px 16px",
                                        borderRadius: 8,
                                        transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        backgroundColor: darkMode
                                            ? "rgba(255, 255, 255, 0.12)"
                                            : "rgba(0, 0, 0, 0.06)",
                                    }}
                                >
                                    {websites[activeIndex]?.favicon?.src && (
                                        <img
                                            src={
                                                websites[activeIndex].favicon
                                                    .src
                                            }
                                            alt={
                                                websites[activeIndex]?.favicon
                                                    ?.alt || ""
                                            }
                                            style={{
                                                width: faviconSize * 1.5,
                                                height: faviconSize * 1.5,
                                                borderRadius: 4,
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                    <span
                                        style={{
                                            color: finalTextColor,
                                            opacity: 0.8,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            fontSize: "15px",
                                            fontWeight: 500,
                                            paddingTop: "1px",
                                            paddingBottom: "1px",
                                            ...(mobileFavoritesFont || {}),
                                        }}
                                    >
                                        {websites[activeIndex]?.name}
                                    </span>
                                </button>

                                {/* Hover Popout Tooltip */}
                                {(hoveredFavIndex === activeIndex ||
                                    (showAnimatedCursor &&
                                        animatedCursorHoverIndex ===
                                            activeIndex)) &&
                                    showTooltips &&
                                    !isMobile &&
                                    websites[activeIndex]?.showTooltip !==
                                        false &&
                                    (websites[activeIndex]?.tooltipLine1 ||
                                        websites[activeIndex]
                                            ?.tooltipLine2) && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 8px)",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                backgroundColor: websites[
                                                    activeIndex
                                                ]?.tooltipColorOverride
                                                    ? websites[activeIndex]
                                                          ?.tooltipCustomBackgroundColor
                                                    : finalTooltipBackgroundColor,
                                                backdropFilter:
                                                    "blur(40px) saturate(180%)",
                                                WebkitBackdropFilter:
                                                    "blur(40px) saturate(180%)",
                                                borderRadius: 8,
                                                padding: "8px 12px",
                                                boxShadow:
                                                    "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(255, 255, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                                                border: `0.5px solid ${finalTooltipBorderColor}`,
                                                zIndex: 1000,
                                                minWidth: 120,
                                                maxWidth: 200,
                                                pointerEvents: "none",
                                                animation:
                                                    "tooltipFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                            }}
                                        >
                                            {/* Arrow */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: -5,
                                                    left: "50%",
                                                    transform:
                                                        "translateX(-50%)",
                                                    width: 0,
                                                    height: 0,
                                                    borderLeft:
                                                        "5px solid transparent",
                                                    borderRight:
                                                        "5px solid transparent",
                                                    borderBottom: `5px solid ${finalTooltipBorderColor}`,
                                                    filter: "drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1))",
                                                }}
                                            />

                                            {/* Tooltip Content */}
                                            <div
                                                style={{
                                                    position: "relative",
                                                    zIndex: 1,
                                                }}
                                            >
                                                {websites[activeIndex]
                                                    ?.tooltipLine1 && (
                                                    <div
                                                        style={{
                                                            color: websites[
                                                                activeIndex
                                                            ]
                                                                ?.tooltipColorOverride
                                                                ? websites[
                                                                      activeIndex
                                                                  ]
                                                                      ?.tooltipCustomTextColor
                                                                : finalTooltipTextColor,
                                                            opacity: 0.95,
                                                            marginBottom:
                                                                websites[
                                                                    activeIndex
                                                                ]?.tooltipLine2
                                                                    ? 2
                                                                    : 0,
                                                            whiteSpace:
                                                                "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            textShadow:
                                                                "0 1px 2px rgba(0, 0, 0, 0.2)",
                                                            ...tooltipFont,
                                                        }}
                                                    >
                                                        {
                                                            websites[
                                                                activeIndex
                                                            ]?.tooltipLine1
                                                        }
                                                    </div>
                                                )}
                                                {websites[activeIndex]
                                                    ?.tooltipLine2 && (
                                                    <div
                                                        style={{
                                                            color: websites[
                                                                activeIndex
                                                            ]
                                                                ?.tooltipColorOverride
                                                                ? websites[
                                                                      activeIndex
                                                                  ]
                                                                      ?.tooltipCustomTextColor
                                                                : finalTooltipTextColor,
                                                            opacity: 0.7,
                                                            whiteSpace:
                                                                "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            textShadow:
                                                                "0 1px 2px rgba(0, 0, 0, 0.2)",
                                                            ...tooltipFont,
                                                        }}
                                                    >
                                                        {
                                                            websites[
                                                                activeIndex
                                                            ]?.tooltipLine2
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        ) : (
                            // Desktop: Show all items up to maxVisibleWebsites
                            websites
                                .slice(0, maxVisibleWebsites)
                                .map((website, index) => (
                                    <div
                                        key={index}
                                        style={{ position: "relative" }}
                                        onMouseEnter={() =>
                                            startTransition(() =>
                                                setHoveredFavIndex(index)
                                            )
                                        }
                                        onMouseLeave={() =>
                                            startTransition(() =>
                                                setHoveredFavIndex(null)
                                            )
                                        }
                                    >
                                        <button
                                            ref={(el) => {
                                                favoriteButtonRefs.current[
                                                    index
                                                ] = el
                                            }}
                                            onClick={() =>
                                                handleFavoriteClick(index)
                                            }
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "6px 10px",
                                                borderRadius: 6,
                                                transition:
                                                    "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                backgroundColor:
                                                    activeIndex === index
                                                        ? darkMode
                                                            ? "rgba(255, 255, 255, 0.12)"
                                                            : "rgba(0, 0, 0, 0.06)"
                                                        : "transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (activeIndex !== index) {
                                                    e.currentTarget.style.backgroundColor =
                                                        darkMode
                                                            ? "rgba(255, 255, 255, 0.06)"
                                                            : "rgba(0, 0, 0, 0.03)"
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (activeIndex !== index) {
                                                    e.currentTarget.style.backgroundColor =
                                                        "transparent"
                                                }
                                            }}
                                        >
                                            {website.favicon?.src && (
                                                <img
                                                    src={website.favicon.src}
                                                    alt={
                                                        website.favicon?.alt ||
                                                        ""
                                                    }
                                                    style={{
                                                        width: faviconSize,
                                                        height: faviconSize,
                                                        borderRadius: 3,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            )}
                                            <span
                                                style={{
                                                    color: finalTextColor,
                                                    opacity:
                                                        activeIndex === index
                                                            ? 0.8
                                                            : 0.6,
                                                    whiteSpace: "nowrap",
                                                    transition:
                                                        "opacity 0.2s ease",
                                                    ...favoritesFont,
                                                }}
                                            >
                                                {website.name}
                                            </span>
                                        </button>

                                        {/* Hover Popout Tooltip */}
                                        {(hoveredFavIndex === index ||
                                            (showAnimatedCursor &&
                                                animatedCursorHoverIndex ===
                                                    index)) &&
                                            showTooltips &&
                                            !isMobile &&
                                            website.showTooltip !== false &&
                                            (website.tooltipLine1 ||
                                                website.tooltipLine2) && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: "calc(100% + 8px)",
                                                        left: "50%",
                                                        transform:
                                                            "translateX(-50%)",
                                                        backgroundColor:
                                                            website.tooltipColorOverride
                                                                ? website.tooltipCustomBackgroundColor
                                                                : finalTooltipBackgroundColor,
                                                        backdropFilter:
                                                            "blur(40px) saturate(180%)",
                                                        WebkitBackdropFilter:
                                                            "blur(40px) saturate(180%)",
                                                        borderRadius: 8,
                                                        padding: "8px 12px",
                                                        boxShadow:
                                                            "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(255, 255, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                                                        border: `0.5px solid ${finalTooltipBorderColor}`,
                                                        zIndex: 1000,
                                                        minWidth: 120,
                                                        maxWidth: 200,
                                                        pointerEvents: "none",
                                                        animation:
                                                            "tooltipFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    }}
                                                >
                                                    {/* Arrow */}
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: -5,
                                                            left: "50%",
                                                            transform:
                                                                "translateX(-50%)",
                                                            width: 0,
                                                            height: 0,
                                                            borderLeft:
                                                                "5px solid transparent",
                                                            borderRight:
                                                                "5px solid transparent",
                                                            borderBottom: `5px solid ${finalTooltipBorderColor}`,
                                                            filter: "drop-shadow(0 -1px 1px rgba(0, 0, 0, 0.1))",
                                                        }}
                                                    />

                                                    {/* Tooltip Content */}
                                                    <div
                                                        style={{
                                                            position:
                                                                "relative",
                                                            zIndex: 1,
                                                        }}
                                                    >
                                                        {website.tooltipLine1 && (
                                                            <div
                                                                style={{
                                                                    color: website.tooltipColorOverride
                                                                        ? website.tooltipCustomTextColor
                                                                        : finalTooltipTextColor,
                                                                    opacity: 0.95,
                                                                    marginBottom:
                                                                        website.tooltipLine2
                                                                            ? 2
                                                                            : 0,
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                    textShadow:
                                                                        "0 1px 2px rgba(0, 0, 0, 0.2)",
                                                                    ...tooltipFont,
                                                                }}
                                                            >
                                                                {
                                                                    website.tooltipLine1
                                                                }
                                                            </div>
                                                        )}
                                                        {website.tooltipLine2 && (
                                                            <div
                                                                style={{
                                                                    color: website.tooltipColorOverride
                                                                        ? website.tooltipCustomTextColor
                                                                        : finalTooltipTextColor,
                                                                    opacity: 0.7,
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                    overflow:
                                                                        "hidden",
                                                                    textOverflow:
                                                                        "ellipsis",
                                                                    textShadow:
                                                                        "0 1px 2px rgba(0, 0, 0, 0.2)",
                                                                    ...tooltipFont,
                                                                }}
                                                            >
                                                                {
                                                                    website.tooltipLine2
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                ))
                        )}
                    </div>

                    {!isMobile &&
                        showDropdown &&
                        websites.length > maxVisibleWebsites && (
                            <div
                                ref={dropdownRef}
                                style={{ position: "relative", marginLeft: 4 }}
                            >
                                <button
                                    onClick={toggleDropdown}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "6px 10px",
                                        borderRadius: 6,
                                        transition:
                                            "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        backgroundColor: isDropdownOpen
                                            ? darkMode
                                                ? "rgba(255, 255, 255, 0.12)"
                                                : "rgba(0, 0, 0, 0.06)"
                                            : "transparent",
                                        opacity:
                                            staticUntilScrollEnd &&
                                            enableScrollAnimation &&
                                            scrollProgress < 1
                                                ? 0.5
                                                : 1,
                                        pointerEvents:
                                            staticUntilScrollEnd &&
                                            enableScrollAnimation &&
                                            scrollProgress < 1
                                                ? "none"
                                                : "auto",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isDropdownOpen) {
                                            e.currentTarget.style.backgroundColor =
                                                darkMode
                                                    ? "rgba(255, 255, 255, 0.06)"
                                                    : "rgba(0, 0, 0, 0.03)"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isDropdownOpen) {
                                            e.currentTarget.style.backgroundColor =
                                                "transparent"
                                        }
                                    }}
                                >
                                    <span
                                        style={{
                                            color: finalTextColor,
                                            opacity: 0.6,
                                            whiteSpace: "nowrap",
                                            fontWeight: 400,
                                            ...favoritesFont,
                                        }}
                                    >
                                        +{websites.length - maxVisibleWebsites}
                                    </span>
                                    <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                        fill="none"
                                        style={{
                                            transform: isDropdownOpen
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                            transition: "transform 0.25s ease",
                                        }}
                                    >
                                        <path
                                            d="M2 3.5L5 6.5L8 3.5"
                                            stroke={finalTextColor}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            opacity="0.6"
                                        />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            right: 0,
                                            backgroundColor:
                                                finalBackgroundColor,
                                            borderRadius: 10,
                                            boxShadow: darkMode
                                                ? "0 12px 32px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1)"
                                                : "0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.1)",
                                            border: `0.5px solid ${darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"}`,
                                            minWidth: 200,
                                            maxHeight: 320,
                                            overflowY: "auto",
                                            zIndex: 1000,
                                            padding: "6px",
                                            animation:
                                                "dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                        }}
                                    >
                                        {websites
                                            .slice(maxVisibleWebsites)
                                            .map((website, idx) => {
                                                const actualIndex =
                                                    maxVisibleWebsites + idx
                                                return (
                                                    <button
                                                        key={actualIndex}
                                                        onClick={() =>
                                                            handleDropdownItemClick(
                                                                actualIndex
                                                            )
                                                        }
                                                        style={{
                                                            width: "100%",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: 10,
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            padding: "8px 12px",
                                                            borderRadius: 6,
                                                            transition:
                                                                "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                            backgroundColor:
                                                                activeIndex ===
                                                                actualIndex
                                                                    ? darkMode
                                                                        ? "rgba(255, 255, 255, 0.12)"
                                                                        : "rgba(0, 0, 0, 0.06)"
                                                                    : "transparent",
                                                            textAlign: "left",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (
                                                                activeIndex !==
                                                                actualIndex
                                                            ) {
                                                                e.currentTarget.style.backgroundColor =
                                                                    darkMode
                                                                        ? "rgba(255, 255, 255, 0.06)"
                                                                        : "rgba(0, 0, 0, 0.03)"
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (
                                                                activeIndex !==
                                                                actualIndex
                                                            ) {
                                                                e.currentTarget.style.backgroundColor =
                                                                    "transparent"
                                                            }
                                                        }}
                                                    >
                                                        {website.favicon
                                                            ?.src && (
                                                            <img
                                                                src={
                                                                    website
                                                                        .favicon
                                                                        .src
                                                                }
                                                                alt={
                                                                    website
                                                                        .favicon
                                                                        ?.alt ||
                                                                    ""
                                                                }
                                                                style={{
                                                                    width: faviconSize,
                                                                    height: faviconSize,
                                                                    borderRadius: 3,
                                                                    objectFit:
                                                                        "cover",
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        )}
                                                        <span
                                                            style={{
                                                                color: finalTextColor,
                                                                opacity: 0.8,
                                                                fontWeight: 400,
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                                whiteSpace:
                                                                    "nowrap",
                                                                ...favoritesFont,
                                                            }}
                                                        >
                                                            {website.name}
                                                        </span>
                                                    </button>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>
                        )}
                </div>
            )}

            {/* Content Area */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    overflow: "hidden",
                    position: "relative",
                    opacity:
                        staticUntilScrollEnd &&
                        enableScrollAnimation &&
                        scrollProgress < 1
                            ? 0.7
                            : 1,
                    pointerEvents:
                        staticUntilScrollEnd &&
                        enableScrollAnimation &&
                        scrollProgress < 1
                            ? "none"
                            : "auto",
                    order: isMobile ? 2 : 0,
                    cursor:
                        enableAnimatedCursor && effectiveReplaceUserCursor
                            ? isMobile
                                ? `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize * 0.8}" height="${cursorSize * 0.8}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke="${encodeURIComponent(mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000"))}" stroke-width="1" opacity="0.9"/></svg>') ${cursorSize * 0.4} ${cursorSize * 0.4}, auto`
                                : `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" viewBox="0 0 24 24"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="${encodeURIComponent(cursorColor)}" stroke="%23FFFFFF" stroke-width="1.5" stroke-linejoin="round"/></svg>') 0 0, auto`
                            : isMobile
                              ? "pointer"
                              : "default",
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleContentClick}
            >
                {/* Loading Bar */}
                {isLoading && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: 3,
                            backgroundColor: loadingBarColor,
                            zIndex: 1001,
                            animation:
                                "loadingBar 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                            boxShadow: `0 0 12px ${loadingBarColor}80`,
                        }}
                    />
                )}
                {currentWebsite?.embedUrl ? (
                    <iframe
                        src={currentWebsite.embedUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            opacity: imageTransitionOpacity,
                            filter:
                                imageTransitionBlur > 0
                                    ? `blur(${imageTransitionBlur}px)`
                                    : "none",
                            transform: `scale(${imageTransitionScale}) translateX(${imageTransitionTranslateX}px)`,
                            transition:
                                transitionType === "none"
                                    ? "none"
                                    : `opacity ${transitionDuration}s ease-in-out, filter ${transitionDuration}s ease-in-out, transform ${transitionDuration}s ease-in-out`,
                        }}
                        title={currentWebsite.name}
                    />
                ) : (
                    <img
                        src={displayImage.src}
                        alt={displayImage.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: imageTransitionOpacity,
                            filter:
                                imageTransitionBlur > 0
                                    ? `blur(${imageTransitionBlur}px)`
                                    : "none",
                            transform: `scale(${imageTransitionScale}) translateX(${imageTransitionTranslateX}px)`,
                            transition:
                                transitionType === "none"
                                    ? "none"
                                    : `opacity ${transitionDuration}s ease-in-out, filter ${transitionDuration}s ease-in-out, transform ${transitionDuration}s ease-in-out`,
                        }}
                    />
                )}

                {/* Glassmorphism Overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: darkMode
                            ? "rgba(0, 0, 0, 0.4)"
                            : "rgba(0, 0, 0, 0.15)",
                        backdropFilter: darkMode
                            ? "blur(60px) saturate(150%)"
                            : "blur(60px) saturate(200%)",
                        WebkitBackdropFilter: darkMode
                            ? "blur(60px) saturate(150%)"
                            : "blur(60px) saturate(200%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                            (currentWebsite?.overlayAlignment || "center") ===
                            "left"
                                ? "flex-start"
                                : (currentWebsite?.overlayAlignment ||
                                        "center") === "right"
                                  ? "flex-end"
                                  : "center",
                        justifyContent: "center",
                        gap: currentWebsite?.overlayGap ?? 20,
                        padding: 48,
                        opacity:
                            showOverlay &&
                            !hasSeenOverlay &&
                            currentWebsite?.enableOverlay === true &&
                            showOverlays &&
                            !currentWebsite?.embedUrl
                                ? 1
                                : 0,
                        transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        pointerEvents:
                            showOverlay &&
                            !hasSeenOverlay &&
                            currentWebsite?.enableOverlay === true &&
                            showOverlays &&
                            !currentWebsite?.embedUrl
                                ? "auto"
                                : "none",
                    }}
                >
                    {/* Close Icon */}
                    <button
                        onClick={handleCloseOverlay}
                        aria-label="Close Project Information"
                        style={{
                            position: "absolute",
                            top: 24,
                            right: 24,
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: darkMode
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(255, 255, 255, 0.15)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            border: darkMode
                                ? "0.5px solid rgba(255, 255, 255, 0.12)"
                                : "0.5px solid rgba(255, 255, 255, 0.2)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            padding: 0,
                            boxShadow: darkMode
                                ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                                : "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode
                                ? "rgba(255, 255, 255, 0.15)"
                                : "rgba(255, 255, 255, 0.25)"
                            e.currentTarget.style.transform = "scale(1.08)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = darkMode
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(255, 255, 255, 0.15)"
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                        >
                            <path
                                d="M1 1L11 11M11 1L1 11"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>

                    {/* Logo Image */}
                    {currentWebsite?.logoImage?.src && (
                        <img
                            src={currentWebsite.logoImage.src}
                            alt={currentWebsite?.logoImage?.alt || "Logo"}
                            style={{
                                width: currentWebsite?.logoImageSize || 80,
                                objectFit: "contain",
                                filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))",
                            }}
                        />
                    )}

                    {/* Headline */}
                    <h2
                        style={{
                            margin: 0,
                            color: currentWebsite?.overlayOverride
                                ? currentWebsite?.customHeadlineColor ||
                                  finalHeadlineColor
                                : finalHeadlineColor,
                            textShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
                            textAlign: "center",
                            width: currentWebsite?.overlayHeadlineWidth
                                ? `${currentWebsite.overlayHeadlineWidth}%`
                                : "auto",
                            ...(currentWebsite?.overlayOverride &&
                            currentWebsite?.customHeadlineFont
                                ? currentWebsite.customHeadlineFont
                                : headlineFont),
                        }}
                    >
                        {currentWebsite?.overlayHeadline || "Welcome"}
                    </h2>

                    {/* Subline */}
                    <p
                        style={{
                            margin: 0,
                            color: currentWebsite?.overlayOverride
                                ? currentWebsite?.customSublineColor ||
                                  finalSublineColor
                                : finalSublineColor,
                            textShadow: "0 2px 16px rgba(0, 0, 0, 0.2)",
                            textAlign: "center",
                            width: currentWebsite?.overlaySublineWidth
                                ? `${currentWebsite.overlaySublineWidth}%`
                                : "auto",
                            ...(currentWebsite?.overlayOverride &&
                            currentWebsite?.customSublineFont
                                ? currentWebsite.customSublineFont
                                : sublineFont),
                        }}
                    >
                        {currentWebsite?.overlaySubline ||
                            "Discover amazing content"}
                    </p>

                    {/* Button */}
                    {currentWebsite?.buttonLink ? (
                        <a
                            href={
                                currentWebsite.buttonLink.startsWith("/") ||
                                currentWebsite.buttonLink.startsWith("http")
                                    ? currentWebsite.buttonLink
                                    : `https://${currentWebsite.buttonLink}`
                            }
                            target={currentWebsite.buttonTarget || "_self"}
                            rel={
                                currentWebsite.buttonTarget === "_blank"
                                    ? "noopener noreferrer"
                                    : undefined
                            }
                            style={{
                                backgroundColor: darkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(255, 255, 255, 0.18)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                border: darkMode
                                    ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                    : "0.5px solid rgba(255, 255, 255, 0.2)",
                                borderRadius: 12,
                                padding: "14px 32px",
                                color: currentWebsite?.overlayOverride
                                    ? currentWebsite?.customButtonTextColor ||
                                      finalButtonTextColor
                                    : finalButtonTextColor,
                                cursor: "pointer",
                                boxShadow: darkMode
                                    ? "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                                    : "0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                textDecoration: "none",
                                display: "inline-block",
                                ...(currentWebsite?.overlayOverride &&
                                currentWebsite?.customButtonFont
                                    ? currentWebsite.customButtonFont
                                    : buttonFont),
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode
                                    ? "rgba(255, 255, 255, 0.18)"
                                    : "rgba(255, 255, 255, 0.28)"
                                e.currentTarget.style.transform =
                                    "translateY(-2px)"
                                e.currentTarget.style.boxShadow = darkMode
                                    ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
                                    : "0 8px 32px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(255, 255, 255, 0.18)"
                                e.currentTarget.style.transform =
                                    "translateY(0)"
                                e.currentTarget.style.boxShadow = darkMode
                                    ? "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                                    : "0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                            }}
                        >
                            {currentWebsite?.overlayButtonText || "Learn More"}
                        </a>
                    ) : (
                        <button
                            style={{
                                backgroundColor: darkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(255, 255, 255, 0.18)",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                border: darkMode
                                    ? "0.5px solid rgba(255, 255, 255, 0.15)"
                                    : "0.5px solid rgba(255, 255, 255, 0.3)",
                                borderRadius: 12,
                                padding: "14px 32px",
                                color: currentWebsite?.overlayOverride
                                    ? currentWebsite?.customButtonTextColor ||
                                      finalButtonTextColor
                                    : finalButtonTextColor,
                                cursor: "pointer",
                                boxShadow: darkMode
                                    ? "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                                    : "0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                ...(currentWebsite?.overlayOverride &&
                                currentWebsite?.customButtonFont
                                    ? currentWebsite.customButtonFont
                                    : buttonFont),
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode
                                    ? "rgba(255, 255, 255, 0.18)"
                                    : "rgba(255, 255, 255, 0.28)"
                                e.currentTarget.style.transform =
                                    "translateY(-2px)"
                                e.currentTarget.style.boxShadow = darkMode
                                    ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)"
                                    : "0 8px 32px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = darkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(255, 255, 255, 0.18)"
                                e.currentTarget.style.transform =
                                    "translateY(0)"
                                e.currentTarget.style.boxShadow = darkMode
                                    ? "0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                                    : "0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                            }}
                        >
                            {currentWebsite?.overlayButtonText || "Learn More"}
                        </button>
                    )}
                </div>
            </div>

            {/* Animated Cursor */}
            {showAnimatedCursor && enableAnimatedCursor && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        width: isMobile ? cursorSize * 0.8 : cursorSize,
                        height: isMobile ? cursorSize * 0.8 : cursorSize,
                        pointerEvents: "none",
                        zIndex: 10000,
                        transform: `translate(-50%, -50%) scale(${isCursorClicking ? (isMobile ? 1.5 : 0.8) : 1})`,
                        transition: `left ${isUserHovering ? 1.2 : cursorMoveSpeed}s cubic-bezier(0.4, 0, 0.2, 1), top ${isUserHovering ? 1.2 : cursorMoveSpeed}s cubic-bezier(0.4, 0, 0.2, 1), transform ${cursorClickDuration}s cubic-bezier(0.4, 0, 0.2, 1), opacity ${isUserHovering ? 0.6 : 0.3}s ease-out`,
                        opacity: isUserHovering ? 0 : 1,
                    }}
                >
                    {isMobile ? (
                        <>
                            {/* Mobile: Dot Cursor */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    backgroundColor:
                                        mobileCursorDotColor ||
                                        (darkMode ? "#E5E5E7" : "#000000"),
                                    backdropFilter: "blur(20px) saturate(180%)",
                                    WebkitBackdropFilter:
                                        "blur(20px) saturate(180%)",
                                    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)`,
                                    border: `0.5px solid ${mobileCursorDotColor || (darkMode ? "#E5E5E7" : "#000000")}60`,
                                    transition: `opacity ${cursorClickDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                                }}
                            />

                            {/* Click ripple effect for mobile */}
                            {isCursorClicking && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "50%",
                                        backgroundColor:
                                            mobileCursorDotColor ||
                                            (darkMode ? "#E5E5E7" : "#000000"),
                                        transform: "translate(-50%, -50%)",
                                        animation: `mobileCursorRipple ${cursorClickDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                                        opacity: 0,
                                    }}
                                />
                            )}
                        </>
                    ) : (
                        <>
                            {/* Desktop: Arrow Cursor */}
                            <svg
                                width={cursorSize}
                                height={cursorSize}
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{
                                    filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
                                }}
                            >
                                <path
                                    d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                                    fill={cursorColor}
                                    stroke="#FFFFFF"
                                    strokeWidth="1.5"
                                    strokeLinejoin="round"
                                />
                            </svg>

                            {/* Click ripple effect for desktop */}
                            {isCursorClicking && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        width: cursorSize * 2,
                                        height: cursorSize * 2,
                                        borderRadius: "50%",
                                        border: `2px solid ${cursorColor}`,
                                        transform: "translate(-50%, -50%)",
                                        animation: `cursorRipple ${cursorClickDuration}s ease-out`,
                                        opacity: 0,
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Preloader */}
            {showPreloader && enablePreloader && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: finalPreloaderBackgroundColor,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 24,
                        zIndex: 100000,
                        opacity: 1,
                        animation:
                            (enableScrollAnimation &&
                                frozenUntilScrollEnd &&
                                scrollProgress >= 1) ||
                            !frozenUntilScrollEnd
                                ? `preloaderFadeOut ${preloaderFadeOutDuration}s ease-out ${preloaderDuration - preloaderFadeOutDuration}s forwards`
                                : "none",
                        pointerEvents: "none",
                        borderRadius: isMobile
                            ? mobileBorderRadius
                            : desktopBorderRadius,
                    }}
                >
                    {/* Preloader Logo */}
                    {preloaderLogoImage?.src && (
                        <img
                            src={preloaderLogoImage.src}
                            alt={preloaderLogoImage.alt || "Loading"}
                            style={{
                                width: preloaderLogoSize,
                                height: preloaderLogoSize,
                                objectFit: "contain",
                                animation:
                                    (enableScrollAnimation &&
                                        frozenUntilScrollEnd &&
                                        scrollProgress >= 1) ||
                                    !frozenUntilScrollEnd
                                        ? "logoFadeIn 0.5s ease-out"
                                        : "none",
                            }}
                        />
                    )}

                    {/* Progress Bar */}
                    <div
                        style={{
                            width: preloaderProgressBarWidth,
                            height: 4,
                            backgroundColor:
                                preloaderProgressBarBackgroundColor,
                            borderRadius: 2,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width:
                                    frozenUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? "0%"
                                        : "100%",
                                height: "100%",
                                backgroundColor: preloaderProgressBarColor,
                                animation:
                                    frozenUntilScrollEnd &&
                                    enableScrollAnimation &&
                                    scrollProgress < 1
                                        ? "none"
                                        : `loadingBarProgress ${preloaderDuration - preloaderFadeOutDuration}s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                            }}
                        />
                    </div>
                </div>
            )}
            <style>
                {`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                    
                    @keyframes loadingBar {
                        0% {
                            width: 0%;
                        }
                        50% {
                            width: 70%;
                        }
                        100% {
                            width: 100%;
                        }
                    }
                    
                    @keyframes tooltipFadeIn {
                        from {
                            opacity: 0;
                            transform: translateX(-50%) translateY(-4px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(-50%) translateY(0);
                        }
                    }
                    
                    @keyframes dropdownFadeIn {
                        from {
                            opacity: 0;
                            transform: translateY(-8px) scale(0.96);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    
                    @keyframes cursorRipple {
                        0% {
                            transform: translate(-50%, -50%) scale(0.5);
                            opacity: 0.8;
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.5);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes mobileCursorRipple {
                        0% {
                            transform: translate(-50%, -50%) scale(1);
                            opacity: 0.5;
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(2.5);
                            opacity: 0;
                        }
                    }
                    
                    @keyframes preloaderFadeOut {
                        0% {
                            opacity: 1;
                        }
                        100% {
                            opacity: 0;
                        }
                    }
                    
                    @keyframes logoFadeIn {
                        0% {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        100% {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    @keyframes loadingBarProgress {
                        0% {
                            width: 0%;
                        }
                        100% {
                            width: 100%;
                        }
                    }
                    
                    @keyframes notePulse {
                        0%, 100% {
                            transform: translateX(-50%) scale(1);
                            opacity: 1;
                        }
                        50% {
                            transform: translateX(-50%) scale(1.02);
                            opacity: 0.95;
                        }
                    }
                    
                    @keyframes refreshSpin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }
                `}
            </style>

            {/* Interactive Note */}
            {!hasInteracted &&
                !showPreloader &&
                showFavoritesBar &&
                showOneTimeNote &&
                (!waitForScrollEnd || scrollProgress >= 1) &&
                (!staticUntilScrollEnd || scrollProgress >= 1) && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: isMobile ? 68 : 24,
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: finalTooltipBackgroundColor,
                            backdropFilter: "blur(40px) saturate(180%)",
                            WebkitBackdropFilter: "blur(40px) saturate(180%)",
                            borderRadius: 8,
                            padding: "10px 16px",
                            boxShadow:
                                "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(255, 255, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                            border: `0.5px solid ${finalTooltipBorderColor}`,
                            zIndex: 999,
                            pointerEvents: "none",
                            animation: "notePulse 2s ease-in-out infinite",
                        }}
                    >
                        <div
                            style={{
                                color: finalTooltipTextColor,
                                opacity: 0.95,
                                whiteSpace: "nowrap",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                ...interactiveNoteFont,
                            }}
                        >
                            <span>{interactiveNoteText}</span>
                        </div>
                    </div>
                )}
        </div>
    )
}

addPropertyControls(BrowserWindow, {
    websites: {
        type: ControlType.Array,
        title: "Websites",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Website",
                },
                url: {
                    type: ControlType.String,
                    title: "Text URL Bar",
                    defaultValue: "website.com",
                },
                featuredLink: {
                    type: ControlType.Link,
                    title: "Link",
                },
                featuredTarget: {
                    type: ControlType.Enum,
                    title: "Link Target",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_blank",
                    displaySegmentedControl: true,
                },
                favicon: {
                    type: ControlType.ResponsiveImage,
                    title: "Favicon",
                },
                embedUrl: {
                    type: ControlType.String,
                    title: "Embed URL (Optional)",
                    defaultValue: "",
                    placeholder: "https://example.com",
                    hidden: (props, rootProps) => !rootProps.enableEmbedUrl,
                },
                embedUrlInfo: {
                    type: ControlType.String,
                    title: " ",
                    defaultValue:
                        "ℹ️ Note: Embed URLs may not work for all sites due to security restrictions (CORS, X-Frame-Options).",
                    displayTextArea: true,
                    hidden: ({ embedUrl }, rootProps) =>
                        !rootProps.enableEmbedUrl ||
                        !embedUrl ||
                        embedUrl.trim() === "",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Preview Image",
                    hidden: ({ embedUrl }) =>
                        embedUrl && embedUrl.trim() !== "",
                },
                mobileImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Mobile Preview Image",
                    hidden: ({ embedUrl }) =>
                        embedUrl && embedUrl.trim() !== "",
                },
                enableOverlay: {
                    type: ControlType.Boolean,
                    title: "Show Overlay",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                    hidden: (props, rootProps) => !rootProps.showOverlays,
                },
                overlayAlignment: {
                    type: ControlType.Enum,
                    title: "Overlay Alignment",
                    options: ["left", "center", "right"],
                    optionTitles: ["Left", "Center", "Right"],
                    defaultValue: "center",
                    displaySegmentedControl: true,
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlayHeadlineWidth: {
                    type: ControlType.Number,
                    title: "Headline Width",
                    defaultValue: 100,
                    min: 10,
                    max: 100,
                    step: 5,
                    unit: "%",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlaySublineWidth: {
                    type: ControlType.Number,
                    title: "Subline Width",
                    defaultValue: 100,
                    min: 10,
                    max: 100,
                    step: 5,
                    unit: "%",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlayGap: {
                    type: ControlType.Number,
                    title: "Overlay Gap",
                    defaultValue: 20,
                    min: 0,
                    max: 100,
                    step: 5,
                    unit: "px",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                logoImageSize: {
                    type: ControlType.Number,
                    title: "Overlay Logo Size",
                    defaultValue: 80,
                    min: 20,
                    max: 200,
                    step: 1,
                    unit: "px",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                logoImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Overlay Logo",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlayHeadline: {
                    type: ControlType.String,
                    title: "Overlay Headline",
                    defaultValue: "Welcome",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlaySubline: {
                    type: ControlType.String,
                    title: "Overlay Subline",
                    defaultValue: "Discover amazing content",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlayButtonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    defaultValue: "Learn More",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                buttonTarget: {
                    type: ControlType.Enum,
                    title: "Button Target",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_self",
                    displaySegmentedControl: true,
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                overlayOverride: {
                    type: ControlType.Boolean,
                    title: "Overlay Style Override",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ enableOverlay }, rootProps) =>
                        !rootProps.showOverlays || !enableOverlay,
                },
                customHeadlineFont: {
                    type: ControlType.Font,
                    title: "Custom Headline Font",
                    defaultValue: {
                        fontSize: "32px",
                        variant: "Bold",
                        letterSpacing: "-0.03em",
                        lineHeight: "1em",
                    },
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                customHeadlineColor: {
                    type: ControlType.Color,
                    title: "Custom Headline Color",
                    defaultValue: "#FFFFFF",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                customSublineFont: {
                    type: ControlType.Font,
                    title: "Custom Subline Font",
                    defaultValue: {
                        fontSize: "15px",
                        variant: "Medium",
                        letterSpacing: "-0.01em",
                        lineHeight: "1.3em",
                    },
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                customSublineColor: {
                    type: ControlType.Color,
                    title: "Custom Subline Color",
                    defaultValue: "#FFFFFF",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                customButtonFont: {
                    type: ControlType.Font,
                    title: "Custom Button Font",
                    defaultValue: {
                        variant: "Semibold",
                        fontSize: "14px",
                        letterSpacing: "-0.01em",
                        lineHeight: "1em",
                    },
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                customButtonTextColor: {
                    type: ControlType.Color,
                    title: "Custom Button Text Color",
                    defaultValue: "#FFFFFF",
                    hidden: ({ enableOverlay, overlayOverride }, rootProps) =>
                        !rootProps.showOverlays ||
                        !enableOverlay ||
                        !overlayOverride,
                },
                showTooltip: {
                    type: ControlType.Boolean,
                    title: "Show Tooltip",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                    hidden: ({ enableOverlay, showTooltip }, rootProps) =>
                        !rootProps.showTooltips,
                },
                tooltipLine1: {
                    type: ControlType.String,
                    title: "Tooltip Line 1",
                    defaultValue: "Tooltip text line 1",
                    placeholder: "First line of text",
                    hidden: ({ enableOverlay, showTooltip }, rootProps) =>
                        !rootProps.showTooltips || showTooltip === false,
                },
                tooltipLine2: {
                    type: ControlType.String,
                    title: "Tooltip Line 2",
                    defaultValue: "Tooltip text line 2",
                    placeholder: "Second line of text",
                    hidden: ({ enableOverlay, showTooltip }, rootProps) =>
                        !rootProps.showTooltips || showTooltip === false,
                },
                tooltipColorOverride: {
                    type: ControlType.Boolean,
                    title: "Tooltip Color Override",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ showTooltip }, rootProps) =>
                        !rootProps.showTooltips || showTooltip === false,
                },
                tooltipCustomBackgroundColor: {
                    type: ControlType.Color,
                    title: "Tooltip Background",
                    defaultValue: "rgba(255, 255, 255, 0.12)",
                    hidden: (
                        { showTooltip, tooltipColorOverride },
                        rootProps
                    ) =>
                        !rootProps.showTooltips ||
                        showTooltip === false ||
                        !tooltipColorOverride,
                },
                tooltipCustomTextColor: {
                    type: ControlType.Color,
                    title: "Tooltip Text Color",
                    defaultValue: "#FFFFFF",
                    hidden: (
                        { showTooltip, tooltipColorOverride },
                        rootProps
                    ) =>
                        !rootProps.showTooltips ||
                        showTooltip === false ||
                        !tooltipColorOverride,
                },
            },
        },
        defaultValue: [
            {
                name: "Framer",
                url: "framer.com",
                favicon: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer",
                },
                overlayHeadline: "Welcome to Framer",
                overlaySubline: "Design and ship your dream site",
                logoImage: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Framer Logo",
                },
                overlayButtonText: "Get Started",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Design and ship sites",
                tooltipLine2: "framer.com",
            },
            {
                name: "Design",
                url: "design.com",
                favicon: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design",
                },
                overlayHeadline: "Welcome to Design",
                overlaySubline: "Create beautiful experiences",
                logoImage: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design Logo",
                },
                overlayButtonText: "Learn More",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Create beautiful experiences",
                tooltipLine2: "design.com",
            },
            {
                name: "Creative",
                url: "creative.com",
                favicon: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative",
                },
                overlayHeadline: "Welcome to Creative",
                overlaySubline: "Unleash your creativity",
                logoImage: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Creative Logo",
                },
                overlayButtonText: "Explore",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Unleash your creativity",
                tooltipLine2: "creative.com",
            },
            {
                name: "Portfolio",
                url: "portfolio.com",
                favicon: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio favicon",
                },
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio",
                },
                overlayHeadline: "Welcome to Portfolio",
                overlaySubline: "Showcase your best work",
                logoImage: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Portfolio Logo",
                },
                overlayButtonText: "View Work",
                buttonLink: "",
                buttonTarget: "_self",
                enableOverlay: true,
                featuredLink: "",
                overlayAlignment: "center",
                logoImageSize: 80,
                showTooltip: true,
                tooltipLine1: "Showcase your best work",
                tooltipLine2: "portfolio.com",
            },
        ],
    },
    browserVariant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["desktop", "mobile"],
        optionTitles: ["Desktop", "Mobile"],
        defaultValue: "desktop",
        displaySegmentedControl: true,
    },
    showAdvancedSettings: {
        type: ControlType.Boolean,
        title: "Advanced Settings",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowSettings: {
        type: ControlType.Object,
        title: "Shadow",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.16)",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 60,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 20,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            enabled: true,
            color: "rgba(0, 0, 0, 0.16)",
            blur: 60,
            spread: 0,
            offsetX: 0,
            offsetY: 20,
        },
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    desktopBorderRadius: {
        type: ControlType.Number,
        title: "Window Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "desktop" || !showAdvancedSettings,
    },
    mobileBorderRadius: {
        type: ControlType.Number,
        title: "Window Radius Mobile",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    enableEmbedUrl: {
        type: ControlType.Boolean,
        title: "Enable Embed URL",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    darkMode: {
        type: ControlType.Boolean,
        title: "Dark Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileTopBarHeight: {
        type: ControlType.Number,
        title: "Top Bar Height",
        defaultValue: 60,
        min: 40,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    mobileUrlBarFont: {
        type: ControlType.Font,
        title: "Mobile URL Bar Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    mobileBottomBarHeight: {
        type: ControlType.Number,
        title: "Bottom Bar Height",
        defaultValue: 60,
        min: 40,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    mobileFavoritesFont: {
        type: ControlType.Font,
        title: "Mobile Favorites Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    mobileIconColor: {
        type: ControlType.Color,
        title: "Mobile Icon Color",
        defaultValue: undefined,
        hidden: ({ browserVariant }) => browserVariant !== "mobile",
    },
    showMobileRefreshIcon: {
        type: ControlType.Boolean,
        title: "Refresh Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    showMobileTabsIcon: {
        type: ControlType.Boolean,
        title: "Tabs Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    showMobileShareIcon: {
        type: ControlType.Boolean,
        title: "Share Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    showMobileNavArrows: {
        type: ControlType.Boolean,
        title: "Navigation Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "mobile" || !showAdvancedSettings,
    },
    showDesktopRefreshIcon: {
        type: ControlType.Boolean,
        title: "Refresh Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant !== "desktop" || !showAdvancedSettings,
    },
    enablePreloader: {
        type: ControlType.Boolean,
        title: "Preloader",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    preloaderDuration: {
        type: ControlType.Number,
        title: "Preloader Duration",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    preloaderFadeOutDuration: {
        type: ControlType.Number,
        title: "Fade Out Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    preloaderLogoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
        hidden: ({ enablePreloader }) => !enablePreloader,
    },
    preloaderLogoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 60,
        min: 20,
        max: 100,
        step: 5,
        unit: "px",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    preloaderProgressBarColor: {
        type: ControlType.Color,
        title: "Progress Bar Color",
        defaultValue: "#000000",
        hidden: ({ enablePreloader }) => !enablePreloader,
    },
    preloaderProgressBarBackgroundColor: {
        type: ControlType.Color,
        title: "Progress Bar Background",
        defaultValue: "rgba(0, 0, 0, 0.1)",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    preloaderProgressBarWidth: {
        type: ControlType.Number,
        title: "Progress Bar Width",
        defaultValue: 200,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    frozenUntilScrollEnd: {
        type: ControlType.Boolean,
        title: "Frozen Until Scroll End",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enablePreloader, showAdvancedSettings }) =>
            !enablePreloader || !showAdvancedSettings,
    },
    showCustomText: {
        type: ControlType.Boolean,
        title: "Custom Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showFavoritesBar, showAdvancedSettings, browserVariant }) =>
            !showFavoritesBar ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    customText: {
        type: ControlType.String,
        title: "Custom Text",
        defaultValue: "",
        placeholder: "Favorites",
        hidden: ({ browserVariant, showFavoritesBar, showCustomText }) =>
            browserVariant === "mobile" || !showFavoritesBar || !showCustomText,
    },
    customTextFont: {
        type: ControlType.Font,
        title: "Custom Text Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({
            showFavoritesBar,
            showCustomText,
            showAdvancedSettings,
            browserVariant,
        }) =>
            browserVariant === "mobile" ||
            !showFavoritesBar ||
            !showCustomText ||
            !showAdvancedSettings,
    },
    maxVisibleWebsites: {
        type: ControlType.Number,
        title: "Websites Before Dropdown",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
        hidden: ({ showDropdown, showAdvancedSettings, browserVariant }) =>
            !showDropdown ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    enableAnimatedCursor: {
        type: ControlType.Boolean,
        title: "Animated Cursor",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ browserVariant, showAdvancedSettings }) =>
            browserVariant === "mobile" && !showAdvancedSettings,
    },
    hideMobileCursor: {
        type: ControlType.Boolean,
        title: "Hide Cursor",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "mobile" ||
            !showAdvancedSettings,
    },
    replaceUserCursor: {
        type: ControlType.Boolean,
        title: "Replace User Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableAnimatedCursor, browserVariant }) =>
            !enableAnimatedCursor || browserVariant === "mobile",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 20,
        min: 12,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#000000",
        hidden: ({
            enableAnimatedCursor,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !enableAnimatedCursor ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    slideshowInterval: {
        type: ControlType.Number,
        title: "Slideshow Interval",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ enableAnimatedCursor }) => !enableAnimatedCursor,
    },
    cursorMoveSpeed: {
        type: ControlType.Number,
        title: "Cursor Move Speed",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    cursorClickDuration: {
        type: ControlType.Number,
        title: "Click Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 1,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    mobileCursorDotColor: {
        type: ControlType.Color,
        title: "Mobile Cursor Color",
        defaultValue: undefined,
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
            hideMobileCursor,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "mobile" ||
            !showAdvancedSettings ||
            hideMobileCursor,
    },
    desktopCursorEscapeX: {
        type: ControlType.Number,
        title: "Desktop Escape X",
        defaultValue: -200,
        min: -1000,
        max: 1000,
        step: 10,
        unit: "px",
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "desktop" ||
            !showAdvancedSettings,
    },
    desktopCursorEscapeY: {
        type: ControlType.Number,
        title: "Desktop Escape Y",
        defaultValue: -200,
        min: -1000,
        max: 1000,
        step: 10,
        unit: "px",
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "desktop" ||
            !showAdvancedSettings,
    },
    mobileCursorEscapeX: {
        type: ControlType.Number,
        title: "Mobile Escape X",
        defaultValue: 200,
        min: -1000,
        max: 1000,
        step: 10,
        unit: "px",
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "mobile" ||
            !showAdvancedSettings,
    },
    mobileCursorEscapeY: {
        type: ControlType.Number,
        title: "Mobile Escape Y",
        defaultValue: 200,
        min: -1000,
        max: 1000,
        step: 10,
        unit: "px",
        hidden: ({
            enableAnimatedCursor,
            browserVariant,
            showAdvancedSettings,
        }) =>
            !enableAnimatedCursor ||
            browserVariant !== "mobile" ||
            !showAdvancedSettings,
    },
    waitForScrollEnd: {
        type: ControlType.Boolean,
        title: "Wait For Scroll End",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition Type",
        options: [
            "none",
            "fade",
            "blur",
            "slide",
            "zoom",
            "crossfade",
            "flip",
            "rotate",
            "scale-rotate",
            "blur-zoom",
            "slide-fade",
        ],
        optionTitles: [
            "None",
            "Fade",
            "Blur",
            "Slide",
            "Zoom",
            "Crossfade",
            "Flip",
            "Rotate",
            "Scale-Rotate",
            "Blur-Zoom",
            "Slide-Fade",
        ],
        defaultValue: "none",
        displaySegmentedControl: false,
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimatedCursor, showAdvancedSettings }) =>
            !enableAnimatedCursor || !showAdvancedSettings,
    },
    showTrafficLights: {
        type: ControlType.Boolean,
        title: "Traffic Lights",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    trafficLightSize: {
        type: ControlType.Number,
        title: "Traffic Light Size",
        defaultValue: 12,
        min: 8,
        max: 20,
        step: 1,
        hidden: ({ showTrafficLights, showAdvancedSettings, browserVariant }) =>
            !showTrafficLights ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    trafficLightRedColor: {
        type: ControlType.Color,
        title: "Traffic Light Color Left",
        defaultValue: "#FF5F57",
        hidden: ({ showTrafficLights, browserVariant }) =>
            !showTrafficLights || browserVariant === "mobile",
    },
    trafficLightYellowColor: {
        type: ControlType.Color,
        title: "Traffic Light Color Middle",
        defaultValue: "#FFBD2E",
        hidden: ({ showTrafficLights, browserVariant }) =>
            !showTrafficLights || browserVariant === "mobile",
    },
    trafficLightGreenColor: {
        type: ControlType.Color,
        title: "Traffic Light Color Right",
        defaultValue: "#28CA42",
        hidden: ({ showTrafficLights, browserVariant }) =>
            !showTrafficLights || browserVariant === "mobile",
    },
    showNavArrows: {
        type: ControlType.Boolean,
        title: "Navigation Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    navArrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
        hidden: ({ showNavArrows, showAdvancedSettings, browserVariant }) =>
            !showNavArrows ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    showUrlBar: {
        type: ControlType.Boolean,
        title: "URL Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    urlBarHeight: {
        type: ControlType.Number,
        title: "URL Bar Height",
        defaultValue: 28,
        min: 20,
        max: 48,
        step: 1,
        hidden: ({ showUrlBar, showAdvancedSettings, browserVariant }) =>
            !showUrlBar || !showAdvancedSettings || browserVariant === "mobile",
    },
    urlBarFont: {
        type: ControlType.Font,
        title: "URL Bar Font",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showUrlBar, showAdvancedSettings, browserVariant }) =>
            !showUrlBar || !showAdvancedSettings || browserVariant === "mobile",
    },
    showShareButton: {
        type: ControlType.Boolean,
        title: "Share Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    shareButtonSize: {
        type: ControlType.Number,
        title: "Share Button Size",
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
        hidden: ({ showShareButton, showAdvancedSettings, browserVariant }) =>
            !showShareButton ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    showFavoritesBar: {
        type: ControlType.Boolean,
        title: "Favorites Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    favoritesBarHeight: {
        type: ControlType.Number,
        title: "Favorites Bar Height",
        defaultValue: 36,
        min: 28,
        max: 56,
        step: 1,
        hidden: ({ showFavoritesBar, showAdvancedSettings, browserVariant }) =>
            !showFavoritesBar ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    favoritesFont: {
        type: ControlType.Font,
        title: "Favorites Font",
        defaultValue: {
            fontSize: "12px",
            variant: "Regular",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showFavoritesBar, showAdvancedSettings, browserVariant }) =>
            !showFavoritesBar ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    faviconSize: {
        type: ControlType.Number,
        title: "Favicon Size",
        defaultValue: 16,
        min: 12,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ showFavoritesBar, showAdvancedSettings }) =>
            !showFavoritesBar || !showAdvancedSettings,
    },
    showDropdown: {
        type: ControlType.Boolean,
        title: "Dropdown Menu",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showFavoritesBar, showAdvancedSettings, browserVariant }) =>
            !showFavoritesBar ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    showOneTimeNote: {
        type: ControlType.Boolean,
        title: "One-Time Note",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    interactiveNoteText: {
        type: ControlType.String,
        title: "Note Text",
        defaultValue: "Hover to learn more",
        hidden: ({ showOneTimeNote }) => !showOneTimeNote,
    },
    interactiveNoteFont: {
        type: ControlType.Font,
        title: "Note Font",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({
            enableAnimatedCursor,
            showOneTimeNote,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !enableAnimatedCursor ||
            !showOneTimeNote ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    showTooltips: {
        type: ControlType.Boolean,
        title: "Tooltips",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showFavoritesBar, showAdvancedSettings, browserVariant }) =>
            !showFavoritesBar ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    tooltipFont: {
        type: ControlType.Font,
        title: "Tooltip Font",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({
            showFavoritesBar,
            showTooltips,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !showFavoritesBar ||
            !showTooltips ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    tooltipBackgroundColor: {
        type: ControlType.Color,
        title: "Tooltip Background",
        defaultValue: "rgba(255, 255, 255, 0.12)",
        hidden: ({
            showFavoritesBar,
            showTooltips,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !showFavoritesBar ||
            !showTooltips ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    tooltipTextColor: {
        type: ControlType.Color,
        title: "Tooltip Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({
            showFavoritesBar,
            showTooltips,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !showFavoritesBar ||
            !showTooltips ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    tooltipBorderColor: {
        type: ControlType.Color,
        title: "Tooltip Border",
        defaultValue: "rgba(255, 255, 255, 0.2)",
        hidden: ({
            showFavoritesBar,
            showTooltips,
            showAdvancedSettings,
            browserVariant,
        }) =>
            !showFavoritesBar ||
            !showTooltips ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    showOverlays: {
        type: ControlType.Boolean,
        title: "Overlays",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    hoverDelay: {
        type: ControlType.Number,
        title: "Overlay Hover Delay",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
        hidden: ({ showOverlays, showAdvancedSettings, browserVariant }) =>
            !showOverlays ||
            !showAdvancedSettings ||
            browserVariant === "mobile",
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    headlineColor: {
        type: ControlType.Color,
        title: "Headline Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    sublineFont: {
        type: ControlType.Font,
        title: "Subline Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    sublineColor: {
        type: ControlType.Color,
        title: "Subline Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            variant: "Semibold",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showOverlays, showAdvancedSettings }) =>
            !showOverlays || !showAdvancedSettings,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    barColor: {
        type: ControlType.Color,
        title: "Top Bar Color",
        defaultValue: "#F5F5F5",
        hidden: ({ showAdvancedSettings, browserVariant }) =>
            !showAdvancedSettings || browserVariant === "mobile",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    loadingBarColor: {
        type: ControlType.Color,
        title: "Loading Bar Color",
        defaultValue: "#007AFF",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    loadingBarBackgroundColor: {
        type: ControlType.Color,
        title: "Loading Bar Background",
        defaultValue: "rgba(0, 0, 0, 0.1)",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    enableScrollAnimation: {
        type: ControlType.Boolean,
        title: "Scroll Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ showAdvancedSettings }) => !showAdvancedSettings,
    },
    scrollDistance: {
        type: ControlType.Number,
        title: "Scroll Distance",
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 50,
        unit: "px",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollAnimationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Enable Tilt",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartTiltAngle: {
        type: ControlType.Number,
        title: "Start Tilt Angle",
        defaultValue: 15,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
        hidden: ({ enableScrollAnimation, enableTilt, showAdvancedSettings }) =>
            !enableScrollAnimation || !enableTilt || !showAdvancedSettings,
    },
    scrollEndTiltAngle: {
        type: ControlType.Number,
        title: "End Tilt Angle",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
        hidden: ({ enableScrollAnimation, enableTilt, showAdvancedSettings }) =>
            !enableScrollAnimation || !enableTilt || !showAdvancedSettings,
    },
    enableScale: {
        type: ControlType.Boolean,
        title: "Enable Scale",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 0.85,
        min: 0.1,
        max: 3,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableScale,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableScale || !showAdvancedSettings,
    },
    scrollEndScale: {
        type: ControlType.Number,
        title: "End Scale",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableScale,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableScale || !showAdvancedSettings,
    },
    enableOpacity: {
        type: ControlType.Boolean,
        title: "Enable Opacity",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableOpacity,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableOpacity || !showAdvancedSettings,
    },
    scrollEndOpacity: {
        type: ControlType.Number,
        title: "End Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableOpacity,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableOpacity || !showAdvancedSettings,
    },
    enableBlur: {
        type: ControlType.Boolean,
        title: "Enable Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartBlur: {
        type: ControlType.Number,
        title: "Start Blur",
        defaultValue: 10,
        min: 0,
        max: 20,
        step: 1,
        hidden: ({ enableScrollAnimation, enableBlur, showAdvancedSettings }) =>
            !enableScrollAnimation || !enableBlur || !showAdvancedSettings,
    },
    scrollEndBlur: {
        type: ControlType.Number,
        title: "End Blur",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        hidden: ({ enableScrollAnimation, enableBlur, showAdvancedSettings }) =>
            !enableScrollAnimation || !enableBlur || !showAdvancedSettings,
    },
    enableTranslateX: {
        type: ControlType.Boolean,
        title: "Enable Horizontal Move",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartTranslateX: {
        type: ControlType.Number,
        title: "Start X Position",
        defaultValue: -200,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableTranslateX,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableTranslateX ||
            !showAdvancedSettings,
    },
    scrollEndTranslateX: {
        type: ControlType.Number,
        title: "End X Position",
        defaultValue: 0,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableTranslateX,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableTranslateX ||
            !showAdvancedSettings,
    },
    enableTranslateY: {
        type: ControlType.Boolean,
        title: "Enable Vertical Move",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartTranslateY: {
        type: ControlType.Number,
        title: "Start Y Position",
        defaultValue: 100,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableTranslateY,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableTranslateY ||
            !showAdvancedSettings,
    },
    scrollEndTranslateY: {
        type: ControlType.Number,
        title: "End Y Position",
        defaultValue: 0,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableTranslateY,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableTranslateY ||
            !showAdvancedSettings,
    },
    enableRotateY: {
        type: ControlType.Boolean,
        title: "Enable Y-Axis Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartRotateY: {
        type: ControlType.Number,
        title: "Start Y Rotation",
        defaultValue: -25,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableRotateY,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableRotateY || !showAdvancedSettings,
    },
    scrollEndRotateY: {
        type: ControlType.Number,
        title: "End Y Rotation",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableRotateY,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableRotateY || !showAdvancedSettings,
    },
    enableRotateZ: {
        type: ControlType.Boolean,
        title: "Enable Z-Axis Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    scrollStartRotateZ: {
        type: ControlType.Number,
        title: "Start Z Rotation",
        defaultValue: -5,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableRotateZ,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableRotateZ || !showAdvancedSettings,
    },
    scrollEndRotateZ: {
        type: ControlType.Number,
        title: "End Z Rotation",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableRotateZ,
            showAdvancedSettings,
        }) => !enableScrollAnimation || !enableRotateZ || !showAdvancedSettings,
    },
    enableExitAnimation: {
        type: ControlType.Boolean,
        title: "Enable Exit Animation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
    exitScrollDistance: {
        type: ControlType.Number,
        title: "Exit Scroll Distance",
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 50,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    enableExitTilt: {
        type: ControlType.Boolean,
        title: "Enable Exit Tilt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitTiltAngle: {
        type: ControlType.Number,
        title: "Exit Tilt Angle",
        defaultValue: -15,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitTilt,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitTilt ||
            !showAdvancedSettings,
    },
    enableExitScale: {
        type: ControlType.Boolean,
        title: "Enable Exit Scale",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitScale: {
        type: ControlType.Number,
        title: "Exit Scale",
        defaultValue: 0.85,
        min: 0.1,
        max: 3,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitScale,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitScale ||
            !showAdvancedSettings,
    },
    enableExitOpacity: {
        type: ControlType.Boolean,
        title: "Enable Exit Opacity",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitOpacity: {
        type: ControlType.Number,
        title: "Exit Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitOpacity,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitOpacity ||
            !showAdvancedSettings,
    },
    enableExitBlur: {
        type: ControlType.Boolean,
        title: "Enable Exit Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitBlur: {
        type: ControlType.Number,
        title: "Exit Blur",
        defaultValue: 10,
        min: 0,
        max: 20,
        step: 1,
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitBlur,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitBlur ||
            !showAdvancedSettings,
    },
    enableExitTranslateX: {
        type: ControlType.Boolean,
        title: "Enable Exit Horizontal Move",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitTranslateX: {
        type: ControlType.Number,
        title: "Exit X Position",
        defaultValue: 200,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitTranslateX,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitTranslateX ||
            !showAdvancedSettings,
    },
    enableExitTranslateY: {
        type: ControlType.Boolean,
        title: "Enable Exit Vertical Move",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitTranslateY: {
        type: ControlType.Number,
        title: "Exit Y Position",
        defaultValue: -100,
        min: -2000,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitTranslateY,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitTranslateY ||
            !showAdvancedSettings,
    },
    enableExitRotateY: {
        type: ControlType.Boolean,
        title: "Enable Exit Y-Axis Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitRotateY: {
        type: ControlType.Number,
        title: "Exit Y Rotation",
        defaultValue: 25,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitRotateY,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitRotateY ||
            !showAdvancedSettings,
    },
    enableExitRotateZ: {
        type: ControlType.Boolean,
        title: "Enable Exit Z-Axis Rotation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !showAdvancedSettings,
    },
    exitRotateZ: {
        type: ControlType.Number,
        title: "Exit Z Rotation",
        defaultValue: 5,
        min: -180,
        max: 180,
        step: 5,
        unit: "deg",
        hidden: ({
            enableScrollAnimation,
            enableExitAnimation,
            enableExitRotateZ,
            showAdvancedSettings,
        }) =>
            !enableScrollAnimation ||
            !enableExitAnimation ||
            !enableExitRotateZ ||
            !showAdvancedSettings,
    },
    staticUntilScrollEnd: {
        type: ControlType.Boolean,
        title: "Static Until Scroll End",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableScrollAnimation, showAdvancedSettings }) =>
            !enableScrollAnimation || !showAdvancedSettings,
    },
})
