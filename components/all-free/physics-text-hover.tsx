import * as React from "react"
import { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function ProParticleText(props) {
    const {
        text,
        fontFamily,
        fontWeight,
        fontSize,
        textColor,
        secondaryColor,
        colorMix,
        particleShape,
        particleSize,
        resolution,
        shatterForce,
        springTension,
        friction,
        interactionType,
        cursorRadius,
    } = props

    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const particlesRef = useRef([])
    const mouseRef = useRef({
        x: -9999,
        y: -9999,
        isActive: false,
        clickPulse: false,
    })

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        let ctx = canvas.getContext("2d", { willReadFrequently: true })
        let resizeObserver

        const initParticles = () => {
            cancelAnimationFrame(animationRef.current)

            // THE FIX: Use offsetWidth/Height instead of getBoundingClientRect
            // This ignores Framer's canvas zoom scaling so it never clips.
            const width = container.offsetWidth
            const height = container.offsetHeight

            if (width === 0 || height === 0) return

            const dpr = window.devicePixelRatio || 1
            canvas.width = width * dpr
            canvas.height = height * dpr
            ctx.scale(dpr, dpr)

            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`

            // Extract Font Layout
            ctx.fillStyle = textColor
            ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"

            // Draw text at the absolute mathematical center
            ctx.fillText(text, width / 2, height / 2)

            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            )
            const data = imageData.data
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            let newParticles = []
            const step = Math.max(1, 11 - resolution)

            for (let y = 0; y < canvas.height; y += step * dpr) {
                for (let x = 0; x < canvas.width; x += step * dpr) {
                    const index = (y * canvas.width + x) * 4
                    if (data[index + 3] > 128) {
                        const canvasX = x / dpr
                        const canvasY = y / dpr

                        const isPrimaryColor = Math.random() > colorMix / 100
                        const pColor = isPrimaryColor
                            ? textColor
                            : secondaryColor

                        newParticles.push({
                            originX: canvasX,
                            originY: canvasY,
                            x: canvasX,
                            y: canvasY,
                            vx: 0,
                            vy: 0,
                            color: pColor,
                        })
                    }
                }
            }
            particlesRef.current = newParticles

            const animate = () => {
                ctx.clearRect(0, 0, width, height)

                particlesRef.current.forEach((p) => {
                    const mouse = mouseRef.current
                    const dx = mouse.x - p.x
                    const dy = mouse.y - p.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    if (mouse.isActive && distance < cursorRadius) {
                        const force = (cursorRadius - distance) / cursorRadius
                        const dirX = dx / distance
                        const dirY = dy / distance

                        if (interactionType === "Hover: Repel") {
                            p.vx -= dirX * force * shatterForce
                            p.vy -= dirY * force * shatterForce
                        } else if (interactionType === "Hover: Attract") {
                            p.vx += dirX * force * shatterForce
                            p.vy += dirY * force * shatterForce
                        } else if (interactionType === "Hover: Glitch") {
                            p.vx +=
                                (Math.random() - 0.5) * force * shatterForce * 3
                            p.vy +=
                                (Math.random() - 0.5) * force * shatterForce * 3
                        }
                    }

                    if (
                        mouse.clickPulse &&
                        interactionType === "Click: Birth"
                    ) {
                        const clickRadius = cursorRadius * 3
                        const clickDistance =
                            distance < clickRadius ? distance : clickRadius
                        const pulseForce =
                            (clickRadius - clickDistance) / clickRadius

                        p.vx -=
                            (dx / clickDistance) *
                            pulseForce *
                            shatterForce *
                            15
                        p.vy -=
                            (dy / clickDistance) *
                            pulseForce *
                            shatterForce *
                            15
                    }

                    p.vx += (p.originX - p.x) * springTension
                    p.vy += (p.originY - p.y) * springTension
                    p.vx *= friction
                    p.vy *= friction
                    p.x += p.vx
                    p.y += p.vy

                    ctx.fillStyle = p.color
                    ctx.beginPath()

                    if (particleShape === "Square") {
                        ctx.rect(
                            p.x - particleSize,
                            p.y - particleSize,
                            particleSize * 2,
                            particleSize * 2
                        )
                    } else {
                        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2)
                    }

                    ctx.fill()
                })

                if (mouseRef.current.clickPulse)
                    mouseRef.current.clickPulse = false
                animationRef.current = requestAnimationFrame(animate)
            }
            animate()
        }

        // Wait for custom fonts to load so it doesn't draw a system font and clip
        document.fonts.ready.then(() => {
            initParticles()
        })

        // Initial render
        initParticles()

        resizeObserver = new ResizeObserver(() => {
            initParticles()
        })
        resizeObserver.observe(container)

        return () => {
            if (resizeObserver) resizeObserver.disconnect()
            cancelAnimationFrame(animationRef.current)
        }
    }, [
        text,
        fontFamily,
        fontWeight,
        fontSize,
        textColor,
        secondaryColor,
        colorMix,
        particleShape,
        particleSize,
        resolution,
        shatterForce,
        springTension,
        friction,
        interactionType,
        cursorRadius,
    ])

    const updateMouse = (clientX, clientY) => {
        const rect = containerRef.current.getBoundingClientRect()
        mouseRef.current.x = clientX - rect.left
        mouseRef.current.y = clientY - rect.top
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex", // THE FIX: Flex perfectly centers the hidden content
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
            }}
            onMouseMove={(e) => {
                updateMouse(e.clientX, e.clientY)
                if (interactionType.startsWith("Hover"))
                    mouseRef.current.isActive = true
            }}
            onMouseLeave={() => (mouseRef.current.isActive = false)}
            onMouseDown={() => {
                if (interactionType === "Click: Birth")
                    mouseRef.current.clickPulse = true
            }}
            onTouchStart={(e) => {
                updateMouse(e.touches[0].clientX, e.touches[0].clientY)
                if (interactionType === "Click: Birth")
                    mouseRef.current.clickPulse = true
            }}
        >
            {/* THE FIX: Invisible buffer sets the layout dimensions for Fit Content */}
            <div
                style={{
                    visibility: "hidden",
                    pointerEvents: "none",
                    userSelect: "none",
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    fontSize: `${fontSize}px`,
                    whiteSpace: "pre",
                    lineHeight: 1,
                    padding: `${cursorRadius}px`, // Buffer so particles don't touch the edge
                    textAlign: "center",
                }}
            >
                {text}
            </div>

            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(ProParticleText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "SHATTER",
    },
    interactionType: {
        type: ControlType.Enum,
        title: "Interaction",
        options: [
            "Hover: Repel",
            "Hover: Attract",
            "Hover: Glitch",
            "Click: Birth",
        ],
        defaultValue: "Hover: Repel",
    },
    cursorRadius: {
        type: ControlType.Number,
        title: "Area of Effect",
        defaultValue: 80,
        min: 20,
        max: 300,
    },
    shatterForce: {
        type: ControlType.Number,
        title: "Force Strength",
        defaultValue: 6,
        min: 1,
        max: 30,
    },
    springTension: {
        type: ControlType.Number,
        title: "Snap Back Speed",
        defaultValue: 0.05,
        min: 0.005,
        max: 0.2,
        step: 0.005,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction (Weight)",
        defaultValue: 0.85,
        min: 0.5,
        max: 0.99,
        step: 0.01,
    },
    particleShape: {
        type: ControlType.Enum,
        title: "Particle Shape",
        options: ["Circle", "Square"],
        defaultValue: "Circle",
    },
    resolution: {
        type: ControlType.Number,
        title: "Particle Density",
        defaultValue: 8,
        min: 1,
        max: 10,
        displayStepper: true,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 1.5,
        min: 0.5,
        max: 10,
        step: 0.1,
    },
    textColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#FFFFFF",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#FF0055",
    },
    colorMix: {
        type: ControlType.Number,
        title: "Color Mix %",
        defaultValue: 0,
        min: 0,
        max: 100,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: ["400", "500", "600", "700", "800", "900"],
        defaultValue: "800",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 140,
        min: 20,
        max: 400,
    },
})
