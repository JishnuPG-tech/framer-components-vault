import * as React from "react"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── Types ──────────────────────────────────────────────────────────

// Framer Motion needs a 4-tuple here, not a plain number[].
const EASE_OUT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

type CardTheme = "light" | "dark" | "accent"

interface TestimonialItem {
    quote?: string
    name?: string
    role?: string
    /** Uploaded asset (ControlType.ResponsiveImage) or a plain URL string. */
    avatar?: any
    /** Plain-text URL. Survives Framer serialisation when `avatar` cannot. */
    avatarUrl?: string
    theme?: CardTheme
    column?: string
    grow?: number
}

// ─── Default avatars ────────────────────────────────────────────────

/**
 * Framer only writes a control's value into the document if that control can
 * serialise it, and ControlType.ResponsiveImage refuses a literal default. So
 * every seed row carries its artwork twice — once in the ResponsiveImage shape
 * for the Code File preview, once as plain text in `avatarUrl`, which is the
 * copy that survives being dropped on the canvas.
 *
 * The srcSet also keeps a 64px avatar from downloading a 687px-wide photo, and
 * the square crops match the avatar box so no fetched pixel is thrown away.
 */
function avatarAsset(photoId: string, alt: string) {
    const base = `https://images.unsplash.com/${photoId}?q=80&auto=format&fit=crop`
    const at = (size: number) => `${base}&w=${size}&h=${size}`
    return {
        avatar: {
            src: at(128),
            srcSet: `${at(128)} 128w, ${at(192)} 192w, ${at(256)} 256w`,
            alt,
        },
        // The text twin. ControlType.String always serialises, so this is what
        // actually reaches a freshly placed instance.
        avatarUrl: at(128),
    }
}

// ─── Default props ──────────────────────────────────────────────────

// The canonical seed data: shared verbatim by defaultProps (used by the Code
// File preview) and by the Array control's defaultValue (used when the block
// is placed on the canvas), so the two can never drift apart.
const DEFAULT_TESTIMONIALS = [
    {
        quote: '"Hypersphere has been a game-changer for us. Their service is top-notch and their team is incredibly responsive."',
        name: "Guillermo Rauch",
        role: "CEO of Enigma",
        ...avatarAsset("photo-1599566150163-29194dcaad36", "Guillermo Rauch"),
        theme: "light",
        column: "1",
        grow: 7,
    },
    {
        quote: '"We\'ve seen incredible results with Hypersphere. Their expertise, dedication."',
        name: "Rika Shinoda",
        role: "CEO of Kintsugi",
        ...avatarAsset("photo-1512485694743-9c9538b4e6e0", "Rika Shinoda"),
        theme: "accent",
        column: "1",
        grow: 3,
    },
    {
        quote: '"Their team is highly professional, and their innovative solutions have truly transformed the way we operate."',
        name: "Reacher",
        role: "CEO of OdeaoLabs",
        ...avatarAsset("photo-1566753323558-f4e0952af115", "Reacher"),
        theme: "dark",
        column: "2",
        grow: 1,
    },
    {
        quote: '"We\'re extremely satisfied with Hypersphere. Their expertise and dedication have exceeded our expectations."',
        name: "John",
        role: "CEO of Labsbo",
        ...avatarAsset("photo-1615109398623-88346a601842", "John"),
        theme: "dark",
        column: "2",
        grow: 1,
    },
    {
        quote: '"Their customer support is absolutely exceptional. They are always available, incredibly helpful."',
        name: "Steven Sunny",
        role: "CEO of boxefi",
        ...avatarAsset("photo-1740102074295-c13fae3e4f8a", "Steven Sunny"),
        theme: "dark",
        column: "2",
        grow: 1,
    },
    {
        quote: '"Hypersphere has been a key partner in our growth journey."',
        name: "Guillermo Rauch",
        role: "CEO of OdeaoLabs",
        ...avatarAsset("photo-1563237023-b1e970526dcb", "Guillermo Rauch"),
        theme: "accent",
        column: "3",
        grow: 3,
    },
    {
        quote: '"Hypersphere has been a true game-changer for us. Their exceptional service, combined with their deep expertise and commitment to excellence, has made a significant impact on our business."',
        name: "Paul Brauch",
        role: "CTO of Spectrum",
        ...avatarAsset("photo-1590086782957-93c06ef21604", "Paul Brauch"),
        theme: "light",
        column: "3",
        grow: 7,
    },
]

// ─── Avatar resolution ──────────────────────────────────────────────

/**
 * Resolves an avatar through three levels of fallback, in priority order:
 * the uploaded asset, then the plain-text URL, then the built-in artwork.
 */
function resolveAvatar(
    item: TestimonialItem,
    index: number
): { src: string; srcSet?: string; alt: string } {
    const name = item?.name || ""
    const avatar: any = item?.avatar

    // 1. An upload (or a raw string someone pasted into the image slot) wins.
    if (typeof avatar === "string" && avatar.trim()) {
        return { src: avatar.trim(), alt: name }
    }
    if (avatar && typeof avatar === "object" && avatar.src) {
        return {
            src: avatar.src,
            srcSet: avatar.srcSet,
            alt: avatar.alt || name,
        }
    }

    // 2. The text twin, which is what survives a fresh canvas instance.
    const url = typeof item?.avatarUrl === "string" ? item.avatarUrl.trim() : ""
    if (url) return { src: url, alt: name }

    // 3. Last resort so a placed instance is never blank — but only while the
    //    row still is that seed person, so a renamed testimonial can never
    //    inherit someone else's face.
    const seed = DEFAULT_TESTIMONIALS[index]
    if (seed && (!name || name === seed.name)) {
        return { src: seed.avatar.src, srcSet: seed.avatar.srcSet, alt: name }
    }

    return { src: "", alt: name }
}

/**
 * Row mode needs softer weights than column mode. The source says so itself:
 * a card is `lg:flex-[7]` stacked but `flex-[6]` lying down, `lg:flex-[3]`
 * becomes `flex-[4]`. Width is scarcer than height — a 7:3 split that reads
 * well as a tall/short pair leaves the narrow card too cramped for its name
 * and avatar. Pulling each weight halfway to the group mean reproduces those
 * exact numbers and generalises to whatever weights the author picks.
 */
function softenedRowWeights(entries: { item: TestimonialItem }[]): number[] {
    const raw = entries.map(({ item }) =>
        typeof item?.grow === "number" && item.grow > 0 ? item.grow : 1
    )
    if (raw.length === 0) return raw
    const mean = raw.reduce((sum, w) => sum + w, 0) / raw.length
    return raw.map((w) => (w + mean) / 2)
}

/** "Guillermo Rauch" → "GR". Used for the no-artwork placeholder. */
function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return ""
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Hooks ──────────────────────────────────────────────────────────

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : useEffect

/**
 * Framer components have no CSS media queries, so breakpoints are driven by
 * the measured container width instead of the viewport. Returns `null` until
 * the first measurement so SSR/canvas renders the desktop bento.
 */
function useContainerWidth(ref: React.RefObject<HTMLElement>) {
    const [width, setWidth] = useState<number | null>(null)

    useIsomorphicLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        // Mount measurement is urgent — it decides the layout before paint.
        setWidth(el.getBoundingClientRect().width)

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            // Border box, to match the mount measurement above. contentRect
            // would subtract the padding — and since the padding itself
            // depends on the resulting mode, that measurement feeds back on
            // itself and shifts every breakpoint by the padding.
            const entry = entries[0]
            const next =
                entry?.borderBoxSize?.[0]?.inlineSize ??
                el.getBoundingClientRect().width
            if (typeof next !== "number") return
            startTransition(() => {
                setWidth((prev) =>
                    prev !== null && Math.abs(prev - next) < 1 ? prev : next
                )
            })
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref])

    return width
}

/**
 * Scroll reveal trigger. Framer's own viewport detection breaks inside
 * scrollable containers, so we observe the section directly.
 */
function useInView(
    ref: React.RefObject<HTMLElement>,
    enabled: boolean,
    once: boolean,
    threshold: number,
    rootMargin: string
) {
    const [inView, setInView] = useState(false)

    useEffect(() => {
        if (!enabled) return
        const el = ref.current
        if (!el) return

        if (typeof IntersectionObserver === "undefined") {
            startTransition(() => setInView(true))
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                if (entry.isIntersecting) {
                    startTransition(() => setInView(true))
                    if (once) observer.disconnect()
                } else if (!once) {
                    startTransition(() => setInView(false))
                }
            },
            { threshold, rootMargin }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, enabled, once, threshold, rootMargin])

    return inView
}

function usePrefersReducedMotion(disabled: boolean) {
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (disabled) return
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(query.matches))
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [disabled])

    return reduced
}

// ─── Sub-component: one testimonial card ────────────────────────────

interface CardProps {
    item: TestimonialItem
    index: number
    flexStyle: React.CSSProperties
    animated: boolean
    variants: any
    initial: string | false
    animate: string
    themeStyle: React.CSSProperties
    showPattern: boolean
    patternStyle: React.CSSProperties
    radius: number
    padding: number
    quoteFont: any
    nameFont: any
    roleFont: any
    roleOpacity: number
    avatarSize: number
    avatarRadius: number
    showAvatar: boolean
}

const TestimonialCard = React.memo(function TestimonialCard({
    item,
    index,
    flexStyle,
    animated,
    variants,
    initial,
    animate,
    themeStyle,
    showPattern,
    patternStyle,
    radius,
    padding,
    quoteFont,
    nameFont,
    roleFont,
    roleOpacity,
    avatarSize,
    avatarRadius,
    showAvatar,
}: CardProps) {
    const art = resolveAvatar(item, index)
    const initials = initialsOf(item.name || "")
    const hasArt = Boolean(art.src)
    const hasMeta = Boolean(
        item.name || item.role || (showAvatar && (hasArt || initials))
    )

    // Static renderers (canvas, export, thumbnail) get a plain div: the cards
    // are already at their finished state, so there is nothing to animate and
    // no reason to mount a motion component per card.
    const Wrapper: any = animated ? motion.div : "div"
    const motionProps = animated
        ? { custom: index, variants, initial, animate }
        : {}

    return (
        <Wrapper
            {...motionProps}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                overflow: "hidden",
                borderRadius: radius,
                padding,
                minWidth: 0,
                ...flexStyle,
                ...themeStyle,
            }}
        >
            {showPattern ? <div aria-hidden style={patternStyle} /> : null}

            <div style={{ position: "relative", zIndex: 1, marginTop: "auto" }}>
                {item.quote ? (
                    <p style={{ margin: 0, ...quoteFont }}>{item.quote}</p>
                ) : null}

                {hasMeta ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: 16,
                            paddingTop: 20,
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            {item.name ? (
                                <div style={{ ...nameFont }}>{item.name}</div>
                            ) : null}
                            {item.role ? (
                                <div
                                    style={{
                                        opacity: roleOpacity,
                                        ...roleFont,
                                    }}
                                >
                                    {item.role}
                                </div>
                            ) : null}
                        </div>

                        {showAvatar && hasArt ? (
                            <img
                                src={art.src}
                                srcSet={art.srcSet}
                                sizes={`${avatarSize}px`}
                                alt={art.alt}
                                loading="lazy"
                                decoding="async"
                                width={avatarSize}
                                height={avatarSize}
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarRadius,
                                    objectFit: "cover",
                                    flexShrink: 0,
                                    display: "block",
                                }}
                            />
                        ) : null}

                        {/* A labelled placeholder reads as deliberate, where a
                            missing image would just leave a hole in the row.
                            Neutral grey so it sits on any of the three themes. */}
                        {showAvatar && !hasArt && initials ? (
                            <span
                                aria-hidden="true"
                                style={{
                                    width: avatarSize,
                                    height: avatarSize,
                                    borderRadius: avatarRadius,
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(128,128,128,0.18)",
                                    boxShadow:
                                        "inset 0 0 0 1px rgba(128,128,128,0.3)",
                                    fontSize: Math.round(avatarSize * 0.32),
                                    fontWeight: 600,
                                    letterSpacing: "0.02em",
                                    opacity: 0.75,
                                }}
                            >
                                {initials}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </Wrapper>
    )
})

// ─── Main component ─────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 860
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TestimonialBento(props) {
    const {
        // Content
        title,
        subtitle,
        testimonials = [],
        // Layout
        maxWidth,
        sectionPadding,
        headerGap,
        gridGap,
        desktopBreakpoint,
        tabletBreakpoint,
        // Cards
        cardRadius,
        cardPadding,
        lightBackground,
        lightText,
        lightBorder,
        darkBackground,
        darkText,
        darkBorder,
        accentBackground,
        accentText,
        accentBorder,
        showGridPattern,
        gridPatternColor,
        gridPatternSize,
        // Avatar
        showAvatar,
        avatarSize,
        avatarRadius,
        // Type
        titleFont,
        subtitleFont,
        quoteFont,
        nameFont,
        roleFont,
        titleColor,
        subtitleColor,
        roleOpacity,
        // Animation
        animate: animationEnabled,
        stagger,
        duration,
        offsetY,
        blurAmount,
        replay,
        triggerThreshold,
        // Section
        background,
        showBottomRule,
        bottomRuleWidth,
        bottomRuleThickness,
        bottomRuleOffset,
        bottomRuleColor,
        showBottomRuleCaps,
        bottomRuleCapSize,
        style,
    } = props

    // True on the Framer canvas, during export and while rendering thumbnails.
    // Every animation and every observer subscription is gated on it, so a
    // static pass produces the finished layout and nothing else.
    const isStatic = useIsStaticRenderer()

    const sectionRef = useRef<HTMLElement>(null)
    const width = useContainerWidth(sectionRef)
    const reducedMotion = usePrefersReducedMotion(isStatic)

    const shouldAnimate =
        Boolean(animationEnabled) && !isStatic && !reducedMotion

    const inView = useInView(
        sectionRef,
        shouldAnimate,
        !replay,
        triggerThreshold,
        "0px 0px -10% 0px"
    )

    // Derived during render — no effect, no extra pass.
    // "columns" — the desktop bento: the three groups sit side by side.
    // "rows"    — the same three groups, each turned on its side into a row.
    //             This keeps the author's grouping instead of reshuffling the
    //             cards into arbitrary halves.
    // "stack"   — one column, list order.
    const mode: "columns" | "rows" | "stack" =
        width === null || width >= desktopBreakpoint
            ? "columns"
            : width >= tabletBreakpoint
              ? "rows"
              : "stack"

    // Reveal order is always the list order, so cards land in reading order
    // whatever group they end up in.
    const groups = useMemo(() => {
        const list: TestimonialItem[] = Array.isArray(testimonials)
            ? testimonials
            : []
        const entries = list.map((item, order) => ({ item, order }))

        if (mode === "stack") return [entries]

        const buckets: { item: TestimonialItem; order: number }[][] = [
            [],
            [],
            [],
        ]
        for (const entry of entries) {
            const parsed = parseInt(entry.item?.column ?? "1", 10)
            const index = Number.isFinite(parsed)
                ? Math.min(3, Math.max(1, parsed)) - 1
                : 0
            buckets[index].push(entry)
        }
        // An unused group would otherwise leave a dead gap in the layout.
        return buckets.filter((bucket) => bucket.length > 0)
    }, [testimonials, mode])

    const variants = useMemo(
        () => ({
            hidden: {
                opacity: 0,
                y: offsetY,
                filter: `blur(${blurAmount}px)`,
            },
            visible: (i: number) => ({
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: reducedMotion
                    ? { duration: 0 }
                    : {
                          delay: i * stagger,
                          duration,
                          ease: EASE_OUT,
                      },
            }),
        }),
        [offsetY, blurAmount, stagger, duration, reducedMotion]
    )

    const initialState: string | false = shouldAnimate ? "hidden" : false
    const animateState = !shouldAnimate || inView ? "visible" : "hidden"

    const themeStyles = useMemo(
        () => ({
            light: {
                background: lightBackground,
                color: lightText,
                border: `1px solid ${lightBorder}`,
            },
            dark: {
                background: darkBackground,
                color: darkText,
                border: `1px solid ${darkBorder}`,
            },
            accent: {
                background: accentBackground,
                color: accentText,
                border: `1px solid ${accentBorder}`,
            },
        }),
        [
            lightBackground,
            lightText,
            lightBorder,
            darkBackground,
            darkText,
            darkBorder,
            accentBackground,
            accentText,
            accentBorder,
        ]
    )

    const patternStyle = useMemo<React.CSSProperties>(() => {
        const mask =
            "radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 110%)"
        return {
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, ${gridPatternColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridPatternColor} 1px, transparent 1px)`,
            backgroundSize: `${gridPatternSize}px ${Math.round(gridPatternSize * 1.12)}px`,
            maskImage: mask,
            WebkitMaskImage: mask,
            pointerEvents: "none",
        }
    }, [gridPatternColor, gridPatternSize])

    const renderCard = useCallback(
        (
            { item, order }: { item: TestimonialItem; order: number },
            rowWeight?: number
        ) => {
            const theme: CardTheme = (item?.theme as CardTheme) || "light"
            const grow = item?.grow ?? 0

            // Column mode spends `grow` on leftover height, so cards keep their
            // content height as a floor. Row mode spends the softened weight on
            // width, from a zero basis, so a long quote can never push the row
            // into overflow.
            const flexStyle: React.CSSProperties =
                mode === "columns"
                    ? { flexGrow: grow, flexShrink: 0, flexBasis: "auto" }
                    : mode === "rows"
                      ? {
                            flexGrow: rowWeight ?? 1,
                            flexShrink: 1,
                            flexBasis: 0,
                        }
                      : { flexGrow: 0, flexShrink: 0, flexBasis: "auto" }

            return (
                <TestimonialCard
                    key={order}
                    item={item}
                    index={order}
                    flexStyle={flexStyle}
                    animated={shouldAnimate}
                    variants={variants}
                    initial={initialState}
                    animate={animateState}
                    themeStyle={themeStyles[theme] || themeStyles.light}
                    showPattern={Boolean(showGridPattern) && theme === "light"}
                    patternStyle={patternStyle}
                    radius={cardRadius}
                    padding={cardPadding}
                    quoteFont={quoteFont}
                    nameFont={nameFont}
                    roleFont={roleFont}
                    roleOpacity={roleOpacity}
                    avatarSize={avatarSize}
                    avatarRadius={avatarRadius}
                    showAvatar={Boolean(showAvatar)}
                />
            )
        },
        [
            mode,
            shouldAnimate,
            variants,
            initialState,
            animateState,
            themeStyles,
            showGridPattern,
            patternStyle,
            cardRadius,
            cardPadding,
            quoteFont,
            nameFont,
            roleFont,
            roleOpacity,
            avatarSize,
            avatarRadius,
            showAvatar,
        ]
    )

    const headerVariants = variants
    const isNarrow = mode === "stack"
    const Heading: any = shouldAnimate ? motion.h2 : "h2"
    const Sub: any = shouldAnimate ? motion.p : "p"
    const headingMotion = (num: number) =>
        shouldAnimate
            ? {
                  custom: num,
                  variants: headerVariants,
                  initial: initialState,
                  animate: animateState,
              }
            : {}

    return (
        <section
            ref={sectionRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                background,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box",
                padding: `${sectionPadding}px ${isNarrow ? 16 : 24}px`,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            {title || subtitle ? (
                <header
                    style={{
                        width: "100%",
                        maxWidth: 720,
                        textAlign: "center",
                        marginBottom: headerGap,
                    }}
                >
                    {title ? (
                        <Heading
                            {...headingMotion(0)}
                            style={{
                                margin: 0,
                                color: titleColor,
                                ...titleFont,
                            }}
                        >
                            {title}
                        </Heading>
                    ) : null}
                    {subtitle ? (
                        <Sub
                            {...headingMotion(1)}
                            style={{
                                margin: "12px 0 0",
                                color: subtitleColor,
                                ...subtitleFont,
                            }}
                        >
                            {subtitle}
                        </Sub>
                    ) : null}
                </header>
            ) : null}

            {/* Bento grid */}
            <div
                style={{
                    display: "flex",
                    flexDirection: mode === "columns" ? "row" : "column",
                    alignItems: "stretch",
                    gap: gridGap,
                    width: "100%",
                    maxWidth,
                    boxSizing: "border-box",
                }}
            >
                {groups.map((items, groupIndex) => {
                    const weights =
                        mode === "rows" ? softenedRowWeights(items) : null
                    return (
                        <div
                            key={groupIndex}
                            style={{
                                display: "flex",
                                flexDirection:
                                    mode === "rows" ? "row" : "column",
                                alignItems: "stretch",
                                gap: gridGap,
                                minWidth: 0,
                                ...(mode === "columns"
                                    ? { flex: "1 1 0%" }
                                    : { width: "100%" }),
                            }}
                        >
                            {items.map((entry, i) =>
                                renderCard(entry, weights?.[i])
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Decorative baseline — off unless explicitly switched on. */}
            {showBottomRule ? (
                <div
                    aria-hidden
                    style={{
                        position: "relative",
                        // Percentage of the section, capped at the same share
                        // of Max Width so it tracks the grid above it.
                        width: `${bottomRuleWidth}%`,
                        maxWidth: (maxWidth * bottomRuleWidth) / 100,
                        height: 0,
                        marginTop: bottomRuleOffset,
                        borderBottom: `${bottomRuleThickness}px solid ${bottomRuleColor}`,
                    }}
                >
                    {showBottomRuleCaps
                        ? ["left", "right"].map((side) => (
                              <span
                                  key={side}
                                  style={{
                                      position: "absolute",
                                      // Centred on the rule, whatever its
                                      // thickness, and straddling its end.
                                      top:
                                          (bottomRuleThickness -
                                              bottomRuleCapSize) /
                                          2,
                                      [side]: -bottomRuleCapSize / 2,
                                      width: bottomRuleCapSize,
                                      height: bottomRuleCapSize,
                                      boxSizing: "border-box",
                                      background,
                                      border: `1px solid ${bottomRuleColor}`,
                                  }}
                              />
                          ))
                        : null}
                </div>
            ) : null}
        </section>
    )
}

TestimonialBento.displayName = "Testimonial Bento"

TestimonialBento.defaultProps = {
    title: "Trusted by startups and the world's largest companies",
    subtitle: "Let's hear how Hypersphere clients feel about our service.",
    maxWidth: 1200,
    sectionPadding: 56,
    headerGap: 40,
    gridGap: 8,
    desktopBreakpoint: 1024,
    tabletBreakpoint: 640,
    cardRadius: 12,
    cardPadding: 20,
    lightBackground: "#ffffff",
    lightText: "#111111",
    lightBorder: "rgba(0,0,0,0.1)",
    darkBackground: "#111111",
    darkText: "#ffffff",
    darkBorder: "rgba(255,255,255,0.08)",
    accentBackground: "#2563EB",
    accentText: "#ffffff",
    accentBorder: "rgba(255,255,255,0.12)",
    showGridPattern: true,
    gridPatternColor: "rgba(79,79,79,0.18)",
    gridPatternSize: 50,
    showAvatar: true,
    avatarSize: 64,
    avatarRadius: 12,
    titleColor: "#111111",
    subtitleColor: "#6B7280",
    roleOpacity: 0.85,
    animate: true,
    stagger: 0.15,
    duration: 0.5,
    offsetY: -20,
    blurAmount: 10,
    replay: false,
    triggerThreshold: 0.15,
    background: "#ffffff",
    showBottomRule: false,
    bottomRuleWidth: 100,
    bottomRuleThickness: 2,
    bottomRuleOffset: 32,
    bottomRuleColor: "#E6E6E6",
    showBottomRuleCaps: true,
    bottomRuleCapSize: 14,
    testimonials: DEFAULT_TESTIMONIALS,
}

// ─── Property Controls ──────────────────────────────────────────────

addPropertyControls(TestimonialBento, {
    // ── Content ──────────────────────────────────────────────────
    title: {
        type: ControlType.String,
        title: "Title",
        displayTextArea: true,
        defaultValue: "Trusted by startups and the world's largest companies",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        displayTextArea: true,
        defaultValue:
            "Let's hear how Hypersphere clients feel about our service.",
    },
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: '"A short, specific quote works best."',
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Jane Doe",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "CEO of Acme",
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                    description:
                        "Upload the photo here for production — it is then served from your own Framer assets. Takes priority over the URL below.",
                },
                avatarUrl: {
                    type: ControlType.String,
                    title: "Avatar URL",
                    defaultValue: "",
                    placeholder: "https://…",
                    preventLocalization: true,
                    description: "Used when no image is uploaded above.",
                },
                theme: {
                    type: ControlType.Enum,
                    title: "Style",
                    options: ["light", "dark", "accent"],
                    optionTitles: ["Light", "Dark", "Accent"],
                    defaultValue: "dark",
                },
                column: {
                    type: ControlType.Enum,
                    title: "Column",
                    description:
                        "Which column the card sits in on desktop. Ignored on tablet and mobile, where cards flow in list order.",
                    options: ["1", "2", "3"],
                    optionTitles: ["1", "2", "3"],
                    defaultValue: "1",
                },
                grow: {
                    type: ControlType.Number,
                    title: "Height",
                    description:
                        "Share of the column's leftover height. 0 = fit the content. Use 7 / 3 for a tall + short pair.",
                    min: 0,
                    max: 10,
                    step: 1,
                    defaultValue: 1,
                },
            },
        },
        defaultValue: DEFAULT_TESTIMONIALS,
    },

    // ── Animation ────────────────────────────────────────────────
    animate: {
        type: ControlType.Boolean,
        title: "Reveal",
        description:
            "Cards fade up and unblur one after another when the section scrolls into view. Always off on the canvas, during export, and for visitors who ask for reduced motion.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Delay between two consecutive cards.",
        min: 0,
        max: 0.8,
        step: 0.01,
        unit: "s",
        displayStepper: true,
        defaultValue: 0.15,
        hidden: (p) => !p.animate,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.5,
        hidden: (p) => !p.animate,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        description:
            "Negative slides cards down from above, positive up from below.",
        min: -120,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: -20,
        hidden: (p) => !p.animate,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 10,
        hidden: (p) => !p.animate,
    },
    triggerThreshold: {
        type: ControlType.Number,
        title: "Trigger",
        description:
            "How much of the section must be visible before the reveal starts.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.15,
        hidden: (p) => !p.animate,
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description:
            "Replay the reveal every time the section re-enters the viewport.",
        enabledTitle: "Always",
        disabledTitle: "Once",
        defaultValue: false,
        hidden: (p) => !p.animate,
    },

    // ── Layout ───────────────────────────────────────────────────
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 480,
        max: 1920,
        step: 10,
        unit: "px",
        defaultValue: 1200,
    },
    sectionPadding: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
        defaultValue: 56,
    },
    headerGap: {
        type: ControlType.Number,
        title: "Header Gap",
        min: 0,
        max: 160,
        step: 4,
        unit: "px",
        defaultValue: 40,
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    desktopBreakpoint: {
        type: ControlType.Number,
        title: "3 Cols ≥",
        description:
            "Container width at which the 3-column bento kicks in. Measured on the component, not the window.",
        min: 600,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 1024,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Rows ≥",
        description:
            "Between this width and the 3-column width, each column group lies down as a horizontal row. Below it, every card stacks.",
        min: 320,
        max: 1000,
        step: 10,
        unit: "px",
        defaultValue: 640,
    },

    // ── Cards ────────────────────────────────────────────────────
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 12,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
        defaultValue: 20,
    },
    lightBackground: {
        type: ControlType.Color,
        title: "Light BG",
        defaultValue: "#ffffff",
    },
    lightText: {
        type: ControlType.Color,
        title: "Light Text",
        defaultValue: "#111111",
    },
    lightBorder: {
        type: ControlType.Color,
        title: "Light Border",
        defaultValue: "rgba(0,0,0,0.1)",
    },
    darkBackground: {
        type: ControlType.Color,
        title: "Dark BG",
        defaultValue: "#111111",
    },
    darkText: {
        type: ControlType.Color,
        title: "Dark Text",
        defaultValue: "#ffffff",
    },
    darkBorder: {
        type: ControlType.Color,
        title: "Dark Border",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    accentBackground: {
        type: ControlType.Color,
        title: "Accent BG",
        defaultValue: "#2563EB",
    },
    accentText: {
        type: ControlType.Color,
        title: "Accent Text",
        defaultValue: "#ffffff",
    },
    accentBorder: {
        type: ControlType.Color,
        title: "Accent Border",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    showGridPattern: {
        type: ControlType.Boolean,
        title: "Grid Pattern",
        description:
            "Faint blueprint grid, faded from the top, on Light cards only.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    gridPatternColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "rgba(79,79,79,0.18)",
        hidden: (p) => !p.showGridPattern,
    },
    gridPatternSize: {
        type: ControlType.Number,
        title: "Grid Size",
        min: 12,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 50,
        hidden: (p) => !p.showGridPattern,
    },

    // ── Avatar ───────────────────────────────────────────────────
    showAvatar: {
        type: ControlType.Boolean,
        title: "Avatar",
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        defaultValue: true,
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        min: 24,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 64,
        hidden: (p) => !p.showAvatar,
    },
    avatarRadius: {
        type: ControlType.Number,
        title: "Avatar Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 12,
        hidden: (p) => !p.showAvatar,
    },

    // ── Typography ───────────────────────────────────────────────
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 40,
            lineHeight: "1.15em",
            letterSpacing: "-0.02em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#111111",
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: "1.5em",
        },
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#6B7280",
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: "1.5em",
        },
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 20,
            lineHeight: "1.4em",
            letterSpacing: "-0.01em",
        },
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 16,
            lineHeight: "1.4em",
        },
    },
    roleOpacity: {
        type: ControlType.Number,
        title: "Role Opacity",
        min: 0.2,
        max: 1,
        step: 0.05,
        defaultValue: 0.85,
    },

    // ── Section ──────────────────────────────────────────────────
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    showBottomRule: {
        type: ControlType.Boolean,
        title: "Baseline",
        description:
            "Thin decorative rule under the grid. Hidden unless you switch it on.",
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        defaultValue: false,
    },
    bottomRuleWidth: {
        type: ControlType.Number,
        title: "Baseline Width",
        description: "Share of the section width, capped by Max Width.",
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 100,
        hidden: (p) => !p.showBottomRule,
    },
    bottomRuleThickness: {
        type: ControlType.Number,
        title: "Baseline Size",
        min: 1,
        max: 12,
        step: 1,
        unit: "px",
        defaultValue: 2,
        hidden: (p) => !p.showBottomRule,
    },
    bottomRuleOffset: {
        type: ControlType.Number,
        title: "Baseline Offset",
        description: "Distance between the last row of cards and the rule.",
        min: 0,
        max: 160,
        step: 2,
        unit: "px",
        defaultValue: 32,
        hidden: (p) => !p.showBottomRule,
    },
    bottomRuleColor: {
        type: ControlType.Color,
        title: "Baseline Color",
        defaultValue: "#E6E6E6",
        hidden: (p) => !p.showBottomRule,
    },
    showBottomRuleCaps: {
        type: ControlType.Boolean,
        title: "End Caps",
        description: "Small squares straddling each end of the rule.",
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        defaultValue: true,
        hidden: (p) => !p.showBottomRule,
    },
    bottomRuleCapSize: {
        type: ControlType.Number,
        title: "Cap Size",
        min: 4,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
        hidden: (p) => !p.showBottomRule || !p.showBottomRuleCaps,
    },
})
