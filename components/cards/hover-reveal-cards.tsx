import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const FALLBACKS = [
    "linear-gradient(135deg,#ff9a8b,#ff6a88)",
    "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
    "linear-gradient(135deg,#f6d365,#fda085)",
    "linear-gradient(135deg,#84fab0,#8fd3f4)",
    "linear-gradient(135deg,#cfd9df,#e2ebf0)",
]

const GAP = 28 // distance between the cursor and the card

// One-click looks. Choosing a preset overrides colors and card styling;
// switch back to "Custom" to use your own values.
const PRESETS: Record<string, any> = {
    dark: {
        background: "#0d0d0d",
        color: "#f5f5f5",
        metaColor: "rgba(255,255,255,0.5)",
        dividerColor: "rgba(255,255,255,0.14)",
        cardBackground: "#ffffff",
        cardTextColor: "#111111",
        cardMutedColor: "#6b6b6b",
        accentColor: "#ffffff",
        radius: 14,
        dim: 0.25,
        blurOthers: 4,
        uppercase: false,
        cardBorder: "none",
        cardShadow: "0 20px 50px rgba(0,0,0,0.45)",
        glass: false,
    },
    light: {
        background: "#f6f5f2",
        color: "#141414",
        metaColor: "rgba(20,20,20,0.5)",
        dividerColor: "rgba(20,20,20,0.14)",
        cardBackground: "#ffffff",
        cardTextColor: "#141414",
        cardMutedColor: "#6b6b6b",
        accentColor: "#141414",
        radius: 10,
        dim: 0.3,
        blurOthers: 3,
        uppercase: false,
        cardBorder: "none",
        cardShadow: "0 20px 50px rgba(0,0,0,0.15)",
        glass: false,
    },
    brutalist: {
        background: "#f1efe4",
        color: "#000000",
        metaColor: "rgba(0,0,0,0.65)",
        dividerColor: "#000000",
        cardBackground: "#ffffff",
        cardTextColor: "#000000",
        cardMutedColor: "#333333",
        accentColor: "#ff3b00",
        radius: 0,
        dim: 0.35,
        blurOthers: 0,
        uppercase: true,
        cardBorder: "2px solid #000000",
        cardShadow: "8px 8px 0 #000000",
        glass: false,
    },
    glass: {
        background: "linear-gradient(135deg,#1b1b3a,#2d1b4e)",
        color: "#ffffff",
        metaColor: "rgba(255,255,255,0.6)",
        dividerColor: "rgba(255,255,255,0.18)",
        cardBackground: "rgba(255,255,255,0.14)",
        cardTextColor: "#ffffff",
        cardMutedColor: "rgba(255,255,255,0.75)",
        accentColor: "#b69cff",
        radius: 20,
        dim: 0.3,
        blurOthers: 5,
        uppercase: false,
        cardBorder: "1px solid rgba(255,255,255,0.25)",
        cardShadow: "0 20px 60px rgba(0,0,0,0.35)",
        glass: true,
    },
}

type FramerHref = React.ComponentProps<typeof Link>["href"]

type Row = {
    title: string
    meta: string
    description: string
    src: string
    link: FramerHref
}

const toSrc = (v: any): string =>
    typeof v === "string" ? v : v && typeof v.src === "string" ? v.src : ""

const str = (v: any) => (typeof v === "string" ? v : "")

// Preserve Framer page references instead of flattening them into strings.
// Framer's Link component resolves them using the current project/router.
const NOT_A_DOMAIN = /\.(html?|php|pdf|png|jpe?g|gif|svg|webp|zip|txt)$/i
const resolveHref = (value: unknown, depth = 0): FramerHref => {
    if (depth > 5 || value == null) return undefined

    if (typeof value === "object") {
        const reference = value as Record<string, unknown>
        if (typeof reference.webPageId === "string") {
            return value as FramerHref
        }
        const nested =
            reference.href ??
            reference.url ??
            reference.link ??
            reference.path ??
            reference.value
        return resolveHref(nested, depth + 1)
    }

    if (typeof value !== "string") return undefined
    const href = value.trim()
    if (!href) return undefined

    // Explicit supported URLs and relative routes are kept intact.
    if (/^(https?:|mailto:|tel:|sms:|whatsapp:|ftp:)/i.test(href)) return href
    if (href.startsWith("//")) return "https:" + href
    if (/^(\/|\.\/|\.\.\/|#|\?)/.test(href)) return href
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return undefined

    const host = href.split(/[/?#]/)[0]
    if (
        /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(host) &&
        !NOT_A_DOMAIN.test(host)
    )
        return "https://" + href

    // Legacy bare slugs are supported, but must match a real page path.
    return "/" + href
}

function ProjectLink({
    href,
    newTab,
    disabled,
    children,
}: {
    href: FramerHref
    newTab: boolean
    disabled: boolean
    children: React.ReactElement
}) {
    if (!href || disabled) return children
    return (
        <Link href={href} openInNewTab={newTab}>
            {children}
        </Link>
    )
}

const toRow = (it: any): Row => ({
    title: str(it?.title),
    meta: str(it?.meta),
    description: str(it?.description),
    src: toSrc(it?.image),
    link: resolveHref(it?.link),
})

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/**
 * Hover Reveal List
 * A list of projects. Hovering (or tabbing to) a row reveals a card with an
 * image, title and short description that follows the cursor with a smooth
 * lag and tilt. Other rows dim and blur, the active row gets an accent line
 * and an arrow. One-click style presets included.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function HoverRevealList(props) {
    // Presets override colors and card styling.
    const P: any =
        props.preset && props.preset !== "custom" && PRESETS[props.preset]
            ? { ...props, ...PRESETS[props.preset] }
            : props

    const {
        items,
        font,
        color,
        metaColor,
        background,
        dim,
        blurOthers,
        uppercase,
        nudge,
        rowPadding,
        divider,
        dividerColor,
        showIndex,
        showRowMeta,
        accent,
        accentColor,
        accentHeight,
        showArrow,
        arrowSize,
        cardMode,
        imageWidth,
        aspectRatio,
        radius,
        cardBackground,
        cardTextColor,
        cardMutedColor,
        cardPadding,
        cardBorder,
        cardShadow,
        glass,
        showMetaInCard,
        reveal,
        newTab,
        previewRow,
    } = P

    const isStaticRenderer = useIsStaticRenderer()
    const rows: Row[] = (items || []).map(toRow)

    const rootRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const target = useRef({ x: 0, y: 0 })
    const cur = useRef({ x: 0, y: 0, r: 0, ox: GAP })
    const hideTimer = useRef<any>(null)
    const propsRef = useRef(props)
    propsRef.current = props

    const [active, setActive] = useState(-1)
    const [shown, setShown] = useState(false)

    const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const disableAnimations = isStaticRenderer || reduced

    // Canvas/export use a deterministic, visible preview with no animation.
    const activeIdx = isStaticRenderer
        ? clamp((previewRow || 1) - 1, 0, Math.max(rows.length - 1, 0))
        : active
    const cardVisible =
        rows.length > 0 && (isStaticRenderer || (shown && active >= 0))

    // Preload every image so switching rows never flashes.
    useEffect(() => {
        if (isStaticRenderer) return
        rows.forEach((r) => {
            if (r.src) {
                const im = new Image()
                im.src = r.src
            }
        })
    }, [items, isStaticRenderer])

    // Follow loop: runs only while the card is shown.
    useEffect(() => {
        if (isStaticRenderer || !shown) return
        let id = 0
        const tick = () => {
            const p = propsRef.current
            const wrap = wrapRef.current
            const root = rootRef.current
            if (wrap && root) {
                const c = cur.current
                const t = target.current
                const k = reduced ? 1 : clamp(p.follow, 0.03, 1)
                const vx = t.x - c.x
                c.x += vx * k
                c.y += (t.y - c.y) * k
                const rt = reduced ? 0 : clamp(vx * p.tilt * 0.08, -15, 15)
                c.r += (rt - c.r) * 0.15

                const w = wrap.offsetWidth
                const h = wrap.offsetHeight
                const rect = root.getBoundingClientRect()

                // Card sits to the right of the cursor, flipping to the left
                // when it would run off the screen.
                let wantOx = -w / 2
                if (p.anchor !== "center") {
                    const flip =
                        rect.left + c.x + GAP + w > window.innerWidth - 12
                    wantOx = flip ? -(GAP + w) : GAP
                }
                c.ox += (wantOx - c.ox) * (reduced ? 1 : 0.18)

                // Keep the card inside the viewport vertically.
                let y = c.y - h / 2 + p.offsetY
                const absTop = rect.top + y
                const clampedTop = clamp(
                    absTop,
                    8,
                    Math.max(8, window.innerHeight - h - 8)
                )
                y += clampedTop - absTop

                wrap.style.transform = `translate3d(${c.x + c.ox + p.offsetX}px, ${y}px, 0) rotate(${c.r}deg)`
            }
            id = requestAnimationFrame(tick)
        }
        id = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(id)
    }, [shown, isStaticRenderer, reduced])

    // Clear pending touch timers when switching into a static renderer.
    useEffect(() => {
        if (isStaticRenderer) clearTimeout(hideTimer.current)
        return () => clearTimeout(hideTimer.current)
    }, [isStaticRenderer])

    // Helps debugging: tell the console when a link value can't be used.
    useEffect(() => {
        ;(items || []).forEach((it: any, i: number) => {
            if (it && it.link && !resolveHref(it.link)) {
                console.warn(
                    `[HoverRevealList] Row ${i + 1} (${str(it.title)}): couldn't read this link value.`,
                    it.link
                )
            }
        })
    }, [items])

    const toLocal = (clientX: number, clientY: number) => {
        const root = rootRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        target.current.x = clientX - rect.left
        target.current.y = clientY - rect.top
    }

    const revealAt = (i: number) => {
        if (isStaticRenderer) return
        if (!shown) {
            // Start at the target instead of flying in from the corner.
            cur.current.x = target.current.x
            cur.current.y = target.current.y
            cur.current.r = 0
            cur.current.ox =
                propsRef.current.anchor === "center"
                    ? -propsRef.current.imageWidth / 2
                    : GAP
            setShown(true)
        }
        setActive(i)
    }

    const onRowEnter = (i: number, e: React.PointerEvent) => {
        if (isStaticRenderer || e.pointerType !== "mouse") return
        toLocal(e.clientX, e.clientY)
        revealAt(i)
    }

    const onRowDown = (i: number, e: React.PointerEvent) => {
        if (isStaticRenderer || e.pointerType === "mouse") return
        // Touch / pen: show the card at the tap, then hide it again.
        clearTimeout(hideTimer.current)
        toLocal(e.clientX, e.clientY)
        revealAt(i)
        hideTimer.current = setTimeout(() => {
            setShown(false)
            setActive(-1)
        }, 1400)
    }

    // Keyboard: tabbing to a row reveals its card next to the row.
    const onRowFocus = (i: number, e: React.FocusEvent) => {
        if (isStaticRenderer) return
        const el = e.currentTarget as HTMLElement
        let keyboard = true
        try {
            keyboard = el.matches(":focus-visible")
        } catch (err) {}
        if (!keyboard) return
        const root = rootRef.current
        if (!root) return
        const rr = root.getBoundingClientRect()
        const er = el.getBoundingClientRect()
        target.current.x = er.left - rr.left + er.width * 0.5
        target.current.y = er.top - rr.top + er.height / 2
        revealAt(i)
    }

    const onRowBlur = (e: React.FocusEvent) => {
        if (isStaticRenderer) return
        const next = e.relatedTarget as Node | null
        if (next && rootRef.current && rootRef.current.contains(next)) return
        setShown(false)
        setActive(-1)
    }

    // Let Framer's Link handle navigation. Never override a cancelled click
    // with window.location/window.open: that bypasses the preview router.
    const onRowClick = (_r: Row, e: React.MouseEvent) => {
        if (isStaticRenderer) e.preventDefault()
    }

    const onMove = (e: React.PointerEvent) => {
        if (isStaticRenderer || e.pointerType !== "mouse") return
        toLocal(e.clientX, e.clientY)
    }

    const onLeave = () => {
        if (isStaticRenderer) return
        setShown(false)
        setActive(-1)
    }

    const showText = cardMode === "card"
    const family = font?.fontFamily

    const innerStyle: React.CSSProperties = {
        position: "relative",
        boxSizing: "border-box",
        display: "grid",
        width: imageWidth,
        borderRadius: radius,
        overflow: "hidden",
        background: showText ? cardBackground : "transparent",
        border: showText ? cardBorder : "none",
        backdropFilter: showText && glass ? "blur(18px)" : undefined,
        WebkitBackdropFilter: showText && glass ? "blur(18px)" : undefined,
        opacity: cardVisible ? 1 : 0,
        transform:
            !disableAnimations && reveal === "scale"
                ? cardVisible
                    ? "scale(1)"
                    : "scale(0.5)"
                : "none",
        clipPath:
            !disableAnimations && reveal === "clip"
                ? cardVisible
                    ? "inset(0% 0% 0% 0%)"
                    : "inset(0% 0% 100% 0%)"
                : "none",
        transition: disableAnimations
            ? "none"
            : "opacity 0.35s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1), clip-path 0.5s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: cardShadow,
    }

    const wrapStyle: React.CSSProperties = isStaticRenderer
        ? {
              position: "absolute",
              left: "62%",
              top: "50%",
              width: imageWidth,
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
              zIndex: 5,
          }
        : {
              position: "absolute",
              left: 0,
              top: 0,
              width: imageWidth,
              pointerEvents: "none",
              willChange: "transform",
              zIndex: 5,
          }

    const slow = disableAnimations ? "none" : "0.4s cubic-bezier(0.22,1,0.36,1)"

    return (
        <div
            ref={rootRef}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "visible",
                background,
            }}
        >
            {rows.map((r, i) => {
                const isActive = i === activeIdx
                const dimmed = activeIdx >= 0 && !isActive
                const Tag: any = r.link ? "a" : "div"
                return (
                    <ProjectLink
                        key={i}
                        href={r.link}
                        newTab={newTab}
                        disabled={isStaticRenderer}
                    >
                        <Tag
                            tabIndex={0}
                            onPointerEnter={(e: React.PointerEvent) =>
                                onRowEnter(i, e)
                            }
                            onPointerDown={(e: React.PointerEvent) =>
                                onRowDown(i, e)
                            }
                            onFocus={(e: React.FocusEvent) => onRowFocus(i, e)}
                            onBlur={onRowBlur}
                            onClick={(e: React.MouseEvent) => onRowClick(r, e)}
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "baseline",
                                justifyContent: "space-between",
                                gap: 16,
                                padding: `${rowPadding}px 0`,
                                borderBottom: divider
                                    ? `1px solid ${dividerColor}`
                                    : "none",
                                color,
                                textDecoration: "none",
                                cursor: r.link ? "pointer" : "default",
                                opacity: dimmed ? dim : 1,
                                filter:
                                    dimmed && blurOthers > 0
                                        ? `blur(${blurOthers}px)`
                                        : "none",
                                transition: disableAnimations
                                    ? "none"
                                    : "opacity 0.3s ease, filter 0.3s ease",
                                outlineOffset: 2,
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: 20,
                                    transform: `translateX(${isActive ? nudge : 0}px)`,
                                    transition: disableAnimations
                                        ? "none"
                                        : `transform ${slow}`,
                                }}
                            >
                                {showIndex ? (
                                    <span
                                        style={{
                                            fontSize: 14,
                                            color: metaColor,
                                            fontFamily: family,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                ) : null}
                                <span
                                    style={{
                                        fontSize: 44,
                                        fontWeight: 500,
                                        lineHeight: 1.1,
                                        letterSpacing: "-0.02em",
                                        ...font,
                                        textTransform: uppercase
                                            ? "uppercase"
                                            : undefined,
                                    }}
                                >
                                    {r.title}
                                </span>
                            </span>

                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                {showRowMeta && r.meta ? (
                                    <span
                                        style={{
                                            fontSize: 14,
                                            color: metaColor,
                                            fontFamily: family,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {r.meta}
                                    </span>
                                ) : null}
                                {showArrow ? (
                                    <span
                                        aria-hidden
                                        style={{
                                            display: "flex",
                                            opacity: isActive ? 1 : 0,
                                            transform: isActive
                                                ? "translate(0px,0px)"
                                                : "translate(-8px,8px)",
                                            transition: disableAnimations
                                                ? "none"
                                                : `opacity 0.3s ease, transform ${slow}`,
                                        }}
                                    >
                                        <svg
                                            width={arrowSize}
                                            height={arrowSize}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M7 17L17 7M8 7h9v9" />
                                        </svg>
                                    </span>
                                ) : null}
                            </span>

                            {accent ? (
                                <span
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: divider ? -1 : 0,
                                        height: accentHeight,
                                        background: accentColor,
                                        transformOrigin: "left center",
                                        transform: `scaleX(${isActive ? 1 : 0})`,
                                        transition: disableAnimations
                                            ? "none"
                                            : "transform 0.5s cubic-bezier(0.22,1,0.36,1)",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : null}
                        </Tag>
                    </ProjectLink>
                )
            })}

            {/* The card. All rows' content is stacked in one grid cell, so the
                card keeps a steady height while images and text crossfade. */}
            <div ref={wrapRef} style={wrapStyle} aria-hidden>
                <div style={innerStyle}>
                    {rows.map((r, i) => (
                        <div
                            key={i}
                            style={{
                                gridArea: "1 / 1",
                                opacity: i === activeIdx ? 1 : 0,
                                transition: disableAnimations
                                    ? "none"
                                    : "opacity 0.3s ease",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: String(aspectRatio),
                                    background: r.src
                                        ? "transparent"
                                        : FALLBACKS[i % FALLBACKS.length],
                                }}
                            >
                                {r.src ? (
                                    <img
                                        src={r.src}
                                        alt=""
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
                                ) : null}
                            </div>
                            {showText ? (
                                <div
                                    style={{
                                        padding: cardPadding,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
                                        fontFamily: family,
                                    }}
                                >
                                    {showMetaInCard && r.meta ? (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                letterSpacing: "0.04em",
                                                textTransform: "uppercase",
                                                color: cardMutedColor,
                                            }}
                                        >
                                            {r.meta}
                                        </div>
                                    ) : null}
                                    <div
                                        style={{
                                            fontSize: 20,
                                            fontWeight: 600,
                                            lineHeight: 1.2,
                                            color: cardTextColor,
                                            textTransform: uppercase
                                                ? "uppercase"
                                                : undefined,
                                        }}
                                    >
                                        {r.title}
                                    </div>
                                    {r.description ? (
                                        <div
                                            style={{
                                                fontSize: 14,
                                                lineHeight: 1.5,
                                                color: cardMutedColor,
                                            }}
                                        >
                                            {r.description}
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

HoverRevealList.defaultProps = {
    preset: "custom",
    items: [
        {
            title: "Aurora Studio",
            meta: "Branding · 2025",
            description:
                "Brand identity and launch website for a boutique creative studio.",
        },
        {
            title: "Northwind Labs",
            meta: "Web design · 2025",
            description:
                "Marketing site and design system for a climate-tech startup.",
        },
        {
            title: "Lumen Identity",
            meta: "Branding · 2024",
            description:
                "Visual identity, packaging and guidelines for a lighting brand.",
        },
        {
            title: "Atlas Mobile",
            meta: "App design · 2024",
            description:
                "Mobile app design for tracking trips, budgets and itineraries.",
        },
        {
            title: "Mirage Interiors",
            meta: "Web design · 2023",
            description: "Portfolio website for an interior design practice.",
        },
    ],
    color: "#ffffff",
    metaColor: "rgba(255,255,255,0.5)",
    background: "rgba(0,0,0,0)",
    dim: 0.25,
    blurOthers: 3,
    uppercase: false,
    nudge: 16,
    rowPadding: 22,
    divider: true,
    dividerColor: "rgba(255,255,255,0.15)",
    showIndex: true,
    showRowMeta: true,
    accent: true,
    accentColor: "#ffffff",
    accentHeight: 2,
    showArrow: true,
    arrowSize: 28,
    cardMode: "card",
    imageWidth: 300,
    aspectRatio: 1.3,
    radius: 14,
    cardBackground: "#ffffff",
    cardTextColor: "#111111",
    cardMutedColor: "#6b6b6b",
    cardPadding: 18,
    cardBorder: "none",
    cardShadow: "0 20px 50px rgba(0,0,0,0.25)",
    glass: false,
    showMetaInCard: true,
    reveal: "scale",
    anchor: "right",
    follow: 0.14,
    tilt: 1,
    offsetX: 0,
    offsetY: 0,
    newTab: false,
    previewRow: 1,
    width: 720,
    height: 440,
}

const custom = (p: any) => p.preset !== "custom"

addPropertyControls(HoverRevealList, {
    preset: {
        type: ControlType.Enum,
        title: "Style preset",
        options: ["custom", "dark", "light", "brutalist", "glass"],
        optionTitles: [
            "Custom",
            "Dark editorial",
            "Light minimal",
            "Brutalist",
            "Soft glass",
        ],
    },
    items: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                meta: { type: ControlType.String, title: "Category" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                image: { type: ControlType.Image, title: "Image" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "44px",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        hidden: custom,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        hidden: custom,
    },
    color: { type: ControlType.Color, title: "Text", hidden: custom },
    metaColor: { type: ControlType.Color, title: "Category", hidden: custom },
    dim: {
        type: ControlType.Number,
        title: "Dim others",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: custom,
    },
    blurOthers: {
        type: ControlType.Number,
        title: "Blur others",
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
        hidden: custom,
    },
    nudge: {
        type: ControlType.Number,
        title: "Nudge",
        min: 0,
        max: 60,
        unit: "px",
    },
    rowPadding: {
        type: ControlType.Number,
        title: "Row spacing",
        min: 4,
        max: 80,
        unit: "px",
    },
    divider: { type: ControlType.Boolean, title: "Divider" },
    dividerColor: {
        type: ControlType.Color,
        title: "Line color",
        hidden: (p) => !p.divider || custom(p),
    },
    accent: { type: ControlType.Boolean, title: "Accent line" },
    accentColor: {
        type: ControlType.Color,
        title: "Accent color",
        hidden: (p) => !p.accent || custom(p),
    },
    accentHeight: {
        type: ControlType.Number,
        title: "Accent weight",
        min: 1,
        max: 8,
        unit: "px",
        hidden: (p) => !p.accent,
    },
    showArrow: { type: ControlType.Boolean, title: "Arrow" },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow size",
        min: 14,
        max: 64,
        unit: "px",
        hidden: (p) => !p.showArrow,
    },
    showIndex: { type: ControlType.Boolean, title: "Numbers" },
    showRowMeta: { type: ControlType.Boolean, title: "Row category" },
    cardMode: {
        type: ControlType.Enum,
        title: "Hover card",
        options: ["card", "image"],
        optionTitles: ["Image + details", "Image only"],
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Card width",
        min: 160,
        max: 600,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Image ratio",
        min: 0.5,
        max: 2.5,
        step: 0.05,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        unit: "px",
        hidden: custom,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card color",
        hidden: (p) => p.cardMode !== "card" || custom(p),
    },
    cardTextColor: {
        type: ControlType.Color,
        title: "Card title",
        hidden: (p) => p.cardMode !== "card" || custom(p),
    },
    cardMutedColor: {
        type: ControlType.Color,
        title: "Card text",
        hidden: (p) => p.cardMode !== "card" || custom(p),
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card padding",
        min: 8,
        max: 40,
        unit: "px",
        hidden: (p) => p.cardMode !== "card",
    },
    showMetaInCard: {
        type: ControlType.Boolean,
        title: "Category tag",
        hidden: (p) => p.cardMode !== "card",
    },
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["fade", "scale", "clip"],
        optionTitles: ["Fade", "Scale", "Wipe"],
    },
    anchor: {
        type: ControlType.Enum,
        title: "Card position",
        options: ["right", "center"],
        optionTitles: ["Beside cursor", "On cursor"],
    },
    follow: {
        type: ControlType.Number,
        title: "Follow speed",
        min: 0.03,
        max: 1,
        step: 0.01,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 3,
        step: 0.1,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        min: -300,
        max: 300,
        unit: "px",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: -300,
        max: 300,
        unit: "px",
    },
    newTab: { type: ControlType.Boolean, title: "New tab" },
    previewRow: {
        type: ControlType.Number,
        title: "Preview row",
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
    },
})
