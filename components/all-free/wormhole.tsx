import React, { useEffect, useRef } from "react"
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


/**
 * REAL 3D SCROLL WORMHOLE FOR FRAMER (AUTO-STICKY TRACK)
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 * @framerDisableUnusedStyles
 */

export default function Wormhole(props) {
    const {
        scrollLength,
        backgroundColor,
        gridColor,
        tunnelSpeed,
        card1,
        card2,
        card3,
        card4,
        tagFont,
        titleFont,
        bodyFont,
        textColor,
        cardStyles: sProps,
    } = props

    const { cardBorderRadius, cardBackgroundBlur, cardBackgroundColor } =
        sProps || {}

    const trackRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current || !overlayRef.current || !trackRef.current)
            return

        let width = containerRef.current.offsetWidth
        let height = containerRef.current.offsetHeight

        // --- 1. INITIALIZE SCENE & CAMERA ---
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        containerRef.current.appendChild(renderer.domElement)

        // --- 2. GENERATE TUBE GEOMETRY ---
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1.5, 2, -10),
            new THREE.Vector3(-2, -1, -20),
            new THREE.Vector3(1, -2.5, -30),
            new THREE.Vector3(0, 0, -45),
        ])

        // Procedural Grid Texture via HTML Canvas
        const texCanvas = document.createElement("canvas")
        texCanvas.width = 256
        texCanvas.height = 256
        const ctx = texCanvas.getContext("2d")
        if (ctx) {
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, 256, 256)
            ctx.strokeStyle = gridColor
            ctx.lineWidth = 2
            for (let i = 0; i <= 256; i += 32) {
                ctx.beginPath()
                ctx.moveTo(i, 0)
                ctx.lineTo(i, 256)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(0, i)
                ctx.lineTo(256, i)
                ctx.stroke()
            }
        }

        const texture = new THREE.CanvasTexture(texCanvas)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(12, 4)

        const tubeGeo = new THREE.TubeGeometry(curve, 100, 2.8, 16, false)
        const tubeMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
        })
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat)
        scene.add(tubeMesh)

        // --- 3. CARD INSTANTIATION CONFIGURATION ---
        const cardsData = [
            {
                id: "c1",
                progress: 0.22,
                angle: 0.5,
                title: card1?.title,
                desc: card1?.description,
                caption: card1?.caption,
                el: document.getElementById("wh-card-1"),
            },
            {
                id: "c2",
                progress: 0.46,
                angle: 2.6,
                title: card2?.title,
                desc: card2?.description,
                caption: card2?.caption,
                el: document.getElementById("wh-card-2"),
            },
            {
                id: "c3",
                progress: 0.7,
                angle: 4.5,
                title: card3?.title,
                desc: card3?.description,
                caption: card3?.caption,
                el: document.getElementById("wh-card-3"),
            },
            {
                id: "c4",
                progress: 0.92,
                angle: 1.2,
                title: card4?.title,
                desc: card4?.description,
                caption: card4?.caption,
                el: document.getElementById("wh-card-4"),
            },
        ]

        // --- 4. ENGINE RUNTIME INTERACTION ---
        let scrollPercent = 0
        let targetScrollPercent = 0

        const handleScroll = () => {
            // Track scroll progress purely relative to this specific component's scroll runway
            const rect = trackRef.current
                ? trackRef.current.getBoundingClientRect()
                : { top: 0, height: window.innerHeight }
            const totalScrollableDistance = rect.height - window.innerHeight

            if (totalScrollableDistance <= 0) return

            // Calculate progress value mapping safely from 0.0 to 1.0
            const relativeProgress = -rect.top / totalScrollableDistance
            targetScrollPercent = Math.min(Math.max(relativeProgress, 0), 1)
        }
        window.addEventListener("scroll", handleScroll)

        let frameId: number
        const animate = () => {
            // Kinematic Smooth Glide
            scrollPercent += (targetScrollPercent - scrollPercent) * 0.08

            const cameraEval = Math.min(Math.max(scrollPercent, 0), 0.99)
            const lookAtEval = Math.min(Math.max(scrollPercent + 0.04, 0), 1)

            const camPos = curve.getPointAt(cameraEval)
            const lookPos = curve.getPointAt(lookAtEval)

            camera.position.copy(camPos)
            camera.lookAt(lookPos)

            texture.offset.x += tunnelSpeed
            texture.offset.y = scrollPercent * 2.0

            // Project coordinates onto screen vector arrays
            cardsData.forEach((card) => {
                if (!card.el) {
                    card.el = document.getElementById(
                        `wh-card-${card.id === "c1" ? 1 : card.id === "c2" ? 2 : card.id === "c3" ? 3 : 4}`
                    )
                    return
                }

                const cardPos3D = curve.getPointAt(card.progress)
                const wallDistance = 1.2
                cardPos3D.x += Math.cos(card.angle) * wallDistance
                cardPos3D.y += Math.sin(card.angle) * wallDistance

                const wp = cardPos3D.clone()
                wp.project(camera)

                const distance = camera.position.distanceTo(cardPos3D)

                if (wp.z < 1 && distance < 14 && distance > 0.4) {
                    const currentContainer = containerRef.current
                    const currentWidth = currentContainer
                        ? currentContainer.offsetWidth
                        : width
                    const currentHeight = currentContainer
                        ? currentContainer.offsetHeight
                        : height

                    const x = (wp.x * 0.5 + 0.5) * currentWidth
                    const y = (-(wp.y * 0.5) + 0.5) * currentHeight
                    const scale = Math.max(0, 1 - distance / 14)

                    card.el.style.opacity = (scale * 1.4).toString()
                    card.el.style.transform = `translate3d(-50%, -50%, 0px) translate3d(${x}px, ${y}px, 0px) scale(${scale})`
                    card.el.style.zIndex = Math.round(
                        (1 - wp.z) * 100
                    ).toString()
                } else {
                    card.el.style.opacity = "0"
                }
            })

            renderer.render(scene, camera)
            frameId = requestAnimationFrame(animate)
        }
        animate()

        const handleResize = () => {
            if (!containerRef.current) return
            width = containerRef.current.offsetWidth
            height = containerRef.current.offsetHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }
        window.addEventListener("resize", handleResize)

        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", handleResize)
            renderer.dispose()
            if (containerRef.current) {
                containerRef.current.innerHTML = ""
            }
        }
    }, [
        backgroundColor,
        gridColor,
        tunnelSpeed,
        card1,
        card2,
        card3,
        card4,
    ])

    return (
        /* The Runway Track (Height controlled via property settings) */
        <div
            ref={trackRef}
            style={{
                width: "100%",
                height: `${scrollLength}vh`,
                position: "relative",
                background: backgroundColor,
            }}
        >
            {/* The Sticky Viewport Frame pinned during scroll cycles */}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                {/* WebGL Canvas Node */}
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                />

                {/* Information Card Stack */}
                <div
                    ref={overlayRef}
                    id="wh-overlay-layer"
                    style={overlayLayerStyle}
                >
                    {[1, 2, 3, 4].map((num) => {
                        const cardData =
                            props[`card${num}`]
                        return (
                            <div
                                key={num}
                                id={`wh-card-${num}`}
                                style={{
                                    ...s,
                                    borderRadius: `${cardBorderRadius}px`,
                                    backdropFilter: `blur(${cardBackgroundBlur}px) saturate(180%)`,
                                    WebkitBackdropFilter: `blur(${cardBackgroundBlur}px) saturate(180%)`,
                                    background: cardBackgroundColor,
                                }}
                            >
                                <span
                                    style={{
                                        ...tagStyle,
                                        ...tagFont,
                                        color: textColor,
                                    }}
                                >
                                    {cardData?.caption || `0${num} / PERSPECTIVE`}
                                </span>
                                <h3
                                    style={{
                                        ...titleStyle,
                                        ...titleFont,
                                        color: textColor,
                                    }}
                                >
                                    {cardData?.title}
                                </h3>
                                <p
                                    style={{
                                        ...bodyStyle,
                                        ...bodyFont,
                                        color: `${textColor}CC`,
                                    }}
                                >
                                    {cardData?.description}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// System defaults
Wormhole.defaultProps = {
    scrollLength: 400,
    backgroundColor: "#030305",
    gridColor: "#2a4fbd",
    tunnelSpeed: 0.0008,
    textColor: "#FFFFFF",
    cardStyles: {
        cardBorderRadius: 14,
        cardBackgroundBlur: 20,
        cardBackgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    card1: {
        caption: "01 / PERSPECTIVE",
        title: "Quantum Threshold",
        description: "Entering the localized vector distortion zone.",
    },
    card2: {
        caption: "02 / PERSPECTIVE",
        title: "WebGL Canvas Sync",
        description: "Projecting standard elements across curved viewport matrices.",
    },
    card3: {
        caption: "03 / PERSPECTIVE",
        title: "Kinetic Geometry",
        description: "Accelerating elements seamlessly using physical scroll inertia.",
    },
    card4: {
        caption: "04 / PERSPECTIVE",
        title: "Data Core Normalization",
        description: "Exiting spatial pathways back into default CSS environments.",
    },
}

// Side-panel layout properties
addPropertyControls(Wormhole, {
    scrollLength: {
        type: ControlType.Number,
        min: 100,
        max: 1000,
        step: 50,
        title: "Track Length (vh)",
        description: "Controls the duration of the scroll tunnel effect",
    },
    backgroundColor: { type: ControlType.Color, title: "Background" },
    gridColor: { type: ControlType.Color, title: "Grid Energy" },
    tunnelSpeed: {
        type: ControlType.Number,
        min: 0,
        max: 0.005,
        step: 0.0001,
        title: "Vortex Spin",
    },

    card1: {
        type: ControlType.Object,
        title: "Card 1",
        controls: {
            caption: {
                type: ControlType.String,
                title: "Caption",
            },
            title: {
                type: ControlType.String,
                title: "Title",
            },
            description: {
                type: ControlType.String,
                title: "Description",
                displayTextArea: true,
            },
        },
    },

    card2: {
        type: ControlType.Object,
        title: "Card 2",
        controls: {
            caption: {
                type: ControlType.String,
                title: "Caption",
            },
            title: {
                type: ControlType.String,
                title: "Title",
            },
            description: {
                type: ControlType.String,
                title: "Description",
                displayTextArea: true,
            },
        },
    },

    card3: {
        type: ControlType.Object,
        title: "Card 3",
        controls: {
            caption: {
                type: ControlType.String,
                title: "Caption",
            },
            title: {
                type: ControlType.String,
                title: "Title",
            },
            description: {
                type: ControlType.String,
                title: "Description",
                displayTextArea: true,
            },
        },
    },

    card4: {
        type: ControlType.Object,
        title: "Card 4",
        controls: {
            caption: {
                type: ControlType.String,
                title: "Caption",
            },
            title: {
                type: ControlType.String,
                title: "Title",
            },
            description: {
                type: ControlType.String,
                title: "Description",
                displayTextArea: true,
            },
        },
    },

    tagFont: {
        type: ControlType.Font,
        title: "Tag Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "9px",
            variant: "Bold",
            letterSpacing: "1.5px",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Medium",
            letterSpacing: "-0.5px",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.5",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color for tags and titles (paragraph at 80% opacity)",
    },
    cardStyles: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            cardBorderRadius: {
                type: ControlType.Number,
                min: 0,
                max: 40,
                step: 1,
                title: "Border Radius",
                description: "Corner radius for card items",
            },
            cardBackgroundBlur: {
                type: ControlType.Number,
                min: 0,
                max: 50,
                step: 1,
                title: "BG Blur",
                description: "Recomended < 10 to avoid performance overload",
            },
            cardBackgroundColor: {
                type: ControlType.Color,
                title: "BG Color",
            },
        },
    },
})

const overlayLayerStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    perspective: "1000px",
}

const s: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    fontFamily: '"Inter", sans-serif',
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    padding: "24px",
    width: "280px",
    color: "#fff",
    boxShadow:
        "0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
    opacity: 0,
    pointerEvents: "auto",
    willChange: "transform, opacity",
}

const tagStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
}

const titleStyle: React.CSSProperties = {
    margin: "0 0 140px 0",
}

const bodyStyle: React.CSSProperties = {
    margin: 0,
}
