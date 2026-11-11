import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ReviewPhoto = {
    src?: string
    alt?: string
    srcSet?: string
    positionX?: string
    positionY?: string
}
type ReviewItem = {
    quote?: string
    showCompanyInfo?: boolean
    name?: string
    role?: string
    company?: string
    companyLogo?: string | ReviewPhoto
    rating?: number | string
    showRating?: boolean
    showReviewText?: boolean
    photo?: string | ReviewPhoto
    video?: string
    _key?: string
}
type ReviewCardProps = {
    review: ReviewItem
    cardKey: string
    active: boolean
    profileLayout: "horizontal" | "vertical"
    profilePosition: "left" | "center" | "right"
    profileAlignment: "left" | "center" | "right"
    profilePhotoSize: number
    showQuoteMark: boolean
    quoteMark: "open" | "close"
    quoteMarkSize: number
    imageMotion: "hero" | "zoom-reveal" | "fade" | "slide" | "zoom"
    reviewSize: number
    nameSize: number
    designationSize: number
    companySize: number
    ratingSize: number
    cardPadding: number
    contentSpacing: number
    cardRadius: number
    showCardBorder: boolean
    cardBorderColor: string
    headingColor: string
    cardBackground: string
    cardText: string
    hoverBackground: string
    hoverText: string
    accentColor: string
    quoteMarkColor: string
    onEnter: (key: string) => void
    onLeave: (key: string) => void
}
type ProfileSettings = {
    profileLayout?: "horizontal" | "vertical"
    profilePosition?: "left" | "center" | "right"
    profileAlignment?: "left" | "center" | "right"
    profilePhotoSize?: number
}
type CardAppearanceSettings = {
    radius?: number
    showBorder?: boolean
    borderColor?: string
}
type CardLayoutSettings = {
    padding?: number
    spacing?: number
    appearance?: CardAppearanceSettings
    cardGap?: number
}
type RevealSettings = {
    showQuoteMark?: boolean
    quoteMark?: "open" | "close"
    quoteMarkSize?: number
    imageMotion?: "hero" | "zoom-reveal" | "fade" | "slide" | "zoom"
}
type TypeSettings = {
    reviewSize?: number
    nameSize?: number
    designationSize?: number
    companySize?: number
    ratingSize?: number
}
type ThemeSettings = {
    headingColor?: string
    cardBackground?: string
    cardText?: string
    hoverBackground?: string
    hoverText?: string
    accentColor?: string
    quoteMarkColor?: string
}
type HeaderSettings = {
    badge?: string
    heading?: string
    badgeSize?: number
    headingSize?: number
    badgeHeadingSpacing?: number
    sectionSpacing?: number
}
type ReviewsScrollerProps = {
    reviews?: ReviewItem[]
    profile?: ProfileSettings
    cardLayout?: CardLayoutSettings
    reveal?: RevealSettings
    typeSettings?: TypeSettings
    header?: HeaderSettings
    scrollSpeed?: number
    scrollDirection?: "down" | "up"
    theme?: ThemeSettings
    style?: CSSProperties
}

const defaultReviews = [
    {
        quote: "I finally feel like I know where my money goes. It’s the first banking app that gives me clarity without adding noise.",
        name: "Maya P.",
        role: "Product designer",
        company: "Studio North",
        rating: 4.9,
        photo: {
            src: "data:framer/asset-reference,9pdWLeJ8JIUqDAICw9xw8CFfxA.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Maya P.",
        },
        companyLogo: {
            src: "data:framer/asset-reference,U1N7Cgr4FjMMI0UkgZFxkdEeIm4.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Studio North mark",
        },
        showRating: true,
    },
    {
        quote: "Sending rent takes seconds, and I can see everything in one place. Forma just makes my day easier.",
        name: "Jordan L.",
        role: "Independent founder",
        company: "Goodwell",
        rating: 4.8,
        photo: {
            src: "data:framer/asset-reference,iqGvZsaI0nZAuDIgwxILaUMSJdc.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Jordan L.",
        },
        companyLogo: {
            src: "data:framer/asset-reference,U1N7Cgr4FjMMI0UkgZFxkdEeIm4.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Goodwell mark",
        },
        showRating: true,
    },
    {
        quote: "It feels thoughtfully made. The little things are so clear that I don’t have to think twice.",
        name: "Sam R.",
        role: "Creative director",
        company: "Forma",
        rating: 5,
        photo: {
            src: "data:framer/asset-reference,UZSJJdi0ZdZ5nU2O9T3O9Si0WLY.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Sam R.",
        },
        companyLogo: {
            src: "data:framer/asset-reference,U1N7Cgr4FjMMI0UkgZFxkdEeIm4.png?originalFilename=imported.png&width=1254&height=1254",
            alt: "Forma mark",
        },
        showRating: true,
    },
]

function ReviewCard({
    review,
    cardKey,
    active,
    headingColor,
    cardBackground,
    cardText,
    hoverBackground,
    hoverText,
    accentColor,
    quoteMarkColor,
    profileLayout,
    profilePosition,
    profileAlignment,
    profilePhotoSize,
    showQuoteMark,
    quoteMark,
    quoteMarkSize,
    imageMotion,
    cardPadding,
    contentSpacing,
    cardRadius,
    showCardBorder,
    cardBorderColor,
    reviewSize,
    nameSize,
    designationSize,
    companySize,
    ratingSize,
    onEnter,
    onLeave,
}: ReviewCardProps) {
    const photo =
        typeof review.photo === "string" ? review.photo : review.photo?.src
    const name = review.name || "Forma member"
    const role = review.role || "Forma member"
    const company = review.company || ""
    const showCompanyInfo = review.showCompanyInfo !== false
    const companyLogo =
        typeof review.companyLogo === "string"
            ? review.companyLogo
            : review.companyLogo?.src
    const video = review.video
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const cardRef = useRef<HTMLElement | null>(null)
    const profilePhotoRef = useRef<HTMLImageElement | null>(null)
    const [videoPlaying, setVideoPlaying] = useState(false)
    const [profileOrigin, setProfileOrigin] = useState<{
        x: number
        y: number
    } | null>(null)
    const imageIsVisible = active && !videoPlaying
    const motion = imageMotion === "hero" ? "zoom-reveal" : imageMotion
    const originX = profileOrigin?.x ?? profilePhotoSize / 2 + 17
    const originY = profileOrigin?.y ?? 235
    const origin = originX + "px " + originY + "px"
    const imageClipPath =
        motion === "zoom-reveal" || motion === "zoom"
            ? imageIsVisible
                ? "circle(160% at " + origin + ")"
                : "circle(0px at " + origin + ")"
            : motion === "fade"
              ? "inset(0%)"
              : motion === "slide"
                ? imageIsVisible
                    ? "inset(0%)"
                    : "inset(100% 0% 0% 0%)"
                : "inset(0%)"
    const imageTransform =
        motion === "zoom-reveal"
            ? imageIsVisible
                ? "scale(1)"
                : "scale(1.24)"
            : motion === "fade"
              ? "scale(1)"
              : motion === "slide"
                ? imageIsVisible
                    ? "translateY(0)"
                    : "translateY(12%)"
                : imageIsVisible
                  ? "scale(1)"
                  : "scale(0.02)"
    const imageOpacity = motion === "fade" && !imageIsVisible ? 0 : 1
    const activateCard = () => {
        const cardBounds = cardRef.current?.getBoundingClientRect()
        const photoBounds = profilePhotoRef.current?.getBoundingClientRect()
        if (cardBounds && photoBounds)
            setProfileOrigin({
                x: photoBounds.left - cardBounds.left + photoBounds.width / 2,
                y: photoBounds.top - cardBounds.top + photoBounds.height / 2,
            })
        onEnter(cardKey)
    }
    const [videoProgress, setVideoProgress] = useState(0)
    const quote = (review.quote || "").trim()
    const hasReviewText = review.showReviewText !== false && Boolean(quote)
    const hasRating =
        review.showRating !== false &&
        review.rating !== undefined &&
        review.rating !== null &&
        review.rating !== ""
    const rating = hasRating
        ? Math.max(0, Math.min(5, Number(review.rating)))
        : 0
    const toggleVideo = () => {
        const player = videoRef.current
        if (!player) return
        if (player.paused)
            player
                .play()
                .then(() => setVideoPlaying(true))
                .catch(() => setVideoPlaying(false))
        else {
            player.pause()
            setVideoPlaying(false)
        }
    }
    const pauseVideo = () => {
        if (videoRef.current && !videoRef.current.paused)
            videoRef.current.pause()
        setVideoPlaying(false)
    }
    return (
        <article
            ref={cardRef}
            aria-label={
                hasRating
                    ? "Review by " +
                      name +
                      ", rated " +
                      rating.toFixed(1) +
                      " out of 5"
                    : "Review by " + name
            }
            tabIndex={0}
            onPointerEnter={activateCard}
            onPointerLeave={() => {
                onLeave(cardKey)
                pauseVideo()
            }}
            onFocus={activateCard}
            onBlur={(event) => {
                const next = event.relatedTarget as Node | null
                if (!next || !event.currentTarget.contains(next)) {
                    onLeave(cardKey)
                    pauseVideo()
                }
            }}
            style={{
                position: "relative",
                isolation: "isolate",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                gap: 0,
                width: "100%",
                minWidth: 0,
                minHeight: 260,
                height: "auto",
                boxSizing: "border-box",
                overflow: "hidden",
                borderRadius: cardRadius,
                border: showCardBorder
                    ? active
                        ? "1px solid rgba(255,255,255,0.14)"
                        : "1px solid " + cardBorderColor
                    : "none",
                padding: cardPadding,
                backgroundColor: active ? hoverBackground : cardBackground,
                color: active ? hoverText : cardText,
                cursor: "default",
                transition:
                    "background-color 220ms ease, color 220ms ease, border-color 220ms ease",
            }}
        >
            {photo ? (
                <img
                    src={photo}
                    alt=""
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -2,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        filter: "grayscale(1)",
                        opacity: imageOpacity,
                        clipPath: imageClipPath,
                        transform: imageTransform,
                        transformOrigin: origin,
                        transition:
                            motion === "fade"
                                ? "opacity 360ms ease"
                                : "clip-path 520ms cubic-bezier(0.2,0.7,0.2,1), transform 520ms cubic-bezier(0.2,0.7,0.2,1)",
                    }}
                />
            ) : null}
            {video ? (
                <video
                    ref={videoRef}
                    src={video}
                    poster={photo}
                    playsInline
                    preload="metadata"
                    onTimeUpdate={(event) => {
                        const player = event.currentTarget
                        setVideoProgress(
                            player.duration
                                ? player.currentTime / player.duration
                                : 0
                        )
                    }}
                    onEnded={() => setVideoPlaying(false)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -2,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: "grayscale(1)",
                        opacity: videoPlaying ? 1 : 0,
                        transition: "opacity 220ms ease",
                    }}
                />
            ) : null}
            {video ? (
                <button
                    type="button"
                    aria-pressed={videoPlaying}
                    aria-label={
                        videoPlaying
                            ? "Pause video testimonial from " + name
                            : "Play video testimonial from " + name
                    }
                    onClick={toggleVideo}
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 60,
                        height: 60,
                        border: "none",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.92)",
                        color: "#191918",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 22px rgba(0,0,0,.2)",
                    }}
                >
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 68 68"
                        style={{
                            position: "absolute",
                            inset: -4,
                            width: 68,
                            height: 68,
                            transform: "rotate(-90deg)",
                        }}
                    >
                        <circle
                            cx="34"
                            cy="34"
                            r="33"
                            fill="none"
                            stroke="rgba(25,25,24,.16)"
                            strokeWidth="2"
                        />
                        <circle
                            cx="34"
                            cy="34"
                            r="33"
                            fill="none"
                            stroke="#191918"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="207.35"
                            strokeDashoffset={207.35 * (1 - videoProgress)}
                        />
                    </svg>
                    <span
                        style={{
                            position: "relative",
                            fontSize: 24,
                            lineHeight: 1,
                            fontWeight: 700,
                            marginLeft: videoPlaying ? 0 : 3,
                        }}
                    >
                        {videoPlaying ? "Ⅱ" : "▶"}
                    </span>
                </button>
            ) : null}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: -1,
                    background:
                        "linear-gradient(180deg, rgba(8,8,8,0.05) 0%, rgba(8,8,8,0.28) 45%, rgba(8,8,8,0.9) 100%)",
                    opacity: active || videoPlaying ? 1 : 0,
                    transition: "opacity 240ms ease",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: contentSpacing,
                    flex: 1,
                    minWidth: 0,
                    marginBottom: contentSpacing,
                }}
            >
                {hasRating || hasReviewText ? (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: contentSpacing,
                        }}
                    >
                        {hasRating ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                }}
                            >
                                <span
                                    aria-label={rating.toFixed(1) + " stars"}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 1,
                                        fontSize: ratingSize,
                                        lineHeight: 1,
                                    }}
                                >
                                    {[0, 1, 2, 3, 4].map((index) => {
                                        const fill = Math.max(
                                            0,
                                            Math.min(1, rating - index)
                                        )
                                        return (
                                            <span
                                                key={index}
                                                aria-hidden="true"
                                                style={{
                                                    display: "inline-block",
                                                    width: "1em",
                                                    textAlign: "center",
                                                    fontSize: "1em",
                                                    backgroundImage:
                                                        "linear-gradient(90deg, " +
                                                        accentColor +
                                                        " " +
                                                        fill * 100 +
                                                        "%, #D9D9D9 " +
                                                        fill * 100 +
                                                        "%)",
                                                    WebkitBackgroundClip:
                                                        "text",
                                                    backgroundClip: "text",
                                                    WebkitTextFillColor:
                                                        "transparent",
                                                }}
                                            >
                                                ★
                                            </span>
                                        )
                                    })}
                                </span>
                                <span
                                    style={{
                                        color: active ? hoverText : cardText,
                                        fontSize: Math.max(8, ratingSize - 1),
                                        fontWeight: 600,
                                    }}
                                >
                                    {rating.toFixed(1)}
                                </span>
                            </div>
                        ) : (
                            <span aria-hidden="true" />
                        )}
                        {hasReviewText && showQuoteMark ? (
                            <span
                                aria-hidden="true"
                                style={{
                                    color: active ? hoverText : quoteMarkColor,
                                    fontSize: quoteMarkSize,
                                    lineHeight: 0.7,
                                    fontWeight: 600,
                                }}
                            >
                                {quoteMark === "open" ? "“" : "”"}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                {hasReviewText ? (
                    <p
                        style={{
                            position: "relative",
                            zIndex: 1,
                            margin: 0,
                            fontSize: reviewSize,
                            lineHeight: 1.42,
                            fontWeight: 400,
                            color: active ? hoverText : cardText,
                            transition: "color 220ms ease",
                        }}
                    >
                        “{quote}”
                    </p>
                ) : null}
            </div>
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection:
                        profileLayout === "vertical" ? "column" : "row",
                    alignItems:
                        profileLayout === "vertical"
                            ? profilePosition === "left"
                                ? "flex-start"
                                : profilePosition === "right"
                                  ? "flex-end"
                                  : "center"
                            : "flex-start",
                    justifyContent:
                        profileLayout === "vertical"
                            ? "flex-start"
                            : profilePosition === "left"
                              ? "flex-start"
                              : profilePosition === "right"
                                ? "flex-end"
                                : "center",
                    gap: 10,
                    paddingTop: 2,
                    flexShrink: 0,
                    maxWidth: "100%",
                }}
            >
                {photo ? (
                    <img
                        ref={profilePhotoRef}
                        src={photo}
                        alt=""
                        aria-hidden="true"
                        style={{
                            width: profilePhotoSize,
                            height: profilePhotoSize,
                            borderRadius: "50%",
                            objectFit: "cover",
                            filter: active ? "grayscale(1)" : "grayscale(0.85)",
                            opacity: 1,
                            boxSizing: "border-box",
                            border: active
                                ? "2px solid rgba(255,255,255,0.9)"
                                : "2px solid transparent",
                            transition: "border-color 180ms ease",
                        }}
                    />
                ) : null}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                            profileAlignment === "left"
                                ? "flex-start"
                                : profileAlignment === "right"
                                  ? "flex-end"
                                  : "center",
                        textAlign: profileAlignment,
                        gap: 3,
                        minWidth: 0,
                    }}
                >
                    <strong
                        style={{
                            fontSize: nameSize,
                            lineHeight: 1.15,
                            fontWeight: 600,
                            color: active ? hoverText : cardText,
                        }}
                    >
                        {name}
                    </strong>
                    <span
                        style={{
                            fontSize: designationSize,
                            lineHeight: 1.2,
                            color: active ? hoverText : cardText,
                        }}
                    >
                        {role}
                    </span>
                    {showCompanyInfo && (company || companyLogo) ? (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                alignSelf:
                                    profileAlignment === "left"
                                        ? "flex-start"
                                        : profileAlignment === "right"
                                          ? "flex-end"
                                          : "center",
                                marginTop: 4,
                                borderRadius: 999,
                                padding: "4px 8px",
                                background: active
                                    ? "rgba(255,255,255,0.16)"
                                    : "rgba(25,25,24,0.055)",
                                color: active ? "#FFFFFF" : "#626A75",
                                fontSize: companySize,
                                lineHeight: 1.1,
                                fontWeight: 500,
                            }}
                        >
                            {showCompanyInfo && companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        objectFit: "contain",
                                        background: "rgba(255,255,255,.85)",
                                        padding: 2,
                                        boxSizing: "border-box",
                                    }}
                                />
                            ) : showCompanyInfo && company ? (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        display: "inline-grid",
                                        placeItems: "center",
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        background: active
                                            ? "rgba(255,255,255,0.2)"
                                            : "rgba(25,25,24,0.06)",
                                        color: active ? hoverText : cardText,
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    {company.slice(0, 1).toUpperCase()}
                                </span>
                            ) : null}
                            {showCompanyInfo ? company : null}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    )
}

// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
function ReviewsScroller({
    reviews = defaultReviews,
    profile,
    cardLayout,
    reveal,
    typeSettings,
    header,
    scrollSpeed: scrollSpeedProp,
    scrollDirection = "down",
    theme,
    style,
}: ReviewsScrollerProps) {
    const isStaticRenderer = useIsStaticRenderer()
    const profileLayout = profile?.profileLayout ?? "horizontal"
    const profilePosition = profile?.profilePosition ?? "left"
    const profileAlignment = profile?.profileAlignment ?? "left"
    const profilePhotoSize = profile?.profilePhotoSize ?? 36
    const showQuoteMark = reveal?.showQuoteMark ?? true
    const quoteMark = reveal?.quoteMark ?? "close"
    const quoteMarkSize = reveal?.quoteMarkSize ?? 22
    const imageMotion = reveal?.imageMotion ?? "zoom-reveal"
    const cardPadding = cardLayout?.padding ?? 24
    const contentSpacing = cardLayout?.spacing ?? 12
    const cardGap = cardLayout?.cardGap ?? 12
    const cardRadius = cardLayout?.appearance?.radius ?? 27.3
    const showCardBorder = cardLayout?.appearance?.showBorder ?? true
    const cardBorderColor = cardLayout?.appearance?.borderColor ?? "#E3E3E3"
    const reviewSize = typeSettings?.reviewSize ?? 13
    const nameSize = typeSettings?.nameSize ?? 12
    const designationSize = typeSettings?.designationSize ?? 10
    const companySize = typeSettings?.companySize ?? 10
    const ratingSize = typeSettings?.ratingSize ?? 12
    const headerBadge = header?.badge ?? "TESTIMONIAL"
    const headerHeading = header?.heading ?? "What They’re Saying"
    const headerBadgeSize = header?.badgeSize ?? 8
    const headerHeadingSize = header?.headingSize ?? 42
    const badgeHeadingSpacing = header?.badgeHeadingSpacing ?? 10
    const headerSectionSpacing = header?.sectionSpacing ?? 32
    const outerRowsDown = scrollDirection === "down"
    const speed = scrollSpeedProp ?? 22
    const headingColor = theme?.headingColor ?? "#191918"
    const cardBackground = theme?.cardBackground ?? "#F4F5F5"
    const cardText = theme?.cardText ?? "#191918"
    const hoverBackground = theme?.hoverBackground ?? "#191918"
    const hoverText = theme?.hoverText ?? "#FFFFFF"
    const accentColor = theme?.accentColor ?? "#191918"
    const quoteMarkColor = theme?.quoteMarkColor ?? "#191918"
    const items = useMemo(() => {
        const incoming =
            Array.isArray(reviews) && reviews.length
                ? reviews.slice(0, 6)
                : defaultReviews
        return incoming.map((review, index) => ({
            ...review,
            _key: String(review.name || "review") + "-" + index,
        }))
    }, [reviews])
    const speedPx = Math.max(10, Math.min(60, Number(speed || 22)))
    const [paused, setPaused] = useState<boolean>(false)
    const [isInView, setIsInView] = useState(true)
    const sectionRef = useRef<HTMLElement | null>(null)
    const [activeKey, setActiveKey] = useState<string | null>(null)
    const trackRefs = useRef<Record<number, HTMLDivElement | null>>({})
    const [laneDurations, setLaneDurations] = useState<Record<number, number>>(
        {}
    )
    useEffect(() => {
        const section = sectionRef.current
        if (isStaticRenderer || !section || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(Boolean(entry?.isIntersecting))
        }, { threshold: 0 })
        observer.observe(section)
        return () => observer.disconnect()
    }, [isStaticRenderer])
    useEffect(() => {
        if (isStaticRenderer) return
        const measure = () => {
            const next: Record<number, number> = {}
            Object.entries(trackRefs.current).forEach(([key, track]) => {
                if (!track) return
                const rect = track.getBoundingClientRect()
                const halfTrackDistance = rect.height / 2
                if (halfTrackDistance > 0)
                    next[Number(key)] = Math.max(
                        0.1,
                        halfTrackDistance / speedPx
                    )
            })
            setLaneDurations((current) => {
                const keys = Object.keys(next)
                if (
                    keys.length === Object.keys(current).length &&
                    keys.every(
                        (key) =>
                            Math.abs(
                                (current[Number(key)] || 0) - next[Number(key)]
                            ) < 0.01
                    )
                )
                    return current
                return next
            })
        }
        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null
        Object.values(trackRefs.current).forEach((track) => {
            if (track) observer?.observe(track)
        })
        const frame = requestAnimationFrame(measure)
        return () => {
            cancelAnimationFrame(frame)
            observer?.disconnect()
        }
    }, [speedPx, items, cardPadding, cardGap, reviewSize, contentSpacing, isStaticRenderer])
    const startPause = (cardKey: string) => {
        setActiveKey(cardKey)
        setPaused(true)
    }

    const clearPause = (cardKey: string) => {
        setActiveKey((current) => {
            if (current !== cardKey) return current
            setPaused(false)
            return null
        })
    }

    const css =
        ".forma-review-track{will-change:transform}.forma-review-view{height:840px}.forma-review-mobile{display:none}.forma-review-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}.forma-review-lane{height:100%;min-width:0;overflow:hidden;mask-image:linear-gradient(to bottom,transparent 0%,#000 14%,#000 86%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 14%,#000 86%,transparent 100%)}.forma-review-card{outline:none;flex:none}.forma-review-view.forma-review-horizontal{height:680px}.forma-review-horizontal .forma-review-lane{height:100%;width:100%;mask-image:linear-gradient(to right,transparent 0%,#000 12%,#000 88%,transparent 100%);-webkit-mask-image:linear-gradient(to right,transparent 0%,#000 12%,#000 88%,transparent 100%)}.forma-review-horizontal .forma-review-grid{display:block!important;height:100%}.forma-review-horizontal .forma-review-lane{width:100%;height:100%}.forma-review-horizontal .forma-review-track{flex-direction:row!important;flex-wrap:nowrap;width:max-content!important;height:100%;gap:12px;align-items:stretch}.forma-review-horizontal-stack{width:min(320px,82vw);height:100%;flex:0 0 min(320px,82vw);align-items:stretch;justify-content:flex-start}.forma-review-horizontal-stack .forma-review-card{width:100%;height:auto;flex:0 0 auto}.forma-review-horizontal-stack article{height:auto}.forma-review-card:focus-visible{outline:2px solid rgba(25,25,24,.35);outline-offset:2px}@keyframes forma-review-up{to{transform:translateY(-50%)}}@keyframes forma-review-down{from{transform:translateY(-50%)}to{transform:translateY(0)}}@keyframes forma-review-left{to{transform:translateX(-50%)}}@media(max-width:600px){.forma-review-view{height:620px}.forma-review-view.forma-review-horizontal{height:560px}.forma-review-horizontal .forma-review-mobile{display:block;height:100%}.forma-review-horizontal .forma-review-mobile .forma-review-lane{height:100%;width:100%}.forma-review-horizontal-stack{width:min(280px,82vw);flex-basis:min(280px,82vw)}.forma-review-grid{display:none}.forma-review-mobile{display:block;height:100%}.forma-review-title{font-size:32px!important;letter-spacing:-1.1px!important}}@media(min-width:601px) and (max-width:810px){.forma-review-view{height:840px}.forma-review-grid{gap:12px}.forma-review-title{font-size:36px!important}}"
    const rootStyle: CSSProperties = {
        width: "100%",
        height: "auto",
        boxSizing: "border-box",
        ...style,
    }
    const laneItems = (laneIndex: number): ReviewItem[] =>
        items.map((_, index) => items[(index + laneIndex) % items.length])
    const copiesForLane = (count: number) =>
        Math.max(2, Math.ceil(3.6 / Math.max(1, count)))
    const renderReviewCard = (
        review: ReviewItem,
        key: string,
        laneIndex: number
    ) => {
        const cardKey = laneIndex + "::" + review._key + "::" + key
        const active = activeKey === cardKey
        return (
            <div className="forma-review-card" key={key}>
                <ReviewCard
                    review={review}
                    cardKey={cardKey}
                    active={active}
                    headingColor={headingColor}
                    cardBackground={cardBackground}
                    cardText={cardText}
                    hoverBackground={hoverBackground}
                    hoverText={hoverText}
                    accentColor={accentColor}
                    quoteMarkColor={quoteMarkColor}
                    profileLayout={profileLayout}
                    profilePosition={profilePosition}
                    profileAlignment={profileAlignment}
                    profilePhotoSize={profilePhotoSize}
                    showQuoteMark={showQuoteMark}
                    quoteMark={quoteMark}
                    quoteMarkSize={quoteMarkSize}
                    imageMotion={imageMotion}
                    cardPadding={cardPadding}
                    contentSpacing={contentSpacing}
                    cardRadius={cardRadius}
                    showCardBorder={showCardBorder}
                    cardBorderColor={cardBorderColor}
                    reviewSize={reviewSize}
                    nameSize={nameSize}
                    designationSize={designationSize}
                    companySize={companySize}
                    ratingSize={ratingSize}
                    onEnter={startPause}
                    onLeave={clearPause}
                />
            </div>
        )
    }
    const makeLane = (laneIndex: number, mobile = false) => {
        const selected = mobile ? items : laneItems(laneIndex)
        const cycles = copiesForLane(selected.length)
        const run = Array.from({ length: cycles }, (_, cycle) =>
            selected.map((review, index) => ({
                review,
                key: laneIndex + "-" + cycle + "-" + index,
            }))
        ).flat()
        const cards = isStaticRenderer
            ? run.slice(0, selected.length)
            : [
                  ...run,
                  ...run.map((item, index) => ({
                      ...item,
                      key: laneIndex + "-clone-" + index,
                  })),
              ]
        const estimatedHalfDistance =
            run.length * (260 + cardPadding * 2 + cardGap)
        const duration =
            laneDurations[laneIndex] ||
            Math.max(0.1, estimatedHalfDistance / speedPx)
        const direction =
            (laneIndex % 2 === 0) === outerRowsDown
                ? "forma-review-down"
                : "forma-review-up"
        return (
            <div
                className="forma-review-lane"
                key={"lane-" + laneIndex}
                style={{ height: "100%", width: "100%" }}
            >
                <div
                    ref={(element) => {
                        trackRefs.current[laneIndex] = element
                    }}
                    className="forma-review-track"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: cardGap,
                        width: "100%",
                        height: "auto",
                        animationName: isStaticRenderer ? "none" : direction,
                        animationDuration: isStaticRenderer ? "0s" : duration + "s",
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationPlayState:
                            !isStaticRenderer && isInView && !paused
                                ? "running"
                                : "paused",
                    }}
                >
                    {cards.map(({ review, key }) =>
                        renderReviewCard(review, key, laneIndex)
                    )}
                </div>
            </div>
        )
    }

    return (
        <section ref={sectionRef} style={rootStyle} aria-label="Member reviews">
            <style>{css}</style>
            <div
                className="forma-review-inner"
                style={{
                    width: "100%",
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: 0,
                    boxSizing: "border-box",
                }}
            >
                <header
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: badgeHeadingSpacing,
                        marginBottom: headerSectionSpacing,
                        textAlign: "center",
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: headerBadgeSize * 0.75,
                            padding:
                                Math.round(headerBadgeSize * 0.62) +
                                "px " +
                                Math.round(headerBadgeSize * 1.25) +
                                "px",
                            borderRadius: 999,
                            background: "#F2F3F3",
                            color: "#626262",
                            fontSize: headerBadgeSize,
                            lineHeight: 1,
                            fontWeight: 600,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                width: Math.max(4, headerBadgeSize * 0.6),
                                height: Math.max(4, headerBadgeSize * 0.6),
                                borderRadius: "50%",
                                background: "#191918",
                            }}
                        />
                        {headerBadge}
                    </span>
                    <h2
                        className="forma-review-title"
                        style={{
                            margin: 0,
                            color: headingColor,
                            fontSize: headerHeadingSize,
                            lineHeight: 1.08,
                            letterSpacing: "-1.3px",
                            fontWeight: 600,
                        }}
                    >
                        {headerHeading}
                    </h2>
                </header>
                <div
                    className="forma-review-view"
                    style={{
                        position: "relative",
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 20,
                    }}
                >
                    <div
                        className="forma-review-grid"
                        style={{ width: "100%", height: "100%", gap: cardGap }}
                    >
                        {[0, 1, 2].map((laneIndex) => makeLane(laneIndex))}
                    </div>
                    <div className="forma-review-mobile">
                        {makeLane(3, true)}
                    </div>
                </div>
            </div>
        </section>
    )
}

ReviewsScroller.defaultProps = {
    reviews: defaultReviews,
    profile: {
        profileLayout: "horizontal",
        profilePosition: "left",
        profileAlignment: "left",
        profilePhotoSize: 36,
    },
    cardLayout: {
        padding: 24,
        spacing: 12,
        appearance: { radius: 27.3, showBorder: true, borderColor: "#E3E3E3" },
        cardGap: 12,
    },
    reveal: {
        imageMotion: "zoom-reveal",
        showQuoteMark: true,
        quoteMark: "close",
        quoteMarkSize: 22,
    },
    theme: {
        headingColor: "#191918",
        cardBackground: "#F4F5F5",
        cardText: "#191918",
        hoverBackground: "#191918",
        hoverText: "#FFFFFF",
        accentColor: "#191918",
        quoteMarkColor: "#191918",
    },
    typeSettings: {
        reviewSize: 13,
        nameSize: 12,
        designationSize: 10,
        companySize: 10,
        ratingSize: 12,
    },
    header: {
        badge: "TESTIMONIAL",
        heading: "What They’re Saying",
        badgeSize: 8,
        headingSize: 42,
        badgeHeadingSpacing: 10,
        sectionSpacing: 32,
    },
    scrollSpeed: 22,
    scrollDirection: "down",
}

addPropertyControls(ReviewsScroller, {
    header: {
        type: ControlType.Object,
        title: "Header",
        controls: {
            badge: {
                type: ControlType.String,
                title: "Capsule label",
                defaultValue: "TESTIMONIAL",
            },
            badgeSize: {
                type: ControlType.Number,
                title: "Capsule size",
                defaultValue: 8,
                min: 6,
                max: 20,
                step: 1,
                unit: "px",
            },
            heading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "What They’re Saying",
            },
            headingSize: {
                type: ControlType.Number,
                title: "Heading size",
                defaultValue: 42,
                min: 20,
                max: 72,
                step: 1,
                unit: "px",
            },
            badgeHeadingSpacing: {
                type: ControlType.Number,
                title: "Capsule to heading",
                defaultValue: 10,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
            sectionSpacing: {
                type: ControlType.Number,
                title: "Header to testimonials",
                defaultValue: 32,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            badge: "TESTIMONIAL",
            heading: "What They’re Saying",
            badgeSize: 8,
            headingSize: 42,
            badgeHeadingSpacing: 10,
            sectionSpacing: 32,
        },
    },
    reviews: {
        type: ControlType.Array,
        title: "Reviews",
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Review",
                    defaultValue: "",
                    displayTextArea: true,
                },
                showReviewText: {
                    type: ControlType.Boolean,
                    title: "Show review text",
                    defaultValue: true,
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Forma member",
                },
                role: {
                    type: ControlType.String,
                    title: "Designation",
                    defaultValue: "Product designer",
                },
                company: {
                    type: ControlType.String,
                    title: "Company / logo text",
                    defaultValue: "Studio North",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    defaultValue: 4.9,
                    min: 0,
                    max: 5,
                    step: 0.1,
                    displayStepper: true,
                },
                showRating: {
                    type: ControlType.Boolean,
                    title: "Show rating",
                    defaultValue: true,
                },
                photo: { type: ControlType.ResponsiveImage, title: "Portrait" },
                video: {
                    type: ControlType.File,
                    title: "Video testimonial",
                    allowedFileTypes: ["mp4", "webm"],
                },
                companyLogo: {
                    type: ControlType.ResponsiveImage,
                    title: "Company logo",
                },
                showCompanyInfo: {
                    type: ControlType.Boolean,
                    title: "Show company logo and name",
                    defaultValue: true,
                },
            },
        },
        defaultValue: defaultReviews,
        maxCount: 6,
    },
    profile: {
        type: ControlType.Object,
        title: "Profile",
        controls: {
            profileLayout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                defaultValue: "horizontal",
            },
            profilePosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
            },
            profileAlignment: {
                type: ControlType.Enum,
                title: "Text alignment",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
            },
            profilePhotoSize: {
                type: ControlType.Number,
                title: "Photo size",
                defaultValue: 36,
                min: 20,
                max: 100,
                step: 2,
                unit: "px",
            },
        },
        defaultValue: {
            profileLayout: "horizontal",
            profilePosition: "left",
            profileAlignment: "left",
            profilePhotoSize: 36,
        },
    },
    cardLayout: {
        type: ControlType.Object,
        title: "Card layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Card padding",
                defaultValue: 24,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Content spacing",
                defaultValue: 12,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
            },
            appearance: {
                type: ControlType.Object,
                title: "Card appearance",
                controls: {
                    radius: {
                        type: ControlType.Number,
                        title: "Corner radius",
                        defaultValue: 27.3,
                        min: 0,
                        max: 64,
                        step: 0.5,
                        unit: "px",
                    },
                    showBorder: {
                        type: ControlType.Boolean,
                        title: "Show card border",
                        defaultValue: true,
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border color",
                        defaultValue: "#E3E3E3",
                    },
                },
                defaultValue: {
                    radius: 27.3,
                    showBorder: true,
                    borderColor: "#E3E3E3",
                },
            },
            cardGap: {
                type: ControlType.Number,
                title: "Space between cards",
                defaultValue: 12,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            padding: 24,
            spacing: 12,
            appearance: {
                radius: 27.3,
                showBorder: true,
                borderColor: "#E3E3E3",
            },
            cardGap: 12,
        },
    },
    theme: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            headingColor: {
                type: ControlType.Color,
                title: "Heading",
                defaultValue: "#191918",
            },
            cardBackground: {
                type: ControlType.Color,
                title: "Card background",
                defaultValue: "#F4F5F5",
            },
            cardText: {
                type: ControlType.Color,
                title: "Card text",
                defaultValue: "#191918",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover background",
                defaultValue: "#191918",
            },
            hoverText: {
                type: ControlType.Color,
                title: "Hover text",
                defaultValue: "#FFFFFF",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Stars",
                defaultValue: "#191918",
            },
            quoteMarkColor: {
                type: ControlType.Color,
                title: "Quotation mark",
                defaultValue: "#191918",
            },
        },
        defaultValue: {
            headingColor: "#191918",
            cardBackground: "#F4F5F5",
            cardText: "#191918",
            hoverBackground: "#191918",
            hoverText: "#FFFFFF",
            accentColor: "#191918",
        },
    },
    reveal: {
        type: ControlType.Object,
        title: "Reveal & quote",
        controls: {
            imageMotion: {
                type: ControlType.Enum,
                title: "Portrait reveal",
                options: ["zoom-reveal", "fade", "slide", "zoom"],
                optionTitles: ["Zoom reveal", "Fade", "Slide", "Zoom"],
                defaultValue: "zoom-reveal",
            },
            showQuoteMark: {
                type: ControlType.Boolean,
                title: "Show quote mark",
                defaultValue: true,
            },
            quoteMark: {
                type: ControlType.Enum,
                title: "Quote mark",
                options: ["open", "close"],
                optionTitles: ["Open quotation", "Close quotation"],
                defaultValue: "close",
            },
            quoteMarkSize: {
                type: ControlType.Number,
                title: "Quote mark size",
                defaultValue: 22,
                min: 12,
                max: 64,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            imageMotion: "zoom-reveal",
            showQuoteMark: true,
            quoteMark: "close",
            quoteMarkSize: 22,
        },
    },
    typeSettings: {
        type: ControlType.Object,
        title: "Text sizes",
        controls: {
            reviewSize: {
                type: ControlType.Number,
                title: "Review text",
                defaultValue: 13,
                min: 10,
                max: 28,
                step: 1,
                unit: "px",
            },
            nameSize: {
                type: ControlType.Number,
                title: "Profile name",
                defaultValue: 12,
                min: 9,
                max: 24,
                step: 1,
                unit: "px",
            },
            designationSize: {
                type: ControlType.Number,
                title: "Designation",
                defaultValue: 10,
                min: 8,
                max: 20,
                step: 1,
                unit: "px",
            },
            companySize: {
                type: ControlType.Number,
                title: "Company name",
                defaultValue: 10,
                min: 8,
                max: 20,
                step: 1,
                unit: "px",
            },
            ratingSize: {
                type: ControlType.Number,
                title: "Rating",
                defaultValue: 12,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            reviewSize: 13,
            nameSize: 12,
            designationSize: 10,
            companySize: 10,
            ratingSize: 12,
        },
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll speed",
        defaultValue: 22,
        min: 10,
        max: 60,
        step: 1,
        unit: "px/s",
        displayStepper: true,
    },
    scrollDirection: {
        type: ControlType.Enum,
        title: "Scroll direction",
        options: ["down", "up"],
        optionTitles: ["Down", "Up"],
        defaultValue: "down",
    },
})

export default ReviewsScroller
