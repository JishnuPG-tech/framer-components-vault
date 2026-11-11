// Grid Scan
// Created by Frankie from Framer-Expert.com

import * as React from "react"
import { useRef, useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    linesColor?: string
    scanColor?: string
    backgroundColor?: string
    blendMode?: string
    lineThickness?: number
    gridScale?: number
    gridType?: string
    lineStyle?: string
    lineJitter?: number
    scanOpacity?: number
    scanDirection?: string
    scanSoftness?: number
    scanGlow?: number
    scanPhaseTaper?: number
    scanDuration?: number
    scanDelay?: number
    sensitivity?: number
    noiseIntensity?: number
    bloomIntensity?: number
    chromaticAberration?: number
    scanOnClick?: boolean
    enableGyro?: boolean
    snapBackDelay?: number
}

const VERTEX_SRC = `
attribute vec3 position;
varying vec2 vUv;
void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}
`

const FRAGMENT_SRC = `
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec2 uSkew;
uniform float uTilt;
uniform float uYaw;
uniform float uLineThickness;
uniform vec3 uLinesColor;
uniform vec3 uScanColor;
uniform vec3 uBgColor;
uniform float uGridScale;
uniform int uGridType;
uniform float uLineStyle;
uniform float uLineJitter;
uniform float uScanOpacity;
uniform float uScanDirection;
uniform float uNoise;
uniform float uBloomOpacity;
uniform float uScanGlow;
uniform float uScanSoftness;
uniform float uPhaseTaper;
uniform float uScanDuration;
uniform float uScanDelay;
uniform float uChroma;

uniform float uScanStarts[8];
uniform int uScanCount;
uniform float uBlendMode;

varying vec2 vUv;

const int MAX_SCANS = 8;

#define GRID_SQUARE 0
#define GRID_HEX 1
#define GRID_TRIANGLE 2
#define GRID_DIAMOND 3
#define GRID_RADIAL 4
#define GRID_CROSS 5

float smoother01(float a, float b, float x) {
    float t = clamp((x - a) / max(1e-5, (b - a)), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Square grid pattern
float gridSquare(vec2 uv, float thickness) {
    float fx = fract(uv.x);
    float fy = fract(uv.y);
    float ax = min(fx, 1.0 - fx);
    float ay = min(fy, 1.0 - fy);
    float wx = fwidth(uv.x);
    float wy = fwidth(uv.y);
    float halfPx = thickness * 0.5;
    float tx = halfPx * wx;
    float ty = halfPx * wy;
    float lineX = 1.0 - smoothstep(tx, tx + wx, ax);
    float lineY = 1.0 - smoothstep(ty, ty + wy, ay);
    return max(lineX, lineY);
}

// Hexagonal grid pattern
float gridHex(vec2 uv, float thickness) {
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    float d = abs(max(abs(gv.x) * 1.0 + gv.y * 0.577, abs(gv.y) * 1.155) - 0.577);
    float w = fwidth(uv.x) + fwidth(uv.y);
    return 1.0 - smoothstep(thickness * w * 0.5, thickness * w * 0.5 + w, d);
}

// Triangular/Isometric grid pattern
float gridTriangle(vec2 uv, float thickness) {
    float scale = 1.732;
    vec2 p = uv;
    p.y /= scale;
    p.x -= p.y * 0.5;
    
    vec3 g = vec3(p.x, p.y, -p.x - p.y);
    vec3 gf = fract(g);
    vec3 d = min(gf, 1.0 - gf);
    
    float w = fwidth(uv.x) + fwidth(uv.y);
    float t = thickness * w * 0.5;
    
    float line1 = 1.0 - smoothstep(t, t + w, d.x);
    float line2 = 1.0 - smoothstep(t, t + w, d.y);
    float line3 = 1.0 - smoothstep(t, t + w, d.z);
    
    return max(max(line1, line2), line3);
}

// Diamond/Diagonal grid pattern
float gridDiamond(vec2 uv, float thickness) {
    vec2 ruv = vec2(uv.x + uv.y, uv.x - uv.y) * 0.707;
    float fx = fract(ruv.x);
    float fy = fract(ruv.y);
    float ax = min(fx, 1.0 - fx);
    float ay = min(fy, 1.0 - fy);
    float wx = fwidth(ruv.x);
    float wy = fwidth(ruv.y);
    float halfPx = thickness * 0.5;
    float tx = halfPx * wx;
    float ty = halfPx * wy;
    float lineX = 1.0 - smoothstep(tx, tx + wx, ax);
    float lineY = 1.0 - smoothstep(ty, ty + wy, ay);
    return max(lineX, lineY);
}

// Radial/Circular grid pattern
float gridRadial(vec2 uv, float thickness) {
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    
    float rings = fract(r * 3.0);
    float ringDist = min(rings, 1.0 - rings);
    float wr = fwidth(r * 3.0);
    float ringLine = 1.0 - smoothstep(thickness * wr * 0.5, thickness * wr * 0.5 + wr, ringDist);
    
    float spokes = 12.0;
    float spoke = fract(a * spokes / 6.283);
    float spokeDist = min(spoke, 1.0 - spoke);
    float wa = fwidth(a * spokes / 6.283);
    float spokeLine = 1.0 - smoothstep(thickness * wa * 0.3, thickness * wa * 0.3 + wa, spokeDist);
    spokeLine *= smoothstep(0.0, 0.3, r);
    
    return max(ringLine, spokeLine);
}

// Cross pattern at intersections
float gridCross(vec2 uv, float thickness) {
    vec2 cell = floor(uv);
    vec2 local = fract(uv) - 0.5;
    
    float crossSize = 0.35;
    float w = fwidth(uv.x) + fwidth(uv.y);
    float t = thickness * w * 0.5;
    
    float hBar = 1.0 - smoothstep(t, t + w, abs(local.y));
    hBar *= step(abs(local.x), crossSize);
    
    float vBar = 1.0 - smoothstep(t, t + w, abs(local.x));
    vBar *= step(abs(local.y), crossSize);
    
    return max(hBar, vBar);
}

// Combined grid function
float getGridPattern(vec2 uv, float thickness, int gridType, float lineStyle) {
    float pattern = 0.0;
    
    if (gridType == GRID_SQUARE) {
        pattern = gridSquare(uv, thickness);
    } else if (gridType == GRID_HEX) {
        pattern = gridHex(uv, thickness);
    } else if (gridType == GRID_TRIANGLE) {
        pattern = gridTriangle(uv, thickness);
    } else if (gridType == GRID_DIAMOND) {
        pattern = gridDiamond(uv, thickness);
    } else if (gridType == GRID_RADIAL) {
        pattern = gridRadial(uv, thickness);
    } else if (gridType == GRID_CROSS) {
        pattern = gridCross(uv, thickness);
    }
    
    // Apply line style (dashed/dotted) for square and diamond
    if (lineStyle > 0.5 && (gridType == GRID_SQUARE || gridType == GRID_DIAMOND)) {
        float dashRepeat = 4.0;
        float dashDuty = 0.5;
        vec2 ruv = gridType == GRID_DIAMOND ? vec2(uv.x + uv.y, uv.x - uv.y) * 0.707 : uv;
        float vy = fract(ruv.y * dashRepeat);
        float vx = fract(ruv.x * dashRepeat);
        
        if (lineStyle < 1.5) {
            // Dashed
            float dashMask = max(step(vy, dashDuty), step(vx, dashDuty));
            pattern *= dashMask;
        } else {
            // Dotted
            float dotRepeat = 6.0;
            float dotWidth = 0.18;
            float cy = abs(fract(ruv.y * dotRepeat) - 0.5);
            float cx = abs(fract(ruv.x * dotRepeat) - 0.5);
            float dotMask = max(
                1.0 - smoothstep(dotWidth, dotWidth + 0.1, cy),
                1.0 - smoothstep(dotWidth, dotWidth + 0.1, cx)
            );
            pattern *= dotMask;
        }
    }
    
    return pattern;
}

void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;

    vec3 ro = vec3(0.0);
    vec3 rd = normalize(vec3(p, 2.0));

    float cR = cos(uTilt), sR = sin(uTilt);
    rd.xy = mat2(cR, -sR, sR, cR) * rd.xy;

    float cY = cos(uYaw), sY = sin(uYaw);
    rd.xz = mat2(cY, -sY, sY, cY) * rd.xz;

    vec2 skew = clamp(uSkew, vec2(-0.7), vec2(0.7));
    rd.xy += skew * rd.z;

    vec3 color = vec3(0.0);
    float minT = 1e20;
    float gridScale = max(1e-5, uGridScale);
    float fadeStrength = 1.2;
    vec2 gridUV = vec2(0.0);

    float hitIsY = 1.0;
    for (int i = 0; i < 4; i++) {
        float isY = float(i < 2);
        float pos = mix(-0.2, 0.2, float(i)) * isY + mix(-0.5, 0.5, float(i - 2)) * (1.0 - isY);
        float num = pos - (isY * ro.y + (1.0 - isY) * ro.x);
        float den = isY * rd.y + (1.0 - isY) * rd.x;
        float t = num / den;
        vec3 h = ro + rd * t;

        float depthBoost = smoothstep(0.0, 3.0, h.z);
        h.xy += skew * 0.15 * depthBoost;

        bool use = t > 0.0 && t < minT;
        gridUV = use ? mix(h.zy, h.xz, isY) / gridScale : gridUV;
        minT = use ? t : minT;
        hitIsY = use ? isY : hitIsY;
    }

    vec3 hit = ro + rd * minT;
    float dist = length(hit - ro);

    float jitterAmt = clamp(uLineJitter, 0.0, 1.0);
    if (jitterAmt > 0.0) {
        vec2 j = vec2(
            sin(gridUV.y * 2.7 + iTime * 1.8),
            cos(gridUV.x * 2.3 - iTime * 1.6)
        ) * (0.15 * jitterAmt);
        gridUV += j;
    }

    // Get primary grid pattern using selected grid type
    float primaryMask = getGridPattern(gridUV, uLineThickness, uGridType, uLineStyle);

    // Secondary grid for alternate planes
    vec2 gridUV2 = (hitIsY > 0.5 ? hit.xz : hit.zy) / gridScale;
    if (jitterAmt > 0.0) {
        vec2 j2 = vec2(
            cos(gridUV2.y * 2.1 - iTime * 1.4),
            sin(gridUV2.x * 2.5 + iTime * 1.7)
        ) * (0.15 * jitterAmt);
        gridUV2 += j2;
    }

    float altMask = getGridPattern(gridUV2, uLineThickness, uGridType, uLineStyle);

    float edgeDistX = min(abs(hit.x - (-0.5)), abs(hit.x - 0.5));
    float edgeDistY = min(abs(hit.y - (-0.2)), abs(hit.y - 0.2));
    float edgeDist = mix(edgeDistY, edgeDistX, hitIsY);
    float edgeGate = 1.0 - smoothstep(gridScale * 0.5, gridScale * 2.0, edgeDist);
    altMask *= edgeGate;

    float lineMask = max(primaryMask, altMask);
    float fade = exp(-dist * fadeStrength);

    float dur = max(0.05, uScanDuration);
    float del = max(0.0, uScanDelay);
    float scanZMax = 3.0;
    float widthScale = max(0.1, uScanGlow);
    float sigma = max(0.001, 0.18 * widthScale * uScanSoftness);
    float sigmaA = sigma * 2.0;

    float combinedPulse = 0.0;
    float combinedAura = 0.0;

    float cycle = dur + del;
    float tCycle = mod(iTime, cycle);
    float scanPhase = clamp((tCycle - del) / dur, 0.0, 1.0);
    float phase = scanPhase;

    if (uScanDirection > 0.5 && uScanDirection < 1.5) {
        phase = 1.0 - phase;
    } else if (uScanDirection > 1.5) {
        float t2 = mod(max(0.0, iTime - del), 2.0 * dur);
        phase = (t2 < dur) ? (t2 / dur) : (1.0 - (t2 - dur) / dur);
    }

    float scanZ = phase * scanZMax;
    float dz = abs(hit.z - scanZ);
    float lineBand = exp(-0.5 * (dz * dz) / (sigma * sigma));
    float taper = clamp(uPhaseTaper, 0.0, 0.49);
    float headW = taper;
    float tailW = taper;
    float headFade = smoother01(0.0, headW, phase);
    float tailFade = 1.0 - smoother01(1.0 - tailW, 1.0, phase);
    float phaseWindow = headFade * tailFade;
    float pulseBase = lineBand * phaseWindow;
    combinedPulse += pulseBase * clamp(uScanOpacity, 0.0, 1.0);
    float auraBand = exp(-0.5 * (dz * dz) / (sigmaA * sigmaA));
    combinedAura += (auraBand * 0.25) * phaseWindow * clamp(uScanOpacity, 0.0, 1.0);

    for (int i = 0; i < MAX_SCANS; i++) {
        if (i >= uScanCount) break;
        float tActiveI = iTime - uScanStarts[i];
        float phaseI = clamp(tActiveI / dur, 0.0, 1.0);
        if (uScanDirection > 0.5 && uScanDirection < 1.5) {
            phaseI = 1.0 - phaseI;
        } else if (uScanDirection > 1.5) {
            phaseI = (phaseI < 0.5) ? (phaseI * 2.0) : (1.0 - (phaseI - 0.5) * 2.0);
        }
        float scanZI = phaseI * scanZMax;
        float dzI = abs(hit.z - scanZI);
        float lineBandI = exp(-0.5 * (dzI * dzI) / (sigma * sigma));
        float headFadeI = smoother01(0.0, headW, phaseI);
        float tailFadeI = 1.0 - smoother01(1.0 - tailW, 1.0, phaseI);
        float phaseWindowI = headFadeI * tailFadeI;
        combinedPulse += lineBandI * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
        float auraBandI = exp(-0.5 * (dzI * dzI) / (sigmaA * sigmaA));
        combinedAura += (auraBandI * 0.25) * phaseWindowI * clamp(uScanOpacity, 0.0, 1.0);
    }

    float lineVis = lineMask;
    vec3 gridCol = uLinesColor * lineVis * fade;
    vec3 scanCol = uScanColor * combinedPulse;
    vec3 scanAura = uScanColor * combinedAura;

    color = gridCol + scanCol + scanAura;

    float n = fract(sin(dot(gl_FragCoord.xy + vec2(iTime * 123.4), vec2(12.9898, 78.233))) * 43758.5453123);
    color += (n - 0.5) * uNoise;

    color += uLinesColor * lineMask * uBloomOpacity * 0.5;

    // Simple chromatic aberration
    if (uChroma > 0.001) {
        vec2 dir = (vUv - 0.5) * uChroma;
        color.r += uLinesColor.r * lineVis * fade * 0.3;
    }

    float intensity = clamp(lineVis + combinedPulse + lineMask * uBloomOpacity, 0.0, 1.0);
    
    // Blend modes: 0.0 = additive (dark bg), 1.0 = direct (light bg), 2.0 = auto
    float bgLum = dot(uBgColor, vec3(0.299, 0.587, 0.114));
    
    // Determine if we should use light mode blending (branch-free)
    float isAdditive = step(uBlendMode, 0.5); // 1.0 if additive mode
    float isDirect = step(0.5, uBlendMode) * step(uBlendMode, 1.5); // 1.0 if direct mode  
    float isAuto = step(1.5, uBlendMode); // 1.0 if auto mode
    float autoUsesLight = step(0.5, bgLum); // 1.0 if bg is light
    
    float useLightMode = isDirect + isAuto * autoUsesLight;
    
    // Calculate both blend results
    vec3 additiveResult = mix(uBgColor, uBgColor + color, intensity);
    
    vec3 lineColor = uLinesColor * (lineVis * fade + lineMask * uBloomOpacity * 0.5);
    vec3 scanMix = uScanColor * (combinedPulse + combinedAura);
    vec3 directResult = mix(uBgColor, lineColor + scanMix, intensity);
    
    // Mix between the two based on mode
    color = mix(additiveResult, directResult, useLightMode);
    
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
}
`

const parseColor = (color: string): [number, number, number] => {
    if (!color) return [0, 0, 0]

    const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbaMatch) {
        return [
            parseInt(rgbaMatch[1]) / 255,
            parseInt(rgbaMatch[2]) / 255,
            parseInt(rgbaMatch[3]) / 255,
        ]
    }

    let hex = color.replace(/^#/, "")
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length === 8) {
        hex = hex.slice(0, 6)
    }

    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
        return [
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255,
        ]
    }

    return [0, 0, 0]
}

// Convert sRGB to linear for proper color rendering
const srgbToLinear = (c: number): number => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

const parseColorLinear = (color: string): [number, number, number] => {
    const [r, g, b] = parseColor(color)
    return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)]
}

// Smooth damp for fluid mouse following
const smoothDamp = (
    current: number,
    target: number,
    velocity: { v: number },
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number
): number => {
    smoothTime = Math.max(0.0001, smoothTime)
    const omega = 2 / smoothTime
    const x = omega * deltaTime
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

    let change = current - target
    const maxChange = maxSpeed * smoothTime
    change = Math.max(-maxChange, Math.min(maxChange, change))

    const temp = (velocity.v + omega * change) * deltaTime
    velocity.v = (velocity.v - omega * temp) * exp

    let result = target + (change + temp) * exp

    if (target - current > 0 === result > target) {
        result = target
        velocity.v = 0
    }

    return result
}

export default function GridScan({
    linesColor = "#5a4a7a",
    scanColor = "#FF9FFC",
    backgroundColor = "#0a0a12",
    blendMode = "overlay",
    lineThickness = 1.5,
    gridScale = 0.04,
    gridType = "square",
    lineStyle = "solid",
    lineJitter = 0,
    scanOpacity = 0.4,
    scanDirection = "pingpong",
    scanSoftness = 2,
    scanGlow = 0.5,
    scanPhaseTaper = 0.9,
    scanDuration = 2,
    scanDelay = 2,
    sensitivity = 0.55,
    noiseIntensity = 0.01,
    bloomIntensity = 0.5,
    chromaticAberration = 0.002,
    scanOnClick = true,
    enableGyro = false,
    snapBackDelay = 250,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
    const rafRef = useRef<number>(0)
    const startTimeRef = useRef<number>(performance.now() / 1000)

    // Mouse tracking with smooth damping
    const lookTargetRef = useRef({ x: 0, y: 0 })
    const lookCurrentRef = useRef({ x: 0, y: 0 })
    const lookVelRef = useRef({ x: { v: 0 }, y: { v: 0 } })
    const tiltTargetRef = useRef(0)
    const tiltCurrentRef = useRef(0)
    const tiltVelRef = useRef({ v: 0 })
    const yawTargetRef = useRef(0)
    const yawCurrentRef = useRef(0)
    const yawVelRef = useRef({ v: 0 })

    // Click scans
    const scanStartsRef = useRef<number[]>([])
    const MAX_SCANS = 8

    const snapBackTimerRef = useRef<number | null>(null)

    const [ready, setReady] = useState(false)

    const propsRef = useRef({
        linesColor,
        scanColor,
        backgroundColor,
        blendMode,
        lineThickness,
        gridScale,
        gridType,
        lineStyle,
        lineJitter,
        scanOpacity,
        scanDirection,
        scanSoftness,
        scanGlow,
        scanPhaseTaper,
        scanDuration,
        scanDelay,
        sensitivity,
        noiseIntensity,
        bloomIntensity,
        chromaticAberration,
        scanOnClick,
        enableGyro,
        snapBackDelay,
    })

    useEffect(() => {
        propsRef.current = {
            linesColor,
            scanColor,
            backgroundColor,
            blendMode,
            lineThickness,
            gridScale,
            gridType,
            lineStyle,
            lineJitter,
            scanOpacity,
            scanDirection,
            scanSoftness,
            scanGlow,
            scanPhaseTaper,
            scanDuration,
            scanDelay,
            sensitivity,
            noiseIntensity,
            bloomIntensity,
            chromaticAberration,
            scanOnClick,
            enableGyro,
            snapBackDelay,
        }
    }, [
        linesColor,
        scanColor,
        backgroundColor,
        blendMode,
        lineThickness,
        gridScale,
        gridType,
        lineStyle,
        lineJitter,
        scanOpacity,
        scanDirection,
        scanSoftness,
        scanGlow,
        scanPhaseTaper,
        scanDuration,
        scanDelay,
        sensitivity,
        noiseIntensity,
        bloomIntensity,
        chromaticAberration,
        scanOnClick,
        enableGyro,
        snapBackDelay,
    ])

    // WebGL setup
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = canvas.getContext("webgl", {
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
        })

        if (!gl) {
            console.error("WebGL not supported")
            return
        }

        glRef.current = gl

        // Enable extensions for fwidth
        gl.getExtension("OES_standard_derivatives")

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vertexShader, VERTEX_SRC)
        gl.compileShader(vertexShader)

        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(
                "Vertex shader error:",
                gl.getShaderInfoLog(vertexShader)
            )
            return
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(
            fragmentShader,
            "#extension GL_OES_standard_derivatives : enable\n" + FRAGMENT_SRC
        )
        gl.compileShader(fragmentShader)

        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(
                "Fragment shader error:",
                gl.getShaderInfoLog(fragmentShader)
            )
            return
        }

        const program = gl.createProgram()!
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program))
            return
        }

        gl.useProgram(program)

        const positions = new Float32Array([
            -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0,
        ])
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

        const positionLoc = gl.getAttribLocation(program, "position")
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0)

        uniformsRef.current = {
            iResolution: gl.getUniformLocation(program, "iResolution"),
            iTime: gl.getUniformLocation(program, "iTime"),
            uSkew: gl.getUniformLocation(program, "uSkew"),
            uTilt: gl.getUniformLocation(program, "uTilt"),
            uYaw: gl.getUniformLocation(program, "uYaw"),
            uLineThickness: gl.getUniformLocation(program, "uLineThickness"),
            uLinesColor: gl.getUniformLocation(program, "uLinesColor"),
            uScanColor: gl.getUniformLocation(program, "uScanColor"),
            uBgColor: gl.getUniformLocation(program, "uBgColor"),
            uGridScale: gl.getUniformLocation(program, "uGridScale"),
            uGridType: gl.getUniformLocation(program, "uGridType"),
            uLineStyle: gl.getUniformLocation(program, "uLineStyle"),
            uLineJitter: gl.getUniformLocation(program, "uLineJitter"),
            uScanOpacity: gl.getUniformLocation(program, "uScanOpacity"),
            uScanDirection: gl.getUniformLocation(program, "uScanDirection"),
            uNoise: gl.getUniformLocation(program, "uNoise"),
            uBloomOpacity: gl.getUniformLocation(program, "uBloomOpacity"),
            uScanGlow: gl.getUniformLocation(program, "uScanGlow"),
            uScanSoftness: gl.getUniformLocation(program, "uScanSoftness"),
            uPhaseTaper: gl.getUniformLocation(program, "uPhaseTaper"),
            uScanDuration: gl.getUniformLocation(program, "uScanDuration"),
            uScanDelay: gl.getUniformLocation(program, "uScanDelay"),
            uChroma: gl.getUniformLocation(program, "uChroma"),
            uScanStarts: gl.getUniformLocation(program, "uScanStarts"),
            uScanCount: gl.getUniformLocation(program, "uScanCount"),
            uBlendMode: gl.getUniformLocation(program, "uBlendMode"),
        }

        setReady(true)

        return () => {
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            cancelAnimationFrame(rafRef.current)
        }
    }, [])

    // Resize
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        const gl = glRef.current
        if (!canvas || !container || !gl || !ready) return

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const w = container.clientWidth
            const h = container.clientHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = `${w}px`
            canvas.style.height = `${h}px`
            gl.viewport(0, 0, canvas.width, canvas.height)
        }

        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        return () => ro.disconnect()
    }, [ready])

    // Mouse interaction
    useEffect(() => {
        const container = containerRef.current
        if (!container || !ready) return

        const handleMove = (e: PointerEvent) => {
            if (snapBackTimerRef.current) {
                clearTimeout(snapBackTimerRef.current)
                snapBackTimerRef.current = null
            }

            const rect = container.getBoundingClientRect()
            const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

            lookTargetRef.current = { x: nx, y: ny }
        }

        const handleClick = () => {
            if (propsRef.current.scanOnClick) {
                const nowSec = performance.now() / 1000 - startTimeRef.current
                const arr = scanStartsRef.current.slice()
                if (arr.length >= MAX_SCANS) arr.shift()
                arr.push(nowSec)
                scanStartsRef.current = arr
            }
        }

        const handleLeave = () => {
            const delay = propsRef.current.snapBackDelay
            if (snapBackTimerRef.current) clearTimeout(snapBackTimerRef.current)
            snapBackTimerRef.current = window.setTimeout(
                () => {
                    lookTargetRef.current = { x: 0, y: 0 }
                    tiltTargetRef.current = 0
                    yawTargetRef.current = 0
                },
                Math.max(0, delay)
            )
        }

        container.addEventListener("pointermove", handleMove, { passive: true })
        container.addEventListener("pointerleave", handleLeave, {
            passive: true,
        })
        container.addEventListener("click", handleClick, { passive: true })

        return () => {
            container.removeEventListener("pointermove", handleMove)
            container.removeEventListener("pointerleave", handleLeave)
            container.removeEventListener("click", handleClick)
            if (snapBackTimerRef.current) clearTimeout(snapBackTimerRef.current)
        }
    }, [ready])

    // Gyroscope
    useEffect(() => {
        if (!ready || !propsRef.current.enableGyro) return

        const handler = (e: DeviceOrientationEvent) => {
            const gamma = e.gamma ?? 0
            const beta = e.beta ?? 0
            const nx = Math.max(-1, Math.min(1, gamma / 45))
            const ny = Math.max(-1, Math.min(1, -beta / 30))
            lookTargetRef.current = { x: nx, y: ny }
            tiltTargetRef.current = ((gamma * Math.PI) / 180) * 0.4
        }

        window.addEventListener("deviceorientation", handler)
        return () => window.removeEventListener("deviceorientation", handler)
    }, [ready])

    // Animation loop
    useEffect(() => {
        if (!ready) return

        const gl = glRef.current
        const canvas = canvasRef.current
        const uniforms = uniformsRef.current
        if (!gl || !canvas) return

        let lastTime = performance.now()

        const animate = () => {
            const props = propsRef.current
            const now = performance.now()
            const dt = Math.max(0, Math.min(0.1, (now - lastTime) / 1000))
            lastTime = now

            const time = now / 1000 - startTimeRef.current

            // Calculate sensitivity-based parameters
            const s = Math.max(0, Math.min(1, props.sensitivity))
            const skewScale = 0.06 + (0.2 - 0.06) * s
            const tiltScale = 0.12 + (0.3 - 0.12) * s
            const yawScale = 0.1 + (0.28 - 0.1) * s
            const smoothTime = 0.45 - (0.45 - 0.12) * s
            const yBoost = 1.2 + (1.6 - 1.2) * s

            // Smooth damp mouse position
            lookCurrentRef.current.x = smoothDamp(
                lookCurrentRef.current.x,
                lookTargetRef.current.x,
                lookVelRef.current.x,
                smoothTime,
                Infinity,
                dt
            )
            lookCurrentRef.current.y = smoothDamp(
                lookCurrentRef.current.y,
                lookTargetRef.current.y,
                lookVelRef.current.y,
                smoothTime,
                Infinity,
                dt
            )

            tiltCurrentRef.current = smoothDamp(
                tiltCurrentRef.current,
                tiltTargetRef.current,
                tiltVelRef.current,
                smoothTime,
                Infinity,
                dt
            )

            yawCurrentRef.current = smoothDamp(
                yawCurrentRef.current,
                yawTargetRef.current,
                yawVelRef.current,
                smoothTime,
                Infinity,
                dt
            )

            const skewX = lookCurrentRef.current.x * skewScale
            const skewY = -lookCurrentRef.current.y * yBoost * skewScale

            // Set uniforms
            gl.uniform3f(uniforms.iResolution, canvas.width, canvas.height, 1)
            gl.uniform1f(uniforms.iTime, time)
            gl.uniform2f(uniforms.uSkew, skewX, skewY)
            gl.uniform1f(uniforms.uTilt, tiltCurrentRef.current * tiltScale)
            gl.uniform1f(
                uniforms.uYaw,
                Math.max(-0.6, Math.min(0.6, yawCurrentRef.current * yawScale))
            )

            gl.uniform1f(uniforms.uLineThickness, props.lineThickness)

            const [lr, lg, lb] = parseColorLinear(props.linesColor)
            const [sr, sg, sb] = parseColorLinear(props.scanColor)
            const [bgr, bgg, bgb] = parseColor(props.backgroundColor)

            gl.uniform3f(uniforms.uLinesColor, lr, lg, lb)
            gl.uniform3f(uniforms.uScanColor, sr, sg, sb)
            gl.uniform3f(uniforms.uBgColor, bgr, bgg, bgb)

            gl.uniform1f(uniforms.uGridScale, props.gridScale)

            // Grid type mapping
            const gridTypeMap: Record<string, number> = {
                square: 0,
                hex: 1,
                triangle: 2,
                diamond: 3,
                radial: 4,
                cross: 5,
            }
            gl.uniform1i(uniforms.uGridType, gridTypeMap[props.gridType] ?? 0)

            gl.uniform1f(
                uniforms.uLineStyle,
                props.lineStyle === "dashed"
                    ? 1
                    : props.lineStyle === "dotted"
                      ? 2
                      : 0
            )
            gl.uniform1f(
                uniforms.uLineJitter,
                Math.max(0, Math.min(1, props.lineJitter))
            )
            gl.uniform1f(uniforms.uScanOpacity, props.scanOpacity)
            gl.uniform1f(
                uniforms.uScanDirection,
                props.scanDirection === "backward"
                    ? 1
                    : props.scanDirection === "pingpong"
                      ? 2
                      : 0
            )
            gl.uniform1f(uniforms.uNoise, props.noiseIntensity)
            gl.uniform1f(uniforms.uBloomOpacity, props.bloomIntensity)
            gl.uniform1f(uniforms.uScanGlow, props.scanGlow)
            gl.uniform1f(uniforms.uScanSoftness, props.scanSoftness)
            gl.uniform1f(uniforms.uPhaseTaper, props.scanPhaseTaper)
            gl.uniform1f(uniforms.uScanDuration, props.scanDuration)
            gl.uniform1f(uniforms.uScanDelay, props.scanDelay)
            gl.uniform1f(uniforms.uChroma, props.chromaticAberration)

            // Click scans
            const scanArr = new Float32Array(MAX_SCANS)
            for (
                let i = 0;
                i < scanStartsRef.current.length && i < MAX_SCANS;
                i++
            ) {
                scanArr[i] = scanStartsRef.current[i]
            }
            gl.uniform1fv(uniforms.uScanStarts, scanArr)
            gl.uniform1i(uniforms.uScanCount, scanStartsRef.current.length)

            // Blend mode: 0.0 = additive (dark bg), 1.0 = direct (light bg), 2.0 = auto
            const blendModeMap: Record<string, number> = {
                additive: 0.0,
                subtractive: 1.0,
                overlay: 2.0,
            }
            gl.uniform1f(
                uniforms.uBlendMode,
                blendModeMap[props.blendMode] ?? 2.0
            )

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(rafRef.current)
    }, [ready])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                cursor: scanOnClick ? "pointer" : "default",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />
        </div>
    )
}

addPropertyControls(GridScan, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a12",
    },
    linesColor: {
        type: ControlType.Color,
        title: "Lines Color",
        defaultValue: "#5a4a7a",
    },
    scanColor: {
        type: ControlType.Color,
        title: "Scan Color",
        defaultValue: "#FF9FFC",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["additive", "subtractive", "overlay"],
        optionTitles: [
            "Additive (Dark BG)",
            "Direct (Light BG)",
            "Auto Detect",
        ],
        defaultValue: "overlay",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 1.5,
    },
    gridScale: {
        type: ControlType.Number,
        title: "Grid Scale",
        min: 0.01,
        max: 0.3,
        step: 0.005,
        defaultValue: 0.04,
    },
    gridType: {
        type: ControlType.Enum,
        title: "Grid Type",
        options: ["square", "hex", "triangle", "diamond", "radial", "cross"],
        optionTitles: [
            "Square",
            "Hexagon",
            "Triangle",
            "Diamond",
            "Radial",
            "Cross",
        ],
        defaultValue: "square",
    },
    lineStyle: {
        type: ControlType.Enum,
        title: "Line Style",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        defaultValue: "solid",
    },
    lineJitter: {
        type: ControlType.Number,
        title: "Line Jitter",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0,
    },
    scanOpacity: {
        type: ControlType.Number,
        title: "Scan Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
    },
    scanDirection: {
        type: ControlType.Enum,
        title: "Scan Direction",
        options: ["forward", "backward", "pingpong"],
        optionTitles: ["Forward", "Backward", "Ping Pong"],
        defaultValue: "pingpong",
    },
    scanSoftness: {
        type: ControlType.Number,
        title: "Scan Softness",
        min: 0.5,
        max: 5,
        step: 0.25,
        defaultValue: 2,
    },
    scanGlow: {
        type: ControlType.Number,
        title: "Scan Glow",
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 0.5,
    },
    scanPhaseTaper: {
        type: ControlType.Number,
        title: "Scan Taper",
        min: 0,
        max: 0.49,
        step: 0.05,
        defaultValue: 0.9,
    },
    scanDuration: {
        type: ControlType.Number,
        title: "Scan Duration",
        min: 0.5,
        max: 10,
        step: 0.5,
        defaultValue: 2,
    },
    scanDelay: {
        type: ControlType.Number,
        title: "Scan Delay",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 2,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise",
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.01,
    },
    bloomIntensity: {
        type: ControlType.Number,
        title: "Bloom",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    chromaticAberration: {
        type: ControlType.Number,
        title: "Chromatic Aberration",
        min: 0,
        max: 0.02,
        step: 0.001,
        defaultValue: 0.002,
    },
    scanOnClick: {
        type: ControlType.Boolean,
        title: "Scan on Click",
        defaultValue: true,
    },
    enableGyro: {
        type: ControlType.Boolean,
        title: "Enable Gyroscope",
        defaultValue: false,
    },
    snapBackDelay: {
        type: ControlType.Number,
        title: "Snap Back Delay",
        min: 0,
        max: 1000,
        step: 50,
        defaultValue: 250,
    },
})
;(GridScan as any).defaultProps = {
    width: "100%",
    height: 400,
}
