// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion, useScroll, useTransform, useMotionValue, animate } from "framer-motion"
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

/*
User requests implemented:
- Gate the WebGL requestAnimationFrame loop using IntersectionObserver so it only runs while the tile is in view or being interacted with.
- Remove the misleading columns control (single-tile component; no columns property).
- Ensure default setup closely matches the live preview (strong default styling and visible hover-like preview in thumbnail).
- Sharper thumbnail preview (thumbnail shows an active hover state and higher DPR canvas).
- Use native Framer border control (ControlType.Border and Border type).
- Simplify to one effect at a time on a single image.
*/

type Border = {
    borderColor?: string
    borderStyle?: "solid" | "dashed" | "dotted" | "double"
    borderWidth?: number
    borderTopWidth?: number
    borderLeftWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
}

type FramerImage = {
    src: string
    srcSet?: string
    alt?: string
}

type EffectMode = "ripple" | "blurDissolve" | "parallax"

interface ScrollHoverImageGalleryProps {
    image: FramerImage
    caption: string
    showCaption: boolean

    effect: EffectMode

    background: string
    tileBackground: string
    border: Border
    shadow: string
    radius: string

    captionColor: string
    captionFont: any

    blurIntensity: number
    fadeDuration: number
    scaleSpeed: number
    hoverSensitivity: number
    rippleStrength: number
    scrollThreshold: number

    parallax: number
    glowColor: string
    glowStrength: number

    style?: CSSProperties
}

/**
 * Hover Scroll Image Effect
 *
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ScrollHoverImageGallery(props: ScrollHoverImageGalleryProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        caption = "Premium Hover Ripple",
        showCaption = true,

        effect = "ripple",

        background = "#0a0a0f",
        tileBackground = "#0f0f17",
        border = { borderWidth: 1, borderStyle: "solid", borderColor: "#22222a" },
        shadow = "0 14px 45px rgba(0,0,0,0.18)",
        radius = "18px",

        captionColor = "#FFFFFF",
        captionFont,

        blurIntensity = 16,
        fadeDuration = 0.55,
        scaleSpeed = 0.85,
        hoverSensitivity = 0.65,
        rippleStrength = 0.08,
        scrollThreshold = 0.35,

        parallax = 22,
        glowColor = "rgba(255,255,255,0.65)",
        glowStrength = 0.55,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, {
        amount: Math.max(0.05, Math.min(0.95, scrollThreshold)),
        margin: "0px 0px -8% 0px",
    })

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: ["start end", "end start"],
    })

    const [hovered, setHovered] = useState(false)

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const previewActive = isThumbnail ? true : hovered

    const presence = useMotionValue(inView ? 1 : 0)
    useEffect(() => {
        if (reducedMotion) {
            presence.set(inView ? 1 : 0)
            return
        }

        const controls = animate(presence, inView ? 1 : 0, {
            duration: Math.max(0.15, fadeDuration),
            ease: [0.22, 0.9, 0.12, 1],
        })
        return () => controls.stop()
    }, [inView, fadeDuration, reducedMotion, presence])

    const exitBlur = useTransform(presence, [0, 1], [Math.max(0, blurIntensity), 0])
    const exitOpacity = useTransform(presence, [0, 0.55, 1], [0, 0.75, 1])
    const exitScale = useTransform(presence, [0, 1], [0.975, 1.02])

    const hoverScale = useMemo(() => {
        const s = 1 + Math.min(0.18, Math.max(0, hoverSensitivity) * 0.14)
        return Math.max(1, s)
    }, [hoverSensitivity])

    const parallaxY = useTransform(scrollYProgress, [0, 1], [parallax, -parallax])

    const glowOpacity = useMemo(() => {
        if (!previewActive) return 0
        return Math.max(0, Math.min(1, glowStrength))
    }, [previewActive, glowStrength])

    const tileBase: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: radius,
            background: tileBackground,
            ...border,
            boxShadow: shadow,
            transform: "translateZ(0)",
            willChange: "transform, opacity, filter",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
        }),
        [radius, tileBackground, border, shadow]
    )

    const containerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            background,
            overflow: "hidden",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
        }),
        [background]
    )

    const handleHoverStart = useCallback(() => startTransition(() => setHovered(true)), [])
    const handleHoverEnd = useCallback(() => startTransition(() => setHovered(false)), [])

    if (isStatic) {
        return (
            <div style={containerStyle}>
                <div
                    style={{
                        ...tileBase,
                        margin: 18,
                    }}
                >
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transform: "scale(1.06)",
                            filter: "contrast(1.05) saturate(1.1)",
                        }}
                    />
                    {showCaption && caption ? (
                        <div
                            style={{
                                position: "absolute",
                                left: 12,
                                bottom: 12,
                                display: "inline-flex",
                                maxWidth: "calc(100% - 24px)",
                                boxSizing: "border-box",
                                alignItems: "center",
                                padding: "7px 10px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.62)",
                                border: "1px solid rgba(255,255,255,0.55)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                color: captionColor,
                                overflow: "hidden",
                            }}
                        >
                            <span
                                style={{
                                    width: "max-content",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    ...captionFont,
                                }}
                            >
                                {caption}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

    const shouldRunWebGL = effect === "ripple" && !reducedMotion && (previewActive || inView || isThumbnail)

    return (
        <div style={containerStyle}>
            <motion.div
                ref={rootRef}
                style={{
                    ...tileBase,
                    margin: 18,
                    opacity: exitOpacity,
                    y: effect === "parallax" ? (parallaxY as any) : 0,
                }}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }}
                animate={reducedMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{
                    duration: Math.max(0.2, fadeDuration),
                    ease: [0.22, 0.9, 0.12, 1],
                }}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
                onFocus={handleHoverStart}
                onBlur={handleHoverEnd}
                tabIndex={0}
                role="group"
                aria-label={image.alt || caption || "Image"}
            >
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -2,
                        opacity: glowOpacity,
                        borderRadius: radius,
                        pointerEvents: "none",
                        background: `radial-gradient(70% 85% at 50% 15%, ${glowColor}, rgba(255,255,255,0) 62%)`,
                        filter: "blur(10px)",
                        transform: "translateZ(0)",
                        willChange: "opacity",
                    }}
                />

                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        overflow: "hidden",
                        transform: "translateZ(0)",
                        willChange: "transform, filter, opacity",
                        scale: exitScale as any,
                        filter: effect === "blurDissolve" ? (exitBlur as any) : "none",
                    }}
                    animate={
                        reducedMotion
                            ? {}
                            : previewActive
                              ? {
                                    scale: hoverScale,
                                    filter: effect === "blurDissolve" ? "blur(0px)" : "none",
                                }
                              : {
                                    scale: 1,
                                    filter:
                                        effect === "blurDissolve"
                                            ? `blur(${Math.max(0, (1 - Number(inView)) * blurIntensity)}px)`
                                            : "none",
                                }
                    }
                    transition={{
                        duration: Math.max(0.18, scaleSpeed),
                        ease: [0.22, 0.9, 0.12, 1],
                    }}
                >
                    {effect === "ripple" ? (
                        <WebGLRippleImage
                            src={image.src}
                            alt={image.alt || ""}
                            active={previewActive || isThumbnail}
                            shouldRun={shouldRunWebGL}
                            strength={Math.max(0, Math.min(0.18, rippleStrength))}
                        />
                    ) : (
                        <img
                            src={image.src}
                            srcSet={image.srcSet}
                            alt={image.alt || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transform: "translateZ(0)",
                            }}
                        />
                    )}

                    <motion.div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            opacity: previewActive ? 1 : 0,
                            transition: `opacity ${Math.max(0.12, scaleSpeed * 0.6)}s cubic-bezier(0.22, 0.9, 0.12, 1)`,
                            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.14)`,
                            background:
                                "radial-gradient(60% 50% at 50% 30%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
                            filter: "blur(12px)",
                            mixBlendMode: "screen",
                            transform: "translateZ(0)",
                        }}
                    />

                    {effect === "blurDissolve" ? (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                opacity: inView ? 0 : 1,
                                transition: `opacity ${Math.max(0.2, fadeDuration)}s cubic-bezier(0.22, 0.9, 0.12, 1)`,
                                background:
                                    "radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.06), rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(10,10,15,0.12), rgba(10,10,15,0.5))",
                                mixBlendMode: "multiply",
                            }}
                        />
                    ) : null}
                </motion.div>

                {showCaption && caption ? (
                    <div
                        style={{
                            position: "absolute",
                            left: 12,
                            bottom: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.62)",
                            border: "1px solid rgba(255,255,255,0.55)",
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            color: captionColor,
                            maxWidth: "calc(100% - 24px)",
                            boxSizing: "border-box",
                            transform: "translateZ(0)",
                            opacity: previewActive ? 0 : 1,
                            transition: "opacity 260ms ease",
                        }}
                    >
                        <span
                            style={{
                                width: "max-content",
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                ...captionFont,
                            }}
                        >
                            {caption}
                        </span>
                    </div>
                ) : null}
            </motion.div>
        </div>
    )
}

function WebGLRippleImage(props: {
    src: string
    alt: string
    active: boolean
    shouldRun: boolean
    strength: number
}) {
    const { src, alt, active, shouldRun, strength } = props

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const rafRef = useRef<number | null>(null)
    const isVisibleRef = useRef<boolean>(true)
    const isInteractingRef = useRef<boolean>(false)

    const stateRef = useRef({
        gl: null as WebGLRenderingContext | null,
        program: null as WebGLProgram | null,
        uniforms: {
            uTime: null as WebGLUniformLocation | null,
            uStrength: null as WebGLUniformLocation | null,
            uMouse: null as WebGLUniformLocation | null,
            uResolution: null as WebGLUniformLocation | null,
        },
        tex: null as WebGLTexture | null,
        noiseTex: null as WebGLTexture | null,
        startTime: 0,
        strength: 0,
        strengthFrom: 0,
        strengthTo: 0,
        strengthStart: 0,
        strengthDur: 0,
        mouse: { x: 0.5, y: 0.5 },
        mouseTarget: { x: 0.5, y: 0.5 },
        lastSize: { w: 0, h: 0, dpr: 1 },
    })

    const stopRAF = useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const scheduleStrengthTween = useCallback((to: number, ms: number) => {
        if (typeof window === "undefined") return
        const s = stateRef.current
        s.strengthFrom = s.strength
        s.strengthTo = to
        s.strengthStart = performance.now()
        s.strengthDur = Math.max(16, ms)
    }, [])

    const computeShouldRun = useCallback(() => {
        return shouldRun && (isVisibleRef.current || isInteractingRef.current)
    }, [shouldRun])

    const startRAFIfNeeded = useCallback(() => {
        if (typeof window === "undefined") return
        if (!computeShouldRun()) {
            stopRAF()
            return
        }
        if (rafRef.current != null) return

        const tick = () => {
            if (typeof window === "undefined") return
            const s = stateRef.current
            const gl = s.gl
            const program = s.program
            const canvas = canvasRef.current

            if (!gl || !program || !canvas) {
                rafRef.current = null
                return
            }

            if (!computeShouldRun()) {
                rafRef.current = null
                return
            }

            // Resize
            const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1))
            const rect = canvas.getBoundingClientRect()
            const w = Math.max(1, Math.round(rect.width * dpr))
            const h = Math.max(1, Math.round(rect.height * dpr))
            if (w !== s.lastSize.w || h !== s.lastSize.h || dpr !== s.lastSize.dpr) {
                canvas.width = w
                canvas.height = h
                s.lastSize = { w, h, dpr }
                gl.viewport(0, 0, w, h)
                if (s.uniforms.uResolution) gl.uniform2f(s.uniforms.uResolution, w, h)
            }

            const now = performance.now()
            const time = (now - s.startTime) / 1000

            // Strength tween
            if (s.strengthDur > 0) {
                const t = Math.max(0, Math.min(1, (now - s.strengthStart) / s.strengthDur))
                const e = 1 - (1 - t) * (1 - t)
                s.strength = s.strengthFrom + (s.strengthTo - s.strengthFrom) * e
                if (t >= 1) s.strengthDur = 0
            }

            // Mouse lerp
            const damp = 0.08
            s.mouse.x += (s.mouseTarget.x - s.mouse.x) * damp
            s.mouse.y += (s.mouseTarget.y - s.mouse.y) * damp

            gl.useProgram(program)
            if (s.uniforms.uTime) gl.uniform1f(s.uniforms.uTime, time)
            if (s.uniforms.uStrength) gl.uniform1f(s.uniforms.uStrength, s.strength)
            if (s.uniforms.uMouse) gl.uniform2f(s.uniforms.uMouse, s.mouse.x, 1.0 - s.mouse.y)

            gl.drawArrays(gl.TRIANGLES, 0, 6)

            rafRef.current = window.requestAnimationFrame(tick)
        }

        rafRef.current = window.requestAnimationFrame(tick)
    }, [computeShouldRun, stopRAF])

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = wrapperRef.current
        if (!el) return

        isVisibleRef.current = true

        if (typeof IntersectionObserver === "undefined") return

        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                isVisibleRef.current = !!entry.isIntersecting
                if (isVisibleRef.current) {
                    startRAFIfNeeded()
                } else if (!isInteractingRef.current) {
                    stopRAF()
                }
            },
            { threshold: 0.01 }
        )

        io.observe(el)
        return () => io.disconnect()
    }, [startRAFIfNeeded, stopRAF])

    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
        })
        if (!gl) return

        const vert = `
        attribute vec2 aPos;
        varying vec2 vUv;
        void main() {
            vUv = (aPos + 1.0) * 0.5;
            gl_Position = vec4(aPos, 0.0, 1.0);
        }
        `

        const frag = `
        precision mediump float;
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform sampler2D uNoise;
        uniform vec2 uMouse;
        uniform float uStrength;
        uniform float uTime;
        uniform vec2 uResolution;

        void main() {
            vec2 uv = vUv;
            vec2 m = uMouse;
            float d = distance(uv, m);
            float hotspot = smoothstep(0.55, 0.0, d);

            vec2 nUv = uv * 1.35 + vec2(uTime * 0.05, -uTime * 0.04);
            vec4 n = texture2D(uNoise, nUv);
            vec2 offset = (n.rg - 0.5) * (uStrength * hotspot);

            vec4 c = texture2D(uTexture, uv + offset);
            gl_FragColor = c;
        }
        `

        const program = createProgram(gl, vert, frag)
        if (!program) return

        gl.useProgram(program)

        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )

        const aPos = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const tex = gl.createTexture()
        const noiseTex = gl.createTexture()
        if (!tex || !noiseTex) return

        stateRef.current.gl = gl
        stateRef.current.program = program
        stateRef.current.tex = tex
        stateRef.current.noiseTex = noiseTex
        stateRef.current.startTime = performance.now()

        stateRef.current.uniforms.uTime = gl.getUniformLocation(program, "uTime")
        stateRef.current.uniforms.uStrength = gl.getUniformLocation(program, "uStrength")
        stateRef.current.uniforms.uMouse = gl.getUniformLocation(program, "uMouse")
        stateRef.current.uniforms.uResolution = gl.getUniformLocation(program, "uResolution")

        // texture unit 0
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        const uTexture = gl.getUniformLocation(program, "uTexture")
        if (uTexture) gl.uniform1i(uTexture, 0)

        // noise texture unit 1
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, noiseTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        const uNoise = gl.getUniformLocation(program, "uNoise")
        if (uNoise) gl.uniform1i(uNoise, 1)
        initNoiseTexture(gl, noiseTex, 128)

        // Load image texture
        loadImageTexture(gl, tex, src).catch(() => {
            // If it fails (CORS), the component still renders; WebGL will just display nothing.
        })

        return () => {
            stopRAF()
        }
    }, [src, stopRAF])

    useEffect(() => {
        if (typeof window === "undefined") return
        scheduleStrengthTween(active ? strength : 0, active ? 550 : 420)
        startRAFIfNeeded()
    }, [active, strength, scheduleStrengthTween, startRAFIfNeeded])

    useEffect(() => {
        if (typeof window === "undefined") return
        startRAFIfNeeded()
        return () => stopRAF()
    }, [shouldRun, startRAFIfNeeded, stopRAF])

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const x = (e.clientX - rect.left) / Math.max(1, rect.width)
        const y = (e.clientY - rect.top) / Math.max(1, rect.height)
        const s = stateRef.current
        s.mouseTarget.x = Math.max(0, Math.min(1, x))
        s.mouseTarget.y = Math.max(0, Math.min(1, y))
    }, [])

    return (
        <div
            ref={wrapperRef}
            onPointerMove={onPointerMove}
            onPointerEnter={() => {
                isInteractingRef.current = true
                startRAFIfNeeded()
            }}
            onPointerLeave={() => {
                isInteractingRef.current = false
                if (!isVisibleRef.current) stopRAF()
            }}
            style={{
                position: "absolute",
                inset: 0,
                transform: "translateZ(0)",
                willChange: "transform",
            }}
            role="img"
            aria-label={alt}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return null
    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program)
        return null
    }
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return program
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

function initNoiseTexture(gl: WebGLRenderingContext, tex: WebGLTexture, size: number) {
    const data = new Uint8Array(size * size * 4)
    for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(Math.random() * 256)
        const g = Math.floor(Math.random() * 256)
        data[i] = r
        data[i + 1] = g
        data[i + 2] = 0
        data[i + 3] = 255
    }
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
}

async function loadImageTexture(gl: WebGLRenderingContext, tex: WebGLTexture, src: string) {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.decoding = "async"

    const p = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
    })

    img.src = src
    await p

    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
}

addPropertyControls(ScrollHoverImageGallery, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["ripple", "blurDissolve", "parallax"],
        optionTitles: ["WebGL Ripple", "Blur + Dissolve", "Parallax"],
        defaultValue: "ripple",
    },
    caption: {
        type: ControlType.String,
        title: "Caption",
        defaultValue: "Premium Hover Ripple",
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0f",
    },
    tileBackground: {
        type: ControlType.Color,
        title: "Tile BG",
        defaultValue: "#0f0f17",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#22222a",
        },
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 14px 45px rgba(0,0,0,0.18)",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "18px",
    },

    captionColor: {
        type: ControlType.Color,
        title: "Caption",
        defaultValue: "#FFFFFF",
        hidden: ({ showCaption }) => !showCaption,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: ({ showCaption }) => !showCaption,
    },

    blurIntensity: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ effect }) => effect !== "blurDissolve",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 0.55,
        min: 0.1,
        max: 1.8,
        step: 0.05,
        unit: "s",
    },
    scaleSpeed: {
        type: ControlType.Number,
        title: "Scale Speed",
        defaultValue: 0.85,
        min: 0.15,
        max: 2.2,
        step: 0.05,
        unit: "s",
    },
    hoverSensitivity: {
        type: ControlType.Number,
        title: "Hover Sens",
        defaultValue: 0.65,
        min: 0,
        max: 1,
        step: 0.01,
    },
    rippleStrength: {
        type: ControlType.Number,
        title: "Ripple",
        defaultValue: 0.08,
        min: 0,
        max: 0.18,
        step: 0.01,
        hidden: ({ effect }) => effect !== "ripple",
    },
    scrollThreshold: {
        type: ControlType.Number,
        title: "InView",
        defaultValue: 0.35,
        min: 0.05,
        max: 0.9,
        step: 0.01,
    },

    parallax: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 22,
        min: 0,
        max: 90,
        step: 1,
        unit: "px",
        hidden: ({ effect }) => effect !== "parallax",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#FFFFFF",
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Glow Amt",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
