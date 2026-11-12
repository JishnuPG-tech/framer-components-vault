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


/**
 * Flowing Cursor – Real WebGL Fluid Simulation
 * (Performance optimized – pauses when off-screen)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function FlowingCursor(props) {
    const {
        backgroundColor,
        simResolution,
        dyeResolution,
        densityDissipation,
        velocityDissipation,
        pressure,
        curl,
        splatRadius,
        splatForce,
        colorUpdateSpeed,
        shading,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const canvasRef = useRef(null)

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        let animationId = null
        let isVisible = true
        let gl, ext
        let dye, velocity, divergence, curlFBO, pressureFBO
        let lastUpdateTime = Date.now()
        let colorUpdateTimer = 0.0

        const pointers = [
            {
                id: -1,
                texcoordX: 0,
                texcoordY: 0,
                prevTexcoordX: 0,
                prevTexcoordY: 0,
                deltaX: 0,
                deltaY: 0,
                down: false,
                moved: false,
                color: { r: 0.3, g: 0.1, b: 0.6 },
            },
        ]

        const config = {
            SIM_RESOLUTION: simResolution,
            DYE_RESOLUTION: dyeResolution,
            DENSITY_DISSIPATION: densityDissipation,
            VELOCITY_DISSIPATION: velocityDissipation,
            PRESSURE: pressure,
            PRESSURE_ITERATIONS: 20,
            CURL: curl,
            SPLAT_RADIUS: splatRadius,
            SPLAT_FORCE: splatForce,
            SHADING: shading,
            COLORFUL: true,
            COLOR_UPDATE_SPEED: colorUpdateSpeed,
            PAUSED: false,
            BACK_COLOR: hexToRgb(backgroundColor),
            TRANSPARENT: false,
        }

        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
            return result
                ? {
                      r: parseInt(result[1], 16) / 255,
                      g: parseInt(result[2], 16) / 255,
                      b: parseInt(result[3], 16) / 255,
                  }
                : { r: 0.04, g: 0.04, b: 0.06 }
        }

        // ========== Get WebGL context ==========
        function getWebGLContext(canvas) {
            const params = {
                alpha: true,
                depth: false,
                stencil: false,
                antialias: false,
                preserveDrawingBuffer: false,
            }

            let gl = canvas.getContext("webgl2", params)
            const isWebGL2 = !!gl
            if (!isWebGL2) {
                gl =
                    canvas.getContext("webgl", params) ||
                    canvas.getContext("experimental-webgl", params)
            }

            if (!gl) {
                console.error("WebGL not supported")
                return null
            }

            let halfFloat
            let supportLinearFiltering
            if (isWebGL2) {
                gl.getExtension("EXT_color_buffer_float")
                supportLinearFiltering = gl.getExtension(
                    "OES_texture_float_linear"
                )
            } else {
                halfFloat = gl.getExtension("OES_texture_half_float")
                supportLinearFiltering = gl.getExtension(
                    "OES_texture_half_float_linear"
                )
            }

            gl.clearColor(0.0, 0.0, 0.0, 1.0)

            const halfFloatTexType = isWebGL2
                ? gl.HALF_FLOAT
                : halfFloat.HALF_FLOAT_OES
            let formatRGBA, formatRG, formatR

            if (isWebGL2) {
                formatRGBA = getSupportedFormat(
                    gl,
                    gl.RGBA16F,
                    gl.RGBA,
                    halfFloatTexType
                )
                formatRG = getSupportedFormat(
                    gl,
                    gl.RG16F,
                    gl.RG,
                    halfFloatTexType
                )
                formatR = getSupportedFormat(
                    gl,
                    gl.R16F,
                    gl.RED,
                    halfFloatTexType
                )
            } else {
                formatRGBA = getSupportedFormat(
                    gl,
                    gl.RGBA,
                    gl.RGBA,
                    halfFloatTexType
                )
                formatRG = getSupportedFormat(
                    gl,
                    gl.RGBA,
                    gl.RGBA,
                    halfFloatTexType
                )
                formatR = getSupportedFormat(
                    gl,
                    gl.RGBA,
                    gl.RGBA,
                    halfFloatTexType
                )
            }

            return {
                gl,
                ext: {
                    formatRGBA,
                    formatRG,
                    formatR,
                    halfFloatTexType,
                    supportLinearFiltering,
                },
            }
        }

        function getSupportedFormat(gl, internalFormat, format, type) {
            if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
                switch (internalFormat) {
                    case gl.R16F:
                        return getSupportedFormat(gl, gl.RG16F, gl.RG, type)
                    case gl.RG16F:
                        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type)
                    default:
                        return null
                }
            }
            return { internalFormat, format }
        }

        function supportRenderTextureFormat(gl, internalFormat, format, type) {
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                4,
                4,
                0,
                format,
                type,
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

            const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
            return status === gl.FRAMEBUFFER_COMPLETE
        }

        const context = getWebGLContext(canvas)
        if (!context) return

        gl = context.gl
        ext = context.ext

        // ========== Shaders & Programs ==========
        function compileShader(type, source, keywords) {
            source = addKeywords(source, keywords)
            const shader = gl.createShader(type)
            gl.shaderSource(shader, source)
            gl.compileShader(shader)

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader))
            }
            return shader
        }

        function addKeywords(source, keywords) {
            if (!keywords) return source
            let keywordsString = ""
            keywords.forEach((keyword) => {
                keywordsString += "#define " + keyword + "\n"
            })
            return keywordsString + source
        }

        function createProgram(vertexShader, fragmentShader) {
            const program = gl.createProgram()
            gl.attachShader(program, vertexShader)
            gl.attachShader(program, fragmentShader)
            gl.linkProgram(program)

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error(gl.getProgramInfoLog(program))
            }
            return program
        }

        function getUniforms(program) {
            const uniforms = {}
            const uniformCount = gl.getProgramParameter(
                program,
                gl.ACTIVE_UNIFORMS
            )
            for (let i = 0; i < uniformCount; i++) {
                const uniformName = gl.getActiveUniform(program, i).name
                uniforms[uniformName] = gl.getUniformLocation(
                    program,
                    uniformName
                )
            }
            return uniforms
        }

        class Program {
            constructor(vertexShader, fragmentShader) {
                this.program = createProgram(vertexShader, fragmentShader)
                this.uniforms = getUniforms(this.program)
            }
            bind() {
                gl.useProgram(this.program)
            }
        }

        class Material {
            constructor(vertexShader, fragmentShaderSource) {
                this.vertexShader = vertexShader
                this.fragmentShaderSource = fragmentShaderSource
                this.programs = []
                this.activeProgram = null
                this.uniforms = []
            }
            setKeywords(keywords) {
                let hash = 0
                for (let i = 0; i < keywords.length; i++) {
                    hash += hashCode(keywords[i])
                }
                let program = this.programs[hash]
                if (program == null) {
                    const fragmentShader = compileShader(
                        gl.FRAGMENT_SHADER,
                        this.fragmentShaderSource,
                        keywords
                    )
                    program = createProgram(this.vertexShader, fragmentShader)
                    this.programs[hash] = program
                }
                if (program === this.activeProgram) return
                this.uniforms = getUniforms(program)
                this.activeProgram = program
            }
            bind() {
                gl.useProgram(this.activeProgram)
            }
        }

        const baseVertexShader = compileShader(
            gl.VERTEX_SHADER,
            `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `
        )

        const clearShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `
        )

        const colorShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      uniform vec4 color;
      void main () {
        gl_FragColor = color;
      }
    `
        )

        const displayShaderSource = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uTexture;
      uniform vec2 texelSize;
      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        #ifdef SHADING
          vec3 lc = texture2D(uTexture, vL).rgb;
          vec3 rc = texture2D(uTexture, vR).rgb;
          vec3 tc = texture2D(uTexture, vT).rgb;
          vec3 bc = texture2D(uTexture, vB).rgb;
          float dx = length(rc) - length(lc);
          float dy = length(tc) - length(bc);
          vec3 n = normalize(vec3(dx, dy, length(texelSize)));
          vec3 l = vec3(0.0, 0.0, 1.0);
          float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
          c *= diffuse;
        #endif
        float a = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c, a);
      }
    `

        const splatShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `
        )

        const advectionShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform vec2 dyeTexelSize;
      uniform float dt;
      uniform float dissipation;
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
        #ifdef MANUAL_FILTERING
          vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
          vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
          vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
          vec4 result = texture2D(uSource, coord);
        #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
      }
    `,
            ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]
        )

        const divergenceShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `
        )

        const curlShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `
        )

        const vorticityShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `
        )

        const pressureShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `
        )

        const gradientSubtractShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `
        )

        const clearProgram = new Program(baseVertexShader, clearShader)
        const colorProgram = new Program(baseVertexShader, colorShader)
        const splatProgram = new Program(baseVertexShader, splatShader)
        const advectionProgram = new Program(baseVertexShader, advectionShader)
        const divergenceProgram = new Program(
            baseVertexShader,
            divergenceShader
        )
        const curlProgram = new Program(baseVertexShader, curlShader)
        const vorticityProgram = new Program(baseVertexShader, vorticityShader)
        const pressureProgram = new Program(baseVertexShader, pressureShader)
        const gradientSubtractProgram = new Program(
            baseVertexShader,
            gradientSubtractShader
        )
        const displayMaterial = new Material(
            baseVertexShader,
            displayShaderSource
        )

        // ========== Framebuffers ==========
        function createFBO(w, h, internalFormat, format, type, param) {
            gl.activeTexture(gl.TEXTURE0)
            const texture = gl.createTexture()
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                w,
                h,
                0,
                format,
                type,
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
                texture,
                fbo,
                width: w,
                height: h,
                texelSizeX: 1.0 / w,
                texelSizeY: 1.0 / h,
                attach(id) {
                    gl.activeTexture(gl.TEXTURE0 + id)
                    gl.bindTexture(gl.TEXTURE_2D, texture)
                    return id
                },
            }
        }

        function createDoubleFBO(w, h, internalFormat, format, type, param) {
            let fbo1 = createFBO(w, h, internalFormat, format, type, param)
            let fbo2 = createFBO(w, h, internalFormat, format, type, param)
            return {
                width: w,
                height: h,
                texelSizeX: fbo1.texelSizeX,
                texelSizeY: fbo1.texelSizeY,
                get read() {
                    return fbo1
                },
                set read(value) {
                    fbo1 = value
                },
                get write() {
                    return fbo2
                },
                set write(value) {
                    fbo2 = value
                },
                swap() {
                    const temp = fbo1
                    fbo1 = fbo2
                    fbo2 = temp
                },
            }
        }

        function getResolution(resolution) {
            let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight
            if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio
            const min = Math.round(resolution)
            const max = Math.round(resolution * aspectRatio)
            if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
                return { width: max, height: min }
            }
            return { width: min, height: max }
        }

        function initFramebuffers() {
            const simRes = getResolution(config.SIM_RESOLUTION)
            const dyeRes = getResolution(config.DYE_RESOLUTION)

            const texType = ext.halfFloatTexType
            const rgba = ext.formatRGBA
            const rg = ext.formatRG
            const r = ext.formatR
            const filtering = ext.supportLinearFiltering
                ? gl.LINEAR
                : gl.NEAREST

            gl.disable(gl.BLEND)

            dye = createDoubleFBO(
                dyeRes.width,
                dyeRes.height,
                rgba.internalFormat,
                rgba.format,
                texType,
                filtering
            )
            velocity = createDoubleFBO(
                simRes.width,
                simRes.height,
                rg.internalFormat,
                rg.format,
                texType,
                filtering
            )
            divergence = createFBO(
                simRes.width,
                simRes.height,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
            curlFBO = createFBO(
                simRes.width,
                simRes.height,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
            pressureFBO = createDoubleFBO(
                simRes.width,
                simRes.height,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
        }

        // ========== Blit helper ==========
        const blit = (() => {
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

            return (target, clear = false) => {
                if (target == null) {
                    gl.viewport(
                        0,
                        0,
                        gl.drawingBufferWidth,
                        gl.drawingBufferHeight
                    )
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                } else {
                    gl.viewport(0, 0, target.width, target.height)
                    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
                }
                if (clear) {
                    gl.clearColor(0.0, 0.0, 0.0, 1.0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                }
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
            }
        })()

        // ========== Simulation ==========
        function step(dt) {
            gl.disable(gl.BLEND)

            curlProgram.bind()
            gl.uniform2f(
                curlProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                curlProgram.uniforms.uVelocity,
                velocity.read.attach(0)
            )
            blit(curlFBO)

            vorticityProgram.bind()
            gl.uniform2f(
                vorticityProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                vorticityProgram.uniforms.uVelocity,
                velocity.read.attach(0)
            )
            gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1))
            gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL)
            gl.uniform1f(vorticityProgram.uniforms.dt, dt)
            blit(velocity.write)
            velocity.swap()

            divergenceProgram.bind()
            gl.uniform2f(
                divergenceProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                divergenceProgram.uniforms.uVelocity,
                velocity.read.attach(0)
            )
            blit(divergence)

            clearProgram.bind()
            gl.uniform1i(
                clearProgram.uniforms.uTexture,
                pressureFBO.read.attach(0)
            )
            gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE)
            blit(pressureFBO.write)
            pressureFBO.swap()

            pressureProgram.bind()
            gl.uniform2f(
                pressureProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                pressureProgram.uniforms.uDivergence,
                divergence.attach(0)
            )
            for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
                gl.uniform1i(
                    pressureProgram.uniforms.uPressure,
                    pressureFBO.read.attach(1)
                )
                blit(pressureFBO.write)
                pressureFBO.swap()
            }

            gradientSubtractProgram.bind()
            gl.uniform2f(
                gradientSubtractProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            gl.uniform1i(
                gradientSubtractProgram.uniforms.uPressure,
                pressureFBO.read.attach(0)
            )
            gl.uniform1i(
                gradientSubtractProgram.uniforms.uVelocity,
                velocity.read.attach(1)
            )
            blit(velocity.write)
            velocity.swap()

            advectionProgram.bind()
            gl.uniform2f(
                advectionProgram.uniforms.texelSize,
                velocity.texelSizeX,
                velocity.texelSizeY
            )
            if (!ext.supportLinearFiltering) {
                gl.uniform2f(
                    advectionProgram.uniforms.dyeTexelSize,
                    velocity.texelSizeX,
                    velocity.texelSizeY
                )
            }
            const velocityId = velocity.read.attach(0)
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId)
            gl.uniform1i(advectionProgram.uniforms.uSource, velocityId)
            gl.uniform1f(advectionProgram.uniforms.dt, dt)
            gl.uniform1f(
                advectionProgram.uniforms.dissipation,
                config.VELOCITY_DISSIPATION
            )
            blit(velocity.write)
            velocity.swap()

            if (!ext.supportLinearFiltering) {
                gl.uniform2f(
                    advectionProgram.uniforms.dyeTexelSize,
                    dye.texelSizeX,
                    dye.texelSizeY
                )
            }
            gl.uniform1i(
                advectionProgram.uniforms.uVelocity,
                velocity.read.attach(0)
            )
            gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1))
            gl.uniform1f(
                advectionProgram.uniforms.dissipation,
                config.DENSITY_DISSIPATION
            )
            blit(dye.write)
            dye.swap()
        }

        function render(target) {
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.enable(gl.BLEND)
            drawDisplay(target)
        }

        function drawDisplay(target) {
            const width = target == null ? gl.drawingBufferWidth : target.width
            const height =
                target == null ? gl.drawingBufferHeight : target.height

            displayMaterial.bind()
            if (config.SHADING) {
                gl.uniform2f(
                    displayMaterial.uniforms.texelSize,
                    1.0 / width,
                    1.0 / height
                )
            }
            gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0))
            blit(target)
        }

        function splat(x, y, dx, dy, color) {
            splatProgram.bind()
            gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0))
            gl.uniform1f(
                splatProgram.uniforms.aspectRatio,
                canvas.width / canvas.height
            )
            gl.uniform2f(splatProgram.uniforms.point, x, y)
            gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0)
            gl.uniform1f(
                splatProgram.uniforms.radius,
                correctRadius(config.SPLAT_RADIUS / 100.0)
            )
            blit(velocity.write)
            velocity.swap()

            gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0))
            gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b)
            blit(dye.write)
            dye.swap()
        }

        function correctRadius(radius) {
            const aspectRatio = canvas.width / canvas.height
            if (aspectRatio > 1) radius *= aspectRatio
            return radius
        }

        // ========== Input helpers ==========
        function updatePointerMoveData(pointer, posX, posY) {
            pointer.prevTexcoordX = pointer.texcoordX
            pointer.prevTexcoordY = pointer.texcoordY
            pointer.texcoordX = posX / canvas.width
            pointer.texcoordY = 1.0 - posY / canvas.height
            pointer.deltaX = correctDeltaX(
                pointer.texcoordX - pointer.prevTexcoordX
            )
            pointer.deltaY = correctDeltaY(
                pointer.texcoordY - pointer.prevTexcoordY
            )
            pointer.moved =
                Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0
        }

        function correctDeltaX(delta) {
            const aspectRatio = canvas.width / canvas.height
            if (aspectRatio < 1) delta *= aspectRatio
            return delta
        }

        function correctDeltaY(delta) {
            const aspectRatio = canvas.width / canvas.height
            if (aspectRatio > 1) delta /= aspectRatio
            return delta
        }

        function generateColor() {
            const c = HSVtoRGB(Math.random(), 1.0, 1.0)
            c.r *= 0.15
            c.g *= 0.15
            c.b *= 0.15
            return c
        }

        function HSVtoRGB(h, s, v) {
            let r, g, b, i, f, p, q, t
            i = Math.floor(h * 6)
            f = h * 6 - i
            p = v * (1 - s)
            q = v * (1 - f * s)
            t = v * (1 - (1 - f) * s)
            switch (i % 6) {
                case 0:
                    r = v
                    g = t
                    b = p
                    break
                case 1:
                    r = q
                    g = v
                    b = p
                    break
                case 2:
                    r = p
                    g = v
                    b = t
                    break
                case 3:
                    r = p
                    g = q
                    b = v
                    break
                case 4:
                    r = t
                    g = p
                    b = v
                    break
                case 5:
                    r = v
                    g = p
                    b = q
                    break
            }
            return { r, g, b }
        }

        function hashCode(s) {
            if (s.length === 0) return 0
            let hash = 0
            for (let i = 0; i < s.length; i++) {
                hash = (hash << 5) - hash + s.charCodeAt(i)
                hash |= 0
            }
            return hash
        }

        function scaleByPixelRatio(input) {
            const pixelRatio = window.devicePixelRatio || 1
            return Math.floor(input * pixelRatio)
        }

        // ========== Main loop (with visibility pause) ==========
        function updateKeywords() {
            const displayKeywords = []
            if (config.SHADING) displayKeywords.push("SHADING")
            displayMaterial.setKeywords(displayKeywords)
        }

        function update() {
            if (!isVisible) return // ← Pause when off-screen

            const dt = calcDeltaTime()
            if (resizeCanvas()) initFramebuffers()
            updateColors(dt)
            applyInputs()
            if (!config.PAUSED) step(dt)
            render(null)
            animationId = requestAnimationFrame(update)
        }

        function startAnimation() {
            if (animationId) return
            lastUpdateTime = Date.now()
            animationId = requestAnimationFrame(update)
        }

        function stopAnimation() {
            if (animationId) {
                cancelAnimationFrame(animationId)
                animationId = null
            }
        }

        function calcDeltaTime() {
            const now = Date.now()
            let dt = (now - lastUpdateTime) / 1000
            dt = Math.min(dt, 0.016666)
            lastUpdateTime = now
            return dt
        }

        function resizeCanvas() {
            const width = scaleByPixelRatio(canvas.clientWidth)
            const height = scaleByPixelRatio(canvas.clientHeight)
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                return true
            }
            return false
        }

        function updateColors(dt) {
            if (!config.COLORFUL) return
            colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED
            if (colorUpdateTimer >= 1) {
                colorUpdateTimer = colorUpdateTimer % 1
                pointers.forEach((p) => {
                    p.color = generateColor()
                })
            }
        }

        function applyInputs() {
            pointers.forEach((p) => {
                if (p.moved) {
                    p.moved = false
                    splatPointer(p)
                }
            })
        }

        function splatPointer(pointer) {
            const dx = pointer.deltaX * config.SPLAT_FORCE
            const dy = pointer.deltaY * config.SPLAT_FORCE
            splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color)
        }

        // ========== Events ==========
        function handlePointerMove(e) {
            if (!isVisible) return
            const rect = canvas.getBoundingClientRect()
            const posX = scaleByPixelRatio(e.clientX - rect.left)
            const posY = scaleByPixelRatio(e.clientY - rect.top)

            const pointer = pointers[0]
            if (!pointer.down) {
                pointer.down = true
                pointer.color = generateColor()
            }
            updatePointerMoveData(pointer, posX, posY)
        }

        // ========== IntersectionObserver (the fix) ==========
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible = entry.isIntersecting
                    if (isVisible) {
                        startAnimation()
                    } else {
                        stopAnimation()
                    }
                })
            },
            {
                threshold: 0.01, // Resume as soon as a tiny part is visible
            }
        )

        observer.observe(container)

        // Start
        initFramebuffers()
        updateKeywords()
        startAnimation()

        container.addEventListener("pointermove", handlePointerMove)

        return () => {
            stopAnimation()
            observer.disconnect()
            container.removeEventListener("pointermove", handlePointerMove)
        }
    }, [
        isStatic,
        backgroundColor,
        simResolution,
        dyeResolution,
        densityDissipation,
        velocityDissipation,
        pressure,
        curl,
        splatRadius,
        splatForce,
        colorUpdateSpeed,
        shading,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 150,
                overflow: "hidden",
                background: backgroundColor,
                ...style,
            }}
        >
            {isStatic ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(ellipse at 40% 45%, #f5d76e 0%, #e879a8 25%, #9b59b6 55%, transparent 75%)",
                        filter: "blur(28px)",
                        opacity: 0.9,
                    }}
                />
            ) : (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                    }}
                />
            )}
        </div>
    )
}

FlowingCursor.defaultProps = {
    backgroundColor: "#0A0A0F",
    simResolution: 128,
    dyeResolution: 512,
    densityDissipation: 1.2,
    velocityDissipation: 0.3,
    pressure: 0.8,
    curl: 25,
    splatRadius: 0.25,
    splatForce: 6000,
    colorUpdateSpeed: 8,
    shading: true,
}

addPropertyControls(FlowingCursor, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0F",
    },
    simResolution: {
        type: ControlType.Number,
        title: "Sim Resolution",
        min: 64,
        max: 256,
        step: 32,
        defaultValue: 128,
    },
    dyeResolution: {
        type: ControlType.Number,
        title: "Dye Resolution",
        min: 256,
        max: 1024,
        step: 128,
        defaultValue: 512,
    },
    densityDissipation: {
        type: ControlType.Number,
        title: "Density Fade",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1.2,
    },
    velocityDissipation: {
        type: ControlType.Number,
        title: "Velocity Fade",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
    },
    pressure: {
        type: ControlType.Number,
        title: "Pressure",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.8,
    },
    curl: {
        type: ControlType.Number,
        title: "Curl / Swirl",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 25,
    },
    splatRadius: {
        type: ControlType.Number,
        title: "Splat Size",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
    },
    splatForce: {
        type: ControlType.Number,
        title: "Force",
        min: 1000,
        max: 15000,
        step: 500,
        defaultValue: 6000,
    },
    colorUpdateSpeed: {
        type: ControlType.Number,
        title: "Color Speed",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 8,
    },
    shading: {
        type: ControlType.Boolean,
        title: "Shading",
        defaultValue: true,
    },
})
