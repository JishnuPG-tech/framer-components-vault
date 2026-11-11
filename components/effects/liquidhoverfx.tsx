// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useCallback, useMemo } from "react"

/**
 * Fluid Distortion — Interactive WebGL fluid simulation with image distortion
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerMinWidth 100
 * @framerMinHeight 100
 */

interface Props {
    imageUrl: { src: string; srcSet?: string; alt?: string }
    imageFit: "fill" | "cover" | "contain"
    cursorSize: number
    cursorPower: number
    distortionPower: number
    autoAnimate: boolean
    style?: React.CSSProperties
}

// Shader sources
const VERT_SHADER = `
precision highp float;
varying vec2 vUv;
attribute vec2 a_position;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;

void main () {
    vUv = .5 * (a_position + 1.);
    vL = vUv - vec2(u_texel.x, 0.);
    vR = vUv + vec2(u_texel.x, 0.);
    vT = vUv + vec2(0., u_texel.y);
    vB = vUv - vec2(0., u_texel.y);
    gl_Position = vec4(a_position, 0., 1.);
}
`

const FRAG_ADVECTION = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform vec2 u_output_textel;
uniform float u_dt;
uniform float u_dissipation;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
    vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
    vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
    gl_FragColor = u_dissipation * velocity;
}
`

const FRAG_DIVERGENCE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;

void main () {
    float L = texture2D(u_velocity_texture, vL).x;
    float R = texture2D(u_velocity_texture, vR).x;
    float T = texture2D(u_velocity_texture, vT).y;
    float B = texture2D(u_velocity_texture, vB).y;
    float div = .25 * (R - L + T - B);
    gl_FragColor = vec4(div, 0., 0., 1.);
}
`

const FRAG_PRESSURE = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;

void main () {
    float L = texture2D(u_pressure_texture, vL).x;
    float R = texture2D(u_pressure_texture, vR).x;
    float T = texture2D(u_pressure_texture, vT).x;
    float B = texture2D(u_pressure_texture, vB).x;
    float C = texture2D(u_pressure_texture, vUv).x;
    float divergence = texture2D(u_divergence_texture, vUv).x;
    float pressure = (L + R + B + T - divergence) * .25;
    gl_FragColor = vec4(pressure, 0., 0., 1.);
}
`

const FRAG_GRADIENT_SUBTRACT = `
precision highp float;
precision highp sampler2D;
varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;

void main () {
    float L = texture2D(u_pressure_texture, vL).x;
    float R = texture2D(u_pressure_texture, vR).x;
    float T = texture2D(u_pressure_texture, vT).x;
    float B = texture2D(u_pressure_texture, vB).x;
    vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0., 1.);
}
`

const FRAG_SPLAT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform float u_img_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;

void main () {
    vec2 p = vUv - u_point.xy;
    p.x *= u_ratio;
    vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
    vec3 base = texture2D(u_input_texture, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.);
}
`

const FRAG_OUTPUT = `
precision highp float;
precision highp sampler2D;
varying vec2 vUv;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_disturb_power;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_text_texture;
uniform vec2 u_point;
uniform int u_fit_mode;

void main () {
    float offset = texture2D(u_output_texture, vUv).r;
    vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
    velocity += .001;

    vec2 img_uv = vUv;
    bool letterbox = false;

    if (u_fit_mode == 1) {
        // Cover: scale to fill canvas, crop excess
        if (u_ratio > u_img_ratio) {
            float scale = u_ratio / u_img_ratio;
            img_uv.y = (vUv.y - 0.5) / scale + 0.5;
        } else {
            float scale = u_img_ratio / u_ratio;
            img_uv.x = (vUv.x - 0.5) / scale + 0.5;
        }
    } else if (u_fit_mode == 2) {
        // Contain: scale to fit within canvas, letterbox remainder
        if (u_ratio > u_img_ratio) {
            float scale = u_ratio / u_img_ratio;
            img_uv.x = (vUv.x - 0.5) * scale + 0.5;
        } else {
            float scale = u_img_ratio / u_ratio;
            img_uv.y = (vUv.y - 0.5) * scale + 0.5;
        }
        letterbox = (img_uv.x < 0.0 || img_uv.x > 1.0 || img_uv.y < 0.0 || img_uv.y > 1.0);
    }
    // fill (u_fit_mode == 0): img_uv = vUv, no adjustment

    img_uv -= u_disturb_power * normalize(velocity) * offset * 2.0;
    img_uv = clamp(img_uv, 0.001, 0.999);

    vec3 img = texture2D(u_text_texture, vec2(img_uv.x, 1.0 - img_uv.y)).rgb;

    if (letterbox) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        gl_FragColor = vec4(img, 1.0);
    }
}
`

export default function FluidDistortion(props: Props) {
    const {
        imageUrl = {
            src: "https://ksenia-k.com/img/codepen/for-fluid-sim-demo-1.jpg",
            alt: "Fluid distortion image",
        },
        imageFit = "cover",
        cursorSize = 2,
        cursorPower = 24,
        distortionPower = 0.4,
        autoAnimate = true,
        style,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const animationRef = useRef<number>(0)
    const pointerRef = useRef({
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        moved: false,
    })
    const isPreviewRef = useRef(true)
    const programsRef = useRef<any>({})
    const fbosRef = useRef<any>({})
    const imgRatioRef = useRef(1)
    const imageTextureRef = useRef<WebGLTexture | null>(null)
    const resRef = useRef({ w: 256, h: 256 })
    const propsRef = useRef({
        cursorSize,
        cursorPower,
        distortionPower,
        imageFit,
    })

    // Update props ref when they change
    useEffect(() => {
        propsRef.current = {
            cursorSize,
            cursorPower,
            distortionPower,
            imageFit,
        }
    }, [cursorSize, cursorPower, distortionPower, imageFit])

    const createShader = useCallback(
        (
            gl: WebGLRenderingContext,
            source: string,
            type: number
        ): WebGLShader | null => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(
                    "Shader compile error:",
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
        (
            gl: WebGLRenderingContext,
            vertexShader: WebGLShader,
            fragmentShader: WebGLShader
        ) => {
            const program = gl.createProgram()
            if (!program) return null
            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)
            gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(
                    "Program link error:",
                    gl.getProgramInfoLog(program)
                )
                return null
            }
            const uniforms: Record<string, WebGLUniformLocation | null> = {}
            const uniformCount = gl.getProgramParameter(
                program,
                gl.ACTIVE_UNIFORMS
            )
            for (let i = 0; i < uniformCount; i++) {
                const info = gl.getActiveUniform(program, i)
                if (info) {
                    uniforms[info.name] = gl.getUniformLocation(
                        program,
                        info.name
                    )
                }
            }
            return { program, uniforms }
        },
        []
    )

    const createFBO = useCallback(
        (gl: WebGLRenderingContext, w: number, h: number) => {
            gl.activeTexture(gl.TEXTURE0)
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGB,
                w,
                h,
                0,
                gl.RGB,
                gl.FLOAT,
                null
            )

            const fbo = gl.createFramebuffer()
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                texture,
                0
            )
            gl.viewport(0, 0, w, h)
            gl.clear(gl.COLOR_BUFFER_BIT)

            return {
                fbo,
                width: w,
                height: h,
                attach(id: number) {
                    gl.activeTexture(gl.TEXTURE0 + id)
                    gl.bindTexture(gl.TEXTURE_2D, texture)
                    return id
                },
            }
        },
        []
    )

    const createDoubleFBO = useCallback(
        (gl: WebGLRenderingContext, w: number, h: number) => {
            let fbo1 = createFBO(gl, w, h)
            let fbo2 = createFBO(gl, w, h)
            return {
                width: w,
                height: h,
                texelSizeX: 1 / w,
                texelSizeY: 1 / h,
                read: () => fbo1,
                write: () => fbo2,
                swap() {
                    const temp = fbo1
                    fbo1 = fbo2
                    fbo2 = temp
                },
            }
        },
        [createFBO]
    )

    const blit = useCallback((gl: WebGLRenderingContext, target: any) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
            gl.STATIC_DRAW
        )
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array([0, 1, 2, 0, 2, 3]),
            gl.STATIC_DRAW
        )
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(0)

        if (target == null) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        } else {
            gl.viewport(0, 0, target.width, target.height)
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
    }, [])

    const loadImage = useCallback((gl: WebGLRenderingContext, src: string) => {
        const image = new Image()
        image.crossOrigin = "anonymous"
        image.src = src
        image.onload = () => {
            imgRatioRef.current = image.naturalWidth / image.naturalHeight
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            imageTextureRef.current = texture
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl")
        if (!gl) return
        gl.getExtension("OES_texture_float")
        glRef.current = gl

        // Create shaders
        const vertShader = createShader(gl, VERT_SHADER, gl.VERTEX_SHADER)
        if (!vertShader) return

        const createProg = (fragSource: string) => {
            const fragShader = createShader(gl, fragSource, gl.FRAGMENT_SHADER)
            if (!fragShader) return null
            return createProgram(gl, vertShader, fragShader)
        }

        programsRef.current = {
            splat: createProg(FRAG_SPLAT),
            divergence: createProg(FRAG_DIVERGENCE),
            pressure: createProg(FRAG_PRESSURE),
            gradientSubtract: createProg(FRAG_GRADIENT_SUBTRACT),
            advection: createProg(FRAG_ADVECTION),
            display: createProg(FRAG_OUTPUT),
        }

        // Initialize
        const initFBOs = () => {
            const { w, h } = resRef.current
            fbosRef.current = {
                outputColor: createDoubleFBO(gl, w, h),
                velocity: createDoubleFBO(gl, w, h),
                divergence: createFBO(gl, w, h),
                pressure: createDoubleFBO(gl, w, h),
            }
        }

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
            const ratio = canvas.width / canvas.height
            resRef.current.w = Math.max(256 * ratio, canvas.width)
            resRef.current.h = Math.max(256, canvas.height)
            pointerRef.current.x = 0.65 * canvas.width
            pointerRef.current.y = 0.5 * canvas.height
        }

        resizeCanvas()
        initFBOs()
        loadImage(gl, imageUrl.src)

        const updatePointerPosition = (eX: number, eY: number) => {
            const rect = canvas.getBoundingClientRect()
            const x = (eX - rect.left) * window.devicePixelRatio
            const y = (eY - rect.top) * window.devicePixelRatio
            pointerRef.current.moved = true
            pointerRef.current.dx = 6 * (x - pointerRef.current.x)
            pointerRef.current.dy = 6 * (y - pointerRef.current.y)
            pointerRef.current.x = x
            pointerRef.current.y = y
        }

        const handleMouseMove = (e: MouseEvent) => {
            isPreviewRef.current = false
            updatePointerPosition(e.clientX, e.clientY)
        }

        const handleTouchMove = (e: TouchEvent) => {
            isPreviewRef.current = false
            e.preventDefault()
            updatePointerPosition(
                e.targetTouches[0].clientX,
                e.targetTouches[0].clientY
            )
        }

        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        })

        const render = (t: number) => {
            if (!glRef.current) return
            const gl = glRef.current
            const {
                splat,
                divergence,
                pressure,
                gradientSubtract,
                advection,
                display,
            } = programsRef.current
            const {
                outputColor,
                velocity,
                divergence: div,
                pressure: pres,
            } = fbosRef.current
            const { cursorSize, cursorPower, distortionPower, imageFit } =
                propsRef.current

            const dt = 1 / 60

            if (autoAnimate && isPreviewRef.current) {
                updatePointerPosition(
                    (canvas.width * (0.5 + 0.25 * Math.sin(0.002 * t - 3.14))) /
                        window.devicePixelRatio,
                    (canvas.height *
                        (0.5 +
                            0.1 * Math.sin(0.005 * t) * Math.cos(0.002 * t))) /
                        window.devicePixelRatio
                )
            }

            if (pointerRef.current.moved) {
                if (!isPreviewRef.current) {
                    pointerRef.current.moved = false
                }

                gl.useProgram(splat.program)
                gl.uniform1i(
                    splat.uniforms.u_input_texture,
                    velocity.read().attach(1)
                )
                gl.uniform1f(
                    splat.uniforms.u_ratio,
                    canvas.width / canvas.height
                )
                gl.uniform2f(
                    splat.uniforms.u_point,
                    pointerRef.current.x / canvas.width,
                    1 - pointerRef.current.y / canvas.height
                )
                gl.uniform3f(
                    splat.uniforms.u_point_value,
                    pointerRef.current.dx,
                    -pointerRef.current.dy,
                    0
                )
                gl.uniform1f(splat.uniforms.u_point_size, cursorSize * 0.001)
                blit(gl, velocity.write())
                velocity.swap()

                gl.uniform1i(
                    splat.uniforms.u_input_texture,
                    outputColor.read().attach(1)
                )
                gl.uniform3f(
                    splat.uniforms.u_point_value,
                    cursorPower * 0.001,
                    0,
                    0
                )
                blit(gl, outputColor.write())
                outputColor.swap()
            }

            gl.useProgram(divergence.program)
            gl.uniform2f(
                divergence.uniforms.u_texel,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                divergence.uniforms.u_velocity_texture,
                velocity.read().attach(1)
            )
            blit(gl, div)

            gl.useProgram(pressure.program)
            gl.uniform2f(
                pressure.uniforms.u_texel,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(pressure.uniforms.u_divergence_texture, div.attach(1))
            for (let i = 0; i < 16; i++) {
                gl.uniform1i(
                    pressure.uniforms.u_pressure_texture,
                    pres.read().attach(2)
                )
                blit(gl, pres.write())
                pres.swap()
            }

            gl.useProgram(gradientSubtract.program)
            gl.uniform2f(
                gradientSubtract.uniforms.u_texel,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                gradientSubtract.uniforms.u_pressure_texture,
                pres.read().attach(1)
            )
            gl.uniform1i(
                gradientSubtract.uniforms.u_velocity_texture,
                velocity.read().attach(2)
            )
            blit(gl, velocity.write())
            velocity.swap()

            gl.useProgram(advection.program)
            gl.uniform2f(
                advection.uniforms.u_texel,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform2f(
                advection.uniforms.u_output_textel,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                advection.uniforms.u_velocity_texture,
                velocity.read().attach(1)
            )
            gl.uniform1i(
                advection.uniforms.u_input_texture,
                velocity.read().attach(1)
            )
            gl.uniform1f(advection.uniforms.u_dt, dt)
            gl.uniform1f(advection.uniforms.u_dissipation, 0.97)
            blit(gl, velocity.write())
            velocity.swap()

            gl.useProgram(advection.program)
            gl.uniform2f(
                advection.uniforms.u_output_textel,
                outputColor.texelSizeX,
                outputColor.texelSizeY
            )
            gl.uniform1i(
                advection.uniforms.u_input_texture,
                outputColor.read().attach(2)
            )
            gl.uniform1f(advection.uniforms.u_dt, 8 * dt)
            gl.uniform1f(advection.uniforms.u_dissipation, 0.98)
            blit(gl, outputColor.write())
            outputColor.swap()

            gl.useProgram(display.program)
            gl.uniform2f(
                display.uniforms.u_point,
                pointerRef.current.x / canvas.width,
                1 - pointerRef.current.y / canvas.height
            )
            gl.uniform1i(
                display.uniforms.u_velocity_texture,
                velocity.read().attach(2)
            )
            gl.uniform1f(display.uniforms.u_ratio, canvas.width / canvas.height)
            gl.uniform1f(display.uniforms.u_img_ratio, imgRatioRef.current)
            gl.uniform1f(display.uniforms.u_disturb_power, distortionPower)
            const fitModeMap: Record<string, number> = {
                fill: 0,
                cover: 1,
                contain: 2,
            }
            gl.uniform1i(display.uniforms.u_fit_mode, fitModeMap[imageFit] ?? 1)
            gl.uniform1i(
                display.uniforms.u_output_texture,
                outputColor.read().attach(1)
            )

            if (imageTextureRef.current) {
                gl.activeTexture(gl.TEXTURE3)
                gl.bindTexture(gl.TEXTURE_2D, imageTextureRef.current)
                gl.uniform1i(display.uniforms.u_text_texture, 3)
            }

            blit(gl, null)

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)

            animationRef.current = requestAnimationFrame(render)
        }

        animationRef.current = requestAnimationFrame(render)

        const handleResize = () => {
            resizeCanvas()
            initFBOs()
            if (imageTextureRef.current) {
                gl.bindTexture(gl.TEXTURE_2D, imageTextureRef.current)
            }
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(canvas)

        return () => {
            cancelAnimationFrame(animationRef.current)
            canvas.removeEventListener("mousemove", handleMouseMove)
            canvas.removeEventListener("touchmove", handleTouchMove)
            resizeObserver.disconnect()
        }
    }, [
        imageUrl.src,
        autoAnimate,
        createShader,
        createProgram,
        createFBO,
        createDoubleFBO,
        blit,
        loadImage,
    ])

    // Reload image when URL changes
    useEffect(() => {
        if (glRef.current) {
            loadImage(glRef.current, imageUrl.src)
        }
    }, [imageUrl.src, loadImage])

    const containerStyle: React.CSSProperties = useMemo(
        () => ({
            width: 800,
            height: 600,
            ...style,
            position: "relative",
            overflow: "hidden",
            background: "#000",
        }),
        [style]
    )

    const canvasStyle: React.CSSProperties = useMemo(
        () => ({
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
        }),
        []
    )

    return (
        <div style={containerStyle}>
            <canvas ref={canvasRef} style={canvasStyle} />
        </div>
    )
}

FluidDistortion.defaultProps = {
    imageUrl: {
        src: "https://ksenia-k.com/img/codepen/for-fluid-sim-demo-1.jpg",
        alt: "Fluid distortion image",
    },
    imageFit: "cover",
    cursorSize: 2,
    cursorPower: 24,
    distortionPower: 0.4,
    autoAnimate: true,
}

FluidDistortion.displayName = "Fluid Distortion"

addPropertyControls(FluidDistortion, {
    imageUrl: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "cover",
        options: ["fill", "cover", "contain"],
        optionTitles: ["Fill", "Cover", "Contain"],
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        displayStepper: true,
    },
    cursorPower: {
        type: ControlType.Number,
        title: "Cursor Power",
        defaultValue: 24,
        min: 1,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    distortionPower: {
        type: ControlType.Number,
        title: "Distortion",
        defaultValue: 0.4,
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: true,
    },
    autoAnimate: {
        type: ControlType.Boolean,
        title: "Auto Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
