/**
 * Silk Waves Background Component
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * Adapted for Framer by Karim Saif
 * Made with 💛 by Karim Saif
 */

import React, { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

// Presets mapping
const COLOR_PRESETS: Record<string, string> = {
    slate: "#7B7481",
    midnight: "#1E293B",
    emerald: "#065F46",
    crimson: "#881337",
    gold: "#D97706",
    purple: "#581C87",
    bright: "#E2E8F0", // New bright preset added
}

// Quality mapping
const QUALITY_MAP: Record<string, number> = {
    low: 1,
    medium: 1.5,
    high: 2,
}

interface SilkProps {
    preset?: string
    color?: string
    backgroundColor?: string
    opacity?: number
    intensity?: number
    speed?: number
    rotation?: number
    animate?: boolean
    scale?: number
    noiseIntensity?: number
    seed?: number
    quality?: string
    blendMode?: React.CSSProperties["mixBlendMode"]
    style?: React.CSSProperties
    ariaLabel?: string
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform vec3  uBackground;
uniform float uIntensity;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform float uSeed;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * (texCoord + vec2(uSeed))));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd         = noise(gl_FragCoord.xy);
  vec2  uv          = rotateUvs(vUv * uScale, uRotation);
  vec2  tex         = uv * uScale;

  tex.y += 0.03 * sin(8.0 * tex.x - uTime);

  float rawPattern = 0.6 +
                     0.4 * sin(5.0 * (tex.x + tex.y +
                                      cos(3.0 * tex.x + 5.0 * tex.y) +
                                      0.02 * uTime) +
                               sin(20.0 * (tex.x + tex.y - 0.1 * uTime)));

  float pattern = smoothstep(0.1, 0.9, rawPattern);
  vec3 silkColor = (uColor * uIntensity) * pattern - (rnd / 15.0 * uNoiseIntensity);
  vec3 finalColor = mix(uBackground, silkColor, clamp(pattern, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, 1.0);
}
`

// --------------------------------------------------------
// Silk Engine Implementation — Karim Saif Edition
// --------------------------------------------------------

export default function Silk(props: SilkProps) {
    const {
        preset = "slate",
        color = "#7B7481",
        backgroundColor = "#000000",
        opacity = 1,
        intensity = 1,
        speed = 5,
        rotation = 0,
        animate = true,
        scale = 1,
        noiseIntensity = 1.5,
        seed = 0,
        quality = "medium",
        blendMode = "normal",
        ariaLabel = "Silk wave background visualization",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const activeColor =
        preset !== "custom" && COLOR_PRESETS[preset]
            ? COLOR_PRESETS[preset]
            : color

    const containerRef = useRef<HTMLDivElement>(null)
    const materialRef = useRef<THREE.ShaderMaterial | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

    // Dynamic Refs to prevent React closures inside the animation loop
    const animateRef = useRef(animate)
    const speedRef = useRef(speed)
    const isVisibleRef = useRef(true)
    const qualityRef = useRef(quality)

    useEffect(() => {
        animateRef.current = animate
    }, [animate])

    useEffect(() => {
        speedRef.current = speed
    }, [speed])

    useEffect(() => {
        qualityRef.current = quality
    }, [quality])

    // Setup WebGL Scene
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        })
        const targetPixelRatio = QUALITY_MAP[quality] || 1.5
        renderer.setPixelRatio(targetPixelRatio)
        renderer.setSize(container.clientWidth, container.clientHeight, false)
        container.appendChild(renderer.domElement)
        rendererRef.current = renderer

        // Convert degrees (0-360) to radians for Three.js shader
        const radiansRotation = (rotation * Math.PI) / 180

        const uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(activeColor) },
            uBackground: { value: new THREE.Color(backgroundColor) },
            uIntensity: { value: intensity },
            uScale: { value: scale },
            uNoiseIntensity: { value: noiseIntensity },
            uRotation: { value: radiansRotation },
            uSeed: { value: seed },
        }

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
        })
        materialRef.current = material

        const geometry = new THREE.PlaneGeometry(2, 2)
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        let animationFrameId: number
        let clock = new THREE.Clock()

        // Core Render Loop
        const renderFrame = () => {
            if (!isStatic && animateRef.current && isVisibleRef.current) {
                material.uniforms.uTime.value +=
                    clock.getDelta() * speedRef.current * 0.1
            }

            if (isVisibleRef.current || isStatic) {
                renderer.render(scene, camera)
            }

            if (!isStatic) {
                animationFrameId = requestAnimationFrame(renderFrame)
            }
        }

        // Handle viewport resize & pixel ratio sync
        const handleResize = () => {
            if (!container || !rendererRef.current) return
            const currentRatio = QUALITY_MAP[qualityRef.current] || 1.5
            rendererRef.current.setPixelRatio(currentRatio)
            rendererRef.current.setSize(
                container.clientWidth,
                container.clientHeight,
                false
            )
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)

        // Visibility Optimization using IntersectionObserver
        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        // Render initial frame
        renderFrame()

        return () => {
            if (!isStatic) cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [isStatic])

    // Live Uniform Updates
    useEffect(() => {
        if (!materialRef.current) return
        const uniforms = materialRef.current.uniforms

        uniforms.uScale.value = scale
        uniforms.uNoiseIntensity.value = noiseIntensity
        uniforms.uRotation.value = (rotation * Math.PI) / 180
        uniforms.uSeed.value = seed
        uniforms.uIntensity.value = intensity
        uniforms.uColor.value.set(activeColor)
        uniforms.uBackground.value.set(backgroundColor)

        if (rendererRef.current && containerRef.current) {
            const currentRatio = QUALITY_MAP[quality] || 1.5
            rendererRef.current.setPixelRatio(currentRatio)
            rendererRef.current.setSize(
                containerRef.current.clientWidth,
                containerRef.current.clientHeight,
                false
            )
        }
    }, [
        scale,
        noiseIntensity,
        rotation,
        seed,
        intensity,
        activeColor,
        backgroundColor,
        quality,
    ])

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                opacity,
                mixBlendMode: blendMode,
                ...style,
            }}
        />
    )
}

// Default Framer Props
Silk.defaultProps = {
    preset: "slate",
    color: "#7B7481",
    backgroundColor: "#000000",
    opacity: 1,
    intensity: 1,
    speed: 5,
    rotation: 0,
    animate: true,
    scale: 1,
    noiseIntensity: 1.5,
    seed: 0,
    quality: "medium",
    blendMode: "normal",
    ariaLabel: "Silk wave background visualization",
}

// Organized Property Controls
addPropertyControls(Silk, {
    // --- APPEARANCE ---
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "slate",
        options: [
            "custom",
            "slate",
            "midnight",
            "emerald",
            "crimson",
            "gold",
            "purple",
            "bright",
        ],
        optionTitles: [
            "Custom Color",
            "Slate",
            "Midnight Navy",
            "Emerald Silk",
            "Crimson Velvet",
            "Golden Hour",
            "Deep Purple",
            "Bright Silver",
        ],
        description: "Choose a preset or switch to Custom Color.",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#7B7481",
        hidden(props) {
            return props.preset !== "custom"
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Base background color rendered inside the shader.",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        description: "Adjusts silk highlight vibrancy.",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "normal",
        options: ["normal", "screen", "multiply", "overlay", "soft-light"],
        optionTitles: ["Normal", "Screen", "Multiply", "Overlay", "Soft Light"],
    },

    // --- MOTION ---
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.5,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        description: "Rotates wave motion direction in degrees (0–360°).",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        description: "Toggle on/off for static screenshots or preview canvas.",
    },

    // --- PATTERN ---
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    noiseIntensity: {
        type: ControlType.Number,
        title: "Noise",
        defaultValue: 1.5,
        min: 0,
        max: 5,
        step: 0.1,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        description: "Generates variations of the silk wave distribution.",
    },

    // --- PERFORMANCE ---
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        defaultValue: "medium",
        options: ["low", "medium", "high"],
        optionTitles: ["Low (1x)", "Medium (1.5x)", "High (2x)"],
        description:
            "Lower pixel ratio boosts GPU performance on lower-end devices.",
    },

    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Silk wave background visualization",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
