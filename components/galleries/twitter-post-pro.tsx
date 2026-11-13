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


type MediaEntry = {
    kind?: "image" | "video"
    image?: ResponsiveImage
    imageUrl?: string
    video?: string
    videoUrl?: string
    poster?: ResponsiveImage
    posterUrl?: string
    alt?: string
    link?: string
}

type AuthorGroup = {
    avatar?: ResponsiveImage
    avatarUrl?: string
    name?: string
    handle?: string
    badge?: "none" | "blue" | "gold" | "grey"
    time?: string
    profileLink?: string
    assist?: boolean
    assistLink?: string
    more?: boolean
    moreLink?: string
}

type PostGroup = {
    text?: string
    limit?: number
    moreLabel?: string
    translation?: string
    translateLabel?: string
    originalLabel?: string
}

type GalleryGroup = {
    ratio?: "3:4" | "4:5" | "1:1" | "4:3" | "16:9" | "custom"
    customRatio?: number
    gap?: number
    radius?: number
    outline?: boolean
    peek?: boolean
    arrows?: "hover" | "always" | "off"
    drag?: boolean
    viewer?: boolean
    minHeight?: number
}

type ClipGroup = {
    autoplay?: boolean
    startMuted?: boolean
    loop?: boolean
    sound?: boolean
    timer?: boolean
}

type StatGroup = {
    replies?: number
    reposts?: number
    likes?: number
    views?: number
    liked?: boolean
    reposted?: boolean
    bookmarked?: boolean
    showViews?: boolean
    showBookmark?: boolean
    showShare?: boolean
    replyLink?: string
    quoteLink?: string
    viewsLink?: string
    shareUrl?: string
    repostLabel?: string
    undoLabel?: string
    quoteLabel?: string
    copiedLabel?: string
}

type SkinGroup = {
    scheme?: "dark" | "dim" | "light" | "custom"
    background?: string
    text?: string
    muted?: string
    lines?: string
    accent?: string
    repostTone?: string
    likeTone?: string
    padding?: number
    radius?: number
    border?: boolean
    divider?: boolean
}

type PostProps = {
    items?: MediaEntry[]
    author?: AuthorGroup
    post?: PostGroup
    gallery?: GalleryGroup
    clips?: ClipGroup
    stats?: StatGroup
    skin?: SkinGroup
    font?: any
    style?: React.CSSProperties
}

type Tones = {
    bg: string
    text: string
    muted: string
    line: string
    accent: string
    repost: string
    like: string
}

/* ═══════════════════════════════ pure helpers ══════════════════════════════ */

const SCHEMES: Record<
    "dark" | "dim" | "light",
    [string, string, string, string]
> = {
    // background, text, muted, hairline
    dark: ["#000000", "#E7E9EA", "#71767B", "#2F3336"],
    dim: ["#15202B", "#F7F9F9", "#8B98A5", "#38444D"],
    light: ["#FFFFFF", "#0F1419", "#536471", "#EFF3F4"],
}

const BADGE_TONES: Record<"blue" | "gold" | "grey", string> = {
    blue: "#1D9BF0",
    gold: "#E8B829",
    grey: "#829AAB",
}

const SYSTEM_FACE =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

function toneSet(skin: SkinGroup | undefined): Tones {
    const s = skin || {}
    const key = s.scheme === "dim" || s.scheme === "light" ? s.scheme : "dark"
    const row = SCHEMES[key]
    const own = s.scheme === "custom"
    return {
        bg: own ? s.background || row[0] : row[0],
        text: own ? s.text || row[1] : row[1],
        muted: own ? s.muted || row[2] : row[2],
        line: own ? s.lines || row[3] : row[3],
        accent: s.accent || "#1D9BF0",
        repost: s.repostTone || "#00BA7C",
        like: s.likeTone || "#F91880",
    }
}

function within(v: any, lo: number, hi: number, fallback: number): number {
    const n = typeof v === "number" && isFinite(v) ? v : fallback
    return Math.min(hi, Math.max(lo, n))
}

function shortCount(raw: any): string {
    const v = Math.max(0, Math.floor(Number(raw) || 0))
    if (v < 1000) return String(v)
    const step = (x: number, unit: string) =>
        (x < 10
            ? (Math.floor(x * 10) / 10).toFixed(1).replace(/\.0$/, "")
            : String(Math.floor(x))) + unit
    if (v < 1e6) return step(v / 1e3, "K")
    if (v < 1e9) return step(v / 1e6, "M")
    return step(v / 1e9, "B")
}

const SHAPES: Record<string, number> = {
    "3:4": 3 / 4,
    "4:5": 4 / 5,
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
}

function tileRatio(g: GalleryGroup | undefined): number {
    if (g?.ratio === "custom") return within(g.customRatio, 0.3, 3, 0.75)
    return SHAPES[g?.ratio || "3:4"] ?? 0.75
}

function baseSize(font: any): number {
    const n = parseFloat(font?.fontSize)
    return n && isFinite(n) ? Math.min(32, Math.max(10, n)) : 15
}

function stillOf(m: MediaEntry | undefined): string {
    if (!m) return ""
    if (m.kind === "video") return m.posterUrl?.trim() || m.poster?.src || ""
    return m.imageUrl?.trim() || m.image?.src || ""
}

function clipOf(m: MediaEntry | undefined): string {
    if (!m || m.kind !== "video") return ""
    return m.videoUrl?.trim() || m.video || ""
}

function shorten(text: string, limit: number): string {
    if (!limit || limit <= 0 || text.length <= limit) return text
    const head = text.slice(0, limit)
    const space = head.lastIndexOf(" ")
    return (space > limit * 0.55 ? head.slice(0, space) : head).trimEnd() + "…"
}

type Chunk = { s: string; mode: "plain" | "tag" | "url"; href?: string }

function chunkText(src: string): Chunk[] {
    const out: Chunk[] = []
    if (!src) return out
    const grab = /(https?:\/\/[^\s]+)|([#@$][\p{L}\p{N}_]+)/gu
    let from = 0
    let m: RegExpExecArray | null
    while ((m = grab.exec(src)) !== null) {
        if (m.index > from)
            out.push({ s: src.slice(from, m.index), mode: "plain" })
        if (m[1]) {
            const bare = m[1].replace(/^https?:\/\/(www\.)?/, "")
            out.push({
                s: bare.length > 26 ? bare.slice(0, 25) + "…" : bare,
                mode: "url",
                href: m[1],
            })
        } else {
            out.push({ s: m[0], mode: "tag" })
        }
        from = m.index + m[0].length
    }
    if (from < src.length) out.push({ s: src.slice(from), mode: "plain" })
    return out
}

function clockText(sec: number): string {
    if (!isFinite(sec) || sec < 0) return "0:00"
    const t = Math.ceil(sec)
    const mm = Math.floor(t / 60)
    const ss = t % 60
    return mm + ":" + (ss < 10 ? "0" : "") + ss
}

function wash(tones: Tones, seed: number): string {
    const lift = 26 + (seed % 3) * 9
    const x = 28 + ((seed * 23) % 40)
    return `radial-gradient(125% 95% at ${x}% 22%, color-mix(in srgb, ${tones.muted} ${lift}%, ${tones.line}) 0%, ${tones.line} 58%, color-mix(in srgb, ${tones.line} 60%, ${tones.bg}) 100%)`
}

// a scalloped rosette, generated once — eight soft lobes around a disc
const ROSETTE = (() => {
    const pts: string[] = []
    const steps = 112
    for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2
        const r = 10.2 + 1.05 * Math.cos(a * 8)
        pts.push(
            (12 + r * Math.cos(a)).toFixed(2) +
                " " +
                (12 + r * Math.sin(a)).toFixed(2)
        )
    }
    return "M" + pts.join("L") + "Z"
})()

/* ═══════════════════════════════ glyphs (pure) ═════════════════════════════ */

type GlyphProps = { size?: string; fill?: boolean; tone?: string }

const svgBox = (size = "1.25em"): React.CSSProperties => ({
    width: size,
    height: size,
    display: "block",
    flexShrink: 0,
    overflow: "visible",
})

const line = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
}

function GReply({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                {...line}
                d="M9.6 3.8h4.3a7.1 7.1 0 0 1 .4 14.2l-4.9 3.1c-.4.2-.8 0-.8-.4v-2.9A7.1 7.1 0 0 1 9.6 3.8Z"
            />
        </svg>
    )
}

function GLoop({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path {...line} d="M4.6 15V8.4a2.4 2.4 0 0 1 2.4-2.4h7.2" />
            <path {...line} d="m1.9 12.4 2.7 2.8 2.7-2.8" />
            <path {...line} d="M19.4 9v6.6a2.4 2.4 0 0 1-2.4 2.4H9.8" />
            <path {...line} d="m22.1 11.6-2.7-2.8-2.7 2.8" />
        </svg>
    )
}

function GHeart({ size, fill, tone }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                d="M12 20.3c-.3 0-.5-.1-.7-.2C5.8 16.6 2.6 13 2.6 9.1c0-2.9 2.2-5.2 5-5.2 1.8 0 3.4 1 4.4 2.5 1-1.5 2.6-2.5 4.4-2.5 2.8 0 5 2.3 5 5.2 0 3.9-3.2 7.5-8.7 11-.2.1-.4.2-.7.2Z"
                fill={fill ? tone || "currentColor" : "none"}
                stroke={fill ? tone || "currentColor" : "currentColor"}
                strokeWidth={1.75}
                strokeLinejoin="round"
            />
        </svg>
    )
}

function GBars({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                {...line}
                strokeWidth={2}
                d="M5.5 20.2v-7.4M10 20.2V4.6M14.5 20.2V9.4M19 20.2v-4.6"
            />
        </svg>
    )
}

function GMark({ size, fill }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                d="M6.8 3.4h10.4c.8 0 1.4.6 1.4 1.4v15.6c0 .5-.6.8-1 .5L12 17l-5.6 3.9c-.4.3-1 0-1-.5V4.8c0-.8.6-1.4 1.4-1.4Z"
                fill={fill ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinejoin="round"
            />
        </svg>
    )
}

function GLift({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path {...line} d="M12 15.4V3.6M7.4 8 12 3.4 16.6 8" />
            <path
                {...line}
                d="M4.4 13.6v5.2c0 1 .8 1.8 1.8 1.8h11.6c1 0 1.8-.8 1.8-1.8v-5.2"
            />
        </svg>
    )
}

function GDots({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <circle cx="4.8" cy="12" r="1.65" fill="currentColor" />
            <circle cx="12" cy="12" r="1.65" fill="currentColor" />
            <circle cx="19.2" cy="12" r="1.65" fill="currentColor" />
        </svg>
    )
}

function GSpark({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                {...line}
                d="M10.4 3.6c.5 3.9 2.2 5.6 6.1 6.1-3.9.5-5.6 2.2-6.1 6.1-.5-3.9-2.2-5.6-6.1-6.1 3.9-.5 5.6-2.2 6.1-6.1Z"
            />
            <path
                {...line}
                d="M18.2 14.6c.2 1.7 1 2.5 2.7 2.7-1.7.2-2.5 1-2.7 2.7-.2-1.7-1-2.5-2.7-2.7 1.7-.2 2.5-1 2.7-2.7Z"
            />
        </svg>
    )
}

function GSeal({ size, tone }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path d={ROSETTE} fill={tone} />
            <path
                d="m8.1 12.3 2.6 2.6 5.2-5.7"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function GArrow({ size, fill }: GlyphProps) {
    // fill === true → points left
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                {...line}
                strokeWidth={2.2}
                d={
                    fill
                        ? "M19.5 12h-15M10.5 6l-6 6 6 6"
                        : "M4.5 12h15M13.5 6l6 6-6 6"
                }
            />
        </svg>
    )
}

function GClose({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path {...line} strokeWidth={2.1} d="M6 6l12 12M18 6 6 18" />
        </svg>
    )
}

function GVolume({ size, fill }: GlyphProps) {
    // fill === true → muted
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path d="M3.8 9.2h3.4l4.6-4v13.6l-4.6-4H3.8Z" fill="currentColor" />
            {fill ? (
                <path
                    {...line}
                    strokeWidth={2}
                    d="m15.6 9.4 5 5.2m0-5.2-5 5.2"
                />
            ) : (
                <path
                    {...line}
                    d="M15.2 8.6a4.8 4.8 0 0 1 0 6.8M17.9 6a8.6 8.6 0 0 1 0 12"
                />
            )}
        </svg>
    )
}

function GPlay({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <path
                d="M7.6 4.9v14.2c0 .6.7 1 1.2.7l11-7.1c.5-.3.5-1.1 0-1.4l-11-7.1c-.5-.3-1.2.1-1.2.7Z"
                fill="currentColor"
            />
        </svg>
    )
}

function GFrame({ size }: GlyphProps) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" style={svgBox(size)}>
            <rect
                {...line}
                x="3.4"
                y="4.4"
                width="17.2"
                height="15.2"
                rx="2.6"
            />
            <circle cx="9" cy="9.6" r="1.7" fill="currentColor" />
            <path {...line} d="m4 17.4 5-4.6 3.4 3 3-2.6 4.4 4" />
        </svg>
    )
}

/* ═════════════════════════════ STATIC BRANCH ═════════════════════════════
 * Canvas / export only. Plain elements, at-rest layout, no motion of any kind.
 * ──────────────────────────────────────────────────────────────────────── */

function PostStill(props: PostProps) {
    const tones = toneSet(props.skin)
    const size = baseSize(props.font)
    const items = Array.isArray(props.items) ? props.items : []
    const a = props.author || {}
    const t = props.post || {}
    const g = props.gallery || {}
    const s = props.stats || {}
    const k = props.skin || {}
    const pad = within(k.padding, 0, 64, 16)
    const ratio = tileRatio(g)
    const gap = within(g.gap, 0, 40, 8)
    const tileRadius = within(g.radius, 0, 40, 16)
    const peek = g.peek !== false && items.length > 1
    const avatar = a.avatarUrl?.trim() || a.avatar?.src || ""
    const body = shorten(t.text || "", t.limit || 0)
    const cut = !!t.limit && (t.text || "").length > (t.limit || 0)
    const badge = a.badge && a.badge !== "none" ? BADGE_TONES[a.badge] : ""

    const count = (n: any, show: boolean) =>
        show && Number(n) > 0 ? (
            <span style={{ fontSize: "0.867em", padding: "0 0.75em 0 0.3em" }}>
                {shortCount(n)}
            </span>
        ) : null

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "stretch",
                gap: "0.8em",
                padding: `${pad * 0.75}px ${pad}px ${pad * 0.4}px`,
                background: tones.bg,
                color: tones.text,
                borderRadius: within(k.radius, 0, 48, 0),
                border: k.border ? `1px solid ${tones.line}` : "none",
                borderBottom:
                    k.border || k.divider ? `1px solid ${tones.line}` : "none",
                overflow: "hidden",
                lineHeight: 1.333,
                ...(props.font || {}),
                fontFamily: props.font?.fontFamily || SYSTEM_FACE,
                fontSize: size,
                ...(props.style || {}),
            }}
        >
            <div
                style={{
                    width: "2.667em",
                    height: "2.667em",
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: tones.line,
                    color: tones.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                }}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt=""
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    (a.name || "A").trim().charAt(0).toUpperCase()
                )}
            </div>

            <div
                style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25em",
                        minHeight: "1.4em",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25em",
                            minWidth: 0,
                            flex: "0 1 auto",
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {a.name}
                        </span>
                        {badge ? <GSeal size="1.2em" tone={badge} /> : null}
                        {a.handle ? (
                            <span
                                style={{
                                    color: tones.muted,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    minWidth: 0,
                                }}
                            >
                                {"@" + a.handle.replace(/^@/, "")}
                            </span>
                        ) : null}
                        {a.time ? (
                            <span
                                style={{
                                    color: tones.muted,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                {"· " + a.time}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: "1.1em",
                            color: tones.muted,
                            paddingLeft: "0.6em",
                        }}
                    >
                        {a.assist ? <GSpark size="1.25em" /> : null}
                        {a.more !== false ? <GDots size="1.25em" /> : null}
                    </div>
                </div>

                {/* text */}
                {body ? (
                    <div
                        style={{
                            marginTop: "0.133em",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {chunkText(body).map((c, i) => (
                            <span
                                key={i}
                                style={{
                                    color:
                                        c.mode === "plain"
                                            ? tones.text
                                            : tones.accent,
                                }}
                            >
                                {c.s}
                            </span>
                        ))}
                        {cut ? (
                            <span style={{ color: tones.accent }}>
                                {" " + (t.moreLabel || "Show more")}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                {t.translation ? (
                    <div
                        style={{
                            color: tones.accent,
                            fontSize: "0.867em",
                            marginTop: "0.4em",
                        }}
                    >
                        {t.translateLabel || "Translate post"}
                    </div>
                ) : null}

                {/* media at rest */}
                {items.length ? (
                    <div
                        style={{
                            position: "relative",
                            flex: "1 1 0",
                            minHeight: within(g.minHeight, 60, 900, 220),
                            marginTop: "0.8em",
                            marginRight: peek ? -pad : 0,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                gap,
                                overflow: "hidden",
                            }}
                        >
                            {items.map((m, i) => {
                                const still = stillOf(m)
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            position: "relative",
                                            height: "100%",
                                            flex: "0 0 auto",
                                            width:
                                                items.length === 1
                                                    ? "100%"
                                                    : undefined,
                                            aspectRatio:
                                                items.length === 1
                                                    ? undefined
                                                    : String(ratio),
                                            borderRadius: tileRadius,
                                            overflow: "hidden",
                                            boxSizing: "border-box",
                                            border:
                                                g.outline !== false
                                                    ? `1px solid ${tones.line}`
                                                    : "none",
                                            background: wash(tones, i),
                                            color: tones.muted,
                                        }}
                                    >
                                        {still ? (
                                            <img
                                                src={still}
                                                alt={m.alt || ""}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    opacity: 0.8,
                                                }}
                                            >
                                                {m.kind === "video" ? (
                                                    <GPlay size="2.2em" />
                                                ) : (
                                                    <GFrame size="2.2em" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: "1 1 0" }} />
                )}

                {/* actions */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "0.8em",
                        height: "2.25em",
                        color: tones.muted,
                    }}
                >
                    <div
                        style={{
                            flex: "1 1 0",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <GReply size="1.25em" />
                        {count(s.replies, true)}
                    </div>
                    <div
                        style={{
                            flex: "1 1 0",
                            display: "flex",
                            alignItems: "center",
                            color: s.reposted ? tones.repost : undefined,
                        }}
                    >
                        <GLoop size="1.25em" />
                        {count(s.reposts, true)}
                    </div>
                    <div
                        style={{
                            flex: "1 1 0",
                            display: "flex",
                            alignItems: "center",
                            color: s.liked ? tones.like : undefined,
                        }}
                    >
                        <GHeart
                            size="1.25em"
                            fill={!!s.liked}
                            tone={tones.like}
                        />
                        {count(s.likes, true)}
                    </div>
                    {s.showViews !== false ? (
                        <div
                            style={{
                                flex: "1 1 0",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <GBars size="1.25em" />
                            {count(s.views, true)}
                        </div>
                    ) : null}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.1em",
                        }}
                    >
                        {s.showBookmark !== false ? (
                            <span
                                style={{
                                    color: s.bookmarked
                                        ? tones.accent
                                        : undefined,
                                }}
                            >
                                <GMark size="1.25em" fill={!!s.bookmarked} />
                            </span>
                        ) : null}
                        {s.showShare !== false ? <GLift size="1.25em" /> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ══════════════════════════════ LIVE BRANCH ══════════════════════════════ */

function useTabShown(): boolean {
    const [shown, setShown] = React.useState(true)
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const read = () => setShown(document.visibilityState !== "hidden")
        read()
        document.addEventListener("visibilitychange", read)
        return () => document.removeEventListener("visibilitychange", read)
    }, [])
    return shown
}

function useStillPreferred(): boolean {
    const [still, setStill] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setStill(q.matches)
        read()
        if (q.addEventListener) {
            q.addEventListener("change", read)
            return () => q.removeEventListener("change", read)
        }
        q.addListener(read)
        return () => q.removeListener(read)
    }, [])
    return still
}

/* rolling number: the new value slides in from the direction it moved */
function Odometer({
    value,
    uid,
    quiet,
}: {
    value: number
    uid: string
    quiet: boolean
}) {
    const last = React.useRef(value)
    const moved = value !== last.current
    const rising = value > last.current
    React.useEffect(() => {
        last.current = value
    })
    if (value <= 0) return null
    return (
        <span
            style={{
                display: "inline-flex",
                overflow: "hidden",
                height: "1.3em",
                lineHeight: "1.3em",
                fontSize: "0.867em",
                padding: "0 0.75em 0 0.3em",
                fontVariantNumeric: "tabular-nums",
            }}
        >
            <span
                key={value}
                className={
                    moved && !quiet
                        ? rising
                            ? `up${uid}`
                            : `dn${uid}`
                        : undefined
                }
                style={{ display: "inline-block" }}
            >
                {shortCount(value)}
            </span>
        </span>
    )
}

type ActProps = {
    uid: string
    tone: string
    label: string
    href?: string
    pressed?: boolean
    lit?: boolean
    onPress?: (e: React.MouseEvent) => void
    children: React.ReactNode
    style?: React.CSSProperties
}

function Act({
    uid,
    tone,
    label,
    href,
    pressed,
    lit,
    onPress,
    children,
    style,
}: ActProps) {
    const skin = {
        ...(style || {}),
        ["--tone" as any]: tone,
        color: lit ? tone : undefined,
    } as React.CSSProperties
    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`act${uid}`}
                style={skin}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </a>
        )
    }
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            className={`act${uid}`}
            style={skin}
            onClick={onPress}
        >
            {children}
        </button>
    )
}

type ClipProps = {
    uid: string
    src: string
    poster: string
    muted: boolean
    loop: boolean
    gate: boolean // tab visible, motion allowed, viewer closed
    auto: boolean
    sound: boolean
    timer: boolean
    onSound: () => void
}

function ClipTile({
    uid,
    src,
    poster,
    muted,
    loop,
    gate,
    auto,
    sound,
    timer,
    onSound,
}: ClipProps) {
    const node = React.useRef<HTMLVideoElement | null>(null)
    const readout = React.useRef<HTMLSpanElement | null>(null)
    const inView = React.useRef(false) // locked out until the observer says otherwise
    const [asked, setAsked] = React.useState(false)
    const want = React.useRef(false)
    want.current = gate && (auto || asked)

    const apply = React.useCallback(() => {
        const v = node.current
        if (!v) return
        if (want.current && inView.current) {
            const p = v.play()
            if (p && typeof p.catch === "function") p.catch(() => {})
        } else if (!v.paused) {
            v.pause()
        }
    }, [])

    React.useEffect(() => {
        const v = node.current
        if (!v) return
        if (typeof IntersectionObserver === "undefined") {
            inView.current = true
            apply()
            return () => v.pause()
        }
        const watch = new IntersectionObserver(
            (rows) => {
                inView.current = rows.some((r) => r.intersectionRatio >= 0.6)
                apply()
            },
            { threshold: [0, 0.6, 1] }
        )
        watch.observe(v)
        return () => {
            watch.disconnect()
            v.pause()
        }
    }, [apply, src])

    React.useEffect(() => {
        apply()
    }, [gate, auto, asked, apply])

    React.useEffect(() => {
        if (node.current) node.current.muted = muted
    }, [muted])

    const tick = () => {
        const v = node.current
        if (v && readout.current)
            readout.current.textContent = clockText(
                (v.duration || 0) - v.currentTime
            )
    }

    return (
        <>
            <video
                ref={node}
                src={src}
                poster={poster || undefined}
                muted={muted}
                loop={loop}
                playsInline
                preload="metadata"
                disablePictureInPicture
                onLoadedMetadata={tick}
                onTimeUpdate={tick}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
            {!auto && !asked ? (
                <button
                    type="button"
                    aria-label="Play"
                    className={`chip${uid}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        setAsked(true)
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%,-50%)",
                        width: "3.6em",
                        height: "3.6em",
                        background: "#1D9BF0",
                        color: "#fff",
                    }}
                >
                    <GPlay size="1.5em" />
                </button>
            ) : null}
            {timer ? (
                <span
                    ref={readout}
                    style={{
                        position: "absolute",
                        left: "0.6em",
                        bottom: "0.6em",
                        padding: "0.07em 0.33em",
                        borderRadius: 4,
                        background: "rgba(0,0,0,0.77)",
                        color: "#fff",
                        fontSize: "0.867em",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        pointerEvents: "none",
                    }}
                >
                    0:00
                </span>
            ) : null}
            {sound ? (
                <button
                    type="button"
                    aria-label={muted ? "Unmute" : "Mute"}
                    className={`chip${uid}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onSound()
                    }}
                    style={{
                        position: "absolute",
                        right: "0.6em",
                        bottom: "0.6em",
                        width: "2em",
                        height: "2em",
                    }}
                >
                    <GVolume size="1.15em" fill={muted} />
                </button>
            ) : null}
        </>
    )
}

function PostLive(props: PostProps) {
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const tones = toneSet(props.skin)
    const size = baseSize(props.font)
    const items = Array.isArray(props.items) ? props.items : []
    const a = props.author || {}
    const t = props.post || {}
    const g = props.gallery || {}
    const c = props.clips || {}
    const s = props.stats || {}
    const k = props.skin || {}
    const pad = within(k.padding, 0, 64, 16)
    const ratio = tileRatio(g)
    const gap = within(g.gap, 0, 40, 8)
    const tileRadius = within(g.radius, 0, 40, 16)
    const peek = g.peek !== false && items.length > 1
    const avatar = a.avatarUrl?.trim() || a.avatar?.src || ""
    const badge = a.badge && a.badge !== "none" ? BADGE_TONES[a.badge] : ""

    const tabShown = useTabShown()
    const quiet = useStillPreferred()
    const quietRef = React.useRef(quiet)
    quietRef.current = quiet
    const liveProps = React.useRef(props)
    liveProps.current = props

    /* ── toggles, seeded from the panel and re-seeded when it changes ── */
    const [liked, setLiked] = React.useState(!!s.liked)
    const [shared, setShared] = React.useState(!!s.reposted)
    const [kept, setKept] = React.useState(!!s.bookmarked)
    React.useEffect(() => setLiked(!!s.liked), [s.liked])
    React.useEffect(() => setShared(!!s.reposted), [s.reposted])
    React.useEffect(() => setKept(!!s.bookmarked), [s.bookmarked])
    const [burst, setBurst] = React.useState(0)
    const [keptPop, setKeptPop] = React.useState(0)
    const [loopPop, setLoopPop] = React.useState(0)

    const likeTotal = Math.max(
        0,
        (Number(s.likes) || 0) + (liked ? 1 : 0) - (s.liked ? 1 : 0)
    )
    const loopTotal = Math.max(
        0,
        (Number(s.reposts) || 0) + (shared ? 1 : 0) - (s.reposted ? 1 : 0)
    )

    /* ── text ── */
    const [opened, setOpened] = React.useState(false)
    const [swapped, setSwapped] = React.useState(false)
    const source = t.text || ""
    const limit = t.limit || 0
    const folded = !opened && limit > 0 && source.length > limit
    const visible =
        swapped && t.translation
            ? t.translation
            : folded
              ? shorten(source, limit)
              : source

    /* ── gallery rail: native scroll + snap, no frame loop ── */
    const rail = React.useRef<HTMLDivElement | null>(null)
    const [ends, setEnds] = React.useState({ back: false, fwd: false })
    const [over, setOver] = React.useState(false)
    const [grabbing, setGrabbing] = React.useState(false)
    const snapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const swallowClick = React.useRef(false)
    const hold = React.useRef({
        on: false,
        id: -1,
        x0: 0,
        left0: 0,
        moved: false,
        px: 0,
        pt: 0,
        vel: 0,
    })

    const readEnds = React.useCallback(() => {
        const r = rail.current
        if (!r) return
        const room = r.scrollWidth - r.clientWidth
        const back = r.scrollLeft > 2
        const fwd = r.scrollLeft < room - 2
        setEnds((e) => (e.back === back && e.fwd === fwd ? e : { back, fwd }))
    }, [])

    React.useEffect(() => {
        readEnds()
        const r = rail.current
        if (!r || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => readEnds())
        ro.observe(r)
        return () => ro.disconnect()
    }, [readEnds, items.length, ratio, gap])

    const tileStops = (): number[] => {
        const r = rail.current
        if (!r) return [0]
        const room = r.scrollWidth - r.clientWidth
        const stops = Array.from(
            r.querySelectorAll<HTMLElement>("[data-tile]")
        ).map((el) => Math.min(room, el.offsetLeft))
        return stops.length ? stops : [0]
    }

    const glideTo = (x: number) => {
        const r = rail.current
        if (!r) return
        r.scrollTo({ left: x, behavior: quietRef.current ? "auto" : "smooth" })
    }

    const stepRail = (dir: 1 | -1) => {
        const r = rail.current
        if (!r) return
        const here = r.scrollLeft
        const stops = tileStops()
        let goal = here
        if (dir > 0) {
            const nxt = stops.find((x) => x > here + 4)
            goal = nxt === undefined ? r.scrollWidth : nxt
        } else {
            const prv = stops.filter((x) => x < here - 4)
            goal = prv.length ? prv[prv.length - 1] : 0
        }
        glideTo(goal)
    }

    const releaseSnap = () => {
        const r = rail.current
        if (snapTimer.current) clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(
            () => {
                snapTimer.current = null
                if (r) r.style.scrollSnapType = "x mandatory"
            },
            quietRef.current ? 30 : 460
        )
    }

    const onGrab = (e: React.PointerEvent<HTMLDivElement>) => {
        swallowClick.current = false
        if (e.pointerType !== "mouse" || e.button !== 0) return
        if (liveProps.current.gallery?.drag === false || items.length < 2)
            return
        const r = rail.current
        if (!r) return
        hold.current = {
            on: true,
            id: e.pointerId,
            x0: e.clientX,
            left0: r.scrollLeft,
            moved: false,
            px: e.clientX,
            pt: performance.now(),
            vel: 0,
        }
    }

    const onPull = (e: React.PointerEvent<HTMLDivElement>) => {
        const h = hold.current
        const r = rail.current
        if (!h.on || e.pointerId !== h.id || !r) return
        const dx = e.clientX - h.x0
        if (!h.moved) {
            if (Math.abs(dx) < 5) return
            h.moved = true
            if (snapTimer.current) clearTimeout(snapTimer.current)
            r.style.scrollSnapType = "none"
            r.setPointerCapture?.(e.pointerId)
            setGrabbing(true)
        }
        r.scrollLeft = h.left0 - dx
        const now = performance.now()
        const dt = Math.max(1, now - h.pt)
        h.vel = h.vel * 0.6 + ((e.clientX - h.px) / dt) * 0.4
        h.px = e.clientX
        h.pt = now
    }

    const onLetGo = (e: React.PointerEvent<HTMLDivElement>) => {
        const h = hold.current
        const r = rail.current
        if (!h.on || e.pointerId !== h.id) return
        h.on = false
        if (!h.moved || !r) return
        swallowClick.current = true
        setGrabbing(false)
        const aim = r.scrollLeft - h.vel * 210
        const stops = tileStops()
        let best = stops[0]
        stops.forEach((x) => {
            if (Math.abs(x - aim) < Math.abs(best - aim)) best = x
        })
        glideTo(best)
        releaseSnap()
    }

    const onRailKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            stepRail(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            stepRail(-1)
        }
    }

    /* ── in-card media viewer ── */
    const [focus, setFocus] = React.useState<number | null>(null)
    const viewerRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        if (focus === null) return
        viewerRef.current?.focus()
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFocus(null)
            else if (e.key === "ArrowRight")
                setFocus((f) =>
                    f === null ? f : Math.min(items.length - 1, f + 1)
                )
            else if (e.key === "ArrowLeft")
                setFocus((f) => (f === null ? f : Math.max(0, f - 1)))
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [focus, items.length])
    React.useEffect(() => {
        if (focus !== null && focus > items.length - 1)
            setFocus(items.length ? items.length - 1 : null)
    }, [focus, items.length])

    /* ── sound ── */
    const [muted, setMuted] = React.useState(c.startMuted !== false)
    React.useEffect(() => setMuted(c.startMuted !== false), [c.startMuted])
    const clipGate = tabShown && !quiet && focus === null

    /* ── toast + repost menu ── */
    const [toast, setToast] = React.useState("")
    const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const flash = (msg: string) => {
        setToast(msg)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => {
            toastTimer.current = null
            setToast("")
        }, 2100)
    }
    const [menu, setMenu] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        if (!menu) return
        const away = (e: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenu(false)
        }
        const esc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenu(false)
        }
        document.addEventListener("pointerdown", away)
        document.addEventListener("keydown", esc)
        return () => {
            document.removeEventListener("pointerdown", away)
            document.removeEventListener("keydown", esc)
        }
    }, [menu])

    React.useEffect(
        () => () => {
            if (snapTimer.current) clearTimeout(snapTimer.current)
            if (toastTimer.current) clearTimeout(toastTimer.current)
        },
        []
    )

    const toggleLike = () => {
        const next = !liked
        setLiked(next)
        if (next) setBurst((n) => n + 1)
    }
    const toggleRepost = () => {
        setShared((v) => !v)
        setLoopPop((n) => n + 1)
        setMenu(false)
    }
    const toggleKeep = () => {
        setKept((v) => !v)
        setKeptPop((n) => n + 1)
    }
    const sharePost = () => {
        let url = s.shareUrl || ""
        if (!url && typeof window !== "undefined") url = window.location.href
        const done = () => flash(s.copiedLabel || "Copied to clipboard")
        try {
            const clip =
                typeof navigator !== "undefined"
                    ? navigator.clipboard
                    : undefined
            if (clip && clip.writeText) clip.writeText(url).then(done, done)
            else done()
        } catch (_) {
            done()
        }
    }

    const showArrows =
        items.length > 1 &&
        g.arrows !== "off" &&
        (g.arrows === "always" || over)
    const halo = (tone: string) =>
        ({ ["--tone" as any]: tone }) as React.CSSProperties

    const css = `
.act${uid}{background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:color .18s ease;outline:none}
.act${uid}:hover,.act${uid}:focus-visible{color:var(--tone)}
.ring${uid}{position:relative;display:inline-flex;align-items:center;justify-content:center;width:2.25em;height:2.25em;margin:-.5em;border-radius:999px;transition:background-color .18s ease,box-shadow .18s ease}
.act${uid}:hover .ring${uid}{background:color-mix(in srgb,var(--tone) 12%,transparent)}
.act${uid}:focus-visible .ring${uid}{box-shadow:0 0 0 2px var(--tone)}
.chip${uid}{border:0;padding:0;border-radius:999px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.77);color:#fff;transition:background-color .18s ease,transform .18s ease}
.chip${uid}:hover{background:rgba(39,44,48,.9)}
.nav${uid}{position:absolute;top:50%;width:2.2em;height:2.2em;margin-top:-1.1em;border:0;padding:0;border-radius:999px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(15,20,25,.75);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);z-index:3;transition:background-color .18s ease,opacity .18s ease}
.nav${uid}:hover{background:rgba(39,44,48,.9)}
.rail${uid}{scrollbar-width:none;-ms-overflow-style:none}
.rail${uid}::-webkit-scrollbar{display:none}
.tile${uid} img,.tile${uid} video{transition:filter .2s ease}
.tile${uid}:hover img{filter:brightness(1.06)}
.txt${uid}{background:none;border:0;padding:0;font:inherit;color:var(--tone);cursor:pointer;text-decoration:none}
.txt${uid}:hover{text-decoration:underline}
.row${uid}{display:flex;align-items:center;gap:.75em;width:100%;padding:.8em 1.07em;border:0;background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer;text-align:left;text-decoration:none;box-sizing:border-box}
.row${uid}:hover{background:color-mix(in srgb,currentColor 7%,transparent)}
@keyframes pop${uid}{0%{transform:scale(.55)}55%{transform:scale(1.24)}100%{transform:scale(1)}}
@keyframes fling${uid}{0%{transform:rotate(var(--a)) translateY(-.3em) scale(1);opacity:1}100%{transform:rotate(var(--a)) translateY(-1.25em) scale(0);opacity:0}}
@keyframes halo${uid}{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.35);opacity:0}}
@keyframes rise${uid}{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes sink${uid}{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fade${uid}{from{opacity:0}to{opacity:1}}
@keyframes lift${uid}{from{opacity:0;transform:translate(-50%,.6em)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes drop${uid}{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.pop${uid}{animation:pop${uid} .42s cubic-bezier(.2,.9,.3,1.2)}
.up${uid}{animation:rise${uid} .26s ease-out}
.dn${uid}{animation:sink${uid} .26s ease-out}
.fade${uid}{animation:fade${uid} .2s ease-out}
.toast${uid}{animation:lift${uid} .24s ease-out}
.menu${uid}{animation:drop${uid} .16s ease-out}
@media (prefers-reduced-motion:reduce){.pop${uid},.up${uid},.dn${uid},.fade${uid},.toast${uid},.menu${uid}{animation:none}}
`

    const textBlock = visible ? (
        <div
            style={{
                marginTop: "0.133em",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
            }}
        >
            {chunkText(visible).map((piece, i) =>
                piece.mode === "url" ? (
                    <a
                        key={i}
                        href={piece.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`txt${uid}`}
                        style={halo(tones.accent)}
                    >
                        {piece.s}
                    </a>
                ) : (
                    <span
                        key={i}
                        style={{
                            color:
                                piece.mode === "tag"
                                    ? tones.accent
                                    : tones.text,
                        }}
                    >
                        {piece.s}
                    </span>
                )
            )}
            {folded && !swapped ? (
                <>
                    {" "}
                    <button
                        type="button"
                        className={`txt${uid}`}
                        style={halo(tones.accent)}
                        onClick={() => setOpened(true)}
                    >
                        {t.moreLabel || "Show more"}
                    </button>
                </>
            ) : null}
        </div>
    ) : null

    const profileHref = a.profileLink || undefined

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "stretch",
                gap: "0.8em",
                padding: `${pad * 0.75}px ${pad}px ${pad * 0.4}px`,
                background: tones.bg,
                color: tones.text,
                borderRadius: within(k.radius, 0, 48, 0),
                border: k.border ? `1px solid ${tones.line}` : "none",
                borderBottom:
                    k.border || k.divider ? `1px solid ${tones.line}` : "none",
                overflow: "hidden",
                lineHeight: 1.333,
                ...(props.font || {}),
                fontFamily: props.font?.fontFamily || SYSTEM_FACE,
                fontSize: size,
                ...(props.style || {}),
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: css }} />

            {/* avatar */}
            <a
                href={profileHref}
                target={profileHref ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label={a.name || "Profile"}
                style={{
                    width: "2.667em",
                    height: "2.667em",
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: tones.line,
                    color: tones.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    textDecoration: "none",
                    cursor: profileHref ? "pointer" : "default",
                }}
            >
                {avatar ? (
                    <img
                        src={avatar}
                        alt=""
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    (a.name || "A").trim().charAt(0).toUpperCase()
                )}
            </a>

            <div
                style={{
                    flex: "1 1 0",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* ── header ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25em",
                        minHeight: "1.4em",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25em",
                            minWidth: 0,
                            flex: "0 1 auto",
                        }}
                    >
                        <a
                            href={profileHref}
                            target={profileHref ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            style={{
                                fontWeight: 700,
                                color: tones.text,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                minWidth: 0,
                            }}
                        >
                            {a.name}
                        </a>
                        {badge ? <GSeal size="1.2em" tone={badge} /> : null}
                        {a.handle ? (
                            <span
                                style={{
                                    color: tones.muted,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    minWidth: 0,
                                }}
                            >
                                {"@" + a.handle.replace(/^@/, "")}
                            </span>
                        ) : null}
                        {a.time ? (
                            <span
                                style={{
                                    color: tones.muted,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                {"· " + a.time}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: "1.1em",
                            color: tones.muted,
                            paddingLeft: "0.6em",
                        }}
                    >
                        {a.assist ? (
                            <Act
                                uid={uid}
                                tone={tones.accent}
                                label="Explain this post"
                                href={a.assistLink || undefined}
                            >
                                <span className={`ring${uid}`}>
                                    <GSpark size="1.25em" />
                                </span>
                            </Act>
                        ) : null}
                        {a.more !== false ? (
                            <Act
                                uid={uid}
                                tone={tones.accent}
                                label="More"
                                href={a.moreLink || undefined}
                            >
                                <span className={`ring${uid}`}>
                                    <GDots size="1.25em" />
                                </span>
                            </Act>
                        ) : null}
                    </div>
                </div>

                {/* ── text ── */}
                {textBlock}
                {t.translation ? (
                    <button
                        type="button"
                        className={`txt${uid}`}
                        style={{
                            ...halo(tones.accent),
                            fontSize: "0.867em",
                            marginTop: "0.4em",
                            alignSelf: "flex-start",
                        }}
                        onClick={() => setSwapped((v) => !v)}
                    >
                        {swapped
                            ? t.originalLabel || "Show original"
                            : t.translateLabel || "Translate post"}
                    </button>
                ) : null}

                {/* ── media rail ── */}
                {items.length ? (
                    <div
                        onPointerEnter={() => setOver(true)}
                        onPointerLeave={() => setOver(false)}
                        style={{
                            position: "relative",
                            flex: "1 1 0",
                            minHeight: within(g.minHeight, 60, 900, 220),
                            marginTop: "0.8em",
                            marginRight: peek ? -pad : 0,
                        }}
                    >
                        <div
                            ref={rail}
                            className={`rail${uid}`}
                            tabIndex={items.length > 1 ? 0 : -1}
                            role="group"
                            aria-label="Post media"
                            onScroll={readEnds}
                            onKeyDown={onRailKey}
                            onPointerDown={onGrab}
                            onPointerMove={onPull}
                            onPointerUp={onLetGo}
                            onPointerCancel={onLetGo}
                            onClickCapture={(e) => {
                                if (swallowClick.current) {
                                    swallowClick.current = false
                                    e.preventDefault()
                                    e.stopPropagation()
                                }
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                gap,
                                overflowX: items.length > 1 ? "auto" : "hidden",
                                overflowY: "hidden",
                                scrollSnapType: "x mandatory",
                                overscrollBehaviorX: "contain",
                                outline: "none",
                                cursor: grabbing ? "grabbing" : "default",
                                userSelect: grabbing ? "none" : undefined,
                            }}
                        >
                            {items.map((m, i) => {
                                const still = stillOf(m)
                                const clip = clipOf(m)
                                const single = items.length === 1
                                const tileStyle: React.CSSProperties = {
                                    position: "relative",
                                    display: "block",
                                    height: "100%",
                                    flex: "0 0 auto",
                                    width: single ? "100%" : undefined,
                                    aspectRatio: single
                                        ? undefined
                                        : String(ratio),
                                    borderRadius: tileRadius,
                                    overflow: "hidden",
                                    boxSizing: "border-box",
                                    border:
                                        g.outline !== false
                                            ? `1px solid ${tones.line}`
                                            : "none",
                                    background: wash(tones, i),
                                    color: tones.muted,
                                    scrollSnapAlign: "start",
                                    cursor: grabbing
                                        ? "grabbing"
                                        : m.link || g.viewer !== false
                                          ? "pointer"
                                          : "default",
                                    textDecoration: "none",
                                }
                                const face =
                                    m.kind === "video" && clip ? (
                                        <ClipTile
                                            uid={uid}
                                            src={clip}
                                            poster={still}
                                            muted={muted}
                                            loop={c.loop !== false}
                                            gate={clipGate}
                                            auto={c.autoplay !== false}
                                            sound={c.sound !== false}
                                            timer={c.timer !== false}
                                            onSound={() => setMuted((v) => !v)}
                                        />
                                    ) : still ? (
                                        <img
                                            src={still}
                                            srcSet={
                                                m.kind !== "video" &&
                                                !m.imageUrl?.trim()
                                                    ? m.image?.srcSet
                                                    : undefined
                                            }
                                            sizes="(max-width: 700px) 80vw, 520px"
                                            alt={m.alt || m.image?.alt || ""}
                                            draggable={false}
                                            loading={i > 1 ? "lazy" : undefined}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                opacity: 0.8,
                                            }}
                                        >
                                            {m.kind === "video" ? (
                                                <GPlay size="2.2em" />
                                            ) : (
                                                <GFrame size="2.2em" />
                                            )}
                                        </div>
                                    )
                                return m.link ? (
                                    <a
                                        key={i}
                                        data-tile=""
                                        className={`tile${uid}`}
                                        href={m.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        draggable={false}
                                        style={tileStyle}
                                    >
                                        {face}
                                    </a>
                                ) : (
                                    <div
                                        key={i}
                                        data-tile=""
                                        className={`tile${uid}`}
                                        style={tileStyle}
                                        onClick={() => {
                                            if (
                                                liveProps.current.gallery
                                                    ?.viewer !== false
                                            )
                                                setFocus(i)
                                        }}
                                    >
                                        {face}
                                    </div>
                                )
                            })}
                            {peek ? (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        flex: `0 0 ${Math.max(0, pad - gap)}px`,
                                    }}
                                />
                            ) : null}
                        </div>

                        {showArrows && ends.back ? (
                            <button
                                type="button"
                                aria-label="Previous"
                                className={`nav${uid}`}
                                style={{ left: "0.6em" }}
                                onClick={() => stepRail(-1)}
                            >
                                <GArrow size="1.15em" fill />
                            </button>
                        ) : null}
                        {showArrows && ends.fwd ? (
                            <button
                                type="button"
                                aria-label="Next"
                                className={`nav${uid}`}
                                style={{ right: "0.6em" }}
                                onClick={() => stepRail(1)}
                            >
                                <GArrow size="1.15em" />
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div style={{ flex: "1 1 0" }} />
                )}

                {/* ── actions ── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "0.8em",
                        height: "2.25em",
                        color: tones.muted,
                    }}
                >
                    <div style={{ flex: "1 1 0", display: "flex" }}>
                        <Act
                            uid={uid}
                            tone={tones.accent}
                            label="Reply"
                            href={s.replyLink || undefined}
                        >
                            <span className={`ring${uid}`}>
                                <GReply size="1.25em" />
                            </span>
                            <Odometer
                                value={Number(s.replies) || 0}
                                uid={uid}
                                quiet={quiet}
                            />
                        </Act>
                    </div>

                    <div
                        style={{
                            flex: "1 1 0",
                            display: "flex",
                            position: "relative",
                        }}
                    >
                        <Act
                            uid={uid}
                            tone={tones.repost}
                            label="Repost"
                            pressed={shared}
                            lit={shared}
                            onPress={() => setMenu((v) => !v)}
                        >
                            <span className={`ring${uid}`}>
                                <span
                                    key={loopPop}
                                    className={
                                        loopPop && !quiet
                                            ? `pop${uid}`
                                            : undefined
                                    }
                                    style={{ display: "inline-flex" }}
                                >
                                    <GLoop size="1.25em" />
                                </span>
                            </span>
                            <Odometer
                                value={loopTotal}
                                uid={uid}
                                quiet={quiet}
                            />
                        </Act>
                        {menu ? (
                            <div
                                ref={menuRef}
                                role="menu"
                                className={`menu${uid}`}
                                style={{
                                    position: "absolute",
                                    left: "-0.6em",
                                    bottom: "-0.2em",
                                    zIndex: 12,
                                    minWidth: "9.5em",
                                    padding: "0.3em 0",
                                    borderRadius: 12,
                                    background: tones.bg,
                                    color: tones.text,
                                    boxShadow: `0 0 15px color-mix(in srgb, ${tones.text} 20%, transparent), 0 0 3px 1px color-mix(in srgb, ${tones.text} 15%, transparent)`,
                                    overflow: "hidden",
                                    transformOrigin: "left bottom",
                                }}
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={`row${uid}`}
                                    onClick={toggleRepost}
                                >
                                    <span
                                        style={{
                                            color: shared
                                                ? tones.repost
                                                : tones.text,
                                            display: "inline-flex",
                                        }}
                                    >
                                        <GLoop size="1.15em" />
                                    </span>
                                    {shared
                                        ? s.undoLabel || "Undo repost"
                                        : s.repostLabel || "Repost"}
                                </button>
                                {s.quoteLink ? (
                                    <a
                                        role="menuitem"
                                        className={`row${uid}`}
                                        href={s.quoteLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMenu(false)}
                                    >
                                        <span
                                            style={{ display: "inline-flex" }}
                                        >
                                            <GReply size="1.15em" />
                                        </span>
                                        {s.quoteLabel || "Quote"}
                                    </a>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div style={{ flex: "1 1 0", display: "flex" }}>
                        <Act
                            uid={uid}
                            tone={tones.like}
                            label="Like"
                            pressed={liked}
                            lit={liked}
                            onPress={toggleLike}
                        >
                            <span className={`ring${uid}`}>
                                {burst > 0 && liked && !quiet ? (
                                    <span
                                        key={burst}
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                inset: "0.2em",
                                                borderRadius: "50%",
                                                border: `2px solid ${tones.like}`,
                                                animation: `halo${uid} .5s ease-out forwards`,
                                            }}
                                        />
                                        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                                            <span
                                                key={n}
                                                style={
                                                    {
                                                        position: "absolute",
                                                        left: "50%",
                                                        top: "50%",
                                                        width: "0.28em",
                                                        height: "0.28em",
                                                        margin: "-0.14em",
                                                        borderRadius: "50%",
                                                        background:
                                                            n % 2
                                                                ? tones.like
                                                                : tones.accent,
                                                        ["--a" as any]: `${n * (360 / 7) + 12}deg`,
                                                        opacity: 0,
                                                        animation: `fling${uid} .62s cubic-bezier(.15,.7,.35,1) .08s forwards`,
                                                    } as React.CSSProperties
                                                }
                                            />
                                        ))}
                                    </span>
                                ) : null}
                                <span
                                    key={liked ? "on" : "off"}
                                    className={
                                        liked && burst > 0 && !quiet
                                            ? `pop${uid}`
                                            : undefined
                                    }
                                    style={{ display: "inline-flex" }}
                                >
                                    <GHeart
                                        size="1.25em"
                                        fill={liked}
                                        tone={tones.like}
                                    />
                                </span>
                            </span>
                            <Odometer
                                value={likeTotal}
                                uid={uid}
                                quiet={quiet}
                            />
                        </Act>
                    </div>

                    {s.showViews !== false ? (
                        <div style={{ flex: "1 1 0", display: "flex" }}>
                            <Act
                                uid={uid}
                                tone={tones.accent}
                                label="Views"
                                href={s.viewsLink || undefined}
                            >
                                <span className={`ring${uid}`}>
                                    <GBars size="1.25em" />
                                </span>
                                <Odometer
                                    value={Number(s.views) || 0}
                                    uid={uid}
                                    quiet={quiet}
                                />
                            </Act>
                        </div>
                    ) : null}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1.1em",
                        }}
                    >
                        {s.showBookmark !== false ? (
                            <Act
                                uid={uid}
                                tone={tones.accent}
                                label="Bookmark"
                                pressed={kept}
                                lit={kept}
                                onPress={toggleKeep}
                            >
                                <span className={`ring${uid}`}>
                                    <span
                                        key={keptPop}
                                        className={
                                            keptPop && !quiet
                                                ? `pop${uid}`
                                                : undefined
                                        }
                                        style={{ display: "inline-flex" }}
                                    >
                                        <GMark size="1.25em" fill={kept} />
                                    </span>
                                </span>
                            </Act>
                        ) : null}
                        {s.showShare !== false ? (
                            <Act
                                uid={uid}
                                tone={tones.accent}
                                label="Share"
                                onPress={sharePost}
                            >
                                <span className={`ring${uid}`}>
                                    <GLift size="1.25em" />
                                </span>
                            </Act>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ── in-card viewer ── */}
            {focus !== null && items[focus] ? (
                <div
                    ref={viewerRef}
                    tabIndex={-1}
                    role="dialog"
                    aria-label="Media viewer"
                    className={`fade${uid}`}
                    onClick={() => setFocus(null)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 20,
                        background: "rgba(0,0,0,0.92)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "3.6em 3.4em",
                        boxSizing: "border-box",
                        outline: "none",
                        color: "#fff",
                    }}
                >
                    {(() => {
                        const m = items[focus]
                        const clip = clipOf(m)
                        const still = stillOf(m)
                        const fit: React.CSSProperties = {
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            display: "block",
                            borderRadius: 4,
                        }
                        if (m.kind === "video" && clip)
                            return (
                                <video
                                    key={focus}
                                    src={clip}
                                    poster={still || undefined}
                                    controls
                                    autoPlay={tabShown}
                                    muted={muted}
                                    loop={c.loop !== false}
                                    playsInline
                                    onClick={(e) => e.stopPropagation()}
                                    style={fit}
                                />
                            )
                        if (still)
                            return (
                                <img
                                    key={focus}
                                    src={still}
                                    alt={m.alt || ""}
                                    draggable={false}
                                    onClick={(e) => e.stopPropagation()}
                                    style={fit}
                                />
                            )
                        return (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "min(100%, 22em)",
                                    aspectRatio: String(ratio),
                                    maxHeight: "100%",
                                    borderRadius: 12,
                                    background: wash(tones, focus),
                                    color: tones.muted,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {m.kind === "video" ? (
                                    <GPlay size="2.6em" />
                                ) : (
                                    <GFrame size="2.6em" />
                                )}
                            </div>
                        )
                    })()}

                    <button
                        type="button"
                        aria-label="Close"
                        className={`chip${uid}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            setFocus(null)
                        }}
                        style={{
                            position: "absolute",
                            left: "0.8em",
                            top: "0.8em",
                            width: "2.25em",
                            height: "2.25em",
                            background: "rgba(15,20,25,0.75)",
                        }}
                    >
                        <GClose size="1.2em" />
                    </button>
                    {items.length > 1 ? (
                        <span
                            style={{
                                position: "absolute",
                                top: "1.15em",
                                left: "50%",
                                transform: "translateX(-50%)",
                                fontSize: "0.867em",
                                fontWeight: 600,
                                opacity: 0.85,
                                pointerEvents: "none",
                            }}
                        >
                            {focus + 1 + " / " + items.length}
                        </span>
                    ) : null}
                    {focus > 0 ? (
                        <button
                            type="button"
                            aria-label="Previous"
                            className={`nav${uid}`}
                            style={{ left: "0.8em" }}
                            onClick={(e) => {
                                e.stopPropagation()
                                setFocus(focus - 1)
                            }}
                        >
                            <GArrow size="1.15em" fill />
                        </button>
                    ) : null}
                    {focus < items.length - 1 ? (
                        <button
                            type="button"
                            aria-label="Next"
                            className={`nav${uid}`}
                            style={{ right: "0.8em" }}
                            onClick={(e) => {
                                e.stopPropagation()
                                setFocus(focus + 1)
                            }}
                        >
                            <GArrow size="1.15em" />
                        </button>
                    ) : null}
                </div>
            ) : null}

            {/* ── toast ── */}
            {toast ? (
                <div
                    role="status"
                    className={`toast${uid}`}
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: "1.2em",
                        transform: "translate(-50%,0)",
                        zIndex: 30,
                        padding: "0.75em 1.1em",
                        borderRadius: 6,
                        background: tones.accent,
                        color: "#FFFFFF",
                        fontSize: "0.933em",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
                        pointerEvents: "none",
                    }}
                >
                    {toast}
                </div>
            ) : null}
        </div>
    )
}

/* ═══════════════════════════════ exported entry ════════════════════════════ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function MicroPostPro(props: PostProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <PostStill {...props} />
    return <PostLive {...props} />
}

const DEFAULT_ITEMS: MediaEntry[] = [
    { kind: "image", imageUrl: "", alt: "" },
    { kind: "image", imageUrl: "", alt: "" },
    { kind: "image", imageUrl: "", alt: "" },
]

MicroPostPro.defaultProps = {
    items: DEFAULT_ITEMS,
    author: {
        name: "Ilse Marwood",
        handle: "ilsemarwood",
        badge: "blue",
        time: "Oct 25",
        assist: true,
        more: true,
    },
    post: {
        text: "Shot on a frozen lake at 5am — cold light, long exposures, zero retouching. The full winter series drops this Friday ❄️ #filmphotography #winterlight",
        limit: 280,
        moreLabel: "Show more",
        translation: "",
        translateLabel: "Translate post",
        originalLabel: "Show original",
    },
    gallery: {
        ratio: "3:4",
        customRatio: 0.75,
        gap: 8,
        radius: 16,
        outline: true,
        peek: true,
        arrows: "hover",
        drag: true,
        viewer: true,
        minHeight: 220,
    },
    clips: {
        autoplay: true,
        startMuted: true,
        loop: true,
        sound: true,
        timer: true,
    },
    stats: {
        replies: 5,
        reposts: 9,
        likes: 170,
        views: 6700,
        liked: false,
        reposted: false,
        bookmarked: false,
        showViews: true,
        showBookmark: true,
        showShare: true,
        repostLabel: "Repost",
        undoLabel: "Undo repost",
        quoteLabel: "Quote",
        copiedLabel: "Copied to clipboard",
    },
    skin: {
        scheme: "dark",
        background: "#000000",
        text: "#E7E9EA",
        muted: "#71767B",
        lines: "#2F3336",
        accent: "#1D9BF0",
        repostTone: "#00BA7C",
        likeTone: "#F91880",
        padding: 16,
        radius: 0,
        border: false,
        divider: false,
    },
}

/* ═══════════════════════════════ property panel ════════════════════════════ */

const onlyVideo = (o: any) => o?.kind !== "video"
const onlyImage = (o: any) => o?.kind === "video"

addPropertyControls(MicroPostPro, {
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            title: "Item",
            buttonTitle: "Media",
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: onlyImage,
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: onlyImage,
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogg"],
                    hidden: onlyVideo,
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    defaultValue: "",
                    hidden: onlyVideo,
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: onlyVideo,
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: onlyVideo,
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },

    author: {
        type: ControlType.Object,
        title: "Author",
        controls: {
            avatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
            avatarUrl: {
                type: ControlType.String,
                title: "Avatar URL",
                placeholder: "https://…",
                defaultValue: "",
            },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Ilse Marwood",
            },
            handle: {
                type: ControlType.String,
                title: "Handle",
                defaultValue: "ilsemarwood",
            },
            badge: {
                type: ControlType.Enum,
                title: "Badge",
                options: ["none", "blue", "gold", "grey"],
                optionTitles: ["None", "Blue", "Gold", "Grey"],
                defaultValue: "blue",
            },
            time: {
                type: ControlType.String,
                title: "Time",
                defaultValue: "Oct 25",
            },
            profileLink: { type: ControlType.Link, title: "Profile" },
            assist: {
                type: ControlType.Boolean,
                title: "Spark icon",
                defaultValue: true,
            },
            assistLink: {
                type: ControlType.Link,
                title: "Spark link",
                hidden: (o: any) => !o?.assist,
            },
            more: {
                type: ControlType.Boolean,
                title: "More icon",
                defaultValue: true,
            },
            moreLink: {
                type: ControlType.Link,
                title: "More link",
                hidden: (o: any) => o?.more === false,
            },
        },
    },

    post: {
        type: ControlType.Object,
        title: "Post",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                displayTextArea: true,
                defaultValue:
                    "Shot on a frozen lake at 5am — cold light, long exposures, zero retouching. The full winter series drops this Friday ❄️ #filmphotography #winterlight",
            },
            limit: {
                type: ControlType.Number,
                title: "Fold at",
                min: 0,
                max: 4000,
                step: 10,
                defaultValue: 280,
            },
            moreLabel: {
                type: ControlType.String,
                title: "More label",
                defaultValue: "Show more",
            },
            translation: {
                type: ControlType.String,
                title: "Translation",
                displayTextArea: true,
                placeholder: "Optional — adds a translate link",
                defaultValue: "",
            },
            translateLabel: {
                type: ControlType.String,
                title: "Translate",
                defaultValue: "Translate post",
                hidden: (o: any) => !o?.translation,
            },
            originalLabel: {
                type: ControlType.String,
                title: "Original",
                defaultValue: "Show original",
                hidden: (o: any) => !o?.translation,
            },
        },
    },

    gallery: {
        type: ControlType.Object,
        title: "Gallery",
        controls: {
            ratio: {
                type: ControlType.Enum,
                title: "Ratio",
                options: ["3:4", "4:5", "1:1", "4:3", "16:9", "custom"],
                optionTitles: ["3:4", "4:5", "1:1", "4:3", "16:9", "Custom"],
                defaultValue: "3:4",
            },
            customRatio: {
                type: ControlType.Number,
                title: "W ÷ H",
                min: 0.3,
                max: 3,
                step: 0.01,
                defaultValue: 0.75,
                hidden: (o: any) => o?.ratio !== "custom",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 8,
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 16,
                displayStepper: true,
            },
            outline: {
                type: ControlType.Boolean,
                title: "Outline",
                defaultValue: true,
            },
            peek: {
                type: ControlType.Boolean,
                title: "Edge",
                enabledTitle: "Bleed",
                disabledTitle: "Inside",
                defaultValue: true,
            },
            arrows: {
                type: ControlType.Enum,
                title: "Arrows",
                options: ["hover", "always", "off"],
                optionTitles: ["Hover", "Always", "Off"],
                defaultValue: "hover",
                displaySegmentedControl: true,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Mouse drag",
                defaultValue: true,
            },
            viewer: {
                type: ControlType.Boolean,
                title: "Viewer",
                defaultValue: true,
            },
            minHeight: {
                type: ControlType.Number,
                title: "Min height",
                min: 60,
                max: 900,
                step: 10,
                defaultValue: 220,
            },
        },
    },

    clips: {
        type: ControlType.Object,
        title: "Video",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            startMuted: {
                type: ControlType.Boolean,
                title: "Start muted",
                defaultValue: true,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
            },
            sound: {
                type: ControlType.Boolean,
                title: "Sound button",
                defaultValue: true,
            },
            timer: {
                type: ControlType.Boolean,
                title: "Time left",
                defaultValue: true,
            },
        },
    },

    stats: {
        type: ControlType.Object,
        title: "Stats",
        controls: {
            replies: {
                type: ControlType.Number,
                title: "Replies",
                min: 0,
                max: 999999999,
                step: 1,
                defaultValue: 5,
            },
            reposts: {
                type: ControlType.Number,
                title: "Reposts",
                min: 0,
                max: 999999999,
                step: 1,
                defaultValue: 9,
            },
            likes: {
                type: ControlType.Number,
                title: "Likes",
                min: 0,
                max: 999999999,
                step: 1,
                defaultValue: 170,
            },
            views: {
                type: ControlType.Number,
                title: "Views",
                min: 0,
                max: 999999999,
                step: 1,
                defaultValue: 6700,
                hidden: (o: any) => o?.showViews === false,
            },
            liked: {
                type: ControlType.Boolean,
                title: "Liked",
                defaultValue: false,
            },
            reposted: {
                type: ControlType.Boolean,
                title: "Reposted",
                defaultValue: false,
            },
            bookmarked: {
                type: ControlType.Boolean,
                title: "Saved",
                defaultValue: false,
                hidden: (o: any) => o?.showBookmark === false,
            },
            showViews: {
                type: ControlType.Boolean,
                title: "Views",
                defaultValue: true,
            },
            showBookmark: {
                type: ControlType.Boolean,
                title: "Bookmark",
                defaultValue: true,
            },
            showShare: {
                type: ControlType.Boolean,
                title: "Share",
                defaultValue: true,
            },
            replyLink: { type: ControlType.Link, title: "Reply link" },
            quoteLink: { type: ControlType.Link, title: "Quote link" },
            viewsLink: {
                type: ControlType.Link,
                title: "Views link",
                hidden: (o: any) => o?.showViews === false,
            },
            shareUrl: {
                type: ControlType.Link,
                title: "Share URL",
                hidden: (o: any) => o?.showShare === false,
            },
            repostLabel: {
                type: ControlType.String,
                title: "Repost label",
                defaultValue: "Repost",
            },
            undoLabel: {
                type: ControlType.String,
                title: "Undo label",
                defaultValue: "Undo repost",
            },
            quoteLabel: {
                type: ControlType.String,
                title: "Quote label",
                defaultValue: "Quote",
                hidden: (o: any) => !o?.quoteLink,
            },
            copiedLabel: {
                type: ControlType.String,
                title: "Copied label",
                defaultValue: "Copied to clipboard",
                hidden: (o: any) => o?.showShare === false,
            },
        },
    },

    skin: {
        type: ControlType.Object,
        title: "Theme",
        controls: {
            scheme: {
                type: ControlType.Enum,
                title: "Scheme",
                options: ["dark", "dim", "light", "custom"],
                optionTitles: ["Dark", "Dim", "Light", "Custom"],
                defaultValue: "dark",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
                hidden: (o: any) => o?.scheme !== "custom",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#E7E9EA",
                hidden: (o: any) => o?.scheme !== "custom",
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: "#71767B",
                hidden: (o: any) => o?.scheme !== "custom",
            },
            lines: {
                type: ControlType.Color,
                title: "Lines",
                defaultValue: "#2F3336",
                hidden: (o: any) => o?.scheme !== "custom",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#1D9BF0",
            },
            repostTone: {
                type: ControlType.Color,
                title: "Repost",
                defaultValue: "#00BA7C",
            },
            likeTone: {
                type: ControlType.Color,
                title: "Like",
                defaultValue: "#F91880",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 64,
                step: 1,
                defaultValue: 16,
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                step: 1,
                defaultValue: 0,
                displayStepper: true,
            },
            border: {
                type: ControlType.Boolean,
                title: "Border",
                defaultValue: false,
            },
            divider: {
                type: ControlType.Boolean,
                title: "Divider",
                defaultValue: false,
                hidden: (o: any) => !!o?.border,
            },
        },
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Regular",
            letterSpacing: 0,
            lineHeight: 1.333,
        },
    },
})
