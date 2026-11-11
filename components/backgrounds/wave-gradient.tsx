import * as React from "react"
import { useRef, useEffect } from "react"
import * as THREE from "three"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/** @framerSupportedLayoutWidth any
 *  @framerSupportedLayoutHeight any
 *  @framerIntrinsicWidth 1280
 *  @framerIntrinsicHeight 720 */
type Palette = "Ocean" | "Orchid" | "Ice" | "Aurora" | "Showreel" | "Custom"
type Quality = "Auto" | "High" | "Economy"

type Settings = {
    livePreview: boolean
    useCustomColors: boolean
    customColors: string[]
    palette: Palette
    speed: number
    scale: number
    angle: number
    warp: number
    twirl: number
    softness: number
    grain: number
    quality: Quality
    playing: boolean
    reducedMotion: boolean
    phase: number
    radius: number
    color1: string
    color2: string
    color3: string
    color4: string
}

type Props = Partial<Settings> & {
    motion?: Partial<Settings>
    appearance?: Partial<Settings>
    performance?: Partial<Settings>
    style?: React.CSSProperties
    id?: string
    className?: string
}

const defaults: Settings = {
    livePreview: true,
    useCustomColors: false,
    customColors: ["#3B40DE", "#25133F", "#4E9FC0", "#86FCE3"],
    palette: "Ocean",
    speed: 1,
    scale: 1,
    angle: 45,
    warp: 1,
    twirl: 1,
    softness: 0.7,
    grain: 0.3,
    quality: "Auto",
    playing: true,
    reducedMotion: true,
    phase: 0,
    radius: 0,
    color1: "#3B40DE",
    color2: "#25133F",
    color3: "#4E9FC0",
    color4: "#86FCE3",
}

const palettes: Record<string, string[]> = {
    Ocean: ["#3B40DE", "#25133F", "#4E9FC0", "#86FCE3"],
    Orchid: ["#791BEA", "#C0244B", "#AE7BD8", "#F9E6EC"],
    Ice: ["#4544E4", "#4240AA", "#8DCDE3", "#F3F4F9"],
    Aurora: ["#5942CA", "#AD328F", "#848AC3", "#8CF4E8"],
}

const showreelPalettes = ["Ocean", "Orchid", "Ice", "Aurora"]
const parsedColors = new Map<string, THREE.Vector3>()

const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
precision highp float;

uniform vec2 resolution;
uniform float time, scale, angle, warp, twirl, softness, grain;
uniform vec3 c1, c2, c3, c4;

const float PI = 3.14159265359;

mat2 rotate(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

vec2 mirror(vec2 p) {
    return 1. - abs(mod(p, 2.) - 1.);
}

vec3 gradient(vec2 p, float t) {
    vec2 a = vec2(.16, .08) +
        .14 * vec2(sin(t * .24), cos(t * .19));
    vec2 b = vec2(.63, .32) +
        .12 * vec2(sin(t * .27 + 1.7), cos(t * .21 + 2.));
    vec2 c = vec2(.18, .90) +
        .10 * vec2(cos(t * .23), sin(t * .31));
    vec2 d = vec2(.61, .82) +
        .13 * vec2(cos(t * .19 + 1.), sin(t * .25 + 1.));

    vec2 aspect = vec2(1.7777778, 1.);
    vec2 da = (p - a) * aspect;
    vec2 db = (p - b) * aspect;
    vec2 dc = (p - c) * aspect;
    vec2 dd = (p - d) * aspect;

    float k = 1.65;
    vec4 weights = pow(
        1. / (
            vec4(
                dot(da, da),
                dot(db, db),
                dot(dc, dc),
                dot(dd, dd)
            ) + .035
        ),
        vec4(k)
    );

    weights *= vec4(1.15, .55, 1.0, .85);
    weights /= dot(weights, vec4(1.));

    return c1 * weights.x +
        c2 * weights.y +
        c3 * weights.z +
        c4 * weights.w;
}

vec3 field(vec2 p, float t) {
    vec2 q = p - vec2(.5);
    q.x *= 1.7777778;

    float r = length(q);
    float spin = 6.2831853 * twirl * exp(-r * .95);

    q = rotate(spin) * q;
    q.x /= 1.7777778;

    return gradient(mirror(q + .5), t);
}

float circleWave(float x) {
    float f = fract(x);
    float h = f < .5
        ? f * 4. - 1.
        : (f - .5) * 4. - 1.;

    return (f < .5 ? 1. : -1.) *
        sqrt(max(0., 1. - h * h));
}

vec3 liquid(vec2 uv, float t) {
    vec2 p = (uv - .5) *
        vec2(1.7777778, 1.) / scale;

    float a = angle * PI / 180.;
    vec2 normal = vec2(cos(a), -sin(a));
    vec2 tangent = vec2(sin(a), cos(a));

    // Reference-inspired Circle Wave Warp:
    // height 500, width 660, direction 45, speed 0.2.
    float phase = dot(p, normal) /
        (660. / 1440.) - t * .2;

    p += tangent *
        circleWave(phase) *
        (500. / 1440.) *
        warp;

    p.x /= 1.7777778;
    return field(p + .5, t);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    uv.y = 1. - uv.y;

    float aspect = resolution.x / resolution.y;
    vec2 fit = aspect > 1.7777778
        ? vec2(1., 1.7777778 / aspect)
        : vec2(aspect / 1.7777778, 1.);

    uv = (uv - .5) * fit + .5;

    vec2 px = fit / resolution * softness;

    vec3 color = liquid(uv, time) * .4;
    color += liquid(
        uv + vec2(px.x, px.y), time
    ) * .15;
    color += liquid(
        uv - vec2(px.x, px.y), time
    ) * .15;
    color += liquid(
        uv + vec2(px.x, -px.y), time
    ) * .15;
    color += liquid(
        uv + vec2(-px.x, px.y), time
    ) * .15;

    float noise = fract(
        sin(dot(
            gl_FragCoord.xy,
            vec2(12.9898, 78.233)
        )) * 43758.5453
    ) - .5;

    gl_FragColor = vec4(
        clamp(color + noise * grain / 255., 0., 1.),
        1.
    );
}
`

function selectedColors(p: Settings, time: number) {
    if (p.useCustomColors) {
        const list =
            Array.isArray(p.customColors) && p.customColors.length > 0
                ? p.customColors
                : [p.color1, p.color2, p.color3, p.color4]

        if (list.length === 1) return [list[0], list[0], list[0], list[0]]
        if (list.length === 2) return [list[0], list[1], list[0], list[1]]
        if (list.length === 3) return [list[0], list[1], list[2], list[0]]
        if (list.length === 4) return [list[0], list[1], list[2], list[3]]

        const n = list.length - 1
        return [
            list[0],
            list[Math.round(n / 3)],
            list[Math.round((2 * n) / 3)],
            list[n],
        ]
    }

    if (p.palette === "Custom") {
        return [p.color1, p.color2, p.color3, p.color4]
    }

    if (p.palette === "Showreel") {
        const index = Math.floor((((time % 12) + 12) % 12) / 3)
        return palettes[showreelPalettes[index]]
    }

    return palettes[p.palette] || palettes.Ocean
}

function colorVector(value: string) {
    const cached = parsedColors.get(value)
    if (cached) return cached

    const hex = new THREE.Color(value).getHex()
    const vector = new THREE.Vector3(
        ((hex >> 16) & 255) / 255,
        ((hex >> 8) & 255) / 255,
        (hex & 255) / 255
    )

    parsedColors.set(value, vector)
    return vector
}

export default function LiquidGlass(incomingProps: Props) {
    const props: Settings & Props = {
        ...defaults,
        ...incomingProps,
        ...(incomingProps.motion || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.performance || {}),
    }

    const mountRef = useRef<HTMLDivElement>(null)
    const propsRef = useRef(props)
    const refreshRef = useRef<() => void>(() => {})
    const isIntersecting = useRef(true)
    const isStatic = useIsStaticRenderer()

    propsRef.current = props

    useEffect(() => {
        const container = mountRef.current
        if (!container || typeof window === "undefined") return

        let renderer: THREE.WebGLRenderer | null = null
        let scene: THREE.Scene | null = null
        let camera: THREE.PerspectiveCamera | null = null
        let geometry: THREE.PlaneGeometry | null = null
        let material: THREE.ShaderMaterial | null = null
        let mesh: THREE.Mesh | null = null
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null

        let frameId = 0
        let elapsed = 0
        let previous = 0
        let disposed = false
        let contextLost = false

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const drawingSize = new THREE.Vector2()
        const colors = ["c1", "c2", "c3", "c4"] as const

        const shouldAnimate = () => {
            const p = propsRef.current
            return (
                !isStatic &&
                (p.livePreview ?? true) &&
                p.playing &&
                p.speed > 0 &&
                !(p.reducedMotion && media.matches)
            )
        }

        const active = () =>
            shouldAnimate() &&
            isIntersecting.current &&
            !document.hidden &&
            !contextLost &&
            !disposed

        const renderFrame = () => {
            if (
                !renderer ||
                !scene ||
                !camera ||
                !material ||
                contextLost ||
                disposed
            )
                return

            const p = propsRef.current
            const time = elapsed + p.phase
            const u = material.uniforms

            renderer.getDrawingBufferSize(drawingSize)
            u.resolution.value.copy(drawingSize)
            u.time.value = time
            u.scale.value = Math.max(0.01, p.scale)
            u.angle.value = p.angle
            u.warp.value = p.warp
            u.twirl.value = p.twirl
            u.softness.value = p.softness
            u.grain.value = p.grain

            const palette = selectedColors(p, time)
            colors.forEach((name, index) =>
                u[name].value.copy(colorVector(palette[index]))
            )

            renderer.render(scene, camera)
        }

        const tick = (now: number) => {
            frameId = 0

            if (!active()) {
                previous = 0
                return
            }

            if (previous) {
                elapsed +=
                    Math.min((now - previous) / 1000, 0.1) *
                    propsRef.current.speed
            }

            previous = now
            renderFrame()

            if (active()) {
                frameId = requestAnimationFrame(tick)
            }
        }

        const refresh = () => {
            if (disposed) return

            if (frameId) cancelAnimationFrame(frameId)
            frameId = 0
            previous = 0

            renderFrame()

            if (active()) {
                frameId = requestAnimationFrame(tick)
            }
        }

        const resize = () => {
            if (!renderer || !camera || !mesh || disposed) return

            const rect = container.getBoundingClientRect()
            const width = Math.max(1, rect.width)
            const height = Math.max(1, rect.height)
            const p = propsRef.current

            const maxDpr =
                p.quality === "High" ? 2 : p.quality === "Economy" ? 1 : 1.5

            const budget =
                p.quality === "High"
                    ? 3600000
                    : p.quality === "Economy"
                      ? 650000
                      : 1500000

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                maxDpr,
                Math.sqrt(budget / (width * height))
            )

            renderer.setPixelRatio(dpr)
            renderer.setSize(width, height, false)

            camera.aspect = width / height
            camera.updateProjectionMatrix()

            const visibleHeight =
                2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)

            mesh.scale.set(
                visibleHeight * camera.aspect * 0.51,
                visibleHeight * 0.51,
                1
            )

            refresh()
        }

        const onInteraction = () => {
            if (!shouldAnimate()) renderFrame()
        }

        const onContextLost = (event: Event) => {
            event.preventDefault()
            contextLost = true

            if (frameId) cancelAnimationFrame(frameId)
            frameId = 0
        }

        const onContextRestored = () => {
            contextLost = false
            refresh()
        }

        try {
            renderer = new THREE.WebGLRenderer({
                alpha: false,
                antialias: false,
                powerPreference: "low-power",
            })

            renderer.outputColorSpace = THREE.SRGBColorSpace

            renderer.domElement.style.width = "100%"
            renderer.domElement.style.height = "100%"
            renderer.domElement.style.display = "block"
            container.appendChild(renderer.domElement)

            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(50, 1, 0.01, 10)
            camera.position.z = 1

            geometry = new THREE.PlaneGeometry(2, 2)
            material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    resolution: {
                        value: new THREE.Vector2(1, 1),
                    },
                    time: { value: 0 },
                    scale: { value: 1 },
                    angle: { value: 45 },
                    warp: { value: 1 },
                    twirl: { value: 1 },
                    softness: { value: 0.7 },
                    grain: { value: 0.3 },
                    c1: {
                        value: new THREE.Vector3(),
                    },
                    c2: {
                        value: new THREE.Vector3(),
                    },
                    c3: {
                        value: new THREE.Vector3(),
                    },
                    c4: {
                        value: new THREE.Vector3(),
                    },
                },
            })

            mesh = new THREE.Mesh(geometry, material)
            mesh.frustumCulled = false
            scene.add(mesh)

            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)

            intersectionObserver = new IntersectionObserver((entries) => {
                isIntersecting.current = !!entries[0]?.isIntersecting
                refresh()
            })
            intersectionObserver.observe(container)

            media.addEventListener("change", refresh)
            document.addEventListener("visibilitychange", refresh)
            window.addEventListener("scroll", onInteraction, { passive: true })
            container.addEventListener("pointermove", onInteraction)
            container.addEventListener("pointerdown", onInteraction)
            renderer.domElement.addEventListener(
                "webglcontextlost",
                onContextLost
            )
            renderer.domElement.addEventListener(
                "webglcontextrestored",
                onContextRestored
            )

            refreshRef.current = resize
            resize()
        } catch (error) {
            console.warn(
                "LiquidGlass: WebGL unavailable; showing CSS gradient.",
                error
            )
        }

        return () => {
            disposed = true
            refreshRef.current = () => {}

            if (frameId) {
                cancelAnimationFrame(frameId)
            }

            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()

            media.removeEventListener("change", refresh)
            document.removeEventListener("visibilitychange", refresh)
            window.removeEventListener("scroll", onInteraction)
            container.removeEventListener("pointermove", onInteraction)
            container.removeEventListener("pointerdown", onInteraction)

            if (renderer) {
                renderer.domElement.removeEventListener(
                    "webglcontextlost",
                    onContextLost
                )
                renderer.domElement.removeEventListener(
                    "webglcontextrestored",
                    onContextRestored
                )
            }

            geometry?.dispose()
            material?.dispose()
            scene?.clear()

            // No textures or render targets are created.
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()

                if (container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement)
                }
            }

            scene = null
            camera = null
            mesh = null
            geometry = null
            material = null
            renderer = null
        }
    }, [isStatic])

    useEffect(() => {
        refreshRef.current()
    }, [
        props.livePreview,
        props.playing,
        props.reducedMotion,
        props.quality,
        props.useCustomColors,
        JSON.stringify(props.customColors),
        props.palette,
        props.speed,
        props.scale,
        props.angle,
        props.warp,
        props.twirl,
        props.softness,
        props.grain,
        props.phase,
        props.color1,
        props.color2,
        props.color3,
        props.color4,
    ])

    const backgroundColors = selectedColors(props, props.phase)

    return (
        <div
            id={incomingProps.id}
            className={incomingProps.className}
            ref={mountRef}
            aria-hidden="true"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...props.style,
                borderRadius: props.radius,
                background: `linear-gradient(
                    135deg,
                    ${backgroundColors[0]},
                    ${backgroundColors[1]},
                    ${backgroundColors[3]},
                    ${backgroundColors[2]}
                )`,
            }}
        />
    )
}

LiquidGlass.defaultProps = {
    livePreview: true,
    motion: {
        playing: true,
        speed: 1,
        phase: 0,
        angle: 45,
        warp: 1,
        twirl: 1,
    },
    appearance: {
        useCustomColors: defaults.useCustomColors,
        customColors: defaults.customColors,
        palette: "Ocean",
        scale: 1,
        softness: 0.7,
        grain: 0.3,
        radius: 0,
        color1: defaults.color1,
        color2: defaults.color2,
        color3: defaults.color3,
        color4: defaults.color4,
    },
    performance: {
        quality: "Auto",
        reducedMotion: true,
    },
}

addPropertyControls(LiquidGlass as any, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Animate outside static renders.",
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            playing: {
                type: ControlType.Boolean,
                title: "Animate",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 3,
                step: 0.05,
                unit: "×",
                defaultValue: 1,
                description: "Motion rate.",
            },
            phase: {
                type: ControlType.Number,
                title: "Start Time",
                min: 0,
                max: 60,
                step: 0.1,
                unit: "s",
                defaultValue: 0,
                description: "Choose starting frame.",
            },
            angle: {
                type: ControlType.Number,
                title: "Direction",
                min: 0,
                max: 180,
                step: 1,
                unit: "°",
                defaultValue: 45,
                description: "Fold direction.",
            },
            warp: {
                type: ControlType.Number,
                title: "Wave Height",
                min: 0,
                max: 2,
                step: 0.05,
                unit: "×",
                defaultValue: 1,
                description: "Bend strength.",
            },
            twirl: {
                type: ControlType.Number,
                title: "Twirl",
                min: 0,
                max: 2,
                step: 0.05,
                unit: "×",
                defaultValue: 1,
                description: "Spiral strength.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            useCustomColors: {
                type: ControlType.Boolean,
                title: "Custom Colors",
                defaultValue: false,
            },
            customColors: {
                type: ControlType.Array,
                title: "Colors",
                control: {
                    type: ControlType.Color,
                    defaultValue: "#3B40DE",
                },
                defaultValue: defaults.customColors,
                hidden: (p) => !p?.useCustomColors,
            },
            palette: {
                type: ControlType.Enum,
                title: "Palette",
                options: [
                    "Ocean",
                    "Orchid",
                    "Ice",
                    "Aurora",
                    "Showreel",
                    "Custom",
                ],
                defaultValue: "Ocean",
                hidden: (p) => !!p?.useCustomColors,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.5,
                max: 2,
                step: 0.05,
                unit: "×",
                defaultValue: 1,
                description: "Fold size.",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 3,
                step: 0.1,
                unit: "px",
                defaultValue: 0.7,
                description: "Smooth fold edges.",
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 5,
                step: 0.1,
                unit: "%",
                defaultValue: 0.3,
                description: "Reduce color banding.",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            color1: {
                type: ControlType.Color,
                title: "Blue",
                defaultValue: defaults.color1,
                hidden: (p) => p?.useCustomColors || p?.palette !== "Custom",
            },
            color2: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: defaults.color2,
                hidden: (p) => p?.useCustomColors || p?.palette !== "Custom",
            },
            color3: {
                type: ControlType.Color,
                title: "Midtone",
                defaultValue: defaults.color3,
                hidden: (p) => p?.useCustomColors || p?.palette !== "Custom",
            },
            color4: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: defaults.color4,
                hidden: (p) => p?.useCustomColors || p?.palette !== "Custom",
            },
        },
    },
    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["Auto", "High", "Economy"],
                defaultValue: "Auto",
                description: "Caps GPU pixels.",
            },
            reducedMotion: {
                type: ControlType.Boolean,
                title: "Reduce Motion",
                defaultValue: true,
                description: "Follow device preference.",
            },
        },
    },
})
