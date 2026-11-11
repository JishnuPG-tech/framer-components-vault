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


type Direction = "bottomToTop" | "topToBottom" | "leftToRight" | "rightToLeft"

interface GradientDepthBlurProps {
    blurMax: number
    maxBlurAt: number
    direction: Direction
    backgroundColor: string
    backgroundOpacity: number
    saturation: number
    enableNoise: boolean
    noiseOpacity: number
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerDisableUnlink
 */
export default function GradientDepthBlur(props: GradientDepthBlurProps) {
    const isStatic = useIsStaticRenderer()

    const {
        blurMax,
        maxBlurAt,
        direction,
        backgroundColor,
        backgroundOpacity,
        saturation = 180,
        enableNoise = false,
        noiseOpacity = 0.05,
        style,
    } = props

    const getGradientDirection = (dir: Direction) => {
        switch (dir) {
            case "bottomToTop":
                return "to top"
            case "topToBottom":
                return "to bottom"
            case "leftToRight":
                return "to right"
            case "rightToLeft":
                return "to left"
        }
    }

    const cssDirection = getGradientDirection(direction)
    const p = Math.max(0, Math.min(100, maxBlurAt))
    const validBackgroundOpacity = Math.max(0, Math.min(1, backgroundOpacity))

    // Zajednička maska za Canvas preview i Live verziju
    const globalMaskImage = React.useMemo(() => {
        const stopsCount = 32
        const stops: string[] = []

        for (let i = 0; i <= stopsCount; i++) {
            const t = i / stopsCount
            const alpha = -(Math.cos(Math.PI * t) - 1) / 2
            const position = t * p
            stops.push(
                `rgba(0,0,0,${alpha.toFixed(4)}) ${position.toFixed(2)}%`
            )
        }

        stops.push(`rgba(0,0,0,1) ${p < 100 ? "100%" : "101%"}`)
        return `linear-gradient(${cssDirection}, ${stops.join(", ")})`
    }, [cssDirection, p])

    // Renderiranje zajedničkih dodataka (Noise i Tint)
    const renderAddons = () => (
        <>
            {/* Grayscale Procedural Noise */}
            {enableNoise && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: noiseOpacity,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        pointerEvents: "none",
                        maskImage: globalMaskImage,
                        WebkitMaskImage: globalMaskImage,
                    }}
                />
            )}

            {/* Tint Sloj */}
            {validBackgroundOpacity > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: backgroundColor,
                        opacity: validBackgroundOpacity,
                        pointerEvents: "none",
                        maskImage: globalMaskImage,
                        WebkitMaskImage: globalMaskImage,
                    }}
                />
            )}
        </>
    )

    // Ako smo u Framer editoru (Canvas), renderiraj samo 1 sloj blura za visoke performanse
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    ...style,
                    minWidth: 5,
                    minHeight: 5,
                    transform: "translateZ(0)",
                }}
            >
                {/* 1-Layer Preview Blur umjesto 8 slojeva */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backdropFilter: `blur(${blurMax}px) saturate(${saturation}%)`,
                        WebkitBackdropFilter: `blur(${blurMax}px) saturate(${saturation}%)`,
                        maskImage: globalMaskImage,
                        WebkitMaskImage: globalMaskImage,
                        pointerEvents: "none",
                    }}
                />

                {renderAddons()}
            </div>
        )
    }

    // Live verzija: Apple Multi-Layered Depth Blur Engine (8 slojeva)
    const renderLayeredBlur = () => {
        const LAYER_COUNT = 8
        const layers = []

        for (let i = 1; i <= LAYER_COUNT; i++) {
            const progress = i / LAYER_COUNT
            const layerBlur = Math.pow(progress, 2) * blurMax

            const stopStart = Math.max(0, ((i - 1) / LAYER_COUNT) * p)
            const stopEnd = (i / LAYER_COUNT) * p

            const mask = `linear-gradient(${cssDirection}, transparent 0%, transparent ${stopStart.toFixed(
                2
            )}%, black ${stopEnd.toFixed(2)}%, black 100%)`

            layers.push(
                <div
                    key={i}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        backdropFilter: `blur(${layerBlur.toFixed(1)}px) saturate(${saturation}%)`,
                        WebkitBackdropFilter: `blur(${layerBlur.toFixed(1)}px) saturate(${saturation}%)`,
                        maskImage: mask,
                        WebkitMaskImage: mask,
                        pointerEvents: "none",
                    }}
                />
            )
        }
        return layers
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
                minWidth: 5,
                minHeight: 5,
                transform: "translateZ(0)",
            }}
        >
            {renderLayeredBlur()}
            {renderAddons()}
        </div>
    )
}

addPropertyControls(GradientDepthBlur, {
    blurMax: {
        type: ControlType.Number,
        title: "Max Blur",
        defaultValue: 30,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    maxBlurAt: {
        type: ControlType.Number,
        title: "Fade Range",
        defaultValue: 87,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "bottomToTop",
        options: ["bottomToTop", "topToBottom", "leftToRight", "rightToLeft"],
        optionTitles: ["🡡", "🡣", "🡢", "🡠"],
        displaySegmentedControl: true,
    },
    saturation: {
        type: ControlType.Number,
        title: "Vibrancy",
        defaultValue: 180,
        min: 100,
        max: 300,
        step: 10,
        unit: "%",
    },
    enableNoise: {
        type: ControlType.Boolean,
        title: "Noise/Grain",
        defaultValue: true,
    },
    noiseOpacity: {
        type: ControlType.Number,
        title: "Noise Amount",
        defaultValue: 0.05,
        min: 0.01,
        max: 0.3,
        step: 0.01,
        hidden: (props) => !props.enableNoise,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#111111",
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "BG Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/?tab=marketplace), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
