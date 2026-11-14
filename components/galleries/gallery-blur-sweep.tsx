import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

// ---------- Types ----------

type Img = { src?: string; srcSet?: string; alt?: string }
type Tex = { tex: WebGLTexture; w: number; h: number }
type Easing = "easeInOut" | "easeOut" | "easeIn" | "linear"
type Style = "sweep" | "fade"
type Direction = "blTr" | "tlBr" | "brTl" | "trBl" | "lr" | "rl" | "bt" | "tb"
type Fit = "cover" | "contain"
type Align = "left" | "center" | "right"

interface DotsConfig {
    show: boolean
    align: Align
    size: number
    activeWidth: number
    gap: number
    offset: number
    color: string
    activeColor: string
}

interface Props {
    images?: Img[]
    interval?: number
    duration?: number
    easing?: Easing
    transition?: Style
    direction?: Direction
    softness?: number
    curve?: number
    blur?: number
    zoom?: number
    fit?: Fit
    focusX?: number
    focusY?: number
    background?: string
    autoplay?: boolean
    loop?: boolean
    pauseOnHover?: boolean
    clickToAdvance?: boolean
    startIndex?: number
    reducedMotion?: boolean
    radius?: number
    overlayColor?: string
    overlayOpacity?: number
    dots?: Partial<DotsConfig>
    style?: CSSProperties
}

type Anim = { from: number; to: number; start: number }

// ---------- Defaults ----------

const DEFAULT_IMAGES: Img[] = [
    {
        src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
        alt: "Mountains",
    },
    {
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
        alt: "Beach",
    },
    {
        src: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80",
        alt: "Desert",
    },
]

const DEFAULT_DOTS: DotsConfig = {
    show: false,
    align: "center",
    size: 8,
    activeWidth: 24,
    gap: 8,
    offset: 24,
    color: "rgba(255,255,255,0.4)",
    activeColor: "#FFFFFF",
}

const DEFAULT_W = 1200
const DEFAULT_H = 640

// ---------- Shaders ----------

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uRes;
uniform vec2 uFromSize;
uniform vec2 uToSize;
uniform float uProgress;
uniform float uBlur;
uniform float uSoft;
uniform float uCurve;
uniform float uZoom;
uniform float uMode;
uniform vec2 uDir;
uniform vec2 uFocus;
uniform float uFit;
uniform vec3 uBg;

vec2 mapUv(vec2 uv, vec2 img) {
  float rs = uRes.x / uRes.y;
  float ri = img.x / img.y;
  if (uFit < 0.5) {
    vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
    return uv * s + (1.0 - s) * uFocus;
  }
  vec2 s = rs > ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}

vec4 samp(sampler2D t, vec2 uv, vec2 img, float b) {
  vec2 m = mapUv(uv, img);
  vec2 px = b / uRes;
  vec4 c = vec4(0.0);
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / 24.0);
    float a = fi * 2.39996;
    vec2 q = m + vec2(cos(a), sin(a)) * r * px;
    if (uFit > 0.5 && (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0)) {
      c += vec4(uBg, 1.0);
    } else {
      c += texture2D(t, q);
    }
  }
  return c / 24.0;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * 3.14159265);

  float m;
  if (uMode < 0.5) {
    m = p;
  } else {
    vec2 n = uDir;
    vec2 perp = vec2(-n.y, n.x);
    float span = abs(n.x) + abs(n.y);
    float d = dot(vUv - 0.5, n) / span + 0.5;
    float side = dot(vUv - 0.5, perp) / span * 2.0;
    d -= uCurve * (1.0 - side * side);
    float e = mix(-uSoft - uCurve, 1.0 + uSoft, p);
    m = 1.0 - smoothstep(e - uSoft, e + uSoft, d);
  }

  float band = 1.0 - abs(m * 2.0 - 1.0);
  float b = uBlur * (band + 0.24 * env);

  float zoom = mix(uZoom, 1.0, p);
  vec2 toUv = (vUv - 0.5) / zoom + 0.5;

  vec4 a = samp(uFrom, vUv, uFromSize, b);
  vec4 c = samp(uTo, toUv, uToSize, b);
  gl_FragColor = mix(a, c, m);
}
`

// ---------- Helpers ----------

const EASINGS: Record<Easing, (t: number) => number> = {
    linear: (t) => t,
    easeIn: (t) => t * t * t,
    easeOut: (t) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

// Direction the new image travels (uv space, y up)
const DIRS: Record<Direction, [number, number]> = {
    blTr: [1, 1],
    tlBr: [1, -1],
    brTl: [-1, 1],
    trBl: [-1, -1],
    lr: [1, 0],
    rl: [-1, 0],
    bt: [0, 1],
    tb: [0, -1],
}

function parseColor(color: string): [number, number, number] {
    try {
        const ctx = document.createElement("canvas").getContext("2d")
        if (!ctx) return [0, 0, 0]
        ctx.fillStyle = color
        const v = String(ctx.fillStyle)
        if (v.startsWith("#")) {
            return [
                parseInt(v.slice(1, 3), 16) / 255,
                parseInt(v.slice(3, 5), 16) / 255,
                parseInt(v.slice(5, 7), 16) / 255,
            ]
        }
        const n = v.match(/[\d.]+/g)?.map(Number) || [0, 0, 0]
        return [n[0] / 255, n[1] / 255, n[2] / 255]
    } catch {
        return [0, 0, 0]
    }
}

function compile(
    gl: WebGLRenderingContext,
    type: number,
    src: string
): WebGLShader | null {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s))
        return null
    }
    return s
}

// ---------- Component ----------

/**
 * Gallery Blur Sweep
 * Auto rotating images. The next image sweeps in with a soft blurred
 * edge, by default from bottom left to top right, then settles from
 * a slight zoom. Static on the canvas and in exports, paused when
 * offscreen.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */
export default function GalleryBlurSweep(props: Props) {
    const {
        images = DEFAULT_IMAGES,
        interval = 5,
        duration = 1.8,
        easing = "easeInOut",
        transition = "sweep",
        direction = "blTr",
        softness = 0.24,
        curve = 0.08,
        blur = 24,
        zoom = 104,
        fit = "cover",
        focusX = 50,
        focusY = 50,
        background = "#EEECE7",
        autoplay = true,
        loop = true,
        pauseOnHover = false,
        clickToAdvance = false,
        startIndex = 0,
        reducedMotion = true,
        radius = 0,
        overlayColor = "#161616",
        overlayOpacity = 0,
        style,
    } = props

    const dots: DotsConfig = { ...DEFAULT_DOTS, ...(props.dots || {}) }

    const isStatic = useIsStaticRenderer()

    const list: Img[] = (images || []).filter((i) => i && i.src)
    const srcs = list.map((i) => i.src as string)
    const firstIndex = Math.min(
        Math.max(0, Math.round(startIndex)),
        Math.max(0, srcs.length - 1)
    )

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<{
        gl: WebGLRenderingContext
        u: Record<string, WebGLUniformLocation | null>
    } | null>(null)
    const texRef = useRef<Map<string, Tex>>(new Map())
    const loadingRef = useRef<Set<string>>(new Set())
    const indexRef = useRef(firstIndex)
    const animRef = useRef<Anim | null>(null)
    const rafRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hoverRef = useRef(false)
    const bgRef = useRef<{ key: string; rgb: [number, number, number] }>({
        key: "",
        rgb: [0, 0, 0],
    })

    const [active, setActive] = useState(firstIndex)
    const [fallback, setFallback] = useState(false)
    const fallbackRef = useRef(fallback)
    fallbackRef.current = fallback

    // Live only while visible on screen, tab active, and not a static render
    const inView = useInView(rootRef, { amount: 0 })
    const [pageVisible, setPageVisible] = useState(true)
    const live = !isStatic && inView && pageVisible
    const liveRef = useRef(live)
    liveRef.current = live

    const prefersReduced =
        reducedMotion &&
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    // Latest settings for the loop and timers
    const settings = useRef({
        interval,
        duration,
        easing,
        transition,
        direction,
        softness,
        curve,
        blur,
        zoom,
        fit,
        focusX,
        focusY,
        background,
        autoplay,
        loop,
        pauseOnHover,
        prefersReduced,
    })
    settings.current = {
        interval,
        duration,
        easing,
        transition,
        direction,
        softness,
        curve,
        blur,
        zoom,
        fit,
        focusX,
        focusY,
        background,
        autoplay,
        loop,
        pauseOnHover,
        prefersReduced,
    }
    const srcsRef = useRef(srcs)
    srcsRef.current = srcs

    /* ── Drawing ─────────────────────────────────────────
       Renders one frame. Returns true while a transition is still
       running, so the loop knows whether to ask for another frame. */
    const draw = (now: number): boolean => {
        const g = glRef.current
        const canvas = canvasRef.current
        const s = srcsRef.current
        const p = settings.current
        if (!g || !canvas || !s.length) return false

        const { gl, u } = g
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }

        let fromIdx = indexRef.current
        let toIdx = indexRef.current
        let progress = 0
        let running = false
        const anim = animRef.current
        if (anim) {
            const raw = Math.min(
                1,
                (now - anim.start) / (Math.max(0.05, p.duration) * 1000)
            )
            progress = (EASINGS[p.easing] || EASINGS.easeInOut)(raw)
            fromIdx = anim.from
            toIdx = anim.to
            running = raw < 1
            if (!running) {
                indexRef.current = anim.to
                animRef.current = null
                fromIdx = toIdx = anim.to
                progress = 0
            }
        }

        const from = texRef.current.get(s[fromIdx])
        const to = texRef.current.get(s[toIdx]) || from
        if (!from || !to) return running

        if (bgRef.current.key !== p.background) {
            bgRef.current = { key: p.background, rgb: parseColor(p.background) }
        }
        const bg = bgRef.current.rgb
        const calm = p.prefersReduced
        const dir = DIRS[p.direction] || DIRS.blTr

        gl.viewport(0, 0, w, h)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, from.tex)
        gl.uniform1i(u.uFrom, 0)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, to.tex)
        gl.uniform1i(u.uTo, 1)
        gl.uniform2f(u.uRes, w, h)
        gl.uniform2f(u.uFromSize, from.w, from.h)
        gl.uniform2f(u.uToSize, to.w, to.h)
        gl.uniform1f(u.uProgress, progress)
        gl.uniform1f(u.uBlur, calm ? 0 : p.blur * dpr)
        gl.uniform1f(u.uSoft, p.softness)
        gl.uniform1f(u.uCurve, p.curve)
        gl.uniform1f(u.uZoom, calm ? 1 : p.zoom / 100)
        gl.uniform1f(u.uMode, calm || p.transition === "fade" ? 0 : 1)
        gl.uniform2f(u.uDir, dir[0], dir[1])
        gl.uniform2f(u.uFocus, p.focusX / 100, 1 - p.focusY / 100)
        gl.uniform1f(u.uFit, p.fit === "contain" ? 1 : 0)
        gl.uniform3f(u.uBg, bg[0], bg[1], bg[2])
        gl.drawArrays(gl.TRIANGLES, 0, 6)

        return running
    }

    /* ── Loop: only runs during a transition, then stops ─── */
    const frame = (now: number) => {
        rafRef.current = 0
        const wasAnimating = !!animRef.current
        const running = draw(now)
        if (running && liveRef.current) {
            rafRef.current = requestAnimationFrame(frame)
        } else if (wasAnimating && !animRef.current) {
            // A transition just finished: wait for the next one
            schedule()
        }
    }

    const requestDraw = () => {
        if (!liveRef.current || fallbackRef.current || rafRef.current) return
        rafRef.current = requestAnimationFrame(frame)
    }

    const stopLoop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }

    const clearTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = null
    }

    // Finish any transition instantly, used when going offscreen
    const finishNow = () => {
        if (animRef.current) {
            indexRef.current = animRef.current.to
            animRef.current = null
        }
    }

    /* ── Navigation ────────────────────────────────────── */
    const goTo = (i: number) => {
        const s = srcsRef.current
        if (!s.length) return
        const target = ((i % s.length) + s.length) % s.length
        finishNow()
        if (target === indexRef.current) return
        clearTimer()

        if (fallbackRef.current || !liveRef.current) {
            indexRef.current = target
            setActive(target)
            schedule()
            return
        }
        animRef.current = {
            from: indexRef.current,
            to: target,
            start: performance.now(),
        }
        setActive(target)
        requestDraw()
    }

    const next = (): boolean => {
        const s = srcsRef.current
        const i = indexRef.current + 1
        if (i >= s.length && !settings.current.loop) return false
        goTo(i)
        return true
    }

    /* ── Autoplay: a timer between transitions, not a loop ─ */
    const schedule = () => {
        clearTimer()
        const p = settings.current
        const s = srcsRef.current
        if (!p.autoplay || !liveRef.current || s.length < 2 || animRef.current)
            return
        if (p.pauseOnHover && hoverRef.current) return
        if (!p.loop && indexRef.current >= s.length - 1) return

        const fire = () => {
            timerRef.current = null
            if (!liveRef.current) return
            const list = srcsRef.current
            const nextIdx = (indexRef.current + 1) % list.length
            // Wait for the next image to finish loading
            if (!fallbackRef.current && !texRef.current.has(list[nextIdx])) {
                timerRef.current = setTimeout(fire, 250)
                return
            }
            next()
        }
        timerRef.current = setTimeout(fire, Math.max(0.5, p.interval) * 1000)
    }

    /* ── Effects ───────────────────────────────────────── */

    // Tab visibility
    useEffect(() => {
        if (typeof document === "undefined") return
        const update = () =>
            setPageVisible(document.visibilityState === "visible")
        update()
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    // Keep the index valid when images change
    useEffect(() => {
        if (indexRef.current >= srcs.length) {
            indexRef.current = 0
            animRef.current = null
            setActive(0)
        }
    }, [srcs.length])

    // WebGL setup (never runs in static rendering)
    useEffect(() => {
        if (isStatic) return
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            premultipliedAlpha: false,
            antialias: false,
            alpha: true,
        })
        if (!gl) {
            setFallback(true)
            return
        }
        const vs = compile(gl, gl.VERTEX_SHADER, VERT)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
        const prog = gl.createProgram()
        if (!vs || !fs || !prog) {
            setFallback(true)
            return
        }
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const names = [
            "uFrom",
            "uTo",
            "uRes",
            "uFromSize",
            "uToSize",
            "uProgress",
            "uBlur",
            "uSoft",
            "uCurve",
            "uZoom",
            "uMode",
            "uDir",
            "uFocus",
            "uFit",
            "uBg",
        ]
        const u: Record<string, WebGLUniformLocation | null> = {}
        names.forEach((n) => (u[n] = gl.getUniformLocation(prog, n)))
        glRef.current = { gl, u }

        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => requestDraw())
                : null
        ro?.observe(canvas)

        return () => {
            ro?.disconnect()
            stopLoop()
            texRef.current.forEach((t) => gl.deleteTexture(t.tex))
            texRef.current.clear()
            loadingRef.current.clear()
            glRef.current = null
        }
    }, [isStatic])

    // Load textures
    useEffect(() => {
        if (isStatic) return
        const g = glRef.current
        if (!g || fallback) return
        const { gl } = g
        srcs.forEach((src) => {
            if (texRef.current.has(src) || loadingRef.current.has(src)) return
            loadingRef.current.add(src)
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (!glRef.current) return
                const tex = gl.createTexture()
                if (!tex) return
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                try {
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        img
                    )
                } catch {
                    setFallback(true)
                    return
                }
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
                texRef.current.set(src, {
                    tex,
                    w: img.naturalWidth,
                    h: img.naturalHeight,
                })
                requestDraw()
            }
            img.onerror = () => loadingRef.current.delete(src)
            img.src = src
        })
    }, [srcs.join("|"), fallback, isStatic])

    // Going offscreen or hidden: stop everything. Coming back: resume
    useEffect(() => {
        if (live) {
            requestDraw()
            schedule()
        } else {
            stopLoop()
            clearTimer()
            finishNow()
        }
    }, [live])

    // Redraw when visual settings change
    useEffect(() => {
        requestDraw()
    }, [
        transition,
        direction,
        softness,
        curve,
        blur,
        zoom,
        fit,
        focusX,
        focusY,
        background,
        prefersReduced,
    ])

    // Restart the autoplay timer when its settings change
    useEffect(() => {
        schedule()
    }, [autoplay, interval, loop, pauseOnHover, srcs.length, fallback])

    // Clean up on unmount
    useEffect(
        () => () => {
            stopLoop()
            clearTimer()
        },
        []
    )

    /* ── Render ────────────────────────────────────────── */

    const width = style?.width ?? DEFAULT_W
    const height = style?.height ?? DEFAULT_H
    const current = list[active]
    const total = list.length

    const imageStyle = (visible: boolean): CSSProperties => ({
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: `${focusX}% ${focusY}%`,
        opacity: visible ? 1 : 0,
        display: "block",
    })

    const overlay =
        overlayOpacity > 0 ? (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: overlayColor,
                    opacity: overlayOpacity / 100,
                    pointerEvents: "none",
                }}
            />
        ) : null

    const dotsRow =
        dots.show && total > 1 ? (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: dots.offset,
                    display: "flex",
                    justifyContent:
                        dots.align === "left"
                            ? "flex-start"
                            : dots.align === "right"
                              ? "flex-end"
                              : "center",
                    gap: dots.gap,
                    paddingInline: dots.offset,
                }}
            >
                {list.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        tabIndex={isStatic ? -1 : 0}
                        aria-label={`Show image ${i + 1} of ${total}`}
                        aria-current={i === active || undefined}
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!isStatic) goTo(i)
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        style={{
                            width: i === active ? dots.activeWidth : dots.size,
                            height: dots.size,
                            borderRadius: dots.size,
                            border: "none",
                            padding: 0,
                            cursor: isStatic ? "default" : "pointer",
                            background:
                                i === active ? dots.activeColor : dots.color,
                            transition: isStatic
                                ? undefined
                                : "width 400ms ease, background 400ms ease",
                        }}
                    />
                ))}
            </div>
        ) : null

    // Static rendering: a plain image of the start slide, no WebGL or timers
    if (isStatic) {
        const still = list[firstIndex]
        return (
            <div
                ref={rootRef}
                role="img"
                aria-label={still?.alt || "Slideshow"}
                style={{
                    ...style,
                    width,
                    height,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: radius,
                    background,
                }}
            >
                {still?.src && (
                    <img
                        src={still.src}
                        srcSet={still.srcSet}
                        alt={still.alt || ""}
                        style={imageStyle(true)}
                    />
                )}
                {overlay}
                {dotsRow}
            </div>
        )
    }

    const interactive = clickToAdvance && total > 1

    return (
        <div
            ref={rootRef}
            role={interactive ? "button" : "img"}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
                interactive
                    ? `Next image. Showing ${active + 1} of ${total}${current?.alt ? `: ${current.alt}` : ""}`
                    : current?.alt || "Slideshow"
            }
            onMouseEnter={() => {
                hoverRef.current = true
                if (settings.current.pauseOnHover) clearTimer()
            }}
            onMouseLeave={() => {
                hoverRef.current = false
                schedule()
            }}
            onClick={() => {
                if (interactive) next()
            }}
            onKeyDown={(e) => {
                if (!interactive) return
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    next()
                }
            }}
            style={{
                ...style,
                width,
                height,
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background,
                cursor: interactive ? "pointer" : "default",
            }}
        >
            {!fallback && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                    }}
                />
            )}

            {fallback &&
                list.map((img, i) => (
                    <img
                        key={img.src}
                        src={img.src}
                        srcSet={img.srcSet}
                        alt={img.alt || ""}
                        style={{
                            ...imageStyle(i === active),
                            filter:
                                i === active || prefersReduced
                                    ? "blur(0px)"
                                    : `blur(${blur}px)`,
                            transform:
                                i === active || prefersReduced
                                    ? "scale(1)"
                                    : `scale(${zoom / 100})`,
                            transition: `opacity ${duration}s ease, filter ${duration}s ease, transform ${duration}s ease`,
                        }}
                    />
                ))}

            {overlay}
            {dotsRow}
        </div>
    )
}

GalleryBlurSweep.displayName = "Gallery Blur Sweep"

addPropertyControls(GalleryBlurSweep, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 20,
        defaultValue: DEFAULT_IMAGES,
    },

    // Timing
    interval: {
        type: ControlType.Number,
        title: "Hold Time",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Transition",
        defaultValue: 1.8,
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
        displayStepper: true,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeInOut",
        options: ["easeInOut", "easeOut", "easeIn", "linear"],
        optionTitles: ["Ease In Out", "Ease Out", "Ease In", "Linear"],
    },

    // Effect
    transition: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "sweep",
        options: ["sweep", "fade"],
        optionTitles: ["Blur Sweep", "Blur Fade"],
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "blTr",
        options: ["blTr", "tlBr", "brTl", "trBl", "lr", "rl", "bt", "tb"],
        optionTitles: [
            "↗ Bottom Left to Top Right",
            "↘ Top Left to Bottom Right",
            "↖ Bottom Right to Top Left",
            "↙ Top Right to Bottom Left",
            "→ Left to Right",
            "← Right to Left",
            "↑ Bottom to Top",
            "↓ Top to Bottom",
        ],
        hidden: (p: Props) => p.transition !== "sweep",
    },
    softness: {
        type: ControlType.Number,
        title: "Edge Width",
        defaultValue: 0.24,
        min: 0.04,
        max: 0.6,
        step: 0.02,
        description: "Low is a sharper line, high is very dreamy",
        hidden: (p: Props) => p.transition !== "sweep",
    },
    curve: {
        type: ControlType.Number,
        title: "Edge Curve",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.02,
        description: "0 is a straight line, higher bows it into a wave",
        hidden: (p: Props) => p.transition !== "sweep",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 4,
        unit: "px",
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom In",
        defaultValue: 104,
        min: 100,
        max: 120,
        step: 1,
        unit: "%",
        description: "New image settles from this zoom. 100 turns it off",
    },

    // Image
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        displaySegmentedControl: true,
    },
    focusX: {
        type: ControlType.Number,
        title: "Focus X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.fit !== "cover",
    },
    focusY: {
        type: ControlType.Number,
        title: "Focus Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.fit !== "cover",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#EEECE7",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 96,
        step: 4,
        unit: "px",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "#161616",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 4,
        unit: "%",
    },

    // Behaviour
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: false,
    },
    clickToAdvance: {
        type: ControlType.Boolean,
        title: "Click to Next",
        defaultValue: false,
        description: "Also works with Enter and Space when focused",
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Image",
        defaultValue: 0,
        min: 0,
        max: 19,
        step: 1,
        displayStepper: true,
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },

    // Indicators
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                defaultValue: "center",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 8,
                min: 4,
                max: 24,
                step: 4,
            },
            activeWidth: {
                type: ControlType.Number,
                title: "Active Width",
                defaultValue: 24,
                min: 4,
                max: 64,
                step: 4,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 4,
                max: 32,
                step: 4,
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: 24,
                min: 0,
                max: 96,
                step: 4,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255,255,255,0.4)",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#FFFFFF",
            },
        },
    },
})
