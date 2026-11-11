// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { startTransition, useEffect, useRef, useState } from "react"
import * as THREE from "three"

// ---------------------------------------------------------------------------
// Config defaults
// ---------------------------------------------------------------------------

const MAX_SLIDES = 7

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23262626' width='800' height='600'/%3E%3Cpath d='M360 260h80v80h-80z' fill='%23444'/%3E%3C/svg%3E"

const DEFAULT_SLIDES = [
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 1",
        description: "Short description for the first slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 2",
        description: "Short description for the second slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 3",
        description: "Short description for the third slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 4",
        description: "Short description for the fourth slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 5",
        description: "Short description for the fifth slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 6",
        description: "Short description for the sixth slide.",
    },
    {
        image: PLACEHOLDER_IMAGE,
        title: "Slide 7",
        description: "Short description for the seventh slide.",
    },
]

// Fixed scroll-feel values (Scroll Tuning panel removed — these are tuned)
const SCROLL_SMOOTHING = 0.05 // (10% of 0.5)
const MOMENTUM_FRICTION = 0.952 // 0.8 + 80% of 0.19
const WHEEL_SPEED = 0.01 // (20% of 0.05)
const DRAG_SPEED = 0.01 // (20% of 0.05)

// Performance: hardcoded WebGL pixel-ratio cap. Lower = smoother on mobile.
const MAX_DPR = 1.5

// Base slide-height unit. The "Slide Scale" control multiplies this —
// larger values mean each slide is physically bigger, so fewer fit in
// view at once and the active slide reads larger.
const BASE_SLIDE_HEIGHT = 1.5
const DEFAULT_SLIDE_SCALE = 1.0 // shows ~5–7 slides at a time

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EffectPreset = "coverflow" | "cylinder" | "stack" | "tilt"

interface SlideData {
    image?: string
    title?: string
    description?: string
    link?: string
}

interface SlideSize {
    aspectRatio?: number
    slideScale?: number
    gap?: number
    activeScale?: number
}

interface AutoplaySettings {
    enabled?: boolean
    speed?: number
}

interface EffectSettings {
    preset?: EffectPreset
    perspective?: number
    rotation?: number
    depth?: number
}

interface Scroll3DSliderProps {
    /**
     * Slides displayed in the carousel. Add up to 7 via the property
     * panel — each slide has an Image, Title, Description, and an
     * optional Link.
     */
    slides?: SlideData[]
    backgroundColor?: string
    direction?: "vertical" | "horizontal"
    borderRadius?: number
    slideSize?: SlideSize
    effect?: EffectSettings
    interactive?: boolean
    autoplay?: AutoplaySettings
    showOverlay?: boolean
    overlayFont?: Record<string, any>
    overlayColor?: string
    overlaySize?: number
    descriptionSize?: number
    overlayPosition?: "left" | "center" | "right"
    style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrap = (value: number, range: number) => ((value % range) + range) % range

const parseColor = (color: string): string => {
    const rgba = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
    if (rgba) return `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
    const hsla = color.match(
        /hsla?\(\s*([\d.]+)\s*,\s*([\d.%]+)\s*,\s*([\d.%]+)/
    )
    if (hsla) return `hsl(${hsla[1]}, ${hsla[2]}, ${hsla[3]})`
    return color
}

/** Normalize the slides array to a clean { image, title, description, link } shape. */
const normalizeSlides = (arr: SlideData[] | undefined): SlideData[] =>
    (arr || [])
        .map((s) => ({
            image: s?.image || undefined,
            title: s?.title || undefined,
            description: s?.description || undefined,
            link: s?.link || undefined,
        }))
        .filter((s) => s.image)
        .slice(0, MAX_SLIDES)

// ---------------------------------------------------------------------------
// Static fallback
// ---------------------------------------------------------------------------

function StaticFallback({
    slides,
    backgroundColor,
    overlayColor,
    overlayFont,
    overlaySize,
    descriptionSize,
    overlayPosition,
    showOverlay,
    slideAspectRatio,
    style,
}: {
    slides: SlideData[]
    backgroundColor: string
    overlayColor: string
    overlayFont: Record<string, any>
    overlaySize: number
    descriptionSize: number
    overlayPosition: string
    showOverlay: boolean
    slideAspectRatio: number
    style?: React.CSSProperties
}) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const validSlides = slides.filter((s) => s.image)

    if (validSlides.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    minWidth: 200,
                    minHeight: 200,
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {isCanvas && (
                    <div
                        style={{
                            border: "1px dashed rgba(255,255,255,0.25)",
                            borderRadius: 12,
                            padding: "2rem",
                            color: overlayColor,
                            opacity: 0.5,
                            fontSize: 14,
                            textAlign: "center",
                        }}
                    >
                        Add images to the Slides array
                    </div>
                )}
            </div>
        )
    }

    const firstWithImage = validSlides[0]
    const firstTitle = firstWithImage?.title?.trim() || "Slide 1"
    const firstDescription = firstWithImage?.description?.trim() || ""
    const slideCount = validSlides.length

    // Text strip alignment — overlayPosition is left | center | right.
    const stripAlign =
        overlayPosition === "center"
            ? "center"
            : overlayPosition === "right"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 200,
                overflow: "hidden",
                background: backgroundColor,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {firstWithImage?.image && (
                    <div
                        style={{
                            maxWidth: "70%",
                            maxHeight: "85%",
                            aspectRatio: `${slideAspectRatio}`,
                            overflow: "hidden",
                            borderRadius: 2,
                        }}
                    >
                        <img
                            src={firstWithImage.image}
                            alt={firstTitle}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </div>
                )}
            </div>
            {showOverlay && slideCount > 0 && (
                <div
                    style={{
                        flex: "0 0 auto",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "1rem 1.25rem 1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: stripAlign,
                        alignItems:
                            stripAlign === "center"
                                ? "center"
                                : stripAlign === "flex-end"
                                  ? "flex-end"
                                  : "flex-start",
                        gap: 4,
                    }}
                >
                    <p
                        style={{
                            ...overlayFont,
                            fontSize: overlaySize,
                            fontWeight: 700,
                            color: overlayColor,
                            margin: 0,
                        }}
                    >
                        {firstTitle}
                    </p>
                    {firstDescription && (
                        <p
                            style={{
                                ...overlayFont,
                                fontSize: descriptionSize,
                                fontWeight: 400,
                                color: overlayColor,
                                margin: 0,
                                opacity: 0.8,
                            }}
                        >
                            {firstDescription}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Scroll3DSlider(props: Scroll3DSliderProps) {
    const {
        slides = DEFAULT_SLIDES,
        backgroundColor = "#141414",
        direction = "vertical",
        borderRadius = 0,
        slideSize,
        effect,
        interactive = true,
        autoplay,
        showOverlay = true,
        overlayFont = {},
        overlayColor = "#ffffff",
        overlaySize = 20,
        descriptionSize = 13,
        overlayPosition = "left",
        style,
    } = props

    // Resolve slides — capped at 7, normalized.
    const resolvedSlides = normalizeSlides(slides)

    // Resolve nested defaults — slideSize (simplified set)
    const slideAspectRatio = slideSize?.aspectRatio ?? 1.5
    const slideScale = slideSize?.slideScale ?? DEFAULT_SLIDE_SCALE
    const slideGap = slideSize?.gap ?? 0.05
    const activeScale = slideSize?.activeScale ?? 1.3

    // Effective slide height after applying the scale control.
    const slideHeightUnit = BASE_SLIDE_HEIGHT * slideScale

    // Resolve nested defaults — effect
    const effectPreset = effect?.preset ?? "coverflow"
    const effectPerspective = effect?.perspective ?? 45
    const effectRotation = effect?.rotation ?? 45
    const effectDepth = effect?.depth ?? 2.0

    // Resolve nested defaults — autoplay
    const autoplayEnabled = autoplay?.enabled ?? false
    const autoplaySpeed = ((autoplay?.speed ?? 30) / 100) * 1.0

    // Geometry key — triggers scene rebuild when layout props change
    const geometryKey = `${slideAspectRatio}-${slideScale}-${slideGap}`

    const isStatic = useIsStaticRenderer()
    const outerRef = useRef<HTMLDivElement>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const [activeSlide, setActiveSlide] = useState(0)
    const [webglFailed, setWebglFailed] = useState(false)

    const scrollTargetRef = useRef<((delta: number) => void) | null>(null)
    const activeSlideIndexRef = useRef(0)

    // Stabilize slides reference
    const slidesRef = useRef(resolvedSlides)
    const slidesKey = JSON.stringify(
        resolvedSlides.map(
            (s) => `${s.image || ""}|${s.title || ""}|${s.link || ""}`
        )
    )
    const slidesKeyRef = useRef(slidesKey)
    if (slidesKey !== slidesKeyRef.current) {
        slidesKeyRef.current = slidesKey
        slidesRef.current = resolvedSlides
    }

    // Reduced motion (ref-based for canvas RAF loop)
    const prefersReducedMotionRef = useRef(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => {
            prefersReducedMotionRef.current = mq.matches
        }
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // Config ref for animation loop
    const configRef = useRef({
        backgroundColor,
        direction,
        slideAspectRatio,
        slideHeightUnit,
        slideGap,
        effectPreset,
        effectPerspective,
        effectRotation,
        effectDepth,
        borderRadius,
        activeScale,
        autoplayEnabled,
        autoplaySpeed,
        interactive,
    })
    configRef.current = {
        backgroundColor,
        direction,
        slideAspectRatio,
        slideHeightUnit,
        slideGap,
        effectPreset,
        effectPerspective,
        effectRotation,
        effectDepth,
        borderRadius,
        activeScale,
        autoplayEnabled,
        autoplaySpeed,
        interactive,
    }

    // -----------------------------------------------------------------------
    // Main WebGL setup
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isStatic) return () => {}
        const container = canvasContainerRef.current
        if (!container) return () => {}

        const validSlides = slidesRef.current.filter((s) => s.image)
        if (validSlides.length === 0) return () => {}

        const totalSlides = validSlides.length

        let renderer: THREE.WebGLRenderer
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance",
            })
        } catch {
            startTransition(() => setWebglFailed(true))
            return () => {}
        }

        startTransition(() => setWebglFailed(false))

        const getSize = () => {
            const rect = container.getBoundingClientRect()
            return {
                width: Math.max(1, Math.floor(rect.width)),
                height: Math.max(1, Math.floor(rect.height)),
            }
        }

        const size = getSize()
        renderer.setSize(size.width, size.height, false)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        renderer.domElement.style.display = "block"
        container.appendChild(renderer.domElement)

        let disposed = false

        const scene = new THREE.Scene()
        const bgColorObj = new THREE.Color(parseColor(backgroundColor))
        scene.background = bgColorObj
        let lastBgColor = backgroundColor

        const camera = new THREE.PerspectiveCamera(
            configRef.current.effectPerspective,
            size.width / size.height,
            0.1,
            100
        )
        // Closer camera — combined with the larger Slide Scale this fills
        // the view with ~2–3 slides instead of all of them.
        camera.position.z = 4.2

        const isHorizLayout = configRef.current.direction === "horizontal"

        // Uniform slide height (random heights removed), scaled by control
        const slideHeights = Array.from(
            { length: totalSlides },
            () => configRef.current.slideHeightUnit
        )

        const slideSizes = slideHeights.map((h) => {
            const w = h * configRef.current.slideAspectRatio
            return isHorizLayout ? w : h
        })

        const slideOffsets: number[] = []
        let stackPosition = 0
        for (let i = 0; i < totalSlides; i++) {
            if (i === 0) {
                slideOffsets.push(0)
                stackPosition = slideSizes[0] / 2
            } else {
                stackPosition += configRef.current.slideGap + slideSizes[i] / 2
                slideOffsets.push(stackPosition)
                stackPosition += slideSizes[i] / 2
            }
        }

        const loopLength =
            stackPosition + configRef.current.slideGap + slideSizes[0] / 2
        const halfLoop = loopLength / 2

        // Shaders
        const coverVertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `
        const coverFragmentShader = `
            uniform sampler2D uTexture;
            uniform vec2 uPlaneAspect;
            uniform vec2 uImageAspect;
            uniform float uOpacity;
            uniform float uBorderRadius;
            varying vec2 vUv;
            void main() {
                vec2 uv = vUv;
                float planeRatio = uPlaneAspect.x / uPlaneAspect.y;
                float imageRatio = uImageAspect.x / uImageAspect.y;
                if (planeRatio > imageRatio) {
                    float scale = imageRatio / planeRatio;
                    uv.y = uv.y * scale + (1.0 - scale) * 0.5;
                } else {
                    float scale = planeRatio / imageRatio;
                    uv.x = uv.x * scale + (1.0 - scale) * 0.5;
                }
                vec4 texColor = texture2D(uTexture, uv);
                vec4 placeholder = vec4(0.15, 0.15, 0.15, 1.0);
                gl_FragColor = mix(placeholder, texColor, uOpacity);

                if (uBorderRadius > 0.0) {
                    float ar = uPlaneAspect.x / uPlaneAspect.y;
                    vec2 uvCorr = (vUv - 0.5) * vec2(ar, 1.0);
                    vec2 halfSize = vec2(ar * 0.5, 0.5);
                    float r = uBorderRadius;
                    vec2 q = abs(uvCorr) - halfSize + r;
                    float d = length(max(q, 0.0)) - r;
                    gl_FragColor.a *= 1.0 - smoothstep(-0.003, 0.003, d);
                }
            }
        `

        // Create meshes
        const meshes: THREE.Mesh[] = []
        const textureLoader = new THREE.TextureLoader()
        textureLoader.crossOrigin = "anonymous"

        for (let i = 0; i < totalSlides; i++) {
            const height = slideHeights[i]
            const width = height * configRef.current.slideAspectRatio

            const geometry = new THREE.PlaneGeometry(width, height, 32, 16)
            const material = new THREE.ShaderMaterial({
                vertexShader: coverVertexShader,
                fragmentShader: coverFragmentShader,
                uniforms: {
                    uTexture: { value: null },
                    uPlaneAspect: {
                        value: new THREE.Vector2(width, height),
                    },
                    uImageAspect: { value: new THREE.Vector2(1, 1) },
                    uOpacity: { value: 0.0 },
                    uBorderRadius: { value: borderRadius },
                },
                transparent: true,
                side: THREE.DoubleSide,
            })
            const mesh = new THREE.Mesh(geometry, material)

            mesh.userData = {
                originalVertices: [...geometry.attributes.position.array],
                offset: slideOffsets[i],
                index: i,
            }

            const imgUrl = validSlides[i].image
            if (imgUrl) {
                textureLoader.load(imgUrl, (texture) => {
                    if (disposed) {
                        texture.dispose()
                        return
                    }
                    material.uniforms.uTexture.value = texture
                    material.uniforms.uImageAspect.value.set(
                        texture.image.width,
                        texture.image.height
                    )
                    mesh.userData.opacityTarget = 1.0
                })
            }

            scene.add(mesh)
            meshes.push(mesh)
        }

        // --- Effect functions ---

        function applyCoverflowEffect(
            mesh: THREE.Mesh,
            pos: number,
            cfg: typeof configRef.current,
            horizontal: boolean
        ) {
            const maxRot = (cfg.effectRotation * Math.PI) / 180
            const t = Math.max(-1, Math.min(1, pos / 1.5))
            const absT = Math.abs(t)

            if (horizontal) {
                mesh.rotation.y = -t * maxRot
                mesh.position.z = -absT * cfg.effectDepth * 0.5
            } else {
                mesh.rotation.x = t * maxRot
                mesh.position.z = -absT * cfg.effectDepth * 0.5
            }
        }

        // Stack — slides pile up at the centre like a deck of cards.
        // The active card sits in front; non-active cards stagger behind
        // in z-depth with a slight cross-axis offset, so the deck reads.
        // Photo-safe: no rotation, no bend; only position + scale.
        function applyStackEffect(
            mesh: THREE.Mesh,
            pos: number,
            cfg: typeof configRef.current,
            horizontal: boolean
        ) {
            // Normalize distance from center; absT in [0, 1] within ~2 units.
            const absT = Math.min(1, Math.abs(pos) / 2)
            const sign = Math.sign(pos)

            // Collapse the slide toward the centre (override layout offset)
            // with a small staggered offset by sign so the deck doesn't
            // overlap into a single point.
            const stackOffset = sign * absT * 0.35
            if (horizontal) {
                mesh.position.x = stackOffset
            } else {
                mesh.position.y = stackOffset
            }

            // Stack behind in Z, proportional to Depth control.
            mesh.position.z = -absT * cfg.effectDepth * 0.7

            // Background cards shrink slightly so the active one dominates.
            const s = 1 - absT * 0.18
            mesh.scale.set(mesh.scale.x * s, mesh.scale.y * s, 1)
        }

        // Tilt Parallax — slides drift on the cross-axis as they pass
        // through centre, and tilt slightly to suggest depth. Subtle and
        // editorial; works well with photography. Uses Rotation control
        // for tilt amount and Depth for parallax drift distance.
        function applyTiltParallaxEffect(
            mesh: THREE.Mesh,
            pos: number,
            cfg: typeof configRef.current,
            horizontal: boolean
        ) {
            // Normalize distance from centre; t in [-1, 1] within ~2 units.
            const t = Math.max(-1, Math.min(1, pos / 2))
            const absT = Math.abs(t)

            // Parallax drift on the cross-axis (perpendicular to scroll).
            // Depth scales the drift distance.
            const drift = t * cfg.effectDepth * 0.18
            if (horizontal) {
                // Horizontal scroll → vertical parallax drift.
                mesh.position.y = drift
            } else {
                // Vertical scroll → horizontal parallax drift.
                mesh.position.x = drift
            }

            // Subtle Z-recede for depth cue.
            mesh.position.z = -absT * cfg.effectDepth * 0.25

            // Small tilt for 3D feel. Rotation control scales it; capped
            // soft so it doesn't compete with Coverflow.
            const maxRot = ((cfg.effectRotation * Math.PI) / 180) * 0.25
            if (horizontal) {
                // Tilt around X axis (top/bottom edge tips).
                mesh.rotation.x = -t * maxRot
            } else {
                // Tilt around Y axis (left/right edge tips).
                mesh.rotation.y = t * maxRot
            }
        }

        // Cylinder — slides wrap around a horizontal barrel. The centre
        // slide sits furthest into the screen; side slides arc forward
        // toward the viewer and rotate to face inward, like standing
        // inside a drum. The slide surface itself also curves along the
        // barrel so each panel bows as part of the cylinder.
        function applyCylinderEffect(
            mesh: THREE.Mesh,
            pos: number,
            cfg: typeof configRef.current,
            horizontal: boolean
        ) {
            // Map scroll position to an angle around the barrel. Tight
            // wrap so slides curve further around the drum — side slides
            // angle hard toward the viewer. If you want more cards
            // visible at once, lower the Slide Scale control.
            const anglePerUnit = 0.75 // radians per scroll unit
            const angle = pos * anglePerUnit
            const clamped = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle))

            // Barrel radius scales with the Depth control: deeper = more
            // pronounced curvature.
            const radius = 1.0 + cfg.effectDepth

            // Centre furthest, sides forward: subtract cos so the centre
            // (cos = 1) is pushed deepest and edges (cos -> 0) come forward.
            mesh.position.z = -radius * Math.cos(clamped)

            // Rotation strength comes from the Rotation control; the slide
            // turns to stay tangent to the barrel surface.
            const rotScale = (cfg.effectRotation / 45) * 0.9
            if (horizontal) {
                mesh.rotation.y = -clamped * rotScale
            } else {
                mesh.rotation.x = clamped * rotScale
            }

            // Bend the slide surface itself along the barrel curve so the
            // panel bows. Kept subtle by default — strong curvature warps
            // photos with faces or straight lines. Depth scales the bow.
            const positions = (mesh.geometry as THREE.PlaneGeometry).attributes
                .position
            const original = mesh.userData.originalVertices as number[]
            const bow = cfg.effectDepth * 0.12
            for (let i = 0; i < positions.count; i++) {
                const x = original[i * 3]
                const y = original[i * 3 + 1]
                const axis = horizontal ? x : y
                // Parabolic bow — edges pull back, centre of panel forward.
                const z = -(axis * axis) * bow
                positions.setZ(i, z)
            }
            positions.needsUpdate = true
            mesh.geometry.computeVertexNormals()
            mesh.userData.verticesBent = true
        }

        // Scroll state
        let scrollPosition = 0
        let scrollTarget = 0
        let scrollMomentum = 0
        let isScrolling = false
        let lastFrameTime = 0

        let isDragging = false
        let dragStartY = 0
        let dragStartX = 0
        let dragDelta = 0
        let totalDragDistance = 0
        let touchStartX = 0
        let touchStartY = 0
        let touchLastX = 0
        let touchLastY = 0
        let touchTotalDistance = 0

        let activeSlideIndex = -1
        let scrollTimeout: ReturnType<typeof setTimeout> | null = null
        let isHovered = false
        let autoplayIdleTime = 0

        // Raycaster
        const raycaster = new THREE.Raycaster()
        const pointerNDC = new THREE.Vector2()

        const getClickedSlide = (
            clientX: number,
            clientY: number
        ): number | null => {
            const rect = renderer.domElement.getBoundingClientRect()
            pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1
            pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1
            raycaster.setFromCamera(pointerNDC, camera)
            const hits = raycaster.intersectObjects(meshes)
            if (hits.length > 0) return hits[0].object.userData.index as number
            return null
        }

        // --- Event handlers ---
        const onWheel = (e: WheelEvent) => {
            if (!configRef.current.interactive) return
            e.preventDefault()
            const isHoriz = configRef.current.direction === "horizontal"
            const rawDelta = isHoriz
                ? Math.abs(e.deltaX) > Math.abs(e.deltaY)
                    ? e.deltaX
                    : e.deltaY
                : e.deltaY
            const clampedDelta =
                Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 150)
            scrollTarget += clampedDelta * WHEEL_SPEED
            isScrolling = true
            if (scrollTimeout) clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => (isScrolling = false), 150)
        }

        const onTouchStart = (e: TouchEvent) => {
            if (!configRef.current.interactive) return
            touchStartX = touchLastX = e.touches[0].clientX
            touchStartY = touchLastY = e.touches[0].clientY
            touchTotalDistance = 0
            scrollMomentum = 0
            if (scrollTimeout) clearTimeout(scrollTimeout)
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!configRef.current.interactive) return
            e.preventDefault()
            const isHoriz = configRef.current.direction === "horizontal"
            const delta = isHoriz
                ? e.touches[0].clientX - touchLastX
                : e.touches[0].clientY - touchLastY
            touchLastX = e.touches[0].clientX
            touchLastY = e.touches[0].clientY
            touchTotalDistance += Math.abs(delta)
            scrollTarget -= delta * 0.01
            isScrolling = true
        }

        const onTouchEnd = () => {
            if (!configRef.current.interactive) return
            const isHoriz = configRef.current.direction === "horizontal"
            if (touchTotalDistance < 10) {
                const clicked = getClickedSlide(touchStartX, touchStartY)
                if (clicked !== null) {
                    const clickedLink = validSlides[clicked]?.link
                    if (clicked === activeSlideIndex && clickedLink) {
                        window.open(clickedLink, "_blank", "noopener")
                    } else {
                        scrollToSlide(clicked)
                    }
                }
            }
            const swipeDelta = isHoriz
                ? touchLastX - touchStartX
                : touchLastY - touchStartY
            // Directional snap: same rule as mouse — tiny touch returns
            // to current slide, real swipe advances one in the direction.
            // touchTotalDistance is cumulative; for clicks (< 10px) the
            // earlier tap branch already handled the action.
            snapOnRelease(touchTotalDistance, Math.sign(swipeDelta))
        }

        const onPointerDown = (e: PointerEvent) => {
            if (!configRef.current.interactive) return
            if (e.pointerType === "touch") return
            isDragging = true
            dragStartX = e.clientX
            dragStartY = e.clientY
            dragDelta = 0
            totalDragDistance = 0
            scrollMomentum = 0
            renderer.domElement.style.cursor = "grabbing"
        }

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            if (!configRef.current.interactive) return

            if (!isDragging) {
                const hovered = getClickedSlide(e.clientX, e.clientY)
                if (
                    hovered === activeSlideIndex &&
                    validSlides[activeSlideIndex]?.link
                ) {
                    renderer.domElement.style.cursor = "pointer"
                } else {
                    renderer.domElement.style.cursor = "grab"
                }
                return
            }

            const isHoriz = configRef.current.direction === "horizontal"
            const delta = isHoriz
                ? e.clientX - dragStartX
                : e.clientY - dragStartY
            dragStartX = e.clientX
            dragStartY = e.clientY
            dragDelta = delta
            totalDragDistance += Math.abs(delta)
            scrollTarget -= delta * DRAG_SPEED
            isScrolling = true
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!isDragging) return
            if (e.pointerType === "touch") return
            isDragging = false
            renderer.domElement.style.cursor = configRef.current.interactive
                ? "grab"
                : "default"
            if (totalDragDistance < 10) {
                const clicked = getClickedSlide(e.clientX, e.clientY)
                if (clicked !== null) {
                    const clickedLink = validSlides[clicked]?.link
                    if (clicked === activeSlideIndex && clickedLink) {
                        window.open(clickedLink, "_blank", "noopener")
                    } else {
                        scrollToSlide(clicked)
                    }
                }
                return
            }
            // Directional snap: small drag returns to current slide,
            // larger drag advances one slide in the drag direction.
            // dragDelta sign matches the user's last movement direction;
            // positive => reveal previous slide, negative => next slide.
            snapOnRelease(totalDragDistance, Math.sign(dragDelta))
        }

        renderer.domElement.style.cursor = interactive ? "grab" : "default"

        const scrollToSlide = (targetIndex: number) => {
            const targetOffset = slideOffsets[targetIndex]
            const wrappedPos = wrap(scrollTarget, loopLength)
            let delta = targetOffset - wrappedPos
            if (delta > halfLoop) delta -= loopLength
            if (delta < -halfLoop) delta += loopLength
            scrollTarget += delta
            isScrolling = true
            if (scrollTimeout) clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => (isScrolling = false), 600)
        }

        // Find the slide whose offset is closest to the current scroll
        // position — i.e. the slide currently centred / "active".
        const getCenteredSlideIndex = (): number => {
            const wrappedPos = wrap(scrollPosition, loopLength)
            let bestIdx = 0
            let bestDist = Infinity
            for (let i = 0; i < totalSlides; i++) {
                let d = slideOffsets[i] - wrappedPos
                if (d > halfLoop) d -= loopLength
                if (d < -halfLoop) d += loopLength
                if (Math.abs(d) < bestDist) {
                    bestDist = Math.abs(d)
                    bestIdx = i
                }
            }
            return bestIdx
        }

        // Directional snap on drag release. dragMagnitude is total pixel
        // distance moved during the drag; dragSign is +1 if the user
        // dragged "back" (reveal previous) or -1 if "forward" (next).
        //   - tiny drag (< 25px): snap back to whichever slide is centred
        //   - meaningful drag: advance one slide in the drag direction
        const snapOnRelease = (dragMagnitude: number, dragSign: number) => {
            const centered = getCenteredSlideIndex()
            const COMMIT_THRESHOLD = 25 // px
            if (dragMagnitude < COMMIT_THRESHOLD || dragSign === 0) {
                scrollToSlide(centered)
                return
            }
            // dragSign +1 => previous slide, -1 => next slide
            const step = dragSign > 0 ? -1 : 1
            const target = wrap(centered + step, totalSlides)
            scrollToSlide(target)
        }

        scrollTargetRef.current = (delta: number) => {
            scrollTarget += delta
            isScrolling = true
            if (scrollTimeout) clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => (isScrolling = false), 300)
        }

        const onMouseEnter = () => {
            isHovered = true
        }
        const onMouseLeave = () => {
            isHovered = false
            autoplayIdleTime = 0
        }

        container.addEventListener("mouseenter", onMouseEnter)
        container.addEventListener("mouseleave", onMouseLeave)
        container.addEventListener("wheel", onWheel, { passive: false })
        container.addEventListener("touchstart", onTouchStart, {
            passive: true,
        })
        container.addEventListener("touchmove", onTouchMove, {
            passive: false,
        })
        container.addEventListener("touchend", onTouchEnd)
        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)

        // Resize
        const resize = () => {
            const s = getSize()
            renderer.setSize(s.width, s.height, false)
            camera.aspect = s.width / s.height
            camera.updateProjectionMatrix()
            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio || 1, MAX_DPR)
            )
        }

        let resizeObserver: ResizeObserver | null = null
        if (typeof ResizeObserver === "function") {
            resizeObserver = new ResizeObserver(resize)
            resizeObserver.observe(container)
        } else {
            window.addEventListener("resize", resize)
        }
        resize()

        // Animation loop
        let rafId = 0

        const animate = (time: number) => {
            rafId = requestAnimationFrame(animate)

            const cfg = configRef.current
            // Motion respects OS prefers-reduced-motion automatically.
            const motionEnabled = !prefersReducedMotionRef.current

            const rawDelta = lastFrameTime
                ? (time - lastFrameTime) / 1000
                : 0.016
            const deltaTime = Math.min(rawDelta, 0.1)
            lastFrameTime = time

            if (motionEnabled && isScrolling) {
                scrollTarget += scrollMomentum
                scrollMomentum *= MOMENTUM_FRICTION
                if (Math.abs(scrollMomentum) < 0.001) scrollMomentum = 0
            }

            // Autoplay
            if (
                cfg.autoplayEnabled &&
                motionEnabled &&
                !isScrolling &&
                !isDragging
            ) {
                if (isHovered) {
                    autoplayIdleTime = 0
                } else {
                    autoplayIdleTime += deltaTime
                    if (autoplayIdleTime > 0.8) {
                        scrollTarget += cfg.autoplaySpeed * deltaTime
                    }
                }
            } else {
                autoplayIdleTime = 0
            }

            scrollPosition += (scrollTarget - scrollPosition) * SCROLL_SMOOTHING

            // Prevent float drift
            if (Math.abs(scrollPosition) > loopLength * 1000) {
                const offset =
                    Math.floor(scrollPosition / loopLength) * loopLength
                scrollPosition -= offset
                scrollTarget -= offset
            }

            // Update background
            if (cfg.backgroundColor !== lastBgColor) {
                bgColorObj.set(parseColor(cfg.backgroundColor))
                lastBgColor = cfg.backgroundColor
            }

            // Animate camera FOV toward the configured Perspective.
            const targetFov = cfg.effectPerspective
            if (Math.abs(camera.fov - targetFov) > 0.1) {
                camera.fov += (targetFov - camera.fov) * 0.1
                camera.updateProjectionMatrix()
            }

            const isHoriz = cfg.direction === "horizontal"
            let closestDist = Infinity
            let closestIdx = 0

            for (const mesh of meshes) {
                const { offset, index } = mesh.userData
                let pos = -(offset - wrap(scrollPosition, loopLength))
                pos = wrap(pos + halfLoop, loopLength) - halfLoop

                mesh.rotation.set(0, 0, 0)
                mesh.position.z = 0

                // If geometry was bent by Cylinder and we switched to
                // Coverflow (flat), flatten it once.
                if (
                    mesh.userData.verticesBent &&
                    cfg.effectPreset !== "cylinder"
                ) {
                    const flatPos = (mesh.geometry as THREE.PlaneGeometry)
                        .attributes.position
                    const orig = mesh.userData.originalVertices as number[]
                    for (let i = 0; i < flatPos.count; i++) {
                        flatPos.setZ(i, orig[i * 3 + 2])
                    }
                    flatPos.needsUpdate = true
                    mesh.geometry.computeVertexNormals()
                    mesh.userData.verticesBent = false
                }

                if (isHoriz) {
                    mesh.position.x = pos
                    mesh.position.y = 0
                } else {
                    mesh.position.y = pos
                    mesh.position.x = 0
                }

                if (Math.abs(pos) < closestDist) {
                    closestDist = Math.abs(pos)
                    closestIdx = index
                }

                // Active scale — tight falloff so only the centred card
                // grows; neighbours stay at normal size so the active
                // card visibly stands out.
                if (cfg.activeScale > 1.0) {
                    const scaleRange = 1.0
                    const t = Math.max(0, 1 - Math.abs(pos) / scaleRange)
                    // Sharper easing (t^3) keeps t small until very near
                    // center, then ramps quickly — a more "popped" feel.
                    const s = 1 + (cfg.activeScale - 1) * t * t * t
                    mesh.scale.set(s, s, 1)
                } else {
                    mesh.scale.set(1, 1, 1)
                }

                // Opacity fade-in (load ramp) — tracked separately so the
                // Fade effect can multiply on top without fighting it.
                const mat = mesh.material as THREE.ShaderMaterial
                const target = (mesh.userData.opacityTarget as number) || 0
                const loadRamp = (mesh.userData.loadRamp as number) ?? 0
                if (loadRamp < target) {
                    mesh.userData.loadRamp = Math.min(
                        target,
                        loadRamp + deltaTime * 1.8
                    )
                }
                // Effect opacity multiplier (1 unless Fade lowers it).
                mesh.userData.fadeMultiplier = 1
                mat.uniforms.uOpacity.value = mesh.userData.loadRamp as number

                mat.uniforms.uBorderRadius.value = cfg.borderRadius

                // Apply selected effect
                const maxSlideExtent = isHoriz
                    ? cfg.slideHeightUnit * cfg.slideAspectRatio
                    : cfg.slideHeightUnit
                if (Math.abs(pos) < halfLoop + maxSlideExtent) {
                    switch (cfg.effectPreset) {
                        case "coverflow":
                            applyCoverflowEffect(mesh, pos, cfg, isHoriz)
                            break
                        case "cylinder":
                            applyCylinderEffect(mesh, pos, cfg, isHoriz)
                            break
                        case "stack":
                            applyStackEffect(mesh, pos, cfg, isHoriz)
                            break
                        case "tilt":
                            applyTiltParallaxEffect(mesh, pos, cfg, isHoriz)
                            break
                    }
                }
            }

            if (closestIdx !== activeSlideIndex) {
                activeSlideIndex = closestIdx
                activeSlideIndexRef.current = closestIdx
                startTransition(() => setActiveSlide(closestIdx))
            }

            renderer.render(scene, camera)
        }

        rafId = requestAnimationFrame(animate)

        return () => {
            disposed = true
            scrollTargetRef.current = null
            cancelAnimationFrame(rafId)
            if (scrollTimeout) clearTimeout(scrollTimeout)
            if (resizeObserver) resizeObserver.disconnect()
            else window.removeEventListener("resize", resize)

            container.removeEventListener("mouseenter", onMouseEnter)
            container.removeEventListener("mouseleave", onMouseLeave)
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("touchstart", onTouchStart)
            container.removeEventListener("touchmove", onTouchMove)
            container.removeEventListener("touchend", onTouchEnd)
            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)

            for (const mesh of meshes) {
                mesh.geometry.dispose()
                const mat = mesh.material as THREE.ShaderMaterial
                const tex = mat.uniforms.uTexture?.value as THREE.Texture | null
                if (tex) tex.dispose()
                mat.dispose()
            }
            renderer.dispose()
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [isStatic, slidesKey, direction, geometryKey])

    // Determine valid slides for overlay
    const validSlides = resolvedSlides.filter((s) => s.image)
    const slideCount = validSlides.length
    const clampedActive = Math.min(activeSlide, slideCount - 1)
    // currentTitle is undefined when the slide's title is empty — the
    // strip is then suppressed entirely, rather than showing a fallback
    // placeholder. Description is shown beneath the title when present.
    const rawTitle = validSlides[clampedActive]?.title?.trim()
    const currentTitle = rawTitle && rawTitle.length > 0 ? rawTitle : undefined
    const rawDescription = validSlides[clampedActive]?.description?.trim()
    const currentDescription =
        rawDescription && rawDescription.length > 0 ? rawDescription : undefined
    const currentLink = validSlides[clampedActive]?.link || ""

    if (isStatic || webglFailed) {
        return (
            <StaticFallback
                slides={resolvedSlides}
                backgroundColor={backgroundColor}
                overlayColor={overlayColor}
                overlayFont={overlayFont}
                overlaySize={overlaySize}
                descriptionSize={descriptionSize}
                overlayPosition={overlayPosition}
                showOverlay={showOverlay}
                slideAspectRatio={slideAspectRatio}
                style={style}
            />
        )
    }

    if (validSlides.length === 0) {
        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    minWidth: 200,
                    minHeight: 200,
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {isCanvas && (
                    <div
                        style={{
                            border: "1px dashed rgba(255,255,255,0.25)",
                            borderRadius: 12,
                            padding: "2rem",
                            color: overlayColor,
                            opacity: 0.5,
                            fontSize: 14,
                            textAlign: "center",
                        }}
                    >
                        Add images to the Slides array
                    </div>
                )}
            </div>
        )
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!interactive) return
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
        if (tag === "input" || tag === "textarea" || tag === "select") return
        if ((e.target as HTMLElement)?.isContentEditable) return

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            scrollTargetRef.current?.(0.5)
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            scrollTargetRef.current?.(-0.5)
        } else if (e.key === "Enter") {
            const link = validSlides[activeSlideIndexRef.current]?.link
            if (link) window.open(link, "_blank", "noopener")
        }
    }

    // Text strip alignment — overlayPosition is left | center | right.
    const stripAlign =
        overlayPosition === "center"
            ? "center"
            : overlayPosition === "right"
              ? "flex-end"
              : "flex-start"
    const stripTextAlign: "left" | "center" | "right" =
        overlayPosition === "center"
            ? "center"
            : overlayPosition === "right"
              ? "right"
              : "left"

    return (
        <div
            ref={outerRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image Slider"
            tabIndex={0}
            onKeyDown={onKeyDown}
            data-slider-45
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 200,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: backgroundColor,
                touchAction: interactive ? "none" : undefined,
                userSelect: "none",
                outline: "none",
            }}
        >
            <style>{`[data-slider-45]:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }`}</style>

            {/* WebGL canvas — takes all remaining space above the text */}
            <div
                ref={canvasContainerRef}
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    minHeight: 0,
                    width: "100%",
                }}
            />

            {/* Screen-reader live region */}
            <div
                aria-live="polite"
                aria-atomic="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                Slide {clampedActive + 1} of {slideCount}
            </div>

            {/* Text strip — relative flow, sits below the canvas */}
            {showOverlay && slideCount > 0 && currentTitle && (
                <div
                    style={{
                        flex: "0 0 auto",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "1rem 1.25rem 1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: stripAlign,
                        alignItems:
                            stripAlign === "center"
                                ? "center"
                                : stripAlign === "flex-end"
                                  ? "flex-end"
                                  : "flex-start",
                        gap: 4,
                    }}
                >
                    {currentLink ? (
                        <a
                            href={currentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                ...overlayFont,
                                fontSize: overlaySize,
                                fontWeight: 700,
                                color: overlayColor,
                                margin: 0,
                                textAlign: stripTextAlign,
                                textDecoration: "none",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {currentTitle}
                            <svg
                                width={Math.round(overlaySize * 0.65)}
                                height={Math.round(overlaySize * 0.65)}
                                viewBox="0 0 16 16"
                                fill="none"
                                style={{ opacity: 0.7, flexShrink: 0 }}
                            >
                                <path
                                    d="M3.5 12.5L12.5 3.5M12.5 3.5H5.5M12.5 3.5V10.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </a>
                    ) : (
                        <p
                            style={{
                                ...overlayFont,
                                fontSize: overlaySize,
                                fontWeight: 700,
                                color: overlayColor,
                                margin: 0,
                                textAlign: stripTextAlign,
                            }}
                        >
                            {currentTitle}
                        </p>
                    )}
                    {currentDescription && (
                        <p
                            style={{
                                ...overlayFont,
                                fontSize: descriptionSize,
                                fontWeight: 400,
                                color: overlayColor,
                                margin: 0,
                                opacity: 0.8,
                                textAlign: stripTextAlign,
                            }}
                        >
                            {currentDescription}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

Scroll3DSlider.displayName = "Scroll3DSlider"

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

addPropertyControls(Scroll3DSlider, {
    // --- Slides ---
    // Add up to 7 slides using the + button on the Slides array.
    // Each slide has an Image, Title, and optional Link.
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description:
            "Add up to 7 slides. Each has an Image, Title, Description, and optional Link.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: DEFAULT_SLIDES,
        maxCount: MAX_SLIDES,
        section: "Slides",
    },

    // --- Style ---
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#141414",
        section: "Style",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        section: "Style",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 0.15,
        step: 0.005,
        defaultValue: 0,
        section: "Style",
    },

    // --- Effect ---
    effect: {
        type: ControlType.Object,
        title: "Effect",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                description:
                    "Coverflow: classic side-rotation. Cylinder: concave barrel wrap with panels curving along the cylinder. Stack: deck-of-cards pile at the centre. Tilt: subtle parallax drift and tilt for editorial feel.",
                options: ["coverflow", "cylinder", "stack", "tilt"],
                optionTitles: ["Coverflow", "Cylinder", "Stack", "Tilt"],
                defaultValue: "coverflow",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                description:
                    "Camera field of view. Larger values exaggerate depth.",
                min: 20,
                max: 120,
                step: 1,
                unit: "\u00b0",
                defaultValue: 45,
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                description: "How far side slides rotate away from the camera.",
                min: 0,
                max: 90,
                step: 1,
                unit: "\u00b0",
                defaultValue: 45,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                description:
                    "How far back the slides recede. In Cylinder, this also controls barrel curvature and panel bow.",
                min: 0,
                max: 5,
                step: 0.1,
                unit: "\u00d7",
                defaultValue: 2.0,
            },
        },
        section: "Effect",
    },

    // --- Layout (simplified) ---
    slideSize: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            aspectRatio: {
                type: ControlType.Number,
                title: "Aspect Ratio",
                min: 0.5,
                max: 3,
                step: 0.1,
                defaultValue: 1.5,
            },
            slideScale: {
                type: ControlType.Number,
                title: "Slide Scale",
                description:
                    "Overall slide size. Higher = bigger slides, fewer visible at once.",
                min: 1,
                max: 3,
                step: 0.05,
                unit: "\u00d7",
                defaultValue: DEFAULT_SLIDE_SCALE,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                description: "Spacing between adjacent slides.",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.05,
            },
            activeScale: {
                type: ControlType.Number,
                title: "Active Scale",
                description:
                    "How much the centred (active) slide grows above neighbours. 1.0 = no enlargement.",
                min: 1.0,
                max: 2.0,
                step: 0.01,
                unit: "\u00d7",
                defaultValue: 1.3,
            },
        },
        section: "Layout",
    },

    // --- Interaction ---
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
        section: "Interaction",
    },
    autoplay: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 1,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 30,
            },
        },
        section: "Interaction",
    },

    // --- Overlay ---
    showOverlay: {
        type: ControlType.Boolean,
        title: "Show Overlay",
        defaultValue: true,
        section: "Overlay",
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        section: "Overlay",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
        section: "Overlay",
    },
    overlaySize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 10,
        max: 72,
        step: 1,
        unit: "px",
        defaultValue: 20,
        section: "Overlay",
    },
    descriptionSize: {
        type: ControlType.Number,
        title: "Description Size",
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 13,
        section: "Overlay",
    },
    overlayPosition: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        section: "Overlay",
    },
})
