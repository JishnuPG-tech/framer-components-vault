// Image ripple effect component with WebGL water simulation on hover/touch
// (2025-09 patch: wider WebGL1 compatibility, adaptive trail size, pointer support, cover fix, cleanup, DPR cap, safe uniforms)

import {
    useRef,
    useEffect,
    useState,
    useCallback,
    startTransition,
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


// ===== Types =====

type TrailPoint = {
    x: number
    y: number
    time: number
    strength: number
    timestamp: number
}

interface ImageRippleProps {
    image: { src: string; alt: string }
    rippleStrength: number
    rippleSpeed: number
    rippleDensity: number
    dampening: number // يستعمل في JS فقط لتوهين أثر المسار
    mouseOffset: number
    liquidLineDensity: number
    distortionStrength: number
    distortionRadius: number // 0..1
    distortionFalloff: number
    effectWidth: number // 0..1
    effectHeight: number // 0..1
    /** سقف الـ DPR (1..3 مثلاً) لتخفيف الحمل على الموبايل */
    qualityScale?: number
    /** الحد الأقصى لطول المسار (Uniform array) */
    maxTrail?: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */

export default function ImageRipple(props: ImageRippleProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Ripple Image",
        },
        rippleStrength = 0.02,
        rippleSpeed = 0.03,
        rippleDensity = 1.0,
        dampening = 0.99,
        mouseOffset = 0.05,
        liquidLineDensity = 2.0,
        distortionStrength = 0.08,
        distortionRadius = 0.3,
        distortionFalloff = 2.0,
        effectWidth = 0.3,
        effectHeight = 0.3,
        qualityScale = 2.0,
        maxTrail = 32,
    } = props

    // ===== Refs & State =====
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const textureRef = useRef<WebGLTexture | null>(null)
    const positionBufferRef = useRef<WebGLBuffer | null>(null)
    const texCoordBufferRef = useRef<WebGLBuffer | null>(null)
    const animationRef = useRef<number>()
    const timeRef = useRef(0)
    const lastTsRef = useRef(0)
    const cursorTrailRef = useRef<TrailPoint[]>([])
    const isStatic = useIsStaticRenderer()
    const webglInitializedRef = useRef(false)
    const lastImageSrcRef = useRef("")

    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [webglReady, setWebglReady] = useState(false)
    const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 })
    const [imageError, setImageError] = useState(false)
    const [forceUpdate, setForceUpdate] = useState(0)

    // Trail capacity & preallocated arrays (built after querying device limits)
    const trailCapacityRef = useRef(0)
    const trailPosRef = useRef<Float32Array | null>(null) // length = 2 * capacity
    const trailTimeRef = useRef<Float32Array | null>(null) // length = capacity
    const trailStrRef = useRef<Float32Array | null>(null) // length = capacity

    // UV transform for object-fit: cover
    const uvScaleRef = useRef<[number, number]>([1, 1])
    const uvOffsetRef = useRef<[number, number]>([0, 0])

    // Cache for locations
    const locationsRef = useRef<{
        u_texture: WebGLUniformLocation | null
        u_time: WebGLUniformLocation | null
        u_uvScale: WebGLUniformLocation | null
        u_uvOffset: WebGLUniformLocation | null
        u_rippleStrength: WebGLUniformLocation | null
        u_rippleSpeed: WebGLUniformLocation | null
        u_rippleDensity: WebGLUniformLocation | null
        u_mouseOffset: WebGLUniformLocation | null
        u_liquidLineDensity: WebGLUniformLocation | null
        u_distortionStrength: WebGLUniformLocation | null
        u_distortionRadius: WebGLUniformLocation | null
        u_distortionFalloff: WebGLUniformLocation | null
        u_effectWidth: WebGLUniformLocation | null
        u_effectHeight: WebGLUniformLocation | null
        u_trailPositions: WebGLUniformLocation | null // base [0]
        u_trailTimes: WebGLUniformLocation | null // base [0]
        u_trailStrengths: WebGLUniformLocation | null // base [0]
        u_trailCount: WebGLUniformLocation | null
        u_currentMouse: WebGLUniformLocation | null
        u_isHovered: WebGLUniformLocation | null
        a_position: number
        a_texCoord: number
    } | null>(null)

    // ===== Shaders =====
    const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `

    // Build fragment shader with adaptive MAX_TRAIL to fit device limits
    const buildFragmentShaderSource = (MAX_TRAIL: number) => `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    uniform sampler2D u_texture;
    uniform float u_time;
    uniform vec2 u_uvScale;
    uniform vec2 u_uvOffset;
    uniform float u_rippleStrength;
    uniform float u_rippleSpeed;
    uniform float u_rippleDensity;
    uniform float u_mouseOffset;
    uniform float u_liquidLineDensity;
    uniform float u_distortionStrength;
    uniform float u_distortionRadius;
    uniform float u_distortionFalloff;
    uniform float u_effectWidth;
    uniform float u_effectHeight;
    uniform vec2 u_trailPositions[${MAX_TRAIL}];
    uniform float u_trailTimes[${MAX_TRAIL}];
    uniform float u_trailStrengths[${MAX_TRAIL}];
    uniform int u_trailCount;
    uniform vec2 u_currentMouse;
    uniform bool u_isHovered;
    varying vec2 v_texCoord;

    void main() {
      vec2 uv = v_texCoord;
      vec2 displacement = vec2(0.0);
      vec2 bounds = vec2(u_effectWidth, u_effectHeight);

      if (u_isHovered) {
        vec2 toMouse = u_currentMouse - uv;
        float normDist = length(toMouse / bounds);

        if (normDist < u_distortionRadius) {
          float t = 1.0 - clamp(normDist / max(u_distortionRadius, 0.0001), 0.0, 1.0);
          float factor = pow(t, u_distortionFalloff);
          vec2 dir = normalize(toMouse);

          displacement += dir * factor * u_distortionStrength;

          float angle = factor * u_distortionStrength * 3.14159265;
          float c = cos(angle), s = sin(angle);
          vec2 swirl = vec2(toMouse.x * c - toMouse.y * s, toMouse.x * s + toMouse.y * c) - toMouse;
          displacement += swirl * 0.3;

          float offsetStrength = u_mouseOffset * exp(-normDist * 3.0);
          displacement += dir * offsetStrength;

          float lineWave = sin(uv.x * u_liquidLineDensity * 50.0 * u_rippleDensity + u_time * u_rippleSpeed * 100.0 * u_rippleDensity) *
                           cos(uv.y * u_liquidLineDensity * 30.0 * u_rippleDensity + u_time * u_rippleSpeed * 80.0 * u_rippleDensity);
          displacement += vec2(lineWave * u_rippleStrength * 0.3, lineWave * u_rippleStrength * 0.2);

          vec2 flowDir = normalize(toMouse);
          float flowWave = sin(dot(uv, flowDir) * u_liquidLineDensity * 40.0 * u_rippleDensity - u_time * u_rippleSpeed * 120.0 * u_rippleDensity);
          displacement += vec2(-flowDir.y, flowDir.x) * flowWave * u_rippleStrength * 0.4;
        }
      }

      // No 'break' to keep compatibility
      for (int i = 0; i < ${MAX_TRAIL}; i++) {
        if (i >= u_trailCount) { continue; }

        vec2 p = u_trailPositions[i];
        float t = u_trailTimes[i];
        float s = u_trailStrengths[i];

        vec2 toP = p - uv;
        float normDist = length(toP / bounds);
        if (normDist < u_distortionRadius) {
          float k = (1.0 - clamp(normDist / max(u_distortionRadius, 0.0001), 0.0, 1.0));
          k = pow(k, u_distortionFalloff) * s * exp(-t * 1.5);
          vec2 dir = normalize(toP);
          displacement += dir * k * u_distortionStrength * 0.6;

          float trailOffset = u_mouseOffset * s * exp(-t * 2.0) * exp(-normDist * 5.0);
          displacement += dir * trailOffset;

          float liquidWave = sin(length(toP) * u_liquidLineDensity * 25.0 * u_rippleDensity - u_time * u_rippleSpeed * 90.0 * u_rippleDensity);
          float amp = s * u_rippleStrength * exp(-t * 1.5) * exp(-normDist * 6.0);
          vec2 tang = vec2(-dir.y, dir.x);
          displacement += tang * liquidWave * amp;
        }
      }

      vec2 finalUV = clamp(uv + displacement, 0.0, 1.0);
      vec2 texUV = finalUV * u_uvScale + u_uvOffset;
      gl_FragColor = texture2D(u_texture, texUV);
    }
  `

    // ===== GL helpers =====
    const createShader = useCallback(
        (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(
                    "Shader compilation error:",
                    gl.getShaderInfoLog(shader)
                )
                gl.deleteShader(shader)
                return null
            }
            return shader
        },
        []
    )

    const createProgram = useCallback(
        (gl: WebGLRenderingContext, fragmentSrc: string) => {
            const v = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
            const f = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc)
            if (!v || !f) return null
            const program = gl.createProgram()
            if (!program) return null
            gl.attachShader(program, v)
            gl.attachShader(program, f)
            gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(
                    "Program linking error:",
                    gl.getProgramInfoLog(program)
                )
                gl.deleteProgram(program)
                gl.deleteShader(v)
                gl.deleteShader(f)
                return null
            }
            // تنظيف الشيدرات بعد اللينك
            gl.detachShader(program, v)
            gl.detachShader(program, f)
            gl.deleteShader(v)
            gl.deleteShader(f)
            return program
        },
        [createShader]
    )

    // Helpers آمنة للـ uniforms
    const U = useRef({
        set1f(
            gl: WebGLRenderingContext,
            loc: WebGLUniformLocation | null,
            x: number
        ) {
            if (loc) gl.uniform1f(loc, x)
        },
        set1i(
            gl: WebGLRenderingContext,
            loc: WebGLUniformLocation | null,
            x: number
        ) {
            if (loc) gl.uniform1i(loc, x)
        },
        set2f(
            gl: WebGLRenderingContext,
            loc: WebGLUniformLocation | null,
            x: number,
            y: number
        ) {
            if (loc) gl.uniform2f(loc, x, y)
        },
        set2fv(
            gl: WebGLRenderingContext,
            loc: WebGLUniformLocation | null,
            arr: Float32Array
        ) {
            if (loc) gl.uniform2fv(loc, arr)
        },
        set1fv(
            gl: WebGLRenderingContext,
            loc: WebGLUniformLocation | null,
            arr: Float32Array
        ) {
            if (loc) gl.uniform1fv(loc, arr)
        },
    }).current

    // Cover utility (object-fit: cover في الشيدر)
    const computeCover = useCallback(
        (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
            const iw = img.naturalWidth || 1
            const ih = img.naturalHeight || 1
            const cw = canvas.width || 1
            const ch = canvas.height || 1
            const ai = iw / ih
            const ac = cw / ch
            let sx = 1,
                sy = 1
            if (ac > ai) {
                sx = 1
                sy = ai / ac
            } // قص رأسي
            else {
                sx = ac / ai
                sy = 1
            } // قص أفقي
            uvScaleRef.current = [sx, sy]
            uvOffsetRef.current = [(1 - sx) / 2, (1 - sy) / 2]
        },
        []
    )

    // ===== Render loop =====
    const render = useCallback(
        (ts?: number) => {
            const gl = glRef.current
            const program = programRef.current
            const canvas = canvasRef.current
            const loc = locationsRef.current
            if (!gl || !program || !canvas || !webglReady || !loc) return

            const now = ts ?? performance.now()
            const last = lastTsRef.current || now
            let dt = (now - last) / 1000
            if (!isFinite(dt) || dt < 0) dt = 0
            dt = Math.min(dt, 0.05)
            lastTsRef.current = now
            timeRef.current += dt

            // Update trail (decay over time)
            cursorTrailRef.current = cursorTrailRef.current.filter((p) => {
                p.time += dt
                p.strength *= dampening
                return p.time < 2.0 && p.strength > 0.01
            })

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.clear(gl.COLOR_BUFFER_BIT)

            // uniforms
            U.set1f(gl, loc.u_time, timeRef.current)
            U.set2f(
                gl,
                loc.u_uvScale,
                uvScaleRef.current[0],
                uvScaleRef.current[1]
            )
            U.set2f(
                gl,
                loc.u_uvOffset,
                uvOffsetRef.current[0],
                uvOffsetRef.current[1]
            )
            U.set1f(gl, loc.u_rippleStrength, rippleStrength)
            U.set1f(gl, loc.u_rippleSpeed, rippleSpeed)
            U.set1f(gl, loc.u_rippleDensity, rippleDensity)
            U.set1f(gl, loc.u_mouseOffset, mouseOffset)
            U.set1f(gl, loc.u_liquidLineDensity, liquidLineDensity)
            U.set1f(gl, loc.u_distortionStrength, distortionStrength)
            U.set1f(gl, loc.u_distortionRadius, distortionRadius)
            U.set1f(gl, loc.u_distortionFalloff, distortionFalloff)
            U.set1f(gl, loc.u_effectWidth, effectWidth)
            U.set1f(gl, loc.u_effectHeight, effectHeight)
            U.set2f(
                gl,
                loc.u_currentMouse,
                currentMousePos.x,
                currentMousePos.y
            )
            U.set1i(gl, loc.u_isHovered, isHovered ? 1 : 0)

            // trail arrays
            const cap = trailCapacityRef.current
            const n = Math.min(cursorTrailRef.current.length, cap)
            const pos = trailPosRef.current!
            const tt = trailTimeRef.current!
            const ss = trailStrRef.current!

            for (let i = 0; i < n; i++) {
                const p = cursorTrailRef.current[i]
                pos[i * 2] = p.x
                pos[i * 2 + 1] = p.y
                tt[i] = p.time
                ss[i] = p.strength
            }
            for (let i = n; i < cap; i++) {
                pos[i * 2] = 0
                pos[i * 2 + 1] = 0
                tt[i] = 0
                ss[i] = 0
            }

            U.set1i(gl, loc.u_trailCount, n)
            U.set2fv(gl, loc.u_trailPositions, pos)
            U.set1fv(gl, loc.u_trailTimes, tt)
            U.set1fv(gl, loc.u_trailStrengths, ss)

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            if (isHovered || cursorTrailRef.current.length > 0) {
                animationRef.current = requestAnimationFrame(render)
            }
        },
        [
            webglReady,
            isHovered,
            currentMousePos,
            rippleStrength,
            rippleSpeed,
            rippleDensity,
            dampening,
            mouseOffset,
            liquidLineDensity,
            distortionStrength,
            distortionRadius,
            distortionFalloff,
            effectWidth,
            effectHeight,
        ]
    )

    // ===== Cleanup =====
    const cleanupWebGL = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = undefined
        }
        const canvas = canvasRef.current as any
        if (canvas && canvas._glHandlers) {
            canvas.removeEventListener(
                "webglcontextlost",
                canvas._glHandlers.onLost
            )
            canvas.removeEventListener(
                "webglcontextrestored",
                canvas._glHandlers.onRestored
            )
            delete canvas._glHandlers
        }
        const gl = glRef.current
        if (gl) {
            if (positionBufferRef.current)
                gl.deleteBuffer(positionBufferRef.current)
            if (texCoordBufferRef.current)
                gl.deleteBuffer(texCoordBufferRef.current)
            if (textureRef.current) gl.deleteTexture(textureRef.current)
            if (programRef.current) gl.deleteProgram(programRef.current)
        }
        glRef.current = null
        programRef.current = null
        textureRef.current = null
        positionBufferRef.current = null
        texCoordBufferRef.current = null
        locationsRef.current = null
        trailCapacityRef.current = 0
        trailPosRef.current = null
        trailTimeRef.current = null
        trailStrRef.current = null
        webglInitializedRef.current = false
        setWebglReady(false)
    }, [])

    // ===== Setup =====
    const setupWebGL = useCallback(() => {
        const canvas = canvasRef.current
        const img = imageRef.current
        if (
            !canvas ||
            !img ||
            !imageLoaded ||
            webglInitializedRef.current ||
            isStatic
        )
            return

        try {
            cleanupWebGL()

            // Create context with fallback + powerPreference
            const ctx =
                canvas.getContext("webgl", {
                    preserveDrawingBuffer: false,
                    premultipliedAlpha: false,
                    antialias: false,
                    depth: false,
                    stencil: false,
                    alpha: true,
                    // @ts-ignore
                    powerPreference: "high-performance",
                }) || canvas.getContext("experimental-webgl" as any)

            if (!ctx) {
                console.error("WebGL not supported")
                return
            }
            const gl = ctx as WebGLRenderingContext
            glRef.current = gl

            // Decide trail capacity from device limits (safe budget)
            const maxVec4 =
                (gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number) ||
                64
            const maxFloats = maxVec4 * 4
            const nonArrayFloatsSafeBudget = 48 // محافظ أكتر
            let trailCap = Math.floor(
                (maxFloats - nonArrayFloatsSafeBudget) / 4
            )
            trailCap = Math.max(
                4,
                Math.min(maxTrail, isFinite(trailCap) ? trailCap : 24)
            ) // cap بواسطة prop

            // Build shader with the chosen capacity
            const fragSrc = buildFragmentShaderSource(trailCap)
            const program = createProgram(gl, fragSrc)
            if (!program) {
                console.error("Failed to create WebGL program")
                return
            }
            programRef.current = program
            gl.useProgram(program)

            // Buffers (full-screen quad)
            const positionBuffer = gl.createBuffer()
            positionBufferRef.current = positionBuffer
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
            )

            const texCoordBuffer = gl.createBuffer()
            texCoordBufferRef.current = texCoordBuffer
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
                gl.STATIC_DRAW
            )

            const a_position = gl.getAttribLocation(program, "a_position")
            const a_texCoord = gl.getAttribLocation(program, "a_texCoord")

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.enableVertexAttribArray(a_position)
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0)

            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
            gl.enableVertexAttribArray(a_texCoord)
            gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0)

            // Texture
            const texture = gl.createTexture()
            if (!texture) {
                console.error("Failed to create texture")
                return
            }
            textureRef.current = texture
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )

            // Cache locations (arrays use [0] for base)
            const loc = {
                u_texture: gl.getUniformLocation(program, "u_texture"),
                u_time: gl.getUniformLocation(program, "u_time"),
                u_uvScale: gl.getUniformLocation(program, "u_uvScale"),
                u_uvOffset: gl.getUniformLocation(program, "u_uvOffset"),
                u_rippleStrength: gl.getUniformLocation(
                    program,
                    "u_rippleStrength"
                ),
                u_rippleSpeed: gl.getUniformLocation(program, "u_rippleSpeed"),
                u_rippleDensity: gl.getUniformLocation(
                    program,
                    "u_rippleDensity"
                ),
                u_mouseOffset: gl.getUniformLocation(program, "u_mouseOffset"),
                u_liquidLineDensity: gl.getUniformLocation(
                    program,
                    "u_liquidLineDensity"
                ),
                u_distortionStrength: gl.getUniformLocation(
                    program,
                    "u_distortionStrength"
                ),
                u_distortionRadius: gl.getUniformLocation(
                    program,
                    "u_distortionRadius"
                ),
                u_distortionFalloff: gl.getUniformLocation(
                    program,
                    "u_distortionFalloff"
                ),
                u_effectWidth: gl.getUniformLocation(program, "u_effectWidth"),
                u_effectHeight: gl.getUniformLocation(
                    program,
                    "u_effectHeight"
                ),
                u_trailPositions: gl.getUniformLocation(
                    program,
                    "u_trailPositions[0]"
                ),
                u_trailTimes: gl.getUniformLocation(program, "u_trailTimes[0]"),
                u_trailStrengths: gl.getUniformLocation(
                    program,
                    "u_trailStrengths[0]"
                ),
                u_trailCount: gl.getUniformLocation(program, "u_trailCount"),
                u_currentMouse: gl.getUniformLocation(
                    program,
                    "u_currentMouse"
                ),
                u_isHovered: gl.getUniformLocation(program, "u_isHovered"),
                a_position,
                a_texCoord,
            } as const
            locationsRef.current = loc

            // Bind sampler to texture unit 0
            U.set1i(gl, loc.u_texture, 0)

            // Set canvas size (with DPR cap)
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                Math.max(1, qualityScale)
            )
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))

            gl.viewport(0, 0, canvas.width, canvas.height)
            gl.disable(gl.DEPTH_TEST)
            gl.disable(gl.BLEND)
            gl.clearColor(0, 0, 0, 0)

            // Context loss/restored handling
            const onLost = (e: Event) => {
                e.preventDefault()
                cleanupWebGL()
            }
            const onRestored = () => {
                setTimeout(setupWebGL, 0)
            }
            canvas.addEventListener(
                "webglcontextlost",
                onLost as EventListener,
                false
            )
            canvas.addEventListener(
                "webglcontextrestored",
                onRestored as EventListener,
                false
            )
            ;(canvas as any)._glHandlers = { onLost, onRestored }

            // Compute UV cover transform once (COVER FIX)
            computeCover(canvas, img)

            // Allocate trail arrays based on capacity
            trailCapacityRef.current = trailCap
            trailPosRef.current = new Float32Array(trailCap * 2)
            trailTimeRef.current = new Float32Array(trailCap)
            trailStrRef.current = new Float32Array(trailCap)

            webglInitializedRef.current = true
            setWebglReady(true)

            // Initial render
            lastTsRef.current = performance.now()
            render(lastTsRef.current)
        } catch (error) {
            console.error("WebGL setup error:", error)
            cleanupWebGL()
        }
    }, [
        createProgram,
        imageLoaded,
        render,
        isStatic,
        cleanupWebGL,
        computeCover,
        qualityScale,
        maxTrail,
    ])

    // ===== Handlers (Pointer-friendly) =====
    const updatePointer = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = (clientX - rect.left) / rect.width
            const y = 1 - (clientY - rect.top) / rect.height // invert Y for visual match
            setCurrentMousePos({ x, y })

            const now = performance.now()
            const last =
                cursorTrailRef.current[cursorTrailRef.current.length - 1]
            if (!last || now - last.timestamp > 16) {
                cursorTrailRef.current.push({
                    x,
                    y,
                    time: 0,
                    strength: 1.0,
                    timestamp: now,
                })
                if (cursorTrailRef.current.length > trailCapacityRef.current)
                    cursorTrailRef.current.shift()
            }
            if (!animationRef.current && isHovered) {
                animationRef.current = requestAnimationFrame(render)
            }
        },
        [isHovered, render]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !webglReady) return
            updatePointer(e.clientX, e.clientY)
        },
        [isStatic, webglReady, updatePointer]
    )

    const handlePointerEnter = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !webglReady) return
            const canvas = canvasRef.current
            if (!canvas) return
            updatePointer(e.clientX, e.clientY)

            timeRef.current = 0
            lastTsRef.current = performance.now()
            cursorTrailRef.current = []

            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = undefined
            }
            startTransition(() => setIsHovered(true))
            animationRef.current = requestAnimationFrame(render)
        },
        [isStatic, webglReady, updatePointer, render]
    )

    const handlePointerLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsHovered(false))
    }, [isStatic])

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true)
        setImageError(false)
    }, [])

    const handleImageError = useCallback(() => {
        console.warn("Image failed to load (CORS?)")
        setImageError(true)
        setImageLoaded(false)
    }, [])

    // ===== Effects =====
    useEffect(() => {
        if (lastImageSrcRef.current !== image.src) {
            lastImageSrcRef.current = image.src
            cleanupWebGL()
            setImageLoaded(false)
            setImageError(false)
            setForceUpdate((p) => p + 1)
        }
    }, [image.src, cleanupWebGL])

    useEffect(() => {
        if (imageLoaded && !isStatic && !webglInitializedRef.current) {
            const t = setTimeout(setupWebGL, 100)
            return () => clearTimeout(t)
        }
    }, [setupWebGL, imageLoaded, isStatic, forceUpdate])

    useEffect(() => {
        return () => {
            const canvas = canvasRef.current as any
            if (canvas && canvas._glHandlers) {
                canvas.removeEventListener(
                    "webglcontextlost",
                    canvas._glHandlers.onLost
                )
                canvas.removeEventListener(
                    "webglcontextrestored",
                    canvas._glHandlers.onRestored
                )
            }
            cleanupWebGL()
        }
    }, [cleanupWebGL])

    // Handle resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !webglReady) return
        const onResize = () => {
            const c = canvasRef.current!
            const rect = c.getBoundingClientRect()
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                Math.max(1, qualityScale)
            )
            c.width = Math.max(1, Math.floor(rect.width * dpr))
            c.height = Math.max(1, Math.floor(rect.height * dpr))
            if (glRef.current) {
                glRef.current.viewport(0, 0, c.width, c.height)
            }
            const img = imageRef.current
            if (img) computeCover(c, img)
            if (!animationRef.current) {
                render(performance.now())
            }
        }
        onResize()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [webglReady, render, computeCover, qualityScale])

    // ===== Render TSX =====
    if (isStatic) {
        return (
            <div
                style={{ width: "100%", height: "100%", position: "relative" }}
            >
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
                ...(props.style || {}),
            }}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
        >
            <img
                ref={imageRef}
                src={image.src}
                alt={image.alt}
                style={{ display: "none" }}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
                key={forceUpdate}
            />

            {(!webglReady || imageError) && (
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                />
            )}

            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    width: "100%",
                    height: "100%",
                    display: webglReady ? "block" : "none",
                    cursor: "pointer",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    )
}

// ===== Framer Controls =====
addPropertyControls(ImageRipple, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    effectWidth: {
        type: ControlType.Number,
        title: "Effect Width",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.01,
    },
    effectHeight: {
        type: ControlType.Number,
        title: "Effect Height",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.01,
    },
    distortionStrength: {
        type: ControlType.Number,
        title: "Distortion Strength",
        defaultValue: 0.08,
        min: 0,
        max: 0.3,
        step: 0.001,
    },
    distortionRadius: {
        type: ControlType.Number,
        title: "Distortion Radius",
        defaultValue: 0.3,
        min: 0.05,
        max: 1.0,
        step: 0.01,
    },
    distortionFalloff: {
        type: ControlType.Number,
        title: "Distortion Falloff",
        defaultValue: 2.0,
        min: 0.5,
        max: 5.0,
        step: 0.1,
    },
    mouseOffset: {
        type: ControlType.Number,
        title: "Mouse Offset",
        defaultValue: 0.05,
        min: 0,
        max: 0.2,
        step: 0.001,
    },
    liquidLineDensity: {
        type: ControlType.Number,
        title: "Liquid Line Density",
        defaultValue: 2.0,
        min: 0.5,
        max: 5.0,
        step: 0.1,
    },
    rippleStrength: {
        type: ControlType.Number,
        title: "Ripple Strength",
        defaultValue: 0.02,
        min: 0,
        max: 0.1,
        step: 0.001,
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Ripple Speed",
        defaultValue: 0.03,
        min: 0.01,
        max: 0.1,
        step: 0.001,
    },
    rippleDensity: {
        type: ControlType.Number,
        title: "Ripple Density",
        defaultValue: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
    },
    dampening: {
        type: ControlType.Number,
        title: "Dampening",
        defaultValue: 0.99,
        min: 0.9,
        max: 0.999,
        step: 0.001,
    },
    qualityScale: {
        type: ControlType.Number,
        title: "Quality (DPR cap)",
        defaultValue: 2.0,
        min: 1.0,
        max: 3.0,
        step: 0.1,
    },
    maxTrail: {
        type: ControlType.Number,
        title: "Max Trail",
        defaultValue: 32,
        min: 8,
        max: 64,
        step: 1,
    },
})
