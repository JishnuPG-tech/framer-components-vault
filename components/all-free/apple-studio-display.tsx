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
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type Slide = {
    kind?: "image" | "video"
    image?: { src?: string; alt?: string } | string
    imageUrl?: string
    video?: string
    videoUrl?: string
    cover?: { src?: string } | string
    coverUrl?: string
    title?: string
    link?: string
}

type Finish =
    | "silver"
    | "graphite"
    | "midnight"
    | "champagne"
    | "blush"
    | "sage"
    | "lagoon"
    | "terracotta"
    | "custom"

type Props = {
    slides?: Slide[]
    finish?: Finish
    customFinish?: { shell?: string; glow?: string; accent?: string }
    hardware?: {
        glass?: "auto" | "dark" | "light"
        mount?: "pedestal" | "arm" | "float"
        corner?: number
        reflection?: boolean
        halo?: boolean
        groundShadow?: boolean
    }
    motion?: {
        autoplay?: boolean
        hold?: number
        holdOnHover?: boolean
        effect?: "dissolve" | "push" | "bloom" | "curtain"
        pace?: number
        wakeUp?: boolean
    }
    overlay?: {
        arrows?: boolean
        segments?: boolean
        counter?: boolean
        text?: boolean
        tapPulse?: boolean
        linkLabel?: string
        newTab?: boolean
    }
    headingFont?: Record<string, any>
    bodyFont?: Record<string, any>
    textColor?: string
    style?: CSSProperties
}

/* ---------------------------------------------------------------- colour */

function toRGB(input: string | undefined): [number, number, number, number] {
    if (!input) return [128, 128, 128, 1]
    const v = input.trim()
    if (v.startsWith("#")) {
        let h = v.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    const m = v.match(/[\d.]+/g)
    if (m && m.length >= 3)
        return [+m[0], +m[1], +m[2], m[3] !== undefined ? +m[3] : 1]
    return [128, 128, 128, 1]
}

function tint(c: string, toward: "white" | "black", t: number, alpha = 1) {
    const [r, g, b] = toRGB(c)
    const end = toward === "white" ? 255 : 0
    const f = (x: number) => Math.round(x + (end - x) * t)
    return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`
}

function luminance(c: string) {
    const [r, g, b] = toRGB(c)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

type Palette = { shell: string; glow: string; accent: string; pale?: boolean }

const FINISHES: Record<Exclude<Finish, "custom">, Palette> = {
    silver: { shell: "#c8cacd", glow: "#9fb4d6", accent: "#ffffff" },
    graphite: { shell: "#3b3c40", glow: "#6d7380", accent: "#f2f2f2" },
    midnight: { shell: "#26324b", glow: "#4a6cc2", accent: "#cfe0ff" },
    champagne: {
        shell: "#dccaa9",
        glow: "#e9c98f",
        accent: "#fff6e4",
        pale: true,
    },
    blush: { shell: "#e4bcb2", glow: "#f0a1a0", accent: "#fff0ec", pale: true },
    sage: { shell: "#aebba5", glow: "#9fc59a", accent: "#f2fbef", pale: true },
    lagoon: { shell: "#4c7f97", glow: "#3fb7d4", accent: "#e2f8ff" },
    terracotta: { shell: "#b5643f", glow: "#ff8a52", accent: "#fff1e8" },
}

/* --------------------------------------------------------------- helpers */

const pickSrc = (v: any) => (typeof v === "string" ? v : v?.src || "")

function resolve(slide: Slide) {
    const isVideo = slide.kind === "video"
    const media = isVideo
        ? slide.videoUrl?.trim() || slide.video || ""
        : slide.imageUrl?.trim() || pickSrc(slide.image)
    const cover = slide.coverUrl?.trim() || pickSrc(slide.cover)
    return { isVideo, media, cover }
}

// Geometry (all in % of display width, i.e. cqw units inside the device)
const BODY_H = 61.6
const MOUNT_H: Record<string, number> = { pedestal: 18.4, arm: 18.4, float: 0 }

function deviceStyles(p: Palette, h: Required<NonNullable<Props["hardware"]>>) {
    const glassDark =
        h.glass === "dark"
            ? true
            : h.glass === "light"
              ? false
              : p.pale === undefined
                ? luminance(p.shell) < 0.82
                : !p.pale
    const glass = glassDark ? "#0b0b0c" : "#f4f2ee"
    const ratio = (BODY_H + MOUNT_H[h.mount] + 3) / 100
    const rimR = Math.max(0, h.corner)
    const shellHi = tint(p.shell, "white", 0.45)
    const shellLo = tint(p.shell, "black", 0.28)

    return {
        glassDark,
        stage: {
            position: "relative",
            width: "100%",
            height: "100%",
            containerType: "size",
            fontFamily: "Inter, system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
        } as CSSProperties,
        halo: {
            position: "absolute",
            left: "50%",
            top: "42%",
            width: "110%",
            height: "90%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(closest-side, ${tint(p.glow, "white", 0, 0.42)}, ${tint(p.glow, "white", 0, 0)})`,
            pointerEvents: "none",
        } as CSSProperties,
        device: {
            position: "relative",
            width: `min(94cqw, calc(94cqh / ${ratio.toFixed(3)}))`,
            containerType: "inline-size",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
        } as CSSProperties,
        body: {
            position: "relative",
            width: "100%",
            height: `${BODY_H}cqw`,
            borderRadius: `${rimR}px`,
            padding: "0.5cqw",
            boxSizing: "border-box",
            background: `linear-gradient(160deg, ${shellHi} 0%, ${p.shell} 38%, ${shellLo} 100%)`,
            boxShadow: `0 0.15cqw 0 ${tint(p.shell, "white", 0.7, 0.6)} inset, 0 2.4cqw 4.8cqw -1.6cqw rgba(0,0,0,0.38)`,
            zIndex: 2,
        } as CSSProperties,
        glass: {
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: `${Math.max(0, rimR - 2)}px`,
            background: glass,
            padding: "2cqw",
            boxSizing: "border-box",
        } as CSSProperties,
        lens: {
            position: "absolute",
            top: "0.85cqw",
            left: "50%",
            width: "0.55cqw",
            height: "0.55cqw",
            transform: "translateX(-50%)",
            borderRadius: "50%",
            background: glassDark
                ? "radial-gradient(circle at 35% 35%, #3b4a63 0%, #121418 60%)"
                : "radial-gradient(circle at 35% 35%, #8c96a8 0%, #2a2d33 60%)",
            boxShadow: "0 0 0 0.12cqw rgba(127,127,127,0.18)",
        } as CSSProperties,
        screen: {
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "#08090b",
            borderRadius: `${Math.max(0, rimR - 6) * 0.35}px`,
            outline: "none",
        } as CSSProperties,
        sheen: {
            position: "absolute",
            inset: 0,
            background:
                "linear-gradient(118deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 26%, rgba(255,255,255,0) 27%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
            zIndex: 30,
        } as CSSProperties,
        // pedestal
        neck: {
            position: "relative",
            width: "22cqw",
            height: "17cqw",
            marginTop: "-0.8cqw",
            background: `linear-gradient(180deg, ${tint(p.shell, "black", 0.42)} 0%, ${shellLo} 12%, ${p.shell} 55%, ${shellHi} 92%, ${tint(p.shell, "black", 0.3)} 100%)`,
            clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0 100%)",
            zIndex: 1,
        } as CSSProperties,
        foot: {
            width: "25cqw",
            height: "1.4cqw",
            borderRadius: "0 0 0.7cqw 0.7cqw",
            background: `linear-gradient(90deg, ${shellLo} 0%, ${shellHi} 8%, ${p.shell} 50%, ${shellHi} 92%, ${shellLo} 100%)`,
            boxShadow: `0 -0.12cqw 0 ${tint(p.shell, "white", 0.65)} inset`,
            zIndex: 1,
        } as CSSProperties,
        // arm
        pole: {
            width: "4.2cqw",
            height: "16.6cqw",
            marginTop: "-0.4cqw",
            background: `linear-gradient(90deg, ${shellLo} 0%, ${shellHi} 40%, ${p.shell} 70%, ${shellLo} 100%)`,
            borderRadius: "0 0 0.5cqw 0.5cqw",
            zIndex: 1,
        } as CSSProperties,
        disc: {
            width: "20cqw",
            height: "2.2cqw",
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 30%, ${shellHi} 0%, ${p.shell} 55%, ${shellLo} 100%)`,
            marginTop: "-0.9cqw",
            zIndex: 0,
        } as CSSProperties,
        ground: {
            width: h.mount === "float" ? "70cqw" : "34cqw",
            height: "2.6cqw",
            marginTop: h.mount === "float" ? "2cqw" : "-1cqw",
            borderRadius: "50%",
            background:
                "radial-gradient(closest-side, rgba(0,0,0,0.32), rgba(0,0,0,0))",
            zIndex: 0,
        } as CSSProperties,
    }
}

function fontWeightOf(f: Record<string, any> | undefined, fallback: number) {
    if (!f) return fallback
    if (f.fontWeight) return f.fontWeight
    return fallback
}

/* ----------------------------------------------------------- defaults */

const SAMPLE: Slide[] = [
    {
        kind: "image",
        imageUrl:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
        title: "Where the Ridge Meets the Sky",
        link: "",
    },
    {
        kind: "video",
        videoUrl:
            "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        title: "Made to Move",
        link: "",
    },
    {
        kind: "image",
        imageUrl:
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80",
        title: "Hush of the Valley",
        link: "",
    },
    {
        kind: "image",
        imageUrl:
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80",
        title: "Glass-Still Evening",
        link: "",
    },
]

function useSettings(props: Props) {
    const palette: Palette =
        props.finish === "custom"
            ? {
                  shell: props.customFinish?.shell || "#c8cacd",
                  glow: props.customFinish?.glow || "#9fb4d6",
                  accent: props.customFinish?.accent || "#ffffff",
              }
            : FINISHES[props.finish || "silver"] || FINISHES.silver
    const hw = {
        glass: props.hardware?.glass ?? "auto",
        mount: props.hardware?.mount ?? "pedestal",
        corner: props.hardware?.corner ?? 14,
        reflection: props.hardware?.reflection ?? true,
        halo: props.hardware?.halo ?? true,
        groundShadow: props.hardware?.groundShadow ?? true,
    } as Required<NonNullable<Props["hardware"]>>
    const mo = {
        autoplay: props.motion?.autoplay ?? true,
        hold: props.motion?.hold ?? 4.5,
        holdOnHover: props.motion?.holdOnHover ?? true,
        effect: props.motion?.effect ?? "bloom",
        pace: props.motion?.pace ?? 0.7,
        wakeUp: props.motion?.wakeUp ?? true,
    }
    const ov = {
        arrows: props.overlay?.arrows ?? true,
        segments: props.overlay?.segments ?? true,
        counter: props.overlay?.counter ?? false,
        text: props.overlay?.text ?? true,
        tapPulse: props.overlay?.tapPulse ?? true,
        linkLabel: props.overlay?.linkLabel ?? "Explore",
        newTab: props.overlay?.newTab ?? true,
    }
    const slides = props.slides && props.slides.length ? props.slides : SAMPLE
    return { palette, hw, mo, ov, slides }
}

/* ======================================================== export entry */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Lumiere(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillDisplay {...props} />
    return <LiveDisplay {...props} />
}

/* ======================================================== static path */

function StillDisplay(props: Props) {
    const { palette, hw, ov, slides } = useSettings(props)
    const s = deviceStyles(palette, hw)
    const first = slides[0]
    const r = resolve(first)
    const still = r.isVideo ? r.cover : r.media
    const ink = props.textColor || "#ffffff"

    return (
        <div style={{ ...s.stage, ...props.style }}>
            {hw.halo && <div style={s.halo} />}
            <div style={s.device}>
                <div style={s.body}>
                    <div style={s.glass}>
                        <div style={s.lens} />
                        <div style={s.screen}>
                            {still ? (
                                <img
                                    src={still}
                                    alt={first.title || ""}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(135deg, ${tint(palette.glow, "black", 0.55)}, #0a0b0d)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <svg
                                        width="44"
                                        height="44"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M8 5.5v13l11-6.5z"
                                            fill="rgba(255,255,255,0.75)"
                                        />
                                    </svg>
                                </div>
                            )}
                            {(ov.text || ov.segments) && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: "22% 5% 4.6%",
                                        background:
                                            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)",
                                        zIndex: 10,
                                    }}
                                >
                                    {ov.text && first.title && (
                                        <div
                                            style={{
                                                fontSize: 28,
                                                fontWeight: fontWeightOf(
                                                    props.headingFont,
                                                    400
                                                ),
                                                letterSpacing: "-0.02em",
                                                lineHeight: 1.1,
                                                ...props.headingFont,
                                                color: ink,
                                            }}
                                        >
                                            {first.title}
                                        </div>
                                    )}
                                    {ov.segments && slides.length > 1 && (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 7,
                                                marginTop: 14,
                                            }}
                                        >
                                            {slides.map((_, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width:
                                                            i === 0 ? 58 : 16,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background:
                                                            i === 0
                                                                ? palette.accent
                                                                : "rgba(255,255,255,0.32)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {hw.reflection && <div style={s.sheen} />}
                        </div>
                    </div>
                </div>
                {hw.mount === "pedestal" && (
                    <>
                        <div style={s.neck} />
                        <div style={s.foot} />
                    </>
                )}
                {hw.mount === "arm" && (
                    <>
                        <div style={s.pole} />
                        <div style={s.disc} />
                    </>
                )}
                {hw.groundShadow && <div style={s.ground} />}
            </div>
        </div>
    )
}

/* ========================================================= live path */

function usePresence(ref: React.RefObject<HTMLElement>) {
    const [inView, setInView] = useState(false)
    const [tabOn, setTabOn] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { threshold: 0.05 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setTabOn(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return inView && tabOn
}

function useCalmPreference() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])
    return calm
}

type Frame = { at: number; from: number | null; dir: 1 | -1; tick: number }

function LiveDisplay(props: Props) {
    const { palette, hw, mo, ov, slides } = useSettings(props)
    const s = useMemo(
        () => deviceStyles(palette, hw),
        [
            palette.shell,
            palette.glow,
            palette.accent,
            hw.glass,
            hw.mount,
            hw.corner,
        ]
    )
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const k = `lu${uid}`
    const ink = props.textColor || "#ffffff"

    const rootRef = useRef<HTMLDivElement>(null)
    const screenRef = useRef<HTMLDivElement>(null)
    const fillRef = useRef<HTMLDivElement>(null)
    const clipRef = useRef<HTMLVideoElement | null>(null)

    const present = usePresence(rootRef)
    const calm = useCalmPreference()
    const running = present && !calm

    const [frame, setFrame] = useState<Frame>({
        at: 0,
        from: null,
        dir: 1,
        tick: 0,
    })
    const [hovering, setHovering] = useState(false)
    const [halted, setHalted] = useState(false)
    const [badge, setBadge] = useState<{
        on: boolean
        playing: boolean
        n: number
    }>({
        on: false,
        playing: true,
        n: 0,
    })
    const [pulses, setPulses] = useState<
        { id: number; x: number; y: number }[]
    >([])
    const [awake, setAwake] = useState(!mo.wakeUp)

    const count = slides.length
    const at = Math.min(frame.at, count - 1)
    const current = slides[at]
    const cur = resolve(current)

    // live mirror for loop + handlers
    const live = useRef({ mo, count, at, cur, hovering, halted })
    live.current = { mo, count, at, cur, hovering, halted }

    const elapsed = useRef(0)

    const step = useCallback((delta: number) => {
        const n = live.current.count
        if (n < 2) return
        elapsed.current = 0
        setFrame((f) => ({
            at: (((f.at + delta) % n) + n) % n,
            from: f.at,
            dir: delta > 0 ? 1 : -1,
            tick: f.tick + 1,
        }))
    }, [])
    const jump = useCallback((to: number) => {
        elapsed.current = 0
        setFrame((f) =>
            f.at === to
                ? f
                : {
                      at: to,
                      from: f.at,
                      dir: to > f.at ? 1 : -1,
                      tick: f.tick + 1,
                  }
        )
    }, [])

    // first time the display is seen: wake the panel
    useEffect(() => {
        if (present && !awake) {
            const t = window.setTimeout(() => setAwake(true), calm ? 0 : 60)
            return () => window.clearTimeout(t)
        }
    }, [present, awake, calm])

    // video playback follows visibility + user pause
    useEffect(() => {
        const v = clipRef.current
        if (!v) return
        if (present && !halted) v.play().catch(() => {})
        else v.pause()
    }, [present, halted, frame.tick])

    // reset per-slide clock
    useEffect(() => {
        elapsed.current = 0
        if (fillRef.current) fillRef.current.style.transform = "scaleX(0)"
    }, [frame.tick])

    // autoplay clock / segment fill — one rAF loop, permit-gated, self-sleeping
    const permit = useRef(false)
    permit.current = running
    useEffect(() => {
        if (!running) return
        const isVid = cur.isVideo
        const ticking =
            (isVid && !halted) ||
            (!isVid && mo.autoplay && !halted && !(mo.holdOnHover && hovering))
        if (!ticking || count < 2) return
        let raf = 0
        let last = performance.now()
        const loop = (now: number) => {
            if (!permit.current) return // parked: will restart when visible
            const dt = Math.min(0.1, (now - last) / 1000)
            last = now
            const L = live.current
            let frac = 0
            if (L.cur.isVideo) {
                const v = clipRef.current
                frac = v && v.duration ? v.currentTime / v.duration : 0
            } else {
                elapsed.current += dt
                frac = elapsed.current / Math.max(0.5, L.mo.hold)
                if (frac >= 1) {
                    step(1)
                    return
                }
            }
            if (fillRef.current)
                fillRef.current.style.transform = `scaleX(${Math.min(1, frac)})`
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [
        running,
        frame.tick,
        hovering,
        halted,
        mo.autoplay,
        mo.holdOnHover,
        cur.isVideo,
        count,
        step,
    ])

    // pointer: tap vs swipe
    const press = useRef<{ x: number; y: number; t: number } | null>(null)
    const onDown = (e: React.PointerEvent) => {
        press.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    }
    const onUp = (e: React.PointerEvent) => {
        const p = press.current
        press.current = null
        if (!p) return
        const dx = e.clientX - p.x
        const dy = e.clientY - p.y
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
            step(dx < 0 ? 1 : -1)
            return
        }
        if (Math.hypot(dx, dy) < 8) tap(e.clientX, e.clientY)
    }

    const tap = (cx: number, cy: number) => {
        const box = screenRef.current?.getBoundingClientRect()
        if (box && ov.tapPulse && !calm) {
            const id = performance.now() + Math.random()
            setPulses((list) => [
                ...list.slice(-2),
                { id, x: cx - box.left, y: cy - box.top },
            ])
        }
        if (cur.isVideo) toggle()
    }

    const toggle = () => {
        const v = clipRef.current
        const next = !halted
        setHalted(next)
        if (v) {
            if (next) v.pause()
            else v.play().catch(() => {})
        }
        setBadge((b) => ({ on: true, playing: !next, n: b.n + 1 }))
    }

    useEffect(() => {
        if (!badge.on) return
        const t = window.setTimeout(
            () => setBadge((b) => ({ ...b, on: false })),
            850
        )
        return () => window.clearTimeout(t)
    }, [badge.n])

    // new slide always starts playing
    useEffect(() => setHalted(false), [frame.tick])

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            step(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            step(-1)
        } else if ((e.key === " " || e.key === "Enter") && cur.isVideo) {
            e.preventDefault()
            toggle()
        }
    }

    const dur = calm ? 0.01 : Math.max(0.2, mo.pace)
    const effect = calm ? "dissolve" : mo.effect
    const ease = "cubic-bezier(.22,.8,.24,1)"

    const css = `
@keyframes ${k}dIn{from{opacity:0}to{opacity:1}}
@keyframes ${k}dOut{from{opacity:1}to{opacity:0}}
@keyframes ${k}pIn{from{transform:translateX(calc(var(--${k}d) * 100%))}to{transform:translateX(0)}}
@keyframes ${k}pOut{from{transform:translateX(0);filter:brightness(1)}to{transform:translateX(calc(var(--${k}d) * -28%));filter:brightness(.45)}}
@keyframes ${k}bIn{from{opacity:0;transform:scale(1.14);filter:blur(10px) saturate(1.4)}to{opacity:1;transform:scale(1);filter:blur(0) saturate(1)}}
@keyframes ${k}bOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.94)}}
@keyframes ${k}cInR{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0 0 0 0)}}
@keyframes ${k}cInL{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes ${k}cOut{from{transform:scale(1)}to{transform:scale(1.06)}}
@keyframes ${k}pulse{from{opacity:.9;transform:translate(-50%,-50%) scale(.08)}to{opacity:0;transform:translate(-50%,-50%) scale(1.7)}}
@keyframes ${k}wake{0%{opacity:1}35%{opacity:1}100%{opacity:0}}
@keyframes ${k}flare{0%{opacity:0;transform:scale(.3)}40%{opacity:.85}100%{opacity:0;transform:scale(1.5)}}
@keyframes ${k}rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.${k}arrow{opacity:0;transform:scale(.86);transition:opacity .3s ${ease},transform .3s ${ease},background .2s}
.${k}scr:hover .${k}arrow,.${k}scr:focus-visible .${k}arrow{opacity:1;transform:scale(1)}
.${k}arrow:hover{background:${tint(palette.accent, "white", 0, 0.28)} !important}
.${k}cta{transition:background .25s,transform .25s ${ease}}
.${k}cta:hover{transform:translateY(-1px);background:${palette.accent} !important;color:#111 !important}
`
    const anim = (role: "in" | "out") => {
        const d = `${dur}s ${ease} both`
        if (effect === "push")
            return role === "in" ? `${k}pIn ${d}` : `${k}pOut ${d}`
        if (effect === "bloom")
            return role === "in" ? `${k}bIn ${d}` : `${k}bOut ${d}`
        if (effect === "curtain")
            return role === "in"
                ? `${frame.dir > 0 ? `${k}cInR` : `${k}cInL`} ${d}`
                : `${k}cOut ${d}`
        return role === "in" ? `${k}dIn ${d}` : `${k}dOut ${d}`
    }

    const layer = (idx: number, role: "in" | "out" | "rest") => {
        const sl = slides[idx]
        if (!sl) return null
        const r = resolve(sl)
        const base: CSSProperties = {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
        }
        const wrap: CSSProperties = {
            position: "absolute",
            inset: 0,
            zIndex: role === "out" ? 1 : 2,
            animation: role === "rest" ? undefined : anim(role),
            [("--" + k + "d") as any]: frame.dir,
        }
        const isCurrent = role !== "out"
        return (
            <div
                key={`${idx}-${role === "out" ? "o" : frame.tick}`}
                style={wrap}
                onAnimationEnd={
                    role === "in"
                        ? () =>
                              setFrame((f) =>
                                  f.from === null ? f : { ...f, from: null }
                              )
                        : undefined
                }
            >
                {r.isVideo && r.media ? (
                    <video
                        ref={
                            isCurrent
                                ? (el: HTMLVideoElement | null) => {
                                      clipRef.current = el
                                  }
                                : undefined
                        }
                        src={r.media}
                        poster={r.cover || undefined}
                        muted
                        playsInline
                        autoPlay={isCurrent && present}
                        loop={!mo.autoplay || count < 2}
                        preload={isCurrent ? "auto" : "metadata"}
                        onEnded={
                            isCurrent && mo.autoplay ? () => step(1) : undefined
                        }
                        style={base}
                    />
                ) : r.media ? (
                    <img
                        src={r.media}
                        alt={sl.title || ""}
                        draggable={false}
                        style={base}
                    />
                ) : (
                    <div
                        style={{
                            ...base,
                            background: `linear-gradient(135deg, ${tint(palette.glow, "black", 0.55)}, #0a0b0d)`,
                        }}
                    />
                )}
            </div>
        )
    }

    const arrowBtn = (dir: 1 | -1) => (
        <button
            type="button"
            className={`${k}arrow`}
            aria-label={dir > 0 ? "Next" : "Previous"}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation()
                step(dir)
            }}
            style={{
                position: "absolute",
                top: "50%",
                [dir > 0 ? "right" : "left"]: "3.5%",
                marginTop: -19,
                width: 38,
                height: 38,
                borderRadius: 19,
                border: `1px solid ${tint("#ffffff", "white", 0, 0.22)}`,
                background: "rgba(14,14,16,0.38)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                zIndex: 20,
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                    d={dir > 0 ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}
                    stroke={palette.accent}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )

    const pad2 = (n: number) => String(n).padStart(2, "0")
    const showFrom = frame.from !== null && frame.from !== at

    return (
        <div ref={rootRef} style={{ ...s.stage, ...props.style }}>
            <style>{css}</style>
            {hw.halo && (
                <div
                    style={{
                        ...s.halo,
                        opacity: awake ? 1 : 0,
                        transition: `opacity 1.4s ${ease}`,
                    }}
                />
            )}
            <div style={s.device}>
                <div style={s.body}>
                    <div style={s.glass}>
                        <div style={s.lens} />
                        <div
                            ref={screenRef}
                            className={`${k}scr`}
                            style={{
                                ...s.screen,
                                cursor: cur.isVideo
                                    ? "pointer"
                                    : count > 1
                                      ? "grab"
                                      : "default",
                                touchAction: "pan-y",
                                userSelect: "none",
                            }}
                            tabIndex={0}
                            role="region"
                            aria-roledescription="carousel"
                            aria-label={`Slide ${at + 1} of ${count}`}
                            onKeyDown={onKey}
                            onPointerDown={onDown}
                            onPointerUp={onUp}
                            onPointerCancel={() => (press.current = null)}
                            onMouseEnter={() => setHovering(true)}
                            onMouseLeave={() => setHovering(false)}
                        >
                            {showFrom && layer(frame.from as number, "out")}
                            {layer(at, frame.tick === 0 ? "rest" : "in")}

                            {/* bottom-left: title + pill progress */}
                            {(ov.text ||
                                ov.segments ||
                                ov.counter ||
                                current.link) && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: "22% 5% 4.6%",
                                        background:
                                            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)",
                                        display: "flex",
                                        alignItems: "flex-end",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        zIndex: 14,
                                        pointerEvents: "none",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        {ov.text && current.title && (
                                            <div
                                                key={`t${frame.tick}`}
                                                style={{
                                                    animation: calm
                                                        ? undefined
                                                        : `${k}rise ${Math.max(0.35, dur)}s ${ease} ${dur * 0.35}s both`,
                                                }}
                                            >
                                                {ov.text && current.title && (
                                                    <div
                                                        style={{
                                                            fontSize: 28,
                                                            fontWeight:
                                                                fontWeightOf(
                                                                    props.headingFont,
                                                                    400
                                                                ),
                                                            letterSpacing:
                                                                "-0.02em",
                                                            lineHeight: 1.1,
                                                            textShadow:
                                                                "0 1px 14px rgba(0,0,0,0.25)",
                                                            ...props.headingFont,
                                                            color: ink,
                                                        }}
                                                    >
                                                        {current.title}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {ov.segments && count > 1 && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 7,
                                                    marginTop:
                                                        ov.text && current.title
                                                            ? 8
                                                            : 0,
                                                    pointerEvents: "auto",
                                                }}
                                            >
                                                {slides.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        aria-label={`Go to slide ${i + 1}`}
                                                        aria-current={i === at}
                                                        onPointerDown={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onPointerUp={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            jump(i)
                                                        }}
                                                        style={{
                                                            padding: "6px 0",
                                                            margin: 0,
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                position:
                                                                    "relative",
                                                                width:
                                                                    i === at
                                                                        ? 58
                                                                        : 16,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                overflow:
                                                                    "hidden",
                                                                background:
                                                                    "rgba(255,255,255,0.32)",
                                                                transition: calm
                                                                    ? undefined
                                                                    : `width ${Math.max(0.35, dur)}s ${ease}`,
                                                            }}
                                                        >
                                                            {i === at && (
                                                                <div
                                                                    ref={
                                                                        fillRef
                                                                    }
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        inset: 0,
                                                                        borderRadius: 3,
                                                                        background:
                                                                            palette.accent,
                                                                        transformOrigin:
                                                                            "left center",
                                                                        transform:
                                                                            !mo.autoplay &&
                                                                            !cur.isVideo
                                                                                ? "scaleX(1)"
                                                                                : "scaleX(0)",
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {(current.link ||
                                        (ov.counter && count > 1)) && (
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-end",
                                                gap: 10,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {current.link && (
                                                <a
                                                    href={current.link}
                                                    target={
                                                        ov.newTab
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    rel={
                                                        ov.newTab
                                                            ? "noopener noreferrer"
                                                            : undefined
                                                    }
                                                    className={`${k}cta`}
                                                    onPointerDown={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    onPointerUp={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    style={{
                                                        pointerEvents: "auto",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "7px 12px",
                                                        borderRadius: 999,
                                                        border: `1px solid ${tint(palette.accent, "white", 0, 0.45)}`,
                                                        background:
                                                            "rgba(255,255,255,0.08)",
                                                        color: ink,
                                                        fontWeight: 500,
                                                        textDecoration: "none",
                                                        ...props.bodyFont,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {ov.linkLabel}
                                                    <svg
                                                        width="11"
                                                        height="11"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M7 17L17 7M9 7h8v8"
                                                            stroke="currentColor"
                                                            strokeWidth="2.4"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </a>
                                            )}
                                            {ov.counter && count > 1 && (
                                                <div
                                                    style={{
                                                        fontWeight: 500,
                                                        letterSpacing: "0.08em",
                                                        color: ink,
                                                        opacity: 0.85,
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                        ...props.bodyFont,
                                                        fontSize: 11,
                                                    }}
                                                >
                                                    {pad2(at + 1)}
                                                    <span
                                                        style={{ opacity: 0.5 }}
                                                    >
                                                        {" "}
                                                        / {pad2(count)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* play / pause badge */}
                            {cur.isVideo && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width: 64,
                                        height: 64,
                                        marginLeft: -32,
                                        marginTop: -32,
                                        borderRadius: 32,
                                        background: "rgba(10,10,12,0.42)",
                                        backdropFilter: "blur(10px)",
                                        WebkitBackdropFilter: "blur(10px)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        opacity: badge.on ? 1 : 0,
                                        transform: badge.on
                                            ? "scale(1)"
                                            : "scale(0.8)",
                                        transition: `opacity .3s ${ease}, transform .3s ${ease}`,
                                        pointerEvents: "none",
                                        zIndex: 18,
                                    }}
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                    >
                                        {badge.playing ? (
                                            <path
                                                d="M8 5.5v13l11-6.5z"
                                                fill={palette.accent}
                                            />
                                        ) : (
                                            <g fill={palette.accent}>
                                                <rect
                                                    x="6.5"
                                                    y="5"
                                                    width="3.6"
                                                    height="14"
                                                    rx="1"
                                                />
                                                <rect
                                                    x="13.9"
                                                    y="5"
                                                    width="3.6"
                                                    height="14"
                                                    rx="1"
                                                />
                                            </g>
                                        )}
                                    </svg>
                                </div>
                            )}

                            {/* tap pulses */}
                            {pulses.map((p) => (
                                <span
                                    key={p.id}
                                    onAnimationEnd={() =>
                                        setPulses((list) =>
                                            list.filter((x) => x.id !== p.id)
                                        )
                                    }
                                    style={{
                                        position: "absolute",
                                        left: p.x,
                                        top: p.y,
                                        width: 120,
                                        height: 120,
                                        borderRadius: "50%",
                                        border: `1.5px solid ${tint(palette.accent, "white", 0, 0.8)}`,
                                        background: tint(
                                            palette.accent,
                                            "white",
                                            0,
                                            0.12
                                        ),
                                        pointerEvents: "none",
                                        animation: `${k}pulse .7s ${ease} forwards`,
                                        zIndex: 17,
                                    }}
                                />
                            ))}

                            {ov.arrows && count > 1 && arrowBtn(-1)}
                            {ov.arrows && count > 1 && arrowBtn(1)}

                            {hw.reflection && <div style={s.sheen} />}

                            {/* power-on panel */}
                            {mo.wakeUp && !calm && (
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "#050506",
                                        zIndex: 40,
                                        pointerEvents: "none",
                                        animation: awake
                                            ? `${k}wake 1.3s ${ease} forwards`
                                            : undefined,
                                        opacity: awake ? undefined : 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "38%",
                                            aspectRatio: "1",
                                            borderRadius: "50%",
                                            background: `radial-gradient(closest-side, ${tint(palette.glow, "white", 0.5, 0.9)}, ${tint(palette.glow, "white", 0, 0)})`,
                                            opacity: 0,
                                            animation: awake
                                                ? `${k}flare 1s ${ease} forwards`
                                                : undefined,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {hw.mount === "pedestal" && (
                    <>
                        <div style={s.neck} />
                        <div style={s.foot} />
                    </>
                )}
                {hw.mount === "arm" && (
                    <>
                        <div style={s.pole} />
                        <div style={s.disc} />
                    </>
                )}
                {hw.groundShadow && <div style={s.ground} />}
            </div>
        </div>
    )
}

/* ============================================================= controls */

const hideIf = (key: string, test: (v: any) => boolean) => (p: any) =>
    test(p?.[key] !== undefined ? p[key] : undefined)

addPropertyControls(Lumiere, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p?.kind === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: (p: any) => p?.kind === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p?.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    defaultValue: "",
                    hidden: (p: any) => p?.kind !== "video",
                },
                cover: {
                    type: ControlType.ResponsiveImage,
                    title: "Cover",
                    hidden: (p: any) => p?.kind !== "video",
                },
                coverUrl: {
                    type: ControlType.String,
                    title: "Cover URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: (p: any) => p?.kind !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: SAMPLE,
    },
    finish: {
        type: ControlType.Enum,
        title: "Finish",
        options: [
            "silver",
            "graphite",
            "midnight",
            "champagne",
            "blush",
            "sage",
            "lagoon",
            "terracotta",
            "custom",
        ],
        optionTitles: [
            "Silver",
            "Graphite",
            "Midnight",
            "Champagne",
            "Blush",
            "Sage",
            "Lagoon",
            "Terracotta",
            "Custom",
        ],
        defaultValue: "silver",
    },
    customFinish: {
        type: ControlType.Object,
        title: "Custom",
        hidden: (p: any) => p.finish !== "custom",
        controls: {
            shell: {
                type: ControlType.Color,
                title: "Shell",
                defaultValue: "#c8cacd",
            },
            glow: {
                type: ControlType.Color,
                title: "Glow",
                defaultValue: "#9fb4d6",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#ffffff",
            },
        },
    },
    hardware: {
        type: ControlType.Object,
        title: "Hardware",
        controls: {
            glass: {
                type: ControlType.Enum,
                title: "Bezel",
                options: ["auto", "dark", "light"],
                optionTitles: ["Auto", "Dark", "Light"],
                displaySegmentedControl: true,
                defaultValue: "auto",
            },
            mount: {
                type: ControlType.Enum,
                title: "Mount",
                options: ["pedestal", "arm", "float"],
                optionTitles: ["Pedestal", "Arm", "Float"],
                displaySegmentedControl: true,
                defaultValue: "pedestal",
            },
            corner: {
                type: ControlType.Number,
                title: "Corner",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 14,
            },
            reflection: {
                type: ControlType.Boolean,
                title: "Glare",
                defaultValue: true,
            },
            halo: {
                type: ControlType.Boolean,
                title: "Halo",
                defaultValue: true,
            },
            groundShadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 4.5,
                hidden: hideIf("autoplay", (v) => v === false),
            },
            holdOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: hideIf("autoplay", (v) => v === false),
            },
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["bloom", "push", "curtain", "dissolve"],
                optionTitles: ["Bloom", "Push", "Curtain", "Dissolve"],
                defaultValue: "bloom",
            },
            pace: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.2,
                max: 2,
                step: 0.05,
                unit: "s",
                defaultValue: 0.7,
            },
            wakeUp: {
                type: ControlType.Boolean,
                title: "Power On",
                defaultValue: true,
            },
        },
    },
    overlay: {
        type: ControlType.Object,
        title: "Interface",
        controls: {
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
            },
            segments: {
                type: ControlType.Boolean,
                title: "Progress",
                defaultValue: true,
            },
            counter: {
                type: ControlType.Boolean,
                title: "Counter",
                defaultValue: false,
            },
            text: {
                type: ControlType.Boolean,
                title: "Title",
                defaultValue: true,
            },
            tapPulse: {
                type: ControlType.Boolean,
                title: "Tap Pulse",
                defaultValue: true,
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: "Explore",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: true,
            },
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 12, lineHeight: "1.2em" },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
})
