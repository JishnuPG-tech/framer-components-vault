import * as React from "react"

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

type ShapeType = "sphere" | "circle" | "roundedCube" | "diamond" | "hex"

type ShellStyle = "glass" | "metal"

interface Viscous3DOrbProps {
    // SHAPE

    shapeType: ShapeType

    // COLORS & MOTION

    baseColor: string

    lightAColor: string

    lightBColor: string

    rotationSpeed: number

    waveCount: number

    showBackground: "yes" | "no"

    backgroundColor: string

    // SHELL

    showShell: "yes" | "no"

    shellColor: string

    shellOpacity: number

    shellDistance: number

    shellStyle: ShellStyle

    glowStrength: number
}

/**

 * Made by StyloKit

 *

 * @framerDisableUnlink

 * @framerSupportedLayoutWidth any-prefer-fixed

 * @framerSupportedLayoutHeight any-prefer-fixed

 * @framerIntrinsicWidth 128

 * @framerIntrinsicHeight 128

 */

export default function Viscous3DOrb(props: Viscous3DOrbProps) {
    const {
        shapeType,

        baseColor,

        lightAColor,

        lightBColor,

        rotationSpeed,

        waveCount,

        showBackground,

        backgroundColor,

        showShell,

        shellColor,

        shellOpacity,

        shellDistance,

        shellStyle,

        glowStrength,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const container = containerRef.current

        if (!container) return

        // ---- SIZE: square + ~32px margin ----

        const computeSize = () => {
            const cw = container.clientWidth || window.innerWidth

            const ch = container.clientHeight || window.innerHeight

            const size = Math.max(Math.min(cw, ch) - 32, 64)

            return size
        }

        let size = computeSize()

        // ---- COLORS FROM PROPS ----

        const baseClr = new THREE.Color(baseColor || "#ffffff")

        const lightAClr = new THREE.Color(lightAColor || "#4488ff")

        const lightBClr = new THREE.Color(lightBColor || "#ff4488")

        const shellClr = new THREE.Color(shellColor || "#ffffff")

        const rotSpeed = typeof rotationSpeed === "number" ? rotationSpeed : 1

        const waves = Math.max(1, Math.round(waveCount || 1))

        const waveFrequency = 4 + waves * 4

        const shellEnabled = showShell === "yes"

        const glow = THREE.MathUtils.clamp(glowStrength ?? 0.5, 0, 1)

        // ---- SCENE / CAMERA / RENDERER ----

        const scene = new THREE.Scene()

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)

        camera.position.set(0, 0, 9)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,

            alpha: true,
        })

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))

        renderer.setSize(size, size)

        const canvas = renderer.domElement

        canvas.style.position = "absolute"

        canvas.style.top = "50%"

        canvas.style.left = "50%"

        canvas.style.transform = "translate(-50%, -50%)"

        canvas.style.width = `${size}px`

        canvas.style.height = `${size}px`

        canvas.style.display = "block"

        canvas.style.pointerEvents = "auto"

        container.appendChild(canvas)

        // ---- LIGHTS ----

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.25)

        scene.add(ambientLight)

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)

        dirLight.position.set(-5, 10, 5)

        scene.add(dirLight)

        const blueLight = new THREE.PointLight(lightAClr, 3.5, 20)

        blueLight.position.set(5, -2, -5)

        scene.add(blueLight)

        const pinkLight = new THREE.PointLight(lightBClr, 3.5, 20)

        pinkLight.position.set(-5, -2, -5)

        scene.add(pinkLight)

        // ---- INNER VISCOUS ORB ----

        const baseRadius = 1.3

        const innerGeometry = new THREE.SphereGeometry(baseRadius, 128, 128)

        const innerPositionAttr = innerGeometry.getAttribute(
            "position"
        ) as THREE.BufferAttribute

        const originalPositions = (
            innerPositionAttr.array as Float32Array
        ).slice()

        // STATIC OFFSETS: classic viscous noise

        const staticOffsets = new Float32Array(innerPositionAttr.count)

        for (let i = 0; i < innerPositionAttr.count; i++) {
            const px = originalPositions[i * 3]

            const py = originalPositions[i * 3 + 1]

            const pz = originalPositions[i * 3 + 2]

            const n1 = Math.sin(px * 2.3 + py * 1.7 + pz * 3.1)

            const n2 = Math.sin(px * 4.1 - pz * 2.2)

            const n3 = Math.cos(py * 3.7 + pz * 1.9)

            const noise = (n1 + n2 + n3) / 3

            staticOffsets[i] = noise * 0.22
        }

        // Emissive дээр lights-ийн өнгө хүчтэй орж ирнэ

        const emissiveColor = lightAClr

            .clone()

            .add(lightBClr)

            .multiplyScalar(0.25)

            .add(baseClr.clone().multiplyScalar(0.1))

        const innerMaterial = new THREE.MeshStandardMaterial({
            color: baseClr,

            roughness: 0.8,

            metalness: 0.1,

            emissive: emissiveColor,

            emissiveIntensity: 1.0,

            side: THREE.DoubleSide,
        })

        const liquidBlob = new THREE.Mesh(innerGeometry, innerMaterial)

        // ---- OUTER SHELL ----

        const outerGeometry = new THREE.SphereGeometry(baseRadius, 128, 128)

        const outerPositionAttr = outerGeometry.getAttribute(
            "position"
        ) as THREE.BufferAttribute

        const opCtrl = THREE.MathUtils.clamp(shellOpacity ?? 0.35, 0, 1)

        const shellDist = THREE.MathUtils.clamp(shellDistance ?? 0.25, 0, 1.0)

        const baseOpacity = opCtrl // шууд slider-ийн утга

        let shellMaterial:
            | THREE.MeshPhysicalMaterial
            | THREE.MeshStandardMaterial

        if (shellStyle === "glass") {
            // Glass – илүү зөөлөн шил, glow нь emissive дээр

            shellMaterial = new THREE.MeshPhysicalMaterial({
                color: shellClr,

                transparent: true,

                opacity: baseOpacity,

                transmission: 0.6 + glow * 0.3,

                thickness: 1.4,

                roughness: 0.08 + (1 - glow) * 0.1,

                metalness: 0.1,

                clearcoat: 1.0,

                clearcoatRoughness: 0.15,

                emissive: shellClr.clone().multiplyScalar(0.3 * glow),

                emissiveIntensity: 0.5 + glow * 1.2,

                side: THREE.DoubleSide,
            })
        } else {
            // Metal – металл мэдрэмжтэй, glow нь emissive дээр хүчтэй

            shellMaterial = new THREE.MeshStandardMaterial({
                color: shellClr,

                transparent: true,

                opacity: baseOpacity,

                roughness: 0.2 + (1 - glow) * 0.2,

                metalness: 0.9,

                emissive: shellClr.clone().multiplyScalar(0.25 * glow),

                emissiveIntensity: 0.7 + glow * 1.3,

                side: THREE.DoubleSide,
            })
        }

        const glassShell = new THREE.Mesh(outerGeometry, shellMaterial)

        // ---- GROUP ----

        const group = new THREE.Group()

        group.add(liquidBlob)

        if (shellEnabled) {
            group.add(glassShell)
        }

        scene.add(group)

        // ---- DRAG 3D VIEW ----

        let isDragging = false

        let pointerIsDown = false

        let lastX = 0

        let lastY = 0

        const onPointerUpInternal = () => {
            pointerIsDown = false

            isDragging = false
        }

        // ---- WAVE IMPACT STATE (mouse click-ээс) ----

        const impactDir = new THREE.Vector3(1, 0, 0) // ЛОКАЛ чиглэл

        let impactTime = -1000

        let waveActive = false

        let waveFactor = 0 // smooth amplitude

        const ray = new THREE.Ray()

        const sphere = new THREE.Sphere(
            new THREE.Vector3(0, 0, 0),

            baseRadius * 1.4
        )

        const hitPoint = new THREE.Vector3()

        const localHit = new THREE.Vector3()

        const localDir = new THREE.Vector3()

        const worldNormal = new THREE.Vector3()

        const camDir = new THREE.Vector3()

        const getTime = () => performance.now() * 0.001

        const minRetriggerDelay = 0.4 // click spam-ыг бага дарах

        const triggerWaveFromPointer = (e: PointerEvent) => {
            const now = getTime()

            if (waveActive && now - impactTime < minRetriggerDelay) {
                return
            }

            const rect = canvas.getBoundingClientRect()

            const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1

            const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

            const ndc = new THREE.Vector3(ndcX, ndcY, 0.5)

            ndc.unproject(camera)

            const dir = ndc.sub(camera.position).normalize()

            ray.origin.copy(camera.position)

            ray.direction.copy(dir)

            const res = ray.intersectSphere(sphere, hitPoint)

            if (!res) return

            // --- WORLD SPACE front/back (VIEWPORT урд тал уу?) ---

            worldNormal.copy(hitPoint).normalize()

            camDir.copy(camera.position).normalize()

            if (worldNormal.dot(camDir) <= 0.1) {
                return
            }

            // --- LOCAL SPACE чиглэл (wave origin) ---

            localHit.copy(hitPoint)

            liquidBlob.worldToLocal(localHit)

            localDir.copy(localHit).normalize()

            impactDir.copy(localDir)

            impactTime = now

            waveActive = true

            waveFactor = 0
        }

        const onPointerDown = (e: PointerEvent) => {
            pointerIsDown = true

            isDragging = false

            lastX = e.clientX

            lastY = e.clientY

            // CLICK → wave trigger

            triggerWaveFromPointer(e)
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!pointerIsDown) return

            const dx = e.clientX - lastX

            const dy = e.clientY - lastY

            const movedDistance = Math.abs(dx) + Math.abs(dy)

            if (!isDragging && movedDistance < 2) {
                return
            }

            isDragging = true

            lastX = e.clientX

            lastY = e.clientY

            group.rotation.y += dx * 0.01

            group.rotation.x += dy * 0.01
        }

        const onPointerUp = () => {
            onPointerUpInternal()
        }

        const onPointerLeave = () => {
            onPointerUpInternal()

            waveActive = false
        }

        canvas.addEventListener("pointerdown", onPointerDown)

        canvas.addEventListener("pointermove", onPointerMove)

        canvas.addEventListener("pointerup", onPointerUp)

        canvas.addEventListener("pointerleave", onPointerLeave)

        // ---- RESIZE (always square) ----

        const onResize = () => {
            size = computeSize()

            renderer.setSize(size, size)

            canvas.style.width = `${size}px`

            canvas.style.height = `${size}px`

            camera.aspect = 1

            camera.updateProjectionMatrix()
        }

        window.addEventListener("resize", onResize)

        // ---- ANIMATION: classic viscous + click-ээс spherical wave ----

        const vertex = new THREE.Vector3()

        let frameId: number

        const SQRT3 = Math.sqrt(3)

        const animate = () => {
            frameId = requestAnimationFrame(animate)

            const time = getTime()

            const target = waveActive ? 1 : 0

            waveFactor += (target - waveFactor) * 0.18

            const maxDuration = 2.0

            const waveSpeed = 1.6

            const waveWidth = 0.35

            const breathing = Math.sin(time * 0.7) * 0.03

            // liquidity:

            // sphere = classic blob, circle = бараг байхгүй noise

            let liquidity = 0.18

            if (shapeType === "sphere") liquidity = 1.0

            if (shapeType === "circle") liquidity = 0.0

            if (shapeType === "hex") liquidity = 0.2

            const innerCount = innerPositionAttr.count

            for (let i = 0; i < innerCount; i++) {
                const px = originalPositions[i * 3]

                const py = originalPositions[i * 3 + 1]

                const pz = originalPositions[i * 3 + 2]

                vertex.set(px, py, pz)

                vertex.normalize()

                const nx = vertex.x

                const ny = vertex.y

                const nz = vertex.z

                // --- SHAPE VARIANTS ---

                let shapeOffset = 0

                // Нийтлэг хэмжигдхүүнүүд

                const maxAbs = Math.max(
                    Math.abs(nx),

                    Math.abs(ny),

                    Math.abs(nz),

                    1e-4
                )

                const absSum = Math.abs(nx) + Math.abs(ny) + Math.abs(nz) + 1e-4

                const radial = Math.sqrt(nx * nx + nz * nz) + 1e-4

                const angle = Math.atan2(nz, nx)

                if (shapeType === "sphere") {
                    // Classic viscous orb – deformation зөвхөн static noise-оос

                    shapeOffset = 0
                } else if (shapeType === "circle") {
                    // Төгс бөөрөнхий – shape deformation байхгүй, зөвхөн wave + breathing

                    shapeOffset = 0
                } else if (shapeType === "roundedCube") {
                    const cubeFactor = 1.0 / maxAbs

                    const blend = 0.55

                    const shapeFactor = 1.0 + blend * (cubeFactor - 1.0)

                    shapeOffset = (shapeFactor - 1.0) * 0.6
                } else if (shapeType === "diamond") {
                    const normSum = absSum / SQRT3

                    const shapeFactor = 1.0 / normSum

                    shapeOffset = (shapeFactor - 1.0) * 0.7
                } else if (shapeType === "hex") {
                    const hexBand = Math.cos(6 * angle)

                    const ring = radial

                    shapeOffset = 0.25 * hexBand + 0.25 * (ring - 1.0)
                }

                const baseR =
                    baseRadius + staticOffsets[i] * liquidity + shapeOffset

                let waveDisplace = 0

                // CLICK-ээс эхэлдэг spherical wave

                if (waveFactor > 0.001 && impactTime > -999) {
                    const tSince = time - impactTime

                    if (tSince > 0 && tSince < maxDuration) {
                        const dot =
                            nx * impactDir.x +
                            ny * impactDir.y +
                            nz * impactDir.z

                        const clamped = Math.max(-1, Math.min(1, dot))

                        const angleImpact = Math.acos(clamped)

                        const waveRadius = waveSpeed * tSince

                        const dist = Math.abs(angleImpact - waveRadius)

                        let band = 1 - dist / waveWidth

                        if (band < 0) band = 0

                        if (band > 0) {
                            const localWave = Math.sin(
                                angleImpact * waveFrequency - tSince * 10
                            )

                            const decay = Math.max(1 - tSince / maxDuration, 0)

                            waveDisplace =
                                localWave * 0.25 * band * decay * waveFactor
                        }
                    } else if (tSince >= maxDuration) {
                        waveActive = false
                    }
                }

                const radius = baseR + breathing + waveDisplace

                // INNER orb

                const innerPos = vertex.clone().multiplyScalar(radius)

                innerPositionAttr.setXYZ(i, innerPos.x, innerPos.y, innerPos.z)

                // OUTER shell – зөвхөн shellEnabled үед

                if (shellEnabled) {
                    const outerRadius = radius + shellDist

                    const outerPos = vertex.clone().multiplyScalar(outerRadius)

                    outerPositionAttr.setXYZ(
                        i,

                        outerPos.x,

                        outerPos.y,

                        outerPos.z
                    )
                }
            }

            innerGeometry.attributes.position.needsUpdate = true

            innerGeometry.computeVertexNormals()

            if (shellEnabled) {
                outerGeometry.attributes.position.needsUpdate = true

                outerGeometry.computeVertexNormals()

                // Glow-оос багахан pulse

                const pulse = 0.9 + 0.1 * Math.sin(time * 0.8)

                shellMaterial.opacity = baseOpacity * (0.8 + 0.4 * glow) * pulse
            }

            const r = Math.max(0, rotSpeed)

            group.rotation.y += 0.003 * r

            group.rotation.z += 0.0015 * r

            renderer.render(scene, camera)
        }

        camera.aspect = 1

        camera.updateProjectionMatrix()

        animate()

        // ---- CLEANUP ----

        return () => {
            if (frameId) cancelAnimationFrame(frameId)

            window.removeEventListener("resize", onResize)

            canvas.removeEventListener("pointerdown", onPointerDown)

            canvas.removeEventListener("pointermove", onPointerMove)

            canvas.removeEventListener("pointerup", onPointerUp)

            canvas.removeEventListener("pointerleave", onPointerLeave)

            innerGeometry.dispose()

            outerGeometry.dispose()

            innerMaterial.dispose()

            shellMaterial.dispose()

            renderer.dispose()

            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas)
            }
        }
    }, [
        shapeType,

        baseColor,

        lightAColor,

        lightBColor,

        rotationSpeed,

        waveCount,

        showBackground,

        backgroundColor,

        showShell,

        shellColor,

        shellOpacity,

        shellDistance,

        shellStyle,

        glowStrength,
    ])

    const bgEnabled = showBackground === "yes"

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%", // Frame-ийг дагана

                height: "100%", // Frame-ийг дагана

                position: "relative",

                overflow: "visible",

                background: bgEnabled ? backgroundColor : "transparent",
            }}
        />
    )
}

addPropertyControls(Viscous3DOrb, {
    shapeType: {
        type: ControlType.Enum,

        title: "Shape",

        options: ["sphere", "circle", "roundedCube", "diamond", "hex"],

        optionTitles: [
            "Sphere",

            "Circle",

            "Rounded Cube",

            "Diamond",

            "Hex Ring",
        ],

        defaultValue: "sphere",
    },

    baseColor: {
        type: ControlType.Color,

        title: "Base Color",

        defaultValue: "#ffffff",
    },

    lightAColor: {
        type: ControlType.Color,

        title: "Light A",

        defaultValue: "#4488ff",
    },

    lightBColor: {
        type: ControlType.Color,

        title: "Light B",

        defaultValue: "#ff4488",
    },

    showShell: {
        type: ControlType.SegmentedEnum,

        title: "Shell",

        options: ["no", "yes"],

        optionTitles: ["No", "Yes"],

        defaultValue: "yes",
    },

    shellStyle: {
        type: ControlType.SegmentedEnum,

        title: "Shell Style",

        options: ["glass", "metal"],

        optionTitles: ["Glass", "Metal"],

        defaultValue: "glass",

        hidden: (props: any) => props.showShell === "no",
    },

    shellColor: {
        type: ControlType.Color,

        title: "Shell Color",

        defaultValue: "#ffffff",

        hidden: (props: any) => props.showShell === "no",
    },

    shellOpacity: {
        type: ControlType.Number,

        title: "Shell Opac",

        min: 0,

        max: 1,

        step: 0.05,

        defaultValue: 0.5,

        hidden: (props: any) => props.showShell === "no",
    },

    shellDistance: {
        type: ControlType.Number,

        title: "Shell Dist",

        min: 0,

        max: 1,

        step: 0.05,

        defaultValue: 0.25,

        hidden: (props: any) => props.showShell === "no",
    },

    glowStrength: {
        type: ControlType.Number,

        title: "Glow",

        min: 0,

        max: 1,

        step: 0.05,

        defaultValue: 0.6,

        hidden: (props: any) => props.showShell === "no",
    },

    rotationSpeed: {
        type: ControlType.Number,

        title: "Rotate Speed",

        min: 0,

        max: 3,

        step: 0.1,

        defaultValue: 1,
    },

    waveCount: {
        type: ControlType.Number,

        title: "Wave Count",

        min: 1,

        max: 8,

        step: 1,

        defaultValue: 3,
    },

    showBackground: {
        type: ControlType.SegmentedEnum,

        title: "Background",

        options: ["no", "yes"],

        optionTitles: ["No", "Yes"],

        defaultValue: "no",
    },

    backgroundColor: {
        type: ControlType.Color,

        title: "Bg Color",

        defaultValue: "#050505",

        hidden: (props: any) => props.showBackground === "no",
    },
})

// ЗӨВХӨН FRAMER-Д default Frame size өгнө (runtime-д нөлөөлөхгүй)

export const defaultSize = {
    width: 128,

    height: 128,
}
