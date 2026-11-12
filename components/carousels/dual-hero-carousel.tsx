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


type Entry = {
    image?: { src?: string; srcSet?: string; alt?: string }
    imageUrl?: string
    title?: string
    description?: string
    link?: string
    width?: number
    height?: number
}

type FontValue = Record<string, any>

interface Props {
    headingLead: string
    headingWords: string[]
    wordInterval: number
    magnet: number
    leftLabel: string
    leftLink: string
    rightLabel: string
    rightLink: string
    showSideLinks: boolean
    upperRow: Entry[]
    lowerRow: Entry[]
    sizing: { scale: number; gap: number; radius: number; edgeInset: number }
    motion: {
        drift: number
        pauseOnHover: boolean
        wheelRail: boolean
        wheelForce: number
        glide: number
        softness: number
        entrance: boolean
    }
    look: {
        background: string
        headingColor: string
        accentColor: string
        sideColor: string
        placeholder: string
        dimOthers: number
        hoverZoom: number
        monoUntilHover: boolean
        overlay: string
        panelTitle: string
        panelText: string
        panelRadius: number
        closeFill: string
        closeIcon: string
    }
    headingFont: FontValue
    accentFont: FontValue
    sideFont: FontValue
    popupTitleFont: FontValue
    popupTextFont: FontValue
    style?: React.CSSProperties
}

const pic = (id: number) => `https://picsum.photos/id/${id}/900/1200`

const UPPER: Entry[] = [
    {
        imageUrl: pic(1005),
        title: "Ines Calloway",
        description:
            "Stylist shaping quiet, tactile wardrobes for editorial and campaign work across three continents.",
        width: 104,
        height: 168,
    },
    {
        imageUrl: pic(1011),
        title: "Theo Marlow",
        description:
            "Director and cinematographer drawn to long takes, natural light and stories told in silence.",
        width: 118,
        height: 76,
    },
    {
        imageUrl: pic(1027),
        title: "Ruth Okafor",
        description:
            "Photographer working between studio portraiture and slow documentary series.",
        width: 104,
        height: 122,
    },
    {
        imageUrl: pic(64),
        title: "Lena Varga",
        description:
            "Portrait photographer known for warm palettes and unguarded, in-between moments.",
        width: 108,
        height: 148,
    },
    {
        imageUrl: pic(338),
        title: "Silas Brandt",
        description:
            "Stylist and set builder blending found objects with sharp tailoring.",
        width: 104,
        height: 154,
    },
    {
        imageUrl: pic(1012),
        title: "Hugo Ferreira",
        description:
            "Director and photographer chasing motion, grain and the edges of the frame.",
        width: 118,
        height: 74,
    },
    {
        imageUrl: pic(91),
        title: "Noor Haddad",
        description:
            "Photographer whose black-and-white studies of the body read like sculpture.",
        width: 104,
        height: 162,
    },
    {
        imageUrl: pic(177),
        title: "Ada Lindqvist",
        description:
            "Choreographer translating movement into still images and short films.",
        width: 98,
        height: 86,
    },
]

const LOWER: Entry[] = [
    {
        imageUrl: pic(1074),
        title: "Theo Marlow",
        description:
            "Director and cinematographer drawn to long takes, natural light and stories told in silence.",
        width: 108,
        height: 72,
    },
    {
        imageUrl: pic(453),
        title: "Kai Andersen",
        description:
            "Photographer making bold, graphic portraits with a single hard light.",
        width: 104,
        height: 142,
    },
    {
        imageUrl: pic(433),
        title: "Juno Reyes",
        description:
            "Choreographer and movement director for stage, screen and print.",
        width: 106,
        height: 80,
    },
    {
        imageUrl: pic(447),
        title: "Dario Castell",
        description:
            "Director and photographer with a love for saturated colour and staged surprise.",
        width: 108,
        height: 160,
    },
    {
        imageUrl: pic(593),
        title: "Hugo Ferreira",
        description:
            "Director and photographer chasing motion, grain and the edges of the frame.",
        width: 104,
        height: 70,
    },
    {
        imageUrl: pic(823),
        title: "Mara Ellison",
        description: "Photographer documenting water, heat and summer rituals.",
        width: 104,
        height: 82,
    },
    {
        imageUrl: pic(1062),
        title: "Silas Brandt",
        description:
            "Stylist and set builder blending found objects with sharp tailoring.",
        width: 108,
        height: 118,
    },
    {
        imageUrl: pic(349),
        title: "Mira Solberg",
        description:
            "Art director building worlds for fashion and music releases.",
        width: 102,
        height: 172,
    },
]

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Transept(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <TranseptStill {...props} />
    return <TranseptLive {...props} />
}

/* ------------------------------------------------------------------ shared math */

const wrap = (v: number, span: number) =>
    span <= 0 ? 0 : ((v % span) + span) % span
const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v))
const srcOf = (e: Entry) => e?.image?.src || e?.imageUrl || ""
const spanOf = (list: Entry[], scale: number, gap: number) =>
    list.reduce((sum, e) => sum + (e.width ?? 104) * scale + gap, 0)
const firstWord = (list: string[] | undefined) =>
    list && list.length ? list[0] : ""

/* ------------------------------------------------------------------ static path */

function TranseptStill(p: Props) {
    const sz = p.sizing
    const lk = p.look
    const rows: [Entry[], boolean][] = [
        [p.upperRow || [], true],
        [p.lowerRow || [], false],
    ]
    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: lk.background,
            }}
        >
            {rows.map(([list, upper], r) => {
                const span = spanOf(list, sz.scale, sz.gap)
                const copies = span > 0 ? Math.ceil(1800 / span) + 2 : 0
                return (
                    <div
                        key={r}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            [upper ? "top" : "bottom"]: sz.edgeInset,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: upper ? "flex-start" : "flex-end",
                                gap: sz.gap,
                                width: "max-content",
                                transform: `translateX(${-span}px)`,
                            }}
                        >
                            {Array.from({ length: copies }).flatMap((_, c) =>
                                list.map((e, i) => {
                                    const w = (e.width ?? 104) * sz.scale
                                    const h = (e.height ?? 120) * sz.scale
                                    const src = srcOf(e)
                                    return (
                                        <div
                                            key={`${c}-${i}`}
                                            style={{
                                                width: w,
                                                height: h,
                                                flex: "0 0 auto",
                                                overflow: "hidden",
                                                borderRadius: sz.radius,
                                                background: lk.placeholder,
                                            }}
                                        >
                                            {src ? (
                                                <img
                                                    src={src}
                                                    alt={
                                                        e.image?.alt ||
                                                        e.title ||
                                                        ""
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            ) : null}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )
            })}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 28,
                    padding: "0 16px",
                }}
            >
                {p.showSideLinks && (
                    <span
                        style={{
                            ...p.sideFont,
                            color: lk.sideColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {p.leftLabel}
                    </span>
                )}
                <span style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <span style={{ ...p.headingFont, color: lk.headingColor }}>
                        {p.headingLead}
                    </span>
                    <span
                        style={{
                            ...p.accentFont,
                            color: lk.accentColor,
                            marginLeft: "0.35em",
                        }}
                    >
                        {firstWord(p.headingWords)}
                    </span>
                </span>
                {p.showSideLinks && (
                    <span
                        style={{
                            ...p.sideFont,
                            color: lk.sideColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {p.rightLabel}
                    </span>
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ live path */

type Lane = {
    pos: number
    eased: number
    vel: number
    over: boolean
    driftMix: number
    held: boolean
}

type Grab = {
    lane: number
    id: number
    lastX: number
    lastT: number
    flick: number
    travel: number
    tap: number
} | null
type Glyph = { y: number; r: number; s: number }
type Peek = { lane: number; index: number } | null

function TranseptLive(p: Props) {
    const rawId = React.useId()
    const k = "tx" + rawId.replace(/[^a-zA-Z0-9]/g, "")

    const shellRef = React.useRef<HTMLDivElement>(null)
    const leadRef = React.useRef<HTMLSpanElement>(null)
    const trackRefs = [
        React.useRef<HTMLDivElement>(null),
        React.useRef<HTMLDivElement>(null),
    ]
    const glyphEls = React.useRef<(HTMLSpanElement | null)[]>([])
    const glyphs = React.useRef<Glyph[]>([])

    const latest = React.useRef(p)
    latest.current = p

    const sz = p.sizing
    const upper = p.upperRow || []
    const lower = p.lowerRow || []
    const rows = [upper, lower]
    const spans = [
        spanOf(upper, sz.scale, sz.gap),
        spanOf(lower, sz.scale, sz.gap),
    ]
    const spanRef = React.useRef(spans)
    spanRef.current = spans

    const [frameW, setFrameW] = React.useState(1400)
    const [frameH, setFrameH] = React.useState(700)
    const [arrived, setArrived] = React.useState(false)
    const [wordAt, setWordAt] = React.useState(0)
    const [wordFrom, setWordFrom] = React.useState<number | null>(null)
    const wordRef = React.useRef(0)
    const [peek, setPeek] = React.useState<Peek>(null)
    const [peekOpen, setPeekOpen] = React.useState(false)
    const peekRef = React.useRef<Peek>(null)
    peekRef.current = peek

    const lanes = React.useRef<Lane[]>([
        { pos: 0, eased: 0, vel: 0, over: false, driftMix: 1, held: false },
        { pos: 0, eased: 0, vel: 0, over: false, driftMix: 1, held: false },
    ])
    const grab = React.useRef<Grab>(null)
    const pointer = React.useRef({ x: 0, y: 0, inside: false })

    const gate = React.useRef({ seen: false, tabOn: true, calm: false })
    const engine = React.useRef({ raf: 0, on: false, stamp: 0 })
    const cycle = React.useRef(0)
    const closeTimer = React.useRef(0)

    /* --- the frame ------------------------------------------------------- */
    const step = React.useCallback((now: number) => {
        const g = gate.current
        const eng = engine.current
        if (!g.seen || !g.tabOn) {
            eng.on = false
            eng.raf = 0
            grab.current = null
            for (const L of lanes.current) {
                L.vel = 0
                L.held = false
            }
            return
        }
        const cfg = latest.current
        const m = cfg.motion
        const dt = clamp((now - eng.stamp) / 1000, 0, 1 / 20)
        eng.stamp = now
        const f60 = dt * 60
        const frozen = !!peekRef.current

        const drift = g.calm ? 0 : Math.max(0, m.drift)
        const friction = Math.pow(clamp(m.glide, 0.8, 0.99), f60)
        const follow = 1 - Math.pow(1 - clamp(m.softness, 0.04, 1), f60)
        let busy = false

        lanes.current.forEach((L, i) => {
            const dir = i === 0 ? 1 : -1
            const wantDrift =
                frozen || L.held || (m.pauseOnHover && L.over) ? 0 : 1
            L.driftMix += (wantDrift - L.driftMix) * (1 - Math.pow(0.9, f60))
            if (Math.abs(wantDrift - L.driftMix) < 0.002) L.driftMix = wantDrift

            if (!L.held) {
                L.pos += (L.vel + drift * dir * L.driftMix) * dt
                L.vel *= friction
                if (Math.abs(L.vel) < 0.5) L.vel = 0
            }

            const k2 = L.held ? Math.max(follow, 0.55) : follow
            L.eased += (L.pos - L.eased) * k2
            if (Math.abs(L.pos - L.eased) < 0.02) L.eased = L.pos

            const span = spanRef.current[i]
            const node = trackRefs[i].current
            if (node && span > 0) {
                const x = -span - wrap(L.eased, span)
                node.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`
            }

            if (
                L.held ||
                L.vel !== 0 ||
                L.eased !== L.pos ||
                (drift > 0 && L.driftMix > 0) ||
                L.driftMix !== wantDrift
            )
                busy = true
        })

        /* heading magnet */
        const lift = g.calm ? 0 : Math.max(0, cfg.magnet)
        const els = glyphEls.current
        const pt = pointer.current
        const ease = 1 - Math.pow(0.82, f60)
        for (let n = 0; n < els.length; n++) {
            const el = els[n]
            if (!el) continue
            const st =
                glyphs.current[n] || (glyphs.current[n] = { y: 0, r: 0, s: 1 })
            let ty = 0
            let tr = 0
            let ts = 1
            if (pt.inside && lift > 0) {
                const cx = el.offsetLeft + el.offsetWidth / 2
                const cy = el.offsetTop + el.offsetHeight / 2
                const dx = cx - pt.x
                const dy = (cy - pt.y) * 0.6
                const reach = 90
                const pull = Math.exp(-(dx * dx + dy * dy) / (reach * reach))
                ty = -pull * lift
                tr = clamp(dx / reach, -1, 1) * pull * 14
                ts = 1 + pull * 0.18
            }
            st.y += (ty - st.y) * ease
            st.r += (tr - st.r) * ease
            st.s += (ts - st.s) * ease
            if (
                Math.abs(ty - st.y) < 0.01 &&
                Math.abs(tr - st.r) < 0.01 &&
                Math.abs(ts - st.s) < 0.0005
            ) {
                st.y = ty
                st.r = tr
                st.s = ts
            } else busy = true
            el.style.transform = `translate3d(0,${st.y.toFixed(2)}px,0) rotate(${st.r.toFixed(2)}deg) scale(${st.s.toFixed(3)})`
        }

        if (busy) eng.raf = requestAnimationFrame(step)
        else {
            eng.on = false
            eng.raf = 0
        }
    }, [])

    const rouse = React.useCallback(() => {
        const g = gate.current
        const eng = engine.current
        if (eng.on || !g.seen || !g.tabOn) return
        eng.on = true
        eng.stamp = performance.now()
        eng.raf = requestAnimationFrame(step)
    }, [step])

    /* --- heading word cycle (armed only while permitted) ----------------- */
    const disarmCycle = React.useCallback(() => {
        if (cycle.current) window.clearTimeout(cycle.current)
        cycle.current = 0
    }, [])

    const armCycle = React.useCallback(() => {
        const g = gate.current
        const words = latest.current.headingWords || []
        if (cycle.current || !g.seen || !g.tabOn || g.calm || words.length < 2)
            return
        const wait = Math.max(0.8, latest.current.wordInterval || 2.4) * 1000
        cycle.current = window.setTimeout(() => {
            cycle.current = 0
            const gg = gate.current
            if (!gg.seen || !gg.tabOn || gg.calm) return
            const total = (latest.current.headingWords || []).length
            if (total < 2) return
            const cur = wordRef.current % total
            const next = (cur + 1) % total
            wordRef.current = next
            setWordFrom(cur)
            setWordAt(next)
            armCycle()
        }, wait)
    }, [])

    /* --- visibility, tab, reduced motion, size --------------------------- */
    React.useEffect(() => {
        const shell = shellRef.current
        if (!shell) return
        const g = gate.current

        const mq = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        g.calm = !!mq?.matches
        const onMq = () => {
            g.calm = !!mq?.matches
            if (g.calm) disarmCycle()
            else armCycle()
            rouse()
        }
        mq?.addEventListener?.("change", onMq)

        g.tabOn = document.visibilityState !== "hidden"
        const onTab = () => {
            g.tabOn = document.visibilityState !== "hidden"
            if (g.tabOn) {
                rouse()
                armCycle()
            } else disarmCycle()
        }
        document.addEventListener("visibilitychange", onTab)

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            g.seen = true
            setArrived(true)
            rouse()
            armCycle()
        } else {
            io = new IntersectionObserver(
                (list) => {
                    const hit = list.some((e) => e.isIntersecting)
                    g.seen = hit
                    if (hit) {
                        setArrived(true)
                        rouse()
                        armCycle()
                    } else disarmCycle()
                },
                { threshold: 0.01 }
            )
            io.observe(shell)
        }

        const measure = () => {
            setFrameW(shell.clientWidth || 1400)
            setFrameH(shell.clientHeight || 700)
        }
        measure()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(shell)
        } else window.addEventListener("resize", measure)

        return () => {
            io?.disconnect()
            ro?.disconnect()
            window.removeEventListener("resize", measure)
            document.removeEventListener("visibilitychange", onTab)
            mq?.removeEventListener?.("change", onMq)
            cancelAnimationFrame(engine.current.raf)
            engine.current.on = false
            disarmCycle()
            window.clearTimeout(closeTimer.current)
        }
    }, [rouse, armCycle, disarmCycle])

    React.useEffect(() => {
        rouse()
    })

    /* --- wheel: only the row under the pointer moves ---------------------- */
    React.useEffect(() => {
        const shell = shellRef.current
        if (!shell) return
        const onWheel = (e: WheelEvent) => {
            if (peekRef.current) return
            const L = lanes.current
            const target = L[0].over ? 0 : L[1].over ? 1 : -1
            if (target < 0) return // not over a row: let the page scroll
            const m = latest.current.motion
            const ax = Math.abs(e.deltaX)
            const ay = Math.abs(e.deltaY)
            let d = 0
            if (ax > ay) d = e.deltaX
            else if (m.wheelRail) d = e.deltaY
            else return
            e.preventDefault()
            const unit = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? 400 : 1
            L[target].vel = clamp(
                L[target].vel + d * unit * m.wheelForce,
                -5200,
                5200
            )
            rouse()
        }
        shell.addEventListener("wheel", onWheel, { passive: false })
        return () => shell.removeEventListener("wheel", onWheel)
    }, [rouse])

    /* --- drag: only the grabbed row moves ---------------------------------- */
    const onDown =
        (lane: number) => (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            if (!gate.current.seen || peekRef.current) return
            const L = lanes.current[lane]
            L.held = true
            L.vel = 0
            const hit = (e.target as HTMLElement)?.closest?.(
                "[data-tap]"
            ) as HTMLElement | null
            const tap = hit ? Number(hit.getAttribute("data-tap")) : -1
            grab.current = {
                lane,
                id: e.pointerId,
                lastX: e.clientX,
                lastT: performance.now(),
                flick: 0,
                travel: 0,
                tap,
            }
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {}
            shellRef.current?.classList.add(`${k}-hold`)
            rouse()
        }

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const gr = grab.current
        if (!gr || gr.id !== e.pointerId) return
        const now = performance.now()
        const dx = e.clientX - gr.lastX
        const dt = Math.max(1, now - gr.lastT)
        gr.lastX = e.clientX
        gr.lastT = now
        gr.travel += Math.abs(dx)
        lanes.current[gr.lane].pos -= dx
        const inst = (-dx / dt) * 1000
        gr.flick = gr.flick * 0.65 + inst * 0.35
        rouse()
    }

    const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const gr = grab.current
        if (!gr || gr.id !== e.pointerId) return
        const idle = performance.now() - gr.lastT
        const L = lanes.current[gr.lane]
        L.held = false
        const isTap = gr.travel < 7 && gr.tap >= 0 && e.type === "pointerup"
        L.vel = isTap || idle > 90 ? 0 : clamp(gr.flick, -5200, 5200)
        grab.current = null
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        shellRef.current?.classList.remove(`${k}-hold`)
        if (isTap) openPeek(gr.lane, gr.tap)
        rouse()
    }

    const hoverLane =
        (lane: number, on: boolean) => (e: React.PointerEvent) => {
            if (e.pointerType !== "mouse") return
            lanes.current[lane].over = on
            rouse()
        }

    /* --- pointer for the heading magnet ---------------------------------- */
    const onShellMove = (e: React.PointerEvent) => {
        const lead = leadRef.current
        if (!lead || e.pointerType !== "mouse") return
        const r = lead.getBoundingClientRect()
        pointer.current.x = e.clientX - r.left
        pointer.current.y = e.clientY - r.top
        pointer.current.inside = true
        rouse()
    }
    const onShellLeave = () => {
        pointer.current.inside = false
        rouse()
    }

    /* --- popup ------------------------------------------------------------ */
    const openPeek = (lane: number, index: number) => {
        window.clearTimeout(closeTimer.current)
        setPeek({ lane, index })
        setPeekOpen(false)
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setPeekOpen(true))
        )
        rouse()
    }
    const closePeek = React.useCallback(() => {
        setPeekOpen(false)
        window.clearTimeout(closeTimer.current)
        closeTimer.current = window.setTimeout(
            () => {
                setPeek(null)
                rouse()
            },
            gate.current.calm ? 10 : 460
        )
    }, [rouse])

    React.useEffect(() => {
        if (!peek) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePeek()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [peek, closePeek])

    /* --- rotating word width easing -------------------------------------- */
    const words =
        p.headingWords && p.headingWords.length ? p.headingWords : [""]
    const safeAt = wordAt % words.length
    const sizerRef = React.useRef<HTMLSpanElement>(null)
    const [wordW, setWordW] = React.useState<number | null>(null)
    React.useLayoutEffect(() => {
        if (sizerRef.current) setWordW(sizerRef.current.offsetWidth)
    }, [safeAt, words.join("|"), JSON.stringify(p.accentFont), frameW])

    /* --- styles ---------------------------------------------------------- */
    const lk = p.look
    const mo = p.motion
    const css = `
.${k}-lane{touch-action:pan-y;cursor:grab;-webkit-user-select:none;user-select:none}
.${k}-hold .${k}-lane{cursor:grabbing}
.${k}-track{will-change:transform;transform-origin:50% 50%;backface-visibility:hidden}
.${k}-card{transition:opacity .45s cubic-bezier(.22,.8,.26,1);cursor:pointer;outline:none;-webkit-user-drag:none}
.${k}-card:focus-visible{box-shadow:0 0 0 2px ${lk.accentColor}}
.${k}-card img{transition:transform .9s cubic-bezier(.16,.84,.3,1),filter .6s ease;${lk.monoUntilHover ? "filter:grayscale(1);" : ""}pointer-events:none;-webkit-user-drag:none}
.${k}-card:hover img{transform:scale(${lk.hoverZoom});filter:none}
.${k}-track:hover .${k}-card{opacity:${lk.dimOthers}}
.${k}-track .${k}-card:hover,.${k}-hold .${k}-card{opacity:1}
.${k}-side{transition:opacity .3s ease;text-decoration:none;white-space:nowrap}
.${k}-side:hover{opacity:.5}
.${k}-glyph{display:inline-block;will-change:transform;transform-origin:50% 80%}
.${k}-word{position:relative;display:inline-block;vertical-align:bottom;overflow:hidden;transition:width .7s cubic-bezier(.65,0,.2,1);white-space:nowrap;padding:0.06em 0}
.${k}-word > span{display:inline-block;white-space:nowrap}
.${k}-wl{display:inline-block}
@keyframes ${k}-wIn{from{transform:translate3d(0,105%,0) rotate(8deg);opacity:0}to{transform:none;opacity:1}}
@keyframes ${k}-wOut{from{transform:none;opacity:1}to{transform:translate3d(0,-105%,0) rotate(-8deg);opacity:0}}
.${k}-in-word .${k}-wl{animation:${k}-wIn .75s cubic-bezier(.2,.9,.25,1) both}
.${k}-out-word{position:absolute;left:0;top:0.06em}
.${k}-out-word .${k}-wl{animation:${k}-wOut .55s cubic-bezier(.6,0,.4,1) both}
.${k}-veil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:60px 32px 32px;z-index:5;transition:opacity .45s ease;opacity:0}
.${k}-veil.${k}-open{opacity:1}
.${k}-sheet{transition:transform .6s cubic-bezier(.16,.9,.24,1),opacity .45s ease;transform:translate3d(0,26px,0) scale(.96);opacity:0}
.${k}-open .${k}-sheet{transform:none;opacity:1}
.${k}-pic{clip-path:inset(100% 0 0 0);transition:clip-path .8s cubic-bezier(.7,0,.2,1) .08s}
.${k}-open .${k}-pic{clip-path:inset(0 0 0 0)}
@keyframes ${k}-rise{from{transform:translate3d(0,14px,0);opacity:0}to{transform:none;opacity:1}}
@keyframes ${k}-zoom{from{transform:scale(1.14)}to{transform:scale(1)}}
.${k}-open .${k}-line{animation:${k}-rise .7s cubic-bezier(.2,.85,.25,1) both}
.${k}-open .${k}-pic img{animation:${k}-zoom 1.2s cubic-bezier(.2,.8,.2,1) both}
.${k}-close{position:absolute;top:16px;right:16px;z-index:2;width:32px;height:32px;border-radius:50%;border:none;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.14);transform:scale(.6);opacity:0;transition:transform .5s cubic-bezier(.2,1.4,.4,1) .35s,opacity .3s ease .35s}
.${k}-open .${k}-close{transform:scale(1);opacity:1}
.${k}-close:hover{transform:scale(1.08) rotate(90deg)!important;transition:transform .35s cubic-bezier(.2,.9,.3,1)}
@media (prefers-reduced-motion: reduce){
 .${k}-veil,.${k}-sheet,.${k}-pic,.${k}-word,.${k}-close{transition:none!important}
 .${k}-line,.${k}-pic img,.${k}-wl,.${k}-in{animation:none!important;opacity:1!important}
}
${
    mo.entrance
        ? `
@keyframes ${k}-fall{from{opacity:0;transform:translate3d(0,-40px,0)}to{opacity:1;transform:none}}
@keyframes ${k}-lift{from{opacity:0;transform:translate3d(0,40px,0)}to{opacity:1;transform:none}}
@keyframes ${k}-mid{from{opacity:0;transform:translate3d(0,0.6em,0);filter:blur(8px)}to{opacity:1;transform:none;filter:blur(0)}}
.${k}-wait .${k}-in{opacity:0}
.${k}-go .${k}-in-a{animation:${k}-fall 1.1s cubic-bezier(.16,.9,.24,1) both}
.${k}-go .${k}-in-b{animation:${k}-lift 1.1s cubic-bezier(.16,.9,.24,1) both}
.${k}-go .${k}-in-c{animation:${k}-mid 1s cubic-bezier(.2,.8,.2,1) both}
`
        : ""
}
`

    /* --- rows ------------------------------------------------------------- */
    const lane = (list: Entry[], idx: number) => {
        const isUpper = idx === 0
        const span = spans[idx]
        const copies = span > 0 ? Math.ceil(frameW / span) + 3 : 0
        const initialX = -span - wrap(lanes.current[idx].eased, span)
        return (
            <div
                className={`${k}-lane`}
                onPointerDown={onDown(idx)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onPointerEnter={hoverLane(idx, true)}
                onPointerLeave={hoverLane(idx, false)}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    [isUpper ? "top" : "bottom"]: sz.edgeInset,
                    zIndex: 2,
                }}
            >
                <div
                    ref={trackRefs[idx]}
                    className={`${k}-track`}
                    style={{
                        display: "flex",
                        alignItems: isUpper ? "flex-start" : "flex-end",
                        gap: sz.gap,
                        width: "max-content",
                        transform: `translate3d(${initialX}px,0,0)`,
                    }}
                >
                    {Array.from({ length: copies }).flatMap((_, c) =>
                        list.map((e, i) => {
                            const w = (e.width ?? 104) * sz.scale
                            const h = (e.height ?? 120) * sz.scale
                            const src = srcOf(e)
                            const order = i + c * list.length
                            const delay =
                                Math.min(order, 14) * 0.055 +
                                (isUpper ? 0 : 0.12)
                            const primary = c === 1
                            return (
                                <div
                                    key={`${c}-${i}`}
                                    className={`${k}-card`}
                                    role={primary ? "button" : undefined}
                                    aria-label={
                                        primary ? e.title || "Open" : undefined
                                    }
                                    aria-hidden={primary ? undefined : true}
                                    tabIndex={primary ? 0 : -1}
                                    data-tap={i}
                                    onKeyDown={(ev) => {
                                        if (
                                            ev.key === "Enter" ||
                                            ev.key === " "
                                        ) {
                                            ev.preventDefault()
                                            openPeek(idx, i)
                                        }
                                    }}
                                    style={{ width: w, flex: "0 0 auto" }}
                                >
                                    <div
                                        className={`${k}-in ${isUpper ? `${k}-in-a` : `${k}-in-b`}`}
                                        style={{
                                            width: w,
                                            height: h,
                                            overflow: "hidden",
                                            borderRadius: sz.radius,
                                            background: lk.placeholder,
                                            animationDelay: `${delay}s`,
                                        }}
                                    >
                                        {src ? (
                                            <img
                                                src={src}
                                                srcSet={e.image?.srcSet}
                                                alt={
                                                    e.image?.alt ||
                                                    e.title ||
                                                    ""
                                                }
                                                draggable={false}
                                                decoding="async"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    /* --- heading ----------------------------------------------------------- */
    const leadChars = Array.from(p.headingLead || "")
    glyphEls.current.length = leadChars.length
    const renderWord = (text: string) =>
        Array.from(text).map((ch, n) => (
            <span
                key={n}
                className={`${k}-wl`}
                style={{ animationDelay: `${n * 0.035}s` }}
            >
                {ch === " " ? " " : ch}
            </span>
        ))

    const heading = (
        <span
            className={`${k}-in ${k}-in-c`}
            style={{
                textAlign: "center",
                whiteSpace: "nowrap",
                animationDelay: ".35s",
                display: "inline-flex",
                alignItems: "baseline",
            }}
        >
            <span
                ref={leadRef}
                style={{
                    ...p.headingFont,
                    color: lk.headingColor,
                    position: "relative",
                    display: "inline-block",
                }}
            >
                {leadChars.map((ch, n) => (
                    <span
                        key={n}
                        ref={(el) => (glyphEls.current[n] = el)}
                        className={`${k}-glyph`}
                    >
                        {ch === " " ? " " : ch}
                    </span>
                ))}
            </span>
            {words[0] !== "" && (
                <span
                    className={`${k}-word`}
                    style={{
                        ...p.accentFont,
                        color: lk.accentColor,
                        marginLeft: "0.35em",
                        width: wordW ?? "auto",
                    }}
                >
                    <span
                        ref={sizerRef}
                        key={`in-${safeAt}`}
                        className={wordFrom === null ? "" : `${k}-in-word`}
                    >
                        {renderWord(words[safeAt])}
                    </span>
                    {wordFrom !== null && wordFrom !== safeAt && (
                        <span
                            key={`out-${wordFrom}-${safeAt}`}
                            className={`${k}-out-word`}
                            aria-hidden
                        >
                            {renderWord(words[wordFrom % words.length] || "")}
                        </span>
                    )}
                </span>
            )}
        </span>
    )

    /* --- popup content ---------------------------------------------------- */
    const peekEntry = peek ? rows[peek.lane][peek.index] : null

    const stage = mo.entrance ? (arrived ? `${k}-go` : `${k}-wait`) : ""

    return (
        <div
            ref={shellRef}
            className={stage}
            onPointerMove={onShellMove}
            onPointerLeave={onShellLeave}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: lk.background,
            }}
        >
            <style>{css}</style>
            {lane(upper, 0)}
            {lane(lower, 1)}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 28,
                    padding: "0 16px",
                    zIndex: 1,
                }}
            >
                {p.showSideLinks && (
                    <a
                        className={`${k}-side ${k}-in ${k}-in-c`}
                        href={p.leftLink || undefined}
                        style={{
                            ...p.sideFont,
                            color: lk.sideColor,
                            animationDelay: ".55s",
                        }}
                    >
                        {p.leftLabel}
                    </a>
                )}
                {heading}
                {p.showSideLinks && (
                    <a
                        className={`${k}-side ${k}-in ${k}-in-c`}
                        href={p.rightLink || undefined}
                        style={{
                            ...p.sideFont,
                            color: lk.sideColor,
                            animationDelay: ".55s",
                        }}
                    >
                        {p.rightLabel}
                    </a>
                )}
            </div>

            {peek && peekEntry && (
                <div
                    className={`${k}-veil ${peekOpen ? `${k}-open` : ""}`}
                    style={{ background: lk.overlay }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closePeek()
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={peekEntry.title || "Details"}
                >
                    <div
                        className={`${k}-sheet`}
                        style={{
                            position: "relative",
                            maxWidth: "100%",
                            maxHeight: "100%",
                            display: "inline-flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                        }}
                    >
                        <div
                            className={`${k}-pic`}
                            style={{
                                position: "relative",
                                display: "block",
                                lineHeight: 0,
                                flex: "0 0 auto",
                                overflow: "hidden",
                                borderRadius: lk.panelRadius,
                                boxShadow: "0 30px 70px rgba(0,0,0,0.18)",
                            }}
                        >
                            {srcOf(peekEntry) ? (
                                <img
                                    src={srcOf(peekEntry)}
                                    srcSet={peekEntry.image?.srcSet}
                                    alt={
                                        peekEntry.image?.alt ||
                                        peekEntry.title ||
                                        ""
                                    }
                                    style={{
                                        display: "block",
                                        width: "auto",
                                        height: "auto",
                                        maxWidth: Math.max(160, frameW - 64),
                                        maxHeight: Math.max(
                                            160,
                                            frameH -
                                                92 -
                                                (peekEntry.title ||
                                                peekEntry.description
                                                    ? 120
                                                    : 0)
                                        ),
                                        objectFit: "contain",
                                    }}
                                />
                            ) : null}
                        </div>
                        {(peekEntry.title || peekEntry.description) && (
                            <div
                                style={{
                                    padding: "16px 2px 0",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    flex: "0 0 auto",
                                    width: 0,
                                    minWidth: "100%",
                                }}
                            >
                                {peekEntry.title ? (
                                    <div
                                        className={`${k}-line`}
                                        style={{
                                            ...p.popupTitleFont,
                                            color: lk.panelTitle,
                                            animationDelay: ".3s",
                                        }}
                                    >
                                        {peekEntry.link ? (
                                            <a
                                                href={peekEntry.link}
                                                style={{
                                                    color: "inherit",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {peekEntry.title}
                                            </a>
                                        ) : (
                                            peekEntry.title
                                        )}
                                    </div>
                                ) : null}
                                {peekEntry.description ? (
                                    <div
                                        className={`${k}-line`}
                                        style={{
                                            ...p.popupTextFont,
                                            color: lk.panelText,
                                            animationDelay: ".38s",
                                        }}
                                    >
                                        {peekEntry.description}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <button
                        className={`${k}-close`}
                        aria-label="Close"
                        onClick={closePeek}
                        style={{
                            background: lk.closeFill,
                            color: lk.closeIcon,
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                        >
                            <path
                                d="M3 3l8 8M11 3l-8 8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ controls */

const entryControls = {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        placeholder: "https://…",
    },
    title: { type: ControlType.String, title: "Title" },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    link: { type: ControlType.Link, title: "Link" },
    width: {
        type: ControlType.Number,
        title: "Width",
        min: 30,
        max: 600,
        step: 1,
        unit: "px",
        defaultValue: 104,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        min: 30,
        max: 600,
        step: 1,
        unit: "px",
        defaultValue: 120,
    },
} as const

const WORDS = ["FRAME", "LIGHT", "STORY", "LENS"]

Transept.defaultProps = {
    headingLead: "FACES BEHIND THE",
    headingWords: WORDS,
    wordInterval: 2.4,
    magnet: 12,
    leftLabel: "Artists",
    leftLink: "",
    rightLabel: "About",
    rightLink: "",
    showSideLinks: true,
    upperRow: UPPER,
    lowerRow: LOWER,
    sizing: { scale: 1, gap: 0, radius: 0, edgeInset: 0 },
    motion: {
        drift: 26,
        pauseOnHover: true,
        wheelRail: true,
        wheelForce: 9,
        glide: 0.95,
        softness: 0.14,
        entrance: true,
    },
    look: {
        background: "#FFFFFF",
        headingColor: "#9A9A9A",
        accentColor: "#1A1A1A",
        sideColor: "#A6A6A6",
        placeholder: "#EDEDED",
        dimOthers: 0.5,
        hoverZoom: 1.06,
        monoUntilHover: false,
        overlay: "rgba(10,10,10,0.78)",
        panelTitle: "#FFFFFF",
        panelText: "rgba(255,255,255,0.7)",
        panelRadius: 0,
        closeFill: "#FFFFFF",
        closeIcon: "#141414",
    },
    headingFont: {
        fontSize: 20,
        letterSpacing: "0.2em",
        lineHeight: "1.2em",
        fontWeight: 400,
    },
    accentFont: {
        fontSize: 26,
        letterSpacing: "0.02em",
        lineHeight: "1.2em",
        fontStyle: "italic",
    },
    sideFont: { fontSize: 10, letterSpacing: "0.02em", lineHeight: "1.2em" },
    popupTitleFont: {
        fontSize: 28,
        letterSpacing: "-0.02em",
        lineHeight: "1.1em",
        fontWeight: 500,
    },
    popupTextFont: { fontSize: 12, letterSpacing: "0em", lineHeight: "1.55em" },
}

addPropertyControls(Transept, {
    headingLead: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "FACES BEHIND THE",
    },
    headingWords: {
        type: ControlType.Array,
        title: "Words",
        control: { type: ControlType.String },
        defaultValue: WORDS,
        maxCount: 12,
    },
    wordInterval: {
        type: ControlType.Number,
        title: "Word Delay",
        min: 0.8,
        max: 8,
        step: 0.1,
        unit: "s",
        defaultValue: 2.4,
    },
    magnet: {
        type: ControlType.Number,
        title: "Letter Lift",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 12,
    },
    showSideLinks: {
        type: ControlType.Boolean,
        title: "Side Links",
        defaultValue: true,
    },
    leftLabel: {
        type: ControlType.String,
        title: "Left Label",
        defaultValue: "Artists",
        hidden: (p: Props) => !p.showSideLinks,
    },
    leftLink: {
        type: ControlType.Link,
        title: "Left Link",
        hidden: (p: Props) => !p.showSideLinks,
    },
    rightLabel: {
        type: ControlType.String,
        title: "Right Label",
        defaultValue: "About",
        hidden: (p: Props) => !p.showSideLinks,
    },
    rightLink: {
        type: ControlType.Link,
        title: "Right Link",
        hidden: (p: Props) => !p.showSideLinks,
    },
    upperRow: {
        type: ControlType.Array,
        title: "Top Row",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            title: "Card",
            controls: entryControls,
        },
        defaultValue: UPPER,
    },
    lowerRow: {
        type: ControlType.Array,
        title: "Bottom Row",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            title: "Card",
            controls: entryControls,
        },
        defaultValue: LOWER,
    },
    sizing: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            scale: {
                type: ControlType.Number,
                title: "Card Scale",
                min: 0.4,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            edgeInset: {
                type: ControlType.Number,
                title: "Edge Inset",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            drift: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: 0,
                max: 200,
                step: 1,
                unit: "px/s",
                defaultValue: 26,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
            },
            wheelRail: {
                type: ControlType.Boolean,
                title: "Vertical Wheel",
                defaultValue: true,
                enabledTitle: "Row",
                disabledTitle: "Page",
            },
            wheelForce: {
                type: ControlType.Number,
                title: "Wheel Force",
                min: 1,
                max: 30,
                step: 0.5,
                defaultValue: 9,
            },
            glide: {
                type: ControlType.Number,
                title: "Glide",
                min: 0.8,
                max: 0.99,
                step: 0.005,
                defaultValue: 0.95,
            },
            softness: {
                type: ControlType.Number,
                title: "Smoothing",
                min: 0.04,
                max: 1,
                step: 0.01,
                defaultValue: 0.14,
            },
            entrance: {
                type: ControlType.Boolean,
                title: "Entrance",
                defaultValue: true,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            headingColor: {
                type: ControlType.Color,
                title: "Heading",
                defaultValue: "#9A9A9A",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Word",
                defaultValue: "#1A1A1A",
            },
            sideColor: {
                type: ControlType.Color,
                title: "Side Links",
                defaultValue: "#A6A6A6",
            },
            placeholder: {
                type: ControlType.Color,
                title: "Placeholder",
                defaultValue: "#EDEDED",
            },
            dimOthers: {
                type: ControlType.Number,
                title: "Dim Others",
                min: 0.1,
                max: 1,
                step: 0.05,
                defaultValue: 0.5,
            },
            hoverZoom: {
                type: ControlType.Number,
                title: "Hover Zoom",
                min: 1,
                max: 1.3,
                step: 0.01,
                defaultValue: 1.06,
            },
            monoUntilHover: {
                type: ControlType.Boolean,
                title: "Mono Idle",
                defaultValue: false,
            },
            overlay: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "rgba(10,10,10,0.78)",
            },
            panelTitle: {
                type: ControlType.Color,
                title: "Popup Title",
                defaultValue: "#FFFFFF",
            },
            panelText: {
                type: ControlType.Color,
                title: "Popup Text",
                defaultValue: "rgba(255,255,255,0.7)",
            },
            panelRadius: {
                type: ControlType.Number,
                title: "Image Radius",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            closeFill: {
                type: ControlType.Color,
                title: "Close Fill",
                defaultValue: "#FFFFFF",
            },
            closeIcon: {
                type: ControlType.Color,
                title: "Close Icon",
                defaultValue: "#141414",
            },
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            letterSpacing: "0.2em",
            lineHeight: "1.2em",
            fontWeight: 400,
        },
    },
    accentFont: {
        type: ControlType.Font,
        title: "Word Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 26,
            letterSpacing: "0.02em",
            lineHeight: "1.2em",
        },
    },
    sideFont: {
        type: ControlType.Font,
        title: "Side Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 10,
            letterSpacing: "0.02em",
            lineHeight: "1.2em",
        },
    },
    popupTitleFont: {
        type: ControlType.Font,
        title: "Popup Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
            fontWeight: 500,
        },
    },
    popupTextFont: {
        type: ControlType.Font,
        title: "Popup Text",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            letterSpacing: "0em",
            lineHeight: "1.55em",
        },
    },
} as any)
