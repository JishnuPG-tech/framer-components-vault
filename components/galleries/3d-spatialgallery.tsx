// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

/* ------------------------------------------------------------------ */
/* No external modules                                                 */
/* ------------------------------------------------------------------ */

/* This component previously imported three.js at runtime. Everything it
   used (perspective camera, textured planes, video textures, raycasting)
   is now written directly against WebGL below, so the file ships as a
   single self-contained module with no third party code fetched at
   runtime. */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TWO_PI = Math.PI * 2

const clamp = (v: number, min: number, max: number) =>
    v < min ? min : v > max ? max : v

// Deterministic pseudo random so server and client render identically.
const seeded = (i: number, salt: number) => {
    const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
    return s - Math.floor(s)
}

const isVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || "")

const isImage = (url: string) =>
    /\.(jpg|jpeg|png|webp|avif|gif)(\?|#|$)/i.test(url || "")

const prefersReducedMotion = () => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/* ------------------------------------------------------------------ */
/* Minimal 4x4 matrix maths (column major, same layout as WebGL)       */
/* ------------------------------------------------------------------ */

const mat4 = () => new Float32Array(16)

const perspective = (
    out: Float32Array,
    fovDeg: number,
    aspect: number,
    near: number,
    far: number
) => {
    const f = 1 / Math.tan((fovDeg * Math.PI) / 360)
    out[0] = f / aspect
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 0
    out[5] = f
    out[6] = 0
    out[7] = 0
    out[8] = 0
    out[9] = 0
    out[10] = (far + near) / (near - far)
    out[11] = -1
    out[12] = 0
    out[13] = 0
    out[14] = (2 * far * near) / (near - far)
    out[15] = 0
    return out
}

const multiply = (out: Float32Array, a: Float32Array, b: Float32Array) => {
    for (let c = 0; c < 4; c++) {
        const b0 = b[c * 4]
        const b1 = b[c * 4 + 1]
        const b2 = b[c * 4 + 2]
        const b3 = b[c * 4 + 3]
        out[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3
        out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3
        out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3
        out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3
    }
    return out
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface GalleryItem {
    url?: string
    file?: string
    poster?: { src?: string }
    alt?: string
    link?: string
}

interface Props {
    items: GalleryItem[]
    background: string
    objectWidth: number
    objectHeight: number
    objectFit: "cover" | "contain"
    radius: number
    facing: "front" | "funnel"
    funnelAmount: number
    particleCount: number
    hollowCenter: number
    spread: number
    verticalSquash: number
    scrollCapture: boolean
    scrollSpeed: number
    dragToMove: boolean
    depthRange: number
    spiralMotion: boolean
    spiralTurns: number
    spiralRadius: number
    autoMotion: boolean
    autoSpeed: number
    autoDirection: "forward" | "backward"
    mouseInteraction: boolean
    mouseSensitivity: number
    linkTarget: "same" | "new"
    reducedMotion: boolean
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const VERT = `
    attribute vec2 aPos;
    attribute vec2 aUv;
    uniform mat4 uMVP;
    varying vec2 vUv;
    void main() {
        vUv = aUv;
        gl_Position = uMVP * vec4(aPos, 0.0, 1.0);
    }
`

// Corner radius is normalised against the shorter plane edge.
const FRAG = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 vUv;
    uniform sampler2D uMap;
    uniform vec2 uRepeat;
    uniform vec2 uOffset;
    uniform float uOpacity;
    uniform float uRadius;
    uniform float uAspect;
    uniform float uHasMap;

    float roundedMask(vec2 uv, float r, float aspect) {
        vec2 p = vec2(uv.x * aspect, uv.y);
        vec2 halfSize = vec2(aspect, 1.0) * 0.5;
        vec2 c = p - halfSize;
        vec2 q = abs(c) - (halfSize - vec2(r));
        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        return 1.0 - smoothstep(-0.004, 0.004, d);
    }

    void main() {
        vec2 uv = vUv * uRepeat + uOffset;
        vec4 sampled = texture2D(uMap, uv);
        vec4 tex = mix(vec4(0.898, 0.898, 0.898, 1.0), sampled, uHasMap);
        float mask = roundedMask(vUv, uRadius, uAspect);
        float a = tex.a * uOpacity * mask;
        if (a <= 0.001) discard;
        gl_FragColor = vec4(tex.rgb, a);
    }
`

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function SpiralGallery({
    items = [],
    background = "#FFFFFF",
    objectWidth = 3.2,
    objectHeight = 1.9,
    objectFit = "cover",
    radius = 0.08,
    facing = "front",
    funnelAmount = 1,
    particleCount = 60,
    hollowCenter = 1.4,
    spread = 2.4,
    verticalSquash = 0.8,
    scrollCapture = true,
    scrollSpeed = 1,
    dragToMove = true,
    depthRange = 60,
    spiralMotion = false,
    spiralTurns = 2,
    spiralRadius = 1.6,
    autoMotion = false,
    autoSpeed = 1,
    autoDirection = "forward",
    mouseInteraction = true,
    mouseSensitivity = 1.2,
    linkTarget = "same",
    reducedMotion = true,
    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const mountRef = useRef<HTMLDivElement | null>(null)

    // Live props inside the render loop without re-creating the scene.
    const live = useRef({
        objectFit,
        scrollCapture,
        scrollSpeed,
        dragToMove,
        depthRange,
        mouseInteraction,
        mouseSensitivity,
        spiralMotion,
        spiralTurns,
        spiralRadius,
        autoMotion,
        autoSpeed,
        autoDirection,
        facing,
        funnelAmount,
        hollowCenter,
        linkTarget,
        reducedMotion,
    })
    live.current = {
        objectFit,
        scrollCapture,
        scrollSpeed,
        dragToMove,
        depthRange,
        mouseInteraction,
        mouseSensitivity,
        spiralMotion,
        spiralTurns,
        spiralRadius,
        autoMotion,
        autoSpeed,
        autoDirection,
        facing,
        funnelAmount,
        hollowCenter,
        linkTarget,
        reducedMotion,
    }

    const list = (items || []).filter((it) => it && (it.url || it.file))
    const signature = JSON.stringify(
        list.map((it) => [it.url, it.file, it.poster?.src, it.link, it.alt])
    )

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const mount = mountRef.current
        if (!mount) return
        if (list.length === 0) return

        /* -------------------------------------------------- */
        /* Canvas and GL context                               */
        /* -------------------------------------------------- */

        const canvas = document.createElement("canvas")
        canvas.style.display = "block"
        canvas.style.width = "100%"
        canvas.style.height = "100%"

        const attrs: WebGLContextAttributes = {
            alpha: true,
            antialias: true,
            depth: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        }

        const gl = (canvas.getContext("webgl", attrs) ||
            canvas.getContext(
                "experimental-webgl",
                attrs
            )) as WebGLRenderingContext | null

        // No WebGL on this device. The SEO list below still renders.
        if (!gl) return

        mount.appendChild(canvas)

        /* -------------------------------------------------- */
        /* Program                                             */
        /* -------------------------------------------------- */

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)!
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            return sh
        }

        const program = gl.createProgram()!
        const vs = compile(gl.VERTEX_SHADER, VERT)
        const fs = compile(gl.FRAGMENT_SHADER, FRAG)
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
            if (canvas.parentNode === mount) mount.removeChild(canvas)
            return
        }

        gl.useProgram(program)

        const aPos = gl.getAttribLocation(program, "aPos")
        const aUv = gl.getAttribLocation(program, "aUv")
        const uMVP = gl.getUniformLocation(program, "uMVP")
        const uMap = gl.getUniformLocation(program, "uMap")
        const uRepeat = gl.getUniformLocation(program, "uRepeat")
        const uOffset = gl.getUniformLocation(program, "uOffset")
        const uOpacity = gl.getUniformLocation(program, "uOpacity")
        const uRadius = gl.getUniformLocation(program, "uRadius")
        const uAspect = gl.getUniformLocation(program, "uAspect")
        const uHasMap = gl.getUniformLocation(program, "uHasMap")

        // Unit quad. v runs 0 at the bottom, matching flipped texture uploads.
        const quad = new Float32Array([
            -0.5, -0.5, 0, 0, 0.5, -0.5, 1, 0, -0.5, 0.5, 0, 1, 0.5, 0.5, 1, 1,
        ])
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
        gl.enableVertexAttribArray(aUv)
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8)

        gl.disable(gl.DEPTH_TEST)
        gl.disable(gl.CULL_FACE)
        gl.enable(gl.BLEND)
        gl.blendFuncSeparate(
            gl.SRC_ALPHA,
            gl.ONE_MINUS_SRC_ALPHA,
            gl.ONE,
            gl.ONE_MINUS_SRC_ALPHA
        )
        gl.clearColor(0, 0, 0, 0)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
        gl.uniform1i(uMap, 0)
        gl.activeTexture(gl.TEXTURE0)

        // Bound whenever a plane has no texture yet, so the sampler always
        // points at something valid.
        const blankTex = gl.createTexture()!
        gl.bindTexture(gl.TEXTURE_2D, blankTex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([229, 229, 229, 255])
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        const makeTexture = () => {
            const t = gl.createTexture()!
            gl.bindTexture(gl.TEXTURE_2D, t)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            return t
        }

        /* -------------------------------------------------- */
        /* Geometry constants                                  */
        /* -------------------------------------------------- */

        const planeAspect = objectWidth / objectHeight
        const normalisedRadius = clamp(
            radius / Math.min(objectWidth, objectHeight),
            0,
            0.5
        )

        gl.uniform1f(uRadius, normalisedRadius)
        gl.uniform1f(uAspect, planeAspect)

        /* -------------------------------------------------- */
        /* Texture cache and lazy video creation               */
        /* -------------------------------------------------- */

        const posterCache = new Map<
            string,
            { tex: WebGLTexture; w: number; h: number }
        >()
        const videoCache = new Map<
            string,
            { el: HTMLVideoElement; tex: WebGLTexture }
        >()

        let disposed = false

        const applyFit = (m: any, tw: number, th: number) => {
            if (!tw || !th) return
            m.texW = tw
            m.texH = th
            const texAspect = tw / th
            if (live.current.objectFit === "cover") {
                let rx = 1
                let ry = 1
                if (texAspect > planeAspect) rx = planeAspect / texAspect
                else ry = texAspect / planeAspect
                m.repeatX = rx
                m.repeatY = ry
                m.offsetX = (1 - rx) / 2
                m.offsetY = (1 - ry) / 2
                m.scaleX = 1
                m.scaleY = 1
            } else {
                // Contain: keep full texture, shrink the plane to its aspect.
                m.repeatX = 1
                m.repeatY = 1
                m.offsetX = 0
                m.offsetY = 0
                if (texAspect > planeAspect) {
                    m.scaleX = 1
                    m.scaleY = planeAspect / texAspect
                } else {
                    m.scaleX = texAspect / planeAspect
                    m.scaleY = 1
                }
            }
        }

        const loadPoster = (m: any) => {
            const src = m.posterSrc
            if (!src) return
            const cached = posterCache.get(src)
            if (cached) {
                m.posterTex = cached.tex
                m.tex = cached.tex
                m.hasMap = 1
                applyFit(m, cached.w, cached.h)
                return
            }
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (disposed) return
                const tex = makeTexture()
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    img
                )
                const entry = {
                    tex,
                    w: img.naturalWidth,
                    h: img.naturalHeight,
                }
                posterCache.set(src, entry)
                m.posterTex = tex
                if (!m.playing) {
                    m.tex = tex
                    m.hasMap = 1
                    applyFit(m, entry.w, entry.h)
                }
            }
            img.onerror = () => {}
            img.src = src
        }

        // Videos are only created on first hover, so a long item list never
        // spawns dozens of decoders on load.
        const ensureVideo = (m: any) => {
            const src = m.videoSrc
            if (!src) return null
            const cached = videoCache.get(src)
            if (cached) return cached

            const el = document.createElement("video")
            el.src = src
            el.crossOrigin = "anonymous"
            el.muted = true
            el.loop = true
            el.playsInline = true
            el.preload = "auto"
            el.setAttribute("playsinline", "")
            el.setAttribute("muted", "")

            const entry = { el, tex: makeTexture() }
            videoCache.set(src, entry)
            return entry
        }

        /* -------------------------------------------------- */
        /* Build planes                                        */
        /* -------------------------------------------------- */

        const count = Math.max(1, Math.round(particleCount))
        const meshes: any[] = []

        // Planes are laid out as a ring, not a filled box. Everything sits
        // between an inner and an outer radius, which is what keeps the
        // middle of the tunnel clear.
        const ringInner = objectWidth * hollowCenter
        const ringOuter = ringInner + objectWidth * spread

        for (let i = 0; i < count; i++) {
            const source = list[i % list.length]
            const url = source.url || source.file || ""
            const posterSrc = source.poster?.src || ""

            // sqrt fills the ring evenly by area instead of crowding
            // everything against the inner edge.
            const angle = seeded(i, 1) * TWO_PI
            const rr =
                ringInner + Math.sqrt(seeded(i, 2)) * (ringOuter - ringInner)
            const baseX = Math.cos(angle) * rr
            const baseY = Math.sin(angle) * rr * verticalSquash

            meshes.push({
                index: i,
                x: baseX,
                y: baseY,
                z: -depthRange * ((i + 0.5) / count),
                scaleX: 1,
                scaleY: 1,
                repeatX: 1,
                repeatY: 1,
                offsetX: 0,
                offsetY: 0,
                opacity: 0,
                hasMap: 0,
                tex: null as WebGLTexture | null,
                texW: 0,
                texH: 0,
                // Orientation basis, rebuilt every frame.
                ax: [1, 0, 0],
                ay: [0, 1, 0],
                az: [0, 0, 1],
                model: mat4(),
                mvp: mat4(),
                videoSrc: isVideo(url) ? url : "",
                imageSrc: isVideo(url) ? "" : url,
                posterSrc: posterSrc || (isVideo(url) ? "" : url),
                link: source.link || "",
                alt: source.alt || "",
                playing: false,
                posterTex: null as WebGLTexture | null,
                // Ring layout is kept so the spiral toggle stays reversible
                // at any time without rebuilding the scene.
                baseX,
                baseY,
                spiralAngle: angle,
                spiralJitter: seeded(i, 4),
            })
        }

        // Load the still frame for every plane. This is the only network
        // cost on first paint; video bytes wait for hover.
        meshes.forEach(loadPoster)

        const order = meshes.slice()

        /* -------------------------------------------------- */
        /* Scroll, drag, pointer, hover                        */
        /* -------------------------------------------------- */

        let targetScroll = 0
        let currentScroll = 0
        let prevScroll = 0
        let pointerX = 0
        let pointerY = 0
        let smoothX = 0
        let smoothY = 0
        let hovered: any = null
        let visible = true
        let contextLost = false
        let dragging = false
        let dragMoved = 0
        let dragLastY = 0
        let ndcX = 2 // offscreen until first move
        let ndcY = 2
        let lastFit = live.current.objectFit

        // Scroll capture off means the page keeps its own scrolling and the
        // gallery is driven by drag, auto motion, or both.
        const onWheel = (e: WheelEvent) => {
            if (!live.current.scrollCapture) return
            e.preventDefault()
            targetScroll += e.deltaY * live.current.scrollSpeed * 0.01
        }

        let touchLast = 0
        const onTouchStart = (e: TouchEvent) => {
            touchLast = e.touches[0]?.clientY ?? 0
        }
        const onTouchMove = (e: TouchEvent) => {
            if (!live.current.scrollCapture && !live.current.dragToMove) return
            const y = e.touches[0]?.clientY ?? 0
            targetScroll += (touchLast - y) * live.current.scrollSpeed * 0.03
            touchLast = y
        }

        const onPointerDown = (e: PointerEvent) => {
            if (!live.current.dragToMove) return
            if (e.pointerType === "touch") return // touch handlers own this
            dragging = true
            dragMoved = 0
            dragLastY = e.clientY
            mount.style.cursor = "grabbing"
            try {
                mount.setPointerCapture(e.pointerId)
            } catch (err) {}
        }

        const endDrag = (e: PointerEvent) => {
            if (!dragging) return
            dragging = false
            mount.style.cursor = hovered && hovered.link ? "pointer" : "grab"
            try {
                mount.releasePointerCapture(e.pointerId)
            } catch (err) {}
        }

        const onPointerMove = (e: PointerEvent) => {
            const rect = mount.getBoundingClientRect()
            const nx = (e.clientX - rect.left) / rect.width
            const ny = (e.clientY - rect.top) / rect.height
            pointerX = nx * 2 - 1
            pointerY = -(ny * 2 - 1)
            ndcX = pointerX
            ndcY = pointerY

            if (dragging) {
                const dy = dragLastY - e.clientY
                dragMoved += Math.abs(dy)
                targetScroll += dy * live.current.scrollSpeed * 0.04
                dragLastY = e.clientY
            }
        }

        const onPointerLeave = () => {
            ndcX = 2
            ndcY = 2
            pointerX = 0
            pointerY = 0
        }

        const onClick = () => {
            if (dragMoved > 6) return // this was a drag, not a click
            const link = hovered?.link
            if (!link) return
            if (live.current.linkTarget === "new") {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.open(link, "_self")
            }
        }

        const onContextLost = (e: Event) => {
            e.preventDefault()
            contextLost = true
        }
        const onContextRestored = () => {
            contextLost = false
        }

        mount.addEventListener("wheel", onWheel, { passive: false })
        mount.addEventListener("touchstart", onTouchStart, { passive: true })
        mount.addEventListener("touchmove", onTouchMove, { passive: true })
        mount.addEventListener("pointerdown", onPointerDown)
        mount.addEventListener("pointermove", onPointerMove)
        mount.addEventListener("pointerup", endDrag)
        mount.addEventListener("pointercancel", endDrag)
        mount.addEventListener("pointerleave", onPointerLeave)
        mount.addEventListener("click", onClick)
        canvas.addEventListener("webglcontextlost", onContextLost)
        canvas.addEventListener("webglcontextrestored", onContextRestored)

        const startVideo = (m: any) => {
            const entry = ensureVideo(m)
            if (!entry) return
            // The texture stays on the poster until the first frame is
            // actually uploaded, so the plane never flashes empty.
            m.playing = true
            const p = entry.el.play()
            if (p && typeof p.catch === "function") p.catch(() => {})
            const w = entry.el.videoWidth
            const h = entry.el.videoHeight
            if (w && h) applyFit(m, w, h)
            else
                entry.el.addEventListener(
                    "loadedmetadata",
                    () =>
                        applyFit(m, entry.el.videoWidth, entry.el.videoHeight),
                    { once: true }
                )
        }

        const stopVideo = (m: any) => {
            m.playing = false
            const entry = videoCache.get(m.videoSrc)
            if (entry) entry.el.pause()
            if (m.posterTex) {
                m.tex = m.posterTex
                m.hasMap = 1
                const cached = posterCache.get(m.posterSrc)
                if (cached) applyFit(m, cached.w, cached.h)
            } else {
                m.tex = null
                m.hasMap = 0
            }
        }

        /* -------------------------------------------------- */
        /* Resize, visibility, tab focus                       */
        /* -------------------------------------------------- */

        const projection = mat4()
        const view = mat4()
        const viewProj = mat4()
        let aspect = 1
        const FOV = 55

        const resize = () => {
            const w = mount.clientWidth || 1
            const h = mount.clientHeight || 1
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            gl.viewport(0, 0, canvas.width, canvas.height)
            aspect = w / h
            perspective(
                projection,
                FOV,
                aspect,
                0.1,
                live.current.depthRange + 60
            )
        }

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(resize)
            ro.observe(mount)
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    visible = entries[0]?.isIntersecting ?? true
                    if (!visible) videoCache.forEach((v) => v.el.pause())
                },
                { threshold: 0.01 }
            )
            io.observe(mount)
        }

        // Stop burning GPU while the tab is in the background.
        let tabActive = true
        const onVisibility = () => {
            tabActive = document.visibilityState !== "hidden"
            if (!tabActive) videoCache.forEach((v) => v.el.pause())
        }
        document.addEventListener("visibilitychange", onVisibility)

        /* -------------------------------------------------- */
        /* Render loop                                         */
        /* -------------------------------------------------- */

        const NEAR_CUT = 4 // z past the camera where a plane recycles
        const reduced = prefersReducedMotion()
        let raf = 0
        let last = performance.now()

        const tick = () => {
            raf = requestAnimationFrame(tick)
            const now = performance.now()
            const dt = Math.min((now - last) / 16.667, 3)
            last = now

            if (!visible || !tabActive || contextLost) return
            if (gl.isContextLost && gl.isContextLost()) return

            // Fit can change on canvas without rebuilding the scene.
            if (live.current.objectFit !== lastFit) {
                lastFit = live.current.objectFit
                for (let i = 0; i < meshes.length; i++) {
                    const m = meshes[i]
                    if (m.texW && m.texH) applyFit(m, m.texW, m.texH)
                }
            }

            // Ambient drift feeds the same scroll value the wheel writes to,
            // so manual scrolling and auto motion simply add together. It is
            // skipped entirely when the visitor asks for reduced motion.
            const allowAuto =
                live.current.autoMotion &&
                !(live.current.reducedMotion && reduced)
            if (allowAuto) {
                const dir = live.current.autoDirection === "backward" ? -1 : 1
                targetScroll += live.current.autoSpeed * dir * 0.06 * dt
            }

            // Eased scroll travel along Z.
            currentScroll += (targetScroll - currentScroll) * 0.08 * dt
            const delta = currentScroll - prevScroll
            prevScroll = currentScroll

            const range = live.current.depthRange
            const spiralOn = live.current.spiralMotion
            const turns = live.current.spiralTurns
            // The corkscrew can never be tighter than the hollow core, or it
            // would fill the middle that the ring layout keeps clear.
            const spiralR =
                Math.max(live.current.spiralRadius, live.current.hollowCenter) *
                objectWidth
            const frontFacing = live.current.facing === "front"
            // 1 turns each plane fully inward so it lines the tube wall.
            // 0 collapses back to front facing.
            const rad =
                (1 - clamp(live.current.funnelAmount, 0, 1)) * Math.PI * 0.5
            const ca = Math.cos(rad)
            const sa = Math.sin(rad)

            for (let i = 0; i < meshes.length; i++) {
                const m = meshes[i]
                m.z += delta

                // Infinite Z looping in both directions.
                if (m.z > NEAR_CUT) {
                    m.z -= range + NEAR_CUT
                } else if (m.z < -range) {
                    m.z += range + NEAR_CUT
                }

                const z = m.z

                // Spiral: X and Y are derived from depth, so planes corkscrew
                // toward the camera. Off means the ring layout is restored.
                if (spiralOn) {
                    const angle = m.spiralAngle + (z / range) * turns * TWO_PI
                    const r = spiralR * (0.7 + 0.6 * m.spiralJitter)
                    m.x = Math.cos(angle) * r
                    m.y = Math.sin(angle) * r * verticalSquash
                } else {
                    m.x = m.baseX
                    m.y = m.baseY
                }

                // Facing. Front keeps every plane square to the viewer.
                // Funnel blends the inward normal with the forward axis, so
                // planes sit on the wall of a cone at the chosen angle.
                let zx = 0
                let zy = 0
                let zz = 1
                if (!frontFacing) {
                    const dx = -m.x
                    const dy = -m.y
                    const len = Math.hypot(dx, dy)
                    if (len > 0.0001) {
                        zx = (dx / len) * ca
                        zy = (dy / len) * ca
                        zz = sa
                        const zl = Math.hypot(zx, zy, zz) || 1
                        zx /= zl
                        zy /= zl
                        zz /= zl
                    }
                }

                // Basis built from the forward axis and world up, the same
                // orientation a lookAt produces for a plane.
                // Nudge off the pole so cross(up, z) never collapses.
                if (zx === 0 && zz === 0) zx = 0.0001

                // x = normalize(cross(up, z)) with up = (0, 1, 0)
                let xx = zz
                let xy = 0
                let xz = -zx
                const xl = Math.hypot(xx, xy, xz) || 1
                xx /= xl
                xy /= xl
                xz /= xl

                // y = cross(z, x)
                const yx = zy * xz - zz * xy
                const yy = zz * xx - zx * xz
                const yz = zx * xy - zy * xx

                m.ax[0] = xx
                m.ax[1] = xy
                m.ax[2] = xz
                m.ay[0] = yx
                m.ay[1] = yy
                m.ay[2] = yz
                m.az[0] = zx
                m.az[1] = zy
                m.az[2] = zz

                const sx = objectWidth * m.scaleX
                const sy = objectHeight * m.scaleY
                const mm = m.model
                mm[0] = xx * sx
                mm[1] = xy * sx
                mm[2] = xz * sx
                mm[3] = 0
                mm[4] = yx * sy
                mm[5] = yy * sy
                mm[6] = yz * sy
                mm[7] = 0
                mm[8] = zx
                mm[9] = zy
                mm[10] = zz
                mm[11] = 0
                mm[12] = m.x
                mm[13] = m.y
                mm[14] = m.z
                mm[15] = 1

                // Fade in from the far plane, fade out near the camera.
                const fadeIn = clamp((z + range) / (range * 0.35), 0, 1)
                const fadeOut = clamp((NEAR_CUT - z) / 6, 0, 1)
                m.opacity = fadeIn * fadeOut
            }

            // Mouse parallax. The scene offset is folded into the camera so
            // hit testing and rendering stay in one coordinate space.
            let camRotX = 0
            let camRotY = 0
            let groupX = 0
            let groupY = 0
            if (live.current.mouseInteraction) {
                const s = live.current.mouseSensitivity
                smoothX += (pointerX * s - smoothX) * 0.05 * dt
                smoothY += (pointerY * s - smoothY) * 0.05 * dt
                groupX = -smoothX
                groupY = -smoothY
                camRotY = smoothX * 0.02
                camRotX = smoothY * 0.02
            } else {
                smoothX = 0
                smoothY = 0
            }

            // Camera rotation, Euler XYZ, then transposed into a view matrix.
            const a = Math.cos(camRotX)
            const b = Math.sin(camRotX)
            const c = Math.cos(camRotY)
            const d = Math.sin(camRotY)
            // Rotation columns: r0, r1, r2
            const r00 = c
            const r01 = b * d
            const r02 = -a * d
            const r10 = 0
            const r11 = a
            const r12 = b
            const r20 = d
            const r21 = -b * c
            const r22 = a * c
            // view = transpose(rotation), camera sits at the origin.
            view[0] = r00
            view[1] = r10
            view[2] = r20
            view[3] = 0
            view[4] = r01
            view[5] = r11
            view[6] = r21
            view[7] = 0
            view[8] = r02
            view[9] = r12
            view[10] = r22
            view[11] = 0
            view[12] = 0
            view[13] = 0
            view[14] = 0
            view[15] = 1

            perspective(projection, FOV, aspect, 0.1, range + 60)
            multiply(viewProj, projection, view)

            // Group offset shifts every plane, so apply it to the model
            // translation right before drawing.
            for (let i = 0; i < meshes.length; i++) {
                const m = meshes[i]
                m.model[12] = m.x + groupX
                m.model[13] = m.y + groupY
                multiply(m.mvp, viewProj, m.model)
            }

            /* Hover detection: ray from the camera through the pointer,
               intersected against each plane in its own basis. */
            if (ndcX <= 1 && ndcY <= 1) {
                const tanHalf = Math.tan((FOV * Math.PI) / 360)
                const cdx = ndcX * tanHalf * aspect
                const cdy = ndcY * tanHalf
                const cdz = -1
                // Ray direction in world space = rotation * camera direction.
                let rdx = r00 * cdx + r01 * cdy + r02 * cdz
                let rdy = r10 * cdx + r11 * cdy + r12 * cdz
                let rdz = r20 * cdx + r21 * cdy + r22 * cdz
                const rl = Math.hypot(rdx, rdy, rdz) || 1
                rdx /= rl
                rdy /= rl
                rdz /= rl

                let best: any = null
                let bestT = Infinity

                for (let i = 0; i < meshes.length; i++) {
                    const m = meshes[i]
                    if (m.opacity <= 0.01) continue
                    const nx = m.az[0]
                    const ny = m.az[1]
                    const nz = m.az[2]
                    const denom = rdx * nx + rdy * ny + rdz * nz
                    if (Math.abs(denom) < 1e-6) continue
                    const px = m.x + groupX
                    const py = m.y + groupY
                    const pz = m.z
                    const t = (px * nx + py * ny + pz * nz) / denom
                    if (t <= 0 || t >= bestT) continue
                    const hx = rdx * t - px
                    const hy = rdy * t - py
                    const hz = rdz * t - pz
                    const u = hx * m.ax[0] + hy * m.ax[1] + hz * m.ax[2]
                    const v = hx * m.ay[0] + hy * m.ay[1] + hz * m.ay[2]
                    if (Math.abs(u) > (objectWidth * m.scaleX) / 2) continue
                    if (Math.abs(v) > (objectHeight * m.scaleY) / 2) continue
                    bestT = t
                    best = m
                }

                if (best !== hovered) {
                    if (hovered && hovered.videoSrc) stopVideo(hovered)
                    hovered = best
                    if (hovered && hovered.videoSrc) startVideo(hovered)
                    if (!dragging) {
                        mount.style.cursor =
                            hovered && hovered.link ? "pointer" : "grab"
                    }
                }
            } else if (hovered) {
                if (hovered.videoSrc) stopVideo(hovered)
                hovered = null
                if (!dragging) mount.style.cursor = "grab"
            }

            // Push the current video frame to its texture.
            if (hovered && hovered.playing && hovered.videoSrc) {
                const entry = videoCache.get(hovered.videoSrc)
                if (entry && entry.el.readyState >= 2) {
                    gl.bindTexture(gl.TEXTURE_2D, entry.tex)
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        entry.el
                    )
                    hovered.tex = entry.tex
                    hovered.hasMap = 1
                }
            }

            /* Draw far to near so alpha blends in the right order. */
            order.sort((p, q) => p.z - q.z)

            gl.clear(gl.COLOR_BUFFER_BIT)

            for (let i = 0; i < order.length; i++) {
                const m = order[i]
                if (m.opacity <= 0.001) continue
                gl.bindTexture(gl.TEXTURE_2D, m.tex || blankTex)
                gl.uniformMatrix4fv(uMVP, false, m.mvp)
                gl.uniform2f(uRepeat, m.repeatX, m.repeatY)
                gl.uniform2f(uOffset, m.offsetX, m.offsetY)
                gl.uniform1f(uOpacity, m.opacity)
                gl.uniform1f(uHasMap, m.tex ? 1 : 0)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            }
        }

        resize()
        raf = requestAnimationFrame(tick)

        /* -------------------------------------------------- */
        /* Teardown                                            */
        /* -------------------------------------------------- */

        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            mount.removeEventListener("wheel", onWheel)
            mount.removeEventListener("touchstart", onTouchStart)
            mount.removeEventListener("touchmove", onTouchMove)
            mount.removeEventListener("pointerdown", onPointerDown)
            mount.removeEventListener("pointermove", onPointerMove)
            mount.removeEventListener("pointerup", endDrag)
            mount.removeEventListener("pointercancel", endDrag)
            mount.removeEventListener("pointerleave", onPointerLeave)
            mount.removeEventListener("click", onClick)
            document.removeEventListener("visibilitychange", onVisibility)
            canvas.removeEventListener("webglcontextlost", onContextLost)
            canvas.removeEventListener(
                "webglcontextrestored",
                onContextRestored
            )
            if (ro) ro.disconnect()
            if (io) io.disconnect()

            videoCache.forEach((v) => {
                v.el.pause()
                v.el.removeAttribute("src")
                v.el.load()
                gl.deleteTexture(v.tex)
            })
            videoCache.clear()
            posterCache.forEach((p) => gl.deleteTexture(p.tex))
            posterCache.clear()

            gl.deleteTexture(blankTex)
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)

            const loseContext = gl.getExtension("WEBGL_lose_context")
            if (loseContext) loseContext.loseContext()

            if (canvas.parentNode === mount) mount.removeChild(canvas)
        }
    }, [
        isStatic,
        signature,
        objectWidth,
        objectHeight,
        particleCount,
        spread,
        hollowCenter,
        verticalSquash,
        depthRange,
        radius,
    ])

    /* -------------------------------------------------- */
    /* Shared shell styles                                 */
    /* -------------------------------------------------- */

    const shell: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        background,
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
    }

    /* -------------------------------------------------- */
    /* Empty state (canvas and live)                       */
    /* -------------------------------------------------- */

    if (list.length === 0) {
        return (
            <div
                style={{
                    ...shell,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 24,
                    fontFamily:
                        "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                    fontSize: 13,
                    lineHeight: 1.5,
                    letterSpacing: "-0.01em",
                    color: "rgba(0,0,0,0.4)",
                }}
            >
                Add images or videos in the Items control to build the gallery.
            </div>
        )
    }

    /* -------------------------------------------------- */
    /* Static canvas preview                               */
    /* -------------------------------------------------- */

    // WebGL is never started on the canvas. Instead a CSS perspective stack
    // approximates the tunnel so the layer looks like the real thing while
    // designing, and thumbnails render correctly.
    if (isStatic) {
        const tiles = Math.min(Math.max(1, Math.round(particleCount)), 16)
        const unit = 110 // px per world unit, tuned to read well at any size
        const ringInner = objectWidth * hollowCenter
        const ringOuter = ringInner + objectWidth * spread

        return (
            <div style={{ ...shell, perspective: "900px" }}>
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {Array.from({ length: tiles }).map((_, i) => {
                        const item = list[i % list.length]
                        const url = item.url || item.file || ""
                        const src =
                            item.poster?.src || (isImage(url) ? url : "")
                        const angle = seeded(i, 1) * TWO_PI
                        const rr =
                            ringInner +
                            Math.sqrt(seeded(i, 2)) * (ringOuter - ringInner)
                        const t = (i + 0.5) / tiles
                        const x = Math.cos(angle) * rr * unit
                        const y = Math.sin(angle) * rr * verticalSquash * unit
                        const z = -t * 1500

                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: objectWidth * unit,
                                    height: objectHeight * unit,
                                    marginLeft: (-objectWidth * unit) / 2,
                                    marginTop: (-objectHeight * unit) / 2,
                                    transform: `translate3d(${x}px, ${-y}px, ${z}px)`,
                                    borderRadius: radius * unit,
                                    overflow: "hidden",
                                    background: "#E5E5E5",
                                    opacity: clamp(1.15 - t, 0.12, 1),
                                }}
                            >
                                {src ? (
                                    <img
                                        src={src}
                                        alt={item.alt || ""}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit,
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    /* -------------------------------------------------- */
    /* Live                                                */
    /* -------------------------------------------------- */

    return (
        <div
            style={{
                ...shell,
                touchAction: scrollCapture ? "none" : "pan-y",
                cursor: "grab",
            }}
        >
            <div
                ref={mountRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            />

            {/* Crawlable text layer: WebGL alone gives search engines and
                screen readers nothing to work with. */}
            <ul
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    clipPath: "inset(50%)",
                    whiteSpace: "nowrap",
                    margin: 0,
                    padding: 0,
                    border: 0,
                }}
            >
                {list.map((it, i) => (
                    <li key={i}>
                        {it.link ? (
                            <a href={it.link}>{it.alt || `Project ${i + 1}`}</a>
                        ) : (
                            it.alt || `Project ${i + 1}`
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}

addPropertyControls(SpiralGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Add as many videos or images as you like. Paste a URL, or upload. Videos stay paused until hovered, so add a Poster for the still frame.",
        control: {
            type: ControlType.Object,
            title: "Item",
            controls: {
                url: {
                    type: ControlType.String,
                    title: "URL",
                    placeholder: "https://.../clip.mp4",
                },
                file: {
                    type: ControlType.File,
                    title: "Upload",
                    allowedFileTypes: [
                        "mp4",
                        "webm",
                        "mov",
                        "jpg",
                        "jpeg",
                        "png",
                        "webp",
                    ],
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    placeholder: "Client name, project",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            { url: "", alt: "", link: "" },
            { url: "", alt: "", link: "" },
            { url: "", alt: "", link: "" },
        ],
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    objectWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 0.5,
        max: 12,
        step: 0.1,
        defaultValue: 3.2,
    },
    objectHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 0.5,
        max: 12,
        step: 0.1,
        defaultValue: 1.9,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
        defaultValue: "cover",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.08,
    },
    facing: {
        type: ControlType.Enum,
        title: "Facing",
        description:
            "Front keeps every plane square to the viewer. Funnel turns them to line the walls of the tunnel.",
        options: ["front", "funnel"],
        optionTitles: ["Front", "Funnel"],
        displaySegmentedControl: true,
        defaultValue: "front",
    },
    funnelAmount: {
        type: ControlType.Number,
        title: "Funnel Amount",
        description:
            "1 lines the tube wall completely. Lower eases back toward front facing.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden(props) {
            return props.facing !== "funnel"
        },
    },
    particleCount: {
        type: ControlType.Number,
        title: "Count",
        description:
            "How many planes fill the space. Items repeat to fill it. Keep under 120 on media heavy pages.",
        min: 1,
        max: 400,
        step: 1,
        displayStepper: true,
        defaultValue: 60,
    },
    hollowCenter: {
        type: ControlType.Number,
        title: "Hollow",
        description:
            "Clear radius through the middle of the tunnel. Higher opens up more white space.",
        min: 0,
        max: 8,
        step: 0.1,
        defaultValue: 1.4,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        description:
            "Thickness of the ring outside the hollow core. Lower is denser.",
        min: 0.2,
        max: 8,
        step: 0.1,
        defaultValue: 2.4,
    },
    verticalSquash: {
        type: ControlType.Number,
        title: "Squash",
        description:
            "Flattens the ring vertically to suit a widescreen viewport.",
        min: 0.3,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.8,
    },
    depthRange: {
        type: ControlType.Number,
        title: "Depth Range",
        min: 10,
        max: 200,
        step: 1,
        defaultValue: 60,
    },
    scrollCapture: {
        type: ControlType.Boolean,
        title: "Scroll",
        description:
            "On lets the wheel drive the tunnel and holds the page in place. Turn it off for a section inside a normally scrolling page, then use Drag or Auto Move instead.",
        enabledTitle: "Capture",
        disabledTitle: "Page",
        defaultValue: true,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
    },
    dragToMove: {
        type: ControlType.Boolean,
        title: "Drag",
        description: "Click and drag up or down to travel through the tunnel.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    spiralMotion: {
        type: ControlType.Boolean,
        title: "Spiral",
        description:
            "Off keeps the ring tunnel. On arranges planes into a corkscrew that rotates as it travels.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    spiralTurns: {
        type: ControlType.Number,
        title: "Turns",
        min: 0.25,
        max: 8,
        step: 0.25,
        defaultValue: 2,
        hidden(props) {
            return props.spiralMotion === false
        },
    },
    spiralRadius: {
        type: ControlType.Number,
        title: "Spiral Size",
        min: 0.2,
        max: 6,
        step: 0.1,
        defaultValue: 1.6,
        hidden(props) {
            return props.spiralMotion === false
        },
    },
    autoMotion: {
        type: ControlType.Boolean,
        title: "Auto Move",
        description:
            "Drifts on its own without scrolling. Manual scroll and drag still work and add on top.",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        hidden(props) {
            return props.autoMotion === false
        },
    },
    autoDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "backward"],
        optionTitles: ["Toward", "Away"],
        displaySegmentedControl: true,
        defaultValue: "forward",
        hidden(props) {
            return props.autoMotion === false
        },
    },
    mouseInteraction: {
        type: ControlType.Boolean,
        title: "Mouse",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    mouseSensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1.2,
        hidden(props) {
            return props.mouseInteraction === false
        },
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Open Link",
        options: ["same", "new"],
        optionTitles: ["Same Tab", "New Tab"],
        displaySegmentedControl: true,
        defaultValue: "same",
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        description:
            "Honours the visitor's system setting by pausing auto drift. Scroll and drag stay available.",
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        defaultValue: true,
    },
})
