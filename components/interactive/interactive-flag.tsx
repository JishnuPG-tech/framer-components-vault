// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    CSSProperties,
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

interface MyComponentProps {
    image?: { src?: string; srcSet?: string; alt?: string }
    mode: "Waving" | "Still"
    shape: "Rectangular" | "Square"
    windStrength: number
    speed: number
    weaveIntensity: number
    sheen: number
    style?: CSSProperties
}

function createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("Failed to create shader")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info =
            gl.getShaderInfoLog(shader) || "Unknown shader compile error"
        gl.deleteShader(shader)
        throw new Error(info)
    }
    return shader
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertex: string,
    fragment: string
): WebGLProgram {
    const vs = createShader(gl, gl.VERTEX_SHADER, vertex)
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragment)
    const program = gl.createProgram()
    if (!program) throw new Error("Failed to create program")
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) || "Unknown link error"
        gl.deleteProgram(program)
        throw new Error(info)
    }
    return program
}

function createPlane(segmentsX: number, segmentsY: number) {
    const vertices: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    for (let y = 0; y <= segmentsY; y++) {
        for (let x = 0; x <= segmentsX; x++) {
            const u = x / segmentsX
            const v = y / segmentsY
            vertices.push(u, v)
            uvs.push(u, v)
        }
    }

    for (let y = 0; y < segmentsY; y++) {
        for (let x = 0; x < segmentsX; x++) {
            const i = y * (segmentsX + 1) + x
            const a = i
            const b = i + 1
            const c = i + segmentsX + 1
            const d = c + 1
            indices.push(a, c, b, b, c, d)
        }
    }

    return {
        vertices: new Float32Array(vertices),
        uvs: new Float32Array(uvs),
        indices: new Uint32Array(indices),
    }
}

function createPlaceholderTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture()
    if (!texture) throw new Error("Failed to create texture")
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to create 2D context")
    const g = ctx.createLinearGradient(0, 0, 256, 256)
    g.addColorStop(0, "#4f8cff")
    g.addColorStop(0.5, "#8b5cf6")
    g.addColorStop(1, "#f59e0b")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    ctx.globalAlpha = 0.16
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 16, 0, 8, 256)
        ctx.fillRect(0, i * 16, 256, 8)
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return texture
}

function uploadPlaceholderToTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture
) {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const g = ctx.createLinearGradient(0, 0, 256, 256)
    g.addColorStop(0, "#4f8cff")
    g.addColorStop(0.5, "#8b5cf6")
    g.addColorStop(1, "#f59e0b")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    ctx.globalAlpha = 0.16
    ctx.fillStyle = "#ffffff"
    for (let i = 0; i < 20; i++) {
        ctx.fillRect(i * 16, 0, 8, 256)
        ctx.fillRect(0, i * 16, 256, 8)
    }
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
    gl.bindTexture(gl.TEXTURE_2D, null)
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 */
export default function WavingFlag(props: MyComponentProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        mode = "Waving",
        shape = "Rectangular",
        windStrength = 1,
        speed = 1,
        weaveIntensity = 0.25,
        sheen = 0.15,
    } = props
    const incomingStyle = props.style
    const isStaticRenderer = useIsStaticRenderer()
    const isStaticRendererRef = useRef(isStaticRenderer)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const glRef = useRef<WebGL2RenderingContext | null>(null)
    const textureRef = useRef<WebGLTexture | null>(null)
    const renderNowRef = useRef<(() => void) | null>(null)
    const imageAspectRef = useRef(1)
    const planeAspectRef = useRef(shape === "Square" ? 1 : 1.5)
    const imageScaleRef = useRef<[number, number]>([1, 1])
    const imageOffsetRef = useRef<[number, number]>([0, 0])
    const glGenerationRef = useRef(0)
    const [glGeneration, setGlGeneration] = useState(0)
    const propsRef = useRef({
        mode,
        windStrength,
        speed,
        weaveIntensity,
        sheen,
    })
    const imageLoadTokenRef = useRef(0)
    const wrapperAspectRatio = shape === "Square" ? "1 / 1" : "3 / 2"
    const hasExplicitHeight =
        incomingStyle?.height !== undefined && incomingStyle?.height !== "auto"

    const shaderSource = useMemo(
        () => ({
            vertex: `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec2 aUV;
uniform float uTime;
uniform float uCanvasAspect;
uniform float uPlaneAspect;
uniform float uAmbientAmp;
uniform float uSpeed;
uniform vec2 uGustCenter;
uniform vec2 uGustVelocity;
uniform float uGustStrength;
out vec2 vUV;
out vec3 vNormal;
out vec3 vPos;
out vec3 vTangent;

void main() {
    float u = aUV.x;
    float v = aUV.y;
    float t = uTime * uSpeed;

    float c1 = cos(10.0*u + 2.3*t + 1.5*v);
    float c2 = cos(16.0*u - 3.1*t + 0.8*v);
    float c3 = cos(22.0*u + 12.0*v + 1.7*t);

    float s1 = sin(10.0*u + 2.3*t + 1.5*v);
    float s2 = sin(16.0*u - 3.1*t + 0.8*v);
    float s3 = sin(22.0*u + 12.0*v + 1.7*t);

    float ambient = uAmbientAmp * (0.55*s1 + 0.30*s2 + 0.15*s3);
    float dhdu = uAmbientAmp * (0.55*10.0*c1 + 0.30*16.0*c2 + 0.15*22.0*c3);
    float dhdv = uAmbientAmp * (0.55*1.5*c1 + 0.30*0.8*c2 + 0.15*12.0*c3);

    vec2 d = vec2(u, v) - uGustCenter;
    float sigma = 20.0;
    float G = exp(-dot(d, d) * sigma);

    float vMag = length(uGustVelocity);
    float vBlend = smoothstep(0.01, 0.22, vMag);
    vec2 vDir = vMag > 0.0001 ? normalize(uGustVelocity) : vec2(0.86, 0.34);
    vec2 dir = normalize(mix(vec2(0.86, 0.34), vDir, vBlend));
    vec2 perp = vec2(-dir.y, dir.x);

    float p1 = dot(d, dir) * 13.0 - 2.4 * t;
    float p2 = dot(d, perp) * 10.5 - 1.7 * t + 1.4;
    float p3 = dot(d, normalize(dir + perp * 0.45)) * 15.0 + 1.1 * t + 0.8;

    float n1 = sin(7.0*u + 5.0*v + 1.3*t);
    float n2 = sin(13.0*u - 9.0*v - 0.7*t);
    float n3 = sin(19.0*u + 17.0*v + 0.31*t);
    float noiseM = 0.50 + 0.28*n1 + 0.14*n2 + 0.08*n3;
    float dNoiseDu = 0.28*cos(7.0*u + 5.0*v + 1.3*t)*7.0 + 0.14*cos(13.0*u - 9.0*v - 0.7*t)*13.0 + 0.08*cos(19.0*u + 17.0*v + 0.31*t)*19.0;
    float dNoiseDv = 0.28*cos(7.0*u + 5.0*v + 1.3*t)*5.0 + 0.14*cos(13.0*u - 9.0*v - 0.7*t)*-9.0 + 0.08*cos(19.0*u + 17.0*v + 0.31*t)*17.0;

    float w = 0.50*sin(p1) + 0.30*sin(p2) + 0.20*sin(p3);
    float dWdu = 0.50*cos(p1)*(13.0*dir.x) + 0.30*cos(p2)*(10.5*perp.x) + 0.20*cos(p3)*(15.0*normalize(dir + perp * 0.45).x);
    float dWdv = 0.50*cos(p1)*(13.0*dir.y) + 0.30*cos(p2)*(10.5*perp.y) + 0.20*cos(p3)*(15.0*normalize(dir + perp * 0.45).y);

    float r = length(d);
    float pr = r * 19.0 - 1.35 * t;
    float radialBlend = 1.0 - vBlend;
    float radial = sin(pr) * radialBlend;
    float invR = 1.0 / max(r, 0.0008);
    float dRdu = d.x * invR;
    float dRdv = d.y * invR;
    float dRadialDu = cos(pr) * 19.0 * dRdu * radialBlend;
    float dRadialDv = cos(pr) * 19.0 * dRdv * radialBlend;

    float gustPattern = w * (0.78 + 0.22 * noiseM) + 0.18 * radial;
    float dPatternDu = dWdu * (0.78 + 0.22 * noiseM) + w * 0.22 * dNoiseDu + 0.18 * dRadialDu;
    float dPatternDv = dWdv * (0.78 + 0.22 * noiseM) + w * 0.22 * dNoiseDv + 0.18 * dRadialDv;

    float gustAmp = uGustStrength * 0.085;
    float gust = gustAmp * G * gustPattern;
    float dGdu = -2.0 * sigma * d.x * G;
    float dGdv = -2.0 * sigma * d.y * G;
    dhdu += gustAmp * (dGdu * gustPattern + G * dPatternDu);
    dhdv += gustAmp * (dGdv * gustPattern + G * dPatternDv);

    float z = ambient + gust;

    float s = 2.0 * v - 1.0;
    float absS = abs(s);
    float uPow = pow(u, 1.2);
    float edgeTerm = pow(absS, 1.7);
    float edgeMix = 0.2 + 0.8 * edgeTerm;
    float envelope = uPow * edgeMix;
    float dUPowDu = 1.2 * pow(max(u, 0.0001), 0.2);
    float signS = s < 0.0 ? -1.0 : 1.0;
    float dEdgeTermDv = 1.7 * pow(max(absS, 0.0001), 0.7) * signS * 2.0;
    float dEnvelopeDu = dUPowDu * edgeMix;
    float dEnvelopeDv = uPow * 0.8 * dEdgeTermDv;

    float latWaveX = 0.65 * s1 + 0.25 * s2 + 0.10 * s3 + 0.35 * gustPattern;
    float latWaveY = 0.45 * c1 - 0.35 * c2 + 0.20 * s3 + 0.28 * gustPattern;
    float dLatWaveXDu = 0.65 * 10.0 * c1 + 0.25 * 16.0 * c2 + 0.10 * 22.0 * c3 + 0.35 * dPatternDu;
    float dLatWaveXDv = 0.65 * 1.5 * c1 + 0.25 * 0.8 * c2 + 0.10 * 12.0 * c3 + 0.35 * dPatternDv;
    float dLatWaveYDu = 0.45 * (-10.0 * s1) - 0.35 * (-16.0 * s2) + 0.20 * 22.0 * c3 + 0.28 * dPatternDu;
    float dLatWaveYDv = 0.45 * (-1.5 * s1) - 0.35 * (-0.8 * s2) + 0.20 * 12.0 * c3 + 0.28 * dPatternDv;

    float motionGain = clamp(0.30 + uAmbientAmp * 4.2 + uGustStrength * 0.22, 0.2, 1.2);
    float latScaleX = 0.06 * uPlaneAspect;
    float latScaleY = 0.05;
    float xOff = latScaleX * envelope * motionGain * latWaveX;
    float yOff = latScaleY * envelope * motionGain * latWaveY;
    float dxdu = latScaleX * motionGain * (dEnvelopeDu * latWaveX + envelope * dLatWaveXDu);
    float dxdv = latScaleX * motionGain * (dEnvelopeDv * latWaveX + envelope * dLatWaveXDv);
    float dydu = latScaleY * motionGain * (dEnvelopeDu * latWaveY + envelope * dLatWaveYDu);
    float dydv = latScaleY * motionGain * (dEnvelopeDv * latWaveY + envelope * dLatWaveYDv);

    vec3 p = vec3((u - 0.5) * uPlaneAspect + xOff, (v - 0.5) + yOff, z);
    vec3 dpdu = vec3(uPlaneAspect + dxdu, dydu, dhdu);
    vec3 dpdv = vec3(dxdv, 1.0 + dydv, dhdv);
    vec3 n = normalize(cross(dpdu, dpdv));
    vec3 tng = normalize(dpdu);

    float margin = 0.88;
    float k = (uCanvasAspect > uPlaneAspect ? 2.0 : (2.0 * uCanvasAspect / uPlaneAspect)) * margin;
    vec2 clip = vec2(p.x * k / uCanvasAspect, p.y * k);

    gl_Position = vec4(clip, z * 0.26, 1.0);
    vUV = aUV;
    vNormal = n;
    vPos = p;
    vTangent = tng;
}
`,
            fragment: `#version 300 es
precision highp float;
in vec2 vUV;
in vec3 vNormal;
in vec3 vPos;
in vec3 vTangent;
uniform sampler2D uTex;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform float uWeave;
uniform float uSheen;
out vec4 outColor;

void main() {
    vec2 uv = (vUV - 0.5) * uUvScale + 0.5 + uUvOffset;
    vec4 tex = texture(uTex, uv);

    float tx = sin(vUV.x * 1200.0);
    float ty = sin(vUV.y * 900.0);
    float weave = 0.5 + 0.5 * tx * ty;
    float fiber = mix(1.0, 0.90 + 0.10 * weave, uWeave);

    vec3 N = normalize(vNormal);
    vec3 L = normalize(vec3(-0.45, 0.55, 0.72));
    vec3 V = normalize(vec3(0.0, 0.0, 1.6) - vPos);
    vec3 H = normalize(L + V);

    float ndl = max(dot(N, L), 0.0);
    float ao = 1.0 - clamp((1.0 - N.z) * 0.32, 0.0, 0.32);

    float nh = max(dot(N, H), 0.0);
    float th = max(abs(dot(normalize(vTangent), H)), 0.0);
    float anis = mix(1.0, pow(th, 0.5), uSheen);
    float spec = pow(nh, mix(24.0, 70.0, uSheen)) * anis * uSheen;

    vec3 base = tex.rgb * fiber;
    vec3 lit = base * (0.20 + 0.80 * ndl) * ao + vec3(spec);
    outColor = vec4(lit, tex.a);
}
`,
        }),
        []
    )

    useEffect(() => {
        isStaticRendererRef.current = isStaticRenderer
    }, [isStaticRenderer])

    useEffect(() => {
        propsRef.current = { mode, windStrength, speed, weaveIntensity, sheen }
        planeAspectRef.current = shape === "Square" ? 1 : 1.5
        const imgAspect = imageAspectRef.current || 1
        const planeAspect = planeAspectRef.current
        if (imgAspect > planeAspect) {
            imageScaleRef.current = [planeAspect / imgAspect, 1]
            imageOffsetRef.current = [0, 0]
        } else {
            imageScaleRef.current = [1, imgAspect / planeAspect]
            imageOffsetRef.current = [0, 0]
        }
        if (isStaticRenderer && renderNowRef.current) renderNowRef.current()
    }, [
        isStaticRenderer,
        mode,
        windStrength,
        speed,
        weaveIntensity,
        sheen,
        shape,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl2", {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
        })
        if (!gl) return

        const program = createProgram(
            gl,
            shaderSource.vertex,
            shaderSource.fragment
        )
        const plane = createPlane(96, 64)
        const vao = gl.createVertexArray()
        const vbo = gl.createBuffer()
        const uvbo = gl.createBuffer()
        const ebo = gl.createBuffer()
        if (!vao || !vbo || !uvbo || !ebo) return

        gl.bindVertexArray(vao)
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, plane.vertices, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, uvbo)
        gl.bufferData(gl.ARRAY_BUFFER, plane.uvs, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(1)
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, plane.indices, gl.STATIC_DRAW)
        gl.bindVertexArray(null)

        const texture = createPlaceholderTexture(gl)
        glRef.current = gl
        textureRef.current = texture
        glGenerationRef.current += 1
        startTransition(() => setGlGeneration(glGenerationRef.current))
        let destroyed = false
        let raf = 0
        let ro: ResizeObserver | null = null

        const targetGustStrength = { current: 0 }
        const gustStrengthState = { current: 0 }
        const gustCenter = { current: [0.5, 0.5] as [number, number] }
        const gustCenterTarget = { current: [0.5, 0.5] as [number, number] }
        const gustVelocityTarget = { current: [0, 0] as [number, number] }
        const gustVelocityState = { current: [0, 0] as [number, number] }
        const ambientState = {
            current: propsRef.current.mode === "Still" ? 0.015 : 0.06,
        }
        const pointerLast = {
            current: null as null | { u: number; v: number; t: number },
        }

        const loc = {
            uTime: gl.getUniformLocation(program, "uTime"),
            uCanvasAspect: gl.getUniformLocation(program, "uCanvasAspect"),
            uPlaneAspect: gl.getUniformLocation(program, "uPlaneAspect"),
            uAmbientAmp: gl.getUniformLocation(program, "uAmbientAmp"),
            uSpeed: gl.getUniformLocation(program, "uSpeed"),
            uGustCenter: gl.getUniformLocation(program, "uGustCenter"),
            uGustVelocity: gl.getUniformLocation(program, "uGustVelocity"),
            uGustStrength: gl.getUniformLocation(program, "uGustStrength"),
            uUvScale: gl.getUniformLocation(program, "uUvScale"),
            uUvOffset: gl.getUniformLocation(program, "uUvOffset"),
            uWeave: gl.getUniformLocation(program, "uWeave"),
            uSheen: gl.getUniformLocation(program, "uSheen"),
            uTex: gl.getUniformLocation(program, "uTex"),
        }

        const updateCoverUv = () => {
            const imgAspect = imageAspectRef.current || 1
            const planeAspect = planeAspectRef.current
            if (imgAspect > planeAspect) {
                const sx = planeAspect / imgAspect
                imageScaleRef.current = [sx, 1]
                imageOffsetRef.current = [0, 0]
            } else {
                const sy = imgAspect / planeAspect
                imageScaleRef.current = [1, sy]
                imageOffsetRef.current = [0, 0]
            }
        }
        updateCoverUv()

        const updateGustFromClientPoint = (clientX: number, clientY: number) => {
            const rect = canvas.getBoundingClientRect()
            const x = clientX - rect.left
            const y = clientY - rect.top
            const canvasAspect = rect.width / Math.max(1, rect.height)
            const planeAspect = planeAspectRef.current
            let drawW = rect.width
            let drawH = rect.height
            if (canvasAspect > planeAspect) {
                drawW = rect.height * planeAspect
                drawH = rect.height
            } else {
                drawW = rect.width
                drawH = rect.width / planeAspect
            }
            const ox = (rect.width - drawW) * 0.5
            const oy = (rect.height - drawH) * 0.5
            const u = (x - ox) / Math.max(1, drawW)
            const v = 1 - (y - oy) / Math.max(1, drawH)
            const clampedU = Math.min(1, Math.max(0, u))
            const clampedV = Math.min(1, Math.max(0, v))
            gustCenterTarget.current = [clampedU, clampedV]

            const now = performance.now()
            if (pointerLast.current) {
                const dt = Math.max(
                    0.001,
                    (now - pointerLast.current.t) * 0.001
                )
                const vx = (clampedU - pointerLast.current.u) / dt
                const vy = (clampedV - pointerLast.current.v) / dt
                const damp = 0.3
                gustVelocityTarget.current = [
                    gustVelocityTarget.current[0] * (1 - damp) + vx * damp,
                    gustVelocityTarget.current[1] * (1 - damp) + vy * damp,
                ]
            }
            pointerLast.current = { u: clampedU, v: clampedV, t: now }
        }
        const onPointerEnter = (event: PointerEvent) => {
            if (event.pointerType !== "touch") {
                targetGustStrength.current = 1
            }
        }
        const onPointerLeave = (event: PointerEvent) => {
            if (event.pointerType !== "touch") {
                targetGustStrength.current = 0
                pointerLast.current = null
            }
        }
        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType === "touch" || event.pointerType === "pen") {
                targetGustStrength.current = 1
                updateGustFromClientPoint(event.clientX, event.clientY)
            }
        }
        const onPointerMove = (event: PointerEvent) => {
            updateGustFromClientPoint(event.clientX, event.clientY)
        }
        const onPointerUpOrCancel = (event: PointerEvent) => {
            if (event.pointerType === "touch" || event.pointerType === "pen") {
                targetGustStrength.current = 0
                pointerLast.current = null
            }
        }

        canvas.addEventListener("pointerenter", onPointerEnter)
        canvas.addEventListener("pointerleave", onPointerLeave)
        canvas.addEventListener("pointerdown", onPointerDown)
        canvas.addEventListener("pointermove", onPointerMove)
        canvas.addEventListener("pointerup", onPointerUpOrCancel)
        canvas.addEventListener("pointercancel", onPointerUpOrCancel)

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
            const w = Math.max(1, Math.floor(rect.width * dpr))
            const h = Math.max(1, Math.floor(rect.height * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                resize()
                if (isStaticRendererRef.current && renderNowRef.current) {
                    renderNowRef.current()
                }
            })
            ro.observe(canvas)
        }
        resize()

        const start = performance.now()
        const render = (scheduleNext: boolean) => {
            if (destroyed) return
            resize()
            const now = performance.now()
            const t = (now - start) * 0.001

            const dtEase = 0.045
            gustStrengthState.current +=
                (targetGustStrength.current - gustStrengthState.current) *
                dtEase
            gustCenter.current[0] +=
                (gustCenterTarget.current[0] - gustCenter.current[0]) * 0.1
            gustCenter.current[1] +=
                (gustCenterTarget.current[1] - gustCenter.current[1]) * 0.1
            gustVelocityState.current[0] +=
                (gustVelocityTarget.current[0] - gustVelocityState.current[0]) *
                0.12
            gustVelocityState.current[1] +=
                (gustVelocityTarget.current[1] - gustVelocityState.current[1]) *
                0.12
            gustVelocityTarget.current[0] *= 0.94
            gustVelocityTarget.current[1] *= 0.94
            const ambientTarget =
                (propsRef.current.mode === "Still" ? 0.015 : 0.06) *
                Math.max(0, propsRef.current.windStrength)
            ambientState.current +=
                (ambientTarget - ambientState.current) * 0.08

            gl.enable(gl.DEPTH_TEST)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.useProgram(program)
            gl.bindVertexArray(vao)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)

            const canvasAspect = canvas.width / Math.max(1, canvas.height)
            gl.uniform1i(loc.uTex, 0)
            gl.uniform1f(loc.uTime, t)
            gl.uniform1f(loc.uCanvasAspect, canvasAspect)
            gl.uniform1f(loc.uPlaneAspect, planeAspectRef.current)
            gl.uniform1f(loc.uAmbientAmp, ambientState.current)
            gl.uniform1f(loc.uSpeed, Math.max(0, propsRef.current.speed))
            gl.uniform2f(
                loc.uGustCenter,
                gustCenter.current[0],
                gustCenter.current[1]
            )
            gl.uniform2f(
                loc.uGustVelocity,
                gustVelocityState.current[0],
                gustVelocityState.current[1]
            )
            gl.uniform1f(
                loc.uGustStrength,
                gustStrengthState.current *
                    Math.max(0, propsRef.current.windStrength)
            )
            gl.uniform2f(
                loc.uUvScale,
                imageScaleRef.current[0],
                imageScaleRef.current[1]
            )
            gl.uniform2f(
                loc.uUvOffset,
                imageOffsetRef.current[0],
                imageOffsetRef.current[1]
            )
            gl.uniform1f(
                loc.uWeave,
                Math.min(1, Math.max(0, propsRef.current.weaveIntensity))
            )
            gl.uniform1f(
                loc.uSheen,
                Math.min(1, Math.max(0, propsRef.current.sheen))
            )

            gl.drawElements(
                gl.TRIANGLES,
                plane.indices.length,
                gl.UNSIGNED_INT,
                0
            )
            gl.bindVertexArray(null)

            if (scheduleNext && !isStaticRendererRef.current) {
                raf = window.requestAnimationFrame(() => render(true))
            }
        }

        renderNowRef.current = () => {
            render(false)
        }
        render(true)

        return () => {
            destroyed = true
            if (raf) window.cancelAnimationFrame(raf)
            if (ro) ro.disconnect()
            canvas.removeEventListener("pointerenter", onPointerEnter)
            canvas.removeEventListener("pointerleave", onPointerLeave)
            canvas.removeEventListener("pointerdown", onPointerDown)
            canvas.removeEventListener("pointermove", onPointerMove)
            canvas.removeEventListener("pointerup", onPointerUpOrCancel)
            canvas.removeEventListener("pointercancel", onPointerUpOrCancel)
            gl.deleteTexture(texture)
            gl.deleteBuffer(vbo)
            gl.deleteBuffer(uvbo)
            gl.deleteBuffer(ebo)
            gl.deleteVertexArray(vao)
            gl.deleteProgram(program)
            glRef.current = null
            textureRef.current = null
            renderNowRef.current = null
            imageLoadTokenRef.current += 1
        }
    }, [shaderSource.fragment, shaderSource.vertex])

    useEffect(() => {
        if (typeof window === "undefined") return
        const gl = glRef.current
        const texture = textureRef.current
        if (!gl || !texture) return

        const token = imageLoadTokenRef.current + 1
        imageLoadTokenRef.current = token
        const source = image?.src

        const applyCover = () => {
            const imgAspect = imageAspectRef.current || 1
            const planeAspect = planeAspectRef.current
            if (imgAspect > planeAspect) {
                imageScaleRef.current = [planeAspect / imgAspect, 1]
                imageOffsetRef.current = [0, 0]
            } else {
                imageScaleRef.current = [1, imgAspect / planeAspect]
                imageOffsetRef.current = [0, 0]
            }
        }

        if (!source) {
            imageAspectRef.current = 1
            applyCover()
            uploadPlaceholderToTexture(gl, texture)
            if (renderNowRef.current) renderNowRef.current()
            return
        }

        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (imageLoadTokenRef.current !== token) return
            const liveGl = glRef.current
            const liveTexture = textureRef.current
            if (!liveGl || !liveTexture) return
            imageAspectRef.current =
                img.naturalWidth > 0 && img.naturalHeight > 0
                    ? img.naturalWidth / img.naturalHeight
                    : 1
            applyCover()
            try {
                liveGl.bindTexture(liveGl.TEXTURE_2D, liveTexture)
                liveGl.pixelStorei(liveGl.UNPACK_FLIP_Y_WEBGL, 1)
                liveGl.texParameteri(
                    liveGl.TEXTURE_2D,
                    liveGl.TEXTURE_WRAP_S,
                    liveGl.CLAMP_TO_EDGE
                )
                liveGl.texParameteri(
                    liveGl.TEXTURE_2D,
                    liveGl.TEXTURE_WRAP_T,
                    liveGl.CLAMP_TO_EDGE
                )
                liveGl.texParameteri(
                    liveGl.TEXTURE_2D,
                    liveGl.TEXTURE_MIN_FILTER,
                    liveGl.LINEAR
                )
                liveGl.texParameteri(
                    liveGl.TEXTURE_2D,
                    liveGl.TEXTURE_MAG_FILTER,
                    liveGl.LINEAR
                )
                liveGl.texImage2D(
                    liveGl.TEXTURE_2D,
                    0,
                    liveGl.RGBA,
                    liveGl.RGBA,
                    liveGl.UNSIGNED_BYTE,
                    img
                )
            } catch (error) {
                uploadPlaceholderToTexture(liveGl, liveTexture)
            } finally {
                liveGl.bindTexture(liveGl.TEXTURE_2D, null)
            }
            if (renderNowRef.current) renderNowRef.current()
        }
        img.onerror = () => {
            if (imageLoadTokenRef.current !== token) return
            const liveGl = glRef.current
            const liveTexture = textureRef.current
            if (!liveGl || !liveTexture) return
            imageAspectRef.current = 1
            applyCover()
            uploadPlaceholderToTexture(liveGl, liveTexture)
            if (renderNowRef.current) renderNowRef.current()
        }
        img.src = source
    }, [image?.src, glGeneration])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: hasExplicitHeight ? "100%" : "auto",
                minWidth: "48px",
                minHeight: "48px",
                aspectRatio: wrapperAspectRatio,
                overflow: "hidden",
                background: "transparent",
                ...incomingStyle,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "pan-y",
                }}
            />
        </div>
    )
}

addPropertyControls(WavingFlag, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Waving", "Still"],
        optionTitles: ["Waving", "Still"],
        defaultValue: "Waving",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["Rectangular", "Square"],
        optionTitles: ["Rectangular", "Square"],
        defaultValue: "Rectangular",
    },
    windStrength: {
        type: ControlType.Number,
        title: "Wind Strength",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.01,
    },
    weaveIntensity: {
        type: ControlType.Number,
        title: "Weave",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
    },
    sheen: {
        type: ControlType.Number,
        title: "Sheen",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
