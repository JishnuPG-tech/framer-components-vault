import { useEffect, useRef, useState } from "react"
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
 * Service Stack — layers isométricos que se abren al entrar al viewport.
 * Cada layer representa un servicio: en hover hace fade a su color y
 * muestra el título con una línea de conexión.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 640
 */

export default function ServiceStack(props) {
    const {
        services,
        size,
        spacing,
        tilt,
        duration,
        stagger,
        openFrom,
        once,
        idle,
        glow,
        glowColor,
        labels,
        labelColor,
        labelSize,
        channel,
        style,
    } = props

    const wrapRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [hov, setHov] = useState(-1)
    const seenRef = useRef(false)

    // hover sincronizado con los ServiceTitle vía eventos
    const hover = (i: number) => {
        setHov(i)
        if (typeof window !== "undefined")
            window.dispatchEvent(
                new CustomEvent(`ss-hover-${channel}`, { detail: i })
            )
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const fn = (e: any) => setHov(e.detail)
        window.addEventListener(`st-hover-${channel}`, fn)
        return () => window.removeEventListener(`st-hover-${channel}`, fn)
    }, [channel])

    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        seenRef.current = true
                        setOpen(true)
                    } else if (!once) {
                        setOpen(false)
                    }
                }
            },
            { threshold: 0.45 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [once])

    const items =
        services && services.length
            ? services
            : [
                  { title: "Paid Media & Growth", color: "#E5383B" },
                  { title: "Social Content Engine", color: "#9D4EDD" },
                  { title: "Brand & Product Content", color: "#4BC0FF" },
                  { title: "SEO, Email & SMS", color: "#1D9E75" },
              ]
    const n = items.length

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
            }}
        >
            <style>{`
                @keyframes ssBob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
                }
            `}</style>

            {glow > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "32%",
                        width: "70%",
                        aspectRatio: "1",
                        transform: "translate(-50%,-50%)",
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
                        opacity: glow * (open ? 1 : 0.3),
                        transition: `opacity ${duration}s ease`,
                        filter: "blur(30px)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {items.map((s, i) => {
                const offset = (i - (n - 1) / 2) * spacing
                // posición cerrada: todos apilados en el origen del acordeón
                const closedOffset =
                    openFrom === "bottom"
                        ? ((n - 1) / 2) * spacing
                        : openFrom === "top"
                          ? (-(n - 1) / 2) * spacing
                          : 0
                // orden de apertura: desde el origen hacia afuera
                const orderIdx = openFrom === "bottom" ? n - 1 - i : i
                const isHov = hov === i
                const dimmed = hov !== -1 && !isHov
                const delay = open
                    ? orderIdx * stagger
                    : (n - 1 - orderIdx) * stagger * 0.5
                const sideRight = i % 2 === 0

                return (
                    <div key={i}>
                        {/* capa: posición (entrada) */}
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${size}%`,
                                aspectRatio: "1",
                                zIndex: i + 1,
                                transform: `translate(-50%,-50%) translateY(${open ? offset : closedOffset}px) scale(${open ? 1 : 0.88})`,
                                transition: `transform ${duration}s cubic-bezier(0.22, 1.2, 0.36, 1) ${delay}s`,
                                pointerEvents: "none",
                            }}
                        >
                            {/* capa: flotación idle */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    animation: idle
                                        ? `ssBob ${4 + i * 0.7}s ease-in-out ${i * 0.4}s infinite`
                                        : "none",
                                }}
                            >
                                {/* capa: rombo + color */}
                                <div
                                    onPointerEnter={() => hover(i)}
                                    onPointerLeave={() => hover(-1)}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        pointerEvents: "auto",
                                        cursor: "pointer",
                                        borderRadius: "20%",
                                        transform: `rotateX(${tilt}deg) rotateZ(45deg) ${isHov ? "translateZ(14px)" : ""}`,
                                        background: isHov
                                            ? `linear-gradient(180deg, ${s.color}E6 0%, ${s.color}55 100%)`
                                            : "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)",
                                        border: isHov
                                            ? `1px solid ${s.color}`
                                            : "1px solid rgba(255,255,255,0.10)",
                                        boxShadow: isHov
                                            ? `0 0 70px 6px ${s.color}40`
                                            : "none",
                                        opacity: open
                                            ? dimmed
                                                ? 0.45
                                                : 1
                                            : 0.85,
                                        transition: `background 0.55s ease, border 0.55s ease, box-shadow 0.55s ease, opacity 0.45s ease, transform 0.45s ease`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* título del servicio en hover (opcional si usas ServiceTitle) */}
                        {labels && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: `calc(50% + ${offset}px)`,
                                    left: sideRight ? "auto" : "0%",
                                    right: sideRight ? "0%" : "auto",
                                    transform: `translateY(-50%) translateX(${isHov ? 0 : sideRight ? 12 : -12}px)`,
                                    display: "flex",
                                    flexDirection: sideRight
                                        ? "row-reverse"
                                        : "row",
                                    alignItems: "center",
                                    gap: 10,
                                    opacity: isHov ? 1 : 0,
                                    transition:
                                        "opacity 0.4s ease, transform 0.4s ease",
                                    pointerEvents: "none",
                                    zIndex: 50,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily:
                                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                                        fontSize: labelSize,
                                        letterSpacing: "0.06em",
                                        color: labelColor,
                                        whiteSpace: "nowrap",
                                        background: "rgba(0,0,0,0.55)",
                                        border: `1px solid ${s.color}66`,
                                        borderRadius: 8,
                                        padding: "6px 12px",
                                    }}
                                >
                                    {s.title}
                                </span>
                                <span
                                    style={{
                                        width: 46,
                                        height: 1,
                                        background: s.color,
                                        opacity: 0.8,
                                    }}
                                />
                                <span
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: s.color,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

ServiceStack.displayName = "Service Stack"

ServiceStack.defaultProps = {
    services: [
        { title: "Paid Media & Growth", color: "#E5383B" },
        { title: "Social Content Engine", color: "#9D4EDD" },
        { title: "Brand & Product Content", color: "#4BC0FF" },
        { title: "SEO, Email & SMS", color: "#1D9E75" },
    ],
    size: 62,
    spacing: 64,
    tilt: 58,
    duration: 0.9,
    stagger: 0.1,
    openFrom: "bottom",
    once: true,
    idle: true,
    glow: 0.5,
    glowColor: "#E5383B",
    labels: false,
    labelColor: "#FFFFFF",
    labelSize: 12,
    channel: "services",
}

addPropertyControls(ServiceStack, {
    services: {
        type: ControlType.Array,
        title: "Servicies",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Título",
                    defaultValue: "Servicio",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#E5383B",
                },
            },
        },
        defaultValue: [
            { title: "Paid Media & Growth", color: "#E5383B" },
            { title: "Social Content Engine", color: "#9D4EDD" },
            { title: "Brand & Product Content", color: "#4BC0FF" },
            { title: "SEO, Email & SMS", color: "#1D9E75" },
        ],
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 30,
        max: 90,
        step: 1,
        defaultValue: 62,
        unit: "%",
    },
    spacing: {
        type: ControlType.Number,
        title: "Separation",
        min: 20,
        max: 140,
        step: 2,
        defaultValue: 64,
        unit: "px",
    },
    tilt: {
        type: ControlType.Number,
        title: "Inclination",
        min: 40,
        max: 72,
        step: 1,
        defaultValue: 58,
        unit: "°",
    },
    duration: {
        type: ControlType.Number,
        title: "Lenght",
        min: 0.3,
        max: 2,
        step: 0.05,
        defaultValue: 0.9,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.1,
        unit: "s",
    },
    openFrom: {
        type: ControlType.Enum,
        title: "Open from",
        options: ["bottom", "center", "top"],
        optionTitles: ["Abajo", "Centro", "Arriba"],
        defaultValue: "bottom",
    },
    once: {
        type: ControlType.Boolean,
        title: "Once",
        defaultValue: true,
    },
    idle: {
        type: ControlType.Boolean,
        title: "Float",
        defaultValue: true,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Color glow",
        defaultValue: "#E5383B",
    },
    labels: {
        type: ControlType.Boolean,
        title: "Tags",
        defaultValue: false,
    },
    channel: {
        type: ControlType.String,
        title: "Canal",
        defaultValue: "services",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.labels,
    },
    labelSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 9,
        max: 20,
        step: 1,
        defaultValue: 12,
        unit: "px",
        hidden: (p) => !p.labels,
    },
})
