// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

// =======================
// Types
// =======================
type ZoomControllerConfig = {
    position: "bottom-left" | "bottom-center" | "bottom-right"
    bg: string
    color: string
    buttonBg: string
    radius: number
    gap: number
    textSize: number
    iconSize: number
    padding: number
    percentBg: string
    percentColor: string
}

type ShadowSettings = {
    color: string
    opacity: number
    offsetX: number
    offsetY: number
    blur: number
    spread: number
}

// =======================
// Defaults
// =======================
const defaultController: ZoomControllerConfig = {
    position: "bottom-center",
    bg: "rgba(20,20,20,0.6)",
    color: "#FFFFFF",
    buttonBg: "rgba(255,255,255,0.08)",
    radius: 10,
    gap: 8,
    textSize: 12,
    iconSize: 16,
    padding: 8,
    percentBg: "rgba(255,255,255,0.08)",
    percentColor: "#FFFFFF",
}

const defaultShadow: ShadowSettings = {
    color: "#000000",
    opacity: 0.25,
    offsetX: 0,
    offsetY: 4,
    blur: 16,
    spread: 0,
}

// =======================
// Component
// =======================
/**
 * @framerIntrinsicHeight 800
 * @framerIntrinsicWidth 800
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InteractiveCanvas({
    content,
    zoom,
    minZoom,
    maxZoom,
    zoomStep,
    zoomController,
    shadowEnabled,
    shadow,
}: {
    content: React.ReactNode
    zoom: number
    minZoom: number
    maxZoom: number
    zoomStep: number
    zoomController?: Partial<ZoomControllerConfig>
    shadowEnabled?: boolean
    shadow?: Partial<ShadowSettings>
}) {
    const cfg: ZoomControllerConfig = {
        ...defaultController,
        ...zoomController,
    }
    const sh: ShadowSettings = { ...defaultShadow, ...(shadow ?? {}) }
    const shadowOn = !!shadowEnabled

    // Derived metrics
    // R1 + D = R2  =>  innerRadius (R1) = max(outerRadius (R2) - padding (D), 0)
    const innerRadius = Math.max(cfg.radius - cfg.padding, 0)

    // Refs
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const frameRef = useRef<HTMLDivElement | null>(null)

    const zoomBehaviorRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(
        null
    )
    const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity)

    // State
    const [isDragging, setIsDragging] = useState(false)
    const [currentZoom, setCurrentZoom] = useState(zoom ?? 1)

    // Helpers
    const toRGBA = (color: string, alpha: number) => {
        try {
            if (color.startsWith("rgba(")) {
                return color.replace(/rgba\(([^)]+)\)/, (_m, inner) => {
                    const [r, g, b] = inner.split(",").map((s) => s.trim())
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`
                })
            }
            if (color.startsWith("rgb(")) {
                return color.replace(
                    /rgb\(([^)]+)\)/,
                    (_m, inner) => `rgba(${inner.trim()}, ${alpha})`
                )
            }
            if (color.startsWith("#")) {
                const hex = color.slice(1)
                const norm =
                    hex.length === 3
                        ? hex
                              .split("")
                              .map((c) => c + c)
                              .join("")
                        : hex.slice(0, 6)
                const r = parseInt(norm.slice(0, 2), 16)
                const g = parseInt(norm.slice(2, 4), 16)
                const b = parseInt(norm.slice(4, 6), 16)
                return `rgba(${r}, ${g}, ${b}, ${alpha})`
            }
        } catch {}
        return `rgba(0,0,0,${alpha})`
    }

    const boxShadow = shadowOn
        ? `${sh.offsetX}px ${sh.offsetY}px ${sh.blur}px ${sh.spread}px ${toRGBA(sh.color, sh.opacity)}`
        : "none"

    const ctrlPosStyle: React.CSSProperties = (() => {
        const base: React.CSSProperties = { position: "absolute", bottom: 12 }
        if (cfg.position === "bottom-left") return { ...base, left: 12 }
        if (cfg.position === "bottom-right") return { ...base, right: 12 }
        return { ...base, left: "50%", transform: "translateX(-50%)" }
    })()

    // ===============
    // RECENTER helper
    // ===============
    const applyTransform = (tr: d3.ZoomTransform) => {
        const viewport = viewportRef.current
        if (!viewport || !zoomBehaviorRef.current) return
        transformRef.current = tr
        d3.select(viewport).call(zoomBehaviorRef.current.transform as any, tr)
    }

    const recenter = (k?: number) => {
        const viewport = viewportRef.current
        const frame = frameRef.current
        if (!viewport || !frame) return

        const vp = viewport.getBoundingClientRect()

        // dimensiunea intrinsecă (ne-transformată)
        const frWidth = frame.offsetWidth
        const frHeight = frame.offsetHeight

        const kk = k ?? transformRef.current.k ?? 1
        const centerX = (vp.width - frWidth * kk) / 2
        const centerY = (vp.height - frHeight * kk) / 2

        applyTransform(d3.zoomIdentity.translate(centerX, centerY).scale(kk))
    }

    const getViewportCenter = (): [number, number] => {
        const rect = viewportRef.current?.getBoundingClientRect()
        return rect ? [rect.width / 2, rect.height / 2] : [0, 0]
    }

    const clampRoundK = (k: number) => {
        const clamped = Math.max(minZoom, Math.min(maxZoom, k))
        return +clamped.toFixed(4)
    }

    const buildTransformKeepingPoint = (
        kTarget: number,
        [cx, cy]: [number, number]
    ) => {
        const t = transformRef.current
        const s = kTarget / t.k
        const x = cx - s * (cx - t.x)
        const y = cy - s * (cy - t.y)
        return d3.zoomIdentity.translate(x, y).scale(kTarget)
    }

    // ======================
    // Init d3-zoom behavior
    // ======================
    useEffect(() => {
        if (!viewportRef.current || !frameRef.current) return

        const viewport = viewportRef.current
        const frame = frameRef.current

        const zoomHandler = (event: d3.D3ZoomEvent<Element, unknown>) => {
            const { x, y, k } = event.transform
            frame.style.transform = `translate(${x}px, ${y}px) scale(${k})`
            transformRef.current = event.transform

            const p = Math.round(k * 100)
            if (p !== Math.round(currentZoom * 100)) setCurrentZoom(k)
        }

        const behavior = d3
            .zoom<Element, unknown>()
            .scaleExtent([minZoom, maxZoom])
            .on("start", () => setIsDragging(true))
            .on("end", () => setIsDragging(false))
            .on("zoom", zoomHandler)

        zoomBehaviorRef.current = behavior

        const sel = d3.select(viewport)
        sel.on(".zoom", null)
        sel.call(behavior as any)

        // Disable double-click zoom for a cleaner UX
        sel.on("dblclick.zoom", null)

        // Center AFTER layout settles
        requestAnimationFrame(() => {
            recenter(zoom)
        })

        return () => {
            sel.on(".zoom", null)
        }
    }, [zoom, minZoom, maxZoom])

    // =============================
    // Keep centered on size changes
    // =============================
    useEffect(() => {
        if (!viewportRef.current || !frameRef.current) return
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => recenter())
        })
        ro.observe(viewportRef.current)
        ro.observe(frameRef.current)
        return () => ro.disconnect()
    }, [])

    // If the controlled `zoom` prop changes later, re-center
    useEffect(() => {
        recenter(zoom)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom])

    // ======================
    // UI handlers
    // ======================
    const handleMinus = (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        const t = transformRef.current
        const kTarget = clampRoundK(t.k / (1 + zoomStep))
        applyTransform(buildTransformKeepingPoint(kTarget, getViewportCenter()))
    }

    const handlePlus = (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        const t = transformRef.current
        const kTarget = clampRoundK(t.k * (1 + zoomStep))
        applyTransform(buildTransformKeepingPoint(kTarget, getViewportCenter()))
    }

    const percent = Math.round(currentZoom * 100)
    const controllerPadding = `${cfg.padding}px ${cfg.padding}px ${cfg.padding}px ${cfg.padding}px`
    const buttonSize = Math.max(cfg.iconSize + 12, 24)

    return (
        <div
            ref={viewportRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)",
                willChange: "transform",
                contain: "layout paint size",
                cursor: isDragging ? "grabbing" : "grab",
                background: "transparent",
                touchAction: "none",
            }}
        >
            <div
                ref={frameRef}
                style={{
                    // IMPORTANT: Keep this simple; we measure this element.
                    transformOrigin: "0 0",
                    backfaceVisibility: "hidden",
                    willChange: "transform",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "max-content",
                }}
            >
                {/* If you want content-visibility, wrap CONTENT, not the measured node */}
                {/* <div style={{ contentVisibility: "auto" }}>{content}</div> */}
                {content}
            </div>

            {/* Controller */}
            <div
                style={{
                    ...ctrlPosStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: cfg.gap,
                    background: cfg.bg,
                    color: cfg.color,
                    padding: controllerPadding,
                    borderRadius: cfg.radius,
                    boxShadow,
                    userSelect: "none",
                    pointerEvents: "auto",
                    fontSize: cfg.textSize,
                }}
            >
                <button
                    type="button"
                    onClick={handleMinus}
                    aria-label="Zoom out"
                    style={btnStyle(cfg, buttonSize, innerRadius)}
                >
                    <svg
                        width={cfg.iconSize}
                        height={cfg.iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <rect
                            x="5"
                            y="11"
                            width="14"
                            height="2"
                            fill="currentColor"
                        />
                    </svg>
                </button>

                <div
                    style={{
                        height: buttonSize,
                        minWidth: Math.max(buttonSize * 2, 48),
                        padding: "0 2px",
                        display: "grid",
                        placeItems: "center",
                        background: cfg.percentBg,
                        color: cfg.percentColor,
                        fontSize: cfg.textSize,
                        fontWeight: 600,
                        borderRadius: innerRadius,
                        lineHeight: 1,
                    }}
                    aria-label="Zoom percent"
                >
                    {percent}%
                </div>

                <button
                    type="button"
                    onClick={handlePlus}
                    aria-label="Zoom in"
                    style={btnStyle(cfg, buttonSize, innerRadius)}
                >
                    <svg
                        width={cfg.iconSize}
                        height={cfg.iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <rect
                            x="11"
                            y="5"
                            width="2"
                            height="14"
                            fill="currentColor"
                        />
                        <rect
                            x="5"
                            y="11"
                            width="14"
                            height="2"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
        </div>
    )
}

// =======================
// Styles & PropertyControls
// =======================
const btnStyle = (
    cfg: ZoomControllerConfig,
    size: number,
    innerRadius: number
): React.CSSProperties => ({
    width: size,
    height: size,
    display: "grid",
    placeItems: "center",
    border: "none",
    background: cfg.buttonBg,
    color: cfg.color,
    cursor: "pointer",
    borderRadius: innerRadius,
})

addPropertyControls(InteractiveCanvas, {
    content: {
        type: ControlType.ComponentInstance,
        title: "Content",
        description: "Avoid loading too many large assets inside.",
    },
    zoom: {
        type: ControlType.Number,
        title: "Initial Zoom",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
    },
    minZoom: {
        type: ControlType.Number,
        title: "Min Zoom",
        defaultValue: 0.3,
        min: 0.05,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    maxZoom: {
        type: ControlType.Number,
        title: "Max Zoom",
        defaultValue: 6,
        min: 1,
        max: 10,
        step: 0.5,
        displayStepper: true,
    },
    zoomStep: {
        type: ControlType.Number,
        title: "Zoom Step",
        defaultValue: 0.2,
        min: 0.05,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
    },
    shadow: {
        type: ControlType.Object,
        title: "Shadow Settings",
        hidden: (props) => !props.shadowEnabled,
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: defaultShadow.color,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: defaultShadow.opacity,
                min: 0,
                max: 1,
                displayStepper: true,
                step: 0.05,
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                displayStepper: true,
                defaultValue: defaultShadow.offsetX,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                displayStepper: true,
                defaultValue: defaultShadow.offsetY,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                displayStepper: true,
                defaultValue: defaultShadow.blur,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                displayStepper: true,
                defaultValue: defaultShadow.spread,
            },
        },
    },
    zoomController: {
        type: ControlType.Object,
        title: "Control UI",
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
        controls: {
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom-left", "bottom-center", "bottom-right"],
                optionTitles: ["Bottom Left", "Center", "Bottom Right"],
                segmentedControlDirection: "vertical",
                displaySegmentedControl: true,
                defaultValue: defaultController.position,
            },
            bg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaultController.bg,
            },
            color: {
                type: ControlType.Color,
                title: "Text/Icon",
                defaultValue: defaultController.color,
            },
            percentBg: {
                type: ControlType.Color,
                title: "Percent BG",
                defaultValue: defaultController.percentBg,
            },
            percentColor: {
                type: ControlType.Color,
                title: "Percent Text",
                defaultValue: defaultController.percentColor,
            },
            buttonBg: {
                type: ControlType.Color,
                title: "Button BG",
                defaultValue: defaultController.buttonBg,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: defaultController.radius,
                min: 0,
                max: 40,
                step: 1,
                displayStepper: true,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: defaultController.padding,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: defaultController.gap,
                min: 0,
                max: 32,
                step: 1,
                displayStepper: true,
            },
            textSize: {
                type: ControlType.Number,
                title: "Text Size",
                defaultValue: defaultController.textSize,
                min: 8,
                max: 28,
                step: 1,
                displayStepper: true,
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: defaultController.iconSize,
                min: 10,
                max: 40,
                step: 1,
                displayStepper: true,
            },
        },
    },
})
