import { useRef, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture } from "ogl"

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LiquidGallery(props) {
    const isStatic = useIsStaticRenderer()

    const dockRef = useRef<HTMLDivElement>(null)
    const canvasContainerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const startRenderRef = useRef<(() => void) | null>(null)

    const [hiddenSrc, setHiddenSrc] = useState<string | null>(null)

    const propsRef = useRef(props)
    propsRef.current = props

    const stateRef = useRef({
        target: null as { rect: DOMRect; src: string } | null,
        isClosing: false,
        isReady: false,
    })

    const handleImageClick = (
        e: React.MouseEvent<HTMLDivElement>,
        src: string
    ) => {
        const rect = e.currentTarget.getBoundingClientRect()
        stateRef.current = {
            target: { rect, src },
            isClosing: false,
            isReady: false,
        }
        startRenderRef.current?.()
    }

    const handleClose = () => {
        if (stateRef.current.target) {
            stateRef.current.isClosing = true
            startRenderRef.current?.()
        }
    }

    useEffect(() => {
        if (isStatic) return

        const container = canvasContainerRef.current
        if (!container) return

        const renderer = new Renderer({
            alpha: true,
            dpr: window.devicePixelRatio || 2,
        })
        const gl = renderer.gl
        gl.clearColor(0, 0, 0, 0)
        container.appendChild(gl.canvas)

        const camera = new Camera(gl, { fov: 45 })
        camera.position.z = 5
        const scene = new Transform()

        const geometry = new Plane(gl, {
            width: 1,
            height: 1,
            widthSegments: 60,
            heightSegments: 60,
        })
        const texture = new Texture(gl, { generateMipmaps: true })

        const program = new Program(gl, {
            vertex: `
                attribute vec3 position;
                attribute vec2 uv;
                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;

                uniform float uProgress; 
                uniform vec2 uStartPos;  
                uniform vec2 uStartScale;
                uniform vec2 uEndPos;    
                uniform vec2 uEndScale;
                uniform vec2 uRadius;
                uniform float uPixelsPerUnit;

                varying vec2 vUv;
                varying vec2 vUnwarpedSize;
                varying float vRadius;

                void main() {
                    vUv = uv;

                    vUnwarpedSize = mix(uStartScale, uEndScale, uProgress) * uPixelsPerUnit;
                    vRadius = mix(uRadius.x, uRadius.y, uProgress);

                    float prog = 1.0 - clamp(uProgress, 0.0, 1.0); 

                    float slideT = clamp(prog / 0.5, 0.0, 1.0);
                    float slideProgress = slideT * slideT * (3.0 - 2.0 * slideT); 

                    float transT = clamp((prog - 0.3) / 0.7, 0.0, 1.0);
                    float translateProgress = transT * transT * (3.0 - 2.0 * transT); 

                    float fullTopY = uEndPos.y + uEndScale.y * 0.5;
                    float fullBottomY = uEndPos.y - uEndScale.y * 0.5;
                    float dockTopY = uStartPos.y + uStartScale.y * 0.5;
                    float dockBottomY = uStartPos.y - uStartScale.y * 0.5;

                    float verticalDist = dockTopY - fullTopY;
                    float translationY = translateProgress * verticalDist;

                    float curTopEdgeY = fullTopY + translationY;
                    float curBottomEdgeY = max(fullBottomY + translationY, dockBottomY);

                    float currentY = mix(curBottomEdgeY, curTopEdgeY, uv.y);

                    float fullLeftX = uEndPos.x - uEndScale.x * 0.5;
                    float fullRightX = uEndPos.x + uEndScale.x * 0.5;
                    float dockLeftX = uStartPos.x - uStartScale.x * 0.5;
                    float dockRightX = uStartPos.x + uStartScale.x * 0.5;

                    float bezierBottomLeftX = mix(fullLeftX, dockLeftX, slideProgress);
                    float bezierBottomRightX = mix(fullRightX, dockRightX, slideProgress);

                    float xMin = fullLeftX;
                    float xMax = fullRightX;

                    if (currentY <= dockTopY) {
                        xMin = bezierBottomLeftX;
                        xMax = bezierBottomRightX;
                    } else if (currentY < fullTopY) {
                        float normalizedY = (currentY - dockTopY) / (fullTopY - dockTopY);
                        float eased = normalizedY < 0.5 
                            ? 4.0 * normalizedY * normalizedY * normalizedY 
                            : 1.0 - pow(-2.0 * normalizedY + 2.0, 3.0) / 2.0;

                        xMin = mix(bezierBottomLeftX, fullLeftX, eased);
                        xMax = mix(bezierBottomRightX, fullRightX, eased);
                    }

                    float currentX = mix(xMin, xMax, uv.x);

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(currentX, currentY, 0.0, 1.0);
                }
            `,
            fragment: `
                precision highp float;
                uniform sampler2D tMap;
                uniform float uAlpha;
                uniform vec2 uImageRes;
                
                varying vec2 vUv;
                varying vec2 vUnwarpedSize;
                varying float vRadius;

                float udRoundBox(vec2 p, vec2 b, float r) {
                    return length(max(abs(p) - b + r, 0.0)) - r;
                }

                void main() {
                    float imageAspect = uImageRes.x / uImageRes.y;
                    float meshAspect = vUnwarpedSize.x / vUnwarpedSize.y;
                    
                    vec2 scale = vec2(1.0);
                    if(meshAspect > imageAspect) {
                        scale.y = imageAspect / meshAspect;
                    } else {
                        scale.x = meshAspect / imageAspect;
                    }
                    vec2 coverUv = (vUv - 0.5) * scale + 0.5;

                    vec2 pxPos = (vUv - 0.5) * vUnwarpedSize;
                    vec2 halfSize = vUnwarpedSize * 0.5;
                    float d = udRoundBox(pxPos, halfSize, vRadius);
                    float alphaMask = 1.0 - smoothstep(0.0, 1.5, d);
                    
                    vec4 tex = texture2D(tMap, coverUv);
                    gl_FragColor = vec4(tex.rgb, tex.a * uAlpha * alphaMask);
                }
            `,
            uniforms: {
                tMap: { value: texture },
                uAlpha: { value: 0.0 },
                uProgress: { value: 0.0 },
                uStartPos: { value: [0, 0] },
                uStartScale: { value: [1, 1] },
                uEndPos: { value: [0, 0] },
                uEndScale: { value: [1, 1] },
                uRadius: { value: [16.0, 32.0] },
                uPixelsPerUnit: { value: 1.0 },
                uImageRes: { value: [1, 1] },
            },
            transparent: true,
        })

        const mesh = new Mesh(gl, { geometry, program })
        mesh.setParent(scene)

        function resize() {
            if (!container) return
            const rect = container.getBoundingClientRect()
            renderer.setSize(rect.width, rect.height)
            camera.perspective({ aspect: gl.canvas.width / gl.canvas.height })
        }

        const observer = new ResizeObserver(resize)
        observer.observe(container)
        resize()

        let rafId: number
        let loadedSrc = ""
        let isRendering = false
        let isVisible = false

        function update() {
            if (!isVisible) {
                isRendering = false
                return
            }

            const state = stateRef.current
            const target = state.target
            const currentProps = propsRef.current

            if (
                target &&
                !state.isClosing &&
                !state.isReady &&
                loadedSrc !== target.src
            ) {
                loadedSrc = target.src
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.src = target.src
                img.onload = () => {
                    texture.image = img
                    program.uniforms.uImageRes.value = [img.width, img.height]
                    program.uniforms.uAlpha.value = 1.0

                    program.uniforms.uRadius.value = [
                        currentProps.iconRadius,
                        currentProps.expandedRadius,
                    ]

                    const cRect = container.getBoundingClientRect()
                    const fov = (45 * Math.PI) / 180
                    const wHeight = 2 * Math.tan(fov / 2) * camera.position.z
                    const wWidth = wHeight * (cRect.width / cRect.height)

                    program.uniforms.uPixelsPerUnit.value =
                        cRect.height / wHeight

                    const targetLeft = target.rect.left - cRect.left
                    const targetTop = target.rect.top - cRect.top

                    const nx =
                        ((targetLeft + target.rect.width / 2) / cRect.width) *
                            2 -
                        1
                    const ny =
                        (-(targetTop + target.rect.height / 2) / cRect.height) *
                            2 +
                        1
                    const startScaleX =
                        (target.rect.width / cRect.width) * wWidth
                    const startScaleY =
                        (target.rect.height / cRect.height) * wHeight

                    program.uniforms.uStartPos.value = [
                        (nx * wWidth) / 2,
                        (ny * wHeight) / 2,
                    ]
                    program.uniforms.uStartScale.value = [
                        startScaleX,
                        startScaleY,
                    ]

                    const endSize =
                        Math.min(cRect.width, cRect.height) *
                        currentProps.expandedScale
                    const endScaleX = (endSize / cRect.width) * wWidth
                    const endScaleY = (endSize / cRect.height) * wHeight

                    program.uniforms.uEndPos.value = [0, 0]
                    program.uniforms.uEndScale.value = [endScaleX, endScaleY]

                    state.isReady = true
                    setHiddenSrc(target.src)
                }
            }

            const speedIn = 0.08 * currentProps.animationSpeed
            const speedOut = 0.1 * currentProps.animationSpeed

            if (target && !state.isClosing && state.isReady) {
                program.uniforms.uProgress.value +=
                    (1.0 - program.uniforms.uProgress.value) * speedIn
            } else if (
                state.isClosing &&
                program.uniforms.uProgress.value > 0
            ) {
                program.uniforms.uProgress.value +=
                    (0.0 - program.uniforms.uProgress.value) * speedOut

                if (program.uniforms.uProgress.value < 0.005) {
                    program.uniforms.uAlpha.value = 0.0
                    program.uniforms.uProgress.value = 0.0
                    state.target = null
                    state.isClosing = false
                    state.isReady = false
                    loadedSrc = ""
                    setHiddenSrc(null)
                }
            }

            if (overlayRef.current) {
                const p = program.uniforms.uProgress.value

                overlayRef.current.style.opacity = p > 0.005 ? "1" : "0"

                const blurAmount = p * currentProps.maxBlur
                const blurString = `blur(${blurAmount}px)`
                overlayRef.current.style.backdropFilter = blurString
                overlayRef.current.style.setProperty(
                    "-webkit-backdrop-filter",
                    blurString
                )

                const colorPercentage = p * currentProps.overlayOpacity * 100
                overlayRef.current.style.backgroundColor = `color-mix(in srgb, ${currentProps.overlayColor} ${colorPercentage}%, transparent)`

                overlayRef.current.style.pointerEvents =
                    p > 0.01 ? "auto" : "none"
            }

            renderer.render({ scene, camera })

            if (!state.target && program.uniforms.uProgress.value === 0) {
                isRendering = false
            } else {
                rafId = requestAnimationFrame(update)
            }
        }

        startRenderRef.current = () => {
            if (!isRendering && isVisible) {
                isRendering = true
                rafId = requestAnimationFrame(update)
            }
        }

        const io = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting
            if (
                isVisible &&
                (stateRef.current.target ||
                    program.uniforms.uProgress.value > 0)
            ) {
                startRenderRef.current?.()
            }
        })
        io.observe(container)

        renderer.render({ scene, camera })

        return () => {
            observer.disconnect()
            io.disconnect()
            cancelAnimationFrame(rafId)
            if (container.contains(gl.canvas)) {
                container.removeChild(gl.canvas)
            }
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        }
    }, [isStatic])

    return (
        <div style={{ ...containerStyle, ...props.style }}>
            <div ref={overlayRef} style={overlayStyle} onClick={handleClose} />

            <div
                ref={canvasContainerRef}
                style={{
                    ...canvasStyle,
                    pointerEvents: hiddenSrc ? "auto" : "none",
                }}
                onClick={handleClose}
            />

            <div
                ref={dockRef}
                style={{
                    ...dockStyle,
                    background: props.dockColor,
                    gap: `${props.dockGap}px`,
                    padding: `${props.dockPadding}px`,
                    borderRadius: `${props.dockRadius}px`,
                }}
            >
                {props.images.map((item, i) => {
                    const src =
                        item.source === "upload"
                            ? item.imageUpload
                            : item.imageUrl
                    if (!src) return null

                    return (
                        <div
                            key={i}
                            onClick={(e) => handleImageClick(e, src)}
                            style={{
                                ...imageWrapperStyle,
                                width: `${props.iconSize}px`,
                                height: `${props.iconSize}px`,
                                borderRadius: `${props.iconRadius}px`,
                                backgroundImage: `url(${src})`,
                                opacity: hiddenSrc === src ? 0 : 1,
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
}
const canvasStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 30,
}
const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    pointerEvents: "none",
    zIndex: 25,
}
const dockStyle: CSSProperties = {
    position: "absolute",
    bottom: "40px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    zIndex: 20,
}
const imageWrapperStyle: CSSProperties = {
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
    transition: "opacity 0.2s",
}

const defaultImageValues = [
    {
        source: "url",
        imageUrl:
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    },
    {
        source: "url",
        imageUrl:
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    },
    {
        source: "url",
        imageUrl:
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800",
    },
    {
        source: "url",
        imageUrl:
            "https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=800",
    },
]

LiquidGallery.defaultProps = {
    width: 800,
    height: 600,
    images: defaultImageValues,
    dockColor: "rgba(255, 255, 255, 0.6)",
    iconSize: 100,
    dockGap: 32,
    dockPadding: 24,
    dockRadius: 32,
    iconRadius: 24,
    expandedScale: 0.6,
    expandedRadius: 32,
    overlayColor: "#000000",
    overlayOpacity: 0.3,
    maxBlur: 12,
    animationSpeed: 1.0,
}

addPropertyControls(LiquidGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        defaultValue: defaultImageValues,
        control: {
            type: ControlType.Object,
            controls: {
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["upload", "url"],
                    optionTitles: ["Upload File", "Paste URL"],
                    defaultValue: "url",
                },
                imageUpload: {
                    type: ControlType.Image,
                    title: "File",
                    hidden: (props) => props.source !== "upload",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "",
                    hidden: (props) => props.source !== "url",
                },
            },
        },
    },
    dockColor: {
        type: ControlType.Color,
        title: "Dock Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 20,
        max: 200,
        defaultValue: 100,
    },
    dockGap: {
        type: ControlType.Number,
        title: "Dock Gap",
        min: 0,
        max: 100,
        defaultValue: 32,
    },
    dockPadding: {
        type: ControlType.Number,
        title: "Dock Padding",
        min: 0,
        max: 100,
        defaultValue: 24,
    },
    dockRadius: {
        type: ControlType.Number,
        title: "Dock Radius",
        min: 0,
        max: 100,
        defaultValue: 32,
    },
    iconRadius: {
        type: ControlType.Number,
        title: "Icon Radius",
        min: 0,
        max: 100,
        defaultValue: 24,
    },
    expandedScale: {
        type: ControlType.Number,
        title: "Open Scale",
        min: 0.1,
        max: 1.0,
        step: 0.05,
        defaultValue: 0.6,
    },
    expandedRadius: {
        type: ControlType.Number,
        title: "Open Radius",
        min: 0,
        max: 100,
        defaultValue: 32,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Tint",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.3,
    },
    maxBlur: {
        type: ControlType.Number,
        title: "Max Blur",
        min: 0,
        max: 100,
        defaultValue: 12,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        min: 0.1,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
    },
})
