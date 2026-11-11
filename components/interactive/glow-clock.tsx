import { useEffect, useId, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------- Geometry ----------
const W = 60 // digit width
const H = 110 // digit height
const T = 12 // segment thickness
const G = 2 // gap between segments
const GAP = 10 // gap between digits
const COLON_W = 28
const PAD = 14 // room for glow + shadow
const PERIOD_W = 34

type Pt = [number, number]
type Seg = "a" | "b" | "c" | "d" | "e" | "f" | "g"

const h = T / 2

const hSeg = (cy: number, x1: number, x2: number): Pt[] => [
    [x1 + G, cy],
    [x1 + G + h, cy - h],
    [x2 - G - h, cy - h],
    [x2 - G, cy],
    [x2 - G - h, cy + h],
    [x1 + G + h, cy + h],
]

const vSeg = (cx: number, y1: number, y2: number): Pt[] => [
    [cx, y1 + G],
    [cx + h, y1 + G + h],
    [cx + h, y2 - G - h],
    [cx, y2 - G],
    [cx - h, y2 - G - h],
    [cx - h, y1 + G + h],
]

const SEGMENTS: Record<Seg, Pt[]> = {
    a: hSeg(h, h, W - h),
    g: hSeg(H / 2, h, W - h),
    d: hSeg(H - h, h, W - h),
    f: vSeg(h, h, H / 2),
    b: vSeg(W - h, h, H / 2),
    e: vSeg(h, H / 2, H - h),
    c: vSeg(W - h, H / 2, H - h),
}

const DIGITS: Record<string, Seg[]> = {
    "0": ["a", "b", "c", "d", "e", "f"],
    "1": ["b", "c"],
    "2": ["a", "b", "g", "e", "d"],
    "3": ["a", "b", "g", "c", "d"],
    "4": ["f", "g", "b", "c"],
    "5": ["a", "f", "g", "c", "d"],
    "6": ["a", "f", "g", "e", "d", "c"],
    "7": ["a", "b", "c"],
    "8": ["a", "b", "c", "d", "e", "f", "g"],
    "9": ["a", "b", "c", "d", "f", "g"],
    " ": [],
}

const ALL_SEGS: Seg[] = ["a", "b", "c", "d", "e", "f", "g"]

const toPoints = (pts: Pt[], dx = 0, dy = 0) =>
    pts.map(([x, y]) => `${x + dx},${y + dy}`).join(" ")

const square = (x: number, y: number, s: number): Pt[] => [
    [x, y],
    [x + s, y],
    [x + s, y + s],
    [x, y + s],
]

type Shape = { points: string; lit: boolean }

// Fixed time shown on the Framer canvas, in exports and thumbnails (10:08)
const STATIC_TIME = new Date(2024, 0, 1, 10, 8, 0)

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 150
 */
export default function deskclockled(props) {
    const {
        format,
        bodyColor,
        digitColor,
        glow,
        blinkColon,
        leadingZero,
        showPeriod,
        style,
    } = props

    const rawId = useId().replace(/:/g, "")
    const glowId = `glow-${rawId}`
    const shadowId = `shadow-${rawId}`

    // true on the Framer canvas and during export
    const isStatic = useIsStaticRenderer()

    // null until mounted, avoids SSR/hydration mismatch on published sites
    const [liveTime, setNow] = useState<Date | null>(null)

    useEffect(() => {
        // no ticking timer in static contexts
        if (isStatic) return
        setNow(new Date())
        let interval: ReturnType<typeof setInterval>
        // align ticks to the start of each second
        const timeout = setTimeout(
            () => {
                setNow(new Date())
                interval = setInterval(() => setNow(new Date()), 1000)
            },
            1000 - (Date.now() % 1000)
        )
        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [isStatic])

    const now = isStatic ? STATIC_TIME : liveTime

    // ---------- Time -> digits ----------
    const is12 = format === "12h"
    let digits = "    "
    let isPM = false
    let colonOn = false

    if (now) {
        const hours24 = now.getHours()
        isPM = hours24 >= 12
        const hrs = is12 ? hours24 % 12 || 12 : hours24
        let hStr = String(hrs).padStart(2, "0")
        if (is12 && !leadingZero && hrs < 10) hStr = " " + hrs
        digits = hStr + String(now.getMinutes()).padStart(2, "0")
        colonOn = blinkColon ? now.getSeconds() % 2 === 0 : true
    }

    // ---------- Layout ----------
    const x0 = 0
    const x1 = W + GAP
    const colonX = 2 * W + GAP
    const x2 = colonX + COLON_W
    const x3 = x2 + W + GAP
    const digitsEnd = x3 + W
    const hasPeriod = is12 && showPeriod
    const totalW = digitsEnd + (hasPeriod ? PERIOD_W : 0)
    const totalH = H

    const shapes: Shape[] = []
    ;[x0, x1, x2, x3].forEach((dx, i) => {
        const on = DIGITS[digits[i]] ?? []
        ALL_SEGS.forEach((s) =>
            shapes.push({
                points: toPoints(SEGMENTS[s], dx),
                lit: on.includes(s),
            })
        )
    })

    const cs = T * 0.85
    const cx = colonX + (COLON_W - cs) / 2
    shapes.push({
        points: toPoints(square(cx, H * 0.32 - cs / 2, cs)),
        lit: colonOn,
    })
    shapes.push({
        points: toPoints(square(cx, H * 0.68 - cs / 2, cs)),
        lit: colonOn,
    })

    const unlit = shapes.filter((s) => !s.lit)
    const lit = shapes.filter((s) => s.lit)

    const periodX = digitsEnd + 10
    const periodText = (label: string, y: number, on: boolean) => (
        <text
            x={periodX}
            y={y}
            fontSize={13}
            fontWeight={700}
            fontFamily="Inter, system-ui, sans-serif"
            fill={on ? digitColor : bodyColor}
            opacity={on ? 1 : 0.9}
        >
            {label}
        </text>
    )

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`${-PAD} ${-PAD} ${totalW + PAD * 2} ${totalH + PAD * 2}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ overflow: "visible" }}
            >
                <defs>
                    <filter
                        id={glowId}
                        x="-100%"
                        y="-100%"
                        width="300%"
                        height="300%"
                    >
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={glow * 0.5}
                            result="near"
                        />
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation={glow * 1.4}
                            result="far"
                        />
                        <feComponentTransfer in="far" result="farSoft">
                            <feFuncA type="linear" slope={0.6} />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode in="farSoft" />
                            <feMergeNode in="near" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter
                        id={shadowId}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                    >
                        <feDropShadow
                            dx="0"
                            dy="1.5"
                            stdDeviation="1.4"
                            floodColor="#000"
                            floodOpacity="0.22"
                        />
                    </filter>
                </defs>

                {/* Housing: the plastic body around every segment */}
                <g filter={`url(#${shadowId})`}>
                    {shapes.map((s, i) => (
                        <polygon
                            key={`h${i}`}
                            points={s.points}
                            fill={bodyColor}
                            stroke={bodyColor}
                            strokeWidth={5}
                            strokeLinejoin="round"
                        />
                    ))}
                </g>

                {/* Unlit segments: body colour, slightly recessed */}
                <g>
                    {unlit.map((s, i) => (
                        <polygon
                            key={`u${i}`}
                            points={s.points}
                            fill="#000"
                            fillOpacity={0.07}
                        />
                    ))}
                </g>

                {/* Lit segments with glow */}
                <g filter={glow > 0 ? `url(#${glowId})` : undefined}>
                    {lit.map((s, i) => (
                        <polygon
                            key={`l${i}`}
                            points={s.points}
                            fill={digitColor}
                        />
                    ))}
                    {hasPeriod && isPM && periodText("PM", H * 0.72, true)}
                    {hasPeriod &&
                        !isPM &&
                        now &&
                        periodText("AM", H * 0.36, true)}
                </g>

                {hasPeriod && (
                    <g>
                        {isPM && periodText("AM", H * 0.36, false)}
                        {(!isPM || !now) && periodText("PM", H * 0.72, false)}
                    </g>
                )}
            </svg>
        </div>
    )
}

deskclockled.defaultProps = {
    format: "24h",
    bodyColor: "#F4F3EF",
    digitColor: "#FFFFFF",
    glow: 4,
    blinkColon: true,
    leadingZero: false,
    showPeriod: false,
}

addPropertyControls(deskclockled, {
    format: {
        type: ControlType.Enum,
        title: "Format",
        options: ["12h", "24h"],
        optionTitles: ["12 hour", "24 hour"],
        displaySegmentedControl: true,
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body",
    },
    digitColor: {
        type: ControlType.Color,
        title: "Digits",
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 12,
        step: 0.5,
        displayStepper: false,
    },
    blinkColon: {
        type: ControlType.Boolean,
        title: "Blink colon",
    },
    leadingZero: {
        type: ControlType.Boolean,
        title: "Leading zero",
        hidden: (p) => p.format !== "12h",
    },
    showPeriod: {
        type: ControlType.Boolean,
        title: "AM / PM",
        hidden: (p) => p.format !== "12h",
    },
})
