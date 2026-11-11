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

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useVelocity,
    animate,
} from "framer-motion"

const HAND_FACE =
    "'Segoe Print', 'Bradley Hand', 'Chalkboard SE', 'Marker Felt', 'Comic Sans MS', cursive"
const SANS_FACE = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

const SAMPLE_NOTES = [
    {
        quote: "Clear plan, clear price and zero surprises at the end. The smoothest project we ran all year.",
        name: "Ana M.",
        role: "Café owner",
        color: "#FFE98A",
        shape: "square",
    },
    {
        quote: "Fast, calm and weirdly fun to work with. Every call ended with a next step. Already booked again.",
        name: "Ravi P.",
        role: "Marketing lead",
        color: "#FFB9D2",
        shape: "tall",
    },
    {
        quote: "Our launch video finally looks the way the product feels. The whole team keeps sharing it.",
        name: "Daniel K.",
        role: "Founder",
        color: "#BEE3FF",
        shape: "wide",
    },
    {
        quote: "Fast turnaround, zero hand-holding. The edits just land, and the captions sound exactly like me.",
        name: "Mara L.",
        role: "Fitness coach",
        color: "#BFF0D9",
        shape: "tall",
    },
    {
        quote: "Worth it twice over. Our product pages finally feel premium, and customers keep saying so.",
        name: "Omar F.",
        role: "Shop owner",
        color: "#FFC2B0",
        shape: "wide",
    },
    {
        quote: "Sent a messy folder of clips, got back an actual story. My audience noticed straight away.",
        name: "Priya R.",
        role: "Travel creator",
        color: "#D9CCFF",
        shape: "square",
    },
]

const FALLBACK = {
    board: {
        fill: "#EFEDE8",
        texture: false,
        grain: "rgba(0,0,0,0.06)",
        grainSize: 6,
        radius: 0,
        inset: 28,
        frameWidth: 0,
        frameColor: "#B98A5A",
    },
    heading: {
        show: true,
        title: "The wall of nice things",
        subtitle: "Drag any note around. It stays where you drop it.",
        paper: "#FBFAF5",
        titleColor: "#1F2A1E",
        subtitleColor: "#4E5C4D",
        lean: -2,
    },
    spread: {
        columns: 3,
        noteSize: 210,
        scatter: 45,
        lean: 7,
        headroom: 104,
        seed: 4,
    },
    paper: {
        face: "hand",
        ink: "#1D1B16",
        roleInk: "rgba(29,27,22,0.62)",
        padding: 18,
        avatar: 28,
        depth: 55,
        corner: 16,
        finish: "soft",
        tooth: 45,
        fibers: true,
        curl: true,
    },
    fasteners: {
        kind: "pin",
        size: 26,
        first: "#E2483D",
        second: "#3F7BE0",
        third: "#F2C230",
        tape: "rgba(255,255,255,0.55)",
    },
    play: {
        draggable: true,
        swing: true,
        lift: true,
        entrance: true,
        stagger: 0.07,
        breeze: false,
        breezeAngle: 1.5,
        tools: true,
        shuffleText: "Shuffle",
        tidyText: "Tidy",
        toolPaper: "#FBFAF5",
        toolInk: "#1F2A1E",
    },
}

function merge(base: any, over: any) {
    return { ...base, ...(over || {}) }
}

function clamp01(v: number) {
    return Math.max(0, Math.min(1, v))
}

function grain(seed: number, i: number, k: number) {
    let t = (seed * 374761393 + i * 668265263 + k * 1442695041) >>> 0
    t = Math.imul(t ^ (t >>> 13), 1274126177)
    t ^= t >>> 16
    t = Math.imul(t ^ (t >>> 7), 2246822519)
    return ((t ^ (t >>> 15)) >>> 0) / 4294967295
}

type Spot = { left: number; top: number; turn: number }

function scatterSpots(
    count: number,
    columns: number,
    scatter: number,
    lean: number,
    seed: number
): Spot[] {
    const cols = Math.max(1, Math.min(columns, count || 1))
    const rows = Math.max(1, Math.ceil(count / cols))
    const loose = Math.max(0, Math.min(100, scatter)) / 100
    const spots: Spot[] = []
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols)
        const inRow = Math.min(cols, count - row * cols)
        const slot = (i % cols) + (cols - inRow) / 2
        const jx = (grain(seed, i, 1) * 2 - 1) * 0.22 * loose
        const jy = (grain(seed, i, 2) * 2 - 1) * 0.3 * loose
        const turn = (grain(seed, i, 3) * 2 - 1) * lean
        spots.push({
            left: ((slot + 0.5 + jx) / cols) * 100,
            top: ((row + 0.5 + jy) / rows) * 100,
            turn,
        })
    }
    return spots
}

function noteFrame(shape: string, size: number) {
    if (shape === "tall") return { w: size * 0.82, h: size * 1.14 }
    if (shape === "wide") return { w: size * 1.22, h: size * 0.9 }
    return { w: size, h: size }
}

function feltFill(board: any) {
    return {
        backgroundColor: board.fill,
        backgroundImage: board.texture
            ? `radial-gradient(${board.grain} 1px, transparent 1.3px)`
            : "none",
        backgroundSize: `${board.grainSize}px ${board.grainSize}px`,
    }
}

/* ---- paper surface ---- */

const tileCache: Record<string, string> = {}

function noiseTile(
    key: string,
    size: number,
    freq: string,
    octaves: number,
    seed: number,
    rgb: string,
    slope: number,
    shift: number,
    kind = "fractalNoise"
) {
    const id = `${kind}|${key}|${size}|${freq}|${octaves}|${seed}|${rgb}|${slope.toFixed(3)}|${shift.toFixed(3)}`
    if (tileCache[id]) return tileCache[id]
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
        `<filter id='t' x='0' y='0' width='100%' height='100%'>` +
        `<feTurbulence type='${kind}' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
        `<feColorMatrix values='0 0 0 0 ${rgb} 0 0 0 0 ${rgb} 0 0 0 0 ${rgb} 0 0 0 ${slope.toFixed(3)} ${shift.toFixed(3)}'/>` +
        `</filter><rect width='100%' height='100%' filter='url(#t)'/></svg>`
    const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    tileCache[id] = url
    return url
}

function paperSurface(color: string, paper: any) {
    const tooth = clamp01((paper.tooth ?? 45) / 100)
    const layers: string[] = [
        "linear-gradient(172deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0) 52%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.07) 100%)",
        "radial-gradient(130% 90% at 100% 100%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 38%)",
        "radial-gradient(90% 60% at 0% 100%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 40%)",
    ]
    const sizes: string[] = ["100% 100%", "100% 100%", "100% 100%"]
    if (tooth > 0) {
        // fine dark tooth
        layers.push(
            noiseTile("tooth", 150, "0.9", 4, 3, "0", 1.1 * tooth, -0.5 * tooth)
        )
        sizes.push("150px 150px")
        // pale flecks
        layers.push(
            noiseTile(
                "fleck",
                170,
                "1.3",
                2,
                9,
                "1",
                1.3 * tooth,
                -0.68 * tooth
            )
        )
        sizes.push("170px 170px")
        // soft mottling
        layers.push(
            noiseTile(
                "cloud",
                360,
                "0.018",
                4,
                33,
                "0",
                0.42 * tooth,
                -0.15 * tooth
            )
        )
        sizes.push("360px 360px")
        if (paper.fibers) {
            // hairline pulp fibres
            layers.push(
                noiseTile(
                    "fibre",
                    300,
                    "0.03",
                    3,
                    21,
                    "0",
                    1.5 * tooth,
                    -0.95 * tooth,
                    "turbulence"
                )
            )
            sizes.push("300px 300px")
        }
    }
    return {
        backgroundColor: color,
        backgroundImage: layers.join(", "),
        backgroundSize: sizes.join(", "),
    }
}

function paperEdges(depth: number, curl: boolean, raised: boolean) {
    const s = Math.max(0, depth) / 55
    const k = raised ? 2 : 1
    const inner =
        "inset 0 0 0 0.5px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -14px 20px -16px rgba(0,0,0,0.16)"
    if (curl) {
        return `${inner}, 0 1px 1.5px rgba(0,0,0,${Math.min(0.3, 0.2 * s)}), 0 ${3 * k}px ${6 * k}px rgba(0,0,0,${Math.min(0.2, 0.09 * s)})`
    }
    return `${inner}, 0 ${14 * s * k}px ${22 * s * k}px rgba(0,0,0,${Math.min(0.5, 0.26 * s)}), 0 2px 3px rgba(0,0,0,${Math.min(0.3, 0.14 * s)})`
}

function softSurface(color: string) {
    return {
        backgroundColor: color,
        backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 34%, rgba(255,255,255,0) 62%), radial-gradient(120% 70% at 0% 0%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 55%), linear-gradient(0deg, rgba(0,0,0,0.035) 0%, rgba(0,0,0,0) 40%)",
        backgroundSize: "100% 100%",
    }
}

function softShadow(depth: number, raised: boolean) {
    const s = Math.max(0, depth) / 55
    const k = raised ? 1.7 : 1
    return `inset 0 1px 0 rgba(255,255,255,0.8), inset 0 0 0 1px rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.04), 0 1px 2px rgba(24,22,40,${Math.min(0.2, 0.06 * s)}), 0 ${8 * k}px ${18 * k}px -6px rgba(24,22,40,${Math.min(0.4, 0.16 * s)}), 0 ${26 * k}px ${44 * k}px -18px rgba(24,22,40,${Math.min(0.5, 0.24 * s)})`
}

function cardFill(color: string, paper: any) {
    return paper.finish === "paper"
        ? paperSurface(color, paper)
        : softSurface(color)
}

function cardShadow(paper: any, raised: boolean) {
    return paper.finish === "paper"
        ? paperEdges(paper.depth, paper.curl, raised)
        : softShadow(paper.depth, raised)
}

function curlOn(paper: any) {
    return paper.finish === "paper" && !!paper.curl
}

function liftedCorner(side: "left" | "right", depth: number, raised: boolean) {
    const s = Math.max(0, depth) / 55
    const k = raised ? 1.8 : 1
    const flip = side === "left" ? -1 : 1
    return {
        position: "absolute" as const,
        bottom: 9,
        [side]: 7,
        width: "46%",
        height: "26%",
        borderRadius: 4,
        boxShadow: `0 ${15 * s * k}px ${13 * s * k}px rgba(0,0,0,${Math.min(0.5, 0.34 * s)})`,
        transform: `rotate(${3.6 * flip}deg) skewX(${7 * flip}deg)`,
    }
}

function legibleFace(paper: any, font: any) {
    const f = font || {}
    return paper.face === "hand"
        ? { ...f, fontFamily: HAND_FACE }
        : { fontFamily: SANS_FACE, ...f }
}

/* ---- pins ---- */

function pinAnchor(kind: string, size: number) {
    if (kind === "ball") return size * 0.95
    if (kind === "tack") return size * 0.62
    return size * 0.78
}

function pinParts(kind: string, color: string, size: number): any[] {
    const S = size
    const disc = (cx: number, cy: number, d: number) => ({
        position: "absolute" as const,
        left: cx - d / 2,
        top: cy - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
    })
    const hole = {
        ...disc(0, 0, 5),
        background:
            "radial-gradient(circle, rgba(0,0,0,0.55) 0, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 72%)",
    }

    if (kind === "ball") {
        const cx = -S * 0.16
        const cy = -S * 0.58
        const len = Math.hypot(cx, cy)
        const ang = (Math.atan2(cy, cx) * 180) / Math.PI
        const sx = S * 0.44
        const sy = S * 0.32
        const slen = Math.hypot(sx, sy)
        const sang = (Math.atan2(sy, sx) * 180) / Math.PI
        return [
            hole,
            {
                position: "absolute",
                left: 0,
                top: -0.75,
                width: slen,
                height: 1.5,
                transformOrigin: "0 50%",
                transform: `rotate(${sang}deg)`,
                background:
                    "linear-gradient(90deg, rgba(0,0,0,0.32), rgba(0,0,0,0.08))",
                borderRadius: 1,
            },
            {
                ...disc(sx, sy, S * 0.95),
                borderRadius: "50%",
                transform: "scaleY(0.62) rotate(18deg)",
                background:
                    "radial-gradient(closest-side, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.16) 50%, rgba(0,0,0,0) 100%)",
            },
            {
                position: "absolute",
                left: 0,
                top: -1,
                width: len,
                height: 2,
                transformOrigin: "0 50%",
                transform: `rotate(${ang}deg)`,
                background:
                    "linear-gradient(180deg, #FDFDFD 0%, #B9BCC2 45%, #6E7178 100%)",
                borderRadius: 1,
            },
            {
                ...disc(cx, cy, S * 0.84),
                background: `radial-gradient(circle at 33% 28%, rgba(255,255,255,0.95) 0, rgba(255,255,255,0.4) 12%, rgba(255,255,255,0) 30%), radial-gradient(circle at 62% 70%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.5) 100%), ${color}`,
                boxShadow:
                    "inset 0 -1px 2px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.25)",
            },
            {
                ...disc(cx + S * 0.14, cy + S * 0.2, S * 0.16),
                background:
                    "radial-gradient(circle, rgba(255,255,255,0.45) 0, rgba(255,255,255,0) 70%)",
            },
        ]
    }

    if (kind === "tack") {
        const cx = -S * 0.05
        const cy = -S * 0.1
        return [
            hole,
            {
                ...disc(cx + S * 0.2, cy + S * 0.24, S * 1.05),
                transform: "scaleY(0.82)",
                background:
                    "radial-gradient(closest-side, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.14) 55%, rgba(0,0,0,0) 100%)",
            },
            {
                ...disc(cx, cy, S * 0.88),
                background:
                    "radial-gradient(circle at 36% 30%, rgba(255,255,255,0.85) 0, rgba(255,255,255,0) 32%), conic-gradient(from 210deg, #F7E7AE, #B5852D, #F9EDC1, #8F6519, #E8CE7E, #F7E7AE)",
                boxShadow:
                    "inset 0 0 0 1px rgba(110,78,20,0.45), inset 0 -1px 1px rgba(0,0,0,0.25), 0 1px 1px rgba(0,0,0,0.3)",
            },
            {
                ...disc(cx, cy, S * 0.22),
                background:
                    "radial-gradient(circle at 40% 35%, #FFF6D6 0, #C79A3D 60%, #8F6519 100%)",
                boxShadow: "0 0 0 1px rgba(110,78,20,0.35)",
            },
        ]
    }

    // classic push pin: flange, grip, cap
    const fx = -S * 0.1
    const fy = -S * 0.22
    const gx = -S * 0.16
    const gy = -S * 0.36
    const tx = -S * 0.2
    const ty = -S * 0.46
    const len = Math.hypot(fx, fy)
    const ang = (Math.atan2(fy, fx) * 180) / Math.PI
    return [
        hole,
        {
            ...disc(S * 0.38, S * 0.36, S * 1.3),
            transform: "scaleY(0.7) rotate(24deg)",
            background:
                "radial-gradient(closest-side, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,0) 100%)",
        },
        {
            position: "absolute",
            left: 0,
            top: -1,
            width: len,
            height: 2,
            transformOrigin: "0 50%",
            transform: `rotate(${ang}deg)`,
            background:
                "linear-gradient(180deg, #FFFFFF 0%, #B5B9C0 50%, #6A6E75 100%)",
            borderRadius: 1,
        },
        {
            ...disc(fx, fy, S),
            background: `radial-gradient(circle at 36% 30%, rgba(255,255,255,0.42) 0, rgba(255,255,255,0) 48%), radial-gradient(circle at 66% 74%, rgba(0,0,0,0.45) 0, rgba(0,0,0,0) 70%), ${color}`,
            boxShadow:
                "inset 0 -1px 1.5px rgba(0,0,0,0.3), 0 1px 1.5px rgba(0,0,0,0.35)",
        },
        {
            ...disc(gx, gy, S * 0.64),
            background: `linear-gradient(125deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 38%, rgba(0,0,0,0.38) 100%), ${color}`,
            boxShadow: "0 1.5px 1.5px rgba(0,0,0,0.32)",
        },
        {
            ...disc(tx, ty, S * 0.58),
            background: `radial-gradient(circle at 38% 34%, rgba(255,255,255,0.62) 0, rgba(255,255,255,0.14) 42%, rgba(0,0,0,0.12) 100%), ${color}`,
            boxShadow:
                "inset 0 -1px 1px rgba(0,0,0,0.28), inset 0 1px 1px rgba(255,255,255,0.55)",
        },
        {
            ...disc(tx - S * 0.08, ty - S * 0.09, S * 0.2),
            transform: "scaleX(1.4) rotate(-32deg)",
            background:
                "radial-gradient(closest-side, rgba(255,255,255,0.9) 0, rgba(255,255,255,0) 100%)",
        },
    ]
}

function initialsOf(name: string) {
    return (name || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
}

function pictureOf(note: any) {
    return (
        (note && note.image && note.image.src) || (note && note.imageURL) || ""
    )
}

const TAPE_EDGE =
    "polygon(3% 0, 97% 0, 100% 20%, 97% 40%, 100% 60%, 97% 80%, 100% 100%, 3% 100%, 0 80%, 3% 60%, 0 40%, 3% 20%)"

function hasPin(kind: string) {
    return kind === "pin" || kind === "ball" || kind === "tack"
}

function topRoomFor(fasteners: any, padding: number) {
    if (hasPin(fasteners.kind))
        return pinAnchor(fasteners.kind, fasteners.size) + fasteners.size * 0.55
    if (fasteners.kind === "tape") return padding + 10
    return padding
}

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
export default function Pinfold(props: any) {
    const still = useIsStaticRenderer()
    if (still) return <BoardStill {...props} />
    return <BoardLive {...props} />
}

/* ------------------------------------------------------------------ */
/* Static branch — plain divs only                                     */
/* ------------------------------------------------------------------ */

function BoardStill(props: any) {
    const board = merge(FALLBACK.board, props.board)
    const heading = merge(FALLBACK.heading, props.heading)
    const spread = merge(FALLBACK.spread, props.spread)
    const paper = merge(FALLBACK.paper, props.paper)
    const fasteners = merge(FALLBACK.fasteners, props.fasteners)
    const play = merge(FALLBACK.play, props.play)
    const notes: any[] = Array.isArray(props.notes) ? props.notes : []
    const spots = scatterSpots(
        notes.length,
        spread.columns,
        spread.scatter,
        spread.lean,
        spread.seed
    )
    const pins = [fasteners.first, fasteners.second, fasteners.third]
    const quoteStyle = legibleFace(paper, props.quoteFont)
    const nameStyle = { fontFamily: SANS_FACE, ...(props.nameFont || {}) }
    const topRoom = heading.show ? spread.headroom : 0
    const padTop = Math.max(paper.padding, topRoomFor(fasteners, paper.padding))

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: board.radius,
                boxSizing: "border-box",
                border:
                    board.frameWidth > 0
                        ? `${board.frameWidth}px solid ${board.frameColor}`
                        : "none",
                ...feltFill(board),
            }}
        >
            {heading.show && (
                <div
                    style={{
                        position: "absolute",
                        left: board.inset,
                        top: board.inset,
                        maxWidth: "72%",
                        transform: `rotate(${heading.lean}deg)`,
                        zIndex: 999,
                    }}
                >
                    {curlOn(paper) && (
                        <div
                            style={liftedCorner(
                                "left",
                                paper.depth * 0.7,
                                false
                            )}
                        />
                    )}
                    {curlOn(paper) && (
                        <div
                            style={liftedCorner(
                                "right",
                                paper.depth * 0.7,
                                false
                            )}
                        />
                    )}
                    <div
                        style={{
                            position: "relative",
                            padding: `${hasPin(fasteners.kind) ? 24 : 18}px 24px 16px`,
                            ...cardFill(heading.paper, paper),
                            borderRadius: paper.corner,
                            boxShadow: cardShadow(paper, false),
                        }}
                    >
                        <div
                            style={{
                                fontFamily: SANS_FACE,
                                fontSize: 28,
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.05,
                                ...(props.titleFont || {}),
                                color: heading.titleColor,
                            }}
                        >
                            {heading.title}
                        </div>
                        {heading.subtitle ? (
                            <div
                                style={{
                                    marginTop: 6,
                                    fontFamily: SANS_FACE,
                                    fontSize: 13,
                                    lineHeight: 1.35,
                                    ...(props.subtitleFont || {}),
                                    color: heading.subtitleColor,
                                }}
                            >
                                {heading.subtitle}
                            </div>
                        ) : null}
                    </div>
                    {hasPin(fasteners.kind) && (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 12,
                                width: 0,
                                height: 0,
                            }}
                        >
                            {pinParts(
                                fasteners.kind,
                                pins[0],
                                fasteners.size * 0.9
                            ).map((part, k) => (
                                <div key={k} style={part} />
                            ))}
                        </div>
                    )}
                    {fasteners.kind === "tape" && (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: -12,
                                width: 70,
                                marginLeft: -35,
                                height: 22,
                                background: fasteners.tape,
                                clipPath: TAPE_EDGE,
                                transform: "rotate(-3deg)",
                            }}
                        />
                    )}
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    left: board.inset,
                    right: board.inset,
                    top: board.inset + topRoom,
                    bottom: board.inset,
                }}
            >
                {notes.map((note, i) => {
                    const spot = spots[i]
                    const box = noteFrame(note.shape, spread.noteSize)
                    const pic = pictureOf(note)
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: `clamp(${box.w / 2 + 6}px, ${spot.left}%, calc(100% - ${box.w / 2 + 6}px))`,
                                top: `clamp(${box.h / 2 + 6}px, ${spot.top}%, calc(100% - ${box.h / 2 + 6}px))`,
                                width: 0,
                                height: 0,
                                zIndex: i + 1,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: -box.w / 2,
                                    top: -box.h / 2,
                                    width: box.w,
                                    height: box.h,
                                    transform: `rotate(${spot.turn}deg)`,
                                }}
                            >
                                {curlOn(paper) && (
                                    <div
                                        style={liftedCorner(
                                            "left",
                                            paper.depth,
                                            false
                                        )}
                                    />
                                )}
                                {curlOn(paper) && (
                                    <div
                                        style={liftedCorner(
                                            "right",
                                            paper.depth,
                                            false
                                        )}
                                    />
                                )}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        boxSizing: "border-box",
                                        padding: `${padTop}px ${paper.padding}px ${paper.padding}px`,
                                        borderRadius: paper.corner,
                                        ...cardFill(
                                            note.color || "#FFE98A",
                                            paper
                                        ),
                                        boxShadow: cardShadow(paper, false),
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        overflow: "hidden",
                                        color: paper.ink,
                                    }}
                                >
                                    <div
                                        style={{
                                            margin: 0,
                                            fontSize: 17,
                                            lineHeight: 1.2,
                                            ...quoteStyle,
                                            color: paper.ink,
                                            overflow: "hidden",
                                            flex: "1 1 auto",
                                            minHeight: 0,
                                        }}
                                    >
                                        {note.quote ? `“${note.quote}”` : ""}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            flex: "0 0 auto",
                                        }}
                                    >
                                        {pic ? (
                                            <img
                                                src={pic}
                                                alt={
                                                    note.image?.alt ||
                                                    note.name ||
                                                    ""
                                                }
                                                style={{
                                                    width: paper.avatar,
                                                    height: paper.avatar,
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    flex: "0 0 auto",
                                                    boxShadow:
                                                        "0 0 0 2px rgba(255,255,255,0.7)",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: paper.avatar,
                                                    height: paper.avatar,
                                                    borderRadius: "50%",
                                                    flex: "0 0 auto",
                                                    background:
                                                        "rgba(0,0,0,0.12)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontFamily: SANS_FACE,
                                                    fontSize: Math.max(
                                                        9,
                                                        paper.avatar * 0.38
                                                    ),
                                                    fontWeight: 700,
                                                    color: paper.ink,
                                                }}
                                            >
                                                {initialsOf(note.name)}
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    lineHeight: 1.2,
                                                    ...nameStyle,
                                                    color: paper.ink,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {note.name}
                                            </span>
                                            {note.role ? (
                                                <span
                                                    style={{
                                                        fontFamily:
                                                            nameStyle.fontFamily,
                                                        fontSize: 11,
                                                        lineHeight: 1.25,
                                                        color: paper.roleInk,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {note.role}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                {hasPin(fasteners.kind) && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: pinAnchor(
                                                fasteners.kind,
                                                fasteners.size
                                            ),
                                            width: 0,
                                            height: 0,
                                        }}
                                    >
                                        {pinParts(
                                            fasteners.kind,
                                            pins[i % 3],
                                            fasteners.size
                                        ).map((part, k) => (
                                            <div key={k} style={part} />
                                        ))}
                                    </div>
                                )}
                                {fasteners.kind === "tape" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: -11,
                                            width: box.w * 0.42,
                                            marginLeft: -(box.w * 0.42) / 2,
                                            height: 24,
                                            background: fasteners.tape,
                                            clipPath: TAPE_EDGE,
                                            transform: `rotate(${i % 2 ? 4 : -4}deg)`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {play.tools && (
                <div
                    style={{
                        position: "absolute",
                        right: board.inset - 8,
                        bottom: board.inset - 8,
                        display: "flex",
                        gap: 4,
                        padding: 4,
                        borderRadius: 999,
                        background: play.toolPaper,
                        boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                        zIndex: 1000,
                    }}
                >
                    {[play.shuffleText, play.tidyText].map(
                        (label: string, k: number) => (
                            <div
                                key={k}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    borderRadius: 999,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontFamily: SANS_FACE,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: play.toolInk,
                                }}
                            >
                                {k === 0 ? <ShuffleGlyph /> : <TidyGlyph />}
                                {label}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

function ShuffleGlyph() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="m15 15 6 6" />
            <path d="M4 4l5 5" />
        </svg>
    )
}

function TidyGlyph() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    )
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [onScreen, setOnScreen] = React.useState(false)
    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        let inView = false
        let tabShown =
            typeof document === "undefined"
                ? true
                : document.visibilityState !== "hidden"
        const settle = () => setOnScreen(inView && tabShown)
        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            inView = true
            settle()
        } else {
            watcher = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) inView = entry.isIntersecting
                    settle()
                },
                { threshold: 0.12 }
            )
            watcher.observe(el)
        }
        const onTab = () => {
            tabShown = document.visibilityState !== "hidden"
            settle()
        }
        if (typeof document !== "undefined")
            document.addEventListener("visibilitychange", onTab)
        return () => {
            if (watcher) watcher.disconnect()
            if (typeof document !== "undefined")
                document.removeEventListener("visibilitychange", onTab)
        }
    }, [])
    return onScreen
}

function useCalmPreference() {
    const [calm, setCalm] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setCalm(query.matches)
        read()
        if (query.addEventListener) query.addEventListener("change", read)
        else if ((query as any).addListener) (query as any).addListener(read)
        return () => {
            if (query.removeEventListener)
                query.removeEventListener("change", read)
            else if ((query as any).removeListener)
                (query as any).removeListener(read)
        }
    }, [])
    return calm
}

function BoardLive(props: any) {
    const board = merge(FALLBACK.board, props.board)
    const heading = merge(FALLBACK.heading, props.heading)
    const spread = merge(FALLBACK.spread, props.spread)
    const paper = merge(FALLBACK.paper, props.paper)
    const fasteners = merge(FALLBACK.fasteners, props.fasteners)
    const play = merge(FALLBACK.play, props.play)
    const notes: any[] = Array.isArray(props.notes) ? props.notes : []

    const shellRef = React.useRef<HTMLDivElement>(null)
    const onScreen = useOnScreen(shellRef)
    const calm = useCalmPreference()

    const rawId = React.useId()
    const scope = "pf" + rawId.replace(/[^a-zA-Z0-9]/g, "")

    const [shake, setShake] = React.useState(0)
    const [neat, setNeat] = React.useState(false)
    const [homing, setHoming] = React.useState(0)
    const [stack, setStack] = React.useState<Record<number, number>>({})
    const peak = React.useRef(notes.length + 1)

    const [landed, setLanded] = React.useState(() => !play.entrance)
    React.useEffect(() => {
        if (landed) return
        if (calm || onScreen) setLanded(true)
    }, [onScreen, calm, landed])

    const spots = React.useMemo(
        () =>
            scatterSpots(
                notes.length,
                spread.columns,
                neat ? 0 : spread.scatter,
                neat ? 0 : spread.lean,
                spread.seed + shake * 97
            ),
        [
            notes.length,
            spread.columns,
            spread.scatter,
            spread.lean,
            spread.seed,
            shake,
            neat,
        ]
    )

    const raise = React.useCallback((i: number) => {
        peak.current += 1
        const level = peak.current
        setStack((prev) => (prev[i] === level ? prev : { ...prev, [i]: level }))
    }, [])

    const doShuffle = () => {
        setNeat(false)
        setShake((n) => n + 1)
        setHoming((n) => n + 1)
    }
    const doTidy = () => {
        setNeat(true)
        setHoming((n) => n + 1)
    }

    const pins = [fasteners.first, fasteners.second, fasteners.third]
    const quoteStyle = legibleFace(paper, props.quoteFont)
    const nameStyle = { fontFamily: SANS_FACE, ...(props.nameFont || {}) }
    const topRoom = heading.show ? spread.headroom : 0
    const padTop = Math.max(paper.padding, topRoomFor(fasteners, paper.padding))
    const swayAllowed = play.breeze && onScreen && !calm

    return (
        <div
            ref={shellRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: board.radius,
                boxSizing: "border-box",
                border:
                    board.frameWidth > 0
                        ? `${board.frameWidth}px solid ${board.frameColor}`
                        : "none",
                ...feltFill(board),
            }}
        >
            <style>{`${play.breeze ? `@keyframes ${scope}-sway { 0%, 100% { transform: rotate(${-play.breezeAngle}deg); } 50% { transform: rotate(${play.breezeAngle}deg); } }` : ""}
.${scope}-tool { transition: background-color 0.2s ease; }
.${scope}-tool:hover { background-color: rgba(0,0,0,0.06); }`}</style>

            {heading.show && (
                <motion.div
                    initial={
                        play.entrance && !calm ? { opacity: 0, y: -14 } : false
                    }
                    animate={
                        landed ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }
                    }
                    transition={{ type: "spring", stiffness: 180, damping: 22 }}
                    style={{
                        position: "absolute",
                        left: board.inset,
                        top: board.inset,
                        maxWidth: "72%",
                        rotate: heading.lean,
                        zIndex: 999999,
                    }}
                >
                    {curlOn(paper) && (
                        <span
                            style={liftedCorner(
                                "left",
                                paper.depth * 0.7,
                                false
                            )}
                        />
                    )}
                    {curlOn(paper) && (
                        <span
                            style={liftedCorner(
                                "right",
                                paper.depth * 0.7,
                                false
                            )}
                        />
                    )}
                    <div
                        style={{
                            position: "relative",
                            padding: `${hasPin(fasteners.kind) ? 24 : 18}px 24px 16px`,
                            ...cardFill(heading.paper, paper),
                            borderRadius: paper.corner,
                            boxShadow: cardShadow(paper, false),
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontFamily: SANS_FACE,
                                fontSize: 28,
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.05,
                                ...(props.titleFont || {}),
                                color: heading.titleColor,
                            }}
                        >
                            {heading.title}
                        </h2>
                        {heading.subtitle ? (
                            <p
                                style={{
                                    margin: "6px 0 0",
                                    fontFamily: SANS_FACE,
                                    fontSize: 13,
                                    lineHeight: 1.35,
                                    ...(props.subtitleFont || {}),
                                    color: heading.subtitleColor,
                                }}
                            >
                                {heading.subtitle}
                            </p>
                        ) : null}
                    </div>
                    {hasPin(fasteners.kind) && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 12,
                                width: 0,
                                height: 0,
                            }}
                        >
                            {pinParts(
                                fasteners.kind,
                                pins[0],
                                fasteners.size * 0.9
                            ).map((part, k) => (
                                <span key={k} style={part} />
                            ))}
                        </span>
                    )}
                    {fasteners.kind === "tape" && (
                        <span
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: -12,
                                width: 70,
                                marginLeft: -35,
                                height: 22,
                                background: fasteners.tape,
                                clipPath: TAPE_EDGE,
                                transform: "rotate(-3deg)",
                            }}
                        />
                    )}
                </motion.div>
            )}

            <div
                style={{
                    position: "absolute",
                    left: board.inset,
                    right: board.inset,
                    top: board.inset + topRoom,
                    bottom: board.inset,
                }}
            >
                {notes.map((note, i) => (
                    <LiveNote
                        key={i}
                        index={i}
                        note={note}
                        spot={spots[i]}
                        box={noteFrame(note.shape, spread.noteSize)}
                        layer={stack[i] || i + 1}
                        raise={raise}
                        shellRef={shellRef}
                        paper={paper}
                        padTop={padTop}
                        fasteners={fasteners}
                        pinColor={pins[i % 3]}
                        play={play}
                        calm={calm}
                        landed={landed}
                        homing={homing}
                        sway={swayAllowed}
                        scope={scope}
                        quoteStyle={quoteStyle}
                        nameStyle={nameStyle}
                    />
                ))}
            </div>

            {play.tools && (
                <div
                    style={{
                        position: "absolute",
                        right: board.inset - 8,
                        bottom: board.inset - 8,
                        display: "flex",
                        gap: 4,
                        padding: 4,
                        borderRadius: 999,
                        background: play.toolPaper,
                        boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                        zIndex: 1000000,
                    }}
                >
                    <button
                        type="button"
                        className={`${scope}-tool`}
                        onClick={doShuffle}
                        style={{
                            height: 34,
                            padding: "0 14px",
                            border: "none",
                            borderRadius: 999,
                            background: "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: SANS_FACE,
                            fontSize: 13,
                            fontWeight: 600,
                            color: play.toolInk,
                            cursor: "pointer",
                        }}
                    >
                        <ShuffleGlyph />
                        {play.shuffleText}
                    </button>
                    <button
                        type="button"
                        className={`${scope}-tool`}
                        onClick={doTidy}
                        aria-pressed={neat}
                        style={{
                            height: 34,
                            padding: "0 14px",
                            border: "none",
                            borderRadius: 999,
                            background: neat
                                ? "rgba(0,0,0,0.08)"
                                : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: SANS_FACE,
                            fontSize: 13,
                            fontWeight: 600,
                            color: play.toolInk,
                            cursor: "pointer",
                        }}
                    >
                        <TidyGlyph />
                        {play.tidyText}
                    </button>
                </div>
            )}
        </div>
    )
}

function LiveNote(p: any) {
    const {
        index,
        note,
        spot,
        box,
        layer,
        raise,
        shellRef,
        paper,
        padTop,
        fasteners,
        pinColor,
        play,
        calm,
        landed,
        homing,
        sway,
        scope,
        quoteStyle,
        nameStyle,
    } = p

    const dx = useMotionValue(0)
    const dy = useMotionValue(0)
    const base = useMotionValue(spot.turn)
    const speed = useVelocity(dx)
    const swingOn = React.useRef(true)
    swingOn.current = !!play.swing && !calm
    const kick = useTransform(speed, (v: number) =>
        swingOn.current ? Math.max(-14, Math.min(14, -v * 0.012)) : 0
    )
    const swing = useSpring(kick, { stiffness: 260, damping: 16, mass: 0.8 })
    const turn = useTransform([base, swing] as any, ([b, s]: any) => b + s)

    const [held, setHeld] = React.useState(false)
    const moved = React.useRef(false)

    React.useEffect(() => {
        const ctl = animate(
            base,
            spot.turn,
            calm
                ? { duration: 0 }
                : { type: "spring", stiffness: 140, damping: 18 }
        )
        return () => ctl.stop()
    }, [spot.turn, calm])

    const firstHome = React.useRef(true)
    React.useEffect(() => {
        if (firstHome.current) {
            firstHome.current = false
            return
        }
        const cfg = calm
            ? { duration: 0 }
            : { type: "spring" as const, stiffness: 160, damping: 20 }
        const a = animate(dx, 0, cfg)
        const b = animate(dy, 0, cfg)
        return () => {
            a.stop()
            b.stop()
        }
    }, [homing])

    const pic = pictureOf(note)
    const dropIn = play.entrance && !calm
    const restingState = {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 230,
            damping: 19,
            delay: dropIn ? index * play.stagger : 0,
        },
    }
    const waitingState = { opacity: 0, scale: 1.16 }
    const link = note.link
    const swayLength = 4.2 + grain(7, index, 5) * 2.4
    const swayDelay = -grain(11, index, 6) * 4
    const surface = React.useMemo(
        () => cardFill(note.color || "#FFE98A", paper),
        [note.color, paper.tooth, paper.fibers, paper.finish]
    )
    const pinBits = React.useMemo(
        () =>
            hasPin(fasteners.kind)
                ? pinParts(fasteners.kind, pinColor, fasteners.size)
                : [],
        [fasteners.kind, pinColor, fasteners.size]
    )

    return (
        <div
            style={{
                position: "absolute",
                left: `clamp(${box.w / 2 + 6}px, ${spot.left}%, calc(100% - ${box.w / 2 + 6}px))`,
                top: `clamp(${box.h / 2 + 6}px, ${spot.top}%, calc(100% - ${box.h / 2 + 6}px))`,
                width: 0,
                height: 0,
                zIndex: layer,
                transition: calm
                    ? "none"
                    : "left 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
        >
            <motion.div
                drag={play.draggable}
                dragConstraints={shellRef}
                dragElastic={0.08}
                dragTransition={{ power: 0.25, timeConstant: 220 }}
                onPointerDown={() => {
                    moved.current = false
                    raise(index)
                }}
                onDragStart={() => {
                    moved.current = true
                    setHeld(true)
                }}
                onDragEnd={() => setHeld(false)}
                initial={dropIn ? waitingState : false}
                animate={landed ? restingState : waitingState}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                whileHover={play.lift && !calm ? { scale: 1.035 } : undefined}
                whileDrag={{ scale: 1.06 }}
                style={{
                    position: "absolute",
                    left: -box.w / 2,
                    top: -box.h / 2,
                    width: box.w,
                    height: box.h,
                    x: dx,
                    y: dy,
                    rotate: turn,
                    cursor: play.draggable
                        ? held
                            ? "grabbing"
                            : "grab"
                        : "default",
                    touchAction: play.draggable ? "none" : "auto",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: `50% ${hasPin(fasteners.kind) ? pinAnchor(fasteners.kind, fasteners.size) : 0}px`,
                        animation:
                            sway && !held
                                ? `${scope}-sway ${swayLength}s ease-in-out ${swayDelay}s infinite`
                                : "none",
                    }}
                >
                    {curlOn(paper) && (
                        <span
                            style={{
                                ...liftedCorner("left", paper.depth, held),
                                transition: "box-shadow 0.25s ease",
                            }}
                        />
                    )}
                    {curlOn(paper) && (
                        <span
                            style={{
                                ...liftedCorner("right", paper.depth, held),
                                transition: "box-shadow 0.25s ease",
                            }}
                        />
                    )}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            boxSizing: "border-box",
                            padding: `${padTop}px ${paper.padding}px ${paper.padding}px`,
                            borderRadius: paper.corner,
                            ...surface,
                            boxShadow: cardShadow(paper, held),
                            transition: "box-shadow 0.25s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: 10,
                            overflow: "hidden",
                            color: paper.ink,
                        }}
                    >
                        <blockquote
                            style={{
                                margin: 0,
                                fontSize: 17,
                                lineHeight: 1.2,
                                ...quoteStyle,
                                color: paper.ink,
                                overflow: "hidden",
                                flex: "1 1 auto",
                                minHeight: 0,
                            }}
                        >
                            {note.quote ? `“${note.quote}”` : ""}
                        </blockquote>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flex: "0 0 auto",
                            }}
                        >
                            {pic ? (
                                <img
                                    src={pic}
                                    alt={note.image?.alt || note.name || ""}
                                    draggable={false}
                                    style={{
                                        width: paper.avatar,
                                        height: paper.avatar,
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        display: "block",
                                        flex: "0 0 auto",
                                        pointerEvents: "none",
                                        boxShadow:
                                            "0 0 0 2px rgba(255,255,255,0.7)",
                                    }}
                                />
                            ) : (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: paper.avatar,
                                        height: paper.avatar,
                                        borderRadius: "50%",
                                        flex: "0 0 auto",
                                        background: "rgba(0,0,0,0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: SANS_FACE,
                                        fontSize: Math.max(
                                            9,
                                            paper.avatar * 0.38
                                        ),
                                        fontWeight: 700,
                                        color: paper.ink,
                                    }}
                                >
                                    {initialsOf(note.name)}
                                </span>
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    minWidth: 0,
                                }}
                            >
                                {link ? (
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={(e) => {
                                            if (moved.current)
                                                e.preventDefault()
                                        }}
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            lineHeight: 1.2,
                                            ...nameStyle,
                                            color: paper.ink,
                                            textDecoration: "underline",
                                            textUnderlineOffset: 2,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {note.name}
                                    </a>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 700,
                                            lineHeight: 1.2,
                                            ...nameStyle,
                                            color: paper.ink,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {note.name}
                                    </span>
                                )}
                                {note.role ? (
                                    <span
                                        style={{
                                            fontFamily: nameStyle.fontFamily,
                                            fontSize: 11,
                                            lineHeight: 1.25,
                                            color: paper.roleInk,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {note.role}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    {pinBits.length > 0 && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: pinAnchor(fasteners.kind, fasteners.size),
                                width: 0,
                                height: 0,
                                pointerEvents: "none",
                            }}
                        >
                            {pinBits.map((part: any, k: number) => (
                                <span key={k} style={part} />
                            ))}
                        </span>
                    )}
                    {fasteners.kind === "tape" && (
                        <span
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: -11,
                                width: box.w * 0.42,
                                marginLeft: -(box.w * 0.42) / 2,
                                height: 24,
                                background: fasteners.tape,
                                clipPath: TAPE_EDGE,
                                transform: `rotate(${index % 2 ? 4 : -4}deg)`,
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Pinfold, {
    notes: {
        type: ControlType.Array,
        title: "Notes",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "Kind words go here.",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Role",
                },
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                imageURL: {
                    type: ControlType.String,
                    title: "Photo URL",
                    placeholder: "https://…",
                },
                link: { type: ControlType.Link, title: "Link" },
                color: {
                    type: ControlType.Color,
                    title: "Paper",
                    defaultValue: "#FFE98A",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["square", "tall", "wide"],
                    optionTitles: ["Square", "Tall", "Wide"],
                    displaySegmentedControl: true,
                    defaultValue: "square",
                },
            },
        },
        defaultValue: SAMPLE_NOTES,
    },
    heading: {
        type: ControlType.Object,
        title: "Heading",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: FALLBACK.heading.show,
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: FALLBACK.heading.title,
            },
            subtitle: {
                type: ControlType.String,
                title: "Subtitle",
                displayTextArea: true,
                defaultValue: FALLBACK.heading.subtitle,
            },
            paper: {
                type: ControlType.Color,
                title: "Paper",
                defaultValue: FALLBACK.heading.paper,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Ink",
                defaultValue: FALLBACK.heading.titleColor,
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle Ink",
                defaultValue: FALLBACK.heading.subtitleColor,
            },
            lean: {
                type: ControlType.Number,
                title: "Lean",
                min: -10,
                max: 10,
                step: 0.5,
                unit: "°",
                defaultValue: FALLBACK.heading.lean,
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.05em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, lineHeight: "1.35em" },
    },
    board: {
        type: ControlType.Object,
        title: "Board",
        controls: {
            fill: {
                type: ControlType.Color,
                title: "Felt",
                defaultValue: FALLBACK.board.fill,
            },
            texture: {
                type: ControlType.Boolean,
                title: "Texture",
                defaultValue: FALLBACK.board.texture,
            },
            grain: {
                type: ControlType.Color,
                title: "Texture Ink",
                defaultValue: FALLBACK.board.grain,
                hidden: (b: any) => !b.texture,
            },
            grainSize: {
                type: ControlType.Number,
                title: "Texture Size",
                min: 3,
                max: 20,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.board.grainSize,
                hidden: (b: any) => !b.texture,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.board.radius,
            },
            inset: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.board.inset,
            },
            frameWidth: {
                type: ControlType.Number,
                title: "Frame",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.board.frameWidth,
            },
            frameColor: {
                type: ControlType.Color,
                title: "Frame Color",
                defaultValue: FALLBACK.board.frameColor,
                hidden: (b: any) => !(b.frameWidth > 0),
            },
        },
    },
    spread: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            columns: {
                type: ControlType.Number,
                title: "Columns",
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
                defaultValue: FALLBACK.spread.columns,
            },
            noteSize: {
                type: ControlType.Number,
                title: "Note Size",
                min: 100,
                max: 360,
                step: 2,
                unit: "px",
                defaultValue: FALLBACK.spread.noteSize,
            },
            scatter: {
                type: ControlType.Number,
                title: "Scatter",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: FALLBACK.spread.scatter,
            },
            lean: {
                type: ControlType.Number,
                title: "Max Tilt",
                min: 0,
                max: 20,
                step: 0.5,
                unit: "°",
                defaultValue: FALLBACK.spread.lean,
            },
            headroom: {
                type: ControlType.Number,
                title: "Top Space",
                min: 0,
                max: 300,
                step: 2,
                unit: "px",
                defaultValue: FALLBACK.spread.headroom,
            },
            seed: {
                type: ControlType.Number,
                title: "Arrangement",
                min: 1,
                max: 99,
                step: 1,
                displayStepper: true,
                defaultValue: FALLBACK.spread.seed,
            },
        },
    },
    paper: {
        type: ControlType.Object,
        title: "Paper",
        controls: {
            face: {
                type: ControlType.Enum,
                title: "Lettering",
                options: ["hand", "font"],
                optionTitles: ["Handwritten", "Quote Font"],
                displaySegmentedControl: true,
                defaultValue: FALLBACK.paper.face,
            },
            finish: {
                type: ControlType.Enum,
                title: "Finish",
                options: ["soft", "paper"],
                optionTitles: ["Soft Card", "Paper"],
                displaySegmentedControl: true,
                defaultValue: FALLBACK.paper.finish,
            },
            tooth: {
                type: ControlType.Number,
                title: "Paper Grain",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: FALLBACK.paper.tooth,
                hidden: (pp: any) => pp.finish !== "paper",
            },
            fibers: {
                type: ControlType.Boolean,
                title: "Pulp Fibres",
                defaultValue: FALLBACK.paper.fibers,
                hidden: (pp: any) => pp.finish !== "paper" || !(pp.tooth > 0),
            },
            curl: {
                type: ControlType.Boolean,
                title: "Lifted Corners",
                defaultValue: FALLBACK.paper.curl,
                hidden: (pp: any) => pp.finish !== "paper",
            },
            ink: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: FALLBACK.paper.ink,
            },
            roleInk: {
                type: ControlType.Color,
                title: "Role Ink",
                defaultValue: FALLBACK.paper.roleInk,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 8,
                max: 48,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.paper.padding,
            },
            avatar: {
                type: ControlType.Number,
                title: "Photo Size",
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.paper.avatar,
            },
            depth: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: FALLBACK.paper.depth,
            },
            corner: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.paper.corner,
            },
        },
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 17, lineHeight: "1.2em" },
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, variant: "Bold", lineHeight: "1.2em" },
    },
    fasteners: {
        type: ControlType.Object,
        title: "Fasteners",
        controls: {
            kind: {
                type: ControlType.Enum,
                title: "Type",
                options: ["pin", "ball", "tack", "tape", "none"],
                optionTitles: [
                    "Push Pin",
                    "Map Pin",
                    "Brass Tack",
                    "Tape",
                    "None",
                ],
                defaultValue: FALLBACK.fasteners.kind,
            },
            size: {
                type: ControlType.Number,
                title: "Pin Size",
                min: 12,
                max: 44,
                step: 1,
                unit: "px",
                defaultValue: FALLBACK.fasteners.size,
                hidden: (f: any) => !hasPin(f.kind),
            },
            first: {
                type: ControlType.Color,
                title: "Pin 1",
                defaultValue: FALLBACK.fasteners.first,
                hidden: (f: any) => f.kind !== "pin" && f.kind !== "ball",
            },
            second: {
                type: ControlType.Color,
                title: "Pin 2",
                defaultValue: FALLBACK.fasteners.second,
                hidden: (f: any) => f.kind !== "pin" && f.kind !== "ball",
            },
            third: {
                type: ControlType.Color,
                title: "Pin 3",
                defaultValue: FALLBACK.fasteners.third,
                hidden: (f: any) => f.kind !== "pin" && f.kind !== "ball",
            },
            tape: {
                type: ControlType.Color,
                title: "Tape",
                defaultValue: FALLBACK.fasteners.tape,
                hidden: (f: any) => f.kind !== "tape",
            },
        },
    },
    play: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            draggable: {
                type: ControlType.Boolean,
                title: "Drag Notes",
                defaultValue: FALLBACK.play.draggable,
            },
            swing: {
                type: ControlType.Boolean,
                title: "Swing on Drag",
                defaultValue: FALLBACK.play.swing,
            },
            lift: {
                type: ControlType.Boolean,
                title: "Hover Lift",
                defaultValue: FALLBACK.play.lift,
            },
            entrance: {
                type: ControlType.Boolean,
                title: "Pin-on Entrance",
                defaultValue: FALLBACK.play.entrance,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 0.4,
                step: 0.01,
                unit: "s",
                defaultValue: FALLBACK.play.stagger,
                hidden: (pp: any) => !pp.entrance,
            },
            breeze: {
                type: ControlType.Boolean,
                title: "Breeze Sway",
                defaultValue: FALLBACK.play.breeze,
            },
            breezeAngle: {
                type: ControlType.Number,
                title: "Sway Angle",
                min: 0.5,
                max: 6,
                step: 0.25,
                unit: "°",
                defaultValue: FALLBACK.play.breezeAngle,
                hidden: (pp: any) => !pp.breeze,
            },
            tools: {
                type: ControlType.Boolean,
                title: "Shuffle Buttons",
                defaultValue: FALLBACK.play.tools,
            },
            shuffleText: {
                type: ControlType.String,
                title: "Shuffle Label",
                defaultValue: FALLBACK.play.shuffleText,
                hidden: (pp: any) => !pp.tools,
            },
            tidyText: {
                type: ControlType.String,
                title: "Tidy Label",
                defaultValue: FALLBACK.play.tidyText,
                hidden: (pp: any) => !pp.tools,
            },
            toolPaper: {
                type: ControlType.Color,
                title: "Button Fill",
                defaultValue: FALLBACK.play.toolPaper,
                hidden: (pp: any) => !pp.tools,
            },
            toolInk: {
                type: ControlType.Color,
                title: "Button Ink",
                defaultValue: FALLBACK.play.toolInk,
                hidden: (pp: any) => !pp.tools,
            },
        },
    },
})
