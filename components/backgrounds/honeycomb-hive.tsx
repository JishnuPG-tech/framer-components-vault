import { useRef, useEffect, useState } from "react"
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
    useMotionTemplate,
} from "framer-motion"

const T6 = [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1]

const ICONS: Record<string, string> = {
    ideas: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.8.8 1 1.2 1 2h6c0-.8.2-1.2 1-2A6 6 0 0 0 12 3Z",
    capital: "M9 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM14.5 6.2A5 5 0 1 1 15 15.8",
    judgement:
        "M12 4v15M7 19h10M4 8h16M8 8l-3 6a3 3 0 0 0 6 0L8 8ZM16 8l-3 6a3 3 0 0 0 6 0L16 8Z",
    people: "M8 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM16.5 7.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8ZM3 19c0-2.8 2.2-5 5-5s5 2.2 5 5M14 19c0-2 1.4-3.6 3.2-4",
    intelligence:
        "M9.5 4.5a3 3 0 0 0-3 3 3 3 0 0 0-1 5.5A3 3 0 0 0 8 18a3 3 0 0 0 4 .6M12 4.6A3 3 0 0 1 17.5 7a3 3 0 0 1 1 5.5A3 3 0 0 1 16 18a3 3 0 0 1-4 .6",
}

function imgURL(v: any): string {
    if (!v) return ""
    if (typeof v === "string") return v
    return v.src || v.url || ""
}

const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))

/**
 * HONEYCOMB (asymmetric, 3D) — flat-top hive; cells on the hex grid; own
 * image or label; glowing dots along the comb; rings of empty outer hexes that
 * FADE OUT with distance; font controls; and a 3D tilt that can sit static,
 * FOLLOW THE POINTER on hover, or be DRAGGED to rotate — all springing back to
 * the tiltX / tiltY rest pose. Animations and pointer effects are disabled in
 * static renderers (canvas + export) for a clean, still preview.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HoneycombStatic(props: any) {
    const {
        centreLabel,
        centreImage,
        cells,
        accent,
        lineColor,
        centreColor,
        outerColor,
        outerRings,
        outerFade,
        textColor,
        iconColor,
        labelFont,
        centreFont,
        uppercase,
        hexSize,
        imageScale,
        flow,
        flowDots,
        flowSpeed,
        dotsOnEmpty,
        fit,
        perspective,
        tiltX,
        tiltY,
        interaction,
        maxTilt,
        followSmooth,
        returnToRest,
        invertTilt,
        style,
    } = props

    // True in the Framer canvas and during export. When set, we must not run
    // continuous animations or pointer-driven effects.
    const isStatic = useIsStaticRenderer()

    const rootRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    const S = hexSize
    const HW = 2 * S
    const HH = Math.sqrt(3) * S
    const colStep = 1.5 * S
    const half = HH / 2

    const pos = (col: number, row: number) => ({
        x: colStep * col,
        y: HH * row + ((col & 1) !== 0 ? half : 0),
    })

    const list = Array.isArray(cells) ? cells : []
    const content = [
        {
            x: 0,
            y: 0,
            centre: true,
            label: centreLabel,
            icon: "",
            image: imgURL(centreImage),
        },
        ...list.map((c: any) => {
            const p = pos(Math.round(c?.col || 0), Math.round(c?.row || 0))
            return {
                x: p.x,
                y: p.y,
                centre: false,
                label: c?.label,
                icon: c?.icon,
                image: imgURL(c?.image),
            }
        }),
    ]

    const nb = [
        [colStep, -half],
        [colStep, half],
        [-colStep, -half],
        [-colStep, half],
        [0, -HH],
        [0, HH],
    ]
    const key = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`

    // grow N rings of empty hexes outward, tracking ring level for the fade
    const rings = Math.max(0, Math.min(5, Math.round(outerRings)))
    const emptiesLv: { x: number; y: number; level: number }[] = []
    {
        const visited = new Set(content.map((p) => key(p.x, p.y)))
        let frontier: [number, number][] = content.map((p) => [p.x, p.y])
        for (let L = 1; L <= rings; L++) {
            const next: [number, number][] = []
            for (const [px, py] of frontier) {
                for (const [dx, dy] of nb) {
                    const ex = px + dx
                    const ey = py + dy
                    const k = key(ex, ey)
                    if (visited.has(k)) continue
                    visited.add(k)
                    emptiesLv.push({ x: ex, y: ey, level: L })
                    next.push([ex, ey])
                }
            }
            frontier = next
        }
    }

    const allX = [...content.map((p) => p.x), ...emptiesLv.map((e) => e.x)]
    const allY = [...content.map((p) => p.y), ...emptiesLv.map((e) => e.y)]
    const minX = Math.min(...allX) - HW / 2
    const maxX = Math.max(...allX) + HW / 2
    const minY = Math.min(...allY) - HH / 2
    const maxY = Math.max(...allY) + HH / 2
    const margin = 4
    const combW = maxX - minX + margin * 2
    const combH = maxY - minY + margin * 2
    const ox = -minX + margin
    const oy = -minY + margin

    const verts = (cxp: number, cyp: number): [number, number][] => [
        [cxp + S, cyp],
        [cxp + S / 2, cyp + half],
        [cxp - S / 2, cyp + half],
        [cxp - S, cyp],
        [cxp - S / 2, cyp - half],
        [cxp + S / 2, cyp - half],
    ]
    const hexPts = (cxp: number, cyp: number) =>
        verts(cxp, cyp)
            .map((v) => v.join(","))
            .join(" ")

    const dotHexes: [number, number][] = [
        ...content.map((p) => [p.x + ox, p.y + oy] as [number, number]),
        ...(dotsOnEmpty
            ? emptiesLv
                  .filter((e) => e.level === 1)
                  .map((e) => [e.x + ox, e.y + oy] as [number, number])
            : []),
    ]
    const dpc = Math.max(0, Math.min(6, Math.round(flowDots)))
    const isc = Math.max(0.3, Math.min(1.2, imageScale || 0.82))
    const fr = Math.max(0.05, Math.min(0.95, outerFade))

    // --- Pointer-driven 3D tilt --------------------------------------------
    // Rest pose is tiltX / tiltY; the pointer springs angles on top of it.
    const baseX = tiltX || 0
    const baseY = tiltY || 0
    const mode = interaction || "off"
    const maxA = clamp(maxTilt ?? 16, 0, 45)

    // A single 0..1 "smoothness" maps to a spring: 0 = snappy, 1 = floaty.
    const sm = clamp(followSmooth ?? 0.5, 0, 1)
    const springCfg = {
        stiffness: 300 - sm * 240,
        damping: 18 + sm * 16,
        mass: 0.6,
    }

    const mvX = useMotionValue(baseX)
    const mvY = useMotionValue(baseY)
    const rx = useSpring(mvX, springCfg)
    const ry = useSpring(mvY, springCfg)
    const liveTransform = useMotionTemplate`rotateX(${rx}deg) rotateY(${ry}deg)`

    const draggingRef = useRef(false)

    // Keep the comb at its rest pose whenever the pointer isn't steering it
    // (covers prop edits in the canvas and switching interaction off).
    useEffect(() => {
        if (mode === "off" || !draggingRef.current) {
            mvX.set(baseX)
            mvY.set(baseY)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, baseX, baseY])

    const restPose = () => {
        mvX.set(baseX)
        mvY.set(baseY)
    }

    const aimAt = (clientX: number, clientY: number) => {
        const el = rootRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        const nx = clamp((clientX - r.left) / r.width - 0.5, -0.5, 0.5)
        const ny = clamp((clientY - r.top) / r.height - 0.5, -0.5, 0.5)
        const s = invertTilt ? -1 : 1
        // right → rotateY+, down → rotateX- (top edge tips toward viewer)
        mvY.set(baseY + s * nx * 2 * maxA)
        mvX.set(baseX - s * ny * 2 * maxA)
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (mode === "hover") aimAt(e.clientX, e.clientY)
        else if (mode === "drag" && draggingRef.current)
            aimAt(e.clientX, e.clientY)
    }
    const onPointerEnter = (e: React.PointerEvent) => {
        if (mode === "hover") aimAt(e.clientX, e.clientY)
    }
    const onPointerLeave = () => {
        if (mode === "hover") restPose()
    }
    const onPointerDown = (e: React.PointerEvent) => {
        if (mode !== "drag") return
        draggingRef.current = true
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (_) {}
        aimAt(e.clientX, e.clientY)
    }
    const endDrag = () => {
        if (mode !== "drag" || !draggingRef.current) return
        draggingRef.current = false
        if (returnToRest) restPose()
    }

    // Interaction is live only in a real (non-static) render.
    const interactive = mode !== "off" && !isStatic
    const cursor =
        interactive && mode === "drag"
            ? draggingRef.current
                ? "grabbing"
                : "grab"
            : undefined
    // -----------------------------------------------------------------------

    const willTilt = interactive || baseX !== 0 || baseY !== 0
    const sc = scale * (willTilt ? 0.88 : 1)
    const tt = uppercase ? ("uppercase" as const) : ("none" as const)
    const animate = flow && !isStatic

    useEffect(() => {
        if (typeof window === "undefined" || !rootRef.current) return
        const el = rootRef.current
        const measure = () => {
            const w = el.clientWidth
            const h = el.clientHeight
            let k = 1
            if (fit && w > 0) k = Math.min(1, w / combW, h > 0 ? h / combH : 1)
            setScale(k > 0 ? k : 1)
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        window.addEventListener("resize", measure)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [fit, combW, combH])

    const centrePt = content[0]
    const pillars = content.filter((p) => !p.centre)

    const labelSpan = (
        label: string,
        fontObj: any,
        color: string
    ) => (
        <span
            style={{
                ...(fontObj || {}),
                textTransform: tt,
                color,
                padding: "0 6px",
            }}
        >
            {label}
        </span>
    )

    const renderContent = (p: any) => {
        const font = p.centre ? centreFont : labelFont
        const col = p.centre ? centreColor : textColor
        if (p.image) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: HH * 0.04,
                    }}
                >
                    <img
                        src={p.image}
                        alt={p.label || ""}
                        style={{
                            width: HW * isc,
                            height: HH * isc,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                    {p.label ? labelSpan(p.label, font, col) : null}
                </div>
            )
        }
        if (p.icon && ICONS[p.icon]) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: HH * 0.05,
                    }}
                >
                    <svg
                        width={HH * 0.32}
                        height={HH * 0.32}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d={ICONS[p.icon]} />
                    </svg>
                    {p.label ? labelSpan(p.label, font, col) : null}
                </div>
            )
        }
        if (p.label) {
            return labelSpan(p.label, font, col)
        }
        return null
    }

    // Shared inner comb (borders, cells, dots). Only the dots differ between
    // the live and static renders.
    const comb = (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: combW,
                height: combH,
                transform: `scale(${sc})`,
                transformOrigin: "top left",
            }}
        >
            <svg
                width={combW}
                height={combH}
                viewBox={`0 0 ${combW} ${combH}`}
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                }}
            >
                {emptiesLv.map((e, i) => (
                    <polygon
                        key={"e" + i}
                        points={hexPts(e.x + ox, e.y + oy)}
                        fill="none"
                        stroke={outerColor}
                        strokeWidth={1.2}
                        strokeLinejoin="round"
                        opacity={Math.pow(fr, e.level - 1)}
                    />
                ))}
                {pillars.map((p, i) => (
                    <polygon
                        key={"p" + i}
                        points={hexPts(p.x + ox, p.y + oy)}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={1.6}
                        strokeLinejoin="round"
                    />
                ))}
                <polygon
                    points={hexPts(centrePt.x + ox, centrePt.y + oy)}
                    fill="none"
                    stroke={centreColor}
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
            </svg>

            {content.map((p, i) => (
                <div
                    key={"cc" + i}
                    style={{
                        position: "absolute",
                        left: p.x + ox - HW / 2,
                        top: p.y + oy - HH / 2,
                        width: HW,
                        height: HH,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                    }}
                >
                    {renderContent(p)}
                </div>
            ))}

            {flow && dpc > 0 && (
                <svg
                    width={combW}
                    height={combH}
                    viewBox={`0 0 ${combW} ${combH}`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                >
                    {dotHexes.map(([hx, hy], hi) => {
                        const vv = verts(hx, hy)
                        return Array.from({ length: dpc }).map((_, d) => {
                            const startIdx =
                                (hi * 2 + Math.round((d * 6) / dpc)) % 6
                            const seq = [0, 1, 2, 3, 4, 5, 0].map(
                                (m) => vv[(startIdx + m) % 6]
                            )
                            // Static renderers get a still dot; no infinite loop.
                            if (!animate) {
                                return (
                                    <circle
                                        key={hi + "-" + d}
                                        r={2.8}
                                        cx={seq[0][0]}
                                        cy={seq[0][1]}
                                        fill={accent}
                                        style={{
                                            filter: `drop-shadow(0 0 6px ${accent})`,
                                        }}
                                    />
                                )
                            }
                            return (
                                <motion.circle
                                    key={hi + "-" + d}
                                    r={2.8}
                                    fill={accent}
                                    initial={{ cx: seq[0][0], cy: seq[0][1] }}
                                    animate={{
                                        cx: seq.map((s) => s[0]),
                                        cy: seq.map((s) => s[1]),
                                    }}
                                    transition={{
                                        duration: flowSpeed,
                                        times: T6,
                                        ease: "linear",
                                        repeat: Infinity,
                                    }}
                                    style={{
                                        filter: `drop-shadow(0 0 6px ${accent})`,
                                    }}
                                />
                            )
                        })
                    })}
                </svg>
            )}
        </div>
    )

    const planeStyle = {
        width: combW * sc,
        height: combH * sc,
        position: "relative" as const,
        transformOrigin: "center center",
        transformStyle: "preserve-3d" as const,
    }

    return (
        <div
            ref={rootRef}
            onPointerMove={interactive ? onPointerMove : undefined}
            onPointerEnter={interactive ? onPointerEnter : undefined}
            onPointerLeave={interactive ? onPointerLeave : undefined}
            onPointerDown={interactive ? onPointerDown : undefined}
            onPointerUp={interactive ? endDrag : undefined}
            onPointerCancel={interactive ? endDrag : undefined}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                perspective: `${perspective}px`,
                perspectiveOrigin: "center center",
                cursor,
                touchAction:
                    interactive && mode === "drag" ? "none" : undefined,
            }}
        >
            {isStatic ? (
                <div
                    style={{
                        ...planeStyle,
                        transform: `rotateX(${baseX}deg) rotateY(${baseY}deg)`,
                    }}
                >
                    {comb}
                </div>
            ) : (
                <motion.div style={{ ...planeStyle, transform: liveTransform }}>
                    {comb}
                </motion.div>
            )}
        </div>
    )
}

HoneycombStatic.defaultProps = {
    centreLabel: "The Foundery",
    cells: [
        { label: "Ideas", icon: "ideas", col: 0, row: -1 },
        { label: "Capital", icon: "capital", col: -1, row: 0 },
        { label: "Judgement", icon: "judgement", col: 2, row: 0 },
        { label: "People", icon: "people", col: 0, row: 1 },
        { label: "Intelligence", icon: "intelligence", col: 1, row: 1 },
    ],
    accent: "#C6FF56",
    lineColor: "rgba(154,214,173,0.55)",
    centreColor: "#C6FF56",
    outerColor: "rgba(154,214,173,0.30)",
    outerRings: 2,
    outerFade: 0.45,
    textColor: "#EAF3EC",
    iconColor: "#35AC5B",
    labelFont: {
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        lineHeight: "1.2em",
    },
    centreFont: {
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: "0.12em",
        lineHeight: "1.2em",
    },
    uppercase: true,
    hexSize: 74,
    imageScale: 0.82,
    flow: true,
    flowDots: 1,
    flowSpeed: 5,
    dotsOnEmpty: false,
    fit: true,
    perspective: 1000,
    tiltX: 18,
    tiltY: 0,
    interaction: "hover",
    maxTilt: 16,
    followSmooth: 0.5,
    returnToRest: true,
    invertTilt: false,
}

addPropertyControls(HoneycombStatic, {
    centreImage: { type: ControlType.Image, title: "Centre image" },
    centreLabel: { type: ControlType.String, title: "Centre text" },
    cells: {
        type: ControlType.Array,
        title: "Cells",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Ideas",
                },
                image: { type: ControlType.Image, title: "Image / media" },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon (if no image)",
                    options: [
                        "none",
                        "ideas",
                        "capital",
                        "judgement",
                        "people",
                        "intelligence",
                    ],
                    optionTitles: [
                        "None",
                        "Ideas",
                        "Capital",
                        "Judgement",
                        "People",
                        "Intelligence",
                    ],
                    defaultValue: "ideas",
                },
                col: {
                    type: ControlType.Number,
                    title: "Col",
                    min: -6,
                    max: 6,
                    step: 1,
                    displayStepper: true,
                    defaultValue: 0,
                },
                row: {
                    type: ControlType.Number,
                    title: "Row",
                    min: -6,
                    max: 6,
                    step: 1,
                    displayStepper: true,
                    defaultValue: 0,
                },
            },
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    centreFont: {
        type: ControlType.Font,
        title: "Centre font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image scale",
        min: 0.3,
        max: 1.2,
        step: 0.02,
    },
    perspective: {
        type: ControlType.Number,
        title: "3D depth",
        min: 400,
        max: 2400,
        step: 50,
    },
    interaction: {
        type: ControlType.Enum,
        title: "Pointer tilt",
        options: ["off", "hover", "drag"],
        optionTitles: ["Off (static)", "Hover follow", "Drag to rotate"],
        defaultValue: "hover",
    },
    maxTilt: {
        type: ControlType.Number,
        title: "Follow max °",
        min: 0,
        max: 45,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => (p.interaction || "off") === "off",
    },
    followSmooth: {
        type: ControlType.Number,
        title: "Smoothness",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => (p.interaction || "off") === "off",
    },
    returnToRest: {
        type: ControlType.Boolean,
        title: "Return to rest",
        defaultValue: true,
        hidden: (p: any) => (p.interaction || "off") !== "drag",
    },
    invertTilt: {
        type: ControlType.Boolean,
        title: "Invert direction",
        defaultValue: false,
        hidden: (p: any) => (p.interaction || "off") === "off",
    },
    tiltX: {
        type: ControlType.Number,
        title: "Rest tilt X",
        min: -45,
        max: 45,
        step: 1,
        displayStepper: true,
    },
    tiltY: {
        type: ControlType.Number,
        title: "Rest tilt Y",
        min: -45,
        max: 45,
        step: 1,
        displayStepper: true,
    },
    accent: { type: ControlType.Color, title: "Accent / dots" },
    lineColor: { type: ControlType.Color, title: "Cell border" },
    centreColor: { type: ControlType.Color, title: "Centre outline" },
    outerColor: { type: ControlType.Color, title: "Outer hexes" },
    outerRings: {
        type: ControlType.Number,
        title: "Outer rings",
        min: 0,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    outerFade: {
        type: ControlType.Number,
        title: "Outer fade",
        min: 0.05,
        max: 0.95,
        step: 0.05,
    },
    textColor: { type: ControlType.Color, title: "Label colour" },
    iconColor: { type: ControlType.Color, title: "Icon" },
    hexSize: {
        type: ControlType.Number,
        title: "Hex size (max)",
        min: 40,
        max: 160,
        step: 1,
    },
    fit: {
        type: ControlType.Boolean,
        title: "Fit to container",
        defaultValue: true,
    },
    flow: {
        type: ControlType.Boolean,
        title: "Flowing dots",
        defaultValue: true,
    },
    flowDots: {
        type: ControlType.Number,
        title: "Dots per hex (0–6)",
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    flowSpeed: {
        type: ControlType.Number,
        title: "Loop secs",
        min: 1,
        max: 16,
        step: 0.5,
    },
    dotsOnEmpty: {
        type: ControlType.Boolean,
        title: "Dots on empties",
        defaultValue: false,
    },
})
