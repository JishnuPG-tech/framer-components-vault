import * as React from "react"
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
 * NEON BLOOM VIDEO
 * Efeito de "neon bloom" em tempo real sobre um vídeo: bloom, color grade e grão.
 *
 * Performance: o play/pause é controlado por IntersectionObserver — só toca
 * quando o componente está visível na viewport e pausa ao sair. A camada de
 * bloom (2º vídeo) só é montada enquanto visível. Toda a configuração fica em
 * useEffect com cleanup; não há listeners globais (a interação é tratada no
 * próprio componente).
 *
 * OBS: filtros SVG (url()) não renderizam em <video> no Chrome, então o bloom
 * usa DUAS camadas de vídeo + filtros CSS (base + cópia borrada em "screen").
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 */

const LOOKS = {
    cyberpunk: { saturation: 1.6, contrast: 1.2, brightness: 1.0, hue: -12 },
    vaporwave: { saturation: 1.45, contrast: 1.05, brightness: 1.05, hue: -55 },
    toxic: { saturation: 1.7, contrast: 1.15, brightness: 1.0, hue: 75 },
    ember: { saturation: 1.5, contrast: 1.2, brightness: 1.0, hue: 18 },
    ice: { saturation: 1.3, contrast: 1.12, brightness: 1.06, hue: 160 },
    mono: { saturation: 0, contrast: 1.35, brightness: 1.05, hue: 0 },
}

export default function NeonBloomVideo(props) {
    const {
        video,
        fit = "cover",
        look = "custom",
        bloom = 0.9,
        bloomSize = 14,
        threshold = 0.6,
        saturation = 1.4,
        contrast = 1.1,
        brightness = 1,
        hue = 0,
        grainAmount = 0.1,
        radius = 0,
        background = "#05030A",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const grainId = `nbgrain-${uid}`

    const containerRef = React.useRef<any>(null)
    const baseRef = React.useRef<any>(null)
    const bloomRef = React.useRef<any>(null)
    const [inView, setInView] = React.useState(false)
    const [needsTap, setNeedsTap] = React.useState(false)

    const g =
        look === "custom"
            ? { saturation, contrast, brightness, hue }
            : (() => {
                  const L = LOOKS[look] || LOOKS.cyberpunk
                  return {
                      saturation: Math.max(
                          0,
                          L.saturation + (saturation - 1.4)
                      ),
                      contrast: Math.max(0, L.contrast + (contrast - 1.1)),
                      brightness: Math.max(0, L.brightness + (brightness - 1)),
                      hue: L.hue + hue,
                  }
              })()

    // Detecção de visibilidade: cria o observer em useEffect e o desconecta no
    // cleanup (sem listeners residuais).
    React.useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(!!entries[0] && entries[0].isIntersecting),
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Toca só quando visível; pausa ao sair da viewport.
    React.useEffect(() => {
        if (isStatic) return
        const vids = [baseRef.current, bloomRef.current].filter(Boolean)
        vids.forEach((v) => {
            try {
                v.muted = true
                v.defaultMuted = true
                v.playsInline = true
            } catch (e) {}
        })
        if (inView) {
            vids.forEach((v) => {
                try {
                    const p = v.play()
                    if (p && p.catch) p.catch(() => setNeedsTap(true))
                } catch (e) {}
            })
        } else {
            vids.forEach((v) => {
                try {
                    v.pause()
                } catch (e) {}
            })
        }
    }, [inView, isStatic, video, bloom])

    // Fallback de autoplay bloqueado: tratado DENTRO do componente (toque nele),
    // sem listeners globais no window.
    const handleTap = () => {
        const vids = [baseRef.current, bloomRef.current].filter(Boolean)
        vids.forEach((v) => {
            try {
                v.muted = true
                const p = v.play()
                if (p && p.catch) p.catch(() => {})
            } catch (e) {}
        })
        setNeedsTap(false)
    }

    const wrapperStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 200,
        aspectRatio: "16 / 9",
        overflow: "hidden",
        borderRadius: radius,
        background,
        ...style,
    }

    const videoBaseStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit as any,
        display: "block",
        filter: `saturate(${g.saturation}) contrast(${g.contrast}) brightness(${g.brightness}) hue-rotate(${g.hue}deg)`,
    }

    const bloomLayerStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: fit as any,
        display: "block",
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: Math.min(1, bloom),
        filter: `blur(${bloomSize}px) brightness(${(0.5 + bloom).toFixed(2)}) contrast(${(1 + threshold * 3).toFixed(2)}) saturate(${(g.saturation * 1.3).toFixed(2)}) hue-rotate(${g.hue}deg)`,
    }

    const overlayBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
    }

    const videoProps = {
        src: video || undefined,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "auto" as const,
    }

    return (
        <div ref={containerRef} style={wrapperStyle} onPointerDown={handleTap}>
            {video ? (
                <>
                    <video
                        ref={baseRef}
                        key={video + "-base"}
                        style={videoBaseStyle}
                        {...videoProps}
                    />
                    {bloom > 0 && (isStatic || inView) && (
                        <video
                            ref={bloomRef}
                            key={video + "-bloom"}
                            style={bloomLayerStyle}
                            {...videoProps}
                        />
                    )}
                </>
            ) : (
                <div
                    style={{
                        ...overlayBase,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff88",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        background:
                            "radial-gradient(circle at 50% 40%, #2a1150, #05030A)",
                    }}
                >
                    Drop a video →
                </div>
            )}

            {needsTap && (
                <div
                    style={{
                        ...overlayBase,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            padding: "10px 18px",
                            borderRadius: 999,
                            fontFamily: "Inter, sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                        }}
                    >
                        ► Tap to play
                    </div>
                </div>
            )}

            {grainAmount > 0 && (
                <div
                    style={{
                        ...overlayBase,
                        filter: `url(#${grainId})`,
                        opacity: grainAmount,
                        mixBlendMode: "overlay",
                    }}
                />
            )}

            <svg
                width="0"
                height="0"
                style={{ position: "absolute", width: 0, height: 0 }}
                aria-hidden
            >
                <defs>
                    <filter
                        id={grainId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.9"
                            numOctaves="2"
                            seed="4"
                            stitchTiles="stitch"
                            result="g"
                        />
                        <feColorMatrix
                            in="g"
                            type="matrix"
                            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0.7 0.7 0 0"
                        />
                    </filter>
                </defs>
            </svg>
        </div>
    )
}

addPropertyControls(NeonBloomVideo, {
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: [
            "custom",
            "cyberpunk",
            "vaporwave",
            "toxic",
            "ember",
            "ice",
            "mono",
        ],
        optionTitles: [
            "Custom",
            "Cyberpunk",
            "Vaporwave",
            "Toxic",
            "Ember",
            "Ice",
            "Mono",
        ],
        defaultValue: "custom",
        description:
            "Ready-made color grades. The sliders below fine-tune on top of the preset.",
    },
    bloom: {
        type: ControlType.Number,
        title: "Bloom",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.9,
        description: "Intensity of the glowing light",
    },
    bloomSize: {
        type: ControlType.Number,
        title: "Bloom radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 14,
    },
    threshold: {
        type: ControlType.Number,
        title: "Threshold",
        min: 0,
        max: 0.95,
        step: 0.01,
        defaultValue: 0.6,
        description: "Higher = only the brightest areas bloom",
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.4,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1.1,
    },
    brightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0.3,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    hue: {
        type: ControlType.Number,
        title: "Hue",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
        unit: "°",
    },
    grainAmount: {
        type: ControlType.Number,
        title: "Grain",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    radius: {
        type: ControlType.Number,
        title: "Corners",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 0,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#05030A",
    },
})
