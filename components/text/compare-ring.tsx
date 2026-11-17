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

import { animate } from "framer-motion"

// Comparison Ring — v20
// NEW (this version): per-item "Legend text" override. Each comparison can
// now supply an arbitrary string that replaces the auto-formatted numeric
// value in the legend (e.g. "Sold out", "N/A", "2×", "≈ 1 hr"). Blank =
// falls back to the formatted Value + prefix/suffix as before. The override
// only shows when the legend's "Values" toggle is on — it swaps WHAT is
// shown, not WHETHER it's shown. Display-only: it never touches geometry,
// the center counter, or the aria label's value read-out.
// ---
// v19 — FIX (per Framer automated review): static-context detection now uses
// useIsStaticRenderer() instead of RenderTarget.current() === canvas alone.
// The canvas-only check missed RenderTarget.export, which could let a
// continuous animation (Race loop) still be "live" during export, causing
// tiling/artifacts in exported snapshots. All three animation engines
// (Compare's framer-motion animate, Race Once's JS loop, Race Loop's CSS
// keyframes) key off one staticRender flag, so fixing it once covers all three.
// Race mode. Toggle "Mode" between Compare (existing arc-fill) and
// Race (dots lap a full 360° ring). Once = JS-driven, one lap, counter still
// works. Loop / Loop+Delay = pure CSS, run forever, no ongoing JS cost.
// A radial comparison / gauge component.
//   Sweep (0–100%) — where each arc ends along the ring's active span.
//   Start angle — where 0% begins (0 = 12 o'clock, 90 = 3 o'clock, …).
//   Gauge span — total degrees the ring covers (360 = full circle,
//     270 = speedometer-style gauge with a gap at the bottom).
//   Value / Prefix / Suffix — display-only (legend + center counter).
//   Animate from — each arc grows from empty or retracts from full.
// Geometry and display are fully decoupled, so any units can coexist.

interface Comparison {
    label: string
    sweep: number
    reverse: boolean
    fromFull: boolean
    lapDuration: number
    value: number
    prefix: string
    suffix: string
    legendOverride: string
    color: string
    emphasize: boolean
}

interface Props {
    mode: "compare" | "race"
    comparisons: Comparison[]
    ring: {
        size: number
        layout: "shared" | "concentric"
        startAngle: number
        gaugeSpan: number
        trackColor: string
        showTrack: boolean
        strokeWidth: number
        dotSize: number
        ringSpacing: number
        roundedCaps: boolean
    }
    race: {
        play: "once" | "loop" | "loopDelay"
        delay: number
    }
    transition: {
        transition: any
        sequence: "overlap" | "sequential"
        stagger: number
        playOnScrollIntoView: boolean
        replayOnReenter: boolean
    }
    emphasis: {
        effect: "none" | "pulse" | "glow" | "breathe"
        intensity: number
        speed: number
        applyToLegendDot: boolean
    }
    center: {
        show: boolean
        counter: "none" | "up" | "down"
        countFrom: number
        customValue: string
        matchEmphasisColor: boolean
        subtext: string
        subtextGap: number
    }
    legend: {
        show: boolean
        placement: "above" | "below" | "left" | "right"
        ringGap: number
        itemGap: number
        direction: "row" | "column"
        alignment: "start" | "center" | "end"
        showValues: boolean
    }
    typography: {
        labelFont: any
        centerFont: any
        subtextFont: any
        textColor: string
        mutedColor: string
    }
}

const precisionOf = (n: number) => {
    if (!isFinite(n)) return 0
    const s = String(n)
    const i = s.indexOf(".")
    return i === -1 ? 0 : Math.min(s.length - i - 1, 4)
}

const formatNumber = (n: number, decimals: number) =>
    n.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })

const fmtValue = (c: Comparison, v?: number) => {
    const decimals = precisionOf(c.value)
    const num = v !== undefined ? v : c.value
    return `${c.prefix}${formatNumber(num, decimals)}${c.suffix}`
}

// What the legend shows for an item's value slot. A non-empty Legend text
// override wins; otherwise fall back to the auto-formatted number. Kept
// separate from fmtValue so the center counter / aria label stay numeric.
const legendValueText = (c: Comparison) =>
    c.legendOverride && c.legendOverride.trim() !== ""
        ? c.legendOverride
        : fmtValue(c)

function polar(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// Draws an arc starting at `startDeg` (absolute, 0 = 12 o'clock, clockwise),
// sweeping `sweepDeg` degrees. reverse makes it sweep counter-clockwise.
function arcPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    sweepDeg: number,
    reverse = false
) {
    if (sweepDeg <= 0.01) return ""
    const a = Math.min(sweepDeg, 359.99)
    const endDeg = reverse ? startDeg - a : startDeg + a
    const s = polar(cx, cy, r, startDeg)
    const e = polar(cx, cy, r, endDeg)
    const largeArc = a > 180 ? 1 : 0
    const sweepFlag = reverse ? 0 : 1
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${e.x} ${e.y}`
}

export default function ComparisonRing(props: Props) {
    const {
        mode,
        comparisons,
        ring,
        transition,
        race,
        emphasis,
        center,
        legend,
        typography,
    } = props

    // isCanvas: for the canvas-only "Add a comparison" editor hint — that
    // hint is an editing aid and should never appear in an export or on the
    // live site, so it stays scoped to the canvas specifically.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // staticRender: the authoritative check for disabling ALL animation and
    // continuous effects. useIsStaticRenderer() covers both the Framer
    // canvas AND export — RenderTarget.canvas alone misses export, which is
    // exactly what causes tiling/artifact issues in exported snapshots if a
    // continuous animation (e.g. Race mode's loop) is still "live" when the
    // export is captured.
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const staticRender = isStaticRenderer || prefersReduced

    // Active span of the ring in degrees (360 = full circle, less = gauge).
    const span = Math.min(Math.max(ring.gaugeSpan, 10), 360)
    const spanCap = span >= 360 ? 359.99 : span
    const startDeg = ring.startAngle

    // Sweep slider (0–100%) → target angle within the active span.
    const targets = useMemo(
        () =>
            comparisons.map((c) =>
                Math.min(
                    (Math.min(Math.max(c.sweep, 0), 100) / 100) * span,
                    spanCap
                )
            ),
        [comparisons, span, spanCap]
    )

    const emphasizedIndex = useMemo(() => {
        if (comparisons.length === 0) return -1
        const i = comparisons.findIndex((c) => c.emphasize)
        return i === -1 ? comparisons.length - 1 : i
    }, [comparisons])

    const [progress, setProgress] = useState<number[]>(() =>
        staticRender ? targets.map(() => 1) : targets.map(() => 0)
    )
    const [started, setStarted] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const uid = useRef(
        `cring-${Math.random().toString(36).slice(2, 8)}`
    ).current

    useEffect(() => {
        if (staticRender) return
        if (!transition.playOnScrollIntoView) {
            setStarted(true)
            return
        }
        const el = containerRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setStarted(true)
                    if (!transition.replayOnReenter) obs.disconnect()
                } else if (transition.replayOnReenter) {
                    setStarted(false)
                    setProgress(targets.map(() => 0))
                }
            },
            { threshold: 0.35 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [
        staticRender,
        transition.playOnScrollIntoView,
        transition.replayOnReenter,
        targets.length,
    ])

    // Compare mode is driven by Framer Motion's animate(), so the Transition
    // control (springs, tweens, custom beziers, etc.) works natively.
    // Overlap: every ring starts at i * stagger.
    // Sequential: ring i+1 waits for ring i to actually finish, then stagger.
    // Sequential can't precompute offsets — a spring has no fixed duration —
    // so it chains off each animation's completion instead.
    useEffect(() => {
        if (staticRender || !started || mode !== "compare") return

        const stagS = Math.max(transition.stagger, 0)
        const t = transition.transition ?? {}
        const controls: Array<{ stop: () => void }> = []
        let cancelled = false

        const setAt = (i: number, v: number) =>
            setProgress((prev) => {
                const next = [...prev]
                next[i] = v
                return next
            })

        if (transition.sequence === "sequential") {
            const runChain = async () => {
                for (let i = 0; i < targets.length; i++) {
                    if (cancelled) return
                    const c = animate(0, 1, {
                        ...t,
                        onUpdate: (v: number) => setAt(i, v),
                    })
                    controls.push(c)
                    try {
                        await c
                    } catch {
                        return // stopped during cleanup
                    }
                    if (cancelled) return
                    if (stagS > 0) {
                        await new Promise((r) => setTimeout(r, stagS * 1000))
                    }
                }
            }
            runChain()
        } else {
            targets.forEach((_, i) => {
                const c = animate(0, 1, {
                    ...t,
                    delay: (t.delay ?? 0) + i * stagS,
                    onUpdate: (v: number) => setAt(i, v),
                })
                controls.push(c)
            })
        }

        return () => {
            cancelled = true
            controls.forEach((c) => c.stop())
        }
    }, [
        staticRender,
        started,
        mode,
        targets.length,
        transition.transition,
        transition.sequence,
        transition.stagger,
    ])

    // Race mode, "Once": each item has its own lap duration, so start times
    // are computed independently (cumulative in sequential mode, since laps
    // aren't a shared length). Always linear — a lap implies constant speed.
    const [raceProgress, setRaceProgress] = useState<number[]>(() =>
        comparisons.map(() => (staticRender ? 1 : 0))
    )
    const raceRafRef = useRef<number>(0)

    useEffect(() => {
        if (staticRender || !started || mode !== "race" || race.play !== "once")
            return
        const stag = Math.max(transition.stagger, 0) * 1000
        const laps = comparisons.map((c) => Math.max(c.lapDuration, 0.1) * 1000)
        const starts: number[] =
            transition.sequence === "sequential"
                ? laps.reduce<number[]>((acc, dur, i) => {
                      const prevStart = i === 0 ? 0 : acc[i - 1]
                      const prevDur = i === 0 ? 0 : laps[i - 1]
                      acc.push(i === 0 ? 0 : prevStart + prevDur + stag)
                      return acc
                  }, [])
                : laps.map((_, i) => i * stag)
        let t0: number | null = null

        const tick = (now: number) => {
            if (t0 === null) t0 = now
            const elapsed = now - t0
            let allDone = true
            setRaceProgress(
                laps.map((dur, i) => {
                    const t = Math.min(
                        Math.max((elapsed - starts[i]) / dur, 0),
                        1
                    )
                    if (t < 1) allDone = false
                    return t // linear, no easing — constant lap speed
                })
            )
            if (!allDone) raceRafRef.current = requestAnimationFrame(tick)
        }
        raceRafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raceRafRef.current)
    }, [
        staticRender,
        started,
        mode,
        race.play,
        comparisons,
        transition.sequence,
        transition.stagger,
    ])

    const VB = 300
    const cx = VB / 2
    const cy = VB / 2
    const pad = ring.strokeWidth + Math.max(ring.dotSize, ring.strokeWidth) + 4
    const outerR = VB / 2 - pad
    const radiusFor = (i: number) =>
        ring.layout === "concentric"
            ? Math.max(
                  outerR - i * (ring.strokeWidth + ring.ringSpacing),
                  ring.strokeWidth * 2
              )
            : outerR

    // Center value: counts to the emphasized item's display Value.
    // Count-down starts from Count From (or the largest item value if 0).
    const focusItem = comparisons[emphasizedIndex]
    const compareProgress = Math.min(progress[emphasizedIndex] ?? 1, 1)
    const raceOnceProgress = Math.min(raceProgress[emphasizedIndex] ?? 1, 1)
    // Loop/loopDelay are pure CSS with no JS progress signal, so the counter
    // isn't attempted there — it would drift out of sync with the animation.
    const canCount = mode === "compare" || race.play === "once"
    const focusProgress = mode === "race" ? raceOnceProgress : compareProgress
    const largestValue = Math.max(
        ...comparisons.map((c) => Math.max(c.value, 0)),
        0
    )
    const countFrom = center.countFrom > 0 ? center.countFrom : largestValue

    let centerValue = ""
    if (center.customValue.trim() !== "") {
        centerValue = center.customValue
    } else if (focusItem) {
        if (
            staticRender ||
            !canCount ||
            center.counter === "none" ||
            focusProgress >= 1
        ) {
            centerValue = fmtValue(focusItem)
        } else if (center.counter === "up") {
            centerValue = fmtValue(focusItem, focusProgress * focusItem.value)
        } else {
            centerValue = fmtValue(
                focusItem,
                countFrom - focusProgress * (countFrom - focusItem.value)
            )
        }
    }

    const emphasisColor = comparisons[emphasizedIndex]?.color
    // Match color intentionally affects ONLY the main value, not the subtext.
    const centerColor =
        center.matchEmphasisColor && emphasisColor
            ? emphasisColor
            : typography.textColor
    const subtextColor = typography.mutedColor

    const ariaLabel =
        comparisons.length === 0
            ? "Comparison ring, no data"
            : `Comparison: ${comparisons
                  .map((c) => `${c.label} ${fmtValue(c)}`)
                  .join(", ")}.`

    // Emphasis intensity now maxes at 2x its old ceiling.
    const eInt = emphasis.intensity * 2
    // Speed multiplier: higher = faster. Base durations divided by speed.
    const eSpeed = Math.max(emphasis.speed, 0.1)
    const pulseDur = 2 / eSpeed
    const breatheDur = 2.4 / eSpeed
    const pingDur = 1.8 / eSpeed
    const glowPx = 3 + eInt * 6
    const alignMap = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
    } as const

    const outerFlexDir: React.CSSProperties["flexDirection"] =
        legend.placement === "above"
            ? "column-reverse"
            : legend.placement === "below"
              ? "column"
              : legend.placement === "left"
                ? "row-reverse"
                : "row"

    const isSideLegend =
        legend.placement === "left" || legend.placement === "right"

    // Race mode (loop / loopDelay): one @keyframes per item, since each has
    // its own lap duration, direction, and hold percentage.
    // Pure CSS — no JS runs once these start, which matters for "infinite".
    //
    // loop:      each dot cycles independently at its own lap duration, so
    //            faster dots lap slower ones (the racing visual).
    // loopDelay: all dots share ONE cycle = slowest lap + delay. Each dot
    //            finishes its lap at its own pace, then holds at the finish
    //            line until the whole field is done and the delay elapses,
    //            so every dot restarts together, in phase, every cycle.
    const slowestLap = comparisons.length
        ? Math.max(...comparisons.map((c) => Math.max(c.lapDuration, 0.1)))
        : 0.1
    const sharedCycle = slowestLap + Math.max(race.delay, 0)

    const raceCycleFor = (c: Comparison) =>
        race.play === "loopDelay" ? sharedCycle : Math.max(c.lapDuration, 0.1)

    const raceOrbitKeyframes =
        mode === "race" && race.play !== "once"
            ? comparisons
                  .map((c, i) => {
                      const dir = c.reverse ? -1 : 1
                      const rotateEnd = dir * 360
                      const lapS = Math.max(c.lapDuration, 0.1)
                      const holdPct =
                          race.play === "loopDelay"
                              ? ((lapS / sharedCycle) * 100).toFixed(3)
                              : "100"
                      return `
                @keyframes ${uid}-orbit${i} {
                    0% { transform: rotate(0deg); }
                    ${holdPct}% { transform: rotate(${rotateEnd}deg); }
                    100% { transform: rotate(${rotateEnd}deg); }
                }`
                  })
                  .join("\n")
            : ""

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                flexDirection: outerFlexDir,
                alignItems: "center",
                justifyContent: "center",
                gap: legend.show ? legend.ringGap : 0,
                width: "100%",
                flexWrap: isSideLegend ? "wrap" : "nowrap",
            }}
        >
            <style>{`
                @keyframes ${uid}-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: ${Math.max(1 - 0.45 * eInt, 0)}; }
                }
                @keyframes ${uid}-breathe {
                    0%, 100% { stroke-width: ${ring.strokeWidth}; }
                    50% { stroke-width: ${ring.strokeWidth * (1 + 0.4 * eInt)}; }
                }
                @keyframes ${uid}-ping {
                    0% { transform: scale(1); opacity: ${Math.min(0.5 * eInt + 0.2, 1)}; }
                    100% { transform: scale(2.4); opacity: 0; }
                }
                @keyframes ${uid}-legenddot-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(${1 + 0.35 * eInt}); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .${uid}-fx { animation: none !important; }
                }
                ${raceOrbitKeyframes}
            `}</style>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: ring.size,
                    aspectRatio: "1 / 1",
                    flexShrink: 0,
                }}
                role="img"
                aria-label={ariaLabel}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${VB} ${VB}`}
                    aria-hidden="true"
                    style={{ display: "block", overflow: "visible" }}
                >
                    {ring.showTrack &&
                        (ring.layout === "concentric" ? (
                            comparisons.map((_, i) => (
                                <path
                                    key={`t${i}`}
                                    d={arcPath(
                                        cx,
                                        cy,
                                        radiusFor(i),
                                        startDeg,
                                        mode === "race" ? 359.99 : spanCap
                                    )}
                                    fill="none"
                                    stroke={ring.trackColor}
                                    strokeWidth={ring.strokeWidth}
                                    strokeLinecap={
                                        ring.roundedCaps &&
                                        mode !== "race" &&
                                        span < 360
                                            ? "round"
                                            : "butt"
                                    }
                                />
                            ))
                        ) : (
                            <path
                                d={arcPath(
                                    cx,
                                    cy,
                                    outerR,
                                    startDeg,
                                    mode === "race" ? 359.99 : spanCap
                                )}
                                fill="none"
                                stroke={ring.trackColor}
                                strokeWidth={ring.strokeWidth}
                                strokeLinecap={
                                    ring.roundedCaps &&
                                    mode !== "race" &&
                                    span < 360
                                        ? "round"
                                        : "butt"
                                }
                            />
                        ))}

                    {mode === "compare" &&
                        comparisons.map((c, i) => {
                            const r = radiusFor(i)
                            const p = progress[i] ?? 0
                            // Normal: grow 0 → target. From-full: retract span → target.
                            const angle = c.fromFull
                                ? span - p * (span - targets[i])
                                : p * targets[i]
                            if (angle <= 0.01) return null
                            const endDeg = c.reverse
                                ? startDeg - angle
                                : startDeg + angle
                            const end = polar(cx, cy, r, endDeg)
                            const isEmph =
                                c.emphasize && emphasis.effect !== "none"
                            const done = p >= 1

                            const arcStyle: React.CSSProperties = {}
                            if (isEmph && done && !staticRender) {
                                if (emphasis.effect === "pulse")
                                    arcStyle.animation = `${uid}-pulse ${pulseDur}s ease-in-out infinite`
                                if (emphasis.effect === "breathe")
                                    arcStyle.animation = `${uid}-breathe ${breatheDur}s ease-in-out infinite`
                            }
                            if (isEmph && emphasis.effect === "glow" && done)
                                arcStyle.filter = `drop-shadow(0 0 ${glowPx}px ${c.color})`

                            return (
                                <g key={i}>
                                    <path
                                        className={
                                            isEmph ? `${uid}-fx` : undefined
                                        }
                                        d={arcPath(
                                            cx,
                                            cy,
                                            r,
                                            startDeg,
                                            angle,
                                            c.reverse
                                        )}
                                        fill="none"
                                        stroke={c.color}
                                        strokeWidth={ring.strokeWidth}
                                        strokeLinecap={
                                            ring.roundedCaps ? "round" : "butt"
                                        }
                                        style={arcStyle}
                                    />
                                    {ring.dotSize > 0 && (
                                        <circle
                                            cx={end.x}
                                            cy={end.y}
                                            r={ring.dotSize}
                                            fill={c.color}
                                        />
                                    )}
                                    {isEmph &&
                                        emphasis.effect === "pulse" &&
                                        done &&
                                        !staticRender &&
                                        ring.dotSize > 0 && (
                                            <circle
                                                className={`${uid}-fx`}
                                                cx={end.x}
                                                cy={end.y}
                                                r={ring.dotSize}
                                                fill={c.color}
                                                style={{
                                                    transformBox: "fill-box",
                                                    transformOrigin: "center",
                                                    animation: `${uid}-ping ${pingDur}s ease-out infinite`,
                                                }}
                                            />
                                        )}
                                </g>
                            )
                        })}

                    {mode === "race" &&
                        race.play === "once" &&
                        comparisons.map((c, i) => {
                            if (ring.dotSize <= 0) return null
                            const r = radiusFor(i)
                            const dir = c.reverse ? -1 : 1
                            const p = staticRender ? 1 : (raceProgress[i] ?? 0)
                            const angle = startDeg + dir * p * 360
                            const pos = polar(cx, cy, r, angle)
                            const isEmph =
                                c.emphasize && emphasis.effect !== "none"
                            const done = p >= 1

                            const dotStyle: React.CSSProperties = {}
                            if (isEmph && done && !staticRender) {
                                if (emphasis.effect === "pulse")
                                    dotStyle.animation = `${uid}-pulse ${pulseDur}s ease-in-out infinite`
                                if (emphasis.effect === "breathe")
                                    dotStyle.animation = `${uid}-breathe ${breatheDur}s ease-in-out infinite`
                            }
                            if (isEmph && emphasis.effect === "glow" && done)
                                dotStyle.filter = `drop-shadow(0 0 ${glowPx}px ${c.color})`

                            return (
                                <g key={i}>
                                    <circle
                                        className={
                                            isEmph ? `${uid}-fx` : undefined
                                        }
                                        cx={pos.x}
                                        cy={pos.y}
                                        r={ring.dotSize}
                                        fill={c.color}
                                        style={dotStyle}
                                    />
                                    {isEmph &&
                                        emphasis.effect === "pulse" &&
                                        done &&
                                        !staticRender && (
                                            <circle
                                                className={`${uid}-fx`}
                                                cx={pos.x}
                                                cy={pos.y}
                                                r={ring.dotSize}
                                                fill={c.color}
                                                style={{
                                                    transformBox: "fill-box",
                                                    transformOrigin: "center",
                                                    animation: `${uid}-ping ${pingDur}s ease-out infinite`,
                                                }}
                                            />
                                        )}
                                </g>
                            )
                        })}

                    {mode === "race" &&
                        race.play !== "once" &&
                        comparisons.map((c, i) => {
                            if (ring.dotSize <= 0 || staticRender) return null
                            const r = radiusFor(i)
                            const startPos = polar(cx, cy, r, startDeg)
                            const isEmph =
                                c.emphasize && emphasis.effect !== "none"

                            const dotInnerStyle: React.CSSProperties = {}
                            if (isEmph) {
                                if (emphasis.effect === "pulse")
                                    dotInnerStyle.animation = `${uid}-pulse ${pulseDur}s ease-in-out infinite`
                                if (emphasis.effect === "breathe")
                                    dotInnerStyle.animation = `${uid}-breathe ${breatheDur}s ease-in-out infinite`
                                if (emphasis.effect === "glow")
                                    dotInnerStyle.filter = `drop-shadow(0 0 ${glowPx}px ${c.color})`
                            }

                            return (
                                <g
                                    key={i}
                                    style={{
                                        transformOrigin: `${cx}px ${cy}px`,
                                        animation: `${uid}-orbit${i} ${raceCycleFor(
                                            c
                                        )}s linear infinite`,
                                        animationPlayState: started
                                            ? "running"
                                            : "paused",
                                    }}
                                >
                                    <circle
                                        className={
                                            isEmph ? `${uid}-fx` : undefined
                                        }
                                        cx={startPos.x}
                                        cy={startPos.y}
                                        r={ring.dotSize}
                                        fill={c.color}
                                        style={dotInnerStyle}
                                    />
                                </g>
                            )
                        })}
                </svg>

                {comparisons.length === 0 && isCanvas && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            padding: "20%",
                            ...typography.labelFont,
                            color: typography.mutedColor,
                            pointerEvents: "none",
                        }}
                    >
                        Add a comparison to begin
                    </div>
                )}

                {center.show && comparisons.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            textAlign: "center",
                            padding: "18%",
                        }}
                    >
                        <div
                            style={{
                                ...typography.centerFont,
                                color: centerColor,
                                lineHeight: 1.1,
                                fontVariantNumeric: "tabular-nums",
                                textWrap: "balance",
                            }}
                        >
                            {centerValue}
                        </div>
                        {center.subtext && (
                            <div
                                style={{
                                    ...typography.subtextFont,
                                    color: subtextColor,
                                    marginTop: center.subtextGap,
                                    textWrap: "balance",
                                }}
                            >
                                {center.subtext}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {legend.show && (
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: legend.direction,
                        gap: legend.itemGap,
                        flexWrap: "wrap",
                        alignItems:
                            legend.direction === "column"
                                ? alignMap[legend.alignment]
                                : "center",
                        justifyContent: alignMap[legend.alignment],
                        alignSelf: isSideLegend ? "center" : "stretch",
                        maxWidth: isSideLegend ? 260 : "none",
                    }}
                >
                    {comparisons.map((c, i) => {
                        const dotEmph =
                            emphasis.applyToLegendDot &&
                            c.emphasize &&
                            emphasis.effect !== "none" &&
                            !staticRender
                        const dotStyle: React.CSSProperties = {
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: c.color,
                            flexShrink: 0,
                        }
                        if (dotEmph) {
                            if (emphasis.effect === "pulse")
                                dotStyle.animation = `${uid}-pulse ${pulseDur}s ease-in-out infinite`
                            else if (emphasis.effect === "breathe")
                                dotStyle.animation = `${uid}-legenddot-breathe ${breatheDur}s ease-in-out infinite`
                            else if (emphasis.effect === "glow")
                                dotStyle.boxShadow = `0 0 ${glowPx}px ${c.color}`
                        }
                        return (
                            <li
                                key={i}
                                style={{
                                    ...typography.labelFont,
                                    color: c.emphasize
                                        ? typography.textColor
                                        : typography.mutedColor,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    aria-hidden="true"
                                    className={
                                        dotEmph ? `${uid}-fx` : undefined
                                    }
                                    style={dotStyle}
                                />
                                <span>
                                    {c.label}
                                    {legend.showValues
                                        ? ` — ${legendValueText(c)}`
                                        : ""}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

const defaultProps: Props = {
    mode: "compare",
    comparisons: [
        {
            label: "Option A",
            sweep: 66.7,
            reverse: false,
            fromFull: false,
            lapDuration: 3,
            value: 240,
            prefix: "",
            suffix: "",
            legendOverride: "",
            color: "#B0B4BB",
            emphasize: false,
        },
        {
            label: "Option B",
            sweep: 33.3,
            reverse: false,
            fromFull: false,
            lapDuration: 1.2,
            value: 120,
            prefix: "",
            suffix: "",
            legendOverride: "",
            color: "#5B8DEF",
            emphasize: true,
        },
    ],
    ring: {
        size: 300,
        layout: "shared",
        startAngle: 0,
        gaugeSpan: 360,
        trackColor: "#E8EAEE",
        showTrack: true,
        strokeWidth: 10,
        dotSize: 8,
        ringSpacing: 6,
        roundedCaps: true,
    },
    transition: {
        transition: {
            type: "tween",
            duration: 1.6,
            ease: [0.33, 1, 0.68, 1],
        },
        sequence: "overlap",
        stagger: 0.3,
        playOnScrollIntoView: true,
        replayOnReenter: false,
    },
    race: {
        play: "loop",
        delay: 0.6,
    },
    emphasis: {
        effect: "pulse",
        intensity: 0.3,
        speed: 1,
        applyToLegendDot: false,
    },
    center: {
        show: true,
        counter: "up",
        countFrom: 0,
        customValue: "",
        matchEmphasisColor: false,
        subtext: "",
        subtextGap: 4,
    },
    legend: {
        show: true,
        placement: "below",
        ringGap: 24,
        itemGap: 28,
        direction: "row",
        alignment: "center",
        showValues: true,
    },
    typography: {
        labelFont: {
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
        },
        centerFont: {
            fontFamily: "Inter, sans-serif",
            fontSize: 40,
            fontWeight: 700,
        },
        subtextFont: {
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 400,
        },
        textColor: "#111318",
        mutedColor: "#6B7280",
    },
}

ComparisonRing.defaultProps = defaultProps

addPropertyControls(ComparisonRing, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["compare", "race"],
        optionTitles: ["Compare", "Race"],
        displaySegmentedControl: true,
        description:
            "Compare: arcs fill to show value. Race: dots lap a full ring.",
    },
    comparisons: {
        type: ControlType.Array,
        title: "Comparisons",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                sweep: {
                    type: ControlType.Number,
                    title: "Sweep",
                    min: 0,
                    max: 100,
                    step: 0.1,
                    unit: "%",
                    description:
                        "Compare mode: where the arc ends (100% = full ring)",
                },
                lapDuration: {
                    type: ControlType.Number,
                    title: "Lap duration",
                    min: 0.2,
                    max: 30,
                    step: 0.1,
                    unit: "s",
                    description: "Race mode: time for one full lap",
                },
                reverse: {
                    type: ControlType.Boolean,
                    title: "Reverse",
                    enabledTitle: "CCW",
                    disabledTitle: "CW",
                },
                fromFull: {
                    type: ControlType.Boolean,
                    title: "Animate from",
                    enabledTitle: "Full",
                    disabledTitle: "Empty",
                    description:
                        "Full = arc starts at 100% and retracts to Sweep",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    step: 0.01,
                    displayStepper: true,
                    description: "Display only — shown in legend & counter",
                },
                prefix: {
                    type: ControlType.String,
                    title: "Prefix",
                    placeholder: "e.g. $",
                },
                suffix: {
                    type: ControlType.String,
                    title: "Suffix",
                    placeholder: "e.g.  min, %, kg",
                },
                legendOverride: {
                    type: ControlType.String,
                    title: "Legend text",
                    placeholder: "Auto (uses Value)",
                    description:
                        "Replaces the value shown in the legend with any text. Blank = formatted Value.",
                },
                color: { type: ControlType.Color, title: "Color" },
                emphasize: {
                    type: ControlType.Boolean,
                    title: "Emphasize",
                },
            },
        },
        description: "Array order = animation order",
    },
    ring: {
        type: ControlType.Object,
        title: "Ring",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 120,
                max: 640,
                step: 10,
                description: "Max width in px; shrinks responsively",
            },
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["shared", "concentric"],
                optionTitles: ["Shared", "Concentric"],
                displaySegmentedControl: true,
            },
            startAngle: {
                type: ControlType.Number,
                title: "Start angle",
                min: 0,
                max: 360,
                step: 5,
                unit: "°",
                description: "0 = top, 90 = right, 180 = bottom",
            },
            gaugeSpan: {
                type: ControlType.Number,
                title: "Gauge span",
                min: 10,
                max: 360,
                step: 5,
                unit: "°",
                description: "360 = full ring, 270 = gauge",
            },
            trackColor: { type: ControlType.Color, title: "Track" },
            showTrack: { type: ControlType.Boolean, title: "Show track" },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke",
                min: 2,
                max: 24,
                step: 1,
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot size",
                min: 0,
                max: 20,
                step: 1,
            },
            ringSpacing: {
                type: ControlType.Number,
                title: "Ring gap",
                min: 0,
                max: 24,
                step: 1,
            },
            roundedCaps: {
                type: ControlType.Boolean,
                title: "Rounded caps",
            },
        },
    },
    transition: {
        type: ControlType.Object,
        title: "Transition",
        controls: {
            transition: {
                type: ControlType.Transition,
                title: "Curve",
                description: "Compare mode only — Race laps are always linear",
            },
            sequence: {
                type: ControlType.Enum,
                title: "Sequence",
                options: ["overlap", "sequential"],
                optionTitles: ["Overlap", "Queue"],
                displaySegmentedControl: true,
                description:
                    "Overlap: rings share the timeline. Queue: one after another",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger (s)",
                min: 0,
                max: 3,
                step: 0.1,
                description:
                    "Overlap mode: 0 = all together. Queue mode: gap between rings",
            },
            playOnScrollIntoView: {
                type: ControlType.Boolean,
                title: "Play on scroll",
            },
            replayOnReenter: {
                type: ControlType.Boolean,
                title: "Replay",
            },
        },
    },
    race: {
        type: ControlType.Object,
        title: "Race",
        controls: {
            play: {
                type: ControlType.Enum,
                title: "Play",
                options: ["once", "loop", "loopDelay"],
                optionTitles: ["Once", "Loop", "Delay"],
                displaySegmentedControl: true,
                description:
                    "Once: one lap, JS-driven, counter works. Loop/Delay: pure CSS, runs forever",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
                description:
                    "Pause after the last dot finishes, then all restart together",
                hidden: (props: { play: string }) => props.play !== "loopDelay",
            },
        },
    },
    emphasis: {
        type: ControlType.Object,
        title: "Emphasis",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["none", "pulse", "glow", "breathe"],
                optionTitles: ["None", "Pulse", "Glow", "Breathe"],
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                min: 0.05,
                max: 1,
                step: 0.05,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.25,
                max: 4,
                step: 0.05,
                description: "Higher = faster loop",
            },
            applyToLegendDot: {
                type: ControlType.Boolean,
                title: "On legend dot",
            },
        },
    },
    center: {
        type: ControlType.Object,
        title: "Center",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            counter: {
                type: ControlType.Enum,
                title: "Counter",
                options: ["none", "up", "down"],
                optionTitles: ["None", "Up", "Down"],
                displaySegmentedControl: true,
            },
            countFrom: {
                type: ControlType.Number,
                title: "Count from",
                min: 0,
                step: 1,
                displayStepper: true,
                description: "Count-down start (0 = largest item value)",
            },
            customValue: {
                type: ControlType.String,
                title: "Custom value",
                placeholder: "Auto (emphasized item)",
                description: "Overrides the center number",
            },
            matchEmphasisColor: {
                type: ControlType.Boolean,
                title: "Match color",
                description: "Use emphasized item's color for center text",
            },
            subtext: { type: ControlType.String, title: "Subtext" },
            subtextGap: {
                type: ControlType.Number,
                title: "Subtext gap",
                min: 0,
                max: 40,
                step: 1,
            },
        },
    },
    legend: {
        type: ControlType.Object,
        title: "Legend",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            placement: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["above", "below", "left", "right"],
                optionTitles: ["Above", "Below", "Left", "Right"],
            },
            ringGap: {
                type: ControlType.Number,
                title: "Ring gap",
                min: 0,
                max: 80,
                step: 1,
                description: "Space between ring and legend",
            },
            itemGap: {
                type: ControlType.Number,
                title: "Item gap",
                min: 0,
                max: 60,
                step: 1,
                description: "Space between legend labels",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["row", "column"],
                optionTitles: ["Row", "Column"],
                displaySegmentedControl: true,
            },
            alignment: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                displaySegmentedControl: true,
            },
            showValues: { type: ControlType.Boolean, title: "Values" },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            labelFont: {
                type: ControlType.Font,
                title: "Labels",
                controls: "extended",
            },
            centerFont: {
                type: ControlType.Font,
                title: "Center",
                controls: "extended",
            },
            subtextFont: {
                type: ControlType.Font,
                title: "Subtext",
                controls: "extended",
            },
            textColor: { type: ControlType.Color, title: "Text" },
            mutedColor: { type: ControlType.Color, title: "Muted" },
        },
    },
})
