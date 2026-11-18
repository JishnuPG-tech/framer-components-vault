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


export default function InteractiveMascot(incomingProps) {
    // Flatten grouped properties
    const props = {
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.layout || {}),
        ...(incomingProps.leftEye || {}),
        ...(incomingProps.rightEye || {}),
    }

    const mountRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        // 1. SETUP RENDERER & SCENE
        const scene = new THREE.Scene()
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            stencil: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)

        const frustumSize = 3
        const aspect = container.clientWidth / container.clientHeight
        const camera = new THREE.OrthographicCamera(
            (frustumSize * aspect) / -2,
            (frustumSize * aspect) / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            100
        )
        camera.position.z = 10

        // 2. BASE GEOMETRIES
        const geoCircle = new THREE.CircleGeometry(1, 64)

        // Massive blocks to ensure perfect masking even at extreme custom scales
        const geoTopBlock = new THREE.PlaneGeometry(10, 10)
        geoTopBlock.translate(0, 5, 0)

        const geoBottomBlock = new THREE.PlaneGeometry(10, 10)
        geoBottomBlock.translate(0, -5, 0)

        const heartShape = new THREE.Shape()
        for (let i = 0; i <= 64; i++) {
            const t = (i / 64) * Math.PI * 2
            const x = 16 * Math.pow(Math.sin(t), 3)
            const y =
                13 * Math.cos(t) -
                5 * Math.cos(2 * t) -
                2 * Math.cos(3 * t) -
                Math.cos(4 * t)
            const sx = x * 0.011
            const sy = y * 0.011
            if (i === 0) heartShape.moveTo(sx, sy)
            else heartShape.lineTo(sx, sy)
        }
        const geoHeart = new THREE.ShapeGeometry(heartShape)

        // 3. RIG CONSTRUCTION FACTORY
        const masterRig = new THREE.Group()
        masterRig.scale.setScalar(props.overallSize ?? 1.8)
        scene.add(masterRig)

        const eyeMaterials = []
        const strokeWidth = props.strokeWidth ?? 0.025

        const createEye = (config) => {
            const bitMask = config.isLeft ? 0x01 : 0x02
            const roBase = config.isLeft ? 10 : 20

            const matOutline = new THREE.MeshBasicMaterial({
                color: props.strokeColor,
            })
            const matSclera = new THREE.MeshBasicMaterial({
                color: props.scleraColor,
                stencilWrite: true,
                stencilRef: bitMask,
                stencilFunc: THREE.AlwaysStencilFunc,
                stencilZPass: THREE.ReplaceStencilOp,
            })

            const readStencilRule = {
                stencilWrite: true,
                stencilRef: bitMask,
                stencilFunc: THREE.EqualStencilFunc,
                stencilFail: THREE.KeepStencilOp,
                stencilZFail: THREE.KeepStencilOp,
                stencilZPass: THREE.KeepStencilOp,
            }

            const matPupil = new THREE.MeshBasicMaterial({
                color: props.pupilColor,
                ...readStencilRule,
            })
            const matHeart = new THREE.MeshBasicMaterial({
                color: props.heartColor,
                ...readStencilRule,
            })
            const matHighlight = new THREE.MeshBasicMaterial({
                color: props.highlightColor,
                ...readStencilRule,
            })

            const matLid = new THREE.MeshBasicMaterial({
                color: props.eyelidColor,
                ...readStencilRule,
            })
            const matLidLine = new THREE.MeshBasicMaterial({
                color: props.strokeColor,
                ...readStencilRule,
            })

            eyeMaterials.push(
                matOutline,
                matSclera,
                matPupil,
                matHeart,
                matHighlight,
                matLid,
                matLidLine
            )

            // Dynamic Custom Layout
            const rootContainer = new THREE.Group()
            rootContainer.position.x = config.posX
            rootContainer.position.y = config.posY
            rootContainer.position.z = config.isLeft ? 0 : 0.1

            // Scale applied purely to geometry dimensions to preserve absolute stroke width
            const scleraW = config.baseW * config.scale
            const scleraH = config.baseH * config.scale
            const pupilW = scleraW * 0.6
            const pupilH = scleraH * 0.6

            const tiltedEye = new THREE.Group()
            // Convert Degrees to Radians
            tiltedEye.rotation.z = config.rotation * (Math.PI / 180)
            rootContainer.add(tiltedEye)

            const outline = new THREE.Mesh(geoCircle, matOutline)
            outline.scale.set(scleraW + strokeWidth, scleraH + strokeWidth, 1)
            outline.renderOrder = roBase
            tiltedEye.add(outline)

            const sclera = new THREE.Mesh(geoCircle, matSclera)
            sclera.scale.set(scleraW, scleraH, 1)
            sclera.position.z = 0.01
            sclera.renderOrder = roBase + 1
            tiltedEye.add(sclera)

            const pupilGroup = new THREE.Group()
            pupilGroup.position.z = 0.02
            tiltedEye.add(pupilGroup)

            const pupil = new THREE.Mesh(geoCircle, matPupil)
            pupil.scale.set(pupilW, pupilH, 1)
            pupil.renderOrder = roBase + 2
            pupilGroup.add(pupil)

            const highlight = new THREE.Mesh(geoCircle, matHighlight)
            const hlRadius = config.baseHl * config.scale
            highlight.scale.setScalar(hlRadius)
            highlight.position.set(pupilW * 0.65, -pupilH * 0.4, 0.01)
            highlight.renderOrder = roBase + 2
            pupilGroup.add(highlight)

            const heart = new THREE.Mesh(geoHeart, matHeart)
            heart.position.z = 0.03
            heart.scale.setScalar(0)
            heart.renderOrder = roBase + 2
            pupilGroup.add(heart)

            const horizontalLids = new THREE.Group()
            horizontalLids.position.z = 0.04
            rootContainer.add(horizontalLids)

            const geoTopLine = new THREE.PlaneGeometry(10, strokeWidth)
            geoTopLine.translate(0, -strokeWidth / 2, 0)
            const geoBottomLine = new THREE.PlaneGeometry(10, strokeWidth)
            geoBottomLine.translate(0, strokeWidth / 2, 0)

            const topEyelid = new THREE.Group()
            const topBlock = new THREE.Mesh(geoTopBlock, matLid)
            topBlock.renderOrder = roBase + 3
            const topLine = new THREE.Mesh(geoTopLine, matLidLine)
            topLine.renderOrder = roBase + 4
            topEyelid.add(topBlock, topLine)
            horizontalLids.add(topEyelid)

            const bottomEyelid = new THREE.Group()
            const bottomBlock = new THREE.Mesh(geoBottomBlock, matLid)
            bottomBlock.renderOrder = roBase + 3
            const bottomLine = new THREE.Mesh(geoBottomLine, matLidLine)
            bottomLine.renderOrder = roBase + 4
            bottomEyelid.add(bottomBlock, bottomLine)
            horizontalLids.add(bottomEyelid)

            // Dynamically calculate eyelid limits based on custom user scale
            const openY = scleraH + 0.15
            const closeY = scleraH * 0.22

            topEyelid.position.y = openY
            bottomEyelid.position.y = -openY

            const boundRx = scleraW - pupilW - 0.01
            const boundRy = scleraH - pupilH - 0.01

            return {
                group: rootContainer,
                pupilGroup,
                pupil,
                highlight,
                heart,
                topEyelid,
                bottomEyelid,
                openY,
                closeY,
                boundRx,
                boundRy,
                scalePupilX: pupilW,
                scalePupilY: pupilH,
                hlRadius,
                currentSquint: openY,
            }
        }

        const eyeL = createEye({
            isLeft: true,
            posX: props.leftPosX ?? -0.5,
            posY: props.leftPosY ?? 0.06,
            scale: props.leftScale ?? 1.05,
            rotation: props.leftRotation ?? -8.5,
            baseW: 0.38,
            baseH: 0.48,
            baseHl: 0.07,
        })

        const eyeR = createEye({
            isLeft: false,
            posX: props.rightPosX ?? 0.16,
            posY: props.rightPosY ?? 0.05,
            scale: props.rightScale ?? 1.0,
            rotation: props.rightRotation ?? -9.1,
            baseW: 0.45,
            baseH: 0.55,
            baseHl: 0.08,
        })

        masterRig.add(eyeL.group, eyeR.group)

        // 4. INTERACTION STATE
        let mouseX = 0
        let mouseY = 0
        let targetMouseX = 0
        let targetMouseY = 0
        let isHovering = false
        let hoverAmount = 0

        const onPointerMove = (e) => {
            targetMouseX = (e.clientX / window.innerWidth) * 2 - 1
            targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1

            const targetEl = e.target
            if (targetEl && targetEl.nodeType === 1) {
                const style = window.getComputedStyle(targetEl)
                isHovering =
                    style.cursor === "pointer" ||
                    targetEl.tagName === "A" ||
                    targetEl.tagName === "BUTTON" ||
                    targetEl.closest('a, button, [role="button"]') !== null
            }
        }

        const onPointerLeave = () => {
            targetMouseX = 0
            targetMouseY = 0
            isHovering = false
        }

        window.addEventListener("pointermove", onPointerMove)
        document.addEventListener("pointerleave", onPointerLeave)

        // 5. ANIMATION LOOP
        let animationFrameId
        let isIntersecting = true
        let clock = new THREE.Clock()

        const observer = new IntersectionObserver((entries) => {
            isIntersecting = entries[0].isIntersecting
        })
        observer.observe(container)

        const render = () => {
            const time = clock.getElapsedTime()

            if (isIntersecting && shouldAnimate) {
                // GSAP-STYLE SMOOTH LERPING
                mouseX += (targetMouseX - mouseX) * 0.08
                mouseY += (targetMouseY - mouseY) * 0.08

                const targetHover = isHovering ? 1 : 0
                hoverAmount += (targetHover - hoverAmount) * 0.08

                const dist = Math.sqrt(mouseX * mouseX + mouseY * mouseY)
                const distNormalized = Math.min(dist / 1.0, 1.0)

                const updateEye = (eye) => {
                    let dx = mouseX * 0.35
                    let dy = mouseY * 0.35

                    const ellipseDist = Math.sqrt(
                        (dx / eye.boundRx) ** 2 + (dy / eye.boundRy) ** 2
                    )
                    if (ellipseDist > 1) {
                        dx /= ellipseDist
                        dy /= ellipseDist
                    }

                    eye.pupilGroup.position.x = dx
                    eye.pupilGroup.position.y = dy

                    const pulse =
                        hoverAmount > 0.9
                            ? 1 + Math.max(0, Math.sin(time * 12)) * 0.1
                            : 1
                    eye.heart.scale.setScalar(hoverAmount * pulse * 1.3)

                    eye.pupil.scale.set(
                        eye.scalePupilX * (1 - hoverAmount),
                        eye.scalePupilY * (1 - hoverAmount),
                        1
                    )
                    eye.highlight.scale.setScalar(
                        eye.hlRadius * (1 - hoverAmount)
                    )

                    // Target Squint calculation
                    let targetSquintY = THREE.MathUtils.lerp(
                        eye.openY,
                        eye.closeY,
                        distNormalized
                    )

                    if (hoverAmount > 0.01) {
                        targetSquintY = THREE.MathUtils.lerp(
                            targetSquintY,
                            eye.openY,
                            hoverAmount
                        )
                    }

                    // GSAP-STYLE EYELID LERPING
                    eye.currentSquint +=
                        (targetSquintY - eye.currentSquint) * 0.08

                    eye.topEyelid.position.y = eye.currentSquint
                    eye.bottomEyelid.position.y = -eye.currentSquint
                }

                updateEye(eyeL)
                updateEye(eyeR)
            }

            renderer.clear(true, true, true)
            renderer.render(scene, camera)

            if (shouldAnimate || !isStatic) {
                animationFrameId = requestAnimationFrame(render)
            }
        }

        render()

        // 6. RESIZE HANDLING
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries[0]) return
            const { width, height } = entries[0].contentRect

            renderer.setSize(width, height)
            const aspect = width / height
            camera.left = (frustumSize * aspect) / -2
            camera.right = (frustumSize * aspect) / 2
            camera.top = frustumSize / 2
            camera.bottom = frustumSize / -2
            camera.updateProjectionMatrix()

            if (isStatic) render()
        })
        resizeObserver.observe(container)

        // 7. STRICT CLEANUP
        return () => {
            window.removeEventListener("pointermove", onPointerMove)
            document.removeEventListener("pointerleave", onPointerLeave)
            resizeObserver.disconnect()
            observer.disconnect()
            cancelAnimationFrame(animationFrameId)

            geoCircle.dispose()
            geoTopBlock.dispose()
            geoBottomBlock.dispose()
            geoHeart.dispose()

            eyeMaterials.forEach((mat) => mat.dispose())

            renderer.forceContextLoss()
            renderer.dispose()
            if (container && renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        props.eyelidColor,
        props.scleraColor,
        props.pupilColor,
        props.strokeColor,
        props.highlightColor,
        props.heartColor,
        props.strokeWidth,
        props.overallSize,
        props.leftPosX,
        props.leftPosY,
        props.leftScale,
        props.leftRotation,
        props.rightPosX,
        props.rightPosY,
        props.rightScale,
        props.rightRotation,
        props.editorPreview,
        isStatic,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                pointerEvents: "none",
                ...props.style,
            }}
        />
    )
}

InteractiveMascot.defaultProps = {
    appearance: {
        eyelidColor: "#FFDBC4",
        scleraColor: "#FFFFFF",
        pupilColor: "#000000",
        strokeColor: "#000000",
        highlightColor: "#FFFFFF",
        heartColor: "#FF1900",
        strokeWidth: 0.025,
    },
    layout: { overallSize: 1.8 },
    leftEye: {
        leftPosX: -0.5,
        leftPosY: 0.06,
        leftScale: 1.05,
        leftRotation: -8.5,
    },
    rightEye: {
        rightPosX: 0.16,
        rightPosY: 0.05,
        rightScale: 1.0,
        rightRotation: -9.1,
    },
    editorPreview: true,
}

addPropertyControls(InteractiveMascot, {
    editorPreview: {
        title: "Live Preview",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    layout: {
        title: "Global Scale",
        type: ControlType.Object,
        controls: {
            overallSize: {
                title: "Overall Size",
                type: ControlType.Number,
                defaultValue: 1.8,
                min: 0.1,
                max: 5.0,
                step: 0.1,
                displayStepper: true,
            },
        },
    },
    leftEye: {
        title: "Left Eye Layout",
        type: ControlType.Object,
        controls: {
            leftPosX: {
                title: "Position X",
                type: ControlType.Number,
                defaultValue: -0.5,
                min: -2,
                max: 2,
                step: 0.01,
                displayStepper: true,
            },
            leftPosY: {
                title: "Position Y",
                type: ControlType.Number,
                defaultValue: 0.06,
                min: -2,
                max: 2,
                step: 0.01,
                displayStepper: true,
            },
            leftScale: {
                title: "Scale",
                type: ControlType.Number,
                defaultValue: 1.05,
                min: 0.1,
                max: 3.0,
                step: 0.05,
                displayStepper: true,
            },
            leftRotation: {
                title: "Rotation (°)",
                type: ControlType.Number,
                defaultValue: -8.5,
                min: -180,
                max: 180,
                step: 1,
            },
        },
    },
    rightEye: {
        title: "Right Eye Layout",
        type: ControlType.Object,
        controls: {
            rightPosX: {
                title: "Position X",
                type: ControlType.Number,
                defaultValue: 0.16,
                min: -2,
                max: 2,
                step: 0.01,
                displayStepper: true,
            },
            rightPosY: {
                title: "Position Y",
                type: ControlType.Number,
                defaultValue: 0.05,
                min: -2,
                max: 2,
                step: 0.01,
                displayStepper: true,
            },
            rightScale: {
                title: "Scale",
                type: ControlType.Number,
                defaultValue: 1.0,
                min: 0.1,
                max: 3.0,
                step: 0.05,
                displayStepper: true,
            },
            rightRotation: {
                title: "Rotation (°)",
                type: ControlType.Number,
                defaultValue: -9.1,
                min: -180,
                max: 180,
                step: 1,
            },
        },
    },
    appearance: {
        title: "Colors & Styling",
        type: ControlType.Object,
        controls: {
            eyelidColor: {
                title: "Eyelid Mask",
                type: ControlType.Color,
                defaultValue: "#FFDBC4",
            },
            scleraColor: {
                title: "Eye Base",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            pupilColor: {
                title: "Pupil",
                type: ControlType.Color,
                defaultValue: "#000000",
            },
            strokeColor: {
                title: "Strokes",
                type: ControlType.Color,
                defaultValue: "#000000",
            },
            strokeWidth: {
                title: "Stroke Width",
                type: ControlType.Number,
                defaultValue: 0.025,
                min: 0.01,
                max: 0.15,
                step: 0.005,
                displayStepper: true,
            },
            highlightColor: {
                title: "Highlight",
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            heartColor: {
                title: "Heart",
                type: ControlType.Color,
                defaultValue: "#FF1900",
            },
        },
    },
})
