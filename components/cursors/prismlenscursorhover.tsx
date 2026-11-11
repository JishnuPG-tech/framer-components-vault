// Prism lens cursor: a round lens follows the cursor over an image. Inside the lens the image
// is magnified, glows, smears at the edge and splits into rainbow colours. All settings (lens
// size, zoom, smear, rainbow, glow, ghost, follow speed, corner radius, hide cursor) are
// component properties. Default image: succulents.

import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useReducedMotion } from "framer-motion"

const VERT = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_img;
uniform vec2 u_res;
uniform vec2 u_imgSize;
uniform vec2 u_mouse;
uniform float u_radius;
uniform float u_zoom;
uniform float u_smear;
uniform float u_rainbow;
uniform float u_glow;
uniform float u_ghost;
out vec4 outColor;

vec2 coverUV(vec2 p) {
  float s = max(u_res.x / u_imgSize.x, u_res.y / u_imgSize.y);
  return ((p - u_res * 0.5) / s + u_imgSize * 0.5) / u_imgSize;
}

vec3 photo(vec2 p) { return texture(u_img, coverUV(p)).rgb; }

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec3 base = photo(p);
  if (u_radius < 1.0) { outColor = vec4(base, 1.0); return; }

  vec2 d = p - u_mouse;
  float r = length(d) / u_radius;
  if (r > 1.02) { outColor = vec4(base, 1.0); return; }

  vec2 q = d / u_zoom * (1.0 + 0.6 * r * r);

  float streak = u_smear * 0.35 * r * r * r;
  float split = u_rainbow * 0.06 * r * r;
  vec3 col = vec3(0.0);
  const int N = 12;
  for (int i = 0; i < N; i++) {
    float t = float(i) / float(N - 1);
    float k = 1.0 - streak * t;
    col.r += photo(u_mouse + q * k * (1.0 + split)).r;
    col.g += photo(u_mouse + q * k).g;
    col.b += photo(u_mouse + q * k * (1.0 - split)).b;
  }
  col /= float(N);

  vec3 ghost = photo(u_mouse + q * 0.88 + vec2(0.18, -0.12) * u_radius);
  col = mix(col, max(col, ghost), u_ghost * 0.5);

  vec3 bloom = max(col - 0.7, 0.0) * 3.0;
  col += bloom * u_glow * 0.6;
  col = mix(col, vec3(1.0), u_glow * 0.06 * (0.3 + r * 0.7));

  float rim = smoothstep(0.86, 0.99, r) * (1.0 - smoothstep(0.99, 1.02, r));
  float ang = atan(d.y, d.x);
  vec3 hue = 0.5 + 0.5 * cos(ang * 2.0 + vec3(0.0, 2.094, 4.189));
  col += rim * (0.25 * u_glow + 0.35 * u_rainbow * hue);

  float aa = 1.5 / u_radius;
  float mask = 1.0 - smoothstep(1.0 - aa, 1.0, r);
  outColor = vec4(mix(base, col, mask), 1.0);
}`

const UNIFORMS = ["u_res", "u_imgSize", "u_mouse", "u_radius", "u_zoom", "u_smear", "u_rainbow", "u_glow", "u_ghost"] as const

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface PrismLensCursorProps {
    image?: ImageValue
    cornerRadius: string
    radius: number
    zoom: number
    smear: number
    rainbow: number
    glow: number
    ghost: number
    follow: number
    hideCursor: boolean
    style?: React.CSSProperties
}

interface LensLook {
    zoom: number
    smear: number
    rainbow: number
    glow: number
    ghost: number
}

// Browsers allow only about 16 WebGL canvases at once and switch off the oldest beyond that,
// so each lens opens one only while it is in use and closes it again afterwards.
function createRenderer(img: HTMLImageElement) {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: false })
    if (!gl) return null
    const dispose = () => {
        gl.getExtension("WEBGL_lose_context")?.loseContext()
        canvas.remove()
    }

    const compile = (type: number, code: string) => {
        const s = gl.createShader(type)!
        gl.shaderSource(s, code)
        gl.compileShader(s)
        return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        dispose()
        return null
    }
    gl.useProgram(prog)

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "a_pos")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<
        (typeof UNIFORMS)[number],
        WebGLUniformLocation | null
    >

    try {
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    } catch {
        dispose()
        return null
    }

    const draw = (w: number, h: number, x: number, y: number, radius: number, look: LensLook) => {
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }
        gl.viewport(0, 0, w, h)
        gl.uniform2f(u.u_res, w, h)
        gl.uniform2f(u.u_imgSize, img.naturalWidth, img.naturalHeight)
        gl.uniform2f(u.u_mouse, x, y)
        gl.uniform1f(u.u_radius, radius)
        gl.uniform1f(u.u_zoom, look.zoom)
        gl.uniform1f(u.u_smear, look.smear)
        gl.uniform1f(u.u_rainbow, look.rainbow)
        gl.uniform1f(u.u_glow, look.glow)
        gl.uniform1f(u.u_ghost, look.ghost)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    return { canvas, draw, dispose }
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 600
 */
export default function PrismLensCursor(props: PrismLensCursorProps) {
    const {
        image = { src: "https://framerusercontent.com/images/YZ45i5evQdwiNmWvXWCYPKv6Dw.webp", alt: "Succulent plants seen from above" },
        cornerRadius,
        hideCursor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const containerRef = useRef<HTMLDivElement>(null)
    const stillRef = useRef<HTMLCanvasElement>(null)
    const inView = useInView(containerRef)
    const settingsRef = useRef({ ...props, reducedMotion, isStatic, inView })
    settingsRef.current = { ...props, reducedMotion, isStatic, inView }
    const drawRef = useRef<() => void>(() => {})
    const wakeRef = useRef<() => void>(() => {})

    useEffect(() => {
        if (inView) drawRef.current()
    })

    useEffect(() => {
        wakeRef.current()
    }, [inView])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const state = {
            img: null as HTMLImageElement | null,
            renderer: null as ReturnType<typeof createRenderer>,
            target: { x: 0, y: 0 },
            cur: { x: 0, y: 0 },
            show: 0,
            showTarget: 0,
            raf: 0,
            last: 0,
        }
        let disposed = false
        const dpr = () => Math.min(window.devicePixelRatio || 1, 2)
        const size = () => [Math.max(1, Math.round(el.clientWidth * dpr())), Math.max(1, Math.round(el.clientHeight * dpr()))]

        const release = () => {
            state.renderer?.dispose()
            state.renderer = null
            state.show = 0
            state.showTarget = 0
        }

        const drawStill = () => {
            const still = stillRef.current
            if (!state.img || !still) return
            const temp = createRenderer(state.img)
            if (!temp) return
            const s = settingsRef.current
            const [w, h] = size()
            temp.draw(w, h, (el.clientWidth / 2) * dpr(), (el.clientHeight / 2) * dpr(), s.radius * dpr(), s)
            still.width = w
            still.height = h
            still.getContext("2d")?.drawImage(temp.canvas, 0, 0)
            temp.dispose()
        }

        const draw = () => {
            if (!state.img || disposed) return
            if (settingsRef.current.isStatic) return drawStill()
            if (!state.renderer) return
            const s = settingsRef.current
            const [w, h] = size()
            const eased = state.show * state.show * (3 - 2 * state.show)
            state.renderer.draw(w, h, state.cur.x * dpr(), state.cur.y * dpr(), s.radius * eased * dpr(), s)
        }
        drawRef.current = draw

        const tick = (now: number) => {
            const s = settingsRef.current
            if (!s.inView) {
                state.raf = 0
                release()
                return
            }
            const dt = Math.min((now - state.last) / 1000, 0.05)
            state.last = now
            const k = s.reducedMotion ? 1 : 1 - Math.exp(-dt * s.follow)
            state.cur.x += (state.target.x - state.cur.x) * k
            state.cur.y += (state.target.y - state.cur.y) * k
            const step = s.reducedMotion ? 1 : dt / 0.35
            state.show =
                state.showTarget === 1 ? Math.min(state.show + step, 1) : Math.max(state.show - step, 0)
            draw()
            const settled =
                Math.hypot(state.target.x - state.cur.x, state.target.y - state.cur.y) < 0.1 &&
                state.show === state.showTarget
            if (settled && state.show === 0) release()
            state.raf = settled ? 0 : requestAnimationFrame(tick)
        }

        const wake = () => {
            const s = settingsRef.current
            if (!s.inView) {
                cancelAnimationFrame(state.raf)
                state.raf = 0
                release()
                return
            }
            if (state.raf || s.isStatic || !state.renderer) return
            state.last = performance.now()
            state.raf = requestAnimationFrame(tick)
        }
        wakeRef.current = wake

        const activate = () => {
            if (state.renderer || !state.img || settingsRef.current.isStatic) return
            const r = createRenderer(state.img)
            if (!r) return
            r.canvas.setAttribute("aria-hidden", "true")
            Object.assign(r.canvas.style, {
                position: "absolute",
                inset: "0",
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
            })
            el.appendChild(r.canvas)
            state.renderer = r
        }

        const moveTo = (clientX: number, clientY: number) => {
            activate()
            const b = el.getBoundingClientRect()
            state.target.x = clientX - b.left
            state.target.y = clientY - b.top
            if (state.show === 0 && state.showTarget === 0) {
                state.cur.x = state.target.x
                state.cur.y = state.target.y
            }
            state.showTarget = 1
            wake()
        }
        const hide = () => {
            state.showTarget = 0
            wake()
        }
        const setTarget = (e: PointerEvent) => {
            if (e.pointerType !== "touch") moveTo(e.clientX, e.clientY)
        }
        const onLeave = (e: PointerEvent) => {
            if (e.pointerType !== "touch") hide()
        }

        // Touch: the lens appears under the finger right away and follows it. A quick swipe
        // still scrolls the page (the lens rides along under the finger). If the finger stays
        // still for a moment first, scrolling is held off so the lens can be dragged freely.
        const HOLD_MS = 150
        const SLOP_PX = 10
        const touch = { id: -1, x: 0, y: 0, start: 0, dragging: false, scrolling: false }
        const endTouch = () => {
            touch.id = -1
            hide()
        }
        const findTouch = (e: TouchEvent) => Array.from(e.changedTouches).find((t) => t.identifier === touch.id)
        const onTouchStart = (e: TouchEvent) => {
            if (touch.id !== -1 || e.touches.length > 1) return endTouch()
            const t = e.changedTouches[0]
            touch.id = t.identifier
            touch.x = t.clientX
            touch.y = t.clientY
            touch.start = e.timeStamp
            touch.dragging = false
            touch.scrolling = false
            moveTo(t.clientX, t.clientY)
        }
        const onTouchMove = (e: TouchEvent) => {
            const t = findTouch(e)
            if (!t) return
            if (!touch.dragging && !touch.scrolling) {
                if (Math.hypot(t.clientX - touch.x, t.clientY - touch.y) > SLOP_PX) {
                    if (e.timeStamp - touch.start >= HOLD_MS) touch.dragging = true
                    else touch.scrolling = true
                }
            }
            if (touch.dragging && e.cancelable) e.preventDefault()
            moveTo(t.clientX, t.clientY)
        }
        const onTouchEnd = (e: TouchEvent) => {
            if (findTouch(e)) endTouch()
        }

        el.addEventListener("pointerenter", setTarget)
        el.addEventListener("pointermove", setTarget)
        el.addEventListener("pointerleave", onLeave)
        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        el.addEventListener("touchend", onTouchEnd)
        el.addEventListener("touchcancel", onTouchEnd)
        const resize = new ResizeObserver(draw)
        resize.observe(el)

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (disposed) return
            state.img = img
            draw()
        }
        img.src = image.src

        return () => {
            disposed = true
            cancelAnimationFrame(state.raf)
            el.removeEventListener("pointerenter", setTarget)
            el.removeEventListener("pointermove", setTarget)
            el.removeEventListener("pointerleave", onLeave)
            el.removeEventListener("touchstart", onTouchStart)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("touchend", onTouchEnd)
            el.removeEventListener("touchcancel", onTouchEnd)
            resize.disconnect()
            drawRef.current = () => {}
            wakeRef.current = () => {}
            release()
        }
    }, [image.src, isStatic])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius: cornerRadius,
                cursor: hideCursor && !isStatic ? "none" : undefined,
                WebkitTouchCallout: "none",
                userSelect: "none",
            }}
        >
            <img
                src={image.src}
                srcSet={image.srcSet}
                alt={image.alt ?? ""}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: cornerRadius,
                }}
            />
            {isStatic && (
                <canvas
                    key={image.src}
                    ref={stillRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(PrismLensCursor, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    radius: { type: ControlType.Number, title: "Lens Size", defaultValue: 276, min: 40, max: 300, step: 1, unit: "px" },
    zoom: { type: ControlType.Number, title: "Zoom", defaultValue: 1.27, min: 1, max: 3, step: 0.05 },
    smear: {
        type: ControlType.Number,
        title: "Edge Smear",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.01,
        description: "Streaks the picture outward near the rim of the lens.",
    },
    rainbow: { type: ControlType.Number, title: "Rainbow", defaultValue: 0.37, min: 0, max: 1, step: 0.01 },
    glow: { type: ControlType.Number, title: "Glow", defaultValue: 0.1, min: 0, max: 1, step: 0.01 },
    ghost: {
        type: ControlType.Number,
        title: "Ghost",
        defaultValue: 0.57,
        min: 0,
        max: 1,
        step: 0.01,
        description: "A faint shifted copy inside the lens, like a double reflection in plastic.",
    },
    follow: {
        type: ControlType.Number,
        title: "Follow Speed",
        defaultValue: 7,
        min: 1,
        max: 30,
        step: 0.5,
        description: "How fast the lens catches up with the cursor. Lower feels heavier.",
    },
    cornerRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "0px" },
    hideCursor: { type: ControlType.Boolean, title: "Hide Cursor", defaultValue: false },
})
