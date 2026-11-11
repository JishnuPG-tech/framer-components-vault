/**
 * Marketplace compliance
 *
 * 1. Static renderer — the export calls useIsStaticRenderer() first and returns
 *    a plain-div branch. That branch has no listeners, observers, timers, rAF,
 *    transitions or video playback; clips render as their poster still, or as a
 *    paused <video> with preload="none" and autoPlay={false}.
 * 2. Offscreen work — the live rAF loop starts locked out and only runs once an
 *    IntersectionObserver confirms visibility. It also re-checks tab visibility
 *    and prefers-reduced-motion every frame, self-sleeps when the rail settles,
 *    and cancels on unmount. Video playback follows the same permit: clips are
 *    paused when the section leaves the viewport, when the tab is hidden, and
 *    when the rail hands over to the mobile stack.
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


const TICK_CEIL = 1 / 20
const TEXT_BASE_WIDTH = 380
const AUDIT_EVERY = 0.22

const REST_TONES = [
    ["#e9e4dc", "#c8bfae"],
    ["#dee4e8", "#b9c3cb"],
    ["#e8dfe4", "#c7b8c4"],
    ["#e0e7dd", "#bdc9b8"],
    ["#efe6d8", "#d2c0a3"],
    ["#dcdfe9", "#b4bacd"],
    ["#e7e1d5", "#c6bba6"],
    ["#dde7e5", "#b6c8c5"],
    ["#eae2e2", "#ccb9b9"],
    ["#e3e2ec", "#bcbad2"],
    ["#e6ebe2", "#c3cdbc"],
    ["#ece4e0", "#d0bdb5"],
]

function inlineArt(svg: string) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

function samplePhoto(top: string, foot: string) {
    return inlineArt(
        "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1100'>" +
            "<defs>" +
            "<linearGradient id='a' x1='0' y1='0' x2='0.65' y2='1'>" +
            "<stop offset='0' stop-color='" +
            top +
            "'/><stop offset='1' stop-color='" +
            foot +
            "'/></linearGradient>" +
            "<radialGradient id='b' cx='0.32' cy='0.16' r='0.85'>" +
            "<stop offset='0' stop-color='#ffffff' stop-opacity='0.3'/>" +
            "<stop offset='1' stop-color='#ffffff' stop-opacity='0'/>" +
            "</radialGradient></defs>" +
            "<rect width='800' height='1100' fill='url(#a)'/>" +
            "<rect width='800' height='1100' fill='url(#b)'/>" +
            "</svg>"
    )
}

function sampleMark(glyph: string) {
    return inlineArt(
        "<svg xmlns='http://www.w3.org/2000/svg' width='124' height='28' fill='#ffffff'>" +
            glyph +
            "<rect x='38' y='7' width='68' height='6' rx='3'/>" +
            "<rect x='38' y='17' width='44' height='5' rx='2.5' opacity='0.6'/>" +
            "</svg>"
    )
}

const SAMPLE_CARDS = [
    {
        media: "image",
        image: samplePhoto("#2c3752", "#6d82ab"),
        logo: sampleMark("<circle cx='14' cy='14' r='13'/>"),
        title: "Platform",
        description: "Reimagining how people share a moment",
    },
    {
        media: "image",
        image: samplePhoto("#492e29", "#a9755c"),
        logo: sampleMark("<rect x='1' y='1' width='26' height='26' rx='8'/>"),
        title: "Product",
        description: "A calmer way to plan the working week",
    },
    {
        media: "image",
        image: samplePhoto("#22382d", "#6f9276"),
        logo: sampleMark("<path d='M14 1 27 27 1 27Z'/>"),
        title: "Brand",
        description: "Rebuilding an identity from the ground up",
    },
    {
        media: "image",
        image: samplePhoto("#38313f", "#8d8099"),
        logo: sampleMark("<path d='M14 1 27 14 14 27 1 14Z'/>"),
        title: "Interface",
        description: "Designing motion that guides attention",
    },
]

const beforePaint =
    typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function hold(value: number, low: number, high: number) {
    return value < low ? low : value > high ? high : value
}

function ring(value: number, low: number, width: number) {
    const shifted = value - low
    return low + (shifted - Math.floor(shifted / width) * width)
}

function chase(from: number, to: number, rate: number, tick: number) {
    return from + (to - from) * (1 - Math.pow(1 - rate, tick * 60))
}

function assetOf(entry: any) {
    if (!entry) return ""
    if (typeof entry === "string") return entry
    if (typeof entry.src === "string") return entry.src
    return ""
}

function pick(typed: any, upload: any) {
    const clean = typeof typed === "string" ? typed.trim() : ""
    return clean || assetOf(upload)
}

function words(entry: any) {
    return typeof entry === "string" ? entry : ""
}

function buildDeck(props: any) {
    const source = props.cards || []
    const deck: any[] = []
    for (let i = 0; i < source.length; i++) {
        const card = source[i] || {}
        const clip = pick(card.videoUrl, card.video)
        const wantsClip = (card.media || "image") === "video"
        const moving = wantsClip && !!clip
        deck.push({
            /* A clip card draws its still from the poster slot, a photo card
               from the image slot; only one pair is on show at a time. */
            src: wantsClip
                ? pick(card.posterUrl, card.poster)
                : pick(card.imageUrl, card.image),
            clip: moving ? clip : "",
            moving: moving,
            mark: pick(card.logoUrl, card.logo),
            title: words(card.title),
            note: words(card.description),
            href: card.link || "",
            rest: REST_TONES[i % REST_TONES.length],
        })
    }
    if (!deck.length) {
        for (let i = 0; i < 12; i++) {
            deck.push({
                src: "",
                clip: "",
                moving: false,
                mark: "",
                title: "",
                note: "",
                href: "",
                rest: REST_TONES[i % REST_TONES.length],
            })
        }
    }
    return deck
}

/* Resizes a font-control style object without mutating the original. */
function resize(font: any, factor: number, fallback: number) {
    const base = font && typeof font === "object" ? font : {}
    const raw = base.fontSize
    let px = fallback
    let unit = "px"
    if (typeof raw === "number") {
        px = raw
    } else if (typeof raw === "string") {
        const parsed = parseFloat(raw)
        if (!isNaN(parsed)) {
            px = parsed
            const tail = raw.replace(/^[-\d.\s]+/, "").trim()
            if (tail) unit = tail
        }
    }
    return { ...base, fontSize: px * factor + unit }
}

function scrimPaint(strength: number) {
    const top = 0.92 * strength
    const mid = 0.5 * strength
    return (
        "linear-gradient(to top, rgba(0,0,0," +
        top +
        ") 0%, rgba(0,0,0," +
        mid +
        ") 34%, rgba(0,0,0,0) 72%)"
    )
}

function plateFill(card: any, rest: any) {
    if (card.src || card.clip) return "#00000014"
    return "linear-gradient(150deg," + rest[0] + "," + rest[1] + ")"
}

/* Layout numbers shared by both branches, resolved against a container width. */
function resolveLayout(props: any, width: number) {
    const rail = props.rail || {}
    const small = props.small || {}
    const cut = small.breakpoint == null ? 700 : small.breakpoint
    const narrow = width > 0 && width <= cut

    const pickNum = (mob: any, desk: any, fallback: number) => {
        const chosen = narrow ? (mob == null ? desk : mob) : desk
        return chosen == null ? fallback : chosen
    }

    return {
        narrow,
        spanPct: hold(pickNum(small.width, rail.width, 26), 6, 100),
        ratio: Math.max(0.3, pickNum(small.ratio, rail.ratio, 0.72)),
        space: pickNum(small.spacing, rail.spacing, 22),
        textFactor: narrow
            ? small.textScale == null
                ? 0.86
                : small.textScale
            : 1,
    }
}

/* ------------------------------------------------------------------ */
/* Static branch — plain divs only, no listeners, no motion, no timers */
/* ------------------------------------------------------------------ */

function FriezeStill(props: any) {
    const rail = props.rail || {}
    const look = props.look || {}
    const head = props.heading || {}
    const sub = props.sub || {}
    const copy = props.copy || {}
    const mark = props.mark || {}
    const small = props.small || {}
    const deck = buildDeck(props)
    const wide = resolveLayout(props, 0)
    const tight = resolveLayout(props, 1)
    const radius = rail.radius == null ? 8 : rail.radius
    const veil = hold(copy.scrim == null ? 0.78 : copy.scrim, 0, 1)
    const titleFirst = copy.titleAbove !== false
    const stackable = small.stack !== false
    const cut = small.breakpoint == null ? 700 : small.breakpoint

    const rawId = typeof React.useId === "function" ? React.useId() : "s"
    const cls = "fz" + String(rawId).replace(/[^a-zA-Z0-9]/g, "")

    /* Plain divs only — the swap between the row and the mobile stack is a CSS
       container query, so the canvas and the export both size correctly with no
       measurement, listener or observer. Clips never play here: a poster still
       stands in, and with no poster the tag is left parked and unloaded. */
    const face = (card: any, factor: number) => {
        const hasCopy = !!(card.title || card.note)
        const inset = (copy.inset == null ? 22 : copy.inset) * factor
        const gap = (copy.gap == null ? 6 : copy.gap) * factor
        const noteNode = card.note ? (
            <div
                key="n"
                style={{
                    ...resize(sub.font, factor, 30),
                    color: sub.color || "#ffffff",
                    margin: 0,
                }}
            >
                {card.note}
            </div>
        ) : null
        const titleNode = card.title ? (
            <div
                key="t"
                style={{
                    ...resize(head.font, factor, 15),
                    color: head.color || "#e6e6e6",
                    margin: 0,
                }}
            >
                {card.title}
            </div>
        ) : null

        const bedStyle: any = {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
        }

        let bed: any = null
        if (card.src) {
            bed = <img src={card.src} alt="" style={bedStyle} />
        } else if (card.clip) {
            bed = (
                <video
                    src={card.clip}
                    autoPlay={false}
                    preload="none"
                    muted
                    playsInline
                    style={bedStyle}
                />
            )
        }

        return (
            <React.Fragment>
                {bed}
                {hasCopy && veil > 0 ? (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "62%",
                            background: scrimPaint(veil),
                        }}
                    />
                ) : null}
                {card.mark ? (
                    <img
                        src={card.mark}
                        alt=""
                        style={{
                            position: "absolute",
                            left:
                                (mark.inset == null ? 22 : mark.inset) * factor,
                            top:
                                (mark.inset == null ? 22 : mark.inset) * factor,
                            height:
                                (mark.height == null ? 26 : mark.height) *
                                factor,
                            width: "auto",
                            maxWidth: "68%",
                            objectFit: "contain",
                            objectPosition: "left top",
                            display: "block",
                            opacity: mark.opacity == null ? 1 : mark.opacity,
                        }}
                    />
                ) : null}
                {hasCopy ? (
                    <div
                        style={{
                            position: "absolute",
                            left: inset,
                            right: inset,
                            bottom: inset,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            textAlign: "left",
                            gap: gap,
                        }}
                    >
                        {titleFirst
                            ? [titleNode, noteNode]
                            : [noteNode, titleNode]}
                    </div>
                ) : null}
            </React.Fragment>
        )
    }

    const seats = Math.max(3, Math.ceil(100 / wide.spanPct) + 2)
    const tiles: any[] = []
    for (let i = 0; i < seats; i++) {
        const slot = deck[i % deck.length]
        const rest = slot.rest || REST_TONES[0]
        tiles.push(
            <div
                key={i}
                style={{
                    position: "relative",
                    flex: "0 0 auto",
                    marginLeft: i === 0 ? 0 : wide.space,
                    width: wide.spanPct + "%",
                    aspectRatio: String(wide.ratio),
                    borderRadius: radius,
                    overflow: "hidden",
                    background: plateFill(slot, rest),
                }}
            >
                {face(slot, 1)}
            </div>
        )
    }

    const rungs: any[] = []
    if (stackable) {
        for (let i = 0; i < deck.length; i++) {
            const slot = deck[i]
            const rest = slot.rest || REST_TONES[0]
            rungs.push(
                <div
                    key={i}
                    style={{
                        position: "relative",
                        flex: "0 0 auto",
                        width: tight.spanPct + "%",
                        aspectRatio: String(tight.ratio),
                        borderRadius: radius,
                        overflow: "hidden",
                        background: plateFill(slot, rest),
                    }}
                >
                    {face(slot, tight.textFactor)}
                </div>
            )
        }
    }

    const rule =
        "." +
        cls +
        "-stack{display:none;}@container " +
        cls +
        " (max-width:" +
        cut +
        "px){." +
        cls +
        "-rail{display:none !important;}." +
        cls +
        "-stack{display:flex !important;}}"

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                boxSizing: "border-box",
                background: look.backdrop || "#0d0d0e",
                containerType: "inline-size",
                containerName: cls,
            }}
        >
            {stackable ? <style>{rule}</style> : null}
            <div
                className={cls + "-rail"}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    alignItems: "center",
                    width: "140%",
                    justifyContent: "center",
                }}
            >
                {tiles}
            </div>
            {stackable ? (
                <div
                    className={cls + "-stack"}
                    style={{
                        position: "relative",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        width: "100%",
                        boxSizing: "border-box",
                        gap: small.stackGap == null ? 16 : small.stackGap,
                        padding: small.stackPad == null ? 0 : small.stackPad,
                    }}
                >
                    {rungs}
                </div>
            ) : null}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

function FriezeLive(props: any) {
    const rail = props.rail || {}
    const look = props.look || {}
    const head = props.heading || {}
    const sub = props.sub || {}
    const copy = props.copy || {}
    const mark = props.mark || {}
    const small = props.small || {}
    const tapCfg = props.tap || {}
    const film = props.film || {}

    const deck = React.useMemo(() => buildDeck(props), [props.cards])

    const stageRef = React.useRef<any>(null)
    const seatRef = React.useRef<any[]>([])
    const bayRef = React.useRef<any>(null)
    const frameRef = React.useRef<number>(0)
    const clockRef = React.useRef<number>(0)
    const okRef = React.useRef<boolean>(false)
    const inViewRef = React.useRef<boolean>(false)
    const tabRef = React.useRef<boolean>(true)
    const stillRef = React.useRef<boolean>(false)
    const stackRef = React.useRef<boolean>(false)

    const runRef = React.useRef<any>({
        pos: 0,
        vel: 0,
        anchor: null,
        held: false,
        id: -1,
        fromX: 0,
        startX: 0,
        startY: 0,
        locked: false,
        bailed: false,
        seed: 0,
        prevX: 0,
        prevAt: 0,
        audit: 0,
    })

    const [bay, setBay] = React.useState({
        w: 0,
        h: 0,
        seats: 0,
        cardW: 0,
        cardH: 0,
        narrow: false,
        textFactor: 1,
    })

    /* Bumped when the tab comes back, so the stack's playback observer is
       rebuilt and visible clips resume. */
    const [pulse, setPulse] = React.useState(0)

    const propRef = React.useRef<any>(props)
    propRef.current = props
    const deckRef = React.useRef<any[]>(deck)
    deckRef.current = deck

    /* ---- clip playback --------------------------------------------- */

    const startClip = React.useCallback((seat: any, cfg: any) => {
        const node = seat.vid
        if (!node) return
        const quiet = cfg.sound !== true
        if (node.muted !== quiet) node.muted = quiet
        const cycles = cfg.loop !== false
        if (node.loop !== cycles) node.loop = cycles
        if (seat.playing) return
        seat.playing = true
        try {
            const bid = node.play()
            if (bid && typeof bid.catch === "function") {
                bid.catch(() => {
                    seat.playing = false
                })
            }
        } catch (err) {
            seat.playing = false
        }
    }, [])

    const stopClip = React.useCallback((seat: any) => {
        const node = seat.vid
        if (!node || !seat.playing) return
        seat.playing = false
        try {
            node.pause()
        } catch (err) {}
    }, [])

    /* Only the clips nearest the middle of the rail are allowed to run, so a
       long deck never decodes twenty videos at once. */
    const ration = React.useCallback(() => {
        const seats = seatRef.current
        const cfg = propRef.current.film || {}
        const live =
            okRef.current && cfg.autoplay !== false && !stackRef.current
        const cap = Math.max(1, Math.round(cfg.budget == null ? 3 : cfg.budget))
        const queue: any[] = []

        for (let i = 0; i < seats.length; i++) {
            const seat = seats[i]
            if (!seat || !seat.vid) continue
            if (!live || seat.idle) {
                stopClip(seat)
                continue
            }
            queue.push(seat)
        }
        if (!queue.length) return

        queue.sort((a, b) => (a.dist || 0) - (b.dist || 0))
        for (let i = 0; i < queue.length; i++) {
            if (i < cap) startClip(queue[i], cfg)
            else stopClip(queue[i])
        }
    }, [startClip, stopClip])

    /* Pauses every clip the component owns, rail seats and mobile stack alike. */
    const hush = React.useCallback(() => {
        const seats = seatRef.current
        for (let i = 0; i < seats.length; i++) {
            if (seats[i]) stopClip(seats[i])
        }
        const node = stageRef.current
        if (!node || !node.querySelectorAll) return
        const clips: any = node.querySelectorAll("video")
        for (let i = 0; i < clips.length; i++) {
            try {
                clips[i].pause()
            } catch (err) {}
        }
    }, [stopClip])

    /* ---- measurement ------------------------------------------------ */

    const gauge = React.useCallback(() => {
        const node = stageRef.current
        if (!node) return
        const p = propRef.current
        const w = node.clientWidth
        const h = node.clientHeight
        if (w < 2 || h < 2) return

        const layout = resolveLayout(p, w)
        let cardW = (w * layout.spanPct) / 100
        let cardH = cardW / layout.ratio
        const roof = h * 0.92
        if (cardH > roof) {
            cardH = roof
            cardW = cardH * layout.ratio
        }
        const step = Math.max(cardW * 0.15, cardW + layout.space)

        const stock = deckRef.current.length || 1
        const span = Math.ceil((w + cardW * 3 + step) / step) + 4
        const seats = Math.min(64, Math.max(span, stock))

        bayRef.current = {
            w,
            h,
            cardW,
            cardH,
            step,
            seats,
            belt: seats * step,
            midX: w / 2,
            midY: h / 2,
            ready: true,
        }

        setBay((prev) => {
            if (
                prev.w === w &&
                prev.h === h &&
                prev.seats === seats &&
                prev.narrow === layout.narrow &&
                prev.textFactor === layout.textFactor &&
                Math.abs(prev.cardW - cardW) < 0.5 &&
                Math.abs(prev.cardH - cardH) < 0.5
            ) {
                return prev
            }
            return {
                w,
                h,
                seats,
                cardW,
                cardH,
                narrow: layout.narrow,
                textFactor: layout.textFactor,
            }
        })
    }, [])

    const draw = React.useCallback(
        (tick: number) => {
            const bag = bayRef.current
            if (!bag || !bag.ready) return false
            const p = propRef.current
            const mv = p.motion || {}
            const lk = p.look || {}
            const run = runRef.current
            const seats = seatRef.current
            let alive = false

            if (run.held) {
                alive = true
                run.anchor = null
            } else if (Math.abs(run.vel) > 2) {
                const keep = Math.pow(
                    hold(mv.glide == null ? 0.9 : mv.glide, 0.5, 0.98),
                    tick * 60
                )
                run.pos += run.vel * tick
                run.vel *= keep
                alive = true
                run.anchor = null
            } else {
                run.vel = 0
                const cruise = mv.cruise || 0
                if (cruise > 0) {
                    run.pos -= cruise * tick
                    alive = true
                } else if (mv.snap !== false) {
                    if (run.anchor === null) {
                        run.anchor = Math.round(run.pos / bag.step) * bag.step
                    }
                    if (Math.abs(run.pos - run.anchor) > 0.25) {
                        run.pos = chase(run.pos, run.anchor, 0.14, tick)
                        alive = true
                    } else {
                        run.pos = run.anchor
                    }
                }
            }

            const wash = hold(lk.wash == null ? 0.45 : lk.wash, 0, 1)
            const drain = hold(lk.drain == null ? 0 : lk.drain, 0, 1)
            const lip = bag.cardW / 2
            const top = Math.round((bag.midY - bag.cardH / 2) * 100) / 100
            const skirt = bag.cardW + bag.step * 0.5

            for (let i = 0; i < seats.length; i++) {
                const seat = seats[i]
                if (!seat || !seat.el) continue

                const along = ring(
                    seat.slot * bag.step + run.pos,
                    -bag.belt / 2,
                    bag.belt
                )
                const x = bag.midX + along - lip
                seat.dist = Math.abs(along)

                if (x + bag.cardW < -skirt || x > bag.w + skirt) {
                    if (!seat.idle) {
                        seat.el.style.transform = "translate3d(-99999px,0,0)"
                        seat.el.style.opacity = "0"
                        seat.idle = true
                        seat.stamp = ""
                        seat.tone = -1
                        seat.grey = -1
                        if (seat.vid) stopClip(seat)
                    }
                    continue
                }
                seat.idle = false

                const stamp =
                    "translate3d(" +
                    Math.round(x * 100) / 100 +
                    "px," +
                    top +
                    "px,0)"
                if (stamp !== seat.stamp) {
                    seat.el.style.transform = stamp
                    seat.stamp = stamp
                }

                const off = Math.min(1, Math.abs(along) / (bag.w * 0.55 + 1))
                const fade = 1 - wash * off * off
                const grey = Math.round(drain * off * 100)
                const tone = Math.round(fade * 100)
                if (tone !== seat.tone) {
                    seat.el.style.opacity = String(fade)
                    seat.tone = tone
                }
                if (grey !== seat.grey) {
                    seat.el.style.filter =
                        grey > 0 ? "grayscale(" + grey + "%)" : "none"
                    seat.grey = grey
                }
            }

            /* Re-rank the clips on a slow cadence rather than every frame, plus
               once more the moment the rail comes to rest. */
            run.audit -= tick
            if (tick === 0 || !alive || run.audit <= 0) {
                run.audit = AUDIT_EVERY
                ration()
            }

            return alive
        },
        [ration, stopClip]
    )

    const halt = React.useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = 0
        }
    }, [])

    const step = React.useCallback(
        (now: number) => {
            frameRef.current = 0
            if (!okRef.current) return
            const tick = hold((now - clockRef.current) / 1000, 0, TICK_CEIL)
            clockRef.current = now
            if (draw(tick) && okRef.current) {
                frameRef.current = requestAnimationFrame(step)
            }
        },
        [draw]
    )

    const wake = React.useCallback(() => {
        if (!okRef.current) {
            if (inViewRef.current && tabRef.current) draw(0)
            return
        }
        if (frameRef.current) return
        clockRef.current =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        frameRef.current = requestAnimationFrame(step)
    }, [step, draw])

    const arbitrate = React.useCallback(() => {
        const permit =
            inViewRef.current &&
            tabRef.current &&
            !stillRef.current &&
            !stackRef.current
        if (permit === okRef.current) return
        okRef.current = permit
        if (permit) {
            wake()
        } else {
            halt()
            const run = runRef.current
            run.held = false
            run.id = -1
            run.vel = 0
            ration()
        }
    }, [wake, halt, ration])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        let probe: any = null
        const onStill = () => {
            stillRef.current = probe ? probe.matches : false
            arbitrate()
            draw(0)
        }
        if (typeof window.matchMedia === "function") {
            probe = window.matchMedia("(prefers-reduced-motion: reduce)")
            stillRef.current = probe.matches
            if (probe.addEventListener)
                probe.addEventListener("change", onStill)
            else if (probe.addListener) probe.addListener(onStill)
        }
        const onTab = () => {
            tabRef.current = !document.hidden
            if (document.hidden) hush()
            else setPulse((n) => n + 1)
            arbitrate()
        }
        document.addEventListener("visibilitychange", onTab)
        return () => {
            document.removeEventListener("visibilitychange", onTab)
            if (probe) {
                if (probe.removeEventListener)
                    probe.removeEventListener("change", onStill)
                else if (probe.removeListener) probe.removeListener(onStill)
            }
        }
    }, [arbitrate, draw, hush])

    React.useEffect(() => {
        const node = stageRef.current
        if (!node || typeof window === "undefined") return
        if (typeof IntersectionObserver === "undefined") {
            inViewRef.current = true
            arbitrate()
            return
        }
        const eye = new IntersectionObserver(
            (rows) => {
                let on = false
                for (const row of rows) if (row.isIntersecting) on = true
                inViewRef.current = on
                if (!on) hush()
                arbitrate()
            },
            { rootMargin: "80px", threshold: 0 }
        )
        eye.observe(node)
        return () => eye.disconnect()
    }, [arbitrate, hush])

    React.useEffect(() => {
        const node = stageRef.current
        if (!node || typeof window === "undefined") return
        gauge()
        if (typeof ResizeObserver === "undefined") {
            const onSize = () => gauge()
            window.addEventListener("resize", onSize)
            return () => window.removeEventListener("resize", onSize)
        }
        const ro = new ResizeObserver(() => gauge())
        ro.observe(node)
        return () => ro.disconnect()
    }, [
        gauge,
        rail.width,
        rail.ratio,
        rail.spacing,
        small.breakpoint,
        small.width,
        small.ratio,
        small.spacing,
        small.textScale,
        deck.length,
    ])

    beforePaint(() => {
        for (const seat of seatRef.current) {
            if (seat) {
                seat.stamp = ""
                seat.tone = -1
                seat.grey = -1
                seat.idle = false
            }
        }
        draw(0)
        wake()
    }, [bay, draw, wake])

    React.useEffect(() => {
        draw(0)
    })

    /* Property-panel edits to the clip settings take effect without a reload. */
    React.useEffect(() => {
        ration()
    }, [ration, film.autoplay, film.budget, film.sound, film.loop, deck])

    React.useEffect(
        () => () => {
            halt()
            hush()
        },
        [halt, hush]
    )

    const stir = React.useCallback(() => {
        if (okRef.current) wake()
        else draw(0)
    }, [wake, draw])

    React.useEffect(() => {
        const node = stageRef.current
        if (!node) return
        const onWheel = (e: any) => {
            if (stackRef.current) return
            const mv = propRef.current.motion || {}
            const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            if (!sideways && mv.wheelVertical === false) return
            const push = sideways ? e.deltaX : e.deltaY
            if (e.cancelable) e.preventDefault()
            const run = runRef.current
            run.vel = hold(
                run.vel - push * (mv.wheel == null ? 1 : mv.wheel) * 11,
                -11000,
                11000
            )
            run.anchor = null
            stir()
        }
        node.addEventListener("wheel", onWheel, { passive: false })
        return () => node.removeEventListener("wheel", onWheel)
    }, [stir])

    const cardFor = (index: number) => {
        const list = deckRef.current
        return list[((index % list.length) + list.length) % list.length]
    }

    const openCard = (card: any) => {
        const cfg = propRef.current.tap || {}
        if ((cfg.action || "link") !== "link") return
        if (!card || !card.href || typeof window === "undefined") return
        if (cfg.target === "same") window.location.href = card.href
        else window.open(card.href, "_blank", "noopener,noreferrer")
    }

    const take = (e: any) => {
        const run = runRef.current
        run.held = true
        run.id = e.pointerId
        run.fromX = e.clientX
        run.startX = e.clientX
        run.startY = e.clientY
        run.seed = run.pos
        run.prevX = e.clientX
        run.prevAt =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        run.vel = 0
        run.anchor = null
        run.locked = false
        run.bailed = false
        /* The pointer is captured only once the gesture reads as horizontal,
           so an upward swipe still scrolls the page. */
        stir()
    }

    const sweep = (e: any) => {
        const run = runRef.current
        if (!run.held || run.id !== e.pointerId) return

        if (!run.locked) {
            const dx = e.clientX - run.startX
            const dy = e.clientY - run.startY
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
                run.bailed = true
                run.held = false
                run.id = -1
                return
            }
            if (Math.abs(dx) < 6) return
            run.locked = true
            run.seed = run.pos
            run.fromX = e.clientX
            run.prevX = e.clientX
            run.prevAt =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch (err) {}
        }

        const mv = propRef.current.motion || {}
        const gain = mv.drag == null ? 1 : mv.drag
        run.pos = run.seed + (e.clientX - run.fromX) * gain
        const now =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        const lag = Math.max(8, now - run.prevAt)
        run.vel = hold(
            ((e.clientX - run.prevX) * gain * 1000) / lag,
            -11000,
            11000
        )
        run.prevX = e.clientX
        run.prevAt = now
        stir()
    }

    const drop = (e: any) => {
        const run = runRef.current
        if (run.id !== e.pointerId) return
        run.held = false
        run.id = -1
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch (err) {}

        const slid = Math.abs(e.clientX - run.startX)
        const lifted = Math.abs(e.clientY - run.startY)
        if (
            !run.locked &&
            slid <= 10 &&
            lifted <= 12 &&
            e.type === "pointerup" &&
            typeof document !== "undefined"
        ) {
            const under = document.elementFromPoint(e.clientX, e.clientY)
            const owner =
                under && under.closest ? under.closest("[data-seat]") : null
            if (owner) {
                const seatIndex = Number(owner.getAttribute("data-seat"))
                const seat = seatRef.current[seatIndex]
                if (seat) openCard(cardFor(seat.slot))
            }
        }
        stir()
    }

    const keyStep = (e: any) => {
        const bag = bayRef.current
        if (!bag) return
        const run = runRef.current
        if (e.key === "ArrowLeft")
            run.anchor = Math.round(run.pos / bag.step) * bag.step + bag.step
        else if (e.key === "ArrowRight")
            run.anchor = Math.round(run.pos / bag.step) * bag.step - bag.step
        else return
        e.preventDefault()
        run.vel = 0
        stir()
    }

    /* Below the mobile threshold the rail can hand over to a plain vertical
       stack: every card listed once, no loop, no drag, no rAF. */
    const layout = resolveLayout(props, bay.w)
    const stacked = bay.w > 0 && layout.narrow && small.stack !== false
    const stackCardW = (bay.w * layout.spanPct) / 100

    React.useEffect(() => {
        stackRef.current = stacked
        if (stacked) hush()
        arbitrate()
    }, [stacked, arbitrate, hush])

    /* In stack mode the rail loop is parked, so clips there get their own
       observer: a card plays only while it is actually on screen. */
    React.useEffect(() => {
        if (!stacked) return
        const root = stageRef.current
        if (!root || typeof window === "undefined") return
        const cfg = propRef.current.film || {}
        if (cfg.autoplay === false || stillRef.current || !tabRef.current)
            return
        const clips: any = root.querySelectorAll("video")
        if (!clips.length) return
        if (typeof IntersectionObserver === "undefined") return

        const quiet = cfg.sound !== true
        const cycles = cfg.loop !== false
        const eye = new IntersectionObserver(
            (rows) => {
                for (const row of rows) {
                    const node: any = row.target
                    if (row.isIntersecting && tabRef.current) {
                        node.muted = quiet
                        node.loop = cycles
                        try {
                            const bid = node.play()
                            if (bid && typeof bid.catch === "function")
                                bid.catch(() => {})
                        } catch (err) {}
                    } else {
                        try {
                            node.pause()
                        } catch (err) {}
                    }
                }
            },
            { threshold: 0.4 }
        )
        for (let i = 0; i < clips.length; i++) eye.observe(clips[i])
        return () => {
            eye.disconnect()
            for (let i = 0; i < clips.length; i++) {
                try {
                    clips[i].pause()
                } catch (err) {}
            }
        }
    }, [stacked, pulse, deck, film.autoplay, film.sound, film.loop, bay.w])

    /* Copy sizing: cards shrink with the container, so the overlay scales with
       the card width and then again by the mobile text factor. */
    const autoFit = copy.autoScale !== false
    const measure = stacked ? stackCardW : bay.cardW
    const fitFactor = autoFit
        ? hold((measure || TEXT_BASE_WIDTH) / TEXT_BASE_WIDTH, 0.55, 1.9)
        : 1
    const factor = fitFactor * (layout.textFactor || 1)

    const titleStyle = resize(head.font, factor, 15)
    const noteStyle = resize(sub.font, factor, 30)
    const inset = (copy.inset == null ? 22 : copy.inset) * factor
    const gap = (copy.gap == null ? 6 : copy.gap) * factor
    const veil = hold(copy.scrim == null ? 0.78 : copy.scrim, 0, 1)
    const titleFirst = copy.titleAbove !== false
    const markHigh = (mark.height == null ? 26 : mark.height) * factor
    const markInset = (mark.inset == null ? 22 : mark.inset) * factor
    const markFade = mark.opacity == null ? 1 : mark.opacity
    const radius = rail.radius == null ? 8 : rail.radius
    const linkable = (tapCfg.action || "link") === "link"
    const clipQuiet = film.sound !== true
    const clipLoop = film.loop !== false

    /* One card face, used by both the rail seats and the mobile stack. The
       optional catcher hands the <video> element back to its seat record. */
    const face = (card: any, catcher: any) => {
        const hasCopy = !!(card.title || card.note)
        const noteNode = card.note ? (
            <div
                key="n"
                style={{
                    ...noteStyle,
                    color: sub.color || "#ffffff",
                    margin: 0,
                }}
            >
                {card.note}
            </div>
        ) : null
        const titleNode = card.title ? (
            <div
                key="t"
                style={{
                    ...titleStyle,
                    color: head.color || "#e6e6e6",
                    margin: 0,
                }}
            >
                {card.title}
            </div>
        ) : null

        const bedStyle: any = {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
        }

        let bed: any = null
        if (card.moving && card.clip) {
            bed = (
                <video
                    ref={catcher || undefined}
                    src={card.clip}
                    poster={card.src || undefined}
                    muted={clipQuiet}
                    loop={clipLoop}
                    playsInline
                    preload="metadata"
                    disablePictureInPicture
                    draggable={false}
                    style={bedStyle}
                />
            )
        } else if (card.src) {
            bed = (
                <img
                    src={card.src}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    style={bedStyle}
                />
            )
        }

        return (
            <React.Fragment>
                {bed}

                {hasCopy && veil > 0 ? (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "62%",
                            background: scrimPaint(veil),
                            pointerEvents: "none",
                        }}
                    />
                ) : null}

                {card.mark ? (
                    <img
                        src={card.mark}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        style={{
                            position: "absolute",
                            left: markInset,
                            top: markInset,
                            height: markHigh,
                            width: "auto",
                            maxWidth: "68%",
                            objectFit: "contain",
                            objectPosition: "left top",
                            display: "block",
                            opacity: markFade,
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    />
                ) : null}

                {hasCopy ? (
                    <div
                        style={{
                            position: "absolute",
                            left: inset,
                            right: inset,
                            bottom: inset,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            textAlign: "left",
                            gap: gap,
                            userSelect: "none",
                            pointerEvents: "none",
                        }}
                    >
                        {titleFirst
                            ? [titleNode, noteNode]
                            : [noteNode, titleNode]}
                    </div>
                ) : null}
            </React.Fragment>
        )
    }

    const seatNodes: any[] = []
    if (bay.seats > 0 && !stacked) {
        seatRef.current.length = bay.seats
        const half = Math.floor(bay.seats / 2)
        for (let i = 0; i < bay.seats; i++) {
            const slot = i - half
            const card = cardFor(slot)
            const rest = card.rest || REST_TONES[0]

            /* React re-runs an inline ref on every render, so the record is
               only reset when the element genuinely changes — a re-render must
               not interrupt a clip that is already running. */
            const catcher = card.moving
                ? (node: any) => {
                      const held = seatRef.current[i] || {}
                      if (held.vid !== node) {
                          held.vid = node || null
                          held.playing = false
                      }
                      seatRef.current[i] = held
                  }
                : null

            seatNodes.push(
                <div
                    key={i}
                    data-seat={i}
                    ref={(node) => {
                        if (!node) {
                            seatRef.current[i] = null
                            return
                        }
                        const held = seatRef.current[i] || {}
                        held.el = node
                        held.slot = slot
                        held.stamp = held.stamp || ""
                        seatRef.current[i] = held
                    }}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: bay.cardW,
                        height: bay.cardH,
                        transformOrigin: "0 0",
                        transform: "translate3d(-99999px,0,0)",
                        borderRadius: radius,
                        overflow: "hidden",
                        background: plateFill(card, rest),
                        cursor: linkable && card.href ? "pointer" : "grab",
                        backfaceVisibility: "hidden",
                    }}
                >
                    {face(card, catcher)}
                </div>
            )
        }
    }

    if (stacked) {
        const list = deckRef.current
        const rungs: any[] = []
        for (let i = 0; i < list.length; i++) {
            const card = list[i]
            const rest = card.rest || REST_TONES[0]
            rungs.push(
                <div
                    key={i}
                    onClick={() => openCard(card)}
                    style={{
                        position: "relative",
                        flex: "0 0 auto",
                        width: layout.spanPct + "%",
                        aspectRatio: String(layout.ratio),
                        borderRadius: radius,
                        overflow: "hidden",
                        background: plateFill(card, rest),
                        cursor: linkable && card.href ? "pointer" : "default",
                    }}
                >
                    {face(card, null)}
                </div>
            )
        }

        const inner = small.stackScroll === true

        return (
            <div
                ref={stageRef}
                style={{
                    ...props.style,
                    position: "relative",
                    height: inner ? "100%" : "auto",
                    maxHeight: inner ? "100%" : undefined,
                    minHeight: 0,
                    overflowX: "hidden",
                    overflowY: inner ? "auto" : "visible",
                    overscrollBehaviorY: inner ? "contain" : undefined,
                    WebkitOverflowScrolling: "touch",
                    touchAction: "pan-y",
                    boxSizing: "border-box",
                    background: look.backdrop || "#0d0d0e",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: small.stackGap == null ? 16 : small.stackGap,
                    padding: small.stackPad == null ? 0 : small.stackPad,
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {rungs}
            </div>
        )
    }

    const veilWidth = hold(look.fade == null ? 14 : look.fade, 0, 45)
    const veilTone = look.fadeTone || look.backdrop || "#0d0d0e"

    return (
        <div
            ref={stageRef}
            tabIndex={0}
            onPointerDown={take}
            onPointerMove={sweep}
            onPointerUp={drop}
            onPointerCancel={drop}
            onKeyDown={keyStep}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                background: look.backdrop || "#0d0d0e",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
                cursor: "grab",
            }}
        >
            {seatNodes}
            {veilWidth > 0 ? (
                <React.Fragment>
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: veilWidth + "%",
                            zIndex: 200,
                            pointerEvents: "none",
                            background:
                                "linear-gradient(to right, " +
                                veilTone +
                                ", rgba(0,0,0,0))",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: veilWidth + "%",
                            zIndex: 200,
                            pointerEvents: "none",
                            background:
                                "linear-gradient(to left, " +
                                veilTone +
                                ", rgba(0,0,0,0))",
                        }}
                    />
                </React.Fragment>
            ) : null}
        </div>
    )
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Frieze(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <FriezeStill {...props} />
    return <FriezeLive {...props} />
}

/**
 * @framerDisableUnlink
 */
addPropertyControls(Frieze, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            title: "Card",
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
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (p: any) => (p.media || "image") === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    description: "Overrides the upload when filled",
                    hidden: (p: any) => (p.media || "image") === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "ogg", "mov", "m4v"],
                    hidden: (p: any) => (p.media || "image") !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    defaultValue: "",
                    description:
                        "Overrides the upload; use a direct MP4 or WebM file, not a player page",
                    hidden: (p: any) => (p.media || "image") !== "video",
                },
                poster: {
                    type: ControlType.Image,
                    title: "Poster",
                    hidden: (p: any) => (p.media || "image") !== "video",
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    description:
                        "Still shown before the clip plays, and on the canvas",
                    hidden: (p: any) => (p.media || "image") !== "video",
                },
                logo: { type: ControlType.Image, title: "Logo" },
                logoUrl: {
                    type: ControlType.String,
                    title: "Logo URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    description: "Sits in the top-left corner of the card",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                    displayTextArea: true,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: SAMPLE_CARDS,
    },
    rail: {
        type: ControlType.Object,
        title: "Rail",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Card Width",
                min: 6,
                max: 70,
                step: 1,
                defaultValue: 26,
                unit: "%",
            },
            ratio: {
                type: ControlType.Number,
                title: "Card Ratio",
                min: 0.4,
                max: 2.4,
                step: 0.02,
                defaultValue: 0.72,
                description: "Width ÷ height",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: -240,
                max: 240,
                step: 1,
                defaultValue: 22,
                description: "Distance between cards; negative overlaps them",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                step: 1,
                defaultValue: 8,
            },
        },
    },
    film: {
        type: ControlType.Object,
        title: "Video",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
                description: "Off leaves every clip parked on its poster still",
            },
            budget: {
                type: ControlType.Number,
                title: "Playing At Once",
                min: 1,
                max: 8,
                step: 1,
                defaultValue: 3,
                description:
                    "Only the clips nearest the middle play; the rest stay paused",
                hidden: (p: any) => p.autoplay === false,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
            },
            sound: {
                type: ControlType.Boolean,
                title: "Sound",
                defaultValue: false,
                description:
                    "Browsers block autoplay with sound, so clips may stay paused until tapped",
            },
        },
    },
    heading: {
        type: ControlType.Object,
        title: "Title",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans",
                defaultValue: {
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: "1.4em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#e6e6e6",
            },
        },
    },
    sub: {
        type: ControlType.Object,
        title: "Description",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans",
                defaultValue: {
                    fontSize: 30,
                    fontWeight: 600,
                    lineHeight: "1.25em",
                    letterSpacing: "-0.01em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
            },
        },
    },
    copy: {
        type: ControlType.Object,
        title: "Text Layout",
        controls: {
            titleAbove: {
                type: ControlType.Boolean,
                title: "Title On Top",
                defaultValue: true,
                description: "Off puts the title under the description",
            },
            inset: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 22,
            },
            gap: {
                type: ControlType.Number,
                title: "Line Gap",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 6,
            },
            scrim: {
                type: ControlType.Number,
                title: "Shade",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: 0.78,
                description: "Dark wash behind the text so it stays readable",
            },
            autoScale: {
                type: ControlType.Boolean,
                title: "Scale With Card",
                defaultValue: true,
                description: "Text grows and shrinks with the card size",
            },
        },
    },
    mark: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 8,
                max: 120,
                step: 1,
                defaultValue: 26,
            },
            inset: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 22,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: 1,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Movement",
        controls: {
            drag: {
                type: ControlType.Number,
                title: "Drag Speed",
                min: 0.3,
                max: 2.5,
                step: 0.05,
                defaultValue: 1,
            },
            wheel: {
                type: ControlType.Number,
                title: "Wheel Speed",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            glide: {
                type: ControlType.Number,
                title: "Glide",
                min: 0.5,
                max: 0.98,
                step: 0.01,
                defaultValue: 0.9,
            },
            wheelVertical: {
                type: ControlType.Boolean,
                title: "Vertical Wheel",
                defaultValue: true,
                description: "Off leaves up/down scrolling to the page",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap To Card",
                defaultValue: true,
            },
            cruise: {
                type: ControlType.Number,
                title: "Auto Scroll",
                min: 0,
                max: 220,
                step: 1,
                defaultValue: 0,
                description: "Pixels per second while untouched",
            },
        },
    },
    small: {
        type: ControlType.Object,
        title: "Mobile",
        controls: {
            breakpoint: {
                type: ControlType.Number,
                title: "Below",
                min: 320,
                max: 1200,
                step: 10,
                defaultValue: 700,
                unit: "px",
                description:
                    "Component width at which the settings below take over",
            },
            stack: {
                type: ControlType.Boolean,
                title: "Vertical Stack",
                defaultValue: true,
                description:
                    "Below the threshold, drop the carousel and list every card down the page — no loop, no drag",
            },
            stackGap: {
                type: ControlType.Number,
                title: "Stack Gap",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: 16,
                hidden: (p: any) => p.stack === false,
            },
            stackPad: {
                type: ControlType.Number,
                title: "Stack Padding",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) => p.stack === false,
            },
            stackScroll: {
                type: ControlType.Boolean,
                title: "Scroll Inside",
                defaultValue: false,
                description:
                    "Off lets the section grow so the page scrolls — set the layer height to Fit. On keeps the layer height and scrolls the list within it",
                hidden: (p: any) => p.stack === false,
            },
            width: {
                type: ControlType.Number,
                title: "Card Width",
                min: 20,
                max: 100,
                step: 1,
                defaultValue: 100,
                unit: "%",
            },
            ratio: {
                type: ControlType.Number,
                title: "Card Ratio",
                min: 0.4,
                max: 2.4,
                step: 0.02,
                defaultValue: 0.72,
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: -160,
                max: 160,
                step: 1,
                defaultValue: 14,
                hidden: (p: any) => p.stack !== false,
            },
            textScale: {
                type: ControlType.Number,
                title: "Text Scale",
                min: 0.5,
                max: 1.6,
                step: 0.02,
                defaultValue: 0.92,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            backdrop: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0d0d0e",
            },
            fade: {
                type: ControlType.Number,
                title: "Edge Fade",
                min: 0,
                max: 45,
                step: 1,
                defaultValue: 14,
                unit: "%",
            },
            fadeTone: {
                type: ControlType.Color,
                title: "Fade Tone",
                defaultValue: "#0d0d0e",
            },
            wash: {
                type: ControlType.Number,
                title: "Side Fade",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: 0.45,
            },
            drain: {
                type: ControlType.Number,
                title: "Side Desaturate",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: 0,
            },
        },
    },
    tap: {
        type: ControlType.Object,
        title: "Tap",
        controls: {
            action: {
                type: ControlType.Enum,
                title: "Action",
                options: ["link", "none"],
                optionTitles: ["Open CMS Link", "None"],
                defaultValue: "link",
            },
            target: {
                type: ControlType.Enum,
                title: "Open In",
                options: ["new", "same"],
                optionTitles: ["New Tab", "Same Tab"],
                defaultValue: "new",
                hidden: (p: any) => (p.action || "link") !== "link",
            },
        },
    },
})
