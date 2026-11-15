// TeamFilterGrid — Framer code component
// Filterable team section: category chips with counts, Grid or Carousel layout,
// "+" opens a bio panel. Defaults match the "Meet the crew" canvas design:
// dark palette, 3-column grid, 20px gap, 6 members.

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Member = {
    image?: { src: string; alt?: string }
    name: string
    role: string
    team: string
    city: string
    since: string
    bio: string
}

type Colors = {
    background: string
    text: string
    muted: string
    chip: string
    surface: string
    button: string
    dot: string
    placeholder: string
}

type Props = {
    layout: "grid" | "carousel"
    eyebrow: string
    title: string
    allLabel: string
    members: Member[]
    columns: number
    minCardWidth: number
    photoRatio: number
    cardWidth: number
    gap: number
    radius: number
    padding: number
    showDot: boolean
    font: React.CSSProperties
    colors: Colors
    style?: React.CSSProperties
}

const pad = (n: number) => String(n).padStart(2, "0")

const defaultColors: Colors = {
    background: "#0B0B0B",
    text: "#F2EFE9",
    muted: "#9A958C",
    chip: "#1E1E1E",
    surface: "#161616",
    button: "#262626",
    dot: "#F2EFE9",
    placeholder: "#1E1E1E",
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function TeamFilterGrid(props: Props) {
    const {
        layout = "grid",
        eyebrow,
        title,
        allLabel,
        members = [],
        columns = 3,
        minCardWidth = 300,
        photoRatio = 1,
        cardWidth = 340,
        gap = 20,
        radius = 16,
        padding = 40,
        showDot = false,
        font,
        style,
    } = props
    const c: Colors = { ...defaultColors, ...props.colors }
    const isGrid = layout !== "carousel"
    const reduce = useReducedMotion()
    const spring = reduce
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 260, damping: 32 }

    const [filter, setFilter] = useState<string>("__all")
    const [index, setIndex] = useState(0)
    const [openKey, setOpenKey] = useState<number | null>(null)
    const [hoverKey, setHoverKey] = useState<number | null>(null)
    const [viewW, setViewW] = useState(1200)
    const viewport = useRef<HTMLDivElement>(null)

    // Track the available width (grid columns + carousel limits)
    useEffect(() => {
        const el = viewport.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => setViewW(e.contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Categories in first-seen order, with counts
    const teams = useMemo(() => {
        const map = new Map<string, number>()
        members.forEach((m) => {
            const t = (m.team || "").trim()
            if (t) map.set(t, (map.get(t) || 0) + 1)
        })
        return Array.from(map.entries())
    }, [members])

    const list = useMemo(
        () =>
            members
                .map((m, key) => ({ ...m, key }))
                .filter((m) => filter === "__all" || m.team?.trim() === filter),
        [members, filter]
    )

    // ---- Grid sizing: up to "columns", fewer when cards would drop below minCardWidth
    const cols = Math.max(
        1,
        Math.min(columns, Math.floor((viewW + gap) / (minCardWidth + gap)))
    )

    // ---- Carousel sizing
    const cw = Math.min(cardWidth, Math.max(220, viewW * 0.78))
    const panelW = Math.min(cw * 1.15, Math.max(0, viewW - cw - 1))
    const stacked = isGrid || viewW < 560 // bio opens over the photo

    const widths = list.map((m) =>
        openKey === m.key && !stacked ? cw + panelW : cw
    )
    const positions = widths.reduce<number[]>(
        (acc, w, i) => [...acc, i === 0 ? 0 : acc[i - 1] + widths[i - 1] + gap],
        []
    )
    const total =
        widths.reduce((s, w) => s + w, 0) + gap * Math.max(0, list.length - 1)
    const maxOffset = Math.max(0, total - viewW)
    const last = Math.max(0, list.length - 1)
    const x = -Math.min(positions[index] || 0, maxOffset)
    const atEnd = index >= last || (positions[index] || 0) >= maxOffset

    const go = (dir: number) =>
        setIndex((i) => Math.min(last, Math.max(0, i + dir)))

    const pickFilter = (f: string) => {
        setFilter(f)
        setIndex(0)
        setOpenKey(null)
    }

    const toggle = (key: number, i: number) => {
        setOpenKey((k) => (k === key ? null : key))
        setIndex(i)
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (!isGrid && e.key === "ArrowRight") go(1)
        if (!isGrid && e.key === "ArrowLeft") go(-1)
        if (e.key === "Escape") setOpenKey(null)
    }

    const focusKey = isGrid ? null : (openKey ?? hoverKey)

    const chip = (label: string, count: number, value: string) => {
        const active = filter === value
        return (
            <button
                key={value}
                onClick={() => pickFilter(value)}
                aria-pressed={active}
                style={{
                    ...btnReset,
                    fontSize: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 999,
                    background: active ? c.text : c.chip,
                    color: active ? c.background : c.text,
                    transition: "all .2s ease",
                }}
            >
                {label}
                <span style={{ opacity: 0.55, fontSize: 13 }}>{count}</span>
            </button>
        )
    }

    const arrow = (dir: number, disabled: boolean) => (
        <button
            onClick={() => go(dir)}
            disabled={disabled}
            aria-label={dir < 0 ? "Previous member" : "Next member"}
            style={{
                ...btnReset,
                width: 44,
                height: 44,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: disabled ? c.chip : c.text,
                color: disabled ? c.muted : c.background,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "default" : "pointer",
                transition: "all .2s ease",
            }}
        >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                    d={dir < 0 ? "M12 7H2M6 3L2 7l4 4" : "M2 7h10M8 3l4 4-4 4"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )

    const photo = (m: Member) =>
        m.image?.src ? (
            <img
                src={m.image.src}
                alt={m.image.alt || m.name}
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
        ) : (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 64,
                    color: c.muted,
                }}
            >
                {initials(m.name)}
            </div>
        )

    const plus = (m: Member & { key: number }, i: number) => {
        const open = openKey === m.key
        return (
            <button
                onClick={() => toggle(m.key, i)}
                aria-expanded={open}
                aria-label={(open ? "Close" : "Open") + " bio for " + m.name}
                style={{
                    ...btnReset,
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    background: open ? c.text : c.button,
                    color: open ? c.background : c.text,
                    opacity: open || isGrid || hoverKey === m.key || stacked ? 1 : 0,
                    transform: "rotate(" + (open ? 45 : 0) + "deg)",
                    transition: "all .25s ease",
                }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path
                        d="M6 1v10M1 6h10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            </button>
        )
    }

    const bio = (m: Member & { key: number }, overlay: boolean) => {
        const open = openKey === m.key
        return (
            <motion.div
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{
                    duration: reduce ? 0 : 0.25,
                    delay: open && !reduce ? 0.12 : 0,
                }}
                aria-hidden={!open}
                style={{
                    position: overlay ? "absolute" : "relative",
                    inset: overlay ? 0 : undefined,
                    zIndex: 1,
                    flex: "none",
                    width: overlay ? "100%" : panelW,
                    padding: 20,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    gap: 10,
                    background: c.surface,
                    pointerEvents: open ? "auto" : "none",
                }}
            >
                <span style={{ fontSize: 12, color: c.muted }}>
                    {[m.city, m.since && "Since " + m.since]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                    {m.bio}
                </p>
            </motion.div>
        )
    }

    // Flip card: photo on the front, bio on the back (matches the canvas Member Card)
    const flipCard = (
        m: Member & { key: number },
        i: number,
        size: React.CSSProperties
    ) => {
        const open = openKey === m.key
        const face: React.CSSProperties = {
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
        }
        return (
            <div style={{ position: "relative", perspective: 1200, ...size }}>
                <motion.div
                    initial={false}
                    animate={{ rotateY: open ? 180 : 0 }}
                    transition={
                        reduce
                            ? { duration: 0 }
                            : { type: "spring", duration: 0.7, bounce: 0.15 }
                    }
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                    }}
                >
                    <div style={{ ...face, background: c.placeholder }}>
                        {photo(m)}
                    </div>
                    <div
                        aria-hidden={!open}
                        style={{
                            ...face,
                            transform: "rotateY(180deg)",
                            background: c.surface,
                            padding: 20,
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            gap: 10,
                        }}
                    >
                        <span style={{ fontSize: 12, color: c.muted }}>
                            {[m.city, m.since && "Since " + m.since]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                            {m.bio}
                        </p>
                    </div>
                </motion.div>
                {plus(m, i)}
            </div>
        )
    }

    const meta = (m: Member, i: number, width?: number) => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0 4px",
                width,
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, lineHeight: 1.2 }}>{m.name}</span>
                <span
                    style={{
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.5,
                        color: c.muted,
                    }}
                >
                    {m.role}
                </span>
            </div>
            <span
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: c.muted,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {pad(i + 1)}
            </span>
        </div>
    )

    return (
        <section
            onKeyDown={onKey}
            aria-roledescription={isGrid ? undefined : "carousel"}
            aria-label={title}
            style={{
                ...style,
                fontFamily: "Inter, system-ui, sans-serif",
                ...font,
                width: "100%",
                background: c.background,
                color: c.text,
                display: "flex",
                flexDirection: "column",
                gap: 32,
                overflow: "hidden",
                boxSizing: "border-box",
                paddingBottom: padding,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 20,
                    padding: padding + "px " + padding + "px 0",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 16,
                            color: c.muted,
                        }}
                    >
                        {showDot && (
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 9,
                                    background: c.dot,
                                }}
                            />
                        )}
                        {eyebrow}
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "clamp(36px, 4.7vw, 56px)",
                            lineHeight: 1,
                            fontWeight: 400,
                            letterSpacing: "-0.02em",
                            whiteSpace: "pre-line",
                            maxWidth: 600,
                        }}
                    >
                        {title}
                    </h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {chip(allLabel, members.length, "__all")}
                        {teams.map(([t, n]) => chip(t, n, t))}
                    </div>
                </div>
                {!isGrid && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span
                            aria-live="polite"
                            style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}
                        >
                            {pad(list.length ? index + 1 : 0)}
                            <span style={{ color: c.muted }}> / {pad(list.length)}</span>
                        </span>
                        {arrow(-1, index === 0)}
                        {arrow(1, atEnd)}
                    </div>
                )}
            </div>

            {/* Cards */}
            <div
                style={{
                    padding: isGrid ? "0 6px" : "0 " + padding + "px",
                    boxSizing: "border-box",
                    width: "100%",
                }}
            >
                <div ref={viewport} style={{ width: "100%" }}>
                    {isGrid ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(" + cols + ", minmax(0, 1fr))",
                                gap,
                            }}
                        >
                            {list.map((m, i) => (
                                <article
                                    key={m.key}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14,
                                        minWidth: 0,
                                    }}
                                >
                                    {flipCard(m, i, {
                                        width: "100%",
                                        aspectRatio: "1 / " + photoRatio,
                                    })}
                                    {meta(m, i)}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            animate={{ x }}
                            transition={spring}
                            onPanEnd={(_, info) => {
                                if (info.offset.x < -50) go(1)
                                else if (info.offset.x > 50) go(-1)
                            }}
                            style={{ display: "flex", gap, touchAction: "pan-y" }}
                        >
                            {list.map((m, i) => {
                                const dimmed = focusKey !== null && focusKey !== m.key
                                return (
                                    <motion.article
                                        key={m.key}
                                        initial={false}
                                        animate={{
                                            width: widths[i],
                                            opacity: dimmed ? 0.45 : 1,
                                        }}
                                        transition={spring}
                                        onMouseEnter={() => setHoverKey(m.key)}
                                        onMouseLeave={() => setHoverKey(null)}
                                        style={{
                                            width: widths[i],
                                            flex: "none",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 14,
                                        }}
                                    >
                                        {stacked ? (
                                            flipCard(m, i, { width: cw, height: cw * photoRatio })
                                        ) : (
                                        <div
                                            style={{
                                                position: "relative",
                                                display: "flex",
                                                height: cw * photoRatio,
                                                borderRadius: radius,
                                                overflow: "hidden",
                                                background: c.surface,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "relative",
                                                    flex: "none",
                                                    width: cw,
                                                    height: "100%",
                                                    background: c.placeholder,
                                                }}
                                            >
                                                {photo(m)}
                                                {plus(m, i)}
                                            </div>
                                            {bio(m, false)}
                                        </div>
                                        )}
                                        {meta(m, i, cw)}
                                    </motion.article>
                                )
                            })}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Progress dashes (carousel only) */}
            {!isGrid && (
                <div
                    style={{ display: "flex", gap: 4, padding: "0 " + padding + "px" }}
                    aria-hidden
                >
                    {list.map((m, i) => (
                        <motion.span
                            key={m.key}
                            animate={{
                                width: i === index ? 28 : 12,
                                backgroundColor: i === index ? c.text : c.chip,
                            }}
                            transition={spring}
                            style={{ height: 2, borderRadius: 2, display: "block" }}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

const btnReset: React.CSSProperties = {
    appearance: "none",
    border: "none",
    margin: 0,
    font: "inherit",
    cursor: "pointer",
    outlineOffset: 3,
}

function initials(name = "") {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

// Same photos as the canvas Member Cards (project assets)
const photo = (id: string, alt: string) => ({
    src: "https://framerusercontent.com/images/" + id + "?scale-down-to=1024",
    alt,
})

const sample: Member[] = [
    {
        image: photo("t5QLS27KaRRNLsofqkyw6d6Go44.jpg", "Daniel Mercer, arms crossed, wearing a blazer"),
        name: "Daniel Mercer",
        role: "Chief Strategy Officer",
        team: "Strategy",
        city: "London",
        since: "2014",
        bio: "Daniel turns messy briefs into one sharp insight. Fifteen years of launches across retail, fintech and FMCG brands.",
    },
    {
        image: photo("8fdB0N0XTzTDtIh7LrHePgVQMU.jpg", "Amara Osei on a tree-lined street"),
        name: "Amara Osei",
        role: "Brand Strategist",
        team: "Strategy",
        city: "Accra",
        since: "2019",
        bio: "Amara lives in audience research and culture, then makes sure every campaign has a clear reason to exist.",
    },
    {
        image: photo("fyRxb3uANT04fyUF62bXN8BqxA.jpg", "Portrait of Sofia Lindqvist"),
        name: "Sofia Lindqvist",
        role: "Executive Creative Director",
        team: "Creative",
        city: "Stockholm",
        since: "2016",
        bio: "Sofia leads the creative floor. Her ideas have run on billboards, TV and every feed in between.",
    },
    {
        image: photo("kLhzYiC3FgjOn9d2Mc0AQu1uSJs.jpg", "Kenji Morita seated, arms crossed"),
        name: "Kenji Morita",
        role: "Senior Art Director",
        team: "Creative",
        city: "Tokyo",
        since: "2020",
        bio: "Kenji shapes the look of each campaign, from bold out-of-home layouts to scroll-stopping social frames.",
    },
    {
        image: photo("8V7Eggenm6TiLfSOLq91jpXgjI.jpg", "Black and white portrait of Rachel Kim"),
        name: "Rachel Kim",
        role: "Head of Paid Media",
        team: "Media",
        city: "New York",
        since: "2017",
        bio: "Rachel plans and buys media across search, social and CTV, and keeps every dollar accountable to return.",
    },
    {
        image: photo("MomzuQ6SvjK66Wwvj29XCaImrY.jpg", "Omar Haddad operating a camera rig in a foggy studio"),
        name: "Omar Haddad",
        role: "Performance Lead",
        team: "Media",
        city: "Dubai",
        since: "2021",
        bio: "Omar runs the testing engine: creative variants, audiences and bids, tuned every week against real conversions.",
    },
]

TeamFilterGrid.defaultProps = {
    layout: "grid",
    eyebrow: "Meet the crew",
    title: "The people behind the campaigns",
    allLabel: "All",
    members: sample,
    columns: 3,
    minCardWidth: 300,
    photoRatio: 1,
    cardWidth: 340,
    gap: 20,
    radius: 16,
    padding: 40,
    showDot: false,
    colors: defaultColors,
}

addPropertyControls(TeamFilterGrid, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["grid", "carousel"],
        optionTitles: ["Grid", "Carousel"],
        displaySegmentedControl: true,
    },
    eyebrow: { type: ControlType.String, title: "Eyebrow" },
    showDot: { type: ControlType.Boolean, title: "Eyebrow Dot" },
    title: { type: ControlType.String, title: "Title", displayTextArea: true },
    allLabel: { type: ControlType.String, title: "All Label" },
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                name: { type: ControlType.String, title: "Name" },
                role: { type: ControlType.String, title: "Role" },
                team: {
                    type: ControlType.String,
                    title: "Team",
                    description: "Used for filter chips",
                },
                city: { type: ControlType.String, title: "City" },
                since: { type: ControlType.String, title: "Since" },
                bio: { type: ControlType.String, title: "Bio", displayTextArea: true },
            },
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        hidden: (p: Props) => p.layout === "carousel",
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min Card",
        min: 160,
        max: 600,
        step: 10,
        unit: "px",
        description: "Fewer columns when cards get narrower than this",
        hidden: (p: Props) => p.layout === "carousel",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 200,
        max: 520,
        step: 10,
        unit: "px",
        hidden: (p: Props) => p.layout !== "carousel",
    },
    photoRatio: {
        type: ControlType.Number,
        title: "Photo Ratio",
        min: 0.5,
        max: 2,
        step: 0.05,
        description: "Height ÷ width",
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 64, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", min: 0, max: 120, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, title: "Background" },
            text: { type: ControlType.Color, title: "Text" },
            muted: { type: ControlType.Color, title: "Muted" },
            chip: { type: ControlType.Color, title: "Chip" },
            button: { type: ControlType.Color, title: "+ Button" },
            surface: { type: ControlType.Color, title: "Bio Panel" },
            dot: { type: ControlType.Color, title: "Dot" },
            placeholder: { type: ControlType.Color, title: "No-Photo Fill" },
        },
    },
})
