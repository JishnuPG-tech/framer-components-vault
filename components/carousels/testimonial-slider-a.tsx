// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect } from "react"

interface Testimonial {
    quote: string
    name: string
    role: string
    img: string
}

const defaultTestimonials: Testimonial[] = [
    {
        quote: "Finally a design partner that ships fast and actually understands SaaS products.",
        name: "James Whitfield",
        role: "CEO at Lumio",
        img: "https://i.pravatar.cc/56?img=11",
    },
    {
        quote: "The redesign increased our trial-to-paid conversion by 23% in the first month.",
        name: "Sarah Okonkwo",
        role: "Head of Product at Stackra",
        img: "https://i.pravatar.cc/56?img=22",
    },
    {
        quote: "Sharp eye for detail, fast turnaround, and zero hand-holding needed.",
        name: "Marc Delvaux",
        role: "Co-founder at Briefd",
        img: "https://i.pravatar.cc/56?img=33",
    },
]

export default function TestimonialSlider(props) {
    const {
        testimonials: rawTestimonials,
        autoRotate = true,
        autoRotateDelay = 5000,
        accentColor = "#18181b",
        fontSize = 18,
        showBlob = true,
        blobColor = "#e879f9",
        blobOpacity = 0.18,
        blobSize = 420,
    } = props

    // Fix 1: hook de Framer para detectar canvas/exportación
    const isStatic = useIsStaticRenderer()

    // Fix 2: protección array vacío
    const testimonials =
        Array.isArray(rawTestimonials) && rawTestimonials.length > 0
            ? rawTestimonials
            : defaultTestimonials

    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        // Fix 1: no ejecutar timer en contexto estático
        if (isStatic || !autoRotate || paused) return
        const id = setInterval(() => {
            setActive((prev) => (prev + 1) % testimonials.length)
        }, autoRotateDelay)
        return () => clearInterval(id)
    }, [isStatic, autoRotate, paused, testimonials.length, autoRotateDelay])

    // Fix 2: asegurar que active nunca supera el array actual
    const safeActive = Math.min(active, testimonials.length - 1)

    const handleClick = (i: number) => {
        setActive(i)
        setPaused(true)
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    fontFamily: "Inter, sans-serif",
                    width: "100%",
                    textAlign: "center",
                    padding: "2rem 1rem",
                    position: "relative",
                    boxSizing: "border-box",
                }}
            >
                {showBlob && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: blobSize,
                            height: blobSize,
                            borderRadius: "50%",
                            background: `radial-gradient(ellipse at 50% 0%, ${blobColor} 0%, transparent 70%)`,
                            opacity: blobOpacity,
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />
                )}

                <div
                    style={{
                        height: 72,
                        position: "relative",
                        marginBottom: 24,
                        zIndex: 1,
                    }}
                >
                    {testimonials.map((t, i) => (
                        <img
                            key={i}
                            src={t.img}
                            width={56}
                            height={56}
                            style={{
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid rgba(0,0,0,0.08)",
                                position: "absolute",
                                left: "50%",
                                transform: `translateX(-50%) rotate(${
                                    safeActive === i
                                        ? "0deg"
                                        : safeActive > i
                                          ? "60deg"
                                          : "-60deg"
                                })`,
                                opacity: safeActive === i ? 1 : 0,
                                transition:
                                    "opacity 0.5s cubic-bezier(0.68,-0.3,0.32,1), transform 0.5s cubic-bezier(0.68,-0.3,0.32,1)",
                                pointerEvents: "none",
                            }}
                        />
                    ))}
                </div>

                <div
                    style={{
                        minHeight: 96,
                        position: "relative",
                        marginBottom: 24,
                        zIndex: 1,
                    }}
                >
                    {testimonials.map((t, i) => (
                        <p
                            key={i}
                            style={{
                                fontSize,
                                fontWeight: 500,
                                lineHeight: 1.6,
                                color: "#111",
                                position: "absolute",
                                width: "100%",
                                margin: 0,
                                opacity: safeActive === i ? 1 : 0,
                                transform: `translateX(${safeActive === i ? "0px" : safeActive > i ? "16px" : "-16px"})`,
                                transition:
                                    "opacity 0.4s ease, transform 0.4s ease",
                                pointerEvents:
                                    safeActive === i ? "auto" : "none",
                            }}
                        >
                            &ldquo;{t.quote}&rdquo;
                        </p>
                    ))}
                </div>

                <p
                    style={{
                        fontSize: 13,
                        color: "#888",
                        margin: "0 0 20px",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    {testimonials[safeActive].name} ·{" "}
                    {testimonials[safeActive].role}
                </p>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 8,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    {testimonials.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => handleClick(i)}
                            style={{
                                borderRadius: 999,
                                padding: "6px 14px",
                                fontSize: 12,
                                cursor: "pointer",
                                border: `1px solid ${safeActive === i ? accentColor : "rgba(0,0,0,0.12)"}`,
                                background:
                                    safeActive === i
                                        ? accentColor
                                        : "transparent",
                                color: safeActive === i ? "#fff" : "#555",
                                transition: "all 0.15s ease",
                                fontFamily: "inherit",
                            }}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TestimonialSlider, {
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto-rotate",
        defaultValue: true,
    },
    autoRotateDelay: {
        type: ControlType.Number,
        title: "Delay (ms)",
        defaultValue: 5000,
        min: 1000,
        max: 10000,
        step: 500,
        displayStepper: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Active color",
        defaultValue: "#18181b",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Quote size",
        defaultValue: 18,
        min: 14,
        max: 28,
        step: 1,
        displayStepper: true,
    },
    showBlob: {
        type: ControlType.Boolean,
        title: "Show blob",
        defaultValue: true,
    },
    blobColor: {
        type: ControlType.Color,
        title: "Blob color",
        defaultValue: "#e879f9",
    },
    blobOpacity: {
        type: ControlType.Number,
        title: "Blob opacity",
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
    },
    blobSize: {
        type: ControlType.Number,
        title: "Blob size",
        defaultValue: 420,
        min: 200,
        max: 800,
        step: 10,
        displayStepper: true,
    },
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote" },
                name: { type: ControlType.String, title: "Name" },
                role: { type: ControlType.String, title: "Role" },
                img: { type: ControlType.Image, title: "Photo" },
            },
        },
    },
})
