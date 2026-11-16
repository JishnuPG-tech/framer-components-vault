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


const KEYFRAMES_CSS = `
@keyframes orb-morph {
  0%, 100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
  25% { border-radius: 58% 42% 35% 65% / 55% 65% 35% 45%; }
  50% { border-radius: 50% 50% 50% 50% / 60% 40% 60% 40%; }
  75% { border-radius: 65% 35% 45% 55% / 40% 50% 50% 60%; }
}
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
@keyframes orb-breathe-active {
  0%, 100% { transform: scale(1.08); }
  50% { transform: scale(1.18); }
}
@keyframes orb-hue {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
`

export default function AIOrbLite(props: any) {
    const {
        colorA = "#8b5cf6",
        colorB = "#22d3ee",
        colorC = "#0ea5e9",
        glowIntensity = 0.6,
        mode = "autoplay",
        cycleDuration = 3000,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [reducedMotion, setReducedMotion] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        setReducedMotion(
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
    }, [])

    const [active, setActive] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isCanvas || reducedMotion || mode !== "autoplay") return
        const interval = setInterval(() => setActive((a) => !a), cycleDuration)
        return () => clearInterval(interval)
    }, [isCanvas, reducedMotion, mode, cycleDuration])

    const handleMouseEnter = () => {
        if (mode === "hover") setActive(true)
    }
    const handleMouseLeave = () => {
        if (mode === "hover") setActive(false)
    }
    const handleClick = () => {
        if (mode === "click") setActive((a) => !a)
    }

    const animated = !isCanvas && !reducedMotion
    const glowBlur = 20 + glowIntensity * 60 * (active ? 1.5 : 1)
    const glowOpacity = 0.35 + glowIntensity * 0.4 * (active ? 1.3 : 1)

    return (
        <div
            ref={rootRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 160,
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: mode === "click" ? "pointer" : "default",
            }}
        >
            <style>{KEYFRAMES_CSS}</style>
            <div
                style={{
                    position: "relative",
                    width: "60%",
                    height: "60%",
                    minWidth: 60,
                    minHeight: 60,
                    maxWidth: 320,
                    maxHeight: 320,
                    aspectRatio: "1",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: "-20%",
                        borderRadius: "50%",
                        background: colorA,
                        opacity: glowOpacity,
                        filter: `blur(${glowBlur}px)`,
                        transition: "opacity 0.6s ease, filter 0.6s ease",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 30% 30%, ${colorB}, ${colorA} 55%, ${colorC} 100%)`,
                        animation: animated
                            ? `${active ? "orb-breathe-active" : "orb-breathe"} ${active ? "1.6s" : "3.2s"} ease-in-out infinite, orb-morph ${active ? "4s" : "8s"} ease-in-out infinite, orb-hue 12s linear infinite`
                            : "none",
                        transform: active ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.6s ease",
                    }}
                />
            </div>
        </div>
    )
}

AIOrbLite.displayName = "AI Orb Lite"

addPropertyControls(AIOrbLite, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["autoplay", "hover", "click"],
        optionTitles: ["Auto-Cycle", "On Hover", "On Click"],
        defaultValue: "autoplay",
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Cycle Every (ms)",
        defaultValue: 3000,
        min: 1000,
        max: 10000,
        step: 100,
        hidden: (p: any) => p.mode !== "autoplay",
    },
    colorA: {
        type: ControlType.Color,
        title: "Color A",
        defaultValue: "#8b5cf6",
    },
    colorB: {
        type: ControlType.Color,
        title: "Color B",
        defaultValue: "#22d3ee",
    },
    colorC: {
        type: ControlType.Color,
        title: "Color C",
        defaultValue: "#0ea5e9",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
