import { type MouseEvent, type TouchEvent, useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageLoupeProps {
    image?: { src?: string; srcSet?: string; alt?: string }
    zoom?: number
    lensSize?: number
    refraction?: number
    chromatic?: number
    liquid?: number
    smoothing?: number
    highlight?: number
    shadow?: number
    hideCursor?: boolean
    radius?: string | number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 707
 * @framerIntrinsicHeight 520
 */
export default function ImageLoupe(props: ImageLoupeProps) {
    const {
        image = { src: "https://framerusercontent.com/images/Z0x9gb2x6XLKssqPwrfCCQ.png", alt: "Concentric circles in motion blur" },
        zoom = 2.6,
        lensSize = 130,
        refraction = 40,
        chromatic = 23,
        liquid = 63,
        smoothing = 77,
        highlight = 25,
        shadow = 0,
        hideCursor = true,
        radius = "24px",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [webglUnavailable, setWebglUnavailable] = useState(false)
    const ensureRunningRef = useRef<() => void>(() => {})

    const runtimeRef = useRef({
        tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, svx: 0, svy: 0,
        hasPointer: false, show: 0, targetShow: 0,
        rafId: 0, running: false, last: 0, w: 1, h: 1,
    })

    const tuning = useMemo(() => {
        const sm = Math.max(0, Math.min(100, smoothing)) / 100
        const stiffness = 700 - sm * 620
        const damping = 2 * Math.sqrt(stiffness) * 0.72
        return {
            stiffness,
            damping,
            zoom: Math.max(1, Math.min(8, zoom)),
            refraction: Math.max(0, Math.min(100, refraction)) / 100,
            chromatic: Math.max(0, Math.min(100, chromatic)) / 100,
            liquid: (Math.max(0, Math.min(100, liquid)) / 100) * 0.45,
            highlight: Math.max(0, Math.min(100, highlight)) / 100,
            shadow: Math.max(0, Math.min(100, shadow)) / 100,
        }
    }, [smoothing, zoom, refraction, chromatic, liquid, highlight, shadow])

    const setPointer = useCallback((cx: number, cy: number, el: HTMLDivElement) => {
        const rect = el.getBoundingClientRect()
        const rt = runtimeRef.current
        rt.tx = cx - rect.left
        rt.ty = cy - rect.top
        if (!rt.hasPointer) {
            rt.x = rt.tx
            rt.y = rt.ty
            rt.vx = rt.vy = 0
            rt.hasPointer = true
        }
        rt.targetShow = 1
        ensureRunningRef.current()
    }, [])

    const onMouse = useCallback((e: MouseEvent<HTMLDivElement>) => setPointer(e.clientX, e.clientY, e.currentTarget), [setPointer])
    const onTouch = useCallback((e: TouchEvent<HTMLDivElement>) => {
        const t = e.touches[0]
        if (t) setPointer(t.clientX, t.clientY, e.currentTarget)
    }, [setPointer])
    const onLeave = useCallback(() => {
        const rt = runtimeRef.current
        rt.targetShow = 0
        rt.hasPointer = false
        ensureRunningRef.current()
    }, [])

    useEffect(() => {
        if (isStatic || webglUnavailable || typeof window === "undefined") return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        const gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false })
        if (!gl) {
            startTransition(() => setWebglUnavailable(true))
            return
        }

        const vs = "attribute vec2 aPos; varying vec2 vUv; void main(){ vec2 b = aPos*0.5+0.5; vUv = vec2(b.x, 1.0-b.y); gl_Position = vec4(aPos,0.0,1.0); }"
        const fs = `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uTex;
            uniform vec2 uRes;
            uniform vec2 uImg;
            uniform vec2 uCursor;
            uniform vec2 uVel;
            uniform float uRadius;
            uniform float uShow;
            uniform float uZoom;
            uniform float uRefract;
            uniform float uChroma;
            uniform float uLiquid;
            uniform float uHighlight;
            uniform float uShadow;

            vec3 img(vec2 px) {
                vec2 uv = clamp(px / uRes, 0.0, 1.0);
                float ca = uRes.x / max(uRes.y, 0.0001);
                float ia = uImg.x / max(uImg.y, 0.0001);
                vec2 sc = vec2(1.0);
                if (ia > ca) { sc.x = ca / ia; } else { sc.y = ia / ca; }
                vec2 cuv = uv * sc + (1.0 - sc) * 0.5;
                return texture2D(uTex, cuv).rgb;
            }

            vec2 toLocal(vec2 d, vec2 dir, vec2 perp, float s) {
                return vec2(dot(d, dir) / (1.0 + s), dot(d, perp) / (1.0 - s * 0.5));
            }

            void main() {
                vec2 p = vUv * uRes;
                vec3 col = img(p);
                if (uShow < 0.002) { gl_FragColor = vec4(col, 1.0); return; }

                float r = max(1.0, uRadius * uShow);
                float speed = length(uVel);
                vec2 dir = speed > 1.0 ? uVel / speed : vec2(1.0, 0.0);
                vec2 perp = vec2(-dir.y, dir.x);
                float s = clamp(speed / 2600.0, 0.0, 1.0) * uLiquid;

                vec2 d = p - uCursor;
                vec2 local = toLocal(d, dir, perp, s);
                float len = length(local);
                float dist = len - r;
                float t = clamp(len / r, 0.0, 1.0);

                // Soft drop shadow under the lens
                vec2 ls = toLocal(p - (uCursor + vec2(0.0, r * 0.14)), dir, perp, s);
                float sd = length(ls) - r;
                float sh = (1.0 - smoothstep(-r * 0.15, r * 0.45, sd)) * uShadow * uShow;
                col *= 1.0 - sh * 0.6;

                float alpha = 1.0 - smoothstep(-1.0, 1.0, dist);
                if (alpha > 0.0) {
                    // Uniform magnification (no fisheye)
                    vec2 sp = uCursor + d / uZoom;
                    vec2 rad = length(d) > 0.001 ? normalize(d) : vec2(0.0);
                    float ca = uChroma * pow(t, 2.6) * r * 0.07;
                    vec3 lens = vec3(img(sp + rad * ca).r, img(sp).g, img(sp - rad * ca).b);
                    lens *= 1.04;

                    // Specular rim light from the top-left, faint bounce bottom-right
                    vec2 L = normalize(vec2(-0.55, -0.85));
                    float band = smoothstep(0.72, 0.99, t);
                    float spec = pow(max(dot(rad, L), 0.0), 3.0) * band;
                    float bounce = pow(max(-dot(rad, L), 0.0), 4.0) * band;
                    lens += vec3(1.0) * (spec * 0.5 + bounce * 0.22) * uHighlight;

                    // Thin bright edge + subtle inner frost
                    float line = smoothstep(0.94, 0.99, t) * (1.0 - smoothstep(0.99, 1.0, t));
                    lens = mix(lens, vec3(1.0), line * 0.35 * uHighlight);
                    lens = mix(lens, vec3(1.0), 0.04 * uHighlight);

                    col = mix(col, lens, alpha);
                }
                gl_FragColor = vec4(col, 1.0);
            }
        `

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)
            if (!sh) return null
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                gl.deleteShader(sh)
                return null
            }
            return sh
        }
        const v = compile(gl.VERTEX_SHADER, vs)
        const f = compile(gl.FRAGMENT_SHADER, fs)
        const program = gl.createProgram()
        if (!v || !f || !program) {
            startTransition(() => setWebglUnavailable(true))
            return
        }
        gl.attachShader(program, v)
        gl.attachShader(program, f)
        gl.linkProgram(program)
        gl.deleteShader(v)
        gl.deleteShader(f)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            startTransition(() => setWebglUnavailable(true))
            return
        }
        gl.useProgram(program)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const tex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]))

        const size = { w: 1, h: 1 }
        let disposed = false
        if (image?.src) {
            const el = new Image()
            el.crossOrigin = "anonymous"
            el.decoding = "async"
            el.onload = () => {
                if (disposed) return
                size.w = el.naturalWidth || el.width
                size.h = el.naturalHeight || el.height
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el)
                ensureRunningRef.current()
            }
            el.src = image.src
        }

        const u = (n: string) => gl.getUniformLocation(program, n)
        const U = {
            tex: u("uTex"), res: u("uRes"), img: u("uImg"), cursor: u("uCursor"), vel: u("uVel"),
            radius: u("uRadius"), show: u("uShow"), zoom: u("uZoom"), refract: u("uRefract"),
            chroma: u("uChroma"), liquid: u("uLiquid"), highlight: u("uHighlight"), shadow: u("uShadow"),
        }
        gl.uniform1i(U.tex, 0)

        const resize = () => {
            const rect = container.getBoundingClientRect()
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
            const rt = runtimeRef.current
            rt.w = Math.max(1, rect.width)
            rt.h = Math.max(1, rect.height)
            canvas.width = Math.round(rt.w * dpr)
            canvas.height = Math.round(rt.h * dpr)
            gl.viewport(0, 0, canvas.width, canvas.height)
            ensureRunningRef.current()
        }
        resize()
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
        ro?.observe(container)

        const draw = (ms: number) => {
            const rt = runtimeRef.current
            const tsec = ms * 0.001
            const dt = rt.last > 0 ? Math.min(0.05, Math.max(0.001, tsec - rt.last)) : 1 / 60
            rt.last = tsec

            rt.vx += ((rt.tx - rt.x) * tuning.stiffness - rt.vx * tuning.damping) * dt
            rt.vy += ((rt.ty - rt.y) * tuning.stiffness - rt.vy * tuning.damping) * dt
            rt.x += rt.vx * dt
            rt.y += rt.vy * dt
            rt.svx += (rt.vx - rt.svx) * 0.2
            rt.svy += (rt.vy - rt.svy) * 0.2
            rt.show += (rt.targetShow - rt.show) * (rt.targetShow > rt.show ? 0.14 : 0.18)
            const eased = rt.show < 0.001 ? 0 : 1 - Math.pow(1 - Math.min(1, rt.show), 3)

            gl.uniform2f(U.res, rt.w, rt.h)
            gl.uniform2f(U.img, size.w, size.h)
            gl.uniform2f(U.cursor, rt.x, rt.y)
            gl.uniform2f(U.vel, rt.svx, rt.svy)
            gl.uniform1f(U.radius, Math.max(10, lensSize))
            gl.uniform1f(U.show, eased)
            gl.uniform1f(U.zoom, tuning.zoom)
            gl.uniform1f(U.refract, tuning.refraction)
            gl.uniform1f(U.chroma, tuning.chromatic)
            gl.uniform1f(U.liquid, tuning.liquid)
            gl.uniform1f(U.highlight, tuning.highlight)
            gl.uniform1f(U.shadow, tuning.shadow)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            const busy =
                rt.targetShow > 0 ||
                rt.show > 0.002 ||
                Math.abs(rt.tx - rt.x) > 0.1 ||
                Math.abs(rt.ty - rt.y) > 0.1 ||
                Math.abs(rt.vx) > 0.5 ||
                Math.abs(rt.vy) > 0.5
            if (busy) {
                rt.rafId = window.requestAnimationFrame(draw)
            } else {
                rt.running = false
                rt.rafId = 0
                rt.last = 0
            }
        }

        ensureRunningRef.current = () => {
            const rt = runtimeRef.current
            if (!rt.running) {
                rt.running = true
                rt.rafId = window.requestAnimationFrame(draw)
            }
        }
        ensureRunningRef.current()

        return () => {
            disposed = true
            ro?.disconnect()
            const rt = runtimeRef.current
            if (rt.rafId) window.cancelAnimationFrame(rt.rafId)
            rt.running = false
            rt.rafId = 0
            ensureRunningRef.current = () => {}
            gl.deleteTexture(tex)
            gl.deleteBuffer(buf)
            gl.deleteProgram(program)
        }
    }, [image?.src, lensSize, tuning, isStatic, webglUnavailable])

    const br = typeof radius === "number" ? radius + "px" : radius
    const interactive = !isStatic && !webglUnavailable

    return (
        <div
            ref={containerRef}
            role="img"
            aria-label={image?.alt || "Zoomable image"}
            onMouseEnter={interactive ? onMouse : undefined}
            onMouseMove={interactive ? onMouse : undefined}
            onMouseLeave={onLeave}
            onTouchStart={interactive ? onTouch : undefined}
            onTouchMove={interactive ? onTouch : undefined}
            onTouchEnd={onLeave}
            onTouchCancel={onLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: br,
                cursor: interactive && hideCursor ? "none" : "default",
                touchAction: "none",
                background: "#000",
            }}
        >
            {!interactive && image?.src && (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || ""}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                />
            )}
            {interactive && (
                <canvas
                    ref={canvasRef}
                    aria-hidden
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
                />
            )}
        </div>
    )
}

ImageLoupe.displayName = "Image Loupe"

addPropertyControls(ImageLoupe, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    zoom: { type: ControlType.Number, title: "Zoom", defaultValue: 2.6, min: 1, max: 8, step: 0.1, unit: "×" },
    lensSize: { type: ControlType.Number, title: "Lens Size", defaultValue: 130, min: 30, max: 400, step: 1, unit: "px" },
    chromatic: { type: ControlType.Number, title: "Chromatic", defaultValue: 23, min: 0, max: 100, step: 1 },
    liquid: { type: ControlType.Number, title: "Liquid Stretch", defaultValue: 63, min: 0, max: 100, step: 1 },
    smoothing: { type: ControlType.Number, title: "Smoothing", defaultValue: 77, min: 0, max: 100, step: 1 },
    highlight: { type: ControlType.Number, title: "Highlight", defaultValue: 25, min: 0, max: 100, step: 1 },
    shadow: { type: ControlType.Number, title: "Shadow", defaultValue: 0, min: 0, max: 100, step: 1 },
    hideCursor: { type: ControlType.Boolean, title: "Hide Cursor", defaultValue: true },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "24px" },
})
