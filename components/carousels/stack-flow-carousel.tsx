import * as React from "react"
import { useRef, useEffect } from "react"
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

import gsap from "gsap"

export default function StackedCarousel3D(incomingProps) {
    const props = {
        ...StackedCarousel3D.defaultProps,
        ...incomingProps,
        ...(incomingProps.contentSettings || {}),
        ...(incomingProps.sceneSettings || {}),
        ...(incomingProps.animationSettings || {}),
        ...(incomingProps.hoverCircleSettings || {}),
    }

    const mountRef = useRef(null)
    const cursorRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const propsRef = useRef(props)
    propsRef.current = props
    const needsUpdate = useRef(true)

    useEffect(() => {
        needsUpdate.current = true
    }, [incomingProps])

    useEffect(() => {
        if (!mountRef.current) return

        let isVisible = false
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting
        })
        observer.observe(mountRef.current)

        const w = mountRef.current.clientWidth
        const h = mountRef.current.clientHeight
        const scene = new THREE.Scene()

        const rootGroup = new THREE.Group()
        scene.add(rootGroup)

        const camera = new THREE.PerspectiveCamera(
            propsRef.current.perspective,
            w / h,
            0.1,
            20000
        )
        camera.position.z = propsRef.current.cameraDistance

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        if (THREE.SRGBColorSpace) {
            renderer.outputColorSpace = THREE.SRGBColorSpace
        } else {
            renderer.outputEncoding = 3001
        }

        mountRef.current.appendChild(renderer.domElement)

        const geometry = new THREE.PlaneGeometry(1, 1)
        const textureLoader = new THREE.TextureLoader()

        let textures = []
        const visualMeshes = []
        const interactionMeshes = []
        const videoElements = []

        const visualGroup = new THREE.Group()
        rootGroup.add(visualGroup)

        const interactionGroup = new THREE.Group()
        rootGroup.add(interactionGroup)

        let previousHoveredIndex = -1
        let hoveredIndex = -1

        const materialCache = new Map()
        let sharedIMat = null

        const rebuildMeshes = () => {
            visualMeshes.forEach((m) => {
                visualGroup.remove(m)
            })
            visualMeshes.length = 0

            interactionMeshes.forEach((m) => {
                interactionGroup.remove(m)
            })
            interactionMeshes.length = 0

            materialCache.forEach((mat) => {
                if (mat.alphaMap) mat.alphaMap.dispose()
                mat.dispose()
            })
            materialCache.clear()

            videoElements.forEach((vid) => {
                vid.pause()
                vid.removeAttribute("src")
                vid.load()
            })
            videoElements.length = 0

            if (sharedIMat) sharedIMat.dispose()

            sharedIMat = new THREE.MeshBasicMaterial({
                visible: false,
                depthWrite: false,
            })

            previousHoveredIndex = -1
            hoveredIndex = -1

            const p = propsRef.current

            const activeMedia =
                p.mediaItems && p.mediaItems.length > 0
                    ? p.mediaItems
                    : p.images
                      ? p.images.map((img) => ({
                            type: "image",
                            image: img,
                            link: "",
                        }))
                      : []

            textures = activeMedia.map((item) => {
                const src = item.type === "video" ? item.video : item.image
                if (!src) return null

                if (item.type === "video") {
                    const video = document.createElement("video")
                    video.src = src
                    video.crossOrigin = "anonymous"
                    video.loop = true
                    video.muted = true
                    video.playsInline = true
                    video.autoplay = true
                    video
                        .play()
                        .catch((e) =>
                            console.log("Video autoplay prevented:", e)
                        )
                    videoElements.push(video)

                    const tex = new THREE.VideoTexture(video)
                    if (THREE.SRGBColorSpace)
                        tex.colorSpace = THREE.SRGBColorSpace
                    else tex.encoding = 3001
                    return tex
                } else {
                    const tex = textureLoader.load(src)
                    if (THREE.SRGBColorSpace)
                        tex.colorSpace = THREE.SRGBColorSpace
                    else tex.encoding = 3001
                    return tex
                }
            })

            let maskTexture = null
            if (p.svgMask) {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d", {
                    willReadFrequently: true,
                })
                maskTexture = new THREE.CanvasTexture(canvas)

                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    const baseWidth =
                        img.width > 0 ? img.width : p.imageWidth || 512
                    const baseHeight =
                        img.height > 0 ? img.height : p.imageHeight || 512
                    const maxDimension = 2048
                    const scale = Math.min(
                        maxDimension / baseWidth,
                        maxDimension / baseHeight,
                        4
                    )

                    canvas.width = Math.max(baseWidth * scale, 1)
                    canvas.height = Math.max(baseHeight * scale, 1)
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

                    const imageData = ctx.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    )
                    const data = imageData.data
                    for (let i = 0; i < data.length; i += 4) {
                        const alpha = data[i + 3]
                        data[i] = alpha
                        data[i + 1] = alpha
                        data[i + 2] = alpha
                        data[i + 3] = 255
                    }
                    ctx.putImageData(imageData, 0, 0)

                    maskTexture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy()
                    maskTexture.minFilter = THREE.LinearMipmapLinearFilter
                    maskTexture.magFilter = THREE.LinearFilter
                    maskTexture.generateMipmaps = true
                    maskTexture.needsUpdate = true
                    needsUpdate.current = true
                }
                img.src = p.svgMask
            }

            for (let i = 0; i < p.visibleCount; i++) {
                const tex =
                    textures.length > 0 ? textures[i % textures.length] : null
                if (tex && !tex.anisotropy) {
                    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
                }

                let mat = materialCache.get(tex)
                if (!mat) {
                    mat = new THREE.MeshBasicMaterial({
                        map: tex,
                        alphaMap: maskTexture,
                        alphaTest: 0.02,
                        side: THREE.DoubleSide,
                        transparent: true,
                        depthWrite: true,
                    })
                    materialCache.set(tex, mat)
                }

                const vMesh = new THREE.Mesh(geometry, mat)
                vMesh.userData = { index: i, baseZ: undefined }
                vMesh.position.z = -99999
                visualGroup.add(vMesh)
                visualMeshes.push(vMesh)

                const iMesh = new THREE.Mesh(geometry, sharedIMat)
                iMesh.userData = { index: i }
                iMesh.position.z = -99999
                interactionGroup.add(iMesh)
                interactionMeshes.push(iMesh)
            }
        }
        rebuildMeshes()

        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2(-9999, -9999)

        let isHoveringContainer = false
        let cursorTargetX = -100
        let cursorTargetY = -100
        let cursorX = -100
        let cursorY = -100
        let cursorTargetScale = 0
        let cursorScale = 0

        const onMouseMove = (e) => {
            const rect = mountRef.current.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
            cursorTargetX = e.clientX - rect.left
            cursorTargetY = e.clientY - rect.top
            isHoveringContainer = true
        }

        const onMouseLeave = () => {
            mouse.x = -9999
            mouse.y = -9999
            isHoveringContainer = false
            if (mountRef.current) mountRef.current.style.cursor = "default"
        }

        const onClick = (e) => {
            if (!mountRef.current) return

            const rect = mountRef.current.getBoundingClientRect()
            const clickMouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            )

            raycaster.setFromCamera(clickMouse, camera)
            const intersects = raycaster.intersectObjects(interactionMeshes)

            if (intersects.length > 0) {
                const clickedIndex = intersects[0].object.userData.index
                const p = propsRef.current
                const activeMedia =
                    p.mediaItems && p.mediaItems.length > 0
                        ? p.mediaItems
                        : p.images
                          ? p.images.map((img) => ({
                                type: "image",
                                image: img,
                                link: "",
                            }))
                          : []

                const item = activeMedia[clickedIndex % activeMedia.length]

                if (item && item.link && item.link.trim() !== "") {
                    if (RenderTarget.current() === RenderTarget.canvas) {
                        console.log(
                            "Link clicked in Editor Canvas: ",
                            item.link
                        )
                        return
                    }

                    // FEATURE FIX: Safely parse URL so raw strings like "www.google.com" open as absolute links
                    let urlToOpen = item.link.trim()
                    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(urlToOpen)) {
                        urlToOpen = "https://" + urlToOpen
                    }

                    window.open(urlToOpen, "_blank", "noopener,noreferrer")
                }
            }
        }

        let targetScroll = 0
        let currentScroll = 0

        const onWheel = (e) => {
            if (isHoveringContainer) {
                targetScroll -= e.deltaY * propsRef.current.scrollSpeed * 0.05
            }
        }

        mountRef.current.addEventListener("mousemove", onMouseMove)
        mountRef.current.addEventListener("mouseleave", onMouseLeave)
        mountRef.current.addEventListener("click", onClick)
        window.addEventListener("wheel", onWheel, { passive: true })

        const resizeObserver = new ResizeObserver(() => {
            if (!mountRef.current) return
            const nw = mountRef.current.clientWidth
            const nh = mountRef.current.clientHeight
            camera.aspect = nw / nh
            camera.updateProjectionMatrix()
            renderer.setSize(nw, nh)
            needsUpdate.current = true
        })
        resizeObserver.observe(mountRef.current)

        let reqId
        let lastPropVisCount = propsRef.current.visibleCount
        let lastPropMediaStr = JSON.stringify(propsRef.current.mediaItems)
        let lastPropSvgMask = propsRef.current.svgMask

        const rootQuat = new THREE.Quaternion()
        const invQuat = new THREE.Quaternion()
        const flatEuler = new THREE.Euler()
        let lastAngleX = null
        let lastAngleY = null

        const introAnim = { progress: 0 }
        gsap.to(introAnim, {
            progress: 1,
            duration: 2.4,
            ease: "power3.inOut",
        })

        const animate = () => {
            reqId = requestAnimationFrame(animate)
            const isLive = !isStatic
            const p = propsRef.current
            const isPlaying = isLive || p.livePreview
            const introProg = introAnim.progress

            if (isLive && !isVisible) return

            const currentMediaStr = JSON.stringify(p.mediaItems)
            if (
                p.visibleCount !== lastPropVisCount ||
                currentMediaStr !== lastPropMediaStr ||
                p.svgMask !== lastPropSvgMask
            ) {
                lastPropVisCount = p.visibleCount
                lastPropMediaStr = currentMediaStr
                lastPropSvgMask = p.svgMask
                rebuildMeshes()
                needsUpdate.current = true
            }

            if (!isPlaying && !needsUpdate.current) return
            needsUpdate.current = false

            if (isPlaying) {
                currentScroll += (targetScroll - currentScroll) * p.damping
            }

            camera.fov = p.perspective
            camera.position.z = p.cameraDistance
            camera.updateProjectionMatrix()

            const stackAngleXRad = (p.viewAngleX * Math.PI) / 180
            const stackAngleYRad = (p.viewAngleY * Math.PI) / 180

            rootGroup.rotation.x = stackAngleXRad
            rootGroup.rotation.y = stackAngleYRad

            const totalDepth = p.visibleCount * p.zSpacing
            const maxZ = p.cameraDistance - 50
            const minZ = maxZ - totalDepth

            rootGroup.updateMatrixWorld(true)
            raycaster.setFromCamera(mouse, camera)

            hoveredIndex = -1

            if (isHoveringContainer) {
                const intersects = raycaster.intersectObjects(interactionMeshes)
                if (intersects.length > 0) {
                    hoveredIndex = intersects[0].object.userData.index
                    targetScroll +=
                        (currentScroll - targetScroll) *
                        Math.min(p.damping * 1.5, 1)
                }
            }

            if (mountRef.current) {
                mountRef.current.style.cursor =
                    hoveredIndex !== -1 ? "pointer" : "default"
            }

            cursorTargetScale =
                hoveredIndex !== -1 && isHoveringContainer ? 1 : 0
            cursorX += (cursorTargetX - cursorX) * 0.25
            cursorY += (cursorTargetY - cursorY) * 0.25
            cursorScale += (cursorTargetScale - cursorScale) * 0.15

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%)) scale(${cursorScale})`
                cursorRef.current.style.opacity = cursorScale > 0.02 ? 1 : 0
            }

            if (hoveredIndex === -1 && isPlaying && p.autoScrollSpeed !== 0) {
                targetScroll += p.autoScrollSpeed
            }

            if (
                lastAngleX !== stackAngleXRad ||
                lastAngleY !== stackAngleYRad
            ) {
                rootQuat.setFromEuler(
                    new THREE.Euler(stackAngleXRad, stackAngleYRad, 0, "XYZ")
                )
                invQuat.copy(rootQuat).invert()
                flatEuler.setFromQuaternion(invQuat, "XYZ")
                lastAngleX = stackAngleXRad
                lastAngleY = stackAngleYRad
            }

            if (hoveredIndex !== previousHoveredIndex) {
                if (previousHoveredIndex !== -1) {
                    const prevMesh = visualMeshes[previousHoveredIndex]
                    const prevIMesh = interactionMeshes[previousHoveredIndex]
                    if (prevMesh && prevIMesh) {
                        gsap.to([prevMesh.rotation, prevIMesh.rotation], {
                            x: 0,
                            y: 0,
                            z: 0,
                            duration: 1.2,
                            ease: "power3.out",
                            overwrite: "auto",
                        })
                    }
                }
                if (hoveredIndex !== -1) {
                    const currMesh = visualMeshes[hoveredIndex]
                    const currIMesh = interactionMeshes[hoveredIndex]
                    if (currMesh && currIMesh) {
                        gsap.to([currMesh.rotation, currIMesh.rotation], {
                            x: flatEuler.x,
                            y: flatEuler.y,
                            z: flatEuler.z,
                            duration: 1.2,
                            ease: "power3.out",
                            overwrite: "auto",
                        })
                    }
                }
                previousHoveredIndex = hoveredIndex
            }

            const maxDiagonal = Math.sqrt(
                p.imageWidth * p.imageWidth + p.imageHeight * p.imageHeight
            )
            const pushSpread =
                maxDiagonal * 0.5 + (p.hoverGap !== undefined ? p.hoverGap : 40)

            let hoveredBaseZ = 0
            if (hoveredIndex !== -1) {
                const offsetZ = hoveredIndex * p.zSpacing + currentScroll
                hoveredBaseZ =
                    ((((offsetZ - minZ) % totalDepth) + totalDepth) %
                        totalDepth) +
                    minZ
            }

            for (let i = 0; i < p.visibleCount; i++) {
                const vMesh = visualMeshes[i]
                const iMesh = interactionMeshes[i]

                const offsetZ = i * p.zSpacing + currentScroll
                const normalizedZ =
                    ((((offsetZ - minZ) % totalDepth) + totalDepth) %
                        totalDepth) +
                    minZ

                let prevBaseZ = vMesh.userData.baseZ
                let isFirstFrame = prevBaseZ === undefined
                if (isFirstFrame) prevBaseZ = normalizedZ
                vMesh.userData.baseZ = normalizedZ

                let targetX = p.posX
                let targetY = p.posY
                let targetZ = normalizedZ
                let targetSX = p.imageWidth
                let targetSY = p.imageHeight

                const depthFactor = (maxZ - normalizedZ) / totalDepth
                const staggerDelay = depthFactor * 0.4
                const itemProg = Math.max(
                    0,
                    Math.min(1, (introProg - staggerDelay) / 0.6)
                )
                const easeProg = 1 - Math.pow(1 - itemProg, 3)
                const itemInvProg = 1 - easeProg

                targetZ -= 300 * itemInvProg
                targetY -= 60 * itemInvProg
                targetSX *= 0.4 + 0.6 * easeProg
                targetSY *= 0.4 + 0.6 * easeProg

                let distFromHover = 0

                if (hoveredIndex !== -1) {
                    if (i === hoveredIndex) {
                        targetZ += 60
                        vMesh.renderOrder = 10
                    } else {
                        vMesh.renderOrder = 0

                        distFromHover = targetZ - hoveredBaseZ
                        if (distFromHover > totalDepth / 2)
                            distFromHover -= totalDepth
                        if (distFromHover < -totalDepth / 2)
                            distFromHover += totalDepth

                        if (distFromHover < -0.1) {
                            targetZ -= pushSpread
                        } else if (distFromHover > 0.1) {
                            targetZ += pushSpread
                        }
                    }
                } else {
                    vMesh.renderOrder = 0
                }

                const zDist = Math.abs(targetZ - vMesh.position.z)
                const isFarBack = Math.abs(distFromHover) > totalDepth * 0.35
                const isIntroActive = introProg < 0.99

                const isWrapJump =
                    !isIntroActive && zDist > pushSpread * 0.8 && isFarBack

                const lf = Math.min(p.damping, 1)

                if (
                    isFirstFrame ||
                    Math.abs(normalizedZ - prevBaseZ) > totalDepth * 0.5 ||
                    isWrapJump
                ) {
                    vMesh.position.set(targetX, targetY, targetZ)
                    vMesh.scale.set(targetSX, targetSY, 1)

                    iMesh.position.set(targetX, targetY, targetZ)
                    if (hoveredIndex === i) {
                        iMesh.scale.set(targetSX * 1.2, targetSY * 1.2, 1)
                    } else {
                        iMesh.scale.set(targetSX, targetSY, 1)
                    }
                } else {
                    vMesh.position.x += (targetX - vMesh.position.x) * lf
                    vMesh.position.y += (targetY - vMesh.position.y) * lf
                    vMesh.position.z += (targetZ - vMesh.position.z) * lf
                    vMesh.scale.x += (targetSX - vMesh.scale.x) * lf
                    vMesh.scale.y += (targetSY - vMesh.scale.y) * lf

                    iMesh.position.copy(vMesh.position)

                    if (hoveredIndex === i) {
                        iMesh.scale.set(
                            vMesh.scale.x * 1.2,
                            vMesh.scale.y * 1.2,
                            1
                        )
                    } else {
                        iMesh.scale.copy(vMesh.scale)
                    }
                }
            }
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            cancelAnimationFrame(reqId)
            observer.disconnect()
            resizeObserver.disconnect()
            mountRef.current?.removeEventListener("mousemove", onMouseMove)
            mountRef.current?.removeEventListener("mouseleave", onMouseLeave)
            mountRef.current?.removeEventListener("click", onClick)
            window.removeEventListener("wheel", onWheel)
            mountRef.current?.removeChild(renderer.domElement)
            geometry.dispose()

            videoElements.forEach((vid) => {
                vid.pause()
                vid.removeAttribute("src")
                vid.load()
            })

            materialCache.forEach((mat) => {
                if (mat.alphaMap) mat.alphaMap.dispose()
                mat.dispose()
            })
            if (sharedIMat) sharedIMat.dispose()

            renderer.dispose()
        }
    }, [])

    return (
        <div
            {...incomingProps}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...incomingProps.style,
            }}
        >
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    inset: 0,
                }}
            />
            <div
                ref={cursorRef}
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: propsRef.current.circleColor,
                    color: propsRef.current.textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    transform: "translate(-50%, -50%) scale(0)",
                    zIndex: 100,
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: 0.5,
                    boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
                    fontFamily: "inherit",
                    willChange: "transform, opacity",
                }}
            >
                {propsRef.current.text}
            </div>
        </div>
    )
}

StackedCarousel3D.defaultProps = {
    contentSettings: {
        mediaItems: [
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1549558549-415fe4c37b60?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1510519138131-17fc1e102f43?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1520085601670-ee14aa5fa3e8?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=800&auto=format&fit=crop",
                link: "",
            },
            {
                type: "image",
                image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&auto=format&fit=crop",
                link: "",
            },
        ],
        svgMask: "",
        visibleCount: 20,
        imageWidth: 420,
        imageHeight: 300,
        zSpacing: 100,
    },
    sceneSettings: {
        perspective: 45,
        cameraDistance: 900,
        viewAngleX: 50,
        viewAngleY: 0,
        posX: 0,
        posY: 0,
    },
    animationSettings: {
        livePreview: true,
        autoScrollSpeed: 0.3,
        scrollSpeed: 8,
        damping: 0.05,
        hoverGap: 0,
    },
    hoverCircleSettings: {
        circleColor: "#FF6A00",
        textColor: "#FFFFFF",
        text: "View",
    },
}

addPropertyControls(StackedCarousel3D, {
    contentSettings: {
        title: "Content",
        type: ControlType.Object,
        controls: {
            mediaItems: {
                title: "Media",
                type: ControlType.Array,
                control: {
                    type: ControlType.Object,
                    controls: {
                        type: {
                            type: ControlType.Enum,
                            options: ["image", "video"],
                            optionTitles: ["Image", "Video"],
                            defaultValue: "image",
                        },
                        image: {
                            type: ControlType.Image,
                            hidden(props) {
                                return props.type === "video"
                            },
                        },
                        video: {
                            title: "Upload Video",
                            type: ControlType.File,
                            allowedFileTypes: ["mp4", "webm"],
                            hidden(props) {
                                return props.type === "image"
                            },
                        },
                        link: {
                            title: "Link",
                            type: ControlType.Link,
                        },
                    },
                },
            },
            svgMask: {
                title: "Upload SVG",
                type: ControlType.File,
                allowedFileTypes: ["svg"],
            },
            visibleCount: {
                title: "Viewport Count",
                type: ControlType.Number,
                min: 3,
                max: 100,
                defaultValue: 20,
            },
            imageWidth: {
                title: "Width",
                type: ControlType.Number,
                min: 100,
                max: 2000,
                defaultValue: 420,
            },
            imageHeight: {
                title: "Height",
                type: ControlType.Number,
                min: 100,
                max: 2000,
                defaultValue: 300,
            },
            zSpacing: {
                title: "Z Spacing",
                type: ControlType.Number,
                min: 10,
                max: 500,
                defaultValue: 100,
            },
        },
    },
    sceneSettings: {
        title: "Scene",
        type: ControlType.Object,
        controls: {
            perspective: {
                title: "Perspective",
                type: ControlType.Number,
                min: 10,
                max: 120,
                defaultValue: 45,
            },
            cameraDistance: {
                title: "Cam Distance",
                type: ControlType.Number,
                min: 100,
                max: 3000,
                defaultValue: 900,
            },
            viewAngleX: {
                title: "View Angle X",
                type: ControlType.Number,
                min: -90,
                max: 90,
                defaultValue: 50,
            },
            viewAngleY: {
                title: "View Angle Y",
                type: ControlType.Number,
                min: -90,
                max: 90,
                defaultValue: 0,
            },
            posX: { title: "X", type: ControlType.Number, defaultValue: 0 },
            posY: { title: "Y", type: ControlType.Number, defaultValue: 0 },
        },
    },
    animationSettings: {
        title: "Animation",
        type: ControlType.Object,
        controls: {
            livePreview: {
                title: "Live Preview",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            autoScrollSpeed: {
                title: "Auto Scroll",
                type: ControlType.Number,
                min: -5,
                max: 5,
                step: 0.1,
                defaultValue: 0.3,
            },
            scrollSpeed: {
                title: "Scroll Speed",
                type: ControlType.Number,
                min: 0,
                max: 50,
                step: 0.1,
                defaultValue: 8,
            },
            damping: {
                title: "Damping",
                type: ControlType.Number,
                min: 0.01,
                max: 1,
                step: 0.01,
                defaultValue: 0.05,
            },
            hoverGap: {
                title: "Hover Gap",
                type: ControlType.Number,
                min: 0,
                max: 500,
                defaultValue: 0,
            },
        },
    },
    hoverCircleSettings: {
        title: "Hover Circle",
        type: ControlType.Object,
        controls: {
            text: {
                title: "Text",
                type: ControlType.String,
                defaultValue: "View",
            },
            circleColor: {
                title: "Background",
                type: ControlType.Color,
                defaultValue: "#FF6A00",
            },
            textColor: {
                title: "Text Color",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
        },
    },
})
