// Build an advanced Testimonial Carousel with Popup Profiles in Framer:
// CAROUSEL LAYOUT: 3 cards visible simultaneously (center large, side cards scaled 0.85 + blurred slightly), auto-advance every 4s, drag horizontally with rubber-band ends, dot indicators with active pill.
// TESTIMONIAL CARDS: decorative quote mark, quote text 18px line-height 1.8 with 3-line clamp + read more expand, author section with avatar + name + company + role, star rating fills one-by-one on enter-view with bounce, company logo grayscale with hover-to-color.
// AVATAR POPUP PROFILE: click avatar opens smart-positioned popup with blur backdrop; popup animates scale 0.8→1 + opacity 0→1 from avatar; click outside or X closes.
// NAVIGATION BUTTONS: prev/next arrows appear on hover, magnetic hover movement.
// STYLE: soft shadows, rounded 20px, warm cream background tones.

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

import { AnimatePresence, motion, useInView, useMotionValue, useSpring, animate } from "framer-motion"
import { createPortal } from "react-dom"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type SocialLink = {
    label: string
    url: string
}

type Testimonial = {
    quote: string
    name: string
    company: string
    role: string
    rating: number
    avatar?: ResponsiveImage
    logo?: ResponsiveImage
    bio: string
    linkedin?: SocialLink
    twitter?: SocialLink
}

type Props = {
    testimonials: Testimonial[]

    autoAdvance: boolean
    intervalSeconds: number

    loop: boolean
    imageMode: "avatar" | "logo"
    endOfListText: string

    cardBgMode: "color" | "image" | "video"
    cardBgImage?: ResponsiveImage
    cardBgVideo?: string
    cardBgOverlay: string

    throwDistance: number
    throwVelocity: number
    stackDepth: number
    stackOffsetY: number
    stackScaleStep: number
    stackRotateDeg: number

    cardRadius: number
    sideScale: number
    sideBlur: number

    background: string
    cardBackground: string
    brandColor: string
    textColor: string
    mutedTextColor: string
    dotColor: string
    dotActiveColor: string
    arrowColor: string
    arrowBackground: string
    arrowBorderColor: string
    arrowSize: number
    arrowOffset: number
    arrowBackdropBlur: number

    shadow: string

    quoteFont: any
    metaFont: any

    showArrows: boolean

    flipEnabled: boolean
    flipDegrees: number
    flipPerspective: number

    style?: React.CSSProperties
}

const images = {
    image1: {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    avatar: {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Avatar",
    },
    logo: {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Company logo",
    },
    photo2: {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Avatar 2",
    },
    logo2: {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Company logo 2",
    },
    photo3: {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Avatar 3",
    },
    logo3: {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Company logo 3",
    },
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function wrapIndex(i: number, len: number) {
    if (len <= 0) return 0
    return ((i % len) + len) % len
}

function useStableId(prefix: string) {
    const id = React.useId()
    return `${prefix}-${id.replace(/[:]/g, "")}`
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill={filled ? color : "none"}
                stroke={filled ? color : "rgba(0,0,0,0.25)"}
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function LinkedInIcon({ color }: { color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.11 1 2.48 1C3.85 1 4.98 2.12 4.98 3.5ZM.5 23.5h4V7.98h-4V23.5ZM8.5 7.98h3.83v2.12h.05c.53-1.01 1.83-2.08 3.77-2.08 4.03 0 4.77 2.65 4.77 6.1v9.38h-4v-8.31c0-1.98-.04-4.52-2.75-4.52-2.75 0-3.17 2.15-3.17 4.38v8.45h-4V7.98Z"
                fill={color}
            />
        </svg>
    )
}

function TwitterIcon({ color }: { color: string }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
                d="M18.244 2.25h3.308l-7.227 8.26 8.503 11.24h-6.656l-5.213-6.817-5.963 6.817H1.686l7.73-8.84L1.25 2.25h6.824l4.713 6.231 5.457-6.231Zm-1.161 17.52h1.833L7.08 4.126H5.114l11.969 15.644Z"
                fill={color}
            />
        </svg>
    )
}

function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        React.startTransition(() => setMounted(true))
    }, [])
    if (!mounted || typeof document === "undefined") return null
    return createPortal(children, document.body)
}

type AnchorRect = { left: number; top: number; width: number; height: number }

type PopupState = {
    open: boolean
    index: number
    anchorRect: AnchorRect | null
}

/**
 * Advanced Testimonial Carousel
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AdvancedTestimonialCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        testimonials,
        autoAdvance,
        intervalSeconds,
        loop,
        imageMode,
        endOfListText,
        cardBgMode,
        cardBgImage,
        cardBgVideo,
        cardBgOverlay,
        throwDistance,
        throwVelocity,
        stackDepth,
        stackOffsetY,
        stackScaleStep,
        stackRotateDeg,
        cardRadius,
        sideScale,
        sideBlur,
        background,
        cardBackground,
        brandColor,
        textColor,
        mutedTextColor,
        dotColor,
        dotActiveColor,
        arrowColor,
        arrowBackground,
        arrowBorderColor,
        arrowSize,
        arrowOffset,
        arrowBackdropBlur,
        shadow,
        quoteFont,
        metaFont,
        showArrows,
        flipEnabled,
        flipDegrees,
        flipPerspective,
        style,
    } = {
        ...props,
        testimonials: props.testimonials ?? [],
        autoAdvance: props.autoAdvance ?? true,
        intervalSeconds: props.intervalSeconds ?? 4,
        loop: props.loop ?? true,
        imageMode: props.imageMode ?? "avatar",
        endOfListText: props.endOfListText ?? "End of list",
        cardBgMode: props.cardBgMode ?? "color",
        cardBgImage: props.cardBgImage ?? images.image1,
        cardBgVideo: props.cardBgVideo ?? "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        cardBgOverlay: props.cardBgOverlay ?? "rgba(255,255,255,0.86)",
        throwDistance: props.throwDistance ?? 120,
        throwVelocity: props.throwVelocity ?? 700,
        stackDepth: props.stackDepth ?? 3,
        stackOffsetY: props.stackOffsetY ?? 14,
        stackScaleStep: props.stackScaleStep ?? 0.045,
        stackRotateDeg: props.stackRotateDeg ?? 4,
        cardRadius: props.cardRadius ?? 20,
        sideScale: props.sideScale ?? 0.85,
        sideBlur: props.sideBlur ?? 1.6,
        background: props.background ?? "#FFF7ED",
        cardBackground: props.cardBackground ?? "#FFFFFF",
        brandColor: props.brandColor ?? "#000000",
        textColor: props.textColor ?? "#000000",
        mutedTextColor: props.mutedTextColor ?? "rgba(0,0,0,0.6)",
        dotColor: props.dotColor ?? "rgba(0,0,0,0.18)",
        dotActiveColor: props.dotActiveColor ?? "rgba(0,0,0,0.65)",
        arrowColor: props.arrowColor ?? "rgba(0,0,0,0.65)",
        arrowBackground: props.arrowBackground ?? "rgba(255,255,255,0.68)",
        arrowBorderColor: props.arrowBorderColor ?? "rgba(0,0,0,0.08)",
        arrowSize: props.arrowSize ?? 44,
        arrowOffset: props.arrowOffset ?? 58,
        arrowBackdropBlur: props.arrowBackdropBlur ?? 10,
        shadow: props.shadow ?? "0 12px 30px rgba(17,17,17,0.10)",
        showArrows: props.showArrows ?? true,
        flipEnabled: props.flipEnabled ?? true,
        flipDegrees: props.flipDegrees ?? 92,
        flipPerspective: props.flipPerspective ?? 1200,
    }

    const safeTestimonials = React.useMemo<Testimonial[]>(() => {
        const t = (testimonials ?? []).filter(Boolean)
        if (t.length > 0) return t
        return [
            {
                quote: "Framer let us ship a polished site in days, not weeks. The team loved how fast we could iterate with real components.",
                name: "Alex Morgan",
                company: "Northwind",
                role: "Product Lead",
                rating: 5,
                avatar: images.avatar,
                logo: images.logo,
                bio: "Alex leads product at Northwind, focusing on design systems and delightful user experiences.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
            {
                quote: "The carousel interactions feel premium, and the popup profiles are a great touch for building trust. Highly recommended.",
                name: "Priya Shah",
                company: "Aurora Labs",
                role: "Design Director",
                rating: 5,
                avatar: images.photo2,
                logo: images.logo2,
                bio: "Priya runs design at Aurora Labs, mentoring teams on motion, systems, and brand.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
            {
                quote: "We saw a measurable lift in conversions after adding testimonials. The read-more expand keeps the layout clean while still giving depth.",
                name: "Sam Rivera",
                company: "Cedar",
                role: "Growth",
                rating: 4,
                avatar: images.photo3,
                logo: images.logo3,
                bio: "Sam works on growth and analytics at Cedar, turning qualitative feedback into action.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
        ]
    }, [testimonials])

    const len = safeTestimonials.length
    const canLoop = loop && len > 1

    const rootId = useStableId("adv-testimonial")

    const [index, setIndex] = React.useState(0)
    const [navDir, setNavDir] = React.useState<1 | -1>(1)
    const [hovered, setHovered] = React.useState(false)
    const [expandedMap, setExpandedMap] = React.useState<Record<number, boolean>>({})
    const [popup, setPopup] = React.useState<PopupState>({ open: false, index: 0, anchorRect: null })
    const [ended, setEnded] = React.useState(false)

    const viewportRef = React.useRef<HTMLDivElement | null>(null)

    const [cardWidth, setCardWidth] = React.useState(420)
    const [viewportWidth, setViewportWidth] = React.useState(900)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = viewportRef.current
        if (!el) return
        const ro = new ResizeObserver(() => {
            const w = el.getBoundingClientRect().width
            const cw = clamp(w * 0.64, 320, 560)
            React.startTransition(() => {
                setViewportWidth(w)
                setCardWidth(cw)
            })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const goto = React.useCallback(
        (next: number) => {
            if (len <= 1) return
            const target = canLoop ? wrapIndex(next, len) : clamp(next, 0, len - 1)
            const rawDelta = target - index
            const loopDelta = canLoop
                ? rawDelta > len / 2
                    ? rawDelta - len
                    : rawDelta < -len / 2
                      ? rawDelta + len
                      : rawDelta
                : rawDelta
            if (loopDelta !== 0) React.startTransition(() => setNavDir(loopDelta > 0 ? 1 : -1))
            React.startTransition(() => setEnded(false))
            React.startTransition(() => setIndex(target))
        },
        [len, canLoop, index]
    )

    const next = React.useCallback(() => goto(index + 1), [goto, index])
    const prev = React.useCallback(() => goto(index - 1), [goto, index])

    React.useEffect(() => {
        if (isStatic) return
        if (!autoAdvance) return
        if (hovered) return
        if (len <= 1) return
        if (!canLoop && index >= len - 1) return
        if (typeof window === "undefined") return
        const ms = Math.max(1, intervalSeconds) * 1000
        const t = window.setInterval(() => {
            if (!canLoop && index >= len - 1) return
            next()
        }, ms)
        return () => window.clearInterval(t)
    }, [isStatic, autoAdvance, hovered, len, intervalSeconds, next, canLoop, index])

    const handleThrow = React.useCallback(
        (dir: 1 | -1) => {
            if (len <= 1) return
            if (!canLoop) {
                const atStart = index <= 0
                const atEnd = index >= len - 1
                if ((dir === -1 && atStart) || (dir === 1 && atEnd)) {
                    React.startTransition(() => setEnded(true))
                    return
                }
            }
            React.startTransition(() => setNavDir(dir))
            React.startTransition(() => setEnded(false))
            goto(index + dir)
        },
        [len, canLoop, index, goto]
    )

    const toggleExpanded = React.useCallback((i: number) => {
        React.startTransition(() => {
            setExpandedMap((prev) => ({ ...prev, [i]: !prev[i] }))
        })
    }, [])

    const openPopupFor = React.useCallback((i: number, anchorEl: HTMLElement | null) => {
        if (typeof window === "undefined" || !anchorEl) return
        const r = anchorEl.getBoundingClientRect()
        const anchorRect: AnchorRect = { left: r.left, top: r.top, width: r.width, height: r.height }
        React.startTransition(() => setPopup({ open: true, index: i, anchorRect }))
    }, [])

    const closePopup = React.useCallback(() => {
        React.startTransition(() => setPopup((p) => ({ ...p, open: false })))
    }, [])

    React.useEffect(() => {
        if (!popup.open) return
        if (typeof window === "undefined") return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePopup()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [popup.open, closePopup])

    const isMobileArrows = viewportWidth <= 520

    return (
        <section
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: cardRadius,
                background,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={() => React.startTransition(() => setHovered(true))}
            onMouseLeave={() => React.startTransition(() => setHovered(false))}
            aria-label="Testimonials"
        >
            <div
                ref={viewportRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    padding: 28,
                    boxSizing: "border-box",
                    touchAction: "pan-y",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: cardWidth,
                        height: "100%",
                        maxHeight: 520,
                        minHeight: 420,
                        perspective: flipPerspective,
                    }}
                    aria-roledescription="carousel"
                    aria-describedby={rootId}
                >
                    <div id={rootId} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
                        Drag horizontally to navigate testimonials.
                    </div>

                    <AnimatePresence initial={false}>
                        {Array.from({ length: clamp(stackDepth, 1, 5) }).map((_, stackPos) => {
                            const dataIndex = index + stackPos
                            if (!canLoop && dataIndex > len - 1) return null
                            const i = canLoop ? wrapIndex(dataIndex, len) : dataIndex
                            const t = safeTestimonials[i]
                            if (!t) return null

                            const isTop = stackPos === 0
                            return (
                                <SwipeStackCard
                                    key={isTop ? `top-${index}` : `under-${index}-${stackPos}-${i}`}
                                    item={t}
                                    i={i}
                                    isTop={isTop}
                                    stackPos={stackPos}
                                    width={cardWidth}
                                    radius={cardRadius}
                                    brandColor={brandColor}
                                    textColor={textColor}
                                    mutedTextColor={mutedTextColor}
                                    cardBackground={cardBackground}
                                    shadow={shadow}
                                    quoteFont={quoteFont}
                                    metaFont={metaFont}
                                    expanded={!!expandedMap[i]}
                                    onToggleExpanded={() => toggleExpanded(i)}
                                    onAvatarClick={(el) => openPopupFor(i, el)}
                                    disableStarAnim={isStatic || RenderTarget.current() === RenderTarget.canvas}
                                    flipEnabled={flipEnabled}
                                    flipDegrees={flipDegrees}
                                    navDir={navDir}
                                    imageMode={imageMode}
                                    cardBgMode={cardBgMode}
                                    cardBgImage={cardBgImage}
                                    cardBgVideo={cardBgVideo}
                                    cardBgOverlay={cardBgOverlay}
                                    stackOffsetY={stackOffsetY}
                                    stackScaleStep={stackScaleStep}
                                    stackRotateDeg={stackRotateDeg}
                                    sideScale={sideScale}
                                    sideBlur={sideBlur}
                                    throwDistance={throwDistance}
                                    throwVelocity={throwVelocity}
                                    onThrow={handleThrow}
                                    isStatic={isStatic}
                                />
                            )
                        })}
                    </AnimatePresence>

                    {ended && !canLoop && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", stiffness: 420, damping: 38 }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: cardRadius,
                                display: "grid",
                                placeItems: "center",
                                background: "rgba(255,255,255,0.55)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                border: "1px solid rgba(0,0,0,0.06)",
                            }}
                            role="status"
                            aria-label="End of list"
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center", padding: 20 }}>
                                <div style={{ ...metaFont, color: mutedTextColor, fontSize: 13, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                                    {endOfListText}
                                </div>
                                <button
                                    onClick={() => goto(0)}
                                    style={{
                                        appearance: "none",
                                        border: "1px solid rgba(0,0,0,0.10)",
                                        background: "rgba(255,255,255,0.9)",
                                        borderRadius: 999,
                                        padding: "10px 14px",
                                        cursor: "pointer",
                                        color: textColor,
                                        ...metaFont,
                                        fontSize: metaFont?.fontSize ?? "14px",
                                    }}
                                >
                                    Start over
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {showArrows && len > 1 && (
                        <>
                            <ArrowButton
                                side="left"
                                visible={isMobileArrows ? true : hovered}
                                mobileBottomCenter={isMobileArrows}
                                mobileIndex={0}
                                color={arrowColor}
                                background={arrowBackground}
                                borderColor={arrowBorderColor}
                                size={arrowSize}
                                offset={arrowOffset}
                                backdropBlur={arrowBackdropBlur}
                                onClick={prev}
                                disabled={!canLoop && index <= 0}
                            />
                            <ArrowButton
                                side="right"
                                visible={isMobileArrows ? true : hovered}
                                mobileBottomCenter={isMobileArrows}
                                mobileIndex={1}
                                color={arrowColor}
                                background={arrowBackground}
                                borderColor={arrowBorderColor}
                                size={arrowSize}
                                offset={arrowOffset}
                                backdropBlur={arrowBackdropBlur}
                                onClick={next}
                                disabled={!canLoop && index >= len - 1}
                            />
                        </>
                    )}
                </div>

                {!isMobileArrows && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 18,
                            display: "flex",
                            justifyContent: "center",
                            gap: 10,
                            pointerEvents: "auto",
                        }}
                        role="tablist"
                        aria-label="Testimonial pages"
                    >
                        {safeTestimonials.map((_, i) => {
                            const isActive = i === index
                            return (
                                <button
                                    key={`dot-${i}`}
                                    onClick={() => goto(i)}
                                    style={{
                                        appearance: "none",
                                        border: "none",
                                        background: "transparent",
                                        padding: 0,
                                        cursor: "pointer",
                                    }}
                                    aria-label={`Go to testimonial ${i + 1}`}
                                    aria-selected={isActive}
                                    role="tab"
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{ width: isActive ? 28 : 8, opacity: isActive ? 1 : 0.7 }}
                                        transition={{ type: "spring", stiffness: 520, damping: 40 }}
                                        style={{
                                            height: 8,
                                            borderRadius: 999,
                                            background: isActive ? dotActiveColor : dotColor,
                                        }}
                                    />
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <Portal>
                <AnimatePresence>
                    {popup.open && popup.anchorRect && (
                        <ProfilePopup
                            item={safeTestimonials[wrapIndex(popup.index, len)]}
                            anchorRect={popup.anchorRect}
                            radius={cardRadius}
                            brandColor={brandColor}
                            textColor={textColor}
                            mutedTextColor={mutedTextColor}
                            cardBackground={cardBackground}
                            shadow={shadow}
                            onClose={closePopup}
                        />
                    )}
                </AnimatePresence>
            </Portal>
        </section>
    )
}

function ArrowButton({
    side,
    visible,
    mobileBottomCenter,
    mobileIndex,
    color,
    background,
    borderColor,
    size,
    offset,
    backdropBlur,
    onClick,
    disabled,
}: {
    side: "left" | "right"
    visible: boolean
    mobileBottomCenter?: boolean
    mobileIndex?: 0 | 1
    color: string
    background: string
    borderColor: string
    size: number
    offset: number
    backdropBlur: number
    onClick: () => void
    disabled?: boolean
}) {
    const ref = React.useRef<HTMLButtonElement | null>(null)
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const sx = useSpring(mx, { stiffness: 700, damping: 45 })
    const sy = useSpring(my, { stiffness: 700, damping: 45 })
    const dir = side === "left" ? -1 : 1

    const onMove = React.useCallback(
        (e: React.MouseEvent) => {
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
            const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
            mx.set(clamp(dx, -1, 1) * 7)
            my.set(clamp(dy, -1, 1) * 7)
        },
        [mx, my]
    )

    const onLeave = React.useCallback(() => {
        mx.set(0)
        my.set(0)
    }, [mx, my])

    return (
        <motion.button
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={disabled ? undefined : onClick}
            whileHover={disabled ? undefined : { scale: 1.1, x: dir * 2 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            initial={false}
            animate={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
            transition={{ duration: 0.18 }}
            style={{
                position: "absolute",
                ...(mobileBottomCenter
                    ? {
                          left: mobileIndex === 0 ? `calc(50% - ${size / 2 + 8}px)` : `calc(50% + ${size / 2 + 8}px)`,
                          bottom: 18,
                      }
                    : {
                          top: "50%",
                          ...(side === "left" ? { left: -offset } : { right: -offset }),
                      }),
                translateY: mobileBottomCenter ? 0 : "-50%",
                width: size,
                height: size,
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background,
                boxShadow: "0 12px 26px rgba(0,0,0,0.10)",
                backdropFilter: `blur(${backdropBlur}px)`,
                WebkitBackdropFilter: `blur(${backdropBlur}px)`,
                cursor: disabled ? "not-allowed" : "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
                outline: "none",
                color,
                x: sx,
                y: sy,
            }}
            aria-label={side === "left" ? "Previous" : "Next"}
            disabled={disabled}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                    d={side === "left" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
                    stroke={color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.button>
    )
}

function LogoMark({ logo }: { logo: ResponsiveImage }) {
    const [hover, setHover] = React.useState(false)

    return (
        <div
            onMouseEnter={() => React.startTransition(() => setHover(true))}
            onMouseLeave={() => React.startTransition(() => setHover(false))}
            style={{
                width: 56,
                height: 24,
                borderRadius: 8,
                overflow: "hidden",
                flex: "0 0 auto",
                border: "1px solid rgba(0,0,0,0.06)",
                background: "rgba(0,0,0,0.02)",
            }}
            aria-label={logo.alt ?? "Company logo"}
            role="img"
        >
            <img
                src={logo.src}
                alt={logo.alt ?? ""}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: hover ? "grayscale(0)" : "grayscale(1)",
                    transition: "filter 200ms ease",
                }}
            />
        </div>
    )
}

function TestimonialCard({
    item,
    i,
    navDir,
    width,
    radius,
    brandColor,
    textColor,
    mutedTextColor,
    cardBackground,
    shadow,
    quoteFont,
    metaFont,
    expanded,
    onToggleExpanded,
    onAvatarClick,
    disableStarAnim,
    flipEnabled,
    flipDegrees,
    imageMode,
    cardBgMode,
    cardBgImage,
    cardBgVideo,
    cardBgOverlay,
}: {
    item: Testimonial
    i: number
    navDir: 1 | -1
    width: number
    radius: number
    brandColor: string
    textColor: string
    mutedTextColor: string
    cardBackground: string
    shadow: string
    quoteFont: any
    metaFont: any
    expanded: boolean
    onToggleExpanded: () => void
    onAvatarClick: (el: HTMLElement | null) => void
    disableStarAnim: boolean
    flipEnabled: boolean
    flipDegrees: number
    imageMode: "avatar" | "logo"
    cardBgMode: "color" | "image" | "video"
    cardBgImage: ResponsiveImage
    cardBgVideo: string
    cardBgOverlay: string
}) {
    const isActive = true

    const prevActiveRef = React.useRef(false)
    const [flipTick, setFlipTick] = React.useState(0)
    React.useEffect(() => {
        const prev = prevActiveRef.current
        if (!prev && isActive && flipEnabled) {
            React.startTransition(() => setFlipTick((t) => t + 1))
        }
        prevActiveRef.current = isActive
    }, [isActive, flipEnabled])

    const cardRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(cardRef, { amount: 0.7, margin: "-10% 0px -10% 0px" })

    const [starsFilled, setStarsFilled] = React.useState(0)

    React.useEffect(() => {
        const target = clamp(Math.round(item.rating ?? 0), 0, 5)

        if (disableStarAnim) {
            React.startTransition(() => setStarsFilled(target))
            return
        }

        if (!inView) return
        if (typeof window === "undefined") return

        let alive = true
        React.startTransition(() => setStarsFilled(0))

        const timers: number[] = []
        for (let n = 1; n <= target; n++) {
            const t = window.setTimeout(() => {
                if (!alive) return
                React.startTransition(() => setStarsFilled(n))
            }, n * 80)
            timers.push(t)
        }

        return () => {
            alive = false
            timers.forEach((t) => window.clearTimeout(t))
        }
    }, [disableStarAnim, inView, item.rating])

    const avatar = item.avatar ?? images.avatar
    const logo = item.logo ?? images.logo
    const personImage = imageMode === "logo" ? logo : avatar

    const cardHeightCollapsed = 420
    const cardHeightExpanded = 476

    return (
        <motion.article
            ref={cardRef}
            initial={false}
            animate={{
                height: expanded && isActive ? cardHeightExpanded : cardHeightCollapsed,
            }}
            transition={{ type: "spring", stiffness: 520, damping: 52, mass: 0.9 }}
            style={{
                position: "absolute",
                inset: 0,
                width,
                borderRadius: radius,
                background: cardBgMode === "color" ? cardBackground : "transparent",
                boxShadow: shadow,
                border: "1px solid rgba(0,0,0,0.05)",
                padding: 22,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                overflow: "hidden",
                willChange: "transform, filter",
                transformStyle: "preserve-3d",
            }}
            aria-label={`Testimonial by ${item.name}`}
        >
            {cardBgMode === "image" && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${cardBgImage?.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "saturate(0.98)",
                    }}
                />
            )}
            {cardBgMode === "video" && (
                <video
                    aria-hidden="true"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={cardBgVideo}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}
            {cardBgMode !== "color" && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: cardBgOverlay,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                    }}
                />
            )}
            <motion.div
                key={flipTick}
                initial={
                    flipEnabled
                        ? {
                              rotateY: navDir * flipDegrees,
                              rotateX: -8,
                              opacity: 0,
                              scale: 0.96,
                              filter: "blur(2px)",
                          }
                        : { rotateY: 0, rotateX: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
                }
                animate={{ rotateY: 0, rotateX: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 560, damping: 40, mass: 0.85 }}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    transformStyle: "preserve-3d",
                    transformOrigin: navDir === 1 ? "0% 50%" : "100% 50%",
                    willChange: "transform, opacity, filter",
                    position: "relative",
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 16,
                        top: 10,
                        fontSize: 54,
                        lineHeight: 1,
                        color: brandColor,
                        opacity: 0.12,
                        fontFamily: "ui-serif, Georgia, Times, serif",
                        userSelect: "none",
                    }}
                >
                    “
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }} aria-label={`Rating ${item.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, idx) => {
                            const filled = idx + 1 <= starsFilled
                            return (
                                <motion.div
                                    key={idx}
                                    initial={false}
                                    animate={filled ? { scale: [1, 1.24, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.22, times: [0, 0.55, 1] }}
                                    style={{ transformOrigin: "50% 50%" }}
                                >
                                    <StarIcon filled={filled} color={brandColor} />
                                </motion.div>
                            )
                        })}
                    </div>

                    <LogoMark logo={logo} />
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div
                        style={{
                            ...quoteFont,
                            color: textColor,
                            fontSize: quoteFont?.fontSize ?? "18px",
                            lineHeight: quoteFont?.lineHeight ?? "1.8",
                            letterSpacing: quoteFont?.letterSpacing,
                            fontWeight: quoteFont?.fontWeight,
                            fontStyle: quoteFont?.fontStyle,
                            fontFamily: quoteFont?.fontFamily,
                        }}
                    >
                        <motion.div
                            initial={false}
                            animate={{ height: expanded ? 200 : 108 }}
                            transition={{ type: "spring", stiffness: 520, damping: 50 }}
                            style={{ overflow: "hidden", position: "relative", paddingTop: 10 }}
                        >
                            <div
                                style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: expanded ? "unset" : 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {item.quote}
                            </div>

                            <AnimatePresence>
                                {expanded && (
                                    <motion.div
                                        key="fade"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            height: 34,
                                            background: "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.92))",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <button
                            onClick={onToggleExpanded}
                            style={{
                                marginTop: 10,
                                appearance: "none",
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                cursor: "pointer",
                                color: brandColor,
                                ...metaFont,
                                fontSize: metaFont?.fontSize ?? "13px",
                                textDecoration: "none",
                            }}
                            aria-expanded={expanded}
                        >
                            {expanded ? "Show less" : "Read more"}
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 14,
                        paddingTop: 6,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <button
                            onClick={(e) => onAvatarClick(e.currentTarget)}
                            style={{
                                appearance: "none",
                                border: imageMode === "logo" ? "1px solid rgba(0,0,0,0.06)" : "none",
                                background: imageMode === "logo" ? "rgba(0,0,0,0.02)" : "transparent",
                                padding: 0,
                                cursor: "pointer",
                                borderRadius: imageMode === "logo" ? 14 : 999,
                                width: 44,
                                height: 44,
                                overflow: "hidden",
                                flex: "0 0 auto",
                                boxShadow: "0 6px 14px rgba(0,0,0,0.10)",
                            }}
                            aria-label={`Open profile for ${item.name}`}
                        >
                            <img
                                src={personImage.src}
                                alt={personImage.alt ?? `${item.name} image`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: imageMode === "logo" ? "contain" : "cover",
                                    display: "block",
                                    padding: imageMode === "logo" ? 6 : 0,
                                    boxSizing: "border-box",
                                }}
                            />
                        </button>

                        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div
                                style={{
                                    ...metaFont,
                                    color: textColor,
                                    fontSize: metaFont?.fontSize ?? "14px",
                                    fontWeight: 650,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {item.name}
                            </div>
                            <div
                                style={{
                                    ...metaFont,
                                    color: mutedTextColor,
                                    fontSize: "13px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {item.role} · {item.company}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            ...metaFont,
                            color: mutedTextColor,
                            fontSize: "12px",
                            letterSpacing: "0.02em",
                            textTransform: "uppercase",
                        }}
                    >
                        Verified
                    </div>
                </div>
            </motion.div>
        </motion.article>
    )
}

function SwipeStackCard({
    item,
    i,
    isTop,
    stackPos,
    width,
    radius,
    brandColor,
    textColor,
    mutedTextColor,
    cardBackground,
    shadow,
    quoteFont,
    metaFont,
    expanded,
    onToggleExpanded,
    onAvatarClick,
    disableStarAnim,
    flipEnabled,
    flipDegrees,
    navDir,
    imageMode,
    cardBgMode,
    cardBgImage,
    cardBgVideo,
    cardBgOverlay,
    stackOffsetY,
    stackScaleStep,
    stackRotateDeg,
    sideScale,
    sideBlur,
    throwDistance,
    throwVelocity,
    onThrow,
    isStatic,
}: {
    item: Testimonial
    i: number
    isTop: boolean
    stackPos: number
    width: number
    radius: number
    brandColor: string
    textColor: string
    mutedTextColor: string
    cardBackground: string
    shadow: string
    quoteFont: any
    metaFont: any
    expanded: boolean
    onToggleExpanded: () => void
    onAvatarClick: (el: HTMLElement | null) => void
    disableStarAnim: boolean
    flipEnabled: boolean
    flipDegrees: number
    navDir: 1 | -1
    imageMode: "avatar" | "logo"
    cardBgMode: "color" | "image" | "video"
    cardBgImage: ResponsiveImage
    cardBgVideo: string
    cardBgOverlay: string
    stackOffsetY: number
    stackScaleStep: number
    stackRotateDeg: number
    sideScale: number
    sideBlur: number
    throwDistance: number
    throwVelocity: number
    onThrow: (dir: 1 | -1) => void
    isStatic: boolean
}) {
    const mvx = useMotionValue(0)
    const mvy = useMotionValue(0)
    const rot = useMotionValue(0)

    const [showHint, setShowHint] = React.useState(true)
    const throwingRef = React.useRef(false)

    const baseY = stackPos * stackOffsetY
    const baseScale = stackPos === 0 ? 1 : clamp(sideScale - (stackPos - 1) * stackScaleStep, 0.7, 1)
    const baseRotate = stackPos * -stackRotateDeg

    const onDragStart = React.useCallback(() => {
        if (showHint) React.startTransition(() => setShowHint(false))
    }, [showHint])

    const onDragEnd = React.useCallback(
        (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
            if (throwingRef.current) return
            const offX = info.offset.x
            const vX = info.velocity.x
            const dir: 1 | -1 = offX < 0 ? 1 : -1
            const shouldThrow = Math.abs(offX) > throwDistance || Math.abs(vX) > throwVelocity

            if (!shouldThrow) {
                animate(mvx, 0, { type: "spring", stiffness: 520, damping: 42, mass: 0.9 })
                animate(rot, 0, { type: "spring", stiffness: 520, damping: 42, mass: 0.9 })
                animate(mvy, 0, { type: "spring", stiffness: 520, damping: 42, mass: 0.9 })
                return
            }

            throwingRef.current = true
            const outX = dir * (width * 1.15)
            const outRot = dir * 18

            const a1 = animate(mvx, outX, { duration: 0.22, ease: [0.22, 1, 0.36, 1] })
            animate(rot, outRot, { duration: 0.22, ease: [0.22, 1, 0.36, 1] })
            animate(mvy, -10, { duration: 0.18, ease: [0.22, 1, 0.36, 1] })

            a1.finished
                .then(() => {
                    onThrow(dir)
                })
                .finally(() => {
                    mvx.set(0)
                    mvy.set(0)
                    rot.set(0)
                    throwingRef.current = false
                })
        },
        [onThrow, throwDistance, throwVelocity, mvx, rot, mvy, width]
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 10 - stackPos,
                y: isTop ? mvy : baseY,
                x: isTop ? mvx : 0,
                rotateZ: isTop ? rot : baseRotate,
                scale: baseScale,
                transformOrigin: "50% 80%",
                willChange: "transform",
                filter: stackPos === 0 ? "none" : `blur(${sideBlur}px)`,
                opacity: stackPos === 0 ? 1 : 0.96,
                cursor: isTop && !isStatic ? "grab" : undefined,
            }}
            initial={false}
            animate={
                isTop
                    ? { y: baseY, scale: baseScale }
                    : { y: baseY, scale: baseScale, rotateZ: baseRotate, x: 0 }
            }
            transition={{ type: "spring", stiffness: 520, damping: 48, mass: 0.95 }}
            drag={isTop && !isStatic ? "x" : false}
            dragElastic={0.35}
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={isTop && !isStatic ? onDragStart : undefined}
            onDragEnd={isTop && !isStatic ? onDragEnd : undefined}
            onDrag={
                isTop && !isStatic
                    ? (_e, info) => {
                          const x = info.offset.x
                          rot.set(clamp(x / 28, -1, 1) * 12)
                      }
                    : undefined
            }
            whileTap={isTop && !isStatic ? { cursor: "grabbing", scale: 0.99 } : undefined}
        >
            {isTop && showHint && !isStatic && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 18,
                        translateX: "-50%",
                        zIndex: 50,
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.44)",
                        color: "white",
                        fontSize: 12,
                        letterSpacing: "0.02em",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    Drag to swipe
                </motion.div>
            )}

            <TestimonialCard
                item={item}
                i={i}
                navDir={navDir}
                width={width}
                radius={radius}
                brandColor={brandColor}
                textColor={textColor}
                mutedTextColor={mutedTextColor}
                cardBackground={cardBackground}
                shadow={shadow}
                quoteFont={quoteFont}
                metaFont={metaFont}
                expanded={expanded}
                onToggleExpanded={onToggleExpanded}
                onAvatarClick={onAvatarClick}
                disableStarAnim={disableStarAnim}
                flipEnabled={flipEnabled && isTop}
                flipDegrees={flipDegrees}
                imageMode={imageMode}
                cardBgMode={cardBgMode}
                cardBgImage={cardBgImage}
                cardBgVideo={cardBgVideo}
                cardBgOverlay={cardBgOverlay}
            />
        </motion.div>
    )
}

function ProfilePopup({
    item,
    anchorRect,
    onClose,
    radius,
    brandColor,
    textColor,
    mutedTextColor,
    cardBackground,
    shadow,
}: {
    item: Testimonial
    anchorRect: AnchorRect
    onClose: () => void
    radius: number
    brandColor: string
    textColor: string
    mutedTextColor: string
    cardBackground: string
    shadow: string
}) {
    const [pos, setPos] = React.useState(() => ({ left: 0, top: 0, dx: 0, dy: 0, place: "below" as "below" | "above" }))

    React.useLayoutEffect(() => {
        if (typeof window === "undefined") return
        const vw = window.innerWidth
        const vh = window.innerHeight

        const popupW = 352
        const popupH = 226

        const anchorCenterX = anchorRect.left + anchorRect.width / 2
        const anchorBottom = anchorRect.top + anchorRect.height
        const anchorTop = anchorRect.top

        const spaceBelow = vh - anchorBottom
        const place: "below" | "above" = spaceBelow >= popupH + 16 ? "below" : "above"

        const rawLeft = anchorCenterX - popupW / 2
        const left = clamp(rawLeft, 14, vw - popupW - 14)
        const top =
            place === "below"
                ? clamp(anchorBottom + 10, 14, vh - popupH - 14)
                : clamp(anchorTop - popupH - 10, 14, vh - popupH - 14)

        const popupCenterX = left + popupW / 2
        const popupCenterY = top + popupH / 2
        const dx = anchorCenterX - popupCenterX
        const dy = (place === "below" ? anchorBottom : anchorTop) - popupCenterY

        React.startTransition(() => setPos({ left, top, dx, dy, place }))
    }, [anchorRect.left, anchorRect.top, anchorRect.width, anchorRect.height])

    const avatar = item.avatar ?? images.avatar

    const ln = item.linkedin?.url
    const tw = item.twitter?.url

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.18)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
            }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            aria-modal="true"
            role="dialog"
            aria-label={`Profile for ${item.name}`}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8, x: pos.dx, y: pos.dy }}
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, x: pos.dx * 0.25, y: pos.dy * 0.25 }}
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
                style={{
                    position: "fixed",
                    left: pos.left,
                    top: pos.top,
                    width: 352,
                    height: 226,
                    borderRadius: Math.max(14, radius - 4),
                    background: "rgba(255,255,255,0.78)",
                    boxShadow: shadow,
                    border: "1px solid rgba(0,0,0,0.10)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 16,
                                overflow: "hidden",
                                background: cardBackground,
                                flex: "0 0 auto",
                                border: "1px solid rgba(0,0,0,0.06)",
                            }}
                        >
                            <img
                                src={avatar.src}
                                alt={avatar.alt ?? `${item.name} photo`}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                        </div>

                        <div style={{ minWidth: 0 }}>
                            <div
                                style={{
                                    color: textColor,
                                    fontSize: 15,
                                    fontWeight: 750,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {item.name}
                            </div>
                            <div
                                style={{
                                    color: mutedTextColor,
                                    fontSize: 13,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {item.role} · {item.company}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            appearance: "none",
                            border: "none",
                            background: "rgba(0,0,0,0.05)",
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                        }}
                        aria-label="Close profile"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M18 6L6 18" stroke="rgba(0,0,0,0.55)" strokeWidth="2.2" strokeLinecap="round" />
                            <path d="M6 6l12 12" stroke="rgba(0,0,0,0.55)" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div style={{ padding: "0 14px 12px 14px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <div
                        style={{
                            color: mutedTextColor,
                            fontSize: 13,
                            lineHeight: 1.45,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {item.bio}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                        <SocialButton
                            url={ln}
                            label={item.linkedin?.label ?? "LinkedIn"}
                            color={brandColor}
                            icon={<LinkedInIcon color={brandColor} />}
                        />
                        <SocialButton
                            url={tw}
                            label={item.twitter?.label ?? "Twitter"}
                            color={brandColor}
                            icon={<TwitterIcon color={brandColor} />}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function SocialButton({
    url,
    label,
    icon,
    color,
}: {
    url?: string
    label: string
    icon: React.ReactNode
    color: string
}) {
    const disabled = !url
    return (
        <a
            href={disabled ? undefined : url}
            target={disabled ? undefined : "_blank"}
            rel={disabled ? undefined : "noreferrer"}
            aria-label={label}
            style={{
                pointerEvents: disabled ? "none" : "auto",
                opacity: disabled ? 0.4 : 1,
                width: 38,
                height: 38,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                color,
                textDecoration: "none",
            }}
        >
            {icon}
        </a>
    )
}

addPropertyControls(AdvancedTestimonialCarousel, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 12,
        defaultValue: [
            {
                quote: "Framer let us ship a polished site in days, not weeks. The team loved how fast we could iterate with real components.",
                name: "Alex Morgan",
                company: "Northwind",
                role: "Product Lead",
                rating: 5,
                bio: "Alex leads product at Northwind, focusing on design systems and delightful user experiences.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
            {
                quote: "The carousel interactions feel premium, and the popup profiles are a great touch for building trust. Highly recommended.",
                name: "Priya Shah",
                company: "Aurora Labs",
                role: "Design Director",
                rating: 5,
                bio: "Priya runs design at Aurora Labs, mentoring teams on motion, systems, and brand.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
            {
                quote: "We saw a measurable lift in conversions after adding testimonials. The read-more expand keeps the layout clean while still giving depth.",
                name: "Sam Rivera",
                company: "Cedar",
                role: "Growth",
                rating: 4,
                bio: "Sam works on growth and analytics at Cedar, turning qualitative feedback into action.",
                linkedin: { label: "LinkedIn", url: "https://linkedin.com" },
                twitter: { label: "Twitter", url: "https://x.com" },
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote", defaultValue: "A wonderful experience.", displayTextArea: true },
                name: { type: ControlType.String, title: "Name", defaultValue: "Name" },
                company: { type: ControlType.String, title: "Company", defaultValue: "Company" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Role" },
                rating: { type: ControlType.Number, title: "Rating", defaultValue: 5, min: 0, max: 5, step: 1 },
                avatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
                logo: { type: ControlType.ResponsiveImage, title: "Logo" },
                bio: { type: ControlType.String, title: "Bio", defaultValue: "Bio excerpt…", displayTextArea: true },
                linkedin: {
                    type: ControlType.Object,
                    title: "LinkedIn",
                    controls: {
                        label: { type: ControlType.String, title: "Label", defaultValue: "LinkedIn" },
                        url: { type: ControlType.Link, title: "URL", defaultValue: "https://linkedin.com" },
                    },
                    defaultValue: { label: "LinkedIn", url: "https://linkedin.com" },
                },
                twitter: {
                    type: ControlType.Object,
                    title: "Twitter",
                    controls: {
                        label: { type: ControlType.String, title: "Label", defaultValue: "Twitter" },
                        url: { type: ControlType.Link, title: "URL", defaultValue: "https://x.com" },
                    },
                    defaultValue: { label: "Twitter", url: "https://x.com" },
                },
            },
        },
    },

    autoAdvance: { type: ControlType.Boolean, title: "Auto", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    intervalSeconds: { type: ControlType.Number, title: "Interval", defaultValue: 4, min: 2, max: 10, step: 0.5, unit: "s" },

    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    endOfListText: { type: ControlType.String, title: "End Text", defaultValue: "End of list", hidden: ({ loop }) => loop },
    imageMode: {
        type: ControlType.Enum,
        title: "Image",
        options: ["avatar", "logo"],
        optionTitles: ["Avatar (Round)", "Logo (Fit)"],
        defaultValue: "avatar",
    },

    cardBgMode: {
        type: ControlType.Enum,
        title: "Card BG",
        options: ["color", "image", "video"],
        optionTitles: ["Color", "Image", "Video"],
        defaultValue: "color",
    },
    cardBgImage: {
        type: ControlType.ResponsiveImage,
        title: "BG Image",
        hidden: ({ cardBgMode }) => cardBgMode !== "image",
    },
    cardBgVideo: {
        type: ControlType.File,
        title: "BG Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ cardBgMode }) => cardBgMode !== "video",
    },
    cardBgOverlay: {
        type: ControlType.Color,
        title: "BG Overlay",
        defaultValue: "rgba(255,255,255,0.86)",
        hidden: ({ cardBgMode }) => cardBgMode === "color",
    },

    throwDistance: { type: ControlType.Number, title: "Throw Dist", defaultValue: 120, min: 40, max: 240, step: 5, unit: "px" },
    throwVelocity: { type: ControlType.Number, title: "Throw Vel", defaultValue: 700, min: 200, max: 1600, step: 50, unit: "px/s" },
    stackDepth: { type: ControlType.Number, title: "Stack", defaultValue: 3, min: 1, max: 5, step: 1 },
    stackOffsetY: { type: ControlType.Number, title: "Stack Y", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
    stackScaleStep: { type: ControlType.Number, title: "Scale Step", defaultValue: 0.045, min: 0, max: 0.12, step: 0.005 },
    stackRotateDeg: { type: ControlType.Number, title: "Rotate", defaultValue: 4, min: 0, max: 12, step: 0.5, unit: "deg" },

    cardRadius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 8, max: 40, step: 1, unit: "px" },
    sideScale: { type: ControlType.Number, title: "Side Scale", defaultValue: 0.85, min: 0.7, max: 0.95, step: 0.01 },
    sideBlur: { type: ControlType.Number, title: "Side Blur", defaultValue: 1.6, min: 0, max: 6, step: 0.1, unit: "px" },

    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFF7ED" },
    cardBackground: { type: ControlType.Color, title: "Card BG", defaultValue: "#FFFFFF" },
    brandColor: { type: ControlType.Color, title: "Brand", defaultValue: "#000000" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#000000" },
    mutedTextColor: { type: ControlType.Color, title: "Muted", defaultValue: "#CCCCCC" },

    dotColor: { type: ControlType.Color, title: "Dot", defaultValue: "#CCCCCC" },
    dotActiveColor: { type: ControlType.Color, title: "Dot Active", defaultValue: "#000000" },

    showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    arrowColor: { type: ControlType.Color, title: "Arrow", defaultValue: "#000000", hidden: ({ showArrows }) => !showArrows },
    arrowBackground: { type: ControlType.Color, title: "Arrow BG", defaultValue: "#FFFFFF", hidden: ({ showArrows }) => !showArrows },
    arrowBorderColor: { type: ControlType.Color, title: "Arrow Border", defaultValue: "#EEEEEE", hidden: ({ showArrows }) => !showArrows },
    arrowSize: { type: ControlType.Number, title: "Arrow Size", defaultValue: 44, min: 32, max: 72, step: 1, unit: "px", hidden: ({ showArrows }) => !showArrows },
    arrowOffset: { type: ControlType.Number, title: "Arrow Offset", defaultValue: 58, min: 0, max: 120, step: 1, unit: "px", hidden: ({ showArrows }) => !showArrows },
    arrowBackdropBlur: { type: ControlType.Number, title: "Arrow Blur", defaultValue: 10, min: 0, max: 24, step: 1, unit: "px", hidden: ({ showArrows }) => !showArrows },

    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 12px 30px rgba(17,17,17,0.10)" },

    flipEnabled: { type: ControlType.Boolean, title: "Flip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    flipDegrees: { type: ControlType.Number, title: "Flip Deg", defaultValue: 92, min: 30, max: 160, step: 1, unit: "deg", hidden: ({ flipEnabled }) => !flipEnabled },
    flipPerspective: { type: ControlType.Number, title: "Perspective", defaultValue: 1200, min: 400, max: 2200, step: 10, unit: "px", hidden: ({ flipEnabled }) => !flipEnabled },

    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.8em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
})
