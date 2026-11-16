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
    image?: string
    altText?: string
    title?: string
    text?: string
    buttonLabel?: string
    buttonLink?: string
    backgroundColor?: string
}

type SwiperCMSItemProps = {
    visible?: unknown
    image?: unknown
    altText?: unknown
    title?: unknown
    text?: unknown
    buttonLabel?: unknown
    buttonLink?: unknown
    backgroundColor?: unknown
}

type NavigationOptions = {
    showPreviousButton?: boolean
    showNextButton?: boolean
    previousIcon?: string
    nextIcon?: string
    previousIconSvg?: string
    nextIconSvg?: string
    iconColor?: string
    background?: string
    borderColor?: string
    borderWidth?: number
    hoverBackground?: string
    hoverColor?: string
    size?: number
    iconSize?: number
    radius?: number
    offset?: number
    position?: "sides" | "bottom" | "top"
}

type CTAOptions = {
    background?: string
    color?: string
    hoverBackground?: string
    hoverColor?: string
    radius?: number
    design?: "solid" | "outline" | "glass" | "ghost"
    animation?: "none" | "lift" | "scale" | "shine" | "pulse"
    hoverAnimation?: "none" | "fade" | "fillLeft" | "fillRight" | "fillCenter"
    font?: FontValue
    transform?: "none" | "uppercase" | "lowercase" | "capitalize"
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

type ParallaxSwiperProps = {
    dataSource?: "Manual" | "CMS"
    cmsSlidesContent?: React.ReactNode
    slides?: SlideItem[]
    initialSlide?: number
    spaceBetween?: number
    speed?: number
    mouseWheel?: boolean
    keyboardNavigation?: boolean
    backgroundSlideSize?: number
    centeredSlideWidth?: number
    centeredSlideHeight?: number
    centerBorderRadius?: number
    backgroundBorderRadius?: number
    centerDesign?: "standard" | "polaroid" | "cellphone"
    mouseTilt?: boolean
    tiltStrength?: number
    depthEffect?: boolean
    parallaxAmount?: number
    showCenterShadow?: boolean
    centerShadow?: string
    backgroundColor?: string
    centerBackgroundColor?: string
    centerOverlayBackground?: string
    navigation?: NavigationOptions
    cta?: CTAOptions
    textColor?: string
    descriptionColor?: string
    titleFont?: FontValue
    descriptionFont?: FontValue
    textAnimation?: "mask" | "fadeUp" | "slideUp" | "fade" | "none"
}

type SwiperInstance = any

const DEFAULT_OVERLAY =
    "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)"

// Applies per-slide parallax (image offset) and depth (scale / dim / blur)
// from Swiper's slide progress. CSS transitions interpolate between states.
function applyProgress(
    swiper: SwiperInstance,
    kind: "background" | "center",
    depth: boolean,
    amount: number
) {
    if (!swiper || swiper.destroyed || !swiper.slides) return

    Array.from(swiper.slides as ArrayLike<any>).forEach((node) => {
        const slide = node as HTMLElement & { progress?: number }
        const raw = Number(slide.progress ?? 0)
        const p = Number.isFinite(raw) ? raw : 0
        const d = Math.min(2, Math.abs(p))

        if (kind === "background" && depth) {
            const blur = Math.max(0, d - 1) * 2.5
            slide.style.transform = `scale(${(1 - d * 0.07).toFixed(3)})`
            slide.style.opacity = Math.max(0.2, 1 - d * 0.3).toFixed(3)
            slide.style.filter =
                blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : "none"
        }

        const img = slide.querySelector("img") as HTMLElement | null
        if (img && amount > 0) {
            const clamped = Math.max(-1, Math.min(1, p))
            const width = slide.offsetWidth || 280
            const scale = 1 + (2 * amount) / width + 0.02
            img.style.transform = `translate3d(${(-clamped * amount).toFixed(1)}px,0,0) scale(${scale.toFixed(3)})`
        }
    })
}

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
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img1.jpg",
        altText: "Golden Silence",
        title: "Golden Silence",
        text: "Embrace the harmony of colors and calm.",
        backgroundColor: "#18191c",
    },
    {
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img2.jpg",
        altText: "Frozen Majesty",
        title: "Frozen Majesty",
        text: "Touch the purity in every breath of frosty air.",
        backgroundColor: "#15202b",
    },
    {
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img3.jpg",
        altText: "Hidden Beauty",
        title: "Hidden Beauty",
        text: "Discover the mystery veiled in clouds.",
        backgroundColor: "#1f1a24",
    },
    {
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img4.jpg",
        altText: "Sunlit Heights",
        title: "Sunlit Heights",
        text: "Breathe freely in the warmth of freedom.",
        backgroundColor: "#221c18",
    },
    {
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img5.jpg",
        altText: "Awakening Peaks",
        title: "Awakening Peaks",
        text: "Feel life return to every slope.",
        backgroundColor: "#18221c",
    },
    {
        image: "https://bato-web-agency.github.io/bato-shared/img/double-slider/img6.jpg",
        altText: "Language of Details",
        title: "Language of Details",
        text: "Watch the mountains greet the night in radiant skies.",
        backgroundColor: "#1a1824",
    },
]

function getImageSource(value?: unknown): string {
    if (!value) return ""
    if (typeof value === "string") return value.trim()
    if (typeof value !== "object") return ""

    const objectValue = value as Record<string, unknown>
    const asset = objectValue.asset
    const assetUrl =
        asset && typeof asset === "object"
            ? (asset as Record<string, unknown>).url
            : ""

    return String(objectValue.src || objectValue.url || assetUrl || "").trim()
}

function decodeBasicHTMLEntities(value: string): string {
    return value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
}

function htmlToPlainText(value: string): string {
    const decoded = decodeBasicHTMLEntities(value)
    if (!/<\/?[a-z][^>]*>/i.test(decoded)) return decoded.trim()

    return decoded
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
        .replace(/<[^>]*>/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim()
}

function getCMSString(value: unknown): string {
    if (value === null || value === undefined || value === false) return ""
    if (typeof value === "string" || typeof value === "number") {
        return htmlToPlainText(String(value))
    }
    if (Array.isArray(value)) {
        return value.map(getCMSString).filter(Boolean).join(" ").trim()
    }
    if (typeof value !== "object") return ""

    const objectValue = value as Record<string, unknown>
    return getCMSString(
        objectValue.text ??
            objectValue.value ??
            objectValue.content ??
            objectValue.children ??
            objectValue.props
    )
}

function getCMSLink(value: unknown, depth = 0): string {
    if (depth > 6 || value === null || value === undefined) return ""
    if (typeof value === "string") return value.trim()
    if (typeof value !== "object") return ""

    if (Array.isArray(value)) {
        for (const item of value) {
            const link = getCMSLink(item, depth + 1)
            if (link) return link
        }
        return ""
    }

    const objectValue = value as Record<string, unknown>
    const candidates = [
        objectValue.url,
        objectValue.href,
        objectValue.link,
        objectValue.to,
        objectValue.path,
        objectValue.destination,
        objectValue.address,
        objectValue.uri,
        objectValue.value,
    ]

    for (const candidate of candidates) {
        const link = getCMSLink(candidate, depth + 1)
        if (link) return link
    }

    return ""
}

function getCMSBoolean(value: unknown, fallback = true): boolean {
    if (typeof value === "boolean") return value
    const normalized = getCMSString(value).toLowerCase()
    if (!normalized) return fallback
    if (["false", "0", "no", "off", "hidden"].includes(normalized)) {
        return false
    }
    return true
}

function serializeCMSValue(value: unknown): string {
    try {
        return encodeURIComponent(JSON.stringify(value))
    } catch {
        return ""
    }
}

function parseCMSValue<T>(value?: string): T | null {
    if (!value) return null

    try {
        return JSON.parse(decodeURIComponent(value)) as T
    } catch {
        return null
    }
}

function readCMSSlides(host: HTMLElement): SlideItem[] {
    return Array.from(
        host.querySelectorAll<HTMLElement>("[data-swiper-cms-item]")
    )
        .map((node) => {
            const item = parseCMSValue<SwiperCMSItemProps>(
                node.dataset.swiperCmsItem
            )
            if (!item || !getCMSBoolean(item.visible, true)) return null

            return {
                image: getImageSource(item.image),
                altText: getCMSString(item.altText) || getCMSString(item.title),
                title: getCMSString(item.title),
                text: getCMSString(item.text),
                buttonLabel: getCMSString(item.buttonLabel),
                buttonLink: getCMSLink(item.buttonLink),
                backgroundColor: getCMSString(item.backgroundColor),
            }
        })
        .filter((item): item is SlideItem => Boolean(item))
}

function normalizeSlides(slides?: SlideItem[], defaultBg = "#18191c") {
    const source = Array.isArray(slides) ? slides : []

    return source.slice(0, 100).map((slide, index) => ({
        image: getImageSource(slide?.image),
        altText: String(slide?.altText || slide?.title || `Slide ${index + 1}`),
        title: String(slide?.title || `Slide ${index + 1}`),
        text: String(slide?.text || ""),
        buttonLabel: String(slide?.buttonLabel || "").trim(),
        buttonLink: getCMSLink(slide?.buttonLink),
        backgroundColor:
            String(slide?.backgroundColor || "").trim() || defaultBg,
    }))
}

function fontFamilyStack(value?: string) {
    const family = String(value || "Inter").trim()
    return FONT_STACKS[family] || family
}

function toGlassBackground(color: string) {
    const value = String(color || "rgba(255,255,255,.22)").trim()
    const rgba = value.match(
        /^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i
    )
    if (rgba) {
        const alpha = Math.min(
            0.36,
            Math.max(0.08, Number(rgba[4] ?? 1) * 0.42)
        )
        return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${alpha})`
    }
    const hex = value.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        const raw = hex[1]
        const expanded =
            raw.length === 3 || raw.length === 4
                ? raw
                      .split("")
                      .map((part) => part + part)
                      .join("")
                : raw
        const red = parseInt(expanded.slice(0, 2), 16)
        const green = parseInt(expanded.slice(2, 4), 16)
        const blue = parseInt(expanded.slice(4, 6), 16)
        return `rgba(${red}, ${green}, ${blue}, .24)`
    }
    return "rgba(255, 255, 255, .22)"
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
                : typeof source.lineHeight === "number"
                  ? String(source.lineHeight)
                  : String(source.lineHeight),
        letterSpacing:
            source.letterSpacing === undefined
                ? fallback.letterSpacing
                : typeof source.letterSpacing === "number"
                  ? `${source.letterSpacing}px`
                  : String(source.letterSpacing),
    }
}

export default function ParallaxSwiper({
    dataSource = "Manual",
    cmsSlidesContent,
    slides = DEFAULT_SLIDES,
    initialSlide = 2,
    spaceBetween = 45,
    speed = 800,
    mouseWheel = false,
    keyboardNavigation = false,
    backgroundSlideSize = 280,
    centeredSlideWidth = 280,
    centeredSlideHeight = 390,
    centerBorderRadius = 24,
    backgroundBorderRadius = 24,
    centerDesign = "standard",
    mouseTilt = true,
    tiltStrength = 6,
    depthEffect = true,
    parallaxAmount = 24,
    showCenterShadow = true,
    centerShadow = "0 18px 40px rgba(0, 0, 0, .32)",
    backgroundColor = "#18191c",
    centerBackgroundColor = "#101114",
    centerOverlayBackground = DEFAULT_OVERLAY,
    navigation: navigationOptions = {},
    cta: ctaOptions = {},
    textColor = "#ffffff",
    descriptionColor = "#b8bbc2",
    titleFont,
    descriptionFont,
    textAnimation = "mask",
}: ParallaxSwiperProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const cmsSlidesHostRef = React.useRef<HTMLDivElement>(null)
    const backgroundSwiperRef = React.useRef<SwiperInstance | null>(null)
    const centerSwiperRef = React.useRef<SwiperInstance | null>(null)
    const wheelLockRef = React.useRef(0)
    const [cmsSlides, setCmsSlides] = React.useState<SlideItem[]>([])

    React.useEffect(() => {
        if (dataSource !== "CMS" || isStaticRenderer) {
            setCmsSlides([])
            return
        }

        const host = cmsSlidesHostRef.current
        if (!host) return

        const read = () => setCmsSlides(readCMSSlides(host))
        read()

        const observer = new MutationObserver(read)
        observer.observe(host, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["data-swiper-cms-item", "src", "srcset", "href"],
        })

        return () => observer.disconnect()
    }, [dataSource, cmsSlidesContent, isStaticRenderer])

    const sourceSlides = dataSource === "CMS" ? cmsSlides : slides
    const normalizedSlides = React.useMemo(
        () => normalizeSlides(sourceSlides, backgroundColor),
        [sourceSlides, backgroundColor]
    )
    const lastSlideIndex = Math.max(0, normalizedSlides.length - 1)
    const resolvedInitialSlide = Math.max(
        0,
        Math.min(lastSlideIndex, Math.floor(Number(initialSlide) || 0))
    )
    const resolvedSpaceBetween = Math.max(0, Number(spaceBetween) || 0)
    const resolvedSpeed = Math.max(0, Number(speed) || 0)
    const {
        background: ctaBackground = "#ffffff",
        color: ctaColor = "#101828",
        hoverBackground: ctaHoverBackground = "#101828",
        hoverColor: ctaHoverColor = "#ffffff",
        radius: ctaRadius = 999,
        design: ctaDesign = "solid",
        animation: ctaAnimation = "lift",
        hoverAnimation: ctaHoverAnimation = "fade",
        font: ctaFontValue,
        transform: ctaTransform = "none",
    } = ctaOptions
    const ctaFont = resolveFont(ctaFontValue, {
        family: FONT_STACKS["Inter"],
        size: "13px",
        weight: "700",
        lineHeight: "1",
        letterSpacing: "-0.01em",
    })
    const resolvedCtaColor = String(ctaColor || "#101828")
    const rawCtaRadius = Number(ctaRadius)
    const resolvedCtaRadius = Math.max(
        0,
        Math.min(999, Number.isFinite(rawCtaRadius) ? rawCtaRadius : 999)
    )
    const resolvedCtaBackground =
        ctaDesign === "outline" || ctaDesign === "ghost"
            ? "transparent"
            : ctaDesign === "glass"
              ? toGlassBackground(String(ctaBackground))
              : String(ctaBackground || "#ffffff")
    const resolvedCtaBorder =
        ctaDesign === "outline"
            ? `1px solid ${resolvedCtaColor}`
            : ctaDesign === "glass"
              ? "1px solid rgba(255,255,255,.48)"
              : "0"
    const resolvedCtaShadow =
        ctaDesign === "ghost"
            ? "none"
            : ctaDesign === "glass"
              ? "0 16px 36px rgba(0,0,0,.16)"
              : "0 16px 36px rgba(0,0,0,.2)"
    const resolvedCtaBackdrop = ctaDesign === "glass" ? "blur(18px)" : "none"
    const showPreviousButton = navigationOptions.showPreviousButton ?? true
    const showNextButton = navigationOptions.showNextButton ?? true
    const previousIcon = navigationOptions.previousIcon || "←"
    const nextIcon = navigationOptions.nextIcon || "→"
    const previousIconSvg = getImageSource(navigationOptions.previousIconSvg)
    const nextIconSvg = getImageSource(navigationOptions.nextIconSvg)
    const resolvedButtonColor = navigationOptions.iconColor || "#ffffff"
    const resolvedButtonBackground =
        navigationOptions.background || "rgba(255, 255, 255, 0.12)"
    const resolvedButtonBorderColor =
        navigationOptions.borderColor || "rgba(255, 255, 255, 0.2)"
    // FIX: use ?? so an explicit 0 is respected instead of falling back
    const resolvedButtonBorderWidth = Math.max(
        0,
        Number(navigationOptions.borderWidth ?? 1) || 0
    )
    const resolvedButtonHoverBackground =
        navigationOptions.hoverBackground || "#ffffff"
    const resolvedButtonHoverColor = navigationOptions.hoverColor || "#18191c"
    const resolvedButtonSize = Math.max(
        28,
        Number(navigationOptions.size) || 52
    )
    const resolvedButtonIconSize = Math.max(
        10,
        Number(navigationOptions.iconSize) || 18
    )
    // FIX: respect 0 and match the control's 0-100 range
    const resolvedButtonRadius = Math.max(
        0,
        Math.min(100, Number(navigationOptions.radius ?? 16) || 0)
    )
    // FIX: respect 0
    const resolvedButtonOffset = Math.max(
        0,
        Number(navigationOptions.offset ?? 32) || 0
    )
    const resolvedButtonPosition = navigationOptions.position || "sides"

    const resolvedBackgroundSize = Math.max(
        80,
        Number(backgroundSlideSize) || 280
    )
    const resolvedCenterWidth = Math.max(80, Number(centeredSlideWidth) || 280)
    const resolvedCenterHeight = Math.max(
        100,
        Number(centeredSlideHeight) || 390
    )
    const resolvedCenterBorderRadius = Math.max(
        0,
        Number(centerBorderRadius) || 0
    )
    const resolvedBackgroundBorderRadius = Math.max(
        0,
        Number(backgroundBorderRadius) || 0
    )
    const resolvedCenterDesign =
        centerDesign === "polaroid" || centerDesign === "cellphone"
            ? centerDesign
            : "standard"
    const resolvedCenterShadow = showCenterShadow
        ? String(centerShadow || "0 18px 40px rgba(0, 0, 0, .32)")
        : "none"

    const resolvedParallax = Math.max(0, Number(parallaxAmount) || 0)

    const resolvedTitleFont = resolveFont(titleFont, {
        family: FONT_STACKS["Inter"],
        size: "38px",
        weight: "600",
        lineHeight: "1",
        letterSpacing: "-0.04em",
    })
    const resolvedDescriptionFont = resolveFont(descriptionFont, {
        family: FONT_STACKS["Inter"],
        size: "16px",
        weight: "400",
        lineHeight: "1.55",
        letterSpacing: "0",
    })

    const [activeIndex, setActiveIndex] = React.useState(resolvedInitialSlide)
    const [isBeginning, setIsBeginning] = React.useState(
        resolvedInitialSlide === 0
    )
    const [isEnd, setIsEnd] = React.useState(
        resolvedInitialSlide === lastSlideIndex
    )

    React.useEffect(() => {
        const nextInitialSlide = Math.max(
            0,
            Math.min(lastSlideIndex, Math.floor(Number(initialSlide) || 0))
        )
        setActiveIndex(nextInitialSlide)
        setIsBeginning(nextInitialSlide === 0)
        setIsEnd(nextInitialSlide === lastSlideIndex)
    }, [initialSlide, lastSlideIndex])

    // FIX: keep activeIndex in range if slides are removed (e.g. CMS changes)
    React.useEffect(() => {
        setActiveIndex((index) => Math.min(index, lastSlideIndex))
    }, [lastSlideIndex])

    React.useEffect(() => {
        if (
            isStaticRenderer ||
            !rootRef.current ||
            normalizedSlides.length === 0
        )
            return

        const backgroundElement =
            rootRef.current.querySelector<HTMLElement>(".background-swiper")
        const centeredElement =
            rootRef.current.querySelector<HTMLElement>(".centered-swiper")
        const wheelTarget = rootRef.current
        const keyboardTarget = rootRef.current
        if (
            !backgroundElement ||
            !centeredElement ||
            !wheelTarget ||
            !keyboardTarget
        )
            return

        const updateState = (swiper: SwiperInstance) => {
            setIsBeginning(Boolean(swiper.isBeginning))
            setIsEnd(Boolean(swiper.isEnd))
        }

        const backgroundSwiper = new Swiper(backgroundElement, {
            slidesPerView: "auto",
            spaceBetween: resolvedSpaceBetween,
            centeredSlides: true,
            initialSlide: resolvedInitialSlide,
            speed: resolvedSpeed,
            grabCursor: true,
            allowTouchMove: true,
            watchSlidesProgress: true,
            on: {
                init(swiper: SwiperInstance) {
                    updateState(swiper)
                },
                progress(swiper: SwiperInstance) {
                    applyProgress(
                        swiper,
                        "background",
                        depthEffect,
                        resolvedParallax
                    )
                },
                setTranslate(swiper: SwiperInstance) {
                    applyProgress(
                        swiper,
                        "background",
                        depthEffect,
                        resolvedParallax
                    )
                },
                touchStart() {
                    wheelTarget.dataset.dragging = "1"
                },
                touchEnd() {
                    delete wheelTarget.dataset.dragging
                },
                slideChange(swiper: SwiperInstance) {
                    updateState(swiper)
                    const index = Number(
                        swiper.realIndex ?? swiper.activeIndex ?? 0
                    )
                    setActiveIndex(index)
                    if (resolvedCenterDesign !== "cellphone") {
                        centerSwiperRef.current?.slideTo(index, resolvedSpeed)
                    }
                },
            },
        })

        const centerSwiper = new Swiper(centeredElement, {
            slidesPerView: 1,
            loop: false,
            initialSlide: resolvedInitialSlide,
            speed: resolvedSpeed,
            watchSlidesProgress: true,
            on: {
                progress(swiper: SwiperInstance) {
                    applyProgress(
                        swiper,
                        "center",
                        false,
                        resolvedParallax * 1.2
                    )
                },
                setTranslate(swiper: SwiperInstance) {
                    applyProgress(
                        swiper,
                        "center",
                        false,
                        resolvedParallax * 1.2
                    )
                },
            },
        })

        backgroundSwiperRef.current = backgroundSwiper
        centerSwiperRef.current = centerSwiper
        updateState(backgroundSwiper)
        setActiveIndex(
            Number(
                backgroundSwiper.realIndex ??
                    backgroundSwiper.activeIndex ??
                    resolvedInitialSlide
            )
        )

        applyProgress(
            backgroundSwiper,
            "background",
            depthEffect,
            resolvedParallax
        )
        applyProgress(centerSwiper, "center", false, resolvedParallax * 1.2)
        // enable CSS transitions only after the first paint so nothing animates on load
        const readyFrame = requestAnimationFrame(() => {
            wheelTarget.dataset.ready = "1"
        })

        // FIX: only block page scroll when the slider can actually move
        const handleWheel = (event: WheelEvent) => {
            if (!mouseWheel || backgroundSwiper.destroyed) return

            const delta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY
            if (!delta || Math.abs(delta) < 8) return

            const canMove =
                delta > 0
                    ? !backgroundSwiper.isEnd
                    : !backgroundSwiper.isBeginning
            if (!canMove) return

            event.preventDefault()
            event.stopPropagation()

            const now = Date.now()
            if (now < wheelLockRef.current) return
            wheelLockRef.current =
                now + Math.max(260, Math.min(1000, resolvedSpeed || 450))

            if (delta > 0) backgroundSwiper.slideNext()
            else backgroundSwiper.slidePrev()
        }

        // FIX: only swallow arrow keys when the slider can actually move
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!keyboardNavigation || backgroundSwiper.destroyed) return

            const target = event.target as HTMLElement | null
            if (
                target?.matches(
                    'input, textarea, select, [contenteditable="true"]'
                )
            )
                return

            if (event.key === "ArrowRight" && !backgroundSwiper.isEnd) {
                event.preventDefault()
                event.stopPropagation()
                backgroundSwiper.slideNext()
            } else if (
                event.key === "ArrowLeft" &&
                !backgroundSwiper.isBeginning
            ) {
                event.preventDefault()
                event.stopPropagation()
                backgroundSwiper.slidePrev()
            }
        }

        if (mouseWheel) {
            wheelTarget.addEventListener("wheel", handleWheel, {
                passive: false,
            })
        }
        if (keyboardNavigation) {
            keyboardTarget.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            if (mouseWheel) {
                wheelTarget.removeEventListener("wheel", handleWheel)
            }
            if (keyboardNavigation) {
                keyboardTarget.removeEventListener("keydown", handleKeyDown)
            }
            cancelAnimationFrame(readyFrame)
            delete wheelTarget.dataset.ready
            delete wheelTarget.dataset.dragging
            wheelTarget
                .querySelectorAll<HTMLElement>(
                    ".background-slide, .centered-slide, .background-slide img, .centered-slide img"
                )
                .forEach((node) => {
                    node.style.transform = ""
                    node.style.opacity = ""
                    node.style.filter = ""
                })
            backgroundSwiperRef.current = null
            centerSwiperRef.current = null
            backgroundSwiper.destroy(true, true)
            centerSwiper.destroy(true, true)
        }
    }, [
        isStaticRenderer,
        mouseWheel,
        keyboardNavigation,
        normalizedSlides.length,
        resolvedCenterDesign,
        resolvedInitialSlide,
        resolvedSpaceBetween,
        resolvedSpeed,
        depthEffect,
        resolvedParallax,
    ])

    // Mouse-driven tilt for the center card. Listeners are only attached while
    // the component is in or near the viewport (mouse only, respects reduced motion).
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStaticRenderer || !mouseTilt) return
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
            return

        let frame = 0
        let listening = false

        const setTilt = (x: number, y: number) => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                root.style.setProperty("--tilt-x", x.toFixed(3))
                root.style.setProperty("--tilt-y", y.toFixed(3))
            })
        }
        const onMove = (event: PointerEvent) => {
            if (event.pointerType && event.pointerType !== "mouse") return
            const rect = root.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            setTilt(
                ((event.clientX - rect.left) / rect.width - 0.5) * 2,
                ((event.clientY - rect.top) / rect.height - 0.5) * 2
            )
        }
        const onLeave = () => setTilt(0, 0)

        const start = () => {
            if (listening) return
            listening = true
            root.addEventListener("pointermove", onMove)
            root.addEventListener("pointerleave", onLeave)
        }
        const stop = () => {
            if (!listening) return
            listening = false
            cancelAnimationFrame(frame)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            // settle the card back to neutral while offscreen
            root.style.setProperty("--tilt-x", "0")
            root.style.setProperty("--tilt-y", "0")
        }

        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    if (entry?.isIntersecting) start()
                    else stop()
                },
                { rootMargin: "200px 0px", threshold: 0 }
            )
            observer.observe(root)
        } else {
            // very old browsers: fall back to always-on
            start()
        }

        return () => {
            observer?.disconnect()
            stop()
            root.style.removeProperty("--tilt-x")
            root.style.removeProperty("--tilt-y")
        }
    }, [mouseTilt, isStaticRenderer])

    const activeSlide = normalizedSlides[activeIndex] || normalizedSlides[0]
    const activeBackgroundColor =
        activeSlide?.backgroundColor || backgroundColor
    const activeButtonLink = activeSlide?.buttonLink?.trim() || ""
    const activeButtonLabelRaw = activeSlide?.buttonLabel?.trim() || ""
    const hasCTA = Boolean(activeButtonLink || activeButtonLabelRaw)
    const ctaLabel = activeButtonLabelRaw || "Learn more"

    const handlePrevious = React.useCallback(() => {
        const swiper = backgroundSwiperRef.current
        if (!swiper || swiper.destroyed || swiper.isBeginning) return
        swiper.slidePrev()
    }, [])

    const handleNext = React.useCallback(() => {
        const swiper = backgroundSwiperRef.current
        if (!swiper || swiper.destroyed || swiper.isEnd) return
        swiper.slideNext()
    }, [])

    const animationClass = isStaticRenderer
        ? ""
        : `text-animation-${textAnimation}`
    const slideNumber = String(activeIndex + 1).padStart(2, "0")
    const totalSlides = String(normalizedSlides.length).padStart(2, "0")

    const titleText = activeSlide?.title || ""
    const titleNode =
        textAnimation === "mask"
            ? titleText
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((word, i, all) => (
                      <React.Fragment key={`${activeIndex}-${i}`}>
                          <span className="mask-word">
                              <span style={{ "--i": i } as React.CSSProperties}>
                                  {word}
                              </span>
                          </span>
                          {i < all.length - 1 ? " " : null}
                      </React.Fragment>
                  ))
            : titleText

    const contentNode = (
        <div
            className={`slider-content ${animationClass}`}
            key={`content-${activeIndex}`}
        >
            <div
                className="slider-meta"
                aria-label={`Slide ${activeIndex + 1} of ${normalizedSlides.length}`}
            >
                <span>{slideNumber}</span>
                <span className="slider-meta-line" />
                <span>{totalSlides}</span>
            </div>
            <h2 className="slider-title" aria-label={titleText}>
                {titleNode}
            </h2>
            <p className="slider-text">{activeSlide?.text || ""}</p>
            {hasCTA ? (
                <div className="slider-cta-wrap">
                    <a
                        className="slider-cta"
                        data-cta-design={ctaDesign}
                        data-cta-animation={ctaAnimation}
                        data-cta-hover-animation={ctaHoverAnimation}
                        href={activeButtonLink || "#"}
                        target={activeButtonLink ? "_blank" : undefined}
                        rel={activeButtonLink ? "noreferrer" : undefined}
                        onClick={(event) => {
                            if (!activeButtonLink) event.preventDefault()
                        }}
                    >
                        {ctaLabel}
                    </a>
                </div>
            ) : null}
        </div>
    )

    return (
        <div
            ref={rootRef}
            className={`parallax-swiper design-${resolvedCenterDesign} nav-pos-${resolvedButtonPosition}${mouseTilt && !isStaticRenderer ? " has-tilt" : ""}${isStaticRenderer ? " is-static" : ""}`}
            tabIndex={keyboardNavigation ? 0 : undefined}
            aria-label="Parallax slider"
            style={
                {
                    "--slider-background": activeBackgroundColor,
                    "--swiper-speed": `${resolvedSpeed}ms`,
                    "--tilt-deg": Math.max(0, Number(tiltStrength) || 0),
                    "--center-shadow": resolvedCenterShadow,
                    "--center-background": centerBackgroundColor,
                    "--center-overlay-background": centerOverlayBackground,
                    "--button-color": resolvedButtonColor,
                    "--button-background": resolvedButtonBackground,
                    "--button-border-color": resolvedButtonBorderColor,
                    "--button-border-width": `${resolvedButtonBorderWidth}px`,
                    "--button-hover-background": resolvedButtonHoverBackground,
                    "--button-hover-color": resolvedButtonHoverColor,
                    "--button-size": `${resolvedButtonSize}px`,
                    "--button-icon-size": `${resolvedButtonIconSize}px`,
                    "--button-radius": `${resolvedButtonRadius}px`,
                    "--button-offset": `${resolvedButtonOffset}px`,
                    "--text-color": textColor,
                    "--description-color": descriptionColor,
                    "--background-slide-size": `${resolvedBackgroundSize}px`,
                    "--center-slide-width": `${resolvedCenterWidth}px`,
                    "--center-slide-height": `${resolvedCenterHeight}px`,
                    "--center-border-radius": `${resolvedCenterBorderRadius}px`,
                    "--background-border-radius": `${resolvedBackgroundBorderRadius}px`,
                    "--center-visual-width": `${resolvedCenterDesign === "polaroid" ? resolvedCenterWidth + 28 : resolvedCenterDesign === "cellphone" ? resolvedCenterWidth + 18 : resolvedCenterWidth}px`,
                    "--center-visual-height": `${resolvedCenterDesign === "polaroid" ? resolvedCenterHeight + 70 : resolvedCenterDesign === "cellphone" ? resolvedCenterHeight + 36 : resolvedCenterHeight}px`,
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
                    "--cta-color": resolvedCtaColor,
                    "--cta-background": resolvedCtaBackground,
                    "--cta-hover-background": String(
                        ctaHoverBackground || "#101828"
                    ),
                    "--cta-hover-color": String(ctaHoverColor || "#ffffff"),
                    "--cta-border": resolvedCtaBorder,
                    "--cta-shadow": resolvedCtaShadow,
                    "--cta-backdrop": resolvedCtaBackdrop,
                    "--cta-radius": `${resolvedCtaRadius}px`,
                    "--cta-transform": ctaTransform,
                    "--cta-font-family": ctaFont.family,
                    "--cta-font-size": ctaFont.size,
                    "--cta-font-weight": ctaFont.weight,
                    "--cta-line-height": ctaFont.lineHeight,
                    "--cta-letter-spacing": ctaFont.letterSpacing,
                } as React.CSSProperties
            }
        >
            <style>{`
                .parallax-swiper {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: 520px;
                    overflow: hidden;
                    box-sizing: border-box;
                    isolation: isolate;
                    background: var(--slider-background);
                    transition: background-color 650ms cubic-bezier(.2,.8,.2,1);
                    color: var(--text-color);
                    font-family: var(--description-font-family);
                }

                .parallax-swiper,
                .parallax-swiper * {
                    box-sizing: border-box;
                }

                .parallax-swiper .slider-stage {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    background: transparent;
                }

                .parallax-swiper .slider-stage::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    z-index: 5;
                    pointer-events: none;
                    background: transparent;
                }

                .parallax-swiper .swiper {
                    position: relative;
                    display: block;
                    overflow: hidden;
                }

                .parallax-swiper .swiper-wrapper {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    width: 100%;
                    height: 100%;
                    transition-property: transform;
                    transition-timing-function: cubic-bezier(.22, .8, .2, 1);
                }

                .parallax-swiper .swiper-slide {
                    position: relative;
                    display: block;
                    flex-shrink: 0;
                    width: 100%;
                    height: 100%;
                }

                .parallax-swiper .background-swiper {
                    width: 100%;
                    height: calc(var(--stage-top, 50%) * 2);
                }

                .parallax-swiper.design-cellphone .slider-stage {
                    background: transparent;
                }

                .parallax-swiper .background-swiper .swiper-wrapper {
                    align-items: center;
                }

                .parallax-swiper .background-slide {
                    position: relative;
                    overflow: hidden;
                    flex: 0 0 var(--background-slide-size);
                    width: var(--background-slide-size);
                    height: var(--background-slide-size);
                    border: 1px solid rgba(255, 255, 255, .16);
                    border-radius: var(--background-border-radius);
                }

                .parallax-swiper .background-slide img {
                    border-radius: inherit;
                }

                .parallax-swiper .background-slide img,
                .parallax-swiper .centered-slide img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                }

                .parallax-swiper .centered-swiper {
                    position: absolute;
                    top: var(--stage-top, 50%);
                    left: 50%;
                    z-index: 10;
                    width: var(--center-slide-width);
                    height: var(--center-slide-height);
                    overflow: hidden;
                    transform: translate(-50%, -50%);
                    background-color: var(--center-background);
                    border: 1px solid rgba(255, 255, 255, .42);
                    border-radius: var(--center-border-radius);
                    box-shadow: var(--center-shadow);
                    pointer-events: none;
                    isolation: isolate;
                    --center-visual-width: var(--center-slide-width);
                }

                .parallax-swiper .centered-slide {
                    position: relative;
                    flex: 0 0 100%;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    border-radius: inherit;
                    background-color: var(--center-background);
                }

                .parallax-swiper .centered-slide img {
                    border-radius: inherit;
                }

                .parallax-swiper .centered-slide::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: var(--center-overlay-background);
                    pointer-events: none;
                    z-index: 5;
                    border-radius: inherit;
                }

                .parallax-swiper .centered-swiper.design-polaroid {
                    --center-visual-width: calc(var(--center-slide-width) + 28px);
                    width: calc(var(--center-slide-width) + 28px);
                    height: calc(var(--center-slide-height) + 70px);
                    overflow: hidden;
                    border: 14px solid var(--center-background);
                    border-bottom-width: 56px;
                    border-radius: var(--center-border-radius);
                    background: var(--center-background);
                    box-shadow: var(--center-shadow);
                }

                .parallax-swiper .design-polaroid .centered-slide {
                    overflow: hidden;
                    border-radius: max(0px, calc(var(--center-border-radius) - 4px));
                    background: var(--center-background);
                }

                .parallax-swiper .design-polaroid .slider-content-panel {
                    inset: 0;
                    padding: 18px;
                    border-radius: inherit;
                    background: transparent;
                }

                .parallax-swiper .design-polaroid .slider-meta {
                    font-size: 9px;
                }

                .parallax-swiper .centered-swiper.design-cellphone {
                    --center-visual-width: calc(var(--center-slide-width) + 18px);
                    width: calc(var(--center-slide-width) + 18px);
                    height: calc(var(--center-slide-height) + 36px);
                    overflow: hidden;
                    padding: 10px 9px 24px;
                    border: 7px solid var(--center-background);
                    border-radius: var(--center-border-radius);
                    background-color: var(--center-background);
                    background-image: none;
                    background-clip: border-box;
                    box-shadow: var(--center-shadow), inset 0 0 0 1px rgba(255, 255, 255, .14);
                    contain: paint;
                }

                .parallax-swiper .design-cellphone .cellphone-backdrop {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    display: block;
                    background: var(--center-background);
                    opacity: 1;
                    pointer-events: none;
                }

                .parallax-swiper .design-cellphone .swiper-wrapper {
                    position: relative;
                    z-index: 1;
                    background: transparent;
                }

                .parallax-swiper .design-cellphone::before {
                    content: "";
                    position: absolute;
                    top: 5px;
                    left: 50%;
                    z-index: 30;
                    width: 58px;
                    height: 10px;
                    border-radius: 999px;
                    background: #050506;
                    transform: translateX(-50%);
                }

                .parallax-swiper .design-cellphone::after {
                    content: "";
                    position: absolute;
                    bottom: 5px;
                    left: 50%;
                    z-index: 30;
                    width: 30px;
                    height: 4px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, .72);
                    transform: translateX(-50%);
                }

                .parallax-swiper .design-cellphone .centered-slide {
                    overflow: hidden;
                    border-radius: max(0px, calc(var(--center-border-radius) - 6px));
                    background: var(--center-background);
                }

                .parallax-swiper .design-cellphone .slider-content-panel {
                    inset: 10px 9px 24px;
                    padding: 16px 14px;
                    border-radius: inherit;
                    background: transparent;
                }

                .parallax-swiper .design-cellphone .slider-meta {
                    font-size: 9px;
                }

                .parallax-swiper .slider-content-panel {
                    position: absolute;
                    inset: 0;
                    z-index: 25;
                    display: flex;
                    align-items: flex-end;
                    padding: 24px;
                    pointer-events: none;
                    background: transparent;
                }

                .parallax-swiper .slider-content {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    width: 100%;
                    min-width: 0;
                    max-width: 100%;
                }

                .parallax-swiper .slider-content.text-animation-fadeUp {
                    animation: parallaxTextFadeUp 520ms cubic-bezier(.2, .8, .2, 1) both;
                }

                .parallax-swiper .slider-content.text-animation-slideUp {
                    animation: parallaxTextSlideUp 520ms cubic-bezier(.2, .8, .2, 1) both;
                }

                .parallax-swiper .slider-content.text-animation-fade {
                    animation: parallaxTextFade 420ms ease-out both;
                }

                .parallax-swiper .slider-content.text-animation-none {
                    animation: none;
                }

                .parallax-swiper .slider-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    color: var(--description-color);
                    font-family: var(--description-font-family);
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: .16em;
                    line-height: 1;
                    text-transform: uppercase;
                }

                .parallax-swiper .slider-meta-line {
                    display: block;
                    width: 32px;
                    height: 1px;
                    background: var(--description-color);
                    opacity: .7;
                }

                .parallax-swiper .slider-title {
                    margin: 0;
                    color: var(--text-color);
                    font-family: var(--title-font-family);
                    font-size: var(--title-font-size);
                    font-weight: var(--title-font-weight);
                    letter-spacing: var(--title-letter-spacing);
                    line-height: var(--title-line-height);
                    text-wrap: balance;
                }

                .parallax-swiper .slider-text {
                    max-width: 560px;
                    margin: 12px 0 0;
                    color: var(--description-color);
                    font-family: var(--description-font-family);
                    font-size: var(--description-font-size);
                    font-weight: var(--description-font-weight);
                    letter-spacing: var(--description-letter-spacing);
                    line-height: var(--description-line-height);
                }

                .parallax-swiper .slider-cta {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 14px;
                    min-height: 52px;
                    margin-top: 34px;
                    padding: 0 23px;
                    border: var(--cta-border);
                    border-radius: var(--cta-radius);
                    color: var(--cta-color);
                    background: var(--cta-background);
                    box-shadow: var(--cta-shadow);
                    backdrop-filter: var(--cta-backdrop);
                    -webkit-backdrop-filter: var(--cta-backdrop);
                    font-family: var(--cta-font-family);
                    font-size: var(--cta-font-size);
                    font-weight: var(--cta-font-weight);
                    line-height: var(--cta-line-height);
                    letter-spacing: var(--cta-letter-spacing);
                    text-transform: var(--cta-transform);
                    text-decoration: none;
                    pointer-events: auto;
                    position: relative;
                    z-index: 100;
                    overflow: hidden;
                    transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, color 180ms ease;
                }

                .parallax-swiper .slider-cta::after {
                    content: "↗";
                    font-size: 18px;
                    line-height: 1;
                    transition: transform 180ms ease;
                }

                .parallax-swiper .slider-cta:hover,
                .parallax-swiper .slider-cta:focus-visible {
                    background: var(--cta-hover-background);
                    color: var(--cta-hover-color);
                }

                .parallax-swiper .slider-cta:hover::after,
                .parallax-swiper .slider-cta:focus-visible::after {
                    transform: translate(2px, -2px);
                }

                /* FIX: "none" hover animation keeps the resting colors */
                .parallax-swiper .slider-cta[data-cta-hover-animation="none"]:hover,
                .parallax-swiper .slider-cta[data-cta-hover-animation="none"]:focus-visible {
                    background: var(--cta-background);
                    color: var(--cta-color);
                }

                .parallax-swiper .slider-cta[data-cta-hover-animation="fillLeft"],
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillRight"],
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillCenter"] {
                    background-color: var(--cta-background);
                    background-image: linear-gradient(90deg, var(--cta-hover-background), var(--cta-hover-background));
                    background-repeat: no-repeat;
                    background-size: 0% 100%;
                    transition: background-size 420ms cubic-bezier(.2,.75,.2,1), transform 180ms ease, box-shadow 180ms ease, color 180ms ease;
                }

                .parallax-swiper .slider-cta[data-cta-hover-animation="fillLeft"] {
                    background-position: left center;
                }

                .parallax-swiper .slider-cta[data-cta-hover-animation="fillRight"] {
                    background-position: right center;
                }

                .parallax-swiper .slider-cta[data-cta-hover-animation="fillCenter"] {
                    background-position: center center;
                }

                .parallax-swiper .slider-cta[data-cta-hover-animation="fillLeft"]:hover,
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillLeft"]:focus-visible,
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillRight"]:hover,
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillRight"]:focus-visible,
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillCenter"]:hover,
                .parallax-swiper .slider-cta[data-cta-hover-animation="fillCenter"]:focus-visible {
                    background-color: var(--cta-background);
                    background-size: 100% 100%;
                    color: var(--cta-hover-color);
                }

                .parallax-swiper .slider-cta[data-cta-animation="lift"]:hover,
                .parallax-swiper .slider-cta[data-cta-animation="lift"]:focus-visible {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 42px rgba(0,0,0,.28);
                }

                .parallax-swiper .slider-cta[data-cta-animation="scale"]:hover,
                .parallax-swiper .slider-cta[data-cta-animation="scale"]:focus-visible {
                    transform: scale(1.045);
                    box-shadow: 0 20px 42px rgba(0,0,0,.28);
                }

                .parallax-swiper .slider-cta[data-cta-animation="shine"]::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,.48) 50%, transparent 75%);
                    transform: translateX(-120%);
                    transition: transform 500ms ease;
                    pointer-events: none;
                }

                .parallax-swiper .slider-cta[data-cta-animation="shine"]:hover::before,
                .parallax-swiper .slider-cta[data-cta-animation="shine"]:focus-visible::before {
                    transform: translateX(120%);
                }

                .parallax-swiper .slider-cta[data-cta-animation="pulse"] {
                    animation: parallaxCtaPulse 2.2s ease-in-out infinite;
                }

                @keyframes parallaxCtaPulse {
                    0%, 100% { box-shadow: var(--cta-shadow); }
                    50% { box-shadow: 0 0 0 8px rgba(255,255,255,.12), 0 20px 42px rgba(0,0,0,.24); }
                }

                .parallax-swiper .slider-actions {
                    position: absolute;
                    z-index: 35;
                    display: flex;
                    align-items: center;
                    pointer-events: none;
                }

                .parallax-swiper.nav-pos-sides .slider-actions {
                    top: calc(var(--stage-top, 50%) - (var(--center-visual-height, var(--center-slide-height)) / 2));
                    right: 0;
                    left: 0;
                    justify-content: space-between;
                    height: var(--center-visual-height, var(--center-slide-height));
                    padding: 0 var(--button-offset);
                }

                .parallax-swiper.nav-pos-bottom .slider-actions {
                    bottom: 24px;
                    right: 24px;
                    left: auto;
                    justify-content: flex-end;
                    gap: 12px;
                    height: auto;
                    padding: 0;
                }

                .parallax-swiper.nav-pos-top .slider-actions {
                    top: 24px;
                    right: 24px;
                    left: auto;
                    justify-content: flex-end;
                    gap: 12px;
                    height: auto;
                    padding: 0;
                }

                .parallax-swiper .slider-button {
                    position: static;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: var(--button-size);
                    height: var(--button-size);
                    padding: 0;
                    border: var(--button-border-width) solid var(--button-border-color);
                    border-radius: var(--button-radius);
                    color: var(--button-color);
                    background: var(--button-background);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    font-family: var(--description-font-family);
                    font-size: var(--button-icon-size);
                    line-height: 1;
                    cursor: pointer;
                    pointer-events: auto;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    transition: transform 200ms cubic-bezier(.2, .8, .2, 1), background 200ms ease, color 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
                }

                .parallax-swiper .slider-button-icon {
                    display: block;
                    width: var(--button-icon-size);
                    height: var(--button-icon-size);
                    object-fit: contain;
                    pointer-events: none;
                }

                .parallax-swiper .slider-button:hover,
                .parallax-swiper .slider-button:focus-visible {
                    color: var(--button-hover-color);
                    background: var(--button-hover-background);
                    border-color: var(--button-hover-background);
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
                }

                .parallax-swiper .slider-button:active {
                    transform: translateY(0px);
                }

                .parallax-swiper .slider-button:disabled {
                    opacity: .3;
                    pointer-events: none;
                    box-shadow: none;
                }

                /* FIX: clean canvas preview, since Swiper doesn't run in the static renderer */
                .parallax-swiper.is-static .centered-swiper .swiper-wrapper {
                    transform: none;
                }

                .parallax-swiper.is-static .centered-swiper .centered-slide:not(:first-child) {
                    display: none;
                }

                /* ---------- Parallax + depth transitions ---------- */
                .parallax-swiper .background-slide img,
                .parallax-swiper .centered-slide img {
                    will-change: transform;
                }

                .parallax-swiper[data-ready="1"]:not([data-dragging="1"]) .background-slide {
                    transition:
                        transform var(--swiper-speed, 800ms) cubic-bezier(.22, .8, .2, 1),
                        opacity var(--swiper-speed, 800ms) ease,
                        filter var(--swiper-speed, 800ms) ease;
                }

                .parallax-swiper[data-ready="1"]:not([data-dragging="1"]) .background-slide img,
                .parallax-swiper[data-ready="1"]:not([data-dragging="1"]) .centered-slide img {
                    transition: transform var(--swiper-speed, 800ms) cubic-bezier(.22, .8, .2, 1);
                }

                .parallax-swiper.has-tilt .background-swiper {
                    transform: translate3d(calc(var(--tilt-x, 0) * -14px), calc(var(--tilt-y, 0) * -9px), 0) scale(1.05);
                    transition: transform 600ms cubic-bezier(.2, .8, .2, 1);
                }

                .parallax-swiper.has-tilt .centered-swiper {
                    transform:
                        translate(-50%, -50%)
                        perspective(1100px)
                        rotateY(calc(var(--tilt-x, 0) * var(--tilt-deg, 6) * 1deg))
                        rotateX(calc(var(--tilt-y, 0) * var(--tilt-deg, 6) * -1deg));
                    transition: transform 450ms cubic-bezier(.2, .8, .2, 1);
                    will-change: transform;
                }

                .parallax-swiper .slider-cta-wrap {
                    display: flex;
                }

                /* ---------- Masked word reveal ---------- */
                .parallax-swiper .mask-word {
                    display: inline-block;
                    overflow: hidden;
                    vertical-align: top;
                    padding-bottom: .1em;
                    margin-bottom: -.1em;
                }

                .parallax-swiper .mask-word > span {
                    display: inline-block;
                }

                .parallax-swiper .slider-content.text-animation-mask .mask-word > span {
                    animation: parallaxMaskUp 820ms cubic-bezier(.2, .8, .2, 1) both;
                    animation-delay: calc(var(--i, 0) * 80ms + 80ms);
                }

                .parallax-swiper .slider-content.text-animation-mask .slider-meta,
                .parallax-swiper .slider-content.text-animation-mask .slider-text,
                .parallax-swiper .slider-content.text-animation-mask .slider-cta-wrap {
                    animation: parallaxTextFadeUp 720ms cubic-bezier(.2, .8, .2, 1) both;
                    animation-delay: 380ms;
                }

                .parallax-swiper .slider-content.text-animation-mask .slider-cta-wrap {
                    animation-delay: 480ms;
                }

                @keyframes parallaxMaskUp {
                    from { transform: translate3d(0, 115%, 0); }
                    to { transform: translate3d(0, 0, 0); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .parallax-swiper .mask-word > span,
                    .parallax-swiper .slider-content * {
                        animation: none !important;
                    }

                    .parallax-swiper .background-slide,
                    .parallax-swiper .background-slide img,
                    .parallax-swiper .centered-slide img {
                        transition: none !important;
                    }
                }

                @keyframes parallaxTextFadeUp {
                    from {
                        opacity: 0;
                        transform: translate3d(0, 22px, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }

                @keyframes parallaxTextSlideUp {
                    from {
                        opacity: 0;
                        transform: translate3d(42px, 0, 0);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0, 0, 0);
                    }
                }

                @keyframes parallaxTextFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 700px) {
                    .parallax-swiper {
                        min-height: 460px;
                    }

                    .parallax-swiper .slider-content-panel {
                        padding: 18px;
                    }

                    .parallax-swiper.nav-pos-sides .slider-actions {
                        padding: 0 max(8px, var(--button-offset));
                    }

                    .parallax-swiper.nav-pos-bottom .slider-actions,
                    .parallax-swiper.nav-pos-top .slider-actions {
                        right: 16px;
                    }

                    .parallax-swiper .slider-button {
                        width: max(38px, calc(var(--button-size) * 0.85));
                        height: max(38px, calc(var(--button-size) * 0.85));
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .parallax-swiper .slider-content {
                        animation: none !important;
                    }
                }
            `}</style>

            {dataSource === "CMS" && !isStaticRenderer ? (
                <div
                    ref={cmsSlidesHostRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: -100000,
                        top: 0,
                        width: 1200,
                        height: 1,
                        overflow: "hidden",
                        opacity: 0,
                        pointerEvents: "none",
                        zIndex: -1,
                    }}
                >
                    {cmsSlidesContent}
                </div>
            ) : null}

            <div className="slider-stage">
                <div
                    className="background-swiper swiper"
                    aria-label="Background slider"
                >
                    <div className="swiper-wrapper">
                        {normalizedSlides.map((slide, index) => (
                            <div
                                className="background-slide swiper-slide"
                                key={`background-${index}`}
                            >
                                {slide.image ? (
                                    <img
                                        src={slide.image}
                                        alt={slide.altText}
                                        draggable={false}
                                    />
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className={`centered-swiper swiper design-${resolvedCenterDesign}`}
                    style={
                        resolvedCenterDesign === "polaroid"
                            ? {
                                  border: `14px solid ${centerBackgroundColor}`,
                                  borderBottomWidth: "56px",
                                  borderRadius: `${resolvedCenterBorderRadius}px`,
                                  background: centerBackgroundColor,
                              }
                            : resolvedCenterDesign === "cellphone"
                              ? {
                                    border: `7px solid ${centerBackgroundColor}`,
                                    borderRadius: `${resolvedCenterBorderRadius}px`,
                                    backgroundColor: centerBackgroundColor,
                                    backgroundImage: "none",
                                }
                              : {
                                    borderRadius: `${resolvedCenterBorderRadius}px`,
                                    backgroundColor: centerBackgroundColor,
                                }
                    }
                >
                    {resolvedCenterDesign === "cellphone" ? (
                        <div
                            className="cellphone-backdrop"
                            aria-hidden="true"
                            style={{ background: centerBackgroundColor }}
                        />
                    ) : null}
                    <div className="swiper-wrapper">
                        {resolvedCenterDesign === "cellphone" ? (
                            <div
                                className="centered-slide swiper-slide"
                                key={`centered-active-${activeIndex}`}
                            >
                                {activeSlide?.image ? (
                                    <img
                                        src={activeSlide.image}
                                        alt={activeSlide.altText}
                                        draggable={false}
                                    />
                                ) : null}
                            </div>
                        ) : (
                            normalizedSlides.map((slide, index) => (
                                <div
                                    className="centered-slide swiper-slide"
                                    key={`centered-${index}`}
                                >
                                    {slide.image ? (
                                        <img
                                            src={slide.image}
                                            alt={slide.altText}
                                            draggable={false}
                                        />
                                    ) : null}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="slider-content-panel">{contentNode}</div>
                </div>

                <div className="slider-actions">
                    {showPreviousButton ? (
                        <button
                            className="slider-button prev slider-section__prev-button"
                            type="button"
                            aria-label="Previous slide"
                            disabled={isBeginning}
                            onClick={handlePrevious}
                        >
                            {previousIconSvg ? (
                                <img
                                    className="slider-button-icon"
                                    src={previousIconSvg}
                                    alt=""
                                    aria-hidden="true"
                                />
                            ) : (
                                previousIcon
                            )}
                        </button>
                    ) : null}
                    {showNextButton ? (
                        <button
                            className="slider-button next slider-section__next-button"
                            type="button"
                            aria-label="Next slide"
                            disabled={isEnd}
                            onClick={handleNext}
                        >
                            {nextIconSvg ? (
                                <img
                                    className="slider-button-icon"
                                    src={nextIconSvg}
                                    alt=""
                                    aria-hidden="true"
                                />
                            ) : (
                                nextIcon
                            )}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ParallaxSwiper, {
    dataSource: {
        type: ControlType.Enum,
        title: "Slide source",
        options: ["Manual", "CMS"],
        optionTitles: ["Manual slides", "Framer CMS"],
        defaultValue: "Manual",
    },
    cmsSlidesContent: {
        type: ControlType.ComponentInstance,
        title: "CMS Collection",
        description:
            "Connect a Collection List containing the Slide CMS Item component.",
        hidden: (props: any) => props.dataSource !== "CMS",
    },
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                altText: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide title",
                },
                text: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Slide description",
                },
                buttonLabel: {
                    type: ControlType.String,
                    title: "Button label",
                    defaultValue: "",
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button link",
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background color",
                    defaultValue: "#18191c",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
    },
    initialSlide: {
        type: ControlType.Number,
        title: "Initial slide",
        min: 0,
        max: 99,
        step: 1,
        defaultValue: 2,
        displayStepper: true,
    },
    spaceBetween: {
        type: ControlType.Number,
        title: "Space between",
        min: 0,
        max: 160,
        step: 1,
        defaultValue: 45,
        unit: "px",
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
    backgroundSlideSize: {
        type: ControlType.Number,
        title: "Background size",
        min: 80,
        max: 600,
        step: 10,
        defaultValue: 280,
        unit: "px",
    },
    centeredSlideWidth: {
        type: ControlType.Number,
        title: "Center width",
        min: 80,
        max: 600,
        step: 10,
        defaultValue: 280,
        unit: "px",
    },
    centeredSlideHeight: {
        type: ControlType.Number,
        title: "Center height",
        min: 100,
        max: 700,
        step: 10,
        defaultValue: 390,
        unit: "px",
    },
    centerBorderRadius: {
        type: ControlType.Number,
        title: "Center radius",
        min: 0,
        max: 160,
        step: 1,
        defaultValue: 24,
        unit: "px",
    },
    backgroundBorderRadius: {
        type: ControlType.Number,
        title: "Background radius",
        min: 0,
        max: 160,
        step: 1,
        defaultValue: 24,
        unit: "px",
    },
    centerDesign: {
        type: ControlType.Enum,
        title: "Center design",
        options: ["standard", "polaroid", "cellphone"],
        optionTitles: ["Standard", "Polaroid", "Cellphone"],
        defaultValue: "standard",
    },
    mouseTilt: {
        type: ControlType.Boolean,
        title: "Mouse tilt",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt strength",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 6,
        unit: "°",
        hidden: (props: any) => !props.mouseTilt,
    },
    depthEffect: {
        type: ControlType.Boolean,
        title: "Depth effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    parallaxAmount: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 60,
        step: 2,
        defaultValue: 24,
        unit: "px",
    },
    showCenterShadow: {
        type: ControlType.Boolean,
        title: "Center shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    centerShadow: {
        type: ControlType.String,
        title: "Shadow style",
        defaultValue: "0 18px 40px rgba(0, 0, 0, .32)",
        hidden: (props: any) => !props.showCenterShadow,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#18191c",
    },
    centerBackgroundColor: {
        type: ControlType.Color,
        title: "Center Background",
        defaultValue: "#101114",
    },
    centerOverlayBackground: {
        type: ControlType.String,
        title: "Center Overlay",
        defaultValue:
            "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)",
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            showPreviousButton: {
                type: ControlType.Boolean,
                title: "Previous button",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            showNextButton: {
                type: ControlType.Boolean,
                title: "Next button",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["sides", "bottom", "top"],
                optionTitles: ["Sides (Flanking)", "Bottom Right", "Top Right"],
                defaultValue: "sides",
            },
            previousIcon: {
                type: ControlType.String,
                title: "Previous icon",
                defaultValue: "←",
            },
            previousIconSvg: {
                type: ControlType.File,
                title: "Previous SVG",
                allowedFileTypes: ["svg"],
            },
            nextIcon: {
                type: ControlType.String,
                title: "Next icon",
                defaultValue: "→",
            },
            nextIconSvg: {
                type: ControlType.File,
                title: "Next SVG",
                allowedFileTypes: ["svg"],
            },
            iconColor: {
                type: ControlType.Color,
                title: "Icon color",
                defaultValue: "#ffffff",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255, 255, 255, 0.12)",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border color",
                defaultValue: "rgba(255, 255, 255, 0.2)",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border width",
                min: 0,
                max: 8,
                step: 1,
                defaultValue: 1,
                unit: "px",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover background",
                defaultValue: "#ffffff",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover icon color",
                defaultValue: "#18191c",
            },
            size: {
                type: ControlType.Number,
                title: "Button size",
                min: 28,
                max: 120,
                step: 2,
                defaultValue: 52,
                unit: "px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon size",
                min: 10,
                max: 64,
                step: 1,
                defaultValue: 18,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Button radius",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 16,
                unit: "px",
            },
            offset: {
                type: ControlType.Number,
                title: "Button offset",
                min: 0,
                max: 120,
                step: 2,
                defaultValue: 32,
                unit: "px",
            },
        },
    },
    cta: {
        type: ControlType.Object,
        title: "CTA Button",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ffffff",
            },
            color: {
                type: ControlType.Color,
                title: "Text color",
                defaultValue: "#101828",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover background",
                defaultValue: "#101828",
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover text color",
                defaultValue: "#ffffff",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 999,
                step: 1,
                defaultValue: 999,
                unit: "px",
            },
            design: {
                type: ControlType.Enum,
                title: "Design",
                options: ["solid", "outline", "glass", "ghost"],
                optionTitles: ["Solid", "Outline", "Glass", "Ghost"],
                defaultValue: "solid",
            },
            animation: {
                type: ControlType.Enum,
                title: "Animation",
                options: ["none", "lift", "scale", "shine", "pulse"],
                optionTitles: ["None", "Lift", "Scale", "Shine", "Pulse"],
                defaultValue: "lift",
            },
            hoverAnimation: {
                type: ControlType.Enum,
                title: "Hover background animation",
                options: [
                    "none",
                    "fade",
                    "fillLeft",
                    "fillRight",
                    "fillCenter",
                ],
                optionTitles: [
                    "None",
                    "Fade",
                    "Fill left",
                    "Fill right",
                    "Fill center",
                ],
                defaultValue: "fade",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
            },
            transform: {
                type: ControlType.Enum,
                title: "Text transform",
                options: ["none", "uppercase", "lowercase", "capitalize"],
                optionTitles: [
                    "Default",
                    "Uppercase",
                    "Lowercase",
                    "Capitalize",
                ],
                defaultValue: "none",
            },
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Title color",
        defaultValue: "#ffffff",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description color",
        defaultValue: "#b8bbc2",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description font",
        controls: "extended",
    },
    textAnimation: {
        type: ControlType.Enum,
        title: "Text animation",
        options: ["mask", "fadeUp", "slideUp", "fade", "none"],
        optionTitles: ["Masked reveal", "Fade up", "Slide in", "Fade", "None"],
        defaultValue: "mask",
    },
})

export function SwiperCMSItem(props: SwiperCMSItemProps) {
    const title = getCMSString(props.title)
    const text = getCMSString(props.text)
    const buttonLabel = getCMSString(props.buttonLabel)
    const backgroundColor = getCMSString(props.backgroundColor)

    return (
        <div
            data-swiper-cms-item={serializeCMSValue({
                visible: getCMSBoolean(props.visible, true),
                image: getImageSource(props.image),
                altText: getCMSString(props.altText) || title,
                title,
                text,
                buttonLabel,
                buttonLink: getCMSLink(props.buttonLink),
                backgroundColor,
            })}
            aria-hidden="true"
            style={{
                position: "absolute",
                width: 1,
                height: 1,
                overflow: "hidden",
                opacity: 0,
                pointerEvents: "none",
            }}
        >
            <span>{title}</span>
            <span>{text}</span>
        </div>
    )
}

addPropertyControls(SwiperCMSItem, {
    visible: {
        type: ControlType.Boolean,
        title: "Visible",
        defaultValue: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    altText: {
        type: ControlType.String,
        title: "Alt text",
        defaultValue: "",
    },
    title: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Slide title",
    },
    text: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue: "",
    },
    buttonLabel: {
        type: ControlType.String,
        title: "Button label",
        defaultValue: "",
    },
    buttonLink: {
        type: ControlType.Link,
        title: "Button link",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background color",
        defaultValue: "#18191c",
    },
})
