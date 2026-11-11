import React, { useRef, useEffect } from "react"

export default function CosmicParticles({
    particleCount = 600,
    speed = 0.1,
    colors = ["#ffffff", "#a78bfa", "#facc15"], // white, purple, gold
    blurFactor = 2, // smaller = sharper particles
}) {
    const canvasRef = useRef(null)
    const particles = useRef([])

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        const resize = () => {
            canvas.width = canvas.offsetWidth
            canvas.height = canvas.offsetHeight
        }
        resize()
        window.addEventListener("resize", resize)

        // Init particles
        particles.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            size: Math.random() * 1.5 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.8 + 0.2,
            fadeSpeed: Math.random() * 0.02 + 0.005,
        }))

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.current.forEach((p) => {
                // move
                p.x += p.vx
                p.y += p.vy

                // wrap around edges
                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                // opacity twinkling
                p.opacity += p.fadeSpeed
                if (p.opacity >= 1 || p.opacity <= 0) p.fadeSpeed *= -1

                // draw (smaller blur gradient)
                ctx.beginPath()
                const gradient = ctx.createRadialGradient(
                    p.x,
                    p.y,
                    0,
                    p.x,
                    p.y,
                    p.size * blurFactor
                )
                gradient.addColorStop(
                    0,
                    `rgba(${hexToRgb(p.color)},${p.opacity})`
                )
                gradient.addColorStop(1, "transparent")
                ctx.fillStyle = gradient
                ctx.arc(p.x, p.y, p.size * blurFactor, 0, Math.PI * 2)
                ctx.fill()
            })

            requestAnimationFrame(animate)
        }

        animate()

        return () => window.removeEventListener("resize", resize)
    }, [particleCount, speed, colors, blurFactor])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "relative",
                top: 0,
                left: 0,
                width: "100%",
                height: "100vh",
                pointerEvents: "none", // so content on top is clickable
            }}
        />
    )
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `${r},${g},${b}`
}
