"use client"

import * as React from "react"
import { useEffect, useLayoutEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "https://esm.sh/three@0.160.0?bundle"

// ---------- Types ----------
type NodeItem = {
    mediaType: "image" | "video"
    imageFile?: string
    videoFile?: string
    link?: string
    autoPlay?: boolean
    playOnHover?: boolean
}

type Props = {
    nodes: NodeItem[]
    imageWidth: number
    imageHeight: number
    curveRadius: number
    cornerRadius: number
    bendIntensity: number
    bendDirection: "inward" | "outward"
    brightness: number
    tiltX: number
    tiltZ: number
    camZoom: number
    camY: number
    autoRotate: number
    scrollSpeed: number
    dragDamping: number
    hoverScale: number
}

const PX_TO_WORLD = 1 / 100

// ---------- Shaders ----------
const vshader = /* glsl */ `
  varying vec2 vUv;
  uniform float uBend; 
  uniform float uDir;
  void main(){
    vUv = uv;
    vec3 p = position;
    if (abs(uBend) > 1e-6) {
      float r = 1.0 / uBend;
      float th = p.x * uBend; 
      p.x = sin(th) * r;
      p.z += (r - cos(th) * r) * uDir;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const fshader = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float uRadius;
  uniform vec2 uSize;
  uniform vec4 uUvTransform;
  uniform float uBrightness;

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main(){
    vec2 correctedUv = vUv * uUvTransform.xy + uUvTransform.zw;
    vec2 p = (vUv - 0.5) * uSize;
    float d = roundedBoxSDF(p, uSize * 0.5, uRadius);
    float alpha = 1.0 - smoothstep(0.0, 0.01, d);
    
    vec4 texColor = texture2D(map, correctedUv);
    gl_FragColor = vec4(texColor.rgb * uBrightness, texColor.a * alpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`
/**
 * More components at [marketplace.creativeapes.design](https://marketplace.creativeapes.design).
 */
export default function FinalMediaSpiral(props: Props) {
    const {
        nodes = [],
        imageWidth,
        imageHeight,
        curveRadius,
        cornerRadius,
        bendIntensity,
        bendDirection,
        brightness,
        tiltX,
        tiltZ,
        camZoom,
        camY,
        autoRotate,
        scrollSpeed,
        dragDamping,
        hoverScale,
    } = props

    const mountRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const beltRef = useRef<THREE.Group | null>(null)
    const raycasterRef = useRef(new THREE.Raycaster())
    const mouseRef = useRef(new THREE.Vector2(-10, -10))
    const itemsRef = useRef<
        {
            mesh: THREE.Mesh
            scale: number
            targetScale: number
            url: string
            video: HTMLVideoElement | null
            playOnHover: boolean
        }[]
    >([])

    // Drag and Hover States
    const drag = useRef({
        down: false,
        lastX: 0,
        lastY: 0,
        vel: 0,
        isScrollingPage: false,
        isInitialMove: true,
    })
    const scrollState = useRef({ lastY: 0, delta: 0 })
    const hoverState = useRef({ lastHover: -1 })

    useLayoutEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        rendererRef.current = renderer
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(mount.clientWidth, mount.clientHeight)
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace

        mount.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        sceneRef.current = scene
        const camera = new THREE.PerspectiveCamera(
            30,
            mount.clientWidth / mount.clientHeight,
            0.1,
            1000
        )
        cameraRef.current = camera

        const belt = new THREE.Group()
        beltRef.current = belt
        scene.add(belt)

        // Ensures component stays centered and scaled correctly on layout resize
        const handleResize = () => {
            if (!mountRef.current || !rendererRef.current || !cameraRef.current)
                return
            const width = mountRef.current.clientWidth
            const height = mountRef.current.clientHeight
            rendererRef.current.setSize(width, height)
            cameraRef.current.aspect = width / height
            cameraRef.current.updateProjectionMatrix()
        }
        const resizeObserver = new ResizeObserver(() => handleResize())
        resizeObserver.observe(mount)

        const onScroll = () => {
            const currentY = window.scrollY
            scrollState.current.delta = currentY - scrollState.current.lastY
            scrollState.current.lastY = currentY
        }

        const onPointerDown = (e: PointerEvent) => {
            drag.current.down = true
            drag.current.isInitialMove = true
            drag.current.isScrollingPage = false
            drag.current.lastX = e.clientX
            drag.current.lastY = e.clientY
            drag.current.vel = 0
        }

        const onPointerMove = (e: PointerEvent) => {
            // Update mouse coordinates for hover raycasting independent of drag state
            const rect = mount.getBoundingClientRect()
            mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

            if (!drag.current.down || drag.current.isScrollingPage) return

            const dx = e.clientX - drag.current.lastX
            const dy = e.clientY - drag.current.lastY

            // Mobile logic: tiny threshold ensures smooth scrolling without blocking drags
            if (drag.current.isInitialMove) {
                if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return

                if (Math.abs(dy) > Math.abs(dx)) {
                    drag.current.isScrollingPage = true
                    drag.current.down = false
                    return
                }
                drag.current.isInitialMove = false
                mount.setPointerCapture(e.pointerId)
            }

            const d = (dx / window.innerWidth) * Math.PI * 2
            belt.rotation.y += d
            drag.current.vel = d * 60
            drag.current.lastX = e.clientX
            drag.current.lastY = e.clientY
        }

        const onPointerUp = (e: PointerEvent) => {
            drag.current.down = false
            if (mount.hasPointerCapture(e.pointerId)) {
                mount.releasePointerCapture(e.pointerId)
            }
        }

        const onPointerLeave = () => {
            drag.current.down = false
            mouseRef.current.set(-10, -10)
        }

        mount.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        mount.addEventListener("pointerleave", onPointerLeave)
        window.addEventListener("scroll", onScroll, { passive: true })

        const tick = () => {
            if (belt && camera && renderer) {
                const isCanvas = RenderTarget.current() === RenderTarget.canvas

                // Hardcoded static editor bypass
                if (!drag.current.down && !isCanvas) {
                    belt.rotation.y +=
                        THREE.MathUtils.degToRad(autoRotate) * 0.016
                    belt.rotation.y +=
                        scrollState.current.delta * (scrollSpeed * 0.0001)
                    scrollState.current.delta *= 0.9
                    belt.rotation.y += drag.current.vel * 0.016
                    drag.current.vel *= 1 - dragDamping
                }

                raycasterRef.current.setFromCamera(mouseRef.current, camera)
                const intersects = raycasterRef.current.intersectObjects(
                    belt.children
                )
                const currentHover =
                    intersects.length > 0
                        ? (intersects[0].object as any).userData.index
                        : -1

                // Highly optimized DOM transition check: only fire when hover target changes
                if (hoverState.current.lastHover !== currentHover) {
                    itemsRef.current.forEach((item, i) => {
                        if (item.video && item.playOnHover && !isCanvas) {
                            if (i === currentHover) {
                                item.video.play().catch(() => {})
                            } else {
                                item.video.pause()
                            }
                        }
                    })
                    hoverState.current.lastHover = currentHover
                }

                // Smooth scaling physics
                itemsRef.current.forEach((item, i) => {
                    item.targetScale = currentHover === i ? hoverScale : 1.0
                    item.scale += (item.targetScale - item.scale) * 0.1
                    item.mesh.scale.set(item.scale, item.scale, 1)
                })

                renderer.render(scene, camera)
            }
            requestAnimationFrame(tick)
        }
        const raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            renderer.dispose()
            mount.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            mount.removeEventListener("pointerleave", onPointerLeave)
            window.removeEventListener("scroll", onScroll)
        }
    }, [scrollSpeed, hoverScale, autoRotate, dragDamping])

    // Update textures and meshes
    useEffect(() => {
        if (!beltRef.current || !nodes.length) return
        const belt = beltRef.current
        while (belt.children.length > 0) {
            const obj = belt.children[0] as THREE.Mesh
            obj.geometry.dispose()
            if (Array.isArray(obj.material))
                obj.material.forEach((m) => m.dispose())
            else obj.material.dispose()
            belt.remove(obj)
        }
        itemsRef.current = []

        const loader = new THREE.TextureLoader()
        const wWorld = imageWidth * PX_TO_WORLD
        const hWorld = imageHeight * PX_TO_WORLD
        const bendVal = bendIntensity * 0.1

        nodes.forEach((node, i) => {
            const isVideoNode = node.mediaType === "video"
            const fileUrl = isVideoNode ? node.videoFile : node.imageFile
            if (!fileUrl) return

            const angle = (i / nodes.length) * Math.PI * 2
            const geo = new THREE.PlaneGeometry(wWorld, hWorld, 32, 1)
            const mat = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: new THREE.Texture() },
                    uBend: { value: bendVal },
                    uDir: { value: bendDirection === "inward" ? 1.0 : -1.0 },
                    uRadius: { value: cornerRadius * PX_TO_WORLD },
                    uSize: { value: new THREE.Vector2(wWorld, hWorld) },
                    uUvTransform: { value: new THREE.Vector4(1, 1, 0, 0) },
                    uBrightness: { value: brightness },
                },
                vertexShader: vshader,
                fragmentShader: fshader,
                transparent: true,
                side: THREE.DoubleSide,
            })

            const mesh = new THREE.Mesh(geo, mat)

            const applyFill = (tex: THREE.Texture, w: number, h: number) => {
                const aspect = w / h
                const targetAspect = imageWidth / imageHeight
                if (aspect > targetAspect) {
                    mat.uniforms.uUvTransform.value.set(
                        targetAspect / aspect,
                        1,
                        (1 - targetAspect / aspect) / 2,
                        0
                    )
                } else {
                    mat.uniforms.uUvTransform.value.set(
                        1,
                        aspect / targetAspect,
                        0,
                        (1 - aspect / targetAspect) / 2
                    )
                }
                mat.uniforms.map.value = tex
            }

            let videoElement: HTMLVideoElement | null = null

            if (isVideoNode) {
                const video = document.createElement("video")
                video.src = fileUrl
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.crossOrigin = "anonymous"

                if (node.imageFile) {
                    video.poster = node.imageFile // Uses the combined field for the poster
                }

                if (node.autoPlay) {
                    video.autoplay = true
                    video.play().catch(() => {})
                } else {
                    video.autoplay = false
                    video.currentTime = 0.001
                }

                video.onloadedmetadata = () => {
                    const tex = new THREE.VideoTexture(video)
                    applyFill(tex, video.videoWidth, video.videoHeight)
                }
                videoElement = video
            } else {
                loader.load(fileUrl, (t) =>
                    applyFill(t, t.image.width, t.image.height)
                )
            }

            mesh.position.set(
                Math.cos(angle) * curveRadius,
                0,
                Math.sin(angle) * curveRadius
            )
            mesh.lookAt(0, 0, 0)
            if (bendDirection === "inward") mesh.rotation.y += Math.PI

            mesh.userData = { index: i }
            belt.add(mesh)

            itemsRef.current.push({
                mesh,
                scale: 1,
                targetScale: 1,
                url: node.link || "",
                video: videoElement,
                playOnHover: node.playOnHover && !node.autoPlay ? true : false,
            })
        })
    }, [
        nodes,
        imageWidth,
        imageHeight,
        curveRadius,
        cornerRadius,
        bendIntensity,
        bendDirection,
        brightness,
    ])

    useEffect(() => {
        if (!cameraRef.current || !sceneRef.current || !beltRef.current) return
        cameraRef.current.position.set(0, camY, 40 / Math.max(0.1, camZoom))
        cameraRef.current.lookAt(0, 0, 0)
        beltRef.current.rotation.x = THREE.MathUtils.degToRad(tiltX)
        beltRef.current.rotation.z = THREE.MathUtils.degToRad(tiltZ)
    }, [camZoom, camY, tiltX, tiltZ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "pan-y", // Permits native vertical scrolling on mobile
            }}
        />
    )
}

addPropertyControls(FinalMediaSpiral, {
    nodes: {
        type: ControlType.Array,
        title: "Content",
        description: "Add image or video items to your spiral gallery.",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    defaultValue: "image",
                },
                imageFile: {
                    type: ControlType.Image,
                    title: "Image / Thumbnail",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "mov", "webm"],
                    hidden(props) {
                        return props.mediaType !== "video"
                    },
                },
                autoPlay: {
                    type: ControlType.Boolean,
                    title: "Autoplay",
                    defaultValue: true,
                    hidden(props) {
                        return props.mediaType !== "video"
                    },
                },
                playOnHover: {
                    type: ControlType.Boolean,
                    title: "Play on Hover",
                    defaultValue: false,
                    hidden(props) {
                        return (
                            props.mediaType !== "video" ||
                            props.autoPlay === true
                        )
                    },
                },
            },
        },
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        description: "Adjust the global exposure of the media items.",
        defaultValue: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description:
            "Smooth out the corners of your planes using the SDF shader.",
        defaultValue: 20,
    },
    bendIntensity: {
        type: ControlType.Number,
        title: "Bend Intensity",
        description:
            "How sharply the images warp to match the cylindrical curve.",
        defaultValue: 2,
        min: -10,
        max: 10,
        step: 0.1,
    },
    bendDirection: {
        type: ControlType.Enum,
        title: "Direction",
        description: "Face the items inward or outward from the center point.",
        options: ["inward", "outward"],
        defaultValue: "inward",
    },
    curveRadius: {
        type: ControlType.Number,
        title: "Curve Radius",
        description: "The width of the overall circle spacing the items.",
        defaultValue: 12,
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Base Width",
        description: "The physical width of the generated planes in 3D space.",
        defaultValue: 250,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Base Height",
        description: "The physical height of the generated planes in 3D space.",
        defaultValue: 350,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        description:
            "How much the item grows when your mouse interacts with it.",
        defaultValue: 1.1,
        min: 0.5,
        max: 1.5,
        step: 0.05,
    },
    tiltX: {
        type: ControlType.Number,
        title: "Tilt X",
        description: "Rotate the entire component globally on the X-axis.",
        defaultValue: -15,
    },
    tiltZ: {
        type: ControlType.Number,
        title: "Tilt Z",
        description: "Rotate the entire component globally on the Z-axis.",
        defaultValue: 5,
    },
    camZoom: {
        type: ControlType.Number,
        title: "Zoom",
        description: "Camera distance from the object.",
        defaultValue: 0.8,
    },
    camY: {
        type: ControlType.Number,
        title: "Cam Y",
        description: "Camera elevation.",
        defaultValue: 0,
    },
    autoRotate: {
        type: ControlType.Number,
        title: "Idle Speed",
        description: "How fast the component spins when untouched.",
        defaultValue: 10,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Power",
        description: "How much native page scrolling rotates the component.",
        defaultValue: 10,
        min: 0,
        max: 100,
    },
    dragDamping: {
        type: ControlType.Number,
        title: "Friction",
        description: "How quickly the component comes to rest after dragging.",
        defaultValue: 0.05,
        min: 0,
        max: 0.2,
    },
})
