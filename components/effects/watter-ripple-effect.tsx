// User request: Create a fresh code component file with a distinct identity for Marketplace listing, keeping the same marketplace-safe water ripple effect and controls (image, fitMode, rippleSize, rippleStrength, damping, refraction), with SSR/static safety and no external CDN scripts.
// Water Ripple Cursor — Framer Code Component

import {
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
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


const simFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform sampler2D uCurr;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uRippleSize;
uniform float uRippleStrength;
uniform float uDamping;
void main() {
  vec2 texel = 1.0 / uResolution;
  float prev = texture2D(uPrev, vUv).r;
  float curr = texture2D(uCurr, vUv).r;
  float left  = texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r;
  float right = texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r;
  float up    = texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r;
  float down  = texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r;
  float next = curr * 2.0 - prev + (left + right + up + down - 4.0 * curr) * 0.25;
  next *= uDamping;
  float dist = distance(vUv, uMouse);
  float ripple = smoothstep(uRippleSize, 0.0, dist) * uMouseActive * uRippleStrength;
  next += ripple;
  gl_FragColor = vec4(next, 0.0, 0.0, 1.0);
}
`

const displayFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCurr;
uniform sampler2D uImage;
uniform vec2 uSimResolution;
uniform float uRefraction;
uniform vec2 uImageAspect;
uniform int uFitMode;
vec2 computeFitUV(vec2 uv) {
  if (uFitMode == 2) return uv;
  float imageAR = uImageAspect.x;
  float containerAR = uImageAspect.y;
  float ratio = imageAR / containerAR;
  vec2 scale;
  if (uFitMode == 0) {
    if (ratio > 1.0) { scale = vec2(1.0 / ratio, 1.0); }
    else { scale = vec2(1.0, ratio); }
  } else {
    if (ratio > 1.0) { scale = vec2(1.0, ratio); }
    else { scale = vec2(1.0 / ratio, 1.0); }
  }
  vec2 offset = (vec2(1.0) - scale) * 0.5;
  return uv * scale + offset;
}
void main() {
  vec2 texel = 1.0 / uSimResolution;
  float left  = texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r;
  float right = texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r;
  float up    = texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r;
  float down  = texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r;
  float dx = right - left;
  float dy = up - down;
  vec2 fitUV = computeFitUV(vUv);
  vec2 distortedUV = fitUV + vec2(dx, dy) * uRefraction;
  if (uFitMode == 1) {
    if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || distortedUV.y < 0.0 || distortedUV.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }
  }
  distortedUV = clamp(distortedUV, 0.0, 1.0);
  vec4 color = texture2D(uImage, distortedUV);
  float specular = pow(clamp(abs(dx + dy) * 8.0, 0.0, 1.0), 2.0);
  color.rgb += specular * 0.15;
  gl_FragColor = color;
}
`

type GLResources = {
    gl: WebGLRenderingContext
    simProgram: WebGLProgram
    displayProgram: WebGLProgram
    quadBuffer: WebGLBuffer
    prevTex: WebGLTexture
    currTex: WebGLTexture
    nextTex: WebGLTexture
    prevFbo: WebGLFramebuffer
    currFbo: WebGLFramebuffer
    nextFbo: WebGLFramebuffer
    imageTex: WebGLTexture
}

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
) {
    const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertex || !fragment) return null
    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program)
        return null
    }
    return program
}

function createTexture(gl: WebGLRenderingContext, width: number, height: number) {
    const tex = gl.createTexture()
    if (!tex) return null
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    )
    return tex
}

function createFramebuffer(gl: WebGLRenderingContext, texture: WebGLTexture) {
    const fbo = gl.createFramebuffer()
    if (!fbo) return null
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    )
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteFramebuffer(fbo)
        return null
    }
    return fbo
}

function createGLResources(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    simW: number,
    simH: number
): GLResources | null {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false })
    if (!gl) return null

    const vertex = `
attribute vec2 a_position;
varying vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

    const simFragmentRaw = simFragment
        .replace(
            "varying vec2 vUv;",
            "varying vec2 vUv;\nfloat decodeWave(float v){return v * 2.0 - 1.0;}\nfloat encodeWave(float v){return v * 0.5 + 0.5;}"
        )
        .replace(
            "float prev = texture2D(uPrev, vUv).r;",
            "float prev = decodeWave(texture2D(uPrev, vUv).r);"
        )
        .replace(
            "float curr = texture2D(uCurr, vUv).r;",
            "float curr = decodeWave(texture2D(uCurr, vUv).r);"
        )
        .replace(
            "float left  = texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r;",
            "float left  = decodeWave(texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r);"
        )
        .replace(
            "float right = texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r;",
            "float right = decodeWave(texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r);"
        )
        .replace(
            "float up    = texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r;",
            "float up    = decodeWave(texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r);"
        )
        .replace(
            "float down  = texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r;",
            "float down  = decodeWave(texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r);"
        )
        .replace(
            "gl_FragColor = vec4(next, 0.0, 0.0, 1.0);",
            "gl_FragColor = vec4(encodeWave(next), 0.0, 0.0, 1.0);"
        )

    const displayFragmentRaw = displayFragment
        .replace(
            "float left  = texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r;",
            "float left  = texture2D(uCurr, vUv + vec2(-texel.x, 0.0)).r * 2.0 - 1.0;"
        )
        .replace(
            "float right = texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r;",
            "float right = texture2D(uCurr, vUv + vec2( texel.x, 0.0)).r * 2.0 - 1.0;"
        )
        .replace(
            "float up    = texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r;",
            "float up    = texture2D(uCurr, vUv + vec2(0.0,  texel.y)).r * 2.0 - 1.0;"
        )
        .replace(
            "float down  = texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r;",
            "float down  = texture2D(uCurr, vUv + vec2(0.0, -texel.y)).r * 2.0 - 1.0;"
        )

    const simProgram = createProgram(gl, vertex, simFragmentRaw)
    const displayProgram = createProgram(gl, vertex, displayFragmentRaw)
    if (!simProgram || !displayProgram) return null

    const quadBuffer = gl.createBuffer()
    if (!quadBuffer) return null
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )

    const prevTex = createTexture(gl, simW, simH)
    const currTex = createTexture(gl, simW, simH)
    const nextTex = createTexture(gl, simW, simH)
    if (!prevTex || !currTex || !nextTex) return null

    const prevFbo = createFramebuffer(gl, prevTex)
    const currFbo = createFramebuffer(gl, currTex)
    const nextFbo = createFramebuffer(gl, nextTex)
    if (!prevFbo || !currFbo || !nextFbo) return null

    const imageTex = gl.createTexture()
    if (!imageTex) return null
    gl.bindTexture(gl.TEXTURE_2D, imageTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 255])
    )

    canvas.width = width
    canvas.height = height
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)

    return {
        gl,
        simProgram,
        displayProgram,
        quadBuffer,
        prevTex,
        currTex,
        nextTex,
        prevFbo,
        currFbo,
        nextFbo,
        imageTex,
    }
}

const SIM_RESOLUTION = 0.3

interface MyComponentProps {
    image?: string | { src?: string; alt?: string; srcSet?: string }
    fitMode: "Cover" | "Contain" | "Fill"
    rippleSize: number
    rippleStrength: number
    damping: number
    refraction: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WaterRippleCursor(props: MyComponentProps) {
    const {
        image,
        fitMode = "Cover",
        rippleSize = 0.04,
        rippleStrength = 0.3,
        damping = 0.985,
        refraction = 0.02,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)
    const [webglReady, setWebglReady] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const isStaticRenderer = useIsStaticRenderer()
    const imageSrc = typeof image === "string" ? image : image?.src ?? ""

    useEffect(() => {
        if (typeof window === "undefined" || isStaticRenderer) return
        const container = containerRef.current
        if (!container) return
        if (!("IntersectionObserver" in window)) {
            startTransition(() => setIsVisible(true))
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => startTransition(() => setIsVisible(entry.isIntersecting)),
            { threshold: 0.01 }
        )
        observer.observe(container)
        return () => observer.disconnect()
    }, [isStaticRenderer])

    useEffect(() => {
        if (typeof window === "undefined" || isStaticRenderer || !isVisible) return
        const container = containerRef.current
        if (!container) return

        let cancelled = false

        Promise.resolve()
            .then(() => {
                if (cancelled) return
                if (cleanupRef.current) cleanupRef.current()

                const width = container.clientWidth || window.innerWidth
                const height = container.clientHeight || window.innerHeight
                const simW = Math.max(2, Math.floor(width * SIM_RESOLUTION))
                const simH = Math.max(2, Math.floor(height * SIM_RESOLUTION))
                const containerAspect = width / height
                const fitModeInt = fitMode === "Contain" ? 1 : fitMode === "Fill" ? 2 : 0

                const canvas = document.createElement("canvas")
                canvas.style.display = "block"
                const resources = createGLResources(canvas, width, height, simW, simH)
                if (!resources) throw new Error("WebGL initialization failed")
                container.appendChild(canvas)

                const { gl, simProgram, displayProgram, quadBuffer, imageTex } = resources
                let { prevTex, currTex, nextTex, prevFbo, currFbo, nextFbo } = resources

                const bindQuad = (program: WebGLProgram) => {
                    const posLoc = gl.getAttribLocation(program, "a_position")
                    if (posLoc < 0) return
                    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
                    gl.enableVertexAttribArray(posLoc)
                    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
                }

                const mouse = { x: -1, y: -1 }
                let mouseActive = 0
                let imageAspect = 1

                if (imageSrc) {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        if (cancelled) return
                        imageAspect =
                            img.naturalWidth && img.naturalHeight
                                ? img.naturalWidth / img.naturalHeight
                                : 1
                        gl.bindTexture(gl.TEXTURE_2D, imageTex)
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            gl.RGBA,
                            gl.RGBA,
                            gl.UNSIGNED_BYTE,
                            img
                        )
                    }
                    img.src = imageSrc
                }

                const onMouseMove = (e: MouseEvent) => {
                    const rect = container.getBoundingClientRect()
                    mouse.x = (e.clientX - rect.left) / rect.width
                    mouse.y = 1.0 - (e.clientY - rect.top) / rect.height
                    mouseActive = 1.0
                }
                const onMouseLeave = () => {
                    mouseActive = 0
                }

                container.addEventListener("mousemove", onMouseMove)
                container.addEventListener("mouseleave", onMouseLeave)
                startTransition(() => setWebglReady(true))

                let animId = 0
                const animate = () => {
                    gl.useProgram(simProgram)
                    bindQuad(simProgram)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, nextFbo)
                    gl.viewport(0, 0, simW, simH)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, prevTex)
                    gl.uniform1i(gl.getUniformLocation(simProgram, "uPrev"), 0)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, currTex)
                    gl.uniform1i(gl.getUniformLocation(simProgram, "uCurr"), 1)
                    gl.uniform2f(gl.getUniformLocation(simProgram, "uResolution"), simW, simH)
                    gl.uniform2f(gl.getUniformLocation(simProgram, "uMouse"), mouse.x, mouse.y)
                    gl.uniform1f(gl.getUniformLocation(simProgram, "uMouseActive"), mouseActive)
                    gl.uniform1f(gl.getUniformLocation(simProgram, "uRippleSize"), rippleSize)
                    gl.uniform1f(
                        gl.getUniformLocation(simProgram, "uRippleStrength"),
                        rippleStrength
                    )
                    gl.uniform1f(gl.getUniformLocation(simProgram, "uDamping"), damping)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    gl.useProgram(displayProgram)
                    bindQuad(displayProgram)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                    gl.viewport(0, 0, width, height)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, nextTex)
                    gl.uniform1i(gl.getUniformLocation(displayProgram, "uCurr"), 0)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, imageTex)
                    gl.uniform1i(gl.getUniformLocation(displayProgram, "uImage"), 1)
                    gl.uniform2f(
                        gl.getUniformLocation(displayProgram, "uSimResolution"),
                        simW,
                        simH
                    )
                    gl.uniform1f(
                        gl.getUniformLocation(displayProgram, "uRefraction"),
                        refraction
                    )
                    gl.uniform2f(
                        gl.getUniformLocation(displayProgram, "uImageAspect"),
                        imageAspect,
                        containerAspect
                    )
                    gl.uniform1i(gl.getUniformLocation(displayProgram, "uFitMode"), fitModeInt)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                    const tmpTex = prevTex
                    prevTex = currTex
                    currTex = nextTex
                    nextTex = tmpTex
                    const tmpFbo = prevFbo
                    prevFbo = currFbo
                    currFbo = nextFbo
                    nextFbo = tmpFbo
                    animId = requestAnimationFrame(animate)
                }
                animate()

                cleanupRef.current = () => {
                    cancelAnimationFrame(animId)
                    container.removeEventListener("mousemove", onMouseMove)
                    container.removeEventListener("mouseleave", onMouseLeave)
                    gl.deleteTexture(prevTex)
                    gl.deleteTexture(currTex)
                    gl.deleteTexture(nextTex)
                    gl.deleteTexture(imageTex)
                    gl.deleteFramebuffer(prevFbo)
                    gl.deleteFramebuffer(currFbo)
                    gl.deleteFramebuffer(nextFbo)
                    gl.deleteBuffer(quadBuffer)
                    gl.deleteProgram(simProgram)
                    gl.deleteProgram(displayProgram)
                    if (container.contains(canvas)) container.removeChild(canvas)
                    startTransition(() => setWebglReady(false))
                }
            })
            .catch(() => {
                startTransition(() => setWebglReady(false))
            })

        return () => {
            cancelled = true
            if (cleanupRef.current) cleanupRef.current()
        }
    }, [
        damping,
        fitMode,
        imageSrc,
        isStaticRenderer,
        isVisible,
        refraction,
        rippleSize,
        rippleStrength,
    ])

    const objectFit = useMemo(
        () => (fitMode === "Contain" ? "contain" : fitMode === "Fill" ? "fill" : "cover"),
        [fitMode]
    )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                ...props.style,
            }}
        >
            {!webglReady && imageSrc && (
                <img
                    src={imageSrc}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit, display: "block" }}
                />
            )}
            {!webglReady && !imageSrc && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#1a1a2e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#555",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                    }}
                >
                    Water Ripple — Add an image
                </div>
            )}
        </div>
    )
}

addPropertyControls(WaterRippleCursor, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "Cover",
        options: ["Cover", "Contain", "Fill"],
        optionTitles: ["Cover (Crop)", "Contain (Fit)", "Fill (Stretch)"],
    },
    rippleSize: {
        type: ControlType.Number,
        title: "Ripple Size",
        defaultValue: 0.04,
        min: 0.01,
        max: 0.15,
        step: 0.005,
    },
    rippleStrength: {
        type: ControlType.Number,
        title: "Ripple Strength",
        defaultValue: 0.3,
        min: 0.05,
        max: 1,
        step: 0.05,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.985,
        min: 0.9,
        max: 0.999,
        step: 0.001,
        description: "Higher = ripples last longer",
    },
    refraction: {
        type: ControlType.Number,
        title: "Refraction",
        defaultValue: 0.02,
        min: 0.005,
        max: 0.1,
        step: 0.005,
        description: "How much the image distorts",
    },
})