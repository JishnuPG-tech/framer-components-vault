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


import { useReducedMotion } from "framer-motion"

type Item = {
    image?: {
        src?: string

        srcSet?: string

        alt?: string
    }

    title?: string

    link?: string

    newTab?: boolean

    buttonText?: string
}

type Props = {
    items: Item[]

    background: string

    textColor: string

    accent: string

    buttonTextColor: string

    imageSize: number

    gap: number

    padding: number

    showNumbers: boolean

    showTitles: boolean

    showIndex: boolean

    showFooter: boolean

    showButtons: boolean

    buttonLabel: string

    hoverEffects: boolean

    hoverZoom: number

    lavaOpacity: number

    lavaColor: string

    duration: number

    hint: string

    style?: React.CSSProperties
}

const demo: Item[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1400&q=85",

            alt: "Sculptural white architecture",
        },

        title: "Soft structure",

        link: "",

        newTab: true,

        buttonText: "",
    },

    {
        image: {
            src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85",

            alt: "Ocean waves",
        },

        title: "Blue hours",

        link: "",

        newTab: true,

        buttonText: "",
    },

    {
        image: {
            src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",

            alt: "Warm contemporary interior",
        },

        title: "Quiet spaces",

        link: "",

        newTab: true,

        buttonText: "",
    },

    {
        image: {
            src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85",

            alt: "Mountains reflected in a lake",
        },

        title: "Somewhere slower",

        link: "",

        newTab: true,

        buttonText: "",
    },

    {
        image: {
            src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85",

            alt: "Sunlight passing through a forest",
        },

        title: "Growing quietly",

        link: "",

        newTab: true,

        buttonText: "",
    },

    {
        image: {
            src: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=85",

            alt: "Books and everyday objects",
        },

        title: "Everyday studies",

        link: "",

        newTab: true,

        buttonText: "",
    },
]

function Arrow({ left = false }: { left?: boolean }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{
                display: "block",

                flexShrink: 0,

                transform: left ? "rotate(180deg)" : undefined,
            }}
        >
            <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
            />
        </svg>
    )
}

function Photo({ item }: { item: Item }) {
    const [failed, setFailed] = React.useState(false)

    React.useEffect(() => {
        setFailed(false)
    }, [item.image?.src])

    if (!item.image?.src || failed) {
        return (
            <div
                style={{
                    width: "100%",

                    height: "100%",

                    background: "#D3D1CB",
                }}
            />
        )
    }

    return (
        <img
            src={item.image.src}
            srcSet={item.image.srcSet}
            sizes="(max-width: 600px) 60vw, 480px"
            alt={item.image.alt || item.title || ""}
            draggable={false}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{
                display: "block",

                width: "100%",

                height: "100%",

                objectFit: "cover",

                pointerEvents: "none",
            }}
        />
    )
}

/**

 * @framerSupportedLayoutWidth fixed

 * @framerSupportedLayoutHeight fixed

 * @framerIntrinsicWidth 1200

 * @framerIntrinsicHeight 800

 */

export default function GalleryWall({
    items = demo,

    background = "#EEEDE8",

    textColor = "#252621",

    accent = "#F5F3EC",

    buttonTextColor = "#252621",

    imageSize = 240,

    gap = 42,

    padding = 24,

    showNumbers = true,

    showTitles = false,

    showIndex = true,

    showFooter = true,

    showButtons = true,

    buttonLabel = "View project",

    hoverEffects = true,

    hoverZoom = 1.055,

    lavaOpacity = 0.18,

    lavaColor = "#FFF2D8",

    duration = 0.55,

    hint = "Drag or scroll to explore",

    style,
}: Props) {
    const isStatic = useIsStaticRenderer()

    const reducedMotion = useReducedMotion()

    const effects = hoverEffects && !isStatic && !reducedMotion

    const viewportRef = React.useRef<HTMLDivElement>(null)

    const initialized = React.useRef(false)

    const suppressClick = React.useRef(false)

    const gesture = React.useRef<{
        pointerId: number

        startX: number

        startY: number

        startScroll: number

        dragging: boolean
    } | null>(null)

    const [dragging, setDragging] = React.useState(false)

    const [viewport, setViewport] = React.useState({
        width: 900,

        height: 522,
    })

    const [navigation, setNavigation] = React.useState({
        previous: false,

        next: false,
    })

    React.useEffect(() => {
        const element = viewportRef.current

        if (!element) return

        const measure = () => {
            setViewport({
                width: element.clientWidth,

                height: element.clientHeight,
            })
        }

        measure()

        const observer = new ResizeObserver(measure)

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const safeSize = Math.max(120, imageSize)

    const safeGap = Math.max(16, gap)

    const safePadding = Math.max(8, padding)

    const hasCaption = showNumbers || showTitles

    const captionHeight = hasCaption ? 26 : 0

    const cards = items.map((item, index) => {
        const column = Math.floor(index / 2)

        const row = index % 2

        const portrait = index % 3 === 0

        return {
            item,

            index,

            left:
                column * (safeSize * 1.1 + safeGap) +
                (row === 1 ? safeSize * 0.1 : 0),

            top:
                row * (safeSize * 1.13 + safeGap + captionHeight) +
                (column % 2 === 1 ? safeSize * 0.18 : 0),

            width: safeSize * (portrait ? 0.8 : 1),

            height: safeSize * (portrait ? 1.13 : 0.76),
        }
    })

    const rawWidth = Math.max(1, ...cards.map((card) => card.left + card.width))

    const rawHeight = Math.max(
        1,

        ...cards.map((card) => card.top + card.height + captionHeight)
    )

    const verticalInset = Math.min(safePadding + 8, viewport.height * 0.12)

    const scale = Math.min(
        1,

        Math.max(1, viewport.height - verticalInset * 2) / rawHeight
    )

    const wallWidth = rawWidth * scale

    const wallHeight = rawHeight * scale

    const contentWidth = Math.max(viewport.width, wallWidth + safePadding * 2)

    const wallLeft = Math.max(safePadding, (contentWidth - wallWidth) / 2)

    const wallTop = Math.max(0, (viewport.height - wallHeight) / 2)

    const updateNavigation = React.useCallback(() => {
        const element = viewportRef.current

        if (!element) return

        const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth)

        const previous = element.scrollLeft > 2

        const next = element.scrollLeft < maxScroll - 2

        setNavigation((current) =>
            current.previous === previous && current.next === next
                ? current
                : { previous, next }
        )
    }, [])

    React.useEffect(() => {
        const element = viewportRef.current

        if (!element) return

        if (!initialized.current && items.length > 0) {
            element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2

            initialized.current = true
        }

        updateNavigation()
    }, [
        contentWidth,

        viewport.width,

        viewport.height,

        items.length,

        updateNavigation,
    ])

    React.useEffect(() => {
        const element = viewportRef.current

        if (!element || isStatic) return

        function handleWheel(event: WheelEvent) {
            if (
                !element ||
                event.ctrlKey ||
                event.metaKey ||
                !event.shiftKey ||
                Math.abs(event.deltaX) >= Math.abs(event.deltaY)
            )
                return

            const multiplier =
                event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? element.clientWidth
                      : 1

            const delta = event.deltaY * multiplier

            const maxScroll = element.scrollWidth - element.clientWidth

            const canScroll =
                (delta > 0 && element.scrollLeft < maxScroll - 1) ||
                (delta < 0 && element.scrollLeft > 1)

            if (!canScroll) return

            event.preventDefault()

            element.scrollLeft += delta
        }

        element.addEventListener("wheel", handleWheel, {
            passive: false,
        })

        return () => {
            element.removeEventListener("wheel", handleWheel)
        }
    }, [isStatic])

    function scrollBy(direction: number) {
        const element = viewportRef.current

        if (!element || isStatic) return

        element.scrollBy({
            left:
                direction *
                Math.max((safeSize + safeGap) * scale, viewport.width * 0.65),

            behavior: reducedMotion ? "auto" : "smooth",
        })
    }

    function finishPointer(event: React.PointerEvent<HTMLDivElement>) {
        const current = gesture.current

        if (!current || current.pointerId !== event.pointerId) {
            return
        }

        if (current.dragging) suppressClick.current = true

        gesture.current = null

        setDragging(false)

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }
    }

    function moveLight(event: React.PointerEvent<HTMLElement>) {
        if (!effects || dragging || event.pointerType === "touch") return

        const element = event.currentTarget

        const bounds = element.getBoundingClientRect()

        const px = Math.max(
            0,

            Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)
        )

        const py = Math.max(
            0,

            Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)
        )

        element.style.setProperty("--pointer-x", `${px}%`)

        element.style.setProperty("--pointer-y", `${py}%`)
    }

    return (
        <div
            className="gallery-wall-v3"
            role="region"
            aria-label="Image gallery"
            data-effects={effects ? "true" : "false"}
            data-dragging={dragging ? "true" : "false"}
            style={
                {
                    ...style,

                    width: "100%",

                    height: "100%",

                    minWidth: 0,

                    minHeight: 0,

                    display: "flex",

                    flexDirection: "column",

                    overflow: "hidden",

                    position: "relative",

                    background,

                    color: textColor,

                    fontFamily: "Inter, Helvetica, Arial, sans-serif",

                    "--gw-text": textColor,

                    "--gw-accent": accent,

                    "--gw-button-text": buttonTextColor,

                    "--gw-zoom": hoverZoom,

                    "--gw-lava-color": lavaColor,

                    "--gw-lava-opacity": lavaOpacity,

                    "--gw-duration": `${effects ? duration : 0}s`,
                } as React.CSSProperties
            }
        >
            <style>{`

                .gallery-wall-v3,

                .gallery-wall-v3 * {

                    box-sizing: border-box;

                }

                .gallery-wall-v3 a,

                .gallery-wall-v3 button {

                    color: inherit;

                    font: inherit;

                    border-radius: 0;

                    -webkit-tap-highlight-color: transparent;

                }

                .gallery-wall-v3 .gw-viewport {

                    scrollbar-width: none;

                    -webkit-overflow-scrolling: touch;

                }

                .gallery-wall-v3 .gw-viewport::-webkit-scrollbar {

                    display: none;

                }

                .gallery-wall-v3 .gw-viewport:focus-visible {

                    outline: 1px solid var(--gw-text);

                    outline-offset: -3px;

                }

                .gallery-wall-v3 .gw-card {

                    display: block;

                    border: 0;

                    padding: 0;

                    text-decoration: none;

                    background: transparent;

                    user-select: none;

                    -webkit-user-select: none;

                    -webkit-user-drag: none;

                    --pointer-x: 50%;

                    --pointer-y: 50%;

                }

                .gallery-wall-v3 .gw-card:focus-visible {

                    outline: 2px solid var(--gw-text);

                    outline-offset: 5px;

                }

                .gallery-wall-v3 .gw-media {

                    position: relative;

                    width: 100%;

                    height: 100%;

                    overflow: hidden;

                    isolation: isolate;

                    background: #D3D1CB;

                    transition:

                        transform var(--gw-duration)

                        cubic-bezier(.22,1,.36,1);

                }

                .gallery-wall-v3 .gw-photo {

                    position: absolute;

                    inset: 0;

                    transition:

                        transform var(--gw-duration)

                        cubic-bezier(.22,1,.36,1);

                }

                .gallery-wall-v3 .gw-lava {

                    position: absolute;

                    inset: 0;

                    pointer-events: none;

                    opacity: 0;

                    mix-blend-mode: soft-light;

                    transition: opacity var(--gw-duration);

                }

                .gallery-wall-v3 .gw-lava-blob {

                    position: absolute;

                    left: var(--pointer-x);

                    top: var(--pointer-y);

                    width: 135%;

                    height: 135%;

                    transform: translate(-50%, -50%);

                    background: radial-gradient(

                        ellipse at center,

                        var(--gw-lava-color) 0%,

                        var(--gw-lava-color) 15%,

                        transparent 65%

                    );

                    filter: blur(15px);

                    transition:

                        left .65s cubic-bezier(.22,1,.36,1),

                        top .65s cubic-bezier(.22,1,.36,1);

                }

                .gallery-wall-v3 .gw-shade {

                    position: absolute;

                    inset: 0;

                    pointer-events: none;

                    background: linear-gradient(

                        180deg,

                        transparent 45%,

                        rgba(0,0,0,.18)

                    );

                    opacity: .4;

                    transition: opacity var(--gw-duration);

                }

                .gallery-wall-v3 .gw-cta {

                    position: absolute;

                    left: 12px;

                    bottom: 12px;

                    max-width: calc(100% - 24px);

                    min-height: 38px;

                    display: inline-flex;

                    align-items: center;

                    justify-content: space-between;

                    gap: 18px;

                    padding: 10px 12px;

                    background: var(--gw-accent);

                    color: var(--gw-button-text);

                    overflow: hidden;

                    pointer-events: none;

                    font-size: 11px;

                    line-height: 1.2;

                    transition:

                        transform var(--gw-duration)

                        cubic-bezier(.22,1,.36,1);

                }

                .gallery-wall-v3 .gw-cta-label {

                    min-width: 0;

                    overflow: hidden;

                    text-overflow: ellipsis;

                    white-space: nowrap;

                }

                .gallery-wall-v3 .gw-cta-arrow {

                    position: relative;

                    display: block;

                    width: 18px;

                    height: 18px;

                    flex-shrink: 0;

                    overflow: hidden;

                }

                .gallery-wall-v3 .gw-arrow-main,

                .gallery-wall-v3 .gw-arrow-copy {

                    position: absolute;

                    inset: 0;

                    transition:

                        transform var(--gw-duration)

                        cubic-bezier(.22,1,.36,1);

                }

                .gallery-wall-v3 .gw-arrow-copy {

                    transform: translateX(-150%);

                }

                .gallery-wall-v3 .gw-control {

                    width: 44px;

                    height: 44px;

                    padding: 0;

                    border: 0;

                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    background: transparent;

                    cursor: pointer;

                }

                .gallery-wall-v3 .gw-control:disabled {

                    opacity: .25;

                    cursor: default;

                }

                .gallery-wall-v3 .gw-control:focus-visible {

                    outline: 2px solid var(--gw-text);

                    outline-offset: -4px;

                }

                .gallery-wall-v3[data-effects="true"]

                .gw-card:focus-visible .gw-photo {

                    transform: scale(var(--gw-zoom));

                }

                .gallery-wall-v3[data-effects="true"]

                .gw-card:focus-visible .gw-lava {

                    opacity: var(--gw-lava-opacity);

                }

                @media (hover: hover) and (pointer: fine) {

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-media {

                        transform: translateY(-5px);

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-photo {

                        transform: scale(var(--gw-zoom));

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-lava {

                        opacity: var(--gw-lava-opacity);

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-shade {

                        opacity: 1;

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-cta {

                        transform: translateY(-3px);

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-arrow-main {

                        transform: translateX(150%);

                    }

                    .gallery-wall-v3[data-effects="true"][data-dragging="false"]

                    .gw-card:hover .gw-arrow-copy {

                        transform: translateX(0);

                    }

                    .gallery-wall-v3 .gw-control:hover:not(:disabled) {

                        background: var(--gw-accent);

                        color: var(--gw-button-text);

                    }

                }

                @media (prefers-reduced-motion: reduce) {

                    .gallery-wall-v3 * {

                        transition: none !important;

                    }

                    .gallery-wall-v3 .gw-media,

                    .gallery-wall-v3 .gw-photo,

                    .gallery-wall-v3 .gw-cta {

                        transform: none !important;

                    }

                    .gallery-wall-v3 .gw-lava {

                        display: none;

                    }

                }

                .gallery-wall-v3 .gw-cta {

    opacity: 0;

    transform: translateY(8px);

    transition:

        opacity var(--gw-duration),

        transform var(--gw-duration) cubic-bezier(.22,1,.36,1);

}

@media (hover: hover) and (pointer: fine) {

    .gallery-wall-v3[data-dragging="false"]

    .gw-card:hover .gw-cta {

        opacity: 1;

        transform: translateY(0);

    }

}

.gallery-wall-v3 .gw-card:focus-visible .gw-cta {

    opacity: 1;

    transform: translateY(0);

}

            `}</style>

            {showIndex && (
                <div
                    style={{
                        flex: "0 0 42px",

                        display: "flex",

                        alignItems: "center",

                        padding: `0 ${safePadding}px`,

                        fontSize: 10,

                        letterSpacing: "0.12em",
                    }}
                >
                    INDEX / {String(items.length).padStart(2, "0")}
                </div>
            )}

            <div
                ref={viewportRef}
                className="gw-viewport"
                tabIndex={isStatic ? undefined : 0}
                aria-label="Gallery. Scroll horizontally or use arrow keys."
                onScroll={updateNavigation}
                onKeyDown={(event) => {
                    if (
                        isStatic ||
                        event.altKey ||
                        event.ctrlKey ||
                        event.metaKey
                    )
                        return

                    if (event.key === "ArrowRight") {
                        event.preventDefault()

                        scrollBy(1)
                    }

                    if (event.key === "ArrowLeft") {
                        event.preventDefault()

                        scrollBy(-1)
                    }
                }}
                onPointerDownCapture={(event) => {
                    suppressClick.current = false

                    if (
                        isStatic ||
                        event.pointerType === "touch" ||
                        event.button !== 0
                    )
                        return

                    gesture.current = {
                        pointerId: event.pointerId,

                        startX: event.clientX,

                        startY: event.clientY,

                        startScroll: event.currentTarget.scrollLeft,

                        dragging: false,
                    }
                }}
                onPointerMove={(event) => {
                    const current = gesture.current

                    if (!current || current.pointerId !== event.pointerId)
                        return

                    const dx = event.clientX - current.startX

                    const dy = event.clientY - current.startY

                    if (
                        !current.dragging &&
                        Math.abs(dx) > 6 &&
                        Math.abs(dx) > Math.abs(dy)
                    ) {
                        current.dragging = true

                        suppressClick.current = true

                        event.currentTarget.setPointerCapture(event.pointerId)

                        setDragging(true)
                    }

                    if (current.dragging) {
                        event.preventDefault()

                        event.currentTarget.scrollLeft =
                            current.startScroll - dx
                    }
                }}
                onPointerUp={finishPointer}
                onPointerCancel={finishPointer}
                onLostPointerCapture={() => {
                    gesture.current = null

                    setDragging(false)
                }}
                onPointerLeave={() => {
                    if (!gesture.current?.dragging) {
                        gesture.current = null
                    }
                }}
                onClickCapture={(event) => {
                    if (
                        isStatic ||
                        (suppressClick.current && event.detail !== 0)
                    ) {
                        event.preventDefault()

                        event.stopPropagation()
                    }
                }}
                onDragStart={(event) => event.preventDefault()}
                style={{
                    flex: "1 1 0",

                    minHeight: 0,

                    minWidth: 0,

                    position: "relative",

                    overflowX: isStatic ? "hidden" : "auto",

                    overflowY: "hidden",

                    touchAction: "pan-x pan-y pinch-zoom",

                    cursor: dragging ? "grabbing" : "grab",
                }}
            >
                <div
                    style={{
                        width: contentWidth,

                        height: "100%",

                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",

                            left: wallLeft,

                            top: wallTop,

                            width: rawWidth,

                            height: rawHeight,

                            transform: `scale(${scale})`,

                            transformOrigin: "top left",
                        }}
                    >
                        {cards.map((card) => {
                            const { item, index } = card

                            const linked = Boolean(item.link)

                            const label =
                                item.buttonText?.trim() ||
                                buttonLabel ||
                                "View project"

                            const content = (
                                <>
                                    <div className="gw-media">
                                        <div className="gw-photo">
                                            <Photo item={item} />
                                        </div>

                                        {effects && (
                                            <div
                                                className="gw-lava"
                                                aria-hidden="true"
                                            >
                                                <div className="gw-lava-blob" />
                                            </div>
                                        )}

                                        {linked && showButtons && (
                                            <>
                                                <div
                                                    className="gw-shade"
                                                    aria-hidden="true"
                                                />

                                                {/* Visual CTA inside the

                                                    full-image link. */}

                                                <span
                                                    className="gw-cta"
                                                    aria-hidden="true"
                                                >
                                                    <span className="gw-cta-label">
                                                        {label}
                                                    </span>

                                                    <span className="gw-cta-arrow">
                                                        <span className="gw-arrow-main">
                                                            <Arrow />
                                                        </span>

                                                        <span className="gw-arrow-copy">
                                                            <Arrow />
                                                        </span>
                                                    </span>
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {hasCaption && (
                                        <div
                                            style={{
                                                position: "absolute",

                                                top: "calc(100% + 8px)",

                                                left: 0,

                                                right: 0,

                                                display: "flex",

                                                alignItems: "center",

                                                gap: 10,

                                                fontSize: 10,

                                                lineHeight: "14px",

                                                letterSpacing: "0.03em",

                                                whiteSpace: "nowrap",

                                                opacity: 0.65,
                                            }}
                                        >
                                            {showNumbers && (
                                                <span
                                                    style={{
                                                        flexShrink: 0,

                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {String(index + 1).padStart(
                                                        2,

                                                        "0"
                                                    )}
                                                </span>
                                            )}

                                            {showTitles && item.title && (
                                                <span
                                                    style={{
                                                        overflow: "hidden",

                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {item.title}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </>
                            )

                            const cardStyle: React.CSSProperties = {
                                position: "absolute",

                                left: card.left,

                                top: card.top,

                                width: card.width,

                                height: card.height,

                                cursor: dragging
                                    ? "grabbing"
                                    : linked
                                      ? "pointer"
                                      : "grab",
                            }

                            return linked ? (
                                <a
                                    key={index}
                                    className="gw-card"
                                    href={item.link}
                                    target={item.newTab ? "_blank" : undefined}
                                    rel={
                                        item.newTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    tabIndex={isStatic ? -1 : undefined}
                                    draggable={false}
                                    onPointerMove={moveLight}
                                    aria-label={`${label}: ${
                                        item.title || `project ${index + 1}`
                                    }${
                                        item.newTab
                                            ? " (opens in a new tab)"
                                            : ""
                                    }`}
                                    style={cardStyle}
                                >
                                    {content}
                                </a>
                            ) : (
                                <div
                                    key={index}
                                    className="gw-card"
                                    onPointerMove={moveLight}
                                    style={cardStyle}
                                >
                                    {content}
                                </div>
                            )
                        })}
                    </div>

                    {items.length === 0 && (
                        <div
                            style={{
                                position: "absolute",

                                inset: 0,

                                display: "grid",

                                placeItems: "center",

                                fontSize: 12,

                                opacity: 0.6,
                            }}
                        >
                            Add your images
                        </div>
                    )}
                </div>
            </div>

            {showFooter && (
                <div
                    style={{
                        flex: "0 0 56px",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "space-between",

                        gap: 12,

                        padding: `0 ${Math.max(
                            8,

                            safePadding - 8
                        )}px 0 ${safePadding}px`,
                    }}
                >
                    <span
                        style={{
                            minWidth: 0,

                            fontSize: 10,

                            letterSpacing: "0.03em",

                            opacity: 0.6,

                            overflow: "hidden",

                            textOverflow: "ellipsis",

                            whiteSpace: "nowrap",
                        }}
                    >
                        {hint}
                    </span>

                    <div
                        style={{
                            display: "flex",

                            flexShrink: 0,

                            gap: 2,
                        }}
                    >
                        <button
                            type="button"
                            className="gw-control"
                            aria-label="Scroll gallery left"
                            disabled={isStatic || !navigation.previous}
                            onClick={() => scrollBy(-1)}
                        >
                            <Arrow left />
                        </button>

                        <button
                            type="button"
                            className="gw-control"
                            aria-label="Scroll gallery right"
                            disabled={isStatic || !navigation.next}
                            onClick={() => scrollBy(1)}
                        >
                            <Arrow />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(GalleryWall, {
    items: {
        type: ControlType.Array,

        title: "Images",

        defaultValue: demo,

        maxCount: 40,

        control: {
            type: ControlType.Object,

            controls: {
                image: {
                    type: ControlType.ResponsiveImage,

                    title: "Image",
                },

                title: {
                    type: ControlType.String,

                    title: "Title",

                    defaultValue: "",
                },

                link: {
                    type: ControlType.Link,

                    title: "Link",
                },

                newTab: {
                    type: ControlType.Boolean,

                    title: "New tab",

                    defaultValue: true,
                },

                buttonText: {
                    type: ControlType.String,

                    title: "Button text",

                    defaultValue: "",

                    placeholder: "Use default label",
                },
            },
        },
    },

    background: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: "#EEEDE8",
    },

    textColor: {
        type: ControlType.Color,

        title: "Text",

        defaultValue: "#252621",
    },

    accent: {
        type: ControlType.Color,

        title: "Button fill",

        defaultValue: "#F5F3EC",
    },

    buttonTextColor: {
        type: ControlType.Color,

        title: "Button text",

        defaultValue: "#252621",
    },

    showButtons: {
        type: ControlType.Boolean,

        title: "Buttons",

        defaultValue: true,
    },

    buttonLabel: {
        type: ControlType.String,

        title: "Button label",

        defaultValue: "View project",

        hidden: (props) => !props.showButtons,
    },

    imageSize: {
        type: ControlType.Number,

        title: "Image size",

        defaultValue: 240,

        min: 120,

        max: 420,

        step: 10,

        unit: "px",

        description: "Maximum size. Images scale down to fit the frame height.",
    },

    gap: {
        type: ControlType.Number,

        title: "Spacing",

        defaultValue: 42,

        min: 16,

        max: 120,

        unit: "px",
    },

    padding: {
        type: ControlType.Number,

        title: "Padding",

        defaultValue: 24,

        min: 8,

        max: 80,

        unit: "px",
    },

    hoverEffects: {
        type: ControlType.Boolean,

        title: "Hover",

        defaultValue: true,
    },

    hoverZoom: {
        type: ControlType.Number,

        title: "Hover zoom",

        defaultValue: 1.055,

        min: 1,

        max: 1.2,

        step: 0.005,

        hidden: (props) => !props.hoverEffects,
    },

    lavaOpacity: {
        type: ControlType.Number,

        title: "Lava strength",

        defaultValue: 0.18,

        min: 0,

        max: 1,

        step: 0.01,

        hidden: (props) => !props.hoverEffects,
    },

    lavaColor: {
        type: ControlType.Color,

        title: "Lava color",

        defaultValue: "#FFF2D8",

        hidden: (props) => !props.hoverEffects,
    },

    duration: {
        type: ControlType.Number,

        title: "Duration",

        defaultValue: 0.55,

        min: 0.15,

        max: 1.5,

        step: 0.05,

        unit: "s",

        hidden: (props) => !props.hoverEffects,
    },

    showNumbers: {
        type: ControlType.Boolean,

        title: "Numbers",

        defaultValue: true,
    },

    showTitles: {
        type: ControlType.Boolean,

        title: "Titles",

        defaultValue: false,
    },

    showIndex: {
        type: ControlType.Boolean,

        title: "Index",

        defaultValue: true,
    },

    showFooter: {
        type: ControlType.Boolean,

        title: "Navigation",

        defaultValue: true,
    },

    hint: {
        type: ControlType.String,

        title: "Hint",

        defaultValue: "Drag or scroll to explore",

        hidden: (props) => !props.showFooter,
    },
})
