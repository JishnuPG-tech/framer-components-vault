/// ============================================================
// Gallery Grid — a filterable photo gallery with a fullscreen
// lightbox. Photos are entered in the panel (image / title /
// category / location). Filter buttons show only matching photos
// with a fade + reflow. The lightbox supports arrow-key navigation,
// Escape / click-outside to close, an optional caption with
// Maps/Instagram links, and a blurred backdrop.
//
// Standalone: no external CSS, custom code, or theme setup needed.
// The component never reads or writes DOM outside itself — the
// overlay is rendered into document.body via a portal and styles
// only its own elements.
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const KEYFRAMES = `
@keyframes amGgItem { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
`

// Turns "Playfair Display" into a Google Fonts URL slug.
const slug = (f: string) => f.trim().replace(/\s+/g, "+")
const idFor = (f: string) =>
    "am-gg-font-" + f.trim().toLowerCase().replace(/\s+/g, "-")

const toEm = (v: number) => `${(v / 100).toFixed(3)}em`
const ff = (f: string) => `'${f}', sans-serif`

// Loads whichever Google Fonts the user typed into the font controls.
// Two <link>s per family: one asking for the full weight range (works for
// variable/multi-weight families) and a plain one as a fallback, so a family
// that only ships a single weight (e.g. Bebas Neue) still loads.
function useAssets(fonts: string[]) {
    const key = fonts.filter(Boolean).join("|")
    useEffect(() => {
        if (typeof document === "undefined") return
        if (!document.getElementById("am-gg-keyframes")) {
            const st = document.createElement("style")
            st.id = "am-gg-keyframes"
            st.textContent = KEYFRAMES
            document.head.appendChild(st)
        }
        const families = Array.from(
            new Set(fonts.map((f) => (f || "").trim()).filter(Boolean))
        )
        families.forEach((fam) => {
            const base = idFor(fam)
            if (!document.getElementById(base + "-w")) {
                const l = document.createElement("link")
                l.id = base + "-w"
                l.rel = "stylesheet"
                l.href =
                    "https://fonts.googleapis.com/css2?family=" +
                    slug(fam) +
                    ":wght@100;200;300;400;500;600;700;800;900&display=swap"
                document.head.appendChild(l)
            }
            if (!document.getElementById(base)) {
                const l2 = document.createElement("link")
                l2.id = base
                l2.rel = "stylesheet"
                l2.href =
                    "https://fonts.googleapis.com/css2?family=" +
                    slug(fam) +
                    "&display=swap"
                document.head.appendChild(l2)
            }
        })
    }, [key])
}

// Theme resolution.
//   "dark" / "light" — the panel decides, nothing else is read.
//   "auto"           — follows a data-theme="light|dark" attribute on <html>
//                      or <body> if the site sets one (e.g. a theme toggle),
//                      otherwise falls back to the OS colour scheme.
function useTheme(mode: string) {
    const [autoDark, setAutoDark] = useState(true)
    useEffect(() => {
        if (mode !== "auto") return
        if (typeof document === "undefined") return
        let mq: MediaQueryList | null = null
        const read = () => {
            const attr =
                document.documentElement.getAttribute("data-theme") ||
                document.body.getAttribute("data-theme")
            if (attr) {
                setAutoDark(attr !== "light")
                return
            }
            if (typeof window !== "undefined" && window.matchMedia) {
                setAutoDark(
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                )
            }
        }
        read()
        const mo = new MutationObserver(read)
        mo.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        })
        mo.observe(document.body, {
            attributes: true,
            attributeFilter: ["data-theme"],
        })
        if (typeof window !== "undefined" && window.matchMedia) {
            mq = window.matchMedia("(prefers-color-scheme: dark)")
            if (mq.addEventListener) mq.addEventListener("change", read)
        }
        return () => {
            mo.disconnect()
            if (mq && mq.removeEventListener)
                mq.removeEventListener("change", read)
        }
    }, [mode])
    if (mode === "dark") return true
    if (mode === "light") return false
    return autoDark
}

function CloseX({
    size,
    stroke,
    color,
}: {
    size: number
    stroke: number
    color: string
}) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
                d="M18 6L6 18M6 6l12 12"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
            />
        </svg>
    )
}

function Arrow({
    dir,
    size,
    stroke,
    color,
}: {
    dir: "left" | "right"
    size: number
    stroke: number
    color: string
}) {
    const d = dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
                d={d}
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function MapPin({
    size,
    color,
    stroke = 1.5,
}: {
    size: number
    color: string
    stroke?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="-3 -2 24 30"
            fill="none"
            style={{ display: "block", flexShrink: 0, overflow: "visible" }}
        >
            <path
                d="M9 0C4.029 0 0 4.029 0 9c0 6.75 9 15 9 15s9-8.25 9-15C18 4.029 13.971 0 9 0z"
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinejoin="round"
            />
            <circle
                cx="9"
                cy="9"
                r="2.5"
                fill="none"
                stroke={color}
                strokeWidth={stroke * 0.8}
            />
        </svg>
    )
}

function IgIco({
    size,
    color,
    stroke = 1.5,
}: {
    size: number
    color: string
    stroke?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block", flexShrink: 0, overflow: "visible" }}
        >
            <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                fill="none"
                stroke={color}
                strokeWidth={stroke}
            />
            <circle
                cx="12"
                cy="12"
                r="4.5"
                fill="none"
                stroke={color}
                strokeWidth={stroke}
            />
            <circle cx="17.5" cy="6.5" r={stroke * 0.7} fill={color} />
        </svg>
    )
}

interface Photo {
    image: { src: string } | string
    title: string
    category: string
    description: string
    aspect: string
    location: string
    locationUrl: string
    instagramUrl: string
}

interface Props {
    // Theme
    theme: string

    // Content
    photos: Photo[]
    categories: string[]
    allLabel: string
    showAll: boolean

    // Colors
    bgDark: string
    bgLight: string
    filterActiveDark: string
    filterActiveLight: string
    filterInactiveDark: string
    filterInactiveLight: string
    filterHoverDark: string
    filterHoverLight: string
    overlayColor: string
    titleColor: string
    lightboxBg: string
    iconColor: string

    // Typography
    filterFont: string
    filterSize: number
    filterWeight: number
    filterSpacing: number
    titleFont: string
    titleSize: number
    titleSpacing: number

    // Layout
    layoutMode: string
    presetPortrait: number
    presetSquare: number
    presetLandscape: number
    columns: number
    columnsTablet: number
    gap: number
    filterGap: number
    filterRowGap: number
    filterAlign: string
    uniformRatio: number
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    maxWidth: number

    // Lightbox
    bgBlur: number
    lbStartScale: number
    lbSpeed: number
    lbImageMaxW: number
    lbImageMaxH: number
    imageOffsetY: number
    closeSize: number
    closeStroke: number
    closeOffsetX: number
    closeOffsetY: number
    arrowSize: number
    arrowStroke: number
    arrowGap: number
    arrowOffsetX: number
    arrowOffsetY: number
    // Caption
    capShow: boolean
    capShowLabel: boolean
    capShowMaps: boolean
    capShowInstagram: boolean
    capIconSide: string
    capAlign: string
    capGap: number
    capIconGap: number
    capOffsetY: number
    capFont: string
    capSize: number
    capWeight: number
    capSpacing: number
    capColor: string
    capIconSize: number
    capIconColor: string
    capIconStroke: number
    capIconOffsetX: number
    capIconOffsetY: number
    iconPlacement: string
    showCounter: boolean
    counterColor: string

    // Animation
    revealOnScroll: boolean
    revealThreshold: number
    itemStagger: number
    itemSpeed: number
    filterFadeSpeed: number
    filterDelay: number
    gridDelay: number
    hoverScale: number
}

export default function GalleryGrid(props: Props) {
    const p = props
    useAssets([p.filterFont, p.titleFont, p.capFont])
    const rootRef = useRef<HTMLDivElement>(null)
    const isDark = useTheme(p.theme)
    // Framer renders components statically on the canvas and during export.
    // Every animation and continuous effect is disabled in that context so the
    // editor stays responsive and exports have no visual artifacts.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRender = useIsStaticRenderer()
    const isStatic = isCanvas || isStaticRender

    const [width, setWidth] = useState(1200)
    useEffect(() => {
        const el = rootRef.current
        const compute = () => {
            const vw = typeof window !== "undefined" ? window.innerWidth : 1200
            const cw = el ? el.offsetWidth : vw
            setWidth(isStatic ? cw || vw : Math.min(vw, cw || vw))
        }
        compute()
        window.addEventListener("resize", compute)
        let ro: ResizeObserver | null = null
        if (el && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(compute)
            ro.observe(el)
        }
        return () => {
            window.removeEventListener("resize", compute)
            if (ro) ro.disconnect()
        }
    }, [isStatic])

    const isMobile = width < 768
    const isTablet = width >= 768 && width < 1200

    const c = {
        bg: isDark ? p.bgDark : p.bgLight,
        active: isDark ? p.filterActiveDark : p.filterActiveLight,
        inactive: isDark ? p.filterInactiveDark : p.filterInactiveLight,
        hover: isDark ? p.filterHoverDark : p.filterHoverLight,
    }

    const cols = isMobile ? 1 : isTablet ? p.columnsTablet : p.columns

    // Filter state
    const [active, setActive] = useState(p.showAll ? "__all__" : "")
    useEffect(() => {
        // If categories change and current active is gone, reset.
        if (
            active !== "__all__" &&
            active !== "" &&
            !(p.categories || []).includes(active)
        ) {
            setActive(p.showAll ? "__all__" : (p.categories || [])[0] || "")
        }
    }, [p.categories, p.showAll])

    const norm = (s: string) => (s || "").trim().toLowerCase()

    const visible = useMemo(() => {
        const list = p.photos || []
        if (active === "__all__") return list
        return list.filter((ph) => norm(ph.category) === norm(active))
    }, [p.photos, active])

    // Lightbox
    const [lbIndex, setLbIndex] = useState<number | null>(null)

    // Section reveal — the filter row and grid fade up once the section enters
    // view, each with its own delay so they don't appear while the nav intro is
    // still running.
    const [sectionShown, setSectionShown] = useState(
        !p.revealOnScroll || isStatic
    )
    useEffect(() => {
        if (!p.revealOnScroll || isStatic) {
            setSectionShown(true)
            return
        }
        const el = rootRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (e) => {
                if (e[0].isIntersecting) {
                    setSectionShown(true)
                    io.disconnect()
                }
            },
            { threshold: 0, rootMargin: `0px 0px -${p.revealThreshold}% 0px` }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [p.revealOnScroll, p.revealThreshold, isStatic])

    const revealStyle = (delay: number): React.CSSProperties =>
        p.revealOnScroll && !isStatic
            ? {
                  opacity: sectionShown ? 1 : 0,
                  transform: sectionShown
                      ? "translateY(0)"
                      : "translateY(24px)",
                  transition:
                      "opacity " +
                      p.itemSpeed +
                      "s ease, transform " +
                      p.itemSpeed +
                      "s cubic-bezier(0.22,1,0.36,1)",
                  transitionDelay: sectionShown ? delay + "s" : "0s",
              }
            : {}

    const filterButtons: { key: string; label: string }[] = [
        ...(p.showAll ? [{ key: "__all__", label: p.allLabel }] : []),
        ...(p.categories || []).map((cat) => ({ key: cat, label: cat })),
    ]

    const flexAlign =
        p.filterAlign === "center"
            ? "center"
            : p.filterAlign === "right"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                background: c.bg,
                boxSizing: "border-box",
                padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <div style={{ width: "100%", maxWidth: p.maxWidth }}>
                {/* Filter buttons */}
                {filterButtons.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: p.filterGap,
                            rowGap: p.filterRowGap,
                            justifyContent: flexAlign,
                            marginBottom: 40,
                            ...revealStyle(p.filterDelay),
                        }}
                    >
                        {filterButtons.map((b) => {
                            const on = active === b.key
                            return (
                                <FilterButton
                                    key={b.key}
                                    label={b.label}
                                    active={on}
                                    colors={c}
                                    p={p}
                                    isStatic={isStatic}
                                    onClick={() => setActive(b.key)}
                                />
                            )
                        })}
                    </div>
                ) : null}

                {/* Grid */}
                <div style={revealStyle(p.gridDelay)}>
                    <div
                        key={active}
                        style={{
                            animation: isStatic
                                ? "none"
                                : "amGgItem " +
                                  p.filterFadeSpeed +
                                  "s cubic-bezier(0.22,1,0.36,1) both",
                        }}
                    >
                        <div
                            style={
                                p.layoutMode === "masonry"
                                    ? {
                                          columnCount: cols,
                                          columnGap: p.gap,
                                      }
                                    : {
                                          display: "grid",
                                          gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                          gap: p.gap,
                                          alignItems: "start",
                                      }
                            }
                        >
                            {visible.map((ph, i) => (
                                <GridItem
                                    key={
                                        (typeof ph.image === "string"
                                            ? ph.image
                                            : ph.image?.src || "") +
                                        "|" +
                                        i
                                    }
                                    photo={ph}
                                    index={i}
                                    masonry={p.layoutMode === "masonry"}
                                    p={p}
                                    isStatic={isStatic}
                                    onOpen={() => setLbIndex(i)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {lbIndex !== null && typeof document !== "undefined"
                ? createPortal(
                      <Lightbox
                          images={visible.map((ph) => ({
                              src:
                                  typeof ph.image === "string"
                                      ? ph.image
                                      : ph.image?.src || "",
                              alt: ph.title || "",
                              location: ph.location || "",
                              locationUrl: ph.locationUrl || "",
                              instagramUrl: ph.instagramUrl || "",
                          }))}
                          idx={lbIndex}
                          onClose={() => setLbIndex(null)}
                          onPrev={() =>
                              setLbIndex((i) =>
                                  Math.max(0, (i !== null ? i : 0) - 1)
                              )
                          }
                          onNext={() =>
                              setLbIndex((i) =>
                                  Math.min(
                                      visible.length - 1,
                                      (i !== null ? i : 0) + 1
                                  )
                              )
                          }
                          bg={p.lightboxBg}
                          iconColor={p.iconColor}
                          maxW={p.lbImageMaxW}
                          maxH={p.lbImageMaxH}
                          imageOffsetY={p.imageOffsetY}
                          arrowGap={p.arrowGap}
                          bgBlur={p.bgBlur}
                          imageStartScale={p.lbStartScale}
                          imageSpeed={p.lbSpeed}
                          arrowSize={p.arrowSize}
                          arrowStroke={p.arrowStroke}
                          arrowOffsetX={p.arrowOffsetX}
                          arrowOffsetY={p.arrowOffsetY}
                          closeSize={p.closeSize}
                          closeStroke={p.closeStroke}
                          closeOffsetX={p.closeOffsetX}
                          closeOffsetY={p.closeOffsetY}
                          capShow={p.capShow}
                          capShowLabel={p.capShowLabel}
                          capShowMaps={p.capShowMaps}
                          capShowInstagram={p.capShowInstagram}
                          capIconSide={p.capIconSide}
                          capAlign={p.capAlign}
                          capGap={p.capGap}
                          capIconGap={p.capIconGap}
                          capOffsetY={p.capOffsetY}
                          capFont={p.capFont}
                          capSize={p.capSize}
                          capWeight={p.capWeight}
                          capSpacing={p.capSpacing}
                          capColor={p.capColor}
                          capIconSize={p.capIconSize}
                          capIconColor={p.capIconColor}
                          capIconStroke={p.capIconStroke}
                          capIconOffsetX={p.capIconOffsetX}
                          capIconOffsetY={p.capIconOffsetY}
                          iconPlacement={p.iconPlacement}
                          showCounter={p.showCounter}
                          counterColor={p.counterColor}
                      />,
                      document.body
                  )
                : null}
        </div>
    )
}

function FilterButton({
    label,
    active,
    colors,
    p,
    isStatic,
    onClick,
}: {
    label: string
    active: boolean
    colors: { active: string; inactive: string; hover: string }
    p: Props
    isStatic: boolean
    onClick: () => void
}) {
    const [hov, setHov] = useState(false)
    const color = active ? colors.active : hov ? colors.hover : colors.inactive
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 2px",
                fontFamily: ff(p.filterFont),
                fontSize: p.filterSize,
                fontWeight: p.filterWeight,
                letterSpacing: toEm(p.filterSpacing),
                textTransform: "uppercase",
                color,
                borderBottom:
                    "2px solid " + (active ? colors.active : "transparent"),
                transition: isStatic
                    ? "none"
                    : "color 0.25s ease, border-color 0.25s ease",
            }}
        >
            {label}
        </button>
    )
}

function GridItem({
    photo,
    index,
    masonry,
    p,
    isStatic,
    onOpen,
}: {
    photo: Photo
    index: number
    masonry: boolean
    p: Props
    isStatic: boolean
    onOpen: () => void
}) {
    const [hov, setHov] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const [shown, setShown] = useState(!p.revealOnScroll || isStatic)

    useEffect(() => {
        if (!p.revealOnScroll || isStatic) {
            setShown(true)
            return
        }
        const el = ref.current
        if (!el) return
        const io = new IntersectionObserver(
            (e) => {
                if (e[0].isIntersecting) {
                    setShown(true)
                    io.disconnect()
                }
            },
            { threshold: 0, rootMargin: `0px 0px -${p.revealThreshold}% 0px` }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [p.revealOnScroll, p.revealThreshold, isStatic])

    const src =
        typeof photo.image === "string" ? photo.image : photo.image?.src || ""

    // In "presets" mode each photo uses a chosen ratio; "auto" measures the
    // image's natural ratio on load so portrait/landscape sort themselves.
    const [natRatio, setNatRatio] = useState<number | null>(null)
    const presetRatio =
        photo.aspect === "portrait"
            ? p.presetPortrait
            : photo.aspect === "square"
              ? p.presetSquare
              : photo.aspect === "landscape"
                ? p.presetLandscape
                : natRatio // "auto"

    const presetsMode = p.layoutMode === "presets"
    const cellRatio = presetsMode
        ? presetRatio || 1
        : masonry
          ? undefined
          : p.uniformRatio

    return (
        <div
            ref={ref}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            onClick={() => {
                const el = ref.current
                if (el && typeof el.scrollIntoView === "function") {
                    el.scrollIntoView({ block: "center", behavior: "smooth" })
                }
                onOpen()
            }}
            style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                marginBottom: masonry ? p.gap : 0,
                breakInside: masonry ? "avoid" : undefined,
                aspectRatio: cellRatio != null ? String(cellRatio) : undefined,
                opacity: shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(20px)",
                transition: isStatic
                    ? "none"
                    : "opacity " +
                      p.itemSpeed +
                      "s ease, transform " +
                      p.itemSpeed +
                      "s cubic-bezier(0.22,1,0.36,1)",
                transitionDelay:
                    !isStatic && shown ? index * p.itemStagger + "s" : "0s",
            }}
        >
            <img
                src={src}
                alt={photo.title || "Photo"}
                draggable={false}
                onLoad={(e) => {
                    const img = e.currentTarget
                    if (img.naturalWidth && img.naturalHeight) {
                        setNatRatio(img.naturalWidth / img.naturalHeight)
                    }
                }}
                style={{
                    display: "block",
                    width: "100%",
                    height: masonry ? "auto" : "100%",
                    objectFit: "cover",
                    transform: hov ? "scale(" + p.hoverScale + ")" : "scale(1)",
                    transition: isStatic
                        ? "none"
                        : "transform 0.6s cubic-bezier(0.22,1,0.36,1)",
                    userSelect: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: p.overlayColor,
                    opacity: hov ? 1 : 0,
                    transition: isStatic ? "none" : "opacity 0.35s ease",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: 20,
                    pointerEvents: "none",
                }}
            >
                {photo.title ? (
                    <span
                        style={{
                            fontFamily: ff(p.titleFont),
                            fontSize: p.titleSize,
                            letterSpacing: toEm(p.titleSpacing),
                            textTransform: "uppercase",
                            color: p.titleColor,
                            transform: hov
                                ? "translateY(0)"
                                : "translateY(8px)",
                            transition: isStatic
                                ? "none"
                                : "transform 0.35s ease",
                        }}
                    >
                        {photo.title}
                    </span>
                ) : null}
            </div>
        </div>
    )
}

function Lightbox(p: {
    images: {
        src: string
        alt: string
        location: string
        locationUrl: string
        instagramUrl: string
    }[]
    idx: number
    onClose: () => void
    onPrev: () => void
    onNext: () => void
    bg: string
    iconColor: string
    maxW: number
    maxH: number
    imageOffsetY: number
    arrowGap: number
    bgBlur: number
    imageStartScale: number
    imageSpeed: number
    arrowSize: number
    arrowStroke: number
    arrowOffsetX: number
    arrowOffsetY: number
    closeSize: number
    closeStroke: number
    closeOffsetX: number
    closeOffsetY: number
    // Caption block (below the image)
    capShow: boolean
    capShowLabel: boolean
    capShowMaps: boolean
    capShowInstagram: boolean
    capIconSide: string
    capAlign: string
    capGap: number
    capIconGap: number
    capOffsetY: number
    capFont: string
    capSize: number
    capWeight: number
    capSpacing: number
    capColor: string
    capIconSize: number
    capIconColor: string
    capIconStroke: number
    capIconOffsetX: number
    capIconOffsetY: number
    iconPlacement: string
    showCounter: boolean
    counterColor: string
}) {
    const [open, setOpen] = useState(false)
    const [closing, setClosing] = useState(false)
    const [bgActive, setBgActive] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const counterRef = useRef<HTMLDivElement>(null)

    // Scroll lock — the page behind the overlay is held still by swallowing
    // scroll events while the lightbox is open. Nothing is written to <body>
    // or to any element outside this component, so the scrollbar never
    // disappears and the surrounding project keeps its own styling.
    useEffect(function () {
        const stop = function (e: Event) {
            e.preventDefault()
        }
        const scrollKeys = [
            " ",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            "ArrowUp",
            "ArrowDown",
        ]
        const stopKeys = function (e: KeyboardEvent) {
            if (scrollKeys.indexOf(e.key) !== -1) e.preventDefault()
        }
        window.addEventListener("wheel", stop, { passive: false })
        window.addEventListener("touchmove", stop, { passive: false })
        window.addEventListener("keydown", stopKeys, { passive: false })
        return function () {
            window.removeEventListener("wheel", stop)
            window.removeEventListener("touchmove", stop)
            window.removeEventListener("keydown", stopKeys)
        }
    }, [])

    // Keyboard
    useEffect(
        function () {
            const fn = function (e: KeyboardEvent) {
                if (e.key === "Escape") {
                    e.preventDefault()
                    handleClose()
                }
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    p.onPrev()
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault()
                    p.onNext()
                }
            }
            window.addEventListener("keydown", fn)
            return function () {
                window.removeEventListener("keydown", fn)
            }
        },
        [p.onPrev, p.onNext]
    )

    // Entrance — the backdrop (fill + blur) comes up first, then the image
    // fades and scales in behind it.
    //
    // bgActive is flipped via DOUBLE requestAnimationFrame (not setTimeout) so
    // the overlay's starting state is committed in its own painted frame before
    // the target state is applied. Without this, on the very first open both
    // could land in the same frame and the transition would be skipped.
    useEffect(function () {
        let raf1 = 0
        let raf2 = 0
        raf1 = requestAnimationFrame(function () {
            raf2 = requestAnimationFrame(function () {
                setBgActive(true)
            })
        })
        const tImg = setTimeout(function () {
            setOpen(true)
        }, 230) // ~200ms after the bg starts
        return function () {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
            clearTimeout(tImg)
        }
    }, [])

    const handleClose = function () {
        setClosing(true)
        setOpen(false) // image fades/scales out first
        // background restores slightly after the image starts leaving
        setTimeout(function () {
            setBgActive(false)
        }, 160)
        setTimeout(p.onClose, 520)
    }

    const img = p.images[p.idx]

    return (
        <div
            ref={overlayRef}
            onClick={handleClose}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100dvh",
                zIndex: 99999,
                background: p.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: open && !closing ? 1 : 0,
                // Blur the page through the overlay (viewport-only). NOTE: the
                // backdrop-filter is NOT transitioned — animating backdrop-filter
                // re-computes the blur of the (large) content behind it every
                // frame, which caused a ~590ms paint cascade. It snaps on/off
                // with the overlay's own opacity fade instead.
                backdropFilter:
                    bgActive && !closing && p.bgBlur > 0
                        ? "blur(" + p.bgBlur + "px)"
                        : "none",
                WebkitBackdropFilter:
                    bgActive && !closing && p.bgBlur > 0
                        ? "blur(" + p.bgBlur + "px)"
                        : "none",
                transition: "opacity 0.4s ease",
                isolation: "isolate",
            }}
        >
            <div
                ref={contentRef}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100vw",
                    maxWidth: "100vw",
                    maxHeight: "100dvh",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <button
                    onClick={function (e) {
                        e.stopPropagation()
                        if (p.idx > 0) p.onPrev()
                    }}
                    style={{
                        display: p.iconPlacement === "screen" ? "none" : "flex",
                        background: "none",
                        border: "none",
                        padding: "0 " + p.arrowGap + "px",
                        cursor: p.idx > 0 ? "pointer" : "default",
                        opacity: p.idx > 0 ? 0.7 : 0.15,
                        flexShrink: 0,
                        alignItems: "center",
                        position: "relative",
                        left: -p.arrowOffsetX,
                        top: p.arrowOffsetY,
                    }}
                >
                    <svg
                        width={p.arrowSize}
                        height={p.arrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M15 18l-6-6 6-6"
                            stroke={p.iconColor}
                            strokeWidth={p.arrowStroke}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                <div
                    style={{
                        position: "relative",
                        flex: "1 1 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 0,
                        transform:
                            open && !closing
                                ? "scale(1)"
                                : "scale(" + p.imageStartScale + ")",
                        transition:
                            "transform " +
                            p.imageSpeed +
                            "s cubic-bezier(0.4,0,0.2,1)",
                    }}
                >
                    <div
                        onClick={function (e) {
                            e.stopPropagation()
                        }}
                        style={{
                            position: "relative",
                            display: "inline-block",
                            transform: "translateY(" + p.imageOffsetY + "px)",
                        }}
                    >
                        <img
                            src={img ? img.src : ""}
                            alt={img ? img.alt : ""}
                            style={{
                                display: "block",
                                maxWidth: p.maxW + "vw",
                                maxHeight: p.maxH + "dvh",
                                objectFit: "contain",
                                borderRadius: 2,
                                filter: "none",
                            }}
                        />
                        <button
                            onClick={function (e) {
                                e.stopPropagation()
                                handleClose()
                            }}
                            style={{
                                display:
                                    p.iconPlacement === "screen"
                                        ? "none"
                                        : "flex",
                                position: "absolute",
                                top: p.closeOffsetY,
                                left: "calc(100% + " + p.closeOffsetX + "px)",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 4,
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0.7,
                            }}
                        >
                            <svg
                                width={p.closeSize}
                                height={p.closeSize}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M18 6L6 18M6 6l12 12"
                                    stroke={p.iconColor}
                                    strokeWidth={p.closeStroke}
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>

                        {/* Caption: location name + Maps / Instagram icons */}
                        {p.capShow && img ? (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + " + p.capOffsetY + "px)",
                                    left: 0,
                                    right: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent:
                                        p.capAlign === "center"
                                            ? "center"
                                            : p.capAlign === "right"
                                              ? "flex-end"
                                              : "flex-start",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: p.capGap,
                                        flexDirection:
                                            p.capIconSide === "left"
                                                ? "row-reverse"
                                                : "row",
                                    }}
                                >
                                    {p.capShowLabel && img.location ? (
                                        p.capShowMaps && img.locationUrl ? (
                                            <a
                                                href={img.locationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontFamily:
                                                        "'" +
                                                        p.capFont +
                                                        "', sans-serif",
                                                    fontSize: p.capSize,
                                                    fontWeight: p.capWeight,
                                                    letterSpacing: toEm(
                                                        p.capSpacing
                                                    ),
                                                    textTransform: "uppercase",
                                                    color: p.capColor,
                                                    lineHeight: 1,
                                                    whiteSpace: "nowrap",
                                                    textDecoration: "none",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                {img.location}
                                            </a>
                                        ) : (
                                            <span
                                                style={{
                                                    fontFamily:
                                                        "'" +
                                                        p.capFont +
                                                        "', sans-serif",
                                                    fontSize: p.capSize,
                                                    fontWeight: p.capWeight,
                                                    letterSpacing: toEm(
                                                        p.capSpacing
                                                    ),
                                                    textTransform: "uppercase",
                                                    color: p.capColor,
                                                    lineHeight: 1,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {img.location}
                                            </span>
                                        )
                                    ) : null}
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: p.capIconGap,
                                            flexDirection:
                                                p.capIconSide === "left"
                                                    ? "row"
                                                    : "row-reverse",
                                            transform:
                                                "translate(" +
                                                p.capIconOffsetX +
                                                "px, " +
                                                p.capIconOffsetY +
                                                "px)",
                                        }}
                                    >
                                        {p.capShowInstagram &&
                                        img.instagramUrl ? (
                                            <a
                                                href={img.instagramUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: "flex",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <IgIco
                                                    size={p.capIconSize}
                                                    color={p.capIconColor}
                                                    stroke={p.capIconStroke}
                                                />
                                            </a>
                                        ) : null}
                                        {p.capShowMaps && img.locationUrl ? (
                                            <a
                                                href={img.locationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: "flex",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <MapPin
                                                    size={p.capIconSize}
                                                    color={p.capIconColor}
                                                    stroke={p.capIconStroke}
                                                />
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <button
                    onClick={function (e) {
                        e.stopPropagation()
                        if (p.idx < p.images.length - 1) p.onNext()
                    }}
                    style={{
                        display: p.iconPlacement === "screen" ? "none" : "flex",
                        background: "none",
                        border: "none",
                        padding: "0 " + p.arrowGap + "px",
                        cursor:
                            p.idx < p.images.length - 1 ? "pointer" : "default",
                        opacity: p.idx < p.images.length - 1 ? 0.7 : 0.15,
                        flexShrink: 0,
                        alignItems: "center",
                        position: "relative",
                        left: p.arrowOffsetX,
                        top: p.arrowOffsetY,
                    }}
                >
                    <svg
                        width={p.arrowSize}
                        height={p.arrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <path
                            d="M9 18l6-6-6-6"
                            stroke={p.iconColor}
                            strokeWidth={p.arrowStroke}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            {/* Screen-edge arrows + close (fixed to the viewport). Rendered as
               direct overlay children so they sit at the screen edges, not the
               image edges. */}
            {p.iconPlacement === "screen" && typeof document !== "undefined"
                ? createPortal(
                      <>
                          <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  if (p.idx > 0) p.onPrev()
                              }}
                              style={{
                                  position: "fixed",
                                  left: 24 - p.arrowOffsetX,
                                  top: "calc(50% + " + p.arrowOffsetY + "px)",
                                  transform: "translateY(-50%)",
                                  background: "none",
                                  border: "none",
                                  padding: 10,
                                  cursor: p.idx > 0 ? "pointer" : "default",
                                  opacity: p.idx > 0 ? 0.7 : 0.15,
                                  zIndex: 100000,
                                  display: "flex",
                                  alignItems: "center",
                              }}
                          >
                              <svg
                                  width={p.arrowSize}
                                  height={p.arrowSize}
                                  viewBox="0 0 24 24"
                                  fill="none"
                              >
                                  <path
                                      d="M15 18l-6-6 6-6"
                                      stroke={p.iconColor}
                                      strokeWidth={p.arrowStroke}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                  />
                              </svg>
                          </button>
                          <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  if (p.idx < p.images.length - 1) p.onNext()
                              }}
                              style={{
                                  position: "fixed",
                                  right: 24 + p.arrowOffsetX,
                                  top: "calc(50% + " + p.arrowOffsetY + "px)",
                                  transform: "translateY(-50%)",
                                  background: "none",
                                  border: "none",
                                  padding: 10,
                                  cursor:
                                      p.idx < p.images.length - 1
                                          ? "pointer"
                                          : "default",
                                  opacity:
                                      p.idx < p.images.length - 1 ? 0.7 : 0.15,
                                  zIndex: 100000,
                                  display: "flex",
                                  alignItems: "center",
                              }}
                          >
                              <svg
                                  width={p.arrowSize}
                                  height={p.arrowSize}
                                  viewBox="0 0 24 24"
                                  fill="none"
                              >
                                  <path
                                      d="M9 18l6-6-6-6"
                                      stroke={p.iconColor}
                                      strokeWidth={p.arrowStroke}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                  />
                              </svg>
                          </button>
                          <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  handleClose()
                              }}
                              style={{
                                  position: "fixed",
                                  top: 24 + p.closeOffsetY,
                                  right: 24 - p.closeOffsetX,
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 6,
                                  zIndex: 100001,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: 0.7,
                              }}
                          >
                              <svg
                                  width={p.closeSize}
                                  height={p.closeSize}
                                  viewBox="0 0 24 24"
                                  fill="none"
                              >
                                  <path
                                      d="M18 6L6 18M6 6l12 12"
                                      stroke={p.iconColor}
                                      strokeWidth={p.closeStroke}
                                      strokeLinecap="round"
                                  />
                              </svg>
                          </button>
                      </>,
                      document.body
                  )
                : null}

            {p.showCounter ? (
                <div
                    ref={counterRef}
                    style={{
                        position: "absolute",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: p.counterColor,
                        fontFamily: "'" + p.capFont + "', sans-serif",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        pointerEvents: "none",
                        background: "transparent",
                        zIndex: 1,
                    }}
                >
                    {p.idx + 1} / {p.images.length}
                </div>
            ) : null}
        </div>
    )
}

// ════════════════════════════════════════════════════════════
// PROPERTY CONTROLS
// ════════════════════════════════════════════════════════════
// Grouped by part of the component, in the order the parts appear:
// Theme → Colors → Content → Layout → Filter Bar → Photo Card →
// Lightbox . Backdrop / Image / Caption / Controls → Behavior.
// Inside each group: show/hide → content → colours → typography →
// size & spacing → position → animation.
addPropertyControls(GalleryGrid, {
    // ════════════════════════════════════════════════════════
    // THEME
    // ════════════════════════════════════════════════════════
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "auto"],
        optionTitles: ["Dark", "Light", "Auto"],
        defaultValue: "dark",
        displaySegmentedControl: true,
        description:
            "Which set of colours to use. Auto follows a data-theme attribute if your site sets one, otherwise the visitor's OS setting.",
        group: "Theme",
    },

    // ════════════════════════════════════════════════════════
    // COLORS — the section background behind everything
    // ════════════════════════════════════════════════════════
    bgDark: {
        type: ControlType.Color,
        title: "Background (Dark)",
        defaultValue: "#000000",
        description: "Section background used when the theme is dark.",
        group: "Colors",
    },
    bgLight: {
        type: ControlType.Color,
        title: "Background (Light)",
        defaultValue: "#FFFFFF",
        description: "Section background used when the theme is light.",
        group: "Colors",
    },

    // ════════════════════════════════════════════════════════
    // CONTENT — the photos and the category list
    // ════════════════════════════════════════════════════════
    photos: {
        type: ControlType.Array,
        title: "Photos",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                    description:
                        "Shown over the photo on hover, and used as the image's alt text.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Nature",
                    description:
                        "Must match one of the Categories below (case-insensitive).",
                },
                aspect: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["auto", "portrait", "square", "landscape"],
                    optionTitles: [
                        "Auto (native)",
                        "Portrait",
                        "Square",
                        "Landscape",
                    ],
                    defaultValue: "auto",
                    description:
                        "Only used in Presets layout. Auto = the image's own ratio.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "Optional note for your own reference.",
                },
                location: {
                    type: ControlType.String,
                    title: "Location",
                    defaultValue: "Lisbon, Portugal",
                    description:
                        "Shown in the lightbox caption under the photo.",
                },
                locationUrl: {
                    type: ControlType.String,
                    title: "Google Maps URL",
                    defaultValue: "https://maps.google.com",
                    description: "Opened by the map pin icon in the caption.",
                },
                instagramUrl: {
                    type: ControlType.String,
                    title: "Instagram URL",
                    defaultValue: "https://instagram.com",
                    description: "Opened by the Instagram icon in the caption.",
                },
            },
        },
        defaultValue: [
            { title: "Still Water", category: "Nature", description: "" },
            { title: "Ridgeline", category: "Nature", description: "" },
            { title: "Old Town", category: "Urban", description: "" },
            { title: "Night Market", category: "Urban", description: "" },
            { title: "In Profile", category: "Portrait", description: "" },
            { title: "From Above", category: "Travel", description: "" },
        ],
        group: "Content",
    },
    categories: {
        type: ControlType.Array,
        title: "Categories",
        control: { type: ControlType.String },
        defaultValue: ["Nature", "Urban", "Portrait", "Travel"],
        description: "Filter buttons, in order. Edit freely.",
        group: "Content",
    },
    showAll: {
        type: ControlType.Boolean,
        title: "Show All Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Adds a button in front of the categories that clears the filter.",
        group: "Content",
    },
    allLabel: {
        type: ControlType.String,
        title: "All Label",
        defaultValue: "All",
        description: "Wording of that button.",
        group: "Content",
    },

    // ════════════════════════════════════════════════════════
    // LAYOUT — how the grid is built
    // ════════════════════════════════════════════════════════
    layoutMode: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["uniform", "masonry", "presets"],
        optionTitles: ["Uniform grid", "Masonry", "Presets per photo"],
        defaultValue: "masonry",
        displaySegmentedControl: true,
        description:
            "Uniform = equal cells. Masonry = every image in its own height (portrait/landscape auto-arrange). Presets = pick a shape per photo.",
        group: "Layout",
    },
    uniformRatio: {
        type: ControlType.Number,
        title: "Cell Ratio",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.05,
        description: "Width ÷ height for uniform cells (1 = square).",
        hidden: (p: any) => p.layoutMode !== "uniform",
        group: "Layout",
    },
    presetPortrait: {
        type: ControlType.Number,
        title: "Preset · Portrait Ratio",
        defaultValue: 0.75,
        min: 0.4,
        max: 1,
        step: 0.05,
        description: "Width ÷ height for photos marked Portrait.",
        hidden: (p: any) => p.layoutMode !== "presets",
        group: "Layout",
    },
    presetSquare: {
        type: ControlType.Number,
        title: "Preset · Square Ratio",
        defaultValue: 1,
        min: 0.8,
        max: 1.2,
        step: 0.05,
        description: "Width ÷ height for photos marked Square.",
        hidden: (p: any) => p.layoutMode !== "presets",
        group: "Layout",
    },
    presetLandscape: {
        type: ControlType.Number,
        title: "Preset · Landscape Ratio",
        defaultValue: 1.5,
        min: 1,
        max: 2.5,
        step: 0.05,
        description: "Width ÷ height for photos marked Landscape.",
        hidden: (p: any) => p.layoutMode !== "presets",
        group: "Layout",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns (Desktop)",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        description: "Columns at 1200px and wider.",
        group: "Layout",
    },
    columnsTablet: {
        type: ControlType.Number,
        title: "Columns (Tablet)",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
        description: "Columns between 768px and 1199px. Mobile is always 1.",
        group: "Layout",
    },
    gap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        description: "Space between photos.",
        group: "Layout",
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 80,
        min: 0,
        max: 320,
        step: 4,
        unit: "px",
        group: "Layout",
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 80,
        min: 0,
        max: 320,
        step: 4,
        unit: "px",
        group: "Layout",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 120,
        min: 0,
        max: 320,
        step: 4,
        unit: "px",
        group: "Layout",
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 80,
        min: 0,
        max: 320,
        step: 4,
        unit: "px",
        group: "Layout",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1400,
        min: 600,
        max: 2000,
        step: 20,
        unit: "px",
        description: "The grid stays centred and never grows past this.",
        group: "Layout",
    },

    // ════════════════════════════════════════════════════════
    // FILTER BAR — the row of category buttons
    // ════════════════════════════════════════════════════════
    filterActiveDark: {
        type: ControlType.Color,
        title: "Active (Dark)",
        defaultValue: "#FFFFFF",
        description:
            "Selected button — text and its underline — on the dark theme.",
        group: "Filter Bar",
    },
    filterActiveLight: {
        type: ControlType.Color,
        title: "Active (Light)",
        defaultValue: "#111111",
        description: "Selected button on the light theme.",
        group: "Filter Bar",
    },
    filterInactiveDark: {
        type: ControlType.Color,
        title: "Inactive (Dark)",
        defaultValue: "#555555",
        description: "Unselected buttons on the dark theme.",
        group: "Filter Bar",
    },
    filterInactiveLight: {
        type: ControlType.Color,
        title: "Inactive (Light)",
        defaultValue: "#AAAAAA",
        description: "Unselected buttons on the light theme.",
        group: "Filter Bar",
    },
    filterHoverDark: {
        type: ControlType.Color,
        title: "Hover (Dark)",
        defaultValue: "#B0B0B0",
        description: "Colour an unselected button takes on hover, dark theme.",
        group: "Filter Bar",
    },
    filterHoverLight: {
        type: ControlType.Color,
        title: "Hover (Light)",
        defaultValue: "#444444",
        description: "Colour an unselected button takes on hover, light theme.",
        group: "Filter Bar",
    },
    filterFont: {
        type: ControlType.String,
        title: "Font",
        defaultValue: "Inter",
        description: "Any Google Font name — it is loaded automatically.",
        group: "Filter Bar",
    },
    filterSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 13,
        min: 9,
        max: 22,
        step: 1,
        unit: "px",
        group: "Filter Bar",
    },
    filterWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
        description: "Font weight. 400 = regular, 700 = bold.",
        group: "Filter Bar",
    },
    filterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 15,
        min: 0,
        max: 40,
        step: 1,
        description: "Letter spacing (×0.01em).",
        group: "Filter Bar",
    },
    filterGap: {
        type: ControlType.Number,
        title: "Button Gap",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        description: "Horizontal space between the buttons.",
        group: "Filter Bar",
    },
    filterRowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
        description: "Vertical space when the buttons wrap onto a second line.",
        group: "Filter Bar",
    },
    filterAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        description: "Where the button row sits across the grid width.",
        group: "Filter Bar",
    },
    filterFadeSpeed: {
        type: ControlType.Number,
        title: "Switch Fade Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.5,
        step: 0.1,
        unit: "s",
        description: "Fade + reflow duration when switching category.",
        group: "Filter Bar",
    },

    // ════════════════════════════════════════════════════════
    // PHOTO CARD — a single photo in the grid, and its hover state
    // ════════════════════════════════════════════════════════
    overlayColor: {
        type: ControlType.Color,
        title: "Hover Overlay",
        defaultValue: "rgba(0,0,0,0.45)",
        description: "Tint that fades in over the photo on hover.",
        group: "Photo Card",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        description: "The photo title shown on the hover overlay.",
        group: "Photo Card",
    },
    titleFont: {
        type: ControlType.String,
        title: "Title Font",
        defaultValue: "Inter",
        description: "Any Google Font name — it is loaded automatically.",
        group: "Photo Card",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 14,
        min: 9,
        max: 32,
        step: 1,
        unit: "px",
        group: "Photo Card",
    },
    titleSpacing: {
        type: ControlType.Number,
        title: "Title Letter Spacing",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
        description: "Letter spacing (×0.01em).",
        group: "Photo Card",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Zoom",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
        description: "How far the image scales up on hover. 1 = no zoom.",
        group: "Photo Card",
    },

    // ════════════════════════════════════════════════════════
    // LIGHTBOX . BACKDROP — what sits behind the opened photo
    // ════════════════════════════════════════════════════════
    lightboxBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0.94)",
        description: "Fill of the fullscreen overlay.",
        group: "Lightbox . Backdrop",
    },
    bgBlur: {
        type: ControlType.Number,
        title: "Page Blur",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        description: "Blurs the page seen through the overlay. 0 = off.",
        group: "Lightbox . Backdrop",
    },

    // ════════════════════════════════════════════════════════
    // LIGHTBOX . IMAGE — size and entrance of the opened photo
    // ════════════════════════════════════════════════════════
    lbImageMaxW: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 82,
        min: 30,
        max: 100,
        step: 1,
        unit: "vw",
        description: "Share of the screen width the photo may fill.",
        group: "Lightbox . Image",
    },
    lbImageMaxH: {
        type: ControlType.Number,
        title: "Max Height",
        defaultValue: 84,
        min: 40,
        max: 98,
        step: 1,
        unit: "vh",
        description: "Share of the screen height the photo may fill.",
        group: "Lightbox . Image",
    },
    imageOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 4,
        unit: "px",
        description: "Nudge the lightbox image up or down.",
        group: "Lightbox . Image",
    },
    lbStartScale: {
        type: ControlType.Number,
        title: "Zoom Start",
        defaultValue: 0.92,
        min: 0.7,
        max: 1.3,
        step: 0.01,
        description:
            "Scale the photo opens from. Below 1 grows, above shrinks.",
        group: "Lightbox . Image",
    },
    lbSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.5,
        step: 0.02,
        unit: "s",
        description: "Duration of that open/close movement.",
        group: "Lightbox . Image",
    },

    // ════════════════════════════════════════════════════════
    // LIGHTBOX . CAPTION — location name + Maps / Instagram icons
    // ════════════════════════════════════════════════════════
    capShow: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Location + Maps/Instagram icons under the image.",
        group: "Lightbox . Caption",
    },
    capShowLabel: {
        type: ControlType.Boolean,
        title: "Show Location Name",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "The Location text you set on each photo.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capShowMaps: {
        type: ControlType.Boolean,
        title: "Maps Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Opens the photo's Google Maps URL.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capShowInstagram: {
        type: ControlType.Boolean,
        title: "Instagram Icon",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Opens the photo's Instagram URL.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#FFFFFF",
        description: "Colour of the location text.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
        description: "Colour of the Maps and Instagram icons.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capFont: {
        type: ControlType.String,
        title: "Name Font",
        defaultValue: "Inter",
        description:
            "Any Google Font name — it is loaded automatically. Also used by the photo counter.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capSize: {
        type: ControlType.Number,
        title: "Name Size",
        defaultValue: 13,
        min: 9,
        max: 28,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capWeight: {
        type: ControlType.Number,
        title: "Name Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
        description: "Font weight. 400 = regular, 700 = bold.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capSpacing: {
        type: ControlType.Number,
        title: "Name Letter Spacing",
        defaultValue: 15,
        min: 0,
        max: 40,
        step: 1,
        description: "Letter spacing (×0.01em).",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 18,
        min: 10,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconStroke: {
        type: ControlType.Number,
        title: "Icon Line Thickness",
        defaultValue: 1.5,
        min: 0.5,
        max: 4,
        step: 0.25,
        description: "Stroke width of the drawn icons.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capGap: {
        type: ControlType.Number,
        title: "Name ↔ Icons Gap",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconGap: {
        type: ControlType.Number,
        title: "Icon ↔ Icon Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capOffsetY: {
        type: ControlType.Number,
        title: "Distance Below Image",
        defaultValue: 16,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capAlign: {
        type: ControlType.Enum,
        title: "Caption Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        description: "Where the caption sits across the photo's width.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconSide: {
        type: ControlType.Enum,
        title: "Icons Side",
        options: ["right", "left"],
        optionTitles: ["Right of name", "Left of name"],
        defaultValue: "right",
        displaySegmentedControl: true,
        description: "Which side of the location name the icons sit on.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconOffsetX: {
        type: ControlType.Number,
        title: "Icons Offset X",
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 1,
        unit: "px",
        description: "Nudge the icon pair left or right.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },
    capIconOffsetY: {
        type: ControlType.Number,
        title: "Icons Offset Y",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        description: "Nudge the icon pair up or down.",
        hidden: (p: any) => !p.capShow,
        group: "Lightbox . Caption",
    },

    // ════════════════════════════════════════════════════════
    // LIGHTBOX . CONTROLS — arrows, close and the photo counter
    // ════════════════════════════════════════════════════════
    iconPlacement: {
        type: ControlType.Enum,
        title: "Arrows & Close Position",
        options: ["image", "screen"],
        optionTitles: ["Next to image", "Screen edges"],
        defaultValue: "image",
        displaySegmentedControl: true,
        description:
            "Next to image = arrows flank the photo, close sits by its corner. Screen edges = fixed to the viewport sides/top-right.",
        group: "Lightbox . Controls",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#FFFFFF",
        description: "Arrows and the close button inside the lightbox.",
        group: "Lightbox . Controls",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow · Size",
        defaultValue: 30,
        min: 14,
        max: 60,
        step: 1,
        unit: "px",
        group: "Lightbox . Controls",
    },
    arrowStroke: {
        type: ControlType.Number,
        title: "Arrow · Thickness",
        defaultValue: 1.5,
        min: 0.5,
        max: 6,
        step: 0.25,
        description: "Stroke width of the arrow.",
        group: "Lightbox . Controls",
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow · Distance from Image",
        defaultValue: 20,
        min: 4,
        max: 80,
        step: 2,
        unit: "px",
        description: "Only used when the arrows sit next to the image.",
        group: "Lightbox . Controls",
    },
    arrowOffsetX: {
        type: ControlType.Number,
        title: "Arrow · Offset X",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        description: "Pushes both arrows outward (positive) or inward.",
        group: "Lightbox . Controls",
    },
    arrowOffsetY: {
        type: ControlType.Number,
        title: "Arrow · Offset Y",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        description: "Nudge both arrows up or down.",
        group: "Lightbox . Controls",
    },
    closeSize: {
        type: ControlType.Number,
        title: "Close · Size",
        defaultValue: 22,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
        group: "Lightbox . Controls",
    },
    closeStroke: {
        type: ControlType.Number,
        title: "Close · Thickness",
        defaultValue: 1.5,
        min: 0.5,
        max: 6,
        step: 0.25,
        description: "Stroke width of the X.",
        group: "Lightbox . Controls",
    },
    closeOffsetX: {
        type: ControlType.Number,
        title: "Close · Distance from Image",
        defaultValue: 12,
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
        description: "Gap between the photo's right edge and the X.",
        group: "Lightbox . Controls",
    },
    closeOffsetY: {
        type: ControlType.Number,
        title: "Close · Offset Y",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        description: "Nudge the X up or down.",
        group: "Lightbox . Controls",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Photo Counter",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "The 1 / 12 indicator at the bottom of the lightbox.",
        group: "Lightbox . Controls",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        defaultValue: "rgba(255,255,255,0.35)",
        description: "Colour of that indicator.",
        hidden: (p: any) => !p.showCounter,
        group: "Lightbox . Controls",
    },

    // ════════════════════════════════════════════════════════
    // BEHAVIOR — how the section arrives on screen
    // ════════════════════════════════════════════════════════
    revealOnScroll: {
        type: ControlType.Boolean,
        title: "Reveal On Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Fades the filter row and the photos up as the section enters view.",
        group: "Behavior",
    },
    revealThreshold: {
        type: ControlType.Number,
        title: "Reveal Threshold",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        description: "How far into the screen the section must be to start.",
        hidden: (p: any) => !p.revealOnScroll,
        group: "Behavior",
    },
    itemSpeed: {
        type: ControlType.Number,
        title: "Item Anim Speed",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        description: "Duration of each photo's fade-up.",
        group: "Behavior",
    },
    itemStagger: {
        type: ControlType.Number,
        title: "Item Stagger",
        defaultValue: 0.06,
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "s",
        description:
            "Delay added between one photo and the next. 0 = together.",
        hidden: (p: any) => !p.revealOnScroll,
        group: "Behavior",
    },
    filterDelay: {
        type: ControlType.Number,
        title: "Filter Reveal Delay",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        description:
            "Delay before the filter buttons fade in — raise it so they don't appear while the nav is still animating.",
        hidden: (p: any) => !p.revealOnScroll,
        group: "Behavior",
    },
    gridDelay: {
        type: ControlType.Number,
        title: "Grid Reveal Delay",
        defaultValue: 0.55,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Delay before the photo grid fades in.",
        hidden: (p: any) => !p.revealOnScroll,
        group: "Behavior",
    },
})
