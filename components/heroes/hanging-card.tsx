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

import {
    motion,
    useMotionValue,
    useAnimationControls,
    useMotionValueEvent,
} from "framer-motion"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 430
 */
export default function HangingCard(props) {
    const {
        style,
        ropeWidth,
        ropeColor,
        ropeLength,
        bouncy,
        cardRadius,
        frontImage,
        fitMode,
        imageScale,
        desktopBreakpoint,
        desktopScale,
        tabletScale,
        mobileScale,
    } = props

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const controls = useAnimationControls()

    const [dx, setDx] = React.useState(0)
    const [dy, setDy] = React.useState(0)
    const [viewportWidth, setViewportWidth] = React.useState(1440)
    const [viewportHeight, setViewportHeight] = React.useState(900)
    const [naturalSize, setNaturalSize] = React.useState({
        width: 300,
        height: 430,
    })
    const [isDragging, setIsDragging] = React.useState(false)

    const cardRef = React.useRef<HTMLDivElement | null>(null)
    const draggingRef = React.useRef(false)
    const pointerOffsetRef = React.useRef({ x: 0, y: 0 })

    useMotionValueEvent(x, "change", (v) => setDx(v))
    useMotionValueEvent(y, "change", (v) => setDy(v))

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const updateViewport = () => {
            setViewportWidth(window.innerWidth || 1440)
            setViewportHeight(window.innerHeight || 900)
        }

        updateViewport()
        window.addEventListener("resize", updateViewport)
        return () => window.removeEventListener("resize", updateViewport)
    }, [])

    React.useEffect(() => {
        if (!frontImage) {
            setNaturalSize({ width: 300, height: 430 })
            return
        }

        const img = new Image()
        img.onload = () => {
            setNaturalSize({
                width: img.naturalWidth || 300,
                height: img.naturalHeight || 430,
            })
        }
        img.src = frontImage
    }, [frontImage])

    const effectiveRopeLength = Number(ropeLength) || 90
    const effectiveDesktopBreakpoint = Math.max(
        1201,
        Number(desktopBreakpoint) || 1440
    )

    const effectiveImageScale = Math.max(
        0.1,
        Math.min(3, Number(imageScale) || 1)
    )

    const effectiveDesktopScale = Math.max(
        0,
        Math.min(1, Number(desktopScale) || 1)
    )
    const effectiveTabletScale = Math.max(
        0,
        Math.min(1, Number(tabletScale) || 0.82)
    )
    const effectiveMobileScale = Math.max(
        0,
        Math.min(1, Number(mobileScale) || 0.65)
    )

    const mobileBreakpoint = 767
    const tabletBreakpoint = 1199

    let responsiveScale = 1

    if (viewportWidth <= mobileBreakpoint) {
        responsiveScale = effectiveMobileScale
    } else if (viewportWidth <= tabletBreakpoint) {
        responsiveScale = effectiveTabletScale
    } else if (viewportWidth <= effectiveDesktopBreakpoint) {
        responsiveScale = effectiveDesktopScale
    } else {
        responsiveScale = 1
    }

    const finalScale = effectiveImageScale * responsiveScale

    const baseWidth = naturalSize.width || 300
    const baseHeight = naturalSize.height || 430

    const cardWidth = baseWidth * finalScale
    const cardHeight = baseHeight * finalScale

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        draggingRef.current = true
        setIsDragging(true)

        const rect = cardRef.current.getBoundingClientRect()
        pointerOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }

        controls.stop()

        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current || !cardRef.current) return

        const parentRect =
            cardRef.current.parentElement?.getBoundingClientRect() || {
                left: 0,
                top: 0,
            }

        const nextX = e.clientX - parentRect.left - pointerOffsetRef.current.x
        const nextY =
            e.clientY -
            parentRect.top -
            pointerOffsetRef.current.y -
            effectiveRopeLength

        x.set(nextX)
        y.set(nextY)
    }

    const endPointerDrag = (e?: React.PointerEvent<HTMLDivElement>) => {
        draggingRef.current = false
        setIsDragging(false)

        if (e) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {}
        }

        const bounce = Math.max(0, Math.min(100, Number(bouncy) || 50))
        const stiffness = 180 + bounce * 4
        const damping = 32 - bounce * 0.18
        const mass = 0.9 + (100 - bounce) * 0.002

        controls.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness,
                damping: Math.max(10, damping),
                mass,
            },
        })
    }

    const autoSwing = React.useMemo(() => {
        const safeRange = Math.max(viewportWidth * 0.28, 1)
        const normalized = Math.max(-1, Math.min(1, dx / safeRange))
        return normalized * 12
    }, [dx, viewportWidth])

    const frameWidth = cardWidth
    const frameHeight = effectiveRopeLength + cardHeight

    const ropeOverflowX = viewportWidth + (Number(ropeWidth) || 4) * 10
    const ropeOverflowY = viewportHeight + (Number(ropeWidth) || 4) * 10

    const x0 = frameWidth / 2
    const y0 = 0
    const x1 = x0 + dx
    const y1 = effectiveRopeLength + dy

    const dist = Math.hypot(x1 - x0, y1 - y0)
    const sag = Math.min(260, dist * 0.35 + effectiveRopeLength * 0.25)

    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2 + sag

    const localX0 = x0 + ropeOverflowX
    const localY0 = y0 + ropeOverflowY
    const localX1 = x1 + ropeOverflowX
    const localY1 = y1 + ropeOverflowY
    const localCx = cx + ropeOverflowX
    const localCy = cy + ropeOverflowY

    const path = `M ${localX0} ${localY0} Q ${localCx} ${localCy} ${localX1} ${localY1}`

    const imageStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: fitMode as React.CSSProperties["objectFit"],
        objectPosition: "center",
        display: "block",
        userSelect: "none",
        pointerEvents: "none",
        background: "transparent",
    }

    return (
        <div
            style={{
                width: frameWidth,
                height: frameHeight,
                position: "relative",
                overflow: "visible",
                background: "transparent",
                ...style,
            }}
        >
            <svg
                width={frameWidth + ropeOverflowX * 2}
                height={frameHeight + ropeOverflowY * 2}
                viewBox={`0 0 ${frameWidth + ropeOverflowX * 2} ${
                    frameHeight + ropeOverflowY * 2
                }`}
                style={{
                    position: "absolute",
                    left: -ropeOverflowX,
                    top: -ropeOverflowY,
                    pointerEvents: "none",
                    overflow: "visible",
                }}
            >
                <path
                    d={path}
                    fill="none"
                    stroke={ropeColor}
                    strokeWidth={ropeWidth}
                    strokeLinecap="round"
                />
            </svg>

            <motion.div
                ref={cardRef}
                animate={controls}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endPointerDrag}
                onPointerCancel={endPointerDrag}
                style={{
                    x,
                    y,
                    rotate: autoSwing,
                    transformOrigin: "50% 0%",
                    position: "absolute",
                    left: 0,
                    top: effectiveRopeLength,
                    width: cardWidth,
                    height: cardHeight,
                    cursor: isDragging ? "grabbing" : "grab",
                    background: "transparent",
                    touchAction: "none",
                    willChange: "transform",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: cardRadius,
                        overflow: "hidden",
                        background: "transparent",
                    }}
                >
                    {frontImage ? (
                        <img src={frontImage} alt="" style={imageStyle} />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 600,
                                color: "#111111",
                            }}
                        >
                            Add your image
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

HangingCard.defaultProps = {
    ropeWidth: 4,
    ropeColor: "rgba(0,0,0,0.25)",
    ropeLength: 90,
    bouncy: 55,
    cardRadius: 0,
    frontImage: "",
    fitMode: "cover",
    imageScale: 1,
    desktopBreakpoint: 1440,
    desktopScale: 1,
    tabletScale: 0.82,
    mobileScale: 0.65,
}

addPropertyControls(HangingCard, {
    frontImage: {
        type: ControlType.Image,
        title: "Image",
    },

    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
    },

    imageScale: {
        type: ControlType.Number,
        title: "Original Scale",
        min: 0.1,
        max: 3,
        step: 0.01,
    },

    ropeColor: {
        type: ControlType.Color,
        title: "Rope",
    },

    ropeWidth: {
        type: ControlType.Number,
        title: "Rope W",
        min: 0,
        max: 10,
    },

    ropeLength: {
        type: ControlType.Number,
        title: "Rope Len",
        min: 20,
        max: 220,
    },

    bouncy: {
        type: ControlType.Number,
        title: "Bouncy",
        min: 0,
        max: 100,
        step: 1,
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
    },

    desktopBreakpoint: {
        type: ControlType.Number,
        title: "Desktop BP",
        min: 1200,
        max: 3000,
        step: 1,
    },

    desktopScale: {
        type: ControlType.Number,
        title: "Desktop",
        min: 0,
        max: 1,
        step: 0.01,
    },

    tabletScale: {
        type: ControlType.Number,
        title: "Tablet",
        min: 0,
        max: 1,
        step: 0.01,
    },

    mobileScale: {
        type: ControlType.Number,
        title: "Mobile",
        min: 0,
        max: 1,
        step: 0.01,
    },
})
