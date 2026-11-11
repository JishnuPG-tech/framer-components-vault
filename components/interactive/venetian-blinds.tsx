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
    animate,
    MotionValue,
} from "framer-motion"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"

// ─── Materials ───────────────────────────────────────────────────────────────

const MATERIALS: Record<
    string,
    { slat: string; rail: string; tape: string; grain: boolean }
> = {
    walnut: { slat: "#6F4628", rail: "#5D3A21", tape: "#4B2F1B", grain: true },
    oak: { slat: "#B48D60", rail: "#A27E54", tape: "#8A6A45", grain: true },
    white: { slat: "#F1EEE8", rail: "#EAE6DE", tape: "#DDD6C9", grain: false },
    black: { slat: "#2B2927", rail: "#242220", tape: "#1D1C1A", grain: false },
}

// ─── Geometry ────────────────────────────────────────────────────────────────
// Slats are drawn flat. Their visible height is the projection of a real slat
// at its tilt angle, so there is no CSS 3D anywhere: nothing can flip, and it
// looks the same in every browser and on the canvas.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (v: number) => v * v * (3 - 2 * v)

type Geo = {
    bottomH: number
    usable: number
    pitch: number
    depth: number
    thick: number
    raisedB: number
    B: number
}

// A: height of the slat area (below the headrail). lift: 0 down, 1 raised.
function geo(A: number, n: number, lift: number): Geo {
    const bottomH = clamp(A * 0.035, 10, 18)
    const usable = Math.max(40, A - bottomH)
    const pitch = usable / n
    const depth = pitch * 1.14 // wider than the spacing, so closed slats overlap
    const thick = clamp(pitch * 0.14, 2, 4)
    const raisedB = n * thick + 2
    const B = usable + (raisedB - usable) * clamp01(lift)
    return { bottomH, usable, pitch, depth, thick, raisedB, B }
}

// Slats hang at their natural spacing until the rising bottom rail reaches
// them, then they pile up on it.
function slatCenter(i: number, n: number, g: Geo) {
    const natural = i * g.pitch + g.pitch / 2
    const stacked = g.B - (n - i - 0.5) * g.thick
    return Math.min(natural, stacked)
}

function stackAmount(i: number, n: number, g: Geo) {
    const natural = i * g.pitch + g.pitch / 2
    return smooth(
        clamp01(
            (natural - slatCenter(i, n, g)) / Math.max(1, g.pitch - g.thick)
        )
    )
}

// t: 0 closed, 1 open. Closed slats hang nearly vertical, open ones edge-on.
function tiltAngle(t: number) {
    return ((6 + 82 * clamp01(t)) * Math.PI) / 180
}

function projected(t: number, g: Geo) {
    return Math.max(g.thick, g.depth * Math.cos(tiltAngle(t)))
}

// Top of the solid stack under the headrail when the blind is raised
function stackTop(n: number, g: Geo) {
    const crossing =
        (g.B - (n - 0.5) * g.thick - 0.5 * g.pitch) /
        Math.max(0.001, g.pitch - g.thick)
    const hanging = clamp(crossing + 0.5, 0, n)
    return g.B - (n - hanging) * g.thick
}

// ─── Measurements ────────────────────────────────────────────────────────────

function formatLength(px: number, cmPerPx: number, unit: string) {
    const cm = px * cmPerPx
    if (unit === "mm")
        return `${Math.round(cm * 10)
            .toLocaleString("en-US")
            .replace(/,/g, " ")} mm`
    if (unit === "in") return `${Math.round((cm / 2.54) * 4) / 4}″`
    return `${Math.round(cm)} cm`
}

function Dimension({
    axis,
    length,
    across,
    flip,
    label,
    color,
    offset,
    font,
}: any) {
    const isX = axis === "x"
    const tick = (end: boolean) => (
        <div
            style={{
                position: "absolute",
                width: 9,
                height: 1.25,
                background: color,
                transform: "translate(-50%, -50%) rotate(-45deg)",
                ...(isX
                    ? { top: "50%", left: end ? "100%" : 0 }
                    : { left: "50%", top: end ? "100%" : 0 }),
            }}
        />
    )
    const ext = offset - 4
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                pointerEvents: "none",
                ...(isX
                    ? {
                          left: 0,
                          top: flip ? across + offset : -offset,
                          width: length,
                          height: 0,
                      }
                    : {
                          top: 0,
                          left: flip ? across + offset : -offset,
                          width: 0,
                          height: length,
                      }),
            }}
        >
            {[0, 1].map((k) => (
                <div
                    key={k}
                    style={{
                        position: "absolute",
                        background: color,
                        opacity: 0.45,
                        ...(isX
                            ? {
                                  left: k ? "100%" : 0,
                                  width: 1,
                                  height: ext + 5,
                                  top: flip ? -ext : -5,
                              }
                            : {
                                  top: k ? "100%" : 0,
                                  height: 1,
                                  width: ext + 5,
                                  left: flip ? -ext : -5,
                              }),
                        transform: isX
                            ? "translateX(-0.5px)"
                            : "translateY(-0.5px)",
                    }}
                />
            ))}
            <div
                style={{
                    position: "absolute",
                    background: color,
                    ...(isX
                        ? { left: 0, right: 0, top: -0.5, height: 1 }
                        : { top: 0, bottom: 0, left: -0.5, width: 1 }),
                }}
            />
            <div
                style={{
                    position: "absolute",
                    ...(isX
                        ? { left: 0, right: 0, top: 0, height: 0 }
                        : { top: 0, bottom: 0, left: 0, width: 0 }),
                }}
            >
                {tick(false)}
                {tick(true)}
            </div>
            <div
                style={{
                    position: "absolute",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    ...font,
                    color,
                    ...(isX
                        ? {
                              left: "50%",
                              transform: "translateX(-50%)",
                              ...(flip ? { top: 6 } : { bottom: 6 }),
                          }
                        : {
                              top: "50%",
                              writingMode: "vertical-rl" as any,
                              transform: "translateY(-50%) rotate(180deg)",
                              ...(flip ? { left: 6 } : { right: 6 }),
                          }),
                }}
            >
                {label}
            </div>
        </div>
    )
}

// ─── One slat ────────────────────────────────────────────────────────────────

function Slat({
    index,
    count,
    tilt,
    liftS,
    areaH,
    color,
    grain,
    light,
    lightStrength,
    speed,
}: {
    index: number
    count: number
    tilt: MotionValue<number>
    liftS: MotionValue<number>
    areaH: MotionValue<number>
    color: string
    grain: boolean
    light: string
    lightStrength: number
    speed: number
}) {
    // Top slats respond first, so a tilt ripples down the blind.
    // Critically damped: it never overshoots past fully open or closed.
    const stiffness = (170 - (index / count) * 90) * speed
    const s = useSpring(tilt, {
        stiffness,
        damping: 2 * Math.sqrt(stiffness),
        restDelta: 0.0005,
    })

    const depth = useTransform(areaH, (A) => geo(A, count, 0).depth)
    const y = useTransform([s, liftS, areaH] as any, ([t, l, A]: any) => {
        const g = geo(A, count, l)
        return slatCenter(index, count, g) - g.depth / 2
    })
    const scaleY = useTransform([s, liftS, areaH] as any, ([t, l, A]: any) => {
        const g = geo(A, count, l)
        const st = stackAmount(index, count, g)
        const h = projected(t, g) + (g.thick - projected(t, g)) * st
        return h / g.depth
    })
    // Daylight on the top surface as the slat turns towards edge-on
    const lit = useTransform(
        s,
        (t) => Math.sin(tiltAngle(t)) * 0.32 * lightStrength
    )

    // Each slat is cut from a different piece of wood: own tone and grain offset
    const hash = (n: number) => {
        const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453
        return x - Math.floor(x)
    }
    const tone = hash(index) - 0.5
    const gx = Math.round(hash(index + 101) * 240)
    const gy = Math.round(hash(index + 211) * 9)

    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: depth,
                y,
                scaleY,
                transformOrigin: "50% 50%",
                // Upper slats lie over the lower ones like shingles, and the
                // shadow under each edge marks the seam on a closed blind
                zIndex: count - index,
                boxShadow:
                    "0 1px 0 rgba(0,0,0,0.32), 0 2px 3px rgba(0,0,0,0.16)",
                backgroundColor: color,
                backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.16) 90%, rgba(0,0,0,0.34) 100%)",
                willChange: "transform",
            }}
        >
            {grain && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: tone > 0 ? "#FFF3E0" : "#1E1006",
                            opacity: Math.abs(tone) * 0.2,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                                "repeating-linear-gradient(178.8deg, rgba(40,20,6,0) 0px, rgba(40,20,6,0) 2.6px, rgba(40,20,6,0.2) 3.1px, rgba(40,20,6,0) 4.4px)," +
                                "repeating-linear-gradient(181deg, rgba(255,226,190,0) 0px, rgba(255,226,190,0) 5.5px, rgba(255,226,190,0.12) 6.2px, rgba(255,226,190,0) 7.4px)," +
                                "repeating-linear-gradient(90deg, rgba(40,20,6,0) 0px, rgba(40,20,6,0.07) 60px, rgba(40,20,6,0) 140px)",
                            backgroundPosition: `${gx}px ${gy}px, ${gx * 0.7}px ${gy + 2}px, ${gx * 1.6}px 0px`,
                        }}
                    />
                </>
            )}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: light,
                    opacity: lit,
                }}
            />
        </motion.div>
    )
}

// One band of the light cast outside: the shadow of one slat
function CastBand({
    index,
    count,
    tilt,
    liftS,
    areaH,
    color,
}: {
    index: number
    count: number
    tilt: MotionValue<number>
    liftS: MotionValue<number>
    areaH: MotionValue<number>
    color: string
}) {
    const band = (t: number, l: number, A: number) => {
        const g = geo(A, count, l)
        const st = stackAmount(index, count, g)
        const h = projected(t, g) + (g.thick - projected(t, g)) * st
        return { top: (slatCenter(index, count, g) - h / 2) / A, h: h / A }
    }
    const y = useTransform(
        [tilt, liftS, areaH] as any,
        ([t, l, A]: any) => `${band(t, l, A).top * 100}%`
    )
    const scaleY = useTransform(
        [tilt, liftS, areaH] as any,
        ([t, l, A]: any) => band(t, l, A).h
    )
    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: "100%",
                y,
                scaleY,
                transformOrigin: "50% 0%",
                background: color,
            }}
        />
    )
}

// ─── Rain on the glass ───────────────────────────────────────────────────────
// Kept quiet on purpose. A drop is not an object on top of the view: it is a
// small soft patch where the view is seen flipped and shrunk through water,
// with a faint dark edge on top and a hint of light at the bottom. Fine mist
// inverts what is behind it (light specks on dark areas, dark on light), the
// way tiny droplets look in photos of a wet window.

const rnd = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
}

function Drop({ x, y, r, w, h, src, backdrop, seed = 0 }: any) {
    // Water on a vertical pane is flattened and heavier at the bottom, and no
    // two drops share the same outline
    const a = 44 + rnd(seed + 1) * 12
    const b = 44 + rnd(seed + 2) * 12
    const c = 46 + rnd(seed + 3) * 8
    const d = 46 + rnd(seed + 4) * 8
    const dw = r * 2 * (1 + rnd(seed + 5) * 0.3)
    const dh = r * 1.8
    return (
        <div
            style={{
                position: "absolute",
                left: x - dw / 2,
                top: y - r,
                width: dw,
                height: dh,
                borderRadius: `${a}% ${100 - a}% ${b}% ${100 - b}% / ${c}% ${c}% ${100 - d}% ${100 - d}%`,
                overflow: "hidden",
            }}
        >
            {/* The view through the drop: flipped, shrunk, slightly soft */}
            <div
                style={{
                    position: "absolute",
                    left: -(x - dw / 2),
                    top: -(y - r),
                    width: w,
                    height: h,
                    background: src
                        ? `url("${src}") center / cover no-repeat`
                        : backdrop,
                    transform: "rotate(180deg) scale(0.32)",
                    transformOrigin: `${x}px ${y}px`,
                    filter: "blur(0.5px) brightness(1.12)",
                }}
            />
            {/* Faint dark edge on top, a little light pooled at the bottom */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 38%)," +
                        "radial-gradient(ellipse 46% 22% at 50% 90%, rgba(255,255,255,0.22), rgba(255,255,255,0) 100%)," +
                        "radial-gradient(ellipse 52% 52% at 50% 52%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.16) 100%)",
                }}
            />
        </div>
    )
}

function Rain({
    w,
    h,
    src,
    backdrop,
    intensity,
    amount,
    size,
    sliding,
    mist,
    speed,
    live,
}: any) {
    const area = w * h
    const n = Math.round((area / 11000) * (amount / 50))
    const base = Math.max(1.5, size)

    // Fine mist, drawn once as a single SVG image
    const m = Math.round((area / 260) * mist)
    let dots = ""
    for (let i = 0; i < m; i++) {
        const cx = rnd(i + 1) * w
        const cy = rnd(i + 7001) * h
        const cr = 0.3 + Math.pow(rnd(i + 3001), 3) * 1.4
        dots += `<ellipse cx='${cx.toFixed(1)}' cy='${cy.toFixed(1)}' rx='${(cr * 1.1).toFixed(2)}' ry='${cr.toFixed(2)}'/>`
    }
    const mistImg = `url("data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><g fill='white'>${dots}</g></svg>`
    )}")`

    // Mostly small drops, the odd bigger one
    const drops = Array.from({ length: n }, (_, i) => ({
        x: rnd(i + 11) * w,
        y: rnd(i + 23) * h,
        r: base * (0.35 + Math.pow(rnd(i + 37), 2.6) * 1.4),
        seed: i * 7,
    }))

    const sliders = Array.from({ length: Math.round(sliding) }, (_, i) => {
        const r = base * (0.8 + rnd(i + 401) * 0.4)
        const x = 0.06 * w + rnd(i + 409) * 0.88 * w
        // Stop-and-go: short slides, pauses, then a long run down the glass
        const y0 = -r * 3
        const y1 = h + r * 3
        const span = y1 - y0
        const ys = [
            y0,
            y0 + span * 0.12,
            y0 + span * 0.12,
            y0 + span * 0.27,
            y0 + span * 0.3,
            y0 + span * 0.3,
            y0 + span * 0.62,
            y0 + span * 0.66,
            y1,
        ]
        const times = [0, 0.1, 0.24, 0.3, 0.36, 0.5, 0.62, 0.7, 1]
        const duration = (8 + rnd(i + 419) * 7) / Math.max(0.2, speed)
        const delay = 0.3 + rnd(i + 431) * 2.4
        const rest = 1 + rnd(i + 437) * 6
        return {
            r,
            x,
            ys,
            times,
            duration,
            delay,
            rest,
            still: y0 + span * (0.2 + rnd(i + 443) * 0.6),
        }
    })

    return (
        // No opacity on this wrapper: it would isolate the mist's blend mode and
        // turn every speck white. Strength is applied per layer instead.
        <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
            {/* Mist inverts what is behind it, very lightly */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: mistImg,
                    backgroundSize: `${w}px ${h}px`,
                    mixBlendMode: "difference",
                    opacity: 0.32 * intensity,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: Math.min(1, intensity * 1.25),
                }}
            >
                {drops.map((d, i) => (
                    <Drop
                        key={i}
                        {...d}
                        w={w}
                        h={h}
                        src={src}
                        backdrop={backdrop}
                    />
                ))}
            </div>
            {sliders.map((s, i) => (
                <motion.div
                    key={`s${i}`}
                    initial={false}
                    animate={live ? { y: s.ys } : { y: s.still }}
                    transition={
                        live
                            ? {
                                  duration: s.duration,
                                  times: s.times,
                                  ease: "easeIn",
                                  repeat: Infinity,
                                  repeatDelay: s.rest,
                                  delay: s.delay,
                              }
                            : { duration: 0 }
                    }
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: w,
                        height: 0,
                        opacity: Math.min(1, intensity * 1.25),
                    }}
                >
                    {/* Trail: a fine line of tiny droplets left on the glass */}
                    <div
                        style={{
                            position: "absolute",
                            left: s.x - 2,
                            top: -h * 0.3,
                            width: 4,
                            height: h * 0.3,
                            // Each trail droplet: dark edge, light core, readable on any view
                            backgroundImage:
                                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0.5px, rgba(0,0,0,0.35) 0.9px, transparent 1.3px)",
                            backgroundSize: "4px 9px",
                            opacity: 0.45,
                            WebkitMaskImage:
                                "linear-gradient(180deg, transparent, #000 85%)",
                            maskImage:
                                "linear-gradient(180deg, transparent, #000 85%)",
                        }}
                    />
                    <Drop
                        x={s.x}
                        y={0}
                        r={s.r}
                        w={w}
                        h={h}
                        src={src}
                        backdrop={backdrop}
                        seed={900 + i * 7}
                    />
                </motion.div>
            ))}
        </div>
    )
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VenetianBlinds(props: any) {
    const {
        style,
        image,
        startTilt,
        startRaised,
        trigger,
        action,
        direction,
        sectionId,
        scrollStart,
        scrollDistance,
        replay,
        slats,
        scale,
        wandSide,
        liftStyle,
        material,
        colors,
        tapes,
        frame: frameRaw,
        light,
        cast: castRaw,
        backdrop,
        radius,
        measure: measureRaw,
        showFrame,
        showCast,
        showMeasure,
        showRain,
        rain,
        speed,
        sound,
    } = props

    // Each extra has a plain Show/Hide toggle; when hidden it is fully removed
    const frame =
        (showFrame ?? true)
            ? (frameRaw ?? { color: "#242220", width: 12 })
            : null
    const cast = (showCast ?? true) ? (castRaw ?? CAST_DEFAULT) : null
    const measure =
        (showMeasure ?? true) ? (measureRaw ?? MEASURE_DEFAULT) : null

    const isOnCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const live = !isOnCanvas && !isStatic
    const rootRef = useRef<HTMLDivElement>(null)
    const areaRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<AudioContext | null>(null)

    // Materials
    const mat =
        material === "custom"
            ? {
                  slat: colors?.slat ?? "#6F4628",
                  rail: colors?.rail ?? "#5D3A21",
                  tape: colors?.tape ?? "#4B2F1B",
                  grain: colors?.grain ?? true,
              }
            : MATERIALS[material] || MATERIALS.walnut
    const lightColor = light ?? "#FFE6B8"
    const lightStrength = 0.8
    const spd = speed ?? 1
    const cmPerPx = scale ?? 0.12

    // Size of the whole component (layout px, so canvas zoom never matters)
    const [size, setSize] = useState({ w: 480, h: 560 })
    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const update = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Measurements placed inside reserve room in the component
    const mInside = !!measure && (measure.placement ?? "inside") === "inside"
    const mFont = parseFloat(String(measure?.font?.fontSize ?? 12)) || 12
    const mPad = mInside ? (measure?.offset ?? 28) + mFont + 8 : 0
    const padT = measure?.widthAt === "bottom" ? 0 : mPad
    const padB = measure?.widthAt === "bottom" ? mPad : 0
    const padL = measure?.heightAt === "right" ? 0 : mPad
    const padR = measure?.heightAt === "right" ? mPad : 0
    const boxW = Math.max(0, size.w - padL - padR)
    const boxH = Math.max(0, size.h - padT - padB)

    const frameW = frame ? Math.max(0, frame.width ?? 12) : 0
    const paneW = Math.max(0, boxW - frameW * 2)
    const paneH = Math.max(0, boxH - frameW * 2)
    const railH = clamp(paneH * 0.04, 14, 28)

    // Slat count: from the real size (50 mm slats on a 45 mm pitch) unless set
    const autoCount = Math.round((paneH * cmPerPx * 10) / 45)
    const count = clamp(
        slats && slats > 0 ? Math.round(slats) : autoCount,
        4,
        80
    )

    // Ladder tapes about every 60 cm, between 12% and 88% of the width
    const tapeCount = Math.max(2, Math.round((paneW * cmPerPx) / 60))
    const tapeX = Array.from({ length: tapeCount }, (_, k) =>
        tapeCount === 1 ? 50 : 12 + (76 * k) / (tapeCount - 1)
    )
    const tapeW = tapes === "cord" ? 2 : clamp(3.8 / cmPerPx, 6, 22)

    // States. Tilt: 0 closed, 1 open. Lift: 0 down, 1 raised.
    const baseTilt = startTilt === "open" ? 1 : startTilt === "closed" ? 0 : 0.5
    const baseRaise = clamp01((startRaised ?? 0) / 100)
    const closing = trigger !== "manual" && direction === "close"
    const liftAction = action === "lift"
    const tiltFrom = closing && !liftAction && baseTilt === 0 ? 1 : baseTilt
    const tiltTo = closing ? 0 : 1
    const raiseFrom = closing && liftAction && baseRaise === 0 ? 1 : baseRaise
    const raiseTo = closing ? 0 : 1
    const initialTilt =
        isOnCanvas && tiltFrom === 0 && raiseFrom === 0 ? 0.5 : tiltFrom

    const tilt = useMotionValue(initialTilt)
    const lift = useMotionValue(raiseFrom)
    const tiltS = useSpring(tilt, {
        stiffness: 140 * spd,
        damping: 2 * Math.sqrt(140 * spd),
    })
    const liftS = useSpring(lift, {
        stiffness: 70 * spd,
        damping: 2 * Math.sqrt(70 * spd),
        mass: 1,
    })

    useEffect(() => {
        tilt.set(initialTilt)
    }, [initialTilt])
    useEffect(() => {
        lift.set(raiseFrom)
    }, [raiseFrom])

    // Slat area height
    const areaH = useMotionValue(Math.max(40, paneH - railH))
    useEffect(() => {
        areaH.set(Math.max(40, paneH - railH))
    }, [paneH, railH])

    // Everything that follows the lift moves with transforms only
    const railY = useTransform(
        [liftS, areaH] as any,
        ([l, A]: any) => geo(A, count, l).B
    )
    const tapeScale = useTransform(
        [liftS, areaH] as any,
        ([l, A]: any) => (geo(A, count, l).B + 3) / A
    )
    const stackClip = useTransform([liftS, areaH] as any, ([l, A]: any) => {
        const g = geo(A, count, l)
        const top = stackTop(count, g)
        if (top >= g.B - 0.5) return "inset(100% 0px 0px 0px)"
        return `inset(${Math.max(0, top)}px 0px ${Math.max(0, A - g.B)}px 0px)`
    })
    const stackPattern = useTransform(areaH, (A) => {
        const t = geo(A, count, 0).thick
        return `repeating-linear-gradient(180deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) ${t - 1}px, rgba(0,0,0,0.3) ${t - 1}px, rgba(0,0,0,0.3) ${t}px)`
    })
    const stackOffset = useTransform([liftS, areaH] as any, ([l, A]: any) => {
        const g = geo(A, count, l)
        return `0px ${g.B % g.thick}px`
    })
    const bottomH = useTransform(areaH, (A) => geo(A, count, 0).bottomH)

    // Cast outside
    const castOpacity = useTransform(
        [tiltS, liftS] as any,
        ([t, l]: any) =>
            (0.12 + 0.88 * Math.max(t, l)) * (cast?.strength ?? 0.8)
    )
    const castRailY = useTransform(
        [liftS, areaH] as any,
        ([l, A]: any) => `${(geo(A, count, l).B / A) * 100}%`
    )
    const castRailScale = useTransform(
        areaH,
        (A) => geo(A, count, 0).bottomH / A
    )
    const castTapeScale = useTransform(
        [liftS, areaH] as any,
        ([l, A]: any) => geo(A, count, l).B / A
    )

    // ─── Sound ───
    const rattle = useCallback(
        (long = false) => {
            if (!sound || !live || typeof window === "undefined") return
            try {
                const AC =
                    window.AudioContext || (window as any).webkitAudioContext
                if (!AC) return
                if (!audioRef.current) audioRef.current = new AC()
                const ctx = audioRef.current
                if (ctx.state === "suspended") ctx.resume()
                const now = ctx.currentTime
                const len = Math.floor(ctx.sampleRate * 0.014)
                const buf = ctx.createBuffer(1, len, ctx.sampleRate)
                const data = buf.getChannelData(0)
                for (let i = 0; i < len; i++)
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
                const ticks = long ? 20 : 10
                const gap = long ? 0.034 : 0.022
                for (let k = 0; k < ticks; k++) {
                    const src = ctx.createBufferSource()
                    src.buffer = buf
                    const bp = ctx.createBiquadFilter()
                    bp.type = "bandpass"
                    // Wood knocks lower than aluminium rattles
                    bp.frequency.value =
                        (mat.grain ? 1500 : 2800) + Math.random() * 1400
                    bp.Q.value = 4
                    const g = ctx.createGain()
                    g.gain.value = 0.18 * (1 - k / (ticks + 2))
                    src.connect(bp)
                    bp.connect(g)
                    g.connect(ctx.destination)
                    src.start(now + k * gap + Math.random() * 0.008)
                }
            } catch (e) {
                // Sound is a nice-to-have, never break the component over it
            }
        },
        [sound, live, mat.grain]
    )
    useEffect(
        () => () => {
            audioRef.current?.close().catch(() => {})
            audioRef.current = null
        },
        []
    )

    // ─── Direct manipulation: drag the bottom rail, twist the wand ───
    const drag = useRef<any>(null)
    const screenScale = () => {
        const el = areaRef.current
        if (!el) return 1
        const r = el.getBoundingClientRect().height
        return r > 0 ? el.offsetHeight / r : 1
    }
    const pullY = useMotionValue(0)
    const onDown =
        (kind: "lift" | "cord" | "tilt") => (e: React.PointerEvent) => {
            if (!live) return
            e.preventDefault()
            try {
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch (err) {}
            drag.current = {
                kind,
                x: e.clientX,
                y: e.clientY,
                start: kind === "tilt" ? tilt.get() : lift.get(),
                moved: false,
                k: screenScale(),
            }
        }
    const onMove = (e: React.PointerEvent) => {
        const d = drag.current
        if (!d) return
        const dx = (e.clientX - d.x) * d.k
        const dy = (e.clientY - d.y) * d.k
        if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return
        d.moved = true
        if (d.kind === "lift") {
            // The rail follows the pointer 1:1
            const g = geo(areaH.get(), count, 0)
            const travel = Math.max(1, g.usable - g.raisedB)
            const v = clamp01(d.start - dy / travel)
            lift.set(v)
            liftS.jump(v)
        } else if (d.kind === "cord") {
            // Pulling the cord down raises a lowered blind and lowers a raised
            // one, like a real cord lock. Only the downward pull counts.
            const g = geo(areaH.get(), count, 0)
            const range = Math.max(100, (g.usable - g.raisedB) * 0.45)
            const pull = clamp(dy, 0, range)
            pullY.set(pull)
            const dir = d.start < 0.5 ? 1 : -1
            lift.set(clamp01(d.start + (dir * pull) / range))
        } else {
            const v = Math.abs(dx) > Math.abs(dy) ? dx : dy
            tilt.set(clamp01(d.start + v / 90))
        }
    }
    const onUp = () => {
        const d = drag.current
        drag.current = null
        if (!d) return
        if (d.kind === "cord") {
            animate(pullY, 0, { type: "spring", stiffness: 300, damping: 18 })
        }
        if (!d.moved) {
            if (d.kind !== "tilt") {
                lift.set(lift.get() < 0.5 ? 1 : 0)
                if (d.kind === "cord")
                    animate(pullY, [0, 18, 0], {
                        duration: 0.4,
                        ease: "easeOut",
                    })
                rattle(true)
            } else {
                tilt.set(tilt.get() < 0.5 ? 1 : 0)
                rattle()
            }
        } else {
            rattle(d.kind !== "tilt")
        }
    }
    const onKey = (kind: "lift" | "tilt") => (e: React.KeyboardEvent) => {
        if (!live) return
        const mv = kind === "lift" ? lift : tilt
        const up =
            kind === "lift"
                ? ["ArrowUp", "ArrowRight"]
                : ["ArrowRight", "ArrowUp"]
        const down =
            kind === "lift"
                ? ["ArrowDown", "ArrowLeft"]
                : ["ArrowLeft", "ArrowDown"]
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            mv.set(mv.get() < 0.5 ? 1 : 0)
            rattle(kind === "lift")
        } else if (up.includes(e.key)) {
            e.preventDefault()
            mv.set(clamp01(mv.get() + 0.1))
        } else if (down.includes(e.key)) {
            e.preventDefault()
            mv.set(clamp01(mv.get() - 0.1))
        }
    }

    // Keep screen readers in sync with the current values
    const railRef = useRef<HTMLDivElement>(null)
    const wandRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const a = lift.on("change", (v) =>
            railRef.current?.setAttribute(
                "aria-valuenow",
                String(Math.round(v * 100))
            )
        )
        const b = tilt.on("change", (v) =>
            wandRef.current?.setAttribute(
                "aria-valuenow",
                String(Math.round(v * 100))
            )
        )
        return () => {
            a()
            b()
        }
    }, [])

    // ─── Automatic triggers ───
    const runAction = (on: boolean) => {
        if (liftAction) {
            lift.set(on ? raiseTo : raiseFrom)
            rattle(true)
        } else {
            tilt.set(on ? tiltTo : tiltFrom)
            rattle()
        }
    }

    const scrollOpenRef = useRef(false)
    useEffect(() => {
        if (!live || typeof window === "undefined") return
        if (trigger !== "scroll" && trigger !== "scrub") return
        const el = rootRef.current
        if (!el) return
        scrollOpenRef.current = false
        let frame = 0
        let listening = false
        let done = false
        let io: IntersectionObserver | null = null
        let sideIo: IntersectionObserver | null = null
        let retry = 0
        let retryTimer: any = 0
        const fromVal = liftAction ? raiseFrom : tiltFrom
        const toVal = liftAction ? raiseTo : tiltTo
        const target = liftAction ? lift : tilt
        const id = String(sectionId ?? "")
            .trim()
            .replace(/^#/, "")
        const distance = scrollDistance ?? 60

        const check = (tracked: Element) => {
            frame = 0
            if (done) return
            const r = tracked.getBoundingClientRect()
            const vh =
                window.innerHeight || document.documentElement.clientHeight
            if (r.width === 0 && r.height === 0) return
            if (trigger === "scrub") {
                const startLine = scrollStart === "top" ? 0 : vh
                const span = Math.max(1, vh * (distance / 100))
                const p = clamp01((startLine - r.top) / span)
                target.set(fromVal + (toVal - fromVal) * p)
                return
            }
            const entered = r.top < vh * 0.8 && r.bottom > vh * 0.2
            const gone = r.bottom < 0 || r.top > vh
            if (entered && !scrollOpenRef.current) {
                scrollOpenRef.current = true
                runAction(true)
                // Played once and never resets: nothing left to track
                if (!replay) stopAll()
            } else if (gone && scrollOpenRef.current && replay) {
                scrollOpenRef.current = false
                runAction(false)
            }
        }

        let tracked: Element = el
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(() => check(tracked))
        }
        const startListening = () => {
            if (listening || done) return
            listening = true
            window.addEventListener("scroll", onScroll, {
                passive: true,
                capture: true,
            })
            window.addEventListener("resize", onScroll, { passive: true })
            onScroll()
        }
        const stopListening = () => {
            if (!listening) return
            listening = false
            window.removeEventListener("scroll", onScroll, {
                capture: true,
            } as any)
            window.removeEventListener("resize", onScroll)
            if (frame) cancelAnimationFrame(frame)
            frame = 0
        }
        function stopAll() {
            done = true
            stopListening()
            io?.disconnect()
            sideIo?.disconnect()
            io = null
            sideIo = null
        }

        const observe = () => {
            const found = id ? document.getElementById(id) : null
            // A section that has not rendered yet: retry briefly, then fall
            // back to the component itself
            if (id && !found && retry < 10) {
                retry++
                retryTimer = setTimeout(observe, 300)
                return
            }
            tracked = found || el
            if (typeof IntersectionObserver === "undefined") {
                startListening()
                return
            }
            // Only track scroll while the tracked element is in or near the
            // viewport. The margin covers the scroll-linked distance, so
            // progress always finishes before listeners are detached.
            const margin = trigger === "scrub" ? Math.ceil(distance) + 25 : 25
            io = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    if (entry.isIntersecting) {
                        startListening()
                    } else {
                        // One last check snaps scroll-linked progress to its
                        // final value and resets Replay, then pause
                        check(tracked)
                        stopListening()
                    }
                },
                { rootMargin: `${margin}% 0px ${margin}% 0px`, threshold: 0 }
            )
            io.observe(tracked)
            // A jump straight past the element (anchor link, back to top)
            // never makes it intersect. This observer only flips when the
            // element changes between above and below the screen, and then
            // runs a single check. It does no work on regular scrolling.
            sideIo = new IntersectionObserver(() => check(tracked), {
                rootMargin: "1000000px 0px 0px 0px",
                threshold: 0,
            })
            sideIo.observe(tracked)
            // Initial state for a page that loads already scrolled
            check(tracked)
        }
        observe()

        return () => {
            clearTimeout(retryTimer)
            stopAll()
        }
    }, [
        live,
        trigger,
        action,
        direction,
        sectionId,
        scrollStart,
        scrollDistance,
        replay,
        tiltFrom,
        tiltTo,
        raiseFrom,
        raiseTo,
    ])

    const onEnter = () => live && trigger === "hover" && runAction(true)
    const onLeave = () => live && trigger === "hover" && runAction(false)

    const hasImage =
        image !== undefined &&
        image !== null &&
        typeof image === "object" &&
        typeof image.src === "string" &&
        image.src.length > 0

    const wandLen = clamp(paneH * 0.42, 60, 420)
    const withCord = (liftStyle ?? "cord") === "cord"
    const cordBase = clamp(paneH * 0.38, 50, 380)
    const cordGrow = Math.max(0, Math.min(paneH * 0.5 - 20, paneH * 0.3))
    const cordMax = cordBase + cordGrow + 220
    const cordLen = useTransform(
        [liftS, pullY] as any,
        ([l, py]: any) => cordBase + l * cordGrow + py
    )
    const cordScale = useTransform(cordLen, (v) => v / cordMax)
    const cordSideStyle =
        wandSide === "right" ? { left: "4%" } : { right: "4%" }
    const wandSideStyle =
        wandSide === "right" ? { right: "4%" } : { left: "4%" }
    const castShadow = cast?.shadow ?? "rgba(70,48,25,0.5)"
    const railFrac = paneH > 0 ? railH / paneH : 0.04
    const edgeMask =
        "radial-gradient(ellipse 60% 60% at 50% 50%, #000 55%, transparent 100%)"

    return (
        <div
            ref={rootRef}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            style={{
                ...style,
                position: "relative",
                overflow: "visible",
                isolation: "isolate",
            }}
        >
            {/* Light and slat shadows cast onto the page */}
            {cast && (
                <motion.div
                    style={{
                        position: "absolute",
                        left: padL + boxW * ((cast.x ?? 70) / 100),
                        top: padT + boxH * ((cast.y ?? 40) / 100),
                        width: boxW * ((cast.size ?? 100) / 100),
                        height: boxH * ((cast.size ?? 100) / 100),
                        transform: `skew(${cast.slant ?? -22}deg, ${cast.tilt ?? -10}deg)`,
                        transformOrigin: "0% 0%",
                        filter: `blur(${cast.blur ?? 3}px)`,
                        WebkitMaskImage: edgeMask,
                        maskImage: edgeMask,
                        opacity: castOpacity,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: lightColor,
                            opacity: 0.6,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            height: `${railFrac * 100}%`,
                            background: castShadow,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: `${railFrac * 100}%`,
                            bottom: 0,
                        }}
                    >
                        {Array.from({ length: count }).map((_, i) => (
                            <CastBand
                                key={`${count}-${i}`}
                                index={i}
                                count={count}
                                tilt={tiltS}
                                liftS={liftS}
                                areaH={areaH}
                                color={castShadow}
                            />
                        ))}
                        {tapeX.map((x) => (
                            <motion.div
                                key={x}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: `${x}%`,
                                    width: Math.max(2, tapeW * 0.8),
                                    height: "100%",
                                    scaleY: castTapeScale,
                                    transformOrigin: "50% 0%",
                                    background: castShadow,
                                    opacity: 0.6,
                                }}
                            />
                        ))}
                        <motion.div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: "100%",
                                y: castRailY,
                                scaleY: castRailScale,
                                transformOrigin: "50% 0%",
                                background: castShadow,
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {/* The blind */}
            <div
                style={{
                    position: "absolute",
                    left: padL,
                    top: padT,
                    width: boxW,
                    height: boxH,
                    zIndex: 1,
                    borderRadius: frame ? radius : 2,
                    background: frame
                        ? `linear-gradient(160deg, rgba(255,240,220,0.14), rgba(0,0,0,0.14)), ${frame.color ?? mat.rail}`
                        : "transparent",
                    boxShadow: "0 18px 40px rgba(40,25,10,0.18)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: frameW,
                        overflow: "hidden",
                        borderRadius: frame
                            ? Math.max(
                                  0,
                                  (parseFloat(String(radius)) || 0) - frameW
                              )
                            : 2,
                        background: backdrop,
                        boxShadow: frame
                            ? "inset 0 3px 8px rgba(0,0,0,0.25)"
                            : "none",
                    }}
                >
                    {hasImage && (
                        <img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt || ""}
                            draggable={false}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                pointerEvents: "none",
                            }}
                        />
                    )}
                    {/* Slight room-side shade on the view, for depth */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(20,12,4,0.08)",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Rain on the glass, behind the slats */}
                    {showRain && paneW > 0 && paneH > 0 && (
                        <Rain
                            w={paneW}
                            h={paneH}
                            src={hasImage ? image.src : ""}
                            backdrop={backdrop}
                            intensity={rain?.intensity ?? 0.6}
                            amount={rain?.amount ?? 40}
                            size={rain?.size ?? 5}
                            sliding={rain?.sliding ?? 3}
                            mist={rain?.mist ?? 0.5}
                            speed={rain?.speed ?? 1}
                            live={live}
                        />
                    )}

                    {/* Slats, stack, tapes and bottom rail */}
                    <div
                        ref={areaRef}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: railH,
                            bottom: 0,
                            zIndex: 0,
                        }}
                    >
                        {Array.from({ length: count }).map((_, i) => (
                            <Slat
                                key={`${count}-${i}`}
                                index={i}
                                count={count}
                                tilt={tilt}
                                liftS={liftS}
                                areaH={areaH}
                                color={mat.slat}
                                grain={mat.grain}
                                light={lightColor}
                                lightStrength={lightStrength}
                                speed={spd}
                            />
                        ))}

                        {/* Raised slats pressed together into one solid stack */}
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: mat.slat,
                                backgroundImage: stackPattern,
                                backgroundPosition: stackOffset,
                                clipPath: stackClip,
                                WebkitClipPath: stackClip as any,
                                pointerEvents: "none",
                                zIndex: count + 1,
                            }}
                        />

                        {/* Ladder tapes */}
                        {tapeX.map((x) => (
                            <motion.div
                                key={x}
                                style={{
                                    position: "absolute",
                                    top: -2,
                                    left: `${x}%`,
                                    width: tapeW,
                                    height: "100%",
                                    x: "-50%",
                                    scaleY: tapeScale,
                                    transformOrigin: "50% 0%",
                                    backgroundColor: mat.tape,
                                    backgroundImage:
                                        tapes === "cord"
                                            ? "linear-gradient(90deg, rgba(0,0,0,0.15), rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.15))"
                                            : "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px), linear-gradient(90deg, rgba(0,0,0,0.22), rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.05) 75%, rgba(0,0,0,0.22))",
                                    boxShadow: "1px 0 2px rgba(0,0,0,0.16)",
                                    pointerEvents: "none",
                                    zIndex: count + 2,
                                }}
                            />
                        ))}

                        {/* Bottom rail: drag it up or down, or tap it */}
                        <motion.div
                            ref={railRef}
                            role="slider"
                            tabIndex={live ? 0 : -1}
                            aria-label="Raise or lower the blind"
                            aria-orientation="vertical"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(raiseFrom * 100)}
                            onPointerDown={onDown("lift")}
                            onPointerMove={onMove}
                            onPointerUp={onUp}
                            onPointerCancel={onUp}
                            onKeyDown={onKey("lift")}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                y: railY,
                                height: bottomH,
                                borderRadius: 2,
                                backgroundColor: mat.rail,
                                backgroundImage:
                                    "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.22) 100%)",
                                boxShadow: "0 3px 6px rgba(0,0,0,0.22)",
                                cursor: live ? "ns-resize" : "default",
                                touchAction: "none",
                                outline: "none",
                                zIndex: count + 3,
                            }}
                        >
                            {/* Finger pull in the middle of the rail */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: -4,
                                    width: 36,
                                    height: 6,
                                    transform: "translateX(-50%)",
                                    borderRadius: "0 0 4px 4px",
                                    backgroundColor: mat.rail,
                                    backgroundImage:
                                        "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.3))",
                                    boxShadow: "0 2px 3px rgba(0,0,0,0.25)",
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Headrail */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: railH,
                            backgroundColor: mat.rail,
                            backgroundImage:
                                "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.08) 85%, rgba(0,0,0,0.28) 100%)",
                            boxShadow: "0 3px 7px rgba(0,0,0,0.22)",
                            pointerEvents: "none",
                        }}
                    />

                    {/* Lift cord: pull the tassel down, or tap it */}
                    {withCord && (
                        <div
                            style={{
                                position: "absolute",
                                top: railH - 3,
                                width: 18,
                                height: 0,
                                marginRight: -9,
                                zIndex: 2,
                                ...cordSideStyle,
                            }}
                        >
                            {/* Cord lock */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 4,
                                    top: 0,
                                    width: 10,
                                    height: 7,
                                    borderRadius: 2,
                                    backgroundColor: mat.rail,
                                    backgroundImage:
                                        "linear-gradient(90deg, rgba(0,0,0,0.3), rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.3))",
                                }}
                            />
                            {[7, 10].map((x) => (
                                <motion.div
                                    key={x}
                                    style={{
                                        position: "absolute",
                                        left: x,
                                        top: 5,
                                        width: 1.5,
                                        height: cordMax,
                                        scaleY: cordScale,
                                        transformOrigin: "50% 0%",
                                        borderRadius: 1,
                                        background: mat.tape,
                                        boxShadow:
                                            "1px 1px 1px rgba(0,0,0,0.2)",
                                    }}
                                />
                            ))}
                            <motion.div
                                role="slider"
                                tabIndex={live ? 0 : -1}
                                aria-label="Pull the cord to raise or lower the blind"
                                aria-orientation="vertical"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(raiseFrom * 100)}
                                onPointerDown={onDown("cord")}
                                onPointerMove={onMove}
                                onPointerUp={onUp}
                                onPointerCancel={onUp}
                                onKeyDown={onKey("lift")}
                                whileHover={live ? { scale: 1.06 } : undefined}
                                style={{
                                    position: "absolute",
                                    left: -3,
                                    top: 0,
                                    width: 24,
                                    height: 40,
                                    y: cordLen,
                                    cursor: live ? "grab" : "default",
                                    touchAction: "none",
                                    outline: "none",
                                }}
                            >
                                {/* Tassel */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 9,
                                        top: 0,
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        backgroundColor: mat.rail,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 5,
                                        top: 4,
                                        width: 14,
                                        height: 26,
                                        borderRadius:
                                            "50% 50% 4px 4px / 70% 70% 4px 4px",
                                        backgroundColor: mat.rail,
                                        backgroundImage:
                                            "linear-gradient(90deg, rgba(255,255,255,0.28), rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.3))",
                                        boxShadow: "0 3px 6px rgba(0,0,0,0.25)",
                                    }}
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Tilt wand: drag to twist, or tap */}
                    <div
                        ref={wandRef}
                        role="slider"
                        tabIndex={live ? 0 : -1}
                        aria-label="Tilt the slats"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(initialTilt * 100)}
                        onPointerDown={onDown("tilt")}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                        onKeyDown={onKey("tilt")}
                        style={{
                            position: "absolute",
                            top: railH - 3,
                            width: 24,
                            height: wandLen + 4,
                            marginLeft: -9,
                            cursor: live ? "ew-resize" : "default",
                            touchAction: "none",
                            outline: "none",
                            ...wandSideStyle,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 9,
                                top: 0,
                                width: 6,
                                height: 8,
                                borderRadius: 2,
                                backgroundColor: mat.rail,
                                backgroundImage:
                                    "linear-gradient(90deg, rgba(0,0,0,0.25), rgba(255,255,255,0.18) 50%, rgba(0,0,0,0.3))",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: 10,
                                top: 6,
                                width: 4,
                                height: wandLen,
                                borderRadius: 2,
                                backgroundColor: mat.rail,
                                backgroundImage:
                                    "linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.3))",
                                boxShadow: "1px 2px 3px rgba(0,0,0,0.22)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Live measurements of the blind */}
            {measure && boxW > 0 && boxH > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: padL,
                        top: padT,
                        width: boxW,
                        height: boxH,
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                >
                    <Dimension
                        axis="x"
                        length={boxW}
                        across={boxH}
                        flip={measure.widthAt === "bottom"}
                        label={formatLength(
                            boxW,
                            cmPerPx,
                            measure.unit ?? "cm"
                        )}
                        color={measure.color ?? "#5E3D25"}
                        offset={measure.offset ?? 28}
                        font={measure.font ?? {}}
                    />
                    <Dimension
                        axis="y"
                        length={boxH}
                        across={boxW}
                        flip={measure.heightAt === "right"}
                        label={formatLength(
                            boxH,
                            cmPerPx,
                            measure.unit ?? "cm"
                        )}
                        color={measure.color ?? "#5E3D25"}
                        offset={measure.offset ?? 28}
                        font={measure.font ?? {}}
                    />
                </div>
            )}

            {/* Canvas-only hint when no image is set */}
            {!hasImage && isOnCanvas && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        zIndex: 4,
                        transform: "translate(-50%, -50%)",
                        padding: "8px 14px",
                        border: "1px dashed rgba(0,0,0,0.35)",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.85)",
                        fontFamily: "sans-serif",
                        fontSize: 12,
                        color: "rgba(0,0,0,0.6)",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    Add image →
                </div>
            )}
        </div>
    )
}

const MEASURE_DEFAULT = {
    placement: "inside",
    unit: "cm",
    widthAt: "top",
    heightAt: "left",
    offset: 28,
    color: "#5E3D25",
    font: {
        fontSize: 12,
        letterSpacing: "0.06em",
        lineHeight: 1,
        variant: "Medium",
    },
}

const CAST_DEFAULT = {
    x: 70,
    y: 40,
    size: 100,
    slant: -22,
    tilt: -10,
    blur: 3,
    shadow: "rgba(70,48,25,0.5)",
    strength: 0.8,
}

VenetianBlinds.defaultProps = {
    startTilt: "open",
    startRaised: 0,
    trigger: "manual",
    action: "tilt",
    direction: "open",
    sectionId: "",
    scrollStart: "enter",
    scrollDistance: 60,
    replay: false,
    slats: 0,
    scale: 0.12,
    wandSide: "left",
    liftStyle: "cord",
    material: "black",
    colors: { slat: "#6F4628", rail: "#5D3A21", tape: "#4B2F1B", grain: true },
    tapes: "tape",
    showFrame: true,
    frame: { color: "#242220", width: 12 },
    showCast: false,
    showMeasure: false,
    showRain: false,
    rain: {
        intensity: 0.6,
        amount: 40,
        size: 5,
        sliding: 3,
        mist: 0.5,
        speed: 1,
    },
    light: "#FFE6B8",
    cast: CAST_DEFAULT,
    backdrop: "#CFDCE3",
    radius: "6px 6px 6px 6px",
    measure: MEASURE_DEFAULT,
    speed: 1,
    sound: true,
}

const auto = (props: any) => props.trigger === "manual"

addPropertyControls(VenetianBlinds, {
    // Content
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "The view behind the blind.",
    },
    startTilt: {
        type: ControlType.Enum,
        title: "Slats",
        options: ["closed", "half", "open"],
        optionTitles: ["Closed", "Half", "Open"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: "open",
        description:
            "Slat tilt when the page loads. Visitors twist the wand to change it.",
    },
    startRaised: {
        type: ControlType.Number,
        title: "Raised",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "How far the blind is pulled up when the page loads. Visitors drag the bottom rail to change it.",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["manual", "hover", "scroll", "scrub"],
        optionTitles: ["Manual", "Hover", "On scroll", "Scroll-linked"],
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        defaultValue: "manual",
        description:
            "Manual: only the wand and bottom rail. Hover and On scroll play the action once. Scroll-linked follows the scroll position both ways.",
    },
    action: {
        type: ControlType.Enum,
        title: "Action",
        options: ["tilt", "lift"],
        optionTitles: ["Tilt", "Raise"],
        displaySegmentedControl: true,
        defaultValue: "tilt",
        description:
            "What the trigger moves: the slat tilt, or the height of the blind.",
        hidden: auto,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["open", "close"],
        optionTitles: ["Open", "Close"],
        displaySegmentedControl: true,
        defaultValue: "open",
        description:
            "Open tilts the slats open or raises the blind. Close does the reverse, starting from fully open when the start state is already closed.",
        hidden: auto,
    },
    sectionId: {
        type: ControlType.String,
        title: "Section ID",
        defaultValue: "",
        placeholder: "hero",
        description:
            "Optional. A scroll section ID from Framer (with or without #) that drives the blind instead of the component itself. Handy for sticky blinds.",
        hidden: (p: any) => p.trigger !== "scroll" && p.trigger !== "scrub",
    },
    scrollStart: {
        type: ControlType.Enum,
        title: "Start",
        options: ["enter", "top"],
        optionTitles: ["Enters", "Hits top"],
        displaySegmentedControl: true,
        defaultValue: "enter",
        description:
            "Start when the section's top edge enters the screen, or when it reaches the top of the screen.",
        hidden: (p: any) => p.trigger !== "scrub",
    },
    scrollDistance: {
        type: ControlType.Number,
        title: "Distance",
        defaultValue: 60,
        min: 10,
        max: 200,
        step: 5,
        unit: "%",
        description:
            "Scrolling needed to finish, as a share of the screen height.",
        hidden: (p: any) => p.trigger !== "scrub",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "Once",
        description:
            "Yes resets the blind when it leaves the screen, so it plays again every time.",
        hidden: (p: any) => p.trigger !== "scroll",
    },

    // Layout
    slats: {
        type: ControlType.Number,
        title: "Slat Count",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
        description:
            "0 is Auto: as many 50 mm slats as a real blind of this size would have.",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 0.12,
        min: 0.02,
        max: 5,
        step: 0.01,
        unit: "cm",
        description:
            "Real centimetres per pixel. Sets the slat count on Auto, the tape spacing and the measurements. At 0.12 a 1000px wide blind is 120 cm.",
    },
    wandSide: {
        type: ControlType.Enum,
        title: "Wand",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        description:
            "Which side the tilt wand hangs on. The lift cord hangs on the other side.",
    },
    liftStyle: {
        type: ControlType.Enum,
        title: "Lift",
        options: ["cord", "cordless"],
        optionTitles: ["Cord", "Cordless"],
        displaySegmentedControl: true,
        defaultValue: "cord",
        description:
            "Cord: visitors pull the tassel down to raise or lower the blind, and the cord grows as it rises. Cordless: no cord, the bottom rail is the handle. Dragging the bottom rail works in both.",
    },

    // Style
    material: {
        type: ControlType.Enum,
        title: "Material",
        options: ["walnut", "oak", "white", "black", "custom"],
        optionTitles: ["Walnut", "Oak", "White", "Black", "Custom"],
        defaultValue: "black",
        description:
            "Walnut and Oak are wood with grain. White and Black are smooth painted slats. Custom lets you pick the colors.",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        buttonTitle: "Custom colors",
        description: "Colors for the Custom material.",
        hidden: (p: any) => p.material !== "custom",
        controls: {
            slat: {
                type: ControlType.Color,
                title: "Slats",
                defaultValue: "#6F4628",
                description: "Slat color.",
            },
            rail: {
                type: ControlType.Color,
                title: "Rails",
                defaultValue: "#5D3A21",
                description: "Headrail, bottom rail and wand.",
            },
            tape: {
                type: ControlType.Color,
                title: "Tapes",
                defaultValue: "#4B2F1B",
                description: "Ladder tapes or cords.",
            },
            grain: {
                type: ControlType.Boolean,
                title: "Grain",
                defaultValue: true,
                enabledTitle: "Wood",
                disabledTitle: "Smooth",
                description: "Wood grain on the slats.",
            },
        },
    },
    tapes: {
        type: ControlType.Enum,
        title: "Ladders",
        options: ["tape", "cord"],
        optionTitles: ["Tapes", "Cords"],
        displaySegmentedControl: true,
        defaultValue: "tape",
        description:
            "Wide cloth tapes like premium wooden blinds, or thin cords.",
    },
    showFrame: {
        type: ControlType.Boolean,
        title: "Frame",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "A window frame around the blind.",
    },
    frame: {
        type: ControlType.Object,
        title: "Frame Style",
        buttonTitle: "Window frame",
        hidden: (p: any) => !p.showFrame,
        description: "Color and thickness of the frame.",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#242220",
                description:
                    "Frame color. Matches the Black blinds by default.",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 12,
                min: 2,
                max: 60,
                step: 1,
                unit: "px",
                description: "Frame thickness.",
            },
        },
    },
    light: {
        type: ControlType.Color,
        title: "Light",
        defaultValue: "#FFE6B8",
        description: "Color of the daylight on the slats and in the cast.",
    },
    showCast: {
        type: ControlType.Boolean,
        title: "Cast",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Light and slat shadows thrown onto the page around the blind.",
    },
    cast: {
        type: ControlType.Object,
        title: "Cast Style",
        buttonTitle: "Light and shadows",
        defaultValue: CAST_DEFAULT,
        hidden: (p: any) => !p.showCast,
        description:
            "Position and look of the cast. Keep Clip Content off on the parent so it is not cut off.",
        controls: {
            x: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 70,
                min: -200,
                max: 200,
                step: 1,
                unit: "%",
                description:
                    "Horizontal position, relative to the blind's width.",
            },
            y: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 40,
                min: -200,
                max: 200,
                step: 1,
                unit: "%",
                description:
                    "Vertical position, relative to the blind's height.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 100,
                min: 40,
                max: 300,
                step: 1,
                unit: "%",
                description: "Size compared to the blind.",
            },
            slant: {
                type: ControlType.Number,
                title: "Slant",
                defaultValue: -22,
                min: -60,
                max: 60,
                step: 1,
                unit: "°",
                description: "Lean of the cast, like low sun from the side.",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: -10,
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
                description: "Angle of the stripes.",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 3,
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
                description: "Softness of the shadow edges.",
            },
            shadow: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(70,48,25,0.5)",
                description: "Shadow color. Keep it transparent.",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 0.8,
                min: 0,
                max: 1,
                step: 0.05,
                description: "Overall visibility.",
            },
        },
    },
    showRain: {
        type: ControlType.Boolean,
        title: "Rain",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Raindrops on the window glass, behind the slats. Each drop refracts the image like real water.",
    },
    rain: {
        type: ControlType.Object,
        title: "Rain Style",
        buttonTitle: "Raindrops",
        hidden: (p: any) => !p.showRain,
        description: "How wet the window is.",
        controls: {
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 0.6,
                min: 0.1,
                max: 1,
                step: 0.05,
                description:
                    "Overall strength of the effect. Low keeps it subtle.",
            },
            amount: {
                type: ControlType.Number,
                title: "Drops",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 1,
                description: "How many drops sit on the glass.",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 5,
                min: 1.5,
                max: 16,
                step: 0.5,
                unit: "px",
                description: "Typical drop size. Every drop varies around it.",
            },
            sliding: {
                type: ControlType.Number,
                title: "Sliding",
                defaultValue: 3,
                min: 0,
                max: 12,
                step: 1,
                displayStepper: true,
                description:
                    "Drops that run down the glass in stop-and-go jumps, leaving a fine trail.",
            },
            mist: {
                type: ControlType.Number,
                title: "Mist",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.05,
                description: "Tiny droplets all over the glass.",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.1,
                description: "How fast the sliding drops run.",
            },
        },
    },
    backdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "#CFDCE3",
        description: "Color behind the blind when no image is set.",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "6px 6px 6px 6px",
        description: "Corner radius of the frame.",
        hidden: (p: any) => !p.showFrame,
    },
    showMeasure: {
        type: ControlType.Boolean,
        title: "Dimensions",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Width and height dimension lines that update live as you resize.",
    },
    measure: {
        type: ControlType.Object,
        title: "Dimension Style",
        buttonTitle: "Dimensions",
        defaultValue: MEASURE_DEFAULT,
        hidden: (p: any) => !p.showMeasure,
        description: "Placement, unit and look of the dimension lines.",
        controls: {
            placement: {
                type: ControlType.Enum,
                title: "Place",
                options: ["inside", "outside"],
                optionTitles: ["Inside", "Outside"],
                displaySegmentedControl: true,
                defaultValue: "inside",
                description:
                    "Inside keeps the lines within the component so they are always visible. Outside draws them beyond its edges.",
            },
            unit: {
                type: ControlType.Enum,
                title: "Unit",
                options: ["cm", "mm", "in"],
                optionTitles: ["cm", "mm", "in"],
                displaySegmentedControl: true,
                defaultValue: "cm",
                description: "Unit on the dimension lines.",
            },
            widthAt: {
                type: ControlType.Enum,
                title: "Width",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                displaySegmentedControl: true,
                defaultValue: "top",
                description: "Edge the width line runs along.",
            },
            heightAt: {
                type: ControlType.Enum,
                title: "Height",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
                description: "Side the height line runs along.",
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 28,
                min: 12,
                max: 120,
                step: 1,
                unit: "px",
                description: "Distance from the blind.",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#5E3D25",
                description: "Lines and numbers.",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultValue: {
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    lineHeight: 1,
                    variant: "Medium",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "12px",
                displayFontSize: true,
                controls: "extended",
                description: "Font of the values.",
            },
        },
    },

    // Behavior
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.3,
        max: 2,
        step: 0.1,
        description:
            "How fast the slats tilt and the blind rises. Lower feels heavier.",
    },
    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Soft slat sound when the blind moves. Wood sounds deeper than the painted finishes.\n\nMade by [Justyna](https://framer.link/justyna-d)",
    },
})
