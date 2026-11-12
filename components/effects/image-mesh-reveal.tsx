import * as React from "react"
import { motion, useAnimation, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FitMode = "fill" | "fit" // (kept for back-compat; not used to drive sizing)
type DimensionMode = "natural" | "ratio"

interface Props {
    image: string
    triggerOn: "mount" | "hover" | "inView"
    duration: number
    borderRadius: number
    gridSize: number
    depth: number
    delayVariance: number
    backgroundColor: string

    // legacy toggles (kept for compatibility, but sizing is controlled by panel or dimensionMode)
    widthMode?: FitMode
    heightMode?: FitMode

    // how to derive aspect/size when panel doesn't provide it
    dimensionMode?: DimensionMode
    ratioW?: number
    ratioH?: number

    // Framer-injected
    style?: React.CSSProperties
}

export default function QuantumMeshReveal(props: Props) {
    const {
        image,
        triggerOn,
        duration,
        borderRadius,
        gridSize,
        depth,
        delayVariance,
        backgroundColor,
        widthMode = "fill",
        heightMode = "fill",
        dimensionMode = "natural",
        ratioW = 3,
        ratioH = 2,
        style,
    } = props

    const wrapperRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(wrapperRef, { once: true, margin: "-10%" })
    const controls = useAnimation()

    // live measured box size (from ResizeObserver, not window resize)
    const [box, setBox] = React.useState<{ w: number; h: number }>({
        w: 1,
        h: 1,
    })
    // image natural size
    const [imgNatural, setImgNatural] = React.useState<{
        w: number
        h: number
    } | null>(null)

    // Observe wrapper size
    React.useLayoutEffect(() => {
        if (!wrapperRef.current) return
        const el = wrapperRef.current
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            const w = Math.max(1, Math.round(r.width))
            const h = Math.max(1, Math.round(r.height))
            setBox({ w, h })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Load image natural size
    React.useEffect(() => {
        if (!image) {
            setImgNatural(null)
            return
        }
        const img = new Image()
        img.onload = () =>
            setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
        img.src = image
    }, [image])

    // Trigger logic
    React.useEffect(() => {
        if (triggerOn === "inView" && inView) controls.start("visible")
        else if (triggerOn === "mount") controls.start("visible")
    }, [inView, triggerOn, controls])

    // grid & overlap
    const rows = Math.max(1, Math.floor(gridSize))
    const cols = Math.max(1, Math.floor(gridSize))
    const overlap = 0.3
    const tileWidthPct = 100 / cols + overlap
    const tileHeightPct = 100 / rows + overlap

    // Aspect helpers
    const naturalW = imgNatural?.w ?? 1
    const naturalH = imgNatural?.h ?? 1
    const naturalRatio = naturalW / naturalH || 1.5
    const customRatio = ratioW / ratioH || 1.5
    const chosenRatio = dimensionMode === "ratio" ? customRatio : naturalRatio

    // Panel constraints detection
    const hasPanelW = style?.width !== undefined && style?.width !== null
    const hasPanelH = style?.height !== undefined && style?.height !== null

    /**
     * Sizing rules:
     * - If the Framer panel provides width and/or height, we respect that and FILL the given box.
     *   If only one side is provided, we use CSS aspect-ratio to infer the other.
     * - If the panel provides neither:
     *   - dimensionMode = "natural": use natural px (once known). Before load, we give a minimal 1×1 to avoid collapse.
     *   - dimensionMode = "ratio": responsive box with aspect-ratio and width:100%.
     */
    const wrapperStyle: React.CSSProperties = (() => {
        // Start from panel style so user-overrides (fixed/percent) are respected.
        const base: React.CSSProperties = {
            ...style,
            position: "relative",
            overflow: "hidden",
            borderRadius,
            backgroundColor,
            display: "block",
        }

        if (hasPanelW || hasPanelH) {
            // Respect panel sizing. If one side missing, infer via aspect-ratio.
            if (!hasPanelH) {
                // Width only -> make height from ratio
                base.aspectRatio = chosenRatio
            } else if (!hasPanelW) {
                // Height only -> width from ratio
                base.aspectRatio = chosenRatio
                // If width isn't set, let it auto-expand; Framer commonly sets width, but just in case:
                if (base.width === undefined) base.width = "auto"
            }
            // Nothing else to do; tiles will "cover" this measured box.
            return base
        }

        // No panel constraints
        if (dimensionMode === "natural") {
            // Use natural px when available; fall back to a tiny box until image loads.
            base.width = `${naturalW}px`
            base.height = `${naturalH}px`
            return base
        } else {
            // dimensionMode === "ratio" → responsive
            base.width = base.width ?? "100%"
            base.aspectRatio = chosenRatio
            // If parent constrains height, aspect-ratio will cooperate; otherwise this is a responsive box.
            return base
        }
    })()

    // COVER math uses current measured box
    const iw = naturalW
    const ih = naturalH
    const scale = Math.max(box.w / iw, box.h / ih)
    const displayW = iw * scale
    const displayH = ih * scale
    const offsetX = (box.w - displayW) / 2
    const offsetY = (box.h - displayH) / 2

    // tiles
    const tiles: JSX.Element[] = []
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const delay = Math.random() * delayVariance
            const tileLeftPx = (x * box.w) / cols
            const tileTopPx = (y * box.h) / rows
            const posX = offsetX - tileLeftPx
            const posY = offsetY - tileTopPx

            tiles.push(
                <motion.div
                    key={`${x}-${y}`}
                    variants={{
                        hidden: {
                            opacity: 0,
                            scale: 0.8,
                            rotateX: (Math.random() - 0.5) * depth,
                            rotateY: (Math.random() - 0.5) * depth,
                            filter: "blur(10px)",
                            y: (Math.random() - 0.5) * 80,
                        },
                        visible: {
                            opacity: 1,
                            scale: 1,
                            rotateX: 0,
                            rotateY: 0,
                            filter: "blur(0px)",
                            y: 0,
                            transition: {
                                duration,
                                delay,
                                ease: [0.22, 1, 0.36, 1],
                            },
                        },
                    }}
                    style={{
                        position: "absolute",
                        top: `${y * (100 / rows) - overlap / 2}%`,
                        left: `${x * (100 / cols) - overlap / 2}%`,
                        width: `${tileWidthPct}%`,
                        height: `${tileHeightPct}%`,
                        backgroundImage: `url(${image})`,
                        backgroundSize: `${displayW}px ${displayH}px`,
                        backgroundPosition: `${posX}px ${posY}px`,
                        backgroundRepeat: "no-repeat",
                        transformOrigin: "center",
                        backfaceVisibility: "hidden",
                        boxSizing: "border-box",
                        backgroundClip: "content-box",
                    }}
                />
            )
        }
    }

    const animationProps =
        triggerOn === "hover"
            ? { whileHover: "visible", initial: "hidden" }
            : { animate: controls, initial: "hidden" }

    return (
        <div ref={wrapperRef} style={wrapperStyle}>
            <motion.div
                {...animationProps}
                style={{
                    position: "absolute",
                    inset: 0,
                    perspective: 1200,
                    transformStyle: "preserve-3d",
                    overflow: "hidden",
                    borderRadius,
                }}
            >
                {tiles}
            </motion.div>
        </div>
    )
}

QuantumMeshReveal.defaultProps = {
    image: "",
    triggerOn: "mount",
    duration: 0.9,
    borderRadius: 12,
    gridSize: 8,
    depth: 60,
    delayVariance: 0.6,
    backgroundColor: "#000000",
    widthMode: "fill",
    heightMode: "fill",
    dimensionMode: "natural",
    ratioW: 3,
    ratioH: 2,
}

addPropertyControls(QuantumMeshReveal, {
    image: { title: "Image", type: ControlType.Image },
    triggerOn: {
        title: "Trigger",
        type: ControlType.Enum,
        options: ["mount", "hover", "inView"],
        optionTitles: ["On Load", "On Hover", "In View"],
    },
    duration: {
        title: "Duration",
        type: ControlType.Number,
        min: 0.2,
        max: 5,
        step: 0.1,
    },
    gridSize: {
        title: "Grid Size",
        type: ControlType.Number,
        min: 2,
        max: 20,
        step: 1,
    },
    depth: {
        title: "Depth",
        type: ControlType.Number,
        min: 10,
        max: 200,
        step: 1,
    },
    delayVariance: {
        title: "Delay Randomness",
        type: ControlType.Number,
        min: 0,
        max: 2,
        step: 0.1,
    },
    borderRadius: {
        title: "Radius",
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 1,
    },
    backgroundColor: { title: "Background", type: ControlType.Color },

    widthMode: {
        title: "Width (legacy)",
        type: ControlType.Enum,
        options: ["fill", "fit"],
        optionTitles: ["Fill (100%)", "Fit (image)"],
    },
    heightMode: {
        title: "Height (legacy)",
        type: ControlType.Enum,
        options: ["fill", "fit"],
        optionTitles: ["Fill (100%)", "Fit (image)"],
    },

    dimensionMode: {
        title: "Aspect Source",
        type: ControlType.Enum,
        options: ["natural", "ratio"],
        optionTitles: ["Image Natural", "Custom Ratio"],
    },
    ratioW: {
        title: "Ratio W",
        type: ControlType.Number,
        min: 1,
        max: 100,
        step: 1,
        hidden: (p) => p.dimensionMode !== "ratio",
    },
    ratioH: {
        title: "Ratio H",
        type: ControlType.Number,
        min: 1,
        max: 100,
        step: 1,
        hidden: (p) => p.dimensionMode !== "ratio",
    },
})
