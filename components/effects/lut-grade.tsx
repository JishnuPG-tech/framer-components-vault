/**
 * LUT Grade, an out of storage component
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 450
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
import { useEffect, useRef, useState, startTransition } from "react"
import type { CSSProperties, ReactNode } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Vec3 = [number, number, number]
interface CubeLUT {
    size1: number
    data1: Float32Array | null
    min1: Vec3
    max1: Vec3
    size3: number
    data3: Float32Array | null
    min3: Vec3
    max3: Vec3
}

const MAX_1D = 4096

function isFramerAsset(url?: string): url is string {
    if (!url) return false
    try {
        const u = new URL(url, "https://framerusercontent.com")
        if (u.protocol === "blob:" || u.protocol === "data:") return true
        return (
            u.protocol === "https:" &&
            (u.hostname === "framerusercontent.com" ||
                u.hostname.endsWith(".framerusercontent.com"))
        )
    } catch {
        return false
    }
}

function resample1D(data: number[], size: number, target: number): number[] {
    const out: number[] = []
    for (let i = 0; i < target; i++) {
        const x = (i / (target - 1)) * (size - 1)
        const i0 = Math.floor(x)
        const i1 = Math.min(size - 1, i0 + 1)
        const f = x - i0
        for (let c = 0; c < 3; c++) {
            out.push(data[i0 * 3 + c] * (1 - f) + data[i1 * 3 + c] * f)
        }
    }
    return out
}

function parseCube(text: string): CubeLUT {
    let size1 = 0
    let size3 = 0
    let domMin: Vec3 | null = null
    let domMax: Vec3 | null = null
    let range1: [number, number] | null = null
    let range3: [number, number] | null = null
    const values: number[] = []

    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.startsWith("#")) continue
        const parts = line.split(/\s+/)
        const key = parts[0].toUpperCase()

        if (key === "LUT_3D_SIZE") {
            size3 = parseInt(parts[1], 10)
            continue
        }
        if (key === "LUT_1D_SIZE") {
            size1 = parseInt(parts[1], 10)
            continue
        }
        if (key === "DOMAIN_MIN") {
            domMin = parts.slice(1, 4).map(Number) as Vec3
            continue
        }
        if (key === "DOMAIN_MAX") {
            domMax = parts.slice(1, 4).map(Number) as Vec3
            continue
        }
        if (key === "LUT_1D_INPUT_RANGE") {
            range1 = [Number(parts[1]), Number(parts[2])]
            continue
        }
        if (key === "LUT_3D_INPUT_RANGE") {
            range3 = [Number(parts[1]), Number(parts[2])]
            continue
        }
        if (/^[A-Z_]/.test(key)) continue

        if (parts.length >= 3) {
            values.push(Number(parts[0]), Number(parts[1]), Number(parts[2]))
        }
    }

    if (!size1 && !size3) {
        throw new Error(
            "Invalid .cube file: LUT_1D_SIZE or LUT_3D_SIZE is missing."
        )
    }
    if (size3 && (size3 < 2 || size3 > 256)) {
        throw new Error(
            "Invalid .cube file: LUT_3D_SIZE must be between 2 and 256."
        )
    }
    if (size1 && (size1 < 2 || size1 > 65536)) {
        throw new Error(
            "Invalid .cube file: LUT_1D_SIZE must be between 2 and 65536."
        )
    }
    const expected = size1 + size3 * size3 * size3
    if (values.length !== expected * 3) {
        throw new Error(
            `Invalid .cube file: expected ${expected} entries, found ${values.length / 3}.`
        )
    }
    if (values.some((v) => Number.isNaN(v))) {
        throw new Error("Invalid .cube file: contains unreadable values.")
    }

    const toVec = (
        r: [number, number] | null,
        d: Vec3 | null,
        i: 0 | 1
    ): Vec3 =>
        r ? [r[i], r[i], r[i]] : (d ?? (i === 0 ? [0, 0, 0] : [1, 1, 1]))

    let raw1 = size1 ? values.slice(0, size1 * 3) : []
    let s1 = size1
    if (s1 > MAX_1D) {
        raw1 = resample1D(raw1, s1, MAX_1D)
        s1 = MAX_1D
    }

    return {
        size1: s1,
        data1: s1 ? new Float32Array(raw1) : null,
        min1: toVec(range1, domMin, 0),
        max1: toVec(range1, domMax, 1),
        size3,
        data3: size3 ? new Float32Array(values.slice(size1 * 3)) : null,
        min3: toVec(range3, domMin, 0),
        max3: toVec(range3, domMax, 1),
    }
}

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
    vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
    gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uMedia;
uniform sampler2D uLut1;
uniform sampler3D uLut3;
uniform float uHas1;
uniform float uHas3;
uniform float uSize1;
uniform float uSize3;
uniform vec3 uMin1;
uniform vec3 uMax1;
uniform vec3 uMin3;
uniform vec3 uMax3;
uniform float uIntensity;
uniform float uSplit;
uniform vec2 uScale;

void main() {
    vec2 uv = (vUv - 0.5) * uScale + 0.5;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        outColor = vec4(0.0);
        return;
    }
    vec4 src = texture(uMedia, uv);
    vec3 c = src.rgb;
    vec3 g = c;

    if (uHas1 > 0.5) {
        vec3 n = clamp((g - uMin1) / (uMax1 - uMin1), 0.0, 1.0);
        vec3 t = n * ((uSize1 - 1.0) / uSize1) + 0.5 / uSize1;
        g = vec3(
            texture(uLut1, vec2(t.r, 0.5)).r,
            texture(uLut1, vec2(t.g, 0.5)).g,
            texture(uLut1, vec2(t.b, 0.5)).b
        );
    }
    if (uHas3 > 0.5) {
        vec3 n = clamp((g - uMin3) / (uMax3 - uMin3), 0.0, 1.0);
        vec3 t = n * ((uSize3 - 1.0) / uSize3) + 0.5 / uSize3;
        g = texture(uLut3, t).rgb;
    }
    if (uHas1 > 0.5 || uHas3 > 0.5) {
        float amount = vUv.x >= uSplit ? uIntensity : 0.0;
        c = mix(c, g, amount);
    }
    outColor = vec4(c * src.a, src.a);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || "Shader error")
    }
    return shader
}

interface GLState {
    gl: WebGL2RenderingContext
    mediaTex: WebGLTexture
    lutTex: WebGLTexture
    lut1Tex: WebGLTexture
    u: Record<string, WebGLUniformLocation | null>
}

type Props = {
    mediaType: "image" | "video"
    image?: { src: string; alt?: string }
    videoFile?: string
    autoPlay: boolean
    loop: boolean
    lutFile?: string
    intensity: number
    compare: "none" | "slider" | "hover"
    sliderStart: number
    lineWidth: number
    lineColor: string
    handle?: ReactNode
    hoverDuration: number
    fit: "cover" | "contain"
    style?: CSSProperties
}

export default function LUTGrade(props: Props) {
    const {
        mediaType = "image",
        image,
        videoFile,
        autoPlay = true,
        loop = true,
        lutFile,
        intensity = 100,
        compare = "none",
        sliderStart = 50,
        lineWidth = 2,
        lineColor = "#FFFFFF",
        handle,
        hoverDuration = 0.4,
        fit = "cover",
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const [focusVisible, setFocusVisible] = useState(false)
    const rawMediaSrc = mediaType === "video" ? videoFile : image?.src
    const mediaSrc = isFramerAsset(rawMediaSrc) ? rawMediaSrc : undefined
    const safeLut = isFramerAsset(lutFile) ? lutFile : undefined
    const blockedSource =
        (!!rawMediaSrc && !mediaSrc) || (!!lutFile && !safeLut)
            ? "Only files uploaded to Framer are supported."
            : null
    const handleNode = Array.isArray(handle) ? handle[0] : handle

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<GLState | null>(null)
    const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null)
    const lutRef = useRef<CubeLUT | null>(null)
    const mixRef = useRef(1)
    const animRef = useRef(0)
    const draggingRef = useRef(false)
    const drawRef = useRef<() => void>(() => {})

    const [noGL, setNoGL] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [split, setSplit] = useState(sliderStart)

    const splitRef = useRef(0)
    const lineRef = useRef<HTMLDivElement>(null)
    const handleRef = useRef<HTMLDivElement>(null)
    if (!draggingRef.current)
        splitRef.current = compare === "slider" ? split / 100 : 0
    const settingsRef = useRef({ intensity, fit })
    settingsRef.current = { intensity, fit }

    drawRef.current = () => {
        const s = glRef.current
        const canvas = canvasRef.current
        if (!s || !canvas) return
        const { gl, u } = s

        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w
            canvas.height = h
        }
        gl.viewport(0, 0, w, h)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        const media = mediaRef.current
        if (!media) return
        const isVideo = media instanceof HTMLVideoElement
        const mw = isVideo ? media.videoWidth : media.naturalWidth
        const mh = isVideo ? media.videoHeight : media.naturalHeight
        if (!mw || !mh) return
        if (isVideo && media.readyState < 2) return

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, s.mediaTex)
        try {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                media
            )
        } catch {
            startTransition(() =>
                setError(
                    "Media blocked (CORS). Please upload the file directly to Framer."
                )
            )
            return
        }

        const ca = w / h
        const ma = mw / mh
        let sx = 1
        let sy = 1
        if (settingsRef.current.fit === "cover") {
            if (ma > ca) sx = ca / ma
            else sy = ma / ca
        } else {
            if (ma > ca) sy = ma / ca
            else sx = ca / ma
        }
        gl.uniform2f(u.uScale, sx, sy)

        const lut = lutRef.current
        const has1 = !!lut?.data1
        const has3 = !!lut?.data3
        gl.uniform1f(u.uHas1, has1 ? 1 : 0)
        gl.uniform1f(u.uHas3, has3 ? 1 : 0)
        if (lut && has3) {
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_3D, s.lutTex)
            gl.uniform1f(u.uSize3, lut.size3)
            gl.uniform3f(u.uMin3, ...lut.min3)
            gl.uniform3f(u.uMax3, ...lut.max3)
        }
        if (lut && has1) {
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, s.lut1Tex)
            gl.uniform1f(u.uSize1, lut.size1)
            gl.uniform3f(u.uMin1, ...lut.min1)
            gl.uniform3f(u.uMax1, ...lut.max1)
        }
        gl.uniform1f(
            u.uIntensity,
            (settingsRef.current.intensity / 100) * mixRef.current
        )
        gl.uniform1f(u.uSplit, splitRef.current)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl2", {
            alpha: true,
            premultipliedAlpha: true,
        })
        if (!gl) {
            startTransition(() => setNoGL(true))
            return
        }

        let prog: WebGLProgram
        try {
            prog = gl.createProgram()!
            gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
            gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
            gl.linkProgram(prog)
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(prog) || "Link error")
            }
        } catch {
            startTransition(() => setNoGL(true))
            return
        }
        gl.useProgram(prog)

        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
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

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)

        const mediaTex = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, mediaTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        const lutTex = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_3D, lutTex)
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE)

        const lut1Tex = gl.createTexture()!
        gl.activeTexture(gl.TEXTURE2)
        gl.bindTexture(gl.TEXTURE_2D, lut1Tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        const u: GLState["u"] = {}
        for (const name of [
            "uMedia",
            "uLut1",
            "uLut3",
            "uHas1",
            "uHas3",
            "uSize1",
            "uSize3",
            "uMin1",
            "uMax1",
            "uMin3",
            "uMax3",
            "uIntensity",
            "uSplit",
            "uScale",
        ]) {
            u[name] = gl.getUniformLocation(prog, name)
        }
        gl.uniform1i(u.uMedia, 0)
        gl.uniform1i(u.uLut3, 1)
        gl.uniform1i(u.uLut1, 2)

        glRef.current = { gl, mediaTex, lutTex, lut1Tex, u }

        if (lutRef.current) uploadLut(glRef.current, lutRef.current)

        const ro = new ResizeObserver(() => drawRef.current())
        ro.observe(canvas)
        drawRef.current()

        return () => {
            ro.disconnect()
            glRef.current = null
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        if (!safeLut) {
            lutRef.current = null
            startTransition(() => setError(null))
            drawRef.current()
            return
        }
        fetch(safeLut)
            .then((r) => {
                if (!r.ok) throw new Error(`Could not load LUT (${r.status}).`)
                return r.text()
            })
            .then((text) => {
                if (cancelled) return
                const lut = parseCube(text)
                lutRef.current = lut
                if (glRef.current) uploadLut(glRef.current, lut)
                startTransition(() => setError(null))
                drawRef.current()
            })
            .catch((e: Error) => {
                if (cancelled) return
                lutRef.current = null
                startTransition(() => setError(e.message))
                drawRef.current()
            })
        return () => {
            cancelled = true
        }
    }, [safeLut])

    useEffect(() => {
        if (!mediaSrc) {
            mediaRef.current = null
            drawRef.current()
            return
        }
        let alive = true

        if (mediaType === "image") {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (!alive) return
                mediaRef.current = img
                drawRef.current()
            }
            img.onerror = () => {
                if (alive)
                    startTransition(() => setError("Could not load image."))
            }
            img.src = mediaSrc
            return () => {
                alive = false
            }
        }

        const v = document.createElement("video")
        v.crossOrigin = "anonymous"
        v.muted = true
        v.playsInline = true
        v.setAttribute("playsinline", "")
        v.loop = loop
        v.preload = "auto"
        v.src = mediaSrc
        mediaRef.current = v

        if (isStatic) {
            v.loop = false
            v.autoplay = false
            v.addEventListener("loadeddata", () => {
                if (alive) drawRef.current()
            })
            v.addEventListener("error", () => {
                if (alive)
                    startTransition(() => setError("Could not load video."))
            })
            return () => {
                alive = false
                v.removeAttribute("src")
                v.load()
                if (mediaRef.current === v) mediaRef.current = null
            }
        }

        let raf = 0
        let vfc = 0
        let running = false
        const hasVFC = "requestVideoFrameCallback" in v
        const tick = () => {
            if (!alive || !running) return
            drawRef.current()
            if (hasVFC) vfc = (v as any).requestVideoFrameCallback(tick)
            else raf = requestAnimationFrame(tick)
        }
        const startLoop = () => {
            if (running || !alive) return
            running = true
            tick()
        }
        const stopLoop = () => {
            running = false
            cancelAnimationFrame(raf)
            if (vfc && hasVFC) (v as any).cancelVideoFrameCallback(vfc)
            vfc = 0
        }
        const drawOnce = () => {
            if (alive) drawRef.current()
        }
        v.addEventListener("playing", startLoop)
        v.addEventListener("pause", stopLoop)
        v.addEventListener("ended", stopLoop)
        v.addEventListener("waiting", stopLoop)
        v.addEventListener("loadeddata", drawOnce)
        v.addEventListener("seeked", drawOnce)
        v.addEventListener("error", () => {
            if (alive) startTransition(() => setError("Could not load video."))
        })

        const onVisibility = () => {
            if (document.hidden) v.pause()
            else if (inView && autoPlay && !isCanvas) v.play().catch(() => {})
        }
        let inView = false
        document.addEventListener("visibilitychange", onVisibility)

        let io: IntersectionObserver | null = null
        if (autoPlay && !isCanvas && wrapRef.current) {
            io = new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting
                if (inView && !document.hidden) v.play().catch(() => {})
                else v.pause()
            })
            io.observe(wrapRef.current)
        }

        return () => {
            alive = false
            stopLoop()
            document.removeEventListener("visibilitychange", onVisibility)
            io?.disconnect()
            v.pause()
            v.removeAttribute("src")
            v.load()
            if (mediaRef.current === v) mediaRef.current = null
        }
    }, [mediaSrc, mediaType, loop, autoPlay, isCanvas, isStatic])

    useEffect(() => {
        startTransition(() => setSplit(sliderStart))
    }, [sliderStart])

    useEffect(() => {
        if (compare !== "hover") {
            cancelAnimationFrame(animRef.current)
            mixRef.current = 1
        }
        drawRef.current()
    }, [intensity, fit, compare, split])

    useEffect(() => () => cancelAnimationFrame(animRef.current), [])

    const animateMix = (target: number) => {
        cancelAnimationFrame(animRef.current)
        const duration = Math.max(0.01, hoverDuration) * 1000
        const from = mixRef.current
        const t0 = performance.now()
        const step = (t: number) => {
            const p = Math.min(1, (t - t0) / duration)
            const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
            mixRef.current = from + (target - from) * e
            drawRef.current()
            if (p < 1) animRef.current = requestAnimationFrame(step)
        }
        animRef.current = requestAnimationFrame(step)
    }

    const applySplit = (p: number) => {
        splitRef.current = p / 100
        if (lineRef.current) lineRef.current.style.left = `${p}%`
        if (handleRef.current) {
            handleRef.current.style.left = `${p}%`
            handleRef.current.setAttribute(
                "aria-valuenow",
                String(Math.round(p))
            )
            handleRef.current.setAttribute("aria-valuetext", valueText(p))
        }
        drawRef.current()
    }

    const updateSplit = (clientX: number) => {
        const rect = wrapRef.current?.getBoundingClientRect()
        if (!rect || !rect.width) return
        applySplit(
            Math.min(
                100,
                Math.max(0, ((clientX - rect.left) / rect.width) * 100)
            )
        )
    }

    const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (compare !== "slider") return
        e.preventDefault()
        e.stopPropagation()
        draggingRef.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        e.currentTarget.focus({ preventScroll: true })
    }
    const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (draggingRef.current) updateSplit(e.clientX)
    }
    const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        setSplit(splitRef.current * 100)
    }
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (compare === "hover" && e.pointerType !== "mouse") {
            animateMix(mixRef.current > 0.5 ? 0 : 1)
        }
    }
    const onPointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
        if (compare === "hover" && e.pointerType === "mouse") animateMix(0)
    }
    const onPointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
        if (compare === "hover" && e.pointerType === "mouse") animateMix(1)
    }
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const cur = splitRef.current * 100
        let p: number | null = null
        switch (e.key) {
            case "ArrowLeft":
            case "ArrowDown":
                p = cur - 2
                break
            case "ArrowRight":
            case "ArrowUp":
                p = cur + 2
                break
            case "PageDown":
                p = cur - 10
                break
            case "PageUp":
                p = cur + 10
                break
            case "Home":
                p = 0
                break
            case "End":
                p = 100
                break
        }
        if (p === null) return
        e.preventDefault()
        p = Math.min(100, Math.max(0, p))
        applySplit(p)
        setSplit(p)
    }

    const fill: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block",
    }

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
                touchAction: "auto",
            }}
            onPointerDown={onPointerDown}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
        >
            {noGL ? (
                mediaType === "video" && mediaSrc ? (
                    <video
                        src={mediaSrc}
                        autoPlay={autoPlay && !isCanvas && !isStatic}
                        loop={loop}
                        muted
                        playsInline
                        style={{ ...fill, objectFit: fit }}
                    />
                ) : mediaSrc ? (
                    <img
                        src={mediaSrc}
                        alt={image?.alt || ""}
                        style={{ ...fill, objectFit: fit }}
                    />
                ) : null
            ) : (
                <canvas
                    ref={canvasRef}
                    style={fill}
                    role="img"
                    aria-label={image?.alt || "Color graded media"}
                />
            )}

            {compare === "slider" && !noGL && (
                <>
                    {lineWidth > 0 && (
                        <div
                            ref={lineRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: `${split}%`,
                                width: lineWidth,
                                transform: "translateX(-50%)",
                                background: lineColor,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                    <div
                        ref={handleRef}
                        role="slider"
                        tabIndex={0}
                        aria-label="Before/after comparison"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(split)}
                        aria-valuetext={valueText(split)}
                        aria-orientation="horizontal"
                        onKeyDown={onKeyDown}
                        onPointerDown={onHandlePointerDown}
                        onPointerMove={onHandlePointerMove}
                        onPointerUp={onHandlePointerUp}
                        onPointerCancel={onHandlePointerUp}
                        onFocus={(e) => {
                            let visible = true
                            try {
                                visible =
                                    e.currentTarget.matches(":focus-visible")
                            } catch {}
                            setFocusVisible(visible)
                        }}
                        onBlur={() => setFocusVisible(false)}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: `${split}%`,
                            transform: "translate(-50%, -50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 44,
                            minHeight: 44,
                            cursor: "ew-resize",
                            touchAction: "none",
                            outline: focusVisible
                                ? `2px solid ${lineColor}`
                                : "none",
                            outlineOffset: 4,
                            boxShadow: focusVisible
                                ? "0 0 0 6px rgba(0,0,0,0.55)"
                                : undefined,
                            borderRadius: focusVisible ? 8 : undefined,
                            pointerEvents: "auto",
                        }}
                    >
                        {handleNode ? (
                            <div
                                style={{
                                    pointerEvents: "none",
                                    display: "flex",
                                }}
                            >
                                {handleNode}
                            </div>
                        ) : (
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    border: `2px solid ${lineColor}`,
                                    background: "rgba(0,0,0,0.3)",
                                    backdropFilter: "blur(6px)",
                                    WebkitBackdropFilter: "blur(6px)",
                                }}
                            />
                        )}
                    </div>
                </>
            )}

            {isCanvas && (!mediaSrc || error || blockedSource) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                        textAlign: "center",
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 13,
                        lineHeight: 1.4,
                        color: error || blockedSource ? "#ff6b6b" : "#999",
                        background: mediaSrc
                            ? "rgba(0,0,0,0.6)"
                            : "rgba(128,128,128,0.08)",
                        pointerEvents: "none",
                    }}
                >
                    {blockedSource ??
                        error ??
                        "Choose an image or video and a .cube LUT in the properties panel."}
                </div>
            )}
        </div>
    )
}

function valueText(p: number) {
    const original = Math.round(p)
    return `${original}% original, ${100 - original}% graded`
}

function uploadLut(s: GLState, lut: CubeLUT) {
    const { gl } = s
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    if (lut.data3) {
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_3D, s.lutTex)
        gl.texImage3D(
            gl.TEXTURE_3D,
            0,
            gl.RGB16F,
            lut.size3,
            lut.size3,
            lut.size3,
            0,
            gl.RGB,
            gl.FLOAT,
            lut.data3
        )
    }
    if (lut.data1) {
        gl.activeTexture(gl.TEXTURE2)
        gl.bindTexture(gl.TEXTURE_2D, s.lut1Tex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB16F,
            lut.size1,
            1,
            0,
            gl.RGB,
            gl.FLOAT,
            lut.data1
        )
    }
}

addPropertyControls(LUTGrade, {
    mediaType: {
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
        hidden: (p: Props) => p.mediaType !== "image",
    },
    videoFile: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (p: Props) => p.mediaType !== "video",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        hidden: (p: Props) => p.mediaType !== "video",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (p: Props) => p.mediaType !== "video",
    },
    lutFile: {
        type: ControlType.File,
        title: "LUT (.cube)",
        allowedFileTypes: ["cube"],
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 100,
    },
    compare: {
        type: ControlType.Enum,
        title: "Compare",
        options: ["none", "slider", "hover"],
        optionTitles: ["Off", "Slider", "Hover"],
        defaultValue: "none",
        displaySegmentedControl: true,
    },
    sliderStart: {
        type: ControlType.Number,
        title: "Start",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 50,
        hidden: (p: Props) => p.compare !== "slider",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        defaultValue: 2,
        hidden: (p: Props) => p.compare !== "slider",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#FFFFFF",
        hidden: (p: Props) => p.compare !== "slider",
    },
    handle: {
        type: ControlType.ComponentInstance,
        title: "Handle",
        hidden: (p: Props) => p.compare !== "slider",
    },
    hoverDuration: {
        type: ControlType.Number,
        title: "Transition",
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.4,
        hidden: (p: Props) => p.compare !== "hover",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        description: "An out of storage component.",
    },
})
