// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"
/**
 * IMPORTS
 * using esm.sh for instant Framer compatibility
 */
import * as THREE from "https://esm.sh/three@0.160.0"
import { EffectComposer } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "https://esm.sh/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js"

// Create glow effect using Three.js ShaderPass
const createGlowShaderPass = (opts?: { intensity?: number; size?: number }) => {
    const GlowShader = {
        uniforms: {
            tDiffuse: { value: null },
            uGlowIntensity: { value: opts?.intensity ?? 0.5 },
            uGlowSize: { value: opts?.size ?? 1.0 },
            uResolution: { value: new THREE.Vector2(1, 1) },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float uGlowIntensity;
            uniform float uGlowSize;
            uniform vec2 uResolution;
            varying vec2 vUv;

            void main() {
                vec2 texelSize = 1.0 / uResolution;
                vec4 inputColor = texture2D(tDiffuse, vUv);
                vec4 sum = vec4(0.0);

                float samples = uGlowSize * 5.0;
                float halfSamples = samples * 0.5;
                float weight = 0.0;

                for(float x = -5.0; x <= 5.0; x += 1.0) {
                    for(float y = -5.0; y <= 5.0; y += 1.0) {
                        vec2 offset = vec2(x, y) * texelSize * uGlowSize;
                        float dist = length(vec2(x, y)) / 5.0;
                        float w = 1.0 - smoothstep(0.0, 1.0, dist);
                        sum += texture2D(tDiffuse, vUv + offset) * w;
                        weight += w;
                    }
                }

                vec4 blur = sum / max(weight, 1.0);
                gl_FragColor = inputColor + blur * uGlowIntensity;
            }
        `,
    }
    return new ShaderPass(GlowShader)
}

type ShapeVariant = "square" | "circle" | "triangle" | "diamond"

const SHAPE_MAP: Record<ShapeVariant, number> = {
    square: 0,
    circle: 1,
    triangle: 2,
    diamond: 3,
}

const MAX_CLICKS = 10

interface DitherShaderProps {
    enabled?: boolean
    variant?: ShapeVariant
    pixelSize?: number
    color?: string
    opacity?: number
    patternScale?: number
    patternDensity?: number
    pixelSizeJitter?: number
    noiseAmount?: number
    speed?: number
    enableRipples?: boolean
    rippleIntensityScale?: number
    rippleThickness?: number
    rippleSpeed?: number
    enableGradient?: boolean
    gradientColor1?: string
    gradientColor2?: string
    gradientSpeed?: number
    enableGlow?: boolean
    glowIntensity?: number
    glowSize?: number
    colorPulse?: boolean
    pulseSpeed?: number
    pulseIntensity?: number
    rotationSpeed?: number
    edgeFade?: number
    autoPauseOffscreen?: boolean
    performanceMode?: "high" | "balanced" | "low"
    targetFPS?: number
    autoScale?: boolean
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicHeight 600
 * @framerIntrinsicWidth 600
 * @framerDisableUnlink
 */
export default function DitherShader(props: DitherShaderProps & any) {
    // Detect if we are in the Framer Canvas (used only for offscreen pause, not visual changes)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const {
        enabled = true,
        variant = "circle",
        pixelSize = 4,
        color = "#000000",
        opacity = 1.0,

        patternScale = 1.0,
        patternDensity = 1.0,
        pixelSizeJitter = 0.0,
        noiseAmount = 0.7,
        speed = 0.1,

        enableRipples = true,
        rippleIntensityScale = 1.0,
        rippleThickness = 0.12,
        rippleSpeed = 0.4,

        enableGradient = false,
        gradientColor1 = "#FF0000",
        gradientColor2 = "#0810FF",
        gradientSpeed = 0.5,

        enableGlow = false,
        glowIntensity = 0.5,
        glowSize = 1.0,

        colorPulse = false,
        pulseSpeed = 1.0,
        pulseIntensity = 0.2,

        rotationSpeed = 0.0,
        edgeFade = 0.0,

        targetFPS = 60,

        // Use props directly without canvas-specific overrides for consistent output
        performanceMode = props.performanceMode ?? "balanced",
        autoScale = props.autoScale ?? true,
        // Only disable offscreen pause on canvas to keep animation running while editing
        autoPauseOffscreen = isCanvas
            ? false
            : (props.autoPauseOffscreen ?? true),
        ...restProps
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const materialRef = useRef<THREE.ShaderMaterial | null>(null)
    const composerRef = useRef<{
        composer?: EffectComposer
        glowPass?: ShaderPass
        enabled?: boolean
    }>({ composer: undefined, glowPass: undefined, enabled: false })
    const frameIdRef = useRef<number | null>(null)
    const clockRef = useRef(new THREE.Clock())
    const lastFrameTime = useRef(0)
    const visibilityRef = useRef({ visible: true })

    // Click tracking refs (initialized once)
    const clickPosRef = useRef<THREE.Vector2[]>(
        Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1))
    )
    const clickTimesRef = useRef<Float32Array>(new Float32Array(MAX_CLICKS))

    // Internal scaler state
    const fpsEMARef = useRef<number | null>(null)
    const scalerStateRef = useRef({
        qualityIndex: 2, // 0..3, start at mid-high for soft mode
        lastChangeTime: 0,
        autoDisabled: false,
    })

    // ============================================
    // REFS FOR REAL-TIME ANIMATION LOOP UPDATES
    // These refs ensure the animation loop always reads current prop values
    // instead of stale closure values from when the loop was created
    // ============================================
    const speedRef = useRef(speed)
    const rotationSpeedRef = useRef(rotationSpeed)
    const autoPauseOffscreenRef = useRef(autoPauseOffscreen)
    const autoScaleRef = useRef(autoScale)
    const targetFPSRef = useRef(targetFPS)
    const patternDensityRef = useRef(patternDensity)
    const noiseAmountRef = useRef(noiseAmount)
    const performanceModeRef = useRef(performanceMode)
    const glowIntensityRef = useRef(glowIntensity)
    const glowSizeRef = useRef(glowSize)
    const enableRipplesRef = useRef(enableRipples)

    // Mapping qualityIndex -> DPR multiplier (soft scaling)
    const computeDPRForIndex = (index: number, devicePR: number) => {
        const steps = [Math.min(devicePR, 1.5), 1.0, 0.85, 0.75]
        return steps[Math.min(Math.max(index, 0), steps.length - 1)]
    }

    // ============================================
    // KEEP REFS IN SYNC WITH PROPS
    // ============================================
    useEffect(() => {
        speedRef.current = speed
    }, [speed])
    useEffect(() => {
        rotationSpeedRef.current = rotationSpeed
    }, [rotationSpeed])
    useEffect(() => {
        autoPauseOffscreenRef.current = autoPauseOffscreen
    }, [autoPauseOffscreen])
    useEffect(() => {
        autoScaleRef.current = autoScale
    }, [autoScale])
    useEffect(() => {
        targetFPSRef.current = targetFPS
    }, [targetFPS])
    useEffect(() => {
        patternDensityRef.current = patternDensity
    }, [patternDensity])
    useEffect(() => {
        noiseAmountRef.current = noiseAmount
    }, [noiseAmount])
    useEffect(() => {
        performanceModeRef.current = performanceMode
    }, [performanceMode])
    useEffect(() => {
        glowIntensityRef.current = glowIntensity
    }, [glowIntensity])
    useEffect(() => {
        glowSizeRef.current = glowSize
    }, [glowSize])
    useEffect(() => {
        enableRipplesRef.current = enableRipples
    }, [enableRipples])

    // Update glow uniforms when props change
    useEffect(() => {
        const glowPass = composerRef.current?.glowPass
        if (glowPass) {
            glowPass.uniforms.uGlowIntensity.value = glowIntensity
            glowPass.uniforms.uGlowSize.value = glowSize
        }
    }, [glowIntensity, glowSize])

    // ================================
    // SHADERS
    // ================================
    const vertexShader = `
        void main() {
            gl_Position = vec4(position, 1.0);
        }
    `

    const fragmentShader = `
        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uPixelSize;
        uniform vec3 uColor;
        uniform float uPatternScale;
        uniform float uPatternDensity;
        uniform float uPixelSizeJitter;
        uniform float uNoiseAmount;
        uniform int uShapeType;
        const int SHAPE_SQUARE   = 0;
        const int SHAPE_CIRCLE   = 1;
        const int SHAPE_TRIANGLE = 2;
        const int SHAPE_DIAMOND  = 3;
        uniform bool uEnableRipples;
        uniform float uRippleIntensity;
        uniform float uRippleThickness;
        uniform float uRippleSpeed;
        const int MAX_CLICKS = 10;
        uniform vec2 uClickPos[MAX_CLICKS];
        uniform float uClickTimes[MAX_CLICKS];
        uniform bool uEnableGradient;
        uniform vec3 uGradientColor1;
        uniform vec3 uGradientColor2;
        uniform float uGradientSpeed;
        uniform bool uColorPulse;
        uniform float uPulseSpeed;
        uniform float uPulseIntensity;
        uniform vec2 uRotSC;
        uniform float uEdgeFade;
        uniform float uAspect;
        uniform float uMaxRippleTime;

        float hash21(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        float Bayer2(vec2 a){
            a=floor(a);
            return fract(a.x/2. + a.y * a.y * .75);
        }
        #define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
        #define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))
        float noise(vec2 p){
            vec2 i=floor(p);
            vec2 f=fract(p);
            float a=hash21(i);
            float b=hash21(i + vec2(1.0,0.0));
            float c=hash21(i + vec2(0.0,1.0));
            float d=hash21(i + vec2(1.0,1.0));
            vec2 u = f*f*(3.0-2.0*f);
            return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
        }
        float maskCircle(vec2 p, float cov){
            float r = sqrt(cov) * 0.25;
            float d = length(p - 0.5) - r;
            float aa = 0.5 * fwidth(d);
            return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
        }
        float maskTriangle(vec2 p, vec2 id, float cov){
            bool flip = mod(id.x + id.y, 2.0) > 0.5;
            if (flip) p.x = 1.0 - p.x;
            float r = sqrt(cov);
            float d  = p.y - r*(1.0 - p.x);
            float aa = fwidth(d);
            return cov * clamp(0.5 - d/aa, 0.0, 1.0);
        }
        float maskDiamond(vec2 p, float cov){
            float r = sqrt(cov) * 0.564;
            return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
        }

        void main(){
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            vec2 centered = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
            if(uRotSC.x != 0.0 || uRotSC.y != 1.0){
                mat2 rot = mat2(uRotSC.y, -uRotSC.x, uRotSC.x, uRotSC.y);
                centered = rot * centered;
            }
            float px = max(1.0, uPixelSize);
            if(uPixelSizeJitter > 0.0){
                float jitter = hash21(floor(gl_FragCoord.xy / (px*10.0))) * uPixelSizeJitter;
                px += jitter;
            }
            vec2 pcell = floor(gl_FragCoord.xy / px) * px;
            vec2 pUv = (pcell - 0.5 * uResolution.xy) / uResolution.y;
            if(uRotSC.x != 0.0 || uRotSC.y != 1.0){
                mat2 rot = mat2(uRotSC.y, -uRotSC.x, uRotSC.x, uRotSC.y);
                pUv = rot * pUv;
            }
            vec2 pixelId = floor(gl_FragCoord.xy / px);
            vec2 pixelUV = fract(gl_FragCoord.xy / px);
            float cellPixelSize = 8.0 * uPixelSize;
            vec2 cellId = floor(gl_FragCoord.xy / cellPixelSize);
            vec2 cellCoord = cellId * cellPixelSize;
            vec2 cellUv = cellCoord / uResolution.xy;
            vec2 aspectUv = cellUv * vec2(uAspect, 1.0);
            float base = noise(aspectUv * uPatternScale * 8.0 + uTime * 0.05);
            base = base * 0.5 - 0.65;
            float feed = base + (uPatternDensity - 0.5) * 0.3;
            if(uEnableRipples){
                float speed = uRippleSpeed;
                float thickness = uRippleThickness;
                const float dampT = 2.5;
                const float dampR = 10.0;
                for(int i = 0; i < MAX_CLICKS; ++i){
                    vec2 pos = uClickPos[i];
                    if(pos.x < 0.0) continue;
                    float t = max(uTime - uClickTimes[i], 0.0);
                    if(t > uMaxRippleTime) continue;
                    vec2 cuv = (pos / uResolution) * vec2(uAspect, 1.0);
                    float r = distance(aspectUv, cuv);
                    float waveR = speed * t;
                    float ring = exp(-pow((r - waveR) / thickness, 2.0));
                    float atten = exp(-dampT * t) * exp(-dampR * r);
                    feed = max(feed, ring * atten * uRippleIntensity);
                }
            }
            if(uColorPulse){
                feed += sin(uTime * uPulseSpeed) * uPulseIntensity * 0.1;
            }
            float bayer = Bayer8(gl_FragCoord.xy / px) - 0.5;
            float bw = step(0.5, feed + bayer);
            float h = hash21(floor(gl_FragCoord.xy / px));
            float jitterScale = 1.0 + (h - 0.5) * uPixelSizeJitter * 0.1;
            float coverage = bw * jitterScale;
            float M;
            if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle(pixelUV, coverage);
            else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
            else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
            else                                   M = coverage;
            vec3 baseColor = uColor;
            if(uEnableGradient){
                // Static gradient from bottom (Color 1) to top (Color 2)
                float g = uv.y;
                baseColor = mix(uGradientColor1, uGradientColor2, g);
            }
            vec3 col = baseColor * M;
            float alpha = M;
            if(uEdgeFade > 0.0){
                float d = length(uv - 0.5);
                float fade = smoothstep(0.8 - uEdgeFade, 0.8, d);
                col *= (1.0 - fade);
                alpha *= (1.0 - fade);
            }
            gl_FragColor = vec4(col, alpha);
        }
    `

    // ==================================
    //  INIT + RENDER LOOP
    // ==================================
    useEffect(() => {
        if (!enabled) return

        const container = containerRef.current
        if (!container) return

        container.innerHTML = ""

        const canvas = document.createElement("canvas")
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.style.display = "block"

        const gl = canvas.getContext("webgl2", {
            antialias: false,
            alpha: true,
            premultipliedAlpha: false,
        })

        if (!gl) {
            console.error("WebGL2 not supported – cannot run shader.")
            container.innerHTML =
                "<div style='display:flex;align-items:center;justify-content:center;height:100%;color:red;'>WebGL2 not supported</div>"
            return
        }

        const renderer = new THREE.WebGLRenderer({
            canvas,
            context: gl as WebGL2RenderingContext,
            alpha: true,
            premultipliedAlpha: false,
        })

        // Initial DPR based on preference & performance mode
        const devicePR = window.devicePixelRatio || 1.0
        let initialDpr = 1.0

        // Use performance mode to determine DPR
        if (performanceMode === "high") initialDpr = Math.min(devicePR, 2.0)
        else if (performanceMode === "balanced")
            initialDpr = Math.min(devicePR, 1.5)
        else initialDpr = 1.0

        const dpr = computeDPRForIndex(
            scalerStateRef.current.qualityIndex,
            initialDpr
        )
        renderer.setPixelRatio(dpr)

        renderer.setClearColor(0x000000, 0)
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uResolution: { value: new THREE.Vector2(1, 1) },
                uTime: { value: 0 },
                uPixelSize: { value: pixelSize },
                uColor: { value: new THREE.Color(color) },
                uShapeType: { value: SHAPE_MAP[variant as ShapeVariant] ?? 0 },
                uPatternScale: { value: patternScale },
                uPatternDensity: { value: patternDensity },
                uPixelSizeJitter: { value: pixelSizeJitter },
                uNoiseAmount: { value: noiseAmount },
                uEnableRipples: { value: enableRipples },
                uRippleIntensity: { value: rippleIntensityScale },
                uRippleThickness: { value: rippleThickness },
                uRippleSpeed: { value: rippleSpeed },
                uClickPos: { value: clickPosRef.current },
                uClickTimes: { value: clickTimesRef.current },
                uEnableGradient: { value: enableGradient },
                uGradientColor1: { value: new THREE.Color(gradientColor1) },
                uGradientColor2: { value: new THREE.Color(gradientColor2) },
                uGradientSpeed: { value: gradientSpeed },
                uColorPulse: { value: colorPulse },
                uPulseSpeed: { value: pulseSpeed },
                uPulseIntensity: { value: pulseIntensity },
                uRotSC: { value: new THREE.Vector2(0, 1) }, // sin, cos
                uEdgeFade: { value: edgeFade },
                uAspect: { value: 1.0 },
                uMaxRippleTime: { value: 3.0 },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        })

        materialRef.current = material

        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
        scene.add(quad)

        // Setup post-processing composer only when needed
        let composer: EffectComposer | undefined
        let glowPass: ShaderPass | undefined
        // Enable glow based on user settings and performance mode
        if (enableGlow && performanceMode !== "low") {
            composer = new EffectComposer(renderer)
            composer.addPass(new RenderPass(scene, camera))

            glowPass = createGlowShaderPass({
                intensity: glowIntensity,
                size: glowSize,
            })
            glowPass.uniforms.uResolution.value.set(
                container.clientWidth,
                container.clientHeight
            )
            composer.addPass(glowPass)

            composerRef.current = { composer, glowPass, enabled: true }
        } else {
            composerRef.current = {
                composer: undefined,
                glowPass: undefined,
                enabled: false,
            }
        }

        container.appendChild(canvas)

        // Resize handling
        let resizeScheduled = false
        const doResize = () => {
            const w = Math.max(1, container.clientWidth || 100)
            const h = Math.max(1, container.clientHeight || 100)
            const dprNow = renderer.getPixelRatio()

            canvas.width = Math.floor(w * dprNow)
            canvas.height = Math.floor(h * dprNow)

            renderer.setSize(w, h, false)
            material.uniforms.uResolution.value.set(canvas.width, canvas.height)
            material.uniforms.uAspect.value = canvas.width / canvas.height

            if (composerRef.current?.composer) {
                composerRef.current.composer.setSize(w, h)
            }
            if (composerRef.current?.glowPass) {
                composerRef.current.glowPass.uniforms.uResolution.value.set(
                    canvas.width,
                    canvas.height
                )
            }
            resizeScheduled = false
        }

        const scheduleResize = () => {
            if (!resizeScheduled) {
                resizeScheduled = true
                requestAnimationFrame(doResize)
            }
        }

        doResize()
        setTimeout(doResize, 100)

        const ro = new ResizeObserver(scheduleResize)
        ro.observe(container)

        const io = new IntersectionObserver(
            (entries) => {
                visibilityRef.current.visible = entries[0].isIntersecting
            },
            { threshold: 0 }
        )
        if (autoPauseOffscreen) {
            io.observe(container)
        }

        // Click handler - uses ref for real-time reactivity
        let clickIndex = 0
        const onPointerDown = (e: PointerEvent) => {
            if (!enableRipplesRef.current) return

            const rect = canvas.getBoundingClientRect()
            const scaleX = canvas.width / rect.width
            const scaleY = canvas.height / rect.height
            const fx = (e.clientX - rect.left) * scaleX
            const fy = (rect.height - (e.clientY - rect.top)) * scaleY

            const currentTime = material.uniforms.uTime.value
            material.uniforms.uClickPos.value[clickIndex].set(fx, fy)
            material.uniforms.uClickTimes.value[clickIndex] = currentTime
            clickIndex = (clickIndex + 1) % MAX_CLICKS
        }

        canvas.addEventListener("pointerdown", onPointerDown, { passive: true })

        // Animation loop - NOTE: Uses refs for all values that can change during animation
        // This ensures real-time reactivity when controls are adjusted
        let lastSampleTime = performance.now()
        const animate = (time: number) => {
            frameIdRef.current = requestAnimationFrame(animate)

            if (
                autoPauseOffscreenRef.current &&
                !visibilityRef.current.visible
            ) {
                return
            }

            // Calculate frame timing using current targetFPS
            const currentFpsTarget = Math.max(10, targetFPSRef.current || 30)
            const minInterval = 1000 / currentFpsTarget

            if (time - lastFrameTime.current < minInterval) return
            const dt = time - lastFrameTime.current
            lastFrameTime.current = time

            // Use speedRef for real-time updates
            const currentTime =
                clockRef.current.getElapsedTime() * speedRef.current * 5.0
            material.uniforms.uTime.value = currentTime

            // Use rotationSpeedRef for real-time updates
            if (rotationSpeedRef.current !== 0.0) {
                const angle = currentTime * rotationSpeedRef.current
                const s = Math.sin(angle)
                const c = Math.cos(angle)
                const rotVec = material.uniforms.uRotSC.value as THREE.Vector2
                rotVec.set(s, c)
            } else {
                const rotVec = material.uniforms.uRotSC.value as THREE.Vector2
                rotVec.set(0, 1)
            }

            // Cleanup Ripples
            const maxRippleTime = material.uniforms.uMaxRippleTime
                .value as number
            for (let i = 0; i < MAX_CLICKS; i++) {
                const clickTime = material.uniforms.uClickTimes.value[i]
                if (clickTime > 0 && currentTime - clickTime > maxRippleTime) {
                    material.uniforms.uClickPos.value[i].set(-1, -1)
                    material.uniforms.uClickTimes.value[i] = 0
                }
            }

            // === Auto Performance Scaler ===
            // Use autoScaleRef for real-time updates
            if (autoScaleRef.current) {
                const now = performance.now()
                const instFps = 1000 / Math.max(1, dt)
                const alpha = 0.12
                fpsEMARef.current =
                    fpsEMARef.current == null
                        ? instFps
                        : alpha * instFps + (1 - alpha) * fpsEMARef.current

                if (now - lastSampleTime > 800) {
                    lastSampleTime = now
                    const fps = fpsEMARef.current || instFps
                    const state = scalerStateRef.current
                    const nowSec = now / 1000
                    const minTimeBetween = 1.0
                    if (nowSec - state.lastChangeTime > minTimeBetween) {
                        const lowThreshold = Math.min(30, currentFpsTarget - 15)
                        const highThreshold = Math.max(currentFpsTarget - 5, 50)
                        if (fps < lowThreshold && state.qualityIndex < 3) {
                            state.qualityIndex = Math.min(
                                3,
                                state.qualityIndex + 1
                            )
                            state.lastChangeTime = nowSec
                        } else if (
                            fps > highThreshold &&
                            state.qualityIndex > 0
                        ) {
                            state.qualityIndex = Math.max(
                                0,
                                state.qualityIndex - 1
                            )
                            state.lastChangeTime = nowSec
                        }

                        const desiredDpr = computeDPRForIndex(
                            state.qualityIndex,
                            window.devicePixelRatio || 1.0
                        )

                        if (
                            Math.abs(desiredDpr - renderer.getPixelRatio()) >
                            0.05
                        ) {
                            renderer.setPixelRatio(desiredDpr)
                            requestAnimationFrame(doResize)
                        }

                        // Use refs for real-time updates
                        const densityBase = patternDensityRef.current
                        const noiseBase = noiseAmountRef.current
                        const densityMap = [
                            densityBase,
                            densityBase,
                            densityBase * 0.95,
                            densityBase * 0.85,
                        ]
                        const noiseMap = [
                            noiseBase,
                            noiseBase,
                            noiseBase * 0.95,
                            noiseBase * 0.85,
                        ]

                        material.uniforms.uPatternDensity.value =
                            densityMap[state.qualityIndex]
                        material.uniforms.uNoiseAmount.value =
                            noiseMap[state.qualityIndex]

                        const composerEntry = composerRef.current
                        if (composerEntry && composerEntry.composer) {
                            composerEntry.enabled = !(
                                state.qualityIndex >= 3 &&
                                performanceModeRef.current !== "high"
                            )
                        }
                    }
                }
            }

            // render
            const composerEntry = composerRef.current
            if (
                composerEntry &&
                composerEntry.composer &&
                composerEntry.enabled
            ) {
                composerEntry.composer.render()
            } else {
                renderer.render(scene, camera)
            }
        }

        frameIdRef.current = requestAnimationFrame(animate)

        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current)
            ro.disconnect()
            io.disconnect()
            canvas.removeEventListener("pointerdown", onPointerDown)

            material.dispose()
            quad.geometry.dispose()
            composerRef.current?.composer?.dispose()
            renderer.dispose()

            if (container.contains(canvas)) {
                container.removeChild(canvas)
            }
            rendererRef.current = null
            materialRef.current = null
            composerRef.current = {
                composer: undefined,
                glowPass: undefined,
                enabled: false,
            }
        }
    }, [
        enabled, // Re-init when component is toggled on/off
        enableGlow, // Re-init when glow is toggled (requires composer setup)
        performanceMode, // Re-init when quality mode changes (affects DPR and glow)
        // Note: autoPauseOffscreen, autoScale, speed, rotationSpeed, targetFPS, etc.
        // are now handled via refs and don't require re-initialization
    ])

    // Uniform updates
    useEffect(() => {
        const mat = materialRef.current
        if (!mat) return

        mat.uniforms.uShapeType.value = SHAPE_MAP[variant as ShapeVariant] ?? 0
        mat.uniforms.uPixelSize.value = pixelSize
        mat.uniforms.uColor.value.set(color)
        mat.uniforms.uPatternScale.value = patternScale
        mat.uniforms.uPatternDensity.value = patternDensity
        mat.uniforms.uPixelSizeJitter.value = pixelSizeJitter
        mat.uniforms.uNoiseAmount.value = noiseAmount

        mat.uniforms.uEnableRipples.value = enableRipples
        mat.uniforms.uRippleIntensity.value = rippleIntensityScale
        mat.uniforms.uRippleThickness.value = rippleThickness
        mat.uniforms.uRippleSpeed.value = rippleSpeed

        mat.uniforms.uEnableGradient.value = enableGradient
        mat.uniforms.uGradientColor1.value.set(gradientColor1)
        mat.uniforms.uGradientColor2.value.set(gradientColor2)
        mat.uniforms.uGradientSpeed.value = gradientSpeed

        mat.uniforms.uColorPulse.value = colorPulse
        mat.uniforms.uPulseSpeed.value = pulseSpeed
        mat.uniforms.uPulseIntensity.value = pulseIntensity

        mat.uniforms.uEdgeFade.value = edgeFade
    }, [
        variant,
        pixelSize,
        color,
        patternScale,
        patternDensity,
        pixelSizeJitter,
        noiseAmount,
        enableRipples,
        rippleIntensityScale,
        rippleThickness,
        rippleSpeed,
        enableGradient,
        gradientColor1,
        gradientColor2,
        gradientSpeed,
        colorPulse,
        pulseSpeed,
        pulseIntensity,
        rotationSpeed,
        edgeFade,
    ])

    if (!enabled) {
        return null
    }

    return (
        <div
            {...restProps}
            style={{
                ...restProps.style,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    opacity,
                    background: "transparent",
                }}
            />
        </div>
    )
}

addPropertyControls(DitherShader, {
    // Appearance Section
    variant: {
        type: ControlType.Enum,
        title: "Shape",
        description: "The shape of each dither particle",
        options: ["square", "circle", "triangle", "diamond"],
        defaultValue: "circle",
        section: "Appearance",
        displaySectionTitles: true,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        description: "Base color of the dither pattern",
        defaultValue: "#000000",
        section: "Appearance",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        description: "Size of each dither particle in pixels",
        defaultValue: 4,
        min: 1,
        max: 64,
        step: 1,
        section: "Appearance",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        description: "Overall transparency of the effect",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        section: "Appearance",
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        description:
            "Creates a vignette effect, fading the pattern towards the edges",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        section: "Appearance",
    },

    // Pattern Section
    patternDensity: {
        type: ControlType.Number,
        title: "Pattern Density",
        description:
            "Controls how crowded the dither pattern appears. Higher values create more particles",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        section: "Pattern",
        displaySectionTitles: true,
    },
    patternScale: {
        type: ControlType.Number,
        title: "Pattern Scale",
        description:
            "Overall scale of the noise pattern that drives the dither",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        section: "Pattern",
    },
    noiseAmount: {
        type: ControlType.Number,
        title: "Dither Intensity",
        description: "Strength of the dithering effect",
        defaultValue: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
        section: "Pattern",
    },
    pixelSizeJitter: {
        type: ControlType.Number,
        title: "Size Variation",
        description:
            "Adds randomness to particle sizes for a more organic look",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.5,
        section: "Pattern",
    },

    // Animation Section
    speed: {
        type: ControlType.Number,
        title: "Animation Speed",
        description:
            "Speed of the pattern movement. Set to 0 for a static pattern",
        defaultValue: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
        section: "Animation",
        displaySectionTitles: true,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        description:
            "Rotates the entire pattern. Negative values rotate counter-clockwise",
        defaultValue: 0,
        min: -2,
        max: 2,
        step: 0.1,
        section: "Animation",
    },

    // Ripple Effects Section
    enableRipples: {
        type: ControlType.Boolean,
        title: "Enable Ripples",
        description: "Click on the component to create ripple waves",
        defaultValue: true,
        section: "Ripples",
        displaySectionTitles: true,
    },
    rippleIntensityScale: {
        type: ControlType.Number,
        title: "Ripple Strength",
        description: "How strong the ripple effect appears",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: (props: any) => !props.enableRipples,
        section: "Ripples",
    },
    rippleThickness: {
        type: ControlType.Number,
        title: "Ripple Width",
        description: "Thickness of each ripple ring",
        defaultValue: 0.12,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        hidden: (props: any) => !props.enableRipples,
        section: "Ripples",
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Ripple Speed",
        description: "How fast ripples expand outward",
        defaultValue: 0.4,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: (props: any) => !props.enableRipples,
        section: "Ripples",
    },

    // Gradient Section
    enableGradient: {
        type: ControlType.Boolean,
        title: "Enable Gradient",
        description: "Apply a color gradient to the pattern",
        defaultValue: true,
        section: "Gradient",
        displaySectionTitles: true,
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Color 1",
        description: "Bottom color of the gradient",
        defaultValue: "#FF0000",
        hidden: (props: any) => !props.enableGradient,
        section: "Gradient",
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Color 2",
        description: "Top color of the gradient",
        defaultValue: "#0810FF",
        hidden: (props: any) => !props.enableGradient,
        section: "Gradient",
    },

    // Glow Section
    enableGlow: {
        type: ControlType.Boolean,
        title: "Enable Glow",
        description: "Add a soft glow effect around the particles",
        defaultValue: false,
        section: "Glow",
        displaySectionTitles: true,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Strength",
        description: "Brightness of the glow effect",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        hidden: (props: any) => !props.enableGlow,
        section: "Glow",
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        description: "How far the glow extends from particles",
        defaultValue: 1.0,
        min: 0.5,
        max: 3,
        step: 0.1,
        hidden: (props: any) => !props.enableGlow,
        section: "Glow",
    },

    // Performance Section
    performanceMode: {
        type: ControlType.Enum,
        title: "Quality",
        description: "Balance between visual quality and performance",
        options: ["high", "balanced", "low"],
        optionTitles: ["High", "Balanced", "Low"],
        defaultValue: "balanced",
        section: "Performance",
        displaySectionTitles: true,
    },
    autoScale: {
        type: ControlType.Boolean,
        title: "Auto Scale",
        description:
            "Automatically adjust resolution based on device performance",
        defaultValue: true,
        section: "Performance",
    },
    autoPauseOffscreen: {
        type: ControlType.Boolean,
        title: "Pause Offscreen",
        description:
            "Stop animation when component is not visible to save resources",
        defaultValue: true,
        section: "Performance",
    },
    targetFPS: {
        type: ControlType.Number,
        title: "Target FPS",
        defaultValue: 60,
        min: 15,
        max: 120,
        step: 1,
        section: "Performance",
        description:
            "Target frame rate for the animation. Powered by [FramerHub](https://framerhub.io)",
    },
})
