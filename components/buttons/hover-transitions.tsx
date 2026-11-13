/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
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
import { gsap } from "gsap"

type FitMode = "Fill" | "Fit" | "Crop" | "Tile"
type Quality = "Low" | "Medium" | "High"

type TransitionPreset =
    | "01 Classic Liquid"
    | "02 Hard Stripes"
    | "03 Swirl Lens"
    | "04 Scanline Jitter"
    | "05 Mosaic Blocks"
    | "06 Turbulent Smoke"
    | "07 Tight Wave"
    | "08 Glitch Spikes"

type Trigger = "Hover" | "Click" | "Auto"
type Direction = "Forward" | "Toggle"

type Props = Partial<FrameProps> & {
    quality: Quality

    imageA: any
    imageB: any
    transition: TransitionPreset

    trigger: Trigger
    direction: Direction
    duration: number
    ease: "Expo Out" | "Power3 Out" | "Sine InOut" | "Linear"
    delay: number
    autoReverse: boolean

    transitionIntensity: number
    angle1: number
    angle2: number

    fitMode: FitMode
    scale: number
    posX: number
    posY: number
}

function getSrc(img: any): string {
    if (!img) return ""
    if (typeof img === "string") return img
    if (typeof img === "object") {
        if ((img as any).src) return (img as any).src
        if ((img as any).url) return (img as any).url
    }
    return ""
}

function fitModeToFloat(mode: FitMode): number {
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

function qualityToDpr(q: Quality): number {
    switch (q) {
        case "Low":
            return 1
        case "Medium":
            return 1.5
        case "High":
            return 2
        default:
            return 1.5
    }
}

function easeToGsap(e: Props["ease"]): string {
    switch (e) {
        case "Expo Out":
            return "expo.out"
        case "Power3 Out":
            return "power3.out"
        case "Sine InOut":
            return "sine.inOut"
        case "Linear":
            return "none"
        default:
            return "expo.out"
    }
}

function presetToKind(p: TransitionPreset): number {
    switch (p) {
        case "01 Classic Liquid":
            return 0
        case "02 Hard Stripes":
            return 1
        case "03 Swirl Lens":
            return 2
        case "04 Scanline Jitter":
            return 3
        case "05 Mosaic Blocks":
            return 4
        case "06 Turbulent Smoke":
            return 5
        case "07 Tight Wave":
            return 6
        case "08 Glitch Spikes":
            return 7
        default:
            return 0
    }
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function makeDispTexture(kind: number, size = 256): THREE.DataTexture {
    const data = new Uint8Array(size * size * 4)
    const rnd = mulberry32(1337 + kind * 999)
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const smooth = (t: number) => t * t * (3 - 2 * t)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const u = x / (size - 1)
            const v = y / (size - 1)

            let r = 0.5
            let g = 0.5

            if (kind === 0) {
                const n1 = Math.sin((u * 12 + v * 3) * Math.PI * 2)
                const n2 = Math.sin(v * 9 * Math.PI * 2 + u * 2)
                r = 0.5 + 0.5 * (0.65 * n1 + 0.35 * n2)
                g = 0.5 + 0.5 * (0.55 * n2 - 0.45 * n1)
            } else if (kind === 1) {
                const stripes = Math.sin(u * 28 * Math.PI * 2) * 0.5 + 0.5
                const wob = Math.sin(v * 6 * Math.PI * 2 + u * 3) * 0.5 + 0.5
                r = 0.35 + 0.65 * stripes
                g = 0.2 + 0.8 * wob
            } else if (kind === 2) {
                const cx = u - 0.5
                const cy = v - 0.5
                const a = Math.atan2(cy, cx)
                const d = Math.sqrt(cx * cx + cy * cy)
                const swirl = Math.sin(a * 6 + d * 18) * 0.5 + 0.5
                r = 0.2 + 0.8 * swirl
                g = 0.2 + 0.8 * (1 - clamp01(d * 1.25))
            } else if (kind === 3) {
                const bands = Math.sin(v * 34 * Math.PI * 2) * 0.5 + 0.5
                const jitter = rnd() * 0.35
                r = clamp01(0.25 + 0.75 * bands + jitter * 0.25)
                g = clamp01(0.2 + 0.8 * (1 - bands) + jitter * 0.2)
            } else if (kind === 4) {
                const cellX = Math.floor(u * 10)
                const cellY = Math.floor(v * 10)
                const id = cellX * 97 + cellY * 131 + kind * 17
                const rr = mulberry32(id)()
                const gg = mulberry32(id + 999)()
                const fu = smooth((u * 10) % 1)
                const fv = smooth((v * 10) % 1)
                r = 0.25 + 0.75 * (rr * (0.35 + 0.65 * fu))
                g = 0.25 + 0.75 * (gg * (0.35 + 0.65 * fv))
            } else if (kind === 5) {
                const n =
                    (Math.sin(u * 18 + v * 12) +
                        Math.sin(u * 7 - v * 15) +
                        Math.sin(u * 23 + v * 9)) /
                    3
                r = 0.5 + 0.5 * n
                g = 0.5 + 0.5 * Math.sin((u + v) * 14 + n * 2)
            } else if (kind === 6) {
                const s = Math.sin(u * 40 * Math.PI * 2) * 0.5 + 0.5
                const p = Math.sin((u + v) * 12 * Math.PI * 2) * 0.5 + 0.5
                r = 0.25 + 0.75 * s
                g = 0.25 + 0.75 * p
            } else {
                const noise = rnd()
                const spike = Math.sin(v * 70 * Math.PI * 2 + u * 4) * 0.5 + 0.5
                r = clamp01(0.2 + 0.8 * (0.65 * spike + 0.35 * noise))
                g = clamp01(0.2 + 0.8 * (0.55 * (1 - spike) + 0.45 * noise))
            }

            const i = (y * size + x) * 4
            data[i + 0] = Math.round(255 * clamp01(r))
            data[i + 1] = Math.round(255 * clamp01(g))
            data[i + 2] = 0
            data[i + 3] = 255
        }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.needsUpdate = true
    return tex
}

const vertexTrans = `
precision mediump float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragTrans = `
precision mediump float;
varying vec2 vUv;

uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D disp;

uniform float dispFactor;
uniform float effectFactor;
uniform float angle1;
uniform float angle2;

uniform vec2 uScale;
uniform vec2 uOffset;
uniform float uFitMode;

vec2 clampUv(vec2 uv){ return clamp(uv, 0.001, 0.999); }

vec2 applyFit(vec2 uv){
  uv -= 0.5;
  uv *= uScale;
  uv += 0.5 + uOffset;
  if (uFitMode > 2.5) uv = fract(uv);
  else uv = clampUv(uv);
  return uv;
}

vec3 srgbToLinear(vec3 c){
  vec3 a = step(vec3(0.04045), c);
  vec3 lo = c / 12.92;
  vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(lo, hi, a);
}

vec3 linearToSrgb(vec3 c){
  c = max(c, vec3(0.0));
  vec3 a = step(vec3(0.0031308), c);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0/2.4)) - 0.055;
  return mix(lo, hi, a);
}

void main() {
  vec2 uv = applyFit(vUv);

  float df = smoothstep(0.0, 1.0, dispFactor);

  vec4 d = texture2D(disp, uv);
  vec2 dispVec = (d.rg * 2.0 - 1.0);

  vec2 dir1 = vec2(cos(angle1), sin(angle1));
  vec2 dir2 = vec2(cos(angle2), sin(angle2));

  float disp1 = dot(dispVec, dir1);
  float disp2 = dot(dispVec, dir2);

  vec2 off1 = dir1 * disp1 * effectFactor;
  vec2 off2 = dir2 * disp2 * effectFactor;

  vec2 uv1 = uv + off1 * df;
  vec2 uv2 = uv - off2 * (1.0 - df);

  uv1 = clampUv(uv1);
  uv2 = clampUv(uv2);

  vec3 c1 = srgbToLinear(texture2D(texture1, uv1).rgb);
  vec3 c2 = srgbToLinear(texture2D(texture2, uv2).rgb);

  vec3 mixed = mix(c1, c2, df);
  vec3 outRgb = linearToSrgb(mixed);

  gl_FragColor = vec4(outRgb, 1.0);
}
`

export default function WaveTransitionPack(props: Props) {
    const {
        quality,
        imageA,
        imageB,
        transition,
        trigger,
        direction,
        duration,
        ease,
        delay,
        autoReverse,
        transitionIntensity,
        angle1,
        angle2,
        fitMode,
        scale,
        posX,
        posY,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const meshRef = useRef<THREE.Mesh | null>(null)
    const materialRef = useRef<THREE.ShaderMaterial | null>(null)
    const rafRef = useRef<number | null>(null)
    const roRef = useRef<ResizeObserver | null>(null)
    const tweenRef = useRef<any>(null)

    const texARef = useRef<THREE.Texture | null>(null)
    const texBRef = useRef<THREE.Texture | null>(null)
    const dispRef = useRef<THREE.Texture | null>(null)

    const planeAspectRef = useRef(1)
    const texAspectRef = useRef(1)

    const stateRef = useRef({ on: false })

    const dispKind = useMemo(() => presetToKind(transition), [transition])

    const qualityRef = useRef(quality)
    const durationRef = useRef(duration)
    const delayRef = useRef(delay)
    const easeRef = useRef(ease)

    useEffect(() => {
        qualityRef.current = quality
    }, [quality])
    useEffect(() => {
        durationRef.current = duration
    }, [duration])
    useEffect(() => {
        delayRef.current = delay
    }, [delay])
    useEffect(() => {
        easeRef.current = ease
    }, [ease])

    function updateUvTransform() {
        const m = materialRef.current
        if (!m) return

        const planeAspect = planeAspectRef.current || 1
        const texAspect = texAspectRef.current || 1
        const s = Math.max(0.1, scale || 1)

        let sx = 1
        let sy = 1

        if (fitMode === "Fill") {
            sx = s
            sy = s
        } else if (fitMode === "Tile") {
            sx = (planeAspect / texAspect) * s
            sy = s
        } else {
            if (planeAspect > texAspect) {
                const r = planeAspect / texAspect
                if (fitMode === "Fit") {
                    sx = s
                    sy = (1 / r) * s
                } else {
                    sx = r * s
                    sy = s
                }
            } else {
                const r = texAspect / planeAspect
                if (fitMode === "Fit") {
                    sx = (1 / r) * s
                    sy = s
                } else {
                    sx = s
                    sy = r * s
                }
            }
        }

        const ox = Math.max(-1, Math.min(1, posX || 0)) * 0.5
        const oy = Math.max(-1, Math.min(1, posY || 0)) * 0.5

        m.uniforms.uScale.value.set(sx, sy)
        m.uniforms.uOffset.value.set(ox, oy)
        m.uniforms.uFitMode.value = fitModeToFloat(fitMode)
        m.needsUpdate = true
    }

    const sizeRef = useRef({ w: 0, h: 0, a: 1 })

    const applySize = (container: HTMLDivElement) => {
        const r = rendererRef.current
        const c = cameraRef.current
        const m = meshRef.current
        if (!r || !c || !m) return

        const rect = container.getBoundingClientRect()
        const w = Math.max(1, rect.width || container.clientWidth || 1)
        const h = Math.max(1, rect.height || container.clientHeight || 1)
        const a = w / h

        const base = qualityToDpr(qualityRef.current)
        const pr = Math.min((window.devicePixelRatio || 1) * base, 3)

        r.setPixelRatio(pr)
        r.setSize(w, h, false)

        if (a !== sizeRef.current.a) {
            planeAspectRef.current = a
            c.left = -a
            c.right = a
            c.top = 1
            c.bottom = -1
            c.updateProjectionMatrix()
            m.geometry.dispose()
            m.geometry = new THREE.PlaneGeometry(2 * a, 2, 1, 1)
        }

        sizeRef.current = { w, h, a }
        updateUvTransform()
    }

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return
        if (rendererRef.current) return

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const rect = container.getBoundingClientRect()
        const w0 = Math.max(1, rect.width || container.clientWidth || 1)
        const h0 = Math.max(1, rect.height || container.clientHeight || 1)
        const a0 = w0 / h0
        planeAspectRef.current = a0
        sizeRef.current = { w: w0, h: h0, a: a0 }

        const camera = new THREE.OrthographicCamera(-a0, a0, 1, -1, 0.1, 10)
        camera.position.z = 2
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
        })
        renderer.setClearColor(0x000000, 0)
        rendererRef.current = renderer

        const canvas = renderer.domElement
        canvas.style.position = "absolute"
        canvas.style.inset = "0"
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"
        container.appendChild(canvas)

        const geometry = new THREE.PlaneGeometry(2 * a0, 2, 1, 1)

        const dispTex = makeDispTexture(dispKind, 256)
        dispRef.current?.dispose?.()
        dispRef.current = dispTex

        const material = new THREE.ShaderMaterial({
            uniforms: {
                dispFactor: { value: 0 },
                effectFactor: { value: transitionIntensity },
                angle1: { value: angle1 },
                angle2: { value: angle2 },
                uScale: { value: new THREE.Vector2(1, 1) },
                uOffset: { value: new THREE.Vector2(0, 0) },
                uFitMode: { value: fitModeToFloat(fitMode) },
                texture1: { value: null },
                texture2: { value: null },
                disp: { value: dispTex },
            },
            vertexShader: vertexTrans,
            fragmentShader: fragTrans,
            transparent: true,
        })
        materialRef.current = material

        const mesh = new THREE.Mesh(geometry, material)
        meshRef.current = mesh
        scene.add(mesh)

        applySize(container)

        const animateTo = (to: number) => {
            const mm = materialRef.current
            if (!mm) return
            if (tweenRef.current) tweenRef.current.kill()
            tweenRef.current = gsap.to(mm.uniforms.dispFactor, {
                value: to,
                duration: Math.max(0.05, durationRef.current),
                delay: Math.max(0, delayRef.current),
                ease: easeToGsap(easeRef.current),
            })
        }

        const forward = () => {
            stateRef.current.on = true
            animateTo(1)
        }
        const back = () => {
            stateRef.current.on = false
            animateTo(0)
        }
        const toggle = () => {
            if (stateRef.current.on) back()
            else forward()
        }

        const onEnter = () => {
            if (direction === "Toggle") toggle()
            else forward()
        }
        const onLeave = () => {
            if (direction === "Toggle") return
            if (autoReverse) back()
        }
        const onClick = () => {
            if (direction === "Toggle") toggle()
            else forward()
        }

        if (trigger === "Hover") {
            container.addEventListener("pointerenter", onEnter)
            container.addEventListener("pointerleave", onLeave)
        } else if (trigger === "Click") {
            container.addEventListener("pointerdown", onClick)
        } else {
            forward()
        }

        let warm = 0
        const tick = () => {
            const r = rendererRef.current
            const s = sceneRef.current
            const c = cameraRef.current
            const el = containerRef.current
            if (!r || !s || !c || !el) return

            if (warm < 12) {
                warm++
                applySize(el)
            }

            r.render(s, c)
            rafRef.current = requestAnimationFrame(tick)
        }
        tick()

        roRef.current = new ResizeObserver(() => {
            const el = containerRef.current
            if (!el) return
            applySize(el)
        })
        roRef.current.observe(container)

        return () => {
            if (trigger === "Hover") {
                container.removeEventListener("pointerenter", onEnter)
                container.removeEventListener("pointerleave", onLeave)
            } else if (trigger === "Click") {
                container.removeEventListener("pointerdown", onClick)
            }

            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null

            if (roRef.current) roRef.current.disconnect()
            roRef.current = null

            if (tweenRef.current) tweenRef.current.kill()
            tweenRef.current = null

            try {
                mesh.geometry.dispose()
            } catch {}
            try {
                material.dispose()
            } catch {}

            ;[texARef.current, texBRef.current, dispRef.current].forEach(
                (t) => {
                    try {
                        t?.dispose?.()
                    } catch {}
                }
            )

            try {
                renderer.dispose()
            } catch {}

            if (renderer.domElement?.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement)
            }

            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
            meshRef.current = null
            materialRef.current = null
        }
    }, [])

    useEffect(() => {
        const m = materialRef.current
        if (!m) return
        m.uniforms.effectFactor.value = transitionIntensity
        m.uniforms.angle1.value = angle1
        m.uniforms.angle2.value = angle2
        m.needsUpdate = true
    }, [transitionIntensity, angle1, angle2])

    useEffect(() => {
        updateUvTransform()
    }, [fitMode, scale, posX, posY])

    useEffect(() => {
        const m = materialRef.current
        if (!m) return
        const tex = makeDispTexture(dispKind, 256)
        dispRef.current?.dispose?.()
        dispRef.current = tex
        m.uniforms.disp.value = tex
        m.needsUpdate = true
    }, [dispKind])

    useEffect(() => {
        const m = materialRef.current
        if (!m) return

        const loader = new THREE.TextureLoader()

        const isPow2 = (n: number) => (n & (n - 1)) === 0 && n !== 0

        const applyCommon = (tex: THREE.Texture) => {
            const r = rendererRef.current
            const maxAniso = r?.capabilities?.getMaxAnisotropy?.() || 1
            const img: any = tex.image
            const w = img?.width || 0
            const h = img?.height || 0
            const webgl2 = (r as any)?.capabilities?.isWebGL2 ? true : false
            const allowMips = webgl2 || (isPow2(w) && isPow2(h))

            tex.generateMipmaps = allowMips
            tex.minFilter = allowMips
                ? THREE.LinearMipmapLinearFilter
                : THREE.LinearFilter
            tex.magFilter = THREE.LinearFilter
            tex.anisotropy = Math.min(8, maxAniso)

            tex.wrapS =
                fitMode === "Tile"
                    ? THREE.RepeatWrapping
                    : THREE.ClampToEdgeWrapping
            tex.wrapT =
                fitMode === "Tile"
                    ? THREE.RepeatWrapping
                    : THREE.ClampToEdgeWrapping

            tex.needsUpdate = true
        }

        const setAspectFromTex = (tex: THREE.Texture) => {
            const img: any = tex.image
            if (img?.width && img?.height)
                texAspectRef.current = img.width / img.height
            else texAspectRef.current = 1
            updateUvTransform()
        }

        const srcA = getSrc(imageA)
        const srcB = getSrc(imageB)

        if (srcA) {
            loader.load(srcA, (tex) => {
                applyCommon(tex)
                texARef.current?.dispose?.()
                texARef.current = tex
                if (m.uniforms.texture1) m.uniforms.texture1.value = tex
                setAspectFromTex(tex)
                m.needsUpdate = true
            })
        } else {
            if (m.uniforms.texture1) m.uniforms.texture1.value = null
        }

        if (srcB) {
            loader.load(srcB, (tex) => {
                applyCommon(tex)
                texBRef.current?.dispose?.()
                texBRef.current = tex
                if (m.uniforms.texture2) m.uniforms.texture2.value = tex
                m.needsUpdate = true
            })
        } else {
            if (m.uniforms.texture2) m.uniforms.texture2.value = null
        }
    }, [imageA, imageB, fitMode])

    return (
        <div
            ref={containerRef}
            style={{
                ...(style as any),
                minWidth: 500,
                minHeight: 500,
                overflow: "hidden",
                position: "relative",
            }}
        />
    )
}

WaveTransitionPack.defaultProps = {
    width: 500,
    height: 500,

    quality: "Medium",

    imageA: "",
    imageB: "",
    transition: "01 Classic Liquid",

    trigger: "Hover",
    direction: "Forward",
    duration: 0.9,
    ease: "Expo Out",
    delay: 0,
    autoReverse: true,

    transitionIntensity: 0.65,
    angle1: Math.PI / 4,
    angle2: -Math.PI / 4,

    fitMode: "Crop",
    scale: 1,
    posX: 0,
    posY: 0,
}

addPropertyControls(WaveTransitionPack, {
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["Low", "Medium", "High"],
    },

    imageA: { type: ControlType.Image, title: "Image A" },
    imageB: { type: ControlType.Image, title: "Image B" },

    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: [
            "01 Classic Liquid",
            "02 Hard Stripes",
            "03 Swirl Lens",
            "04 Scanline Jitter",
            "05 Mosaic Blocks",
            "06 Turbulent Smoke",
            "07 Tight Wave",
            "08 Glitch Spikes",
        ],
    },

    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["Hover", "Click", "Auto"],
    },
    direction: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Forward", "Toggle"],
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.05,
        max: 3,
        step: 0.05,
    },
    ease: {
        type: ControlType.Enum,
        title: "Ease",
        options: ["Expo Out", "Power3 Out", "Sine InOut", "Linear"],
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 1,
        step: 0.01,
    },
    autoReverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => p.trigger !== "Hover" || p.direction !== "Forward",
    },

    transitionIntensity: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 2,
        step: 0.01,
    },
    angle1: {
        type: ControlType.Number,
        title: "Angle 1",
        min: -6.283,
        max: 6.283,
        step: 0.01,
    },
    angle2: {
        type: ControlType.Number,
        title: "Angle 2",
        min: -6.283,
        max: 6.283,
        step: 0.01,
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
})
