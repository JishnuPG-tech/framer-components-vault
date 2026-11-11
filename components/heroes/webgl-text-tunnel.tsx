import * as React from "react"
import { useEffect, useRef, useState } from "react"
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
 * TDF_WebGLTextTunnel - THE UNLIMITED VERSION
 *
 * Final Polish:
 * 1. Edge Area expansion: Now supports up to 100%, allowing the tunnel to consume the entire screen.
 * 2. Perspective Locking: Distortion peaks sooner and stays at max for the remaining screen area.
 * 3. Strictly Monotonic: No curling, no folding, pure expansion.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TDF_WebGLTextTunnel(props) {
    const {
        text,
        font,
        textColor,
        backgroundColor,
        scrollSpeed,
        stretchY,
        stretchX,
        gap,
        falloff,
        bloom,
        chromaticStrength,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<any>(null)
    const propsRef = useRef(props)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [isReady, setIsReady] = useState(false)
    const dimensionsRef = useRef(dimensions)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        propsRef.current = props
    }, [props])

    const parseFontSize = (v: any) => {
        if (v === undefined || v === null) return 60
        if (typeof v === "number") return v
        const val = parseFloat(v)
        if (isNaN(val)) return 60
        const s = String(v).toLowerCase()
        if (s.includes("px")) return val
        if (s.includes("em")) return val * 16
        if (s.includes("rem")) return val * 16
        return val
    }

    const parseLineHeight = (v: any, fontSize: number) => {
        if (v === undefined || v === null) return fontSize * 1.2
        if (typeof v === "number") {
            // In CSS/Framer, a unitless number is a multiplier
            return v > 5 ? v : v * fontSize
        }
        const val = parseFloat(v)
        if (isNaN(val)) return fontSize * 1.2
        const s = String(v).toLowerCase()
        if (s.includes("px")) return val
        if (s.includes("%")) return (val / 100) * fontSize
        if (s.includes("em")) return val * fontSize
        // If it's just a string number like "1.5"
        return val * fontSize
    }

    const fontSize = parseFontSize(font?.fontSize)
    const lineHeight = parseLineHeight(font?.lineHeight, fontSize)
    const fontFamily = font?.fontFamily || "Inter"
    const fontWeight = font?.fontWeight || font?.variant || "400"
    const letterSpacing = parseFontSize(font?.letterSpacing || 0)
    const textAlign = font?.textAlign || "center"

    useEffect(() => {
        let renderer: any,
            scene: any,
            camera: any,
            material: any,
            geometry: any,
            animationFrameId: number,
            THREE: any,
            clock: any
        const setup = async () => {
            THREE = await import("https://cdn.skypack.dev/three@0.150.1")
            if (!canvasContainerRef.current || isStatic) return

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
            const width = containerRef.current?.offsetWidth || 400
            const height = containerRef.current?.offsetHeight || 600
            renderer.setSize(width, height)
            setDimensions({ width, height })
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

            canvasContainerRef.current.innerHTML = ""
            canvasContainerRef.current.appendChild(renderer.domElement)

            scene = new THREE.Scene()
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

            material = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { value: null },
                    uGlowTexture: { value: null },
                    uTime: { value: 0 },
                    uStretchY: { value: 0 },
                    uStretchX: { value: 0 },
                    uChroma: { value: 0 },
                    uCurvature: { value: 0 },
                    uFalloff: { value: 0 },
                    uBloom: { value: 0 },
                    uRepeatY: { value: 1 },
                    uAspect: { value: 1 },
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
                `,
                fragmentShader: `
                    precision highp float;
                    uniform sampler2D uTexture;
                    uniform sampler2D uGlowTexture;
                    uniform float uTime, uStretchY, uStretchX, uChroma, uFalloff, uBloom, uRepeatY, uAspect;
                    varying vec2 vUv;
                    
                    void main() {
                        vec2 uv = vUv;
                        float relY = uv.y - 0.5;

                        // 1. FALLOFF MASK — controls how fast distortion kicks in from edge to center
                        // Only affects the strength of edge-based effects. Independent of all others.
                        float centerPower = mix(1.2, 12.0, uFalloff / 100.0);
                        float mask = clamp(pow(abs(relY) * 2.0, centerPower), 0.0, 1.0);

                        // 2. STRETCH X — independent horizontal expansion at edges
                        float xExpansion = 1.0 + mask * (uStretchX / 100.0) * 10.0;
                        float warpedX = ((uv.x - 0.5) / xExpansion) + 0.5;

                        // 4. STRETCH Y — pure vertical tunnel depth, does NOT touch X or Chromatic
                        float depth = mask * (uStretchY / 100.0) * 15.0;
                        float warpedY = relY / (1.0 + depth);
                        float texY = mod(warpedY * uRepeatY + uTime + 0.5, 1.0);

                        // 5. CHROMATIC ABERRATION — smooth spectral dispersion
                        // Instead of 3 hard R/G/B samples, blend across 8 spectral steps
                        float chroma = (uChroma / 100.0) * 0.05 * mask;
                        vec3 chromaCol = vec3(0.0);
                        float chromaWeightSum = 0.0;
                        const float CSTEPS = 8.0;
                        for (float ci = 0.0; ci < CSTEPS; ci++) {
                            float t = ci / (CSTEPS - 1.0); // 0.0 → 1.0
                            float offset = (t - 0.5) * chroma * 2.0;
                            float sY = mod((warpedY + offset) * uRepeatY + uTime + 0.5, 1.0);
                            vec3 sCol = texture2D(uTexture, vec2(warpedX, sY)).rgb;
                            // Smooth spectral weights: red at t=0, green at t=0.5, blue at t=1
                            float rW = smoothstep(0.5, 0.0, t);
                            float gW = 1.0 - abs(t - 0.5) * 2.0;
                            float bW = smoothstep(0.5, 1.0, t);
                            chromaCol += sCol * vec3(rW, gW, bW);
                            chromaWeightSum += (rW + gW + bW);
                        }
                        vec3 finalCol = chromaCol / max(chromaWeightSum / 3.0, 0.001);

                        // 6. BLOOM — purely additive glow layer on top, no other effect
                        float rawBloom = uBloom / 100.0;
                        float bloomIntensity = rawBloom * rawBloom * 0.25;
                        vec3 result = finalCol;

                        if (bloomIntensity > 0.0) {
                            vec2 baseTC = vec2(warpedX, texY);
                            float noise = fract(sin(dot(baseTC, vec2(12.9898, 78.233))) * 43758.5453);
                            vec2 jitter = (vec2(noise) - 0.5) * 0.002 * bloomIntensity;
                            vec3 blurredCol = texture2D(uGlowTexture, baseTC + jitter).rgb;
                            float lum = dot(finalCol, vec3(0.299, 0.587, 0.114));
                            float centerBias = mix(0.4, 1.0, 1.0 - mask);
                            vec3 highlights = finalCol * pow(max(lum, 0.0), 1.1) * bloomIntensity * 22.0 * centerBias;
                            vec3 aura = blurredCol * bloomIntensity * 12.0 * centerBias;
                            result = finalCol + highlights + aura;
                        }

                        gl_FragColor = vec4(result, 1.0);
                    }
                `,
            })

            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
            scene.add(mesh)

            engineRef.current = {
                renderer,
                scene,
                camera,
                material,
                clock: new THREE.Clock(),
                THREE,
            }
            setIsReady(true)

            const frame = () => {
                if (engineRef.current) {
                    const { renderer, scene, camera, material, clock } =
                        engineRef.current
                    const u = material.uniforms
                    if (u.uStretchY)
                        u.uStretchY.value = propsRef.current.stretchY
                    if (u.uStretchX)
                        u.uStretchX.value = propsRef.current.stretchX
                    if (u.uChroma)
                        u.uChroma.value = propsRef.current.chromaticStrength
                    if (u.uFalloff) u.uFalloff.value = propsRef.current.falloff
                    if (u.uBloom) u.uBloom.value = propsRef.current.bloom
                    if (u.uAspect)
                        u.uAspect.value =
                            dimensionsRef.current.width /
                            Math.max(1.0, dimensionsRef.current.height)
                    if (u.uTime)
                        u.uTime.value +=
                            clock.getDelta() *
                            (propsRef.current.scrollSpeed / 100)
                    renderer.render(scene, camera)
                    animationFrameId = requestAnimationFrame(frame)
                }
            }
            frame()
        }
        setup()
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            if (renderer) renderer.dispose()
        }
    }, [isStatic])

    useEffect(() => {
        if (!containerRef.current || isStatic) return
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                setDimensions({ width, height })
                dimensionsRef.current = { width, height }
                if (engineRef.current) {
                    const { renderer } = engineRef.current
                    renderer.setSize(width, height)
                }
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (!engineRef.current || isStatic) return
        const { width: w, height: h } = dimensions
        if (w === 0 || h === 0) return
        const { material, THREE } = engineRef.current
        const u = material.uniforms
        if (u.uStretchY) u.uStretchY.value = stretchY
        if (u.uStretchX) u.uStretchX.value = stretchX
        if (u.uChroma) u.uChroma.value = chromaticStrength

        if (u.uFalloff) u.uFalloff.value = falloff
        if (u.uBloom) u.uBloom.value = bloom
        if (u.uAspect) u.uAspect.value = w / h
        const safeText = text || ""
        const lines = safeText.split("\n")
        const totalTextHeight = lineHeight * lines.length
        const unitH = Math.max(totalTextHeight + gap, 1)
        material.uniforms.uRepeatY.value = h / unitH

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const s = 1
        const cw = Math.max(w * s, 1)
        const ch = Math.max(unitH * s, 1)
        canvas.width = cw
        canvas.height = ch
        ctx.fillStyle = backgroundColor
        ctx.fillRect(-2, -2, cw + 4, ch + 4)
        ctx.font = `${fontWeight} ${fontSize * s}px ${fontFamily}, sans-serif`
        // @ts-ignore
        if (ctx.letterSpacing !== undefined)
            ctx.letterSpacing = `${letterSpacing * s}px`
        ctx.textAlign = textAlign
        ctx.textBaseline = "middle"
        ctx.fillStyle = textColor
        const tx =
            cw / 2 +
            (textAlign === "left"
                ? -cw / 2 + 40 * s
                : textAlign === "right"
                  ? cw / 2 - 40 * s
                  : 0)
        lines.forEach((line: string, i: number) => {
            const blockTop = (ch - totalTextHeight * s) / 2
            const ly = blockTop + lineHeight * s * (i + 0.5)
            ctx.fillText(line, tx, ly)
        })

        const glowCanvas = document.createElement("canvas")
        const glowCtx = glowCanvas.getContext("2d")
        if (glowCtx) {
            glowCanvas.width = cw
            glowCanvas.height = ch
            glowCtx.filter = `blur(${3 * s}px)`
            glowCtx.globalAlpha = 1.0
            glowCtx.drawImage(canvas, 0, 0)
            glowCtx.filter = `blur(${8 * s}px)`
            glowCtx.globalAlpha = 0.7
            glowCtx.drawImage(canvas, 0, 0)
            glowCtx.filter = `blur(${20 * s}px)`
            glowCtx.globalAlpha = 0.4
            glowCtx.drawImage(canvas, 0, 0)
        }

        const tex = new THREE.CanvasTexture(canvas)
        tex.minFilter = tex.magFilter = THREE.LinearFilter
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.RepeatWrapping
        if (material.uniforms.uTexture.value)
            material.uniforms.uTexture.value.dispose()
        material.uniforms.uTexture.value = tex

        const glowTex = new THREE.CanvasTexture(glowCanvas)
        glowTex.minFilter = glowTex.magFilter = THREE.LinearFilter
        glowTex.wrapS = THREE.ClampToEdgeWrapping
        glowTex.wrapT = THREE.RepeatWrapping
        if (material.uniforms.uGlowTexture.value)
            material.uniforms.uGlowTexture.value.dispose()
        material.uniforms.uGlowTexture.value = glowTex
    }, [
        isReady,
        text,
        fontSize,
        lineHeight,
        fontFamily,
        fontWeight,
        letterSpacing,
        textAlign,
        textColor,
        backgroundColor,
        stretchY,
        chromaticStrength,
        gap,
        falloff,
        bloom,
        stretchX,
        dimensions,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                width: 400,
                height: 400,
                ...style,
                backgroundColor,
                overflow: "hidden",
                position: "relative",
            }}
        >
            <div
                ref={canvasContainerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    visibility: isReady && !isStatic ? "visible" : "hidden",
                }}
            />

            {(!isReady || isStatic) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 40,
                        zIndex: 1,
                    }}
                >
                    <span
                        style={{
                            ...font,
                            color: textColor,
                            whiteSpace: "pre-wrap",
                            minWidth: "max-content",
                        }}
                    >
                        {text}
                    </span>
                </div>
            )}
        </div>
    )
}

TDF_WebGLTextTunnel.defaultProps = {
    text: "designed imperfect.",
    font: {
        fontFamily: "Inter",
        variant: "Bold",
        fontSize: 60,
        letterSpacing: 0,
        textAlign: "center",
        lineHeight: "1.2em",
    },
    textColor: "#FFFFFF",
    backgroundColor: "#000000",
    gap: 100,
    scrollSpeed: 20,
    stretchY: 50,
    stretchX: 30,
    falloff: 50,
    bloom: 30,
    chromaticStrength: 25,
}

addPropertyControls(TDF_WebGLTextTunnel, {
    text: {
        title: "Text",
        description:
            "Displayed static on the canvas to ensure best performance. See full effects in Preview or Publish",
        type: ControlType.String,
        displayTextArea: true,
        defaultValue: "designed imperfect.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            variant: "Bold",
            fontSize: 60,
            letterSpacing: 0,
            textAlign: "center",
        },
        displayTextAlignment: true,
        controls: "extended",
    },
    textColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    gap: {
        title: "Gap",
        type: ControlType.Number,
        defaultValue: 100,
        min: 0,
        max: 500,
        unit: "px",
    },
    scrollSpeed: {
        title: "AnimationSpeed",
        type: ControlType.Number,
        defaultValue: 20,
        min: 0,
        max: 100,
        unit: "%",
    },
    stretchY: {
        title: "Stretch Y",
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
        step: 0.1,
    },
    stretchX: {
        title: "Stretch X",
        type: ControlType.Number,
        defaultValue: 30,
        min: 0,
        max: 100,
        unit: "%",
        step: 0.1,
    },

    falloff: {
        title: "Falloff",
        type: ControlType.Number,
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
    },
    bloom: {
        title: "Bloom",
        type: ControlType.Number,
        defaultValue: 30,
        min: 0,
        max: 100,
        unit: "%",
    },
    chromaticStrength: {
        title: "Chromatic",
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
        type: ControlType.Number,
        defaultValue: 25,
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
    },
})
