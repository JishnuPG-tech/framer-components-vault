import * as React from "react"
import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react"
import { flushSync } from "react-dom"
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
    animate,
    useScroll,
    useMotionValueEvent,
    useReducedMotion,
    useSpring,
    useTransform,
    useMotionValue,
    useInView,
    MotionValue,
} from "framer-motion"

type Screen = {
    image?: { src?: string; srcSet?: string; alt?: string }
    title?: string
    alt?: string
}

interface Props {
    screens: Screen[]
    mode: "auto" | "scroll" | "autoplay"
    previewFrame: number
    scrollPerScreen: number
    frameWidth: number
    activeWidth: number
    counterLabel: string
    preset: "calm" | "bright" | "editorial" | "custom"
    bgColor: string
    borderColor: string
    activeBorderColor: string
    accentColor: string
    textColor: string
    mutedColor: string
    radius: number
    borderWidth: number
    activeBorderWidth: number
    showNumbers: boolean
    showCaption: boolean
    showFrameLabels: boolean
    showCounter: boolean
    titleFont?: React.CSSProperties
    numberFont?: React.CSSProperties
    style?: React.CSSProperties
}

type Theme = { bg: string; text: string; muted: string; border: string; activeBorder: string; accent: string; radius: number; mono: boolean }

// Secondary text darkened where needed so every preset passes WCAG AA (>= 4.5:1).
const PRESETS: Record<string, Theme> = {
    calm: { bg: "#F4F1EA", text: "#2C2C2A", muted: "#6E6D66", border: "#B4B2A9", activeBorder: "#2C2C2A", accent: "#2C2C2A", radius: 14, mono: false },
    bright: { bg: "#5B3BF5", text: "#FFFFFF", muted: "#E0DEFA", border: "#AFA9EC", activeBorder: "#FFD23F", accent: "#FFD23F", radius: 18, mono: false },
    editorial: { bg: "#111111", text: "#F1EFE8", muted: "#888780", border: "#444441", activeBorder: "#CCFF00", accent: "#CCFF00", radius: 0, mono: true },
}

const PHONE_RATIO = 19.5 / 9
const LABEL_FONT = "ui-monospace, SFMono-Regular, Menlo, monospace"

// Autoplay: a new frame every 2.2 s, the move itself takes 0.9 s (smoothstep).
const AUTOPLAY_INTERVAL = 2200
const AUTOPLAY_MOVE = 0.9

// One fixed image version instead of Framer's srcset: the long side is limited to 2048 px
// (about 946 px wide for a phone screen), enough for the active frame at 3x. Other URLs stay as they are.
const imageSrc = (src: string) =>
    /framerusercontent\.com\/images\//.test(src) && !/[?&]scale-down-to=/.test(src)
        ? src + (src.includes("?") ? "&" : "?") + "scale-down-to=2048"
        : src
const pad = (n: number) => String(n).padStart(2, "0")
const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))
const smoothstep = (t: number) => t * t * (3 - 2 * t)

// Position easing: the first and last 20% of every segment between two frames is a hold (the frame
// stands still), the middle 60% is a smoothstep move to the next frame. 40% of the scroll is hold.
const HOLD = 0.2
const easePosition = (p: number) => {
    const k = Math.floor(p)
    const t = clamp((p - k - HOLD) / (1 - 2 * HOLD), 0, 1)
    return k + smoothstep(t)
}

// Width of frame j while the strip position is v: aw at distance 0, fw at distance 1 or more, linear in between.
const widthAt = (j: number, v: number, aw: number, fw: number) =>
    aw - (aw - fw) * Math.min(Math.abs(j - v), 1)

// Distance between the centers of frames m and m + 1. Neighbours always keep the same visible gap.
const stepBetween = (m: number, v: number, aw: number, fw: number, gap: number) =>
    (widthAt(m, v, aw, fw) + widthAt(m + 1, v, aw, fw)) / 2 + gap

// Center of frame j measured from the center of frame 0 (j can be negative for the looping autoplay strip).
const centerFromFirst = (j: number, v: number, aw: number, fw: number, gap: number) => {
    let x = 0
    if (j >= 0) for (let m = 0; m < j; m++) x += stepBetween(m, v, aw, fw, gap)
    else for (let m = j; m < 0; m++) x -= stepBetween(m, v, aw, fw, gap)
    return x
}

// Where position v lies along the strip: the frame centers interpolated by the fractional part of v.
const stripOffset = (v: number, maxP: number, aw: number, fw: number, gap: number) => {
    const t = clamp(v, 0, maxP)
    const k = Math.floor(t)
    const k2 = Math.min(k + 1, maxP)
    const a = centerFromFirst(k, v, aw, fw, gap)
    const b = centerFromFirst(k2, v, aw, fw, gap)
    return a + (t - k) * (b - a)
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// True when the page can really be scrolled through the section. Call it while the section has its
// tall scroll layout: it fails when scrolling is locked or an ancestor clips the section.
function canScrollThrough(el: HTMLElement) {
    if (typeof window === "undefined") return true
    const vh = window.innerHeight
    const rect = el.getBoundingClientRect()
    if (el.offsetHeight <= vh + 1) return false
    const html = document.documentElement
    const locks = (e: Element) => /hidden|clip/.test(window.getComputedStyle(e).overflowY)
    if (locks(html)) return false
    if (window.getComputedStyle(html).overflowY === "visible" && locks(document.body)) return false
    for (let a = el.parentElement; a && a !== document.body && a !== html; a = a.parentElement) {
        if (window.getComputedStyle(a).overflowY === "visible") continue
        const ar = a.getBoundingClientRect()
        if (ar.bottom < rect.bottom - 1 || ar.top > rect.top + 1) return false
    }
    const se = document.scrollingElement || html
    return se.scrollHeight >= rect.top + window.scrollY + el.offsetHeight - 1
}

type StripProps = {
    p: MotionValue<number>
    maxP: number
    aw: number
    fw: number
    gap: number
    top: number
    children?: React.ReactNode
}

// The film strip: one layer that slides by -position. will-change is set once and never toggled.
function Strip({ p, maxP, aw, fw, gap, top, children }: StripProps) {
    const x = useTransform(p, (v) => -stripOffset(v, maxP, aw, fw, gap))
    return (
        <motion.div
            style={{ position: "absolute", left: "50%", top, width: 0, height: 0, x, willChange: "transform" }}
        >
            {children}
        </motion.div>
    )
}

type FrameItemProps = {
    i: number
    screenIndex: number
    p: MotionValue<number>
    screen: Screen
    aw: number
    fw: number
    ah: number
    gap: number
    isActive: boolean
    showLabel: boolean
    c: Theme
    placeholder: string
    bw: number
    abw: number
    hideInactive: boolean
    content: React.ReactNode
}

// One frame. Position, scale and opacity follow the distance |i - p|. Frames are drawn at the
// active size and only scaled down, so the frame that is in focus is never enlarged.
function FrameItem(props: FrameItemProps) {
    const { i, screenIndex, p, screen, aw, fw, ah, gap, isActive, showLabel, c, placeholder, bw, abw, hideInactive, content } = props
    const r = fw / aw
    const x = useTransform(p, (v) => centerFromFirst(i, v, aw, fw, gap))
    const scale = useTransform(p, (v) => widthAt(i, v, aw, fw) / aw)
    const opacity = useTransform(p, (v) => 1 - 0.22 * Math.min(Math.abs(i - v), 1))
    const labelX = useTransform(p, (v) => Math.round(-widthAt(i, v, aw, fw) / 2))
    const labelY = useTransform(p, (v) => Math.round(-((ah * widthAt(i, v, aw, fw)) / aw) / 2) - 22)
    return (
        <motion.div
            aria-hidden={hideInactive && !isActive ? true : undefined}
            style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, x }}
        >
            {showLabel && (
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        whiteSpace: "nowrap",
                        fontFamily: LABEL_FONT,
                        fontSize: 12,
                        lineHeight: "14px",
                        letterSpacing: "0.02em",
                        color: isActive ? c.text : c.muted,
                        x: labelX,
                        y: labelY,
                    }}
                >
                    {pad(screenIndex + 1) + (screen.title ? " · " + screen.title : "")}
                </motion.div>
            )}
            <motion.div
                style={{
                    position: "absolute",
                    left: Math.round(-aw / 2),
                    top: Math.round(-ah / 2),
                    width: aw,
                    height: ah,
                    borderRadius: isActive ? c.radius : c.radius / r,
                    border: (isActive ? abw : bw / r) + "px solid " + (isActive ? c.activeBorder : c.border),
                    background: placeholder,
                    overflow: "hidden",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    scale,
                    opacity,
                }}
            >
                {content}
            </motion.div>
        </motion.div>
    )
}

/**
 * Contact Sheet Phone
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ContactSheetPhone(props: Props) {
    const {
        screens: rawScreens,
        mode,
        previewFrame,
        scrollPerScreen,
        frameWidth,
        activeWidth,
        counterLabel,
        preset,
        radius,
        borderWidth,
        activeBorderWidth,
        showNumbers,
        showCaption,
        showFrameLabels,
        showCounter,
        titleFont,
        numberFont,
        style,
    } = props
    const screens = rawScreens && rawScreens.length ? rawScreens.slice(0, 8) : DEFAULT_SCREENS
    const n = screens.length
    const c: Theme =
        preset === "custom"
            ? {
                  bg: props.bgColor,
                  text: props.textColor,
                  muted: props.mutedColor,
                  border: props.borderColor,
                  activeBorder: props.activeBorderColor,
                  accent: props.accentColor,
                  radius: radius,
                  mono: false,
              }
            : PRESETS[preset] || PRESETS.calm
    const placeholder = "color-mix(in srgb, " + c.border + " 35%, " + c.bg + ")"
    const bw = Math.max(0, borderWidth)
    const abw = Math.max(0, activeBorderWidth)
    const numStyle: React.CSSProperties = {
        fontFamily: c.mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "system-ui, sans-serif",
        fontSize: 14,
        lineHeight: 1,
        ...(numberFont || {}),
    }

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduce = useReducedMotion()
    const sectionRef = useRef<HTMLDivElement>(null)
    // Rounded strip position. Scroll: 0..n-1. Autoplay: 0..n (n is the looping copy of frame 0).
    const [activeV, setActiveV] = useState(0)
    // Mobile layout is based on the component's own width, not the window.
    const [isMobile, setIsMobile] = useState(false)
    // Component width and small-viewport height (svh): they size the mobile frames.
    const [box, setBox] = useState({ w: 0, svh: 0 })
    const probeRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = sectionRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const probe = probeRef.current
        const update = () => {
            const w = Math.round(el.getBoundingClientRect().width)
            const svh = Math.round((probe && probe.getBoundingClientRect().height) || window.innerHeight)
            setBox((prev) => (prev.w === w && prev.svh === svh ? prev : { w, svh }))
            const m = w < 768
            setIsMobile((prev) => (prev === m ? prev : m))
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        if (probe) ro.observe(probe)
        return () => ro.disconnect()
    }, [])

    const nRef = useRef(n)
    nRef.current = n

    // ---- Mode: Scroll, Autoplay, or Auto (Scroll when the page can be scrolled through the section) ----
    const [resolved, setResolved] = useState<"scroll" | "autoplay">("scroll")
    const [probing, setProbing] = useState(true)
    // While probing, the tall scroll layout is rendered so the check measures the real thing.
    const layoutMode: "scroll" | "autoplay" =
        mode === "scroll" ? "scroll" : mode === "autoplay" ? "autoplay" : probing ? "scroll" : resolved
    const liveAutoplay = layoutMode === "autoplay" && !isCanvas
    const layoutRef = useRef(layoutMode)
    layoutRef.current = layoutMode
    useIsoLayoutEffect(() => {
        if (mode !== "auto" || !probing) return
        const el = sectionRef.current
        setResolved(isCanvas || !el || canScrollThrough(el) ? "scroll" : "autoplay")
        setProbing(false)
    }, [probing, mode, isCanvas])
    // Check again when the mode or the scroll length changes, and after window resizes.
    useEffect(() => {
        if (mode === "auto") setProbing(true)
    }, [mode, n, scrollPerScreen])
    useEffect(() => {
        if (mode !== "auto" || typeof window === "undefined") return
        let timer = 0
        const onResize = () => {
            window.clearTimeout(timer)
            timer = window.setTimeout(() => flushSync(() => setProbing(true)), 150)
        }
        window.addEventListener("resize", onResize)
        return () => {
            window.clearTimeout(timer)
            window.removeEventListener("resize", onResize)
        }
    }, [mode])

    // ---- Scroll position ----
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    })
    // Light spring on the progress itself (slightly over-damped, no overshoot). Nothing is sprung by frame number.
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 220, damping: 31, mass: 1, restDelta: 0.0001 })
    // Fractional frame position (eased, with holds): 0 = first frame, n - 1 = last frame.
    const toPosition = (v: number) => (nRef.current > 1 ? easePosition(clamp(v, 0, 1) * (nRef.current - 1)) : 0)
    const pSmooth = useTransform(smoothProgress, toPosition)
    const pRaw = useTransform(scrollYProgress, toPosition)
    // Caption, timeline number and title follow the rounded position.
    useMotionValueEvent(reduce ? pRaw : pSmooth, "change", (v) => {
        if (layoutRef.current !== "scroll") return
        const i = clamp(Math.round(v), 0, nRef.current - 1)
        setActiveV((prev) => (prev === i ? prev : i))
    })

    // ---- Autoplay position ----
    const autoMV = useMotionValue(0)
    const targetRef = useRef(0)
    const animRef = useRef<ReturnType<typeof animate> | null>(null)
    useMotionValueEvent(autoMV, "change", (v) => {
        if (layoutRef.current !== "autoplay") return
        const i = clamp(Math.round(v), 0, nRef.current)
        setActiveV((prev) => (prev === i ? prev : i))
    })
    const moveAuto = useCallback(
        (target: number, duration: number) => {
            if (animRef.current) animRef.current.stop()
            targetRef.current = target
            animRef.current = animate(autoMV, target, {
                duration,
                ease: smoothstep,
                onComplete: () => {
                    // Past the last frame we are on the copy of frame 0: step back to the real one, nothing changes visually.
                    if (targetRef.current >= nRef.current) {
                        targetRef.current -= nRef.current
                        autoMV.set(targetRef.current)
                    }
                },
            })
        },
        [autoMV]
    )
    useEffect(() => () => {
        if (animRef.current) animRef.current.stop()
    }, [])
    // Start from the first frame when the mode really changes (not while the check runs).
    useEffect(() => {
        setActiveV(0)
        autoMV.set(0)
        targetRef.current = 0
        if (animRef.current) animRef.current.stop()
    }, [mode, resolved, autoMV])

    const [hovered, setHovered] = useState(false)
    const [kbFocus, setKbFocus] = useState(false)
    const [tick, setTick] = useState(0)
    const inView = useInView(sectionRef, { amount: 0.2 })
    // Paused on hover, on keyboard focus and while off screen. No automatic change with reduced motion.
    const playing = liveAutoplay && !reduce && n > 1 && !hovered && !kbFocus && inView
    useEffect(() => {
        if (!playing) return
        const id = window.setInterval(() => moveAuto(targetRef.current + 1, AUTOPLAY_MOVE), AUTOPLAY_INTERVAL)
        return () => window.clearInterval(id)
    }, [playing, moveAuto, tick])

    const vActive = isCanvas ? clamp((previewFrame || 1) - 1, 0, n - 1) : activeV
    const active = ((vActive % n) + n) % n

    // Canvas and reduced motion show whole frames: the position jumps to the frame number, no animation.
    const stepP = useMotionValue(vActive)
    useEffect(() => {
        stepP.set(vActive)
    }, [vActive, stepP])
    const pDisplay = isCanvas || reduce ? stepP : liveAutoplay ? autoMV : pSmooth

    const goTo = useCallback(
        (i: number) => {
            if (liveAutoplay) {
                if (reduce) {
                    setActiveV(i)
                    return
                }
                let cur = autoMV.get()
                if (cur >= nRef.current) {
                    cur -= nRef.current
                    autoMV.set(cur)
                }
                const dist = Math.abs(i - cur)
                if (dist < 0.01) return
                moveAuto(i, clamp(0.5 + 0.2 * dist, 0.7, 1.4))
                setTick((t) => t + 1)
                return
            }
            const el = sectionRef.current
            if (!el || typeof window === "undefined") return
            const top = el.getBoundingClientRect().top + window.scrollY
            const range = el.offsetHeight - window.innerHeight
            window.scrollTo({
                top: top + (n > 1 ? i / (n - 1) : 0) * Math.max(range, 0),
                behavior: reduce ? "auto" : "smooth",
            })
        },
        [n, reduce, liveAutoplay, autoMV, moveAuto]
    )

    const dFw = Math.max(40, frameWidth)
    const dAw = Math.max(dFw, activeWidth)
    // Mobile: a larger frame in the middle, neighbours at 0.8 scale showing PEEK px from each side.
    const PEEK = 36
    const mw = box.w || 390
    const msvh = box.svh || 800
    const mAw = Math.round(Math.min(0.64 * mw, (msvh - 260) / PHONE_RATIO, 280))
    // Frames are drawn at the active size. Only inactive frames are scaled down (scale < 1),
    // so the active frame is never enlarged by a transform and stays sharp.
    const aw = isMobile ? mAw : dAw
    const fw = isMobile ? Math.round(mAw * 0.8) : dFw
    const ah = Math.round(aw * PHONE_RATIO)
    // Same visible gap between every pair of neighbours at every scroll position.
    const GAP = isMobile ? Math.max(12, Math.round((mw - mAw) / 2 - PEEK)) : 32
    const LABEL_SPACE = !isMobile && showFrameLabels ? 30 : 0
    // Autoplay runs in a loop: extra copies on both sides keep the strip full when it wraps around.
    const loop = liveAutoplay
    const K = loop ? Math.ceil((box.w || 1200) / 2 / (fw + GAP)) + 1 : 0
    const maxP = loop ? n : n - 1
    const items: number[] = []
    for (let j = -K; j <= (loop ? n + K : n - 1); j++) items.push(j)
    // Remount the strip when its geometry changes so every transform is rebuilt with the new values.
    const stripKey = [n, aw, fw, ah, GAP, LABEL_SPACE, K, reduce ? 1 : 0, isCanvas ? 1 : 0].join("-")
    const current = screens[active] || {}
    const uid = "csp"
    // Mobile: with 6+ screens split numbers into two rows that differ by at most 1.
    const breakAfter = isMobile && n >= 6 ? Math.ceil(n / 2) - 1 : -1

    const renderContent = (s: Screen, i: number) => {
        const src = s.image && s.image.src
        return src ? (
            <img
                src={imageSrc(src)}
                alt={s.alt || s.title || ""}
                loading={i === 0 ? "eager" : "lazy"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
        ) : (
            <span aria-hidden="true" style={{ font: "500 13px/1 system-ui, sans-serif", color: c.muted }}>
                {pad(i + 1)}
            </span>
        )
    }

    const stage = (
        <div
            style={{
                position: isCanvas || liveAutoplay ? "relative" : "sticky",
                top: 0,
                height: isCanvas ? "100%" : liveAutoplay ? "auto" : "100vh",
                minHeight: liveAutoplay ? "100%" : undefined,
                boxSizing: "border-box",
                padding: liveAutoplay ? "40px 0" : 0,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 32,
                overflow: "hidden",
            }}
        >
            <style>{"." + uid + "-num:focus-visible{outline:2px solid " + c.accent + ";outline-offset:3px}"}</style>
            {/* Film strip: the same continuous strip on desktop and mobile */}
            <div style={{ height: ah + LABEL_SPACE, width: "100%", position: "relative" }}>
                <Strip key={stripKey} p={pDisplay} maxP={maxP} aw={aw} fw={fw} gap={GAP} top={LABEL_SPACE + Math.round(ah / 2)}>
                    {items.map((j) => {
                        const idx = ((j % n) + n) % n
                        return (
                            <FrameItem
                                key={j}
                                i={j}
                                screenIndex={idx}
                                p={pDisplay}
                                screen={screens[idx]}
                                aw={aw}
                                fw={fw}
                                ah={ah}
                                gap={GAP}
                                isActive={j === vActive}
                                showLabel={showFrameLabels && !isMobile}
                                hideInactive={isMobile}
                                c={c}
                                placeholder={placeholder}
                                bw={bw}
                                abw={abw}
                                content={renderContent(screens[idx], idx)}
                            />
                        )
                    })}
                </Strip>
            </div>

            {/* Timeline */}
            {showNumbers && (
            <nav aria-label="Frames" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4, padding: "0 16px" }}>
                {screens.map((s, i) => {
                    const isActive = i === active
                    return (
                        <React.Fragment key={i}>
                        <button
                            type="button"
                            className={uid + "-num"}
                            aria-current={isActive ? "true" : undefined}
                            aria-label={counterLabel + " " + (i + 1) + (s.title ? ": " + s.title : "")}
                            onClick={() => goTo(i)}
                            style={{
                                appearance: "none",
                                background: "transparent",
                                border: "none",
                                borderBottom: "2px solid " + (isActive ? c.accent : "transparent"),
                                ...numStyle,
                                padding: "8px 10px",
                                minWidth: 44,
                                minHeight: 44,
                                cursor: "pointer",
                                fontWeight: isActive ? 700 : 400,
                                fontVariantNumeric: "tabular-nums",
                                color: isActive ? c.text : c.muted,
                            }}
                        >
                            {pad(i + 1)}
                        </button>
                        {breakAfter === i && <span aria-hidden="true" style={{ flexBasis: "100%", height: 0 }} />}
                        </React.Fragment>
                    )
                })}
            </nav>
            )}

            {/* Caption */}
            {showCaption && (
            <div style={{ textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
                {showCounter && (
                    <div style={{ fontSize: 13, color: c.muted, fontVariantNumeric: "tabular-nums", fontFamily: numStyle.fontFamily }}>
                        {counterLabel} {pad(active + 1)} / {pad(n)}
                    </div>
                )}
                <div aria-live={liveAutoplay ? "off" : "polite"} style={{ marginTop: showCounter ? 6 : 0, fontSize: 22, fontWeight: 600, lineHeight: 1.2, ...(titleFont || {}), color: c.text }}>
                    {current.title || ""}
                </div>
            </div>
            )}
        </div>
    )

    return (
        <section
            ref={sectionRef}
            onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHovered(true)
            }}
            onPointerLeave={() => setHovered(false)}
            onFocus={(e) => {
                if (e.target.matches && e.target.matches(":focus-visible")) setKbFocus(true)
            }}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKbFocus(false)
            }}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                ...(isCanvas ? { height: 760 } : liveAutoplay ? {} : { height: n * Math.max(scrollPerScreen, 20) + "vh" }),
                background: c.bg,
            }}
        >
            <div
                ref={probeRef}
                aria-hidden="true"
                style={{ position: "absolute", top: 0, left: 0, width: 1, height: "100svh", opacity: 0, pointerEvents: "none" }}
            />
            {stage}
        </section>
    )
}

// Shown when the Screens list is empty: five app screens already uploaded to Framer.
const SCREEN_URL = (id: string) => "https://framerusercontent.com/images/" + id + ".png?scale-down-to=2048"
const DEFAULT_SCREENS: Screen[] = [
    {
        title: "Today",
        alt: "Today screen for Thursday, October 30, with a week strip and four events: Write brief, Lunch with Leo, Focus block and Pottery class.",
        image: { src: SCREEN_URL("I28xDpVPnfp6DmAkXu39L5iCCk") },
    },
    {
        title: "Week",
        alt: "Week view for October 27 to November 2, with 12 events listed by day, four of them on Thursday.",
        image: { src: SCREEN_URL("Y5Hn37JHbRhce6XW6MbhwL4suSY") },
    },
    {
        title: "Focus",
        alt: "Focus screen with a running timer at 24:18, a progress bar, Pause and End early buttons, and two events coming up next.",
        image: { src: SCREEN_URL("a7G6sY6wpF6TIJpmk9bxpe5lSEE") },
    },
    {
        title: "Small things",
        alt: "Small things list with five open tasks, such as Reply to Marta and Renew library book, and three finished tasks.",
        image: { src: SCREEN_URL("d8jYWL9ge6Di6ByvzRGD5jQ7q8") },
    },
    {
        title: "Review",
        alt: "Weekly review at step 3 of 4, with two finished steps, three priority chips and a Continue button.",
        image: { src: SCREEN_URL("qQlmRTzDtJcceFUJozy4bxSwUk") },
    },
]

ContactSheetPhone.defaultProps = {
    screens: DEFAULT_SCREENS,
    mode: "auto",
    previewFrame: 2,
    scrollPerScreen: 100,
    frameWidth: 140,
    activeWidth: 210,
    counterLabel: "Frame",
    preset: "calm",
    bgColor: "#F4F1EA",
    borderColor: "#B4B2A9",
    activeBorderColor: "#2C2C2A",
    accentColor: "#2C2C2A",
    textColor: "#2C2C2A",
    mutedColor: "#6E6D66",
    radius: 14,
    borderWidth: 1,
    activeBorderWidth: 2,
    showNumbers: true,
    showCaption: true,
    showFrameLabels: true,
    showCounter: false,
}

addPropertyControls(ContactSheetPhone, {
    screens: {
        type: ControlType.Array,
        title: "Screens",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Screen" },
                alt: { type: ControlType.String, title: "Alt text", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_SCREENS,
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["auto", "scroll", "autoplay"],
        optionTitles: ["Auto", "Scroll", "Autoplay"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    previewFrame: {
        type: ControlType.Number,
        title: "Preview frame",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        defaultValue: 2,
    },
    frameWidth: { type: ControlType.Number, title: "Frame size", min: 60, max: 300, unit: "px", defaultValue: 140 },
    activeWidth: { type: ControlType.Number, title: "Active size", min: 60, max: 400, unit: "px", defaultValue: 210 },
    scrollPerScreen: {
        type: ControlType.Number,
        title: "Scroll / screen",
        min: 20,
        max: 300,
        unit: "%",
        defaultValue: 100,
        hidden: (p: Props) => p.mode === "autoplay",
    },
    counterLabel: { type: ControlType.String, title: "Counter label", defaultValue: "Frame" },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["calm", "bright", "editorial", "custom"],
        optionTitles: ["Calm", "Bright", "Editorial", "Custom"],
        defaultValue: "calm",
    },
    bgColor: { type: ControlType.Color, title: "Background", defaultValue: "#F4F1EA", hidden: (p: Props) => p.preset !== "custom" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#B4B2A9", hidden: (p: Props) => p.preset !== "custom" },
    activeBorderColor: { type: ControlType.Color, title: "Active border", defaultValue: "#2C2C2A", hidden: (p: Props) => p.preset !== "custom" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#2C2C2A", hidden: (p: Props) => p.preset !== "custom" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#2C2C2A", hidden: (p: Props) => p.preset !== "custom" },
    mutedColor: { type: ControlType.Color, title: "Muted text", defaultValue: "#6E6D66", hidden: (p: Props) => p.preset !== "custom" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, unit: "px", defaultValue: 14, hidden: (p: Props) => p.preset !== "custom" },
    borderWidth: { type: ControlType.Number, title: "Border", min: 0, max: 8, step: 0.5, unit: "px", defaultValue: 1 },
    activeBorderWidth: { type: ControlType.Number, title: "Active border", min: 0, max: 8, step: 0.5, unit: "px", defaultValue: 2 },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    showCaption: { type: ControlType.Boolean, title: "Caption", defaultValue: true },
    showFrameLabels: { type: ControlType.Boolean, title: "Frame labels", defaultValue: true },
    showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: false },
    titleFont: { type: ControlType.Font, title: "Title font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 22, variant: "Semibold" } },
    numberFont: { type: ControlType.Font, title: "Number font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 14 } },
})
