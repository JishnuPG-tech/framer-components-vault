/*
             d8b         d8,   d8b          d8,                        
             ?88        `8P.   ?88         `8P                         
             88b               88b                                  
 d888b8b     888  d88'  88b.   888888b     88b  88bd88b   d8888b        
d8P' ?88     888bd8P'   88P.   88P `?8b    88P  88P'     d8P' ?88       
88b  ,88b    d88888b    d88    d88   88P   d88  d88       88b  d88       
`?88P'`88b  d88' `?88b, d88'   d88'   88b  d88' d88'       `?8888P'       

  Powered by Tim Akihiro Heinrich. 
  
  Visit https://www.framer.com/@akihiro/?tab=marketplace
*/

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

// User request: Rename ScrollBlurEssential.tsx to ScrollBlurByAki.tsx and rebrand component/export naming to ScrollBlurByAki without changing behavior, controls, defaults, or annotations.
interface MyComponentProps {
    direction: "bottom" | "top"
    blur: number
    quality: "low" | "balanced" | "high" | "custom"
    layers: number
}

type QualityMode = MyComponentProps["quality"]
type DirectionMode = MyComponentProps["direction"]

const LAYER_MIN = 1
const LAYER_MAX = 8

const QUALITY_LAYER_PRESETS: Record<Exclude<QualityMode, "custom">, number> = {
    low: 3,
    balanced: 4,
    high: 6,
}

function clampLayerCount(value: number): number {
    return Math.min(LAYER_MAX, Math.max(LAYER_MIN, Math.round(value)))
}

function resolveLayerCount(quality: QualityMode, customLayers: number): number {
    if (quality === "custom") return clampLayerCount(customLayers)
    return clampLayerCount(QUALITY_LAYER_PRESETS[quality])
}

function getMaskDirection(direction: DirectionMode): string {
    return direction === "top" ? "to bottom" : "to top"
}

function buildLayerMask(
    direction: DirectionMode,
    index: number,
    total: number
): string {
    const segment = 100 / total
    const edge = 100 - index * segment
    const softStart = Math.max(0, edge - segment)
    return `linear-gradient(${getMaskDirection(direction)}, rgba(255,255,255,1) 0%, rgba(255,255,255,1) ${softStart}%, rgba(255,255,255,0) ${edge}%)`
}

function buildLayerStyle(
    direction: DirectionMode,
    index: number,
    total: number,
    blur: number
): CSSProperties {
    const layerBlur = (blur * (index + 1)) / total
    const blurFilter = `blur(${layerBlur}px)`
    return {
        position: "absolute",
        inset: 0,
        backdropFilter: blurFilter,
        WebkitBackdropFilter: blurFilter,
        maskImage: buildLayerMask(direction, index, total),
        WebkitMaskImage: buildLayerMask(direction, index, total),
    }
}

/**
 * SCROLL BLUR BY AKI
 *
 * Lightweight static backdrop blur made from layered masks.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 200
 */
export default function ScrollBlurByAki(props: MyComponentProps) {
    const {
        direction = "bottom",
        blur = 12,
        quality = "balanced",
        layers = 4,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const effectiveLayers = resolveLayerCount(quality, layers)

    const layerElements = useMemo(() => {
        if (blur <= 0) return null
        const elements = []
        for (let i = 0; i < effectiveLayers; i++) {
            elements.push(
                <div
                    key={i}
                    style={buildLayerStyle(direction, i, effectiveLayers, blur)}
                />
            )
        }
        return elements
    }, [direction, blur, effectiveLayers])

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
    }

    const placeholderStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: "rgba(138,138,155,0.12)",
        borderRadius: 6,
        pointerEvents: "none",
    }

    return (
        <div style={containerStyle}>
            {layerElements}
            {isCanvas ? <div style={placeholderStyle} /> : null}
        </div>
    )
}

addPropertyControls(ScrollBlurByAki, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["bottom", "top"],
        optionTitles: ["↑", "↓"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        options: ["low", "balanced", "high", "custom"],
        optionTitles: ["Low", "Balanced", "High", "Custom"],
        defaultValue: "balanced",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    layers: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
        hidden: (props) => props.quality !== "custom",
    },
})
