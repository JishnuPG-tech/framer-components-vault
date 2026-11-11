import React, {
    memo,
    useMemo,
    useEffect,
    useState,
    useCallback,
    useRef,
    type CSSProperties,
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


const defaultItems = [
    {
        title: "Blue Gradient",
        imageUrl:
            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Blue gradient image",
        },
        link: "",
    },
    {
        title: "Purple Gradient",
        imageUrl:
            "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Purple gradient image",
        },
        link: "",
    },
    {
        title: "Orange Gradient",
        imageUrl:
            "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Orange gradient image",
        },
        link: "",
    },
    {
        title: "Yellow Gradient",
        imageUrl:
            "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Yellow gradient image",
        },
        link: "",
    },
]

// ─────────────────────────────────────────────
// Hover styling lives in CSS, not React state.
//
// Before, hovering a cell called setState on the whole gallery, which
// re-rendered EVERY cell (all images, styles and ref callbacks) twice per
// hover (leave + enter). Now hover is pure CSS: zero re-renders, and the
// browser runs the transitions on its own thread. Per-instance settings
// reach the CSS through variables / data attributes on the root element.
// ─────────────────────────────────────────────
const GALLERY_CSS = `
.pg-root .pg-cell{box-shadow:inset 0 0 0 0 transparent,0 0 0 0 transparent;transition:box-shadow .4s ease}
.pg-root .pg-img{opacity:var(--pg-item-opacity,1);transform:scale(1);transition:transform .6s cubic-bezier(.2,.8,.2,1),opacity .5s ease var(--pg-delay,0s)}
.pg-root .pg-cell[data-fade="1"]:not([data-loaded="1"]) .pg-img{opacity:0;transform:scale(.98)}
.pg-root .pg-overlay{position:absolute;inset:0;background-color:var(--pg-overlay);opacity:0;transition:opacity .4s ease;pointer-events:none;z-index:1}
.pg-root .pg-title{opacity:0;transform:translateY(8px);transition:opacity .4s ease .1s,transform .4s cubic-bezier(.2,.8,.2,1) .1s}
.pg-root .pg-arrow{align-self:flex-end;opacity:0;transform:translate(-8px,8px) scale(.9);transition:opacity .3s ease .05s,transform .4s cubic-bezier(.2,.8,.2,1) .05s}
.pg-root[data-hover="1"] .pg-cell:is(:hover,:focus-within) .pg-img{transform:scale(var(--pg-zoom,1.05));will-change:transform}
.pg-root[data-hover="1"] .pg-cell:is(:hover,:focus-within) .pg-overlay{opacity:1}
.pg-root[data-hover="1"] .pg-cell:is(:hover,:focus-within) .pg-title{opacity:1;transform:translateY(0)}
.pg-root[data-hover="1"] .pg-cell:is(:hover,:focus-within) .pg-arrow{opacity:1;transform:translate(0,0) scale(1)}
.pg-root[data-hover="1"][data-glow="1"] .pg-cell:is(:hover,:focus-within){box-shadow:inset 0 0 0 1px var(--pg-glow),0 0 12px -2px var(--pg-glow)}
@media (prefers-reduced-motion:reduce){.pg-root .pg-img,.pg-root .pg-title,.pg-root .pg-arrow{transition-duration:.01ms!important;transition-delay:0s!important}}
`

const contentStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    pointerEvents: "none",
    zIndex: 2,
}

// ─────────────────────────────────────────────
// One cell = one memoized component with its OWN loaded/aspect state, so an
// image finishing its load re-renders just that cell, not the whole grid.
// ─────────────────────────────────────────────
const GalleryCell = memo(function GalleryCell(props: any) {
    const {
        src,
        srcSet,
        alt,
        title,
        link,
        openInNewTab,
        itemOpacity,
        idx,
        isPriority,
        uploadedAspect,
        fitMode,
        imageWidth,
        imageHeight,
        borderRadius,
        offsetX,
        offsetY,
        fadeIn,
        showOverlay,
        showText,
        showArrow,
        arrowSize,
        titleFont,
        titleColor,
        arrowColor,
    } = props

    const [loaded, setLoaded] = useState(false)
    const [measuredAspect, setMeasuredAspect] = useState<number | undefined>(
        undefined
    )
    const imgRef = useRef<HTMLImageElement>(null)

    const markLoaded = useCallback((el?: HTMLImageElement | null) => {
        if (el && el.naturalWidth && el.naturalHeight) {
            const a = el.naturalWidth / el.naturalHeight
            setMeasuredAspect((prev) => prev || a)
        }
        setLoaded(true)
    }, [])

    // Covers images that finished loading before React attached onLoad
    // (cached images, or images that loaded before hydration)
    useEffect(() => {
        const el = imgRef.current
        if (el && el.complete) markLoaded(el)
    }, [markLoaded, src])

    const aspect = uploadedAspect || measuredAspect
    const isContain = fitMode === "contain" && aspect
    const hasOffset = offsetX !== 0 || offsetY !== 0

    // The fade-in stagger is capped so big galleries don't wait seconds
    const staggerDelay = fadeIn ? Math.min(idx * 0.05, 0.5) : 0

    const cellStyle = {
        width: isContain ? "auto" : imageWidth,
        height: isContain ? "auto" : imageHeight,
        maxWidth: isContain ? imageWidth : undefined,
        maxHeight: isContain ? imageHeight : undefined,
        minWidth: 5,
        minHeight: 5,
        aspectRatio: aspect ? String(aspect) : undefined,
        borderRadius,
        overflow: "hidden",
        position: "relative",
        isolation: "isolate",
        // Plain 2D translate, and only when a negative gap needs it.
        // translate3d(0,0,0) on every cell forced each one onto its own
        // GPU layer even when nothing was moving.
        transform: hasOffset
            ? `translate(${offsetX}px, ${offsetY}px)`
            : undefined,
        cursor: link ? "pointer" : "default",
        "--pg-item-opacity": itemOpacity,
        "--pg-delay": `${staggerDelay}s`,
    } as CSSProperties

    const content = (
        <>
            <img
                ref={imgRef}
                className="pg-img"
                src={src}
                srcSet={srcSet}
                alt={alt}
                loading={isPriority ? "eager" : "lazy"}
                decoding="async"
                // @ts-ignore — fetchPriority is valid HTML, older React types lack it
                fetchPriority={isPriority ? "high" : "auto"}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fitMode,
                    objectPosition: "center",
                }}
                onLoad={(e) => markLoaded(e.currentTarget)}
                onError={() => markLoaded()}
            />
            {showOverlay && <div className="pg-overlay" />}
            {showOverlay && (
                <div style={contentStyle}>
                    {showText && (
                        <p
                            className="pg-title"
                            style={{
                                ...titleFont,
                                color: titleColor,
                                margin: 0,
                            }}
                        >
                            {title}
                        </p>
                    )}
                    {showArrow && (
                        <div className="pg-arrow" style={{ color: arrowColor }}>
                            <svg
                                width={arrowSize}
                                height={arrowSize}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 17L17 7M17 7H7M17 7V17"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    )}
                </div>
            )}
        </>
    )

    return (
        <div
            className="pg-cell"
            data-fade={fadeIn ? "1" : "0"}
            data-loaded={loaded ? "1" : "0"}
            style={cellStyle}
        >
            {link ? (
                <a
                    href={link}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        textDecoration: "none",
                    }}
                    tabIndex={0}
                    aria-label={alt}
                >
                    {content}
                </a>
            ) : (
                content
            )}
        </div>
    )
})

/**
 * Premium Gallery
 *
 * A sophisticated CMS-connected image grid. Features a premium hover effect with subtle darkening,
 * restrained typography reveal, elegant white glow, and animated arrow indicators.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function PremiumGallery(props) {
    const {
        items = defaultItems,
        columns = 3,
        gapX = 16,
        gapY = 16,
        fitMode = "cover",
        hoverEffect = true,
        zoomIntensity = 1.05,
        fadeIn = true,
        style,
        imageWidth = "100%",
        imageHeight = "auto",
        randomize = false,
        borderRadius = 12,
        overlayColor = "rgba(0,0,0,0.5)",
        titleFont,
        titleColor = "#ffffff",
        arrowColor = "#ffffff",
        glowColor = "rgba(255,255,255,0.5)",
        showGlow = true,
        showOverlay = true,
        showText = true,
        showArrow = true,
        arrowSize = 20,
    } = props

    const [randomSeed, setRandomSeed] = useState<number | null>(null)

    useEffect(() => {
        if (randomize) {
            setRandomSeed(Date.now() + Math.random())
        }
    }, [randomize])

    const images = useMemo(() => {
        const source = items || []
        if (!randomize || source.length === 0) return source
        if (randomSeed === null) return source

        function mulberry32(seed: number) {
            return function () {
                let t = (seed += 0x6d2b79f5)
                t = Math.imul(t ^ (t >>> 15), t | 1)
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296
            }
        }

        const rng = mulberry32(randomSeed)
        const arr = source.slice()
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }, [items, randomize, randomSeed])

    const rowCount = Math.ceil(images.length / columns)
    const zoom = zoomIntensity || 1.05

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        columnGap: Math.max(0, gapX || 0),
        rowGap: Math.max(0, gapY || 0),
        width: "100%",
        height: "100%",
        minWidth: 5,
        minHeight: 5,
        justifyItems: "center",
        alignItems: "center",
        // Settings the hover CSS reads
        "--pg-zoom": zoom,
        "--pg-overlay": overlayColor,
        "--pg-glow": glowColor,
        ...style,
    } as CSSProperties

    // Keys follow the image (not the position), so shuffling moves the
    // existing cells instead of rebuilding them and re-fading every image.
    const seen: Record<string, number> = {}

    return (
        <div
            style={gridStyle}
            className="pg-root pg-grid"
            data-hover={hoverEffect ? "1" : "0"}
            data-glow={showGlow ? "1" : "0"}
        >
            <style>{GALLERY_CSS}</style>
            {images.map((item, idx) => {
                const img = item?.image
                const imageUrl = item?.imageUrl
                const hasUploadedImage = !!img?.src
                const src = hasUploadedImage ? img.src : imageUrl || img?.url

                if (!src) {
                    return (
                        <div
                            key={`empty-${idx}`}
                            style={{
                                width: imageWidth,
                                height: imageHeight,
                                minWidth: 5,
                                minHeight: 5,
                                background: "transparent",
                            }}
                        />
                    )
                }

                const occurrence = (seen[src] = (seen[src] ?? -1) + 1)

                const uploadedAspect =
                    hasUploadedImage && img?.width && img?.height
                        ? img.width / img.height
                        : undefined

                const colIndex = idx % columns
                const rowIndex = Math.floor(idx / columns)

                let offsetX = 0
                if ((gapX || 0) < 0) {
                    const totalShiftX = ((columns - 1) * gapX) / 2
                    offsetX = colIndex * gapX - totalShiftX
                }

                let offsetY = 0
                if ((gapY || 0) < 0) {
                    const totalShiftY = ((rowCount - 1) * gapY) / 2
                    offsetY = rowIndex * gapY - totalShiftY
                }

                return (
                    <GalleryCell
                        key={`${src}#${occurrence}`}
                        src={src}
                        srcSet={
                            hasUploadedImage ? img?.srcSet || "" : undefined
                        }
                        alt={img?.alt || item.title || "Image"}
                        title={item?.hoverText || item?.title}
                        link={item?.link}
                        openInNewTab={item?.openInNewTab}
                        itemOpacity={item?.opacity ?? 1}
                        idx={idx}
                        isPriority={idx < columns}
                        uploadedAspect={uploadedAspect}
                        fitMode={fitMode}
                        imageWidth={imageWidth}
                        imageHeight={imageHeight}
                        borderRadius={borderRadius}
                        offsetX={offsetX}
                        offsetY={offsetY}
                        fadeIn={fadeIn}
                        showOverlay={showOverlay}
                        showText={showText}
                        showArrow={showArrow}
                        arrowSize={arrowSize}
                        titleFont={titleFont}
                        titleColor={titleColor}
                        arrowColor={arrowColor}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(PremiumGallery, {
    items: {
        type: ControlType.Array,
        title: "Grid Cells",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project Title",
                },
                hoverText: {
                    type: ControlType.String,
                    title: "Hover Text",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue:
                        "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                },
                opacity: {
                    type: ControlType.Number,
                    title: "Opacity",
                    defaultValue: 1,
                    min: 0,
                    max: 1,
                    step: 0.1,
                    displayStepper: true,
                },
                link: { type: ControlType.Link, title: "Link" },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
        defaultValue: defaultItems,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    imageWidth: {
        type: ControlType.Enum,
        title: "Width",
        options: ["100%", "50%", "33.33%", "25%", "200px", "300px", "400px"],
        optionTitles: [
            "100% (Full)",
            "50% (Half)",
            "33% (Third)",
            "25% (Quarter)",
            "200px",
            "300px",
            "400px",
        ],
        defaultValue: "100%",
    },
    imageHeight: {
        type: ControlType.Enum,
        title: "Height",
        options: ["auto", "200px", "300px", "400px", "100%"],
        optionTitles: ["Auto", "200px", "300px", "400px", "100% (Fill)"],
        defaultValue: "auto",
    },
    gapX: {
        type: ControlType.Number,
        title: "Gap X",
        defaultValue: 16,
        min: -50,
        max: 200,
        step: 1,
    },
    gapY: {
        type: ControlType.Number,
        title: "Gap Y",
        defaultValue: 16,
        min: -50,
        max: 200,
        step: 1,
    },
    fitMode: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showOverlay: {
        type: ControlType.Boolean,
        title: "Overlay",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ hoverEffect }) => !hoverEffect,
    },
    showText: {
        type: ControlType.Boolean,
        title: "Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ hoverEffect, showOverlay }) => !hoverEffect || !showOverlay,
    },
    showArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ hoverEffect, showOverlay }) => !hoverEffect || !showOverlay,
    },
    zoomIntensity: {
        type: ControlType.Number,
        title: "Zoom",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
        unit: "x",
        hidden: ({ hoverEffect }) => !hoverEffect,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Darken",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: ({ hoverEffect, showOverlay }) => !hoverEffect || !showOverlay,
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ hoverEffect }) => !hoverEffect,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(255,255,255,0.5)",
        hidden: ({ hoverEffect, showGlow }) => !hoverEffect || !showGlow,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontSize: 24,
            variant: "Bold",
            textAlign: "left",
        },
        hidden: ({ hoverEffect, showOverlay, showText }) =>
            !hoverEffect || !showOverlay || !showText,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
        hidden: ({ hoverEffect, showOverlay, showText }) =>
            !hoverEffect || !showOverlay || !showText,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow",
        defaultValue: "#ffffff",
        hidden: ({ hoverEffect, showOverlay, showArrow }) =>
            !hoverEffect || !showOverlay || !showArrow,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 20,
        min: 10,
        max: 60,
        step: 1,
        hidden: ({ hoverEffect, showOverlay, showArrow }) =>
            !hoverEffect || !showOverlay || !showArrow,
    },
    fadeIn: {
        type: ControlType.Boolean,
        title: "Fade In",
        defaultValue: true,
    },
    randomize: {
        type: ControlType.Boolean,
        title: "Shuffle",
        defaultValue: false,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 100,
        description:
            "Get more Framer components at [Integry](https://integry.framer.ai/).",
    },
})
