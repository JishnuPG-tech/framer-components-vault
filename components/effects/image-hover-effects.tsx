import * as React from "react"
import { useEffect, useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FitMode = "Fill" | "Fit" | "Crop" | "Tile"

type Props = {
    image: string
    effect:
        | "Actuator"
        | "Random"
        | "Uplinking"
        | "Half Time"
        | "Operator"
        | "Remote"
        | "Slurbt"
        | "Cybark"
        | "Alt Touch"
    amplitude: number
    speed: number
    intensity: number
    rgbSplit: number
    motionBlur: number
    fitMode: FitMode
    scale: number
    posX: number
    posY: number
    hover: boolean
    scrollScrub: boolean
    scrubStrength: number
}

const THREE_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
const GSAP_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"

function loadScript(src: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            `script[data-${key}]`
        )
        if (existing) {
            const ok =
                (key === "three" && (window as any).THREE) ||
                (key === "gsap" && (window as any).gsap)
            if (ok) return resolve()
            existing.addEventListener("load", () => resolve(), { once: true })
            existing.addEventListener("error", () => reject(), { once: true })
            return
        }
        const s = document.createElement("script")
        s.src = src
        s.async = true
        s.dataset[key] = "1"
        s.onload = () => resolve()
        s.onerror = () => reject()
        document.head.appendChild(s)
    })
}

async function loadThreeAndGsap(): Promise<{ THREE: any; gsap: any } | null> {
    await Promise.all([
        loadScript(THREE_CDN, "three"),
        loadScript(GSAP_CDN, "gsap"),
    ])
    const w = window as any
    if (!w.THREE || !w.gsap) return null
    return { THREE: w.THREE, gsap: w.gsap }
}

function effectToIndex(effect: Props["effect"]): number {
    switch (effect) {
        case "Actuator":
            return 0
        case "Random":
            return 1
        case "Uplinking":
            return 2
        case "Half Time":
            return 3
        case "Operator":
            return 4
        case "Remote":
            return 5
        case "Slurbt":
            return 6
        case "Cybark":
            return 7
        case "Alt Touch":
            return 8
        default:
            return 0
    }
}

function fitModeToInt(mode: FitMode): number {
    switch (mode) {
        case "Fill":
            return 0
        case "Fit":
            return 1
        case "Crop":
            return 2
        case "Tile":
            return 3
        default:
            return 0
    }
}

const vertexShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uProg;
uniform float uEffectIndex;

uniform float uRGBSplit;
uniform float uMotionBlur;

uniform vec2 uScale;
uniform vec2 uOffset;
uniform int uFitMode;

float rand(float n){ return fract(sin(n) * 43758.5453123); }

vec2 safeUv(vec2 uv){
  if (uFitMode == 3) return fract(uv);
  return clamp(uv, 0.001, 0.999);
}

vec2 applyFit(vec2 uv){
  uv = (uv - 0.5) * uScale + 0.5 + uOffset;
  return safeUv(uv);
}

vec4 tex(vec2 uv){
  return texture2D(uTexture, safeUv(uv));
}

void main() {
  vec2 uv0 = vUv;
  vec2 uv = applyFit(uv0);

  float e = uEffectIndex;
  float t = uTime;
  float p = uProg;

  vec2 duv = uv;

  if (e < 0.5) {
    float off = sin(uv.y * 10.0 + t * 1.4) * 0.03 * p;
    duv.x += off;
  } else if (e < 1.5) {
    float offX = sin(uv.y * 16.0 + t * 1.7) * 0.025 * p;
    float offY = cos(uv.x * 10.0 + t * 1.3) * 0.02 * p;
    duv += vec2(offX, offY);
  } else if (e < 2.5) {
    float swirl = sin((uv.x + uv.y) * 12.0 + t * 1.8) * 0.03 * p;
    duv += vec2(swirl, -swirl * 0.5);
  } else if (e < 3.5) {
    float stripes = 10.0;
    float band = floor(uv.y * stripes);
    float dir = mod(band, 2.0) * 2.0 - 1.0;
    float shift = dir * 0.06 * p;
    duv.x += shift;
    duv.y += sin(uv.x * 10.0 + t * 1.6) * 0.01 * p;
  } else if (e < 4.5) {
    float stripes = 16.0;
    float band = floor(uv.y * stripes);
    float dir = mod(band, 2.0) * 2.0 - 1.0;
    float shift = dir * 0.035 * p;
    duv.x += shift;
  } else if (e < 5.5) {
    float stripes = 28.0;
    float band = floor(uv.y * stripes);
    float s = rand(band + floor(t * 6.0));
    float dir = (step(0.5, s) * 2.0 - 1.0);
    float amt = mix(0.02, 0.09, rand(band * 1.7 + 13.0));
    float wob = sin(uv.x * 12.0 + t * 2.2 + band) * 0.007;
    duv.x += dir * amt * p;
    duv.y += wob * p;
  } else if (e < 6.5) {
    float jitter = (rand(uv.y * 120.0 + t * 30.0) - 0.5) * 0.05 * p;
    duv.x += jitter;
  } else if (e < 7.5) {
    float band = floor(uv.y * 40.0);
    float barJitter = (rand(band + t * 5.0) - 0.5) * 0.07 * p;
    duv.x += barJitter;
  } else {
    float jitter = (rand(uv.y * 200.0 + t * 40.0) - 0.5) * 0.09 * p;
    duv.x += jitter;
  }

  duv = applyFit(duv);

  float split = uRGBSplit * p;

  vec2 rUv = duv + vec2(split, 0.0);
  vec2 gUv = duv;
  vec2 bUv = duv + vec2(-split, 0.0);

  vec4 cR = tex(rUv);
  vec4 cG = tex(gUv);
  vec4 cB = tex(bUv);

  vec3 col = vec3(cR.r, cG.g, cB.b);

  if (uMotionBlur > 0.0 && p > 0.0) {
    vec2 blurDir = vec2(0.0, 0.004) * uMotionBlur * p;
    vec3 acc = col;
    acc += tex(duv + blurDir *  1.0).rgb;
    acc += tex(duv + blurDir * -1.0).rgb;
    acc += tex(duv + blurDir *  2.0).rgb;
    acc += tex(duv + blurDir * -2.0).rgb;
    acc /= 5.0;
    col = mix(col, acc, 0.7);
  }

  gl_FragColor = vec4(col, 1.0);
}
`

export default function WaveMotionHoverPro(props: Props) {
    const {
        image,
        effect,
        amplitude,
        speed,
        intensity,
        rgbSplit,
        motionBlur,
        fitMode,
        scale,
        posX,
        posY,
        hover,
        scrollScrub,
        scrubStrength,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const rendererRef = useRef<any>(null)
    const sceneRef = useRef<any>(null)
    const cameraRef = useRef<any>(null)
    const meshRef = useRef<any>(null)
    const materialRef = useRef<any>(null)
    const textureRef = useRef<any>(null)
    const rafRef = useRef<number | null>(null)
    const hoverTweenRef = useRef<any>(null)
    const scrubTweenRef = useRef<any>(null)
    const roRef = useRef<ResizeObserver | null>(null)
    const ioRef = useRef<IntersectionObserver | null>(null)

    const texAspectRef = useRef(1)
    const planeAspectRef = useRef(1)

    const applyUvTransform = useMemo(() => {
        return () => {
            const mat = materialRef.current
            const cont = containerRef.current
            if (!mat || !cont) return

            const w = Math.max(1, cont.clientWidth || 1)
            const h = Math.max(1, cont.clientHeight || 1)
            const planeAspect = w / h
            planeAspectRef.current = planeAspect

            const imgAspect = texAspectRef.current || 1
            const z = Math.max(0.1, scale || 1)

            let sx = 1
            let sy = 1

            if (fitMode === "Tile") {
                sx = (planeAspect / imgAspect) * z
                sy = z
            } else if (fitMode === "Fill") {
                sx = z
                sy = z
            } else if (fitMode === "Fit") {
                if (planeAspect > imgAspect) {
                    sx = (imgAspect / planeAspect) * z
                    sy = z
                } else {
                    sx = z
                    sy = (planeAspect / imgAspect) * z
                }
            } else {
                if (planeAspect > imgAspect) {
                    sx = z
                    sy = (planeAspect / imgAspect) * z
                } else {
                    sx = (imgAspect / planeAspect) * z
                    sy = z
                }
            }

            mat.uniforms.uScale.value.set(sx, sy)
            mat.uniforms.uOffset.value.set(
                (posX || 0) * 0.25,
                (posY || 0) * 0.25
            )
            mat.uniforms.uFitMode.value = fitModeToInt(fitMode)
            mat.needsUpdate = true
        }
    }, [fitMode, scale, posX, posY])

    useEffect(() => {
        let dead = false

        loadThreeAndGsap()
            .then((loaded) => {
                if (!loaded || dead) return
                const { THREE, gsap } = loaded
                const container = containerRef.current
                if (!container) return

                const w = Math.max(1, container.clientWidth || 1)
                const h = Math.max(1, container.clientHeight || 1)
                const aspect = w / h
                planeAspectRef.current = aspect

                const scene = new THREE.Scene()
                sceneRef.current = scene

                const camera = new THREE.OrthographicCamera(
                    -aspect,
                    aspect,
                    1,
                    -1,
                    0.1,
                    10
                )
                camera.position.z = 2
                cameraRef.current = camera

                const renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true,
                })
                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, 2)
                )
                renderer.setClearColor(0x000000, 0)
                renderer.setSize(w, h)
                renderer.domElement.style.width = "100%"
                renderer.domElement.style.height = "100%"
                renderer.domElement.style.display = "block"
                rendererRef.current = renderer
                container.appendChild(renderer.domElement)

                const geometry = new THREE.PlaneGeometry(2 * aspect, 2, 80, 80)

                const material = new THREE.ShaderMaterial({
                    uniforms: {
                        uTime: { value: 0 },
                        uProg: { value: 0 },
                        uEffectIndex: { value: effectToIndex(effect) },
                        uRGBSplit: { value: rgbSplit },
                        uMotionBlur: { value: motionBlur },
                        uScale: { value: new THREE.Vector2(1, 1) },
                        uOffset: { value: new THREE.Vector2(0, 0) },
                        uFitMode: { value: fitModeToInt(fitMode) },
                        uTexture: { value: null },
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                })

                materialRef.current = material

                const mesh = new THREE.Mesh(geometry, material)
                meshRef.current = mesh
                scene.add(mesh)

                const loader = new THREE.TextureLoader()
                if (image) {
                    loader.load(image, (tex: any) => {
                        tex.minFilter = THREE.LinearFilter
                        tex.magFilter = THREE.LinearFilter
                        tex.generateMipmaps = false
                        tex.wrapS =
                            fitMode === "Tile"
                                ? THREE.RepeatWrapping
                                : THREE.ClampToEdgeWrapping
                        tex.wrapT =
                            fitMode === "Tile"
                                ? THREE.RepeatWrapping
                                : THREE.ClampToEdgeWrapping
                        textureRef.current = tex
                        material.uniforms.uTexture.value = tex
                        if (tex.image && tex.image.width && tex.image.height) {
                            texAspectRef.current =
                                tex.image.width / tex.image.height
                        } else {
                            texAspectRef.current = 1
                        }
                        applyUvTransform()
                        material.needsUpdate = true
                    })
                }

                const start = performance.now()
                const tick = () => {
                    const r = rendererRef.current
                    const s = sceneRef.current
                    const c = cameraRef.current
                    const m = materialRef.current
                    if (!r || !s || !c || !m) return
                    const now = performance.now()
                    m.uniforms.uTime.value = ((now - start) / 1000) * speed
                    r.render(s, c)
                    rafRef.current = requestAnimationFrame(tick)
                }
                tick()

                const uniforms = material.uniforms

                const go = (v: number) => {
                    if (!gsap) return
                    if (hoverTweenRef.current) hoverTweenRef.current.kill()
                    hoverTweenRef.current = gsap.to(uniforms.uProg, {
                        value: v,
                        duration: v > 0 ? 0.9 : 0.8,
                        ease: "expo.out",
                    })
                }

                const onEnter = () => go(amplitude * intensity)
                const onLeave = () => go(0)

                if (hover) {
                    container.addEventListener("pointerenter", onEnter)
                    container.addEventListener("pointerleave", onLeave)
                }

                roRef.current = new ResizeObserver(() => {
                    const ww = Math.max(1, container.clientWidth || 1)
                    const hh = Math.max(1, container.clientHeight || 1)
                    const asp = ww / hh
                    planeAspectRef.current = asp

                    camera.left = -asp
                    camera.right = asp
                    camera.top = 1
                    camera.bottom = -1
                    camera.updateProjectionMatrix()

                    mesh.geometry.dispose()
                    mesh.geometry = new THREE.PlaneGeometry(2 * asp, 2, 80, 80)

                    renderer.setSize(ww, hh)
                    applyUvTransform()
                })
                roRef.current.observe(container)

                if (scrollScrub && "IntersectionObserver" in window) {
                    ioRef.current = new IntersectionObserver(
                        (entries) => {
                            const entry = entries[0]
                            if (!entry || !gsap || !materialRef.current) return
                            const r =
                                Math.max(
                                    0,
                                    Math.min(1, entry.intersectionRatio)
                                ) * Math.max(0, scrubStrength)
                            if (scrubTweenRef.current)
                                scrubTweenRef.current.kill()
                            scrubTweenRef.current = gsap.to(
                                materialRef.current.uniforms.uProg,
                                {
                                    value: amplitude * intensity * r,
                                    duration: 0.6,
                                    ease: "expo.out",
                                }
                            )
                        },
                        { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
                    )
                    ioRef.current.observe(container)
                }

                applyUvTransform()

                return () => {
                    if (hover) {
                        container.removeEventListener("pointerenter", onEnter)
                        container.removeEventListener("pointerleave", onLeave)
                    }
                }
            })
            .catch(() => {})

        return () => {
            dead = true

            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null

            if (ioRef.current) ioRef.current.disconnect()
            ioRef.current = null

            if (roRef.current) roRef.current.disconnect()
            roRef.current = null

            const renderer = rendererRef.current
            const mesh = meshRef.current
            const scene = sceneRef.current

            if (mesh && scene) {
                if (mesh.geometry) mesh.geometry.dispose()
                if (mesh.material) mesh.material.dispose()
                scene.remove(mesh)
            }

            if (textureRef.current) {
                textureRef.current.dispose()
                textureRef.current = null
            }

            if (renderer) {
                renderer.dispose()
                if (renderer.domElement?.parentNode) {
                    renderer.domElement.parentNode.removeChild(
                        renderer.domElement
                    )
                }
            }

            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
            meshRef.current = null
            materialRef.current = null
        }
    }, [])

    useEffect(() => {
        const mat = materialRef.current
        if (!mat) return
        mat.uniforms.uEffectIndex.value = effectToIndex(effect)
    }, [effect])

    useEffect(() => {
        const mat = materialRef.current
        if (!mat) return
        mat.uniforms.uRGBSplit.value = rgbSplit
        mat.uniforms.uMotionBlur.value = motionBlur
    }, [rgbSplit, motionBlur])

    useEffect(() => {
        const w = (window as any).THREE
        const mat = materialRef.current
        if (!w || !mat) return
        mat.uniforms.uFitMode.value = fitModeToInt(fitMode)
        if (textureRef.current) {
            textureRef.current.wrapS =
                fitMode === "Tile" ? w.RepeatWrapping : w.ClampToEdgeWrapping
            textureRef.current.wrapT =
                fitMode === "Tile" ? w.RepeatWrapping : w.ClampToEdgeWrapping
            textureRef.current.needsUpdate = true
        }
        applyUvTransform()
    }, [fitMode, scale, posX, posY, applyUvTransform])

    useEffect(() => {
        const w = (window as any).THREE
        const mat = materialRef.current
        if (!w || !mat || !image) return
        const loader = new w.TextureLoader()
        loader.load(image, (tex: any) => {
            tex.minFilter = w.LinearFilter
            tex.magFilter = w.LinearFilter
            tex.generateMipmaps = false
            tex.wrapS =
                fitMode === "Tile" ? w.RepeatWrapping : w.ClampToEdgeWrapping
            tex.wrapT =
                fitMode === "Tile" ? w.RepeatWrapping : w.ClampToEdgeWrapping
            if (textureRef.current) textureRef.current.dispose()
            textureRef.current = tex
            mat.uniforms.uTexture.value = tex
            if (tex.image && tex.image.width && tex.image.height) {
                texAspectRef.current = tex.image.width / tex.image.height
            } else {
                texAspectRef.current = 1
            }
            applyUvTransform()
            mat.needsUpdate = true
        })
    }, [image])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
        />
    )
}

WaveMotionHoverPro.defaultProps = {
    width: 400,
    height: 600,
    image: "",
    effect: "Actuator",
    amplitude: 1,
    speed: 1,
    intensity: 1,
    rgbSplit: 0.008,
    motionBlur: 0.7,
    fitMode: "Crop",
    scale: 1,
    posX: 0,
    posY: 0,
    hover: true,
    scrollScrub: false,
    scrubStrength: 1,
}

addPropertyControls(WaveMotionHoverPro, {
    image: { type: ControlType.Image, title: "Image" },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: [
            "Actuator",
            "Random",
            "Uplinking",
            "Half Time",
            "Operator",
            "Remote",
            "Slurbt",
            "Cybark",
            "Alt Touch",
        ],
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["Crop", "Fit", "Fill", "Tile"],
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.25,
        max: 4,
        step: 0.05,
    },
    posX: {
        type: ControlType.Number,
        title: "Pos X",
        min: -1,
        max: 1,
        step: 0.01,
    },
    posY: {
        type: ControlType.Number,
        title: "Pos Y",
        min: -1,
        max: 1,
        step: 0.01,
    },
    amplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        min: 0,
        max: 2,
        step: 0.05,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 3,
        step: 0.05,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 3,
        step: 0.05,
    },
    rgbSplit: {
        type: ControlType.Number,
        title: "RGB Split",
        min: 0,
        max: 0.05,
        step: 0.001,
    },
    motionBlur: {
        type: ControlType.Number,
        title: "Motion Blur",
        min: 0,
        max: 2,
        step: 0.05,
    },
    hover: {
        type: ControlType.Boolean,
        title: "Hover",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollScrub: {
        type: ControlType.Boolean,
        title: "Scroll",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrubStrength: {
        type: ControlType.Number,
        title: "Scrub",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.scrollScrub,
    },
})
