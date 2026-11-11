import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import * as CANNON from "cannon-es"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultImages = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
    },
]

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function PhysicsHero(props) {
    const {
        cubeCount,
        cubeSize,
        gravity,
        bounciness,
        images,
        tintColor,
        pushStrength,
        pushRadius,
        staggerDelay = 150,
        initialDropSpeed = 5,
    } = props

    const canvasRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const [isInViewport, setIsInViewport] = useState(false)
    // Use ref to track current viewport state for animate function
    const isInViewportRef = useRef(false)

    // Keep ref in sync with state
    useEffect(() => {
        isInViewportRef.current = isInViewport
    }, [isInViewport])

    // --- IMAGE PRE-PROCESSING ---
    let finalImages = images
    if (
        !finalImages ||
        !Array.isArray(finalImages) ||
        finalImages.length === 0
    ) {
        finalImages = defaultImages
    } else {
        finalImages = finalImages.map((img, i) => {
            const src = img?.src?.src || img?.src || img
            return { src: src || defaultImages[i % defaultImages.length].src }
        })
    }

    // --- VIEWPORT GATING (Intersection Observer) ---
    useEffect(() => {
        if (isStatic || !canvasRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsInViewport(entry.isIntersecting),
            { threshold: 0.1 }
        )

        observer.observe(canvasRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        // 1. SKIP INITIALIZATION FOR STATIC RENDERER OR WHEN OUT OF VIEWPORT
        if (isStatic || !canvasRef.current || !isInViewport) return

        const container = canvasRef.current
        let width = container.clientWidth
        let height = container.clientHeight
        if (width === 0 || height === 0) return

        // --- THREE.JS SETUP ---
        const scene = new THREE.Scene()
        const frustumSize = 10
        let aspect = width / height
        const camera = new THREE.OrthographicCamera(
            (frustumSize * aspect) / -2,
            (frustumSize * aspect) / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        )
        camera.position.z = 10

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)

        // --- PHYSICS WORLD ---
        const world = new CANNON.World({
            gravity: new CANNON.Vec3(0, gravity * -1, 0),
            allowSleep: true,
        })

        const cubeMat = new CANNON.Material("cubeMat")
        const wallMat = new CANNON.Material("wallMat")
        world.addContactMaterial(
            new CANNON.ContactMaterial(cubeMat, wallMat, {
                friction: 0.5,
                restitution: bounciness,
            })
        )

        let walls = []
        const wallThickness = 10
        const updateWalls = () => {
            walls.forEach((w) => world.removeBody(w))
            walls = []
            const viewW =
                frustumSize * (container.clientWidth / container.clientHeight)
            const viewH = frustumSize
            const configs = [
                {
                    w: viewW * 2,
                    h: wallThickness,
                    x: 0,
                    y: -viewH / 2 - wallThickness / 2,
                },
                {
                    w: viewW * 2,
                    h: wallThickness,
                    x: 0,
                    y: viewH / 2 + wallThickness / 2,
                },
                {
                    w: wallThickness,
                    h: viewH * 2,
                    x: -viewW / 2 - wallThickness / 2,
                    y: 0,
                },
                {
                    w: wallThickness,
                    h: viewH * 2,
                    x: viewW / 2 + wallThickness / 2,
                    y: 0,
                },
            ]
            configs.forEach((cfg) => {
                const body = new CANNON.Body({
                    type: CANNON.Body.STATIC,
                    shape: new CANNON.Box(
                        new CANNON.Vec3(cfg.w / 2, cfg.h / 2, 5)
                    ),
                })
                body.position.set(cfg.x, cfg.y, 0)
                world.addBody(body)
                walls.push(body)
            })
        }
        updateWalls()

        const handleResize = () => {
            const w = container.clientWidth
            const h = container.clientHeight
            if (w === 0 || h === 0) return
            camera.left = (frustumSize * (w / h)) / -2
            camera.right = (frustumSize * (w / h)) / 2
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
            updateWalls()
        }
        window.addEventListener("resize", handleResize)

        // --- LOADER WITH ERROR HANDLING ---
        const cubes = []
        const timeouts = []
        const loader = new THREE.TextureLoader()
        let frameId: number

        const texturePromises = finalImages.map((img) => {
            return new Promise((resolve) => {
                loader.load(
                    img.src,
                    (tex) => {
                        tex.colorSpace = THREE.SRGBColorSpace
                        resolve(tex)
                    },
                    undefined,
                    () => {
                        // RECOVER: If image fails, load a solid color placeholder or default
                        loader.load(defaultImages[0].src, (fallback) =>
                            resolve(fallback)
                        )
                    }
                )
            })
        })

        Promise.all(texturePromises).then((loadedTextures) => {
            const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
            for (let i = 0; i < cubeCount; i++) {
                const timer = setTimeout(() => {
                    const tex = loadedTextures[
                        i % loadedTextures.length
                    ] as THREE.Texture
                    const meshMat = new THREE.MeshStandardMaterial({
                        map: tex,
                        color: tintColor,
                        roughness: 0.8,
                        emissive: new THREE.Color(tintColor),
                        emissiveMap: tex,
                        emissiveIntensity: 0.15,
                    })
                    const mesh = new THREE.Mesh(geometry, meshMat)
                    scene.add(mesh)

                    const body = new CANNON.Body({
                        mass: 1.5,
                        shape: new CANNON.Box(
                            new CANNON.Vec3(
                                cubeSize / 2,
                                cubeSize / 2,
                                cubeSize / 2
                            )
                        ),
                        position: new CANNON.Vec3(
                            (Math.random() - 0.5) * 5,
                            6,
                            0
                        ),
                        velocity: new CANNON.Vec3(0, -initialDropSpeed, 0),
                        material: cubeMat,
                        linearDamping: 0.2,
                        angularDamping: 0.5,
                    })
                    body.quaternion.setFromEuler(
                        Math.random(),
                        Math.random(),
                        Math.random()
                    )
                    world.addBody(body)
                    cubes.push({ mesh, body })
                }, i * staggerDelay)
                timeouts.push(timer)
            }

            scene.add(new THREE.AmbientLight(0xffffff, 2.0))
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
            dirLight.position.set(5, 10, 7)
            scene.add(dirLight)
            animate()
        })

        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            const mX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1
            const mY =
                -((e.clientY - rect.top) / container.clientHeight) * 2 + 1
            const vector = new THREE.Vector3(mX, mY, 0).unproject(camera)
            cubes.forEach((c) => {
                const dist = Math.sqrt(
                    Math.pow(vector.x - c.body.position.x, 2) +
                        Math.pow(vector.y - c.body.position.y, 2)
                )
                if (dist < pushRadius) {
                    c.body.wakeUp()
                    const force = new CANNON.Vec3(
                        c.body.position.x - vector.x,
                        c.body.position.y - vector.y,
                        0
                    )
                    force.normalize()
                    c.body.applyImpulse(
                        force.scale(pushStrength / 15),
                        c.body.position
                    )
                }
            })
        }
        container.addEventListener("mousemove", onMouseMove)

        // --- ANIMATION LOOP WITH VIEWPORT CHECKING ---
        const animate = () => {
            // CRITICAL: Check if still in viewport on each frame
            // If not, stop the animation loop to prevent memory leak
            if (!isInViewportRef.current) {
                return
            }

            world.step(1 / 60)
            cubes.forEach((c) => {
                c.body.position.z = 0
                c.body.velocity.z = 0
                c.mesh.position.copy(c.body.position)
                c.mesh.quaternion.copy(c.body.quaternion)
            })
            renderer.render(scene, camera)
            frameId = requestAnimationFrame(animate)
        }

        return () => {
            cancelAnimationFrame(frameId)
            timeouts.forEach((t) => clearTimeout(t))
            window.removeEventListener("resize", handleResize)
            container.removeEventListener("mousemove", onMouseMove)
            renderer.dispose()
            if (container.contains(renderer.domElement))
                container.removeChild(renderer.domElement)
        }
    }, [
        cubeCount,
        cubeSize,
        gravity,
        bounciness,
        finalImages,
        tintColor,
        pushStrength,
        pushRadius,
        isInViewport,
        isStatic,
        staggerDelay,
        initialDropSpeed,
    ])

    // --- STATIC FALLBACK ---
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#eee",
                    color: "#666",
                    fontSize: "12px",
                }}
            >
                Physics Hero (Preview)
            </div>
        )
    }

    return (
        <div
            ref={canvasRef}
            style={{ width: "100%", height: "100%", overflow: "hidden" }}
        />
    )
}

addPropertyControls(PhysicsHero, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: defaultImages,
    },
    cubeCount: { type: ControlType.Number, min: 1, max: 40, defaultValue: 10 },
    cubeSize: {
        type: ControlType.Number,
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1.6,
    },
    staggerDelay: {
        type: ControlType.Number,
        min: 0,
        max: 1000,
        defaultValue: 150,
        unit: "ms",
    },
    initialDropSpeed: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        defaultValue: 5,
    },
    pushStrength: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        defaultValue: 25,
    },
    pushRadius: {
        type: ControlType.Number,
        min: 0.5,
        max: 10,
        step: 0.1,
        defaultValue: 2.0,
    },
    gravity: { type: ControlType.Number, min: 0, max: 100, defaultValue: 30 },
    bounciness: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.2,
    },
    tintColor: { type: ControlType.Color, defaultValue: "#ffffff" },
})
