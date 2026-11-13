"use client"

import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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

// ---------- Types ----------
type FramerFont = string | { [k: string]: any }
type NodeItem = { label: string; link?: string }

type Props = {
    nodes: NodeItem[]
    textColor: string
    hoverColor: string
    font: FramerFont
    fontSize: number
    letterSpacingPx: number
    gapPx: number
    curveRadius: number
    tiltX: number
    tiltZ: number
    camZoom: number
    camY: number
    autoRotate: number
    dragDamping: number
    scrollSpeed: number
    minBackOpacity: number
    stopInEditor: boolean
    maxDPR: number
    aniso: number
    width?: number
    height?: number
    style?: React.CSSProperties
}

// ---------- Constants ----------
const PX_TO_WORLD = 1 / 100
const Z_SEP = 0.05 // increased from 0.01 to fix Z-fighting quiver
const MAX_PIXELS = 1.2e6
const BLEND_WIDTH = 0.05

const tmpN = new THREE.Vector3()

// ---------- Helpers ----------
function fontFamilyOf(font: FramerFont): string {
    if (typeof font === "string") return font
    return (font as any)?.family || (font as any)?.fontFamily || "Inter"
}
function fontWeightOf(font: FramerFont, fallback = 800): number {
    if (typeof font === "object") {
        const w = (font as any).fontWeight ?? (font as any).weight
        if (typeof w === "number") return w
        if (typeof w === "string") {
            const n = parseInt(w, 10)
            if (!isNaN(n)) return n
        }
    }
    return fallback
}
function cssFont(font: FramerFont, weight: number, px: number) {
    const fam = fontFamilyOf(font)
    let q = fam

    if (!/[",]/.test(fam) && /\s/.test(fam)) q = `"${fam}"`
    const w = Math.round(weight) || 400
    return `${w} ${px}px ${q}`
}

function fitDPR(w: number, h: number, maxDPR: number) {
    const pr = window.devicePixelRatio || 1
    const pxCap = Math.sqrt(MAX_PIXELS / Math.max(1, w * h))
    return Math.max(1, Math.min(pr, maxDPR, pxCap))
}

function makeGlyphTexture(
    ch: string,
    sizePx: number,
    family: string,
    weight: number,
    aniso: number
) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const scaledPx = sizePx * dpr

    const m = document.createElement("canvas").getContext("2d")!
    m.font = `${weight} ${scaledPx}px ${family}`

    const pad = Math.ceil(Math.max(2, scaledPx * 0.02))
    const innerWScaled = Math.max(2, Math.ceil(m.measureText(ch).width))
    const w = innerWScaled + pad * 2
    const h = Math.ceil(scaledPx * 1.6)

    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    const g = c.getContext("2d")!
    g.clearRect(0, 0, w, h)
    g.fillStyle = "#ffffff"
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.font = `${weight} ${scaledPx}px ${family}`
    g.imageSmoothingEnabled = true
    g.imageSmoothingQuality = "high"
    g.fillText(ch, w / 2, h / 2 + scaledPx * 0.06)

    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping

    tex.anisotropy = aniso
    tex.needsUpdate = true

    return { texture: tex, w, h, pad, innerW: innerWScaled / dpr, dpr }
}

// ---------- Shaders ----------
const vshader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBend; 
  void main(){
    vUv = uv;
    vec3 p = position;
    float k = uBend;
    if (abs(k) > 1e-6) {
      float r = 1.0 / k;
      float th = p.x * k;
      p.x = sin(th) * r;
      p.z += r - cos(th) * r;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
  }
`
const fshader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float uOpacity;
  uniform vec3 uColor;
  uniform float uMirror; 
  void main(){
    vec2 uv = mix(vUv, vec2(1.0 - vUv.x, vUv.y), uMirror);
    vec4 c = texture2D(map, uv);
    if (c.a < 0.01) discard;
    gl_FragColor = vec4(uColor, c.a * uOpacity);
  }
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */
export default function Menu3D(props: Props) {
    const {
        nodes,
        textColor,
        hoverColor,
        font,
        fontSize,
        letterSpacingPx,
        gapPx,
        curveRadius,
        tiltX,
        tiltZ,
        camZoom,
        camY,
        autoRotate,
        dragDamping,
        scrollSpeed,
        minBackOpacity,
        stopInEditor,
        maxDPR,
        aniso,
        width,
        height,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const items = React.useMemo(
        () =>
            Array.isArray(nodes)
                ? nodes.filter((n) => n && typeof n.label === "string")
                : [],
        [nodes]
    )

    if (isStatic) {
        return <Menu3DStatic {...props} items={items} />
    }

    return <Menu3DLive {...props} items={items} />
}

// ---------- Static renderer ----------
function Menu3DStatic(props: Props & { items: NodeItem[] }) {
    const {
        items,
        textColor,
        font,
        fontSize,
        letterSpacingPx,
        gapPx,
        curveRadius,
        tiltX,
        tiltZ,
        camZoom,
        camY,
        minBackOpacity,
        maxDPR,
        aniso,
        width,
        height,
        style,
    } = props

    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const W =
            canvas.parentElement?.offsetWidth || ((width ?? 800) as number)
        const H =
            canvas.parentElement?.offsetHeight || ((height ?? 800) as number)
        const dpr = Math.min(window.devicePixelRatio || 1, Math.max(1, maxDPR))

        canvas.width = W * dpr
        canvas.height = H * dpr

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: "low-power",
            preserveDrawingBuffer: true,
        })
        renderer.setPixelRatio(dpr)
        // Pass false to prevent ThreeJS from hardcoding inline px styles over CSS
        renderer.setSize(W, H, false)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        renderer.setClearColor(0x000000, 0)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(28, W / H, 0.5, 1000)
        const camZ = 35 / Math.max(0.05, camZoom)
        camera.position.set(0, camY, camZ)
        camera.lookAt(0, 0, 0)

        const belt = new THREE.Group()
        belt.rotation.x = THREE.MathUtils.degToRad(tiltX)
        belt.rotation.z = THREE.MathUtils.degToRad(tiltZ)
        scene.add(belt)

        const family = fontFamilyOf(font)
        const weight = fontWeightOf(font)
        const lsWorld = letterSpacingPx * PX_TO_WORLD
        const gapWorld = gapPx * PX_TO_WORLD
        const r = Math.max(0, curveRadius)
        const uBendVal = r > 1e-4 ? 1 / r : 0
        const uBend = { value: uBendVal }
        const maxAniso = renderer.capabilities.getMaxAnisotropy()
        const colorBase = new THREE.Color(textColor)

        const makeMat = (tex: THREE.Texture, mirror: 0 | 1, poly: number) =>
            new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: tex },
                    uOpacity: { value: 1.0 },
                    uColor: { value: colorBase },
                    uMirror: { value: mirror },
                    uBend,
                },
                vertexShader: vshader,
                fragmentShader: fshader,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide,
                alphaTest: 0.01,
                polygonOffset: true,
                polygonOffsetFactor: poly,
                polygonOffsetUnits: poly,
            })

        type GlyphLayer = {
            mesh: THREE.Mesh
            W: number
            H: number
            offset: number
        }
        const words: {
            front: GlyphLayer[]
            back: GlyphLayer[]
            width: number
        }[] = []

        for (const it of items) {
            const front: GlyphLayer[] = []
            const back: GlyphLayer[] = []

            for (const ch of [...(it.label || "")]) {
                const {
                    texture,
                    w: tw,
                    h: th,
                    pad,
                    innerW,
                    dpr: glyphDpr,
                } = makeGlyphTexture(
                    ch,
                    fontSize,
                    family,
                    weight,
                    Math.min(Math.max(1, aniso), maxAniso)
                )
                const Wg = innerW * PX_TO_WORLD
                const Hg = (th / glyphDpr) * PX_TO_WORLD
                const u0 = pad / tw
                const u1 = 1 - pad / tw

                const makePlane = () => {
                    const geo = new THREE.PlaneGeometry(Wg, Hg, 1, 1)
                    const uv = geo.getAttribute("uv") as THREE.BufferAttribute
                    for (let i = 0; i < uv.count; i++) {
                        uv.setXY(i, u0 + (u1 - u0) * uv.getX(i), uv.getY(i))
                    }
                    uv.needsUpdate = true
                    return geo
                }

                const mF = new THREE.Mesh(makePlane(), makeMat(texture, 0, +1))
                const mB = new THREE.Mesh(makePlane(), makeMat(texture, 1, -1))
                front.push({ mesh: mF, W: Wg, H: Hg, offset: 0 })
                back.push({ mesh: mB, W: Wg, H: Hg, offset: 0 })
                belt.add(mF)
                belt.add(mB)
            }
            words.push({ front, back, width: 0 })
        }

        const measureLayer = (layer: GlyphLayer[]) => {
            let x = 0
            for (let i = 0; i < layer.length; i++) {
                layer[i].offset = x + layer[i].W / 2
                x += layer[i].W
                if (i < layer.length - 1) x += lsWorld
            }
            return x
        }

        const place = (lx: number) => {
            if (Math.abs(uBendVal) < 1e-6)
                return { pos: new THREE.Vector3(lx, 0, 0), rotY: 0 }
            const rad = 1 / uBendVal
            const th = lx / rad
            return {
                pos: new THREE.Vector3(
                    Math.sin(th) * rad,
                    0,
                    Math.cos(th) * rad
                ),
                rotY: th,
            }
        }

        for (const w of words) {
            w.width = measureLayer(w.front)
            measureLayer(w.back)
        }
        const total =
            words.reduce((s, w) => s + w.width, 0) +
            (words.length - 1) * gapWorld
        let s = -total / 2

        for (let wi = 0; wi < words.length; wi++) {
            const w = words[wi]
            const wordMid = s + w.width / 2
            for (const L of w.front) {
                const P = place(wordMid + (L.offset - w.width / 2))
                L.mesh.position.copy(P.pos)
                L.mesh.rotation.set(0, P.rotY, 0)
                L.mesh.position.z += Z_SEP
            }
            for (const L of w.back) {
                const P = place(wordMid - (L.offset - w.width / 2))
                L.mesh.position.copy(P.pos)
                L.mesh.rotation.set(0, P.rotY, 0)
                L.mesh.position.z -= Z_SEP
            }
            s += w.width + (wi < words.length - 1 ? gapWorld : 0)
        }

        const toCam = new THREE.Vector3()
        const wp = new THREE.Vector3()
        const q = new THREE.Quaternion()
        camera.updateMatrixWorld()

        for (const w of words) {
            const mid = w.front[(w.front.length - 1) >> 1]?.mesh
            if (!mid) continue
            mid.getWorldPosition(wp)
            toCam.copy(camera.position).sub(wp).normalize()
            mid.getWorldQuaternion(q)
            tmpN.set(0, 0, 1).applyQuaternion(q)
            const dot = tmpN.dot(toCam)
            const blend = THREE.MathUtils.smoothstep(
                -dot,
                -BLEND_WIDTH,
                BLEND_WIDTH
            )
            const dfWord = Math.max(0, tmpN.dot(toCam))
            const baseA = minBackOpacity + (1 - minBackOpacity) * dfWord
            for (const L of w.front)
                (
                    L.mesh.material as THREE.ShaderMaterial
                ).uniforms.uOpacity.value = (1 - blend) * baseA
            for (const L of w.back)
                (
                    L.mesh.material as THREE.ShaderMaterial
                ).uniforms.uOpacity.value = blend * baseA
        }

        renderer.render(scene, camera)

        // Add Resize Observer to fix stretching in the Editor Canvas
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const w = entry.contentRect.width
            const h = entry.contentRect.height
            if (w === 0 || h === 0) return

            const currentDpr = Math.min(
                window.devicePixelRatio || 1,
                Math.max(1, maxDPR)
            )
            renderer.setPixelRatio(currentDpr)
            renderer.setSize(w, h, false)

            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.render(scene, camera)
        })

        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement)
        }

        return () => {
            resizeObserver.disconnect()
            belt.traverse((obj) => {
                const mesh = obj as THREE.Mesh
                if (mesh.isMesh) {
                    ;(mesh.geometry as any)?.dispose?.()
                    const m = mesh.material
                    if (Array.isArray(m))
                        m.forEach((mm: any) => mm?.dispose?.())
                    else (m as any)?.dispose?.()
                }
            })
            renderer.dispose()
        }
    }, [
        items,
        textColor,
        font,
        fontSize,
        letterSpacingPx,
        gapPx,
        curveRadius,
        tiltX,
        tiltZ,
        camZoom,
        camY,
        minBackOpacity,
        aniso,
        maxDPR,
        width,
        height,
    ])

    return (
        <div style={{ width: width ?? 800, height: height ?? 800, ...style }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

// ---------- Live renderer ----------
function Menu3DLive(props: Props & { items: NodeItem[] }) {
    const {
        items,
        textColor,
        hoverColor,
        font,
        fontSize,
        letterSpacingPx,
        gapPx,
        curveRadius,
        tiltX,
        tiltZ,
        camZoom,
        camY,
        autoRotate,
        dragDamping,
        scrollSpeed,
        minBackOpacity,
        stopInEditor,
        maxDPR,
        aniso,
        width,
        height,
        style,
    } = props

    const mountRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const beltRef = useRef<THREE.Group | null>(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const mouseRef = useRef(new THREE.Vector2())
    const visRef = useRef(true)
    const shared = useRef({ uBend: { value: 0 } })

    const colorBase = useMemo(() => new THREE.Color(textColor), [textColor])
    const colorHover = useMemo(() => new THREE.Color(hoverColor), [hoverColor])

    const autoRotateRef = useRef(autoRotate)
    const backMinRef = useRef(minBackOpacity)
    const stopEditorRef = useRef(stopInEditor)
    useEffect(() => void (autoRotateRef.current = autoRotate), [autoRotate])

    useEffect(
        () => void (backMinRef.current = minBackOpacity),
        [minBackOpacity]
    )
    useEffect(() => void (stopEditorRef.current = stopInEditor), [stopInEditor])

    const drag = useRef({ down: false, lastX: 0, vel: 0, moved: false, t0: 0 })
    const hoveredWord = useRef(-1)
    const scrollVel = useRef(0)
    const lastScrollY = useRef(0)

    const fontKey = useMemo(
        () =>
            JSON.stringify({
                fam: fontFamilyOf(font),
                w: fontWeightOf(font),
                s: fontSize,
                ls: letterSpacingPx,
            }),
        [font, fontSize, letterSpacingPx]
    )

    const [fontReadyTick, setFontReadyTick] = useState(0)
    const glyphCacheRef = useRef(new Map<string, any>())
    const maxAnisoRef = useRef(1)

    type GlyphLayer = {
        mesh: THREE.Mesh
        mat: THREE.ShaderMaterial
        W: number
        H: number
        offset: number
    }

    type WordEntry = {
        group: THREE.Group
        front: GlyphLayer[]
        back: GlyphLayer[]
        width: number
        href: string
        blend: number
        scale: number
    }

    const wordsRef = useRef<WordEntry[]>([])
    const hitTargetsRef = useRef<THREE.Object3D[]>([])
    const hoverReq = useRef<{ x: number; y: number } | null>(null)

    useEffect(() => {
        for (const v of glyphCacheRef.current.values()) v.texture.dispose()
        glyphCacheRef.current.clear()
    }, [fontKey])

    function getGlyphTexture(
        ch: string,
        sizePx: number,
        family: string,
        weight: number
    ) {
        const key = `${ch}|${sizePx}|${family}|${weight}`
        let rec = glyphCacheRef.current.get(key)
        if (!rec) {
            rec = makeGlyphTexture(
                ch,
                sizePx,
                family,
                weight,
                Math.min(Math.max(1, aniso), maxAnisoRef.current)
            )
            glyphCacheRef.current.set(key, rec)
        }
        return rec
    }

    useLayoutEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const wantAA = (window.devicePixelRatio || 1) < 2
        const renderer = new THREE.WebGLRenderer({
            antialias: wantAA,
            alpha: true,
            premultipliedAlpha: true,
            powerPreference: "high-performance",
        })
        rendererRef.current = renderer
        renderer.shadowMap.enabled = false
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        renderer.setClearColor(0x000000, 0)
        maxAnisoRef.current = renderer.capabilities.getMaxAnisotropy()

        const dpr = fitDPR(
            mount.clientWidth,
            mount.clientHeight,
            Math.max(1, maxDPR)
        )
        renderer.setPixelRatio(dpr)
        // Pass false here to respect CSS layout widths natively
        renderer.setSize(mount.clientWidth, mount.clientHeight, false)
        mount.appendChild(renderer.domElement)

        const el = renderer.domElement
        // Force the canvas element to respect the outer flexbox / dimensions
        el.style.width = "100%"
        el.style.height = "100%"
        el.style.display = "block"
        el.style.cursor = "grab"

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(
            28,
            mount.clientWidth / mount.clientHeight,
            0.5,
            1000
        )
        camera.position.set(0, camY, 0)
        camera.lookAt(0, 0, 20)
        cameraRef.current = camera

        const belt = new THREE.Group()
        beltRef.current = belt
        scene.add(belt)

        const isEditor = RenderTarget.current() === RenderTarget.canvas
        const io = new IntersectionObserver(
            ([e]) => {
                visRef.current = isEditor ? true : e.isIntersecting
            },
            { threshold: 0.05 }
        )
        io.observe(mount)

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current || !rendererRef.current || !cameraRef.current)
                return
            const w = mountRef.current.clientWidth
            const h = mountRef.current.clientHeight
            if (w === 0 || h === 0) return
            rendererRef.current.setPixelRatio(fitDPR(w, h, Math.max(1, maxDPR)))
            // Add false to stop injecting hardcoded inline layout overrides
            rendererRef.current.setSize(w, h, false)
            cameraRef.current.aspect = w / h
            cameraRef.current.updateProjectionMatrix()
        })
        resizeObserver.observe(mount)

        lastScrollY.current = window.scrollY
        const onScroll = () => {
            if (!visRef.current) return
            const dy = window.scrollY - lastScrollY.current
            lastScrollY.current = window.scrollY
            scrollVel.current += dy * 0.005
        }
        window.addEventListener("scroll", onScroll, { passive: true })

        const onDown = (e: PointerEvent) => {
            drag.current.down = true
            drag.current.lastX = e.clientX
            drag.current.vel = 0
            drag.current.moved = false
            drag.current.t0 = performance.now()
            el.setPointerCapture(e.pointerId)
            el.style.cursor = "grabbing"
        }
        const onMove = (e: PointerEvent) => {
            if (!drag.current.down) {
                const rect = el.getBoundingClientRect()
                hoverReq.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                }
                return
            }
            const dx = e.clientX - drag.current.lastX
            drag.current.lastX = e.clientX
            const d = (dx / window.innerWidth) * Math.PI * 1.8
            if (beltRef.current) beltRef.current.rotation.y += d
            drag.current.vel = d / (1 / 60)
            if (Math.abs(dx) > 3) drag.current.moved = true
        }
        const onUp = (e: PointerEvent) => {
            drag.current.down = false
            try {
                el.releasePointerCapture(e.pointerId)
            } catch {}
            el.style.cursor = "grab"
        }
        const onLeave = (e: PointerEvent) => {
            if (drag.current.down) {
                try {
                    el.releasePointerCapture(e.pointerId)
                } catch {}
                drag.current.down = false
                el.style.cursor = "grab"
            }
        }

        el.addEventListener("pointerdown", onDown)
        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerup", onUp)
        el.addEventListener("pointercancel", onUp)
        el.addEventListener("pointerleave", onLeave)

        const onClick = (e: MouseEvent) => {
            if (drag.current.moved && performance.now() - drag.current.t0 > 200)
                return
            if (!cameraRef.current) return
            const rect = el.getBoundingClientRect()
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouseRef.current.y = -(
                ((e.clientY - rect.top) / rect.height) * 2 -
                1
            )
            raycasterRef.current.setFromCamera(
                mouseRef.current,
                cameraRef.current
            )
            const hit = raycasterRef.current.intersectObjects(
                hitTargetsRef.current,
                false
            )[0]
            if (hit) {
                const url = (hit.object as any).userData?.url as string
                if (url) window.location.href = url
            }
        }
        el.addEventListener("click", onClick)

        const toCam = new THREE.Vector3()
        const wp = new THREE.Vector3()
        const q = new THREE.Quaternion()
        let lastT = performance.now()

        let rafId: number
        let cancelled = false

        const tick = (now: number) => {
            if (cancelled) return

            const dt = Math.min(0.05, (now - lastT) / 1000)
            lastT = now

            if (!visRef.current) {
                rafId = requestAnimationFrame(tick)
                return
            }

            const isEditor = RenderTarget.current() === RenderTarget.canvas
            const stop = isEditor && stopEditorRef.current
            const belt = beltRef.current
            const cam = cameraRef.current

            if (belt && cam) {
                if (!drag.current.down && !stop) {
                    const auto = THREE.MathUtils.degToRad(autoRotateRef.current)
                    belt.rotation.y += auto * dt

                    if (Math.abs(drag.current.vel) > 1e-4) {
                        belt.rotation.y += drag.current.vel * dt
                        drag.current.vel *= Math.pow(
                            Math.max(1e-4, dragDamping || 0.06),
                            dt
                        )
                    }

                    if (Math.abs(scrollVel.current) > 1e-4) {
                        belt.rotation.y +=
                            scrollVel.current * (props.scrollSpeed || 1)
                        scrollVel.current *= 0.9
                    }
                }

                if (hoverReq.current) {
                    const { x, y } = hoverReq.current
                    hoverReq.current = null
                    const rect = renderer.domElement.getBoundingClientRect()
                    mouseRef.current.set(
                        (x / rect.width) * 2 - 1,
                        -(y / rect.height) * 2 + 1
                    )
                    raycasterRef.current.setFromCamera(mouseRef.current, cam)
                    const hit = raycasterRef.current.intersectObjects(
                        hitTargetsRef.current,
                        false
                    )[0]
                    hoveredWord.current = hit
                        ? ((hit.object as any).userData.wordIndex ?? -1)
                        : -1
                    renderer.domElement.style.cursor =
                        hoveredWord.current >= 0 ? "pointer" : "grab"
                }

                const words = wordsRef.current
                for (let wi = 0; wi < words.length; wi++) {
                    const W = words[wi]
                    const mid = W.front[(W.front.length - 1) >> 1]?.mesh
                    if (!mid) continue

                    mid.getWorldPosition(wp)
                    toCam.copy(cam.position).sub(wp).normalize()
                    mid.getWorldQuaternion(q)
                    tmpN.set(0, 0, 1).applyQuaternion(q)
                    const dot = tmpN.dot(toCam)

                    const target = THREE.MathUtils.smoothstep(
                        -dot,
                        -BLEND_WIDTH,
                        BLEND_WIDTH
                    )
                    W.blend += (target - W.blend) * Math.min(1, dt * 18)

                    const dfWord = Math.max(0, tmpN.dot(toCam))
                    const baseA =
                        backMinRef.current + (1 - backMinRef.current) * dfWord
                    const isHovered = hoveredWord.current === wi

                    const targetScale = isHovered ? 1.05 : 1.0
                    W.scale += (targetScale - W.scale) * dt * 10
                    W.group.scale.set(W.scale, W.scale, W.scale)

                    const activeColor = isHovered ? colorHover : colorBase
                    const aFront = (1 - W.blend) * baseA
                    const aBack = W.blend * baseA

                    for (const L of W.front) {
                        const mat = L.mat as THREE.ShaderMaterial
                        mat.uniforms.uOpacity.value = aFront
                        mat.uniforms.uColor.value = activeColor
                    }
                    for (const L of W.back) {
                        const mat = L.mat as THREE.ShaderMaterial
                        mat.uniforms.uOpacity.value = aBack
                        mat.uniforms.uColor.value = activeColor
                    }
                }
            }

            renderer.render(scene, cam!)
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)

        return () => {
            cancelled = true
            cancelAnimationFrame(rafId)

            window.removeEventListener("scroll", onScroll)
            el.removeEventListener("pointerdown", onDown)
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerup", onUp)
            el.removeEventListener("pointercancel", onUp)
            el.removeEventListener("pointerleave", onLeave)
            el.removeEventListener("click", onClick)
            io.disconnect()
            resizeObserver.disconnect()

            if (beltRef.current) {
                beltRef.current.traverse((obj) => {
                    const mesh = obj as THREE.Mesh
                    if (mesh.isMesh) {
                        ;(mesh.geometry as any)?.dispose?.()
                        const m = mesh.material
                        if (Array.isArray(m))
                            m.forEach((mm) => (mm as any)?.dispose?.())
                        else (m as any)?.dispose?.()
                    }
                })
            }
            renderer.dispose()
            if (mount.contains(el)) mount.removeChild(el)
        }
    }, [])

    useEffect(() => {
        if (!cameraRef.current) return
        cameraRef.current.position.z = 35 / Math.max(0.05, camZoom)
        cameraRef.current.updateProjectionMatrix()
    }, [camZoom])

    useEffect(() => {
        if (!cameraRef.current) return
        cameraRef.current.position.y = camY
        cameraRef.current.lookAt(0, 0, 0)
    }, [camY])

    useEffect(() => {
        if (!beltRef.current) return
        beltRef.current.rotation.x = THREE.MathUtils.degToRad(tiltX)
        beltRef.current.rotation.z = THREE.MathUtils.degToRad(tiltZ)
    }, [tiltX, tiltZ])

    useEffect(() => {
        const fam = fontFamilyOf(font)
        const weight = fontWeightOf(font)
        const css = cssFont(font, weight, fontSize)
        const fs: any = (document as any).fonts
        let cancelled = false

        try {
            fs?.load?.(css, "BESbswy")
        } catch {}
        const cssCheck = css.replace(/\b\d+px\b/, "16px")
        const tick = () => setFontReadyTick((t) => t + 1)
        const onDone = () => {
            if (!cancelled) tick()
        }
        fs?.addEventListener?.("loadingdone", onDone)

        const timers = [120, 300, 600, 1000, 1500].map((ms) =>
            window.setTimeout(() => {
                if (cancelled) return
                try {
                    if (fs?.check?.(cssCheck, " ")) tick()
                } catch {}
            }, ms)
        )

        return () => {
            cancelled = true
            fs?.removeEventListener?.("loadingdone", onDone)
            timers.forEach(clearTimeout)
        }
    }, [fontKey])

    useEffect(() => {
        if (!rendererRef.current || !beltRef.current) return
        const belt = beltRef.current

        while (belt.children.length) {
            const ch = belt.children.pop() as THREE.Object3D
            if (!ch) break
            ;(ch as any).traverse?.((o: any) => {
                if (o.isMesh) {
                    o.geometry?.dispose?.()
                    const m = o.material
                    if (Array.isArray(m))
                        m.forEach((mm) => (mm as any)?.dispose?.())
                    else (m as any)?.dispose?.()
                }
            })
        }
        wordsRef.current.length = 0
        hitTargetsRef.current.length = 0

        const family = fontFamilyOf(font)
        const weight = fontWeightOf(font)
        const lsWorld = letterSpacingPx * PX_TO_WORLD
        const gapWorld = gapPx * PX_TO_WORLD

        const r = Math.max(0, curveRadius)
        shared.current.uBend.value = r > 1e-4 ? 1 / r : 0

        const makeMat = (tex: THREE.Texture, mirror: 0 | 1, poly: number) =>
            new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: tex },
                    uOpacity: { value: 1.0 },
                    uColor: { value: colorBase },
                    uMirror: { value: mirror },
                    uBend: shared.current.uBend,
                },
                vertexShader: vshader,
                fragmentShader: fshader,
                transparent: true,
                depthWrite: false,
                depthTest: true,
                side: THREE.DoubleSide,
                alphaTest: 0.01,
                polygonOffset: true,
                polygonOffsetFactor: poly,
                polygonOffsetUnits: poly,
            })

        for (let wi = 0; wi < items.length; wi++) {
            const it = items[wi]
            const group = new THREE.Group()
            belt.add(group)

            const front: GlyphLayer[] = []
            const back: GlyphLayer[] = []

            for (const ch of [...(it.label || "")]) {
                const {
                    texture,
                    w: tw,
                    h: th,
                    pad,
                    innerW,
                    dpr: glyphDpr,
                } = getGlyphTexture(ch, fontSize, family, weight)

                const W = innerW * PX_TO_WORLD
                const H = (th / glyphDpr) * PX_TO_WORLD
                const u0 = pad / tw
                const u1 = 1 - pad / tw

                const makeCroppedPlane = () => {
                    const geo = new THREE.PlaneGeometry(W, H, 1, 1)
                    const uv = geo.getAttribute("uv") as THREE.BufferAttribute
                    for (let i = 0; i < uv.count; i++) {
                        const u = uv.getX(i)
                        const v = uv.getY(i)
                        uv.setXY(i, u0 + (u1 - u0) * u, v)
                    }
                    uv.needsUpdate = true
                    return geo
                }

                const geoF = makeCroppedPlane()
                const geoB = makeCroppedPlane()
                const matF = makeMat(texture, 0, +1)
                const matB = makeMat(texture, 1, -1)

                const mF = new THREE.Mesh(geoF, matF)
                const mB = new THREE.Mesh(geoB, matB)
                mF.frustumCulled = true
                mB.frustumCulled = true
                ;(mF as any).userData = { wordIndex: wi, url: it.link || "" }
                ;(mB as any).userData = { wordIndex: wi, url: it.link || "" }

                front.push({ mesh: mF, mat: matF, W, H, offset: 0 })
                back.push({ mesh: mB, mat: matB, W, H, offset: 0 })

                group.add(mF)
                group.add(mB)
            }

            wordsRef.current.push({
                group,
                front,
                back,
                width: 0,
                href: it.link || "",
                blend: 0,
                scale: 1.0,
            })
        }

        function measureLayer(layer: GlyphLayer[]) {
            let x = 0
            for (let i = 0; i < layer.length; i++) {
                const L = layer[i]
                L.offset = x + L.W / 2
                x += L.W
                if (i < layer.length - 1) x += lsWorld
            }
            return x
        }

        function layout() {
            const bend = shared.current.uBend.value
            const place = (lx: number) => {
                if (Math.abs(bend) < 1e-6)
                    return { pos: new THREE.Vector3(lx, 0, 0), rotY: 0 }
                const rad = 1 / bend
                const th = lx / rad
                return {
                    pos: new THREE.Vector3(
                        Math.sin(th) * rad,
                        0,
                        Math.cos(th) * rad
                    ),
                    rotY: th,
                }
            }

            for (const w of wordsRef.current) {
                const wf = measureLayer(w.front)
                measureLayer(w.back)
                w.width = wf
            }

            const total =
                wordsRef.current.reduce((s, w) => s + w.width, 0) +
                (wordsRef.current.length - 1) * gapWorld
            let s = -total / 2

            for (let wi = 0; wi < wordsRef.current.length; wi++) {
                const w = wordsRef.current[wi]
                const wordMid = s + w.width / 2

                for (const L of w.front) {
                    const P = place(wordMid + (L.offset - w.width / 2))
                    L.mesh.position.copy(P.pos)
                    L.mesh.rotation.set(0, P.rotY, 0)
                    L.mesh.position.z += Z_SEP
                }
                for (const L of w.back) {
                    const mirrored = -(L.offset - w.width / 2)
                    const P = place(wordMid + mirrored)
                    L.mesh.position.copy(P.pos)
                    L.mesh.rotation.set(0, P.rotY, 0)
                    L.mesh.position.z -= Z_SEP
                }

                s += w.width + (wi < wordsRef.current.length - 1 ? gapWorld : 0)
            }
        }

        layout()

        hitTargetsRef.current.length = 0
        for (const w of wordsRef.current) {
            for (const L of w.front) hitTargetsRef.current.push(L.mesh)
            for (const L of w.back) hitTargetsRef.current.push(L.mesh)
        }
    }, [
        items,
        fontKey,
        curveRadius,
        gapPx,
        letterSpacingPx,
        aniso,
        fontReadyTick,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: width ?? 800,
                height: height ?? 800,
                outline: "none",
                touchAction: "pan-y",
                ...style,
            }}
        />
    )
}

// ---------- Controls ----------
addPropertyControls(Menu3D, {
    nodes: {
        type: ControlType.Array,
        title: "Nodes",
        description: "Add labels and links to populate your 3D menu ring.",
        defaultValue: [
            { label: "Home", link: "" },
            { label: "About", link: "" },
            { label: "Work", link: "" },
            { label: "AI Labs", link: "" },
            { label: "Contact", link: "" },
            { label: "Experts", link: "" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Item",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "The default color of the unhovered text items.",
        defaultValue: "#EBEBEB",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        description: "The color of the text when hovered with a cursor.",
        defaultValue: "#7DFF12",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        description: "Select the font family and weight for the menu items.",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font px",
        description: "The size of the text characters in pixels.",
        defaultValue: 122,
        min: 24,
        max: 360,
        step: 1,
        displayStepper: true,
    },
    letterSpacingPx: {
        type: ControlType.Number,
        title: "Letter px",
        description: "Adjust the kerning/spacing between individual letters.",
        defaultValue: 1,
        min: -40,
        max: 60,
        step: 1,
    },
    gapPx: {
        type: ControlType.Number,
        title: "Word Gap px",
        description: "The space separating the different menu item labels.",
        defaultValue: 78,
        min: 0,
        max: 400,
        step: 1,
    },
    curveRadius: {
        type: ControlType.Number,
        title: "Radius",
        description:
            "The radius of the 3D ring. Lower numbers bend the text more tightly.",
        defaultValue: 4.55,
        min: 0.5,
        max: 30,
        step: 0.05,
    },
    tiltX: {
        type: ControlType.Number,
        title: "Tilt X (°)",
        description: "Tilt the entire 3D ring forward or backward.",
        defaultValue: 0,
        min: -90,
        max: 90,
        step: 1,
    },
    tiltZ: {
        type: ControlType.Number,
        title: "Tilt Z (°)",
        description: "Tilt the 3D ring diagonally.",
        defaultValue: 0,
        min: -90,
        max: 90,
        step: 1,
    },
    camZoom: {
        type: ControlType.Number,
        title: "Cam Zoom",
        description: "Move the camera closer to or further from the ring.",
        defaultValue: 1.67,
        min: 0.05,
        max: 3,
        step: 0.01,
    },
    camY: {
        type: ControlType.Number,
        title: "Cam Y",
        description:
            "Move the camera up or down relative to the center of the ring.",
        defaultValue: 3.6,
        min: -10,
        max: 10,
        step: 0.1,
    },
    autoRotate: {
        type: ControlType.Number,
        title: "Auto °/s",
        description:
            "The speed at which the menu rotates automatically (degrees per second).",
        defaultValue: 6.7,
        min: -30,
        max: 30,
        step: 0.1,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        description:
            "How much the rotation accelerates when you scroll the page.",
        defaultValue: 0.2,
        min: 0,
        max: 10,
        step: 0.1,
    },
    dragDamping: {
        type: ControlType.Number,
        title: "Drag Damping",
        description:
            "How quickly the spin slows down after you drag and release the ring.",
        defaultValue: 0.3,
        min: 0.01,
        max: 0.3,
        step: 0.01,
    },
    minBackOpacity: {
        type: ControlType.Number,
        title: "Back Min α",
        description:
            "The minimum opacity of the text when it rotates to the back of the ring.",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    stopInEditor: {
        type: ControlType.Boolean,
        title: "Stop in Editor",
        description:
            "Pause the rotation animation while editing on the Framer canvas.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maxDPR: {
        type: ControlType.Number,
        title: "Max DPR",
        description:
            "Cap the Device Pixel Ratio to prevent lag on extremely high-res displays.",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.5,
    },
    aniso: {
        type: ControlType.Number,
        title: "Anisotropy",
        description:
            "Improve text sharpness at oblique angles (higher costs more performance).",
        defaultValue: 4,
        min: 1,
        max: 16,
        step: 1,
    },
})

Menu3D.defaultProps = {
    width: 800,
    height: 800,
}
