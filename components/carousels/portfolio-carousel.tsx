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

export type Slide = {
    image?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    title?: string
    category?: string
    description?: string
    tags?: string
    link?: string
    alt?: string
}
export type FolioFocusProps = {
    slides?: Slide[]
    theme?: "light" | "dark"
    style?: React.CSSProperties
    label?: string
    [key: string]: any
}
type InputMode = "mouse" | "touch" | "keyboard"
type IndicatorMotion = {
    index: number
    direction: number
    distance: number
    steps: number
}
type Gesture = {
    id: number
    x: number
    y: number
    dx: number
    applied: number
    velocity: number
    sampledAt: number
    direction: "x" | "y"
    axis: "pending" | "x" | "y"
    pointer: string
    target: HTMLDivElement
}
type ProjectImageProps = {
    image?: Slide["image"]
    alt?: string
    style: React.CSSProperties
    eager: boolean
}
const defaultOptions = {
    layout: {
        cardWidth: 380,
        ratio: 0.75,
        gap: 16,
        radius: 16,
        imageFit: "cover",
        alignment: "center",
    },
    hover: {
        grayscale: true,
        normalGray: 100,
        hoverGray: 0,
        dim: 0.12,
        duration: 300,
        easing: "ease-out",
    },
    background: {
        enabled: true,
        blur: 40,
        brightness: 40,
        saturation: 60,
        scale: 115,
        duration: 450,
        color: "#121212",
        lightColor: "rgba(18,18,18,.3)",
        lightBrightness: 100,
    },
    carousel: {
        drag: true,
        swipe: true,
        wheel: true,
        loop: true,
        autoplay: false,
        resumeDelay: 1.2,
        speed: 40,
        touchSpeed: 1.6,
        duration: 600,
        snap: "center",
        arrows: false,
    },
    pagination: {
        show: true,
        activeColor: "#FFFFFF",
        inactiveColor: "#777777",
        lightActiveColor: "#212121",
        lightInactiveColor: "#999999",
        height: 8,
        activeWidth: 24,
        gap: 16,
        alignment: "center",
    },
    panel: {
        reveal: true,
        category: true,
        tags: true,
        color: "rgba(0,0,0,.5)",
        lightColor: "rgba(254,254,254,.7)",
        newTab: true,
    },
    typography: {
        color: "#FEFEFE",
        lightColor: "#212121",
        alignment: "left",
        titleFont: {
            fontFamily: "Pretendard, Pretendard SemiBold, sans-serif",
            fontSize: 24,
            fontWeight: 600,
            lineHeight: "1.2em",
        },
        descriptionFont: {
            fontFamily: "Pretendard, Pretendard Medium, sans-serif",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: -0.2,
            lineHeight: "26px",
        },
    },
}
const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value))
const finiteNumber = (value: number, fallback: number) =>
    Number.isFinite(value) ? value : fallback
const flexAlignment = (alignment: string) =>
    alignment === "start"
        ? "flex-start"
        : alignment === "end"
          ? "flex-end"
          : "center"
function noop() {}
function safeLink(url?: string | null) {
    const trimmedUrl = (url == null ? void 0 : url.trim()) || ""
    return /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(trimmedUrl)
        ? trimmedUrl
        : void 0
}
const sampleContent = {
    category: "Category",
    title: "Project name",
    description: "Designers can take control of HTML, CSS, and JavaScript.",
    tags: "Hash Tag",
}
const fallbackText = (value: string | null | undefined, fallback: string) =>
    value != null && value.trim() ? value : fallback
const exampleSlides = [
    "https://framerusercontent.com/images/JehOLRnFGoyq6R6n3EDjgOSifEs.png?width=4320&height=3240",
    "https://framerusercontent.com/images/TZYs6KBHDJkafz8Ni4FSrLxJjk.jpg?width=4320&height=3240",
    "https://framerusercontent.com/images/2Zk4ksNbiMHwfHabIpLRVuB7uyE.png?width=4320&height=3240",
    "https://framerusercontent.com/images/S6mtsCeJDQxCT1RkUYZl7uSsjBI.png?width=4320&height=3240",
    "https://framerusercontent.com/images/ZmUP14xzba7YIwZcx7LFcAga60.png?width=4320&height=3240&scale-down-to=512",
].map((S, P) => ({
    ...sampleContent,
    image: { src: S, alt: `Portfolio project ${P + 1}` },
    link: "",
}))
function imageUrlAtSize(url: string, size: number) {
    if (!url.startsWith("https://framerusercontent.com/images/")) return url
    const parsedUrl = new URL(url)
    parsedUrl.searchParams.set("scale-down-to", String(size))
    return parsedUrl.toString()
}
function useReducedMotion() {
    const [reducedMotion, setReducedMotion] = React.useState(false)
    React.useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => setReducedMotion(media.matches)
        updatePreference()
        media.addEventListener("change", updatePreference)
        return () => media.removeEventListener("change", updatePreference)
    }, [])
    return reducedMotion
}
function useViewportWidth() {
    const [width, setWidth] = React.useState(1200)
    React.useEffect(() => {
        const update = () => setWidth(window.innerWidth)
        update()
        window.addEventListener("resize", update, { passive: true })
        return () => window.removeEventListener("resize", update)
    }, [])
    return width
}
function responsiveFontStyle(
    font: React.CSSProperties,
    scale: number,
    minimum: number
): React.CSSProperties {
    const value = font.fontSize
    const size =
        typeof value === "number"
            ? value
            : typeof value === "string" &&
                /^\d+(?:\.\d+)?(?:px)?$/.test(value.trim())
              ? parseFloat(value)
              : null
    if (!size || !Number.isFinite(size)) return font
    const fontSize = Math.round(Math.max(minimum, size * scale) * 100) / 100
    const ratio = fontSize / size
    const pixels = (length: string | number | undefined) =>
        typeof length === "string" && /^-?\d*(?:\.\d+)?px$/.test(length.trim())
            ? `${Math.round(parseFloat(length) * ratio * 100) / 100}px`
            : length
    return {
        ...font,
        fontSize,
        lineHeight: pixels(font.lineHeight),
        letterSpacing:
            typeof font.letterSpacing === "number"
                ? font.letterSpacing * ratio
                : pixels(font.letterSpacing),
    }
}
function advanceIndicator(
    state: IndicatorMotion,
    delta: number,
    count: number,
    loop: boolean
) {
    if (!delta || count < 2) return state.index
    const direction = Math.sign(delta)
    if (direction !== state.direction) {
        state.direction = direction
        state.distance = 0
        state.steps = 0
    }
    state.distance += Math.abs(delta)
    const steps =
        state.distance < 0.25 ? 0 : Math.floor(state.distance - 0.25 + 1e-9) + 1
    const next = state.index + direction * (steps - state.steps)
    state.steps = steps
    state.index = loop
        ? ((next % count) + count) % count
        : Math.max(0, Math.min(count - 1, next))
    return state.index
}
const ProjectImage = React.memo(
    function ({ image, alt, style, eager }: ProjectImageProps) {
        const [hasError, setHasError] = React.useState(false)
        React.useEffect(() => setHasError(false), [image?.src, image?.srcSet])
        return image != null && image.src && !hasError ? (
            <img
                className="ff-image"
                src={imageUrlAtSize(image.src, 2048)}
                srcSet={image.srcSet}
                sizes={`${Math.ceil(Number(style.width) || 320)}px`}
                alt={alt}
                loading={eager ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                onError={() => setHasError(true)}
                style={style}
            />
        ) : (
            <div
                role="img"
                aria-label={alt || "Project image unavailable"}
                style={{
                    ...style,
                    display: "grid",
                    placeItems: "center",
                    background: "#292d35",
                    color: "#b8bfcd",
                    fontSize: 12,
                }}
            >
                {"Image unavailable"}
            </div>
        )
    },
    (previous, next) => {
        return (
            previous.image?.src === next.image?.src &&
            previous.image?.srcSet === next.image?.srcSet &&
            previous.alt === next.alt &&
            previous.eager === next.eager &&
            (Object.keys(next.style) as (keyof React.CSSProperties)[]).every(
                (key) => previous.style[key] === next.style[key]
            )
        )
    }
)
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 */
export default function FolioFocus(props: FolioFocusProps) {
    const panelReveal = props.panel?.reveal ?? props.hover?.reveal ?? true
    const autoSize = props.typography?.autoSize ?? props.panel?.autoSize ?? true
    const autoIdleUntil = React.useRef(0)
    const hasMouseInput = React.useRef(false)
    const [selectedDot, setSelectedDot] = React.useState(0)
    const selectedDotRef = React.useRef(0)
    const indicatorMotion = React.useRef<IndicatorMotion>({
        index: 0,
        direction: 0,
        distance: 0,
        steps: 0,
    })
    const viewportWidth = useViewportWidth()
    const stackInteraction = React.useRef({ hover: false, focus: false })
    const isLight = props.theme === "light"
    const layoutOptions = { ...defaultOptions.layout, ...props.layout }
    const hoverOptions = { ...defaultOptions.hover, ...props.hover }
    const backgroundOptions = {
        ...defaultOptions.background,
        ...props.background,
    }
    const carouselOptions = { ...defaultOptions.carousel, ...props.carousel }
    const paginationOptions = {
        ...defaultOptions.pagination,
        ...props.pagination,
    }
    const panelOptions = { ...defaultOptions.panel, ...props.panel }
    const typographyOptions = {
        ...defaultOptions.typography,
        ...props.typography,
    }
    const textColor = isLight
        ? typographyOptions.lightColor
        : typographyOptions.color
    const panelColor = isLight ? panelOptions.lightColor : panelOptions.color
    const backgroundColor = isLight
        ? backgroundOptions.lightColor
        : backgroundOptions.color
    const backgroundBrightness = isLight
        ? backgroundOptions.lightBrightness
        : backgroundOptions.brightness
    const sourceCards: Slide[] = props.slides ?? exampleSlides
    const cards = React.useMemo(
        () =>
            sourceCards.map((g) => ({
                ...g,
                title: fallbackText(g.title, sampleContent.title),
                category: fallbackText(g.category, sampleContent.category),
                description: fallbackText(
                    g.description,
                    sampleContent.description
                ),
                tags: fallbackText(g.tags, sampleContent.tags),
            })),
        [sourceCards]
    )
    const cardCount = cards.length
    const rootRef = React.useRef<HTMLDivElement>(null)
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<Array<HTMLElement | undefined>>([])
    const [containerWidth, setContainerWidth] = React.useState(1200)
    const [virtualPosition, setVirtualPosition] = React.useState(0)
    const isLooping = carouselOptions.loop && cardCount > 1
    const currentCardIndex = isLooping
        ? ((Math.round(virtualPosition) % cardCount) + cardCount) % cardCount
        : clamp(Math.round(virtualPosition), 0, Math.max(0, cardCount - 1))
    const [isFreeMotion, setFreeMotion] = React.useState(false)
    const positionRef = React.useRef(0)
    const hasFreePositionRef = React.useRef(false)
    const publishedPositionRef = React.useRef(0)
    const [isRebasing, setRebasing] = React.useState(false)
    const [hoveredSlot, setHoveredSlot] = React.useState<number | null>(null)
    const [focusedSlot, setFocusedSlot] = React.useState<number | null>(null)
    const [inputMode, setInputMode] = React.useState<InputMode>("mouse")
    const [hasFocus, setHasFocus] = React.useState(false)
    const [isPointerInside, setPointerInside] = React.useState(false)
    const [isDocumentHidden, setDocumentHidden] = React.useState(false)
    const [isDragging, setDragging] = React.useState(false)
    const reducedMotion = useReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const keyboardModeRef = React.useRef(false)
    const suppressClickUntil = React.useRef(0)
    const suppressMouseUntil = React.useRef(0)
    const pointerPositionRef = React.useRef<{
        x: number
        y: number
    } | null>(null)
    const gestureRef = React.useRef<Gesture | null>(null)
    const inertiaFrameRef = React.useRef(0)
    const stopInertia = () => {
        inertiaFrameRef.current &&
            (cancelAnimationFrame(inertiaFrameRef.current),
            (inertiaFrameRef.current = 0),
            setDragging(false))
    }
    const motionFrameRef = React.useRef(0)
    const pendingPixelsRef = React.useRef(0)
    const flushMovementRef = React.useRef(noop)
    const updateHoverRef = React.useRef(noop)
    const hoveredSlotRef = React.useRef<number | null>(null)
    hoveredSlotRef.current = hoveredSlot
    const autoplayEnabled = Boolean(
        carouselOptions.loop && carouselOptions.autoplay
    )
    const resumeDelayMs =
        Math.max(0, finiteNumber(carouselOptions.resumeDelay, 1.2)) * 1000
    React.useEffect(() => {
        if (autoplayEnabled)
            autoIdleUntil.current = performance.now() + resumeDelayMs
    }, [autoplayEnabled, resumeDelayMs])
    const cardSignature = cards
        .map((g) => {
            return `${g.image?.src || ""}\0${g.title || ""}`
        })
        .join("")
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            if (width > 0) setContainerWidth(width)
        })
        observer.observe(root)
        return () => observer.disconnect()
    }, [])
    React.useEffect(() => {
        hasFreePositionRef.current = false
        setVirtualPosition((g) => clamp(g, 0, Math.max(0, cardCount - 1)))
        setHoveredSlot(null)
        setFocusedSlot(null)
        setDragging(false)
        gestureRef.current = null
        selectedDotRef.current = clamp(
            Math.round(virtualPosition),
            0,
            Math.max(0, cardCount - 1)
        )
        setSelectedDot(selectedDotRef.current)
        indicatorMotion.current = {
            index: selectedDotRef.current,
            direction: 0,
            distance: 0,
            steps: 0,
        }
    }, [cardSignature, cardCount, carouselOptions.loop])
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.metaKey && !event.altKey && !event.ctrlKey)
                keyboardModeRef.current = true
        }
        const resetKeyboardMode = () => {
            keyboardModeRef.current = false
        }
        const updateVisibility = () => setDocumentHidden(document.hidden)
        document.addEventListener("keydown", handleKeyDown, true)
        document.addEventListener("pointerdown", resetKeyboardMode, true)
        document.addEventListener("visibilitychange", updateVisibility)
        updateVisibility()
        return () => {
            document.removeEventListener("keydown", handleKeyDown, true)
            document.removeEventListener("pointerdown", resetKeyboardMode, true)
            document.removeEventListener("visibilitychange", updateVisibility)
        }
    }, [])
    const cardAlignment = carouselOptions.loop ? carouselOptions.snap : "start"
    const groupAlignment = carouselOptions.loop
        ? "center"
        : layoutOptions.alignment
    const horizontalPadding = Math.min(
        containerWidth < 600 ? 20 : 32,
        Math.max(0, (containerWidth - 80) / 2)
    )
    const cardWidth = Math.max(
        40,
        Math.min(
            finiteNumber(layoutOptions.cardWidth, 380),
            containerWidth - horizontalPadding * 2
        )
    )
    const cardRatio =
        Math.round(
            clamp(finiteNumber(layoutOptions.ratio, 0.75), 0.25, 3) * 100
        ) / 100
    const cardHeight = cardWidth / cardRatio
    const cardGap = Math.max(0, layoutOptions.gap)
    const cardStep = cardWidth + cardGap
    const verticalPadding = 32
    const paginationHeight = paginationOptions.show && cardCount > 1 ? 60 : 0
    const intrinsicHeight =
        cardHeight + 8 + verticalPadding * 2 + paginationHeight
    const cardsWidth =
        cardCount * cardWidth + Math.max(0, cardCount - 1) * cardGap
    const allCardsFit = cardsWidth <= containerWidth - horizontalPadding * 2
    const groupOffset =
        groupAlignment === "start"
            ? horizontalPadding
            : groupAlignment === "end"
              ? containerWidth - horizontalPadding - cardsWidth
              : (containerWidth - cardsWidth) / 2
    const cardAnchor =
        cardAlignment === "start"
            ? horizontalPadding
            : cardAlignment === "end"
              ? containerWidth - horizontalPadding - cardWidth
              : (containerWidth - cardWidth) / 2
    const cloneBuffer = isLooping ? Math.ceil(containerWidth / cardStep) + 1 : 0
    const cardSlots = Array.from(
        { length: cardCount + cloneBuffer * 2 },
        (_item, index) => index - cloneBuffer
    )
    const finiteStart = horizontalPadding
    const finiteEnd = containerWidth - horizontalPadding - cardsWidth
    const finiteMin = (cardAnchor - finiteStart) / cardStep
    const finiteMax = (cardAnchor - finiteEnd) / cardStep
    const renderPosition =
        isFreeMotion && hasFreePositionRef.current
            ? positionRef.current
            : virtualPosition
    const trackOffset = isLooping
        ? cardAnchor - (renderPosition + cloneBuffer) * cardStep
        : allCardsFit
          ? groupOffset
          : clamp(
                cardAnchor - renderPosition * cardStep,
                finiteEnd,
                finiteStart
            )
    const screenScale =
        0.9 +
        0.1 * clamp((Math.min(containerWidth, viewportWidth) - 390) / 810, 0, 1)
    const textScale = autoSize === false ? 1 : (cardWidth / 380) * screenScale
    const titleTextStyle = responsiveFontStyle(
        {
            ...defaultOptions.typography.titleFont,
            ...props.panel?.titleFont,
            ...props.typography?.titleFont,
        },
        textScale,
        autoSize === false ? 0 : 20
    )
    const descriptionTextStyle = responsiveFontStyle(
        {
            ...defaultOptions.typography.descriptionFont,
            ...props.panel?.descriptionFont,
            ...props.typography?.descriptionFont,
        },
        textScale,
        autoSize === false ? 0 : 14
    )
    const tagTextStyle = responsiveFontStyle(
        {
            fontFamily: "Pretendard, sans-serif",
            fontSize: 14,
            fontWeight: isLight ? 500 : 400,
            lineHeight: "1.2em",
            ...props.panel?.tagFont,
            ...props.typography?.tagFont,
        },
        textScale,
        autoSize === false ? 0 : 12
    )
    const categoryTextStyle = responsiveFontStyle(
        {
            fontFamily: isLight
                ? "Pretendard SemiBold, Pretendard, sans-serif"
                : "Pretendard Medium, Pretendard, sans-serif",
            fontSize: 14,
            fontWeight: isLight ? 600 : 500,
            lineHeight: "14px",
            ...props.panel?.categoryFont,
            ...props.typography?.categoryFont,
        },
        textScale,
        autoSize === false ? 0 : 12
    )
    React.useLayoutEffect(() => {
        if (!hasFreePositionRef.current || !trackRef.current) return
        const g = positionRef.current
        const v = isLooping
            ? cardAnchor - (g + cloneBuffer) * cardStep
            : allCardsFit
              ? groupOffset
              : clamp(cardAnchor - g * cardStep, finiteEnd, finiteStart)
        trackRef.current.style.transition = "none"
        trackRef.current.style.transform = `translate3d(${v}px,0,0)`
    })
    React.useEffect(() => {
        if (
            !isLooping ||
            isDragging ||
            (virtualPosition >= 0 && virtualPosition < cardCount)
        )
            return
        const g = window.setTimeout(
            () => {
                var M
                const v = !!(
                    (M = rootRef.current) != null &&
                    M.querySelector(".ff-card:focus, .ff-card a:focus")
                )
                setRebasing(true)
                setVirtualPosition(
                    ((virtualPosition % cardCount) + cardCount) % cardCount
                )
                v &&
                    requestAnimationFrame(() => {
                        var J
                        return (J =
                            cardRefs.current[
                                ((virtualPosition % cardCount) + cardCount) %
                                    cardCount
                            ]) == null
                            ? void 0
                            : J.focus({ preventScroll: true })
                    })
            },
            reducedMotion || isCanvas ? 0 : carouselOptions.duration + 20
        )
        return () => clearTimeout(g)
    }, [
        virtualPosition,
        isLooping,
        cardCount,
        isDragging,
        carouselOptions.duration,
        reducedMotion,
        isCanvas,
    ])
    React.useLayoutEffect(() => {
        var M
        if (!isRebasing) return
        ;(M = trackRef.current) == null || M.getBoundingClientRect()
        let g = 0
        const v = requestAnimationFrame(() => {
            g = requestAnimationFrame(() => setRebasing(false))
        })
        return () => {
            cancelAnimationFrame(v)
            cancelAnimationFrame(g)
        }
    }, [isRebasing])
    // A loop can show several copies of one project. Inspect only the rendered slot.
    const inspectedSlot = inputMode === "mouse" ? hoveredSlot : focusedSlot
    const inspectedIndex =
        inspectedSlot === null || !cardCount
            ? -1
            : ((inspectedSlot % cardCount) + cardCount) % cardCount
    const inspectedImage = cards[inspectedIndex]?.image?.src || ""
    const desiredBackgroundSrc =
        backgroundOptions.enabled && inspectedImage
            ? imageUrlAtSize(inspectedImage, 1024)
            : ""
    const [backgroundLoadState, setBackgroundLoadState] = React.useState<
        Record<string, boolean>
    >({})
    const [backgroundSources, setBackgroundSources] = React.useState<string[]>(
        []
    )
    const [shownBackgroundSrc, setShownBackgroundSrc] = React.useState("")
    const desiredBackgroundRef = React.useRef(desiredBackgroundSrc)
    React.useEffect(() => {
        if (inspectedIndex >= 0 && inspectedIndex < cardCount) {
            selectedDotRef.current = inspectedIndex
            setSelectedDot(inspectedIndex)
            indicatorMotion.current = {
                index: inspectedIndex,
                direction: 0,
                distance: 0,
                steps: 0,
            }
        }
    }, [inspectedIndex, cardCount])
    desiredBackgroundRef.current = desiredBackgroundSrc
    React.useEffect(() => {
        if (!desiredBackgroundSrc) {
            setShownBackgroundSrc("")
            return
        }
        backgroundLoadState[desiredBackgroundSrc]
            ? setShownBackgroundSrc(desiredBackgroundSrc)
            : backgroundLoadState[desiredBackgroundSrc] === false &&
              setShownBackgroundSrc("")
        setBackgroundSources((g) =>
            g.includes(desiredBackgroundSrc) ? g : [...g, desiredBackgroundSrc]
        )
    }, [desiredBackgroundSrc, backgroundLoadState])
    React.useEffect(() => {
        const g = window.setTimeout(
            () =>
                setBackgroundSources((v) => {
                    const M = v.filter(
                        (J, he) =>
                            J === shownBackgroundSrc ||
                            J === desiredBackgroundSrc ||
                            he >= v.length - 6
                    )
                    return M.length === v.length ? v : M
                }),
            reducedMotion || isCanvas ? 0 : backgroundOptions.duration + 50
        )
        return () => clearTimeout(g)
    }, [
        shownBackgroundSrc,
        desiredBackgroundSrc,
        backgroundOptions.duration,
        reducedMotion,
        isCanvas,
    ])
    React.useEffect(() => {
        const g = new Set(
            cards
                .map((v) => {
                    return v.image?.src ? imageUrlAtSize(v.image.src, 1024) : ""
                })
                .filter(Boolean)
        )
        setBackgroundSources((v) => v.filter((M) => g.has(M)))
        setBackgroundLoadState((v) =>
            Object.fromEntries(Object.entries(v).filter(([M]) => g.has(M)))
        )
    }, [cardSignature])
    const goToCard = React.useCallback(
        (g: number, v = false) => {
            var he
            if (!cardCount) return
            autoIdleUntil.current =
                performance.now() +
                (reducedMotion || isCanvas ? 0 : carouselOptions.duration) +
                resumeDelayMs
            stopInertia()
            flushMovementRef.current()
            const M = hasFreePositionRef.current
                ? positionRef.current
                : virtualPosition
            hasFreePositionRef.current = false
            setFreeMotion(false)
            const J = carouselOptions.loop
                ? ((g % cardCount) + cardCount) % cardCount
                : clamp(g, 0, cardCount - 1)
            selectedDotRef.current = J
            setSelectedDot(J)
            indicatorMotion.current = {
                index: J,
                direction: 0,
                distance: 0,
                steps: 0,
            }
            if (isLooping) {
                let de = g - (((M % cardCount) + cardCount) % cardCount)
                g >= 0 &&
                    g < cardCount &&
                    Math.abs(de) > cardCount / 2 &&
                    (de -= Math.sign(de) * cardCount)
                setVirtualPosition(M + de)
            } else
                setVirtualPosition(
                    allCardsFit ? J : clamp(J, finiteMin, finiteMax)
                )
            setHoveredSlot(null)
            v &&
                ((he = cardRefs.current[J]) == null ||
                    he.focus({ preventScroll: true }))
        },
        [
            cardCount,
            carouselOptions.loop,
            carouselOptions.duration,
            isLooping,
            virtualPosition,
            resumeDelayMs,
            reducedMotion,
            isCanvas,
            allCardsFit,
            finiteMin,
            finiteMax,
        ]
    )
    React.useEffect(() => {
        if (!isPointerInside || inputMode !== "mouse" || isDocumentHidden) {
            updateHoverRef.current = noop
            return
        }
        let frame = 0
        const transitionUntil =
            !isFreeMotion && !reducedMotion && !isCanvas
                ? performance.now() + carouselOptions.duration
                : 0
        const checkHover = () => {
            frame = 0
            const point = pointerPositionRef.current
            const target = point
                ? document.elementFromPoint(point.x, point.y)
                : null
            const card = target?.closest<HTMLElement>(".ff-card")
            const index =
                card && viewportRef.current?.contains(card)
                    ? Number(card.dataset.slot)
                    : null
            if (hoveredSlotRef.current !== index) {
                hoveredSlotRef.current = index
                setHoveredSlot(index)
            }
            if (performance.now() < transitionUntil)
                frame = requestAnimationFrame(checkHover)
        }
        const scheduleHover = () => {
            if (!frame) frame = requestAnimationFrame(checkHover)
        }
        updateHoverRef.current = scheduleHover
        scheduleHover()
        return () => {
            cancelAnimationFrame(frame)
            updateHoverRef.current = noop
        }
    }, [
        isPointerInside,
        inputMode,
        isDocumentHidden,
        virtualPosition,
        isFreeMotion,
        isRebasing,
        carouselOptions.duration,
        reducedMotion,
        isCanvas,
    ])
    flushMovementRef.current = () => {
        cancelAnimationFrame(motionFrameRef.current)
        motionFrameRef.current = 0
        const g = pendingPixelsRef.current
        if (((pendingPixelsRef.current = 0), !g)) return
        const current = hasFreePositionRef.current
            ? positionRef.current
            : virtualPosition
        const v =
            !isLooping && !allCardsFit
                ? clamp(current, finiteMin, finiteMax)
                : current
        let M = v + g / cardStep
        isLooping
            ? (M = ((M % cardCount) + cardCount) % cardCount)
            : allCardsFit
              ? (M = v)
              : (M = clamp(M, finiteMin, finiteMax))
        positionRef.current = M
        const J = !hasFreePositionRef.current
        hasFreePositionRef.current = true
        if (M !== v && inspectedIndex < 0) {
            const delta = isLooping
                ? g / cardStep
                : ((M - v) * (cardCount - 1)) /
                  Math.max(1e-9, finiteMax - finiteMin)
            let next = advanceIndicator(
                indicatorMotion.current,
                delta,
                cardCount,
                isLooping
            )
            if (
                !isLooping &&
                (M <= finiteMin + 1e-9 || M >= finiteMax - 1e-9)
            ) {
                next = M <= finiteMin + 1e-9 ? 0 : cardCount - 1
                indicatorMotion.current = {
                    index: next,
                    direction: 0,
                    distance: 0,
                    steps: 0,
                }
            }
            if (next !== selectedDotRef.current) {
                selectedDotRef.current = next
                setSelectedDot(next)
            }
        }
        const he = isLooping
            ? cardAnchor - (M + cloneBuffer) * cardStep
            : allCardsFit
              ? groupOffset
              : clamp(cardAnchor - M * cardStep, finiteEnd, finiteStart)
        trackRef.current &&
            ((trackRef.current.style.transition = "none"),
            (trackRef.current.style.transform = `translate3d(${he}px,0,0)`))
        J && setFreeMotion(true)
        ;(J || Math.round(M) !== Math.round(publishedPositionRef.current)) &&
            ((publishedPositionRef.current = M), setVirtualPosition(M))
        updateHoverRef.current()
    }
    const queueMovement = (g: number) => {
        pendingPixelsRef.current += g
        motionFrameRef.current ||
            (motionFrameRef.current = requestAnimationFrame(() =>
                flushMovementRef.current()
            ))
    }
    React.useEffect(() => {
        if (
            !autoplayEnabled ||
            cardCount < 2 ||
            isDocumentHidden ||
            reducedMotion ||
            isCanvas
        )
            return
        let frame = 0
        let previous = 0
        const advance = (now: number) => {
            const dt = previous ? Math.min(40, now - previous) : 0
            previous = now
            if (
                now >= autoIdleUntil.current &&
                !stackInteraction.current.hover &&
                !stackInteraction.current.focus &&
                !gestureRef.current &&
                !inertiaFrameRef.current &&
                !(inputMode === "touch" && focusedSlot !== null)
            ) {
                queueMovement(
                    (Math.max(1, carouselOptions.speed ?? 40) * dt) / 1000
                )
                flushMovementRef.current()
            }
            frame = requestAnimationFrame(advance)
        }
        frame = requestAnimationFrame(advance)
        return () => cancelAnimationFrame(frame)
    }, [
        autoplayEnabled,
        carouselOptions.speed,
        cardCount,
        isDocumentHidden,
        reducedMotion,
        isCanvas,
        cardStep,
        isLooping,
        allCardsFit,
        cardAnchor,
        horizontalPadding,
        containerWidth,
        cardsWidth,
        inputMode,
        focusedSlot,
    ])
    React.useEffect(
        () => () => {
            stopInertia()
            cancelAnimationFrame(motionFrameRef.current)
            pendingPixelsRef.current = 0
        },
        [cardSignature, cardCount, cardStep, carouselOptions.loop]
    )
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || !carouselOptions.wheel || cardCount < 2 || isCanvas) return
        let wheelEndTimer = 0
        const handleWheel = (event: WheelEvent) => {
            if (event.ctrlKey || event.metaKey) return
            const delta =
                Math.abs(event.deltaX) >= Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY
            if (!delta || gestureRef.current) return
            autoIdleUntil.current = performance.now() + resumeDelayMs
            event.preventDefault()
            stopInertia()
            const unit =
                event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? root.clientWidth
                      : 1
            hasMouseInput.current = true
            queueMovement(delta * unit)
            pointerPositionRef.current = { x: event.clientX, y: event.clientY }
            setPointerInside(true)
            setInputMode("mouse")
            setFocusedSlot(null)
            setDragging(true)
            clearTimeout(wheelEndTimer)
            wheelEndTimer = window.setTimeout(() => {
                flushMovementRef.current()
                if (hasFreePositionRef.current)
                    setVirtualPosition(positionRef.current)
                setDragging(false)
            }, 160)
        }
        root.addEventListener("wheel", handleWheel, { passive: false })
        return () => {
            clearTimeout(wheelEndTimer)
            root.removeEventListener("wheel", handleWheel)
        }
    }, [
        carouselOptions.wheel,
        isLooping,
        cardCount,
        isCanvas,
        cardStep,
        allCardsFit,
        cardAnchor,
        horizontalPadding,
        containerWidth,
        cardsWidth,
        resumeDelayMs,
    ])
    function handlePointerDown(
        event: React.PointerEvent<HTMLDivElement>,
        cardSlot: number | null
    ) {
        autoIdleUntil.current = performance.now() + resumeDelayMs
        if (!event.isPrimary || event.button !== 0) return
        if ((event.target as Element).closest("button,a:not(.ff-card)")) {
            suppressClickUntil.current = 0
            return
        }
        stopInertia()
        suppressClickUntil.current = 0
        flushMovementRef.current()
        const isTouch = event.pointerType !== "mouse"
        stackInteraction.current.focus = false
        if (isTouch) {
            stackInteraction.current.hover = false
            suppressMouseUntil.current = Date.now() + 800
        }
        setInputMode(isTouch ? "touch" : "mouse")
        setFocusedSlot(isTouch ? cardSlot : null)
        isTouch && setHoveredSlot(null)
        if (
            !isTouch &&
            carouselOptions.drag &&
            !(event.target as Element).closest("a.ff-card")
        ) {
            event.currentTarget.setPointerCapture(event.pointerId)
        }
        gestureRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            dx: 0,
            applied: 0,
            velocity: 0,
            sampledAt: performance.now(),
            direction: "x",
            axis: "pending",
            pointer: event.pointerType,
            target: event.currentTarget,
        }
    }
    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (gestureRef.current)
            autoIdleUntil.current = performance.now() + resumeDelayMs
        const gesture = gestureRef.current
        if (!gesture || gesture.id !== event.pointerId) return
        const deltaX = event.clientX - gesture.x
        const deltaY = event.clientY - gesture.y
        gesture.dx = deltaX
        if (
            gesture.axis === "pending" &&
            Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 8
        ) {
            gesture.direction = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y"
            gesture.axis =
                gesture.pointer !== "mouse" || gesture.direction === "x"
                    ? "x"
                    : "y"
            if (gesture.pointer !== "mouse") {
                setFocusedSlot(null)
            }
            if (
                gesture.axis === "x" &&
                (gesture.pointer === "mouse"
                    ? carouselOptions.drag
                    : carouselOptions.swipe)
            ) {
                gesture.target.setPointerCapture(event.pointerId)
                setDragging(true)
            }
        }
        if (
            gesture.axis !== "x" ||
            !(gesture.pointer === "mouse"
                ? carouselOptions.drag
                : carouselOptions.swipe)
        )
            return
        event.preventDefault()
        gesture.dx = gesture.direction === "y" ? deltaY : deltaX
        const now = performance.now()
        const touchGain =
            gesture.pointer === "mouse"
                ? 1
                : clamp(carouselOptions.touchSpeed, 1, 3)
        const deltaPixels = -(gesture.dx - gesture.applied) * touchGain
        const elapsed = Math.max(8, now - gesture.sampledAt)
        const velocity = deltaPixels / elapsed
        gesture.velocity = gesture.velocity * 0.25 + velocity * 0.75
        gesture.sampledAt = now
        queueMovement(deltaPixels)
        gesture.applied = gesture.dx
    }
    function finishGesture(
        event: React.PointerEvent<HTMLDivElement>,
        cancelled = false
    ) {
        autoIdleUntil.current = performance.now() + resumeDelayMs
        const gesture = gestureRef.current
        if (!gesture || gesture.id !== event.pointerId) return
        flushMovementRef.current()
        gestureRef.current = null
        if (hasFreePositionRef.current) setVirtualPosition(positionRef.current)
        setDragging(false)
        if (gesture.pointer !== "mouse") {
            setFocusedSlot(null)
            stackInteraction.current.hover = false
            stackInteraction.current.focus = false
            suppressMouseUntil.current = Date.now() + 800
            hasMouseInput.current = false
            pointerPositionRef.current = null
            setPointerInside(false)
        }
        if (gesture.target.hasPointerCapture(event.pointerId)) {
            gesture.target.releasePointerCapture(event.pointerId)
        }
        if (gesture.axis !== "pending" || cancelled) {
            suppressClickUntil.current = Date.now() + 500
        }
        if (cancelled || gesture.axis === "y") return
        if (gesture.axis === "x" && !reducedMotion) {
            const sampleAge = performance.now() - gesture.sampledAt
            let releaseVelocity =
                sampleAge < 90
                    ? clamp(
                          gesture.velocity * Math.exp(-sampleAge / 70),
                          -2.8,
                          2.8
                      )
                    : 0
            if (Math.abs(releaseVelocity) > 0.08) {
                let previousFrameTime = performance.now()
                const inertiaStartedAt = previousFrameTime
                setDragging(true)
                const tick = (frameTime: number) => {
                    const elapsedFrame = Math.min(
                        48,
                        Math.max(0, frameTime - previousFrameTime)
                    )
                    previousFrameTime = frameTime
                    const decay = Math.exp(-elapsedFrame / 280)
                    const beforePosition = positionRef.current
                    queueMovement(releaseVelocity * 280 * (1 - decay))
                    flushMovementRef.current()
                    releaseVelocity *= decay
                    suppressMouseUntil.current = Date.now() + 800
                    suppressClickUntil.current = Date.now() + 200
                    Math.abs(releaseVelocity) > 0.025 &&
                    frameTime - inertiaStartedAt < 1600 &&
                    positionRef.current !== beforePosition
                        ? (inertiaFrameRef.current =
                              requestAnimationFrame(tick))
                        : ((inertiaFrameRef.current = 0),
                          setDragging(false),
                          setVirtualPosition(positionRef.current))
                }
                inertiaFrameRef.current = requestAnimationFrame(tick)
            }
        }
    }
    // Hover wins; movement advances from the last selection at 25% of the next step.
    const paginationIndex =
        inspectedIndex >= 0 ? inspectedIndex : (selectedDot ?? currentCardIndex)
    const interactionDuration =
        reducedMotion || isCanvas ? 0 : hoverOptions.duration
    const backgroundDuration =
        reducedMotion || isCanvas ? 0 : backgroundOptions.duration
    const eagerDistance = Math.max(1, Math.ceil(containerWidth / cardStep) + 1)
    const compactPagination =
        cardCount * (paginationOptions.height + paginationOptions.gap) +
            Math.max(
                0,
                paginationOptions.activeWidth - paginationOptions.height
            ) >
        containerWidth - horizontalPadding * 2
    const visibleDotCount = Math.max(
        1,
        Math.min(
            cardCount,
            Math.floor(
                (containerWidth - horizontalPadding * 2 - 64) /
                    (paginationOptions.height + paginationOptions.gap)
            )
        )
    )
    const firstVisibleDot = compactPagination
        ? clamp(
              paginationIndex - Math.floor(visibleDotCount / 2),
              0,
              Math.max(0, cardCount - visibleDotCount)
          )
        : 0
    const visibleDots = Array.from(
        { length: compactPagination ? visibleDotCount : cardCount },
        (_item, index) => index + firstVisibleDot
    )
    const arrowButtonStyle = {
        border: 0,
        color: "white",
        background: "transparent",
        borderRadius: 999,
        minWidth: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 8,
        flexShrink: 0,
    }
    return (
        <div
            ref={rootRef}
            className="ff-root"
            role="region"
            aria-roledescription="carousel"
            aria-label={props.label || "Portfolio gallery"}
            data-theme={isLight ? "light" : "dark"}
            data-active-index={currentCardIndex}
            data-pagination-index={paginationIndex}
            data-background-index={inspectedIndex}
            data-input={inputMode}
            onPointerDown={(g) => {
                const v = (g.target as Element).closest<HTMLElement>(".ff-card")
                handlePointerDown(g, v ? Number(v.dataset.slot) : null)
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(g) => finishGesture(g)}
            onPointerCancel={(g) => finishGesture(g, true)}
            onLostPointerCapture={(g) => {
                g.target === g.currentTarget &&
                    gestureRef.current &&
                    !g.currentTarget.hasPointerCapture(g.pointerId) &&
                    finishGesture(g, true)
            }}
            onPointerMoveCapture={(g) => {
                if (viewportRef.current?.contains(g.target as Node))
                    autoIdleUntil.current = performance.now() + resumeDelayMs
                g.pointerType === "mouse" &&
                    Date.now() >= suppressMouseUntil.current &&
                    ((hasMouseInput.current = true),
                    (pointerPositionRef.current = {
                        x: g.clientX,
                        y: g.clientY,
                    }),
                    updateHoverRef.current(),
                    setInputMode("mouse"),
                    setPointerInside(true))
            }}
            onPointerEnter={(g) => {
                hasMouseInput.current &&
                    g.pointerType === "mouse" &&
                    Date.now() >= suppressMouseUntil.current &&
                    ((pointerPositionRef.current = {
                        x: g.clientX,
                        y: g.clientY,
                    }),
                    setPointerInside(true))
            }}
            onPointerLeave={() => {
                stackInteraction.current.hover = false
                pointerPositionRef.current = null
                setPointerInside(false)
                setHoveredSlot(null)
            }}
            onFocusCapture={() => setHasFocus(true)}
            onBlurCapture={(g) => {
                g.currentTarget.contains(g.relatedTarget) ||
                    (setHasFocus(false), setFocusedSlot(null))
            }}
            onClickCapture={(g) => {
                Date.now() < suppressClickUntil.current &&
                    (g.preventDefault(), g.stopPropagation())
            }}
            style={{
                touchAction: carouselOptions.swipe ? "pinch-zoom" : "auto",
                width: 1200,
                height: intrinsicHeight,
                ...props.style,
                position: "relative",
                isolation: "isolate",
                boxSizing: "border-box",
                overflow: "hidden",
                minWidth: 0,
                background: backgroundColor,
                color: textColor,
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            {[
                <style>
                    {
                        ".ff-root *{box-sizing:border-box}.ff-root button,.ff-root a{-webkit-tap-highlight-color:transparent}.ff-root button:focus-visible,.ff-root a:focus-visible,.ff-root .ff-card:focus-visible{outline:3px solid #a9c5ff;outline-offset:-4px}.ff-root button:disabled{opacity:.35;cursor:default!important}.ff-root .ff-panel::-webkit-scrollbar{width:3px}.ff-root .ff-panel::-webkit-scrollbar-thumb{background:#ffffff70}.ff-root .ff-card{outline:none;-webkit-touch-callout:none}.ff-root .ff-card img{user-select:none;-webkit-user-drag:none}.ff-root .ff-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(prefers-reduced-motion:reduce){.ff-root *{transition:none!important;animation:none!important}}"
                    }
                </style>,
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -1,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {backgroundOptions.enabled &&
                        backgroundSources.map((g) => (
                            <img
                                className="ff-background"
                                src={g}
                                alt={""}
                                decoding="async"
                                onLoad={() => {
                                    setBackgroundLoadState((v) => ({
                                        ...v,
                                        [g]: true,
                                    }))
                                    desiredBackgroundRef.current === g &&
                                        setShownBackgroundSrc(g)
                                }}
                                onError={() => {
                                    setBackgroundLoadState((v) => ({
                                        ...v,
                                        [g]: false,
                                    }))
                                    desiredBackgroundRef.current === g &&
                                        setShownBackgroundSrc("")
                                }}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: "center",
                                    transform: `scale(${Math.max(100, backgroundOptions.scale) / 100})`,
                                    filter: `blur(${Math.max(0, backgroundOptions.blur)}px) brightness(${Math.max(0, backgroundBrightness)}%) saturate(${Math.max(0, backgroundOptions.saturation)}%)`,
                                    willChange: "opacity",
                                    backfaceVisibility: "hidden",
                                    opacity: shownBackgroundSrc === g ? 1 : 0,
                                    visibility:
                                        shownBackgroundSrc === g
                                            ? "visible"
                                            : "hidden",
                                    transition: `opacity ${backgroundDuration}ms ease-out, visibility ${backgroundDuration}ms`,
                                    pointerEvents: "none",
                                }}
                                key={g}
                            />
                        ))}
                </div>,
                isLight && backgroundOptions.enabled && shownBackgroundSrc && (
                    <div
                        aria-hidden="true"
                        className="ff-light-tint"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: -1,
                            background: backgroundOptions.lightColor,
                            pointerEvents: "none",
                        }}
                    />
                ),
                <div
                    className="ff-content"
                    style={{
                        position: "relative",
                        height: "100%",
                        overflowX: "hidden",
                        overflowY: "auto",
                        overscrollBehaviorX: "contain",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {
                        <div
                            style={{
                                marginBlock: "auto",
                                flexShrink: 0,
                                paddingTop: verticalPadding,
                                paddingBottom: verticalPadding,
                            }}
                        >
                            {cardCount ? (
                                <React.Fragment>
                                    {[
                                        <div
                                            ref={viewportRef}
                                            className="ff-viewport"
                                            onPointerOver={(event) => {
                                                if (
                                                    event.pointerType ===
                                                        "mouse" &&
                                                    Date.now() >=
                                                        suppressMouseUntil.current
                                                ) {
                                                    stackInteraction.current.hover = true
                                                    pointerPositionRef.current =
                                                        {
                                                            x: event.clientX,
                                                            y: event.clientY,
                                                        }
                                                }
                                            }}
                                            onPointerEnter={(event) => {
                                                if (
                                                    event.pointerType ===
                                                        "mouse" &&
                                                    Date.now() >=
                                                        suppressMouseUntil.current
                                                )
                                                    stackInteraction.current.hover = true
                                            }}
                                            onPointerLeave={() => {
                                                stackInteraction.current.hover = false
                                                autoIdleUntil.current =
                                                    performance.now() +
                                                    resumeDelayMs
                                            }}
                                            onFocusCapture={() => {
                                                stackInteraction.current.focus =
                                                    keyboardModeRef.current
                                            }}
                                            onBlurCapture={(event) => {
                                                if (
                                                    !event.currentTarget.contains(
                                                        event.relatedTarget
                                                    )
                                                ) {
                                                    stackInteraction.current.focus = false
                                                    autoIdleUntil.current =
                                                        performance.now() +
                                                        resumeDelayMs
                                                }
                                            }}
                                            style={{
                                                position: "relative",
                                                height: cardHeight + 8,
                                                overflow: "hidden",
                                                touchAction:
                                                    carouselOptions.swipe
                                                        ? "pinch-zoom"
                                                        : "auto",
                                            }}
                                        >
                                            {[
                                                <div
                                                    ref={trackRef}
                                                    className="ff-track"
                                                    style={{
                                                        display: "flex",
                                                        gap: cardGap,
                                                        width: "max-content",
                                                        paddingBlock: 4,
                                                        transform: `translate3d(${trackOffset}px,0,0)`,
                                                        transition:
                                                            isFreeMotion ||
                                                            isDragging ||
                                                            isRebasing
                                                                ? "none"
                                                                : `transform ${reducedMotion || isCanvas ? 0 : carouselOptions.duration}ms cubic-bezier(.25,.46,.45,.94)`,
                                                        willChange: "transform",
                                                        backfaceVisibility:
                                                            "hidden",
                                                    }}
                                                >
                                                    {cardSlots.map((g) => {
                                                        const v =
                                                            ((g % cardCount) +
                                                                cardCount) %
                                                            cardCount
                                                        const M = cards[v]
                                                        const J =
                                                            !isLooping ||
                                                            g ===
                                                                v +
                                                                    Math.round(
                                                                        (virtualPosition -
                                                                            v) /
                                                                            cardCount
                                                                    ) *
                                                                        cardCount
                                                        const he =
                                                            inspectedSlot === g
                                                        const de =
                                                            panelReveal && he
                                                        const xt = safeLink(
                                                            M.link
                                                        )
                                                        const CardTag = xt
                                                            ? "a"
                                                            : "div"
                                                        const Oe = (
                                                            M.tags || ""
                                                        )
                                                            .split(",")
                                                            .map((ie) =>
                                                                ie.trim()
                                                            )
                                                            .filter(Boolean)
                                                            .slice(0, 8)
                                                        const Ct =
                                                            trackOffset +
                                                            (g + cloneBuffer) *
                                                                cardStep
                                                        const gr =
                                                            Ct + cardWidth >
                                                                0 &&
                                                            Ct < containerWidth
                                                        return (
                                                            <CardTag
                                                                ref={(
                                                                    ie:
                                                                        | HTMLAnchorElement
                                                                        | HTMLDivElement
                                                                        | null
                                                                ) => {
                                                                    J &&
                                                                        ie &&
                                                                        (cardRefs.current[
                                                                            v
                                                                        ] = ie)
                                                                }}
                                                                className="ff-card"
                                                                href={xt}
                                                                target={
                                                                    xt &&
                                                                    panelOptions.newTab
                                                                        ? "_blank"
                                                                        : undefined
                                                                }
                                                                rel={
                                                                    xt &&
                                                                    panelOptions.newTab
                                                                        ? "noopener noreferrer"
                                                                        : undefined
                                                                }
                                                                draggable={
                                                                    false
                                                                }
                                                                onDragStart={(
                                                                    event
                                                                ) =>
                                                                    event.preventDefault()
                                                                }
                                                                role={
                                                                    xt
                                                                        ? undefined
                                                                        : "group"
                                                                }
                                                                aria-roledescription="slide"
                                                                aria-label={`${v + 1} of ${cardCount}: ${M.title || "Untitled project"}`}
                                                                tabIndex={
                                                                    J &&
                                                                    v ===
                                                                        currentCardIndex
                                                                        ? 0
                                                                        : -1
                                                                }
                                                                aria-hidden={
                                                                    !J || void 0
                                                                }
                                                                data-slot={g}
                                                                data-primary={J}
                                                                data-index={v}
                                                                data-revealed={
                                                                    he
                                                                }
                                                                onPointerEnter={(
                                                                    ie
                                                                ) => {
                                                                    hasMouseInput.current &&
                                                                        ie.pointerType ===
                                                                            "mouse" &&
                                                                        Date.now() >=
                                                                            suppressMouseUntil.current &&
                                                                        !gestureRef.current &&
                                                                        (setInputMode(
                                                                            "mouse"
                                                                        ),
                                                                        setFocusedSlot(
                                                                            null
                                                                        ),
                                                                        setHoveredSlot(
                                                                            g
                                                                        ))
                                                                }}
                                                                onPointerLeave={() =>
                                                                    setHoveredSlot(
                                                                        (ie) =>
                                                                            ie ===
                                                                            g
                                                                                ? null
                                                                                : ie
                                                                    )
                                                                }
                                                                onFocus={() => {
                                                                    keyboardModeRef.current &&
                                                                        (setInputMode(
                                                                            "keyboard"
                                                                        ),
                                                                        setFocusedSlot(
                                                                            g
                                                                        ),
                                                                        gr ||
                                                                            goToCard(
                                                                                v
                                                                            ))
                                                                }}
                                                                onBlur={(
                                                                    ie
                                                                ) => {
                                                                    ie.currentTarget.contains(
                                                                        ie.relatedTarget
                                                                    ) ||
                                                                        setFocusedSlot(
                                                                            (
                                                                                Tt
                                                                            ) =>
                                                                                Tt ===
                                                                                g
                                                                                    ? null
                                                                                    : Tt
                                                                        )
                                                                }}
                                                                onKeyDown={(
                                                                    ie
                                                                ) => {
                                                                    // Let the browser activate links with Enter, including modifier keys.
                                                                    if (
                                                                        xt &&
                                                                        ie.key ===
                                                                            "Enter"
                                                                    )
                                                                        return
                                                                    if (
                                                                        ie.altKey ||
                                                                        ie.ctrlKey ||
                                                                        ie.metaKey
                                                                    )
                                                                        return
                                                                    const Tt =
                                                                        ie.key ===
                                                                        "ArrowRight"
                                                                            ? 1
                                                                            : ie.key ===
                                                                                "ArrowLeft"
                                                                              ? -1
                                                                              : 0
                                                                    Tt ||
                                                                    ie.key ===
                                                                        "Home" ||
                                                                    ie.key ===
                                                                        "End"
                                                                        ? (ie.preventDefault(),
                                                                          setInputMode(
                                                                              "keyboard"
                                                                          ),
                                                                          goToCard(
                                                                              ie.key ===
                                                                                  "Home"
                                                                                  ? 0
                                                                                  : ie.key ===
                                                                                      "End"
                                                                                    ? cardCount -
                                                                                      1
                                                                                    : v +
                                                                                      Tt,
                                                                              true
                                                                          ))
                                                                        : (ie.key ===
                                                                              " " ||
                                                                              ie.key ===
                                                                                  "Enter") &&
                                                                          ie.target ===
                                                                              ie.currentTarget &&
                                                                          (ie.preventDefault(),
                                                                          setInputMode(
                                                                              "keyboard"
                                                                          ),
                                                                          setFocusedSlot(
                                                                              g
                                                                          ),
                                                                          goToCard(
                                                                              v
                                                                          ))
                                                                }}
                                                                style={{
                                                                    display:
                                                                        "block",
                                                                    color: "inherit",
                                                                    textDecoration:
                                                                        "none",
                                                                    position:
                                                                        "relative",
                                                                    width: cardWidth,
                                                                    height: cardHeight,
                                                                    flexShrink: 0,
                                                                    borderRadius:
                                                                        layoutOptions.radius,
                                                                    overflow:
                                                                        "hidden",
                                                                    contain:
                                                                        "layout paint style",
                                                                    background:
                                                                        backgroundColor,
                                                                    cursor: isDragging
                                                                        ? "grabbing"
                                                                        : xt
                                                                          ? "pointer"
                                                                          : carouselOptions.drag
                                                                            ? "grab"
                                                                            : "default",
                                                                    userSelect:
                                                                        "none",
                                                                    textAlign:
                                                                        typographyOptions.alignment,
                                                                }}
                                                                key={g}
                                                            >
                                                                {[
                                                                    <ProjectImage
                                                                        image={
                                                                            M.image
                                                                        }
                                                                        alt={
                                                                            M.alt ??
                                                                            M
                                                                                .image
                                                                                ?.alt ??
                                                                            M.title ??
                                                                            "Portfolio project"
                                                                        }
                                                                        eager={
                                                                            Math.abs(
                                                                                g -
                                                                                    virtualPosition
                                                                            ) <=
                                                                            eagerDistance
                                                                        }
                                                                        style={{
                                                                            width: cardWidth,
                                                                            height: cardHeight,
                                                                            display:
                                                                                "block",
                                                                            objectFit:
                                                                                layoutOptions.imageFit,
                                                                            filter: `grayscale(${hoverOptions.grayscale ? (he ? hoverOptions.hoverGray : hoverOptions.normalGray) : 0}%)`,
                                                                            transition: `filter ${interactionDuration}ms ${hoverOptions.easing}`,
                                                                        }}
                                                                    />,
                                                                    <div
                                                                        aria-hidden="true"
                                                                        style={{
                                                                            position:
                                                                                "absolute",
                                                                            inset: 0,
                                                                            background:
                                                                                "black",
                                                                            opacity:
                                                                                he
                                                                                    ? hoverOptions.dim
                                                                                    : 0,
                                                                            transition: `opacity ${interactionDuration}ms ${hoverOptions.easing}`,
                                                                            pointerEvents:
                                                                                "none",
                                                                        }}
                                                                    />,
                                                                    <div
                                                                        className="ff-panel"
                                                                        aria-hidden={
                                                                            !de
                                                                        }
                                                                        style={{
                                                                            position:
                                                                                "absolute",
                                                                            bottom: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            padding: 16,
                                                                            maxHeight:
                                                                                "100%",
                                                                            overflowY:
                                                                                "auto",
                                                                            overflowX:
                                                                                "hidden",
                                                                            overscrollBehavior:
                                                                                "contain",
                                                                            background:
                                                                                panelColor,
                                                                            opacity:
                                                                                de
                                                                                    ? 1
                                                                                    : 0,
                                                                            visibility:
                                                                                de
                                                                                    ? "visible"
                                                                                    : "hidden",
                                                                            transform:
                                                                                de
                                                                                    ? "translateY(0)"
                                                                                    : "translateY(100%)",
                                                                            transition: `opacity ${interactionDuration}ms ${hoverOptions.easing}, transform ${interactionDuration}ms ${hoverOptions.easing}, visibility ${interactionDuration}ms`,
                                                                            pointerEvents:
                                                                                de
                                                                                    ? "auto"
                                                                                    : "none",
                                                                            overflowWrap:
                                                                                "anywhere",
                                                                            display:
                                                                                "flex",
                                                                            flexDirection:
                                                                                "column",
                                                                            gap: 12,
                                                                            backdropFilter:
                                                                                "blur(1px)",
                                                                            borderTopLeftRadius: 16,
                                                                            borderTopRightRadius: 16,
                                                                        }}
                                                                    >
                                                                        {[
                                                                            <div
                                                                                className="ff-panel-heading"
                                                                                style={{
                                                                                    display:
                                                                                        "flex",
                                                                                    flexDirection:
                                                                                        "column",
                                                                                    alignItems:
                                                                                        typographyOptions.alignment ===
                                                                                        "left"
                                                                                            ? "flex-start"
                                                                                            : typographyOptions.alignment ===
                                                                                                "right"
                                                                                              ? "flex-end"
                                                                                              : "center",
                                                                                    gap: 8,
                                                                                }}
                                                                            >
                                                                                {[
                                                                                    panelOptions.category &&
                                                                                        M.category && (
                                                                                            <div
                                                                                                className="ff-category"
                                                                                                style={{
                                                                                                    ...categoryTextStyle,
                                                                                                    color: textColor,
                                                                                                }}
                                                                                            >
                                                                                                {
                                                                                                    M.category
                                                                                                }
                                                                                            </div>
                                                                                        ),
                                                                                    M.title && (
                                                                                        <div
                                                                                            className="ff-project-title"
                                                                                            style={{
                                                                                                ...titleTextStyle,
                                                                                                margin: 0,
                                                                                                color: textColor,
                                                                                                textAlign:
                                                                                                    typographyOptions.alignment,
                                                                                                display:
                                                                                                    "-webkit-box",
                                                                                                WebkitLineClamp: 2,
                                                                                                WebkitBoxOrient:
                                                                                                    "vertical",
                                                                                                overflow:
                                                                                                    "hidden",
                                                                                            }}
                                                                                        >
                                                                                            {
                                                                                                M.title
                                                                                            }
                                                                                        </div>
                                                                                    ),
                                                                                ]}
                                                                            </div>,
                                                                            M.title && (
                                                                                <div
                                                                                    aria-hidden="true"
                                                                                    style={{
                                                                                        height: 1,
                                                                                        width: "100%",
                                                                                        flexShrink: 0,
                                                                                        background:
                                                                                            isLight
                                                                                                ? "linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,.15), rgba(18,18,18,0))"
                                                                                                : "linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent)",
                                                                                    }}
                                                                                />
                                                                            ),
                                                                            M.description && (
                                                                                <p
                                                                                    style={{
                                                                                        ...descriptionTextStyle,
                                                                                        margin: 0,
                                                                                        color: isLight
                                                                                            ? "#424242"
                                                                                            : textColor,
                                                                                        opacity: 0.8,
                                                                                        textAlign:
                                                                                            typographyOptions.alignment,
                                                                                        display:
                                                                                            "-webkit-box",
                                                                                        WebkitLineClamp: 2,
                                                                                        overflowWrap:
                                                                                            "anywhere",
                                                                                        WebkitBoxOrient:
                                                                                            "vertical",
                                                                                        overflow:
                                                                                            "hidden",
                                                                                        flexShrink: 0,
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        M.description
                                                                                    }
                                                                                </p>
                                                                            ),
                                                                            panelOptions.tags &&
                                                                                Oe.length >
                                                                                    0 && (
                                                                                    <div
                                                                                        style={{
                                                                                            display:
                                                                                                "flex",
                                                                                            flexWrap:
                                                                                                "wrap",
                                                                                            gap: 6,
                                                                                            justifyContent:
                                                                                                typographyOptions.alignment ===
                                                                                                "left"
                                                                                                    ? "flex-start"
                                                                                                    : typographyOptions.alignment ===
                                                                                                        "right"
                                                                                                      ? "flex-end"
                                                                                                      : "center",
                                                                                        }}
                                                                                    >
                                                                                        {Oe.map(
                                                                                            (
                                                                                                ie,
                                                                                                Tt
                                                                                            ) => (
                                                                                                <span
                                                                                                    className="ff-tag"
                                                                                                    style={{
                                                                                                        ...tagTextStyle,
                                                                                                        padding:
                                                                                                            "8px 16px",
                                                                                                        borderRadius: 16,
                                                                                                        background:
                                                                                                            "rgba(255,255,255,.1)",
                                                                                                        border: isLight
                                                                                                            ? "1px solid #555555"
                                                                                                            : "1px solid rgba(51,51,51,.4)",
                                                                                                        color: isLight
                                                                                                            ? "rgba(85,85,85,.7)"
                                                                                                            : "rgba(254,254,254,.7)",
                                                                                                        maxWidth:
                                                                                                            "100%",
                                                                                                    }}
                                                                                                    key={
                                                                                                        Tt
                                                                                                    }
                                                                                                >
                                                                                                    {
                                                                                                        ie
                                                                                                    }
                                                                                                </span>
                                                                                            )
                                                                                        )}
                                                                                    </div>
                                                                                ),
                                                                        ]}
                                                                    </div>,
                                                                ]}
                                                            </CardTag>
                                                        )
                                                    })}
                                                </div>,
                                                carouselOptions.arrows &&
                                                    cardCount > 1 && (
                                                        <div
                                                            aria-label="Carousel navigation"
                                                            style={{
                                                                position:
                                                                    "absolute",
                                                                inset: 0,
                                                                pointerEvents:
                                                                    "none",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "space-between",
                                                                paddingInline:
                                                                    Math.min(
                                                                        12,
                                                                        horizontalPadding
                                                                    ),
                                                            }}
                                                        >
                                                            {[
                                                                <button
                                                                    type="button"
                                                                    aria-label="Previous project"
                                                                    disabled={
                                                                        !carouselOptions.loop &&
                                                                        currentCardIndex ===
                                                                            0
                                                                    }
                                                                    onClick={() =>
                                                                        goToCard(
                                                                            currentCardIndex -
                                                                                1
                                                                        )
                                                                    }
                                                                    style={{
                                                                        ...arrowButtonStyle,
                                                                        pointerEvents:
                                                                            "auto",
                                                                    }}
                                                                >
                                                                    {
                                                                        <Chevron />
                                                                    }
                                                                </button>,
                                                                <button
                                                                    type="button"
                                                                    aria-label="Next project"
                                                                    disabled={
                                                                        !carouselOptions.loop &&
                                                                        currentCardIndex ===
                                                                            cardCount -
                                                                                1
                                                                    }
                                                                    onClick={() =>
                                                                        goToCard(
                                                                            currentCardIndex +
                                                                                1
                                                                        )
                                                                    }
                                                                    style={{
                                                                        ...arrowButtonStyle,
                                                                        pointerEvents:
                                                                            "auto",
                                                                    }}
                                                                >
                                                                    {
                                                                        <Chevron
                                                                            next={
                                                                                true
                                                                            }
                                                                        />
                                                                    }
                                                                </button>,
                                                            ]}
                                                        </div>
                                                    ),
                                            ]}
                                        </div>,
                                        paginationOptions.show &&
                                            cardCount > 1 && (
                                                <div
                                                    role="group"
                                                    aria-label="Choose project"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            flexAlignment(
                                                                paginationOptions.alignment
                                                            ),
                                                        gap: 0,
                                                        paddingInline:
                                                            horizontalPadding,
                                                        marginTop: 16,
                                                        height: 44,
                                                        maxWidth: "100%",
                                                    }}
                                                >
                                                    {[
                                                        visibleDots.map((g) => {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Go to project ${g + 1}: ${cards[g]?.title || "Untitled"}`}
                                                                    aria-current={
                                                                        paginationIndex ===
                                                                        g
                                                                            ? "true"
                                                                            : void 0
                                                                    }
                                                                    onClick={() => {
                                                                        setFocusedSlot(
                                                                            null
                                                                        )
                                                                        goToCard(
                                                                            g
                                                                        )
                                                                    }}
                                                                    style={{
                                                                        border: 0,
                                                                        background:
                                                                            "transparent",
                                                                        padding: 0,
                                                                        height: 44,
                                                                        minWidth: 0,
                                                                        width:
                                                                            (paginationIndex ===
                                                                            g
                                                                                ? Math.max(
                                                                                      paginationOptions.height,
                                                                                      paginationOptions.activeWidth
                                                                                  )
                                                                                : paginationOptions.height) +
                                                                            paginationOptions.gap,
                                                                        flexShrink: 0,
                                                                        display:
                                                                            "grid",
                                                                        placeItems:
                                                                            "center",
                                                                        cursor: "pointer",
                                                                        transition: `width ${interactionDuration}ms ease-out`,
                                                                    }}
                                                                    key={g}
                                                                >
                                                                    {
                                                                        <span
                                                                            style={{
                                                                                display:
                                                                                    "block",
                                                                                maxWidth:
                                                                                    "100%",
                                                                                width:
                                                                                    paginationIndex ===
                                                                                    g
                                                                                        ? Math.max(
                                                                                              paginationOptions.height,
                                                                                              paginationOptions.activeWidth
                                                                                          )
                                                                                        : paginationOptions.height,
                                                                                height: paginationOptions.height,
                                                                                borderRadius: 999,
                                                                                background:
                                                                                    paginationIndex ===
                                                                                    g
                                                                                        ? isLight
                                                                                            ? paginationOptions.lightActiveColor
                                                                                            : paginationOptions.activeColor
                                                                                        : isLight
                                                                                          ? paginationOptions.lightInactiveColor
                                                                                          : paginationOptions.inactiveColor,
                                                                                transition: `width ${interactionDuration}ms ease-out, background-color ${interactionDuration}ms ease-out`,
                                                                            }}
                                                                        />
                                                                    }
                                                                </button>
                                                            )
                                                        }),
                                                        compactPagination && (
                                                            <span
                                                                aria-hidden="true"
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: textColor,
                                                                    minWidth: 52,
                                                                    textAlign:
                                                                        "center",
                                                                    fontVariantNumeric:
                                                                        "tabular-nums",
                                                                }}
                                                            >
                                                                {[
                                                                    paginationIndex +
                                                                        1,
                                                                    " / ",
                                                                    cardCount,
                                                                ]}
                                                            </span>
                                                        ),
                                                    ]}
                                                </div>
                                            ),
                                        <span
                                            className="ff-sr"
                                            role="status"
                                            aria-live={
                                                autoplayEnabled && !hasFocus
                                                    ? "off"
                                                    : "polite"
                                            }
                                        >
                                            {[
                                                "Project ",
                                                paginationIndex + 1,
                                                " of ",
                                                cardCount,
                                                ": ",
                                                cards[paginationIndex]?.title,
                                            ]}
                                        </span>,
                                    ]}
                                </React.Fragment>
                            ) : (
                                <div
                                    role="status"
                                    style={{
                                        minHeight: 200,
                                        display: "grid",
                                        placeItems: "center",
                                        padding: 24,
                                        textAlign: "center",
                                    }}
                                >
                                    {"Add projects in the Cards controls."}
                                </div>
                            )}
                        </div>
                    }
                </div>,
            ]}
        </div>
    )
}
function Chevron({ next: next = false }) {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ transform: next ? "rotate(180deg)" : void 0 }}
        >
            {
                <path
                    d="m14 5-7 7 7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            }
        </svg>
    )
}
export { exampleSlides, safeLink }
const numberControl = (
    title: string,
    defaultValue: number,
    min: number,
    max: number,
    step = 1
) => ({
    type: ControlType.Number as const,
    title,
    defaultValue,
    min,
    max,
    step,
    displayStepper: true,
})
const booleanControl = (title: string, defaultValue: boolean) => ({
    type: ControlType.Boolean as const,
    title,
    defaultValue,
})
const enumControl = (
    title: string,
    options: string[],
    defaultValue: string
) => ({
    type: ControlType.Enum as const,
    title,
    options,
    defaultValue,
})
const colorControl = (title: string, defaultValue: string) => ({
    type: ControlType.Color as const,
    title,
    defaultValue,
})
const alignmentControl = (title: string, defaultValue = "center") =>
    enumControl(title, ["start", "center", "end"], defaultValue)
const loopIsEnabled = (values: any, rootProps?: FolioFocusProps) =>
    (rootProps?.carousel?.loop ??
        values?.carousel?.loop ??
        values?.loop ??
        true) !== false
addPropertyControls(FolioFocus, {
    theme: enumControl("Theme", ["dark", "light"], "dark"),
    slides: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 50,
        defaultValue: exampleSlides,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: sampleContent.title,
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: sampleContent.category,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: sampleContent.description,
                    displayTextArea: true,
                },
                tags: {
                    type: ControlType.String,
                    title: "Tags",
                    defaultValue: sampleContent.tags,
                    description: "Separate tags with commas.",
                },
                link: { type: ControlType.Link, title: "Link" },
                alt: { type: ControlType.String, title: "Alt text" },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: numberControl("Card Width", 380, 80, 1000),
            ratio: numberControl("Card Ratio", 0.75, 0.25, 3, 0.01),
            gap: numberControl("Card gap", 16, 0, 100),
            radius: numberControl("Radius", 16, 0, 100),
            imageFit: enumControl("Image fit", ["cover", "contain"], "cover"),
            alignment: {
                ...alignmentControl("Group align"),
                description:
                    "Align the card group when Loop is off and all cards fit in the frame.",
                hidden: loopIsEnabled,
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover & focus",
        controls: {
            grayscale: booleanControl("Grayscale", true),
            normalGray: {
                ...numberControl("Default gray %", 100, 0, 100),
                hidden: (v: any) => v.grayscale === false,
            },
            hoverGray: {
                ...numberControl("Hover gray %", 0, 0, 100),
                hidden: (v: any) => v.grayscale === false,
            },
            dim: numberControl("Dim opacity", 0.12, 0, 0.8, 0.01),
            duration: numberControl("Duration (ms)", 300, 0, 2000),
            easing: enumControl(
                "Easing",
                ["ease-out", "ease-in-out", "linear"],
                "ease-out"
            ),
        },
    },
    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            enabled: booleanControl("Dynamic image", true),
            blur: {
                ...numberControl("Blur", 40, 0, 100),
                hidden: (v: any) => v.enabled === false,
            },
            brightness: {
                ...numberControl("Brightness %", 40, 0, 100),
                hidden: (v: any) => v.enabled === false,
            },
            saturation: {
                ...numberControl("Saturation %", 60, 0, 200),
                hidden: (v: any) => v.enabled === false,
            },
            scale: {
                ...numberControl("Scale %", 115, 100, 160),
                hidden: (v: any) => v.enabled === false,
            },
            duration: {
                ...numberControl("Crossfade (ms)", 450, 0, 2000),
                hidden: (v: any) => v.enabled === false,
            },
            color: colorControl("Dark color", "#121212"),
            lightColor: colorControl("Light color", "rgba(18,18,18,.3)"),
            lightBrightness: numberControl("Light brightness %", 100, 0, 200),
        },
    },
    carousel: {
        type: ControlType.Object,
        title: "Carousel",
        controls: {
            drag: booleanControl("Mouse drag", true),
            swipe: booleanControl("Touch swipe", true),
            touchSpeed: numberControl("Touch speed", 1.6, 1, 3, 0.1),
            wheel: booleanControl("Trackpad scroll", true),
            loop: booleanControl("Loop", true),
            autoplay: {
                ...booleanControl("Autoplay", false),
                hidden: (v: any) => v.loop === false,
            },
            resumeDelay: {
                ...numberControl("Resume Delay (s)", 1.2, 0, 30, 0.1),
                hidden: (v: any) => v.loop === false || !v.autoplay,
            },
            speed: {
                ...numberControl("Speed (px/s)", 40, 5, 200),
                hidden: (v: any) => v.loop === false || !v.autoplay,
            },
            duration: numberControl("Slide duration", 400, 0, 2000),
            snap: {
                ...alignmentControl("Card align"),
                description: "Position the selected card when Loop is on.",
                hidden: (values: any, rootProps: FolioFocusProps) =>
                    !loopIsEnabled(values, rootProps),
            },
            arrows: booleanControl("Arrows", false),
        },
    },
    pagination: {
        type: ControlType.Object,
        title: "Pagination",
        controls: {
            show: booleanControl("Show", true),
            activeColor: {
                ...colorControl("Active", "#FFFFFF"),
                hidden: (v: any) => v.show === false,
            },
            inactiveColor: {
                ...colorControl("Inactive", "#777777"),
                hidden: (v: any) => v.show === false,
            },
            lightActiveColor: colorControl("Light active", "#212121"),
            lightInactiveColor: colorControl("Light inactive", "#999999"),
            height: {
                ...numberControl("Dot size", 8, 2, 20),
                hidden: (v: any) => v.show === false,
            },
            activeWidth: {
                ...numberControl("Active width", 24, 8, 100),
                hidden: (v: any) => v.show === false,
            },
            gap: {
                ...numberControl("Gap", 16, 0, 40),
                hidden: (v: any) => v.show === false,
            },
            alignment: {
                ...alignmentControl("Alignment"),
                hidden: (v: any) => v.show === false,
            },
        },
    },
    panel: {
        type: ControlType.Object,
        title: "Info panel",
        controls: {
            reveal: booleanControl("Text Reveal", true),
            category: booleanControl("Category", true),
            tags: booleanControl("Tags", true),
            color: colorControl("Dark panel", "rgba(0,0,0,.5)"),
            lightColor: colorControl("Light panel", "rgba(254,254,254,.7)"),
            newTab: booleanControl("New tab", true),
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            categoryFont: {
                type: ControlType.Font,
                title: "Category font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 14,
                    variant: "Medium",
                    lineHeight: "14px",
                },
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 24,
                    variant: "Semibold",
                    lineHeight: "1.2em",
                },
            },
            descriptionFont: {
                type: ControlType.Font,
                title: "Description font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 16,
                    lineHeight: "26px",
                    letterSpacing: -0.2,
                },
            },
            tagFont: {
                type: ControlType.Font,
                title: "Tag font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 14, lineHeight: "1.2em" },
            },
            autoSize: booleanControl("Auto size", true),
            color: colorControl("Dark text", "#FEFEFE"),
            lightColor: colorControl("Light text", "#212121"),
            alignment: enumControl(
                "Alignment",
                ["left", "center", "right"],
                "left"
            ),
        },
    },
})
