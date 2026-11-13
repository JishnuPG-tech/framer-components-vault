// Instructions: Create a Framer component: 3D Image Scanner Carousel (CMS-like dynamic content) with glowing center scanner line revealing images from grayscale to color, smooth continuous scrolling, optional drag and mouse wheel interaction, customizable styling and animation speed. Name changed to SpectraScan.

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
    useAnimationFrame,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useTransform,
    type MotionValue,
} from "framer-motion"

type CarouselItem = {
    image: { src: string; srcSet?: string; alt?: string }
    backImage?: { src: string; srcSet?: string; alt?: string }
    title: string
    link: string
}

type FontLike = any

type Props = {
    items: CarouselItem[]
    speed: number
    direction: "left" | "right"
    gap: number
    cardWidth: number
    cardHeight: number
    radius: number

    scanStyle: "classic" | "pro"

    perspective: number
    rotateY: number
    lift: number
    scaleDepth: number

    background: string
    cardBackground: string
    titleColor: string
    overlayColor: string
    overlayOpacity: number

    showTitle: boolean
    titleFont: FontLike

    scannerColor: string
    scannerWidth: number
    scannerGlow: number
    scannerSoftness: number

    imageGlow: number
    scanPulse: number

    revealWidth: number
    grayscale: number

    enableDrag: boolean
    enableWheel: boolean
    pauseOnHover: boolean

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m
}

function useResizeWidth(ref: React.RefObject<HTMLElement>) {
    const [w, setW] = React.useState(0)
    const wRef = React.useRef(0)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!ref.current) return

        const el = ref.current
        const ro = new ResizeObserver((entries) => {
            const next = Math.round(entries[0]?.contentRect?.width ?? 0)
            if (!Number.isFinite(next)) return
            if (next === wRef.current) return
            wRef.current = next
            React.startTransition(() => setW(next))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])

    return { width: w, widthRef: wRef }
}

function makeMaskGradient(centerPct: number, bandPct: number) {
    const c = clamp(centerPct, 0, 100)
    const w = clamp(bandPct, 0, 100)
    const l = clamp(c - w / 2, 0, 100)
    const r = clamp(c + w / 2, 0, 100)
    return `linear-gradient(90deg, transparent 0%, transparent ${l}%, black ${l}%, black ${r}%, transparent ${r}%, transparent 100%)`
}

function Card(props: {
    item: CarouselItem
    nextImage: { src: string; srcSet?: string; alt?: string }
    x: MotionValue<number>
    containerWidthRef: React.MutableRefObject<number>
    cardWidth: number
    cardHeight: number
    radius: number
    perspective: number
    rotateY: number
    lift: number
    scaleDepth: number
    cardBackground: string
    overlayColor: string
    overlayOpacity: number
    showTitle: boolean
    titleFont: any
    titleColor: string
    scannerSoftness: number
    scannerColor: string
    imageGlow: number
    scanPulse: number
    revealWidth: number
    grayscale: number
    isStatic: boolean
}) {
    const {
        item,
        nextImage,
        x,
        containerWidthRef,
        cardWidth,
        cardHeight,
        radius,
        perspective,
        rotateY,
        lift,
        scaleDepth,
        cardBackground,
        overlayColor,
        overlayOpacity,
        showTitle,
        titleFont,
        titleColor,
        scannerSoftness,
        scannerColor,
        imageGlow,
        scanPulse,
        revealWidth,
        grayscale,
        isStatic,
    } = props

    const scanCenterPct = useTransform(x, (vx) => {
        const cw = Math.max(1, containerWidthRef.current || 1)
        const local = cw / 2 - vx
        return clamp((local / cardWidth) * 100, 0, 100)
    })

    const mask = useTransform(scanCenterPct, (p) => makeMaskGradient(p, revealWidth))

    const distNorm = useTransform(x, (vx) => {
        const cw = Math.max(1, containerWidthRef.current || 1)
        const cardCenter = vx + cardWidth / 2
        const d = cardCenter - cw / 2
        const norm = clamp(d / (cw / 2), -1, 1)
        return norm
    })

    const rY = useTransform(distNorm, (n) => n * rotateY)
    const y = useTransform(distNorm, (n) => -Math.abs(n) * lift)
    const s = useTransform(distNorm, (n) => 1 - Math.abs(n) * (1 - scaleDepth))

    const postReveal = useTransform(distNorm, (n) => {
        // After crossing the center scanner line (left side), keep the image fully revealed
        return clamp(((-n - 0.02) * 6), 0, 1)
    })

    const flipEase = useTransform(postReveal, (p) => {
        const t = clamp(p, 0, 1)
        return t * t * (3 - 2 * t)
    })
    const flipY = useTransform(flipEase, (p) => p * 180)

    const filterGray = `grayscale(${clamp(grayscale, 0, 1)})`

    const img = item.image || {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Image",
    }

    const nextImg = (item.backImage?.src ? item.backImage : nextImage)?.src
        ? (item.backImage?.src ? item.backImage : nextImage)
        : {
              src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
              alt: "Back image",
          }

    const title = item.title || ""
    const link = item.link || ""

    const interactiveProps = link
        ? {
              role: "link" as const,
              tabIndex: 0,
              onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                      if (typeof window !== "undefined") window.open(link, "_self")
                  }
              },
              onClick: () => {
                  if (typeof window !== "undefined") window.open(link, "_self")
              },
          }
        : { role: "group" as const }

    const proximity = useTransform(distNorm, (n) => 1 - clamp(Math.abs(n), 0, 1))
    const glowPx = useTransform(proximity, (p) => Math.max(0, p) * Math.max(0, imageGlow))
    const cardGlow = useMotionTemplate`0 0 ${glowPx}px color-mix(in srgb, ${scannerColor} 60%, transparent)`
    const revealScale = useTransform(proximity, (p) => 1 + Math.max(0, scanPulse) * p * p)
    const revealBright = useTransform(proximity, (p) => 1 + Math.max(0, scanPulse) * 0.35 * p)

    return (
        <motion.div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: cardWidth,
                height: cardHeight,
                x,
                transformStyle: "preserve-3d",
                perspective,
                rotateY: isStatic ? 0 : (rY as any),
                y: isStatic ? 0 : (y as any),
                scale: isStatic ? 1 : (s as any),
                borderRadius: radius,
                background: cardBackground,
                overflow: "hidden",
                boxShadow: isStatic || imageGlow <= 0 ? "none" : (cardGlow as any),
                cursor: link ? "pointer" : "default",
                userSelect: "none",
            }}
            aria-label={title || img.alt || "Carousel item"}
            {...interactiveProps}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    rotateY: isStatic ? 0 : (flipY as any),
                }}
                aria-hidden="true"
            >
                {/* FRONT: current image (scanned) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* grayscale base */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${img.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: filterGray,
                            transform: "translateZ(0)",
                        }}
                        role="img"
                        aria-label={img.alt || ""}
                    />

                    {/* color reveal */}
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${img.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            WebkitMaskImage: isStatic ? undefined : (mask as any),
                            maskImage: isStatic ? undefined : (mask as any),
                            scale: isStatic ? 1 : (revealScale as any),
                            filter: isStatic
                                ? "saturate(1.05)"
                                : (useMotionTemplate`saturate(1.15) brightness(${revealBright})` as any),
                            transform: "translateZ(1px)",
                            opacity: isStatic ? 1 : (useTransform(postReveal, (p) => 1 - p) as any),
                        }}
                        aria-hidden="true"
                    />

                    {/* fully revealed after crossing */}
                    {!isStatic && (
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: `url(${img.src})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                opacity: postReveal as any,
                                filter: (useMotionTemplate`saturate(1.22) brightness(${revealBright})` as any),
                                transform: "translateZ(1.2px)",
                                pointerEvents: "none",
                            }}
                            aria-hidden="true"
                        />
                    )}

                    {/* overlay + scanlines */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
                            mixBlendMode: "overlay",
                            opacity: 0.35,
                            pointerEvents: "none",
                            transform: "translateZ(2px)",
                        }}
                        aria-hidden="true"
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: overlayColor,
                            opacity: overlayOpacity,
                            pointerEvents: "none",
                            transform: "translateZ(3px)",
                        }}
                        aria-hidden="true"
                    />

                    {/* subtle vignette */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)",
                            opacity: 0.55,
                            pointerEvents: "none",
                            transform: "translateZ(4px)",
                        }}
                        aria-hidden="true"
                    />

                    {showTitle && title && (
                        <div
                            style={{
                                position: "absolute",
                                left: 14,
                                right: 14,
                                bottom: 12,
                                display: "flex",
                                alignItems: "flex-end",
                                pointerEvents: "none",
                                transform: "translateZ(6px)",
                            }}
                        >
                            <div
                                style={{
                                    color: titleColor,
                                    textShadow: "0 2px 14px rgba(0,0,0,0.55)",
                                    ...titleFont,
                                    width: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {title}
                            </div>
                        </div>
                    )}

                    {/* center soften edge for reveal */}
                    {!isStatic && scannerSoftness > 0 && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                width: `${Math.max(1, scannerSoftness)}px`,
                                left: useTransform(scanCenterPct, (p) => `${p}%`) as any,
                                transform: "translateX(-50%)",
                                background:
                                    "linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(255,255,255,0.7), rgba(255,255,255,0.0))",
                                mixBlendMode: "overlay",
                                opacity: 0.22,
                                pointerEvents: "none",
                                transformOrigin: "center",
                            }}
                            aria-hidden="true"
                        />
                    )}
                </div>

                {/* BACK: next image (appears after scan, flip on left side) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transformStyle: "preserve-3d",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${nextImg.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "saturate(1.18) contrast(1.03)",
                            transform: "translateZ(1px)",
                        }}
                        role="img"
                        aria-label={nextImg.alt || ""}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: overlayColor,
                            opacity: overlayOpacity,
                            pointerEvents: "none",
                            transform: "translateZ(2px)",
                        }}
                        aria-hidden="true"
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(120% 90% at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 100%)",
                            opacity: 0.55,
                            pointerEvents: "none",
                            transform: "translateZ(3px)",
                        }}
                        aria-hidden="true"
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

/**
 * SpectraScan
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpectraScan(props: Props) {
    const {
        items = [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                title: "Project One",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                title: "Project Two",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                title: "Project Three",
                link: "",
            },
        ],
        speed = 120,
        direction = "left",
        gap = 28,
        cardWidth = 260,
        cardHeight = 320,
        radius = 16,
        scanStyle = "pro",
        perspective = 900,
        rotateY = 18,
        lift = 22,
        scaleDepth = 0.9,
        background = "#000000",
        cardBackground = "#111111",
        titleColor = "#FFFFFF",
        overlayColor = "#000000",
        overlayOpacity = 0.15,
        showTitle = false,
        titleFont,
        scannerColor = "#A855F7",
        scannerWidth = 3,
        scannerGlow = 26,
        scannerSoftness = 0,
        imageGlow = 18,
        scanPulse = 0.08,
        revealWidth = 34,
        grayscale = 1,
        enableDrag = true,
        enableWheel = true,
        pauseOnHover = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const { width: containerWidth, widthRef: containerWidthRef } = useResizeWidth(containerRef)

    const inViewRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(inViewRef, { margin: "120px 0px 120px 0px" })

    const safeItems = (items && items.length ? items : []).map((it) => ({
        image:
            it?.image?.src
                ? it.image
                : {
                      src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                      alt: "Gradient 5 - Green",
                  },
        backImage: it?.backImage?.src ? it.backImage : undefined,
        title: typeof it?.title === "string" ? it.title : "",
        link: typeof it?.link === "string" ? it.link : "",
    }))

    const step = Math.max(1, Math.round(cardWidth + gap))
    const baseCount = Math.max(1, safeItems.length)
    const repeat = 3
    const totalCount = baseCount * repeat
    const totalWidth = step * totalCount

    const trackX = useMotionValue(0)
    const isInteractingRef = React.useRef(false)
    const isHoveringRef = React.useRef(false)

    const speedDir = direction === "left" ? -1 : 1

    useAnimationFrame((t, delta) => {
        if (isStatic) return
        if (!isInView) return
        if (pauseOnHover && isHoveringRef.current) return
        if (isInteractingRef.current) return

        const pxPerSec = clamp(speed, 0, 2000)
        const dx = (pxPerSec * (delta / 1000)) * speedDir
        const next = trackX.get() + dx
        // keep within bounds to avoid float growth
        trackX.set(mod(next, totalWidth))
    })

    const indices = React.useMemo(() => {
        return Array.from({ length: totalCount }, (_, i) => i)
    }, [totalCount])

    const getCardX = React.useCallback(
        (i: number) => {
            return useTransform(trackX, (v) => {
                // position in [0,totalWidth)
                const base = mod(v, totalWidth)
                const x = i * step + base
                // shift left so that items wrap through viewport
                const wrapped = mod(x, totalWidth)
                // bring into [-cardWidth, totalWidth-cardWidth]
                const shifted = wrapped - cardWidth
                return shifted
            })
        },
        [trackX, totalWidth, step, cardWidth],
    )

    // drag
    const dragStartX = React.useRef(0)

    const scannerLeft = useMotionTemplate`calc(50% - ${scannerWidth / 2}px)`

    const scannerCoreBg =
        scanStyle === "pro"
            ? `linear-gradient(to bottom, ${scannerColor}00 0%, ${scannerColor} 10%, color-mix(in srgb, ${scannerColor} 62%, #ffffff) 50%, ${scannerColor} 90%, ${scannerColor}00 100%)`
            : `linear-gradient(to bottom, ${scannerColor}00 0%, ${scannerColor} 12%, color-mix(in srgb, ${scannerColor} 75%, #ffffff) 50%, ${scannerColor} 88%, ${scannerColor}00 100%)`

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
            }}
            onMouseEnter={() => {
                isHoveringRef.current = true
            }}
            onMouseLeave={() => {
                isHoveringRef.current = false
            }}
            onWheel={(e) => {
                if (!enableWheel) return
                if (isStatic) return
                // allow horizontal scroll via wheel (mouse/trackpad)
                e.preventDefault()
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
                // invert so natural scroll feels right
                const next = trackX.get() - delta
                trackX.set(mod(next, totalWidth))
            }}
        >
            <div
                ref={inViewRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
                aria-hidden="true"
            />

            {/* backdrop glow */}
            <div
                style={{
                    position: "absolute",
                    inset: -120,
                    background: `radial-gradient(60% 40% at 50% 50%, ${scannerColor}22 0%, rgba(0,0,0,0) 60%)`,
                    filter: "blur(24px)",
                    opacity: 0.9,
                    pointerEvents: "none",
                }}
                aria-hidden="true"
            />

            {/* track area */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: "100%",
                    height: cardHeight,
                    transform: "translateY(-50%)",
                }}
            >
                {/* cards */}
                {indices.map((i) => {
                    const item = safeItems[i % baseCount]
                    const nextItem = safeItems[(i + 1) % baseCount]
                    const x = getCardX(i)
                    return (
                        <Card
                            key={i}
                            item={item}
                            nextImage={nextItem.image}
                            x={x}
                            containerWidthRef={containerWidthRef}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            radius={radius}
                            perspective={perspective}
                            rotateY={rotateY}
                            lift={lift}
                            scaleDepth={scaleDepth}
                            cardBackground={cardBackground}
                            overlayColor={overlayColor}
                            overlayOpacity={overlayOpacity}
                            showTitle={showTitle}
                            titleFont={titleFont}
                            titleColor={titleColor}
                            scannerSoftness={scannerSoftness}
                            scannerColor={scannerColor}
                            imageGlow={imageGlow}
                            scanPulse={scanPulse}
                            revealWidth={revealWidth}
                            grayscale={grayscale}
                            isStatic={isStatic}
                        />
                    )
                })}
            </div>

            {/* scanner line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: scannerWidth,
                    background: scannerCoreBg,
                    opacity: 0.92,
                    pointerEvents: "none",
                    boxShadow: `0 0 ${scannerGlow}px ${scannerColor}, 0 0 ${scannerGlow * 2}px ${scannerColor}66`,
                    filter: "blur(0px)",
                }}
                aria-hidden="true"
            />
            {scanStyle === "pro" && !isStatic && isInView && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: Math.max(scannerWidth * 2, 8),
                        background: `linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)`,
                        opacity: 0.0,
                        pointerEvents: "none",
                        filter: "blur(0.2px)",
                        mixBlendMode: "screen",
                    }}
                    animate={{ opacity: [0.0, 0.22, 0.0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                />
            )}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: Math.max(scannerWidth * 6, 24),
                    background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${scannerColor}33 50%, rgba(0,0,0,0) 100%)`,
                    opacity: 0.75,
                    pointerEvents: "none",
                    filter: `blur(${Math.max(0, scannerGlow / 6)}px)`,
                    mixBlendMode: "screen",
                }}
                aria-hidden="true"
            />

            {/* interaction layer */}
            {enableDrag && !isStatic && (
                <motion.div
                    style={{ position: "absolute", inset: 0, background: "transparent" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.04}
                    onDragStart={() => {
                        isInteractingRef.current = true
                        dragStartX.current = trackX.get()
                    }}
                    onDrag={(_, info) => {
                        const next = dragStartX.current + info.offset.x
                        trackX.set(mod(next, totalWidth))
                    }}
                    onDragEnd={() => {
                        isInteractingRef.current = false
                    }}
                    aria-label="Carousel drag area"
                    role="application"
                />
            )}

            {/* accessibility hint for SSR/Canvas */}
            {containerWidth === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.6)",
                        ...titleFont,
                        pointerEvents: "none",
                    }}
                    aria-hidden="true"
                >
                    {isStatic ? "" : ""}
                </div>
            )}
        </div>
    )
}

addPropertyControls(SpectraScan, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 24,
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                backImage: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                title: "Project One",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                backImage: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                title: "Project Two",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                backImage: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                title: "Project Three",
                link: "",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                backImage: { type: ControlType.ResponsiveImage, title: "Back" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 120,
        min: 0,
        max: 800,
        step: 1,
        unit: "px/s",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableWheel: {
        type: ControlType.Boolean,
        title: "Wheel",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 260,
        min: 120,
        max: 520,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        defaultValue: 320,
        min: 140,
        max: 700,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 200,
        max: 2400,
        step: 10,
    },
    rotateY: {
        type: ControlType.Number,
        title: "RotateY",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 1,
        unit: "deg",
    },
    lift: {
        type: ControlType.Number,
        title: "Lift",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    scaleDepth: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 0.9,
        min: 0.6,
        max: 1,
        step: 0.01,
    },

    grayscale: {
        type: ControlType.Number,
        title: "Grayscale",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    revealWidth: {
        type: ControlType.Number,
        title: "Reveal",
        defaultValue: 34,
        min: 1,
        max: 100,
        step: 1,
        unit: "%",
    },

    scannerColor: {
        type: ControlType.Color,
        title: "Scanner",
        defaultValue: "#8855FF",
    },
    scannerWidth: {
        type: ControlType.Number,
        title: "Line",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    scannerGlow: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 26,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    scannerSoftness: {
        type: ControlType.Number,
        title: "Soft",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },

    imageGlow: {
        type: ControlType.Number,
        title: "Img Glow",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    scanPulse: {
        type: ControlType.Number,
        title: "Img Pulse",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.01,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#111111",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Op",
        defaultValue: 0.15,
        min: 0,
        max: 0.6,
        step: 0.01,
    },

    showTitle: {
        type: ControlType.Boolean,
        title: "Title",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showTitle }) => !showTitle,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
        hidden: ({ showTitle }) => !showTitle,
    },
    scanStyle: {
        type: ControlType.Enum,
        title: "Scan Style",
        options: ["classic", "pro"],
        optionTitles: ["Classic", "Pro"],
        defaultValue: "pro",
        displaySegmentedControl: true,
    },
})
