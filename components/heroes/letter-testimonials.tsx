import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, animate, useMotionValue, useTransform, useReducedMotion, type MotionValue } from "framer-motion"

// ---------------------------------------------------------------------------
// Types

interface Testimonial {
    review: string
    name: string
    role: string
    company: string
    photo?: { src: string; srcSet?: string; alt?: string }
}

interface LetterContent {
    message?: string
    name?: string
    role?: string
    photo?: { src: string; srcSet?: string; alt?: string }
}

interface LoveLettersProps {
    layout: "grid" | "stack"
    gapX: number
    gapY: number
    sealText: string
    letter1?: LetterContent
    letter2?: LetterContent
    letter3?: LetterContent
    letter4?: LetterContent
    letter5?: LetterContent
    letter6?: LetterContent
    envelopeColor?: string
    insideColor?: string
    paperColor?: string
    textColor?: string
    mutedColor?: string
    sealColor?: string
    speed?: number
    style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Sample content

const photo = (id: string, alt: string) => ({
    src: `https://images.unsplash.com/${id}?fm=jpg&q=80&fit=crop&crop=faces&w=200&h=200`,
    alt,
})

const SAMPLE: Testimonial[] = [
    {
        review: "We launched on a Tuesday and had our first wedding booked by Friday. Three months in, half of our new clients say they found us through the site. I still can’t quite believe it.",
        name: "Maren Holloway",
        role: "Owner",
        company: "Fernbrook Florals",
        photo: photo("photo-1710777932534-2a58edf3603d", "Portrait of Maren Holloway"),
    },
    {
        review: "Our team used to lose two days a month to client reports. Now it takes an afternoon, and the reports finally look like something people want to read. It’s the rare tool that made us faster and more careful at the same time.",
        name: "Theo Albrecht",
        role: "Head of Operations",
        company: "Quillmark Studio",
        photo: photo("photo-1618077360395-f3068be8e001", "Portrait of Theo Albrecht"),
    },
    {
        review: "Simple, beautiful, and it just works. Worth every penny.",
        name: "Priya Raman",
        role: "Founder",
        company: "Little Lantern Tea Co.",
        photo: photo("photo-1710778044102-56a3a6b69a1b", "Portrait of Priya Raman"),
    },
    {
        review: "I’ll be honest: I expected a lost weekend of setup and a pile of support tickets. Instead, everything was running before my coffee went cold. Six months later, bookings are up by a third, our regulars keep telling us how easy it is to reserve a table, and I finally spend my evenings in the kitchen instead of on the phone.",
        name: "Daniel Okafor",
        role: "Chef & Co-owner",
        company: "Wren & Willow Kitchen",
        photo: photo("photo-1600896903045-3d373014baa3", "Portrait of Daniel Okafor"),
    },
    {
        review: "My clients keep asking who designed our site. I tell them it’s a trade secret, smile, and change the subject.",
        name: "Sofia Lindqvist",
        role: "Creative Director",
        company: "Northlight Atelier",
        photo: photo("photo-1680650901059-6b7bf67fe36a", "Portrait of Sofia Lindqvist"),
    },
    {
        review: "We sent the new site to our board on a Friday afternoon. By Monday morning, three of them had replied with the same word: finally.",
        name: "Jonah Whitfield",
        role: "Marketing Lead",
        company: "Bramble & Oak",
        photo: photo("photo-1654110455429-cf322b40a906", "Portrait of Jonah Whitfield"),
    },
]

// ---------------------------------------------------------------------------
// Paper texture (inline SVG noise, no network)

const NOISE_SVG =
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>" +
    "<filter id='a' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .18  0 0 0 .5 -.2'/></filter>" +
    "<filter id='b' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='.03' numOctaves='3' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 .3  0 0 0 0 .22  0 0 0 0 .14  0 0 0 .1 -.035'/></filter>" +
    "<rect width='240' height='240' filter='url(#a)'/><rect width='240' height='240' filter='url(#b)'/></svg>"
const PAPER = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`

const FONT_LINK =
    "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Pinyon+Script&family=Inter:wght@500&display=swap"
const SERIF = `"EB Garamond", Garamond, Georgia, serif`
const SCRIPT = `"Pinyon Script", "Snell Roundhand", cursive`
const SANS = `Inter, system-ui, sans-serif`

const mix = (c: string, pct: number, other: string) => `color-mix(in srgb, ${c} ${pct}%, ${other})`

// Small deterministic "random" so the pile looks the same on every render
function jitter(i: number, salt: number) {
    const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
    return (x - Math.floor(x)) * 2 - 1
}

// ---------------------------------------------------------------------------
// Geometry (all relative to envelope width W)

function geometry(W: number) {
    const H = W * 0.7
    return {
        W,
        H,
        flapDepth: H * 0.56,
        notch: H * 0.5,
        letterW: W * 0.9,
        letterH: H * 0.92,
        letterX: W * 0.05,
        letterTop: H * 0.04,
        peakY: -H * 0.99, // letter fully clear of the pocket
        presentY: -H * 0.34, // letter held in front of the open envelope
        seal: W * 0.17,
    }
}
type Geo = ReturnType<typeof geometry>

// ---------------------------------------------------------------------------
// Wax seal

function blobPath() {
    const pts: [number, number][] = []
    const n = 72
    for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2
        const r = 46 + 2.2 * Math.sin(5 * t + 1) + 1.5 * Math.sin(9 * t + 2) + 0.9 * Math.sin(14 * t)
        pts.push([50 + r * Math.cos(t), 50 + r * Math.sin(t)])
    }
    let d = ""
    for (let i = 0; i < n; i++) {
        const [x0, y0] = pts[i]
        const [x1, y1] = pts[(i + 1) % n]
        const mx = (x0 + x1) / 2
        const my = (y0 + y1) / 2
        d += i === 0 ? `M${mx.toFixed(2)} ${my.toFixed(2)}` : ""
        d += ` Q${x1.toFixed(2)} ${y1.toFixed(2)} ${((x1 + pts[(i + 2) % n][0]) / 2).toFixed(2)} ${((y1 + pts[(i + 2) % n][1]) / 2).toFixed(2)}`
    }
    return d + "Z"
}
const BLOB = blobPath()
const CRACK = "52,0 46,20 55,38 47,57 54,77 49,100"

function SealArt({ id, color, text, font }: { id: string; color: string; text: string; font: string }) {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
            <defs>
                <radialGradient id={`${id}o`} cx="36%" cy="30%" r="75%">
                    <stop offset="0" style={{ stopColor: mix(color, 70, "white") }} />
                    <stop offset="0.45" style={{ stopColor: color }} />
                    <stop offset="1" style={{ stopColor: mix(color, 62, "black") }} />
                </radialGradient>
                <radialGradient id={`${id}i`} cx="62%" cy="68%" r="70%">
                    <stop offset="0" style={{ stopColor: mix(color, 88, "white") }} />
                    <stop offset="0.6" style={{ stopColor: color }} />
                    <stop offset="1" style={{ stopColor: mix(color, 70, "black") }} />
                </radialGradient>
            </defs>
            <path d={BLOB} fill={`url(#${id}o)`} />
            <circle cx="50" cy="50" r="32" fill={`url(#${id}i)`} />
            <circle cx="50" cy="50" r="32" fill="none" strokeWidth="1.4" style={{ stroke: mix(color, 60, "black") }} />
            <circle cx="50.6" cy="50.9" r="33.4" fill="none" strokeWidth="0.9" style={{ stroke: mix(color, 72, "white") }} opacity="0.55" />
            <text
                x="50.8"
                y="51.2"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={text.length > 1 ? 26 : 36}
                style={{ fontFamily: font, fontStyle: "italic", fill: mix(color, 70, "white") }}
                opacity="0.5"
            >
                {text}
            </text>
            <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={text.length > 1 ? 26 : 36}
                style={{ fontFamily: font, fontStyle: "italic", fill: mix(color, 58, "black") }}
            >
                {text}
            </text>
        </svg>
    )
}

function Seal({
    id,
    size,
    color,
    text,
    crack,
    stamp,
}: {
    id: string
    size: number
    color: string
    text: string
    crack?: MotionValue<number>
    stamp?: MotionValue<number>
}) {
    const fallback = useMotionValue(0)
    const fallbackStamp = useMotionValue(1)
    const c = crack ?? fallback
    const s = stamp ?? fallbackStamp
    const press = useTransform(c, [0, 0.2, 0.32], [1, 1.08, 1.02])
    const lineOpacity = useTransform(c, [0.1, 0.22, 0.28, 0.36], [0, 1, 1, 0])
    const out = { ease: (t: number) => 1 - Math.pow(1 - t, 2.4) }
    const fall = { ease: (t: number) => t * t }
    const lx = useTransform(c, [0.28, 1], [0, -size * 0.24], out)
    const rx = useTransform(c, [0.28, 1], [0, size * 0.2], out)
    const ly = useTransform(c, [0.28, 1], [0, size * 0.42], fall)
    const ry = useTransform(c, [0.28, 1], [0, size * 0.36], fall)
    const lr = useTransform(c, [0.28, 1], [0, -26], out)
    const rr = useTransform(c, [0.28, 1], [0, 20], out)
    const halfScale = useTransform(c, [0.28, 1], [1, 0.9])
    const halfOpacity = useTransform(c, [0.6, 1], [1, 0])
    const stampScale = useTransform(s, [0, 1], [1.25, 1])
    const half = (side: "l" | "r"): CSSProperties => ({
        position: "absolute",
        inset: 0,
        clipPath:
            side === "l"
                ? `polygon(0 0, 52% 0, 46% 20%, 55% 38%, 47% 57%, 54% 77%, 49% 100%, 0 100%)`
                : `polygon(52% 0, 100% 0, 100% 100%, 49% 100%, 54% 77%, 47% 57%, 55% 38%, 46% 20%)`,
    })
    return (
        <motion.div
            aria-hidden
            style={{
                position: "absolute",
                width: size,
                height: size,
                left: -size / 2,
                top: -size / 2,
                scale: stampScale,
                opacity: s,
                filter: "drop-shadow(0 1.5px 1.5px rgba(40,10,10,.35)) drop-shadow(0 4px 6px rgba(40,10,10,.18))",
            }}
        >
            <motion.div style={{ position: "absolute", inset: 0, scale: press }}>
                <motion.div style={{ ...half("l"), x: lx, y: ly, rotate: lr, scale: halfScale, opacity: halfOpacity }}>
                    <SealArt id={`${id}l`} color={color} text={text} font={SERIF} />
                </motion.div>
                <motion.div style={{ ...half("r"), x: rx, y: ry, rotate: rr, scale: halfScale, opacity: halfOpacity }}>
                    <SealArt id={`${id}r`} color={color} text={text} font={SERIF} />
                </motion.div>
                <motion.svg
                    viewBox="0 0 100 100"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: lineOpacity }}
                >
                    <motion.polyline
                        points={CRACK}
                        fill="none"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                        style={{ stroke: mix(color, 45, "black") }}
                    />
                </motion.svg>
            </motion.div>
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// Envelope

interface EnvelopeMotion {
    flap: MotionValue<number>
    crack: MotionValue<number>
    stamp: MotionValue<number>
}

function flapClip(g: Geo) {
    const { W, flapDepth: d } = g
    const r = W * 0.05
    const k = r / Math.hypot(W / 2, d) // fraction of the edge used by the rounded tip
    const ax = W / 2 + (W / 2) * k
    const ay = d - d * k
    const bx = W / 2 - (W / 2) * k
    return `path("M0 0 L${W} 0 L${ax} ${ay} Q${W / 2} ${d + r * 0.15} ${bx} ${ay} Z")`
}

function Envelope({
    g,
    id,
    colors,
    sealText,
    m,
    letter,
}: {
    g: Geo
    id: string
    colors: { envelope: string; inside: string; seal: string }
    sealText: string
    m?: EnvelopeMotion
    letter?: React.ReactNode
}) {
    const { W, H, flapDepth, notch } = g
    const zero = useMotionValue(0)
    const flap = m?.flap ?? zero
    const flapZ = useTransform(flap, (v) => (v > 90 ? 2 : 6))
    const flapBg = useTransform(flap, (v) => (v > 90 ? colors.inside : colors.envelope))
    const flapShade = useTransform(flap, [0, 90, 180], [0, 0.22, 0.05])
    const flapShadow = useTransform(flap, [0, 45], [1, 0])
    const paper = (color: string): CSSProperties => ({ backgroundColor: color, backgroundImage: PAPER, backgroundSize: "240px 240px" })
    const clip = flapClip(g)
    const fold = "rgba(70,50,30,.16)"
    const hi = "rgba(255,255,255,.55)"

    return (
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
            {/* Body shadow */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: W * 0.012,
                    boxShadow: "0 1px 1px rgba(60,40,20,.10), 0 6px 14px -6px rgba(60,40,20,.28), 0 22px 40px -18px rgba(60,40,20,.30)",
                    zIndex: 0,
                }}
            />
            {/* Back wall (inside of the envelope) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: W * 0.012,
                    overflow: "hidden",
                    zIndex: 1,
                    ...paper(colors.inside),
                }}
            >
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(40,25,10,.16), rgba(40,25,10,0) 30%)" }} />
            </div>

            {/* Flap */}
            <motion.div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: W,
                    height: flapDepth + W * 0.02,
                    zIndex: flapZ,
                    originY: 0,
                    rotateX: flap,
                    transformPerspective: W * 2,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        clipPath: clip,
                        backgroundColor: flapBg,
                        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,.10), rgba(0,0,0,.035)), ${PAPER}`,
                        backgroundSize: "100% 100%, 240px 240px",
                    }}
                >
                    <motion.div style={{ position: "absolute", inset: 0, background: "#1e1408", opacity: flapShade }} />
                </motion.div>
            </motion.div>

            {letter}

            {/* Soft shadow the pocket edge casts on the letter behind it (clipped so the blur never leaks past the envelope) */}
            <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
                <defs>
                    <filter id={`${id}ps`} x="-10%" y="-10%" width="120%" height="140%">
                        <feGaussianBlur stdDeviation={W * 0.012} />
                    </filter>
                </defs>
                <polyline
                    points={`0,${-H * 0.02} ${W / 2},${notch - H * 0.03} ${W},${-H * 0.02}`}
                    fill="none"
                    stroke="rgba(40,25,10,.22)"
                    strokeWidth={W * 0.02}
                    filter={`url(#${id}ps)`}
                />
            </svg>

            {/* Pocket (side + bottom flaps) */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 4,
                    clipPath: `path("M0 0 L${W / 2} ${notch} L${W} 0 L${W} ${H} L0 ${H} Z")`,
                    borderRadius: W * 0.012,
                    ...paper(colors.envelope),
                }}
            >
                <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
                    <defs>
                        <linearGradient id={`${id}sl`} x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0" stopColor="#000" stopOpacity="0" />
                            <stop offset="1" stopColor="#000" stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id={`${id}sr`} x1="1" x2="0" y1="0" y2="0">
                            <stop offset="0" stopColor="#000" stopOpacity="0" />
                            <stop offset="1" stopColor="#000" stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id={`${id}b`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
                            <stop offset="1" stopColor="#fff" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={`M0 0 L${W / 2} ${notch} L0 ${H} Z`} fill={`url(#${id}sl)`} />
                    <path d={`M${W} 0 L${W / 2} ${notch} L${W} ${H} Z`} fill={`url(#${id}sr)`} />
                    <path
                        d={`M0 ${H} C${W * 0.2} ${H * 0.86} ${W * 0.38} ${H * 0.66} ${W / 2} ${H * 0.6} C${W * 0.62} ${H * 0.66} ${W * 0.8} ${H * 0.86} ${W} ${H} Z`}
                        fill={`url(#${id}b)`}
                    />
                    <path
                        d={`M0 ${H} C${W * 0.2} ${H * 0.86} ${W * 0.38} ${H * 0.66} ${W / 2} ${H * 0.6} C${W * 0.62} ${H * 0.66} ${W * 0.8} ${H * 0.86} ${W} ${H}`}
                        fill="none"
                        stroke={fold}
                        strokeWidth="1"
                    />
                    <path
                        d={`M0 ${H + 1} C${W * 0.2} ${H * 0.86 + 1} ${W * 0.38} ${H * 0.66 + 1} ${W / 2} ${H * 0.6 + 1} C${W * 0.62} ${H * 0.66 + 1} ${W * 0.8} ${H * 0.86 + 1} ${W} ${H + 1}`}
                        fill="none"
                        stroke={hi}
                        strokeWidth="1"
                    />
                    <polyline points={`0,0.8 ${W / 2},${notch + 0.8} ${W},0.8`} fill="none" stroke={hi} strokeWidth="1.2" />
                </svg>
            </div>

            {/* Shadow the closed flap casts on the pocket */}
            <motion.svg
                width={W}
                height={flapDepth + W * 0.06}
                style={{ position: "absolute", left: 0, top: 0, zIndex: 5, pointerEvents: "none", overflow: "hidden", opacity: flapShadow }}
            >
                <defs>
                    <filter id={`${id}fs`} x="-10%" y="-10%" width="120%" height="130%">
                        <feGaussianBlur stdDeviation={W * 0.008} />
                    </filter>
                </defs>
                <path
                    d={`M${W * 0.02} 0 L${W / 2} ${flapDepth + W * 0.008} L${W * 0.98} 0`}
                    fill="none"
                    stroke="rgba(50,30,10,.30)"
                    strokeWidth={W * 0.008}
                    filter={`url(#${id}fs)`}
                />
            </motion.svg>

            {/* Wax seal */}
            <div style={{ position: "absolute", left: W / 2, top: flapDepth - g.seal * 0.18, zIndex: 7 }}>
                <Seal id={`${id}s`} size={g.seal} color={colors.seal} text={sealText} crack={m?.crack} stamp={m?.stamp} />
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Letter

function useFitText(deps: unknown[], base: number) {
    const ref = useRef<HTMLParagraphElement>(null)
    const [fit, setFit] = useState({ size: base, clamp: 0 })
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        let size = base
        el.style.webkitLineClamp = ""
        el.style.display = "block"
        el.style.fontSize = size + "px"
        let steps = 0
        while (el.scrollHeight > el.clientHeight + 1 && steps < 4 && size * 0.93 >= 12) {
            size *= 0.93
            el.style.fontSize = size + "px"
            steps++
        }
        let clamp = 0
        if (el.scrollHeight > el.clientHeight + 1) {
            const lh = parseFloat(getComputedStyle(el).lineHeight) || size * 1.45
            clamp = Math.max(1, Math.floor(el.clientHeight / lh))
        }
        setFit({ size, clamp })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [base, ...deps])
    return { ref, fit }
}

function Letter({
    g,
    t,
    colors,
}: {
    g: Geo
    t: Testimonial
    colors: { paper: string; text: string; muted: string }
}) {
    const { letterW: w, letterH: h } = g
    const pad = w * 0.075
    const base = Math.max(14, w * 0.043)
    const { ref, fit } = useFitText([t.review, w, h], base)
    const avatar = Math.round(w * 0.11)
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                padding: `${pad}px ${pad}px ${pad * 0.8}px`,
                boxSizing: "border-box",
                gap: h * 0.06,
            }}
        >
            <p
                ref={ref}
                style={{
                    margin: 0,
                    flex: "1 1 0",
                    minHeight: 0,
                    overflow: "hidden",
                    fontFamily: SERIF,
                    fontSize: fit.size,
                    lineHeight: 1.45,
                    color: colors.text,
                    display: fit.clamp ? "-webkit-box" : "block",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: fit.clamp || undefined,
                    ...({ textWrap: "pretty" } as CSSProperties),
                }}
            >
                {t.review}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: w * 0.035, flexShrink: 0 }}>
                {t.photo?.src ? (
                    <img
                        src={t.photo.src}
                        srcSet={t.photo.srcSet}
                        alt={t.photo.alt || ""}
                        draggable={false}
                        style={{
                            width: avatar,
                            height: avatar,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                            boxShadow: `0 0 0 2px ${colors.paper}, 0 1px 4px rgba(40,25,10,.25)`,
                        }}
                    />
                ) : null}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div
                        style={{
                            fontFamily: SCRIPT,
                            fontSize: Math.max(22, w * 0.075),
                            lineHeight: 1.1,
                            color: colors.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {t.name}
                    </div>
                    <div
                        style={{
                            fontFamily: SANS,
                            fontWeight: 500,
                            fontSize: Math.max(11, w * 0.029),
                            letterSpacing: "0.06em",
                            lineHeight: 1.35,
                            textTransform: "uppercase",
                            color: colors.muted,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                        }}
                    >
                        {[t.role, t.company].filter(Boolean).join(" · ")}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// One envelope: owns its open/close sequence

function EnvelopeItem({
    g,
    id,
    t,
    colors,
    sealText,
    tilt,
    open,
    speed,
    isStatic,
    reduceMotion,
}: {
    g: Geo
    id: string
    t: Testimonial
    colors: { envelope: string; inside: string; seal: string; paper: string; text: string; muted: string }
    sealText: string
    tilt: number
    open: boolean
    speed: number
    isStatic: boolean
    reduceMotion: boolean
}) {
    const open0 = isStatic && open
    const lift = useMotionValue(open0 ? 1 : 0)
    const crack = useMotionValue(open0 ? 1 : 0)
    const stamp = useMotionValue(1)
    const flap = useMotionValue(open0 ? 180 : 0)
    const letterY = useMotionValue(open0 ? g.presentY : 0)
    const letterS = useMotionValue(open0 ? 1.05 : 1)
    const letterR = useMotionValue(open0 ? -0.8 : 0)
    const front = useMotionValue(open0 ? 1 : 0)
    const letterO = useMotionValue(1)

    const letterZ = useTransform(front, (v) => (v > 0.5 ? 8 : 3))
    const letterShadow = useTransform(
        letterS,
        [1, 1.05],
        [
            "0 1px 2px rgba(40,25,10,.10), 0 4px 10px -4px rgba(40,25,10,.18)",
            "0 2px 3px rgba(40,25,10,.10), 0 18px 36px -12px rgba(40,25,10,.38)",
        ]
    )
    const envScale = useTransform(lift, [0, 1], [1, 1.025])
    const envRotate = useTransform(lift, [0, 1], [tilt, 0])
    const envY = useTransform(lift, [0, 1], [0, -g.H * 0.012])

    const running = useRef<{ stop: () => void }[]>([])
    const mounted = useRef(false)

    function play(mv: MotionValue<number>, to: number | number[], opts: Record<string, unknown>) {
        const c = animate(mv, to as any, opts as any)
        running.current.push(c)
        return c
    }

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true
            return
        }
        if (isStatic) return
        running.current.forEach((c) => c.stop())
        running.current = []
        const k = 1 / Math.max(0.25, speed)
        const easeOut = [0.3, 0, 0.15, 1]
        const inOut = [0.45, 0, 0.25, 1]
        if (reduceMotion) {
            // No 3D: jump the envelope open or shut and fade the letter
            if (open) {
                ;[crack.set(1), flap.set(180), lift.set(0), letterY.set(g.presentY), letterS.set(1), letterR.set(0), front.set(1)]
                letterO.set(0)
                play(letterO, 1, { duration: 0.35, ease: "easeOut" })
            } else {
                play(letterO, 0, { duration: 0.25, ease: "easeOut" }).then(() => {
                    ;[crack.set(0), flap.set(0), letterY.set(0), front.set(0), stamp.set(1)]
                    letterO.set(1)
                })
            }
            return
        }
        if (open) {
            stamp.set(1)
            play(lift, 1, { duration: 0.55 * k, ease: easeOut })
            play(crack, 1, { duration: 0.6 * k, delay: 0.05 * k, ease: "linear" })
            play(flap, 180, { duration: 0.75 * k, delay: 0.5 * k, ease: [0.55, 0, 0.25, 1] })
            play(letterY, [0, g.peakY, g.peakY, g.presentY], {
                duration: 1.55 * k,
                delay: 1.05 * k,
                times: [0, 0.45, 0.52, 1],
                ease: [[0.45, 0, 0.2, 1], "linear", easeOut],
            })
            play(front, [0, 0, 1, 1], { duration: 1.55 * k, delay: 1.05 * k, times: [0, 0.48, 0.49, 1], ease: "linear" })
            play(letterS, [1, 1, 1.05], { duration: 1.55 * k, delay: 1.05 * k, times: [0, 0.52, 1], ease: ["linear", easeOut] })
            play(letterR, [0, 0, -0.8], { duration: 1.55 * k, delay: 1.05 * k, times: [0, 0.52, 1], ease: ["linear", easeOut] })
        } else {
            play(letterS, 1, { duration: 0.5 * k, ease: inOut })
            play(letterR, 0, { duration: 0.5 * k, ease: inOut })
            play(letterY, [letterY.get(), g.peakY, g.peakY, 0], {
                duration: 1.3 * k,
                times: [0, 0.42, 0.5, 1],
                ease: [inOut, "linear", [0.4, 0, 0.2, 1]],
            })
            play(front, [front.get(), front.get(), 0, 0], { duration: 1.3 * k, times: [0, 0.45, 0.46, 1], ease: "linear" })
            play(flap, 0, { duration: 0.65 * k, delay: 1.05 * k, ease: [0.5, 0, 0.3, 1] })
            play(stamp, [0, 0, 1], { duration: 2.05 * k, times: [0, 0.82, 1], ease: ["linear", easeOut] })
            play(crack, [1, 0, 0], { duration: 0.1 * k, times: [0, 0.01, 1], ease: "linear" })
            play(lift, 0, { duration: 0.6 * k, delay: 1.6 * k, ease: inOut })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    useEffect(() => () => running.current.forEach((c) => c.stop()), [])

    return (
        <motion.div style={{ position: "absolute", left: 0, top: 0, width: g.W, height: g.H, scale: envScale, rotate: envRotate, y: envY }}>
            <Envelope
                g={g}
                id={id}
                colors={colors}
                sealText={sealText}
                m={{ flap, crack, stamp }}
                letter={
                    <motion.div
                        style={{
                            position: "absolute",
                            left: g.letterX,
                            top: g.letterTop,
                            width: g.letterW,
                            height: g.letterH,
                            y: letterY,
                            scale: letterS,
                            rotate: letterR,
                            zIndex: letterZ,
                            opacity: letterO,
                            boxShadow: letterShadow,
                            borderRadius: g.W * 0.006,
                            backgroundColor: colors.paper,
                            backgroundImage: PAPER,
                            backgroundSize: "240px 240px",
                        }}
                    >
                        <Letter g={g} t={t} colors={colors} />
                    </motion.div>
                }
            />
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// Main component

const LETTER_COUNT = 6

function toTestimonial(c: LetterContent | undefined, i: number): Testimonial {
    const s = SAMPLE[i % SAMPLE.length]
    return {
        review: c?.message ?? s.review,
        name: c?.name ?? s.name,
        role: c?.role ?? [s.role, s.company].filter(Boolean).join(" · "),
        company: "",
        photo: c?.photo?.src ? c.photo : s.photo,
    }
}

/**
 * Love Letters
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function LoveLetters(props: LoveLettersProps) {
    const {
        layout = "grid",
        gapX = 40,
        gapY = 80,
        sealText = "L",
        envelopeColor = "#F1EADF",
        insideColor = "#D7C2A4",
        paperColor = "#FBF4E6",
        textColor = "#2B231C",
        mutedColor = "#6F6253",
        sealColor = "#8A2B2B",
        speed = 1,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const reduceMotion = !!useReducedMotion()
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 1200, h: 600 })

    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        // Layout size, not getBoundingClientRect: the Framer canvas is zoomed with transforms
        const measure = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w > 0) setBox((b) => (Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { w, h }))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const letters = Array.from({ length: LETTER_COUNT }, (_, i) =>
        toTestimonial((props as any)[`letter${i + 1}`] as LetterContent | undefined, i)
    )

    // Cards fill the width; with a fixed height they also shrink to fit it
    const fixedHeight = style?.height === "100%"
    const cols = layout === "stack" ? 1 : 3
    const rows = Math.ceil(LETTER_COUNT / cols)
    const gx = cols > 1 ? gapX : 0
    let W = (box.w - gx * (cols - 1)) / cols
    if (fixedHeight && box.h > 0) W = Math.min(W, (box.h - gapY * (rows - 1)) / rows / 0.7)
    W = Math.max(120, W)
    const g = geometry(W)
    const gridW = cols * W + (cols - 1) * gx
    const gridH = rows * g.H + (rows - 1) * gapY
    const left0 = (box.w - gridW) / 2
    const top0 = fixedHeight ? Math.max(0, (box.h - gridH) / 2) : 0

    const [openIdx, setOpenIdx] = useState(-1)
    const [prevIdx, setPrevIdx] = useState(-1)
    const toggle = (i: number) => {
        if (isStatic) return
        setPrevIdx(openIdx)
        setOpenIdx(openIdx === i ? -1 : i)
    }

    const colors = {
        envelope: envelopeColor,
        inside: insideColor,
        seal: sealColor,
        paper: paperColor,
        text: textColor,
        muted: mutedColor,
    }
    const cls = `ll${uid}`

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: fixedHeight ? "100%" : gridH,
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <link rel="stylesheet" href={FONT_LINK} />
            <style>{`.${cls}:focus-visible{outline:2px solid ${sealColor};outline-offset:6px;border-radius:4px}`}</style>
            {letters.map((t, i) => {
                const col = i % cols
                const row = Math.floor(i / cols)
                const isOpen = openIdx === i
                return (
                    <div
                        key={i}
                        className={cls}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? "Close" : "Open"} letter ${i + 1} from ${t.name}`}
                        onClick={() => toggle(i)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                toggle(i)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: left0 + col * (W + gx),
                            top: top0 + row * (g.H + gapY),
                            width: W,
                            height: g.H,
                            cursor: "pointer",
                            zIndex: isOpen ? 3 : prevIdx === i ? 2 : 1,
                            touchAction: "manipulation",
                        }}
                    >
                        <EnvelopeItem
                            g={g}
                            id={`${uid}e${i}`}
                            t={t}
                            colors={colors}
                            sealText={sealText}
                            tilt={0}
                            open={isOpen}
                            speed={speed}
                            isStatic={isStatic}
                            reduceMotion={reduceMotion}
                        />
                    </div>
                )
            })}
        </div>
    )
}

LoveLetters.displayName = "Love Letters"

const letterControl = (i: number) => {
    const s = SAMPLE[i]
    return {
        type: ControlType.Object,
        title: `Letter ${i + 1}`,
        controls: {
            message: { type: ControlType.String, title: "Message", displayTextArea: true, defaultValue: s.review },
            name: { type: ControlType.String, title: "Name", defaultValue: s.name },
            role: { type: ControlType.String, title: "Role", defaultValue: [s.role, s.company].filter(Boolean).join(" · ") },
            photo: { type: ControlType.ResponsiveImage, title: "Photo" },
        },
    } as const
}

addPropertyControls(LoveLetters, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["grid", "stack"],
        optionTitles: ["Grid", "Stack"],
        defaultValue: "grid",
        displaySegmentedControl: true,
    },
    gapX: {
        type: ControlType.Number,
        title: "X Spacing",
        defaultValue: 40,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.layout === "stack",
    },
    gapY: { type: ControlType.Number, title: "Y Spacing", defaultValue: 80, min: 0, max: 400, step: 1, unit: "px" },
    sealText: { type: ControlType.String, title: "Seal", defaultValue: "L" },
    letter1: letterControl(0),
    letter2: letterControl(1),
    letter3: letterControl(2),
    letter4: letterControl(3),
    letter5: letterControl(4),
    letter6: letterControl(5),
} as any)
