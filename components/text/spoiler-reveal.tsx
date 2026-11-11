// Code based on the spoilerjs open source project: https://github.com/shajidhasan/spoilerjs

import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ----------------------
// Particle System
// ----------------------
class Particle {
    constructor(x, y, vx, vy, size, life, maxAlpha) {
        this.x = x
        this.y = y
        this.vx = vx
        this.vy = vy
        this.size = size
        this.life = life
        this.alpha = 0
        this.maxAlpha = maxAlpha
        this.targetX = null
        this.targetY = null
    }
}

// ----------------------
// Particle Manager
// ----------------------
class ParticleManager {
    config
    width
    height
    particles
    spawning
    formingText
    dissolving

    constructor(config, width, height) {
        this.config = config
        this.width = width
        this.height = height
        this.particles = []
        this.spawning = true
        this.formingText = false
        this.dissolving = false
    }

    createParticle() {
        const size =
            Math.random() < 0.5 ? this.config.scale : this.config.scale * 2
        const x = Math.random() * this.width
        const y = Math.random() * this.height
        const speed =
            Math.random() *
                (this.config.maxVelocity - this.config.minVelocity) +
            this.config.minVelocity
        const angle = Math.random() * Math.PI * 2
        const vx = Math.cos(angle) * speed
        const vy = Math.sin(angle) * speed
        const life = this.config.particleLifetime
        const maxAlpha = Math.random() < 0.5 ? 1 : 0.5
        return new Particle(x, y, vx, vy, size, life, maxAlpha)
    }

    assignTextTargets(points) {
        this.formingText = true
        this.dissolving = false
        this.particles.forEach((p, i) => {
            const target = points[i % points.length]
            p.targetX = target.x
            p.targetY = target.y
        })
    }

    stopSpawning() {
        this.spawning = false
    }

    dissolve() {
        this.dissolving = true
        this.formingText = false
        this.stopSpawning()
    }

    update() {
        const targetCount =
            (this.width * this.height * this.config.density) / 10000

        if (this.spawning && this.particles.length < targetCount) {
            this.particles.push(this.createParticle())
        }

        this.particles.forEach((p) => {
            if (this.formingText && p.targetX !== null) {
                const dx = p.targetX - p.x
                const dy = p.targetY - p.y
                p.vx += dx * 0.02
                p.vy += dy * 0.02
                p.vx *= 0.85
                p.vy *= 0.85
            }

            p.x += p.vx
            p.y += p.vy

            if (this.dissolving) {
                p.alpha -= 0.04
            } else {
                p.alpha = Math.min(p.maxAlpha, p.alpha + 0.03)
            }
        })

        this.particles = this.particles.filter((p) => p.alpha > 0)
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.width, this.height)
        ctx.fillStyle = this.config.textColor
        this.particles.forEach((p) => {
            ctx.globalAlpha = Math.max(0, p.alpha)
            ctx.fillRect(p.x, p.y, p.size, p.size)
        })
        ctx.globalAlpha = 1
    }
}

// ----------------------
// Text Sampling
// ----------------------

function sampleTextPoints(text, font, width, height) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `${font.fontWeight || 400} ${font.fontSize || 16}px ${
        font.fontFamily || "sans-serif"
    }`

    ctx.fillText(text, width / 2, height / 2)

    const data = ctx.getImageData(0, 0, width, height).data
    const points = []

    for (let y = 0; y < height; y += 6) {
        for (let x = 0; x < width; x += 6) {
            const i = (y * width + x) * 4
            if (data[i + 3] > 128) points.push({ x, y })
        }
    }

    return points
}

// ----------------------
// Spoiler Component
// ----------------------
export default function SpoilerReveal(props) {
    const {
        text,
        revealDuration,
        spawnStopDelay,
        scale,
        minVelocity,
        maxVelocity,
        particleLifetime,
        density,
        textColor,
        backgroundColor,
        fps,
        hoverReveal,
        font,
        revealAnimation,
        revealMode,
    } = props

    const finalFont = {
        fontFamily: font?.fontFamily,
        fontSize: font?.fontSize,
        fontWeight: font?.fontWeight,
        lineHeight: font?.lineHeight,
        letterSpacing: font?.tracking,
        textAlign: font?.textAlign,
    }

    const [revealing, setRevealing] = React.useState(false)
    const [revealed, setRevealed] = React.useState(false)
    const canvasRef = React.useRef(null)
    const managerRef = React.useRef(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        const { width, height } = canvas.getBoundingClientRect()
        canvas.width = width
        canvas.height = height
        managerRef.current = new ParticleManager(
            {
                scale,
                minVelocity,
                maxVelocity,
                particleLifetime,
                density,
                textColor,
            },
            width,
            height
        )

        let frame,
            last = 0
        const interval = 1000 / fps
        const loop = (t) => {
            if (!managerRef.current) return
            if (t - last > interval) {
                managerRef.current.update()
                managerRef.current.draw(ctx)
                last = t - ((t - last) % interval)
            }
            frame = requestAnimationFrame(loop)
        }
        loop(0)
        return () => cancelAnimationFrame(frame)
    }, [
        scale,
        minVelocity,
        maxVelocity,
        particleLifetime,
        density,
        textColor,
        fps,
    ])

    const reveal = () => {
        if (revealing || revealed) return

        setRevealing(true)

        // Particle → text morph
        if (revealMode === "particle-form") {
            const canvas = canvasRef.current
            if (canvas && managerRef.current) {
                const points = sampleTextPoints(
                    text,
                    finalFont,
                    canvas.width,
                    canvas.height
                )
                managerRef.current.assignTextTargets(points)
            }
        }

        // Stop spawning new particles
        setTimeout(() => {
            managerRef.current?.stopSpawning()
        }, spawnStopDelay)

        // Dissolve particles + show text
        setTimeout(() => {
            managerRef.current?.dissolve()
            setRevealed(true)
        }, revealDuration)
    }

    const animationPresets = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: revealed ? 1 : 0 },
            transition: {
                duration: revealDuration / 1000,
                ease: [0.22, 1, 0.36, 1],
            },
        },

        "fade-up": {
            initial: { opacity: 0, y: 6 },
            animate: { opacity: revealed ? 1 : 0, y: revealed ? 0 : 6 },
            transition: {
                duration: revealDuration / 1000,
                ease: [0.22, 1, 0.36, 1],
            },
        },

        "fade-down": {
            initial: { opacity: 0, y: -6 },
            animate: { opacity: revealed ? 1 : 0, y: revealed ? 0 : -6 },
            transition: {
                duration: revealDuration / 1000,
                ease: [0.22, 1, 0.36, 1],
            },
        },

        scale: {
            initial: { opacity: 0, scale: 0.96 },
            animate: { opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.96 },
            transition: {
                duration: revealDuration / 1000,
                ease: [0.22, 1, 0.36, 1],
            },
        },

        spring: {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: revealed ? 1 : 0, scale: revealed ? 1 : 0.9 },
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
            },
        },
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: revealed ? "default" : "pointer",
            }}
            onClick={() => !hoverReveal && reveal()}
            onMouseEnter={() => hoverReveal && reveal()}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />

            <motion.div
                initial={animationPresets[revealAnimation].initial}
                animate={animationPresets[revealAnimation].animate}
                transition={animationPresets[revealAnimation].transition}
                style={{
                    color: textColor,
                    fontFamily: finalFont.fontFamily,
                    fontSize: finalFont.fontSize,
                    fontWeight: finalFont.fontWeight,
                    lineHeight: finalFont.lineHeight,
                    letterSpacing: finalFont.letterSpacing,
                    textAlign: finalFont.textAlign,
                    userSelect: revealed ? "text" : "none",
                    zIndex: 2,
                }}
            >
                {text}
            </motion.div>
        </div>
    )
}

// ----------------------
// Property Controls
// ----------------------
addPropertyControls(SpoilerReveal, {
    text: {
        type: "string",
        title: "Text",
        defaultValue: "This is a spoiler!",
    },
    font: {
        type: "font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            lineHeight: 1.2,
        },
    },
    revealMode: {
        type: "enum",
        title: "Reveal Mode",
        options: ["fade", "particle-form"],
        optionTitles: ["Fade In", "Particles Form Text"],
        defaultValue: "fade",
    },
    revealDuration: {
        type: "number",
        title: "Reveal (ms)",
        defaultValue: 300,
        min: 100,
        max: 2000,
        description: "How long the text reveal animation takes.",
    },
    revealAnimation: {
        type: "enum",
        title: "Reveal Animation",
        options: ["fade", "fade-up", "fade-down", "scale", "spring"],
        optionTitles: ["Fade", "Fade Up", "Fade Down", "Scale", "Spring Pop"],
        defaultValue: "fade",
        description: "Controls how the text animates into view.",
    },
    spawnStopDelay: {
        type: "number",
        title: "Spawn Stop (ms)",
        defaultValue: 0,
        min: 0,
        max: 2000,
        description: "Delay before particles stop spawning after interaction.",
    },
    scale: {
        type: "number",
        title: "Scale",
        defaultValue: 1,
        min: 0.5,
        max: 10,
        description: "Controls the size of each particle.",
    },
    minVelocity: {
        type: "number",
        title: "Min Velocity",
        defaultValue: 0.01,
        min: 0,
        max: 5,
        description: "Minimum speed at which particles move.",
    },
    maxVelocity: {
        type: "number",
        title: "Max Velocity",
        defaultValue: 0.05,
        min: 0,
        max: 5,
        description: "Maximum speed at which particles move.",
    },
    particleLifetime: {
        type: "number",
        title: "Particle Lifetime",
        defaultValue: 120,
        min: 20,
        max: 500,
        description: "How long each particle stays alive.",
    },
    density: {
        type: "number",
        title: "Density",
        defaultValue: 8,
        min: 1,
        max: 20,
        description: "Number of particles generated in the effect.",
    },
    fps: {
        type: "number",
        title: "FPS",
        defaultValue: 60,
        min: 10,
        max: 120,
        description:
            "Animation smoothness — lower for performance, higher for fluidity.",
    },
    hoverReveal: {
        type: "boolean",
        title: "Reveal on Hover",
        defaultValue: false,
    },
    textColor: {
        type: "color",
        title: "Text Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: "color",
        title: "Background",
        defaultValue: "#ffffff",
        description:
            "Component crafted by [Vaibhav](https://contra.com/vaibhav_khulbe)",
    },
})
