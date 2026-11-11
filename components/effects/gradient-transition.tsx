import * as React from "react"
import { useEffect, useRef } from "react"
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


type ImageValue = string | { src?: string; alt?: string }
type Props = Record<string, any>
const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))
const imageURL = (value?: ImageValue) =>
    typeof value === "string" ? value : value?.src || ""
const DEFAULTS = {
    livePreview: true,
    image: undefined,
    images: {
        fromImage: undefined,
        mapImage: undefined,
        fit: "Cover",
        positionX: 50,
        positionY: 50,
    },
    appearance: {
        tint: "#DE8FAA",
        highlight: "#E9FFFF",
        softness: 16,
        glow: 45,
        glowWidth: 12,
    },
    wipe: { map: "Image", invert: false, direction: 0, contrast: 100 },
    animation: {
        trigger: "On View",
        duration: 3,
        delay: 0.15,
        hold: 1.2,
        easing: "Smooth",
        reverse: false,
        progress: 42,
    },
    rendering: { pixelRatio: 2, reducedMotion: true },
}

const VERTEX = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`
const FRAGMENT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uFrom;
uniform sampler2D uMap;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform vec2 uFromSize;
uniform vec2 uMapSize;
uniform vec2 uPosition;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uProgress;
uniform float uSoftness;
uniform float uGlow;
uniform float uGlowWidth;
uniform float uContrast;
uniform float uDirection;
uniform float uInvert;
uniform float uHasFrom;
uniform float uMapType;
uniform float uFit;

vec2 fittedUV(vec2 sourceSize) {
    float viewport = uResolution.x / max(1.0, uResolution.y);
    float aspect = sourceSize.x / max(1.0, sourceSize.y);
    vec2 scale = vec2(1.0);
    if (uFit < 0.5) {
        if (viewport > aspect) scale.y = aspect / viewport;
        else scale.x = viewport / aspect;
    } else if (uFit < 1.5) {
        if (viewport > aspect) scale.x = viewport / aspect;
        else scale.y = aspect / viewport;
    }
    return vUv * scale + (1.0 - scale) * uPosition;
}
vec4 sampleImage(sampler2D tex, vec2 size) {
    vec2 uv = fittedUV(size);
    vec4 color = texture2D(tex, uv);
    if (uFit > 0.5 && uFit < 1.5) {
        color.a *= step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    }
    return color;
}
float wipeLuma(vec3 color) { return dot(color, vec3(0.299, 0.587, 0.114)); }
void main() {
    vec4 image = sampleImage(uImage, uImageSize);
    float light = wipeLuma(image.rgb);
    float map = light;
    if (uMapType > 0.5 && uMapType < 1.5) {
        vec2 axis = vec2(cos(uDirection), sin(uDirection));
        map = 0.5 + dot(vUv - 0.5, axis) / max(0.001, abs(axis.x) + abs(axis.y));
    } else if (uMapType > 1.5 && uMapType < 2.5) {
        map = clamp(length((vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0)) / 0.707, 0.0, 1.0);
    } else if (uMapType > 2.5) {
        map = wipeLuma(sampleImage(uMap, uMapSize).rgb);
    }
    map = clamp((map - 0.5) * uContrast + 0.5, 0.0, 1.0);
    if (uInvert > 0.5) map = 1.0 - map;
    float softness = max(0.001, uSoftness);
    float threshold = mix(-softness - uGlowWidth, 1.0 + softness + uGlowWidth, uProgress);
    float reveal = 1.0 - smoothstep(threshold - softness, threshold + softness, map);
    // Pink shadows and pale highlights reconstruct the reference's pre-image treatment.
    float pale = smoothstep(0.52, 0.94, light);
    vec4 start = vec4(mix(uTint, uHighlight, pale), image.a);
    if (uHasFrom > 0.5) start = sampleImage(uFrom, uFromSize);
    vec4 result = mix(start, image, reveal);
    float band = 1.0 - smoothstep(0.0, max(0.001, uGlowWidth), abs(map - threshold));
    // Fade bloom at both endpoints for a completely clean final image.
    float envelope = smoothstep(0.0, 0.12, uProgress) * (1.0 - smoothstep(0.88, 1.0, uProgress));
    result.rgb = mix(result.rgb, uHighlight, clamp(band * uGlow * envelope, 0.0, 1.0));
    gl_FragColor = result;
}`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 * @framerDisableUnlink
 */
export default function ImageGradientWipe(incomingProps: Props) {
    const props = {
        ...DEFAULTS.images,
        ...DEFAULTS.appearance,
        ...DEFAULTS.wipe,
        ...DEFAULTS.animation,
        ...DEFAULTS.rendering,
        ...(incomingProps.images || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.wipe || {}),
        ...(incomingProps.animation || {}),
        ...(incomingProps.rendering || {}),
        ...incomingProps,
    }
    const mountRef = useRef<HTMLDivElement>(null)
    const statusRef = useRef<HTMLDivElement>(null)
    const isIntersecting = useRef(true)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.livePreview ?? true)
    const latest = useRef({ props, shouldAnimate })
    latest.current = { props, shouldAnimate }
    const controller = useRef<{ update: () => void } | null>(null)

    useEffect(() => {
        const container = mountRef.current
        if (!container || typeof window === "undefined") return
        let renderer: THREE.WebGLRenderer | undefined
        let scene: THREE.Scene | undefined
        let camera: THREE.PerspectiveCamera | undefined
        let geometry: THREE.PlaneGeometry | undefined
        let material: THREE.ShaderMaterial | undefined
        let mesh: THREE.Mesh | undefined
        let resizeObserver: ResizeObserver | undefined
        let intersectionObserver: IntersectionObserver | undefined
        let frameId = 0,
            disposed = false,
            lost = false,
            width = 1,
            height = 1
        let elapsed = 0,
            lastTime = 0,
            hasStarted = false,
            hovered = false,
            scrollProgress = 0
        let animationKey = ""
        const listeners: (() => void)[] = []
        const textures = new Set<THREE.Texture>()
        const slots: Record<
            string,
            {
                source: string
                texture?: THREE.Texture
                image?: HTMLImageElement
                cancel?: () => void
            }
        > = {
            image: { source: "" },
            from: { source: "" },
            map: { source: "" },
        }
        const reducedQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const listen = (
            target: EventTarget,
            name: string,
            listener: EventListener,
            options?: AddEventListenerOptions | boolean
        ) => {
            target.addEventListener(name, listener, options)
            listeners.push(() =>
                target.removeEventListener(name, listener, options)
            )
        }
        const report = (message: string) => {
            if (!statusRef.current) return
            statusRef.current.textContent = message
            statusRef.current.style.display = message ? "grid" : "none"
        }
        const live = () =>
            latest.current.shouldAnimate &&
            !(latest.current.props.reducedMotion && reducedQuery.matches)
        const stop = () => {
            cancelAnimationFrame(frameId)
            frameId = 0
            lastTime = 0
        }
        const ease = (value: number) =>
            latest.current.props.easing === "Linear"
                ? value
                : value * value * (3 - 2 * value)
        function progress() {
            const p = latest.current.props
            let value = clamp(Number(p.progress) / 100, 0, 1)
            const mode = String(p.trigger)
            const duration = Math.max(0.1, Number(p.duration))
            if (!live()) {
                if (!latest.current.shouldAnimate) return value
                value = 1 // Reduced motion displays the completed image.
            } else if (mode === "Scroll") value = ease(scrollProgress)
            else if (mode === "Hover")
                value = ease(clamp(elapsed / duration, 0, 1))
            else if (mode !== "Manual") {
                const active = Math.max(0, elapsed - Number(p.delay))
                const hold = Math.max(0, Number(p.hold))
                if (mode === "Loop") {
                    const cycle = duration + hold
                    value = ease(clamp((active % cycle) / duration, 0, 1))
                } else if (mode === "Ping Pong") {
                    const phase = active % (2 * (duration + hold))
                    value =
                        phase < duration + hold
                            ? ease(clamp(phase / duration, 0, 1))
                            : 1 -
                              ease(
                                  clamp(
                                      (phase - duration - hold) / duration,
                                      0,
                                      1
                                  )
                              )
                } else value = ease(clamp(active / duration, 0, 1))
            }
            return p.reverse ? 1 - value : value
        }
        function frame(now = performance.now()) {
            frameId = 0
            if (
                disposed ||
                lost ||
                !renderer ||
                !scene ||
                !camera ||
                !material ||
                !isIntersecting.current ||
                document.hidden
            )
                return
            const p = latest.current.props
            const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0
            lastTime = now
            if (live() && slots.image.texture) {
                if (p.trigger === "Hover")
                    elapsed = clamp(
                        elapsed + (hovered ? dt : -dt),
                        0,
                        Math.max(0.1, Number(p.duration))
                    )
                else if (p.trigger !== "Manual" && p.trigger !== "Scroll") {
                    elapsed += dt
                    hasStarted = true
                }
            }
            material.uniforms.uProgress.value = progress()
            renderer.render(scene, camera)
            const onceDone =
                hasStarted &&
                elapsed >=
                    Math.max(0, Number(p.delay)) +
                        Math.max(0.1, Number(p.duration))
            const hoverDone = hovered
                ? elapsed >= Math.max(0.1, Number(p.duration))
                : elapsed <= 0
            const needsFrame =
                p.trigger === "Loop" ||
                p.trigger === "Ping Pong" ||
                (p.trigger === "On View" && !onceDone) ||
                (p.trigger === "Hover" && !hoverDone)
            if (live() && slots.image.texture && needsFrame)
                frameId = requestAnimationFrame(frame)
        }
        function push() {
            if (!frameId && !disposed && !lost) frame()
        }
        function releaseSlot(name: string) {
            const slot = slots[name]
            slot.cancel?.()
            if (slot.texture) {
                slot.texture.dispose()
                textures.delete(slot.texture)
            }
            slot.texture = undefined
            slot.cancel = undefined
            slot.image = undefined
        }
        function loadSlot(name: string, source: string) {
            const slot = slots[name]
            if (slot.source === source) return
            releaseSlot(name)
            slot.source = source
            if (material) {
                material.uniforms[
                    name === "image"
                        ? "uImage"
                        : name === "from"
                          ? "uFrom"
                          : "uMap"
                ].value = fallback
                if (name === "from") material.uniforms.uHasFrom.value = 0
                if (name === "image") {
                    mesh!.visible = false
                    report(
                        source
                            ? "Loading image…"
                            : "Upload an image in the Image control."
                    )
                }
            }
            if (!source) return
            const image = new Image()
            slot.image = image
            image.crossOrigin = "anonymous"
            const cancel = () => {
                image.onload = null
                image.onerror = null
                image.src = ""
            }
            slot.cancel = cancel
            image.onload = () => {
                if (
                    disposed ||
                    slot.source !== source ||
                    !material ||
                    !renderer
                )
                    return
                const maxSize = renderer.capabilities.maxTextureSize
                if (
                    image.naturalWidth > maxSize ||
                    image.naturalHeight > maxSize
                ) {
                    report(
                        `Image exceeds this device's ${maxSize}px texture limit.`
                    )
                    return
                }
                const texture = new THREE.Texture(image)
                texture.colorSpace = THREE.NoColorSpace
                texture.generateMipmaps = false
                texture.minFilter = THREE.LinearFilter
                texture.magFilter = THREE.LinearFilter
                texture.needsUpdate = true
                textures.add(texture)
                slot.texture = texture
                const textureName =
                    name === "image"
                        ? "uImage"
                        : name === "from"
                          ? "uFrom"
                          : "uMap"
                const sizeName =
                    name === "image"
                        ? "uImageSize"
                        : name === "from"
                          ? "uFromSize"
                          : "uMapSize"
                material.uniforms[textureName].value = texture
                material.uniforms[sizeName].value.set(
                    image.naturalWidth,
                    image.naturalHeight
                )
                if (name === "from") material.uniforms.uHasFrom.value = 1
                if (name === "image") {
                    mesh!.visible = true
                    elapsed = 0
                    hasStarted = false
                    report("")
                }
                updateMap()
                stop()
                push()
            }
            image.onerror = () => {
                if (disposed || slot.source !== source) return
                report(
                    name === "image"
                        ? "Image could not load. Try a local upload."
                        : "Optional image could not load. Using the main image."
                )
                push()
            }
            image.src = source
        }
        function updateMap() {
            if (!material) return
            const map = latest.current.props.map
            material.uniforms.uMapType.value =
                map === "Linear"
                    ? 1
                    : map === "Radial"
                      ? 2
                      : map === "Custom" && slots.map.texture
                        ? 3
                        : 0
        }
        function readScroll() {
            const bounds = container!.getBoundingClientRect()
            scrollProgress = clamp(
                (window.innerHeight - bounds.top) /
                    Math.max(1, window.innerHeight + bounds.height),
                0,
                1
            )
            if (latest.current.props.trigger === "Scroll") push()
        }
        function resize() {
            if (!renderer || !camera || !material || !mesh) return
            width = Math.max(1, container!.clientWidth)
            height = Math.max(1, container!.clientHeight)
            const requested = clamp(
                Number(latest.current.props.pixelRatio) || 2,
                1,
                3
            )
            const ratio = Math.min(
                requested,
                Math.sqrt(8294400 / (width * height)),
                4096 / Math.max(width, height),
                renderer.capabilities.maxTextureSize / Math.max(width, height)
            )
            renderer.setPixelRatio(Math.max(0.1, ratio))
            renderer.setSize(width, height, false)
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            mesh.scale.set(camera.aspect, 1, 1)
            material.uniforms.uResolution.value.set(width, height)
            readScroll()
            push()
        }
        const color = (value: string) =>
            new THREE.Color(value).convertLinearToSRGB()
        function update() {
            if (!material) return
            const p = latest.current.props
            material.uniforms.uTint.value.copy(color(p.tint))
            material.uniforms.uHighlight.value.copy(color(p.highlight))
            material.uniforms.uSoftness.value = clamp(
                Number(p.softness) / 100,
                0.001,
                0.5
            )
            material.uniforms.uGlow.value = clamp(Number(p.glow) / 100, 0, 1)
            material.uniforms.uGlowWidth.value = clamp(
                Number(p.glowWidth) / 100,
                0.001,
                0.5
            )
            material.uniforms.uContrast.value = clamp(
                Number(p.contrast) / 100,
                0.1,
                4
            )
            material.uniforms.uDirection.value =
                (Number(p.direction) * Math.PI) / 180
            material.uniforms.uInvert.value = p.invert ? 1 : 0
            material.uniforms.uPosition.value.set(
                clamp(Number(p.positionX) / 100, 0, 1),
                1 - clamp(Number(p.positionY) / 100, 0, 1)
            )
            material.uniforms.uFit.value =
                p.fit === "Contain" ? 1 : p.fit === "Stretch" ? 2 : 0
            loadSlot("image", imageURL(p.image))
            loadSlot("from", imageURL(p.fromImage))
            loadSlot("map", imageURL(p.mapImage))
            if (!imageURL(p.image))
                report("Upload an image in the Image control.")
            updateMap()
            const key = JSON.stringify([
                p.trigger,
                p.duration,
                p.delay,
                p.hold,
                p.reverse,
            ])
            if (key !== animationKey) {
                elapsed = 0
                hasStarted = false
                animationKey = key
            }
            stop()
            resize()
        }
        const fallback = new THREE.DataTexture(
            new Uint8Array([0, 0, 0, 0]),
            1,
            1
        )
        fallback.needsUpdate = true
        textures.add(fallback)
        function cleanup() {
            if (disposed) return
            disposed = true
            stop()
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            listeners.forEach((remove) => remove())
            Object.keys(slots).forEach(releaseSlot)
            textures.forEach((texture) => texture.dispose())
            textures.clear()
            geometry?.dispose()
            material?.dispose()
            scene?.clear()
            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement))
                    container.removeChild(renderer.domElement)
            }
            controller.current = null
        }
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: false,
                powerPreference: "high-performance",
            })
            renderer.setClearColor(0x000000, 0)
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none"
            renderer.domElement.setAttribute("aria-hidden", "true")
            container.appendChild(renderer.domElement)
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(90, 1, 0.1, 10)
            camera.position.z = 1
            geometry = new THREE.PlaneGeometry(2, 2)
            material = new THREE.ShaderMaterial({
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                uniforms: {
                    uImage: { value: fallback },
                    uFrom: { value: fallback },
                    uMap: { value: fallback },
                    uResolution: { value: new THREE.Vector2(1, 1) },
                    uImageSize: { value: new THREE.Vector2(1, 1) },
                    uFromSize: { value: new THREE.Vector2(1, 1) },
                    uMapSize: { value: new THREE.Vector2(1, 1) },
                    uPosition: { value: new THREE.Vector2(0.5, 0.5) },
                    uTint: { value: color(DEFAULTS.appearance.tint) },
                    uHighlight: { value: color(DEFAULTS.appearance.highlight) },
                    uProgress: { value: 0 },
                    uSoftness: { value: 0.16 },
                    uGlow: { value: 0.45 },
                    uGlowWidth: { value: 0.12 },
                    uContrast: { value: 1 },
                    uDirection: { value: 0 },
                    uInvert: { value: 0 },
                    uHasFrom: { value: 0 },
                    uMapType: { value: 0 },
                    uFit: { value: 0 },
                },
            })
            mesh = new THREE.Mesh(geometry, material)
            mesh.visible = false
            scene.add(mesh)
            listen(container, "pointerenter", () => {
                hovered = true
                push()
            })
            listen(container, "pointerleave", () => {
                hovered = false
                push()
            })
            listen(container, "click", () => {
                if (latest.current.props.trigger === "On View") {
                    elapsed = 0
                    hasStarted = false
                    stop()
                    push()
                }
            })
            listen(document, "visibilitychange", () => {
                if (document.hidden) stop()
                else push()
            })
            listen(window, "scroll", readScroll, {
                passive: true,
                capture: true,
            })
            listen(reducedQuery, "change", () => {
                stop()
                push()
            })
            listen(renderer.domElement, "webglcontextlost", (event) => {
                event.preventDefault()
                lost = true
                stop()
            })
            listen(renderer.domElement, "webglcontextrestored", () => {
                lost = false
                update()
            })
            if (typeof ResizeObserver !== "undefined") {
                resizeObserver = new ResizeObserver(resize)
                resizeObserver.observe(container)
            } else listen(window, "resize", resize)
            if (typeof IntersectionObserver !== "undefined") {
                intersectionObserver = new IntersectionObserver((entries) => {
                    isIntersecting.current = !!entries[0]?.isIntersecting
                    if (isIntersecting.current) push()
                    else stop()
                })
                intersectionObserver.observe(container)
            }
            controller.current = { update }
            update()
        } catch (error) {
            cleanup()
            report("This device could not start the image effect.")
            console.error("ImageGradientWipe:", error)
        }
        return cleanup
    }, [])

    useEffect(() => {
        controller.current?.update()
    }, [
        shouldAnimate,
        imageURL(props.image),
        imageURL(props.fromImage),
        imageURL(props.mapImage),
        props.fit,
        props.positionX,
        props.positionY,
        props.tint,
        props.highlight,
        props.softness,
        props.glow,
        props.glowWidth,
        props.map,
        props.invert,
        props.direction,
        props.contrast,
        props.trigger,
        props.duration,
        props.delay,
        props.hold,
        props.easing,
        props.reverse,
        props.progress,
        props.pixelRatio,
        props.reducedMotion,
    ])
    const domProps = Object.fromEntries(
        Object.entries(incomingProps).filter(
            ([key]) =>
                key === "id" ||
                key === "className" ||
                key.startsWith("data-") ||
                key.startsWith("aria-")
        )
    )
    const alt = typeof props.image === "object" ? props.image?.alt : ""
    return (
        <div
            {...domProps}
            ref={mountRef}
            role="img"
            aria-label={alt || "Gradient wipe image"}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                ...incomingProps.style,
                position: "relative",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            <div
                ref={statusRef}
                role="status"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: imageURL(props.image) ? "none" : "grid",
                    placeItems: "center",
                    textAlign: "center",
                    padding: 20,
                    color: "#777",
                    font: "13px/1.4 Arial",
                    pointerEvents: "none",
                }}
            >
                Upload an image in the Image control.
            </div>
        </div>
    )
}
ImageGradientWipe.defaultProps = DEFAULTS
addPropertyControls(ImageGradientWipe, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    images: {
        type: ControlType.Object,
        title: "Image Settings",
        controls: {
            fromImage: {
                type: ControlType.ResponsiveImage,
                title: "Start Image",
                description: "Optional image instead of pink.",
            },
            mapImage: {
                type: ControlType.ResponsiveImage,
                title: "Wipe Map",
                description: "Used with Custom map mode.",
            },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["Cover", "Contain", "Stretch"],
                defaultValue: "Cover",
            },
            positionX: {
                type: ControlType.Number,
                title: "Position X",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 50,
            },
            positionY: {
                type: ControlType.Number,
                title: "Position Y",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 50,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            tint: {
                type: ControlType.Color,
                title: "Pink",
                defaultValue: "#DE8FAA",
            },
            highlight: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#E9FFFF",
            },
            softness: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 50,
                unit: "%",
                defaultValue: 16,
                description: "Feathers the wipe edge.",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 45,
            },
            glowWidth: {
                type: ControlType.Number,
                title: "Glow Width",
                min: 1,
                max: 50,
                unit: "%",
                defaultValue: 12,
                description: "Width across brightness values.",
            },
        },
    },
    wipe: {
        type: ControlType.Object,
        title: "Wipe",
        controls: {
            map: {
                type: ControlType.Enum,
                title: "Map",
                options: ["Image", "Linear", "Radial", "Custom"],
                defaultValue: "Image",
                description: "Image uses photo brightness.",
            },
            invert: {
                type: ControlType.Boolean,
                title: "Invert Map",
                defaultValue: false,
            },
            direction: {
                type: ControlType.Number,
                title: "Direction",
                min: -180,
                max: 180,
                unit: "°",
                defaultValue: 0,
                hidden: (p) => p.map !== "Linear",
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 10,
                max: 400,
                unit: "%",
                defaultValue: 100,
                description: "Separates brightness regions.",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                options: [
                    "On View",
                    "Loop",
                    "Ping Pong",
                    "Hover",
                    "Scroll",
                    "Manual",
                ],
                defaultValue: "On View",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.1,
                max: 20,
                step: 0.1,
                unit: "s",
                defaultValue: 3,
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
                defaultValue: 0.15,
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
                defaultValue: 1.2,
                description: "Pause between looping wipes.",
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["Smooth", "Linear"],
                defaultValue: "Smooth",
            },
            reverse: {
                type: ControlType.Boolean,
                title: "Reverse",
                defaultValue: false,
            },
            progress: {
                type: ControlType.Number,
                title: "Still / Manual",
                min: 0,
                max: 100,
                unit: "%",
                defaultValue: 42,
                description: "Static preview or manual progress.",
            },
        },
    },
    rendering: {
        type: ControlType.Object,
        title: "Rendering",
        description:
            "More components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            pixelRatio: {
                type: ControlType.Number,
                title: "Pixel Ratio",
                min: 1,
                max: 3,
                step: 0.5,
                unit: "×",
                defaultValue: 2,
                description: "Capped at 8.3 million pixels.",
            },
            reducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
            },
        },
    },
})
