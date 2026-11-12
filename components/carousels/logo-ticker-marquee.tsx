import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
} from "framer-motion"

// Logo Ticker — v1
//
// A continuous marquee of logos and/or text with deep appearance control.
//
// MONOTONE: any multicolor logo can be forced to one flat color. This uses
// CSS mask-image — the asset's ALPHA channel becomes a stencil and a flat
// background color is painted through it. This means the source asset must
// have a TRANSPARENT background (PNG/SVG). An opaque JPG will mask to a solid
// rectangle. "Reveal on hover" renders the untouched <img> beneath the mask
// and cross-fades opacity, so original colors return with no repaint.
//
// LOOP: one set of items is measured, then duplicated enough times to overfill
// the container. A single motion value is wrapped over [-period, 0] so the
// track is always seamless in both directions, including while dragged.
//
// PERFORMANCE: one rAF loop drives one motion value writing to `transform`.
// No per-frame React state, no layout thrash. Frozen entirely on the Framer
// canvas/export via useIsStaticRenderer, and under prefers-reduced-motion.
//
// ACCESSIBILITY: duplicated sets are aria-hidden with unfocusable links, so
// screen readers and keyboard users get each logo exactly once. Motion pauses
// on hover AND focus (WCAG 2.2.2 Pause/Stop/Hide).

interface Item {
    image: string
    text: string
    link: string
    alt: string
}

interface Props {
    items: Item[]
    layout: {
        direction: "horizontal" | "vertical"
        reverse: boolean
        sizing: "height" | "box"
        logoHeight: number
        logoWidth: number
        gap: number
        align: "start" | "center" | "end"
        textPosition: "right" | "below"
        textGap: number
    }
    appearance: {
        tint: "original" | "mono" | "gray"
        monoColor: string
        revealOnHover: boolean
        opacity: number
        padding: string
        background: string
        radius: string
        border: any
        shadow: string
    }
    ticker: {
        speed: number
        hoverSpeed: number
        draggable: boolean
        momentum: boolean
    }
    edges: {
        overflow: "hidden" | "visible" | "clip" | "scroll" | "auto"
        fade: boolean
        fadeMode: "mask" | "color"
        fadeColor: string
        fadeSize: number
        fadeOffset: number
        steer: boolean
        steerZone: number
        steerBoost: number
    }
    reveal: {
        mode: "none" | "entrance" | "exit" | "both"
        zone: number
        blur: number
        xOffset: number
        yOffset: number
        scaleFrom: number
    }
    hover: {
        effect: "none" | "grow" | "lift" | "dim"
        transition: any
        dimAmount: number
    }
    typography: {
        font: any
        color: string
    }
}

const wrap = (min: number, max: number, v: number) => {
    const r = max - min
    return ((((v - min) % r) + r) % r) + min
}

const ALIGN: Record<string, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

interface CellProps {
    offset: any
    isH: boolean
    reverse: boolean
    containerSize: number
    reveal: Props["reveal"]
    frozen: boolean
    className: string
    children?: React.ReactNode
}

/**
 * One ticker cell.
 *
 * Reveal is computed from the cell's CURRENT SCREEN POSITION rather than from
 * per-cell animation state. That's what makes it survive the loop seam: when
 * the track wraps, a different copy occupies the same screen position, and
 * because opacity is a pure function of that position, it computes the same
 * value. The swap is invisible instead of causing a pop.
 *
 * All of this runs through motion values, so it updates without re-rendering.
 */
function Cell({
    offset,
    isH,
    reverse,
    containerSize,
    reveal,
    frozen,
    className,
    children,
}: CellProps) {
    const ref = useRef<HTMLLIElement>(null)
    const geo = useRef({ pos: 0, size: 0 })

    useEffect(() => {
        const measure = () => {
            const el = ref.current
            if (!el) return
            // offsetLeft/Top are LAYOUT positions — unaffected by the track's
            // transform — which is exactly the static anchor we need.
            geo.current.pos = isH ? el.offsetLeft : el.offsetTop
            geo.current.size = isH ? el.offsetWidth : el.offsetHeight
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (ref.current) ro.observe(ref.current)
        return () => ro.disconnect()
    }, [isH, children])

    const visibility = useTransform(offset, (o: number) => {
        if (frozen || reveal.mode === "none" || containerSize <= 0) return 1
        const center = geo.current.pos + o + geo.current.size / 2
        const zone = Math.max(reveal.zone, 1)
        const distStart = center
        const distEnd = containerSize - center
        // Forward scroll enters from the end edge and exits at the start.
        const enterDist = reverse ? distStart : distEnd
        const exitDist = reverse ? distEnd : distStart
        const doEnter = reveal.mode === "entrance" || reveal.mode === "both"
        const doExit = reveal.mode === "exit" || reveal.mode === "both"
        const enterT = doEnter ? clamp01(enterDist / zone) : 1
        const exitT = doExit ? clamp01(exitDist / zone) : 1
        return Math.min(enterT, exitT)
    })

    const opacity = useTransform(visibility, (v: number) => v)
    const filter = useTransform(visibility, (v: number) =>
        reveal.blur > 0
            ? `blur(${((1 - v) * reveal.blur).toFixed(2)}px)`
            : "none"
    )
    const scale = useTransform(
        visibility,
        (v: number) => reveal.scaleFrom + (1 - reveal.scaleFrom) * v
    )
    const x = useTransform(visibility, (v: number) => reveal.xOffset * (1 - v))
    const y = useTransform(visibility, (v: number) => reveal.yOffset * (1 - v))

    return (
        <motion.li
            ref={ref}
            className={className}
            style={{
                display: "inline-flex",
                listStyle: "none",
                opacity,
                filter,
                scale,
                x,
                y,
            }}
        >
            {children}
        </motion.li>
    )
}

/**
 * Marketplace requirement: components must have a sensible default size so
 * they appear correctly the moment they're dragged onto a blank canvas.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 64
 */
export default function LogoTicker(props: Props) {
    const {
        items,
        layout,
        appearance,
        ticker,
        edges,
        reveal,
        hover,
        typography,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const frozen = isStatic || prefersReduced

    const isH = layout.direction === "horizontal"

    const containerRef = useRef<HTMLDivElement>(null)
    const setRef = useRef<HTMLUListElement>(null)

    const [setSize, setSetSize] = useState(0)
    // Container size is measured ONLY to compute reveal opacity from screen
    // position. It must never feed anything that affects layout — deriving
    // copy count from it is what caused the runaway-width loop earlier.
    const [containerSize, setContainerSize] = useState(0)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    // Framer review requirement: the rAF loop must not keep running while the
    // component is scrolled out of the page viewport.
    const [inViewport, setInViewport] = useState(true)
    // Dim needs to know which sibling is hovered, so it lives in state.
    // Only changes on hover, never per frame — no animation cost.
    const [hoveredKey, setHoveredKey] = useState<string | null>(null)

    const offset = useMotionValue(0)
    const offsetRef = useRef(0)
    const dragRef = useRef({
        pending: false,
        active: false,
        start: 0,
        last: 0,
        velocity: 0,
        lastTime: 0,
    })
    // True only if the pointer actually moved past the drag threshold, so a
    // real drag can suppress the click that would otherwise follow it.
    const didDragRef = useRef(false)
    const DRAG_THRESHOLD = 4
    const momentumRef = useRef(0)
    const steerRef = useRef(0) // -1..1 proximity to an edge

    const uid = useRef(`lt-${Math.random().toString(36).slice(2, 8)}`).current

    // Only measure the SET, never the container. The set's own intrinsic
    // size never depends on how many copies exist elsewhere in the track, so
    // this cannot create a feedback loop. (Measuring the container to decide
    // copy count is exactly what caused runaway growth — see copies below.)
    useEffect(() => {
        const measure = () => {
            if (setRef.current) {
                setSetSize(
                    isH
                        ? setRef.current.offsetWidth
                        : setRef.current.offsetHeight
                )
            }
            if (containerRef.current) {
                setContainerSize(
                    isH
                        ? containerRef.current.offsetWidth
                        : containerRef.current.offsetHeight
                )
            }
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (setRef.current) ro.observe(setRef.current)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [isH, items, layout.logoHeight, layout.logoWidth, layout.gap])

    const period = setSize + layout.gap

    // Copy count is deliberately NOT derived from the container's measured
    // width. Doing so creates a resize feedback loop: if the Framer frame is
    // set to "Fit content" (hug), the frame's size is determined by the
    // track's rendered width — but the track's width is determined by copy
    // count, which was being derived from the frame's measured size. Each
    // measurement nudges the frame bigger, which triggers another
    // measurement, forever. Using a generous fixed assumption instead (an
    // ultra-wide 3200px viewport) breaks that circularity completely: copies
    // is now a pure function of the logo set's own size, which never changes
    // in response to our own output.
    const ASSUMED_MAX_CONTAINER = 3200
    const MAX_COPIES = 24
    const copies = useMemo(() => {
        if (period <= 0) return 2
        return Math.min(
            MAX_COPIES,
            Math.max(2, Math.ceil(ASSUMED_MAX_CONTAINER / period) + 1)
        )
    }, [period])

    // Pause everything when the component leaves the page viewport. Without
    // this the rAF loop keeps ticking forever on long pages — which is what
    // Framer's review flagged.
    useEffect(() => {
        if (frozen) return
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => setInViewport(entries[0].isIntersecting),
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [frozen])

    useAnimationFrame((_t, delta) => {
        // Bail out entirely when offscreen: no ticker math, no momentum, no
        // motion value writes.
        if (frozen || !inViewport || period <= 0) return

        // Read drag state live — refs don't trigger re-renders, so computing
        // this during render would capture a stale value in this closure.
        // Focus and drag still hard-stop; hover now scales speed instead of
        // being all-or-nothing. hoverSpeed 0 == the old pause-on-hover.
        const stopped = focused || dragRef.current.active
        const hoverFactor = hovered
            ? Math.min(Math.max(ticker.hoverSpeed, 0), 100) / 100
            : 1
        const paused = stopped || hoverFactor === 0

        let move = 0
        if (!paused) {
            const dir = layout.reverse ? 1 : -1
            let speed = ticker.speed * hoverFactor
            // Edge steer: nudge/boost toward whichever edge the pointer nears.
            if (edges.steer && steerRef.current !== 0) {
                speed =
                    ticker.speed *
                    hoverFactor *
                    edges.steerBoost *
                    Math.abs(steerRef.current)
                move = Math.sign(steerRef.current) * speed * (delta / 1000)
            } else {
                move = dir * speed * (delta / 1000)
            }
        }

        // Momentum after a drag release. Decay is exponential in *time*, not
        // per-frame — a flat per-frame multiplier would decay twice as fast on
        // a 120Hz display as on 60Hz.
        if (
            ticker.momentum &&
            !dragRef.current.active &&
            momentumRef.current !== 0
        ) {
            move += momentumRef.current * (delta / 1000)
            momentumRef.current *= Math.pow(0.002, delta / 1000)
            if (Math.abs(momentumRef.current) < 1) momentumRef.current = 0
        }

        if (move !== 0) {
            offsetRef.current = wrap(-period, 0, offsetRef.current + move)
            offset.set(offsetRef.current)
        }
    })

    // Pointer handlers: drag + edge steer share one move listener.
    const onPointerDown = (e: React.PointerEvent) => {
        if (!ticker.draggable || frozen) return
        // Deliberately NOT calling setPointerCapture here. Capturing on
        // pointerdown redirects pointerup to the container, which means the
        // click event never reaches the <a> — links looked dead on left
        // click while right-click (which reads href directly) still worked.
        // Capture is deferred until the pointer actually moves.
        dragRef.current.pending = true
        dragRef.current.active = false
        dragRef.current.start = isH ? e.clientX : e.clientY
        dragRef.current.last = dragRef.current.start
        dragRef.current.lastTime = performance.now()
        dragRef.current.velocity = 0
        didDragRef.current = false
        momentumRef.current = 0
    }

    const onPointerMove = (e: React.PointerEvent) => {
        // Edge steer proximity
        if (edges.steer && containerRef.current && !frozen) {
            const rect = containerRef.current.getBoundingClientRect()
            const pos = isH ? e.clientX - rect.left : e.clientY - rect.top
            const size = isH ? rect.width : rect.height
            const zone = Math.max(edges.steerZone, 1)
            if (pos < zone) {
                steerRef.current = 1 - pos / zone // → positive, scroll right/down
            } else if (pos > size - zone) {
                steerRef.current = -(1 - (size - pos) / zone)
            } else {
                steerRef.current = 0
            }
        }

        const current = isH ? e.clientX : e.clientY

        // Promote a pending press into a real drag only after real movement.
        // Below the threshold this stays a click and the link still works.
        if (dragRef.current.pending && !dragRef.current.active) {
            if (Math.abs(current - dragRef.current.start) <= DRAG_THRESHOLD)
                return
            dragRef.current.active = true
            didDragRef.current = true
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        }

        if (!dragRef.current.active || period <= 0) return
        const now = performance.now()
        const d = current - dragRef.current.last
        const dt = Math.max(now - dragRef.current.lastTime, 1)
        dragRef.current.last = current
        dragRef.current.lastTime = now
        // px/s from real elapsed time, not an assumed frame rate.
        dragRef.current.velocity = (d / dt) * 1000
        offsetRef.current = wrap(-period, 0, offsetRef.current + d)
        offset.set(offsetRef.current)
    }

    const endDrag = () => {
        dragRef.current.pending = false
        if (!dragRef.current.active) return
        dragRef.current.active = false
        if (ticker.momentum) momentumRef.current = dragRef.current.velocity
    }

    const onPointerLeave = () => {
        setHovered(false)
        steerRef.current = 0
        endDrag()
    }

    // ---- item rendering -------------------------------------------------

    // The tint reveal is a CSS cross-fade, so it needs a concrete duration.
    // Springs don't have one, so fall back to a sensible default.
    const revealDur =
        typeof hover.transition?.duration === "number"
            ? hover.transition.duration
            : 0.3

    const boxStyle: React.CSSProperties =
        layout.sizing === "box"
            ? { width: layout.logoWidth, height: layout.logoHeight }
            : { height: layout.logoHeight, width: "auto" }

    const renderLogo = (item: Item, key: string) => {
        if (!item.image) return null
        // NOTE: opacity/filter deliberately live in the <style> block, NOT
        // inline. Inline styles outrank stylesheet rules, so setting opacity
        // here would make the :hover reveal rule impossible to apply — the
        // mask would fade out while the image stayed hidden, leaving a blank.
        const imgStyle: React.CSSProperties = {
            display: "block",
            height: "100%",
            width: layout.sizing === "box" ? "100%" : "auto",
            objectFit: "contain",
        }
        return (
            <span
                key={key}
                className={`${uid}-logo`}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    flexShrink: 0,
                    ...boxStyle,
                }}
            >
                <img
                    src={item.image}
                    alt=""
                    draggable={false}
                    decoding="async"
                    loading="lazy"
                    className={`${uid}-img`}
                    style={imgStyle}
                />
                {appearance.tint === "mono" && (
                    <span
                        aria-hidden="true"
                        className={`${uid}-mask`}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: appearance.monoColor,
                            WebkitMaskImage: `url("${item.image}")`,
                            maskImage: `url("${item.image}")`,
                            WebkitMaskSize: "contain",
                            maskSize: "contain",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                        }}
                    />
                )}
            </span>
        )
    }

    const renderItem = (
        item: Item,
        i: number,
        ghost: boolean,
        copyIndex: number
    ) => {
        const hasImg = !!item.image
        const hasText = !!item.text
        if (!hasImg && !hasText) return null

        const inner = (
            <>
                {renderLogo(item, `l${i}`)}
                {hasText && (
                    <span
                        style={{
                            ...typography.font,
                            color: typography.color,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {item.text}
                    </span>
                )}
            </>
        )

        const content = (
            <span
                style={{
                    display: "inline-flex",
                    flexDirection:
                        layout.textPosition === "below" ? "column" : "row",
                    alignItems: "center",
                    justifyContent: "center",
                    // Text-only items have no logo box, so without this they
                    // collapse to line-height and sit shorter than image
                    // items. This gives every cell the same height floor.
                    minHeight: layout.logoHeight,
                    gap: hasImg && hasText ? layout.textGap : 0,
                }}
            >
                {inner}
            </span>
        )

        const label = item.alt || item.text || undefined

        const cellStyle: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: appearance.padding,
            background: appearance.background,
            borderRadius: appearance.radius,
            boxShadow: appearance.shadow,
            opacity: appearance.opacity,
            textDecoration: "none",
            color: "inherit",
            cursor:
                item.link && !ghost
                    ? "pointer"
                    : ticker.draggable
                      ? "grab"
                      : "default",
            ...(appearance.border ?? {}),
        }

        const cellKey = `${copyIndex}-${i}`

        // HOVER lives on a nested div — a DIFFERENT element from the one the
        // Cell wrapper animates for reveal. Both write inline transforms, so
        // sharing one element would make whichever ran last silently win.
        const isDimmed =
            hover.effect === "dim" &&
            hoveredKey !== null &&
            hoveredKey !== cellKey

        const hoverVariant =
            frozen || hover.effect === "none"
                ? undefined
                : hover.effect === "grow"
                  ? { scale: 1.08 }
                  : hover.effect === "lift"
                    ? isH
                        ? { y: -8 }
                        : { x: -8 }
                    : undefined // dim is handled via animate, not whileHover

        // A drag that passes over a link must not navigate on release.
        const suppressClickAfterDrag = (e: React.MouseEvent) => {
            if (didDragRef.current) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        const body = item.link ? (
            <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                tabIndex={ghost ? -1 : undefined}
                style={cellStyle}
                onClick={suppressClickAfterDrag}
                onDragStart={(e) => e.preventDefault()}
            >
                {content}
            </a>
        ) : (
            <span
                style={cellStyle}
                aria-label={label}
                role={label ? "img" : undefined}
            >
                {content}
            </span>
        )

        return (
            <Cell
                key={i}
                offset={offset}
                isH={isH}
                reverse={layout.reverse}
                containerSize={containerSize}
                reveal={reveal}
                frozen={frozen}
                className={`${uid}-cell`}
            >
                <motion.div
                    style={{ display: "inline-flex" }}
                    onHoverStart={
                        hover.effect === "dim"
                            ? () => setHoveredKey(cellKey)
                            : undefined
                    }
                    onHoverEnd={
                        hover.effect === "dim"
                            ? () => setHoveredKey(null)
                            : undefined
                    }
                    animate={
                        hover.effect === "dim" && !frozen
                            ? { opacity: isDimmed ? hover.dimAmount : 1 }
                            : undefined
                    }
                    whileHover={hoverVariant}
                    transition={hover.transition}
                >
                    {body}
                </motion.div>
            </Cell>
        )
    }

    const renderSet = (copyIndex: number) => (
        <ul
            key={copyIndex}
            ref={copyIndex === 0 ? setRef : undefined}
            aria-hidden={copyIndex > 0 ? true : undefined}
            style={{
                display: "flex",
                flexDirection: isH ? "row" : "column",
                alignItems: ALIGN[layout.align],
                gap: layout.gap,
                margin: 0,
                padding: 0,
                listStyle: "none",
                flexShrink: 0,
            }}
        >
            {items.map((item, i) =>
                renderItem(item, i, copyIndex > 0, copyIndex)
            )}
        </ul>
    )

    // Mask mode fades to true transparency over any background.
    // Color mode fades using overlay gradients instead, which requires
    // matching the section's background color but avoids putting a mask on
    // the container.
    const useMaskFade = edges.fade && edges.fadeMode === "mask"
    const useColorFade = edges.fade && edges.fadeMode === "color"

    const fadeMask = useMaskFade
        ? `linear-gradient(${isH ? "to right" : "to bottom"}, transparent ${edges.fadeOffset}px, #000 ${edges.fadeOffset + edges.fadeSize}px, #000 calc(100% - ${edges.fadeOffset + edges.fadeSize}px), transparent calc(100% - ${edges.fadeOffset}px))`
        : undefined

    if (items.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: layout.logoHeight + 24,
                    width: "100%",
                    ...typography.font,
                    color: typography.color,
                    opacity: 0.5,
                }}
            >
                Add a logo to begin
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="Logo ticker"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={onPointerLeave}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={() => setFocused(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
                position: "relative",
                width: "100%",
                // Must be a real height, not "auto". When the container hugs
                // its content there is zero spare space on the cross axis, so
                // align start/center/end all resolve identically — which is
                // why alignment appeared to do nothing.
                height: "100%",
                minHeight: isH ? layout.logoHeight : undefined,
                overflow: edges.overflow,
                WebkitMaskImage: fadeMask,
                maskImage: fadeMask,
                touchAction: ticker.draggable
                    ? isH
                        ? "pan-y"
                        : "pan-x"
                    : undefined,
                cursor: ticker.draggable ? "grab" : undefined,
            }}
        >
            <style>{`
                /* Base tint state and the hover reveal BOTH live here on
                   purpose. If the base state were inline it would outrank the
                   :hover rule and the reveal could never take effect — the
                   mask would fade out while the image stayed hidden, showing
                   nothing at all. As stylesheet rules, :hover simply wins on
                   specificity. */
                .${uid}-img {
                    opacity: ${appearance.tint === "mono" ? 0 : 1};
                    filter: ${appearance.tint === "gray" ? "grayscale(1)" : "none"};
                    transition: opacity ${revealDur}s ease, filter ${revealDur}s ease;
                }
                .${uid}-mask {
                    opacity: 1;
                    transition: opacity ${revealDur}s ease;
                }
                ${
                    appearance.revealOnHover
                        ? `
                .${uid}-cell:hover .${uid}-img {
                    opacity: 1;
                    filter: none;
                }
                .${uid}-cell:hover .${uid}-mask {
                    opacity: 0;
                }`
                        : ""
                }
            `}</style>

            <motion.div
                style={{
                    display: "flex",
                    flexDirection: isH ? "row" : "column",
                    alignItems: ALIGN[layout.align],
                    gap: layout.gap,
                    width: isH ? "max-content" : "100%",
                    // Full height on the cross axis so alignItems has room.
                    height: isH ? "100%" : "max-content",
                    willChange: "transform",
                    ...(isH ? { x: offset } : { y: offset }),
                }}
            >
                {Array.from({ length: copies }, (_, c) => renderSet(c))}
            </motion.div>

            {useColorFade && (
                <>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            ...(isH
                                ? {
                                      bottom: 0,
                                      left: edges.fadeOffset,
                                      width: edges.fadeSize,
                                  }
                                : {
                                      right: 0,
                                      top: edges.fadeOffset,
                                      height: edges.fadeSize,
                                  }),
                            background: `linear-gradient(${isH ? "to right" : "to bottom"}, ${edges.fadeColor}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            ...(isH
                                ? {
                                      top: 0,
                                      bottom: 0,
                                      right: edges.fadeOffset,
                                      width: edges.fadeSize,
                                  }
                                : {
                                      left: 0,
                                      right: 0,
                                      bottom: edges.fadeOffset,
                                      height: edges.fadeSize,
                                  }),
                            background: `linear-gradient(${isH ? "to left" : "to top"}, ${edges.fadeColor}, transparent)`,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )}
        </div>
    )
}

const defaultProps: Props = {
    items: [
        { image: "", text: "Logo One", link: "", alt: "" },
        { image: "", text: "Logo Two", link: "", alt: "" },
        { image: "", text: "Logo Three", link: "", alt: "" },
        { image: "", text: "Logo Four", link: "", alt: "" },
        { image: "", text: "Logo Five", link: "", alt: "" },
    ],
    layout: {
        direction: "horizontal",
        reverse: false,
        sizing: "height",
        logoHeight: 32,
        logoWidth: 120,
        gap: 56,
        align: "center",
        textPosition: "right",
        textGap: 10,
    },
    appearance: {
        tint: "original",
        monoColor: "#8A8F98",
        revealOnHover: false,
        opacity: 1,
        padding: "0px",
        background: "transparent",
        radius: "0px",
        border: undefined,
        shadow: "",
    },
    ticker: {
        speed: 60,
        hoverSpeed: 0,
        draggable: true,
        momentum: true,
    },
    edges: {
        overflow: "hidden",
        fade: true,
        fadeMode: "mask",
        fadeColor: "#FFFFFF",
        fadeSize: 64,
        fadeOffset: 0,
        steer: false,
        steerZone: 120,
        steerBoost: 3,
    },
    reveal: {
        mode: "both",
        zone: 120,
        blur: 0,
        xOffset: 0,
        yOffset: 0,
        scaleFrom: 1,
    },
    hover: {
        effect: "none",
        transition: { type: "spring", stiffness: 400, damping: 28 },
        dimAmount: 0.35,
    },
    typography: {
        font: {
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 600,
        },
        color: "#111318",
    },
}

LogoTicker.defaultProps = defaultProps

addPropertyControls(LogoTicker, {
    items: {
        type: ControlType.Array,
        title: "Logos",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Use a transparent PNG/SVG for Mono tint",
                },
                text: { type: ControlType.String, title: "Text" },
                link: { type: ControlType.Link, title: "Link" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    placeholder: "Screen reader label",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["horizontal", "vertical"],
                optionTitles: ["Horiz", "Vert"],
                displaySegmentedControl: true,
            },
            reverse: {
                type: ControlType.Boolean,
                title: "Reverse",
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            sizing: {
                type: ControlType.Enum,
                title: "Sizing",
                options: ["height", "box"],
                optionTitles: ["Height", "Box"],
                displaySegmentedControl: true,
                description: "Box = identical footprint for every logo",
            },
            logoHeight: {
                type: ControlType.Number,
                title: "Height",
                min: 8,
                max: 240,
                step: 1,
                unit: "px",
            },
            logoWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 8,
                max: 480,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.sizing !== "box",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                displaySegmentedControl: true,
            },
            textPosition: {
                type: ControlType.Enum,
                title: "Text at",
                options: ["right", "below"],
                optionTitles: ["Right", "Below"],
                displaySegmentedControl: true,
            },
            textGap: {
                type: ControlType.Number,
                title: "Text gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            tint: {
                type: ControlType.Enum,
                title: "Tint",
                options: ["original", "mono", "gray"],
                optionTitles: ["None", "Mono", "Gray"],
                displaySegmentedControl: true,
                description: "Mono forces any logo to one flat color",
            },
            monoColor: {
                type: ControlType.Color,
                title: "Color",
                hidden: (p: any) => p.tint !== "mono",
            },
            revealOnHover: {
                type: ControlType.Boolean,
                title: "Reveal",
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Restore original colors on hover",
                hidden: (p: any) => p.tint === "original",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.05,
            },
            padding: { type: ControlType.Padding, title: "Padding" },
            background: { type: ControlType.Color, title: "Background" },
            radius: { type: ControlType.BorderRadius, title: "Radius" },
            border: { type: ControlType.Border, title: "Border" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow" },
        },
    },
    ticker: {
        type: ControlType.Object,
        title: "Ticker",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 400,
                step: 1,
                unit: "px/s",
                description: "0 pauses the ticker",
            },
            hoverSpeed: {
                type: ControlType.Number,
                title: "Hover speed",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                description:
                    "Speed while hovering, as a % of normal. 0 pauses; 100 ignores hover.",
            },
            draggable: {
                type: ControlType.Boolean,
                title: "Drag",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            momentum: {
                type: ControlType.Boolean,
                title: "Momentum",
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (p: any) => !p.draggable,
            },
        },
    },
    edges: {
        type: ControlType.Object,
        title: "Edges",
        controls: {
            overflow: {
                type: ControlType.Enum,
                title: "Overflow",
                options: ["hidden", "visible", "clip", "scroll", "auto"],
                optionTitles: ["Hidden", "Visible", "Clip", "Scroll", "Auto"],
                description:
                    "Hidden is what makes it work as a ticker. Other values expose the full unclipped track — mainly useful for debugging or a deliberate scroll/overflow effect.",
            },
            fade: {
                type: ControlType.Boolean,
                title: "Fade",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            fadeMode: {
                type: ControlType.Enum,
                title: "Fade via",
                options: ["mask", "color"],
                optionTitles: ["Mask", "Color"],
                displaySegmentedControl: true,
                description:
                    "Mask fades to true transparency over any background. Color fades to a solid color you specify.",
                hidden: (p: any) => !p.fade,
            },
            fadeColor: {
                type: ControlType.Color,
                title: "Fade to",
                description: "Match your section background",
                hidden: (p: any) => !p.fade || p.fadeMode !== "color",
            },
            fadeSize: {
                type: ControlType.Number,
                title: "Fade size",
                min: 0,
                max: 1000,
                step: 1,
                unit: "px",
                hidden: (p: any) => !p.fade,
            },
            fadeOffset: {
                type: ControlType.Number,
                title: "Fade inset",
                min: 0,
                max: 500,
                step: 1,
                unit: "px",
                description: "Start the fade further in from each edge",
                hidden: (p: any) => !p.fade,
            },
            steer: {
                type: ControlType.Boolean,
                title: "Steer",
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Scroll toward whichever edge the cursor nears",
            },
            steerZone: {
                type: ControlType.Number,
                title: "Zone",
                min: 20,
                max: 1200,
                step: 5,
                unit: "px",
                hidden: (p: any) => !p.steer,
            },
            steerBoost: {
                type: ControlType.Number,
                title: "Boost",
                min: 1,
                max: 12,
                step: 0.5,
                unit: "x",
                hidden: (p: any) => !p.steer,
            },
        },
    },
    reveal: {
        type: ControlType.Object,
        title: "Reveal",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["none", "entrance", "exit", "both"],
                optionTitles: ["None", "In", "Out", "Both"],
                description:
                    "Logos animate in as they reach the leading edge, out as they leave the trailing edge.",
            },
            zone: {
                type: ControlType.Number,
                title: "Zone",
                min: 10,
                max: 800,
                step: 5,
                unit: "px",
                description: "How far from the edge the reveal spans",
                hidden: (p: any) => p.mode === "none",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 30,
                step: 0.5,
                unit: "px",
                description: "Blur at the edge, sharpening as it moves in",
                hidden: (p: any) => p.mode === "none",
            },
            xOffset: {
                type: ControlType.Number,
                title: "X-offset",
                min: -200,
                max: 200,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.mode === "none",
            },
            yOffset: {
                type: ControlType.Number,
                title: "Y-offset",
                min: -200,
                max: 200,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.mode === "none",
            },
            scaleFrom: {
                type: ControlType.Number,
                title: "Scale from",
                min: 0.2,
                max: 2,
                step: 0.01,
                hidden: (p: any) => p.mode === "none",
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["none", "grow", "lift", "dim"],
                optionTitles: ["None", "Grow", "Lift", "Dim"],
                description:
                    "Dim fades the others and spotlights the hovered logo",
            },
            transition: {
                type: ControlType.Transition,
                title: "Curve",
                hidden: (p: any) => p.effect === "none",
            },
            dimAmount: {
                type: ControlType.Number,
                title: "Dim to",
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => p.effect !== "dim",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        // Description sits on the top-level object control, so it renders at
        // the bottom of the MAIN panel rather than inside the opened group.
        description:
            "Crafted by [Joshua Roberts](https://joshuaroberts.design/) 🖌️",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
            },
            color: { type: ControlType.Color, title: "Color" },
        },
    },
})
