import { useRef, useState, useEffect, useCallback, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * FILMSTRIP INDEX
 * A pinned thumbnail strip over a continuously scrolling full-bleed backdrop.
 *
 * Version 1.2.0
 *
 * SETUP
 * 1. Place on the page as a full-width section.
 * 2. Add 3 to 12 images in Items.
 * 3. If your site has a fixed header, set Nav Offset to its height.
 * 4. Do not nest inside a frame with overflow hidden or the pin will not hold.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */

const CANVAS_HEIGHT = 800
const MIN_CELL = 28

interface Item {
    image?: any
    title?: string
    alt?: string
    focalX?: number
    focalY?: number
    link?: string
}

interface Props {
    items: Item[]
    scrollPace: number
    stickyOffset: number
    backdropMotion: "slide" | "fade" | "zoom"
    backdropParallax: number
    backdropZoom: number
    scrimColor: string
    scrimOpacity: number
    frameStyle: "plain" | "glass" | "lens"
    glassBlur: number
    glassSaturation: number
    glassTint: string
    glassEdge: number
    glassShadow: number
    glassRefraction: number
    lensMagnify: number
    pointerLight: boolean
    showPlate: boolean
    platePadding: number
    plateRadius: number
    stripPlacement: "left" | "center" | "right" | "bottom"
    stripInset: number
    cellWidth: number
    cellHeight: number
    cellGap: number
    cellRadius: number
    inactiveOpacity: number
    highlightMode: "snap" | "continuous" | "reticle"
    activeGrow: number
    activeBorder: number
    activeBorderColor: string
    cellAction: "jump" | "link" | "none"
    showCaption: boolean
    captionFont?: any
    captionColor: string
    captionGlass: boolean
    showCounter: boolean
    counterFont?: any
    showRail: boolean
    railColor: string
    tabletBreakpoint: number
    tabletCellScale: number
    mobileBreakpoint: number
    mobileStripPlacement: "left" | "center" | "right" | "bottom"
    mobileCellScale: number
    previewProgress: number
    background: string
    style?: any
}

/* Framer passes a partial props object to hidden() callbacks */
type P = Partial<Props>

export default function FilmstripIndex(props: Props) {
    const {
        items,
        scrollPace,
        stickyOffset,
        backdropMotion,
        backdropParallax,
        backdropZoom,
        scrimColor,
        scrimOpacity,
        frameStyle,
        glassBlur,
        glassSaturation,
        glassTint,
        glassEdge,
        glassShadow,
        glassRefraction,
        lensMagnify,
        pointerLight,
        showPlate,
        platePadding,
        plateRadius,
        stripPlacement,
        stripInset,
        cellWidth,
        cellHeight,
        cellGap,
        cellRadius,
        inactiveOpacity,
        highlightMode,
        activeGrow,
        activeBorder,
        activeBorderColor,
        cellAction,
        showCaption,
        captionFont,
        captionColor,
        captionGlass,
        showCounter,
        counterFont,
        showRail,
        railColor,
        tabletBreakpoint,
        tabletCellScale,
        mobileBreakpoint,
        mobileStripPlacement,
        mobileCellScale,
        previewProgress,
        background,
        style,
    } = props

    /* True on the Framer canvas and during static export or thumbnail
       generation. Every animation, transition, and continuous effect below
       is switched off when this is true, so the editor stays fast and
       exports render a clean still frame. */
    const isStatic = useIsStaticRenderer()

    const wrapRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef(0)
    const queued = useRef(false)
    const visible = useRef(true)
    const lockedH = useRef(0)

    const reactId = useId()
    const refractId = "filmstrip-refract-" + reactId.replace(/:/g, "")

    const [progress, setProgress] = useState(0)
    const [stageH, setStageH] = useState(CANVAS_HEIGHT)
    const [boxW, setBoxW] = useState(1200)
    const [reduced, setReduced] = useState(false)
    const [glassOK, setGlassOK] = useState(true)

    const list = Array.isArray(items) ? items : []
    const n = list.length

    /* no motion at all in a static context, or when the visitor asks for less */
    const noMotion = reduced || isStatic

    /* ---------------- environment ---------------- */

    /* iOS Safari changes innerHeight as the URL bar collapses during scroll.
       Recomputing on every one of those events shifts the page height mid
       scroll and makes the pin judder, so the measurement is locked and only
       refreshed on a real viewport change. */
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        let lastW = window.innerWidth
        const measure = (force: boolean) => {
            const h = window.innerHeight
            const w = window.innerWidth
            const widthChanged = w !== lastW
            const bigJump = Math.abs(h - lockedH.current) > 120
            if (force || widthChanged || bigJump) {
                lastW = w
                lockedH.current = h
                setStageH(h)
            }
        }
        measure(true)
        const onResize = () => measure(false)
        const onOrient = () => setTimeout(() => measure(true), 250)
        window.addEventListener("resize", onResize)
        window.addEventListener("orientationchange", onOrient)
        return () => {
            window.removeEventListener("resize", onResize)
            window.removeEventListener("orientationchange", onOrient)
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !window.matchMedia)
            return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const set = () => setReduced(mq.matches)
        set()
        if (mq.addEventListener) mq.addEventListener("change", set)
        else mq.addListener(set)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", set)
            else mq.removeListener(set)
        }
    }, [isStatic])

    /* backdrop-filter support, so unsupported browsers get a solid plate
       instead of invisible boxes */
    useEffect(() => {
        if (typeof window === "undefined" || !window.CSS || !window.CSS.supports)
            return
        setGlassOK(
            window.CSS.supports("backdrop-filter", "blur(2px)") ||
                window.CSS.supports("-webkit-backdrop-filter", "blur(2px)")
        )
    }, [])

    useEffect(() => {
        const el = wrapRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((e) => setBoxW(e[0].contentRect.width))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    /* stop doing scroll maths while the section is off screen */
    useEffect(() => {
        const el = wrapRef.current
        if (isStatic || !el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (e) => {
                visible.current = e[0].isIntersecting
            },
            { rootMargin: "120px 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    /* ---------------- geometry ---------------- */

    const vh = isStatic ? CANVAS_HEIGHT : stageH
    const travel = Math.max(1, vh * Math.max(0, n - 1) * scrollPace)
    const wrapperH = vh + travel

    /* ---------------- scroll driver ---------------- */

    const readScroll = useCallback(() => {
        queued.current = false
        const el = wrapRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const raw = (-rect.top + stickyOffset) / travel
        setProgress(raw < 0 ? 0 : raw > 1 ? 1 : raw)
    }, [travel, stickyOffset])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const onScroll = () => {
            if (queued.current || !visible.current) return
            queued.current = true
            rafRef.current = requestAnimationFrame(readScroll)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        readScroll()
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            cancelAnimationFrame(rafRef.current)
        }
    }, [isStatic, readScroll])

    /* ---------------- responsive tiers ---------------- */

    const tier: "desktop" | "tablet" | "mobile" =
        boxW < mobileBreakpoint
            ? "mobile"
            : boxW < tabletBreakpoint
              ? "tablet"
              : "desktop"

    const wide = tier === "desktop"

    /* ---------------- pointer light ---------------- */

    /* Written straight to CSS custom properties. Holding this in state
       re-rendered every image on every mouse move. */
    useEffect(() => {
        const el = stageRef.current
        if (!el || !pointerLight || !wide || isStatic || frameStyle === "plain")
            return
        let f = 0
        const move = (e: PointerEvent) => {
            cancelAnimationFrame(f)
            f = requestAnimationFrame(() => {
                const r = el.getBoundingClientRect()
                const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
                const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
                el.style.setProperty("--fi-lx", (x * 100).toFixed(1) + "%")
                el.style.setProperty("--fi-ly", (y * 100).toFixed(1) + "%")
            })
        }
        el.addEventListener("pointermove", move)
        return () => {
            el.removeEventListener("pointermove", move)
            cancelAnimationFrame(f)
        }
    }, [pointerLight, wide, isStatic, frameStyle])

    /* ---------------- derived ---------------- */

    const p = isStatic ? previewProgress : progress
    const pos = p * Math.max(0, n - 1)
    const activeIndex = Math.round(pos)

    const jumpTo = (i: number) => {
        if (isStatic || typeof window === "undefined") return
        const el = wrapRef.current
        if (!el || n < 2) return
        const top = el.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
            top: top + (i / (n - 1)) * travel - stickyOffset,
            behavior: noMotion ? "auto" : "smooth",
        })
    }

    /* Framer's Link control also returns internal page paths. Those should
       navigate in place rather than open a new tab. */
    const openLink = (link?: string) => {
        if (isStatic || typeof window === "undefined" || !link) return
        const external =
            /^(https?:)?\/\//i.test(link) ||
            link.startsWith("mailto:") ||
            link.startsWith("tel:")
        if (external) window.open(link, "_blank", "noopener")
        else window.location.href = link
    }

    const onCellClick = (item: Item, i: number) => {
        if (isStatic || cellAction === "none") return
        if (cellAction === "link") {
            openLink(item.link)
            return
        }
        /* jump, and follow the link only when the cell is already active */
        if (i === activeIndex && item.link) {
            openLink(item.link)
            return
        }
        jumpTo(i)
    }

    const onKeyDown = (e: any) => {
        if (isStatic) return
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            jumpTo(Math.min(n - 1, activeIndex + 1))
        }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            jumpTo(Math.max(0, activeIndex - 1))
        }
        if (e.key === "Home") {
            e.preventDefault()
            jumpTo(0)
        }
        if (e.key === "End") {
            e.preventDefault()
            jumpTo(n - 1)
        }
    }

    /* ---------------- empty state ---------------- */

    if (n === 0) {
        return (
            <div
                style={{
                    ...style,
                    background,
                    minHeight: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,.55)",
                    fontSize: 13,
                    textAlign: "center",
                    padding: 24,
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.6,
                }}
            >
                Add images in the Items property.
                <br />
                Three or more works best.
            </div>
        )
    }

    /* ---------------- responsive strip ---------------- */

    const place = tier === "mobile" ? mobileStripPlacement : stripPlacement
    const horizontal = place === "bottom"
    const s =
        tier === "mobile"
            ? mobileCellScale
            : tier === "tablet"
              ? tabletCellScale
              : 1

    let cw = Math.round(cellWidth * s)
    let chh = Math.round(cellHeight * s)
    const cg = Math.round(cellGap * s)
    const pad = Math.round(platePadding * s)

    /* The strip is an index, so every cell stays visible. Cells are clamped
       to the space available instead of overflowing, which is what used to
       push a horizontal scrollbar onto narrow screens. */
    const aspect = cellWidth / Math.max(1, cellHeight)
    const chrome = stripInset * 2 + (showPlate ? pad * 2 : 0)
    const gaps = Math.max(0, n - 1) * cg
    const headroom = highlightMode === "reticle" ? 1 : activeGrow

    if (horizontal) {
        const room = Math.max(0, boxW - chrome) / headroom
        const maxCw = Math.floor((room - gaps) / n)
        if (maxCw < cw) {
            cw = Math.max(MIN_CELL, maxCw)
            chh = Math.max(MIN_CELL, Math.round(cw / aspect))
        }
    } else {
        const room = Math.max(0, vh - chrome) / headroom
        const maxCh = Math.floor((room - gaps) / n)
        if (maxCh < chh) {
            chh = Math.max(MIN_CELL, maxCh)
            cw = Math.max(MIN_CELL, Math.round(chh * aspect))
        }
    }

    /* stacked backdrop filters are the main cause of scroll jank on phones */
    const blur = wide ? glassBlur : Math.round(glassBlur * 0.6)
    const glass = frameStyle !== "plain" && glassOK

    /* the SVG displacement filter is a continuous visual effect, so it is
       dropped entirely in a static context */
    const refract =
        glass &&
        frameStyle === "lens" &&
        glassRefraction > 0 &&
        wide &&
        !noMotion

    const step = (horizontal ? cw : chh) + cg
    const shift = highlightMode === "reticle" ? -(pos - (n - 1) / 2) * step : 0

    const glassSurface = (radius: number, strength: number): any => ({
        backdropFilter: `blur(${blur}px) saturate(${glassSaturation}) brightness(1.04)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${glassSaturation}) brightness(1.04)`,
        background: `linear-gradient(145deg,
            rgba(255,255,255,${0.2 * glassEdge * strength}) 0%,
            rgba(255,255,255,${0.04 * strength}) 38%,
            rgba(255,255,255,${0.02 * strength}) 62%,
            rgba(255,255,255,${0.12 * glassEdge * strength}) 100%),
            ${glassTint}`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.55 * glassEdge * strength}),
            inset 0 -1px 0 rgba(255,255,255,${0.16 * glassEdge * strength}),
            inset 1px 0 0 rgba(255,255,255,${0.18 * glassEdge * strength}),
            inset -1px 0 0 rgba(255,255,255,${0.18 * glassEdge * strength}),
            0 ${8 * strength}px ${34 * strength}px rgba(0,0,0,${0.3 * glassShadow})`,
        border: `1px solid rgba(255,255,255,${0.22 * glassEdge})`,
        borderRadius: radius,
    })

    const plainSurface = (radius: number): any => ({
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.20)",
        borderRadius: radius,
        boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
    })

    const stripStyle: any = {
        position: "absolute",
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: cg,
        padding: showPlate ? pad : 0,
        borderRadius: plateRadius,
        transition: noMotion
            ? "none"
            : "transform 420ms cubic-bezier(.16,1,.3,1)",
        ...(showPlate
            ? glass
                ? glassSurface(plateRadius, 1)
                : plainSurface(plateRadius)
            : {}),
    }

    if (horizontal) {
        Object.assign(stripStyle, {
            flexDirection: "row",
            left: "50%",
            bottom: stripInset,
            transform: `translateX(calc(-50% + ${shift}px))`,
            maxWidth: `calc(100% - ${stripInset * 2}px)`,
        })
    } else {
        Object.assign(stripStyle, {
            flexDirection: "column",
            top: "50%",
            left:
                place === "left"
                    ? stripInset
                    : place === "center"
                      ? "50%"
                      : "auto",
            right: place === "right" ? stripInset : "auto",
            transform:
                place === "center"
                    ? `translate(-50%, calc(-50% + ${shift}px))`
                    : `translateY(calc(-50% + ${shift}px))`,
            maxHeight: `calc(100% - ${stripInset * 2}px)`,
        })
    }

    const active = list[activeIndex] || {}

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                width: "100%",
                height: isStatic ? CANVAS_HEIGHT : wrapperH,
                position: "relative",
                background,
            }}
        >
            {refract && (
                <svg
                    width="0"
                    height="0"
                    aria-hidden="true"
                    focusable="false"
                    style={{ position: "absolute", pointerEvents: "none" }}
                >
                    <filter
                        id={refractId}
                        x="-25%"
                        y="-25%"
                        width="150%"
                        height="150%"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.010 0.016"
                            numOctaves="2"
                            seed="9"
                            result="noise"
                        />
                        <feGaussianBlur in="noise" stdDeviation="5" result="soft" />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="soft"
                            scale={glassRefraction * 26}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </svg>
            )}

            <div
                ref={stageRef}
                tabIndex={isStatic ? -1 : 0}
                onKeyDown={onKeyDown}
                role="region"
                aria-label="Image index. Use arrow keys to move between images."
                style={{
                    position: isStatic ? "relative" : "sticky",
                    top: stickyOffset,
                    height: vh,
                    width: "100%",
                    overflow: "hidden",
                    background,
                }}
            >
                {/* backdrop */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        transform:
                            backdropMotion === "slide"
                                ? `translate3d(0, ${-pos * vh}px, 0)`
                                : "none",
                        willChange: isStatic ? "auto" : "transform",
                    }}
                >
                    {list.map((item: Item, i: number) => {
                        const near = Math.max(0, 1 - Math.abs(pos - i))
                        const src = item.image ? item.image.src || item.image : null
                        const srcSet = item.image ? item.image.srcSet : undefined

                        let layer: any
                        if (backdropMotion === "slide") {
                            layer = { top: i * vh, height: vh, opacity: 1 }
                        } else if (backdropMotion === "fade") {
                            layer = { top: 0, height: vh, opacity: near }
                        } else {
                            layer = {
                                top: 0,
                                height: vh,
                                opacity: near,
                                transform: `scale(${1 + (1 - near) * backdropZoom})`,
                            }
                        }

                        const drift =
                            noMotion || backdropMotion !== "slide"
                                ? 0
                                : (pos - i) * backdropParallax * vh * 0.12

                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    overflow: "hidden",
                                    ...layer,
                                    transition:
                                        noMotion || backdropMotion === "slide"
                                            ? "none"
                                            : "opacity 260ms linear",
                                }}
                            >
                                {src && (
                                    <img
                                        src={src}
                                        srcSet={srcSet}
                                        alt={item.alt || item.title || ""}
                                        loading={isStatic || i < 2 ? "eager" : "lazy"}
                                        decoding="async"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%`,
                                            display: "block",
                                            transform: `translate3d(0, ${drift}px, 0) scale(${1 + backdropParallax * 0.14})`,
                                            willChange: isStatic
                                                ? "auto"
                                                : "transform",
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {scrimOpacity > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            background: scrimColor,
                            opacity: scrimOpacity,
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* filmstrip */}
                <div style={stripStyle}>
                    {list.map((item: Item, i: number) => {
                        const near = Math.max(0, 1 - Math.abs(pos - i))
                        const isActive = i === activeIndex
                        const grow =
                            highlightMode === "continuous"
                                ? 1 + (activeGrow - 1) * near
                                : isActive
                                  ? activeGrow
                                  : 1
                        const op =
                            highlightMode === "continuous"
                                ? inactiveOpacity + (1 - inactiveOpacity) * near
                                : isActive
                                  ? 1
                                  : inactiveOpacity
                        const src = item.image ? item.image.src || item.image : null
                        const innerScale =
                            frameStyle === "lens"
                                ? 1 +
                                  (lensMagnify - 1) *
                                      (highlightMode === "continuous"
                                          ? near
                                          : isActive
                                            ? 1
                                            : 0)
                                : 1

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onCellClick(item, i)}
                                aria-label={item.title || `Image ${i + 1} of ${n}`}
                                aria-current={isActive ? "true" : undefined}
                                tabIndex={isStatic ? -1 : 0}
                                style={{
                                    position: "relative",
                                    width: cw,
                                    height: chh,
                                    padding: 0,
                                    margin: 0,
                                    flex: "0 0 auto",
                                    border: "none",
                                    borderRadius: cellRadius,
                                    overflow: "hidden",
                                    background: "rgba(0,0,0,.14)",
                                    opacity: op,
                                    transform: `scale(${grow})`,
                                    transition: noMotion
                                        ? "none"
                                        : "transform 420ms cubic-bezier(.16,1,.3,1), opacity 380ms ease",
                                    cursor:
                                        cellAction === "none" ? "default" : "pointer",
                                    willChange: isStatic
                                        ? "auto"
                                        : "transform, opacity",
                                    zIndex: isActive ? 2 : 1,
                                }}
                            >
                                {src && (
                                    <img
                                        src={src}
                                        alt=""
                                        loading={isStatic ? "eager" : "lazy"}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: `${item.focalX ?? 50}% ${item.focalY ?? 50}%`,
                                            display: "block",
                                            pointerEvents: "none",
                                            transform: `scale(${innerScale})`,
                                            transition: noMotion
                                                ? "none"
                                                : "transform 520ms cubic-bezier(.16,1,.3,1)",
                                            filter:
                                                refract && isActive
                                                    ? `url(#${refractId})`
                                                    : "none",
                                        }}
                                    />
                                )}

                                {glass && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: cellRadius,
                                            pointerEvents: "none",
                                            backdropFilter: isActive
                                                ? "none"
                                                : `blur(${blur * 0.35}px) saturate(${glassSaturation})`,
                                            WebkitBackdropFilter: isActive
                                                ? "none"
                                                : `blur(${blur * 0.35}px) saturate(${glassSaturation})`,
                                            background: `linear-gradient(145deg,
                                                rgba(255,255,255,${0.26 * glassEdge}) 0%,
                                                rgba(255,255,255,0.02) 42%,
                                                rgba(255,255,255,0.00) 60%,
                                                rgba(255,255,255,${0.14 * glassEdge}) 100%)`,
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,${0.6 * glassEdge}),
                                                inset 0 -1px 0 rgba(255,255,255,${0.18 * glassEdge}),
                                                ${
                                                    isActive && activeBorder > 0
                                                        ? `0 0 0 ${activeBorder}px ${activeBorderColor}`
                                                        : "0 0 0 0 rgba(0,0,0,0)"
                                                }`,
                                            border: `1px solid rgba(255,255,255,${(isActive ? 0.42 : 0.18) * glassEdge})`,
                                            transition: noMotion
                                                ? "none"
                                                : "box-shadow 380ms ease, border-color 380ms ease",
                                        }}
                                    />
                                )}

                                {glass && pointerLight && wide && !isStatic && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: cellRadius,
                                            pointerEvents: "none",
                                            background: `radial-gradient(120% 90% at var(--fi-lx, 50%) var(--fi-ly, 30%),
                                                rgba(255,255,255,${0.3 * glassEdge}) 0%,
                                                rgba(255,255,255,0.06) 30%,
                                                rgba(255,255,255,0) 62%)`,
                                            mixBlendMode: "screen",
                                        }}
                                    />
                                )}

                                {!glass && isActive && activeBorder > 0 && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: cellRadius,
                                            border: `${activeBorder}px solid ${activeBorderColor}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {showCaption && active.title && (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 4,
                            left: place === "left" ? "auto" : stripInset,
                            right: place === "left" ? stripInset : "auto",
                            bottom: horizontal
                                ? stripInset * 2 + chh + pad * 2
                                : stripInset,
                            maxWidth: `calc(100% - ${stripInset * 2}px)`,
                            color: captionColor,
                            ...captionFont,
                            pointerEvents: "none",
                            padding: captionGlass ? "10px 16px" : 0,
                            ...(captionGlass
                                ? glass
                                    ? glassSurface(999, 0.8)
                                    : plainSurface(999)
                                : {}),
                            textShadow: captionGlass
                                ? "none"
                                : "0 1px 18px rgba(0,0,0,.45)",
                        }}
                    >
                        {active.title}
                    </div>
                )}

                {showCounter && (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 4,
                            top: stripInset,
                            right: stripInset,
                            color: captionColor,
                            ...counterFont,
                            pointerEvents: "none",
                            fontVariantNumeric: "tabular-nums",
                            padding: captionGlass ? "7px 13px" : 0,
                            ...(captionGlass
                                ? glass
                                    ? glassSurface(999, 0.8)
                                    : plainSurface(999)
                                : {}),
                            textShadow: captionGlass
                                ? "none"
                                : "0 1px 18px rgba(0,0,0,.45)",
                        }}
                    >
                        {String(activeIndex + 1).padStart(2, "0")} /{" "}
                        {String(n).padStart(2, "0")}
                    </div>
                )}

                {/* the rail moves to the opposite edge so it never sits under
                    a right-placed strip */}
                {showRail && (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 4,
                            right: place === "right" ? "auto" : 0,
                            left: place === "right" ? 0 : "auto",
                            top: 0,
                            bottom: 0,
                            width: 2,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: `${p * 100}%`,
                                background: railColor,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(FilmstripIndex, {
    /* ---- content ---- */
    items: {
        type: ControlType.Array,
        title: "Items",
        defaultValue: [],
        description:
            "Each item is one full screen plus one thumbnail. Three to twelve works best.",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "",
                    description:
                        "Read by screen readers. Falls back to the caption.",
                },
                focalX: {
                    type: ControlType.Number,
                    title: "Focal X",
                    min: 0,
                    max: 100,
                    step: 1,
                    defaultValue: 50,
                    unit: "%",
                    description:
                        "Which part of the image survives the crop on narrow screens.",
                },
                focalY: {
                    type: ControlType.Number,
                    title: "Focal Y",
                    min: 0,
                    max: 100,
                    step: 1,
                    defaultValue: 50,
                    unit: "%",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },

    /* ---- scroll ---- */
    scrollPace: {
        type: ControlType.Number,
        title: "Scroll Pace",
        min: 0.4,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        description: "Screens of scrolling per image. Higher lets people linger.",
    },
    stickyOffset: {
        type: ControlType.Number,
        title: "Nav Offset",
        min: 0,
        max: 200,
        step: 2,
        defaultValue: 0,
        unit: "px",
        description:
            "Set this to the height of your fixed header, if you have one.",
    },

    /* ---- backdrop ---- */
    backdropMotion: {
        type: ControlType.Enum,
        title: "Backdrop",
        options: ["slide", "fade", "zoom"],
        optionTitles: ["Slide", "Crossfade", "Zoom fade"],
        defaultValue: "slide",
        displaySegmentedControl: true,
    },
    backdropParallax: {
        type: ControlType.Number,
        title: "Parallax",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (p: P) => p.backdropMotion !== "slide",
        description: "The image drifts slower than its frame. Adds depth.",
    },
    backdropZoom: {
        type: ControlType.Number,
        title: "Zoom Amount",
        min: 0,
        max: 0.5,
        step: 0.02,
        defaultValue: 0.12,
        hidden: (p: P) => p.backdropMotion !== "zoom",
    },
    scrimColor: {
        type: ControlType.Color,
        title: "Scrim",
        defaultValue: "#000000",
    },
    scrimOpacity: {
        type: ControlType.Number,
        title: "Scrim Opacity",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.18,
        description:
            "Keeps thumbnails and captions legible on bright photography. Keep above 0.12.",
    },

    /* ---- material ---- */
    frameStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["plain", "glass", "lens"],
        optionTitles: ["Plain", "Glass", "Lens"],
        defaultValue: "glass",
        displaySegmentedControl: true,
        description:
            "Lens magnifies and refracts the active image so the cell behaves like real glass.",
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 14,
        unit: "px",
        hidden: (p: P) => p.frameStyle === "plain",
    },
    glassSaturation: {
        type: ControlType.Number,
        title: "Saturation",
        min: 1,
        max: 3,
        step: 0.05,
        defaultValue: 1.7,
        hidden: (p: P) => p.frameStyle === "plain",
        description:
            "Glass intensifies colour. Above 1.6 is where it stops reading as frosted plastic.",
    },
    glassTint: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "rgba(255,255,255,0.06)",
        hidden: (p: P) => p.frameStyle === "plain",
        description: "Keep this mostly transparent. An opaque tint kills the glass.",
    },
    glassEdge: {
        type: ControlType.Number,
        title: "Edge Light",
        min: 0,
        max: 1.6,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: P) => p.frameStyle === "plain",
        description:
            "Strength of the specular rim. This is what sells the material.",
    },
    glassShadow: {
        type: ControlType.Number,
        title: "Lift",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
        hidden: (p: P) => p.frameStyle === "plain",
    },
    glassRefraction: {
        type: ControlType.Number,
        title: "Refraction",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
        hidden: (p: P) => p.frameStyle !== "lens",
        description: "Warps the image at the lens edge. Desktop only.",
    },
    lensMagnify: {
        type: ControlType.Number,
        title: "Magnify",
        min: 1,
        max: 2,
        step: 0.05,
        defaultValue: 1.25,
        hidden: (p: P) => p.frameStyle !== "lens",
    },
    pointerLight: {
        type: ControlType.Boolean,
        title: "Pointer Light",
        defaultValue: true,
        hidden: (p: P) => p.frameStyle === "plain",
        description: "Highlight tracks the cursor. Desktop only.",
    },

    /* ---- plate ---- */
    showPlate: {
        type: ControlType.Boolean,
        title: "Plate",
        defaultValue: true,
        description:
            "A single glass panel behind the strip. Off gives floating thumbnails.",
    },
    platePadding: {
        type: ControlType.Number,
        title: "Plate Padding",
        min: 0,
        max: 40,
        step: 2,
        defaultValue: 10,
        unit: "px",
        hidden: (p: P) => !p.showPlate,
    },
    plateRadius: {
        type: ControlType.Number,
        title: "Plate Radius",
        min: 0,
        max: 60,
        step: 2,
        defaultValue: 22,
        unit: "px",
        hidden: (p: P) => !p.showPlate,
    },

    /* ---- strip ---- */
    stripPlacement: {
        type: ControlType.Enum,
        title: "Strip",
        options: ["left", "center", "right", "bottom"],
        optionTitles: ["Left", "Centre", "Right", "Bottom"],
        defaultValue: "center",
    },
    stripInset: {
        type: ControlType.Number,
        title: "Inset",
        min: 8,
        max: 120,
        step: 4,
        defaultValue: 32,
        unit: "px",
    },
    cellWidth: {
        type: ControlType.Number,
        title: "Cell Width",
        min: 24,
        max: 260,
        step: 2,
        defaultValue: 84,
        unit: "px",
        description:
            "A maximum. Cells shrink to fit rather than overflow narrow screens.",
    },
    cellHeight: {
        type: ControlType.Number,
        title: "Cell Height",
        min: 24,
        max: 320,
        step: 2,
        defaultValue: 104,
        unit: "px",
    },
    cellGap: {
        type: ControlType.Number,
        title: "Cell Gap",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 6,
        unit: "px",
    },
    cellRadius: {
        type: ControlType.Number,
        title: "Cell Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.72,
    },

    /* ---- highlight ---- */
    highlightMode: {
        type: ControlType.Enum,
        title: "Highlight",
        options: ["snap", "continuous", "reticle"],
        optionTitles: ["Snap", "Continuous", "Reticle"],
        defaultValue: "snap",
        description:
            "Snap jumps cell to cell. Continuous grows smoothly between them. Reticle holds the frame still and slides the strip behind it.",
    },
    activeGrow: {
        type: ControlType.Number,
        title: "Active Scale",
        min: 1,
        max: 2,
        step: 0.02,
        defaultValue: 1.3,
    },
    activeBorder: {
        type: ControlType.Number,
        title: "Active Ring",
        min: 0,
        max: 8,
        step: 1,
        defaultValue: 2,
        unit: "px",
    },
    activeBorderColor: {
        type: ControlType.Color,
        title: "Ring Color",
        defaultValue: "rgba(255,255,255,0.85)",
    },
    cellAction: {
        type: ControlType.Enum,
        title: "Cell Click",
        options: ["jump", "link", "none"],
        optionTitles: ["Jump", "Open link", "Nothing"],
        defaultValue: "jump",
        displaySegmentedControl: true,
        description:
            "Jump scrolls to that image, and opens the link if the cell is already active.",
    },

    /* ---- overlays ---- */
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultValue: {
            fontSize: 15,
            lineHeight: "1.4em",
            letterSpacing: "-0.01em",
        },
        hidden: (p: P) => !p.showCaption,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    captionGlass: {
        type: ControlType.Boolean,
        title: "Glass Pills",
        defaultValue: true,
        description:
            "Sets caption and counter on glass instead of relying on text shadow.",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",
        controls: "extended",
        defaultValue: {
            fontSize: 12,
            lineHeight: "1em",
            letterSpacing: "0.06em",
        },
        hidden: (p: P) => !p.showCounter,
    },
    showRail: {
        type: ControlType.Boolean,
        title: "Progress Rail",
        defaultValue: true,
    },
    railColor: {
        type: ControlType.Color,
        title: "Rail Color",
        defaultValue: "rgba(255,255,255,0.9)",
        hidden: (p: P) => !p.showRail,
    },

    /* ---- responsive ---- */
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Below",
        min: 600,
        max: 1400,
        step: 10,
        defaultValue: 1100,
        unit: "px",
        description:
            "Between this and Mobile Below, cells use the tablet scale and keep the desktop placement.",
    },
    tabletCellScale: {
        type: ControlType.Number,
        title: "Tablet Cell Scale",
        min: 0.3,
        max: 1,
        step: 0.02,
        defaultValue: 0.8,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        min: 380,
        max: 1200,
        step: 10,
        defaultValue: 810,
        unit: "px",
        description: "Width at which the strip switches to its mobile placement.",
    },
    mobileStripPlacement: {
        type: ControlType.Enum,
        title: "Mobile Strip",
        options: ["left", "center", "right", "bottom"],
        optionTitles: ["Left", "Centre", "Right", "Bottom"],
        defaultValue: "bottom",
    },
    mobileCellScale: {
        type: ControlType.Number,
        title: "Mobile Cell Scale",
        min: 0.3,
        max: 1,
        step: 0.02,
        defaultValue: 0.6,
    },

    /* ---- editor ---- */
    previewProgress: {
        type: ControlType.Number,
        title: "Canvas Preview",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.35,
        description:
            "Which scroll position shows on the Framer canvas. No effect on the live site.",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0C",
    },
})
