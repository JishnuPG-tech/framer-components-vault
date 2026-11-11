// @framerSupportedLayoutWidth auto
// @framerSupportedLayoutHeight auto

import * as React from "react"
import {
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    CSSProperties,
    useEffect,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type PaperOffset = { x: number; y: number }

interface FolderProps {
    color: string
    size: number
    cornerRadius: number

    hoverLift: boolean
    enableMagnet: boolean
    duration: number

    paper1Src?: string
    paper2Src?: string
    paper3Src?: string

    width?: number
    height?: number

    canvasMoveMode?: boolean
    runtimeDrag?: boolean
}

const BASE_W = 100
const BASE_H = 80

function Folder(props: FolderProps) {
    const {
        color,
        size,
        cornerRadius,
        hoverLift,
        enableMagnet,
        duration,
        paper1Src,
        paper2Src,
        paper3Src,
        width,
        height,
        canvasMoveMode = true,
        runtimeDrag = false,
    } = props

    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [offsets, setOffsets] = useState<PaperOffset[]>([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
    ])

    // Natural content size
    const contentW = BASE_W * size
    const contentH = BASE_H * size

    // 1) Measure the frame once it has a real size
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [box, setBox] = useState({ w: contentW, h: contentH })
    const [measured, setMeasured] = useState(false)

    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return

        const update = () => {
            const cw = el.clientWidth
            const ch = el.clientHeight
            if (cw > 0 && ch > 0) {
                setBox({ w: cw, h: ch })
                setMeasured(true)
            }
        }

        // Read once synchronously
        update()

        // Keep an observer in case Framer applies size after mount
        const ro = new ResizeObserver(() => {
            update()
        })
        ro.observe(el)

        return () => ro.disconnect()
    }, [contentW, contentH])

    // 2) Preload images, so the first open does not reflow when images appear
    const [imagesReady, setImagesReady] = useState(false)
    useEffect(() => {
        const srcs = [paper1Src, paper2Src, paper3Src].filter(
            Boolean
        ) as string[]
        if (srcs.length === 0) {
            setImagesReady(true)
            return
        }
        let done = 0
        const imgs = srcs.map((s) => {
            const im = new Image()
            im.onload = im.onerror = () => {
                done += 1
                if (done === srcs.length) setImagesReady(true)
            }
            im.src = s
            return im
        })
        return () => {
            // break references
            imgs.forEach((i) => {
                // @ts-ignore
                i.onload = i.onerror = null
            })
        }
    }, [paper1Src, paper2Src, paper3Src])

    // 3) Arm transitions only after measurement and images are ready and one RAF has passed
    const [animReady, setAnimReady] = useState(false)
    useLayoutEffect(() => {
        if (!measured || !imagesReady) return
        let id = requestAnimationFrame(() => {
            // allow the browser to paint once before enabling transitions
            id = requestAnimationFrame(() => setAnimReady(true))
        })
        return () => cancelAnimationFrame(id)
    }, [measured, imagesReady])

    // Uniform fit scale
    const fitScale = useMemo(() => {
        const { w, h } = box
        if (!w || !h) return 1
        const s = Math.min(w / contentW, h / contentH)
        return s > 0 ? s : 1
    }, [box, contentW, contentH])

    const backColor = color
    const paperCol1 = "#E6E6E6"
    const paperCol2 = "#F2F2F2"
    const paperCol3 = "#FFFFFF"
    const magnetStrength = 0.15

    const onPaperMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
        if (!open || !enableMagnet) return
        const rect = e.currentTarget.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) * magnetStrength
        const dy = (e.clientY - cy) * magnetStrength
        setOffsets((prev) => {
            const next = [...prev]
            next[i] = { x: dx, y: dy }
            return next
        })
    }

    const onPaperLeave = (_e: React.MouseEvent<HTMLDivElement>, i: number) => {
        setOffsets((prev) => {
            const next = [...prev]
            next[i] = { x: 0, y: 0 }
            return next
        })
    }

    const tr = (txPct: string, tyPct: string, off: PaperOffset, extra = "") =>
        `translate(calc(${txPct} + ${off.x.toFixed(1)}px), calc(${tyPct} + ${off.y.toFixed(1)}px))${
            extra ? " " + extra : ""
        }`

    const closedT = (o: PaperOffset) => tr("-50%", "10%", o)
    const closedHoverT = (o: PaperOffset) => tr("-50%", "0%", o)

    const openT1 = (o: PaperOffset) => tr("-120%", "-70%", o, "rotate(-15deg)")
    const openT2 = (o: PaperOffset) => tr("10%", "-70%", o, "rotate(15deg)")
    const openT3 = (o: PaperOffset) => tr("-50%", "-100%", o, "rotate(5deg)")

    // Root sizing
    const rootStyle: CSSProperties = canvasMoveMode
        ? {
              width: typeof width === "number" ? width : "100%",
              height: typeof height === "number" ? height : "100%",
              position: "relative",
              display: "grid",
              placeItems: "center",
              overflow: "visible",
          }
        : {
              width: typeof width === "number" ? width : "auto",
              height: typeof height === "number" ? height : "auto",
              position: "relative",
              overflow: "visible",
          }

    // Canvas wrapper we scale
    const canvasBase: CSSProperties = {
        width: contentW,
        height: contentH,
        willChange: "transform",
        pointerEvents: animReady ? "auto" : "none", // block first click until ready
        cursor: "pointer",
    }

    const baseTransform = `scale(${fitScale})`
    const liftTransform =
        hoverLift && !open && animReady && hovered ? " translateY(-8px)" : ""

    const canvasStyle: CSSProperties = canvasMoveMode
        ? {
              ...canvasBase,
              transform: baseTransform + liftTransform,
              transformOrigin: "center",
          }
        : {
              ...canvasBase,
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) ${baseTransform}${liftTransform}`,
              transformOrigin: "center",
          }

    // Back panel in natural size, outer canvas scales it
    const backStyle: CSSProperties = {
        position: "relative",
        width: BASE_W,
        height: BASE_H,
        background: backColor,
        borderRadius: `0px ${cornerRadius}px ${cornerRadius}px ${cornerRadius}px`,
        transform: `scale(${size})`,
        transformOrigin: "top left",
        boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
        zIndex: 1,
    }

    const tabStyle: CSSProperties = {
        position: "absolute",
        zIndex: 1,
        bottom: "98%",
        left: 0,
        width: 30,
        height: 10,
        background: backColor,
        borderRadius: `${Math.max(0, cornerRadius / 2)}px ${Math.max(
            0,
            cornerRadius / 2
        )}px 0 0`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
    }

    // Transition is disabled until animReady, which prevents the first click bounce
    const transition = animReady ? `transform ${duration}s ease-in-out` : "none"

    const paperBase: CSSProperties = {
        position: "absolute",
        zIndex: 2,
        bottom: "10%",
        left: "50%",
        borderRadius: cornerRadius,
        transition,
        willChange: "transform",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "#fff",
    }

    const imgStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        pointerEvents: "none",
        display: "block",
    }

    const paper1Style = (o: PaperOffset): CSSProperties => ({
        ...paperBase,
        width: "70%",
        height: "80%",
        background: paperCol1,
        transform: open
            ? openT1(o)
            : hoverLift && !open && hovered
              ? closedHoverT(o)
              : closedT(o),
    })

    const paper2Style = (o: PaperOffset): CSSProperties => ({
        ...paperBase,
        width: "80%",
        height: open ? "80%" : "70%",
        background: paperCol2,
        transform: open
            ? openT2(o)
            : hoverLift && !open && hovered
              ? closedHoverT(o)
              : closedT(o),
    })

    const paper3Style = (o: PaperOffset): CSSProperties => ({
        ...paperBase,
        width: "90%",
        height: open ? "80%" : "60%",
        background: paperCol3,
        transform: open
            ? openT3(o)
            : hoverLift && !open && hovered
              ? closedHoverT(o)
              : closedT(o),
    })

    const revealPx = Math.round(BASE_H * 0.12)
    const frontCommon: CSSProperties = {
        position: "absolute",
        zIndex: 3,
        width: "100%",
        height: `calc(100% - ${revealPx}px)`,
        top: `${revealPx}px`,
        background: color,
        borderRadius: `${Math.max(5, cornerRadius - 5)}px ${cornerRadius}px ${cornerRadius}px ${cornerRadius}px`,
        transformOrigin: "bottom",
        transition,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.08)",
        pointerEvents: "none",
    }

    const frontLeft: CSSProperties = {
        ...frontCommon,
        transform:
            open || (hoverLift && hovered) ? "skew(15deg) scaleY(0.6)" : "none",
    }

    const frontRight: CSSProperties = {
        ...frontCommon,
        transform:
            open || (hoverLift && hovered)
                ? "skew(-15deg) scaleY(0.6)"
                : "none",
    }

    const handleClick = () => {
        if (!animReady) return // ignore first click until fully ready
        setOpen((v) => !v)
    }

    return (
        <div
            ref={rootRef}
            style={rootStyle}
            onMouseEnter={() => animReady && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <motion.div
                style={canvasStyle}
                onClick={handleClick}
                role="button"
                aria-label={open ? "Close folder" : "Open folder"}
                drag={!!runtimeDrag}
                dragMomentum={false}
                dragElastic={0}
            >
                <div style={backStyle}>
                    <div style={tabStyle} aria-hidden />
                    <div
                        style={paper1Style(offsets[0])}
                        onMouseMove={(e) => onPaperMove(e, 0)}
                        onMouseLeave={(e) => onPaperLeave(e, 0)}
                    >
                        {paper1Src && (
                            <img
                                src={paper1Src}
                                alt="Paper 1"
                                style={imgStyle}
                            />
                        )}
                    </div>
                    <div
                        style={paper2Style(offsets[1])}
                        onMouseMove={(e) => onPaperMove(e, 1)}
                        onMouseLeave={(e) => onPaperLeave(e, 1)}
                    >
                        {paper2Src && (
                            <img
                                src={paper2Src}
                                alt="Paper 2"
                                style={imgStyle}
                            />
                        )}
                    </div>
                    <div
                        style={paper3Style(offsets[2])}
                        onMouseMove={(e) => onPaperMove(e, 2)}
                        onMouseLeave={(e) => onPaperLeave(e, 2)}
                    >
                        {paper3Src && (
                            <img
                                src={paper3Src}
                                alt="Paper 3"
                                style={imgStyle}
                            />
                        )}
                    </div>

                    {/* front flaps */}
                    <div style={frontLeft} />
                    <div style={frontRight} />
                </div>
            </motion.div>
        </div>
    )
}

Folder.defaultProps = {
    width: undefined,
    height: undefined,

    color: "#5227FF",
    size: 2,
    cornerRadius: 10,

    hoverLift: true,
    enableMagnet: true,
    duration: 0.3,

    paper1Src: "",
    paper2Src: "",
    paper3Src: "",

    canvasMoveMode: true,
    runtimeDrag: false,
} as Partial<FolderProps>

addPropertyControls(Folder, {
    color: { type: ControlType.Color, title: "Colour" },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 0.5,
        max: 6,
        step: 0.1,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 24,
        step: 1,
    },

    hoverLift: { type: ControlType.Boolean, title: "Hover" },
    enableMagnet: { type: ControlType.Boolean, title: "Magnet" },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.05,
        max: 1.2,
        step: 0.01,
    },

    paper1Src: { type: ControlType.Image, title: "Paper 1" },
    paper2Src: { type: ControlType.Image, title: "Paper 2" },
    paper3Src: { type: ControlType.Image, title: "Paper 3" },

    canvasMoveMode: { type: ControlType.Boolean, title: "Canvas move mode" },
    runtimeDrag: { type: ControlType.Boolean, title: "Runtime drag" },
})

export default Folder
