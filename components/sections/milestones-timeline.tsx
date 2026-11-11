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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type Milestone = {
    year: string
    title: string
    headline: string
    description: string
    meta: string
    image?: { src: string; srcSet?: string; alt?: string }
    ctaLabel: string
    link: string
}

type Props = {
    milestones: Milestone[]
    initialStep: number
    loop: boolean
    autoplay: boolean
    autoplayInterval: number
    pauseOnHover: boolean
    newTab: boolean
    imageLink: string
    cardLink: string
    cardNewTab: boolean
    imageNewTab: boolean
    showEyebrow: boolean
    eyebrow: string
    showMeta: boolean
    showProgress: boolean
    showCounter: boolean
    showArrows: boolean
    showCTA: boolean
    showBigYear: boolean
    background: string
    textColor: string
    mutedColor: string
    lineColor: string
    accentColor: string
    buttonBackground: string
    buttonText: string
    radius: number
    imageRadius: number
    padding: number
    columnGap: number
    contentGap: number
    imageHeight: number
    imageFit: "cover" | "contain"
    imagePosition: "center" | "top" | "bottom"
    imageZoom: number
    duration: number
    eyebrowFont: React.CSSProperties
    yearFont: React.CSSProperties
    headlineFont: React.CSSProperties
    bodyFont: React.CSSProperties
    navigationFont: React.CSSProperties
    smallFont: React.CSSProperties
    style?: React.CSSProperties
}

const sample: Milestone[] = [
    {
        year: "2016",
        title: "The beginning",
        headline: "Every great idea starts somewhere.",
        description:
            "What began as a small creative experiment soon turned into something bigger. With curiosity and a clear vision, we started building our own path.",
        meta: "01 / THE BEGINNING",
        image: {
            src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=85",
            alt: "Bright design studio",
        },
        ctaLabel: "Our story",
        link: "",
    },
    {
        year: "2018",
        title: "First studio",
        headline: "A space for new perspectives.",
        description:
            "Our first studio gave us room to experiment, collaborate and shape ideas into meaningful experiences. A new chapter had begun.",
        meta: "02 / NEW SPACES",
        image: {
            src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=85",
            alt: "Modern creative workspace",
        },
        ctaLabel: "Explore more",
        link: "",
    },
    {
        year: "2021",
        title: "Growing together",
        headline: "Good things grow together.",
        description:
            "New people, new projects and new perspectives helped us refine what we believe in: thoughtful work, human connections and an independent spirit.",
        meta: "03 / GROWTH",
        image: {
            src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85",
            alt: "Team collaborating",
        },
        ctaLabel: "Meet the team",
        link: "",
    },
    {
        year: "2024",
        title: "A new direction",
        headline: "Finding beauty in what comes next.",
        description:
            "We expanded our horizons and explored new disciplines without losing sight of what matters: creating work that feels purposeful and lasts.",
        meta: "04 / EVOLUTION",
        image: {
            src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",
            alt: "Contemporary office interior",
        },
        ctaLabel: "Discover our work",
        link: "",
    },
    {
        year: "2026",
        title: "Looking forward",
        headline: "The best is still ahead of us.",
        description:
            "Our story is still being written. We keep moving forward, staying curious and making space for the ideas that deserve to exist.",
        meta: "05 / WHAT'S NEXT",
        image: {
            src: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?auto=format&fit=crop&w=1600&q=85",
            alt: "Calm and bright architecture",
        },
        ctaLabel: "Get in touch",
        link: "",
    },
]

function Arrow({
    direction = "right",
    size = 18,
}: {
    direction?: "left" | "right" | "upRight"
    size?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {direction === "left" ? (
                <path d="M19 12H5m7 7-7-7 7-7" />
            ) : direction === "right" ? (
                <path d="M5 12h14m-7-7 7 7-7 7" />
            ) : (
                <path d="M5 19 19 5M7 5h12v12" />
            )}
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 620
 */
export default function ChaptersTimeline(props: Props) {
    const {
        initialStep,
        loop,
        autoplay,
        autoplayInterval,
        pauseOnHover,
        newTab,
        imageLink,
        imageNewTab,
        cardLink,
        cardNewTab,
        showEyebrow,
        eyebrow,
        showMeta,
        showProgress,
        showCounter,
        showArrows,
        showCTA,
        showBigYear,
        background,
        textColor,
        mutedColor,
        lineColor,
        accentColor,
        buttonBackground,
        buttonText,
        radius,
        imageRadius,
        padding,
        columnGap,
        contentGap,
        imageHeight,
        imageFit,
        imagePosition,
        imageZoom,
        duration,
        eyebrowFont,
        yearFont,
        headlineFont,
        bodyFont,
        navigationFont,
        smallFont,
    } = props
    const items = Array.isArray(props.milestones) ? props.milestones : sample
    const count = items.length
    const [hovered, setHovered] = React.useState(false)
    const [active, setActive] = React.useState(() =>
        Math.max(0, Math.min(count - 1, Math.round(initialStep) - 1))
    )
    const reduceMotion = useReducedMotion()
    // In static render contexts (canvas, thumbnails, exports) everything stays still:
    // no autoplay, no transitions, no hover animations
    const isCanvas = useIsStaticRenderer()
    const speed = reduceMotion || isCanvas ? 0 : duration
    const [pageVisible, setPageVisible] = React.useState(true)
    const id = React.useId()
    const navRef = React.useRef<HTMLDivElement>(null)
    const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

    React.useEffect(() => {
        setActive(Math.max(0, Math.min(count - 1, Math.round(initialStep) - 1)))
    }, [initialStep, count])

    // Keep the active tab visible by scrolling only the tab rail
    // (never the page itself, so autoplay doesn't make the page jump).
    React.useEffect(() => {
        const nav = navRef.current
        const tab = tabRefs.current[active]
        if (!nav || !tab || nav.scrollWidth <= nav.clientWidth + 1) return
        const target = tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2
        nav.scrollTo({
            left: Math.max(0, target),
            behavior: reduceMotion || isCanvas ? "auto" : "smooth",
        })
    }, [active, reduceMotion, isCanvas])

    // Pause autoplay while the browser tab is hidden
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const update = () => setPageVisible(!document.hidden)
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    // Advance at a configurable interval. The timer restarts after manual navigation.
    // When Loop is off, autoplay stops on the final milestone.
    React.useEffect(() => {
        if (isCanvas || !autoplay || !pageVisible || count < 2) return
        if (pauseOnHover && hovered) return
        if (!loop && active >= count - 1) return
        const timer = window.setTimeout(
            () => {
                setActive((current) =>
                    loop
                        ? (current + 1) % count
                        : Math.min(count - 1, current + 1)
                )
            },
            Math.max(1, autoplayInterval ?? 5) * 1000
        )
        return () => window.clearTimeout(timer)
    }, [isCanvas, autoplay, autoplayInterval, pauseOnHover, hovered, pageVisible, active, count, loop])

    const select = (index: number) =>
        setActive(Math.max(0, Math.min(count - 1, index)))
    const move = (delta: number) => {
        if (!count) return
        setActive((current) =>
            loop
                ? (current + delta + count) % count
                : Math.max(0, Math.min(count - 1, current + delta))
        )
    }
    const onKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        if (!count) return
        let next: number | null = null
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
            next = loop ? (index + 1) % count : Math.min(count - 1, index + 1)
        if (event.key === "ArrowLeft" || event.key === "ArrowUp")
            next = loop ? (index - 1 + count) % count : Math.max(0, index - 1)
        if (event.key === "Home") next = 0
        if (event.key === "End") next = count - 1
        if (next === null) return
        event.preventDefault()
        select(next)
        tabRefs.current[next]?.focus()
    }

    if (!count)
        return (
            <div
                style={{
                    ...props.style,
                    padding: 24,
                    background,
                    color: mutedColor,
                }}
            >
                Add milestones in the Framer properties panel.
            </div>
        )
    const item = items[Math.min(active, count - 1)]
    // Fall back to the built-in sample images so the component never looks empty
    const image = item.image?.src
        ? item.image
        : sample[Math.min(active, count - 1) % sample.length].image
    // The image area becomes a real link when an Image Link is set
    const ImageTag: any = imageLink ? "a" : "div"
    const imageLinkProps = imageLink
        ? {
              href: imageLink,
              target: imageNewTab ? "_blank" : undefined,
              rel: imageNewTab ? "noopener noreferrer" : undefined,
              "aria-label": `${item.title || item.year} – open link`,
          }
        : {}
    // Renders the text of one milestone (used for the visible copy and the invisible height sizers)
    const renderCopy = (m: Milestone) => (
        <>
                                    {showBigYear && (
                                        <div
                                            className="et-year"
                                            style={{
                                                ...yearFont,
                                                fontSize: undefined,
                                                color: textColor,
                                                marginBottom: 26,
                                                lineHeight: 0.95,
                                                letterSpacing: "-0.07em",
                                            }}
                                        >
                                            {m.year}
                                        </div>
                                    )}
                                    {showMeta && m.meta && (
                                        <div
                                            style={{
                                                ...smallFont,
                                                color: mutedColor,
                                                marginBottom: 17,
                                            }}
                                        >
                                            {m.meta}
                                        </div>
                                    )}
                                    <h2
                                        className="et-headline"
                                        style={{
                                            ...headlineFont,
                                            fontSize: undefined,
                                            color: textColor,
                                            marginBottom: 18,
                                        }}
                                    >
                                        {m.headline || m.title}
                                    </h2>
                                    <p
                                        className="et-body"
                                        style={{
                                            ...bodyFont,
                                            color: mutedColor,
                                            maxWidth: 470,
                                        }}
                                    >
                                        {m.description}
                                    </p>
        </>
    )
    const toSize = (value: unknown, fallback: string) =>
        typeof value === "number" ? `${value}px` : (value as string) || fallback
    const num = (value: number) => String(value).padStart(2, "0")

    return (
        <section
            className={cardLink ? "editorial-timeline et-has-card-link" : "editorial-timeline"}
            onPointerEnter={(event) => {
                // Only real mouse hover pauses autoplay (touch taps would pause it forever)
                if (event.pointerType === "mouse") setHovered(true)
            }}
            onPointerLeave={() => setHovered(false)}
            style={{
                ...props.style,
                width: "100%",
                boxSizing: "border-box",
                ["containerType" as any]: "inline-size",
                background,
                color: textColor,
                borderRadius: radius,
                overflow: "hidden",
                WebkitFontSmoothing: "antialiased",
                ["--et-line" as any]: lineColor,
                ["--et-text" as any]: textColor,
                ["--et-muted" as any]: mutedColor,
                ["--et-accent" as any]: accentColor,
                ["--et-pad" as any]: `${padding}px`,
                ["--et-year" as any]: toSize(yearFont?.fontSize, "112px"),
                ["--et-h" as any]: toSize(headlineFont?.fontSize, "33px"),
            }}
        >
            <style>{`
                .editorial-timeline * { box-sizing:border-box; }
                .editorial-timeline button { font:inherit; }
                .editorial-timeline button, .editorial-timeline a { -webkit-tap-highlight-color:transparent; }
                .editorial-timeline button:focus-visible, .editorial-timeline a:focus-visible { outline:2px solid var(--et-accent); outline-offset:4px; }
                .et-navigation-shell { width:100%; min-width:0; }
                .et-navigation { width:100%; min-width:0; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; scroll-snap-type:x proximity; }
                .et-navigation::-webkit-scrollbar { display:none; }
                .et-track { position:relative; width:100%; padding-bottom:22px; }
                .et-track-spacer { display:block; visibility:hidden; white-space:nowrap; padding-bottom:30px; pointer-events:none; }
                .et-tab { appearance:none; position:absolute; top:0; cursor:pointer; border:0; background:none; color:var(--et-muted); padding:0; white-space:nowrap; transition:color 180ms ease; z-index:1; }
                .et-inner { padding:var(--et-pad); }
                .et-card-link { position:absolute; inset:0; z-index:1; border-radius:inherit; }
                .editorial-timeline.et-has-card-link { position:relative; cursor:pointer; }
                .et-has-card-link .et-inner { position:relative; z-index:2; pointer-events:none; }
                .et-has-card-link .et-inner button, .et-has-card-link .et-inner a, .et-has-card-link .et-navigation { pointer-events:auto; }
                .et-tab-label { display:block; white-space:nowrap; padding-bottom:30px; }
                .et-tab-dot { position:absolute; bottom:8px; width:8px; height:8px; border-radius:50%; background:var(--et-line); transition:background 220ms ease; z-index:2; }
                .et-tab[aria-selected="true"] .et-tab-dot { background:var(--et-accent); }
                .et-rail { position:absolute; left:4px; right:4px; bottom:11.5px; height:1px; background:var(--et-line); z-index:0; pointer-events:none; }
                .et-rail-progress { position:absolute; left:0; top:-0.5px; height:2px; background:var(--et-accent); }
                .et-grid { display:grid; grid-template-columns:minmax(0, .88fr) minmax(0, 1.12fr); align-items:stretch; }
                .et-copy { display:flex; flex-direction:column; justify-content:space-between; min-width:0; }
                .et-year { font-variant-numeric:tabular-nums; white-space:nowrap; margin:0; overflow:visible; font-size:min(var(--et-year), 10cqw); }
                .et-headline { margin:0; overflow-wrap:break-word; font-size:min(var(--et-h), max(24px, 3.1cqw)); }
                .et-body { margin:0; overflow-wrap:anywhere; }
                .et-image { display:block; text-decoration:none; color:inherit; overflow:hidden; position:relative; width:100%; background:rgba(255,255,255,.08); }
                .et-image img { display:block; width:100%; height:100%; user-select:none; -webkit-user-drag:none; }
                .et-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:18px; }
                .et-footer-left { display:flex; align-items:center; min-height:41px; gap:16px; }
                .et-footer-right { display:flex; align-items:center; margin-left:auto; }
                .et-controls { display:flex; align-items:center; gap:7px; }
                .et-arrow { appearance:none; width:41px; height:41px; border:1px solid var(--et-line); background:transparent; color:var(--et-text); display:grid; place-items:center; cursor:pointer; transition:background 200ms ease, transform 200ms ease, opacity 200ms ease; }
                                .et-arrow:disabled { opacity:.3; cursor:not-allowed; }
                .et-link { display:inline-flex; gap:16px; align-items:center; text-decoration:none; width:fit-content; transition:opacity 180ms ease,transform 220ms ease; }
                .et-link-icon { transition:transform 220ms ease; display:flex; }
                @media (hover:hover) {
                    .et-tab:hover { color:var(--et-text) !important; }
                    .et-arrow:hover:not(:disabled) { background:var(--et-line); transform:translateY(-2px); }
                    .et-link:hover { transform:translateY(-2px); opacity:.86; }
                    .et-link:hover .et-link-icon { transform:translate(2px,-2px); }
                }
                /* Tablet / small: stack text above image */
                @container (max-width: 820px) {
                    .et-inner { padding:min(var(--et-pad), 32px); }
                    .et-grid { grid-template-columns:minmax(0,1fr); }
                    .et-copy { min-height:0 !important; }
                    .et-image { height:clamp(220px, 58cqw, 460px) !important; }
                    .et-year { font-size:min(var(--et-year), max(64px, 16cqw)); }
                    .et-headline { font-size:min(var(--et-h), max(24px, 5.4cqw)); }
                    .et-track { min-width: max(100%, calc(var(--et-count) * 92px)); }
                }
                /* Mobile */
                @container (max-width: 480px) {
                    .et-inner { padding:min(var(--et-pad), 20px); }
                    .et-year { font-size:min(var(--et-year), max(56px, 19cqw)); margin-bottom:18px !important; }
                    .et-track { min-width: max(100%, calc(var(--et-count) * 78px)); }
                    .et-footer { gap:14px; }
                    .et-link { padding:11px 13px !important; }
                }
                @media (prefers-reduced-motion:reduce) {
                    .editorial-timeline *, .editorial-timeline *::before, .editorial-timeline *::after { transition-duration:0.01ms !important; scroll-behavior:auto !important; }
                }
            `}</style>
            {cardLink ? (
                <a
                    className="et-card-link"
                    href={cardLink}
                    target={cardNewTab ? "_blank" : undefined}
                    rel={cardNewTab ? "noopener noreferrer" : undefined}
                    aria-label={`${item.title || item.year} – open link`}
                />
            ) : null}
            <div className="et-inner">
                {showEyebrow && eyebrow ? (
                    <div
                        style={{
                            ...eyebrowFont,
                            color: mutedColor,
                            marginBottom: 27,
                        }}
                    >
                        {eyebrow}
                    </div>
                ) : null}
                <div className="et-navigation-shell">
                    <div
                        ref={navRef}
                        className="et-navigation"
                        role="tablist"
                        aria-label="Timeline milestones"
                    >
                        <div
                            className="et-track"
                            style={{ ["--et-count" as any]: count }}
                        >
                            <span
                                className="et-track-spacer"
                                aria-hidden="true"
                                style={navigationFont}
                            >
                                {items[0]?.year || "0"}
                            </span>
                            <div
                                className="et-rail"
                                aria-hidden="true"
                                style={{ display: count > 1 ? "block" : "none" }}
                            >
                                {showProgress && (
                                    <motion.div
                                        className="et-rail-progress"
                                        initial={false}
                                        animate={{
                                            width: `${count > 1 ? (active / (count - 1)) * 100 : 0}%`,
                                        }}
                                        transition={{
                                            duration: speed,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    />
                                )}
                            </div>
                            {items.map((milestone, index) => {
                                const selected = index === active
                                const isFirst = index === 0
                                const isLast = index === count - 1 && count > 1
                                const fraction = count > 1 ? index / (count - 1) : 0
                                const shift = isFirst
                                    ? "translateX(-4px)"
                                    : isLast
                                      ? "translateX(calc(-100% + 4px))"
                                      : "translateX(-50%)"
                                return (
                                    <button
                                        key={index}
                                        ref={(node) => {
                                            tabRefs.current[index] = node
                                        }}
                                        type="button"
                                        className="et-tab"
                                        role="tab"
                                        id={`${id}-tab-${index}`}
                                        aria-selected={selected}
                                        aria-label={
                                            milestone.title
                                                ? `${milestone.year} – ${milestone.title}`
                                                : milestone.year
                                        }
                                        aria-controls={`${id}-panel`}
                                        tabIndex={selected ? 0 : -1}
                                        onKeyDown={(event) =>
                                            onKeyDown(event, index)
                                        }
                                        onClick={() => select(index)}
                                        style={{
                                            ...navigationFont,
                                            left: `calc(4px + ${fraction} * (100% - 8px))`,
                                            transform: shift,
                                            textAlign: isFirst
                                                ? "left"
                                                : isLast
                                                  ? "right"
                                                  : "center",
                                            color: selected
                                                ? textColor
                                                : mutedColor,
                                        }}
                                    >
                                        <span className="et-tab-label">
                                            {milestone.year}
                                        </span>
                                        <span
                                            className="et-tab-dot"
                                            aria-hidden="true"
                                            style={
                                                isFirst
                                                    ? { left: 0 }
                                                    : isLast
                                                      ? { right: 0 }
                                                      : { left: "50%", transform: "translateX(-50%)" }
                                            }
                                        />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div
                    className="et-grid"
                    style={{
                        columnGap,
                        rowGap: Math.max(24, contentGap),
                        marginTop: Math.max(30, contentGap),
                    }}
                >
                    <div
                        className="et-copy"
                        style={{
                            minHeight: imageHeight,
                            gap: Math.max(20, contentGap),
                        }}
                    >
                        <div
                            id={`${id}-panel`}
                            role="tabpanel"
                            aria-labelledby={`${id}-tab-${active}`}
                            style={{ display: "grid" }}
                        >
                            {items.map((m, index) => (
                                <div
                                    key={`sizer-${index}`}
                                    aria-hidden="true"
                                    style={{
                                        gridArea: "1 / 1",
                                        visibility: "hidden",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {renderCopy(m)}
                                </div>
                            ))}
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={active}
                                    style={{ gridArea: "1 / 1" }}
                                    initial={
                                        reduceMotion
                                            ? false
                                            : {
                                                  opacity: 0,
                                                  y: 14,
                                                  filter: "blur(3px)",
                                              }
                                    }
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        filter: "blur(0px)",
                                    }}
                                    exit={
                                        reduceMotion
                                            ? undefined
                                            : {
                                                  opacity: 0,
                                                  y: -9,
                                                  filter: "blur(2px)",
                                              }
                                    }
                                    transition={{
                                        duration: speed,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                >
                                    {renderCopy(item)}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <div className="et-footer">
                            <div className="et-footer-left">
                                {showCounter && (
                                    <span
                                        style={{
                                            ...smallFont,
                                            color: mutedColor,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {num(active + 1)}{" "}
                                        <span style={{ opacity: 0.5 }}>/</span>{" "}
                                        {num(count)}
                                    </span>
                                )}
                                {showArrows && (
                                    <div className="et-controls">
                                        <button
                                            type="button"
                                            className="et-arrow"
                                            aria-label="Previous milestone"
                                            disabled={!loop && active === 0}
                                            onClick={() => move(-1)}
                                            style={{
                                                borderRadius: Math.min(
                                                    radius,
                                                    5
                                                ),
                                            }}
                                        >
                                            <Arrow direction="left" />
                                        </button>
                                        <button
                                            type="button"
                                            className="et-arrow"
                                            aria-label="Next milestone"
                                            disabled={
                                                !loop && active === count - 1
                                            }
                                            onClick={() => move(1)}
                                            style={{
                                                borderRadius: Math.min(
                                                    radius,
                                                    5
                                                ),
                                            }}
                                        >
                                            <Arrow direction="right" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {showCTA && item.link && (
                                <div className="et-footer-right">
                                    <a
                                        className="et-link"
                                        href={item.link}
                                        target={newTab ? "_blank" : undefined}
                                        rel={
                                            newTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        style={{
                                            ...navigationFont,
                                            background: buttonBackground,
                                            color: buttonText,
                                            padding: "12px 15px",
                                            borderRadius: Math.min(radius, 6),
                                        }}
                                    >
                                        {item.ctaLabel || "Learn more"}
                                        <span className="et-link-icon">
                                            <Arrow
                                                direction="upRight"
                                                size={17}
                                            />
                                        </span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <ImageTag
                        className="et-image"
                        {...imageLinkProps}
                        style={{
                            height: imageHeight,
                            borderRadius: imageRadius,
                        }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={active}
                                initial={
                                    reduceMotion
                                        ? false
                                        : { opacity: 0, scale: 1.025 }
                                }
                                animate={{ opacity: 1, scale: 1 }}
                                exit={
                                    reduceMotion
                                        ? undefined
                                        : { opacity: 0, scale: 0.985 }
                                }
                                transition={{
                                    duration: speed,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{ position: "absolute", inset: 0 }}
                            >
                                {image?.src ? (
                                    <motion.img
                                        src={image.src}
                                        srcSet={image.srcSet}
                                        alt={image.alt || item.title}
                                        draggable={false}
                                        style={{
                                            objectFit: imageFit,
                                            objectPosition: imagePosition,
                                        }}
                                        whileHover={
                                            reduceMotion
                                                ? undefined
                                                : isCanvas ? undefined : { scale: imageZoom }
                                        }
                                        transition={{
                                            duration: speed + 0.3,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            height: "100%",
                                            display: "grid",
                                            placeItems: "center",
                                            color: mutedColor,
                                            ...smallFont,
                                        }}
                                    >
                                        Add an image
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </ImageTag>
                </div>
            </div>
        </section>
    )
}

ChaptersTimeline.defaultProps = {
    milestones: sample,
    initialStep: 1,
    loop: false,
    autoplay: false,
    autoplayInterval: 5,
    pauseOnHover: true,
    newTab: false,
    imageLink: "https://framer.link/SYJK4Bv",
    imageNewTab: true,
    cardLink: "",
    cardNewTab: true,
    showEyebrow: false,
    eyebrow: "OUR JOURNEY / 2016 — TODAY",
    showMeta: true,
    showProgress: true,
    showCounter: true,
    showArrows: true,
    showCTA: true,
    showBigYear: true,
    background: "#002DE3",
    textColor: "#FFFFFF",
    mutedColor: "#C2C2C2",
    lineColor: "#B7FF00",
    accentColor: "#B7FF00",
    buttonBackground: "#B7FF00",
    buttonText: "#002DE3",
    radius: 0,
    imageRadius: 0,
    padding: 40,
    columnGap: 55,
    contentGap: 48,
    imageHeight: 420,
    imageFit: "cover" as const,
    imagePosition: "center" as const,
    imageZoom: 1.035,
    duration: 0.42,
    eyebrowFont: {
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.09em",
        lineHeight: "1.4em",
    },
    yearFont: {
        fontFamily: "Inter",
        fontSize: 112,
        fontWeight: 500,
        letterSpacing: "-0.07em",
        lineHeight: ".95em",
    },
    headlineFont: {
        fontFamily: "Inter",
        fontSize: 33,
        fontWeight: 500,
        letterSpacing: "-0.045em",
        lineHeight: "1.13em",
    },
    bodyFont: {
        fontFamily: "Inter",
        fontSize: 15,
        fontWeight: 400,
        lineHeight: "1.65em",
    },
    navigationFont: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: "1.35em",
    },
    smallFont: {
        fontFamily: "Inter",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.045em",
        lineHeight: "1.4em",
    },
}

addPropertyControls(ChaptersTimeline, {
    milestones: {
        type: ControlType.Array,
        title: "Milestones",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2026",
                },
                title: {
                    type: ControlType.String,
                    title: "Nav Title",
                    defaultValue: "New milestone",
                },
                headline: {
                    type: ControlType.String,
                    title: "Headline",
                    defaultValue: "A new chapter begins.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Tell your story here.",
                },
                meta: {
                    type: ControlType.String,
                    title: "Meta",
                    defaultValue: "MILESTONE",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                ctaLabel: {
                    type: ControlType.String,
                    title: "CTA Label",
                    defaultValue: "Learn more",
                },
                link: { type: ControlType.Link, title: "CTA Link" },
            },
        },
        defaultValue: sample,
        getItemTitle: (item) => item.year || item.title || "Milestone",
    },
    initialStep: {
        type: ControlType.Number,
        title: "Start At",
        defaultValue: 1,
        min: 1,
        max: 16,
        step: 1,
        displayStepper: true,
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: false },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Auto Interval",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (props) => !props.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (props) => !props.autoplay,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    imageLink: {
        type: ControlType.Link,
        title: "Image Link",
        defaultValue: "https://framer.link/SYJK4Bv",
    },
    imageNewTab: {
        type: ControlType.Boolean,
        title: "Image New Tab",
        defaultValue: true,
        hidden: (p) => !p.imageLink,
    },
    cardLink: {
        type: ControlType.Link,
        title: "Card Link",
    },
    cardNewTab: {
        type: ControlType.Boolean,
        title: "Card New Tab",
        defaultValue: true,
        hidden: (p) => !p.cardLink,
    },
    showEyebrow: {
        type: ControlType.Boolean,
        title: "Eyebrow",
        defaultValue: false,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow Text",
        defaultValue: "OUR JOURNEY / 2016 — TODAY",
        hidden: (p) => !p.showEyebrow,
    },
    showMeta: { type: ControlType.Boolean, title: "Meta", defaultValue: true },
    showBigYear: {
        type: ControlType.Boolean,
        title: "Big Year",
        defaultValue: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showCTA: { type: ControlType.Boolean, title: "CTA", defaultValue: true },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#002DE3",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#C2C2C2",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Lines",
        defaultValue: "#B7FF00",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#B7FF00",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "CTA Fill",
        defaultValue: "#B7FF00",
    },
    buttonText: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#002DE3",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        defaultValue: 0,
        unit: "px",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        min: 0,
        max: 40,
        defaultValue: 0,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 12,
        max: 90,
        defaultValue: 40,
        unit: "px",
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        min: 0,
        max: 140,
        defaultValue: 55,
        unit: "px",
    },
    contentGap: {
        type: ControlType.Number,
        title: "Section Gap",
        min: 16,
        max: 100,
        defaultValue: 48,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        min: 180,
        max: 800,
        step: 10,
        defaultValue: 420,
        unit: "px",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
    },
    imagePosition: {
        type: ControlType.Enum,
        title: "Image Focus",
        options: ["center", "top", "bottom"],
        optionTitles: ["Center", "Top", "Bottom"],
        defaultValue: "center",
    },
    imageZoom: {
        type: ControlType.Number,
        title: "Image Hover",
        min: 1,
        max: 1.2,
        step: 0.005,
        defaultValue: 1.035,
    },
    duration: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 1.2,
        step: 0.01,
        defaultValue: 0.42,
        unit: "s",
    },
    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "11px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.09em",
            lineHeight: "1.4em",
        },
    },
    yearFont: {
        type: ControlType.Font,
        title: "Year Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "112px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 112,
            fontWeight: 500,
            letterSpacing: "-0.07em",
            lineHeight: ".95em",
        },
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "33px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 33,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            lineHeight: "1.13em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "15px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 400,
            lineHeight: "1.65em",
        },
    },
    navigationFont: {
        type: ControlType.Font,
        title: "Navigation Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "14px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500,
            lineHeight: "1.35em",
        },
    },
    smallFont: {
        type: ControlType.Font,
        title: "Small Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "11px",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.045em",
            lineHeight: "1.4em",
        },
    },
} as any)
