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


// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
// @framerIntrinsicWidth 1000
// @framerIntrinsicHeight 600
// @framerDisableUnlink

// Bare domains like "mysite.com/case-study" are treated by the browser as relative
// paths (-> 404), so give them a protocol. Everything else is left untouched.
function normalizeLink(raw?: string): string | undefined {
    if (!raw) return undefined
    const s = String(raw).trim()
    if (!s) return undefined
    if (/^(https?:|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(s)) return s
    if (/^[^\s\/]+\.[a-z]{2,}(\/|$|\?|#)/i.test(s)) return "https://" + s
    return s
}

type Tile = {
    image?: { src: string; srcSet?: string; alt?: string } | string
    icon?: string
    color?: string
    label?: string
    link?: string
    size?: number
    rotation?: number
    manual?: boolean
    x?: number
    y?: number
}

type Props = {
    items: Tile[]
    showTitle: boolean
    titleLayer?: React.ReactNode
    titleText: string
    titleFont: React.CSSProperties
    titleColor: string
    titleTag: "h1" | "h2" | "h3" | "p"
    titleMaxWidth: number
    titleAlign: "center" | "left" | "right" | "layer"
    scaleTitle: boolean
    titleTouch: number
    titleClearance: number
    radius: number
    tileShadow: string
    chipSide: "auto" | "top" | "bottom" | "left" | "right"
    chipGap: number
    chipBackground: string
    chipColor: string
    chipFollowsTile: boolean
    chipRadius: number
    chipPadX: number
    chipPadY: number
    chipShadow: string
    font: React.CSSProperties
    floatAmount: number
    floatSpeed: number
    sway: number
    autoScale: boolean
    tabletScale: number
    phoneScale: number
    tabletMaxWidth: number
    phoneMaxWidth: number
    canvasDevice: "desktop" | "tablet" | "phone"
    previewOpen: boolean
    clip: boolean
    openNewTab: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

const PALETTE = [
    "#FDEBDD",
    "#D9E7FD",
    "#DFF6FD",
    "#E9E2FB",
    "#E3F6E5",
    "#FFF2C9",
]
const GOLDEN = 1.32471795724474602596 // plastic constant: spreads tiles evenly without overlap-prone randomness

/**
 * Float Tiles
 * Rounded square tiles that drift gently. Click a tile to pop out its chip label.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FloatTiles(props: Props) {
    const {
        items,
        showTitle,
        titleLayer,
        titleText,
        titleFont,
        titleColor,
        titleTag,
        titleMaxWidth,
        titleAlign,
        scaleTitle,
        titleTouch,
        titleClearance,
        floatAmount,
        sway,
        radius,
        tileShadow,
        chipSide,
        chipGap,
        chipBackground,
        chipColor,
        chipFollowsTile,
        chipRadius,
        chipPadX,
        chipPadY,
        chipShadow,
        font,
        autoScale,
        tabletScale,
        phoneScale,
        tabletMaxWidth,
        phoneMaxWidth,
        canvasDevice,
        previewOpen,
        clip,
        openNewTab,
        ariaLabel,
        style,
    } = props

    const list = items || []
    const n = list.length

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = !isCanvas && !isStatic && !reduced

    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = "ft" + uid

    const containerRef = React.useRef<HTMLDivElement>(null)
    const titleRef = React.useRef<HTMLDivElement>(null)
    const [box, setBox] = React.useState({
        cw: 1000,
        ch: 600,
        tw: 0,
        th: 0,
        k: 1,
    })
    const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const tileRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const chipRefs = React.useRef<(HTMLElement | null)[]>([])

    const [open, setOpen] = React.useState<number | null>(null)
    const openRef = React.useRef<number | null>(null)
    openRef.current = open
    const [shift, setShift] = React.useState(0)

    const propsRef = React.useRef(props)
    propsRef.current = props

    // Measure the frame, the real size of the title and the current tablet / phone scale,
    // so tiles can be kept off the title no matter how big or long it is
    React.useLayoutEffect(() => {
        const c = containerRef.current
        if (!c) return
        const measure = () => {
            const t = titleRef.current
            const k =
                parseFloat(getComputedStyle(c).getPropertyValue("--ft-k")) || 1
            const ts = propsRef.current.scaleTitle ? k : 1
            const next = {
                cw: Math.round(c.clientWidth) || 1000,
                ch: Math.round(c.clientHeight) || 600,
                tw: t ? Math.round(t.offsetWidth * ts) : 0,
                th: t ? Math.round(t.offsetHeight * ts) : 0,
                k,
            }
            setBox((b) =>
                b.cw === next.cw &&
                b.ch === next.ch &&
                b.tw === next.tw &&
                b.th === next.th &&
                b.k === next.k
                    ? b
                    : next
            )
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(c)
        if (titleRef.current) ro.observe(titleRef.current)
        return () => ro.disconnect()
    }, [showTitle, scaleTitle])
    const calm = React.useRef<number[]>([])
    const timeRef = React.useRef(0)

    // Positions: manual (x / y in %) or an even, repeatable scatter.
    // With a title, auto-placed tiles are kept off it: measured from the title's real size,
    // the tile's own size (and tilt), and its floating drift. A tile may overlap the
    // title's left or right end by "Side overlap" px, never the middle, top or bottom.
    const pos = list.map((t, i) => {
        if (t.manual && typeof t.x === "number" && typeof t.y === "number")
            return { x: t.x, y: t.y }
        // Balanced around the middle: tiles come in pairs placed opposite each other
        // (point-symmetric around the centre), so the group is centred both ways.
        // An odd one out sits on the centre line
        const fr = (v: number) => v - Math.floor(v)
        const j = Math.floor(i / 2)
        const bx = 54 + 36 * fr(0.5 + (j + 1) / GOLDEN)
        const by = 14 + 72 * fr(0.5 + (j + 1) / (GOLDEN * GOLDEN))
        let x: number
        let y: number
        if (n === 1 || (n % 2 === 1 && i === n - 1)) {
            x = 50
            y = showTitle ? 16 : 50
        } else if (i % 2 === 0) {
            x = bx
            y = by
        } else {
            x = 100 - bx
            y = 100 - by
        }
        if (showTitle && box.tw > 0 && box.th > 0) {
            const { cw, ch, tw, th, k } = box
            const size = Math.max(16, t.size || 88) * k
            const tilt = (((t.rotation || 0) + sway) * Math.PI) / 180
            const half =
                (size / 2) *
                (Math.abs(Math.cos(tilt)) + Math.abs(Math.sin(tilt)))
            let px = (x / 100) * cw
            let py = (y / 100) * ch
            const L = cw / 2 - tw / 2
            const R = cw / 2 + tw / 2
            const T = ch / 2 - th / 2
            const B = ch / 2 + th / 2
            const touch = Math.max(0, Math.min(titleTouch, tw / 4))
            const gapY = titleClearance + floatAmount
            const hits =
                px + half > L + touch &&
                px - half < R - touch &&
                py + half > T - gapY &&
                py - half < B + gapY
            if (hits) {
                const m = 8
                const options = [
                    { x: L + touch - half, y: py }, // slide left
                    { x: R - touch + half, y: py }, // slide right
                    { x: px, y: T - gapY - half }, // move up
                    { x: px, y: B + gapY + half }, // move down
                ]
                const inside = options.filter(
                    (o) =>
                        o.x - half >= m &&
                        o.x + half <= cw - m &&
                        o.y - half >= m &&
                        o.y + half <= ch - m
                )
                const pool = inside.length ? inside : options
                if (i % 2 === 1) pool.reverse() // ties go left for even tiles, right for odd ones
                pool.sort(
                    (a, b) =>
                        Math.hypot(a.x - px, a.y - py) -
                        Math.hypot(b.x - px, b.y - py)
                )
                px = pool[0].x
                py = pool[0].y
            }
            x = (px / cw) * 100
            y = (py / ch) * 100
        }
        return { x, y }
    })
    const sideFor = (i: number) =>
        chipSide === "auto"
            ? pos[i] && pos[i].y < 50
                ? "bottom"
                : "top"
            : chipSide

    // Floating motion: every tile drifts on its own phase and speed
    const apply = React.useCallback((t: number, still: boolean) => {
        const p = propsRef.current
        const its = p.items || []
        for (let i = 0; i < its.length; i++) {
            const el = itemRefs.current[i]
            if (!el) continue
            const c = calm.current[i] === undefined ? 1 : calm.current[i]
            const amp = still ? 0 : p.floatAmount * c
            const sw = still ? 0 : p.sway * c
            const sp = p.floatSpeed * (0.8 + ((i * 37) % 5) / 10)
            const ph = i * 2.399963
            const dx = amp * Math.sin(t * sp * 0.7 + ph)
            const dy = amp * Math.cos(t * sp * 0.9 + ph * 1.7)
            const rot =
                (its[i].rotation || 0) + sw * Math.sin(t * sp * 0.8 + ph * 2.3)
            el.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(var(--ft-k, 1))`
        }
    }, [])

    React.useLayoutEffect(() => {
        apply(timeRef.current, !animate)
    })

    // Animation loop: paused while offscreen, off on the canvas / static render / reduced motion
    React.useEffect(() => {
        if (!animate) return
        const el = containerRef.current
        let raf = 0
        let last = performance.now()
        let running = false

        const tick = (now: number) => {
            if (!running) return
            const dt = Math.min(64, now - last) / 1000
            last = now
            timeRef.current += dt
            // The open tile settles down so its chip stays still and readable
            const o = openRef.current
            const m = (propsRef.current.items || []).length
            for (let i = 0; i < m; i++) {
                const cur = calm.current[i] === undefined ? 1 : calm.current[i]
                calm.current[i] =
                    cur + ((o === i ? 0 : 1) - cur) * (1 - Math.exp(-6 * dt))
            }
            apply(timeRef.current, false)
            raf = requestAnimationFrame(tick)
        }
        const start = () => {
            if (running) return
            running = true
            last = performance.now()
            raf = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(raf)
        }

        let io: IntersectionObserver | undefined
        if (el && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    if (entry.isIntersecting) start()
                    else stop()
                },
                { rootMargin: "100px" }
            )
            io.observe(el)
        } else {
            start()
        }
        return () => {
            if (io) io.disconnect()
            running = false
            cancelAnimationFrame(raf)
        }
    }, [animate, apply])

    // Escape or a click/tap anywhere else closes the open chip
    React.useEffect(() => {
        if (open === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(null)
        }
        const onDown = (e: PointerEvent) => {
            const el = itemRefs.current[open]
            if (el && !el.contains(e.target as Node)) setOpen(null)
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onDown)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onDown)
        }
    }, [open])

    // Keep a chip inside the frame when its tile sits near the left or right edge
    React.useLayoutEffect(() => {
        setShift(0)
        if (open === null || isCanvas) return
        const chip = chipRefs.current[open]
        const tile = tileRefs.current[open]
        const box = containerRef.current
        if (!chip || !tile || !box) return
        const side =
            chipSide === "auto"
                ? pos[open] && pos[open].y < 50
                    ? "bottom"
                    : "top"
                : chipSide
        if (side === "left" || side === "right") return
        const k =
            parseFloat(getComputedStyle(box).getPropertyValue("--ft-k")) || 1
        const tr = tile.getBoundingClientRect()
        const br = box.getBoundingClientRect()
        const cx = tr.left + tr.width / 2
        const half = (chip.offsetWidth * k) / 2
        const pad = 8
        let sx = 0
        if (cx - half < br.left + pad) sx = br.left + pad - (cx - half)
        else if (cx + half > br.right - pad) sx = br.right - pad - (cx + half)
        setShift(sx / k)
    }, [open])

    const canvasScale = !autoScale
        ? 1
        : canvasDevice === "tablet"
          ? tabletScale
          : canvasDevice === "phone"
            ? phoneScale
            : 1

    // Scale per screen width in CSS, so there is no flash on load
    const css =
        `.${cls}{--ft-k:1}` +
        (autoScale && !isCanvas
            ? `@media (max-width:${tabletMaxWidth}px){.${cls}{--ft-k:${tabletScale}}}` +
              `@media (max-width:${phoneMaxWidth}px){.${cls}{--ft-k:${phoneScale}}}`
            : "") +
        (titleAlign && titleAlign !== "layer"
            ? `.${cls} .ft-title,.${cls} .ft-title *{text-align:${titleAlign} !important}`
            : "") +
        `.${cls} .ft-tile{transition:transform .25s cubic-bezier(.3,1.4,.5,1)}` +
        `.${cls} .ft-tile:hover{transform:scale(1.07)}` +
        `.${cls} .ft-tile:active{transform:scale(.96)}` +
        `.${cls} .ft-tile:focus-visible,.${cls} a:focus-visible{outline:2px solid #0A84FF;outline-offset:3px}` +
        `@media (prefers-reduced-motion:reduce){.${cls} .ft-tile{transition:none}}`

    if (n === 0) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#888",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                }}
            >
                Add tiles in the properties panel
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className={cls}
            role="group"
            aria-label={ariaLabel || "Floating tiles"}
            style={
                {
                    ...style,
                    position: "relative",
                    overflow: clip ? "hidden" : "visible",
                    ...(isCanvas ? { ["--ft-k" as any]: canvasScale } : {}),
                } as React.CSSProperties
            }
        >
            <style>{css}</style>
            {showTitle ? (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        transform: `translateY(-50%)${scaleTitle ? " scale(var(--ft-k, 1))" : ""}`,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                >
                    <div
                        ref={titleRef}
                        className="ft-title"
                        style={{
                            flex: "0 0 auto",
                            width: "max-content",
                            // wraps at "Title max W", but never narrower than the longest word,
                            // so big words can't spill out to one side
                            maxWidth: `${titleMaxWidth}%`,
                            minWidth: "min-content",
                            textAlign:
                                titleAlign && titleAlign !== "layer"
                                    ? titleAlign
                                    : undefined,
                        }}
                    >
                        {titleLayer && React.Children.count(titleLayer) > 0
                            ? titleLayer
                            : React.createElement(
                                  titleTag || "h2",
                                  {
                                      style: {
                                          margin: 0,
                                          padding: 0,
                                          whiteSpace: "pre-wrap",
                                          color: titleColor,
                                          ...titleFont,
                                      },
                                  },
                                  titleText
                              )}
                    </div>
                </div>
            ) : null}
            {list.map((t, i) => {
                const size = Math.max(16, t.size || 88)
                const color = t.color || PALETTE[i % PALETTE.length]
                const isOpen = isCanvas ? previewOpen : open === i
                const side = sideFor(i)
                const dist = size / 2 + chipGap
                const sx = open === i && !isCanvas ? shift : 0
                const href = normalizeLink(t.link)
                const label = t.label || ""
                const chipId = `${cls}c${i}`

                const imageSrc =
                    typeof t.image === "string" ? t.image : t.image?.src
                const imageSet =
                    typeof t.image === "string" ? undefined : t.image?.srcSet

                const placement: Record<string, string> = {
                    top: `translate(calc(-50% + ${sx}px), calc(-100% - ${dist}px))`,
                    bottom: `translate(calc(-50% + ${sx}px), ${dist}px)`,
                    left: `translate(calc(-100% - ${dist}px), -50%)`,
                    right: `translate(${dist}px, -50%)`,
                }
                const origin: Record<string, string> = {
                    top: "50% 100%",
                    bottom: "50% 0%",
                    left: "100% 50%",
                    right: "0% 50%",
                }

                const chipStyle: React.CSSProperties = {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "block",
                    width: "max-content",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    padding: `${chipPadY}px ${chipPadX}px`,
                    borderRadius: chipRadius,
                    background: chipFollowsTile ? color : chipBackground,
                    color: chipColor,
                    boxShadow: chipShadow,
                    textDecoration: "none",
                    transform: `${placement[side]} scale(${isOpen ? 1 : 0.6})`,
                    transformOrigin: origin[side],
                    opacity: isOpen ? 1 : 0,
                    visibility: isOpen ? "visible" : "hidden",
                    pointerEvents: isOpen && href ? "auto" : "none",
                    transition: animate
                        ? `transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 160ms ease, visibility 0s linear ${
                              isOpen ? "0s" : "260ms"
                          }`
                        : "none",
                    ...font,
                }

                return (
                    <div
                        key={i}
                        ref={(el) => {
                            itemRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            left: `${pos[i].x}%`,
                            top: `${pos[i].y}%`,
                            width: 0,
                            height: 0,
                            zIndex: isOpen ? 20 : 1,
                            willChange: "transform",
                        }}
                    >
                        <button
                            type="button"
                            className="ft-tile"
                            ref={(el) => {
                                tileRefs.current[i] = el
                            }}
                            aria-expanded={isOpen}
                            aria-controls={chipId}
                            aria-label={label || "Tile"}
                            onClick={() => setOpen((o) => (o === i ? null : i))}
                            style={{
                                position: "absolute",
                                left: -size / 2,
                                top: -size / 2,
                                width: size,
                                height: size,
                                margin: 0,
                                padding: 0,
                                border: "none",
                                borderRadius: Math.min(radius, size / 2),
                                background: color,
                                boxShadow: tileShadow,
                                overflow: "hidden",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#1A1A1A",
                                fontFamily: "Inter, sans-serif",
                                fontSize: size * 0.4,
                                appearance: "none",
                                WebkitAppearance: "none",
                            }}
                        >
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    srcSet={imageSet}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : (
                                t.icon || null
                            )}
                        </button>

                        {label ? (
                            href ? (
                                <a
                                    id={chipId}
                                    ref={(el) => {
                                        chipRefs.current[i] = el
                                    }}
                                    href={href}
                                    target={openNewTab ? "_blank" : undefined}
                                    rel={
                                        openNewTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    tabIndex={isOpen ? 0 : -1}
                                    aria-hidden={!isOpen}
                                    style={chipStyle}
                                >
                                    {label}
                                </a>
                            ) : (
                                <div
                                    id={chipId}
                                    ref={(el) => {
                                        chipRefs.current[i] = el
                                    }}
                                    aria-hidden={!isOpen}
                                    style={chipStyle}
                                >
                                    {label}
                                </div>
                            )
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

FloatTiles.defaultProps = {
    items: [
        { label: "B2B", size: 96 },
        { label: "B2C", size: 80 },
        { label: "Startups", size: 104 },
    ],
    showTitle: false,
    titleText: "Showcase your best work",
    titleColor: "#1A1A1A",
    titleTag: "h2",
    titleMaxWidth: 60,
    titleAlign: "center",
    scaleTitle: false,
    titleTouch: 20,
    titleClearance: 16,
    radius: 24,
    tileShadow: "0px 10px 24px rgba(0,0,0,0.10)",
    chipSide: "auto",
    chipGap: 12,
    chipBackground: "#FFFFFF",
    chipColor: "#2B2B2B",
    chipFollowsTile: false,
    chipRadius: 999,
    chipPadX: 18,
    chipPadY: 9,
    chipShadow: "0px 8px 20px rgba(0,0,0,0.12)",
    floatAmount: 14,
    floatSpeed: 1,
    sway: 4,
    autoScale: true,
    tabletScale: 0.6,
    phoneScale: 0.4,
    tabletMaxWidth: 1199,
    phoneMaxWidth: 809,
    canvasDevice: "desktop",
    previewOpen: false,
    clip: false,
    openNewTab: false,
    ariaLabel: "Floating tiles",
}

addPropertyControls(FloatTiles, {
    items: {
        type: ControlType.Array,
        title: "Tiles",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Chip text",
                    placeholder: "Shown on click",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Makes the chip a link.",
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    defaultValue: 88,
                    min: 24,
                    max: 400,
                    step: 2,
                    unit: "px",
                },
                color: { type: ControlType.Color, title: "Color" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                icon: {
                    type: ControlType.String,
                    title: "Icon / letter",
                    placeholder: "Optional",
                },
                rotation: {
                    type: ControlType.Number,
                    title: "Tilt",
                    defaultValue: 0,
                    min: -45,
                    max: 45,
                    step: 1,
                    unit: "°",
                },
                manual: {
                    type: ControlType.Boolean,
                    title: "Position",
                    enabledTitle: "Manual",
                    disabledTitle: "Auto",
                    defaultValue: false,
                },
                x: {
                    type: ControlType.Number,
                    title: "X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    hidden: (p: any) => !p.manual,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    hidden: (p: any) => !p.manual,
                },
            },
        },
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Center title",
        defaultValue: false,
        description:
            "Adds a title in the middle. Auto-placed tiles move out of its way.",
    },
    titleLayer: {
        type: ControlType.ComponentInstance,
        title: "Title layer",
        description:
            "Wrap a Text layer in a Stack, then connect that Stack here (use the dropdown or drag this control's connector to it). Keeps your local text style.",
        hidden: (p: any) => !p.showTitle,
    },
    titleText: {
        type: ControlType.String,
        title: "Title text",
        displayTextArea: true,
        hidden: (p: any) => !p.showTitle || !!p.titleLayer,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "48px",
        hidden: (p: any) => !p.showTitle || !!p.titleLayer,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title color",
        hidden: (p: any) => !p.showTitle || !!p.titleLayer,
    },
    titleTag: {
        type: ControlType.Enum,
        title: "Title tag",
        options: ["h1", "h2", "h3", "p"],
        optionTitles: ["H1", "H2", "H3", "Paragraph"],
        hidden: (p: any) => !p.showTitle || !!p.titleLayer,
    },
    titleMaxWidth: {
        type: ControlType.Number,
        title: "Title max W",
        min: 20,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: any) => !p.showTitle,
    },
    titleAlign: {
        type: ControlType.Enum,
        title: "Title align",
        options: ["center", "left", "right", "layer"],
        optionTitles: ["Center", "Left", "Right", "As in layer"],
        description:
            "Also applies to a connected text layer. 'As in layer' keeps the layer's own alignment.",
        hidden: (p: any) => !p.showTitle,
    },
    scaleTitle: {
        type: ControlType.Boolean,
        title: "Scale title",
        enabledTitle: "With tiles",
        disabledTitle: "Fixed",
        hidden: (p: any) => !p.showTitle,
    },
    titleTouch: {
        type: ControlType.Number,
        title: "Side overlap",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        description:
            "How far a tile may overlap the title's left or right end. Tiles never cover its middle, top or bottom.",
        hidden: (p: any) => !p.showTitle,
    },
    titleClearance: {
        type: ControlType.Number,
        title: "Title gap",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        description: "Space kept above and below the title.",
        hidden: (p: any) => !p.showTitle,
    },
    radius: {
        type: ControlType.Number,
        title: "Tile radius",
        min: 0,
        max: 200,
        step: 1,
        description: "Corner roundness. A large value makes circles.",
    },
    tileShadow: { type: ControlType.BoxShadow, title: "Tile shadow" },
    chipSide: {
        type: ControlType.Enum,
        title: "Chip side",
        options: ["auto", "top", "bottom", "left", "right"],
        optionTitles: ["Auto", "Top", "Bottom", "Left", "Right"],
    },
    chipGap: {
        type: ControlType.Number,
        title: "Chip gap",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    chipBackground: {
        type: ControlType.Color,
        title: "Chip fill",
        hidden: (p: any) => p.chipFollowsTile,
    },
    chipFollowsTile: {
        type: ControlType.Boolean,
        title: "Chip color",
        enabledTitle: "Match tile",
        disabledTitle: "Custom",
    },
    chipColor: { type: ControlType.Color, title: "Chip text" },
    font: {
        type: ControlType.Font,
        title: "Chip font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "16px",
    },
    chipPadX: {
        type: ControlType.Number,
        title: "Chip pad X",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    chipPadY: {
        type: ControlType.Number,
        title: "Chip pad Y",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    chipRadius: {
        type: ControlType.Number,
        title: "Chip radius",
        min: 0,
        max: 999,
        step: 1,
    },
    chipShadow: { type: ControlType.BoxShadow, title: "Chip shadow" },
    floatAmount: {
        type: ControlType.Number,
        title: "Float",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        description: "How far each tile drifts. 0 = no floating.",
    },
    floatSpeed: {
        type: ControlType.Number,
        title: "Float speed",
        min: 0.1,
        max: 4,
        step: 0.1,
    },
    sway: {
        type: ControlType.Number,
        title: "Sway",
        min: 0,
        max: 20,
        step: 0.5,
        unit: "°",
    },
    autoScale: {
        type: ControlType.Boolean,
        title: "Shrink on tablet / phone",
        defaultValue: true,
    },
    tabletScale: {
        type: ControlType.Number,
        title: "Tablet scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    phoneScale: {
        type: ControlType.Number,
        title: "Phone scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoScale,
    },
    tabletMaxWidth: {
        type: ControlType.Number,
        title: "Tablet max W",
        min: 400,
        max: 2000,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.autoScale,
    },
    phoneMaxWidth: {
        type: ControlType.Number,
        title: "Phone max W",
        min: 300,
        max: 1200,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.autoScale,
    },
    canvasDevice: {
        type: ControlType.Enum,
        title: "Canvas preview",
        options: ["desktop", "tablet", "phone"],
        optionTitles: ["Desktop", "Tablet", "Phone"],
        displaySegmentedControl: true,
        description:
            "Shows the scaled size on the canvas only. The live site uses the screen width.",
        hidden: (p: any) => !p.autoScale,
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Show chips on canvas",
        defaultValue: false,
        description:
            "Opens every chip on the canvas so you can style them. No effect on the live site.",
    },
    clip: {
        type: ControlType.Boolean,
        title: "Clip content",
        defaultValue: false,
        description: "On = tiles and chips are cut off at the frame edge.",
    },
    openNewTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Accessible label",
        defaultValue: "Floating tiles",
    },
})
