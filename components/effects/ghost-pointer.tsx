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

import { useEffect, useRef, useId } from "react"
import * as THREE from "three"

type Props = {
    trailLength: number
    inertia: number
    grainIntensity: number
    brightness: number
    color: string
    edgeIntensity: number
    fadeDelayMs: number
    fadeDurationMs: number
    maxDevicePixelRatio: number
    targetPixels: number
    zIndex: number
}

export default function GhostCursor(props: Props) {
    const {
        trailLength,
        inertia,
        grainIntensity,
        brightness,
        color,
        edgeIntensity,
        fadeDelayMs,
        fadeDurationMs,
        maxDevicePixelRatio,
        targetPixels,
        zIndex,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)

    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const materialRef = useRef<THREE.ShaderMaterial | null>(null)
    const animationRef = useRef<number | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null)

    const runningRef = useRef(false)
    const visibleRef = useRef(true)
    const mountedRef = useRef(false)

    const isStatic = useIsStaticRenderer()

    const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "")

    /*
     * --------------------------------------------------
     * STATIC FALLBACK
     * --------------------------------------------------
     */

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 1,
                    minHeight: 1,
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 180,
                        height: 180,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: `
                            radial-gradient(
                                circle,
                                ${color} 0%,
                                ${color}CC 25%,
                                ${color}66 50%,
                                ${color}22 70%,
                                transparent 100%
                            )
                        `,
                        opacity: Math.min(1, Math.max(0, brightness * 0.7)),
                        filter: "blur(18px)",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: 90,
                        height: 90,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        background: `
                            radial-gradient(
                                circle,
                                ${color} 0%,
                                ${color}99 40%,
                                transparent 75%
                            )
                        `,
                        opacity: Math.min(1, Math.max(0, brightness)),
                        filter: "blur(4px)",
                    }}
                />
            </div>
        )
    }

    /*
     * --------------------------------------------------
     * LIVE WEBGL VERSION
     * --------------------------------------------------
     */

    useEffect(() => {
        const container = containerRef.current

        if (!container) return

        let active = true

        mountedRef.current = true

        /*
         * --------------------------------------------------
         * SHADERS
         * --------------------------------------------------
         */

        const vertexShader = `
            varying vec2 vUv;

            void main() {
                vUv = uv;

                gl_Position = vec4(position, 1.0);
            }
        `

        const fragmentShader = `
            precision highp float;

            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;

            uniform vec2 uTrail[80];

            uniform float uOpacity;
            uniform float uScale;
            uniform float uBrightness;
            uniform float uGrain;
            uniform float uEdge;

            uniform vec3 uColor;

            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(
                    sin(
                        dot(
                            p,
                            vec2(
                                127.1,
                                311.7
                            )
                        )
                    ) *
                    43758.5453123
                );
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);

                f = f * f * (3.0 - 2.0 * f);

                return mix(
                    mix(
                        hash(i + vec2(0.0, 0.0)),
                        hash(i + vec2(1.0, 0.0)),
                        f.x
                    ),
                    mix(
                        hash(i + vec2(0.0, 1.0)),
                        hash(i + vec2(1.0, 1.0)),
                        f.x
                    ),
                    f.y
                );
            }

            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;

                mat2 rotation = mat2(
                    0.877,
                    0.479,
                    -0.479,
                    0.877
                );

                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(p);

                    p = rotation * p * 2.0;

                    amplitude *= 0.5;
                }

                return value;
            }

            float blob(
                vec2 position,
                vec2 mouse,
                float intensity
            ) {
                vec2 q = vec2(
                    fbm(
                        position *
                        uScale +
                        uTime *
                        0.08
                    ),

                    fbm(
                        position *
                        uScale +
                        vec2(5.2, 1.3) +
                        uTime *
                        0.08
                    )
                );

                vec2 r = vec2(
                    fbm(
                        position *
                        uScale +
                        q *
                        1.5 +
                        uTime *
                        0.12
                    ),

                    fbm(
                        position *
                        uScale +
                        q *
                        1.5 +
                        vec2(8.3, 2.8) +
                        uTime *
                        0.12
                    )
                );

                float smoke = fbm(
                    position *
                    uScale +
                    r *
                    0.8
                );

                float radius = 0.55;

                float distanceFromMouse =
                    length(position - mouse);

                float mask =
                    1.0 -
                    smoothstep(
                        0.0,
                        radius,
                        distanceFromMouse
                    );

                float alpha =
                    pow(smoke, 2.4) *
                    mask *
                    intensity;

                return alpha;
            }

            void main() {
                vec2 aspect = vec2(
                    uResolution.x /
                    max(uResolution.y, 1.0),
                    1.0
                );

                vec2 uv =
                    (vUv * 2.0 - 1.0) *
                    aspect;

                vec2 mouse =
                    (uMouse * 2.0 - 1.0) *
                    aspect;

                float total =
                    blob(
                        uv,
                        mouse,
                        1.0
                    );

                /*
                 * Cursor trail
                 */

                for (int i = 0; i < 80; i++) {
                    float index = float(i);

                    float strength =
                        1.0 -
                        index / 80.0;

                    strength =
                        pow(strength, 2.0);

                    if (strength > 0.01) {
                        vec2 trailPosition =
                            (
                                uTrail[i] *
                                2.0 -
                                1.0
                            ) *
                            aspect;

                        total +=
                            blob(
                                uv,
                                trailPosition,
                                strength *
                                0.75
                            );
                    }
                }

                /*
                 * Color
                 */

                vec3 lightColor =
                    mix(
                        uColor,
                        vec3(1.0),
                        0.15
                    );

                vec3 coolColor =
                    mix(
                        uColor,
                        vec3(
                            0.8,
                            0.9,
                            1.0
                        ),
                        0.25
                    );

                float colorMix =
                    sin(uTime * 0.5) *
                    0.5 +
                    0.5;

                vec3 finalColor =
                    mix(
                        lightColor,
                        coolColor,
                        colorMix
                    );

                finalColor *= uBrightness;

                /*
                 * Edge fade
                 */

                float edgeDistance =
                    min(
                        min(
                            vUv.x,
                            1.0 - vUv.x
                        ),
                        min(
                            vUv.y,
                            1.0 - vUv.y
                        )
                    );

                float edgeMask =
                    mix(
                        1.0 - uEdge,
                        1.0,
                        clamp(
                            edgeDistance * 2.0,
                            0.0,
                            1.0
                        )
                    );

                total *=
                    uOpacity *
                    edgeMask;

                /*
                 * Film grain
                 */

                float grain =
                    hash(
                        gl_FragCoord.xy +
                        uTime * 100.0
                    );

                grain =
                    grain * 2.0 -
                    1.0;

                finalColor +=
                    grain *
                    uGrain *
                    finalColor;

                gl_FragColor =
                    vec4(
                        finalColor,
                        clamp(
                            total,
                            0.0,
                            1.0
                        )
                    );
            }
        `

        /*
         * --------------------------------------------------
         * THREE.JS SETUP
         * --------------------------------------------------
         */

        let renderer: THREE.WebGLRenderer

        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: false,
                powerPreference: "high-performance",
                depth: false,
                stencil: false,
                premultipliedAlpha: false,
            })
        } catch {
            return
        }

        if (!active) {
            renderer.dispose()
            return
        }

        renderer.setClearColor(0x000000, 0)

        renderer.domElement.style.position = "absolute"
        renderer.domElement.style.left = "0"
        renderer.domElement.style.top = "0"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        renderer.domElement.style.display = "block"
        renderer.domElement.style.pointerEvents = "none"

        container.appendChild(renderer.domElement)

        rendererRef.current = renderer

        const scene = new THREE.Scene()

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        /*
         * --------------------------------------------------
         * TRAIL
         * --------------------------------------------------
         */

        const safeTrailLength = Math.min(
            80,
            Math.max(1, Math.floor(trailLength))
        )

        const trailUniform = Array.from(
            { length: 80 },
            () => new THREE.Vector2(0.5, 0.5)
        )

        /*
         * --------------------------------------------------
         * MATERIAL
         * --------------------------------------------------
         */

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,

            uniforms: {
                uTime: {
                    value: 0,
                },

                uResolution: {
                    value: new THREE.Vector2(1, 1),
                },

                uMouse: {
                    value: new THREE.Vector2(0.5, 0.5),
                },

                uTrail: {
                    value: trailUniform,
                },

                uOpacity: {
                    value: 1,
                },

                uScale: {
                    value: 1,
                },

                uBrightness: {
                    value: brightness,
                },

                uGrain: {
                    value: grainIntensity,
                },

                uEdge: {
                    value: edgeIntensity,
                },

                uColor: {
                    value: new THREE.Color(color),
                },
            },

            transparent: true,

            depthWrite: false,

            depthTest: false,

            toneMapped: false,
        })

        materialRef.current = material

        /*
         * --------------------------------------------------
         * GEOMETRY
         * --------------------------------------------------
         */

        const geometry = new THREE.PlaneGeometry(2, 2)

        const mesh = new THREE.Mesh(geometry, material)

        scene.add(mesh)

        /*
         * --------------------------------------------------
         * STATE
         * --------------------------------------------------
         */

        const mouse = new THREE.Vector2(0.5, 0.5)

        const smoothMouse = new THREE.Vector2(0.5, 0.5)

        let velocityX = 0
        let velocityY = 0

        let lastMoveTime = performance.now()

        let opacity = 1

        let pointerActive = false

        const startTime = performance.now()

        /*
         * --------------------------------------------------
         * RESIZE
         * --------------------------------------------------
         */

        const resize = () => {
            if (!active) return

            const rect = container.getBoundingClientRect()

            const width = Math.max(1, Math.floor(rect.width))

            const height = Math.max(1, Math.floor(rect.height))

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                Math.max(0.25, maxDevicePixelRatio)
            )

            const pixels = width * height * dpr * dpr

            const scale =
                pixels > targetPixels ? Math.sqrt(targetPixels / pixels) : 1

            const finalDpr = Math.max(0.5, dpr * scale)

            renderer.setPixelRatio(finalDpr)

            renderer.setSize(width, height, false)

            material.uniforms.uResolution.value.set(
                width * finalDpr,
                height * finalDpr
            )

            const smallest = Math.min(width, height)

            material.uniforms.uScale.value = Math.max(
                0.6,
                Math.min(2.0, smallest / 600)
            )
        }

        resize()

        const resizeObserver = new ResizeObserver(resize)

        resizeObserverRef.current = resizeObserver

        resizeObserver.observe(container)

        /*
         * --------------------------------------------------
         * VISIBILITY OBSERVER
         * --------------------------------------------------
         */

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                visibleRef.current = entry?.isIntersecting ?? true

                if (visibleRef.current && !runningRef.current) {
                    startAnimation()
                }
            },
            {
                threshold: 0,
            }
        )

        intersectionObserverRef.current = intersectionObserver

        intersectionObserver.observe(container)

        /*
         * --------------------------------------------------
         * POINTER
         * --------------------------------------------------
         */

        const eventTarget = container.parentElement || container

        const updateMouse = (event: PointerEvent) => {
            if (!active) return

            const rect = eventTarget.getBoundingClientRect()

            const width = Math.max(1, rect.width)

            const height = Math.max(1, rect.height)

            const x = THREE.MathUtils.clamp(
                (event.clientX - rect.left) / width,
                0,
                1
            )

            const y = THREE.MathUtils.clamp(
                1 - (event.clientY - rect.top) / height,
                0,
                1
            )

            mouse.set(x, y)

            pointerActive = true

            opacity = 1

            lastMoveTime = performance.now()

            startAnimation()
        }

        const pointerEnter = () => {
            if (!active) return

            pointerActive = true

            opacity = 1

            startAnimation()
        }

        const pointerLeave = () => {
            pointerActive = false

            lastMoveTime = performance.now()

            startAnimation()
        }

        eventTarget.addEventListener("pointermove", updateMouse, {
            passive: true,
        })

        eventTarget.addEventListener("pointerenter", pointerEnter, {
            passive: true,
        })

        eventTarget.addEventListener("pointerleave", pointerLeave, {
            passive: true,
        })

        /*
         * --------------------------------------------------
         * ANIMATION
         * --------------------------------------------------
         */

        const animate = () => {
            if (!active || !visibleRef.current) {
                runningRef.current = false

                animationRef.current = null

                return
            }

            const now = performance.now()

            const elapsed = (now - startTime) / 1000

            /*
             * Smooth cursor
             */

            if (pointerActive) {
                const dx = mouse.x - smoothMouse.x

                const dy = mouse.y - smoothMouse.y

                velocityX = velocityX * inertia + dx * (1 - inertia)

                velocityY = velocityY * inertia + dy * (1 - inertia)

                smoothMouse.x += velocityX

                smoothMouse.y += velocityY

                smoothMouse.lerp(mouse, 0.25)
            } else {
                velocityX *= inertia

                velocityY *= inertia

                smoothMouse.x += velocityX

                smoothMouse.y += velocityY

                const idle = now - lastMoveTime

                if (idle > fadeDelayMs) {
                    const fade = Math.min(
                        1,
                        (idle - fadeDelayMs) / Math.max(1, fadeDurationMs)
                    )

                    opacity = Math.max(0, 1 - fade)
                }
            }

            /*
             * Trail
             */

            for (let i = safeTrailLength - 1; i > 0; i--) {
                trailUniform[i].lerp(trailUniform[i - 1], 0.75)
            }

            trailUniform[0].lerp(smoothMouse, 0.75)

            /*
             * Keep unused trail points
             * at the current cursor position.
             */

            for (let i = safeTrailLength; i < 80; i++) {
                trailUniform[i].copy(smoothMouse)
            }

            /*
             * Uniform updates
             */

            material.uniforms.uTime.value = elapsed

            material.uniforms.uOpacity.value = opacity

            /*
             * Render
             */

            renderer.render(scene, camera)

            /*
             * Stop the RAF loop when
             * the cursor has completely faded.
             */

            if (!pointerActive && opacity <= 0.001) {
                runningRef.current = false

                animationRef.current = null

                return
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        function startAnimation() {
            if (runningRef.current || !active || !visibleRef.current) {
                return
            }

            runningRef.current = true

            animationRef.current = requestAnimationFrame(animate)
        }

        /*
         * Start once.
         */

        startAnimation()

        /*
         * --------------------------------------------------
         * CLEANUP
         * --------------------------------------------------
         */

        return () => {
            active = false

            mountedRef.current = false

            runningRef.current = false

            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current)
            }

            animationRef.current = null

            resizeObserver.disconnect()

            intersectionObserver.disconnect()

            eventTarget.removeEventListener("pointermove", updateMouse)

            eventTarget.removeEventListener("pointerenter", pointerEnter)

            eventTarget.removeEventListener("pointerleave", pointerLeave)

            geometry.dispose()

            material.dispose()

            renderer.dispose()

            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(
                    renderer.domElement
                )
            }

            rendererRef.current = null

            materialRef.current = null

            resizeObserverRef.current = null

            intersectionObserverRef.current = null
        }
    }, [
        isStatic,
        trailLength,
        inertia,
        grainIntensity,
        brightness,
        color,
        edgeIntensity,
        fadeDelayMs,
        fadeDurationMs,
        maxDevicePixelRatio,
        targetPixels,
    ])

    /*
     * --------------------------------------------------
     * LIVE CONTAINER
     * --------------------------------------------------
     */

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                position: "relative",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex,
            }}
        />
    )
}

GhostCursor.defaultProps = {
    width: 500,
    height: 500,

    trailLength: 50,

    inertia: 0.5,

    grainIntensity: 0.05,

    brightness: 1,

    color: "#B497CF",

    edgeIntensity: 0,

    fadeDelayMs: 1000,

    fadeDurationMs: 1500,

    maxDevicePixelRatio: 0.5,

    targetPixels: 1300000,

    zIndex: 10,
}

addPropertyControls(GhostCursor, {
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        min: 5,
        max: 80,
        step: 1,
        defaultValue: 50,
        displayStepper: true,
    },

    inertia: {
        type: ControlType.Number,
        title: "Inertia",
        min: 0,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.5,
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#B497CF",
    },

    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1,
    },

    edgeIntensity: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
    },

    grainIntensity: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.05,
    },

    fadeDelayMs: {
        type: ControlType.Number,
        title: "Fade Delay",
        min: 0,
        max: 5000,
        step: 100,
        defaultValue: 1000,
        unit: "ms",
    },

    fadeDurationMs: {
        type: ControlType.Number,
        title: "Fade Duration",
        min: 100,
        max: 5000,
        step: 100,
        defaultValue: 1500,
        unit: "ms",
    },

    maxDevicePixelRatio: {
        type: ControlType.Number,
        title: "Max DPR",
        min: 0.25,
        max: 2,
        step: 0.05,
        defaultValue: 0.5,
    },

    targetPixels: {
        type: ControlType.Number,
        title: "Pixel Budget",
        min: 100000,
        max: 4000000,
        step: 100000,
        defaultValue: 1300000,
    },

    zIndex: {
        type: ControlType.Number,
        title: "Z Index",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 10,
    },
})
