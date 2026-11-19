import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
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


type CueStyle = "none" | "corners" | "rule" | "rails" | "outline" | "caret"
type TextSide = "left" | "right" | "split"
type TextAnchor = "top" | "center" | "bottom"
type TextHug = "inner" | "outer"

interface Piece {
    kind?: "image" | "video"
    image?: { src?: string } | string
    imageUrl?: string
    video?: string
    videoUrl?: string
    title?: string
    caption?: string
    link?: string
}

interface CampanileProps {
    slides: Piece[]
    cardWidth: number
    cardRatio: number
    slotGap: number
    sideSlots: number
    stepScale: number
    stepFalloff: number
    sideFade: number
    sideBlur: number
    cornerRadius: number
    stagePad: number
    surface: string
    cueStyle: CueStyle
    cueTint: string
    cueSize: number
    cueOffset: number
    cueWeight: number
    cueFade: number
    labelOn: boolean
    textSide: TextSide
    textAnchor: TextAnchor
    textHug: TextHug
    textWidth: number
    counterOn: boolean
    labelGap: number
    titleFont: React.CSSProperties
    titleTint: string
    metaFont: React.CSSProperties
    metaTint: string
    wheelMode: "off" | "vertical" | "any"
    wheelStep: number
    dragOn: boolean
    throwCutoff: number
    dragSpan: number
    snapRate: number
    cycleOn: boolean
    cycleWait: number
    tickOn: boolean
    tickLevel: number
    tickTone: number
    clipPlay: boolean
    hoverFx: boolean
    fxMode: "ripple" | "lens" | "swirl"
    fxPower: number
    fxReach: number
    fxSplit: number
    style?: React.CSSProperties
}

const LENS_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
}`

const LENS_FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform vec2 uBox;
uniform vec2 uMedia;
uniform float uPower;
uniform float uTime;
uniform float uReach;
uniform float uSplit;
uniform float uMode;

vec2 cover(vec2 p) {
    float boxR = uBox.x / uBox.y;
    float medR = uMedia.x / uMedia.y;
    vec2 s = vec2(1.0);
    if (medR > boxR) s.x = boxR / medR; else s.y = medR / boxR;
    return clamp((p - 0.5) * s + 0.5, 0.0, 1.0);
}

void main() {
    float aspect = uBox.x / uBox.y;
    vec2 d = vUv - uMouse;
    d.x *= aspect;
    float dist = length(d);
    float fall = 1.0 - smoothstep(0.0, uReach, dist);
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);

    vec2 shift;
    if (uMode < 0.5) {
        float wave = sin(dist * 46.0 - uTime * 5.5);
        shift = dir * wave * 0.02 * fall;
    } else if (uMode < 1.5) {
        shift = -dir * 0.1 * fall * fall;
    } else {
        float turn = fall * fall * 1.6;
        float c = cos(turn);
        float s = sin(turn);
        vec2 spun = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
        shift = spun - d;
    }
    shift *= uPower;
    shift.x /= aspect;

    vec2 base = vUv + shift;
    vec2 tear = vec2(dir.x / aspect, dir.y) * uSplit * 0.014 * fall * uPower;
    float r = texture2D(uTex, cover(base + tear)).r;
    float g = texture2D(uTex, cover(base)).g;
    float b = texture2D(uTex, cover(base - tear)).b;
    vec3 col = vec3(r, g, b) + fall * uPower * 0.05;
    gl_FragColor = vec4(col, 1.0);
}`

interface LensPointer {
    inside: boolean
    x: number
    y: number
}

// Live-only WebGL hover layer that sits over the centre card
function LensLayer(props: {
    w: number
    h: number
    radius: number
    art: string
    clipFor: () => HTMLVideoElement | null
    pointer: React.MutableRefObject<LensPointer>
    permit: React.MutableRefObject<boolean>
    settled: () => boolean
    tune: React.MutableRefObject<CampanileProps>
    wakeOut: React.MutableRefObject<() => void>
}) {
    const {
        w,
        h,
        radius,
        art,
        clipFor,
        pointer,
        permit,
        settled,
        tune,
        wakeOut,
    } = props
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const size = useRef({ w, h })
    size.current = { w, h }
    const fns = useRef({ clipFor, settled })
    fns.current = { clipFor, settled }

    const kit = useRef<{
        gl: WebGLRenderingContext | null
        tex: WebGLTexture | null
        u: Record<string, WebGLUniformLocation | null>
    }>({ gl: null, tex: null, u: {} })
    const still = useRef<{
        img: HTMLImageElement | null
        ready: boolean
        sent: boolean
    }>({ img: null, ready: false, sent: false })
    const state = useRef({
        power: 0,
        mx: 0.5,
        my: 0.5,
        raf: 0,
        start: 0,
    })

    // GL setup once
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        let gl: WebGLRenderingContext | null = null
        try {
            gl = canvas.getContext("webgl", {
                alpha: true,
                antialias: false,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false,
            }) as WebGLRenderingContext | null
        } catch {}
        if (!gl) return

        const build = (kind: number, src: string) => {
            const sh = gl!.createShader(kind)
            if (!sh) return null
            gl!.shaderSource(sh, src)
            gl!.compileShader(sh)
            if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) return null
            return sh
        }
        const vs = build(gl.VERTEX_SHADER, LENS_VERT)
        const fs = build(gl.FRAGMENT_SHADER, LENS_FRAG)
        if (!vs || !fs) return
        const prog = gl.createProgram()
        if (!prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const tex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        const u: Record<string, WebGLUniformLocation | null> = {}
        ;[
            "uTex",
            "uMouse",
            "uBox",
            "uMedia",
            "uPower",
            "uTime",
            "uReach",
            "uSplit",
            "uMode",
        ].forEach((name) => (u[name] = gl!.getUniformLocation(prog, name)))
        gl.uniform1i(u.uTex, 0)

        kit.current = { gl, tex, u }
        still.current.sent = false

        return () => {
            const st = state.current
            if (st.raf) cancelAnimationFrame(st.raf)
            st.raf = 0
            try {
                gl!.deleteTexture(tex)
                gl!.deleteBuffer(buf)
                gl!.deleteProgram(prog)
                gl!.getExtension("WEBGL_lose_context")?.loseContext()
            } catch {}
            kit.current = { gl: null, tex: null, u: {} }
        }
    }, [])

    // Load the focused card's still (image or video poster)
    useEffect(() => {
        still.current = { img: null, ready: false, sent: false }
        if (!art) return
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            if (still.current.img === img) still.current.ready = true
        }
        img.src = art
        still.current.img = img
        return () => {
            img.onload = null
        }
    }, [art])

    const tick = useCallback((stamp: number) => {
        const st = state.current
        st.raf = 0
        const canvas = canvasRef.current
        const { gl, tex, u } = kit.current

        const sleep = () => {
            st.power = 0
            if (canvas) canvas.style.opacity = "0"
        }

        if (!permit.current || !canvas || !gl) {
            sleep()
            return
        }

        const want = pointer.current.inside && fns.current.settled() ? 1 : 0
        st.power += (want - st.power) * 0.1
        st.mx += (pointer.current.x - st.mx) * 0.16
        st.my += (pointer.current.y - st.my) * 0.16
        if (!st.start) st.start = stamp

        // Pick a readable source: live video frame, else the still
        let source: TexImageSource | null = null
        let mw = 1
        let mh = 1
        let isClip = false
        const clip = fns.current.clipFor()
        if (clip) {
            if (
                clip.dataset.lensBlocked !== "1" &&
                clip.readyState >= 2 &&
                clip.videoWidth
            ) {
                source = clip
                mw = clip.videoWidth
                mh = clip.videoHeight
                isClip = true
            }
        } else if (still.current.ready && still.current.img) {
            source = still.current.img
            mw = still.current.img.naturalWidth || 1
            mh = still.current.img.naturalHeight || 1
        }

        if (!source) {
            sleep()
            return
        }

        gl.bindTexture(gl.TEXTURE_2D, tex)
        if (isClip || !still.current.sent) {
            try {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    source
                )
                if (!isClip) still.current.sent = true
            } catch {
                if (isClip && clip) clip.dataset.lensBlocked = "1"
                else still.current.ready = false
                sleep()
                return
            }
        }

        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const bw = Math.max(1, Math.round(size.current.w * dpr))
        const bh = Math.max(1, Math.round(size.current.h * dpr))
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw
            canvas.height = bh
        }
        gl.viewport(0, 0, bw, bh)

        const p = tune.current
        const mode = p.fxMode === "lens" ? 1 : p.fxMode === "swirl" ? 2 : 0
        gl.uniform2f(u.uMouse, st.mx, st.my)
        gl.uniform2f(u.uBox, size.current.w, size.current.h)
        gl.uniform2f(u.uMedia, mw, mh)
        gl.uniform1f(u.uPower, st.power * p.fxPower)
        gl.uniform1f(u.uTime, (stamp - st.start) / 1000)
        gl.uniform1f(u.uReach, p.fxReach)
        gl.uniform1f(u.uSplit, p.fxSplit)
        gl.uniform1f(u.uMode, mode)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        canvas.style.opacity = String(Math.min(1, st.power * 3))

        if (want === 0 && st.power < 0.004) {
            sleep()
            return
        }
        st.raf = requestAnimationFrame(tick)
    }, [])

    useEffect(() => {
        wakeOut.current = () => {
            const st = state.current
            if (st.raf || !permit.current) return
            st.raf = requestAnimationFrame(tick)
        }
        return () => {
            wakeOut.current = () => {}
            const st = state.current
            if (st.raf) cancelAnimationFrame(st.raf)
            st.raf = 0
        }
    }, [tick])

    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: w,
                height: h,
                transform: "translate(-50%, -50%)",
                borderRadius: radius,
                overflow: "hidden",
                zIndex: 450,
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    opacity: 0,
                }}
            />
        </div>
    )
}

const CORNERS = ["tl", "tr", "bl", "br"] as const

function ringIndex(value: number, span: number) {
    return ((value % span) + span) % span
}

function resolveArt(piece?: Piece): string {
    if (!piece) return ""
    // An uploaded image wins over the URL field
    const dropped = piece.image
    const uploaded =
        typeof dropped === "string"
            ? dropped.trim()
            : dropped && typeof dropped.src === "string"
              ? dropped.src
              : ""
    if (uploaded) return uploaded
    return typeof piece.imageUrl === "string" ? piece.imageUrl.trim() : ""
}

function resolveClip(piece?: Piece): string {
    if (!piece || piece.kind !== "video") return ""
    const typed =
        typeof piece.videoUrl === "string" ? piece.videoUrl.trim() : ""
    const uploaded = typeof piece.video === "string" ? piece.video.trim() : ""
    return uploaded || typed
}

const FILL: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
}

function indexTag(spot: number, span: number): string {
    const two = (v: number) => (v < 10 ? "0" + v : String(v))
    return two(spot + 1) + " / " + two(span)
}

function anchorFlex(anchor: TextAnchor) {
    if (anchor === "top") return "flex-start"
    if (anchor === "bottom") return "flex-end"
    return "center"
}

// Which side each text piece lives on
function sideOf(
    part: "counter" | "title" | "caption",
    side: TextSide
): "left" | "right" {
    // Split: counter + title on the left, caption on the right
    if (side === "split") return part === "caption" ? "right" : "left"
    return side
}

function alignFor(column: "left" | "right", hug: TextHug) {
    if (hug === "inner") return column === "left" ? "right" : "left"
    return column === "left" ? "left" : "right"
}

function makeLayout(cfg: {
    w: number
    h: number
    gap: number
    near: number
    decay: number
    fade: number
    blur: number
    reach: number
}) {
    const decay = Math.min(0.95, Math.max(0.4, cfg.decay))
    const slope = Math.log(decay)
    const firstHop = (cfg.h * (1 + cfg.near)) / 2 + cfg.gap

    return function at(offset: number) {
        const dist = Math.abs(offset)
        const way = offset < 0 ? -1 : 1
        let ratio: number
        let shift: number

        if (dist <= 1) {
            ratio = 1 + (cfg.near - 1) * dist
            shift = firstHop * dist
        } else {
            const faded = Math.pow(decay, dist - 1)
            ratio = cfg.near * faded
            shift =
                firstHop +
                cfg.gap * (dist - 1) +
                (cfg.h * cfg.near * (faded - 1)) / slope
        }

        let alpha: number
        if (dist > cfg.reach + 0.5) alpha = 0
        else if (dist <= 1) alpha = 1 + (cfg.fade - 1) * dist
        else alpha = cfg.fade * Math.pow(0.7, dist - 1)

        const haze = Math.min(
            cfg.blur,
            (cfg.blur * dist) / Math.max(1, cfg.reach)
        )

        return {
            w: cfg.w * ratio,
            h: cfg.h * ratio,
            y: (Number.isFinite(shift) ? shift : firstHop * dist) * way,
            alpha: Math.max(0, Math.min(1, alpha)),
            haze,
            depth: 400 - Math.round(dist * 12),
        }
    }
}

function FocusCue(props: {
    kind: CueStyle
    size: number
    offset: number
    weight: number
    tint: string
}) {
    const { kind, size, offset, weight, tint } = props

    if (kind === "outline") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: -offset,
                    right: -offset,
                    bottom: -offset,
                    left: -offset,
                    border: weight + "px solid " + tint,
                    borderRadius: size,
                }}
            />
        )
    }

    if (kind === "rails") {
        return (
            <>
                <div
                    style={{
                        position: "absolute",
                        left: -offset,
                        top: -size,
                        bottom: -size,
                        width: weight,
                        background: tint,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: -offset,
                        top: -size,
                        bottom: -size,
                        width: weight,
                        background: tint,
                    }}
                />
            </>
        )
    }

    if (kind === "rule") {
        return (
            <>
                <div
                    style={{
                        position: "absolute",
                        left: -offset,
                        top: 0,
                        bottom: 0,
                        width: weight,
                        background: tint,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: -offset - size,
                        top: "50%",
                        marginTop: -weight / 2,
                        height: weight,
                        width: size,
                        background: tint,
                    }}
                />
            </>
        )
    }

    if (kind === "caret") {
        return (
            <div
                style={{
                    position: "absolute",
                    left: -offset - size,
                    top: "50%",
                    marginTop: -size / 2,
                    width: 0,
                    height: 0,
                    borderTop: size / 2 + "px solid transparent",
                    borderBottom: size / 2 + "px solid transparent",
                    borderLeft: size + "px solid " + tint,
                }}
            />
        )
    }

    if (kind === "corners") {
        return (
            <>
                {CORNERS.map((corner) => {
                    const upper = corner === "tl" || corner === "tr"
                    const leading = corner === "tl" || corner === "bl"
                    return (
                        <div
                            key={corner}
                            style={{
                                position: "absolute",
                                width: size,
                                height: size,
                                top: upper ? -offset : undefined,
                                bottom: upper ? undefined : -offset,
                                left: leading ? -offset : undefined,
                                right: leading ? undefined : -offset,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: leading ? 0 : undefined,
                                    right: leading ? undefined : 0,
                                    width: weight,
                                    height: size,
                                    background: tint,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: upper ? 0 : undefined,
                                    bottom: upper ? undefined : 0,
                                    height: weight,
                                    width: size,
                                    background: tint,
                                }}
                            />
                        </div>
                    )
                })}
            </>
        )
    }

    return null
}

function StillColumn(props: CampanileProps) {
    const {
        slides,
        cardWidth,
        cardRatio,
        slotGap,
        sideSlots,
        stepScale,
        stepFalloff,
        sideFade,
        cornerRadius,
        stagePad,
        surface,
        cueStyle,
        cueTint,
        cueSize,
        cueOffset,
        cueWeight,
        labelOn,
        textSide,
        textAnchor,
        textHug,
        textWidth,
        counterOn,
        labelGap,
        titleFont,
        titleTint,
        metaFont,
        metaTint,
        style,
    } = props

    const deck = slides && slides.length ? slides : []
    const span = deck.length
    const cardHeight = cardWidth / Math.max(0.2, cardRatio)
    const at = makeLayout({
        w: cardWidth,
        h: cardHeight,
        gap: slotGap,
        near: stepScale,
        decay: stepFalloff,
        fade: sideFade,
        blur: 0,
        reach: sideSlots,
    })

    const cells: number[] = []
    for (let k = -sideSlots; k <= sideSlots; k++) cells.push(k)

    const lead = deck[0]

    const buildColumn = (column: "left" | "right") => {
        if (!labelOn) return null
        const parts: React.ReactNode[] = []
        if (counterOn && span && sideOf("counter", textSide) === column) {
            parts.push(
                <div key="n" style={{ ...metaFont, color: metaTint }}>
                    {indexTag(0, span)}
                </div>
            )
        }
        if (sideOf("title", textSide) === column) {
            parts.push(
                <div key="t" style={{ ...titleFont, color: titleTint }}>
                    {lead?.title || ""}
                </div>
            )
        }
        if (sideOf("caption", textSide) === column) {
            parts.push(
                <div key="c" style={{ ...metaFont, color: metaTint }}>
                    {lead?.caption || ""}
                </div>
            )
        }
        if (!parts.length) return null
        const align = alignFor(column, textHug)
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: textWidth,
                    right: column === "left" ? "100%" : undefined,
                    left: column === "right" ? "100%" : undefined,
                    marginRight: column === "left" ? labelGap : undefined,
                    marginLeft: column === "right" ? labelGap : undefined,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: anchorFlex(textAnchor),
                    alignItems: align === "left" ? "flex-start" : "flex-end",
                    textAlign: align,
                    gap: 6,
                }}
            >
                {parts}
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: stagePad,
                background: surface,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                }}
            >
                {cells.map((k) => {
                    const box = at(k)
                    if (box.alpha <= 0) return null
                    const entry = deck[ringIndex(k, Math.max(1, span))]
                    const art = resolveArt(entry)
                    const clip = resolveClip(entry)
                    return (
                        <div
                            key={k}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: box.w,
                                height: box.h,
                                marginLeft: -box.w / 2,
                                marginTop: box.y - box.h / 2,
                                opacity: box.alpha,
                                zIndex: box.depth,
                                borderRadius: cornerRadius,
                                overflow: "hidden",
                                background: "rgba(128,128,128,0.16)",
                            }}
                        >
                            {art ? (
                                <img
                                    src={art}
                                    alt=""
                                    draggable={false}
                                    style={FILL}
                                />
                            ) : clip ? (
                                <video
                                    src={clip}
                                    muted
                                    playsInline
                                    autoPlay={false}
                                    preload="metadata"
                                    style={FILL}
                                />
                            ) : null}
                        </div>
                    )
                })}

                {cueStyle !== "none" ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: cardWidth,
                            height: cardHeight,
                            marginLeft: -cardWidth / 2,
                            marginTop: -cardHeight / 2,
                            zIndex: 500,
                        }}
                    >
                        <FocusCue
                            kind={cueStyle}
                            size={cueSize}
                            offset={cueOffset}
                            weight={cueWeight}
                            tint={cueTint}
                        />
                    </div>
                ) : null}

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: cardWidth,
                        height: cardHeight,
                        marginLeft: -cardWidth / 2,
                        marginTop: -cardHeight / 2,
                        zIndex: 600,
                    }}
                >
                    {buildColumn("left")}
                    {buildColumn("right")}
                </div>
            </div>
        </div>
    )
}

function LiveColumn(props: CampanileProps) {
    const {
        slides,
        cardWidth,
        cardRatio,
        sideSlots,
        cornerRadius,
        stagePad,
        surface,
        cueStyle,
        cueTint,
        cueSize,
        cueOffset,
        cueWeight,
        labelOn,
        textSide,
        textAnchor,
        textHug,
        textWidth,
        counterOn,
        labelGap,
        titleFont,
        titleTint,
        metaFont,
        metaTint,
        style,
    } = props

    const scope = useId().replace(/[^a-zA-Z0-9]/g, "")
    const deck = useMemo(
        () => (slides && slides.length ? slides : []),
        [slides]
    )
    const span = deck.length

    const live = useRef(props)
    live.current = props

    const shellRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const cueRef = useRef<HTMLDivElement | null>(null)
    const gaugeRef = useRef<() => void>(() => {})
    const cellRefs = useRef(new Map<number, HTMLDivElement>())
    const clipRefs = useRef(new Map<number, HTMLVideoElement>())
    const lensPointer = useRef<LensPointer>({ inside: false, x: 0.5, y: 0.5 })
    const lensWake = useRef<() => void>(() => {})

    const [onScreen, setOnScreen] = useState(false)
    const [calm, setCalm] = useState(false)
    const [focus, setFocus] = useState(0)
    const focusRef = useRef(0)
    const [fit, setFit] = useState(1)
    const fitRef = useRef(1)

    const drive = useRef({
        pos: 0,
        vel: 0,
        aim: 0 as number | null,
        stiff: 200,
        held: false,
        moved: false,
        grabY: 0,
        grabPos: 0,
        trail: [] as Array<{ y: number; t: number }>,
        clock: 0,
        hover: false,
    })

    const allowed = useRef(false)
    const stilled = useRef(false)
    const beat = useRef(0)
    const lastKnock = useRef(0)
    const audio = useRef<{
        ctx: AudioContext | null
        grain: AudioBuffer | null
    }>({ ctx: null, grain: null })

    const readLayout = useCallback(() => {
        const p = live.current
        const scale = fitRef.current
        const base = p.cardWidth * scale
        return {
            at: makeLayout({
                w: base,
                h: base / Math.max(0.2, p.cardRatio),
                gap: p.slotGap * scale,
                near: p.stepScale,
                decay: p.stepFalloff,
                fade: p.sideFade,
                blur: p.sideBlur,
                reach: p.sideSlots,
            }),
            base,
        }
    }, [])

    const apply = useCallback(() => {
        const { at } = readLayout()
        const pos = drive.current.pos
        cellRefs.current.forEach((node, index) => {
            const box = at(index - pos)
            node.style.width = box.w + "px"
            node.style.height = box.h + "px"
            node.style.opacity = String(box.alpha)
            node.style.zIndex = String(box.depth)
            node.style.filter =
                box.haze > 0.05 ? "blur(" + box.haze + "px)" : "none"
            node.style.transform =
                "translate3d(0, " + box.y + "px, 0) translate(-50%, -50%)"
            node.style.visibility = box.alpha <= 0.001 ? "hidden" : "visible"
        })

        const cue = cueRef.current
        if (cue) {
            const off = Math.abs(pos - Math.round(pos))
            const give = live.current.cueFade
            cue.style.transform =
                "translate(-50%, -50%) scale(" + (1 - off * 0.3 * give) + ")"
            cue.style.opacity = String(1 - off * 0.9 * give)
        }
    }, [readLayout])

    const armAudio = useCallback(() => {
        if (!live.current.tickOn || audio.current.ctx) return
        try {
            const Maker =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (!Maker) return
            const ctx: AudioContext = new Maker()
            const count = Math.floor(ctx.sampleRate * 0.09)
            const grain = ctx.createBuffer(1, count, ctx.sampleRate)
            const wave = grain.getChannelData(0)
            for (let i = 0; i < count; i++) {
                wave[i] = (Math.random() * 2 - 1) * (1 - i / count)
            }
            audio.current.ctx = ctx
            audio.current.grain = grain
            if (ctx.state === "suspended") ctx.resume().catch(() => {})
        } catch {}
    }, [])

    const knock = useCallback(() => {
        const p = live.current
        if (!p.tickOn) return
        const ctx = audio.current.ctx
        const grain = audio.current.grain
        if (!ctx || !grain || ctx.state !== "running") return
        const now = ctx.currentTime
        if (now - lastKnock.current < 0.03) return
        lastKnock.current = now
        try {
            const source = ctx.createBufferSource()
            source.buffer = grain
            const shape = ctx.createBiquadFilter()
            shape.type = "bandpass"
            shape.frequency.value = p.tickTone
            shape.Q.value = 4.5
            const level = ctx.createGain()
            level.gain.setValueAtTime(Math.max(0.0001, p.tickLevel), now)
            level.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
            source.connect(shape)
            shape.connect(level)
            level.connect(ctx.destination)
            source.start(now)
            source.stop(now + 0.07)
        } catch {}
    }, [])

    const halt = useCallback(() => {
        if (beat.current) cancelAnimationFrame(beat.current)
        beat.current = 0
    }, [])

    const frame = useCallback(
        (stamp: number) => {
            beat.current = 0
            const m = drive.current

            if (!allowed.current) {
                m.vel = 0
                m.held = false
                m.trail.length = 0
                m.aim = Math.round(m.pos)
                m.pos = m.aim
                apply()
                return
            }

            const dt = m.clock
                ? Math.min(0.05, (stamp - m.clock) / 1000)
                : 1 / 60
            m.clock = stamp

            if (!m.held) {
                if (stilled.current) {
                    m.pos = m.aim === null ? Math.round(m.pos) : m.aim
                    m.aim = m.pos
                    m.vel = 0
                } else if (m.aim === null) {
                    m.vel *= Math.pow(0.955, dt * 60)
                    m.pos += m.vel * dt
                    if (Math.abs(m.vel) < 0.75) {
                        m.aim = Math.round(m.pos + m.vel * 0.2)
                        m.stiff = live.current.snapRate * 24 + 80
                    }
                } else {
                    const brake = 2 * Math.sqrt(m.stiff)
                    const force = -m.stiff * (m.pos - m.aim) - brake * m.vel
                    m.vel += force * dt
                    m.pos += m.vel * dt
                }
            }

            const landed = Math.round(m.pos)
            if (landed !== focusRef.current) {
                focusRef.current = landed
                setFocus(landed)
                knock()
            }

            const done =
                !m.held &&
                m.aim !== null &&
                Math.abs(m.vel) < 0.02 &&
                Math.abs(m.pos - m.aim) < 0.0015

            if (done) {
                m.pos = m.aim as number
                m.vel = 0
                m.clock = 0
                apply()
                lensWake.current()
                return
            }

            apply()
            beat.current = requestAnimationFrame(frame)
        },
        [apply, knock]
    )

    const wake = useCallback(() => {
        if (beat.current || !allowed.current) return
        drive.current.clock = 0
        beat.current = requestAnimationFrame(frame)
    }, [frame])

    const glideTo = useCallback(
        (target: number, brisk: boolean) => {
            const m = drive.current
            m.aim = target
            m.stiff = brisk ? live.current.snapRate * 40 + 200 : 120
            wake()
        },
        [wake]
    )

    useEffect(() => {
        const node = shellRef.current
        if (!node) return

        let seen = true
        let open = true
        let quiet = false

        const query =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        quiet = !!query?.matches

        const review = () => {
            stilled.current = quiet
            const ok = seen && open
            allowed.current = ok
            setOnScreen(ok)
            setCalm(quiet)
            if (!ok) {
                halt()
                const m = drive.current
                m.vel = 0
                m.held = false
                m.trail.length = 0
                m.aim = Math.round(m.pos)
                m.pos = m.aim
                focusRef.current = m.pos
                setFocus(m.pos)
                apply()
            } else if (quiet) {
                const m = drive.current
                m.vel = 0
                m.pos = m.aim === null ? Math.round(m.pos) : m.aim
                m.aim = m.pos
                apply()
            } else {
                wake()
            }
        }

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            seen = false
            watcher = new IntersectionObserver(
                (entries) => {
                    seen = entries.some((entry) => entry.isIntersecting)
                    review()
                },
                { threshold: 0.01 }
            )
            watcher.observe(node)
        }

        const onTab = () => {
            open = document.visibilityState !== "hidden"
            review()
        }
        const onQuiet = (e: MediaQueryListEvent) => {
            quiet = e.matches
            review()
        }

        document.addEventListener("visibilitychange", onTab)
        query?.addEventListener?.("change", onQuiet)
        review()

        return () => {
            watcher?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            query?.removeEventListener?.("change", onQuiet)
            halt()
            allowed.current = false
        }
    }, [halt, apply, wake])

    useEffect(() => {
        const node = stageRef.current
        if (!node) return

        const gauge = () => {
            const p = live.current
            const boxW = node.clientWidth
            const boxH = node.clientHeight
            if (!boxW || !boxH) return
            const tall = p.cardWidth / Math.max(0.2, p.cardRatio)
            const flank = p.labelOn ? 2 * (p.textWidth + p.labelGap) : 0
            const next = Math.max(
                0.2,
                Math.min(1, (boxW - flank) / p.cardWidth, boxH / tall)
            )
            if (Math.abs(next - fitRef.current) > 0.002) {
                fitRef.current = next
                setFit(next)
                apply()
            }
        }

        gaugeRef.current = gauge
        gauge()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", gauge)
            return () => window.removeEventListener("resize", gauge)
        }
        const sizer = new ResizeObserver(gauge)
        sizer.observe(node)
        return () => sizer.disconnect()
    }, [apply])

    useLayoutEffect(() => {
        gaugeRef.current()
        apply()
    })

    useEffect(() => {
        const node = stageRef.current
        if (!node) return
        let pooled = 0
        let thrown = false
        let cooldown = 0

        const onWheel = (e: WheelEvent) => {
            const p = live.current
            if (p.wheelMode === "off" || !allowed.current || span < 2) return

            const boost = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
            const dx = e.deltaX * boost
            const dy = e.deltaY * boost

            let push: number
            if (p.wheelMode === "vertical") {
                if (Math.abs(dy) < 1) return
                push = dy
            } else {
                push = Math.abs(dx) > Math.abs(dy) ? dx : dy
            }
            if (!push) return
            e.preventDefault()
            armAudio()

            if (Math.abs(push) >= p.throwCutoff) {
                thrown = true
                window.clearTimeout(cooldown)
                cooldown = window.setTimeout(() => {
                    thrown = false
                    pooled = 0
                }, 320)
            }

            const m = drive.current
            if (thrown) {
                m.aim = null
                m.vel = Math.max(-26, Math.min(26, m.vel + push * 0.06))
                wake()
            } else {
                pooled += push
                if (Math.abs(pooled) >= p.wheelStep) {
                    const way = pooled > 0 ? 1 : -1
                    pooled -= way * p.wheelStep
                    const from = m.aim === null ? Math.round(m.pos) : m.aim
                    glideTo(from + way, true)
                }
            }
        }

        node.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            node.removeEventListener("wheel", onWheel)
            window.clearTimeout(cooldown)
        }
    }, [wake, glideTo, armAudio, span])

    const onDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            if (!allowed.current || span < 2) return
            armAudio()
            const m = drive.current
            m.held = true
            m.moved = false
            m.grabY = e.clientY
            m.grabPos = m.pos
            m.vel = 0
            m.aim = null
            m.trail = [{ y: e.clientY, t: e.timeStamp }]
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {}
            wake()
        },
        [wake, armAudio, span]
    )

    const onMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const m = drive.current
            if (!m.held || !live.current.dragOn) return
            const dy = e.clientY - m.grabY
            if (!m.moved && Math.abs(dy) > 4) m.moved = true
            const reach = Math.max(40, live.current.dragSpan * fitRef.current)
            m.pos = m.grabPos - dy / reach
            m.trail.push({ y: e.clientY, t: e.timeStamp })
            while (m.trail.length > 2 && e.timeStamp - m.trail[0].t > 110) {
                m.trail.shift()
            }
            wake()
        },
        [wake]
    )

    const onUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const m = drive.current
            if (!m.held) return
            m.held = false
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {}

            if (!m.moved) {
                const stage = stageRef.current
                if (stage) {
                    const rect = stage.getBoundingClientRect()
                    const relX = e.clientX - (rect.left + rect.width / 2)
                    const relY = e.clientY - (rect.top + rect.height / 2)
                    const { at } = readLayout()
                    const middle = Math.round(m.pos)
                    let pick: number | null = null
                    let closest = Infinity
                    for (
                        let s = middle - live.current.sideSlots;
                        s <= middle + live.current.sideSlots;
                        s++
                    ) {
                        const box = at(s - m.pos)
                        if (box.alpha <= 0.02) continue
                        if (Math.abs(relX) > box.w / 2 + 6) continue
                        const away = Math.abs(relY - box.y)
                        if (away <= box.h / 2 + 6 && away < closest) {
                            closest = away
                            pick = s
                        }
                    }
                    if (pick !== null && pick !== middle) {
                        glideTo(pick, false)
                        return
                    }
                    if (pick === middle) {
                        const href =
                            deck[ringIndex(middle, Math.max(1, span))]?.link
                        if (href) {
                            window.open(href, "_blank", "noopener,noreferrer")
                            return
                        }
                    }
                }
                m.aim = Math.round(m.pos)
                m.stiff = live.current.snapRate * 40 + 200
                wake()
                return
            }

            const trail = m.trail
            let hurl = 0
            if (trail.length >= 2) {
                const head = trail[0]
                const tail = trail[trail.length - 1]
                const gap = tail.t - head.t
                if (gap > 0) {
                    const reach = Math.max(
                        40,
                        live.current.dragSpan * fitRef.current
                    )
                    hurl = (-(tail.y - head.y) / reach) * (1000 / gap)
                }
            }
            m.trail.length = 0
            m.vel = Math.max(-26, Math.min(26, hurl))
            m.aim = Math.abs(m.vel) < 0.75 ? Math.round(m.pos) : null
            if (m.aim !== null) m.stiff = live.current.snapRate * 40 + 200
            wake()
        },
        [readLayout, wake, glideTo, deck, span]
    )

    const onKey = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (span < 2) return
            const m = drive.current
            const from = m.aim === null ? Math.round(m.pos) : m.aim
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                armAudio()
                glideTo(from + 1, true)
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault()
                armAudio()
                glideTo(from - 1, true)
            }
        },
        [glideTo, armAudio, span]
    )

    useEffect(() => {
        if (!props.cycleOn || span < 2) return
        const timer = window.setInterval(
            () => {
                const m = drive.current
                if (!allowed.current || m.held || m.hover) return
                const from = m.aim === null ? Math.round(m.pos) : m.aim
                glideTo(from + 1, true)
            },
            Math.max(800, props.cycleWait * 1000)
        )
        return () => window.clearInterval(timer)
    }, [props.cycleOn, props.cycleWait, glideTo, span])

    // Only the focused video plays, and only while the column is on screen
    useEffect(() => {
        clipRefs.current.forEach((node, index) => {
            const shouldPlay =
                onScreen && !calm && index === focus && live.current.clipPlay
            if (shouldPlay) {
                const run = node.play()
                if (run && typeof run.catch === "function") run.catch(() => {})
            } else if (!node.paused) {
                node.pause()
            }
        })
    })

    useEffect(() => {
        return () => {
            const ctx = audio.current.ctx
            audio.current.ctx = null
            audio.current.grain = null
            ctx?.close().catch(() => {})
        }
    }, [])

    if (!span) {
        return (
            <div
                ref={shellRef}
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: surface,
                    color: metaTint,
                    ...metaFont,
                }}
            >
                Add slides in the property panel
            </div>
        )
    }

    const cells: number[] = []
    for (let s = focus - sideSlots; s <= focus + sideSlots; s++) cells.push(s)

    const showing = deck[ringIndex(focus, span)]
    const liveW = cardWidth * fit
    const liveH = liveW / Math.max(0.2, cardRatio)

    const trackLens = (e: React.PointerEvent<HTMLDivElement>) => {
        const stage = stageRef.current
        if (!stage || !props.hoverFx) return
        const rect = stage.getBoundingClientRect()
        const w = live.current.cardWidth * fitRef.current
        const h = w / Math.max(0.2, live.current.cardRatio)
        const rx = e.clientX - (rect.left + rect.width / 2)
        const ry = e.clientY - (rect.top + rect.height / 2)
        const lens = lensPointer.current
        lens.inside =
            e.pointerType !== "touch" &&
            Math.abs(rx) <= w / 2 &&
            Math.abs(ry) <= h / 2
        lens.x = rx / w + 0.5
        lens.y = 0.5 - ry / h
        lensWake.current()
    }

    const buildColumn = (column: "left" | "right") => {
        if (!labelOn) return null
        const parts: React.ReactNode[] = []
        if (counterOn && sideOf("counter", textSide) === column) {
            parts.push(
                <div key="n" style={{ ...metaFont, color: metaTint }}>
                    {indexTag(ringIndex(focus, span), span)}
                </div>
            )
        }
        if (sideOf("title", textSide) === column) {
            parts.push(
                <div key="t" style={{ ...titleFont, color: titleTint }}>
                    {showing?.title || ""}
                </div>
            )
        }
        if (sideOf("caption", textSide) === column) {
            parts.push(
                <div key="c" style={{ ...metaFont, color: metaTint }}>
                    {showing?.caption || ""}
                </div>
            )
        }
        if (!parts.length) return null
        const align = alignFor(column, textHug)
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    width: textWidth,
                    right: column === "left" ? "100%" : undefined,
                    left: column === "right" ? "100%" : undefined,
                    marginRight: column === "left" ? labelGap : undefined,
                    marginLeft: column === "right" ? labelGap : undefined,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: anchorFlex(textAnchor),
                    pointerEvents: "none",
                }}
            >
                <div
                    key={column + focus}
                    className={
                        scope + (column === "left" ? "-from-l" : "-from-r")
                    }
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems:
                            align === "left" ? "flex-start" : "flex-end",
                        textAlign: align,
                    }}
                >
                    {parts}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={shellRef}
            role="region"
            aria-label="Image column"
            tabIndex={0}
            onKeyDown={onKey}
            onMouseEnter={() => {
                drive.current.hover = true
            }}
            onMouseLeave={() => {
                drive.current.hover = false
            }}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: stagePad,
                background: surface,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
                @keyframes ${scope}-slide-l {
                    from { opacity: 0; transform: translateX(-10px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes ${scope}-slide-r {
                    from { opacity: 0; transform: translateX(10px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .${scope}-from-l { animation: ${scope}-slide-l 360ms cubic-bezier(0.22,0.61,0.36,1) both; }
                .${scope}-from-r { animation: ${scope}-slide-r 360ms cubic-bezier(0.22,0.61,0.36,1) both; }
                .${scope}-cell img { -webkit-user-drag: none; }
                @media (prefers-reduced-motion: reduce) {
                    .${scope}-from-l, .${scope}-from-r { animation: none; }
                }
            `}</style>

            <div
                ref={stageRef}
                onPointerDown={onDown}
                onPointerMove={(e) => {
                    onMove(e)
                    trackLens(e)
                }}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onPointerLeave={() => {
                    lensPointer.current.inside = false
                    lensWake.current()
                }}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                    touchAction: "pan-x",
                    cursor: props.dragOn ? "grab" : "default",
                }}
            >
                {cells.map((index) => {
                    const entry = deck[ringIndex(index, span)]
                    const art = resolveArt(entry)
                    const clip = resolveClip(entry)
                    return (
                        <div
                            key={index}
                            className={scope + "-cell"}
                            ref={(node) => {
                                if (node) cellRefs.current.set(index, node)
                                else cellRefs.current.delete(index)
                            }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                borderRadius: cornerRadius,
                                overflow: "hidden",
                                background: "rgba(128,128,128,0.16)",
                                willChange: "transform, opacity, filter",
                                transformOrigin: "50% 50%",
                            }}
                        >
                            {clip ? (
                                <video
                                    ref={(node) => {
                                        if (node)
                                            clipRefs.current.set(index, node)
                                        else clipRefs.current.delete(index)
                                    }}
                                    src={clip}
                                    poster={art || undefined}
                                    crossOrigin={
                                        props.hoverFx ? "anonymous" : undefined
                                    }
                                    onError={(e) => {
                                        // Host without CORS: reload plainly, skip the effect
                                        const v = e.currentTarget
                                        if (v.hasAttribute("crossorigin")) {
                                            v.removeAttribute("crossorigin")
                                            v.dataset.lensBlocked = "1"
                                            v.load()
                                        }
                                    }}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    aria-label={entry?.title || ""}
                                    style={FILL}
                                />
                            ) : art ? (
                                <img
                                    src={art}
                                    alt={entry?.title || ""}
                                    draggable={false}
                                    style={FILL}
                                />
                            ) : null}
                        </div>
                    )
                })}

                {props.hoverFx && !calm ? (
                    <LensLayer
                        w={liveW}
                        h={liveH}
                        radius={cornerRadius}
                        art={resolveArt(showing)}
                        clipFor={() => clipRefs.current.get(focus) || null}
                        pointer={lensPointer}
                        permit={allowed}
                        settled={() => {
                            const m = drive.current
                            return (
                                !m.held &&
                                Math.abs(m.pos - Math.round(m.pos)) < 0.01
                            )
                        }}
                        tune={live}
                        wakeOut={lensWake}
                    />
                ) : null}

                {cueStyle !== "none" ? (
                    <div
                        ref={cueRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: liveW,
                            height: liveH,
                            transform: "translate(-50%, -50%)",
                            zIndex: 500,
                            pointerEvents: "none",
                        }}
                    >
                        <FocusCue
                            kind={cueStyle}
                            size={cueSize}
                            offset={cueOffset}
                            weight={cueWeight}
                            tint={cueTint}
                        />
                    </div>
                ) : null}

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: liveW,
                        height: liveH,
                        marginLeft: -liveW / 2,
                        marginTop: -liveH / 2,
                        zIndex: 600,
                        pointerEvents: "none",
                    }}
                >
                    {buildColumn("left")}
                    {buildColumn("right")}
                </div>
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
export default function Campanile(props: CampanileProps) {
    const frozen = useIsStaticRenderer()
    if (frozen) return <StillColumn {...props} />
    return <LiveColumn {...props} />
}

const shot = (id: string) =>
    "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=1200&q=80"

const SAMPLE_CLIP = "https://storage.googleapis.com/gtv-videos-bucket/sample/"

const starterSlides: Piece[] = [
    {
        kind: "image",
        imageUrl: shot("photo-1506905925346-21bda4d32df4"),
        title: "Above the Clouds",
        caption: "Ridge line at first light",
    },
    {
        kind: "video",
        videoUrl:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        imageUrl: shot("photo-1490750967868-88aa4486c946"),
        title: "Slow Bloom",
        caption: "A study in quiet motion",
    },
    {
        kind: "image",
        imageUrl: shot("photo-1470071459604-3b5ec3a7fe05"),
        title: "Mist Valley",
        caption: "Fog rolling over the pines",
    },
    {
        kind: "video",
        videoUrl: SAMPLE_CLIP + "ForBiggerEscapes.mp4",
        imageUrl: shot("photo-1507525428034-b723cf961d3e"),
        title: "Open Water",
        caption: "Weekend escapes by the coast",
    },
    {
        kind: "image",
        imageUrl: shot("photo-1501785888041-af3ef285b470"),
        title: "Still Lake",
        caption: "Reflections after the storm",
    },
    {
        kind: "video",
        videoUrl: SAMPLE_CLIP + "ForBiggerJoyrides.mp4",
        imageUrl: shot("photo-1469474968028-56623f02e42e"),
        title: "Long Road",
        caption: "Chasing the golden hour",
    },
    {
        kind: "image",
        imageUrl: shot("photo-1441974231531-c6227db76b6e"),
        title: "Forest Floor",
        caption: "Light through the canopy",
    },
    {
        kind: "video",
        videoUrl: SAMPLE_CLIP + "ForBiggerBlazes.mp4",
        imageUrl: shot("photo-1500530855697-b586d89ba3ee"),
        title: "Ember Hour",
        caption: "Warm tones as the day ends",
    },
].map((piece) => ({ image: "", video: "", link: "", videoUrl: "", ...piece }))

addPropertyControls(Campanile, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide",
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
                    type: ControlType.Image,
                    title: "Image / Poster",
                },
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
                    hidden: (p: Piece) => p.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    defaultValue: "",
                    hidden: (p: Piece) => p.kind !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Add a short caption",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: starterSlides,
    },
    clipPlay: {
        type: ControlType.Boolean,
        title: "Play Videos",
        defaultValue: true,
    },

    hoverFx: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
    },
    fxMode: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["ripple", "lens", "swirl"],
        optionTitles: ["Ripple", "Lens", "Swirl"],
        displaySegmentedControl: true,
        defaultValue: "ripple",
        hidden: (p: CampanileProps) => !p.hoverFx,
    },
    fxPower: {
        type: ControlType.Number,
        title: "Strength",
        min: 0.1,
        max: 2,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: CampanileProps) => !p.hoverFx,
    },
    fxReach: {
        type: ControlType.Number,
        title: "Radius",
        min: 0.1,
        max: 1,
        step: 0.01,
        defaultValue: 0.38,
        hidden: (p: CampanileProps) => !p.hoverFx,
    },
    fxSplit: {
        type: ControlType.Number,
        title: "RGB Split",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: CampanileProps) => !p.hoverFx,
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 120,
        max: 900,
        step: 10,
        unit: "px",
        defaultValue: 300,
    },
    cardRatio: {
        type: ControlType.Number,
        title: "Ratio W/H",
        min: 0.5,
        max: 2.5,
        step: 0.01,
        defaultValue: 1.33,
    },
    slotGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    sideSlots: {
        type: ControlType.Number,
        title: "Slots Above/Below",
        min: 1,
        max: 7,
        step: 1,
        defaultValue: 5,
    },
    stepScale: {
        type: ControlType.Number,
        title: "Neighbour Size",
        min: 0.05,
        max: 0.9,
        step: 0.01,
        defaultValue: 0.3,
    },
    stepFalloff: {
        type: ControlType.Number,
        title: "Falloff",
        min: 0.4,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.78,
    },
    sideFade: {
        type: ControlType.Number,
        title: "Side Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.7,
    },
    sideBlur: {
        type: ControlType.Number,
        title: "Side Blur",
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
        defaultValue: 6,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    stagePad: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 20,
    },
    surface: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },

    cueStyle: {
        type: ControlType.Enum,
        title: "Focus Cue",
        options: ["none", "corners", "rule", "rails", "outline", "caret"],
        optionTitles: [
            "None",
            "Corner Marks",
            "Side Rule",
            "Rails",
            "Outline",
            "Caret",
        ],
        defaultValue: "rule",
    },
    cueTint: {
        type: ControlType.Color,
        title: "Cue Color",
        defaultValue: "#111111",
        hidden: (p: CampanileProps) => p.cueStyle === "none",
    },
    cueSize: {
        type: ControlType.Number,
        title: "Cue Size",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 8,
        hidden: (p: CampanileProps) => p.cueStyle === "none",
    },
    cueOffset: {
        type: ControlType.Number,
        title: "Cue Offset",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 12,
        hidden: (p: CampanileProps) => p.cueStyle === "none",
    },
    cueWeight: {
        type: ControlType.Number,
        title: "Cue Weight",
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
        defaultValue: 1,
        hidden: (p: CampanileProps) => p.cueStyle === "none",
    },
    cueFade: {
        type: ControlType.Number,
        title: "Cue Reaction",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: CampanileProps) => p.cueStyle === "none",
    },

    labelOn: {
        type: ControlType.Boolean,
        title: "Text",
        defaultValue: true,
    },
    textSide: {
        type: ControlType.Enum,
        title: "Text Side",
        options: ["left", "right", "split"],
        optionTitles: ["Left", "Right", "Split"],
        displaySegmentedControl: true,
        defaultValue: "split",
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    textAnchor: {
        type: ControlType.Enum,
        title: "Text Anchor",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Middle", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    textHug: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["inner", "outer"],
        optionTitles: ["Hug Card", "Outer Edge"],
        displaySegmentedControl: true,
        defaultValue: "inner",
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    textWidth: {
        type: ControlType.Number,
        title: "Text Width",
        min: 60,
        max: 400,
        step: 5,
        unit: "px",
        defaultValue: 140,
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    counterOn: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Text Gap",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 32,
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 14,
            lineHeight: "1.4em",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
        },
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    titleTint: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#111111",
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 12,
            lineHeight: "1.5em",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
        },
        hidden: (p: CampanileProps) => !p.labelOn,
    },
    metaTint: {
        type: ControlType.Color,
        title: "Meta Color",
        defaultValue: "rgba(17,17,17,0.5)",
        hidden: (p: CampanileProps) => !p.labelOn,
    },

    wheelMode: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["off", "vertical", "any"],
        optionTitles: ["Off", "Vertical", "Any"],
        defaultValue: "vertical",
    },
    wheelStep: {
        type: ControlType.Number,
        title: "Step Travel",
        min: 20,
        max: 400,
        step: 5,
        unit: "px",
        defaultValue: 110,
        hidden: (p: CampanileProps) => p.wheelMode === "off",
    },
    throwCutoff: {
        type: ControlType.Number,
        title: "Throw At",
        min: 20,
        max: 300,
        step: 5,
        unit: "px",
        defaultValue: 70,
        hidden: (p: CampanileProps) => p.wheelMode === "off",
    },
    dragOn: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
    },
    dragSpan: {
        type: ControlType.Number,
        title: "Drag Per Card",
        min: 60,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 180,
        hidden: (p: CampanileProps) => !p.dragOn,
    },
    snapRate: {
        type: ControlType.Number,
        title: "Snap Speed",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 6,
    },
    cycleOn: {
        type: ControlType.Boolean,
        title: "Auto Advance",
        defaultValue: false,
    },
    cycleWait: {
        type: ControlType.Number,
        title: "Every",
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        defaultValue: 3.5,
        hidden: (p: CampanileProps) => !p.cycleOn,
    },

    tickOn: {
        type: ControlType.Boolean,
        title: "Click Sound",
        defaultValue: false,
    },
    tickLevel: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (p: CampanileProps) => !p.tickOn,
    },
    tickTone: {
        type: ControlType.Number,
        title: "Tone",
        min: 400,
        max: 5000,
        step: 50,
        unit: "Hz",
        defaultValue: 1800,
        hidden: (p: CampanileProps) => !p.tickOn,
    },
})
