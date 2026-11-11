import { useEffect, useMemo, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DiskImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface GlassEdgeDisksProps {
    circleImages?: DiskImage[]
    diskSize?: number
    circleSpacing?: number
    glassWidth?: number
    borderThickness?: number
    visualGain?: number
    warpIntensity?: number
    lensIor?: number
    lensDepth?: number
    lensDispersion?: number
    lensRoughness?: number
    blurReach?: number
    distortionThickness?: number
    refraction?: number
    chromaticOffset?: number
    glassOpacity?: number
    ior?: number
    opticalThickness?: number
    roughness?: number
    thinFilmStrength?: number
    thinFilmThickness?: number
    thinFilmIor?: number
    reflectionStrength?: number
    edgeLight?: number
    speed?: number
    orbitSpeed?: number
    distortCircleEdges?: boolean
    circleEdgeDistortion?: number
    style?: CSSProperties
}

const defaultImages: DiskImage[] = [
    {
        src: "https://framerusercontent.com/images/G2R6dVLZZZmh9j4LuSsx7CTEGs.webp",
        alt: "Orange Common Ground tag with a black cord on an off-white surface",
    },
    {
        src: "https://framerusercontent.com/images/WPIANR19c5fA5jHyWB6Haxi5Y.webp",
        alt: "Pink cylindrical container with scattered pink capsules on a pink surface",
    },
    {
        src: "https://framerusercontent.com/images/XPdW3mUPTipvlDKvwIDt9KFJrbg.webp",
        alt: "Smiling man in a red sweater with folded arms against a light gray background",
    },
    {
        src: "https://framerusercontent.com/images/XckZxUJKn39YQVdUQWeIsf1fCMM.webp",
        alt: "Colorful 3D scene of a person in a pink cap surrounded by design tools and shapes",
    },
    {
        src: "https://framerusercontent.com/images/LNFa2lTMscEERzsBqkl5pxxUTUM.webp",
        alt: "White-to-blue gradient bottle with a gold cap on a pale gray surface",
    },
    {
        src: "https://framerusercontent.com/images/U1e4RHXCr3Y38Linx84pGUro7E.webp",
        alt: "Close-up of a woman holding a pink skincare jar beside her face",
    },
]

const vertexShaderSource = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const fragmentShaderSource = `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform vec2 uDiskCenters[6];
uniform float uDiskOpacities[6];
uniform float uIntroStack;
uniform float uDiameter;
uniform float uRayDepth;
uniform vec4 uBlurSamples[13];
uniform float uTime;
uniform float uDiskSize;
uniform float uCircleSpacing;
uniform float uGlassWidth;
uniform float uBorderThickness;
uniform float uVisualGain;
uniform float uWarpIntensity;
uniform float uLensDispersion;
uniform float uBlurRadius;
uniform float uDistortionThickness;
uniform float uRefraction;
uniform float uChromaticOffset;
uniform float uGlassOpacity;
uniform float uIor;
uniform float uOpticalThickness;
uniform float uRoughness;
uniform float uThinFilmStrength;
uniform float uThinFilmThickness;
uniform float uThinFilmIor;
uniform float uReflectionStrength;
uniform float uEdgeLight;
uniform float uSpeed;
uniform float uOrbitSpeed;
uniform float uDistortCircleEdges;
uniform float uCircleEdgeDistortion;

uniform sampler2D uImage0;
uniform sampler2D uImage1;
uniform sampler2D uImage2;
uniform sampler2D uImage3;
uniform sampler2D uImage4;
uniform sampler2D uImage5;

uniform float uAspect0;
uniform float uAspect1;
uniform float uAspect2;
uniform float uAspect3;
uniform float uAspect4;
uniform float uAspect5;

float effectiveGlassWidth() {
    // Border Thickness controls only the strip attached to the physical edge.
    // Sampling depth and refraction strength are separate, so thickening the
    // border never pushes the whole effect away from the canvas boundary.
    return max(1.0, uBorderThickness);
}

float edgeDistance(vec2 pixel) {
    return min(min(pixel.x, uResolution.x - pixel.x), min(pixel.y, uResolution.y - pixel.y));
}

float edgeBand(vec2 pixel) {
    float normalizedDistance = clamp(
        edgeDistance(pixel) / effectiveGlassWidth(),
        0.0,
        1.0
    );
    // Quintic easing reaches zero with a flat slope, so the distortion fades
    // into the untouched image without drawing a visible inner boundary.
    float smoothDistance = normalizedDistance * normalizedDistance *
        normalizedDistance *
        (normalizedDistance * (normalizedDistance * 6.0 - 15.0) + 10.0);
    return 1.0 - smoothDistance;
}

vec2 edgeNormal(vec2 pixel) {
    float reach = effectiveGlassWidth();
    float leftBand = 1.0 - smoothstep(0.0, reach, pixel.x);
    float rightBand = 1.0 - smoothstep(0.0, reach, uResolution.x - pixel.x);
    float bottomBand = 1.0 - smoothstep(0.0, reach, pixel.y);
    float topBand = 1.0 - smoothstep(0.0, reach, uResolution.y - pixel.y);
    vec2 normal = vec2(leftBand - rightBand, bottomBand - topBand);
    float magnitude = max(length(normal), 0.0001);
    return normal / magnitude;
}

// Fluid Glass reference: React Bits uses Drei's MeshTransmissionMaterial.
// This native WebGL adaptation uses its volume-ray principle (Snell refraction,
// thickness travel and wavelength-specific IOR), applied to a curved border.
// No third-party renderer or model is needed for this analytic border surface.
vec3 glassNormal(vec2 pixel, float band, vec2 inward) {
    vec2 tangent = vec2(-inward.y, inward.x);
    float along = dot(pixel, tangent);
    float surface = 0.985 + 0.006 * sin(along * 0.0047) +
        0.003 * sin(along * 0.0091 + 1.3);
    float curvedSlope = surface * pow(clamp(band, 0.0, 1.0), 0.80);
    return vec3(-inward * curvedSlope, sqrt(max(0.0001, 1.0 - curvedSlope * curvedSlope)));
}

vec2 volumeRefractionOffset(vec3 normal, float depth, float materialIor, float sampleFraction) {
    vec3 ray = normalize(refract(vec3(0.0, 0.0, -1.0), normal, 1.0 / max(1.001, materialIor)));
    float sampleThickness = depth * (1.0 + uRoughness * (sampleFraction - 0.5) * 0.16);
    return ray.xy * sampleThickness;
}

float thinFilmReflectance(
    float wavelengthNm,
    float cosTheta0,
    float substrateIor,
    float filmThicknessNm
) {
    float n0 = 1.0;
    float n1 = max(1.001, uThinFilmIor);
    float n2 = max(1.001, substrateIor);
    float sinTheta0Sq = max(0.0, 1.0 - cosTheta0 * cosTheta0);
    float sinTheta1Sq = clamp(
        (n0 * n0) * sinTheta0Sq / (n1 * n1),
        0.0,
        0.9999
    );
    float cosTheta1 = sqrt(1.0 - sinTheta1Sq);
    float r01 = (n0 - n1) / (n0 + n1);
    float r12 = (n1 - n2) / (n1 + n2);
    float phase = 12.566370614359172 * n1 * filmThicknessNm *
        cosTheta1 / max(wavelengthNm, 1.0);
    float interference = 2.0 * r01 * r12 * cos(phase);
    float numerator = r01 * r01 + r12 * r12 + interference;
    float denominator = 1.0 + (r01 * r12) * (r01 * r12) + interference;
    return clamp(numerator / max(denominator, 0.0001), 0.0, 1.0);
}

vec3 thinFilmFresnel(float cosTheta0) {
    return vec3(
        thinFilmReflectance(650.0, cosTheta0, uIor, uThinFilmThickness),
        thinFilmReflectance(510.0, cosTheta0, uIor, uThinFilmThickness),
        thinFilmReflectance(475.0, cosTheta0, uIor, uThinFilmThickness)
    );
}

vec3 studioEnvironment(vec3 direction, vec2 pixel) {
    vec3 ray = normalize(direction);
    float keyStrip = pow(max(dot(ray, normalize(vec3(-0.46, 0.72, 0.52))), 0.0), 18.0);
    float rimStrip = pow(max(dot(ray, normalize(vec3(0.82, -0.18, 0.54))), 0.0), 34.0);
    float darkCard = smoothstep(0.16, 0.82, abs(ray.x)) *
        smoothstep(-0.42, 0.34, ray.y);
    float softRoom = 0.72 + 0.18 * ray.y + 0.04 * sin(pixel.y * 0.006);
    vec3 environment = vec3(softRoom);
    environment -= vec3(0.38) * darkCard;
    environment += vec3(1.0, 0.985, 0.96) * keyStrip * 1.15;
    environment += vec3(0.88, 0.95, 1.0) * rimStrip * 0.88;
    return max(environment, vec3(0.0));
}

vec2 coverUv(vec2 uv, float imageAspect) {
    if (imageAspect > 1.0) {
        uv.x = (uv.x - 0.5) / imageAspect + 0.5;
    } else {
        uv.y = (uv.y - 0.5) * imageAspect + 0.5;
    }
    return uv;
}

// Capture gradients before any per-pixel occlusion early-out. Otherwise implicit
// mip levels inside a diverging branch can shimmer at overlapping image edges.
vec2 diskPixelDx;
vec2 diskPixelDy;
vec4 samplePhoto(sampler2D image, vec2 uv, float diameter, float imageAspect) {
#ifdef STABLE_DISK_OCCLUSION
    if (uIntroStack > 0.5) {
        vec2 scale = imageAspect > 1.0
            ? vec2(1.0 / imageAspect, 1.0)
            : vec2(1.0, imageAspect);
        return texture2DGradEXT(image, uv,
            diskPixelDx * scale / diameter, diskPixelDy * scale / diameter);
    }
#endif
    return texture2D(image, uv);
}

float circleMask(vec2 delta, float radius, float seed) {
    // One framebuffer-pixel coverage transition, not a stroke or backing.
    // Each refracted RGB sample receives this same premultiplied image mask.
    // Keep the ordinary-circle path squared: no per-sample sqrt or atan.
    if (uDistortCircleEdges < 0.5) {
        float innerRadius = max(0.0, radius - 0.5);
        float outerRadius = radius + 0.5;
        return 1.0 - smoothstep(innerRadius * innerRadius,
            outerRadius * outerRadius, dot(delta, delta));
    }
    float edgeNoise = 0.0;
    if (uDistortCircleEdges > 0.5) {
        float angle = atan(delta.y, delta.x);
        float phase = uTime * uSpeed * 4.1;
        edgeNoise = (
            sin(angle * 7.0 + phase + seed) * 0.58 +
            sin(angle * 13.0 - phase * 1.31 + seed * 2.7) * 0.29 +
            cos(angle * 19.0 + phase * 0.71 + seed * 1.3) * 0.13
        ) * uCircleEdgeDistortion;
    }

    float signedDistance = length(delta) - (radius + edgeNoise);
    return 1.0 - smoothstep(-0.5, 0.5, signedDistance);
}

vec4 sampleDisk0(vec2 pixel, float diameter) {
    if (uDiskOpacities[0] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[0];
    float mask = circleMask(delta, diameter * 0.5, 0.3) * uDiskOpacities[0];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect0);
    vec4 texel = samplePhoto(uImage0, uv, diameter, uAspect0);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 sampleDisk1(vec2 pixel, float diameter) {
    if (uDiskOpacities[1] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[1];
    float mask = circleMask(delta, diameter * 0.5, 1.1) * uDiskOpacities[1];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect1);
    vec4 texel = samplePhoto(uImage1, uv, diameter, uAspect1);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 sampleDisk2(vec2 pixel, float diameter) {
    if (uDiskOpacities[2] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[2];
    float mask = circleMask(delta, diameter * 0.5, 2.2) * uDiskOpacities[2];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect2);
    vec4 texel = samplePhoto(uImage2, uv, diameter, uAspect2);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 sampleDisk3(vec2 pixel, float diameter) {
    if (uDiskOpacities[3] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[3];
    float mask = circleMask(delta, diameter * 0.5, 3.4) * uDiskOpacities[3];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect3);
    vec4 texel = samplePhoto(uImage3, uv, diameter, uAspect3);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 sampleDisk4(vec2 pixel, float diameter) {
    if (uDiskOpacities[4] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[4];
    float mask = circleMask(delta, diameter * 0.5, 4.5) * uDiskOpacities[4];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect4);
    vec4 texel = samplePhoto(uImage4, uv, diameter, uAspect4);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 sampleDisk5(vec2 pixel, float diameter) {
    if (uDiskOpacities[5] <= 0.0) return vec4(0.0);
    vec2 delta = pixel - uDiskCenters[5];
    float mask = circleMask(delta, diameter * 0.5, 5.8) * uDiskOpacities[5];
    if (mask == 0.0) return vec4(0.0);
    vec2 uv = coverUv(delta / diameter + 0.5, uAspect5);
    vec4 texel = samplePhoto(uImage5, uv, diameter, uAspect5);
    return vec4(texel.rgb * texel.a, texel.a) * mask;
}

vec4 renderDisks(vec2 pixel) {
    float diameter = uDiameter;
    if (uIntroStack > 0.5) {
#ifdef STABLE_DISK_OCCLUSION
        diskPixelDx = dFdx(pixel);
        diskPixelDy = dFdy(pixel);
        // Same 6 -> 1 stacking order, evaluated front-to-back. Stop only when
        // coverage is exactly opaque; fades, source alpha and AA edges survive.
        vec4 stack = sampleDisk0(pixel, diameter);
        if (stack.a >= 1.0) return stack;
        vec4 behind = sampleDisk1(pixel, diameter);
        stack += behind * (1.0 - stack.a);
        if (stack.a >= 1.0) return stack;
        behind = sampleDisk2(pixel, diameter);
        stack += behind * (1.0 - stack.a);
        if (stack.a >= 1.0) return stack;
        behind = sampleDisk3(pixel, diameter);
        stack += behind * (1.0 - stack.a);
        if (stack.a >= 1.0) return stack;
        behind = sampleDisk4(pixel, diameter);
        stack += behind * (1.0 - stack.a);
        if (stack.a >= 1.0) return stack;
        behind = sampleDisk5(pixel, diameter);
        return stack + behind * (1.0 - stack.a);
#else
        // Premultiplied source-over: each newly revealed image covers
        // the previous one, in property-list order 6 -> 1.
        vec4 stack = sampleDisk5(pixel, diameter);
        vec4 front = sampleDisk4(pixel, diameter);
        stack = front + stack * (1.0 - front.a);
        front = sampleDisk3(pixel, diameter);
        stack = front + stack * (1.0 - front.a);
        front = sampleDisk2(pixel, diameter);
        stack = front + stack * (1.0 - front.a);
        front = sampleDisk1(pixel, diameter);
        stack = front + stack * (1.0 - front.a);
        front = sampleDisk0(pixel, diameter);
        return front + stack * (1.0 - front.a);
#endif
    }
    vec4 result = sampleDisk0(pixel, diameter);
    vec4 candidate = sampleDisk1(pixel, diameter);
    if (candidate.a > result.a) result = candidate;
    candidate = sampleDisk2(pixel, diameter);
    if (candidate.a > result.a) result = candidate;
    candidate = sampleDisk3(pixel, diameter);
    if (candidate.a > result.a) result = candidate;
    candidate = sampleDisk4(pixel, diameter);
    if (candidate.a > result.a) result = candidate;
    candidate = sampleDisk5(pixel, diameter);
    if (candidate.a > result.a) result = candidate;
    return result;
}

void main() {
    vec2 pixel = vUv * uResolution;
    float band = edgeBand(pixel);
    if (band <= 0.00001) {
        vec4 scene = renderDisks(pixel);
        gl_FragColor = vec4(scene.a > 0.00001 ? scene.rgb / scene.a : vec3(0.0), scene.a);
        return;
    }

    vec2 inward = edgeNormal(pixel);
    vec2 tangent = vec2(-inward.y, inward.x);
    vec3 normal = glassNormal(pixel, band, inward);
    float along = dot(pixel, tangent);
    float depth = uRayDepth * mix(0.96, 1.04, band) *
        (1.0 + 0.025 * sin(along * 0.0043 + 0.9) * band);
    float steepness = pow(clamp(1.0 - normal.z, 0.0, 1.0), 1.15);
    float aberration = max(0.0, uLensDispersion) * (0.12 + 0.88 * steepness);
    float blurRadius = uBlurRadius * pow(band, 0.85);
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;
    float accumulatedWeight = 0.0;

    // Fixed golden-angle disk samples supply two-dimensional glass blur.
    // Gaussian weights avoid the old five-tap directional smears and remain
    // identical from frame to frame, so the moving photos do not acquire noise.
    // With no blur or dispersion, every integration sample is identical.
    // Otherwise retain all 13 samples and the exact spectral spread.
    bool singleSample = uBlurRadius == 0.0 && uLensDispersion == 0.0;
    // No blur also means zero thickness jitter. The green ray is identical
    // across all spectral samples, even while red/blue dispersion is enabled.
    bool reuseGreen = uBlurRadius == 0.0 && uRoughness == 0.0 && uLensDispersion > 0.0;
    vec4 cachedGreen = vec4(0.0);
    if (reuseGreen) {
        cachedGreen = renderDisks(pixel + volumeRefractionOffset(normal, depth, uIor, 0.5));
    }
    for (int sampleIndex = 0; sampleIndex < 13; sampleIndex++) {
        if (singleSample && sampleIndex > 0) break;
        vec4 kernel = uBlurSamples[sampleIndex];
        float progress = kernel.w;
        vec2 blurOffset = (tangent * kernel.x + inward * kernel.y) * blurRadius;
        float weight = kernel.z;
        float spectralSpread = aberration * (0.75 + progress * 0.25);
        float redIor = max(1.001, uIor * (1.0 - spectralSpread * 0.5));
        float blueIor = uIor * (1.0 + spectralSpread * 0.5);
        vec4 green = cachedGreen;
        if (!reuseGreen) {
            green = renderDisks(pixel + volumeRefractionOffset(normal, depth, uIor, progress) + blurOffset);
        }
        vec4 red = green;
        vec4 blue = green;
        if (uLensDispersion > 0.0) {
            red = renderDisks(pixel + volumeRefractionOffset(normal, depth, redIor, progress) + blurOffset);
            blue = renderDisks(pixel + volumeRefractionOffset(normal, depth, blueIor, progress) + blurOffset);
        }
        accumulatedColor += vec3(red.r, green.g, blue.b) * weight;
        accumulatedAlpha += max(red.a, max(green.a, blue.a)) * weight;
        accumulatedWeight += weight;
    }

    vec3 premultiplied = accumulatedColor / accumulatedWeight;
    float alpha = accumulatedAlpha / accumulatedWeight;
    // Reflections and highlights never create their own opaque backing.
    // Exactly transparent samples therefore need no lighting calculations.
    if (alpha == 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }
    vec3 transmitted = alpha > 0.00001 ? premultiplied / alpha : vec3(0.0);
    float f0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - normal.z, 5.0);
    vec3 reflectedDirection = reflect(vec3(0.0, 0.0, -1.0), normal);
    vec3 environment = studioEnvironment(reflectedDirection, pixel);
    // Reflection trades energy with transmission and softens with roughness.
    // It follows the curved surface rather than a painted white border.
    environment = mix(environment, vec3(0.76), clamp(uRoughness * 0.5, 0.0, 0.5));
    float reflection = clamp(uReflectionStrength * min(uGlassOpacity, 2.0) * fresnel * band, 0.0, 0.35);
    vec3 color = mix(transmitted, environment, reflection);
    color += environment * uEdgeLight * fresnel * band * 0.025;
    // Preserve premultiplied scene coverage: no backing plate or opaque outline.
    gl_FragColor = vec4(color, alpha);

}
`

interface DrawRegion {
    x: number
    y: number
    width: number
    height: number
}

// Filter the already-refracted image, with no extra optical-depth jitter.
// Adjacent Gaussian taps are paired using linear texture filtering.
const gaussianShaderSource = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSource;
uniform vec2 uStep;
uniform vec2 uPrefilterStep;
vec4 filtered(vec2 uv) {
    if (uPrefilterStep.y == 0.0) return texture2D(uSource, uv);
    // Filter the axis being decimated before the vertical pass. A fixed
    // symmetric footprint avoids phase-dependent row shimmer in motion.
    return (texture2D(uSource, uv + uPrefilterStep) +
            texture2D(uSource, uv - uPrefilterStep)) * 0.5;
}
void main() {
    vec4 color = filtered(vUv) * 0.2270270270;
    color += filtered(vUv + uStep * 1.3846153846) * 0.3162162162;
    color += filtered(vUv - uStep * 1.3846153846) * 0.3162162162;
    color += filtered(vUv + uStep * 3.2307692308) * 0.0702702703;
    color += filtered(vUv - uStep * 3.2307692308) * 0.0702702703;
    gl_FragColor = color;
}
`

const progressiveShaderSource = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uBlur;
uniform float uReach;
uniform float uSigmas[8];
uniform sampler2D uLevel0;
uniform sampler2D uLevel1;
uniform sampler2D uLevel2;
uniform sampler2D uLevel3;
uniform sampler2D uLevel4;
uniform sampler2D uLevel5;
uniform sampler2D uLevel6;
uniform sampler2D uLevel7;
// Fixed 4x4 Gaussian quadrature. Both adjacent levels are filtered to
// the same requested variance before blending: no sharp-over-soft halo.
vec4 gaussianRow(sampler2D image, vec2 uv, float dx) {
    return (texture2D(image,uv+vec2(0.7419637843*dx,0.0)) +
            texture2D(image,uv-vec2(0.7419637843*dx,0.0))) * 0.4541241452 +
           (texture2D(image,uv+vec2(2.3344142183*dx,0.0)) +
            texture2D(image,uv-vec2(2.3344142183*dx,0.0))) * 0.0458758548;
}
vec4 gaussianAt(sampler2D image, float baseSigma, float sigma) {
    float residual = sqrt(max(0.0, sigma * sigma - baseSigma * baseSigma));
    if (residual < 0.025) return texture2D(image,vUv);
    vec2 d = vec2(residual) / uResolution;
    return (gaussianRow(image,vUv+vec2(0.0,0.7419637843*d.y),d.x) +
            gaussianRow(image,vUv-vec2(0.0,0.7419637843*d.y),d.x)) * 0.4541241452 +
           (gaussianRow(image,vUv+vec2(0.0,2.3344142183*d.y),d.x) +
            gaussianRow(image,vUv-vec2(0.0,2.3344142183*d.y),d.x)) * 0.0458758548;
}
vec4 transition(sampler2D loImage, sampler2D hiImage, float lo, float hi, float sigma) {
    // The high level is introduced only once it is no blurrier than the
    // requested result. Both branches retain the requested Gaussian width.
    float t = smoothstep(hi, hi * 1.5, sigma);
    if (t >= 1.0) return gaussianAt(hiImage,hi,sigma);
    if (t <= 0.0) return gaussianAt(loImage,lo,sigma);
    return mix(gaussianAt(loImage,lo,sigma), gaussianAt(hiImage,hi,sigma),t);
}
void main() {
    vec2 pixel = vUv * uResolution;
    float distanceToEdge = min(min(pixel.x,uResolution.x-pixel.x),min(pixel.y,uResolution.y-pixel.y));
    float t = clamp(1.0-distanceToEdge/max(uReach,1.0),0.0,1.0);
    // Gentle onset, then a broad progression rather than a narrow mid-band ramp.
    float gradual = t*t*(2.0-t);
    float sigma = uBlur*gradual;
    if (sigma <= 0.05) { gl_FragColor=texture2D(uLevel0,vUv); return; }
    vec4 color;
    if (sigma < uSigmas[1]) color=gaussianAt(uLevel0,0.0,sigma);
    else if (sigma < uSigmas[2]) color=transition(uLevel0,uLevel1,uSigmas[0],uSigmas[1],sigma);
    else if (sigma < uSigmas[3]) color=transition(uLevel1,uLevel2,uSigmas[1],uSigmas[2],sigma);
    else if (sigma < uSigmas[4]) color=transition(uLevel2,uLevel3,uSigmas[2],uSigmas[3],sigma);
    else if (sigma < uSigmas[5]) color=transition(uLevel3,uLevel4,uSigmas[3],uSigmas[4],sigma);
    else if (sigma < uSigmas[6]) color=transition(uLevel4,uLevel5,uSigmas[4],uSigmas[5],sigma);
    else if (sigma < uSigmas[7]) color=transition(uLevel5,uLevel6,uSigmas[5],uSigmas[6],sigma);
    else color=transition(uLevel6,uLevel7,uSigmas[6],uSigmas[7],sigma);
    gl_FragColor=color;
}

`

// Conservative support, including samples of circles outside the canvas.
// Returned rectangles form a disjoint union: no double alpha compositing.
function glassDrawRegions(
    centers: Float32Array,
    width: number,
    height: number,
    extent: number
): DrawRegion[] {
    const full = [{ x: 0, y: 0, width, height }]
    if (!Number.isFinite(extent) || extent < 0) return full
    const boxes: DrawRegion[] = []
    for (let index = 0; index < 6; index++) {
        const x = Math.max(0, Math.floor(centers[index * 2] - extent))
        const y = Math.max(0, Math.floor(centers[index * 2 + 1] - extent))
        const right = Math.min(width, Math.ceil(centers[index * 2] + extent))
        const top = Math.min(height, Math.ceil(centers[index * 2 + 1] + extent))
        if (right > x && top > y)
            boxes.push({ x, y, width: right - x, height: top - y })
    }
    const boundaries = [
        ...new Set(boxes.flatMap((box) => [box.y, box.y + box.height])),
    ].sort((a, b) => a - b)
    const result: DrawRegion[] = []
    let previous = new Map<string, DrawRegion>()
    for (let row = 0; row < boundaries.length - 1; row++) {
        const y = boundaries[row],
            top = boundaries[row + 1]
        const intervals = boxes
            .filter((box) => box.y < top && box.y + box.height > y)
            .map((box) => [box.x, box.x + box.width])
            .sort((a, b) => a[0] - b[0])
        const merged: number[][] = []
        for (const interval of intervals) {
            const last = merged[merged.length - 1]
            if (last && interval[0] <= last[1])
                last[1] = Math.max(last[1], interval[1])
            else merged.push([...interval])
        }
        const next = new Map<string, DrawRegion>()
        for (const [x, right] of merged) {
            const key = x + ":" + right
            const prior = previous.get(key)
            if (prior && prior.y + prior.height === y) {
                prior.height += top - y
                next.set(key, prior)
            } else {
                const region = { x, y, width: right - x, height: top - y }
                result.push(region)
                next.set(key, region)
            }
        }
        previous = next
    }
    const area = result.reduce(
        (sum, region) => sum + region.width * region.height,
        0
    )
    // Never add a swarm of draw calls to save only a small amount of shading.
    return result.length > 12 || area > width * height * 0.75 ? full : result
}

// Filter support is tracked in unchanged framebuffer texel coordinates. These
// bounds remove only known-zero fragments, never resize a texture or its UVs.
function glassUnionRegions(
    boxes: DrawRegion[],
    width: number,
    height: number
): DrawRegion[] {
    const full = [{ x: 0, y: 0, width, height }]
    const clipped: DrawRegion[] = []
    for (const box of boxes) {
        if (
            ![box.x, box.y, box.width, box.height].every(Number.isFinite)
        )
            return full
        const x = Math.max(0, Math.floor(box.x))
        const y = Math.max(0, Math.floor(box.y))
        const right = Math.min(width, Math.ceil(box.x + box.width))
        const top = Math.min(height, Math.ceil(box.y + box.height))
        if (right > x && top > y)
            clipped.push({ x, y, width: right - x, height: top - y })
    }
    const boundaries = [
        ...new Set(clipped.flatMap((box) => [box.y, box.y + box.height])),
    ].sort((a, b) => a - b)
    const result: DrawRegion[] = []
    let previous = new Map<string, DrawRegion>()
    for (let row = 0; row < boundaries.length - 1; row++) {
        const y = boundaries[row], top = boundaries[row + 1]
        const intervals = clipped
            .filter((box) => box.y < top && box.y + box.height > y)
            .map((box) => [box.x, box.x + box.width])
            .sort((a, b) => a[0] - b[0])
        const merged: number[][] = []
        for (const interval of intervals) {
            const last = merged[merged.length - 1]
            if (last && interval[0] <= last[1])
                last[1] = Math.max(last[1], interval[1])
            else merged.push([...interval])
        }
        const next = new Map<string, DrawRegion>()
        for (const [x, right] of merged) {
            const key = x + ":" + right
            const prior = previous.get(key)
            if (prior && prior.y + prior.height === y) {
                prior.height += top - y
                next.set(key, prior)
            } else {
                const region = { x, y, width: right - x, height: top - y }
                result.push(region)
                next.set(key, region)
            }
        }
        previous = next
    }
    const area = result.reduce(
        (sum, region) => sum + region.width * region.height, 0
    )
    return result.length > 12 || area > width * height * 0.75 ? full : result
}

function glassEdgeRegions(
    width: number,
    height: number,
    reach: number
): DrawRegion[] {
    const edge = Math.ceil(Math.max(1, reach)) + 2
    return [
        { x: 0, y: 0, width: edge, height },
        { x: width - edge, y: 0, width: edge, height },
        { x: 0, y: 0, width, height: edge },
        { x: 0, y: height - edge, width, height: edge },
    ]
}

function glassIntersectRegions(
    regions: DrawRegion[],
    clips: DrawRegion[],
    width: number,
    height: number
): DrawRegion[] {
    const boxes: DrawRegion[] = []
    for (const region of regions) {
        for (const clip of clips) {
            const x = Math.max(region.x, clip.x)
            const y = Math.max(region.y, clip.y)
            const right = Math.min(region.x + region.width, clip.x + clip.width)
            const top = Math.min(region.y + region.height, clip.y + clip.height)
            if (right > x && top > y)
                boxes.push({ x, y, width: right - x, height: top - y })
        }
    }
    return glassUnionRegions(boxes, width, height)
}

function glassSceneSupport(
    centers: Float32Array,
    opacities: Float32Array,
    width: number,
    height: number,
    diameter: number,
    deformation: number,
    rayDepth: number,
    borderWidth: number
): DrawRegion[] {
    if (
        ![diameter, deformation, rayDepth, borderWidth,
            ...centers, ...opacities].every(Number.isFinite)
    )
        return [{ x: 0, y: 0, width, height }]
    // The mask extends half a texel beyond the disk. Extra guard texels cover
    // raster/float rounding. Only the physical glass strip can refract it.
    const radius = Math.max(0, diameter * 0.5) + Math.abs(deformation) + 2
    const warpedRadius = radius + Math.max(0, rayDepth) * 1.17 + 2
    const ordinary: DrawRegion[] = []
    const warped: DrawRegion[] = []
    for (let index = 0; index < 6; index++) {
        if (opacities[index] <= 0) continue
        const x = centers[index * 2], y = centers[index * 2 + 1]
        ordinary.push({
            x: x - radius, y: y - radius,
            width: radius * 2, height: radius * 2,
        })
        warped.push({
            x: x - warpedRadius, y: y - warpedRadius,
            width: warpedRadius * 2, height: warpedRadius * 2,
        })
    }
    return glassUnionRegions([
        ...ordinary,
        ...glassIntersectRegions(warped,
            glassEdgeRegions(width, height, borderWidth), width, height),
    ], width, height)
}

function glassFilterSupport(
    regions: DrawRegion[],
    inputWidth: number,
    inputHeight: number,
    outputWidth: number,
    outputHeight: number,
    uvMarginX: number,
    uvMarginY: number
): DrawRegion[] {
    return glassUnionRegions(regions.map((region) => {
        // Include a full input texel for linear filtering in each margin,
        // then propagate outward-rounded output cells (including odd sizes).
        const x = Math.floor((region.x / inputWidth - uvMarginX) * outputWidth) - 1
        const y = Math.floor((region.y / inputHeight - uvMarginY) * outputHeight) - 1
        const right = Math.ceil(((region.x + region.width) / inputWidth + uvMarginX) * outputWidth) + 1
        const top = Math.ceil(((region.y + region.height) / inputHeight + uvMarginY) * outputHeight) + 1
        return { x, y, width: right - x, height: top - y }
    }), outputWidth, outputHeight)
}

function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    // Queue all shader work first. Status queries here force serial compilation.
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
): WebGLProgram | null {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    if (!vertexShader || !fragmentShader) {
        if (vertexShader) gl.deleteShader(vertexShader)
        if (fragmentShader) gl.deleteShader(fragmentShader)
        return null
    }

    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        return null
    }
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.deleteShader(vertexShader)
    gl.deleteShader(fragmentShader)

    // Validate the whole batch only after non-blocking completion polling.
    return program
}

/**
 * Glass Edge Disks
 *
 * Six image-backed, front-facing disks and their animated glass perimeter,
 * rendered in one WebGL component with optional progressive blur passes. Circle-edge distortion is separately
 * configurable.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GlassEdgeDisks(props: GlassEdgeDisksProps) {
    const {
        circleImages = defaultImages,
        diskSize = 250,
        circleSpacing = 110,
        glassWidth = 425,
        borderThickness = 85,
        visualGain = 0.5,
        warpIntensity = 10,
        lensIor = 2.5,
        lensDepth = 1.6,
        lensDispersion = 1,
        lensRoughness = 25,
        blurReach = 60,
        distortionThickness = 12.9,
        refraction = 417,
        chromaticOffset = 17,
        glassOpacity = 0,
        ior = 4,
        opticalThickness = 0.06,
        roughness = 0.07,
        thinFilmStrength = 0,
        thinFilmThickness = 180,
        thinFilmIor = 26,
        reflectionStrength = 0.18,
        edgeLight = 0.12,
        speed = 0.86,
        orbitSpeed = 0.1,
        distortCircleEdges = false,
        circleEdgeDistortion = 3,
        style,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()

    const resolvedImages = useMemo(() => {
        return Array.from({ length: 6 }, (_, index) => {
            return circleImages[index]?.src
                ? circleImages[index]
                : defaultImages[index]
        })
    }, [circleImages])

    const imageDescriptions = resolvedImages
        .map((image) => image.alt?.trim())
        .filter(Boolean)
    const accessibleLabel = imageDescriptions.length
        ? `Image gallery: ${imageDescriptions.join("; ")}.`
        : undefined

    const imageKey = resolvedImages.map((image) => image.src ?? "").join("|")
    const imagesRef = useRef(resolvedImages)
    imagesRef.current = resolvedImages
    // Visual controls update uniforms; they never recreate textures or programs.
    const settingsRef = useRef({
        diskSize,
        circleSpacing,
        glassWidth,
        borderThickness,
        visualGain,
        warpIntensity,
        lensIor,
        lensDepth,
        lensDispersion,
        lensRoughness,
        blurReach,
        distortionThickness,
        refraction,
        chromaticOffset,
        glassOpacity,
        ior,
        opticalThickness,
        roughness,
        thinFilmStrength,
        thinFilmThickness,
        thinFilmIor,
        reflectionStrength,
        edgeLight,
        speed,
        orbitSpeed,
        distortCircleEdges,
        circleEdgeDistortion,
        isStatic,
    })
    settingsRef.current = {
        diskSize,
        circleSpacing,
        glassWidth,
        borderThickness,
        visualGain,
        warpIntensity,
        lensIor,
        lensDepth,
        lensDispersion,
        lensRoughness,
        blurReach,
        distortionThickness,
        refraction,
        chromaticOffset,
        glassOpacity,
        ior,
        opticalThickness,
        roughness,
        thinFilmStrength,
        thinFilmThickness,
        thinFilmIor,
        reflectionStrength,
        edgeLight,
        speed,
        orbitSpeed,
        distortCircleEdges,
        circleEdgeDistortion,
        isStatic,
    }
    const rendererRef = useRef<{
        refresh: () => void
        loadImages: (images: DiskImage[]) => void
    } | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
        })
        if (!gl) return

        let disposed = false
        let compileFrame = 0
        let rendererCleanup: (() => void) | null = null
        type ImagePreparation = {
            image?: HTMLImageElement
            error?: unknown
        }
        const imageRequests = new Map<string, Promise<ImagePreparation>>()
        const prepareImage = (source: string): Promise<ImagePreparation> => {
            const existing = imageRequests.get(source)
            if (existing) return existing
            const request = new Promise<ImagePreparation>((resolve) => {
                const image = new Image()
                image.crossOrigin = "anonymous"
                image.decoding = "async"
                image.onload = () => {
                    if (typeof image.decode !== "function") resolve({ image })
                }
                image.onerror = () => {
                    resolve({ error: new Error("Image could not be loaded") })
                }
                image.src = source
                if (typeof image.decode === "function") {
                    image.decode().then(
                        () => resolve({ image }),
                        (error: unknown) => resolve({ error })
                    )
                }
            })
            imageRequests.set(source, request)
            return request
        }
        // Fetch and explicitly decode the unchanged source assets while the
        // GPU compiles, instead of starting a second serial loading phase.
        imagesRef.current.forEach((image) => {
            if (image.src) void prepareImage(image.src)
        })
        const parallelCompile = gl.getExtension(
            "KHR_parallel_shader_compile"
        ) as {
            COMPLETION_STATUS_KHR: number
        } | null
        const stableOcclusion =
            !!gl.getExtension("OES_standard_derivatives") &&
            !!gl.getExtension("EXT_shader_texture_lod")
        const diskShader = stableOcclusion
            ? "#extension GL_OES_standard_derivatives : enable\n" +
              "#extension GL_EXT_shader_texture_lod : enable\n" +
              "#define STABLE_DISK_OCCLUSION\n" +
              fragmentShaderSource
            : fragmentShaderSource

        const program = createProgram(gl, vertexShaderSource, diskShader)
        const gaussianProgram = createProgram(
            gl,
            vertexShaderSource,
            gaussianShaderSource
        )
        const progressiveProgram = createProgram(
            gl,
            vertexShaderSource,
            progressiveShaderSource
        )
        if (!program || !gaussianProgram || !progressiveProgram) {
            if (program) gl.deleteProgram(program)
            if (gaussianProgram) gl.deleteProgram(gaussianProgram)
            if (progressiveProgram) gl.deleteProgram(progressiveProgram)
            return
        }

        const programs = [program, gaussianProgram, progressiveProgram]
        let programsReleased = false
        const releasePrograms = () => {
            if (programsReleased) return
            programsReleased = true
            programs.forEach((linked) => gl.deleteProgram(linked))
        }
        const initializeRenderer = () => {
            const buffer = gl.createBuffer()
            if (!buffer) {
                releasePrograms()
                return
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
                gl.STATIC_DRAW
            )

            gl.useProgram(program)
            const positionLocation = gl.getAttribLocation(program, "aPosition")
            gl.enableVertexAttribArray(positionLocation)
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            const positions = new Map([
                [program, positionLocation],
                [
                    gaussianProgram,
                    gl.getAttribLocation(gaussianProgram, "aPosition"),
                ],
                [
                    progressiveProgram,
                    gl.getAttribLocation(progressiveProgram, "aPosition"),
                ],
            ])
            const useQuad = (selected: WebGLProgram) => {
                gl.useProgram(selected)
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
                const position = positions.get(selected)!
                gl.enableVertexAttribArray(position)
                gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
            }
            const gaussianSource = gl.getUniformLocation(
                gaussianProgram,
                "uSource"
            )
            const gaussianStep = gl.getUniformLocation(gaussianProgram, "uStep")
            const gaussianPrefilterStep = gl.getUniformLocation(
                gaussianProgram,
                "uPrefilterStep"
            )
            const progressiveResolution = gl.getUniformLocation(
                progressiveProgram,
                "uResolution"
            )
            const progressiveBlur = gl.getUniformLocation(
                progressiveProgram,
                "uBlur"
            )
            const progressiveReach = gl.getUniformLocation(
                progressiveProgram,
                "uReach"
            )
            const progressiveSigmas = gl.getUniformLocation(
                progressiveProgram,
                "uSigmas[0]"
            )
            const progressiveLevels = Array.from({ length: 8 }, (_, index) =>
                gl.getUniformLocation(progressiveProgram, `uLevel${index}`)
            )
            interface BlurTarget {
                texture: WebGLTexture
                framebuffer: WebGLFramebuffer
                width: number
                height: number
            }
            let sceneTarget: BlurTarget | null = null
            let pendingBlurHorizontal: BlurTarget | null = null
            const pyramid: { horizontal: BlurTarget; vertical: BlurTarget }[] =
                []
            const sigmas = new Float32Array(8)
            let variance = 0
            for (let index = 1; index < 8; index++) {
                const scale = Math.pow(2, index - 1)
                variance += Math.pow(1.7 * scale, 2)
                if (index > 1) variance += 0.75 * Math.pow(scale * 0.5, 2)
                sigmas[index] = Math.sqrt(variance)
            }
            const deleteTarget = (target: BlurTarget) => {
                gl.deleteTexture(target.texture)
                gl.deleteFramebuffer(target.framebuffer)
            }
            const releaseBlur = () => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                if (sceneTarget) deleteTarget(sceneTarget)
                sceneTarget = null
                if (pendingBlurHorizontal) deleteTarget(pendingBlurHorizontal)
                pendingBlurHorizontal = null
                for (const level of pyramid) {
                    deleteTarget(level.horizontal)
                    deleteTarget(level.vertical)
                }
                pyramid.length = 0
            }
            const createTarget = (
                width: number,
                height: number
            ): BlurTarget | null => {
                const texture = gl.createTexture()
                const framebuffer = gl.createFramebuffer()
                if (!texture || !framebuffer) {
                    if (texture) gl.deleteTexture(texture)
                    if (framebuffer) gl.deleteFramebuffer(framebuffer)
                    return null
                }
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, texture)
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
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    texture,
                    0
                )
                if (
                    gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
                    gl.FRAMEBUFFER_COMPLETE
                ) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                    gl.deleteTexture(texture)
                    gl.deleteFramebuffer(framebuffer)
                    return null
                }
                return { texture, framebuffer, width, height }
            }
            const prepareBlurStep = (
                width: number,
                height: number,
                blur: number
            ): "ready" | "pending" | "failed" => {
                // The composite introduces level k only above sigmas[k].
                // Do not render the next, unused Gaussian pair. A small float
                // guard keeps threshold rounding conservative.
                let count = 0
                const maximum = Math.max(blur, Math.fround(blur)) + 0.0001
                while (count < 7 && sigmas[count + 1] < maximum) count++
                if (
                    sceneTarget?.width !== width ||
                    sceneTarget?.height !== height
                )
                    releaseBlur()
                if (!sceneTarget) {
                    sceneTarget = createTarget(width, height)
                    return sceneTarget ? "pending" : "failed"
                }
                while (pyramid.length > count) {
                    const level = pyramid.pop()!
                    deleteTarget(level.horizontal)
                    deleteTarget(level.vertical)
                }
                if (pyramid.length >= count) {
                    if (pendingBlurHorizontal)
                        deleteTarget(pendingBlurHorizontal)
                    pendingBlurHorizontal = null
                    return "ready"
                }
                // Each preparation step creates one unchanged target. Startup
                // batches have a short time budget; redraws finish synchronously.
                if (!pendingBlurHorizontal) {
                    const scale = Math.pow(2, pyramid.length)
                    const w = Math.max(1, Math.ceil(width / scale))
                    const h = Math.max(1, Math.ceil(height / scale))
                    pendingBlurHorizontal = createTarget(w, h)
                    if (!pendingBlurHorizontal) {
                        releaseBlur()
                        return "failed"
                    }
                    return "pending"
                }
                const horizontal = pendingBlurHorizontal
                const vertical = createTarget(
                    horizontal.width,
                    horizontal.height
                )
                if (!vertical) {
                    releaseBlur()
                    return "failed"
                }
                pendingBlurHorizontal = null
                pyramid.push({ horizontal, vertical })
                return pyramid.length === count ? "ready" : "pending"
            }
            const ensureBlur = (
                width: number,
                height: number,
                blur: number
            ): boolean => {
                let status = prepareBlurStep(width, height, blur)
                while (status === "pending")
                    status = prepareBlurStep(width, height, blur)
                return status === "ready"
            }
            const filterBlur = (
                width: number,
                height: number,
                blur: number,
                reach: number,
                sourceRegions: DrawRegion[]
            ) => {
                if (!sceneTarget) return
                // Plan complete sample footprints before deciding whether the
                // blurred edge could contain anything. Never skip from just
                // the circle-to-edge distance: convolution reaches farther.
                const plans: { horizontal: DrawRegion[]; vertical: DrawRegion[] }[] = []
                const finalBlurRegions: DrawRegion[] = []
                const edges = glassEdgeRegions(width, height, reach)
                const includeCompositeSupport = (
                    regions: DrawRegion[],
                    levelWidth: number,
                    levelHeight: number,
                    sigma: number
                ) => {
                    const residual = Math.sqrt(Math.max(0, blur * blur - sigma * sigma))
                    const support = glassFilterSupport(
                        regions, levelWidth, levelHeight, width, height,
                        2.3344142183 * residual / width + 1 / levelWidth,
                        2.3344142183 * residual / height + 1 / levelHeight
                    )
                    finalBlurRegions.push(...glassIntersectRegions(
                        support, edges, width, height
                    ))
                }
                let inputRegions = sourceRegions
                let inputWidth = width
                let inputHeight = height
                includeCompositeSupport(sourceRegions, width, height, 0)
                for (let index = 0; index < pyramid.length; index++) {
                    const level = pyramid[index]
                    const w = level.horizontal.width
                    const h = level.horizontal.height
                    const horizontal = glassFilterSupport(
                        inputRegions, inputWidth, inputHeight, w, h,
                        3.2307692308 / w + 1 / inputWidth,
                        ((inputHeight > h ? 0.75 : 0) + 1) / inputHeight
                    )
                    const vertical = glassFilterSupport(
                        horizontal, w, h, w, h,
                        1 / w, (3.2307692308 + 1) / h
                    )
                    plans.push({ horizontal, vertical })
                    includeCompositeSupport(vertical, w, h, sigmas[index + 1])
                    inputRegions = vertical
                    inputWidth = w
                    inputHeight = h
                }
                const blurredSupport = glassUnionRegions(finalBlurRegions, width, height)
                const needsBlur = blurredSupport.length > 0
                const compositeRegions = needsBlur
                    ? glassUnionRegions([...sourceRegions, ...blurredSupport], width, height)
                    : sourceRegions
                const drawRegions = (
                    regions: DrawRegion[], w: number, h: number
                ) => {
                    if (!regions.length) return
                    if (
                        regions.length === 1 && regions[0].x === 0 &&
                        regions[0].y === 0 && regions[0].width === w &&
                        regions[0].height === h
                    ) {
                        gl.disable(gl.SCISSOR_TEST)
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    } else {
                        gl.enable(gl.SCISSOR_TEST)
                        for (const region of regions) {
                            gl.scissor(region.x, region.y, region.width, region.height)
                            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                        }
                        gl.disable(gl.SCISSOR_TEST)
                    }
                }
                gl.disable(gl.SCISSOR_TEST)
                gl.disable(gl.BLEND)
                useQuad(gaussianProgram)
                gl.uniform1i(gaussianSource, 0)
                let input = sceneTarget.texture
                inputHeight = height
                for (let index = 0; needsBlur && index < pyramid.length; index++) {
                    const level = pyramid[index]
                    gl.bindFramebuffer(
                        gl.FRAMEBUFFER,
                        level.horizontal.framebuffer
                    )
                    gl.viewport(
                        0,
                        0,
                        level.horizontal.width,
                        level.horizontal.height
                    )
                    // Full clear avoids sampling stale pixels from the previous
                    // frame after a support region moves, shrinks or disappears.
                    gl.disable(gl.SCISSOR_TEST)
                    gl.clearColor(0, 0, 0, 0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, input)
                    gl.uniform2f(gaussianStep, 1 / level.horizontal.width, 0)
                    gl.uniform2f(
                        gaussianPrefilterStep,
                        0,
                        inputHeight > level.horizontal.height
                            ? 0.75 / inputHeight
                            : 0
                    )
                    drawRegions(plans[index].horizontal, level.horizontal.width, level.horizontal.height)
                    gl.bindFramebuffer(
                        gl.FRAMEBUFFER,
                        level.vertical.framebuffer
                    )
                    gl.disable(gl.SCISSOR_TEST)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.bindTexture(gl.TEXTURE_2D, level.horizontal.texture)
                    gl.uniform2f(gaussianStep, 0, 1 / level.vertical.height)
                    gl.uniform2f(gaussianPrefilterStep, 0, 0)
                    drawRegions(plans[index].vertical, level.vertical.width, level.vertical.height)
                    input = level.vertical.texture
                    inputHeight = level.vertical.height
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                gl.viewport(0, 0, width, height)
                gl.clearColor(0, 0, 0, 0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                useQuad(progressiveProgram)
                gl.uniform2f(progressiveResolution, width, height)
                // An exact no-contribution bypass still copies the same RGBA8
                // scene FBO with the same premultiplied composite path. Drawing
                // straight to the canvas would change quantization/AA coverage.
                gl.uniform1f(progressiveBlur, needsBlur ? blur : 0)
                gl.uniform1f(progressiveReach, reach)
                gl.uniform1fv(progressiveSigmas, sigmas)
                for (let index = 0; index < 8; index++) {
                    gl.activeTexture(gl.TEXTURE0 + index)
                    gl.bindTexture(
                        gl.TEXTURE_2D,
                        index === 0 || !needsBlur || !pyramid.length
                            ? sceneTarget.texture
                            : pyramid[Math.min(index, pyramid.length) - 1]
                                  .vertical.texture
                    )
                    gl.uniform1i(progressiveLevels[index], index)
                }
                gl.enable(gl.BLEND)
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
                drawRegions(compositeRegions, width, height)
            }

            const uniformLocations = new Map<
                string,
                WebGLUniformLocation | null
            >()
            const uniform = (name: string) => {
                if (!uniformLocations.has(name)) {
                    uniformLocations.set(
                        name,
                        gl.getUniformLocation(program, name)
                    )
                }
                return uniformLocations.get(name) ?? null
            }

            const textures: WebGLTexture[] = []
            const imageAspects = [1, 1, 1, 1, 1, 1]
            let animationFrame = 0
            let uploadFrame = 0
            let presentationFrame = 0
            let rendererWarmed = false
            const originalVisibility = canvas.style.visibility
            const frameInterval = 1000 / 60
            let nextDrawAt = 0
            let documentVisible = document.visibilityState !== "hidden"
            let inView = true
            const reducedMotion =
                window.matchMedia?.("(prefers-reduced-motion: reduce)")
                    .matches ?? false

            // Load once: reverse reveal at the center, unfurl in an overlapping spiral,
            // with rotation building speed and holding it briefly after the circle
            // is formed, then coasting down to the normal orbit.
            // This clock advances only while visible and after the textures settle.
            const revealStagger = 0.09
            const revealDuration = 0.16
            const revealEnd = 5 * revealStagger + revealDuration
            const moveDuration = 0.8
            const moveStagger = 0.085
            const introEnd = revealEnd + 5 * moveStagger + moveDuration
            const spiralDuration = introEnd - revealEnd
            const spiralSpeedMultiplier = 2
            const spiralAccelerationDuration = spiralDuration * 0.45
            const orbitSettleDelay = 0.35
            const orbitSettleStart = spiralDuration + orbitSettleDelay
            const orbitSettleDuration = 1.5
            let imagesReady = false
            const imagesSettled = [false, false, false, false, false, false]
            let animationSeconds = 0
            let lastAnimationAt: number | null = null
            const smoothProgress = (value: number) => {
                const t = Math.max(0, Math.min(1, value))
                return t * t * (3 - 2 * t)
            }
            const integratedProgress = (value: number) => {
                const t = Math.max(0, Math.min(1, value))
                return t * t * t * (1 - 0.5 * t)
            }

            const floatValues = new Map<string, number>()
            const setFloat = (name: string, value: number) => {
                if (floatValues.get(name) === value) return
                const location = uniform(name)
                if (location) gl.uniform1f(location, value)
                floatValues.set(name, value)
            }
            const centers = new Float32Array(12)
            const diskOpacities = new Float32Array(6)
            const blurSamples = new Float32Array(13 * 4)
            for (let index = 0; index < 13; index++) {
                const radial = index === 0 ? 0 : Math.sqrt(index / 12)
                const angle = index * 2.39996323
                blurSamples.set(
                    [
                        Math.cos(angle) * radial,
                        Math.sin(angle) * 0.7 * radial,
                        Math.exp(-2 * radial * radial),
                        (index + 0.5) / 13,
                    ],
                    index * 4
                )
            }
            const kernelLocation = uniform("uBlurSamples[0]")
            if (kernelLocation) gl.uniform4fv(kernelLocation, blurSamples)

            const draw = (now: number, warmup = false) => {
                if (disposed || (!imagesReady && !warmup)) return
                const {
                    diskSize,
                    circleSpacing,
                    glassWidth,
                    borderThickness,
                    visualGain,
                    warpIntensity,
                    lensIor,
                    lensDepth,
                    lensDispersion,
                    lensRoughness,
                    blurReach: progressiveWidth,
                    distortionThickness,
                    refraction,
                    chromaticOffset,
                    glassOpacity,
                    ior,
                    opticalThickness,
                    roughness,
                    thinFilmStrength,
                    thinFilmThickness,
                    thinFilmIor,
                    reflectionStrength,
                    edgeLight,
                    speed,
                    orbitSpeed,
                    distortCircleEdges,
                    circleEdgeDistortion,
                    isStatic,
                } = settingsRef.current
                const dpr = Math.min(window.devicePixelRatio || 1, 2)
                const width = Math.max(1, Math.round(root.clientWidth * dpr))
                const height = Math.max(1, Math.round(root.clientHeight * dpr))

                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width
                    canvas.height = height
                    gl.viewport(0, 0, width, height)
                }

                const blurPixels =
                    Math.max(0, Math.min(100, lensRoughness)) * dpr
                const blurEnabled =
                    blurPixels > 0 && ensureBlur(width, height, blurPixels)
                if (!blurEnabled) releaseBlur()
                gl.bindFramebuffer(
                    gl.FRAMEBUFFER,
                    blurEnabled ? sceneTarget!.framebuffer : null
                )
                gl.viewport(0, 0, width, height)
                gl.enable(gl.BLEND)
                // Preserve coverage alpha (do not square it at antialiased edges).
                gl.blendFuncSeparate(
                    gl.SRC_ALPHA,
                    gl.ONE_MINUS_SRC_ALPHA,
                    gl.ONE,
                    gl.ONE_MINUS_SRC_ALPHA
                )

                // Always clear the entire canvas, including regions drawn last frame.
                gl.disable(gl.SCISSOR_TEST)
                gl.clearColor(0, 0, 0, 0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                useQuad(program)

                const resolutionLocation = uniform("uResolution")
                if (resolutionLocation)
                    gl.uniform2f(resolutionLocation, width, height)
                const animate = !isStatic && !reducedMotion && !warmup
                if (
                    animate &&
                    imagesReady &&
                    documentVisible &&
                    inView &&
                    root.clientWidth > 0 &&
                    root.clientHeight > 0
                ) {
                    if (lastAnimationAt !== null)
                        animationSeconds +=
                            Math.max(0, now - lastAnimationAt) / 1000
                    lastAnimationAt = now
                } else {
                    lastAnimationAt = null
                }
                const time = animate ? animationSeconds : 0
                const rotationElapsed = Math.max(0, time - revealEnd)
                const acceleratingTime = Math.min(
                    rotationElapsed,
                    spiralAccelerationDuration
                )
                const peakHoldTime = Math.max(
                    0,
                    Math.min(rotationElapsed, orbitSettleStart) -
                        spiralAccelerationDuration
                )
                const deceleratingTime = Math.max(
                    0,
                    Math.min(
                        rotationElapsed - orbitSettleStart,
                        orbitSettleDuration
                    )
                )
                // Integrate the speed curve instead of multiplying the whole angle.
                // Both phase and velocity stay continuous through the speed-up,
                // the peak-speed hold, and the handoff to the original orbit speed.
                // Hold the formed circle at peak speed before gradually slowing down.
                const orbitTime = animate
                    ? spiralSpeedMultiplier *
                          spiralAccelerationDuration *
                          integratedProgress(
                              acceleratingTime / spiralAccelerationDuration
                          ) +
                      spiralSpeedMultiplier * peakHoldTime +
                      spiralSpeedMultiplier * deceleratingTime +
                      (1 - spiralSpeedMultiplier) *
                          orbitSettleDuration *
                          integratedProgress(
                              deceleratingTime / orbitSettleDuration
                          ) +
                      Math.max(
                          0,
                          rotationElapsed -
                              orbitSettleStart -
                              orbitSettleDuration
                      )
                    : 0
                setFloat(
                    "uIntroStack",
                    warmup || (animate && time < introEnd) ? 1 : 0
                )
                setFloat("uTime", time)
                // Same layout formula, evaluated six times per frame instead of
                // hundreds of times for every glass pixel.
                const shortestSide = Math.min(width, height)
                const diameter =
                    width < 700
                        ? Math.min(diskSize * dpr, shortestSide * 0.31)
                        : Math.min(diskSize * dpr, width * 0.25)
                const spacing =
                    (Math.max(0, circleSpacing * dpr) * diameter) /
                    Math.max(diskSize * dpr, 1)
                const radius = Math.max(
                    diameter,
                    Math.min(
                        diameter + spacing,
                        shortestSide * 0.5 + diameter * 0.35
                    )
                )
                for (let index = 0; index < 6; index++) {
                    // Closely staggered starts form one flowing trail instead of six
                    // separate trips. A diminishing clockwise twist curves it outward.
                    const spread = animate
                        ? smoothProgress(
                              (time - revealEnd - index * moveStagger) /
                                  moveDuration
                          )
                        : 1
                    const spiralTwist = animate ? (1 - spread) * 0.7 : 0
                    const angle =
                        1.5707963 -
                        index * 1.04719755 +
                        spiralTwist -
                        orbitTime * orbitSpeed
                    centers[index * 2] =
                        width * 0.5 + Math.cos(angle) * radius * spread
                    centers[index * 2 + 1] =
                        height * 0.5 + Math.sin(angle) * radius * spread
                    diskOpacities[index] = animate
                        ? imagesReady
                            ? smoothProgress(
                                  (time - (5 - index) * revealStagger) /
                                      revealDuration
                              )
                            : 0
                        : 1
                }
                const centersLocation = uniform("uDiskCenters[0]")
                if (centersLocation) gl.uniform2fv(centersLocation, centers)
                const opacityLocation = uniform("uDiskOpacities[0]")
                if (opacityLocation)
                    gl.uniform1fv(opacityLocation, diskOpacities)
                setFloat("uDiameter", diameter)
                const rayDepth =
                    Math.max(1, borderThickness * dpr) *
                    Math.max(0, lensDepth) *
                    Math.sqrt(Math.max(0, (warpIntensity / 5) * visualGain))
                setFloat("uRayDepth", rayDepth)
                setFloat("uDiskSize", diskSize * dpr)
                setFloat("uCircleSpacing", circleSpacing * dpr)
                setFloat("uGlassWidth", glassWidth * dpr)
                setFloat("uBorderThickness", borderThickness * dpr)
                setFloat("uVisualGain", visualGain)
                setFloat("uWarpIntensity", warpIntensity)
                setFloat("uDistortionThickness", distortionThickness)
                setFloat("uRefraction", refraction * dpr)
                setFloat("uChromaticOffset", chromaticOffset * dpr)
                setFloat("uGlassOpacity", glassOpacity)
                setFloat("uIor", lensIor)
                setFloat("uOpticalThickness", lensDepth)
                // Blur is a post-refraction filter, not new rays or thickness jitter.
                setFloat("uRoughness", 0)
                setFloat("uBlurRadius", 0)
                setFloat("uLensDispersion", lensDispersion)
                setFloat("uThinFilmStrength", thinFilmStrength)
                setFloat("uThinFilmThickness", thinFilmThickness)
                setFloat("uThinFilmIor", thinFilmIor)
                setFloat("uReflectionStrength", reflectionStrength)
                setFloat("uEdgeLight", edgeLight)
                setFloat("uSpeed", speed)
                setFloat("uOrbitSpeed", orbitSpeed)
                setFloat("uDistortCircleEdges", distortCircleEdges ? 1 : 0)
                setFloat("uCircleEdgeDistortion", circleEdgeDistortion * dpr)

                for (let index = 0; index < 6; index += 1) {
                    gl.activeTexture(gl.TEXTURE0 + index)
                    gl.bindTexture(gl.TEXTURE_2D, textures[index])
                    const samplerLocation = uniform(`uImage${index}`)
                    if (samplerLocation) gl.uniform1i(samplerLocation, index)
                    setFloat(`uAspect${index}`, imageAspects[index])
                }

                // Ray.xy is a normalized ray (length <= 1). Curved depth is bounded
                // by 1.04 * 1.025, with <= 1.08 thickness jitter. 1.17 is conservative.
                // Add the full blur radius, circle deformation and a raster guard.
                const blurReach =
                    Math.max(0, Math.min(100, lensRoughness)) * dpr
                const edgeReach = distortCircleEdges
                    ? Math.abs(circleEdgeDistortion * dpr)
                    : 0
                const extent =
                    diameter * 0.5 + edgeReach + rayDepth * 1.17 + blurReach + 4
                const regions = glassDrawRegions(centers, width, height, extent)
                const fullCanvas =
                    regions.length === 1 &&
                    regions[0].x === 0 &&
                    regions[0].y === 0 &&
                    regions[0].width === width &&
                    regions[0].height === height
                if (fullCanvas) {
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                } else {
                    gl.enable(gl.SCISSOR_TEST)
                    for (const region of regions) {
                        gl.scissor(
                            region.x,
                            region.y,
                            region.width,
                            region.height
                        )
                        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                    }
                    gl.disable(gl.SCISSOR_TEST)
                }
                if (blurEnabled)
                    filterBlur(
                        width,
                        height,
                        blurPixels,
                        Math.max(1, progressiveWidth * dpr),
                        glassSceneSupport(
                            centers, diskOpacities, width, height, diameter,
                            edgeReach, rayDepth, Math.max(1, borderThickness * dpr)
                        )
                    )
            }

            const stopLoop = () => {
                nextDrawAt = 0
                lastAnimationAt = null
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame)
                    animationFrame = 0
                }
            }

            const hasMotion = () => {
                const current = settingsRef.current
                return (
                    !current.isStatic &&
                    !reducedMotion &&
                    imagesReady &&
                    (animationSeconds < introEnd ||
                        current.orbitSpeed !== 0 ||
                        (current.distortCircleEdges &&
                            current.circleEdgeDistortion !== 0 &&
                            current.speed !== 0))
                )
            }

            const startLoop = () => {
                if (
                    disposed ||
                    !hasMotion() ||
                    !documentVisible ||
                    !inView ||
                    animationFrame
                ) {
                    return
                }
                animationFrame = requestAnimationFrame((now) => {
                    animationFrame = 0
                    // Advance motion in seconds, but shade at most 60 frames/sec.
                    // A tiny timestamp tolerance prevents accidental 30fps at 60Hz.
                    if (now + 0.1 >= nextDrawAt) {
                        draw(now)
                        nextDrawAt =
                            nextDrawAt === 0
                                ? now + frameInterval
                                : nextDrawAt + frameInterval
                        // Never render catch-up frames after a slow frame or interruption.
                        if (nextDrawAt <= now) nextDrawAt = now + frameInterval
                    }
                    startLoop()
                })
            }

            for (let index = 0; index < 6; index += 1) {
                const texture = gl.createTexture()
                if (!texture) continue
                textures.push(texture)
                gl.activeTexture(gl.TEXTURE0 + index)
                gl.bindTexture(gl.TEXTURE_2D, texture)
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
            }

            const loadedSources: (string | undefined)[] = []
            const imageGenerations = [0, 0, 0, 0, 0, 0]
            const requestPresentation = () => {
                if (disposed || presentationFrame || !documentVisible) return
                if (!inView && !settingsRef.current.isStatic) return
                if (imagesReady && animationFrame && hasMotion()) return
                if (root.clientWidth <= 0 || root.clientHeight <= 0) return
                presentationFrame = requestAnimationFrame((now) => {
                    presentationFrame = 0
                    if (disposed) return
                    if (!rendererWarmed) {
                        const dpr = Math.min(window.devicePixelRatio || 1, 2)
                        const width = Math.max(
                            1,
                            Math.round(root.clientWidth * dpr)
                        )
                        const height = Math.max(
                            1,
                            Math.round(root.clientHeight * dpr)
                        )
                        const blur =
                            Math.max(
                                0,
                                Math.min(100, settingsRef.current.lensRoughness)
                            ) * dpr
                        if (blur > 0) {
                            const preparationDeadline = performance.now() + 4
                            let status = prepareBlurStep(width, height, blur)
                            while (
                                status === "pending" &&
                                performance.now() < preparationDeadline
                            )
                                status = prepareBlurStep(width, height, blur)
                            if (status === "pending") {
                                requestPresentation()
                                return
                            }
                        }
                        // Resource preparation can overlap downloads, but the
                        // original six-image barrier and intro clock remain intact.
                        if (!imagesSettled.every(Boolean)) return
                        // Exercise real image sampling, refraction and the unchanged
                        // blur pyramid offscreen before the intro clock starts.
                        canvas.style.visibility = "hidden"
                        draw(now, true)
                        gl.flush()
                        rendererWarmed = true
                        presentationFrame = requestAnimationFrame(
                            (firstNow) => {
                                presentationFrame = 0
                                if (disposed) return
                                imagesReady = true
                                lastAnimationAt = null
                                draw(firstNow)
                                canvas.style.visibility = originalVisibility
                                startLoop()
                            }
                        )
                        return
                    }
                    draw(now)
                    startLoop()
                })
            }
            const settleImage = (index: number, generation: number) => {
                if (disposed || imageGenerations[index] !== generation) return
                imagesSettled[index] = true
                // No partial/blank blur renders while the initial six images load.
                requestPresentation()
            }
            const pendingUploads = new Map<
                number,
                { image: HTMLImageElement; generation: number }
            >()
            let stagingCanvas: HTMLCanvasElement | null = null
            let stagingContext: CanvasRenderingContext2D | null = null
            const uploadImage = (
                index: number,
                generation: number,
                image: HTMLImageElement
            ) => {
                if (disposed || imageGenerations[index] !== generation) return
                const texture = textures[index]
                try {
                    gl.activeTexture(gl.TEXTURE0 + index)
                    gl.bindTexture(gl.TEXTURE_2D, texture)
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)

                    // The source assets are much larger than their ~250px
                    // display size. Prefilter to a power-of-two cover crop and
                    // generate mipmaps so sub-pixel orbit motion stays stable.
                    const filteredSize = 1024
                    if (!stagingCanvas) {
                        stagingCanvas = document.createElement("canvas")
                        stagingCanvas.width = filteredSize
                        stagingCanvas.height = filteredSize
                        stagingContext = stagingCanvas.getContext("2d")
                    }
                    if (!stagingContext)
                        throw new Error("2D texture staging unavailable")
                    const cropSize = Math.min(
                        image.naturalWidth,
                        image.naturalHeight
                    )
                    const cropX = (image.naturalWidth - cropSize) * 0.5
                    const cropY = (image.naturalHeight - cropSize) * 0.5
                    stagingContext.clearRect(0, 0, filteredSize, filteredSize)
                    stagingContext.drawImage(
                        image,
                        cropX,
                        cropY,
                        cropSize,
                        cropSize,
                        0,
                        0,
                        filteredSize,
                        filteredSize
                    )
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        stagingCanvas
                    )
                    gl.generateMipmap(gl.TEXTURE_2D)
                    gl.texParameteri(
                        gl.TEXTURE_2D,
                        gl.TEXTURE_MIN_FILTER,
                        gl.LINEAR_MIPMAP_LINEAR
                    )
                    gl.texParameteri(
                        gl.TEXTURE_2D,
                        gl.TEXTURE_MAG_FILTER,
                        gl.LINEAR
                    )
                    imageAspects[index] = 1
                } catch (error) {
                    console.error(
                        "GlassEdgeDisks texture upload failed:",
                        error
                    )
                } finally {
                    settleImage(index, generation)
                }
            }
            const uploadNextImage = () => {
                uploadFrame = 0
                if (disposed) return
                const next = pendingUploads.entries().next().value
                if (next) {
                    const [index, pending] = next
                    pendingUploads.delete(index)
                    uploadImage(index, pending.generation, pending.image)
                }
                // Keep the original 1024px crop and mipmaps. Schedule one upload per
                // frame so six decoded images do not monopolize one main-thread task.
                if (pendingUploads.size)
                    uploadFrame = requestAnimationFrame(uploadNextImage)
            }
            const loadImages = (images: DiskImage[]) => {
                const activeSources = new Set(images.map((image) => image.src))
                for (const source of imageRequests.keys()) {
                    if (!activeSources.has(source)) imageRequests.delete(source)
                }
                for (let index = 0; index < 6; index++) {
                    const source = images[index]?.src
                    if (!source) {
                        settleImage(index, ++imageGenerations[index])
                        continue
                    }
                    if (loadedSources[index] === source) continue
                    loadedSources[index] = source
                    const generation = ++imageGenerations[index]
                    imagesSettled[index] = false
                    void prepareImage(source).then(({ image }) => {
                        if (disposed || imageGenerations[index] !== generation)
                            return
                        if (!image) {
                            console.warn(
                                "GlassEdgeDisks image could not be loaded:",
                                index + 1
                            )
                            settleImage(index, generation)
                            return
                        }
                        pendingUploads.set(index, { image, generation })
                        if (!uploadFrame)
                            uploadFrame = requestAnimationFrame(uploadNextImage)
                    })
                }
            }

            const resizeObserver = new ResizeObserver(requestPresentation)
            resizeObserver.observe(root)

            const intersectionObserver = new IntersectionObserver(
                (entries) => {
                    inView = entries[0]?.isIntersecting ?? true
                    if (inView) {
                        if (imagesReady) startLoop()
                        else requestPresentation()
                    } else stopLoop()
                },
                { threshold: 0.01 }
            )
            intersectionObserver.observe(root)

            const handleVisibility = () => {
                documentVisible = document.visibilityState !== "hidden"
                if (documentVisible) {
                    if (imagesReady) startLoop()
                    else requestPresentation()
                } else stopLoop()
            }
            document.addEventListener("visibilitychange", handleVisibility)

            rendererRef.current = {
                refresh: () => {
                    requestPresentation()
                    if (!hasMotion() || !documentVisible || !inView) stopLoop()
                    else startLoop()
                },
                loadImages,
            }
            loadImages(imagesRef.current)
            requestPresentation()

            return () => {
                rendererRef.current = null
                stopLoop()
                if (uploadFrame) cancelAnimationFrame(uploadFrame)
                if (presentationFrame) cancelAnimationFrame(presentationFrame)
                pendingUploads.clear()
                stagingCanvas = null
                stagingContext = null
                canvas.style.visibility = originalVisibility
                resizeObserver.disconnect()
                intersectionObserver.disconnect()
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibility
                )
                textures.forEach((texture) => gl.deleteTexture(texture))
                releaseBlur()
                gl.deleteBuffer(buffer)
                releasePrograms()
            }
        }

        const compilationDeadline = performance.now() + 30000
        const finishCompilation = () => {
            compileFrame = 0
            if (disposed) return
            if (
                parallelCompile &&
                programs.some(
                    (linked) =>
                        !gl.getProgramParameter(
                            linked,
                            parallelCompile.COMPLETION_STATUS_KHR
                        )
                )
            ) {
                if (performance.now() > compilationDeadline) {
                    console.error(
                        "GlassEdgeDisks shader initialization timed out"
                    )
                    releasePrograms()
                    return
                }
                compileFrame = requestAnimationFrame(finishCompilation)
                return
            }
            for (const linked of programs) {
                if (!gl.getProgramParameter(linked, gl.LINK_STATUS)) {
                    console.error(
                        "GlassEdgeDisks program error:",
                        gl.getProgramInfoLog(linked)
                    )
                    releasePrograms()
                    return
                }
            }
            rendererCleanup = initializeRenderer() ?? null
        }
        compileFrame = requestAnimationFrame(finishCompilation)

        return () => {
            disposed = true
            if (compileFrame) cancelAnimationFrame(compileFrame)
            if (rendererCleanup) rendererCleanup()
            else releasePrograms()
            imageRequests.clear()
        }
    }, [])

    useEffect(() => {
        rendererRef.current?.loadImages(resolvedImages)
    }, [imageKey])

    useEffect(() => {
        rendererRef.current?.refresh()
    }, [
        diskSize,
        circleSpacing,
        glassWidth,
        borderThickness,
        visualGain,
        warpIntensity,
        lensIor,
        lensDepth,
        lensDispersion,
        lensRoughness,
        blurReach,
        distortionThickness,
        refraction,
        chromaticOffset,
        glassOpacity,
        ior,
        opticalThickness,
        roughness,
        thinFilmStrength,
        thinFilmThickness,
        thinFilmIor,
        reflectionStrength,
        edgeLight,
        speed,
        orbitSpeed,
        distortCircleEdges,
        circleEdgeDistortion,
        isStatic,
    ])

    return (
        <div
            ref={rootRef}
            role={accessibleLabel ? "img" : undefined}
            aria-label={accessibleLabel}
            aria-hidden={accessibleLabel ? undefined : true}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                background: "transparent",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

addPropertyControls(GlassEdgeDisks, {
    circleImages: {
        type: ControlType.Array,
        title: "Disk Images",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: defaultImages,
        maxCount: 6,
    },
    diskSize: {
        type: ControlType.Number,
        title: "Disk Size",
        defaultValue: 250,
        min: 120,
        max: 320,
        step: 1,
        unit: "px",
    },
    circleSpacing: {
        type: ControlType.Number,
        title: "Circle Spacing",
        defaultValue: 110,
        min: 0,
        max: 320,
        step: 1,
        unit: "px",
    },
    lensIor: {
        type: ControlType.Number,
        title: "Glass IOR",
        defaultValue: 2.5,
        min: 1.01,
        max: 2.5,
        step: 0.01,
    },
    lensDepth: {
        type: ControlType.Number,
        title: "Glass Depth",
        defaultValue: 1.6,
        min: 0,
        max: 20,
        step: 0.1,
    },
    lensDispersion: {
        type: ControlType.Number,
        title: "Chromatic Aberration",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.005,
    },
    lensRoughness: {
        type: ControlType.Number,
        title: "Glass Blur",
        description:
            "Progressive Gaussian blur after refraction. The middle stays sharp; softness increases toward the canvas edge.",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    blurReach: {
        type: ControlType.Number,
        title: "Blur Reach",
        description:
            "Distance inward from the canvas edge where the progressive blur fades to zero. Independent of refraction thickness.",
        defaultValue: 60,
        min: 20,
        max: 600,
        step: 1,
        unit: "px",
        hidden: (props) => (props.lensRoughness ?? 25) === 0,
    },
    warpIntensity: {
        type: ControlType.Number,
        title: "Warp Intensity",
        description:
            "Amplifies the curved glass ray travel. 5 is the reference depth multiplier; 0 disables refraction.",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 0.1,
    },
    visualGain: {
        type: ControlType.Number,
        title: "Visual Gain",
        defaultValue: 0.5,
        min: 0,
        max: 100,
        step: 0.5,
    },
    glassWidth: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Sample Depth",
        defaultValue: 425,
        min: 12,
        max: 1200,
        step: 1,
        unit: "px",
    },
    borderThickness: {
        type: ControlType.Number,
        title: "Border Thickness",
        defaultValue: 85,
        min: 4,
        max: 640,
        step: 1,
        unit: "px",
    },
    distortionThickness: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Distortion Thickness",
        defaultValue: 12.9,
        min: 0.2,
        max: 30,
        step: 0.05,
    },
    refraction: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Refraction",
        defaultValue: 417,
        min: 0,
        max: 1200,
        step: 1,
        unit: "px",
    },
    chromaticOffset: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Dispersion",
        defaultValue: 17,
        min: 0,
        max: 240,
        step: 0.5,
        unit: "px",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Visibility",
        defaultValue: 0,
        min: 0,
        max: 2.5,
        step: 0.005,
    },
    ior: {
        hidden: () => true,
        type: ControlType.Number,
        title: "IOR",
        defaultValue: 4,
        min: 1.01,
        max: 24,
        step: 0.01,
    },
    opticalThickness: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Optical Thickness",
        defaultValue: 0.06,
        min: 0.05,
        max: 20,
        step: 0.01,
    },
    roughness: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Roughness",
        defaultValue: 0.07,
        min: 0,
        max: 5,
        step: 0.01,
    },
    thinFilmStrength: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Thin Film",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.01,
    },
    thinFilmThickness: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Film Thickness",
        defaultValue: 180,
        min: 180,
        max: 9000,
        step: 1,
        unit: "nm",
    },
    thinFilmIor: {
        hidden: () => true,
        type: ControlType.Number,
        title: "Film IOR",
        defaultValue: 26,
        min: 1.01,
        max: 26,
        step: 0.01,
    },
    reflectionStrength: {
        type: ControlType.Number,
        title: "Reflection",
        defaultValue: 0.18,
        min: 0,
        max: 15,
        step: 0.01,
    },
    edgeLight: {
        type: ControlType.Number,
        title: "Edge Light",
        defaultValue: 0.12,
        min: 0,
        max: 30,
        step: 0.01,
    },
    speed: {
        type: ControlType.Number,
        title: "Glass Speed",
        defaultValue: 0.86,
        min: 0,
        max: 1,
        step: 0.01,
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 0.1,
        min: 0,
        max: 0.15,
        step: 0.005,
    },
    distortCircleEdges: {
        type: ControlType.Boolean,
        title: "Distort Circle Edges",
        defaultValue: false,
    },
    circleEdgeDistortion: {
        type: ControlType.Number,
        title: "Circle Distortion",
        defaultValue: 3,
        min: 0,
        max: 360,
        step: 1,
        unit: "px",
        hidden: ({ distortCircleEdges }) => !distortCircleEdges,
    },
})

GlassEdgeDisks.displayName = "Glass Edge Disks"
