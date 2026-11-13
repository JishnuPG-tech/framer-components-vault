// Create an ultra-modern Hero Gallery component in Framer with: full-width masonry grid (3/2/1 columns responsive), varied image heights; load stagger animation from bottom; scroll parallax per row (0.3/0.6/0.9); magnetic hover within 40px radius with max 8deg tilt using useMotionValue/useTransform; hover overlay gradient sliding up with title + category tag; click opens fullscreen lightbox with scale animation + backdrop blur, prev/next arrows, counter, close button, keyboard (arrows/Escape), and mobile swipe navigation. All interactions via Framer Motion, no external libraries.

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
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useScroll,
    Variants,
} from "framer-motion"

type GalleryItem = {
    image: { src: string; srcSet?: string; alt?: string }
    title: string
    category: string
    size: "Tall" | "Medium" | "Short"
}

type Props = {
    items: GalleryItem[]

    gap: number
    radius: number

    overlayFrom: string
    overlayTo: string
    titleColor: string
    categoryTextColor: string
    categoryBg: string

    columnsDesktop: number
    columnsTablet: number
    columnsMobile: number
    tabletBreakpoint: number
    mobileBreakpoint: number

    parallaxMax: number

    magneticRadius: number
    tiltMax: number

    lightboxBackdrop: string
    lightboxBlur: number
    lightboxTitleFont: any
    lightboxMetaFont: any
    lightboxTitleColor: string
    lightboxMetaColor: string

    arrowBg: string
    arrowFg: string
    uiFg: string

    style?: React.CSSProperties
}

const defaultItems: GalleryItem[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gallery image 1",
        },
        title: "Verdant Geometry",
        category: "Nature",
        size: "Tall",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gallery image 2",
        },
        title: "Sunlit Layers",
        category: "Editorial",
        size: "Short",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gallery image 3",
        },
        title: "Kinetic Heat",
        category: "Campaign",
        size: "Medium",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gallery image 4",
        },
        title: "Nocturne Bloom",
        category: "Brand",
        size: "Tall",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gallery image 5",
        },
        title: "Blue Index",
        category: "Studio",
        size: "Medium",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gallery image 6",
        },
        title: "Emerald Drift",
        category: "Design",
        size: "Short",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gallery image 7",
        },
        title: "Violet Field",
        category: "Art",
        size: "Medium",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gallery image 8",
        },
        title: "Amber Stack",
        category: "Lookbook",
        size: "Tall",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gallery image 9",
        },
        title: "Molten Grid",
        category: "Motion",
        size: "Short",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gallery image 10",
        },
        title: "Azure Cut",
        category: "Product",
        size: "Medium",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gallery image 11",
        },
        title: "Green Echo",
        category: "Gallery",
        size: "Tall",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gallery image 12",
        },
        title: "Purple Meridian",
        category: "Archive",
        size: "Short",
    },
]

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function useReducedMotionLikeStatic() {
    const isStatic = useIsStaticRenderer()
    return isStatic
}

/**
 * Ultra-Modern Hero Gallery
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HeroGallery(props: Props) {
    const {
        items = defaultItems,
        gap = 4,
        radius = 16,

        overlayFrom = "rgba(0,0,0,0)",
        overlayTo = "rgba(0,0,0,0.75)",
        titleColor = "#FFFFFF",
        categoryTextColor = "#111111",
        categoryBg = "rgba(255,255,255,0.72)",

        columnsDesktop = 3,
        columnsTablet = 2,
        columnsMobile = 1,
        tabletBreakpoint = 900,
        mobileBreakpoint = 560,

        parallaxMax = 90,

        magneticRadius = 40,
        tiltMax = 8,

        lightboxBackdrop = "rgba(0,0,0,0.8)",
        lightboxBlur = 12,
        lightboxTitleFont,
        lightboxMetaFont,
        lightboxTitleColor = "#FFFFFF",
        lightboxMetaColor = "rgba(255,255,255,0.78)",

        arrowBg = "rgba(255,255,255,0.14)",
        arrowFg = "#FFFFFF",
        uiFg = "rgba(255,255,255,0.92)",

        style,
    } = props

    const reduceMotion = useReducedMotionLikeStatic()

    const normalizedItems = React.useMemo(() => {
        return (items && items.length > 0 ? items : defaultItems).map((it, i) => {
            const fallback = defaultItems[i % defaultItems.length]
            const hasSrc = Boolean(it?.image && typeof it.image.src === "string" && it.image.src.length > 0)
            return {
                ...fallback,
                ...it,
                image: hasSrc ? it.image : fallback.image,
            } as GalleryItem
        })
    }, [items])

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = React.useState<number>(1200)

    React.useEffect(() => {
        if (reduceMotion) return
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width
            if (typeof w !== "number") return
            React.startTransition(() => setContainerWidth(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [reduceMotion])

    const columns = React.useMemo(() => {
        if (containerWidth <= mobileBreakpoint) return columnsMobile
        if (containerWidth <= tabletBreakpoint) return columnsTablet
        return columnsDesktop
    }, [columnsDesktop, columnsMobile, columnsTablet, containerWidth, mobileBreakpoint, tabletBreakpoint])

    // For masonry-like layout: grid-auto-rows + row spans.
    const rowUnit = 8

    const sizeToHeight = React.useCallback(
        (size: GalleryItem["size"]) => {
            // Tuned for a hero mosaic look.
            if (size === "Tall") return 520
            if (size === "Medium") return 380
            return 260
        },
        []
    )

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const parallaxSpeeds = React.useMemo(() => [0.3, 0.6, 0.9], [])

    const parentVariants = React.useMemo(
        () => ({
            hidden: {},
            show: {
                transition: reduceMotion
                    ? undefined
                    : {
                          staggerChildren: 0.08,
                          delayChildren: 0.05,
                      },
            },
        }),
        [reduceMotion]
    )

    const childVariants = React.useMemo(
        () => ({
            hidden: { opacity: 0, y: 60 },
            show: {
                opacity: 1,
                y: 0,
                transition: reduceMotion
                    ? { duration: 0 }
                    : {
                          type: "spring",
                          stiffness: 260,
                          damping: 26,
                          mass: 0.9,
                      },
            },
        }),
        [reduceMotion]
    )

    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

    React.useEffect(() => {
        if (typeof document === "undefined") return
        if (lightboxIndex === null) return
        const prevOverflow = document.documentElement.style.overflow
        document.documentElement.style.overflow = "hidden"
        return () => {
            document.documentElement.style.overflow = prevOverflow
        }
    }, [lightboxIndex])

    const open = React.useCallback(
        (idx: number) => {
            React.startTransition(() => setLightboxIndex(idx))
        },
        []
    )

    const close = React.useCallback(() => {
        React.startTransition(() => setLightboxIndex(null))
    }, [])

    const goPrev = React.useCallback(() => {
        React.startTransition(() => {
            setLightboxIndex((prev) => {
                if (prev === null) return prev
                const next = (prev - 1 + items.length) % items.length
                return next
            })
        })
    }, [items.length])

    const goNext = React.useCallback(() => {
        React.startTransition(() => {
            setLightboxIndex((prev) => {
                if (prev === null) return prev
                const next = (prev + 1) % items.length
                return next
            })
        })
    }, [items.length])

    React.useEffect(() => {
        if (reduceMotion) return
        if (typeof window === "undefined") return
        if (lightboxIndex === null) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
            if (e.key === "ArrowLeft") goPrev()
            if (e.key === "ArrowRight") goNext()
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [close, goNext, goPrev, lightboxIndex, reduceMotion])

    const isFullWidth = style?.width === "100%"

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "auto",
                ...(isFullWidth ? {} : { minWidth: 320 }),
            }}
        >
            <motion.div
                variants={parentVariants}
                initial={"hidden"}
                animate={"show"}
                style={{
                    position: "relative",
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
                    gridAutoRows: `${rowUnit}px`,
                    gap: `${gap}px`,
                    alignItems: "stretch",
                }}
            >
                {items.map((item, index) => {
                    const heightPx = sizeToHeight(item.size)
                    const rowSpan = Math.max(1, Math.round((heightPx + gap) / (rowUnit + gap)))
                    const rowIndex = Math.floor(index / Math.max(1, columns))
                    const speed = parallaxSpeeds[rowIndex % parallaxSpeeds.length]
                    const yParallax = useTransform(scrollYProgress, [0, 1], [0, -parallaxMax * speed])

                    return (
                        <GalleryCard
                            key={index}
                            item={item}
                            index={index}
                            radius={radius}
                            overlayFrom={overlayFrom}
                            overlayTo={overlayTo}
                            titleColor={titleColor}
                            categoryTextColor={categoryTextColor}
                            categoryBg={categoryBg}
                            gap={gap}
                            rowSpan={rowSpan}
                            heightPx={heightPx}
                            variants={childVariants}
                            yParallax={reduceMotion ? undefined : yParallax}
                            magneticRadius={magneticRadius}
                            tiltMax={tiltMax}
                            onOpen={open}
                            reduceMotion={reduceMotion}
                        />
                    )
                })}
            </motion.div>

            <AnimatePresence>
                {lightboxIndex !== null && items[lightboxIndex] && (
                    <Lightbox
                        key="lightbox"
                        item={items[lightboxIndex]}
                        index={lightboxIndex}
                        total={items.length}
                        onClose={close}
                        onPrev={goPrev}
                        onNext={goNext}
                        backdrop={lightboxBackdrop}
                        blur={lightboxBlur}
                        titleFont={lightboxTitleFont}
                        metaFont={lightboxMetaFont}
                        titleColor={lightboxTitleColor}
                        metaColor={lightboxMetaColor}
                        arrowBg={arrowBg}
                        arrowFg={arrowFg}
                        uiFg={uiFg}
                        reduceMotion={reduceMotion}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function GalleryCard(props: {
    item: GalleryItem
    index: number
    radius: number
    overlayFrom: string
    overlayTo: string
    titleColor: string
    categoryTextColor: string
    categoryBg: string
    gap: number
    rowSpan: number
    heightPx: number
    variants: any
    yParallax?: any
    magneticRadius: number
    tiltMax: number
    onOpen: (idx: number) => void
    reduceMotion: boolean
}) {
    const {
        item,
        index,
        radius,
        overlayFrom,
        overlayTo,
        titleColor,
        categoryTextColor,
        categoryBg,
        rowSpan,
        heightPx,
        variants,
        yParallax,
        magneticRadius,
        tiltMax,
        onOpen,
        reduceMotion,
    } = props

    const ref = React.useRef<HTMLButtonElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const xSpring = useSpring(x, { stiffness: 320, damping: 26, mass: 0.6 })
    const ySpring = useSpring(y, { stiffness: 320, damping: 26, mass: 0.6 })

    const rotateY = useTransform(xSpring, [-magneticRadius, magneticRadius], [-tiltMax, tiltMax])
    const rotateX = useTransform(ySpring, [-magneticRadius, magneticRadius], [tiltMax, -tiltMax])

    const handlePointerMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (reduceMotion) return
            if (!ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = e.clientX - cx
            const dy = e.clientY - cy
            const clampedX = clamp(dx, -magneticRadius, magneticRadius)
            const clampedY = clamp(dy, -magneticRadius, magneticRadius)
            x.set(clampedX)
            y.set(clampedY)
        },
        [magneticRadius, reduceMotion, x, y]
    )

    const handlePointerLeave = React.useCallback(() => {
        if (reduceMotion) return
        x.set(0)
        y.set(0)
    }, [reduceMotion, x, y])

    const overlayVariants = React.useMemo(
        () => ({
            rest: { y: "100%" },
            hover: { y: "0%", transition: { type: "spring", stiffness: 260, damping: 26 } },
        }),
        []
    )

    return (
        <motion.button
            ref={ref}
            type="button"
            aria-label={`Open image ${index + 1}: ${item.title}`}
            variants={variants}
            initial={"hidden"}
            animate={"show"}
            whileHover={reduceMotion ? undefined : "hover"}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                gridRowEnd: `span ${rowSpan}`,
                border: "none",
                padding: 0,
                borderRadius: radius,
                overflow: "hidden",
                background: "transparent",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                transformStyle: "preserve-3d",
                perspective: 900,
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerLeave}
            onClick={() => onOpen(index)}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: heightPx,
                    borderRadius: radius,
                    overflow: "hidden",
                    x: reduceMotion ? 0 : xSpring,
                    y: reduceMotion ? 0 : ySpring,
                    rotateX: reduceMotion ? 0 : rotateX,
                    rotateY: reduceMotion ? 0 : rotateY,
                    willChange: reduceMotion ? undefined : "transform",
                    translateZ: 0,
                    boxShadow: reduceMotion
                        ? "none"
                        : "0 20px 60px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.12)",
                }}
                whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                transition={reduceMotion ? undefined : { type: "spring", stiffness: 260, damping: 24 }}
            >
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        y: yParallax,
                        backgroundImage: `url(${item.image?.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        transform: "translateZ(0)",
                        willChange: reduceMotion ? undefined : "transform",
                    }}
                />

                <motion.div
                    variants={overlayVariants as Variants}
                    initial={"rest"}
                    animate={"rest"}
                    whileHover={reduceMotion ? undefined : "hover"}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        background: `linear-gradient(180deg, ${overlayFrom}, ${overlayTo})`,
                        transform: "translateZ(1px)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                color: titleColor,
                                fontSize: 16,
                                lineHeight: "1.1em",
                                letterSpacing: "-0.01em",
                                fontWeight: 600,
                                textAlign: "left",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            {item.title}
                        </div>

                        <div
                            style={{
                                flex: "none",
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: categoryBg,
                                color: categoryTextColor,
                                fontSize: 12,
                                lineHeight: "1em",
                                letterSpacing: "-0.01em",
                                fontWeight: 600,
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                backdropFilter: "saturate(160%) blur(10px)",
                                WebkitBackdropFilter: "saturate(160%) blur(10px)",
                            }}
                        >
                            {item.category}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.button>
    )
}

function Lightbox(props: {
    item: GalleryItem
    index: number
    total: number
    onClose: () => void
    onPrev: () => void
    onNext: () => void
    backdrop: string
    blur: number
    titleFont: any
    metaFont: any
    titleColor: string
    metaColor: string
    arrowBg: string
    arrowFg: string
    uiFg: string
    reduceMotion: boolean
}) {
    const {
        item,
        index,
        total,
        onClose,
        onPrev,
        onNext,
        backdrop,
        blur,
        titleFont,
        metaFont,
        titleColor,
        metaColor,
        arrowBg,
        arrowFg,
        uiFg,
        reduceMotion,
    } = props

    const dragX = useMotionValue(0)

    const onDragEnd = React.useCallback(
        (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
            const swipe = info.offset.x * info.velocity.x
            if (swipe > 8000 || info.offset.x > 90) onPrev()
            if (swipe < -8000 || info.offset.x < -90) onNext()
        },
        [onNext, onPrev]
    )

    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Lightbox: ${item.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: reduceMotion ? { duration: 0 } : { duration: 0.2 } }}
            exit={{ opacity: 0, transition: reduceMotion ? { duration: 0 } : { duration: 0.18 } }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                background: backdrop,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
            }}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 16 }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    transition: reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 24 },
                }}
                exit={{ scale: 0.96, opacity: 0, transition: reduceMotion ? { duration: 0 } : { duration: 0.18 } }}
                style={{
                    position: "relative",
                    width: "min(1100px, 100%)",
                    maxHeight: "calc(100vh - 48px)",
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                    padding: 18,
                    borderRadius: 22,
                    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
                }}
            >
                <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        transform: "translate(8px, -8px)",
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: "rgba(0,0,0,0.25)",
                        color: uiFg,
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            ...metaFont,
                            color: metaColor,
                            fontSize: metaFont?.fontSize ?? "14px",
                        }}
                    >
                        {index + 1}/{total}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            type="button"
                            aria-label="Previous"
                            onClick={onPrev}
                            style={arrowButtonStyle(arrowBg, arrowFg)}
                        >
                            <ArrowIcon direction="left" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next"
                            onClick={onNext}
                            style={arrowButtonStyle(arrowBg, arrowFg)}
                        >
                            <ArrowIcon direction="right" />
                        </button>
                    </div>
                </div>

                <motion.div
                    drag={reduceMotion ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.22}
                    onDragEnd={reduceMotion ? undefined : onDragEnd}
                    style={{
                        x: dragX,
                        position: "relative",
                        width: "100%",
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        maxHeight: "min(64vh, 720px)",
                        aspectRatio: "16 / 9",
                        touchAction: "pan-y",
                    }}
                >
                    <img
                        src={item.image?.src}
                        srcSet={item.image?.srcSet}
                        alt={item.image?.alt ?? item.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                </motion.div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div
                        style={{
                            ...titleFont,
                            color: titleColor,
                            fontSize: titleFont?.fontSize ?? "48px",
                            lineHeight: titleFont?.lineHeight ?? "1.05em",
                            letterSpacing: titleFont?.letterSpacing ?? "-0.04em",
                            margin: 0,
                        }}
                    >
                        {item.title}
                    </div>

                    <div
                        style={{
                            ...metaFont,
                            color: metaColor,
                            fontSize: metaFont?.fontSize ?? "15px",
                            lineHeight: metaFont?.lineHeight ?? "1.3em",
                        }}
                    >
                        {item.category}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
    const rotate = direction === "left" ? 180 : 0
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ transform: `rotate(${rotate}deg)` }}
        >
            <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function arrowButtonStyle(bg: string, fg: string): React.CSSProperties {
    return {
        width: 42,
        height: 42,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background: bg,
        color: fg,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    }
}

addPropertyControls(HeroGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 24,
        defaultValue: defaultItems.map((it) => ({
            title: it.title,
            category: it.category,
            size: it.size,
        })),
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Image Title" },
                category: { type: ControlType.String, title: "Category", defaultValue: "Category" },
                size: {
                    type: ControlType.Enum,
                    title: "Size",
                    options: ["Tall", "Medium", "Short"],
                    optionTitles: ["Tall", "Medium", "Short"],
                    defaultValue: "Medium",
                    displaySegmentedControl: true,
                },
            },
        },
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 24,
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

    overlayFrom: {
        type: ControlType.Color,
        title: "Overlay From",
        defaultValue: "rgba(0,0,0,0)",
    },
    overlayTo: {
        type: ControlType.Color,
        title: "Overlay To",
        defaultValue: "rgba(0,0,0,0.75)",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#FFFFFF",
    },
    categoryTextColor: {
        type: ControlType.Color,
        title: "Tag Text",
        defaultValue: "#111111",
    },
    categoryBg: {
        type: ControlType.Color,
        title: "Tag Bg",
        defaultValue: "rgba(255,255,255,0.72)",
    },

    columnsDesktop: {
        type: ControlType.Number,
        title: "Cols Desktop",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
    },
    columnsTablet: {
        type: ControlType.Number,
        title: "Cols Tablet",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
    },
    columnsMobile: {
        type: ControlType.Number,
        title: "Cols Mobile",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet BP",
        defaultValue: 900,
        min: 320,
        max: 1400,
        step: 10,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile BP",
        defaultValue: 560,
        min: 240,
        max: 1000,
        step: 10,
        unit: "px",
    },

    parallaxMax: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 90,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
    },

    magneticRadius: {
        type: ControlType.Number,
        title: "Mag Radius",
        defaultValue: 40,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    tiltMax: {
        type: ControlType.Number,
        title: "Tilt Max",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "deg",
    },

    lightboxBackdrop: {
        type: ControlType.Color,
        title: "LB Backdrop",
        defaultValue: "rgba(0,0,0,0.8)",
    },
    lightboxBlur: {
        type: ControlType.Number,
        title: "LB Blur",
        defaultValue: 12,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },

    lightboxTitleFont: {
        type: ControlType.Font,
        title: "LB Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Semibold",
            letterSpacing: "-0.04em",
            lineHeight: "1.05em",
        },
    },
    lightboxMetaFont: {
        type: ControlType.Font,
        title: "LB Meta",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    lightboxTitleColor: {
        type: ControlType.Color,
        title: "LB Title",
        defaultValue: "#FFFFFF",
    },
    lightboxMetaColor: {
        type: ControlType.Color,
        title: "LB Meta",
        defaultValue: "rgba(255,255,255,0.78)",
    },

    arrowBg: {
        type: ControlType.Color,
        title: "Arrow Bg",
        defaultValue: "rgba(255,255,255,0.14)",
    },
    arrowFg: {
        type: ControlType.Color,
        title: "Arrow Fg",
        defaultValue: "#FFFFFF",
    },
    uiFg: {
        type: ControlType.Color,
        title: "UI",
        defaultValue: "rgba(255,255,255,0.92)",
    },
})
