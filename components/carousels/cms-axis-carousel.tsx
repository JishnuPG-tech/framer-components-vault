/*
 * Noria — hinged media card wheel
 *
 * Marketplace compliance notes
 * 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
 *    returns <NoriaStill/> on canvas / export. That branch is plain divs only —
 *    no motion, transitions, filters, listeners, observers, timers or rAF — and
 *    shares no markup helper with the live branch.
 * 2. Offscreen work: the live rAF loop starts locked and only runs while the
 *    component is intersecting the viewport AND the tab is visible. Permission
 *    is re-checked at the top of every frame. The loop also sleeps itself once
 *    the wheel settles, so it idles at zero frames even while on screen.
 *    Card videos only play while visible and pause when parked.
 *    Autoplay uses one timeout that is cleared whenever the section parks.
 *    prefers-reduced-motion makes every turn an instant cut.
 *    Without IntersectionObserver the live path still runs (no blank box).
 */
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


const { useEffect, useRef, useCallback } = React

type Tile = {
    media?: "image" | "video"
    image?: { src?: string; alt?: string }
    imageURL?: string
    video?: string
    videoURL?: string
    color?: string
    tint?: boolean
    alt?: string
    link?: string
}

type ArrowSet = {
    show?: boolean
    side?: "right" | "left"
    size?: number
    tone?: string
    inset?: number
}

type Props = {
    cards?: Tile[]
    startIndex?: number
    cardHeight?: number
    aspect?: number
    radius?: number
    yaw?: number
    pitch?: number
    depth?: number
    stiffness?: number
    bounce?: number
    motionBlur?: number
    wheel?: boolean
    wheelReach?: number
    drag?: boolean
    autoplay?: boolean
    interval?: number
    arrows?: ArrowSet
    background?: string
    newTab?: boolean
    style?: React.CSSProperties
}

const PIC = (id: string) =>
    `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`

const SEED: Tile[] = [
    {
        media: "image",
        color: "#1C3CEF",
        tint: true,
        imageURL: PIC("photo-1534528741775-53994a69daeb"),
    },
    {
        media: "image",
        color: "#2E9BF2",
        tint: true,
        imageURL: PIC("photo-1494790108377-be9c29b29330"),
    },
    {
        media: "image",
        color: "#0F0F10",
        tint: true,
        imageURL: PIC("photo-1500648767791-00dcc994a43e"),
    },
    {
        media: "image",
        color: "#F03C14",
        tint: true,
        imageURL: PIC("photo-1507003211169-0a1dd7228f2d"),
    },
    {
        media: "image",
        color: "#1C3CEF",
        tint: true,
        imageURL: PIC("photo-1517841905240-472988babdf9"),
    },
    {
        media: "image",
        color: "#202022",
        tint: true,
        imageURL: PIC("photo-1438761681033-6461ffad8d80"),
    },
]

/* ---------- pure numeric helpers (no markup) ---------- */

const spokeOf = (count: number) => 360 / Math.max(1, count)

function hingeAngle(slot: number, turn: number, spoke: number) {
    let a = ((slot - turn) * spoke) % 360
    if (a >= 180) a -= 360
    if (a < -180) a += 360
    return a
}

const pictureOf = (t: Tile) =>
    t.media === "video" ? "" : t.image?.src || t.imageURL || ""
const clipOf = (t: Tile) =>
    t.media === "video" ? t.video || t.videoURL || "" : ""

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Noria(props: Props) {
    const still = useIsStaticRenderer()
    if (still) return <NoriaStill {...props} />
    return <NoriaLive {...props} />
}

/* =====================================================================
 * Static branch — plain divs, resting pose, nothing running
 * ===================================================================== */

function NoriaStill(p: Props) {
    const cards = p.cards && p.cards.length ? p.cards : SEED
    const h = p.cardHeight ?? 320
    const w = h * (p.aspect ?? 0.78)
    const spoke = spokeOf(cards.length)
    const turn = Math.max(
        0,
        Math.min(cards.length - 1, (p.startIndex ?? 1) - 1)
    )
    const arrows = p.arrows || {}
    const showArrows = arrows.show ?? true
    const btn = arrows.size ?? 48
    const tone = arrows.tone ?? "#151515"

    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.background ?? "#E8E8E8",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: p.depth ?? 1400,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${p.pitch ?? 0}deg) rotateY(${
                            p.yaw ?? -38
                        }deg)`,
                    }}
                >
                    {cards.map((c, i) => {
                        const pic = pictureOf(c)
                        const clip = clipOf(c)
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: -w / 2,
                                    top: -h,
                                    width: w,
                                    height: h,
                                    transformOrigin: "50% 100%",
                                    transform: `rotateX(${hingeAngle(
                                        i,
                                        turn,
                                        spoke
                                    )}deg)`,
                                    backfaceVisibility: "visible",
                                    borderRadius: p.radius ?? 10,
                                    overflow: "hidden",
                                    background: c.color ?? "#1C3CEF",
                                }}
                            >
                                {clip ? (
                                    <video
                                        src={clip}
                                        muted
                                        playsInline
                                        autoPlay={false}
                                        preload="none"
                                        aria-label={c.alt || undefined}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            mixBlendMode: c.tint
                                                ? "luminosity"
                                                : "normal",
                                        }}
                                    />
                                ) : pic ? (
                                    <img
                                        src={pic}
                                        alt={c.alt || c.image?.alt || ""}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            mixBlendMode: c.tint
                                                ? "luminosity"
                                                : "normal",
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>
            {showArrows && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        [arrows.side === "left" ? "left" : "right"]:
                            arrows.inset ?? 28,
                        transform: "translateY(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: btn * 0.32,
                    }}
                >
                    {[
                        "M12 19V5M5.5 11.5 12 5l6.5 6.5",
                        "M12 5v14M5.5 12.5 12 19l6.5-6.5",
                    ].map((d, k) => (
                        <div
                            key={k}
                            style={{
                                width: btn,
                                height: btn,
                                borderRadius: "50%",
                                border: `1.25px solid ${tone}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg
                                width={btn * 0.36}
                                height={btn * 0.36}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={tone}
                                strokeWidth={1.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d={d} />
                            </svg>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* =====================================================================
 * Live branch
 * ===================================================================== */

type Rig = {
    turn: number
    goal: number
    speed: number
    raf: number
    stamp: number
    inView: boolean
    tabShown: boolean
    calm: boolean
    holding: boolean
    grabY: number
    grabTurn: number
    trailY: number
    trailT: number
    flick: number
    travelled: number
    wheelSum: number
    wheelAt: number
    autoTimer: number
}

function NoriaLive(p: Props) {
    const cards = p.cards && p.cards.length ? p.cards : SEED
    const h = p.cardHeight ?? 320
    const w = h * (p.aspect ?? 0.78)
    const spoke = spokeOf(cards.length)
    const arrows = p.arrows || {}
    const showArrows = arrows.show ?? true
    const btn = arrows.size ?? 48
    const tone = arrows.tone ?? "#151515"

    const boxRef = useRef<HTMLDivElement>(null)
    const leafRefs = useRef<(HTMLDivElement | null)[]>([])
    const liveProps = useRef(p)
    liveProps.current = p
    const countRef = useRef(cards.length)
    countRef.current = cards.length

    const opening = Math.max(
        0,
        Math.min(cards.length - 1, (p.startIndex ?? 1) - 1)
    )
    const rig = useRef<Rig>({
        turn: opening,
        goal: opening,
        speed: 0,
        raf: 0,
        stamp: 0,
        inView: typeof IntersectionObserver === "undefined",
        tabShown: true,
        calm: false,
        holding: false,
        grabY: 0,
        grabTurn: 0,
        trailY: 0,
        trailT: 0,
        flick: 0,
        travelled: 0,
        wheelSum: 0,
        wheelAt: 0,
        autoTimer: 0,
    })

    const allowed = () => rig.current.inView && rig.current.tabShown

    const playback = (on: boolean) => {
        const box = boxRef.current
        if (!box) return
        box.querySelectorAll<HTMLVideoElement>(
            "video[data-noria-clip]"
        ).forEach((v) => {
            if (on && !rig.current.calm) {
                const go = v.play()
                if (go && go.catch) go.catch(() => {})
            } else v.pause()
        })
    }

    const draw = useCallback(() => {
        const r = rig.current
        const n = countRef.current
        const sp = spokeOf(n)
        const cap = liveProps.current.motionBlur ?? 6
        const smear = Math.min(cap, Math.abs(r.speed) * 1.6)
        for (let i = 0; i < n; i++) {
            const el = leafRefs.current[i]
            if (!el) continue
            el.style.transform = `rotateX(${hingeAngle(i, r.turn, sp)}deg)`
            el.style.filter =
                smear > 0.15 ? `blur(${smear.toFixed(2)}px)` : "none"
        }
    }, [])

    const clearAuto = () => {
        const r = rig.current
        if (r.autoTimer) {
            window.clearTimeout(r.autoTimer)
            r.autoTimer = 0
        }
    }

    const armAuto = () => {
        clearAuto()
        const lp = liveProps.current
        if (!lp.autoplay || !allowed() || rig.current.holding) return
        rig.current.autoTimer = window.setTimeout(
            () => {
                rig.current.autoTimer = 0
                if (allowed()) nudge(1)
            },
            Math.max(0.8, lp.interval ?? 3) * 1000
        )
    }

    const tick = (now: number) => {
        const r = rig.current
        if (!allowed()) {
            r.raf = 0
            return
        }
        const dt = Math.min(0.05, Math.max(0.001, (now - r.stamp) / 1000))
        r.stamp = now
        if (!r.holding) {
            const lp = liveProps.current
            const k = Math.max(20, lp.stiffness ?? 140)
            const zeta = Math.max(0.35, 1 - (lp.bounce ?? 0.2))
            const c = 2 * zeta * Math.sqrt(k)
            const pull = (r.goal - r.turn) * k - r.speed * c
            r.speed += pull * dt
            r.turn += r.speed * dt
        }
        draw()
        if (
            !r.holding &&
            Math.abs(r.goal - r.turn) < 0.0006 &&
            Math.abs(r.speed) < 0.004
        ) {
            r.turn = r.goal
            r.speed = 0
            draw()
            r.raf = 0
            armAuto()
            return
        }
        r.raf = requestAnimationFrame(tick)
    }

    const rouse = () => {
        const r = rig.current
        if (!allowed() || r.raf) return
        r.stamp = performance.now()
        r.raf = requestAnimationFrame(tick)
    }

    const nudge = (dir: number) => {
        const r = rig.current
        clearAuto()
        r.goal = Math.round(r.goal) + dir
        if (r.calm) {
            r.turn = r.goal
            r.speed = 0
            draw()
            armAuto()
            return
        }
        rouse()
    }

    const goTo = (slot: number) => {
        const r = rig.current
        const n = countRef.current
        const here = Math.round(r.goal)
        let diff = (((slot - here) % n) + n) % n
        if (diff > n / 2) diff -= n
        if (diff !== 0) nudge(diff)
    }

    const park = () => {
        const r = rig.current
        if (r.raf) cancelAnimationFrame(r.raf)
        r.raf = 0
        clearAuto()
        r.holding = false
        r.goal = Math.round(r.goal)
        r.turn = r.goal
        r.speed = 0
        r.wheelSum = 0
        draw()
        playback(false)
    }

    /* visibility, tab state, reduced motion */
    useEffect(() => {
        const r = rig.current
        const box = boxRef.current
        draw()

        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        r.calm = !!mq?.matches
        const onCalm = () => {
            r.calm = !!mq?.matches
        }
        mq?.addEventListener?.("change", onCalm)

        r.tabShown = document.visibilityState !== "hidden"
        const onTab = () => {
            r.tabShown = document.visibilityState !== "hidden"
            if (allowed()) {
                rouse()
                armAuto()
                playback(true)
            } else park()
        }
        document.addEventListener("visibilitychange", onTab)

        let io: IntersectionObserver | null = null
        if (box && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const hit = entries.some((e) => e.isIntersecting)
                    r.inView = hit
                    if (allowed()) {
                        rouse()
                        armAuto()
                        playback(true)
                    } else park()
                },
                { threshold: 0.01 }
            )
            io.observe(box)
        } else {
            r.inView = true
            armAuto()
            playback(true)
        }

        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            mq?.removeEventListener?.("change", onCalm)
            if (r.raf) cancelAnimationFrame(r.raf)
            r.raf = 0
            clearAuto()
        }
    }, [])

    /* repaint when the deck changes in the panel */
    useEffect(() => {
        draw()
        armAuto()
        playback(allowed())
    }, [cards, p.autoplay, p.interval])

    /* is the cursor over a card or within the reach margin around one? */
    const nearCards = (e: WheelEvent) => {
        const hit = (e.target as HTMLElement | null)?.closest?.(
            "[data-noria-slot]"
        )
        if (hit) return true
        const reach = Math.max(0, liveProps.current.wheelReach ?? 24)
        const n = countRef.current
        for (let i = 0; i < n; i++) {
            const el = leafRefs.current[i]
            if (!el) continue
            const b = el.getBoundingClientRect()
            if (
                e.clientX >= b.left - reach &&
                e.clientX <= b.right + reach &&
                e.clientY >= b.top - reach &&
                e.clientY <= b.bottom + reach
            )
                return true
        }
        return false
    }

    /* wheel stepping — one card per gesture */
    useEffect(() => {
        const box = boxRef.current
        if (!box) return
        const onWheel = (e: WheelEvent) => {
            if (!(liveProps.current.wheel ?? true)) return
            const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : 0
            if (!dy) return
            if (!nearCards(e)) {
                rig.current.wheelSum = 0
                return
            }
            e.preventDefault()
            const r = rig.current
            const now = performance.now()
            if (now - r.wheelAt < 380) {
                r.wheelSum = 0
                return
            }
            r.wheelSum += dy
            if (Math.abs(r.wheelSum) > 28) {
                nudge(r.wheelSum > 0 ? 1 : -1)
                r.wheelSum = 0
                r.wheelAt = now
            }
        }
        box.addEventListener("wheel", onWheel, { passive: false })
        return () => box.removeEventListener("wheel", onWheel)
    }, [])

    /* pointer drag + click to bring forward / open link */
    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest("[data-noria-btn]")) return
        const r = rig.current
        r.travelled = 0
        r.grabY = e.clientY
        r.trailY = e.clientY
        r.trailT = performance.now()
        r.flick = 0
        if (!(p.drag ?? true)) return
        clearAuto()
        r.holding = true
        r.grabTurn = r.turn
        r.speed = 0
        ;(e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId)
        rouse()
    }

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = rig.current
        r.travelled = Math.max(r.travelled, Math.abs(e.clientY - r.grabY))
        if (!r.holding) return
        const per = Math.max(60, h * 0.95)
        const now = performance.now()
        const was = r.turn
        r.turn = r.grabTurn + (e.clientY - r.grabY) / per
        const span = Math.max(1, now - r.trailT) / 1000
        r.flick = r.flick * 0.6 + ((r.turn - was) / span) * 0.4
        r.speed = r.flick
        r.trailT = now
        r.trailY = e.clientY
    }

    const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const r = rig.current
        const tapped = r.travelled < 6
        if (r.holding) {
            r.holding = false
            ;(e.currentTarget as HTMLDivElement).releasePointerCapture?.(
                e.pointerId
            )
            if (!tapped) {
                r.goal = Math.round(r.turn + r.flick * 0.16)
                rouse()
            } else {
                r.speed = 0
                rouse()
            }
        }
        if (tapped) {
            const leaf = (e.target as HTMLElement).closest(
                "[data-noria-slot]"
            ) as HTMLElement | null
            if (!leaf) return
            const slot = Number(leaf.dataset.noriaSlot)
            const n = countRef.current
            const front = ((Math.round(r.goal) % n) + n) % n
            if (slot === front) {
                const url = liveProps.current.cards?.[slot]?.link
                if (url) {
                    if (liveProps.current.newTab)
                        window.open(url, "_blank", "noopener")
                    else window.location.href = url
                }
            } else goTo(slot)
        }
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            nudge(1)
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            nudge(-1)
        }
    }

    const ringBtn = (dir: number, d: string, label: string) => (
        <button
            type="button"
            data-noria-btn=""
            aria-label={label}
            onClick={() => nudge(dir)}
            style={{
                width: btn,
                height: btn,
                padding: 0,
                borderRadius: "50%",
                border: `1.25px solid ${tone}`,
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.25s ease, transform 0.25s ease",
            }}
            onPointerEnter={(e) => {
                e.currentTarget.style.background = `${tone}12`
                e.currentTarget.style.transform = "scale(1.05)"
            }}
            onPointerLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.transform = "scale(1)"
            }}
        >
            <svg
                width={btn * 0.36}
                height={btn * 0.36}
                viewBox="0 0 24 24"
                fill="none"
                stroke={tone}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={d} />
            </svg>
        </button>
    )

    return (
        <div
            ref={boxRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Card wheel"
            tabIndex={0}
            onKeyDown={onKey}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                outline: "none",
                background: p.background ?? "#E8E8E8",
                cursor: (p.drag ?? true) ? "grab" : "default",
                touchAction: (p.drag ?? true) ? "pan-x" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: p.depth ?? 1400,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 0,
                        height: 0,
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${p.pitch ?? 0}deg) rotateY(${
                            p.yaw ?? -38
                        }deg)`,
                    }}
                >
                    {cards.map((c, i) => {
                        const pic = pictureOf(c)
                        const clip = clipOf(c)
                        return (
                            <div
                                key={i}
                                data-noria-slot={i}
                                ref={(el) => {
                                    leafRefs.current[i] = el
                                }}
                                style={{
                                    position: "absolute",
                                    left: -w / 2,
                                    top: -h,
                                    width: w,
                                    height: h,
                                    transformOrigin: "50% 100%",
                                    transform: `rotateX(${hingeAngle(
                                        i,
                                        rig.current.turn,
                                        spoke
                                    )}deg)`,
                                    backfaceVisibility: "visible",
                                    borderRadius: p.radius ?? 10,
                                    overflow: "hidden",
                                    background: c.color ?? "#1C3CEF",
                                    cursor: c.link ? "pointer" : undefined,
                                }}
                            >
                                {clip ? (
                                    <video
                                        src={clip}
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        data-noria-clip=""
                                        aria-label={c.alt || undefined}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            pointerEvents: "none",
                                            mixBlendMode: c.tint
                                                ? "luminosity"
                                                : "normal",
                                        }}
                                    />
                                ) : pic ? (
                                    <img
                                        src={pic}
                                        alt={c.alt || c.image?.alt || ""}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            pointerEvents: "none",
                                            mixBlendMode: c.tint
                                                ? "luminosity"
                                                : "normal",
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>
            {showArrows && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        [arrows.side === "left" ? "left" : "right"]:
                            arrows.inset ?? 28,
                        transform: "translateY(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: btn * 0.32,
                        zIndex: 2,
                    }}
                >
                    {ringBtn(
                        -1,
                        "M12 19V5M5.5 11.5 12 5l6.5 6.5",
                        "Previous card"
                    )}
                    {ringBtn(1, "M12 5v14M5.5 12.5 12 19l6.5-6.5", "Next card")}
                </div>
            )}
        </div>
    )
}

/* =====================================================================
 * Property controls
 * ===================================================================== */

addPropertyControls(Noria, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 16,
        defaultValue: SEED,
        control: {
            type: ControlType.Object,
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (t: Tile) => t.media === "video",
                },
                imageURL: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    hidden: (t: Tile) => t.media === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (t: Tile) => t.media !== "video",
                },
                videoURL: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    hidden: (t: Tile) => t.media !== "video",
                },
                color: {
                    type: ControlType.Color,
                    title: "Fill",
                    defaultValue: "#1C3CEF",
                },
                tint: {
                    type: ControlType.Boolean,
                    title: "Tint",
                    defaultValue: false,
                },
                alt: { type: ControlType.String, title: "Alt Text" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Card",
        defaultValue: 1,
        min: 1,
        max: 16,
        step: 1,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 320,
        min: 100,
        max: 700,
        step: 2,
        unit: "px",
    },
    aspect: {
        type: ControlType.Number,
        title: "Card Ratio",
        defaultValue: 0.78,
        min: 0.4,
        max: 1.6,
        step: 0.01,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 60,
        unit: "px",
    },
    yaw: {
        type: ControlType.Number,
        title: "Turn",
        defaultValue: -38,
        min: -80,
        max: 80,
        unit: "°",
    },
    pitch: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 0,
        min: -40,
        max: 40,
        unit: "°",
    },
    depth: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1400,
        min: 400,
        max: 4000,
        step: 50,
        unit: "px",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Spin Speed",
        defaultValue: 140,
        min: 30,
        max: 400,
        step: 5,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 0.2,
        min: 0,
        max: 0.6,
        step: 0.01,
    },
    motionBlur: {
        type: ControlType.Number,
        title: "Motion Blur",
        defaultValue: 6,
        min: 0,
        max: 16,
        step: 0.5,
        unit: "px",
    },
    wheel: {
        type: ControlType.Boolean,
        title: "Scroll Turns",
        defaultValue: true,
    },
    wheelReach: {
        type: ControlType.Number,
        title: "Scroll Reach",
        defaultValue: 24,
        min: 0,
        max: 200,
        unit: "px",
        hidden: (pr: Props) => pr.wheel === false,
    },
    drag: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 0.8,
        max: 12,
        step: 0.1,
        unit: "s",
        hidden: (pr: Props) => !pr.autoplay,
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            side: {
                type: ControlType.Enum,
                title: "Side",
                options: ["right", "left"],
                optionTitles: ["Right", "Left"],
                defaultValue: "right",
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 48,
                min: 24,
                max: 96,
                unit: "px",
            },
            tone: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#151515",
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 28,
                min: 0,
                max: 200,
                unit: "px",
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E8E8E8",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
})
