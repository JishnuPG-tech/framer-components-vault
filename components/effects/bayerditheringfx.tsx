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


// ─── Shaders (verbatim from zavalit/bayer-dithering-webgl-demo) ────────────

const VERTEX_SHADER = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform int   uShapeType;

const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int MAX_CLICKS = 10;

uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

// ─── Bayer ordered dithering ───────────────────────────────────────────────
float Bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a)) * 0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a)) * 0.25 + Bayer2(a))

// ─── FBM noise ─────────────────────────────────────────────────────────────
#define FBM_OCTAVES    5
#define FBM_LACUNARITY 1.25
#define FBM_GAIN       1.
#define FBM_SCALE      4.0

float hash11(float n) { return fract(sin(n) * 43758.5453); }

float vnoise(vec3 p) {
    vec3 ip = floor(p), fp = fract(p);
    float n000 = hash11(dot(ip + vec3(0,0,0), vec3(1,57,113)));
    float n100 = hash11(dot(ip + vec3(1,0,0), vec3(1,57,113)));
    float n010 = hash11(dot(ip + vec3(0,1,0), vec3(1,57,113)));
    float n110 = hash11(dot(ip + vec3(1,1,0), vec3(1,57,113)));
    float n001 = hash11(dot(ip + vec3(0,0,1), vec3(1,57,113)));
    float n101 = hash11(dot(ip + vec3(1,0,1), vec3(1,57,113)));
    float n011 = hash11(dot(ip + vec3(0,1,1), vec3(1,57,113)));
    float n111 = hash11(dot(ip + vec3(1,1,1), vec3(1,57,113)));
    vec3 w = fp * fp * fp * (fp * (fp * 6. - 15.) + 10.);
    float x00 = mix(n000, n100, w.x), x10 = mix(n010, n110, w.x);
    float x01 = mix(n001, n101, w.x), x11 = mix(n011, n111, w.x);
    float y0  = mix(x00,  x10,  w.y), y1  = mix(x01,  x11,  w.y);
    return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
    vec3  p    = vec3(uv * FBM_SCALE, t);
    float amp  = 1., freq = 1., sum = 1.;
    for (int i = 0; i < FBM_OCTAVES; ++i) {
        sum  += amp * vnoise(p * freq);
        freq *= FBM_LACUNARITY;
        amp  *= FBM_GAIN;
    }
    return sum * 0.5 + 0.5;
}

// ─── Pixel-shape masks ──────────────────────────────────────────────────────
float maskCircle(vec2 p, float cov) {
    float r  = sqrt(cov) * .25;
    float d  = length(p - 0.5) - r;
    float aa = 0.5 * fwidth(d);
    return cov * (1.0 - smoothstep(-aa, aa, d * 2.));
}

float maskTriangle(vec2 p, vec2 id, float cov) {
    bool flip = mod(id.x + id.y, 2.0) > 0.5;
    if (flip) p.x = 1.0 - p.x;
    float r  = sqrt(cov);
    float d  = p.y - r * (1.0 - p.x);
    float aa = fwidth(d);
    return cov * clamp(0.5 - d / aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov) {
    float r = sqrt(cov) * 0.564;
    return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

// ─── Main ───────────────────────────────────────────────────────────────────
void main() {
    vec2  fragCoord    = gl_FragCoord.xy - uResolution * .5;
    float ar           = uResolution.x / uResolution.y;
    vec2  pixelId      = floor(fragCoord / uPixelSize);
    vec2  pixelUV      = fract(fragCoord / uPixelSize);
    float cellPx       = 8.0 * uPixelSize;
    vec2  cellCoord    = floor(fragCoord / cellPx) * cellPx;
    vec2  uv           = cellCoord / uResolution * vec2(ar, 1.0);

    float feed = fbm2(uv, uTime * 0.05);
    feed = feed * 0.5 - 0.65;

    // click ripples
    const float speed     = 0.30;
    const float thickness = 0.10;
    const float dampT     = 1.0;
    const float dampR     = 10.0;
    for (int i = 0; i < MAX_CLICKS; ++i) {
        vec2 pos = uClickPos[i];
        if (pos.x < 0.0) continue;
        vec2  cuv  = ((pos - uResolution * .5 - cellPx * .5) / uResolution) * vec2(ar, 1.0);
        float t    = max(uTime - uClickTimes[i], 0.0);
        float r    = distance(uv, cuv);
        float ring = exp(-pow((r - speed * t) / thickness, 2.0));
        float att  = exp(-dampT * t) * exp(-dampR * r);
        feed = max(feed, ring * att);
    }

    // Bayer threshold → binary coverage
    float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
    float bw    = step(0.5, feed + bayer);

    // shape mask
    float M;
    if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle  (pixelUV, bw);
    else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle (pixelUV, pixelId, bw);
    else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond  (pixelUV, bw);
    else                                   M = bw;

    fragColor = vec4(uColor, M);
}
`

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHAPE_OPTIONS = ["square", "circle", "triangle", "diamond"] as const
type Shape = (typeof SHAPE_OPTIONS)[number]

interface SceneState {
    renderer: any
    material: any
    scene: any
    camera: any
    geometry: any
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function BayerDithering(props: {
    inkColor: string
    backgroundColor: string
    pixelSize: number
    shapeType: Shape
    timeSpeed: number
    style?: React.CSSProperties
}) {
    const {
        inkColor,
        backgroundColor,
        pixelSize,
        shapeType,
        timeSpeed,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const sceneRef = React.useRef<SceneState | null>(null)
    const rafRef = React.useRef(0)
    const clockRef = React.useRef(0)
    const lastTimeRef = React.useRef(0)
    const clickSlotRef = React.useRef(0)
    const timeSpeedRef = React.useRef(timeSpeed)

    // Per-slot click data — populated after THREE loads
    const clickPosRef = React.useRef<any[]>([])
    const clickTimesRef = React.useRef<number[]>([])

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Keep timeSpeed ref in sync
    React.useEffect(() => {
        timeSpeedRef.current = timeSpeed
    }, [timeSpeed])

    // ── Mount: build Three.js scene (dynamic import avoids SSG failure) ──────
    React.useEffect(() => {
        if (isCanvas) return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        let alive = true
        let disposeAll: (() => void) | null = null

        import("three").then((THREE) => {
            if (!alive) return

            // Init click data now that THREE is available
            clickPosRef.current = Array.from(
                { length: 10 },
                () => new THREE.Vector2(-1, -1)
            )
            clickTimesRef.current = Array(10).fill(-1)

            const dpr = Math.min(2, window.devicePixelRatio)
            const rect = container.getBoundingClientRect()
            const w = rect.width || 800
            const h = rect.height || 500

            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: false,
            })
            renderer.setPixelRatio(dpr)
            renderer.setSize(w, h)

            // Camera is required by Three.js but the vertex shader bypasses it
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
            camera.position.z = 1

            // Full-screen quad in clip space
            const geometry = new THREE.PlaneGeometry(2, 2)

            const inkC = new THREE.Color(inkColor)
            const material = new THREE.ShaderMaterial({
                glslVersion: THREE.GLSL3,
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
                transparent: true,
                depthTest: false,
                uniforms: {
                    uResolution: { value: new THREE.Vector2(w * dpr, h * dpr) },
                    uTime: { value: 0.0 },
                    uColor: {
                        value: new THREE.Vector3(inkC.r, inkC.g, inkC.b),
                    },
                    uPixelSize: { value: pixelSize },
                    uShapeType: { value: SHAPE_OPTIONS.indexOf(shapeType) },
                    uClickPos: { value: clickPosRef.current },
                    uClickTimes: { value: clickTimesRef.current },
                },
            })

            const mesh = new THREE.Mesh(geometry, material)
            const scene = new THREE.Scene()
            scene.add(mesh)

            sceneRef.current = { renderer, material, scene, camera, geometry }
            lastTimeRef.current = performance.now()

            // Render loop
            const render = () => {
                rafRef.current = requestAnimationFrame(render)
                const now = performance.now()
                const dt = (now - lastTimeRef.current) / 1000
                lastTimeRef.current = now
                clockRef.current += dt * timeSpeedRef.current
                material.uniforms.uTime.value = clockRef.current
                renderer.render(scene, camera)
            }
            render()

            // Resize observer
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width: ew, height: eh } = entry.contentRect
                    if (ew === 0 || eh === 0) continue
                    const d = Math.min(2, window.devicePixelRatio)
                    renderer.setSize(ew, eh)
                    material.uniforms.uResolution.value.set(ew * d, eh * d)
                }
            })
            ro.observe(container)

            disposeAll = () => {
                cancelAnimationFrame(rafRef.current)
                ro.disconnect()
                geometry.dispose()
                material.dispose()
                renderer.dispose()
                sceneRef.current = null
            }
        })

        return () => {
            alive = false
            disposeAll?.()
        }
    }, [isCanvas]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Uniform updates when props change ───────────────────────────────────
    React.useEffect(() => {
        const s = sceneRef.current
        if (!s) return
        import("three").then(({ Color }) => {
            const c = new Color(inkColor)
            s.material.uniforms.uColor.value.set(c.r, c.g, c.b)
        })
    }, [inkColor])

    React.useEffect(() => {
        const s = sceneRef.current
        if (!s) return
        s.material.uniforms.uPixelSize.value = pixelSize
    }, [pixelSize])

    React.useEffect(() => {
        const s = sceneRef.current
        if (!s) return
        s.material.uniforms.uShapeType.value = SHAPE_OPTIONS.indexOf(shapeType)
    }, [shapeType])

    // ── Click → ripple ──────────────────────────────────────────────────────
    const handlePointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const s = sceneRef.current
            const canvas = canvasRef.current
            if (!s || !canvas || clickPosRef.current.length === 0) return
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(2, window.devicePixelRatio)
            const x = (e.clientX - rect.left) * dpr
            const y = (rect.height - (e.clientY - rect.top)) * dpr // flip Y for WebGL

            const slot = clickSlotRef.current
            clickPosRef.current[slot].set(x, y)
            clickTimesRef.current[slot] = clockRef.current
            s.material.uniforms.uClickTimes.value[slot] = clockRef.current
            clickSlotRef.current = (slot + 1) % 10
        },
        []
    )

    // ── Framer canvas placeholder ───────────────────────────────────────────
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: backgroundColor,
                    overflow: "hidden",
                }}
            >
                {/* dot grid preview */}
                <svg
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", inset: 0, opacity: 0.25 }}
                >
                    <defs>
                        <pattern
                            id="dither-preview"
                            x="0"
                            y="0"
                            width="16"
                            height="16"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="8" cy="8" r="3" fill={inkColor} />
                        </pattern>
                    </defs>
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#dither-preview)"
                    />
                </svg>
                <div
                    style={{
                        position: "relative",
                        textAlign: "center",
                        color: inkColor,
                        fontFamily: "monospace",
                        fontSize: 12,
                        opacity: 0.7,
                        userSelect: "none",
                        pointerEvents: "none",
                        lineHeight: "1.6",
                    }}
                >
                    View preview to watch animation
                </div>
            </div>
        )
    }

    // ── Live render ─────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
                cursor: "crosshair",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

BayerDithering.defaultProps = {
    inkColor: "#1a1a1a",
    backgroundColor: "#f0ebe0",
    pixelSize: 8,
    shapeType: "circle",
    timeSpeed: 1.0,
}

addPropertyControls(BayerDithering, {
    inkColor: {
        title: "Ink Color",
        type: ControlType.Color,
        defaultValue: "#1a1a1a",
    },
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#f0ebe0",
    },
    pixelSize: {
        title: "Pixel Size",
        type: ControlType.Number,
        defaultValue: 8,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        description: "Dither cell size in pixels",
    },
    shapeType: {
        title: "Dot Shape",
        type: ControlType.Enum,
        options: ["square", "circle", "triangle", "diamond"],
        optionTitles: ["Square", "Circle", "Triangle", "Diamond"],
        defaultValue: "circle",
        displaySegmentedControl: false,
    },
    timeSpeed: {
        title: "Speed",
        type: ControlType.Number,
        defaultValue: 1.0,
        min: 0,
        max: 5,
        step: 0.1,
        description: "Animation time multiplier (0 = frozen)",
    },
})
