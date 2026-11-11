import * as React from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FitMode =
    | "cover"
    | "contain"
    | "fill"
    | "none"
    | "scale-down"
    | "fit"
    | "stretch"

type ResponsiveImg = {
    src: string
    srcSet?: string
    alt?: string
    positionX?: string // e.g. "50%"
    positionY?: string // e.g. "50%"
    fit?: FitMode // read if provided, but the primary control is imageFit
} | null

type Props = {
    image: ResponsiveImg
    /** Explicit control for image sizing/fitting */
    imageFit?: FitMode
    tilesX: number
    tilesY: number
    maxOffset: number
    maxRotate: number
    seed: number
    springStiffness: number
    springDamping: number
    magnetStrength: number
    /** Delay before returning to rest after hover leaves (ms) */
    reassembleDelay: number
    /** Maximum DPR cap to reduce internal pixel cost (default 1.5) */
    dprCap?: number
    /** Radius of the magnet effect (px) — reduces computations far from the cursor */
    magnetRadius?: number
    /** Automatically reduces tile count on small screens */
    responsiveTiles?: boolean
    style?: React.CSSProperties
}

/** Simple RNG */
function makeRng(seed: number) {
    let s = seed || 1
    return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

/** Normalize common aliases */
function normalizeFit(fit?: FitMode): Exclude<FitMode, "fit" | "stretch"> {
    const f = (fit || "cover").toLowerCase() as FitMode
    if (f === "fit") return "contain"
    if (f === "stretch") return "fill"
    if (
        f === "contain" ||
        f === "cover" ||
        f === "fill" ||
        f === "none" ||
        f === "scale-down"
    )
        return f
    return "cover"
}

/** Compute object-fit: returns image size inside container and its top-left position */
function computeObjectFit(
    natural: { w: number; h: number },
    w: number,
    h: number,
    posX: number, // 0..1
    posY: number, // 0..1
    fit?: FitMode
) {
    const mode = normalizeFit(fit)
    const nw = Math.max(1, natural.w)
    const nh = Math.max(1, natural.h)

    let scaledW = nw
    let scaledH = nh
    let imgLeft = 0
    let imgTop = 0

    let resolved = mode
    if (mode === "scale-down") {
        resolved = nw <= w && nh <= h ? "none" : "contain"
    }

    if (resolved === "fill") {
        scaledW = w
        scaledH = h
        imgLeft = 0
        imgTop = 0
    } else if (resolved === "contain") {
        const s = Math.min(w / nw, h / nh)
        scaledW = nw * s
        scaledH = nh * s
        imgLeft = (w - scaledW) * posX
        imgTop = (h - scaledH) * posY
    } else if (resolved === "cover") {
        const s = Math.max(w / nw, h / nh)
        scaledW = nw * s
        scaledH = nh * s
        // negative when the image is larger than the container (cropping)
        imgLeft = -(scaledW - w) * posX
        imgTop = -(scaledH - h) * posY
    } else if (resolved === "none") {
        scaledW = nw
        scaledH = nh
        imgLeft = (w - scaledW) * posX
        imgTop = (h - scaledH) * posY
    }

    return { scaledW, scaledH, imgLeft, imgTop, mode: resolved }
}

/** Single tile (without Canvas) */
function Tile({
    i,
    left,
    top,
    width,
    height,
    centerX,
    centerY,
    target,
    hoverMV,
    cursorX,
    cursorY,
    stiffness,
    damping,
    magnetStrength,
    magnetRadius,
    bleed,
    bgUrl,
    bgSizeW,
    bgSizeH,
    imgLeft,
    imgTop,
    gpuBoost,
}: {
    i: number
    left: number
    top: number
    width: number
    height: number
    centerX: number
    centerY: number
    target: { x: number; y: number; r: number }
    hoverMV: ReturnType<typeof useMotionValue> // 0 | 1
    cursorX: ReturnType<typeof useMotionValue>
    cursorY: ReturnType<typeof useMotionValue>
    stiffness: number
    damping: number
    magnetStrength: number
    magnetRadius: number
    bleed: number
    bgUrl: string | null
    bgSizeW: number
    bgSizeH: number
    imgLeft: number // image position inside container (top-left)
    imgTop: number
    gpuBoost: boolean
}) {
    // base offsets/rotation proportional to hover value (0 -> 1)
    const baseX = useTransform(hoverMV, (h) => h * target.x)
    const baseY = useTransform(hoverMV, (h) => h * target.y)
    const baseR = useTransform(hoverMV, (h) => h * target.r)

    // magnet: computed only on hover and within the radius
    const magX = useTransform([hoverMV, cursorX, cursorY], ([h, mx, my]) => {
        if (!h || magnetStrength <= 0) return 0
        const dx = mx - centerX
        const dy = my - centerY
        const dist = Math.max(1, Math.hypot(dx, dy))
        if (dist > magnetRadius) return 0
        const falloff = 1 - dist / magnetRadius
        const mag = magnetStrength * falloff
        return (dx / dist) * mag
    })

    const magY = useTransform([hoverMV, cursorX, cursorY], ([h, mx, my]) => {
        if (!h || magnetStrength <= 0) return 0
        const dx = mx - centerX
        const dy = my - centerY
        const dist = Math.max(1, Math.hypot(dx, dy))
        if (dist > magnetRadius) return 0
        const falloff = 1 - dist / magnetRadius
        const mag = magnetStrength * falloff
        return (dy / dist) * mag
    })

    // total offset + spring
    const rawX = useTransform([baseX, magX], ([b, m]) => b + m)
    const rawY = useTransform([baseY, magY], ([b, m]) => b + m)
    const x = useSpring(rawX, { stiffness, damping, restDelta: 0.01 })
    const y = useSpring(rawY, { stiffness, damping, restDelta: 0.01 })
    const r = useSpring(baseR, { stiffness, damping, restDelta: 0.01 })

    const style: React.CSSProperties = {
        position: "absolute",
        left: left - bleed,
        top: top - bleed,
        width: width + bleed * 2,
        height: height + bleed * 2,
        backgroundImage: bgUrl ? `url("${bgUrl}")` : undefined,
        backgroundRepeat: "no-repeat",
        // image size within container (not the tile size)
        backgroundSize: `${bgSizeW}px ${bgSizeH}px`,
        // align the background so all tiles share the same image
        // formula: imgLeft/imgTop - (left/top - bleed)
        backgroundPosition: `${imgLeft - (left - bleed)}px ${imgTop - (top - bleed)}px`,
        pointerEvents: "none",
        backfaceVisibility: "hidden",
        transformStyle: "flat",
        willChange: gpuBoost ? "transform" : undefined,
    }

    return <motion.div key={i} style={{ ...style, x, y, rotate: r }} />
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerDisableUnlink
 */
export default function ImageShatterCanvas({
    image,
    imageFit = "cover",
    tilesX,
    tilesY,
    maxOffset,
    maxRotate,
    seed,
    springStiffness,
    springDamping,
    magnetStrength,
    reassembleDelay,
    dprCap = 1.5,
    magnetRadius = 200,
    responsiveTiles = true,
    style,
}: Props) {
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 600, h: 360 })

    // measure container
    React.useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const update = () =>
            setSize({
                w: Math.max(1, el.clientWidth),
                h: Math.max(1, el.clientHeight),
            })
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // load image (with srcset)
    const [natural, setNatural] = React.useState<{
        w: number
        h: number
    } | null>(null)
    const [bgUrl, setBgUrl] = React.useState<string | null>(null)

    const imgSrc =
        image?.src ??
        "https://images.unsplash.com/photo-1755018237679-454c2b98b51f?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    const imgAlt = image?.alt ?? ""

    React.useEffect(() => {
        let cancelled = false
        const i = new Image()
        i.crossOrigin = "anonymous"
        if (image?.srcSet) (i as any).srcset = image.srcSet
        i.src = imgSrc
        const onReady = () => {
            if (cancelled) return
            setNatural({ w: i.naturalWidth || 1, h: i.naturalHeight || 1 })
            setBgUrl((i as any).currentSrc || i.src)
        }
        if (i.complete) onReady()
        else i.onload = onReady
        return () => {
            cancelled = true
            i.onload = null
        }
    }, [imgSrc, image?.srcSet])

    // DPR capped
    const dpr =
        typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio || 1, Math.max(1, dprCap))
            : 1

    // responsive tiles
    const txRaw = Math.max(2, Math.floor(tilesX))
    const tyRaw = Math.max(2, Math.floor(tilesY))
    const tx =
        responsiveTiles && size.w < 640
            ? Math.max(2, Math.floor(txRaw * 0.7))
            : txRaw
    const ty =
        responsiveTiles && size.w < 640
            ? Math.max(2, Math.floor(tyRaw * 0.7))
            : tyRaw

    // edges aligned to device pixel grid
    const Nw = Math.max(1, Math.round(size.w * dpr))
    const Nh = Math.max(1, Math.round(size.h * dpr))

    const colEdges = React.useMemo(() => {
        const edges: number[] = new Array(tx + 1)
        for (let i = 0; i <= tx; i++) edges[i] = Math.floor((i * Nw) / tx) / dpr
        edges[tx] = Nw / dpr
        return edges
    }, [tx, Nw, dpr])

    const rowEdges = React.useMemo(() => {
        const edges: number[] = new Array(ty + 1)
        for (let i = 0; i <= ty; i++) edges[i] = Math.floor((i * Nh) / ty) / dpr
        edges[ty] = Nh / dpr
        return edges
    }, [ty, Nh, dpr])

    // object-position as percentages
    const posX =
        image?.positionX && image.positionX.endsWith("%")
            ? Math.min(1, Math.max(0, parseFloat(image.positionX) / 100))
            : 0.5
    const posY =
        image?.positionY && image.positionY.endsWith("%")
            ? Math.min(1, Math.max(0, parseFloat(image.positionY) / 100))
            : 0.5

    // compute object-fit (prefer imageFit, then image?.fit if provided, else cover)
    const layout = React.useMemo(() => {
        if (!natural) return null
        const chosenFit: FitMode | undefined = imageFit ?? image?.fit ?? "cover"
        const raw = computeObjectFit(
            natural,
            size.w,
            size.h,
            posX,
            posY,
            chosenFit
        )
        // snap to the DPR grid to reduce seams
        const scaledW = Math.round(raw.scaledW * dpr) / dpr
        const scaledH = Math.round(raw.scaledH * dpr) / dpr
        const imgLeft = Math.round(raw.imgLeft * dpr) / dpr
        const imgTop = Math.round(raw.imgTop * dpr) / dpr
        return { ...raw, scaledW, scaledH, imgLeft, imgTop }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [natural, size.w, size.h, posX, posY, imageFit, image?.fit, dpr])

    const BLEED = 1 // px

    // random targets per tile (once)
    const targets = React.useMemo(() => {
        const rng = makeRng(seed || 1)
        const arr: { x: number; y: number; r: number }[] = []
        for (let i = 0; i < tx * ty; i++) {
            const a = rng() * Math.PI * 2
            const d = rng() * maxOffset
            arr.push({
                x: Math.cos(a) * d,
                y: Math.sin(a) * d,
                r: (rng() * 2 - 1) * maxRotate,
            })
        }
        return arr
    }, [tx, ty, maxOffset, maxRotate, seed])

    // motion values for cursor/hover
    const cursorX = useMotionValue(0)
    const cursorY = useMotionValue(0)
    const hoverMV = useMotionValue(0) // 0 | 1

    const prefersReduced = useReducedMotion()

    // rAF throttle for mouse move
    const rafRef = React.useRef<number | null>(null)
    const onMove = (e: React.MouseEvent) => {
        const el = rootRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null
                cursorX.set(x)
                cursorY.set(y)
            })
        }
    }

    // respect reassembleDelay
    const leaveTimer = React.useRef<number | null>(null)
    const onEnter = () => {
        if (leaveTimer.current) {
            window.clearTimeout(leaveTimer.current)
            leaveTimer.current = null
        }
        hoverMV.set(1)
    }
    const onLeave = () => {
        if (reassembleDelay > 0) {
            leaveTimer.current = window.setTimeout(() => {
                hoverMV.set(0)
                leaveTimer.current = null
            }, reassembleDelay)
        } else {
            hoverMV.set(0)
        }
    }

    React.useEffect(() => {
        return () => {
            if (leaveTimer.current) window.clearTimeout(leaveTimer.current)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    const gpuBoost = true

    return (
        <div
            ref={rootRef}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onMouseMove={onMove}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                userSelect: "none",
                isolation: "isolate",
                transform: "translateZ(0)",
                touchAction: "none",
                ["--magnet-scale" as any]: prefersReduced ? 0 : 1,
            }}
            role="img"
            aria-label={imgAlt}
        >
            {/* render tiles only after the image loads and the layout is computed */}
            {natural && layout && bgUrl
                ? Array.from({ length: ty }).map((_, row) =>
                      Array.from({ length: tx }).map((__, col) => {
                          const i = row * tx + col

                          const left = colEdges[col]
                          const right = colEdges[col + 1]
                          const top = rowEdges[row]
                          const bottom = rowEdges[row + 1]
                          const tileW = right - left
                          const tileH = bottom - top
                          const cx = left + tileW / 2
                          const cy = top + tileH / 2

                          return (
                              <Tile
                                  key={i}
                                  i={i}
                                  left={left}
                                  top={top}
                                  width={tileW}
                                  height={tileH}
                                  centerX={cx}
                                  centerY={cy}
                                  target={{
                                      x: prefersReduced ? 0 : targets[i].x,
                                      y: prefersReduced ? 0 : targets[i].y,
                                      r: prefersReduced ? 0 : targets[i].r,
                                  }}
                                  hoverMV={hoverMV}
                                  cursorX={cursorX}
                                  cursorY={cursorY}
                                  stiffness={springStiffness}
                                  damping={springDamping}
                                  magnetStrength={
                                      magnetStrength * (prefersReduced ? 0 : 1)
                                  }
                                  magnetRadius={magnetRadius}
                                  bleed={BLEED}
                                  bgUrl={bgUrl}
                                  bgSizeW={layout.scaledW}
                                  bgSizeH={layout.scaledH}
                                  imgLeft={layout.imgLeft}
                                  imgTop={layout.imgTop}
                                  gpuBoost={gpuBoost}
                              />
                          )
                      })
                  )
                : null}
        </div>
    )
}

ImageShatterCanvas.defaultProps = {
    imageFit: "cover",
    tilesX: 14,
    tilesY: 8,
    maxOffset: 120,
    maxRotate: 18,
    seed: 42,
    springStiffness: 220,
    springDamping: 22,
    magnetStrength: 0,
    reassembleDelay: 0,
    dprCap: 1.5,
    magnetRadius: 200,
    responsiveTiles: true,
}

addPropertyControls(ImageShatterCanvas, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Fit (Contain)", "Fill", "None", "Scale Down"],
    },
    tilesX: {
        type: ControlType.Number,
        title: "Tiles (X)",
        min: 2,
        max: 40,
        displayStepper: true,
    },
    tilesY: {
        type: ControlType.Number,
        title: "Tiles (Y)",
        min: 2,
        max: 40,
        displayStepper: true,
    },
    maxOffset: {
        type: ControlType.Number,
        title: "Max Offset",
        min: 0,
        max: 300,
        unit: "px",
    },
    maxRotate: {
        type: ControlType.Number,
        title: "Max Rotate",
        min: 0,
        max: 45,
        unit: "deg",
    },
    seed: {
        type: ControlType.Number,
        title: "Random Seed",
        min: 0,
        max: 9999,
        displayStepper: true,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 50,
        max: 600,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        min: 5,
        max: 60,
    },
    magnetStrength: {
        type: ControlType.Number,
        title: "Magnet",
        min: 0,
        max: 120,
        unit: "px",
    },
    reassembleDelay: {
        type: ControlType.Number,
        title: "Back Delay",
        min: 0,
        max: 2000,
        unit: "ms",
    },
    dprCap: {
        type: ControlType.Number,
        title: "DPR Cap",
        min: 1,
        max: 3,
        step: 0.25,
    },
    magnetRadius: {
        type: ControlType.Number,
        title: "Magnet Radius",
        min: 50,
        max: 600,
        step: 10,
        unit: "px",
    },
    responsiveTiles: { type: ControlType.Boolean, title: "Responsive Tiles" },
})
