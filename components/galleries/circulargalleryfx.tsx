import * as React from "react"
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


// ─── Constants ───────────────────────────────────────────────────────────────

const PIXELS = new Float32Array(
    [
        1, 1.5, 2, 2.5, 3, 1, 1.5, 2, 2.5, 3, 3.5, 4, 2, 2.5, 3, 3.5, 4, 4.5, 5,
        5.5, 6, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 20, 100,
    ].map((v) => v / 100)
)

const FRAME_SVG =
    "https://cdn.prod.website-files.com/675835c7f4ae1fa1a79b3733/6762b98cb5e68f0b74323e61_collection-card-frame.svg"
const GRID_SVG = "https://img.blacklead.work/grid.svg"

const DEFAULT_IMAGES: string[] = [
    "https://i.ibb.co.com/fYZm79Sn/Blurred-Portrait-Outdoors.png",
    "https://i.ibb.co.com/mCCVNWQc/Man-Relaxing-Outdoors.png",
    "https://i.ibb.co.com/whtHQDTQ/Playful-Starry-Portrait.png",
    "https://i.ibb.co.com/G4KFgXJC/Futuristic-Portrait.png",
]

// ─── Shape helpers ────────────────────────────────────────────────────────────

// Returns { clipPath?, borderRadius? } for each viewer shape
function getViewerShapeStyle(shape: string): React.CSSProperties {
    switch (shape) {
        case "square":
            return { borderRadius: 0 }
        case "roundedSquare":
            return { borderRadius: 24 }
        case "squircle":
            return { borderRadius: "32%" }
        case "portrait":
            return { clipPath: "inset(0 12.5% round 0px)" }
        case "landscape":
            return { clipPath: "inset(15% 0 round 0px)" }
        case "hexagon":
            return {
                clipPath:
                    "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            }
        case "diamond":
            return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }
        case "arch":
            return { borderRadius: "50% 50% 10px 10px / 55% 55% 10px 10px" }
        case "star":
            return {
                clipPath:
                    "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }
        case "circle":
        default:
            return { clipPath: "circle(50% at 50% 50%)" }
    }
}

// Returns the VISIBLE pixel dimensions used for shader aspect-fit
function getViewerDims(shape: string, sz: number): [number, number] {
    if (shape === "portrait") return [sz * 0.75, sz]
    if (shape === "landscape") return [sz, sz * 0.7]
    return [sz, sz]
}

// Thumbnail geometry + styling per shape
type ThumbDef = {
    w: number
    h: number
    imgW: number
    imgH: number
    style: React.CSSProperties
    showFrame: boolean // only portrait uses the SVG card frame
}

function getThumbDef(shape: string): ThumbDef {
    switch (shape) {
        case "square":
            return {
                w: 74,
                h: 74,
                imgW: 74,
                imgH: 74,
                style: { borderRadius: 0 },
                showFrame: false,
            }
        case "roundedSquare":
            return {
                w: 74,
                h: 74,
                imgW: 74,
                imgH: 74,
                style: { borderRadius: 12 },
                showFrame: false,
            }
        case "circle":
            return {
                w: 74,
                h: 74,
                imgW: 74,
                imgH: 74,
                style: { borderRadius: "50%", overflow: "hidden" },
                showFrame: false,
            }
        case "landscape":
            return {
                w: 105,
                h: 66,
                imgW: 105,
                imgH: 66,
                style: { borderRadius: 8 },
                showFrame: false,
            }
        case "hexagon":
            return {
                w: 74,
                h: 74,
                imgW: 74,
                imgH: 74,
                style: {
                    clipPath:
                        "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                },
                showFrame: false,
            }
        case "diamond":
            return {
                w: 74,
                h: 74,
                imgW: 74,
                imgH: 74,
                style: {
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                },
                showFrame: false,
            }
        case "portrait":
        default:
            return {
                w: 74,
                h: 105,
                imgW: 66,
                imgH: 99,
                style: { borderRadius: 8 },
                showFrame: true,
            }
    }
}

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAGMENT_SHADER = `
uniform float uProgress;
uniform vec3 uFillColor;
uniform sampler2D uTexture;
uniform vec2 uTextureSize;
uniform vec2 uElementSize;
varying vec2 vUv;

float quadraticInOut(float t) {
    float p = 2.0 * t * t;
    return t < 0.5 ? p : -p + (4.0 * t) - 1.0;
}

void main() {
    // Cover-fit UV with aspect correction
    vec2 uv = vUv - vec2(0.5);
    float a1 = uTextureSize.x / uTextureSize.y;
    float a2 = uElementSize.x / uElementSize.y;
    if (a1 > a2) { uv *= vec2(a2 / a1, 1.0); }
    else          { uv *= vec2(1.0, a1 / a2); }
    uv += vec2(0.5);

    // Wave-pixelate dissolve
    float prog = quadraticInOut(1.0 - uProgress);
    float s = 50.0;
    vec2 gs = vec2(s, floor(s / (uTextureSize.x / uTextureSize.y)));

    float v = smoothstep(0.0, 1.0,
        vUv.y
        + sin(vUv.x * 4.0 + prog * 6.0)
          * mix(0.3, 0.1, abs(0.5 - vUv.x))
          * 0.5
          * smoothstep(0.0, 0.2, prog)
        + (1.0 - prog * 2.0)
    );

    float mu = (vUv.x * 3.0 + (1.0 - v) * 50.0) * prog;
    vec2 suv = mix(uv, floor(uv * gs) / gs, mu);

    vec4 c = texture2D(uTexture, suv);
    c.a = v;
    c.rgb = mix(c.rgb, uFillColor, smoothstep(0.5, 0.0, abs(0.5 - c.a)) * prog);
    gl_FragColor = c;
    gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 1.2));
}
`

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function CircularGallery(props: any) {
    const {
        images,
        backgroundColor = "#ffdfc4",
        showGrid = true,
        fillColor = "#000000",
        circleSize = 450,
        viewerShape = "circle",
        thumbShape = "portrait",
        thumbPosition = "right",
        transitionSpeed = 0.015,
        showBorder = true,
        autoPlay = false,
        autoInterval = 3,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ── Three.js refs
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = React.useRef<THREE.Scene | null>(null)
    const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null)
    const materialRef = React.useRef<THREE.ShaderMaterial | null>(null)
    const planeRef = React.useRef<THREE.Mesh | null>(null)
    const texturesRef = React.useRef<(THREE.Texture | null)[]>([])
    const rafRef = React.useRef<number>(0)

    // ── Animation state
    const progressRef = React.useRef(1)
    const transitionTargetRef = React.useRef<number | null>(null)
    const isAnimatingRef = React.useRef(false)
    const activeImageRef = React.useRef(0)

    // ── Stable prop refs (read safely inside RAF / intervals)
    const transitionSpeedRef = React.useRef(transitionSpeed)
    transitionSpeedRef.current = transitionSpeed
    const fillColorRef = React.useRef(fillColor)
    fillColorRef.current = fillColor
    const circleSizeRef = React.useRef(circleSize)
    circleSizeRef.current = circleSize
    const viewerShapeRef = React.useRef(viewerShape)
    viewerShapeRef.current = viewerShape
    const imageCountRef = React.useRef(0)
    const isHoveredRef = React.useRef(false)

    // ── UI state
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [hoveredThumb, setHoveredThumb] = React.useState<number | null>(null)

    // ── Resolved images (main images used for both viewer and thumbnails)
    const resolvedImages = React.useMemo<string[]>(() => {
        const arr = (images as string[] | undefined)?.filter(Boolean) ?? []
        return arr.length > 0 ? arr : DEFAULT_IMAGES
    }, [images])

    // Keep imageCountRef in sync
    imageCountRef.current = resolvedImages.length

    // ── Go-to-image: shared by click and auto-slide
    const goToImage = React.useCallback((index: number) => {
        if (index === activeImageRef.current || isAnimatingRef.current) return
        if (!texturesRef.current[index]) return
        transitionTargetRef.current = index
        progressRef.current = 0
        isAnimatingRef.current = true
        setActiveIndex(index) // highlight thumbnail immediately on click
    }, [])

    const goToImageRef = React.useRef(goToImage)
    goToImageRef.current = goToImage

    // ── Effect: sync fillColor → shader
    React.useEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uFillColor.value.set(fillColor)
        }
    }, [fillColor])

    // ── Effect: sync circleSize + viewerShape → renderer + uElementSize
    React.useEffect(() => {
        if (!rendererRef.current) return
        rendererRef.current.setSize(circleSize, circleSize)
        if (materialRef.current) {
            const [vw, vh] = getViewerDims(viewerShape, circleSize)
            materialRef.current.uniforms.uElementSize.value.set(vw, vh)
        }
    }, [circleSize, viewerShape])

    // ── Effect: mount — renderer + scene + camera + RAF tick
    React.useEffect(() => {
        if (isCanvas) return
        const canvas = canvasRef.current
        if (!canvas) return

        const sz = circleSizeRef.current
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        })
        renderer.setSize(sz, sz)
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
        rendererRef.current = renderer

        const scene = new THREE.Scene()
        sceneRef.current = scene

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
        camera.position.z = 10
        cameraRef.current = camera

        const tick = () => {
            rafRef.current = requestAnimationFrame(tick)

            const mat = materialRef.current
            if (
                mat &&
                isAnimatingRef.current &&
                transitionTargetRef.current !== null
            ) {
                progressRef.current = Math.min(
                    1,
                    progressRef.current + transitionSpeedRef.current
                )

                // Swap texture once 10% through
                if (progressRef.current > 0.1) {
                    const tgt = transitionTargetRef.current
                    const tex = texturesRef.current[tgt]
                    if (tex && mat.uniforms.uTexture.value !== tex) {
                        mat.uniforms.uTexture.value = tex
                        mat.uniforms.uTextureSize.value.set(
                            tex.image.width,
                            tex.image.height
                        )
                    }
                }

                mat.uniforms.uProgress.value = progressRef.current

                if (progressRef.current >= 1) {
                    activeImageRef.current = transitionTargetRef.current!
                    transitionTargetRef.current = null
                    isAnimatingRef.current = false
                }
            }

            renderer.render(scene, camera)
        }
        tick()

        return () => {
            cancelAnimationFrame(rafRef.current)
            texturesRef.current.forEach((t) => t?.dispose())
            texturesRef.current = []
            materialRef.current?.dispose()
            materialRef.current = null
            planeRef.current?.geometry.dispose()
            planeRef.current = null
            renderer.dispose()
            rendererRef.current = null
            sceneRef.current = null
            cameraRef.current = null
        }
    }, [isCanvas])

    // ── Effect: load textures whenever images change
    React.useEffect(() => {
        if (isCanvas || !sceneRef.current) return

        let cancelled = false
        const urls = resolvedImages
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin("anonymous")
        const newTex: (THREE.Texture | null)[] = new Array(urls.length).fill(
            null
        )
        let done = 0

        const install = () => {
            if (cancelled) {
                newTex.forEach((t) => t?.dispose())
                return
            }

            texturesRef.current.forEach((t) => t?.dispose())
            texturesRef.current = newTex

            const tex = newTex.find((t) => t !== null)
            if (!tex || !sceneRef.current) return

            if (!materialRef.current) {
                const [vw, vh] = getViewerDims(
                    viewerShapeRef.current,
                    circleSizeRef.current
                )
                const mat = new THREE.ShaderMaterial({
                    vertexShader: VERTEX_SHADER,
                    fragmentShader: FRAGMENT_SHADER,
                    uniforms: {
                        uFillColor: {
                            value: new THREE.Color(fillColorRef.current),
                        },
                        uProgress: { value: 1 },
                        uPixels: { value: PIXELS },
                        uTextureSize: {
                            value: new THREE.Vector2(
                                tex.image.width,
                                tex.image.height
                            ),
                        },
                        uElementSize: { value: new THREE.Vector2(vw, vh) },
                        uTexture: { value: tex },
                    },
                    transparent: true,
                })
                materialRef.current = mat
                const geom = new THREE.PlaneGeometry(8.3, 8.3)
                const plane = new THREE.Mesh(geom, mat)
                planeRef.current = plane
                sceneRef.current.add(plane)
            } else {
                materialRef.current.uniforms.uTexture.value = tex
                materialRef.current.uniforms.uTextureSize.value.set(
                    tex.image.width,
                    tex.image.height
                )
                materialRef.current.uniforms.uProgress.value = 1
            }

            progressRef.current = 1
            transitionTargetRef.current = null
            isAnimatingRef.current = false
            activeImageRef.current = 0
            setActiveIndex(0)
        }

        urls.forEach((url, i) => {
            loader.load(
                url,
                (t) => {
                    if (cancelled) {
                        t.dispose()
                        return
                    }
                    t.minFilter = THREE.LinearFilter
                    t.magFilter = THREE.LinearFilter
                    newTex[i] = t
                    if (++done === urls.length) install()
                },
                undefined,
                () => {
                    if (++done === urls.length) install()
                }
            )
        })

        return () => {
            cancelled = true
        }
    }, [resolvedImages, isCanvas])

    // ── Effect: auto-slide
    React.useEffect(() => {
        if (!autoPlay || isCanvas) return
        const id = setInterval(() => {
            if (isHoveredRef.current) return
            const count = imageCountRef.current
            if (count < 2) return
            const next = (activeImageRef.current + 1) % count
            goToImageRef.current(next)
        }, autoInterval * 1000)
        return () => clearInterval(id)
    }, [autoPlay, autoInterval, isCanvas])

    // ── Derived styling
    const sz = circleSize
    const outerSz = sz + 14
    const viewerStyle = getViewerShapeStyle(viewerShape)
    const thumbDef = getThumbDef(thumbShape)

    // Thumbnail strip position
    const thumbStripStyle: React.CSSProperties = {
        position: "absolute",
        bottom: 20,
        display: "flex",
        flexDirection: "row",
        gap: 10,
        zIndex: 3,
        ...(thumbPosition === "left"
            ? { left: 20 }
            : thumbPosition === "center"
              ? { left: "50%", transform: "translateX(-50%)" }
              : { right: 20 }),
    }

    return (
        <div
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                backgroundImage: showGrid ? `url(${GRID_SVG})` : undefined,
                backgroundRepeat: "repeat",
                backgroundSize: "auto",
            }}
            onMouseEnter={() => {
                isHoveredRef.current = true
            }}
            onMouseLeave={() => {
                isHoveredRef.current = false
            }}
        >
            {/* ── Outer black border ring (same shape, slightly larger) */}
            {showBorder && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: outerSz,
                        height: outerSz,
                        background: "black",
                        transform: "translate(-50%, -50%)",
                        zIndex: 0,
                        ...viewerStyle,
                    }}
                />
            )}

            {/* ── Viewer canvas area */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: sz,
                    height: sz,
                    transform: "translate(-50%, -50%)",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    zIndex: 1,
                    ...viewerStyle,
                }}
            >
                {isCanvas ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            color: "white",
                            fontFamily: "sans-serif",
                        }}
                    >
                        <div style={{ fontSize: 28 }}>◈</div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                opacity: 0.9,
                            }}
                        >
                            Gallery
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>
                            {resolvedImages.length} images
                        </div>
                    </div>
                ) : (
                    <canvas ref={canvasRef} style={{ display: "block" }} />
                )}

                {/* Inner border overlay — follows same shape via clip/radius */}
                {showBorder && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "10px solid black",
                            pointerEvents: "none",
                            zIndex: 2,
                            ...viewerStyle,
                        }}
                    />
                )}
            </div>

            {/* ── Thumbnail strip */}
            <div style={thumbStripStyle}>
                {resolvedImages.map((url, i) => {
                    const isActive = activeIndex === i
                    const isHov = hoveredThumb === i
                    const highlighted = isActive || isHov
                    return (
                        <div
                            key={i}
                            onClick={() => goToImage(i)}
                            onMouseEnter={() => setHoveredThumb(i)}
                            onMouseLeave={() => setHoveredThumb(null)}
                            style={{
                                position: "relative",
                                width: thumbDef.w,
                                height: thumbDef.h,
                                cursor: "pointer",
                                opacity: isActive ? 1 : 0.6,
                                overflow: "hidden",
                                transition:
                                    "opacity 0.4s ease, transform 0.3s ease",
                                transform: highlighted
                                    ? "scale(1.07)"
                                    : "scale(1)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexShrink: 0,
                                ...thumbDef.style,
                            }}
                        >
                            <img
                                src={url}
                                alt={`Slide ${i + 1}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            {/* SVG card frame: portrait only */}
                            {thumbDef.showFrame && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: `url(${FRAME_SVG})`,
                                        backgroundSize: "cover",
                                        backgroundRepeat: "no-repeat",
                                        opacity: highlighted ? 1 : 0,
                                        transition: "opacity 0.4s ease",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                            {/* Simple highlight ring for non-portrait shapes */}
                            {!thumbDef.showFrame && isActive && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        border: "2px solid white",
                                        pointerEvents: "none",
                                        ...thumbDef.style,
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Defaults ────────────────────────────────────────────────────────────────

CircularGallery.defaultProps = {
    images: DEFAULT_IMAGES,
    backgroundColor: "#ffdfc4",
    showGrid: true,
    fillColor: "#000000",
    circleSize: 450,
    viewerShape: "circle",
    thumbShape: "portrait",
    thumbPosition: "right",
    transitionSpeed: 0.015,
    showBorder: true,
    autoPlay: false,
    autoInterval: 3,
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(CircularGallery, {
    images: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.Image },
        defaultValue: DEFAULT_IMAGES,
        maxCount: 12,
        description: "Same images are used for viewer and thumbnails.",
    },

    // ── Viewer
    viewerShape: {
        title: "Viewer Shape",
        type: ControlType.Enum,
        options: [
            "circle",
            "square",
            "roundedSquare",
            "squircle",
            "portrait",
            "landscape",
            "hexagon",
            "diamond",
            "arch",
            "star",
        ],
        optionTitles: [
            "Circle",
            "Square",
            "Rounded Square",
            "Squircle",
            "Portrait",
            "Landscape",
            "Hexagon",
            "Diamond",
            "Arch",
            "Star",
        ],
        defaultValue: "circle",
        displaySegmentedControl: false,
    },
    circleSize: {
        title: "Viewer Size",
        type: ControlType.Number,
        defaultValue: 450,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    showBorder: {
        title: "Border Ring",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    fillColor: {
        title: "Fill Color",
        type: ControlType.Color,
        defaultValue: "#000000",
        description: "Color blended into the transition dissolve.",
    },

    // ── Thumbnails
    thumbShape: {
        title: "Thumb Shape",
        type: ControlType.Enum,
        options: [
            "portrait",
            "square",
            "roundedSquare",
            "circle",
            "landscape",
            "hexagon",
            "diamond",
        ],
        optionTitles: [
            "Portrait",
            "Square",
            "Rounded Square",
            "Circle",
            "Landscape",
            "Hexagon",
            "Diamond",
        ],
        defaultValue: "circle",
        displaySegmentedControl: false,
    },
    thumbPosition: {
        title: "Thumb Position",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },

    // ── Animation
    transitionSpeed: {
        title: "Anim Speed",
        type: ControlType.Number,
        defaultValue: 0.015,
        min: 0.003,
        max: 0.05,
        step: 0.001,
        description: "Progress increment per frame (higher = faster).",
    },
    autoPlay: {
        title: "Auto Slide",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoInterval: {
        title: "Interval",
        type: ControlType.Number,
        defaultValue: 3,
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        hidden: (props) => !props.autoPlay,
    },

    // ── Background
    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#ffdfc4",
    },
    showGrid: {
        title: "Grid BG",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
