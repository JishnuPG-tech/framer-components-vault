import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
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
    image?: any
    imageUrl?: string
    video?: string
    videoUrl?: string
    title?: string
    link?: string
}

const SAMPLE: Entry[] = [
    {
        imageUrl:
            "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&q=80&fit=crop",
        title: "Ivory Hour",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&fit=crop",
        title: "The Quiet Lapel",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80&fit=crop",
        title: "Gilded Gaze",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&q=80&fit=crop",
        title: "Salt & Stubble",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80&fit=crop",
        title: "Velvet Undertone",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&q=80&fit=crop",
        title: "North Light Study",
        link: "",
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80&fit=crop",
        title: "Sunlit Candour",
        link: "",
    },
]

const FORM = {
    taper: 0.74,
    spread: 0.76,
    lift: 0.34,
    depth: 3,
    outerFade: 0.55,
    ratio: 1.33,
    radius: 14,
    shadow: true,
}
const MOTION = {
    loop: true,
    drag: true,
    dragPower: 1,
    wheel: "both",
    snap: 5,
    autoplay: false,
    interval: 4,
    morph: true,
    morphAmount: 1,
}
const NAV = {
    place: "flank",
    size: 42,
    gap: 28,
    fill: "#FFFFFF",
    hover: "#F1F0EC",
    stroke: "rgba(0,0,0,0.12)",
    icon: "#111111",
}

const PATH_BACK = "M19 12H5M11 18l-6-6 6-6"
const PATH_AHEAD = "M5 12h14M13 6l6 6-6 6"
const DROP = "0 22px 46px -24px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.05)"
const BLANK = "#ECEAE6"

const VERT = `attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}`
const FRAG = `precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uScale;
uniform vec2 uShift;
uniform float uFlow;
uniform float uTime;
uniform float uSeed;
void main(){
  vec2 uv=vUv;
  float f=uFlow;
  float a=abs(f);
  float wave=sin(uv.y*7.2+uTime*4.0+uSeed)*0.6+sin(uv.y*14.5-uTime*2.6+uSeed*1.7)*0.4;
  uv.x+=wave*0.05*f;
  uv.y+=sin(uv.x*6.3+uTime*3.0+uSeed)*0.014*a;
  vec2 c=uv-0.5;
  uv=0.5+c*(1.0-a*0.22*(0.6-dot(c,c)*1.6));
  vec2 t=uv*uScale+uShift;
  float s=0.016*f;
  float r=texture2D(uTex,t+vec2(s,0.0)).r;
  vec4 g=texture2D(uTex,t);
  float b=texture2D(uTex,t-vec2(s,0.0)).b;
  gl_FragColor=vec4(r,g.g,b,1.0);
}`

function compile(ctx: WebGLRenderingContext) {
    const make = (kind: number, code: string) => {
        const sh = ctx.createShader(kind)
        if (!sh) return null
        ctx.shaderSource(sh, code)
        ctx.compileShader(sh)
        return ctx.getShaderParameter(sh, ctx.COMPILE_STATUS) ? sh : null
    }
    const v = make(ctx.VERTEX_SHADER, VERT)
    const f = make(ctx.FRAGMENT_SHADER, FRAG)
    if (!v || !f) return null
    const prog = ctx.createProgram()
    if (!prog) return null
    ctx.attachShader(prog, v)
    ctx.attachShader(prog, f)
    ctx.linkProgram(prog)
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) return null
    ctx.useProgram(prog)
    const buf = ctx.createBuffer()
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
    ctx.bufferData(
        ctx.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        ctx.STATIC_DRAW
    )
    const aPos = ctx.getAttribLocation(prog, "aPos")
    ctx.enableVertexAttribArray(aPos)
    ctx.vertexAttribPointer(aPos, 2, ctx.FLOAT, false, 0, 0)
    const u = (n: string) => ctx.getUniformLocation(prog, n)
    return {
        prog,
        loc: {
            scale: u("uScale"),
            shift: u("uShift"),
            flow: u("uFlow"),
            time: u("uTime"),
            seed: u("uSeed"),
            tex: u("uTex"),
        },
    }
}

/* ---------- pure helpers (data only, no markup) ---------- */

function px(v: any, fallback: number) {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : fallback
}

function sourceOf(it: Entry | undefined) {
    const up = it?.image
    const fromUpload = typeof up === "string" ? up : up?.src
    return fromUpload || it?.imageUrl || ""
}

function clipOf(it: Entry | undefined) {
    const up: any = it?.video
    const fromUpload = typeof up === "string" ? up : up?.src
    return fromUpload || it?.videoUrl || ""
}

function resolve(p: any) {
    const raw: Entry[] =
        Array.isArray(p.items) && p.items.length ? p.items : SAMPLE
    const items = raw.map((it) => ({
        src: sourceOf(it),
        clip: clipOf(it),
        title: it?.title ?? "",
        link: it?.link ?? "",
    }))
    const n = items.length
    const form = { ...FORM, ...(p.formation || {}) }
    const motion = { ...MOTION, ...(p.motion || {}) }
    const nav = { ...NAV, ...(p.nav || {}) }
    if (nav.place === "valley" && Math.round(form.depth) < 2)
        nav.place = "below"
    const start = Math.max(0, Math.min(n - 1, Math.round((p.startAt ?? 1) - 1)))
    return {
        items,
        n,
        form,
        motion,
        nav,
        start,
        titleFont: p.titleFont || {},
        titleColor: p.titleColor ?? "#111111",
        textGap: p.textGap ?? 40,
        newTab: !!p.newTab,
        bg: p.background ?? "#FFFFFF",
        pad: 16,
    }
}

function reach(t: number, taper: number) {
    return taper >= 0.999 ? t : (1 - Math.pow(taper, t)) / (1 - taper)
}

function frameOf(form: typeof FORM) {
    const D = Math.max(1, Math.round(form.depth))
    const run = reach(D, form.taper)
    const peak = form.lift * run
    const span = 2 * (form.spread * run + Math.pow(form.taper, D) / 2)
    const tall = peak + form.ratio
    const valley = Math.max(0, (peak - form.lift) / 2)
    return { D, peak, span, tall, valley }
}

function pose(d: number, form: typeof FORM, fr: ReturnType<typeof frameOf>) {
    const t = Math.abs(d)
    const run = reach(t, form.taper)
    let o = 1
    if (t > fr.D - 1) o = 1 - (1 - form.outerFade) * Math.min(1, t - (fr.D - 1))
    if (t > fr.D) o = form.outerFade * Math.max(0, 1 - (t - fr.D) / 0.5)
    return {
        x: Math.sign(d) * form.spread * run,
        y: fr.peak - form.lift * run,
        k: Math.pow(form.taper, t),
        o,
        z: 1000 - Math.round(t * 100),
    }
}

function offset(i: number, pos: number, n: number, loop: boolean) {
    if (!loop) return i - pos
    const h = n / 2
    return ((((i - pos + h) % n) + n) % n) - h
}

function nearest(pos: number, n: number, loop: boolean) {
    const r = Math.round(pos)
    return loop ? ((r % n) + n) % n : Math.max(0, Math.min(n - 1, r))
}

function reserveOf(s: ReturnType<typeof resolve>) {
    const t = px(s.titleFont.fontSize, 28)
    let r = s.pad * 2 + s.textGap + t * 1.2
    if (s.nav.place === "below") r += s.nav.gap + s.nav.size
    if (s.nav.place === "flank") r += Math.max(0, s.nav.size - t * 1.2)
    return Math.round(r)
}

function unitExpr(s: ReturnType<typeof resolve>) {
    const fr = frameOf(s.form)
    return `min(calc(94cqw / ${fr.span.toFixed(4)}), calc((100cqh - ${reserveOf(s)}px) / ${fr.tall.toFixed(4)}))`
}

/* ---------- static (canvas / export) view: plain divs only ---------- */

function ThalwegStill(p: any) {
    const s = resolve(p)
    const fr = frameOf(s.form)
    const cur = s.items[s.start]
    const nav = s.nav

    const still = (dir: "back" | "ahead") => (
        <div
            style={{
                width: nav.size,
                height: nav.size,
                borderRadius: "50%",
                background: nav.fill,
                border: `1px solid ${nav.stroke}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                flexShrink: 0,
            }}
        >
            <svg
                width={nav.size * 0.45}
                height={nav.size * 0.45}
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d={dir === "back" ? PATH_BACK : PATH_AHEAD}
                    stroke={nav.icon}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )

    const cluster = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: Math.round(nav.size * 0.3),
            }}
        >
            {still("back")}
            {still("ahead")}
        </div>
    )

    const words = (
        <div style={{ textAlign: "center", minWidth: 0 }}>
            <div
                style={{
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    ...s.titleFont,
                    color: s.titleColor,
                    margin: 0,
                }}
            >
                {cur?.title}
            </div>
        </div>
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: s.bg,
                containerType: "size",
                ["--u" as any]: unitExpr(s),
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    padding: s.pad,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: `calc(var(--u) * ${fr.tall.toFixed(4)})`,
                        flexShrink: 0,
                    }}
                >
                    {s.items.map((it, i) => {
                        const q = pose(
                            offset(i, s.start, s.n, s.motion.loop),
                            s.form,
                            fr
                        )
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 0,
                                    width: "var(--u)",
                                    height: `calc(var(--u) * ${s.form.ratio})`,
                                    marginLeft: "calc(var(--u) * -0.5)",
                                    transformOrigin: "50% 0",
                                    transform: `translate(calc(${q.x.toFixed(4)} * var(--u)), calc(${q.y.toFixed(4)} * var(--u))) scale(${q.k.toFixed(4)})`,
                                    opacity: q.o,
                                    visibility:
                                        q.o < 0.01 ? "hidden" : "visible",
                                    zIndex: q.z,
                                    borderRadius: s.form.radius,
                                    overflow: "hidden",
                                    background: BLANK,
                                    boxShadow: s.form.shadow ? DROP : "none",
                                }}
                            >
                                {it.src ? (
                                    <img
                                        src={it.src}
                                        alt={it.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : it.clip ? (
                                    <video
                                        src={it.clip + "#t=0.1"}
                                        muted
                                        playsInline
                                        autoPlay={false}
                                        preload="metadata"
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
                    })}
                    {nav.place === "valley" ? (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: `calc(var(--u) * ${fr.valley.toFixed(4)})`,
                                transform: "translate(-50%, -50%)",
                                zIndex: 2000,
                            }}
                        >
                            {cluster}
                        </div>
                    ) : null}
                </div>
                <div style={{ height: s.textGap, flexShrink: 0 }} />
                {nav.place === "flank" ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: nav.gap,
                            maxWidth: "100%",
                        }}
                    >
                        {still("back")}
                        {words}
                        {still("ahead")}
                    </div>
                ) : (
                    words
                )}
                {nav.place === "below" ? (
                    <div style={{ marginTop: nav.gap }}>{cluster}</div>
                ) : null}
            </div>
        </div>
    )
}

/* ---------- live (published / preview) view ---------- */

function ThalwegLive(p: any) {
    const s = resolve(p)
    const fr = frameOf(s.form)
    const nav = s.nav
    const uid = "tw" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const slots = useRef<(HTMLDivElement | null)[]>([])
    const clips = useRef<(HTMLVideoElement | null)[]>([])
    const sheets = useRef<(HTMLCanvasElement | null)[]>([])
    const gl = useRef<any>(null)
    const flow = useRef(0)
    const cfg = useRef(s)
    cfg.current = s

    const sim = useRef({
        pos: s.start,
        goal: s.start,
        vel: 0,
        frame: 0,
        last: 0,
        held: false,
    })
    const grab = useRef({ id: -1, x0: 0, p0: 0, lx: 0, lt: 0, v: 0, travel: 0 })
    const permit = useRef(false)
    const calm = useRef(false)
    const hovering = useRef(false)
    const wheelTimer = useRef<any>(0)
    const wheelDir = useRef(0)
    const shownRef = useRef(s.start)
    const [shown, setShown] = useState(s.start)
    const [onScreen, setOnScreen] = useState(false)

    const drawGL = useCallback(() => {
        const G = gl.current
        if (!G || G.dead || typeof window === "undefined") return
        const probe = slots.current[0]
        if (!probe) return
        const bw = probe.offsetWidth
        const bh = probe.offsetHeight
        if (!bw || !bh) return
        const c = cfg.current
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        let W = Math.round(bw * dpr)
        let H = Math.round(bh * dpr)
        const cap = 1100 / Math.max(W, H)
        if (cap < 1) {
            W = Math.round(W * cap)
            H = Math.round(H * cap)
        }
        if (W !== G.w || H !== G.h) {
            G.w = W
            G.h = H
            G.canvas.width = W
            G.canvas.height = H
            G.clean = []
        }
        const live = c.motion.morph && !calm.current
        const f = live
            ? Math.max(-1, Math.min(1, flow.current / 7)) * c.motion.morphAmount
            : 0
        const still = Math.abs(f) < 0.001
        const ctx: WebGLRenderingContext = G.ctx
        const t = performance.now() / 1000
        const ba = W / H
        let used = false
        for (let i = 0; i < c.n; i++) {
            const cv = sheets.current[i]
            const el = slots.current[i]
            if (!cv || !G.ready[i] || !el || el.style.visibility === "hidden")
                continue
            if (still && G.clean[i]) continue
            if (!used) {
                ctx.viewport(0, 0, W, H)
                ctx.useProgram(G.prog)
                ctx.uniform1f(G.loc.time, t)
                ctx.uniform1i(G.loc.tex, 0)
                used = true
            }
            const ia = G.aspect[i] || 1
            if (ia > ba) {
                ctx.uniform2f(G.loc.scale, ba / ia, 1)
                ctx.uniform2f(G.loc.shift, (1 - ba / ia) / 2, 0)
            } else {
                ctx.uniform2f(G.loc.scale, 1, ia / ba)
                ctx.uniform2f(G.loc.shift, 0, (1 - ia / ba) / 2)
            }
            const d = offset(i, sim.current.pos, c.n, c.motion.loop)
            ctx.uniform1f(G.loc.flow, f * (1 + 0.3 * Math.min(2, Math.abs(d))))
            ctx.uniform1f(G.loc.seed, i * 1.37)
            ctx.activeTexture(ctx.TEXTURE0)
            ctx.bindTexture(ctx.TEXTURE_2D, G.tex[i])
            ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)
            if (cv.width !== W || cv.height !== H) {
                cv.width = W
                cv.height = H
            }
            const k = G.c2d[i] || (G.c2d[i] = cv.getContext("2d"))
            if (!k) continue
            k.clearRect(0, 0, W, H)
            k.drawImage(G.canvas, 0, 0)
            G.clean[i] = still
            if (cv.style.opacity !== "1") cv.style.opacity = "1"
        }
    }, [])

    const paint = useCallback(() => {
        const c = cfg.current
        const m = sim.current
        const f = frameOf(c.form)
        for (let i = 0; i < c.n; i++) {
            const el = slots.current[i]
            if (!el) continue
            const q = pose(offset(i, m.pos, c.n, c.motion.loop), c.form, f)
            const st = el.style
            st.setProperty("--cx", q.x.toFixed(4))
            st.setProperty("--cy", q.y.toFixed(4))
            st.setProperty("--ck", q.k.toFixed(4))
            st.setProperty("--co", q.o.toFixed(3))
            st.zIndex = String(q.z)
            const gone = q.o < 0.01
            st.visibility = gone ? "hidden" : "visible"
            st.pointerEvents = gone ? "none" : "auto"
            const vid = clips.current[i]
            if (vid) {
                const want = permit.current && !calm.current && !gone
                if (want && vid.paused) vid.play?.().catch(() => {})
                else if (!want && !vid.paused) vid.pause()
            }
        }
        const idx = nearest(m.pos, c.n, c.motion.loop)
        if (idx !== shownRef.current) {
            shownRef.current = idx
            setShown(idx)
        }
        drawGL()
    }, [drawGL])

    const tick = useCallback(
        (now: number) => {
            const m = sim.current
            m.frame = 0
            if (!permit.current) return
            const dt = m.last ? Math.min(0.048, (now - m.last) / 1000) : 1 / 60
            m.last = now
            if (m.held) {
                const g = grab.current
                if (now - g.lt > 50) g.v *= 0.82
                flow.current += (g.v - flow.current) * 0.3
                paint()
                if (Math.abs(flow.current) < 0.01 && Math.abs(g.v) < 0.01) {
                    flow.current = 0
                    m.last = 0
                    paint()
                    return
                }
                m.frame = requestAnimationFrame(tick)
                return
            }
            const k = 60 + cfg.current.motion.snap * 25
            const c = 2 * Math.sqrt(k) * 0.9
            const acc = (m.goal - m.pos) * k - m.vel * c
            m.vel += acc * dt
            m.pos += m.vel * dt
            flow.current += (m.vel - flow.current) * 0.25
            if (
                Math.abs(m.goal - m.pos) < 0.0006 &&
                Math.abs(m.vel) < 0.003 &&
                Math.abs(flow.current) < 0.01
            ) {
                m.pos = m.goal
                m.vel = 0
                flow.current = 0
                m.last = 0
                paint()
                return
            }
            paint()
            m.frame = requestAnimationFrame(tick)
        },
        [paint]
    )

    const wake = useCallback(() => {
        const m = sim.current
        if (!permit.current) return
        if (calm.current) {
            if (!m.held) {
                m.pos = m.goal
                m.vel = 0
            }
            paint()
            return
        }
        if (!m.frame) {
            m.last = 0
            m.frame = requestAnimationFrame(tick)
        }
    }, [tick, paint])

    const clampGoal = (v: number) => {
        const c = cfg.current
        return c.motion.loop ? v : Math.max(0, Math.min(c.n - 1, v))
    }

    const step = useCallback(
        (dir: number) => {
            const m = sim.current
            clearTimeout(wheelTimer.current)
            m.goal = clampGoal(Math.round(m.goal) + dir)
            wake()
        },
        [wake]
    )

    const goTo = useCallback(
        (i: number) => {
            const c = cfg.current
            const m = sim.current
            if (c.motion.loop) {
                const base = Math.round(m.goal)
                const here = ((base % c.n) + c.n) % c.n
                let d = i - here
                if (d > c.n / 2) d -= c.n
                if (d < -c.n / 2) d += c.n
                m.goal = base + d
            } else m.goal = i
            wake()
        },
        [wake]
    )

    const unitPx = () =>
        (slots.current[0]?.offsetWidth || 160) *
        Math.max(0.1, cfg.current.form.spread)

    const follow = (url: string) => {
        if (!url || typeof window === "undefined") return
        if (cfg.current.newTab)
            window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
    }

    useLayoutEffect(() => {
        const m = sim.current
        const c = cfg.current
        if (!c.motion.loop) {
            m.goal = clampGoal(m.goal)
            if (!m.frame) m.pos = clampGoal(m.pos)
        }
        paint()
    })

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof window === "undefined") return
        const mq = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        calm.current = !!mq?.matches
        const onMq = () => {
            calm.current = !!mq?.matches
            wake()
        }
        mq?.addEventListener?.("change", onMq)

        let seen = typeof IntersectionObserver === "undefined"
        let tab = document.visibilityState !== "hidden"
        const sync = () => {
            const ok = seen && tab
            permit.current = ok
            setOnScreen(ok)
            const m = sim.current
            if (ok) wake()
            else {
                if (m.frame) cancelAnimationFrame(m.frame)
                m.frame = 0
                m.held = false
                m.vel = 0
                flow.current = 0
                m.goal = clampGoal(Math.round(m.goal))
                m.pos = m.goal
                grab.current.id = -1
                paint()
            }
        }
        let io: IntersectionObserver | null = null
        if (!seen) {
            io = new IntersectionObserver(
                (es) => {
                    seen = es[es.length - 1].isIntersecting
                    sync()
                },
                { threshold: 0 }
            )
            io.observe(el)
        }
        const onVis = () => {
            tab = document.visibilityState !== "hidden"
            sync()
        }
        document.addEventListener("visibilitychange", onVis)
        sync()
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            mq?.removeEventListener?.("change", onMq)
            const m = sim.current
            if (m.frame) cancelAnimationFrame(m.frame)
            m.frame = 0
            permit.current = false
            clearTimeout(wheelTimer.current)
        }
    }, [wake, paint])

    const sheetKey = s.items.map((it) => (it.clip ? "" : it.src)).join("|")
    useEffect(() => {
        if (typeof document === "undefined") return
        const canvas = document.createElement("canvas")
        let ctx: WebGLRenderingContext | null = null
        try {
            ctx = canvas.getContext("webgl", {
                alpha: false,
                antialias: false,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
            }) as WebGLRenderingContext | null
        } catch {
            ctx = null
        }
        if (!ctx) return
        const built = compile(ctx)
        if (!built) return
        const G: any = {
            canvas,
            ctx,
            prog: built.prog,
            loc: built.loc,
            tex: [],
            ready: [],
            clean: [],
            c2d: [],
            aspect: [],
            w: 0,
            h: 0,
            dead: false,
        }
        gl.current = G
        const pics: HTMLImageElement[] = []
        sheetKey.split("|").forEach((src, i) => {
            if (!src) return
            const im = new Image()
            im.crossOrigin = "anonymous"
            im.decoding = "async"
            im.onload = () => {
                if (G.dead) return
                try {
                    const tx = ctx!.createTexture()
                    ctx!.bindTexture(ctx!.TEXTURE_2D, tx)
                    ctx!.pixelStorei(ctx!.UNPACK_FLIP_Y_WEBGL, true)
                    ctx!.texImage2D(
                        ctx!.TEXTURE_2D,
                        0,
                        ctx!.RGB,
                        ctx!.RGB,
                        ctx!.UNSIGNED_BYTE,
                        im
                    )
                    ctx!.texParameteri(
                        ctx!.TEXTURE_2D,
                        ctx!.TEXTURE_WRAP_S,
                        ctx!.CLAMP_TO_EDGE
                    )
                    ctx!.texParameteri(
                        ctx!.TEXTURE_2D,
                        ctx!.TEXTURE_WRAP_T,
                        ctx!.CLAMP_TO_EDGE
                    )
                    ctx!.texParameteri(
                        ctx!.TEXTURE_2D,
                        ctx!.TEXTURE_MIN_FILTER,
                        ctx!.LINEAR
                    )
                    ctx!.texParameteri(
                        ctx!.TEXTURE_2D,
                        ctx!.TEXTURE_MAG_FILTER,
                        ctx!.LINEAR
                    )
                    G.tex[i] = tx
                    G.aspect[i] =
                        im.naturalWidth / Math.max(1, im.naturalHeight)
                    G.ready[i] = true
                    G.clean[i] = false
                    drawGL()
                } catch {
                    G.ready[i] = false
                }
            }
            im.src = src
            pics.push(im)
        })
        const lost = (e: Event) => {
            e.preventDefault()
            G.dead = true
            sheets.current.forEach((cv) => cv && (cv.style.opacity = "0"))
        }
        canvas.addEventListener("webglcontextlost", lost)
        return () => {
            G.dead = true
            pics.forEach((im) => (im.onload = null))
            canvas.removeEventListener("webglcontextlost", lost)
            G.tex.forEach((tx: WebGLTexture) => tx && ctx!.deleteTexture(tx))
            ctx!.getExtension("WEBGL_lose_context")?.loseContext()
            if (gl.current === G) gl.current = null
            sheets.current.forEach((cv) => cv && (cv.style.opacity = "0"))
        }
    }, [sheetKey, drawGL])

    useEffect(() => {
        const st = stageRef.current
        if (!st) return
        const onWheel = (e: WheelEvent) => {
            const c = cfg.current
            if (c.motion.wheel === "off" || c.n < 2 || !permit.current) return
            let dx = e.deltaX
            let dy = e.deltaY
            if (e.shiftKey && !dx) {
                dx = dy
                dy = 0
            }
            let delta = 0
            if (Math.abs(dx) > Math.abs(dy)) delta = dx
            else if (c.motion.wheel === "both") delta = dy
            else return
            if (!delta) return
            e.preventDefault()
            const mult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
            const m = sim.current
            m.goal = clampGoal(m.goal + (delta * mult) / unitPx())
            wheelDir.current = Math.sign(delta)
            clearTimeout(wheelTimer.current)
            wheelTimer.current = setTimeout(() => {
                const g = sim.current.goal
                const snapped =
                    wheelDir.current > 0
                        ? Math.ceil(g - 0.3)
                        : Math.floor(g + 0.3)
                sim.current.goal = clampGoal(snapped)
                wake()
            }, 120)
            wake()
        }
        st.addEventListener("wheel", onWheel, { passive: false })
        return () => st.removeEventListener("wheel", onWheel)
    }, [wake])

    useEffect(() => {
        if (!s.motion.autoplay || !onScreen || s.n < 2) return
        const id = setInterval(
            () => {
                const m = sim.current
                if (
                    !permit.current ||
                    hovering.current ||
                    m.held ||
                    calm.current
                )
                    return
                const c = cfg.current
                if (!c.motion.loop && Math.round(m.goal) >= c.n - 1) {
                    m.goal = 0
                    wake()
                } else step(1)
            },
            Math.max(1500, s.motion.interval * 1000)
        )
        return () => clearInterval(id)
    }, [s.motion.autoplay, s.motion.interval, onScreen, s.n, step, wake])

    const down = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        const g = grab.current
        const m = sim.current
        const c = cfg.current
        g.id = e.pointerId
        g.x0 = e.clientX
        g.lx = e.clientX
        g.lt = performance.now()
        g.v = 0
        g.travel = 0
        g.p0 = m.pos
        clearTimeout(wheelTimer.current)
        if (c.motion.drag && c.n > 1 && permit.current) {
            m.held = true
            m.vel = 0
            if (m.frame) {
                cancelAnimationFrame(m.frame)
                m.frame = 0
            }
            e.currentTarget.style.cursor = "grabbing"
        }
        e.currentTarget.setPointerCapture?.(e.pointerId)
    }

    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        const g = grab.current
        if (g.id !== e.pointerId) return
        const m = sim.current
        const c = cfg.current
        const dx = e.clientX - g.x0
        g.travel = Math.max(g.travel, Math.abs(dx))
        if (!m.held) return
        const u = unitPx() / Math.max(0.2, c.motion.dragPower)
        let next = g.p0 - dx / u
        if (!c.motion.loop) {
            if (next < 0) next *= 0.35
            else if (next > c.n - 1) next = c.n - 1 + (next - (c.n - 1)) * 0.35
        }
        const now = performance.now()
        const dt = (now - g.lt) / 1000
        if (dt > 0) g.v = g.v * 0.55 + (-(e.clientX - g.lx) / u / dt) * 0.45
        g.lx = e.clientX
        g.lt = now
        m.pos = next
        paint()
        wake()
    }

    const up = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
        const g = grab.current
        if (g.id !== e.pointerId) return
        g.id = -1
        e.currentTarget.releasePointerCapture?.(e.pointerId)
        e.currentTarget.style.cursor = cfg.current.motion.drag
            ? "grab"
            : "default"
        const m = sim.current
        const tapped = !cancelled && g.travel < 6
        if (m.held) {
            m.held = false
            if (performance.now() - g.lt > 90) g.v = 0
            if (tapped) m.goal = clampGoal(Math.round(m.pos))
            else {
                const v = Math.max(-14, Math.min(14, g.v))
                m.goal = clampGoal(Math.round(m.pos + v * 0.2))
                m.vel = v
            }
            wake()
        }
        if (tapped && typeof document !== "undefined") {
            const hit = document.elementFromPoint(
                e.clientX,
                e.clientY
            ) as HTMLElement | null
            const card = hit?.closest?.("[data-slot]") as HTMLElement | null
            if (!card || !rootRef.current?.contains(card)) return
            const i = Number(card.dataset.slot)
            const c = cfg.current
            if (i === nearest(m.goal, c.n, c.motion.loop))
                follow(c.items[i]?.link)
            else goTo(i)
        }
    }

    const keys = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            step(-1)
        } else if (e.key === "ArrowRight") {
            e.preventDefault()
            step(1)
        }
    }

    const cur = s.items[shown] || s.items[0]

    const button = (dir: "back" | "ahead") => (
        <button
            type="button"
            className={`${uid}-btn`}
            aria-label={dir === "back" ? "Previous card" : "Next card"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => step(dir === "back" ? -1 : 1)}
            style={{
                width: nav.size,
                height: nav.size,
                borderRadius: "50%",
                background: nav.fill,
                border: `1px solid ${nav.stroke}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
                boxSizing: "border-box",
                flexShrink: 0,
                ["--tw-hover" as any]: nav.hover,
            }}
        >
            <svg
                width={nav.size * 0.45}
                height={nav.size * 0.45}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d={dir === "back" ? PATH_BACK : PATH_AHEAD}
                    stroke={nav.icon}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )

    const cluster = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: Math.round(nav.size * 0.3),
            }}
        >
            {button("back")}
            {button("ahead")}
        </div>
    )

    const words = (
        <div
            key={shown}
            className={`${uid}-txt`}
            aria-live="polite"
            style={{ textAlign: "center", minWidth: 0 }}
        >
            <div
                style={{
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                    ...s.titleFont,
                    color: s.titleColor,
                    margin: 0,
                }}
            >
                {cur?.title}
            </div>
        </div>
    )

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Card carousel"
            tabIndex={0}
            onKeyDown={keys}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: s.bg,
                containerType: "size",
                outline: "none",
                ["--u" as any]: unitExpr(s),
            }}
        >
            <style>{`
.${uid}-btn{transition:background-color .22s ease,transform .22s cubic-bezier(.2,.8,.2,1),border-color .22s ease}
.${uid}-btn:hover{background:var(--tw-hover)!important}
.${uid}-btn:active{transform:scale(.92)}
.${uid}-btn:focus-visible{outline:2px solid currentColor;outline-offset:3px}
@keyframes ${uid}-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.${uid}-txt{animation:${uid}-in .5s cubic-bezier(.2,.75,.2,1) both}
@media (prefers-reduced-motion: reduce){.${uid}-txt{animation:none}.${uid}-btn{transition:none}}
`}</style>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    padding: s.pad,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    ref={stageRef}
                    onPointerDown={down}
                    onPointerMove={move}
                    onPointerUp={(e) => up(e, false)}
                    onPointerCancel={(e) => up(e, true)}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: `calc(var(--u) * ${fr.tall.toFixed(4)})`,
                        flexShrink: 0,
                        touchAction: "pan-y",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        cursor: s.motion.drag ? "grab" : "default",
                    }}
                >
                    {s.items.map((it, i) => {
                        const q = pose(
                            offset(i, s.start, s.n, s.motion.loop),
                            s.form,
                            fr
                        )
                        return (
                            <div
                                key={i}
                                data-slot={i}
                                ref={(el) => (slots.current[i] = el)}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: 0,
                                    width: "var(--u)",
                                    height: `calc(var(--u) * ${s.form.ratio})`,
                                    marginLeft: "calc(var(--u) * -0.5)",
                                    transformOrigin: "50% 0",
                                    transform:
                                        "translate3d(calc(var(--cx) * var(--u)), calc(var(--cy) * var(--u)), 0) scale(var(--ck))",
                                    opacity: "var(--co)" as any,
                                    ["--cx" as any]: q.x.toFixed(4),
                                    ["--cy" as any]: q.y.toFixed(4),
                                    ["--ck" as any]: q.k.toFixed(4),
                                    ["--co" as any]: q.o.toFixed(3),
                                    zIndex: q.z,
                                    borderRadius: s.form.radius,
                                    overflow: "hidden",
                                    background: BLANK,
                                    boxShadow: s.form.shadow ? DROP : "none",
                                    willChange: "transform, opacity",
                                    backfaceVisibility: "hidden",
                                }}
                            >
                                {it.clip ? (
                                    <video
                                        ref={(el) => (clips.current[i] = el)}
                                        src={it.clip}
                                        poster={it.src || undefined}
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : it.src ? (
                                    <img
                                        src={it.src}
                                        alt={it.title}
                                        draggable={false}
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : null}
                                {it.src && !it.clip ? (
                                    <canvas
                                        ref={(el) => (sheets.current[i] = el)}
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            opacity: 0,
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                    {nav.place === "valley" ? (
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: `calc(var(--u) * ${fr.valley.toFixed(4)})`,
                                transform: "translate(-50%, -50%)",
                                zIndex: 2000,
                            }}
                        >
                            {cluster}
                        </div>
                    ) : null}
                </div>
                <div style={{ height: s.textGap, flexShrink: 0 }} />
                {nav.place === "flank" ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: nav.gap,
                            maxWidth: "100%",
                        }}
                    >
                        {button("back")}
                        {words}
                        {button("ahead")}
                    </div>
                ) : (
                    words
                )}
                {nav.place === "below" ? (
                    <div style={{ marginTop: nav.gap }}>{cluster}</div>
                ) : null}
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Thalweg(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <ThalwegStill {...props} />
    return <ThalwegLive {...props} />
}

addPropertyControls(Thalweg, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                },
                title: { type: ControlType.String, title: "Title" },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: SAMPLE,
    },
    startAt: {
        type: ControlType.Number,
        title: "Start Card",
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    formation: {
        type: ControlType.Object,
        title: "Formation",
        controls: {
            taper: {
                type: ControlType.Number,
                title: "Taper",
                min: 0.5,
                max: 0.95,
                step: 0.01,
                defaultValue: FORM.taper,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0.4,
                max: 1.2,
                step: 0.01,
                defaultValue: FORM.spread,
            },
            lift: {
                type: ControlType.Number,
                title: "Rise",
                min: 0,
                max: 0.8,
                step: 0.01,
                defaultValue: FORM.lift,
            },
            depth: {
                type: ControlType.Number,
                title: "Side Cards",
                min: 1,
                max: 5,
                step: 1,
                displayStepper: true,
                defaultValue: FORM.depth,
            },
            outerFade: {
                type: ControlType.Number,
                title: "Edge Fade",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: FORM.outerFade,
            },
            ratio: {
                type: ControlType.Number,
                title: "Card Ratio",
                min: 0.6,
                max: 1.8,
                step: 0.01,
                defaultValue: FORM.ratio,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                step: 1,
                defaultValue: FORM.radius,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: FORM.shadow,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: MOTION.loop,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: MOTION.drag,
            },
            dragPower: {
                type: ControlType.Number,
                title: "Drag Feel",
                min: 0.4,
                max: 2.5,
                step: 0.1,
                defaultValue: MOTION.dragPower,
                hidden: (o: any) => !o.drag,
            },
            wheel: {
                type: ControlType.Enum,
                title: "Scroll",
                options: ["both", "horizontal", "off"],
                optionTitles: ["All", "Sideways", "Off"],
                defaultValue: MOTION.wheel,
            },
            snap: {
                type: ControlType.Number,
                title: "Snap",
                min: 1,
                max: 10,
                step: 1,
                defaultValue: MOTION.snap,
            },
            morph: {
                type: ControlType.Boolean,
                title: "Morph",
                defaultValue: MOTION.morph,
            },
            morphAmount: {
                type: ControlType.Number,
                title: "Morph Power",
                min: 0.2,
                max: 2,
                step: 0.1,
                defaultValue: MOTION.morphAmount,
                hidden: (o: any) => !o.morph,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: MOTION.autoplay,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1.5,
                max: 12,
                step: 0.5,
                unit: "s",
                defaultValue: MOTION.interval,
                hidden: (o: any) => !o.autoplay,
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            lineHeight: "1.15em",
            letterSpacing: "-0.03em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#111111",
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 40,
    },
    nav: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            place: {
                type: ControlType.Enum,
                title: "Position",
                options: ["valley", "below", "flank", "none"],
                optionTitles: ["Valley", "Below", "Flank", "Hidden"],
                defaultValue: NAV.place,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 28,
                max: 72,
                step: 1,
                defaultValue: NAV.size,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: NAV.gap,
                hidden: (o: any) => o.place !== "below" && o.place !== "flank",
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: NAV.fill,
            },
            hover: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: NAV.hover,
            },
            stroke: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: NAV.stroke,
            },
            icon: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: NAV.icon,
            },
        },
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
})
