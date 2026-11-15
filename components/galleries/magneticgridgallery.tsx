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
 * MAGNETIC GRID GALLERY
 * A responsive, interactive grid where items react to the mouse/pointer position.
 * Best used as a hero section or a featured portfolio showcase.
 */

// ---------------------------------------------------------------------------
// Default images — shown when the component is first pasted into a project
// ---------------------------------------------------------------------------
const DEFAULT_IMAGES = [
    {
        src: "https://framerusercontent.com/images/3Byw8sBC7ASWNhvkwPP56V3s5Ro.webp",
        alt: "Fashion portrait 1",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/sJ24fNPNyoSFYbT4Hjqx3AqLsE.webp",
        alt: "Fashion portrait 2",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/3U5csPL2KQGeddjfFA3RHkrrs.webp",
        alt: "Fashion portrait 3",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/p3qlnvJUACEpGIJbPQE19IleOc.webp",
        alt: "Fashion portrait 4",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/JFf3x0coRdNFcObhfOSCsK549w.webp",
        alt: "Fashion portrait 5",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/nzRdetYw2mSMeLfW51FxG6adKjo.jpg",
        alt: "Fashion portrait 6",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/QD2ogsyWrRmAugHtEQ2jAj6jN3c.webp",
        alt: "Fashion portrait 7",
        srcSet: "",
    },
    {
        src: "https://framerusercontent.com/images/o0ZRZOdEtFq7z6QnquY8CkUt9FE.webp",
        alt: "Fashion portrait 8",
        srcSet: "",
    },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type Props = {
    images: ResponsiveImage[]
    columns: number
    rows: number
    gapPx: number
    paddingPx: number
    itemRadiusPx: number
    attraction: number
    maxOffsetPx: number
    scaleBoost: number
    blurPx: number
    bg: string
    width?: number
    height?: number
    style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function MagneticGridGallery(props: Props) {
    const {
        images,
        columns = 4,
        rows = 2,
        gapPx = 24,
        paddingPx = 40,
        itemRadiusPx = 20,
        attraction = 0.18,
        maxOffsetPx = 32,
        scaleBoost = 0.06,
        blurPx = 6,
        bg = "#0b0b0b",
        width,
        height,
        style,
    } = props

    // Resolve image list — fall back to defaults when nothing is provided
    const resolvedImages: ResponsiveImage[] =
        images && images.length > 0 ? images : DEFAULT_IMAGES

    // useIsStaticRenderer covers canvas, exports, and all other static editor states
    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<HTMLDivElement[]>([])
    const mouse = React.useRef({ x: 0, y: 0, active: false })
    const isVisible = React.useRef(false)

    const clamp = (v: number, a: number, b: number) =>
        Math.max(a, Math.min(b, v))

    const onPointerMove = (e: React.PointerEvent) => {
        if (!containerRef.current) return
        const r = containerRef.current.getBoundingClientRect()
        mouse.current = {
            x: e.clientX - r.left,
            y: e.clientY - r.top,
            active: true,
        }
    }

    const onPointerLeave = () => {
        mouse.current.active = false
    }

    // RAF animation loop — only runs in live/preview, gated by IntersectionObserver
    React.useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        if (!container) return

        let raf: number

        const tick = () => {
            if (!isVisible.current) {
                raf = requestAnimationFrame(tick)
                return
            }

            const parent = containerRef.current
            if (!parent) return
            const m = mouse.current
            const parentRect = parent.getBoundingClientRect()

            itemRefs.current.forEach((el) => {
                if (!el) return
                const r = el.getBoundingClientRect()
                const cx = r.left + r.width / 2 - parentRect.left
                const cy = r.top + r.height / 2 - parentRect.top

                let strength = 0
                let ox = 0
                let oy = 0

                if (m.active) {
                    const dx = m.x - cx
                    const dy = m.y - cy
                    const dist = Math.hypot(dx, dy)
                    strength = clamp(1 - dist / 280, 0, 1)
                    ox = clamp(
                        dx * attraction * strength,
                        -maxOffsetPx,
                        maxOffsetPx
                    )
                    oy = clamp(
                        dy * attraction * strength,
                        -maxOffsetPx,
                        maxOffsetPx
                    )
                }

                const scale = 1 + strength * scaleBoost
                const blur = (1 - strength) * blurPx

                el.style.transform = `translate(${ox}px, ${oy}px) scale(${scale})`
                el.style.filter = `blur(${blur}px)`
            })
            raf = requestAnimationFrame(tick)
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible.current = entry.isIntersecting
            },
            { threshold: 0 }
        )

        observer.observe(container)
        tick()

        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
        }
    }, [isStatic, attraction, maxOffsetPx, scaleBoost, blurPx])

    const totalItems = Math.min(resolvedImages.length, columns * rows)

    return (
        // Outermost wrapper: clips to the Framer frame — nothing overflows.
        <div
            style={{
                width: width ?? 800,
                height: height ?? 600,
                background: bg,
                overflow: "hidden",
                boxSizing: "border-box",
                ...style,
            }}
        >
            {/*
             * The grid IS the padded container. gridTemplateRows with `1fr`
             * rows means every row takes an equal share of the available
             * height, so the grid always fits inside the frame — regardless
             * of how many rows the user sets or what the frame height is.
             * No aspect-ratio on cards: width & height come from the grid.
             */}
            <div
                ref={containerRef}
                onPointerMove={isStatic ? undefined : onPointerMove}
                onPointerLeave={isStatic ? undefined : onPointerLeave}
                style={{
                    width: "100%",
                    height: "100%",
                    padding: `${paddingPx}px`,
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: `${gapPx}px`,
                }}
            >
                {resolvedImages.slice(0, totalItems).map((image, i) => (
                    <div
                        key={i}
                        ref={(el) => el && (itemRefs.current[i] = el)}
                        style={{
                            // width/height are fully driven by the grid —
                            // no aspect-ratio that could push rows taller than the frame.
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            background: "#111",
                            borderRadius: `${itemRadiusPx}px`,
                            ...(isStatic
                                ? {}
                                : {
                                      transition:
                                          "transform 0.8s cubic-bezier(.16,.8,.2,1), filter 0.35s ease",
                                      willChange: "transform, filter",
                                      filter: `blur(${blurPx}px)`,
                                  }),
                        }}
                    >
                        <img
                            src={image.src}
                            srcSet={image.srcSet || undefined}
                            alt={image.alt || ""}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                pointerEvents: "none",
                                display: "block",
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Default frame size
// ---------------------------------------------------------------------------
MagneticGridGallery.defaultProps = {
    width: 800,
    height: 600,
}

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------
addPropertyControls(MagneticGridGallery, {
    images: {
        type: ControlType.Array,
        title: "Gallery Images",
        description:
            "Add the images you want to display in the grid. Supports responsive sizes and alt-text.",
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Layout / Columns",
        description: "Number of horizontal columns.",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 4,
    },
    rows: {
        type: ControlType.Number,
        title: "Layout / Rows",
        description: "Number of vertical rows.",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 2,
    },
    gapPx: {
        type: ControlType.Number,
        title: "Layout / Gap",
        description: "Spacing between items in pixels.",
        min: 0,
        max: 80,
        step: 2,
        defaultValue: 24,
    },
    paddingPx: {
        type: ControlType.Number,
        title: "Layout / Padding",
        description: "Inner spacing for the whole container.",
        min: 0,
        max: 120,
        step: 4,
        defaultValue: 40,
    },
    itemRadiusPx: {
        type: ControlType.Number,
        title: "Style / Corner Radius",
        description: "Rounding of the image corners.",
        min: 0,
        max: 160,
        defaultValue: 20,
    },
    attraction: {
        type: ControlType.Number,
        title: "Physics / Attraction",
        description: "How strongly items follow the mouse.",
        min: 0.05,
        max: 1.4,
        step: 0.01,
        defaultValue: 0.18,
    },
    maxOffsetPx: {
        type: ControlType.Number,
        title: "Physics / Max Offset",
        description: "Limit how far items can move from their origin (px).",
        min: 0,
        max: 80,
        defaultValue: 32,
    },
    scaleBoost: {
        type: ControlType.Number,
        title: "Visuals / Scale Boost",
        description: "How much items grow when hovered.",
        min: 0,
        max: 0.2,
        step: 0.01,
        defaultValue: 0.06,
    },
    blurPx: {
        type: ControlType.Number,
        title: "Visuals / Idle Blur",
        description: "The amount of blur applied to items far from the mouse.",
        min: 0,
        max: 20,
        defaultValue: 0,
    },
    bg: {
        type: ControlType.Color,
        title: "Visuals / Background",
        description: "The color of the gallery background.",
        defaultValue: "#0b0b0b",
    },
})
