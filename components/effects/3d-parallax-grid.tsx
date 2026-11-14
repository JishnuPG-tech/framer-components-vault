// Staggered 3D Grid Animations - Framer Code Component (No external dependencies)
// Based on Codrops demo (https://tympanus.net/codrops/?p=81462)
// Rewritten with native browser APIs — no GSAP, no Lenis, no SplitText CDN required.

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


// ---------- Defaults ----------
const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    "https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800",
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800",
    "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800",
    "https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=800",
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
    "https://images.unsplash.com/photo-1418489098061-ce87b5dc3aee?w=800",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800",
    "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800",
    "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=800",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800",
    "https://images.unsplash.com/photo-1447690709975-318628b14c57?w=800",
]

// ---------- CSS (injected once) ----------
const CSS_ID = "s3d-grid-styles"
const CSS_TEXT = `
.s3d-root *,
.s3d-root *::after,
.s3d-root *::before { box-sizing: border-box; }

.s3d-root {
  --color-text: #fff;
  --color-bg: #000;
  --color-link: #fff;
  --color-link-hover: #ef5d36;
  --grid-width: 100%;
  --grid-max-width: 300px;
  --grid-item-ratio: 1.2;
  --grid-item-radius: 4px;
  --grid-gap: 2rem;
  --grid-columns: 2;
  font-size: 16px;
  color: var(--color-text);
  background-color: var(--color-bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  overflow-x: hidden;
  position: relative;
}
.s3d-root .font-alt { font-family: "Courier New", ui-monospace, monospace; font-weight: 400; letter-spacing: 0.02em; }
.s3d-root .shadow { position: relative; overflow: hidden; width: 100%; }
.s3d-root .mark {
  position: fixed; top: 50%; transform: translateY(-50%);
  width: 100vw; left: 0; z-index: 50; overflow: hidden; pointer-events: none;
}
.s3d-root .mark__inner {
  display: flex; gap: 3rem; width: max-content; position: relative;
  transform: translateX(100vw); will-change: transform;
}
.s3d-root .mark__inner span {
  white-space: nowrap; text-transform: uppercase; font-size: 3rem; line-height: 1;
}
.s3d-root section { display: grid; place-items: center; width: 100%; position: relative; }
.s3d-root .shadow::after {
  content: ''; top: 0; left: 0; position: absolute;
  width: 100%; height: 100%; z-index: 5000; pointer-events: none;
  background: linear-gradient(to right, var(--color-bg), transparent, var(--color-bg));
  background-repeat: no-repeat; background-size: 100%;
}
.s3d-root .grid {
  padding: 20vh 0; width: var(--grid-width); max-width: var(--grid-max-width);
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  position: relative; display: grid; gap: var(--grid-gap);
  margin-top: 20vh; margin-bottom: 10vh;
}
.s3d-root .grid__item {
  margin: 0; position: relative; z-index: 1; perspective: 800px;
  will-change: transform, opacity;
}
.s3d-root .grid__item-imgwrap {
  width: 100%; aspect-ratio: var(--grid-item-ratio);
  border-radius: var(--grid-item-radius);
  transform-style: preserve-3d;
  position: relative; overflow: hidden; will-change: filter, transform;
}
.s3d-root .grid__item-img {
  background-size: cover; background-position: 50% 20%;
  backface-visibility: hidden; will-change: transform;
  width: 100%; height: 100%;
  position: absolute; top: 0; left: 0;
}
`

function injectCSS() {
    if (typeof document === "undefined") return
    if (document.getElementById(CSS_ID)) return
    const style = document.createElement("style")
    style.id = CSS_ID
    style.textContent = CSS_TEXT
    document.head.appendChild(style)
}

// ---------- Utilities ----------
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v))

// Eases
const sineIn = (t: number) => 1 - Math.cos((t * Math.PI) / 2)
const sineOut = (t: number) => Math.sin((t * Math.PI) / 2)

// Trigger-progress helper replicating GSAP ScrollTrigger labels.
function getTriggerProgress(
    el: HTMLElement,
    startLabel: "top bottom" | "top bottom+=10%" = "top bottom",
    endLabel:
        | "bottom top"
        | "bottom top-=25%"
        | "center center"
        | "center center-=25%"
        | "clamp(bottom top)" = "bottom top"
): number {
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    let startY: number, endY: number
    if (startLabel === "top bottom+=10%") startY = vh + vh * 0.1
    else startY = vh
    const h = rect.height
    if (endLabel === "bottom top-=25%") endY = -h - vh * 0.25
    else if (endLabel === "bottom top" || endLabel === "clamp(bottom top)")
        endY = -h
    else if (endLabel === "center center") endY = vh / 2 - h / 2
    else if (endLabel === "center center-=25%")
        endY = vh / 2 - h / 2 - vh * 0.25
    else endY = -h
    const current = rect.top
    return clamp((startY - current) / (startY - endY), 0, 1)
}

// ---------- Marquee names & grid indices ----------
const MARQUEE_NAMES: Array<[string, string]> = [
    ["Sora Takahashi", "空 高橋"],
    ["Aoi Nakamura", "葵 中村"],
    ["Ren Fujimoto", "蓮 藋本"],
    ["Mio Sakurai", "澪 桜井"],
    ["Shin Yamamoto", "真 山本"],
    ["Kaori Kobayashi", "香織 小林"],
    ["Hikari Inoue", "光 井上"],
    ["Yuki Kinoshita", "雪 木下"],
    ["Rina Ishikawa", "莉奈 石川"],
    ["Kaito Matsumoto", "海斗 松本"],
]

const FIRST_GRID_INDICES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 1, 2,
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 1, 2, 3, 4,
    5, 6, 7, 8, 9, 10, 11, 12,
]

// ---------- Props Interface ----------
interface Staggered3DGridProps {
    images?: any[]
    backgroundColor?: string
    textColor?: string
    gridColumns?: number
    gridGap?: number
    gridMaxWidth?: number
    gridItemRatio?: number
    gridItemRadius?: number
    animationIntensity?: number
    blurAmount?: number
    showMarquee?: boolean
    marqueeText?: Array<{ name1: string; name2: string }>
    marqueeFont?: any
    showShadowGradient?: boolean
}

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2500
 */
export default function Staggered3DGrid(props: Staggered3DGridProps) {
    const isStatic = useIsStaticRenderer()
    const {
        images = DEFAULT_IMAGES,
        backgroundColor = "#000",
        textColor = "#fff",
        gridColumns = 2,
        gridGap = 2,
        gridMaxWidth = 300,
        gridItemRatio = 1.2,
        gridItemRadius = 4,
        animationIntensity = 1,
        blurAmount = 1,
        showMarquee = true,
        marqueeText = MARQUEE_NAMES.map((pair) => ({
            name1: pair[0],
            name2: pair[1],
        })),
        marqueeFont,
        showShadowGradient = true,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const [ready, setReady] = React.useState(false)
    const [loading, setLoading] = React.useState(!isStatic)

    const imgs = React.useMemo(() => {
        const raw: string[] = []
        if (Array.isArray(images)) {
            images.forEach((item: any) => {
                if (typeof item === "string") raw.push(item)
                else if (item && typeof item === "object") {
                    if (typeof item.src === "string") raw.push(item.src)
                    else if (typeof item.url === "string") raw.push(item.url)
                }
            })
        }
        const source = raw.length > 0 ? raw : DEFAULT_IMAGES
        const out: string[] = []
        for (let i = 0; i < 20; i++) out.push(source[i % source.length])
        return out
    }, [images])

    const getImg = (n: number) => imgs[(n - 1) % 20]

    React.useEffect(() => {
        injectCSS()
        setReady(true)
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        if (!ready) return
        if (typeof window === "undefined") return

        const root = rootRef.current
        if (!root) return

        // Update CSS variables
        root.style.setProperty("--color-bg", backgroundColor)
        root.style.setProperty("--color-text", textColor)
        root.style.setProperty("--grid-columns", String(gridColumns))
        root.style.setProperty("--grid-gap", `${gridGap}rem`)
        root.style.setProperty("--grid-max-width", `${gridMaxWidth}px`)
        root.style.setProperty("--grid-item-ratio", String(gridItemRatio))
        root.style.setProperty("--grid-item-radius", `${gridItemRadius}px`)

        let rafId = 0
        let destroyed = false
        let isVisible = true

        // Set up IntersectionObserver to pause animation when offscreen
        let intersectionObserver: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            intersectionObserver = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    isVisible = entry.isIntersecting
                },
                { threshold: 0 }
            )
            if (root) intersectionObserver.observe(root)
        }

        interface GridWrapEntry {
            el: HTMLElement
            imgEl: HTMLElement | null
            leftSide: boolean
        }

        const gridWraps: GridWrapEntry[] = []
        const firstGridEl = root.querySelector(
            ".grid:not(.grid--full)"
        ) as HTMLElement | null
        if (firstGridEl) {
            const wraps = Array.from(
                firstGridEl.querySelectorAll(".grid__item-imgwrap")
            ) as HTMLElement[]
            wraps.forEach((el) => {
                const imgEl = el.querySelector(
                    ".grid__item-img"
                ) as HTMLElement | null
                const r = el.getBoundingClientRect()
                const elementCenter = r.left + el.offsetWidth / 2
                const viewportCenter = window.innerWidth / 2
                gridWraps.push({
                    el,
                    imgEl,
                    leftSide: elementCenter < viewportCenter,
                })
            })
        }

        const marqueeInner = root.querySelector(
            ".mark > .mark__inner"
        ) as HTMLElement | null

        const tick = () => {
            if (destroyed) return
            if (!isVisible) {
                rafId = requestAnimationFrame(tick)
                return
            }

            // ---- Grid scroll-linked animation ----
            gridWraps.forEach(({ el, imgEl, leftSide }) => {
                const p = getTriggerProgress(
                    el,
                    "top bottom+=10%",
                    "bottom top-=25%"
                )
                let wrapTransform = ""
                let wrapFilter = ""
                let imgTransform = ""
                if (p <= 0.5) {
                    const t = sineOut(p * 2)
                    const fZ = 300 * animationIntensity
                    const fRx = 70 * animationIntensity
                    const fRz = (leftSide ? 5 : -5) * animationIntensity
                    const fX = (leftSide ? -40 : 40) * animationIntensity
                    const fSkew = (leftSide ? -20 : 20) * animationIntensity
                    const fY = 100 * animationIntensity
                    const z = lerp(fZ, 0, t)
                    const rx = lerp(fRx, 0, t)
                    const rz = lerp(fRz, 0, t)
                    const xp = lerp(fX, 0, t)
                    const skew = lerp(fSkew, 0, t)
                    const yp = lerp(fY, 0, t)
                    wrapTransform = `translate3d(${xp}%, ${yp}%, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg) skewX(${skew}deg)`
                    const blur = lerp(7 * blurAmount, 0, t)
                    const bright = lerp(0, 100, t)
                    const contrast = lerp(400, 100, t)
                    wrapFilter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(0)}%) contrast(${contrast.toFixed(0)}%)`
                    const sy = lerp(1.8, 1, t)
                    imgTransform = `scaleY(${sy})`
                } else {
                    const t = sineIn((p - 0.5) * 2)
                    const tZ = 300 * animationIntensity
                    const tRx = -50 * animationIntensity
                    const tRz = (leftSide ? -1 : 1) * animationIntensity
                    const tX = (leftSide ? -20 : 20) * animationIntensity
                    const tSkew = (leftSide ? 10 : -10) * animationIntensity
                    const z = lerp(0, tZ, t)
                    const rx = lerp(0, tRx, t)
                    const rz = lerp(0, tRz, t)
                    const xp = lerp(0, tX, t)
                    const skew = lerp(0, tSkew, t)
                    wrapTransform = `translate3d(${xp}%, 0%, ${z}px) rotateX(${rx}deg) rotateZ(${rz}deg) skewX(${skew}deg)`
                    const blur = lerp(0, 4 * blurAmount, t)
                    const bright = lerp(100, 0, t)
                    const contrast = lerp(100, 500, t)
                    wrapFilter = `blur(${blur.toFixed(2)}px) brightness(${bright.toFixed(0)}%) contrast(${contrast.toFixed(0)}%)`
                    const sy = lerp(1, 1.8, t)
                    imgTransform = `scaleY(${sy})`
                }
                if (el) {
                    el.style.transform = wrapTransform
                    el.style.filter = wrapFilter
                }
                if (imgEl) imgEl.style.transform = imgTransform
            })

            // ---- Marquee ----
            if (showMarquee && marqueeInner && firstGridEl) {
                const p = getTriggerProgress(
                    firstGridEl,
                    "top bottom",
                    "bottom top"
                )
                const t = sineOut(p)
                const fromX = window.innerWidth
                const mw = marqueeInner.offsetWidth || 1000
                const toX = -mw
                const x = lerp(fromX, toX, t)
                marqueeInner.style.transform = `translateX(${x}px)`
            }

            rafId = requestAnimationFrame(tick)
        }

        // Image preload - wait for all images to load
        const imagesToLoad = imgs.filter((url) => url && url.trim() !== "")
        let loadedCount = 0
        const totalImages = imagesToLoad.length
        const loadingRef = { current: true }
        let fallbackTimerId: number | null = null

        if (totalImages === 0) {
            loadingRef.current = false
            setLoading(false)
        } else {
            imagesToLoad.forEach((url) => {
                const img = new Image()
                const handleLoad = () => {
                    loadedCount++
                    if (loadedCount === totalImages) {
                        loadingRef.current = false
                        setLoading(false)
                    }
                }
                img.onload = handleLoad
                img.onerror = handleLoad // Still count as loaded even on error
                img.src = url
            })

            // Fallback timeout in case some images fail to load
            fallbackTimerId = window.setTimeout(() => {
                if (loadingRef.current) {
                    loadingRef.current = false
                    setLoading(false)
                }
            }, 5000)
        }

        rafId = requestAnimationFrame(tick)

        const onResize = () => {
            // Recompute left/right side
            gridWraps.forEach((entry) => {
                const r = entry.el.getBoundingClientRect()
                const elementCenter = r.left + entry.el.offsetWidth / 2
                const viewportCenter = window.innerWidth / 2
                entry.leftSide = elementCenter < viewportCenter
            })
        }
        window.addEventListener("resize", onResize)

        return () => {
            destroyed = true
            cancelAnimationFrame(rafId)
            window.removeEventListener("resize", onResize)
            if (fallbackTimerId !== null) {
                clearTimeout(fallbackTimerId)
            }
            if (intersectionObserver && root) {
                intersectionObserver.disconnect()
            }
        }
    }, [
        ready,
        imgs.join("|"),
        backgroundColor,
        textColor,
        gridColumns,
        gridGap,
        gridMaxWidth,
        gridItemRatio,
        gridItemRadius,
        animationIntensity,
        blurAmount,
        showMarquee,
        isStatic,
    ])

    if (isStatic) {
        return (
            <div
                ref={rootRef}
                className="s3d-root"
                style={{
                    width: "100%",
                    minHeight: "100vh",
                    backgroundColor,
                    color: textColor,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                <div
                    className="grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                        gap: `${gridGap}rem`,
                        maxWidth: `${gridMaxWidth}px`,
                        width: "100%",
                    }}
                >
                    {FIRST_GRID_INDICES.slice(0, 8).map((n, i) => (
                        <figure
                            className="grid__item"
                            key={`static-g1-${i}`}
                            style={{ margin: 0 }}
                        >
                            <div
                                className="grid__item-imgwrap"
                                style={{
                                    aspectRatio: String(gridItemRatio),
                                    borderRadius: `${gridItemRadius}px`,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    className="grid__item-img"
                                    style={{
                                        backgroundImage: `url(${getImg(n)})`,
                                        width: "100%",
                                        height: "100%",
                                        backgroundSize: "cover",
                                        backgroundPosition: "50% 20%",
                                    }}
                                />
                            </div>
                        </figure>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            className="s3d-root"
            style={{ width: "100%", minHeight: "100vh" }}
        >
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: backgroundColor,
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            background: textColor,
                            opacity: 0.4,
                            animation: "s3d-pulse 1s ease-in-out infinite",
                        }}
                    />
                </div>
            )}
            <main className={showShadowGradient ? "shadow" : ""}>
                <section>
                    <div className="grid">
                        {FIRST_GRID_INDICES.map((n, i) => (
                            <figure className="grid__item" key={`g1-${i}`}>
                                <div className="grid__item-imgwrap">
                                    <div
                                        className="grid__item-img"
                                        style={{
                                            backgroundImage: `url(${getImg(n)})`,
                                        }}
                                    />
                                </div>
                            </figure>
                        ))}
                    </div>
                    {showMarquee && (
                        <div className="mark">
                            <div
                                className="mark__inner font-alt"
                                style={{
                                    ...marqueeFont,
                                }}
                            >
                                {marqueeText.map((item, i) => (
                                    <React.Fragment key={i}>
                                        <span>{item.name1}</span>
                                        <span>{item.name2}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

addPropertyControls(Staggered3DGrid, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 20,
        defaultValue: [
            {
                src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
                alt: "Mountain landscape",
            },
            {
                src: "https://images.unsplash.com/photo-1504198266287-1659872e6590?w=800",
                alt: "Forest path",
            },
            {
                src: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
                alt: "Ocean waves",
            },
            {
                src: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800",
                alt: "Desert dunes",
            },
            {
                src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
                alt: "Mountain peak",
            },
            {
                src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
                alt: "Misty forest",
            },
            {
                src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
                alt: "Lake reflection",
            },
            {
                src: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800",
                alt: "Sunset sky",
            },
            {
                src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800",
                alt: "Valley view",
            },
            {
                src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
                alt: "Snowy mountains",
            },
        ],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    gridColumns: {
        type: ControlType.Number,
        title: "Grid Columns",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 2,
        min: 0,
        max: 5,
        step: 0.5,
        unit: "rem",
    },
    gridMaxWidth: {
        type: ControlType.Number,
        title: "Grid Max Width",
        defaultValue: 300,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    gridItemRatio: {
        type: ControlType.Number,
        title: "Item Ratio",
        defaultValue: 1.2,
        min: 0.5,
        max: 2,
        step: 0.1,
    },
    gridItemRadius: {
        type: ControlType.Number,
        title: "Item Radius",
        defaultValue: 4,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    animationIntensity: {
        type: ControlType.Number,
        title: "Animation Intensity",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    showMarquee: {
        type: ControlType.Boolean,
        title: "Show Marquee",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    marqueeText: {
        type: ControlType.Array,
        title: "Marquee Text",
        control: {
            type: ControlType.Object,
            controls: {
                name1: {
                    type: ControlType.String,
                    title: "Name 1",
                    defaultValue: "Name",
                },
                name2: {
                    type: ControlType.String,
                    title: "Name 2",
                    defaultValue: "名前",
                },
            },
        },
        defaultValue: [
            { name1: "Sora Takahashi", name2: "空 高橋" },
            { name1: "Aoi Nakamura", name2: "葵 中村" },
            { name1: "Ren Fujimoto", name2: "蓮 藋本" },
            { name1: "Mio Sakurai", name2: "澪 桜井" },
            { name1: "Shin Yamamoto", name2: "真 山本" },
        ],
        hidden: (props) => !props.showMarquee,
    },
    marqueeFont: {
        type: ControlType.Font,
        title: "Marquee Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Regular",
            letterSpacing: "0.02em",
            lineHeight: "1em",
        },
        hidden: (props) => !props.showMarquee,
    },
    showShadowGradient: {
        type: ControlType.Boolean,
        title: "Shadow Gradient",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
