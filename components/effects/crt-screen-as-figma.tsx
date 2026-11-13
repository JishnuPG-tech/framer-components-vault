import * as React from "react"
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
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
 * CRT Screen — drop-in overlay for any frame.
 *
 * Drop it inside a Frame / Section / Stack. It renders a 1×1 anchor that takes
 * no visible space and projects the CRT effect over the WHOLE parent frame,
 * regardless of the component's own size. No resizing needed.
 *
 * Curvature, dispersion and jitter warp the real content of the frame through
 * an SVG filter. Mask, scanlines, static, roll, flicker and vignette are
 * drawn as blended layers on top.
 *
 * Tip: in a Stack (auto layout) set the component's Position to "Absolute" so
 * the 1×1 anchor does not add a gap.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 * @framerDisableUnlink
 */
export default function CRTScreen(rawProps: Partial<Props>) {
    const props = withDefaults(rawProps)
    const {
        enabled,
        coverage,
        targetSelector,
        zIndex,
        animateOnCanvas,
        reducedMotion,
        power,
        powerDuration,
        mask,
        maskType,
        maskPitch,
        curvature,
        clipToCurve,
        scanlines,
        scanlineSize,
        aberration,
        aberrationScheme,
        flicker,
        noise,
        noiseSize,
        rollSpeed,
        jitter,
        vignette,
        brightness,
        speed,
        style,
    } = props

    const anchorRef = useRef<HTMLDivElement>(null)
    const [target, setTarget] = useState<HTMLElement | null>(null)
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [prefersReduced, setPrefersReduced] = useState(false)
    const [onscreen, setOnscreen] = useState(true)
    const reactId = React.useId()
    const fid = "crtfx" + reactId.replace(/[^a-zA-Z0-9]/g, "")

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()

    // ---- Find the element to cover ------------------------------------------
    useLayoutEffect(() => {
        const el = anchorRef.current
        if (!el) return

        if (coverage === "viewport") {
            setTarget(document.body)
            return
        }

        let found: HTMLElement | null = null

        if (targetSelector && targetSelector.trim()) {
            try {
                found = el.closest(targetSelector.trim()) as HTMLElement | null
            } catch (_) {
                found = null
            }
        }

        if (!found) {
            // Walk up past Framer's component wrapper(s) to the frame that
            // actually has a size. Wrappers are either "*-container" divs or
            // have exactly our own (tiny) size.
            const own = el.getBoundingClientRect()
            let node: HTMLElement | null = el.parentElement
            while (node && node !== document.body) {
                const cls =
                    typeof node.className === "string" ? node.className : ""
                const isFramerContainer = /-container(\s|$)/.test(cls)
                const r = node.getBoundingClientRect()
                const sameSize =
                    Math.abs(r.width - own.width) <= 1 &&
                    Math.abs(r.height - own.height) <= 1
                if (!isFramerContainer && !sameSize) {
                    found = node
                    break
                }
                node = node.parentElement
            }
        }

        if (found) {
            const prevInlinePosition = found.style.position
            const changedPosition =
                getComputedStyle(found).position === "static"
            if (changedPosition) found.style.position = "relative"
            setTarget(found)
            return () => {
                if (changedPosition) found.style.position = prevInlinePosition
            }
        } else {
            setTarget(null)
        }
    }, [coverage, targetSelector])

    // ---- Track the target size (the warp maps depend on it) -----------------
    useEffect(() => {
        if (!target) return
        const update = () => {
            const r = target.getBoundingClientRect()
            setSize((s) => {
                const w = Math.max(1, Math.round(r.width))
                const h = Math.max(1, Math.round(r.height))
                return s.w === w && s.h === h ? s : { w, h }
            })
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(target)
        return () => ro.disconnect()
    }, [target])

    // ---- Pause continuous work while the frame is offscreen ------------------
    // The observer only PAUSES animations (CSS animation-play-state + removing
    // the SMIL <animate> on the turbulence seed); every parameter and layer
    // stays mounted, so nothing changes visually when the frame is in view.
    useEffect(() => {
        if (!target || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) setOnscreen(entry.isIntersecting)
        })
        io.observe(target)
        return () => io.disconnect()
    }, [target])

    // ---- Reduced motion -----------------------------------------------------
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // ---- Power on/off transition --------------------------------------------
    const initialPower = useRef(power)
    const [powerAnim, setPowerAnim] = useState<"none" | "off" | "on">(
        power ? "none" : "off"
    )
    const prevPower = useRef(power)
    useEffect(() => {
        if (prevPower.current === power) return
        prevPower.current = power
        setPowerAnim(power ? "on" : "off")
    }, [power])

    // ---- Derived parameters (same normalisation as the shader) --------------
    const spd = Math.max(0, speed)
    // On the canvas useIsStaticRenderer() is true, so the "Canvas: Animate"
    // toggle must take precedence there; the static-renderer flag still
    // suppresses motion in exports/thumbnails.
    const motionAllowed =
        (isCanvas ? animateOnCanvas : !isStaticRenderer) &&
        !(reducedMotion && prefersReduced)
    const animate = spd > 0 && motionAllowed

    const curvature01 = clamp(curvature / 100, 0, 1)
    const jitter01 = clamp(jitter / 100, 0, 1)
    const mask01 = clamp(mask / 100, 0, 1)
    const noise01 = clamp(noise / 100, 0, 1)
    const flicker01 = clamp(flicker / 100, 0, 1)
    const vig01 = clamp(vignette / 100, 0, 1)
    const aberrPx = clamp(aberration / 100, 0, 1) * 12
    const gain = Math.pow(2, clamp(brightness, -1, 1))
    const scanSize = Math.max(1, scanlineSize)
    const scanAmt =
        clamp(scanlines / 100, 0, 1) *
        (0.6 + 0.4 * smoothstep(1.0, 2.5, scanSize))
    const pitch = clamp(maskPitch, 2, 12)
    const grain = Math.max(1, noiseSize)

    // ---- Warp maps for the SVG filter ---------------------------------------
    const barrel = useMemo(
        () =>
            enabled && size.w > 0 && curvature01 > 0
                ? makeBarrelMap(
                      size.w,
                      size.h,
                      curvature01,
                      clipToCurve,
                      jitter01
                  )
                : null,
        [enabled, size.w, size.h, curvature01, clipToCurve, jitter01]
    )
    const radial = useMemo(
        () =>
            enabled && size.w > 0 && aberrPx > 0 && aberrationScheme === 0
                ? makeRadialMap(size.w, size.h)
                : null,
        [enabled, size.w, size.h, aberrPx, aberrationScheme]
    )

    // The filter is always on: the shader always runs its highlight knee.
    const wantsFilter = enabled
    const toneTable = useMemo(() => makeToneTable(gain), [gain])
    const filterReady =
        wantsFilter &&
        (curvature01 <= 0 || !!barrel) &&
        (aberrPx <= 0 || aberrationScheme !== 0 || !!radial)

    // Apply / remove the filter on the covered element.
    useEffect(() => {
        if (!target || !filterReady) return
        const prevInlineFilter = target.style.filter
        const value = `url(#${fid})`
        target.style.filter = value
        return () => {
            if (target.style.filter === value)
                target.style.filter = prevInlineFilter
        }
    }, [target, filterReady, fid])

    if (!enabled) {
        return <div ref={anchorRef} style={anchorStyle(style)} />
    }

    // ---- Overlay layers --------------------------------------------------------
    const layers: React.ReactNode[] = []

    // Scanlines, exactly as the shader:
    //   scan = (1 - scanAmt * 0.5 * (1 - cos(2π·y / scanSize))) * scanNorm
    //   scanNorm = 1 / (1 - scanAmt * 0.5)   (keeps the mean brightness at 1)
    // Layer 1 multiplies by the cosine profile (≤ 1), layer 2 applies the
    // constant scanNorm gain through colour-dodge (b / (1 - s) = b · scanNorm).
    if (scanAmt > 0) {
        const P = scanSize
        const n = 16
        const stops: string[] = []
        for (let i = 0; i <= n; i++) {
            const v = 1 - scanAmt * 0.5 * (1 - Math.cos((2 * Math.PI * i) / n))
            const g = Math.round(v * 255)
            stops.push(`rgb(${g},${g},${g}) ${((i / n) * P).toFixed(3)}px`)
        }
        const drift = animate ? P / (6 * spd) : 0
        const dodge = Math.round(scanAmt * 0.5 * 255)
        layers.push(
            <div
                key="scan"
                style={{
                    ...layer,
                    backgroundImage: `repeating-linear-gradient(to bottom, ${stops.join(", ")})`,
                    backgroundSize: `100% ${P}px`,
                    mixBlendMode: "multiply",
                    ["--crt-period" as any]: `${-P}px`,
                    animation:
                        drift > 0
                            ? `crtfx-scan-v ${drift}s linear infinite`
                            : "none",
                }}
            />,
            <div
                key="scan-norm"
                style={{
                    ...layer,
                    background: `rgb(${dodge},${dodge},${dodge})`,
                    mixBlendMode: "color-dodge",
                }}
            />
        )
    }

    // Rolling refresh bar, exactly as the shader:
    //   p = fract(y + t · rollSpeed · 0.12)
    //   band = smoothstep(0, 0.06, p) · (1 - smoothstep(0.06, 0.22, p))
    //   col *= 1 + 0.35 · band
    // The band is a colour-dodge gradient (b / (1 - s) = b · (1 + 0.35 · band)),
    // drawn twice on a 200% tall track that scrolls up and wraps seamlessly.
    if (rollSpeed > 0.001) {
        const stops: string[] = []
        const n = 22
        for (let i = 0; i <= n; i++) {
            const p = (i / n) * 0.22
            const band =
                smoothstep(0, 0.06, p) * (1 - smoothstep(0.06, 0.22, p))
            const g = Math.round((1 - 1 / (1 + 0.35 * band)) * 255)
            stops.push(`rgb(${g},${g},${g}) ${((i / n) * 100).toFixed(2)}%`)
        }
        const bandStyle: React.CSSProperties = {
            position: "absolute",
            left: 0,
            right: 0,
            height: "11%", // 22% of one frame height on a 200% track
            background: `linear-gradient(to bottom, ${stops.join(", ")})`,
        }
        const cycle = animate ? 1 / (rollSpeed * 0.12 * spd) : 0
        layers.push(
            // The blend mode must sit on the outer layer: a positioned wrapper is
            // an isolated group, so a blend on the inner bands would never reach
            // the frame's content.
            <div
                key="roll"
                style={{
                    ...layer,
                    overflow: "hidden",
                    mixBlendMode: "color-dodge",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: "200%",
                        animation:
                            cycle > 0
                                ? `crtfx-roll-track ${cycle}s linear infinite`
                                : "none",
                    }}
                >
                    <div style={{ ...bandStyle, top: "0%" }} />
                    <div style={{ ...bandStyle, top: "50%" }} />
                </div>
            </div>
        )
    }

    // Phosphor mask.
    if (mask01 > 0) {
        // Soft RGB phosphor profile (continuous blend ≈ raised cosine).
        const sub = pitch / 3
        const grille = `repeating-linear-gradient(to right, rgb(255,0,0) 0px, rgb(0,255,0) ${sub}px, rgb(0,0,255) ${
            sub * 2
        }px, rgb(255,0,0) ${pitch}px)`
        const grilleOpacity = mask01 * (maskType === 2 ? 0.4 : 0.7)
        layers.push(
            <div
                key="grille"
                style={{
                    ...layer,
                    backgroundImage: grille,
                    backgroundSize: `${pitch}px 100%`,
                    opacity: grilleOpacity,
                    mixBlendMode: "overlay",
                }}
            />
        )
        if (maskType === 1) {
            // Slot mask: horizontal ties every two pitches.
            const period = pitch * 2
            const tie = Math.max(0.5, pitch * 0.35)
            layers.push(
                <div
                    key="slot"
                    style={{
                        ...layer,
                        backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,1) 0px, rgba(0,0,0,1) ${tie}px, rgba(0,0,0,0) ${tie}px, rgba(0,0,0,0) ${period}px)`,
                        backgroundSize: `100% ${period}px`,
                        opacity: mask01 * 0.6,
                        mixBlendMode: "multiply",
                    }}
                />
            )
        } else if (maskType === 2) {
            // Shadow mask: staggered dot grid.
            const rowH = pitch * 0.8660254
            const dot = `radial-gradient(circle at center, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${
                pitch * 0.3
            }px, rgba(0,0,0,1) ${pitch * 0.42}px)`
            layers.push(
                <div
                    key="shadow"
                    style={{
                        ...layer,
                        backgroundImage: `${dot}, ${dot}`,
                        backgroundSize: `${pitch}px ${rowH * 2}px, ${pitch}px ${rowH * 2}px`,
                        backgroundPosition: `0px 0px, ${pitch / 2}px ${rowH}px`,
                        opacity: mask01 * 0.7,
                        mixBlendMode: "multiply",
                    }}
                />
            )
        }
    }

    // Mains-hum flicker.
    if (flicker01 > 0 && animate) {
        layers.push(
            <div
                key="flicker"
                style={{
                    ...layer,
                    background: "#000",
                    ["--crt-flicker" as any]: String(flicker01 * 0.12),
                    animation: `crtfx-flicker ${1 / spd}s linear infinite`,
                }}
            />
        )
    }

    // Analog static.
    if (noise01 > 0) {
        const dur = animate ? 10 / (24 * spd) : 0
        layers.push(
            <div
                key="noise"
                style={{
                    ...layer,
                    backgroundImage: NOISE_URI,
                    backgroundSize: `${256 * grain}px ${256 * grain}px`,
                    opacity: noise01 * 0.45,
                    animation:
                        dur > 0
                            ? `crtfx-noise ${dur}s steps(1) infinite`
                            : "none",
                }}
            />
        )
    }

    // Vignette (one slider drives darkness and reach; reach widens with curvature).
    if (vig01 > 0) {
        layers.push(
            <div
                key="vignette"
                style={{
                    ...layer,
                    background: vignetteGradient(vig01, curvature01),
                }}
            />
        )
    }

    // Power off / on.
    if (powerAnim !== "none") {
        const d = Math.max(0.1, powerDuration)
        const off = powerAnim === "off"
        const canAnimate =
            motionAllowed && !(off && initialPower.current === false)
        layers.push(
            <div
                key="power"
                style={{
                    ...layer,
                    background: "#000",
                    opacity: off ? 1 : 0,
                    animation: canAnimate
                        ? `${off ? "crtfx-off-bg" : "crtfx-on-bg"} ${d}s ease-in-out forwards`
                        : "none",
                }}
                onAnimationEnd={(e) => {
                    if (e.target === e.currentTarget && !off)
                        setPowerAnim("none")
                }}
            >
                {canAnimate && (
                    <div
                        style={{
                            ...layer,
                            background:
                                "radial-gradient(ellipse at center, #ffffff 0%, #dfe9ff 60%, transparent 100%)",
                            transformOrigin: "50% 50%",
                            animation: `${
                                off ? "crtfx-off-line" : "crtfx-on-line"
                            } ${d}s ease-in-out forwards`,
                        }}
                    />
                )}
            </div>
        )
    }

    // Each layer is placed directly inside the covered frame. A wrapper div
    // would form an isolated group and the blend modes would stop seeing the
    // frame's content.
    // While the frame is offscreen every layer carries data-crt-paused, which
    // freezes its CSS animations (and those of nested children) in place.
    const overlay = (
        <>
            {layers.map((el) =>
                React.cloneElement(el as React.ReactElement, {
                    "data-crt-layer": "",
                    ...(onscreen ? {} : { "data-crt-paused": "" }),
                    style: {
                        ...(el as React.ReactElement).props.style,
                        position:
                            coverage === "viewport" ? "fixed" : "absolute",
                        zIndex,
                    },
                })
            )}
        </>
    )

    // ---- SVG filter: barrel warp → dispersion → jitter --------------------------
    let filterDef: React.ReactNode = null
    if (wantsFilter) {
        const prims: React.ReactNode[] = []
        let src = "SourceGraphic"

        if (curvature01 > 0 && barrel) {
            prims.push(
                <feImage
                    key="bmap"
                    href={barrel.uri}
                    preserveAspectRatio="none"
                    result="bmap"
                />,
                <feDisplacementMap
                    key="warp"
                    in={src}
                    in2="bmap"
                    scale={barrel.scale}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="warp"
                />
            )
            src = "warp"
        }

        if (aberrPx > 0) {
            prims.push(
                <feColorMatrix
                    key="r0"
                    in={src}
                    type="matrix"
                    values={KEEP_R}
                    result="r0"
                />,
                <feColorMatrix
                    key="g0"
                    in={src}
                    type="matrix"
                    values={KEEP_G}
                    result="g0"
                />,
                <feColorMatrix
                    key="b0"
                    in={src}
                    type="matrix"
                    values={KEEP_B}
                    result="b0"
                />
            )
            if (aberrationScheme === 0 && radial) {
                prims.push(
                    <feImage
                        key="rmap"
                        href={radial.uri}
                        preserveAspectRatio="none"
                        result="rmap"
                    />,
                    <feDisplacementMap
                        key="r1"
                        in="r0"
                        in2="rmap"
                        scale={2.4 * aberrPx}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="r1"
                    />,
                    <feDisplacementMap
                        key="b1"
                        in="b0"
                        in2="rmap"
                        scale={-2.4 * aberrPx}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="b1"
                    />
                )
            } else {
                const dx =
                    aberrationScheme === 2 ? 0.95 * aberrPx : 1.15 * aberrPx
                const dy = aberrationScheme === 2 ? -0.55 * aberrPx : 0
                prims.push(
                    <feOffset key="r1" in="r0" dx={dx} dy={dy} result="r1" />,
                    <feOffset key="b1" in="b0" dx={-dx} dy={-dy} result="b1" />
                )
            }
            prims.push(
                <feComposite
                    key="rg"
                    in="r1"
                    in2="g0"
                    operator="arithmetic"
                    k2={1}
                    k3={1}
                    result="rg"
                />,
                <feComposite
                    key="rgb"
                    in="rg"
                    in2="b1"
                    operator="arithmetic"
                    k2={1}
                    k3={1}
                    result="rgb"
                />
            )
            src = "rgb"
        }

        if (jitter01 > 0) {
            const frames = 24
            const dur = frames / (24 * spd || 1)
            prims.push(
                <feTurbulence
                    key="turb"
                    type="fractalNoise"
                    baseFrequency="0 0.9"
                    numOctaves={1}
                    seed={1}
                    result="turb"
                >
                    {animate && onscreen && (
                        <animate
                            attributeName="seed"
                            values={SEEDS}
                            dur={`${dur}s`}
                            calcMode="discrete"
                            repeatCount="indefinite"
                        />
                    )}
                </feTurbulence>,
                <feColorMatrix
                    key="jmap"
                    in="turb"
                    type="matrix"
                    values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1"
                    result="jmap"
                />,
                <feDisplacementMap
                    key="jit"
                    in={src}
                    in2="jmap"
                    scale={jitter01 * 16}
                    xChannelSelector="R"
                    yChannelSelector="G"
                    result="jit"
                />
            )
            src = "jit"
        }

        // Brightness gain followed by the soft highlight knee (kneeStart 0.8).
        prims.push(
            <feComponentTransfer key="tone" in={src} result="tone">
                <feFuncR type="table" tableValues={toneTable} />
                <feFuncG type="table" tableValues={toneTable} />
                <feFuncB type="table" tableValues={toneTable} />
            </feComponentTransfer>
        )

        filterDef = (
            <svg
                aria-hidden
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                }}
            >
                <defs>
                    <filter
                        id={fid}
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        {prims}
                    </filter>
                </defs>
            </svg>
        )
    }

    return (
        <div ref={anchorRef} style={anchorStyle(style)}>
            <style>{KEYFRAMES}</style>
            {filterDef}
            {target ? createPortal(overlay, target) : overlay}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Warp maps (8‑bit displacement textures fed to feDisplacementMap)
// ---------------------------------------------------------------------------

const MAP_N = 256

function normalisedAspect(w: number, h: number) {
    const ax = w / h
    const ay = 1
    const len = Math.sqrt(ax * ax + ay * ay) / Math.SQRT2
    return { x: ax / len, y: ay / len }
}

/** Barrel warp. Mirrors `barrel()` + fit logic of the shader. */
function makeBarrelMap(
    w: number,
    h: number,
    curvature: number,
    clip: boolean,
    jitter: number
): { uri: string; scale: number } | null {
    if (typeof document === "undefined") return null
    const a = normalisedAspect(w, h)
    const k = curvature * 0.35
    const edgeFit = { x: 1 / (1 + k * a.x * a.x), y: 1 / (1 + k * a.y * a.y) }
    const texel = { x: 1 / w, y: 1 / h }
    const reserve = {
        x: jitter * 3.9 * texel.x + 0.5 * texel.x,
        y: 0.5 * texel.y,
    }
    const avail = {
        x: Math.max(1 - 2 * reserve.x, 0.05),
        y: Math.max(1 - 2 * reserve.y, 0.05),
    }
    const rect = 1 / (1 + 0.7 * curvature)
    const sx = clip ? edgeFit.x / avail.x : rect
    const sy = clip ? edgeFit.y / avail.y : rect

    const off = new Float32Array(MAP_N * MAP_N * 2)
    let max = 0
    for (let j = 0; j < MAP_N; j++) {
        const v = (j + 0.5) / MAP_N
        for (let i = 0; i < MAP_N; i++) {
            const u = (i + 0.5) / MAP_N
            const cx = (u * 2 - 1) * a.x
            const cy = (v * 2 - 1) * a.y
            const r2 = cx * cx + cy * cy
            const f = 1 + k * r2
            const wx = ((cx * f * sx) / a.x) * 0.5 + 0.5
            const wy = ((cy * f * sy) / a.y) * 0.5 + 0.5
            const ox = (wx - u) * w
            const oy = (wy - v) * h
            const idx = (j * MAP_N + i) * 2
            off[idx] = ox
            off[idx + 1] = oy
            max = Math.max(max, Math.abs(ox), Math.abs(oy))
        }
    }
    const scale = Math.max(2 * max, 1)
    return { uri: encodeMap(off, scale), scale }
}

/** Pure radial direction map for the "Radial" dispersion scheme. */
function makeRadialMap(w: number, h: number): { uri: string } | null {
    if (typeof document === "undefined") return null
    const a = normalisedAspect(w, h)
    const off = new Float32Array(MAP_N * MAP_N * 2)
    for (let j = 0; j < MAP_N; j++) {
        const v = (j + 0.5) / MAP_N
        for (let i = 0; i < MAP_N; i++) {
            const u = (i + 0.5) / MAP_N
            const cx = (u * 2 - 1) * a.x
            const cy = (v * 2 - 1) * a.y
            const r = Math.sqrt(cx * cx + cy * cy)
            const dx = r > 0.0001 ? cx / r : 1
            const dy = r > 0.0001 ? cy / r : 0
            const level = clamp(r / Math.SQRT2, 0, 1)
            const m = 0.72 + 0.48 * level
            const idx = (j * MAP_N + i) * 2
            off[idx] = dx * m
            off[idx + 1] = dy * m
        }
    }
    // Encoded so that displacement = scale * (value - 0.5) with scale = 2.4 * px.
    return { uri: encodeMap(off, 2.4) }
}

function encodeMap(off: Float32Array, scale: number): string {
    const canvas = document.createElement("canvas")
    canvas.width = MAP_N
    canvas.height = MAP_N
    const ctx = canvas.getContext("2d")!
    const img = ctx.createImageData(MAP_N, MAP_N)
    const d = img.data
    for (let p = 0; p < MAP_N * MAP_N; p++) {
        const r = clamp(0.5 + off[p * 2] / scale, 0, 1)
        const g = clamp(0.5 + off[p * 2 + 1] / scale, 0, 1)
        d[p * 4] = Math.round(r * 255)
        d[p * 4 + 1] = Math.round(g * 255)
        d[p * 4 + 2] = 128
        d[p * 4 + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    return canvas.toDataURL("image/png")
}

// ---------------------------------------------------------------------------
// Styles & helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, v))
}

function smoothstep(e0: number, e1: number, x: number) {
    const t = clamp((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)
}

/**
 * Tone curve = gain then the shader's soft knee:
 *   y = x * gain
 *   if y > 0.8: y = 0.8 + 0.2 * (1 - exp(-(y - 0.8) / 0.2))
 * Sampled into a lookup table for feComponentTransfer (linear interpolation).
 */
function makeToneTable(gain: number): string {
    const N = 64
    const out: string[] = []
    for (let i = 0; i <= N; i++) {
        let y = (i / N) * gain
        if (y > 0.8) y = 0.8 + 0.2 * (1 - Math.exp(-(y - 0.8) / 0.2))
        out.push(clamp(y, 0, 1).toFixed(4))
    }
    return out.join(" ")
}

function vignetteGradient(v: number, curvature: number) {
    const strength = 3 * v * v * (0.35 + 0.65 * v)
    const spread = clamp(v * v * (0.6 + 0.4 * curvature), 0, 1)
    const inner = 1.4 * (1 - spread)
    const stops: string[] = ["rgba(0,0,0,0) 0%"]
    const steps = 10
    for (let i = 0; i <= steps; i++) {
        const r2 = inner + ((2 - inner) * i) / steps
        const dark = clamp(strength * smoothstep(inner, 2, r2), 0, 1)
        const pos = Math.sqrt(r2 / 2) * 100
        stops.push(`rgba(0,0,0,${dark.toFixed(3)}) ${pos.toFixed(2)}%`)
    }
    return `radial-gradient(ellipse farthest-corner at 50% 50%, ${stops.join(", ")})`
}

function anchorStyle(style?: React.CSSProperties): React.CSSProperties {
    return {
        ...style,
        pointerEvents: "none",
        overflow: "visible",
        position: style?.position ?? "relative",
    }
}

const layer: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
}

const KEEP_R = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
const KEEP_G = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
const KEEP_B = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1).join(";")

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='linear' slope='1.6' intercept='-0.3'/><feFuncG type='linear' slope='1.6' intercept='-0.3'/><feFuncB type='linear' slope='1.6' intercept='-0.3'/></feComponentTransfer></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
const NOISE_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`

const KEYFRAMES = `
[data-crt-paused], [data-crt-paused] * { animation-play-state: paused !important; }
@keyframes crtfx-scan-v { from { background-position: 0 0; } to { background-position: 0 var(--crt-period); } }
@keyframes crtfx-noise {
  0%   { background-position: 0 0; }
  10%  { background-position: -13% 7%; }
  20%  { background-position: 21% -9%; }
  30%  { background-position: -37% 23%; }
  40%  { background-position: 11% 41%; }
  50%  { background-position: -29% -17%; }
  60%  { background-position: 43% 3%; }
  70%  { background-position: -7% -31%; }
  80%  { background-position: 27% 19%; }
  90%  { background-position: -19% -43%; }
  100% { background-position: 0 0; }
}
@keyframes crtfx-flicker {
  0%   { opacity: calc(var(--crt-flicker) * 0.10); }
  8%   { opacity: calc(var(--crt-flicker) * 0.30); }
  14%  { opacity: calc(var(--crt-flicker) * 0.05); }
  22%  { opacity: calc(var(--crt-flicker) * 0.22); }
  31%  { opacity: calc(var(--crt-flicker) * 0.02); }
  40%  { opacity: calc(var(--crt-flicker) * 0.35); }
  47%  { opacity: calc(var(--crt-flicker) * 0.12); }
  55%  { opacity: calc(var(--crt-flicker) * 0.28); }
  63%  { opacity: calc(var(--crt-flicker) * 0.04); }
  72%  { opacity: calc(var(--crt-flicker) * 0.18); }
  80%  { opacity: calc(var(--crt-flicker) * 0.40); }
  88%  { opacity: calc(var(--crt-flicker) * 0.06); }
  100% { opacity: calc(var(--crt-flicker) * 0.10); }
}
@keyframes crtfx-roll-track { from { transform: translateY(0); } to { transform: translateY(-50%); } }
@keyframes crtfx-off-bg  { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 1; } }
@keyframes crtfx-off-line {
  0%   { transform: scale(1, 1);        opacity: 0; }
  10%  { transform: scale(1, 1);        opacity: 0.9; }
  50%  { transform: scale(1, 0.006);    opacity: 1; }
  80%  { transform: scale(0.03, 0.006); opacity: 1; }
  100% { transform: scale(0, 0.004);    opacity: 0; }
}
@keyframes crtfx-on-bg   { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
@keyframes crtfx-on-line {
  0%   { transform: scale(0, 0.004);    opacity: 0; }
  15%  { transform: scale(0.03, 0.006); opacity: 1; }
  45%  { transform: scale(1, 0.006);    opacity: 1; }
  70%  { transform: scale(1, 1);        opacity: 0.9; }
  100% { transform: scale(1, 1);        opacity: 0; }
}
`

// ---------------------------------------------------------------------------
// Types & defaults
// ---------------------------------------------------------------------------

interface Props {
    enabled: boolean
    coverage: "parent" | "viewport"
    targetSelector: string
    zIndex: number
    animateOnCanvas: boolean
    reducedMotion: boolean
    power: boolean
    powerDuration: number

    mask: number
    maskType: number // 0 grille, 1 slot, 2 shadow
    maskPitch: number
    curvature: number
    clipToCurve: boolean
    scanlines: number
    scanlineSize: number
    aberration: number
    aberrationScheme: number // 0 radial, 1 horizontal, 2 convergence
    flicker: number
    noise: number
    noiseSize: number
    rollSpeed: number
    jitter: number
    vignette: number
    brightness: number
    speed: number

    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    enabled: true,
    coverage: "parent",
    targetSelector: "",
    zIndex: 1000,
    animateOnCanvas: false,
    reducedMotion: true,
    power: true,
    powerDuration: 0.8,

    mask: 30,
    maskType: 0,
    maskPitch: 12,
    curvature: 100,
    clipToCurve: true,
    scanlines: 20,
    scanlineSize: 8,
    aberration: 47,
    aberrationScheme: 0,
    flicker: 62,
    noise: 20,
    noiseSize: 1,
    rollSpeed: 5,
    jitter: 3,
    vignette: 80,
    brightness: 0,
    speed: 0.78,
}

/** Fill in anything Framer did not pass. */
function withDefaults(p: Partial<Props>): Props {
    const out: any = { ...DEFAULTS }
    for (const k of Object.keys(p) as (keyof Props)[]) {
        if (p[k] !== undefined) out[k] = p[k]
    }
    return out as Props
}

// ---------------------------------------------------------------------------
// Property controls (mirrors the Figma shader's property list)
// ---------------------------------------------------------------------------

const pct = (title: string, defaultValue: number, extra: object = {}) =>
    ({
        type: ControlType.Number,
        title,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue,
        ...extra,
    }) as const

addPropertyControls(CRTScreen, {
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
    },
    coverage: {
        type: ControlType.Enum,
        title: "Cover",
        options: ["parent", "viewport"],
        optionTitles: ["Parent frame", "Whole page"],
        defaultValue: "parent",
        displaySegmentedControl: true,
    },
    targetSelector: {
        type: ControlType.String,
        title: "Target",
        placeholder: "Optional CSS selector",
        defaultValue: "",
        description:
            "Leave empty to cover the frame this component sits in, or enter a CSS selector (e.g. `.hero`) of an ancestor to cover instead.",
        hidden: (p: Props) => p.coverage === "viewport",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-index",
        min: -1,
        max: 10000,
        step: 1,
        defaultValue: 1000,
        displayStepper: true,
    },

    mask: pct("Mask", 30),
    maskType: {
        type: ControlType.Enum,
        title: "Mask type",
        options: [0, 1, 2],
        optionTitles: ["Aperture grille", "Slot", "Shadow"],
        defaultValue: 0,
    },
    maskPitch: {
        type: ControlType.Number,
        title: "Mask size",
        min: 2,
        max: 12,
        step: 0.5,
        unit: "px",
        defaultValue: 12,
    },
    curvature: pct("Curvature", 100),
    clipToCurve: {
        type: ControlType.Boolean,
        title: "Clip to curve",
        defaultValue: true,
    },
    scanlines: pct("Scanlines", 20),
    scanlineSize: {
        type: ControlType.Number,
        title: "Scanline size",
        min: 1,
        max: 32,
        step: 0.5,
        defaultValue: 8,
    },
    aberration: pct("Dispersion", 47),
    aberrationScheme: {
        type: ControlType.Enum,
        title: "Dispersion type",
        options: [0, 1, 2],
        optionTitles: ["Radial", "Horizontal", "Convergence"],
        defaultValue: 0,
    },
    flicker: pct("Flicker", 62),
    noise: pct("Static", 20),
    noiseSize: {
        type: ControlType.Number,
        title: "Static size",
        min: 1,
        max: 8,
        step: 0.5,
        defaultValue: 1,
    },
    rollSpeed: {
        type: ControlType.Number,
        title: "Roll speed",
        min: 0,
        max: 5,
        step: 0.01,
        defaultValue: 5,
    },
    jitter: pct("Jitter", 3),
    vignette: pct("Vignette", 80),
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: -1,
        max: 1,
        step: 0.01,
        defaultValue: 0,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.01,
        defaultValue: 0.78,
    },

    power: {
        type: ControlType.Boolean,
        title: "Power",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "Toggle (or wire to a variable) to play the CRT switch-off / switch-on animation.",
    },
    powerDuration: {
        type: ControlType.Number,
        title: "Power time",
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 0.8,
    },
    animateOnCanvas: {
        type: ControlType.Boolean,
        title: "Canvas",
        enabledTitle: "Animate",
        disabledTitle: "Static",
        defaultValue: false,
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced motion",
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        defaultValue: true,
    },
})
