// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

/* ------------------------------------------------------------------ *
 *  Infinite Image Tunnel
 *  A cinematic, infinitely recycling 3D CSS image tunnel.
 *
 *  Architecture
 *  ├── InfiniteImageTunnel  – props, sizing, animation loop, UI
 *  ├── TunnelScene          – the perspective / preserve-3d stage
 *  ├── TunnelGrid           – wireframe: frames + longitudinal lines
 *  ├── TunnelFrame          – one rectangular wireframe ring
 *  ├── TunnelSurfaceLine    – one longitudinal perspective line
 *  ├── TunnelTile           – one image panel on a surface
 *  └── StartButton          – the pill CTA
 *
 *  Performance notes
 *  - The RAF loop is torn down whenever the scene is off-screen or the
 *    tab is hidden, and woken again on re-entry. Nothing is drawn for a
 *    visitor who has scrolled past.
 *  - Wireframe rings are four thin strips, not a full-size bordered box,
 *    so the compositor never allocates viewport-sized textures for them.
 *  - Tiles honour the ResponsiveImage srcSet, so the browser picks a
 *    panel-sized source instead of decoding the full-resolution original.
 * ------------------------------------------------------------------ */

/* ============================ TYPES ============================== */

type Surface = "left" | "right" | "ceiling" | "floor"

/** Shape produced by ControlType.ResponsiveImage. */
interface FramerImage {
    src?: string
    srcSet?: string
    alt?: string
}

/** Everything a tile needs to render one picture. */
interface ImageEntry {
    src: string
    srcSet: string
    alt: string
}

interface TileSpec {
    /** Which tunnel plane the tile is glued to. */
    surface: Surface
    /** Centre position across the surface, -1..1 (0 = middle of the plane). */
    offset: number
    /** Size across the surface, as a fraction of that plane's extent. */
    cross: number
    /** Size along the depth axis, as a fraction of one "bay". */
    span: number
    /** Normalised starting depth, 0..1 of the total tunnel depth. */
    depth: number
    /** Index into the images array. */
    index: number
    /** Optional in-plane rotation in degrees. */
    rotate?: number
}

interface TunnelGeometry {
    halfWidth: number
    halfHeight: number
    depth: number
    bay: number
}

/* ========================== DEFAULT DATA ========================= */

/**
 * A deliberately asymmetric, editorial composition.
 * Depths are normalised (0 = at the camera, 1 = far end) so the layout
 * scales with the Tunnel Depth property control.
 */
const LAYOUT: TileSpec[] = [
    // ---------------------------- LEFT WALL ----------------------------
    {
        surface: "left",
        offset: -0.34,
        cross: 0.3,
        span: 0.62,
        depth: 0.045,
        index: 0,
    },
    {
        surface: "left",
        offset: 0.36,
        cross: 0.22,
        span: 0.3,
        depth: 0.075,
        index: 8,
    },
    {
        surface: "left",
        offset: 0.06,
        cross: 0.4,
        span: 0.7,
        depth: 0.145,
        index: 1,
    },
    {
        surface: "left",
        offset: -0.52,
        cross: 0.18,
        span: 0.42,
        depth: 0.205,
        index: 9,
    },
    {
        surface: "left",
        offset: 0.44,
        cross: 0.26,
        span: 0.52,
        depth: 0.255,
        index: 2,
    },
    {
        surface: "left",
        offset: -0.18,
        cross: 0.34,
        span: 0.44,
        depth: 0.335,
        index: 10,
    },
    {
        surface: "left",
        offset: 0.2,
        cross: 0.3,
        span: 0.66,
        depth: 0.395,
        index: 3,
    },
    {
        surface: "left",
        offset: -0.46,
        cross: 0.24,
        span: 0.36,
        depth: 0.475,
        index: 4,
    },
    {
        surface: "left",
        offset: 0.3,
        cross: 0.2,
        span: 0.3,
        depth: 0.535,
        index: 11,
    },
    {
        surface: "left",
        offset: -0.1,
        cross: 0.36,
        span: 0.58,
        depth: 0.605,
        index: 5,
    },
    {
        surface: "left",
        offset: 0.48,
        cross: 0.22,
        span: 0.4,
        depth: 0.695,
        index: 2,
    },
    {
        surface: "left",
        offset: -0.36,
        cross: 0.28,
        span: 0.5,
        depth: 0.775,
        index: 6,
    },
    {
        surface: "left",
        offset: 0.14,
        cross: 0.24,
        span: 0.34,
        depth: 0.865,
        index: 6,
    },
    {
        surface: "left",
        offset: -0.28,
        cross: 0.3,
        span: 0.46,
        depth: 0.935,
        index: 7,
    },

    // --------------------------- RIGHT WALL ----------------------------
    {
        surface: "right",
        offset: 0.32,
        cross: 0.26,
        span: 0.44,
        depth: 0.03,
        index: 4,
    },
    {
        surface: "right",
        offset: -0.24,
        cross: 0.36,
        span: 0.68,
        depth: 0.095,
        index: 8,
    },
    {
        surface: "right",
        offset: 0.5,
        cross: 0.18,
        span: 0.28,
        depth: 0.17,
        index: 2,
    },
    {
        surface: "right",
        offset: -0.06,
        cross: 0.42,
        span: 0.56,
        depth: 0.23,
        index: 9,
    },
    {
        surface: "right",
        offset: 0.38,
        cross: 0.24,
        span: 0.38,
        depth: 0.31,
        index: 10,
    },
    {
        surface: "right",
        offset: -0.44,
        cross: 0.22,
        span: 0.46,
        depth: 0.37,
        index: 0,
    },
    {
        surface: "right",
        offset: 0.1,
        cross: 0.34,
        span: 0.64,
        depth: 0.445,
        index: 11,
    },
    {
        surface: "right",
        offset: -0.34,
        cross: 0.28,
        span: 0.34,
        depth: 0.52,
        index: 3,
    },
    {
        surface: "right",
        offset: 0.44,
        cross: 0.2,
        span: 0.42,
        depth: 0.585,
        index: 1,
    },
    {
        surface: "right",
        offset: -0.14,
        cross: 0.32,
        span: 0.52,
        depth: 0.665,
        index: 4,
    },
    {
        surface: "right",
        offset: 0.26,
        cross: 0.24,
        span: 0.3,
        depth: 0.74,
        index: 1,
    },
    {
        surface: "right",
        offset: -0.48,
        cross: 0.26,
        span: 0.48,
        depth: 0.82,
        index: 6,
    },
    {
        surface: "right",
        offset: 0.06,
        cross: 0.3,
        span: 0.4,
        depth: 0.9,
        index: 5,
    },

    // ----------------------------- CEILING -----------------------------
    {
        surface: "ceiling",
        offset: -0.22,
        cross: 0.4,
        span: 0.7,
        depth: 0.115,
        index: 2,
    },
    {
        surface: "ceiling",
        offset: 0.34,
        cross: 0.28,
        span: 0.44,
        depth: 0.29,
        index: 4,
    },
    {
        surface: "ceiling",
        offset: -0.06,
        cross: 0.46,
        span: 0.8,
        depth: 0.43,
        index: 5,
    },
    {
        surface: "ceiling",
        offset: 0.4,
        cross: 0.24,
        span: 0.36,
        depth: 0.61,
        index: 6,
    },
    {
        surface: "ceiling",
        offset: -0.3,
        cross: 0.36,
        span: 0.6,
        depth: 0.78,
        index: 9,
    },
    {
        surface: "ceiling",
        offset: 0.18,
        cross: 0.3,
        span: 0.42,
        depth: 0.925,
        index: 2,
    },

    // ------------------------------ FLOOR ------------------------------
    {
        surface: "floor",
        offset: 0.3,
        cross: 0.26,
        span: 0.4,
        depth: 0.06,
        index: 1,
    },
    {
        surface: "floor",
        offset: -0.34,
        cross: 0.3,
        span: 0.52,
        depth: 0.16,
        index: 3,
    },
    {
        surface: "floor",
        offset: 0.08,
        cross: 0.22,
        span: 0.3,
        depth: 0.245,
        index: 5,
    },
    {
        surface: "floor",
        offset: 0.42,
        cross: 0.24,
        span: 0.44,
        depth: 0.355,
        index: 7,
    },
    {
        surface: "floor",
        offset: -0.2,
        cross: 0.34,
        span: 0.58,
        depth: 0.47,
        index: 10,
    },
    {
        surface: "floor",
        offset: 0.24,
        cross: 0.2,
        span: 0.28,
        depth: 0.56,
        index: 3,
    },
    {
        surface: "floor",
        offset: -0.44,
        cross: 0.26,
        span: 0.46,
        depth: 0.68,
        index: 0,
    },
    {
        surface: "floor",
        offset: 0.12,
        cross: 0.3,
        span: 0.5,
        depth: 0.8,
        index: 8,
    },
    {
        surface: "floor",
        offset: -0.16,
        cross: 0.24,
        span: 0.34,
        depth: 0.89,
        index: 4,
    },
    {
        surface: "floor",
        offset: 0.36,
        cross: 0.28,
        span: 0.42,
        depth: 0.96,
        index: 11,
    },
]

/** Mobile keeps every surface represented but thins the composition out. */
const MOBILE_KEEP_EVERY = 3

/**
 * Tiles read as thin slivers if their depth extent is only one bay — this
 * stretches them along the travel axis so they feel like real panels.
 */
const DEPTH_SPAN_SCALE = 2.2

/** How much faster the tunnel travels while the scene is long-pressed. */
const BOOST_MAX = 2.6
/** Ramp rate for the boost multiplier — lower is a slower, smoother build. */
const BOOST_EASE = 1.4

/* =========================== UTILITIES =========================== */

function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v
}

/** Framer's ResponsiveImage value or a plain URL string -> full image entry. */
function resolveImage(
    value: FramerImage | string | undefined | null
): ImageEntry {
    if (!value) return { src: "", srcSet: "", alt: "" }
    if (typeof value === "string") return { src: value, srcSet: "", alt: "" }
    return {
        src: typeof value.src === "string" ? value.src : "",
        // Carrying the srcSet through is what lets the browser download and
        // decode a panel-sized image instead of the full-resolution upload.
        srcSet: typeof value.srcSet === "string" ? value.srcSet : "",
        alt: typeof value.alt === "string" ? value.alt : "",
    }
}

/**
 * Framer colour controls hand back hex, rgb(), rgba() or hsl() strings —
 * normalise any of them into a colour value carrying our own alpha.
 */
function withAlpha(color: string, alpha: number): string {
    const c = (color || "#FFFFFF").trim()
    const a = clamp(alpha, 0, 1)

    if (c.startsWith("rgb")) {
        const parts = c
            .slice(c.indexOf("(") + 1, c.lastIndexOf(")"))
            .split(/[,\s/]+/)
            .filter(Boolean)
            .map(Number)
        const [r = 255, g = 255, b = 255] = parts
        const baseAlpha =
            parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1
        return `rgba(${r}, ${g}, ${b}, ${a * baseAlpha})`
    }

    if (c.startsWith("hsl")) {
        const inner = c
            .slice(c.indexOf("(") + 1, c.lastIndexOf(")"))
            .split("/")[0]
        return `hsl(${inner.trim()} / ${a})`
    }

    const clean = c.replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((ch) => ch + ch)
                  .join("")
            : clean.slice(0, 6)
    const int = parseInt(full, 16)
    if (Number.isNaN(int)) return `rgba(255, 255, 255, ${a})`
    return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${a})`
}

/**
 * Perceived luminance (0 = black, 1 = white) of a colour string, used to
 * decide whether the theme reads as light or dark.
 */
function luminanceOf(color: string): number {
    const c = (color || "#000000").trim()
    let r = 0
    let g = 0
    let b = 0

    if (c.startsWith("rgb")) {
        const parts = c
            .slice(c.indexOf("(") + 1, c.lastIndexOf(")"))
            .split(/[,\s/]+/)
            .filter(Boolean)
            .map(Number)
        ;[r = 0, g = 0, b = 0] = parts
    } else {
        const clean = c.replace("#", "")
        const full =
            clean.length === 3
                ? clean
                      .split("")
                      .map((ch) => ch + ch)
                      .join("")
                : clean.slice(0, 6)
        const int = parseInt(full, 16)
        if (!Number.isNaN(int)) {
            r = (int >> 16) & 255
            g = (int >> 8) & 255
            b = int & 255
        }
    }

    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** Base (depth-less) transform that glues an element to a tunnel plane. */
function surfaceTransform(
    surface: Surface,
    geo: TunnelGeometry,
    offset: number
): string {
    switch (surface) {
        case "left":
            return `translate3d(${-geo.halfWidth}px, ${
                offset * geo.halfHeight
            }px, 0px) rotateY(90deg)`
        case "right":
            return `translate3d(${geo.halfWidth}px, ${
                offset * geo.halfHeight
            }px, 0px) rotateY(-90deg)`
        case "ceiling":
            return `translate3d(${offset * geo.halfWidth}px, ${-geo.halfHeight}px, 0px) rotateX(-90deg)`
        case "floor":
        default:
            return `translate3d(${offset * geo.halfWidth}px, ${
                geo.halfHeight
            }px, 0px) rotateX(90deg)`
    }
}

/** Pixel footprint of a tile on its plane, in local (pre-rotation) space. */
function tileSize(
    spec: TileSpec,
    geo: TunnelGeometry,
    scale: number,
    gap: number
): { width: number; height: number } {
    const isWall = spec.surface === "left" || spec.surface === "right"
    const acrossExtent = isWall ? geo.halfHeight * 2 : geo.halfWidth * 2
    const across = acrossExtent * spec.cross * scale
    const along = geo.bay * spec.span * scale * DEPTH_SPAN_SCALE
    // Walls: local width runs along depth. Floor/ceiling: local height does.
    const width = isWall ? along : across
    const height = isWall ? across : along
    return {
        width: Math.max(8, width - gap),
        height: Math.max(8, height - gap),
    }
}

/* ====================== PRESENTATIONAL PARTS ===================== */

interface TunnelTileProps {
    spec: TileSpec
    geo: TunnelGeometry
    scale: number
    gap: number
    image: ImageEntry
    placeholderColor: string
    registerRef: (el: HTMLDivElement | null) => void
}

function TunnelTile({
    spec,
    geo,
    scale,
    gap,
    image,
    placeholderColor,
    registerRef,
}: TunnelTileProps) {
    const { width, height } = tileSize(spec, geo, scale, gap)
    const style: CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transformStyle: "preserve-3d",
        overflow: "hidden",
        backgroundColor: placeholderColor,
    }

    // Tiles near the camera are magnified by the perspective projection, so
    // ask for a slightly larger candidate than the layout width.
    const sizes = `${Math.max(16, Math.round(width * 1.6))}px`

    return (
        <div ref={registerRef} style={style}>
            {image.src ? (
                <img
                    src={image.src}
                    srcSet={image.srcSet || undefined}
                    sizes={image.srcSet ? sizes : undefined}
                    alt={image.alt}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            ) : null}
        </div>
    )
}

interface TunnelFrameProps {
    geo: TunnelGeometry
    lineColor: string
    thickness: number
    registerRef: (el: HTMLDivElement | null) => void
}

/**
 * One wireframe ring. Drawn as four thin strips rather than a bordered
 * full-size box: visually identical to a border-box border, but the
 * compositor only ever rasterises the strips instead of a viewport-sized
 * texture per ring.
 */
function TunnelFrame({
    geo,
    lineColor,
    thickness,
    registerRef,
}: TunnelFrameProps) {
    const w = geo.halfWidth * 2
    const h = geo.halfHeight * 2
    const t = thickness
    const sideHeight = Math.max(0, h - t * 2)

    const bar = (extra: CSSProperties): CSSProperties => ({
        position: "absolute",
        backgroundColor: lineColor,
        ...extra,
    })

    return (
        <div
            ref={registerRef}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: w,
                height: h,
                marginLeft: -w / 2,
                marginTop: -h / 2,
                transformStyle: "preserve-3d",
                pointerEvents: "none",
            }}
        >
            <div style={bar({ left: 0, top: 0, width: w, height: t })} />
            <div style={bar({ left: 0, bottom: 0, width: w, height: t })} />
            <div
                style={bar({ left: 0, top: t, width: t, height: sideHeight })}
            />
            <div
                style={bar({ right: 0, top: t, width: t, height: sideHeight })}
            />
        </div>
    )
}

/** One longitudinal line running from the camera plane to the far end. */
function TunnelSurfaceLine({
    surface,
    offset,
    geo,
    lineColor,
    thickness,
}: {
    surface: Surface
    offset: number
    geo: TunnelGeometry
    lineColor: string
    thickness: number
}) {
    const isWall = surface === "left" || surface === "right"
    const width = isWall ? geo.depth : thickness
    const height = isWall ? thickness : geo.depth
    const base = surfaceTransform(surface, geo, offset)
    // After the plane rotation, local +x (walls) / +y (floor & ceiling) points
    // either into or out of the screen — flip the shift so every strip runs
    // away from the camera.
    const dir = surface === "left" || surface === "ceiling" ? 1 : -1
    const shift = isWall
        ? `translate3d(${(dir * geo.depth) / 2}px, 0px, 0px)`
        : `translate3d(0px, ${(dir * geo.depth) / 2}px, 0px)`
    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width,
                height,
                marginLeft: -width / 2,
                marginTop: -height / 2,
                backgroundColor: lineColor,
                transform: `${base} ${shift}`,
                transformStyle: "preserve-3d",
                pointerEvents: "none",
            }}
        />
    )
}

interface TunnelGridProps {
    geo: TunnelGeometry
    frameCount: number
    lineColor: string
    thickness: number
    registerFrame: (index: number) => (el: HTMLDivElement | null) => void
}

function TunnelGrid({
    geo,
    frameCount,
    lineColor,
    thickness,
    registerFrame,
}: TunnelGridProps) {
    const frames = useMemo(
        () => Array.from({ length: frameCount }, (_, i) => i),
        [frameCount]
    )
    const lines: Array<{ surface: Surface; offset: number }> = useMemo(
        () => [
            { surface: "left", offset: -1 },
            { surface: "left", offset: -0.34 },
            { surface: "left", offset: 0.34 },
            { surface: "left", offset: 1 },
            { surface: "right", offset: -1 },
            { surface: "right", offset: -0.34 },
            { surface: "right", offset: 0.34 },
            { surface: "right", offset: 1 },
            { surface: "ceiling", offset: -0.5 },
            { surface: "ceiling", offset: 0.5 },
            { surface: "floor", offset: -0.5 },
            { surface: "floor", offset: 0.5 },
        ],
        []
    )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
            }}
        >
            {lines.map((l, i) => (
                <TunnelSurfaceLine
                    key={`line-${i}`}
                    surface={l.surface}
                    offset={l.offset}
                    geo={geo}
                    lineColor={lineColor}
                    thickness={thickness}
                />
            ))}
            {frames.map((i) => (
                <TunnelFrame
                    key={`frame-${i}`}
                    geo={geo}
                    lineColor={lineColor}
                    thickness={thickness}
                    registerRef={registerFrame(i)}
                />
            ))}
        </div>
    )
}

function StartButton({
    label,
    visible,
    onStart,
    compact,
    invert,
}: {
    label: string
    visible: boolean
    onStart: () => void
    compact: boolean
    invert: boolean
}) {
    return (
        <button
            type="button"
            onClick={onStart}
            aria-hidden={!visible}
            tabIndex={visible ? 0 : -1}
            style={{
                position: "absolute",
                left: "50%",
                top: compact ? "34%" : "31%",
                width: compact ? 168 : 220,
                height: compact ? 54 : 70,
                transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.92})`,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
                transition:
                    "opacity 700ms cubic-bezier(0.22,1,0.36,1), transform 700ms cubic-bezier(0.22,1,0.36,1)",
                borderRadius: 999,
                border: invert ? "1px solid rgba(0,0,0,0.12)" : "none",
                outline: "none",
                background: invert ? "#000000" : "#FFFFFF",
                color: invert ? "#FFFFFF" : "#000000",
                fontFamily:
                    'Inter, "Helvetica Neue", Helvetica, -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: compact ? 18 : 24,
                fontWeight: 450,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                padding: 0,
                zIndex: 10,
                WebkitTapHighlightColor: "transparent",
            }}
        >
            {label}
        </button>
    )
}

/* ============================ PROPS ============================== */

interface InfiniteImageTunnelProps {
    images: Array<FramerImage | string>
    startText: string
    showStartButton: boolean
    autoStart: boolean
    animationSpeed: number
    pauseOnHover: boolean
    reducedMotion: boolean
    clickToToggle: boolean
    mouseParallax: boolean
    perspective: number
    tunnelDepth: number
    backgroundColor: string
    showGrid: boolean
    gridColor: string
    gridOpacity: number
    gridThickness: number
    tileGap: number
    imageTileScale: number
    credit?: string
    style?: CSSProperties
}

/* ========================== MAIN COMPONENT ======================= */

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function InfiniteImageTunnel(props: InfiniteImageTunnelProps) {
    const {
        images,
        startText,
        showStartButton,
        autoStart,
        animationSpeed,
        pauseOnHover,
        reducedMotion,
        clickToToggle,
        mouseParallax,
        perspective,
        tunnelDepth,
        backgroundColor,
        showGrid,
        gridColor,
        gridOpacity,
        gridThickness,
        tileGap,
        imageTileScale,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const sceneRef = useRef<HTMLDivElement | null>(null)
    const tileRefs = useRef<Array<HTMLDivElement | null>>([])
    const frameRefs = useRef<Array<HTMLDivElement | null>>([])

    const [size, setSize] = useState({ width: 1200, height: 700 })
    const [started, setStarted] = useState(autoStart)
    const [paused, setPaused] = useState(false)

    /* ---------------------- measurement ---------------------- */
    // Cached container rect, invalidated on scroll/resize so pointer moves
    // don't force a layout flush against the whole 3D tree every event.
    const rectRef = useRef<DOMRect | null>(null)

    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el || isStatic || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const rect = el.getBoundingClientRect()
            rectRef.current = rect
            if (rect.width > 0 && rect.height > 0) {
                setSize((prev) =>
                    Math.abs(prev.width - rect.width) < 1 &&
                    Math.abs(prev.height - rect.height) < 1
                        ? prev
                        : { width: rect.width, height: rect.height }
                )
            }
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        const invalidate = () => {
            rectRef.current = null
        }
        window.addEventListener("scroll", invalidate, { passive: true })
        window.addEventListener("resize", invalidate, { passive: true })
        return () => {
            ro.disconnect()
            window.removeEventListener("scroll", invalidate)
            window.removeEventListener("resize", invalidate)
        }
    }, [isStatic])

    const isCompact = size.width < 640

    /* ------------------------ geometry ----------------------- */
    const depth = clamp(tunnelDepth, 1000, 10000)
    const frameCount = isCompact ? 14 : 20

    const geo: TunnelGeometry = useMemo(
        () => ({
            halfWidth: Math.max(120, size.width / 2),
            halfHeight: Math.max(90, size.height / 2),
            depth,
            bay: depth / frameCount,
        }),
        [size.width, size.height, depth, frameCount]
    )

    const effectivePerspective = useMemo(() => {
        const base = clamp(perspective, 500, 3000)
        // Narrow viewports need a tighter perspective to keep the vanishing
        // point readable without crushing the walls.
        const ratio = clamp(size.width / 1400, 0.55, 1)
        return Math.round(base * ratio)
    }, [perspective, size.width])

    /* ------------------------ tile data ---------------------- */
    const layout = useMemo(
        () =>
            isCompact
                ? LAYOUT.filter((_, i) => i % MOBILE_KEEP_EVERY !== 1)
                : LAYOUT,
        [isCompact]
    )

    const imageList = useMemo(() => {
        return (images || []).map(resolveImage).filter((e) => Boolean(e.src))
    }, [images])

    const emptyImage = useMemo<ImageEntry>(
        () => ({ src: "", srcSet: "", alt: "" }),
        []
    )

    /* --------------------- animated state -------------------- */
    // Depth values live in refs so frames never trigger React renders.
    const tileZ = useRef<Float64Array>(new Float64Array(0))
    const frameZ = useRef<Float64Array>(new Float64Array(0))
    const baseTransforms = useRef<string[]>([])
    const rafRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number>(0)
    const rampRef = useRef<number>(autoStart ? 1 : 0)
    const boostRef = useRef<number>(1)
    const holdRef = useRef(false)
    const pointerRef = useRef({ x: 0, y: 0 })
    const pointerTargetRef = useRef({ x: 0, y: 0 })

    // Last values actually written to the DOM, so identical styles are never
    // re-assigned (each assignment dirties a compositor layer).
    const lastTileStyle = useRef<Array<{ t: string; o: string }>>([])
    const lastFrameStyle = useRef<Array<{ t: string; o: string }>>([])
    const lastSceneTransform = useRef({ x: Number.NaN, y: Number.NaN })

    const startedRef = useRef(started)
    const pausedRef = useRef(paused)
    const hoverRef = useRef(false)
    const visibleRef = useRef(true)
    // Set by the animation effect; lets observers restart a torn-down loop.
    const wakeRef = useRef<() => void>(() => {})
    startedRef.current = started
    pausedRef.current = paused

    /* Seed / reseed depths whenever the composition changes. */
    const seedDepths = useCallback(() => {
        const t = new Float64Array(layout.length)
        for (let i = 0; i < layout.length; i++) t[i] = layout[i].depth * depth
        tileZ.current = t

        const f = new Float64Array(frameCount)
        for (let i = 0; i < frameCount; i++) f[i] = (i / frameCount) * depth
        frameZ.current = f

        lastTileStyle.current = []
        lastFrameStyle.current = []
    }, [layout, depth, frameCount])

    useEffect(() => {
        seedDepths()
    }, [seedDepths])

    /* Cache the static part of every tile transform. */
    useEffect(() => {
        baseTransforms.current = layout.map((spec) => {
            const base = surfaceTransform(spec.surface, geo, spec.offset)
            const spin = spec.rotate ? ` rotateZ(${spec.rotate}deg)` : ""
            return `${base}${spin}`
        })
        lastTileStyle.current = []
    }, [layout, geo])

    /* ----------------------- visibility ---------------------- */
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic || typeof IntersectionObserver === "undefined")
            return
        const io = new IntersectionObserver(
            (entries) => {
                const next = entries.some((e) => e.isIntersecting)
                const was = visibleRef.current
                visibleRef.current = next
                // Coming back into view has to restart the loop, because
                // leaving the viewport tears it down completely.
                if (next && !was) wakeRef.current()
            },
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    /* --------------------- pointer parallax ------------------ */
    useEffect(() => {
        if (!mouseParallax || isStatic) return
        const el = containerRef.current
        if (!el) return
        const onMove = (e: PointerEvent) => {
            let rect = rectRef.current
            if (!rect) {
                rect = el.getBoundingClientRect()
                rectRef.current = rect
            }
            if (rect.width === 0 || rect.height === 0) return
            pointerTargetRef.current = {
                x: clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5),
                y: clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5),
            }
        }
        const onLeave = () => {
            pointerTargetRef.current = { x: 0, y: 0 }
        }
        el.addEventListener("pointermove", onMove, { passive: true })
        el.addEventListener("pointerleave", onLeave, { passive: true })
        return () => {
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerleave", onLeave)
        }
    }, [mouseParallax, isStatic])

    /* ---------------------- long-press boost ------------------ */
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic) return
        const release = () => {
            holdRef.current = false
        }
        const onDown = () => {
            holdRef.current = true
        }
        const opts = { passive: true } as const
        el.addEventListener("pointerdown", onDown, opts)
        el.addEventListener("pointerup", release, opts)
        el.addEventListener("pointercancel", release, opts)
        el.addEventListener("pointerleave", release, opts)
        return () => {
            el.removeEventListener("pointerdown", onDown)
            el.removeEventListener("pointerup", release)
            el.removeEventListener("pointercancel", release)
            el.removeEventListener("pointerleave", release)
        }
    }, [isStatic])

    /* ---------------------- animation loop ------------------- */
    const writeFrame = useCallback(() => {
        const scene = sceneRef.current
        if (scene && mouseParallax) {
            const p = pointerRef.current
            const last = lastSceneTransform.current
            // ±3.5° horizontal, ±2.5° vertical — cinematic, not gamey.
            // Skip the write once the easing has effectively settled.
            if (
                Number.isNaN(last.x) ||
                Math.abs(p.x - last.x) > 0.0005 ||
                Math.abs(p.y - last.y) > 0.0005
            ) {
                scene.style.transform = `rotateY(${p.x * 7}deg) rotateX(${
                    -p.y * 5
                }deg)`
                last.x = p.x
                last.y = p.y
            }
        }

        const z = tileZ.current
        const fadeStart = depth * 0.72
        const fadeSpan = depth * 0.28

        const tileCache = lastTileStyle.current
        for (let i = 0; i < z.length; i++) {
            const el = tileRefs.current[i]
            if (!el) continue
            const zi = z[i]
            const transform = `translate3d(0px, 0px, ${-zi}px) ${
                baseTransforms.current[i] || ""
            }`
            const opacity =
                zi > fadeStart
                    ? String(clamp(1 - (zi - fadeStart) / fadeSpan, 0, 1))
                    : "1"
            const prev = tileCache[i]
            if (!prev) {
                el.style.transform = transform
                el.style.opacity = opacity
                tileCache[i] = { t: transform, o: opacity }
                continue
            }
            if (prev.t !== transform) {
                el.style.transform = transform
                prev.t = transform
            }
            if (prev.o !== opacity) {
                el.style.opacity = opacity
                prev.o = opacity
            }
        }

        const fz = frameZ.current
        const frameCache = lastFrameStyle.current
        for (let i = 0; i < fz.length; i++) {
            const el = frameRefs.current[i]
            if (!el) continue
            const zi = fz[i]
            const transform = `translate3d(0px, 0px, ${-zi}px)`
            const opacity =
                zi > fadeStart
                    ? String(clamp(1 - (zi - fadeStart) / fadeSpan, 0, 1))
                    : "1"
            const prev = frameCache[i]
            if (!prev) {
                el.style.transform = transform
                el.style.opacity = opacity
                frameCache[i] = { t: transform, o: opacity }
                continue
            }
            if (prev.t !== transform) {
                el.style.transform = transform
                prev.t = transform
            }
            if (prev.o !== opacity) {
                el.style.opacity = opacity
                prev.o = opacity
            }
        }
    }, [depth, mouseParallax])

    useEffect(() => {
        if (isStatic) {
            // Canvas / thumbnail render: paint one static frame, no RAF.
            writeFrame()
            return
        }

        const NEAR = -Math.max(200, geo.halfWidth * 0.4)
        const speedBase = 320 * clamp(animationSpeed, 0.1, 5)

        /**
         * Whether the loop is worth scheduling at all. Off-screen or in a
         * hidden tab we draw nothing — this is what stops the component
         * burning GPU for the whole lifetime of the page.
         */
        const shouldSchedule = () => {
            if (typeof document !== "undefined" && document.hidden) return false
            if (!visibleRef.current) return false
            if (reducedMotion) {
                // Keep ticking only until the ramp / boost / pointer easing
                // has settled, then idle completely.
                const p = pointerRef.current
                const t = pointerTargetRef.current
                return (
                    rampRef.current > 0.001 ||
                    Math.abs(boostRef.current - 1) > 0.001 ||
                    Math.abs(p.x - t.x) > 0.001 ||
                    Math.abs(p.y - t.y) > 0.001
                )
            }
            return true
        }

        const stop = () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastTimeRef.current = 0
        }

        const tick = (time: number) => {
            const last = lastTimeRef.current || time
            lastTimeRef.current = time
            const dt = Math.min(0.05, (time - last) / 1000)

            const hoverPause = pauseOnHover && hoverRef.current
            const running =
                startedRef.current &&
                !pausedRef.current &&
                !hoverPause &&
                !reducedMotion &&
                visibleRef.current

            // Ease from the near-static idle drift into full travel.
            const target = running ? 1 : 0
            rampRef.current +=
                (target - rampRef.current) * Math.min(1, dt * 2.4)

            // Ease the long-press speed boost in and back out smoothly.
            const boostTarget = running && holdRef.current ? BOOST_MAX : 1
            boostRef.current +=
                (boostTarget - boostRef.current) * Math.min(1, dt * BOOST_EASE)

            const idle = reducedMotion ? 0 : 0.035
            const factor = idle + (1 - idle) * rampRef.current
            const delta = speedBase * factor * boostRef.current * dt

            if (delta > 0) {
                const z = tileZ.current
                for (let i = 0; i < z.length; i++) {
                    let v = z[i] - delta
                    if (v < NEAR) v += depth
                    z[i] = v
                }
                const fz = frameZ.current
                for (let i = 0; i < fz.length; i++) {
                    let v = fz[i] - delta
                    if (v < NEAR) v += depth
                    fz[i] = v
                }
            }

            // Smoothed pointer easing.
            const p = pointerRef.current
            const t = pointerTargetRef.current
            p.x += (t.x - p.x) * Math.min(1, dt * 3)
            p.y += (t.y - p.y) * Math.min(1, dt * 3)

            writeFrame()

            if (shouldSchedule()) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                stop()
            }
        }

        const wake = () => {
            if (rafRef.current !== null) return
            if (!shouldSchedule()) return
            lastTimeRef.current = 0
            rafRef.current = requestAnimationFrame(tick)
        }
        wakeRef.current = wake

        // Paint the current state once even if we're off-screen, so the
        // scene is correct the moment it scrolls into view.
        writeFrame()
        wake()

        const onVisibilityChange = () => {
            if (document.hidden) stop()
            else wake()
        }
        document.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            wakeRef.current = () => {}
            stop()
        }
    }, [
        isStatic,
        animationSpeed,
        depth,
        geo.halfWidth,
        pauseOnHover,
        reducedMotion,
        writeFrame,
    ])

    /* --------------- external / prop-driven controls ---------- */
    useEffect(() => {
        setStarted(autoStart)
        if (!autoStart) rampRef.current = 0
    }, [autoStart])

    const handleStart = useCallback(() => {
        setStarted(true)
        setPaused(false)
        wakeRef.current()
    }, [])

    const handleSceneClick = useCallback(() => {
        if (!clickToToggle || !startedRef.current) return
        setPaused((p) => !p)
        wakeRef.current()
    }, [clickToToggle])

    /* ------------------------- styling ------------------------ */
    const lineColor = withAlpha(gridColor, gridOpacity)
    const thickness = clamp(gridThickness, 0.5, 3)

    // Everything below adapts to the chosen background instead of assuming
    // a black scene, so a light/white theme doesn't show a stray dark disc
    // or a washed-out grid.
    const isLightTheme = luminanceOf(backgroundColor) > 0.6
    const vignetteColor = withAlpha(backgroundColor, 0.92)
    const vignetteTransparent = withAlpha(backgroundColor, 0)
    const tilePlaceholderColor = isLightTheme ? "#EDEDED" : "#050505"

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: backgroundColor,
        perspective: `${effectivePerspective}px`,
        perspectiveOrigin: "50% 50%",
        touchAction: "manipulation",
        // Keeps the tunnel's paint and layout work from leaking into the
        // rest of the page.
        contain: "layout paint",
        ...style,
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onPointerEnter={() => {
                hoverRef.current = true
            }}
            onPointerLeave={() => {
                hoverRef.current = false
                wakeRef.current()
            }}
            onClick={handleSceneClick}
        >
            {/* ------------------------ TunnelScene ------------------------ */}
            <div
                ref={sceneRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    pointerEvents: "none",
                }}
            >
                {/* Distant back plane — keeps the vanishing point a true void. */}
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: geo.halfWidth * 2,
                        height: geo.halfHeight * 2,
                        marginLeft: -geo.halfWidth,
                        marginTop: -geo.halfHeight,
                        transform: `translate3d(0px, 0px, ${-depth}px)`,
                        backgroundColor: backgroundColor,
                        transformStyle: "preserve-3d",
                    }}
                />

                {showGrid ? (
                    <TunnelGrid
                        geo={geo}
                        frameCount={frameCount}
                        lineColor={lineColor}
                        thickness={thickness}
                        registerFrame={(i) => (el) => {
                            frameRefs.current[i] = el
                        }}
                    />
                ) : null}

                {/* --------------------- surface tiles --------------------- */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {layout.map((spec, i) => (
                        <TunnelTile
                            key={`${spec.surface}-${i}`}
                            spec={spec}
                            geo={geo}
                            scale={clamp(imageTileScale, 0.5, 2)}
                            gap={clamp(tileGap, 0, 100)}
                            image={
                                imageList.length > 0
                                    ? imageList[spec.index % imageList.length]
                                    : emptyImage
                            }
                            placeholderColor={tilePlaceholderColor}
                            registerRef={(el) => {
                                tileRefs.current[i] = el
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Centre vignette: deepens the void at the vanishing point,
                tinted to match the background so it reads correctly on
                both dark and light themes instead of a fixed black disc. */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle at 50% 50%, ${vignetteColor} 0%, ${vignetteTransparent} 20%)`,
                }}
            />

            {showStartButton ? (
                <StartButton
                    label={startText}
                    visible={!started}
                    onStart={handleStart}
                    compact={isCompact}
                    invert={isLightTheme}
                />
            ) : null}
        </div>
    )
}

/* ====================== PROPERTY CONTROLS ======================== */

addPropertyControls(InfiniteImageTunnel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: [],
        maxCount: 24,
    },
    startText: {
        type: ControlType.String,
        title: "Start Text",
        defaultValue: "Press to Start",
        placeholder: "Press to Start",
        hidden: (fields) => !fields.showStartButton,
    },
    showStartButton: {
        type: ControlType.Boolean,
        title: "Start Button",
        defaultValue: true,
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: false,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1,
        displayStepper: false,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause On Hover",
        defaultValue: false,
    },
    clickToToggle: {
        type: ControlType.Boolean,
        title: "Click To Pause",
        defaultValue: true,
    },
    mouseParallax: {
        type: ControlType.Boolean,
        title: "Mouse Parallax",
        defaultValue: true,
    },
    reducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: false,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 500,
        max: 3000,
        step: 10,
        defaultValue: 1800,
        unit: "px",
        displayStepper: false,
    },
    tunnelDepth: {
        type: ControlType.Number,
        title: "Tunnel Depth",
        min: 1000,
        max: 10000,
        step: 100,
        defaultValue: 5000,
        unit: "px",
        displayStepper: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Show Grid",
        defaultValue: true,
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#FFFFFF",
        hidden: (fields) => !fields.showGrid,
    },
    gridOpacity: {
        type: ControlType.Number,
        title: "Grid Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.25,
        displayStepper: false,
        hidden: (fields) => !fields.showGrid,
    },
    gridThickness: {
        type: ControlType.Number,
        title: "Grid Width",
        min: 0.5,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        unit: "px",
        displayStepper: false,
        hidden: (fields) => !fields.showGrid,
    },
    tileGap: {
        type: ControlType.Number,
        title: "Tile Gap",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 12,
        unit: "px",
        displayStepper: false,
    },
    imageTileScale: {
        type: ControlType.Number,
        title: "Tile Scale",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
        displayStepper: false,
        description:
            "Get more components from [Framerstacks](https://www.framerstacks.com/)",
    },
})
