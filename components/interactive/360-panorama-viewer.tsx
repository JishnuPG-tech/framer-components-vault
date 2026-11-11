// Welcome to Code in Framer
// Get Started: https://www.framer.com/developers/
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


import {
    TextureLoader,
    BackSide,
    PerspectiveCamera,
    SRGBColorSpace,
    Vector3,
    Scene,
    SphereGeometry,
    MeshBasicMaterial,
    Mesh,
    WebGLRenderer,
    MathUtils,
    VideoTexture,
} from "three"
import { useState, useEffect, useRef } from "react"

/**
 * These annotations control how your component sizes
 * Learn more: https://www.framer.com/developers/#code-components-auto-sizing
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 400
 */
export default function Panorama_viewer(props) {
    const { type, image, videoFile, controls, enableAnimate, controlStyles } =
        props
    const containerRef = useRef(null)
    const controlsRef = useRef(null)
    let isUserInteracting = false,
        longitude = 0,
        latitude = 0,
        onPointerDownLon = 0,
        onPointerDownLat = 0,
        onPointerDownPointerY = 0,
        onPointerDownPointerX = 0

    useEffect(() => {
        const containerWidth = window?.innerWidth,
            containerHeight = window?.innerHeight

        const container = containerRef.current
        const controls = controlsRef.current
        // CAMERA
        const camera = new PerspectiveCamera(
            75,
            containerWidth / containerHeight,
            1,
            1100
        )
        // SCENE
        const scene = new Scene()
        const geometry = new SphereGeometry(500, 60, 40)
        geometry.scale(-1, 1, 1)

        //Video
        const video = document.getElementById("video") as HTMLVideoElement
        if (video) {
            video.onloadeddata = function () {
                video.play()
            }
        }

        //TEXTURE
        const texture = type
            ? new TextureLoader().load(image)
            : new VideoTexture(video)
        texture.colorSpace = SRGBColorSpace

        //MATERIAL
        const material = new MeshBasicMaterial()
        material.map = texture
        material.needsUpdate = true

        //MESH
        const mesh = new Mesh(geometry, material)
        scene.add(mesh)

        //RENDER
        const renderer = new WebGLRenderer()
        renderer.setPixelRatio(window?.devicePixelRatio)
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                renderer.setSize(width, height)
            }
        })
        resizeObserver.observe(container)

        //CANVAS
        const canvas = renderer.domElement

        //canvas update
        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }
        container.appendChild(canvas)

        //canvas style
        container.style.cursor = "grab"
        container.style.opacity = "1"

        container.addEventListener(
            "pointerdown",
            (e) => onDocumentMouseDown(e, container),
            false
        )
        container.addEventListener(
            "pointermove",
            (e) => onDocumentMouseMove(e),
            false
        )
        container.addEventListener(
            "pointerup",
            (e) => onDocumentMouseUp(e, container),
            false
        )
        container.addEventListener(
            "pointerleave",
            (e) => onDocumentMouseUp(e, container),
            false
        )
        container.addEventListener(
            "wheel",
            (e) => onDocumentMouseWheel(e, camera),
            false
        )
        container.addEventListener("dblclick", (e) => fullScreen(e, canvas))
        controls.children[0].addEventListener("click", (e) =>
            fullScreen(e, canvas)
        )

        controls.children[1].addEventListener("click", (e) =>
            zoomInFunction(e, camera)
        )

        controls.children[2].addEventListener("click", (e) =>
            zoomOutFunction(e, camera)
        )

        update()
        function update() {
            requestAnimationFrame(update)
            animate(camera, scene, renderer)
        }
        return () => {
            while (scene.children.length > 0) {
                scene.remove(scene.children[0])
                renderer.forceContextLoss()
                resizeObserver.disconnect()
                renderer.dispose()

                container.removeChild(renderer.domElement)
            }
        }
    }, [type])
    const animate = (camera, scene, renderer) => {
        if (isUserInteracting === false) {
            enableAnimate ? (longitude += 0.1) : longitude
        }
        latitude = Math.max(-85, Math.min(85, latitude))

        let phi = MathUtils.degToRad(90 - latitude)
        let theta = MathUtils.degToRad(longitude)

        const x = 500 * Math.sin(phi) * Math.cos(theta)
        const y = 500 * Math.cos(phi)
        const z = 500 * Math.sin(phi) * Math.sin(theta)

        camera.lookAt(x, y, z)
        renderer.render(scene, camera)
    }

    const onDocumentMouseWheel = (event, camera) => {
        event.preventDefault()
        const fov = camera.fov + event.deltaY * 0.05
        camera.fov = MathUtils.clamp(fov, 10, 75)
        camera.updateProjectionMatrix()
    }

    const onDocumentMouseDown = (event, container) => {
        event.preventDefault()
        if (event.isPrimary === false) return
        container.style.cursor = "grabbing"
        isUserInteracting = true

        onPointerDownPointerX = event.clientX
        onPointerDownPointerY = event.clientY

        onPointerDownLon = longitude
        onPointerDownLat = latitude
    }

    const onDocumentMouseMove = (event) => {
        if (event.isPrimary === false) return
        if (isUserInteracting) {
            longitude =
                (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon

            latitude =
                (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat
        }
    }

    const onDocumentMouseUp = (event, container) => {
        event.preventDefault()
        if (event.isPrimary === false) return
        container.style.cursor = "grab"
        isUserInteracting = false
        container.removeEventListener("pointermove", onDocumentMouseMove)
        container.removeEventListener("pointerup", onDocumentMouseUp)
    }

    const clickZoom = (value, zoomType) => {
        if (value >= 20 && zoomType === "zoomIn") {
            return value - 5
        } else if (value < 75 && zoomType === "zoomOut") {
            return value + 5
        } else {
            return value
        }
    }

    const isFullscreenElement = () => {
        return Boolean(
            document?.fullscreenElement ||
                (document as any)?.webkitFullscreenElement ||
                (document as any)?.mozFullScreenElement
        )
    }

    const onWindowResize = (
        camera,
        renderer,
        containerWidth,
        containerHeight
    ) => {
        camera.aspect = containerWidth / containerHeight
        camera.updateProjectionMatrix()
        if (!isFullscreenElement()) {
            renderer.setSize(containerWidth, containerHeight)
        } else {
            renderer.setSize(window?.innerWidth, window?.innerHeight)
        }
    }

    const fullScreen = (e, canvas) => {
        e.preventDefault()
        if (!isFullscreenElement()) {
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen()
            } else if (canvas.webkitRequestFullscreen) {
                canvas.webkitRequestFullscreen()
            } else if (canvas.mozRequestFullScreen) {
                canvas.mozRequestFullScreen()
            }
        } else {
            if (document?.exitFullscreen) {
                document?.exitFullscreen()
            } else if ((document as any)?.webkitExitFullscreen) {
                ;(document as any)?.webkitExitFullscreen()
            } else if ((document as any)?.mozExitFullscreen) {
                ;(document as any)?.mozExitFullscreen()
            }
        }
    }

    const getFov = (camera) => {
        return Math.floor(
            (2 *
                Math.atan(
                    camera.getFilmHeight() / 2 / camera.getFocalLength()
                ) *
                180) /
                Math.PI
        )
    }

    const zoomInFunction = (e, camera) => {
        e.preventDefault()
        const fov = getFov(camera)
        camera.fov = clickZoom(fov, "zoomIn")
        camera.updateProjectionMatrix()
    }

    const zoomOutFunction = (e, camera) => {
        e.preventDefault()
        const fov = getFov(camera)
        camera.fov = clickZoom(fov, "zoomOut")
        camera.updateProjectionMatrix()
    }

    return (
        <>
            <div
                style={{
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    width: "100%",
                    height: "100%",
                }}
            >
                {/*Render element*/}
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                    }}
                ></div>
                {!type && (
                    <video
                        id="video"
                        loop
                        muted
                        crossOrigin="anonymous"
                        playsinline
                        style={{ display: "none" }}
                        src={videoFile}
                    ></video>
                )}

                {/*Controls*/}
                <div
                    ref={controlsRef}
                    style={{
                        display: controls ? "flex" : "none",
                        flexDirection: "column",
                        gap: "5px",
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        zIndex: 1,
                    }}
                >
                    {/*fullscreen*/}
                    <div
                        style={{
                            background: controlStyles.bgcolor,
                            padding: controlStyles.padding + "px",
                            cursor: "pointer",
                            borderRadius: controlStyles.borderRadius + "px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                width: controlStyles.size + "px",
                                color: controlStyles.color,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: controlStyles.fullscreenIcon,
                            }}
                        ></div>
                    </div>
                    {/*Zoomin*/}
                    <div
                        style={{
                            background: controlStyles.bgcolor,
                            padding: controlStyles.padding + "px",
                            cursor: "pointer",
                            borderRadius: controlStyles.borderRadius + "px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                width: controlStyles.size + "px",
                                color: controlStyles.color,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: controlStyles.zoomInIcon,
                            }}
                        ></div>
                    </div>
                    {/*Zoomout*/}
                    <div
                        style={{
                            background: controlStyles.bgcolor,
                            padding: controlStyles.padding + "px",
                            cursor: "pointer",
                            borderRadius: controlStyles.borderRadius + "px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                width: controlStyles.size + "px",
                                color: controlStyles.color,
                            }}
                            dangerouslySetInnerHTML={{
                                __html: controlStyles.zoomOutIcon,
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    )
}

Panorama_viewer.defaultProps = {
    type: true,
    image: "",
    videoFile: "",
    zoomBar: true,
    enableAnimate: true,
    controls: true,
    controlStyles: {
        size: 28,
        padding: 8,
        borderRadius: 5,
        bgcolor: "rgba(0,0,0,0.2)",
        color: "#ffffff",
        fullscreenIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48V96a8,8,0,0,1-16,0V67.31l-50.34,50.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM106.34,138.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l50.35-50.34a8,8,0,0,0-11.32-11.32Z"></path></svg>`,
        zoomOutIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M152,112a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h64A8,8,0,0,1,152,112Zm77.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88.11,88.11,0,1,1,11.31-11.31l50.07,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z"></path></svg>`,
        zoomInIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M152,112a8,8,0,0,1-8,8H120v24a8,8,0,0,1-16,0V120H80a8,8,0,0,1,0-16h24V80a8,8,0,0,1,16,0v24h24A8,8,0,0,1,152,112Zm77.66,117.66a8,8,0,0,1-11.32,0l-50.06-50.07a88.11,88.11,0,1,1,11.31-11.31l50.07,50.06A8,8,0,0,1,229.66,229.66ZM112,184a72,72,0,1,0-72-72A72.08,72.08,0,0,0,112,184Z"></path></svg>`,
    },
}

addPropertyControls(Panorama_viewer, {
    type: {
        title: "Type",
        type: ControlType.Boolean,
        enabledTitle: "Image",
        disabledTitle: "Video",
    },
    image: {
        type: ControlType.Image,
        title: "Image upload",
        hidden: (props) => !props.type,
    },
    videoFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "mov"],
        title: "Video",
        hidden: (props) => props.type,
    },
    enableAnimate: {
        title: "Animate",
        type: ControlType.Boolean,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    controls: {
        title: "Control UI",
        type: ControlType.Boolean,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    controlStyles: {
        type: ControlType.Object,
        title: "Control Styles",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Icon Size",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
            },
            bgcolor: {
                type: ControlType.Color,
                title: "Background Color",
            },
            fullscreenIcon: {
                type: ControlType.String,
                title: "Fullscreen Icon",
            },
            zoomOutIcon: {
                type: ControlType.String,
                title: "Zoom-Out Icon",
            },
            zoomInIcon: {
                type: ControlType.String,
                title: "Zoom-In Icon",
            },
            color: {
                type: ControlType.Color,
                title: "Icon Color",
                description:
                    "Note: \n if you want to replace default svg icon, please change 'fill/stroke' property to 'currentColor', then only icon color property will be overide",
            },
        },
        hidden(props: any) {
            return props.controls === false
        },
    },
})
