// Pixel Grid Reveal - Framer Code Component
// Based on: https://github.com/J0SUKE/gsap-threejs-codrops
// A WebGL shader-based pixelated reveal effect for images

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

import * as THREE from "three"

// ─── Shaders (matched 1:1 with original + clean exit/entry guards) ──────────

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D uTexture;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uProgress;
uniform vec3 uColor;
uniform vec2 uContainerRes;
uniform float uDirection; // 0=bottom-top, 1=top-bottom, 2=left-right, 3=right-left

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Maps UVs so grid cells are always square regardless of image aspect
vec2 squaresGrid(vec2 uv) {
    float imageAspectX = 1.0;
    float imageAspectY = 1.0;

    float containerAspectX = uResolution.x / uResolution.y;
    float containerAspectY = uResolution.y / uResolution.x;

    vec2 ratio = vec2(
        min(containerAspectX / imageAspectX, 1.0),
        min(containerAspectY / imageAspectY, 1.0)
    );

    return vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
}

void main() {
    // Cover UVs — image fills container without distortion
    float imageAspectX = uResolution.x / uResolution.y;
    float imageAspectY = uResolution.y / uResolution.x;

    float containerAspectX = uContainerRes.x / uContainerRes.y;
    float containerAspectY = uContainerRes.y / uContainerRes.x;

    vec2 ratio = vec2(
        min(containerAspectX / imageAspectX, 1.0),
        min(containerAspectY / imageAspectY, 1.0)
    );

    vec2 coverUvs = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Image texture
    vec4 tex = texture2D(uTexture, coverUvs);

    // Clean exit: fully revealed, zero grid remnants
    if (uProgress >= 1.0) {
        gl_FragColor = tex;
        return;
    }
    // Clean entry: nothing visible
    if (uProgress <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
    }

    // Generate grid — uses squaresGrid so cells are always square
    vec2 squareUvs = squaresGrid(coverUvs);
    float gridSize = floor(uContainerRes.x / 20.0);
    vec2 grid = vec2(
        floor(squareUvs.x * gridSize) / gridSize,
        floor(squareUvs.y * gridSize) / gridSize
    );
    vec4 gridTexture = vec4(uColor, 0.0);

    // Pick sweep axis based on direction
    // 0 = bottom-top (grid.y), 1 = top-bottom (1-grid.y)
    // 2 = left-right (grid.x), 3 = right-left (1-grid.x)
    float useX = step(1.5, uDirection); // 1 when direction >= 2
    float raw = mix(grid.y, grid.x, useX);
    float invert = step(0.5, mod(uDirection, 2.0)); // 1 for odd values (1,3)
    float axis = mix(raw, 1.0 - raw, invert);

    // Reveal sweep (original formula)
    float height = 0.2;
    float progress = (1.0 + height) - (uProgress * (1.0 + height + height));

    float dist = 1.0 - distance(axis, progress);
    float clampedDist = smoothstep(height, 0.0, distance(axis, progress));
    float randDist = step(1.0 - height * random(grid), dist);
    dist = step(1.0 - height, dist);

    float rand = random(grid);
    float alpha = dist * (clampedDist + rand - 0.5 * (1.0 - randDist));
    alpha = max(0.0, alpha);
    gridTexture.a = alpha;

    tex.rgba *= step(progress, axis);

    vec4 result = vec4(mix(tex, gridTexture, gridTexture.a));

    // Smooth blend to clean image in final 8% to kill any edge remnants
    float cleanBlend = smoothstep(0.92, 1.0, uProgress);
    gl_FragColor = mix(result, texture2D(uTexture, coverUvs), cleanBlend);
}
`

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 */
export default function PixelReveal(props: any) {
    const {
        image,
        gridColor,
        direction,
        duration,
        trigger,
        threshold,
        loop,
        style,
    } = props

    const directionMap = {
        "bottom-top": 0,
        "top-bottom": 1,
        "left-right": 2,
        "right-left": 3,
    } as const

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const sceneRef = React.useRef<{
        renderer: THREE.WebGLRenderer
        scene: THREE.Scene
        camera: THREE.OrthographicCamera
        material: THREE.ShaderMaterial
        geometry: THREE.PlaneGeometry
        mesh: THREE.Mesh
    } | null>(null)
    const progressRef = React.useRef(0)
    const rafRef = React.useRef<number>(0)
    const animRafRef = React.useRef<number>(0)

    // Initialize Three.js scene
    React.useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const width = container.offsetWidth || 400
        const height = container.offsetHeight || 500

        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(
            -0.5,
            0.5,
            0.5,
            -0.5,
            0.1,
            10
        )
        camera.position.z = 1

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            uniforms: {
                uTexture: { value: null },
                uResolution: { value: new THREE.Vector2(0, 0) },
                uContainerRes: { value: new THREE.Vector2(width, height) },
                uProgress: { value: 0 },
                uColor: { value: new THREE.Color(gridColor) },
                uDirection: { value: directionMap[direction] ?? 0 },
            },
        })

        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        sceneRef.current = { renderer, scene, camera, material, geometry, mesh }

        // Render loop
        const render = () => {
            material.uniforms.uProgress.value = progressRef.current
            renderer.render(scene, camera)
            rafRef.current = requestAnimationFrame(render)
        }
        render()

        return () => {
            cancelAnimationFrame(rafRef.current)
            cancelAnimationFrame(animRafRef.current)
            renderer.dispose()
            geometry.dispose()
            material.dispose()
            sceneRef.current = null
        }
    }, [])

    // Update uniforms when props change
    React.useEffect(() => {
        const s = sceneRef.current
        if (!s) return
        s.material.uniforms.uColor.value = new THREE.Color(gridColor)
        s.material.uniforms.uDirection.value = directionMap[direction] ?? 0
    }, [gridColor, direction])

    // Load texture when image changes
    React.useEffect(() => {
        const s = sceneRef.current
        if (!s || !image?.src) return

        const loader = new THREE.TextureLoader()
        loader.crossOrigin = "anonymous"
        loader.load(image.src, (texture) => {
            s.material.uniforms.uTexture.value = texture
            s.material.uniforms.uResolution.value = new THREE.Vector2(
                texture.image.naturalWidth || texture.image.width,
                texture.image.naturalHeight || texture.image.height
            )
        })
    }, [image])

    // Resize handling
    React.useEffect(() => {
        const container = containerRef.current
        const s = sceneRef.current
        if (!container || !s) return

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width === 0 || height === 0) continue
                s.renderer.setSize(width, height)
                s.material.uniforms.uContainerRes.value.set(width, height)
            }
        })
        ro.observe(container)
        return () => ro.disconnect()
    }, [])

    // Animation driver — linear easing to match original GSAP ease:"linear"
    const animateTo = React.useCallback(
        (target: number, onDone?: () => void) => {
            cancelAnimationFrame(animRafRef.current)

            const start = progressRef.current
            const delta = target - start
            if (Math.abs(delta) < 0.001) {
                progressRef.current = target
                onDone?.()
                return
            }

            const startTime = performance.now()
            const ms = duration * 1000

            const tick = () => {
                const elapsed = performance.now() - startTime
                const t = Math.min(1, elapsed / ms)
                // Linear easing — matches original gsap ease:"linear"
                progressRef.current = start + delta * t

                if (t < 1) {
                    animRafRef.current = requestAnimationFrame(tick)
                } else {
                    progressRef.current = target
                    onDone?.()
                }
            }
            animRafRef.current = requestAnimationFrame(tick)
        },
        [duration]
    )

    // Trigger: auto
    React.useEffect(() => {
        if (trigger !== "auto") return
        const timeout = setTimeout(() => {
            animateTo(1, () => {
                if (loop) {
                    const cycle = () => {
                        animateTo(0, () => {
                            setTimeout(() => animateTo(1, cycle), 400)
                        })
                    }
                    setTimeout(cycle, 1000)
                }
            })
        }, 300)
        return () => clearTimeout(timeout)
    }, [trigger, loop, animateTo])

    // Trigger: onScroll (IntersectionObserver)
    React.useEffect(() => {
        if (trigger !== "onScroll") return
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        progressRef.current = 0
                        animateTo(1)
                    } else {
                        cancelAnimationFrame(animRafRef.current)
                        progressRef.current = 0
                    }
                })
            },
            { threshold: threshold / 100 }
        )
        observer.observe(container)
        return () => {
            observer.disconnect()
            cancelAnimationFrame(animRafRef.current)
        }
    }, [trigger, threshold, animateTo])

    // Trigger: onHover
    React.useEffect(() => {
        if (trigger !== "onHover") return
        const container = containerRef.current
        if (!container) return

        const enter = () => animateTo(1)
        const leave = () => animateTo(0)

        container.addEventListener("pointerenter", enter)
        container.addEventListener("pointerleave", leave)
        return () => {
            container.removeEventListener("pointerenter", enter)
            container.removeEventListener("pointerleave", leave)
            cancelAnimationFrame(animRafRef.current)
        }
    }, [trigger, animateTo])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                cursor: trigger === "onHover" ? "pointer" : "default",
            }}
        >
            {/* Static background image for hover trigger so users can see
                the target before interacting. Canvas animates on top of it. */}
            {trigger === "onHover" && image?.src && (
                <img
                    src={image.src}
                    alt={image.alt || ""}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            )}
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    inset: 0,
                }}
            />
        </div>
    )
}

PixelReveal.defaultProps = {
    image: {
        src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
        srcSet: "",
        alt: "",
    },
    gridColor: "#242424",
    direction: "bottom-top",
    duration: 1.6,
    trigger: "onScroll",
    threshold: 20,
    loop: false,
}

addPropertyControls(PixelReveal, {
    image: {
        title: "Image",
        type: ControlType.ResponsiveImage,
    },
    gridColor: {
        title: "Grid Color",
        type: ControlType.Color,
        defaultValue: "#242424",
    },
    direction: {
        title: "Direction",
        type: ControlType.Enum,
        options: ["bottom-top", "top-bottom", "left-right", "right-left"],
        optionTitles: [
            "Bottom → Top",
            "Top → Bottom",
            "Left → Right",
            "Right → Left",
        ],
        defaultValue: "bottom-top",
    },
    duration: {
        title: "Duration",
        type: ControlType.Number,
        min: 0.2,
        max: 5,
        step: 0.1,
        defaultValue: 1.6,
        unit: "s",
    },
    trigger: {
        title: "Trigger",
        type: ControlType.Enum,
        options: ["onScroll", "onHover", "auto"],
        optionTitles: ["Scroll Into View", "On Hover", "Auto Play"],
        defaultValue: "onScroll",
    },
    threshold: {
        title: "Scroll %",
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 20,
        description: "How much visible before triggering",
        hidden: (props: any) => props.trigger !== "onScroll",
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (props: any) => props.trigger !== "auto",
    },
})
