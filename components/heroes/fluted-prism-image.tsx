/**
 * FlutedPrismHoverImage — Framer Code Component
 *
 * Interactive WebGL image hover effect that slices the image into vertical
 * fluted / prism louvers with sawtooth shear, multi-strip echo refraction,
 * and 3D louver edge shading on mouse hover.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 680
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useRef, useState } from "react"

export interface FlutedPrismHoverImageProps {
    image:
        | string
        | {
              src: string
              srcSet?: string
              alt?: string
              positionX?: string
              positionY?: string
          }
    hoverMode: "spotlight" | "band" | "full" | "always"
    idlePosition:
        | "none"
        | "center"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "custom"
    idleX: number
    idleY: number
    columns: number
    sliceProfile: "sawtooth" | "prism" | "cylinder"
    refractionX: number
    shearY: number
    direction: "left" | "right" | "mouse"
    shadowIntensity: number
    shadowColorSource: "image" | "sample" | "custom"
    shadowPickX: number
    shadowPickY: number
    shadowDarken: number
    shadowColor: string
    lineIntensity: number
    lineWidth: number
    lineColorSource: "shadow" | "image" | "custom"
    lineColor: string
    highlightIntensity: number
    baseRibs: number
    chromaticAberration: number
    maskRadius: number
    maskSoftness: number
    mouseInfluence: number
    smoothing: number
    hoverSpeed: number
    zoomOnHover: number
    sliceAngle: number
    objectFit: "cover" | "contain" | "fill"
    borderRadius: number
    scrollReveal: boolean
    scrollStrength: number
    touchSpotlight: boolean
    touchStrength: number
    canvasPreview: boolean
    style?: React.CSSProperties
}

// Built-in placeholder shown until an image is chosen (or when one fails to load): bold
// shapes so the glass reads clearly, inlined so it never depends on an outside image host
const placeholderSvg = (label: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16161a"/><stop offset="1" stop-color="#2b2b33"/></linearGradient>
<radialGradient id="orb" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.45" stop-color="#ff6a3d"/><stop offset="1" stop-color="#8a2be2"/></radialGradient>
<linearGradient id="band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3ad1ff" stop-opacity="0"/><stop offset="0.5" stop-color="#3ad1ff" stop-opacity="0.55"/><stop offset="1" stop-color="#3ad1ff" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1600" height="1000" fill="url(#bg)"/>
<rect x="-200" y="610" width="2000" height="90" fill="url(#band)" transform="rotate(-12 800 655)"/>
<circle cx="980" cy="470" r="300" fill="url(#orb)"/>
<circle cx="520" cy="300" r="90" fill="#f4f1ea" opacity="0.9"/>
<text x="80" y="920" fill="#ffffff" fill-opacity="0.72" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="40" font-weight="600">${label}</text>
</svg>`

const svgToDataUrl = (svg: string) =>
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)

const DEFAULT_IMAGE = svgToDataUrl(placeholderSvg("Choose an image"))
const ERROR_IMAGE = svgToDataUrl(placeholderSvg("Image couldn’t load"))

function resolveImageUrl(image: FlutedPrismHoverImageProps["image"]): string {
    if (!image) return DEFAULT_IMAGE
    if (typeof image === "string") return image || DEFAULT_IMAGE
    if (typeof image === "object" && image.src) return image.src
    return DEFAULT_IMAGE
}

// Focal point set in Framer's image picker: "left" | "center" | "right" | "NN%"
function parseFocal(value: string | undefined, start: string, end: string): number {
    if (!value || value === "center") return 0.5
    if (value === start) return 0
    if (value === end) return 1
    const n = parseFloat(value)
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n / 100)) : 0.5
}

function resolveFocal(image: FlutedPrismHoverImageProps["image"]) {
    if (!image || typeof image !== "object") return { x: 0.5, y: 0.5 }
    return {
        x: parseFocal(image.positionX, "left", "right"),
        y: parseFocal(image.positionY, "top", "bottom"),
    }
}

/**
 * Parses hex (#RGB, #RRGGBB, #RRGGBBAA) or rgb/rgba(...) strings into normalized [r, g, b] in 0..1.
 */
function parseColorToRgb(color: string): [number, number, number] {
    if (!color) return [0, 0, 0]
    const c = color.trim()
    if (c.startsWith("#")) {
        let hex = c.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .slice(0, 3)
                .split("")
                .map((ch) => ch + ch)
                .join("")
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                return [r / 255, g / 255, b / 255]
            }
        }
    }
    const rgbMatch = c.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    )
    if (rgbMatch) {
        return [
            Math.min(255, Math.max(0, parseFloat(rgbMatch[1]))) / 255,
            Math.min(255, Math.max(0, parseFloat(rgbMatch[2]))) / 255,
            Math.min(255, Math.max(0, parseFloat(rgbMatch[3]))) / 255,
        ]
    }
    return [0, 0, 0]
}

/**
 * Returns normalized (0..1) coordinates for the idle active position when not hovered.
 */
function getIdleCoordinates(
    idlePosition: FlutedPrismHoverImageProps["idlePosition"],
    idleX: number,
    idleY: number
): { x: number; y: number } {
    switch (idlePosition) {
        case "top-left":
            return { x: 0.22, y: 0.22 }
        case "top-right":
            return { x: 0.78, y: 0.22 }
        case "bottom-left":
            return { x: 0.22, y: 0.78 }
        case "bottom-right":
            return { x: 0.78, y: 0.78 }
        case "custom":
            return {
                x: Math.max(0, Math.min(1, idleX / 100)),
                y: Math.max(0, Math.min(1, idleY / 100)),
            }
        case "center":
        default:
            return { x: 0.5, y: 0.5 }
    }
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_imageResolution;
uniform vec2 u_mouse;
uniform vec2 u_mouseVel;
uniform vec2 u_trail1;
uniform vec2 u_trail2;
uniform float u_hover;
uniform float u_time;

uniform float u_columns;
uniform int u_sliceProfile;
uniform float u_refractionX;
uniform float u_shearY;
uniform int u_direction;
uniform float u_dirSign;
uniform float u_shadowIntensity;
uniform int u_shadowSource;
uniform vec2 u_shadowSampleUV;
uniform float u_shadowDarken;
uniform vec3 u_shadowColor;
uniform float u_lineIntensity;
uniform float u_lineWidth;
uniform int u_lineColorSource;
uniform vec3 u_lineColor;
uniform float u_highlightIntensity;
uniform float u_baseRibs;
uniform float u_chromatic;
uniform float u_maskRadius;
uniform float u_maskSoftness;
uniform float u_mouseInfluence;
uniform float u_zoomOnHover;
uniform float u_sliceAngle;
uniform int u_hoverMode;
uniform int u_objectFit;
uniform float u_scroll;
uniform float u_touch;
uniform vec2 u_focal;

// Compute UV mapped according to objectFit (0 = cover, 1 = contain, 2 = fill)
vec2 getFittedUV(vec2 uv, vec2 texSize, vec2 canvasSize, int fitMode) {
    if (fitMode == 2 || texSize.x <= 0.0 || texSize.y <= 0.0 || canvasSize.x <= 0.0 || canvasSize.y <= 0.0) {
        return uv;
    }
    float canvasAspect = canvasSize.x / canvasSize.y;
    float texAspect = texSize.x / texSize.y;
    vec2 scale = vec2(1.0);

    if (fitMode == 0) {
        // Cover
        if (canvasAspect > texAspect) {
            scale.y = texAspect / canvasAspect;
        } else {
            scale.x = canvasAspect / texAspect;
        }
    } else {
        // Contain
        if (canvasAspect > texAspect) {
            scale.x = canvasAspect / texAspect;
        } else {
            scale.y = texAspect / canvasAspect;
        }
    }
    // Crop / letterbox around the focal point, like CSS object-position
    return (uv - 0.5) * scale + 0.5 + (u_focal - 0.5) * (1.0 - scale);
}

vec2 rotate2D(vec2 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Smooth radial spotlight field including mouse trail points
float computeSpotlightField(vec2 uv, vec2 mouse, vec2 t1, vec2 t2, float aspect, float radius, float softness) {
    vec2 p = uv;
    p.x *= aspect;

    vec2 m0 = mouse;
    m0.x *= aspect;
    vec2 m1 = t1;
    m1.x *= aspect;
    vec2 m2 = t2;
    m2.x *= aspect;

    // Slightly taller vertical ellipse so vertical slices feel natural
    vec2 ellipseScale = vec2(1.0, 0.82);

    float d0 = length((p - m0) * ellipseScale);
    float d1 = length((p - m1) * ellipseScale) * 1.15;
    float d2 = length((p - m2) * ellipseScale) * 1.32;

    float d = min(d0, min(d1, d2));
    float inner = max(0.001, radius * (1.0 - softness * 0.75));
    float outer = max(inner + 0.01, radius * (1.0 + softness));

    return 1.0 - smoothstep(inner, outer, d);
}

void main() {
    // Flip Y so (0,0) is top-left in UV space for intuitive image coordinates
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    float aspect = u_resolution.x / max(1.0, u_resolution.y);

    // Determine local distortion intensity mask based on selected hover mode
    float mask = 0.0;
    if (u_hoverMode == 0) {
        // Spotlight + Trail around cursor
        float spot = computeSpotlightField(
            uv,
            u_mouse,
            u_trail1,
            u_trail2,
            aspect,
            u_maskRadius * (1.0 + 0.4 * u_touch),
            u_maskSoftness
        );
        mask = spot * u_hover;
    } else if (u_hoverMode == 1) {
        // Vertical Band sweep around cursor X
        float dx = abs(uv.x - u_mouse.x);
        float dy = abs(uv.y - u_mouse.y) * 0.45;
        float bandDist = sqrt(dx * dx + dy * dy);
        float inner = max(0.001, u_maskRadius * (1.0 - u_maskSoftness * 0.7));
        float outer = max(inner + 0.01, u_maskRadius * (1.0 + u_maskSoftness));
        mask = (1.0 - smoothstep(inner, outer, bandDist)) * u_hover;
    } else if (u_hoverMode == 2) {
        // Full image on hover, modulated slightly by cursor proximity
        float spot = computeSpotlightField(
            uv,
            u_mouse,
            u_trail1,
            u_trail2,
            aspect,
            u_maskRadius * 1.6,
            0.85
        );
        mask = u_hover * mix(0.65, 1.0, spot);
    } else {
        // Always active, boosted near cursor
        float spot = computeSpotlightField(
            uv,
            u_mouse,
            u_trail1,
            u_trail2,
            aspect,
            u_maskRadius * 1.35,
            0.85
        );
        mask = mix(0.75, 1.0, spot * u_hover);
    }

    // Smooth cubic shaping on the mask for organic feathering across slices
    float shapedMask = smoothstep(0.0, 1.0, mask);

    // Scroll reveal: the whole image refracts as it enters/leaves the viewport
    shapedMask = max(shapedMask, u_scroll);

    // Optional rotation angle for the vertical slices
    vec2 centered = uv - 0.5;
    vec2 rotated = rotate2D(centered, u_sliceAngle) + 0.5;

    // Partition into vertical columns / slices
    float cols = max(4.0, u_columns);
    float sliceCoord = rotated.x * cols;
    float sliceIdx = floor(sliceCoord);
    float f = fract(sliceCoord); // [0..1] position inside the current vertical strip

    // Compute per-slice profile for how light bends across each louver strip
    float profile = 0.0;
    if (u_sliceProfile == 0) {
        // Sawtooth / Linear Prism: creates sharp stepped repetition & diagonal sawtooth contours
        profile = f - 0.5;
    } else if (u_sliceProfile == 1) {
        // Curved Prism: steeper bevel near one edge, matching physical angled louver glass
        float curved = pow(f, 1.35);
        profile = curved - 0.5;
    } else {
        // Cylindrical Fluted Glass: smooth sinusoidal lens per column
        profile = sin((f - 0.5) * 3.14159265) * 0.5;
    }

    // Direction multiplier (-1 = left louver tilt, +1 = right louver tilt, or mouse-driven)
    float dirSign = -1.0;
    if (u_direction == 1) {
        dirSign = 1.0;
    } else if (u_direction == 2) {
        // Reacts to mouse horizontal position + velocity; smoothed on the CPU so the
        // tilt never flips sign in a single frame
        dirSign = u_dirSign;
    }

    // Also calculate per-slice mask at the slice center so each strip acts coherently
    // while still feathering smoothly across adjacent strips
    float sliceCenterX = (sliceIdx + 0.5) / cols;
    float sliceWave = sin(sliceCenterX * 18.0 - u_mouse.x * 12.0 + u_time * 1.5) * 0.08 * u_mouseInfluence;

    float activeStrength = shapedMask * (1.0 + sliceWave);

    // Horizontal multi-strip echo refraction:
    // When refractionX > 1/cols, adjacent vertical strips sample overlapping horizontal
    // regions of the image, repeating facial features / contours across 3-5 strips!
    float dx = profile * u_refractionX * dirSign * activeStrength;

    // Add subtle mouse velocity pull
    dx += u_mouseVel.x * 0.18 * u_mouseInfluence * shapedMask * (f - 0.5);

    // Vertical sawtooth shear:
    // Shifts UV.y diagonally across each strip's width so horizontal/curved edges
    // form serrated sawtooth peaks
    float dy = profile * u_shearY * activeStrength;
    dy += u_mouseVel.y * 0.14 * u_mouseInfluence * shapedMask * (f - 0.5);

    // Scroll reveal louver displacement, independent of the hover refraction controls
    dx -= profile * 0.14 * u_scroll;
    dy += profile * 0.05 * u_scroll;

    // Touch boost: no cursor speed on phones, so add louver refraction inside the spotlight
    dx -= profile * 0.12 * u_touch * shapedMask;
    dy += profile * 0.04 * u_touch * shapedMask;

    // Subtle hover zoom centered around cursor
    vec2 zoomedUV = mix(uv, u_mouse + (uv - u_mouse) / max(0.5, 1.0 + u_zoomOnHover * u_hover), u_hover);
    // Scroll reveal zoom, settling to 1 as the image comes into place
    zoomedUV = 0.5 + (zoomedUV - 0.5) / (1.0 + 0.08 * u_scroll);

    // Apply displacement along the slice angle
    vec2 disp = rotate2D(vec2(dx, dy), -u_sliceAngle);
    vec2 displacedUV = zoomedUV + disp;

    // Chromatic aberration spread across the prism strip
    float prismDispersion = (0.35 + abs(profile) * 1.65) * (profile >= 0.0 ? 1.0 : -1.0);
    float chromaOffset = u_chromatic * 0.028 * prismDispersion * activeStrength * (1.0 + u_touch);
    vec2 chromaVec = rotate2D(vec2(chromaOffset, chromaOffset * 0.42), -u_sliceAngle);

    vec2 uvR = clamp(getFittedUV(displacedUV + chromaVec, u_imageResolution, u_resolution, u_objectFit), 0.001, 0.999);
    vec2 uvG = clamp(getFittedUV(displacedUV, u_imageResolution, u_resolution, u_objectFit), 0.001, 0.999);
    vec2 uvB = clamp(getFittedUV(displacedUV - chromaVec, u_imageResolution, u_resolution, u_objectFit), 0.001, 0.999);

    // Texture is premultiplied; keep each channel's own coverage so the colour fringes
    // follow a transparent PNG's edges, then un-premultiply for shading
    vec4 rSample = texture2D(u_texture, uvR);
    vec4 gSample = texture2D(u_texture, uvG);
    vec4 bSample = texture2D(u_texture, uvB);
    float imageAlpha = (rSample.a + gSample.a + bSample.a) / 3.0;

    vec3 color = min(vec3(rSample.r, gSample.g, bSample.b) / max(imageAlpha, 0.001), 1.0);

    // 3D Louver Shading & Louver Divider Lines (independently controlled)
    float ribVisibility = clamp(u_baseRibs + shapedMask * (1.0 - u_baseRibs), 0.0, 1.0);

    // 1. Smooth 3D Louver Shadow gradient across the width of each strip
    float edgeShadow = smoothstep(0.12, 0.94, f);
    float louverShadowFactor = edgeShadow * 0.85 * u_shadowIntensity * ribVisibility;

    // 2. Crisp Louver Line right at the boundary between vertical strips
    float lw = clamp(u_lineWidth, 0.005, 0.45);
    float seamLine = (1.0 - smoothstep(0.0, lw, f)) * 0.75 + smoothstep(1.0 - lw * 1.25, 1.0, f);
    float louverLineFactor = clamp(seamLine, 0.0, 1.0) * u_lineIntensity * ribVisibility;

    // Specular / bevel highlight along the leading face of each strip
    float bevelHighlight = smoothstep(0.02, 0.22, f) * (1.0 - smoothstep(0.22, 0.58, f));
    float highlightFactor = bevelHighlight * u_highlightIntensity * shapedMask;

    // Sample local strip color for image-derived shadow / line colors
    vec2 sliceSampleUV = clamp(
        getFittedUV(vec2(sliceCenterX, displacedUV.y), u_imageResolution, u_resolution, u_objectFit),
        0.001,
        0.999
    );
    vec4 localSample = texture2D(u_texture, sliceSampleUV);
    vec3 localImgColor = localSample.rgb / max(localSample.a, 0.001);
    vec3 autoImageShadow = pow(max(localImgColor, vec3(0.001)), vec3(1.0 + u_shadowDarken * 1.4)) * (1.0 - u_shadowDarken * 0.85);

    // Resolve Louver Shadow color
    vec3 effectiveShadowColor = u_shadowColor;
    if (u_shadowSource == 0) {
        effectiveShadowColor = autoImageShadow;
    } else if (u_shadowSource == 1) {
        vec2 pickUV = clamp(
            getFittedUV(u_shadowSampleUV, u_imageResolution, u_resolution, u_objectFit),
            0.001,
            0.999
        );
        vec4 pickedSample = texture2D(u_texture, pickUV);
        vec3 pickedImgColor = pickedSample.rgb / max(pickedSample.a, 0.001);
        effectiveShadowColor = pow(max(pickedImgColor, vec3(0.001)), vec3(1.0 + u_shadowDarken * 1.2)) * (1.0 - u_shadowDarken * 0.85);
    }

    // Resolve Louver Line color
    vec3 effectiveLineColor = effectiveShadowColor;
    if (u_lineColorSource == 1) {
        effectiveLineColor = autoImageShadow * 0.75;
    } else if (u_lineColorSource == 2) {
        effectiveLineColor = u_lineColor;
    }

    color = mix(color, effectiveShadowColor, clamp(louverShadowFactor, 0.0, 0.92));
    color = mix(color, effectiveLineColor, clamp(louverLineFactor, 0.0, 0.96));
    color += color * highlightFactor * 0.45 + vec3(highlightFactor * 0.06);

    // Contain: leave the letterbox transparent (so the parent's fill shows) instead of
    // smearing the clamped edge pixels. Uses the displaced UV so the bar edge is
    // sliced along with the image.
    float alpha = imageAlpha;
    if (u_objectFit == 1) {
        vec2 fitted = getFittedUV(displacedUV, u_imageResolution, u_resolution, u_objectFit);
        vec2 edge = smoothstep(vec2(-0.0015), vec2(0.0015), fitted)
            * smoothstep(vec2(-0.0015), vec2(0.0015), 1.0 - fitted);
        alpha *= edge.x * edge.y;
    }

    // Premultiplied alpha output
    gl_FragColor = vec4(color * alpha, alpha);
}
`

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("Shader compile error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
): WebGLProgram | null {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return null
    const program = gl.createProgram()
    if (!program) return null
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("Program link error:", gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
    }
    return program
}

export default function FlutedPrismHoverImage(
    props: FlutedPrismHoverImageProps
) {
    const {
        image = DEFAULT_IMAGE,
        hoverMode = "spotlight",
        idlePosition = "center",
        idleX = 50,
        idleY = 50,
        columns = 86,
        sliceProfile = "prism",
        refractionX = 0,
        shearY = 0,
        direction = "mouse",
        shadowIntensity = 0.5,
        shadowColorSource = "image",
        shadowPickX = 50,
        shadowPickY = 50,
        shadowDarken = 0.65,
        shadowColor = "#000000",
        lineIntensity = 0.5,
        lineWidth = 0.08,
        lineColorSource = "shadow",
        lineColor = "#000000",
        highlightIntensity = 0.05,
        baseRibs = 0,
        chromaticAberration = 1,
        maskRadius = 0.3,
        maskSoftness = 0.95,
        mouseInfluence = 1.5,
        smoothing = 0.02,
        hoverSpeed = 0.13,
        zoomOnHover = 0.05,
        sliceAngle = 0,
        objectFit = "cover",
        borderRadius = 0,
        scrollReveal = true,
        scrollStrength = 0.5,
        touchSpotlight = true,
        touchStrength = 0.5,
        canvasPreview = true,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Canvas and static exports: draw a still frame, with no interaction or animation
    const isStatic = useIsStaticRenderer()
    const imageUrl = resolveImageUrl(image)
    // Alt text from Framer's image picker; without it the image is treated as decorative
    const imageAlt =
        typeof image === "object" && image.alt ? image.alt : undefined
    const focal = resolveFocal(image)
    const focalX = focal.x
    const focalY = focal.y

    // The canvas stays hidden (showing the parent behind it) until the first image is uploaded
    const [hasImage, setHasImage] = useState(false)

    // Store latest reactive props in a ref so the animation loop never restarts when sliders move
    const configRef = useRef({
        hoverMode,
        idlePosition,
        idleX,
        idleY,
        columns,
        sliceProfile,
        refractionX,
        shearY,
        direction,
        shadowIntensity,
        shadowColorSource,
        shadowPickX,
        shadowPickY,
        shadowDarken,
        shadowColor,
        shadowRgb: parseColorToRgb(shadowColor),
        lineIntensity,
        lineWidth,
        lineColorSource,
        lineColor,
        lineRgb: parseColorToRgb(lineColor),
        highlightIntensity,
        baseRibs,
        chromaticAberration,
        maskRadius,
        maskSoftness,
        mouseInfluence,
        smoothing,
        hoverSpeed,
        zoomOnHover,
        sliceAngle,
        objectFit,
        focalX,
        focalY,
        isStatic,
        scrollReveal,
        scrollStrength,
        touchSpotlight,
        touchStrength,
        canvasPreview,
    })

    // Wakes the render loop after it has parked (set by the WebGL effect)
    const wakeRef = useRef<() => void>(() => {})
    // Uploads a loaded image into the current WebGL texture (set by the WebGL effect)
    const uploadRef = useRef<(img: HTMLImageElement) => void>(() => {})
    // Last successfully loaded image, kept so it can be re-uploaded after context loss
    const loadedImageRef = useRef<HTMLImageElement | null>(null)

    useEffect(() => {
        configRef.current = {
            hoverMode,
            idlePosition,
            idleX,
            idleY,
            columns,
            sliceProfile,
            refractionX,
            shearY,
            direction,
            shadowIntensity,
            shadowColorSource,
            shadowPickX,
            shadowPickY,
            shadowDarken,
            shadowColor,
            shadowRgb: parseColorToRgb(shadowColor),
            lineIntensity,
            lineWidth,
            lineColorSource,
            lineColor,
            lineRgb: parseColorToRgb(lineColor),
            highlightIntensity,
            baseRibs,
            chromaticAberration,
            maskRadius,
            maskSoftness,
            mouseInfluence,
            smoothing,
            hoverSpeed,
            zoomOnHover,
            sliceAngle,
            objectFit,
            focalX,
            focalY,
            isStatic,
            scrollReveal,
            scrollStrength,
            touchSpotlight,
            touchStrength,
            canvasPreview,
        }
        wakeRef.current()
    }, [
        hoverMode,
        idlePosition,
        idleX,
        idleY,
        columns,
        sliceProfile,
        refractionX,
        shearY,
        direction,
        shadowIntensity,
        shadowColorSource,
        shadowPickX,
        shadowPickY,
        shadowDarken,
        shadowColor,
        lineIntensity,
        lineWidth,
        lineColorSource,
        lineColor,
        highlightIntensity,
        baseRibs,
        chromaticAberration,
        maskRadius,
        maskSoftness,
        mouseInfluence,
        smoothing,
        hoverSpeed,
        zoomOnHover,
        sliceAngle,
        objectFit,
        focalX,
        focalY,
        isStatic,
        scrollReveal,
        scrollStrength,
        touchSpotlight,
        touchStrength,
        canvasPreview,
    ])

    const initialIdle = getIdleCoordinates(idlePosition, idleX, idleY)
    const hasInitialIdle = idlePosition !== "none"

    // Pointer & physics state ref
    const stateRef = useRef({
        isPointerOver: false,
        targetMouse: { x: initialIdle.x, y: initialIdle.y },
        currentMouse: { x: initialIdle.x, y: initialIdle.y },
        prevMouse: { x: initialIdle.x, y: initialIdle.y },
        mouseVel: { x: 0.0, y: 0.0 },
        dirSign: 0.15,
        trail1: { x: initialIdle.x, y: initialIdle.y },
        trail2: { x: initialIdle.x, y: initialIdle.y },
        targetHover: hasInitialIdle ? 1.0 : 0.0,
        currentHover: hasInitialIdle ? 1.0 : 0.0,
        imageWidth: 1024,
        imageHeight: 1024,
        hasTexture: false,
        // Smoothed scroll reveal amount; -1 = not measured yet (snap on first frame)
        scrollAmount: -1,
        touchAmount: 0,
        time: 0,
    })

    // Initialize WebGL pipeline once
    useEffect(() => {
        const containerEl = containerRef.current
        const canvasEl = canvasRef.current
        if (!containerEl || !canvasEl) return
        // Non-null aliases so the hoisted render/draw functions keep the narrowed types
        const container: HTMLDivElement = containerEl
        const canvas: HTMLCanvasElement = canvasEl

        const maybeGl =
            (canvas.getContext("webgl", {
                alpha: true,
                antialias: false,
                premultipliedAlpha: true,
            }) as WebGLRenderingContext | null) ||
            (canvas.getContext(
                "experimental-webgl"
            ) as WebGLRenderingContext | null)
        if (!maybeGl) return
        const gl: WebGLRenderingContext = maybeGl

        const st = stateRef.current

        // GL resources; recreated after a context loss
        let program: WebGLProgram | null = null
        let quadBuffer: WebGLBuffer | null = null
        let texture: WebGLTexture | null = null
        let uniforms: Record<string, WebGLUniformLocation | null> = {}
        let contextLost = false

        // Render loop: runs only while something is moving and the canvas is on screen
        let rafId = 0
        let lastTime = 0
        let isVisible = true
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        // Touch-first devices have no hover, so the spotlight follows the scroll instead
        const noHover = window.matchMedia("(hover: none)")

        const wake = () => {
            if (rafId || contextLost || !isVisible) return
            lastTime = 0
            rafId = requestAnimationFrame(render)
        }
        wakeRef.current = wake

        const uploadImage = (img: HTMLImageElement) => {
            if (contextLost || !texture) return
            st.imageWidth = img.naturalWidth || img.width || 1024
            st.imageHeight = img.naturalHeight || img.height || 1024
            gl.bindTexture(gl.TEXTURE_2D, texture)
            // Premultiply on upload so transparent pixels filter cleanly instead of bleeding
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img
            )
            st.hasTexture = true
            wake()
        }

        const setupGL = (): boolean => {
            program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)
            if (!program) return false
            gl.useProgram(program)

            // Fullscreen quad
            quadBuffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
            )
            const posLoc = gl.getAttribLocation(program, "a_position")
            gl.enableVertexAttribArray(posLoc)
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

            texture = gl.createTexture()
            if (!texture) return false
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

            // Cache uniform locations
            uniforms = {}
            const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
            for (let i = 0; i < count; i++) {
                const info = gl.getActiveUniform(program, i)
                if (info) {
                    uniforms[info.name] = gl.getUniformLocation(
                        program,
                        info.name
                    )
                }
            }

            gl.viewport(0, 0, canvas.width, canvas.height)
            st.hasTexture = false
            if (loadedImageRef.current) uploadImage(loadedImageRef.current)
            return true
        }

        if (!setupGL()) return
        uploadRef.current = uploadImage

        // Resize handling
        const updateSize = () => {
            const rect = container.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const width = Math.round(rect.width * dpr)
            const height = Math.round(rect.height * dpr)
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width
                canvas.height = height
                gl.viewport(0, 0, width, height)
                // Resizing clears the drawing buffer, so draw again
                wake()
            }
        }

        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(container)

        const intersectionObserver = new IntersectionObserver((entries) => {
            isVisible = entries[entries.length - 1].isIntersecting
            if (isVisible) wake()
        })
        intersectionObserver.observe(container)

        // Pointer interactions. Tracked at window level and hit-tested against the
        // container rect, so text or other layers placed on top don't block the effect.
        let lastClientX = 0
        let lastClientY = 0
        let hasPointerPosition = false

        const handlePointerEnter = (x: number, y: number) => {
            st.isPointerOver = true
            st.targetMouse.x = x
            st.targetMouse.y = y
            // Snap closer on initial entry if fully unhovered and no idle active
            if (st.currentHover < 0.05) {
                st.currentMouse.x = x
                st.currentMouse.y = y
                st.trail1.x = x
                st.trail1.y = y
                st.trail2.x = x
                st.trail2.y = y
            }
            st.targetHover = 1.0
            wake()
        }

        const handlePointerLeave = () => {
            st.isPointerOver = false
            const cfg = configRef.current
            if (cfg.idlePosition !== "none") {
                const idlePos = getIdleCoordinates(
                    cfg.idlePosition,
                    cfg.idleX,
                    cfg.idleY
                )
                st.targetMouse.x = idlePos.x
                st.targetMouse.y = idlePos.y
                st.targetHover = 1.0
            } else {
                st.targetHover = 0.0
            }
            wake()
        }

        const updatePointer = () => {
            if (!hasPointerPosition) return
            // Reduced motion: the image keeps its still idle look and ignores the cursor
            if (reducedMotion.matches) {
                if (st.isPointerOver) handlePointerLeave()
                return
            }
            // Offscreen and not hovered: nothing to do, skip the layout read
            if (!isVisible && !st.isPointerOver) return
            const rect = container.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const inside =
                lastClientX >= rect.left &&
                lastClientX <= rect.right &&
                lastClientY >= rect.top &&
                lastClientY <= rect.bottom
            if (!inside) {
                if (st.isPointerOver) handlePointerLeave()
                return
            }
            const x = (lastClientX - rect.left) / rect.width
            const y = (lastClientY - rect.top) / rect.height
            if (!st.isPointerOver) {
                handlePointerEnter(x, y)
                return
            }
            st.targetMouse.x = x
            st.targetMouse.y = y
            st.targetHover = 1.0
            wake()
        }

        const handlePointerMove = (e: PointerEvent) => {
            lastClientX = e.clientX
            lastClientY = e.clientY
            hasPointerPosition = true
            updatePointer()
        }

        // A touch ends with the finger lifted, so treat it as leaving
        const handlePointerEnd = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" && st.isPointerOver) {
                hasPointerPosition = false
                handlePointerLeave()
            }
        }

        // Cursor left the browser window or the tab lost focus
        const handlePointerExit = () => {
            hasPointerPosition = false
            if (st.isPointerOver) handlePointerLeave()
        }

        const interactive = !configRef.current.isStatic
        if (interactive) {
            window.addEventListener("pointermove", handlePointerMove, {
                passive: true,
            })
            window.addEventListener("pointerdown", handlePointerMove, {
                passive: true,
            })
            window.addEventListener("pointerup", handlePointerEnd)
            window.addEventListener("pointercancel", handlePointerEnd)
            window.addEventListener("blur", handlePointerExit)
            document.documentElement.addEventListener(
                "pointerleave",
                handlePointerExit
            )
        }
        // Scrolling moves the image under a still cursor
        const handleScroll = () => {
            updatePointer()
            const cfg = configRef.current
            if (cfg.scrollReveal || (cfg.touchSpotlight && noHover.matches)) wake()
        }
        if (interactive) {
            window.addEventListener("scroll", handleScroll, {
                passive: true,
                capture: true,
            })
        }

        // Converts a per-frame lerp factor tuned at 60fps into one for the actual frame time
        const ease = (factor: number, frames: number) =>
            1 - Math.pow(1 - factor, frames)

        const SETTLE_EPS = 0.0002

        function render(now: number) {
            rafId = 0
            if (contextLost || !isVisible) return

            const cfg = configRef.current

            // Elapsed time in 60fps frames; clamped so a long pause doesn't jump
            const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60
            // Browsers can deliver two frames with the same timestamp. With no elapsed
            // time the velocity below would be 0/0 = NaN, which sticks and blanks the
            // image, so skip the step and wait for the next frame
            if (dt <= 0) {
                lastTime = now
                rafId = requestAnimationFrame(render)
                return
            }
            lastTime = now
            const frames = dt * 60

            // When pointer is not over the image, use idlePosition (or Framer Canvas preview)
            let effectiveTargetHover = st.targetHover
            const touchMode =
                cfg.touchSpotlight &&
                noHover.matches &&
                !cfg.isStatic &&
                !reducedMotion.matches
            if (!st.isPointerOver) {
                if (touchMode) {
                    // Scroll-driven spotlight: travels down the image as it moves up
                    // through the viewport, with a gentle side-to-side sweep
                    const rect = container.getBoundingClientRect()
                    const vh = window.innerHeight || 1
                    const p = Math.max(
                        0,
                        Math.min(1, (vh - rect.top) / (vh + rect.height))
                    )
                    st.targetMouse.x = 0.5 + 0.3 * Math.sin(p * Math.PI * 2)
                    st.targetMouse.y = 0.12 + 0.76 * p
                    effectiveTargetHover = 1.0
                } else if (cfg.idlePosition !== "none") {
                    const idlePos = getIdleCoordinates(
                        cfg.idlePosition,
                        cfg.idleX,
                        cfg.idleY
                    )
                    st.targetMouse.x = idlePos.x
                    st.targetMouse.y = idlePos.y
                    effectiveTargetHover = 1.0
                } else if (cfg.isStatic && cfg.canvasPreview) {
                    st.targetMouse.x = 0.45
                    st.targetMouse.y = 0.48
                    effectiveTargetHover = 1.0
                } else {
                    effectiveTargetHover = 0.0
                }
            }

            const lerpFactor = Math.max(0.01, Math.min(0.5, cfg.smoothing))
            const hoverLerp = Math.max(0.01, Math.min(0.4, cfg.hoverSpeed))
            const mouseK = ease(lerpFactor, frames)

            st.prevMouse.x = st.currentMouse.x
            st.prevMouse.y = st.currentMouse.y

            st.currentMouse.x += (st.targetMouse.x - st.currentMouse.x) * mouseK
            st.currentMouse.y += (st.targetMouse.y - st.currentMouse.y) * mouseK

            // Smooth trailing points for liquid wake
            const trail1K = ease(lerpFactor * 0.55, frames)
            const trail2K = ease(lerpFactor * 0.45, frames)
            st.trail1.x += (st.currentMouse.x - st.trail1.x) * trail1K
            st.trail1.y += (st.currentMouse.y - st.trail1.y) * trail1K
            st.trail2.x += (st.trail1.x - st.trail2.x) * trail2K
            st.trail2.y += (st.trail1.y - st.trail2.y) * trail2K

            // Velocity in "per 60fps frame" units so the shader sees the same values at any refresh rate
            const vx = (st.currentMouse.x - st.prevMouse.x) / frames
            const vy = (st.currentMouse.y - st.prevMouse.y) / frames
            const velK = ease(0.15, frames)
            st.mouseVel.x += (vx - st.mouseVel.x) * velK
            st.mouseVel.y += (vy - st.mouseVel.y) * velK

            // Mouse-driven louver direction. Inside the ±0.15 dead zone keep the current
            // side (hysteresis) instead of snapping, and glide to the target so a side
            // change sweeps through zero rather than jumping
            const mShift = Math.max(
                -1.2,
                Math.min(1.2, (st.currentMouse.x - 0.5) * 1.6 + st.mouseVel.x * 8.0)
            )
            const dirTarget =
                Math.abs(mShift) >= 0.15
                    ? mShift
                    : st.dirSign < 0
                      ? -0.15
                      : 0.15
            st.dirSign += (dirTarget - st.dirSign) * ease(0.08, frames)

            st.currentHover +=
                (effectiveTargetHover - st.currentHover) * ease(hoverLerp, frames)

            // Reduced motion: jump straight to the resting state instead of gliding
            if (reducedMotion.matches) {
                st.currentMouse.x = st.trail1.x = st.trail2.x = st.targetMouse.x
                st.currentMouse.y = st.trail1.y = st.trail2.y = st.targetMouse.y
                st.mouseVel.x = 0
                st.mouseVel.y = 0
                st.currentHover = effectiveTargetHover
            }

            // Scroll reveal: 1 at the viewport edge, eased to 0 once the image is 45% of a
            // viewport inside it; mirrored for leaving at the top
            let scrollTarget = 0
            if (cfg.scrollReveal && !cfg.isStatic && !reducedMotion.matches) {
                const rect = container.getBoundingClientRect()
                const vh = window.innerHeight || 1
                const range = vh * 0.45
                const enter = Math.max(0, Math.min(1, (rect.top - (vh - range)) / range))
                const exit = Math.max(0, Math.min(1, (range - rect.bottom) / range))
                const a = Math.max(enter, exit)
                scrollTarget = a * a * (3 - 2 * a) * cfg.scrollStrength
            }
            if (st.scrollAmount < 0) st.scrollAmount = scrollTarget
            st.scrollAmount +=
                (scrollTarget - st.scrollAmount) * ease(0.18, frames)

            const touchTarget = touchMode ? cfg.touchStrength : 0
            st.touchAmount += (touchTarget - st.touchAmount) * ease(0.1, frames)

            // The slice wave is the only time-driven motion. It runs only while someone is
            // interacting, so an idle image settles and the loop parks
            const timeDriven =
                !cfg.isStatic &&
                cfg.mouseInfluence > 0 &&
                st.isPointerOver &&
                st.currentHover > 0.001
            if (timeDriven) st.time += dt

            if (st.hasTexture) draw(cfg)

            const settled =
                Math.abs(st.targetMouse.x - st.currentMouse.x) < SETTLE_EPS &&
                Math.abs(st.targetMouse.y - st.currentMouse.y) < SETTLE_EPS &&
                Math.abs(st.currentMouse.x - st.trail2.x) < SETTLE_EPS &&
                Math.abs(st.currentMouse.y - st.trail2.y) < SETTLE_EPS &&
                Math.abs(st.mouseVel.x) < SETTLE_EPS * 0.1 &&
                Math.abs(st.mouseVel.y) < SETTLE_EPS * 0.1 &&
                Math.abs(effectiveTargetHover - st.currentHover) < 0.001 &&
                Math.abs(scrollTarget - st.scrollAmount) < 0.001 &&
                Math.abs(touchTarget - st.touchAmount) < 0.001 &&
                (cfg.direction !== "mouse" || Math.abs(dirTarget - st.dirSign) < 0.001)

            if (!settled || timeDriven) {
                rafId = requestAnimationFrame(render)
            }
        }

        function draw(cfg: typeof configRef.current) {
            gl.useProgram(program)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.uniform1i(uniforms.u_texture, 0)

            gl.uniform2f(
                uniforms.u_resolution,
                canvas.width || 1,
                canvas.height || 1
            )
            gl.uniform2f(
                uniforms.u_imageResolution,
                st.imageWidth,
                st.imageHeight
            )
            gl.uniform2f(uniforms.u_mouse, st.currentMouse.x, st.currentMouse.y)
            gl.uniform2f(uniforms.u_mouseVel, st.mouseVel.x, st.mouseVel.y)
            gl.uniform1f(uniforms.u_dirSign, st.dirSign)
            gl.uniform2f(uniforms.u_trail1, st.trail1.x, st.trail1.y)
            gl.uniform2f(uniforms.u_trail2, st.trail2.x, st.trail2.y)
            gl.uniform1f(uniforms.u_hover, st.currentHover)
            gl.uniform1f(uniforms.u_time, st.time)
            gl.uniform1f(uniforms.u_scroll, Math.max(0, st.scrollAmount))
            gl.uniform1f(uniforms.u_touch, st.touchAmount)

            gl.uniform1f(uniforms.u_columns, cfg.columns)
            gl.uniform1i(
                uniforms.u_sliceProfile,
                cfg.sliceProfile === "sawtooth"
                    ? 0
                    : cfg.sliceProfile === "prism"
                      ? 1
                      : 2
            )
            gl.uniform1f(uniforms.u_refractionX, cfg.refractionX)
            gl.uniform1f(uniforms.u_shearY, cfg.shearY)
            gl.uniform1i(
                uniforms.u_direction,
                cfg.direction === "left" ? 0 : cfg.direction === "right" ? 1 : 2
            )
            gl.uniform1f(uniforms.u_shadowIntensity, cfg.shadowIntensity)
            gl.uniform1i(
                uniforms.u_shadowSource,
                cfg.shadowColorSource === "image"
                    ? 0
                    : cfg.shadowColorSource === "sample"
                      ? 1
                      : 2
            )
            gl.uniform2f(
                uniforms.u_shadowSampleUV,
                Math.max(0, Math.min(1, cfg.shadowPickX / 100)),
                Math.max(0, Math.min(1, cfg.shadowPickY / 100))
            )
            gl.uniform1f(uniforms.u_shadowDarken, cfg.shadowDarken)
            gl.uniform3f(uniforms.u_shadowColor, ...cfg.shadowRgb)
            gl.uniform1f(uniforms.u_lineIntensity, cfg.lineIntensity)
            gl.uniform1f(uniforms.u_lineWidth, cfg.lineWidth)
            gl.uniform1i(
                uniforms.u_lineColorSource,
                cfg.lineColorSource === "shadow"
                    ? 0
                    : cfg.lineColorSource === "image"
                      ? 1
                      : 2
            )
            gl.uniform3f(uniforms.u_lineColor, ...cfg.lineRgb)
            gl.uniform1f(uniforms.u_highlightIntensity, cfg.highlightIntensity)
            gl.uniform1f(uniforms.u_baseRibs, cfg.baseRibs)
            gl.uniform1f(uniforms.u_chromatic, cfg.chromaticAberration)
            gl.uniform1f(uniforms.u_maskRadius, cfg.maskRadius)
            gl.uniform1f(uniforms.u_maskSoftness, cfg.maskSoftness)
            gl.uniform1f(uniforms.u_mouseInfluence, cfg.mouseInfluence)
            gl.uniform1f(uniforms.u_zoomOnHover, cfg.zoomOnHover)
            gl.uniform1f(
                uniforms.u_sliceAngle,
                (cfg.sliceAngle * Math.PI) / 180
            )
            gl.uniform1i(
                uniforms.u_hoverMode,
                cfg.hoverMode === "spotlight"
                    ? 0
                    : cfg.hoverMode === "band"
                      ? 1
                      : cfg.hoverMode === "full"
                        ? 2
                        : 3
            )
            gl.uniform2f(uniforms.u_focal, cfg.focalX, cfg.focalY)
            gl.uniform1i(
                uniforms.u_objectFit,
                cfg.objectFit === "cover"
                    ? 0
                    : cfg.objectFit === "contain"
                      ? 1
                      : 2
            )

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        // Mobile browsers drop WebGL contexts under memory pressure; rebuild when restored
        const handleContextLost = (e: Event) => {
            e.preventDefault()
            contextLost = true
            cancelAnimationFrame(rafId)
            rafId = 0
            program = null
            quadBuffer = null
            texture = null
            st.hasTexture = false
        }

        const handleContextRestored = () => {
            contextLost = false
            if (setupGL()) wake()
        }

        const handleMotionChange = () => {
            updatePointer()
            wake()
        }
        reducedMotion.addEventListener("change", handleMotionChange)

        canvas.addEventListener("webglcontextlost", handleContextLost)
        canvas.addEventListener("webglcontextrestored", handleContextRestored)

        wake()

        return () => {
            cancelAnimationFrame(rafId)
            rafId = 0
            contextLost = true
            wakeRef.current = () => {}
            uploadRef.current = () => {}
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerdown", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerEnd)
            window.removeEventListener("pointercancel", handlePointerEnd)
            window.removeEventListener("blur", handlePointerExit)
            document.documentElement.removeEventListener(
                "pointerleave",
                handlePointerExit
            )
            window.removeEventListener("scroll", handleScroll, {
                capture: true,
            })
            reducedMotion.removeEventListener("change", handleMotionChange)
            canvas.removeEventListener("webglcontextlost", handleContextLost)
            canvas.removeEventListener(
                "webglcontextrestored",
                handleContextRestored
            )
            if (!gl.isContextLost()) {
                gl.deleteTexture(texture)
                gl.deleteBuffer(quadBuffer)
                gl.deleteProgram(program)
            }
        }
    }, [])

    // Load user image into the WebGL texture whenever `imageUrl` changes
    useEffect(() => {
        if (!imageUrl) return
        let cancelled = false
        let fellBack = false
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (cancelled) return
            loadedImageRef.current = img
            uploadRef.current(img)
            setHasImage(true)
        }
        img.onerror = () => {
            if (cancelled) return
            console.warn(`FlutedPrismHoverImage: could not load image ${imageUrl}`)
            // Show a labelled fallback instead of leaving the canvas blank
            if (fellBack) return
            fellBack = true
            img.src = ERROR_IMAGE
        }
        img.src = imageUrl

        return () => {
            cancelled = true
        }
    }, [imageUrl])

    return (
        <div
            ref={containerRef}
            role={imageAlt ? "img" : undefined}
            aria-label={imageAlt}
            aria-hidden={imageAlt ? undefined : true}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 160,
                minHeight: 160,
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                userSelect: "none",
                WebkitUserSelect: "none",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    opacity: hasImage ? 1 : 0,
                    transition: "opacity 0.4s ease",
                }}
            />
        </div>
    )
}

addPropertyControls(FlutedPrismHoverImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    hoverMode: {
        type: ControlType.Enum,
        title: "Hover Mode",
        options: ["spotlight", "band", "full", "always"],
        optionTitles: [
            "Cursor Spotlight",
            "Vertical Band",
            "Full Image Hover",
            "Always Active",
        ],
        defaultValue: "spotlight",
    },
    idlePosition: {
        type: ControlType.Enum,
        title: "Idle Position",
        options: [
            "none",
            "center",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "custom",
        ],
        optionTitles: [
            "None (Off)",
            "Center",
            "Top-Left",
            "Top-Right",
            "Bottom-Left",
            "Bottom-Right",
            "Custom X / Y",
        ],
        defaultValue: "center",
    },
    idleX: {
        type: ControlType.Number,
        title: "Idle X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.idlePosition !== "custom",
    },
    idleY: {
        type: ControlType.Number,
        title: "Idle Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.idlePosition !== "custom",
    },
    columns: {
        type: ControlType.Number,
        title: "Slices",
        defaultValue: 86,
        min: 8,
        max: 140,
        step: 1,
    },
    sliceProfile: {
        type: ControlType.Enum,
        title: "Slice Shape",
        options: ["sawtooth", "prism", "cylinder"],
        optionTitles: ["Sawtooth Fin", "Angled Prism", "Fluted Cylinder"],
        defaultValue: "prism",
    },
    refractionX: {
        type: ControlType.Number,
        title: "Echo Spread X",
        defaultValue: 0,
        min: 0.0,
        max: 0.25,
        step: 0.005,
    },
    shearY: {
        type: ControlType.Number,
        title: "Sawtooth Shear Y",
        defaultValue: 0,
        min: -0.35,
        max: 0.35,
        step: 0.005,
    },
    direction: {
        type: ControlType.Enum,
        title: "Tilt Direction",
        options: ["left", "right", "mouse"],
        optionTitles: ["Left", "Right", "Follow Mouse"],
        defaultValue: "mouse",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Louver Shadow",
        defaultValue: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.05,
    },
    shadowColorSource: {
        type: ControlType.Enum,
        title: "Shadow Source",
        options: ["image", "sample", "custom"],
        optionTitles: ["From Image (Auto)", "Pick Image Point", "Custom Color"],
        defaultValue: "image",
    },
    shadowPickX: {
        type: ControlType.Number,
        title: "Sample X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.shadowColorSource !== "sample",
    },
    shadowPickY: {
        type: ControlType.Number,
        title: "Sample Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props) => props.shadowColorSource !== "sample",
    },
    shadowDarken: {
        type: ControlType.Number,
        title: "Shadow Darkness",
        defaultValue: 0.65,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        hidden: (props) => props.shadowColorSource === "custom",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        hidden: (props) => props.shadowColorSource !== "custom",
    },
    lineIntensity: {
        type: ControlType.Number,
        title: "Louver Line",
        defaultValue: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.05,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.35,
        step: 0.01,
        hidden: (props) => (props.lineIntensity ?? 0) <= 0,
    },
    lineColorSource: {
        type: ControlType.Enum,
        title: "Line Color Mode",
        options: ["shadow", "image", "custom"],
        optionTitles: ["Match Shadow", "From Image", "Custom Color"],
        defaultValue: "shadow",
        hidden: (props) => (props.lineIntensity ?? 0) <= 0,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#000000",
        hidden: (props) =>
            (props.lineIntensity ?? 0) <= 0 || props.lineColorSource !== "custom",
    },
    highlightIntensity: {
        type: ControlType.Number,
        title: "Edge Highlight",
        defaultValue: 0.05,
        min: 0.0,
        max: 1.0,
        step: 0.05,
    },
    baseRibs: {
        type: ControlType.Number,
        title: "Idle Rib Lines",
        defaultValue: 0,
        min: 0.0,
        max: 1.0,
        step: 0.02,
    },
    chromaticAberration: {
        type: ControlType.Number,
        title: "Chromatic Split",
        defaultValue: 1,
        min: 0.0,
        max: 3.0,
        step: 0.05,
    },
    maskRadius: {
        type: ControlType.Number,
        title: "Mask Radius",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.2,
        step: 0.02,
    },
    maskSoftness: {
        type: ControlType.Number,
        title: "Mask Softness",
        defaultValue: 0.95,
        min: 0.05,
        max: 1,
        step: 0.05,
        // Full Image Hover and Always Active use a fixed softness
        hidden: (props) =>
            props.hoverMode === "full" || props.hoverMode === "always",
    },
    mouseInfluence: {
        type: ControlType.Number,
        title: "Motion Ripple",
        defaultValue: 1.5,
        min: 0.0,
        max: 1.5,
        step: 0.05,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Cursor Follow",
        defaultValue: 0.02,
        min: 0.02,
        max: 0.35,
        step: 0.01,
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Fade Speed",
        defaultValue: 0.13,
        min: 0.01,
        max: 0.25,
        step: 0.01,
    },
    zoomOnHover: {
        type: ControlType.Number,
        title: "Hover Zoom",
        defaultValue: 0.05,
        min: 0.0,
        max: 0.2,
        step: 0.01,
    },
    sliceAngle: {
        type: ControlType.Number,
        title: "Slice Angle",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    scrollReveal: {
        type: ControlType.Boolean,
        title: "Scroll Reveal",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollStrength: {
        type: ControlType.Number,
        title: "Scroll Strength",
        defaultValue: 0.5,
        min: 0.1,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.scrollReveal,
    },
    touchSpotlight: {
        type: ControlType.Boolean,
        title: "Touch Spotlight",
        description: "On touch devices the spotlight follows the scroll.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    touchStrength: {
        type: ControlType.Number,
        title: "Touch Strength",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.touchSpotlight,
    },
    canvasPreview: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
