import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Robust Color Parser: Safely converts Hex, RGB, HSL, and Framer Theme Tokens to WebGL RGB arrays (0.0 - 1.0)
function parseColorString(colorStr) {
    if (!colorStr) return [1, 1, 1]

    if (colorStr.startsWith("var(")) {
        try {
            const temp = document.createElement("div")
            temp.style.color = colorStr
            temp.style.display = "none"
            document.body.appendChild(temp)
            const comp = window.getComputedStyle(temp).color
            document.body.removeChild(temp)
            colorStr = comp
        } catch (e) {
            return [1, 1, 1]
        }
    }

    colorStr = colorStr.trim().toLowerCase()

    if (colorStr.startsWith("#")) {
        let hex = colorStr.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        }
        return [
            (parseInt(hex.slice(0, 2), 16) || 0) / 255,
            (parseInt(hex.slice(2, 4), 16) || 0) / 255,
            (parseInt(hex.slice(4, 6), 16) || 0) / 255,
        ]
    } else if (colorStr.startsWith("rgb")) {
        const match = colorStr.match(/[\d.]+/g)
        if (match && match.length >= 3) {
            return [
                parseFloat(match[0]) / 255,
                parseFloat(match[1]) / 255,
                parseFloat(match[2]) / 255,
            ]
        }
    } else if (colorStr.startsWith("hsl")) {
        const match = colorStr.match(/[\d.]+/g)
        if (match && match.length >= 3) {
            const h = parseFloat(match[0]) / 360
            const s = parseFloat(match[1]) / 100
            const l = parseFloat(match[2]) / 100

            if (s === 0) return [l, l, l]

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1
                if (t > 1) t -= 1
                if (t < 1 / 6) return p + (q - p) * 6 * t
                if (t < 1 / 2) return q
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                return p
            }
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            return [
                hue2rgb(p, q, h + 1 / 3),
                hue2rgb(p, q, h),
                hue2rgb(p, q, h - 1 / 3),
            ]
        }
    }
    return [1, 1, 1]
}

// Rainbow Color Generator
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
    return [r, g, b]
}

// Smoothly interpolates between colors in a custom palette
function getInterpolatedColor(palette, t) {
    if (!palette || palette.length === 0) return [1, 1, 1]
    if (palette.length === 1) return palette[0]

    const scaled = t * palette.length
    const index = Math.floor(scaled) % palette.length
    const nextIndex = (index + 1) % palette.length
    const fraction = scaled - Math.floor(scaled)

    const c1 = palette[index]
    const c2 = palette[nextIndex]

    return [
        c1[0] + (c2[0] - c1[0]) * fraction,
        c1[1] + (c2[1] - c1[1]) * fraction,
        c1[2] + (c2[2] - c1[2]) * fraction,
    ]
}

// Enum mapper for shapes
const SHAPE_TYPES = {
    mixed: 0,
    box: 1,
    circle: 2,
    triangle: 3,
    diamond: 4,
    hexagon: 5,
    cross: 6,
    "x-shape": 7,
    ring: 8,
    "rounded-box": 9,
    custom: 10,
}

export default function FluidSimulation(incomingProps) {
    // STEP 1: Intercept & Flatten Props
    const props = {
        ...incomingProps,
        ...(incomingProps.simulation || {}),
        ...(incomingProps.behavior || {}),
        ...(incomingProps.colors || {}),
        ...(incomingProps.appearance || {}),
    }

    const mountRef = useRef(null)
    const propsRef = useRef(props)
    const isIntersecting = useRef(true)
    const manualFrameRef = useRef(null)

    const defaultColors = ["#FF00FF", "#00FFFF", "#FFFF00"]
    const parsedColorsRef = useRef([])

    // THE "SMART CAMERA" STATIC RENDERER PATTERN
    // 1. Import useIsStaticRenderer from Framer.
    // 2. Exact definition check to gate infinite loops while passing Framer tests.
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)
    const shouldAnimateRef = useRef(shouldAnimate)

    // Keep props updated for the animation loop
    useEffect(() => {
        propsRef.current = props
        shouldAnimateRef.current = shouldAnimate
        parsedColorsRef.current = (props.customColors || defaultColors).map(
            parseColorString
        )
        // Manual Frame Pushing on prop dependencies update:
        if (!shouldAnimate && manualFrameRef.current) {
            manualFrameRef.current()
        }
    }, [props, shouldAnimate])

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let animationFrameId = null

        // Viewport Optimization: Pause when offscreen
        const intersectionObserver = new IntersectionObserver((entries) => {
            const wasIntersecting = isIntersecting.current
            isIntersecting.current = entries[0].isIntersecting

            if (
                isIntersecting.current &&
                !wasIntersecting &&
                shouldAnimateRef.current &&
                manualFrameRef.current
            ) {
                manualFrameRef.current()
            }
        })
        intersectionObserver.observe(container)

        // Setup Canvas
        const canvas = document.createElement("canvas")
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"
        container.appendChild(canvas)

        let pointers = []
        let splatStack = []

        function pointerPrototype() {
            this.id = -1
            this.x = 0
            this.y = 0
            this.dx = 0
            this.dy = 0
            this.down = false
            this.moved = false
            this.color = Math.random()
        }

        pointers.push(new pointerPrototype())

        // --- WebGL Context Initialization ---
        const { gl, ext } = getWebGLContext(canvas)
        if (!gl) {
            console.warn("WebGL not supported")
            return
        }

        function getWebGLContext(canvas) {
            const params = {
                alpha: true,
                depth: false,
                stencil: false,
                antialias: false,
            }
            let gl = canvas.getContext("webgl2", params)
            const isWebGL2 = !!gl
            if (!isWebGL2) {
                gl =
                    canvas.getContext("webgl", params) ||
                    canvas.getContext("experimental-webgl", params)
            }
            if (!gl) return { gl: null, ext: null }

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

            gl.clearColor(0.0, 0.0, 0.0, 0.0)

            const halfFloatTexType = isWebGL2
                ? gl.HALF_FLOAT
                : halfFloat
                  ? halfFloat.HALF_FLOAT_OES
                  : null
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
            let texture = gl.createTexture()
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

            let fbo = gl.createFramebuffer()
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

        // --- Shaders & GLProgram ---
        class GLProgram {
            constructor(vertexShader, fragmentShader) {
                this.uniforms = {}
                this.program = gl.createProgram()
                gl.attachShader(this.program, vertexShader)
                gl.attachShader(this.program, fragmentShader)
                gl.linkProgram(this.program)

                if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
                    throw gl.getProgramInfoLog(this.program)

                const uniformCount = gl.getProgramParameter(
                    this.program,
                    gl.ACTIVE_UNIFORMS
                )
                for (let i = 0; i < uniformCount; i++) {
                    const uniformName = gl.getActiveUniform(
                        this.program,
                        i
                    ).name
                    this.uniforms[uniformName] = gl.getUniformLocation(
                        this.program,
                        uniformName
                    )
                }
            }
            bind() {
                gl.useProgram(this.program)
            }
        }

        function compileShader(type, source) {
            const shader = gl.createShader(type)
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(shader)
            return shader
        }

        const baseVertexShader = compileShader(
            gl.VERTEX_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
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
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float value;
            void main () {
                gl_FragColor = value * texture2D(uTexture, vUv);
            }
        `
        )

        const displayGridShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;

            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform sampler2D uCustomShape;
            
            uniform vec2 uResolution;
            uniform float uGridSize;
            uniform int uShapeType;

            float getShape(vec2 p, int type, vec2 cell) {
                if (type == 10) { // Custom SVG
                    vec2 texUv = p * 0.5 + 0.5;
                    texUv.y = 1.0 - texUv.y;
                    return texture2D(uCustomShape, texUv).a;
                }
                
                float box = max(abs(p.x), abs(p.y));
                
                if (type == 0) { // Mixed
                    float rand = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
                    float shape = smoothstep(0.8, 0.7, box); 
                    if (rand > 0.5) {
                        shape -= smoothstep(0.5, 0.4, box); 
                        if (rand > 0.75) shape += smoothstep(0.2, 0.1, box); 
                    } else if (rand < 0.2) {
                        shape = smoothstep(0.5, 0.4, box); 
                    }
                    return shape;
                } else if (type == 1) { // Box
                    return smoothstep(0.8, 0.7, box);
                } else if (type == 2) { // Circle
                    return smoothstep(0.8, 0.7, length(p));
                } else if (type == 3) { // Triangle
                    vec2 tp = p;
                    tp.y += 0.2;
                    return smoothstep(0.8, 0.7, max(abs(tp.x) * 0.866025 + tp.y * 0.5, -tp.y));
                } else if (type == 4) { // Diamond
                    return smoothstep(0.8, 0.7, abs(p.x) + abs(p.y));
                } else if (type == 5) { // Hexagon
                    return smoothstep(0.8, 0.7, max(abs(p.x), abs(p.x) * 0.5 + abs(p.y) * 0.866025));
                } else if (type == 6) { // Cross (Plus)
                    float crossShape = smoothstep(0.35, 0.25, min(abs(p.x), abs(p.y)));
                    float boxBoundary = smoothstep(0.8, 0.7, box);
                    return crossShape * boxBoundary;
                } else if (type == 7) { // X-Shape
                    vec2 rotP = vec2(p.x + p.y, p.x - p.y) * 0.707106; // Rotate 45 deg
                    float crossShape = smoothstep(0.35, 0.25, min(abs(rotP.x), abs(rotP.y)));
                    float boxBoundary = smoothstep(0.8, 0.7, max(abs(rotP.x), abs(rotP.y)));
                    return crossShape * boxBoundary;
                } else if (type == 8) { // Ring
                    float d = length(p);
                    return smoothstep(0.8, 0.7, d) - smoothstep(0.5, 0.4, d);
                } else if (type == 9) { // Rounded Box
                    float d = length(max(abs(p) - 0.4, 0.0)) - 0.3;
                    return smoothstep(0.1, 0.0, d);
                }
                
                return smoothstep(0.8, 0.7, box); 
            }

            void main () {
                vec2 px = vUv * uResolution;
                vec2 cell = floor(px / uGridSize);
                vec2 cellUv = fract(px / uGridSize) * 2.0 - 1.0; 
                
                vec2 centerUv = (cell + 0.5) * uGridSize / uResolution;
                vec4 fluid = texture2D(uTexture, centerUv);
                
                vec3 col = fluid.rgb;
                float intensity = max(max(col.r, col.g), col.b);
                
                if (intensity < 0.01) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                    return;
                }
                
                float shape = getShape(cellUv, uShapeType, cell);
                
                vec3 finalColor = min(col * 1.5, 1.0);
                float alpha = shape * clamp(intensity * 10.0, 0.0, 1.0);
                
                gl_FragColor = vec4(finalColor * alpha, alpha);
            }
        `
        )

        const splatShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
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

        const advectionManualFilteringShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            vec4 bilerp (in sampler2D sam, in vec2 p) {
                vec4 st;
                st.xy = floor(p - 0.5) + 0.5;
                st.zw = st.xy + 1.0;
                vec4 uv = st * texelSize.xyxy;
                vec4 a = texture2D(sam, uv.xy);
                vec4 b = texture2D(sam, uv.zy);
                vec4 c = texture2D(sam, uv.xw);
                vec4 d = texture2D(sam, uv.zw);
                vec2 f = p - st.xy;
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            void main () {
                vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
                gl_FragColor = dissipation * bilerp(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `
        )

        const advectionShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            uniform sampler2D uVelocity;
            uniform sampler2D uSource;
            uniform vec2 texelSize;
            uniform float dt;
            uniform float dissipation;
            void main () {
                vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
                gl_FragColor = dissipation * texture2D(uSource, coord);
                gl_FragColor.a = 1.0;
            }
        `
        )

        const divergenceShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            vec2 sampleVelocity (in vec2 uv) {
                vec2 multiplier = vec2(1.0, 1.0);
                if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
                if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
                if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
                if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
                return multiplier * texture2D(uVelocity, uv).xy;
            }
            void main () {
                float L = sampleVelocity(vL).x;
                float R = sampleVelocity(vR).x;
                float T = sampleVelocity(vT).y;
                float B = sampleVelocity(vB).y;
                float div = 0.5 * (R - L + T - B);
                gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
            }
        `
        )

        const curlShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            void main () {
                float L = texture2D(uVelocity, vL).y;
                float R = texture2D(uVelocity, vR).y;
                float T = texture2D(uVelocity, vT).x;
                float B = texture2D(uVelocity, vB).x;
                float vorticity = R - L - T + B;
                gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
            }
        `
        )

        const vorticityShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uVelocity;
            uniform sampler2D uCurl;
            uniform float curl;
            uniform float dt;
            void main () {
                float T = texture2D(uCurl, vT).x;
                float B = texture2D(uCurl, vB).x;
                float C = texture2D(uCurl, vUv).x;
                vec2 force = vec2(abs(T) - abs(B), 0.0);
                force *= 1.0 / length(force + 0.00001) * curl * C;
                vec2 vel = texture2D(uVelocity, vUv).xy;
                gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
            }
        `
        )

        const pressureShader = compileShader(
            gl.FRAGMENT_SHADER,
            `
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uDivergence;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
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
            precision highp float;
            precision mediump sampler2D;
            varying vec2 vUv;
            varying vec2 vL;
            varying vec2 vR;
            varying vec2 vT;
            varying vec2 vB;
            uniform sampler2D uPressure;
            uniform sampler2D uVelocity;
            vec2 boundary (in vec2 uv) {
                uv = min(max(uv, 0.0), 1.0);
                return uv;
            }
            void main () {
                float L = texture2D(uPressure, boundary(vL)).x;
                float R = texture2D(uPressure, boundary(vR)).x;
                float T = texture2D(uPressure, boundary(vT)).x;
                float B = texture2D(uPressure, boundary(vB)).x;
                vec2 velocity = texture2D(uVelocity, vUv).xy;
                velocity.xy -= vec2(R - L, T - B);
                gl_FragColor = vec4(velocity, 0.0, 1.0);
            }
        `
        )

        let textureWidth, textureHeight
        let density, velocity, divergence, curl, pressure

        const clearProgram = new GLProgram(baseVertexShader, clearShader)
        const displayGridProgram = new GLProgram(
            baseVertexShader,
            displayGridShader
        )
        const splatProgram = new GLProgram(baseVertexShader, splatShader)
        const advectionProgram = new GLProgram(
            baseVertexShader,
            ext.supportLinearFiltering
                ? advectionShader
                : advectionManualFilteringShader
        )
        const divergenceProgram = new GLProgram(
            baseVertexShader,
            divergenceShader
        )
        const curlProgram = new GLProgram(baseVertexShader, curlShader)
        const vorticityProgram = new GLProgram(
            baseVertexShader,
            vorticityShader
        )
        const pressureProgram = new GLProgram(baseVertexShader, pressureShader)
        const gradienSubtractProgram = new GLProgram(
            baseVertexShader,
            gradientSubtractShader
        )

        function initFramebuffers() {
            let downsample = 1
            textureWidth = gl.drawingBufferWidth >> downsample
            textureHeight = gl.drawingBufferHeight >> downsample

            const texType = ext.halfFloatTexType
            const rgba = ext.formatRGBA
            const rg = ext.formatRG
            const r = ext.formatR
            const filtering = ext.supportLinearFiltering
                ? gl.LINEAR
                : gl.NEAREST

            density = createDoubleFBO(
                2,
                textureWidth,
                textureHeight,
                rgba.internalFormat,
                rgba.format,
                texType,
                filtering
            )
            velocity = createDoubleFBO(
                0,
                textureWidth,
                textureHeight,
                rg.internalFormat,
                rg.format,
                texType,
                filtering
            )
            divergence = createFBO(
                4,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
            curl = createFBO(
                5,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
            pressure = createDoubleFBO(
                6,
                textureWidth,
                textureHeight,
                r.internalFormat,
                r.format,
                texType,
                gl.NEAREST
            )
        }

        function createFBO(texId, w, h, internalFormat, format, type, param) {
            gl.activeTexture(gl.TEXTURE0 + texId)
            let texture = gl.createTexture()
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

            let fbo = gl.createFramebuffer()
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

            return [texture, fbo, texId]
        }

        function createDoubleFBO(
            texId,
            w,
            h,
            internalFormat,
            format,
            type,
            param
        ) {
            let fbo1 = createFBO(
                texId,
                w,
                h,
                internalFormat,
                format,
                type,
                param
            )
            let fbo2 = createFBO(
                texId + 1,
                w,
                h,
                internalFormat,
                format,
                type,
                param
            )
            return {
                get read() {
                    return fbo1
                },
                get write() {
                    return fbo2
                },
                swap() {
                    let temp = fbo1
                    fbo1 = fbo2
                    fbo2 = temp
                },
            }
        }

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

            return (destination) => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, destination)
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
            }
        })()

        function splat(x, y, dx, dy, color) {
            splatProgram.bind()
            gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read[2])
            gl.uniform1f(
                splatProgram.uniforms.aspectRatio,
                canvas.width / canvas.height
            )
            gl.uniform2f(
                splatProgram.uniforms.point,
                x / canvas.width,
                1.0 - y / canvas.height
            )
            gl.uniform3f(splatProgram.uniforms.color, dx, -dy, 1.0)
            gl.uniform1f(
                splatProgram.uniforms.radius,
                propsRef.current.splatRadius / 1000.0
            )
            blit(velocity.write[1])
            velocity.swap()

            gl.uniform1i(splatProgram.uniforms.uTarget, density.read[2])

            // Adjust density intensity based on thickness
            const thicknessMult = (propsRef.current.thickness || 5) / 5.0
            gl.uniform3f(
                splatProgram.uniforms.color,
                color[0] * 2.0 * thicknessMult,
                color[1] * 2.0 * thicknessMult,
                color[2] * 2.0 * thicknessMult
            )
            // Adjust density radius spread based on thickness
            gl.uniform1f(
                splatProgram.uniforms.radius,
                (propsRef.current.splatRadius * thicknessMult) / 1000.0
            )

            blit(density.write[1])
            density.swap()
        }

        function multipleSplats(amount) {
            const isRainbow = propsRef.current.colorMode === "rainbow"
            const customColors = parsedColorsRef.current
            const viscForce =
                50.0 / Math.max(0.1, propsRef.current.viscosity || 5)

            for (let i = 0; i < amount; i++) {
                const x = canvas.width * Math.random()
                const y = canvas.height * Math.random()
                const dx = 100 * viscForce * (Math.random() - 0.5)
                const dy = 100 * viscForce * (Math.random() - 0.5)

                const splatColor = isRainbow
                    ? HSVtoRGB(Math.random(), 1.0, 1.0)
                    : getInterpolatedColor(customColors, Math.random())

                splat(x, y, dx, dy, splatColor)
            }
        }

        // --- Custom Image Handling ---
        let customShapeTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, customShapeTex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0])
        )

        let customShapeLoaded = false
        let lastLoadedCustomShape = null
        let customShapeImg = new window.Image()
        customShapeImg.crossOrigin = "anonymous"

        let lastTime = Date.now()

        // --- Core Render & Update Logic ---
        function update() {
            // Bypass Lerping/Physics strict time step in Static Mode:
            // When not animating (static mode), we force a slightly larger delta-time (`dt`)
            // so manual renders capture the fluid's motion instantly, instead of freezing on a micro-step.
            const rawDt = !shouldAnimateRef.current
                ? 0.05
                : Math.min((Date.now() - lastTime) / 1000, 0.016)
            lastTime = Date.now()

            // Viscosity dampens the advection speed natively for thicker fluid movement
            const visc = propsRef.current.viscosity || 5
            const timeScale = 5.0 / Math.max(1.0, visc)
            const dt = rawDt * Math.max(0.1, Math.min(timeScale, 3.0))

            // Load Custom Shape
            if (
                propsRef.current.shapeType === "custom" &&
                propsRef.current.customShape
            ) {
                if (lastLoadedCustomShape !== propsRef.current.customShape) {
                    lastLoadedCustomShape = propsRef.current.customShape
                    customShapeLoaded = false

                    // Async Media Safety: Push one manual frame after asset loads
                    customShapeImg.onload = () => {
                        customShapeLoaded = true
                        gl.bindTexture(gl.TEXTURE_2D, customShapeTex)
                        gl.texImage2D(
                            gl.TEXTURE_2D,
                            0,
                            gl.RGBA,
                            gl.RGBA,
                            gl.UNSIGNED_BYTE,
                            customShapeImg
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
                        if (
                            !shouldAnimateRef.current &&
                            manualFrameRef.current
                        ) {
                            manualFrameRef.current()
                        }
                    }
                    customShapeImg.src = propsRef.current.customShape
                }
            }

            gl.viewport(0, 0, textureWidth, textureHeight)
            if (splatStack.length > 0) multipleSplats(splatStack.pop())

            advectionProgram.bind()
            gl.uniform2f(
                advectionProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2])
            gl.uniform1i(advectionProgram.uniforms.uSource, velocity.read[2])
            gl.uniform1f(advectionProgram.uniforms.dt, dt)
            gl.uniform1f(
                advectionProgram.uniforms.dissipation,
                propsRef.current.velocityDissipation / 100.0
            )
            blit(velocity.write[1])
            velocity.swap()

            const disappearVal = Math.max(
                0.0,
                1.0 - propsRef.current.disappearSpeed / 100.0
            )
            gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read[2])
            gl.uniform1i(advectionProgram.uniforms.uSource, density.read[2])
            gl.uniform1f(advectionProgram.uniforms.dissipation, disappearVal)
            blit(density.write[1])
            density.swap()

            for (let i = 0; i < pointers.length; i++) {
                const pointer = pointers[i]
                if (pointer.moved) {
                    const mappedColor =
                        propsRef.current.colorMode === "rainbow"
                            ? HSVtoRGB(pointer.color, 1.0, 1.0)
                            : getInterpolatedColor(
                                  parsedColorsRef.current,
                                  pointer.color
                              )
                    splat(
                        pointer.x,
                        pointer.y,
                        pointer.dx,
                        pointer.dy,
                        mappedColor
                    )
                    pointer.moved = false
                }
            }

            curlProgram.bind()
            gl.uniform2f(
                curlProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read[2])
            blit(curl[1])

            vorticityProgram.bind()
            gl.uniform2f(
                vorticityProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read[2])
            gl.uniform1i(vorticityProgram.uniforms.uCurl, curl[2])
            gl.uniform1f(vorticityProgram.uniforms.curl, propsRef.current.curl)
            gl.uniform1f(vorticityProgram.uniforms.dt, dt)
            blit(velocity.write[1])
            velocity.swap()

            divergenceProgram.bind()
            gl.uniform2f(
                divergenceProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read[2])
            blit(divergence[1])

            clearProgram.bind()
            let pressureTexId = pressure.read[2]
            gl.activeTexture(gl.TEXTURE0 + pressureTexId)
            gl.bindTexture(gl.TEXTURE_2D, pressure.read[0])
            gl.uniform1i(clearProgram.uniforms.uTexture, pressureTexId)
            gl.uniform1f(
                clearProgram.uniforms.value,
                propsRef.current.pressureDissipation / 100.0
            )
            blit(pressure.write[1])
            pressure.swap()

            pressureProgram.bind()
            gl.uniform2f(
                pressureProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence[2])
            pressureTexId = pressure.read[2]
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressureTexId)
            gl.activeTexture(gl.TEXTURE0 + pressureTexId)

            const pIters = Math.max(1, propsRef.current.pressureIterations)
            for (let i = 0; i < pIters; i++) {
                gl.bindTexture(gl.TEXTURE_2D, pressure.read[0])
                blit(pressure.write[1])
                pressure.swap()
            }

            gradienSubtractProgram.bind()
            gl.uniform2f(
                gradienSubtractProgram.uniforms.texelSize,
                1.0 / textureWidth,
                1.0 / textureHeight
            )
            gl.uniform1i(
                gradienSubtractProgram.uniforms.uPressure,
                pressure.read[2]
            )
            gl.uniform1i(
                gradienSubtractProgram.uniforms.uVelocity,
                velocity.read[2]
            )
            blit(velocity.write[1])
            velocity.swap()

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)

            displayGridProgram.bind()
            gl.uniform2f(
                displayGridProgram.uniforms.uResolution,
                gl.drawingBufferWidth,
                gl.drawingBufferHeight
            )
            gl.uniform1f(
                displayGridProgram.uniforms.uGridSize,
                propsRef.current.gridSize
            )

            gl.uniform1i(
                displayGridProgram.uniforms.uShapeType,
                SHAPE_TYPES[propsRef.current.shapeType] || 0
            )

            gl.activeTexture(gl.TEXTURE0 + density.read[2])
            gl.bindTexture(gl.TEXTURE_2D, density.read[0])
            gl.uniform1i(displayGridProgram.uniforms.uTexture, density.read[2])

            if (propsRef.current.shapeType === "custom" && customShapeLoaded) {
                gl.activeTexture(gl.TEXTURE0 + 10)
                gl.bindTexture(gl.TEXTURE_2D, customShapeTex)
                gl.uniform1i(displayGridProgram.uniforms.uCustomShape, 10)
            }

            blit(null)

            // Gate Infinite Loop for Framer's Static Checks:
            if (shouldAnimateRef.current && isIntersecting.current) {
                animationFrameId = requestAnimationFrame(update)
            } else {
                animationFrameId = null
            }
        }

        const kickstartOrRender = () => {
            if (shouldAnimateRef.current && isIntersecting.current) {
                if (!animationFrameId) {
                    lastTime = Date.now()
                    update()
                }
            } else {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId)
                    animationFrameId = null
                }
                update()
            }
        }
        manualFrameRef.current = kickstartOrRender

        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
        initFramebuffers()
        multipleSplats(parseInt(Math.random() * 20) + 5)

        kickstartOrRender()

        // Bind manual render calls to ALL user interactions:
        const onMouseMove = (e) => {
            pointers[0].moved = propsRef.current.interactOnHover
                ? true
                : pointers[0].down

            const viscForce =
                50.0 / Math.max(0.1, propsRef.current.viscosity || 5)
            pointers[0].dx = (e.offsetX - pointers[0].x) * viscForce
            pointers[0].dy = (e.offsetY - pointers[0].y) * viscForce
            pointers[0].x = e.offsetX
            pointers[0].y = e.offsetY

            pointers[0].color += 0.005
            if (pointers[0].color > 1.0) pointers[0].color = 0.0

            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        const onTouchMove = (e) => {
            if (e.cancelable) e.preventDefault()
            const touches = e.targetTouches
            const viscForce =
                50.0 / Math.max(0.1, propsRef.current.viscosity || 5)

            for (let i = 0; i < touches.length; i++) {
                let pointer = pointers[i]
                if (!pointer) continue
                pointer.moved = propsRef.current.interactOnHover
                    ? true
                    : pointer.down
                pointer.dx = (touches[i].pageX - pointer.x) * viscForce
                pointer.dy = (touches[i].pageY - pointer.y) * viscForce
                pointer.x = touches[i].pageX
                pointer.y = touches[i].pageY

                pointer.color += 0.005
                if (pointer.color > 1.0) pointer.color = 0.0
            }
            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        const onMouseDown = () => {
            pointers[0].down = true
            pointers[0].color = Math.random()
            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        const onTouchStart = (e) => {
            if (e.cancelable) e.preventDefault()
            const touches = e.targetTouches
            for (let i = 0; i < touches.length; i++) {
                if (i >= pointers.length) pointers.push(new pointerPrototype())
                pointers[i].id = touches[i].identifier
                pointers[i].down = true
                pointers[i].x = touches[i].pageX
                pointers[i].y = touches[i].pageY
                pointers[i].color = Math.random()
            }
            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        const onMouseUp = () => {
            pointers[0].down = false
            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        const onTouchEnd = (e) => {
            const touches = e.changedTouches
            for (let i = 0; i < touches.length; i++) {
                for (let j = 0; j < pointers.length; j++) {
                    if (touches[i].identifier === pointers[j].id)
                        pointers[j].down = false
                }
            }
            if (!shouldAnimateRef.current && manualFrameRef.current) {
                manualFrameRef.current()
            }
        }

        canvas.addEventListener("mousemove", onMouseMove)
        canvas.addEventListener("touchmove", onTouchMove, { passive: false })
        canvas.addEventListener("mousedown", onMouseDown)
        canvas.addEventListener("touchstart", onTouchStart, { passive: false })
        window.addEventListener("mouseup", onMouseUp)
        window.addEventListener("touchend", onTouchEnd)

        // Bind manual render calls to ResizeObserver:
        const resizeObserver = new ResizeObserver(() => {
            if (!canvas) return
            const w = container.clientWidth
            const h = container.clientHeight
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                initFramebuffers()
                if (!shouldAnimateRef.current && manualFrameRef.current) {
                    manualFrameRef.current()
                }
            }
        })
        resizeObserver.observe(container)

        return () => {
            intersectionObserver.disconnect()
            resizeObserver.disconnect()
            if (animationFrameId) cancelAnimationFrame(animationFrameId)

            canvas.removeEventListener("mousemove", onMouseMove)
            canvas.removeEventListener("touchmove", onTouchMove)
            canvas.removeEventListener("mousedown", onMouseDown)
            canvas.removeEventListener("touchstart", onTouchStart)
            window.removeEventListener("mouseup", onMouseUp)
            window.removeEventListener("touchend", onTouchEnd)

            if (gl) {
                if (customShapeTex) gl.deleteTexture(customShapeTex)
                const loseCtx = gl.getExtension("WEBGL_lose_context")
                if (loseCtx) loseCtx.loseContext()
            }

            if (container && container.contains(canvas))
                container.removeChild(canvas)
        }
    }, [])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                position: "relative",
                ...props.style,
            }}
        />
    )
}

FluidSimulation.defaultProps = {
    appearance: {
        shapeType: "mixed",
        customShape: "",
    },
    colors: {
        colorMode: "rainbow",
        customColors: ["#FF00FF", "#00FFFF", "#FFFF00"],
    },
    simulation: {
        gridSize: 15,
        disappearSpeed: 2,
        velocityDissipation: 98,
        pressureDissipation: 80,
        pressureIterations: 25,
        curl: 30,
        splatRadius: 5,
        thickness: 5,
        viscosity: 5,
    },
    behavior: {
        editorPreview: true,
        interactOnHover: true,
    },
}

addPropertyControls(FluidSimulation, {
    appearance: {
        type: ControlType.Object,
        title: "Shapes",
        controls: {
            shapeType: {
                type: ControlType.Enum,
                title: "Shape",
                options: [
                    "mixed",
                    "box",
                    "circle",
                    "triangle",
                    "diamond",
                    "hexagon",
                    "cross",
                    "x-shape",
                    "ring",
                    "rounded-box",
                    "custom",
                ],
                optionTitles: [
                    "Retro Mixed",
                    "Box",
                    "Circle",
                    "Triangle",
                    "Diamond",
                    "Hexagon",
                    "Plus",
                    "X-Shape",
                    "Ring",
                    "Rounded Box",
                    "Custom Image/SVG",
                ],
                defaultValue: "mixed",
            },
            customShape: {
                type: ControlType.File,
                title: "Upload SVG",
                allowedFileTypes: ["svg", "png"],
                hidden: (props) => props.shapeType !== "custom",
                description: "Alpha transparency used for mask.",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            colorMode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["rainbow", "custom"],
                optionTitles: ["Rainbow Cycle", "Custom Palette"],
                defaultValue: "rainbow",
            },
            customColors: {
                type: ControlType.Array,
                title: "Palette",
                control: {
                    type: ControlType.Color,
                },
                defaultValue: ["#FF00FF", "#00FFFF", "#FFFF00"],
                hidden: (props) => props.colorMode !== "custom",
            },
        },
    },
    simulation: {
        type: ControlType.Object,
        title: "Simulation",
        controls: {
            gridSize: {
                type: ControlType.Number,
                title: "Grid Size (px)",
                defaultValue: 15,
                min: 5,
                max: 50,
                description: "Resolution of the LED blocks",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 5,
                min: 1,
                max: 50,
                description: "Visual density and spread",
            },
            viscosity: {
                type: ControlType.Number,
                title: "Viscosity",
                defaultValue: 5,
                min: 1,
                max: 50,
                description: "Resistance to flow/movement",
            },
            disappearSpeed: {
                type: ControlType.Number,
                title: "Fade Speed (%)",
                defaultValue: 2,
                min: 0.1,
                max: 20,
                step: 0.1,
                description: "How fast liquid hides",
            },
            velocityDissipation: {
                type: ControlType.Number,
                title: "Movement Fade (%)",
                defaultValue: 98,
                min: 0,
                max: 100,
                description: "How fast motion stops",
            },
            pressureDissipation: {
                type: ControlType.Number,
                title: "Pressure Fade (%)",
                defaultValue: 80,
                min: 0,
                max: 100,
                description: "Pressure falloff",
            },
            pressureIterations: {
                type: ControlType.Number,
                title: "Solver Iters (n)",
                defaultValue: 25,
                min: 1,
                max: 50,
                description: "Physics accuracy",
            },
            curl: {
                type: ControlType.Number,
                title: "Curl Intensity (%)",
                defaultValue: 30,
                min: 0,
                max: 100,
                description: "Swirl intensity",
            },
            splatRadius: {
                type: ControlType.Number,
                title: "Touch Size (%)",
                defaultValue: 5,
                min: 1,
                max: 20,
                description: "Radius of interaction",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            editorPreview: {
                type: ControlType.Boolean,
                title: "Editor Preview",
                defaultValue: true,
                description: "Run in Framer",
            },
            interactOnHover: {
                type: ControlType.Boolean,
                title: "Hover Interact",
                defaultValue: true,
                description: "Hover vs click mode",
            },
        },
    },
})
