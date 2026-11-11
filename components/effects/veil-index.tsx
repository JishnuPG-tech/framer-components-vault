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


type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type MenuItem = {
    number: string
    label: string
    meta: string
    link: string
    accent: string
    image?: ResponsiveImage
}

type Palette = {
    background: string
    foreground: string
    muted: string
    line: string
    panel: string
    cursor: string
}

type LayoutSettings = {
    padding: number
    rowHeight: number
    radius: number
    mediaWidth: number
    mediaRadius: number
    compactAt: number
}

type MotionSettings = {
    enabled: boolean
    follow: number
    tilt: number
    lift: number
    idle: boolean
    duration: number
}

type ImageSettings = {
    fit: "cover" | "contain"
    overlay: number
    grain: number
    showSlices: boolean
    sliceCount: number
}

type CursorSettings = {
    show: boolean
    size: number
    label: string
}

export interface VeilIndexProps {
    items: MenuItem[]
    activeIndex: number
    brand: string
    header: string
    footer: string
    displayFont: React.CSSProperties
    metaFont: React.CSSProperties
    palette: Palette
    layout: LayoutSettings
    motion: MotionSettings
    image: ImageSettings
    cursor: CursorSettings
    openInNewTab: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

const defaultItems: MenuItem[] = [
    {
        number: "01",
        label: "Projects",
        meta: "SELECTED WORK / 24—26",
        link: "#projects",
        accent: "#D8FF57",
    },
    {
        number: "02",
        label: "Studio",
        meta: "PROFILE & CAPABILITIES",
        link: "#studio",
        accent: "#FF785A",
    },
    {
        number: "03",
        label: "Journal",
        meta: "NOTES FROM THE FIELD",
        link: "#journal",
        accent: "#8AA7FF",
    },
    {
        number: "04",
        label: "Contact",
        meta: "START A CONVERSATION",
        link: "#contact",
        accent: "#F0B8FF",
    },
]

const defaults: VeilIndexProps = {
    items: defaultItems,
    activeIndex: 0,
    brand: "V/INDEX",
    header: "INDEPENDENT CREATIVE STUDIO",
    footer: "SEATTLE — OPEN FOR SELECT PROJECTS",
    displayFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.065em",
        lineHeight: "0.86em",
    },
    metaFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 500,
        letterSpacing: "0.08em",
        lineHeight: "1em",
    },
    palette: {
        background: "#0A0A0A",
        foreground: "#F1EFE8",
        muted: "#777771",
        line: "rgba(241,239,232,0.16)",
        panel: "#141412",
        cursor: "#F1EFE8",
    },
    layout: {
        padding: 34,
        rowHeight: 112,
        radius: 28,
        mediaWidth: 42,
        mediaRadius: 22,
        compactAt: 620,
    },
    motion: {
        enabled: true,
        follow: 0.14,
        tilt: 7,
        lift: 9,
        idle: true,
        duration: 520,
    },
    image: {
        fit: "cover",
        overlay: 28,
        grain: 7,
        showSlices: true,
        sliceCount: 6,
    },
    cursor: {
        show: true,
        size: 74,
        label: "OPEN",
    },
    openInNewTab: false,
    ariaLabel: "Primary navigation",
    style: {},
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function withAlpha(color: string, opacity: number) {
    const amount = clamp(opacity, 0, 1)
    const shortHex = /^#([0-9a-f]{3})$/i.exec(color)
    const longHex = /^#([0-9a-f]{6})$/i.exec(color)
    const base = shortHex
        ? `#${shortHex[1]
              .split("")
              .map((character) => character + character)
              .join("")}`
        : longHex
          ? color
          : null
    if (base) {
        return `${base}${Math.round(amount * 255)
            .toString(16)
            .padStart(2, "0")}`
    }
    return `color-mix(in srgb, ${color} ${amount * 100}%, transparent)`
}

function safeItems(items: MenuItem[] | undefined) {
    return items && items.length > 0 ? items.slice(0, 6) : defaultItems
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [])

    return reduced
}

function Grain({ opacity }: { opacity: number }) {
    if (opacity <= 0) return null
    const noise = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".86" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".72"/></svg>`
    )

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                opacity: opacity / 100,
                mixBlendMode: "soft-light",
                backgroundImage: `url("data:image/svg+xml,${noise}")`,
                backgroundSize: "180px 180px",
                zIndex: 8,
            }}
        />
    )
}

/**
 * VEIL INDEX
 * Editorial navigation with a responsive image veil and magnetic pointer plane.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 720
 */
export default function VeilIndex(rawProps: VeilIndexProps) {
    const props = { ...defaults, ...rawProps }
    const items = safeItems(props.items)
    const palette = { ...defaults.palette, ...props.palette }
    const layout = { ...defaults.layout, ...props.layout }
    const motion = { ...defaults.motion, ...props.motion }
    const image = { ...defaults.image, ...props.image }
    const cursor = { ...defaults.cursor, ...props.cursor }
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const canAnimate = motion.enabled && !staticRenderer && !reducedMotion
    const initialIndex = clamp(
        Math.round(props.activeIndex || 0),
        0,
        items.length - 1
    )
    const [activeIndex, setActiveIndex] = React.useState(initialIndex)
    const [pointerVisible, setPointerVisible] = React.useState(false)
    const rootRef = React.useRef<HTMLElement | null>(null)
    const rowRefs = React.useRef<Array<HTMLAnchorElement | null>>([])
    const frameRef = React.useRef<number | null>(null)
    const pose = React.useRef({
        x: 0.69,
        y: 0.5,
        tx: 0.69,
        ty: 0.5,
    })

    React.useEffect(() => {
        setActiveIndex(initialIndex)
    }, [initialIndex, items.length])

    const writePose = React.useCallback((x: number, y: number) => {
        const node = rootRef.current
        if (!node) return
        const nx = (x - 0.5) * 2
        const ny = (y - 0.5) * 2
        node.style.setProperty("--veil-x", `${x * 100}%`)
        node.style.setProperty("--veil-y", `${y * 100}%`)
        node.style.setProperty("--veil-nx", String(nx))
        node.style.setProperty("--veil-ny", String(ny))
    }, [])

    const animatePose = React.useCallback(() => {
        const state = pose.current
        state.x += (state.tx - state.x) * clamp(motion.follow, 0.04, 0.4)
        state.y += (state.ty - state.y) * clamp(motion.follow, 0.04, 0.4)
        writePose(state.x, state.y)

        const moving =
            Math.abs(state.tx - state.x) + Math.abs(state.ty - state.y) > 0.001
        if (moving) {
            frameRef.current = requestAnimationFrame(animatePose)
        } else {
            frameRef.current = null
        }
    }, [motion.follow, writePose])

    const requestPoseFrame = React.useCallback(() => {
        if (!canAnimate || frameRef.current !== null) return
        frameRef.current = requestAnimationFrame(animatePose)
    }, [animatePose, canAnimate])

    React.useEffect(() => {
        if (!canAnimate) {
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
            frameRef.current = null
            pose.current = { x: 0.69, y: 0.5, tx: 0.69, ty: 0.5 }
            writePose(0.69, 0.5)
        }
        return () => {
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }
    }, [canAnimate, writePose])

    React.useEffect(() => {
        if (!canAnimate || typeof document === "undefined") return
        const onVisibility = () => {
            if (document.hidden && frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            } else if (!document.hidden) {
                requestPoseFrame()
            }
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () =>
            document.removeEventListener("visibilitychange", onVisibility)
    }, [canAnimate, requestPoseFrame])

    const handlePointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            if (!canAnimate || event.pointerType === "touch") return
            const rect = event.currentTarget.getBoundingClientRect()
            pose.current.tx = clamp(
                (event.clientX - rect.left) / rect.width,
                0,
                1
            )
            pose.current.ty = clamp(
                (event.clientY - rect.top) / rect.height,
                0,
                1
            )
            requestPoseFrame()
        },
        [canAnimate, requestPoseFrame]
    )

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLAnchorElement>, index: number) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
                return
            event.preventDefault()
            let next = index
            if (event.key === "ArrowDown") next = (index + 1) % items.length
            if (event.key === "ArrowUp")
                next = (index - 1 + items.length) % items.length
            if (event.key === "Home") next = 0
            if (event.key === "End") next = items.length - 1
            setActiveIndex(next)
            rowRefs.current[next]?.focus()
        },
        [items.length]
    )

    const active = items[activeIndex] || items[0]
    const duration = canAnimate ? clamp(motion.duration, 120, 1200) : 0
    const sliceCount = clamp(Math.round(image.sliceCount), 2, 12)
    const target = props.openInNewTab ? "_blank" : undefined
    const rel = props.openInNewTab ? "noreferrer noopener" : undefined
    const rootVariables = {
        "--veil-x": "69%",
        "--veil-y": "50%",
        "--veil-nx": "0.38",
        "--veil-ny": "0",
        "--veil-accent": active.accent,
        "--veil-duration": `${duration}ms`,
    } as React.CSSProperties

    const mediaBackground = `radial-gradient(circle at var(--veil-x) var(--veil-y), ${active.accent} 0%, ${active.accent} 13%, transparent 38%), radial-gradient(circle at 16% 16%, ${withAlpha(active.accent, 0.6)} 0%, transparent 38%), linear-gradient(145deg, ${palette.panel} 8%, ${withAlpha(active.accent, 0.34)} 54%, #050505 100%)`

    return (
        <nav
            ref={rootRef}
            aria-label={props.ariaLabel || "Primary navigation"}
            onPointerMove={handlePointerMove}
            onPointerEnter={(event) => {
                if (event.pointerType !== "touch") setPointerVisible(true)
            }}
            onPointerLeave={() => {
                setPointerVisible(false)
                pose.current.tx = 0.69
                pose.current.ty = 0.5
                requestPoseFrame()
            }}
            style={{
                ...rootVariables,
                position: "relative",
                display: "grid",
                gridTemplateRows: "auto minmax(0, 1fr) auto",
                width: 1040,
                height: 720,
                maxWidth: "100%",
                overflow: "hidden",
                isolation: "isolate",
                containerType: "inline-size",
                containerName: "veil-index",
                padding: layout.padding,
                borderRadius: layout.radius,
                color: palette.foreground,
                background: palette.background,
                border: `1px solid ${palette.line}`,
                boxSizing: "border-box",
                WebkitFontSmoothing: "antialiased",
                touchAction: "pan-y",
                ...props.style,
            }}
        >
            <style>{`
                @keyframes veil-index-drift {
                    0%, 100% { transform: translate3d(-3%, -2%, 0) rotate(0deg); }
                    50% { transform: translate3d(3%, 2%, 0) rotate(7deg); }
                }
                .veil-index-row:focus-visible {
                    outline: 2px solid var(--veil-accent);
                    outline-offset: -2px;
                }
                .veil-index-row:focus-visible .veil-index-row-label::after {
                    transform: scaleX(1) !important;
                }
                @media (pointer: coarse) {
                    .veil-index-cursor { display: none !important; }
                }
                @container veil-index (max-width: ${layout.compactAt}px) {
                    .veil-index-header-center { display: none !important; }
                    .veil-index-stage { grid-template-columns: 1fr !important; }
                    .veil-index-list { z-index: 3; align-self: end; }
                    .veil-index-row { min-height: ${Math.max(76, layout.rowHeight * 0.78)}px !important; }
                    .veil-index-row-label { font-size: clamp(48px, 16cqw, 82px) !important; }
                    .veil-index-row-meta { display: none !important; }
                    .veil-index-media {
                        position: absolute !important;
                        inset: 15% 4% 28% 22% !important;
                        width: auto !important;
                        opacity: .58;
                        transform: rotate(-4deg) !important;
                    }
                    .veil-index-orbit { opacity: .58 !important; }
                    .veil-index-footer-right { display: none !important; }
                }
            `}</style>

            <header
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: 18,
                    minHeight: 28,
                    paddingBottom: 20,
                    borderBottom: `1px solid ${palette.line}`,
                    position: "relative",
                    zIndex: 12,
                    ...props.metaFont,
                    fontSize: 10,
                    color: palette.muted,
                    textTransform: "uppercase",
                }}
            >
                <span style={{ color: palette.foreground }}>{props.brand}</span>
                <span className="veil-index-header-center">{props.header}</span>
                <span style={{ justifySelf: "end" }}>
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(items.length).padStart(2, "0")}
                </span>
            </header>

            <div
                className="veil-index-stage"
                style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: `${100 - layout.mediaWidth}% ${layout.mediaWidth}%`,
                    gap: clamp(layout.padding * 0.7, 16, 44),
                    minHeight: 0,
                    padding: `${clamp(layout.padding * 0.72, 20, 34)}px 0`,
                }}
            >
                <div
                    className="veil-index-list"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minWidth: 0,
                    }}
                >
                    {items.map((item, index) => {
                        const selected = index === activeIndex
                        return (
                            <a
                                key={`${item.number}-${item.label}-${index}`}
                                ref={(node) => {
                                    rowRefs.current[index] = node
                                }}
                                className="veil-index-row"
                                href={item.link || "#"}
                                target={target}
                                rel={rel}
                                aria-current={selected ? "page" : undefined}
                                onPointerEnter={() => setActiveIndex(index)}
                                onFocus={() => setActiveIndex(index)}
                                onKeyDown={(event) =>
                                    handleKeyDown(event, index)
                                }
                                style={{
                                    position: "relative",
                                    display: "grid",
                                    gridTemplateColumns:
                                        "34px minmax(0, 1fr) auto",
                                    alignItems: "center",
                                    gap: 14,
                                    minHeight: layout.rowHeight,
                                    color: palette.foreground,
                                    textDecoration: "none",
                                    borderBottom: `1px solid ${palette.line}`,
                                    borderRadius: selected ? 2 : 0,
                                    transform: selected
                                        ? `translate3d(${canAnimate ? motion.lift : 0}px, 0, 0)`
                                        : "translate3d(0,0,0)",
                                    opacity: selected ? 1 : 0.52,
                                    transition: `transform var(--veil-duration) cubic-bezier(.2,.75,.2,1), opacity var(--veil-duration) ease`,
                                    willChange: canAnimate
                                        ? "transform"
                                        : undefined,
                                }}
                            >
                                <span
                                    style={{
                                        alignSelf: "start",
                                        paddingTop: 20,
                                        ...props.metaFont,
                                        fontSize: 9,
                                        letterSpacing: "0.08em",
                                        color: selected
                                            ? item.accent
                                            : palette.muted,
                                        transition: `color var(--veil-duration) ease`,
                                    }}
                                >
                                    {item.number ||
                                        String(index + 1).padStart(2, "0")}
                                </span>
                                <span
                                    className="veil-index-row-label"
                                    style={{
                                        position: "relative",
                                        width: "max-content",
                                        maxWidth: "100%",
                                        ...props.displayFont,
                                        fontSize: "clamp(56px, 7.7cqw, 92px)",
                                        whiteSpace: "nowrap",
                                        textOverflow: "clip",
                                    }}
                                >
                                    {item.label}
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: -6,
                                            height: 2,
                                            background: item.accent,
                                            transform: selected
                                                ? "scaleX(1)"
                                                : "scaleX(0)",
                                            transformOrigin: "left center",
                                            transition: `transform var(--veil-duration) cubic-bezier(.2,.75,.2,1)`,
                                        }}
                                    />
                                </span>
                                <span
                                    className="veil-index-row-meta"
                                    style={{
                                        justifySelf: "end",
                                        textAlign: "right",
                                        ...props.metaFont,
                                        fontSize: 8,
                                        color: selected
                                            ? palette.foreground
                                            : palette.muted,
                                        transition: `color var(--veil-duration) ease`,
                                    }}
                                >
                                    {item.meta}
                                </span>
                            </a>
                        )
                    })}
                </div>

                <div
                    className="veil-index-media"
                    aria-hidden="true"
                    style={{
                        position: "relative",
                        alignSelf: "center",
                        width: "100%",
                        aspectRatio: "0.76",
                        overflow: "hidden",
                        borderRadius: layout.mediaRadius,
                        border: `1px solid ${palette.line}`,
                        background: mediaBackground,
                        boxShadow: `0 34px 80px ${active.accent}18, inset 0 0 0 1px rgba(255,255,255,.035)`,
                        transform: canAnimate
                            ? `perspective(900px) rotateX(calc(var(--veil-ny) * ${-motion.tilt}deg)) rotateY(calc(var(--veil-nx) * ${motion.tilt}deg))`
                            : "none",
                        transition: `background var(--veil-duration) ease, box-shadow var(--veil-duration) ease`,
                        willChange: canAnimate ? "transform" : undefined,
                        zIndex: 2,
                    }}
                >
                    {active.image?.src ? (
                        <img
                            key={active.image.src}
                            src={active.image.src}
                            srcSet={active.image.srcSet}
                            alt=""
                            draggable={false}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: image.fit,
                                opacity: 1 - image.overlay / 100,
                                transform: canAnimate
                                    ? "scale(1.08) translate3d(calc(var(--veil-nx) * -2.5%), calc(var(--veil-ny) * -2.5%), 0)"
                                    : "scale(1.04)",
                                transition: `opacity var(--veil-duration) ease`,
                                willChange: canAnimate
                                    ? "transform"
                                    : undefined,
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                width: "84%",
                                aspectRatio: "1",
                                left: "8%",
                                top: "8%",
                                borderRadius: "50%",
                                border: "1px solid rgba(255,255,255,.35)",
                                boxShadow:
                                    "0 0 0 22px rgba(255,255,255,.035), 0 0 0 68px rgba(255,255,255,.025), 0 0 90px rgba(255,255,255,.12)",
                                transform: canAnimate
                                    ? "translate3d(calc(var(--veil-nx) * 5%), calc(var(--veil-ny) * 5%), 0)"
                                    : "none",
                                animation:
                                    canAnimate && motion.idle
                                        ? "veil-index-drift 11s ease-in-out infinite"
                                        : undefined,
                            }}
                        />
                    )}

                    {image.showSlices && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "grid",
                                gridTemplateColumns: `repeat(${sliceCount}, 1fr)`,
                                mixBlendMode: "overlay",
                            }}
                        >
                            {Array.from({ length: sliceCount }).map(
                                (_, index) => {
                                    const offset =
                                        (index - (sliceCount - 1) / 2) * 0.8
                                    return (
                                        <span
                                            key={index}
                                            style={{
                                                borderLeft:
                                                    index === 0
                                                        ? undefined
                                                        : "1px solid rgba(255,255,255,.15)",
                                                transform: canAnimate
                                                    ? `translate3d(0, calc(var(--veil-ny) * ${offset * 8}px), 0)`
                                                    : "none",
                                            }}
                                        />
                                    )
                                }
                            )}
                        </div>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(180deg, transparent 28%, rgba(0,0,0,${
                                clamp(image.overlay, 0, 90) / 100
                            }) 100%)`,
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            inset: 20,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            ...props.metaFont,
                            fontSize: 9,
                            color: palette.foreground,
                        }}
                    >
                        <span style={{ alignSelf: "flex-end" }}>
                            {active.number}
                        </span>
                        <span style={{ maxWidth: 130 }}>{active.meta}</span>
                    </div>
                    <Grain opacity={image.grain} />
                </div>

                <div
                    className="veil-index-orbit"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: `${layout.mediaWidth * 0.28}%`,
                        top: "50%",
                        width: "34cqw",
                        aspectRatio: "1",
                        border: `1px solid ${palette.line}`,
                        borderRadius: "50%",
                        transform: "translate(50%, -50%)",
                        zIndex: 0,
                        pointerEvents: "none",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            inset: "22%",
                            border: `1px solid ${palette.line}`,
                            borderRadius: "50%",
                        }}
                    />
                </div>
            </div>

            <footer
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    minHeight: 26,
                    paddingTop: 18,
                    borderTop: `1px solid ${palette.line}`,
                    position: "relative",
                    zIndex: 12,
                    ...props.metaFont,
                    fontSize: 9,
                    color: palette.muted,
                }}
            >
                <span>{props.footer}</span>
                <span
                    className="veil-index-footer-right"
                    style={{ color: active.accent }}
                >
                    {active.label.toUpperCase()} ↗
                </span>
            </footer>

            {cursor.show && (
                <div
                    className="veil-index-cursor"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "var(--veil-x)",
                        top: "var(--veil-y)",
                        width: cursor.size,
                        height: cursor.size,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        border: `1px solid ${palette.cursor}`,
                        color: palette.cursor,
                        background: "rgba(10,10,10,.14)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)",
                        transform: `translate(-50%, -50%) scale(${pointerVisible && canAnimate ? 1 : 0})`,
                        opacity: pointerVisible && canAnimate ? 1 : 0,
                        transition: `transform 260ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease`,
                        pointerEvents: "none",
                        zIndex: 30,
                        ...props.metaFont,
                        fontSize: 8,
                        letterSpacing: "0.12em",
                        boxShadow: "0 10px 34px rgba(0,0,0,.28)",
                    }}
                >
                    {cursor.label}
                </div>
            )}

            <Grain opacity={image.grain * 0.42} />
        </nav>
    )
}

VeilIndex.defaultProps = defaults

addPropertyControls(VeilIndex, {
    items: {
        type: ControlType.Array,
        title: "Menu Items",
        maxCount: 6,
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Projects",
                },
                meta: {
                    type: ControlType.String,
                    title: "Meta",
                    defaultValue: "SELECTED WORK",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "#",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#D8FF57",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        description: "Up to six keyboard-accessible navigation destinations.",
    },
    activeIndex: {
        type: ControlType.Number,
        title: "Canvas Item",
        min: 0,
        max: 5,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
        description: "Zero-based item shown on the Canvas and in exports.",
    },
    brand: {
        type: ControlType.String,
        title: "Brand",
        defaultValue: defaults.brand,
    },
    header: {
        type: ControlType.String,
        title: "Header",
        defaultValue: defaults.header,
    },
    footer: {
        type: ControlType.String,
        title: "Footer",
        defaultValue: defaults.footer,
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display",
        defaultFontType: "sans-serif",
        controls: "extended",
        defaultValue: defaults.displayFont as any,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Utility",
        defaultFontType: "sans-serif",
        controls: "extended",
        defaultValue: defaults.metaFont as any,
    },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaults.palette.background,
            },
            foreground: {
                type: ControlType.Color,
                title: "Foreground",
                defaultValue: defaults.palette.foreground,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: defaults.palette.muted,
            },
            line: {
                type: ControlType.Color,
                title: "Lines",
                defaultValue: defaults.palette.line,
            },
            panel: {
                type: ControlType.Color,
                title: "Panel",
                defaultValue: defaults.palette.panel,
            },
            cursor: {
                type: ControlType.Color,
                title: "Cursor",
                defaultValue: defaults.palette.cursor,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 12,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.padding,
            },
            rowHeight: {
                type: ControlType.Number,
                title: "Row Height",
                min: 68,
                max: 180,
                unit: "px",
                defaultValue: defaults.layout.rowHeight,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.radius,
            },
            mediaWidth: {
                type: ControlType.Number,
                title: "Media Width",
                min: 28,
                max: 58,
                unit: "%",
                defaultValue: defaults.layout.mediaWidth,
            },
            mediaRadius: {
                type: ControlType.Number,
                title: "Media Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.mediaRadius,
            },
            compactAt: {
                type: ControlType.Number,
                title: "Compact At",
                min: 380,
                max: 900,
                unit: "px",
                defaultValue: defaults.layout.compactAt,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            follow: {
                type: ControlType.Number,
                title: "Follow",
                min: 0.04,
                max: 0.4,
                step: 0.01,
                defaultValue: defaults.motion.follow,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: 0,
                max: 18,
                unit: "deg",
                defaultValue: defaults.motion.tilt,
            },
            lift: {
                type: ControlType.Number,
                title: "Row Lift",
                min: 0,
                max: 28,
                unit: "px",
                defaultValue: defaults.motion.lift,
            },
            idle: {
                type: ControlType.Boolean,
                title: "Idle Drift",
                defaultValue: defaults.motion.idle,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 120,
                max: 1200,
                unit: "ms",
                step: 10,
                defaultValue: defaults.motion.duration,
            },
        },
        description:
            "Automatically becomes static on Canvas/export and honors reduced motion.",
    },
    image: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                displaySegmentedControl: true,
                defaultValue: defaults.image.fit,
            },
            overlay: {
                type: ControlType.Number,
                title: "Overlay",
                min: 0,
                max: 90,
                unit: "%",
                defaultValue: defaults.image.overlay,
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 30,
                unit: "%",
                defaultValue: defaults.image.grain,
            },
            showSlices: {
                type: ControlType.Boolean,
                title: "Slices",
                defaultValue: defaults.image.showSlices,
            },
            sliceCount: {
                type: ControlType.Number,
                title: "Slice Count",
                min: 2,
                max: 12,
                step: 1,
                displayStepper: true,
                defaultValue: defaults.image.sliceCount,
            },
        },
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: defaults.cursor.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 36,
                max: 160,
                unit: "px",
                defaultValue: defaults.cursor.size,
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: defaults.cursor.label,
            },
        },
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: defaults.openInNewTab,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: defaults.ariaLabel,
        description: "Accessible name announced for the navigation landmark.",
    },
})
