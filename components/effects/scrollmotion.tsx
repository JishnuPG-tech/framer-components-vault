import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * ScrollMotion
 * Same fixed gold curve + travelling dot as PW_GoldLineFollow, plus a
 * "Sections" list. Add one row per section you want to control:
 *
 *  - Section name : the Scroll section name (or layer name) of that section
 *  - Layer        : Over  = the line passes over the section (normal)
 *                   Under = the line slides under it and disappears inside it
 *  - Shift X      : drags the line left (-) or right (+) while that section is on screen
 *  - Bend         : bows the curve more to the left (-) or right (+) in that section
 *
 * Only the part of the line that is over that section changes; the rest of
 * the page keeps the normal curve. The change blends in and out smoothly.
 *
 * HOW TO USE: place ONCE per page (or in your navbar component). Position =
 * Fixed, top 0 / left 0, Width 100%, Height 100%. Do not put one in each section.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 800
 */

type Row = {
    name?: string
    layer?: "over" | "under"
    shiftX?: number
    bend?: number
}

type Props = {
    sections: Row[]
    blend: number
    xPosition: number
    mobileX: number
    sway: number
    thickness: number
    dotSize: number
    onDarkColor: string
    onLightColor: string
    autoContrast: boolean
    travelStart: number
    travelEnd: number
    smooth: number
    showSecondCurve: boolean
    hideOnMobile: boolean
    mobileBreakpoint: number
    zIndex: number
    previewProgress: number
    style?: React.CSSProperties
}

type Pt = { x: number; y: number }

const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b)
const smoothstep = (t: number) => {
    const c = clamp(t, 0, 1)
    return c * c * (3 - 2 * c)
}
const norm = (s: string) =>
    s
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")

function cubic(t: number, a: number, b: number, c: number, d: number) {
    const u = 1 - t
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d
}

// The same curve as before, sampled into points
function buildBase(W: number, H: number, x: number, s: number) {
    const pts: Pt[] = []
    const seg = (
        p0: number[],
        c1: number[],
        c2: number[],
        p1: number[],
        n: number,
        skipFirst: boolean
    ) => {
        for (let i = skipFirst ? 1 : 0; i <= n; i++) {
            const t = i / n
            pts.push({
                x: cubic(t, p0[0], c1[0], c2[0], p1[0]),
                y: cubic(t, p0[1], c1[1], c2[1], p1[1]),
            })
        }
    }
    const p0 = [x + W * 0.04 * s, 0]
    const a1 = [x - W * 0.12 * s, H * 0.25]
    const a2 = [x - W * 0.12 * s, H * 0.5]
    const p1 = [x + W * 0.02 * s, H * 0.78]
    const b1 = [2 * p1[0] - a2[0], 2 * p1[1] - a2[1]]
    const b2 = [x + W * 0.12 * s, H * 0.98]
    const p2 = [x + W * 0.08 * s, H]
    seg(p0, a1, a2, p1, 60, false)
    seg(p1, b1, b2, p2, 36, true)
    const cum: number[] = [0]
    for (let i = 1; i < pts.length; i++) {
        cum.push(
            cum[i - 1] +
                Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
        )
    }
    return { pts, cum, total: cum[cum.length - 1] || 1 }
}

// Check background contrast safely within root container constraints
function backgroundAt(
    rootEl: HTMLElement | null,
    x: number,
    y: number
): "dark" | "light" {
    if (typeof document === "undefined" || !rootEl) return "dark"
    let el = document.elementFromPoint(x, y) as HTMLElement | null
    while (el && rootEl.contains(el)) {
        const tag = el.tagName
        if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS") return "dark"
        const cs = getComputedStyle(el)
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/)
        if (m) {
            const p = m[1].split(",").map((v) => parseFloat(v))
            const alpha = p.length > 3 ? p[3] : 1
            if (alpha > 0.5) {
                const lum =
                    (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255
                return lum < 0.55 ? "dark" : "light"
            }
        }
        if (cs.backgroundImage && cs.backgroundImage !== "none") return "dark"
        el = el.parentElement
    }
    return "light"
}

// Find section within the document/page scoped safely
function findSection(name: string): HTMLElement | null {
    const n = name.trim()
    if (!n || typeof document === "undefined") return null
    const found: HTMLElement[] = []
    const direct = document.getElementById(n)
    if (direct) found.push(direct)
    const want = norm(n)
    document.querySelectorAll("[id],[data-framer-name]").forEach((c) => {
        const el = c as HTMLElement
        if (found.includes(el)) return
        if (
            (el.id && norm(el.id) === want) ||
            norm(el.getAttribute("data-framer-name") || "") === want
        )
            found.push(el)
    })
    return found.find((e) => e.getClientRects().length > 0) || null
}

/**
 * @framerDisableUnlink
 */
export default function ScrollMotion(props: Props) {
    const {
        sections,
        blend,
        xPosition,
        mobileX,
        sway,
        thickness,
        dotSize,
        onDarkColor,
        onLightColor,
        autoContrast,
        travelStart,
        travelEnd,
        smooth,
        showSecondCurve,
        hideOnMobile,
        mobileBreakpoint,
        zIndex,
        previewProgress,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const dotRef = useRef<SVGCircleElement>(null)
    const maskRefs = useRef<(SVGRectElement | null)[]>([])
    const uid = useRef("pwgl" + Math.random().toString(36).slice(2, 8)).current
    const [size, setSize] = useState({ w: 1440, h: 800 })
    const [mode, setMode] = useState<"dark" | "light">("dark")
    const [isVisible, setIsVisible] = useState(true)

    const rows: Row[] = Array.isArray(sections)
        ? sections.filter((r) => r && r.name && r.name.trim())
        : []

    // Measure viewports and canvas frames safely
    useEffect(() => {
        const measure = () => {
            if (isCanvas) {
                const r = rootRef.current?.getBoundingClientRect()
                if (r) setSize({ w: r.width || 1440, h: r.height || 800 })
            } else {
                setSize({ w: window.innerWidth, h: window.innerHeight })
            }
        }
        measure()
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [isCanvas])

    // IntersectionObserver to pause work when offscreen
    useEffect(() => {
        if (isCanvas || isStatic || !rootRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [isCanvas, isStatic])

    const W = size.w
    const H = size.h
    const mobile = W < mobileBreakpoint
    const x = W * ((mobile ? mobileX : xPosition) / 100)
    const s = sway / 12

    const base = useMemo(() => buildBase(W, H, x, s), [W, H, x, s])
    const baseD = useMemo(
        () =>
            base.pts
                .map(
                    (p, i) =>
                        `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
                )
                .join(" "),
        [base]
    )

    const cfg = useRef({
        rows,
        blend,
        travelStart,
        travelEnd,
        smooth,
        autoContrast,
        previewProgress,
        W,
        H,
    })
    cfg.current = {
        rows,
        blend,
        travelStart,
        travelEnd,
        smooth,
        autoContrast,
        previewProgress,
        W,
        H,
    }

    useEffect(() => {
        if (isStatic || !isVisible) return
        const path = pathRef.current
        const dot = dotRef.current
        if (!path || !dot) return
        const reduce =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        let shown = -1
        let raf = 0
        let lastSample = 0
        const resolved: (HTMLElement | null)[] = []
        const resolvedName: string[] = []
        const lastFind: number[] = []

        const frame = (now: number) => {
            const c = cfg.current
            const { pts, cum, total } = base

            let tg: number
            if (isCanvas) tg = c.previewProgress / 100
            else {
                const max =
                    document.documentElement.scrollHeight - window.innerHeight
                tg = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
            }
            shown =
                shown < 0 || reduce
                    ? tg
                    : shown + (tg - shown) * clamp(c.smooth, 0.02, 1)
            if (Math.abs(tg - shown) < 0.0004) shown = tg

            const infl: {
                top: number
                bottom: number
                shift: number
                bend: number
            }[] = []
            c.rows.forEach((row, i) => {
                const mk = maskRefs.current[i]
                if (mk) mk.setAttribute("width", "0")
                if (isCanvas) return
                const name = row.name!.trim()
                if (resolvedName[i] !== name) {
                    resolvedName[i] = name
                    resolved[i] = null
                    lastFind[i] = 0
                }
                let el = resolved[i]
                if (
                    !el ||
                    !el.isConnected ||
                    el.getClientRects().length === 0
                ) {
                    el = null
                    if (now - (lastFind[i] || 0) > 600) {
                        lastFind[i] = now
                        el = findSection(name)
                        resolved[i] = el
                    }
                }
                if (!el) return
                const r = el.getBoundingClientRect()
                if (r.height <= 0 || r.bottom < 0 || r.top > c.H) return
                if (row.layer === "under" && mk) {
                    mk.setAttribute("x", String(r.left))
                    mk.setAttribute("y", String(r.top))
                    mk.setAttribute("width", String(r.width))
                    mk.setAttribute("height", String(r.height))
                }
                const shift = row.shiftX || 0
                const bend = row.bend || 0
                if (shift !== 0 || bend !== 0)
                    infl.push({ top: r.top, bottom: r.bottom, shift, bend })
            })

            const xs: number[] = new Array(pts.length)
            for (let k = 0; k < pts.length; k++) {
                const y = pts[k].y
                let off = 0
                for (let q = 0; q < infl.length; q++) {
                    const f = infl[q]
                    const b = Math.min(
                        Math.max(0, c.blend),
                        (f.bottom - f.top) / 2
                    )
                    const w =
                        b > 0
                            ? smoothstep((y - f.top) / b) *
                              smoothstep((f.bottom - y) / b)
                            : y >= f.top && y <= f.bottom
                              ? 1
                              : 0
                    if (w > 0)
                        off +=
                            w *
                            (f.shift +
                                f.bend *
                                    Math.sin(Math.PI * clamp(y / c.H, 0, 1))) *
                            (c.W / 100)
                }
                xs[k] = pts[k].x + off
            }
            let d = ""
            for (let k = 0; k < pts.length; k++) {
                d += `${k === 0 ? "M" : "L"}${xs[k].toFixed(1)} ${pts[k].y.toFixed(1)} `
            }
            path.setAttribute("d", d)

            const t =
                c.travelStart / 100 +
                ((c.travelEnd - c.travelStart) / 100) * shown
            const target = clamp(t, 0, 1) * total
            let lo = 0
            let hi = cum.length - 1
            while (hi - lo > 1) {
                const mid = (lo + hi) >> 1
                if (cum[mid] <= target) lo = mid
                else hi = mid
            }
            const seglen = cum[hi] - cum[lo] || 1
            const f = clamp((target - cum[lo]) / seglen, 0, 1)
            const px = xs[lo] + (xs[hi] - xs[lo]) * f
            const py = pts[lo].y + (pts[hi].y - pts[lo].y) * f
            dot.setAttribute("cx", String(px))
            dot.setAttribute("cy", String(py))

            if (c.autoContrast && !isCanvas && now - lastSample > 120) {
                lastSample = now
                const m = backgroundAt(rootRef.current, px, py)
                setMode((prev) => (prev === m ? prev : m))
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [base, isCanvas, isStatic, isVisible])

    if (hideOnMobile && mobile && !isCanvas) return null

    const colour = !autoContrast || mode === "dark" ? onDarkColor : onLightColor

    return (
        <div
            ref={rootRef}
            aria-hidden
            style={{
                ...style,
                position: isCanvas ? "relative" : "fixed",
                inset: isCanvas ? undefined : 0,
                width: isCanvas ? "100%" : "100vw",
                height: isCanvas ? "100%" : "100vh",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex,
            }}
        >
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
                fill="none"
            >
                <defs>
                    <linearGradient
                        id={`${uid}-fade`}
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2={H}
                    >
                        <stop offset="0" stopColor={colour} stopOpacity="0" />
                        <stop
                            offset="0.15"
                            stopColor={colour}
                            stopOpacity="1"
                        />
                        <stop
                            offset="0.85"
                            stopColor={colour}
                            stopOpacity="1"
                        />
                        <stop offset="1" stopColor={colour} stopOpacity="0" />
                    </linearGradient>
                    <mask
                        id={`${uid}-mask`}
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width={W}
                        height={H}
                    >
                        <rect x="0" y="0" width={W} height={H} fill="white" />
                        {rows.map((_, i) => (
                            <rect
                                key={i}
                                ref={(el) => {
                                    maskRefs.current[i] = el
                                }}
                                x="0"
                                y="0"
                                width="0"
                                height="0"
                                fill="black"
                            />
                        ))}
                    </mask>
                </defs>
                <g mask={`url(#${uid}-mask)`}>
                    <path
                        ref={pathRef}
                        d={baseD}
                        stroke={`url(#${uid}-fade)`}
                        strokeWidth={thickness}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {showSecondCurve && !mobile && (
                        <path
                            d={`M ${W * 0.18} ${H} Q ${W * 0.3} ${H * 0.9} ${W * 0.44} ${H * 0.89}`}
                            stroke={colour}
                            strokeWidth={thickness}
                            opacity={0.55}
                            style={{ transition: "stroke 0.5s ease" }}
                        />
                    )}
                    <circle
                        ref={dotRef}
                        r={dotSize}
                        fill={colour}
                        style={{ transition: "fill 0.5s ease" }}
                    />
                </g>
            </svg>
        </div>
    )
}

ScrollMotion.defaultProps = {
    width: 1440,
    height: 800,
    sections: [],
    blend: 160,
}

addPropertyControls(ScrollMotion, {
    sections: {
        type: ControlType.Array,
        title: "Sections",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Section name",
                    placeholder: "Scroll section name",
                },
                layer: {
                    type: ControlType.Enum,
                    title: "Layer",
                    options: ["over", "under"],
                    optionTitles: ["Over", "Under"],
                    displaySegmentedControl: true,
                    defaultValue: "over",
                },
                shiftX: {
                    type: ControlType.Number,
                    title: "Shift X",
                    min: -40,
                    max: 40,
                    step: 0.5,
                    unit: "%",
                    defaultValue: 0,
                },
                bend: {
                    type: ControlType.Number,
                    title: "Bend",
                    min: -40,
                    max: 40,
                    step: 0.5,
                    unit: "%",
                    defaultValue: 0,
                },
            },
        },
    },
    blend: {
        type: ControlType.Number,
        title: "Edge Blend",
        defaultValue: 160,
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
        description:
            "How softly the change fades in and out at a section's edges",
    },
    xPosition: {
        type: ControlType.Number,
        title: "Line X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Where the curve sits across the screen (desktop)",
    },
    mobileX: {
        type: ControlType.Number,
        title: "Line X Mobile",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    sway: {
        type: ControlType.Number,
        title: "Curve Sway",
        defaultValue: 12,
        min: 2,
        max: 30,
        step: 1,
        unit: "%",
        description: "How far the curve bows left and right",
    },
    thickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        defaultValue: 1.2,
        min: 0.5,
        max: 4,
        step: 0.1,
        unit: "px",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Radius",
        defaultValue: 7,
        min: 3,
        max: 16,
        step: 0.5,
        unit: "px",
    },
    onDarkColor: {
        type: ControlType.Color,
        title: "On Dark / Photo",
        defaultValue: "#EFD084",
    },
    onLightColor: {
        type: ControlType.Color,
        title: "On Light",
        defaultValue: "#C9985A",
    },
    autoContrast: {
        type: ControlType.Boolean,
        title: "Auto Colour",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Switches colour based on the section behind the dot",
    },
    travelStart: {
        type: ControlType.Number,
        title: "Dot Start",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
        description: "Dot position on the curve at the top of the page",
    },
    travelEnd: {
        type: ControlType.Number,
        title: "Dot End",
        defaultValue: 88,
        min: 50,
        max: 100,
        step: 1,
        unit: "%",
        description: "Dot position on the curve at the bottom of the page",
    },
    smooth: {
        type: ControlType.Number,
        title: "Glide",
        defaultValue: 0.12,
        min: 0.02,
        max: 1,
        step: 0.01,
        description: "Lower = slower, floatier. 1 = instant",
    },
    showSecondCurve: {
        type: ControlType.Boolean,
        title: "Bottom Curve",
        defaultValue: true,
    },
    hideOnMobile: {
        type: ControlType.Boolean,
        title: "Hide On Mobile",
        defaultValue: false,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        defaultValue: 810,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z Index",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        description: "Keep below your navbar and the WhatsApp button",
    },
    previewProgress: {
        type: ControlType.Number,
        title: "Canvas Preview",
        defaultValue: 35,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Dot position shown while designing",
    },
})
