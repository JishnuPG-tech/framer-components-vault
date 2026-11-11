// Draggable Sticker
// Production-ready Framer Marketplace Component

import React, { useEffect, useRef, useCallback, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80"

const RENDER_SCALE = 2
const PAD_BASE = 20
const MESH_GRID_SIZE = 32
const DRAG_Z_INDEX_BASE = 1000
const MAX_Z_INDEX_LIMIT = 100000

let zIndexCounter = DRAG_Z_INDEX_BASE

function getNextZIndex(): number {
    zIndexCounter += 1
    if (zIndexCounter > MAX_Z_INDEX_LIMIT) {
        zIndexCounter = DRAG_Z_INDEX_BASE
    }
    return zIndexCounter
}

const DRAG_TILT_SENSITIVITY = 3
const SHEEN_TILT_SHIFT = 0.05
const SHEEN_TILT_DEADZONE = 0.035
const HOLO_MOTION_BUMP = 0.15
const ELEVATION_INTERNAL_MAX = 0.3

// Default preset values
const MATERIAL_PRESETS = {
    custom: {},
    paper: {
        lighting: true,
        sheenMode: "sheen",
        lightingStrength: 3,
        lightingColor: "#f4eedd",
        elevation: 4,
        curlAmount: 0.15,
        highlightWidth: 0.6,
    },
    vinyl: {
        lighting: true,
        sheenMode: "sheen",
        lightingStrength: 7,
        lightingColor: "#ffffff",
        elevation: 6,
        curlAmount: 0.12,
        highlightWidth: 0.4,
    },
    glossy: {
        lighting: true,
        sheenMode: "sheen",
        lightingStrength: 10,
        lightingColor: "#ffffff",
        elevation: 8,
        curlAmount: 0.1,
        highlightWidth: 0.2,
    },
    foil: {
        lighting: true,
        sheenMode: "sheen",
        lightingStrength: 10,
        lightingColor: "#ffd700",
        elevation: 9,
        curlAmount: 0.08,
        highlightWidth: 0.15,
    },
    holographic: {
        lighting: true,
        sheenMode: "holo",
        lightingStrength: 10,
        elevation: 8,
        curlAmount: 0.12,
        rainbowSat: 0.8,
        noiseStrength: 0.3,
    },
    matte: { lighting: false, elevation: 3, curlAmount: 0.05 },
    plastic: {
        lighting: true,
        sheenMode: "sheen",
        lightingStrength: 8,
        lightingColor: "#e0f7fa",
        elevation: 7,
        curlAmount: 0.14,
        highlightWidth: 0.3,
    },
}

const DEPTH_PRESETS = {
    custom: {},
    flat: {
        elevation: 1,
        perspective: 1800,
        maxTilt: 10,
        shadowOffsetY: 1,
        shadowBlur: 2,
        shadowOpacity: 0.1,
    },
    paper: {
        elevation: 4,
        perspective: 1200,
        maxTilt: 25,
        shadowOffsetY: 3,
        shadowBlur: 6,
        shadowOpacity: 0.2,
    },
    sticker: {
        elevation: 6,
        perspective: 800,
        maxTilt: 45,
        shadowOffsetY: 6,
        shadowBlur: 12,
        shadowOpacity: 0.3,
    },
    card: {
        elevation: 8,
        perspective: 600,
        maxTilt: 55,
        shadowOffsetY: 10,
        shadowBlur: 20,
        shadowOpacity: 0.35,
    },
    floating: {
        elevation: 10,
        perspective: 400,
        maxTilt: 70,
        shadowOffsetY: 18,
        shadowBlur: 32,
        shadowOpacity: 0.4,
    },
    extreme: {
        elevation: 10,
        perspective: 250,
        maxTilt: 90,
        shadowOffsetY: 25,
        shadowBlur: 45,
        shadowOpacity: 0.5,
    },
}

// ============================================================================
// TYPES
// ============================================================================

type ResponsiveImageSource =
    | string
    | {
          src?: string
          srcSet?: string | Array<{ src?: string }>
          url?: string
          default?: string
          asset?: { url?: string }
          alt?: string
      }
    | null
    | undefined

interface StickerDragProps {
    materialPreset?: keyof typeof MATERIAL_PRESETS
    depthPreset?: keyof typeof DEPTH_PRESETS

    image?: ResponsiveImageSource
    imageWidth?: number
    imageHeight?: number

    initialRotation?: number
    initialScale?: number
    enableRandomRotation?: boolean
    randomRotationRange?: number

    peelSpeed?: number
    tiltSmoothing?: number
    tilt?: number
    elevation?: number
    springDecay?: number
    dragScale?: number
    perspective?: number
    curlAmount?: number
    dragBounds?: "free" | "horizontal" | "vertical" | "locked"
    dragBounce?: number

    peelDirection?:
        | "pointer"
        | "nearest"
        | "center"
        | "top"
        | "bottom"
        | "left"
        | "right"

    lighting?: boolean
    sheenMode?: "sheen" | "holo"
    lightingStrength?: number
    lightingColor?: string
    highlightWidth?: number
    noiseStrength?: number
    rainbowSpeed?: number
    rainbowSat?: number

    enableHoverLift?: boolean
    hoverLiftAmount?: number
    enableHoverGlow?: boolean
    hoverGlowStrength?: "soft" | "medium" | "strong"

    cursorStyle?: "grab" | "pointer" | "default" | "none"

    shadowBlur?: number
    shadowOffsetY?: number
    shadowOpacity?: number
    dragShadowBlur?: number
    dragShadowOffsetY?: number
    dragShadowOpacity?: number

    ariaLabel?: string
    style?: React.CSSProperties
}

interface UniformLocations {
    uPeel: WebGLUniformLocation | null
    uLift: WebGLUniformLocation | null
    uPeelAngle: WebGLUniformLocation | null
    uPasting: WebGLUniformLocation | null
    uScale: WebGLUniformLocation | null
    uElevation: WebGLUniformLocation | null
    uTilt: WebGLUniformLocation | null
    uSheenStrength: WebGLUniformLocation | null
    uSheenColor: WebGLUniformLocation | null
    uSheenTiltShift: WebGLUniformLocation | null
    uSheenTiltDeadzone: WebGLUniformLocation | null
    uMaxTiltDeg: WebGLUniformLocation | null
    uHoloMode: WebGLUniformLocation | null
    uHoloMotion: WebGLUniformLocation | null
    uCurlAmount: WebGLUniformLocation | null
    uHighlightWidth: WebGLUniformLocation | null
    uRainbowSat: WebGLUniformLocation | null
    uNoiseStrength: WebGLUniformLocation | null
    uTex: WebGLUniformLocation | null
}

// ============================================================================
// SHADERS
// ============================================================================

const VERTEX_SHADER = `
attribute vec2 aPos;
attribute vec2 aUV;
uniform float uPeel;
uniform float uLift;
uniform float uPeelAngle;
uniform float uPasting;
uniform float uScale;
uniform float uElevation;
uniform float uCurlAmount;
varying vec2 vUV;
varying float vHi;
varying float vSh;

void main() {
    vUV = aUV;
    vec2 p = aPos;
    vHi = 0.0;
    vSh = 0.0;

    if (uPeel > 0.0) {
        vec2 peelAxis = vec2(cos(uPeelAngle), sin(uPeelAngle));
        vec2 uvCentered = aUV - vec2(0.5);
        float proj = dot(uvCentered, peelAxis);
        float diag = 0.5 - proj;
        float peelLine = -0.3 + uPeel * 2.0;
        float rampWidth = 0.6;
        float lifted = smoothstep(peelLine - rampWidth, peelLine, diag);
        lifted = 1.0 - lifted;

        float scale = 1.0 + lifted * uElevation;
        p *= scale;

        float inRamp = smoothstep(peelLine - rampWidth, peelLine - rampWidth * 0.5, diag) *
                       smoothstep(peelLine + 0.05, peelLine - rampWidth * 0.3, diag);

        float curve = uPasting > 0.5 ? (uCurlAmount * 0.5) : uCurlAmount;
        p += (-peelAxis) * inRamp * curve;

        float t = smoothstep(peelLine - rampWidth, peelLine, diag);
        vHi = inRamp * 0.75 * pow(1.0 - t, 1.2);
        vSh = inRamp * 0.75 * pow(t, 1.2);
    }

    gl_Position = vec4(p * uScale, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uTilt;
uniform float uSheenStrength;
uniform float uSheenTiltShift;
uniform float uSheenTiltDeadzone;
uniform float uMaxTiltDeg;
uniform float uHoloMode;
uniform float uHoloMotion;
uniform vec3 uSheenColor;
uniform float uHighlightWidth;
uniform float uRainbowSat;
uniform float uNoiseStrength;

varying vec2 vUV;
varying float vHi;
varying float vSh;

vec3 overlayBlend(vec3 base, vec3 blend) {
    return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(0.5, base));
}

float pseudoNoise(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    vec3 rgb;
    if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return rgb + m;
}

void main() {
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < 0.01) discard;

    vec3 c = tex.rgb * 0.95;

    float maxTilt = max(0.001, uMaxTiltDeg);
    float tiltMag = clamp(length(uTilt) / maxTilt, 0.0, 1.0);
    float tiltGate = smoothstep(uSheenTiltDeadzone, 1.0, tiltMag);

    float gradient = fract(vUV.x * 0.5 + vUV.y * 0.5 + uTilt.x * uSheenTiltShift + uTilt.y * uSheenTiltShift);

    if (uHoloMode > 0.5) {
        float holoStrength = uSheenStrength * uHoloMotion;
        float distFromWhite = length(tex.rgb - vec3(1.0));
        float nonWhiteMask = smoothstep(0.06, 0.22, distFromWhite);
        vec3 rainbow = hsl2rgb(gradient, uRainbowSat, 0.55);
        c = mix(c, rainbow, holoStrength * nonWhiteMask * tex.a);

        if (uNoiseStrength > 0.0) {
            float noise = pseudoNoise(vUV * 100.0 + uTilt) * uNoiseStrength * holoStrength;
            c += noise;
        }
    } else {
        float effectStrength = uSheenStrength * tiltGate;
        float hw = max(0.05, uHighlightWidth);
        float sheen = smoothstep(0.5 - hw, 0.5, gradient) * (1.0 - smoothstep(0.5, 0.5 + hw, gradient));
        c = mix(c, uSheenColor, sheen * effectStrength * tex.a);
    }

    float hiW = clamp(vHi, 0.0, 1.0) * 0.55;
    float shW = clamp(vSh, 0.0, 1.0) * 0.60;

    vec3 hi = overlayBlend(c, vec3(1.0));
    c = mix(c, hi, hiW);

    vec3 sh = overlayBlend(c, vec3(0.0));
    c = mix(c, sh, shW);
    c *= (1.0 - shW * 0.35);

    c = clamp(c, 0.0, 1.0);
    gl_FragColor = vec4(c, tex.a);
}
`

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const resolveImageSource = (input?: ResponsiveImageSource): string => {
    if (!input) return DEFAULT_IMAGE
    if (typeof input === "string") return input.trim() || DEFAULT_IMAGE
    return input.src || input.url || input.asset?.url || DEFAULT_IMAGE
}

function parseColorToRgb(input?: string): [number, number, number] {
    if (!input) return [1, 1, 1]
    const s = input.trim()
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
    if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]
    let h = s.replace(/^#/, "")
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("")
    if (h.length >= 6) {
        return [
            parseInt(h.slice(0, 2), 16) / 255,
            parseInt(h.slice(2, 4), 16) / 255,
            parseInt(h.slice(4, 6), 16) / 255,
        ]
    }
    return [1, 1, 1]
}

function constructShadowFilter(
    offsetY: number,
    blur: number,
    opacity: number
): string {
    return `drop-shadow(0px ${offsetY.toFixed(1)}px ${blur.toFixed(1)}px rgba(0, 0, 0, ${opacity.toFixed(2)}))`
}

function getPeelAngle(
    direction: StickerDragProps["peelDirection"],
    clientX: number,
    clientY: number,
    rect: DOMRect
): number {
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    switch (direction) {
        case "top":
            return -Math.PI / 2
        case "bottom":
            return Math.PI / 2
        case "left":
            return Math.PI
        case "right":
            return 0
        case "center":
            return Math.atan2(centerY - clientY, centerX - clientX)
        case "nearest": {
            const relX = clientX - rect.left
            const relY = clientY - rect.top
            const dx = relX < rect.width / 2 ? -1 : 1
            const dy = relY < rect.height / 2 ? -1 : 1
            return Math.atan2(dy, dx)
        }
        case "pointer":
        default:
            return Math.atan2(clientY - centerY, clientX - centerX)
    }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 */
export default function StickerDrag(props: StickerDragProps) {
    const matPreset = MATERIAL_PRESETS[props.materialPreset || "custom"] || {}
    const depPreset = DEPTH_PRESETS[props.depthPreset || "custom"] || {}

    const mergedProps = { ...props, ...depPreset, ...matPreset }

    const {
        image,
        imageWidth = 600,
        imageHeight = 400,
        initialRotation = 0,
        initialScale = 1,
        enableRandomRotation = false,
        randomRotationRange = 15,
        peelSpeed = 2,
        tiltSmoothing = 0.05,
        tilt = 45,
        elevation: elevationLevel = 10,
        springDecay = 0.88,
        dragScale = 1.03,
        perspective = 800,
        curlAmount = 0.12,
        dragBounds = "free",
        dragBounce = 0.2,
        peelDirection = "pointer",
        lighting = true,
        sheenMode = "sheen",
        lightingStrength = 10,
        lightingColor = "#ffffff",
        highlightWidth = 0.3,
        noiseStrength = 0,
        rainbowSpeed = 1,
        rainbowSat = 0.8,
        enableHoverLift = false,
        hoverLiftAmount = 5,
        enableHoverGlow = false,
        hoverGlowStrength = "medium",
        cursorStyle = "grab",
        shadowBlur = 4,
        shadowOffsetY = 2,
        shadowOpacity = 0.25,
        dragShadowBlur = 18,
        dragShadowOffsetY = 12,
        dragShadowOpacity = 0.35,
        ariaLabel = "Interactive 3D Draggable Sticker",
        style,
    } = mergedProps

    const isStatic = useIsStaticRenderer()
    const currentImageSrc = resolveImageSource(image)

    const maxTilt = Math.max(1, tilt)
    const sheenStrength = lighting
        ? Math.max(1, Math.min(10, lightingStrength)) / 10
        : 0
    const sheenColor = React.useMemo(
        () => parseColorToRgb(lightingColor),
        [lightingColor]
    )
    const elevation =
        (Math.max(1, Math.min(10, elevationLevel)) / 10) *
        ELEVATION_INTERNAL_MAX

    const [isHovered, setIsHovered] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const randomRotRef = useRef<number>(0)
    useEffect(() => {
        if (enableRandomRotation) {
            randomRotRef.current = (Math.random() * 2 - 1) * randomRotationRange
        } else {
            randomRotRef.current = 0
        }
    }, [enableRandomRotation, randomRotationRange])

    const containerRef = useRef<HTMLDivElement>(null)
    const stickerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const uniformsRef = useRef<UniformLocations | null>(null)
    const textureRef = useRef<WebGLTexture | null>(null)
    const vboRef = useRef<WebGLBuffer | null>(null)
    const iboRef = useRef<WebGLBuffer | null>(null)
    const indexCountRef = useRef<number>(0)

    const stateRef = useRef({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        scale: 1.0,
        held: false,
        peeling: false,
        sticking: false,
        dragStartX: 0,
        dragStartY: 0,
        dragOrigX: 0,
        dragOrigY: 0,
        peel: 0,
        lift: 0,
        peelAngle: -Math.PI / 4,
        dragTiltX: 0,
        dragTiltY: 0,
        currentTiltX: 0,
        currentTiltY: 0,
        prevTiltX: 0,
        prevTiltY: 0,
        holoMotion: 0,
        lastMoveX: 0,
        lastMoveY: 0,
        lastMoveT: 0,
        texReady: false,
        bounceOffset: 0,
    })

    const animationRef = useRef<number | null>(null)
    const lastTickTRef = useRef<number | null>(null)

    if (isStatic) {
        return (
            <div
                aria-label={ariaLabel}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    filter: constructShadowFilter(
                        shadowOffsetY,
                        shadowBlur,
                        shadowOpacity
                    ),
                    transform: `rotate(${initialRotation + randomRotRef.current}deg) scale(${initialScale})`,
                    ...style,
                }}
            >
                <img
                    src={currentImageSrc}
                    alt={ariaLabel}
                    style={{
                        width: imageWidth ? `${imageWidth}px` : "100%",
                        height: imageHeight ? `${imageHeight}px` : "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                    }}
                />
            </div>
        )
    }

    const draw = useCallback(() => {
        const gl = glRef.current
        const program = programRef.current
        const uniforms = uniformsRef.current
        const texture = textureRef.current
        const state = stateRef.current

        if (!gl || !program || !uniforms || !texture || !state.texReady) return

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, vboRef.current)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iboRef.current)

        const aPos = gl.getAttribLocation(program, "aPos")
        const aUV = gl.getAttribLocation(program, "aUV")
        gl.enableVertexAttribArray(aPos)
        gl.enableVertexAttribArray(aUV)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0)
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8)

        gl.uniform1f(uniforms.uPeel, state.peel)
        gl.uniform1f(uniforms.uLift, state.lift)
        gl.uniform1f(uniforms.uPeelAngle, state.peelAngle)
        gl.uniform1f(uniforms.uPasting, state.sticking ? 1.0 : 0.0)
        gl.uniform1f(uniforms.uScale, state.scale)
        gl.uniform1f(uniforms.uElevation, elevation)

        gl.uniform2f(uniforms.uTilt, state.currentTiltX, state.currentTiltY)
        gl.uniform1f(uniforms.uSheenStrength, sheenStrength)
        gl.uniform3f(
            uniforms.uSheenColor,
            sheenColor[0],
            sheenColor[1],
            sheenColor[2]
        )
        gl.uniform1f(uniforms.uSheenTiltShift, SHEEN_TILT_SHIFT)
        gl.uniform1f(uniforms.uSheenTiltDeadzone, SHEEN_TILT_DEADZONE)
        gl.uniform1f(uniforms.uMaxTiltDeg, maxTilt)
        gl.uniform1f(uniforms.uHoloMode, sheenMode === "holo" ? 1.0 : 0.0)
        gl.uniform1f(uniforms.uHoloMotion, state.holoMotion)

        gl.uniform1f(uniforms.uCurlAmount, curlAmount)
        gl.uniform1f(uniforms.uHighlightWidth, highlightWidth)
        gl.uniform1f(uniforms.uRainbowSat, rainbowSat)
        gl.uniform1f(uniforms.uNoiseStrength, noiseStrength)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(uniforms.uTex, 0)

        gl.drawElements(
            gl.TRIANGLES,
            indexCountRef.current,
            gl.UNSIGNED_SHORT,
            0
        )
    }, [
        sheenStrength,
        sheenColor,
        sheenMode,
        elevation,
        maxTilt,
        curlAmount,
        highlightWidth,
        rainbowSat,
        noiseStrength,
    ])

    const updateShadowCSS = useCallback(() => {
        const canvas = canvasRef.current
        const state = stateRef.current
        if (!canvas) return
        const tRaw = Math.max(state.lift, state.peel)
        const t = tRaw * tRaw * (3 - 2 * tRaw)

        const currOffsetY =
            shadowOffsetY + (dragShadowOffsetY - shadowOffsetY) * t
        const currBlur = shadowBlur + (dragShadowBlur - shadowBlur) * t
        const currOpacity =
            shadowOpacity + (dragShadowOpacity - shadowOpacity) * t

        canvas.style.filter = constructShadowFilter(
            currOffsetY,
            currBlur,
            currOpacity
        )
    }, [
        shadowOffsetY,
        shadowBlur,
        shadowOpacity,
        dragShadowOffsetY,
        dragShadowBlur,
        dragShadowOpacity,
    ])

    const tick = useCallback(
        (timestamp: number) => {
            const state = stateRef.current
            const inner = innerRef.current
            if (lastTickTRef.current === null) lastTickTRef.current = timestamp

            const dt = Math.min((timestamp - lastTickTRef.current) / 1000, 0.1)
            lastTickTRef.current = timestamp

            const step = peelSpeed * 0.96 * dt
            let changed = false

            if (state.peeling) {
                if (state.peel < 1 || state.lift < 1) {
                    state.peel = Math.min(1, state.peel + step)
                    state.lift = Math.min(1, state.lift + step)
                    changed = true
                }
            }

            if (state.sticking) {
                if (state.peel > 0 || state.lift > 0) {
                    state.peel = Math.max(0, state.peel - step)
                    state.lift = Math.max(0, state.lift - step)
                    changed = true
                } else {
                    state.sticking = false
                }
            }

            if (!state.held) {
                if (
                    Math.abs(state.dragTiltX) > 0.05 ||
                    Math.abs(state.dragTiltY) > 0.05
                ) {
                    state.dragTiltX *= springDecay
                    state.dragTiltY *= springDecay
                    state.currentTiltX = state.dragTiltX
                    state.currentTiltY = state.dragTiltY
                    if (inner) {
                        inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`
                    }
                    changed = true
                } else if (state.dragTiltX !== 0 || state.dragTiltY !== 0) {
                    state.dragTiltX = 0
                    state.dragTiltY = 0
                    state.currentTiltX = 0
                    state.currentTiltY = 0
                    state.prevTiltX = 0
                    state.prevTiltY = 0
                    if (inner) inner.style.transform = ""
                    changed = true
                }
            }

            const holoDecayActive =
                sheenMode === "holo" && state.holoMotion > 0.005
            if (holoDecayActive) {
                state.holoMotion *= 0.88 * (1 / Math.max(0.1, rainbowSpeed))
                if (state.holoMotion < 0.005) state.holoMotion = 0
                changed = true
            }

            if (changed) updateShadowCSS()
            if (changed || state.held || holoDecayActive) draw()

            const tiltIsActive =
                Math.abs(state.dragTiltX) > 0.001 ||
                Math.abs(state.dragTiltY) > 0.001

            if (
                state.held ||
                state.peeling ||
                state.sticking ||
                holoDecayActive ||
                tiltIsActive
            ) {
                animationRef.current = requestAnimationFrame(tick)
            } else {
                animationRef.current = null
                lastTickTRef.current = null
            }
        },
        [draw, updateShadowCSS, sheenMode, peelSpeed, springDecay, rainbowSpeed]
    )

    const ensureTickRunning = useCallback(() => {
        if (animationRef.current !== null) return
        lastTickTRef.current = null
        animationRef.current = requestAnimationFrame(tick)
    }, [tick])

    const handleResize = useCallback(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        const sticker = stickerRef.current
        const gl = glRef.current
        const state = stateRef.current

        if (!container || !canvas || !sticker || !gl) return

        const containerWidth = container.clientWidth || 200
        const containerHeight = container.clientHeight || 200
        const width = imageWidth > 0 ? imageWidth : containerWidth
        const height = imageHeight > 0 ? imageHeight : containerHeight

        const maxDim = Math.max(width, height)
        const elevationPad = maxDim * elevation * 0.6
        const effectivePad = PAD_BASE + elevationPad
        const canvasWidth = width + effectivePad * 2
        const canvasHeight = height + effectivePad * 2

        const scaleX = width / canvasWidth
        const scaleY = height / canvasHeight
        const scale = Math.min(scaleX, scaleY)

        const x = (containerWidth - width) / 2
        const y = (containerHeight - height) / 2

        canvas.width = Math.round(canvasWidth * RENDER_SCALE)
        canvas.height = Math.round(canvasHeight * RENDER_SCALE)
        canvas.style.width = `${canvasWidth}px`
        canvas.style.height = `${canvasHeight}px`
        canvas.style.position = "absolute"
        canvas.style.left = `${-effectivePad}px`
        canvas.style.top = `${-effectivePad}px`

        sticker.style.width = `${width}px`
        sticker.style.height = `${height}px`
        sticker.style.left = `${x}px`
        sticker.style.top = `${y}px`

        state.width = width
        state.height = height
        state.x = x
        state.y = y
        state.scale = scale

        gl.viewport(0, 0, canvas.width, canvas.height)
        if (state.texReady) draw()
    }, [draw, elevation, imageWidth, imageHeight])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
        })
        if (!gl) return

        glRef.current = gl

        const compileShader = (
            source: string,
            type: number
        ): WebGLShader | null => {
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

        const vs = compileShader(VERTEX_SHADER, gl.VERTEX_SHADER)
        const fs = compileShader(FRAGMENT_SHADER, gl.FRAGMENT_SHADER)
        if (!vs || !fs) return

        const program = gl.createProgram()
        if (!program) return

        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            return
        }

        programRef.current = program

        uniformsRef.current = {
            uPeel: gl.getUniformLocation(program, "uPeel"),
            uLift: gl.getUniformLocation(program, "uLift"),
            uPeelAngle: gl.getUniformLocation(program, "uPeelAngle"),
            uPasting: gl.getUniformLocation(program, "uPasting"),
            uScale: gl.getUniformLocation(program, "uScale"),
            uElevation: gl.getUniformLocation(program, "uElevation"),
            uTilt: gl.getUniformLocation(program, "uTilt"),
            uSheenStrength: gl.getUniformLocation(program, "uSheenStrength"),
            uSheenColor: gl.getUniformLocation(program, "uSheenColor"),
            uSheenTiltShift: gl.getUniformLocation(program, "uSheenTiltShift"),
            uSheenTiltDeadzone: gl.getUniformLocation(
                program,
                "uSheenTiltDeadzone"
            ),
            uMaxTiltDeg: gl.getUniformLocation(program, "uMaxTiltDeg"),
            uHoloMode: gl.getUniformLocation(program, "uHoloMode"),
            uHoloMotion: gl.getUniformLocation(program, "uHoloMotion"),
            uCurlAmount: gl.getUniformLocation(program, "uCurlAmount"),
            uHighlightWidth: gl.getUniformLocation(program, "uHighlightWidth"),
            uRainbowSat: gl.getUniformLocation(program, "uRainbowSat"),
            uNoiseStrength: gl.getUniformLocation(program, "uNoiseStrength"),
            uTex: gl.getUniformLocation(program, "uTex"),
        }

        const N = MESH_GRID_SIZE
        const verts: number[] = []
        const inds: number[] = []

        for (let j = 0; j <= N; j++) {
            for (let i = 0; i <= N; i++) {
                verts.push((i / N) * 2 - 1, (j / N) * 2 - 1, i / N, 1 - j / N)
            }
        }

        for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
                const a = j * (N + 1) + i
                inds.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1)
            }
        }

        const vbo = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
        vboRef.current = vbo

        const ibo = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(inds),
            gl.STATIC_DRAW
        )
        iboRef.current = ibo
        indexCountRef.current = inds.length

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
            gl.deleteProgram(program)
            if (vboRef.current) gl.deleteBuffer(vboRef.current)
            if (iboRef.current) gl.deleteBuffer(iboRef.current)
            if (textureRef.current) gl.deleteTexture(textureRef.current)
        }
    }, [handleResize])

    useEffect(() => {
        const gl = glRef.current
        if (!gl || !programRef.current) return

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"

        img.onload = () => {
            const state = stateRef.current
            if (textureRef.current) gl.deleteTexture(textureRef.current)

            const texture = gl.createTexture()
            if (!texture) return

            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

            textureRef.current = texture
            state.texReady = true

            handleResize()
            updateShadowCSS()
        }

        img.onerror = () => {
            stateRef.current.texReady = false
        }

        img.src = currentImageSrc

        return () => {
            stateRef.current.texReady = false
        }
    }, [currentImageSrc, handleResize, updateShadowCSS])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        handleResize()
        const ro = new ResizeObserver(() => handleResize())
        ro.observe(container)
        return () => ro.disconnect()
    }, [handleResize])

    const releasePointer = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const state = stateRef.current
            if (!state.held) return

            const sticker = stickerRef.current
            const inner = innerRef.current
            if (sticker) sticker.releasePointerCapture(e.pointerId)

            setIsDragging(false)
            state.held = false
            state.peeling = false
            state.sticking = true

            if (dragBounce > 0 && inner) {
                inner.style.transition =
                    "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                setTimeout(() => {
                    if (inner) inner.style.transition = ""
                }, 150)
            }

            if (state.peel >= 0.95 && inner) {
                const rect = inner.getBoundingClientRect()
                const centerX = rect.left + rect.width / 2
                const centerY = rect.top + rect.height / 2
                const dx = state.lastMoveX - centerX
                const dy = state.lastMoveY - centerY
                state.peelAngle = Math.atan2(-dy, -dx)
                state.peel = 1
            }

            ensureTickRunning()
        },
        [ensureTickRunning, dragBounce]
    )

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (dragBounds === "locked") return

            const state = stateRef.current
            const container = containerRef.current
            const sticker = stickerRef.current
            const inner = innerRef.current
            if (!container || !sticker || !inner) return

            sticker.setPointerCapture(e.pointerId)
            setIsDragging(true)

            const rect = sticker.getBoundingClientRect()
            const grabOffsetX = e.clientX - rect.left
            const grabOffsetY = e.clientY - rect.top
            inner.style.transformOrigin = `${grabOffsetX}px ${grabOffsetY}px`

            state.peelAngle = getPeelAngle(
                peelDirection,
                e.clientX,
                e.clientY,
                rect
            )

            state.dragStartX = e.clientX
            state.dragStartY = e.clientY
            state.dragOrigX = state.x
            state.dragOrigY = state.y

            state.peel = 0
            state.lift = 0
            state.held = true
            state.peeling = true
            state.sticking = false

            state.lastMoveX = e.clientX
            state.lastMoveY = e.clientY
            state.lastMoveT = performance.now()

            container.style.zIndex = `${getNextZIndex()}`
            ensureTickRunning()
        },
        [ensureTickRunning, dragBounds, peelDirection]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const state = stateRef.current
            if (!state.held) return

            const sticker = stickerRef.current
            const inner = innerRef.current
            if (!sticker || !inner) return

            const deltaX = e.clientX - state.dragStartX
            const deltaY = e.clientY - state.dragStartY

            if (dragBounds === "free" || dragBounds === "horizontal") {
                state.x = state.dragOrigX + deltaX
            }
            if (dragBounds === "free" || dragBounds === "vertical") {
                state.y = state.dragOrigY + deltaY
            }

            sticker.style.left = `${state.x}px`
            sticker.style.top = `${state.y}px`

            const now = performance.now()
            const dt = Math.max(1, now - state.lastMoveT)
            const velX = ((e.clientX - state.lastMoveX) / dt) * 16
            const velY = ((e.clientY - state.lastMoveY) / dt) * 16
            state.lastMoveX = e.clientX
            state.lastMoveY = e.clientY
            state.lastMoveT = now

            const targetTiltY = Math.max(
                -maxTilt,
                Math.min(maxTilt, velX * DRAG_TILT_SENSITIVITY)
            )
            const targetTiltX = Math.max(
                -maxTilt,
                Math.min(maxTilt, -velY * DRAG_TILT_SENSITIVITY)
            )

            state.dragTiltX += (targetTiltX - state.dragTiltX) * tiltSmoothing
            state.dragTiltY += (targetTiltY - state.dragTiltY) * tiltSmoothing

            state.currentTiltX = state.dragTiltX
            state.currentTiltY = state.dragTiltY

            if (sheenMode === "holo") {
                const tiltDelta =
                    Math.abs(state.dragTiltX - state.prevTiltX) +
                    Math.abs(state.dragTiltY - state.prevTiltY)
                state.holoMotion = Math.min(
                    1,
                    state.holoMotion + tiltDelta * HOLO_MOTION_BUMP
                )
                state.prevTiltX = state.dragTiltX
                state.prevTiltY = state.dragTiltY
            }

            inner.style.transform = `rotateX(${state.dragTiltX}deg) rotateY(${state.dragTiltY}deg)`
        },
        [tiltSmoothing, sheenMode, maxTilt, dragBounds]
    )

    const currentScale = isDragging
        ? dragScale
        : isHovered && enableHoverLift
          ? initialScale * 1.02
          : initialScale
    const currentHoverTilt =
        isHovered && enableHoverLift && !isDragging ? hoverLiftAmount : 0

    const hoverGlowFilter =
        isHovered && enableHoverGlow
            ? `drop-shadow(0px 0px ${hoverGlowStrength === "soft" ? "10px" : hoverGlowStrength === "medium" ? "20px" : "30px"} ${lightingColor})`
            : ""

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
                perspective: `${perspective}px`,
                touchAction: "none",
                transform: `rotate(${initialRotation + randomRotRef.current + currentHoverTilt}deg) scale(${currentScale})`,
                transition: isDragging
                    ? "none"
                    : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                filter: hoverGlowFilter,
                ...style,
            }}
        >
            <div
                ref={stickerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={releasePointer}
                onPointerCancel={releasePointer}
                onLostPointerCapture={releasePointer}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    cursor: isDragging
                        ? cursorStyle === "grab"
                            ? "grabbing"
                            : cursorStyle
                        : cursorStyle,
                    userSelect: "none",
                    perspective: `${perspective}px`,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    overflow: "visible",
                }}
            >
                <div
                    ref={innerRef}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        overflow: "visible",
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        aria-hidden="true"
                        style={{
                            display: "block",
                            pointerEvents: "none",
                            position: "absolute",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

StickerDrag.displayName = "Draggable Sticker"

addPropertyControls(StickerDrag, {
    materialPreset: {
        type: ControlType.Enum,
        title: "Material",
        options: [
            "custom",
            "paper",
            "vinyl",
            "glossy",
            "foil",
            "holographic",
            "matte",
            "plastic",
        ],
        optionTitles: [
            "Custom",
            "Paper",
            "Vinyl",
            "Glossy",
            "Foil",
            "Holographic",
            "Matte",
            "Plastic",
        ],
        defaultValue: "custom",
        description:
            "Choose a material preset for instant realistic sheen, depth, and physics.",
    },

    depthPreset: {
        type: ControlType.Enum,
        title: "Depth Preset",
        options: [
            "custom",
            "flat",
            "paper",
            "sticker",
            "card",
            "floating",
            "extreme",
        ],
        optionTitles: [
            "Custom",
            "Flat",
            "Paper",
            "Sticker",
            "Card",
            "Floating",
            "Extreme",
        ],
        defaultValue: "custom",
        description:
            "Quick preset for 3D perspective height, shadow drop, and dynamic tilt.",
    },

    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "Upload an image asset with transparency.",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 50,
        max: 2000,
        step: 10,
        defaultValue: 600,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 50,
        max: 2000,
        step: 10,
        defaultValue: 400,
        unit: "px",
    },

    initialRotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        unit: "°",
        description: "Base orientation angle.",
    },
    initialScale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
        description: "Base intrinsic sticker scale.",
    },
    enableRandomRotation: {
        type: ControlType.Boolean,
        title: "Randomize",
        defaultValue: false,
        description:
            "Applies a random subtle rotation on load for organic placement.",
    },
    randomRotationRange: {
        type: ControlType.Number,
        title: "Random Range",
        min: 1,
        max: 45,
        step: 1,
        defaultValue: 15,
        unit: "°",
        hidden: (props) => !props.enableRandomRotation,
    },

    peelSpeed: {
        type: ControlType.Number,
        title: "Peel Speed",
        min: 1,
        max: 5,
        step: 0.1,
        defaultValue: 2,
        description:
            "Controls the animation speed of the peel and lift sequence.",
    },
    tiltSmoothing: {
        type: ControlType.Number,
        title: "Tilt Smoothness",
        min: 0.01,
        max: 0.25,
        step: 0.01,
        defaultValue: 0.05,
        description: "Damping coefficient for dynamic dynamic tilt velocity.",
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 200,
        max: 2000,
        step: 50,
        defaultValue: 800,
        unit: "px",
        description:
            "3D perspective distance (lower is dramatic, higher is subtle).",
    },
    dragScale: {
        type: ControlType.Number,
        title: "Drag Scale",
        min: 0.8,
        max: 1.2,
        step: 0.01,
        defaultValue: 1.03,
        description:
            "Scale factor applied while holding and moving the sticker.",
    },

    tilt: {
        type: ControlType.Number,
        title: "Max Tilt",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 45,
        unit: "°",
    },
    elevation: {
        type: ControlType.Number,
        title: "Elevation",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 10,
    },

    curlAmount: {
        type: ControlType.Number,
        title: "Curl Amount",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.12,
        description: "Shader deformation depth along the peeling ramp curve.",
    },
    springDecay: {
        type: ControlType.Number,
        title: "Spring Feel",
        min: 0.7,
        max: 0.98,
        step: 0.01,
        defaultValue: 0.88,
        description: "Decay rate when releasing dynamic dynamic tilt.",
    },
    dragBounce: {
        type: ControlType.Number,
        title: "Drag Bounce",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.2,
        description: "Elastic bounce coefficient upon pointer release.",
    },

    dragBounds: {
        type: ControlType.Enum,
        title: "Movement",
        options: ["free", "horizontal", "vertical", "locked"],
        optionTitles: [
            "Free Drag",
            "Horizontal Only",
            "Vertical Only",
            "Locked",
        ],
        defaultValue: "free",
        description: "Lock or restrict dragging axes.",
    },

    peelDirection: {
        type: ControlType.Enum,
        title: "Peel Direction",
        options: [
            "pointer",
            "nearest",
            "center",
            "top",
            "bottom",
            "left",
            "right",
        ],
        optionTitles: [
            "Pointer Position",
            "Nearest Corner",
            "Center Out",
            "Top",
            "Bottom",
            "Left",
            "Right",
        ],
        defaultValue: "pointer",
        description: "Determines where the peel origin initiates.",
    },

    lighting: {
        type: ControlType.Boolean,
        title: "Lighting",
        defaultValue: true,
    },
    sheenMode: {
        type: ControlType.Enum,
        title: "Sheen Mode",
        options: ["sheen", "holo"],
        optionTitles: ["Metallic Sheen", "Holographic Rainbow"],
        defaultValue: "sheen",
        hidden: (props) => !props.lighting,
    },
    lightingStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 10,
        hidden: (props) => !props.lighting,
    },
    lightingColor: {
        type: ControlType.Color,
        title: "Sheen Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.lighting || props.sheenMode === "holo",
    },

    highlightWidth: {
        type: ControlType.Number,
        title: "Sheen Width",
        min: 0.05,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (props) => !props.lighting || props.sheenMode === "holo",
        description: "Width of the reflection highlight stripe.",
    },
    rainbowSat: {
        type: ControlType.Number,
        title: "Holo Saturation",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.8,
        hidden: (props) => !props.lighting || props.sheenMode !== "holo",
    },
    rainbowSpeed: {
        type: ControlType.Number,
        title: "Holo Speed",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        hidden: (props) => !props.lighting || props.sheenMode !== "holo",
    },
    noiseStrength: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 0.5,
        step: 0.05,
        defaultValue: 0,
        hidden: (props) => !props.lighting || props.sheenMode !== "holo",
        description: "Adds micro-grain texture to holographic reflections.",
    },

    enableHoverLift: {
        type: ControlType.Boolean,
        title: "Hover Lift",
        defaultValue: false,
        description: "Sticker slightly lifts when mouse hovers over it.",
    },
    hoverLiftAmount: {
        type: ControlType.Number,
        title: "Hover Lift °",
        min: 1,
        max: 15,
        step: 1,
        defaultValue: 5,
        hidden: (props) => !props.enableHoverLift,
    },
    enableHoverGlow: {
        type: ControlType.Boolean,
        title: "Hover Glow",
        defaultValue: false,
        description: "Emits a soft ambient glow on hover.",
    },
    hoverGlowStrength: {
        type: ControlType.Enum,
        title: "Glow Power",
        options: ["soft", "medium", "strong"],
        optionTitles: ["Soft", "Medium", "Strong"],
        defaultValue: "medium",
        hidden: (props) => !props.enableHoverGlow,
    },

    cursorStyle: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["grab", "pointer", "default", "none"],
        optionTitles: ["Grab Hand", "Pointer", "Default Arrow", "None"],
        defaultValue: "grab",
    },

    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 4,
        unit: "px",
    },
    shadowOffsetY: {
        type: ControlType.Number,
        title: "Shadow Offset",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 2,
        unit: "px",
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
    },
    dragShadowBlur: {
        type: ControlType.Number,
        title: "Drag Shadow Blur",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 18,
        unit: "px",
    },
    dragShadowOffsetY: {
        type: ControlType.Number,
        title: "Drag Shadow Offset",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 12,
        unit: "px",
    },
    dragShadowOpacity: {
        type: ControlType.Number,
        title: "Drag Shadow Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },

    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Interactive draggable sticker",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
