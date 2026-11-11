import * as React from "react"
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useCallback,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type Entry = {
    name?: string
    role?: string
    company?: string
    quote?: string
    rating?: number
    image?: { src?: string; srcSet?: string; alt?: string }
    imageUrl?: string
    link?: string
    tab?: string
}

type Palette = {
    ground: string
    ink: string
    inner: string
    front: string
    cards: string[]
}

const PALETTES: Record<string, Palette> = {
    orchard: {
        ground: "#F6F3EC",
        ink: "#1E231D",
        inner: "#D8D0BE",
        front: "#E7E0D0",
        cards: [
            "#C9D8B6",
            "#F2C9A9",
            "#D7CBEA",
            "#F1DE9C",
            "#B9DCD4",
            "#E8B9B5",
            "#E6C79C",
            "#C3CFE6",
            "#D9E3A8",
            "#EBC4D9",
        ],
    },
    atelier: {
        ground: "#EEE6D8",
        ink: "#221D18",
        inner: "#CDBFA6",
        front: "#DED1BA",
        cards: [
            "#C9785B",
            "#DDAF4E",
            "#9CAB7E",
            "#B49CC3",
            "#E3CFB3",
            "#86A3B5",
            "#B5885F",
            "#D49A8C",
            "#7E9488",
            "#CDB670",
        ],
    },
    tidewater: {
        ground: "#F2F5F4",
        ink: "#14232B",
        inner: "#CBD5D4",
        front: "#DFE6E5",
        cards: [
            "#BFD9E6",
            "#9CC5C8",
            "#DCE8D2",
            "#F0E6CF",
            "#A9B8D9",
            "#E6D2C3",
            "#8FB3C9",
            "#D4E6C1",
            "#D7CDE3",
            "#E8D7B9",
        ],
    },
    spice: {
        ground: "#F6EFE3",
        ink: "#231A12",
        inner: "#D9C8AE",
        front: "#E8DAC4",
        cards: [
            "#E9B23B",
            "#C8553D",
            "#8DA46A",
            "#E7A9A1",
            "#4F5D99",
            "#F1E2C4",
            "#D98A4E",
            "#6E8C7A",
            "#B9748C",
            "#E5CF8F",
        ],
    },
    riviera: {
        ground: "#F4F1EA",
        ink: "#16202E",
        inner: "#D6D0C3",
        front: "#E6E1D6",
        cards: [
            "#2D55C8",
            "#EE6A50",
            "#F4CB57",
            "#6CC3BE",
            "#F2B3BB",
            "#1F5A47",
            "#8E6CD9",
            "#F49B3F",
            "#BFE3F2",
            "#E7E0CF",
        ],
    },
    sorbet: {
        ground: "#FFF7EF",
        ink: "#2A1E1A",
        inner: "#EED9C7",
        front: "#F6E6D8",
        cards: [
            "#FFBFA6",
            "#FFDC7C",
            "#B5EACB",
            "#CDBEFF",
            "#FFADD0",
            "#A8DAFF",
            "#FFD3A3",
            "#E3F59E",
            "#C5F1F0",
            "#F7C8F2",
        ],
    },
    graphite: {
        ground: "#F0F0ED",
        ink: "#161616",
        inner: "#CFCFCA",
        front: "#E2E2DE",
        cards: [
            "#FFFFFF",
            "#1E1E1E",
            "#E2E2DE",
            "#44474A",
            "#C8C6BF",
            "#F3F1EB",
            "#8E8E88",
            "#FAFAF7",
            "#2A2A28",
            "#DAD8D1",
        ],
    },
    nocturne: {
        ground: "#121412",
        ink: "#EEEBE3",
        inner: "#0A0C0A",
        front: "#1E221E",
        cards: [
            "#24372E",
            "#33283F",
            "#43302A",
            "#22344A",
            "#463C28",
            "#3E2530",
            "#2E4140",
            "#3A2E28",
            "#30304A",
            "#41382E",
        ],
    },
}

const DARK_TEXT = "#191C18"
const LIGHT_TEXT = "#FAF8F2"

function channels(c: string): [number, number, number] | null {
    if (!c || typeof c !== "string") return null
    const hex = c.match(/#([0-9a-f]{3,8})/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4)
            h = h
                .slice(0, 3)
                .split("")
                .map((x) => x + x)
                .join("")
        const v = parseInt(h.slice(0, 6), 16)
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    }
    const rgb = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
    return null
}

function luma(c: string): number {
    const v = channels(c)
    if (!v) return 1
    const [r, g, b] = v.map((x) => {
        const s = x / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function textFor(bg: string): string {
    const L = luma(bg)
    const vsDark = (L + 0.05) / (luma(DARK_TEXT) + 0.05)
    const vsLight = (luma(LIGHT_TEXT) + 0.05) / (L + 0.05)
    return vsDark >= vsLight ? DARK_TEXT : LIGHT_TEXT
}

function blend(c: string, to: [number, number, number], t: number) {
    const v = channels(c) || [200, 200, 200]
    const m = v.map((x, i) => Math.round(x + (to[i] - x) * t))
    return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}
const lighter = (c: string, t: number) => blend(c, [255, 255, 255], t)
const deeper = (c: string, t: number) => blend(c, [0, 0, 0], t)

function tone(bg: string) {
    const text = textFor(bg)
    const darkCard = text === LIGHT_TEXT
    return {
        bg,
        text,
        mark: darkCard ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
        avatarBg: text,
        avatarText: bg,
    }
}

function resolvePalette(p: any): Palette {
    if (p.theme === "custom") {
        const list =
            Array.isArray(p.customCards) && p.customCards.length
                ? p.customCards
                : PALETTES.orchard.cards
        return {
            ground: p.customGround || PALETTES.orchard.ground,
            ink: p.customInk || PALETTES.orchard.ink,
            inner: p.customInner || PALETTES.orchard.inner,
            front: p.customFront || PALETTES.orchard.front,
            cards: list,
        }
    }
    return PALETTES[p.theme] || PALETTES.orchard
}

type Metal = [string, string, string]
const BRASS: Metal = ["#F4E2AE", "#C7A15A", "#86662C"]
const OLD_BRASS: Metal = ["#D8BF88", "#987A42", "#5A4522"]
const CHROME: Metal = ["#F5F7F8", "#BAC1C6", "#7A838A"]

type Skin = {
    face: string
    texture: string
    well: string
    wall: string
    metal: Metal
    cutout: boolean
    paper: string
    paperInk: string
}

function skinFor(material: string, pal: Palette): Skin {
    const paper = "#F8F3E7"
    const paperInk = "#2A241E"
    if (material === "walnut")
        return {
            face: "#6B4831",
            texture:
                "repeating-linear-gradient(92deg, rgba(0,0,0,0.09) 0 1px, transparent 1px 7px), repeating-linear-gradient(88deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 19px)",
            well: "#2E1F15",
            wall: "#5A3C29",
            metal: BRASS,
            cutout: false,
            paper,
            paperInk,
        }
    if (material === "kraft")
        return {
            face: "#C7A57A",
            texture:
                "repeating-linear-gradient(115deg, rgba(90,60,30,0.06) 0 1px, transparent 1px 5px), repeating-linear-gradient(25deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 7px)",
            well: "#8E7050",
            wall: "#B3926A",
            metal: CHROME,
            cutout: true,
            paper: "#FBF8F1",
            paperInk,
        }
    if (material === "steel")
        return {
            face: "#B8BDC1",
            texture:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 3px)",
            well: "#6F757A",
            wall: "#A3A9AE",
            metal: CHROME,
            cutout: false,
            paper,
            paperInk,
        }
    if (material === "theme") {
        const dark = textFor(pal.ground) === LIGHT_TEXT
        return {
            face: pal.front,
            texture: "linear-gradient(transparent, transparent)",
            well: pal.inner,
            wall: deeper(pal.front, 0.08),
            metal: dark ? OLD_BRASS : BRASS,
            cutout: false,
            paper,
            paperInk,
        }
    }
    return {
        face: "#C9A37A",
        texture:
            "repeating-linear-gradient(90deg, rgba(110,70,30,0.07) 0 2px, transparent 2px 11px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 23px)",
        well: "#7A5A3C",
        wall: "#B48D63",
        metal: BRASS,
        cutout: false,
        paper,
        paperInk,
    }
}

const metalFill = (m: Metal) =>
    `linear-gradient(180deg, ${m[0]} 0%, ${m[1]} 55%, ${m[2]} 100%)`
const rivetFill = (m: Metal) =>
    `radial-gradient(circle at 35% 30%, ${m[0]} 0%, ${m[1]} 55%, ${m[2]} 100%)`
const faceFill = (s: Skin) =>
    `${s.texture}, linear-gradient(180deg, ${lighter(s.face, 0.14)} 0%, ${s.face} 38%, ${deeper(s.face, 0.14)} 100%)`

const PLATE_DEFAULTS = {
    show: true,
    style: "auto",
    metal: "auto",
    frameColor: "#B98F4E",
    rivets: true,
    paper: "#F8F3E7",
    ink: "#2A241E",
    width: 118,
    padX: 14,
    padY: 4,
    radius: 2,
    gap: 1,
    tilt: -1.5,
    subOpacity: 70,
    uppercase: true,
}

function plateFor(p: any, skin: Skin, lf: any) {
    const o = { ...PLATE_DEFAULTS, ...(p.plate || {}) }
    const metals: Record<string, Metal> = {
        brass: BRASS,
        aged: OLD_BRASS,
        chrome: CHROME,
    }
    const metal: Metal =
        o.metal === "custom"
            ? [
                  lighter(o.frameColor, 0.45),
                  o.frameColor,
                  deeper(o.frameColor, 0.35),
              ]
            : metals[o.metal] || skin.metal
    const mode =
        o.style === "auto" ? (skin.cutout ? "sticker" : "framed") : o.style
    return {
        show: o.show !== false,
        mode,
        metal,
        rivets: !!o.rivets,
        paper: o.paper || skin.paper,
        ink: o.ink || skin.paperInk,
        width: Math.max(0, Number(o.width) || 0),
        padX: Math.max(0, Number(o.padX) || 0),
        padY: Math.max(0, Number(o.padY) || 0),
        radius: Math.max(0, Number(o.radius) || 0),
        gap: Math.max(0, Number(o.gap) || 0),
        tilt: Number(o.tilt) || 0,
        subOpacity: Math.min(100, Math.max(0, Number(o.subOpacity))) / 100,
        upper: o.uppercase !== false,
        mainFont: p.plateFont || { ...lf, fontSize: 12 },
        subFont: p.plateSubFont || {
            ...lf,
            fontSize: 9,
            letterSpacing: "0.16em",
        },
    }
}

function marks(text?: string) {
    return String(text || "")
        .split(/\*\*(.+?)\*\*/g)
        .map((t, i) => ({ t, on: i % 2 === 1 }))
        .filter((x) => x.t.length > 0)
}

function initialsOf(name?: string) {
    return (
        String(name || "")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase())
            .join("") || "•"
    )
}

const two = (k: number) => String(k).padStart(2, "0")

function photoOf(e: Entry) {
    return (e.image && e.image.src) || e.imageUrl || ""
}

function isExternal(href?: string) {
    return !!href && /^https?:\/\//i.test(href)
}

const FACE_DEFAULTS = {
    showNumber: true,
    showStars: true,
    showAvatar: true,
    linkLabel: "View project",
}
const DRAWER_DEFAULTS = {
    material: "oak",
    label: "Archive",
    sublabel: "Client feedback",
    showHandle: true,
}
const LAYOUT_DEFAULTS = {
    padding: 28,
    cardWidth: 86,
    radius: 16,
    tabColumns: 3,
    tabWidth: 32,
    pitch: 14,
}
const BEHAVIOUR_DEFAULTS = {
    autoplay: true,
    interval: 7,
    pauseOnHover: true,
    dragToFile: true,
    intro: true,
}

const QUOTE_FONT = {
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "-0.005em",
    lineHeight: "1.38em",
}
const BODY_FONT = { fontSize: 14, fontWeight: 400, lineHeight: "1.35em" }
const LABEL_FONT = {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.02em",
    lineHeight: "1.2em",
}

const TAB_H = 30

const SAMPLE_CARDS: Entry[] = [
    {
        name: "Amira Hassan",
        role: "Operations Director",
        company: "Logistics firm",
        quote: "Our weekly reviews used to drag on for an hour and end with more questions than answers. Now they take **ten calm minutes**, everyone leaves knowing their next step, and the team actually looks forward to them.",
        rating: 5,
    },
    {
        name: "Daniel Okafor",
        role: "Creative Director",
        company: "Branding agency",
        quote: "We arrived with a messy idea and a deadline that felt impossible. They gave it a shape we could **finally explain** to our own clients, and every round of feedback made the work sharper rather than slower.",
        rating: 5,
    },
    {
        name: "Sofia Lindqvist",
        role: "Product Manager",
        company: "Software company",
        quote: "Clear timelines, quick replies and **no guesswork** at any stage of the build. When something changed on our side, they reworked the plan that same afternoon and still delivered in the week we agreed.",
        rating: 5,
    },
    {
        name: "Rohan Mehta",
        role: "Co-founder",
        company: "Travel startup",
        quote: "Visitors used to email us asking how to book. After the redesign those messages simply stopped. **The whole flow just made sense**, and our small support team finally had time for real conversations.",
        rating: 5,
    },
    {
        name: "Clara Dubois",
        role: "Marketing Lead",
        company: "Skincare label",
        quote: "Every draft arrived sharper than the brief we sent, so **we rarely asked for changes**. They noticed tiny details in tone and colour that most people would miss, and our customers noticed them too.",
        rating: 4,
    },
    {
        name: "Ethan Brooks",
        role: "Studio Owner",
        company: "Furniture workshop",
        quote: "A small team with real care behind every decision. They listened first, asked smart questions about how we work, and **built exactly what we needed** without trying to sell us anything extra.",
        rating: 5,
    },
    {
        name: "Mei Tanaka",
        role: "Head of Design",
        company: "Fashion retailer",
        quote: "We had tried three teams before and always ended up redoing the work. This time the first version was already better than what we imagined, and **launch week felt quiet in the best way**.",
        rating: 5,
    },
    {
        name: "Lucas Ferreira",
        role: "Engineering Lead",
        company: "Payments platform",
        quote: "They write the kind of documentation engineers actually read. Months later our team still opens their notes first, and **onboarding new people takes days, not weeks**.",
        rating: 5,
    },
    {
        name: "Nadia Rahman",
        role: "Founder",
        company: "Wellness studio",
        quote: "I am not technical at all, yet I never felt lost. Every call ended with a plain summary of what happened and what came next, and **I always knew where the budget was going**.",
        rating: 5,
    },
    {
        name: "Oliver Grant",
        role: "Head of Growth",
        company: "Online learning",
        quote: "They challenged two of our biggest assumptions in the very first workshop. It felt uncomfortable for a day, and then **it reshaped our whole roadmap** for the better.",
        rating: 4,
    },
]

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Docket(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <DocketStill {...props} />
    return <DocketLive {...props} />
}

/* ------------------------------------------------------------------ */
/* Static branch — plain elements only                                 */
/* ------------------------------------------------------------------ */

function DocketStill(p: any) {
    const cards: Entry[] = Array.isArray(p.cards) ? p.cards : SAMPLE_CARDS
    const n = cards.length
    const pal = resolvePalette(p)
    const face = { ...FACE_DEFAULTS, ...(p.face || {}) }
    const box = { ...DRAWER_DEFAULTS, ...(p.drawer || {}) }
    const lay = { ...LAYOUT_DEFAULTS, ...(p.layout || {}) }
    const qf = p.quoteFont || QUOTE_FONT
    const bf = p.bodyFont || BODY_FONT
    const lf = p.labelFont || LABEL_FONT
    const up = n
        ? Math.min(n - 1, Math.max(0, Math.round((p.startIndex || 1) - 1)))
        : 0
    const skin = skinFor(box.material, pal)
    const plate = plateFor(p, skin, lf)
    const metal = plate.metal

    const D = "clamp(80px, 20%, 140px)"
    const pitch =
        n > 1
            ? `max(4px, min(${lay.pitch}px, calc((58% - ${D} - 102px) / ${n - 1})))`
            : "0px"
    const slot = (i: number) =>
        `calc(100% - ${D} - 30px - ${n - 1 - i} * ${pitch})`
    const cardH = `max(120px, calc(100% - ${D} - 30px - ${Math.max(0, n - 1)} * ${pitch} - 72px))`
    const cw = Math.min(100, Math.max(40, lay.cardWidth))
    const cols = Math.max(1, Math.round(lay.tabColumns))
    const tw = Math.min(100, Math.max(12, lay.tabWidth))
    const r = lay.radius
    const wellW = Math.min(100, cw + 6)
    const wellL = (100 - wellW) / 2
    const frontW = Math.min(100, cw + 8)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: lay.padding,
                background: pal.ground,
                color: pal.ink,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflow: "hidden",
                ...bf,
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                }}
            >
                {n === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.6,
                        }}
                    >
                        Add a testimonial card to begin.
                    </div>
                )}

                {n > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            left: `${wellL}%`,
                            width: `${wellW}%`,
                            top: `calc(${slot(0)} - 44px)`,
                            bottom: `calc(${D} - 24px)`,
                            borderRadius: `${Math.round(r * 0.5)}px ${Math.round(r * 0.5)}px 0 0`,
                            background: `linear-gradient(180deg, ${deeper(skin.well, 0.3)} 0%, ${skin.well} 45%)`,
                            boxShadow:
                                "inset 0 16px 22px -8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.1)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: 8,
                                background: `linear-gradient(180deg, ${lighter(skin.wall, 0.2)}, ${skin.wall})`,
                            }}
                        />
                    </div>
                )}

                {cards.map((c, i) => {
                    const t = tone(pal.cards[i % pal.cards.length] || "#E8E8E3")
                    const col = i % cols
                    const tabLeft =
                        cols > 1 ? (col * (100 - tw)) / (cols - 1) : 0
                    const isUp = i === up
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: `${(100 - cw) / 2}%`,
                                width: `${cw}%`,
                                top: isUp ? `${TAB_H}px` : slot(i),
                                height: cardH,
                                zIndex: isUp ? 60 : i + 1,
                                background: t.bg,
                                color: t.text,
                                borderRadius: r,
                                borderTopLeftRadius: col === 0 ? 0 : r,
                                borderTopRightRadius:
                                    col === cols - 1 && cols > 1 ? 0 : r,
                                boxShadow: isUp
                                    ? "0 26px 50px rgba(0,0,0,0.18)"
                                    : "0 -4px 14px rgba(0,0,0,0.10)",
                                boxSizing: "border-box",
                                padding: "14px 22px 20px",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: -TAB_H,
                                    left: `${tabLeft}%`,
                                    width: `${tw}%`,
                                    height: TAB_H,
                                    boxSizing: "border-box",
                                    padding: "0 12px",
                                    background: t.bg,
                                    color: t.text,
                                    borderRadius: `${Math.round(r * 0.7)}px ${Math.round(r * 0.7)}px 0 0`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                }}
                            >
                                <span
                                    style={{
                                        ...bf,
                                        fontWeight: 600,
                                        fontSize: 13,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {c.tab || c.name}
                                </span>
                                <span style={{ ...lf, opacity: 0.7 }}>
                                    {two(i + 1)}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <span
                                    style={{
                                        ...lf,
                                        opacity: 0.72,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {face.showNumber ? `No. ${two(i + 1)}` : ""}
                                    {face.showNumber && c.company ? " · " : ""}
                                    {c.company}
                                </span>
                                {face.showStars && (
                                    <span
                                        style={{
                                            display: "flex",
                                            gap: 2,
                                            flexShrink: 0,
                                        }}
                                        aria-label={`${c.rating || 0} out of 5`}
                                    >
                                        {[0, 1, 2, 3, 4].map((s) => (
                                            <svg
                                                key={s}
                                                width="13"
                                                height="13"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                                style={{
                                                    opacity:
                                                        s < (c.rating || 0)
                                                            ? 1
                                                            : 0.25,
                                                }}
                                            >
                                                <path
                                                    fill="currentColor"
                                                    d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3 6.1 20.5l1.3-6.5L2.5 9.4l6.6-.8z"
                                                />
                                            </svg>
                                        ))}
                                    </span>
                                )}
                            </div>

                            <p
                                style={{
                                    margin: "14px 0 0",
                                    flex: 1,
                                    minHeight: 0,
                                    overflow: "hidden",
                                    ...qf,
                                }}
                            >
                                “
                                {marks(c.quote).map((m, k) =>
                                    m.on ? (
                                        <span
                                            key={k}
                                            style={{
                                                background: t.mark,
                                                borderRadius: "0.25em",
                                                padding: "0 0.2em",
                                                boxDecorationBreak: "clone",
                                                WebkitBoxDecorationBreak:
                                                    "clone",
                                            }}
                                        >
                                            {m.t}
                                        </span>
                                    ) : (
                                        <React.Fragment key={k}>
                                            {m.t}
                                        </React.Fragment>
                                    )
                                )}
                                ”
                            </p>

                            <div
                                style={{
                                    height: 1,
                                    background: t.text,
                                    opacity: 0.45,
                                    margin: "12px 0 14px",
                                    flexShrink: 0,
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    flexShrink: 0,
                                }}
                            >
                                {face.showAvatar &&
                                    (photoOf(c) ? (
                                        <img
                                            src={photoOf(c)}
                                            srcSet={c.image?.srcSet}
                                            alt={c.image?.alt || c.name || ""}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                background: t.avatarBg,
                                                color: t.avatarText,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {initialsOf(c.name)}
                                        </div>
                                    ))}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        minWidth: 0,
                                        flex: 1,
                                    }}
                                >
                                    <span style={{ ...bf, fontWeight: 600 }}>
                                        {c.name}
                                    </span>
                                    <span style={{ ...bf, opacity: 0.72 }}>
                                        {c.role}
                                    </span>
                                </div>
                                {c.link && face.linkLabel && (
                                    <span
                                        style={{
                                            ...bf,
                                            fontWeight: 600,
                                            textDecoration: "underline",
                                            textUnderlineOffset: 3,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {face.linkLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}

                {n > 0 &&
                    [0, 1].map((side) => (
                        <div
                            key={side}
                            style={{
                                position: "absolute",
                                left:
                                    side === 0
                                        ? `${wellL}%`
                                        : `calc(${wellL + wellW}% - 2.6%)`,
                                width: "2.6%",
                                top: `calc(${slot(0)} - 44px)`,
                                bottom: `calc(${D} - 6px)`,
                                zIndex: 70,
                                borderRadius:
                                    side === 0 ? "4px 0 0 0" : "0 4px 0 0",
                                background:
                                    side === 0
                                        ? `linear-gradient(90deg, ${lighter(skin.wall, 0.16)} 0%, ${skin.wall} 60%, ${deeper(skin.wall, 0.2)} 100%)`
                                        : `linear-gradient(270deg, ${lighter(skin.wall, 0.08)} 0%, ${skin.wall} 50%, ${deeper(skin.wall, 0.24)} 100%)`,
                                boxShadow:
                                    side === 0
                                        ? "3px 0 6px rgba(0,0,0,0.18)"
                                        : "-3px 0 6px rgba(0,0,0,0.18)",
                            }}
                        />
                    ))}

                {n > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            left: `${(100 - frontW) / 2}%`,
                            width: `${frontW}%`,
                            bottom: 0,
                            height: D,
                            zIndex: 80,
                            boxSizing: "border-box",
                            background: faceFill(skin),
                            borderRadius: `${Math.round(r * 0.6)}px ${Math.round(r * 0.6)}px ${r}px ${r}px`,
                            boxShadow:
                                "0 22px 30px -16px rgba(0,0,0,0.5), 0 -2px 0 rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.14)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 10,
                                borderRadius: Math.max(4, Math.round(r * 0.45)),
                                boxShadow:
                                    "inset 0 1px 2px rgba(0,0,0,0.24), 0 1px 0 rgba(255,255,255,0.28)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                overflow: "hidden",
                            }}
                        >
                            {plate.show &&
                                (box.label || box.sublabel) &&
                                (plate.mode === "framed" ? (
                                    <div
                                        style={{
                                            position: "relative",
                                            padding: plate.rivets
                                                ? "4px 20px"
                                                : "4px 6px",
                                            borderRadius: plate.radius + 2,
                                            background: metalFill(metal),
                                            boxShadow:
                                                "0 2px 3px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.6)",
                                        }}
                                    >
                                        {plate.rivets &&
                                            [0, 1].map((k) => (
                                                <span
                                                    key={k}
                                                    style={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        marginTop: -3,
                                                        left:
                                                            k === 0
                                                                ? 7
                                                                : undefined,
                                                        right:
                                                            k === 1
                                                                ? 7
                                                                : undefined,
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background:
                                                            rivetFill(metal),
                                                        boxShadow:
                                                            "0 1px 1px rgba(0,0,0,0.35)",
                                                    }}
                                                />
                                            ))}
                                        <div
                                            style={{
                                                minWidth: plate.width,
                                                padding: `${plate.padY}px ${plate.padX}px`,
                                                borderRadius: plate.radius,
                                                background: plate.paper,
                                                color: plate.ink,
                                                boxShadow:
                                                    "inset 0 1px 2px rgba(0,0,0,0.25)",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: plate.gap,
                                            }}
                                        >
                                            {box.label && (
                                                <span
                                                    style={{
                                                        ...plate.mainFont,
                                                        color: plate.ink,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {box.label}
                                                </span>
                                            )}
                                            {box.sublabel && (
                                                <span
                                                    style={{
                                                        ...plate.subFont,
                                                        color: plate.ink,
                                                        textAlign: "center",
                                                        textTransform:
                                                            plate.upper
                                                                ? "uppercase"
                                                                : "none",
                                                        opacity:
                                                            plate.subOpacity,
                                                    }}
                                                >
                                                    {box.sublabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            transform:
                                                plate.mode === "sticker"
                                                    ? `rotate(${plate.tilt}deg)`
                                                    : undefined,
                                            minWidth: plate.width,
                                            padding: `${plate.padY + 2}px ${plate.padX + 4}px`,
                                            borderRadius: plate.radius + 1,
                                            background: plate.paper,
                                            color: plate.ink,
                                            border: "1px solid rgba(0,0,0,0.06)",
                                            boxShadow:
                                                plate.mode === "sticker"
                                                    ? "0 1px 2px rgba(0,0,0,0.25)"
                                                    : "inset 0 1px 2px rgba(0,0,0,0.22)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: plate.gap + 1,
                                        }}
                                    >
                                        {box.label && (
                                            <span
                                                style={{
                                                    ...plate.mainFont,
                                                    color: plate.ink,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {box.label}
                                            </span>
                                        )}
                                        {box.sublabel && (
                                            <span
                                                style={{
                                                    ...plate.subFont,
                                                    color: plate.ink,
                                                    textAlign: "center",
                                                    textTransform: plate.upper
                                                        ? "uppercase"
                                                        : "none",
                                                    opacity: plate.subOpacity,
                                                }}
                                            >
                                                {box.sublabel}
                                            </span>
                                        )}
                                    </div>
                                ))}

                            {box.showHandle &&
                                (skin.cutout ? (
                                    <div
                                        style={{
                                            width: "22%",
                                            maxWidth: 130,
                                            minWidth: 64,
                                            height: 18,
                                            flexShrink: 0,
                                            borderRadius: 999,
                                            background: "#2B1F14",
                                            boxShadow:
                                                "inset 0 4px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.35)",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            position: "relative",
                                            width: "24%",
                                            maxWidth: 140,
                                            minWidth: 72,
                                            height: 20,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {[0, 1].map((k) => (
                                            <span
                                                key={k}
                                                style={{
                                                    position: "absolute",
                                                    top: -3,
                                                    left:
                                                        k === 0
                                                            ? -3
                                                            : undefined,
                                                    right:
                                                        k === 1
                                                            ? -3
                                                            : undefined,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: "50%",
                                                    background:
                                                        rivetFill(metal),
                                                    boxShadow:
                                                        "0 2px 2px rgba(0,0,0,0.35)",
                                                }}
                                            />
                                        ))}
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: "0 4px",
                                                borderRadius:
                                                    "3px 3px 999px 999px / 3px 3px 18px 18px",
                                                background: `linear-gradient(180deg, ${metal[2]} 0%, ${metal[1]} 30%, ${metal[0]} 72%, ${metal[1]} 100%)`,
                                                boxShadow:
                                                    "0 6px 8px -3px rgba(0,0,0,0.45), inset 0 -2px 0 rgba(0,0,0,0.2)",
                                            }}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

const useSafeLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function useStageSize(ref: React.RefObject<HTMLDivElement>) {
    const [size, setSize] = useState({ w: 0, h: 0 })
    useSafeLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const read = () =>
            setSize((prev) =>
                prev.w === el.clientWidth && prev.h === el.clientHeight
                    ? prev
                    : { w: el.clientWidth, h: el.clientHeight }
            )
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return size
}

function useOnScreen(ref: React.RefObject<HTMLDivElement>) {
    const [inView, setInView] = useState(false)
    const [tabShown, setTabShown] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (list) => setInView(list[0]?.isIntersecting ?? false),
            { threshold: 0.12 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setTabShown(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return inView && tabShown
}

function useCalmMotion() {
    const query = "(prefers-reduced-motion: reduce)"
    const [calm, setCalm] = useState(
        () =>
            typeof window !== "undefined" &&
            !!window.matchMedia &&
            window.matchMedia(query).matches
    )
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia(query)
        const sync = () => setCalm(mq.matches)
        sync()
        if (mq.addEventListener) mq.addEventListener("change", sync)
        else mq.addListener(sync)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", sync)
            else mq.removeListener(sync)
        }
    }, [])
    return calm
}

function drawerPlan(
    S: number,
    W: number,
    n: number,
    pitchCap: number,
    cardWidth: number
) {
    const D = Math.min(140, Math.max(80, S * 0.2))
    const front = S - D
    const room = front - 30 - 72 - S * 0.42
    const pitch = n > 1 ? Math.max(4, Math.min(pitchCap, room / (n - 1))) : 0
    const ch = Math.max(120, front - 30 - (n - 1) * pitch - 72)
    const cw = (W * Math.min(100, Math.max(40, cardWidth))) / 100
    return {
        D,
        front,
        ch,
        cw,
        left: (W - cw) / 2,
        raised: TAB_H,
        slot: (i: number) => front - 30 - (n - 1 - i) * pitch,
    }
}

function DocketLive(p: any) {
    const cards: Entry[] = Array.isArray(p.cards) ? p.cards : SAMPLE_CARDS
    const n = cards.length
    const pal = resolvePalette(p)
    const face = { ...FACE_DEFAULTS, ...(p.face || {}) }
    const box = { ...DRAWER_DEFAULTS, ...(p.drawer || {}) }
    const lay = { ...LAYOUT_DEFAULTS, ...(p.layout || {}) }
    const act = { ...BEHAVIOUR_DEFAULTS, ...(p.behaviour || {}) }
    const qf = p.quoteFont || QUOTE_FONT
    const bf = p.bodyFont || BODY_FONT
    const lf = p.labelFont || LABEL_FONT
    const skin = skinFor(box.material, pal)
    const plate = plateFor(p, skin, lf)
    const metal = plate.metal

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const size = useStageSize(stageRef)
    const onScreen = useOnScreen(rootRef)
    const calm = useCalmMotion()

    const [pick, setPick] = useState(() =>
        Math.max(0, Math.round((p.startIndex || 1) - 1))
    )
    const current = n ? ((pick % n) + n) % n : 0
    const [peek, setPeek] = useState(-1)
    const [hovering, setHovering] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [stage, setStage] = useState<"hold" | "intro" | "rest">(() =>
        act.intro ? "hold" : "rest"
    )

    const step = useCallback(
        (d: number) => {
            if (!n) return
            setPick((v) => (((v + d) % n) + n) % n)
        },
        [n]
    )

    // Intro starts only once the section is first on screen.
    useEffect(() => {
        if (stage !== "hold" || !onScreen || size.h === 0) return
        if (calm) {
            setStage("rest")
            return
        }
        setStage("intro")
    }, [stage, onScreen, size.h, calm])

    const STAGGER = 0.07
    useEffect(() => {
        if (stage !== "intro") return
        const t = setTimeout(() => setStage("rest"), (n * STAGGER + 1.1) * 1000)
        return () => clearTimeout(t)
    }, [stage, n])

    // Autoplay: armed only while visible, tab shown, motion allowed and idle.
    const permit =
        act.autoplay &&
        onScreen &&
        !calm &&
        stage === "rest" &&
        !dragging &&
        !(act.pauseOnHover && hovering) &&
        n > 1
    useEffect(() => {
        if (!permit) return
        const ms = Math.max(1.5, Number(act.interval) || 7) * 1000
        const t = setTimeout(() => step(1), ms)
        return () => clearTimeout(t)
    }, [permit, current, act.interval, step])

    // Parking clears transient pointer state.
    useEffect(() => {
        if (!onScreen) {
            setPeek(-1)
            setDragging(false)
        }
    }, [onScreen])

    const baseMove = calm
        ? { duration: 0 }
        : p.transition || {
              type: "spring",
              stiffness: 240,
              damping: 30,
              mass: 1,
          }
    const S = size.h || 540
    const W = size.w || 640
    const g = drawerPlan(S, W, n, lay.pitch, lay.cardWidth)
    const cols = Math.max(1, Math.round(lay.tabColumns))
    const tw = Math.min(100, Math.max(12, lay.tabWidth))
    const r = lay.radius
    const wellLeft = g.left - W * 0.03
    const wellWidth = g.cw + W * 0.06
    const wellTop = g.slot(0) - 44
    const wallW = W * 0.026
    const hidden = stage === "hold"

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            step(1)
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            step(-1)
        }
    }

    const active = cards[current]

    return (
        <div
            ref={rootRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonials"
            onKeyDown={onKey}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => {
                setHovering(false)
                setPeek(-1)
            }}
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: lay.padding,
                background: pal.ground,
                color: pal.ink,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflow: "hidden",
                outlineOffset: -2,
                ...bf,
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    opacity: size.h ? 1 : 0,
                }}
            >
                {n === 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.6,
                        }}
                    >
                        Add a testimonial card to begin.
                    </div>
                )}

                {n > 0 && (
                    <motion.div
                        aria-hidden="true"
                        initial={false}
                        animate={{
                            opacity: hidden ? 0 : 1,
                            y: hidden ? 40 : 0,
                        }}
                        transition={{
                            duration: calm ? 0 : 0.6,
                            ease: [0.22, 0.8, 0.3, 1],
                        }}
                        style={{
                            position: "absolute",
                            left: wellLeft,
                            width: wellWidth,
                            top: wellTop,
                            height: g.front - wellTop + 24,
                            borderRadius: `${Math.round(r * 0.5)}px ${Math.round(r * 0.5)}px 0 0`,
                            background: `linear-gradient(180deg, ${deeper(skin.well, 0.3)} 0%, ${skin.well} 45%)`,
                            boxShadow:
                                "inset 0 16px 22px -8px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.1)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: 8,
                                background: `linear-gradient(180deg, ${lighter(skin.wall, 0.2)}, ${skin.wall})`,
                            }}
                        />
                    </motion.div>
                )}

                {cards.map((c, i) => {
                    const t = tone(pal.cards[i % pal.cards.length] || "#E8E8E3")
                    const col = i % cols
                    const tabLeft =
                        cols > 1 ? (col * (100 - tw)) / (cols - 1) : 0
                    const isUp = i === current
                    const lift = !isUp && peek === i ? -8 : 0
                    const restY = isUp ? g.raised : g.slot(i) + lift
                    const y = hidden ? S + 60 : restY
                    const move =
                        stage === "intro"
                            ? {
                                  ...baseMove,
                                  delay: isUp
                                      ? n * STAGGER + 0.18
                                      : i * STAGGER,
                              }
                            : baseMove
                    const canDrag = isUp && act.dragToFile && n > 1 && !calm
                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{ y, opacity: hidden ? 0 : 1 }}
                            transition={{
                                y: move,
                                opacity: {
                                    duration: calm ? 0 : 0.3,
                                    delay: stage === "intro" ? i * STAGGER : 0,
                                },
                            }}
                            onClick={isUp ? undefined : () => setPick(i)}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: g.left,
                                width: g.cw,
                                height: g.ch,
                                zIndex: isUp ? 60 : i + 1,
                                cursor: isUp ? "default" : "pointer",
                            }}
                        >
                            <motion.div
                                drag={canDrag ? "y" : false}
                                dragSnapToOrigin
                                dragElastic={0.45}
                                dragConstraints={{ top: 0, bottom: 0 }}
                                onDragStart={() => setDragging(true)}
                                onDragEnd={(_, info) => {
                                    setDragging(false)
                                    if (
                                        info.offset.y > 64 ||
                                        info.velocity.y > 650
                                    )
                                        step(1)
                                    else if (
                                        info.offset.y < -64 ||
                                        info.velocity.y < -650
                                    )
                                        step(-1)
                                }}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    boxSizing: "border-box",
                                    padding: "14px 22px 20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    background: t.bg,
                                    color: t.text,
                                    borderRadius: r,
                                    borderTopLeftRadius: col === 0 ? 0 : r,
                                    borderTopRightRadius:
                                        col === cols - 1 && cols > 1 ? 0 : r,
                                    boxShadow: isUp
                                        ? "0 26px 50px rgba(0,0,0,0.18)"
                                        : "0 -4px 14px rgba(0,0,0,0.10)",
                                    transition: calm
                                        ? "none"
                                        : "box-shadow 0.45s ease",
                                    cursor: canDrag
                                        ? dragging
                                            ? "grabbing"
                                            : "grab"
                                        : undefined,
                                    touchAction: canDrag ? "pan-x" : undefined,
                                }}
                            >
                                <button
                                    type="button"
                                    aria-label={`Show testimonial from ${c.name || `card ${i + 1}`}`}
                                    aria-pressed={isUp}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setPick(i)
                                    }}
                                    onMouseEnter={() => setPeek(i)}
                                    onMouseLeave={() => setPeek(-1)}
                                    onFocus={() => setPeek(i)}
                                    onBlur={() => setPeek(-1)}
                                    style={{
                                        position: "absolute",
                                        top: -TAB_H,
                                        left: `${tabLeft}%`,
                                        width: `${tw}%`,
                                        height: TAB_H,
                                        boxSizing: "border-box",
                                        padding: "0 12px",
                                        margin: 0,
                                        border: 0,
                                        cursor: "pointer",
                                        background: t.bg,
                                        color: t.text,
                                        borderRadius: `${Math.round(r * 0.7)}px ${Math.round(r * 0.7)}px 0 0`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 8,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textAlign: "left",
                                    }}
                                >
                                    <span
                                        style={{
                                            ...bf,
                                            fontWeight: 600,
                                            fontSize: 13,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {c.tab || c.name}
                                    </span>
                                    <span style={{ ...lf, opacity: 0.7 }}>
                                        {two(i + 1)}
                                    </span>
                                </button>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            ...lf,
                                            opacity: 0.72,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {face.showNumber
                                            ? `No. ${two(i + 1)}`
                                            : ""}
                                        {face.showNumber && c.company
                                            ? " · "
                                            : ""}
                                        {c.company}
                                    </span>
                                    {face.showStars && (
                                        <span
                                            style={{
                                                display: "flex",
                                                gap: 2,
                                                flexShrink: 0,
                                            }}
                                            aria-label={`${c.rating || 0} out of 5`}
                                        >
                                            {[0, 1, 2, 3, 4].map((s) => (
                                                <svg
                                                    key={s}
                                                    width="13"
                                                    height="13"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    style={{
                                                        opacity:
                                                            s < (c.rating || 0)
                                                                ? 1
                                                                : 0.25,
                                                    }}
                                                >
                                                    <path
                                                        fill="currentColor"
                                                        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3 6.1 20.5l1.3-6.5L2.5 9.4l6.6-.8z"
                                                    />
                                                </svg>
                                            ))}
                                        </span>
                                    )}
                                </div>

                                <p
                                    style={{
                                        margin: "14px 0 0",
                                        flex: 1,
                                        minHeight: 0,
                                        overflow: "hidden",
                                        userSelect: canDrag
                                            ? "none"
                                            : undefined,
                                        ...qf,
                                    }}
                                >
                                    “
                                    {marks(c.quote).map((m, k) =>
                                        m.on ? (
                                            <span
                                                key={k}
                                                style={{
                                                    background: t.mark,
                                                    borderRadius: "0.25em",
                                                    padding: "0 0.2em",
                                                    boxDecorationBreak: "clone",
                                                    WebkitBoxDecorationBreak:
                                                        "clone",
                                                }}
                                            >
                                                {m.t}
                                            </span>
                                        ) : (
                                            <React.Fragment key={k}>
                                                {m.t}
                                            </React.Fragment>
                                        )
                                    )}
                                    ”
                                </p>

                                <div
                                    style={{
                                        height: 1,
                                        background: t.text,
                                        opacity: 0.45,
                                        margin: "12px 0 14px",
                                        flexShrink: 0,
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        flexShrink: 0,
                                    }}
                                >
                                    {face.showAvatar &&
                                        (photoOf(c) ? (
                                            <img
                                                src={photoOf(c)}
                                                srcSet={c.image?.srcSet}
                                                alt={
                                                    c.image?.alt || c.name || ""
                                                }
                                                draggable={false}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    background: t.avatarBg,
                                                    color: t.avatarText,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {initialsOf(c.name)}
                                            </div>
                                        ))}
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            minWidth: 0,
                                            flex: 1,
                                        }}
                                    >
                                        <span
                                            style={{ ...bf, fontWeight: 600 }}
                                        >
                                            {c.name}
                                        </span>
                                        <span style={{ ...bf, opacity: 0.72 }}>
                                            {c.role}
                                        </span>
                                    </div>
                                    {c.link && face.linkLabel && (
                                        <a
                                            href={c.link}
                                            target={
                                                isExternal(c.link)
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                isExternal(c.link)
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            tabIndex={isUp ? 0 : -1}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                ...bf,
                                                color: "inherit",
                                                fontWeight: 600,
                                                textDecoration: "underline",
                                                textUnderlineOffset: 3,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {face.linkLabel}
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                })}

                {n > 0 &&
                    [0, 1].map((side) => (
                        <motion.div
                            key={side}
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                opacity: hidden ? 0 : 1,
                                y: hidden ? 40 : 0,
                            }}
                            transition={{
                                duration: calm ? 0 : 0.6,
                                ease: [0.22, 0.8, 0.3, 1],
                            }}
                            style={{
                                position: "absolute",
                                left:
                                    side === 0
                                        ? wellLeft
                                        : wellLeft + wellWidth - wallW,
                                width: wallW,
                                top: wellTop,
                                height: g.front - wellTop + 6,
                                zIndex: 70,
                                borderRadius:
                                    side === 0 ? "4px 0 0 0" : "0 4px 0 0",
                                background:
                                    side === 0
                                        ? `linear-gradient(90deg, ${lighter(skin.wall, 0.16)} 0%, ${skin.wall} 60%, ${deeper(skin.wall, 0.2)} 100%)`
                                        : `linear-gradient(270deg, ${lighter(skin.wall, 0.08)} 0%, ${skin.wall} 50%, ${deeper(skin.wall, 0.24)} 100%)`,
                                boxShadow:
                                    side === 0
                                        ? "3px 0 6px rgba(0,0,0,0.18)"
                                        : "-3px 0 6px rgba(0,0,0,0.18)",
                            }}
                        />
                    ))}

                {n > 0 && (
                    <motion.div
                        initial={false}
                        animate={{
                            y: hidden ? 40 : 0,
                            opacity: hidden ? 0 : 1,
                        }}
                        transition={{
                            duration: calm ? 0 : 0.6,
                            ease: [0.22, 0.8, 0.3, 1],
                        }}
                        style={{
                            position: "absolute",
                            left: g.left - W * 0.04,
                            width: g.cw + W * 0.08,
                            top: g.front,
                            height: g.D,
                            zIndex: 80,
                            boxSizing: "border-box",
                            background: faceFill(skin),
                            borderRadius: `${Math.round(r * 0.6)}px ${Math.round(r * 0.6)}px ${r}px ${r}px`,
                            boxShadow:
                                "0 22px 30px -16px rgba(0,0,0,0.5), 0 -2px 0 rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.14)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 10,
                                borderRadius: Math.max(4, Math.round(r * 0.45)),
                                boxShadow:
                                    "inset 0 1px 2px rgba(0,0,0,0.24), 0 1px 0 rgba(255,255,255,0.28)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                overflow: "hidden",
                            }}
                        >
                            {plate.show &&
                                (box.label || box.sublabel) &&
                                (plate.mode === "framed" ? (
                                    <div
                                        style={{
                                            position: "relative",
                                            padding: plate.rivets
                                                ? "4px 20px"
                                                : "4px 6px",
                                            borderRadius: plate.radius + 2,
                                            background: metalFill(metal),
                                            boxShadow:
                                                "0 2px 3px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.6)",
                                        }}
                                    >
                                        {plate.rivets &&
                                            [0, 1].map((k) => (
                                                <span
                                                    key={k}
                                                    style={{
                                                        position: "absolute",
                                                        top: "50%",
                                                        marginTop: -3,
                                                        left:
                                                            k === 0
                                                                ? 7
                                                                : undefined,
                                                        right:
                                                            k === 1
                                                                ? 7
                                                                : undefined,
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background:
                                                            rivetFill(metal),
                                                        boxShadow:
                                                            "0 1px 1px rgba(0,0,0,0.35)",
                                                    }}
                                                />
                                            ))}
                                        <div
                                            style={{
                                                minWidth: plate.width,
                                                padding: `${plate.padY}px ${plate.padX}px`,
                                                borderRadius: plate.radius,
                                                background: plate.paper,
                                                color: plate.ink,
                                                boxShadow:
                                                    "inset 0 1px 2px rgba(0,0,0,0.25)",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: plate.gap,
                                            }}
                                        >
                                            {box.label && (
                                                <span
                                                    style={{
                                                        ...plate.mainFont,
                                                        color: plate.ink,
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {box.label}
                                                </span>
                                            )}
                                            {box.sublabel && (
                                                <span
                                                    style={{
                                                        ...plate.subFont,
                                                        color: plate.ink,
                                                        textAlign: "center",
                                                        textTransform:
                                                            plate.upper
                                                                ? "uppercase"
                                                                : "none",
                                                        opacity:
                                                            plate.subOpacity,
                                                    }}
                                                >
                                                    {box.sublabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            transform:
                                                plate.mode === "sticker"
                                                    ? `rotate(${plate.tilt}deg)`
                                                    : undefined,
                                            minWidth: plate.width,
                                            padding: `${plate.padY + 2}px ${plate.padX + 4}px`,
                                            borderRadius: plate.radius + 1,
                                            background: plate.paper,
                                            color: plate.ink,
                                            border: "1px solid rgba(0,0,0,0.06)",
                                            boxShadow:
                                                plate.mode === "sticker"
                                                    ? "0 1px 2px rgba(0,0,0,0.25)"
                                                    : "inset 0 1px 2px rgba(0,0,0,0.22)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: plate.gap + 1,
                                        }}
                                    >
                                        {box.label && (
                                            <span
                                                style={{
                                                    ...plate.mainFont,
                                                    color: plate.ink,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {box.label}
                                            </span>
                                        )}
                                        {box.sublabel && (
                                            <span
                                                style={{
                                                    ...plate.subFont,
                                                    color: plate.ink,
                                                    textAlign: "center",
                                                    textTransform: plate.upper
                                                        ? "uppercase"
                                                        : "none",
                                                    opacity: plate.subOpacity,
                                                }}
                                            >
                                                {box.sublabel}
                                            </span>
                                        )}
                                    </div>
                                ))}

                            {box.showHandle &&
                                (skin.cutout ? (
                                    <button
                                        type="button"
                                        aria-label="Next testimonial"
                                        onClick={() => step(1)}
                                        style={{
                                            width: "22%",
                                            maxWidth: 130,
                                            minWidth: 64,
                                            height: 18,
                                            flexShrink: 0,
                                            padding: 0,
                                            border: 0,
                                            cursor: "pointer",
                                            borderRadius: 999,
                                            background: "#2B1F14",
                                            boxShadow:
                                                "inset 0 4px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.35)",
                                        }}
                                    />
                                ) : (
                                    <motion.button
                                        type="button"
                                        aria-label="Next testimonial"
                                        onClick={() => step(1)}
                                        whileTap={calm ? undefined : { y: 2 }}
                                        style={{
                                            position: "relative",
                                            width: "24%",
                                            maxWidth: 140,
                                            minWidth: 72,
                                            height: 20,
                                            flexShrink: 0,
                                            padding: 0,
                                            border: 0,
                                            background: "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {[0, 1].map((k) => (
                                            <span
                                                key={k}
                                                style={{
                                                    position: "absolute",
                                                    top: -3,
                                                    left:
                                                        k === 0
                                                            ? -3
                                                            : undefined,
                                                    right:
                                                        k === 1
                                                            ? -3
                                                            : undefined,
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: "50%",
                                                    background:
                                                        rivetFill(metal),
                                                    boxShadow:
                                                        "0 2px 2px rgba(0,0,0,0.35)",
                                                }}
                                            />
                                        ))}
                                        <span
                                            style={{
                                                position: "absolute",
                                                inset: "0 4px",
                                                borderRadius:
                                                    "3px 3px 999px 999px / 3px 3px 18px 18px",
                                                background: `linear-gradient(180deg, ${metal[2]} 0%, ${metal[1]} 30%, ${metal[0]} 72%, ${metal[1]} 100%)`,
                                                boxShadow:
                                                    "0 6px 8px -3px rgba(0,0,0,0.45), inset 0 -2px 0 rgba(0,0,0,0.2)",
                                            }}
                                        />
                                    </motion.button>
                                ))}
                        </div>
                    </motion.div>
                )}

                {active && (
                    <span
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clip: "rect(0 0 0 0)",
                            whiteSpace: "nowrap",
                        }}
                        aria-live="polite"
                    >
                        {`${active.name || ""}: ${String(active.quote || "").replace(/\*\*/g, "")}`}
                    </span>
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Docket, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Full Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Job Title",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                    defaultValue: "Organisation",
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue:
                        "Describe what it was like to work together, what changed afterwards and **the part that mattered most**.",
                    description:
                        "Wrap words in **double asterisks** to highlight them.",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    min: 0,
                    max: 5,
                    step: 1,
                    displayStepper: true,
                    defaultValue: 5,
                },
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Photo URL",
                    placeholder: "https://…",
                },
                link: { type: ControlType.Link, title: "Link" },
                tab: {
                    type: ControlType.String,
                    title: "Tab Label",
                    placeholder: "Defaults to name",
                },
            },
        },
        defaultValue: SAMPLE_CARDS,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Card",
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "orchard",
            "atelier",
            "tidewater",
            "spice",
            "riviera",
            "sorbet",
            "graphite",
            "nocturne",
            "custom",
        ],
        optionTitles: [
            "Orchard",
            "Atelier",
            "Tidewater",
            "Spice",
            "Riviera",
            "Sorbet",
            "Graphite",
            "Nocturne",
            "Custom",
        ],
        defaultValue: "orchard",
    },
    customGround: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F6F3EC",
        hidden: (p: any) => p.theme !== "custom",
    },
    customInk: {
        type: ControlType.Color,
        title: "Ink",
        defaultValue: "#1E231D",
        hidden: (p: any) => p.theme !== "custom",
    },
    customInner: {
        type: ControlType.Color,
        title: "Drawer Inside",
        defaultValue: "#D8D0BE",
        hidden: (p: any) => p.theme !== "custom",
    },
    customFront: {
        type: ControlType.Color,
        title: "Drawer Front",
        defaultValue: "#E7E0D0",
        hidden: (p: any) => p.theme !== "custom",
    },
    customCards: {
        type: ControlType.Array,
        title: "Card Colors",
        control: { type: ControlType.Color },
        defaultValue: [
            "#C9D8B6",
            "#F2C9A9",
            "#D7CBEA",
            "#F1DE9C",
            "#B9DCD4",
            "#E8B9B5",
            "#E6C79C",
            "#C3CFE6",
            "#D9E3A8",
            "#EBC4D9",
        ],
        hidden: (p: any) => p.theme !== "custom",
    },
    face: {
        type: ControlType.Object,
        title: "Card Face",
        controls: {
            showNumber: {
                type: ControlType.Boolean,
                title: "Number",
                defaultValue: true,
            },
            showStars: {
                type: ControlType.Boolean,
                title: "Stars",
                defaultValue: true,
            },
            showAvatar: {
                type: ControlType.Boolean,
                title: "Avatar",
                defaultValue: true,
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: FACE_DEFAULTS.linkLabel,
            },
        },
    },
    drawer: {
        type: ControlType.Object,
        title: "Drawer",
        controls: {
            material: {
                type: ControlType.Enum,
                title: "Material",
                options: ["oak", "walnut", "kraft", "steel", "theme"],
                optionTitles: [
                    "Oak",
                    "Walnut",
                    "Kraft Board",
                    "Steel",
                    "Theme Color",
                ],
                defaultValue: DRAWER_DEFAULTS.material,
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: DRAWER_DEFAULTS.label,
            },
            sublabel: {
                type: ControlType.String,
                title: "Sub Label",
                defaultValue: DRAWER_DEFAULTS.sublabel,
            },
            showHandle: {
                type: ControlType.Boolean,
                title: "Handle",
                defaultValue: true,
            },
        },
    },
    plate: {
        type: ControlType.Object,
        title: "Label Plate",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["auto", "framed", "sticker", "plain"],
                optionTitles: [
                    "Match Drawer",
                    "Metal Frame",
                    "Paper Sticker",
                    "Plain Card",
                ],
                defaultValue: PLATE_DEFAULTS.style,
            },
            metal: {
                type: ControlType.Enum,
                title: "Metal",
                options: ["auto", "brass", "aged", "chrome", "custom"],
                optionTitles: [
                    "Match Drawer",
                    "Brass",
                    "Aged Brass",
                    "Chrome",
                    "Custom",
                ],
                defaultValue: PLATE_DEFAULTS.metal,
                description: "Also colours the drawer handle.",
            },
            frameColor: {
                type: ControlType.Color,
                title: "Metal Color",
                defaultValue: PLATE_DEFAULTS.frameColor,
                hidden: (o: any) => o.metal !== "custom",
            },
            rivets: {
                type: ControlType.Boolean,
                title: "Rivets",
                defaultValue: true,
                hidden: (o: any) =>
                    o.style === "sticker" || o.style === "plain",
            },
            paper: {
                type: ControlType.Color,
                title: "Card Color",
                defaultValue: PLATE_DEFAULTS.paper,
            },
            ink: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: PLATE_DEFAULTS.ink,
            },
            width: {
                type: ControlType.Number,
                title: "Min Width",
                min: 0,
                max: 400,
                step: 1,
                defaultValue: PLATE_DEFAULTS.width,
            },
            padX: {
                type: ControlType.Number,
                title: "Padding X",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: PLATE_DEFAULTS.padX,
            },
            padY: {
                type: ControlType.Number,
                title: "Padding Y",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: PLATE_DEFAULTS.padY,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: PLATE_DEFAULTS.radius,
            },
            gap: {
                type: ControlType.Number,
                title: "Line Gap",
                min: 0,
                max: 20,
                step: 1,
                defaultValue: PLATE_DEFAULTS.gap,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -12,
                max: 12,
                step: 0.5,
                unit: "°",
                defaultValue: PLATE_DEFAULTS.tilt,
                hidden: (o: any) => o.style !== "sticker" && o.style !== "auto",
            },
            subOpacity: {
                type: ControlType.Number,
                title: "Sub Opacity",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: PLATE_DEFAULTS.subOpacity,
            },
            uppercase: {
                type: ControlType.Boolean,
                title: "Sub Caps",
                defaultValue: true,
            },
        },
    },
    plateFont: {
        type: ControlType.Font,
        title: "Plate Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 12,
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1.2em",
        },
    },
    plateSubFont: {
        type: ControlType.Font,
        title: "Plate Sub Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 9,
            variant: "Medium",
            letterSpacing: "0.16em",
            lineHeight: "1.2em",
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: LAYOUT_DEFAULTS.padding,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 40,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: LAYOUT_DEFAULTS.cardWidth,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: LAYOUT_DEFAULTS.radius,
            },
            tabColumns: {
                type: ControlType.Number,
                title: "Tab Columns",
                min: 1,
                max: 5,
                step: 1,
                displayStepper: true,
                defaultValue: LAYOUT_DEFAULTS.tabColumns,
            },
            tabWidth: {
                type: ControlType.Number,
                title: "Tab Width",
                min: 12,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: LAYOUT_DEFAULTS.tabWidth,
            },
            pitch: {
                type: ControlType.Number,
                title: "Card Spacing",
                min: 4,
                max: 40,
                step: 1,
                defaultValue: LAYOUT_DEFAULTS.pitch,
            },
        },
    },
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1.5,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: BEHAVIOUR_DEFAULTS.interval,
                hidden: (o: any) => !o.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (o: any) => !o.autoplay,
            },
            dragToFile: {
                type: ControlType.Boolean,
                title: "Drag to File",
                defaultValue: true,
            },
            intro: {
                type: ControlType.Boolean,
                title: "Intro",
                defaultValue: true,
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", stiffness: 240, damping: 30, mass: 1 },
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            variant: "Regular",
            letterSpacing: "-0.005em",
            lineHeight: "1.38em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            lineHeight: "1.35em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 11,
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1.2em",
        },
    },
})
