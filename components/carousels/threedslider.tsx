// 3D curved wrap-around carousel with multi-input control, smart snapping, and customizable 3D properties
import {
    useState,
    useRef,
    useEffect,
    startTransition,
    useMemo,
    useCallback,
    type CSSProperties,
    type MouseEvent,
} from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useMotionValueEvent,
    useMotionTemplate,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const hexToRgba = (color: string, alpha: number): string => {
    if (color.startsWith("#")) {
        let r: number, g: number, b: number
        if (color.length === 7) {
            r = parseInt(color.slice(1, 3), 16)
            g = parseInt(color.slice(3, 5), 16)
            b = parseInt(color.slice(5, 7), 16)
        } else if (color.length === 4) {
            r = parseInt(color[1] + color[1], 16)
            g = parseInt(color[2] + color[2], 16)
            b = parseInt(color[3] + color[3], 16)
        } else {
            return color
        }
        if (isNaN(r) || isNaN(g) || isNaN(b)) return color
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const hslMatch = color.match(
        /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/
    )
    if (hslMatch) {
        const [, h, s, l] = hslMatch
        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`
    }
    const rgbMatch = color.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
    )
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return color
}

interface CarouselItem {
    image: { src: string; alt: string }
    video?: string
    videoUrl?: string
    title: string
    description: string
}

interface CarouselProps {
    items: CarouselItem[]
    cmsItems?: any[]
    useCMS: boolean
    cmsImageField: string
    cmsVideoField: string
    cmsTitleField: string
    cmsDescriptionField: string
    videoAutoPlay: boolean
    videoLoop: boolean
    radiusDepth: number
    verticalDip: number
    visibleCards: number
    cardWidth: number
    cardHeight: number
    enableResponsive: boolean
    mobileBreakpoint: number
    tabletBreakpoint: number
    mobileVisibleCards: number
    tabletVisibleCards: number
    mobileCardWidth: number
    tabletCardWidth: number
    mobileCardHeight: number
    tabletCardHeight: number
    cardBackgroundColor: string
    cardBackgroundOpacity: number
    cardBorderRadius: number
    cardBorderWidth: number
    cardBorderColor: string
    imageHeightPercent: number
    useUnifiedPadding: boolean
    contentPadding: number
    contentPaddingTop: number
    contentPaddingBottom: number
    contentPaddingLeft: number
    contentPaddingRight: number
    showContentOnHover: boolean
    contentAlignment: "left" | "center" | "right"
    contentVerticalAlignment: "top" | "center" | "bottom"
    contentHoverBackgroundColor: string
    contentHoverUseGradient: boolean
    contentHoverGradientColor1: string
    contentHoverGradientColor2: string
    contentHoverGradientDirection: number
    contentHoverBlur: number
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    titleColor: string
    descriptionColor: string
    buttonColor: string
    buttonHoverColor: string
    buttonArrowColor: string
    buttonSize: number
    buttonSideOffset: number
    showDots: boolean
    autoPlay: boolean
    autoPlayInterval: number
    animationStiffness: number
    animationDamping: number
    enableTilt: boolean
    tiltIntensity: number
    tiltSmoothing: number
    removeBackground: boolean
    backgroundColor: string
    backgroundType: "color" | "gradient" | "image"
    gradientPreset: string
    customGradient: string
    useCustomGradient: "preset" | "mixer" | "custom"
    gradientMixerColor1: string
    gradientMixerColor2: string
    gradientMixerAngle: number
    gradientMixerColor1Position: number
    gradientMixerColor2Position: number
    backgroundImage: { src: string; alt: string }
    backgroundImageFit: "cover" | "contain" | "fill"
    backgroundImageOpacity: number
    enableDepthOfField: boolean
    depthOfFieldIntensity: number
    dynamicShadowDepth: number
    enableGlowCursor: boolean
    glowColor: string
    glowColorSecondary: string
    glowUseGradient: boolean
    glowSize: number
    glowIntensity: number
    glowBorderWidth: number
    glowSmooth: number
    glowRadius: number
    glowOnlyOnHover: boolean
    glowLoopAnimation: boolean
    glowLoopSpeed: number
    glowLoopRadius: number
    style?: CSSProperties
}

/**
 * 3D Curved Wrap-Around Carousel
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ThreeDSlider(props: CarouselProps) {
    const {
        items = [],
        cmsItems = [],
        useCMS = false,
        cmsImageField = "image",
        cmsVideoField = "video",
        cmsTitleField = "title",
        cmsDescriptionField = "description",
        videoAutoPlay = true,
        videoLoop = true,
        radiusDepth = 400,
        verticalDip = 30,
        autoPlay = false,
        autoPlayInterval = 3,
        cardWidth = 350,
        cardHeight = 450,
        enableResponsive = false,
        mobileBreakpoint = 768,
        tabletBreakpoint = 1024,
        mobileVisibleCards = 3,
        tabletVisibleCards = 5,
        mobileCardWidth = 250,
        tabletCardWidth = 300,
        mobileCardHeight = 350,
        tabletCardHeight = 400,
        removeBackground = false,
        backgroundColor = "#0a0a0a",
        backgroundType = "color",
        gradientPreset = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        customGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        useCustomGradient = "preset",
        gradientMixerColor1 = "#667eea",
        gradientMixerColor2 = "#764ba2",
        gradientMixerAngle = 135,
        gradientMixerColor1Position = 0,
        gradientMixerColor2Position = 100,
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Background image",
        },
        backgroundImageFit = "cover",
        backgroundImageOpacity = 0.3,
        titleFont = {},
        descriptionFont = {},
        titleColor = "#000000",
        descriptionColor = "#666666",
        buttonColor = "#ffffff",
        buttonHoverColor = "#f0f0f0",
        buttonArrowColor = "#000000",
        buttonSize = 50,
        buttonSideOffset = 30,
        showDots = true,
        cardBackgroundColor = "#FFFFFF",
        cardBorderRadius = 16,
        cardBorderWidth = 0,
        cardBorderColor = "#EEEEEE",
        imageHeightPercent = 70,
        useUnifiedPadding = true,
        contentPadding = 20,
        contentPaddingTop = 20,
        contentPaddingBottom = 20,
        contentPaddingLeft = 20,
        contentPaddingRight = 20,
        showContentOnHover = false,
        contentAlignment = "left",
        contentVerticalAlignment = "top",
        contentHoverBackgroundColor = "rgba(0, 0, 0, 0.7)",
        contentHoverUseGradient = false,
        contentHoverGradientColor1 = "rgba(0, 0, 0, 0.9)",
        contentHoverGradientColor2 = "rgba(0, 0, 0, 0.3)",
        contentHoverGradientDirection = 180,
        contentHoverBlur = 10,
        cardBackgroundOpacity = 1,
        visibleCards = 5,
        animationStiffness = 200,
        animationDamping = 25,
        enableTilt = false,
        tiltIntensity = 15,
        tiltSmoothing = 150,
        enableDepthOfField = false,
        depthOfFieldIntensity = 5,
        dynamicShadowDepth = 1,
        enableGlowCursor = false,
        glowColor = "#0099FF",
        glowColorSecondary = "#8855FF",
        glowUseGradient = false,
        glowSize = 150,
        glowIntensity = 0.8,
        glowBorderWidth = 2,
        glowSmooth = 0.15,
        glowRadius = 16,
        glowOnlyOnHover = true,
        glowLoopAnimation = false,
        glowLoopSpeed = 2,
        glowLoopRadius = 20,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const autoPlayTimerRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)

    const [isTouchDevice, setIsTouchDevice] = useState(() => {
        if (typeof window === "undefined") return false
        return "ontouchstart" in window || navigator.maxTouchPoints > 0
    })

    useEffect(() => {
        if (typeof window === "undefined") return
        const hasTouch =
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            (window.matchMedia &&
                window.matchMedia("(pointer: coarse)").matches)
        startTransition(() => setIsTouchDevice(hasTouch))
    }, [])

    // Tracks whether the carousel is currently visible in the viewport.
    // Used to pause the glow loop animation (and avoid wasted RAF/CPU work)
    // when the component is scrolled out of view, and resume it when it
    // scrolls back in.
    const [isCarouselInView, setIsCarouselInView] = useState(true)

    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !containerRef.current)
            return
        if (typeof IntersectionObserver === "undefined") return
        const el = containerRef.current
        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => setIsCarouselInView(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    const [isGlowHovered, setIsGlowHovered] = useState(false)
    const [glowHoveredCardIndex, setGlowHoveredCardIndex] = useState<
        number | null
    >(null)
    const glowTargetX = useMotionValue(50)
    const glowTargetY = useMotionValue(50)
    const glowTargetOpacity = useMotionValue(0)

    // Position spring — stiffness/damping controlled by the Smoothness panel prop
    const glowSpringConfig = useMemo(
        () => ({
            stiffness: (1 - glowSmooth) * 400 + 50,
            damping: (1 - glowSmooth) * 30 + 10,
        }),
        [glowSmooth]
    )
    const glowSmoothX = useSpring(glowTargetX, glowSpringConfig)
    const glowSmoothY = useSpring(glowTargetY, glowSpringConfig)
    // FIX 1: Opacity uses its own fast spring, independent of the Smoothness
    // slider. Sharing glowSpringConfig made fade-in/out sluggish at low smoothness.
    const glowSmoothOpacity = useSpring(glowTargetOpacity, {
        stiffness: 280,
        damping: 28,
    })
    const glowXVar = useMotionTemplate`${glowSmoothX}%`
    const glowYVar = useMotionTemplate`${glowSmoothY}%`

    useEffect(() => {
        if (isStatic) return
        glowTargetOpacity.set(
            enableGlowCursor &&
                !isTouchDevice &&
                glowHoveredCardIndex !== null &&
                (!glowOnlyOnHover || isGlowHovered)
                ? 1
                : 0
        )
    }, [
        enableGlowCursor,
        glowOnlyOnHover,
        isGlowHovered,
        glowHoveredCardIndex,
        isStatic,
        isTouchDevice,
        glowTargetOpacity,
    ])

    const isGlowActive =
        !isStatic &&
        enableGlowCursor &&
        !isTouchDevice &&
        glowHoveredCardIndex !== null &&
        (!glowOnlyOnHover || isGlowHovered)

    // Glow loop animation: only runs while the carousel is in the viewport.
    // When isCarouselInView flips to false the effect cleanup cancels the
    // RAF loop; when it flips back to true the effect re-runs and restarts it.
    useEffect(() => {
        if (
            !isGlowActive ||
            !glowLoopAnimation ||
            !isCarouselInView ||
            typeof window === "undefined"
        )
            return
        let rafId: number | null = null
        const start = performance.now()
        const tick = (now: number) => {
            const elapsed = (now - start) / 1000
            const period = Math.max(0.2, glowLoopSpeed)
            const phase = (elapsed / period) * Math.PI * 2
            const r = Math.max(0, Math.min(45, glowLoopRadius))
            glowTargetX.set(50 + Math.cos(phase) * r)
            glowTargetY.set(50 + Math.sin(phase) * r)
            rafId = window.requestAnimationFrame(tick)
        }
        rafId = window.requestAnimationFrame(tick)
        return () => {
            if (rafId !== null) window.cancelAnimationFrame(rafId)
        }
    }, [
        glowLoopAnimation,
        glowLoopSpeed,
        glowLoopRadius,
        glowTargetX,
        glowTargetY,
        isGlowActive,
        isCarouselInView,
    ])

    const glowPosVars = useMemo(
        () =>
            ({
                "--glowX": glowXVar,
                "--glowY": glowYVar,
            }) as unknown as CSSProperties,
        [glowXVar, glowYVar]
    )

    const handleGlowMouseMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (
                isStatic ||
                !enableGlowCursor ||
                isTouchDevice ||
                glowLoopAnimation
            )
                return
            const rect = e.currentTarget.getBoundingClientRect()
            glowTargetX.set(((e.clientX - rect.left) / rect.width) * 100)
            glowTargetY.set(((e.clientY - rect.top) / rect.height) * 100)
        },
        [
            enableGlowCursor,
            glowTargetX,
            glowTargetY,
            isStatic,
            isTouchDevice,
            glowLoopAnimation,
        ]
    )

    const handleGlowMouseEnter = useCallback(
        (e: MouseEvent<HTMLDivElement>, index: number) => {
            if (isStatic || !enableGlowCursor || isTouchDevice) return
            startTransition(() => {
                setIsGlowHovered(true)
                setGlowHoveredCardIndex(index)
            })
            if (glowLoopAnimation) return
            const rect = e.currentTarget.getBoundingClientRect()
            glowTargetX.set(((e.clientX - rect.left) / rect.width) * 100)
            glowTargetY.set(((e.clientY - rect.top) / rect.height) * 100)
        },
        [
            enableGlowCursor,
            glowTargetX,
            glowTargetY,
            isStatic,
            isTouchDevice,
            glowLoopAnimation,
        ]
    )

    const handleGlowMouseLeave = useCallback((index: number) => {
        startTransition(() => {
            setIsGlowHovered(false)
            setGlowHoveredCardIndex((prev) => (prev === index ? null : prev))
        })
    }, [])

    const touchStartX = useRef(0)
    const touchStartY = useRef(0)
    const isDragging = useRef(false)

    const [containerWidth, setContainerWidth] = useState(() =>
        typeof window === "undefined" ? 1200 : window.innerWidth
    )
    const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(
        null
    )

    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !containerRef.current)
            return
        const el = containerRef.current
        const update = () => {
            const width = el.getBoundingClientRect().width
            if (!Number.isFinite(width) || width <= 0) return
            startTransition(() => setContainerWidth(width))
        }
        update()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => update())
            ro.observe(el)
        } else {
            window.addEventListener("resize", update)
        }
        return () => {
            if (ro) ro.disconnect()
            else window.removeEventListener("resize", update)
        }
    }, [isStatic])

    const tiltX = useMotionValue(0)
    const tiltY = useMotionValue(0)
    const smoothTiltX = useSpring(tiltX, {
        stiffness: tiltSmoothing,
        damping: 30,
        mass: 0.5,
    })
    const smoothTiltY = useSpring(tiltY, {
        stiffness: tiltSmoothing,
        damping: 30,
        mass: 0.5,
    })
    const [cardTiltX, setCardTiltX] = useState(0)
    const [cardTiltY, setCardTiltY] = useState(0)

    useMotionValueEvent(smoothTiltX, "change", (latest) => {
        if (enableTilt) startTransition(() => setCardTiltX(latest))
    })
    useMotionValueEvent(smoothTiltY, "change", (latest) => {
        if (enableTilt) startTransition(() => setCardTiltY(latest))
    })

    // FIX 3: Reset tilt angles when enableTilt is turned off so cards don't
    // freeze at a stale non-zero rotation after the prop is toggled.
    useEffect(() => {
        if (!enableTilt) {
            tiltX.set(0)
            tiltY.set(0)
            startTransition(() => {
                setCardTiltX(0)
                setCardTiltY(0)
            })
        }
    }, [enableTilt, tiltX, tiltY])

    // FIX 1: glowColor / glowColorSecondary removed from deps — unrelated to item data.
    const activeItems = useMemo(() => {
        const filteredCmsItems = (cmsItems || []).filter(Boolean)
        if (useCMS && filteredCmsItems.length > 0) {
            return filteredCmsItems.map((item, index) => {
                if (item && typeof item === "object" && item.props) {
                    return {
                        component: item,
                        image: item.props[cmsImageField] || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: `CMS Item ${index + 1}`,
                        },
                        video: item.props[cmsVideoField] || undefined,
                        title: item.props[cmsTitleField] || `Item ${index + 1}`,
                        description:
                            item.props[cmsDescriptionField] || "CMS content",
                        isCMSComponent: true,
                    }
                }
                return {
                    component: item,
                    image: {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: `CMS Item ${index + 1}`,
                    },
                    video: undefined,
                    title: `Item ${index + 1}`,
                    description: "CMS content",
                    isCMSComponent: true,
                }
            })
        }
        return items.map((item, index) => ({
            image: item?.image?.src
                ? item.image
                : {
                      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                      alt: `Item ${index + 1}`,
                  },
            // Uploaded file takes priority; fall back to pasted URL if no file is set
            video: item?.video || item?.videoUrl || undefined,
            title: item?.title || `Item ${index + 1}`,
            description: item?.description || "Description",
            isCMSComponent: false,
        }))
    }, [
        useCMS,
        cmsItems,
        items,
        cmsImageField,
        cmsVideoField,
        cmsTitleField,
        cmsDescriptionField,
    ])

    const totalItems = activeItems.length

    const responsiveValues = useMemo(() => {
        if (!enableResponsive) return { visibleCards, cardWidth, cardHeight }
        if (containerWidth < mobileBreakpoint)
            return {
                visibleCards: mobileVisibleCards,
                cardWidth: mobileCardWidth,
                cardHeight: mobileCardHeight,
            }
        if (containerWidth < tabletBreakpoint)
            return {
                visibleCards: tabletVisibleCards,
                cardWidth: tabletCardWidth,
                cardHeight: tabletCardHeight,
            }
        return { visibleCards, cardWidth, cardHeight }
    }, [
        enableResponsive,
        containerWidth,
        mobileBreakpoint,
        tabletBreakpoint,
        visibleCards,
        cardWidth,
        cardHeight,
        mobileVisibleCards,
        tabletVisibleCards,
        mobileCardWidth,
        tabletCardWidth,
        mobileCardHeight,
        tabletCardHeight,
    ])

    const activeVisibleCards = responsiveValues.visibleCards
    const activeCardWidth = responsiveValues.cardWidth
    const activeCardHeight = responsiveValues.cardHeight

    const isMobileView = containerWidth < mobileBreakpoint
    const isTabletView =
        containerWidth >= mobileBreakpoint && containerWidth < tabletBreakpoint
    const isVerySmallScreen = containerWidth <= 320
    const isSmallMobile = containerWidth <= 480

    const activeButtonSize = isVerySmallScreen
        ? buttonSize * 0.6
        : isSmallMobile
          ? buttonSize * 0.65
          : isMobileView
            ? buttonSize * 0.7
            : isTabletView
              ? buttonSize * 0.85
              : buttonSize
    const activeButtonSideOffset = isVerySmallScreen
        ? Math.max(5, buttonSideOffset * 0.5)
        : isSmallMobile
          ? Math.max(8, buttonSideOffset * 0.6)
          : isMobileView
            ? Math.max(10, buttonSideOffset * 0.7)
            : isTabletView
              ? buttonSideOffset * 0.85
              : buttonSideOffset
    const activeDotSize = isVerySmallScreen
        ? 5
        : isSmallMobile
          ? 5.5
          : isMobileView
            ? 6
            : 8
    const activeDotActiveWidth = isVerySmallScreen
        ? 18
        : isSmallMobile
          ? 20
          : isMobileView
            ? 24
            : 32
    const activeDotHoverWidth = isVerySmallScreen
        ? 10
        : isSmallMobile
          ? 11
          : isMobileView
            ? 12
            : 16

    const horizontalSpread = useMemo(() => {
        if (containerWidth <= 320) return Math.max(600, activeCardWidth * 2.2)
        if (containerWidth <= 480) return Math.max(700, activeCardWidth * 2.3)
        if (containerWidth < mobileBreakpoint)
            return Math.max(750, activeCardWidth * 2.4)
        return Math.max(800, activeCardWidth * 2.5)
    }, [activeCardWidth, containerWidth, mobileBreakpoint])

    const handleMouseMove = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!enableTilt) return
            const rect = event.currentTarget.getBoundingClientRect()
            const x =
                (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
            const y =
                (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
            startTransition(() => {
                tiltX.set(y * tiltIntensity)
                tiltY.set(-x * tiltIntensity)
            })
        },
        [enableTilt, tiltX, tiltY, tiltIntensity]
    )

    const handleMouseLeave = useCallback(() => {
        if (!enableTilt) return
        startTransition(() => {
            tiltX.set(0)
            tiltY.set(0)
        })
    }, [enableTilt, tiltX, tiltY])

    const handleTouchStart = useCallback(
        (e: React.TouchEvent | React.MouseEvent) => {
            if (isStatic) return
            const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
            const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
            touchStartX.current = clientX
            touchStartY.current = clientY
            isDragging.current = true
        },
        [isStatic]
    )

    // FIX 2: Navigation uses functional setState so currentIndex is never
    // a dependency and goToPrevious/goToNext are stable across renders.
    const goToPrevious = useCallback(() => {
        if (totalItems <= 1) return
        startTransition(() =>
            setCurrentIndex(
                (prev) => (((prev - 1) % totalItems) + totalItems) % totalItems
            )
        )
    }, [totalItems])

    const goToNext = useCallback(() => {
        if (totalItems <= 1) return
        startTransition(() =>
            setCurrentIndex((prev) => (prev + 1) % totalItems)
        )
    }, [totalItems])

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent | React.MouseEvent) => {
            if (!isDragging.current || isStatic) return
            const clientX =
                "changedTouches" in e
                    ? e.changedTouches[0].clientX
                    : "clientX" in e
                      ? e.clientX
                      : touchStartX.current
            const clientY =
                "changedTouches" in e
                    ? e.changedTouches[0].clientY
                    : "clientY" in e
                      ? e.clientY
                      : touchStartY.current
            const deltaX = clientX - touchStartX.current
            const deltaY = clientY - touchStartY.current
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) goToPrevious()
                else goToNext()
            }
            isDragging.current = false
        },
        [isStatic, goToPrevious, goToNext]
    )

    // FIX 6: Non-passive native touchmove listener so e.preventDefault()
    // actually suppresses browser scroll on horizontal swipes. React's
    // synthetic onTouchMove cannot opt out of passive mode.
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const onTouchMove = (e: TouchEvent) => {
            if (!isDragging.current) return
            const touch = e.touches[0]
            const deltaX = Math.abs(touch.clientX - touchStartX.current)
            const deltaY = Math.abs(touch.clientY - touchStartY.current)
            if (deltaX > deltaY && deltaX > 10) e.preventDefault()
        }
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        return () => el.removeEventListener("touchmove", onTouchMove)
    }, [isStatic])

    const getCardTransform = useCallback(
        (position: number, tX: number = 0, tY: number = 0) => {
            const normalizedPos = position / Math.max(activeVisibleCards, 1)
            const angle = normalizedPos * Math.PI * 0.5
            const x = Math.sin(angle) * horizontalSpread
            const y = Math.abs(position) * verticalDip
            const isNarrowScreen = containerWidth <= 320
            const isSmallScreen = containerWidth <= 480
            const isMediumScreen = containerWidth <= 768
            let responsiveRadiusDepth: number
            if (isNarrowScreen) responsiveRadiusDepth = radiusDepth * 2.2
            else if (isSmallScreen) responsiveRadiusDepth = radiusDepth * 1.8
            else if (isMediumScreen) responsiveRadiusDepth = radiusDepth * 1.4
            else responsiveRadiusDepth = radiusDepth
            let baseZ: number,
                depthMultiplier: number,
                scale: number,
                rotateY: number
            if (isNarrowScreen) {
                baseZ =
                    -Math.abs(Math.cos(angle) - 1) * responsiveRadiusDepth * 0.9
                depthMultiplier =
                    Math.abs(position) * responsiveRadiusDepth * 0.55
                scale = Math.max(0.25, 1 - Math.abs(position) * 0.32)
                rotateY = angle * 65
            } else if (isSmallScreen) {
                baseZ =
                    -Math.abs(Math.cos(angle) - 1) *
                    responsiveRadiusDepth *
                    0.85
                depthMultiplier =
                    Math.abs(position) * responsiveRadiusDepth * 0.5
                scale = Math.max(0.3, 1 - Math.abs(position) * 0.28)
                rotateY = angle * 55
            } else if (isMediumScreen) {
                baseZ =
                    -Math.abs(Math.cos(angle) - 1) * responsiveRadiusDepth * 0.8
                depthMultiplier =
                    Math.abs(position) * responsiveRadiusDepth * 0.45
                scale = Math.max(0.35, 1 - Math.abs(position) * 0.22)
                rotateY = angle * 48
            } else {
                baseZ = -Math.abs(Math.cos(angle) - 1) * responsiveRadiusDepth
                depthMultiplier =
                    Math.abs(position) * responsiveRadiusDepth * 0.5
                scale = Math.max(0.4, 1 - Math.abs(position) * 0.18)
                rotateY = angle * 40
            }
            const z = baseZ - depthMultiplier
            const opacity = Math.max(0.3, 1 - Math.abs(position) * 0.3)
            const zIndex = Math.round(10000 + z * 10)
            const blurAmount = enableDepthOfField
                ? Math.abs(position) * depthOfFieldIntensity
                : 0
            const shadowDistance = Math.abs(z) / responsiveRadiusDepth
            let shadowBlur: number, shadowSpread: number, shadowOpacity: number
            if (isNarrowScreen) {
                shadowBlur = 55 + shadowDistance * 90 * dynamicShadowDepth
                shadowSpread = 22 + shadowDistance * 45 * dynamicShadowDepth
                shadowOpacity =
                    0.28 + shadowDistance * 0.45 * dynamicShadowDepth
            } else if (isSmallScreen) {
                shadowBlur = 45 + shadowDistance * 75 * dynamicShadowDepth
                shadowSpread = 18 + shadowDistance * 35 * dynamicShadowDepth
                shadowOpacity =
                    0.23 + shadowDistance * 0.35 * dynamicShadowDepth
            } else if (isMediumScreen) {
                shadowBlur = 35 + shadowDistance * 60 * dynamicShadowDepth
                shadowSpread = 12 + shadowDistance * 25 * dynamicShadowDepth
                shadowOpacity =
                    0.18 + shadowDistance * 0.28 * dynamicShadowDepth
            } else {
                shadowBlur = 30 + shadowDistance * 50 * dynamicShadowDepth
                shadowSpread = 10 + shadowDistance * 20 * dynamicShadowDepth
                shadowOpacity =
                    0.15 + shadowDistance * 0.25 * dynamicShadowDepth
            }
            const depthFactor = Math.abs(z) / responsiveRadiusDepth
            const rotateX = enableTilt ? tX * (1 + depthFactor * 0.5) : 0
            const rotateYWithTilt =
                rotateY + (enableTilt ? tY * (1 + depthFactor * 0.5) : 0)
            return {
                x,
                y,
                z,
                scale,
                rotateY: rotateYWithTilt,
                rotateX,
                opacity,
                zIndex,
                blurAmount,
                shadowBlur,
                shadowSpread,
                shadowOpacity,
            }
        },
        [
            radiusDepth,
            verticalDip,
            activeVisibleCards,
            horizontalSpread,
            enableDepthOfField,
            depthOfFieldIntensity,
            dynamicShadowDepth,
            enableTilt,
            containerWidth,
        ]
    )

    const handleCardClick = useCallback(
        (index: number) => {
            if (index !== currentIndex) {
                startTransition(() => setCurrentIndex(index))
            } else if (isTouchDevice && showContentOnHover) {
                startTransition(() =>
                    setHoveredCardIndex((prev) =>
                        prev === index ? null : index
                    )
                )
            }
        },
        [currentIndex, isTouchDevice, showContentOnHover]
    )

    // FIX 2: autoPlay timer uses functional setState — currentIndex is no longer
    // a dependency, so the interval is not recreated on every slide change.
    useEffect(() => {
        if (isStatic || !autoPlay || totalItems === 0) {
            if (autoPlayTimerRef.current !== null) {
                clearInterval(autoPlayTimerRef.current)
                autoPlayTimerRef.current = null
            }
            return
        }
        const timerId = setInterval(() => {
            startTransition(() =>
                setCurrentIndex((prev) => (prev + 1) % totalItems)
            )
        }, autoPlayInterval * 1000)
        autoPlayTimerRef.current = timerId as unknown as number
        return () => {
            clearInterval(timerId)
        }
    }, [autoPlay, autoPlayInterval, totalItems, isStatic])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault()
                goToPrevious()
            } else if (event.key === "ArrowRight") {
                event.preventDefault()
                goToNext()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [goToPrevious, goToNext, isStatic])

    const backgroundStyle = useMemo((): CSSProperties => {
        if (removeBackground) return { backgroundColor: "transparent" }
        switch (backgroundType) {
            case "gradient": {
                let gradient: string
                if (useCustomGradient === "mixer")
                    gradient = `linear-gradient(${gradientMixerAngle}deg, ${gradientMixerColor1} ${gradientMixerColor1Position}%, ${gradientMixerColor2} ${gradientMixerColor2Position}%)`
                else if (useCustomGradient === "custom")
                    gradient = customGradient
                else gradient = gradientPreset
                return { background: gradient }
            }
            case "image":
                return {
                    backgroundImage: `url(${backgroundImage?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"})`,
                    backgroundSize: backgroundImageFit,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    position: "relative",
                }
            default:
                return { backgroundColor }
        }
    }, [
        removeBackground,
        backgroundType,
        gradientPreset,
        customGradient,
        useCustomGradient,
        gradientMixerColor1,
        gradientMixerColor2,
        gradientMixerAngle,
        gradientMixerColor1Position,
        gradientMixerColor2Position,
        backgroundImage,
        backgroundImageFit,
        backgroundColor,
    ])

    const visibleItems = useMemo(() => {
        if (totalItems === 0) return []
        const maxVisible = Math.ceil(activeVisibleCards / 2)
        return activeItems
            .map((item, index) => {
                let position = index - currentIndex
                if (position > totalItems / 2) position -= totalItems
                else if (position < -totalItems / 2) position += totalItems
                if (Math.abs(position) > maxVisible) return null
                return { item, index, position }
            })
            .filter(Boolean) as { item: any; index: number; position: number }[]
    }, [activeItems, currentIndex, totalItems, activeVisibleCards])

    // springConfig drives card position/scale/rotation transitions so that the
    // Stiffness and Damping props in the panel are actually applied.
    const springConfig = useMemo(
        () => ({
            type: "spring" as const,
            stiffness: animationStiffness,
            damping: animationDamping,
            mass: 0.8,
            restDelta: 0.001,
            restSpeed: 0.001,
        }),
        [animationStiffness, animationDamping]
    )

    // FIX 2 (glow): Memoize the glow background values once instead of
    // recomputing them on every render for every card inside the map loop.
    const cardPrimaryGlowRgba = useMemo(
        () => hexToRgba(glowColor, glowIntensity),
        [glowColor, glowIntensity]
    )
    const cardSecondaryGlowRgba = useMemo(
        () => hexToRgba(glowColorSecondary, glowIntensity),
        [glowColorSecondary, glowIntensity]
    )
    const cardGlowBackground = useMemo(
        () =>
            `radial-gradient(circle ${glowSize * 1.5}px at var(--glowX) var(--glowY), ${
                glowUseGradient
                    ? `${cardPrimaryGlowRgba} 0%, ${cardSecondaryGlowRgba} 20%, transparent 70%`
                    : `${cardPrimaryGlowRgba} 0%, transparent 60%`
            })`,
        [glowSize, glowUseGradient, cardPrimaryGlowRgba, cardSecondaryGlowRgba]
    )

    const actualPaddingTop = useUnifiedPadding
        ? contentPadding
        : contentPaddingTop
    const actualPaddingBottom = useUnifiedPadding
        ? contentPadding
        : contentPaddingBottom
    const actualPaddingLeft = useUnifiedPadding
        ? contentPadding
        : contentPaddingLeft
    const actualPaddingRight = useUnifiedPadding
        ? contentPadding
        : contentPaddingRight
    const safePaddingTop = Math.max(0, Number(actualPaddingTop) || 0)
    const safePaddingBottom = Math.max(0, Number(actualPaddingBottom) || 0)
    const safePaddingLeft = Math.max(0, Number(actualPaddingLeft) || 0)
    const safePaddingRight = Math.max(0, Number(actualPaddingRight) || 0)

    if (totalItems === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    ...backgroundStyle,
                    color: "#ffffff",
                    fontSize: 18,
                    fontWeight: 500,
                    gap: 20,
                    padding: 40,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    Add items to display the carousel
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                ...backgroundStyle,
                perspective: 3000,
                perspectiveOrigin: "50% 50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "pan-y",
            }}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
            onTouchStart={isStatic ? undefined : handleTouchStart}
            onTouchEnd={isStatic ? undefined : handleTouchEnd}
            onMouseDown={isStatic ? undefined : handleTouchStart}
            onMouseUp={isStatic ? undefined : handleTouchEnd}
            role="region"
            aria-label="3D Carousel"
            aria-roledescription="carousel"
            aria-live="polite"
        >
            {backgroundType === "image" &&
                backgroundImageOpacity < 1 &&
                !removeBackground && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: `rgba(0, 0, 0, ${1 - backgroundImageOpacity})`,
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}

            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    isolation: "isolate",
                }}
            >
                {visibleItems.map((visibleItem) => {
                    const { item, index, position } = visibleItem
                    const isCenter = index === currentIndex
                    // FIX 4: Added !isStatic guard to match every other interaction condition.
                    const shouldShowCardGlow =
                        !isStatic &&
                        enableGlowCursor &&
                        !isTouchDevice &&
                        glowHoveredCardIndex === index
                    const transform = getCardTransform(
                        position,
                        cardTiltX,
                        cardTiltY
                    )

                    const glowLayer = shouldShowCardGlow ? (
                        <motion.div
                            aria-hidden="true"
                            style={{
                                ...glowPosVars,
                                position: "absolute",
                                inset: 0,
                                borderRadius: glowRadius,
                                // FIX 3: Clamp to min 1px so the XOR mask never
                                // cancels itself out at glowBorderWidth = 0.
                                padding: Math.max(1, glowBorderWidth),
                                background: cardGlowBackground,
                                WebkitMask:
                                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                WebkitMaskComposite: "xor",
                                maskComposite: "exclude",
                                pointerEvents: "none",
                                zIndex: 100,
                                opacity: glowSmoothOpacity,
                                willChange: "transform, opacity",
                                WebkitBackfaceVisibility: "hidden",
                                backfaceVisibility: "hidden",
                                transform: "translateZ(0)",
                                transformStyle: "preserve-3d",
                            }}
                        />
                    ) : null

                    return (
                        <motion.div
                            key={index}
                            onClick={() => handleCardClick(index)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    handleCardClick(index)
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Slide ${index + 1}: ${item.title}`}
                            aria-current={isCenter ? "true" : "false"}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: activeCardWidth,
                                height: activeCardHeight,
                                marginLeft: -activeCardWidth / 2,
                                marginTop: -activeCardHeight / 2,
                                transformStyle: "preserve-3d",
                                cursor: isCenter ? "default" : "pointer",
                                zIndex: transform.zIndex,
                                isolation: "isolate",
                                willChange: "transform, opacity",
                                filter: `blur(${transform.blurAmount}px)`,
                                outline: "none",
                                backfaceVisibility: "visible",
                            }}
                            animate={{
                                x: transform.x,
                                y: transform.y,
                                z: transform.z,
                                scale: transform.scale,
                                rotateY: transform.rotateY,
                                rotateX: transform.rotateX,
                                opacity: transform.opacity,
                            }}
                            // FIX 7: Use springConfig so animationStiffness / animationDamping
                            // props actually drive card transitions instead of being ignored.
                            transition={springConfig}
                        >
                            {item.isCMSComponent ? (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: cardBorderRadius,
                                        overflow: "hidden",
                                        border:
                                            cardBorderWidth > 0
                                                ? `${cardBorderWidth}px solid ${cardBorderColor}`
                                                : "none",
                                        boxShadow: `0 ${transform.shadowSpread}px ${transform.shadowBlur}px rgba(0,0,0,${transform.shadowOpacity})`,
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        outline: "3px solid transparent",
                                        outlineOffset: "4px",
                                        transition: "outline-color 0.2s ease",
                                        position: "relative",
                                    }}
                                    className="carousel-card-focus"
                                    onMouseMove={
                                        shouldShowCardGlow && !isStatic
                                            ? handleGlowMouseMove
                                            : undefined
                                    }
                                    onMouseEnter={
                                        !isStatic
                                            ? (e) =>
                                                  handleGlowMouseEnter(e, index)
                                            : undefined
                                    }
                                    onMouseLeave={
                                        !isStatic
                                            ? () => handleGlowMouseLeave(index)
                                            : undefined
                                    }
                                >
                                    {glowLayer}
                                    {item.component}
                                </div>
                            ) : (
                                // FIX 4: opacity is now baked into backgroundColor via hexToRgba so
                                // that child elements (image, text) are not made semi-transparent too.
                                <motion.div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: cardBorderRadius,
                                        overflow: "hidden",
                                        backgroundColor: hexToRgba(
                                            cardBackgroundColor,
                                            cardBackgroundOpacity
                                        ),
                                        display: "flex",
                                        flexDirection: "column",
                                        pointerEvents: "auto",
                                        boxShadow: `0 ${Math.round(transform.shadowSpread)}px ${Math.round(transform.shadowBlur)}px rgba(0,0,0,${transform.shadowOpacity.toFixed(2)})`,
                                        position: "relative",
                                        isolation: "isolate",
                                        WebkitTransformStyle: "preserve-3d",
                                        transformStyle: "preserve-3d",
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: `0 ${Math.round(transform.shadowSpread * 1.5)}px ${Math.round(transform.shadowBlur * 1.5)}px rgba(0,0,0,${Math.min(transform.shadowOpacity * 1.5, 0.6).toFixed(2)})`,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                    onMouseMove={
                                        shouldShowCardGlow && !isStatic
                                            ? handleGlowMouseMove
                                            : undefined
                                    }
                                    onMouseEnter={(e) => {
                                        if (!isStatic)
                                            handleGlowMouseEnter(e, index)
                                        if (
                                            showContentOnHover &&
                                            !isTouchDevice
                                        )
                                            startTransition(() =>
                                                setHoveredCardIndex(index)
                                            )
                                    }}
                                    onMouseLeave={() => {
                                        if (!isStatic)
                                            handleGlowMouseLeave(index)
                                        if (
                                            showContentOnHover &&
                                            !isTouchDevice
                                        )
                                            startTransition(() =>
                                                setHoveredCardIndex(null)
                                            )
                                    }}
                                    className="carousel-card-focus"
                                >
                                    {glowLayer}

                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            borderRadius: cardBorderRadius,
                                            pointerEvents: "none",
                                            zIndex: 10,
                                            boxShadow:
                                                "inset 0 0 0 1px rgba(255, 255, 255, 0.18)",
                                            WebkitBackfaceVisibility: "hidden",
                                            backfaceVisibility: "hidden",
                                            transform: "translateZ(0)",
                                        }}
                                        aria-hidden="true"
                                    />

                                    {item.video ? (
                                        <motion.div
                                            style={{
                                                width: "100%",
                                                height: showContentOnHover
                                                    ? "100%"
                                                    : `${imageHeightPercent}%`,
                                                position: showContentOnHover
                                                    ? "absolute"
                                                    : "relative",
                                                top: 0,
                                                left: 0,
                                                overflow: "hidden",
                                                willChange: "transform",
                                                backfaceVisibility: "hidden",
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 35,
                                                mass: 0.8,
                                            }}
                                        >
                                            <video
                                                src={item.video}
                                                autoPlay={videoAutoPlay}
                                                loop={videoLoop}
                                                muted
                                                playsInline
                                                preload="auto"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    willChange: "transform",
                                                    backfaceVisibility:
                                                        "hidden",
                                                    transform:
                                                        "translate3d(0, 0, 0)",
                                                }}
                                                aria-label={`Video for ${item.title}`}
                                                onError={() =>
                                                    console.warn(
                                                        "Video failed to load:",
                                                        item.video
                                                    )
                                                }
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            style={{
                                                width: "100%",
                                                height: showContentOnHover
                                                    ? "100%"
                                                    : `${imageHeightPercent}%`,
                                                backgroundImage: `url(${item.image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                position: showContentOnHover
                                                    ? "absolute"
                                                    : "relative",
                                                top: 0,
                                                left: 0,
                                                willChange: "transform",
                                                backfaceVisibility: "hidden",
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                            role="img"
                                            aria-label={
                                                item.image?.alt || "Card image"
                                            }
                                        />
                                    )}

                                    <motion.div
                                        style={{
                                            paddingTop: safePaddingTop,
                                            paddingBottom: safePaddingBottom,
                                            paddingLeft: safePaddingLeft,
                                            paddingRight: safePaddingRight,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                            textAlign: contentAlignment,
                                            justifyContent:
                                                contentVerticalAlignment ===
                                                "top"
                                                    ? "flex-start"
                                                    : contentVerticalAlignment ===
                                                        "center"
                                                      ? "center"
                                                      : "flex-end",
                                            willChange: "opacity, transform",
                                            backfaceVisibility: "hidden",
                                            overflow: "hidden",
                                            maxHeight: showContentOnHover
                                                ? "100%"
                                                : `${100 - imageHeightPercent}%`,
                                            ...(showContentOnHover
                                                ? {
                                                      position: "absolute",
                                                      // FIX 5: corrected from -1 to 0 — card has
                                                      // overflow:hidden so bottom:0 is correct.
                                                      bottom: -1,
                                                      left: 0,
                                                      right: 0,
                                                      background:
                                                          contentHoverUseGradient
                                                              ? `linear-gradient(${contentHoverGradientDirection}deg, ${contentHoverGradientColor1}, ${contentHoverGradientColor2})`
                                                              : contentHoverBackgroundColor,
                                                      backdropFilter:
                                                          contentHoverBlur > 0
                                                              ? `blur(${contentHoverBlur}px) saturate(1.2) brightness(1.05)`
                                                              : "none",
                                                      WebkitBackdropFilter:
                                                          contentHoverBlur > 0
                                                              ? `blur(${contentHoverBlur}px) saturate(1.2) brightness(1.05)`
                                                              : "none",
                                                  }
                                                : {
                                                      flex: 1,
                                                      position: "relative",
                                                  }),
                                        }}
                                        initial={
                                            showContentOnHover
                                                ? { opacity: 0, y: 20 }
                                                : { opacity: 1, y: 0 }
                                        }
                                        animate={
                                            showContentOnHover
                                                ? hoveredCardIndex === index
                                                    ? { opacity: 1, y: 0 }
                                                    : { opacity: 0, y: 20 }
                                                : { opacity: 1, y: 0 }
                                        }
                                        transition={{
                                            duration: 0.4,
                                            ease: [0.4, 0.0, 0.2, 1],
                                        }}
                                    >
                                        <h3
                                            style={{
                                                margin: 0,
                                                color: showContentOnHover
                                                    ? "#ffffff"
                                                    : titleColor,
                                                ...titleFont,
                                                transform:
                                                    "translate3d(0, 0, 0)",
                                                backfaceVisibility: "hidden",
                                                WebkitBackfaceVisibility:
                                                    "hidden",
                                                WebkitFontSmoothing:
                                                    "antialiased",
                                                MozOsxFontSmoothing:
                                                    "grayscale",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                wordBreak: "break-word",
                                                overflowWrap: "break-word",
                                                hyphens: "auto",
                                            }}
                                        >
                                            {item.title}
                                        </h3>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: showContentOnHover
                                                    ? "rgba(255,255,255,0.9)"
                                                    : descriptionColor,
                                                ...descriptionFont,
                                                wordBreak: "break-word",
                                                overflowWrap: "break-word",
                                                whiteSpace: "normal",
                                                transform:
                                                    "translate3d(0, 0, 0)",
                                                backfaceVisibility: "hidden",
                                                WebkitBackfaceVisibility:
                                                    "hidden",
                                                WebkitFontSmoothing:
                                                    "antialiased",
                                                MozOsxFontSmoothing:
                                                    "grayscale",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                display: "-webkit-box",
                                                WebkitLineClamp:
                                                    showContentOnHover ? 4 : 3,
                                                WebkitBoxOrient: "vertical",
                                                hyphens: "auto",
                                            }}
                                        >
                                            {item.description}
                                        </p>
                                    </motion.div>
                                </motion.div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            <motion.button
                onClick={goToPrevious}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        goToPrevious()
                    }
                }}
                tabIndex={0}
                whileHover={{ backgroundColor: buttonHoverColor }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                    position: "absolute",
                    left: isMobileView
                        ? Math.max(10, activeButtonSideOffset)
                        : activeButtonSideOffset,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: activeButtonSize,
                    height: activeButtonSize,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: buttonColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10001,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    outline: "none",
                    padding: 0,
                    flexShrink: 0,
                }}
                aria-label="Previous slide"
                role="button"
            >
                <svg
                    width={activeButtonSize * 0.4}
                    height={activeButtonSize * 0.4}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: "block" }}
                >
                    <polyline
                        points="15 18 9 12 15 6"
                        stroke={buttonArrowColor}
                    />
                </svg>
            </motion.button>

            <motion.button
                onClick={goToNext}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        goToNext()
                    }
                }}
                tabIndex={0}
                whileHover={{ backgroundColor: buttonHoverColor }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                    position: "absolute",
                    right: isMobileView
                        ? Math.max(10, activeButtonSideOffset)
                        : activeButtonSideOffset,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: activeButtonSize,
                    height: activeButtonSize,
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: buttonColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10001,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    outline: "none",
                    padding: 0,
                    flexShrink: 0,
                }}
                aria-label="Next slide"
                role="button"
            >
                <svg
                    width={activeButtonSize * 0.4}
                    height={activeButtonSize * 0.4}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: "block" }}
                >
                    <polyline
                        points="9 18 15 12 9 6"
                        stroke={buttonArrowColor}
                    />
                </svg>
            </motion.button>

            {showDots && (
                <div
                    style={{
                        position: "absolute",
                        bottom: isVerySmallScreen
                            ? 15
                            : isSmallMobile
                              ? 20
                              : 30,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "row",
                        gap: isVerySmallScreen
                            ? 4
                            : isSmallMobile
                              ? 5
                              : isMobileView
                                ? 6
                                : 8,
                        zIndex: 10,
                        padding: isVerySmallScreen
                            ? "4px 8px"
                            : isSmallMobile
                              ? "5px 9px"
                              : isMobileView
                                ? "6px 10px"
                                : "8px 12px",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
                        backdropFilter: "blur(10px)",
                        borderRadius: isVerySmallScreen
                            ? 12
                            : isSmallMobile
                              ? 14
                              : isMobileView
                                ? 16
                                : 20,
                    }}
                    role="tablist"
                    aria-label="Carousel navigation"
                >
                    {activeItems.map((_, index) => {
                        const isActive = index === currentIndex
                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleCardClick(index)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        handleCardClick(index)
                                    }
                                }}
                                tabIndex={0}
                                role="tab"
                                style={{
                                    width: "auto",
                                    height: activeDotSize,
                                    borderRadius: activeDotSize / 2,
                                    border: "none",
                                    backgroundColor: isActive
                                        ? "#fff"
                                        : "rgba(255,255,255,0.4)",
                                    cursor: "pointer",
                                    padding: 0,
                                    overflow: "hidden",
                                    willChange: "width, background-color",
                                    outline: "none",
                                    position: "relative",
                                }}
                                animate={{
                                    width: isActive
                                        ? activeDotActiveWidth
                                        : activeDotSize,
                                    height: activeDotSize,
                                }}
                                whileHover={{
                                    backgroundColor: "#fff",
                                    width: isActive
                                        ? activeDotActiveWidth
                                        : activeDotHoverWidth,
                                    height: activeDotSize,
                                }}
                                whileFocus={{
                                    backgroundColor: "#fff",
                                    width: isActive
                                        ? activeDotActiveWidth
                                        : activeDotHoverWidth,
                                    height: activeDotSize,
                                    boxShadow:
                                        "0 0 0 2px rgba(255,255,255,0.6)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 35,
                                    mass: 0.5,
                                }}
                                aria-label={`Go to slide ${index + 1}`}
                                aria-current={
                                    index === currentIndex ? "true" : "false"
                                }
                                aria-selected={index === currentIndex}
                            />
                        )
                    })}
                </div>
            )}

            <style>{`
                .carousel-card-focus:focus-within { outline: none !important; }
                .carousel-card-focus:focus { outline: none !important; }
                .carousel-card-focus * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            `}</style>
        </div>
    )
}

addPropertyControls(ThreeDSlider, {
    useCMS: {
        type: ControlType.Boolean,
        title: "Use CMS",
        defaultValue: false,
        enabledTitle: "CMS",
        disabledTitle: "Manual",
        description:
            "Toggle between CMS-driven content and manually configured items",
    },
    cmsItems: {
        type: ControlType.Array,
        title: "CMS Items",
        control: { type: ControlType.ComponentInstance },
        defaultValue: [null],
        hidden: ({ useCMS }) => !useCMS,
        description:
            "Connect your CMS collection items to populate the carousel",
    },
    cmsImageField: {
        type: ControlType.String,
        title: "Image Field",
        defaultValue: "image",
        placeholder: "image",
        description: "The prop name for the image in CMS components",
        hidden: ({ useCMS }) => !useCMS,
    },
    cmsVideoField: {
        type: ControlType.String,
        title: "Video Field",
        defaultValue: "video",
        placeholder: "video",
        description: "The prop name for the video in CMS components",
        hidden: ({ useCMS }) => !useCMS,
    },
    cmsTitleField: {
        type: ControlType.String,
        title: "Title Field",
        defaultValue: "title",
        placeholder: "title",
        description: "The prop name for the title in CMS components",
        hidden: ({ useCMS }) => !useCMS,
    },
    cmsDescriptionField: {
        type: ControlType.String,
        title: "Description Field",
        defaultValue: "description",
        placeholder: "description",
        description: "The prop name for the description in CMS components",
        hidden: ({ useCMS }) => !useCMS,
    },
    items: {
        type: ControlType.Array,
        title: "Image and Video",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Upload an image for this carousel card",
                },
                video: {
                    type: ControlType.File,
                    title: "Video Upload",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    description:
                        "Upload a video file. Takes priority over Video URL if both are set.",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://example.com/video.mp4",
                    description:
                        "Or paste a hosted video URL (mp4, webm). Used only if no file is uploaded.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                    description: "The main heading text for this card",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Card description text",
                    displayTextArea: true,
                    description: "Supporting text that appears below the title",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
                    alt: "Slide 1",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Discover",
                description: "Explore amazing features",
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
                    alt: "Slide 2",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Create",
                description: "Build something unique",
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
                    alt: "Slide 3",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Innovate",
                description: "Push boundaries forward",
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
                    alt: "Slide 4",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Transform",
                description: "Change the game",
            },
            {
                image: {
                    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
                    alt: "Slide 5",
                },
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                title: "Succeed",
                description: "Achieve your goals",
            },
        ],
        hidden: ({ useCMS }) => useCMS,
        description:
            "Add and configure carousel items with images, videos, titles, and descriptions",
    },
    videoAutoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Automatically play videos when cards are displayed",
    },
    videoLoop: {
        type: ControlType.Boolean,
        title: "Video Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Loop videos continuously when they reach the end",
    },
    radiusDepth: {
        type: ControlType.Number,
        title: "3D Depth",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 50,
        unit: "px",
        description: "Controls the depth of the 3D curve effect",
    },
    verticalDip: {
        type: ControlType.Number,
        title: "Vertical Dip",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        description:
            "How much cards dip vertically as they move away from center",
    },
    visibleCards: {
        type: ControlType.Number,
        title: "Visible Cards",
        defaultValue: 5,
        min: 3,
        max: 9,
        step: 2,
        displayStepper: true,
        description: "Number of cards visible at once (odd numbers work best)",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 350,
        min: 200,
        max: 600,
        step: 10,
        unit: "px",
        description: "Width of each carousel card on desktop",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 450,
        min: 300,
        max: 700,
        step: 10,
        unit: "px",
        description: "Height of each carousel card on desktop",
    },
    enableResponsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Enable responsive sizing for mobile and tablet",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Max",
        defaultValue: 768,
        min: 320,
        max: 1024,
        step: 1,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Maximum screen width for mobile layout",
    },
    mobileVisibleCards: {
        type: ControlType.Number,
        title: "Mobile Cards",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 2,
        displayStepper: true,
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Number of cards visible on mobile",
    },
    mobileCardWidth: {
        type: ControlType.Number,
        title: "Mobile Width",
        defaultValue: 280,
        min: 200,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Card width on mobile",
    },
    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Height",
        defaultValue: 380,
        min: 250,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Card height on mobile",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Max",
        defaultValue: 1024,
        min: 768,
        max: 1440,
        step: 1,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Maximum screen width for tablet layout",
    },
    tabletVisibleCards: {
        type: ControlType.Number,
        title: "Tablet Cards",
        defaultValue: 5,
        min: 3,
        max: 7,
        step: 2,
        displayStepper: true,
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Number of cards visible on tablet",
    },
    tabletCardWidth: {
        type: ControlType.Number,
        title: "Tablet Width",
        defaultValue: 320,
        min: 250,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Card width on tablet",
    },
    tabletCardHeight: {
        type: ControlType.Number,
        title: "Tablet Height",
        defaultValue: 420,
        min: 300,
        max: 600,
        step: 10,
        unit: "px",
        hidden: ({ enableResponsive }) => !enableResponsive,
        description: "Card height on tablet",
    },
    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        description: "Background color for carousel cards",
    },
    cardBackgroundOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
        description:
            "Transparency of card backgrounds (0 = transparent, 1 = opaque)",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        description: "Roundness of card corners",
    },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
        description: "Thickness of card borders (0 = no border)",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#EEEEEE",
        hidden: ({ cardBorderWidth }) => cardBorderWidth === 0,
        description: "Color of card borders",
    },
    imageHeightPercent: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 70,
        min: 30,
        max: 90,
        step: 5,
        unit: "%",
        hidden: ({ showContentOnHover }) => showContentOnHover,
        description: "Percentage of card height occupied by the image/video",
    },
    useUnifiedPadding: {
        type: ControlType.Boolean,
        title: "Unified Padding",
        defaultValue: true,
        enabledTitle: "Unified",
        disabledTitle: "Individual",
        description: "Use the same padding on all sides or customize each side",
    },
    contentPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ useUnifiedPadding }) => !useUnifiedPadding,
        description: "Uniform padding around card content",
    },
    contentPaddingTop: {
        type: ControlType.Number,
        title: "Top",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ useUnifiedPadding }) => useUnifiedPadding,
    },
    contentPaddingBottom: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ useUnifiedPadding }) => useUnifiedPadding,
    },
    contentPaddingLeft: {
        type: ControlType.Number,
        title: "Left",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ useUnifiedPadding }) => useUnifiedPadding,
    },
    contentPaddingRight: {
        type: ControlType.Number,
        title: "Right",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: ({ useUnifiedPadding }) => useUnifiedPadding,
    },
    showContentOnHover: {
        type: ControlType.Boolean,
        title: "Show on Hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Hide content until user hovers over the card",
    },
    contentAlignment: {
        type: ControlType.Enum,
        title: "Horizontal Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    contentVerticalAlignment: {
        type: ControlType.Enum,
        title: "Vertical Align",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
    },
    contentHoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "rgba(0, 0, 0, 0.7)",
        hidden: ({ showContentOnHover, contentHoverUseGradient }) =>
            !showContentOnHover || contentHoverUseGradient,
    },
    contentHoverUseGradient: {
        type: ControlType.Boolean,
        title: "Use Gradient",
        defaultValue: false,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
        hidden: ({ showContentOnHover }) => !showContentOnHover,
    },
    contentHoverGradientColor1: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "rgba(0, 0, 0, 0.9)",
        hidden: ({ showContentOnHover, contentHoverUseGradient }) =>
            !showContentOnHover || !contentHoverUseGradient,
    },
    contentHoverGradientColor2: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "rgba(0, 0, 0, 0.3)",
        hidden: ({ showContentOnHover, contentHoverUseGradient }) =>
            !showContentOnHover || !contentHoverUseGradient,
    },
    contentHoverGradientDirection: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 180,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
        hidden: ({ showContentOnHover, contentHoverUseGradient }) =>
            !showContentOnHover || !contentHoverUseGradient,
    },
    contentHoverBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        hidden: ({ showContentOnHover }) => !showContentOnHover,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        hidden: ({ showContentOnHover }) => showContentOnHover,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#666666",
        hidden: ({ showContentOnHover }) => showContentOnHover,
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#ffffff",
    },
    buttonHoverColor: {
        type: ControlType.Color,
        title: "Button Hover",
        defaultValue: "#f0f0f0",
    },
    buttonArrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 50,
        min: 30,
        max: 80,
        step: 5,
        unit: "px",
    },
    buttonSideOffset: {
        type: ControlType.Number,
        title: "Side Offset",
        defaultValue: 30,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto-Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    animationStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 10,
    },
    animationDamping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 25,
        min: 10,
        max: 50,
        step: 1,
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Enable Tilt",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tiltIntensity: {
        type: ControlType.Number,
        title: "Tilt Intensity",
        defaultValue: 15,
        min: 5,
        max: 45,
        step: 1,
        unit: "°",
        hidden: ({ enableTilt }) => !enableTilt,
    },
    tiltSmoothing: {
        type: ControlType.Number,
        title: "Tilt Smoothing",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        hidden: ({ enableTilt }) => !enableTilt,
    },
    enableDepthOfField: {
        type: ControlType.Boolean,
        title: "Depth of Field",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    depthOfFieldIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 0.5,
        unit: "px",
        hidden: ({ enableDepthOfField }) => !enableDepthOfField,
    },
    dynamicShadowDepth: {
        type: ControlType.Number,
        title: "Shadow Depth",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    removeBackground: {
        type: ControlType.Boolean,
        title: "Remove Background",
        defaultValue: false,
        enabledTitle: "Transparent",
        disabledTitle: "Visible",
    },
    backgroundType: {
        type: ControlType.Enum,
        title: "Background Type",
        options: ["color", "gradient", "image"],
        optionTitles: ["Color", "Gradient", "Image"],
        defaultValue: "color",
        displaySegmentedControl: true,
        hidden: ({ removeBackground }) => removeBackground,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0a0a0a",
        hidden: ({ backgroundType, removeBackground }) =>
            backgroundType !== "color" || removeBackground,
    },
    useCustomGradient: {
        type: ControlType.Enum,
        title: "Gradient Mode",
        options: ["preset", "mixer", "custom"],
        optionTitles: ["Preset", "Mixer", "Custom CSS"],
        defaultValue: "preset",
        hidden: ({ backgroundType, removeBackground }) =>
            backgroundType !== "gradient" || removeBackground,
    },
    gradientPreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
            "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
            "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
            "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
            "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)",
        ],
        optionTitles: [
            "Purple Dream",
            "Pink Passion",
            "Ocean Blue",
            "Fresh Mint",
            "Sunset Glow",
            "Deep Ocean",
            "Soft Pastel",
            "Rose Quartz",
            "Peach Cream",
            "Coral Sky",
        ],
        defaultValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "preset" ||
            removeBackground,
    },
    gradientMixerColor1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#667eea",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "mixer" ||
            removeBackground,
    },
    gradientMixerColor1Position: {
        type: ControlType.Number,
        title: "Color 1 Position",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "mixer" ||
            removeBackground,
    },
    gradientMixerColor2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#764ba2",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "mixer" ||
            removeBackground,
    },
    gradientMixerColor2Position: {
        type: ControlType.Number,
        title: "Color 2 Position",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "mixer" ||
            removeBackground,
    },
    gradientMixerAngle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "mixer" ||
            removeBackground,
    },
    customGradient: {
        type: ControlType.String,
        title: "Custom CSS",
        defaultValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        placeholder: "linear-gradient(...)",
        displayTextArea: true,
        hidden: ({ backgroundType, useCustomGradient, removeBackground }) =>
            backgroundType !== "gradient" ||
            useCustomGradient !== "custom" ||
            removeBackground,
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ backgroundType, removeBackground }) =>
            backgroundType !== "image" || removeBackground,
    },
    backgroundImageFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        hidden: ({ backgroundType, removeBackground }) =>
            backgroundType !== "image" || removeBackground,
    },
    backgroundImageOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ backgroundType, removeBackground }) =>
            backgroundType !== "image" || removeBackground,
    },
    enableGlowCursor: {
        type: ControlType.Boolean,
        title: "Glow Cursor",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animated glow border that follows the cursor",
    },
    glowOnlyOnHover: {
        type: ControlType.Boolean,
        title: "Only on Hover",
        defaultValue: true,
        enabledTitle: "Hover",
        disabledTitle: "Always",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#0099FF",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowUseGradient: {
        type: ControlType.Boolean,
        title: "Use Gradient",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowColorSecondary: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#8855FF",
        hidden: ({ enableGlowCursor, glowUseGradient }) =>
            !enableGlowCursor || !glowUseGradient,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 150,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowSmooth: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 0.15,
        min: 0.01,
        max: 1,
        step: 0.05,
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
    },
    glowLoopAnimation: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableGlowCursor }) => !enableGlowCursor,
        description: "Moves the glow around automatically",
    },
    glowLoopSpeed: {
        type: ControlType.Number,
        title: "Loop Speed",
        defaultValue: 2,
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ enableGlowCursor, glowLoopAnimation }) =>
            !enableGlowCursor || !glowLoopAnimation,
        description: "Seconds per full loop",
    },
    glowLoopRadius: {
        type: ControlType.Number,
        title: "Loop Radius",
        defaultValue: 20,
        min: 0,
        max: 45,
        step: 1,
        unit: "%",
        hidden: ({ enableGlowCursor, glowLoopAnimation }) =>
            !enableGlowCursor || !glowLoopAnimation,
        description: "How far the glow center travels (% of card)",
    },
})
