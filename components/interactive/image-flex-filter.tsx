// ThreeGlitchImage – Framer code component that reproduces the Zajno/StacksSorted WebGL image effect
// Uses Three.js with a custom fragment shader (chromatic aberration + grid-based mouse flow)
// Drag from Insert → Code, then pick an image. Hover/drag over it to see the effect.

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

import { startTransition } from "react"

interface ImageFlexFilterProps {
    image: { src: string; alt?: string }
    grid: number
    ease: number
    leaveEase: number
    aberration: number
    decay: number
    perspective: number
    rounded: number
    bg: string
    saturateOnHover: boolean
    imageFill: "cover" | "contain" | "fill" | "fit"
    showCursorCircle: boolean
    cursorCircleSize: number
    cursorCircleColor: string
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageFlexFilter(props: ImageFlexFilterProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        grid = 20,
        ease = 0.02,
        leaveEase = 0.05,
        aberration = 1.0,
        decay = 0.05,
        perspective = 80,
        rounded = 10,
        bg = "#111215",
        saturateOnHover = true,
        imageFill = "cover",
        showCursorCircle = true,
        cursorCircleSize = 20,
        cursorCircleColor = "#FFFFFF",
    } = props

    const hostRef = React.useRef<HTMLDivElement>(null)
    const rendererRef = React.useRef<any>(null)
    const sceneRef = React.useRef<any>(null)
    const cameraRef = React.useRef<any>(null)
    const meshRef = React.useRef<any>(null)
    const uniformsRef = React.useRef<any>(null)
    const frameRef = React.useRef(0)
    const isStatic = useIsStaticRenderer()
    const cursorRef = React.useRef<HTMLDivElement>(null)
    const [cursorPosition, setCursorPosition] = React.useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = React.useState(false)

    // mouse state
    const mouseRef = React.useRef({ x: 0.5, y: 0.5 })
    const targetRef = React.useRef({ x: 0.5, y: 0.5 })
    const prevRef = React.useRef({ x: 0.5, y: 0.5 })
    const easeRef = React.useRef(ease)

    // shaders
    const vertexShader = React.useMemo(
        () => `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
        []
    )

    const fragmentShader = React.useMemo(
        () => `
    varying vec2 vUv;
    uniform sampler2D u_texture;
    uniform vec2 u_mouse;
    uniform vec2 u_prevMouse;
    uniform float u_aberrationIntensity;
    uniform vec2 u_grid;

    void main(){
      // snap to grid
      vec2 gridUV = floor(vUv * u_grid) / u_grid;
      vec2 centerOfPixel = gridUV + (1.0 / u_grid);

      vec2 mouseDirection = u_mouse - u_prevMouse; // how the mouse moved (normalized space)
      vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
      float pixelDistanceToMouse = length(pixelToMouseDirection);
      float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);

      vec2 uvOffset = strength * -mouseDirection * 0.2;
      vec2 uv = vUv - uvOffset;

      // chromatic aberration (horizontal split)
      float split = strength * u_aberrationIntensity * 0.01;
      vec4 colR = texture2D(u_texture, uv + vec2(split, 0.0));
      vec4 colG = texture2D(u_texture, uv);
      vec4 colB = texture2D(u_texture, uv - vec2(split, 0.0));
      gl_FragColor = vec4(colR.r, colG.g, colB.b, 1.0);
    }
  `,
        []
    )

    // setup / teardown
    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const host = hostRef.current
        if (!host) return

        let THREE: any

        const loadThree = async () => {
            try {
                THREE = (await import(
                    "https://unpkg.com/three@0.158.0/build/three.module.js" as any
                )) as any
            } catch (error) {
                console.error("Failed to load Three.js:", error)
                return
            }

            const scene = new THREE.Scene()
            sceneRef.current = scene

            const camera = new THREE.PerspectiveCamera(
                perspective,
                host.clientWidth / Math.max(1, host.clientHeight),
                0.01,
                10
            )
            camera.position.z = 1
            cameraRef.current = camera

            const renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
            })
            renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
            renderer.setSize(host.clientWidth, Math.max(1, host.clientHeight))
            host.appendChild(renderer.domElement)
            rendererRef.current = renderer

            const texture = new THREE.TextureLoader().load(image.src, () => {
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.generateMipmaps = false
                texture.needsUpdate = true
                renderer.render(scene, camera)
            })

            const uniforms = {
                u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
                u_prevMouse: { value: new THREE.Vector2(0.5, 0.5) },
                u_aberrationIntensity: { value: 0.0 },
                u_texture: { value: texture },
                u_grid: { value: new THREE.Vector2(grid, grid) },
            }
            uniformsRef.current = uniforms

            const mat = new THREE.ShaderMaterial({
                uniforms,
                vertexShader,
                fragmentShader,
            })
            const geo = new THREE.PlaneGeometry(2, 2)
            const mesh = new THREE.Mesh(geo, mat)
            scene.add(mesh)
            meshRef.current = mesh

            let raf: number
            const animate = (t: number) => {
                raf = requestAnimationFrame(animate)
                // ease mouse
                const m = mouseRef.current
                const trg = targetRef.current
                m.x += (trg.x - m.x) * easeRef.current
                m.y += (trg.y - m.y) * easeRef.current

                uniforms.u_mouse.value.set(m.x, 1.0 - m.y)
                uniforms.u_prevMouse.value.set(
                    prevRef.current.x,
                    1.0 - prevRef.current.y
                )

                // decay aberration
                const cur = uniforms.u_aberrationIntensity.value
                uniforms.u_aberrationIntensity.value = Math.max(0, cur - decay)

                renderer.render(scene, camera)
                frameRef.current = t
            }
            raf = requestAnimationFrame(animate)

            // resize
            const onResize = () => {
                const w = host.clientWidth
                const h = Math.max(1, host.clientHeight)
                renderer.setSize(w, h)
                camera.aspect = w / h
                camera.updateProjectionMatrix()
            }
            const ro = new ResizeObserver(onResize)
            ro.observe(host)

            // cleanup
            return () => {
                cancelAnimationFrame(raf)
                ro.disconnect()
                geo.dispose()
                mat.dispose()
                texture.dispose?.()
                renderer.dispose()
                if (
                    renderer.domElement &&
                    renderer.domElement.parentNode === host
                ) {
                    host.removeChild(renderer.domElement)
                }
            }
        }

        loadThree()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic])

    // update uniforms when props change
    React.useEffect(() => {
        if (uniformsRef.current) {
            uniformsRef.current.u_grid.value.set(grid, grid)
        }
    }, [grid])

    React.useEffect(() => {
        easeRef.current = ease
    }, [ease])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        // swap texture when image changes
        const uniforms = uniformsRef.current
        const renderer = rendererRef.current
        const scene = sceneRef.current
        const camera = cameraRef.current
        if (!uniforms || !renderer || !scene || !camera) return

        const loadThree = async () => {
            try {
                const THREE = (await import(
                    "https://unpkg.com/three@0.158.0/build/three.module.js" as any
                )) as any
                const loader = new THREE.TextureLoader()
                const next = loader.load(image.src)
                next.minFilter = THREE.LinearFilter
                next.magFilter = THREE.LinearFilter
                next.generateMipmaps = false
                uniforms.u_texture.value = next
                renderer.render(scene, camera)
                return () => next.dispose?.()
            } catch (error) {
                console.error("Failed to load Three.js:", error)
            }
        }

        loadThree()
    }, [image.src, isStatic])

    // pointer handlers
    React.useEffect(() => {
        if (isStatic) return

        const host = hostRef.current
        if (!host) return

        const onMove = (e: MouseEvent) => {
            const rect = host.getBoundingClientRect()
            prevRef.current = { ...targetRef.current }
            startTransition(() => {
                targetRef.current = {
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height,
                }
                setCursorPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            })
            // spike aberration
            if (uniformsRef.current) {
                uniformsRef.current.u_aberrationIntensity.value = aberration
            }
            easeRef.current = ease
        }
        const onEnter = (e: MouseEvent) => {
            const rect = host.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            startTransition(() => {
                mouseRef.current = { x, y }
                targetRef.current = { x, y }
                prevRef.current = { x, y }
                setCursorPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
                setIsHovering(true)
            })
            easeRef.current = ease
        }
        const onLeave = () => {
            easeRef.current = leaveEase
            startTransition(() => {
                targetRef.current = { ...prevRef.current }
                setIsHovering(false)
            })
        }

        host.addEventListener("mousemove", onMove)
        host.addEventListener("mouseenter", onEnter)
        host.addEventListener("mouseleave", onLeave)
        return () => {
            host.removeEventListener("mousemove", onMove)
            host.removeEventListener("mouseenter", onEnter)
            host.removeEventListener("mouseleave", onLeave)
        }
    }, [aberration, ease, leaveEase, isStatic])

    // container styles (saturation hover like demo)
    const filterStyle =
        saturateOnHover && !isStatic
            ? { filter: "saturate(0)", transition: "filter .4s ease" }
            : {}

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: rounded,
                    background: bg,
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: imageFill === "fit" ? "contain" : imageFill,
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            />
        )
    }

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: rounded,
                background: bg,
                cursor: showCursorCircle ? "none" : "auto",
                ...filterStyle,
            }}
            onMouseEnter={(e) => {
                if (!saturateOnHover) return
                const node = hostRef.current
                if (node) node.style.filter = "saturate(1)"
            }}
            onMouseLeave={(e) => {
                if (!saturateOnHover) return
                const node = hostRef.current
                if (node) node.style.filter = "saturate(0)"
            }}
        >
            {showCursorCircle && isHovering && !isStatic && (
                <div
                    ref={cursorRef}
                    style={{
                        position: "absolute",
                        left: cursorPosition.x - cursorCircleSize / 2,
                        top: cursorPosition.y - cursorCircleSize / 2,
                        width: cursorCircleSize,
                        height: cursorCircleSize,
                        borderRadius: "50%",
                        backgroundColor: cursorCircleColor,
                        pointerEvents: "none",
                        zIndex: 1000,
                        mixBlendMode: "exclusion",
                        transform: "scale(1)",
                        transition: "transform 0.3s ease-out",
                        animation: "cursorAppear 0.3s ease-out",
                    }}
                />
            )}
            <style>{`
                @keyframes cursorAppear {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(ImageFlexFilter, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageFill: {
        type: ControlType.Enum,
        title: "Image Fill",
        options: ["cover", "contain", "fill", "fit"],
        optionTitles: ["Cover", "Contain", "Fill", "Fit"],
        defaultValue: "cover",
    },
    showCursorCircle: {
        type: ControlType.Boolean,
        title: "Show Cursor Circle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cursorCircleSize: {
        type: ControlType.Number,
        title: "Cursor Circle Size",
        description: "Size of the custom cursor circle in pixels",
        min: 10,
        max: 100,
        step: 1,
        defaultValue: 20,
        unit: "px",
        hidden: ({ showCursorCircle }) => !showCursorCircle,
    },
    cursorCircleColor: {
        type: ControlType.Color,
        title: "Cursor Circle Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showCursorCircle }) => !showCursorCircle,
    },
    grid: {
        type: ControlType.Number,
        title: "Grid",
        description: "Grid resolution for pixelated distortion effect (6-64 cells)",
        min: 6,
        max: 64,
        step: 1,
        defaultValue: 20,
    },
    ease: {
        type: ControlType.Number,
        title: "Ease",
        description: "Mouse follow speed during hover (0.001-0.2, lower = smoother)",
        min: 0.001,
        max: 0.2,
        step: 0.001,
        defaultValue: 0.02,
    },
    leaveEase: {
        type: ControlType.Number,
        title: "Leave Ease",
        description: "Animation speed when mouse leaves (0.001-0.2, higher = faster)",
        min: 0.001,
        max: 0.2,
        step: 0.001,
        defaultValue: 0.05,
    },
    aberration: {
        type: ControlType.Number,
        title: "Aberration",
        description: "Chromatic aberration intensity on mouse move (0-2, higher = more distortion)",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 1.0,
    },
    decay: {
        type: ControlType.Number,
        title: "Decay",
        description: "Aberration fade-out speed (0.001-0.2, higher = faster fade)",
        min: 0.001,
        max: 0.2,
        step: 0.001,
        defaultValue: 0.05,
    },
    perspective: {
        type: ControlType.Number,
        title: "FOV",
        description: "Camera field of view in degrees (10-120, higher = more perspective)",
        min: 10,
        max: 120,
        step: 1,
        defaultValue: 80,
    },
    rounded: {
        type: ControlType.Number,
        title: "Radius",
        description: "Border radius in pixels (recommended: 0-64px for optimal visual balance)",
        step: 1,
        defaultValue: 10,
    },
    bg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111215",
    },
    saturateOnHover: {
        type: ControlType.Boolean,
        title: "Saturate on Hover",
        defaultValue: true,
    },
})