import { useEffect, useLayoutEffect, useRef } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*
 * Scanline — a glowing line sweeps across the frame; everything behind it
 * is "scanned" into the photo. The front can be a cover with a title, or the
 * same photo undeveloped (grey, soft) so the scan develops it.
 */

type Easing = "smooth" | "expo" | "linear"
type Trigger = "scroll" | "inView" | "appear" | "pointer"
type Direction = "down" | "up" | "right" | "left"
type Front = "develop" | "cover"

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface Props {
    image?: ResponsiveImage
    front: Front
    cover: string
    title: string
    titleFont: CSSProperties
    titleColor: string
    backTitle: string
    backFont: CSSProperties
    backColor: string
    direction: Direction
    lineColor: string
    lineWeight: number
    glow: number
    beam: number
    trigger: Trigger
    duration: number
    easing: Easing
    delay: number
    loop: boolean
    hold: number
    preview: number
    style?: CSSProperties
}

interface Frame {
    clip: string
    at: number
    edge: boolean
    imgScale: number
    titleK: number
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const EASES: Record<Easing, (t: number) => number> = {
    smooth: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    linear: (t) => t,
}
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** Every visual value for one moment of the scan, used by both the live and the static render. */
function frameAt(raw: number, direction: Direction, easing: Easing, trigger: Trigger): Frame {
    const ease = trigger === "pointer" ? EASES.linear : EASES[easing] || EASES.smooth
    const p = ease(clamp(raw))
    const pct = p * 100
    const rest = 100 - pct
    // The scanned part (already passed by the line) shows the back layer.
    let clip: string
    if (direction === "down") clip = "inset(0 0 " + rest + "% 0)"
    else if (direction === "up") clip = "inset(" + rest + "% 0 0 0)"
    else if (direction === "right") clip = "inset(0 " + rest + "% 0 0)"
    else clip = "inset(0 0 0 " + rest + "%)"
    const reverse = direction === "up" || direction === "left"
    return {
        clip,
        at: reverse ? rest : pct,
        edge: p <= 0 || p >= 1,
        imgScale: 1.08 - 0.08 * p,
        titleK: clamp((raw - 0.85) / 0.15),
    }
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Scanline(props: Props) {
    const {
        image,
        front,
        cover,
        title,
        titleFont,
        titleColor,
        backTitle,
        backFont,
        backColor,
        direction,
        lineColor,
        lineWeight,
        glow,
        beam,
        trigger,
        duration,
        easing,
        delay,
        loop,
        hold,
        preview,
        style,
    } = props

    // Canvas, export and other static renders get one still frame: no listeners, no animation.
    const isStatic = useIsStaticRenderer()
    const isScroll = trigger === "scroll" && !isStatic
    const axisY = direction === "down" || direction === "up"
    const reverse = direction === "up" || direction === "left"

    const rootRef = useRef<HTMLDivElement>(null)
    const backRef = useRef<HTMLDivElement>(null)
    const lineRef = useRef<HTMLDivElement>(null)
    const beamRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLDivElement>(null)
    const backTitleRef = useRef<HTMLHeadingElement & HTMLParagraphElement>(null)
    const startProgress = isStatic ? preview : trigger === "pointer" ? 0.5 : 0
    const progressRef = useRef<number>(startProgress)

    const optsRef = useRef({ direction, easing, trigger, beam, axisY })
    optsRef.current = { direction, easing, trigger, beam, axisY }

    const apply = (raw: number): void => {
        progressRef.current = raw
        const back = backRef.current
        const line = lineRef.current
        if (!back || !line) return
        const o = optsRef.current
        const f = frameAt(raw, o.direction, o.easing, o.trigger)
        back.style.clipPath = f.clip
        back.style.setProperty("-webkit-clip-path", f.clip)
        if (o.axisY) line.style.top = f.at + "%"
        else line.style.left = f.at + "%"
        line.style.opacity = f.edge ? "0" : "1"
        const b = beamRef.current
        if (b) {
            if (o.axisY) b.style.top = f.at + "%"
            else b.style.left = f.at + "%"
            b.style.opacity = f.edge ? "0" : String(o.beam)
        }
        if (imgRef.current) imgRef.current.style.transform = "scale(" + f.imgScale + ")"
        const t = backTitleRef.current
        if (t) {
            t.style.opacity = String(f.titleK)
            t.style.transform = "translateY(" + (1 - f.titleK) * 14 + "px)"
        }
    }

    // Re-apply the current frame when the look changes (live only).
    useIsoLayoutEffect(() => {
        if (isStatic) return
        apply(progressRef.current)
    }, [isStatic, direction, easing, trigger, beam])

    // Triggers (live only).
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        if (isScroll) {
            let raf = 0
            const onScroll = (): void => {
                cancelAnimationFrame(raf)
                raf = requestAnimationFrame(() => {
                    const r = root.getBoundingClientRect()
                    const travel = r.height - window.innerHeight
                    apply(travel > 0 ? clamp(-r.top / travel) : clamp(1 - r.top / window.innerHeight))
                })
            }
            onScroll()
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onScroll)
            return () => {
                cancelAnimationFrame(raf)
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onScroll)
            }
        }

        if (trigger === "pointer") {
            // The line follows the pointer (or a finger) along its axis.
            let raf = 0
            const onMove = (e: PointerEvent): void => {
                const r = root.getBoundingClientRect()
                let f = axisY ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width
                if (reverse) f = 1 - f
                cancelAnimationFrame(raf)
                raf = requestAnimationFrame(() => apply(clamp(f)))
            }
            apply(0.5)
            root.addEventListener("pointermove", onMove)
            root.addEventListener("pointerdown", onMove)
            return () => {
                cancelAnimationFrame(raf)
                root.removeEventListener("pointermove", onMove)
                root.removeEventListener("pointerdown", onMove)
            }
        }

        if (reduce) {
            apply(1)
            return
        }

        let cancelled = false
        let raf = 0
        const timers = new Set<ReturnType<typeof setTimeout>>()
        const ms = Math.max(0.3, duration) * 1000
        const wait = (t: number): Promise<void> =>
            new Promise((resolve) => {
                const id = setTimeout(() => {
                    timers.delete(id)
                    resolve()
                }, t)
                timers.add(id)
            })
        const tween = (from: number, to: number, len: number): Promise<void> =>
            new Promise((resolve) => {
                const start = performance.now()
                const step = (now: number): void => {
                    if (cancelled) return resolve()
                    const k = Math.min(1, (now - start) / len)
                    apply(from + (to - from) * k)
                    if (k >= 1) resolve()
                    else raf = requestAnimationFrame(step)
                }
                raf = requestAnimationFrame(step)
            })
        let started = false
        const play = async (): Promise<void> => {
            if (started) return
            started = true
            await wait(Math.max(0, delay) * 1000)
            do {
                if (cancelled) break
                await tween(0, 1, ms)
                if (!loop || cancelled) break
                await wait(Math.max(0, hold) * 1000)
                await tween(1, 0, ms * 0.6)
                await wait(500)
            } while (loop && !cancelled)
        }
        let io: IntersectionObserver | null = null
        if (trigger === "appear") play()
        else {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((en) => en.isIntersecting)) {
                        play()
                        observer.disconnect()
                    }
                },
                { threshold: 0.4 }
            )
            observer.observe(root)
            io = observer
        }
        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            timers.forEach((id) => clearTimeout(id))
            io?.disconnect()
        }
    }, [isStatic, trigger, duration, easing, delay, loop, hold, direction, isScroll])

    // First paint (and every static render) comes straight from the frame math.
    const f0 = frameAt(startProgress, direction, easing, trigger)

    const src = image?.src
    const bg = src ? "url(" + JSON.stringify(src) + ")" : "linear-gradient(135deg, #8a8a8a, #2a2a2a)"
    const glowShadow = glow > 0 ? "0 0 " + glow + "px " + glow / 3 + "px " + lineColor + ", 0 0 " + glow * 2.5 + "px " + glow / 2 + "px " + lineColor : "none"
    const beamGrad = axisY
        ? "linear-gradient(" + (reverse ? "to bottom" : "to top") + ", " + lineColor + ", transparent)"
        : "linear-gradient(" + (reverse ? "to right" : "to left") + ", " + lineColor + ", transparent)"
    const touchAction = trigger === "pointer" ? (axisY ? "pan-x" : "pan-y") : undefined
    const pos = axisY ? { top: f0.at + "%" } : { left: f0.at + "%" }
    const centered: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: 0,
        padding: 24,
        textAlign: "center",
        whiteSpace: "pre-wrap",
    }
    // The cover title is the heading; the after title is a heading only when there is no cover title.
    const BackTag = front === "cover" && title ? "p" : "h2"

    return (
        <div ref={rootRef} style={{ ...style, position: "relative", width: "100%", height: "100%", touchAction }}>
            <div
                style={{
                    position: isScroll ? "sticky" : "relative",
                    top: 0,
                    width: "100%",
                    height: isScroll ? "100vh" : "100%",
                    overflow: "hidden",
                    background: cover,
                }}
            >
                {front === "develop" ? (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: -12,
                            backgroundImage: bg,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "grayscale(1) contrast(0.7) brightness(1.15) blur(6px)",
                        }}
                    />
                ) : title ? (
                    <h2 style={{ ...centered, font: "inherit", color: titleColor, ...titleFont }}>{title}</h2>
                ) : null}

                <div ref={backRef} style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: f0.clip, WebkitClipPath: f0.clip }}>
                    <div
                        ref={imgRef}
                        role={src ? "img" : undefined}
                        aria-label={src ? image?.alt || backTitle || title || "Photo" : undefined}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: bg,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            willChange: isStatic ? undefined : "transform",
                            transform: "scale(" + f0.imgScale + ")",
                        }}
                    />
                    {backTitle ? (
                        <BackTag
                            ref={backTitleRef}
                            style={{
                                ...centered,
                                font: "inherit",
                                color: backColor,
                                opacity: f0.titleK,
                                transform: "translateY(" + (1 - f0.titleK) * 14 + "px)",
                                textShadow: "0 2px 24px rgba(0,0,0,0.25)",
                                ...backFont,
                            }}
                        >
                            {backTitle}
                        </BackTag>
                    ) : null}
                </div>

                {beam > 0 ? (
                    <div
                        ref={beamRef}
                        aria-hidden="true"
                        style={
                            axisY
                                ? { position: "absolute", left: 0, right: 0, height: "18%", ...pos, transform: reverse ? "translateY(0)" : "translateY(-100%)", background: beamGrad, opacity: f0.edge ? 0 : beam, mixBlendMode: "screen", pointerEvents: "none" }
                                : { position: "absolute", top: 0, bottom: 0, width: "18%", ...pos, transform: reverse ? "translateX(0)" : "translateX(-100%)", background: beamGrad, opacity: f0.edge ? 0 : beam, mixBlendMode: "screen", pointerEvents: "none" }
                        }
                    />
                ) : null}

                <div
                    ref={lineRef}
                    aria-hidden="true"
                    style={
                        axisY
                            ? { position: "absolute", left: 0, right: 0, height: lineWeight, marginTop: -lineWeight / 2, ...pos, background: lineColor, boxShadow: glowShadow, opacity: f0.edge ? 0 : 1, pointerEvents: "none" }
                            : { position: "absolute", top: 0, bottom: 0, width: lineWeight, marginLeft: -lineWeight / 2, ...pos, background: lineColor, boxShadow: glowShadow, opacity: f0.edge ? 0 : 1, pointerEvents: "none" }
                    }
                />
            </div>
        </div>
    )
}

Scanline.displayName = "Scanline"

Scanline.defaultProps = {
    image: undefined,
    front: "develop",
    cover: "#F4F1EA",
    title: "Scanning",
    titleFont: { fontFamily: "Inter", fontWeight: 600, fontSize: 96, letterSpacing: "-0.04em", lineHeight: "1em" },
    titleColor: "#111111",
    backTitle: "",
    backFont: { fontFamily: "Inter", fontWeight: 600, fontSize: 64, letterSpacing: "-0.03em", lineHeight: "1em" },
    backColor: "#FFFFFF",
    direction: "down",
    lineColor: "#FFFFFF",
    lineWeight: 2,
    glow: 12,
    beam: 0.25,
    trigger: "inView",
    duration: 2.6,
    easing: "smooth",
    delay: 0.3,
    loop: false,
    hold: 2,
    preview: 0.5,
}

const timed = (p: Props): boolean => p.trigger === "scroll" || p.trigger === "pointer"

addPropertyControls(Scanline, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    front: {
        type: ControlType.Enum,
        title: "Before",
        options: ["develop", "cover"],
        optionTitles: ["Undeveloped", "Cover"],
        displaySegmentedControl: true,
        description: "Undeveloped: the same photo, grey and soft. Cover: a solid color with a title.",
    },
    cover: { type: ControlType.Color, title: "Cover", hidden: (p: Props) => p.front !== "cover" },
    title: { type: ControlType.String, title: "Title", displayTextArea: true, hidden: (p: Props) => p.front !== "cover" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", hidden: (p: Props) => p.front !== "cover" },
    titleColor: { type: ControlType.Color, title: "Title Color", hidden: (p: Props) => p.front !== "cover" },
    backTitle: { type: ControlType.String, title: "After Title", placeholder: "Shown once scanned" },
    backFont: { type: ControlType.Font, title: "After Font", controls: "extended", hidden: (p: Props) => !p.backTitle },
    backColor: { type: ControlType.Color, title: "After Color", hidden: (p: Props) => !p.backTitle },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["down", "up", "right", "left"],
        optionTitles: ["↓", "↑", "→", "←"],
        displaySegmentedControl: true,
    },
    lineColor: { type: ControlType.Color, title: "Line" },
    lineWeight: { type: ControlType.Number, title: "Line Weight", min: 1, max: 10, step: 1, unit: "px" },
    glow: { type: ControlType.Number, title: "Glow", min: 0, max: 40, step: 1, unit: "px" },
    beam: { type: ControlType.Number, title: "Beam", min: 0, max: 1, step: 0.05 },

    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["scroll", "inView", "appear", "pointer"],
        optionTitles: ["Scroll", "In View", "Appear", "Pointer"],
        description: "Pointer: the line follows the cursor or a finger. Scroll: give the layer a tall height (e.g. 250vh).",
    },
    duration: { type: ControlType.Number, title: "Duration", min: 0.4, max: 10, step: 0.1, unit: "s", hidden: timed },
    delay: { type: ControlType.Number, title: "Delay", min: 0, max: 5, step: 0.1, unit: "s", hidden: timed },
    loop: { type: ControlType.Boolean, title: "Loop", hidden: timed },
    hold: { type: ControlType.Number, title: "Hold", min: 0, max: 10, step: 0.1, unit: "s", hidden: (p: Props) => timed(p) || !p.loop },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["smooth", "expo", "linear"],
        optionTitles: ["Smooth", "Expo", "Linear"],
        hidden: (p: Props) => p.trigger === "pointer",
    },
    preview: { type: ControlType.Number, title: "Canvas Preview", min: 0, max: 1, step: 0.01, description: "Scrub the scan on the canvas." },
})
