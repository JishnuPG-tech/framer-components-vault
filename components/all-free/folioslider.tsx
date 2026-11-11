import { useState, useEffect, useRef, useCallback } from "react"
import type { CSSProperties } from "react"
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


export default function FolioSlider(props) {
    const {
        // Navigation Settings
        basePath = "/work",
        openExternalInNewTab = true,

        // CMS Projects (Up to 12 slots)
        project01Title = "codiple",
        project01Number = "01",
        project01Image = "",
        project01Slug = "",

        project02Title = "axion",
        project02Number = "02",
        project02Image = "",
        project02Slug = "",

        project03Title = "dryelement",
        project03Number = "03",
        project03Image = "",
        project03Slug = "",

        project04Title = "hyperion",
        project04Number = "04",
        project04Image = "",
        project04Slug = "",

        project05Title = "lumina",
        project05Number = "05",
        project05Image = "",
        project05Slug = "",

        project06Title = "vertex",
        project06Number = "06",
        project06Image = "",
        project06Slug = "",

        project07Title = "nebula",
        project07Number = "07",
        project07Image = "",
        project07Slug = "",

        project08Title = "stratos",
        project08Number = "08",
        project08Image = "",
        project08Slug = "",

        project09Title = "prism",
        project09Number = "09",
        project09Image = "",
        project09Slug = "",

        project10Title = "aura",
        project10Number = "10",
        project10Image = "",
        project10Slug = "",

        project11Title = "zenith",
        project11Number = "11",
        project11Image = "",
        project11Slug = "",

        project12Title = "eclipse",
        project12Number = "12",
        project12Image = "",
        project12Slug = "",

        // Pagination Settings
        totalProjects = 6,
        cardsPerPage = 3,
        activePageControl = 1,

        // Header & Title
        titleAreaHeight = 68,
        showOnOpen = false,
        scaleTextWithCard = true,
        textAnimPreset = "editorialRise",

        // Number Position & Styling
        numberOffsetX = 0,
        numberOffsetY = -12,
        numberColor = "#111111",
        numberFont = {
            fontSize: "18px",
            fontStyle: "italic",
            fontFamily: "serif",
            lineHeight: "1.2em",
        },

        // Title Position & Styling
        titleOffsetX = 0,
        titleOffsetY = 0,
        titleColor = "#111111",
        titleFont = {
            fontSize: "36px",
            fontStyle: "italic",
            fontFamily: "sans-serif",
            letterSpacing: "-0.03em",
            lineHeight: "1.2em",
        },

        // Sizing & Ratios
        openCardWidth = 700,
        collapsedWidth = 160,
        cardHeight = 480,
        lockAspectRatio = false,
        gap = 8,
        cardRadius = 16,
        scaleRadiusWithCard = true,

        // Stroke
        strokeColor = "rgba(255,255,255,0.15)",
        strokeWidth = 0,

        // Arrows (Bottom)
        showArrows = true,
        arrowAlign = "right",
        arrowOffsetX = 0,
        arrowOffsetY = 0,
        arrowGap = 10,
        arrowSize = 42,
        arrowBorderColor = "rgba(0, 0, 0, 0.15)",
        arrowColor = "rgba(0, 0, 0, 0.65)",
        arrowAreaHeight = 64,

        // Animations, Delays & Timing
        autoPlay = true,
        cardAppearPreset = "staggerRise",
        appearDelay = 200,
        cycleStartDelay = 3000,
        cycleDuration = 4000,
        pageTransitionPreset = "slide",
        cardTransition = {
            type: "spring",
            stiffness: 260,
            damping: 34,
            mass: 0.9,
        },
    } = props

    const isStatic = useIsStaticRenderer()

    // Aggregate pool of available projects (up to 12)
    const allProjects = [
        {
            title: project01Title,
            number: project01Number,
            image: project01Image,
            slug: project01Slug,
        },
        {
            title: project02Title,
            number: project02Number,
            image: project02Image,
            slug: project02Slug,
        },
        {
            title: project03Title,
            number: project03Number,
            image: project03Image,
            slug: project03Slug,
        },
        {
            title: project04Title,
            number: project04Number,
            image: project04Image,
            slug: project04Slug,
        },
        {
            title: project05Title,
            number: project05Number,
            image: project05Image,
            slug: project05Slug,
        },
        {
            title: project06Title,
            number: project06Number,
            image: project06Image,
            slug: project06Slug,
        },
        {
            title: project07Title,
            number: project07Number,
            image: project07Image,
            slug: project07Slug,
        },
        {
            title: project08Title,
            number: project08Number,
            image: project08Image,
            slug: project08Slug,
        },
        {
            title: project09Title,
            number: project09Number,
            image: project09Image,
            slug: project09Slug,
        },
        {
            title: project10Title,
            number: project10Number,
            image: project10Image,
            slug: project10Slug,
        },
        {
            title: project11Title,
            number: project11Number,
            image: project11Image,
            slug: project11Slug,
        },
        {
            title: project12Title,
            number: project12Number,
            image: project12Image,
            slug: project12Slug,
        },
    ].slice(0, totalProjects)

    const totalPages = Math.max(1, Math.ceil(allProjects.length / cardsPerPage))

    // Pagination & Active card states
    const [page, setPage] = useState(0)
    const [cardInPage, setCardInPage] = useState(0)
    const [hoverSlot, setHoverSlot] = useState<number | null>(null)
    const [pageDirection, setPageDirection] = useState(1)

    // Trigger states when reaching the section
    const [hasAppeared, setHasAppeared] = useState(false)
    const [canCycle, setCanCycle] = useState(false)

    const intervalRef = useRef<any>(null)
    const appearTimerRef = useRef<any>(null)
    const cycleTimerRef = useRef<any>(null)

    // Sync active page from property controls on canvas
    useEffect(() => {
        if (isStatic) {
            setPage(
                Math.min(totalPages - 1, Math.max(0, activePageControl - 1))
            )
        }
    }, [activePageControl, isStatic, totalPages])

    // Current page projects
    const startIndex = page * cardsPerPage
    const currentProjects = allProjects.slice(
        startIndex,
        startIndex + cardsPerPage
    )

    const activeSlot = hoverSlot !== null ? hoverSlot : cardInPage
    const isHovering = hoverSlot !== null

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    // ── Smart Navigation Handler ─────────────────────────────────────────────
    const handleProjectClick = useCallback(
        (urlInput?: string) => {
            if (!urlInput || typeof urlInput !== "string") return
            const trimmed = urlInput.trim()
            if (!trimmed) return

            // 1. External Link (e.g., https://apple.com)
            if (/^https?:\/\//i.test(trimmed)) {
                if (openExternalInNewTab) {
                    window.open(trimmed, "_blank", "noopener,noreferrer")
                } else {
                    window.location.href = trimmed
                }
                return
            }

            // 2. Custom Internal Page (e.g., /case-studies/project-one)
            if (trimmed.startsWith("/")) {
                window.location.href = trimmed
                return
            }

            // 3. Raw CMS Slug (e.g., "codiple") -> Prepends basePath
            const cleanBase = (basePath || "/work").trim().replace(/\/+$/, "")
            const normalizedBase = cleanBase.startsWith("/")
                ? cleanBase
                : `/${cleanBase}`
            window.location.href = `${normalizedBase}/${trimmed}`
        },
        [basePath, openExternalInNewTab]
    )

    // ── When user scrolls and reaches this section ───────────────────────────
    useEffect(() => {
        if (isStatic) {
            setHasAppeared(true)
            setCanCycle(false)
            return
        }
        if (!containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    appearTimerRef.current = setTimeout(() => {
                        setHasAppeared(true)
                    }, appearDelay)

                    cycleTimerRef.current = setTimeout(() => {
                        setCanCycle(true)
                    }, cycleStartDelay)

                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)
        return () => {
            observer.disconnect()
            if (appearTimerRef.current) clearTimeout(appearTimerRef.current)
            if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current)
        }
    }, [isStatic, appearDelay, cycleStartDelay])

    // ── Measure container width dynamically ──────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width
            if (width > 0) setContainerWidth(width)
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const effectiveWidth = containerWidth > 0 ? containerWidth : 1200

    const numVisible = currentProjects.length || cardsPerPage
    const closedRatio = collapsedWidth / openCardWidth
    const heightRatio = cardHeight / openCardWidth

    let actualExpandedWidth: number,
        actualCollapsedWidth: number,
        actualHeight: number,
        actualRadius: number
    let scaleFactor = 1

    if (lockAspectRatio) {
        const remainingClosedCount = Math.max(0, numVisible - 1)
        actualExpandedWidth =
            (effectiveWidth - gap * (numVisible - 1)) /
            (1 + remainingClosedCount * closedRatio)
        actualCollapsedWidth = Math.round(actualExpandedWidth * closedRatio)
        actualHeight = Math.round(actualExpandedWidth * heightRatio)

        scaleFactor = actualExpandedWidth / openCardWidth
        actualRadius = scaleRadiusWithCard
            ? Math.round(cardRadius * scaleFactor)
            : cardRadius
    } else {
        const remainingClosedCount = Math.max(0, numVisible - 1)
        actualExpandedWidth =
            effectiveWidth -
            collapsedWidth * remainingClosedCount -
            gap * (numVisible - 1)
        actualCollapsedWidth = collapsedWidth
        actualHeight = cardHeight
        actualRadius = cardRadius
    }

    // ── Responsive Offsets & Font Sizes ──────────────────────────────────────
    const textScale = scaleTextWithCard && lockAspectRatio ? scaleFactor : 1
    const dynamicNumX = Math.round(numberOffsetX * textScale)
    const dynamicNumY = Math.round(numberOffsetY * textScale)
    const dynamicTitleX = Math.round(titleOffsetX * textScale)
    const dynamicTitleY = Math.round(titleOffsetY * textScale)

    const neededHeadroom = Math.max(0, -dynamicNumY + 16, -dynamicTitleY + 16)
    const effectiveHeaderHeight = Math.max(
        titleAreaHeight,
        titleAreaHeight + neededHeadroom
    )

    // ── Auto-cycle logic ─────────────────────────────────────────────────────
    const startCycle = useCallback(() => {
        if (isStatic || !autoPlay) return
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
            setCardInPage((prevCard) => {
                const nextCard = prevCard + 1
                if (nextCard < currentProjects.length) {
                    return nextCard
                } else {
                    if (totalPages > 1) {
                        setPageDirection(1)
                        setPage((prevPage) => (prevPage + 1) % totalPages)
                    }
                    return 0
                }
            })
        }, cycleDuration)
    }, [cycleDuration, currentProjects.length, totalPages, isStatic, autoPlay])

    useEffect(() => {
        if (autoPlay && canCycle && !isHovering && !isStatic) {
            startCycle()
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [autoPlay, canCycle, isHovering, startCycle, isStatic])

    // ── Hover Handlers ───────────────────────────────────────────────────────
    const handleContainerLeave = useCallback(() => {
        setHoverSlot(null)
        if (autoPlay && canCycle && !isStatic) {
            startCycle()
        }
    }, [autoPlay, canCycle, isStatic, startCycle])

    const handleCardEnter = useCallback((index: number) => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setHoverSlot(index)
    }, [])

    // ── Arrow Page Controls ──────────────────────────────────────────────────
    const handlePrev = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (totalPages <= 1) return
            setPageDirection(-1)
            setCardInPage(0)
            setHoverSlot(null)
            setPage((prev) => (prev - 1 + totalPages) % totalPages)
            if (autoPlay) startCycle()
        },
        [totalPages, startCycle, autoPlay]
    )

    const handleNext = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            if (totalPages <= 1) return
            setPageDirection(1)
            setCardInPage(0)
            setHoverSlot(null)
            setPage((prev) => (prev + 1) % totalPages)
            if (autoPlay) startCycle()
        },
        [totalPages, startCycle, autoPlay]
    )

    // ── Text Animation Presets Logic ─────────────────────────────────────────
    const getTextAnimConfig = () => {
        if (isStatic) {
            return {
                initial: false,
                animate: {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    scale: 1,
                    filter: "blur(0px)",
                },
                exit: undefined,
                transition: { duration: 0 },
            }
        }

        switch (textAnimPreset) {
            case "letterGlide":
                return {
                    initial: { opacity: 0, x: -24, filter: "blur(4px)" },
                    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
                    exit: { opacity: 0, x: 20, filter: "blur(4px)" },
                    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }
            case "cinematicDefocus":
                return {
                    initial: { opacity: 0, scale: 0.94, filter: "blur(14px)" },
                    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
                    exit: { opacity: 0, scale: 0.96, filter: "blur(10px)" },
                    transition: { duration: 0.55, ease: "easeOut" },
                }
            case "springPop":
                return {
                    initial: { opacity: 0, y: 16, scale: 0.88 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: -12, scale: 0.9 },
                    transition: { type: "spring", stiffness: 300, damping: 22 },
                }
            case "editorialRise":
            default:
                return {
                    initial: { opacity: 0, y: 18, filter: "blur(6px)" },
                    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
                    exit: { opacity: 0, y: -10, filter: "blur(4px)" },
                    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }
        }
    }

    // ── Page Animation Presets Logic ─────────────────────────────────────────
    const getPageAnimation = () => {
        if (isStatic)
            return { initial: false, animate: { opacity: 1 }, exit: undefined }

        switch (pageTransitionPreset) {
            case "fadeBlur":
                return {
                    initial: { opacity: 0, filter: "blur(10px)", scale: 0.98 },
                    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
                    exit: { opacity: 0, filter: "blur(8px)", scale: 0.98 },
                    transition: { duration: 0.45, ease: "easeInOut" },
                }
            case "depthScale":
                return {
                    initial: { opacity: 0, scale: 0.91, y: 30 },
                    animate: { opacity: 1, scale: 1, y: 0 },
                    exit: { opacity: 0, scale: 0.94, y: -24 },
                    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                }
            case "slide":
            default:
                return {
                    initial: { opacity: 0, x: pageDirection > 0 ? 80 : -80 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: pageDirection > 0 ? -80 : 80 },
                    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                }
        }
    }

    // ── Card Entrance / Appear Presets Logic ─────────────────────────────────
    const getCardAppearStyles = (index: number) => {
        if (isStatic || cardAppearPreset === "none") {
            return {
                initial: false,
                animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
                transition: { duration: 0 },
            }
        }

        switch (cardAppearPreset) {
            case "scaleReveal":
                return {
                    initial: { opacity: 0, scale: 0.82, y: 35 },
                    animate: hasAppeared
                        ? { opacity: 1, scale: 1, y: 0 }
                        : { opacity: 0, scale: 0.82, y: 35 },
                    transition: {
                        type: "spring",
                        stiffness: 180,
                        damping: 20,
                        delay: index * 0.12,
                    },
                }
            case "blurFade":
                return {
                    initial: { opacity: 0, filter: "blur(24px)", scale: 0.94 },
                    animate: hasAppeared
                        ? { opacity: 1, filter: "blur(0px)", scale: 1 }
                        : { opacity: 0, filter: "blur(24px)", scale: 0.94 },
                    transition: {
                        duration: 0.85,
                        delay: index * 0.12,
                        ease: "easeOut",
                    },
                }
            case "staggerRise":
            default:
                return {
                    initial: { opacity: 0, y: 70, filter: "blur(8px)" },
                    animate: hasAppeared
                        ? { opacity: 1, y: 0, filter: "blur(0px)" }
                        : { opacity: 0, y: 70, filter: "blur(8px)" },
                    transition: {
                        duration: 0.8,
                        delay: index * 0.14,
                        ease: [0.16, 1, 0.3, 1],
                    },
                }
        }
    }

    const pageAnim = getPageAnimation()
    const textAnim = getTextAnimConfig()

    return (
        <div
            ref={containerRef}
            onMouseLeave={handleContainerLeave}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
                overflow: isStatic ? "visible" : "hidden",
            }}
        >
            {/* ── PAGINATED ROW CONTAINER ────────────────────────────────────── */}
            <AnimatePresence
                initial={false}
                custom={pageDirection}
                mode={isStatic ? undefined : "wait"}
            >
                <motion.div
                    key={`page-${page}`}
                    initial={pageAnim.initial}
                    animate={pageAnim.animate}
                    exit={pageAnim.exit}
                    transition={pageAnim.transition}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-end",
                        gap: gap,
                        width: "100%",
                        overflow: "visible",
                        opacity: 1,
                    }}
                >
                    {currentProjects.map((project, index) => {
                        const isActive = index === activeSlot
                        const showTitle =
                            (isStatic || hasAppeared) &&
                            (showOnOpen ? isActive : isHovering && isActive)
                        const appearConfig = getCardAppearStyles(index)

                        return (
                            <motion.div
                                key={`card-${startIndex + index}`}
                                onMouseEnter={() => handleCardEnter(index)}
                                onPointerEnter={() => handleCardEnter(index)}
                                style={{
                                    position: "relative",
                                    flex: "0 0 auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    willChange: "width",
                                    overflow: "visible",
                                }}
                                initial={false}
                                animate={{
                                    width: isActive
                                        ? actualExpandedWidth
                                        : actualCollapsedWidth,
                                }}
                                transition={
                                    isStatic ? { duration: 0 } : cardTransition
                                }
                            >
                                {/* ── Title & Number ABOVE the Card ───────────── */}
                                <div
                                    style={{
                                        height: effectiveHeaderHeight,
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        paddingBottom: 10,
                                        paddingTop: neededHeadroom,
                                        boxSizing: "border-box",
                                        overflow: "visible",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <AnimatePresence initial={false}>
                                        {showTitle && (
                                            <motion.div
                                                key={`title-${startIndex + index}`}
                                                initial={textAnim.initial}
                                                animate={textAnim.animate}
                                                exit={textAnim.exit}
                                                transition={textAnim.transition}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "baseline",
                                                    whiteSpace: "nowrap",
                                                    position: "relative",
                                                    overflow: "visible",
                                                    paddingTop: 10,
                                                    opacity: 1,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: numberColor,
                                                        opacity: 0.85,
                                                        display: "inline-block",
                                                        transform: `translate(${dynamicNumX}px, ${dynamicNumY}px)`,
                                                        overflow: "visible",
                                                        fontSize:
                                                            numberFont?.fontSize
                                                                ? `${Math.round(parseFloat(numberFont.fontSize as string) * textScale)}px`
                                                                : undefined,
                                                        ...numberFont,
                                                    }}
                                                >
                                                    {project.number}
                                                </span>
                                                <span
                                                    style={{
                                                        color: titleColor,
                                                        display: "inline-block",
                                                        transform: `translate(${dynamicTitleX}px, ${dynamicTitleY}px)`,
                                                        overflow: "visible",
                                                        fontSize:
                                                            titleFont?.fontSize
                                                                ? `${Math.round(parseFloat(titleFont.fontSize as string) * textScale)}px`
                                                                : undefined,
                                                        ...titleFont,
                                                    }}
                                                >
                                                    {project.title}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* ── The Card Container ──────────────────────── */}
                                <motion.div
                                    initial={appearConfig.initial}
                                    animate={appearConfig.animate}
                                    transition={appearConfig.transition}
                                    onClick={() =>
                                        handleProjectClick(project.slug)
                                    }
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: actualHeight,
                                        borderRadius: actualRadius,
                                        overflow: "hidden",
                                        cursor: project.slug
                                            ? "pointer"
                                            : "default",
                                        boxSizing: "border-box",
                                        border:
                                            strokeWidth > 0
                                                ? `${strokeWidth}px solid ${strokeColor}`
                                                : undefined,
                                        backgroundClip: "padding-box",
                                        WebkitBackfaceVisibility: "hidden",
                                        backfaceVisibility: "hidden",
                                        transform: "translate3d(0,0,0)",
                                        WebkitMaskImage:
                                            "-webkit-radial-gradient(white, black)",
                                        maskImage:
                                            "radial-gradient(white, black)",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: actualExpandedWidth,
                                            height: "100%",
                                            position: "absolute",
                                            left: "50%",
                                            top: 0,
                                            transform: "translateX(-50%)",
                                        }}
                                    >
                                        {project.image ? (
                                            <img
                                                src={project.image}
                                                alt={project.title || ""}
                                                decoding="async"
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                    display: "block",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        ) : (
                                            /* ── Sleek Placeholder when Image is empty ── */
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    background:
                                                        "linear-gradient(145deg, #1f1f22 0%, #121214 100%)",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 12,
                                                    userSelect: "none",
                                                    pointerEvents: "none",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: "50%",
                                                        background:
                                                            "rgba(255, 255, 255, 0.05)",
                                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        color: "rgba(255, 255, 255, 0.45)",
                                                    }}
                                                >
                                                    <svg
                                                        width="22"
                                                        height="22"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect
                                                            x="3"
                                                            y="3"
                                                            width="18"
                                                            height="18"
                                                            rx="2"
                                                            ry="2"
                                                        />
                                                        <circle
                                                            cx="8.5"
                                                            ry="8.5"
                                                            r="1.5"
                                                        />
                                                        <polyline points="21 15 16 10 5 21" />
                                                    </svg>
                                                </div>
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontFamily:
                                                            "sans-serif",
                                                        letterSpacing: "0.04em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: "rgba(255, 255, 255, 0.35)",
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Upload Image
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </AnimatePresence>

            {/* ── ARROW BUTTONS ROW ───────────────────────────────────────────── */}
            {showArrows && (
                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            arrowAlign === "center"
                                ? "center"
                                : arrowAlign === "left"
                                  ? "flex-start"
                                  : "flex-end",
                        alignItems: "center",
                        width: "100%",
                        minHeight: arrowAreaHeight,
                        paddingTop: 16,
                        paddingBottom: 8,
                        gap: arrowGap,
                        boxSizing: "border-box",
                        overflow: "visible",
                        transform: `translate(${arrowOffsetX}px, ${arrowOffsetY}px)`,
                    }}
                >
                    {/* Left Button */}
                    <button
                        onClick={handlePrev}
                        aria-label="Previous Page"
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: `1px solid ${arrowBorderColor}`,
                            background: "transparent",
                            color: arrowColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            outline: "none",
                            boxSizing: "border-box",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="13" y1="8" x2="3" y2="8" />
                            <polyline points="7 4 3 8 7 12" />
                        </svg>
                    </button>

                    {/* Right Button */}
                    <button
                        onClick={handleNext}
                        aria-label="Next Page"
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: `1px solid ${arrowBorderColor}`,
                            background: "transparent",
                            color: arrowColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            outline: "none",
                            boxSizing: "border-box",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="8" x2="13" y2="8" />
                            <polyline points="9 4 13 8 9 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

// ── Property Controls ─────────────────────────────────────────────────────────

FolioSlider.displayName = "FolioSlider"

addPropertyControls(FolioSlider, {
    // ══════════════════════════════════════════════════════════════════════════
    // ✦ SETUP & PAGINATION
    // ══════════════════════════════════════════════════════════════════════════
    totalProjects: {
        type: ControlType.Number,
        title: "Total Projects",
        defaultValue: 6,
        min: 2,
        max: 12,
        step: 1,
        displayStepper: true,
        description: "Number of active project slots to display (2 to 12)",
    },
    cardsPerPage: {
        type: ControlType.Number,
        title: "Projects Per Page",
        defaultValue: 3,
        min: 2,
        max: 4,
        step: 1,
        displayStepper: true,
        description: "How many project cards are visible per row page",
    },
    activePageControl: {
        type: ControlType.Number,
        title: "Canvas Page Preview",
        defaultValue: 1,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
        description:
            "Preview page 1, 2, 3, etc. while working in Framer canvas",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ✦ SECTION 1: PROJECTS
    // ══════════════════════════════════════════════════════════════════════════
    // Project 01
    project01Title: {
        type: ControlType.String,
        title: "Project 01 Title",
        defaultValue: "codiple",
        description: "Project title displayed above open/hovered card",
    },
    project01Image: {
        type: ControlType.Image,
        title: "Project 01 Image",
        description: "Main card cover image",
    },
    project01Slug: {
        type: ControlType.String,
        title: "Project 01 Link / Slug",
        defaultValue: "",
        description:
            "CMS slug (codiple), path (/work/codiple), or URL (https://...)",
    },
    project01Number: {
        type: ControlType.String,
        title: "Project 01 Number",
        defaultValue: "01",
        description: "Display number or subtitle tag",
    },

    // Project 02
    project02Title: {
        type: ControlType.String,
        title: "Project 02 Title",
        defaultValue: "axion",
    },
    project02Image: { type: ControlType.Image, title: "Project 02 Image" },
    project02Slug: {
        type: ControlType.String,
        title: "Project 02 Link / Slug",
        defaultValue: "",
    },
    project02Number: {
        type: ControlType.String,
        title: "Project 02 Number",
        defaultValue: "02",
    },

    // Project 03
    project03Title: {
        type: ControlType.String,
        title: "Project 03 Title",
        defaultValue: "dryelement",
        hidden: (props) => props.totalProjects < 3,
    },
    project03Image: {
        type: ControlType.Image,
        title: "Project 03 Image",
        hidden: (props) => props.totalProjects < 3,
    },
    project03Slug: {
        type: ControlType.String,
        title: "Project 03 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 3,
    },
    project03Number: {
        type: ControlType.String,
        title: "Project 03 Number",
        defaultValue: "03",
        hidden: (props) => props.totalProjects < 3,
    },

    // Project 04
    project04Title: {
        type: ControlType.String,
        title: "Project 04 Title",
        defaultValue: "hyperion",
        hidden: (props) => props.totalProjects < 4,
    },
    project04Image: {
        type: ControlType.Image,
        title: "Project 04 Image",
        hidden: (props) => props.totalProjects < 4,
    },
    project04Slug: {
        type: ControlType.String,
        title: "Project 04 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 4,
    },
    project04Number: {
        type: ControlType.String,
        title: "Project 04 Number",
        defaultValue: "04",
        hidden: (props) => props.totalProjects < 4,
    },

    // Project 05
    project05Title: {
        type: ControlType.String,
        title: "Project 05 Title",
        defaultValue: "lumina",
        hidden: (props) => props.totalProjects < 5,
    },
    project05Image: {
        type: ControlType.Image,
        title: "Project 05 Image",
        hidden: (props) => props.totalProjects < 5,
    },
    project05Slug: {
        type: ControlType.String,
        title: "Project 05 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 5,
    },
    project05Number: {
        type: ControlType.String,
        title: "Project 05 Number",
        defaultValue: "05",
        hidden: (props) => props.totalProjects < 5,
    },

    // Project 06
    project06Title: {
        type: ControlType.String,
        title: "Project 06 Title",
        defaultValue: "vertex",
        hidden: (props) => props.totalProjects < 6,
    },
    project06Image: {
        type: ControlType.Image,
        title: "Project 06 Image",
        hidden: (props) => props.totalProjects < 6,
    },
    project06Slug: {
        type: ControlType.String,
        title: "Project 06 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 6,
    },
    project06Number: {
        type: ControlType.String,
        title: "Project 06 Number",
        defaultValue: "06",
        hidden: (props) => props.totalProjects < 6,
    },

    // Project 07
    project07Title: {
        type: ControlType.String,
        title: "Project 07 Title",
        defaultValue: "nebula",
        hidden: (props) => props.totalProjects < 7,
    },
    project07Image: {
        type: ControlType.Image,
        title: "Project 07 Image",
        hidden: (props) => props.totalProjects < 7,
    },
    project07Slug: {
        type: ControlType.String,
        title: "Project 07 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 7,
    },
    project07Number: {
        type: ControlType.String,
        title: "Project 07 Number",
        defaultValue: "07",
        hidden: (props) => props.totalProjects < 7,
    },

    // Project 08
    project08Title: {
        type: ControlType.String,
        title: "Project 08 Title",
        defaultValue: "stratos",
        hidden: (props) => props.totalProjects < 8,
    },
    project08Image: {
        type: ControlType.Image,
        title: "Project 08 Image",
        hidden: (props) => props.totalProjects < 8,
    },
    project08Slug: {
        type: ControlType.String,
        title: "Project 08 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 8,
    },
    project08Number: {
        type: ControlType.String,
        title: "Project 08 Number",
        defaultValue: "08",
        hidden: (props) => props.totalProjects < 8,
    },

    // Project 09
    project09Title: {
        type: ControlType.String,
        title: "Project 09 Title",
        defaultValue: "prism",
        hidden: (props) => props.totalProjects < 9,
    },
    project09Image: {
        type: ControlType.Image,
        title: "Project 09 Image",
        hidden: (props) => props.totalProjects < 9,
    },
    project09Slug: {
        type: ControlType.String,
        title: "Project 09 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 9,
    },
    project09Number: {
        type: ControlType.String,
        title: "Project 09 Number",
        defaultValue: "09",
        hidden: (props) => props.totalProjects < 9,
    },

    // Project 10
    project10Title: {
        type: ControlType.String,
        title: "Project 10 Title",
        defaultValue: "aura",
        hidden: (props) => props.totalProjects < 10,
    },
    project10Image: {
        type: ControlType.Image,
        title: "Project 10 Image",
        hidden: (props) => props.totalProjects < 10,
    },
    project10Slug: {
        type: ControlType.String,
        title: "Project 10 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 10,
    },
    project10Number: {
        type: ControlType.String,
        title: "Project 10 Number",
        defaultValue: "10",
        hidden: (props) => props.totalProjects < 10,
    },

    // Project 11
    project11Title: {
        type: ControlType.String,
        title: "Project 11 Title",
        defaultValue: "zenith",
        hidden: (props) => props.totalProjects < 11,
    },
    project11Image: {
        type: ControlType.Image,
        title: "Project 11 Image",
        hidden: (props) => props.totalProjects < 11,
    },
    project11Slug: {
        type: ControlType.String,
        title: "Project 11 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 11,
    },
    project11Number: {
        type: ControlType.String,
        title: "Project 11 Number",
        defaultValue: "11",
        hidden: (props) => props.totalProjects < 11,
    },

    // Project 12
    project12Title: {
        type: ControlType.String,
        title: "Project 12 Title",
        defaultValue: "eclipse",
        hidden: (props) => props.totalProjects < 12,
    },
    project12Image: {
        type: ControlType.Image,
        title: "Project 12 Image",
        hidden: (props) => props.totalProjects < 12,
    },
    project12Slug: {
        type: ControlType.String,
        title: "Project 12 Link / Slug",
        defaultValue: "",
        hidden: (props) => props.totalProjects < 12,
    },
    project12Number: {
        type: ControlType.String,
        title: "Project 12 Number",
        defaultValue: "12",
        hidden: (props) => props.totalProjects < 12,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ✦ SECTION 2: ANIMATION
    // ══════════════════════════════════════════════════════════════════════════
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Automatically cycle through cards",
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Autoplay Interval",
        defaultValue: 4000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        displayStepper: true,
        hidden: (props) => !props.autoPlay,
        description: "Duration each card stays open before advancing",
    },
    cycleStartDelay: {
        type: ControlType.Number,
        title: "Autoplay Delay",
        defaultValue: 3000,
        min: 0,
        max: 8000,
        step: 500,
        unit: "ms",
        hidden: (props) => !props.autoPlay,
        description:
            "Delay after section scrolls into view before cycling begins",
    },
    showOnOpen: {
        type: ControlType.Boolean,
        title: "Hover Title Reveal",
        defaultValue: false,
        enabledTitle: "Always Open",
        disabledTitle: "Hover Only",
        description:
            "Show title on hover only or keep active open card visible",
    },
    textAnimPreset: {
        type: ControlType.Enum,
        title: "Text Motion Preset",
        options: [
            "editorialRise",
            "letterGlide",
            "cinematicDefocus",
            "springPop",
        ],
        optionTitles: [
            "Editorial Rise",
            "Letter Glide",
            "Cinematic Defocus",
            "Spring Pop",
        ],
        defaultValue: "editorialRise",
        description: "Motion preset for title and number appearance",
    },
    cardAppearPreset: {
        type: ControlType.Enum,
        title: "Entrance Effect",
        options: ["staggerRise", "scaleReveal", "blurFade", "none"],
        optionTitles: ["Stagger Rise", "Scale & Reveal", "Blur & Fade", "None"],
        defaultValue: "staggerRise",
        description:
            "Initial scroll reveal animation when section enters viewport",
    },
    appearDelay: {
        type: ControlType.Number,
        title: "Entrance Delay",
        defaultValue: 200,
        min: 0,
        max: 3000,
        step: 100,
        unit: "ms",
        hidden: (props) => props.cardAppearPreset === "none",
        description: "Delay before entrance animation triggers",
    },
    pageTransitionPreset: {
        type: ControlType.Enum,
        title: "Page Transition",
        options: ["slide", "fadeBlur", "depthScale"],
        optionTitles: ["Slide", "Fade Blur", "Depth"],
        displaySegmentedControl: true,
        defaultValue: "slide",
        description: "Transition when moving between paginated rows",
    },
    cardTransition: {
        type: ControlType.Transition,
        title: "Card Spring Physics",
        defaultValue: {
            type: "spring",
            stiffness: 260,
            damping: 34,
            mass: 0.9,
        },
        description: "Spring feel when expanding and collapsing cards",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ✦ SECTION 3: DESIGN
    // ══════════════════════════════════════════════════════════════════════════
    // Card Dimensions
    lockAspectRatio: {
        type: ControlType.Boolean,
        title: "Lock Aspect Ratio",
        defaultValue: false,
        enabledTitle: "Locked",
        disabledTitle: "Free",
        description: "Scale card dimensions proportionally with screen width",
    },
    openCardWidth: {
        type: ControlType.Number,
        title: "Open Card Width",
        defaultValue: 700,
        min: 100,
        max: 2000,
        unit: "px",
    },
    collapsedWidth: {
        type: ControlType.Number,
        title: "Closed Card Width",
        defaultValue: 160,
        min: 40,
        max: 800,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 480,
        min: 50,
        max: 2000,
        unit: "px",
    },

    // Card Radius, Gap & Stroke
    cardRadius: {
        type: ControlType.Number,
        title: "Card Border Radius",
        defaultValue: 16,
        min: 0,
        max: 500,
        unit: "px",
        description:
            "Corner radius of all cards (supports pill shapes up to 500px)",
    },
    scaleRadiusWithCard: {
        type: ControlType.Boolean,
        title: "Scale Radius",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Fixed",
        hidden: (props) => !props.lockAspectRatio,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap Between Cards",
        defaultValue: 8,
        min: 0,
        max: 60,
        unit: "px",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Card Border Width",
        defaultValue: 0,
        min: 0,
        max: 10,
        unit: "px",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Card Border Color",
        defaultValue: "rgba(255,255,255,0.15)",
        hidden: (props) => props.strokeWidth === 0,
    },

    // Typography & Colors
    titleAreaHeight: {
        type: ControlType.Number,
        title: "Header Space",
        defaultValue: 68,
        min: 20,
        max: 200,
        unit: "px",
        description:
            "Spacing height allocated above cards for title and number",
    },
    scaleTextWithCard: {
        type: ControlType.Boolean,
        title: "Responsive Text Scale",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Fixed",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "36px",
            variant: "Italic",
            letterSpacing: "-0.03em",
            lineHeight: "1.2em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#111111",
    },
    titleOffsetX: {
        type: ControlType.Number,
        title: "Title Offset X",
        defaultValue: 0,
        min: -300,
        max: 300,
        unit: "px",
    },
    titleOffsetY: {
        type: ControlType.Number,
        title: "Title Offset Y",
        defaultValue: 0,
        min: -200,
        max: 200,
        unit: "px",
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Italic",
            lineHeight: "1.2em",
        },
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#111111",
    },
    numberOffsetX: {
        type: ControlType.Number,
        title: "Number Offset X",
        defaultValue: 0,
        min: -300,
        max: 300,
        unit: "px",
    },
    numberOffsetY: {
        type: ControlType.Number,
        title: "Number Offset Y",
        defaultValue: -12,
        min: -300,
        max: 300,
        unit: "px",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ✦ SECTION 4: ADVANCED SETTINGS
    // ══════════════════════════════════════════════════════════════════════════
    // Link & URL Routing
    basePath: {
        type: ControlType.String,
        title: "Internal Link Base Path",
        defaultValue: "/work",
        description: "Base route prepended to raw slugs (e.g. /work/slug)",
    },
    openExternalInNewTab: {
        type: ControlType.Boolean,
        title: "External Links New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Open http/https external links in a new browser tab",
    },

    // Navigation Arrows
    showArrows: {
        type: ControlType.Boolean,
        title: "Navigation Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Show previous and next arrow buttons below cards",
    },
    arrowAlign: {
        type: ControlType.Enum,
        title: "Arrow Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "right",
        hidden: (props) => !props.showArrows,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Button Size",
        defaultValue: 42,
        min: 24,
        max: 80,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 10,
        min: 0,
        max: 80,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Icon Color",
        defaultValue: "rgba(0, 0, 0, 0.65)",
        hidden: (props) => !props.showArrows,
    },
    arrowBorderColor: {
        type: ControlType.Color,
        title: "Arrow Border Color",
        defaultValue: "rgba(0, 0, 0, 0.15)",
        hidden: (props) => !props.showArrows,
    },
    arrowOffsetX: {
        type: ControlType.Number,
        title: "Arrow Offset X",
        defaultValue: 0,
        min: -400,
        max: 400,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowOffsetY: {
        type: ControlType.Number,
        title: "Arrow Offset Y",
        defaultValue: 0,
        min: -200,
        max: 200,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowAreaHeight: {
        type: ControlType.Number,
        title: "Arrow Row Height",
        defaultValue: 64,
        min: 36,
        max: 120,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
})
