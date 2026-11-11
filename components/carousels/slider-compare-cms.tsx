import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import Swiper from "swiper"

type SlideItem = {
    beforeImage?: string | { src?: string; url?: string; light?: string }
    afterImage?: string | { src?: string; url?: string; light?: string }
    altText?: string
    title?: string
    text?: string
    dividerPosition?: number
    comparisonMode?: "vertical" | "horizontal" | "global"
}

type NormalizedSlide = {
    beforeImage: string
    afterImage: string
    altText: string
    title: string
    text: string
    dividerPosition?: number
    comparisonMode: "vertical" | "horizontal"
}

type FontValue =
    | {
          fontFamily?: string
          fontSize?: number | string
          fontWeight?: number | string
          lineHeight?: number | string
          letterSpacing?: number | string
      }
    | string

type ResolvedFont = {
    family: string
    size: string
    weight: string
    lineHeight: string
    letterSpacing: string
}

type ImageCompareSlideProps = {
    slides?: SlideItem[]
    initialSlide?: number
    speed?: number
    mouseWheel?: boolean
    keyboardNavigation?: boolean
    autoplay?: boolean
    autoplayInterval?: number
    pauseOnHover?: boolean
    pauseOnFocus?: boolean
    loop?: boolean
    animateDividerOnAppear?: boolean
    appearDragDistance?: number
    appearDragDuration?: number
    dividerPosition?: number
    comparisonMode?: "vertical" | "horizontal"
    centerBorderRadius?: number
    backgroundColor?: string
    buttonColor?: string
    dividerColor?: string
    textColor?: string
    descriptionColor?: string
    overlayOpacity?: number
    showButtons?: boolean
    showLabels?: boolean
    showText?: boolean
    beforeLabel?: string
    afterLabel?: string
    fontFamily?: string
    titleFont?: FontValue
    descriptionFont?: FontValue
    textAnimation?: "fadeUp" | "slideUp" | "fade" | "none"
    exitAnimation?: "fadeOut" | "slideDown" | "slideLeft" | "none"
    exitDuration?: number
    content?: ContentOptions
    navigation?: NavigationOptions
    comparison?: ComparisonOptions
    appearance?: AppearanceOptions
    typography?: TypographyOptions
    animation?: AnimationOptions
    spotlight?: SpotlightOptions
    dataSource?: "manual" | "connect"
    connectBeforeImage?: SlideItem["beforeImage"]
    connectAfterImage?: SlideItem["afterImage"]
    connectAltText?: string
    connectTitle?: string
    connectText?: string
    connectComparisonMode?: "global" | "vertical" | "horizontal"
    connectDividerPosition?: number
}

type ContentOptions = {
    slides?: SlideItem[]
    showButtons?: boolean
    showLabels?: boolean
    showText?: boolean
    beforeLabel?: string
    afterLabel?: string
}

type NavigationOptions = {
    initialSlide?: number
    speed?: number
    mouseWheel?: boolean
    keyboardNavigation?: boolean
    autoplay?: boolean
    autoplayInterval?: number
    pauseOnHover?: boolean
    pauseOnFocus?: boolean
    loop?: boolean
}

type ComparisonOptions = {
    dividerPosition?: number
    comparisonMode?: "vertical" | "horizontal"
}

type AppearanceOptions = {
    centerBorderRadius?: number
    backgroundColor?: string
    buttonColor?: string
    dividerColor?: string
    textColor?: string
    descriptionColor?: string
    overlayOpacity?: number
}

type TypographyOptions = {
    fontFamily?: string
    titleFont?: FontValue
    descriptionFont?: FontValue
}

type AnimationOptions = {
    textAnimation?: "fadeUp" | "slideUp" | "fade" | "none"
    exitAnimation?: "fadeOut" | "slideDown" | "slideLeft" | "none"
    exitDuration?: number
    animateDividerOnAppear?: boolean
    appearDragDistance?: number
    appearDragDuration?: number
}

type SpotlightOptions = {
    enabled?: boolean
    defaultMode?: "slider" | "spotlight"
    size?: number
    edgeSoftness?: number
    togglePosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    toggleSize?: number
}

type SwiperInstance = Swiper

const FONT_FAMILY_OPTIONS = [
    "Inter",
    "Arial",
    "Helvetica Neue",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Trebuchet MS",
    "Courier New",
    "system-ui",
]

const FONT_STACKS: Record<string, string> = {
    Inter: "Inter, ui-sans-serif, system-ui, sans-serif",
    Arial: "Arial, Helvetica, sans-serif",
    "Helvetica Neue": '"Helvetica Neue", Helvetica, Arial, sans-serif',
    Georgia: "Georgia, serif",
    "Times New Roman": '"Times New Roman", Times, serif',
    Verdana: "Verdana, Geneva, sans-serif",
    "Trebuchet MS": '"Trebuchet MS", Arial, sans-serif',
    "Courier New": '"Courier New", Courier, monospace',
    "system-ui": "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
}

const DEFAULT_SLIDES: SlideItem[] = [
    {
        beforeImage:
            "https://bato-web-agency.github.io/bato-shared/img/double-slider/img1.jpg",
        afterImage:
            "https://bato-web-agency.github.io/bato-shared/img/double-slider/img1.jpg",
        altText: "Golden Silence",
        title: "Golden Silence",
        text: "Embrace the harmony of colors and calm.",
        comparisonMode: "global",
    },
    {
        beforeImage:
            "https://bato-web-agency.github.io/bato-shared/img/double-slider/img2.jpg",
        afterImage:
            "https://bato-web-agency.github.io/bato-shared/img/double-slider/img2.jpg",
        altText: "Frozen Majesty",
        title: "Frozen Majesty",
        text: "Touch the purity in every breath of frosty air.",
        comparisonMode: "global",
    },
]

function extractImageSrc(imageInput: any): string {
    if (!imageInput) return ""
    if (typeof imageInput === "string") return imageInput.trim()
    if (typeof imageInput === "object") {
        if (typeof imageInput.src === "string") return imageInput.src.trim()
        if (typeof imageInput.url === "string") return imageInput.url.trim()
        if (typeof imageInput.light === "string") return imageInput.light.trim()
        try {
            return String(imageInput.url || imageInput.src || "").trim()
        } catch (e) {
            return ""
        }
    }
    return ""
}

function normalizeSlides(
    slides?: SlideItem[],
    fallbackComparisonMode: "vertical" | "horizontal" = "vertical"
): NormalizedSlide[] {
    const source =
        Array.isArray(slides) && slides.length > 0 ? slides : DEFAULT_SLIDES

    return source.slice(0, 100).map((slide) => {
        const beforeImage = extractImageSrc(slide?.beforeImage)
        const afterImage = extractImageSrc(slide?.afterImage)
        const title = String(slide?.title ?? "").trim()
        const rawDividerPosition = slide?.dividerPosition
        const parsedDividerPosition = Number(rawDividerPosition)
        const hasDividerPosition =
            rawDividerPosition !== undefined &&
            rawDividerPosition !== null &&
            String(rawDividerPosition).trim() !== ""

        const itemMode = slide?.comparisonMode
        const resolvedComparisonMode =
            itemMode === "horizontal" || itemMode === "vertical"
                ? itemMode
                : fallbackComparisonMode

        return {
            beforeImage,
            afterImage,
            altText: String(slide?.altText || title),
            title,
            text: String(slide?.text || ""),
            dividerPosition:
                hasDividerPosition && Number.isFinite(parsedDividerPosition)
                    ? clamp(parsedDividerPosition, 0, 100)
                    : undefined,
            comparisonMode: resolvedComparisonMode,
        }
    })
}

function fontFamilyStack(value?: string) {
    const family = String(value || "Inter").trim()
    return FONT_STACKS[family] || family
}

function resolveFont(
    value: FontValue | undefined,
    fallback: ResolvedFont
): ResolvedFont {
    const source =
        typeof value === "string" ? { fontFamily: value } : value || {}

    return {
        family: fontFamilyStack(source.fontFamily || fallback.family),
        size:
            source.fontSize === undefined
                ? fallback.size
                : typeof source.fontSize === "number"
                  ? `${source.fontSize}px`
                  : String(source.fontSize),
        weight:
            source.fontWeight === undefined
                ? fallback.weight
                : String(source.fontWeight),
        lineHeight:
            source.lineHeight === undefined
                ? fallback.lineHeight
                : String(source.lineHeight),
        letterSpacing:
            source.letterSpacing === undefined
                ? fallback.letterSpacing
                : typeof source.letterSpacing === "number"
                  ? `${source.letterSpacing}px`
                  : String(source.letterSpacing),
    }
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, value))
}
/**
 * @framerDisableUnlink
 */
export default function ImageCompareSlide({
    slides: legacySlides,
    initialSlide: legacyInitialSlide,
    speed: legacySpeed,
    mouseWheel: legacyMouseWheel,
    keyboardNavigation: legacyKeyboardNavigation,
    autoplay: legacyAutoplay,
    autoplayInterval: legacyAutoplayInterval,
    pauseOnHover: legacyPauseOnHover,
    pauseOnFocus: legacyPauseOnFocus,
    loop: legacyLoop,
    animateDividerOnAppear: legacyAnimateDividerOnAppear,
    appearDragDistance: legacyAppearDragDistance,
    appearDragDuration: legacyAppearDragDuration,
    dividerPosition: legacyDividerPosition,
    comparisonMode: legacyComparisonMode,
    centerBorderRadius: legacyCenterBorderRadius,
    backgroundColor: legacyBackgroundColor,
    buttonColor: legacyButtonColor,
    dividerColor: legacyDividerColor,
    textColor: legacyTextColor,
    descriptionColor: legacyDescriptionColor,
    overlayOpacity: legacyOverlayOpacity,
    showButtons: legacyShowButtons,
    showLabels: legacyShowLabels,
    showText: legacyShowText,
    beforeLabel: legacyBeforeLabel,
    afterLabel: legacyAfterLabel,
    fontFamily: legacyFontFamily,
    titleFont: legacyTitleFont,
    descriptionFont: legacyDescriptionFont,
    textAnimation: legacyTextAnimation,
    exitAnimation: legacyExitAnimation,
    exitDuration: legacyExitDuration,
    content,
    navigation,
    comparison,
    appearance,
    typography,
    animation,
    spotlight,
    dataSource,
    connectBeforeImage,
    connectAfterImage,
    connectAltText,
    connectTitle,
    connectText,
    connectComparisonMode,
    connectDividerPosition,
}: ImageCompareSlideProps) {
    const isConnect = dataSource === "connect"

    // Stable primitives, so the memo below doesn't change identity every render
    // (a new array each render would re-trigger the reset/Swiper effects).
    const connectBeforeSrc = extractImageSrc(connectBeforeImage)
    const connectAfterSrc = extractImageSrc(connectAfterImage)

    const connectSlides = React.useMemo<SlideItem[]>(
        () => [
            {
                beforeImage: connectBeforeSrc,
                afterImage: connectAfterSrc,
                altText: connectAltText,
                title: connectTitle,
                text: connectText,
                comparisonMode: connectComparisonMode ?? "global",
                dividerPosition:
                    typeof connectDividerPosition === "number"
                        ? connectDividerPosition
                        : undefined,
            },
        ],
        [
            connectBeforeSrc,
            connectAfterSrc,
            connectAltText,
            connectTitle,
            connectText,
            connectComparisonMode,
            connectDividerPosition,
        ]
    )

    const slides = isConnect
        ? connectSlides
        : (content?.slides ?? legacySlides ?? DEFAULT_SLIDES)
    const initialSlide = navigation?.initialSlide ?? legacyInitialSlide ?? 0
    const speed = navigation?.speed ?? legacySpeed ?? 800
    const mouseWheel = navigation?.mouseWheel ?? legacyMouseWheel ?? false
    const keyboardNavigation =
        navigation?.keyboardNavigation ?? legacyKeyboardNavigation ?? false
    const autoplay = navigation?.autoplay ?? legacyAutoplay ?? false
    const autoplayInterval =
        navigation?.autoplayInterval ?? legacyAutoplayInterval ?? 4000
    const pauseOnHover = navigation?.pauseOnHover ?? legacyPauseOnHover ?? true
    const pauseOnFocus = navigation?.pauseOnFocus ?? legacyPauseOnFocus ?? true
    const loop = navigation?.loop ?? legacyLoop ?? false
    const animateDividerOnAppear =
        animation?.animateDividerOnAppear ??
        legacyAnimateDividerOnAppear ??
        false
    const appearDragDistance =
        animation?.appearDragDistance ?? legacyAppearDragDistance ?? 10
    const appearDragDuration =
        animation?.appearDragDuration ?? legacyAppearDragDuration ?? 900
    const dividerPosition =
        comparison?.dividerPosition ?? legacyDividerPosition ?? 50
    const comparisonMode =
        comparison?.comparisonMode ?? legacyComparisonMode ?? "vertical"
    const centerBorderRadius =
        appearance?.centerBorderRadius ?? legacyCenterBorderRadius ?? 0
    const backgroundColor =
        appearance?.backgroundColor ?? legacyBackgroundColor ?? "#111216"
    const buttonColor =
        appearance?.buttonColor ?? legacyButtonColor ?? "#ffffff"
    const dividerColor =
        appearance?.dividerColor ?? legacyDividerColor ?? "#ffffff"
    const textColor = appearance?.textColor ?? legacyTextColor ?? "#ffffff"
    const descriptionColor =
        appearance?.descriptionColor ??
        legacyDescriptionColor ??
        "rgba(255, 255, 255, .72)"
    const overlayOpacity =
        appearance?.overlayOpacity ?? legacyOverlayOpacity ?? 0.22
    // A connected item is a single comparison, so arrows make no sense there.
    const showButtons =
        !isConnect && (content?.showButtons ?? legacyShowButtons ?? true)
    const showLabels = content?.showLabels ?? legacyShowLabels ?? true
    const showText = content?.showText ?? legacyShowText ?? true
    const beforeLabel = content?.beforeLabel ?? legacyBeforeLabel ?? "BEFORE"
    const afterLabel = content?.afterLabel ?? legacyAfterLabel ?? "AFTER"
    const fontFamily = typography?.fontFamily ?? legacyFontFamily ?? "Inter"
    const titleFont = typography?.titleFont ?? legacyTitleFont
    const descriptionFont = typography?.descriptionFont ?? legacyDescriptionFont
    const textAnimation =
        animation?.textAnimation ?? legacyTextAnimation ?? "fadeUp"
    const exitAnimation =
        animation?.exitAnimation ?? legacyExitAnimation ?? "fadeOut"
    const exitDuration = animation?.exitDuration ?? legacyExitDuration ?? 260
    const spotlightEnabled = spotlight?.enabled ?? true
    const spotlightDefaultMode =
        spotlight?.defaultMode === "spotlight" ? "spotlight" : "slider"
    const spotlightSize = clamp(Number(spotlight?.size ?? 280), 80, 600)
    const spotlightEdgeSoftness = clamp(
        Number(spotlight?.edgeSoftness ?? 80),
        0,
        spotlightSize - 1
    )
    const spotlightTogglePosition = spotlight?.togglePosition ?? "top-right"
    const spotlightToggleSize = clamp(
        Number(spotlight?.toggleSize ?? 42),
        28,
        72
    )
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const comparisonSwiperRef = React.useRef<SwiperInstance | null>(null)
    const wheelLockRef = React.useRef(0)
    const contentExitTimerRef = React.useRef<ReturnType<
        typeof setTimeout
    > | null>(null)
    const appearanceAnimationFrameRef = React.useRef<number | null>(null)
    const spotlightAutoplayFrameRef = React.useRef<number | null>(null)
    const appearanceAnimationPlayedRef = React.useRef(false)
    const isHoveredRef = React.useRef(false)
    const isFocusedRef = React.useRef(false)

    const resolvedGlobalComparisonMode =
        comparisonMode === "horizontal" ? "horizontal" : "vertical"

    const normalizedSlides = React.useMemo(
        () => normalizeSlides(slides, resolvedGlobalComparisonMode),
        [slides, resolvedGlobalComparisonMode]
    )
    const lastSlideIndex = Math.max(0, normalizedSlides.length - 1)
    const resolvedInitialSlide = clamp(
        Math.floor(Number(initialSlide) || 0),
        0,
        lastSlideIndex
    )
    const resolvedSpeed = Math.max(0, Number(speed) || 0)
    const resolvedAutoplayInterval = clamp(
        Number(autoplayInterval) || 4000,
        1000,
        60000
    )
    const parsedAppearDragDistance = Number(appearDragDistance)
    const resolvedAppearDragDistance = clamp(
        Number.isFinite(parsedAppearDragDistance)
            ? parsedAppearDragDistance
            : 10,
        0,
        50
    )
    const parsedAppearDragDuration = Number(appearDragDuration)
    const resolvedAppearDragDuration = clamp(
        Number.isFinite(parsedAppearDragDuration)
            ? parsedAppearDragDuration
            : 900,
        300,
        3000
    )
    const resolvedDividerPosition = clamp(Number(dividerPosition) || 50, 0, 100)
    const resolvedExitAnimation =
        exitAnimation === "slideDown" ||
        exitAnimation === "slideLeft" ||
        exitAnimation === "none"
            ? exitAnimation
            : "fadeOut"
    const parsedExitDuration = Number(exitDuration)
    const resolvedExitDuration = clamp(
        Number.isFinite(parsedExitDuration) ? parsedExitDuration : 260,
        0,
        2000
    )
    const resolvedRadius = Math.max(0, Number(centerBorderRadius) || 0)
    const resolvedOverlayOpacity = clamp(Number(overlayOpacity) || 0, 0, 1)

    const resolvedTitleFont = resolveFont(titleFont, {
        family: fontFamilyStack(fontFamily),
        size: "clamp(34px, 5vw, 78px)",
        weight: "600",
        lineHeight: "0.96",
        letterSpacing: "-0.045em",
    })
    const resolvedDescriptionFont = resolveFont(descriptionFont, {
        family: fontFamilyStack(fontFamily),
        size: "clamp(14px, 1.35vw, 19px)",
        weight: "400",
        lineHeight: "1.5",
        letterSpacing: "0",
    })

    const [activeIndex, setActiveIndex] = React.useState(resolvedInitialSlide)
    const [contentIndex, setContentIndex] = React.useState(resolvedInitialSlide)
    const [contentPhase, setContentPhase] = React.useState<"enter" | "exit">(
        "enter"
    )
    const initialComparisonPosition =
        normalizedSlides[resolvedInitialSlide]?.dividerPosition ??
        resolvedDividerPosition
    const [comparisonPosition, setComparisonPosition] = React.useState(
        initialComparisonPosition
    )
    const comparisonPositionRef = React.useRef(initialComparisonPosition)
    const [comparisonView, setComparisonView] = React.useState<
        "slider" | "spotlight"
    >(spotlightDefaultMode)
    const [spotlightPosition, setSpotlightPosition] = React.useState({
        x: 50,
        y: 50,
    })
    const spotlightPositionRef = React.useRef({ x: 50, y: 50 })
    const [isDragging, setIsDragging] = React.useState(false)
    const [isBeginning, setIsBeginning] = React.useState(
        resolvedInitialSlide === 0
    )
    const [isEnd, setIsEnd] = React.useState(
        loop ? false : resolvedInitialSlide === lastSlideIndex
    )

    const activeSlide = normalizedSlides[activeIndex] || normalizedSlides[0]
    const currentComparisonMode = activeSlide.comparisonMode
    const isSpotlightMode = spotlightEnabled && comparisonView === "spotlight"

    React.useEffect(() => {
        comparisonPositionRef.current = comparisonPosition
    }, [comparisonPosition])

    React.useEffect(() => {
        setComparisonView(spotlightEnabled ? spotlightDefaultMode : "slider")
    }, [spotlightEnabled, spotlightDefaultMode])

    const dividerPositionForSlide = React.useCallback(
        (index: number) =>
            normalizedSlides[index]?.dividerPosition ?? resolvedDividerPosition,
        [normalizedSlides, resolvedDividerPosition]
    )

    const cancelAppearanceAnimation = React.useCallback(() => {
        if (appearanceAnimationFrameRef.current !== null) {
            cancelAnimationFrame(appearanceAnimationFrameRef.current)
            appearanceAnimationFrameRef.current = null
        }
    }, [])

    // Dedicated canceller for the spotlight demo/appear animation loop.
    // Anything that represents *real user input* on the spotlight (pointer
    // down/move) must call this first, otherwise the scripted left-right-center
    // demo sweep keeps overwriting the position on every animation frame.
    const cancelSpotlightAnimation = React.useCallback(() => {
        if (spotlightAutoplayFrameRef.current !== null) {
            cancelAnimationFrame(spotlightAutoplayFrameRef.current)
            spotlightAutoplayFrameRef.current = null
        }
    }, [])

    const animateDividerTo = React.useCallback(
        (targetPosition: number) => {
            cancelAppearanceAnimation()

            if (
                isStaticRenderer ||
                !animateDividerOnAppear ||
                resolvedAppearDragDuration <= 0
            ) {
                comparisonPositionRef.current = targetPosition
                setComparisonPosition(targetPosition)
                return
            }

            const startPosition = comparisonPositionRef.current
            const startedAt = performance.now()

            const animate = (now: number) => {
                const progress = clamp(
                    (now - startedAt) / resolvedAppearDragDuration,
                    0,
                    1
                )
                const eased = progress * progress * (3 - 2 * progress)
                const nextPosition =
                    startPosition + (targetPosition - startPosition) * eased

                comparisonPositionRef.current = nextPosition
                setComparisonPosition(nextPosition)

                if (progress < 1) {
                    appearanceAnimationFrameRef.current =
                        requestAnimationFrame(animate)
                } else {
                    comparisonPositionRef.current = targetPosition
                    setComparisonPosition(targetPosition)
                    appearanceAnimationFrameRef.current = null
                }
            }

            appearanceAnimationFrameRef.current = requestAnimationFrame(animate)
        },
        [
            animateDividerOnAppear,
            cancelAppearanceAnimation,
            clamp,
            isStaticRenderer,
            resolvedAppearDragDuration,
        ]
    )

    const animateSpotlightTo = React.useCallback(
        (target: { x: number; y: number }) => {
            cancelSpotlightAnimation()
            if (
                isStaticRenderer ||
                !animateDividerOnAppear ||
                resolvedAppearDragDuration <= 0
            ) {
                spotlightPositionRef.current = target
                setSpotlightPosition(target)
                return
            }
            const start = spotlightPositionRef.current
            const startedAt = performance.now()
            const animate = (now: number) => {
                const progress = clamp(
                    (now - startedAt) / resolvedAppearDragDuration,
                    0,
                    1
                )
                const eased = progress * progress * (3 - 2 * progress)
                const nextPosition = {
                    x: start.x + (target.x - start.x) * eased,
                    y: start.y + (target.y - start.y) * eased,
                }
                spotlightPositionRef.current = nextPosition
                setSpotlightPosition(nextPosition)
                if (progress < 1) {
                    spotlightAutoplayFrameRef.current =
                        requestAnimationFrame(animate)
                } else {
                    spotlightPositionRef.current = target
                    setSpotlightPosition(target)
                    spotlightAutoplayFrameRef.current = null
                }
            }
            spotlightAutoplayFrameRef.current = requestAnimationFrame(animate)
        },
        [
            animateDividerOnAppear,
            cancelSpotlightAnimation,
            clamp,
            isStaticRenderer,
            resolvedAppearDragDuration,
        ]
    )

    const animateDividerOnSlideChange = React.useCallback(
        (targetPosition: number) => {
            if (!animateDividerOnAppear) {
                animateDividerTo(targetPosition)
                return
            }
            const pulseTarget = clamp(
                targetPosition +
                    (targetPosition <= 50
                        ? resolvedAppearDragDistance
                        : -resolvedAppearDragDistance),
                0,
                100
            )
            animateDividerTo(pulseTarget)
            window.setTimeout(
                () => animateDividerTo(targetPosition),
                resolvedAppearDragDuration
            )
        },
        [
            animateDividerOnAppear,
            animateDividerTo,
            clamp,
            resolvedAppearDragDistance,
            resolvedAppearDragDuration,
        ]
    )

    const animateSpotlightOnSlideChange = React.useCallback(() => {
        if (!animateDividerOnAppear || !isSpotlightMode) return
        const duration = resolvedAppearDragDuration
        animateSpotlightTo({ x: 28, y: 50 })
        window.setTimeout(() => animateSpotlightTo({ x: 72, y: 50 }), duration)
        window.setTimeout(
            () => animateSpotlightTo({ x: 50, y: 50 }),
            duration * 2
        )
    }, [
        animateDividerOnAppear,
        animateSpotlightTo,
        isSpotlightMode,
        resolvedAppearDragDuration,
    ])

    React.useEffect(() => {
        const nextInitialSlide = clamp(
            Math.floor(Number(initialSlide) || 0),
            0,
            lastSlideIndex
        )
        if (contentExitTimerRef.current) {
            clearTimeout(contentExitTimerRef.current)
            contentExitTimerRef.current = null
        }
        setActiveIndex(nextInitialSlide)
        setContentIndex(nextInitialSlide)
        setContentPhase("enter")
        comparisonPositionRef.current =
            dividerPositionForSlide(nextInitialSlide)
        setComparisonPosition(comparisonPositionRef.current)
        setIsBeginning(loop ? false : nextInitialSlide === 0)
        setIsEnd(loop ? false : nextInitialSlide === lastSlideIndex)
        if (loop) {
            comparisonSwiperRef.current?.slideToLoop(nextInitialSlide, 0)
        } else {
            comparisonSwiperRef.current?.slideTo(nextInitialSlide, 0)
        }
    }, [
        dividerPositionForSlide,
        initialSlide,
        lastSlideIndex,
        loop,
        normalizedSlides,
        resolvedDividerPosition,
    ])

    React.useEffect(() => {
        if (
            isStaticRenderer ||
            !animateDividerOnAppear ||
            appearanceAnimationPlayedRef.current ||
            normalizedSlides.length === 0
        )
            return

        appearanceAnimationPlayedRef.current = true
        const startPosition = dividerPositionForSlide(resolvedInitialSlide)
        const direction = startPosition <= 50 ? 1 : -1
        const availableDistance =
            direction > 0 ? 100 - startPosition : startPosition
        const distance = Math.min(resolvedAppearDragDistance, availableDistance)
        if (distance <= 0 || resolvedAppearDragDuration <= 0) return

        const targetPosition = startPosition + direction * distance
        const startedAt = performance.now()
        const animate = (now: number) => {
            const progress = clamp(
                (now - startedAt) / resolvedAppearDragDuration,
                0,
                1
            )
            const pulse = progress < 0.5 ? progress * 2 : (1 - progress) * 2
            const easedPulse = pulse * pulse * (3 - 2 * pulse)
            setComparisonPosition(
                startPosition + (targetPosition - startPosition) * easedPulse
            )

            if (progress < 1) {
                appearanceAnimationFrameRef.current =
                    requestAnimationFrame(animate)
            } else {
                setComparisonPosition(startPosition)
                appearanceAnimationFrameRef.current = null
            }
        }

        appearanceAnimationFrameRef.current = requestAnimationFrame(animate)

        return cancelAppearanceAnimation
    }, [
        animateDividerOnAppear,
        cancelAppearanceAnimation,
        dividerPositionForSlide,
        isStaticRenderer,
        normalizedSlides.length,
        resolvedAppearDragDistance,
        resolvedAppearDragDuration,
        resolvedInitialSlide,
    ])

    React.useEffect(() => {
        cancelSpotlightAnimation()
        if (isStaticRenderer || !animateDividerOnAppear || !isSpotlightMode)
            return

        let cancelled = false
        let timeout: ReturnType<typeof setTimeout> | null = null
        const moveTo = (target: { x: number; y: number }, duration: number) =>
            new Promise<void>((resolve) => {
                const start = spotlightPositionRef.current
                const startedAt = performance.now()
                const tick = (now: number) => {
                    if (cancelled) return resolve()
                    const progress = clamp((now - startedAt) / duration, 0, 1)
                    const eased = progress * progress * (3 - 2 * progress)
                    const nextPosition = {
                        x: start.x + (target.x - start.x) * eased,
                        y: start.y + (target.y - start.y) * eased,
                    }
                    spotlightPositionRef.current = nextPosition
                    setSpotlightPosition(nextPosition)
                    if (progress < 1) {
                        spotlightAutoplayFrameRef.current =
                            requestAnimationFrame(tick)
                    } else {
                        spotlightAutoplayFrameRef.current = null
                        resolve()
                    }
                }
                spotlightAutoplayFrameRef.current = requestAnimationFrame(tick)
            })

        timeout = setTimeout(async () => {
            await moveTo({ x: 28, y: 50 }, resolvedAppearDragDuration)
            if (cancelled) return
            await moveTo({ x: 72, y: 50 }, resolvedAppearDragDuration)
            if (cancelled) return
            await moveTo(
                { x: 50, y: 50 },
                Math.max(240, resolvedAppearDragDuration * 0.85)
            )
        }, 0)

        return () => {
            cancelled = true
            if (timeout) clearTimeout(timeout)
            cancelSpotlightAnimation()
        }
    }, [
        animateDividerOnAppear,
        cancelSpotlightAnimation,
        clamp,
        isSpotlightMode,
        isStaticRenderer,
        resolvedAppearDragDuration,
    ])

    React.useEffect(() => {
        if (
            isStaticRenderer ||
            !rootRef.current ||
            normalizedSlides.length === 0
        )
            return

        const swiperElement =
            rootRef.current.querySelector<HTMLElement>(".comparison-swiper")
        const interactionTarget = rootRef.current
        if (!swiperElement || !interactionTarget) return

        let isInViewport = typeof IntersectionObserver === "undefined"
        const visibilityObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(([entry]) => {
                      isInViewport = entry.isIntersecting
                  })
                : null
        visibilityObserver?.observe(interactionTarget)

        const updateState = (swiper: SwiperInstance) => {
            setIsBeginning(Boolean(swiper.isBeginning))
            setIsEnd(Boolean(swiper.isEnd))
        }

        const comparisonSwiper = new Swiper(swiperElement, {
            slidesPerView: 1,
            loop: Boolean(loop),
            allowTouchMove: false,
            simulateTouch: false,
            noSwiping: true,
            // Mode changes can recreate Swiper. Keep the currently active
            // slide instead of jumping back to the configured initial slide.
            initialSlide: activeIndex,
            speed: resolvedSpeed,
            on: {
                init(swiper: SwiperInstance) {
                    updateState(swiper)
                },
                slideChange(swiper: SwiperInstance) {
                    updateState(swiper)
                    const nextIndex = Number(
                        swiper.realIndex ?? swiper.activeIndex ?? 0
                    )
                    setActiveIndex(nextIndex)
                    setContentPhase("exit")
                    animateDividerOnSlideChange(
                        dividerPositionForSlide(nextIndex)
                    )
                    animateSpotlightOnSlideChange()

                    if (contentExitTimerRef.current)
                        clearTimeout(contentExitTimerRef.current)
                    contentExitTimerRef.current = setTimeout(() => {
                        setContentIndex(nextIndex)
                        setContentPhase("enter")
                        contentExitTimerRef.current = null
                    }, resolvedExitDuration)
                },
            },
        })

        comparisonSwiperRef.current = comparisonSwiper
        updateState(comparisonSwiper)

        const handleWheel = (event: WheelEvent) => {
            if (!mouseWheel || comparisonSwiper.destroyed) return

            const delta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY
            if (!delta || Math.abs(delta) < 8) return

            event.preventDefault()
            event.stopPropagation()

            const now = Date.now()
            if (now < wheelLockRef.current) return
            wheelLockRef.current =
                now + Math.max(260, Math.min(1000, resolvedSpeed || 450))

            if (delta > 0) {
                if (!comparisonSwiper.isEnd || loop)
                    comparisonSwiper.slideNext()
            } else if (!comparisonSwiper.isBeginning || loop) {
                comparisonSwiper.slidePrev()
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!keyboardNavigation || comparisonSwiper.destroyed) return

            const target = event.target as HTMLElement | null
            if (
                target?.matches(
                    'input, textarea, select, [contenteditable="true"]'
                )
            )
                return

            if (event.key === "ArrowRight") {
                event.preventDefault()
                event.stopPropagation()
                if (!comparisonSwiper.isEnd || loop)
                    comparisonSwiper.slideNext()
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()
                event.stopPropagation()
                if (!comparisonSwiper.isBeginning || loop)
                    comparisonSwiper.slidePrev()
            }
        }

        const advanceAutoplay = () => {
            if (!autoplay || comparisonSwiper.destroyed) return
            if (!isInViewport) return
            if (pauseOnHover && isHoveredRef.current) return
            if (pauseOnFocus && isFocusedRef.current) return
            if (!loop && comparisonSwiper.isEnd) return
            comparisonSwiper.slideNext()
        }

        let autoplayTimer: ReturnType<typeof setInterval> | null = null
        if (autoplay) {
            autoplayTimer = setInterval(
                advanceAutoplay,
                resolvedAutoplayInterval
            )
        }

        if (mouseWheel)
            interactionTarget.addEventListener("wheel", handleWheel, {
                passive: false,
            })
        if (keyboardNavigation)
            interactionTarget.addEventListener("keydown", handleKeyDown)

        return () => {
            if (autoplayTimer) clearInterval(autoplayTimer)
            visibilityObserver?.disconnect()
            if (mouseWheel)
                interactionTarget.removeEventListener("wheel", handleWheel)
            if (keyboardNavigation)
                interactionTarget.removeEventListener("keydown", handleKeyDown)
            if (contentExitTimerRef.current) {
                clearTimeout(contentExitTimerRef.current)
                contentExitTimerRef.current = null
            }
            comparisonSwiperRef.current = null
            comparisonSwiper.destroy(true, true)
        }
    }, [
        autoplay,
        dividerPositionForSlide,
        isStaticRenderer,
        keyboardNavigation,
        loop,
        mouseWheel,
        normalizedSlides,
        pauseOnFocus,
        pauseOnHover,
        resolvedAutoplayInterval,
        resolvedDividerPosition,
        resolvedExitDuration,
        resolvedInitialSlide,
        resolvedSpeed,
        animateDividerOnSlideChange,
        animateSpotlightOnSlideChange,
    ])

    const contentSlide = normalizedSlides[contentIndex] || normalizedSlides[0]
    const animationClass = isStaticRenderer
        ? "text-animation-none"
        : contentPhase === "exit"
          ? `text-exit-${resolvedExitAnimation}`
          : `text-animation-${textAnimation}`

    const movePrevious = React.useCallback(() => {
        const swiper = comparisonSwiperRef.current
        if (!swiper || swiper.destroyed || (!loop && swiper.isBeginning)) return
        swiper.slidePrev()
    }, [loop])

    const moveNext = React.useCallback(() => {
        const swiper = comparisonSwiperRef.current
        if (!swiper || swiper.destroyed || (!loop && swiper.isEnd)) return
        swiper.slideNext()
    }, [loop])

    const updateSpotlightPosition = React.useCallback(
        (clientX: number, clientY: number) => {
            // A real cursor position always wins over the scripted demo sweep.
            cancelSpotlightAnimation()
            const viewport =
                rootRef.current?.querySelector<HTMLElement>(
                    ".comparison-viewport-active"
                ) ||
                rootRef.current?.querySelector<HTMLElement>(
                    ".comparison-viewport"
                )
            if (!viewport) return
            const bounds = viewport.getBoundingClientRect()
            if (!bounds.width || !bounds.height) return
            const nextPosition = {
                x: clamp(
                    ((clientX - bounds.left) / bounds.width) * 100,
                    0,
                    100
                ),
                y: clamp(
                    ((clientY - bounds.top) / bounds.height) * 100,
                    0,
                    100
                ),
            }
            spotlightPositionRef.current = nextPosition
            setSpotlightPosition(nextPosition)
        },
        [cancelSpotlightAnimation]
    )

    const updateComparisonPosition = React.useCallback(
        (clientX: number, clientY: number) => {
            const viewport =
                rootRef.current?.querySelector<HTMLElement>(
                    ".comparison-viewport-active"
                ) ||
                rootRef.current?.querySelector<HTMLElement>(
                    ".comparison-viewport"
                )
            if (!viewport) return

            const bounds = viewport.getBoundingClientRect()
            const size =
                currentComparisonMode === "horizontal"
                    ? bounds.height
                    : bounds.width
            if (!size) return

            const offset =
                currentComparisonMode === "horizontal"
                    ? clientY - bounds.top
                    : clientX - bounds.left
            setComparisonPosition(clamp((offset / size) * 100, 0, 100))
        },
        [currentComparisonMode]
    )

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        cancelAppearanceAnimation()
        cancelSpotlightAnimation()
        event.preventDefault()
        event.stopPropagation()
        if (isSpotlightMode) {
            updateSpotlightPosition(event.clientX, event.clientY)
            return
        }
        setIsDragging(true)
        event.currentTarget.setPointerCapture?.(event.pointerId)
        updateComparisonPosition(event.clientX, event.clientY)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isSpotlightMode) {
            updateSpotlightPosition(event.clientX, event.clientY)
            return
        }
        if (isDragging) {
            event.preventDefault()
            event.stopPropagation()
            updateComparisonPosition(event.clientX, event.clientY)
        }
    }

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation()
        setIsDragging(false)
        event.currentTarget.releasePointerCapture?.(event.pointerId)
    }

    return (
        <div
            ref={rootRef}
            className={`before-after-slider comparison-carousel comparison-mode-${currentComparisonMode} ${isSpotlightMode ? "comparison-spotlight-mode" : ""} ${isDragging ? "is-dragging" : ""}`}
            tabIndex={keyboardNavigation || pauseOnFocus ? 0 : undefined}
            aria-label="Before and after comparison carousel"
            onMouseEnter={() => {
                isHoveredRef.current = true
            }}
            onMouseLeave={() => {
                isHoveredRef.current = false
            }}
            onFocusCapture={() => {
                isFocusedRef.current = true
            }}
            onBlurCapture={(event) => {
                const nextTarget = event.relatedTarget as Node | null
                if (!nextTarget || !rootRef.current?.contains(nextTarget)) {
                    isFocusedRef.current = false
                }
            }}
            style={
                {
                    "--slider-background": backgroundColor,
                    "--button-color": buttonColor,
                    "--divider-color": dividerColor,
                    "--text-color": textColor,
                    "--description-color": descriptionColor,
                    "--comparison-radius": `${resolvedRadius}px`,
                    "--comparison-position": `${comparisonPosition}%`,
                    "--comparison-cursor": isSpotlightMode
                        ? "crosshair"
                        : currentComparisonMode === "horizontal"
                          ? "ns-resize"
                          : "ew-resize",
                    "--overlay-opacity": resolvedOverlayOpacity,
                    "--exit-duration": `${resolvedExitDuration}ms`,
                    "--title-font-family": resolvedTitleFont.family,
                    "--title-font-size": resolvedTitleFont.size,
                    "--title-font-weight": resolvedTitleFont.weight,
                    "--title-line-height": resolvedTitleFont.lineHeight,
                    "--title-letter-spacing": resolvedTitleFont.letterSpacing,
                    "--description-font-family": resolvedDescriptionFont.family,
                    "--description-font-size": resolvedDescriptionFont.size,
                    "--description-font-weight": resolvedDescriptionFont.weight,
                    "--description-line-height":
                        resolvedDescriptionFont.lineHeight,
                    "--description-letter-spacing":
                        resolvedDescriptionFont.letterSpacing,
                } as React.CSSProperties
            }
        >
            <style>{`
                .before-after-slider.comparison-carousel {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 520px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-sizing: border-box;
                    isolation: isolate;
                    background: var(--slider-background);
                    color: var(--text-color);
                    font-family: var(--description-font-family);
                }

                .before-after-slider.comparison-carousel,
                .before-after-slider.comparison-carousel * {
                    box-sizing: border-box;
                }

                .comparison-carousel .comparison-swiper {
                    position: relative;
                    width: 100%;
                    flex: 1;
                    min-height: 400px;
                    z-index: 1;
                    overflow: hidden;
                }

                .comparison-carousel .swiper-wrapper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                }

                .comparison-carousel .swiper-slide {
                    position: relative;
                    flex-shrink: 0;
                    width: 100%;
                    height: 100%;
                    min-height: 100%;
                    overflow: hidden;
                    user-select: none;
                }

                .comparison-carousel .comparison-viewport {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    border-radius: var(--comparison-radius);
                    cursor: var(--comparison-cursor);
                    touch-action: none;
                    isolation: isolate;
                }

                .comparison-carousel .comparison-image,
                .comparison-carousel .comparison-before-layer {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                }

                .comparison-carousel .comparison-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    pointer-events: none;
                    user-select: none;
                }

                .comparison-carousel .comparison-after-image {
                    z-index: 1;
                }

                .comparison-carousel .comparison-before-layer {
                    z-index: 2;
                    overflow: hidden;
                    clip-path: inset(0 calc(100% - var(--comparison-position)) 0 0);
                }
                .comparison-carousel.comparison-spotlight-mode .comparison-before-layer {
                    z-index: 2;
                    clip-path: none;
                    -webkit-clip-path: none;
                }

                .comparison-carousel.comparison-mode-horizontal .comparison-before-layer {
                    clip-path: inset(0 0 calc(100% - var(--comparison-position)) 0);
                }

                .comparison-carousel .comparison-before-image {
                    z-index: 2;
                }

                .comparison-carousel .comparison-shade {
                    position: absolute;
                    inset: 0;
                    z-index: 3;
                    pointer-events: none;
                    background: linear-gradient(180deg, rgba(0, 0, 0, .08), transparent 36%, rgba(0, 0, 0, var(--overlay-opacity)) 100%);
                }

                .comparison-carousel .comparison-divider {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: var(--comparison-position);
                    z-index: 20;
                    width: 2px;
                    background: linear-gradient(to bottom, transparent, var(--divider-color) 20%, var(--divider-color) 80%, transparent);
                    box-shadow: 0 0 12px rgba(255, 255, 255, 0.4), 0 0 4px rgba(0, 0, 0, 0.6);
                    pointer-events: none;
                    transform: translateX(-50%);
                }

                .comparison-carousel.comparison-mode-horizontal .comparison-divider {
                    top: var(--comparison-position);
                    right: 0;
                    bottom: auto;
                    left: 0;
                    width: auto;
                    height: 2px;
                    background: linear-gradient(to right, transparent, var(--divider-color) 20%, var(--divider-color) 80%, transparent);
                    transform: translateY(-50%);
                }

                .comparison-carousel .comparison-divider-handle {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 64px;
                    height: 36px;
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    border-radius: 999px;
                    color: var(--divider-color);
                    background: rgba(20, 20, 24, 0.65);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    transform: translate(-50%, -50%);
                    transition: transform 200ms cubic-bezier(.2, .8, .2, 1), background 200ms ease;
                }

                .comparison-carousel .comparison-viewport:hover .comparison-divider-handle {
                    transform: translate(-50%, -50%) scale(1.06);
                    background: rgba(20, 20, 24, 0.85);
                }

                .comparison-carousel .comparison-divider-handle::before,
                .comparison-carousel .comparison-divider-handle::after {
                    content: "";
                    width: 7px;
                    height: 7px;
                    border-top: 2px solid currentColor;
                    border-right: 2px solid currentColor;
                }

                .comparison-carousel .comparison-divider-handle::before {
                    transform: rotate(-135deg);
                }

                .comparison-carousel .comparison-divider-handle::after {
                    transform: rotate(45deg);
                }

                .comparison-carousel.comparison-mode-horizontal .comparison-divider-handle {
                    flex-direction: column;
                    gap: 6px;
                    width: 36px;
                    height: 64px;
                }

                .comparison-carousel.comparison-mode-horizontal .comparison-divider-handle::before {
                    transform: rotate(-45deg);
                }

                .comparison-carousel.comparison-mode-horizontal .comparison-divider-handle::after {
                    transform: rotate(135deg);
                }

                /* REDESIGNED BADGES */
                .comparison-carousel .comparison-label-row {
                    position: absolute;
                    right: 32px;
                    bottom: 32px;
                    left: 32px;
                    z-index: 15;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    pointer-events: none;
                }

                .comparison-carousel .comparison-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 12px;
                    color: #ffffff;
                    background: rgba(15, 15, 20, 0.45);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    font-family: var(--description-font-family);
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .12em;
                    line-height: 1;
                    text-transform: uppercase;
                    transition: transform 250ms ease, background 250ms ease;
                }

                .comparison-carousel .comparison-label::before {
                    content: "";
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: var(--button-color);
                    box-shadow: 0 0 8px var(--button-color);
                }

                .comparison-carousel .spotlight-toggle {
                    position: absolute;
                    z-index: 40;
                    display: grid;
                    place-items: center;
                    padding: 0;
                    border: 1px solid rgba(255, 255, 255, .2);
                    border-radius: 12px;
                    color: #fff;
                    background: rgba(10, 10, 10, .58);
                    backdrop-filter: blur(14px);
                    -webkit-backdrop-filter: blur(14px);
                    box-shadow: 0 5px 20px rgba(0, 0, 0, .2);
                    font-size: 22px;
                    line-height: 1;
                    cursor: pointer;
                    transition: transform 180ms ease, background 180ms ease;
                }

                .comparison-carousel .spotlight-toggle:hover,
                .comparison-carousel .spotlight-toggle:focus-visible {
                    background: rgba(255, 255, 255, .22);
                    transform: scale(1.06);
                    outline: none;
                }

                .comparison-carousel .comparison-content {
                    position: absolute;
                    left: 50%;
                    bottom: 32px;
                    z-index: 16;
                    width: min(680px, calc(100% - 120px));
                    text-align: center;
                    pointer-events: none;
                    transform: translateX(-50%);
                }

                .comparison-carousel .comparison-content.text-animation-fadeUp {
                    animation: comparisonTextFadeUp 520ms cubic-bezier(.2, .8, .2, 1) both;
                }

                .comparison-carousel .comparison-content.text-animation-slideUp {
                    animation: comparisonTextSlideUp 520ms cubic-bezier(.2, .8, .2, 1) both;
                }

                .comparison-carousel .comparison-content.text-animation-fade {
                    animation: comparisonTextFade 420ms ease-out both;
                }

                .comparison-carousel .comparison-content.text-animation-none {
                    animation: none;
                }

                .comparison-carousel .comparison-content.text-exit-fadeOut {
                    animation: comparisonTextFadeOut var(--exit-duration) ease-in both;
                }

                .comparison-carousel .comparison-content.text-exit-slideDown {
                    animation: comparisonTextSlideDown var(--exit-duration) cubic-bezier(.4, 0, 1, 1) both;
                }

                .comparison-carousel .comparison-content.text-exit-slideLeft {
                    animation: comparisonTextSlideLeft var(--exit-duration) cubic-bezier(.4, 0, 1, 1) both;
                }

                .comparison-carousel .comparison-content.text-exit-none {
                    animation: none;
                }

                .comparison-carousel .comparison-title {
                    margin: 0;
                    text-align: center;
                    color: var(--text-color);
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: var(--title-font-weight);
                    letter-spacing: var(--title-letter-spacing);
                    line-height: var(--title-line-height);
                    text-wrap: balance;
                    text-shadow: 0 4px 22px rgba(0, 0, 0, .32);
                    text-transform: uppercase;
                }

                .comparison-carousel .comparison-text {
                    max-width: 620px;
                    margin: 18px auto 0;
                    text-align: center;
                    color: var(--description-color);
                    font-family: var(--description-font-family);
                    font-size: var(--description-font-size);
                    font-weight: var(--description-font-weight);
                    letter-spacing: var(--description-letter-spacing);
                    line-height: var(--description-line-height);
                    text-shadow: 0 2px 14px rgba(0, 0, 0, .35);
                }

                .comparison-carousel .slider-actions {
                    position: absolute;
                    inset: 0;
                    z-index: 30;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    pointer-events: none;
                }

                .comparison-carousel .slider-button {
                    display: ${showButtons ? "flex" : "none"};
                    align-items: center;
                    justify-content: center;
                    width: 48px;
                    height: 48px;
                    padding: 0;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    color: var(--button-color);
                    background: rgba(20, 20, 24, 0.55);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                    pointer-events: auto;
                    transition: transform 200ms cubic-bezier(.2, .8, .2, 1), background 200ms ease, border-color 200ms ease, color 200ms ease;
                }

                .comparison-carousel .slider-button svg {
                    width: 20px;
                    height: 20px;
                    fill: none;
                    stroke: currentColor;
                    stroke-width: 2;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    transition: transform 200ms ease;
                }

                .comparison-carousel .slider-button.prev:hover svg {
                    transform: translateX(-2px);
                }

                .comparison-carousel .slider-button.next:hover svg {
                    transform: translateX(2px);
                }

                .comparison-carousel .slider-button:hover,
                .comparison-carousel .slider-button:focus-visible {
                    color: #111216;
                    background: var(--button-color);
                    border-color: var(--button-color);
                    transform: scale(1.08);
                }

                .comparison-carousel .slider-button:disabled {
                    opacity: .25;
                    pointer-events: none;
                    transform: none !important;
                }

                @keyframes comparisonTextFadeUp {
                    from {
                        opacity: 0;
                        transform: translate3d(-50%, 24px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(-50%, 0, 0);
                    }
                }

                @keyframes comparisonTextSlideUp {
                    from {
                        opacity: 0;
                        transform: translate3d(calc(-50% + 34px), 0, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(-50%, 0, 0);
                    }
                }

                @keyframes comparisonTextFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes comparisonTextFadeOut {
                    from { opacity: 1; transform: translate3d(-50%, 0, 0); }
                    to { opacity: 0; transform: translate3d(-50%, 10px, 0); }
                }

                @keyframes comparisonTextSlideDown {
                    from { opacity: 1; transform: translate3d(-50%, 0, 0); }
                    to { opacity: 0; transform: translate3d(-50%, 26px, 0); }
                }

                @keyframes comparisonTextSlideLeft {
                    from { opacity: 1; transform: translate3d(-50%, 0, 0); }
                    to { opacity: 0; transform: translate3d(calc(-50% - 32px), 0, 0); }
                }

                @media (max-width: 700px) {
                    .before-after-slider.comparison-carousel {
                        min-height: 460px;
                    }

                    .comparison-carousel .comparison-label-row {
                        right: 18px;
                        bottom: 18px;
                        left: 18px;
                    }

                    .comparison-carousel .comparison-label {
                        padding: 6px 12px;
                        font-size: 10px;
                    }

                    .comparison-carousel .comparison-content {
                        bottom: 24px;
                        width: calc(100% - 80px);
                    }

                    .comparison-carousel .comparison-text {
                        margin-top: 12px;
                    }

                    .comparison-carousel .slider-actions {
                        padding: 0 12px;
                    }

                    .comparison-carousel .slider-button {
                        width: 40px;
                        height: 40px;
                    }

                    .comparison-carousel .slider-button svg {
                        width: 16px;
                        height: 16px;
                    }

                    .comparison-carousel .comparison-divider-handle {
                        width: 52px;
                        height: 32px;
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .comparison-carousel .comparison-content,
                    .comparison-carousel .slider-button {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>

            <div
                className="comparison-swiper swiper"
                aria-label="Before and after image comparison"
            >
                <div className="swiper-wrapper">
                    {normalizedSlides
                        .filter(
                            (_, index) =>
                                !isStaticRenderer ||
                                index === resolvedInitialSlide
                        )
                        .map((slide, index) => {
                            const actualIndex = isStaticRenderer
                                ? resolvedInitialSlide
                                : index
                            const isCurrentActive = actualIndex === activeIndex
                            return (
                                <div
                                    className={`swiper-slide ${isCurrentActive ? "swiper-slide-active" : ""}`}
                                    key={`comparison-${actualIndex}`}
                                >
                                    <div
                                        className={`comparison-viewport ${isCurrentActive ? "comparison-viewport-active" : ""}`}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                        style={
                                            {
                                                "--comparison-position": `${comparisonPosition}%`,
                                            } as React.CSSProperties
                                        }
                                    >
                                        <img
                                            className={`comparison-image ${isSpotlightMode ? "comparison-before-image" : "comparison-after-image"}`}
                                            src={
                                                isSpotlightMode
                                                    ? slide.beforeImage
                                                    : slide.afterImage
                                            }
                                            alt={`${slide.altText} ${isSpotlightMode ? "before" : "after"}`}
                                            draggable={false}
                                        />
                                        <div
                                            className={`comparison-before-layer ${isSpotlightMode ? "comparison-spotlight-reveal" : ""}`}
                                            style={
                                                isSpotlightMode
                                                    ? ({
                                                          clipPath: "none",
                                                          WebkitClipPath:
                                                              "none",
                                                          maskImage: `radial-gradient(circle ${spotlightSize}px at ${spotlightPosition.x}% ${spotlightPosition.y}%, black ${Math.max(0, spotlightSize - spotlightEdgeSoftness)}px, transparent ${spotlightSize}px)`,
                                                          WebkitMaskImage: `radial-gradient(circle ${spotlightSize}px at ${spotlightPosition.x}% ${spotlightPosition.y}%, black ${Math.max(0, spotlightSize - spotlightEdgeSoftness)}px, transparent ${spotlightSize}px)`,
                                                          maskRepeat:
                                                              "no-repeat",
                                                          WebkitMaskRepeat:
                                                              "no-repeat",
                                                      } as React.CSSProperties)
                                                    : undefined
                                            }
                                        >
                                            <img
                                                className={`comparison-image ${isSpotlightMode ? "comparison-after-image" : "comparison-before-image"}`}
                                                src={
                                                    isSpotlightMode
                                                        ? slide.afterImage
                                                        : slide.beforeImage
                                                }
                                                alt={`${slide.altText} ${isSpotlightMode ? "after" : "before"}`}
                                                draggable={false}
                                            />
                                        </div>
                                        <div className="comparison-shade" />
                                        {!isSpotlightMode ? (
                                            <div
                                                className="comparison-divider"
                                                aria-hidden="true"
                                            >
                                                <span className="comparison-divider-handle" />
                                            </div>
                                        ) : null}

                                        {showLabels ? (
                                            <div className="comparison-label-row">
                                                <span className="comparison-label">
                                                    {beforeLabel}
                                                </span>
                                                <span className="comparison-label">
                                                    {afterLabel}
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>

            {showText ? (
                <div
                    className={`comparison-content ${animationClass}`}
                    key={`content-${activeIndex}`}
                >
                    <h2 className="comparison-title">{contentSlide.title}</h2>
                    {contentSlide.text ? (
                        <p className="comparison-text">{contentSlide.text}</p>
                    ) : null}
                </div>
            ) : null}

            {spotlightEnabled && !isStaticRenderer ? (
                <button
                    className="spotlight-toggle"
                    type="button"
                    aria-label={
                        isSpotlightMode
                            ? "Switch to slider comparison"
                            : "Switch to spotlight comparison"
                    }
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        cancelSpotlightAnimation()
                        setComparisonView((current) =>
                            current === "spotlight" ? "slider" : "spotlight"
                        )
                        setIsDragging(false)
                    }}
                    style={{
                        top: spotlightTogglePosition.startsWith("top")
                            ? 16
                            : undefined,
                        bottom: spotlightTogglePosition.startsWith("bottom")
                            ? 16
                            : undefined,
                        left: spotlightTogglePosition.endsWith("left")
                            ? 16
                            : undefined,
                        right: spotlightTogglePosition.endsWith("right")
                            ? 16
                            : undefined,
                        width: spotlightToggleSize,
                        height: spotlightToggleSize,
                    }}
                >
                    {isSpotlightMode ? "✦" : "↔"}
                </button>
            ) : null}

            <div className="slider-actions">
                <button
                    className="slider-button prev"
                    type="button"
                    aria-label="Previous comparison"
                    disabled={!showButtons || (isBeginning && !loop)}
                    onClick={movePrevious}
                >
                    <svg viewBox="0 0 24 24">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button
                    className="slider-button next"
                    type="button"
                    aria-label="Next comparison"
                    disabled={!showButtons || (isEnd && !loop)}
                    onClick={moveNext}
                >
                    <svg viewBox="0 0 24 24">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    )
}

;(ImageCompareSlide as any).defaultProps = {
    dataSource: "manual",
    content: {
        slides: DEFAULT_SLIDES,
        showButtons: true,
        showLabels: true,
        showText: true,
        beforeLabel: "BEFORE",
        afterLabel: "AFTER",
    },
    navigation: {
        initialSlide: 0,
        speed: 800,
        mouseWheel: false,
        keyboardNavigation: false,
        autoplay: false,
        autoplayInterval: 4000,
        pauseOnHover: true,
        pauseOnFocus: true,
        loop: false,
    },
    comparison: {
        dividerPosition: 50,
        comparisonMode: "vertical",
    },
    appearance: {
        centerBorderRadius: 0,
        backgroundColor: "#111216",
        buttonColor: "#ffffff",
        dividerColor: "#ffffff",
        textColor: "#ffffff",
        descriptionColor: "rgba(255, 255, 255, .72)",
        overlayOpacity: 0.22,
    },
    typography: {
        fontFamily: "Inter",
    },
    spotlight: {
        enabled: true,
        defaultMode: "slider",
        size: 280,
        edgeSoftness: 80,
        togglePosition: "top-right",
        toggleSize: 42,
    },
    animation: {
        textAnimation: "fadeUp",
        exitAnimation: "fadeOut",
        exitDuration: 260,
        animateDividerOnAppear: true,
        appearDragDistance: 10,
        appearDragDuration: 900,
    },
}

addPropertyControls(ImageCompareSlide, {
    dataSource: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "connect"],
        optionTitles: ["Manual", "Framer Connect"],
        defaultValue: "manual",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    connectBeforeImage: {
        type: ControlType.Image,
        title: "Before image",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectAfterImage: {
        type: ControlType.Image,
        title: "After image",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectAltText: {
        type: ControlType.String,
        title: "Alt text",
        defaultValue: "",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectTitle: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Comparison title",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectText: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Drag the divider to compare.",
        displayTextArea: true,
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectComparisonMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["global", "vertical", "horizontal"],
        optionTitles: ["Global Default", "Vertical", "Horizontal"],
        defaultValue: "global",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    connectDividerPosition: {
        type: ControlType.Number,
        title: "Divider position",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: any) => props.dataSource !== "connect",
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        buttonTitle: "Edit Content",
        defaultValue: {
            slides: DEFAULT_SLIDES,
            showButtons: true,
            showLabels: true,
            showText: true,
            beforeLabel: "BEFORE",
            afterLabel: "AFTER",
        },
        controls: {
            slides: {
                type: ControlType.Array,
                title: "Comparisons",
                control: {
                    type: ControlType.Object,
                    controls: {
                        beforeImage: {
                            type: ControlType.Image,
                            title: "Before image",
                        },
                        afterImage: {
                            type: ControlType.Image,
                            title: "After image",
                        },
                        altText: {
                            type: ControlType.String,
                            title: "Alt text",
                            defaultValue: "",
                        },
                        title: {
                            type: ControlType.String,
                            title: "Title",
                            defaultValue: "Comparison title",
                        },
                        text: {
                            type: ControlType.String,
                            title: "Description",
                            defaultValue: "Drag the divider to compare.",
                        },
                        comparisonMode: {
                            type: ControlType.Enum,
                            title: "Mode",
                            options: ["global", "vertical", "horizontal"],
                            optionTitles: [
                                "Global Default",
                                "Vertical",
                                "Horizontal",
                            ],
                            defaultValue: "global",
                        },
                        dividerPosition: {
                            type: ControlType.Number,
                            title: "Divider position",
                            min: 0,
                            max: 100,
                            step: 1,
                            defaultValue: undefined,
                            unit: "%",
                        },
                    },
                },
                defaultValue: DEFAULT_SLIDES,
            },
            showButtons: {
                type: ControlType.Boolean,
                title: "Show arrows",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            showLabels: {
                type: ControlType.Boolean,
                title: "Show labels",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            showText: {
                type: ControlType.Boolean,
                title: "Show text",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            beforeLabel: {
                type: ControlType.String,
                title: "Before label",
                defaultValue: "BEFORE",
            },
            afterLabel: {
                type: ControlType.String,
                title: "After label",
                defaultValue: "AFTER",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        buttonTitle: "Edit Navigation",
        defaultValue: {
            initialSlide: 0,
            speed: 800,
            mouseWheel: false,
            keyboardNavigation: false,
            autoplay: false,
            autoplayInterval: 4000,
            pauseOnHover: true,
            pauseOnFocus: true,
            loop: false,
        },
        controls: {
            initialSlide: {
                type: ControlType.Number,
                title: "Initial slide",
                min: 0,
                max: 99,
                step: 1,
                defaultValue: 0,
                displayStepper: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 3000,
                step: 50,
                defaultValue: 800,
                unit: "ms",
            },
            mouseWheel: {
                type: ControlType.Boolean,
                title: "Mouse wheel",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            keyboardNavigation: {
                type: ControlType.Boolean,
                title: "Keyboard navigation",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            autoplayInterval: {
                type: ControlType.Number,
                title: "Autoplay interval",
                min: 1000,
                max: 60000,
                step: 250,
                defaultValue: 4000,
                unit: "ms",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on hover",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            pauseOnFocus: {
                type: ControlType.Boolean,
                title: "Pause on focus",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop mode",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    comparison: {
        type: ControlType.Object,
        title: "Comparison",
        buttonTitle: "Edit Comparison",
        defaultValue: {
            dividerPosition: 50,
            comparisonMode: "vertical",
        },
        controls: {
            dividerPosition: {
                type: ControlType.Number,
                title: "Divider position",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 50,
                unit: "%",
            },
            comparisonMode: {
                type: ControlType.Enum,
                title: "Comparison mode",
                options: ["vertical", "horizontal"],
                optionTitles: ["Vertical", "Horizontal"],
                defaultValue: "vertical",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        buttonTitle: "Edit Appearance",
        defaultValue: {
            centerBorderRadius: 0,
            backgroundColor: "#111216",
            buttonColor: "#ffffff",
            dividerColor: "#ffffff",
            textColor: "#ffffff",
            descriptionColor: "rgba(255, 255, 255, .72)",
            overlayOpacity: 0.22,
        },
        controls: {
            centerBorderRadius: {
                type: ControlType.Number,
                title: "Border radius",
                min: 0,
                max: 160,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#111216",
            },
            buttonColor: {
                type: ControlType.Color,
                title: "Button color",
                defaultValue: "#ffffff",
            },
            dividerColor: {
                type: ControlType.Color,
                title: "Divider color",
                defaultValue: "#ffffff",
            },
            textColor: {
                type: ControlType.Color,
                title: "Title color",
                defaultValue: "#ffffff",
            },
            descriptionColor: {
                type: ControlType.Color,
                title: "Description color",
                defaultValue: "rgba(255, 255, 255, .72)",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Overlay opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.22,
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Edit Typography",
        defaultValue: {
            fontFamily: "Inter",
        },
        controls: {
            fontFamily: {
                type: ControlType.Enum,
                title: "Font family",
                options: FONT_FAMILY_OPTIONS,
                optionTitles: FONT_FAMILY_OPTIONS,
                defaultValue: "Inter",
            },
            titleFont: { type: ControlType.Font, title: "Title font" },
            descriptionFont: {
                type: ControlType.Font,
                title: "Description font",
            },
        },
    },
    spotlight: {
        type: ControlType.Object,
        title: "Spotlight",
        buttonTitle: "Edit Spotlight",
        defaultValue: {
            enabled: true,
            defaultMode: "slider",
            size: 280,
            edgeSoftness: 80,
            togglePosition: "top-right",
            toggleSize: 42,
        },
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show toggle",
                defaultValue: true,
            },
            defaultMode: {
                type: ControlType.Enum,
                title: "Default comparison",
                options: ["slider", "spotlight"],
                optionTitles: ["Slider", "Spotlight"],
                defaultValue: "slider",
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Spotlight size",
                min: 80,
                max: 600,
                step: 1,
                defaultValue: 280,
                unit: "px",
            },
            edgeSoftness: {
                type: ControlType.Number,
                title: "Edge softness",
                min: 0,
                max: 300,
                step: 1,
                defaultValue: 80,
                unit: "px",
            },
            togglePosition: {
                type: ControlType.Enum,
                title: "Toggle position",
                options: [
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                optionTitles: [
                    "Top left",
                    "Top right",
                    "Bottom left",
                    "Bottom right",
                ],
                defaultValue: "top-right",
            },
            toggleSize: {
                type: ControlType.Number,
                title: "Toggle size",
                min: 28,
                max: 72,
                step: 1,
                defaultValue: 42,
                unit: "px",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Edit Animation",
        defaultValue: {
            textAnimation: "fadeUp",
            exitAnimation: "fadeOut",
            exitDuration: 260,
            animateDividerOnAppear: true,
            appearDragDistance: 10,
            appearDragDuration: 900,
        },
        controls: {
            textAnimation: {
                type: ControlType.Enum,
                title: "Enter animation",
                options: ["fadeUp", "slideUp", "fade", "none"],
                optionTitles: ["Fade up", "Slide up", "Fade", "None"],
                defaultValue: "fadeUp",
            },
            exitAnimation: {
                type: ControlType.Enum,
                title: "Exit animation",
                options: ["fadeOut", "slideDown", "slideLeft", "none"],
                optionTitles: ["Fade out", "Slide down", "Slide left", "None"],
                defaultValue: "fadeOut",
            },
            exitDuration: {
                type: ControlType.Number,
                title: "Exit duration",
                min: 0,
                max: 2000,
                step: 10,
                defaultValue: 260,
                unit: "ms",
            },
            animateDividerOnAppear: {
                type: ControlType.Boolean,
                title: "Animate divider on appear",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            appearDragDistance: {
                type: ControlType.Number,
                title: "Appear drag distance",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 10,
                unit: "%",
            },
            appearDragDuration: {
                type: ControlType.Number,
                title: "Appear drag duration",
                min: 300,
                max: 3000,
                step: 50,
                defaultValue: 900,
                unit: "ms",
            },
        },
    },
})
