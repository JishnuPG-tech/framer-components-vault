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


const { useRef, useState, useEffect, useLayoutEffect, useMemo, useId } = React

const seedImg = (s: string) => `https://picsum.photos/seed/${s}/720/960`

const STARTER_ITEMS = [
    ["cyr-a1", "Anouk Vellacott"],
    ["cyr-b2", "Tobiah Renfrew"],
    ["cyr-c3", "Mireya Castellan"],
    ["cyr-d4", "Kasimir Oduya"],
    ["cyr-e5", "Liesel Morrow"],
    ["cyr-f6", "Dashiell Achebe"],
    ["cyr-g7", "Ottilie Brandvold"],
    ["cyr-h8", "Rafferty Inoue"],
    ["cyr-i9", "Saoirse Delaunay"],
    ["cyr-j0", "Emrys Talbot"],
].map(([seed, title]) => ({
    media: "image",
    image: "",
    imageUrl: seedImg(seed),
    video: "",
    videoUrl: "",
    title,
    link: "",
    newTab: false,
}))

const BASE = {
    layout: {
        width: 47,
        ratio: 1.34,
        corner: 0,
        fill: "#EDEDED",
        shadow: false,
    },
    ring: {
        radius: 1.24,
        depth: 1,
        lens: 3,
        sideScale: 0.32,
        slots: 12,
        fadeFrom: 100,
        gap: 0.04,
    },
    morph: {
        strength: 0.14,
        softness: 0.12,
        grain: 3.2,
        flow: 0.6,
        glow: 0.07,
        zoom: 0.08,
        split: true,
    },
    motion: {
        dragSpeed: 1,
        momentum: 0.55,
        follow: 24,
        stiffness: 95,
        damping: 1,
        wheel: "both",
        wheelSpeed: 1,
        keys: true,
        autoplay: false,
        interval: 3.5,
        direction: "forward",
        videoPlay: true,
    },
    effects: { blur: 4, sideFade: 0, shade: 0.25, tilt: true, flingTilt: 0.4 },
    caption: {
        show: true,
        align: "center",
        inset: 24,
        titleFont: { fontSize: 20, lineHeight: 1.25, fontWeight: 500 },
        titleColor: "#FFFFFF",
        shade: 0.45,
    },
}

function readConfig(p: any) {
    return {
        items: Array.isArray(p.items) ? p.items : [],
        layout: { ...BASE.layout, ...(p.layout || {}) },
        ring: { ...BASE.ring, ...(p.ring || {}) },
        morph: { ...BASE.morph, ...(p.morph || {}) },
        motion: { ...BASE.motion, ...(p.motion || {}) },
        effects: { ...BASE.effects, ...(p.effects || {}) },
        caption: { ...BASE.caption, ...(p.caption || {}) },
        background: p.background ?? "#FFFFFF",
    }
}

/* ------------------------------------------------------------------ */
/* Pure helpers (math only — no markup)                               */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v
const ease3 = (t: number) => t * t * (3 - 2 * t)
const wrapRel = (d: number, m: number) => {
    const half = m / 2
    return ((((d + half) % m) + m) % m) - half
}
const mod = (n: number, m: number) => ((n % m) + m) % m

function slotTable(count: number, minSlots: number) {
    if (count <= 0) return [] as number[]
    const reps = count >= minSlots ? 1 : Math.ceil(minSlots / count)
    const out: number[] = []
    for (let r = 0; r < reps; r++) for (let i = 0; i < count; i++) out.push(i)
    return out
}

// Circular ring, in hero-width units: cards sit round a circle, yawing with it
// and shrinking toward the back. The neighbour on each side is parked at the
// first angle where its projected inner edge clears the hero (found once per
// ring setting), and every further card follows round the circle at an even
// step from there, so the next card always sits beside the main card. During a
// change the incoming neighbour stays at that spot and fades while the hero
// morphs, rather than sliding underneath it.
function projectInner(absDeg: number, ring: any) {
    const rad = (absDeg * Math.PI) / 180
    const R = ring.radius
    const L = Math.max(1, ring.lens)
    const h = Math.max(0.02, ring.sideScale) / 2
    const xc = R * Math.sin(rad)
    const zc = R * (Math.cos(rad) - 1) - ring.depth
    const ix = xc - h * Math.cos(rad)
    const iz = zc + h * Math.sin(rad)
    return { xc, zc, inner: (ix * L) / Math.max(0.05, L - iz) }
}

const clearCache = new Map<string, number>()
function clearAngle(ring: any) {
    const key = [
        ring.radius,
        ring.depth,
        ring.lens,
        ring.sideScale,
        ring.gap,
    ].join("|")
    const hit = clearCache.get(key)
    if (hit !== undefined) return hit
    const line = 0.5 + ring.gap
    let found = 60
    for (let a = 1; a <= 89; a += 0.25) {
        if (projectInner(a, ring).inner >= line) {
            found = a
            break
        }
    }
    if (clearCache.size > 64) clearCache.clear()
    clearCache.set(key, found)
    return found
}

function ringPose(rel: number, stepDeg: number, ring: any) {
    const away = Math.abs(rel)
    const side = rel < 0 ? -1 : 1
    const absDeg = clearAngle(ring) + stepDeg * Math.max(0, away - 1)
    const spot = projectInner(absDeg, ring)
    const entry = away < 1 ? ease3(clamp((away - 0.15) / 0.7, 0, 1)) : 1
    const clear = ease3(
        clamp((spot.inner - 0.5) / Math.max(0.005, ring.gap) + 0.001, 0, 1)
    )
    const back =
        absDeg <= ring.fadeFrom
            ? 1
            : clamp(1 - (absDeg - ring.fadeFrom) / 26, 0, 1)
    return {
        x: side * spot.xc,
        z: spot.zc,
        turn: side * absDeg,
        size: ring.sideScale * (away < 1 ? 0.88 + 0.12 * away : 1),
        alpha: entry * back * clear,
        order: Math.round(absDeg),
    }
}

function frameFor(w: number, h: number, cfg: any) {
    const ratio = Math.max(0.3, cfg.layout.ratio)
    const byWidth = (w * cfg.layout.width) / 100
    const byHeight = Math.max(40, h * 0.86) / ratio
    const cw = Math.max(20, Math.min(byWidth, byHeight))
    const ch = cw * ratio
    return { cw, ch, cy: h / 2 }
}

function srcOf(item: any) {
    return item?.image || item?.imageUrl || ""
}
function videoOf(item: any) {
    if (item?.media !== "video") return ""
    return item?.video || item?.videoUrl || ""
}

/* ------------------------------------------------------------------ */
/* Liquid morph shader (live branch only)                             */
/* ------------------------------------------------------------------ */

const MORPH_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`

const MORPH_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uSA;
uniform vec2 uSB;
uniform vec2 uRes;
uniform float uP;
uniform float uT;
uniform float uAmp;
uniform float uSoft;
uniform float uGrain;
uniform float uGlow;
uniform float uZoom;
uniform float uSplit;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p = p * 2.03 + vec2(17.1, 9.7);
        a *= 0.5;
    }
    return v;
}
vec2 cover(vec2 uv, vec2 t) {
    float rs = uRes.x / uRes.y;
    float ts = t.x / max(t.y, 1.0);
    vec2 s = rs > ts ? vec2(1.0, ts / rs) : vec2(rs / ts, 1.0);
    return (uv - 0.5) * s + 0.5;
}
vec3 grab(sampler2D tex, vec2 uv, vec2 size, vec2 ab) {
    if (uSplit < 0.5) return texture2D(tex, cover(uv, size)).rgb;
    return vec3(
        texture2D(tex, cover(uv + ab, size)).r,
        texture2D(tex, cover(uv, size)).g,
        texture2D(tex, cover(uv - ab, size)).b
    );
}
void main() {
    vec2 uv = vUv;
    float w = sin(3.14159265 * uP);
    vec2 q = vec2(uv.x * uRes.x / uRes.y, uv.y) * uGrain;
    float n1 = fbm(q + vec2(uT * 0.35, -uT * 0.22));
    float n2 = fbm(q * 1.31 + vec2(-uT * 0.27, uT * 0.19) + 4.7);
    vec2 flow = (vec2(n1, n2) - 0.5) * 2.0;

    float f = clamp(((1.0 - uv.x) * 0.55 + n1 * 0.45 - 0.1) / 0.8, 0.0, 1.0);
    float edge = mix(-uSoft, 1.0 + uSoft, uP);
    float keepOld = smoothstep(edge - uSoft, edge + uSoft, f);
    float band = 1.0 - smoothstep(0.0, uSoft * 2.5, abs(f - edge));

    vec2 disp = flow * uAmp * w * (0.35 + 0.65 * band);
    vec2 ua = uv + disp + vec2(uP * 0.05, 0.0);
    ua = (ua - 0.5) / (1.0 + uZoom * uP) + 0.5;
    vec2 ub = uv - disp * 0.8 - vec2((1.0 - uP) * 0.05, 0.0);
    ub = (ub - 0.5) / (1.0 + uZoom * (1.0 - uP)) + 0.5;

    vec2 ab = disp * 0.2;
    vec3 ca = grab(uA, ua, uSA, ab);
    vec3 cb = grab(uB, ub, uSB, ab);
    vec3 col = mix(cb, ca, keepOld);
    col += band * w * uGlow;
    gl_FragColor = vec4(col, 1.0);
}`

function buildMorph(canvas: HTMLCanvasElement) {
    let gl: WebGLRenderingContext | null = null
    try {
        gl = canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
        }) as WebGLRenderingContext | null
    } catch {
        gl = null
    }
    if (!gl) return null
    const shader = (type: number, src: string) => {
        const s = gl!.createShader(type)!
        gl!.shaderSource(s, src)
        gl!.compileShader(s)
        if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) return null
        return s
    }
    const vs = shader(gl.VERTEX_SHADER, MORPH_VERT)
    const fs = shader(gl.FRAGMENT_SHADER, MORPH_FRAG)
    if (!vs || !fs) return null
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )
    const aPos = gl.getAttribLocation(prog, "aPos")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    const names = [
        "uA",
        "uB",
        "uSA",
        "uSB",
        "uRes",
        "uP",
        "uT",
        "uAmp",
        "uSoft",
        "uGrain",
        "uGlow",
        "uZoom",
        "uSplit",
    ]
    const u: Record<string, WebGLUniformLocation | null> = {}
    for (const n of names) u[n] = gl.getUniformLocation(prog, n)
    gl.uniform1i(u.uA, 0)
    gl.uniform1i(u.uB, 1)
    const makeTex = () => {
        const t = gl!.createTexture()
        gl!.bindTexture(gl!.TEXTURE_2D, t)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
        return t
    }
    return { gl, u, makeTex, liveA: makeTex(), liveB: makeTex(), lost: false }
}

/* ------------------------------------------------------------------ */
/* Entry                                                              */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function CMSOrbitCarousel(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <OrbitStill {...props} />
    return <OrbitLive {...props} />
}

/* ------------------------------------------------------------------ */
/* Static branch — canvas + export                                    */
/* ------------------------------------------------------------------ */

function OrbitStill(props: any) {
    const cfg = readConfig(props)
    const { items, layout, ring, caption } = cfg
    const count = items.length
    const slots = slotTable(count, ring.slots)
    const total = slots.length
    const stepDeg = total ? 360 / total : 0
    const ratio = Math.max(0.3, layout.ratio)
    const cwExpr = `min(${layout.width}cqw, calc(86cqh / ${ratio}))`
    const lead = items[0]
    const leadImg = srcOf(lead)
    const leadVid = videoOf(lead)

    return (
        <div
            style={
                {
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: cfg.background,
                    containerType: "size",
                } as any
            }
        >
            {count === 0 ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 14,
                        fontFamily: "system-ui, sans-serif",
                    }}
                >
                    Add images or videos in the Items panel
                </div>
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        ["--cw" as any]: cwExpr,
                        perspective: `calc(var(--cw) * ${ring.lens})`,
                        perspectiveOrigin: "50% 50%",
                    }}
                >
                    {slots.map((itemIdx, j) => {
                        const pose = ringPose(wrapRel(j, total), stepDeg, ring)
                        if (pose.alpha <= 0) return null
                        const item = items[itemIdx]
                        const img = srcOf(item)
                        const vid = videoOf(item)
                        return (
                            <div
                                key={j}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: "var(--cw)",
                                    height: `calc(var(--cw) * ${ratio})`,
                                    marginLeft: "calc(var(--cw) * -0.5)",
                                    marginTop: `calc(var(--cw) * ${-ratio / 2})`,
                                    borderRadius: layout.corner,
                                    overflow: "hidden",
                                    background: layout.fill,
                                    zIndex: 500 - pose.order,
                                    opacity:
                                        pose.alpha * (1 - cfg.effects.sideFade),
                                    transform: `translate3d(calc(var(--cw) * ${pose.x}), 0, calc(var(--cw) * ${pose.z})) rotateY(${pose.turn}deg) scale(${pose.size})`,
                                }}
                            >
                                {img ? (
                                    <img
                                        src={img}
                                        alt=""
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : vid ? (
                                    <video
                                        src={vid}
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

                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "var(--cw)",
                            height: `calc(var(--cw) * ${ratio})`,
                            marginLeft: "calc(var(--cw) * -0.5)",
                            marginTop: `calc(var(--cw) * ${-ratio / 2})`,
                            borderRadius: layout.corner,
                            overflow: "hidden",
                            background: layout.fill,
                            boxShadow: layout.shadow
                                ? "0 30px 60px -24px rgba(0,0,0,0.35)"
                                : "none",
                            zIndex: 1500,
                        }}
                    >
                        {leadImg ? (
                            <img
                                src={leadImg}
                                alt={lead?.title || ""}
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : leadVid ? (
                            <video
                                src={leadVid}
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
                        {caption.show && lead?.title ? (
                            <>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: "42%",
                                        background: `linear-gradient(to top, rgba(0,0,0,${caption.shade}), rgba(0,0,0,0))`,
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        left: caption.inset,
                                        right: caption.inset,
                                        bottom: caption.inset,
                                        textAlign: caption.align,
                                        ...caption.titleFont,
                                        color: caption.titleColor,
                                    }}
                                >
                                    {lead.title}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live-branch hooks                                                  */
/* ------------------------------------------------------------------ */

function useOnScreen(target: React.RefObject<HTMLElement>) {
    const [onScreen, setOnScreen] = useState(false)
    const permit = useRef(false)
    useEffect(() => {
        const el = target.current
        if (!el) return
        let inView = false
        let tabShown =
            typeof document === "undefined"
                ? true
                : document.visibilityState !== "hidden"
        const sync = () => {
            const next = inView && tabShown
            permit.current = next
            setOnScreen(next)
        }
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            inView = true
            sync()
        } else {
            io = new IntersectionObserver(
                (entries) => {
                    for (const e of entries) inView = e.isIntersecting
                    sync()
                },
                { threshold: 0.01 }
            )
            io.observe(el)
        }
        const onVis = () => {
            tabShown = document.visibilityState !== "hidden"
            sync()
        }
        document.addEventListener("visibilitychange", onVis)
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            permit.current = false
        }
    }, [])
    return [onScreen, permit] as const
}

function useCalmMotion() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setCalm(mq.matches)
        read()
        mq.addEventListener?.("change", read)
        return () => mq.removeEventListener?.("change", read)
    }, [])
    return calm
}

/* ------------------------------------------------------------------ */
/* Live branch — published site                                       */
/* ------------------------------------------------------------------ */

type Still = {
    src: string
    img: HTMLImageElement | null
    ready: boolean
    glSafe: boolean
    tex: WebGLTexture | null
    retried: boolean
}

function OrbitLive(props: any) {
    const cfg = readConfig(props)
    const { items, layout, ring, caption } = cfg
    const count = items.length
    const slots = useMemo(
        () => slotTable(count, ring.slots),
        [count, ring.slots]
    )
    const total = slots.length

    const shellRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)
    const glCanvasRef = useRef<HTMLCanvasElement>(null)
    const flatCanvasRef = useRef<HTMLCanvasElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const morphRef = useRef<ReturnType<typeof buildMorph> | null>(null)
    const morphTried = useRef(false)
    const stills = useRef<Still[]>([])
    const noGLVideo = useRef<Set<number>>(new Set())

    const [onScreen, permit] = useOnScreen(shellRef)
    const calm = useCalmMotion()

    const [box, setBox] = useState({ w: 700, h: 700 })
    const frame = frameFor(box.w, box.h, cfg)
    const [cap, setCap] = useState({ cur: 0, prev: -1, n: 0 })
    const front = cap.cur

    const uid = "cy" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const live = useRef({ cfg, frame, total, count, slots, calm })
    live.current = { cfg, frame, total, count, slots, calm }

    const rig = useRef({
        pos: 0,
        vel: 0,
        goal: 0,
        held: false,
        x0: 0,
        pos0: 0,
        lastT: 0,
        travel: 0,
        flick: 0,
        pressed: -2,
        spinAt: 0,
        spinning: false,
        over: false,
        sway: 0,
        touchedAt: 0,
        frameId: 0,
        tickAt: 0,
        front: 0,
        flowT: 0,
        heroLive: false,
        haze: [] as number[],
        rolling: [] as boolean[],
    })

    /* ---- media registry for the hero morph ------------------------ */

    const ensureStills = () => {
        const list = live.current.cfg.items
        const next: Still[] = []
        for (let i = 0; i < list.length; i++) {
            const src = videoOf(list[i]) ? "" : srcOf(list[i])
            const prev = stills.current[i]
            if (prev && prev.src === src) {
                next.push(prev)
                continue
            }
            next.push({
                src,
                img: null,
                ready: false,
                glSafe: true,
                tex: null,
                retried: false,
            })
        }
        stills.current = next
    }

    const loadStill = (s: Still) => {
        if (!s.src || s.img || typeof Image === "undefined") return
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            s.ready = true
            wake()
        }
        img.onerror = () => {
            if (s.retried) return
            s.retried = true
            s.glSafe = false
            const plain = new Image()
            plain.decoding = "async"
            plain.onload = () => {
                s.img = plain
                s.ready = true
                wake()
            }
            plain.src = s.src
        }
        s.img = img
        img.src = s.src
    }

    const stillTexture = (s: Still | undefined) => {
        const m = morphRef.current
        if (!m || !s || !s.ready || !s.glSafe || !s.img) return null
        if (!s.tex) {
            const gl = m.gl
            const t = m.makeTex()
            try {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    s.img
                )
                s.tex = t
            } catch {
                gl.deleteTexture(t)
                s.glSafe = false
                return null
            }
        }
        return {
            tex: s.tex,
            w: s.img.naturalWidth || 1,
            h: s.img.naturalHeight || 1,
        }
    }

    const videoTexture = (
        slot: number,
        itemIdx: number,
        unit: WebGLTexture | null
    ) => {
        const m = morphRef.current
        const v = videoRefs.current[slot]
        if (!m || !v || v.readyState < 2 || noGLVideo.current.has(itemIdx))
            return null
        const gl = m.gl
        gl.bindTexture(gl.TEXTURE_2D, unit)
        try {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                v
            )
        } catch {
            noGLVideo.current.add(itemIdx)
            return null
        }
        return { tex: unit, w: v.videoWidth || 1, h: v.videoHeight || 1 }
    }

    const flatSource = (slot: number, itemIdx: number) => {
        const item = live.current.cfg.items[itemIdx]
        if (videoOf(item)) {
            const v = videoRefs.current[slot]
            if (v && v.readyState >= 2)
                return {
                    el: v as CanvasImageSource,
                    w: v.videoWidth,
                    h: v.videoHeight,
                }
            return null
        }
        const s = stills.current[itemIdx]
        if (s && s.ready && s.img)
            return {
                el: s.img as CanvasImageSource,
                w: s.img.naturalWidth,
                h: s.img.naturalHeight,
            }
        return null
    }

    const drawCover = (
        ctx: CanvasRenderingContext2D,
        src: any,
        cw: number,
        ch: number,
        zoom: number,
        shiftX: number
    ) => {
        if (!src || !src.w || !src.h) return
        const scale = Math.max(cw / src.w, ch / src.h) * zoom
        const w = src.w * scale
        const h = src.h * scale
        ctx.drawImage(src.el, (cw - w) / 2 + shiftX, (ch - h) / 2, w, h)
    }

    const drawHero = (dt: number) => {
        const r = rig.current
        const { cfg: c, total: m, slots: map } = live.current
        const glCanvas = glCanvasRef.current
        const flatCanvas = flatCanvasRef.current
        if (!m || !glCanvas || !flatCanvas) return
        const base = Math.floor(r.pos)
        let p = r.pos - base
        if (p < 1e-4) p = 0
        if (p > 1 - 1e-4) p = 1
        const sa = mod(base, m)
        const sb = mod(base + 1, m)
        const ia = map[sa]
        const ib = map[sb]
        const wave = Math.sin(Math.PI * p)
        if (wave > 0.001) r.flowT += dt * c.morph.flow

        const aIsVideo = !!videoOf(c.items[ia])
        const bIsVideo = !!videoOf(c.items[ib])
        r.heroLive = (aIsVideo && p < 1) || (bIsVideo && p > 0)

        const mg = morphRef.current
        if (mg && !mg.lost) {
            const ta = aIsVideo
                ? videoTexture(sa, ia, mg.liveA)
                : stillTexture(stills.current[ia])
            const tb =
                p === 0
                    ? ta
                    : bIsVideo
                      ? videoTexture(sb, ib, mg.liveB)
                      : stillTexture(stills.current[ib])
            if (ta && tb) {
                const gl = mg.gl
                gl.viewport(0, 0, glCanvas.width, glCanvas.height)
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, ta.tex)
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, tb.tex)
                gl.uniform2f(mg.u.uSA, ta.w, ta.h)
                gl.uniform2f(mg.u.uSB, tb.w, tb.h)
                gl.uniform2f(mg.u.uRes, glCanvas.width, glCanvas.height)
                gl.uniform1f(mg.u.uP, p)
                gl.uniform1f(mg.u.uT, r.flowT)
                gl.uniform1f(mg.u.uAmp, c.morph.strength)
                gl.uniform1f(mg.u.uSoft, Math.max(0.01, c.morph.softness))
                gl.uniform1f(mg.u.uGrain, c.morph.grain)
                gl.uniform1f(mg.u.uGlow, c.morph.glow)
                gl.uniform1f(mg.u.uZoom, c.morph.zoom)
                gl.uniform1f(mg.u.uSplit, c.morph.split ? 1 : 0)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                glCanvas.style.visibility = "visible"
                flatCanvas.style.visibility = "hidden"
                return
            }
        }

        // fallback: soft cross-dissolve on a 2D canvas (sources the GPU can't take)
        const ctx = flatCanvas.getContext("2d")
        if (!ctx) return
        const W = flatCanvas.width
        const H = flatCanvas.height
        ctx.globalAlpha = 1
        ctx.fillStyle = c.layout.fill
        ctx.fillRect(0, 0, W, H)
        const srcA = flatSource(sa, ia)
        const srcB = p > 0 ? flatSource(sb, ib) : null
        if (srcA)
            drawCover(ctx, srcA, W, H, 1 + c.morph.zoom * p, -p * W * 0.05)
        if (srcB) {
            ctx.globalAlpha = ease3(p)
            drawCover(
                ctx,
                srcB,
                W,
                H,
                1 + c.morph.zoom * (1 - p),
                (1 - p) * W * 0.05
            )
        }
        ctx.globalAlpha = 1
        glCanvas.style.visibility = "hidden"
        flatCanvas.style.visibility = "visible"
    }

    /* ---- painting ------------------------------------------------- */

    const paint = (dt = 0) => {
        const r = rig.current
        const { cfg: c, frame: f, total: m } = live.current
        if (!m) return
        const step = 360 / m
        for (let j = 0; j < m; j++) {
            const el = cardRefs.current[j]
            if (!el) continue
            const rel = wrapRel(j - r.pos, m)
            const pose = ringPose(rel, step, c.ring)
            const x = pose.x * f.cw
            const z = pose.z * f.cw
            const ry = pose.turn + r.sway * 0.5
            el.style.transform = `translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg) scale(${pose.size.toFixed(4)})`
            el.style.opacity = String(pose.alpha * (1 - c.effects.sideFade))
            el.style.visibility = pose.alpha <= 0.001 ? "hidden" : "visible"
            el.style.zIndex = String(500 - pose.order)
            const veil = el.lastElementChild as HTMLElement | null
            if (veil && veil.dataset.veil) {
                const lean = Math.sin(
                    (Math.min(90, Math.abs(ry)) * Math.PI) / 180
                )
                veil.style.opacity = String(c.effects.shade * lean)
                const dir = ry >= 0 ? "r" : "l"
                if (veil.dataset.dir !== dir) {
                    veil.dataset.dir = dir
                    veil.style.background = `linear-gradient(${dir === "r" ? "90deg" : "270deg"}, rgba(0,0,0,0.04), rgba(0,0,0,0.7))`
                }
            }
            const blurPx = Math.round(c.effects.blur * 4) / 4
            if (r.haze[j] !== blurPx) {
                r.haze[j] = blurPx
                el.style.filter = blurPx > 0.05 ? `blur(${blurPx}px)` : "none"
            }
            const v = videoRefs.current[j]
            if (v) {
                const want =
                    permit.current && c.motion.videoPlay && Math.abs(rel) < 1.05
                if (r.rolling[j] !== want) {
                    r.rolling[j] = want
                    if (want) v.play()?.catch(() => {})
                    else v.pause()
                }
            }
        }

        const hero = heroRef.current
        if (hero) {
            const base = Math.floor(r.pos)
            const wave = Math.sin(Math.PI * (r.pos - base))
            hero.style.transform = `rotateY(${r.sway.toFixed(3)}deg) scale(${(1 - 0.025 * wave).toFixed(4)})`
        }
        drawHero(dt)

        const lead = mod(Math.round(r.pos), m)
        if (lead !== r.front) {
            const was = r.front
            r.front = lead
            setCap((p) => ({ cur: lead, prev: was, n: p.n + 1 }))
        }
    }

    /* ---- loop ----------------------------------------------------- */

    const tick = (now: number) => {
        const r = rig.current
        r.frameId = 0
        if (!permit.current) {
            r.held = false
            r.spinning = false
            r.vel = 0
            r.goal = Math.round(r.pos)
            r.pos = r.goal
            return
        }
        const { cfg: c, total: m, calm: still } = live.current
        const dt = Math.min(0.05, Math.max(0.001, (now - r.tickAt) / 1000))
        r.tickAt = now

        if (r.held) {
            const prev = r.pos
            r.pos += (r.goal - r.pos) * (1 - Math.exp(-dt * c.motion.follow))
            if (Math.abs(r.goal - r.pos) < 1e-4) r.pos = r.goal
            r.vel = (r.pos - prev) / dt
        } else {
            if (r.spinning && now - r.spinAt > 150) {
                r.spinning = false
                r.goal = Math.round(r.goal)
            }
            const k = c.motion.stiffness
            const drag = 2 * Math.sqrt(k) * c.motion.damping
            let left = dt
            while (left > 1e-6) {
                const h = Math.min(left, 1 / 240)
                const acc = k * (r.goal - r.pos) - drag * r.vel
                r.vel += acc * h
                r.pos += r.vel * h
                left -= h
            }
            if (
                !r.spinning &&
                Math.abs(r.goal - r.pos) < 4e-4 &&
                Math.abs(r.vel) < 4e-3
            ) {
                r.pos = r.goal
                r.vel = 0
            }
        }

        if (m && Math.abs(r.pos) > m * 24) {
            const shift = Math.round(r.pos / m) * m
            r.pos -= shift
            r.goal -= shift
            r.pos0 -= shift
        }

        const tiltOn = c.effects.tilt && !still
        const swayAim = tiltOn
            ? clamp(-r.vel * c.effects.flingTilt * 7, -20, 20)
            : 0
        r.sway += (swayAim - r.sway) * Math.min(1, dt * 9)
        const swayDone = Math.abs(r.sway - swayAim) < 0.01
        if (swayDone) r.sway = swayAim

        paint(dt)

        const resting =
            !r.held &&
            !r.spinning &&
            r.pos === r.goal &&
            swayDone &&
            !r.heroLive
        if (!resting) r.frameId = requestAnimationFrame(tick)
    }

    const wake = () => {
        const r = rig.current
        if (r.frameId || !permit.current) return
        r.tickAt = performance.now()
        r.frameId = requestAnimationFrame(tick)
    }

    /* ---- effects -------------------------------------------------- */

    useEffect(() => {
        const el = shellRef.current
        if (!el || typeof ResizeObserver === "undefined") {
            if (el)
                setBox({ w: el.clientWidth || 700, h: el.clientHeight || 700 })
            return
        }
        const ro = new ResizeObserver(() => {
            setBox({ w: el.clientWidth || 700, h: el.clientHeight || 700 })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // size the hero canvases to the frame at device resolution
    useLayoutEffect(() => {
        const dpr =
            typeof window === "undefined"
                ? 1
                : Math.min(2, window.devicePixelRatio || 1)
        const w = Math.max(2, Math.round(frame.cw * dpr))
        const h = Math.max(2, Math.round(frame.ch * dpr))
        for (const cv of [glCanvasRef.current, flatCanvasRef.current]) {
            if (cv && (cv.width !== w || cv.height !== h)) {
                cv.width = w
                cv.height = h
            }
        }
    }, [frame.cw, frame.ch])

    // repaint on every render so property edits show even while asleep
    useLayoutEffect(() => {
        ensureStills()
        paint(0)
    })

    useEffect(() => {
        const r = rig.current
        if (onScreen) {
            if (!morphTried.current && glCanvasRef.current) {
                morphTried.current = true
                const cv = glCanvasRef.current
                morphRef.current = buildMorph(cv)
                cv.addEventListener("webglcontextlost", (e) => {
                    e.preventDefault()
                    if (morphRef.current) morphRef.current.lost = true
                })
            }
            ensureStills()
            stills.current.forEach(loadStill)
            paint(0)
            wake()
        } else {
            if (r.frameId) cancelAnimationFrame(r.frameId)
            r.frameId = 0
            r.held = false
            r.spinning = false
            r.vel = 0
            videoRefs.current.forEach((v, j) => {
                if (v) v.pause()
                r.rolling[j] = false
            })
        }
    }, [onScreen])

    // new or changed media while on screen
    useEffect(() => {
        if (!permit.current) return
        ensureStills()
        stills.current.forEach(loadStill)
        wake()
    }, [items])

    useEffect(() => {
        return () => {
            const r = rig.current
            if (r.frameId) cancelAnimationFrame(r.frameId)
            r.frameId = 0
            const mg = morphRef.current
            if (mg) {
                stills.current.forEach((s) => {
                    if (s.tex) mg.gl.deleteTexture(s.tex)
                })
                mg.gl.getExtension("WEBGL_lose_context")?.loseContext()
            }
            morphRef.current = null
        }
    }, [])

    // wheel / trackpad
    useEffect(() => {
        const el = shellRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            const { cfg: c, total: m } = live.current
            const mode = c.motion.wheel
            if (mode === "off" || !m) return
            const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            if (mode === "horizontal" && !horizontal) return
            let d = horizontal ? e.deltaX : e.deltaY
            if (e.deltaMode === 1) d *= 16
            else if (e.deltaMode === 2) d *= el.clientHeight || 700
            if (!d) return
            e.preventDefault()
            const r = rig.current
            const perItem = 120 / Math.max(0.1, c.motion.wheelSpeed)
            const base = Math.round(r.pos)
            r.goal = clamp(r.goal + d / perItem, base - 4, base + 4)
            r.spinning = true
            r.spinAt = performance.now()
            r.touchedAt = r.spinAt
            wake()
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [])

    // autoplay — only exists while on screen
    useEffect(() => {
        const c = cfg.motion
        if (!onScreen || calm || !c.autoplay || total < 2) return
        const ms = Math.max(0.8, c.interval) * 1000
        const dir = c.direction === "backward" ? -1 : 1
        const id = window.setInterval(() => {
            const r = rig.current
            if (!permit.current || r.held || r.over || r.spinning) return
            if (performance.now() - r.touchedAt < ms) return
            r.goal = Math.round(r.goal) + dir
            wake()
        }, ms)
        return () => window.clearInterval(id)
    }, [
        onScreen,
        calm,
        cfg.motion.autoplay,
        cfg.motion.interval,
        cfg.motion.direction,
        total,
    ])

    /* ---- interaction ---------------------------------------------- */

    const follow = (item: any) => {
        const url = item?.link
        if (!url || typeof window === "undefined") return
        if (item.newTab) window.open(url, "_blank", "noopener,noreferrer")
        else window.location.href = url
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        const r = rig.current
        const t = e.target as HTMLElement
        const hit = t.closest?.("[data-slot]") as HTMLElement | null
        r.pressed = t.closest?.("[data-hero]")
            ? -1
            : hit
              ? Number(hit.dataset.slot)
              : -2
        r.held = true
        r.x0 = e.clientX
        r.pos0 = r.goal
        r.lastT = performance.now()
        r.travel = 0
        r.flick = 0
        r.spinning = false
        r.touchedAt = r.lastT
        try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {}
        wake()
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const r = rig.current
        const { cfg: c, frame: f } = live.current
        const now = performance.now()
        if (r.held) {
            const perItem = (f.cw * 0.55) / Math.max(0.1, c.motion.dragSpeed)
            const next = r.pos0 - (e.clientX - r.x0) / perItem
            const dt = (now - r.lastT) / 1000
            if (dt > 0.001) {
                const v = (next - r.goal) / dt
                r.flick += (v - r.flick) * (1 - Math.exp(-dt / 0.045))
            }
            r.goal = next
            r.travel = Math.max(r.travel, Math.abs(e.clientX - r.x0))
            r.lastT = now
            r.touchedAt = now
            wake()
        }
    }

    const release = (e: React.PointerEvent, cancelled: boolean) => {
        const r = rig.current
        if (!r.held) return
        r.held = false
        try {
            ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
        } catch {}
        const { cfg: c, total: m, slots: map } = live.current
        const now = performance.now()
        if (now - r.lastT > 90) r.flick = 0
        if (!cancelled && r.travel < 6) {
            r.vel *= 0.3
            if (r.pressed === -1 && m) {
                r.goal = Math.round(r.pos)
                follow(c.items[map[mod(r.goal, m)]])
            } else if (r.pressed >= 0 && m) {
                r.goal = Math.round(r.pos + wrapRel(r.pressed - r.pos, m))
            } else {
                r.goal = Math.round(r.pos)
            }
        } else {
            const carry = 0.08 + c.motion.momentum * 0.5
            const base = Math.round(r.goal)
            const reach = Math.max(1, Math.floor(m / 2))
            r.vel = r.vel * 0.4 + r.flick * 0.6
            r.goal = clamp(
                Math.round(r.goal + r.flick * carry),
                base - reach,
                base + reach
            )
        }
        r.touchedAt = now
        wake()
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        const c = live.current.cfg
        if (!c.motion.keys || !total) return
        const r = rig.current
        let shift = 0
        if (e.key === "ArrowRight" || e.key === "ArrowDown") shift = 1
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") shift = -1
        else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            follow(items[slots[mod(Math.round(r.pos), total)]])
            return
        }
        if (!shift) return
        e.preventDefault()
        r.goal = Math.round(r.goal) + shift
        r.touchedAt = performance.now()
        wake()
    }

    /* ---- render --------------------------------------------------- */

    const leadItem = total ? items[slots[front]] : null
    const prevItem =
        cap.prev >= 0 && cap.prev !== cap.cur && total
            ? items[slots[cap.prev]]
            : null
    const leadLinked = !!leadItem?.link

    return (
        <div
            ref={shellRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Media gallery"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => release(e, false)}
            onPointerCancel={(e) => release(e, true)}
            onPointerEnter={() => {
                rig.current.over = true
            }}
            onPointerLeave={() => {
                const r = rig.current
                r.over = false
            }}
            onDragStart={(e) => e.preventDefault()}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: cfg.background,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "grab",
                outline: "none",
            }}
        >
            <style>{`
@keyframes ${uid}-in { from { opacity: 0; transform: translateY(10px); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }
@keyframes ${uid}-out { from { opacity: 1; transform: none; filter: blur(0); } to { opacity: 0; transform: translateY(-8px); filter: blur(4px); } }
.${uid}-cap { animation: ${uid}-in 560ms cubic-bezier(.2,.75,.2,1) 70ms both; }
.${uid}-old { position: absolute; left: 0; right: 0; bottom: 0; animation: ${uid}-out 300ms cubic-bezier(.4,0,.6,1) both; }
.${uid}-hero { cursor: ${leadLinked ? "pointer" : "grab"}; }
@media (prefers-reduced-motion: reduce) { .${uid}-cap { animation: none; } .${uid}-old { display: none; } }
`}</style>

            {total === 0 ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: 14,
                        fontFamily: "system-ui, sans-serif",
                    }}
                >
                    Add images or videos in the Items panel
                </div>
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        perspective: `${frame.cw * Math.max(1, ring.lens)}px`,
                        perspectiveOrigin: `50% ${frame.cy}px`,
                    }}
                >
                    {slots.map((itemIdx, j) => {
                        const item = items[itemIdx]
                        const img = srcOf(item)
                        const vid = videoOf(item)
                        return (
                            <div
                                key={j}
                                data-slot={j}
                                ref={(el) => {
                                    cardRefs.current[j] = el
                                }}
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: frame.cy,
                                    width: frame.cw,
                                    height: frame.ch,
                                    marginLeft: -frame.cw / 2,
                                    marginTop: -frame.ch / 2,
                                    borderRadius: layout.corner,
                                    overflow: "hidden",
                                    background: layout.fill,
                                    transformOrigin: "50% 50%",
                                    backfaceVisibility: "hidden",
                                    willChange: "transform",
                                    cursor: "pointer",
                                }}
                            >
                                {vid ? (
                                    <video
                                        ref={(el) => {
                                            videoRefs.current[j] = el
                                        }}
                                        src={vid}
                                        poster={img || undefined}
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : img ? (
                                    <img
                                        src={img}
                                        alt=""
                                        draggable={false}
                                        loading="eager"
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
                                <div
                                    data-veil="1"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        opacity: 0,
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        )
                    })}

                    <div
                        ref={heroRef}
                        data-hero="1"
                        className={`${uid}-hero`}
                        role="group"
                        aria-label={leadItem?.title || "Current item"}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: frame.cy,
                            width: frame.cw,
                            height: frame.ch,
                            marginLeft: -frame.cw / 2,
                            marginTop: -frame.ch / 2,
                            borderRadius: layout.corner,
                            overflow: "hidden",
                            background: layout.fill,
                            boxShadow: layout.shadow
                                ? "0 30px 60px -24px rgba(0,0,0,0.35)"
                                : "none",
                            zIndex: 1500,
                            transformOrigin: "50% 50%",
                            willChange: "transform",
                        }}
                    >
                        <canvas
                            ref={flatCanvasRef}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "block",
                            }}
                        />
                        <canvas
                            ref={glCanvasRef}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "block",
                                visibility: "hidden",
                            }}
                        />
                        {caption.show && leadItem ? (
                            <>
                                <div
                                    aria-hidden
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: "42%",
                                        pointerEvents: "none",
                                        background: `linear-gradient(to top, rgba(0,0,0,${caption.shade}), rgba(0,0,0,0))`,
                                    }}
                                />
                                <div
                                    aria-live="polite"
                                    style={{
                                        position: "absolute",
                                        left: caption.inset,
                                        right: caption.inset,
                                        bottom: caption.inset,
                                        textAlign: caption.align,
                                        pointerEvents: "none",
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
                                        {prevItem?.title ? (
                                            <div
                                                key={"o" + cap.n}
                                                className={`${uid}-old`}
                                                aria-hidden
                                                style={{
                                                    ...caption.titleFont,
                                                    color: caption.titleColor,
                                                }}
                                            >
                                                {prevItem.title}
                                            </div>
                                        ) : null}
                                        <div
                                            key={"i" + cap.n}
                                            className={`${uid}-cap`}
                                            style={{
                                                ...caption.titleFont,
                                                color: caption.titleColor,
                                            }}
                                        >
                                            {leadItem.title || "\u00a0"}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                  */
/* ------------------------------------------------------------------ */

addPropertyControls(CMSOrbitCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 40,
        defaultValue: STARTER_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: { type: ControlType.Image, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.media !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    defaultValue: "",
                    hidden: (p: any) => p.media !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (p: any) => !p.link,
                },
            },
        },
    },
    morph: {
        type: ControlType.Object,
        title: "Liquid Morph",
        controls: {
            strength: {
                type: ControlType.Number,
                title: "Distortion",
                min: 0,
                max: 0.4,
                step: 0.005,
                defaultValue: BASE.morph.strength,
            },
            softness: {
                type: ControlType.Number,
                title: "Edge Softness",
                min: 0.02,
                max: 0.4,
                step: 0.01,
                defaultValue: BASE.morph.softness,
            },
            grain: {
                type: ControlType.Number,
                title: "Ripple Size",
                min: 1,
                max: 10,
                step: 0.1,
                defaultValue: BASE.morph.grain,
            },
            flow: {
                type: ControlType.Number,
                title: "Flow Speed",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: BASE.morph.flow,
            },
            glow: {
                type: ControlType.Number,
                title: "Edge Sheen",
                min: 0,
                max: 0.4,
                step: 0.01,
                defaultValue: BASE.morph.glow,
            },
            zoom: {
                type: ControlType.Number,
                title: "Depth Zoom",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: BASE.morph.zoom,
            },
            split: {
                type: ControlType.Boolean,
                title: "Colour Split",
                defaultValue: BASE.morph.split,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 15,
                max: 90,
                step: 1,
                unit: "%",
                defaultValue: BASE.layout.width,
            },
            ratio: {
                type: ControlType.Number,
                title: "Height / W",
                min: 0.5,
                max: 2,
                step: 0.01,
                defaultValue: BASE.layout.ratio,
            },
            corner: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: BASE.layout.corner,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: BASE.layout.fill,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: BASE.layout.shadow,
            },
        },
    },
    ring: {
        type: ControlType.Object,
        title: "Ring",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0.4,
                max: 3,
                step: 0.01,
                defaultValue: BASE.ring.radius,
            },
            depth: {
                type: ControlType.Number,
                title: "Push Back",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: BASE.ring.depth,
            },
            lens: {
                type: ControlType.Number,
                title: "Perspective",
                min: 1.2,
                max: 8,
                step: 0.1,
                defaultValue: BASE.ring.lens,
            },
            sideScale: {
                type: ControlType.Number,
                title: "Side Size",
                min: 0.1,
                max: 0.9,
                step: 0.01,
                defaultValue: BASE.ring.sideScale,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap To Main",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: BASE.ring.gap,
            },
            slots: {
                type: ControlType.Number,
                title: "Min Slots",
                min: 6,
                max: 30,
                step: 1,
                displayStepper: true,
                defaultValue: BASE.ring.slots,
            },
            fadeFrom: {
                type: ControlType.Number,
                title: "Hide After",
                min: 45,
                max: 175,
                step: 1,
                unit: "°",
                defaultValue: BASE.ring.fadeFrom,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag Speed",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: BASE.motion.dragSpeed,
            },
            momentum: {
                type: ControlType.Number,
                title: "Momentum",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: BASE.motion.momentum,
            },
            follow: {
                type: ControlType.Number,
                title: "Drag Glide",
                min: 8,
                max: 60,
                step: 1,
                defaultValue: BASE.motion.follow,
            },
            stiffness: {
                type: ControlType.Number,
                title: "Snap Force",
                min: 30,
                max: 400,
                step: 5,
                defaultValue: BASE.motion.stiffness,
            },
            damping: {
                type: ControlType.Number,
                title: "Snap Damping",
                min: 0.5,
                max: 1.4,
                step: 0.01,
                defaultValue: BASE.motion.damping,
            },
            wheel: {
                type: ControlType.Enum,
                title: "Wheel",
                options: ["both", "horizontal", "off"],
                optionTitles: ["Both Axes", "Horizontal", "Off"],
                defaultValue: BASE.motion.wheel,
            },
            wheelSpeed: {
                type: ControlType.Number,
                title: "Wheel Speed",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: BASE.motion.wheelSpeed,
                hidden: (p: any) => p.wheel === "off",
            },
            keys: {
                type: ControlType.Boolean,
                title: "Arrow Keys",
                defaultValue: BASE.motion.keys,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: BASE.motion.autoplay,
            },
            interval: {
                type: ControlType.Number,
                title: "Every",
                min: 1,
                max: 15,
                step: 0.5,
                unit: "s",
                defaultValue: BASE.motion.interval,
                hidden: (p: any) => !p.autoplay,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["forward", "backward"],
                optionTitles: ["Forward", "Backward"],
                displaySegmentedControl: true,
                defaultValue: BASE.motion.direction,
                hidden: (p: any) => !p.autoplay,
            },
            videoPlay: {
                type: ControlType.Boolean,
                title: "Play Videos",
                defaultValue: BASE.motion.videoPlay,
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            blur: {
                type: ControlType.Number,
                title: "Side Blur",
                min: 0,
                max: 16,
                step: 0.5,
                unit: "px",
                defaultValue: BASE.effects.blur,
            },
            sideFade: {
                type: ControlType.Number,
                title: "Side Fade",
                min: 0,
                max: 0.9,
                step: 0.05,
                defaultValue: BASE.effects.sideFade,
            },
            shade: {
                type: ControlType.Number,
                title: "Turn Shade",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: BASE.effects.shade,
            },
            tilt: {
                type: ControlType.Boolean,
                title: "3D Tilt",
                defaultValue: BASE.effects.tilt,
            },
            flingTilt: {
                type: ControlType.Number,
                title: "Motion Tilt",
                min: 0,
                max: 1.5,
                step: 0.05,
                defaultValue: BASE.effects.flingTilt,
                hidden: (p: any) => !p.tilt,
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Title",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: BASE.caption.show,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: BASE.caption.align,
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: BASE.caption.inset,
            },
            titleFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: BASE.caption.titleFont,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: BASE.caption.titleColor,
            },
            shade: {
                type: ControlType.Number,
                title: "Bottom Shade",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: BASE.caption.shade,
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
})
