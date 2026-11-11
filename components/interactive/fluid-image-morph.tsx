import * as React from "react"
import { useEffect, useRef } from "react"
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
import { gsap } from "gsap"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 400
 */

const DEFAULT_IMAGE_1 =
    "https://images.unsplash.com/photo-1648615112483-aeed3ce1385e?auto=format&fit=crop&w=1200&q=80"

const DEFAULT_IMAGE_2 =
    "https://images.unsplash.com/photo-1530126483408-aa533e55bdb2?auto=format&fit=crop&w=1200&q=80"

const DISPLACEMENT_IMAGE =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="28" height="49" viewBox="0 0 28 49"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4" fill-rule="nonzero"%3E%3Cpath d="M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E'

type Props = {
    image1?: string
    image2?: string
    intensity?: number
    hoverIn?: number
    hoverOut?: number
}

export default function LiquidImageHover({
    image1 = DEFAULT_IMAGE_1,
    image2 = DEFAULT_IMAGE_2,
    intensity = 0.2,
    hoverIn = 1.2,
    hoverOut = 0.8,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    const isStaticRenderer = useIsStaticRenderer()

    useEffect(() => {
        // -----------------------------------------
        // FRAMER STATIC RENDERER
        // -----------------------------------------
        // Do not initialize WebGL, textures or
        // observers while Framer is rendering
        // the component statically.
        if (isStaticRenderer) {
            return
        }

        const parent = containerRef.current

        if (!parent) {
            return
        }

        let destroyed = false
        let initialized = false
        let currentRun = 0

        let scene: THREE.Scene | null = null

        let camera: THREE.OrthographicCamera | null = null

        let renderer: THREE.WebGLRenderer | null = null

        let material: THREE.ShaderMaterial | null = null

        let mesh: THREE.Mesh | null = null

        let resizeObserver: ResizeObserver | null = null

        let visibilityObserver: IntersectionObserver | null = null

        let enterTween: gsap.core.Tween | null = null

        let leaveTween: gsap.core.Tween | null = null

        let texture1: THREE.Texture | null = null

        let texture2: THREE.Texture | null = null

        let displacement: THREE.Texture | null = null

        // -----------------------------------------
        // CLEANUP
        // -----------------------------------------

        const cleanupScene = () => {
            currentRun += 1
            initialized = false

            enterTween?.kill()
            leaveTween?.kill()

            enterTween = null
            leaveTween = null

            resizeObserver?.disconnect()
            resizeObserver = null

            // Remove event listeners
            parent.removeEventListener("mouseenter", onEnter)

            parent.removeEventListener("mouseleave", onLeave)

            parent.removeEventListener("touchstart", onTouchStart)

            parent.removeEventListener("touchend", onTouchEnd)

            // Dispose mesh
            if (mesh) {
                mesh.geometry.dispose()

                if (scene) {
                    scene.remove(mesh)
                }

                mesh = null
            }

            // Dispose material
            material?.dispose()
            material = null

            // Dispose textures
            texture1?.dispose()
            texture2?.dispose()
            displacement?.dispose()

            texture1 = null
            texture2 = null
            displacement = null

            // Dispose renderer
            renderer?.dispose()

            try {
                renderer?.forceContextLoss()
            } catch (error) {
                // Ignore context cleanup errors
            }

            renderer = null
            camera = null
            scene = null

            parent.innerHTML = ""
        }

        // -----------------------------------------
        // RENDER
        // -----------------------------------------

        const render = () => {
            if (destroyed || !renderer || !scene || !camera) {
                return
            }

            renderer.render(scene, camera)
        }

        // -----------------------------------------
        // HOVER IN
        // -----------------------------------------

        function onEnter() {
            if (!material || !renderer) {
                return
            }

            leaveTween?.kill()

            enterTween = gsap.to(material.uniforms.dispFactor, {
                value: 1,
                duration: hoverIn,
                ease: "expo.out",
                onUpdate: render,
                onComplete: render,
            })
        }

        // -----------------------------------------
        // HOVER OUT
        // -----------------------------------------

        function onLeave() {
            if (!material || !renderer) {
                return
            }

            enterTween?.kill()

            leaveTween = gsap.to(material.uniforms.dispFactor, {
                value: 0,
                duration: hoverOut,
                ease: "expo.out",
                onUpdate: render,
                onComplete: render,
            })
        }

        // -----------------------------------------
        // TOUCH
        // -----------------------------------------

        function onTouchStart() {
            onEnter()
        }

        function onTouchEnd() {
            onLeave()
        }

        // -----------------------------------------
        // LOAD TEXTURE
        // -----------------------------------------

        const loadTexture = (loader: THREE.TextureLoader, url: string) => {
            return new Promise<THREE.Texture>((resolve, reject) => {
                loader.load(url, resolve, undefined, reject)
            })
        }

        // -----------------------------------------
        // INITIALIZE WEBGL
        // -----------------------------------------

        const initScene = async () => {
            if (destroyed || initialized) {
                return
            }

            const width = parent.clientWidth

            const height = parent.clientHeight

            if (!width || !height) {
                return
            }

            initialized = true

            const run = ++currentRun

            try {
                // ----------------------------------
                // SCENE
                // ----------------------------------

                scene = new THREE.Scene()

                camera = new THREE.OrthographicCamera(
                    width / -2,
                    width / 2,
                    height / 2,
                    height / -2,
                    1,
                    1000
                )

                camera.position.z = 1

                renderer = new THREE.WebGLRenderer({
                    antialias: false,
                    alpha: true,
                })

                renderer.setPixelRatio(2)

                renderer.setClearColor(0xffffff, 0)

                renderer.setSize(width, height)

                renderer.domElement.style.width = "100%"

                renderer.domElement.style.height = "100%"

                renderer.domElement.style.display = "block"

                parent.innerHTML = ""

                parent.appendChild(renderer.domElement)

                // ----------------------------------
                // TEXTURES
                // ----------------------------------

                const loader = new THREE.TextureLoader()

                loader.setCrossOrigin("anonymous")

                const loadedTextures = await Promise.all([
                    loadTexture(loader, image1),
                    loadTexture(loader, image2),
                    loadTexture(loader, DISPLACEMENT_IMAGE),
                ])

                if (destroyed || run !== currentRun) {
                    loadedTextures.forEach((texture) => texture.dispose())

                    return
                }

                texture1 = loadedTextures[0]

                texture2 = loadedTextures[1]

                displacement = loadedTextures[2]

                texture1.magFilter = THREE.LinearFilter

                texture1.minFilter = THREE.LinearFilter

                texture2.magFilter = THREE.LinearFilter

                texture2.minFilter = THREE.LinearFilter

                displacement.magFilter = THREE.LinearFilter

                displacement.minFilter = THREE.LinearFilter

                // ----------------------------------
                // ORIGINAL EFFECT RATIO
                // ----------------------------------

                const imagesRatio = 1

                let E = 1
                let W = 1

                if (height / width < imagesRatio) {
                    E = 1
                    W = height / width / imagesRatio
                } else {
                    E = (width / height) * imagesRatio

                    W = 1
                }

                // ----------------------------------
                // ORIGINAL SHADER
                // ----------------------------------

                material = new THREE.ShaderMaterial({
                    uniforms: {
                        intensity1: {
                            value: intensity,
                        },

                        intensity2: {
                            value: intensity,
                        },

                        dispFactor: {
                            value: 0,
                        },

                        angle1: {
                            value: Math.PI / 4,
                        },

                        angle2: {
                            value: (3 * -Math.PI) / 4,
                        },

                        texture1: {
                            value: texture1,
                        },

                        texture2: {
                            value: texture2,
                        },

                        disp: {
                            value: displacement,
                        },

                        res: {
                            value: new THREE.Vector4(width, height, E, W),
                        },

                        dpr: {
                            value: window.devicePixelRatio || 1,
                        },
                    },

                    vertexShader: `
                            varying vec2 vUv;

                            void main() {
                                vUv = uv;

                                gl_Position =
                                    projectionMatrix *
                                    modelViewMatrix *
                                    vec4(
                                        position,
                                        1.0
                                    );
                            }
                        `,

                    fragmentShader: `
                            varying vec2 vUv;

                            uniform float dispFactor;
                            uniform float dpr;
                            uniform sampler2D disp;

                            uniform sampler2D texture1;
                            uniform sampler2D texture2;

                            uniform float angle1;
                            uniform float angle2;

                            uniform float intensity1;
                            uniform float intensity2;

                            uniform vec4 res;

                            mat2 getRotM(
                                float angle
                            ) {
                                float s =
                                    sin(angle);

                                float c =
                                    cos(angle);

                                return mat2(
                                    c,
                                    -s,
                                    s,
                                    c
                                );
                            }

                            void main() {

                                vec4 disp =
                                    texture2D(
                                        disp,
                                        vUv
                                    );

                                vec2 dispVec =
                                    vec2(
                                        disp.r,
                                        disp.g
                                    );

                                vec2 uv =
                                    0.5 *
                                    gl_FragCoord.xy /
                                    res.xy;

                                vec2 myUV =
                                    (
                                        uv -
                                        vec2(
                                            0.5
                                        )
                                    ) *
                                    res.zw +
                                    vec2(
                                        0.5
                                    );

                                vec2 distortedPosition1 =
                                    myUV +
                                    getRotM(
                                        angle1
                                    ) *
                                    dispVec *
                                    intensity1 *
                                    dispFactor;

                                vec2 distortedPosition2 =
                                    myUV +
                                    getRotM(
                                        angle2
                                    ) *
                                    dispVec *
                                    intensity2 *
                                    (
                                        1.0 -
                                        dispFactor
                                    );

                                vec4 _texture1 =
                                    texture2D(
                                        texture1,
                                        distortedPosition1
                                    );

                                vec4 _texture2 =
                                    texture2D(
                                        texture2,
                                        distortedPosition2
                                    );

                                gl_FragColor =
                                    mix(
                                        _texture1,
                                        _texture2,
                                        dispFactor
                                    );
                            }
                        `,

                    transparent: true,
                    opacity: 1,
                })

                // ----------------------------------
                // PLANE
                // ----------------------------------

                mesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(width, height, 1, 1),
                    material
                )

                scene.add(mesh)

                // ----------------------------------
                // EVENTS
                // ----------------------------------

                parent.addEventListener("mouseenter", onEnter)

                parent.addEventListener("mouseleave", onLeave)

                parent.addEventListener("touchstart", onTouchStart, {
                    passive: true,
                })

                parent.addEventListener("touchend", onTouchEnd)

                // ----------------------------------
                // RESIZE
                // ----------------------------------

                const resize = () => {
                    if (!renderer || !camera || !material || !mesh) {
                        return
                    }

                    const newWidth = parent.clientWidth

                    const newHeight = parent.clientHeight

                    if (!newWidth || !newHeight) {
                        return
                    }

                    let newE = 1
                    let newW = 1

                    if (newHeight / newWidth < imagesRatio) {
                        newE = 1

                        newW = newHeight / newWidth / imagesRatio
                    } else {
                        newE = (newWidth / newHeight) * imagesRatio

                        newW = 1
                    }

                    camera.left = newWidth / -2

                    camera.right = newWidth / 2

                    camera.top = newHeight / 2

                    camera.bottom = newHeight / -2

                    camera.updateProjectionMatrix()

                    renderer.setSize(newWidth, newHeight)

                    material.uniforms.res.value = new THREE.Vector4(
                        newWidth,
                        newHeight,
                        newE,
                        newW
                    )

                    mesh.geometry.dispose()

                    mesh.geometry = new THREE.PlaneGeometry(
                        newWidth,
                        newHeight,
                        1,
                        1
                    )

                    render()
                }

                resizeObserver = new ResizeObserver(resize)

                resizeObserver.observe(parent)

                resize()

                render()
            } catch (error) {
                console.error("LiquidImageHover:", error)

                cleanupScene()
            }
        }

        // -----------------------------------------
        // VIEWPORT OBSERVER
        // -----------------------------------------

        visibilityObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (!entry) {
                    return
                }

                if (entry.isIntersecting) {
                    initScene()
                } else {
                    cleanupScene()
                }
            },
            {
                threshold: 0.01,
            }
        )

        visibilityObserver.observe(parent)

        // -----------------------------------------
        // FINAL CLEANUP
        // -----------------------------------------

        return () => {
            destroyed = true

            visibilityObserver?.disconnect()

            visibilityObserver = null

            cleanupScene()
        }
    }, [image1, image2, intensity, hoverIn, hoverOut, isStaticRenderer])

    // -----------------------------------------
    // STATIC RENDER
    // -----------------------------------------

    if (isStaticRenderer) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                    background: "#111111",
                }}
            >
                <img
                    src={image1}
                    alt=""
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    // -----------------------------------------
    // LIVE RENDER
    // -----------------------------------------

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                position: "relative",
                background: "#111111",
            }}
        />
    )
}

LiquidImageHover.defaultProps = {
    image1: DEFAULT_IMAGE_1,
    image2: DEFAULT_IMAGE_2,
    intensity: 0.2,
    hoverIn: 1.2,
    hoverOut: 0.8,
}

addPropertyControls(LiquidImageHover, {
    image1: {
        type: ControlType.Image,
        title: "Image 1",
        defaultValue: DEFAULT_IMAGE_1,
    },

    image2: {
        type: ControlType.Image,
        title: "Image 2",
        defaultValue: DEFAULT_IMAGE_2,
    },

    intensity: {
        type: ControlType.Number,
        title: "Distortion",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },

    hoverIn: {
        type: ControlType.Number,
        title: "Hover In",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.2,
    },

    hoverOut: {
        type: ControlType.Number,
        title: "Hover Out",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.8,
    },
})
