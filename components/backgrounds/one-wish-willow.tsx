import * as React from "react"
import { useState, useRef, useEffect } from "react"
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

// Built-in assets — the component renders fully out of the box.
// Legacy instances that set these via (now removed) property controls still win over defaults.
const DEFAULT_ASSETS = {
    frontImg:
        "https://framerusercontent.com/images/bJA97VXzHjWLT3fJenRunbJ7sw.png",
    backImg:
        "https://framerusercontent.com/images/7oM49B8ASUCcLan058djz90k.png",
    bottomImg:
        "https://framerusercontent.com/images/MICK05urwf32iI9v0TM27T7WOhw.png",
    capImg: "https://framerusercontent.com/images/sbVkfQTCTa45FoyEIiJ6p59do8.png",
    willowStl:
        "https://framerusercontent.com/assets/8iGwEYD5A6H2ISEnu3zlukM4.stl",
    breakSound:
        "https://framerusercontent.com/assets/9WKVkAeBUen5Wmv5c6M1ESyVU.mp3",
}

// --- Minimal STL parser (binary + ASCII) so we don't need a loader package ---
function parseSTL(buffer: ArrayBuffer): THREE.BufferGeometry {
    const isBinary = (() => {
        if (buffer.byteLength < 84) return false
        const view = new DataView(buffer)
        const nFaces = view.getUint32(80, true)
        if (84 + nFaces * 50 === buffer.byteLength) return true
        const head = new TextDecoder()
            .decode(new Uint8Array(buffer, 0, Math.min(5, buffer.byteLength)))
            .toLowerCase()
        return head !== "solid"
    })()

    const geo = new THREE.BufferGeometry()

    if (isBinary) {
        const view = new DataView(buffer)
        const nFaces = view.getUint32(80, true)
        const positions = new Float32Array(nFaces * 9)
        const normals = new Float32Array(nFaces * 9)
        for (let f = 0; f < nFaces; f++) {
            const off = 84 + f * 50
            const nx = view.getFloat32(off, true)
            const ny = view.getFloat32(off + 4, true)
            const nz = view.getFloat32(off + 8, true)
            for (let v = 0; v < 3; v++) {
                const vo = off + 12 + v * 12
                const i = f * 9 + v * 3
                positions[i] = view.getFloat32(vo, true)
                positions[i + 1] = view.getFloat32(vo + 4, true)
                positions[i + 2] = view.getFloat32(vo + 8, true)
                normals[i] = nx
                normals[i + 1] = ny
                normals[i + 2] = nz
            }
        }
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
        return geo
    }

    const text = new TextDecoder().decode(buffer)
    const positions: number[] = []
    const vertexRe = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g
    let m: RegExpExecArray | null
    while ((m = vertexRe.exec(text))) {
        positions.push(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]))
    }
    geo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(positions), 3)
    )
    geo.computeVertexNormals()
    return geo
}

async function loadSTL(url: string): Promise<THREE.BufferGeometry> {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return parseSTL(buf)
}

// Texture cover/contain/fill mapping for a face with a known aspect ratio
function applyFit(tex: THREE.Texture, geoAspect: number, fit: string) {
    const imgAspect =
        (tex.image as any).width / ((tex.image as any).height || 1)
    tex.matrixAutoUpdate = false
    if (fit === "cover") {
        if (imgAspect > geoAspect) {
            tex.repeat.set(geoAspect / imgAspect, 1)
            tex.offset.set((1 - geoAspect / imgAspect) / 2, 0)
        } else {
            tex.repeat.set(1, imgAspect / geoAspect)
            tex.offset.set(0, (1 - imgAspect / geoAspect) / 2)
        }
    } else if (fit === "contain") {
        if (imgAspect > geoAspect) {
            tex.repeat.set(1, geoAspect / imgAspect)
            tex.offset.set(0, (1 - geoAspect / imgAspect) / 2)
        } else {
            tex.repeat.set(imgAspect / geoAspect, 1)
            tex.offset.set((1 - imgAspect / geoAspect) / 2, 0)
        }
    } else {
        tex.repeat.set(1, 1)
        tex.offset.set(0, 0)
    }
    tex.updateMatrix()
}

const h = Math.sqrt(3) / 2

// --- Plain three.js scene (no react-three-fiber): renderer, scene graph,
// raycasting for clicks, hover cursor, camera rig, and the break animation.
function WillowScene({
    state,
    boxFit,
    boxScale,
    willowColor,
    stlSrc,
    frontSrc,
    backSrc,
    bottomSrc,
    capSrc,
    willowImgSrc,
    willowBreakImgSrc,
    onBoxClick,
    onBoxDoubleClick,
    onWillowClick,
}: any) {
    const containerRef = useRef<HTMLDivElement>(null)
    const stateRef = useRef(state)
    const handlersRef = useRef<any>({})

    useEffect(() => {
        stateRef.current = state
    }, [state])
    handlersRef.current = { onBoxClick, onBoxDoubleClick, onWillowClick }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let dead = false
        const disposables: Array<{ dispose?: () => void }> = []

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.localClippingEnabled = true
        // Match react-three-fiber's default look (softer highlights, tamer saturation)
        renderer.toneMapping = THREE.NoToneMapping
        // renderer.toneMappingExposure = 1
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        container.appendChild(renderer.domElement)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
        camera.position.set(2.1, 2.25, 3.9)

        scene.add(new THREE.AmbientLight(0xffffff, 0.85))
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.3)
        dirLight.position.set(10, 10, 5)
        scene.add(dirLight)

        const texLoader = new THREE.TextureLoader()

        // ---- Gift box: 3 rectangular faces + 2 triangular caps
        const boxGroup = new THREE.Group()
        scene.add(boxGroup)

        const addFace = (
            geo: THREE.BufferGeometry,
            pos: [number, number, number],
            rot: [number, number, number],
            src: string,
            geoAspect: number
        ) => {
            const mat = new THREE.MeshStandardMaterial({
                color: 0xcc0000,
                roughness: 0.6,
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.05,
            })
            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.set(pos[0], pos[1], pos[2])
            mesh.rotation.set(rot[0], rot[1], rot[2])
            boxGroup.add(mesh)
            disposables.push(geo, mat)
            if (src) {
                texLoader.load(src, (tex) => {
                    if (dead) return
                    tex.colorSpace = THREE.SRGBColorSpace
                    applyFit(tex, geoAspect, boxFit)
                    mat.map = tex
                    mat.color.set(0xffffff)
                    mat.needsUpdate = true
                    disposables.push(tex)
                })
            }
        }

        addFace(
            new THREE.PlaneGeometry(4, 1),
            [0, h / 6, 0.25],
            [-Math.PI / 6, 0, 0],
            frontSrc,
            4
        )
        addFace(
            new THREE.PlaneGeometry(4, 1),
            [0, h / 6, -0.25],
            [Math.PI / 6, Math.PI, 0],
            backSrc,
            4
        )
        addFace(
            new THREE.PlaneGeometry(4, 1),
            [0, -h / 3, 0],
            [Math.PI / 2, 0, 0],
            bottomSrc,
            4
        )
        addFace(
            new THREE.CircleGeometry(1 / Math.sqrt(3), 3, Math.PI / 2),
            [-2, 0, 0],
            [0, -Math.PI / 2, 0],
            capSrc,
            1
        )
        addFace(
            new THREE.CircleGeometry(1 / Math.sqrt(3), 3, Math.PI / 2),
            [2, 0, 0],
            [0, Math.PI / 2, 0],
            capSrc,
            1
        )

        // ---- Willow: STL model (or cylinder fallback), splits in two when broken
        const willowGroup = new THREE.Group()
        willowGroup.rotation.z = Math.PI / 2
        scene.add(willowGroup)

        const baseMatProps = {
            color: new THREE.Color(willowColor || "#5c4033"),
            transparent: true,
            alphaTest: 0.05,
            side: THREE.DoubleSide,
        }
        const intactMat = new THREE.MeshStandardMaterial(baseMatProps)
        const topMat = new THREE.MeshStandardMaterial(baseMatProps)
        const botMat = new THREE.MeshStandardMaterial(baseMatProps)

        const localClipTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
        const localClipBottom = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
        const clipTop = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
        const clipBottom = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

        const intactMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 3.5, 16),
            intactMat
        )
        const topHalf = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.75, 16),
            topMat
        )
        const bottomHalf = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 1.75, 16),
            botMat
        )
        topHalf.position.y = 0.875
        bottomHalf.position.y = -0.875
        willowGroup.add(intactMesh, topHalf, bottomHalf)
        disposables.push(
            intactMat,
            topMat,
            botMat,
            intactMesh.geometry,
            topHalf.geometry,
            bottomHalf.geometry
        )

        let usingStl = false
        if (stlSrc) {
            loadSTL(stlSrc)
                .then((geometry) => {
                    if (dead) return
                    geometry.center()
                    geometry.computeBoundingBox()
                    const size = new THREE.Vector3()
                    geometry.boundingBox!.getSize(size)
                    if (size.x > size.y && size.x > size.z) {
                        geometry.rotateZ(Math.PI / 2)
                    } else if (size.z > size.x && size.z > size.y) {
                        geometry.rotateX(Math.PI / 2)
                    }
                    geometry.computeBoundingBox()
                    geometry.boundingBox!.getSize(size)
                    const s = 3.5 / (size.y || 1)
                    geometry.scale(s, s, s)

                    usingStl = true
                    intactMesh.geometry = geometry
                    topHalf.geometry = geometry
                    bottomHalf.geometry = geometry
                    topHalf.position.set(0, 0, 0)
                    bottomHalf.position.set(0, 0, 0)
                    intactMat.map = null
                    intactMat.color.set(willowColor || "#5c4033")
                    topMat.map = null
                    topMat.color.set(willowColor || "#5c4033")
                    botMat.map = null
                    botMat.color.set(willowColor || "#5c4033")
                    topMat.clippingPlanes = [clipTop]
                    botMat.clippingPlanes = [clipBottom]
                    intactMat.needsUpdate = true
                    topMat.needsUpdate = true
                    botMat.needsUpdate = true
                    disposables.push(geometry)
                })
                .catch(() => {})
        }

        // Legacy texture props (from old instances) still supported on the cylinder fallback
        if (willowImgSrc) {
            texLoader.load(willowImgSrc, (tex) => {
                if (dead || usingStl) return
                tex.colorSpace = THREE.SRGBColorSpace
                intactMat.map = tex
                intactMat.color.set(0xffffff)
                intactMat.needsUpdate = true
                disposables.push(tex)
            })
        }
        const breakTexSrc = willowBreakImgSrc || willowImgSrc
        if (breakTexSrc) {
            texLoader.load(breakTexSrc, (texTop) => {
                if (dead || usingStl) return
                texTop.colorSpace = THREE.SRGBColorSpace
                texTop.matrixAutoUpdate = false
                texTop.repeat.set(1, 0.5)
                texTop.offset.set(0, 0.5)
                texTop.updateMatrix()
                topMat.map = texTop
                topMat.color.set(0xffffff)
                topMat.needsUpdate = true

                const texBottom = texTop.clone()
                texBottom.offset.set(0, 0)
                texBottom.updateMatrix()
                botMat.map = texBottom
                botMat.color.set(0xffffff)
                botMat.needsUpdate = true
                disposables.push(texTop, texBottom)
            })
        }

        // ---- Pointer interaction: raycast clicks, hover cursor, camera parallax
        const raycaster = new THREE.Raycaster()
        const ndc = new THREE.Vector2()
        const pointer = { x: 0, y: 0 }
        let downPos: { x: number; y: number } | null = null

        const setNdc = (ev: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect()
            ndc.x = ((ev.clientX - rect.left) / (rect.width || 1)) * 2 - 1
            ndc.y = -(((ev.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
        }

        const pick = (ev: MouseEvent, group: THREE.Object3D) => {
            setNdc(ev)
            raycaster.setFromCamera(ndc, camera)
            return raycaster.intersectObject(group, true).length > 0
        }

        const onPointerMove = (ev: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect()
            pointer.x = ((ev.clientX - rect.left) / (rect.width || 1)) * 2 - 1
            pointer.y = -(
                ((ev.clientY - rect.top) / (rect.height || 1)) * 2 -
                1
            )
            const st = stateRef.current
            const active =
                st === "opened" || st === "broken" ? willowGroup : boxGroup
            container.style.cursor = pick(ev, active) ? "pointer" : "auto"
        }

        const onPointerDown = (ev: PointerEvent) => {
            downPos = { x: ev.clientX, y: ev.clientY }
        }

        const onClick = (ev: MouseEvent) => {
            if (
                downPos &&
                Math.hypot(ev.clientX - downPos.x, ev.clientY - downPos.y) > 2
            )
                return // ignore drags
            const st = stateRef.current
            if (st === "initial" && pick(ev, boxGroup)) {
                handlersRef.current.onBoxClick?.()
            } else if (st === "opened" && pick(ev, willowGroup)) {
                handlersRef.current.onWillowClick?.()
            }
        }

        const onDblClick = (ev: MouseEvent) => {
            if (stateRef.current === "used" && pick(ev, boxGroup)) {
                handlersRef.current.onBoxDoubleClick?.()
            }
        }

        renderer.domElement.addEventListener("pointermove", onPointerMove)
        renderer.domElement.addEventListener("pointerdown", onPointerDown)
        renderer.domElement.addEventListener("click", onClick)
        renderer.domElement.addEventListener("dblclick", onDblClick)

        // ---- Sizing: explicit resize handling (this is what fiber failed to do)
        let responsiveScale = 1
        const resize = () => {
            const w = container.clientWidth || 1
            const ht = container.clientHeight || 1
            renderer.setSize(w, ht, false)
            camera.aspect = w / ht
            camera.updateProjectionMatrix()
            const dist = camera.position.length() || 5
            const viewH = 2 * Math.tan((45 * Math.PI) / 360) * dist
            const viewW = viewH * camera.aspect
            responsiveScale = Math.min(1, viewW / 4.5)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        // ---- Render loop
        let raf = 0
        const animate = () => {
            if (dead) return
            raf = requestAnimationFrame(animate)
            const st = stateRef.current

            const finalScale = (boxScale ?? 1) * responsiveScale
            boxGroup.scale.setScalar(finalScale)
            willowGroup.scale.setScalar(finalScale)

            boxGroup.visible = st === "initial" || st === "used"
            willowGroup.visible = st === "opened" || st === "broken"
            const broken = st === "broken"
            intactMesh.visible = !broken
            topHalf.visible = broken
            bottomHalf.visible = broken

            if (broken) {
                const startYTop = usingStl ? 0 : 0.875
                const startYBottom = usingStl ? 0 : -0.875
                topHalf.position.y = THREE.MathUtils.lerp(
                    topHalf.position.y,
                    startYTop + 1.5,
                    0.05
                )
                topHalf.position.x = THREE.MathUtils.lerp(
                    topHalf.position.x,
                    0.8,
                    0.05
                )
                topHalf.rotation.z = THREE.MathUtils.lerp(
                    topHalf.rotation.z,
                    0.6,
                    0.05
                )
                bottomHalf.position.y = THREE.MathUtils.lerp(
                    bottomHalf.position.y,
                    startYBottom - 1.5,
                    0.05
                )
                bottomHalf.position.x = THREE.MathUtils.lerp(
                    bottomHalf.position.x,
                    -0.8,
                    0.05
                )
                bottomHalf.rotation.z = THREE.MathUtils.lerp(
                    bottomHalf.rotation.z,
                    -0.6,
                    0.05
                )
                if (usingStl) {
                    topHalf.updateMatrixWorld(true)
                    bottomHalf.updateMatrixWorld(true)
                    clipTop
                        .copy(localClipTop)
                        .applyMatrix4(topHalf.matrixWorld)
                    clipBottom
                        .copy(localClipBottom)
                        .applyMatrix4(bottomHalf.matrixWorld)
                }
            }

            // Camera rig: gentle orbit following the pointer
            const radius = 5.0
            const baseTheta = 0.5
            const basePhi = 1.1
            const theta = baseTheta + pointer.x * Math.PI * 0.7
            let phi = basePhi - pointer.y * Math.PI * 0.3
            phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi))
            const tx = radius * Math.sin(phi) * Math.sin(theta)
            const ty = radius * Math.cos(phi)
            const tz = radius * Math.sin(phi) * Math.cos(theta)
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, tx, 0.05)
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, ty, 0.05)
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, tz, 0.05)
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)
        }
        animate()

        return () => {
            dead = true
            cancelAnimationFrame(raf)
            ro.disconnect()
            renderer.domElement.removeEventListener(
                "pointermove",
                onPointerMove
            )
            renderer.domElement.removeEventListener(
                "pointerdown",
                onPointerDown
            )
            renderer.domElement.removeEventListener("click", onClick)
            renderer.domElement.removeEventListener("dblclick", onDblClick)
            container.style.cursor = "auto"
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement)
            }
            disposables.forEach((d) => d.dispose && d.dispose())
            renderer.dispose()
        }
    }, [
        boxFit,
        boxScale,
        willowColor,
        stlSrc,
        frontSrc,
        backSrc,
        bottomSrc,
        capSrc,
        willowImgSrc,
        willowBreakImgSrc,
    ])

    return (
        <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0, overflow: "hidden" }}
        />
    )
}

/**
 * One Wish Willow
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OneWishWillow(props: any) {
    const {
        frontImg,
        backImg,
        bottomImg,
        capImg,
        boxFit,
        willowImg,
        willowStl,
        willowBreakImg,
        willowColor,
        breakSound,
        boxScale,
        overlayFont,
        overlayColor,
        bgColor,
    } = props
    const [state, setState] = useState<
        "initial" | "opened" | "broken" | "used"
    >("initial")
    const [showUsedText, setShowUsedText] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    // True on the Framer canvas and during static export — skip WebGL/animations there
    const isStatic = useIsStaticRenderer()

    // Built-in assets; legacy instance values (from removed controls) still take priority
    const frontSrc = frontImg?.src || DEFAULT_ASSETS.frontImg
    const backSrc = backImg?.src || DEFAULT_ASSETS.backImg
    const bottomSrc = bottomImg?.src || DEFAULT_ASSETS.bottomImg
    const capSrc = capImg?.src || DEFAULT_ASSETS.capImg
    const stlSrc = willowStl || DEFAULT_ASSETS.willowStl
    const soundSrc = breakSound || DEFAULT_ASSETS.breakSound

    const handleBoxClick = () => {
        if (state === "initial") setState("opened")
    }

    const handleBoxDoubleClick = () => {
        if (state === "used") setShowUsedText(true)
    }

    const handleWillowClick = () => {
        if (state !== "opened") return
        setState("broken")

        if (audioRef.current && soundSrc) {
            audioRef.current.currentTime = 0
            audioRef.current
                .play()
                .catch((err) => console.log("Audio play prevented:", err))
        }

        setTimeout(() => {
            setState("used")
            setShowUsedText(false)
        }, 2500)
    }

    const showClickToOpen = state === "initial"
    const showMakeWish = state === "opened"
    const showOneWish = state === "used" && showUsedText

    const plainTextStyle = (isVisible: boolean): React.CSSProperties => ({
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: `translateX(-50%) ${isVisible ? "translateY(0)" : "translateY(-15px)"}`,
        opacity: isVisible ? 1 : 0,
        transition: isStatic
            ? "none"
            : "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        color: "#000000",
        fontSize: "0.85em",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        zIndex: 10,
        ...overlayFont,
        fontWeight: "normal",
    })

    // Static context (canvas / export): no WebGL, no animation loop, no audio —
    // just a flat preview of the box with the intro text.
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    backgroundColor: bgColor,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "18%",
                    }}
                >
                    <img
                        src={frontSrc}
                        alt="One Wish Willow gift box"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            transform: "perspective(600px) rotateX(12deg)",
                        }}
                    />
                </div>
                <div style={plainTextStyle(true)}>Click the box to open ;)</div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: bgColor,
                overflow: "hidden",
            }}
        >
            {soundSrc && <audio ref={audioRef} src={soundSrc} preload="auto" />}

            <WillowScene
                state={state}
                boxFit={boxFit}
                boxScale={boxScale ?? 1}
                willowColor={willowColor}
                stlSrc={stlSrc}
                frontSrc={frontSrc}
                backSrc={backSrc}
                bottomSrc={bottomSrc}
                capSrc={capSrc}
                willowImgSrc={willowImg?.src}
                willowBreakImgSrc={willowBreakImg?.src}
                onBoxClick={handleBoxClick}
                onBoxDoubleClick={handleBoxDoubleClick}
                onWillowClick={handleWillowClick}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                <div style={plainTextStyle(showClickToOpen)}>
                    Click the box to open ;)
                </div>
                <div style={plainTextStyle(showMakeWish)}>
                    Make a wish and break the willow
                </div>
                <div style={plainTextStyle(showOneWish)}>
                    You only get one wish
                </div>
            </div>
        </div>
    )
}

addPropertyControls(OneWishWillow, {
    frontImg: { type: ControlType.ResponsiveImage, title: "Front Image" },
    backImg: { type: ControlType.ResponsiveImage, title: "Back Image" },
    bottomImg: { type: ControlType.ResponsiveImage, title: "Bottom Image" },
    capImg: { type: ControlType.ResponsiveImage, title: "Cap Image" },
    willowImg: { type: ControlType.ResponsiveImage, title: "Willow Image" },
    willowBreakImg: { type: ControlType.ResponsiveImage, title: "Broken Willow" },
    boxFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["fill", "cover", "contain"],
        optionTitles: ["Fill", "Cover", "Contain"],
        defaultValue: "contain",
    },
    willowColor: {
        type: ControlType.Color,
        title: "Willow Color",
        defaultValue: "#5c4033",
    },
    boxScale: {
        type: ControlType.Number,
        title: "Box Scale",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255, 255, 255, 0)",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#cc0000",
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Overlay Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            textAlign: "center",
            variant: "Bold",
            lineHeight: "1.2em",
        },
    },
})
