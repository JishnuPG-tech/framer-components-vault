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


/* ------------------------------------------------------------------ */
/* Demo content. Invented brands, no external media, so the component  */
/* renders cleanly the moment it is dropped on a canvas.               */
/* ------------------------------------------------------------------ */

const DEFAULT_REELS = [
    {
        title: "Run Club Drop",
        color: "#1B2A4A",
        videoUrl: "",
        instagramUrl: "",
        products: [
            {
                productName: "Strive Velocity 3 Running Shoe",
                image: "",
                productUrl: "",
                price: 139,
                currencySymbol: "$",
                originalPrice: "$169",
                rating: 4.5,
                reviewCount: 1284,
                colors: "Black, Blue, Orange",
            },
            {
                productName: "Strive Featherlite Running Sock",
                image: "",
                productUrl: "",
                price: 18,
                currencySymbol: "$",
                originalPrice: "",
                rating: 4,
                reviewCount: 96,
                colors: "",
            },
        ],
    },
    {
        title: "Training Essentials",
        color: "#2E2E33",
        videoUrl: "",
        instagramUrl: "",
        products: [
            {
                productName: "Kinetic Dryflex Training Tee",
                image: "",
                productUrl: "",
                price: 44,
                currencySymbol: "$",
                originalPrice: "$55",
                rating: 4.5,
                reviewCount: 412,
                colors: "White, Grey, Green",
            },
            {
                productName: "Kinetic 7in Training Short",
                image: "",
                productUrl: "",
                price: 52,
                currencySymbol: "$",
                originalPrice: "",
                rating: 4,
                reviewCount: 233,
                colors: "",
            },
            {
                productName: "Kinetic Grip Lifting Glove",
                image: "",
                productUrl: "",
                price: 29,
                currencySymbol: "$",
                originalPrice: "$35",
                rating: 5,
                reviewCount: 78,
                colors: "",
            },
        ],
    },
    {
        title: "Court Series",
        color: "#0F5A4A",
        videoUrl: "",
        instagramUrl: "",
        products: [
            {
                productName: "Apex Court Pro Sneaker",
                image: "",
                productUrl: "",
                price: 119,
                currencySymbol: "$",
                originalPrice: "",
                rating: 4.5,
                reviewCount: 640,
                colors: "White, Black, Red",
            },
            {
                productName: "Apex Warm Up Track Jacket",
                image: "",
                productUrl: "",
                price: 98,
                currencySymbol: "$",
                originalPrice: "$120",
                rating: 4,
                reviewCount: 187,
                colors: "",
            },
        ],
    },
    {
        title: "Trail Collection",
        color: "#5A3F1F",
        videoUrl: "",
        instagramUrl: "",
        products: [
            {
                productName: "Northline Ridge Trail Shoe",
                image: "",
                productUrl: "",
                price: 165,
                currencySymbol: "$",
                originalPrice: "$189",
                rating: 5,
                reviewCount: 329,
                colors: "Beige, Navy, Orange",
            },
            {
                productName: "Northline 8L Hydration Vest",
                image: "",
                productUrl: "",
                price: 89,
                currencySymbol: "$",
                originalPrice: "",
                rating: 4.5,
                reviewCount: 141,
                colors: "",
            },
        ],
    },
    {
        title: "Everyday Wear",
        color: "#6C4FA1",
        videoUrl: "",
        instagramUrl: "",
        products: [
            {
                productName: "Velo Retro 82 Low Top",
                image: "",
                productUrl: "",
                price: 95,
                currencySymbol: "$",
                originalPrice: "$110",
                rating: 4.5,
                reviewCount: 2043,
                colors: "White, Beige, Pink",
            },
        ],
    },
    {
        title: "Behind the Shoot",
        color: "#1E4E79",
        videoUrl: "",
        instagramUrl: "",
        products: [],
    },
]

// Accepts ANY of the three things a user might paste:
//   1. The full "Copy embed code" blockquote (+ script) from Instagram.
//   2. A plain reel/post/tv link, e.g. https://www.instagram.com/reel/SHORTCODE/
//   3. An already-formed embed src ending in /embed/ or /embed/captioned/
// Returns a clean iframe src, or "" if nothing usable was found.
function toInstagramEmbedUrl(input: string): string {
    if (!input || !input.trim()) return ""
    // Decode the &amp; that appears inside copied blockquote permalinks.
    const raw = input.trim().replace(/&amp;/g, "&")

    // Already an embed src, pass through unchanged.
    if (/instagram\.com\/[^"'\s]*\/embed/i.test(raw)) {
        const m = raw.match(/https?:\/\/[^"'\s]*\/embed[^"'\s]*/i)
        if (m) return m[0]
    }

    // Pull the shortcode out of a permalink, blockquote, or bare URL.
    const match = raw.match(
        /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_\-]+)/i
    )
    if (match) {
        return `https://www.instagram.com/p/${match[1]}/embed/captioned/`
    }
    return ""
}

/* ------------------------------------------------------------------ */
/* Product card. Content is per-product, styling comes from the global */
/* panel controls so every card in the panel stays consistent.         */
/* ------------------------------------------------------------------ */

const COLOR_HEX: Record<string, string> = {
    red: "#D32F2F",
    blue: "#5B8DEF",
    green: "#2E9E6B",
    purple: "#9B6BD6",
    black: "#2B2B2B",
    pink: "#E58FB0",
    white: "#ECECEC",
    grey: "#9AA0A6",
    gray: "#9AA0A6",
    orange: "#F0883E",
    yellow: "#F4C430",
    beige: "#E4D9C6",
    navy: "#26324A",
    silver: "#C8CCD0",
    gold: "#D4AF63",
    brown: "#7A5230",
    teal: "#2E8B8B",
}

function colorToHex(name: any) {
    const key = (name || "").toLowerCase().trim()
    return COLOR_HEX[key] || key || "#CCCCCC"
}

function parseColors(str: any): string[] {
    if (!str || typeof str !== "string") return []
    return str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
}

function formatPrice(symbol: any, n: any, locale: string) {
    const num = Number(n)
    if (!isFinite(num) || num <= 0) return ""
    let formatted = String(num)
    try {
        formatted = num.toLocaleString(locale || "en-US")
    } catch (e) {}
    return `${symbol || ""} ${formatted}`.trim()
}

function PanelProductCard(props: any) {
    const {
        product,
        locale,
        starColor,
        cardBg,
        cardRadius,
        imageBgColor,
        fontSizeName,
        fontSizePrice,
        fontSizeOriginalPrice,
        fontSizeStars,
        fontSizeReviewCount,
        imageHeight,
        imageObjectFit,
        imagePaddingH,
        imagePaddingV,
        cardMaxWidth,
    } = props

    const {
        productName,
        image,
        colors: colorsStr,
        price,
        currencySymbol,
        originalPrice,
        rating,
        reviewCount,
        productUrl,
    } = product || {}

    const colors = React.useMemo(() => parseColors(colorsStr), [colorsStr])

    const [activeIdx, setActiveIdx] = React.useState(0)
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)
    const [cardHovered, setCardHovered] = React.useState(false)

    const activeImage = image || ""

    const clampedRating = Math.max(0, Math.min(5, Number(rating) || 0))
    const fillPct = (clampedRating / 5) * 100

    const clickable = !!productUrl
    const openProduct = () => {
        if (clickable && typeof window !== "undefined")
            window.open(productUrl, "_blank", "noopener")
    }

    return (
        <div
            onClick={openProduct}
            onMouseEnter={() => setCardHovered(true)}
            onMouseLeave={() => {
                setCardHovered(false)
                setHoveredIdx(null)
            }}
            style={{
                width: "100%",
                maxWidth: cardMaxWidth,
                borderRadius: cardRadius,
                backgroundColor: cardBg,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "inherit",
                flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.06)",
                cursor: clickable ? "pointer" : "default",
                transformOrigin: "center center",
                transform: cardHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: cardHovered
                    ? "0 6px 14px rgba(0,0,0,0.10), 0 16px 32px rgba(0,0,0,0.12)"
                    : "0 1px 3px rgba(0,0,0,0.06), 0 4px 14px rgba(0,0,0,0.05)",
                transition:
                    "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease",
                willChange: "transform",
            }}
        >
            {/* Image zone */}
            <div
                style={{
                    width: "100%",
                    height: imageHeight,
                    backgroundColor: imageBgColor,
                    flexShrink: 0,
                    overflow: "hidden",
                    padding: `${imagePaddingV}px ${imagePaddingH}px`,
                    boxSizing: "border-box",
                }}
            >
                {activeImage ? (
                    <img
                        src={activeImage}
                        alt={productName || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: imageObjectFit,
                            display: "block",
                        }}
                    />
                ) : (
                    <div style={{ width: "100%", height: "100%" }} />
                )}
            </div>

            <div
                style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: "rgba(0,0,0,0.06)",
                    flexShrink: 0,
                }}
            />

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    padding: "10px 12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    overflow: "hidden",
                }}
            >
                {colors.length > 1 && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 9,
                            alignItems: "center",
                        }}
                    >
                        {colors.map((c: string, i: number) => {
                            const hex = colorToHex(c)
                            const isActive = activeIdx === i
                            const isHovered = hoveredIdx === i
                            return (
                                <div
                                    key={i}
                                    title={c}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveIdx(i)
                                    }}
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: "50%",
                                        flexShrink: 0,
                                        cursor: "pointer",
                                        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65), rgba(255,255,255,0) 45%), ${hex}`,
                                        boxShadow: isActive
                                            ? "inset 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 1.5px #fff, 0 0 0 3px rgba(17,17,17,0.5)"
                                            : isHovered
                                              ? "inset 0 0 0 1px rgba(0,0,0,0.08), 0 0 0 1.5px #fff, 0 0 0 3px rgba(17,17,17,0.18)"
                                              : "inset 0 0 0 1px rgba(0,0,0,0.10)",
                                        transform: isActive
                                            ? "scale(1.06)"
                                            : "scale(1)",
                                        transition:
                                            "box-shadow 0.15s ease, transform 0.15s ease",
                                    }}
                                />
                            )
                        })}
                    </div>
                )}

                <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                    <div
                        style={{
                            fontSize: fontSizeName,
                            fontWeight: 700,
                            color: "#111",
                            lineHeight: 1.25,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {productName}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                lineHeight: 1,
                            }}
                            aria-label={`${clampedRating} out of 5 stars`}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    fontSize: fontSizeStars,
                                    letterSpacing: "1px",
                                    color: "#E0E0E0",
                                }}
                            >
                                ★★★★★
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: `${fillPct}%`,
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    fontSize: fontSizeStars,
                                    letterSpacing: "1px",
                                    color: starColor,
                                    pointerEvents: "none",
                                }}
                            >
                                ★★★★★
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: fontSizeReviewCount,
                                color: "#888",
                                lineHeight: 1.4,
                            }}
                        >
                            ({Number(reviewCount || 0).toLocaleString()})
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                        }}
                    >
                        {originalPrice ? (
                            <div
                                style={{
                                    fontSize: fontSizeOriginalPrice,
                                    color: "#AAA",
                                    textDecoration: "line-through",
                                    lineHeight: 1.4,
                                }}
                            >
                                {originalPrice}
                            </div>
                        ) : null}
                        <div
                            style={{
                                fontSize: fontSizePrice,
                                color: "#444",
                                fontWeight: 500,
                                lineHeight: 1.4,
                            }}
                        >
                            {formatPrice(currencySymbol, price, locale)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Shoppable Reels
 *
 * An infinite marquee of vertical video cards. Click any card to open it
 * fullscreen with an optional product panel beside it.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 480
 */
export default function ShoppableReels(props: any) {
    const {
        reels: reelsProp,
        speed = 40,
        direction = "right",
        pauseOnHover = true,
        playVideos = true,
        accent = "#707BCA",
        background = "#FEFEFE",
        // ticker card
        cardWidth = 200,
        cardHeight = 400,
        cardRadius = 36,
        cardGap = 24,
        centerScale = 1.08,
        showDeviceFrame = true,
        // instagram cropping
        igZoom = 1.15,
        igShiftY = -34,
        // navigation
        showArrows = true,
        showDots = true,
        // panel
        showProductPanel = true,
        panelSide = "right",
        panelWidth = 360,
        panelBg = "#ffffff",
        panelHeading = "{count} items in this video",
        headingColor = "#1a1a1a",
        headingSize = 22,
        cardMaxWidth = 240,
        // product card styling (global)
        locale = "en-US",
        starColor = "#FFB400",
        productCardBg = "#ffffff",
        productCardRadius = 12,
        imageBgColor = "#F3F3F5",
        imageHeight = 148,
        imageObjectFit = "contain",
        imagePaddingH = 0,
        imagePaddingV = 0,
        fontSizeName = 13,
        fontSizePrice = 12,
        fontSizeOriginalPrice = 11,
        fontSizeStars = 13,
        fontSizeReviewCount = 11,
        // labels
        toastText = "",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reels = reelsProp && reelsProp.length ? reelsProp : DEFAULT_REELS
    const N = reels.length

    // Scope every class name to this instance so multiple copies of the
    // component on one page never fight over the same CSS rules.
    const rawId = React.useId()
    const uid = `lc${String(rawId).replace(/[^a-zA-Z0-9]/g, "")}`
    const S = `[data-lc="${uid}"]`

    const [activeIndex, setActiveIndex] = React.useState(0)
    // -1 = closed. Otherwise the index into `reels` currently in fullscreen.
    const [fullscreenIndex, setFullscreenIndex] = React.useState(-1)
    const [showToast, setShowToast] = React.useState(false)

    const fullscreenCard =
        fullscreenIndex >= 0 && fullscreenIndex < N
            ? reels[fullscreenIndex]
            : null

    const containerRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef<number>(0)
    const offsetRef = React.useRef(0)
    const lastRef = React.useRef(0)
    const cardWRef = React.useRef(0)
    const stepRef = React.useRef(0)
    const setWidthRef = React.useRef(0)
    const containerWRef = React.useRef(0)
    const centerIdxRef = React.useRef(-1)
    const activeReelRef = React.useRef(0)
    const playStateRef = React.useRef<boolean[]>([])
    const scaleStateRef = React.useRef<number[]>([])
    const pausedHoverRef = React.useRef(false)
    const seekingRef = React.useRef(false)
    const fullscreenRef = React.useRef(false)
    const gapRef = React.useRef(cardGap)
    gapRef.current = cardGap
    const scaleRef = React.useRef(centerScale)
    scaleRef.current = centerScale

    // Drag-to-scroll state.
    const draggingRef = React.useRef(false)
    const dragStartXRef = React.useRef(0)
    const dragStartOffsetRef = React.useRef(0)
    const movedRef = React.useRef(false)

    // Playback-control state for the hover / in-view model.
    const hoverCapableRef = React.useRef(true)
    const hoveredNodeRef = React.useRef<HTMLElement | null>(null)
    const sectionInViewRef = React.useRef(true)

    React.useEffect(() => {
        fullscreenRef.current = fullscreenIndex >= 0
    }, [fullscreenIndex])

    // Lock background scroll while the fullscreen overlay is open, then
    // restore the page exactly as it was on close.
    React.useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        if (fullscreenIndex < 0) return
        const body = document.body
        const html = document.documentElement
        const prevBodyOverflow = body.style.overflow
        const prevHtmlOverflow = html.style.overflow
        const prevPadRight = body.style.paddingRight
        // Compensate for the vanishing scrollbar so the page doesn't shift.
        const sbw = window.innerWidth - html.clientWidth
        body.style.overflow = "hidden"
        html.style.overflow = "hidden"
        if (sbw > 0) body.style.paddingRight = `${sbw}px`
        return () => {
            body.style.overflow = prevBodyOverflow
            html.style.overflow = prevHtmlOverflow
            body.style.paddingRight = prevPadRight
        }
    }, [fullscreenIndex, isStatic])

    // Re-show the toast each time the fullscreen reel changes.
    React.useEffect(() => {
        if (fullscreenIndex < 0) return
        setShowToast(true)
        if (typeof window === "undefined") return
        const t = window.setTimeout(() => setShowToast(false), 2500)
        return () => window.clearTimeout(t)
    }, [fullscreenIndex])

    // Detect hover capability once (desktop = hover, touch = in-view).
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        hoverCapableRef.current = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches
    }, [])

    const k = Math.max(1, Math.ceil(8 / Math.max(1, N)))
    const loop: { reel: any; reelIndex: number; key: string }[] = []
    for (let r = 0; r < 2 * k; r++) {
        reels.forEach((reel: any, i: number) => {
            loop.push({ reel, reelIndex: i, key: `${i}-${r}` })
        })
    }

    const dirSign = direction === "left" ? -1 : 1

    const measure = React.useCallback(() => {
        const track = trackRef.current
        const container = containerRef.current
        if (!track || !container || !track.children.length) return
        const first = track.children[0] as HTMLElement
        // Unscaled width, so proximity scaling never feeds back into layout.
        const cardW = first.offsetWidth
        if (!cardW) return
        const total = track.children.length
        const setCount = total / 2
        const step = cardW + gapRef.current
        cardWRef.current = cardW
        stepRef.current = step
        setWidthRef.current = setCount * step
        containerWRef.current = container.getBoundingClientRect().width
        if (offsetRef.current === 0)
            offsetRef.current = -setWidthRef.current / 2
    }, [])

    React.useLayoutEffect(() => {
        if (isStatic) return
        measure()
        if (typeof window === "undefined") return
        const onResize = () => measure()
        window.addEventListener("resize", onResize)
        let ro: ResizeObserver | undefined
        if (containerRef.current && "ResizeObserver" in window) {
            ro = new ResizeObserver(() => measure())
            ro.observe(containerRef.current)
        }
        return () => {
            window.removeEventListener("resize", onResize)
            if (ro) ro.disconnect()
        }
    }, [
        isStatic,
        measure,
        N,
        k,
        speed,
        direction,
        cardWidth,
        cardHeight,
        cardGap,
    ])

    // Section-level in-view detection, drives mobile play/pause.
    React.useEffect(() => {
        if (isStatic) return
        if (
            typeof window === "undefined" ||
            !("IntersectionObserver" in window)
        )
            return
        const el = containerRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                sectionInViewRef.current = entries[0]?.isIntersecting ?? true
            },
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic) return
        const track = trackRef.current
        if (!track) return
        lastRef.current = performance.now()
        centerIdxRef.current = -1

        const frame = (now: number) => {
            const dt = Math.min(0.05, (now - lastRef.current) / 1000)
            lastRef.current = now
            const step = stepRef.current
            const cardW = cardWRef.current
            const cw = containerWRef.current
            const setW = setWidthRef.current

            if (step > 0 && setW > 0 && cw > 0) {
                const running =
                    !pausedHoverRef.current &&
                    !seekingRef.current &&
                    !fullscreenRef.current &&
                    !draggingRef.current
                if (!seekingRef.current) {
                    if (running) {
                        let o = offsetRef.current + dirSign * speed * dt
                        if (o <= -setW) o += setW
                        if (o > 0) o -= setW
                        offsetRef.current = o
                    }
                    track.style.transform = `translate3d(${offsetRef.current}px,0,0)`
                }

                const o = offsetRef.current
                const target = cw / 2
                const total = track.children.length
                let bestI = 0
                let bestD = Infinity
                const hovered = hoveredNodeRef.current
                const hoverMode = hoverCapableRef.current
                const sectionIn = sectionInViewRef.current
                // While the overlay is open, freeze all ticker video playback.
                const overlayOpen = fullscreenRef.current
                // Cards reach full size at the centre and taper off across
                // roughly one and a half card widths on each side.
                const falloff = step * 1.5
                const peak = scaleRef.current

                for (let i = 0; i < total; i++) {
                    const node = track.children[i] as HTMLElement
                    const c = o + i * step + cardW / 2
                    const d = Math.abs(c - target)
                    if (d < bestD) {
                        bestD = d
                        bestI = i
                    }

                    // Continuous proximity scale. Written every frame as a CSS
                    // variable, so the size eases in and out with the motion
                    // instead of snapping when a "centre card" is picked.
                    const t = Math.max(0, 1 - d / falloff)
                    const eased = t * t * (3 - 2 * t)
                    const s = 1 + (peak - 1) * eased
                    if (
                        scaleStateRef.current[i] === undefined ||
                        Math.abs(scaleStateRef.current[i] - s) > 0.0005
                    ) {
                        scaleStateRef.current[i] = s
                        node.style.setProperty("--lc-s", s.toFixed(4))
                    }

                    // Manage <video> playback only (iframes are uncontrollable).
                    const vid = node.querySelector(
                        "video"
                    ) as HTMLVideoElement | null
                    if (vid) {
                        const horizVisible = d < cw / 2 + cardW
                        // Desktop: play the card under the cursor.
                        // Touch:   play visible cards while section is in view.
                        const want =
                            playVideos &&
                            !overlayOpen &&
                            horizVisible &&
                            (hoverMode ? node === hovered : sectionIn)
                        if (playStateRef.current[i] !== want) {
                            playStateRef.current[i] = want
                            if (want) {
                                const p = vid.play()
                                if (p && p.catch) p.catch(() => {})
                            } else {
                                vid.pause()
                                // Reset to first frame so idle = thumbnail.
                                try {
                                    vid.currentTime = 0
                                } catch (e) {}
                            }
                        }
                    }
                }

                if (bestI !== centerIdxRef.current) {
                    centerIdxRef.current = bestI
                    const reelIdx = bestI % N
                    if (reelIdx !== activeReelRef.current) {
                        activeReelRef.current = reelIdx
                        setActiveIndex(reelIdx)
                    }
                }
            }
            rafRef.current = requestAnimationFrame(frame)
        }
        rafRef.current = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(rafRef.current)
    }, [isStatic, N, k, speed, direction, playVideos])

    // Fullscreen navigation.
    const goNext = React.useCallback(() => {
        if (N <= 0) return
        setFullscreenIndex((i) => (i < 0 ? i : (i + 1) % N))
    }, [N])
    const goPrev = React.useCallback(() => {
        if (N <= 0) return
        setFullscreenIndex((i) => (i < 0 ? i : (i - 1 + N) % N))
    }, [N])
    const goToReel = React.useCallback(
        (idx: number) => {
            if (N <= 0) return
            setFullscreenIndex(((idx % N) + N) % N)
        },
        [N]
    )

    // Keyboard control while the overlay is open.
    React.useEffect(() => {
        if (isStatic || fullscreenIndex < 0 || typeof window === "undefined")
            return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") goNext()
            else if (e.key === "ArrowLeft") goPrev()
            else if (e.key === "Escape") setFullscreenIndex(-1)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isStatic, fullscreenIndex, goNext, goPrev])

    // Pointer drag-to-scroll. Updates offsetRef directly; the RAF loop is
    // paused via draggingRef so it paints our offset without auto-advancing.
    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic) return
        draggingRef.current = true
        movedRef.current = false
        dragStartXRef.current = e.clientX
        dragStartOffsetRef.current = offsetRef.current
        const track = trackRef.current
        if (track) track.style.transition = "none"
        try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch (err) {}
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (!draggingRef.current) return
        const dx = e.clientX - dragStartXRef.current
        if (Math.abs(dx) > 4) movedRef.current = true
        const setW = setWidthRef.current
        let o = dragStartOffsetRef.current + dx
        if (setW > 0) {
            while (o <= -setW) o += setW
            while (o > 0) o -= setW
        }
        offsetRef.current = o
        const track = trackRef.current
        if (track) track.style.transform = `translate3d(${o}px,0,0)`
    }

    const onPointerUp = (e: React.PointerEvent) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        lastRef.current =
            typeof performance !== "undefined" ? performance.now() : 0
        try {
            ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
        } catch (err) {}
        // Pointer capture retargets the native click to the track, so the
        // card's own onClick never fires. Resolve the tapped card here.
        if (!movedRef.current && typeof document !== "undefined") {
            const el = document.elementFromPoint(
                e.clientX,
                e.clientY
            ) as HTMLElement | null
            const card = el?.closest(".lc-card") as HTMLElement | null
            if (card) {
                const idx = Number(card.getAttribute("data-reel"))
                if (!Number.isNaN(idx) && reels[idx]) handleCardClick(idx)
            }
        }
        movedRef.current = false
    }

    const handleCardClick = (idx: number) => {
        if (isStatic) return
        setFullscreenIndex(idx)
    }

    const staticCenter = Math.floor(N / 2)
    const displayList = isStatic
        ? reels.map((reel: any, i: number) => ({
              reel,
              reelIndex: i,
              key: `s-${i}`,
          }))
        : loop

    const gradientOf = (reel: any) =>
        `linear-gradient(160deg, #14141F, ${reel.color || "#16213E"})`
    // An uploaded file wins over a pasted URL.
    const srcOf = (reel: any) => reel.video || reel.videoUrl || ""
    const posterOf = (reel: any) =>
        (reel.poster && reel.poster.src) || reel.posterUrl || ""
    // igOf returns a usable embed src only when a real link/code was provided.
    const igOf = (reel: any): string =>
        toInstagramEmbedUrl(reel.instagramUrl || "")

    // Fullscreen-specific derived values.
    const fsProducts: any[] = (fullscreenCard && fullscreenCard.products) || []
    const panelVisible =
        showProductPanel && fsProducts.length > 0 && fullscreenCard != null
    const headingText = (panelHeading || "").replace(
        "{count}",
        String(fsProducts.length)
    )

    const ChevronLeft = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline
                points="15 18 9 12 15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
    const ChevronRight = (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline
                points="9 18 15 12 9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )

    return (
        <div
            data-lc={uid}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: background,
                fontFamily: "inherit",
                position: "relative",
                ...style,
            }}
        >
            <style>{`
        ${S} { --lc-accent: ${accent}; --lc-cw: ${cardWidth}px; --lc-ch: ${cardHeight}px; --lc-cr: ${cardRadius}px; }
        ${S} .lc-viewport { width: 100%; overflow: hidden; position: relative; padding: 52px 0 52px; box-sizing: border-box; }
        ${S} .lc-track { display: flex; gap: ${cardGap}px; align-items: center; width: max-content; justify-content: center; will-change: transform; cursor: grab; touch-action: pan-y; }
        ${S} .lc-track:active { cursor: grabbing; }
        ${S} .lc-track.lc-static { width: 100%; cursor: default; }
        /* --lc-s is written every frame by the RAF loop, so size eases with
           distance from centre rather than snapping on a class toggle. */
        ${S} .lc-card { --lc-s: 1; position: relative; width: var(--lc-cw); height: var(--lc-ch); background: #1A1A1A; border-radius: var(--lc-cr); flex-shrink: 0; box-shadow: 0 10px 25px rgba(0,0,0,0.10); user-select: none; cursor: pointer; transform: scale(var(--lc-s)); transform-origin: center center; will-change: transform; transition: box-shadow 0.3s ease; }
        ${S} .lc-card:hover { box-shadow: 0 16px 34px rgba(0,0,0,0.18); }
        ${S} .lc-btn { position: absolute; right: -3px; width: 3px; border-radius: 2px; background: #111; z-index: 10; }
        ${S} .lc-btn.vu { top: 28%; height: 28px; } ${S} .lc-btn.vd { top: 38%; height: 28px; } ${S} .lc-btn.pw { top: 50%; height: 18px; }
        ${S} .lc-screen { position: absolute; inset: 6px; border-radius: calc(var(--lc-cr) - 6px); overflow: hidden; z-index: 2; }
        ${S} .lc-card.lc-plain .lc-screen { inset: 0; border-radius: var(--lc-cr); }
        ${S} .lc-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; background: #000; }
        /* Crop wrapper for in-card IG embeds: hides header/footer chrome. */
        ${S} .lc-ig-crop { position: absolute; inset: 0; overflow: hidden; background: #000; z-index: 1; }
        ${S} .lc-ig-crop iframe { position: absolute; left: 50%; width: 100%; height: 680px; border: none; transform-origin: center center; }
        ${S} .lc-cam { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #0A0A0A; border-radius: 50%; z-index: 20; }
        ${S} .lc-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.18); border: 1.5px solid var(--lc-accent); display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; backdrop-filter: blur(2px); transition: opacity 0.3s ease; }
        ${S} .lc-play span { color: #FFF; font-size: 16px; margin-left: 3px; }

        /* Fullscreen overlay */
        ${S} .lc-overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; background: rgba(10,10,10,0.95); z-index: 9999; display: flex; align-items: center; justify-content: center; box-sizing: border-box; overscroll-behavior: contain; touch-action: none; }
        ${S} .lc-stage { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 28px; width: 100%; height: 100%; padding: 0 88px; box-sizing: border-box; }
        ${S} .lc-stage.lc-side-left { flex-direction: row-reverse; }
        ${S} .lc-media-wrap { display: flex; align-items: center; justify-content: center; flex: 0 1 auto; min-width: 0; }
        ${S} .lc-fs-vid { height: 86vh; max-height: 92vh; max-width: 100%; width: auto; object-fit: contain; border-radius: 16px; background: #000; box-shadow: 0 25px 60px rgba(0,0,0,0.5); display: block; }
        ${S} .lc-fs-fallback { width: min(360px, 86vw); height: 70vh; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 25px 60px rgba(0,0,0,0.5); position: relative; }
        ${S} .lc-ig-frame { width: min(400px, 92vw); height: min(720px, 86vh); background: #000; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
        ${S} .lc-ig-frame iframe { width: 100%; height: 100%; border: none; }

        /* Product panel */
        ${S} .lc-panel { flex: 0 0 auto; height: 86vh; max-height: 92vh; background: ${panelBg}; border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.4); display: flex; flex-direction: column; overflow: hidden; }
        ${S} .lc-panel-head { padding: 26px 24px 14px; font-weight: 700; letter-spacing: -0.02em; flex-shrink: 0; }
        ${S} .lc-panel-list { display: flex; flex-direction: column; gap: 16px; align-items: center; padding: 4px 24px 26px; overflow-y: auto; overflow-x: hidden; flex: 1; }

        /* Edge arrows */
        ${S} .lc-nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-radius: 50%; color: rgba(255,255,255,0.75); cursor: pointer; transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease; z-index: 4; padding: 0; }
        ${S} .lc-nav-arrow:hover { background: rgba(255,255,255,0.12); color: #FFF; }
        ${S} .lc-nav-arrow:active { transform: translateY(-50%) scale(0.92); }
        ${S} .lc-nav-prev { left: 22px; } ${S} .lc-nav-next { right: 22px; }

        /* Dots */
        ${S} .lc-dots { position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; z-index: 4; }
        ${S} .lc-dot { width: 8px; height: 8px; border-radius: 9999px; border: none; padding: 0; background: rgba(255,255,255,0.4); cursor: pointer; transition: width 0.3s cubic-bezier(0.22,1,0.36,1), background 0.25s ease; }
        ${S} .lc-dot:hover { background: rgba(255,255,255,0.7); }
        ${S} .lc-dot.lc-dot-active { width: 26px; background: var(--lc-accent); }

        ${S} .lc-close { position: absolute; top: 24px; right: 24px; width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.4); background: transparent; color: #FFF; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; line-height: 1; transition: all 0.2s ease; z-index: 5; }
        ${S} .lc-close:hover { background: rgba(255,255,255,0.1); border-color: #FFF; transform: scale(1.05); }
        ${S} .lc-toast { position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%) translateY(20px); background: rgba(25,25,25,0.95); border: 1px solid rgba(255,255,255,0.15); color: #FFF; padding: 10px 20px; border-radius: 9999px; font-size: 13px; font-weight: 500; opacity: 0; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275); pointer-events: none; z-index: 4; }
        ${S} .lc-toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }

        @media (max-width: 900px) {
          ${S} .lc-stage { flex-direction: column !important; padding: 64px 12px 84px; gap: 14px; justify-content: center; }
          ${S} .lc-fs-vid { height: auto; max-height: 56vh; width: auto; max-width: 92vw; }
          ${S} .lc-ig-frame { height: min(56vh, 560px); }
          ${S} .lc-panel { height: auto; max-height: 32vh; width: 100% !important; max-width: 94vw; }
          ${S} .lc-panel-head { padding: 16px 18px 8px; }
          ${S} .lc-panel-list { flex-direction: row; overflow-x: auto; overflow-y: hidden; padding: 4px 18px 18px; }
          ${S} .lc-panel-list > div { width: 150px; }
          ${S} .lc-nav-arrow { top: 30%; width: 42px; height: 42px; }
          ${S} .lc-nav-prev { left: 8px; } ${S} .lc-nav-next { right: 8px; }
        }
        @media (max-width: 640px) {
          ${S} .lc-card { width: calc(var(--lc-cw) * 0.8); height: calc(var(--lc-ch) * 0.8); border-radius: calc(var(--lc-cr) * 0.8); }
          ${S} .lc-screen { inset: 5px; border-radius: calc(var(--lc-cr) * 0.8 - 5px); }
          ${S} .lc-cam { top: 8px; width: 6px; height: 6px; }
          ${S} .lc-play { width: 36px; height: 36px; } ${S} .lc-play span { font-size: 12px; }
        }
      `}</style>

            <div className="lc-viewport" ref={containerRef}>
                <div
                    className={`lc-track${isStatic ? " lc-static" : ""}`}
                    ref={trackRef}
                    onMouseEnter={() => {
                        if (pauseOnHover) pausedHoverRef.current = true
                    }}
                    onMouseLeave={() => {
                        pausedHoverRef.current = false
                        lastRef.current =
                            typeof performance !== "undefined"
                                ? performance.now()
                                : 0
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    {displayList.map((item) => {
                        const src = srcOf(item.reel)
                        const poster = posterOf(item.reel)
                        const igSrc = igOf(item.reel)
                        const hasVideo = !!src
                        // The IG iframe only shows when there is no video to
                        // drive the motion behaviour (video is preferred).
                        const showIg = !isStatic && !hasVideo && !!igSrc
                        const frameCls = showDeviceFrame ? "" : " lc-plain"
                        // On canvas the RAF loop never runs, so seed the
                        // middle card's scale directly for the preview.
                        const staticStyle = isStatic
                            ? ({
                                  "--lc-s":
                                      item.reelIndex === staticCenter
                                          ? centerScale
                                          : 1,
                              } as React.CSSProperties)
                            : undefined
                        return (
                            <div
                                key={item.key}
                                data-reel={item.reelIndex}
                                className={`lc-card${frameCls}`}
                                title={item.reel.title || ""}
                                style={staticStyle}
                                onMouseEnter={(e) => {
                                    hoveredNodeRef.current = e.currentTarget
                                }}
                                onMouseLeave={(e) => {
                                    if (
                                        hoveredNodeRef.current ===
                                        e.currentTarget
                                    )
                                        hoveredNodeRef.current = null
                                }}
                            >
                                {showDeviceFrame && (
                                    <>
                                        <div className="lc-btn vu" />
                                        <div className="lc-btn vd" />
                                        <div className="lc-btn pw" />
                                    </>
                                )}
                                <div
                                    className="lc-screen"
                                    style={{
                                        background: showIg
                                            ? "#000"
                                            : gradientOf(item.reel),
                                    }}
                                >
                                    {!isStatic && hasVideo ? (
                                        <video
                                            className="lc-video"
                                            src={src}
                                            poster={poster || undefined}
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : showIg ? (
                                        <div className="lc-ig-crop">
                                            <iframe
                                                src={igSrc}
                                                title={
                                                    item.reel.title || "Reel"
                                                }
                                                scrolling="no"
                                                allowTransparency={true}
                                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                                style={{
                                                    top: `calc(50% + ${igShiftY}px)`,
                                                    transform: `translate(-50%, -50%) scale(${igZoom})`,
                                                }}
                                            />
                                        </div>
                                    ) : null}
                                    {showDeviceFrame && (
                                        <div className="lc-cam" />
                                    )}
                                    {/* Decorative play badge, never blocks the click. */}
                                    {!showIg && (
                                        <div className="lc-play">
                                            <span>▶</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {fullscreenCard &&
                (() => {
                    const igSrc = igOf(fullscreenCard)
                    const vidSrc = srcOf(fullscreenCard)
                    const showNav = showArrows && N > 1
                    const showIndicator = showDots && N > 1
                    return (
                        <div
                            className="lc-overlay"
                            onClick={(e) => {
                                if (e.target === e.currentTarget)
                                    setFullscreenIndex(-1)
                            }}
                        >
                            <button
                                className="lc-close"
                                onClick={() => setFullscreenIndex(-1)}
                                aria-label="Close"
                            >
                                &times;
                            </button>

                            {showNav && (
                                <button
                                    className="lc-nav-arrow lc-nav-prev"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        goPrev()
                                    }}
                                    aria-label="Previous reel"
                                >
                                    {ChevronLeft}
                                </button>
                            )}
                            {showNav && (
                                <button
                                    className="lc-nav-arrow lc-nav-next"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        goNext()
                                    }}
                                    aria-label="Next reel"
                                >
                                    {ChevronRight}
                                </button>
                            )}

                            <div
                                className={`lc-stage${panelSide === "left" ? " lc-side-left" : ""}`}
                                onClick={(e) => {
                                    if (e.target === e.currentTarget)
                                        setFullscreenIndex(-1)
                                }}
                            >
                                <div className="lc-media-wrap">
                                    {igSrc ? (
                                        <div className="lc-ig-frame">
                                            <iframe
                                                key={igSrc}
                                                src={igSrc}
                                                title={
                                                    fullscreenCard.title ||
                                                    "Reel"
                                                }
                                                scrolling="no"
                                                allowTransparency={true}
                                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                            />
                                        </div>
                                    ) : vidSrc ? (
                                        // Bare fullscreen video, no phone frame.
                                        // Advances on end; loops only when there
                                        // is a single reel.
                                        <video
                                            key={vidSrc}
                                            className="lc-fs-vid"
                                            src={vidSrc}
                                            poster={
                                                posterOf(fullscreenCard) ||
                                                undefined
                                            }
                                            autoPlay
                                            loop={N <= 1}
                                            playsInline
                                            controls
                                            onEnded={N > 1 ? goNext : undefined}
                                        />
                                    ) : (
                                        <div
                                            className="lc-fs-fallback"
                                            style={{
                                                background:
                                                    gradientOf(fullscreenCard),
                                            }}
                                        >
                                            <div className="lc-play">
                                                <span>▶</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {panelVisible && (
                                    <aside
                                        className="lc-panel"
                                        style={{ width: panelWidth }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {!!headingText && (
                                            <div
                                                className="lc-panel-head"
                                                style={{
                                                    color: headingColor,
                                                    fontSize: headingSize,
                                                }}
                                            >
                                                {headingText}
                                            </div>
                                        )}
                                        <div className="lc-panel-list">
                                            {fsProducts.map(
                                                (product: any, i: number) => (
                                                    <PanelProductCard
                                                        key={i}
                                                        product={product}
                                                        locale={locale}
                                                        starColor={starColor}
                                                        cardBg={productCardBg}
                                                        cardRadius={
                                                            productCardRadius
                                                        }
                                                        imageBgColor={
                                                            imageBgColor
                                                        }
                                                        fontSizeName={
                                                            fontSizeName
                                                        }
                                                        fontSizePrice={
                                                            fontSizePrice
                                                        }
                                                        fontSizeOriginalPrice={
                                                            fontSizeOriginalPrice
                                                        }
                                                        fontSizeStars={
                                                            fontSizeStars
                                                        }
                                                        fontSizeReviewCount={
                                                            fontSizeReviewCount
                                                        }
                                                        imageHeight={
                                                            imageHeight
                                                        }
                                                        imageObjectFit={
                                                            imageObjectFit
                                                        }
                                                        imagePaddingH={
                                                            imagePaddingH
                                                        }
                                                        imagePaddingV={
                                                            imagePaddingV
                                                        }
                                                        cardMaxWidth={
                                                            cardMaxWidth
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </aside>
                                )}
                            </div>

                            {showIndicator && (
                                <div
                                    className="lc-dots"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {reels.map((_: any, i: number) => (
                                        <button
                                            key={i}
                                            className={`lc-dot${i === fullscreenIndex ? " lc-dot-active" : ""}`}
                                            onClick={() => goToReel(i)}
                                            aria-label={`Go to reel ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            )}

                            {!!toastText && (
                                <div
                                    className={`lc-toast${showToast ? " on" : ""}`}
                                >
                                    {toastText}
                                </div>
                            )}
                        </div>
                    )
                })()}
        </div>
    )
}

ShoppableReels.defaultProps = {
    reels: DEFAULT_REELS,
    speed: 40,
    direction: "right",
    pauseOnHover: true,
    playVideos: true,
    accent: "#707BCA",
    background: "#FEFEFE",
    cardWidth: 200,
    cardHeight: 400,
    cardRadius: 36,
    cardGap: 24,
    centerScale: 1.08,
    showDeviceFrame: true,
    igZoom: 1.15,
    igShiftY: -34,
    showArrows: true,
    showDots: true,
    showProductPanel: true,
    panelSide: "right",
    panelWidth: 360,
    panelBg: "#ffffff",
    panelHeading: "{count} items in this video",
    headingColor: "#1a1a1a",
    headingSize: 22,
    cardMaxWidth: 240,
    locale: "en-US",
    starColor: "#FFB400",
    productCardBg: "#ffffff",
    productCardRadius: 12,
    imageBgColor: "#F3F3F5",
    imageHeight: 148,
    imageObjectFit: "contain",
    imagePaddingH: 0,
    imagePaddingV: 0,
    fontSizeName: 13,
    fontSizePrice: 12,
    fontSizeOriginalPrice: 11,
    fontSizeStars: 13,
    fontSizeReviewCount: 11,
    toastText: "",
}

addPropertyControls(ShoppableReels, {
    reels: {
        type: ControlType.Array,
        title: "Reels",
        maxCount: 12,
        description:
            "Each item is one card in the ticker. Add a video, or paste an Instagram link, then attach the products shown in it.",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Reel",
                    placeholder: "Internal label",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
                    description:
                        "Drives the card: idle thumbnail, play on hover, play in view on touch.",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://",
                    description: "Used only when no video file is uploaded.",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Thumbnail",
                    description: "Idle frame shown before the video plays.",
                },
                instagramUrl: {
                    type: ControlType.String,
                    title: "Instagram",
                    displayTextArea: true,
                    description:
                        "Paste an Instagram reel link, embed src, or the full copied embed code.",
                    placeholder: "https://www.instagram.com/reel/SHORTCODE/",
                },
                color: {
                    type: ControlType.Color,
                    title: "Tint",
                    defaultValue: "#16213E",
                    description:
                        "Placeholder gradient shown when there is no video.",
                },
                products: {
                    type: ControlType.Array,
                    title: "Products",
                    maxCount: 12,
                    control: {
                        type: ControlType.Object,
                        controls: {
                            productName: {
                                type: ControlType.String,
                                title: "Name",
                                defaultValue: "Product Name",
                            },
                            image: {
                                type: ControlType.File,
                                title: "Image",
                                allowedFileTypes: [
                                    "png",
                                    "jpg",
                                    "jpeg",
                                    "webp",
                                    "avif",
                                    "gif",
                                    "svg",
                                ],
                            },
                            productUrl: {
                                type: ControlType.Link,
                                title: "Link",
                            },
                            price: {
                                type: ControlType.Number,
                                title: "Price",
                                defaultValue: 0,
                                min: 0,
                                max: 100000000,
                                step: 1,
                                displayStepper: false,
                            },
                            currencySymbol: {
                                type: ControlType.String,
                                title: "Currency",
                                defaultValue: "$",
                                placeholder: "$",
                            },
                            originalPrice: {
                                type: ControlType.String,
                                title: "Compare At",
                                defaultValue: "",
                                placeholder: "$149",
                            },
                            rating: {
                                type: ControlType.Number,
                                title: "Rating",
                                defaultValue: 5,
                                min: 0,
                                max: 5,
                                step: 0.5,
                            },
                            reviewCount: {
                                type: ControlType.Number,
                                title: "Reviews",
                                defaultValue: 0,
                                min: 0,
                                max: 1000000,
                                step: 1,
                                displayStepper: true,
                            },
                            colors: {
                                type: ControlType.String,
                                title: "Colors",
                                defaultValue: "",
                                placeholder: "Black, White, Red",
                                description:
                                    "Comma separated. Shows a swatch row when there are two or more.",
                            },
                        },
                    },
                    defaultValue: [],
                },
            },
        },
        defaultValue: DEFAULT_REELS,
    },

    // Ticker
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
        unit: "px/s",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "right",
        options: ["right", "left"],
        optionTitles: ["Left to Right", "Right to Left"],
        displaySegmentedControl: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
    },
    playVideos: {
        type: ControlType.Boolean,
        title: "Play Videos",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#707BCA",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FEFEFE",
    },

    // Card
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 2,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 400,
        min: 160,
        max: 800,
        step: 2,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 36,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 24,
        min: 0,
        max: 96,
        step: 1,
        unit: "px",
    },
    centerScale: {
        type: ControlType.Number,
        title: "Center Scale",
        defaultValue: 1.08,
        min: 1,
        max: 1.4,
        step: 0.01,
        description:
            "How much the middle card grows. Size eases in and out with the scroll. Set to 1 for a flat row.",
    },
    showDeviceFrame: {
        type: ControlType.Boolean,
        title: "Phone Frame",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Side buttons, camera dot, and inset screen bezel.",
    },

    // Instagram cropping
    igZoom: {
        type: ControlType.Number,
        title: "IG Zoom",
        defaultValue: 1.15,
        min: 1,
        max: 2.5,
        step: 0.01,
        description:
            "Affects Instagram-only cards. Zooms in to fill the frame and hide the embed chrome.",
    },
    igShiftY: {
        type: ControlType.Number,
        title: "IG Offset Y",
        defaultValue: -34,
        min: -300,
        max: 200,
        step: 1,
        unit: "px",
        description: "Shifts the embed up or down to hide the header bar.",
    },

    // Fullscreen navigation
    showArrows: {
        type: ControlType.Boolean,
        title: "Nav Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Nav Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    toastText: {
        type: ControlType.String,
        title: "Toast",
        defaultValue: "",
        placeholder: "Leave empty to hide",
        description: "Small message that fades in when a reel opens.",
    },

    // Product panel
    showProductPanel: {
        type: ControlType.Boolean,
        title: "Product Panel",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Side panel of product cards in the fullscreen view. Appears only when a reel has products.",
    },
    panelSide: {
        type: ControlType.Enum,
        title: "Panel Side",
        defaultValue: "right",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        displaySegmentedControl: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        defaultValue: 360,
        min: 240,
        max: 560,
        step: 2,
        unit: "px",
        hidden: (p: any) => p.showProductPanel === false,
    },
    panelBg: {
        type: ControlType.Color,
        title: "Panel Bg",
        defaultValue: "#ffffff",
        hidden: (p: any) => p.showProductPanel === false,
    },
    panelHeading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "{count} items in this video",
        placeholder: "Leave empty to hide",
        description: "{count} is replaced with the number of products.",
        hidden: (p: any) => p.showProductPanel === false,
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#1a1a1a",
        hidden: (p: any) => p.showProductPanel === false,
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        defaultValue: 22,
        min: 12,
        max: 40,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    locale: {
        type: ControlType.String,
        title: "Number Locale",
        defaultValue: "en-US",
        placeholder: "en-US",
        description: "Locale used to group price digits. Try en-US or de-DE.",
        hidden: (p: any) => p.showProductPanel === false,
    },

    // Product card styling
    cardMaxWidth: {
        type: ControlType.Number,
        title: "Product Width",
        defaultValue: 240,
        min: 140,
        max: 360,
        step: 2,
        unit: "px",
        hidden: (p: any) => p.showProductPanel === false,
    },
    productCardBg: {
        type: ControlType.Color,
        title: "Product Bg",
        defaultValue: "#ffffff",
        hidden: (p: any) => p.showProductPanel === false,
    },
    productCardRadius: {
        type: ControlType.Number,
        title: "Product Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.showProductPanel === false,
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFB400",
        hidden: (p: any) => p.showProductPanel === false,
    },
    imageBgColor: {
        type: ControlType.Color,
        title: "Image Bg",
        defaultValue: "#F3F3F5",
        hidden: (p: any) => p.showProductPanel === false,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 148,
        min: 40,
        max: 260,
        step: 2,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    imageObjectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "contain",
        options: ["contain", "cover", "fill", "scale-down"],
        optionTitles: ["Contain", "Cover", "Fill", "Scale Down"],
        hidden: (p: any) => p.showProductPanel === false,
    },
    imagePaddingH: {
        type: ControlType.Number,
        title: "Image Pad X",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    imagePaddingV: {
        type: ControlType.Number,
        title: "Image Pad Y",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    fontSizeName: {
        type: ControlType.Number,
        title: "Font Name",
        defaultValue: 13,
        min: 8,
        max: 28,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    fontSizePrice: {
        type: ControlType.Number,
        title: "Font Price",
        defaultValue: 12,
        min: 8,
        max: 28,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    fontSizeOriginalPrice: {
        type: ControlType.Number,
        title: "Font Compare At",
        defaultValue: 11,
        min: 8,
        max: 28,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    fontSizeStars: {
        type: ControlType.Number,
        title: "Font Stars",
        defaultValue: 13,
        min: 8,
        max: 28,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
    fontSizeReviewCount: {
        type: ControlType.Number,
        title: "Font Reviews",
        defaultValue: 11,
        min: 8,
        max: 28,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.showProductPanel === false,
    },
})
