import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// @ts-ignore
import * as THREE from "https://esm.sh/three@0.162.0"
// @ts-ignore
import { OrbitControls } from "https://esm.sh/three@0.162.0/examples/jsm/controls/OrbitControls.js"
// @ts-ignore
import { EffectComposer } from "https://esm.sh/three@0.162.0/examples/jsm/postprocessing/EffectComposer.js"
// @ts-ignore
import { RenderPass } from "https://esm.sh/three@0.162.0/examples/jsm/postprocessing/RenderPass.js"
// @ts-ignore
import { UnrealBloomPass } from "https://esm.sh/three@0.162.0/examples/jsm/postprocessing/UnrealBloomPass.js"
// @ts-ignore
import { AfterimagePass } from "https://esm.sh/three@0.162.0/examples/jsm/postprocessing/AfterimagePass.js"
// @ts-ignore
import { OutputPass } from "https://esm.sh/three@0.162.0/examples/jsm/postprocessing/OutputPass.js"

// ─── Shape Generators ─────────────────────────────────────────────────────────

function normalise(points: any[], size: number): any[] {
    if (!points.length) return []
    const box = new THREE.Box3().setFromPoints(points)
    const s = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(s.x, s.y, s.z) || 1
    const centre = box.getCenter(new THREE.Vector3())
    return points.map((p: any) =>
        p
            .clone()
            .sub(centre)
            .multiplyScalar(size / maxDim)
    )
}

function genTorusKnot(n: number): any[] {
    const geo = new THREE.TorusKnotGeometry(10, 3, 200, 16, 2, 3)
    const attr = geo.attributes.position
    const base: any[] = []
    for (let i = 0; i < attr.count; i++)
        base.push(new THREE.Vector3().fromBufferAttribute(attr, i))
    geo.dispose()
    const out: any[] = []
    for (let i = 0; i < n; i++) out.push(base[i % base.length].clone())
    return normalise(out, 50)
}

function genHalvorsen(n: number): any[] {
    const pts: any[] = []
    let x = 0.1,
        y = 0,
        z = 0
    const a = 1.89,
        dt = 0.005
    for (let i = 0; i < n * 25; i++) {
        const dx = -a * x - 4 * y - 4 * z - y * y
        const dy = -a * y - 4 * z - 4 * x - z * z
        const dz = -a * z - 4 * x - 4 * y - x * x
        x += dx * dt
        y += dy * dt
        z += dz * dt
        if (i > 200 && i % 25 === 0) pts.push(new THREE.Vector3(x, y, z))
        if (pts.length >= n) break
    }
    while (pts.length < n)
        pts.push(pts[Math.floor(Math.random() * pts.length)].clone())
    return normalise(pts, 60)
}

function genDualHelix(n: number): any[] {
    const pts: any[] = []
    const turns = 5,
        radius = 15,
        height = 40
    for (let i = 0; i < n; i++) {
        const even = i % 2 === 0
        const angle = (i / n) * Math.PI * 2 * turns
        const y = (i / n) * height - height / 2
        const r = radius + (even ? 5 : -5)
        pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r))
    }
    return normalise(pts, 60)
}

function genDeJong(n: number): any[] {
    const pts: any[] = []
    let x = 0.1,
        y = 0.1
    const a = 1.4,
        b = -2.3,
        c = 2.4,
        d = -2.1
    for (let i = 0; i < n; i++) {
        const xn = Math.sin(a * y) - Math.cos(b * x)
        const yn = Math.sin(c * x) - Math.cos(d * y)
        x = xn
        y = yn
        pts.push(new THREE.Vector3(x, y, Math.sin(x * y * 0.5)))
    }
    return normalise(pts, 55)
}

const PATTERNS = [genTorusKnot, genHalvorsen, genDualHelix, genDeJong]
const PATTERN_NAMES = ["Torus Knot", "Halvorsen", "Dual Helix", "De Jong"]

// ─── Shaders ──────────────────────────────────────────────────────────────────

const STAR_VERT = `
attribute float size;
attribute float random;
varying vec3 vColor;
varying float vRnd;
void main() {
    vColor = color;
    vRnd = random;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (250.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}`

const STAR_FRAG = `
uniform float time;
varying vec3 vColor;
varying float vRnd;
void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = 1.0 - smoothstep(0.4, 0.5, d);
    a *= 0.7 + 0.3 * sin(time * (0.6 + vRnd * 0.3) + vRnd * 5.0);
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor, a);
}`

const PARTICLE_VERT = `
uniform float time;
attribute float size;
attribute vec3 random;
varying vec3 vCol;
varying float vR;
void main() {
    vCol = color;
    vR = random.z;
    vec3 p = position;
    float t = time * 0.25 * random.z;
    float ax = t + random.y;
    float ay = t * 0.75 + random.x;
    float amp = (0.6 + sin(random.x + t * 0.6) * 0.3) * random.z;
    p.x += sin(ax + p.y * 0.06 + random.x * 0.1) * amp;
    p.y += cos(ay + p.z * 0.06 + random.y * 0.1) * amp;
    p.z += sin(ax * 0.85 + p.x * 0.06 + random.z * 0.1) * amp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float pulse = 0.9 + 0.1 * sin(time * 1.15 + random.y);
    gl_PointSize = size * pulse * (350.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}`

const PARTICLE_FRAG = `
uniform float time;
uniform float hueSpeed;
varying vec3 vCol;
varying float vR;
vec3 hueShift(vec3 c, float h) {
    const vec3 k = vec3(0.57735);
    float cosA = cos(h);
    float sinA = sin(h);
    return c * cosA + cross(k, c) * sinA + k * dot(k, c) * (1.0 - cosA);
}
void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.05, 0.0, d);
    float angle = atan(uv.y, uv.x);
    float flare = pow(max(0.0, sin(angle * 6.0 + time * 2.0 * vR)), 4.0);
    flare *= smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.4, 0.1, d);
    float alpha = core + flare * 0.5 + glow * 0.2;
    vec3 color = hueShift(vCol, time * hueSpeed);
    vec3 finalColor = mix(color, vec3(1.0, 0.95, 0.9), core);
    finalColor = mix(finalColor, color, flare * 0.5 + glow * 0.5);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, alpha);
}`

const SPARKLE_VERT = `
uniform float time;
attribute float size;
attribute vec3 random;
void main() {
    vec3 p = position;
    float t = time * 0.25 * random.z;
    float ax = t + random.y;
    float ay = t * 0.75 + random.x;
    float amp = (0.6 + sin(random.x + t * 0.6) * 0.3) * random.z;
    p.x += sin(ax + p.y * 0.06 + random.x * 0.1) * amp;
    p.y += cos(ay + p.z * 0.06 + random.y * 0.1) * amp;
    p.z += sin(ax * 0.85 + p.x * 0.06 + random.z * 0.1) * amp;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
}`

const SPARKLE_FRAG = `
void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = 1.0 - smoothstep(0.4, 0.5, d);
    if (a < 0.01) discard;
    gl_FragColor = vec4(1.0, 1.0, 1.0, a);
}`

// ─── Helper ───────────────────────────────────────────────────────────────────

function applyPattern(
    idx: number,
    particles: any,
    sparkles: any,
    PC: number,
    SC: number
) {
    const pts = PATTERNS[idx](PC)
    const pArr = particles.geometry.attributes.position.array as Float32Array
    const sArr = sparkles.geometry.attributes.position.array as Float32Array
    for (let j = 0; j < PC; j++) {
        const i3 = j * 3
        const p = pts[j] ?? new THREE.Vector3()
        pArr[i3] = p.x
        pArr[i3 + 1] = p.y
        pArr[i3 + 2] = p.z
        if (j < SC) {
            sArr[i3] = p.x
            sArr[i3 + 1] = p.y
            sArr[i3 + 2] = p.z
        }
    }
    particles.geometry.attributes.position.needsUpdate = true
    sparkles.geometry.attributes.position.needsUpdate = true
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function MorphingShapes(props: any) {
    const {
        particleCount,
        sparkCount,
        morphSpeed,
        autoRotate,
        autoRotateSpeed,
        bloomStrength,
        bloomRadius,
        bloomThreshold,
        afterimageDamp,
        hueSpeed,
        showButton,
        buttonLabel,
        showInstructions,
        instructionsText,
        style,
        backgroundColor,
        fogColor,
        fogDensity,
        particleColors,
        particleSize,
        initialPattern,
        showStars,
        starCount,
        cameraDistance,
        autoMorph,
        autoMorphInterval,
        buttonPosition,
        cameraFov,
        showVignette,
        buttonLink,
        buttonBgColor,
        buttonTextColor,
        badgeBgColor,
        badgeTextColor,
        showOverlay,
        overlayTitle,
        overlayTitleFont,
        overlayTitleColor,
        overlaySubtitle,
        overlaySubtitleFont,
        overlaySubtitleColor,
        overlayAlign,
        overlayVertical,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const threeRef = React.useRef<any>(null)
    const rafRef = React.useRef<number>(0)
    const morphStateRef = React.useRef({
        currentPattern: 0,
        isTrans: false,
        prog: 0,
    })
    const pauseRef = React.useRef<boolean>(false)

    // Live-update refs — read inside RAF without stale closure
    const morphSpeedRef = React.useRef<number>(morphSpeed)
    const autoRotateRef = React.useRef<boolean>(autoRotate)
    const autoRotateSpeedRef = React.useRef<number>(autoRotateSpeed)
    const autoMorphRef = React.useRef<boolean>(autoMorph)
    const autoMorphIntervalRef = React.useRef<number>(autoMorphInterval)

    React.useEffect(() => {
        morphSpeedRef.current = morphSpeed
    }, [morphSpeed])
    React.useEffect(() => {
        autoRotateRef.current = autoRotate
    }, [autoRotate])
    React.useEffect(() => {
        autoRotateSpeedRef.current = autoRotateSpeed
    }, [autoRotateSpeed])
    React.useEffect(() => {
        autoMorphRef.current = autoMorph
    }, [autoMorph])
    React.useEffect(() => {
        autoMorphIntervalRef.current = autoMorphInterval
    }, [autoMorphInterval])

    const isStatic = useIsStaticRenderer()

    // Live bloom updates
    React.useEffect(() => {
        if (!threeRef.current) return
        threeRef.current.bloomPass.strength = bloomStrength
        threeRef.current.bloomPass.radius = bloomRadius
        threeRef.current.bloomPass.threshold = bloomThreshold
    }, [bloomStrength, bloomRadius, bloomThreshold])

    // Live afterimage update
    React.useEffect(() => {
        if (!threeRef.current) return
        threeRef.current.afterPass.uniforms.damp.value = afterimageDamp
    }, [afterimageDamp])

    // Live hue speed update
    React.useEffect(() => {
        if (!threeRef.current) return
        threeRef.current.pMat.uniforms.hueSpeed.value = hueSpeed
    }, [hueSpeed])

    // Live camera distance
    React.useEffect(() => {
        if (!threeRef.current?.camera) return
        threeRef.current.camera.position.z = cameraDistance
    }, [cameraDistance])

    // Live fog update
    React.useEffect(() => {
        if (!threeRef.current?.scene?.fog) return
        threeRef.current.scene.fog.color.set(fogColor)
        threeRef.current.scene.fog.density = fogDensity
    }, [fogColor, fogDensity])

    // Live star visibility
    React.useEffect(() => {
        if (!threeRef.current?.starPoints) return
        threeRef.current.starPoints.visible = showStars
    }, [showStars])

    // Live camera FOV
    React.useEffect(() => {
        if (!threeRef.current?.camera) return
        threeRef.current.camera.fov = cameraFov
        threeRef.current.camera.updateProjectionMatrix()
    }, [cameraFov])

    // ── Main scene effect ──────────────────────────────────────────────────────
    React.useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        if (isStatic) return

        const { width, height } = container.getBoundingClientRect()
        const W = width || 800
        const H = height || 500

        const activePalette = (particleColors ?? []).filter(Boolean)
        const PALETTE =
            activePalette.length > 0
                ? activePalette.map((c: string) => new THREE.Color(c))
                : [
                      0xff3c78, 0xff8c00, 0xfff200, 0x00cfff, 0xb400ff,
                      0xffffff, 0xff4040,
                  ].map((c) => new THREE.Color(c))

        // Mobile auto-scaling
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 768
        const effectivePC = isMobile
            ? Math.min(particleCount, 5000)
            : particleCount
        const effectiveSC = isMobile ? Math.min(sparkCount, 500) : sparkCount
        const effectiveStars = isMobile ? Math.min(starCount, 2000) : starCount

        // Scene
        const scene = new THREE.Scene()
        scene.fog = new THREE.FogExp2(fogColor, fogDensity)

        // Camera
        const camera = new THREE.PerspectiveCamera(cameraFov, W / H, 0.1, 2500)
        camera.position.set(0, 0, cameraDistance)

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        })
        renderer.setPixelRatio(Math.min(2, devicePixelRatio))
        renderer.setSize(W, H)

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.screenSpacePanning = false
        controls.minDistance = 20
        controls.maxDistance = 200
        controls.autoRotate = autoRotateRef.current
        controls.autoRotateSpeed = autoRotateSpeedRef.current

        // ── Stars ────────────────────────────────────────────────────────────
        const STAR_COUNT = Math.max(0, effectiveStars)
        const starGeo = new THREE.BufferGeometry()
        const starPos = new Float32Array(STAR_COUNT * 3)
        const starCol = new Float32Array(STAR_COUNT * 3)
        const starSize = new Float32Array(STAR_COUNT)
        const starRnd = new Float32Array(STAR_COUNT)
        for (let i = 0; i < STAR_COUNT; i++) {
            const i3 = i * 3
            const θ = Math.random() * 2 * Math.PI
            const φ = Math.acos(2 * Math.random() - 1)
            const r = 900 * Math.cbrt(Math.random())
            starPos[i3] = r * Math.sin(φ) * Math.cos(θ)
            starPos[i3 + 1] = r * Math.sin(φ) * Math.sin(θ)
            starPos[i3 + 2] = r * Math.cos(φ)
            const c = new THREE.Color().setHSL(
                Math.random() * 0.6,
                0.3 + 0.3 * Math.random(),
                0.55 + 0.35 * Math.random()
            )
            starCol[i3] = c.r
            starCol[i3 + 1] = c.g
            starCol[i3 + 2] = c.b
            starSize[i] = 0.25 + Math.pow(Math.random(), 4) * 2.1
            starRnd[i] = Math.random() * Math.PI * 2
        }
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3))
        starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3))
        starGeo.setAttribute("size", new THREE.BufferAttribute(starSize, 1))
        starGeo.setAttribute("random", new THREE.BufferAttribute(starRnd, 1))
        const starMat = new THREE.ShaderMaterial({
            uniforms: { time: { value: 0 } },
            vertexShader: STAR_VERT,
            fragmentShader: STAR_FRAG,
            transparent: true,
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        })
        const starPoints = new THREE.Points(starGeo, starMat)
        starPoints.visible = showStars
        scene.add(starPoints)

        // ── Particles ────────────────────────────────────────────────────────
        const PC = effectivePC
        const pGeo = new THREE.BufferGeometry()
        const pPos = new Float32Array(PC * 3)
        const pCol = new Float32Array(PC * 3)
        const pSize = new Float32Array(PC)
        const pRnd = new Float32Array(PC * 3)
        for (let i = 0; i < PC; i++) {
            const i3 = i * 3
            const base = PALETTE[Math.floor(Math.random() * PALETTE.length)]
            const hsl: any = { h: 0, s: 0, l: 0 }
            base.getHSL(hsl)
            hsl.h += (Math.random() - 0.5) * 0.05
            hsl.s = Math.min(
                1,
                Math.max(0.7, hsl.s + (Math.random() - 0.5) * 0.3)
            )
            hsl.l = Math.min(
                0.9,
                Math.max(0.5, hsl.l + (Math.random() - 0.5) * 0.4)
            )
            const c = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
            pCol[i3] = c.r
            pCol[i3 + 1] = c.g
            pCol[i3 + 2] = c.b
            pSize[i] = (0.7 + Math.random() * 1.1) * particleSize
            pRnd[i3] = Math.random() * 10
            pRnd[i3 + 1] = Math.random() * Math.PI * 2
            pRnd[i3 + 2] = 0.5 + 0.5 * Math.random()
        }
        pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3))
        pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3))
        pGeo.setAttribute("size", new THREE.BufferAttribute(pSize, 1))
        pGeo.setAttribute("random", new THREE.BufferAttribute(pRnd, 3))
        const pMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                hueSpeed: { value: hueSpeed },
            },
            vertexShader: PARTICLE_VERT,
            fragmentShader: PARTICLE_FRAG,
            transparent: true,
            depthWrite: false,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        })
        const particles = new THREE.Points(pGeo, pMat)
        scene.add(particles)

        // ── Sparkles ─────────────────────────────────────────────────────────
        const SC = effectiveSC
        const sGeo = new THREE.BufferGeometry()
        const sPos = new Float32Array(SC * 3)
        const sSize = new Float32Array(SC)
        const sRnd = new Float32Array(SC * 3)
        for (let i = 0; i < SC; i++) {
            sSize[i] = 0.5 + Math.random() * 0.8
            sRnd[i * 3] = Math.random() * 10
            sRnd[i * 3 + 1] = Math.random() * Math.PI * 2
            sRnd[i * 3 + 2] = 0.5 + 0.5 * Math.random()
        }
        sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3))
        sGeo.setAttribute("size", new THREE.BufferAttribute(sSize, 1))
        sGeo.setAttribute("random", new THREE.BufferAttribute(sRnd, 3))
        const sMat = new THREE.ShaderMaterial({
            uniforms: { time: { value: 0 } },
            vertexShader: SPARKLE_VERT,
            fragmentShader: SPARKLE_FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
        const sparkles = new THREE.Points(sGeo, sMat)
        scene.add(sparkles)

        // ── Post-processing ───────────────────────────────────────────────────
        const composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(W, H),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        )
        composer.addPass(bloomPass)
        const afterPass = new AfterimagePass()
        afterPass.uniforms.damp.value = afterimageDamp
        composer.addPass(afterPass)
        composer.addPass(new OutputPass())

        // Store refs for live prop updates
        threeRef.current = {
            renderer,
            composer,
            controls,
            particles,
            sparkles,
            bloomPass,
            afterPass,
            pMat,
            camera,
            scene,
            starPoints,
        }

        // Seed initial pattern
        const startPattern = Math.max(
            0,
            Math.min(PATTERNS.length - 1, initialPattern ?? 0)
        )
        morphStateRef.current = {
            currentPattern: startPattern,
            isTrans: false,
            prog: 0,
        }
        applyPattern(startPattern, particles, sparkles, PC, SC)

        // ── Render loop ───────────────────────────────────────────────────────
        let elapsed = 0
        let lastTime = performance.now()
        let lastAutoMorphTime = 0

        const loop = () => {
            rafRef.current = requestAnimationFrame(loop)
            if (pauseRef.current) return
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now
            elapsed += dt

            controls.autoRotate = autoRotateRef.current
            controls.autoRotateSpeed = autoRotateSpeedRef.current
            controls.update()

            starMat.uniforms.time.value = elapsed
            pMat.uniforms.time.value = elapsed
            sMat.uniforms.time.value = elapsed

            const ms = morphStateRef.current

            // Auto-morph
            if (autoMorphRef.current && !ms.isTrans) {
                if (
                    elapsed - lastAutoMorphTime >=
                    autoMorphIntervalRef.current
                ) {
                    lastAutoMorphTime = elapsed
                    const next = (ms.currentPattern + 1) % PATTERNS.length
                    const from = (
                        pGeo.attributes.position.array as Float32Array
                    ).slice()
                    const toPts = PATTERNS[next](PC)
                    const to = new Float32Array(PC * 3)
                    for (let j = 0; j < PC; j++) {
                        const i3 = j * 3
                        const p = toPts[j]
                        to[i3] = p.x
                        to[i3 + 1] = p.y
                        to[i3 + 2] = p.z
                    }
                    particles.userData = { from, to, next }
                    sparkles.userData = { from, to, next }
                    ms.isTrans = true
                    ms.prog = 0
                }
            }

            if (ms.isTrans) {
                ms.prog = Math.min(1, ms.prog + morphSpeedRef.current)
                const eased = 1 - Math.pow(1 - ms.prog, 3)
                const { from, to } = particles.userData
                if (to) {
                    const pArr = pGeo.attributes.position.array as Float32Array
                    const sArr = sGeo.attributes.position.array as Float32Array
                    for (let i = 0; i < pArr.length; i++) {
                        const val = from[i] + (to[i] - from[i]) * eased
                        pArr[i] = val
                        if (i < sArr.length) sArr[i] = val
                    }
                    pGeo.attributes.position.needsUpdate = true
                    sGeo.attributes.position.needsUpdate = true
                }
                if (ms.prog >= 1) {
                    ms.currentPattern = particles.userData.next
                    ms.isTrans = false
                }
            }

            composer.render(dt)
        }
        loop()

        // ── Resize observer ───────────────────────────────────────────────────
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (!width || !height) continue
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
                composer.setSize(width, height)
                bloomPass.setSize(width, height)
            }
        })
        ro.observe(container)

        const io = new IntersectionObserver(
            ([entry]) => {
                const wasHidden = pauseRef.current
                pauseRef.current = !entry.isIntersecting
                if (wasHidden && entry.isIntersecting)
                    lastTime = performance.now()
            },
            { threshold: 0.01 }
        )
        io.observe(container)

        const handleVisibility = () => {
            const wasHidden = pauseRef.current
            pauseRef.current = document.hidden
            if (wasHidden && !document.hidden) lastTime = performance.now()
        }
        document.addEventListener("visibilitychange", handleVisibility)

        return () => {
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", handleVisibility)
            controls.dispose()
            starGeo.dispose()
            starMat.dispose()
            pGeo.dispose()
            pMat.dispose()
            sGeo.dispose()
            sMat.dispose()
            composer.dispose()
            renderer.dispose()
            threeRef.current = null
        }
    }, [
        particleCount,
        sparkCount,
        starCount,
        initialPattern,
        particleSize,
        JSON.stringify(particleColors),
        isStatic,
    ]) // full remount when buffer sizes or palette change

    // ── Morph button handler ───────────────────────────────────────────────────
    const handleMorph = React.useCallback(() => {
        const ms = morphStateRef.current
        if (ms.isTrans) return
        const t = threeRef.current
        if (!t) return

        const { particles, sparkles } = t
        const PC = particleCount
        const next = (ms.currentPattern + 1) % PATTERNS.length
        const from = (
            particles.geometry.attributes.position.array as Float32Array
        ).slice()
        const toPts = PATTERNS[next](PC)
        const to = new Float32Array(PC * 3)
        for (let j = 0; j < PC; j++) {
            const i3 = j * 3
            const p = toPts[j]
            to[i3] = p.x
            to[i3 + 1] = p.y
            to[i3 + 2] = p.z
        }
        particles.userData = { from, to, next }
        sparkles.userData = { from, to, next }
        ms.isTrans = true
        ms.prog = 0
    }, [particleCount])

    const handleButtonClick = React.useCallback(() => {
        if (buttonLink) {
            const isExternal = /^(https?:)?\/\//.test(buttonLink)
            if (isExternal)
                window.open(buttonLink, "_blank", "noopener,noreferrer")
            else window.location.href = buttonLink
        } else {
            handleMorph()
        }
    }, [buttonLink, handleMorph])

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const btnVertical =
        buttonPosition === "top"
            ? { top: 24, bottom: "auto" as const }
            : { bottom: 24, top: "auto" as const }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
            }}
        >
            {isCanvas ? (
                // ── Framer canvas placeholder ─────────────────────────────────
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        color: "#d0b0ff",
                        fontFamily: "Inter, system-ui, sans-serif",
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                        View preview to watch animation
                    </div>
                </div>
            ) : (
                // ── Live scene ────────────────────────────────────────────────
                <>
                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                        }}
                    />

                    {/* Vignette */}
                    {showVignette && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background:
                                    "radial-gradient(circle at center, rgba(0,0,0,0) 65%, rgba(0,0,0,0.5) 100%)",
                            }}
                        />
                    )}

                    {/* Instructions badge */}
                    {showInstructions && (
                        <div
                            style={{
                                position: "absolute",
                                left: 24,
                                bottom: 24,
                                padding: "10px 20px",
                                fontSize: 12,
                                color: badgeTextColor,
                                background: badgeBgColor,
                                border: "1px solid rgba(122,70,255,0.28)",
                                borderRadius: 12,
                                backdropFilter: "blur(12px)",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
                                pointerEvents: "none",
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            {instructionsText}
                        </div>
                    )}

                    {/* Morph button */}
                    {showButton && (
                        <button
                            onClick={handleButtonClick}
                            style={{
                                position: "absolute",
                                left: "50%",
                                ...btnVertical,
                                transform: "translateX(-50%)",
                                padding: "12px 30px",
                                fontSize: 14,
                                fontWeight: 500,
                                color: buttonTextColor,
                                background: buttonBgColor,
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 50,
                                cursor: "pointer",
                                backdropFilter: "blur(10px) saturate(180%)",
                                WebkitBackdropFilter:
                                    "blur(10px) saturate(180%)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.37)",
                                fontFamily: "Inter, system-ui, sans-serif",
                                transition:
                                    "background 0.25s cubic-bezier(0.175,0.885,0.32,1.275), transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.25s",
                                outline: "none",
                            }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLButtonElement
                                el.style.filter = "brightness(1.4)"
                                el.style.transform =
                                    "translateX(-50%) scale(1.05)"
                                el.style.boxShadow =
                                    "0 12px 40px rgba(0,0,0,0.45)"
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLButtonElement
                                el.style.filter = ""
                                el.style.transform = "translateX(-50%) scale(1)"
                                el.style.boxShadow =
                                    "0 8px 32px rgba(0,0,0,0.37)"
                            }}
                            onMouseDown={(e) => {
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.transform =
                                    "translateX(-50%) scale(0.98)"
                            }}
                            onMouseUp={(e) => {
                                ;(
                                    e.currentTarget as HTMLButtonElement
                                ).style.transform =
                                    "translateX(-50%) scale(1.05)"
                            }}
                        >
                            {buttonLabel}
                        </button>
                    )}

                    {/* Overlay Text */}
                    {showOverlay && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems:
                                    overlayAlign === "left"
                                        ? "flex-start"
                                        : overlayAlign === "right"
                                          ? "flex-end"
                                          : "center",
                                justifyContent:
                                    overlayVertical === "top"
                                        ? "flex-start"
                                        : overlayVertical === "bottom"
                                          ? "flex-end"
                                          : "center",
                                padding: "8% 10%",
                                pointerEvents: "none",
                                gap: 16,
                            }}
                        >
                            {overlayTitle && (
                                <div
                                    style={{
                                        ...overlayTitleFont,
                                        color: overlayTitleColor,
                                        textAlign: overlayAlign,
                                    }}
                                >
                                    {overlayTitle}
                                </div>
                            )}
                            {overlaySubtitle && (
                                <div
                                    style={{
                                        ...overlaySubtitleFont,
                                        color: overlaySubtitleColor,
                                        textAlign: overlayAlign,
                                    }}
                                >
                                    {overlaySubtitle}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

MorphingShapes.defaultProps = {
    particleCount: 15000,
    sparkCount: 2000,
    morphSpeed: 0.03,
    autoRotate: true,
    autoRotateSpeed: 0.5,
    bloomStrength: 0.45,
    bloomRadius: 0.5,
    bloomThreshold: 0.85,
    afterimageDamp: 0.92,
    hueSpeed: 0.12,
    showButton: true,
    buttonLabel: "Morph Shape",
    showInstructions: true,
    instructionsText: "Drag to explore",
    backgroundColor: "#040307",
    fogColor: "#050203",
    fogDensity: 0.012,
    particleColors: [
        "#ff3c78",
        "#ff8c00",
        "#fff200",
        "#00cfff",
        "#b400ff",
        "#ffffff",
        "#ff4040",
    ],
    particleSize: 1,
    initialPattern: 0,
    showStars: true,
    starCount: 7000,
    cameraDistance: 80,
    autoMorph: false,
    autoMorphInterval: 4,
    buttonPosition: "bottom",
    cameraFov: 60,
    showVignette: true,
    buttonLink: "",
    buttonBgColor: "rgba(255,255,255,0.05)",
    buttonTextColor: "rgba(230,220,255,0.9)",
    badgeBgColor: "rgba(18,15,40,0.25)",
    badgeTextColor: "#d0b0ff",
    showOverlay: false,
    overlayTitle: "Transform Your Vision",
    overlayTitleFont: {
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: "64px",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
    },
    overlayTitleColor: "#ffffff",
    overlaySubtitle: "",
    overlaySubtitleFont: {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: "20px",
        lineHeight: 1.4,
    },
    overlaySubtitleColor: "rgba(255,255,255,0.7)",
    overlayAlign: "center",
    overlayVertical: "center",
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(MorphingShapes, {
    // ── Scene ─────────────────────────────────────────────────────────────────
    initialPattern: {
        title: "Starting Shape",
        type: ControlType.Enum,
        options: [0, 1, 2, 3],
        optionTitles: ["Torus Knot", "Halvorsen", "Dual Helix", "De Jong"],
        defaultValue: 0,
        description: "Which shape is shown first. Remounts on change.",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#040307",
    },
    fogColor: {
        title: "Fog Color",
        type: ControlType.Color,
        defaultValue: "#050203",
        description: "Match to Background for seamless depth.",
    },
    fogDensity: {
        title: "Fog Density",
        type: ControlType.Number,
        defaultValue: 0.012,
        min: 0,
        max: 0.05,
        step: 0.001,
        description: "Higher = particles fade out closer.",
    },
    showStars: {
        title: "Stars",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    starCount: {
        title: "Star Count",
        type: ControlType.Number,
        defaultValue: 7000,
        min: 0,
        max: 15000,
        step: 1000,
        displayStepper: true,
        hidden: (props: any) => !props.showStars,
        description: "Remounts the scene on change.",
    },
    cameraDistance: {
        title: "Zoom",
        type: ControlType.Number,
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 5,
        description: "Camera distance from origin. Lower = more zoomed in.",
    },
    cameraFov: {
        title: "Camera FOV",
        type: ControlType.Number,
        defaultValue: 60,
        min: 20,
        max: 120,
        step: 5,
        displayStepper: true,
        description: "Lower = telephoto, higher = wide angle.",
    },

    // ── Particles ─────────────────────────────────────────────────────────────
    particleCount: {
        title: "Particles",
        type: ControlType.Number,
        defaultValue: 15000,
        min: 1000,
        max: 30000,
        step: 1000,
        displayStepper: true,
        description: "Remounts the scene on change.",
    },
    sparkCount: {
        title: "Sparkles",
        type: ControlType.Number,
        defaultValue: 2000,
        min: 0,
        max: 5000,
        step: 500,
        displayStepper: true,
    },
    particleSize: {
        title: "Particle Size",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        description: "Size multiplier. Remounts on change.",
    },
    particleColors: {
        title: "Colors",
        type: ControlType.Array,
        control: { type: ControlType.Color },
        defaultValue: [
            "#ff3c78",
            "#ff8c00",
            "#fff200",
            "#00cfff",
            "#b400ff",
            "#ffffff",
            "#ff4040",
        ],
        description: "Particle color palette. Remounts on change.",
    },

    // ── Animation ─────────────────────────────────────────────────────────────
    morphSpeed: {
        title: "Morph Speed",
        type: ControlType.Number,
        defaultValue: 0.03,
        min: 0.005,
        max: 0.1,
        step: 0.005,
    },
    hueSpeed: {
        title: "Hue Speed",
        type: ControlType.Number,
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.01,
        description: "Speed of particle color cycling.",
    },
    autoRotate: {
        title: "Auto Rotate",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRotateSpeed: {
        title: "Rotate Speed",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: (props: any) => !props.autoRotate,
    },
    autoMorph: {
        title: "Auto Morph",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Automatically cycle through all shapes.",
    },
    autoMorphInterval: {
        title: "Morph Interval",
        type: ControlType.Number,
        defaultValue: 4,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (props: any) => !props.autoMorph,
        description: "Seconds between automatic shape changes.",
    },

    // ── Post-processing ───────────────────────────────────────────────────────
    bloomStrength: {
        title: "Bloom",
        type: ControlType.Number,
        defaultValue: 0.45,
        min: 0,
        max: 3,
        step: 0.05,
    },
    bloomRadius: {
        title: "Bloom Radius",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    bloomThreshold: {
        title: "Bloom Threshold",
        type: ControlType.Number,
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
    },
    afterimageDamp: {
        title: "Trail",
        type: ControlType.Number,
        defaultValue: 0.92,
        min: 0,
        max: 0.99,
        step: 0.01,
        description: "Motion trail length (0 = none, 0.99 = long).",
    },
    showVignette: {
        title: "Vignette",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    showButton: {
        title: "Show Button",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    buttonLabel: {
        title: "Button Text",
        type: ControlType.String,
        defaultValue: "Morph Shape",
        hidden: (props: any) => !props.showButton,
    },
    buttonPosition: {
        title: "Button Position",
        type: ControlType.Enum,
        options: ["bottom", "top"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (props: any) => !props.showButton,
    },
    buttonLink: {
        title: "Button Link",
        type: ControlType.Link,
        hidden: (props: any) => !props.showButton,
        description:
            "If set, button navigates instead of morphing. External URLs open in new tab.",
    },
    buttonBgColor: {
        title: "Button Background",
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.05)",
        hidden: (props: any) => !props.showButton,
    },
    buttonTextColor: {
        title: "Button Text Color",
        type: ControlType.Color,
        defaultValue: "rgba(230,220,255,0.9)",
        hidden: (props: any) => !props.showButton,
    },
    showInstructions: {
        title: "Instructions",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    instructionsText: {
        title: "Instructions Text",
        type: ControlType.String,
        defaultValue: "Drag to explore",
        hidden: (props: any) => !props.showInstructions,
    },
    badgeBgColor: {
        title: "Badge Background",
        type: ControlType.Color,
        defaultValue: "rgba(18,15,40,0.25)",
        hidden: (props: any) => !props.showInstructions,
    },
    badgeTextColor: {
        title: "Badge Text Color",
        type: ControlType.Color,
        defaultValue: "#d0b0ff",
        hidden: (props: any) => !props.showInstructions,
    },

    // ── Overlay Text ──────────────────────────────────────────────────────────
    showOverlay: {
        title: "Overlay",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Text layer over canvas — ideal for hero sections.",
    },
    overlayAlign: {
        title: "Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
        hidden: (props: any) => !props.showOverlay,
    },
    overlayVertical: {
        title: "Position",
        type: ControlType.Enum,
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "center",
        hidden: (props: any) => !props.showOverlay,
    },
    overlayTitle: {
        title: "Heading",
        type: ControlType.String,
        defaultValue: "Transform Your Vision",
        hidden: (props: any) => !props.showOverlay,
    },
    overlayTitleFont: {
        title: "Heading Font",
        type: ControlType.Font,
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "64px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
        },
        hidden: (props: any) => !props.showOverlay,
    },
    overlayTitleColor: {
        title: "Heading Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
        hidden: (props: any) => !props.showOverlay,
    },
    overlaySubtitle: {
        title: "Subheading",
        type: ControlType.String,
        defaultValue: "",
        displayTextArea: true,
        hidden: (props: any) => !props.showOverlay,
    },
    overlaySubtitleFont: {
        title: "Subheading Font",
        type: ControlType.Font,
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: 1.4,
        },
        hidden: (props: any) => !props.showOverlay,
    },
    overlaySubtitleColor: {
        title: "Subheading Color",
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.7)",
        hidden: (props: any) => !props.showOverlay,
    },
})
