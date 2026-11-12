import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function HarpMenu(props) {
    const { items, typography, physics, backgroundColor, enableSound, volume } =
        props

    const containerRef = useRef(null)
    const displayCanvasRef = useRef(null)
    const interactionCanvasRef = useRef(null)
    const audioCtxRef = useRef(null)

    // El div invisible que usaremos para "robarle" a Framer el CSS real
    const dummyTextRef = useRef(null)

    // Referencias mutables para el motor
    const stringsRef = useRef([])
    const animationIdRef = useRef(null)
    const canvasSizeRef = useRef({ width: 0, height: 0 })
    const drawRef = useRef(null)

    const physicsRef = useRef(physics)
    const audioSettingsRef = useRef({ enableSound, volume })
    const parsedTypoRef = useRef({
        size: 109,
        weight: 400,
        family: "Inter",
        spacing: 0,
    })

    const dragStateRef = useRef({
        draggingString: null,
        dragStartY: 0,
        dragStartOffset: 0,
        hasMoved: false,
    })

    // 1. Sincronizar parámetros en tiempo real sin re-renders costosos
    useEffect(() => {
        physicsRef.current = physics
    }, [physics])

    useEffect(() => {
        audioSettingsRef.current = { enableSound, volume }
    }, [enableSound, volume])

    // 2. MAGIA: Leer estilos reales (CSS) inyectados por Framer desde el panel de Tipografía
    const [fontTrigger, setFontTrigger] = useState(0)
    useEffect(() => {
        document.fonts.ready.then(() => setFontTrigger((prev) => prev + 1))
    }, [])

    useEffect(() => {
        const extractStyles = () => {
            if (dummyTextRef.current) {
                // Leemos cómo se está renderizando el div realmente en el navegador
                const comp = window.getComputedStyle(dummyTextRef.current)
                parsedTypoRef.current = {
                    size: parseFloat(comp.fontSize) || 109,
                    weight: comp.fontWeight || 400,
                    family: comp.fontFamily || "Inter, sans-serif",
                    spacing: parseFloat(comp.letterSpacing) || 0,
                }
                // Forzamos al canvas a redibujar con los nuevos datos
                if (drawRef.current) drawRef.current()
            }
        }
        extractStyles()
        // Pequeño delay por si Framer inyecta el CSS un milisegundo tarde
        const timer = setTimeout(extractStyles, 50)
        return () => clearTimeout(timer)
    }, [typography, fontTrigger])

    // 3. Sincronizar Cuerdas (Items) dinámicamente sin romper la física
    useEffect(() => {
        const { height } = canvasSizeRef.current
        const marginTop = height * 0.15 || 100
        const marginBottom = height * 0.15 || 100
        const availableHeight = height - marginTop - marginBottom
        const spacing = availableHeight / Math.max(1, items.length - 1)

        stringsRef.current = items.map((item, i) => {
            const existing = stringsRef.current[i]
            return {
                id: i,
                y:
                    existing && existing.y > 0
                        ? existing.y
                        : marginTop + i * spacing,
                offset: existing ? existing.offset : 0,
                velocity: existing ? existing.velocity : 0,
                dragging: existing ? existing.dragging : false,
                color: item.color,
                freq: item.frequency,
                text: item.title,
                link: item.link,
            }
        })
        if (drawRef.current) drawRef.current()
    }, [items])

    // Sonido
    const initAudio = () => {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext
        if (!audioCtxRef.current && AudioContextClass) {
            audioCtxRef.current = new AudioContextClass()
        }
        if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume()
        }
    }

    const playSound = (freq) => {
        const { enableSound: soundOn, volume: vol } = audioSettingsRef.current
        if (!soundOn || vol <= 0) return

        if (!audioCtxRef.current) return
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume()
            return
        }

        const now = audioCtxRef.current.currentTime
        const osc = audioCtxRef.current.createOscillator()
        const gain = audioCtxRef.current.createGain()
        osc.type = "sine"
        osc.frequency.value = freq

        const maxGain = 0.25 * (vol / 100)

        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(maxGain, now + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0)

        osc.connect(gain)
        gain.connect(audioCtxRef.current.destination)
        osc.start(now)
        osc.stop(now + 1.0)
    }

    // Navegación
    const triggerNavigation = (string) => {
        const originalText = string.text
        string.text = ""

        const textDiv = document.createElement("div")
        textDiv.textContent = originalText

        const typo = parsedTypoRef.current
        const isMobile = canvasSizeRef.current.width < 768
        const currentFontSize = isMobile
            ? Math.max(24, typo.size * 0.6)
            : typo.size

        textDiv.style.position = "absolute"
        textDiv.style.left = "50%"
        textDiv.style.top = `${string.y}px`
        textDiv.style.transform = "translate(-50%, -50%)"
        textDiv.style.fontFamily = `"${typo.family}", system-ui`
        textDiv.style.fontSize = `${currentFontSize}px`
        textDiv.style.fontWeight = typo.weight
        textDiv.style.letterSpacing = `${typo.spacing}px`
        textDiv.style.color = string.color
        textDiv.style.textShadow = `0 0 25px ${string.color}`
        textDiv.style.zIndex = "9999"
        textDiv.style.pointerEvents = "none"
        textDiv.style.transition =
            "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease"

        if (containerRef.current) containerRef.current.appendChild(textDiv)

        textDiv.offsetHeight

        textDiv.style.transform = `translate(-50%, -150px)`
        textDiv.style.opacity = "0"

        playSound(string.freq)

        setTimeout(() => {
            if (textDiv.parentNode) textDiv.remove()
            setTimeout(() => {
                if (string.text === "") string.text = originalText
            }, 100)
            if (string.link) {
                window.location.href = string.link
            }
        }, 600)
    }

    // Loop de Canvas y Físicas
    useEffect(() => {
        const displayCanvas = displayCanvasRef.current
        const interactionCanvas = interactionCanvasRef.current
        const container = containerRef.current
        if (!displayCanvas || !interactionCanvas || !container) return

        const ctx = displayCanvas.getContext("2d")
        const interactionCtx = interactionCanvas.getContext("2d")

        const drawTextAboveCurve = (
            s,
            startX,
            endX,
            controlX,
            controlY,
            width
        ) => {
            if (!s.text) return
            const t = 0.5
            const t1 = 1 - t
            const dx =
                2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX)
            const dy = 2 * (1 - t) * (controlY - s.y) + 2 * t * (s.y - controlY)
            const centerX =
                t1 * t1 * startX + 2 * t1 * t * controlX + t * t * endX
            const centerY = t1 * t1 * s.y + 2 * t1 * t * controlY + t * t * s.y

            const length = Math.sqrt(dx * dx + dy * dy)
            if (length > 0) {
                const perpX = -dy / length
                const perpY = dx / length
                const textX = centerX + perpX * -25
                const textY = centerY + perpY * -25
                const angle = Math.atan2(dy, dx)

                const typo = parsedTypoRef.current
                const isMobile = width < 768
                const currentFontSize = isMobile
                    ? Math.max(24, typo.size * 0.6)
                    : typo.size

                ctx.save()
                ctx.translate(textX, textY)
                ctx.rotate(angle)
                ctx.font = `${typo.weight} ${currentFontSize}px ${typo.family}`
                ctx.letterSpacing = `${typo.spacing}px`
                ctx.fillStyle = s.color
                ctx.shadowBlur = 15
                ctx.shadowColor = s.color
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(s.text, 0, 0)
                ctx.restore()
            }
        }

        drawRef.current = () => {
            const { width, height } = canvasSizeRef.current
            if (!width || !height) return

            ctx.clearRect(0, 0, width, height)
            interactionCtx.clearRect(0, 0, width, height)

            stringsRef.current.forEach((s) => {
                const startX = width * 0.05
                const endX = width * 0.95
                const controlX = (startX + endX) / 2
                const controlY = s.y + s.offset

                const intensity = Math.min(
                    Math.abs(s.offset) / physicsRef.current.maxOffset,
                    1
                )
                const lineWidth = 3.5 + intensity * 2

                ctx.beginPath()
                ctx.moveTo(startX, s.y)
                ctx.quadraticCurveTo(controlX, controlY, endX, s.y)
                ctx.strokeStyle = s.color
                ctx.lineWidth = lineWidth
                ctx.stroke()

                drawTextAboveCurve(s, startX, endX, controlX, controlY, width)

                interactionCtx.beginPath()
                interactionCtx.moveTo(startX, s.y)
                interactionCtx.quadraticCurveTo(controlX, controlY, endX, s.y)
                interactionCtx.lineWidth = 60
                interactionCtx.strokeStyle = "transparent"
                interactionCtx.stroke()
            })
        }

        const resizeCanvas = (width, height) => {
            canvasSizeRef.current = { width, height }

            // Aquí está la corrección: Multiplicamos por la densidad de píxeles (DPR)
            const dpr = window.devicePixelRatio || 1

            displayCanvas.width = width * dpr
            displayCanvas.height = height * dpr
            interactionCanvas.width = width * dpr
            interactionCanvas.height = height * dpr

            // Mantenemos el tamaño en CSS para que no se vea gigante
            displayCanvas.style.width = `${width}px`
            displayCanvas.style.height = `${height}px`
            interactionCanvas.style.width = `${width}px`
            interactionCanvas.style.height = `${height}px`

            // Le decimos al contexto que haga zoom a todo para compensar la densidad
            ctx.scale(dpr, dpr)
            interactionCtx.scale(dpr, dpr)

            const marginTop = height * 0.15
            const marginBottom = height * 0.15
            const availableHeight = height - marginTop - marginBottom
            const spacing =
                availableHeight / Math.max(1, stringsRef.current.length - 1)

            stringsRef.current.forEach((s, i) => {
                s.y = marginTop + i * spacing
            })

            if (drawRef.current) drawRef.current()
        }

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                resizeCanvas(width, height)
            }
        })
        resizeObserver.observe(container)

        const updatePhysics = () => {
            let changed = false
            const currentPhysics = physicsRef.current

            stringsRef.current.forEach((s) => {
                if (!s.dragging) {
                    const force = -s.offset * currentPhysics.springForce
                    s.velocity += force
                    s.velocity *= currentPhysics.damping
                    s.offset += s.velocity

                    if (
                        Math.abs(s.offset) < 0.1 &&
                        Math.abs(s.velocity) < 0.1
                    ) {
                        s.offset = 0
                        s.velocity = 0
                    }

                    if (
                        Math.abs(s.velocity) > 0.02 ||
                        Math.abs(s.offset) > 0.02
                    ) {
                        changed = true
                    }
                }
            })

            if (changed && drawRef.current) drawRef.current()
            animationIdRef.current = requestAnimationFrame(updatePhysics)
        }

        const getCanvasY = (clientY) => {
            const rect = interactionCanvas.getBoundingClientRect()
            const scaleY = canvasSizeRef.current.height / rect.height
            let y = (clientY - rect.top) * scaleY
            return Math.max(0, Math.min(canvasSizeRef.current.height, y))
        }

        const findStringAtY = (y) => {
            let closest = null
            let minDist = 50
            for (const s of stringsRef.current) {
                const dist = Math.abs(y - s.y)
                if (dist < minDist) {
                    minDist = dist
                    closest = s
                }
            }
            return closest
        }

        const onPointerDown = (e) => {
            e.preventDefault()
            const y = getCanvasY(e.clientY)
            const string = findStringAtY(y)
            if (!string) return

            initAudio()
            dragStateRef.current.hasMoved = false
            dragStateRef.current.draggingString = string
            dragStateRef.current.dragStartY = y
            dragStateRef.current.dragStartOffset = string.offset

            string.dragging = true
            interactionCanvas.style.cursor = "grabbing"
            interactionCanvas.setPointerCapture(e.pointerId)
        }

        const onPointerMove = (e) => {
            const state = dragStateRef.current
            if (!state.draggingString) return
            e.preventDefault()

            const y = getCanvasY(e.clientY)
            let deltaY = y - state.dragStartY

            if (Math.abs(deltaY) > 5) state.hasMoved = true

            let newOffset = state.dragStartOffset + deltaY
            newOffset = Math.max(
                -physicsRef.current.maxOffset,
                Math.min(physicsRef.current.maxOffset, newOffset)
            )
            state.draggingString.offset = newOffset
            if (drawRef.current) drawRef.current()
        }

        const onPointerUp = (e) => {
            const state = dragStateRef.current
            if (!state.draggingString) return
            e.preventDefault()

            const string = state.draggingString
            const didDrag = state.hasMoved || Math.abs(string.offset) > 10

            string.dragging = false
            string.velocity =
                -string.offset * physicsRef.current.releaseVelocity

            if (didDrag) {
                triggerNavigation(string)
            } else {
                playSound(string.freq)
            }

            state.draggingString = null
            interactionCanvas.style.cursor = "grab"
            if (e.pointerId !== undefined) {
                interactionCanvas.releasePointerCapture(e.pointerId)
            }
            if (drawRef.current) drawRef.current()
        }

        interactionCanvas.addEventListener("pointerdown", onPointerDown)
        interactionCanvas.addEventListener("pointermove", onPointerMove)
        interactionCanvas.addEventListener("pointerup", onPointerUp)

        updatePhysics()

        return () => {
            resizeObserver.disconnect()
            interactionCanvas.removeEventListener("pointerdown", onPointerDown)
            interactionCanvas.removeEventListener("pointermove", onPointerMove)
            interactionCanvas.removeEventListener("pointerup", onPointerUp)
            cancelAnimationFrame(animationIdRef.current)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minHeight: "400px",
                position: "relative",
                backgroundColor: backgroundColor,
                overflow: "hidden",
                cursor: "default",
            }}
        >
            {/* EL DIV INVISIBLE: Aquí es donde robamos los estilos de Framer */}
            <div
                ref={dummyTextRef}
                className={typeof typography === "string" ? typography : ""}
                style={{
                    ...(typeof typography === "object" ? typography : {}),
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                }}
            >
                HarpTextHack
            </div>

            <div onClick={initAudio} style={{ position: "absolute", inset: 0 }}>
                <canvas
                    ref={displayCanvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 5,
                        pointerEvents: "none",
                    }}
                />
                <canvas
                    ref={interactionCanvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        zIndex: 10,
                        touchAction: "none",
                        cursor: "grab",
                    }}
                />
            </div>
        </div>
    )
}

// ------ PROPERTY CONTROLS ------ //

addPropertyControls(HarpMenu, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    typography: {
        // @ts-ignore
        type: ControlType.Font,
        controls: "extended",
        title: "Typography",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 109,
            letterSpacing: 0,
        },
    },
    enableSound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
    },
    volume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.enableSound === false
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        controls: {
            springForce: {
                type: ControlType.Number,
                title: "Tension",
                defaultValue: 0.22,
                min: 0.05,
                max: 0.5,
                step: 0.01,
            },
            damping: {
                type: ControlType.Number,
                title: "Friction",
                defaultValue: 0.96,
                min: 0.8,
                max: 0.99,
                step: 0.01,
            },
            maxOffset: {
                type: ControlType.Number,
                title: "Max Stretch",
                defaultValue: 60,
                min: 20,
                max: 150,
            },
            releaseVelocity: {
                type: ControlType.Number,
                title: "Snap Speed",
                defaultValue: 0.32,
                min: 0.1,
                max: 1.0,
                step: 0.01,
            },
        },
    },
    items: {
        type: ControlType.Array,
        title: "Strings (Menu Items)",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Text" },
                color: { type: ControlType.Color, title: "Color" },
                frequency: {
                    type: ControlType.Number,
                    title: "Sound (Hz)",
                    min: 100,
                    max: 1000,
                },
                link: { type: ControlType.Link, title: "Link To" },
            },
        },
        defaultValue: [
            { title: "HOME", color: "#A3C4C4", frequency: 261.63, link: "/" },
            { title: "ABOUT", color: "#6CABA7", frequency: 329.63, link: "" },
            { title: "SERVICE", color: "#2B87D1", frequency: 349.23, link: "" },
            { title: "WORK", color: "#FF983F", frequency: 392.0, link: "" },
            { title: "CONTACT", color: "#ED4423", frequency: 440.0, link: "" },
        ],
    },
})
