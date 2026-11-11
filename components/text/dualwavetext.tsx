import { useRef, useState, useEffect, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============================================================
// TYPES
// ============================================================

interface ItemData {
    leftText: string
    rightText: string
    image?: { src?: string; srcSet?: string; alt?: string }
}

interface Props {
    items: ItemData[]
    repeatItems: boolean
    waveNumber: number
    waveSpeed: number
    showThumbnail: boolean
    textColor: string
    focusedTextColor: string
    backgroundColor: string
    font: any
    topPadding: number
    bottomPadding: number
    style?: React.CSSProperties
}

// ============================================================
// CONSTANTS (matching source CSS exactly)
// ============================================================

const FALLBACK_IMAGE =
    "https://i.ibb.co.com/h1BL0JdK/Mysterious-Fabric-Covered-Portrait.png"

const SMOOTHING = 0.1
const THUMB_LERP = 0.12
const MOBILE_BP = "(max-width: 1023px)"

// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_ITEMS: ItemData[] = [
    { leftText: "Horizon", rightText: "Architecture" },
    { leftText: "Lumière", rightText: "Photography" },
    { leftText: "Cascade", rightText: "Typography" },
    { leftText: "Monolith", rightText: "Industrial" },
    { leftText: "Whisper", rightText: "Sound Design" },
    { leftText: "Prism", rightText: "Visual Arts" },
    { leftText: "Terraform", rightText: "Landscape" },
    { leftText: "Symmetra", rightText: "Fashion" },
    { leftText: "Epoch", rightText: "Film" },
    { leftText: "Nebula", rightText: "Digital Art" },
    { leftText: "Solstice", rightText: "Interior" },
    { leftText: "Vortex", rightText: "Motion" },
    { leftText: "Meridian", rightText: "Branding" },
    { leftText: "Cipher", rightText: "Technology" },
    { leftText: "Aurora", rightText: "Lighting" },
    { leftText: "Patina", rightText: "Sculpture" },
    { leftText: "Zenith", rightText: "Editorial" },
    { leftText: "Mirage", rightText: "Installation" },
    { leftText: "Cadence", rightText: "Music" },
    { leftText: "Parallax", rightText: "Web Design" },
    { leftText: "Vertex", rightText: "3D Design" },
    { leftText: "Ember", rightText: "Ceramics" },
    { leftText: "Silhouette", rightText: "Illustration" },
    { leftText: "Resonance", rightText: "Audio" },
]

// ============================================================
// HOOKS
// ============================================================

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia(query)
        setMatches(mq.matches)
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [query])
    return matches
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Dual Wave Text Animation — Scroll-driven sine wave text columns
 * with focused highlighting and crossfading center image.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 2400
 */
export default function DualWaveTextAnimation(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        repeatItems = true,
        waveNumber = 12,
        waveSpeed = 1,
        showThumbnail = true,
        textColor = "#4d4d4d",
        focusedTextColor = "#ffffff",
        backgroundColor = "#000000",
        font,
        topPadding = 500,
        bottomPadding = 500,
        style,
    } = props

    // Responsive breakpoint
    const isMobile = useMediaQuery(MOBILE_BP)

    // Responsive values matching source CSS
    const columnGap = isMobile ? "10vw" : "25vw"
    const itemGap = isMobile ? "2.5rem" : "1.25rem"
    const fontSize = isMobile ? "5vw" : "clamp(2rem, 10vw, 3rem)"
    const thumbWidth = isMobile ? "50vw" : "15vw"

    // DOM refs
    const wrapperRef = useRef<HTMLDivElement>(null)
    const leftColRef = useRef<HTMLDivElement>(null)
    const rightColRef = useRef<HTMLDivElement>(null)
    const leftRefs = useRef<(HTMLDivElement | null)[]>([])
    const rightRefs = useRef<(HTMLDivElement | null)[]>([])
    const thumbWrapperRef = useRef<HTMLDivElement>(null)
    const imgARef = useRef<HTMLImageElement>(null)
    const imgBRef = useRef<HTMLImageElement>(null)

    // Animation refs (no state = no re-renders during RAF)
    const currentXLeft = useRef<number[]>([])
    const currentXRight = useRef<number[]>([])
    const measuresRef = useRef({ leftRange: 0, rightRange: 0 })
    const focusedIdxRef = useRef(-1)
    const currentImageRef = useRef(FALLBACK_IMAGE)
    const activeLayerRef = useRef<"A" | "B">("A")
    const currentThumbY = useRef(0)
    const rafRef = useRef(0)
    const isVisibleRef = useRef(true)

    // React state — only for text color (infrequent updates)
    const [focusedIndex, setFocusedIndex] = useState(-1)

    // Display items (doubled when repeat is on, matching source HTML)
    const displayItems = useMemo(() => {
        if (!items || items.length === 0) return []
        return repeatItems ? [...items, ...items] : items
    }, [items, repeatItems])

    // Resolve image for display index → source item
    const getImageForIndex = useCallback(
        (idx: number): { src: string; srcSet?: string; alt?: string } => {
            if (!items || items.length === 0) return { src: FALLBACK_IMAGE }
            const item = items[idx % items.length]
            if (!item?.image?.src) return { src: FALLBACK_IMAGE }
            return {
                src: item.image.src,
                srcSet: item.image.srcSet,
                alt: item.image.alt || "",
            }
        },
        [items]
    )

    // Sine wave math (matching source DualWaveAnimation.js)
    const getWaveX = useCallback(
        (index: number, progress: number, range: number, direction: number) => {
            const phase =
                waveNumber * index +
                waveSpeed * progress * Math.PI * 2 -
                Math.PI / 2
            return ((Math.sin(phase) + 1) / 2) * range * direction
        },
        [waveNumber, waveSpeed]
    )

    // Measure columns, cache ranges
    const updateMeasures = useCallback(() => {
        const lc = leftColRef.current
        const rc = rightColRef.current
        if (!lc || !rc) return

        let maxLW = 0
        let maxRW = 0
        for (const el of leftRefs.current)
            if (el) maxLW = Math.max(maxLW, el.offsetWidth)
        for (const el of rightRefs.current)
            if (el) maxRW = Math.max(maxRW, el.offsetWidth)

        measuresRef.current.leftRange = Math.max(0, lc.offsetWidth - maxLW)
        measuresRef.current.rightRange = Math.max(0, rc.offsetWidth - maxRW)
    }, [])

    // Crossfade via direct DOM (no state, stable ref, never restarts RAF)
    const crossfadeTo = useCallback(
        (img: { src: string; srcSet?: string; alt?: string }) => {
            if (!img.src || img.src === currentImageRef.current) return
            currentImageRef.current = img.src

            const a = imgARef.current
            const b = imgBRef.current
            if (!a || !b) return

            if (activeLayerRef.current === "A") {
                b.src = img.src
                b.srcset = img.srcSet || ""
                b.alt = img.alt || ""
                a.style.opacity = "0"
                b.style.opacity = "1"
                activeLayerRef.current = "B"
            } else {
                a.src = img.src
                a.srcset = img.srcSet || ""
                a.alt = img.alt || ""
                b.style.opacity = "0"
                a.style.opacity = "1"
                activeLayerRef.current = "A"
            }
        },
        []
    )

    // Visibility observer — skip RAF work when off-screen
    useEffect(() => {
        const w = wrapperRef.current
        if (!w) return
        const obs = new IntersectionObserver(
            ([e]) => {
                isVisibleRef.current = e.isIntersecting
            },
            { rootMargin: "200px" }
        )
        obs.observe(w)
        return () => obs.disconnect()
    }, [])

    // Recalculate on resize / responsive change
    useEffect(() => {
        updateMeasures()
        window.addEventListener("resize", updateMeasures)
        return () => window.removeEventListener("resize", updateMeasures)
    }, [updateMeasures, displayItems, isMobile])

    // Main animation loop
    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper || displayItems.length === 0) return

        const count = displayItems.length
        currentXLeft.current = new Array(count).fill(0)
        currentXRight.current = new Array(count).fill(0)
        focusedIdxRef.current = -1
        let running = true

        // Initial wave pose
        const init = () => {
            updateMeasures()
            const { leftRange, rightRange } = measuresRef.current
            for (let i = 0; i < count; i++) {
                const lx = getWaveX(i, 0.3, leftRange, 1)
                const rx = getWaveX(i, 0.3, rightRange, -1)
                currentXLeft.current[i] = lx
                currentXRight.current[i] = rx
                const le = leftRefs.current[i]
                const re = rightRefs.current[i]
                if (le) le.style.transform = `translateX(${lx}px)`
                if (re) re.style.transform = `translateX(${rx}px)`
            }
        }
        requestAnimationFrame(init)

        const tick = () => {
            if (!running) return
            if (!isVisibleRef.current) {
                rafRef.current = requestAnimationFrame(tick)
                return
            }

            const rect = wrapper.getBoundingClientRect()
            const vh = window.innerHeight
            const progress = Math.max(
                0,
                Math.min(1, (vh - rect.top) / (vh + rect.height))
            )

            const { leftRange, rightRange } = measuresRef.current
            const centerY = vh / 2

            // Focused item — closest to viewport center
            let closest = 0
            let minD = Infinity
            for (let i = 0; i < count; i++) {
                const el = leftRefs.current[i]
                if (!el) continue
                const r = el.getBoundingClientRect()
                const d = Math.abs(r.top + r.height / 2 - centerY)
                if (d < minD) {
                    minD = d
                    closest = i
                }
            }

            if (closest !== focusedIdxRef.current) {
                focusedIdxRef.current = closest
                setFocusedIndex(closest)
                crossfadeTo(getImageForIndex(closest))
            }

            // Thumbnail Y — smooth follow viewport center
            const tw = thumbWrapperRef.current
            if (tw) {
                const tH = tw.offsetHeight
                const wH = wrapper.offsetHeight
                const ideal = centerY - rect.top - tH / 2
                const target = Math.max(-tH / 2, Math.min(wH - tH / 2, ideal))
                currentThumbY.current +=
                    (target - currentThumbY.current) * THUMB_LERP
                tw.style.transform = `translate(-50%, ${currentThumbY.current}px)`
            }

            // Wave positions with lerp
            for (let i = 0; i < count; i++) {
                const tL = getWaveX(i, progress, leftRange, 1)
                const tR = getWaveX(i, progress, rightRange, -1)
                currentXLeft.current[i] +=
                    (tL - currentXLeft.current[i]) * SMOOTHING
                currentXRight.current[i] +=
                    (tR - currentXRight.current[i]) * SMOOTHING

                const le = leftRefs.current[i]
                const re = rightRefs.current[i]
                if (le)
                    le.style.transform = `translateX(${currentXLeft.current[i]}px)`
                if (re)
                    re.style.transform = `translateX(${currentXRight.current[i]}px)`
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            running = false
            cancelAnimationFrame(rafRef.current)
        }
    }, [displayItems, getWaveX, updateMeasures, getImageForIndex, crossfadeTo])

    // Empty state
    if (displayItems.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    color: textColor,
                    ...font,
                    fontSize: 14,
                    ...style,
                }}
            >
                Add items in the property panel
            </div>
        )
    }

    // Shared text style
    const textStyle = (i: number): React.CSSProperties => ({
        ...font,
        whiteSpace: "nowrap",
        fontSize,
        textTransform: "uppercase",
        color: focusedIndex === i ? focusedTextColor : textColor,
        transition: "color 300ms ease-out",
        willChange: "transform",
    })

    return (
        <div
            ref={wrapperRef}
            style={{
                display: "flex",
                width: "100%",
                position: "relative",
                gap: columnGap,
                paddingTop: topPadding,
                paddingBottom: bottomPadding,
                backgroundColor,
                ...font,
                overflow: "hidden",
                ...style,
            }}
        >
            {/* Left Column */}
            <div
                ref={leftColRef}
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: itemGap,
                    alignItems: "flex-start",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {displayItems.map((item, i) => (
                    <div
                        key={`l-${i}`}
                        ref={(el) => {
                            leftRefs.current[i] = el
                        }}
                        style={textStyle(i)}
                    >
                        {item.leftText}
                    </div>
                ))}
            </div>

            {/* Center Thumbnail */}
            <div
                ref={thumbWrapperRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translate(-50%, 0)",
                    width: thumbWidth,
                    aspectRatio: "2/3",
                    zIndex: 1,
                    pointerEvents: "none",
                    display: "grid",
                    overflow: "hidden",
                    opacity: showThumbnail ? 1 : 0,
                    transition: "opacity 0.4s ease-out",
                }}
            >
                <img
                    ref={imgARef}
                    src={FALLBACK_IMAGE}
                    alt=""
                    style={{
                        gridArea: "1 / 1",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 1,
                        transition: "opacity 0.6s ease-in-out",
                    }}
                />
                <img
                    ref={imgBRef}
                    src={FALLBACK_IMAGE}
                    alt=""
                    style={{
                        gridArea: "1 / 1",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0,
                        transition: "opacity 0.6s ease-in-out",
                    }}
                />
            </div>

            {/* Right Column */}
            <div
                ref={rightColRef}
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: itemGap,
                    alignItems: "flex-end",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {displayItems.map((item, i) => (
                    <div
                        key={`r-${i}`}
                        ref={(el) => {
                            rightRefs.current[i] = el
                        }}
                        style={textStyle(i)}
                    >
                        {item.rightText}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================
// PROPERTY CONTROLS
// ============================================================

addPropertyControls(DualWaveTextAnimation, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                leftText: {
                    type: ControlType.String,
                    title: "Left Text",
                    defaultValue: "Project",
                },
                rightText: {
                    type: ControlType.String,
                    title: "Right Text",
                    defaultValue: "Discipline",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    repeatItems: {
        type: ControlType.Boolean,
        title: "Repeat Items",
        defaultValue: true,
    },
    waveNumber: {
        type: ControlType.Number,
        title: "Wave Cycles",
        defaultValue: 12,
        min: 1,
        max: 30,
        step: 1,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    showThumbnail: {
        type: ControlType.Boolean,
        title: "Show Image",
        defaultValue: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#4d4d4d",
    },
    focusedTextColor: {
        type: ControlType.Color,
        title: "Focused Color",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            lineHeight: "0.7em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    topPadding: {
        type: ControlType.Number,
        title: "Top Padding",
        defaultValue: 500,
        min: 0,
        max: 1500,
        step: 10,
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "Bottom Padding",
        defaultValue: 500,
        min: 0,
        max: 1500,
        step: 10,
    },
})
