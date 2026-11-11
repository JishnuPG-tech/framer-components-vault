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

interface Props {
    particleCount: number
    particleSize: number
    explosionForce: number
    gravity: number
    autoLaunch: boolean
    launchInterval: number
    showStarfield: boolean
    backgroundColor: string
}

export default function FireworksBackground(props: Props) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const width = rect.width || 800
        const height = rect.height || 600

        let animationId: number
        const fireworks: any[] = []
        let lastLaunchTime = 0
        let nextLaunchDelay = 0

        // --- SPRITE GENERATOR ---
        function getSprite() {
            const canvas = document.createElement("canvas")
            canvas.width = 32
            canvas.height = 32
            const context = canvas.getContext("2d")!
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
            gradient.addColorStop(0, "rgba(255,255,255,1)")
            gradient.addColorStop(0.3, "rgba(255,255,255,0.9)")
            gradient.addColorStop(0.5, "rgba(255,255,255,0.5)")
            gradient.addColorStop(1, "rgba(0,0,0,0)")
            context.fillStyle = gradient
            context.fillRect(0, 0, 32, 32)
            return new THREE.CanvasTexture(canvas)
        }
        const particleSprite = getSprite()

        // --- SCENE ---
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(props.backgroundColor)
        scene.fog = new THREE.FogExp2(0x000000, 0.002)

        const camera = new THREE.PerspectiveCamera(
            60,
            width / height,
            0.1,
            4000
        )
        camera.position.set(0, 0, 150)

        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            preserveDrawingBuffer: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
        renderer.domElement.style.display = "block"
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"

        containerRef.current.appendChild(renderer.domElement)

        // --- BACKGROUND STARS ---
        let starsGeo: THREE.BufferGeometry | null = null
        let starsMat: THREE.PointsMaterial | null = null
        let starsPoints: THREE.Points | null = null

        if (props.showStarfield) {
            starsGeo = new THREE.BufferGeometry()
            const starsCnt = 3000
            const sPos = new Float32Array(starsCnt * 3)
            for (let i = 0; i < starsCnt * 3; i++)
                sPos[i] = (Math.random() - 0.5) * 1200
            starsGeo.setAttribute(
                "position",
                new THREE.BufferAttribute(sPos, 3)
            )
            starsMat = new THREE.PointsMaterial({
                size: 1.5,
                color: 0x888888,
                map: particleSprite,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
            starsPoints = new THREE.Points(starsGeo, starsMat)
            scene.add(starsPoints)
        }

        // --- FIREWORK CLASS ---
        class Firework {
            isDead = false
            phase = "rocket"
            timer = 0
            colors: any[] = []
            pos: any
            vel: any
            targetY: number
            rocketMesh: any
            sparkSystem: any = null
            currentParticleCount = 0
            baseColors: Float32Array = new Float32Array()
            velocities: Float32Array = new Float32Array()
            lifetimes: Float32Array = new Float32Array()

            constructor(startX: number, viewportHeight: number) {
                const rand = Math.random()
                const baseHue = Math.random()

                if (rand < 0.33) {
                    this.colors.push(
                        new THREE.Color().setHSL(baseHue, 1.0, 0.6)
                    )
                } else if (rand < 0.66) {
                    this.colors.push(
                        new THREE.Color().setHSL(baseHue, 1.0, 0.6)
                    )
                    this.colors.push(
                        new THREE.Color().setHSL(
                            (baseHue + 0.5) % 1.0,
                            1.0,
                            0.5
                        )
                    )
                } else {
                    this.colors.push(
                        new THREE.Color().setHSL(baseHue, 1.0, 0.6)
                    )
                    this.colors.push(
                        new THREE.Color().setHSL(
                            (baseHue + 0.33) % 1.0,
                            1.0,
                            0.6
                        )
                    )
                    this.colors.push(
                        new THREE.Color().setHSL(
                            (baseHue + 0.66) % 1.0,
                            1.0,
                            0.6
                        )
                    )
                }

                const startY = -80
                const randomHeight = -20 + Math.random() * 80
                this.targetY = randomHeight

                this.pos = new THREE.Vector3(
                    startX,
                    startY,
                    (Math.random() - 0.5) * 50
                )
                this.vel = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    1.0 * (0.9 + Math.random() * 0.3),
                    (Math.random() - 0.5) * 0.5
                )

                const geo = new THREE.BufferGeometry()
                geo.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(this.pos.toArray(), 3)
                )
                this.rocketMesh = new THREE.Points(
                    geo,
                    new THREE.PointsMaterial({
                        size: 2.0,
                        color: this.colors[0],
                        map: particleSprite,
                        transparent: true,
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                    })
                )
                scene.add(this.rocketMesh)
            }

            update(dt: number) {
                if (this.sparkSystem)
                    this.sparkSystem.material.size = props.particleSize
                if (this.rocketMesh) this.rocketMesh.material.size = 2.0

                if (this.phase === "rocket") {
                    this.pos.add(this.vel)
                    this.vel.y *= 0.99
                    this.rocketMesh.geometry.attributes.position.setXYZ(
                        0,
                        this.pos.x,
                        this.pos.y,
                        this.pos.z
                    )
                    this.rocketMesh.geometry.attributes.position.needsUpdate =
                        true
                    if (this.vel.y < 0.2 || this.pos.y >= this.targetY)
                        this.explode()
                } else {
                    this.timer += dt
                    const positions =
                        this.sparkSystem.geometry.attributes.position.array
                    const colors =
                        this.sparkSystem.geometry.attributes.color.array
                    let aliveCount = 0
                    const isHovering = this.timer < 1.5
                    const gravityFactor = THREE.MathUtils.smoothstep(
                        this.timer,
                        1.5,
                        2.0
                    )

                    for (let i = 0; i < this.currentParticleCount; i++) {
                        if (this.lifetimes[i] > 0) {
                            aliveCount++
                            const i3 = i * 3
                            positions[i3] += this.velocities[i3]
                            positions[i3 + 1] += this.velocities[i3 + 1]
                            positions[i3 + 2] += this.velocities[i3 + 2]

                            if (isHovering) {
                                this.velocities[i3] *= 0.95494
                                this.velocities[i3 + 1] *= 0.95494
                                this.velocities[i3 + 2] *= 0.95494
                            } else {
                                this.velocities[i3 + 1] -=
                                    props.gravity * gravityFactor
                                this.velocities[i3] *= 0.98
                                this.velocities[i3 + 1] *= 0.98
                                this.velocities[i3 + 2] *= 0.98
                                this.lifetimes[i] -= 0.00482
                            }

                            const alpha = Math.max(0, this.lifetimes[i])
                            colors[i3] = this.baseColors[i3] * alpha * 1.5
                            colors[i3 + 1] =
                                this.baseColors[i3 + 1] * alpha * 1.5
                            colors[i3 + 2] =
                                this.baseColors[i3 + 2] * alpha * 1.5
                        }
                    }
                    this.sparkSystem.geometry.attributes.position.needsUpdate =
                        true
                    this.sparkSystem.geometry.attributes.color.needsUpdate =
                        true
                    if (aliveCount === 0) this.cleanup()
                }
            }

            explode() {
                scene.remove(this.rocketMesh)
                this.phase = "explode"
                this.timer = 0
                this.currentParticleCount = props.particleCount

                const geo = new THREE.BufferGeometry()
                const positions = new Float32Array(
                    this.currentParticleCount * 3
                )
                const colors = new Float32Array(this.currentParticleCount * 3)
                this.baseColors = new Float32Array(
                    this.currentParticleCount * 3
                )
                this.velocities = new Float32Array(
                    this.currentParticleCount * 3
                )
                this.lifetimes = new Float32Array(this.currentParticleCount)

                const baseSpeed =
                    props.explosionForce * (0.8 + Math.random() * 0.4)

                for (let i = 0; i < this.currentParticleCount; i++) {
                    const i3 = i * 3
                    positions[i3] = this.pos.x
                    positions[i3 + 1] = this.pos.y
                    positions[i3 + 2] = this.pos.z

                    const theta = Math.random() * Math.PI * 2
                    const phi = Math.acos(2 * Math.random() - 1)
                    const speed = baseSpeed * (0.8 + Math.random() * 0.4)

                    this.velocities[i3] =
                        speed * Math.sin(phi) * Math.cos(theta)
                    this.velocities[i3 + 1] =
                        speed * Math.sin(phi) * Math.sin(theta)
                    this.velocities[i3 + 2] = speed * Math.cos(phi)

                    const targetColor =
                        this.colors[
                            Math.floor(Math.random() * this.colors.length)
                        ]
                    const brightness = 0.5 + Math.random() * 0.8

                    this.baseColors[i3] = targetColor.r * brightness
                    this.baseColors[i3 + 1] = targetColor.g * brightness
                    this.baseColors[i3 + 2] = targetColor.b * brightness

                    colors[i3] = this.baseColors[i3]
                    colors[i3 + 1] = this.baseColors[i3 + 1]
                    colors[i3 + 2] = this.baseColors[i3 + 2]

                    this.lifetimes[i] = 1.0
                }

                geo.setAttribute(
                    "position",
                    new THREE.BufferAttribute(positions, 3)
                )
                geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

                this.sparkSystem = new THREE.Points(
                    geo,
                    new THREE.PointsMaterial({
                        size: props.particleSize,
                        map: particleSprite,
                        transparent: true,
                        depthWrite: false,
                        vertexColors: true,
                        blending: THREE.AdditiveBlending,
                    })
                )
                scene.add(this.sparkSystem)
            }

            cleanup() {
                this.isDead = true
                if (this.sparkSystem) {
                    scene.remove(this.sparkSystem)
                    this.sparkSystem.geometry.dispose()
                    this.sparkSystem.material.dispose()
                }
                if (this.rocketMesh) {
                    scene.remove(this.rocketMesh)
                    this.rocketMesh.geometry.dispose()
                    this.rocketMesh.material.dispose()
                }
            }
        }

        function launchFirework() {
            const x = (Math.random() - 0.5) * 150
            fireworks.push(new Firework(x, height))
        }

        function updateQueue(time: number) {
            if (!props.autoLaunch) return
            if (time - lastLaunchTime > nextLaunchDelay) {
                lastLaunchTime = time
                nextLaunchDelay = props.launchInterval + Math.random() * 1000
                launchFirework()
            }
        }

        const clock = new THREE.Clock()

        function animate() {
            animationId = requestAnimationFrame(animate)
            const dt = clock.getDelta()
            updateQueue(performance.now())
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const fw = fireworks[i]
                fw.update(dt)
                if (fw.isDead) fireworks.splice(i, 1)
            }
            renderer.render(scene, camera)
        }

        const handleResize = () => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const newWidth = rect.width
            const newHeight = rect.height

            camera.aspect = newWidth / newHeight
            camera.updateProjectionMatrix()
            renderer.setSize(newWidth, newHeight)
        }

        window.addEventListener("resize", handleResize)

        launchFirework()
        animate()

        return () => {
            window.removeEventListener("resize", handleResize)
            if (animationId) cancelAnimationFrame(animationId)
            fireworks.forEach((fw: any) => fw.cleanup())
            if (starsGeo) starsGeo.dispose()
            if (starsMat) starsMat.dispose()
            if (starsPoints) scene.remove(starsPoints)
            particleSprite.dispose()
            renderer.dispose()
            if (
                containerRef.current &&
                containerRef.current.contains(renderer.domElement)
            ) {
                containerRef.current.removeChild(renderer.domElement)
            }
        }
    }, [props])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: props.backgroundColor,
            }}
        />
    )
}

addPropertyControls(FireworksBackground, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    showStarfield: {
        type: ControlType.Boolean,
        title: "Show Starfield",
        defaultValue: true,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        min: 1000,
        max: 30000,
        step: 100,
        defaultValue: 23000,
        displayStepper: true,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        min: 0.1,
        max: 2.0,
        step: 0.1,
        defaultValue: 0.8,
        displayStepper: true,
    },
    explosionForce: {
        type: ControlType.Number,
        title: "Explosion Force",
        min: 0.5,
        max: 5.0,
        step: 0.1,
        defaultValue: 1.5,
        displayStepper: true,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        min: 0.0,
        max: 0.02,
        step: 0.0001,
        defaultValue: 0.00265,
        displayStepper: true,
    },
    autoLaunch: {
        type: ControlType.Boolean,
        title: "Auto Launch",
        defaultValue: true,
    },
    launchInterval: {
        type: ControlType.Number,
        title: "Launch Interval (ms)",
        min: 500,
        max: 10000,
        step: 100,
        defaultValue: 3856,
        displayStepper: true,
        hidden: (props) => !props.autoLaunch,
    },
})
