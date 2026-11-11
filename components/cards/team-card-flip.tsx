// Team Card
// Single, reusable team member card with physics-based dragging, 3D tilt, and flip animations
// Perfect for use with Framer CMS for scalable team pages
//
// Created by Frankie from Framer-Expert.com
// https://framer-expert.com

import React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------- Helpers ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v))

// ---------- Types ----------
interface Props {
    image?: string
    name: string
    role: string
    backText: string
    cardWidth: number
    aspectRatio: "16:9" | "4:3" | "1:1" | "3:4" | "9:16"
    radius: number
    shadow: number
    imageMask: boolean
    maskIntensity: number
    nameSize: number
    font?: {
        fontFamily?: string
        fontWeight?: number | string
        fontStyle?: string
    }
    textColor: string
    showVerified: boolean
    enableTilt: boolean
    enableDrag: boolean
    flipOnClick: boolean
    tiltIntensity: number
    slideIntensity: number
}

const defaultProps: Props = {
    name: "Team Member",
    role: "Designer",
    backText: "Click to see their bio or description here.",
    cardWidth: 240,
    aspectRatio: "3:4",
    radius: 24,
    shadow: 18,
    imageMask: true,
    maskIntensity: 40,
    nameSize: 22,
    textColor: "#FFFFFF",
    showVerified: true,
    enableTilt: true,
    enableDrag: true,
    flipOnClick: true,
    tiltIntensity: 50,
    slideIntensity: 50,
}

function parseAspect(aspect: string): number | null {
    if (aspect === "free") return null
    const [a, b] = aspect.split(":").map(Number)
    if (!a || !b) return null
    return a / b
}

export default function TeamCard(props: Partial<Props>) {
    const p = { ...defaultProps, ...props }

    const aspectRatio = parseAspect(p.aspectRatio)
    const cardW = p.cardWidth
    const cardH = aspectRatio ? Math.round(cardW / aspectRatio) : cardW

    return (
        <div style={{ position: "relative", width: cardW, height: cardH }}>
            <CardElement
                image={p.image}
                name={p.name}
                role={p.role}
                backText={p.backText}
                cardW={cardW}
                cardH={cardH}
                p={p}
            />
        </div>
    )
}

interface CardElementProps {
    image?: string
    name: string
    role: string
    backText: string
    cardW: number
    cardH: number
    p: Props
}

function CardElement({
    image,
    name,
    role,
    backText,
    cardW,
    cardH,
    p,
}: CardElementProps) {
    const outerRef = React.useRef<HTMLDivElement>(null)
    const target = React.useRef({ x: 0, y: 0 })
    const pos = React.useRef({ x: 0, y: 0 })
    const vel = React.useRef({ x: 0, y: 0 })
    const lastPos = React.useRef({ x: 0, y: 0, time: 0 })
    const isDragging = React.useRef(false)
    const hovered = React.useRef(false)
    const frame = React.useRef<number | null>(null)
    const [isHover, setIsHover] = React.useState(false)
    const [flipped, setFlipped] = React.useState(false)

    const friction = 0.92
    const elasticity = 0.15
    const throwVelocity = 1.2

    // Map 0–100 controls to usable ranges
    const hoverIntensity = (p.slideIntensity / 100) * 44 // 0–44 range (default was 22)
    const tiltAmount = (p.tiltIntensity / 100) * 16 // 0–16 range (default was 8)

    const onMove = (e: React.MouseEvent) => {
        const el = outerRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1
        target.current.x = clamp(nx, -1, 1)
        target.current.y = clamp(ny, -1, 1)
        if (hovered.current && !isDragging.current && frame.current === null) {
            loop()
        }
    }

    const onEnter = () => {
        hovered.current = true
        setIsHover(true)
        if (!isDragging.current && frame.current === null) {
            loop()
        }
    }

    const onLeave = () => {
        hovered.current = false
        setIsHover(false)
        if (!isDragging.current) {
            target.current.x = 0
            target.current.y = 0
            if (frame.current === null) {
                loop()
            }
        }
    }

    const onFlipToggle = (e: React.MouseEvent) => {
        if (!isDragging.current && p.flipOnClick) {
            e.stopPropagation()
            setFlipped((f) => !f)
        }
    }

    const loop = () => {
        if (frame.current != null) cancelAnimationFrame(frame.current)

        const step = () => {
            if (!isDragging.current) {
                const intensity = hovered.current ? hoverIntensity : 0
                const stiffness = 0.15
                const damping = 0.88

                const tx = target.current.x * intensity
                const ty = target.current.y * intensity

                const forceX = (tx - pos.current.x) * stiffness
                const forceY = (ty - pos.current.y) * stiffness

                vel.current.x = (vel.current.x + forceX) * damping
                vel.current.y = (vel.current.y + forceY) * damping

                pos.current.x += vel.current.x
                pos.current.y += vel.current.y

                const lim = intensity + 5
                if (
                    Math.abs(pos.current.x) > lim ||
                    Math.abs(pos.current.y) > lim
                ) {
                    pos.current.x = lerp(
                        pos.current.x,
                        clamp(pos.current.x, -lim, lim),
                        0.3
                    )
                    pos.current.y = lerp(
                        pos.current.y,
                        clamp(pos.current.y, -lim, lim),
                        0.3
                    )
                }
            } else {
                vel.current.x *= friction
                vel.current.y *= friction

                const centerForceX = -pos.current.x * elasticity
                const centerForceY = -pos.current.y * elasticity
                vel.current.x += centerForceX
                vel.current.y += centerForceY

                pos.current.x += vel.current.x
                pos.current.y += vel.current.y

                if (
                    Math.abs(vel.current.x) < 0.01 &&
                    Math.abs(vel.current.y) < 0.01 &&
                    Math.abs(pos.current.x) < 0.5 &&
                    Math.abs(pos.current.y) < 0.5
                ) {
                    vel.current.x = 0
                    vel.current.y = 0
                    pos.current.x = 0
                    pos.current.y = 0
                }
            }

            updateTransform()

            const atRest =
                Math.abs(vel.current.x) < 0.02 &&
                Math.abs(vel.current.y) < 0.02 &&
                Math.abs(pos.current.x) < 0.3 &&
                Math.abs(pos.current.y) < 0.3

            const needsContinue =
                isDragging.current || hovered.current || !atRest

            if (needsContinue) {
                frame.current = requestAnimationFrame(step)
            } else {
                pos.current.x = 0
                pos.current.y = 0
                vel.current.x = 0
                vel.current.y = 0
                updateTransform()
                frame.current = null
            }
        }

        frame.current = requestAnimationFrame(step)
    }

    const updateTransform = () => {
        const el = outerRef.current
        if (!el) return

        const rx =
            p.enableTilt && !isDragging.current
                ? -target.current.y * tiltAmount
                : 0
        const ry =
            p.enableTilt && !isDragging.current
                ? target.current.x * tiltAmount
                : 0
        const sc = hovered.current || isDragging.current ? 1.02 : 1

        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`
        el.style.willChange = "transform"
        el.style.transition = "none"
    }

    const onMouseDown = (e: React.MouseEvent) => {
        if (!p.enableDrag) return
        e.preventDefault()
        e.stopPropagation()

        lastPos.current = { x: e.clientX, y: e.clientY, time: Date.now() }
        const startX = e.clientX
        const startY = e.clientY

        const checkDrag = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX
            const dy = moveEvent.clientY - startY
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance > 3 && !isDragging.current) {
                isDragging.current = true
                vel.current.x = 0
                vel.current.y = 0
                loop()
                document.removeEventListener("mousemove", checkDrag)
            }
        }

        const cleanup = () => {
            document.removeEventListener("mousemove", checkDrag)
            document.removeEventListener("mouseup", cleanup)
        }

        document.addEventListener("mousemove", checkDrag)
        document.addEventListener("mouseup", cleanup)
    }

    const onMouseMoveGlobal = React.useCallback((e: MouseEvent) => {
        if (!isDragging.current) return

        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y

        pos.current.x += dx
        pos.current.y += dy

        const now = Date.now()
        const dt = Math.max(1, now - lastPos.current.time)
        vel.current.x = (dx / dt) * 16 * throwVelocity
        vel.current.y = (dy / dt) * 16 * throwVelocity

        lastPos.current.x = e.clientX
        lastPos.current.y = e.clientY
        lastPos.current.time = Date.now()

        updateTransform()
    }, [])

    const onMouseUpGlobal = React.useCallback(() => {
        if (!isDragging.current) return
        isDragging.current = false
        loop()
    }, [])

    React.useEffect(() => {
        document.addEventListener("mousemove", onMouseMoveGlobal)
        document.addEventListener("mouseup", onMouseUpGlobal)
        updateTransform()

        return () => {
            document.removeEventListener("mousemove", onMouseMoveGlobal)
            document.removeEventListener("mouseup", onMouseUpGlobal)
            if (frame.current != null) cancelAnimationFrame(frame.current)
        }
    }, [onMouseMoveGlobal, onMouseUpGlobal])

    const imgSrc = typeof image === "string" ? image : (image as any)?.src
    const roleSize = Math.round(p.nameSize * 0.6)

    return (
        <div
            ref={outerRef}
            onMouseMove={onMove}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onMouseDown={onMouseDown}
            onClick={(e) => {
                if (!isDragging.current) onFlipToggle(e)
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: p.radius,
                overflow: "visible",
                background: "transparent",
                boxShadow:
                    p.shadow > 0
                        ? `0 ${p.shadow}px ${p.shadow * 2}px rgba(0,0,0,0.18)`
                        : "none",
                cursor: p.enableDrag
                    ? isDragging.current
                        ? "grabbing"
                        : "grab"
                    : p.flipOnClick
                      ? "pointer"
                      : "default",
                perspective: 1000,
                userSelect: "none",
                transformStyle: "preserve-3d",
                backfaceVisibility: "visible",
                WebkitBackfaceVisibility: "visible",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transition: "transform 380ms cubic-bezier(.2,.8,.2,1)",
                    transform: `rotateY(${flipped ? 180 : 0}deg)`,
                }}
            >
                {/* FRONT */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: p.radius,
                        overflow: "hidden",
                        backfaceVisibility: "hidden",
                        background: "#1F1F1F",
                    }}
                >
                    {imgSrc && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: `url(${imgSrc})`,
                                backgroundSize: "cover",
                                backgroundPosition: "50% 50%",
                            }}
                        />
                    )}
                    {p.imageMask && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: `linear-gradient(to bottom, rgba(0,0,0,0.1) 10%, rgba(0,0,0,${p.maskIntensity / 100}) 70%, rgba(0,0,0,0) 100%)`,
                            }}
                        />
                    )}
                    <div
                        style={{
                            position: "absolute",
                            left: 20,
                            bottom: 20,
                            right: 20,
                            color: p.textColor,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 4,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: p.nameSize,
                                    fontFamily: p.font?.fontFamily || "Inter",
                                    fontWeight: p.font?.fontWeight || 600,
                                    fontStyle: p.font?.fontStyle,
                                    lineHeight: 1.2,
                                }}
                            >
                                {name}
                            </span>
                            {p.showVerified && (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        width: p.nameSize * 0.5,
                                        height: p.nameSize * 0.5,
                                        borderRadius: "50%",
                                        background: "#86EFAC",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg
                                        width="60%"
                                        height="60%"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#0A0A0A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                            )}
                        </div>
                        <div
                            style={{
                                color: "#E5E7EB",
                                fontSize: roleSize,
                                fontFamily: p.font?.fontFamily || "Inter",
                                fontWeight: 400,
                                fontStyle: p.font?.fontStyle,
                                lineHeight: 1.3,
                                opacity: 0.95,
                            }}
                        >
                            {role}
                        </div>
                    </div>
                </div>

                {/* BACK */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: p.radius,
                        overflow: "hidden",
                        background: "rgba(12,12,12,0.95)",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: 20,
                        gap: 12,
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                    }}
                >
                    <div
                        style={{
                            fontSize: Math.max(14, p.nameSize * 0.75),
                            fontFamily: p.font?.fontFamily || "Inter",
                            fontWeight: p.font?.fontWeight || 600,
                            fontStyle: p.font?.fontStyle,
                            opacity: 1,
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {name} · {role}
                    </div>
                    <div
                        style={{
                            fontSize: Math.max(12, roleSize * 0.95),
                            fontFamily: p.font?.fontFamily || "Inter",
                            fontWeight: 400,
                            fontStyle: p.font?.fontStyle,
                            opacity: 0.85,
                            lineHeight: 1.5,
                            letterSpacing: "0.01em",
                        }}
                    >
                        {backText || "Add a bio or description here."}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ---------- Property Controls ----------
addPropertyControls(TeamCard, {
    // Card Content
    image: { type: ControlType.Image, title: "Image" },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: defaultProps.name,
    },
    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: defaultProps.role,
    },
    backText: {
        type: ControlType.String,
        title: "Bio",
        defaultValue: defaultProps.backText,
        displayTextArea: true,
    },

    // Card Style
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 120,
        max: 400,
        step: 10,
        defaultValue: defaultProps.cardWidth,
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["16:9", "4:3", "1:1", "3:4", "9:16"],
        defaultValue: defaultProps.aspectRatio,
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 48,
        step: 2,
        defaultValue: defaultProps.radius,
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 48,
        step: 2,
        defaultValue: defaultProps.shadow,
    },
    imageMask: {
        type: ControlType.Boolean,
        title: "Image Mask",
        defaultValue: defaultProps.imageMask,
    },
    maskIntensity: {
        type: ControlType.Number,
        title: "Mask Intensity",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: defaultProps.maskIntensity,
        hidden: (props) => !props.imageMask,
    },

    // Typography
    nameSize: {
        type: ControlType.Number,
        title: "Text Size",
        min: 12,
        max: 36,
        step: 1,
        defaultValue: defaultProps.nameSize,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: defaultProps.textColor,
    },
    showVerified: {
        type: ControlType.Boolean,
        title: "Show Verified Badge",
        defaultValue: defaultProps.showVerified,
    },

    // Interactions
    enableTilt: {
        type: ControlType.Boolean,
        title: "Enable 3D Tilt",
        defaultValue: defaultProps.enableTilt,
    },
    tiltIntensity: {
        type: ControlType.Number,
        title: "Tilt Intensity",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: defaultProps.tiltIntensity,
        hidden: (props) => !props.enableTilt,
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Dragging",
        defaultValue: defaultProps.enableDrag,
    },
    slideIntensity: {
        type: ControlType.Number,
        title: "Slide Intensity",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: defaultProps.slideIntensity,
    },
    flipOnClick: {
        type: ControlType.Boolean,
        title: "Flip on Click",
        defaultValue: defaultProps.flipOnClick,
    },
})
