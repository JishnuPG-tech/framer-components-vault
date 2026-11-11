// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"

/**
 * SPATIAL WAVE
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
export default function SpatialWave(props) {
    const {
        slides = [],
        scrollSpeed = 1.8,
        gap = 4.8,
        cardWidth = 3.8,
        cardHeight = 2.2,
        waveIntensity = 0.45,
        waveFrequency = 0.8,
        rotation = 0.08,
        depthCurve = 0.35,
        colorMode = "color",
        duotoneShadow = "#1a1a2e",
        duotoneHighlight = "#f5f4ef",
        brightness = 1,
        contrast = 1,
        grain = 0.12,
        scanlines = 0.4,
        chromaticAberration = 0,
        pixelation = 0,
        vignette = 1,
        rippleOnHover = 1,
        backgroundType = "none",
        backgroundColor = "#050505",
        backgroundImage = "",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const glRef = useRef<HTMLDivElement>(null)

    // Stable signature of slides so the effect doesn't tear down on every parent re-render.
    // Only the resolved image URLs matter for scene construction.
    const resolveImageUrl = (img) => {
        if (!img) return ""
        if (typeof img === "string") return img
        if (typeof img === "object" && img.src) return img.src
        return ""
    }
    const slidesSignature = useMemo(
        () => (slides || []).map(resolveImageUrl).join("|"),
        [slides]
    )

    // Framer render contexts:
    //   canvas    — editing in Framer (we want live WebGL so property controls are visible)
    //   thumbnail — marketplace previews, layer thumbnails (cheap static fallback)
    //   preview   — Framer's preview window (full live)
    //   export    — static SSR snapshot (cheap static fallback)
    const renderTarget =
        typeof RenderTarget !== "undefined" && RenderTarget.current
            ? RenderTarget.current()
            : null
    // True only for contexts where we want the lightweight <img> fallback.
    const isStatic =
        renderTarget === RenderTarget.thumbnail ||
        // @ts-ignore — RenderTarget.export exists at runtime but isn't always in the typings
        renderTarget === (RenderTarget as any).export
    // On the editing canvas we run WebGL but disable interaction + viewport gating,
    // since the canvas viewport doesn't map cleanly to user scroll.
    const isCanvas = renderTarget === RenderTarget.canvas

    // Track viewport visibility so we can pause the RAF loop when offscreen.
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        if (isStatic) return
        // On canvas, always-on — the editor's scroll/zoom isn't a real viewport.
        if (isCanvas) {
            setIsVisible(true)
            return
        }
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    setIsVisible(entry.isIntersecting)
                }
            },
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, isCanvas])

    useEffect(() => {
        if (isStatic) return
        if (!glRef.current) return

        const container = glRef.current
        const items = slides && slides.length > 0 ? slides : [{ image: "" }]

        let width = container.clientWidth || 800
        let height = container.clientHeight || 500

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.z = 6

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        })
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        const hexToVec3 = (hex) => {
            const c = new THREE.Color(hex)
            return new THREE.Vector3(c.r, c.g, c.b)
        }

        const colorModeIndex =
            colorMode === "grayscale" ? 1 : colorMode === "duotone" ? 2 : 0

        const vertexShader = [
            "varying vec2 vUv;",
            "uniform float uTime;",
            "uniform float uSpeed;",
            "uniform float uOffset;",
            "void main() {",
            "  vUv = uv;",
            "  vec3 pos = position;",
            "  float wave = sin(pos.x * 1.5 + uTime * 2.0 + uOffset * 2.0) * cos(pos.y * 1.5 + uTime * 1.5);",
            "  pos.z += wave * 0.25;",
            "  pos.z += sin(pos.x * 2.0) * uSpeed * 0.3;",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);",
            "}",
        ].join("\n")

        const fragmentShader = [
            "uniform sampler2D uTexture;",
            "uniform float uTime;",
            "uniform float uHover;",
            "uniform int uColorMode;",
            "uniform vec3 uDuoShadow;",
            "uniform vec3 uDuoHighlight;",
            "uniform float uBrightness;",
            "uniform float uContrast;",
            "uniform float uGrain;",
            "uniform float uScanlines;",
            "uniform float uChromatic;",
            "uniform float uPixelation;",
            "uniform float uVignette;",
            "uniform float uRipple;",
            "varying vec2 vUv;",
            "float random(vec2 st) {",
            "  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);",
            "}",
            "void main() {",
            "  vec2 uv = vUv;",
            "  if (uPixelation > 0.001) {",
            "    float px = mix(800.0, 30.0, uPixelation);",
            "    uv = floor(uv * px) / px;",
            "  }",
            "  float ripple = sin(uv.x * 10.0 + uTime * 2.0) * 0.005 * uHover * uRipple;",
            "  uv += ripple;",
            "  vec4 tex;",
            "  if (uChromatic > 0.001) {",
            "    vec2 dir = uv - vec2(0.5);",
            "    float r = texture2D(uTexture, uv - dir * uChromatic * 0.02).r;",
            "    float g = texture2D(uTexture, uv).g;",
            "    float b = texture2D(uTexture, uv + dir * uChromatic * 0.02).b;",
            "    tex = vec4(r, g, b, 1.0);",
            "  } else {",
            "    tex = texture2D(uTexture, uv);",
            "  }",
            "  vec3 col = tex.rgb;",
            "  if (uColorMode == 1) {",
            "    float gray = dot(col, vec3(0.299, 0.587, 0.114));",
            "    col = vec3(gray);",
            "    col = mix(col, tex.rgb, uHover * 0.7);",
            "  } else if (uColorMode == 2) {",
            "    float gray = dot(col, vec3(0.299, 0.587, 0.114));",
            "    col = mix(uDuoShadow, uDuoHighlight, gray);",
            "  }",
            "  col = (col - 0.5) * uContrast + 0.5 + (uBrightness - 1.0);",
            "  if (uGrain > 0.001) {",
            "    col += random(vUv * uTime) * uGrain;",
            "  }",
            "  if (uScanlines > 0.001) {",
            "    col -= sin(vUv.y * 600.0 + uTime * 10.0) * uScanlines * 0.05;",
            "  }",
            "  float dist = distance(vUv, vec2(0.5));",
            "  float vigDarken = mix(1.0, smoothstep(0.9, 0.2, dist), uVignette);",
            "  col *= vigDarken;",
            "  gl_FragColor = vec4(col, 1.0);",
            "}",
        ].join("\n")

        const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight, 64, 64)
        const meshes = []
        const group = new THREE.Group()
        scene.add(group)

        items.forEach((item, i) => {
            const url = resolveImageUrl(item.image)
            const texture = new THREE.Texture()
            if (url) {
                const imgEl = new Image()
                imgEl.crossOrigin = "anonymous"
                imgEl.onload = () => {
                    texture.image = imgEl
                    texture.needsUpdate = true
                }
                imgEl.src = url
            }
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { value: texture },
                    uTime: { value: 0 },
                    uSpeed: { value: 0 },
                    uOffset: { value: i * gap },
                    uHover: { value: 0 },
                    uColorMode: { value: colorModeIndex },
                    uDuoShadow: { value: hexToVec3(duotoneShadow) },
                    uDuoHighlight: { value: hexToVec3(duotoneHighlight) },
                    uBrightness: { value: brightness },
                    uContrast: { value: contrast },
                    uGrain: { value: grain },
                    uScanlines: { value: scanlines },
                    uChromatic: { value: chromaticAberration },
                    uPixelation: { value: pixelation },
                    uVignette: { value: vignette },
                    uRipple: { value: rippleOnHover },
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                side: THREE.DoubleSide,
            })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.x = i * gap
            mesh.userData = { index: i, originalX: i * gap }
            group.add(mesh)
            meshes.push(mesh)
        })

        let scroll = 0
        let scrollTarget = 0
        let currentSpeed = 0
        const mouse = new THREE.Vector2(-10, -10)
        const raycaster = new THREE.Raycaster()
        const hoverTargets = meshes.map(() => 0)

        const onWheel = (e) => {
            e.preventDefault()
            scrollTarget += e.deltaY * 0.002 * scrollSpeed
        }
        const onMove = (e) => {
            const rect = container.getBoundingClientRect()
            const localX = e.clientX - rect.left
            const localY = e.clientY - rect.top
            mouse.x = (localX / rect.width) * 2 - 1
            mouse.y = -(localY / rect.height) * 2 + 1
        }
        const onLeave = () => {
            mouse.x = -10
            mouse.y = -10
        }

        let isDragging = false
        let dragStartX = 0
        let scrollAtDragStart = 0
        const onPointerDown = (e) => {
            isDragging = true
            dragStartX = e.clientX
            scrollAtDragStart = scrollTarget
            try {
                container.setPointerCapture(e.pointerId)
            } catch (_) {}
        }
        const onPointerMove = (e) => {
            if (!isDragging) return
            const dx = e.clientX - dragStartX
            scrollTarget = scrollAtDragStart - dx * 0.012 * scrollSpeed
        }
        const onPointerUp = (e) => {
            isDragging = false
            try {
                container.releasePointerCapture(e.pointerId)
            } catch (_) {}
        }

        if (!isCanvas) {
            container.addEventListener("wheel", onWheel, { passive: false })
            container.addEventListener("mousemove", onMove)
            container.addEventListener("mouseleave", onLeave)
            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointermove", onPointerMove)
            container.addEventListener("pointerup", onPointerUp)
            container.addEventListener("pointercancel", onPointerUp)
        }

        const clock = new THREE.Clock()
        let frameId = 0
        let running = false
        const totalWidth = items.length * gap

        const animate = () => {
            const time = clock.getElapsedTime()
            scroll += (scrollTarget - scroll) * 0.08
            currentSpeed = scrollTarget - scroll

            meshes.forEach((mesh) => {
                let x = mesh.userData.originalX - scroll
                while (x < -totalWidth / 2) x += totalWidth
                while (x > totalWidth / 2) x -= totalWidth
                mesh.position.x = x

                const distFromCenter = Math.abs(x)
                const waveY = Math.sin(x * waveFrequency + time) * waveIntensity
                const waveZ = Math.cos(x * waveFrequency + time) * waveIntensity
                mesh.position.y = waveY
                mesh.position.z =
                    waveZ - Math.pow(distFromCenter * depthCurve, 2)
                mesh.rotation.y = -x * rotation
                mesh.rotation.z = waveY * 0.1

                mesh.material.uniforms.uTime.value = time
                mesh.material.uniforms.uSpeed.value = currentSpeed
                mesh.material.uniforms.uOffset.value = x
            })

            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(meshes)
            const hoveredId =
                intersects.length > 0 ? intersects[0].object.id : -1

            meshes.forEach((m, i) => {
                const target = m.id === hoveredId ? 1 : 0
                hoverTargets[i] += (target - hoverTargets[i]) * 0.1
                m.material.uniforms.uHover.value = hoverTargets[i]
            })

            renderer.render(scene, camera)
            frameId = requestAnimationFrame(animate)
        }

        const start = () => {
            if (running) return
            running = true
            frameId = requestAnimationFrame(animate)
        }
        const stop = () => {
            if (!running) return
            running = false
            cancelAnimationFrame(frameId)
        }

        // Expose start/stop to the outer visibility effect via container dataset hooks.
        // We use a ref-like pattern by storing handlers on the container element.
        ;(container as any).__spatialWaveStart = start
        ;(container as any).__spatialWaveStop = stop

        start()

        const onResize = () => {
            if (!container) return
            const w = container.clientWidth || 800
            const h = container.clientHeight || 500
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        const ro = new ResizeObserver(onResize)
        ro.observe(container)

        return () => {
            stop()
            if (!isCanvas) {
                container.removeEventListener("wheel", onWheel)
                container.removeEventListener("mousemove", onMove)
                container.removeEventListener("mouseleave", onLeave)
                container.removeEventListener("pointerdown", onPointerDown)
                container.removeEventListener("pointermove", onPointerMove)
                container.removeEventListener("pointerup", onPointerUp)
                container.removeEventListener("pointercancel", onPointerUp)
            }
            ro.disconnect()
            delete (container as any).__spatialWaveStart
            delete (container as any).__spatialWaveStop
            meshes.forEach((m) => {
                if (
                    m.material.uniforms.uTexture.value &&
                    m.material.uniforms.uTexture.value.dispose
                ) {
                    m.material.uniforms.uTexture.value.dispose()
                }
                m.material.dispose()
            })
            geometry.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        isStatic,
        isCanvas,
        slidesSignature,
        scrollSpeed,
        gap,
        cardWidth,
        cardHeight,
        waveIntensity,
        waveFrequency,
        rotation,
        depthCurve,
        colorMode,
        duotoneShadow,
        duotoneHighlight,
        brightness,
        contrast,
        grain,
        scanlines,
        chromaticAberration,
        pixelation,
        vignette,
        rippleOnHover,
    ])

    // Drive start/stop from visibility state without tearing down the scene.
    useEffect(() => {
        if (isStatic) return
        const container = glRef.current as any
        if (!container) return
        if (isVisible) {
            container.__spatialWaveStart && container.__spatialWaveStart()
        } else {
            container.__spatialWaveStop && container.__spatialWaveStop()
        }
    }, [isVisible, isStatic, slidesSignature])

    const bgImageUrl =
        backgroundImage && typeof backgroundImage === "object"
            ? backgroundImage.src
            : backgroundImage
    const computedBackground =
        backgroundType === "none"
            ? "transparent"
            : backgroundType === "image" && bgImageUrl
              ? "url(" + bgImageUrl + ") center / cover no-repeat"
              : backgroundColor

    // Static fallback: render the first slide image as a plain <img> covering the frame.
    // Used in canvas/thumbnail/export contexts so the editor stays responsive and
    // exports get a meaningful poster instead of a blank WebGL canvas.
    if (isStatic) {
        const firstUrl =
            slides && slides.length > 0 ? resolveImageUrl(slides[0].image) : ""
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 400,
                    background: computedBackground,
                    overflow: "hidden",
                }}
            >
                {firstUrl ? (
                    <img
                        src={firstUrl}
                        alt=""
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                        }}
                    />
                ) : null}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 400,
                background: computedBackground,
                overflow: "hidden",
                touchAction: "none",
            }}
        >
            <div
                ref={glRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                }}
            />
        </div>
    )
}

SpatialWave.defaultProps = {
    slides: [
        {
            image: "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=2576&auto=format&fit=crop",
        },
        {
            image: "https://images.unsplash.com/photo-1481026469463-66327c86e544?q=80&w=2608&auto=format&fit=crop",
        },
        {
            image: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2574&auto=format&fit=crop",
        },
        {
            image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2668&auto=format&fit=crop",
        },
        {
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2670&auto=format&fit=crop",
        },
    ],
    scrollSpeed: 1.8,
    gap: 4.8,
    cardWidth: 3.8,
    cardHeight: 2.2,
    waveIntensity: 0.45,
    waveFrequency: 0.8,
    rotation: 0.08,
    depthCurve: 0.35,
    colorMode: "color",
    duotoneShadow: "#1a1a2e",
    duotoneHighlight: "#f5f4ef",
    brightness: 1,
    contrast: 1,
    grain: 0.12,
    scanlines: 0.4,
    chromaticAberration: 0,
    pixelation: 0,
    vignette: 1,
    rippleOnHover: 1,
    backgroundType: "none",
    backgroundColor: "#050505",
    backgroundImage: "",
}

addPropertyControls(SpatialWave, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 3.8,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 2.2,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 4.8,
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.8,
    },
    waveIntensity: {
        type: ControlType.Number,
        title: "Wave Y/Z",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.45,
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Freq",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
    },
    rotation: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.08,
    },
    depthCurve: {
        type: ControlType.Number,
        title: "Depth Curve",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["color", "grayscale", "duotone"],
        optionTitles: ["Color", "Grayscale", "Duotone"],
        defaultValue: "color",
        displaySegmentedControl: true,
    },
    duotoneShadow: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "#1a1a2e",
        hidden: (props) => props.colorMode !== "duotone",
    },
    duotoneHighlight: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "#f5f4ef",
        hidden: (props) => props.colorMode !== "duotone",
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    grain: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.12,
    },
    scanlines: {
        type: ControlType.Number,
        title: "Scanlines",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
    },
    chromaticAberration: {
        type: ControlType.Number,
        title: "Chromatic",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0,
    },
    pixelation: {
        type: ControlType.Number,
        title: "Pixelate",
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: 0,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    rippleOnHover: {
        type: ControlType.Number,
        title: "Hover Ripple",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    backgroundType: {
        type: ControlType.Enum,
        title: "Background",
        options: ["none", "color", "image"],
        optionTitles: ["None", "Color", "Image"],
        defaultValue: "none",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#050505",
        hidden: (props) => props.backgroundType !== "color",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "BG Image",
        hidden: (props) => props.backgroundType !== "image",
    },
})
