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


type ImageValue = {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: string
    positionY?: string
}
type Hover = "zoom" | "lift" | "overlay" | "none"
interface Item {
    image?: ImageValue | string
    category?: string
    title?: string
    link?: string
    newTab?: boolean
    demoImage?: string
    useDemoImage?: boolean
}
interface ResolvedItem extends Omit<Item, "image"> {
    image?: ImageValue
}
interface LayoutSettings {
    cardWidth?: number
    imageHeight?: number
    gap?: number
    stagger?: number
    radius?: number
}
interface HoverSettings {
    hoverMode?: Hover
    hoverScale?: number
    hoverLift?: number
    duration?: number
    hoverFill?: string
}
interface CaptionSettings {
    captionSize?: number
    captionWeight?: number
    captionColor?: string
    numberSize?: number
    captionPadding?: number
    captionBottom?: number
    captionFade?: number
}
interface CanvasSettings {
    background?: string
    border?: string
    showDots?: boolean
    initialZoom?: number
    inertia?: boolean
}
interface Props
    extends LayoutSettings,
        HoverSettings,
        CaptionSettings,
        CanvasSettings {
    items?: Item[]
    layoutSettings?: LayoutSettings
    hoverSettings?: HoverSettings
    captionSettings?: CaptionSettings
    canvasSettings?: CanvasSettings
    surface?: string
    ink?: string
    muted?: string
    font?: React.CSSProperties
    width?: number
    height?: number
    style?: React.CSSProperties
}
const DEMO: Item[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/DtvGbqfUVJt71Hr5EIJ29YdCwA.png",
        },
        title: "Barriers",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/EEujJ6Bc6bGS74e0ISWdwINdKk.png",
            alt: "grayscale photo of brick building",
        },
        title: "Soft curves",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/zNqywUCGIv6dd4j7JAPLn2qM4.png",
        },
        title: "Outline",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/lposkZS4I2vcKhxqwVabLOcggzA.png",
        },
        title: "Repetition",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/b0kcmFfCwLr1JhiYf7pKpYNQ3E.png",
        },
        title: "Passage",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/NJyEpXfOhWpMoeEJBDOvyTEM.png",
        },
        title: "Elevation",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/eXw2idppiJclVwjIvU3A1yn9eE.png",
        },
        title: "New study",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/zijyNOYRcFm15x751SQv4yyU.png",
        },
        title: "New study",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/ibyckr8f9vkFh5YwhsSuiPo.png",
        },
        title: "New study",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/PfpkOoVAhfwjsvEZ9nZ3j3Ecjg.png",
        },
        title: "Bravery",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/ylGB9IK8l5JohRDWC0sLWhchw.png",
        },
        title: "New study",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/oQa3ytREFHQIDtSF0q2cwqNZ0Q.png",
        },
        title: "Battle",
        newTab: true,
    },
    {
        image: {
            src: "https://framerusercontent.com/images/bar0ozsNrD3S3KVdJRODFexUXo.png",
        },
        title: "Fog",
        newTab: true,
    },
]
// Plain URL fallbacks survive Framer's nested ResponsiveImage serialization.
// Only demo cards opt in; new blank cards remain blank.
const DEFAULT_ITEMS: Item[] = DEMO.map((item) => ({
    ...item,
    demoImage: typeof item.image === "string" ? item.image : item.image?.src,
    useDemoImage: true,
}))
const DEFAULT_LAYOUT = {
    cardWidth: 250,
    imageHeight: 340,
    gap: 180,
    stagger: 180,
    radius: 12,
} satisfies LayoutSettings
const DEFAULT_HOVER = {
    hoverMode: "lift",
    hoverScale: 1.09,
    hoverLift: 0,
    duration: 600,
    hoverFill: "#262626",
} satisfies HoverSettings
const DEFAULT_CAPTIONS = {
    captionSize: 14,
    captionWeight: 500,
    captionColor: "#ffffff",
    numberSize: 12,
    captionPadding: 14,
    captionBottom: 30,
    captionFade: 0.2,
} satisfies CaptionSettings
const DEFAULT_CANVAS = {
    background: "rgb(0, 0, 0)",
    showDots: true,
    border: "rgba(255, 255, 255, 0.09)",
    initialZoom: 0.75,
    inertia: true,
} satisfies CanvasSettings
const DEFAULT_APPEARANCE = {
    surface: "rgb(0, 0, 0)",
    ink: "#262626",
    muted: "#6e6e68",
}
const DEFAULT_FONT = {
    fontFamily: "Inter Display",
    fontWeight: 400,
    fontSize: "16px",
    letterSpacing: "0em",
    lineHeight: "1em",
} satisfies React.CSSProperties
// Font faces are scoped to this component and travel with its module URL.
// Font files load only for weights/styles actually used.
const PORTABLE_FONT_CSS = "@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:100; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Thin.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:100; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-ThinItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:200; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-ExtraLight.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:200; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-ExtraLightItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:300; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Light.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:300; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-LightItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:400; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Regular.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:400; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Italic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:500; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Medium.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:500; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-MediumItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:600; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-SemiBold.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:600; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-SemiBoldItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:700; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Bold.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:700; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-BoldItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:800; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-ExtraBold.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:800; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-ExtraBoldItalic.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:normal; font-weight:900; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-Black.woff2?v=4.1\") format(\"woff2\"); }\n@font-face { font-family:\"CanvasExplorer Inter Display\"; font-style:italic; font-weight:900; font-display:swap; src:url(\"https://rsms.me/inter/font-files/InterDisplay-BlackItalic.woff2?v=4.1\") format(\"woff2\"); }"
const resolveFont = (font?: React.CSSProperties): React.CSSProperties => {
    const resolved = { ...DEFAULT_FONT, ...font }
    const family = resolved.fontFamily || DEFAULT_FONT.fontFamily
    if (/^["']?Inter\s*Display["']?(?:,|$)/i.test(family.trim())) {
        resolved.fontFamily = '"CanvasExplorer Inter Display", sans-serif'
    }
    return resolved
}
// An infinite, absolutely positioned canvas has no natural content width.
// Fixed layout metadata and concrete root dimensions prevent a zero-width
// Fit Content insertion without forcing a minimum size on resized instances.
const DEFAULT_WIDTH = 1400
const DEFAULT_HEIGHT = 900
const resolveDimension = (
    value: React.CSSProperties["width"],
    fallback: number
): React.CSSProperties["width"] => {
    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0 ? value : fallback
    }
    if (typeof value === "string") {
        const dimension = value.trim()
        if (
            dimension &&
            !/^(?:auto|fit-content(?:\(.*\))?|min-content|max-content|inherit|initial|unset|0(?:\.0+)?(?:px|%|rem|em)?)$/i.test(dimension)
        ) return value
    }
    return Number.isFinite(fallback) && fallback > 0 ? fallback : DEFAULT_WIDTH
}
const mod = (n: number, d: number) => ((n % d) + d) % d
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const safeLink = (s?: string) =>
    typeof s === "string" &&
    ["https://", "http://", "mailto:", "tel:", "/", "#"].some((prefix) =>
        s.toLowerCase().startsWith(prefix)
    ) &&
    !s.startsWith("//")
        ? s
        : undefined
const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
}
interface Cell {
    col: number
    row: number
    index: number
}
interface Bounds {
    a: number
    b: number
    c: number
    d: number
}
interface Camera {
    x: number
    y: number
    z: number
}

const Card = React.memo(function Card({
    item,
    index,
    width,
    imageHeight,
    radius,
    mode,
    scale,
    lift,
    duration,
    surface,
    ink,
    muted,
    border,
    hoverFill,
    captionSize,
    captionWeight,
    captionColor,
    numberSize,
    captionPadding,
    captionBottom,
    captionFade,
    reduced,
    interactive,
    fluid = false,
    keyboard = false,
}: {
    item: ResolvedItem
    index: number
    width: number
    imageHeight: number
    radius: number
    mode: Hover
    scale: number
    lift: number
    duration: number
    surface: string
    ink: string
    muted: string
    border: string
    hoverFill: string
    captionSize: number
    captionWeight: number
    captionColor: string
    numberSize: number
    captionPadding: number
    captionBottom: number
    captionFade: number
    reduced: boolean
    interactive: boolean
    fluid?: boolean
    keyboard?: boolean
}) {
    const [hot, setHot] = React.useState(false)
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => setFailed(false), [item.image?.src])
    React.useEffect(() => {
        if (!interactive) setHot(false)
    }, [interactive])
    const active = hot && interactive && mode !== "none"
    const overlay = active && mode === "overlay"
    const href = safeLink(item.link)
    const Tag = href ? "a" : "div"
    const transition = reduced
        ? "none"
        : "transform " +
          duration +
          "ms cubic-bezier(.2,.7,.2,1), opacity " +
          duration +
          "ms ease, background-color " +
          duration +
          "ms ease"
    const image = item.image
    return (
        <Tag
            tabIndex={keyboard ? undefined : -1}
            href={href}
            target={href && item.newTab ? "_blank" : undefined}
            rel={href && item.newTab ? "noopener noreferrer" : undefined}
            aria-label={
                (item.title || "Untitled") +
                (item.newTab && href ? " — new tab" : "")
            }
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onPointerEnter={(e) => {
                if (e.pointerType !== "touch") setHot(true)
            }}
            onPointerLeave={() => setHot(false)}
            onFocus={(e) => setHot(e.currentTarget.matches(":focus-visible"))}
            onBlur={() => setHot(false)}
            style={{
                display: "block",
                position: "relative",
                width: fluid ? "100%" : width,
                maxWidth: "100%",
                height: imageHeight,
                boxSizing: "border-box",
                border: "1px solid " + border,
                borderRadius: radius,
                background: surface,
                color: ink,
                textDecoration: "none",
                overflow: "hidden",
                transform:
                    active && mode === "lift"
                        ? "translateY(-" + lift + "px)"
                        : "translateY(0)",
                transition,
                cursor: href ? "pointer" : "inherit",
                outlineOffset: 4,
            }}
        >
            <div
                style={{
                    height: imageHeight,
                    position: "relative",
                    overflow: "hidden",
                    background: border,
                }}
            >
                {image?.src && !failed ? (
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        sizes={Math.ceil(width * 1.5) + "px"}
                        alt={image.alt || item.title || "Visual study"}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        onError={() => setFailed(true)}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                            objectFit: "cover",
                            objectPosition:
                                (image.positionX || "50%") +
                                " " +
                                (image.positionY || "50%"),
                            pointerEvents: "none",
                            transform:
                                active && (mode === "zoom" || mode === "lift")
                                    ? "scale(" + scale + ")"
                                    : "scale(1)",
                            transition,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            height: "100%",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 12,
                            color: muted,
                        }}
                    >
                        {failed ? "Image unavailable" : "Add an image"}
                    </div>
                )}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: hoverFill,
                        opacity: overlay ? 0.88 : 0,
                        pointerEvents: "none",
                        transition,
                    }}
                />
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: Math.max(70, captionBottom + 38),
                    padding: `0 ${captionPadding}px ${Math.max(0, captionBottom - 24)}px`,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 8,
                    background: `linear-gradient(transparent,rgba(0,0,0,${clamp(captionFade, 0, 1)}))`,
                    color: captionColor,
                    pointerEvents: "none",
                }}
            >
                <span
                    style={{
                        fontSize: captionSize,
                        lineHeight: "24px",
                        fontWeight: captionWeight,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {item.title || "Untitled"}
                </span>
                <span
                    style={{
                        fontSize: numberSize,
                        lineHeight: "24px",
                        fontWeight: 400,
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {String(index + 1).padStart(2, "0")}
                </span>
            </div>
        </Tag>
    )
})

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 900
 */
export default function PD6InfiniteCardCanvasCopy2(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        cardWidth = DEFAULT_LAYOUT.cardWidth,
        imageHeight = DEFAULT_LAYOUT.imageHeight,
        gap = DEFAULT_LAYOUT.gap,
        stagger = DEFAULT_LAYOUT.stagger,
        radius = DEFAULT_LAYOUT.radius,
        initialZoom = DEFAULT_CANVAS.initialZoom,
        inertia = DEFAULT_CANVAS.inertia,
        hoverMode = DEFAULT_HOVER.hoverMode,
        hoverScale = DEFAULT_HOVER.hoverScale,
        hoverLift = DEFAULT_HOVER.hoverLift,
        duration = DEFAULT_HOVER.duration,
        background = DEFAULT_CANVAS.background,
        surface = DEFAULT_APPEARANCE.surface,
        ink = DEFAULT_APPEARANCE.ink,
        muted = DEFAULT_APPEARANCE.muted,
        border = DEFAULT_CANVAS.border,
        hoverFill = DEFAULT_HOVER.hoverFill,
        showDots = DEFAULT_CANVAS.showDots,
        captionSize = DEFAULT_CAPTIONS.captionSize,
        captionWeight = DEFAULT_CAPTIONS.captionWeight,
        captionColor = DEFAULT_CAPTIONS.captionColor,
        numberSize = DEFAULT_CAPTIONS.numberSize,
        captionPadding = DEFAULT_CAPTIONS.captionPadding,
        captionBottom = DEFAULT_CAPTIONS.captionBottom,
        captionFade = DEFAULT_CAPTIONS.captionFade,
        font = DEFAULT_FONT,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        style,
    } = {
        ...props,
        ...props.layoutSettings,
        ...props.hoverSettings,
        ...props.captionSettings,
        ...props.canvasSettings,
    }
    const data = React.useMemo(
        () =>
            (Array.isArray(items) ? items : DEFAULT_ITEMS)
                .filter((item): item is Item => Boolean(item))
                .map((item): ResolvedItem => ({
                    ...item,
                    image:
                        typeof item.image === "string"
                            ? { src: item.image }
                            : item.image?.src
                              ? item.image
                              : item.useDemoImage && item.demoImage
                                ? { src: item.demoImage, alt: item.title }
                                : undefined,
                })),
        [items]
    )
    const isStatic = useIsStaticRenderer()
    const root = React.useRef<HTMLDivElement>(null),
        stage = React.useRef<HTMLDivElement>(null),
        world = React.useRef<HTMLDivElement>(null),
        dots = React.useRef<HTMLDivElement>(null),
        zoomLabel = React.useRef<HTMLButtonElement>(null)
    const [size, setSize] = React.useState({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    })
    const [list, setList] = React.useState(false),
        [reduced, setReduced] = React.useState(false)
    const [bounds, setBounds] = React.useState<Bounds>({
        a: -3,
        b: 3,
        c: -2,
        d: 2,
    })
    const [dragging, setDragging] = React.useState(false)
    const cam = React.useRef<Camera>({
        x: 570,
        y: 216,
        z: clamp(initialZoom, 0.5, 1.5),
    })
    const range = React.useRef("")
    const raf = React.useRef(0),
        engine = React.useRef<(t: number) => void>(() => {})
    const velocity = React.useRef({ x: 0, y: 0, time: 0, last: 0 })
    const pointers = React.useRef(new Map<number, { x: number; y: number }>())
    const gesture = React.useRef({
        x: 0,
        y: 0,
        startX: 0,
        startY: 0,
        time: 0,
        moved: false,
        pinch: 0,
    })
    const suppressClick = React.useRef(false),
        interacted = React.useRef(false),
        enabled = React.useRef(true)
    const hintId = React.useId()
    const w = clamp(cardWidth, 160, 560),
        ih = clamp(imageHeight, 100, 500),
        h = ih
    const sx = w + clamp(gap, 20, 180),
        sy = h + clamp(gap, 20, 180),
        shift = clamp(stagger, 0, sy * 0.45)
    const periodX = sx * Math.max(2, data.length * 2),
        periodY = sy * Math.max(1, data.length)
    const zoomMin = Math.max(
            0.5,
            size.width / (12 * sx),
            size.height / (10 * sy)
        ),
        zoomMax = Math.max(1.5, zoomMin)
    const refresh = () => {
        const c = cam.current
        c.z = clamp(c.z, zoomMin, zoomMax)
        c.x =
            mod(c.x + (periodX * c.z) / 2, periodX * c.z) - (periodX * c.z) / 2
        c.y =
            mod(c.y + (periodY * c.z) / 2, periodY * c.z) - (periodY * c.z) / 2
        if (world.current)
            world.current.style.transform =
                "translate3d(" + c.x + "px," + c.y + "px,0) scale(" + c.z + ")"
        if (dots.current) {
            dots.current.style.backgroundPosition = c.x + "px " + c.y + "px"
            dots.current.style.backgroundSize =
                24 * c.z + "px " + 24 * c.z + "px"
        }
        if (zoomLabel.current)
            zoomLabel.current.textContent = Math.round(c.z * 100) + " %"
        const next = {
            a: Math.floor(-c.x / c.z / sx) - 1,
            b: Math.ceil((size.width - c.x) / c.z / sx),
            c: Math.floor((-c.y / c.z - shift) / sy) - 1,
            d: Math.ceil((size.height - c.y) / c.z / sy),
        }
        const key = [next.a, next.b, next.c, next.d].join(":")
        if (range.current !== key) {
            range.current = key
            setBounds(next)
        }
    }
    const schedule = () => {
        if (!raf.current && enabled.current && !isStatic && !list)
            raf.current = requestAnimationFrame((t) => engine.current(t))
    }
    const stop = () => {
        cancelAnimationFrame(raf.current)
        raf.current = 0
        velocity.current.x = 0
        velocity.current.y = 0
        velocity.current.last = 0
    }
    engine.current = (now) => {
        raf.current = 0
        const v = velocity.current
        if (!pointers.current.size && inertia && !reduced) {
            const dt = v.last ? Math.min(32, now - v.last) : 16.67
            cam.current.x += (v.x * dt) / 16.67
            cam.current.y += (v.y * dt) / 16.67
            const decay = Math.pow(0.89, dt / 16.67)
            v.x *= decay
            v.y *= decay
        }
        v.last = now
        refresh()
        if (
            !pointers.current.size &&
            inertia &&
            !reduced &&
            Math.hypot(v.x, v.y) > 0.12
        )
            schedule()
        else if (!pointers.current.size) {
            v.x = 0
            v.y = 0
            v.last = 0
        }
    }
    const reset = () => {
        stop()
        interacted.current = false
        const z = clamp(initialZoom, zoomMin, zoomMax)
        cam.current = {
            x: (size.width - w * z) / 2,
            y: (size.height - h * z) / 2,
            z,
        }
        refresh()
    }
    const zoomAt = (z: number, x: number, y: number) => {
        stop()
        interacted.current = true
        const c = cam.current,
            next = clamp(z, zoomMin, zoomMax),
            ratio = next / c.z
        c.x = x - (x - c.x) * ratio
        c.y = y - (y - c.y) * ratio
        c.z = next
        schedule()
    }
    React.useEffect(() => {
        const el = stage.current
        if (!el) return
        const measure = () =>
            setSize((old) => {
                const width = el.clientWidth || 1400,
                    height = el.clientHeight || DEFAULT_HEIGHT
                return old.width === width && old.height === height
                    ? old
                    : { width, height }
            })
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [list])
    React.useEffect(() => {
        if (!interacted.current) reset()
        else refresh()
    }, [size, w, ih, sx, sy, shift, initialZoom, data.length, list])
    React.useEffect(() => {
        const el = root.current
        if (!el) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const preference = () => {
            setReduced(query.matches)
            if (query.matches) stop()
        }
        preference()
        let inView = true
        const update = () => {
            enabled.current = inView && !document.hidden
            if (!enabled.current) stop()
        }
        const io = new IntersectionObserver((entries) => {
            inView = entries[0]?.isIntersecting ?? true
            update()
        })
        io.observe(el)
        query.addEventListener("change", preference)
        document.addEventListener("visibilitychange", update)
        return () => {
            stop()
            io.disconnect()
            query.removeEventListener("change", preference)
            document.removeEventListener("visibilitychange", update)
        }
    }, [])
    React.useEffect(() => {
        const el = stage.current
        if (!el || isStatic || list) return
        const wheel = (e: WheelEvent) => {
            e.preventDefault()
            interacted.current = true
            stop()
            if (e.ctrlKey || e.metaKey) {
                const r = el.getBoundingClientRect()
                zoomAt(
                    cam.current.z * Math.exp(-e.deltaY * 0.008),
                    e.clientX - r.left,
                    e.clientY - r.top
                )
            } else {
                const unit =
                    e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.height : 1
                cam.current.x -=
                    (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit
                cam.current.y -= (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * unit
                schedule()
            }
        }
        el.addEventListener("wheel", wheel, { passive: false })
        return () => el.removeEventListener("wheel", wheel)
    }, [isStatic, list, size, sx, sy, shift, data.length, inertia, reduced])
    const down = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || list || e.button !== 0) return
        stop()
        suppressClick.current = false
        interacted.current = true
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const g = gesture.current
        g.x = e.clientX
        g.y = e.clientY
        g.startX = e.clientX
        g.startY = e.clientY
        g.time = performance.now()
        g.moved = false
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()]
            g.pinch = Math.hypot(a.x - b.x, a.y - b.y)
            g.x = (a.x + b.x) / 2
            g.y = (a.y + b.y) / 2
            g.moved = true
            suppressClick.current = true
            setDragging(true)
            pointers.current.forEach((_, id) =>
                e.currentTarget.setPointerCapture(id)
            )
        }
    }
    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointers.current.has(e.pointerId)) return
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        const g = gesture.current,
            now = performance.now()
        if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()],
                mx = (a.x + b.x) / 2,
                my = (a.y + b.y) / 2,
                dist = Math.hypot(a.x - b.x, a.y - b.y)
            const r = e.currentTarget.getBoundingClientRect()
            cam.current.x += mx - g.x
            cam.current.y += my - g.y
            zoomAt(
                (cam.current.z * dist) / Math.max(1, g.pinch),
                mx - r.left,
                my - r.top
            )
            g.pinch = dist
            g.x = mx
            g.y = my
            g.moved = true
            suppressClick.current = true
            return
        }
        if (
            !g.moved &&
            Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < 5
        )
            return
        if (!g.moved) {
            g.moved = true
            setDragging(true)
            e.currentTarget.setPointerCapture(e.pointerId)
        }
        e.preventDefault()
        suppressClick.current = true
        const dx = e.clientX - g.x,
            dy = e.clientY - g.y,
            dt = Math.max(8, now - g.time)
        cam.current.x += dx
        cam.current.y += dy
        velocity.current.x = clamp((dx * 16.67) / dt, -60, 60)
        velocity.current.y = clamp((dy * 16.67) / dt, -60, 60)
        g.x = e.clientX
        g.y = e.clientY
        g.time = now
        velocity.current.time = now
        schedule()
    }
    const up = (e: React.PointerEvent<HTMLDivElement>) => {
        if (
            e.type === "lostpointercapture" &&
            e.currentTarget.hasPointerCapture(e.pointerId)
        )
            return
        if (!pointers.current.has(e.pointerId)) return
        pointers.current.delete(e.pointerId)
        if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId)
        if (pointers.current.size) {
            const p = [...pointers.current.values()][0]
            Object.assign(gesture.current, {
                x: p.x,
                y: p.y,
                startX: p.x,
                startY: p.y,
                time: performance.now(),
                pinch: 0,
                moved: true,
            })
            return
        }
        setDragging(false)
        if (
            e.type !== "pointerup" ||
            performance.now() - velocity.current.time > 90 ||
            reduced
        ) {
            velocity.current.x = 0
            velocity.current.y = 0
        }
        if (gesture.current.moved) schedule()
    }
    const cells = React.useMemo(() => {
        const result: Cell[] = []
        if (!data.length) return result
        for (let row = bounds.c; row <= bounds.d; row++)
            for (let col = bounds.a; col <= bounds.b; col++) {
                if (result.length >= 256) return result
                result.push({
                    col,
                    row,
                    index: mod(col + row * 3, data.length),
                })
            }
        return result
    }, [bounds, data.length])
    const cardProps = {
        width: w,
        imageHeight: ih,
        radius,
        mode: hoverMode,
        scale: hoverScale,
        lift: hoverLift,
        duration,
        surface,
        ink,
        muted,
        border,
        hoverFill,
        captionSize,
        captionWeight,
        captionColor,
        numberSize,
        captionPadding,
        captionBottom,
        captionFade,
        reduced,
        interactive: !dragging && !isStatic,
    }
    const button: React.CSSProperties = {
        appearance: "none",
        border: "1px solid " + border,
        borderRadius: 999,
        background: surface,
        color: ink,
        font: "inherit",
        fontSize: 11,
        lineHeight: "16px",
        fontWeight: 500,
        padding: "10px 16px",
        minHeight: 40,
        cursor: "pointer",
        whiteSpace: "nowrap",
    }
    return (
        <div
            ref={root}
            style={{
                fontFamily: "Inter Display, sans-serif",
                fontWeight: 400,
                ...resolveFont(font),
                ...style,
                width: resolveDimension(style?.width, width),
                height: resolveDimension(style?.height, height),
                position: "relative",
                overflow: "hidden",
                background,
                color: ink,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
            }}
        >
            <style>{PORTABLE_FONT_CSS}</style>
            <div
                ref={stage}
                role="region"
                aria-label={list ? "Image list" : "Infinite image canvas"}
                aria-describedby={hintId}
                tabIndex={list ? undefined : 0}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onLostPointerCapture={up}
                onPointerLeave={(e) => {
                    if (!e.currentTarget.hasPointerCapture(e.pointerId)) up(e)
                }}
                onClickCapture={(e) => {
                    if (suppressClick.current && !list) {
                        e.preventDefault()
                        e.stopPropagation()
                        suppressClick.current = false
                    }
                }}
                onKeyDown={(e) => {
                    if (list || e.target !== e.currentTarget) return
                    const shifts: Record<string, number[]> = {
                        ArrowLeft: [80, 0],
                        ArrowRight: [-80, 0],
                        ArrowUp: [0, 80],
                        ArrowDown: [0, -80],
                    }
                    if (shifts[e.key]) {
                        e.preventDefault()
                        stop()
                        interacted.current = true
                        cam.current.x += shifts[e.key][0]
                        cam.current.y += shifts[e.key][1]
                        schedule()
                    }
                    if (e.key === "+" || e.key === "=" || e.key === "-") {
                        e.preventDefault()
                        zoomAt(
                            cam.current.z + (e.key === "-" ? -0.1 : 0.1),
                            size.width / 2,
                            size.height / 2
                        )
                    }
                    if (e.key === "0" || e.key === "Home") {
                        e.preventDefault()
                        reset()
                    }
                }}
                style={{
                    position: "relative",
                    flex: "1 1 0",
                    minHeight: 0,
                    overflow: list ? "auto" : "hidden",
                    touchAction: list ? "pan-y" : "none",
                    userSelect: list ? "auto" : "none",
                    cursor: list ? "auto" : dragging ? "grabbing" : "grab",
                    outlineOffset: -4,
                    overscrollBehavior: "contain",
                }}
            >
                {!data.length ? (
                    <div style={{ padding: 32, fontSize: 14 }}>
                        Add your cards in the component properties.
                    </div>
                ) : list ? (
                    <div
                        style={{
                            padding: 32,
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit,minmax(min(100%,240px),1fr))",
                            gap: 24,
                            alignItems: "start",
                        }}
                    >
                        {data.map((item, index) => (
                            <div key={index} style={{ width: "100%" }}>
                                <Card
                                    {...cardProps}
                                    width={w}
                                    fluid
                                    keyboard
                                    item={item}
                                    index={index}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div
                            ref={dots}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                opacity: showDots ? 0.55 : 0,
                                backgroundImage:
                                    "radial-gradient(circle," +
                                    border +
                                    " .7px, transparent .9px)",
                                backgroundSize: "24px 24px",
                            }}
                        />
                        <div
                            ref={world}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: 0,
                                height: 0,
                                transformOrigin: "0 0",
                                transform:
                                    "translate3d(" +
                                    cam.current.x +
                                    "px," +
                                    cam.current.y +
                                    "px,0) scale(" +
                                    cam.current.z +
                                    ")",
                                willChange: isStatic ? undefined : "transform",
                            }}
                        >
                            {cells.map((cell) => (
                                <div
                                    key={cell.col + ":" + cell.row}
                                    style={{
                                        position: "absolute",
                                        left: cell.col * sx,
                                        top:
                                            cell.row * sy +
                                            mod(cell.col, 2) * shift,
                                        width: w,
                                        height: h,
                                    }}
                                >
                                    <Card
                                        {...cardProps}
                                        item={data[cell.index]}
                                        index={cell.index}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            <p id={hintId} style={srOnly}>
                Drag to explore. Use the scroll wheel or trackpad to pan. Hold
                Ctrl or Command and scroll to zoom, or pinch with two fingers.
                Keyboard: arrow keys to pan, plus and minus to zoom, zero to
                recenter. List mode displays each image only once.
            </p>
        </div>
    )
}

// Keep saved flat properties as hidden compatibility aliases.
// The editor exposes six focused entries; rendering still accepts existing values.
PD6InfiniteCardCanvasCopy2.defaultProps = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    ...DEFAULT_LAYOUT,
    ...DEFAULT_HOVER,
    ...DEFAULT_CAPTIONS,
    ...DEFAULT_CANVAS,
    ...DEFAULT_APPEARANCE,
    items: DEFAULT_ITEMS,
    layoutSettings: DEFAULT_LAYOUT,
    hoverSettings: DEFAULT_HOVER,
    captionSettings: DEFAULT_CAPTIONS,
    canvasSettings: DEFAULT_CANVAS,
    font: DEFAULT_FONT,
} satisfies Partial<Props>

PD6InfiniteCardCanvasCopy2.displayName = "Canvas Explorer"

addPropertyControls(PD6InfiniteCardCanvasCopy2, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 200,
        // ResponsiveImage controls serialize their default as a URL.
        // The renderer accepts both URLs and Framer responsive-image objects.
        defaultValue: DEFAULT_ITEMS.map((item) => ({
            ...item,
            image: typeof item.image === "string" ? item.image : item.image?.src,
        })),
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                useDemoImage: {
                    type: ControlType.Boolean,
                    title: "Demo Image",
                    defaultValue: false,
                    hidden: (item) => !item.demoImage || Boolean(item.image),
                },
                demoImage: {
                    type: ControlType.String,
                    defaultValue: "",
                    hidden: () => true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New study",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                    hidden: (p) => !p.link,
                },
            },
        },
    },
    layoutSettings: {
        type: ControlType.Object,
        defaultValue: DEFAULT_LAYOUT,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 250,
                min: 160,
                max: 560,
                step: 4,
                unit: "px",
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 340,
                min: 100,
                max: 500,
                step: 4,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 180,
                min: 20,
                max: 180,
                step: 4,
                unit: "px",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 180,
                min: 0,
                max: 180,
                step: 4,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
    },
    hoverSettings: {
        type: ControlType.Object,
        defaultValue: DEFAULT_HOVER,
        title: "Hover",
        controls: {
            hoverMode: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["zoom", "lift", "overlay", "none"],
                optionTitles: ["Zoom", "Lift", "Overlay", "None"],
                defaultValue: "lift",
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 1.09,
                min: 1,
                max: 1.2,
                step: 0.005,
                hidden: (p) => p.hoverMode !== "zoom" && p.hoverMode !== "lift",
            },
            hoverLift: {
                type: ControlType.Number,
                title: "Lift",
                defaultValue: 0,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p) => p.hoverMode !== "lift",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 600,
                min: 0,
                max: 600,
                step: 10,
                unit: "ms",
            },
            hoverFill: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "#262626",
                hidden: (p) => p.hoverMode !== "overlay",
            },
        },
    },
    captionSettings: {
        type: ControlType.Object,
        defaultValue: DEFAULT_CAPTIONS,
        title: "Captions",
        controls: {
            captionSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 14,
                min: 10,
                max: 40,
                step: 1,
                unit: "px",
            },
            captionWeight: {
                type: ControlType.Number,
                title: "Weight",
                defaultValue: 500,
                min: 100,
                max: 900,
                step: 100,
            },
            captionColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#ffffff",
            },
            numberSize: {
                type: ControlType.Number,
                title: "Number Size",
                defaultValue: 12,
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
            },
            captionPadding: {
                type: ControlType.Number,
                title: "Side Inset",
                defaultValue: 14,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            captionBottom: {
                type: ControlType.Number,
                title: "Bottom Inset",
                defaultValue: 30,
                min: 24,
                max: 120,
                step: 1,
                unit: "px",
            },
            captionFade: {
                type: ControlType.Number,
                title: "Scrim",
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
    },
    canvasSettings: {
        type: ControlType.Object,
        defaultValue: DEFAULT_CANVAS,
        title: "Canvas",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgb(0, 0, 0)",
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Dots",
                defaultValue: true,
            },
            border: {
                type: ControlType.Color,
                title: "Lines & Dots",
                defaultValue: "rgba(255, 255, 255, 0.09)",
            },
            initialZoom: {
                type: ControlType.Number,
                title: "Start Zoom",
                defaultValue: 0.75,
                min: 0.5,
                max: 1.5,
                step: 0.05,
            },
            inertia: {
                type: ControlType.Boolean,
                title: "Inertia",
                defaultValue: true,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT,
    },

    cardWidth: { type: ControlType.Number, defaultValue: DEFAULT_LAYOUT.cardWidth, hidden: () => true },
    imageHeight: { type: ControlType.Number, defaultValue: DEFAULT_LAYOUT.imageHeight, hidden: () => true },
    gap: { type: ControlType.Number, defaultValue: DEFAULT_LAYOUT.gap, hidden: () => true },
    stagger: { type: ControlType.Number, defaultValue: DEFAULT_LAYOUT.stagger, hidden: () => true },
    radius: { type: ControlType.Number, defaultValue: DEFAULT_LAYOUT.radius, hidden: () => true },
    initialZoom: { type: ControlType.Number, defaultValue: DEFAULT_CANVAS.initialZoom, hidden: () => true },
    inertia: { type: ControlType.Boolean, defaultValue: DEFAULT_CANVAS.inertia, hidden: () => true },
    hoverMode: {
        type: ControlType.Enum,
        options: ["zoom", "lift", "overlay", "none"],
        hidden: () => true,
    },
    hoverScale: { type: ControlType.Number, defaultValue: DEFAULT_HOVER.hoverScale, hidden: () => true },
    hoverLift: { type: ControlType.Number, defaultValue: DEFAULT_HOVER.hoverLift, hidden: () => true },
    duration: { type: ControlType.Number, defaultValue: DEFAULT_HOVER.duration, hidden: () => true },
    background: { type: ControlType.Color, defaultValue: DEFAULT_CANVAS.background, hidden: () => true },
    surface: { type: ControlType.Color, defaultValue: DEFAULT_APPEARANCE.surface, hidden: () => true },
    ink: { type: ControlType.Color, defaultValue: DEFAULT_APPEARANCE.ink, hidden: () => true },
    muted: { type: ControlType.Color, defaultValue: DEFAULT_APPEARANCE.muted, hidden: () => true },
    border: { type: ControlType.Color, defaultValue: DEFAULT_CANVAS.border, hidden: () => true },
    hoverFill: { type: ControlType.Color, defaultValue: DEFAULT_HOVER.hoverFill, hidden: () => true },
    captionSize: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.captionSize, hidden: () => true },
    captionWeight: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.captionWeight, hidden: () => true },
    captionColor: { type: ControlType.Color, defaultValue: DEFAULT_CAPTIONS.captionColor, hidden: () => true },
    numberSize: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.numberSize, hidden: () => true },
    captionPadding: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.captionPadding, hidden: () => true },
    captionBottom: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.captionBottom, hidden: () => true },
    captionFade: { type: ControlType.Number, defaultValue: DEFAULT_CAPTIONS.captionFade, hidden: () => true },
    showDots: { type: ControlType.Boolean, defaultValue: DEFAULT_CANVAS.showDots, hidden: () => true },
})
