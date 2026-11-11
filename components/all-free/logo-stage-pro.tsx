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


// LogoScroll — logo row with five motion characters, on either axis.
//   marquee   even continuous scroll (the quiet one)
//   spotlight fixed focus zone: logos scale up, sharpen and gain colour
//             passing through it, then fall back
//   depth     3D conveyor — logos travel toward the camera and dissolve
//   swap      no scrolling: fixed slots cross-fade through the pool
//   wave      marquee + slow sine bob, phase-shifted per logo
// Motion, container chrome, item chrome and colour treatment are independent.
// Colour treatment uses a real mask when set to Flat tint, so multicolour
// logos become one flat brand colour rather than merely desaturated.

type Logo = { image?: any; alt?: string; label?: string; link?: string }

interface LogoScrollProps {
    logos?: Logo[]
    axis?: "horizontal" | "vertical"
    variant?: "marquee" | "spotlight" | "depth" | "swap" | "wave"
    mobileVariant?:
        | "inherit"
        | "marquee"
        | "spotlight"
        | "depth"
        | "swap"
        | "wave"
    breakpoint?: number
    direction?: "left" | "right"
    speed?: number
    draggable?: boolean
    scrollBoost?: number
    pauseOnHover?: boolean
    logoHeight?: number
    mobileLogoHeight?: number
    gap?: number
    slotCount?: number
    focusWidth?: number
    restOpacity?: number
    dimOpacity?: number
    colorMode?: "none" | "grayscale" | "tint"
    tintColor?: string
    treatAmount?: number
    hoverReveal?: boolean
    itemStyle?: "bare" | "chip" | "card"
    itemFill?: string
    itemBorderColor?: string
    itemRadius?: number
    itemPadX?: number
    itemPadY?: number
    useHot?: boolean
    hotFill?: string
    labelColor?: string
    bg?: string
    radius?: number
    borderWidth?: number
    borderColor?: string
    fade?: boolean
    fadeAmount?: number
    style?: React.CSSProperties
}

const DEFAULT_LOGOS: Logo[] = [
    { label: "Northstar" },
    { label: "Helix" },
    { label: "Kosmos" },
    { label: "Vireo" },
    { label: "Atlas Bio" },
    { label: "Lumen" },
]

function toImg(p: any): { src: string; srcSet?: string; alt?: string } | null {
    if (!p) return null
    if (typeof p === "string") return { src: p }
    if (typeof p === "object" && p.src)
        return { src: p.src, srcSet: p.srcSet, alt: p.alt }
    return null
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m
}
function clamp(v: number, a: number, b: number) {
    return v < a ? a : v > b ? b : v
}
function bell(d: number, w: number) {
    const t = d / w
    return Math.exp(-t * t)
}
function easeInOutCubic(p: number) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

const CYCLE = 2.8 // swap: seconds a logo holds a slot
const FADE = 0.8 // swap: seconds of cross-fade
const DECAY = 0.45 // seconds for drag / scroll impulses to fall away

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 120
 */
export default function LogoScroll(props: LogoScrollProps) {
    const {
        logos,
        axis = "horizontal",
        variant = "spotlight",
        mobileVariant = "swap",
        breakpoint = 810,
        direction = "left",
        speed = 52,
        draggable = true,
        scrollBoost = 0,
        pauseOnHover = false,
        logoHeight = 26,
        mobileLogoHeight = 0,
        gap = 64,
        slotCount = 0,
        focusWidth = 0.34,
        restOpacity = 0.55,
        dimOpacity = 0.22,
        colorMode = "grayscale",
        tintColor = "#514A49",
        treatAmount = 1,
        hoverReveal = true,
        itemStyle = "bare",
        itemFill = "#FFFCFA",
        itemBorderColor = "#D5CBCA",
        itemRadius = 16,
        itemPadX = 22,
        itemPadY = 12,
        useHot = true,
        hotFill = "#EFFF63",
        labelColor = "#1A1F18",
        bg = "rgba(0,0,0,0)",
        radius = 24,
        borderWidth = 0,
        borderColor = "#D5CBCA",
        fade = true,
        fadeAmount = 10,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const vertical = axis === "vertical"

    const supplied: Logo[] = Array.isArray(logos) ? logos : DEFAULT_LOGOS
    const isEmpty = supplied.length === 0
    const list = isEmpty ? DEFAULT_LOGOS : supplied

    const rootRef = React.useRef<HTMLDivElement>(null)
    const nodesRef = React.useRef<HTMLElement[]>([])
    const tintsRef = React.useRef<HTMLElement[]>([])
    const geo = React.useRef({
        sizes: [] as number[],
        starts: [] as number[],
        total: 0,
        M: 0, // container size along the main axis
        maxS: 1,
    })

    // bounded number of self-adjustments per size epoch (reset on a real resize)
    const adjust = React.useRef(0)
    // a parked component (canvas, hidden tab, reduced motion, off-screen) has no
    // frame loop to pick up a new measurement, so measuring has to repaint it
    const parkedRef = React.useRef(false)
    const repaintRef = React.useRef<() => void>(() => {})
    const [reps, setReps] = React.useState(2)
    const [slots, setSlots] = React.useState(4)
    const [narrow, setNarrow] = React.useState(false)
    const [awake, setAwake] = React.useState(true)
    // bumped whenever the measured geometry actually changes, so a parked
    // frame (canvas, reduced motion, off-screen, hidden tab) repaints instead
    // of keeping whatever it drew before the logos had been measured

    // narrow-screen overrides
    const effVariant =
        narrow && mobileVariant && mobileVariant !== "inherit"
            ? mobileVariant
            : variant
    const effLogoH =
        narrow && mobileLogoHeight > 0 ? mobileLogoHeight : logoHeight
    const isSwap = effVariant === "swap"

    const itemGap = gap
    const count = isSwap ? slots * list.length : reps * list.length

    nodesRef.current.length = count
    tintsRef.current.length = count

    // motion state that must not trigger re-renders
    const offset = React.useRef(0)
    const dragVel = React.useRef(0)
    const boost = React.useRef(0)
    const hovering = React.useRef(false)
    const hoverIndex = React.useRef(-1)
    const dragging = React.useRef(false)
    const dragLast = React.useRef({ p: 0, t: 0 })

    // ---- measure ---------------------------------------------------------
    const measure = React.useCallback(() => {
        const root = rootRef.current
        if (!root) return
        const M = vertical ? root.clientHeight : root.clientWidth
        const nodes = nodesRef.current
        const sizes: number[] = []
        const starts: number[] = []
        let total = 0
        let maxS = 1
        for (let i = 0; i < count; i++) {
            const n = nodes[i]
            const s = n ? (vertical ? n.offsetHeight : n.offsetWidth) : 0
            sizes.push(s)
            starts.push(total)
            total += s + itemGap
            if (s > maxS) maxS = s
        }
        geo.current = { sizes, starts, total, M, maxS }
        if (parkedRef.current) repaintRef.current()

        const w = root.clientWidth
        const nowNarrow = breakpoint > 0 && w > 0 && w < breakpoint
        if (nowNarrow !== narrow) setNarrow(nowNarrow)

        if (adjust.current > 12) return
        if (isSwap) {
            const per = maxS + Math.max(16, itemGap)
            const next =
                slotCount > 0
                    ? clamp(Math.round(slotCount), 2, 6)
                    : clamp(Math.floor(M / per), 2, 6)
            if (next !== slots) {
                adjust.current++
                setSlots(next)
            }
        } else if (total < M + 2 * maxS + 120 && reps < 8) {
            adjust.current++
            setReps((r) => r + 1)
        }
    }, [
        count,
        itemGap,
        isSwap,
        itemStyle,
        slots,
        slotCount,
        reps,
        vertical,
        breakpoint,
        narrow,
    ])

    const measureRef = React.useRef(measure)
    measureRef.current = measure

    React.useLayoutEffect(() => {
        measureRef.current()
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return

        // Coalesce to one measure per frame: a decoding image or a swapping
        // webfont can resize a dozen items in the same tick.
        let pending = false
        const schedule = () => {
            if (pending) return
            pending = true
            const run = () => {
                pending = false
                measureRef.current()
            }
            if (typeof requestAnimationFrame === "function")
                requestAnimationFrame(run)
            else run()
        }

        const ro = new ResizeObserver((entries) => {
            // only a real container resize earns a fresh adjustment budget
            for (const e of entries) if (e.target === root) adjust.current = 0
            schedule()
        })
        ro.observe(root)
        // Watch the items too. Logo images decode after first paint and
        // webfonts swap under text fallbacks; without this the strip keeps the
        // widths it measured before either happened, and the logos overlap.
        for (const n of nodesRef.current) if (n) ro.observe(n)

        if (
            typeof document !== "undefined" &&
            document.fonts &&
            document.fonts.ready
        ) {
            document.fonts.ready.then(schedule).catch(() => {})
        }
        return () => ro.disconnect()
    }, [count])

    // re-measure when something structural changes, without letting the
    // measurement's own outputs re-trigger the effect that produced them
    React.useLayoutEffect(() => {
        measureRef.current()
    }, [
        count,
        effLogoH,
        gap,
        slotCount,
        itemPadX,
        itemPadY,
        itemStyle,
        vertical,
    ])

    // ---- sleep when off-screen or on a hidden tab ------------------------
    React.useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        let onScreen = true
        const sync = () => {
            const visible =
                typeof document === "undefined" ||
                document.visibilityState !== "hidden"
            setAwake(onScreen && visible)
        }
        let io: any = null
        if (root && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    onScreen = entries[0] ? entries[0].isIntersecting : true
                    sync()
                },
                { rootMargin: "120px" }
            )
            io.observe(root)
        }
        if (typeof document !== "undefined")
            document.addEventListener("visibilitychange", sync)
        sync()
        return () => {
            if (io) io.disconnect()
            if (typeof document !== "undefined")
                document.removeEventListener("visibilitychange", sync)
        }
    }, [isStatic])

    // ---- scroll impulses --------------------------------------------------
    React.useEffect(() => {
        if (isStatic || !scrollBoost || typeof window === "undefined") return
        let last = window.scrollY
        const onScroll = () => {
            const y = window.scrollY
            boost.current += (y - last) * scrollBoost * 6
            boost.current = clamp(boost.current, -2400, 2400)
            last = y
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [isStatic, scrollBoost])

    // ---- painting ---------------------------------------------------------
    const treat = React.useCallback(
        (n: HTMLElement, i: number, amount: number, blur: number) => {
            const revealed = hoverReveal && hoverIndex.current === i
            const a = revealed ? 0 : clamp(amount, 0, 1)
            const tint = tintsRef.current[i]
            if (colorMode === "tint" && tint) {
                tint.style.opacity = a.toFixed(3)
                n.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : ""
            } else if (colorMode === "grayscale") {
                n.style.filter = `grayscale(${a.toFixed(3)})${blur > 0.02 ? ` blur(${blur.toFixed(2)}px)` : ""}`
            } else {
                n.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : ""
                if (tint) tint.style.opacity = "0"
            }
        },
        [colorMode, hoverReveal]
    )

    const place = React.useCallback(
        (
            n: HTMLElement,
            main: number,
            cross: number,
            z: number,
            scale: number,
            rot: number
        ) => {
            const s = scale !== 1 ? ` scale(${scale.toFixed(4)})` : ""
            const r = rot !== 0 ? ` rotate(${rot.toFixed(2)}deg)` : ""
            n.style.transform = vertical
                ? `translate3d(calc(-50% + ${cross.toFixed(2)}px),${main.toFixed(2)}px,${z.toFixed(1)}px)${r}${s}`
                : `translate3d(${main.toFixed(2)}px,calc(-50% + ${cross.toFixed(2)}px),${z.toFixed(1)}px)${r}${s}`
        },
        [vertical]
    )

    const paintScroll = React.useCallback(
        (T: number) => {
            const { sizes, starts, total, M, maxS } = geo.current
            if (!total) return
            const nodes = nodesRef.current
            const off = mod(offset.current, total)
            for (let i = 0; i < count; i++) {
                const n = nodes[i]
                if (!n) continue
                const pos = mod(starts[i] - off, total) - maxS - 40
                if (pos > M + 60 || pos + sizes[i] < -60) {
                    if (n.style.visibility !== "hidden")
                        n.style.visibility = "hidden"
                    continue
                }
                if (n.style.visibility === "hidden") n.style.visibility = ""
                const d = (pos + sizes[i] / 2 - M / 2) / (M / 2)

                if (effVariant === "marquee") {
                    place(n, pos, 0, 0, 1, 0)
                    n.style.opacity = String(restOpacity)
                    treat(n, i, treatAmount, 0)
                    // no focus in this mode: undo anything a previous mode left
                    if (n.style.zIndex) n.style.zIndex = ""
                    if (
                        itemStyle !== "bare" &&
                        n.style.backgroundColor !== itemFill
                    )
                        n.style.backgroundColor = itemFill
                } else if (effVariant === "spotlight") {
                    const f = bell(d, focusWidth)
                    place(n, pos, 0, 0, 0.84 + 0.3 * f, 0)
                    n.style.opacity = (
                        dimOpacity +
                        (1 - dimOpacity) * f
                    ).toFixed(3)
                    treat(n, i, treatAmount * (1 - f), 2.6 * (1 - f))
                    n.style.zIndex = String(Math.round(f * 100))
                    if (itemStyle !== "bare" && useHot)
                        n.style.backgroundColor = f > 0.86 ? hotFill : itemFill
                } else if (effVariant === "depth") {
                    const u = (d + 1) / 2
                    const z = -420 + 700 * u
                    const inn = clamp(u / 0.18, 0, 1)
                    const out = clamp((1 - u) / 0.3, 0, 1)
                    place(n, pos, 0, z, 1, 0)
                    n.style.opacity = (inn * out).toFixed(3)
                    treat(
                        n,
                        i,
                        clamp(treatAmount - 1.6 * u, 0, 1),
                        3.4 * Math.max(0, 1 - 2 * u)
                    )
                    n.style.zIndex = String(Math.round(u * 100))
                } else {
                    const f = bell(d, Math.max(focusWidth, 0.45))
                    const ph = i * 0.7
                    place(
                        n,
                        pos,
                        Math.sin(T * 0.9 + ph) * 9,
                        0,
                        0.9 + 0.16 * f,
                        Math.cos(T * 0.9 + ph) * 1.6
                    )
                    n.style.opacity = (
                        restOpacity +
                        (1 - restOpacity) * f
                    ).toFixed(3)
                    treat(n, i, treatAmount * (1 - f), 0)
                    if (itemStyle !== "bare" && useHot)
                        n.style.backgroundColor = f > 0.9 ? hotFill : itemFill
                }
            }
        },
        [
            count,
            effVariant,
            restOpacity,
            dimOpacity,
            treatAmount,
            focusWidth,
            itemStyle,
            useHot,
            hotFill,
            itemFill,
            place,
            treat,
        ]
    )

    const paintSwap = React.useCallback(
        (T: number) => {
            const nodes = nodesRef.current
            const N = list.length
            const fr = FADE / CYCLE
            for (let s = 0; s < slots; s++) {
                const u = T / CYCLE + s * 0.41
                const k = Math.floor(u)
                const p = u - k > 1 - fr ? (u - k - (1 - fr)) / fr : 0
                const e = easeInOutCubic(p)
                const a = mod(k * slots + s, N)
                let b = mod((k + 1) * slots + s, N)
                if (b === a) b = (a + 1) % N
                for (let j = 0; j < N; j++) {
                    const i = s * N + j
                    const n = nodes[i]
                    if (!n) continue
                    let op = 0
                    let sh = 0
                    if (j === a) {
                        op = 1 - e
                        sh = -e
                    } else if (j === b) {
                        op = e
                        sh = 1 - e
                    }
                    if (op <= 0.002) {
                        if (n.style.visibility !== "hidden") {
                            n.style.visibility = "hidden"
                            n.style.opacity = "0"
                        }
                        continue
                    }
                    if (n.style.visibility === "hidden") n.style.visibility = ""
                    n.style.opacity = op.toFixed(3)
                    n.style.transform = `translateY(${(sh * 14).toFixed(1)}px) scale(${(0.94 + 0.06 * op).toFixed(3)})`
                    treat(n, i, treatAmount, (1 - op) * 2)
                    if (itemStyle !== "bare" && useHot)
                        n.style.backgroundColor = op > 0.92 ? hotFill : itemFill
                }
            }
        },
        [
            slots,
            list.length,
            itemStyle,
            useHot,
            hotFill,
            itemFill,
            treatAmount,
            treat,
        ]
    )

    // ---- parked frame -----------------------------------------------------
    // Repainted after every render (renders are rare) so a frozen frame is
    // never left stale. Slot counts, repeat counts and measurements settle
    // across several renders; the canvas, reduced-motion and off-screen cases
    // would otherwise keep whatever was painted first.
    const parked =
        isStatic ||
        !awake ||
        (typeof window !== "undefined" &&
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches)

    // an already-queued frame can fire after the new layout has committed but
    // before this effect re-subscribes; without this the outgoing painter writes
    // its transforms onto the incoming layout's nodes
    const isSwapRef = React.useRef(isSwap)
    isSwapRef.current = isSwap

    parkedRef.current = parked
    repaintRef.current = () => {
        const g = geo.current
        if (isSwap) paintSwap(0)
        else if (g.total) {
            offset.current =
                g.starts[0] - (g.M / 2 - g.sizes[0] / 2 + g.maxS + 40)
            paintScroll(0)
        }
    }

    React.useLayoutEffect(() => {
        if (parked) repaintRef.current()
    })

    // ---- loop -------------------------------------------------------------
    React.useEffect(() => {
        if (parked) return
        let raf = 0
        let last = 0
        let t0 = 0
        const dir = direction === "right" ? -1 : 1
        const step = (ts: number) => {
            if (isSwapRef.current !== isSwap) {
                raf = requestAnimationFrame(step)
                return
            }
            if (!last) last = ts
            if (!t0) t0 = ts
            const dt = Math.min(64, ts - last) / 1000
            last = ts
            const decay = Math.exp(-dt / DECAY)
            dragVel.current *= decay
            boost.current *= decay
            if (
                !isSwap &&
                !dragging.current &&
                !(pauseOnHover && hovering.current)
            )
                offset.current +=
                    (dir * speed + dragVel.current + boost.current) * dt
            const T = (ts - t0) / 1000
            if (isSwap) paintSwap(T)
            else paintScroll(T)
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [
        parked,
        isSwap,
        count,
        paintScroll,
        paintSwap,
        speed,
        direction,
        pauseOnHover,
    ])

    // ---- drag -------------------------------------------------------------
    const canDrag = draggable && !isSwap && !isStatic
    const dragHandlers = canDrag
        ? {
              onPointerDown: (e: React.PointerEvent) => {
                  dragging.current = true
                  dragVel.current = 0
                  dragLast.current = {
                      p: vertical ? e.clientY : e.clientX,
                      t: e.timeStamp,
                  }
                  try {
                      ;(e.currentTarget as HTMLElement).setPointerCapture(
                          e.pointerId
                      )
                  } catch (err) {}
              },
              onPointerMove: (e: React.PointerEvent) => {
                  if (!dragging.current) return
                  const p = vertical ? e.clientY : e.clientX
                  const dp = p - dragLast.current.p
                  const dt = Math.max(1, e.timeStamp - dragLast.current.t)
                  offset.current -= dp
                  dragVel.current = clamp((-dp / dt) * 1000, -3000, 3000)
                  dragLast.current = { p, t: e.timeStamp }
              },
              onPointerUp: (e: React.PointerEvent) => {
                  dragging.current = false
                  try {
                      ;(e.currentTarget as HTMLElement).releasePointerCapture(
                          e.pointerId
                      )
                  } catch (err) {}
              },
              onPointerCancel: () => {
                  dragging.current = false
              },
          }
        : {}

    // ---- styles -----------------------------------------------------------
    const chrome: React.CSSProperties =
        itemStyle === "bare"
            ? {}
            : {
                  background: itemFill,
                  border: `1px solid ${itemBorderColor}`,
                  borderRadius: itemStyle === "chip" ? 999 : itemRadius,
                  padding: `${itemPadY}px ${itemPadX}px`,
              }

    const itemBase: React.CSSProperties = {
        position: "absolute",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        textDecoration: "none",
        transformOrigin: "50% 50%",
        willChange: "transform, opacity, filter",
        color: labelColor,
        ...(isSwap
            ? ({
                  position: "relative",
                  gridArea: "1 / 1",
              } as React.CSSProperties)
            : vertical
              ? { top: 0, left: "50%" }
              : { left: 0, top: "50%" }),
        ...chrome,
    }

    const renderLogo = (lg: Logo, i: number, idx: number) => {
        const img = toImg(lg && lg.image)
        if (img)
            return (
                <span
                    style={{
                        position: "relative",
                        display: "block",
                        lineHeight: 0,
                    }}
                >
                    <img
                        src={img.src}
                        srcSet={img.srcSet}
                        alt={lg.alt || img.alt || ""}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onLoad={() => measureRef.current()}
                        style={{
                            height: effLogoH,
                            width: "auto",
                            display: "block",
                            objectFit: "contain",
                            pointerEvents: "none",
                        }}
                    />
                    {colorMode === "tint" ? (
                        <span
                            ref={(el) => {
                                if (el) tintsRef.current[idx] = el
                            }}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: tintColor,
                                opacity: 0,
                                pointerEvents: "none",
                                WebkitMaskImage: `url("${img.src}")`,
                                maskImage: `url("${img.src}")`,
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                                WebkitMaskPosition: "center",
                                maskPosition: "center",
                            }}
                        />
                    ) : null}
                </span>
            )
        return (
            <span
                style={{
                    fontSize: effLogoH * 0.78,
                    fontWeight: 600,
                    letterSpacing: "-0.015em",
                    lineHeight: 1,
                    color: colorMode === "tint" ? tintColor : labelColor,
                }}
            >
                {lg.label || lg.alt || `Logo ${i + 1}`}
            </span>
        )
    }

    const maskAxis = vertical ? "180deg" : "90deg"
    const maskStyle: React.CSSProperties = fade
        ? {
              WebkitMaskImage: `linear-gradient(${maskAxis}, transparent 0, #000 ${fadeAmount}%, #000 ${100 - fadeAmount}%, transparent 100%)`,
              maskImage: `linear-gradient(${maskAxis}, transparent 0, #000 ${fadeAmount}%, #000 ${100 - fadeAmount}%, transparent 100%)`,
          }
        : {}

    const hoverProps = {
        onMouseEnter: () => {
            hovering.current = true
        },
        onMouseLeave: () => {
            hovering.current = false
            hoverIndex.current = -1
        },
    }

    const itemHover = (i: number) =>
        hoverReveal
            ? {
                  onMouseEnter: () => {
                      hoverIndex.current = i
                  },
                  onMouseLeave: () => {
                      hoverIndex.current = -1
                  },
              }
            : {}

    if (isEmpty)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: radius,
                    border: `1px dashed ${itemBorderColor}`,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: labelColor,
                    opacity: 0.55,
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    ...style,
                }}
            >
                Add logos in the property panel
            </div>
        )

    return (
        <div
            ref={rootRef}
            {...hoverProps}
            {...dragHandlers}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                background: bg,
                borderRadius: radius,
                border: borderWidth
                    ? `${borderWidth}px solid ${borderColor}`
                    : undefined,
                perspective: effVariant === "depth" ? 1000 : undefined,
                cursor: canDrag ? "grab" : undefined,
                touchAction: canDrag
                    ? vertical
                        ? "pan-x"
                        : "pan-y"
                    : undefined,
                ...maskStyle,
                ...style,
            }}
        >
            <div
                key={isSwap ? "swap-layout" : "scroll-layout"}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle:
                        effVariant === "depth" ? "preserve-3d" : undefined,
                }}
            >
                {isSwap
                    ? Array.from({ length: slots }).map((_, s) => (
                          <div
                              key={s}
                              style={{
                                  position: "absolute",
                                  display: "grid",
                                  placeItems: "center",
                                  ...(vertical
                                      ? {
                                            left: 0,
                                            right: 0,
                                            top: `${(s / slots) * 100}%`,
                                            height: `${100 / slots}%`,
                                        }
                                      : {
                                            top: 0,
                                            bottom: 0,
                                            left: `${(s / slots) * 100}%`,
                                            width: `${100 / slots}%`,
                                        }),
                              }}
                          >
                              {list.map((lg, j) => {
                                  const i = s * list.length + j
                                  const Tag: any = lg && lg.link ? "a" : "div"
                                  const extra =
                                      lg && lg.link
                                          ? {
                                                href: lg.link,
                                                target: "_blank",
                                                rel: "noopener",
                                            }
                                          : {}
                                  return (
                                      <Tag
                                          key={j}
                                          {...extra}
                                          {...itemHover(i)}
                                          ref={(el: HTMLElement) => {
                                              if (el) nodesRef.current[i] = el
                                          }}
                                          style={{
                                              ...itemBase,
                                              opacity: 0,
                                              visibility: "hidden",
                                          }}
                                      >
                                          {renderLogo(lg, j, i)}
                                      </Tag>
                                  )
                              })}
                          </div>
                      ))
                    : Array.from({ length: reps }).flatMap((_, r) =>
                          list.map((lg, j) => {
                              const i = r * list.length + j
                              const Tag: any = lg && lg.link ? "a" : "div"
                              const extra =
                                  lg && lg.link
                                      ? {
                                            href: lg.link,
                                            target: "_blank",
                                            rel: "noopener",
                                        }
                                      : {}
                              return (
                                  <Tag
                                      key={i}
                                      {...extra}
                                      {...itemHover(i)}
                                      ref={(el: HTMLElement) => {
                                          if (el) nodesRef.current[i] = el
                                      }}
                                      style={itemBase}
                                  >
                                      {renderLogo(lg, j, i)}
                                  </Tag>
                              )
                          })
                      )}
            </div>
        </div>
    )
}

addPropertyControls(LogoScroll, {
    logos: {
        type: ControlType.Array,
        title: "Logos",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
                label: {
                    type: ControlType.String,
                    title: "Fallback",
                    placeholder: "Text if no image",
                },
            },
        },
        defaultValue: DEFAULT_LOGOS,
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    variant: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["marquee", "spotlight", "depth", "swap", "wave"],
        optionTitles: ["Marquee", "Spotlight", "Depth", "Swap", "Wave"],
        defaultValue: "spotlight",
    },
    mobileVariant: {
        type: ControlType.Enum,
        title: "Narrow",
        options: ["inherit", "marquee", "spotlight", "depth", "swap", "wave"],
        optionTitles: ["Same", "Marquee", "Spotlight", "Depth", "Swap", "Wave"],
        defaultValue: "swap",
        description: "Motion used below the breakpoint",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 810,
        min: 0,
        max: 1400,
        unit: "px",
        description: "Component width, not viewport",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Forward", "Back"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p: any) => p.variant === "swap",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 52,
        min: 0,
        max: 220,
        unit: "px/s",
        hidden: (p: any) => p.variant === "swap",
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        description: "Grab and flick, with momentum",
        hidden: (p: any) => p.variant === "swap",
    },
    scrollBoost: {
        type: ControlType.Number,
        title: "Scroll push",
        defaultValue: 0,
        min: 0,
        max: 3,
        step: 0.1,
        description: "Page scrolling speeds the row up",
        hidden: (p: any) => p.variant === "swap",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause hover",
        defaultValue: false,
        hidden: (p: any) => p.variant === "swap",
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo H",
        defaultValue: 26,
        min: 10,
        max: 80,
        unit: "px",
    },
    mobileLogoHeight: {
        type: ControlType.Number,
        title: "Narrow H",
        defaultValue: 0,
        min: 0,
        max: 80,
        unit: "px",
        description: "0 keeps the same height",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 64,
        min: 0,
        max: 240,
        unit: "px",
        description: "Space between logos, edge to edge",
        hidden: (p: any) => p.variant === "swap",
    },
    slotCount: {
        type: ControlType.Number,
        title: "Slots",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "How many logos are on screen at once. 0 fits the width",
        hidden: (p: any) => p.variant !== "swap",
    },
    focusWidth: {
        type: ControlType.Number,
        title: "Focus",
        defaultValue: 0.34,
        min: 0.1,
        max: 1,
        step: 0.02,
        hidden: (p: any) => p.variant !== "spotlight" && p.variant !== "wave",
    },
    restOpacity: {
        type: ControlType.Number,
        title: "Rest opacity",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.02,
        hidden: (p: any) =>
            p.variant === "swap" ||
            p.variant === "depth" ||
            p.variant === "spotlight",
    },
    dimOpacity: {
        type: ControlType.Number,
        title: "Dim opacity",
        defaultValue: 0.22,
        min: 0,
        max: 1,
        step: 0.02,
        hidden: (p: any) => p.variant !== "spotlight",
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Colour",
        options: ["none", "grayscale", "tint"],
        optionTitles: ["Original", "Grayscale", "Flat tint"],
        defaultValue: "grayscale",
        description:
            "Flat tint masks the logo, so multicolour marks go to one colour",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "#514A49",
        hidden: (p: any) => p.colorMode !== "tint",
    },
    treatAmount: {
        type: ControlType.Number,
        title: "Amount",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: any) => p.colorMode === "none",
    },
    hoverReveal: {
        type: ControlType.Boolean,
        title: "Reveal hover",
        defaultValue: true,
        description: "Restore original colour under the pointer",
        hidden: (p: any) => p.colorMode === "none",
    },
    itemStyle: {
        type: ControlType.Enum,
        title: "Item",
        options: ["bare", "chip", "card"],
        optionTitles: ["Bare", "Chip", "Card"],
        defaultValue: "bare",
        displaySegmentedControl: true,
    },
    itemFill: {
        type: ControlType.Color,
        title: "Item fill",
        defaultValue: "#FFFCFA",
        hidden: (p: any) => p.itemStyle === "bare",
    },
    itemBorderColor: {
        type: ControlType.Color,
        title: "Item border",
        defaultValue: "#D5CBCA",
        hidden: (p: any) => p.itemStyle === "bare",
    },
    itemRadius: {
        type: ControlType.Number,
        title: "Item radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        unit: "px",
        hidden: (p: any) => p.itemStyle !== "card",
    },
    itemPadX: {
        type: ControlType.Number,
        title: "Item pad X",
        defaultValue: 22,
        min: 0,
        max: 60,
        unit: "px",
        hidden: (p: any) => p.itemStyle === "bare",
    },
    itemPadY: {
        type: ControlType.Number,
        title: "Item pad Y",
        defaultValue: 12,
        min: 0,
        max: 40,
        unit: "px",
        hidden: (p: any) => p.itemStyle === "bare",
    },
    useHot: {
        type: ControlType.Boolean,
        title: "Highlight",
        defaultValue: true,
        hidden: (p: any) => p.itemStyle === "bare" || p.variant === "marquee",
    },
    hotFill: {
        type: ControlType.Color,
        title: "Highlight fill",
        defaultValue: "#EFFF63",
        hidden: (p: any) =>
            p.itemStyle === "bare" || p.variant === "marquee" || !p.useHot,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1A1F18",
        description: "Only used by text fallbacks",
    },
    bg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 80,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 0,
        min: 0,
        max: 6,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border color",
        defaultValue: "#D5CBCA",
        hidden: (p: any) => !p.borderWidth,
    },
    fade: { type: ControlType.Boolean, title: "Edge fade", defaultValue: true },
    fadeAmount: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 10,
        min: 0,
        max: 30,
        unit: "%",
        hidden: (p: any) => !p.fade,
    },
})
