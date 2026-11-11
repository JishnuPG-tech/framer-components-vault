/*
 * Follow Morph Accordion – badtemps
 * Section-Accordion, bei dem das Bild dem geöffneten Item folgt und dabei morpht.
 * Unter dem Breakpoint wandert das Bild automatisch ins geöffnete Item. perfect.
 */
import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Item = {
    title: string
    description: string
    image?: ImageValue
    color: string
    accent: string
    ctaLabel?: string
    ctaLink?: string
    ctaNewTab?: boolean
}

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Book a call",
        description:
            "Pick a slot that suits you. We start by listening: your goals, your audience and what hasn't worked so far. You leave the call with a clear first idea of what we'd build.",
        color: "#111111",
        accent: "#FFFFFF",
        ctaLabel: "Learn more",
    },
    {
        title: "Get a proposal",
        description:
            "Within 48 hours you get a clear scope, timeline and fixed price. Everything is written in plain language, so there are no surprises later and no hidden extras.",
        color: "#1C1C1C",
        accent: "#FFFFFF",
        ctaLabel: "Learn more",
    },
    {
        title: "Design sprint",
        description:
            "Two focused weeks with daily previews on one shared canvas. You comment directly on the design and see every change as it happens.",
        color: "#111111",
        accent: "#FFFFFF",
        ctaLabel: "Learn more",
    },
    {
        title: "Build and test",
        description:
            "We build the site in Framer, fine-tune every breakpoint and test speed, forms and SEO before anything goes live.",
        color: "#1C1C1C",
        accent: "#FFFFFF",
        ctaLabel: "Learn more",
    },
    {
        title: "Launch",
        description:
            "We publish, check everything once more and hand over with a short video guide, so your team can edit content from day one.",
        color: "#111111",
        accent: "#FFFFFF",
        ctaLabel: "Learn more",
    },
]

// Formen für die Platzhalter-Grafik (wenn kein Bild gesetzt ist)
const SHAPES = [
    { cx: 26, sq: 56 },
    { cx: 74, sq: 12 },
    { cx: 50, sq: 62 },
    { cx: 18, sq: 50 },
    { cx: 64, sq: 8 },
]

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function Visual({
    item,
    index,
    active,
}: {
    item: Item
    index: number
    active: boolean
}) {
    const img = item.image
    if (img && img.src) {
        return (
            <img
                src={img.src}
                srcSet={img.srcSet}
                alt={active ? img.alt || item.title : ""}
                draggable={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        )
    }
    const s = SHAPES[index % SHAPES.length]
    return (
        <div
            role="img"
            aria-label={active ? item.title : undefined}
            style={{ position: "absolute", inset: 0, background: item.color }}
        >
            <svg
                viewBox="0 0 100 66"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                <circle cx={s.cx} cy={33} r={22} fill={item.accent} />
                <rect
                    x={s.sq}
                    y={15}
                    width={36}
                    height={36}
                    rx={7}
                    fill="none"
                    stroke={item.accent}
                    strokeWidth={0.6}
                />
            </svg>
        </div>
    )
}

function Icon({ type, open, color, transition }) {
    if (type === "none") return null
    const rotate = type === "plus" ? (open ? 45 : 0) : open ? 180 : 0
    return (
        <motion.svg
            width={20}
            height={20}
            viewBox="0 0 16 16"
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            aria-hidden="true"
            initial={false}
            animate={{ rotate }}
            transition={transition}
            style={{ flexShrink: 0 }}
        >
            {type === "plus" ? (
                <path d="M8 3v10M3 8h10" />
            ) : (
                <path d="M4 6l4 4 4-4" />
            )}
        </motion.svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function FollowMorphAccordion(props) {
    const {
        items = DEFAULT_ITEMS,
        defaultOpen = 1,
        allowCollapse = true,
        autoplay = 0,
        imagePosition = "right",
        imageWidth = 46,
        imageAspect = 1.4,
        imageRadius = 24,
        columnGap = 72,
        breakpoint = 760,
        tabletBreakpoint = 1100,
        showHeader = false,
        eyebrow = "",
        heading = "How it works",
        subheading = "",
        headingFont,
        headingColor = "#0A0A0A",
        headingTag = "h2",
        headerAlign = "left",
        headerGap = 64,
        showCta = true,
        showProgress = true,
        progressColor = "#0A0A0A",
        ctaStyle = "button",
        ctaBg = "#0A0A0A",
        ctaText = "#FFFFFF",
        background = "#FFFFFF",
        maxWidth = 1280,
        paddingY = 112,
        paddingX = 40,
        radius = 0,
        itemGap = 6,
        itemPadding = 28,
        itemRadius = 20,
        textColor = "#0A0A0A",
        activeTextColor = "#0A0A0A",
        mutedColor = "#555555",
        activeBg = "#F3F3F3",
        hoverBg = "rgba(0, 0, 0, 0.04)",
        badgeStyle = "number",
        badgeBg = "rgba(0, 0, 0, 0.06)",
        badgeActiveBg = "#0A0A0A",
        badgeActiveText = "#FFFFFF",
        iconType = "chevron",
        titleFont,
        bodyFont,
        titleTag = "h3",
        transition: transitionProp = {
            type: "spring",
            duration: 0.7,
            bounce: 0.12,
        },
        faqSchema = false,
        style,
    } = props

    // Canvas/Export (statisch): keine Animationen, kein Autoplay, keine Hover-Effekte
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const reduced = isStatic || prefersReduced
    const transition = reduced ? { duration: 0 } : transitionProp
    const uid = useId().replace(/:/g, "")
    const count = items.length
    const clampIdx = (i: number) =>
        count === 0 ? -1 : Math.max(-1, Math.min(count - 1, Math.round(i)))

    const [open, setOpen] = useState<number>(() => clampIdx(defaultOpen))
    const [last, setLast] = useState<number>(() =>
        Math.max(0, clampIdx(defaultOpen))
    )
    const [hover, setHover] = useState(-1)
    const [paused, setPaused] = useState(false)
    const [m, setM] = useState({
        w: 1200,
        colW: 0,
        headers: [] as number[],
        contents: [] as number[],
    })

    const rootRef = useRef<HTMLElement>(null)
    const colRef = useRef<HTMLDivElement>(null)
    const headerRefs = useRef<(HTMLElement | null)[]>([])
    const innerRefs = useRef<(HTMLDivElement | null)[]>([])
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
    const lastRef = useRef(last)

    // Canvas: "Open Item" live übernehmen
    useEffect(() => {
        setOpen(clampIdx(defaultOpen))
    }, [defaultOpen, count])

    useEffect(() => {
        if (open >= 0) {
            setLast(open)
            lastRef.current = open
        }
    }, [open])

    const stacked = m.w < breakpoint

    // Messen: Breite, Header-Höhen, Inhalts-Höhen
    const measure = () => {
        const root = rootRef.current
        if (!root) return
        const next = {
            w: root.offsetWidth,
            colW: colRef.current ? colRef.current.offsetWidth : 0,
            headers: headerRefs.current
                .slice(0, count)
                .map((el) => (el ? el.offsetHeight : 0)),
            contents: innerRefs.current
                .slice(0, count)
                .map((el) => (el ? el.offsetHeight : 0)),
        }
        setM((prev) =>
            JSON.stringify(prev) === JSON.stringify(next) ? prev : next
        )
    }

    useIsoLayoutEffect(() => {
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => measure())
        if (rootRef.current) ro.observe(rootRef.current)
        if (colRef.current) ro.observe(colRef.current)
        headerRefs.current.forEach((el) => el && ro.observe(el))
        innerRefs.current.forEach((el) => el && ro.observe(el))
        return () => ro.disconnect()
    }, [count, stacked])

    // Autoplay (nicht im Canvas, pausiert bei Hover/Fokus)
    const autoplayOn = autoplay > 0 && !isStatic && count > 1
    useEffect(() => {
        if (!autoplayOn || paused) return
        const t = setTimeout(() => {
            setOpen((o) => ((o < 0 ? lastRef.current : o) + 1) % count)
        }, autoplay * 1000)
        return () => clearTimeout(t)
    }, [autoplayOn, autoplay, paused, count, open])

    const toggle = (i: number) => {
        if (i === open) {
            if (allowCollapse) setOpen(-1)
        } else setOpen(i)
    }

    const onKeyDown = (e: React.KeyboardEvent, i: number) => {
        let n = -1
        if (e.key === "ArrowDown") n = (i + 1) % count
        else if (e.key === "ArrowUp") n = (i - 1 + count) % count
        else if (e.key === "Home") n = 0
        else if (e.key === "End") n = count - 1
        if (n >= 0) {
            e.preventDefault()
            buttonRefs.current[n]?.focus()
        }
    }

    // Position des Bildes = Oberkante des geöffneten Items im Endzustand
    const shown = open >= 0 ? open : last
    const imgH = m.colW > 0 ? m.colW / Math.max(0.2, imageAspect) : 0
    let top = 0
    for (let j = 0; j < shown; j++) top += (m.headers[j] || 0) + itemGap
    let listH = 0
    for (let j = 0; j < count; j++)
        listH += (m.headers[j] || 0) + (j > 0 ? itemGap : 0)
    if (open >= 0) listH += m.contents[open] || 0
    const shift = Math.max(0, Math.min(top, Math.max(0, listH - imgH)))

    // Auf kleinen Screens Titel etwas kleiner und Abstände enger
    const titleStyle = { ...titleFont }
    if (titleStyle.fontSize) {
        const px = parseFloat(String(titleStyle.fontSize))
        if (stacked && px > 20) titleStyle.fontSize = "20px"
        else if (m.w < tabletBreakpoint && px > 20)
            titleStyle.fontSize = `${Math.max(20, Math.round(px * 0.88))}px`
    }
    // Section-Headline: auf Tablet und Handy automatisch kleiner
    const headStyle = { ...headingFont }
    if (headStyle.fontSize) {
        const px = parseFloat(String(headStyle.fontSize))
        if (stacked)
            headStyle.fontSize = `${Math.min(px, Math.max(36, Math.round(px * 0.62)))}px`
        else if (m.w < tabletBreakpoint)
            headStyle.fontSize = `${Math.min(px, Math.max(40, Math.round(px * 0.8)))}px`
    }
    const center = headerAlign === "center"
    const header = showHeader && (heading || eyebrow || subheading) && (
        <div
            style={{
                width: "100%",
                maxWidth: maxWidth > 0 ? maxWidth : "none",
                margin: `0 auto ${stacked ? Math.min(headerGap, 40) : headerGap}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: center ? "center" : "flex-start",
                textAlign: center ? "center" : "left",
                gap: 16,
            }}
        >
            {eyebrow && (
                <span
                    style={{
                        fontFamily:
                            (bodyFont && bodyFont.fontFamily) || "inherit",
                        fontSize: 13,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: mutedColor,
                    }}
                >
                    {eyebrow}
                </span>
            )}
            {heading &&
                React.createElement(
                    headingTag,
                    { style: { margin: 0, color: headingColor, ...headStyle } },
                    heading
                )}
            {subheading && (
                <p
                    style={{
                        margin: 0,
                        maxWidth: 560,
                        color: mutedColor,
                        ...bodyFont,
                        fontSize: stacked ? 16 : 18,
                    }}
                >
                    {subheading}
                </p>
            )}
        </div>
    )
    const pad = stacked ? Math.min(itemPadding, 18) : itemPadding
    const padX = stacked ? Math.min(paddingX, 16) : paddingX
    const padY = stacked ? Math.min(paddingY, 64) : paddingY
    const badgeSize = badgeStyle === "dot" ? 10 : stacked ? 30 : 36
    const btnGap = stacked ? 14 : 20

    // Bild übernimmt den Link des CTA (nur Maus/Touch, CTA bleibt der Tastatur-Link)
    const imgLink = (item: Item, active: boolean, child: React.ReactNode) =>
        item.ctaLink ? (
            <a
                href={item.ctaLink}
                target={item.ctaNewTab ? "_blank" : undefined}
                rel={item.ctaNewTab ? "noopener noreferrer" : undefined}
                tabIndex={-1}
                className="fma-img"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    overflow: "hidden",
                    cursor: "pointer",
                    pointerEvents: active ? "auto" : "none",
                }}
            >
                {child}
            </a>
        ) : (
            child
        )

    const badgeLabel = (i: number) =>
        badgeStyle === "numberPadded"
            ? String(i + 1).padStart(2, "0")
            : String(i + 1)

    const schema = faqSchema
        ? {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((it) => ({
                  "@type": "Question",
                  name: it.title,
                  acceptedAnswer: { "@type": "Answer", text: it.description },
              })),
          }
        : null

    if (count === 0) {
        return (
            <div
                style={{
                    ...style,
                    padding: 24,
                    color: mutedColor,
                    fontSize: 14,
                }}
            >
                Füge im Properties-Panel unter „Items" mindestens ein Item
                hinzu.
            </div>
        )
    }

    const list = (
        <div
            style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: itemGap,
            }}
        >
            {items.map((item, i) => {
                const isOpen = i === open
                const isHover = i === hover && !isOpen
                const hId = `${uid}-h-${i}`
                const pId = `${uid}-p-${i}`
                const button = (
                    <button
                        ref={(el) => {
                            buttonRefs.current[i] = el
                        }}
                        id={hId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={pId}
                        onClick={() => toggle(i)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        className="fma-btn"
                        style={{
                            all: "unset",
                            boxSizing: "border-box",
                            width: "100%",
                            minHeight: stacked ? 60 : 76,
                            display: "flex",
                            alignItems: "center",
                            gap: btnGap,
                            padding: `${Math.max(12, pad - 6)}px ${pad}px`,
                            cursor: "pointer",
                            color: isOpen ? activeTextColor : textColor,
                            transition: reduced ? "none" : "color 0.3s",
                            borderRadius: itemRadius,
                        }}
                    >
                        {badgeStyle !== "none" && (
                            <motion.span
                                aria-hidden="true"
                                initial={false}
                                animate={{
                                    backgroundColor: isOpen
                                        ? badgeActiveBg
                                        : badgeBg,
                                    color: isOpen ? badgeActiveText : textColor,
                                }}
                                transition={{ duration: reduced ? 0 : 0.3 }}
                                style={{
                                    flexShrink: 0,
                                    width: badgeSize,
                                    height: badgeSize,
                                    borderRadius: 999,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: stacked ? 13 : 14,
                                    fontFamily:
                                        (bodyFont && bodyFont.fontFamily) ||
                                        "inherit",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {badgeStyle === "dot" ? null : badgeLabel(i)}
                            </motion.span>
                        )}
                        <span
                            style={{
                                flex: "1 1 auto",
                                minWidth: 0,
                                ...titleStyle,
                            }}
                        >
                            {item.title}
                        </span>
                        <Icon
                            type={iconType}
                            open={isOpen}
                            color={isOpen ? activeTextColor : textColor}
                            transition={transition}
                        />
                    </button>
                )
                return (
                    <motion.div
                        key={i}
                        initial={false}
                        animate={{
                            backgroundColor: isOpen
                                ? activeBg
                                : isHover
                                  ? hoverBg
                                  : "rgba(0, 0, 0, 0)",
                        }}
                        transition={{ duration: reduced ? 0 : 0.3 }}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(-1)}
                        style={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: itemRadius,
                        }}
                    >
                        {showProgress &&
                            autoplayOn &&
                            isOpen &&
                            !paused &&
                            !reduced && (
                                <motion.div
                                    key={`${open}-${paused}`}
                                    aria-hidden="true"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                        duration: autoplay,
                                        ease: "linear",
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: 3,
                                        background: progressColor,
                                        transformOrigin: "0% 50%",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        {React.createElement(
                            titleTag,
                            {
                                ref: (el) => {
                                    headerRefs.current[i] = el
                                },
                                style: { margin: 0, font: "inherit" },
                            },
                            button
                        )}
                        <motion.div
                            id={pId}
                            role="region"
                            aria-labelledby={hId}
                            aria-hidden={!isOpen}
                            initial={false}
                            animate={{ height: isOpen ? "auto" : 0 }}
                            transition={transition}
                            style={{ overflow: "hidden" }}
                        >
                            <div
                                ref={(el) => {
                                    innerRefs.current[i] = el
                                }}
                                style={{
                                    padding: `0 ${pad}px ${pad}px ${
                                        badgeStyle === "none"
                                            ? pad
                                            : pad + badgeSize + btnGap
                                    }px`,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {stacked && (
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isOpen ? 1 : 0.9,
                                            opacity: isOpen ? 1 : 0,
                                        }}
                                        transition={transition}
                                        style={{
                                            position: "relative",
                                            width: "100%",
                                            aspectRatio: String(imageAspect),
                                            borderRadius: Math.min(
                                                imageRadius,
                                                18
                                            ),
                                            overflow: "hidden",
                                        }}
                                    >
                                        {imgLink(
                                            item,
                                            isOpen,
                                            <Visual
                                                item={item}
                                                index={i}
                                                active={isOpen}
                                            />
                                        )}
                                    </motion.div>
                                )}
                                <p
                                    style={{
                                        margin: 0,
                                        maxWidth: 560,
                                        color: mutedColor,
                                        whiteSpace: "pre-line",
                                        ...bodyFont,
                                    }}
                                >
                                    {item.description}
                                </p>
                                {showCta && item.ctaLabel && (
                                    <a
                                        href={item.ctaLink || undefined}
                                        target={
                                            item.ctaLink && item.ctaNewTab
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            item.ctaLink && item.ctaNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        tabIndex={isOpen ? 0 : -1}
                                        className="fma-cta"
                                        style={{
                                            alignSelf: "flex-start",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                            minHeight:
                                                ctaStyle === "button" ? 44 : 32,
                                            padding:
                                                ctaStyle === "button"
                                                    ? "0 20px"
                                                    : 0,
                                            marginTop: 4,
                                            borderRadius: 999,
                                            background:
                                                ctaStyle === "button"
                                                    ? ctaBg
                                                    : "transparent",
                                            color:
                                                ctaStyle === "button"
                                                    ? ctaText
                                                    : activeTextColor,
                                            fontFamily:
                                                (bodyFont &&
                                                    bodyFont.fontFamily) ||
                                                "inherit",
                                            fontSize: 15,
                                            fontWeight: 500,
                                            textDecoration: "none",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {item.ctaLabel}
                                        <svg
                                            width={14}
                                            height={14}
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.6}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M3 8h10M9 4l4 4-4 4" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )
            })}
        </div>
    )

    const visualCol = !stacked && (
        <div
            ref={colRef}
            aria-live="polite"
            style={{
                position: "relative",
                width: `${imageWidth}%`,
                flexShrink: 0,
                alignSelf: "stretch",
                minHeight: imgH,
            }}
        >
            <motion.div
                initial={false}
                animate={{ y: shift }}
                transition={transition}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: imgH,
                }}
            >
                {items.map((item, i) => {
                    const active = i === shown
                    return (
                        <motion.div
                            key={i}
                            aria-hidden={!active}
                            initial={false}
                            animate={{
                                opacity: active ? 1 : 0,
                                scale: active ? 1 : 0.86,
                                borderRadius: active
                                    ? imageRadius
                                    : Math.max(imageRadius, imgH / 2),
                            }}
                            transition={transition}
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                                zIndex: active ? 2 : 1,
                            }}
                        >
                            {imgLink(
                                item,
                                active,
                                <Visual item={item} index={i} active={active} />
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>
        </div>
    )

    return (
        <section
            ref={rootRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            style={{
                ...style,
                boxSizing: "border-box",
                width: "100%",
                padding: `${padY}px ${padX}px`,
                background: background ?? "#FFFFFF",
                borderRadius: radius,
                color: textColor,
            }}
        >
            {header}
            <style>
                {`.fma-btn:focus-visible,.fma-cta:focus-visible{outline:2px solid currentColor;outline-offset:2px}` +
                    (isStatic
                        ? ""
                        : `.fma-cta svg{transition:transform .25s ease}.fma-cta:hover svg{transform:translateX(3px)}.fma-img>*{transition:transform .6s cubic-bezier(.2,.8,.2,1)}.fma-img:hover>*{transform:scale(1.03)}@media (prefers-reduced-motion:reduce){.fma-cta svg,.fma-img>*{transition:none}.fma-img:hover>*{transform:none}}`)}
            </style>
            <div
                style={{
                    width: "100%",
                    maxWidth: maxWidth > 0 ? maxWidth : "none",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection:
                        imagePosition === "left" ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: stacked ? 0 : columnGap,
                }}
            >
                {list}
                {visualCol}
            </div>
            {schema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            )}
        </section>
    )
}

FollowMorphAccordion.displayName = "Follow Morph Accordion"

addPropertyControls(FollowMorphAccordion, {
    showHeader: {
        type: ControlType.Boolean,
        title: "Header",
        defaultValue: false,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "",
        hidden: (p) => !p.showHeader,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "How it works",
        hidden: (p) => !p.showHeader,
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        displayTextArea: true,
        defaultValue: "",
        hidden: (p) => !p.showHeader,
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "84px",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        hidden: (p) => !p.showHeader,
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#0A0A0A",
        hidden: (p) => !p.showHeader,
    },
    headingTag: {
        type: ControlType.Enum,
        title: "Heading Tag",
        options: ["h1", "h2", "h3"],
        optionTitles: ["H1", "H2", "H3"],
        displaySegmentedControl: true,
        defaultValue: "h2",
        hidden: (p) => !p.showHeader,
    },
    headerAlign: {
        type: ControlType.Enum,
        title: "Header Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: (p) => !p.showHeader,
    },
    headerGap: {
        type: ControlType.Number,
        title: "Header Gap",
        defaultValue: 64,
        min: 0,
        max: 200,
        hidden: (p) => !p.showHeader,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New step",
                },
                description: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue:
                        "Describe this step in two or three short sentences.",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                color: {
                    type: ControlType.Color,
                    title: "Fallback BG",
                    defaultValue: "#111111",
                    description: "Used when no image is set.",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Fallback Shape",
                    defaultValue: "#FFFFFF",
                },
                ctaLabel: {
                    type: ControlType.String,
                    title: "CTA Label",
                    defaultValue: "Learn more",
                },
                ctaLink: { type: ControlType.Link, title: "CTA Link" },
                ctaNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    defaultOpen: {
        type: ControlType.Number,
        title: "Open Item",
        defaultValue: 1,
        min: -1,
        max: 11,
        step: 1,
        displayStepper: true,
        description: "0 = first item, -1 = all closed.",
    },
    allowCollapse: {
        type: ControlType.Boolean,
        title: "Collapsible",
        defaultValue: true,
        description: "Clicking the open item closes it.",
    },
    autoplay: {
        type: ControlType.Number,
        title: "Autoplay",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "s",
        description: "0 = off. Pauses on hover and focus.",
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
        hidden: (p) => !p.autoplay,
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#0A0A0A",
        hidden: (p) => !p.autoplay || !p.showProgress,
    },

    maxWidth: {
        type: ControlType.Number,
        title: "Content Width",
        defaultValue: 1280,
        min: 0,
        max: 2400,
        step: 10,
        unit: "px",
        description: "Max width of the content. 0 = full width.",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 112,
        min: 0,
        max: 300,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 40,
        min: 0,
        max: 200,
    },
    imagePosition: {
        type: ControlType.Enum,
        title: "Image Side",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        displaySegmentedControl: true,
        defaultValue: "right",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 46,
        min: 20,
        max: 70,
        unit: "%",
    },
    imageAspect: {
        type: ControlType.Number,
        title: "Image Ratio",
        defaultValue: 1.4,
        min: 0.5,
        max: 2.5,
        step: 0.05,
        description: "Width ÷ height. 1 = square, 1.78 = 16:9.",
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 72,
        min: 0,
        max: 200,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Below",
        defaultValue: 1100,
        min: 0,
        max: 2000,
        unit: "px",
        description: "Below this width the titles get a bit smaller.",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 760,
        min: 0,
        max: 1600,
        unit: "px",
        description: "Below this width the image moves into the open item.",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 80,
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 6,
        min: 0,
        max: 40,
    },
    itemPadding: {
        type: ControlType.Number,
        title: "Item Padding",
        defaultValue: 28,
        min: 8,
        max: 56,
    },
    itemRadius: {
        type: ControlType.Number,
        title: "Item Radius",
        defaultValue: 20,
        min: 0,
        max: 48,
    },

    textColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#0A0A0A",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Title Active",
        defaultValue: "#0A0A0A",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Body Text",
        defaultValue: "#555555",
    },
    activeBg: {
        type: ControlType.Color,
        title: "Active BG",
        defaultValue: "#F3F3F3",
    },
    hoverBg: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "rgba(0, 0, 0, 0.04)",
    },

    badgeStyle: {
        type: ControlType.Enum,
        title: "Badge",
        options: ["number", "numberPadded", "dot", "none"],
        optionTitles: ["1, 2, 3", "01, 02, 03", "Dot", "None"],
        defaultValue: "number",
    },
    badgeBg: {
        type: ControlType.Color,
        title: "Badge BG",
        defaultValue: "rgba(0, 0, 0, 0.06)",
        hidden: (p) => p.badgeStyle === "none",
    },
    badgeActiveBg: {
        type: ControlType.Color,
        title: "Badge Active",
        defaultValue: "#0A0A0A",
        hidden: (p) => p.badgeStyle === "none",
    },
    badgeActiveText: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#FFFFFF",
        hidden: (p) => p.badgeStyle === "none" || p.badgeStyle === "dot",
    },
    showCta: { type: ControlType.Boolean, title: "CTA", defaultValue: true },
    ctaStyle: {
        type: ControlType.Enum,
        title: "CTA Style",
        options: ["button", "link"],
        optionTitles: ["Button", "Link"],
        displaySegmentedControl: true,
        defaultValue: "button",
        hidden: (p) => !p.showCta,
    },
    ctaBg: {
        type: ControlType.Color,
        title: "CTA BG",
        defaultValue: "#0A0A0A",
        hidden: (p) => !p.showCta || p.ctaStyle !== "button",
    },
    ctaText: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showCta || p.ctaStyle !== "button",
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["chevron", "plus", "none"],
        optionTitles: ["Chevron", "Plus", "None"],
        displaySegmentedControl: true,
        defaultValue: "chevron",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "28px",
            letterSpacing: "-0.01em",
            lineHeight: "1.15em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.6em",
        },
    },

    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", duration: 0.7, bounce: 0.12 },
    },

    titleTag: {
        type: ControlType.Enum,
        title: "Title Tag",
        options: ["h2", "h3", "h4", "div"],
        optionTitles: ["H2", "H3", "H4", "Div"],
        displaySegmentedControl: true,
        defaultValue: "h3",
        description: "Heading level for SEO and screen readers.",
    },
    faqSchema: {
        type: ControlType.Boolean,
        title: "FAQ Schema",
        defaultValue: false,
        description:
            "Adds FAQPage structured data for Google. Only for real Q&A content.",
    },
})
