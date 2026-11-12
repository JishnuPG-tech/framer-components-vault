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


/**
 * Signal Orbit — Framer-native testimonial component
 *
 * Single-file Code Component:
 * - No external CSS
 * - No GSAP or third-party animation dependency
 * - Static-renderer safe
 * - Pointer drag, click, keyboard, and autoplay
 *
 * @framerIntrinsicWidth 820
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type FramerImage = string | { src?: string; alt?: string }

type Testimonial = {
    quote: string
    name: string
    role: string
    result: string
    rating: number
    image: FramerImage

    // Optional per-testimonial appearance overrides.
    customStyle?: boolean
    accent?: string
    cardBackground?: string
    quoteColor?: string
    nameColor?: string
    roleColor?: string
    resultBackground?: string
    resultColor?: string
    starColor?: string
    emptyStarColor?: string
    avatarBorderColor?: string
}

type ContentSettings = {
    testimonials: Testimonial[]
}

type LayoutSettings = {
    cardWidth: number
    cardHeight: number
    orbitSize: number
    avatarSize: number
    borderRadius: number
}

type AppearanceSettings = {
    accent: string
    background: string
    cardBackground: string
    textColor: string
    mutedColor: string
    resultBackground: string
}

type TypographySettings = {
    quoteFont: React.CSSProperties
    quoteColor: string
    nameFont: React.CSSProperties
    nameColor: string
    roleFont: React.CSSProperties
    roleColor: string
    resultFont: React.CSSProperties
    resultColor: string
}

type OrbitSettings = {
    color: string
    opacity: number
    lineWidth: number
    dashed: boolean
    showProgress: boolean
    progressRing: "outer" | "middle"
    progressColor: string
    progressWidth: number
}

type AnimationSettings = {
    autoplay: boolean
    autoplayDelay: number
    dragThreshold: number
    quoteEffect: "none" | "typewriter"
    typewriterSpeed: number
    wheelEnabled: boolean
}

type RatingSettings = {
    show: boolean
    starColor: string
    emptyStarColor: string
    starSize: number
}

type PremiumSettings = {
    cardTilt: boolean
    tiltAmount: number
    perspective: number
    hoverLift: number
    scrollbar: boolean
    scrollbarWidth: number
    scrollbarThumb: string
    scrollbarHover: string
    scrollbarTrack: string
    scrollbarRadius: number
    staggered: boolean
    staggerDistance: number
    staggerBlur: number
    staggerDelay: number
}

type ShadowSettings = {
    cardEnabled: boolean
    cardColor: string
    cardOpacity: number
    cardBlur: number
    cardSpread: number
    cardX: number
    cardY: number
    avatarEnabled: boolean
    avatarColor: string
    avatarOpacity: number
    avatarBlur: number
    avatarSpread: number
    avatarY: number
}

/**
 * Group values are passed directly by Framer.
 * Values selected on Tablet/Phone breakpoints are not replaced by
 * hard-coded mobile presets inside this component.
 */
type Props = {
    content: ContentSettings
    layout: LayoutSettings
    appearance: AppearanceSettings
    typography: TypographySettings
    orbit: OrbitSettings
    animation: AnimationSettings
    ratings: RatingSettings
    premium: PremiumSettings
    shadows: ShadowSettings
    style?: React.CSSProperties
}

const fallbackTestimonials: Testimonial[] = [
    {
        quote: "It feels less like software and more like a brilliant teammate.",
        name: "Maya Chen",
        role: "VP Product · Northstar",
        result: "2.4× faster launches",
        rating: 5,
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "Our clients noticed the difference before we even announced it.",
        name: "Elijah Brooks",
        role: "Creative Director · Vanta Studio",
        result: "+38% engagement",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "The tiny details made the whole experience feel undeniably premium.",
        name: "Sofia Reyes",
        role: "Founder · Forma",
        result: "4.9/5 client rating",
        rating: 5,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "We replaced three tools and finally gave the team one clear rhythm.",
        name: "Noah Williams",
        role: "COO · Fieldwork",
        result: "11 hrs saved weekly",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "The first campaign paid for the entire redesign in eight days.",
        name: "Amara Okafor",
        role: "Growth Lead · Common Thread",
        result: "186% campaign ROI",
        rating: 5,
        image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "The new experience gave our brand a confidence we had been missing.",
        name: "Lucas Bennett",
        role: "Brand Director · Lumen",
        result: "+52% demo requests",
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "Every interaction feels intentional, fast, and remarkably easy to understand.",
        name: "Aisha Rahman",
        role: "Head of Experience · Atlas",
        result: "31% lower drop-off",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "We shipped the strongest version of our product without slowing the team down.",
        name: "Daniel Kim",
        role: "Product Lead · Foundry",
        result: "3 weeks ahead",
        rating: 5,
        image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "Customers finally understand our value within the first few seconds.",
        name: "Isabella Martins",
        role: "Marketing Director · Vale",
        result: "+44% conversion",
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=88",
    },
    {
        quote: "The polished motion made the whole launch feel like a major brand moment.",
        name: "Marcus Reed",
        role: "Founder · Signal House",
        result: "1.8M launch views",
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=320&q=88",
    },
]

function pad(value: number) {
    return String(value).padStart(2, "0")
}

function imageSource(image: FramerImage) {
    if (typeof image === "string") return image
    return image?.src ?? ""
}

function imageAlt(image: FramerImage, fallback: string) {
    if (typeof image === "object" && image?.alt) return image.alt
    return fallback
}

function OrbitInteractive(props: Props) {
    const {
        content,
        layout,
        appearance,
        typography,
        orbit,
        animation,
        ratings,
        premium,
        shadows,
        style,
    } = props

    const testimonials = content?.testimonials ?? fallbackTestimonials

    const {
        cardWidth = 408,
        cardHeight = 360,
        orbitSize = 730,
        avatarSize = 56,
        borderRadius = 28,
    } = layout ?? {}

    const {
        accent = "#D7FF64",
        background = "#090A0D",
        cardBackground = "rgba(20, 21, 25, 0.78)",
        textColor = "#F4F1E8",
        mutedColor = "rgba(244, 241, 232, 0.62)",
        resultBackground = "#D7FF64",
    } = appearance ?? {}

    const {
        quoteFont = {
            fontFamily: "Inter",
            fontSize: 35,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "-0.045em",
        },
        quoteColor = "#F4F1E8",
        nameFont = {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "0em",
        },
        nameColor = "#F4F1E8",
        roleFont = {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "0em",
        },
        roleColor = "rgba(244, 241, 232, 0.62)",
        resultFont = {
            fontFamily: "Inter",
            fontSize: 11,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "0em",
        },
        resultColor = "#10120A",
    } = typography ?? {}

    const {
        color: orbitColor = "#D7FF64",
        opacity: orbitOpacity = 0.26,
        lineWidth: orbitLineWidth = 1,
        dashed: orbitDashed = true,
        showProgress = true,
        progressRing = "outer",
        progressColor = "#D7FF64",
        progressWidth = 3,
    } = orbit ?? {}

    const {
        autoplay = true,
        autoplayDelay = 6.2,
        dragThreshold = 42,
        quoteEffect = "none",
        typewriterSpeed = 34,
        wheelEnabled = true,
    } = animation ?? {}

    const {
        show: showRating = true,
        starColor = "#D7FF64",
        emptyStarColor = "rgba(244, 241, 232, 0.22)",
        starSize = 18,
    } = ratings ?? {}

    const {
        cardTilt = true,
        tiltAmount = 4,
        perspective = 1100,
        hoverLift = 3,
        scrollbar = true,
        scrollbarWidth = 5,
        scrollbarThumb = "rgba(244, 241, 232, 0.22)",
        scrollbarHover = "#D7FF64",
        scrollbarTrack = "transparent",
        scrollbarRadius = 999,
        staggered = true,
        staggerDistance = 16,
        staggerBlur = 5,
        staggerDelay = 90,
    } = premium ?? {}

    const {
        cardEnabled: shadowEnabled = true,
        cardColor: shadowColor = "#000000",
        cardOpacity: shadowOpacity = 0.42,
        cardBlur: shadowBlur = 90,
        cardSpread: shadowSpread = 0,
        cardX: shadowX = 0,
        cardY: shadowY = 36,
        avatarEnabled: avatarShadowEnabled = true,
        avatarColor: avatarShadowColor = "#000000",
        avatarOpacity: avatarShadowOpacity = 0.42,
        avatarBlur: avatarShadowBlur = 34,
        avatarSpread: avatarShadowSpread = 0,
        avatarY: avatarShadowY = 14,
    } = shadows ?? {}

    // Keep the interactive implementation aware of Framer's static renderer too.
    // The exported wrapper already switches to OrbitStatic, but this guard
    // makes every animation/interaction path safe if OrbitInteractive is
    // rendered directly by Framer or during export.
    const isStatic = useIsStaticRenderer()
    const items =
        testimonials && testimonials.length > 0
            ? testimonials
            : fallbackTestimonials

    const [index, setIndex] = React.useState(0)
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const [dragRotation, setDragRotation] = React.useState(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [isCoasting, setIsCoasting] = React.useState(false)
    const [transitionDirection, setTransitionDirection] = React.useState(1)
    const [transitionKey, setTransitionKey] = React.useState(0)
    const [progressKey, setProgressKey] = React.useState(0)
    const [paused, setPaused] = React.useState(false)
    const [typedQuote, setTypedQuote] = React.useState("")
    const [cardTiltValue, setCardTiltValue] = React.useState({ x: 0, y: 0 })
    const [cardHovered, setCardHovered] = React.useState(false)
    const [containerSize, setContainerSize] = React.useState({
        width: 820,
        height: 760,
    })

    const rootRef = React.useRef<HTMLDivElement>(null)
    const wheelAccumulatorRef = React.useRef(0)
    const wheelLockedRef = React.useRef(false)
    const dragRef = React.useRef({
        active: false,
        pointerId: -1,
        startAngle: 0,
        lastAngle: 0,
        lastTimestamp: 0,
        angularVelocity: 0,
        accumulatedAngle: 0,
        moved: false,
        clickedAvatarIndex: null as number | null,
        source: null as HTMLDivElement | null,
    })
    const inertiaFrameRef = React.useRef<number | null>(null)
    const inertiaRotationRef = React.useRef(0)
    const suppressClickRef = React.useRef(false)

    React.useEffect(() => {
        if (index >= items.length) setIndex(0)
    }, [index, items.length])

    React.useLayoutEffect(() => {
        const node = rootRef.current
        if (!node) return

        const updateSize = () => {
            const rect = node.getBoundingClientRect()
            setContainerSize({
                width: Math.max(1, rect.width),
                height: Math.max(1, rect.height),
            })
        }

        updateSize()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }

        const observer = new ResizeObserver(updateSize)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    const changeTo = React.useCallback(
        (target: number, direction?: number) => {
            if (items.length < 2) return

            const next = (target + items.length) % items.length
            if (next === index) return

            const resolvedDirection = direction ?? (next > index ? 1 : -1)

            setTransitionDirection(resolvedDirection)
            setIndex(next)
            setTransitionKey((value) => value + 1)
            setProgressKey((value) => value + 1)
        },
        [index, items.length]
    )

    React.useEffect(() => {
        const node = rootRef.current
        if (!node || isStatic || items.length < 2 || !wheelEnabled) return

        const handleWheel = (event: WheelEvent) => {
            const rect = node.getBoundingClientRect()
            const inside =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom

            if (!inside) return

            const dominantDelta =
                Math.abs(event.deltaY) >= Math.abs(event.deltaX)
                    ? event.deltaY
                    : event.deltaX

            if (Math.abs(dominantDelta) < 0.5) return

            event.preventDefault()
            event.stopPropagation()

            if (wheelLockedRef.current) return

            wheelAccumulatorRef.current += dominantDelta

            const threshold =
                event.deltaMode === 1 ? 3 : event.deltaMode === 2 ? 1 : 34

            if (Math.abs(wheelAccumulatorRef.current) < threshold) return

            const direction = wheelAccumulatorRef.current > 0 ? 1 : -1

            wheelAccumulatorRef.current = 0
            wheelLockedRef.current = true
            changeTo(index + direction, direction)

            window.setTimeout(() => {
                wheelLockedRef.current = false
            }, 520)
        }

        node.addEventListener("wheel", handleWheel, {
            passive: false,
            capture: true,
        })

        return () => {
            node.removeEventListener("wheel", handleWheel, true)
        }
    }, [changeTo, index, isStatic, items.length, wheelEnabled])

    React.useEffect(() => {
        if (isStatic || !autoplay || paused || isDragging || items.length < 2) {
            return
        }

        const timer = window.setTimeout(() => {
            changeTo(index + 1, 1)
        }, autoplayDelay * 1000)

        return () => window.clearTimeout(timer)
    }, [
        autoplay,
        autoplayDelay,
        changeTo,
        index,
        isDragging,
        isStatic,
        items.length,
        paused,
        progressKey,
    ])

    React.useEffect(() => {
        const quote = items[index]?.quote ?? ""

        if (isStatic || quoteEffect === "none") {
            setTypedQuote(quote)
            return
        }

        setTypedQuote("")

        let characterIndex = 0
        const interval = window.setInterval(
            () => {
                characterIndex += 1
                setTypedQuote(quote.slice(0, characterIndex))

                if (characterIndex >= quote.length) {
                    window.clearInterval(interval)
                }
            },
            Math.max(10, typewriterSpeed)
        )

        return () => window.clearInterval(interval)
    }, [index, isStatic, items, quoteEffect, typewriterSpeed])

    const getPointerAngle = React.useCallback(
        (clientX: number, clientY: number) => {
            const node = rootRef.current
            if (!node) return 0

            const rect = node.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            return (
                Math.atan2(clientY - centerY, clientX - centerX) *
                (180 / Math.PI)
            )
        },
        []
    )

    const beginOrbitDrag = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic || items.length < 2) return

            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)

            if (inertiaFrameRef.current !== null) {
                cancelAnimationFrame(inertiaFrameRef.current)
                inertiaFrameRef.current = null
            }

            setIsCoasting(false)

            const angle = getPointerAngle(event.clientX, event.clientY)

            const target = event.target as HTMLElement
            const avatarButton = target.closest(
                "[data-index]"
            ) as HTMLElement | null
            const clickedAvatarIndex = avatarButton
                ? Number(avatarButton.dataset.index)
                : null

            dragRef.current = {
                active: true,
                pointerId: event.pointerId,
                startAngle: angle,
                lastAngle: angle,
                lastTimestamp: performance.now(),
                angularVelocity: 0,
                accumulatedAngle: 0,
                moved: false,
                clickedAvatarIndex:
                    clickedAvatarIndex !== null &&
                    Number.isFinite(clickedAvatarIndex)
                        ? clickedAvatarIndex
                        : null,
                source: event.currentTarget,
            }

            suppressClickRef.current = false
            setPaused(true)
            setIsDragging(true)
            setDragRotation(0)
        },
        [getPointerAngle, isStatic, items.length]
    )

    const moveOrbitDrag = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current

            if (
                !drag.active ||
                drag.pointerId !== event.pointerId ||
                isStatic
            ) {
                return
            }

            event.preventDefault()

            const currentAngle = getPointerAngle(event.clientX, event.clientY)

            let delta = currentAngle - drag.lastAngle

            if (delta > 180) delta -= 360
            if (delta < -180) delta += 360

            const now = performance.now()
            const elapsed = Math.max(1, now - drag.lastTimestamp)
            const instantaneousVelocity = delta / elapsed

            drag.angularVelocity =
                drag.angularVelocity * 0.72 + instantaneousVelocity * 0.28
            drag.lastTimestamp = now

            drag.accumulatedAngle += delta
            drag.lastAngle = currentAngle

            if (Math.abs(drag.accumulatedAngle) > 3) {
                drag.moved = true
                suppressClickRef.current = true
            }

            setDragRotation(drag.accumulatedAngle)
        },
        [getPointerAngle, isStatic]
    )

    const finishOrbitDrag = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current

            if (!drag.active || drag.pointerId !== event.pointerId) return

            if (drag.source?.hasPointerCapture(event.pointerId)) {
                drag.source.releasePointerCapture(event.pointerId)
            }

            const clickedAvatarIndex = drag.clickedAvatarIndex
            const wasMoved = drag.moved
            const releasedRotation = drag.accumulatedAngle
            const releasedVelocity = drag.angularVelocity

            drag.active = false
            drag.pointerId = -1
            drag.clickedAvatarIndex = null
            drag.source = null

            setIsDragging(false)

            const finishSnap = (finalRotation: number) => {
                const stepAngle = 360 / Math.max(1, items.length)
                const angularThreshold = Math.max(
                    5,
                    Math.min(18, dragThreshold * 0.2)
                )

                let steps = Math.round(-finalRotation / stepAngle)

                if (
                    steps === 0 &&
                    Math.abs(finalRotation) >= angularThreshold
                ) {
                    steps = finalRotation < 0 ? 1 : -1
                }

                setIsCoasting(false)
                setDragRotation(0)
                inertiaRotationRef.current = 0

                if (steps !== 0) {
                    changeTo(index + steps, steps > 0 ? 1 : -1)
                } else if (
                    !wasMoved &&
                    clickedAvatarIndex !== null &&
                    clickedAvatarIndex !== index
                ) {
                    const forward =
                        (clickedAvatarIndex - index + items.length) %
                        items.length
                    const backward = forward - items.length
                    const shortest =
                        Math.abs(forward) <= Math.abs(backward)
                            ? forward
                            : backward

                    changeTo(clickedAvatarIndex, shortest >= 0 ? 1 : -1)
                }

                window.setTimeout(() => {
                    suppressClickRef.current = false
                    setPaused(false)
                }, 80)
            }

            if (!wasMoved || Math.abs(releasedVelocity) < 0.015) {
                finishSnap(releasedRotation)
                return
            }

            setIsCoasting(true)

            let rotation = releasedRotation
            let velocity = Math.max(-0.32, Math.min(0.32, releasedVelocity))
            let previousTime = performance.now()

            inertiaRotationRef.current = rotation

            const animateInertia = (time: number) => {
                const deltaTime = Math.min(32, time - previousTime)
                previousTime = time

                rotation += velocity * deltaTime
                velocity *= Math.pow(0.91, deltaTime / 16.67)

                inertiaRotationRef.current = rotation
                setDragRotation(rotation)

                if (Math.abs(velocity) > 0.006) {
                    inertiaFrameRef.current =
                        requestAnimationFrame(animateInertia)
                    return
                }

                inertiaFrameRef.current = null
                finishSnap(rotation)
            }

            inertiaFrameRef.current = requestAnimationFrame(animateInertia)
        },
        [changeTo, dragThreshold, index, isStatic, items.length]
    )

    React.useEffect(() => {
        return () => {
            if (inertiaFrameRef.current !== null) {
                cancelAnimationFrame(inertiaFrameRef.current)
            }
        }
    }, [])

    const active = items[index] ?? items[0]
    const normalizedRating = Math.max(0, Math.min(5, active?.rating ?? 5))

    // Every testimonial can use the shared visual system or override it.
    const activeUsesCustomStyle = active?.customStyle === true
    const activeCardBackground =
        activeUsesCustomStyle && active?.cardBackground
            ? active.cardBackground
            : cardBackground
    const activeQuoteColor =
        activeUsesCustomStyle && active?.quoteColor
            ? active.quoteColor
            : quoteColor
    const activeNameColor =
        activeUsesCustomStyle && active?.nameColor
            ? active.nameColor
            : nameColor
    const activeRoleColor =
        activeUsesCustomStyle && active?.roleColor
            ? active.roleColor
            : roleColor
    const activeResultBackground =
        activeUsesCustomStyle && active?.resultBackground
            ? active.resultBackground
            : resultBackground
    const activeResultColor =
        activeUsesCustomStyle && active?.resultColor
            ? active.resultColor
            : resultColor
    const activeStarColor =
        activeUsesCustomStyle && active?.starColor
            ? active.starColor
            : starColor
    const activeEmptyStarColor =
        activeUsesCustomStyle && active?.emptyStarColor
            ? active.emptyStarColor
            : emptyStarColor

    const itemAccent = (item: Testimonial) =>
        item?.customStyle && item?.accent ? item.accent : accent

    const itemAvatarBorder = (item: Testimonial, selected: boolean) => {
        if (item?.customStyle && item?.avatarBorderColor) {
            return item.avatarBorderColor
        }
        return selected ? itemAccent(item) : `${textColor}70`
    }

    // Framer breakpoint values remain authoritative.
    // The component only prevents elements from exceeding the available frame.
    const compact = containerSize.width < 560

    const horizontalPadding = Math.max(
        12,
        Math.min(24, containerSize.width * 0.035)
    )
    const verticalPadding = Math.max(
        12,
        Math.min(24, containerSize.height * 0.035)
    )

    const maxAvatarFromFrame = Math.max(
        24,
        Math.min(containerSize.width, containerSize.height) * 0.18
    )

    const responsiveAvatar = Math.min(avatarSize, maxAvatarFromFrame)

    const orbitSafetyPadding =
        responsiveAvatar / 2 +
        Math.max(12, Math.min(20, containerSize.width * 0.025))

    // Orbit Size is controlled directly by the Framer breakpoint.
    // The component frame should be made large enough to contain it.
    const fittedOrbitSize = orbitSize

    const fittedCardWidth = Math.min(
        cardWidth,
        Math.max(180, containerSize.width - horizontalPadding * 2)
    )

    const fittedCardHeight = Math.min(
        cardHeight,
        Math.max(180, containerSize.height - verticalPadding * 2)
    )

    const responsiveCardPadding = Math.max(
        14,
        Math.min(34, fittedCardWidth * 0.075)
    )

    // Use the exact Framer native font value selected at each breakpoint.
    const responsiveQuoteFont: React.CSSProperties = {
        ...quoteFont,
    }
    // The avatar centers and the visible outer SVG ring must use the
    // same radius. The SVG outer ring has r="46.5" in a 100×100 viewBox.
    const outerRingRadiusPercent = 46.5
    const middleRingRadiusPercent = 36
    const radiusPercent = outerRingRadiusPercent

    const progressRadius =
        progressRing === "middle"
            ? middleRingRadiusPercent
            : outerRingRadiusPercent

    const colorWithOpacity = (color: string, opacity: number) => {
        if (color.startsWith("rgba") || color.startsWith("hsla")) return color
        if (color.startsWith("rgb") || color.startsWith("hsl")) return color

        const normalized = color.replace("#", "")
        const expanded =
            normalized.length === 3
                ? normalized
                      .split("")
                      .map((character) => character + character)
                      .join("")
                : normalized
        const value = Number.parseInt(expanded, 16)

        if (Number.isNaN(value)) return `rgba(0,0,0,${opacity})`

        const red = (value >> 16) & 255
        const green = (value >> 8) & 255
        const blue = value & 255

        return `rgba(${red},${green},${blue},${opacity})`
    }

    const cardShadow = shadowEnabled
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${colorWithOpacity(shadowColor, shadowOpacity)}`
        : "none"

    const avatarShadow = avatarShadowEnabled
        ? `0 ${avatarShadowY}px ${avatarShadowBlur}px ${avatarShadowSpread}px ${colorWithOpacity(avatarShadowColor, avatarShadowOpacity)}`
        : "none"

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
                display: "grid",
                placeItems: "center",
                color: textColor,
                background,
                boxSizing: "border-box",
                overscrollBehavior: "contain",
                fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
        >
            <style>{`
                .signal-orbit * {
                    box-sizing: border-box;
                }

                .signal-orbit svg {
                    display: block;
                }
                .signal-orbit-card {
                    scrollbar-width: ${scrollbar ? "thin" : "none"};
                    scrollbar-color: ${scrollbarThumb} ${scrollbarTrack};
                }

                .signal-orbit-card::-webkit-scrollbar {
                    width: ${scrollbar ? scrollbarWidth : 0}px;
                    height: ${scrollbar ? scrollbarWidth : 0}px;
                }

                .signal-orbit-card::-webkit-scrollbar-track {
                    background: ${scrollbarTrack};
                    border-radius: ${scrollbarRadius}px;
                }

                .signal-orbit-card::-webkit-scrollbar-thumb {
                    background: ${scrollbarThumb};
                    border-radius: ${scrollbarRadius}px;
                    border: 1px solid transparent;
                    background-clip: padding-box;
                }

                .signal-orbit-card::-webkit-scrollbar-thumb:hover {
                    background: ${scrollbarHover};
                    background-clip: padding-box;
                }


                .signal-orbit-static .signal-orbit-avatar,
                .signal-orbit-static .signal-orbit-avatar img,
                .signal-orbit-static .signal-orbit-card,
                .signal-orbit-static .signal-orbit-progress-ring {
                    animation: none !important;
                    transition: none !important;
                }

                .signal-orbit-static .signal-orbit-avatar:hover,
                .signal-orbit-static .signal-orbit-avatar-active:hover {
                    box-shadow: inherit !important;
                    border-color: inherit !important;
                }

                .signal-orbit-static .signal-orbit-avatar:hover img {
                    transform: none !important;
                    filter: inherit !important;
                }

                .signal-orbit-static .signal-orbit-orbit {
                    transform: translate(-50%, -50%) rotate(0deg) !important;
                    transition: none !important;
                    cursor: default !important;
                }

                .signal-orbit-static .signal-orbit-progress-ring {
                    animation: none !important;
                }

                .signal-orbit-static .signal-orbit-card {
                    transform: none !important;
                    transition: none !important;
                }

                .signal-orbit-avatar {
                    -webkit-tap-highlight-color: transparent;
                    transition:
                        left .72s cubic-bezier(.22,1,.36,1),
                        top .72s cubic-bezier(.22,1,.36,1),
                        opacity .32s ease,
                        transform .32s cubic-bezier(.22,1,.36,1),
                        border-color .25s ease,
                        box-shadow .25s ease;
                }

                .signal-orbit-avatar img {
                    transition:
                        transform .42s cubic-bezier(.22,1,.36,1),
                        filter .3s ease;
                }

                .signal-orbit-avatar:hover img {
                    transform: scale(1.1);
                    filter: saturate(1) contrast(1.03) !important;
                }

                .signal-orbit-avatar:hover {
                    border-color: ${accent} !important;
                    box-shadow: ${
                        avatarShadowEnabled
                            ? `0 0 0 5px ${accent}16, 0 0 22px ${accent}45, ${avatarShadow}`
                            : `0 0 0 5px ${accent}16, 0 0 22px ${accent}45`
                    } !important;
                }

                .signal-orbit-avatar-active:hover {
                    box-shadow: ${
                        avatarShadowEnabled
                            ? `0 0 0 8px ${accent}1c, 0 0 30px ${accent}60, ${avatarShadow}`
                            : `0 0 0 8px ${accent}1c, 0 0 30px ${accent}60`
                    } !important;
                }

                .signal-orbit-control {
                    transition:
                        transform .22s ease,
                        border-color .22s ease,
                        background .22s ease;
                }

                .signal-orbit-control:hover {
                    transform: translateY(-2px);
                    border-color: rgba(255,255,255,.55) !important;
                }

                .signal-orbit-quote-enter-right {
                    animation: ${staggered ? "signalPremiumQuoteRight" : "signalQuoteRight"} .58s cubic-bezier(.22,1,.36,1) both;
                }

                .signal-orbit-quote-enter-left {
                    animation: ${staggered ? "signalPremiumQuoteLeft" : "signalQuoteLeft"} .58s cubic-bezier(.22,1,.36,1) both;
                }

                .signal-orbit-meta-enter {
                    animation: ${staggered ? "signalPremiumMeta" : "signalMeta"} .52s ${staggered ? staggerDelay : 80}ms cubic-bezier(.22,1,.36,1) both;
                }

                .signal-orbit-card-dragging {
                    transition: none !important;
                }

                .signal-orbit-progress-ring {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: OrbitTestimonialsProgress var(--signal-delay) linear both;
                }

                @keyframes signalPremiumQuoteRight {
                    from {
                        opacity: 0;
                        transform: translate3d(${staggerDistance}px, ${staggerDistance}px, 0) scale(.985);
                        filter: blur(${staggerBlur}px);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0,0,0) scale(1);
                        filter: blur(0);
                    }
                }

                @keyframes signalPremiumQuoteLeft {
                    from {
                        opacity: 0;
                        transform: translate3d(-${staggerDistance}px, ${staggerDistance}px, 0) scale(.985);
                        filter: blur(${staggerBlur}px);
                    }
                    to {
                        opacity: 1;
                        transform: translate3d(0,0,0) scale(1);
                        filter: blur(0);
                    }
                }

                @keyframes signalPremiumMeta {
                    from {
                        opacity: 0;
                        transform: translateY(${Math.max(8, staggerDistance * 0.75)}px) scale(.99);
                        filter: blur(${Math.max(0, staggerBlur * 0.65)}px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }

                @keyframes signalQuoteRight {
                    from { opacity: 0; transform: translate3d(26px,18px,0); }
                    to { opacity: 1; transform: translate3d(0,0,0); }
                }

                @keyframes signalQuoteLeft {
                    from { opacity: 0; transform: translate3d(-26px,18px,0); }
                    to { opacity: 1; transform: translate3d(0,0,0); }
                }

                @keyframes signalMeta {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes OrbitTestimonialsProgress {
                    from { stroke-dashoffset: 100; }
                    to { stroke-dashoffset: 0; }
                }

                @keyframes signalTypeCursor {
                    0%, 45% { opacity: 1; }
                    46%, 100% { opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                    .signal-orbit-avatar,
                    .signal-orbit-avatar img,
                    .signal-orbit-control,
                    .signal-orbit-quote-enter-right,
                    .signal-orbit-quote-enter-left,
                    .signal-orbit-meta-enter,
                    .signal-orbit-progress-ring,
                    .signal-orbit-card,
                    .signal-orbit-quote span {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>

            <div
                className={`signal-orbit signal-orbit-stage ${
                    isStatic ? "signal-orbit-static" : ""
                }`}
                role="region"
                aria-roledescription="carousel"
                aria-label={
                    isStatic
                        ? "Static preview of customer testimonial orbit"
                        : "Customer testimonials"
                }
                tabIndex={isStatic ? -1 : 0}
                onWheelCapture={
                    isStatic || !wheelEnabled
                        ? undefined
                        : (event) => {
                              event.preventDefault()
                          }
                }
                onKeyDown={
                    isStatic
                        ? undefined
                        : (event) => {
                              if (
                                  event.key === "ArrowRight" ||
                                  event.key === "ArrowDown"
                              ) {
                                  event.preventDefault()
                                  changeTo(index + 1, 1)
                              }

                              if (
                                  event.key === "ArrowLeft" ||
                                  event.key === "ArrowUp"
                              ) {
                                  event.preventDefault()
                                  changeTo(index - 1, -1)
                              }
                          }
                }
                onMouseEnter={isStatic ? undefined : () => setPaused(true)}
                onMouseLeave={isStatic ? undefined : () => setPaused(false)}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    outline: "none",
                    isolation: "isolate",
                    userSelect: "none",
                    padding: 0,
                }}
            >
                <div
                    className="signal-orbit-orbit"
                    role="group"
                    aria-label={
                        isStatic
                            ? "Static testimonial orbit preview"
                            : "Draggable testimonial orbit"
                    }
                    onPointerDown={isStatic ? undefined : beginOrbitDrag}
                    onPointerMove={isStatic ? undefined : moveOrbitDrag}
                    onPointerUp={isStatic ? undefined : finishOrbitDrag}
                    onPointerCancel={isStatic ? undefined : finishOrbitDrag}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: fittedOrbitSize,
                        aspectRatio: "1",
                        transform: `translate(-50%, -50%) rotate(${dragRotation}deg)`,
                        transition:
                            isStatic || isDragging || isCoasting
                                ? "none"
                                : "transform .62s cubic-bezier(.22,1,.36,1)",
                        cursor: isStatic
                            ? "default"
                            : isDragging
                              ? "grabbing"
                              : "grab",
                        touchAction: isStatic ? "auto" : "none",
                        zIndex: 1,
                    }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "visible",
                            pointerEvents: "none",
                            zIndex: 0,
                            isolation: "isolate",
                        }}
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r={outerRingRadiusPercent}
                            fill="none"
                            stroke={orbitColor}
                            strokeOpacity={orbitOpacity}
                            strokeWidth={orbitLineWidth}
                            vectorEffect="non-scaling-stroke"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r={middleRingRadiusPercent}
                            fill="none"
                            stroke={orbitColor}
                            strokeOpacity={orbitOpacity * 0.72}
                            strokeWidth={orbitLineWidth}
                            strokeDasharray={orbitDashed ? "4 5" : undefined}
                            vectorEffect="non-scaling-stroke"
                        />

                        {showProgress && (
                            <circle
                                key={`orbit-progress-${progressKey}-${paused}-${progressRing}`}
                                className={
                                    !isStatic &&
                                    autoplay &&
                                    !paused &&
                                    !isDragging
                                        ? "signal-orbit-progress-ring"
                                        : undefined
                                }
                                cx="50"
                                cy="50"
                                r={progressRadius}
                                pathLength="100"
                                fill="none"
                                stroke={progressColor}
                                strokeWidth={progressWidth}
                                strokeLinecap="round"
                                strokeDasharray="100"
                                strokeDashoffset={
                                    isStatic
                                        ? 42
                                        : !autoplay || paused || isDragging
                                          ? 100
                                          : undefined
                                }
                                vectorEffect="non-scaling-stroke"
                                transform="rotate(-90 50 50)"
                                style={
                                    {
                                        "--signal-delay": `${autoplayDelay}s`,
                                    } as React.CSSProperties
                                }
                            />
                        )}
                    </svg>

                    {items.map((item, avatarIndex) => {
                        const relativeIndex = avatarIndex - index
                        const angle = -90 + relativeIndex * (360 / items.length)
                        const radians = (angle * Math.PI) / 180
                        const x = 50 + Math.cos(radians) * radiusPercent
                        const y = 50 + Math.sin(radians) * radiusPercent
                        const isActive = avatarIndex === index
                        const isHovered = hoveredIndex === avatarIndex

                        const scale = isHovered
                            ? isActive
                                ? 1.2
                                : 0.98
                            : isActive
                              ? 1.1
                              : 0.82

                        return (
                            <button
                                key={`${item.name}-${avatarIndex}`}
                                data-index={avatarIndex}
                                className={`signal-orbit-avatar ${
                                    isActive ? "signal-orbit-avatar-active" : ""
                                }`}
                                type="button"
                                aria-label={`Show testimonial from ${item.name}`}
                                disabled={isStatic}
                                onClick={
                                    isStatic
                                        ? undefined
                                        : (event) => {
                                              // Selection is handled by the
                                              // orbit pointer-up logic so click
                                              // and drag can coexist.
                                              event.preventDefault()
                                              event.stopPropagation()
                                          }
                                }
                                onPointerEnter={
                                    isStatic
                                        ? undefined
                                        : () => setHoveredIndex(avatarIndex)
                                }
                                onPointerLeave={
                                    isStatic
                                        ? undefined
                                        : () => setHoveredIndex(null)
                                }
                                style={{
                                    position: "absolute",
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    width: responsiveAvatar,
                                    height: responsiveAvatar,
                                    padding: 0,
                                    appearance: "none",
                                    border: `2px solid ${itemAvatarBorder(
                                        item,
                                        isActive
                                    )}`,
                                    borderRadius: "50%",
                                    background: "#25262C",
                                    boxShadow: isActive
                                        ? avatarShadowEnabled
                                            ? `0 0 0 5px ${itemAccent(item)}1F, ${avatarShadow}`
                                            : `0 0 0 5px ${itemAccent(item)}1F`
                                        : avatarShadow,
                                    transform: `translate(-50%, -50%) scale(${scale})`,
                                    opacity: isStatic
                                        ? isActive
                                            ? 1
                                            : 0.9
                                        : isActive
                                          ? 1
                                          : 0.6,
                                    overflow: "hidden",
                                    cursor: isStatic
                                        ? "default"
                                        : isDragging
                                          ? "grabbing"
                                          : "grab",
                                    touchAction: "none",
                                    zIndex: isActive ? 3 : 2,
                                }}
                            >
                                <img
                                    src={imageSource(item.image)}
                                    alt={imageAlt(item.image, item.name)}
                                    draggable={false}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                        pointerEvents: "none",
                                        filter: isActive
                                            ? "saturate(1)"
                                            : "saturate(.72)",
                                    }}
                                />
                            </button>
                        )
                    })}
                </div>

                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        zIndex: 8,
                        width: fittedCardWidth,
                        height: fittedCardHeight,
                        borderRadius,
                        background,
                        pointerEvents: "none",
                    }}
                />

                <article
                    className={`signal-orbit-card ${
                        isDragging ? "signal-orbit-card-dragging" : ""
                    }`}
                    aria-live={isStatic ? "off" : "polite"}
                    onPointerMove={
                        cardTilt && !isStatic && !isDragging
                            ? (event) => {
                                  const rect =
                                      event.currentTarget.getBoundingClientRect()
                                  const x =
                                      (event.clientX - rect.left) / rect.width -
                                      0.5
                                  const y =
                                      (event.clientY - rect.top) / rect.height -
                                      0.5
                                  setCardTiltValue({
                                      x: -y * tiltAmount * 2,
                                      y: x * tiltAmount * 2,
                                  })
                              }
                            : undefined
                    }
                    onPointerEnter={
                        cardTilt && !isStatic
                            ? () => setCardHovered(true)
                            : undefined
                    }
                    onPointerLeave={
                        cardTilt && !isStatic
                            ? () => {
                                  setCardHovered(false)
                                  setCardTiltValue({ x: 0, y: 0 })
                              }
                            : undefined
                    }
                    style={{
                        position: "relative",
                        zIndex: 9,
                        width: fittedCardWidth,
                        height: fittedCardHeight,
                        minHeight: Math.min(fittedCardHeight, 240),
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: responsiveCardPadding,
                        border: `1px solid ${textColor}24`,
                        borderRadius,
                        background: `linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.018)), ${activeCardBackground}`,
                        boxShadow: cardShadow,
                        backdropFilter: "blur(24px)",
                        overflow: "hidden",
                        overflowY:
                            fittedCardHeight < cardHeight ? "auto" : "hidden",
                        transform: cardTilt
                            ? `perspective(${perspective}px) rotateX(${cardTiltValue.x}deg) rotateY(${cardTiltValue.y}deg) translateY(${cardHovered ? -hoverLift : 0}px)`
                            : "none",
                        transformStyle: "preserve-3d",
                        willChange: cardTilt ? "transform" : undefined,
                        transition: isDragging
                            ? "none"
                            : "transform .28s cubic-bezier(.22,1,.36,1)",
                    }}
                >
                    <div
                        key={`quote-${transitionKey}`}
                        className={
                            isStatic
                                ? undefined
                                : transitionDirection > 0
                                  ? "signal-orbit-quote-enter-right"
                                  : "signal-orbit-quote-enter-left"
                        }
                    >
                        <p
                            className="signal-orbit-quote"
                            style={{
                                margin: 0,
                                ...responsiveQuoteFont,
                                color: activeQuoteColor,
                            }}
                        >
                            {quoteEffect === "typewriter"
                                ? typedQuote
                                : active.quote}
                            {quoteEffect === "typewriter" &&
                                typedQuote.length < active.quote.length && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            display: "inline-block",
                                            width: "0.08em",
                                            height: "0.9em",
                                            marginLeft: "0.08em",
                                            background: activeQuoteColor,
                                            verticalAlign: "-0.08em",
                                            animation:
                                                "signalTypeCursor .8s steps(1) infinite",
                                        }}
                                    />
                                )}
                        </p>
                    </div>

                    <div
                        key={`meta-${transitionKey}`}
                        className={
                            isStatic ? undefined : "signal-orbit-meta-enter"
                        }
                    >
                        <div
                            className="signal-orbit-person"
                            style={{
                                display: "flex",
                                flexDirection: compact ? "column" : "row",
                                alignItems: compact ? "flex-start" : "flex-end",
                                justifyContent: "space-between",
                                gap: compact ? 14 : 18,
                                marginTop: compact ? 22 : 34,
                            }}
                        >
                            <div>
                                <p
                                    style={{
                                        margin: "0 0 7px",
                                        ...nameFont,
                                        color: activeNameColor,
                                    }}
                                >
                                    {active.name}
                                </p>

                                {showRating && (
                                    <div
                                        aria-label={`${normalizedRating} out of 5 stars`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            marginBottom: 8,
                                        }}
                                    >
                                        {[0, 1, 2, 3, 4].map((starIndex) => {
                                            const fillAmount = Math.max(
                                                0,
                                                Math.min(
                                                    1,
                                                    normalizedRating - starIndex
                                                )
                                            )

                                            return (
                                                <span
                                                    key={starIndex}
                                                    aria-hidden="true"
                                                    style={{
                                                        position: "relative",
                                                        display: "inline-block",
                                                        width: starSize,
                                                        height: starSize,
                                                        color: activeEmptyStarColor,
                                                        fontSize: starSize,
                                                        lineHeight: 1,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            inset: 0,
                                                        }}
                                                    >
                                                        ★
                                                    </span>
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            inset: 0,
                                                            width: `${fillAmount * 100}%`,
                                                            overflow: "hidden",
                                                            color: activeStarColor,
                                                        }}
                                                    >
                                                        ★
                                                    </span>
                                                </span>
                                            )
                                        })}
                                    </div>
                                )}

                                <p
                                    style={{
                                        margin: 0,
                                        ...roleFont,
                                        color: activeRoleColor,
                                    }}
                                >
                                    {active.role}
                                </p>
                            </div>

                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "10px 13px",
                                    borderRadius: 999,
                                    background: activeResultBackground,
                                    color: activeResultColor,
                                    ...resultFont,
                                    whiteSpace: "nowrap",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {active.result}
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    )
}

function staticColorWithOpacity(color: string, opacity: number) {
    if (color.startsWith("rgba") || color.startsWith("hsla")) return color
    if (color.startsWith("rgb") || color.startsWith("hsl")) return color
    const normalized = color.replace("#", "")
    const expanded =
        normalized.length === 3
            ? normalized
                  .split("")
                  .map((character) => character + character)
                  .join("")
            : normalized
    const value = Number.parseInt(expanded, 16)
    if (Number.isNaN(value)) return `rgba(0,0,0,${opacity})`
    return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${opacity})`
}

function OrbitStatic(props: Props) {
    const {
        content,
        layout,
        appearance,
        typography,
        orbit,
        ratings,
        shadows,
        style,
    } = props
    const items = content?.testimonials?.length
        ? content.testimonials
        : fallbackTestimonials
    const active = items[0]

    const cardWidth = layout?.cardWidth ?? 408
    const cardHeight = layout?.cardHeight ?? 360
    const orbitSize = layout?.orbitSize ?? 730
    const avatarSize = layout?.avatarSize ?? 56
    const borderRadius = layout?.borderRadius ?? 28

    const globalAccent = appearance?.accent ?? "#D7FF64"
    const background = appearance?.background ?? "#090A0D"
    const textColor = appearance?.textColor ?? "#F4F1E8"
    const custom = active?.customStyle === true
    const accent = custom && active.accent ? active.accent : globalAccent
    const cardBackground =
        custom && active.cardBackground
            ? active.cardBackground
            : (appearance?.cardBackground ?? "rgba(20, 21, 25, 0.78)")
    const quoteColor =
        custom && active.quoteColor
            ? active.quoteColor
            : (typography?.quoteColor ?? "#F4F1E8")
    const nameColor =
        custom && active.nameColor
            ? active.nameColor
            : (typography?.nameColor ?? "#F4F1E8")
    const roleColor =
        custom && active.roleColor
            ? active.roleColor
            : (typography?.roleColor ?? "rgba(244, 241, 232, 0.62)")
    const resultBackground =
        custom && active.resultBackground
            ? active.resultBackground
            : (appearance?.resultBackground ?? "#D7FF64")
    const resultColor =
        custom && active.resultColor
            ? active.resultColor
            : (typography?.resultColor ?? "#10120A")
    const filledStar =
        custom && active.starColor
            ? active.starColor
            : (ratings?.starColor ?? "#D7FF64")
    const emptyStar =
        custom && active.emptyStarColor
            ? active.emptyStarColor
            : (ratings?.emptyStarColor ?? "rgba(244, 241, 232, 0.22)")

    const quoteFont = typography?.quoteFont ?? {
        fontFamily: "Inter",
        fontSize: 35,
        fontWeight: 600,
        lineHeight: 1.14,
        letterSpacing: "-0.045em",
    }
    const nameFont = typography?.nameFont ?? {
        fontFamily: "Inter",
        fontSize: 15,
        fontWeight: 800,
        lineHeight: 1.2,
    }
    const roleFont = typography?.roleFont ?? {
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.5,
    }
    const resultFont = typography?.resultFont ?? {
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: 800,
        lineHeight: 1.2,
    }
    const starSize = ratings?.starSize ?? 18
    const normalizedRating = Math.max(0, Math.min(5, active?.rating ?? 5))

    const cardShadow =
        shadows?.cardEnabled === false
            ? "none"
            : `${shadows?.cardX ?? 0}px ${shadows?.cardY ?? 36}px ${shadows?.cardBlur ?? 90}px ${shadows?.cardSpread ?? 0}px ${staticColorWithOpacity(shadows?.cardColor ?? "#000000", shadows?.cardOpacity ?? 0.42)}`
    const avatarShadow =
        shadows?.avatarEnabled === false
            ? "none"
            : `0 ${shadows?.avatarY ?? 14}px ${shadows?.avatarBlur ?? 34}px ${shadows?.avatarSpread ?? 0}px ${staticColorWithOpacity(shadows?.avatarColor ?? "#000000", shadows?.avatarOpacity ?? 0.42)}`

    const outerRadius = 46.5
    const middleRadius = 36
    const progressRadius =
        orbit?.progressRing === "middle" ? middleRadius : outerRadius

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: 240,
                minHeight: 320,
                position: "relative",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                color: textColor,
                background,
                boxSizing: "border-box",
                fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
            aria-label="Static testimonial orbit preview"
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: orbitSize,
                    height: orbitSize,
                    transform: "translate(-50%, -50%)",
                }}
            >
                <svg
                    viewBox="0 0 100 100"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "visible",
                    }}
                >
                    <circle
                        cx="50"
                        cy="50"
                        r={outerRadius}
                        fill="none"
                        stroke={orbit?.color ?? globalAccent}
                        strokeOpacity={orbit?.opacity ?? 0.26}
                        strokeWidth={orbit?.lineWidth ?? 1}
                        vectorEffect="non-scaling-stroke"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r={middleRadius}
                        fill="none"
                        stroke={orbit?.color ?? globalAccent}
                        strokeOpacity={(orbit?.opacity ?? 0.26) * 0.72}
                        strokeWidth={orbit?.lineWidth ?? 1}
                        strokeDasharray={
                            orbit?.dashed === false ? undefined : "4 5"
                        }
                        vectorEffect="non-scaling-stroke"
                    />
                    {orbit?.showProgress !== false && (
                        <circle
                            cx="50"
                            cy="50"
                            r={progressRadius}
                            pathLength="100"
                            fill="none"
                            stroke={orbit?.progressColor ?? globalAccent}
                            strokeWidth={orbit?.progressWidth ?? 3}
                            strokeLinecap="round"
                            strokeDasharray="100"
                            strokeDashoffset="42"
                            vectorEffect="non-scaling-stroke"
                            transform="rotate(-90 50 50)"
                        />
                    )}
                </svg>
                {items.map((item, itemIndex) => {
                    const angle = -90 + itemIndex * (360 / items.length)
                    const radians = (angle * Math.PI) / 180
                    const x = 50 + Math.cos(radians) * outerRadius
                    const y = 50 + Math.sin(radians) * outerRadius
                    const selected = itemIndex === 0
                    const border =
                        item.customStyle && item.avatarBorderColor
                            ? item.avatarBorderColor
                            : selected
                              ? accent
                              : textColor
                    return (
                        <div
                            key={`${item.name}-${itemIndex}`}
                            style={{
                                position: "absolute",
                                left: `${x}%`,
                                top: `${y}%`,
                                width: avatarSize,
                                height: avatarSize,
                                border: `2px solid ${border}`,
                                borderRadius: "50%",
                                background: "#25262C",
                                boxShadow: selected
                                    ? `0 0 0 5px ${staticColorWithOpacity(accent, 0.12)}, ${avatarShadow}`
                                    : avatarShadow,
                                transform: `translate(-50%, -50%) scale(${selected ? 1.08 : 0.86})`,
                                opacity: selected ? 1 : 0.82,
                                overflow: "hidden",
                            }}
                        >
                            <img
                                src={imageSource(item.image)}
                                alt={imageAlt(item.image, item.name)}
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "50%",
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            <article
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: `min(72%, ${cardWidth}px)`,
                    height: Math.min(cardHeight, 360),
                    maxWidth: "calc(100% - 40px)",
                    maxHeight: "calc(100% - 80px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: Math.max(18, Math.min(34, cardWidth * 0.075)),
                    border: `1px solid ${staticColorWithOpacity(textColor, 0.14)}`,
                    borderRadius,
                    background: `linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.018)), ${cardBackground}`,
                    boxShadow: cardShadow,
                    overflow: "hidden",
                }}
            >
                <p style={{ margin: 0, ...quoteFont, color: quoteColor }}>
                    {active?.quote}
                </p>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 18,
                        marginTop: 28,
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: "0 0 7px",
                                ...nameFont,
                                color: nameColor,
                            }}
                        >
                            {active?.name}
                        </p>
                        {ratings?.show !== false && (
                            <div
                                aria-label={`${normalizedRating} out of 5 stars`}
                                style={{
                                    display: "flex",
                                    gap: 4,
                                    marginBottom: 8,
                                }}
                            >
                                {[0, 1, 2, 3, 4].map((starIndex) => {
                                    const fill = Math.max(
                                        0,
                                        Math.min(
                                            1,
                                            normalizedRating - starIndex
                                        )
                                    )
                                    return (
                                        <span
                                            key={starIndex}
                                            aria-hidden="true"
                                            style={{
                                                position: "relative",
                                                display: "inline-block",
                                                width: starSize,
                                                height: starSize,
                                                color: emptyStar,
                                                fontSize: starSize,
                                                lineHeight: 1,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                }}
                                            >
                                                ★
                                            </span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: `${fill * 100}%`,
                                                    overflow: "hidden",
                                                    color: filledStar,
                                                }}
                                            >
                                                ★
                                            </span>
                                        </span>
                                    )
                                })}
                            </div>
                        )}
                        <p style={{ margin: 0, ...roleFont, color: roleColor }}>
                            {active?.role}
                        </p>
                    </div>
                    <div
                        style={{
                            flex: "0 0 auto",
                            padding: "10px 13px",
                            borderRadius: 999,
                            background: resultBackground,
                            color: resultColor,
                            ...resultFont,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {active?.result}
                    </div>
                </div>
            </article>
        </div>
    )
}

export default function OrbitTestimonials(props: Props) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? (
        <OrbitStatic {...props} />
    ) : (
        <OrbitInteractive {...props} />
    )
}

OrbitTestimonials.defaultProps = {
    content: {
        testimonials: fallbackTestimonials,
    },
    layout: {
        cardWidth: 408,
        cardHeight: 360,
        orbitSize: 730,
        avatarSize: 56,
        borderRadius: 28,
    },
    appearance: {
        accent: "#D7FF64",
        background: "#090A0D",
        cardBackground: "rgba(20, 21, 25, 0.78)",
        textColor: "#F4F1E8",
        mutedColor: "rgba(244, 241, 232, 0.62)",
        resultBackground: "#D7FF64",
    },
    typography: {
        quoteFont: {
            fontFamily: "Inter",
            fontSize: 35,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "-0.045em",
        },
        quoteColor: "#F4F1E8",
        nameFont: {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "0em",
        },
        nameColor: "#F4F1E8",
        roleFont: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: "0em",
        },
        roleColor: "rgba(244, 241, 232, 0.62)",
        resultFont: {
            fontFamily: "Inter",
            fontSize: 11,
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "0em",
        },
        resultColor: "#10120A",
    },
    orbit: {
        color: "#D7FF64",
        opacity: 0.26,
        lineWidth: 1,
        dashed: true,
        showProgress: true,
        progressRing: "outer",
        progressColor: "#D7FF64",
        progressWidth: 3,
    },
    animation: {
        autoplay: true,
        autoplayDelay: 6.2,
        dragThreshold: 42,
        quoteEffect: "none",
        typewriterSpeed: 34,
        wheelEnabled: true,
    },
    ratings: {
        show: true,
        starColor: "#D7FF64",
        emptyStarColor: "rgba(244, 241, 232, 0.22)",
        starSize: 18,
    },
    premium: {
        cardTilt: true,
        tiltAmount: 4,
        perspective: 1100,
        hoverLift: 3,
        scrollbar: true,
        scrollbarWidth: 5,
        scrollbarThumb: "rgba(244, 241, 232, 0.22)",
        scrollbarHover: "#D7FF64",
        scrollbarTrack: "transparent",
        scrollbarRadius: 999,
        staggered: true,
        staggerDistance: 16,
        staggerBlur: 5,
        staggerDelay: 90,
    },
    shadows: {
        cardEnabled: true,
        cardColor: "#000000",
        cardOpacity: 0.42,
        cardBlur: 90,
        cardSpread: 0,
        cardX: 0,
        cardY: 36,
        avatarEnabled: true,
        avatarColor: "#000000",
        avatarOpacity: 0.42,
        avatarBlur: 34,
        avatarSpread: 0,
        avatarY: 14,
    },
}

addPropertyControls(OrbitTestimonials, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            testimonials: {
                type: ControlType.Array,
                title: "Testimonials",
                maxCount: 16,
                control: {
                    type: ControlType.Object,
                    controls: {
                        quote: {
                            type: ControlType.String,
                            title: "Quote",
                            displayTextArea: true,
                        },
                        name: {
                            type: ControlType.String,
                            title: "Name",
                        },
                        role: {
                            type: ControlType.String,
                            title: "Role",
                        },
                        result: {
                            type: ControlType.String,
                            title: "Result",
                        },
                        rating: {
                            type: ControlType.Number,
                            title: "Rating",
                            defaultValue: 5,
                            min: 0,
                            max: 5,
                            step: 0.1,
                        },
                        image: {
                            type: ControlType.Image,
                            title: "Photo",
                        },
                        customStyle: {
                            type: ControlType.Boolean,
                            title: "Custom Style",
                            defaultValue: false,
                        },
                        accent: {
                            type: ControlType.Color,
                            title: "Accent",
                            defaultValue: "#D7FF64",
                            hidden: (item) => !item.customStyle,
                        },
                        cardBackground: {
                            type: ControlType.Color,
                            title: "Card BG",
                            defaultValue: "rgba(20, 21, 25, 0.78)",
                            hidden: (item) => !item.customStyle,
                        },
                        quoteColor: {
                            type: ControlType.Color,
                            title: "Quote Color",
                            defaultValue: "#F4F1E8",
                            hidden: (item) => !item.customStyle,
                        },
                        nameColor: {
                            type: ControlType.Color,
                            title: "Name Color",
                            defaultValue: "#F4F1E8",
                            hidden: (item) => !item.customStyle,
                        },
                        roleColor: {
                            type: ControlType.Color,
                            title: "Role Color",
                            defaultValue: "rgba(244, 241, 232, 0.62)",
                            hidden: (item) => !item.customStyle,
                        },
                        resultBackground: {
                            type: ControlType.Color,
                            title: "Result BG",
                            defaultValue: "#D7FF64",
                            hidden: (item) => !item.customStyle,
                        },
                        resultColor: {
                            type: ControlType.Color,
                            title: "Result Text",
                            defaultValue: "#10120A",
                            hidden: (item) => !item.customStyle,
                        },
                        starColor: {
                            type: ControlType.Color,
                            title: "Star Filled",
                            defaultValue: "#D7FF64",
                            hidden: (item) => !item.customStyle,
                        },
                        emptyStarColor: {
                            type: ControlType.Color,
                            title: "Star Empty",
                            defaultValue: "rgba(244, 241, 232, 0.22)",
                            hidden: (item) => !item.customStyle,
                        },
                        avatarBorderColor: {
                            type: ControlType.Color,
                            title: "Avatar Border",
                            defaultValue: "#D7FF64",
                            hidden: (item) => !item.customStyle,
                        },
                    },
                },
                defaultValue: fallbackTestimonials,
            },
        },
        defaultValue: {
            testimonials: fallbackTestimonials,
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: 408,
                min: 220,
                max: 620,
                step: 1,
                unit: "px",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                defaultValue: 360,
                min: 220,
                max: 620,
                step: 1,
                unit: "px",
            },
            orbitSize: {
                type: ControlType.Number,
                title: "Orbit Size",
                defaultValue: 730,
                min: 240,
                max: 1100,
                step: 1,
                unit: "px",
            },
            avatarSize: {
                type: ControlType.Number,
                title: "Avatar Size",
                defaultValue: 56,
                min: 28,
                max: 100,
                step: 1,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Card Radius",
                defaultValue: 28,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            cardWidth: 408,
            cardHeight: 360,
            orbitSize: 730,
            avatarSize: 56,
            borderRadius: 28,
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#D7FF64",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#090A0D",
            },
            cardBackground: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: "rgba(20, 21, 25, 0.78)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Base Text",
                defaultValue: "#F4F1E8",
            },
            mutedColor: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: "rgba(244, 241, 232, 0.62)",
            },
            resultBackground: {
                type: ControlType.Color,
                title: "Result BG",
                defaultValue: "#D7FF64",
            },
        },
        defaultValue: {
            accent: "#D7FF64",
            background: "#090A0D",
            cardBackground: "rgba(20, 21, 25, 0.78)",
            textColor: "#F4F1E8",
            mutedColor: "rgba(244, 241, 232, 0.62)",
            resultBackground: "#D7FF64",
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            quoteFont: {
                type: ControlType.Font,
                title: "Quote",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 35,
                    variant: "Semibold",
                    lineHeight: 1.14,
                    letterSpacing: "-0.045em",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "35px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            quoteColor: {
                type: ControlType.Color,
                title: "Quote Color",
                defaultValue: "#F4F1E8",
            },
            nameFont: {
                type: ControlType.Font,
                title: "Name",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 15,
                    variant: "Extra Bold",
                    lineHeight: 1.2,
                    letterSpacing: "0em",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "15px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            nameColor: {
                type: ControlType.Color,
                title: "Name Color",
                defaultValue: "#F4F1E8",
            },
            roleFont: {
                type: ControlType.Font,
                title: "Role",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12,
                    variant: "Regular",
                    lineHeight: 1.5,
                    letterSpacing: "0em",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "12px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            roleColor: {
                type: ControlType.Color,
                title: "Role Color",
                defaultValue: "rgba(244, 241, 232, 0.62)",
            },
            resultFont: {
                type: ControlType.Font,
                title: "Result",
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 11,
                    variant: "Extra Bold",
                    lineHeight: 1.2,
                    letterSpacing: "0em",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "11px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            resultColor: {
                type: ControlType.Color,
                title: "Result Color",
                defaultValue: "#10120A",
            },
        },
        defaultValue: {
            quoteFont: {
                fontFamily: "Inter",
                fontSize: 35,
                variant: "Semibold",
                lineHeight: 1.14,
                letterSpacing: "-0.045em",
            },
            quoteColor: "#F4F1E8",
            nameFont: {
                fontFamily: "Inter",
                fontSize: 15,
                variant: "Extra Bold",
                lineHeight: 1.2,
                letterSpacing: "0em",
            },
            nameColor: "#F4F1E8",
            roleFont: {
                fontFamily: "Inter",
                fontSize: 12,
                variant: "Regular",
                lineHeight: 1.5,
                letterSpacing: "0em",
            },
            roleColor: "rgba(244, 241, 232, 0.62)",
            resultFont: {
                fontFamily: "Inter",
                fontSize: 11,
                variant: "Extra Bold",
                lineHeight: 1.2,
                letterSpacing: "0em",
            },
            resultColor: "#10120A",
        },
    },

    orbit: {
        type: ControlType.Object,
        title: "Orbit",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Line Color",
                defaultValue: "#D7FF64",
            },
            opacity: {
                type: ControlType.Number,
                title: "Line Opacity",
                defaultValue: 0.26,
                min: 0,
                max: 1,
                step: 0.01,
            },
            lineWidth: {
                type: ControlType.Number,
                title: "Line Width",
                defaultValue: 1,
                min: 0.5,
                max: 6,
                step: 0.5,
                unit: "px",
            },
            dashed: {
                type: ControlType.Boolean,
                title: "Dashed Middle",
                defaultValue: true,
            },
            showProgress: {
                type: ControlType.Boolean,
                title: "Progress",
                defaultValue: true,
            },
            progressRing: {
                type: ControlType.Enum,
                title: "Progress Ring",
                options: ["outer", "middle"],
                optionTitles: ["Outer", "Middle"],
                defaultValue: "outer",
                hidden: (settings) => !settings.showProgress,
            },
            progressColor: {
                type: ControlType.Color,
                title: "Progress Color",
                defaultValue: "#D7FF64",
                hidden: (settings) => !settings.showProgress,
            },
            progressWidth: {
                type: ControlType.Number,
                title: "Progress Width",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 0.5,
                unit: "px",
                hidden: (settings) => !settings.showProgress,
            },
        },
        defaultValue: {
            color: "#D7FF64",
            opacity: 0.26,
            lineWidth: 1,
            dashed: true,
            showProgress: true,
            progressRing: "outer",
            progressColor: "#D7FF64",
            progressWidth: 3,
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            autoplayDelay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 6.2,
                min: 2,
                max: 15,
                step: 0.1,
                unit: "s",
                hidden: (settings) => !settings.autoplay,
            },
            dragThreshold: {
                type: ControlType.Number,
                title: "Drag Threshold",
                defaultValue: 42,
                min: 20,
                max: 100,
                step: 1,
                unit: "px",
            },
            wheelEnabled: {
                type: ControlType.Boolean,
                title: "Mousewheel",
                defaultValue: true,
            },
            quoteEffect: {
                type: ControlType.Enum,
                title: "Quote Effect",
                options: ["none", "typewriter"],
                optionTitles: ["None", "Typewriter"],
                defaultValue: "none",
            },
            typewriterSpeed: {
                type: ControlType.Number,
                title: "Typing Speed",
                defaultValue: 34,
                min: 10,
                max: 150,
                step: 1,
                unit: "ms",
                hidden: (settings) => settings.quoteEffect !== "typewriter",
            },
        },
        defaultValue: {
            autoplay: true,
            autoplayDelay: 6.2,
            dragThreshold: 42,
            quoteEffect: "none",
            typewriterSpeed: 34,
            wheelEnabled: true,
        },
    },

    ratings: {
        type: ControlType.Object,
        title: "Ratings",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Stars",
                defaultValue: true,
            },
            starColor: {
                type: ControlType.Color,
                title: "Filled",
                defaultValue: "#D7FF64",
                hidden: (settings) => !settings.show,
            },
            emptyStarColor: {
                type: ControlType.Color,
                title: "Empty",
                defaultValue: "rgba(244, 241, 232, 0.22)",
                hidden: (settings) => !settings.show,
            },
            starSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 18,
                min: 10,
                max: 36,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.show,
            },
        },
        defaultValue: {
            show: true,
            starColor: "#D7FF64",
            emptyStarColor: "rgba(244, 241, 232, 0.22)",
            starSize: 18,
        },
    },

    premium: {
        type: ControlType.Object,
        title: "Premium Motion",
        controls: {
            cardTilt: {
                type: ControlType.Boolean,
                title: "Card Tilt",
                defaultValue: true,
            },
            tiltAmount: {
                type: ControlType.Number,
                title: "Tilt Amount",
                defaultValue: 4,
                min: 0,
                max: 12,
                step: 0.5,
                unit: "°",
                hidden: (settings) => !settings.cardTilt,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1100,
                min: 400,
                max: 2000,
                step: 50,
                unit: "px",
                hidden: (settings) => !settings.cardTilt,
            },
            hoverLift: {
                type: ControlType.Number,
                title: "Hover Lift",
                defaultValue: 3,
                min: 0,
                max: 16,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.cardTilt,
            },
            scrollbar: {
                type: ControlType.Boolean,
                title: "Scrollbar",
                defaultValue: true,
            },
            scrollbarWidth: {
                type: ControlType.Number,
                title: "Bar Width",
                defaultValue: 5,
                min: 2,
                max: 14,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.scrollbar,
            },
            scrollbarThumb: {
                type: ControlType.Color,
                title: "Thumb",
                defaultValue: "rgba(244, 241, 232, 0.22)",
                hidden: (settings) => !settings.scrollbar,
            },
            scrollbarHover: {
                type: ControlType.Color,
                title: "Thumb Hover",
                defaultValue: "#D7FF64",
                hidden: (settings) => !settings.scrollbar,
            },
            scrollbarTrack: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: "rgba(0, 0, 0, 0)",
                hidden: (settings) => !settings.scrollbar,
            },
            scrollbarRadius: {
                type: ControlType.Number,
                title: "Bar Radius",
                defaultValue: 999,
                min: 0,
                max: 999,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.scrollbar,
            },
            staggered: {
                type: ControlType.Boolean,
                title: "Staggered Entry",
                defaultValue: true,
            },
            staggerDistance: {
                type: ControlType.Number,
                title: "Entry Distance",
                defaultValue: 16,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.staggered,
            },
            staggerBlur: {
                type: ControlType.Number,
                title: "Entry Blur",
                defaultValue: 5,
                min: 0,
                max: 16,
                step: 0.5,
                unit: "px",
                hidden: (settings) => !settings.staggered,
            },
            staggerDelay: {
                type: ControlType.Number,
                title: "Meta Delay",
                defaultValue: 90,
                min: 0,
                max: 400,
                step: 10,
                unit: "ms",
                hidden: (settings) => !settings.staggered,
            },
        },
        defaultValue: {
            cardTilt: true,
            tiltAmount: 4,
            perspective: 1100,
            hoverLift: 3,
            scrollbar: true,
            scrollbarWidth: 5,
            scrollbarThumb: "rgba(244, 241, 232, 0.22)",
            scrollbarHover: "#D7FF64",
            scrollbarTrack: "rgba(0, 0, 0, 0)",
            scrollbarRadius: 999,
            staggered: true,
            staggerDistance: 16,
            staggerBlur: 5,
            staggerDelay: 90,
        },
    },

    shadows: {
        type: ControlType.Object,
        title: "Shadows",
        controls: {
            cardEnabled: {
                type: ControlType.Boolean,
                title: "Card Shadow",
                defaultValue: true,
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card Color",
                defaultValue: "#000000",
                hidden: (settings) => !settings.cardEnabled,
            },
            cardOpacity: {
                type: ControlType.Number,
                title: "Card Opacity",
                defaultValue: 0.42,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (settings) => !settings.cardEnabled,
            },
            cardBlur: {
                type: ControlType.Number,
                title: "Card Blur",
                defaultValue: 90,
                min: 0,
                max: 180,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.cardEnabled,
            },
            cardSpread: {
                type: ControlType.Number,
                title: "Card Spread",
                defaultValue: 0,
                min: -40,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.cardEnabled,
            },
            cardX: {
                type: ControlType.Number,
                title: "Card X",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.cardEnabled,
            },
            cardY: {
                type: ControlType.Number,
                title: "Card Y",
                defaultValue: 36,
                min: -100,
                max: 140,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.cardEnabled,
            },
            avatarEnabled: {
                type: ControlType.Boolean,
                title: "Avatar Shadow",
                defaultValue: true,
            },
            avatarColor: {
                type: ControlType.Color,
                title: "Avatar Color",
                defaultValue: "#000000",
                hidden: (settings) => !settings.avatarEnabled,
            },
            avatarOpacity: {
                type: ControlType.Number,
                title: "Avatar Opacity",
                defaultValue: 0.42,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (settings) => !settings.avatarEnabled,
            },
            avatarBlur: {
                type: ControlType.Number,
                title: "Avatar Blur",
                defaultValue: 34,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.avatarEnabled,
            },
            avatarSpread: {
                type: ControlType.Number,
                title: "Avatar Spread",
                defaultValue: 0,
                min: -20,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.avatarEnabled,
            },
            avatarY: {
                type: ControlType.Number,
                title: "Avatar Y",
                defaultValue: 14,
                min: -40,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (settings) => !settings.avatarEnabled,
            },
        },
        defaultValue: {
            cardEnabled: true,
            cardColor: "#000000",
            cardOpacity: 0.42,
            cardBlur: 90,
            cardSpread: 0,
            cardX: 0,
            cardY: 36,
            avatarEnabled: true,
            avatarColor: "#000000",
            avatarOpacity: 0.42,
            avatarBlur: 34,
            avatarSpread: 0,
            avatarY: 14,
        },
    },
})
